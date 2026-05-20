import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import {
  KPICard, Card, CardHeader, Badge, Btn, Alert,
  CAMPUSES, BREAKDOWN, ACTIVITY_FEED, ProgressBar, TableWrap, Td,
} from "./shared";
import type { GovTab } from "./shared";

const timelineData = [
  { month: "Sep", score: 72, safeguarding: 65, attendance: 88 },
  { month: "Oct", score: 74, safeguarding: 68, attendance: 89 },
  { month: "Nov", score: 76, safeguarding: 70, attendance: 90 },
  { month: "Dec", score: 75, safeguarding: 72, attendance: 89 },
  { month: "Jan", score: 78, safeguarding: 74, attendance: 91 },
  { month: "Feb", score: 80, safeguarding: 76, attendance: 91 },
  { month: "Mar", score: 82, safeguarding: 78, attendance: 92 },
  { month: "Apr", score: 84, safeguarding: 78, attendance: 92 },
  { month: "May", score: 86, safeguarding: 78, attendance: 92 },
];

const riskColor = (risk: string) => {
  if (risk === "Low")    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (risk === "Medium") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-red-50 text-red-700 border-red-200";
};

export default function DashboardTab({ setTab }: { setTab: (t: GovTab) => void }) {
  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-900">Compliance Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">Institutional compliance health — All Campuses · Last updated: 14 May 2026, 09:41 AM</p>
      </div>

      <Alert type="danger">
        <div className="font-semibold mb-0.5">3 High-Risk Issues Require Immediate Attention</div>
        Safeguarding case #CS-2026-041 is 8 days overdue. 2 staff have missing DBS clearances. Riverside Branch compliance score has dropped to 62%.
      </Alert>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <KPICard icon="🎯" label="Overall Compliance Score"    value="86%"       sub="↑ +2.4% from last month"     color="green"  />
        <KPICard icon="⚠️" label="Pending Actions"            value="14"        sub="3 high priority · 11 standard" color="amber"  />
        <KPICard icon="🔴" label="High Risk Issues"           value="3"         sub="↑ +1 from last week"          color="red"    />
        <KPICard icon="📝" label="Policy Acknowledgements"    value="27"        sub="Awaiting staff sign-off"       color="blue"   />
        <KPICard icon="👥" label="Active Users"               value="142"       sub="Across 4 campuses"             color="navy"   />
        <KPICard icon="🏅" label="Accreditation Readiness"   value="74%"       sub="62 days to inspection"         color="purple" />
        <KPICard icon="📅" label="Last External Audit"        value="12 May 26" sub="External OFSTED Review"        color="teal"   />
        <KPICard icon="🔒" label="Open Safeguarding"          value="3"         sub="1 critical · 2 under review"  color="red"    />
      </div>

      {/* Score Breakdown + Activity Feed */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <Card>
          <CardHeader
            title="Compliance Score Breakdown"
            subtitle="By compliance category — all campuses"
            actions={<Badge status="Compliant" />}
          />
          <div className="p-5 space-y-3">
            {BREAKDOWN.map((b) => (
              <div key={b.label}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-semibold text-slate-700">{b.label}</span>
                  <span className="text-xs font-bold" style={{ color: b.color }}>{b.pct}%</span>
                </div>
                <ProgressBar pct={b.pct} color={b.color} />
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Recent System Activity"
            subtitle="Live audit feed — all campuses"
            actions={<Btn variant="secondary" size="sm" onClick={() => setTab("audit")}>View All →</Btn>}
          />
          <div className="p-4 space-y-3">
            {ACTIVITY_FEED.map((a, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 border-2 border-white shadow-sm" style={{ background: a.bg }}>
                  {a.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-slate-800 leading-snug">{a.text}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{a.meta}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Campus Summary Table */}
      <Card className="mb-4">
        <CardHeader
          title="Campus Governance Summary"
          subtitle="Compliance metrics across all campuses"
          actions={
            <div className="flex gap-2">
              <Btn variant="secondary" size="sm" onClick={() => setTab("governance")}>Full Governance →</Btn>
              <Btn variant="secondary" size="sm">📤 Export</Btn>
            </div>
          }
        />
        <TableWrap headers={["Campus", "Principal / Head", "Score", "Issues", "Attendance", "Last Review", "Risk", "Status"]}>
          {CAMPUSES.map((c) => {
            const sc = c.score >= 90 ? "#16a34a" : c.score >= 75 ? "#EF9F27" : "#dc2626";
            return (
              <tr key={c.id} className={`hover:bg-slate-50 ${c.status === "Critical" ? "bg-red-50/40" : c.status === "Attention" ? "bg-amber-50/30" : ""}`}>
                <Td><span className="font-semibold text-slate-800">{c.name}</span></Td>
                <Td className="text-slate-600 text-xs">{c.head}</Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <div className="w-16">
                      <ProgressBar pct={c.score} color={sc} />
                    </div>
                    <span className="text-xs font-bold" style={{ color: sc }}>{c.score}%</span>
                  </div>
                </Td>
                <Td><span className={`text-xs font-bold px-1.5 py-0.5 rounded ${c.issues <= 3 ? "text-emerald-700 bg-emerald-50" : c.issues <= 7 ? "text-amber-700 bg-amber-50" : "text-red-700 bg-red-50"}`}>{c.issues}</span></Td>
                <Td className="text-xs">{c.att}%</Td>
                <Td className="text-xs text-slate-400 whitespace-nowrap">{c.lastReview}</Td>
                <Td><span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${riskColor(c.risk)}`}>{c.risk}</span></Td>
                <Td><Badge status={c.status} /></Td>
              </tr>
            );
          })}
        </TableWrap>
      </Card>

      {/* Timeline Chart */}
      <Card>
        <CardHeader title="Compliance Timeline — 2025/26" actions={<Btn variant="secondary" size="sm">📤 Export</Btn>} />
        <div className="p-5" style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis domain={[50, 100]} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
              <Tooltip formatter={(v) => `${v}%`} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="score"        name="Overall Score"  stroke="#0C447C"  strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="safeguarding" name="Safeguarding"   stroke="#dc2626"  strokeWidth={1.5} strokeDasharray="5 3" dot={{ r: 2 }} />
              <Line type="monotone" dataKey="attendance"   name="Attendance"     stroke="#16a34a"  strokeWidth={1.5} dot={{ r: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
