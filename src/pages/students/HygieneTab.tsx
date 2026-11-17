// ============================================================
// HYGIENE & GROOMING CHECKLIST
// Daily teacher/staff observation feeding the Parent Engagement
// Score's hygiene dimension. Booleans per item (compliant/not),
// bulk-entry UX matching the Student Attendance Register's "Mark
// All" + multi-select bulk-apply pattern.
// ============================================================

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Shirt, Users as UsersIcon } from 'lucide-react';
import { GradeLevelDropdown, SectionDropdown } from '../teaching/tabs/shared';
import { useStudents } from '../../hooks/useStudents';
import hygieneService, { HygieneItems } from '../../services/hygiene.service';

const ITEMS: { key: keyof HygieneItems; label: string }[] = [
  { key: 'uniform', label: 'Uniform' },
  { key: 'capOrScarf', label: 'Cap/Scarf' },
  { key: 'shoes', label: 'Shoes' },
  { key: 'lunchBrought', label: 'Lunch' },
];

const todayStr = () => new Date().toISOString().slice(0, 10);
const allCompliant = (): HygieneItems => ({ uniform: true, capOrScarf: true, shoes: true, lunchBrought: true });

export default function HygieneTab() {
  const [grade, setGrade] = useState('');
  const [section, setSection] = useState('');
  const date = todayStr();
  const qc = useQueryClient();

  const { data: students = [], isLoading: loadingStudents } = useStudents(
    { grade, section, status: 'active', limit: 200 },
    { enabled: !!grade },
  );
  const list: any[] = (students as any)?.data || students || [];

  const { data: existing } = useQuery({
    queryKey: ['hygiene', 'class', grade, section, date],
    queryFn: () => hygieneService.getClassChecks({ grade, section: section || undefined, date }),
    enabled: !!grade,
  });
  const existingByStudent = useMemo(() => {
    const map = new Map<string, any>();
    (existing || []).forEach((c: any) => map.set(String(c.studentId), c));
    return map;
  }, [existing]);

  const [itemsMap, setItemsMap] = useState<Record<string, HygieneItems>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const getItems = (id: string): HygieneItems =>
    itemsMap[id] ?? existingByStudent.get(id)?.items ?? allCompliant();

  const setItem = (id: string, key: keyof HygieneItems, value: boolean) => {
    setItemsMap((prev) => ({ ...prev, [id]: { ...getItems(id), [key]: value } }));
  };

  const markAllCompliant = () => {
    const next: Record<string, HygieneItems> = {};
    list.forEach((s: any) => { next[s._id] = allCompliant(); });
    setItemsMap(next);
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const toggleSelectAll = () => {
    setSelectedIds((prev) => (prev.size === list.length ? new Set() : new Set(list.map((s: any) => s._id))));
  };

  const bulkApply = (key: keyof HygieneItems, value: boolean) => {
    if (selectedIds.size === 0) return;
    setItemsMap((prev) => {
      const next = { ...prev };
      for (const id of selectedIds) next[id] = { ...getItems(id), [key]: value };
      return next;
    });
    toast.success(`Marked "${ITEMS.find((i) => i.key === key)?.label}" ${value ? 'compliant' : 'non-compliant'} for ${selectedIds.size} student${selectedIds.size === 1 ? '' : 's'}`);
    setSelectedIds(new Set());
  };

  const mutation = useMutation({
    mutationFn: hygieneService.bulkLog,
    onSuccess: () => {
      toast.success('Hygiene check saved');
      qc.invalidateQueries({ queryKey: ['hygiene', 'class'] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to save hygiene check'),
  });

  const save = () => {
    const records = list.map((s: any) => ({
      studentId: s._id, studentName: `${s.firstName || ''} ${s.lastName || ''}`.trim(),
      grade: s.currentGrade || grade, section: s.currentSection || section,
      date, items: getItems(s._id),
    }));
    mutation.mutate(records);
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-gray-800">Hygiene & Grooming Checklist</h2>
        <p className="text-xs text-gray-400">Daily uniform, cap/scarf, shoes and lunch check — feeds the Parent Engagement Score</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm grid grid-cols-2 gap-3 max-w-md">
        <GradeLevelDropdown value={grade} onChange={(v) => { setGrade(v); setSection(''); }} />
        <SectionDropdown gradeLevel={grade} value={section} onChange={setSection} />
      </div>

      {!grade && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <UsersIcon size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-gray-500">Select a grade to check today's hygiene & grooming</p>
        </div>
      )}

      {grade && (
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">{date} · {list.length} students</p>
            <button onClick={markAllCompliant} className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium hover:underline">
              <Shirt size={13} /> Mark All Compliant
            </button>
          </div>

          {selectedIds.size > 0 && (
            <div className="flex flex-wrap items-center gap-2 bg-[#0C447C]/5 rounded-lg px-3 py-2">
              <span className="text-xs font-medium text-[#0C447C]">{selectedIds.size} selected —</span>
              {ITEMS.map((item) => (
                <span key={item.key} className="flex items-center gap-1">
                  <span className="text-[10px] text-gray-500">{item.label}:</span>
                  <button onClick={() => bulkApply(item.key, true)} className="text-[10px] px-2 py-0.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100">OK</button>
                  <button onClick={() => bulkApply(item.key, false)} className="text-[10px] px-2 py-0.5 rounded-full border border-red-200 bg-red-50 text-red-700 hover:bg-red-100">Flag</button>
                </span>
              ))}
            </div>
          )}

          {loadingStudents && <div className="py-6 text-center text-gray-400 text-sm">Loading class…</div>}
          {!loadingStudents && list.length === 0 && (
            <div className="py-6 text-center text-gray-400 text-sm">No active students in this class</div>
          )}
          {!loadingStudents && list.length > 0 && (
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="py-2 text-left w-8">
                      <input type="checkbox" checked={selectedIds.size === list.length && list.length > 0} onChange={toggleSelectAll} />
                    </th>
                    <th className="py-2 text-left font-semibold text-gray-500">Student</th>
                    {ITEMS.map((item) => (
                      <th key={item.key} className="py-2 text-center font-semibold text-gray-500">{item.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {list.map((s: any) => {
                    const items = getItems(s._id);
                    return (
                      <tr key={s._id} className={`border-b border-gray-50 ${selectedIds.has(s._id) ? 'bg-[#0C447C]/5' : ''}`}>
                        <td className="py-2">
                          <input type="checkbox" checked={selectedIds.has(s._id)} onChange={() => toggleSelectOne(s._id)} />
                        </td>
                        <td className="py-2 text-gray-700">{s.firstName} {s.lastName}</td>
                        {ITEMS.map((item) => {
                          const compliant = items[item.key] !== false;
                          return (
                            <td key={item.key} className="py-2 text-center">
                              <button
                                onClick={() => setItem(s._id, item.key, !compliant)}
                                className={`text-[10px] px-2.5 py-1 rounded-full border ${compliant ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}
                              >
                                {compliant ? 'OK' : 'Flag'}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <button
            onClick={save}
            disabled={mutation.isPending || list.length === 0}
            className="w-full bg-emerald-600 text-white text-xs font-medium py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
          >
            {mutation.isPending ? 'Saving…' : 'Save Hygiene Check'}
          </button>
        </div>
      )}
    </div>
  );
}
