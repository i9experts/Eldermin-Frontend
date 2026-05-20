import { useState } from "react";
import { Card, CardHeader, Badge, Btn, FInput, FSelect, TableWrap, Td, AUDIT_LOGS } from "./shared";

const ACTION_COLORS: Record<string, string> = {
  Uploaded:          "bg-blue-50 text-blue-700 border-blue-200",
  Approved:          "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Sent for Sign":   "bg-purple-50 text-purple-700 border-purple-200",
  Deleted:           "bg-amber-50 text-amber-700 border-amber-200",
  "Permission Changed": "bg-slate-100 text-slate-600 border-slate-200",
};

const ActionBadge = ({ action }: { action: string }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-medium ${ACTION_COLORS[action] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}>
    {action}
  </span>
);

export default function AuditTab() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("All Actions");

  const filtered = AUDIT_LOGS.filter((l) => {
    const matchSearch = l.user.toLowerCase().includes(search.toLowerCase()) || l.doc.toLowerCase().includes(search.toLowerCase());
    const matchAction = actionFilter === "All Actions" || l.action === actionFilter;
    return matchSearch && matchAction;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Audit Trail</h1>
          <p className="text-sm text-slate-500 mt-0.5">Complete log of all document actions and permission changes</p>
        </div>
        <div className="flex gap-2">
          <Btn variant="secondary" size="sm">📊 Export CSV</Btn>
          <Btn variant="secondary" size="sm">🖨 Print Report</Btn>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Total Events Today",    value: "47", color: "#0C447C" },
          { label: "Uploads",               value: "12", color: "#16a34a" },
          { label: "Approvals / Rejections", value: "8", color: "#EF9F27" },
          { label: "Deletions / Warnings",  value: "3",  color: "#dc2626" },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{k.label}</div>
            <div className="text-2xl font-bold mt-1" style={{ color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader
          title="Audit Log"
          actions={
            <div className="flex flex-wrap gap-2">
              <FInput
                placeholder="Search user or document…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-48"
              />
              <FSelect
                options={["All Actions", "Uploaded", "Approved", "Sent for Sign", "Deleted", "Permission Changed"]}
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="w-44"
              />
              <FInput type="date" className="w-36" />
              <Btn variant="secondary" size="sm">🔍 Filter</Btn>
            </div>
          }
        />
        <TableWrap headers={["Date & Time", "User", "Action", "Document", "Detail", "Campus", "IP Address", "Status"]}>
          {filtered.map((log, i) => (
            <tr key={i} className={`hover:bg-slate-50 ${log.status === "Warning" ? "bg-amber-50/30" : ""}`}>
              <Td className="text-xs text-slate-500 whitespace-nowrap">{log.date}</Td>
              <Td className="text-xs font-medium text-slate-800">{log.user}</Td>
              <Td><ActionBadge action={log.action} /></Td>
              <Td className="text-xs max-w-[180px]">
                <div className="truncate text-slate-700">{log.doc}</div>
              </Td>
              <Td className="text-xs text-slate-500">{log.detail}</Td>
              <Td className="text-xs">{log.campus}</Td>
              <Td className="text-xs font-mono text-slate-400">{log.ip}</Td>
              <Td><Badge status={log.status} /></Td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={8} className="py-10 text-center text-slate-400 text-sm">No matching audit entries</td>
            </tr>
          )}
        </TableWrap>
        <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500">Showing {filtered.length} of {AUDIT_LOGS.length} entries</span>
          <div className="flex gap-1">
            <Btn variant="secondary" size="xs">← Prev</Btn>
            <Btn variant="secondary" size="xs">Next →</Btn>
          </div>
        </div>
      </Card>
    </div>
  );
}
