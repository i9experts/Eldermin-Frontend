import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { X, IdCard, Search } from 'lucide-react';
import idCardsService from '../../services/id-cards.service';
import studentsService from '../../services/students.service';
import hrService from '../../services/hr.service';

interface IdCardModalProps {
  entityType: 'student' | 'staff';
  // Pre-selected IDs from the caller's own directory table selection
  // (Student Directory's checkbox column). When omitted or empty, this
  // modal falls back to its own searchable picker - used for Staff, whose
  // directory table doesn't currently track row selection the same way.
  preselectedIds?: string[];
  onClose: () => void;
}

export default function IdCardModal({ entityType, preselectedIds, onClose }: IdCardModalProps) {
  const usingPreselected = !!preselectedIds && preselectedIds.length > 0;
  const [search, setSearch] = useState('');
  const [pickedIds, setPickedIds] = useState<Set<string>>(new Set());
  const [templateId, setTemplateId] = useState('');
  const [includeBack, setIncludeBack] = useState(true);

  const { data: templates = [] } = useQuery({
    queryKey: ['id-card-templates', entityType],
    queryFn: () => idCardsService.listTemplates(entityType),
  });
  const effectiveTemplateId = templateId || templates.find((t) => t.isDefault)?._id || templates[0]?._id || '';
  const selectedTemplate = templates.find((t) => t._id === effectiveTemplateId);

  const { data: pickerData } = useQuery({
    queryKey: ['id-card-picker', entityType, search],
    queryFn: () => entityType === 'staff' ? hrService.getStaff() : studentsService.getStudents({ search: search || undefined }),
    enabled: !usingPreselected,
  });
  const pickerList: any[] = usingPreselected ? [] : (Array.isArray(pickerData) ? pickerData : pickerData?.data || []);

  function togglePick(id: string) {
    setPickedIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }

  const finalIds = usingPreselected ? preselectedIds! : Array.from(pickedIds);

  const generateMut = useMutation({
    mutationFn: () => idCardsService.generate({ entityType, templateId: effectiveTemplateId || undefined, ids: finalIds, includeBack }),
    onSuccess: () => { toast.success('ID cards generated'); onClose(); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to generate ID cards'),
  });

  function handleGenerate() {
    if (finalIds.length === 0) { toast.error(`Select at least one ${entityType}`); return; }
    if (templates.length === 0) { toast.error(`No ${entityType} ID card template exists yet - create one under ID Card Templates first.`); return; }
    generateMut.mutate();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-[#0C447C] rounded-t-2xl shrink-0">
          <div>
            <h2 className="font-bold text-white text-sm flex items-center gap-1.5"><IdCard size={15} /> Print ID Cards</h2>
            <p className="text-blue-200 text-xs mt-0.5">{entityType === 'student' ? 'Students' : 'Staff'} — CR80 cards, 8 per A4 sheet</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-2">Template</label>
            {templates.length === 0 ? (
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                No {entityType} ID card template exists yet. Go to <strong>ID Card Templates</strong> to create one first.
              </p>
            ) : (
              <select value={effectiveTemplateId} onChange={(e) => setTemplateId(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white">
                {templates.map((t) => <option key={t._id} value={t._id}>{t.name}{t.isDefault ? ' (Default)' : ''}</option>)}
              </select>
            )}
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
            <input type="checkbox" checked={includeBack} onChange={(e) => setIncludeBack(e.target.checked)} />
            Include back side (address / guardian contact / signature line, if configured on the template)
          </label>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-2">
              {usingPreselected ? `Selected ${entityType === 'student' ? 'Students' : 'Staff'}` : `Select ${entityType === 'student' ? 'Students' : 'Staff'}`}
            </label>
            {usingPreselected ? (
              <p className="text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2">{preselectedIds!.length} selected from the directory table.</p>
            ) : (
              <>
                <div className="relative mb-2">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…"
                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]" />
                </div>
                <div className="max-h-48 overflow-y-auto border border-slate-100 rounded-xl p-2 space-y-1">
                  {pickerList.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">No {entityType}s found.</p>
                  ) : pickerList.map((p: any) => (
                    <label key={p._id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer text-xs">
                      <input type="checkbox" checked={pickedIds.has(p._id)} onChange={() => togglePick(p._id)} className="w-3.5 h-3.5 accent-[#0C447C]" />
                      <span className="font-medium text-slate-700">{p.firstName} {p.lastName}</span>
                      <span className="text-slate-400">— {entityType === 'student' ? (p.grNo || p.admissionNumber || '') : p.employeeId}</span>
                    </label>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">{pickedIds.size} selected</p>
              </>
            )}
          </div>

          {selectedTemplate && !selectedTemplate.showQrCode && !selectedTemplate.showBarcode && (
            <p className="text-[10px] text-slate-400">Note: this template has no QR code or barcode enabled, so cards won't carry a scannable identifier.</p>
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
