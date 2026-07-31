import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  Badge, Btn, Card, EmptyState, FInput, FSelect, FormField, Modal, PageHeader, TabBar,
} from "./shared";
import organizationService from "../../services/organization.service";
import { useStaffList } from "../../hooks/useStaffList";

const CATEGORIES = ["policy", "budget", "hiring", "procurement", "hr", "academic", "other"];
const PRIORITIES = ["low", "medium", "high", "urgent"];
const PRIORITY_COLOR: Record<string, string> = {
  low: "bg-slate-100 text-slate-600", medium: "bg-blue-50 text-blue-700",
  high: "bg-amber-50 text-amber-700", urgent: "bg-red-50 text-red-700",
};

const EMPTY_FORM = {
  title: "", description: "", category: "other", priority: "medium",
  dueDate: "", approvalChain: [] as string[],
};

function statusLabel(s: string) {
  const m: Record<string, string> = { pending: "Pending", approved: "Approved", rejected: "Rejected", on_hold: "Under Review" };
  return m[s] ?? s;
}

export default function ApprovalsTab() {
  const [tab, setTab] = useState("Pending");
  const [decideModal, setDecideModal] = useState<{ approval: any; decision: "approved" | "rejected" } | null>(null);
  const [decisionNote, setDecisionNote] = useState("");
  const [createModal, setCreateModal] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [chainInput, setChainInput] = useState("");

  const queryClient = useQueryClient();

  const { data: approvals = [], isLoading } = useQuery({
    queryKey: ["approvals"],
    queryFn: () => organizationService.getApprovals(),
  });
  const { data: staffList = [] } = useStaffList();
  const { data: workflows = [] } = useQuery({
    queryKey: ["workflows"],
    queryFn: organizationService.getWorkflows,
  });

  const decide = useMutation({
    mutationFn: ({ id, decision, comments }: { id: string; decision: "approved" | "rejected"; comments: string }) =>
      organizationService.decideApproval(id, decision, comments),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approvals"] });
      toast.success(decideModal?.decision === "approved" ? "Stage approved" : "Request rejected");
      setDecideModal(null);
      setDecisionNote("");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed"),
  });

  const createApproval = useMutation({
    mutationFn: (data: any) => organizationService.createApproval(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approvals"] });
      toast.success("Approval request created");
      setCreateModal(false);
      setForm({ ...EMPTY_FORM });
      setChainInput("");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed"),
  });

  const items = approvals as any[];

  const filtered = items.filter((a) =>
    tab === "All" ? true :
    tab === "Pending" ? (a.status === "pending" || a.status === "on_hold") :
    tab === "Approved" ? a.status === "approved" :
    a.status === "rejected"
  );

  function addChainMember(name: string) {
    if (name && !form.approvalChain.includes(name)) {
      setForm((p) => ({ ...p, approvalChain: [...p.approvalChain, name] }));
    }
    setChainInput("");
  }

  function applyWorkflowTemplate(workflowId: string) {
    const wf = (workflows as any[]).find((w) => w._id === workflowId);
    if (!wf) return;
    setForm((p) => ({
      ...p,
      category: wf.module === "Finance" ? "budget" : wf.module === "HR" ? "hr" : wf.module === "Procurement" ? "procurement" : wf.module === "Admissions" ? "academic" : "policy",
      approvalChain: (wf.steps || []).map((s: any) => s.approverRole),
    }));
    toast.success(`Applied "${wf.name}" — ${(wf.steps || []).length} step(s) added to the chain`);
  }

  function handleCreate() {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    createApproval.mutate({ ...form, dueDate: form.dueDate || undefined });
  }

  function currentStageOf(a: any) {
    const chain = a.approvalChain || [];
    if (chain.length === 0) return null;
    const idx = chain.findIndex((s: any) => s.status === "pending");
    return idx === -1 ? chain[chain.length - 1] : chain[idx];
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
        breadcrumbs={["Home", "Institution Setup", "Approvals"]}
        title="Approval Dashboard"
        subtitle={`${items.filter((a) => a.status === "pending" || a.status === "on_hold").length} pending actions require attention`}
        actions={<Btn variant="primary" size="sm" onClick={() => setCreateModal(true)}>＋ New Approval Request</Btn>}
      />

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Pending",      count: items.filter((a) => a.status === "pending").length,   color: "bg-blue-50 text-[#0C447C] border-blue-100" },
          { label: "Under Review", count: items.filter((a) => a.status === "on_hold").length,   color: "bg-purple-50 text-purple-700 border-purple-100" },
          { label: "Approved",     count: items.filter((a) => a.status === "approved").length,  color: "bg-emerald-50 text-emerald-700 border-emerald-100" },
          { label: "Rejected",     count: items.filter((a) => a.status === "rejected").length,  color: "bg-red-50 text-red-700 border-red-100" },
        ].map((s) => (
          <div key={s.label} className={`p-4 rounded-xl border ${s.color} flex items-center gap-3`}>
            <div className="text-2xl font-bold">{s.count}</div>
            <div className="text-sm font-medium">{s.label}</div>
          </div>
        ))}
      </div>

      <TabBar tabs={["Pending", "Under Review", "Approved", "All"]} active={tab} onChange={setTab} />

      <div className="space-y-3">
        {filtered.map((a: any) => {
          const chain = a.approvalChain || [];
          const stage = currentStageOf(a);
          const canDecide = (a.status === "pending" || a.status === "on_hold") && stage;
          const doneCount = chain.filter((s: any) => s.status !== "pending").length;
          return (
            <Card key={a._id} className="p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-slate-900">{a.title}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${PRIORITY_COLOR[a.priority] || "bg-slate-100 text-slate-600"}`}>{a.priority}</span>
                  </div>
                  {a.description && <p className="text-xs text-slate-500 mb-2">{a.description}</p>}
                  <div className="flex items-center gap-3 text-xs text-slate-400 mb-3 flex-wrap">
                    <span>📁 {a.category}</span>
                    <span>👤 {a.requestedBy || "—"}</span>
                    {a.dueDate && <span>📅 Due: {new Date(a.dueDate).toLocaleDateString()}</span>}
                  </div>
                  {chain.length > 0 ? (
                    <div className="flex items-center gap-1 flex-wrap">
                      {chain.map((step: any, i: number) => (
                        <div key={i} className="flex items-center gap-1">
                          {i > 0 && <div className={`h-0.5 w-6 ${step.status !== "pending" ? (step.status === "rejected" ? "bg-red-400" : "bg-emerald-400") : "bg-slate-200"}`} />}
                          <div
                            className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                              step.status === "approved" ? "bg-emerald-500" :
                              step.status === "rejected" ? "bg-red-500" :
                              stage === step ? "bg-[#EF9F27] ring-2 ring-amber-200" : "bg-slate-200"
                            }`}
                            title={`${step.approverName} — ${step.status}`}
                          />
                        </div>
                      ))}
                      <span className="ml-2 text-xs text-slate-400">
                        {a.status === "approved" ? "Fully approved" : a.status === "rejected" ? `Rejected at ${stage?.approverName || "—"}` : `Awaiting ${stage?.approverName || "—"} (${doneCount + 1} of ${chain.length})`}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">No approval chain — single-step request</span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge status={statusLabel(a.status)} />
                  {canDecide && (
                    <div className="flex gap-1">
                      <button onClick={() => { setDecideModal({ approval: a, decision: "approved" }); setDecisionNote(""); }}
                        className="px-3 py-1.5 bg-emerald-600 text-white text-xs rounded-lg hover:bg-emerald-700 font-medium">✓ Approve</button>
                      <button onClick={() => { setDecideModal({ approval: a, decision: "rejected" }); setDecisionNote(""); }}
                        className="px-3 py-1.5 bg-red-50 text-red-600 text-xs rounded-lg hover:bg-red-100 font-medium">✗ Reject</button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
        {filtered.length === 0 && <EmptyState icon="✅" title="No approvals" desc="Nothing to show in this category" />}
      </div>

      {/* ── Decide Modal ────────────────────────────────────────────── */}
      <Modal open={!!decideModal} onClose={() => { setDecideModal(null); setDecisionNote(""); }} title={decideModal?.decision === "approved" ? "Approve Request" : "Reject Request"} size="sm">
        {decideModal && (
          <div className="p-5">
            <div className={`p-3 rounded-lg mb-4 text-sm ${decideModal.decision === "approved" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
              You are about to <strong>{decideModal.decision === "approved" ? "approve" : "reject"}</strong> the current stage of this request.
              {decideModal.decision === "rejected" && " This will reject the entire request, not just this stage."}
            </div>
            <div className="text-sm font-medium text-slate-800 mb-1">{decideModal.approval.title}</div>
            <div className="text-xs text-slate-400 mb-4">{decideModal.approval.category} · {decideModal.approval.requestedBy || "—"}</div>
            <FormField label={decideModal.decision === "approved" ? "Approval Comment" : "Reason for Rejection"}>
              <textarea className={`w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 resize-none ${decideModal.decision === "approved" ? "focus:ring-emerald-500" : "focus:ring-red-500"}`}
                rows={3} placeholder="Add your comments…"
                value={decisionNote} onChange={(e) => setDecisionNote(e.target.value)} />
            </FormField>
            <div className="flex justify-end gap-2 mt-4">
              <Btn variant="secondary" onClick={() => { setDecideModal(null); setDecisionNote(""); }}>Cancel</Btn>
              <Btn variant={decideModal.decision === "approved" ? "success" : "secondary"}
                onClick={() => decide.mutate({ id: decideModal.approval._id, decision: decideModal.decision, comments: decisionNote })}>
                {decide.isPending ? "Saving…" : decideModal.decision === "approved" ? "✓ Confirm Approval" : "✗ Confirm Rejection"}
              </Btn>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Create Approval Request Modal ───────────────────────────── */}
      <Modal open={createModal} onClose={() => { setCreateModal(false); setForm({ ...EMPTY_FORM }); }} title="New Approval Request" size="md">
        <div className="p-5 grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <FormField label="Title" required>
              <FInput value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="e.g. Approve annual budget for Science block renovation" />
            </FormField>
          </div>
          <div className="col-span-2">
            <FormField label="Description">
              <textarea className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C] resize-none" rows={2}
                value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Context for the approver(s)…" />
            </FormField>
          </div>
          <FormField label="Category">
            <FSelect options={CATEGORIES} value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} />
          </FormField>
          <FormField label="Priority">
            <FSelect options={PRIORITIES} value={form.priority} onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))} />
          </FormField>
          <FormField label="Due Date">
            <FInput type="date" value={form.dueDate} onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))} />
          </FormField>
          <div className="col-span-2">
            <FormField label="Approval Chain (in order)">
              <div className="border border-slate-200 rounded-lg p-3">
                {(workflows as any[]).length > 0 && (
                  <div className="mb-2 pb-2 border-b border-slate-100">
                    <FSelect
                      options={["Use a Workflow Template…", ...(workflows as any[]).filter((w) => w.status === "active").map((w: any) => `${w.name} (${w.steps?.length ?? 0} steps)`)]}
                      onChange={(e) => {
                        if (e.target.value === "Use a Workflow Template…") return;
                        const wf = (workflows as any[]).find((w) => `${w.name} (${w.steps?.length ?? 0} steps)` === e.target.value);
                        if (wf) applyWorkflowTemplate(wf._id);
                      }}
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Instantly builds the chain below from a pre-defined workflow — see the Workflows tab to manage these templates</p>
                  </div>
                )}
                {staffList.length > 0 && (
                  <FSelect
                    options={["Add approver…", ...staffList.map((s: any) => `${s.firstName} ${s.lastName}`)]}
                    onChange={(e) => addChainMember(e.target.value === "Add approver…" ? "" : e.target.value)}
                  />
                )}
                <div className="flex gap-2 mt-2">
                  <FInput placeholder="Or type a name/role…" value={chainInput} onChange={(e) => setChainInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addChainMember(chainInput.trim()); } }} />
                  <Btn variant="secondary" size="sm" onClick={() => addChainMember(chainInput.trim())}>＋ Add</Btn>
                </div>
                {form.approvalChain.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    {form.approvalChain.map((name, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs bg-slate-50 rounded-lg px-3 py-2">
                        <span className="font-bold text-slate-400">{i + 1}.</span>
                        <span className="flex-1 text-slate-700">{name}</span>
                        <button onClick={() => setForm((p) => ({ ...p, approvalChain: p.approvalChain.filter((_, j) => j !== i) }))} className="text-red-400 hover:text-red-600">✕</button>
                      </div>
                    ))}
                  </div>
                )}
                {form.approvalChain.length === 0 && <p className="text-xs text-slate-400 mt-2">No approval chain set — this will be a single-step request with no sequential sign-off.</p>}
              </div>
            </FormField>
          </div>
        </div>
        <div className="p-5 border-t border-slate-100 flex justify-end gap-2">
          <Btn variant="secondary" onClick={() => { setCreateModal(false); setForm({ ...EMPTY_FORM }); }}>Cancel</Btn>
          <Btn variant="primary" onClick={handleCreate}>{createApproval.isPending ? "Creating…" : "＋ Create Request"}</Btn>
        </div>
      </Modal>
    </div>
  );
}
