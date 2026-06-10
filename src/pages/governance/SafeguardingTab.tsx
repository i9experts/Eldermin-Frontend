export default function SafeguardingTab() {
  return (
    <div>
      <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 mb-4">
        <span className="text-base">🔒</span>
        <span className="text-xs font-semibold text-red-800">
          RESTRICTED — Child safeguarding data is strictly confidential. All access is logged and monitored. Authorised personnel only.
        </span>
      </div>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-900">Child Safeguarding Compliance</h1>
        <p className="text-sm text-slate-500 mt-0.5">Incident reporting, case tracking, staff verification and safeguarding compliance</p>
      </div>
      <div className="flex flex-col items-center justify-center py-20">
        <div className="text-5xl mb-4">🛡️</div>
        <p className="text-sm font-semibold text-gray-500">No safeguarding records yet</p>
        <p className="text-xs text-gray-400 mt-1">This section will populate once configured</p>
      </div>
    </div>
  );
}
