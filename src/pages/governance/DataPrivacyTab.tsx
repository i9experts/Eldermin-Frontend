import { useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../../hooks/useAuth";
import { StudentSelect } from "../../components/ui/StudentSelect";
import { Card, CardHeader, Btn, Modal, FormField, FInput, FSelect, TableWrap, Td } from "./shared";
import {
  useConsentRecords, useCreateConsentRecord, useUpdateConsentRecord, useDeleteConsentRecord,
  useRetentionPolicies, useCreateRetentionPolicy, useUpdateRetentionPolicy, useDeleteRetentionPolicy, useSeedRetentionPolicyDefaults,
  useDsarRequests, useCreateDsarRequest, useUpdateDsarRequest, useDeleteDsarRequest,
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
    </div>
  );
}
