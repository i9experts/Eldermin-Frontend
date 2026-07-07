import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  Badge, Btn, Card, FInput, FSelect, FormField, Modal, PageHeader,
} from "./shared";
import organizationService from "../../services/organization.service";

const WORKFLOW_MODULES = ["Finance", "HR", "Admissions", "Procurement", "Documents"];

type StepForm = { order: number; approverRole: string; sla: string };

const EMPTY_WF_FORM = { name: "", module: "Finance", trigger: "", sla: "" };
const EMPTY_STEPS: StepForm[] = [{ order: 1, approverRole: "", sla: "" }];

export default function WorkflowsTab() {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_WF_FORM });
  const [steps, setSteps] = useState<StepForm[]>(EMPTY_STEPS);
  const [editModal, setEditModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ ...EMPTY_WF_FORM });
  const [editSteps, setEditSteps] = useState<StepForm[]>(EMPTY_STEPS);

  const queryClient = useQueryClient();

  const updateWorkflowMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof EMPTY_WF_FORM & { steps?: StepForm[] } }) =>
      organizationService.updateWorkflow(id, data),
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
      setModal(false);
      setForm({ ...EMPTY_WF_FORM });
      setSteps(EMPTY_STEPS);
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
  }

  function updateStep(i: number, field: keyof StepForm, value: string) {
    setSteps((prev) => prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)));
  }

  function addStep() {
    setSteps((prev) => [...prev, { order: prev.length + 1, approverRole: "", sla: "" }]);
  }

  function removeStep(i: number) {
    setSteps((prev) => prev.filter((_, idx) => idx !== i).map((s, idx) => ({ ...s, order: idx + 1 })));
  }

  function updateEditStep(i: number, field: keyof StepForm, value: string) {
    setEditSteps((prev) => prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)));
  }

  function addEditStep() {
    setEditSteps((prev) => [...prev, { order: prev.length + 1, approverRole: "", sla: "" }]);
  }

  function removeEditStep(i: number) {
    setEditSteps((prev) => prev.filter((_, idx) => idx !== i).map((s, idx) => ({ ...s, order: idx + 1 })));
  }

  function handleSave() {
    if (!form.name.trim()) { toast.error("Workflow name is required"); return; }
    const validSteps = steps.filter((s) => s.approverRole.trim());
    createWorkflow.mutate({ ...form, steps: validSteps });
  }

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
                <div className="text-sm font-bold text-slate-900">{w.name}</div>
                <div className="text-xs text-slate-400 mt-0.5">Module: {w.module} · Trigger: {w.trigger}</div>
              </div>
              <Badge status={w.status === "active" ? "Active" : "Inactive"} />
            </div>
            {(w.steps?.length ?? 0) > 0 ? (
              <div className="flex items-center gap-1 mb-3 overflow-x-auto py-1">
                {w.steps.map((step: any, i: number, arr: any[]) => (
                  <div key={i} className="flex items-center gap-1 flex-shrink-0">
                    {i > 0 && <div className="w-4 h-0.5 bg-slate-200 flex-shrink-0" />}
                    <div className={`px-2 py-1 rounded-md text-xs font-medium flex-shrink-0 ${i === 0 ? "bg-blue-50 text-[#0C447C]" : i === arr.length - 1 ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                      {step.approverRole}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-400 mb-3 py-1">No approval steps configured</div>
            )}
            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
              <div className="text-xs text-slate-400">SLA: <span className="font-medium text-slate-700">{w.sla ?? "—"}</span> · {w.steps?.length ?? 0} levels</div>
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    setEditingId(w._id);
                    setEditForm({ name: w.name || "", module: w.module || "Finance", trigger: w.trigger || "", sla: w.sla || "" });
                    setEditSteps(w.steps?.length ? w.steps.map((s: any, idx: number) => ({ order: idx + 1, approverRole: s.approverRole || "", sla: s.sla || "" })) : EMPTY_STEPS);
                    setEditModal(true);
                  }}
                  className="px-2 py-1 text-xs bg-blue-50 text-[#0C447C] rounded-lg hover:bg-blue-100 font-medium"
                >Edit</button>
                <button className="px-2 py-1 text-xs bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 font-medium">Clone</button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={editModal} onClose={() => { setEditModal(false); setEditForm({ ...EMPTY_WF_FORM }); }} title="Edit Workflow" size="lg">
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Workflow Name" required>
              <FInput value={editForm.name} onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="e.g. Budget Approval Workflow" />
            </FormField>
            <FormField label="Module">
              <FSelect
                options={WORKFLOW_MODULES}
                value={editForm.module}
                onChange={(e) => setEditForm((prev) => ({ ...prev, module: e.target.value }))}
              />
            </FormField>
            <FormField label="Trigger Event">
              <FInput value={editForm.trigger} onChange={(e) => setEditForm((prev) => ({ ...prev, trigger: e.target.value }))} placeholder="e.g. Budget Request Submitted" />
            </FormField>
            <FormField label="SLA Time">
              <FInput value={editForm.sla} onChange={(e) => setEditForm((prev) => ({ ...prev, sla: e.target.value }))} placeholder="e.g. 48 hrs" />
            </FormField>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">Approval Steps</label>
            <div className="space-y-2">
              {editSteps.map((step, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="w-6 h-6 bg-[#0C447C] text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">{step.order}</div>
                  <FInput placeholder="Approver role, e.g. Department Head" value={step.approverRole} onChange={(e) => updateEditStep(i, "approverRole", e.target.value)} />
                  <FInput placeholder="SLA (e.g. 24h)" value={step.sla} onChange={(e) => updateEditStep(i, "sla", e.target.value)} />
                  {editSteps.length > 1 && (
                    <button className="text-red-400 hover:text-red-600 flex-shrink-0" onClick={() => removeEditStep(i)}>✗</button>
                  )}
                </div>
              ))}
              <button className="w-full py-2 text-xs text-[#0C447C] border-2 border-dashed border-blue-200 rounded-lg hover:border-[#0C447C] hover:bg-blue-50 transition-colors" onClick={addEditStep}>＋ Add Approval Step</button>
            </div>
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
        <div className="p-5 space-y-4">
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
            <FormField label="SLA Time">
              <FInput placeholder="e.g. 48 hrs" value={form.sla} onChange={(e) => setForm((p) => ({ ...p, sla: e.target.value }))} />
            </FormField>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">Approval Steps</label>
            <div className="space-y-2">
              {steps.map((step, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="w-6 h-6 bg-[#0C447C] text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">{step.order}</div>
                  <FInput placeholder="Approver role, e.g. Department Head" value={step.approverRole} onChange={(e) => updateStep(i, "approverRole", e.target.value)} />
                  <FInput placeholder="SLA (e.g. 24h)" value={step.sla} onChange={(e) => updateStep(i, "sla", e.target.value)} />
                  {steps.length > 1 && (
                    <button className="text-red-400 hover:text-red-600 flex-shrink-0" onClick={() => removeStep(i)}>✗</button>
                  )}
                </div>
              ))}
              <button className="w-full py-2 text-xs text-[#0C447C] border-2 border-dashed border-blue-200 rounded-lg hover:border-[#0C447C] hover:bg-blue-50 transition-colors" onClick={addStep}>＋ Add Approval Step</button>
            </div>
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
