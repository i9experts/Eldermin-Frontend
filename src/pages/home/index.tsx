// ============================================================
// ERP HOME DASHBOARD — Education Operating System
// Eldermin ERP | Main Landing Screen After Login
// Role-based: Owner / Principal / Finance / Academic / Teacher
// ============================================================

import React, { useState, useEffect } from 'react';
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
        sub={`+${d.students.newThisMonth} this month`}
        icon={<Users size={18} />} color={C.blue} bg="bg-blue-50" trend={2.1}
        onClick={() => navigate('/students')} />
      <KPI title="Today's Attendance" value={`${d.attendance.today}%`}
        sub={`${d.attendance.present} present · ${d.attendance.absent} absent`}
        icon={<UserCheck size={18} />} color={C.emerald} bg="bg-emerald-50"
        onClick={() => navigate('/students')} />
      <KPI title="Fee Collected" value={`PKR ${(d.finance.collected / 1000000).toFixed(2)}M`}
        sub={`PKR ${(d.finance.outstanding / 1000).toFixed(0)}K outstanding`}
        icon={<DollarSign size={18} />} color={C.teal} bg="bg-teal-50" trend={8.3}
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
        sub={`${d.staff.teaching} teaching · ${d.staff.nonTeaching} admin`}
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
        <ResponsiveContainer width="100%" height={130}>
          <AreaChart data={ATTENDANCE_TREND}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
            <XAxis dataKey="day" tick={{ fontSize: 9 }} />
            <YAxis tick={{ fontSize: 9 }} domain={[85, 100]} />
            <Tooltip formatter={(v: any) => `${v}%`} />
            <Area type="monotone" dataKey="pct" stroke={C.emerald} fill={`${C.emerald}20`} strokeWidth={2} name="Attendance %" />
          </AreaChart>
        </ResponsiveContainer>
        <div className="flex justify-between mt-2 text-[10px] text-gray-500">
          <span>Week avg: <strong className="text-emerald-600">94.1%</strong></span>
          <a href="/students" className="text-[#1e3a5f] hover:underline">View All →</a>
        </div>
      </Card>

      {/* Fee Collection Trend */}
      <Card className="col-span-3">
        <SectionTitle title="Fee Collection (6 Months)" icon={<DollarSign size={13} />} />
        <ResponsiveContainer width="100%" height={130}>
          <BarChart data={FEE_TREND}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
            <XAxis dataKey="month" tick={{ fontSize: 9 }} />
            <YAxis tick={{ fontSize: 9 }} tickFormatter={(v: number) => `${(v/1000000).toFixed(1)}M`} />
            <Tooltip formatter={(v: any) => `PKR ${Number(v).toLocaleString()}`} />
            <Bar dataKey="collected" fill={C.navy} radius={[3, 3, 0, 0]} name="Collected" />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex justify-between mt-2 text-[10px] text-gray-500">
          <span>Outstanding: <strong className="text-red-500">PKR {(d.finance.outstanding/1000).toFixed(0)}K</strong></span>
          <a href="/finance" className="text-[#1e3a5f] hover:underline">Finance →</a>
        </div>
      </Card>

      {/* Grade Distribution */}
      <Card className="col-span-3">
        <SectionTitle title="Students by Grade" icon={<Users size={13} />} />
        <ResponsiveContainer width="100%" height={130}>
          <BarChart data={GRADE_DATA}>
            <XAxis dataKey="grade" tick={{ fontSize: 8 }} />
            <YAxis tick={{ fontSize: 8 }} />
            <Tooltip />
            <Bar dataKey="students" fill={C.indigo} radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
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
            { label: 'Teaching Mgmt', icon: <BookOpen size={14} />, href: '/teaching', count: '12 tabs live', color: C.blue, bg: 'bg-blue-50' },
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
        <AlertItem icon={<AlertTriangle size={12} />}
          text={`${d.behaviour.critical} critical behaviour incidents unresolved`}
          sub="Requires immediate principal attention" time="Now" type="critical" />
        <AlertItem icon={<Clock size={12} />}
          text={`${d.pendingApprovals} documents awaiting your approval`}
          sub="HR Policy, Curriculum Plan, Staff Contract" time="2h ago" type="warning" />
        <AlertItem icon={<DollarSign size={12} />}
          text="Fee collection below 80% for Grade 9"
          sub="PKR 87,000 outstanding" time="Today" type="warning" />
        <AlertItem icon={<CheckCircle size={12} />}
          text="Mid-term results published successfully"
          sub="Grade 7 & 8 — 156 students" time="Yesterday" type="success" />
      </Card>

      {/* Recent Activity */}
      <Card className="col-span-5">
        <SectionTitle title="Recent Activity" icon={<Activity size={13} />}
          action={<span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">● Live</span>} />
        <ActivityItem dot={C.emerald} text="New lead registered — Hamza Sheikh (Grade 5)"
          time="5m ago" module="Admissions" />
        <ActivityItem dot={C.blue} text="Attendance marked for Grade 9-A — 38/40 present"
          time="18m ago" module="Students" />
        <ActivityItem dot={C.purple} text="Tarbiyah assessment completed — Sara Khan (4.8/5)"
          time="1h ago" module="Behaviour" />
        <ActivityItem dot={C.amber} text="Fee collected — PKR 15,000 · Ali Hassan"
          time="2h ago" module="Finance" />
        <ActivityItem dot={C.red} text="Bullying incident reported — Grade 9 playground"
          time="3h ago" module="Behaviour" />
        <ActivityItem dot={C.teal} text="Lesson plan submitted — Mathematics Grade 8"
          time="3h ago" module="Teaching" />
        <ActivityItem dot={C.indigo} text="New application received — Maryam Hussain (Grade 7)"
          time="4h ago" module="Admissions" />
      </Card>

      {/* Today's Schedule / Quick Actions */}
      <Card className="col-span-3">
        <SectionTitle title="Today's Snapshot" icon={<Calendar size={13} />} />
        <div className="space-y-2.5 mb-4">
          {[
            { time: '08:00', event: 'Morning Assembly', status: 'done' },
            { time: '09:00', event: 'Grade 9 Mathematics', status: 'done' },
            { time: '11:00', event: 'Staff Meeting — HR', status: 'active' },
            { time: '12:30', event: 'Parent Meeting — Bilal Sr.', status: 'upcoming' },
            { time: '02:00', event: 'Counselling — Usman T.', status: 'upcoming' },
            { time: '03:30', event: 'Behaviour Review Board', status: 'upcoming' },
          ].map(s => (
            <div key={s.time} className="flex items-center gap-3">
              <span className="text-[9px] text-gray-400 w-10 flex-shrink-0">{s.time}</span>
              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0
                ${s.status === 'done' ? 'bg-gray-300' : s.status === 'active' ? 'bg-emerald-500 ring-2 ring-emerald-200' : 'bg-gray-200'}`} />
              <span className={`text-[10px] ${s.status === 'active' ? 'text-emerald-700 font-semibold' : s.status === 'done' ? 'text-gray-400 line-through' : 'text-gray-600'}`}>
                {s.event}
              </span>
            </div>
          ))}
        </div>
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
const FinanceDashboard: React.FC<{ navigate: (p: string) => void; d: any }> = ({ navigate, d }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-4 gap-4">
      <KPI title="Total Collected" value={`PKR ${(d.finance.collected/1000000).toFixed(2)}M`}
        sub="Academic Year 2025-26" icon={<DollarSign size={18} />} color={C.emerald} bg="bg-emerald-50" trend={8.3} />
      <KPI title="Outstanding Fees" value={`PKR ${(d.finance.outstanding/1000).toFixed(0)}K`}
        sub="Unpaid invoices" icon={<AlertTriangle size={18} />} color={C.red} bg="bg-red-50" urgent />
      <KPI title="This Month" value={`PKR ${(d.finance.collectedThisMonth/1000).toFixed(0)}K`}
        sub="Current month" icon={<TrendingUp size={18} />} color={C.blue} bg="bg-blue-50" trend={12.1} />
      <KPI title="Expenses" value={`PKR ${(d.finance.expenses/1000).toFixed(0)}K`}
        sub={`Net: PKR ${((d.finance.collected - d.finance.expenses)/1000000).toFixed(2)}M`}
        icon={<Activity size={18} />} color={C.amber} bg="bg-amber-50" />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <Card>
        <SectionTitle title="6-Month Fee Collection Trend" />
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={FEE_TREND}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
            <XAxis dataKey="month" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: number) => `${(v/1000000).toFixed(1)}M`} />
            <Tooltip formatter={(v: any) => `PKR ${Number(v).toLocaleString()}`} />
            <Area type="monotone" dataKey="collected" stroke={C.navy} fill={`${C.navy}15`} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </Card>
      <Card>
        <SectionTitle title="Fee Status Distribution" />
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={[
              { name: 'Paid', value: 72, fill: C.emerald },
              { name: 'Pending', value: 18, fill: C.amber },
              { name: 'Overdue', value: 10, fill: C.red },
            ]} dataKey="value" cx="50%" cy="50%" outerRadius={70}
              label={({ name, value }) => `${name}: ${value}%`} labelLine={false}>
              {[C.emerald, C.amber, C.red].map((c, i) => <Cell key={i} fill={c} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </Card>
    </div>
  </div>
);

// ── Teacher Dashboard ─────────────────────────────────────────
const TeacherDashboard: React.FC<{ navigate: (p: string) => void }> = ({ navigate }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-4 gap-4">
      <KPI title="My Classes Today" value="6" sub="Grade 7A · 8B · 9A · 9B · 10A · 10B"
        icon={<BookOpen size={18} />} color={C.blue} bg="bg-blue-50" />
      <KPI title="Attendance Marked" value="4/6" sub="2 classes remaining"
        icon={<UserCheck size={18} />} color={C.amber} bg="bg-amber-50" urgent />
      <KPI title="Pending Assessments" value="3" sub="Marks to enter"
        icon={<ClipboardList size={18} />} color={C.purple} bg="bg-purple-50" />
      <KPI title="Lesson Plans" value="12/18" sub="6 submissions due"
        icon={<PenLine size={18} />} color={C.emerald} bg="bg-emerald-50" />
    </div>

    <div className="grid grid-cols-3 gap-4">
      <Card className="col-span-2">
        <SectionTitle title="Today's Timetable" icon={<Calendar size={13} />} />
        <div className="space-y-2">
          {[
            { period: '1st', time: '08:00–08:45', class: 'Grade 9A', subject: 'Mathematics', room: 'Room 12', status: 'completed' },
            { period: '2nd', time: '08:45–09:30', class: 'Grade 7B', subject: 'Mathematics', room: 'Room 8', status: 'completed' },
            { period: '3rd', time: '09:30–10:15', class: 'Grade 10A', subject: 'Mathematics', room: 'Room 15', status: 'active' },
            { period: '4th', time: '10:30–11:15', class: 'Grade 8B', subject: 'Mathematics', room: 'Room 9', status: 'upcoming' },
            { period: '5th', time: '11:15–12:00', class: 'Grade 9B', subject: 'Mathematics', room: 'Room 12', status: 'upcoming' },
            { period: '6th', time: '01:00–01:45', class: 'Grade 10B', subject: 'Mathematics', room: 'Room 15', status: 'upcoming' },
          ].map(p => (
            <div key={p.period} className={`flex items-center gap-4 p-3 rounded-xl border transition-all
              ${p.status === 'active' ? 'bg-emerald-50 border-emerald-200' :
                p.status === 'completed' ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-gray-100'}`}>
              <div className="text-center w-8">
                <p className="text-[9px] text-gray-400 font-bold">{p.period}</p>
              </div>
              <div className="text-[10px] text-gray-500 w-24">{p.time}</div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-800">{p.class} — {p.subject}</p>
                <p className="text-[10px] text-gray-400">{p.room}</p>
              </div>
              {p.status === 'active' && (
                <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-bold">Now</span>
              )}
              {p.status === 'upcoming' && (
                <button className="text-[10px] text-[#1e3a5f] border border-[#1e3a5f] px-2 py-0.5 rounded-lg hover:bg-blue-50 font-medium">
                  Mark Attendance
                </button>
              )}
            </div>
          ))}
        </div>
      </Card>

      <div className="space-y-4">
        <Card>
          <SectionTitle title="Pending Tasks" icon={<CheckCircle size={13} />} />
          <div className="space-y-2">
            {[
              { task: 'Enter mid-term marks — Grade 9A', module: 'Assessment', urgent: true },
              { task: 'Submit lesson plan — Week 7', module: 'Teaching', urgent: true },
              { task: 'Behaviour report — Usman T.', module: 'Behaviour', urgent: false },
              { task: 'Tarbiyah assessment — Grade 9', module: 'Tarbiyah', urgent: false },
            ].map((t, i) => (
              <div key={i} className={`flex items-start gap-2.5 p-2.5 rounded-lg ${t.urgent ? 'bg-red-50' : 'bg-gray-50'}`}>
                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${t.urgent ? 'bg-red-500' : 'bg-gray-400'}`} />
                <div>
                  <p className="text-[10px] font-medium text-gray-700">{t.task}</p>
                  <span className="text-[9px] bg-white text-gray-500 px-1.5 py-0.5 rounded border border-gray-200">{t.module}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionTitle title="My Students" icon={<Users size={13} />} />
          <div className="text-center py-3">
            <p className="text-3xl font-black text-[#1e3a5f]">247</p>
            <p className="text-[10px] text-gray-400">across 6 classes</p>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="bg-emerald-50 rounded-xl p-2 text-center">
                <p className="text-sm font-bold text-emerald-700">94%</p>
                <p className="text-[9px] text-gray-500">Avg Attendance</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-2 text-center">
                <p className="text-sm font-bold text-blue-700">71%</p>
                <p className="text-[9px] text-gray-500">Avg Score</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  </div>
);

// ── Academic Coordinator Dashboard ────────────────────────────
const AcademicDashboard: React.FC<{ navigate: (p: string) => void; d: any }> = ({ navigate, d }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-4 gap-4">
      <KPI title="Assessments" value={d.assessments.total}
        sub={`${d.assessments.published} published · ${d.assessments.ongoing} active`}
        icon={<ClipboardList size={18} />} color={C.blue} bg="bg-blue-50" />
      <KPI title="Avg School Performance" value="68.4%"
        sub="Across all subjects & grades"
        icon={<TrendingUp size={18} />} color={C.purple} bg="bg-purple-50" />
      <KPI title="At-Risk Students" value="12"
        sub="Below 50% in assessments"
        icon={<AlertTriangle size={18} />} color={C.amber} bg="bg-amber-50" urgent />
      <KPI title="Syllabus Coverage" value="72%"
        sub="Avg across all grades"
        icon={<BookMarked size={18} />} color={C.emerald} bg="bg-emerald-50" />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <Card>
        <SectionTitle title="Subject-wise Performance" />
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={[
            { subject: 'English', avg: 72 }, { subject: 'Math', avg: 65 },
            { subject: 'Science', avg: 68 }, { subject: 'Urdu', avg: 75 },
            { subject: 'Islamiat', avg: 82 }, { subject: 'SST', avg: 70 },
          ]}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
            <XAxis dataKey="subject" tick={{ fontSize: 9 }} />
            <YAxis tick={{ fontSize: 9 }} domain={[0, 100]} />
            <Tooltip formatter={(v: any) => `${v}%`} />
            <Bar dataKey="avg" fill={C.indigo} radius={[3, 3, 0, 0]} name="Avg %" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
      <Card>
        <SectionTitle title="Grade-wise Pass Rates" />
        <div className="space-y-2.5 mt-2">
          {[
            { grade: 'Grade 5', rate: 94, students: 72 },
            { grade: 'Grade 7', rate: 88, students: 78 },
            { grade: 'Grade 9', rate: 82, students: 88 },
            { grade: 'Grade 10', rate: 79, students: 74 },
          ].map(g => (
            <div key={g.grade} className="flex items-center gap-3">
              <span className="text-xs text-gray-600 w-20">{g.grade}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                <div className="h-2.5 rounded-full" style={{ width: `${g.rate}%`, backgroundColor: g.rate >= 85 ? C.emerald : g.rate >= 70 ? C.amber : C.red }} />
              </div>
              <span className="text-xs font-bold text-gray-700 w-10 text-right">{g.rate}%</span>
            </div>
          ))}
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

  const D = {
    school: { name: 'Demo School', logo: null, academicYear: '2025-26', campus: 'Main Campus' },
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
    staff: { total: 0, teaching: 0, nonTeaching: 0 },
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
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1e3a5f] to-indigo-500 flex items-center justify-center text-white text-xs font-bold">A</div>
              <div className="hidden md:block">
                <p className="text-[10px] font-bold text-gray-800">Admin User</p>
                <p className="text-[9px] text-gray-400">admin@demo-school.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── WELCOME STRIP ─────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-[#1e3a5f] via-[#1e3a5f] to-[#2563eb] px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-white">
              {greeting()}, Admin 👋
            </h1>
            <p className="text-blue-300 text-xs mt-0.5">
              {time.toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} ·
              Academic Year {D.school.academicYear} · {D.school.campus}
            </p>
          </div>
          <div className="flex items-center gap-6">
            {[
              { label: 'Today Present', value: `${D.attendance.today}%`, color: 'text-emerald-400' },
              { label: 'Outstanding Fees', value: `PKR ${(D.finance.outstanding/1000).toFixed(0)}K`, color: 'text-amber-400' },
              { label: 'Pending Approvals', value: D.pendingApprovals, color: 'text-blue-300' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
                <p className="text-blue-400 text-[9px]">{s.label}</p>
              </div>
            ))}
          </div>
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

      {/* ── CONTENT ───────────────────────────────────────────── */}
      <div className="flex-1 p-6">
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
