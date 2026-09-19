import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, X, Star, Trash2, Pencil, IdCard, GraduationCap, Briefcase } from 'lucide-react';
import idCardsService, { IdCardTemplate } from '../../services/id-cards.service';

// ─── LOCAL PRIMITIVES (mirrors src/pages/report-templates/index.tsx) ───────
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
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
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

function FField({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>{children}</div>;
}

const fInputCls = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0C447C] focus:border-transparent';
function FInput(props: React.InputHTMLAttributes<HTMLInputElement>) { return <input {...props} className={fInputCls} />; }

const LAYOUT_STYLES: { value: IdCardTemplate['layoutStyle']; label: string }[] = [
  { value: 'classic', label: 'Classic' },
  { value: 'modern', label: 'Modern' },
  { value: 'minimal', label: 'Minimal' },
];

const FIELD_OPTIONS: Record<'student' | 'staff', { key: string; label: string }[]> = {
  student: [
    { key: 'dob', label: 'Date of Birth' },
    { key: 'bloodGroup', label: 'Blood Group' },
    { key: 'address', label: 'Address (back)' },
    { key: 'guardianContact', label: "Guardian Contact (back)" },
  ],
  staff: [
    { key: 'phone', label: 'Phone' },
    { key: 'bloodGroup', label: 'Blood Group' },
    { key: 'joiningDate', label: 'Joining Date' },
  ],
};

// ─── LIVE CARD PREVIEW — mirrors the backend's HTML card renderer
// (id-cards.service.ts buildCardFace/cardCss) closely enough to give a
// true sense of the printed result, without round-tripping a PDF. ───────
function CardPreview({ entityType, form }: { entityType: 'student' | 'staff'; form: Partial<IdCardTemplate> }) {
  const primary = form.primaryColor || '#0C447C';
  const accent = form.accentColor || '#F5A623';
  const style = form.layoutStyle || 'classic';
  const sampleName = entityType === 'student' ? 'Ayesha Khan' : 'Muhammad Bilal';
  const sampleSub = entityType === 'student' ? 'Grade 5 - A' : 'Head of Department · Science';
  const sampleId = entityType === 'student' ? 'GR #: 00123' : 'Employee ID: EMP-0045';
  const fields = (form.showFields || []).filter((f) => !['address', 'guardianContact'].includes(f));

  const photoBox = (size: string, radius = '2mm') => (
    <div style={{ width: size, height: size, borderRadius: radius, background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontWeight: 'bold', flexShrink: 0 }}>
      {entityType === 'student' ? 'AK' : 'MB'}
    </div>
  );

  return (
    <div style={{ width: '85.6mm', height: '54mm', border: '1px solid #ddd', borderRadius: '3mm', overflow: 'hidden', background: '#fff', fontFamily: 'Arial, sans-serif', position: 'relative', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
      {style === 'modern' && (
        <>
          <div style={{ height: '14mm', background: `linear-gradient(135deg, ${primary}, ${accent})`, display: 'flex', alignItems: 'center', padding: '0 3mm' }}>
            <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '8.5pt' }}>School Name</span>
          </div>
          <div style={{ position: 'absolute', top: '7mm', left: '3.5mm' }}>{photoBox('18mm', '50%')}</div>
          <div style={{ padding: '2mm 3mm 2mm 24mm' }}>
            <p style={{ fontWeight: 'bold', fontSize: '10pt', margin: 0 }}>{sampleName}</p>
            <p style={{ fontSize: '7.5pt', color: '#444', margin: '0.5mm 0 0' }}>{sampleSub}</p>
            <p style={{ fontSize: '6.5pt', margin: '0.8mm 0 0' }}>{sampleId}</p>
            {fields.map((f) => <p key={f} style={{ fontSize: '6.5pt', margin: '0.8mm 0 0', color: '#333' }}>{FIELD_OPTIONS[entityType].find((o) => o.key === f)?.label}: —</p>)}
          </div>
        </>
      )}
      {style === 'minimal' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2mm', padding: '2.5mm 3mm 1mm', borderBottom: `0.4mm solid ${primary}` }}>
            <span style={{ color: primary, fontWeight: 'bold', fontSize: '7.5pt' }}>School Name</span>
          </div>
          <div style={{ display: 'flex', gap: '2.5mm', padding: '2mm 3mm' }}>
            {photoBox('16mm')}
            <div>
              <p style={{ fontWeight: 'bold', fontSize: '9pt', margin: 0 }}>{sampleName}</p>
              <p style={{ fontSize: '7pt', color: primary, margin: '0.5mm 0 0' }}>{sampleSub}</p>
              <p style={{ fontSize: '6.5pt', margin: '0.7mm 0 0' }}>{sampleId}</p>
              {fields.map((f) => <p key={f} style={{ fontSize: '6.5pt', margin: '0.7mm 0 0', color: '#333' }}>{FIELD_OPTIONS[entityType].find((o) => o.key === f)?.label}: —</p>)}
            </div>
          </div>
        </>
      )}
      {style === 'classic' && (
        <>
          <div style={{ height: '10mm', background: primary, display: 'flex', alignItems: 'center', padding: '0 3mm' }}>
            <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '8pt' }}>School Name</span>
          </div>
          <div style={{ display: 'flex', gap: '2.5mm', padding: '2.5mm 3mm' }}>
            {photoBox('17mm')}
            <div>
              <p style={{ fontWeight: 'bold', fontSize: '9.5pt', margin: 0 }}>{sampleName}</p>
              <p style={{ fontSize: '7.5pt', color: primary, margin: '0.5mm 0 0' }}>{sampleSub}</p>
              <p style={{ fontSize: '6.5pt', margin: '0.8mm 0 0' }}>{sampleId}</p>
              {fields.map((f) => <p key={f} style={{ fontSize: '6.5pt', margin: '0.8mm 0 0', color: '#333' }}>{FIELD_OPTIONS[entityType].find((o) => o.key === f)?.label}: —</p>)}
            </div>
          </div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '1.5mm', background: accent }} />
        </>
      )}
      {form.showQrCode && <div style={{ position: 'absolute', bottom: '2mm', right: '2.5mm', width: '10mm', height: '10mm', background: '#f3f4f6', border: '1px solid #ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '5pt', color: '#999' }}>QR</div>}
    </div>
  );
}

const DEFAULT_FORM = (entityType: 'student' | 'staff'): Partial<IdCardTemplate> => ({
  entityType, name: '', layoutStyle: 'classic', primaryColor: '#0C447C', accentColor: '#F5A623',
  showFields: [], showQrCode: true, showBarcode: false, showSignatureLine: true, validityText: '',
});

function TemplateModal({ entityType, template, onClose }: { entityType: 'student' | 'staff'; template?: IdCardTemplate; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<Partial<IdCardTemplate>>(template ? { ...template } : DEFAULT_FORM(entityType));
  const isEdit = !!template;

  const saveMut = useMutation({
    mutationFn: () => isEdit ? idCardsService.updateTemplate(template!._id, form) : idCardsService.createTemplate(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['id-card-templates'] });
      toast.success(isEdit ? 'Template updated' : 'Template created');
      onClose();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to save template'),
  });

  function toggleField(key: string) {
    setForm((prev) => {
      const current = prev.showFields || [];
      return { ...prev, showFields: current.includes(key) ? current.filter((f) => f !== key) : [...current, key] };
    });
  }

  function save() {
    if (!form.name?.trim()) { toast.error('Template name is required'); return; }
    saveMut.mutate();
  }

  return (
    <Modal title={isEdit ? 'Edit ID Card Template' : `New ${entityType === 'student' ? 'Student' : 'Staff'} ID Card Template`}
      subtitle="CR80 card size (85.6 x 54mm, the real, standard ID card size) - printed 8-up on an A4 sheet with cut guides"
      onClose={onClose}>
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <FField label="Template Name">
            <FInput value={form.name || ''} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Primary School ID Card" />
          </FField>
          <FField label="Layout Style">
            <div className="grid grid-cols-3 gap-2">
              {LAYOUT_STYLES.map((s) => (
                <button key={s.value} type="button" onClick={() => setForm((p) => ({ ...p, layoutStyle: s.value }))}
                  className={`px-2 py-2 text-xs rounded-lg border ${form.layoutStyle === s.value ? 'bg-[#0C447C] text-white border-[#0C447C]' : 'bg-white text-slate-600 border-slate-200'}`}>
                  {s.label}
                </button>
              ))}
            </div>
          </FField>
          <div className="grid grid-cols-2 gap-3">
            <FField label="Primary Color">
              <input type="color" value={form.primaryColor || '#0C447C'} onChange={(e) => setForm((p) => ({ ...p, primaryColor: e.target.value }))} className="w-full h-9 rounded-lg border border-slate-200 cursor-pointer" />
            </FField>
            <FField label="Accent Color">
              <input type="color" value={form.accentColor || '#F5A623'} onChange={(e) => setForm((p) => ({ ...p, accentColor: e.target.value }))} className="w-full h-9 rounded-lg border border-slate-200 cursor-pointer" />
            </FField>
          </div>
          <FField label="Fields to Print">
            <div className="space-y-1.5 border border-slate-100 rounded-lg p-2.5">
              {FIELD_OPTIONS[entityType].map((f) => (
                <label key={f.key} className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                  <input type="checkbox" checked={(form.showFields || []).includes(f.key)} onChange={() => toggleField(f.key)} />
                  {f.label}
                </label>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Fields marked "(back)" only print when a back side is requested at print time.</p>
          </FField>
          <FField label="Validity Text (optional, shown on back)">
            <FInput value={form.validityText || ''} onChange={(e) => setForm((p) => ({ ...p, validityText: e.target.value }))} placeholder="e.g. Valid for Academic Year 2026-27" />
          </FField>
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
              <input type="checkbox" checked={!!form.showQrCode} onChange={(e) => setForm((p) => ({ ...p, showQrCode: e.target.checked }))} />
              QR code (identity verification)
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
              <input type="checkbox" checked={!!form.showBarcode} onChange={(e) => setForm((p) => ({ ...p, showBarcode: e.target.checked }))} />
              Barcode (Code128, for existing scanner hardware)
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
              <input type="checkbox" checked={!!form.showSignatureLine} onChange={(e) => setForm((p) => ({ ...p, showSignatureLine: e.target.checked }))} />
              Authorized signatory line (back)
            </label>
          </div>
        </div>
        <div className="flex flex-col items-center justify-start pt-6">
          <p className="text-[10px] font-semibold text-slate-400 uppercase mb-2">Live Preview — Front</p>
          <CardPreview entityType={entityType} form={form} />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 mt-2">
        <Btn variant="secondary" size="md" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" size="md" onClick={save} disabled={saveMut.isPending}>{saveMut.isPending ? 'Saving…' : 'Save Template'}</Btn>
      </div>
    </Modal>
  );
}

export default function IdCardTemplatesPage() {
  const [entityType, setEntityType] = useState<'student' | 'staff'>('student');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<IdCardTemplate | undefined>(undefined);
  const qc = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['id-card-templates', entityType],
    queryFn: () => idCardsService.listTemplates(entityType),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => idCardsService.deleteTemplate(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['id-card-templates'] }); toast.success('Template deleted'); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to delete template'),
  });
  const setDefaultMut = useMutation({
    mutationFn: (id: string) => idCardsService.setDefaultTemplate(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['id-card-templates'] }); toast.success('Default template updated'); },
  });

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2"><IdCard size={20} className="text-[#0C447C]" /> ID Card Templates</h1>
          <p className="text-xs text-slate-400 mt-0.5">Design official, print-ready student and staff ID cards — printed from Student Directory / HR Staff Directory → ID Cards</p>
        </div>
        <Btn variant="primary" size="md" onClick={() => { setEditing(undefined); setShowModal(true); }}><Plus size={15} /> New Template</Btn>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        {(['student', 'staff'] as const).map((t) => (
          <button key={t} onClick={() => setEntityType(t)}
            className={`px-4 py-2 text-sm font-medium flex items-center gap-1.5 border-b-2 -mb-px ${entityType === t ? 'border-[#0C447C] text-[#0C447C]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            {t === 'student' ? <GraduationCap size={14} /> : <Briefcase size={14} />}
            {t === 'student' ? 'Student Cards' : 'Staff Cards'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-400 py-10 text-center">Loading templates…</p>
      ) : templates.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 p-12 text-center">
          <IdCard size={32} className="mx-auto text-slate-300 mb-3" />
          <p className="text-sm font-semibold text-slate-600">No {entityType} ID card templates yet</p>
          <p className="text-xs text-slate-400 mt-1">Create one to start printing {entityType === 'student' ? 'student' : 'staff'} ID cards.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {templates.map((t) => (
            <div key={t._id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-800">{t.name}</p>
                {t.isDefault && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-medium bg-[#0C447C] text-white border-[#0C447C]"><Star size={10} /> Default</span>}
              </div>
              <div className="flex justify-center">
                <div style={{ transform: 'scale(0.85)', transformOrigin: 'center' }}>
                  <CardPreview entityType={entityType} form={t} />
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

      {showModal && <TemplateModal entityType={entityType} template={editing} onClose={() => setShowModal(false)} />}
    </div>
  );
}
