import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  Badge, Btn, Card, FInput, FSelect, FormField, Modal, PageHeader, SearchBar,
} from "./shared";
import organizationService from "../../services/organization.service";

const TYPE_ICON: Record<string, string> = {
  governance: "⚖️", religious: "🕌", finance: "💰", academic: "📚",
  administrative: "👥", disciplinary: "👥", welfare: "👥", examination: "📋", other: "👥",
};
const TYPE_BG: Record<string, string> = {
  governance: "bg-blue-50", religious: "bg-emerald-50", finance: "bg-amber-50",
  academic: "bg-violet-50", administrative: "bg-slate-50", disciplinary: "bg-slate-50",
  welfare: "bg-slate-50", examination: "bg-slate-50", other: "bg-slate-50",
};

const EMPTY_FORM = { name: "", type: "academic", purpose: "" };

export default function CommitteesTab({ initialModal = false }: { initialModal?: boolean }) {
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(initialModal);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const queryClient = useQueryClient();

  const { data: committees = [], isLoading } = useQuery({
    queryKey: ["committees"],
    queryFn: organizationService.getCommittees,
  });

  const createCommittee = useMutation({
    mutationFn: organizationService.createCommittee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["committees"] });
      toast.success("Committee created");
      setModal(false);
      setForm({ ...EMPTY_FORM });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed"),
  });

  const filtered = (committees as any[]).filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase())
  );

  function handleSave() {
    if (!form.name.trim()) {
      toast.error("Committee name is required");
      return;
    }
    const code = form.name.trim().split(/\s+/).map((w: string) => w[0]).join("").toUpperCase().slice(0, 10);
    createCommittee.mutate({ name: form.name, code, type: form.type, purpose: form.purpose });
  }

  function closeModal() {
    setModal(false);
    setForm({ ...EMPTY_FORM });
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
        breadcrumbs={["Home", "Institution Setup", "Committees"]}
        title="Committee Management"
        subtitle={`${(committees as any[]).length} committees — ${(committees as any[]).filter((c: any) => c.isActive).length} active`}
        actions={
          <div className="flex gap-2">
            <Btn variant="secondary" size="sm">⬇️ Export</Btn>
            <Btn variant="primary" size="sm" onClick={() => setModal(true)}>＋ Create Committee</Btn>
          </div>
        }
      />

      <Card className="p-4">
        <div className="flex gap-3 flex-wrap">
          <SearchBar placeholder="Search committees…" value={search} onChange={setSearch} />
          <FSelect options={["All Types", "Governance", "Academic", "Finance", "HR", "Religious"]} />
          <FSelect options={["All Status", "Active", "Inactive"]} />
        </div>
      </Card>

      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((c: any) => (
          <Card key={c._id} className="p-5 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${TYPE_BG[c.type] ?? "bg-slate-50"}`}>
                  {TYPE_ICON[c.type] ?? "👥"}
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">{c.name}</div>
                  <div className="text-xs text-slate-400">{c.type}</div>
                </div>
              </div>
              <Badge status={c.isActive ? "Active" : "Inactive"} />
            </div>
            <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
              <div className="flex items-center gap-1.5"><span>👤</span><span className="font-medium">Chair:</span> —</div>
              <div className="flex justify-between">
                <span className="flex items-center gap-1"><span>👥</span>{c.members?.length ?? 0} members</span>
                <span className="flex items-center gap-1"><span>📅</span>— meetings/yr</span>
              </div>
            </div>
            <div className="flex gap-1.5 mt-3 pt-3 border-t border-slate-100">
              <button className="flex-1 text-xs py-1.5 bg-blue-50 text-[#0C447C] rounded-lg hover:bg-blue-100 font-medium">View</button>
              <button className="flex-1 text-xs py-1.5 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 font-medium">Edit</button>
              <button className="text-xs py-1.5 px-2 bg-amber-50 text-[#EF9F27] rounded-lg hover:bg-amber-100 font-medium">Schedule</button>
            </div>
          </Card>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-16 text-center text-sm text-slate-400">
            {(committees as any[]).length === 0
              ? "No committees yet. Click ＋ Create Committee to get started."
              : "No results match your search."}
          </div>
        )}
      </div>

      <Modal open={modal} onClose={closeModal} title="Create New Committee" size="md">
        <div className="p-5 grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <FormField label="Committee Name" required>
              <FInput
                placeholder="e.g. Academic Excellence Committee"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              />
            </FormField>
          </div>
          <FormField label="Committee Type" required>
            <FSelect
              options={["Governance", "Academic", "Finance", "HR", "Religious", "Procurement", "Discipline"]}
              value={form.type}
              onChange={(e) => setForm((p) => ({ ...p, type: e.target.value.toLowerCase() }))}
            />
          </FormField>
          <FormField label="Status"><FSelect options={["Active", "Inactive"]} /></FormField>
          <div className="col-span-2">
            <FormField label="Purpose">
              <textarea
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C] resize-none"
                rows={2}
                placeholder="Committee purpose and responsibilities…"
                value={form.purpose}
                onChange={(e) => setForm((p) => ({ ...p, purpose: e.target.value }))}
              />
            </FormField>
          </div>
          <FormField label="Chairperson" required><FInput placeholder="Full name" /></FormField>
          <FormField label="Secretary"><FInput placeholder="Full name" /></FormField>
          <FormField label="Start Date"><FInput type="date" /></FormField>
          <FormField label="End Date"><FInput type="date" /></FormField>
          <div className="col-span-2">
            <FormField label="Members">
              <div className="border border-slate-200 rounded-lg p-3">
                <div className="flex gap-2 mb-2">
                  <FInput placeholder="Add member name…" />
                  <Btn variant="secondary" size="sm">＋ Add</Btn>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {["Dr. Amina Khan", "CA. Bilal Siddiqui", "Ms. Hina Baig"].map((m) => (
                    <span key={m} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-[#0C447C] text-xs rounded-full">
                      {m}<button className="text-blue-400 hover:text-blue-700 ml-0.5">×</button>
                    </span>
                  ))}
                </div>
              </div>
            </FormField>
          </div>
        </div>
        <div className="p-5 border-t border-slate-100 flex justify-end gap-2">
          <Btn variant="secondary" onClick={closeModal}>Cancel</Btn>
          <Btn variant="ghost">💾 Save as Draft</Btn>
          <Btn variant="primary" onClick={handleSave}>
            {createCommittee.isPending ? "Creating…" : "✓ Create Committee"}
          </Btn>
        </div>
      </Modal>
    </div>
  );
}
