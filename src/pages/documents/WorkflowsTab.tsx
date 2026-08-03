import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Card, CardHeader, Badge, Btn, Modal, FormField, FInput, FSelect, TableWrap, Td, ProgressBar } from "./shared";
import documentsService from "../../services/documents.service";
import { useStaffList } from "../../hooks/useStaffList";

const API_STATUS_MAP: Record<string, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  approved: "Completed",
  rejected: "Completed",
  cancelled: "Completed",
};

const ACTION_TYPES = ["approve", "review", "acknowledge", "sign", "upload_doc"];
const WORKFLOW_TYPES = ["custom", "leave", "expense", "procurement", "admission", "document", "hr_action"];
const NO_ASSIGNEE = "-- Unassigned (role only) --";

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

type StepDraft = { name: string; action: string; assignedTo: string; dueDays: string; instructions: string };
const EMPTY_STEP: StepDraft = { name: "", action: "approve", assignedTo: NO_ASSIGNEE, dueDays: "2", instructions: "" };

export default function WorkflowsTab() {
  const [newWf, setNewWf] = useState(false);
  const [newTemplate, setNewTemplate] = useState(false);
  const [filter, setFilter] = useState("All");
  const [wfForm, setWfForm] = useState({ templateId: "", subject: "", dueDate: "" });
  const [tmplForm, setTmplForm] = useState({ name: "", type: "custom" });
  const [stepDrafts, setStepDrafts] = useState<StepDraft[]>([{ ...EMPTY_STEP }]);

  const queryClient = useQueryClient();
  const { data: staff = [] } = useStaffList();
  const staffOptions = [NO_ASSIGNEE, ...(staff as any[]).map((s: any) => `${s.firstName || ""} ${s.lastName || ""}`.trim()).filter(Boolean)];

  const { data: rawWorkflows = [], isLoading } = useQuery({
    queryKey: ["workflows"],
    queryFn: () => documentsService.getWorkflows(),
  });

  const { data: templates = [] } = useQuery({
    queryKey: ["workflow-templates"],
    queryFn: () => documentsService.getWorkflowTemplates(),
  });

  const seedTemplates = useMutation({
    mutationFn: documentsService.seedWorkflowTemplates,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflow-templates"] });
      toast.success("Standard templates added (Expense, Leave, Procurement, Admission)");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to seed templates"),
  });

  const createTemplate = useMutation({
    mutationFn: documentsService.createWorkflowTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflow-templates"] });
      toast.success("Template created");
      setNewTemplate(false);
      setTmplForm({ name: "", type: "custom" });
      setStepDrafts([{ ...EMPTY_STEP }]);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to create template"),
  });

  const initiateWf = useMutation({
    mutationFn: documentsService.initiateWorkflow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      toast.success("Workflow started");
      setNewWf(false);
      setWfForm({ templateId: "", subject: "", dueDate: "" });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to start workflow"),
  });

  const wfList: any[] = Array.isArray(rawWorkflows) ? rawWorkflows : ((rawWorkflows as any)?.data ?? []);
  const tmplList: any[] = Array.isArray(templates) ? templates : ((templates as any)?.data ?? []);
  const WORKFLOWS = wfList.map(mapWorkflow);
  const statuses = ["All", "In Progress", "Pending", "Completed", "Escalated", "At Risk"];
  const filtered = filter === "All" ? WORKFLOWS : WORKFLOWS.filter((w) => w.status === filter);
  const statusCounts = statuses.slice(1).map((s) => ({ label: s, count: WORKFLOWS.filter((w) => w.status === s).length }));

  function handleCreateWorkflow() {
    if (!wfForm.templateId) { toast.error("Select a workflow template"); return; }
    const tmpl = tmplList.find((t: any) => t._id === wfForm.templateId);
    if (!tmpl) { toast.error("Template not found - try refreshing"); return; }
    initiateWf.mutate({
      workflowName: tmpl.name,
      workflowType: tmpl.type,
      subject: wfForm.subject || tmpl.name,
      templateId: tmpl._id,
      dueDate: wfForm.dueDate || undefined,
    });
  }

  function addStepDraft() {
    setStepDrafts((prev) => [...prev, { ...EMPTY_STEP }]);
  }
  function removeStepDraft(i: number) {
    setStepDrafts((prev) => prev.filter((_, idx) => idx !== i));
  }
  function updateStepDraft(i: number, field: keyof StepDraft, value: string) {
    setStepDrafts((prev) => prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)));
  }

  function handleCreateTemplate() {
    if (!tmplForm.name.trim()) { toast.error("Template name is required"); return; }
    const validSteps = stepDrafts.filter((s) => s.name.trim());
    if (validSteps.length === 0) { toast.error("Add at least one step"); return; }
    createTemplate.mutate({
      name: tmplForm.name,
      type: tmplForm.type,
      steps: validSteps.map((s, i) => ({
        name: s.name,
        order: i + 1,
        action: s.action,
        assignedTo: s.assignedTo === NO_ASSIGNEE ? undefined : s.assignedTo,
        dueDays: Number(s.dueDays) || 2,
        instructions: s.instructions || undefined,
      })),
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
          {tmplList.length === 0 && (
            <Btn variant="secondary" size="sm" onClick={() => seedTemplates.mutate()}>
              {seedTemplates.isPending ? "Adding…" : "＋ Seed Standard Templates"}
            </Btn>
          )}
          <Btn variant="secondary" size="sm" onClick={() => setNewTemplate(true)}>＋ New Template</Btn>
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
        <CardHeader title={`Workflows (${filtered.length})`} />
        <TableWrap headers={["Workflow Name", "Type", "Instance #", "Current Step", "Assigned To", "Due Date", "Status", "Progress", "Actions"]}>
          {isLoading ? (
            <tr><td colSpan={9} className="px-4 py-12 text-center"><div className="w-6 h-6 border-4 border-[#0C447C] border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
          ) : filtered.length === 0 ? (
            <tr><td colSpan={9} className="px-4 py-12 text-center text-sm text-slate-400">
              {WORKFLOWS.length === 0
                ? (tmplList.length === 0
                    ? "No templates exist yet — click ＋ Seed Standard Templates or ＋ New Template first, then + New Workflow to start one."
                    : "No workflows yet. Click + New Workflow to start one.")
                : "No workflows match this filter."}
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

      {/* Create Workflow (start an instance from a real template) */}
      <Modal open={newWf} onClose={() => setNewWf(false)} title="Start a Workflow" size="md">
        <FormField label="Workflow Template" required>
          <FSelect
            options={["Select a template…", ...tmplList.map((t: any) => `${t.name} (${t.steps?.length ?? 0} steps)`)]}
            value={wfForm.templateId ? `${tmplList.find((t: any) => t._id === wfForm.templateId)?.name} (${tmplList.find((t: any) => t._id === wfForm.templateId)?.steps?.length ?? 0} steps)` : "Select a template…"}
            onChange={(e) => {
              const picked = tmplList.find((t: any) => `${t.name} (${t.steps?.length ?? 0} steps)` === e.target.value);
              setWfForm((f) => ({ ...f, templateId: picked?._id || "" }));
            }}
          />
          {tmplList.length === 0 && <p className="text-xs text-amber-600 mt-1">No templates exist yet — close this and click "Seed Standard Templates" or "New Template" first.</p>}
        </FormField>
        <FormField label="Subject">
          <FInput placeholder="Brief description of this specific case…" value={wfForm.subject} onChange={e => setWfForm(f => ({ ...f, subject: e.target.value }))} />
        </FormField>
        <FormField label="Due Date">
          <FInput type="date" value={wfForm.dueDate} onChange={e => setWfForm(f => ({ ...f, dueDate: e.target.value }))} />
        </FormField>
        <div className="flex gap-2 justify-end mt-2">
          <Btn variant="secondary" size="sm" onClick={() => setNewWf(false)}>Cancel</Btn>
          <Btn variant="primary" size="sm" onClick={handleCreateWorkflow}>{initiateWf.isPending ? "Starting…" : "Start Workflow"}</Btn>
        </div>
      </Modal>

      {/* Create Template */}
      <Modal open={newTemplate} onClose={() => setNewTemplate(false)} title="New Workflow Template" size="lg">
        <FormField label="Template Name" required>
          <FInput placeholder="e.g. Fee Waiver Sign-off" value={tmplForm.name} onChange={e => setTmplForm(f => ({ ...f, name: e.target.value }))} />
        </FormField>
        <FormField label="Type" required>
          <FSelect options={WORKFLOW_TYPES} value={tmplForm.type} onChange={e => setTmplForm(f => ({ ...f, type: e.target.value }))} />
        </FormField>

        <div className="mt-3">
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Steps (in order)</label>
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {stepDrafts.map((s, i) => (
              <div key={i} className="border border-slate-200 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Step {i + 1}</span>
                  {stepDrafts.length > 1 && (
                    <button onClick={() => removeStepDraft(i)} className="text-xs text-red-500 hover:underline">Remove</button>
                  )}
                </div>
                <FInput placeholder="Step name, e.g. Finance Manager Approval" value={s.name} onChange={e => updateStepDraft(i, "name", e.target.value)} />
                <div className="grid grid-cols-3 gap-2">
                  <FSelect options={ACTION_TYPES} value={s.action} onChange={e => updateStepDraft(i, "action", e.target.value)} />
                  <FSelect options={staffOptions} value={s.assignedTo} onChange={e => updateStepDraft(i, "assignedTo", e.target.value)} />
                  <FInput type="number" placeholder="Due days" value={s.dueDays} onChange={e => updateStepDraft(i, "dueDays", e.target.value)} />
                </div>
              </div>
            ))}
          </div>
          <button onClick={addStepDraft} className="text-xs text-[#0C447C] font-medium hover:underline mt-2">＋ Add Step</button>
          <p className="text-xs text-slate-400 mt-2">
            Assign each step to a real staff member so it shows up in their "My Approvals" inbox — leaving it unassigned means someone will need to action it manually from the workflow list instead.
          </p>
        </div>

        <div className="flex gap-2 justify-end mt-4">
          <Btn variant="secondary" size="sm" onClick={() => setNewTemplate(false)}>Cancel</Btn>
          <Btn variant="primary" size="sm" onClick={handleCreateTemplate}>{createTemplate.isPending ? "Saving…" : "Create Template"}</Btn>
        </div>
      </Modal>
    </div>
  );
}
