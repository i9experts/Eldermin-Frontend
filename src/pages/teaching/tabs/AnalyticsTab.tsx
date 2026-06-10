import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import teachingService from '../../../services/teaching.service';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const NAVY  = '#0C447C';
const AMBER = '#EF9F27';
const GREEN = '#10b981';
const RED   = '#ef4444';
const PURPLE= '#8b5cf6';
const BLUE  = '#3b82f6';

const PIE_COLORS = [GREEN, AMBER, RED, BLUE, PURPLE];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function Spin() {
  return (
    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
      <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}

function KpiCard({ label, value, sub, color = NAVY }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="h-1 rounded-t-xl" style={{ background: color }} />
      <div className="p-4">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</div>
        <div className="text-2xl font-bold text-slate-800 mt-1" style={{ color }}>{value}</div>
        {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
      </div>
    </div>
  );
}

function ChartCard({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="font-semibold text-slate-800 text-sm">{title}</div>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function PBar({ pct, color = NAVY }: { pct: number; color?: string }) {
  return (
    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
      <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
    </div>
  );
}

// ─── COMPUTED HELPERS ─────────────────────────────────────────────────────────

function computeSubjectCoverage(syllabus: any[]) {
  const bySubject: Record<string, number[]> = {};
  for (const s of syllabus) {
    if (!s.subject) continue;
    if (!bySubject[s.subject]) bySubject[s.subject] = [];
    bySubject[s.subject].push(s.coveragePct || 0);
  }
  return Object.entries(bySubject).map(([subject, pcts]) => ({
    subject: subject.length > 8 ? subject.slice(0, 7) + '…' : subject,
    pct: Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length),
  })).sort((a, b) => b.pct - a.pct).slice(0, 8);
}

function computeLPCompliance(lessonPlans: any[]) {
  const approved = lessonPlans.filter(p => p.status === 'approved').length;
  const submitted = lessonPlans.filter(p => p.status === 'submitted').length;
  const rejected = lessonPlans.filter(p => p.status === 'rejected').length;
  const overdue  = lessonPlans.filter(p => p.status === 'overdue').length;
  const draft    = lessonPlans.filter(p => p.status === 'draft').length;
  return [
    { name: 'Approved', value: approved, color: GREEN  },
    { name: 'Pending',  value: submitted, color: BLUE  },
    { name: 'Rejected', value: rejected, color: RED   },
    { name: 'Overdue',  value: overdue,  color: AMBER },
    { name: 'Draft',    value: draft,    color: '#e2e6f0' },
  ].filter(d => d.value > 0);
}

function computeAssignmentTypes(assignments: any[]) {
  const counts: Record<string, number> = {};
  for (const a of assignments) {
    const t = a.type || 'other';
    counts[t] = (counts[t] || 0) + 1;
  }
  return Object.entries(counts).map(([name, value]) => ({ name, value }));
}

function computeBehaviourSummary(behaviourNotes: any[]) {
  const pos  = behaviourNotes.filter(b => b.type === 'positive').length;
  const conc  = behaviourNotes.filter(b => b.type === 'concern').length;
  const ser   = behaviourNotes.filter(b => b.type === 'serious').length;
  const res   = behaviourNotes.filter(b => b.type === 'resolved').length;
  return [
    { name: 'Positive',  value: pos,  color: GREEN  },
    { name: 'Concern',   value: conc, color: AMBER  },
    { name: 'Serious',   value: ser,  color: RED    },
    { name: 'Resolved',  value: res,  color: BLUE   },
  ].filter(d => d.value > 0);
}

function computeTeacherLoad(teachers: any[]) {
  return teachers
    .filter(t => t.maxPeriodsPerWeek > 0)
    .map(t => ({
      name: `${t.firstName?.[0] || ''}. ${t.lastName || ''}`.trim(),
      current: t.currentPeriodsPerWeek || 0,
      max: t.maxPeriodsPerWeek || 30,
    }))
    .sort((a, b) => b.current - a.current)
    .slice(0, 8);
}

// ─── ANALYTICS TAB ────────────────────────────────────────────────────────────

export function TeachingAnalyticsTab() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['teaching-dashboard'],
    queryFn: teachingService.getDashboard,
  });

  const { data: teachers = [], isLoading: teachersLoading } = useQuery({
    queryKey: ['teachers'],
    queryFn: teachingService.getTeachers,
  });

  const { data: lessonPlans = [], isLoading: plansLoading } = useQuery({
    queryKey: ['lesson-plans'],
    queryFn: teachingService.getLessonPlans,
  });

  const { data: syllabus = [], isLoading: syllabusLoading } = useQuery({
    queryKey: ['syllabus'],
    queryFn: teachingService.getSyllabus,
  });

  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery({
    queryKey: ['assignments-all'],
    queryFn: teachingService.getAssignments,
  });

  const { data: behaviourNotes = [], isLoading: behaviourLoading } = useQuery({
    queryKey: ['behaviour'],
    queryFn: teachingService.getBehaviourNotes,
  });

  const isLoading = statsLoading || teachersLoading || plansLoading || syllabusLoading || assignmentsLoading || behaviourLoading;

  // Derived data
  const teacherList  = teachers as any[];
  const planList     = lessonPlans as any[];
  const syllabusList = syllabus as any[];
  const assignList   = assignments as any[];
  const behaviourList = behaviourNotes as any[];

  const subjectCoverage = computeSubjectCoverage(syllabusList);
  const lpCompliance    = computeLPCompliance(planList);
  const assignTypes     = computeAssignmentTypes(assignList);
  const behaviourSummary= computeBehaviourSummary(behaviourList);
  const teacherLoad     = computeTeacherLoad(teacherList);

  const present     = teacherList.filter(t => t.status === 'active').length;
  const absent      = teacherList.filter(t => t.status === 'absent').length;
  const onLeave     = teacherList.filter(t => t.status === 'on_leave').length;
  const attendanceRate = teacherList.length > 0 ? Math.round((present / teacherList.length) * 100) : 0;

  const avgCoverage = syllabusList.length > 0
    ? Math.round(syllabusList.reduce((sum, s) => sum + (s.coveragePct || 0), 0) / syllabusList.length)
    : 0;

  const overdueAssign = assignList.filter(a => a.status === 'overdue').length;
  const pendingPlans  = planList.filter(p => p.status === 'submitted').length;

  const teacherAttendancePie = [
    { name: 'Present', value: present, color: GREEN },
    { name: 'Absent', value: absent, color: RED },
    { name: 'On Leave', value: onLeave, color: AMBER },
  ].filter(d => d.value > 0);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Teaching Analytics</h1>
          <p className="text-sm text-slate-500 mt-0.5">Live data from all teaching modules</p>
        </div>
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Spin /> Loading data…
          </div>
        )}
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        <KpiCard label="Total Teachers"     value={stats?.totalTeachers ?? teacherList.length}       sub="Active teaching profiles"        color={NAVY}   />
        <KpiCard label="Attendance Today"   value={`${attendanceRate}%`} sub={`${present} present, ${absent} absent`} color={attendanceRate >= 90 ? GREEN : AMBER} />
        <KpiCard label="Avg Syllabus Cov."  value={`${avgCoverage}%`}    sub={`${syllabusList.length} records tracked`}  color={avgCoverage >= 75 ? GREEN : RED}   />
        <KpiCard label="Pending LP Approvals" value={pendingPlans}        sub="Plans awaiting review"                    color={pendingPlans > 0 ? AMBER : GREEN}  />
      </div>

      <div className="grid grid-cols-4 gap-3 mb-5">
        <KpiCard label="Total Lesson Plans" value={stats?.totalLessonPlans    ?? planList.length}      sub="All time"                color={NAVY}   />
        <KpiCard label="Total Assignments"  value={stats?.totalAssignments    ?? assignList.length}    sub="All types"               color={BLUE}   />
        <KpiCard label="Overdue Assignments"value={stats?.overdueAssignments  ?? overdueAssign}        sub="Need follow-up"          color={overdueAssign > 0 ? RED : GREEN} />
        <KpiCard label="Behaviour Notes"    value={stats?.behaviourNotes      ?? behaviourList.length} sub={`${stats?.positiveNotes ?? behaviourList.filter(b => b.type === 'positive').length} positive`} color={PURPLE} />
      </div>

      {/* Charts row 1 */}
      <div className="grid gap-4 mb-5" style={{ gridTemplateColumns: '2fr 1fr 1fr' }}>

        {/* Syllabus coverage by subject */}
        <ChartCard title="Syllabus Coverage — by Subject (avg %)" action={<span className="text-xs text-slate-400">{syllabusList.length} records</span>}>
          {subjectCoverage.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-slate-400 text-sm">No syllabus data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={subjectCoverage} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="subject" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} />
                <Tooltip formatter={(v: any) => [`${v}%`, 'Coverage']} />
                <Bar dataKey="pct" radius={[4, 4, 0, 0]} name="Coverage">
                  {subjectCoverage.map((d, i) => (
                    <Cell key={i} fill={d.pct >= 80 ? GREEN : d.pct >= 60 ? AMBER : RED} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Lesson plan compliance pie */}
        <ChartCard title="Lesson Plan Status">
          {lpCompliance.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-slate-400 text-sm">No lesson plans yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={lpCompliance} dataKey="value" innerRadius={45} outerRadius={65}>
                  {lpCompliance.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Teacher attendance pie */}
        <ChartCard title="Teacher Attendance Today">
          {teacherAttendancePie.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-slate-400 text-sm">No teacher data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={teacherAttendancePie} dataKey="value" innerRadius={45} outerRadius={65}>
                  {teacherAttendancePie.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-2 gap-4 mb-5">

        {/* Teacher workload bars */}
        <ChartCard title="Teacher Workload — Periods/Week (Current vs Max)">
          {teacherLoad.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-slate-400 text-sm">No teachers yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={teacherLoad} layout="vertical" margin={{ top: 0, right: 10, left: 30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={60} />
                <Tooltip />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="max"     fill={`${NAVY}22`}    radius={[0,4,4,0]} name="Max"     />
                <Bar dataKey="current" fill={NAVY}           radius={[0,4,4,0]} name="Current" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Assignment type breakdown */}
        <ChartCard title="Assignment Types Breakdown">
          {assignTypes.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-slate-400 text-sm">No assignments yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={assignTypes} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="value" name="Count" radius={[4, 4, 0, 0]}>
                  {assignTypes.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Behaviour + Syllabus track status */}
      <div className="grid grid-cols-2 gap-4 mb-5">

        {/* Behaviour summary */}
        <ChartCard title="Behaviour & Tarbiyah Notes">
          {behaviourSummary.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-slate-400 text-sm">No behaviour notes yet</div>
          ) : (
            <div className="space-y-3">
              {behaviourSummary.map(b => (
                <div key={b.name} className="flex items-center gap-3">
                  <div className="text-xs text-slate-500 w-20">{b.name}</div>
                  <div className="flex-1">
                    <PBar
                      pct={behaviourList.length > 0 ? Math.round((b.value / behaviourList.length) * 100) : 0}
                      color={b.color}
                    />
                  </div>
                  <div className="text-xs font-semibold w-8 text-right" style={{ color: b.color }}>{b.value}</div>
                </div>
              ))}
            </div>
          )}
        </ChartCard>

        {/* Syllabus track status breakdown */}
        <ChartCard title="Syllabus Track Status">
          {syllabusList.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-slate-400 text-sm">No syllabus records yet</div>
          ) : (() => {
            const trackGroups = [
              { key: 'on_track',    label: 'On Track',    color: GREEN },
              { key: 'behind',      label: 'Behind',      color: RED   },
              { key: 'completed',   label: 'Completed',   color: BLUE  },
              { key: 'not_started', label: 'Not Started', color: '#aaa'},
            ];
            return (
              <div className="space-y-3">
                {trackGroups.map(g => {
                  const count = syllabusList.filter(s => s.trackStatus === g.key).length;
                  const pct = Math.round((count / syllabusList.length) * 100);
                  return (
                    <div key={g.key} className="flex items-center gap-3">
                      <div className="text-xs text-slate-500 w-20">{g.label}</div>
                      <div className="flex-1"><PBar pct={pct} color={g.color} /></div>
                      <div className="text-xs font-semibold w-8 text-right" style={{ color: g.color }}>{count}</div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </ChartCard>
      </div>

      {/* AI-style insight cards */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="font-semibold text-slate-800 text-sm">Insights & Recommendations</div>
          <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-full text-xs font-medium">AI</span>
        </div>
        <div className="p-4 space-y-3">
          {pendingPlans > 0 && (
            <div className="p-3 bg-amber-50 rounded-lg border-l-4 border-amber-400">
              <div className="text-xs font-semibold text-amber-800 mb-1">📋 Lesson Plans Pending Approval</div>
              <div className="text-xs text-slate-600">
                {pendingPlans} lesson plan{pendingPlans !== 1 ? 's' : ''} awaiting review. Timely approval keeps teachers on track and syllabus delivery on schedule.
              </div>
            </div>
          )}
          {overdueAssign > 0 && (
            <div className="p-3 bg-red-50 rounded-lg border-l-4 border-red-400">
              <div className="text-xs font-semibold text-red-800 mb-1">⚠ Overdue Assignments</div>
              <div className="text-xs text-slate-600">
                {overdueAssign} assignment{overdueAssign !== 1 ? 's are' : ' is'} overdue. Follow up with teachers on student submissions and update statuses.
              </div>
            </div>
          )}
          {avgCoverage < 60 && syllabusList.length > 0 && (
            <div className="p-3 bg-red-50 rounded-lg border-l-4 border-red-400">
              <div className="text-xs font-semibold text-red-800 mb-1">📚 Low Syllabus Coverage</div>
              <div className="text-xs text-slate-600">
                Average coverage is {avgCoverage}% — well below the recommended pace. Review lesson plans and consider additional teaching periods for lagging subjects.
              </div>
            </div>
          )}
          {avgCoverage >= 80 && syllabusList.length > 0 && (
            <div className="p-3 bg-emerald-50 rounded-lg border-l-4 border-emerald-400">
              <div className="text-xs font-semibold text-emerald-800 mb-1">✅ Strong Syllabus Progress</div>
              <div className="text-xs text-slate-600">
                Average coverage is {avgCoverage}% — well on track. Continue monitoring weaker subjects to ensure no class falls behind.
              </div>
            </div>
          )}
          {attendanceRate < 85 && teacherList.length > 0 && (
            <div className="p-3 bg-amber-50 rounded-lg border-l-4 border-amber-400">
              <div className="text-xs font-semibold text-amber-800 mb-1">📉 Teacher Attendance Below Threshold</div>
              <div className="text-xs text-slate-600">
                Today's attendance rate is {attendanceRate}%. Ensure substitute arrangements are in place for absent teachers to avoid disruption.
              </div>
            </div>
          )}
          {pendingPlans === 0 && overdueAssign === 0 && avgCoverage >= 60 && attendanceRate >= 85 && (
            <div className="p-3 bg-emerald-50 rounded-lg border-l-4 border-emerald-400">
              <div className="text-xs font-semibold text-emerald-800 mb-1">🎉 All Systems Healthy</div>
              <div className="text-xs text-slate-600">
                No critical issues detected. Attendance, syllabus coverage, and lesson plan compliance are all within healthy ranges.
              </div>
            </div>
          )}
          {teacherList.length === 0 && planList.length === 0 && syllabusList.length === 0 && (
            <div className="p-3 bg-slate-50 rounded-lg border-l-4 border-slate-300">
              <div className="text-xs font-semibold text-slate-600 mb-1">📊 No data yet</div>
              <div className="text-xs text-slate-500">
                Add teacher profiles, lesson plans, and syllabus records to see insights and recommendations here.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
