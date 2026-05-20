import { Card, CardHeader, Btn, Badge, RiskBadge, TableWrap, Td, AUDIT_LOGS } from "./shared";

export default function AuditLogsTab() {
  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-900">Audit Logs</h1>
        <p className="text-sm text-slate-500 mt-0.5">Complete immutable activity trail — all system actions and user interactions</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Total Events (30d)",  value: "4,821", color: "navy"  },
          { label: "Sensitive Actions",   value: "127",   color: "red"   },
          { label: "Failed Logins",       value: "23",    color: "amber" },
          { label: "Data Exports",        value: "38",    color: "blue"  },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{k.label}</div>
            <div className="text-2xl font-bold text-slate-800 mt-1">{k.value}</div>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader title="Audit Event Log" />
        <div className="flex flex-wrap gap-2 px-5 py-3 border-b border-slate-100">
          <input placeholder="🔍 Search actions, users, IPs…" className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C] w-52" />
          <input type="date" defaultValue="2026-05-01" className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none" />
          <span className="text-xs text-slate-400 self-center">to</span>
          <input type="date" defaultValue="2026-05-14" className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none" />
          <select className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none">
            {["All Roles", "Super Admin", "Principal", "Teacher", "Auditor"].map(o => <option key={o}>{o}</option>)}
          </select>
          <select className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none">
            {["All Modules", "Safeguarding", "RBAC", "Data Privacy", "Audit"].map(o => <option key={o}>{o}</option>)}
          </select>
          <select className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none">
            {["All Risk Levels", "Critical", "High", "Medium", "Low", "Info"].map(o => <option key={o}>{o}</option>)}
          </select>
          <div className="ml-auto flex gap-2">
            <Btn variant="secondary" size="sm">🔄 Refresh</Btn>
            <Btn variant="primary" size="sm">📤 Export Logs</Btn>
          </div>
        </div>

        <TableWrap headers={["Date & Time", "User", "Role", "Campus", "Action", "Module", "IP Address", "Device", "Risk", "Status", ""]}>
          {AUDIT_LOGS.map((l, i) => (
            <tr key={i} className={`hover:bg-slate-50 ${l.risk === "Critical" || l.status === "Blocked" ? "bg-red-50/40" : ""}`}>
              <Td className="text-xs text-slate-400 whitespace-nowrap">{l.dt}</Td>
              <Td className="font-semibold text-xs">{l.user}</Td>
              <Td><span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded">{l.role}</span></Td>
              <Td className="text-xs">{l.campus}</Td>
              <Td className="text-xs max-w-[200px]">{l.action}</Td>
              <Td><span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded">{l.module}</span></Td>
              <Td className="text-xs text-slate-400 whitespace-nowrap">{l.ip}</Td>
              <Td className="text-xs text-slate-400">{l.device}</Td>
              <Td><RiskBadge risk={l.risk} /></Td>
              <Td><Badge status={l.status} /></Td>
              <Td>
                {l.status === "Blocked"
                  ? <Btn variant="danger" size="xs">Investigate</Btn>
                  : <Btn variant="secondary" size="xs">Details</Btn>}
              </Td>
            </tr>
          ))}
        </TableWrap>

        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50 rounded-b-xl">
          <span className="text-xs text-slate-500">Showing 8 of 4,821 events</span>
          <div className="flex gap-1">
            {["← Prev", "1", "2", "3", "…", "804", "Next →"].map((p) => (
              <button key={p} className={`min-w-[28px] h-7 rounded border text-xs font-medium px-2 ${p === "1" ? "bg-[#0C447C] text-white border-[#0C447C]" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}>{p}</button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
