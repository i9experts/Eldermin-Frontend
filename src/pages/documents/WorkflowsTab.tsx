import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Card, CardHeader, Badge, Btn, Modal, FormField, FInput, FSelect, TableWrap, Td, ProgressBar } from "./shared";
import documentsService from "../../services/documents.service";

const API_STATUS_MAP: Record<string, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  approved: "Completed",
  rejected: "Completed",
  cancelled: "Completed",
};

function mapWorkflow(w: any) {
  const steps: any[] = w.steps ?? [];
  const total = steps.length;
  const completed = steps.filter((s: any) => s.status === "approved" || s.status === "skipped").length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const currentStepObj = steps.find((s: any) => s.status === "pending") ?? steps[total - 1];
  const statusLabel = API_STATUS_MAP[w.status] ?? w.status ?? "Pending";
  return {
    _id: w._id,
    name: w.subject || w.workflowName,
    type: w.workflowType,
    trigger: w.instanceNumber || "Manual",
    step: currentStepObj?.stepName || "—",
    assigned: currentStepObj?.assignedTo || w.initiatedBy || "—",
    due: w.dueDate ? new Date(w.dueDate).toLocaleDateString() : "—",
    status: statusLabel,
    pct,
  };
}

export default function WorkflowsTab() {
  const [newWf, setNewWf] = useState(false);
  const [filter, setFilter] = useState("All");
  const [wfForm, setWfForm] = useState({ name: "", type: "custom", subject: "", dueDate: "" });

  const queryClient = useQueryClient();

  const { data: rawWorkflows = [], isLoading } = useQuery({
    queryKey: ["workflows"],
    queryFn: () => documentsService.getWorkflows(),
  });

  const { data: templates = [] } = useQuery({
    queryKey: ["workflow-templates"],
    queryFn: () => documentsService.getWorkflowTemplates(),
  });

  const initiateWf = useMutation({
    mutationFn: documentsService.initiateWorkflow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      toast.success("Workflow started");
      setNewWf(false);
      setWfForm({ name: "", type: "custom", subject: "", dueDate: "" });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed"),
  });

  const wfList: any[] = Array.isArray(rawWorkflows) ? rawWorkflows : ((rawWorkflows as any)?.data ?? []);
  const tmplList: any[] = Array.isArray(templates) ? templates : ((templates as any)?.data ?? []);
  const WORKFLOWS = wfList.map(mapWorkflow);
  const statuses = ["All", "In Progress", "Pending", "Completed", "Escalated", "At Risk"];
  const filtered = filter === "All" ? WORKFLOWS : WORKFLOWS.filter((w) => w.status === filter);
  const statusCounts = statuses.slice(1).map((s) => ({ label: s, count: WORKFLOWS.filter((w) => w.status === s).length }));

  function handleCreate() {
    if (!wfForm.name || !wfForm.type) { toast.error("Name and type are required"); return; }
    const tmpl = tmplList.find((t: any) => t.type === wfForm.type);
    initiateWf.mutate({
      workflowName: wfForm.name,
      workflowType: wfForm.type,
      subject: wfForm.subject || wfForm.name,
      templateId: tmpl?._id,
      steps: tmpl?.steps ?? [],
      dueDate: wfForm.dueDate || undefined,
    });
  }

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
        <TableWrap headers={["Workflow Name", "Type", "Instance #", "Current Step", "Assigned To", "Due Date", "Status", "Progress", "Actions"]}>
          {isLoading ? (
            <tr><td colSpan={9} className="px-4 py-12 text-center"><div className="w-6 h-6 border-4 border-[#0C447C] border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
          ) : filtered.length === 0 ? (
            <tr><td colSpan={9} className="px-4 py-12 text-center text-sm text-slate-400">
              {WORKFLOWS.length === 0 ? "No workflows yet. Click + New Workflow to start one." : "No workflows match this filter."}
            </td></tr>
          ) : filtered.map((w, i) => (
            <tr key={w._id || i} className={`hover:bg-slate-50 ${w.status === "At Risk" || w.status === "Escalated" ? "bg-red-50/30" : ""}`}>
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
        <FormField label="Workflow Name" required>
          <FInput placeholder="e.g. Policy Review 2026" value={wfForm.name} onChange={e => setWfForm(f => ({ ...f, name: e.target.value }))} />
        </FormField>
        <FormField label="Type" required>
          <FSelect options={["custom", "leave", "expense", "procurement", "admission", "document", "hr_action"]} value={wfForm.type} onChange={e => setWfForm(f => ({ ...f, type: e.target.value }))} />
        </FormField>
        <FormField label="Subject">
          <FInput placeholder="Brief description…" value={wfForm.subject} onChange={e => setWfForm(f => ({ ...f, subject: e.target.value }))} />
        </FormField>
        <FormField label="Due Date">
          <FInput type="date" value={wfForm.dueDate} onChange={e => setWfForm(f => ({ ...f, dueDate: e.target.value }))} />
        </FormField>
        <div className="flex gap-2 justify-end mt-2">
          <Btn variant="secondary" size="sm" onClick={() => setNewWf(false)}>Cancel</Btn>
          <Btn variant="primary" size="sm" onClick={handleCreate}>{initiateWf.isPending ? "Creating…" : "Create Workflow"}</Btn>
        </div>
      </Modal>
    </div>
  );
}
