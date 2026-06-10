import React from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  Users, FileText, CheckCircle, TrendingUp, UserCheck,
  Clock, AlertTriangle, Award, Target, ArrowUpRight, ArrowDownRight,
  Calendar, Bell, ChevronRight,
} from 'lucide-react';
import { useAdmissionDashboard } from '../../hooks/useAdmissions';

// ── Color palettes ────────────────────────────────────────────
const FUNNEL_COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#06b6d4', '#10b981', '#059669'];
const SOURCE_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#06b6d4', '#ef4444', '#f97316'];
const MONTH_NAMES = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const fmtMonth = (m: string) => {
  const parts = m.split('-');
  return parts.length === 2 ? (MONTH_NAMES[parseInt(parts[1])] || m) : m;
};

// ── Stat Card ─────────────────────────────────────────────────
interface StatCardProps {
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  trend?: number;
  iconBg: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, sub, icon, trend, iconBg }) => (
  <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</p>
        <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        {trend !== undefined && (
          <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {trend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(trend)}% vs last month
          </div>
        )}
      </div>
      <div className={`${iconBg} rounded-xl p-3`}>{icon}</div>
    </div>
  </div>
);

// ── Funnel Bar ────────────────────────────────────────────────
interface FunnelBarProps { stage: string; count: number; percentage: number; color: string; maxCount: number; }
const FunnelBar: React.FC<FunnelBarProps> = ({ stage, count, percentage, color, maxCount }) => (
  <div className="flex items-center gap-3 py-1.5">
    <div className="w-28 text-right text-xs font-medium text-gray-600">{stage}</div>
    <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
      <div
        className="h-full rounded-full flex items-center justify-end pr-2 transition-all"
        style={{ width: `${maxCount > 0 ? (count / maxCount) * 100 : 0}%`, backgroundColor: color }}
      >
        <span className="text-white text-[10px] font-bold">{count}</span>
      </div>
    </div>
    <div className="w-12 text-xs text-gray-500 font-medium">{percentage.toFixed(1)}%</div>
  </div>
);

// ── Alert Item ────────────────────────────────────────────────
const AlertItem: React.FC<{ icon: React.ReactNode; text: string; sub: string; color: string }> =
  ({ icon, text, sub, color }) => (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <div className={`${color} rounded-lg p-1.5 mt-0.5 flex-shrink-0`}>{icon}</div>
      <div>
        <p className="text-xs font-medium text-gray-700">{text}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>
      </div>
    </div>
  );

// ── Loading Spinner ───────────────────────────────────────────
const Spinner: React.FC = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin w-8 h-8 border-4 border-[#1e3a5f] border-t-transparent rounded-full" />
  </div>
);

// ── Main Dashboard ────────────────────────────────────────────
const AdmissionDashboard: React.FC = () => {
  const { data, isLoading } = useAdmissionDashboard();

  if (isLoading) return <Spinner />;

  const stats   = data?.stats   ?? {} as any;
  const funnel  = (data?.funnel ?? []) as Array<{ stage: string; count: number }>;
  const maxFunnelCount = funnel[0]?.count || 1;

  // Enrich funnel with percentage + color
  const funnelEnriched = funnel.map((f, i) => ({
    ...f,
    percentage: maxFunnelCount > 0 ? (f.count / maxFunnelCount) * 100 : 0,
    color: FUNNEL_COLORS[i] ?? '#888',
  }));

  // Source breakdown → add fill colors
  const sourceData = ((data?.sourceBreakdown ?? []) as Array<{ source: string; count: number }>)
    .map((s, i) => ({ source: s.source, value: s.count, fill: SOURCE_COLORS[i] ?? '#888' }));

  // Monthly trend → format month label
  const trendData = ((data?.monthlyTrend ?? []) as Array<{ month: string; leads: number; enrolled: number }>)
    .map(m => ({ ...m, month: fmtMonth(m.month) }));

  // Grade demand
  const gradeData = (data?.gradeDemand ?? []) as Array<{ grade: string; applications: number }>;

  // Recent activity (applicants)
  const recentActivity = (data?.recentActivity ?? []) as any[];

  // Derived rates
  const appToAccepted = stats.totalApplications > 0
    ? ((stats.accepted / stats.totalApplications) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2d5f9e] rounded-xl p-5 text-white flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Admission Lifecycle Overview</h2>
          <p className="text-blue-200 text-sm mt-0.5">Academic Year 2025–26 · Spring Admissions Open</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-white/10 rounded-lg px-4 py-2 text-center">
            <p className="text-xl font-bold">{stats.enrolled ?? 0}</p>
            <p className="text-blue-200 text-[11px]">Enrolled</p>
          </div>
          <div className="bg-white/10 rounded-lg px-4 py-2 text-center">
            <p className="text-xl font-bold">{stats.accepted ?? 0}</p>
            <p className="text-blue-200 text-[11px]">Accepted</p>
          </div>
          <div className="bg-white/10 rounded-lg px-4 py-2 text-center">
            <p className="text-xl font-bold">{stats.totalLeads ?? 0}</p>
            <p className="text-blue-200 text-[11px]">Total Leads</p>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Leads" value={stats.totalLeads ?? 0} sub={`+${stats.leadsThisMonth ?? 0} this month`}
          icon={<Users size={20} className="text-blue-600" />} iconBg="bg-blue-50"
        />
        <StatCard
          title="Applications" value={stats.totalApplications ?? 0} sub="Submitted this cycle"
          icon={<FileText size={20} className="text-purple-600" />} iconBg="bg-purple-50"
        />
        <StatCard
          title="Enrolled" value={stats.enrolled ?? 0} sub={`${stats.conversionRate ?? 0}% conversion rate`}
          icon={<CheckCircle size={20} className="text-emerald-600" />} iconBg="bg-emerald-50"
        />
        <StatCard
          title="At-Risk Retention" value={stats.atRiskRetention ?? 0} sub="Need follow-up"
          icon={<Clock size={20} className="text-amber-600" />} iconBg="bg-amber-50"
        />
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Lead → Application', value: `${stats.leadToApplicationRate ?? 0}%`, icon: <Target size={14} className="text-blue-500" />, color: 'text-blue-600' },
          { label: 'Application → Accepted', value: `${appToAccepted}%`, icon: <Award size={14} className="text-amber-500" />, color: 'text-amber-600' },
          { label: 'Accepted → Enrolled', value: `${stats.applicationToEnrollmentRate ?? 0}%`, icon: <UserCheck size={14} className="text-emerald-500" />, color: 'text-emerald-600' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex items-center gap-4">
            <div className="bg-gray-50 rounded-lg p-3">{kpi.icon}</div>
            <div>
              <p className="text-xs text-gray-500">{kpi.label}</p>
              <p className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Funnel + Trend */}
      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-2 bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Admission Funnel</h3>
          {funnelEnriched.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8">No data yet</p>
          ) : (
            <div className="space-y-1">
              {funnelEnriched.map(f => (
                <FunnelBar key={f.stage} {...f} maxCount={maxFunnelCount} />
              ))}
            </div>
          )}
        </div>

        <div className="col-span-3 bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Monthly Trend</h3>
          {trendData.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8">No trend data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line dataKey="leads" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="Leads" />
                <Line dataKey="enrolled" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="Enrolled" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Source + Grade Demand + Alerts */}
      <div className="grid grid-cols-3 gap-4">
        {/* Source Distribution */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Lead Sources</h3>
          {sourceData.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8">No source data yet</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={sourceData} dataKey="value" nameKey="source" cx="50%" cy="50%" outerRadius={55}>
                    {sourceData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1 mt-2">
                {sourceData.map(s => (
                  <div key={s.source} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.fill }} />
                      <span className="text-gray-600 capitalize">{s.source.replace('_', ' ')}</span>
                    </div>
                    <span className="font-medium text-gray-700">{s.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Grade Demand */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Grade Demand</h3>
          {gradeData.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8">No applications yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={gradeData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="grade" type="category" tick={{ fontSize: 10 }} width={60} />
                <Tooltip />
                <Bar dataKey="applications" fill="#6366f1" name="Applications" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pending Actions */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">Pending Actions</h3>
            <Bell size={14} className="text-gray-400" />
          </div>
          <div>
            {stats.atRiskRetention > 0 && (
              <AlertItem
                icon={<AlertTriangle size={12} className="text-red-600" />}
                text={`${stats.atRiskRetention} at-risk retention case${stats.atRiskRetention !== 1 ? 's' : ''}`}
                sub="Follow up required" color="bg-red-50"
              />
            )}
            {stats.underReview > 0 && (
              <AlertItem
                icon={<FileText size={12} className="text-blue-600" />}
                text={`${stats.underReview} application${stats.underReview !== 1 ? 's' : ''} under review`}
                sub="Awaiting decision" color="bg-blue-50"
              />
            )}
            {stats.testsScheduled > 0 && (
              <AlertItem
                icon={<Calendar size={12} className="text-purple-600" />}
                text={`${stats.testsScheduled} entrance test${stats.testsScheduled !== 1 ? 's' : ''} scheduled`}
                sub="Upcoming evaluations" color="bg-purple-50"
              />
            )}
            {stats.accepted > 0 && (
              <AlertItem
                icon={<UserCheck size={12} className="text-emerald-600" />}
                text={`${stats.accepted} accepted applicant${stats.accepted !== 1 ? 's' : ''}`}
                sub="Ready for enrollment" color="bg-emerald-50"
              />
            )}
            {stats.leadsThisMonth > 0 && (
              <AlertItem
                icon={<TrendingUp size={12} className="text-blue-500" />}
                text={`${stats.leadsThisMonth} new lead${stats.leadsThisMonth !== 1 ? 's' : ''} this month`}
                sub="Requires follow-up" color="bg-indigo-50"
              />
            )}
            {!stats.atRiskRetention && !stats.underReview && !stats.testsScheduled && !stats.accepted && !stats.leadsThisMonth && (
              <p className="text-xs text-gray-400 text-center py-4">No pending actions</p>
            )}
          </div>
          <button className="mt-3 w-full text-xs text-[#1e3a5f] font-medium flex items-center justify-center gap-1 hover:underline">
            View all alerts <ChevronRight size={12} />
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Recent Activity</h3>
        {recentActivity.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-8">No recent activity</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-400 text-left border-b border-gray-100">
                  <th className="pb-2 font-medium">Applicant</th>
                  <th className="pb-2 font-medium">Grade</th>
                  <th className="pb-2 font-medium">Stage</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Updated</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.map((app: any) => {
                  const statusMap: Record<string, string> = {
                    shortlisted: 'bg-amber-100 text-amber-700',
                    accepted: 'bg-emerald-100 text-emerald-700',
                    under_review: 'bg-purple-100 text-purple-700',
                    submitted: 'bg-blue-100 text-blue-700',
                    rejected: 'bg-red-100 text-red-700',
                  };
                  return (
                    <tr key={app._id || app.applicationNumber} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-2 font-medium text-gray-700">{app.firstName} {app.lastName}</td>
                      <td className="py-2 text-gray-500">{app.gradeApplied || '—'}</td>
                      <td className="py-2 text-gray-500 capitalize">{(app.stage || '').replace('_', ' ')}</td>
                      <td className="py-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusMap[app.status] || 'bg-gray-100 text-gray-600'}`}>
                          {(app.status || '').replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-2 text-gray-400">{app.updatedAt ? new Date(app.updatedAt).toLocaleDateString() : '—'}</td>
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
};

export default AdmissionDashboard;
