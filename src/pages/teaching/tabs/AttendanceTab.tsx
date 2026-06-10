import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import teachingService from '../../../services/teaching.service';
import { avatarColor, getInitials } from './shared';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: 'active',    label: 'Present',  cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'absent',   label: 'Absent',   cls: 'bg-red-50 text-red-700 border-red-200' },
  { value: 'on_leave', label: 'On Leave', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
];

const STATUS_LABEL: Record<string, string> = {
  active:   'Present',
  absent:   'Absent',
  on_leave: 'On Leave',
  inactive: 'Inactive',
};

const STATUS_STYLE: Record<string, string> = {
  active:   'bg-emerald-50 text-emerald-700 border-emerald-200',
  absent:   'bg-red-50 text-red-700 border-red-200',
  on_leave: 'bg-amber-50 text-amber-700 border-amber-200',
  inactive: 'bg-slate-100 text-slate-500 border-slate-200',
};

// ─── SPINNER ──────────────────────────────────────────────────────────────────

function Spin() {
  return (
    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
      <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}

// ─── MARK ROW ─────────────────────────────────────────────────────────────────

function TeacherStatusRow({
  teacher,
  localStatus,
  onStatusChange,
  isSaving,
}: {
  teacher: any;
  localStatus: string;
  onStatusChange: (id: string, status: string) => void;
  isSaving: boolean;
}) {
  const initials = getInitials(teacher.firstName, teacher.lastName);
  const avColor = avatarColor(`${teacher.firstName}${teacher.lastName}`);
  const statusStyle = STATUS_STYLE[localStatus] ?? STATUS_STYLE.inactive;
  const attendancePct = teacher.attendancePct || 0;
  const barColor = attendancePct >= 90 ? '#10b981' : attendancePct >= 75 ? '#EF9F27' : '#ef4444';

  return (
    <tr className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
      <td className="py-3 px-4">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
            style={{ background: avColor }}
          >
            {initials}
          </div>
          <div>
            <div className="font-medium text-slate-800">{teacher.firstName} {teacher.lastName}</div>
            <div className="text-xs text-slate-400">{teacher.designation || 'Teacher'}</div>
          </div>
        </div>
      </td>
      <td className="py-3 px-4 text-slate-600 text-sm">
        {(teacher.subjectsCanTeach || []).slice(0, 2).join(', ') || '—'}
        {(teacher.subjectsCanTeach || []).length > 2 && (
          <span className="text-slate-400"> +{teacher.subjectsCanTeach.length - 2}</span>
        )}
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${attendancePct}%`, background: barColor }} />
          </div>
          <span className="text-xs font-semibold" style={{ color: barColor }}>{attendancePct}%</span>
        </div>
      </td>
      <td className="py-3 px-4">
        <span className={`inline-flex items-center px-2 py-0.5 border rounded-full text-xs font-medium ${statusStyle}`}>
          {STATUS_LABEL[localStatus] ?? localStatus}
        </span>
      </td>
      <td className="py-3 px-4">
        <div className="flex gap-1">
          {STATUS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => onStatusChange(teacher._id, opt.value)}
              disabled={isSaving || localStatus === opt.value}
              className={`px-2.5 py-1 text-xs rounded-lg border transition-colors ${
                localStatus === opt.value
                  ? opt.cls + ' cursor-default opacity-80'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400 disabled:opacity-40'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </td>
    </tr>
  );
}

// ─── ATTENDANCE TAB ───────────────────────────────────────────────────────────

export function TeachingAttendanceTab() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [pendingUpdates, setPendingUpdates] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const qc = useQueryClient();

  const { data: teachers = [], isLoading } = useQuery({
    queryKey: ['teachers'],
    queryFn: teachingService.getTeachers,
  });

  const updateMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      teachingService.updateTeacher(id, { status }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['teachers'] });
      setPendingUpdates(prev => {
        const next = { ...prev };
        delete next[vars.id];
        return next;
      });
      toast.success('Attendance updated');
      setSavingId(null);
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.message || 'Failed to update');
      setSavingId(null);
    },
  });

  const bulkUpdateMut = useMutation({
    mutationFn: async (updates: Record<string, string>) => {
      for (const [id, status] of Object.entries(updates)) {
        await teachingService.updateTeacher(id, { status });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teachers'] });
      setPendingUpdates({});
      toast.success('All attendance saved');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to save'),
  });

  const teacherList = teachers as any[];

  const filtered = useMemo(() => {
    return teacherList.filter(t => {
      const currentStatus = pendingUpdates[t._id] ?? t.status ?? 'active';
      const matchSearch = search
        ? `${t.firstName} ${t.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
          (t.subjectsCanTeach || []).some((s: string) => s.toLowerCase().includes(search.toLowerCase()))
        : true;
      const matchStatus = filterStatus ? currentStatus === filterStatus : true;
      return matchSearch && matchStatus;
    });
  }, [teacherList, search, filterStatus, pendingUpdates]);

  function handleStatusChange(id: string, status: string) {
    setPendingUpdates(prev => ({ ...prev, [id]: status }));
    setSavingId(id);
    updateMut.mutate({ id, status });
  }

  // Stats
  const stats = useMemo(() => {
    const present = teacherList.filter(t => (pendingUpdates[t._id] ?? t.status) === 'active').length;
    const absent = teacherList.filter(t => (pendingUpdates[t._id] ?? t.status) === 'absent').length;
    const onLeave = teacherList.filter(t => (pendingUpdates[t._id] ?? t.status) === 'on_leave').length;
    const attendancePct = teacherList.length > 0 ? Math.round((present / teacherList.length) * 100) : 0;
    const avgPct = teacherList.length > 0
      ? Math.round(teacherList.reduce((sum, t) => sum + (t.attendancePct || 0), 0) / teacherList.length)
      : 0;
    return { present, absent, onLeave, attendancePct, avgPct };
  }, [teacherList, pendingUpdates]);

  const hasPending = Object.keys(pendingUpdates).length > 0;
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Teacher Attendance</h1>
          <p className="text-sm text-slate-500 mt-0.5">{today}</p>
        </div>
        <div className="flex gap-2">
          {hasPending && (
            <button
              onClick={() => bulkUpdateMut.mutate(pendingUpdates)}
              disabled={bulkUpdateMut.isPending}
              className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {bulkUpdateMut.isPending && <Spin />}
              Save All ({Object.keys(pendingUpdates).length})
            </button>
          )}
          <button
            onClick={() => {
              const allPresent: Record<string, string> = {};
              teacherList.forEach(t => { allPresent[t._id] = 'active'; });
              bulkUpdateMut.mutate(allPresent);
            }}
            disabled={bulkUpdateMut.isPending || isLoading}
            className="px-4 py-2 border border-slate-200 bg-white text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-40"
          >
            Mark All Present
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-5 gap-3 mb-5">
        {[
          { label: 'Total Teachers', value: teacherList.length, color: '#0C447C' },
          { label: 'Present Today', value: stats.present, color: '#1D9E75' },
          { label: 'Absent', value: stats.absent, color: '#E24B4A' },
          { label: 'On Leave', value: stats.onLeave, color: '#BA7517' },
          { label: 'Today\'s Rate', value: `${stats.attendancePct}%`, color: stats.attendancePct >= 90 ? '#1D9E75' : stats.attendancePct >= 75 ? '#BA7517' : '#E24B4A' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4" style={{ borderTop: `3px solid ${s.color}` }}>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{s.label}</div>
            <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Alerts for absent without cover */}
      {stats.absent > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5">
          <div className="flex items-center gap-2 font-semibold text-red-800 text-sm">
            ⚠ {stats.absent} teacher{stats.absent !== 1 ? 's' : ''} absent today — ensure cover is arranged for their classes
          </div>
        </div>
      )}

      {/* Average attendance bar */}
      {teacherList.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm px-5 py-4 mb-5">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium text-slate-700">Monthly Average Attendance</span>
            <span className="font-semibold" style={{ color: stats.avgPct >= 90 ? '#1D9E75' : stats.avgPct >= 75 ? '#EF9F27' : '#ef4444' }}>
              {stats.avgPct}%
            </span>
          </div>
          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${stats.avgPct}%`,
                background: stats.avgPct >= 90 ? '#1D9E75' : stats.avgPct >= 75 ? '#EF9F27' : '#ef4444',
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-400 mt-1.5">
            <span>Monthly average across all teachers</span>
            <span>{teacherList.filter(t => (t.attendancePct || 0) < 75).length} teachers below 75%</span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or subject…"
          className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C] min-w-[220px]"
        />
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
          {[{ v: '', l: 'All' }, { v: 'active', l: 'Present' }, { v: 'absent', l: 'Absent' }, { v: 'on_leave', l: 'On Leave' }].map(f => (
            <button
              key={f.v}
              onClick={() => setFilterStatus(f.v)}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${filterStatus === f.v ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {f.l}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-slate-400 gap-2"><Spin /> Loading teachers…</div>
      ) : teacherList.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-16 text-center">
          <div className="text-5xl mb-4">📋</div>
          <div className="font-semibold text-slate-700 text-lg mb-1">No teacher profiles yet</div>
          <div className="text-sm text-slate-400">Add teacher profiles in the Teachers tab to mark attendance</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-12 text-center">
          <div className="text-4xl mb-3">🔍</div>
          <div className="font-semibold text-slate-600">No matches</div>
          <div className="text-sm text-slate-400 mt-1">Try adjusting your search or filter</div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Teacher', 'Subjects', 'Monthly Avg', 'Today\'s Status', 'Mark Attendance'].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap bg-slate-50">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((t: any) => (
                  <TeacherStatusRow
                    key={t._id}
                    teacher={t}
                    localStatus={pendingUpdates[t._id] ?? t.status ?? 'active'}
                    onStatusChange={handleStatusChange}
                    isSaving={savingId === t._id && updateMut.isPending}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer with summary */}
          <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
            <div className="text-xs text-slate-500">
              Showing {filtered.length} of {teacherList.length} teachers
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                Present: {stats.present}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                Absent: {stats.absent}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                On Leave: {stats.onLeave}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Low attendance alert */}
      {teacherList.filter(t => (t.attendancePct || 0) < 75 && t.status === 'active').length > 0 && (
        <div className="mt-5 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="font-semibold text-amber-800 text-sm mb-2">⚠ Teachers with Low Monthly Attendance (&lt;75%)</div>
          <div className="space-y-1">
            {teacherList
              .filter(t => (t.attendancePct || 0) < 75)
              .map(t => (
                <div key={t._id} className="flex items-center justify-between text-sm">
                  <span className="text-amber-700">{t.firstName} {t.lastName}</span>
                  <span className="font-semibold text-red-600">{t.attendancePct || 0}%</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
