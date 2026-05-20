import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from "recharts";
import {
  Card, CardHeader, KPICard, Badge, Btn, ProgressBar,
  ACTIVITY, PENDING_APPROVALS_QUEUE, EXPIRY_ALERTS, WORKFLOW_OVERVIEW, MONTHLY_UPLOADS, DOC_CATEGORIES_CHART,
} from "./shared";

export default function DashboardTab() {
  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-900">Documents & Workflow Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">System-wide overview — documents, approvals, workflows, and tasks</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
        <KPICard icon="📄" label="Total Documents" value="1,284" sub="+23 this month"    color="navy"   />
        <KPICard icon="⏳" label="Pending Approvals" value="7"   sub="2 critical today"  color="amber"  />
        <KPICard icon="⚠️" label="Expiring Soon"    value="14"  sub="7 within 14 days"  color="red"    />
        <KPICard icon="🔄" label="Active Workflows"  value="23"  sub="6 require action"  color="blue"   />
        <KPICard icon="✍️" label="Awaiting Signature" value="3" sub="1 from you"         color="orange" />
        <KPICard icon="📋" label="Overdue Tasks"     value="5"   sub="2 critical"        color="red"    />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Recent Activity */}
        <Card className="lg:col-span-1">
          <CardHeader title="Recent Activity" actions={<Btn variant="ghost" size="sm">View All</Btn>} />
          <div className="divide-y divide-slate-50">
            {ACTIVITY.map((a, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3">
                <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: a.color }} />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-800 truncate">{a.title}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{a.action} <span className="text-slate-700 font-medium">{a.actor}</span></div>
                  <div className="text-xs text-slate-400 mt-0.5">{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Pending Approvals Queue */}
        <Card className="lg:col-span-2">
          <CardHeader title="Pending Approvals Queue" actions={<Btn variant="primary" size="sm">View All</Btn>} />
          <div className="divide-y divide-slate-50">
            {PENDING_APPROVALS_QUEUE.map((a, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: a.bg, color: a.color }}>{a.initials}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-slate-800 truncate">{a.doc}</div>
                  <div className="text-xs text-slate-500">{a.dept}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <Badge status={a.urgency} />
                  <div className="text-xs text-slate-400 mt-1">Due: {a.due}</div>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <Btn variant="success" size="xs">✓</Btn>
                  <Btn variant="secondary" size="xs">→</Btn>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Expiry Alerts */}
        <Card>
          <CardHeader title="Expiry Alerts" />
          <div className="p-4 space-y-3">
            {EXPIRY_ALERTS.map((e, i) => (
              <div key={i} className={`flex items-center justify-between rounded-lg p-3 ${e.level === "critical" ? "bg-red-50 border border-red-200" : e.level === "warning" ? "bg-amber-50 border border-amber-200" : "bg-blue-50 border border-blue-200"}`}>
                <div>
                  <div className="text-xs font-semibold text-slate-800">{e.title}</div>
                  <div className={`text-xs font-bold mt-0.5 ${e.level === "critical" ? "text-red-600" : e.level === "warning" ? "text-amber-600" : "text-blue-600"}`}>
                    {e.days} days remaining
                  </div>
                </div>
                <Btn variant={e.level === "critical" ? "danger" : "secondary"} size="xs">Renew</Btn>
              </div>
            ))}
          </div>
        </Card>

        {/* Workflow Overview */}
        <Card>
          <CardHeader title="Active Workflow Progress" />
          <div className="p-4 space-y-4">
            {WORKFLOW_OVERVIEW.map((w) => (
              <div key={w.name}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-semibold text-slate-700">{w.name}</span>
                  <span className="text-xs font-bold text-slate-800">{w.pct}%</span>
                </div>
                <ProgressBar pct={w.pct} color={w.color} />
              </div>
            ))}
          </div>
        </Card>

        {/* Documents by Category */}
        <Card>
          <CardHeader title="Documents by Category" />
          <div style={{ height: 180 }} className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={DOC_CATEGORIES_CHART} dataKey="value" nameKey="label" cx="45%" cy="50%" innerRadius={45} outerRadius={70}>
                  {DOC_CATEGORIES_CHART.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip formatter={(v) => `${v} docs`} />
                <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Monthly Uploads Chart */}
      <Card>
        <CardHeader title="Monthly Document Uploads" subtitle="Aug 2025 – May 2026" />
        <div className="p-5" style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={MONTHLY_UPLOADS} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="val" name="Uploads" radius={[4, 4, 0, 0]} fill="#0C447C" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
