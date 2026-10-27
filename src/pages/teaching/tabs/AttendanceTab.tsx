import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ScanLine, X, CalendarOff, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useStudents, useAttendance, useBulkMarkAttendance, useSchoolDayStatus } from '../../../hooks/useStudents';
import teachingService from '../../../services/teaching.service';
import academicsService from '../../../services/academics.service';

type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused' | 'half_day';

const STATUS_OPTIONS: { value: AttendanceStatus; label: string; color: string; activeColor: string }[] = [
  { value: 'present', label: 'P', color: 'border-emerald-300 text-emerald-600', activeColor: 'bg-emerald-500 text-white border-emerald-500' },
  { value: 'absent',  label: 'A', color: 'border-red-300 text-red-600',         activeColor: 'bg-red-500 text-white border-red-500' },
  { value: 'late',    label: 'L', color: 'border-sky-300 text-sky-600',        activeColor: 'bg-sky-500 text-white border-sky-500' },
  { value: 'excused', label: 'E', color: 'border-amber-300 text-amber-600',    activeColor: 'bg-amber-500 text-white border-amber-500' },
  { value: 'half_day',label: 'H', color: 'border-cyan-300 text-cyan-600',      activeColor: 'bg-cyan-500 text-white border-cyan-500' },
];

// ─── TEACHING ATTENDANCE TAB ────────────────────────────────────────────────────
// A class teacher's own, scoped attendance view. A class teacher who
// holds only ONE class gets no class/section picker at all - the backend
// hard-blocks (403) any request for a different one anyway, so there's
// nothing to choose. A teacher who is class teacher of MORE than one
// section (common in Early Years, where one lead teacher often covers
// 2-3 small sections) gets a picker, since the backend can no longer
// guess which of their real sections this screen means.
export function TeachingAttendanceTab() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const assignments = user?.classTeacherAssignments?.length
    ? user.classTeacherAssignments
    : (user?.classTeacherOfGradeName
      ? [{
          gradeId: user.classTeacherOfGradeId || '', gradeName: user.classTeacherOfGradeName,
          sectionId: '', sectionName: user.classTeacherOfSectionName || '', name: user.classTeacherOfGradeName,
        }]
      : []);
  const [selectedAssignmentIdx, setSelectedAssignmentIdx] = useState(0);
  const activeAssignment = assignments[selectedAssignmentIdx] ?? assignments[0];
  const grade = activeAssignment?.gradeName;
  const section = activeAssignment?.sectionName || undefined;
  const isClassTeacher = assignments.length > 0;

  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'grNo'>('name');
  const [localStatus, setLocalStatus] = useState<Record<string, AttendanceStatus>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  // Set right after a successful save, in THIS session, so "✓ Saved just
  // now" can be shown without waiting for the list to refetch.
  const [justSavedAt, setJustSavedAt] = useState<Date | null>(null);

  // Scan Mode - lets a USB/Bluetooth barcode scanner or RFID reader mark
  // attendance directly. Both classes of hardware commonly emulate a
  // keyboard: they "type" the card's code into whatever input has focus
  // and send Enter. So this needs no special driver or native integration
  // - just a text input that stays focused and reads on Enter, matched
  // client-side against each student's grNo / admissionNumber / rfid.
  const [scanMode, setScanMode] = useState(false);
  const [scanInput, setScanInput] = useState('');
  const [lastScan, setLastScan] = useState<{ name: string; ok: boolean } | null>(null);
  const scanInputRef = useRef<HTMLInputElement>(null);

  // School-wide policy (Teaching Management > Attendance Settings, admin-
  // only) - 'daily' (default, unchanged behavior) or 'subject_wise',
  // where this same class teacher marks a separate attendance record per
  // subject for the same day instead of one whole-day status.
  const { data: attendanceSettings } = useQuery({ queryKey: ['teaching', 'attendance-settings'], queryFn: teachingService.getAttendanceSettings });
  const isSubjectWise = (attendanceSettings as any)?.mode === 'subject_wise';
  const { data: subjectsData } = useQuery({ queryKey: ['subjects-for-attendance'], queryFn: () => academicsService.getSubjects(), enabled: isSubjectWise });
  const subjects: any[] = (subjectsData as any[]) ?? [];
  const [selectedSubject, setSelectedSubject] = useState('');
  useEffect(() => {
    if (isSubjectWise && !selectedSubject && subjects.length > 0) setSelectedSubject(subjects[0].name);
  }, [isSubjectWise, subjects, selectedSubject]);

  // Master "school days" setting (admin-configured on the Academic Year,
  // Institution Setup → Academic Years), combined with published School
  // Calendar holidays. `configured: false` means the school hasn't set
  // this up yet, so every date is treated as valid - unchanged behavior
  // for a school that never touches the new setting.
  const { data: dayStatus } = useSchoolDayStatus(selectedDate, grade);
  const isSchoolDay = dayStatus?.configured !== true || dayStatus.valid;

  const { data: studentsData, isLoading } = useStudents({ grade, section, status: 'active', limit: 200 });
  const { data: attendanceData } = useAttendance({
    date: selectedDate, grade, section,
    subject: isSubjectWise ? selectedSubject || undefined : undefined,
  });
  const markMutation = useBulkMarkAttendance();

  const students = ((studentsData as any)?.data ?? []) as any[];
  const attendance = ((attendanceData as any)?.data ?? []) as any[];
  const attendanceMap = Object.fromEntries(attendance.map((a: any) => [a.studentId, a]));

  useEffect(() => {
    const initial: Record<string, AttendanceStatus> = {};
    for (const rec of attendance) initial[rec.studentId] = rec.status as AttendanceStatus;
    setLocalStatus(initial);
    setJustSavedAt(null);
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

  // Scoped to the CURRENT class roster only, not raw localStatus/attendance
  // keys - a student who has since transferred out of this class/section
  // (or whose grade/section changed) can still have an attendance record
  // for this date sitting in the fetched list, which used to inflate the
  // marked-count past the roster size and show a nonsensical negative
  // "Unmarked" count (e.g. Total 19 but P+A+L+E+H summed to 20). Every
  // count below is derived by filtering `students` itself, so it can
  // never exceed the roster and Unmarked can never go negative.
  const statusFor = (id: string): AttendanceStatus | undefined => localStatus[id] ?? (attendanceMap[id]?.status as AttendanceStatus | undefined);
  const counts = STATUS_OPTIONS.reduce((acc, opt) => {
    acc[opt.value] = students.filter((s: any) => statusFor(s._id) === opt.value).length;
    return acc;
  }, {} as Record<AttendanceStatus, number>);
  const markedCount = students.filter((s: any) => statusFor(s._id) !== undefined).length;
  const unmarkedCount = students.length - markedCount;

  // A student is "unsaved" when what's currently shown for them (a local
  // edit) differs from what's actually persisted on the server for this
  // date - the only true signal of "did my change actually save". Right
  // after loading a date (before any taps), localStatus is seeded from
  // the fetched records, so nothing is unsaved yet; it only diverges once
  // the teacher changes a status and before the next successful save.
  const unsavedStudents = students.filter((s: any) => {
    const local = localStatus[s._id];
    if (local === undefined) return false;
    return local !== attendanceMap[s._id]?.status;
  });
  const allSaved = markedCount === students.length && unsavedStudents.length === 0 && students.length > 0;
  // Most recent persisted update among today's records - lets a teacher
  // revisiting a PAST date (not just one they just saved this session)
  // see real proof it was actually saved, including who saved it.
  const lastPersisted = attendance.length > 0
    ? attendance.reduce((latest: any, r: any) => (!latest || new Date(r.updatedAt || r.createdAt) > new Date(latest.updatedAt || latest.createdAt) ? r : latest), null)
    : null;

  useEffect(() => {
    if (scanMode) scanInputRef.current?.focus();
  }, [scanMode]);

  const handleScan = (rawCode: string) => {
    const code = rawCode.trim().toLowerCase();
    setScanInput('');
    if (!code) return;
    const match = students.find((s: any) =>
      [s.grNo, s.admissionNumber, s.rfid].some(v => (v || '').toString().trim().toLowerCase() === code)
    );
    if (!match) {
      setLastScan({ name: code, ok: false });
      toast.error(`No student in your class matches "${rawCode.trim()}"`);
    } else {
      setLocalStatus(prev => ({ ...prev, [match._id]: 'present' }));
      setLastScan({ name: `${match.firstName || ''} ${match.lastName || ''}`.trim(), ok: true });
      toast.success(`Marked present: ${match.firstName || ''} ${match.lastName || ''}`.trim());
    }
    scanInputRef.current?.focus();
  };

  const markAllPresent = () => {
    const next: Record<string, AttendanceStatus> = { ...localStatus };
    for (const s of filtered) next[s._id] = 'present';
    setLocalStatus(next);
    toast.success(`Marked ${filtered.length} student${filtered.length === 1 ? '' : 's'} present`);
  };

  const toggleSelectAll = () => {
    setSelectedIds(prev => prev.size === filtered.length
      ? new Set()
      : new Set(filtered.map((s: any) => s._id)));
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const applyStatusToSelected = (status: AttendanceStatus) => {
    if (selectedIds.size === 0) return;
    setLocalStatus(prev => {
      const next = { ...prev };
      for (const id of selectedIds) next[id] = status;
      return next;
    });
    toast.success(`Applied "${status}" to ${selectedIds.size} student${selectedIds.size === 1 ? '' : 's'}`);
    setSelectedIds(new Set());
  };

  const handleSave = () => {
    if (students.length === 0) { toast.error('No students in your class'); return; }
    if (isSubjectWise && !selectedSubject) { toast.error('Select a subject first'); return; }
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
          ...(isSubjectWise ? { subject: selectedSubject } : {}),
        })),
      },
      {
        onSuccess: () => { toast.success('Attendance saved'); setJustSavedAt(new Date()); },
        onError: (err: any) => {
          // 409 = the backend detected another request (another tab, or an
          // admin editing the same class/date) just saved overlapping
          // records. That's a real, intentional safety check - not
          // something to blindly retry - so refetch what actually landed
          // and tell the teacher plainly what happened, instead of the old
          // "refresh the page and start over" dead end.
          if (err?.response?.status === 409) {
            qc.invalidateQueries({ queryKey: ['students', 'attendance'] });
            toast.error(
              'Someone else just saved attendance for some of these students - their status below has been updated. Please review and save again for any students still needing changes.',
              { duration: 6000 }
            );
            return;
          }
          toast.error(err?.response?.data?.message || 'Failed to save attendance');
        },
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
            <p className="text-xs text-slate-400 mt-0.5">
              {filtered.length} students · {selectedDate}{isSubjectWise && selectedSubject ? ` · ${selectedSubject}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {assignments.length > 1 && (
              <select value={selectedAssignmentIdx} onChange={e => setSelectedAssignmentIdx(Number(e.target.value))}
                className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]"
                title="You are the class teacher of more than one section">
                {assignments.map((a, idx) => (
                  <option key={a.sectionId || idx} value={idx}>{a.gradeName}{a.sectionName ? ` - ${a.sectionName}` : ''}</option>
                ))}
              </select>
            )}
            {isSubjectWise && (
              <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}
                className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]">
                <option value="">Select subject…</option>
                {subjects.map((s: any) => <option key={s._id} value={s.name}>{s.name}</option>)}
              </select>
            )}
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]" />
            <button onClick={markAllPresent} disabled={filtered.length === 0 || !isSchoolDay}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 font-medium disabled:opacity-50"
              title="Set every visible student's status to Present">
              Mark All Present
            </button>
            <button onClick={() => setScanMode(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium border transition-colors ${scanMode ? 'bg-[#0C447C] text-white border-[#0C447C]' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
              title="Scan a barcode or RFID badge to mark a student present">
              <ScanLine size={14} /> {scanMode ? 'Scanning…' : 'Scan Mode'}
            </button>
            <button onClick={handleSave} disabled={markMutation.isPending || students.length === 0 || (isSubjectWise && !selectedSubject) || !isSchoolDay}
              title={!isSchoolDay ? dayStatus?.reason : undefined}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs bg-[#0C447C] text-white rounded-lg hover:bg-[#0b3d6e] font-medium disabled:opacity-50">
              {markMutation.isPending ? 'Saving…' : 'Save Attendance'}
            </button>
          </div>
        </div>

        {!isSchoolDay && (
          <div className="px-5 py-3 bg-amber-50 border-b border-amber-100 flex items-center gap-2.5 text-amber-700">
            <CalendarOff size={16} className="shrink-0" />
            <p className="text-xs font-medium">
              {dayStatus?.reason || 'This date is not a school day.'} Attendance cannot be marked for this date — pick a school day, or ask your admin to update the school calendar under Institution Setup → Academic Years / School Calendar.
            </p>
          </div>
        )}

        {/* Save-status banner - the whole point of this is to answer "did
            my attendance actually save?" without the teacher having to
            guess from a plain, unlabeled table. Three distinct states:
            unsaved local changes pending, nothing entered at all yet, or
            confirmed saved (with who/when, even for a past date the
            teacher is just reviewing, not one they saved this session). */}
        {unsavedStudents.length > 0 ? (
          <div className="px-5 py-3 bg-amber-50 border-b border-amber-100 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-amber-700">
              <AlertTriangle size={16} className="shrink-0" />
              <p className="text-xs font-medium">
                {unsavedStudents.length} student{unsavedStudents.length === 1 ? '' : 's'} changed but not yet saved — click "Save Attendance" to confirm it.
              </p>
            </div>
          </div>
        ) : markedCount === 0 ? (
          <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2.5 text-slate-500">
            <Clock size={16} className="shrink-0" />
            <p className="text-xs font-medium">No attendance has been saved for {selectedDate} yet.</p>
          </div>
        ) : allSaved ? (
          <div className="px-5 py-3 bg-emerald-50 border-b border-emerald-100 flex items-center gap-2.5 text-emerald-700">
            <CheckCircle2 size={16} className="shrink-0" />
            <p className="text-xs font-medium">
              {justSavedAt
                ? `✓ All ${students.length} students saved just now.`
                : lastPersisted
                  ? `✓ All ${students.length} students already saved for ${selectedDate}${lastPersisted.markedBy ? ` — last updated by ${lastPersisted.markedBy}` : ''} at ${new Date(lastPersisted.updatedAt || lastPersisted.createdAt).toLocaleString()}.`
                  : `✓ All ${students.length} students saved for ${selectedDate}.`}
            </p>
          </div>
        ) : (
          <div className="px-5 py-3 bg-amber-50 border-b border-amber-100 flex items-center gap-2.5 text-amber-700">
            <AlertTriangle size={16} className="shrink-0" />
            <p className="text-xs font-medium">
              {markedCount} of {students.length} students saved for {selectedDate} — {students.length - markedCount} still have no attendance recorded.
            </p>
          </div>
        )}

        {scanMode && (
          <div className="px-5 py-3 bg-[#0C447C]/5 border-b border-slate-100 flex items-center gap-3">
            <ScanLine size={16} className="text-[#0C447C] shrink-0" />
            <input
              ref={scanInputRef}
              autoFocus
              value={scanInput}
              onChange={e => setScanInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleScan(scanInput); }}
              onBlur={() => scanInputRef.current?.focus()}
              placeholder="Scan a student's barcode or RFID badge, or type their GR No and press Enter…"
              className="flex-1 px-3 py-1.5 text-sm border border-[#0C447C]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C] font-mono"
            />
            {lastScan && (
              <span className={`text-xs font-medium ${lastScan.ok ? 'text-emerald-600' : 'text-red-500'}`}>
                {lastScan.ok ? `✓ ${lastScan.name}` : `✗ ${lastScan.name}`}
              </span>
            )}
            <button onClick={() => setScanMode(false)} className="text-slate-400 hover:text-slate-600" title="Exit Scan Mode">
              <X size={16} />
            </button>
          </div>
        )}

        <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-4 text-xs flex-wrap">
          <span className="text-slate-500">Total: <strong className="text-slate-800">{students.length}</strong></span>
          {STATUS_OPTIONS.map(opt => (
            <span key={opt.value} className={opt.color.split(' ')[1]}>
              {opt.label}: <strong>{counts[opt.value] || 0}</strong>
            </span>
          ))}
          <span className="text-slate-400">Unmarked: <strong>{unmarkedCount}</strong></span>
          {unsavedStudents.length > 0 && (
            <span className="text-amber-600 font-medium">⚠ {unsavedStudents.length} unsaved</span>
          )}
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

        {selectedIds.size > 0 && (
          <div className="px-5 py-2.5 bg-[#0C447C]/5 border-b border-slate-100 flex items-center gap-3 flex-wrap">
            <span className="text-xs font-medium text-[#0C447C]">{selectedIds.size} selected</span>
            <span className="text-xs text-slate-400">Apply status:</span>
            {STATUS_OPTIONS.map(opt => (
              <button key={opt.value} onClick={() => applyStatusToSelected(opt.value)}
                className={`px-2.5 py-1 rounded-lg border text-xs font-medium bg-white ${opt.color} hover:bg-slate-50`}>
                {opt.label}
              </button>
            ))}
            <button onClick={() => setSelectedIds(new Set())} className="text-xs text-slate-400 hover:text-slate-600 ml-auto">
              Clear selection
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="p-10 text-center text-sm text-slate-400">Loading…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-4 py-3 w-8">
                    <input type="checkbox"
                      checked={filtered.length > 0 && selectedIds.size === filtered.length}
                      onChange={toggleSelectAll}
                      className="rounded border-slate-300 text-[#0C447C] focus:ring-[#0C447C]" />
                  </th>
                  {['S.No', 'GR No', 'Name', 'Father Name', 'Status', 'Saved?'].map(c => (
                    <th key={c} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">No students found.</td></tr>
                ) : filtered.map((s: any, idx: number) => {
                  const father = (s.guardians || []).find((g: any) => g.relation === 'father');
                  const cur = localStatus[s._id] ?? (attendanceMap[s._id]?.status as AttendanceStatus | undefined);
                  return (
                    <tr key={s._id} className={`border-t border-slate-50 hover:bg-slate-50 ${selectedIds.has(s._id) ? 'bg-[#0C447C]/5' : ''}`}>
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={selectedIds.has(s._id)} onChange={() => toggleSelectOne(s._id)}
                          className="rounded border-slate-300 text-[#0C447C] focus:ring-[#0C447C]" />
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">{idx + 1}</td>
                      <td className="px-4 py-3 text-xs font-mono font-semibold text-[#0C447C]">{s.grNo || '—'}</td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-800">{s.firstName} {s.lastName}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{father?.name || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {STATUS_OPTIONS.map(opt => (
                            <button key={opt.value}
                              onClick={() => setLocalStatus(prev => ({ ...prev, [s._id]: opt.value }))}
                              disabled={!isSchoolDay}
                              className={`w-7 h-7 rounded-full border text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${cur === opt.value ? opt.activeColor : `bg-white ${opt.color}`}`}
                              title={opt.value}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {cur === undefined ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                            <Clock size={12} /> Not marked
                          </span>
                        ) : localStatus[s._id] !== undefined && localStatus[s._id] !== attendanceMap[s._id]?.status ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 font-medium">
                            <AlertTriangle size={12} /> Unsaved
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                            <CheckCircle2 size={12} /> Saved
                          </span>
                        )}
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
