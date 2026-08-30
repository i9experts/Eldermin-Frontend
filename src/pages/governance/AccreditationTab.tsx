import { useState } from "react";
import toast from "react-hot-toast";
import {
  useAccreditation, useCreateAccreditation, useUpdateAccreditation,
} from "../../hooks/useCompliance";
import {
  Card, CardHeader, Btn, Modal, FormField, ProgressBar, Badge,
} from "./shared";

const STATUS_OPTIONS = [
  { value: "not_started", label: "Not Started" },
  { value: "preparing", label: "Preparing" },
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "Under Review" },
  { value: "accredited", label: "Accredited" },
  { value: "conditionally_accredited", label: "Conditionally Accredited" },
  { value: "not_accredited", label: "Not Accredited" },
  { value: "expired", label: "Expired" },
];

const REQ_STATUS_OPTIONS = [
  { value: "not_started", label: "Not Started" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "not_applicable", label: "Not Applicable" },
];

const STATUS_BADGE: Record<string, string> = {
  not_started: "Not Started",
  preparing: "In Progress",
  submitted: "Pending Review",
  under_review: "Under Review",
  accredited: "Compliant",
  conditionally_accredited: "Attention",
  not_accredited: "Critical",
  expired: "Overdue",
};

const REQ_BADGE: Record<string, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  completed: "Complete",
  not_applicable: "Inactive",
};

const inputCls = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0C447C]";

function fmtDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function toInputDate(d?: string) {
  return d ? new Date(d).toISOString().slice(0, 10) : "";
}

// ─── CREATE ACCREDITATION MODAL ──────────────────────────────────
function CreateAccreditationModal({ onClose }: { onClose: () => void }) {
  const createAcc = useCreateAccreditation();
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [description, setDescription] = useState("");
  const [applicationDate, setApplicationDate] = useState("");
  const [inspectionDate, setInspectionDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");

  const canSubmit = name.trim() && body.trim();

  const submit = () => {
    createAcc.mutate({
      name, body, description,
      applicationDate: applicationDate || undefined,
      inspectionDate: inspectionDate || undefined,
      expiryDate: expiryDate || undefined,
    }, {
      onSuccess: () => { toast.success("Accreditation created"); onClose(); },
      onError: (e: any) => toast.error(e?.response?.data?.message || "Failed to create accreditation"),
    });
  };

  return (
    <Modal open onClose={onClose} title="New Accreditation">
      <FormField label="Name" required>
        <input value={name} onChange={e => setName(e.target.value)} className={inputCls} placeholder="e.g. Cambridge International Re-accreditation" />
      </FormField>
      <FormField label="Accrediting Body" required>
        <input value={body} onChange={e => setBody(e.target.value)} className={inputCls} placeholder="e.g. Cambridge Assessment International Education" />
      </FormField>
      <FormField label="Description">
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className={inputCls + " resize-none"} />
      </FormField>
      <div className="grid grid-cols-3 gap-3">
        <FormField label="Application Date">
          <input type="date" value={applicationDate} onChange={e => setApplicationDate(e.target.value)} className={inputCls} />
        </FormField>
        <FormField label="Inspection Date">
          <input type="date" value={inspectionDate} onChange={e => setInspectionDate(e.target.value)} className={inputCls} />
        </FormField>
        <FormField label="Expiry Date">
          <input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} className={inputCls} />
        </FormField>
      </div>
      <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 mt-4">
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" onClick={submit}>{createAcc.isPending ? "Creating…" : "Create Accreditation"}</Btn>
      </div>
    </Modal>
  );
}

// ─── ADD REQUIREMENT MODAL ───────────────────────────────────────
function AddRequirementModal({ acc, onClose }: { acc: any; onClose: () => void }) {
  const updateAcc = useUpdateAccreditation();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [isMandatory, setIsMandatory] = useState(true);

  const submit = () => {
    const requirements = [...(acc.requirements || []), {
      title, description, dueDate: dueDate || undefined, assignedTo, isMandatory, status: "not_started",
    }];
    updateAcc.mutate({ id: acc._id, data: { requirements } }, {
      onSuccess: () => { toast.success("Requirement added"); onClose(); },
      onError: (e: any) => toast.error(e?.response?.data?.message || "Failed to add requirement"),
    });
  };

  return (
    <Modal open onClose={onClose} title="Add Requirement">
      <FormField label="Title" required>
        <input value={title} onChange={e => setTitle(e.target.value)} className={inputCls} placeholder="e.g. Fire safety certificate on file" />
      </FormField>
      <FormField label="Description">
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className={inputCls + " resize-none"} />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Due Date">
          <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={inputCls} />
        </FormField>
        <FormField label="Assigned To">
          <input value={assignedTo} onChange={e => setAssignedTo(e.target.value)} className={inputCls} placeholder="Staff name" />
        </FormField>
      </div>
      <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer mt-2">
        <input type="checkbox" checked={isMandatory} onChange={e => setIsMandatory(e.target.checked)} className="accent-[#0C447C]" />
        Mandatory requirement
      </label>
      <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 mt-4">
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" onClick={submit} className={!title.trim() ? "opacity-40 pointer-events-none" : ""}>
          {updateAcc.isPending ? "Adding…" : "Add Requirement"}
        </Btn>
      </div>
    </Modal>
  );
}

// ─── REQUIREMENT ROW ──────────────────────────────────────────────
function RequirementRow({ acc, req }: { acc: any; req: any }) {
  const updateAcc = useUpdateAccreditation();
  const [evidenceUrl, setEvidenceUrl] = useState(req.evidenceUrl || "");

  const patchRequirement = (patch: any) => {
    const requirements = (acc.requirements || []).map((r: any) =>
      r._id === req._id ? { ...r, ...patch } : r);
    updateAcc.mutate({ id: acc._id, data: { requirements } }, {
      onError: (e: any) => toast.error(e?.response?.data?.message || "Failed to update requirement"),
    });
  };

  const changeStatus = (status: string) => {
    patchRequirement({ status, completedDate: status === "completed" ? new Date().toISOString() : req.completedDate });
  };

  const saveEvidence = () => patchRequirement({ evidenceUrl });

  return (
    <div className="border border-slate-100 rounded-lg p-3 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm text-slate-800">{req.title}</span>
            {req.isMandatory && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 font-semibold">MANDATORY</span>}
            <Badge status={REQ_BADGE[req.status] ?? req.status} small />
          </div>
          {req.description && <p className="text-xs text-slate-500 mt-1">{req.description}</p>}
        </div>
        <select value={req.status} onChange={e => changeStatus(e.target.value)} className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 shrink-0">
          {REQ_STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-slate-500">
        <span>Due: {fmtDate(req.dueDate)}</span>
        {req.assignedTo && <span>Assigned: {req.assignedTo}</span>}
        {req.completedDate && <span>Completed: {fmtDate(req.completedDate)}</span>}
      </div>
      <div className="flex gap-2">
        <input
          value={evidenceUrl}
          onChange={e => setEvidenceUrl(e.target.value)}
          placeholder="Evidence URL (document link, certificate, photo…)"
          className="flex-1 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
        />
        <Btn size="xs" variant="secondary" onClick={saveEvidence}>Save</Btn>
        {req.evidenceUrl && (
          <a href={req.evidenceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-[#0C447C] font-medium self-center whitespace-nowrap">View →</a>
        )}
      </div>
    </div>
  );
}

// ─── DETAIL VIEW ──────────────────────────────────────────────────
function AccreditationDetail({ acc, onBack }: { acc: any; onBack: () => void }) {
  const [showAddReq, setShowAddReq] = useState(false);
  const updateAcc = useUpdateAccreditation();
  const requirements: any[] = acc.requirements || [];

  const mandatory = requirements.filter(r => r.isMandatory);
  const mandatoryIncomplete = mandatory.filter(r => r.status !== "completed" && r.status !== "not_applicable");

  const changeAccStatus = (status: string) => {
    updateAcc.mutate({ id: acc._id, data: { status } }, {
      onError: (e: any) => toast.error(e?.response?.data?.message || "Failed to update status"),
    });
  };

  return (
    <div>
      {showAddReq && <AddRequirementModal acc={acc} onClose={() => setShowAddReq(false)} />}
      <button onClick={onBack} className="text-xs font-medium text-slate-500 hover:text-slate-700 mb-3">← Back to all accreditations</button>

      <Card className="mb-4">
        <CardHeader
          title={acc.name}
          subtitle={acc.body}
          actions={
            <select value={acc.status} onChange={e => changeAccStatus(e.target.value)} className="text-xs border border-slate-200 rounded-lg px-2 py-1.5">
              {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          }
        />
        <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-xs text-slate-500">Readiness</div>
            <div className="font-bold text-lg text-slate-800">{acc.readinessPercentage ?? 0}%</div>
            <ProgressBar pct={acc.readinessPercentage ?? 0} />
          </div>
          <div>
            <div className="text-xs text-slate-500">Inspection Date</div>
            <div className="font-medium text-sm text-slate-800">{fmtDate(acc.inspectionDate)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Expiry Date</div>
            <div className="font-medium text-sm text-slate-800">{fmtDate(acc.expiryDate)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Overall Score</div>
            <div className="font-medium text-sm text-slate-800">{acc.overallScore ?? "—"}</div>
          </div>
        </div>
      </Card>

      {/* Gap Analysis — the single most useful number for inspection prep */}
      <Card className={`mb-4 ${mandatoryIncomplete.length > 0 ? "border-red-200" : ""}`}>
        <div className="p-5 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Gap Analysis</div>
            <div className={`text-2xl font-bold mt-1 ${mandatoryIncomplete.length > 0 ? "text-red-600" : "text-emerald-600"}`}>
              {mandatoryIncomplete.length} of {mandatory.length} mandatory requirements incomplete
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {mandatoryIncomplete.length > 0
                ? "Prioritize these before the inspection date."
                : "All mandatory requirements are complete."}
            </p>
          </div>
          <div className="text-4xl">{mandatoryIncomplete.length > 0 ? "🚨" : "✅"}</div>
        </div>
        {mandatoryIncomplete.length > 0 && (
          <div className="px-5 pb-4 flex flex-wrap gap-2">
            {mandatoryIncomplete.map(r => (
              <span key={r._id} className="text-xs px-2 py-1 rounded-full bg-red-50 text-red-700 border border-red-200">{r.title}</span>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader
          title="Requirements Checklist"
          subtitle={`${requirements.length} requirement${requirements.length === 1 ? "" : "s"}`}
          actions={<Btn size="sm" onClick={() => setShowAddReq(true)}>+ Add Requirement</Btn>}
        />
        <div className="p-4 space-y-3">
          {requirements.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No requirements yet — add the first one.</p>
          ) : (
            requirements.map((r: any) => <RequirementRow key={r._id} acc={acc} req={r} />)
          )}
        </div>
      </Card>
    </div>
  );
}

// ─── ACCREDITATION TAB ────────────────────────────────────────────
export default function AccreditationTab() {
  const [showCreate, setShowCreate] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: rawAcc = [], isLoading } = useAccreditation();
  const list: any[] = Array.isArray(rawAcc) ? rawAcc : ((rawAcc as any)?.data ?? []);
  const selected = list.find(a => a._id === selectedId);

  if (selected) {
    return <AccreditationDetail acc={selected} onBack={() => setSelectedId(null)} />;
  }

  return (
    <div>
      {showCreate && <CreateAccreditationModal onClose={() => setShowCreate(false)} />}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Accreditation Reports</h1>
          <p className="text-sm text-slate-500 mt-0.5">Inspection readiness, evidence mapping, checklist and gap analysis</p>
        </div>
        <Btn onClick={() => setShowCreate(true)}>+ New Accreditation</Btn>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-4 border-[#0C447C] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : list.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="text-5xl mb-4">🏅</div>
          <p className="text-sm font-semibold text-gray-500">No accreditation records yet</p>
          <p className="text-xs text-gray-400 mt-1">Use "+ New Accreditation" to start tracking inspection readiness</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {list.map((acc: any) => {
            const mandatory = (acc.requirements || []).filter((r: any) => r.isMandatory);
            const mandatoryIncomplete = mandatory.filter((r: any) => r.status !== "completed" && r.status !== "not_applicable");
            return (
              <Card key={acc._id} className="p-4 cursor-pointer hover:border-[#0C447C]/40 transition-colors" >
                <div onClick={() => setSelectedId(acc._id)}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-semibold text-sm text-slate-800 truncate">{acc.name}</div>
                      <div className="text-xs text-slate-500">{acc.body}</div>
                    </div>
                    <Badge status={STATUS_BADGE[acc.status] ?? acc.status} small />
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                      <span>Readiness</span>
                      <span className="font-semibold text-slate-700">{acc.readinessPercentage ?? 0}%</span>
                    </div>
                    <ProgressBar pct={acc.readinessPercentage ?? 0} />
                  </div>
                  {mandatory.length > 0 && (
                    <p className={`text-xs mt-2 font-medium ${mandatoryIncomplete.length > 0 ? "text-red-600" : "text-emerald-600"}`}>
                      {mandatoryIncomplete.length} of {mandatory.length} mandatory requirements incomplete
                    </p>
                  )}
                  <p className="text-xs text-slate-400 mt-2">Inspection: {fmtDate(acc.inspectionDate)} · Expires: {fmtDate(acc.expiryDate)}</p>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
