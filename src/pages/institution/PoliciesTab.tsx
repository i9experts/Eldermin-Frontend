import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  Badge, Btn, Card, Drawer, FInput, FSelect, FormField, Modal, PageHeader, SearchBar, TableWrapper,
} from "./shared";
import organizationService from "../../services/organization.service";
import { useStaffList } from "../../hooks/useStaffList";

const CATEGORIES = ["hr", "academic", "safeguarding", "data_privacy", "health_safety", "financial", "it", "general"];
const CATEGORY_PREFIX: Record<string, string> = {
  hr: "HR", academic: "ACA", safeguarding: "SAF", data_privacy: "DP",
  health_safety: "HS", financial: "FIN", it: "IT", general: "GEN",
};

const EMPTY_FORM = {
  title: "", category: "hr", policyNumber: "", version: "1.0", status: "draft",
  effectiveDate: "", reviewDate: "", expiryDate: "",
  owner: "", approvedBy: "", requiresAcknowledgement: false,
  description: "",
};

function nextPolicyNumber(policies: any[], category: string) {
  const prefix = CATEGORY_PREFIX[category] || "GEN";
  const existing = policies.filter((p) => (p.policyNumber || "").startsWith(`POL-${prefix}-`));
  const nums = existing.map((p) => parseInt((p.policyNumber || "").split("-").pop() || "0", 10)).filter((n) => !isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `POL-${prefix}-${String(next).padStart(3, "0")}`;
}

export default function PoliciesTab() {
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("All");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewDrawer, setViewDrawer] = useState<any | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [ackList, setAckList] = useState<any[] | null>(null);

  const queryClient = useQueryClient();

  const { data: policies = [], isLoading } = useQuery({
    queryKey: ["policies"],
    queryFn: organizationService.getPolicies,
  });
  const { data: staffList = [] } = useStaffList();

  const createPolicy = useMutation({
    mutationFn: async (payload: any) => {
      const created = await organizationService.createPolicy(payload);
      if (file && created?._id) await organizationService.uploadPolicyFile(created._id, file);
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["policies"] });
      toast.success("Policy created");
      closeModal();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed"),
  });

  const updatePolicyMut = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const updated = await organizationService.updatePolicy(id, data);
      if (file) await organizationService.uploadPolicyFile(id, file);
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["policies"] });
      toast.success("Policy updated");
      closeModal();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed"),
  });

  const items = policies as any[];

  const filtered = items.filter(
    (p) => (cat === "All" || p.category === cat.toLowerCase() || p.category.includes(cat.toLowerCase())) &&
      (p.title.toLowerCase().includes(search.toLowerCase()) || (p.policyNumber || "").toLowerCase().includes(search.toLowerCase()))
  );

  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const dueForReview = items.filter((p) => p.reviewDate && new Date(p.reviewDate) <= in30Days && new Date(p.reviewDate) >= now && p.status !== "archived");

  function handleSave() {
    if (!form.title.trim()) { toast.error("Policy title is required"); return; }
    const payload = {
      ...form,
      policyNumber: form.policyNumber || nextPolicyNumber(items, form.category),
      effectiveDate: form.effectiveDate || undefined,
      reviewDate: form.reviewDate || undefined,
      expiryDate: form.expiryDate || undefined,
      totalStaff: staffList.length,
    };
    if (editingId) updatePolicyMut.mutate({ id: editingId, data: payload });
    else createPolicy.mutate(payload);
  }

  function closeModal() {
    setModal(false);
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setFile(null);
  }

  function openEdit(p: any) {
    setEditingId(p._id);
    setForm({
      title: p.title || "", category: p.category || "hr", policyNumber: p.policyNumber || "",
      version: p.version || "1.0", status: p.status || "draft",
      effectiveDate: p.effectiveDate ? new Date(p.effectiveDate).toISOString().slice(0, 10) : "",
      reviewDate: p.reviewDate ? new Date(p.reviewDate).toISOString().slice(0, 10) : "",
      expiryDate: p.expiryDate ? new Date(p.expiryDate).toISOString().slice(0, 10) : "",
      owner: p.owner || "", approvedBy: p.approvedBy || "",
      requiresAcknowledgement: !!p.requiresAcknowledgement,
      description: p.description || "",
    });
    setFile(null);
    setModal(true);
  }

  async function openView(p: any) {
    setViewDrawer(p);
    if (p.requiresAcknowledgement) {
      const acks = await organizationService.getPolicyAcknowledgements(p._id);
      setAckList(acks);
    } else {
      setAckList(null);
    }
  }

  function exportCSV() {
    const rows = [
      ["Policy Number", "Title", "Category", "Version", "Status", "Owner", "Effective Date", "Review Date"],
      ...filtered.map((p) => [p.policyNumber || "", p.title, p.category, p.version || "", p.status, p.owner || "", p.effectiveDate ? new Date(p.effectiveDate).toLocaleDateString() : "", p.reviewDate ? new Date(p.reviewDate).toLocaleDateString() : ""]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "policy-repository.csv"; a.click();
    URL.revokeObjectURL(url);
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
        breadcrumbs={["Home", "Institution Setup", "Policy Repository"]}
        title="Policy Repository"
        subtitle={`${items.length} policies — ${items.filter((p) => p.status === "active").length} active`}
        actions={
          <div className="flex gap-2">
            <Btn variant="secondary" size="sm" onClick={exportCSV}>⬇️ Export</Btn>
            <Btn variant="primary" size="sm" onClick={() => setModal(true)}>＋ Upload Policy</Btn>
          </div>
        }
      />

      {dueForReview.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-amber-800">⚠️ {dueForReview.length} polic{dueForReview.length === 1 ? "y" : "ies"} due for review within 30 days</p>
          <div className="mt-2 space-y-1">
            {dueForReview.map((p) => (
              <p key={p._id} className="text-xs text-amber-700">{p.title} — review due {new Date(p.reviewDate).toLocaleDateString()}</p>
            ))}
          </div>
        </div>
      )}

      <Card className="p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <SearchBar placeholder="Search by title or policy number…" value={search} onChange={setSearch} />
          <div className="flex gap-1.5 flex-wrap">
            {["All", ...CATEGORIES].map((c) => (
              <button key={c} onClick={() => setCat(c)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${cat === c ? "bg-[#0C447C] text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100"}`}>
                {c === "All" ? "All" : c.replace(/_/g, " ").charAt(0).toUpperCase() + c.replace(/_/g, " ").slice(1)}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <TableWrapper headers={["Policy", "Category", "Version", "Owner", "Review Date", "Acknowledgement", "Status", "Actions"]}>
          {filtered.map((p: any) => (
            <tr key={p._id} className="hover:bg-slate-50/60 transition-colors">
              <td className="py-3 px-4">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">📋</span>
                  <div>
                    <div className="text-sm font-semibold text-slate-800">{p.title}</div>
                    <div className="text-xs text-slate-400">{p.policyNumber || "—"}</div>
                  </div>
                </div>
              </td>
              <td className="py-3 px-4 text-xs text-slate-600 capitalize">{p.category.replace(/_/g, " ")}</td>
              <td className="py-3 px-4 text-xs text-slate-600">v{p.version || "1.0"}</td>
              <td className="py-3 px-4 text-xs text-slate-600">{p.owner || "—"}</td>
              <td className="py-3 px-4 text-xs text-slate-600">{p.reviewDate ? new Date(p.reviewDate).toLocaleDateString() : "—"}</td>
              <td className="py-3 px-4">
                {p.requiresAcknowledgement ? (
                  <div className="w-24">
                    <div className="text-[10px] text-slate-500 mb-0.5">{p.acknowledgedCount || 0}/{p.totalStaff || 0}</div>
                    <div className="h-1.5 bg-slate-100 rounded-full">
                      <div className="h-1.5 bg-emerald-500 rounded-full" style={{ width: `${p.totalStaff ? Math.min(100, ((p.acknowledgedCount || 0) / p.totalStaff) * 100) : 0}%` }} />
                    </div>
                  </div>
                ) : <span className="text-xs text-slate-300">N/A</span>}
              </td>
              <td className="py-3 px-4"><Badge status={p.status === "active" ? "Active" : p.status === "draft" ? "Draft" : p.status === "archived" ? "Archived" : p.status === "expired" ? "Inactive" : "Under Review"} /></td>
              <td className="py-3 px-4">
                <div className="flex gap-1">
                  <button onClick={() => openView(p)} className="px-2 py-1 hover:bg-blue-50 rounded text-[#0C447C] text-xs font-medium">👁️ View</button>
                  {p.fileUrl && <a href={p.fileUrl} target="_blank" rel="noreferrer" className="px-2 py-1 hover:bg-slate-100 rounded text-slate-500 text-xs">⬇️</a>}
                  <button onClick={() => openEdit(p)} className="px-2 py-1 hover:bg-slate-100 rounded text-slate-500 text-xs">✏️</button>
                </div>
              </td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr><td colSpan={8} className="py-12 text-center text-sm text-slate-400">
              {items.length === 0 ? "No policies yet. Click ＋ Upload Policy to add one." : "No results match your search."}
            </td></tr>
          )}
        </TableWrapper>
        <div className="p-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-400">Showing {filtered.length} of {items.length} policies</span>
        </div>
      </Card>

      {/* ── View Drawer ─────────────────────────────────────────────── */}
      <Drawer open={!!viewDrawer} onClose={() => { setViewDrawer(null); setAckList(null); }} title="Policy Details">
        {viewDrawer && (
          <div className="p-5 space-y-4">
            <div>
              <h3 className="font-bold text-slate-900">{viewDrawer.title}</h3>
              <p className="text-xs text-slate-400">{viewDrawer.policyNumber} · v{viewDrawer.version || "1.0"}</p>
              <div className="mt-2"><Badge status={viewDrawer.status === "active" ? "Active" : viewDrawer.status === "draft" ? "Draft" : "Under Review"} /></div>
            </div>
            {viewDrawer.description && <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3">{viewDrawer.description}</p>}
            {([
              ["Category", viewDrawer.category?.replace(/_/g, " ")],
              ["Owner", viewDrawer.owner || "—"],
              ["Approved By", viewDrawer.approvedBy || "—"],
              ["Effective Date", viewDrawer.effectiveDate ? new Date(viewDrawer.effectiveDate).toLocaleDateString() : "—"],
              ["Review Date", viewDrawer.reviewDate ? new Date(viewDrawer.reviewDate).toLocaleDateString() : "—"],
              ["Expiry Date", viewDrawer.expiryDate ? new Date(viewDrawer.expiryDate).toLocaleDateString() : "—"],
            ] as [string, string][]).map(([k, v]) => (
              <div key={k} className="flex justify-between py-2 border-b border-slate-50 text-sm capitalize">
                <span className="text-slate-500">{k}</span>
                <span className="font-medium text-slate-800">{v}</span>
              </div>
            ))}
            {viewDrawer.fileUrl && (
              <a href={viewDrawer.fileUrl} target="_blank" rel="noreferrer" className="block text-center py-2 bg-blue-50 text-[#0C447C] rounded-lg text-sm font-medium">⬇️ Download Document</a>
            )}
            {viewDrawer.requiresAcknowledgement && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Acknowledgements ({viewDrawer.acknowledgedCount || 0} of {viewDrawer.totalStaff || 0})
                </p>
                <div className="space-y-1">
                  {(ackList || []).map((a: any) => (
                    <div key={a._id} className="flex items-center justify-between text-xs bg-slate-50 rounded-lg px-3 py-2">
                      <span className="text-slate-700">{a.staffName}</span>
                      <span className="text-slate-400">{new Date(a.acknowledgedAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                  {(!ackList || ackList.length === 0) && <span className="text-xs text-slate-400">No acknowledgements recorded yet</span>}
                </div>
              </div>
            )}
            <Btn variant="primary" className="w-full justify-center" onClick={() => openEdit(viewDrawer)}>✏️ Edit Policy</Btn>
          </div>
        )}
      </Drawer>

      {/* ── Add / Edit Modal ────────────────────────────────────────── */}
      <Modal open={modal} onClose={closeModal} title={editingId ? "Edit Policy" : "Upload Policy"} size="lg">
        <div className="p-5 grid grid-cols-2 gap-4 max-h-[65vh] overflow-y-auto">
          <div className="col-span-2">
            <FormField label="Policy Title" required>
              <FInput value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="e.g. Student Discipline & Conduct Policy" />
            </FormField>
          </div>
          <FormField label="Category">
            <FSelect options={CATEGORIES} value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value, policyNumber: "" }))} />
          </FormField>
          <FormField label="Policy Number">
            <FInput value={form.policyNumber} onChange={(e) => setForm((p) => ({ ...p, policyNumber: e.target.value }))} placeholder={nextPolicyNumber(items, form.category)} />
          </FormField>
          <FormField label="Version">
            <FInput value={form.version} onChange={(e) => setForm((p) => ({ ...p, version: e.target.value }))} placeholder="1.0" />
          </FormField>
          <FormField label="Status">
            <FSelect options={["draft", "active", "under_review", "archived", "expired"]} value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))} />
          </FormField>
          <FormField label="Owner">
            <FSelect
              options={["", ...staffList.map((s: any) => `${s.firstName} ${s.lastName}`)]}
              value={form.owner} onChange={(e) => setForm((p) => ({ ...p, owner: e.target.value }))}
            />
          </FormField>
          <FormField label="Approved By">
            <FSelect
              options={["", ...staffList.map((s: any) => `${s.firstName} ${s.lastName}`)]}
              value={form.approvedBy} onChange={(e) => setForm((p) => ({ ...p, approvedBy: e.target.value }))}
            />
          </FormField>
          <FormField label="Effective Date">
            <FInput type="date" value={form.effectiveDate} onChange={(e) => setForm((p) => ({ ...p, effectiveDate: e.target.value }))} />
          </FormField>
          <FormField label="Review Date">
            <FInput type="date" value={form.reviewDate} onChange={(e) => setForm((p) => ({ ...p, reviewDate: e.target.value }))} />
          </FormField>
          <FormField label="Expiry Date">
            <FInput type="date" value={form.expiryDate} onChange={(e) => setForm((p) => ({ ...p, expiryDate: e.target.value }))} />
          </FormField>
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.requiresAcknowledgement} onChange={(e) => setForm((p) => ({ ...p, requiresAcknowledgement: e.target.checked }))} className="accent-[#0C447C]" />
              Requires staff acknowledgement
            </label>
          </div>
          <div className="col-span-2">
            <FormField label="Description">
              <textarea className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C] resize-none" rows={2}
                placeholder="Brief description of this policy…" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
            </FormField>
          </div>
          <div className="col-span-2">
            <FormField label="Policy Document">
              <input
                type="file" accept=".pdf,.doc,.docx"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 file:mr-3 file:px-3 file:py-1 file:rounded-lg file:border-0 file:bg-blue-50 file:text-[#0C447C] file:text-xs"
              />
              {file && <p className="text-xs text-slate-500 mt-1">Selected: {file.name}</p>}
            </FormField>
          </div>
        </div>
        <div className="p-5 border-t border-slate-100 flex justify-end gap-2">
          <Btn variant="secondary" onClick={closeModal}>Cancel</Btn>
          <Btn variant="primary" onClick={handleSave}>
            {(createPolicy.isPending || updatePolicyMut.isPending) ? "Saving…" : editingId ? "✓ Save Changes" : "＋ Upload Policy"}
          </Btn>
        </div>
      </Modal>
    </div>
  );
}
