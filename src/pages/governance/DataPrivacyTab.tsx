import { useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../../hooks/useAuth";
import { StudentSelect } from "../../components/ui/StudentSelect";
import { Card, CardHeader, Btn, Modal, FormField, FInput, FSelect, TableWrap, Td } from "./shared";
import {
  useConsentRecords, useCreateConsentRecord, useUpdateConsentRecord, useDeleteConsentRecord,
  useRetentionPolicies, useCreateRetentionPolicy, useUpdateRetentionPolicy, useDeleteRetentionPolicy, useSeedRetentionPolicyDefaults,
  useDsarRequests, useCreateDsarRequest, useUpdateDsarRequest, useDeleteDsarRequest,
  useDataBreaches, useCreateDataBreach, useUpdateDataBreach,
} from "../../hooks/useCompliance";

function fmtDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function asList(raw: any): any[] {
  return Array.isArray(raw) ? raw : (raw?.data ?? []);
}

const Spinner = () => (
  <div className="flex justify-center py-12">
    <div className="w-5 h-5 border-4 border-[#0C447C] border-t-transparent rounded-full animate-spin" />
  </div>
);

const Empty = ({ label }: { label: string }) => (
  <p className="text-sm text-slate-400 text-center py-10">{label}</p>
);

const SECTIONS = [
  { id: "consent", label: "Consent Records" },
  { id: "retention", label: "Retention Policies" },
  { id: "dsar", label: "Data Subject Requests" },
  { id: "breaches", label: "Data Breach Log" },
] as const;
type SectionId = typeof SECTIONS[number]["id"];

// ═══════════════════ CONSENT RECORDS ═══════════════════
const CONSENT_TYPE_OPTIONS = [
  { value: "photo_video_use", label: "Photo / Video Use" },
  { value: "third_party_data_sharing", label: "Third-Party Data Sharing" },
  { value: "marketing_communications", label: "Marketing Communications" },
  { value: "biometric_data", label: "Biometric Data" },
  { value: "medical_information_sharing", label: "Medical Information Sharing" },
  { value: "other", label: "Other" },
];
const consentTypeLabel = (v: string) => CONSENT_TYPE_OPTIONS.find(o => o.value === v)?.label ?? v;

function ConsentRecordModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const createMut = useCreateConsentRecord();
  const [subjectType, setSubjectType] = useState("student");
  const [subjectName, setSubjectName] = useState("");
  const [subjectRef, setSubjectRef] = useState("");
  const [consentType, setConsentType] = useState("photo_video_use");
  const [status, setStatus] = useState("granted");
  const [dateGranted, setDateGranted] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");

  const save = () => {
    createMut.mutate({
      subjectType, subjectName, consentType, status, dateGranted, notes,
      recordedBy: user?.name,
      subjectRef: subjectType === "student" && subjectRef ? subjectRef : undefined,
      subjectRefModel: subjectType === "student" && subjectRef ? "Student" : undefined,
    }, {
      onSuccess: () => { toast.success("Consent record added"); onClose(); },
      onError: (e: any) => toast.error(e?.response?.data?.message || "Failed to save"),
    });
  };

  return (
    <Modal open onClose={onClose} title="Add Consent Record">
      <FormField label="Subject Type" required>
        <FSelect
          options={["student", "staff", "parent"]}
          value={subjectType}
          onChange={e => { setSubjectType(e.target.value); setSubjectName(""); setSubjectRef(""); }}
        />
      </FormField>
      {subjectType === "student" ? (
        <FormField label="Student">
          <StudentSelect value={subjectRef} onChange={(id, s) => { setSubjectRef(id); setSubjectName(s ? `${s.firstName || ""} ${s.lastName || ""}`.trim() : ""); }} />
        </FormField>
      ) : null}
      <FormField label="Subject Name" required>
        <FInput value={subjectName} onChange={e => setSubjectName(e.target.value)} placeholder="Full name" />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Consent Type" required>
          <select value={consentType} onChange={e => setConsentType(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0C447C]">
            {CONSENT_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </FormField>
        <FormField label="Status">
          <FSelect options={["granted", "withdrawn"]} value={status} onChange={e => setStatus(e.target.value)} />
        </FormField>
      </div>
      <FormField label={status === "withdrawn" ? "Date Granted (originally)" : "Date Granted"}>
        <input type="date" value={dateGranted} onChange={e => setDateGranted(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]" />
      </FormField>
      <FormField label="Notes">
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#0C447C]" />
      </FormField>
      <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 mt-2">
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" onClick={save}>{createMut.isPending ? "Saving…" : "Save Record"}</Btn>
      </div>
    </Modal>
  );
}

function ConsentRecordsSection() {
  const [showAdd, setShowAdd] = useState(false);
  const { data: raw, isLoading } = useConsentRecords();
  const records = asList(raw);
  const updateMut = useUpdateConsentRecord();
  const deleteMut = useDeleteConsentRecord();

  const toggleWithdraw = (r: any) => {
    const nextStatus = r.status === "granted" ? "withdrawn" : "granted";
    updateMut.mutate({ id: r._id, data: { status: nextStatus } }, {
      onSuccess: () => toast.success(nextStatus === "withdrawn" ? "Consent marked withdrawn" : "Consent re-granted"),
      onError: (e: any) => toast.error(e?.response?.data?.message || "Failed"),
    });
  };

  const remove = (r: any) => {
    if (!window.confirm(`Delete this consent record for "${r.subjectName}"?`)) return;
    deleteMut.mutate(r._id, {
      onSuccess: () => toast.success("Consent record deleted"),
      onError: (e: any) => toast.error(e?.response?.data?.message || "Failed to delete"),
    });
  };

  return (
    <Card>
      {showAdd && <ConsentRecordModal onClose={() => setShowAdd(false)} />}
      <CardHeader
        title="Consent Records"
        subtitle="Consent given or withdrawn per data subject and purpose"
        actions={<Btn variant="primary" size="sm" onClick={() => setShowAdd(true)}>+ Add Record</Btn>}
      />
      {isLoading ? <Spinner /> : records.length === 0 ? (
        <Empty label="No consent records yet. Click Add Record to log the first one." />
      ) : (
        <TableWrap headers={["Subject", "Type", "Consent Type", "Status", "Date Granted", "Date Withdrawn", "Recorded By", ""]}>
          {records.map((r: any) => (
            <tr key={r._id} className="hover:bg-slate-50/60">
              <Td className="font-medium text-slate-800">{r.subjectName}</Td>
              <Td className="capitalize text-xs">{r.subjectType}</Td>
              <Td className="text-xs">{consentTypeLabel(r.consentType)}</Td>
              <Td>
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${r.status === "granted" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                  {r.status}
                </span>
              </Td>
              <Td className="text-xs">{fmtDate(r.dateGranted)}</Td>
              <Td className="text-xs">{fmtDate(r.dateWithdrawn)}</Td>
              <Td className="text-xs text-slate-500">{r.recordedBy || "—"}</Td>
              <Td>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => toggleWithdraw(r)} className="text-xs font-medium text-[#0C447C] hover:underline whitespace-nowrap">
                    {r.status === "granted" ? "Withdraw" : "Re-grant"}
                  </button>
                  <button onClick={() => remove(r)} className="text-xs font-medium text-red-500 hover:underline">Delete</button>
                </div>
              </Td>
            </tr>
          ))}
        </TableWrap>
      )}
    </Card>
  );
}

// ═══════════════════ RETENTION POLICIES ═══════════════════
const UNIT_LABEL: Record<string, string> = { days: "day(s)", months: "month(s)", years: "year(s)" };
const ACTION_LABEL: Record<string, string> = { review: "Review", archive: "Archive", delete: "Delete" };

function RetentionPolicyModal({ policy, onClose }: { policy?: any; onClose: () => void }) {
  const createMut = useCreateRetentionPolicy();
  const updateMut = useUpdateRetentionPolicy();
  const isEdit = !!policy?._id;
  const [category, setCategory] = useState(policy?.category ?? "");
  const [retentionValue, setRetentionValue] = useState(policy?.retentionValue ?? 1);
  const [retentionUnit, setRetentionUnit] = useState(policy?.retentionUnit ?? "years");
  const [actionOnExpiry, setActionOnExpiry] = useState(policy?.actionOnExpiry ?? "review");
  const [legalBasis, setLegalBasis] = useState(policy?.legalBasis ?? "");
  const [ownerRole, setOwnerRole] = useState(policy?.ownerRole ?? "");
  const [isActive, setIsActive] = useState(policy?.isActive ?? true);

  const save = () => {
    const payload = { category, retentionValue: Number(retentionValue), retentionUnit, actionOnExpiry, legalBasis, ownerRole, isActive };
    if (isEdit) {
      updateMut.mutate({ id: policy._id, data: payload }, {
        onSuccess: () => { toast.success("Retention policy updated"); onClose(); },
        onError: (e: any) => toast.error(e?.response?.data?.message || "Failed to save"),
      });
    } else {
      createMut.mutate(payload, {
        onSuccess: () => { toast.success("Retention policy added"); onClose(); },
        onError: (e: any) => toast.error(e?.response?.data?.message || "Failed to save"),
      });
    }
  };

  const saving = createMut.isPending || updateMut.isPending;

  return (
    <Modal open onClose={onClose} title={isEdit ? "Edit Retention Policy" : "Add Retention Policy"}>
      <FormField label="Data / Record Category" required>
        <FInput value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. Student Academic Records" />
      </FormField>
      <div className="grid grid-cols-3 gap-3">
        <FormField label="Retention Period" required>
          <input type="number" min={1} value={retentionValue} onChange={e => setRetentionValue(Number(e.target.value))} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]" />
        </FormField>
        <FormField label="Unit">
          <FSelect options={["days", "months", "years"]} value={retentionUnit} onChange={e => setRetentionUnit(e.target.value)} />
        </FormField>
        <FormField label="Action on Expiry">
          <FSelect options={["review", "archive", "delete"]} value={actionOnExpiry} onChange={e => setActionOnExpiry(e.target.value)} />
        </FormField>
      </div>
      <FormField label="Owner / Responsible Role">
        <FInput value={ownerRole} onChange={e => setOwnerRole(e.target.value)} placeholder="e.g. Registrar, Finance Manager" />
      </FormField>
      <FormField label="Legal Basis / Notes">
        <textarea value={legalBasis} onChange={e => setLegalBasis(e.target.value)} rows={2} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#0C447C]" />
      </FormField>
      <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer mt-1">
        <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="accent-[#0C447C]" /> Active
      </label>
      <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 mt-3">
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" onClick={save}>{saving ? "Saving…" : "Save Policy"}</Btn>
      </div>
    </Modal>
  );
}

function RetentionPoliciesSection() {
  const [editing, setEditing] = useState<any | null | undefined>(undefined); // undefined = closed
  const { data: policies = [], isLoading } = useRetentionPolicies() as { data: any[]; isLoading: boolean };
  const deleteMut = useDeleteRetentionPolicy();
  const seedMut = useSeedRetentionPolicyDefaults();

  const remove = (p: any) => {
    if (!window.confirm(`Delete the retention policy for "${p.category}"?`)) return;
    deleteMut.mutate(p._id, {
      onSuccess: () => toast.success("Retention policy deleted"),
      onError: (e: any) => toast.error(e?.response?.data?.message || "Failed to delete"),
    });
  };

  const seedDefaults = () => {
    seedMut.mutate(undefined, {
      onSuccess: (res: any) => toast.success(res?.message || "Defaults seeded"),
      onError: (e: any) => toast.error(e?.response?.data?.message || "Failed to seed defaults"),
    });
  };

  return (
    <Card>
      {editing !== undefined && <RetentionPolicyModal policy={editing} onClose={() => setEditing(undefined)} />}
      <CardHeader
        title="Retention Policies"
        subtitle="How long each category of data is kept, and what happens when it expires"
        actions={
          <div className="flex gap-2">
            {policies.length === 0 && !isLoading && (
              <Btn variant="secondary" size="sm" onClick={seedDefaults}>{seedMut.isPending ? "Seeding…" : "Seed Defaults"}</Btn>
            )}
            <Btn variant="primary" size="sm" onClick={() => setEditing(null)}>+ Add Policy</Btn>
          </div>
        }
      />
      {isLoading ? <Spinner /> : policies.length === 0 ? (
        <Empty label='No retention policies yet. Click "Seed Defaults" for a sensible starting set, or Add Policy to define your own.' />
      ) : (
        <TableWrap headers={["Category", "Retention Period", "On Expiry", "Owner", "Legal Basis / Notes", "Status", ""]}>
          {policies.map((p: any) => (
            <tr key={p._id} className={`hover:bg-slate-50/60 ${p.isActive === false ? "opacity-50" : ""}`}>
              <Td className="font-medium text-slate-800">{p.category}</Td>
              <Td className="text-xs">{p.retentionValue} {UNIT_LABEL[p.retentionUnit] ?? p.retentionUnit}</Td>
              <Td><span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">{ACTION_LABEL[p.actionOnExpiry] ?? p.actionOnExpiry}</span></Td>
              <Td className="text-xs">{p.ownerRole || "—"}</Td>
              <Td className="text-xs text-slate-500 max-w-xs">{p.legalBasis || "—"}</Td>
              <Td>
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${p.isActive === false ? "bg-slate-100 text-slate-500 border-slate-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
                  {p.isActive === false ? "Inactive" : "Active"}
                </span>
              </Td>
              <Td>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setEditing(p)} className="text-xs font-medium text-[#0C447C] hover:underline">Edit</button>
                  <button onClick={() => remove(p)} className="text-xs font-medium text-red-500 hover:underline">Delete</button>
                </div>
              </Td>
            </tr>
          ))}
        </TableWrap>
      )}
    </Card>
  );
}

// ═══════════════════ DATA SUBJECT REQUESTS (DSAR) ═══════════════════
const REQUEST_TYPE_OPTIONS = [
  { value: "access", label: "Access" },
  { value: "rectification", label: "Rectification" },
  { value: "erasure", label: "Erasure" },
  { value: "portability", label: "Portability" },
  { value: "restriction", label: "Restriction" },
];
const DSAR_STATUS_OPTIONS = [
  { value: "received", label: "Received" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "rejected", label: "Rejected" },
];
const DSAR_STATUS_STYLE: Record<string, string> = {
  received: "bg-blue-50 text-blue-700 border-blue-200",
  in_progress: "bg-amber-50 text-amber-700 border-amber-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-slate-100 text-slate-500 border-slate-200",
};

function daysRemaining(dueDate: string) {
  const diffMs = new Date(dueDate).getTime() - Date.now();
  return Math.ceil(diffMs / 86400000);
}

function DsarBadge({ dueDate, status }: { dueDate: string; status: string }) {
  if (status === "completed" || status === "rejected") return null;
  const days = daysRemaining(dueDate);
  if (days < 0) {
    return <span className="text-xs px-2 py-0.5 rounded-full border font-semibold bg-red-50 text-red-700 border-red-200">Overdue {Math.abs(days)}d</span>;
  }
  if (days <= 5) {
    return <span className="text-xs px-2 py-0.5 rounded-full border font-semibold bg-amber-50 text-amber-700 border-amber-200">{days}d left</span>;
  }
  return <span className="text-xs px-2 py-0.5 rounded-full border font-medium bg-slate-100 text-slate-500 border-slate-200">{days}d left</span>;
}

function DsarModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const createMut = useCreateDsarRequest();
  const [requestType, setRequestType] = useState("access");
  const [requesterName, setRequesterName] = useState("");
  const [requesterRelationship, setRequesterRelationship] = useState("Parent");
  const [dataSubjectName, setDataSubjectName] = useState("");
  const [dataSubjectType, setDataSubjectType] = useState("student");
  const [dateReceived, setDateReceived] = useState(new Date().toISOString().slice(0, 10));

  const canSubmit = requesterName.trim() && dataSubjectName.trim();

  const save = () => {
    createMut.mutate({
      requestType, requesterName, requesterRelationship, dataSubjectName, dataSubjectType,
      dateReceived, handledBy: user?.name,
    }, {
      onSuccess: () => { toast.success("Request logged"); onClose(); },
      onError: (e: any) => toast.error(e?.response?.data?.message || "Failed to save"),
    });
  };

  return (
    <Modal open onClose={onClose} title="Log Data Subject Request">
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Request Type" required>
          <select value={requestType} onChange={e => setRequestType(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0C447C]">
            {REQUEST_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </FormField>
        <FormField label="Date Received">
          <input type="date" value={dateReceived} onChange={e => setDateReceived(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]" />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Requester Name" required>
          <FInput value={requesterName} onChange={e => setRequesterName(e.target.value)} placeholder="Who made the request" />
        </FormField>
        <FormField label="Relationship">
          <FInput value={requesterRelationship} onChange={e => setRequesterRelationship(e.target.value)} placeholder="e.g. Parent, Self, Staff member" />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Data Subject Name" required>
          <FInput value={dataSubjectName} onChange={e => setDataSubjectName(e.target.value)} placeholder="Whose data is requested" />
        </FormField>
        <FormField label="Data Subject Type">
          <FSelect options={["student", "staff"]} value={dataSubjectType} onChange={e => setDataSubjectType(e.target.value)} />
        </FormField>
      </div>
      <p className="text-xs text-slate-400 mb-2">Due date is automatically set to 30 days after Date Received (the standard GDPR response window), and can be adjusted afterwards from the request's row.</p>
      <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" onClick={save} className={!canSubmit ? "opacity-40 pointer-events-none" : ""}>{createMut.isPending ? "Saving…" : "Log Request"}</Btn>
      </div>
    </Modal>
  );
}

function DsarSection() {
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { data: raw, isLoading } = useDsarRequests();
  const requests = asList(raw);
  const updateMut = useUpdateDsarRequest();
  const deleteMut = useDeleteDsarRequest();

  const changeStatus = (r: any, status: string) => {
    updateMut.mutate({ id: r._id, data: { status } }, {
      onSuccess: () => toast.success("Status updated"),
      onError: (e: any) => toast.error(e?.response?.data?.message || "Failed"),
    });
  };

  const remove = (r: any) => {
    if (!window.confirm(`Delete the request from "${r.requesterName}"?`)) return;
    deleteMut.mutate(r._id, {
      onSuccess: () => toast.success("Request deleted"),
      onError: (e: any) => toast.error(e?.response?.data?.message || "Failed to delete"),
    });
  };

  return (
    <Card>
      {showAdd && <DsarModal onClose={() => setShowAdd(false)} />}
      <CardHeader
        title="Data Subject Requests (DSAR)"
        subtitle="Access, rectification, erasure, portability and restriction requests, tracked against the 30-day statutory window"
        actions={<Btn variant="primary" size="sm" onClick={() => setShowAdd(true)}>+ Log Request</Btn>}
      />
      {isLoading ? <Spinner /> : requests.length === 0 ? (
        <Empty label="No data subject requests logged yet." />
      ) : (
        <TableWrap headers={["Requester", "Data Subject", "Type", "Received", "Due / Remaining", "Status", "Handled By", ""]}>
          {requests.map((r: any) => (
            <tr key={r._id} className={`hover:bg-slate-50/60 ${daysRemaining(r.dueDate) < 0 && r.status !== "completed" && r.status !== "rejected" ? "bg-red-50/40" : ""}`}>
              <Td>
                <div className="font-medium text-slate-800 text-xs">{r.requesterName}</div>
                <div className="text-xs text-slate-400">{r.requesterRelationship}</div>
              </Td>
              <Td className="text-xs">{r.dataSubjectName} <span className="text-slate-400 capitalize">({r.dataSubjectType})</span></Td>
              <Td><span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 capitalize">{r.requestType}</span></Td>
              <Td className="text-xs">{fmtDate(r.dateReceived)}</Td>
              <Td>
                <div className="flex flex-col gap-1 items-start">
                  <span className="text-xs text-slate-500">{fmtDate(r.dueDate)}</span>
                  <DsarBadge dueDate={r.dueDate} status={r.status} />
                </div>
              </Td>
              <Td>
                {editingId === r._id ? (
                  <select
                    autoFocus
                    value={r.status}
                    onChange={e => { changeStatus(r, e.target.value); setEditingId(null); }}
                    onBlur={() => setEditingId(null)}
                    className="text-xs border border-slate-200 rounded px-1.5 py-1"
                  >
                    {DSAR_STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ) : (
                  <button onClick={() => setEditingId(r._id)} className={`text-xs px-2 py-0.5 rounded-full border font-medium ${DSAR_STATUS_STYLE[r.status] ?? ""}`}>
                    {DSAR_STATUS_OPTIONS.find(o => o.value === r.status)?.label ?? r.status}
                  </button>
                )}
              </Td>
              <Td className="text-xs text-slate-500">{r.handledBy || "—"}</Td>
              <Td>
                <button onClick={() => remove(r)} className="text-xs font-medium text-red-500 hover:underline">Delete</button>
              </Td>
            </tr>
          ))}
        </TableWrap>
      )}
    </Card>
  );
}

// ═══════════════════ DATA BREACH LOG ═══════════════════
const BREACH_TYPE_OPTIONS = [
  { value: "unauthorized_access", label: "Unauthorized Access" },
  { value: "data_loss", label: "Data Loss" },
  { value: "data_theft", label: "Data Theft" },
  { value: "accidental_disclosure", label: "Accidental Disclosure" },
  { value: "phishing", label: "Phishing" },
  { value: "ransomware_malware", label: "Ransomware / Malware" },
  { value: "misdirected_communication", label: "Misdirected Communication" },
  { value: "physical_loss", label: "Physical Loss (device / paperwork)" },
  { value: "other", label: "Other" },
];
const breachTypeLabel = (v: string) => BREACH_TYPE_OPTIONS.find(o => o.value === v)?.label ?? v;

const DATA_CATEGORY_OPTIONS = [
  "Contact Details", "Academic Records", "Financial Data", "Health / Medical Records",
  "Safeguarding Records", "Biometric Data", "Photos / Video", "Login Credentials", "Other",
];

const BREACH_STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "contained", label: "Contained" },
  { value: "investigating", label: "Investigating" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];
const BREACH_STATUS_STYLE: Record<string, string> = {
  open: "bg-red-50 text-red-700 border-red-200",
  contained: "bg-amber-50 text-amber-700 border-amber-200",
  investigating: "bg-amber-50 text-amber-700 border-amber-200",
  resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  closed: "bg-slate-100 text-slate-500 border-slate-200",
};

const SEVERITY_STYLE: Record<string, string> = {
  low: "bg-slate-100 text-slate-600 border-slate-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  high: "bg-orange-50 text-orange-700 border-orange-200",
  critical: "bg-red-100 text-red-800 border-red-300",
};

// GDPR Article 33: the supervisory authority must be notified within 72
// hours of the school becoming aware of the breach - mirrors
// computeBreachNotificationDeadline/isBreachNotificationOverdue in the
// backend's data-privacy.util.ts (kept in sync manually, same as DsarBadge's
// daysRemaining above not importing backend code across the API boundary).
const BREACH_NOTIFICATION_WINDOW_HOURS = 72;
function notificationHoursRemaining(discoveredDate: string) {
  const deadline = new Date(discoveredDate).getTime() + BREACH_NOTIFICATION_WINDOW_HOURS * 3600000;
  return Math.round((deadline - Date.now()) / 3600000);
}

function RegulatorNotificationBadge({ b }: { b: any }) {
  if (!b.regulatorNotificationRequired) return <span className="text-xs text-slate-400">Not required</span>;
  if (b.regulatorNotifiedDate) {
    return <span className="text-xs px-2 py-0.5 rounded-full border font-medium bg-emerald-50 text-emerald-700 border-emerald-200">Notified {fmtDate(b.regulatorNotifiedDate)}</span>;
  }
  const hours = notificationHoursRemaining(b.discoveredDate);
  if (hours < 0) {
    return <span className="text-xs px-2 py-0.5 rounded-full border font-semibold bg-red-100 text-red-800 border-red-300">Overdue {Math.abs(hours)}h</span>;
  }
  return <span className="text-xs px-2 py-0.5 rounded-full border font-semibold bg-amber-50 text-amber-700 border-amber-200">{hours}h left</span>;
}

function ReportBreachModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const createMut = useCreateDataBreach();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [breachType, setBreachType] = useState("accidental_disclosure");
  const [discoveredDate, setDiscoveredDate] = useState(new Date().toISOString().slice(0, 10));
  const [occurredDate, setOccurredDate] = useState("");
  const [affectedSubjectType, setAffectedSubjectType] = useState("student");
  const [affectedCount, setAffectedCount] = useState(1);
  const [dataCategories, setDataCategories] = useState<string[]>([]);
  const [severity, setSeverity] = useState("medium");
  const [riskAssessment, setRiskAssessment] = useState("");
  const [regulatorNotificationRequired, setRegulatorNotificationRequired] = useState(false);
  const [subjectsNotificationRequired, setSubjectsNotificationRequired] = useState(false);

  const canSubmit = title.trim() && description.trim();

  const toggleCategory = (c: string) =>
    setDataCategories(cur => cur.includes(c) ? cur.filter(x => x !== c) : [...cur, c]);

  const save = () => {
    createMut.mutate({
      title, description, breachType, discoveredDate,
      occurredDate: occurredDate || undefined,
      affectedSubjectType, affectedCount: Number(affectedCount) || 0,
      dataCategoriesAffected: dataCategories,
      severity, riskAssessment,
      regulatorNotificationRequired, subjectsNotificationRequired,
      reportedBy: user?.name,
    }, {
      onSuccess: () => { toast.success("Breach logged"); onClose(); },
      onError: (e: any) => toast.error(e?.response?.data?.message || "Failed to log breach"),
    });
  };

  return (
    <Modal open onClose={onClose} title="Report Data Breach">
      <FormField label="Title" required>
        <FInput value={title} onChange={e => setTitle(e.target.value)} placeholder="Short summary, e.g. Misdirected email with student report cards" />
      </FormField>
      <FormField label="Description" required>
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#0C447C]" placeholder="What happened, how it was discovered" />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Breach Type" required>
          <select value={breachType} onChange={e => setBreachType(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0C447C]">
            {BREACH_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </FormField>
        <FormField label="Severity (risk to individuals)" required>
          <FSelect options={["low", "medium", "high", "critical"]} value={severity} onChange={e => setSeverity(e.target.value)} />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Discovered Date" required>
          <input type="date" value={discoveredDate} onChange={e => setDiscoveredDate(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]" />
        </FormField>
        <FormField label="Occurred Date (if known, if different)">
          <input type="date" value={occurredDate} onChange={e => setOccurredDate(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]" />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Affected Subject Type">
          <FSelect options={["student", "staff", "parent", "multiple"]} value={affectedSubjectType} onChange={e => setAffectedSubjectType(e.target.value)} />
        </FormField>
        <FormField label="Estimated People Affected">
          <input type="number" min={0} value={affectedCount} onChange={e => setAffectedCount(Number(e.target.value))} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]" />
        </FormField>
      </div>
      <FormField label="Data Categories Affected">
        <div className="flex flex-wrap gap-1.5">
          {DATA_CATEGORY_OPTIONS.map(c => (
            <button key={c} type="button" onClick={() => toggleCategory(c)}
              className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-colors ${dataCategories.includes(c) ? "bg-[#0C447C] text-white border-[#0C447C]" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}>
              {c}
            </button>
          ))}
        </div>
      </FormField>
      <FormField label="Risk Assessment">
        <textarea value={riskAssessment} onChange={e => setRiskAssessment(e.target.value)} rows={2} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#0C447C]" placeholder="Likelihood and severity of harm to the individuals affected" />
      </FormField>
      <div className="space-y-1.5 mt-1">
        <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
          <input type="checkbox" checked={regulatorNotificationRequired} onChange={e => setRegulatorNotificationRequired(e.target.checked)} className="accent-[#0C447C]" />
          Notifying the supervisory authority is required (Article 33 — within 72 hours of discovery)
        </label>
        <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
          <input type="checkbox" checked={subjectsNotificationRequired} onChange={e => setSubjectsNotificationRequired(e.target.checked)} className="accent-[#0C447C]" />
          Notifying affected individuals is required (Article 34 — high risk to their rights)
        </label>
      </div>
      <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 mt-3">
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" onClick={save} className={!canSubmit ? "opacity-40 pointer-events-none" : ""}>{createMut.isPending ? "Saving…" : "Log Breach"}</Btn>
      </div>
    </Modal>
  );
}

function ManageBreachModal({ b, onClose }: { b: any; onClose: () => void }) {
  const updateMut = useUpdateDataBreach();
  const [status, setStatus] = useState(b.status);
  const [containmentActions, setContainmentActions] = useState(b.containmentActions || "");
  const [rootCause, setRootCause] = useState(b.rootCause || "");
  const [remedialActions, setRemedialActions] = useState(b.remedialActions || "");
  const [regulatorNotifiedDate, setRegulatorNotifiedDate] = useState(b.regulatorNotifiedDate ? String(b.regulatorNotifiedDate).slice(0, 10) : "");
  const [regulatorNotificationReference, setRegulatorNotificationReference] = useState(b.regulatorNotificationReference || "");
  const [subjectsNotifiedDate, setSubjectsNotifiedDate] = useState(b.subjectsNotifiedDate ? String(b.subjectsNotifiedDate).slice(0, 10) : "");

  const save = () => {
    updateMut.mutate({
      id: b._id,
      data: {
        status, containmentActions, rootCause, remedialActions,
        regulatorNotifiedDate: regulatorNotifiedDate || undefined,
        regulatorNotificationReference,
        subjectsNotifiedDate: subjectsNotifiedDate || undefined,
      },
    }, {
      onSuccess: () => { toast.success("Breach record updated"); onClose(); },
      onError: (e: any) => toast.error(e?.response?.data?.message || "Failed to update"),
    });
  };

  return (
    <Modal open onClose={onClose} title={b.title}>
      <p className="text-xs text-slate-500 mb-3">{b.description}</p>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Status">
          <select value={status} onChange={e => setStatus(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0C447C]">
            {BREACH_STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </FormField>
        <FormField label="Severity">
          <div className={`inline-block text-xs px-2 py-1 rounded-full border font-medium ${SEVERITY_STYLE[b.severity] ?? ""}`}>{b.severity}</div>
        </FormField>
      </div>
      <FormField label="Containment Actions">
        <textarea value={containmentActions} onChange={e => setContainmentActions(e.target.value)} rows={2} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#0C447C]" placeholder="Immediate steps taken to contain the breach" />
      </FormField>
      <FormField label="Root Cause">
        <textarea value={rootCause} onChange={e => setRootCause(e.target.value)} rows={2} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#0C447C]" />
      </FormField>
      <FormField label="Remedial Actions">
        <textarea value={remedialActions} onChange={e => setRemedialActions(e.target.value)} rows={2} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#0C447C]" placeholder="Longer-term fixes to prevent recurrence" />
      </FormField>
      {b.regulatorNotificationRequired && (
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Regulator Notified On">
            <input type="date" value={regulatorNotifiedDate} onChange={e => setRegulatorNotifiedDate(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]" />
          </FormField>
          <FormField label="Notification Reference">
            <FInput value={regulatorNotificationReference} onChange={e => setRegulatorNotificationReference(e.target.value)} placeholder="Case / reference number" />
          </FormField>
        </div>
      )}
      {b.subjectsNotificationRequired && (
        <FormField label="Affected Individuals Notified On">
          <input type="date" value={subjectsNotifiedDate} onChange={e => setSubjectsNotifiedDate(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]" />
        </FormField>
      )}
      <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 mt-3">
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" onClick={save}>{updateMut.isPending ? "Saving…" : "Save"}</Btn>
      </div>
    </Modal>
  );
}

function DataBreachSection() {
  const [showReport, setShowReport] = useState(false);
  const [managing, setManaging] = useState<any | null>(null);
  const { data: raw, isLoading } = useDataBreaches();
  const breaches = asList(raw);

  return (
    <Card>
      {showReport && <ReportBreachModal onClose={() => setShowReport(false)} />}
      {managing && <ManageBreachModal b={managing} onClose={() => setManaging(null)} />}
      <CardHeader
        title="Data Breach Log"
        subtitle="GDPR Article 33/34 breach register — records are never deleted, only updated as an investigation progresses"
        actions={<Btn variant="primary" size="sm" onClick={() => setShowReport(true)}>+ Report Breach</Btn>}
      />
      {isLoading ? <Spinner /> : breaches.length === 0 ? (
        <Empty label="No data breaches logged. That's a good thing — use Report Breach if one occurs." />
      ) : (
        <TableWrap headers={["Title", "Type", "Discovered", "Affected", "Severity", "Status", "Regulator Notification", ""]}>
          {breaches.map((b: any) => (
            <tr key={b._id} className="hover:bg-slate-50/60">
              <Td className="font-medium text-slate-800 max-w-xs">{b.title}</Td>
              <Td className="text-xs">{breachTypeLabel(b.breachType)}</Td>
              <Td className="text-xs">{fmtDate(b.discoveredDate)}</Td>
              <Td className="text-xs capitalize">{b.affectedCount || 0} ({b.affectedSubjectType})</Td>
              <Td><span className={`text-xs px-2 py-0.5 rounded-full border font-medium capitalize ${SEVERITY_STYLE[b.severity] ?? ""}`}>{b.severity}</span></Td>
              <Td><span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${BREACH_STATUS_STYLE[b.status] ?? ""}`}>{BREACH_STATUS_OPTIONS.find(o => o.value === b.status)?.label ?? b.status}</span></Td>
              <Td><RegulatorNotificationBadge b={b} /></Td>
              <Td>
                <button onClick={() => setManaging(b)} className="text-xs font-medium text-[#0C447C] hover:underline whitespace-nowrap">Manage</button>
              </Td>
            </tr>
          ))}
        </TableWrap>
      )}
    </Card>
  );
}

// ═══════════════════ TAB SHELL ═══════════════════
export default function DataPrivacyTab() {
  const [section, setSection] = useState<SectionId>("consent");

  return (
    <div className="space-y-4">
      <div className="mb-1">
        <h1 className="text-xl font-bold text-slate-900">Data Privacy Controls</h1>
        <p className="text-sm text-slate-500 mt-0.5">GDPR, data protection, consent management and retention settings</p>
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {SECTIONS.map(s => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              section === s.id ? "bg-[#0C447C] text-white border-[#0C447C]" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {section === "consent" && <ConsentRecordsSection />}
      {section === "retention" && <RetentionPoliciesSection />}
      {section === "dsar" && <DsarSection />}
      {section === "breaches" && <DataBreachSection />}
    </div>
  );
}
