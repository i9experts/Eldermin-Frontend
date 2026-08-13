import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import * as complaintsApi from "../../services/complaints.api";
import { StudentSelect } from "../../components/ui/StudentSelect";

const STATUS_STYLE: Record<string, string> = {
  open: "bg-amber-50 text-amber-700 border-amber-200",
  in_process: "bg-blue-50 text-blue-700 border-blue-200",
  closed: "bg-emerald-50 text-emerald-700 border-emerald-200",
};
const PRIORITY_STYLE: Record<string, string> = {
  low: "bg-slate-100 text-slate-500 border-slate-200",
  medium: "bg-blue-50 text-blue-600 border-blue-200",
  high: "bg-amber-50 text-amber-700 border-amber-200",
  urgent: "bg-red-50 text-red-700 border-red-200",
};

function NewCaseModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [caseGroup, setCaseGroup] = useState("");
  const [caseType, setCaseType] = useState("");
  const [raisedByName, setRaisedByName] = useState("");
  const [raisedByType, setRaisedByType] = useState("parent");
  const [priority, setPriority] = useState("medium");
  const [studentId, setStudentId] = useState("");
  const [slaHours, setSlaHours] = useState(48);

  const mut = useMutation({
    mutationFn: () => complaintsApi.createCase({
      title, description, caseGroup, caseType, raisedByName, raisedByType, priority, studentId: studentId || undefined, slaHours,
    }),
    onSuccess: () => { toast.success("Case created"); qc.invalidateQueries({ queryKey: ["complaint-cases"] }); onClose(); },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Failed to create case"),
  });

  const inputCls = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0C447C]";
  const labelCls = "block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5";

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col" style={{ maxHeight: "92vh" }}>
        <div className="bg-[#0C447C] rounded-t-2xl px-5 py-4 flex items-center justify-between">
          <h2 className="font-bold text-white">Raise New Case</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white">✕</button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className={labelCls}>Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className={inputCls} placeholder="e.g. Bus consistently late" />
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className={inputCls + " resize-none"} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Case Group</label>
              <input value={caseGroup} onChange={e => setCaseGroup(e.target.value)} className={inputCls} placeholder="e.g. Transport" />
            </div>
            <div>
              <label className={labelCls}>Case Type</label>
              <input value={caseType} onChange={e => setCaseType(e.target.value)} className={inputCls} placeholder="e.g. Bus Delay" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Raised By</label>
              <input value={raisedByName} onChange={e => setRaisedByName(e.target.value)} className={inputCls} placeholder="Name" />
            </div>
            <div>
              <label className={labelCls}>Raised By Type</label>
              <select value={raisedByType} onChange={e => setRaisedByType(e.target.value)} className={inputCls}>
                <option value="parent">Parent</option>
                <option value="staff">Staff</option>
                <option value="student">Student</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls}>Related Student (optional)</label>
            <StudentSelect value={studentId} onChange={(id) => setStudentId(id)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Priority</label>
              <select value={priority} onChange={e => setPriority(e.target.value)} className={inputCls}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>SLA (hours)</label>
              <input type="number" value={slaHours} onChange={e => setSlaHours(Number(e.target.value))} className={inputCls} />
            </div>
          </div>
        </div>
        <div className="p-5 border-t border-slate-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button>
          <button
            onClick={() => mut.mutate()}
            disabled={!title || !description || !raisedByName || mut.isPending}
            className="px-4 py-2 bg-[#0C447C] text-white text-sm font-medium rounded-lg hover:bg-[#0b3d6e] disabled:opacity-40"
          >
            {mut.isPending ? "Creating…" : "Create Case"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CaseDetailDrawer({ caseId, onClose }: { caseId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const { data: c } = useQuery({ queryKey: ["complaint-case", caseId], queryFn: () => complaintsApi.fetchCaseById(caseId) });
  const [remarkText, setRemarkText] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");

  const remarkMut = useMutation({
    mutationFn: () => complaintsApi.addRemark(caseId, remarkText),
    onSuccess: () => { toast.success("Remark added"); setRemarkText(""); qc.invalidateQueries({ queryKey: ["complaint-case", caseId] }); qc.invalidateQueries({ queryKey: ["complaint-cases"] }); },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Failed"),
  });
  const closeMut = useMutation({
    mutationFn: () => complaintsApi.closeCase(caseId, resolutionNotes),
    onSuccess: () => { toast.success("Case closed"); qc.invalidateQueries({ queryKey: ["complaint-cases"] }); onClose(); },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Failed"),
  });

  if (!c) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md h-full overflow-y-auto shadow-2xl">
        <div className="bg-[#0C447C] px-5 py-4 flex items-center justify-between sticky top-0">
          <div>
            <h2 className="font-bold text-white text-sm">{c.caseNumber}</h2>
            <p className="text-blue-200 text-xs">{c.title}</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex gap-2">
            <span className={`px-2 py-0.5 border rounded-full text-xs font-medium ${STATUS_STYLE[c.status]}`}>{c.status}</span>
            <span className={`px-2 py-0.5 border rounded-full text-xs font-medium ${PRIORITY_STYLE[c.priority]}`}>{c.priority}</span>
          </div>
          <p className="text-sm text-slate-600">{c.description}</p>
          <div className="text-xs text-slate-500 space-y-1">
            <p>Raised by: <strong>{c.raisedByName}</strong> ({c.raisedByType})</p>
            {c.studentName && <p>Student: <strong>{c.studentName}</strong></p>}
            <p>Assigned to: <strong>{c.assignedToName || "Unassigned"}</strong></p>
            <p>Due by: <strong>{new Date(c.dueBy).toLocaleString()}</strong></p>
            {c.currentEscalationLevel > 0 && <p className="text-red-600 font-semibold">Escalated to level {c.currentEscalationLevel}</p>}
          </div>

          {c.remarks?.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">Remarks</h3>
              <div className="space-y-2">
                {c.remarks.map((r: any) => (
                  <div key={r._id} className="bg-slate-50 rounded-lg p-2.5 text-xs">
                    <p className="text-slate-700">{r.text}</p>
                    <p className="text-slate-400 mt-1">{r.addedBy} · {new Date(r.addedAt).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {c.status !== "closed" && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Add Remark</label>
                <div className="flex gap-2">
                  <input value={remarkText} onChange={e => setRemarkText(e.target.value)} className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="Follow-up note…" />
                  <button onClick={() => remarkMut.mutate()} disabled={!remarkText || remarkMut.isPending} className="px-3 py-2 bg-[#0C447C] text-white text-xs font-semibold rounded-lg disabled:opacity-40">Add</button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Close Case</label>
                <textarea value={resolutionNotes} onChange={e => setResolutionNotes(e.target.value)} rows={2} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none mb-2" placeholder="Resolution notes…" />
                <button onClick={() => closeMut.mutate()} disabled={!resolutionNotes || closeMut.isPending} className="w-full py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg disabled:opacity-40">
                  {closeMut.isPending ? "Closing…" : "Close Case"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ComplaintsTab() {
  const qc = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [selectedCase, setSelectedCase] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");

  const { data: aging } = useQuery({ queryKey: ["complaint-aging"], queryFn: complaintsApi.fetchAging });
  const { data: casesResp, isLoading } = useQuery({
    queryKey: ["complaint-cases", statusFilter],
    queryFn: () => complaintsApi.fetchCases(statusFilter ? { status: statusFilter } : {}),
  });
  const cases: any[] = casesResp?.data ?? [];

  const escalateMut = useMutation({
    mutationFn: () => complaintsApi.runEscalationsNow(),
    onSuccess: (res: any) => {
      toast.success(res.escalated > 0 ? `${res.escalated} case(s) escalated` : "No cases were due for escalation right now");
      qc.invalidateQueries({ queryKey: ["complaint-cases"] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Failed to run escalations"),
  });

  return (
    <div>
      {showNew && <NewCaseModal onClose={() => setShowNew(false)} />}
      {selectedCase && <CaseDetailDrawer caseId={selectedCase} onClose={() => setSelectedCase(null)} />}

      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Complaint & Case Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">SLA-driven case handling for parent, staff and student complaints</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => escalateMut.mutate()}
            disabled={escalateMut.isPending}
            title="Runs the same hourly escalation job immediately, for testing — normally this runs automatically."
            className="px-3 py-2 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 disabled:opacity-40"
          >
            {escalateMut.isPending ? "Running…" : "Test Escalations Now"}
          </button>
          <button onClick={() => setShowNew(true)} className="px-4 py-2 bg-[#0C447C] text-white text-sm font-medium rounded-lg hover:bg-[#0b3d6e]">
            + Raise Case
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase mb-1">Total Open</div>
          <div className="text-2xl font-bold text-[#0C447C]">{aging?.totalOpen ?? 0}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase mb-1">Overdue (Past SLA)</div>
          <div className="text-2xl font-bold text-red-600">{aging?.overdueCount ?? 0}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase mb-1">7+ Days Open</div>
          <div className="text-2xl font-bold text-amber-600">{aging?.buckets?.["7+_days"] ?? 0}</div>
        </div>
      </div>

      <div className="mb-4 flex gap-2">
        {["", "open", "in_process", "closed"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${statusFilter === s ? "bg-[#0C447C] text-white border-[#0C447C]" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
          >
            {s === "" ? "All" : s.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-4 border-[#0C447C] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : cases.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-slate-100">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-sm font-semibold text-gray-500">No cases {statusFilter ? `in "${statusFilter}"` : "yet"}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {["Case #", "Title", "Group / Type", "Raised By", "Priority", "Due By", "Status"].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase bg-slate-50">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cases.map((c) => (
                <tr key={c._id} onClick={() => setSelectedCase(c._id)} className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer">
                  <td className="py-3 px-4 font-medium text-[#0C447C]">{c.caseNumber}</td>
                  <td className="py-3 px-4 text-slate-700">{c.title}</td>
                  <td className="py-3 px-4 text-slate-600">{c.caseGroup} / {c.caseType}</td>
                  <td className="py-3 px-4 text-slate-600">{c.raisedByName}</td>
                  <td className="py-3 px-4"><span className={`px-2 py-0.5 border rounded-full text-xs font-medium ${PRIORITY_STYLE[c.priority]}`}>{c.priority}</span></td>
                  <td className="py-3 px-4 text-slate-600">{new Date(c.dueBy).toLocaleDateString()}</td>
                  <td className="py-3 px-4"><span className={`px-2 py-0.5 border rounded-full text-xs font-medium ${STATUS_STYLE[c.status]}`}>{c.status.replace("_", " ")}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
