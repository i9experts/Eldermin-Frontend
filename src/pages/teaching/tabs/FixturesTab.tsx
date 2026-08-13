import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import teachingService from '../../../services/teaching.service';
import {
  ModalShell, FormSection, TeacherDropdown,
  inputCls, labelCls, avatarColor, getInitials,
} from './shared';

// ─── STATUS HELPERS ───────────────────────────────────────────────────────────
const STATUS_STYLE: Record<string, string> = {
  open:      'bg-red-50 text-red-700 border-red-200',
  assigned:  'bg-blue-50 text-blue-700 border-blue-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-slate-100 text-slate-500 border-slate-200',
};

// ─── GENERATE FIXTURES MODAL ──────────────────────────────────────────────────
function GenerateFixturesModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [teacher, setTeacher] = useState<any>(null);
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('absence');

  const mut = useMutation({
    mutationFn: () => teachingService.generateFixturesForAbsence({ teacherId: teacher.staffId, date, reason }),
    onSuccess: (res: any) => {
      if (res.fixturesCreated === 0 && res.fixturesAlreadyExisted === 0) {
        toast('This teacher has no scheduled periods on that day — nothing to cover.', { icon: 'ℹ️' });
      } else {
        toast.success(`${res.fixturesCreated} open fixture${res.fixturesCreated === 1 ? '' : 's'} created${res.fixturesAlreadyExisted ? ` (${res.fixturesAlreadyExisted} already existed)` : ''}`);
      }
      qc.invalidateQueries({ queryKey: ['fixtures'] });
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to generate fixtures'),
  });

  return (
    <ModalShell title="Generate Fixtures for Absence" sub="Finds every period this teacher was scheduled to teach on this date and opens a coverage request for each" onClose={onClose} maxWidth="max-w-lg">
      <div className="p-6 space-y-4">
        <FormSection title="Absent Teacher">
          <TeacherDropdown value={teacher} onSelect={setTeacher} />
        </FormSection>
        <div>
          <label className={labelCls}>Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Reason</label>
          <select value={reason} onChange={e => setReason(e.target.value)} className={inputCls}>
            <option value="absence">Unplanned Absence</option>
            <option value="leave">Approved Leave</option>
            <option value="training">Training / Professional Development</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>
      <div className="p-6 pt-0 flex justify-end gap-2">
        <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button>
        <button
          onClick={() => mut.mutate()}
          disabled={!teacher || !date || mut.isPending}
          className="px-4 py-2 bg-[#0C447C] text-white text-sm font-medium rounded-lg hover:bg-[#0b3d6e] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {mut.isPending ? 'Generating…' : 'Generate Fixtures'}
        </button>
      </div>
    </ModalShell>
  );
}

// ─── SUGGESTIONS / ASSIGN MODAL ───────────────────────────────────────────────
function AssignSubstituteModal({ fixture, onClose }: { fixture: any; onClose: () => void }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['fixture-suggestions', fixture._id],
    queryFn: () => teachingService.getFixtureSuggestions(fixture._id),
  });
  const candidates: any[] = data?.candidates ?? [];

  const assignMut = useMutation({
    mutationFn: (staffId: string) => teachingService.assignFixture(fixture._id, staffId),
    onSuccess: (res: any) => {
      const notified = res.notificationStatus === 'sent' ? ' and notified by email' : ` (notification: ${res.notificationStatus})`;
      toast.success(`Assigned to ${res.substituteTeacherName}${notified}`);
      qc.invalidateQueries({ queryKey: ['fixtures'] });
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to assign substitute'),
  });

  return (
    <ModalShell
      title={`Cover ${fixture.gradeLevel} ${fixture.sectionName} — Period ${fixture.periodNo}`}
      sub={`${fixture.subject || 'Subject N/A'} · ${fixture.startTime}–${fixture.endTime} · Originally ${fixture.originalTeacherName}`}
      onClose={onClose}
      maxWidth="max-w-lg"
    >
      <div className="p-6 space-y-2 max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="text-center py-8 text-sm text-slate-400">Checking real availability across every timetable…</div>
        ) : candidates.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-3xl mb-2">🤷</div>
            <div className="text-sm text-slate-500">No teacher is genuinely free at this exact period — everyone either has a class or is already covering elsewhere.</div>
          </div>
        ) : candidates.map((c) => (
          <div key={c.staffId} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: avatarColor(c.teacherName) }}>
                {getInitials(c.teacherName.split(' ')[0], c.teacherName.split(' ').slice(1).join(' '))}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-800 truncate">{c.teacherName}</div>
                <div className="text-xs text-slate-500 flex items-center gap-1.5">
                  {c.subjectMatch && <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[10px] font-medium">Subject match</span>}
                  <span>{c.currentPeriodsPerWeek ?? 0}/{c.maxPeriodsPerWeek ?? 30} periods/week</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => assignMut.mutate(c.staffId)}
              disabled={assignMut.isPending}
              className="px-3 py-1.5 bg-[#0C447C] text-white text-xs font-semibold rounded-lg hover:bg-[#0b3d6e] disabled:opacity-40 shrink-0"
            >
              Assign
            </button>
          </div>
        ))}
      </div>
    </ModalShell>
  );
}

// ─── FIXTURES TAB ─────────────────────────────────────────────────────────────
export function TeachingFixturesTab() {
  const qc = useQueryClient();
  const [showGenerate, setShowGenerate] = useState(false);
  const [assignFixture, setAssignFixture] = useState<any | null>(null);
  const [statusFilter, setStatusFilter] = useState('');

  const { data: fixtures = [], isLoading } = useQuery({
    queryKey: ['fixtures', statusFilter],
    queryFn: () => teachingService.getFixtures(statusFilter ? { status: statusFilter } : {}),
  });
  const { data: shortfall } = useQuery({ queryKey: ['lesson-shortfall'], queryFn: () => teachingService.getLessonShortfall() });
  const { data: report } = useQuery({ queryKey: ['fixture-teacher-report'], queryFn: () => teachingService.getTeacherWiseFixtureReport() });

  const cancelMut = useMutation({
    mutationFn: (id: string) => teachingService.cancelFixture(id),
    onSuccess: () => { toast.success('Fixture cancelled'); qc.invalidateQueries({ queryKey: ['fixtures'] }); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to cancel'),
  });
  const completeMut = useMutation({
    mutationFn: (id: string) => teachingService.completeFixture(id),
    onSuccess: () => { toast.success('Marked as taught'); qc.invalidateQueries({ queryKey: ['fixtures'] }); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to mark complete'),
  });

  return (
    <div>
      {showGenerate && <GenerateFixturesModal onClose={() => setShowGenerate(false)} />}
      {assignFixture && <AssignSubstituteModal fixture={assignFixture} onClose={() => setAssignFixture(null)} />}

      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Fixture Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">Absence-to-substitution coverage, with real availability and workload-aware suggestions</p>
        </div>
        <button
          onClick={() => setShowGenerate(true)}
          className="px-4 py-2 bg-[#0C447C] text-white text-sm font-medium rounded-lg hover:bg-[#0b3d6e] transition-colors flex items-center gap-1.5"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
          Generate Fixtures for Absence
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase mb-1">Lesson Shortfall</div>
          <div className="text-2xl font-bold text-red-600">{shortfall?.count ?? 0}</div>
          <div className="text-xs text-slate-400">open fixtures with no substitute assigned</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase mb-1">Most Absences</div>
          {report?.mostAbsencesNeedingCoverage?.[0] ? (
            <div className="text-sm font-semibold text-slate-800">{report.mostAbsencesNeedingCoverage[0].teacherName} ({report.mostAbsencesNeedingCoverage[0].count})</div>
          ) : <div className="text-sm text-slate-400">No data yet</div>}
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase mb-1">Most Substitutions Given</div>
          {report?.mostSubstitutionsGiven?.[0] ? (
            <div className="text-sm font-semibold text-slate-800">{report.mostSubstitutionsGiven[0].teacherName} ({report.mostSubstitutionsGiven[0].count})</div>
          ) : <div className="text-sm text-slate-400">No data yet</div>}
        </div>
      </div>

      <div className="mb-4 flex gap-2">
        {['', 'open', 'assigned', 'completed', 'cancelled'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${statusFilter === s ? 'bg-[#0C447C] text-white border-[#0C447C]' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
          >
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <svg className="animate-spin w-6 h-6 mr-2" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
            <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          Loading fixtures…
        </div>
      ) : fixtures.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-16 text-center">
          <div className="text-5xl mb-4">📋</div>
          <div className="font-semibold text-slate-700 text-lg mb-1">No fixtures {statusFilter ? `in "${statusFilter}"` : 'yet'}</div>
          <div className="text-sm text-slate-400">When a teacher is absent, generate fixtures for their scheduled periods to start covering them.</div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Date', 'Period', 'Class', 'Subject', 'Original Teacher', 'Substitute', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap bg-slate-50">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {fixtures.map((f: any) => (
                  <tr key={f._id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 text-slate-700">{new Date(f.date).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-slate-600">P{f.periodNo} ({f.startTime}–{f.endTime})</td>
                    <td className="py-3 px-4 text-slate-700">{f.gradeLevel} {f.sectionName}</td>
                    <td className="py-3 px-4 text-slate-600">{f.subject || '—'}</td>
                    <td className="py-3 px-4 text-slate-600">{f.originalTeacherName}</td>
                    <td className="py-3 px-4 text-slate-600">{f.substituteTeacherName || '—'}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 border rounded-full text-xs font-medium ${STATUS_STYLE[f.status]}`}>{f.status}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                        {f.status === 'open' && (
                          <button onClick={() => setAssignFixture(f)} className="px-2 py-1 text-xs bg-blue-50 hover:bg-blue-100 text-[#0C447C] rounded font-medium">Find Substitute</button>
                        )}
                        {f.status === 'assigned' && (
                          <>
                            <button onClick={() => completeMut.mutate(f._id)} className="px-2 py-1 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded font-medium">Mark Taught</button>
                            <button onClick={() => cancelMut.mutate(f._id)} className="px-2 py-1 text-xs bg-red-50 hover:bg-red-100 text-red-600 rounded font-medium">Cancel</button>
                          </>
                        )}
                        {f.status === 'open' && (
                          <button onClick={() => cancelMut.mutate(f._id)} className="px-2 py-1 text-xs text-slate-400 hover:bg-slate-100 rounded">Cancel</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
