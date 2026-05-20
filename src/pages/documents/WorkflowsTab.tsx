import { useState } from "react";
import { Card, CardHeader, Badge, Btn, Modal, FormField, FInput, FSelect, TableWrap, Td, ProgressBar, WORKFLOWS } from "./shared";

export default function WorkflowsTab() {
  const [newWf, setNewWf] = useState(false);
  const [filter, setFilter] = useState("All");

  const statuses = ["All", "In Progress", "Pending", "Completed", "Escalated", "At Risk"];
  const filtered = filter === "All" ? WORKFLOWS : WORKFLOWS.filter((w) => w.status === filter);

  const statusCounts = statuses.slice(1).map((s) => ({ label: s, count: WORKFLOWS.filter((w) => w.status === s).length }));

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Document Workflows</h1>
          <p className="text-sm text-slate-500 mt-0.5">Track and manage approval and review workflows</p>
        </div>
        <div className="flex gap-2">
          <Btn variant="secondary" size="sm">📊 Reports</Btn>
          <Btn variant="primary" size="sm" onClick={() => setNewWf(true)}>+ New Workflow</Btn>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
        {statusCounts.map(({ label, count }) => (
          <button
            key={label}
            onClick={() => setFilter(label)}
            className={`rounded-xl border p-3 text-left transition-colors ${filter === label ? "border-[#0C447C] bg-blue-50" : "bg-white border-slate-100 hover:bg-slate-50"}`}
          >
            <div className="text-xs text-slate-500 font-semibold">{label}</div>
            <div className="text-2xl font-bold text-slate-800 mt-1">{count}</div>
          </button>
        ))}
      </div>

      {/* Status filter tabs */}
      <Card className="mb-4">
        <div className="flex overflow-x-auto">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors border-b-2 ${s === filter ? "text-[#0C447C]" : "text-slate-500 hover:text-slate-700 border-transparent"}`}
              style={s === filter ? { borderBottomColor: "#0C447C" } : {}}
            >{s}</button>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader
          title={`Workflows (${filtered.length})`}
          actions={
            <div className="flex gap-2">
              <FInput placeholder="Search workflows…" className="w-44 text-xs" />
              <FSelect options={["All Types", "HR", "Policy", "Academic", "Institutional"]} className="w-36" />
            </div>
          }
        />
        <TableWrap headers={["Workflow Name", "Type", "Trigger", "Current Step", "Assigned To", "Due Date", "Status", "Progress", "Actions"]}>
          {filtered.map((w, i) => (
            <tr key={i} className={`hover:bg-slate-50 ${w.status === "At Risk" || w.status === "Escalated" ? "bg-red-50/30" : ""}`}>
              <Td>
                <div className="font-medium text-slate-800 text-xs max-w-[180px] truncate">{w.name}</div>
              </Td>
              <Td className="text-xs">{w.type}</Td>
              <Td className="text-xs text-slate-500">{w.trigger}</Td>
              <Td className="text-xs font-medium text-[#0C447C]">{w.step}</Td>
              <Td className="text-xs">{w.assigned}</Td>
              <Td className="text-xs">{w.due}</Td>
              <Td><Badge status={w.status} /></Td>
              <Td>
                <div className="flex items-center gap-2 min-w-[80px]">
                  <ProgressBar pct={w.pct} color={w.pct === 100 ? "#16a34a" : w.pct < 25 ? "#dc2626" : "#0C447C"} />
                  <span className="text-xs text-slate-500 w-8">{w.pct}%</span>
                </div>
              </Td>
              <Td>
                <div className="flex gap-1">
                  <Btn variant="ghost" size="xs">View</Btn>
                  {w.status !== "Completed" && <Btn variant="ghost" size="xs">Nudge</Btn>}
                </div>
              </Td>
            </tr>
          ))}
        </TableWrap>
      </Card>

      <Modal open={newWf} onClose={() => setNewWf(false)} title="Create New Workflow" size="md">
        <FormField label="Workflow Name" required><FInput placeholder="e.g. Policy Review 2026" /></FormField>
        <FormField label="Type" required><FSelect options={["HR", "Policy", "Academic", "Institutional"]} /></FormField>
        <FormField label="Trigger"><FSelect options={["Manual Start", "Doc Upload", "Expiry Reminder", "Annual Trigger", "New Hire"]} /></FormField>
        <FormField label="Assigned Document"><FInput placeholder="Attach document…" /></FormField>
        <FormField label="Due Date"><FInput type="date" /></FormField>
        <FormField label="Workflow Steps (comma-separated)" required><FInput placeholder="Draft, Review, Approve, Sign" /></FormField>
        <div className="flex gap-2 justify-end mt-2">
          <Btn variant="secondary" size="sm" onClick={() => setNewWf(false)}>Cancel</Btn>
          <Btn variant="primary" size="sm">Create Workflow</Btn>
        </div>
      </Modal>
    </div>
  );
}
