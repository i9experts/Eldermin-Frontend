import { useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../../hooks/useAuth";
import { StudentSelect } from "../../components/ui/StudentSelect";
import {
  useSafeguarding, useCreateSafeguarding, useUpdateSafeguarding, useAddSafeguardingNote,
} from "../../hooks/useCompliance";

const TYPE_OPTIONS = [
  { value: "physical", label: "Physical" },
  { value: "emotional", label: "Emotional" },
  { value: "sexual", label: "Sexual" },
  { value: "neglect", label: "Neglect" },
  { value: "bullying", label: "Bullying" },
  { value: "cyberbullying", label: "Cyberbullying" },
  { value: "radicalisation", label: "Radicalisation" },
  { value: "other", label: "Other" },
];

const SEVERITY_OPTIONS = ["low", "medium", "high", "critical"];

const STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "under_investigation", label: "Under Investigation" },
  { value: "referred_external", label: "Referred External" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
  { value: "escalated", label: "Escalated" },
];

const SEVERITY_STYLE: Record<string, string> = {
  low: "bg-slate-100 text-slate-600 border-slate-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  high: "bg-orange-50 text-orange-700 border-orange-200",
  critical: "bg-red-50 text-red-700 border-red-200",
};

const STATUS_STYLE: Record<string, string> = {
  open: "bg-blue-50 text-blue-700 border-blue-200",
  under_investigation: "bg-amber-50 text-amber-700 border-amber-200",
  referred_external: "bg-purple-50 text-purple-700 border-purple-200",
  resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  closed: "bg-slate-100 text-slate-500 border-slate-200",
  escalated: "bg-red-50 text-red-700 border-red-200",
};

const inputCls = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0C447C]";
const labelCls = "block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5";

function fmtDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// ─── REPORT INCIDENT MODAL ──────────────────────────────────────────────────
function ReportIncidentModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const createCase = useCreateSafeguarding();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("other");
  const [severity, setSeverity] = useState("medium");
  const [studentId, setStudentId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [studentGrade, setStudentGrade] = useState("");
  const [reportedDate, setReportedDate] = useState(new Date().toISOString().slice(0, 10));
  const [assignedTo, setAssignedTo] = useState("");
  const [parentNotified, setParentNotified] = useState(false);
  const [policeInvolved, setPoliceInvolved] = useState(false);
  const [socialServicesInvolved, setSocialServicesInvolved] = useState(false);
  const [confidential, setConfidential] = useState(true);
  const [externalReferral, setExternalReferral] = useState(false);
  const [externalAgency, setExternalAgency] = useState("");

  const reportedBy = user?.name || "";

  const handleStudentChange = (id: string, student?: any) => {
    setStudentId(id);
    if (student) {
      setStudentName(`${student.firstName || ""} ${student.lastName || ""}`.trim());
      setStudentGrade(student.currentGrade || "");
    } else {
      setStudentName("");
      setStudentGrade("");
    }
  };

  const canSubmit = title.trim() && description.trim() && type;

  const submit = () => {
    createCase.mutate({
      title, description, type, severity,
      studentId: studentId || undefined,
      studentName: studentName || undefined,
      studentGrade: studentGrade || undefined,
      reportedDate,
      reportedBy,
      assignedTo: assignedTo || undefined,
      parentNotified, policeInvolved, socialServicesInvolved, confidential,
      externalReferral: externalReferral ? (externalAgency || "Yes") : undefined,
      externalAgency: externalReferral ? externalAgency : undefined,
    }, {
      onSuccess: () => { toast.success("Safeguarding incident reported"); onClose(); },
      onError: (e: any) => toast.error(e?.response?.data?.message || "Failed to report incident"),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col" style={{ maxHeight: "92vh" }}>
        <div className="bg-red-700 rounded-t-2xl px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-white">Report Safeguarding Incident</h2>
            <p className="text-red-100 text-xs mt-0.5">This record is confidential and access is logged</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white">✕</button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className={labelCls}>Title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className={inputCls} placeholder="Brief incident title" />
          </div>
          <div>
            <label className={labelCls}>Description *</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className={inputCls + " resize-none"} placeholder="What happened, when and where…" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Type *</label>
              <select value={type} onChange={e => setType(e.target.value)} className={inputCls}>
                {TYPE_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Severity</label>
              <select value={severity} onChange={e => setSeverity(e.target.value)} className={inputCls}>
                {SEVERITY_OPTIONS.map(s => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls}>Student Involved (optional)</label>
            <StudentSelect value={studentId} onChange={handleStudentChange} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Reported Date</label>
              <input type="date" value={reportedDate} onChange={e => setReportedDate(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Reported By</label>
              <input value={reportedBy} readOnly className={inputCls + " bg-slate-50 text-slate-500"} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Assigned To (optional)</label>
            <input value={assignedTo} onChange={e => setAssignedTo(e.target.value)} className={inputCls} placeholder="Designated Safeguarding Lead / staff name" />
          </div>
          <div className="space-y-2 border-t border-slate-100 pt-3">
            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
              <input type="checkbox" checked={parentNotified} onChange={e => setParentNotified(e.target.checked)} className="accent-[#0C447C]" /> Parent/guardian notified
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
              <input type="checkbox" checked={policeInvolved} onChange={e => setPoliceInvolved(e.target.checked)} className="accent-[#0C447C]" /> Police involved
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
              <input type="checkbox" checked={socialServicesInvolved} onChange={e => setSocialServicesInvolved(e.target.checked)} className="accent-[#0C447C]" /> Social services involved
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
              <input type="checkbox" checked={confidential} onChange={e => setConfidential(e.target.checked)} className="accent-[#0C447C]" /> Mark as confidential
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
              <input type="checkbox" checked={externalReferral} onChange={e => setExternalReferral(e.target.checked)} className="accent-[#0C447C]" /> Referred to an external agency
            </label>
            {externalReferral && (
              <input value={externalAgency} onChange={e => setExternalAgency(e.target.value)} className={inputCls} placeholder="Agency name (e.g. local safeguarding board)" />
            )}
          </div>
        </div>
        <div className="p-5 border-t border-slate-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button>
          <button
            onClick={submit}
            disabled={!canSubmit || createCase.isPending}
            className="px-4 py-2 bg-red-700 text-white text-sm font-medium rounded-lg hover:bg-red-800 disabled:opacity-40"
          >
            {createCase.isPending ? "Reporting…" : "Report Incident"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── CASE DETAIL DRAWER ──────────────────────────────────────────────────────
function CaseDetailDrawer({ c, onClose }: { c: any; onClose: () => void }) {
  const updateCase = useUpdateSafeguarding();
  const addNote = useAddSafeguardingNote();
  const [noteText, setNoteText] = useState("");
  const [status, setStatus] = useState(c.status);

  const changeStatus = (next: string) => {
    setStatus(next);
    updateCase.mutate({ id: c._id, data: { status: next } }, {
      onSuccess: () => toast.success("Status updated"),
      onError: (e: any) => { toast.error(e?.response?.data?.message || "Failed to update status"); setStatus(c.status); },
    });
  };

  const submitNote = () => {
    addNote.mutate({ id: c._id, note: noteText }, {
      onSuccess: () => { toast.success("Note added"); setNoteText(""); },
      onError: (e: any) => toast.error(e?.response?.data?.message || "Failed to add note"),
    });
  };

  const field = (label: string, value: any) => (
    <div className="flex justify-between py-2 border-b border-slate-50 text-xs">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-800 text-right max-w-[60%]">{value ?? "—"}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md h-full overflow-y-auto shadow-2xl">
        <div className="bg-red-700 px-5 py-4 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h2 className="font-bold text-white text-sm">{c.caseNumber}</h2>
            <p className="text-red-100 text-xs">{c.title}</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex gap-2 flex-wrap">
            <span className={`px-2 py-0.5 border rounded-full text-xs font-medium ${SEVERITY_STYLE[c.severity] ?? ""}`}>{c.severity}</span>
            <span className={`px-2 py-0.5 border rounded-full text-xs font-medium ${STATUS_STYLE[status] ?? ""}`}>{STATUS_OPTIONS.find(s => s.value === status)?.label ?? status}</span>
            <span className="px-2 py-0.5 border rounded-full text-xs font-medium bg-slate-100 text-slate-600 border-slate-200">{TYPE_OPTIONS.find(t => t.value === c.type)?.label ?? c.type}</span>
            {c.confidential && <span className="px-2 py-0.5 border rounded-full text-xs font-medium bg-red-50 text-red-700 border-red-200">🔒 Confidential</span>}
          </div>

          <p className="text-sm text-slate-600">{c.description}</p>

          <div>
            <label className={labelCls}>Change Status</label>
            <select value={status} onChange={e => changeStatus(e.target.value)} className={inputCls}>
              {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          <div className="bg-slate-50 rounded-lg p-3">
            {field("Student", c.studentName)}
            {field("Grade", c.studentGrade)}
            {field("Reported By", c.reportedBy)}
            {field("Reported Date", fmtDate(c.reportedDate))}
            {field("Assigned To", c.assignedTo)}
            {field("Parent Notified", c.parentNotified ? "Yes" : "No")}
            {field("Police Involved", c.policeInvolved ? "Yes" : "No")}
            {field("Social Services Involved", c.socialServicesInvolved ? "Yes" : "No")}
            {field("External Referral", c.externalReferral || "—")}
            {field("External Agency", c.externalAgency || "—")}
          </div>

          {c.progressNotes?.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">Progress Notes</h3>
              <div className="space-y-2">
                {[...c.progressNotes].reverse().map((n: any, i: number) => (
                  <div key={i} className="bg-slate-50 rounded-lg p-2.5 text-xs">
                    <p className="text-slate-700">{n.note}</p>
                    <p className="text-slate-400 mt-1">{n.addedBy} · {new Date(n.date).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className={labelCls}>Add Progress Note</label>
            <div className="flex gap-2">
              <input value={noteText} onChange={e => setNoteText(e.target.value)} className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="Progress update…" />
              <button onClick={submitNote} disabled={!noteText.trim() || addNote.isPending} className="px-3 py-2 bg-[#0C447C] text-white text-xs font-semibold rounded-lg disabled:opacity-40">Add</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SAFEGUARDING TAB ────────────────────────────────────────────────────────
export default function SafeguardingTab() {
  const [showReport, setShowReport] = useState(false);
  const [selectedCase, setSelectedCase] = useState<any | null>(null);
  const { data: rawCases = [], isLoading } = useSafeguarding();
  const cases: any[] = Array.isArray(rawCases) ? rawCases : ((rawCases as any)?.data ?? []);

  return (
    <div>
      {showReport && <ReportIncidentModal onClose={() => setShowReport(false)} />}
      {selectedCase && <CaseDetailDrawer c={selectedCase} onClose={() => setSelectedCase(null)} />}

      <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 mb-4">
        <span className="text-base">🔒</span>
        <span className="text-xs font-semibold text-red-800">
          RESTRICTED — Child safeguarding data is strictly confidential. All access is logged and monitored. Authorised personnel only.
        </span>
      </div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Child Safeguarding Compliance</h1>
          <p className="text-sm text-slate-500 mt-0.5">Incident reporting, case tracking, staff verification and safeguarding compliance</p>
        </div>
        <button onClick={() => setShowReport(true)} className="px-4 py-2 bg-red-700 text-white text-sm font-medium rounded-lg hover:bg-red-800 whitespace-nowrap">
          + Report Incident
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-4 border-[#0C447C] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : cases.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="text-5xl mb-4">🛡️</div>
          <p className="text-sm font-semibold text-gray-500">No safeguarding cases</p>
          <p className="text-xs text-gray-400 mt-1">Use "Report Incident" to log the first case</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cases.map((c: any) => (
            <div
              key={c._id ?? c.id}
              onClick={() => setSelectedCase(c)}
              className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 cursor-pointer hover:border-[#0C447C]/40 transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-mono text-slate-400 shrink-0">{c.caseNumber}</span>
                  <div className="font-medium text-sm text-slate-800 truncate">{c.title}</div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {c.severity && <span className={`text-xs px-2 py-0.5 rounded border font-medium ${SEVERITY_STYLE[c.severity] ?? ""}`}>{c.severity}</span>}
                  {c.status && <span className={`text-xs px-2 py-0.5 rounded border font-medium ${STATUS_STYLE[c.status] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}>{STATUS_OPTIONS.find(s => s.value === c.status)?.label ?? c.status}</span>}
                </div>
              </div>
              {c.description && <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">{c.description}</p>}
              <p className="text-xs text-slate-400 mt-1.5">
                Reported {fmtDate(c.reportedDate || c.createdAt)}{c.studentName ? ` · ${c.studentName}` : ""}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
