import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  Badge, Btn, Card, EmptyState, FormField, Modal, PageHeader, TabBar,
} from "./shared";
import organizationService from "../../services/organization.service";

const workflowSteps = [
  { label: "Request Submitted", done: true },
  { label: "Department Head Review", done: true },
  { label: "Principal Approval", active: true },
  { label: "Director Approval", done: false },
  { label: "Final Closure", done: false },
];

function statusLabel(s: string) {
  const m: Record<string, string> = { pending: "Pending", approved: "Approved", rejected: "Rejected", on_hold: "Under Review" };
  return m[s] ?? s;
}

export default function ApprovalsTab() {
  const [tab, setTab] = useState("Pending");
  const [modal, setModal] = useState<any | null>(null);
  const [decisionNote, setDecisionNote] = useState("");

  const queryClient = useQueryClient();

  const { data: approvals = [], isLoading } = useQuery({
    queryKey: ["approvals"],
    queryFn: organizationService.getApprovals,
  });

  const approveRequest = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => organizationService.updateApproval(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approvals"] });
      toast.success("Request approved");
      setModal(null);
      setDecisionNote("");
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
        actions={<Btn variant="secondary" size="sm">📊 Report</Btn>}
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
        {filtered.map((a: any) => (
          <Card key={a._id} className="p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-slate-900">{a.title}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
                  <span>📁 {a.category}</span>
                  <span>👤 {a.requestedBy || "—"}</span>
                  <span>📍 Level: <strong className="text-slate-600">—</strong></span>
                  <span>📅 Due: —</span>
                </div>
                <div className="flex items-center gap-1">
                  {workflowSteps.map((step, i) => (
                    <div key={i} className="flex items-center gap-1">
                      {i > 0 && <div className={`h-0.5 w-6 ${step.done ? "bg-emerald-400" : "bg-slate-200"}`} />}
                      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${"active" in step && step.active ? "bg-[#EF9F27] ring-2 ring-amber-200" : step.done ? "bg-emerald-500" : "bg-slate-200"}`} title={step.label} />
                    </div>
                  ))}
                  <span className="ml-2 text-xs text-slate-400">Step {workflowSteps.filter((s) => s.done).length + 1} of {workflowSteps.length}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge status={statusLabel(a.status)} />
                {(a.status === "pending" || a.status === "on_hold") && (
                  <div className="flex gap-1">
                    <button onClick={() => { setModal(a); setDecisionNote(""); }}
                      className="px-3 py-1.5 bg-emerald-600 text-white text-xs rounded-lg hover:bg-emerald-700 font-medium">✓ Approve</button>
                    <button className="px-3 py-1.5 bg-red-50 text-red-600 text-xs rounded-lg hover:bg-red-100 font-medium">✗ Reject</button>
                    <button className="px-3 py-1.5 bg-slate-50 text-slate-600 text-xs rounded-lg hover:bg-slate-100 font-medium">💬</button>
                    <button className="px-3 py-1.5 bg-slate-50 text-slate-600 text-xs rounded-lg hover:bg-slate-100 font-medium">↗ Forward</button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
        {filtered.length === 0 && <EmptyState icon="✅" title="No approvals" desc="Nothing to show in this category" />}
      </div>

      <Modal open={!!modal} onClose={() => { setModal(null); setDecisionNote(""); }} title="Approve Request" size="sm">
        {modal && (
          <div className="p-5">
            <div className="p-3 bg-emerald-50 rounded-lg mb-4 text-sm text-emerald-700">
              You are about to <strong>approve</strong> this request. This action will move it to the next approval level.
            </div>
            <div className="text-sm font-medium text-slate-800 mb-1">{modal.title}</div>
            <div className="text-xs text-slate-400 mb-4">{modal.category} · {modal.requestedBy || "—"}</div>
            <FormField label="Approval Comment">
              <textarea className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                rows={3} placeholder="Add your comments (optional)…"
                value={decisionNote} onChange={(e) => setDecisionNote(e.target.value)} />
            </FormField>
            <div className="flex justify-end gap-2 mt-4">
              <Btn variant="secondary" onClick={() => { setModal(null); setDecisionNote(""); }}>Cancel</Btn>
              <Btn variant="success" onClick={() => approveRequest.mutate({ id: modal._id, data: { status: "approved", decisionNote, decidedAt: new Date().toISOString() } })}>
                {approveRequest.isPending ? "Approving…" : "✓ Confirm Approval"}
              </Btn>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
