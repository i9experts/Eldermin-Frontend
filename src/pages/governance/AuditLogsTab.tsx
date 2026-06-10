export default function AuditLogsTab() {
  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-900">Audit Logs</h1>
        <p className="text-sm text-slate-500 mt-0.5">Complete immutable activity trail — all system actions and user interactions</p>
      </div>
      <div className="flex flex-col items-center justify-center py-20">
        <div className="text-5xl mb-4">🛡️</div>
        <p className="text-sm font-semibold text-gray-500">No audit log records yet</p>
        <p className="text-xs text-gray-400 mt-1">This section will populate once configured</p>
      </div>
    </div>
  );
}
