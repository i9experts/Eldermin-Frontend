// ============================================================
// PARENT ENGAGEMENT SCORE — Phase 1
// Rates how cooperative/engaged each parent is, computed from data
// already captured across Fees, Circulars, Leave Requests, app login
// activity, and a new lightweight pickup/drop-off log.
// ============================================================

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { ChevronDown, ChevronUp, Clock, Users as UsersIcon } from 'lucide-react';
import { GradeLevelDropdown, SectionDropdown } from '../teaching/tabs/shared';
import { useStudents } from '../../hooks/useStudents';
import parentEngagementService from '../../services/parentEngagement.service';

// Reuses the exact rating palette already shipped for Tarbiyah
// (TARBIYAH_RATING_STYLE) so a "rating band" means the same colors
// everywhere in the product, not a second, drifting convention.
const RATING_STYLE: Record<string, { label: string; bg: string; text: string; hex: string }> = {
  excellent:          { label: 'Excellent',          bg: 'bg-emerald-100', text: 'text-emerald-700', hex: '#16A34A' },
  good:               { label: 'Good',               bg: 'bg-blue-100',    text: 'text-blue-700',    hex: '#2563EB' },
  satisfactory:       { label: 'Satisfactory',        bg: 'bg-amber-100',   text: 'text-amber-700',   hex: '#C8811A' },
  needs_improvement:  { label: 'Needs Improvement',  bg: 'bg-orange-100',  text: 'text-orange-700',  hex: '#EA580C' },
  critical:           { label: 'Critical Concern',   bg: 'bg-red-100',     text: 'text-red-700',     hex: '#DC2626' },
  insufficient_data:  { label: 'Insufficient Data',  bg: 'bg-gray-100',    text: 'text-gray-500',    hex: '#9CA3AF' },
};
const RATING_ORDER = ['excellent', 'good', 'satisfactory', 'needs_improvement', 'critical', 'insufficient_data'];

const todayStr = () => new Date().toISOString().slice(0, 10);

export default function ParentEngagementTab() {
  const [grade, setGrade] = useState('');
  const [section, setSection] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showPickup, setShowPickup] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['parent-engagement', 'class', grade, section],
    queryFn: () => parentEngagementService.getClassScores({ grade, section: section || undefined, limit: 100 }),
    enabled: !!grade,
  });
  const scores: any[] = data?.data || [];

  const distribution = useMemo(() => {
    const counts: Record<string, number> = {};
    RATING_ORDER.forEach((r) => { counts[r] = 0; });
    scores.forEach((s) => { counts[s.rating] = (counts[s.rating] || 0) + 1; });
    return RATING_ORDER.filter((r) => counts[r] > 0).map((r) => ({
      rating: RATING_STYLE[r].label, count: counts[r], fill: RATING_STYLE[r].hex,
    }));
  }, [scores]);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-gray-800">Parent Engagement Score</h2>
        <p className="text-xs text-gray-400">How cooperative each parent is, computed from fees, circulars, leave requests, app activity and pickup timeliness</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm grid grid-cols-2 gap-3 max-w-md">
        <GradeLevelDropdown value={grade} onChange={v => { setGrade(v); setSection(''); }} />
        <SectionDropdown gradeLevel={grade} value={section} onChange={setSection} />
      </div>

      {!grade && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <UsersIcon size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-gray-500">Select a grade to see this class's parent engagement scores</p>
        </div>
      )}

      {grade && (
        <>
          {distribution.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-3">Rating Distribution</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={distribution} layout="vertical" margin={{ left: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#EEF2F8" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#8295AE' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="rating" tick={{ fontSize: 11, fill: '#5B7290' }} axisLine={false} tickLine={false} width={120} />
                  <Tooltip cursor={{ fill: '#F9FAFC' }} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-50">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Parent Scores</p>
            </div>
            {isLoading && <div className="py-10 text-center text-gray-400 text-sm">Loading…</div>}
            {!isLoading && scores.length === 0 && (
              <div className="py-10 text-center text-gray-400 text-sm">No students found for this class</div>
            )}
            <div className="divide-y divide-gray-50">
              {scores.map((s) => {
                const style = RATING_STYLE[s.rating] || RATING_STYLE.insufficient_data;
                const isOpen = expanded === s.studentId;
                return (
                  <div key={s.studentId}>
                    <button
                      onClick={() => setExpanded(isOpen ? null : s.studentId)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-800">{s.studentName}</p>
                        <p className="text-[11px] text-gray-400">{s.recommendation}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${style.bg} ${style.text}`}>
                          {s.overallScore !== null ? `${s.overallScore}` : '—'} · {style.label}
                        </span>
                        {isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                      </div>
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 grid grid-cols-5 gap-2">
                        {s.dimensions.map((d: any) => (
                          <div key={d.key} className="bg-gray-50 rounded-lg p-2.5 text-center">
                            <p className="text-sm font-bold text-gray-700">{d.score !== null ? d.score : '—'}</p>
                            <p className="text-[9px] text-gray-400 leading-tight mt-0.5">{d.label}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => setShowPickup(!showPickup)}
            className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium hover:underline"
          >
            <Clock size={13} /> {showPickup ? 'Hide' : 'Log'} today's pickup/drop-off
          </button>
          {showPickup && <PickupLogPanel grade={grade} section={section} />}
        </>
      )}
    </div>
  );
}

function PickupLogPanel({ grade, section }: { grade: string; section: string }) {
  const qc = useQueryClient();
  const date = todayStr();
  const { data: students = [], isLoading } = useStudents({ grade, section, status: 'active', limit: 200 });
  const { data: existingLogs } = useQuery({
    queryKey: ['parent-engagement', 'pickup', grade, section, date],
    queryFn: () => parentEngagementService.getPickupLogs({ grade, section: section || undefined, date }),
  });
  const existingByStudent = useMemo(() => {
    const map = new Map<string, any>();
    (existingLogs || []).forEach((l: any) => map.set(String(l.studentId), l));
    return map;
  }, [existingLogs]);

  const [lateMap, setLateMap] = useState<Record<string, boolean>>({});
  const isLate = (id: string) => lateMap[id] ?? existingByStudent.get(id)?.markedLate ?? false;

  const mutation = useMutation({
    mutationFn: parentEngagementService.bulkLogPickup,
    onSuccess: () => {
      toast.success('Pickup log saved');
      qc.invalidateQueries({ queryKey: ['parent-engagement', 'pickup'] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to save pickup log'),
  });

  const list: any[] = students?.data || students || [];

  const markAllOnTime = () => {
    const next: Record<string, boolean> = {};
    list.forEach((s: any) => { next[s._id] = false; });
    setLateMap(next);
  };

  const save = () => {
    const records = list.map((s: any) => ({
      studentId: s._id, studentName: `${s.firstName || ''} ${s.lastName || ''}`.trim(),
      grade: s.currentGrade || grade, section: s.currentSection || section,
      date, markedLate: isLate(s._id),
    }));
    mutation.mutate(records);
  };

  if (isLoading) return <div className="py-6 text-center text-gray-400 text-sm">Loading class…</div>;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">{date} · {list.length} students</p>
        <button onClick={markAllOnTime} className="text-xs text-emerald-700 font-medium hover:underline">
          Mark All On Time
        </button>
      </div>
      <div className="max-h-64 overflow-y-auto divide-y divide-gray-50">
        {list.map((s: any) => (
          <div key={s._id} className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-700">{s.firstName} {s.lastName}</span>
            <div className="flex gap-1.5">
              <button
                onClick={() => setLateMap((m) => ({ ...m, [s._id]: false }))}
                className={`text-[11px] px-2.5 py-1 rounded-full border ${!isLate(s._id) ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-gray-400 border-gray-200'}`}
              >On Time</button>
              <button
                onClick={() => setLateMap((m) => ({ ...m, [s._id]: true }))}
                className={`text-[11px] px-2.5 py-1 rounded-full border ${isLate(s._id) ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-white text-gray-400 border-gray-200'}`}
              >Late</button>
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={save}
        disabled={mutation.isPending || list.length === 0}
        className="w-full bg-emerald-600 text-white text-xs font-medium py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
      >
        {mutation.isPending ? 'Saving…' : 'Save Pickup Log'}
      </button>
    </div>
  );
}
