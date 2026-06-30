import type { GovTab } from "./shared";
import { useComplianceDashboard } from "../../hooks/useCompliance";

export default function DashboardTab({ setTab }: { setTab: (t: GovTab) => void }) {
  const { data, isLoading } = useComplianceDashboard();

  const stats = (data as any)?.stats ?? {};

  const kpis = [
    { label: "Overall Compliance Score", value: stats.complianceScore != null ? `${stats.complianceScore}%` : "—" },
    { label: "Pending Actions",          value: stats.pendingAcknowledgements != null ? String(stats.pendingAcknowledgements) : "—" },
    { label: "High Risk Issues",         value: stats.criticalSafeguarding != null ? String(stats.criticalSafeguarding) : "—" },
    { label: "Policy Acknowledgements",  value: stats.activePolicies != null ? String(stats.activePolicies) : "—" },
    { label: "Active Users",             value: stats.activeUsers != null ? String(stats.activeUsers) : "—" },
    { label: "Accreditation Readiness",  value: stats.accreditationReadiness != null ? `${stats.accreditationReadiness}%` : "—" },
    { label: "Last External Audit",      value: stats.lastExternalAudit ?? "—" },
    { label: "Open Safeguarding",        value: stats.openSafeguarding != null ? String(stats.openSafeguarding) : "—" },
  ];

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-900">Compliance Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">Institutional compliance health — All Campuses</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-700 mb-5">
        Gov &amp; Compliance module is ready. Configure your compliance framework to start tracking.
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-4 border-[#0C447C] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            {kpis.map((kpi) => (
              <div key={kpi.label} className="bg-white rounded-xl border border-gray-100 p-5">
                <p className="text-[10px] font-bold text-gray-400 uppercase">{kpi.label}</p>
                <p className="text-3xl font-black text-gray-300 mt-1">{kpi.value}</p>
                <p className="text-[10px] text-gray-300 mt-1">No data yet</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
              <div className="px-5 py-4 border-b border-slate-100">
                <div className="font-semibold text-slate-800 text-sm">Compliance Score Breakdown</div>
                <div className="text-xs text-slate-500 mt-0.5">By compliance category — all campuses</div>
              </div>
              <div className="flex items-center justify-center py-12 text-sm text-slate-400">
                No breakdown data yet
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div>
                  <div className="font-semibold text-slate-800 text-sm">Recent System Activity</div>
                  <div className="text-xs text-slate-500 mt-0.5">Live audit feed — all campuses</div>
                </div>
                <button
                  onClick={() => setTab("audit")}
                  className="px-3 py-1.5 text-xs bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-lg font-medium whitespace-nowrap"
                >
                  View All →
                </button>
              </div>
              <div className="flex items-center justify-center py-12 text-sm text-slate-400">
                No recent activity
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div>
                <div className="font-semibold text-slate-800 text-sm">Campus Governance Summary</div>
                <div className="text-xs text-slate-500 mt-0.5">Compliance metrics across all campuses</div>
              </div>
              <button
                onClick={() => setTab("governance")}
                className="px-3 py-1.5 text-xs bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-lg font-medium whitespace-nowrap"
              >
                Full Governance →
              </button>
            </div>
            <div className="flex items-center justify-center py-12 text-sm text-slate-400">
              No campus data configured
            </div>
          </div>
        </>
      )}
    </div>
  );
}
