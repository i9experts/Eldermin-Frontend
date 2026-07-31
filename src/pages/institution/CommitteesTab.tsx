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

const EMPTY_FORM = { name: "", type: "academic", purpose: "", chairperson: "", meetingFrequency: "", members: [] as { name: string; phone?: string; email?: string }[] };
const NO_CHAIR = "-- Select Chairperson --";

const EMPTY_SCHEDULE_FORM = {
  title: "", category: "regular",
  scheduledDate: "", scheduledTime: "", durationMinutes: 60,
  mode: "in_person", venue: "", meetingLink: "",
  chairperson: "", minuteTaker: "",
  attendees: [] as string[],
  agenda: "",
  agendaItems: [] as { order: number; topic: string; description: string; presenter: string; durationMinutes: number; itemType: string }[],
};
const AGENDA_ITEM_TYPES = [
  { value: "discussion", label: "Discussion", color: "bg-blue-50 text-blue-700" },
  { value: "decision", label: "Decision", color: "bg-red-50 text-red-700" },
  { value: "information", label: "Information", color: "bg-slate-100 text-slate-600" },
  { value: "update", label: "Update", color: "bg-emerald-50 text-emerald-700" },
];

export default function CommitteesTab({ initialModal = false }: { initialModal?: boolean }) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [modal, setModal] = useState(initialModal);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editModal, setEditModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ ...EMPTY_FORM });
  const [memberInput, setMemberInput] = useState({ name: "", phone: "", email: "" });
  const [editMemberInput, setEditMemberInput] = useState({ name: "", phone: "", email: "" });
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

  const { data: meetings = [] } = useQuery({
    queryKey: ["meetings"],
    queryFn: () => organizationService.getMeetings(),
  });

  const notifyMeeting = useMutation({
    mutationFn: organizationService.notifyMeeting,
    onSuccess: (res: any) => {
      const parts = [`${res.emailsSent} email${res.emailsSent === 1 ? "" : "s"} sent`];
      if (res.emailFailures?.length) parts.push(`${res.emailFailures.length} failed`);
      toast.success(parts.join(", "));
      if (res.whatsapp?.reason) toast(res.whatsapp.reason, { icon: "💬", duration: 6000 });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to send notifications"),
  });

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
    setMemberInput({ name: "", phone: "", email: "" });
  }

  function addMember() {
    const name = memberInput.name.trim();
    if (name && !form.members.some((m) => m.name === name)) {
      setForm((p) => ({ ...p, members: [...p.members, { name, phone: memberInput.phone.trim() || undefined, email: memberInput.email.trim() || undefined }] }));
    }
    setMemberInput({ name: "", phone: "", email: "" });
  }

  function addEditMember() {
    const name = editMemberInput.name.trim();
    if (name && !editForm.members.some((m) => m.name === name)) {
      setEditForm((p) => ({ ...p, members: [...p.members, { name, phone: editMemberInput.phone.trim() || undefined, email: editMemberInput.email.trim() || undefined }] }));
    }
    setEditMemberInput({ name: "", phone: "", email: "" });
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
                    chairperson: c.chairperson || "", meetingFrequency: c.meetingFrequency || "",
                    members: c.members || [],
                  });
                  setEditModal(true);
                }}
                className="flex-1 text-xs py-1.5 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 font-medium"
              >Edit</button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setScheduleModal(c);
                  setScheduleForm({
                    ...EMPTY_SCHEDULE_FORM,
                    title: `${c.name} Meeting`,
                    chairperson: c.chairperson || "",
                    attendees: (c.members || []).map((m: any) => m.name),
                  });
                }}
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
          <FormField label="Meeting Frequency">
            <FSelect
              options={["", "Weekly", "Bi-weekly", "Monthly", "Quarterly", "Bi-annually", "Annually", "As needed"]}
              value={editForm.meetingFrequency}
              onChange={(e) => setEditForm((prev) => ({ ...prev, meetingFrequency: e.target.value }))}
            />
          </FormField>
          <div className="col-span-2">
            <FormField label="Members">
              <div className="border border-slate-200 rounded-lg p-3">
                {boardMembers.length > 0 && (
                  <FSelect
                    options={["Quick-fill from board members…", ...boardMembers.map((bm: any) => `${bm.firstName} ${bm.lastName}`)]}
                    onChange={(e) => {
                      const bm = boardMembers.find((x: any) => `${x.firstName} ${x.lastName}` === e.target.value);
                      if (bm) setEditMemberInput({ name: `${bm.firstName} ${bm.lastName}`, phone: bm.phone || "", email: bm.email || "" });
                    }}
                  />
                )}
                <div className="grid grid-cols-3 gap-2 mt-2 mb-2">
                  <FInput placeholder="Name" value={editMemberInput.name} onChange={(e) => setEditMemberInput((p) => ({ ...p, name: e.target.value }))} />
                  <FInput placeholder="Phone / WhatsApp" value={editMemberInput.phone} onChange={(e) => setEditMemberInput((p) => ({ ...p, phone: e.target.value }))} />
                  <FInput placeholder="Email" value={editMemberInput.email} onChange={(e) => setEditMemberInput((p) => ({ ...p, email: e.target.value }))} />
                </div>
                <Btn variant="secondary" size="sm" onClick={addEditMember}>＋ Add Member</Btn>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {editForm.members.map((m) => (
                    <span key={m.name} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-[#0C447C] text-xs rounded-full">
                      {m.name}{m.phone ? ` · ${m.phone}` : ""}{m.email ? ` · ${m.email}` : ""}
                      <button
                        className="text-blue-400 hover:text-blue-700 ml-0.5"
                        onClick={() => setEditForm((p) => ({ ...p, members: p.members.filter((x) => x.name !== m.name) }))}
                      >×</button>
                    </span>
                  ))}
                </div>
              </div>
            </FormField>
          </div>
        </div>
        <div className="p-5 border-t border-slate-100 flex justify-end gap-2">
          <Btn variant="secondary" onClick={() => { setEditModal(false); setEditForm({ ...EMPTY_FORM }); setEditMemberInput({ name: "", phone: "", email: "" }); }}>Cancel</Btn>
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
          <FormField label="Meeting Frequency">
            <FSelect
              options={["", "Weekly", "Bi-weekly", "Monthly", "Quarterly", "Bi-annually", "Annually", "As needed"]}
              value={form.meetingFrequency}
              onChange={(e) => setForm((p) => ({ ...p, meetingFrequency: e.target.value }))}
            />
          </FormField>
          <div className="col-span-2">
            <FormField label="Members">
              <div className="border border-slate-200 rounded-lg p-3">
                {boardMembers.length > 0 && (
                  <FSelect
                    options={["Quick-fill from board members…", ...boardMembers.map((bm: any) => `${bm.firstName} ${bm.lastName}`)]}
                    onChange={(e) => {
                      const bm = boardMembers.find((x: any) => `${x.firstName} ${x.lastName}` === e.target.value);
                      if (bm) setMemberInput({ name: `${bm.firstName} ${bm.lastName}`, phone: bm.phone || "", email: bm.email || "" });
                    }}
                  />
                )}
                <div className="grid grid-cols-3 gap-2 mt-2 mb-2">
                  <FInput placeholder="Name" value={memberInput.name} onChange={(e) => setMemberInput((p) => ({ ...p, name: e.target.value }))} />
                  <FInput placeholder="Phone / WhatsApp" value={memberInput.phone} onChange={(e) => setMemberInput((p) => ({ ...p, phone: e.target.value }))} />
                  <FInput placeholder="Email" value={memberInput.email} onChange={(e) => setMemberInput((p) => ({ ...p, email: e.target.value }))} />
                </div>
                <Btn variant="secondary" size="sm" onClick={addMember}>＋ Add Member</Btn>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {form.members.map((m) => (
                    <span key={m.name} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-[#0C447C] text-xs rounded-full">
                      {m.name}{m.phone ? ` · ${m.phone}` : ""}{m.email ? ` · ${m.email}` : ""}
                      <button
                        className="text-blue-400 hover:text-blue-700 ml-0.5"
                        onClick={() => setForm((p) => ({ ...p, members: p.members.filter((x) => x.name !== m.name) }))}
                      >×</button>
                    </span>
                  ))}
                </div>
              </div>
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
                {(viewDrawer.members ?? []).map((m: any) => (
                  <span key={m.name} className="inline-flex items-center px-2 py-1 bg-blue-50 text-[#0C447C] text-xs rounded-full">
                    {m.name}{m.phone ? ` · ${m.phone}` : ""}{m.email ? ` · ${m.email}` : ""}
                  </span>
                ))}
                {(!viewDrawer.members || viewDrawer.members.length === 0) && <span className="text-xs text-slate-400">No members added</span>}
              </div>
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Scheduled Meetings</span>
              <div className="space-y-2 mt-2">
                {(meetings as any[]).filter((mt: any) => mt.committeeId === viewDrawer._id).map((mt: any) => (
                  <div key={mt._id} className="border border-slate-100 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{mt.title}</p>
                        <p className="text-xs text-slate-400">{new Date(mt.scheduledAt).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })}{mt.venue ? ` · ${mt.venue}` : ""}</p>
                      </div>
                      <Badge status={mt.status === "scheduled" ? "Active" : "Inactive"} small />
                    </div>
                    <button
                      onClick={() => notifyMeeting.mutate(mt._id)}
                      disabled={notifyMeeting.isPending}
                      className="w-full text-xs py-1.5 mt-2 bg-blue-50 text-[#0C447C] rounded-lg hover:bg-blue-100 font-medium disabled:opacity-50"
                    >📧 Notify Members (Email + WhatsApp)</button>
                  </div>
                ))}
                {(meetings as any[]).filter((mt: any) => mt.committeeId === viewDrawer._id).length === 0 && (
                  <span className="text-xs text-slate-400">No meetings scheduled yet</span>
                )}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* ── Schedule Meeting Modal ─────────────────────────────────── */}
      <Modal open={!!scheduleModal} onClose={() => setScheduleModal(null)} title={`Schedule Meeting — ${scheduleModal?.name ?? ""}`} size="lg">
        <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Meeting Title" required>
              <FInput value={scheduleForm.title} onChange={(e) => setScheduleForm((p) => ({ ...p, title: e.target.value }))} />
            </FormField>
            <FormField label="Category">
              <FSelect
                options={["Regular", "Emergency", "Special", "Agm"]}
                value={scheduleForm.category[0].toUpperCase() + scheduleForm.category.slice(1)}
                onChange={(e) => setScheduleForm((p) => ({ ...p, category: e.target.value.toLowerCase() }))}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <FormField label="Date" required>
              <FInput type="date" value={scheduleForm.scheduledDate} onChange={(e) => setScheduleForm((p) => ({ ...p, scheduledDate: e.target.value }))} />
            </FormField>
            <FormField label="Time">
              <FInput type="time" value={scheduleForm.scheduledTime} onChange={(e) => setScheduleForm((p) => ({ ...p, scheduledTime: e.target.value }))} />
            </FormField>
            <FormField label="Duration (mins)">
              <FInput type="number" value={scheduleForm.durationMinutes} onChange={(e) => setScheduleForm((p) => ({ ...p, durationMinutes: Number(e.target.value) }))} />
            </FormField>
          </div>

          <FormField label="Meeting Mode">
            <div className="flex gap-2">
              {(["in_person", "virtual", "hybrid"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setScheduleForm((p) => ({ ...p, mode }))}
                  className={`flex-1 py-2 rounded-lg border text-xs font-medium capitalize transition-all ${
                    scheduleForm.mode === mode ? "bg-blue-50 text-[#0C447C] border-[#0C447C]" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                  }`}
                >{mode.replace("_", "-")}</button>
              ))}
            </div>
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            {scheduleForm.mode !== "virtual" && (
              <FormField label="Venue">
                <FInput value={scheduleForm.venue} onChange={(e) => setScheduleForm((p) => ({ ...p, venue: e.target.value }))} placeholder="e.g. Board Room" />
              </FormField>
            )}
            {scheduleForm.mode !== "in_person" && (
              <FormField label="Meeting Link">
                <FInput value={scheduleForm.meetingLink} onChange={(e) => setScheduleForm((p) => ({ ...p, meetingLink: e.target.value }))} placeholder="Zoom / Google Meet / Teams link" />
              </FormField>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Chairperson">
              <FInput value={scheduleForm.chairperson} onChange={(e) => setScheduleForm((p) => ({ ...p, chairperson: e.target.value }))} placeholder="Full name" />
            </FormField>
            <FormField label="Minute Taker">
              <FInput value={scheduleForm.minuteTaker} onChange={(e) => setScheduleForm((p) => ({ ...p, minuteTaker: e.target.value }))} placeholder="Full name" />
            </FormField>
          </div>

          <FormField label={`Attendees (${scheduleForm.attendees.length} of ${(scheduleModal?.members || []).length})`}>
            <div className="border border-slate-200 rounded-lg p-3 flex flex-wrap gap-2">
              {(scheduleModal?.members || []).length === 0 && <span className="text-xs text-slate-400">No committee members added yet</span>}
              {(scheduleModal?.members || []).map((m: any) => (
                <label key={m.name} className="flex items-center gap-1.5 text-xs bg-slate-50 border border-slate-200 rounded-full px-2.5 py-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={scheduleForm.attendees.includes(m.name)}
                    onChange={() => setScheduleForm((p) => ({
                      ...p,
                      attendees: p.attendees.includes(m.name) ? p.attendees.filter((x) => x !== m.name) : [...p.attendees, m.name],
                    }))}
                    className="accent-[#0C447C]"
                  />
                  {m.name}
                </label>
              ))}
            </div>
          </FormField>

          {/* ── Agenda Items ─────────────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Agenda</span>
              <span className="text-[11px] text-slate-400">
                {scheduleForm.agendaItems.length} item{scheduleForm.agendaItems.length !== 1 ? "s" : ""}
                {scheduleForm.agendaItems.some((i) => i.durationMinutes) && ` · ${scheduleForm.agendaItems.reduce((s, i) => s + (i.durationMinutes || 0), 0)} min planned`}
              </span>
            </div>
            <div className="space-y-2">
              {scheduleForm.agendaItems.map((item, i) => (
                <div key={i} className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-bold text-slate-400 mt-2 w-4">{i + 1}.</span>
                    <div className="flex-1 space-y-2">
                      <div className="grid grid-cols-[1fr,auto] gap-2">
                        <FInput
                          placeholder="Agenda topic…"
                          value={item.topic}
                          onChange={(e) => setScheduleForm((p) => ({ ...p, agendaItems: p.agendaItems.map((x, j) => j === i ? { ...x, topic: e.target.value } : x) }))}
                        />
                        <div className="flex gap-1">
                          <button onClick={() => setScheduleForm((p) => ({ ...p, agendaItems: p.agendaItems.map((x, j) => j === i - 1 ? p.agendaItems[i] : j === i ? p.agendaItems[i - 1] : x).map((x, j) => ({ ...x, order: j })) }))}
                            disabled={i === 0} className="px-2 text-slate-400 hover:text-slate-700 disabled:opacity-30">↑</button>
                          <button onClick={() => setScheduleForm((p) => ({ ...p, agendaItems: p.agendaItems.map((x, j) => j === i + 1 ? p.agendaItems[i] : j === i ? p.agendaItems[i + 1] : x).map((x, j) => ({ ...x, order: j })) }))}
                            disabled={i === scheduleForm.agendaItems.length - 1} className="px-2 text-slate-400 hover:text-slate-700 disabled:opacity-30">↓</button>
                          <button onClick={() => setScheduleForm((p) => ({ ...p, agendaItems: p.agendaItems.filter((_, j) => j !== i).map((x, j) => ({ ...x, order: j })) }))}
                            className="px-2 text-red-400 hover:text-red-600">✕</button>
                        </div>
                      </div>
                      <textarea
                        className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C] resize-none"
                        rows={1}
                        placeholder="Details (optional)…"
                        value={item.description}
                        onChange={(e) => setScheduleForm((p) => ({ ...p, agendaItems: p.agendaItems.map((x, j) => j === i ? { ...x, description: e.target.value } : x) }))}
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <FInput
                          placeholder="Presenter"
                          value={item.presenter}
                          onChange={(e) => setScheduleForm((p) => ({ ...p, agendaItems: p.agendaItems.map((x, j) => j === i ? { ...x, presenter: e.target.value } : x) }))}
                        />
                        <FInput
                          type="number"
                          placeholder="Minutes"
                          value={item.durationMinutes || ""}
                          onChange={(e) => setScheduleForm((p) => ({ ...p, agendaItems: p.agendaItems.map((x, j) => j === i ? { ...x, durationMinutes: Number(e.target.value) } : x) }))}
                        />
                        <FSelect
                          options={AGENDA_ITEM_TYPES.map((t) => t.label)}
                          value={AGENDA_ITEM_TYPES.find((t) => t.value === item.itemType)?.label || "Discussion"}
                          onChange={(e) => setScheduleForm((p) => ({ ...p, agendaItems: p.agendaItems.map((x, j) => j === i ? { ...x, itemType: AGENDA_ITEM_TYPES.find((t) => t.label === e.target.value)?.value || "discussion" } : x) }))}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {scheduleForm.agendaItems.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-3 border border-dashed border-slate-200 rounded-lg">No agenda items yet — add at least one below</p>
              )}
            </div>
            <Btn
              variant="secondary" size="sm"
              onClick={() => setScheduleForm((p) => ({
                ...p,
                agendaItems: [...p.agendaItems, { order: p.agendaItems.length, topic: "", description: "", presenter: "", durationMinutes: 10, itemType: "discussion" }],
              }))}
              className="mt-2"
            >＋ Add Agenda Item</Btn>
          </div>

          <FormField label="Additional Notes (optional)">
            <textarea
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C] resize-none"
              rows={2}
              placeholder="Anything else attendees should know…"
              value={scheduleForm.agenda}
              onChange={(e) => setScheduleForm((p) => ({ ...p, agenda: e.target.value }))}
            />
          </FormField>
        </div>
        <div className="p-5 border-t border-slate-100 flex justify-end gap-2">
          <Btn variant="secondary" onClick={() => setScheduleModal(null)}>Cancel</Btn>
          <Btn variant="primary" onClick={() => {
            if (!scheduleForm.scheduledDate) { toast.error("Date is required"); return; }
            if (!scheduleForm.title.trim()) { toast.error("Meeting title is required"); return; }
            const scheduledAt = scheduleForm.scheduledTime
              ? `${scheduleForm.scheduledDate}T${scheduleForm.scheduledTime}:00`
              : `${scheduleForm.scheduledDate}T09:00:00`;
            scheduleMeeting.mutate({
              title: scheduleForm.title,
              committeeId: scheduleModal?._id,
              type: "committee",
              category: scheduleForm.category,
              scheduledAt,
              durationMinutes: scheduleForm.durationMinutes,
              mode: scheduleForm.mode,
              venue: scheduleForm.venue || undefined,
              meetingLink: scheduleForm.meetingLink || undefined,
              chairperson: scheduleForm.chairperson || undefined,
              minuteTaker: scheduleForm.minuteTaker || undefined,
              attendees: scheduleForm.attendees,
              agenda: scheduleForm.agenda || undefined,
              agendaItems: scheduleForm.agendaItems.filter((i) => i.topic.trim()),
            });
          }}>
            {scheduleMeeting.isPending ? "Scheduling…" : "✓ Schedule"}
          </Btn>
        </div>
      </Modal>
    </div>
  );
}
