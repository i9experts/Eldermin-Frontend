import type { GovTab } from "./shared";

const KPI_TITLES = [
  "Overall Compliance Score",
  "Pending Actions",
  "High Risk Issues",
  "Policy Acknowledgements",
  "Active Users",
  "Accreditation Readiness",
  "Last External Audit",
  "Open Safeguarding",
];

export default function DashboardTab({ setTab }: { setTab: (t: GovTab) => void }) {
  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-900">Compliance Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">Institutional compliance health — All Campuses</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-700 mb-5">
        Gov &amp; Compliance module is ready. Configure your compliance framework to start tracking.
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {KPI_TITLES.map((title) => (
          <div key={title} className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-[10px] font-bold text-gray-400 uppercase">{title}</p>
            <p className="text-3xl font-black text-gray-300 mt-1">—</p>
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
    </div>
  );
}
