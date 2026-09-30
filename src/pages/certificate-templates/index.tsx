import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, X, Star, Trash2, Pencil, Award, Upload, Loader2 } from 'lucide-react';
import certificatesService, {
  CertificateTemplate, CertificateType, CERTIFICATE_TYPES, CERTIFICATE_TYPE_LABELS,
  STUDENT_MERGE_FIELDS, EXTRA_FIELD_SUGGESTIONS, DEFAULT_BODY_TEMPLATES,
} from '../../services/certificates.service';
import CertificateBodyEditor, { CertificateBodyEditorHandle } from './CertificateBodyEditor';
import { safeParseLocalStorage } from '../../lib/safeParseLocalStorage';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function getAuthHeaders() {
  const token = localStorage.getItem('eldermin_token') || '';
  const schoolSlug = safeParseLocalStorage<{ slug?: string }>('eldermin_institution')?.slug || 'demo-school';
  return { Authorization: `Bearer ${token}`, 'x-school-slug': schoolSlug };
}

// A4 at 300 DPI (print-quality) in each orientation - the size that
// fills the page cleanly via object-fit: cover with the least cropping,
// since the watermark renders full-bleed behind the whole certificate
// regardless of how much text ends up on the page.
const RECOMMENDED_WATERMARK_SIZE: Record<'portrait' | 'landscape', string> = {
  portrait: '2480 × 3508 px (or any image close to a 1 : 1.41 portrait ratio)',
  landscape: '3508 × 2480 px (or any image close to a 1.41 : 1 landscape ratio)',
};

// ─── LOCAL PRIMITIVES (mirrors src/pages/id-card-templates/index.tsx) ──────
function Btn({ children, variant = 'secondary', size = 'sm', onClick, disabled, title }: {
  children: React.ReactNode; variant?: 'primary' | 'secondary' | 'danger'; size?: 'sm' | 'md';
  onClick?: () => void; disabled?: boolean; title?: string;
}) {
  const v = {
    primary: 'bg-[#0C447C] text-white hover:bg-[#0b3d6e] border-[#0C447C]',
    secondary: 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200',
    danger: 'bg-red-600 text-white hover:bg-red-700 border-red-600',
  };
  const s = size === 'md' ? 'px-4 py-2 text-sm' : 'px-3 py-1.5 text-xs';
  return (
    <button onClick={onClick} disabled={disabled} title={title}
      className={`${v[variant]} ${s} border rounded-lg font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed`}>
      {children}
    </button>
  );
}

function Modal({ title, subtitle, onClose, children }: { title: string; subtitle?: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-800">{title}</h2>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"><X size={16} /></button>
        </div>
        <div className="px-6 py-5 overflow-y-auto space-y-4">{children}</div>
      </div>
    </div>
  );
}

function FField({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return <div><label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>{children}{hint && <p className="text-[10px] text-slate-400 mt-1">{hint}</p>}</div>;
}

const fInputCls = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0C447C] focus:border-transparent';
function FInput(props: React.InputHTMLAttributes<HTMLInputElement>) { return <input {...props} className={fInputCls} />; }

const LAYOUT_STYLES: { value: CertificateTemplate['layoutStyle']; label: string }[] = [
  { value: 'formal', label: 'Formal (bordered)' },
  { value: 'classic', label: 'Classic' },
  { value: 'modern', label: 'Modern' },
  { value: 'minimal', label: 'Minimal' },
];

// ─── LIVE PREVIEW — a scaled approximation of the backend's actual HTML
// renderer (certificates.service.ts buildCertificateHtml/certificateCss),
// same "close enough while editing, the real PDF is the source of truth"
// role CardPreview plays for ID card templates. ───────────────────────────
function CertificatePreview({ form }: { form: Partial<CertificateTemplate> }) {
  const primary = form.primaryColor || '#0C447C';
  const accent = form.accentColor || '#F5A623';
  const style = form.layoutStyle || 'formal';
  const orientation = form.orientation || 'portrait';
  const type = (form.certificateType || 'custom') as CertificateType;

  const sample: Record<string, string> = {
    studentName: 'Ayesha Khan', fatherName: 'Imran Khan', motherName: 'Sana Khan', guardianName: 'Imran Khan',
    admissionNo: 'ADM-00138', grNo: 'GR-2201', grade: '8', section: 'A', academicYear: '2025-26',
    dob: '14 May 2011', gender: 'Female', nationality: 'Pakistani', religion: 'Islam',
    admissionDate: '01 Mar 2019', campusName: 'Main Campus', schoolName: 'School Name',
    issueDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
    certificateNumber: 'SAMPLE-0001',
  };
  (EXTRA_FIELD_SUGGESTIONS[type] || []).forEach((f) => { sample[f.key] = `[${f.label}]`; });

  const bodyHtml = (form.bodyTemplate || '').replace(/\{\{\s*(\w+)\s*\}\}/g, (_m, k) => sample[k] ?? '');

  const isLandscape = orientation === 'landscape';
  const width = isLandscape ? '148mm' : '105mm';
  const height = isLandscape ? '105mm' : '148mm'; // half-A4 scale, keeps preview compact

  const borderStyle: React.CSSProperties = style === 'formal'
    ? { border: `1mm double ${accent}`, boxShadow: `inset 0 0 0 0.5mm ${primary}` }
    : style === 'classic' ? { border: `0.5mm solid ${primary}` }
    : style === 'modern' ? { borderTop: `2mm solid ${primary}` }
    : {};

  const titleMap: Record<CertificateType, string> = {
    transfer: 'School Leaving / Transfer Certificate', character: 'Character Certificate',
    bonafide: 'Bonafide Certificate', provisional: 'Provisional Certificate',
    migration: 'Migration Certificate', merit: 'Certificate of Merit',
    participation: 'Certificate of Participation', attendance: 'Certificate of Attendance',
    graduation: 'Certificate of Graduation', custom: form.name || 'Certificate',
  };

  return (
    <div style={{ width, height, background: '#fff', position: 'relative', zIndex: 0, boxSizing: 'border-box', padding: '6mm 7mm', fontFamily: 'Georgia, serif', boxShadow: '0 1px 6px rgba(0,0,0,0.12)', overflow: 'hidden', ...borderStyle }}>
      {form.backgroundImageUrl && (
        <img src={form.backgroundImageUrl} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: form.backgroundImageOpacity ?? 0.06, zIndex: -1 }} />
      )}
      <div style={{ fontSize: '5.5pt', color: '#999', position: 'absolute', top: '3mm', left: '4mm' }}>Date: {sample.issueDate}</div>
      <div style={{ fontSize: '5.5pt', color: '#999', position: 'absolute', top: '3mm', right: '4mm' }}>No: {sample.certificateNumber}</div>
      <div style={{ textAlign: 'center', marginTop: '2mm' }}>
        <div style={{ fontSize: '9pt', fontWeight: 'bold', color: primary }}>{sample.schoolName}</div>
        <div style={{ fontSize: '6pt', color: '#666', marginTop: '0.5mm' }}>{sample.campusName}</div>
      </div>
      <hr style={{ border: 'none', borderTop: `0.4mm solid ${accent}`, width: '18mm', margin: '2mm auto' }} />
      <div style={{ textAlign: 'center', fontSize: '8pt', fontWeight: 'bold', textTransform: 'uppercase', color: primary, margin: '2mm 0 3mm' }}>{titleMap[type]}</div>
      <div style={{ fontSize: '5.5pt', lineHeight: 1.6, color: '#333', textAlign: style === 'formal' ? 'center' : 'justify' }}
        dangerouslySetInnerHTML={{ __html: bodyHtml.slice(0, 600) }} />
      <div style={{ position: 'absolute', bottom: '10mm', left: 0, right: 0, display: 'flex', justifyContent: 'space-around', padding: '0 6mm' }}>
        {(form.signatories || []).map((s, i) => (
          <div key={i} style={{ textAlign: 'center', width: '20mm' }}>
            <div style={{ borderTop: '0.2mm solid #444', marginBottom: '1mm' }} />
            <div style={{ fontSize: '5pt', color: '#444', fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>
      {form.showQrCode && (
        <div style={{ position: 'absolute', bottom: '3mm', left: '4mm', width: '8mm', height: '8mm', background: '#f3f4f6', border: '0.2mm solid #ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3.5pt', color: '#999' }}>QR</div>
      )}
    </div>
  );
}

const DEFAULT_FORM = (certificateType: CertificateType): Partial<CertificateTemplate> => ({
  name: '', certificateType,
  orientation: (['merit', 'participation'].includes(certificateType) ? 'landscape' : 'portrait'),
  layoutStyle: (['merit', 'participation', 'graduation'].includes(certificateType) ? 'formal' : 'classic'),
  primaryColor: '#0C447C', accentColor: '#F5A623',
  backgroundImageUrl: '', backgroundImageOpacity: 0.06,
  showBorder: true, showQrCode: true, showSeal: false,
  bodyTemplate: DEFAULT_BODY_TEMPLATES[certificateType],
  signatories: [{ label: 'Class Teacher' }, { label: 'Principal' }],
  footerNote: '',
});

function TemplateModal({ certificateType, template, onClose }: { certificateType: CertificateType; template?: CertificateTemplate; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<Partial<CertificateTemplate>>(template ? { ...template } : DEFAULT_FORM(certificateType));
  const isEdit = !!template;
  const bodyEditorRef = useRef<CertificateBodyEditorHandle | null>(null);
  const [uploadingWatermark, setUploadingWatermark] = useState(false);
  const watermarkInputRef = useRef<HTMLInputElement>(null);

  async function uploadWatermark(file: File) {
    setUploadingWatermark(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_BASE}/api/v1/upload/single/certificate-watermarks`, {
        method: 'POST', headers: getAuthHeaders(), body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      const body = await res.json();
      setForm((p) => ({ ...p, backgroundImageUrl: body.data.url }));
    } catch {
      toast.error('Watermark upload failed');
    } finally {
      setUploadingWatermark(false);
    }
  }

  const saveMut = useMutation({
    mutationFn: () => isEdit ? certificatesService.updateTemplate(template!._id, form) : certificatesService.createTemplate(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['certificate-templates'] });
      toast.success(isEdit ? 'Template updated' : 'Template created');
      onClose();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to save template'),
  });

  function handleTypeChange(t: CertificateType) {
    setForm((prev) => {
      const next: Partial<CertificateTemplate> = { ...prev, certificateType: t };
      if (!isEdit) {
        next.bodyTemplate = DEFAULT_BODY_TEMPLATES[t];
        next.orientation = ['merit', 'participation'].includes(t) ? 'landscape' : 'portrait';
        next.layoutStyle = ['merit', 'participation', 'graduation'].includes(t) ? 'formal' : 'classic';
      }
      return next;
    });
  }

  function insertToken(token: string) {
    bodyEditorRef.current?.insertToken(token);
  }

  function updateSignatory(i: number, label: string) {
    setForm((p) => {
      const list = [...(p.signatories || [])];
      list[i] = { label };
      return { ...p, signatories: list };
    });
  }
  function addSignatory() {
    setForm((p) => ({ ...p, signatories: [...(p.signatories || []), { label: '' }] }));
  }
  function removeSignatory(i: number) {
    setForm((p) => ({ ...p, signatories: (p.signatories || []).filter((_, idx) => idx !== i) }));
  }

  function save() {
    if (!form.name?.trim()) { toast.error('Template name is required'); return; }
    if (!form.bodyTemplate?.trim()) { toast.error('Certificate body is required'); return; }
    saveMut.mutate();
  }

  const extraFields = EXTRA_FIELD_SUGGESTIONS[(form.certificateType || 'custom') as CertificateType] || [];

  return (
    <Modal title={isEdit ? 'Edit Certificate Template' : 'New Certificate Template'}
      subtitle="A4 document - printed one per student from Student 360 → Certificates"
      onClose={onClose}>
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <FField label="Template Name">
            <FInput value={form.name || ''} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Standard Transfer Certificate" />
          </FField>
          <FField label="Certificate Type">
            <select value={form.certificateType} onChange={(e) => handleTypeChange(e.target.value as CertificateType)} className={fInputCls}>
              {CERTIFICATE_TYPES.map((t) => <option key={t} value={t}>{CERTIFICATE_TYPE_LABELS[t]}</option>)}
            </select>
          </FField>
          <div className="grid grid-cols-2 gap-3">
            <FField label="Orientation">
              <div className="grid grid-cols-2 gap-2">
                {(['portrait', 'landscape'] as const).map((o) => (
                  <button key={o} type="button" onClick={() => setForm((p) => ({ ...p, orientation: o }))}
                    className={`px-2 py-2 text-xs rounded-lg border capitalize ${form.orientation === o ? 'bg-[#0C447C] text-white border-[#0C447C]' : 'bg-white text-slate-600 border-slate-200'}`}>
                    {o}
                  </button>
                ))}
              </div>
            </FField>
            <FField label="Layout Style">
              <select value={form.layoutStyle} onChange={(e) => setForm((p) => ({ ...p, layoutStyle: e.target.value as any }))} className={fInputCls}>
                {LAYOUT_STYLES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </FField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FField label="Primary Color">
              <input type="color" value={form.primaryColor || '#0C447C'} onChange={(e) => setForm((p) => ({ ...p, primaryColor: e.target.value }))} className="w-full h-9 rounded-lg border border-slate-200 cursor-pointer" />
            </FField>
            <FField label="Accent Color">
              <input type="color" value={form.accentColor || '#F5A623'} onChange={(e) => setForm((p) => ({ ...p, accentColor: e.target.value }))} className="w-full h-9 rounded-lg border border-slate-200 cursor-pointer" />
            </FField>
          </div>

          <FField label="Watermark Image (optional)">
            <input ref={watermarkInputRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadWatermark(f); e.target.value = ''; }} />
            {form.backgroundImageUrl ? (
              <div className="flex items-center gap-2 border border-slate-200 rounded-lg p-2">
                <img src={form.backgroundImageUrl} alt="Watermark" className="w-10 h-10 object-cover rounded" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-slate-500 mb-1">Faint, full-bleed background image behind the whole certificate</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 w-16">Opacity</span>
                    <input type="range" min={0} max={0.3} step={0.01} value={form.backgroundImageOpacity ?? 0.06}
                      onChange={(e) => setForm((p) => ({ ...p, backgroundImageOpacity: Number(e.target.value) }))}
                      className="flex-1 accent-[#0C447C]" />
                    <span className="text-[10px] text-slate-400 w-8 text-right">{Math.round((form.backgroundImageOpacity ?? 0.06) * 100)}%</span>
                  </div>
                </div>
                <button type="button" onClick={() => setForm((p) => ({ ...p, backgroundImageUrl: '' }))}
                  className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"><X size={14} /></button>
              </div>
            ) : (
              <button type="button" onClick={() => watermarkInputRef.current?.click()} disabled={uploadingWatermark}
                className="w-full flex items-center justify-center gap-2 border border-dashed border-slate-300 rounded-lg py-2.5 text-xs text-slate-500 hover:border-[#0C447C] hover:text-[#0C447C] disabled:opacity-50">
                {uploadingWatermark ? <><Loader2 size={13} className="animate-spin" /> Uploading…</> : <><Upload size={13} /> Upload watermark image</>}
              </button>
            )}
            <p className="text-[10px] text-slate-400 mt-1.5">
              Recommended size for this template's <strong>{form.orientation || 'portrait'}</strong> A4 page: {RECOMMENDED_WATERMARK_SIZE[(form.orientation || 'portrait') as 'portrait' | 'landscape']}.
              A different aspect ratio still works but crops to fill the page - keep the subject centered so the edges are safe to lose.
              Switching orientation above doesn't resize an already-uploaded image, so re-check the fit (or re-upload) if you change it afterwards.
            </p>
          </FField>

          <FField label="Certificate Body" hint="Use the toolbar to format text, or click a field below to insert it at the cursor.">
            <CertificateBodyEditor ref={bodyEditorRef} value={form.bodyTemplate || ''}
              onChange={(html) => setForm((p) => ({ ...p, bodyTemplate: html }))} />
          </FField>
          <div>
            <p className="text-[10px] font-semibold text-slate-500 uppercase mb-1.5">Student Fields</p>
            <div className="flex flex-wrap gap-1 mb-2">
              {STUDENT_MERGE_FIELDS.map((f) => (
                <button key={f.key} type="button" onClick={() => insertToken(f.key)}
                  className="px-1.5 py-0.5 text-[10px] bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100">
                  {f.label}
                </button>
              ))}
            </div>
            {extraFields.length > 0 && (
              <>
                <p className="text-[10px] font-semibold text-slate-500 uppercase mb-1.5">Filled In at Print Time</p>
                <div className="flex flex-wrap gap-1">
                  {extraFields.map((f) => (
                    <button key={f.key} type="button" onClick={() => insertToken(f.key)}
                      className="px-1.5 py-0.5 text-[10px] bg-amber-50 text-amber-700 border border-amber-200 rounded hover:bg-amber-100">
                      {f.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <FField label="Signatories">
            <div className="space-y-1.5">
              {(form.signatories || []).map((s, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <FInput value={s.label} onChange={(e) => updateSignatory(i, e.target.value)} placeholder="e.g. Principal" />
                  <button type="button" onClick={() => removeSignatory(i)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg shrink-0"><X size={14} /></button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addSignatory} className="mt-1.5 text-[11px] font-semibold text-[#0C447C] hover:underline">+ Add signatory</button>
          </FField>

          <FField label="Footer Note (optional)">
            <FInput value={form.footerNote || ''} onChange={(e) => setForm((p) => ({ ...p, footerNote: e.target.value }))} placeholder="e.g. Valid only with the official school stamp." />
          </FField>

          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
              <input type="checkbox" checked={!!form.showBorder} onChange={(e) => setForm((p) => ({ ...p, showBorder: e.target.checked }))} />
              Decorative border
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
              <input type="checkbox" checked={!!form.showQrCode} onChange={(e) => setForm((p) => ({ ...p, showQrCode: e.target.checked }))} />
              QR verification code
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
              <input type="checkbox" checked={!!form.showSeal} onChange={(e) => setForm((p) => ({ ...p, showSeal: e.target.checked }))} />
              Official seal / stamp image
            </label>
            {form.showSeal && (
              <FInput value={form.sealImageUrl || ''} onChange={(e) => setForm((p) => ({ ...p, sealImageUrl: e.target.value }))} placeholder="Seal image URL" />
            )}
          </div>
        </div>
        <div className="flex flex-col items-center justify-start pt-6">
          <p className="text-[10px] font-semibold text-slate-400 uppercase mb-2">Live Preview</p>
          <CertificatePreview form={form} />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 mt-2">
        <Btn variant="secondary" size="md" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" size="md" onClick={save} disabled={saveMut.isPending}>{saveMut.isPending ? 'Saving…' : 'Save Template'}</Btn>
      </div>
    </Modal>
  );
}

export default function CertificateTemplatesPage() {
  const [filterType, setFilterType] = useState<CertificateType | ''>('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<CertificateTemplate | undefined>(undefined);
  const [newType, setNewType] = useState<CertificateType>('transfer');
  const qc = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['certificate-templates', filterType],
    queryFn: () => certificatesService.listTemplates(filterType || undefined),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => certificatesService.deleteTemplate(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['certificate-templates'] }); toast.success('Template deleted'); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to delete template'),
  });
  const setDefaultMut = useMutation({
    mutationFn: (id: string) => certificatesService.setDefaultTemplate(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['certificate-templates'] }); toast.success('Default template updated'); },
  });

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Award size={20} className="text-[#0C447C]" /> Certificate Templates</h1>
          <p className="text-xs text-slate-400 mt-0.5">Design official student certificates — generated from Student 360 → Certificates</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={newType} onChange={(e) => setNewType(e.target.value as CertificateType)}
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white">
            {CERTIFICATE_TYPES.map((t) => <option key={t} value={t}>{CERTIFICATE_TYPE_LABELS[t]}</option>)}
          </select>
          <Btn variant="primary" size="md" onClick={() => { setEditing(undefined); setShowModal(true); }}><Plus size={15} /> New Template</Btn>
        </div>
      </div>

      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit flex-wrap">
        <button onClick={() => setFilterType('')}
          className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${filterType === '' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
          All Types
        </button>
        {CERTIFICATE_TYPES.map((t) => (
          <button key={t} onClick={() => setFilterType(t)}
            className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors whitespace-nowrap ${filterType === t ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {CERTIFICATE_TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-400 py-10 text-center">Loading templates…</p>
      ) : templates.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 p-12 text-center">
          <Award size={32} className="mx-auto text-slate-300 mb-3" />
          <p className="text-sm font-semibold text-slate-600">No certificate templates yet</p>
          <p className="text-xs text-slate-400 mt-1">Create one to start issuing certificates to students.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {templates.map((t) => (
            <div key={t._id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{t.name}</p>
                  <p className="text-[10px] text-slate-400">{CERTIFICATE_TYPE_LABELS[t.certificateType]}</p>
                </div>
                {t.isDefault && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-medium bg-[#0C447C] text-white border-[#0C447C]"><Star size={10} /> Default</span>}
              </div>
              <div className="flex justify-center">
                <div style={{ transform: 'scale(0.62)', transformOrigin: 'center', margin: '-14mm 0' }}>
                  <CertificatePreview form={t} />
                </div>
              </div>
              <div className="flex gap-1.5">
                <Btn onClick={() => { setEditing(t); setShowModal(true); }}><Pencil size={12} /> Edit</Btn>
                {!t.isDefault && <Btn onClick={() => setDefaultMut.mutate(t._id)}><Star size={12} /> Set Default</Btn>}
                {!t.isDefault && (
                  <Btn variant="danger" onClick={() => { if (window.confirm(`Delete "${t.name}"?`)) deleteMut.mutate(t._id); }}>
                    <Trash2 size={12} />
                  </Btn>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && <TemplateModal certificateType={editing?.certificateType || newType} template={editing} onClose={() => setShowModal(false)} />}
    </div>
  );
}
