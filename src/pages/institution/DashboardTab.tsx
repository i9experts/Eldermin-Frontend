import { APPROVALS, MEETINGS, MONTHS, POLICIES, Badge, Btn, Card, KPICard, PageHeader, type TabSection } from "./shared";

export default function DashboardTab({ setSection }: { setSection: (s: TabSection) => void }) {
  const approvalData = [
    { label: "Mon", approved: 3, rejected: 1 },
    { label: "Tue", approved: 5, rejected: 2 },
    { label: "Wed", approved: 4, rejected: 1 },
    { label: "Thu", approved: 7, rejected: 0 },
    { label: "Fri", approved: 2, rejected: 3 },
    { label: "Sat", approved: 6, rejected: 1 },
    { label: "Sun", approved: 4, rejected: 2 },
  ];
  const maxVal = Math.max(...approvalData.map((d) => d.approved + d.rejected));

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={["Home", "Institution Setup", "Overview"]}
        title="Executive Dashboard"
        subtitle="Organization & Governance Overview — Al-Noor Islamic School Network"
        actions={
          <div className="flex gap-2">
            <Btn variant="secondary" size="sm">📅 This Month</Btn>
            <Btn variant="secondary" size="sm">⬇️ Export</Btn>
            <Btn variant="primary" size="sm">＋ Quick Action</Btn>
          </div>
        }
      />

      <div className="grid grid-cols-4 gap-4">
        <KPICard icon="🏛️" label="Total Institutions" value="5" sub="Across 3 countries" trend={20} color="blue" />
        <KPICard icon="🏫" label="Total Campuses" value="21" sub="6 cities" trend={4} color="emerald" />
        <KPICard icon="🏢" label="Departments" value="48" sub="All campuses" trend={0} color="violet" />
        <KPICard icon="👥" label="Active Committees" value="7" sub="2 meetings this week" color="indigo" />
        <KPICard icon="⏳" label="Pending Approvals" value="5" sub="2 high priority" trend={-10} color="amber" />
        <KPICard icon="📅" label="Upcoming Meetings" value="3" sub="Next 7 days" color="teal" />
        <KPICard icon="📋" label="Active Policies" value="24" sub="3 expiring soon" color="rose" />
        <KPICard icon="🔑" label="Active Delegations" value="12" sub="1 expiring this week" color="slate" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="col-span-2">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">Pending Governance Actions</h3>
              <p className="text-xs text-slate-400 mt-0.5">Require your attention</p>
            </div>
            <Btn variant="ghost" size="sm" onClick={() => setSection("approvals")}>View All →</Btn>
          </div>
          <div className="p-4 space-y-3">
            {APPROVALS.filter((a) => a.status !== "Approved").slice(0, 4).map((a) => (
              <div key={a.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-slate-800 truncate">{a.title}</span>
                    <Badge status={a.priority} small />
                  </div>
                  <div className="text-xs text-slate-400">{a.type} · {a.requestedBy} · Due: {a.due}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge status={a.status} small />
                  <div className="flex gap-1">
                    <button className="px-2 py-1 bg-emerald-600 text-white text-xs rounded-md hover:bg-emerald-700">✓</button>
                    <button className="px-2 py-1 bg-red-50 text-red-600 text-xs rounded-md hover:bg-red-100">✗</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 text-sm">Upcoming Meetings</h3>
            <Btn variant="ghost" size="sm" onClick={() => setSection("meetings")}>View All →</Btn>
          </div>
          <div className="p-4 space-y-3">
            {MEETINGS.filter((m) => m.status !== "Completed").slice(0, 4).map((m) => (
              <div key={m.id} className="flex gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex flex-col items-center justify-center flex-shrink-0">
                  <span className="text-[#0C447C] font-bold text-xs leading-none">{m.date.split("-")[2]}</span>
                  <span className="text-blue-400 text-xs">{MONTHS[+m.date.split("-")[1] - 1]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-slate-800 truncate">{m.title}</div>
                  <div className="text-xs text-slate-400">{m.time} · {m.venue}</div>
                  <Badge status={m.status} small />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">Approval Activity (7 Days)</h3>
              <p className="text-xs text-slate-400 mt-0.5">Approved vs Rejected requests</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1"><span className="w-3 h-2 bg-[#0C447C] rounded inline-block"></span>Approved</span>
              <span className="flex items-center gap-1"><span className="w-3 h-2 bg-red-400 rounded inline-block"></span>Rejected</span>
            </div>
          </div>
          <div className="flex items-end gap-3 h-32">
            {approvalData.map((d) => (
              <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col gap-0.5 justify-end" style={{ height: "96px" }}>
                  <div className="w-full bg-red-100 rounded-sm" style={{ height: `${(d.rejected / maxVal) * 80}px` }} />
                  <div className="w-full bg-[#0C447C] rounded-sm" style={{ height: `${(d.approved / maxVal) * 80}px` }} />
                </div>
                <span className="text-xs text-slate-400">{d.label}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 text-sm">Policy Updates</h3>
            <Btn variant="ghost" size="sm" onClick={() => setSection("policies")}>View All →</Btn>
          </div>
          <div className="p-4 space-y-3">
            {POLICIES.slice(0, 4).map((p) => (
              <div key={p.id} className="flex items-start gap-2">
                <span className="text-base">📋</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-slate-800 leading-snug line-clamp-1">{p.title}</div>
                  <div className="text-xs text-slate-400">{p.version} · {p.effective}</div>
                  <Badge status={p.status} small />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="font-semibold text-slate-900 text-sm mb-3">Quick Actions</h3>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "＋ Add Institution", section: "institutions" as TabSection, color: "bg-blue-50 text-[#0C447C] hover:bg-blue-100" },
            { label: "＋ Add Campus", section: "campuses" as TabSection, color: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" },
            { label: "👥 Create Committee", section: "committees" as TabSection, color: "bg-violet-50 text-violet-700 hover:bg-violet-100" },
            { label: "📅 Schedule Meeting", section: "meetings" as TabSection, color: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100" },
            { label: "📋 Upload Policy", section: "policies" as TabSection, color: "bg-amber-50 text-[#EF9F27] hover:bg-amber-100" },
            { label: "🔄 Create Workflow", section: "workflows" as TabSection, color: "bg-rose-50 text-rose-700 hover:bg-rose-100" },
          ].map((a) => (
            <button key={a.label} onClick={() => setSection(a.section)}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${a.color}`}>{a.label}</button>
          ))}
        </div>
      </Card>
    </div>
  );
}
