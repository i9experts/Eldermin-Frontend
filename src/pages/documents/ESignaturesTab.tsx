import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Card, CardHeader, Badge, Btn, Modal, FormField, FInput, FSelect, TableWrap } from "./shared";
import signaturesService from "../../services/signatures.service";
import documentsService from "../../services/documents.service";
import { FileUpload } from "../../components/ui/FileUpload";
import { SignaturePad } from "../../components/ui/SignaturePad";

const STATUS_BADGE: Record<string, string> = {
  pending: "Pending", completed: "Complete", declined: "Escalated", cancelled: "Draft",
};

function formatDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function isOverdue(req: any) {
  return req.status === "pending" && req.deadline && new Date(req.deadline) < new Date();
}

type RecipientDraft = { name: string; email: string };

function parseRecipient(raw: string): RecipientDraft | null {
  const s = raw.trim().replace(/[,;]+$/, "").trim();
  if (!s) return null;
  const angled = s.match(/^(.+?)<(.+?)>$/);
  const email = (angled ? angled[2] : s).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  const name = angled ? angled[1].trim() : email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return { name, email };
}

const emptySendForm = {
  docMode: "library" as "library" | "upload",
  documentId: "", documentLabel: "",
  fileUrl: "", fileName: "",
  recipients: [] as RecipientDraft[], recipientInput: "",
  signingOrder: "Any order",
  deadline: "", message: "",
};

export default function ESignaturesTab() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [signModal, setSignModal] = useState(false);
  const [sendModal, setSendModal] = useState(false);
  const [historyModal, setHistoryModal] = useState(false);
  const [sendForm, setSendForm] = useState(emptySendForm);
  const [signerName, setSignerName] = useState("");
  const [signerDesignation, setSignerDesignation] = useState("");
  const [signatureImage, setSignatureImage] = useState<string | null>(null);

  const { data: dashboard } = useQuery({ queryKey: ["esign-dashboard"], queryFn: signaturesService.getDashboard });
  // "Pending Signatures" - the requests where the CURRENT viewer is themselves
  // a recipient still waiting to act, i.e. exactly what "Awaiting Your
  // Signature" above counts.
  const { data: myQueue = [], isLoading: queueLoading } = useQuery({
    queryKey: ["esign-my-queue"],
    queryFn: () => signaturesService.getRequests({ mine: true, status: "pending" }),
  });
  // Everything this school has ever sent (any status) - powers both the
  // "Recent Signature Activity" strip and the full Signature History modal.
  const { data: allRequests = [] } = useQuery({
    queryKey: ["esign-requests"],
    queryFn: () => signaturesService.getRequests(),
  });
  const { data: docLibrary = [] } = useQuery({
    queryKey: ["documents-for-signature"],
    queryFn: () => documentsService.getDocuments({ status: "active" }),
  });
  const docLibraryList = ((docLibrary as any)?.data ?? []) as any[];

  const sel = (myQueue as any[]).find((r: any) => r._id === selectedId) || null;
  const activity = (allRequests as any[]).filter((r: any) => r.status !== "pending").slice(0, 8);

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["esign-dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["esign-my-queue"] });
    queryClient.invalidateQueries({ queryKey: ["esign-requests"] });
  };

  const createMut = useMutation({
    mutationFn: signaturesService.createRequest,
    onSuccess: () => {
      toast.success("Sent for signature");
      invalidateAll();
      setSendModal(false);
      setSendForm(emptySendForm);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Failed to send"),
  });
  const cancelMut = useMutation({
    mutationFn: signaturesService.cancelRequest,
    onSuccess: () => { toast.success("Request cancelled"); invalidateAll(); },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Failed to cancel"),
  });
  const signMut = useMutation({
    mutationFn: (vars: { id: string; typedName: string; designation?: string; signatureImage?: string }) =>
      signaturesService.signMine(vars.id, { typedName: vars.typedName, designation: vars.designation || undefined, signatureImage: vars.signatureImage || undefined }),
    onSuccess: () => {
      toast.success("Signed");
      invalidateAll();
      setSignModal(false);
      setSelectedId(null);
      setSignerName(""); setSignerDesignation(""); setSignatureImage(null);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Failed to sign"),
  });
  const declineMut = useMutation({
    mutationFn: (vars: { id: string; reason?: string }) => signaturesService.declineMine(vars.id, vars.reason),
    onSuccess: () => { toast.success("Declined"); invalidateAll(); setSelectedId(null); },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Failed to decline"),
  });

  function addRecipient() {
    const parsed = parseRecipient(sendForm.recipientInput);
    if (!parsed) { toast.error("Enter a valid email address"); return; }
    if (sendForm.recipients.some((r) => r.email === parsed.email)) { setSendForm((f) => ({ ...f, recipientInput: "" })); return; }
    setSendForm((f) => ({ ...f, recipients: [...f.recipients, parsed], recipientInput: "" }));
  }
  function removeRecipient(email: string) {
    setSendForm((f) => ({ ...f, recipients: f.recipients.filter((r) => r.email !== email) }));
  }

  function submitSend() {
    if (sendForm.docMode === "library" && !sendForm.documentId) { toast.error("Select a document from the library"); return; }
    if (sendForm.docMode === "upload" && !sendForm.fileUrl) { toast.error("Attach a document to send"); return; }
    if (sendForm.recipients.length === 0) { toast.error("Add at least one recipient"); return; }
    createMut.mutate({
      documentId: sendForm.docMode === "library" ? sendForm.documentId : undefined,
      documentName: sendForm.docMode === "upload" ? sendForm.fileName : undefined,
      fileUrl: sendForm.docMode === "upload" ? sendForm.fileUrl : undefined,
      fileName: sendForm.docMode === "upload" ? sendForm.fileName : undefined,
      recipients: sendForm.recipients,
      signingOrder: sendForm.signingOrder.startsWith("Sequential") ? "sequential" : "any",
      deadline: sendForm.deadline || undefined,
      message: sendForm.message || undefined,
    });
  }

  function submitSignature() {
    if (!sel) return;
    if (!signerName.trim()) { toast.error("Type your full legal name to sign"); return; }
    signMut.mutate({ id: sel._id, typedName: signerName, designation: signerDesignation, signatureImage: signatureImage || undefined });
  }

  function declineSelected() {
    if (!sel) return;
    const reason = window.prompt("Reason for declining (optional):") || undefined;
    if (reason === undefined && !window.confirm("Decline without giving a reason?")) return;
    declineMut.mutate({ id: sel._id, reason });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900">E-Signatures</h1>
          <p className="text-sm text-slate-500 mt-0.5">Documents awaiting your electronic signature</p>
        </div>
        <div className="flex gap-2">
          <Btn variant="secondary" size="sm" onClick={() => setHistoryModal(true)}>📜 Signature History</Btn>
          <Btn variant="primary" size="sm" onClick={() => setSendModal(true)}>+ Send for Signature</Btn>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Awaiting Your Signature", value: (dashboard as any)?.awaitingYourSignature ?? 0, color: "text-[#0C447C]" },
          { label: "Sent for Signature", value: (dashboard as any)?.sentForSignature ?? 0, color: "text-[#EF9F27]" },
          { label: "Completed This Month", value: (dashboard as any)?.completedThisMonth ?? 0, color: "text-emerald-600" },
          { label: "Overdue", value: (dashboard as any)?.overdue ?? 0, color: "text-red-600" },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{k.label}</div>
            <div className={`text-2xl font-bold mt-1 ${k.color}`}>{k.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Queue list */}
        <div>
          <Card>
            <CardHeader title={`Pending Signatures (${(myQueue as any[]).length})`} />
            <div className="divide-y divide-slate-50">
              {queueLoading ? (
                <div className="p-6 text-center text-sm text-slate-400">Loading…</div>
              ) : (myQueue as any[]).length === 0 ? (
                <div className="p-6 text-center text-sm text-slate-400">Nothing waiting on your signature.</div>
              ) : (myQueue as any[]).map((item: any) => (
                <div
                  key={item._id}
                  onClick={() => setSelectedId(item._id)}
                  className={`p-4 cursor-pointer transition-colors ${selectedId === item._id ? "bg-blue-50 border-l-2 border-[#0C447C]" : "hover:bg-slate-50"}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="font-semibold text-slate-800 text-xs leading-tight">{item.documentName}</div>
                    <Badge status={isOverdue(item) ? "Critical" : "Pending"} />
                  </div>
                  <div className="text-xs text-slate-500 mt-1">From: {item.createdBy}</div>
                  <div className={`text-xs font-medium mt-1 ${isOverdue(item) ? "text-red-600" : "text-slate-600"}`}>
                    Due: {formatDate(item.deadline)}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Preview panel */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            {sel ? (
              <>
                <CardHeader
                  title={sel.documentName}
                  subtitle={`Sent by ${sel.createdBy} · Due ${formatDate(sel.deadline)}`}
                  actions={
                    <div className="flex gap-2">
                      <Btn variant="secondary" size="sm" onClick={() => window.open(sel.fileUrl, "_blank", "noopener,noreferrer")}>↓ Download</Btn>
                      <Btn variant="danger" size="sm" onClick={declineSelected}>✕ Decline</Btn>
                      <Btn variant="success" size="sm" onClick={() => setSignModal(true)}>✍ Sign Now</Btn>
                    </div>
                  }
                />
                <div className="p-5 space-y-4">
                  {sel.message && (
                    <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-sm text-slate-600 italic">"{sel.message}"</div>
                  )}
                  <div className="rounded-lg overflow-hidden border border-slate-200">
                    <iframe src={sel.fileUrl} title={sel.documentName} className="w-full h-80 bg-white" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Recipients</div>
                    <div className="space-y-1.5">
                      {sel.recipients.map((r: any) => (
                        <div key={r.email} className="flex items-center justify-between text-xs bg-slate-50 rounded-lg px-3 py-2">
                          <span className="text-slate-700">{r.name} <span className="text-slate-400">({r.email})</span></span>
                          <Badge status={r.status === "signed" ? "Complete" : r.status === "declined" ? "Escalated" : "Pending"} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-60 text-slate-400">
                <div className="text-4xl mb-3">✍️</div>
                <div className="text-sm">Select a document to preview and sign</div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Signature activity */}
      <Card className="mt-4">
        <CardHeader title="Recent Signature Activity" />
        <TableWrap headers={["Document", "Sent By", "Recipients", "Status", "Date"]}>
          {activity.length === 0 ? (
            <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-400">No signature activity yet.</td></tr>
          ) : activity.map((r: any) => (
            <tr key={r._id}>
              <td className="px-4 py-3 text-sm font-medium text-slate-700">{r.documentName}</td>
              <td className="px-4 py-3 text-sm text-slate-600">{r.createdBy}</td>
              <td className="px-4 py-3 text-xs text-slate-500">{r.recipients.filter((x: any) => x.status === "signed").length}/{r.recipients.length} signed</td>
              <td className="px-4 py-3"><Badge status={STATUS_BADGE[r.status] || r.status} /></td>
              <td className="px-4 py-3 text-xs text-slate-400">{formatDate(r.completedAt || r.createdAt)}</td>
            </tr>
          ))}
        </TableWrap>
      </Card>

      {/* Signature History modal */}
      <Modal open={historyModal} onClose={() => setHistoryModal(false)} title="Signature History" size="lg">
        <TableWrap headers={["Document", "Sent By", "Recipients", "Signing Order", "Status", "Sent", "Action"]}>
          {(allRequests as any[]).length === 0 ? (
            <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">No signature requests yet.</td></tr>
          ) : (allRequests as any[]).map((r: any) => (
            <tr key={r._id}>
              <td className="px-4 py-3 text-sm font-medium text-slate-700">{r.documentName}</td>
              <td className="px-4 py-3 text-sm text-slate-600">{r.createdBy}</td>
              <td className="px-4 py-3 text-xs text-slate-500">{r.recipients.filter((x: any) => x.status === "signed").length}/{r.recipients.length} signed</td>
              <td className="px-4 py-3 text-xs text-slate-500 capitalize">{r.signingOrder}</td>
              <td className="px-4 py-3"><Badge status={isOverdue(r) ? "Escalated" : (STATUS_BADGE[r.status] || r.status)} /></td>
              <td className="px-4 py-3 text-xs text-slate-400">{formatDate(r.createdAt)}</td>
              <td className="px-4 py-3">
                {r.status === "pending" && (
                  <button onClick={() => { if (window.confirm(`Cancel the signature request for "${r.documentName}"?`)) cancelMut.mutate(r._id); }} className="text-xs text-red-500 hover:underline">Cancel</button>
                )}
              </td>
            </tr>
          ))}
        </TableWrap>
      </Modal>

      {/* Sign modal */}
      <Modal open={signModal} onClose={() => setSignModal(false)} title="E-Sign Document" size="sm">
        <p className="text-sm text-slate-700 mb-4">{sel?.documentName}</p>
        <SignaturePad onChange={setSignatureImage} />
        <div className="mt-4">
          <FormField label="Full Name" required><FInput placeholder="Type your full legal name" value={signerName} onChange={(e) => setSignerName(e.target.value)} /></FormField>
          <FormField label="Designation"><FInput placeholder="e.g. Principal" value={signerDesignation} onChange={(e) => setSignerDesignation(e.target.value)} /></FormField>
        </div>
        <p className="text-xs text-slate-400 mb-4">By signing, you confirm this is a legally binding electronic signature.</p>
        <div className="flex gap-2 justify-end">
          <Btn variant="secondary" size="sm" onClick={() => setSignModal(false)}>Cancel</Btn>
          <Btn variant="success" size="sm" onClick={submitSignature}>{signMut.isPending ? "Signing…" : "✓ Apply Signature"}</Btn>
        </div>
      </Modal>

      {/* Send for signature modal */}
      <Modal open={sendModal} onClose={() => setSendModal(false)} title="Send Document for Signature" size="md">
        <FormField label="Document" required>
          <div className="flex gap-2 mb-2">
            <button type="button" onClick={() => setSendForm((f) => ({ ...f, docMode: "library" }))}
              className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium border ${sendForm.docMode === "library" ? "bg-[#0C447C] text-white border-[#0C447C]" : "border-slate-200 text-slate-600"}`}>From Library</button>
            <button type="button" onClick={() => setSendForm((f) => ({ ...f, docMode: "upload" }))}
              className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium border ${sendForm.docMode === "upload" ? "bg-[#0C447C] text-white border-[#0C447C]" : "border-slate-200 text-slate-600"}`}>Attach New File</button>
          </div>
          {sendForm.docMode === "library" ? (
            <FSelect
              value={sendForm.documentLabel}
              onChange={(e) => {
                const doc = docLibraryList.find((d: any) => d.title === e.target.value);
                setSendForm((f) => ({ ...f, documentLabel: e.target.value, documentId: doc?._id || "" }));
              }}
              options={["", ...docLibraryList.map((d: any) => d.title)]}
            />
          ) : (
            <FileUpload
              folder="signatures"
              accept=".pdf,.doc,.docx"
              multiple={false}
              onUpload={(files) => {
                if (files[0]) setSendForm((f) => ({ ...f, fileUrl: files[0].url, fileName: files[0].fileName }));
              }}
              label="Upload document to send for signature"
            />
          )}
        </FormField>
        <FormField label="Recipients" required>
          <div className="flex gap-2">
            <FInput
              placeholder="Add names or email addresses…"
              value={sendForm.recipientInput}
              onChange={(e) => setSendForm((f) => ({ ...f, recipientInput: e.target.value }))}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addRecipient(); } }}
            />
            <Btn variant="secondary" size="sm" onClick={addRecipient}>Add</Btn>
          </div>
          {sendForm.recipients.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {sendForm.recipients.map((r) => (
                <span key={r.email} className="inline-flex items-center gap-1.5 text-xs bg-blue-50 text-[#0C447C] px-2 py-1 rounded-full">
                  {r.name} <button onClick={() => removeRecipient(r.email)} className="text-[#0C447C] hover:text-red-600">✕</button>
                </span>
              ))}
            </div>
          )}
        </FormField>
        <FormField label="Signing Order">
          <FSelect
            options={["Any order", "Sequential (in order)"]}
            value={sendForm.signingOrder}
            onChange={(e) => setSendForm((f) => ({ ...f, signingOrder: e.target.value }))}
          />
        </FormField>
        <FormField label="Deadline">
          <FInput type="date" value={sendForm.deadline} onChange={(e) => setSendForm((f) => ({ ...f, deadline: e.target.value }))} />
        </FormField>
        <FormField label="Message">
          <textarea
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]"
            rows={3} placeholder="Add a message for signatories…"
            value={sendForm.message}
            onChange={(e) => setSendForm((f) => ({ ...f, message: e.target.value }))}
          />
        </FormField>
        <div className="flex gap-2 justify-end mt-2">
          <Btn variant="secondary" size="sm" onClick={() => setSendModal(false)}>Cancel</Btn>
          <Btn variant="primary" size="sm" onClick={submitSend}>{createMut.isPending ? "Sending…" : "Send for Signature"}</Btn>
        </div>
      </Modal>
    </div>
  );
}
