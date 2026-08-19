import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../contexts/AuthContext';
import { useStudents, useAttendance, useBulkMarkAttendance } from '../../../hooks/useStudents';

type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused' | 'half_day';

const STATUS_OPTIONS: { value: AttendanceStatus; label: string; color: string; activeColor: string }[] = [
  { value: 'present', label: 'P', color: 'border-emerald-300 text-emerald-600', activeColor: 'bg-emerald-500 text-white border-emerald-500' },
  { value: 'absent',  label: 'A', color: 'border-red-300 text-red-600',         activeColor: 'bg-red-500 text-white border-red-500' },
  { value: 'late',    label: 'L', color: 'border-sky-300 text-sky-600',        activeColor: 'bg-sky-500 text-white border-sky-500' },
  { value: 'excused', label: 'E', color: 'border-amber-300 text-amber-600',    activeColor: 'bg-amber-500 text-white border-amber-500' },
  { value: 'half_day',label: 'H', color: 'border-cyan-300 text-cyan-600',      activeColor: 'bg-cyan-500 text-white border-cyan-500' },
];

// ─── TEACHING ATTENDANCE TAB ────────────────────────────────────────────────────
// A class teacher's own, scoped attendance view. Deliberately has no
// class/section picker at all - unlike the admin-facing attendance
// screen in the Students module, a class teacher only ever has one
// class, and the backend hard-blocks (403) any request for a different
// one anyway. This mirrors that by simply never offering the choice,
// rather than showing a picker that would just fail on selection.
export function TeachingAttendanceTab() {
  const { user } = useAuth();
  const grade = user?.classTeacherOfGradeName;
  const section = user?.classTeacherOfSectionName;
  const isClassTeacher = !!grade;

  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'grNo'>('name');
  const [localStatus, setLocalStatus] = useState<Record<string, AttendanceStatus>>({});

  const { data: studentsData, isLoading } = useStudents({ grade, section, status: 'active', limit: 200 });
  const { data: attendanceData } = useAttendance({ date: selectedDate, grade, section });
  const markMutation = useBulkMarkAttendance();

  const students = ((studentsData as any)?.data ?? []) as any[];
  const attendance = ((attendanceData as any)?.data ?? []) as any[];
  const attendanceMap = Object.fromEntries(attendance.map((a: any) => [a.studentId, a]));

  useEffect(() => {
    const initial: Record<string, AttendanceStatus> = {};
    for (const rec of attendance) initial[rec.studentId] = rec.status as AttendanceStatus;
    setLocalStatus(initial);
  }, [attendance]);

  const filtered = students
    .filter((s: any) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) || (s.grNo || '').toLowerCase().includes(q);
    })
    .sort((a: any, b: any) => sortBy === 'grNo'
      ? (a.grNo || '').localeCompare(b.grNo || '')
      : `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`));

  const counts = STATUS_OPTIONS.reduce((acc, opt) => {
    acc[opt.value] = Object.values(localStatus).filter(s => s === opt.value).length;
    return acc;
  }, {} as Record<AttendanceStatus, number>);

  const handleSave = () => {
    if (students.length === 0) { toast.error('No students in your class'); return; }
    const schoolSlug = localStorage.getItem('schoolSlug') || 'demo-school';
    const academicYear = localStorage.getItem('academicYear') || '2025-26';
    markMutation.mutate(
      {
        schoolSlug,
        academicYear,
        records: students.map((s: any) => ({
          studentId: s._id,
          studentName: `${s.firstName || ''} ${s.lastName || ''}`.trim(),
          grade,
          section,
          date: selectedDate,
          status: localStatus[s._id] ?? 'absent',
          schoolSlug,
        })),
      },
      {
        onSuccess: () => toast.success('Attendance saved'),
        onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to save attendance'),
      }
    );
  };

  if (!isClassTeacher) {
    return (
      <div className="p-10 text-center bg-white rounded-xl border border-slate-100">
        <div className="text-4xl mb-3">📋</div>
        <p className="font-semibold text-slate-700">You are not currently assigned as a Class Teacher</p>
        <p className="text-sm text-slate-400 mt-1">Ask your school admin to assign you to a class under Institution Setup → Grades.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <p className="font-semibold text-slate-800 text-sm">My Class — {grade}{section ? ` - ${section}` : ''}</p>
            <p className="text-xs text-slate-400 mt-0.5">{filtered.length} students · {selectedDate}</p>
          </div>
          <div className="flex items-center gap-2">
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]" />
            <button onClick={handleSave} disabled={markMutation.isPending || students.length === 0}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs bg-[#0C447C] text-white rounded-lg hover:bg-[#0b3d6e] font-medium disabled:opacity-50">
              {markMutation.isPending ? 'Saving…' : 'Save Attendance'}
            </button>
          </div>
        </div>

        <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-4 text-xs flex-wrap">
          <span className="text-slate-500">Total: <strong className="text-slate-800">{students.length}</strong></span>
          {STATUS_OPTIONS.map(opt => (
            <span key={opt.value} className={opt.color.split(' ')[1]}>
              {opt.label}: <strong>{counts[opt.value] || 0}</strong>
            </span>
          ))}
          <span className="text-slate-400">Unmarked: <strong>{students.length - Object.keys(localStatus).length}</strong></span>
        </div>

        <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-3">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or GR No…"
            className="flex-1 px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]" />
          <select value={sortBy} onChange={e => setSortBy(e.target.value as 'name' | 'grNo')}
            className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg">
            <option value="name">Sort: Name</option>
            <option value="grNo">Sort: GR No</option>
          </select>
        </div>

        {isLoading ? (
          <div className="p-10 text-center text-sm text-slate-400">Loading…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['S.No', 'GR No', 'Name', 'Father Name', 'Status'].map(c => (
                    <th key={c} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-400">No students found.</td></tr>
                ) : filtered.map((s: any, idx: number) => {
                  const father = (s.guardians || []).find((g: any) => g.relation === 'father');
                  const cur = localStatus[s._id] ?? (attendanceMap[s._id]?.status as AttendanceStatus | undefined);
                  return (
                    <tr key={s._id} className="border-t border-slate-50 hover:bg-slate-50">
                      <td className="px-4 py-3 text-xs text-slate-400">{idx + 1}</td>
                      <td className="px-4 py-3 text-xs font-mono font-semibold text-[#0C447C]">{s.grNo || '—'}</td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-800">{s.firstName} {s.lastName}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{father?.name || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {STATUS_OPTIONS.map(opt => (
                            <button key={opt.value}
                              onClick={() => setLocalStatus(prev => ({ ...prev, [s._id]: opt.value }))}
                              className={`w-7 h-7 rounded-full border text-xs font-semibold transition-colors ${cur === opt.value ? opt.activeColor : `bg-white ${opt.color}`}`}
                              title={opt.value}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
