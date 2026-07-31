import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  Badge, Btn, Card, Drawer, FInput, FSelect, FormField, Modal, PageHeader, SearchBar,
} from "./shared";
import organizationService from "../../services/organization.service";

const COMMITTEE_TYPES = ["academic", "finance", "disciplinary", "examination", "sports", "other"];

const TYPE_ICON: Record<string, string> = {
  academic: "📚", finance: "💰", disciplinary: "👥", examination: "📋", sports: "🏆", other: "👥",
};
const TYPE_BG: Record<string, string> = {
  academic: "bg-violet-50", finance: "bg-amber-50", disciplinary: "bg-slate-50",
  examination: "bg-slate-50", sports: "bg-emerald-50", other: "bg-slate-50",
};

const EMPTY_FORM = { name: "", type: "academic", purpose: "", chairperson: "", members: [] as string[] };
const NO_CHAIR = "-- Select Chairperson --";

const EMPTY_SCHEDULE_FORM = { scheduledDate: "", scheduledTime: "", venue: "", agenda: "" };

export default function CommitteesTab({ initialModal = false }: { initialModal?: boolean }) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [modal, setModal] = useState(initialModal);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editModal, setEditModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ ...EMPTY_FORM });
  const [memberInput, setMemberInput] = useState("");
  const [editMemberInput, setEditMemberInput] = useState("");
  const [viewDrawer, setViewDrawer] = useState<any | null>(null);
  const [scheduleModal, setScheduleModal] = useState<any | null>(null);
  const [scheduleForm, setScheduleForm] = useState({ ...EMPTY_SCHEDULE_FORM });

  const queryClient = useQueryClient();

  const { data: committees = [], isLoading } = useQuery({
    queryKey: ["committees"],
    queryFn: organizationService.getCommittees,
  });

  const { data: boardMembers = [] } = useQuery({
    queryKey: ["board-members"],
    queryFn: organizationService.getBoardMembers,
  });

  const boardMemberNames = (boardMembers as any[]).map((m: any) => `${m.firstName} ${m.lastName}`);

  const scheduleMeeting = useMutation({
    mutationFn: organizationService.createMeeting,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      toast.success("Meeting scheduled");
      setScheduleModal(null);
      setScheduleForm({ ...EMPTY_SCHEDULE_FORM });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed"),
  });

  const updateCommitteeMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof EMPTY_FORM }) =>
      organizationService.updateCommittee(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["committees"] });
      toast.success("Committee updated");
      setEditModal(false);
      setEditingId(null);
      setEditForm({ ...EMPTY_FORM });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed"),
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

  const filtered = (committees as any[]).filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "All Types" || (c.type || "").toLowerCase() === typeFilter.toLowerCase();
    const matchesStatus = statusFilter === "All Status" || (c.status || "").toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesType && matchesStatus;
  });

  function handleSave() {
    if (!form.name.trim()) {
      toast.error("Committee name is required");
      return;
    }
    createCommittee.mutate({
      name: form.name, type: form.type, purpose: form.purpose,
      chairperson: form.chairperson, members: form.members,
    });
  }

  function closeModal() {
    setModal(false);
    setForm({ ...EMPTY_FORM });
    setMemberInput("");
  }

  function addMember() {
    const name = memberInput.trim();
    if (name && !form.members.includes(name)) {
      setForm((p) => ({ ...p, members: [...p.members, name] }));
    }
    setMemberInput("");
  }

  function addEditMember() {
    const name = editMemberInput.trim();
    if (name && !editForm.members.includes(name)) {
      setEditForm((p) => ({ ...p, members: [...p.members, name] }));
    }
    setEditMemberInput("");
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
        subtitle={`${(committees as any[]).length} committees — ${(committees as any[]).filter((c: any) => c.status === "active").length} active`}
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
          <FSelect
            options={["All Types", ...COMMITTEE_TYPES.map((t) => t[0].toUpperCase() + t.slice(1))]}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          />
          <FSelect
            options={["All Status", "Active", "Inactive"]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
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
              <Badge status={c.status === "active" ? "Active" : "Inactive"} />
            </div>
            <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
              <div className="flex items-center gap-1.5"><span>👤</span><span className="font-medium">Chair:</span> {c.chairperson || "—"}</div>
              <div className="flex justify-between">
                <span className="flex items-center gap-1"><span>👥</span>{c.members?.length ?? 0} members</span>
                <span className="flex items-center gap-1"><span>📅</span>{c.meetingFrequency || "—"}</span>
              </div>
            </div>
            <div className="flex gap-1.5 mt-3 pt-3 border-t border-slate-100">
              <button
                onClick={(e) => { e.stopPropagation(); setViewDrawer(c); }}
                className="flex-1 text-xs py-1.5 bg-blue-50 text-[#0C447C] rounded-lg hover:bg-blue-100 font-medium"
              >View</button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingId(c._id);
                  setEditForm({
                    name: c.name || "", type: c.type || "academic", purpose: c.purpose || "",
                    chairperson: c.chairperson || "", members: c.members || [],
                  });
                  setEditModal(true);
                }}
                className="flex-1 text-xs py-1.5 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 font-medium"
              >Edit</button>
              <button
                onClick={(e) => { e.stopPropagation(); setScheduleModal(c); setScheduleForm({ ...EMPTY_SCHEDULE_FORM }); }}
                className="text-xs py-1.5 px-2 bg-amber-50 text-[#EF9F27] rounded-lg hover:bg-amber-100 font-medium"
              >Schedule</button>
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

      <Modal open={editModal} onClose={() => { setEditModal(false); setEditForm({ ...EMPTY_FORM }); }} title="Edit Committee" size="md">
        <div className="p-5 grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <FormField label="Committee Name" required>
              <FInput
                value={editForm.name}
                onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Academic Excellence Committee"
              />
            </FormField>
          </div>
          <FormField label="Committee Type" required>
            <FSelect
              options={COMMITTEE_TYPES}
              value={editForm.type}
              onChange={(e) => setEditForm((prev) => ({ ...prev, type: e.target.value.toLowerCase() }))}
            />
          </FormField>
          <FormField label="Chairperson">
            {boardMemberNames.length > 0 ? (
              <FSelect
                options={[NO_CHAIR, ...boardMemberNames]}
                value={editForm.chairperson || NO_CHAIR}
                onChange={(e) => setEditForm((prev) => ({ ...prev, chairperson: e.target.value === NO_CHAIR ? "" : e.target.value }))}
              />
            ) : (
              <FInput value={editForm.chairperson} onChange={(e) => setEditForm((prev) => ({ ...prev, chairperson: e.target.value }))} placeholder="Full name" />
            )}
          </FormField>
          <div className="col-span-2">
            <FormField label="Purpose">
              <textarea
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C] resize-none"
                rows={2}
                placeholder="Committee purpose and responsibilities…"
                value={editForm.purpose}
                onChange={(e) => setEditForm((prev) => ({ ...prev, purpose: e.target.value }))}
              />
            </FormField>
          </div>
          <div className="col-span-2">
            <FormField label="Members">
              {boardMemberNames.length > 0 ? (
                <select
                  multiple
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C] bg-white h-32"
                  value={editForm.members}
                  onChange={(e) => setEditForm((p) => ({ ...p, members: Array.from(e.target.selectedOptions, (o) => o.value) }))}
                >
                  {boardMemberNames.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              ) : (
                <div className="border border-slate-200 rounded-lg p-3">
                  <div className="flex gap-2 mb-2">
                    <FInput
                      placeholder="Add member name…"
                      value={editMemberInput}
                      onChange={(e) => setEditMemberInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addEditMember(); } }}
                    />
                    <Btn variant="secondary" size="sm" onClick={addEditMember}>＋ Add</Btn>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {editForm.members.map((m) => (
                      <span key={m} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-[#0C447C] text-xs rounded-full">
                        {m}
                        <button
                          className="text-blue-400 hover:text-blue-700 ml-0.5"
                          onClick={() => setEditForm((p) => ({ ...p, members: p.members.filter((x) => x !== m) }))}
                        >×</button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </FormField>
          </div>
        </div>
        <div className="p-5 border-t border-slate-100 flex justify-end gap-2">
          <Btn variant="secondary" onClick={() => { setEditModal(false); setEditForm({ ...EMPTY_FORM }); setEditMemberInput(""); }}>Cancel</Btn>
          <Btn variant="primary" onClick={() => editingId && updateCommitteeMut.mutate({ id: editingId, data: editForm })}>
            {updateCommitteeMut.isPending ? "Saving…" : "✓ Save Changes"}
          </Btn>
        </div>
      </Modal>

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
              options={COMMITTEE_TYPES}
              value={form.type}
              onChange={(e) => setForm((p) => ({ ...p, type: e.target.value.toLowerCase() }))}
            />
          </FormField>
          <FormField label="Chairperson">
            {boardMemberNames.length > 0 ? (
              <FSelect
                options={[NO_CHAIR, ...boardMemberNames]}
                value={form.chairperson || NO_CHAIR}
                onChange={(e) => setForm((p) => ({ ...p, chairperson: e.target.value === NO_CHAIR ? "" : e.target.value }))}
              />
            ) : (
              <FInput value={form.chairperson} onChange={(e) => setForm((p) => ({ ...p, chairperson: e.target.value }))} placeholder="Full name" />
            )}
          </FormField>
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
          <div className="col-span-2">
            <FormField label="Members">
              {boardMemberNames.length > 0 ? (
                <select
                  multiple
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C] bg-white h-32"
                  value={form.members}
                  onChange={(e) => setForm((p) => ({ ...p, members: Array.from(e.target.selectedOptions, (o) => o.value) }))}
                >
                  {boardMemberNames.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              ) : (
                <div className="border border-slate-200 rounded-lg p-3">
                  <div className="flex gap-2 mb-2">
                    <FInput
                      placeholder="Add member name…"
                      value={memberInput}
                      onChange={(e) => setMemberInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addMember(); } }}
                    />
                    <Btn variant="secondary" size="sm" onClick={addMember}>＋ Add</Btn>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {form.members.map((m) => (
                      <span key={m} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-[#0C447C] text-xs rounded-full">
                        {m}
                        <button
                          className="text-blue-400 hover:text-blue-700 ml-0.5"
                          onClick={() => setForm((p) => ({ ...p, members: p.members.filter((x) => x !== m) }))}
                        >×</button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </FormField>
          </div>
        </div>
        <div className="p-5 border-t border-slate-100 flex justify-end gap-2">
          <Btn variant="secondary" onClick={closeModal}>Cancel</Btn>
          <Btn variant="primary" onClick={handleSave}>
            {createCommittee.isPending ? "Creating…" : "✓ Create Committee"}
          </Btn>
        </div>
      </Modal>

      {/* ── View Committee Drawer ──────────────────────────────────── */}
      <Drawer open={!!viewDrawer} onClose={() => setViewDrawer(null)} title="Committee Details">
        {viewDrawer && (
          <div className="p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-slate-900">{viewDrawer.name}</h3>
                <p className="text-sm text-slate-500 capitalize">{viewDrawer.type}</p>
              </div>
              <Badge status={viewDrawer.status === "active" ? "Active" : "Inactive"} />
            </div>
            {([
              ["Chairperson", viewDrawer.chairperson || "—"],
              ["Purpose", viewDrawer.purpose || "—"],
              ["Meeting Frequency", viewDrawer.meetingFrequency || "—"],
            ] as [string, string][]).map(([k, v]) => (
              <div key={k} className="flex justify-between py-2.5 border-b border-slate-50 text-sm gap-4">
                <span className="text-slate-500 flex-shrink-0">{k}</span>
                <span className="font-medium text-slate-800 text-right">{v}</span>
              </div>
            ))}
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Members ({viewDrawer.members?.length ?? 0})</span>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {(viewDrawer.members ?? []).map((m: string) => (
                  <span key={m} className="inline-flex items-center px-2 py-1 bg-blue-50 text-[#0C447C] text-xs rounded-full">{m}</span>
                ))}
                {(!viewDrawer.members || viewDrawer.members.length === 0) && <span className="text-xs text-slate-400">No members added</span>}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* ── Schedule Meeting Modal ─────────────────────────────────── */}
      <Modal open={!!scheduleModal} onClose={() => setScheduleModal(null)} title={`Schedule Meeting — ${scheduleModal?.name ?? ""}`} size="sm">
        <div className="p-5 space-y-4">
          <FormField label="Date" required>
            <FInput type="date" value={scheduleForm.scheduledDate} onChange={(e) => setScheduleForm((p) => ({ ...p, scheduledDate: e.target.value }))} />
          </FormField>
          <FormField label="Time">
            <FInput type="time" value={scheduleForm.scheduledTime} onChange={(e) => setScheduleForm((p) => ({ ...p, scheduledTime: e.target.value }))} />
          </FormField>
          <FormField label="Venue">
            <FInput value={scheduleForm.venue} onChange={(e) => setScheduleForm((p) => ({ ...p, venue: e.target.value }))} placeholder="e.g. Board Room" />
          </FormField>
          <FormField label="Agenda">
            <textarea
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C] resize-none"
              rows={2}
              value={scheduleForm.agenda}
              onChange={(e) => setScheduleForm((p) => ({ ...p, agenda: e.target.value }))}
            />
          </FormField>
        </div>
        <div className="p-5 border-t border-slate-100 flex justify-end gap-2">
          <Btn variant="secondary" onClick={() => setScheduleModal(null)}>Cancel</Btn>
          <Btn variant="primary" onClick={() => {
            if (!scheduleForm.scheduledDate) { toast.error("Date is required"); return; }
            const scheduledAt = scheduleForm.scheduledTime
              ? `${scheduleForm.scheduledDate}T${scheduleForm.scheduledTime}:00`
              : `${scheduleForm.scheduledDate}T09:00:00`;
            scheduleMeeting.mutate({
              title: `${scheduleModal?.name} Meeting`,
              type: "committee",
              scheduledAt,
              venue: scheduleForm.venue,
              agenda: scheduleForm.agenda,
            });
          }}>
            {scheduleMeeting.isPending ? "Scheduling…" : "✓ Schedule"}
          </Btn>
        </div>
      </Modal>
    </div>
  );
}
