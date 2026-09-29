import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { X, IdCard, Search } from 'lucide-react';
import idCardsService from '../../services/id-cards.service';
import studentsService from '../../services/students.service';
import hrService from '../../services/hr.service';

// A whole class/section can legitimately run past a search-box's usual
// working set - this caps the roster fetch generously (matches the
// backend's PaginationDto max) rather than the small page size used
// elsewhere in this modal's plain search mode.
const CLASS_PICK_LIMIT = 1000;

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
  const [pickMode, setPickMode] = useState<'search' | 'class'>('search');
  const [search, setSearch] = useState('');
  const [selectedGrades, setSelectedGrades] = useState<Set<string>>(new Set());
  const [selectedSections, setSelectedSections] = useState<Set<string>>(new Set());
  const [pickedIds, setPickedIds] = useState<Set<string>>(new Set());
  const [templateId, setTemplateId] = useState('');
  const [includeBack, setIncludeBack] = useState(true);

  const { data: templates = [] } = useQuery({
    queryKey: ['id-card-templates', entityType],
    queryFn: () => idCardsService.listTemplates(entityType),
  });
  const effectiveTemplateId = templateId || templates.find((t) => t.isDefault)?._id || templates[0]?._id || '';
  const selectedTemplate = templates.find((t) => t._id === effectiveTemplateId);

  // Class/section options only apply to students - staff records don't
  // carry a grade/section, so the toggle to browse by class only shows
  // for entityType 'student'.
  const { data: filterOptions } = useQuery({
    queryKey: ['id-card-picker-filters'],
    queryFn: () => studentsService.getDistinctGradesSections(),
    enabled: !usingPreselected && entityType === 'student',
  });
  const grades: string[] = (filterOptions as any)?.grades || [];
  const sections: string[] = (filterOptions as any)?.sections || [];

  function toggleInSet(set: Set<string>, setter: (s: Set<string>) => void, value: string) {
    const next = new Set(set);
    next.has(value) ? next.delete(value) : next.add(value);
    setter(next);
  }

  const classFilterActive = pickMode === 'class' && (selectedGrades.size > 0 || selectedSections.size > 0);

  const { data: pickerData, isFetching: pickerLoading } = useQuery({
    queryKey: ['id-card-picker', entityType, pickMode, search, Array.from(selectedGrades), Array.from(selectedSections)],
    queryFn: () => entityType === 'staff'
      ? hrService.getStaff()
      : studentsService.getStudents(
          pickMode === 'class'
            ? { grade: selectedGrades.size ? Array.from(selectedGrades) : undefined, section: selectedSections.size ? Array.from(selectedSections) : undefined, limit: CLASS_PICK_LIMIT }
            : { search: search || undefined },
        ),
    enabled: !usingPreselected && (pickMode === 'search' || classFilterActive),
  });
  const pickerList: any[] = usingPreselected || (pickMode === 'class' && !classFilterActive)
    ? []
    : (Array.isArray(pickerData) ? pickerData : pickerData?.data || []);

  function togglePick(id: string) {
    setPickedIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }

  function selectAllInList() {
    setPickedIds((prev) => { const next = new Set(prev); pickerList.forEach((p: any) => next.add(p._id)); return next; });
  }

  function clearAllInList() {
    setPickedIds((prev) => { const next = new Set(prev); pickerList.forEach((p: any) => next.delete(p._id)); return next; });
  }

  const allInListPicked = pickerList.length > 0 && pickerList.every((p: any) => pickedIds.has(p._id));

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
                {entityType === 'student' && (
                  <div className="flex gap-1 mb-2 border border-slate-200 rounded-lg p-0.5 w-fit">
                    <button type="button" onClick={() => setPickMode('search')}
                      className={`px-2.5 py-1 text-[11px] font-medium rounded-md ${pickMode === 'search' ? 'bg-[#0C447C] text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
                      Search
                    </button>
                    <button type="button" onClick={() => setPickMode('class')}
                      className={`px-2.5 py-1 text-[11px] font-medium rounded-md ${pickMode === 'class' ? 'bg-[#0C447C] text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
                      By Class / Section
                    </button>
                  </div>
                )}

                {pickMode === 'class' ? (
                  <div className="space-y-2.5 mb-2">
                    <div>
                      <p className="text-[10px] font-semibold text-slate-500 uppercase mb-1">Class / Grade</p>
                      <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto p-1.5 border border-slate-200 rounded-lg">
                        {grades.length === 0 && <p className="text-xs text-slate-400 italic">No grade data found.</p>}
                        {grades.map((g) => (
                          <label key={g} className="flex items-center gap-1 text-[11px] cursor-pointer border border-slate-200 rounded-lg px-1.5 py-0.5">
                            <input type="checkbox" checked={selectedGrades.has(g)} onChange={() => toggleInSet(selectedGrades, setSelectedGrades, g)} className="w-3 h-3 accent-[#0C447C]" />
                            {g}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-slate-500 uppercase mb-1">Section</p>
                      <div className="flex flex-wrap gap-1.5 p-1.5 border border-slate-200 rounded-lg">
                        {sections.length === 0 && <p className="text-xs text-slate-400 italic">No section data found.</p>}
                        {sections.map((s) => (
                          <label key={s} className="flex items-center gap-1 text-[11px] cursor-pointer border border-slate-200 rounded-lg px-1.5 py-0.5">
                            <input type="checkbox" checked={selectedSections.has(s)} onChange={() => toggleInSet(selectedSections, setSelectedSections, s)} className="w-3 h-3 accent-[#0C447C]" />
                            {s}
                          </label>
                        ))}
                      </div>
                    </div>
                    {!classFilterActive && (
                      <p className="text-[10px] text-slate-400 italic">Pick at least one class or section to load its roster.</p>
                    )}
                  </div>
                ) : (
                  <div className="relative mb-2">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…"
                      className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]" />
                  </div>
                )}

                {pickerList.length > 0 && (
                  <button type="button" onClick={() => (allInListPicked ? clearAllInList() : selectAllInList())}
                    className="text-[10px] font-semibold text-[#0C447C] hover:underline mb-1">
                    {allInListPicked ? `Deselect all ${pickerList.length} in this list` : `Select all ${pickerList.length} in this list`}
                  </button>
                )}
                <div className="max-h-48 overflow-y-auto border border-slate-100 rounded-xl p-2 space-y-1">
                  {pickerLoading ? (
                    <p className="text-xs text-slate-400 text-center py-4">Loading…</p>
                  ) : pickerList.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">
                      {pickMode === 'class' && !classFilterActive ? `Pick a class or section above.` : `No ${entityType}s found.`}
                    </p>
                  ) : pickerList.map((p: any) => (
                    <label key={p._id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer text-xs">
                      <input type="checkbox" checked={pickedIds.has(p._id)} onChange={() => togglePick(p._id)} className="w-3.5 h-3.5 accent-[#0C447C]" />
                      <span className="font-medium text-slate-700">{p.firstName} {p.lastName}</span>
                      <span className="text-slate-400">
                        — {entityType === 'student' ? (p.grNo || p.admissionNumber || '') : p.employeeId}
                        {entityType === 'student' && (p.currentGrade || p.currentSection) ? ` · ${[p.currentGrade, p.currentSection].filter(Boolean).join('-')}` : ''}
                      </span>
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
