// ============================================================
// ERP HOME DASHBOARD — Education Operating System
// Eldermin ERP | Main Landing Screen After Login
// Role-based: Owner / Principal / Finance / Academic / Teacher
// ============================================================

import React, { useState, useEffect } from 'react';
import { useNavigate as useReactNavigate } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Users, GraduationCap, DollarSign, BookOpen, Heart,
  ClipboardList, FileText, Shield, BarChart2, TrendingUp,
  Bell, CheckCircle, AlertTriangle, Clock, Calendar,
  ChevronRight, Plus, Search, Settings, LogOut,
  Building2, Star, Award, Activity, Zap, ArrowUpRight,
  ArrowDownRight, Globe, MessageSquare, Eye, RefreshCw,
  UserCheck, BookMarked, PenLine, Layers, ChevronDown,
} from 'lucide-react';
import { useStudentDashboard } from '../../hooks/useStudents';
import { useAdmissionDashboard } from '../../hooks/useAdmissions';
import { useFinanceDashboard } from '../../hooks/useFinance';
import { useStaffList } from '../../hooks/useStaffList';
import { useAuth } from '../../contexts/AuthContext';
import { useBehaviourDashboard } from '../../hooks/useBehaviour';
import { useAssessmentDashboard } from '../../hooks/useAssessments';

// ── Types ─────────────────────────────────────────────────────
type UserRole = 'owner' | 'principal' | 'finance' | 'academic' | 'teacher' | 'parent';

// ── Color System ──────────────────────────────────────────────
const C = {
  navy: '#1e3a5f', emerald: '#10b981', amber: '#f59e0b',
  red: '#ef4444', blue: '#3b82f6', purple: '#8b5cf6',
  teal: '#14b8a6', indigo: '#6366f1', pink: '#ec4899',
};

// ── Shared Components ─────────────────────────────────────────
const KPI: React.FC<{
  title: string; value: string | number; sub?: string;
  icon: React.ReactNode; color: string; bg: string;
  trend?: number; onClick?: () => void; urgent?: boolean;
}> = ({ title, value, sub, icon, color, bg, trend, onClick, urgent }) => (
  <div
    onClick={onClick}
    className={`bg-white rounded-2xl border p-5 shadow-sm transition-all
      ${onClick ? 'cursor-pointer hover:shadow-lg hover:-translate-y-0.5' : 'hover:shadow-md'}
      ${urgent ? 'border-red-200 ring-1 ring-red-200' : 'border-gray-100'}`}
  >
    <div className="flex items-start justify-between">
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{title}</p>
        <p className={`text-2xl font-black mt-1 ${urgent ? 'text-red-600' : 'text-gray-900'}`}>{value}</p>
        {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
        {trend !== undefined && (
          <div className={`flex items-center gap-1 mt-1.5 text-[10px] font-semibold ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {trend >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
            {Math.abs(trend)}% vs last month
          </div>
        )}
      </div>
      <div className={`${bg} rounded-xl p-3 flex-shrink-0 ml-3`} style={{ color }}>
        {icon}
      </div>
    </div>
  </div>
);

const SectionTitle: React.FC<{ title: string; action?: React.ReactNode; icon?: React.ReactNode }> = ({ title, action, icon }) => (
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2">
      {icon && <span className="text-gray-400">{icon}</span>}
      {title}
    </h2>
    {action}
  </div>
);

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl border border-gray-100 p-5 shadow-sm ${className}`}>
    {children}
  </div>
);

// ── Quick Action Button ───────────────────────────────────────
const QuickAction: React.FC<{
  label: string; icon: React.ReactNode; color: string;
  bg: string; href: string;
}> = ({ label, icon, color, bg, href }) => (
  <a href={href}
    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 border-transparent
      hover:border-current transition-all group ${bg}`}
    style={{ color }}>
    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-sm group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <span className="text-[10px] font-bold text-center leading-tight text-gray-600">{label}</span>
  </a>
);

// ── Module Shortcut ───────────────────────────────────────────
const ModuleCard: React.FC<{
  label: string; icon: React.ReactNode; href: string;
  count?: string; color: string; bg: string;
}> = ({ label, icon, href, count, color, bg }) => (
  <a href={href}
    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all group">
    <div className={`${bg} rounded-xl p-2.5 flex-shrink-0`} style={{ color }}>
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-semibold text-gray-700 truncate">{label}</p>
      {count && <p className="text-[10px] text-gray-400">{count}</p>}
    </div>
    <ChevronRight size={12} className="text-gray-300 group-hover:text-gray-500 flex-shrink-0" />
  </a>
);

// ── Alert Item ────────────────────────────────────────────────
const AlertItem: React.FC<{
  icon: React.ReactNode; text: string; sub: string;
  time: string; type: 'critical'|'warning'|'info'|'success';
}> = ({ icon, text, sub, time, type }) => {
  const cfg = {
    critical: 'bg-red-50 border-red-200 text-red-600',
    warning: 'bg-amber-50 border-amber-200 text-amber-600',
    info: 'bg-blue-50 border-blue-200 text-blue-600',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-600',
  }[type];
  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border ${cfg} mb-2 last:mb-0`}>
      <div className="flex-shrink-0 mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-800">{text}</p>
        <p className="text-[10px] text-gray-500 mt-0.5">{sub}</p>
      </div>
      <span className="text-[10px] text-gray-400 flex-shrink-0">{time}</span>
    </div>
  );
};

// ── Activity Item ─────────────────────────────────────────────
const ActivityItem: React.FC<{
  dot: string; text: string; time: string; module: string;
}> = ({ dot, text, time, module }) => (
  <div className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0`} style={{ backgroundColor: dot }} />
    <div className="flex-1 min-w-0">
      <p className="text-xs text-gray-700">{text}</p>
      <div className="flex items-center gap-2 mt-0.5">
        <span className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-medium">{module}</span>
        <span className="text-[10px] text-gray-400">{time}</span>
      </div>
    </div>
  </div>
);

// ── Chart data (static) ───────────────────────────────────────
const ATTENDANCE_TREND = [
  { day: 'Mon', pct: 95.1 }, { day: 'Tue', pct: 93.4 },
  { day: 'Wed', pct: 96.2 }, { day: 'Thu', pct: 91.8 },
  { day: 'Fri', pct: 94.2 },
];

const FEE_TREND = [
  { month: 'Sep', collected: 890000 }, { month: 'Oct', collected: 1020000 },
  { month: 'Nov', collected: 980000 }, { month: 'Dec', collected: 760000 },
  { month: 'Jan', collected: 1180000 }, { month: 'Feb', collected: 1240000 },
];

const GRADE_DATA = [
  { grade: 'G1', students: 72 }, { grade: 'G2', students: 68 },
  { grade: 'G3', students: 75 }, { grade: 'G4', students: 71 },
  { grade: 'G5', students: 69 }, { grade: 'G6', students: 82 },
  { grade: 'G7', students: 78 }, { grade: 'G8', students: 65 },
  { grade: 'G9', students: 88 }, { grade: 'G10', students: 74 },
];

// ── ROLE DASHBOARDS ───────────────────────────────────────────

// ── Owner / Principal Dashboard ───────────────────────────────
const OwnerDashboard: React.FC<{ navigate: (path: string) => void; d: any }> = ({ navigate, d }) => (
  <div className="space-y-6">
    {/* KPI Row 1 */}
    <div className="grid grid-cols-5 gap-4">
      <KPI title="Active Students" value={(d.students.active as number).toLocaleString()}
        sub={d.students.newThisMonth > 0 ? `+${d.students.newThisMonth} this month` : ''}
        icon={<Users size={18} />} color={C.blue} bg="bg-blue-50"
        onClick={() => navigate('/students')} />
      <KPI title="Today's Attendance" value={`${d.attendance.today}%`}
        sub={`${d.attendance.present} present · ${d.attendance.absent} absent`}
        icon={<UserCheck size={18} />} color={C.emerald} bg="bg-emerald-50"
        onClick={() => navigate('/students')} />
      <KPI title="Fee Collected" value={`PKR ${(d.finance.collected / 1000000).toFixed(2)}M`}
        sub={`PKR ${(d.finance.outstanding / 1000).toFixed(0)}K outstanding`}
        icon={<DollarSign size={18} />} color={C.teal} bg="bg-teal-50"
        onClick={() => navigate('/finance')} />
      <KPI title="New Admissions" value={d.admissions.enrolled}
        sub={`${d.admissions.leads} leads · ${d.admissions.conversion}%`}
        icon={<GraduationCap size={18} />} color={C.purple} bg="bg-purple-50"
        onClick={() => navigate('/admissions')} />
      <KPI title="Critical Alerts" value={d.behaviour.critical}
        sub="Unresolved behaviour issues"
        icon={<AlertTriangle size={18} />} color={C.red} bg="bg-red-50"
        urgent={d.behaviour.critical > 0} onClick={() => navigate('/behaviour')} />
    </div>

    {/* KPI Row 2 */}
    <div className="grid grid-cols-5 gap-4">
      <KPI title="Total Staff" value={d.staff.total}
        sub="Active staff members"
        icon={<Users size={16} />} color={C.indigo} bg="bg-indigo-50"
        onClick={() => navigate('/hr')} />
      <KPI title="Assessments" value={d.assessments.total}
        sub={`${d.assessments.published} published · ${d.assessments.ongoing} ongoing`}
        icon={<ClipboardList size={16} />} color={C.amber} bg="bg-amber-50"
        onClick={() => navigate('/assessments')} />
      <KPI title="Behaviour Positivity"
        value={`${(d.behaviour.positive + d.behaviour.negative) > 0 ? ((d.behaviour.positive / (d.behaviour.positive + d.behaviour.negative)) * 100).toFixed(0) : 0}%`}
        sub={`${d.behaviour.positive}+ / ${d.behaviour.negative}-`}
        icon={<Heart size={16} />} color={C.pink} bg="bg-pink-50"
        onClick={() => navigate('/behaviour')} />
      <KPI title="Pending Approvals" value={d.pendingApprovals}
        sub="Documents & workflows"
        icon={<FileText size={16} />} color={C.amber} bg="bg-orange-50"
        urgent={d.pendingApprovals > 0} onClick={() => navigate('/documents')} />
      <KPI title="Tarbiyah Score" value={`${d.behaviour.tarbiyahAvg}/5`}
        sub="School-wide average"
        icon={<Star size={16} />} color={C.emerald} bg="bg-emerald-50"
        onClick={() => navigate('/behaviour')} />
    </div>

    {/* Charts + Modules Row */}
    <div className="grid grid-cols-12 gap-4">
      {/* Attendance Trend */}
      <Card className="col-span-3">
        <SectionTitle title="Attendance This Week" icon={<UserCheck size={13} />} />
        <div className="h-[130px] flex items-center justify-center">
          <p className="text-[11px] text-gray-400 text-center px-4">Historical trend needs a few days of attendance data to show.</p>
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-gray-500">
          <span>Today: <strong className="text-emerald-600">{d.attendance.today}%</strong></span>
          <a href="/students" className="text-[#1e3a5f] hover:underline">View All →</a>
        </div>
      </Card>

      {/* Fee Collection Trend */}
      <Card className="col-span-3">
        <SectionTitle title="Fee Collection (6 Months)" icon={<DollarSign size={13} />} />
        <div className="h-[130px] flex items-center justify-center">
          <p className="text-[11px] text-gray-400 text-center px-4">Monthly trend builds up as terms progress.</p>
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-gray-500">
          <span>Outstanding: <strong className="text-red-500">PKR {(d.finance.outstanding/1000).toFixed(0)}K</strong></span>
          <a href="/finance" className="text-[#1e3a5f] hover:underline">Finance →</a>
        </div>
      </Card>

      {/* Grade Distribution */}
      <Card className="col-span-3">
        <SectionTitle title="Students by Grade" icon={<Users size={13} />} />
        <div className="h-[130px] flex items-center justify-center">
          <p className="text-[11px] text-gray-400 text-center px-4">{d.students.active > 0 ? 'Grade breakdown coming soon.' : 'No students enrolled yet.'}</p>
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-gray-500">
          <span>Total: <strong className="text-[#1e3a5f]">{d.students.active}</strong></span>
          <a href="/students" className="text-[#1e3a5f] hover:underline">Manage →</a>
        </div>
      </Card>

      {/* Module Shortcuts */}
      <Card className="col-span-3">
        <SectionTitle title="Quick Navigate" />
        <div className="space-y-0.5">
          {[
            { label: 'Admissions', icon: <GraduationCap size={14} />, href: '/admissions', count: `${d.admissions.applications} applications`, color: C.purple, bg: 'bg-purple-50' },
            { label: 'Teaching Mgmt', icon: <BookOpen size={14} />, href: '/teaching', count: 'Lesson plans & gradebook', color: C.blue, bg: 'bg-blue-50' },
            { label: 'Academics', icon: <Layers size={14} />, href: '/academics', count: 'Curriculum · Timetable', color: C.teal, bg: 'bg-teal-50' },
            { label: 'Documents', icon: <FileText size={14} />, href: '/documents', count: `${d.pendingApprovals} pending`, color: C.amber, bg: 'bg-amber-50' },
            { label: 'Analytics', icon: <BarChart2 size={14} />, href: '/analytics', count: 'Live intelligence', color: C.indigo, bg: 'bg-indigo-50' },
          ].map(m => <ModuleCard key={m.label} {...m} />)}
        </div>
      </Card>
    </div>

    {/* Bottom Row */}
    <div className="grid grid-cols-12 gap-4">
      {/* Alerts */}
      <Card className="col-span-4">
        <SectionTitle title="Alerts & Notifications"
          icon={<Bell size={13} />}
          action={<span className="text-[10px] text-red-500 font-bold bg-red-50 px-2 py-0.5 rounded-full">{d.behaviour.critical + d.pendingApprovals} active</span>} />
        {(d.behaviour.critical + d.pendingApprovals) === 0 ? (
          <p className="text-[11px] text-gray-400 py-6 text-center">No active alerts right now.</p>
        ) : (
          <>
            {d.behaviour.critical > 0 && (
              <AlertItem icon={<AlertTriangle size={12} />}
                text={`${d.behaviour.critical} critical behaviour incidents unresolved`}
                sub="Requires immediate principal attention" time="Now" type="critical" />
            )}
            {d.pendingApprovals > 0 && (
              <AlertItem icon={<Clock size={12} />}
                text={`${d.pendingApprovals} documents awaiting your approval`}
                sub="Check Documents & Workflow" time="Today" type="warning" />
            )}
          </>
        )}
      </Card>

      {/* Recent Activity */}
      <Card className="col-span-5">
        <SectionTitle title="Recent Activity" icon={<Activity size={13} />} />
        <p className="text-[11px] text-gray-400 py-8 text-center">A live activity feed across modules is coming soon.</p>
      </Card>

      {/* Today's Schedule / Quick Actions */}
      <Card className="col-span-3">
        <SectionTitle title="Today's Snapshot" icon={<Calendar size={13} />} />
        <p className="text-[11px] text-gray-400 py-4 text-center">Today's schedule integration is coming soon.</p>
        <div className="pt-3 border-t border-gray-100">
          <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Quick Actions</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Add Student', icon: <Plus size={12} />, color: 'text-blue-600 bg-blue-50 hover:bg-blue-100' },
              { label: 'Record Fee', icon: <DollarSign size={12} />, color: 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' },
              { label: 'New Lead', icon: <UserCheck size={12} />, color: 'text-purple-600 bg-purple-50 hover:bg-purple-100' },
              { label: 'Log Incident', icon: <AlertTriangle size={12} />, color: 'text-red-600 bg-red-50 hover:bg-red-100' },
            ].map(a => (
              <button key={a.label} className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-[10px] font-semibold transition-colors ${a.color}`}>
                {a.icon} {a.label}
              </button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  </div>
);

// ── Finance Dashboard ─────────────────────────────────────────
const FinanceDashboard: React.FC<{ navigate: (p: string) => void; d: any }> = ({ navigate, d }) => {
  const byStatus = (d.finance.invoicesByStatus || []) as { _id: string; count: number; total: number }[];
  const statusColor: Record<string, string> = { paid: C.emerald, partial: C.amber, overdue: C.red, sent: C.blue };
  const totalInvoices = byStatus.reduce((a, s) => a + s.count, 0);

  return (
  <div className="space-y-6">
    <div className="grid grid-cols-4 gap-4">
      <KPI title="Total Collected" value={`PKR ${(d.finance.collected/1000000).toFixed(2)}M`}
        sub="Academic Year 2025-26" icon={<DollarSign size={18} />} color={C.emerald} bg="bg-emerald-50" />
      <KPI title="Outstanding Fees" value={`PKR ${(d.finance.outstanding/1000).toFixed(0)}K`}
        sub="Unpaid invoices" icon={<AlertTriangle size={18} />} color={C.red} bg="bg-red-50" urgent />
      <KPI title="This Month" value={`PKR ${(d.finance.collectedThisMonth/1000).toFixed(0)}K`}
        sub="Current month" icon={<TrendingUp size={18} />} color={C.blue} bg="bg-blue-50" />
      <KPI title="Expenses" value={`PKR ${(d.finance.expenses/1000).toFixed(0)}K`}
        sub={`Net: PKR ${((d.finance.collected - d.finance.expenses)/1000000).toFixed(2)}M`}
        icon={<Activity size={18} />} color={C.amber} bg="bg-amber-50" />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <Card>
        <SectionTitle title="Fee Collection Trend" />
        <div className="h-[200px] flex items-center justify-center">
          <p className="text-[11px] text-gray-400 text-center px-4">Monthly trend builds up as terms progress.</p>
        </div>
      </Card>
      <Card>
        <SectionTitle title="Fee Status Distribution" />
        {totalInvoices === 0 ? (
          <div className="h-[200px] flex items-center justify-center">
            <p className="text-[11px] text-gray-400">No invoices raised yet.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={byStatus.map(s => ({ name: s._id, value: s.count, fill: statusColor[s._id] || C.indigo }))}
                dataKey="value" cx="50%" cy="50%" outerRadius={70}
                label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                {byStatus.map((s, i) => <Cell key={i} fill={statusColor[s._id] || C.indigo} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )}
      </Card>
    </div>
  </div>
  );
};

// ── Teacher Dashboard ─────────────────────────────────────────
const TeacherDashboard: React.FC<{ navigate: (p: string) => void }> = ({ navigate }) => (
  <div className="space-y-6">
    <Card>
      <div className="flex flex-col items-center text-center py-12">
        <BookOpen size={32} className="text-gray-300 mb-3" />
        <p className="text-sm font-semibold text-gray-600 mb-1">A dedicated teacher dashboard is coming soon</p>
        <p className="text-xs text-gray-400 max-w-sm mb-5">
          Your own classes, today's timetable, lesson plans, and pending marks will show here.
          For now, use the modules directly:
        </p>
        <div className="flex gap-2 flex-wrap justify-center">
          <button onClick={() => navigate('/teaching')} className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg font-medium hover:bg-blue-100">Teaching Management</button>
          <button onClick={() => navigate('/assessments')} className="text-xs bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg font-medium hover:bg-purple-100">Assessments</button>
          <button onClick={() => navigate('/students')} className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg font-medium hover:bg-emerald-100">Students</button>
        </div>
      </div>
    </Card>
  </div>
);

// ── Academic Coordinator Dashboard ────────────────────────────
const AcademicDashboard: React.FC<{ navigate: (p: string) => void; d: any }> = ({ navigate, d }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-4 gap-4">
      <KPI title="Assessments" value={d.assessments.total}
        sub={`${d.assessments.published} published · ${d.assessments.ongoing} active`}
        icon={<ClipboardList size={18} />} color={C.blue} bg="bg-blue-50" />
      <KPI title="Avg School Performance" value="—"
        sub="Coming soon"
        icon={<TrendingUp size={18} />} color={C.purple} bg="bg-purple-50" />
      <KPI title="At-Risk Students" value="—"
        sub="Coming soon"
        icon={<AlertTriangle size={18} />} color={C.amber} bg="bg-amber-50" />
      <KPI title="Syllabus Coverage" value="—"
        sub="Coming soon — see Academics module"
        icon={<BookMarked size={18} />} color={C.emerald} bg="bg-emerald-50"
        onClick={() => navigate('/academics')} />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <Card>
        <SectionTitle title="Subject-wise Performance" />
        <div className="h-[200px] flex items-center justify-center">
          <p className="text-[11px] text-gray-400 text-center px-4">Cross-subject performance rollup is coming soon.</p>
        </div>
      </Card>
      <Card>
        <SectionTitle title="Grade-wise Pass Rates" />
        <div className="h-[200px] flex items-center justify-center">
          <p className="text-[11px] text-gray-400 text-center px-4">Grade-wise pass rate rollup is coming soon — see the Assessment module for real results.</p>
        </div>
      </Card>
    </div>
  </div>
);

// ============================================================
// MAIN HOME DASHBOARD COMPONENT
// ============================================================
const ROLES: { key: UserRole; label: string; icon: React.ReactNode }[] = [
  { key: 'owner', label: 'Owner / Principal', icon: <Building2 size={14} /> },
  { key: 'finance', label: 'Finance Manager', icon: <DollarSign size={14} /> },
  { key: 'academic', label: 'Academic Coordinator', icon: <BookOpen size={14} /> },
  { key: 'teacher', label: 'Teacher', icon: <PenLine size={14} /> },
];

const HomeDashboard: React.FC = () => {
  const [role, setRole] = useState<UserRole>('owner');
  const [showRolePicker, setShowRolePicker] = useState(false);
  const [time, setTime] = useState(new Date());

  const { data: studentData } = useStudentDashboard();
  const { data: admData } = useAdmissionDashboard();
  const { data: financeData } = useFinanceDashboard();
  const { data: behaviourData } = useBehaviourDashboard();
  const { data: assessmentData } = useAssessmentDashboard();
  const { data: staffData } = useStaffList();
  const { institution, user } = useAuth();

  const reactNavigate = useReactNavigate();

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const navigate = (path: string) => { window.location.href = path; };

  const greeting = () => {
    const h = time.getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const attPresent = (studentData as any)?.todayAttendance?.present ?? 0;
  const attAbsent = (studentData as any)?.todayAttendance?.absent ?? 0;
  const attTotal = attPresent + attAbsent;
  const attPct = attTotal > 0 ? parseFloat(((attPresent / attTotal) * 100).toFixed(1)) : 0;

  const activeStaffCount = Array.isArray(staffData) ? staffData.length : 0;

  const totalInvoiced = (financeData as any)?.summary?.totalInvoiced ?? 0;
  const totalCollected = (financeData as any)?.summary?.totalCollected ?? 0;
  const collectionRatePct = totalInvoiced > 0
    ? parseFloat(((totalCollected / totalInvoiced) * 100).toFixed(1))
    : 0;

  const D = {
    school: {
      name: institution?.name || 'Your School',
      logo: institution?.logoUrl || null,
      academicYear: '2025-26',
      campus: 'Main Campus',
    },
    students: {
      active: (studentData as any)?.students?.active ?? 0,
      male: (studentData as any)?.students?.male ?? 0,
      female: (studentData as any)?.students?.female ?? 0,
      newThisMonth: (studentData as any)?.students?.newThisMonth ?? 0,
    },
    attendance: { today: attPct, present: attPresent, absent: attAbsent },
    admissions: {
      leads: (admData as any)?.stats?.totalLeads ?? 0,
      applications: (admData as any)?.stats?.totalApplications ?? 0,
      enrolled: (admData as any)?.stats?.enrolled ?? 0,
      conversion: (admData as any)?.stats?.conversionRate ?? 0,
    },
    finance: {
      collected: (financeData as any)?.summary?.totalCollected ?? 0,
      outstanding: (financeData as any)?.summary?.totalOutstanding ?? 0,
      expenses: (financeData as any)?.summary?.expensesThisMonth ?? 0,
      collectedThisMonth: (financeData as any)?.summary?.collectedThisMonth ?? 0,
      invoicesByStatus: (financeData as any)?.invoicesByStatus ?? [],
    },
    assessments: {
      total: (assessmentData as any)?.stats?.total ?? 0,
      published: (assessmentData as any)?.stats?.published ?? 0,
      ongoing: (assessmentData as any)?.stats?.ongoing ?? 0,
    },
    behaviour: {
      positive: (behaviourData as any)?.stats?.positiveIncidents ?? 0,
      negative: (behaviourData as any)?.stats?.negativeIncidents ?? 0,
      critical: (behaviourData as any)?.stats?.unresolvedCritical ?? 0,
      tarbiyahAvg: (behaviourData as any)?.stats?.tarbiyahAvg ?? 0,
    },
    staff: { total: activeStaffCount, teaching: 0, nonTeaching: 0 },
    pendingApprovals: 0,
    overdueTasks: 0,
  };

  const currentRole = ROLES.find(r => r.key === role)!;

  return (
    <div className="flex flex-col min-h-full bg-gray-50">

      {/* ── TOP HEADER ───────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-4">
          {/* School Brand */}
          <div className="flex items-center gap-3 mr-4">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#1e3a5f] to-blue-500 flex items-center justify-center text-white text-sm font-bold">
              E
            </div>
            <div className="hidden md:block">
              <p className="text-xs font-bold text-gray-800">{D.school.name}</p>
              <p className="text-[9px] text-gray-400">{D.school.campus}</p>
            </div>
          </div>

          {/* Global Search */}
          <div className="flex-1 relative max-w-lg">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search students, staff, invoices, documents..."
              className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:bg-white focus:border-[#1e3a5f]/30 transition-all" />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded">⌘K</kbd>
          </div>

          <div className="flex items-center gap-2 ml-4">
            {/* Academic Year */}
            <select className="text-[10px] border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-600 bg-white focus:outline-none">
              <option>2025-26</option>
              <option>2024-25</option>
            </select>

            {/* Campus */}
            <select className="text-[10px] border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-600 bg-white focus:outline-none">
              <option>Main Campus</option>
              <option>North Campus</option>
            </select>

            {/* Notifications */}
            <button className="relative p-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              <Bell size={15} className="text-gray-500" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[8px] text-white flex items-center justify-center font-bold">
                {D.behaviour.critical + D.pendingApprovals}
              </span>
            </button>

            {/* Tasks */}
            <button className="relative p-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              <CheckCircle size={15} className="text-gray-500" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full text-[8px] text-white flex items-center justify-center font-bold">5</span>
            </button>

            {/* Role Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowRolePicker(!showRolePicker)}
                className="flex items-center gap-2 border border-[#1e3a5f]/30 bg-[#1e3a5f]/5 rounded-xl px-3 py-2 text-[10px] font-semibold text-[#1e3a5f] hover:bg-[#1e3a5f]/10 transition-colors">
                {currentRole.icon}
                {currentRole.label}
                <ChevronDown size={11} />
              </button>
              {showRolePicker && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-30 min-w-[200px]">
                  {ROLES.map(r => (
                    <button key={r.key} onClick={() => { setRole(r.key); setShowRolePicker(false); }}
                      className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs hover:bg-gray-50 first:rounded-t-xl last:rounded-b-xl transition-colors
                        ${role === r.key ? 'bg-blue-50 text-[#1e3a5f] font-semibold' : 'text-gray-700'}`}>
                      {r.icon} {r.label}
                      {role === r.key && <CheckCircle size={12} className="ml-auto text-emerald-500" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Profile */}
            <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1e3a5f] to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                {(user?.name || "?").charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:block">
                <p className="text-[10px] font-bold text-gray-800">{user?.name || "—"}</p>
                <p className="text-[9px] text-gray-400">{user?.email || "—"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── HERO BANNER ───────────────────────────────────────── */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #083460 0%, #0C447C 60%, #1a5a96 100%)', padding: '28px 32px' }}>
        <div className="absolute -right-10 -top-10 w-56 h-56 rounded-full" style={{ background: 'radial-gradient(circle, rgba(239,159,39,0.2) 0%, transparent 70%)' }} />
        <div className="absolute right-32 -bottom-16 w-40 h-40 rounded-full" style={{ background: 'radial-gradient(circle, rgba(239,159,39,0.1) 0%, transparent 70%)' }} />
        <div className="flex items-center gap-6 relative z-10">
          <div className="flex-1">
            <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-1.5">{greeting()}, Admin 👋</p>
            <h1 className="text-white text-2xl font-bold mb-1">{D.school.name}</h1>
            <p className="text-white/60 text-sm">Academic Year {D.school.academicYear} · {D.school.campus} · Education Operating System</p>
            <div className="flex gap-5 mt-4">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-white/70 text-xs">System <strong className="text-white">Online</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span className="text-white/70 text-xs"><strong className="text-white">{D.behaviour.critical + D.pendingApprovals}</strong> alerts today</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-white/70 text-xs">Last sync <strong className="text-white">2 min ago</strong></span>
              </div>
            </div>
          </div>
          <button
            onClick={() => reactNavigate('/setup-wizard')}
            className="bg-amber-400 hover:bg-amber-300 font-bold text-sm px-5 py-2.5 rounded-lg whitespace-nowrap transition-colors"
            style={{ color: '#083460' }}>
            ⚡ Setup Wizard
          </button>
        </div>
      </div>

      {/* ── QUICK ACTIONS STRIP ────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 px-6 py-3">
        <div className="flex items-center gap-3 overflow-x-auto pb-0.5">
          <span className="text-[10px] font-bold text-gray-400 uppercase whitespace-nowrap">Quick:</span>
          {[
            { label: 'New Lead', icon: <UserCheck size={12} />, href: '/admissions', color: 'bg-purple-50 text-purple-700 hover:bg-purple-100' },
            { label: 'Add Student', icon: <Plus size={12} />, href: '/students', color: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
            { label: 'Collect Fee', icon: <DollarSign size={12} />, href: '/finance', color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' },
            { label: 'Mark Attendance', icon: <UserCheck size={12} />, href: '/students', color: 'bg-teal-50 text-teal-700 hover:bg-teal-100' },
            { label: 'Log Incident', icon: <AlertTriangle size={12} />, href: '/behaviour', color: 'bg-red-50 text-red-700 hover:bg-red-100' },
            { label: 'New Assessment', icon: <ClipboardList size={12} />, href: '/assessments', color: 'bg-amber-50 text-amber-700 hover:bg-amber-100' },
            { label: 'Add Expense', icon: <Activity size={12} />, href: '/finance', color: 'bg-orange-50 text-orange-700 hover:bg-orange-100' },
            { label: 'Schedule Session', icon: <MessageSquare size={12} />, href: '/behaviour', color: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100' },
          ].map(a => (
            <a key={a.label} href={a.href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold whitespace-nowrap transition-colors ${a.color}`}>
              {a.icon} {a.label}
            </a>
          ))}
        </div>
      </div>

      {/* ── KPI CARDS ─────────────────────────────────────────── */}
      <div className="px-6 pt-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-700">📊 Institution Overview</h2>
          <a href="/analytics" className="text-xs text-[#0C447C] font-semibold hover:underline">View full analytics →</a>
        </div>
        <div className="grid grid-cols-4 gap-4 mb-6">
          <KPI title="Total Students" value={D.students.active}
            sub={D.students.newThisMonth > 0 ? `+${D.students.newThisMonth} this month` : ''}
            icon={<span className="text-lg">🧑‍🎓</span>} color={C.blue} bg="bg-blue-50"
            onClick={() => navigate('/students')} />
          <KPI title="Active Staff" value={activeStaffCount}
            sub=""
            icon={<span className="text-lg">👥</span>} color="#10b981" bg="bg-emerald-50"
            onClick={() => navigate('/hr')} />
          <KPI title="Fee Collection Rate" value={`${collectionRatePct}%`}
            sub=""
            icon={<span className="text-lg">💰</span>} color={C.amber} bg="bg-amber-50"
            onClick={() => navigate('/finance')} />
          <KPI title="Active Leads" value={D.admissions.leads}
            sub=""
            icon={<span className="text-lg">📝</span>} color={C.purple} bg="bg-purple-50"
            onClick={() => navigate('/admissions')} />
        </div>

        {/* ── ATTENDANCE + ALERTS ROW ──────────────────────────── */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {/* Attendance Widget */}
          <div className="col-span-2 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-700">📅 Today's Attendance</h3>
              <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">● Live</span>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-gray-600">Students</span>
                  <span className="text-xs font-bold text-gray-800">{attTotal > 0 ? `${attPct}%` : '—'}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 mb-1">
                  <div className="h-2 rounded-full bg-emerald-500 transition-all" style={{ width: `${attPct}%` }} />
                </div>
                <div className="flex gap-3 text-[10px] text-gray-400">
                  {attTotal > 0 ? (
                    <>
                      <span className="text-emerald-600 font-medium">{attPresent} present</span>
                      <span className="text-red-500 font-medium">{attAbsent} absent</span>
                    </>
                  ) : (
                    <span>No attendance marked yet today</span>
                  )}
                </div>
              </div>
              {['Teachers', 'Support Staff'].map(label => (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-gray-600">{label}</span>
                    <span className="text-[10px] text-gray-400 italic">Not yet tracked</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2" />
                </div>
              ))}
            </div>
          </div>

          {/* Priority Alerts Widget */}
          <div className="col-span-1 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-700">🔔 Priority Alerts</h3>
            </div>
            <div className="flex flex-col items-center justify-center text-center py-6">
              <p className="text-xs text-gray-400 max-w-[180px]">
                Alerts for overdue fees, syllabus delays, and pending approvals aren't wired up here yet.
              </p>
            </div>
          </div>
        </div>

        {/* ── QUICK ACTIONS GRID ──────────────────────────────── */}
        <div className="mb-6">
          <h2 className="text-sm font-bold text-gray-700 mb-3">⚡ Quick Actions</h2>
          <div className="grid grid-cols-8 gap-3">
            {[
              { label: 'Add Student',    icon: '🧑‍🎓', href: '/students',    color: '#3b82f6', bg: 'bg-blue-50' },
              { label: 'New Admission',  icon: '📋',   href: '/admissions',  color: '#8b5cf6', bg: 'bg-purple-50' },
              { label: 'Collect Fee',    icon: '💰',   href: '/finance',     color: '#10b981', bg: 'bg-emerald-50' },
              { label: 'Mark Attendance',icon: '✅',   href: '/students',    color: '#14b8a6', bg: 'bg-teal-50' },
              { label: 'New Document',   icon: '📁',   href: '/documents',   color: '#f59e0b', bg: 'bg-amber-50' },
              { label: 'Add Staff',      icon: '👤',   href: '/hr',          color: '#6366f1', bg: 'bg-indigo-50' },
              { label: 'Run Report',     icon: '📊',   href: '/analytics',   color: '#ec4899', bg: 'bg-pink-50' },
              { label: 'AI Insights',    icon: '🤖',   href: '/analytics',   color: '#083460', bg: 'bg-slate-50' },
            ].map(a => (
              <a key={a.label} href={a.href}
                className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border-2 border-transparent hover:border-current transition-all group ${a.bg}`}
                style={{ color: a.color }}>
                <span className="text-2xl group-hover:scale-110 transition-transform">{a.icon}</span>
                <span className="text-[10px] font-bold text-center leading-tight text-gray-600">{a.label}</span>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ── CONTENT ───────────────────────────────────────────── */}
      <div className="flex-1 px-6 pb-6">
        {role === 'owner' && <OwnerDashboard navigate={navigate} d={D} />}
        {role === 'principal' && <OwnerDashboard navigate={navigate} d={D} />}
        {role === 'finance' && <FinanceDashboard navigate={navigate} d={D} />}
        {role === 'academic' && <AcademicDashboard navigate={navigate} d={D} />}
        {role === 'teacher' && <TeacherDashboard navigate={navigate} />}
      </div>

      {/* ── ALL MODULES FOOTER ────────────────────────────────── */}
      <div className="bg-white border-t border-gray-100 px-6 py-4">
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-3">All Modules</p>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'Institution Setup', href: '/institution', icon: '🏛️' },
            { label: 'Staff & HR', href: '/hr', icon: '👥' },
            { label: 'Finance', href: '/finance', icon: '💰' },
            { label: 'Procurement', href: '/procurement', icon: '🛒' },
            { label: 'Campus Ops', href: '/campus', icon: '🏫' },
            { label: 'Admissions', href: '/admissions', icon: '📋' },
            { label: 'Teaching', href: '/teaching', icon: '📚' },
            { label: 'Academics', href: '/academics', icon: '🎓' },
            { label: 'Students', href: '/students', icon: '👨‍🎓' },
            { label: 'Assessment', href: '/assessments', icon: '📝' },
            { label: 'Behaviour', href: '/behaviour', icon: '❤️' },
            { label: 'Documents', href: '/documents', icon: '📁' },
            { label: 'Analytics', href: '/analytics', icon: '📊' },
            { label: 'Compliance', href: '/compliance', icon: '🛡️' },
          ].map(m => (
            <a key={m.label} href={m.href}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-[#1e3a5f] hover:text-white text-gray-600 rounded-lg text-[10px] font-medium transition-all border border-gray-100 hover:border-[#1e3a5f]">
              <span>{m.icon}</span> {m.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomeDashboard;
