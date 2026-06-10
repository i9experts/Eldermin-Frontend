import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  Badge, Btn, Card, FInput, FSelect, FormField, Modal, PageHeader, SearchBar, TableWrapper,
} from "./shared";
import organizationService from "../../services/organization.service";

const EMPTY_FORM = { title: "", category: "hr", status: "draft", effectiveDate: "", reviewDate: "", description: "" };

export default function PoliciesTab() {
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("All");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const queryClient = useQueryClient();

  const { data: policies = [], isLoading } = useQuery({
    queryKey: ["policies"],
    queryFn: organizationService.getPolicies,
  });

  const createPolicy = useMutation({
    mutationFn: organizationService.createPolicy,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["policies"] });
      toast.success("Policy created");
      setModal(false);
      setForm({ ...EMPTY_FORM });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed"),
  });

  const items = policies as any[];

  const filtered = items.filter(
    (p) => (cat === "All" || p.category === cat.toLowerCase() || p.category.includes(cat.toLowerCase())) &&
      p.title.toLowerCase().includes(search.toLowerCase())
  );

  function handleSave() {
    if (!form.title.trim()) { toast.error("Policy title is required"); return; }
    createPolicy.mutate({
      ...form,
      effectiveDate: form.effectiveDate || undefined,
      reviewDate: form.reviewDate || undefined,
    });
  }

  function closeModal() { setModal(false); setForm({ ...EMPTY_FORM }); }

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
            <Btn variant="secondary" size="sm">⬇️ Export</Btn>
            <Btn variant="primary" size="sm" onClick={() => setModal(true)}>＋ Upload Policy</Btn>
          </div>
        }
      />

      <Card className="p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <SearchBar placeholder="Search policies…" value={search} onChange={setSearch} />
          <div className="flex gap-1.5 flex-wrap">
            {["All", "hr", "academic", "financial", "operational", "compliance", "other"].map((c) => (
              <button key={c} onClick={() => setCat(c)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${cat === c ? "bg-[#0C447C] text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100"}`}>
                {c === "All" ? "All" : c.charAt(0).toUpperCase() + c.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <TableWrapper headers={["Policy Title", "Category", "Effective Date", "Review Date", "Status", "Actions"]}>
          {filtered.map((p: any) => (
            <tr key={p._id} className="hover:bg-slate-50/60 transition-colors">
              <td className="py-3 px-4">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">📋</span>
                  <div>
                    <div className="text-sm font-semibold text-slate-800">{p.title}</div>
                    <div className="text-xs text-slate-400">POL-{String(p._id).slice(-6).toUpperCase()}</div>
                  </div>
                </div>
              </td>
              <td className="py-3 px-4 text-xs text-slate-600">{p.category}</td>
              <td className="py-3 px-4 text-xs text-slate-600">{p.effectiveDate ? new Date(p.effectiveDate).toLocaleDateString() : "—"}</td>
              <td className="py-3 px-4 text-xs text-slate-600">{p.reviewDate ? new Date(p.reviewDate).toLocaleDateString() : "—"}</td>
              <td className="py-3 px-4"><Badge status={p.status === "active" ? "Active" : p.status === "draft" ? "Draft" : p.status === "archived" ? "Archived" : "Under Review"} /></td>
              <td className="py-3 px-4">
                <div className="flex gap-1">
                  <button className="px-2 py-1 hover:bg-blue-50 rounded text-[#0C447C] text-xs font-medium">👁️ View</button>
                  <button className="px-2 py-1 hover:bg-slate-100 rounded text-slate-500 text-xs">⬇️</button>
                  <button className="px-2 py-1 hover:bg-slate-100 rounded text-slate-500 text-xs">✏️</button>
                </div>
              </td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr><td colSpan={6} className="py-12 text-center text-sm text-slate-400">
              {items.length === 0 ? "No policies yet. Click ＋ Upload Policy to add one." : "No results match your search."}
            </td></tr>
          )}
        </TableWrapper>
        <div className="p-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-400">Showing {filtered.length} policies</span>
          <div className="flex gap-1">
            {[1, 2].map((n) => (
              <button key={n} className={`w-8 h-8 text-xs rounded-lg ${n === 1 ? "bg-[#0C447C] text-white" : "bg-slate-50 text-slate-600"}`}>{n}</button>
            ))}
          </div>
        </div>
      </Card>

      <Modal open={modal} onClose={closeModal} title="Upload Policy" size="md">
        <div className="p-5 grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <FormField label="Policy Title" required>
              <FInput value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="e.g. Student Discipline & Conduct Policy" />
            </FormField>
          </div>
          <FormField label="Category">
            <FSelect options={["hr", "academic", "financial", "operational", "compliance", "other"]} value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} />
          </FormField>
          <FormField label="Status">
            <FSelect options={["draft", "active", "under_review", "archived"]} value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))} />
          </FormField>
          <FormField label="Effective Date">
            <FInput type="date" value={form.effectiveDate} onChange={(e) => setForm((p) => ({ ...p, effectiveDate: e.target.value }))} />
          </FormField>
          <FormField label="Review Date">
            <FInput type="date" value={form.reviewDate} onChange={(e) => setForm((p) => ({ ...p, reviewDate: e.target.value }))} />
          </FormField>
          <div className="col-span-2">
            <FormField label="Description">
              <textarea className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C] resize-none" rows={2}
                placeholder="Brief description of this policy…" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
            </FormField>
          </div>
        </div>
        <div className="p-5 border-t border-slate-100 flex justify-end gap-2">
          <Btn variant="secondary" onClick={closeModal}>Cancel</Btn>
          <Btn variant="primary" onClick={handleSave}>{createPolicy.isPending ? "Saving…" : "＋ Upload Policy"}</Btn>
        </div>
      </Modal>
    </div>
  );
}
