import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { X, Award, History } from 'lucide-react';
import certificatesService, {
  CertificateType, CERTIFICATE_TYPES, CERTIFICATE_TYPE_LABELS, EXTRA_FIELD_SUGGESTIONS,
} from '../../services/certificates.service';

interface CertificateModalProps {
  studentIds: string[];
  studentName?: string; // shown in the header when generating for a single student (Student 360's common case)
  onClose: () => void;
}

const TODAY = new Date().toISOString().split('T')[0];

export default function CertificateModal({ studentIds, studentName, onClose }: CertificateModalProps) {
  const [certificateType, setCertificateType] = useState<CertificateType>('bonafide');
  const [templateId, setTemplateId] = useState('');
  const [extraFields, setExtraFields] = useState<Record<string, string>>({});
  const [issueDate, setIssueDate] = useState(TODAY);
  const [showHistory, setShowHistory] = useState(false);

  const { data: templates = [] } = useQuery({
    queryKey: ['certificate-templates', certificateType],
    queryFn: () => certificatesService.listTemplates(certificateType),
  });
  const effectiveTemplateId = templateId || templates.find((t) => t.isDefault)?._id || templates[0]?._id || '';
  const selectedTemplate = templates.find((t) => t._id === effectiveTemplateId);

  const { data: history = [] } = useQuery({
    queryKey: ['certificates-issued', studentIds[0]],
    queryFn: () => certificatesService.getIssuedForStudent(studentIds[0]),
    enabled: studentIds.length === 1,
  });

  const extraFieldDefs = EXTRA_FIELD_SUGGESTIONS[certificateType] || [];

  const generateMut = useMutation({
    mutationFn: () => certificatesService.generate(
      { templateId: effectiveTemplateId, studentIds, extraFields, issueDate },
      studentName ? `${studentName.replace(/\s+/g, '-')}-${certificateType}` : `certificates-${certificateType}`,
    ),
    onSuccess: () => { toast.success('Certificate generated'); onClose(); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to generate certificate'),
  });

  function handleGenerate() {
    if (!effectiveTemplateId) { toast.error('No certificate template available for this type - create one first under Certificate Templates.'); return; }
    const missing = extraFieldDefs.filter((f) => !extraFields[f.key]?.trim());
    if (missing.length > 0) {
      toast.error(`Please fill in: ${missing.map((f) => f.label).join(', ')}`);
      return;
    }
    generateMut.mutate();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-[#0C447C] rounded-t-2xl shrink-0">
          <div>
            <h2 className="font-bold text-white text-sm flex items-center gap-1.5"><Award size={15} /> Generate Certificate</h2>
            <p className="text-blue-200 text-xs mt-0.5">{studentName || `${studentIds.length} student${studentIds.length !== 1 ? 's' : ''}`}</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-2">Certificate Type</label>
            <select value={certificateType} onChange={(e) => { setCertificateType(e.target.value as CertificateType); setTemplateId(''); setExtraFields({}); }}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white">
              {CERTIFICATE_TYPES.map((t) => <option key={t} value={t}>{CERTIFICATE_TYPE_LABELS[t]}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-2">Template</label>
            {templates.length === 0 ? (
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                No {CERTIFICATE_TYPE_LABELS[certificateType].toLowerCase()} template exists yet. Go to <strong>Certificate Templates</strong> to create one first.
              </p>
            ) : (
              <select value={effectiveTemplateId} onChange={(e) => setTemplateId(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white">
                {templates.map((t) => <option key={t._id} value={t._id}>{t.name}{t.isDefault ? ' (Default)' : ''}</option>)}
              </select>
            )}
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-2">Issue Date</label>
            <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
          </div>

          {extraFieldDefs.length > 0 && (
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-2">
                {CERTIFICATE_TYPE_LABELS[certificateType]} Details
              </label>
              <div className="space-y-2">
                {extraFieldDefs.map((f) => (
                  <div key={f.key}>
                    <label className="text-[11px] text-slate-500 block mb-1">{f.label}</label>
                    <input value={extraFields[f.key] || ''} onChange={(e) => setExtraFields((p) => ({ ...p, [f.key]: e.target.value }))}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0C447C]" />
                  </div>
                ))}
              </div>
              {studentIds.length > 1 && (
                <p className="text-[10px] text-slate-400 mt-1.5">These details apply to all {studentIds.length} selected students - generate one at a time for different values per student.</p>
              )}
            </div>
          )}

          {studentIds.length === 1 && history.length > 0 && (
            <div>
              <button type="button" onClick={() => setShowHistory((v) => !v)}
                className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 hover:text-slate-700">
                <History size={12} /> {showHistory ? 'Hide' : 'Show'} previously issued ({history.length})
              </button>
              {showHistory && (
                <div className="mt-2 space-y-1.5 max-h-32 overflow-y-auto border border-slate-100 rounded-lg p-2">
                  {history.map((h) => (
                    <div key={h._id} className="text-[11px] flex items-center justify-between bg-slate-50 rounded-lg px-2 py-1.5">
                      <span className="text-slate-600">{CERTIFICATE_TYPE_LABELS[h.certificateType]} — {h.certificateNumber}</span>
                      <span className="text-slate-400">{new Date(h.issuedAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-100 shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-xs border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium">Cancel</button>
          <button onClick={handleGenerate} disabled={generateMut.isPending || templates.length === 0}
            className="px-4 py-2 text-xs bg-[#0C447C] text-white rounded-lg hover:bg-[#0b3d6e] font-medium disabled:opacity-50">
            {generateMut.isPending ? 'Generating…' : 'Generate PDF'}
          </button>
        </div>
      </div>
    </div>
  );
}
