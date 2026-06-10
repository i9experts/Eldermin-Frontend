// ============================================================
// ANALYTICS — OVERVIEW + ACADEMIC INTELLIGENCE TABS
// Eldermin ERP | React + TypeScript + Recharts
// ============================================================

import React from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  Users, GraduationCap, DollarSign, TrendingUp, BookOpen,
  CheckCircle, AlertTriangle, Award, Heart, Target,
  Calendar, BarChart2, Activity, Star, Zap, Shield,
} from 'lucide-react';
import {
  KPICard, SectionCard, EmptyChart, ProgressBar, COLORS, PIE_COLORS, SkeletonCard,
} from './types';

// ── OVERVIEW TAB ──────────────────────────────────────────────
interface OverviewTabProps {
  data: any;
  isLoading: boolean;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  const s = data?.studentStats;
  const a = data?.admissionDash;
  const f = data?.financeDash;
  const b = data?.behaviourDash;
  const as = data?.assessmentDash;

  const totalStudents = s?.students?.active || 0;
  const totalCollected = f?.summary?.totalCollected || 0;
  const totalOutstanding = f?.summary?.totalOutstanding || 0;
  const collectedThisMonth = f?.summary?.collectedThisMonth || 0;
  const expensesThisMonth = f?.summary?.expensesThisMonth || 0;
  const totalLeads = a?.stats?.totalLeads || 0;
  const enrolled = a?.stats?.enrolled || 0;
  const positiveIncidents = b?.stats?.positiveIncidents || 0;
  const negativeIncidents = b?.stats?.negativeIncidents || 0;
  const criticalUnresolved = b?.stats?.unresolvedCritical || 0;
  const avgAssessment = as?.stats?.totalMarksEntered || 0;

  // School Health Score
  const healthFactors = [
    { label: 'Fee Collection Rate', value: totalCollected > 0 ? Math.min(((totalCollected / (totalCollected + totalOutstanding)) * 100), 100) : 0, weight: 25 },
    { label: 'Attendance Rate', value: s?.todayAttendance?.total > 0 ? ((s.todayAttendance.present / s.todayAttendance.total) * 100) : 0, weight: 25 },
    { label: 'Behaviour Positivity', value: (positiveIncidents + negativeIncidents) > 0 ? (positiveIncidents / (positiveIncidents + negativeIncidents)) * 100 : 50, weight: 25 },
    { label: 'Admission Conversion', value: totalLeads > 0 ? (enrolled / totalLeads) * 100 * 5 : 0, weight: 25 },
  ];
  const healthScore = Math.round(healthFactors.reduce((acc, f) => acc + (Math.min(f.value, 100) * f.weight / 100), 0));

  const scoreColor = healthScore >= 80 ? COLORS.emerald : healthScore >= 60 ? COLORS.amber : COLORS.red;

  // Grade distribution for chart
  const gradeData = (s?.gradeDistribution || []).slice(0, 8).map((g: any) => ({
    grade: g._id?.replace('Grade ', 'G') || g._id,
    students: g.count,
  }));

  // Financial overview
  const financeData = [
    { name: 'Collected', value: totalCollected, fill: COLORS.emerald },
    { name: 'Outstanding', value: totalOutstanding, fill: COLORS.red },
    { name: 'Expenses', value: expensesThisMonth, fill: COLORS.amber },
  ];

  // Behaviour donut
  const behaviourPie = [
    { name: 'Positive', value: positiveIncidents, fill: COLORS.emerald },
    { name: 'Negative', value: negativeIncidents, fill: COLORS.red },
    { name: 'Neutral', value: b?.stats?.totalIncidents - positiveIncidents - negativeIncidents || 0, fill: COLORS.blue },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      {/* School Health Score Banner */}
      <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2563eb] rounded-xl p-5 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Institution Health Score</h2>
            <p className="text-blue-200 text-xs mt-0.5">Composite score across all operational areas</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-5xl font-black" style={{ color: scoreColor === COLORS.emerald ? '#6ee7b7' : scoreColor === COLORS.amber ? '#fcd34d' : '#fca5a5' }}>
                {healthScore}
              </p>
              <p className="text-blue-200 text-xs">/ 100</p>
            </div>
            <div className="space-y-2">
              {healthFactors.map(f => (
                <div key={f.label} className="flex items-center gap-2">
                  <span className="text-[10px] text-blue-200 w-28">{f.label}</span>
                  <div className="w-24 bg-white/20 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full bg-white transition-all"
                      style={{ width: `${Math.min(f.value, 100)}%` }} />
                  </div>
                  <span className="text-[10px] text-white font-medium">{Math.min(f.value, 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard title="Total Students" value={totalStudents.toLocaleString()}
          sub={`${s?.students?.male || 0} boys · ${s?.students?.female || 0} girls`}
          icon={<Users size={16} className="text-blue-500" />} iconBg="bg-blue-50" />
        <KPICard title="Fee Collected" value={`PKR ${(totalCollected / 1000).toFixed(0)}K`}
          sub={`PKR ${(totalOutstanding / 1000).toFixed(0)}K outstanding`}
          icon={<DollarSign size={16} className="text-emerald-500" />} iconBg="bg-emerald-50" />
        <KPICard title="New Admissions" value={enrolled}
          sub={`${totalLeads} leads · ${a?.stats?.conversionRate || 0}% conversion`}
          icon={<GraduationCap size={16} className="text-purple-500" />} iconBg="bg-purple-50" />
        <KPICard title="Critical Alerts" value={criticalUnresolved}
          sub="Unresolved behaviour issues"
          icon={<AlertTriangle size={16} className="text-red-500" />} iconBg="bg-red-50"
          alert={criticalUnresolved > 0} />
        <KPICard title="Today's Attendance" value={s?.todayAttendance?.total > 0 ? `${((s.todayAttendance.present / s.todayAttendance.total) * 100).toFixed(0)}%` : 'N/A'}
          sub={`${s?.todayAttendance?.present || 0} present · ${s?.todayAttendance?.absent || 0} absent`}
          icon={<CheckCircle size={16} className="text-teal-500" />} iconBg="bg-teal-50" />
        <KPICard title="Expenses This Month" value={`PKR ${(expensesThisMonth / 1000).toFixed(0)}K`}
          sub="Approved & paid expenses"
          icon={<Activity size={16} className="text-amber-500" />} iconBg="bg-amber-50" />
        <KPICard title="Behaviour Positivity" value={`${(positiveIncidents + negativeIncidents) > 0 ? ((positiveIncidents / (positiveIncidents + negativeIncidents)) * 100).toFixed(0) : 0}%`}
          sub={`${positiveIncidents} positive · ${negativeIncidents} negative`}
          icon={<Heart size={16} className="text-pink-500" />} iconBg="bg-pink-50" />
        <KPICard title="Active Interventions" value={b?.stats?.activeInterventions || 0}
          sub={`${b?.stats?.pendingCounselling || 0} counselling sessions`}
          icon={<Shield size={16} className="text-indigo-500" />} iconBg="bg-indigo-50" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-3 gap-4">
        <SectionCard title="Student Distribution" subtitle="By grade" height={220}>
          {gradeData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gradeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="grade" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} />
                <Tooltip />
                <Bar dataKey="students" fill={COLORS.primary} radius={[3, 3, 0, 0]} name="Students" />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart message="No students enrolled yet" />}
        </SectionCard>

        <SectionCard title="Financial Overview" subtitle="Revenue vs expenses" height={220}>
          {totalCollected > 0 || totalOutstanding > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={financeData} dataKey="value" cx="50%" cy="50%" outerRadius={80}
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                  {financeData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Pie>
                <Tooltip formatter={(v: any) => `PKR ${Number(v).toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyChart message="No financial data yet" />}
        </SectionCard>

        <SectionCard title="Behaviour Balance" subtitle="This academic year" height={220}>
          {behaviourPie.length > 0 ? (
            <div className="flex flex-col h-full">
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={behaviourPie} dataKey="value" cx="50%" cy="50%" outerRadius={60}>
                    {behaviourPie.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-2">
                {behaviourPie.map(d => (
                  <div key={d.name} className="flex items-center gap-1 text-[10px] text-gray-600">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.fill }} />
                    {d.name}: <strong>{d.value}</strong>
                  </div>
                ))}
              </div>
            </div>
          ) : <EmptyChart message="No behaviour records yet" />}
        </SectionCard>
      </div>

      {/* Quick Stats Table */}
      <div className="grid grid-cols-2 gap-4">
        <SectionCard title="Module Activity Summary" subtitle="Live data from all modules">
          <div className="space-y-2">
            {[
              { module: 'Admissions', metric: `${a?.stats?.totalApplications || 0} applications`, status: a?.stats?.enrolled > 0 ? 'active' : 'empty', value: a?.stats?.enrolled || 0, max: a?.stats?.totalApplications || 1 },
              { module: 'Finance', metric: `PKR ${(totalCollected / 1000).toFixed(0)}K collected`, status: totalCollected > 0 ? 'active' : 'empty', value: totalCollected, max: totalCollected + totalOutstanding || 1 },
              { module: 'Assessment', metric: `${as?.stats?.totalMarksEntered || 0} marks entered`, status: as?.stats?.total > 0 ? 'active' : 'empty', value: as?.stats?.completed || 0, max: as?.stats?.total || 1 },
              { module: 'Behaviour', metric: `${b?.stats?.totalIncidents || 0} total records`, status: b?.stats?.totalIncidents > 0 ? 'active' : 'empty', value: positiveIncidents, max: b?.stats?.totalIncidents || 1 },
              { module: 'Documents', metric: 'Workflow system active', status: 'active', value: 1, max: 1 },
            ].map(r => (
              <div key={r.module} className="flex items-center gap-3 py-1.5 border-b border-gray-50 last:border-0">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${r.status === 'active' ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                <span className="text-xs font-medium text-gray-700 w-28">{r.module}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                  <div className="h-1.5 rounded-full bg-[#1e3a5f]" style={{ width: `${Math.min((r.value / r.max) * 100, 100)}%` }} />
                </div>
                <span className="text-[10px] text-gray-500 text-right w-32">{r.metric}</span>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Alerts & Action Required" subtitle="Needs your attention">
          <div className="space-y-2">
            {[
              { label: `${criticalUnresolved} critical behaviour incidents`, urgent: criticalUnresolved > 0, icon: '🚨' },
              { label: `${b?.stats?.overdueFollowUps || 0} overdue follow-ups`, urgent: (b?.stats?.overdueFollowUps || 0) > 0, icon: '⏰' },
              { label: `PKR ${(totalOutstanding / 1000).toFixed(0)}K fees outstanding`, urgent: totalOutstanding > 0, icon: '💰' },
              { label: `${a?.stats?.unresolvedCritical || 0} admissions need action`, urgent: false, icon: '📋' },
              { label: `${b?.stats?.activeInterventions || 0} active intervention plans`, urgent: false, icon: '🛡️' },
            ].filter(x => x.label !== '0 critical behaviour incidents' || x.urgent).map((alert, i) => (
              <div key={i} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs
                ${alert.urgent ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-600'}`}>
                <span>{alert.icon}</span>
                <span>{alert.label}</span>
              </div>
            ))}
            {criticalUnresolved === 0 && totalOutstanding === 0 && (
              <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-lg text-xs text-emerald-700">
                <CheckCircle size={12} /> All clear — no critical alerts
              </div>
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
};

// ── ACADEMIC INTELLIGENCE TAB ─────────────────────────────────
interface AcademicTabProps { data: any; isLoading: boolean; }

export const AcademicIntelligenceTab: React.FC<AcademicTabProps> = ({ data, isLoading }) => {
  const as = data?.assessmentDash;
  const aa = data?.assessmentAnalytics;

  const subjectData = (aa?.subjectWise || []).map((s: any) => ({
    subject: s._id?.substring(0, 8) || '',
    avg: parseFloat((s.avgPct || 0).toFixed(1)),
    passRate: parseFloat(((s.passRate || 0) * 100).toFixed(1)),
    total: s.total || 0,
  }));

  const gradeDistData = (aa?.gradeDistribution || []).map((g: any, i: number) => ({
    name: g._id,
    value: g.count,
    fill: PIE_COLORS[i % PIE_COLORS.length],
  }));

  const topPerformers = aa?.topPerformers || [];
  const weakStudents = aa?.weakStudents || [];

  const trendData = (as?.byType || []).map((t: any) => ({
    type: t._id?.replace('_', ' ')?.replace(/\b\w/g, (l: string) => l.toUpperCase()),
    count: t.count,
  }));

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-5 gap-4">
        {[
          { title: 'Total Assessments', value: as?.stats?.total || 0, sub: 'This year', icon: <BookOpen size={14} className="text-blue-500" />, iconBg: 'bg-blue-50' },
          { title: 'Results Published', value: as?.stats?.published || 0, sub: 'Accessible to parents', icon: <CheckCircle size={14} className="text-emerald-500" />, iconBg: 'bg-emerald-50' },
          { title: 'Marks Entered', value: (as?.stats?.totalMarksEntered || 0).toLocaleString(), sub: 'Student-subject records', icon: <Target size={14} className="text-purple-500" />, iconBg: 'bg-purple-50' },
          { title: 'Questions Bank', value: as?.stats?.totalQuestions || 0, sub: 'Active questions', icon: <Star size={14} className="text-amber-500" />, iconBg: 'bg-amber-50' },
          { title: 'Ongoing', value: as?.stats?.ongoing || 0, sub: 'Currently running', icon: <Zap size={14} className="text-red-500" />, iconBg: 'bg-red-50' },
        ].map(s => (
          <KPICard key={s.title} {...s} />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Subject Performance */}
        <SectionCard title="Subject-wise Average Performance" subtitle="Avg % and pass rate">
          {subjectData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={subjectData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="subject" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} domain={[0, 100]} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="avg" fill={COLORS.primary} name="Avg %" radius={[3, 3, 0, 0]} />
                <Bar dataKey="passRate" fill={COLORS.emerald} name="Pass Rate %" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart message="No assessment data yet" />}
        </SectionCard>

        {/* Grade Distribution */}
        <SectionCard title="Overall Grade Distribution" subtitle="All assessments combined">
          {gradeDistData.length > 0 ? (
            <div>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={gradeDistData} dataKey="value" cx="50%" cy="50%" outerRadius={65}
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                    {gradeDistData.map((d: any, i: number) => <Cell key={i} fill={d.fill} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-2 mt-2">
                {gradeDistData.map((g: any) => (
                  <div key={g.name} className="flex items-center gap-1 text-[9px]">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: g.fill }} />
                    <span className="text-gray-600">{g.name}: {g.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <EmptyChart message="No results published yet" />}
        </SectionCard>

        {/* Top Performers */}
        <SectionCard title="Top Performers" subtitle="Highest overall percentages">
          {topPerformers.length > 0 ? (
            <div className="space-y-2">
              {topPerformers.slice(0, 6).map((s: any, i: number) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0
                    ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-gray-100 text-gray-600' : 'bg-orange-50 text-orange-600'}`}>
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-700">{s.studentName}</p>
                    <p className="text-[10px] text-gray-400">{s.grade} {s.section}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full
                    ${s.overallPercentage >= 90 ? 'bg-emerald-100 text-emerald-700' :
                      s.overallPercentage >= 80 ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                    {s.overallPercentage}%
                  </span>
                </div>
              ))}
            </div>
          ) : <EmptyChart message="Publish results to see top performers" />}
        </SectionCard>

        {/* At-Risk Students */}
        <SectionCard title="Students Needing Support" subtitle="Below 50% in assessments">
          {weakStudents.length > 0 ? (
            <div className="space-y-2">
              {weakStudents.slice(0, 6).map((s: any, i: number) => (
                <div key={i} className="flex items-center gap-3 bg-red-50 rounded-lg px-3 py-2">
                  <AlertTriangle size={12} className="text-red-500 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-700">{s.studentName}</p>
                    <p className="text-[10px] text-gray-400">{s.grade} {s.section}</p>
                  </div>
                  <span className="text-xs font-bold text-red-600">{s.overallPercentage}%</span>
                </div>
              ))}
            </div>
          ) : <EmptyChart message="No at-risk students identified" />}
        </SectionCard>
      </div>

      {/* Assessment by Type */}
      {trendData.length > 0 && (
        <SectionCard title="Assessment Distribution by Type" subtitle="How many of each type this year">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={trendData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 9 }} />
              <YAxis dataKey="type" type="category" tick={{ fontSize: 9 }} width={80} />
              <Tooltip />
              <Bar dataKey="count" fill={COLORS.indigo} radius={[0, 4, 4, 0]} name="Count" />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>
      )}
    </div>
  );
};
