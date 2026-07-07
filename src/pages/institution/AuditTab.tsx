import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AvatarBubble, Badge, Btn, Card, PageHeader, SearchBar, TableWrapper,
} from "./shared";
import organizationService from "../../services/organization.service";

const TYPE_STATUS: Record<string, string> = {
  create: "Approved", update: "Info", delete: "Rejected",
  login: "Approved", logout: "Info", export: "Info", other: "Info", read: "Info",
};

function toRow(log: any) {
  return {
    id: log._id,
    time: log.createdAt ? new Date(log.createdAt).toLocaleString() : "—",
    user: log.performedBy || "System",
    action: log.action || log.type || "—",
    module: log.module || "—",
    record: log.resourceTitle || log.resourceId || "—",
    ip: log.ipAddress || "—",
    status: TYPE_STATUS[log.type] || "Info",
  };
}

export default function AuditTab() {
  const [search, setSearch] = useState("");

  const { data: auditLogs = [], isLoading } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: () => organizationService.getAuditLogs(),
  });

  const rows = (auditLogs as any[]).map(toRow);

  const filtered = rows.filter(
    (l) => l.user.toLowerCase().includes(search.toLowerCase()) ||
            l.action.toLowerCase().includes(search.toLowerCase()) ||
            l.module.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-[#0C447C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        breadcrumbs={["Home", "Institution Setup", "Audit Logs"]}
        title="Reports & Audit Logs"
        subtitle="Complete audit trail for governance, approvals, and system actions"
        actions={
          <div className="flex gap-2">
            <Btn variant="secondary" size="sm">⬇️ Export CSV</Btn>
            <Btn variant="secondary" size="sm">📊 Generate Report</Btn>
          </div>
        }
      />

      <div className="grid grid-cols-3 gap-4">
        {[
          { title: "Organization Hierarchy Report", icon: "🏛️", desc: "Full org structure with campuses and departments" },
          { title: "Governance Meetings Report", icon: "📅", desc: "Meeting attendance, minutes, and resolutions" },
          { title: "Policy Review Report", icon: "📋", desc: "Policy status, expiry, and review schedule" },
          { title: "Approval Workflow Report", icon: "✅", desc: "Approval turnaround times and bottlenecks" },
          { title: "Authority Delegation Report", icon: "🔑", desc: "Active delegations and expiry dates" },
          { title: "User Access Report", icon: "🔐", desc: "Role-based access and permissions audit" },
        ].map((r) => (
          <Card key={r.title} className="p-4 cursor-pointer hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
              <span className="text-2xl">{r.icon}</span>
              <div className="flex-1">
                <div className="text-sm font-semibold text-slate-900 mb-0.5">{r.title}</div>
                <div className="text-xs text-slate-400">{r.desc}</div>
              </div>
            </div>
            <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
              <button className="flex-1 text-xs py-1.5 bg-blue-50 text-[#0C447C] rounded-lg hover:bg-blue-100 font-medium">📊 Generate</button>
              <button className="text-xs py-1.5 px-3 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 font-medium">⬇️ Export</button>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 text-sm">System Audit Log</h3>
          <SearchBar placeholder="Search logs…" value={search} onChange={setSearch} />
        </div>
        <TableWrapper headers={["Date & Time", "User", "Action", "Module", "Record", "IP Address", "Status"]}>
          {filtered.map((log) => (
            <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
              <td className="py-3 px-4 text-xs font-mono text-slate-500">{log.time}</td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-1.5"><AvatarBubble name={log.user} /><span className="text-xs text-slate-700">{log.user}</span></div>
              </td>
              <td className="py-3 px-4">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  log.action === "Approved" ? "bg-emerald-50 text-emerald-700" :
                  log.action === "Rejected" ? "bg-red-50 text-red-700" :
                  log.action === "Created" ? "bg-blue-50 text-[#0C447C]" :
                  "bg-slate-100 text-slate-600"
                }`}>{log.action}</span>
              </td>
              <td className="py-3 px-4 text-xs text-slate-600">{log.module}</td>
              <td className="py-3 px-4 text-xs text-slate-600 max-w-[200px] truncate">{log.record}</td>
              <td className="py-3 px-4 text-xs font-mono text-slate-400">{log.ip}</td>
              <td className="py-3 px-4"><Badge status={log.status} /></td>
            </tr>
          ))}
        </TableWrapper>
        <div className="p-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-400">Showing {filtered.length} entries</span>
          <div className="flex gap-1">
            {[1, 2, 3, 4].map((n) => (
              <button key={n} className={`w-8 h-8 text-xs rounded-lg ${n === 1 ? "bg-[#0C447C] text-white" : "bg-slate-50 text-slate-600"}`}>{n}</button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
