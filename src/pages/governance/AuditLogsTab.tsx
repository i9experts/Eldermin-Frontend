import { useAuditLogs } from "../../hooks/useCompliance";

function formatDate(d?: string | Date) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function AuditLogsTab() {
  const { data: rawLogs = [], isLoading } = useAuditLogs({ limit: 100 });
  const logs: any[] = Array.isArray(rawLogs) ? rawLogs : ((rawLogs as any)?.data ?? []);

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-900">Audit Logs</h1>
        <p className="text-sm text-slate-500 mt-0.5">Complete immutable activity trail — all system actions and user interactions</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-4 border-[#0C447C] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="text-5xl mb-4">🛡️</div>
          <p className="text-sm font-semibold text-gray-500">No audit logs yet</p>
          <p className="text-xs text-gray-400 mt-1">System activity will appear here once recorded</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Time</th>
                <th className="text-left py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">User</th>
                <th className="text-left py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Action</th>
                <th className="text-left py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Resource</th>
                <th className="text-left py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {logs.map((log: any, i: number) => (
                <tr key={log._id ?? log.id ?? i} className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 text-xs text-slate-400 whitespace-nowrap">{formatDate(log.createdAt ?? log.timestamp)}</td>
                  <td className="py-2.5 px-4 text-xs text-slate-700">{log.user ?? log.performedBy ?? "—"}</td>
                  <td className="py-2.5 px-4 text-xs text-slate-700">{log.action ?? log.event ?? "—"}</td>
                  <td className="py-2.5 px-4 text-xs text-slate-500">{log.resource ?? log.entity ?? "—"}</td>
                  <td className="py-2.5 px-4 text-xs text-slate-400">{log.ip ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-slate-100">
            <span className="text-xs text-slate-500">Showing {logs.length} log{logs.length !== 1 ? "s" : ""}</span>
          </div>
        </div>
      )}
    </div>
  );
}
