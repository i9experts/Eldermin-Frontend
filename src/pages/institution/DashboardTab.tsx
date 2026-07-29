import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MONTHS, Badge, Btn, Card, KPICard, PageHeader, type TabSection } from "./shared";
import organizationService from "../../services/organization.service";

// Pending Governance Actions has no real backend yet — stays honestly empty.
const APPROVALS: any[] = [];

const PERIODS = [
  { value: "week",  label: "This Week"  },
  { value: "month", label: "This Month" },
  { value: "term",  label: "This Term"  },
  { value: "year",  label: "This Year"  },
] as const;

type Period = typeof PERIODS[number]["value"];

const QUICK_ACTIONS: { label: string; section: TabSection; modal: boolean; color: string }[] = [
  { label: "＋ Add Campus",       section: "campuses",     modal: true,  color: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" },
  { label: "🏢 Add Department",   section: "departments",  modal: true,  color: "bg-violet-50 text-violet-700 hover:bg-violet-100"   },
  { label: "👥 Create Committee", section: "committees",   modal: true,  color: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"   },
  { label: "📅 Schedule Meeting", section: "meetings",     modal: true,  color: "bg-blue-50 text-blue-700 hover:bg-blue-100"         },
  { label: "📋 Upload Policy",    section: "policies",     modal: false, color: "bg-amber-50 text-[#EF9F27] hover:bg-amber-100"      },
  { label: "🔄 Create Workflow",  section: "workflows",    modal: false, color: "bg-rose-50 text-rose-700 hover:bg-rose-100"         },
];

const asArray = (v: any): any[] => (Array.isArray(v) ? v : Array.isArray(v?.data) ? v.data : []);

export default function DashboardTab({
  setSection,
  onQuickAction,
}: {
  setSection: (s: TabSection) => void;
  onQuickAction?: (tab: TabSection, withModal: boolean) => void;
}) {
  const [period, setPeriod] = useState<Period>("month");

  const { data: overview } = useQuery({ queryKey: ["org", "overview"], queryFn: organizationService.getOverview });
  const { data: institutionsRaw } = useQuery({ queryKey: ["org", "institutions"], queryFn: organizationService.getInstitutions });
  const { data: committeesRaw } = useQuery({ queryKey: ["org", "committees"], queryFn: organizationService.getCommittees });
  const { data: meetingsRaw } = useQuery({ queryKey: ["org", "meetings"], queryFn: () => organizationService.getMeetings() });
  const { data: policiesRaw } = useQuery({ queryKey: ["org", "policies"], queryFn: organizationService.getPolicies });

  const institutions = asArray(institutionsRaw);
  const committees = asArray(committeesRaw);
  const meetings = asArray(meetingsRaw);
  const policies = asArray(policiesRaw);

  const now = new Date();
  const upcomingMeetings = meetings.filter((m) => m.status !== "Completed" && (!m.date || new Date(m.date) >= now));
  const activePolicies = policies.filter((p) => !p.status || p.status === "Active");
  const activeCommittees = committees.filter((c) => c.status !== "Inactive");

  const schoolName = overview?.school?.name || "Your School";

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={["Home", "Institution Setup", "Overview"]}
        title="Executive Dashboard"
        subtitle={`Organization & Governance Overview — ${schoolName}`}
        actions={
          <div className="flex gap-2 items-center">
            <div className="relative flex items-center bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              <span className="pl-3 text-xs select-none">📅</span>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as Period)}
                className="appearance-none bg-transparent text-xs font-medium text-slate-700 pl-1.5 pr-6 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#0C447C] rounded-lg cursor-pointer"
              >
                {PERIODS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
              <span className="absolute right-2 text-slate-400 pointer-events-none text-xs leading-none">▼</span>
            </div>
            <Btn variant="secondary" size="sm">⬇️ Export</Btn>
          </div>
        }
      />

      <div className="grid grid-cols-4 gap-4">
        <KPICard icon="🏛️" label="Total Institutions" value={String(institutions.length)} sub="Group institutions" color="blue" />
        <KPICard icon="🏫" label="Total Campuses" value={String(overview?.campuses ?? 0)} sub="Active campuses" color="emerald" />
        <KPICard icon="🏢" label="Departments" value={String(overview?.departments ?? 0)} sub="All campuses" color="violet" />
        <KPICard icon="👥" label="Active Committees" value={String(activeCommittees.length)} sub="" color="indigo" />
        <KPICard icon="⏳" label="Pending Approvals" value="—" sub="Not tracked yet" color="amber" />
        <KPICard icon="📅" label="Upcoming Meetings" value={String(upcomingMeetings.length)} sub="" color="teal" />
        <KPICard icon="📋" label="Active Policies" value={String(activePolicies.length)} sub="" color="rose" />
        <KPICard icon="🔑" label="Active Delegations" value="—" sub="Not tracked yet" color="slate" />
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
          <div className="p-4">
            {APPROVALS.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No approval workflow connected yet.</p>
            ) : APPROVALS.filter((a) => a.status !== "Approved").slice(0, 4).map((a) => (
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
            {upcomingMeetings.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No upcoming meetings scheduled.</p>
            ) : upcomingMeetings.slice(0, 4).map((m) => (
              <div key={m.id || m._id} className="flex gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex flex-col items-center justify-center flex-shrink-0">
                  <span className="text-[#0C447C] font-bold text-xs leading-none">{m.date?.split("-")[2] || "--"}</span>
                  <span className="text-blue-400 text-xs">{m.date ? MONTHS[+m.date.split("-")[1] - 1] : ""}</span>
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
              <h3 className="font-semibold text-slate-900 text-sm">Approval Activity</h3>
              <p className="text-xs text-slate-400 mt-0.5">Approved vs Rejected requests</p>
            </div>
          </div>
          <div className="h-32 flex items-center justify-center">
            <p className="text-xs text-slate-400">Approval activity tracking isn't connected yet.</p>
          </div>
        </Card>

        <Card>
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 text-sm">Policy Updates</h3>
            <Btn variant="ghost" size="sm" onClick={() => setSection("policies")}>View All →</Btn>
          </div>
          <div className="p-4 space-y-3">
            {activePolicies.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No policies added yet.</p>
            ) : activePolicies.slice(0, 4).map((p) => (
              <div key={p.id || p._id} className="flex items-start gap-2">
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
          {QUICK_ACTIONS.map((a) => (
            <button
              key={a.label}
              onClick={() => {
                if (onQuickAction) {
                  onQuickAction(a.section, a.modal);
                } else {
                  setSection(a.section);
                }
              }}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${a.color}`}
            >
              {a.label}
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
