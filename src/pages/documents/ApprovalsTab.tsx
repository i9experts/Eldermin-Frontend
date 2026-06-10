import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Card, CardHeader, Badge, Btn, Modal, FormField, FInput, FSelect, TableWrap, Td } from "./shared";
import documentsService from "../../services/documents.service";

type ApprovalFilter = "Pending" | "Approved" | "Rejected" | "Escalated";

const FILTER_TABS: ApprovalFilter[] = ["Pending", "Approved", "Rejected", "Escalated"];

const STATUS_MAP: Record<string, ApprovalFilter> = {
  pending: "Pending",
  in_progress: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Rejected",
};

function mapApproval(w: any) {
  const fmtDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—";
  const priority = w.priority ? w.priority.charAt(0).toUpperCase() + w.priority.slice(1) : "Medium";
  return {
    _id: w._id,
    title: w.subject || w.workflowName || "Untitled",
    doc: w.instanceNumber || w.workflowType || "—",
    requestor: w.initiatedBy || "—",
    dept: w.workflowType || "—",
    priority,
    submitted: fmtDate(w.createdAt),
    due: fmtDate(w.dueDate),
    status: STATUS_MAP[w.status] ?? "Pending",
  };
}

export default function ApprovalsTab() {
  const [tab, setTab] = useState<ApprovalFilter>("Pending");
  const [approve, setApprove] = useState<any | null>(null);
  const [reject, setReject] = useState<any | null>(null);
  const [approveComment, setApproveComment] = useState("");
  const [rejectComment, setRejectComment] = useState("");
  const [rejectReason, setRejectReason] = useState("Incomplete information");

  const qc = useQueryClient();

  const { data: rawApprovals = [], isLoading } = useQuery({
    queryKey: ["my-approvals"],
    queryFn: documentsService.getMyApprovals,
  });

  const takeAction = useMutation({
    mutationFn: ({ id, action, comment }: { id: string; action: string; comment?: string }) =>
      documentsService.takeAction(id, { action, comment }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["my-approvals"] });
      qc.invalidateQueries({ queryKey: ["workflows"] });
      toast.success(vars.action === "approve" ? "Approved successfully" : "Rejected");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Action failed"),
  });

  const approvalList: any[] = Array.isArray(rawApprovals) ? rawApprovals : ((rawApprovals as any)?.data ?? []);
  const approvals = approvalList.map(mapApproval);

  const tabFiltered = approvals.filter((a) =>
    tab === "Escalated" ? false : a.status === tab
  );

  const counts: Record<ApprovalFilter, number> = {
    Pending:   approvals.filter(a => a.status === "Pending").length,
    Approved:  approvals.filter(a => a.status === "Approved").length,
    Rejected:  approvals.filter(a => a.status === "Rejected").length,
    Escalated: 0,
  };

  function handleApprove() {
    if (!approve) return;
    takeAction.mutate({ id: approve._id, action: "approve", comment: approveComment });
    setApprove(null);
    setApproveComment("");
  }

  function handleReject() {
    if (!reject) return;
    takeAction.mutate({ id: reject._id, action: "reject", comment: `${rejectReason}${rejectComment ? ` — ${rejectComment}` : ""}` });
    setReject(null);
    setRejectComment("");
    setRejectReason("Incomplete information");
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Document Approvals</h1>
          <p className="text-sm text-slate-500 mt-0.5">Review and act on pending document approvals</p>
        </div>
        <div className="flex gap-2">
          <Btn variant="secondary" size="sm">📊 Export</Btn>
          <Btn variant="amber" size="sm">⚡ Bulk Approve</Btn>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {FILTER_TABS.map((f) => (
          <button
            key={f}
            onClick={() => setTab(f)}
            className={`rounded-xl border p-3 text-left transition-colors ${tab === f ? "border-[#0C447C] bg-blue-50" : "bg-white border-slate-100 hover:bg-slate-50"}`}
          >
            <div className="text-xs text-slate-500 font-semibold">{f}</div>
            <div className="text-2xl font-bold text-slate-800 mt-1">{counts[f]}</div>
          </button>
        ))}
      </div>

      {/* Tab bar */}
      <Card>
        <div className="flex border-b border-slate-100">
          {FILTER_TABS.map((f) => (
            <button
              key={f}
              onClick={() => setTab(f)}
              className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${f === tab ? "text-[#0C447C]" : "text-slate-500 hover:text-slate-700 border-transparent"}`}
              style={f === tab ? { borderBottomColor: "#0C447C" } : {}}
            >
              {f}
              {counts[f] > 0 && (
                <span className={`text-xs px-1.5 rounded-full font-bold ${f === "Escalated" ? "bg-red-100 text-red-700" : f === "Pending" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
                  {counts[f]}
                </span>
              )}
            </button>
          ))}
        </div>

        <CardHeader
          title=""
          actions={
            <div className="flex gap-2">
              <FInput placeholder="Search…" className="w-40 text-xs" />
              <FSelect options={["All Priorities", "Critical", "High", "Medium", "Low"]} className="w-36" />
              <FSelect options={["All Departments", "HR & Admin", "Academic", "Finance", "Operations"]} className="w-40" />
            </div>
          }
        />

        <TableWrap headers={["Document", "Requestor", "Department", "Priority", "Submitted", "Due", "Status", "Actions"]}>
          {isLoading ? (
            <tr><td colSpan={8} className="py-12 text-center"><div className="w-6 h-6 border-4 border-[#0C447C] border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
          ) : tabFiltered.length === 0 ? (
            <tr>
              <td colSpan={8} className="py-10 text-center text-slate-400 text-sm">No {tab.toLowerCase()} approvals</td>
            </tr>
          ) : tabFiltered.map((a, i) => (
            <tr key={a._id || i} className={`hover:bg-slate-50 ${a.priority === "Critical" ? "bg-red-50/30" : ""}`}>
              <Td>
                <div className="font-medium text-slate-800 text-xs">{a.title}</div>
                <div className="text-xs text-slate-400 mt-0.5">📄 {a.doc}</div>
              </Td>
              <Td className="text-xs">{a.requestor}</Td>
              <Td className="text-xs">{a.dept}</Td>
              <Td><Badge status={a.priority} /></Td>
              <Td className="text-xs text-slate-500">{a.submitted}</Td>
              <Td className={`text-xs font-medium ${typeof a.due === "string" && a.due.includes("overdue") ? "text-red-600" : "text-slate-700"}`}>{a.due}</Td>
              <Td><Badge status={a.status} /></Td>
              <Td>
                {tab === "Pending" ? (
                  <div className="flex gap-1">
                    <Btn variant="success" size="xs" onClick={() => setApprove(a)}>✓ Approve</Btn>
                    <Btn variant="danger" size="xs" onClick={() => setReject(a)}>✕ Reject</Btn>
                    <Btn variant="ghost" size="xs">👁 View</Btn>
                  </div>
                ) : (
                  <Btn variant="ghost" size="xs">👁 View</Btn>
                )}
              </Td>
            </tr>
          ))}
        </TableWrap>
      </Card>

      {/* Approve Modal */}
      <Modal open={!!approve} onClose={() => setApprove(null)} title="Approve Document" size="sm">
        {approve && (
          <>
            <p className="text-sm text-slate-700 mb-3">You are approving: <strong>{approve.title}</strong></p>
            <FormField label="Approval Comments">
              <textarea
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]"
                rows={3}
                placeholder="Add comments (optional)…"
                value={approveComment}
                onChange={e => setApproveComment(e.target.value)}
              />
            </FormField>
            <div className="flex gap-2 justify-end mt-2">
              <Btn variant="secondary" size="sm" onClick={() => setApprove(null)}>Cancel</Btn>
              <Btn variant="success" size="sm" onClick={handleApprove}>
                {takeAction.isPending ? "Approving…" : "✓ Confirm Approval"}
              </Btn>
            </div>
          </>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal open={!!reject} onClose={() => setReject(null)} title="Reject Document" size="sm">
        {reject && (
          <>
            <p className="text-sm text-slate-700 mb-3">You are rejecting: <strong>{reject.title}</strong></p>
            <FormField label="Rejection Reason" required>
              <FSelect
                options={["Incomplete information", "Policy violation", "Incorrect format", "Needs revision", "Other"]}
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
              />
            </FormField>
            <FormField label="Comments">
              <textarea
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]"
                rows={3}
                placeholder="Provide feedback to requestor…"
                value={rejectComment}
                onChange={e => setRejectComment(e.target.value)}
              />
            </FormField>
            <div className="flex gap-2 justify-end mt-2">
              <Btn variant="secondary" size="sm" onClick={() => setReject(null)}>Cancel</Btn>
              <Btn variant="danger" size="sm" onClick={handleReject}>
                {takeAction.isPending ? "Rejecting…" : "✕ Confirm Rejection"}
              </Btn>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
