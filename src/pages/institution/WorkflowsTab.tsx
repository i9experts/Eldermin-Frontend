import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  Badge, Btn, Card, FInput, FSelect, FormField, Modal, PageHeader,
} from "./shared";
import organizationService from "../../services/organization.service";

const WORKFLOW_MODULES = ["Finance", "HR", "Admissions", "Procurement", "Documents"];

type StepForm = { order: number; approverRole: string; sla: string; requiredChecks: string[]; notifyByEmail: boolean };

const EMPTY_WF_FORM = { name: "", module: "Finance", trigger: "", sla: "", version: "1.0", escalationContact: "", escalationAfter: "" };
const EMPTY_STEPS: StepForm[] = [{ order: 1, approverRole: "", sla: "", requiredChecks: [], notifyByEmail: false }];

function toFormSteps(steps: any[]): StepForm[] {
  if (!steps?.length) return EMPTY_STEPS;
  return steps.map((s: any, idx: number) => ({
    order: idx + 1, approverRole: s.approverRole || "", sla: s.sla || "",
    requiredChecks: s.requiredChecks || [], notifyByEmail: !!s.notifyByEmail,
  }));
}

export default function WorkflowsTab() {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_WF_FORM });
  const [steps, setSteps] = useState<StepForm[]>(EMPTY_STEPS);
  const [checkInput, setCheckInput] = useState<Record<number, string>>({});
  const [editModal, setEditModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ ...EMPTY_WF_FORM });
  const [editSteps, setEditSteps] = useState<StepForm[]>(EMPTY_STEPS);
  const [editCheckInput, setEditCheckInput] = useState<Record<number, string>>({});

  const queryClient = useQueryClient();

  const updateWorkflowMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => organizationService.updateWorkflow(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      toast.success("Workflow updated");
      setEditModal(false);
      setEditingId(null);
      setEditForm({ ...EMPTY_WF_FORM });
      setEditSteps(EMPTY_STEPS);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed"),
  });

  const createWorkflow = useMutation({
    mutationFn: organizationService.createWorkflow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      toast.success("Workflow created");
      closeModal();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed"),
  });

  const { data: workflows = [], isLoading } = useQuery({
    queryKey: ["workflows"],
    queryFn: organizationService.getWorkflows,
  });

  const items = workflows as any[];

  function closeModal() {
    setModal(false);
    setForm({ ...EMPTY_WF_FORM });
    setSteps(EMPTY_STEPS);
    setCheckInput({});
  }

  function updateStep(i: number, field: keyof StepForm, value: any) {
    setSteps((prev) => prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)));
  }
  function addStep() { setSteps((prev) => [...prev, { order: prev.length + 1, approverRole: "", sla: "", requiredChecks: [], notifyByEmail: false }]); }
  function removeStep(i: number) { setSteps((prev) => prev.filter((_, idx) => idx !== i).map((s, idx) => ({ ...s, order: idx + 1 }))); }
  function addCheck(i: number) {
    const val = (checkInput[i] || "").trim();
    if (!val) return;
    updateStep(i, "requiredChecks", [...steps[i].requiredChecks, val]);
    setCheckInput((p) => ({ ...p, [i]: "" }));
  }
  function removeCheck(i: number, checkIdx: number) {
    updateStep(i, "requiredChecks", steps[i].requiredChecks.filter((_, j) => j !== checkIdx));
  }

  function updateEditStep(i: number, field: keyof StepForm, value: any) {
    setEditSteps((prev) => prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)));
  }
  function addEditStep() { setEditSteps((prev) => [...prev, { order: prev.length + 1, approverRole: "", sla: "", requiredChecks: [], notifyByEmail: false }]); }
  function removeEditStep(i: number) { setEditSteps((prev) => prev.filter((_, idx) => idx !== i).map((s, idx) => ({ ...s, order: idx + 1 }))); }
  function addEditCheck(i: number) {
    const val = (editCheckInput[i] || "").trim();
    if (!val) return;
    updateEditStep(i, "requiredChecks", [...editSteps[i].requiredChecks, val]);
    setEditCheckInput((p) => ({ ...p, [i]: "" }));
  }
  function removeEditCheck(i: number, checkIdx: number) {
    updateEditStep(i, "requiredChecks", editSteps[i].requiredChecks.filter((_, j) => j !== checkIdx));
  }

  function handleSave() {
    if (!form.name.trim()) { toast.error("Workflow name is required"); return; }
    const validSteps = steps.filter((s) => s.approverRole.trim());
    createWorkflow.mutate({ ...form, steps: validSteps });
  }

  function openEdit(w: any) {
    setEditingId(w._id);
    setEditForm({
      name: w.name || "", module: w.module || "Finance", trigger: w.trigger || "", sla: w.sla || "",
      version: w.version || "1.0", escalationContact: w.escalationContact || "", escalationAfter: w.escalationAfter || "",
    });
    setEditSteps(toFormSteps(w.steps));
    setEditModal(true);
  }

  function cloneWorkflow(w: any) {
    setForm({
      name: `${w.name} (Copy)`, module: w.module || "Finance", trigger: w.trigger || "", sla: w.sla || "",
      version: "1.0", escalationContact: w.escalationContact || "", escalationAfter: w.escalationAfter || "",
    });
    setSteps(toFormSteps(w.steps));
    setModal(true);
    toast.success("Cloned — review and save as a new workflow");
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-[#0C447C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const stepEditor = (
    stepList: StepForm[], updateFn: (i: number, f: keyof StepForm, v: any) => void,
    addFn: () => void, removeFn: (i: number) => void,
    checkInputMap: Record<number, string>, setCheckInputMap: (v: Record<number, string>) => void,
    addCheckFn: (i: number) => void, removeCheckFn: (i: number, j: number) => void,
  ) => (
    <div className="space-y-2">
      {stepList.map((step, i) => (
        <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-[#0C447C] text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">{step.order}</div>
            <FInput placeholder="Approver role, e.g. Department Head" value={step.approverRole} onChange={(e) => updateFn(i, "approverRole", e.target.value)} />
            <FInput placeholder="SLA (e.g. 24h)" value={step.sla} onChange={(e) => updateFn(i, "sla", e.target.value)} />
            {stepList.length > 1 && <button className="text-red-400 hover:text-red-600 flex-shrink-0" onClick={() => removeFn(i)}>✗</button>}
          </div>
          <div className="pl-9 space-y-1.5">
            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
              <input type="checkbox" checked={step.notifyByEmail} onChange={(e) => updateFn(i, "notifyByEmail", e.target.checked)} className="accent-[#0C447C]" />
              Notify approver by email when it's their turn
            </label>
            <div className="flex gap-1.5">
              <FInput placeholder="Add a required check for this step…" value={checkInputMap[i] || ""}
                onChange={(e) => setCheckInputMap({ ...checkInputMap, [i]: e.target.value })}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCheckFn(i); } }} />
              <Btn variant="secondary" size="sm" onClick={() => addCheckFn(i)}>＋</Btn>
            </div>
            {step.requiredChecks.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {step.requiredChecks.map((c, ci) => (
                  <span key={ci} className="text-[11px] bg-white border border-slate-200 rounded-full px-2 py-0.5 text-slate-600">
                    {c} <button onClick={() => removeCheckFn(i, ci)} className="text-slate-400 hover:text-red-500 ml-1">✕</button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
      <button className="w-full py-2 text-xs text-[#0C447C] border-2 border-dashed border-blue-200 rounded-lg hover:border-[#0C447C] hover:bg-blue-50 transition-colors" onClick={addFn}>＋ Add Approval Step</button>
    </div>
  );

  return (
    <div className="space-y-5">
      <PageHeader
        breadcrumbs={["Home", "Institution Setup", "Workflows"]}
        title="Approval Workflow Builder"
        subtitle={`${items.length} workflows — configure multi-level authorization`}
        actions={<Btn variant="primary" size="sm" onClick={() => setModal(true)}>＋ Create Workflow</Btn>}
      />

      {items.length === 0 && (
        <div className="py-16 text-center text-sm text-slate-400">
          No workflows defined yet. Click ＋ Create Workflow to build your first approval workflow.
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {items.map((w: any) => (
          <Card key={w._id} className="p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">{w.name}</span>
                  <span className="text-[10px] text-slate-400">v{w.version || "1.0"}</span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5">Module: {w.module} · Trigger: {w.trigger || "—"}</div>
              </div>
              <Badge status={w.status === "active" ? "Active" : "Inactive"} />
            </div>
            {(w.steps?.length ?? 0) > 0 ? (
              <div className="flex items-center gap-1 mb-3 overflow-x-auto py-1">
                {w.steps.map((step: any, i: number, arr: any[]) => (
                  <div key={i} className="flex items-center gap-1 flex-shrink-0">
                    {i > 0 && <div className="w-4 h-0.5 bg-slate-200 flex-shrink-0" />}
                    <div className={`px-2 py-1 rounded-md text-xs font-medium flex-shrink-0 ${i === 0 ? "bg-blue-50 text-[#0C447C]" : i === arr.length - 1 ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                      {step.approverRole}{step.notifyByEmail ? " 📧" : ""}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-400 mb-3 py-1">No approval steps configured</div>
            )}
            {w.escalationContact && (
              <div className="text-xs text-amber-600 mb-2">⚠️ Escalates to {w.escalationContact}{w.escalationAfter ? ` after ${w.escalationAfter}` : ""}</div>
            )}
            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
              <div className="text-xs text-slate-400">SLA: <span className="font-medium text-slate-700">{w.sla ?? "—"}</span> · {w.steps?.length ?? 0} levels</div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(w)} className="px-2 py-1 text-xs bg-blue-50 text-[#0C447C] rounded-lg hover:bg-blue-100 font-medium">Edit</button>
                <button onClick={() => cloneWorkflow(w)} className="px-2 py-1 text-xs bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 font-medium">Clone</button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={editModal} onClose={() => { setEditModal(false); setEditForm({ ...EMPTY_WF_FORM }); }} title="Edit Workflow" size="lg">
        <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Workflow Name" required>
              <FInput value={editForm.name} onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="e.g. Budget Approval Workflow" />
            </FormField>
            <FormField label="Module">
              <FSelect options={WORKFLOW_MODULES} value={editForm.module} onChange={(e) => setEditForm((prev) => ({ ...prev, module: e.target.value }))} />
            </FormField>
            <FormField label="Trigger Event">
              <FInput value={editForm.trigger} onChange={(e) => setEditForm((prev) => ({ ...prev, trigger: e.target.value }))} placeholder="e.g. Budget Request Submitted" />
            </FormField>
            <FormField label="Overall SLA">
              <FInput value={editForm.sla} onChange={(e) => setEditForm((prev) => ({ ...prev, sla: e.target.value }))} placeholder="e.g. 48 hrs" />
            </FormField>
            <FormField label="Version">
              <FInput value={editForm.version} onChange={(e) => setEditForm((prev) => ({ ...prev, version: e.target.value }))} placeholder="1.0" />
            </FormField>
            <FormField label="Escalation Contact">
              <FInput value={editForm.escalationContact} onChange={(e) => setEditForm((prev) => ({ ...prev, escalationContact: e.target.value }))} placeholder="Who to notify if SLA is breached" />
            </FormField>
            <FormField label="Escalate After">
              <FInput value={editForm.escalationAfter} onChange={(e) => setEditForm((prev) => ({ ...prev, escalationAfter: e.target.value }))} placeholder="e.g. 48h past SLA" />
            </FormField>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">Approval Steps</label>
            {stepEditor(editSteps, updateEditStep, addEditStep, removeEditStep, editCheckInput, setEditCheckInput, addEditCheck, removeEditCheck)}
          </div>
        </div>
        <div className="p-5 border-t border-slate-100 flex justify-end gap-2">
          <Btn variant="secondary" onClick={() => { setEditModal(false); setEditForm({ ...EMPTY_WF_FORM }); setEditSteps(EMPTY_STEPS); }}>Cancel</Btn>
          <Btn variant="primary" onClick={() => {
            if (!editingId) return;
            const validSteps = editSteps.filter((s) => s.approverRole.trim());
            updateWorkflowMut.mutate({ id: editingId, data: { ...editForm, steps: validSteps } });
          }}>
            {updateWorkflowMut.isPending ? "Saving…" : "✓ Save Changes"}
          </Btn>
        </div>
      </Modal>

      <Modal open={modal} onClose={closeModal} title="Create New Workflow" size="lg">
        <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Workflow Name" required>
              <FInput placeholder="e.g. Budget Approval Workflow" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            </FormField>
            <FormField label="Module">
              <FSelect options={WORKFLOW_MODULES} value={form.module} onChange={(e) => setForm((p) => ({ ...p, module: e.target.value }))} />
            </FormField>
            <FormField label="Trigger Event">
              <FInput placeholder="e.g. Budget Request Submitted" value={form.trigger} onChange={(e) => setForm((p) => ({ ...p, trigger: e.target.value }))} />
            </FormField>
            <FormField label="Overall SLA">
              <FInput placeholder="e.g. 48 hrs" value={form.sla} onChange={(e) => setForm((p) => ({ ...p, sla: e.target.value }))} />
            </FormField>
            <FormField label="Version">
              <FInput value={form.version} onChange={(e) => setForm((p) => ({ ...p, version: e.target.value }))} placeholder="1.0" />
            </FormField>
            <FormField label="Escalation Contact">
              <FInput value={form.escalationContact} onChange={(e) => setForm((p) => ({ ...p, escalationContact: e.target.value }))} placeholder="Who to notify if SLA is breached" />
            </FormField>
            <FormField label="Escalate After">
              <FInput value={form.escalationAfter} onChange={(e) => setForm((p) => ({ ...p, escalationAfter: e.target.value }))} placeholder="e.g. 48h past SLA" />
            </FormField>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">Approval Steps</label>
            {stepEditor(steps, updateStep, addStep, removeStep, checkInput, setCheckInput, addCheck, removeCheck)}
          </div>
        </div>
        <div className="p-5 border-t border-slate-100 flex justify-end gap-2">
          <Btn variant="secondary" onClick={closeModal}>Cancel</Btn>
          <Btn variant="primary" onClick={handleSave}>{createWorkflow.isPending ? "Creating…" : "✓ Save Workflow"}</Btn>
        </div>
      </Modal>
    </div>
  );
}
