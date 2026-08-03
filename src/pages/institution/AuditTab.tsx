import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  AvatarBubble, Badge, Btn, Card, Modal, PageHeader, SearchBar, TableWrapper,
} from "./shared";
import organizationService from "../../services/organization.service";
import { useAuth } from "../../contexts/AuthContext";

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows.map(r => r.map(c => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

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
  const [showOrgHierarchy, setShowOrgHierarchy] = useState(false);
  const [showDelegationReport, setShowDelegationReport] = useState(false);
  const { institution } = useAuth();

  const { data: campuses = [] } = useQuery({ queryKey: ["campuses"], queryFn: organizationService.getCampuses });
  const { data: departments = [] } = useQuery({ queryKey: ["departments"], queryFn: organizationService.getDepartments });
  const { data: delegations = [] } = useQuery({ queryKey: ["delegations"], queryFn: organizationService.getDelegations });

  function exportOrgHierarchyCsv() {
    const rows: (string | number)[][] = [
      ["Organization Hierarchy Report"],
      ["Institution", institution?.name || "—"],
      [],
      ["CAMPUSES"],
      ["Name", "Code", "Address", "Status"],
      ...(campuses as any[]).map((c) => [c.name, c.code || "—", c.address || "—", c.isActive ? "Active" : "Inactive"]),
      [],
      ["DEPARTMENTS"],
      ["Name", "Code", "Head", "Status"],
      ...(departments as any[]).map((d) => [d.name, d.code || "—", d.head || "—", d.isActive ? "Active" : "Inactive"]),
    ];
    downloadCsv(`organization-hierarchy-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  }

  function exportDelegationCsv() {
    const rows: (string | number)[][] = [
      ["Authority Delegation Report"],
      ["Institution", institution?.name || "—"],
      [],
      ["Delegator", "Delegator Role", "Delegate", "Delegate Role", "Scope", "Reason", "Start Date", "End Date", "Status"],
      ...(delegations as any[]).map((d) => [
        d.delegatorName, d.delegatorRole || "—", d.delegateName, d.delegateRole || "—",
        d.scope, d.reason || "—",
        new Date(d.startDate).toLocaleDateString(), new Date(d.endDate).toLocaleDateString(),
        d.computedStatus,
      ]),
    ];
    downloadCsv(`authority-delegation-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  }

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
            <Btn
              variant="secondary"
              size="sm"
              onClick={() => {
                if (filtered.length === 0) { toast.error("No audit log entries to export yet"); return; }
                downloadCsv(
                  `audit-log-${new Date().toISOString().slice(0, 10)}.csv`,
                  [["Date & Time", "User", "Action", "Module", "Record", "IP Address", "Status"],
                    ...filtered.map((l) => [l.time, l.user, l.action, l.module, l.record, l.ip, l.status])],
                );
              }}
            >⬇️ Export CSV</Btn>
          </div>
        }
      />

      <div className="grid grid-cols-3 gap-4">
        {[
          { title: "Organization Hierarchy Report", icon: "🏛️", desc: "Full org structure with campuses and departments", onGenerate: () => setShowOrgHierarchy(true), onExport: exportOrgHierarchyCsv },
          { title: "Governance Meetings Report", icon: "📅", desc: "Meeting attendance, minutes, and resolutions" },
          { title: "Policy Review Report", icon: "📋", desc: "Policy status, expiry, and review schedule" },
          { title: "Approval Workflow Report", icon: "✅", desc: "Approval turnaround times and bottlenecks" },
          { title: "Authority Delegation Report", icon: "🔑", desc: "Active delegations and expiry dates", onGenerate: () => setShowDelegationReport(true), onExport: exportDelegationCsv },
          { title: "User Access Report", icon: "🔐", desc: "Role-based access and permissions audit" },
        ].map((r: any) => (
          <Card key={r.title} className="p-4 cursor-pointer hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
              <span className="text-2xl">{r.icon}</span>
              <div className="flex-1">
                <div className="text-sm font-semibold text-slate-900 mb-0.5">{r.title}</div>
                <div className="text-xs text-slate-400">{r.desc}</div>
              </div>
            </div>
            <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
              <button
                onClick={r.onGenerate || (() => toast("This report isn't built yet — coming soon", { icon: "🚧" }))}
                className="flex-1 text-xs py-1.5 bg-blue-50 text-[#0C447C] rounded-lg hover:bg-blue-100 font-medium"
              >📊 Generate</button>
              <button
                onClick={r.onExport || (() => toast("This report isn't built yet — coming soon", { icon: "🚧" }))}
                className="text-xs py-1.5 px-3 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 font-medium"
              >⬇️ Export</button>
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
        <div className="p-4 border-t border-slate-100">
          <span className="text-xs text-slate-400">Showing {filtered.length} entries</span>
        </div>
      </Card>

      {/* ── Organization Hierarchy Report ────────────────────────── */}
      <Modal open={showOrgHierarchy} onClose={() => setShowOrgHierarchy(false)} title="Organization Hierarchy Report" size="lg">
        <div className="p-5 space-y-5">
          <div className="text-center pb-3 border-b border-slate-100">
            <p className="text-lg font-bold text-slate-900">{institution?.name || "Your Institution"}</p>
            <p className="text-xs text-slate-400">Generated {new Date().toLocaleString()}</p>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">Campuses ({(campuses as any[]).length})</h3>
            {(campuses as any[]).length === 0 ? (
              <p className="text-sm text-slate-400">No campuses set up yet.</p>
            ) : (
              <div className="space-y-1.5">
                {(campuses as any[]).map((c: any) => (
                  <div key={c._id} className="flex items-center justify-between text-sm bg-slate-50 rounded-lg px-3 py-2">
                    <div>
                      <span className="font-semibold text-slate-800">{c.name}</span>
                      {c.code && <span className="text-xs text-slate-400 ml-2">({c.code})</span>}
                      {c.address && <p className="text-xs text-slate-400">{c.address}</p>}
                    </div>
                    <Badge status={c.isActive ? "Active" : "Inactive"} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">Departments ({(departments as any[]).length})</h3>
            {(departments as any[]).length === 0 ? (
              <p className="text-sm text-slate-400">No departments set up yet.</p>
            ) : (
              <div className="space-y-1.5">
                {(departments as any[]).map((d: any) => (
                  <div key={d._id} className="flex items-center justify-between text-sm bg-slate-50 rounded-lg px-3 py-2">
                    <div>
                      <span className="font-semibold text-slate-800">{d.name}</span>
                      {d.code && <span className="text-xs text-slate-400 ml-2">({d.code})</span>}
                      {d.head && <p className="text-xs text-slate-400">Head: {d.head}</p>}
                    </div>
                    <Badge status={d.isActive ? "Active" : "Inactive"} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="p-5 border-t border-slate-100 flex justify-end gap-2">
          <Btn variant="secondary" onClick={() => setShowOrgHierarchy(false)}>Close</Btn>
          <Btn variant="primary" onClick={exportOrgHierarchyCsv}>⬇️ Export CSV</Btn>
        </div>
      </Modal>

      {/* ── Authority Delegation Report ──────────────────────────── */}
      <Modal open={showDelegationReport} onClose={() => setShowDelegationReport(false)} title="Authority Delegation Report" size="lg">
        <div className="p-5 space-y-4">
          <div className="text-center pb-3 border-b border-slate-100">
            <p className="text-lg font-bold text-slate-900">{institution?.name || "Your Institution"}</p>
            <p className="text-xs text-slate-400">Generated {new Date().toLocaleString()} · {(delegations as any[]).length} delegation{(delegations as any[]).length !== 1 ? "s" : ""} recorded</p>
          </div>
          {(delegations as any[]).length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No delegations recorded yet — set one up under Institution Setup → Authority Delegation.</p>
          ) : (
            <div className="space-y-1.5">
              {(delegations as any[]).map((del: any) => (
                <div key={del._id} className="flex items-center justify-between text-sm bg-slate-50 rounded-lg px-3 py-2">
                  <div>
                    <span className="font-semibold text-slate-800">{del.delegatorName}</span>
                    <span className="text-xs text-slate-400 mx-1.5">→</span>
                    <span className="font-semibold text-slate-800">{del.delegateName}</span>
                    <p className="text-xs text-slate-400">
                      {del.scope} · {new Date(del.startDate).toLocaleDateString()} – {new Date(del.endDate).toLocaleDateString()}
                      {del.reason ? ` · ${del.reason}` : ""}
                    </p>
                  </div>
                  {del.computedStatus === "revoked" ? <Badge status="Inactive" /> :
                   del.computedStatus === "expired" ? <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Expired</span> :
                   <Badge status="Active" />}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="p-5 border-t border-slate-100 flex justify-end gap-2">
          <Btn variant="secondary" onClick={() => setShowDelegationReport(false)}>Close</Btn>
          <Btn variant="primary" onClick={exportDelegationCsv}>⬇️ Export CSV</Btn>
        </div>
      </Modal>
    </div>
  );
}
