import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  AvatarBubble, Badge, Btn, Card, Drawer, FInput, FSelect, FormField, Modal, PageHeader,
} from "./shared";
import organizationService from "../../services/organization.service";

const EMPTY_FORM = { firstName: "", lastName: "", email: "", phone: "", boardRole: "member", designation: "", tenure: "", appointedDate: "", notes: "" };

const ROLE_LABELS: Record<string, string> = {
  chair: "Chair", "vice-chair": "Vice Chair",
  secretary: "Secretary", treasurer: "Treasurer", member: "Member",
};

const BOARD_ROLES = ["chair", "vice-chair", "secretary", "treasurer", "member"];

export default function BoardTab() {
  const [drawer, setDrawer] = useState<any | null>(null);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editModal, setEditModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ ...EMPTY_FORM });

  const queryClient = useQueryClient();

  const { data: boardMembers = [], isLoading } = useQuery({
    queryKey: ["board-members"],
    queryFn: organizationService.getBoardMembers,
  });

  const updateMember = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof EMPTY_FORM }) =>
      organizationService.updateBoardMember(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board-members"] });
      toast.success("Board member updated");
      setEditModal(false);
      setEditingId(null);
      setEditForm({ ...EMPTY_FORM });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed"),
  });

  const addMember = useMutation({
    mutationFn: organizationService.createBoardMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board-members"] });
      toast.success("Board member added");
      setModal(false);
      setForm({ ...EMPTY_FORM });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed"),
  });

  function setField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSave() {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast.error("First name and last name are required");
      return;
    }
    addMember.mutate({ ...form });
  }

  function closeModal() {
    setModal(false);
    setForm({ ...EMPTY_FORM });
  }

  const members = boardMembers as any[];
  const activeCount = members.filter((m) => m.status === "active").length;

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
        breadcrumbs={["Home", "Institution Setup", "Board of Directors"]}
        title="Board of Directors"
        subtitle={`${members.length} members — ${activeCount} active`}
        actions={
          <div className="flex gap-2">
            <Btn variant="secondary" size="sm">📊 Attendance Report</Btn>
            <Btn variant="primary" size="sm" onClick={() => setModal(true)}>＋ Add Member</Btn>
          </div>
        }
      />

      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
        {members.map((m: any) => (
          <Card key={m._id} className="p-5 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setDrawer(m)}>
            <div className="flex items-start gap-3 mb-3">
              <AvatarBubble name={`${m.firstName} ${m.lastName}`} size="lg" />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-1">
                  <div>
                    <div className="text-sm font-bold text-slate-900 leading-tight">{m.firstName} {m.lastName}</div>
                    <div className="text-xs text-slate-500">{ROLE_LABELS[m.boardRole] ?? m.boardRole}</div>
                  </div>
                  <Badge status={m.status === "active" ? "Active" : "Inactive"} small />
                </div>
              </div>
            </div>
            <div className="space-y-1.5 text-xs border-t border-slate-100 pt-3">
              <div className="flex justify-between"><span className="text-slate-400">Role</span><span className="text-slate-700 font-medium">{ROLE_LABELS[m.boardRole] ?? m.boardRole}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Appointed</span><span className="text-slate-700 font-medium">{m.appointedDate ? new Date(m.appointedDate).toLocaleDateString() : "—"}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Designation</span><span className="text-slate-700 font-medium truncate max-w-[120px]">{m.designation || "—"}</span></div>
            </div>
          </Card>
        ))}
        {members.length === 0 && (
          <div className="col-span-full py-16 text-center text-sm text-slate-400">
            No board members yet. Click ＋ Add Member to get started.
          </div>
        )}
      </div>

      {/* ── Member Profile Drawer ─────────────────────────────────────── */}
      <Drawer open={!!drawer} onClose={() => setDrawer(null)} title="Board Member Profile">
        {drawer && (
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
              <AvatarBubble name={`${drawer.firstName} ${drawer.lastName}`} size="lg" />
              <div>
                <h3 className="font-bold text-slate-900">{drawer.firstName} {drawer.lastName}</h3>
                <p className="text-sm text-slate-500">{ROLE_LABELS[drawer.boardRole] ?? drawer.boardRole}</p>
                <Badge status={drawer.status === "active" ? "Active" : "Inactive"} />
              </div>
            </div>
            {([
              ["Role",        ROLE_LABELS[drawer.boardRole] ?? drawer.boardRole],
              ["Email",       drawer.email || "—"],
              ["Phone",       drawer.phone || "—"],
              ["Designation", drawer.designation || "—"],
              ["Tenure",      drawer.tenure || "—"],
              ["Appointed",   drawer.appointedDate ? new Date(drawer.appointedDate).toLocaleDateString() : "—"],
              ["Notes",       drawer.notes || "—"],
            ] as [string, string][]).map(([k, v]) => (
              <div key={k} className="flex justify-between py-2.5 border-b border-slate-50 text-sm">
                <span className="text-slate-500">{k}</span>
                <span className="font-medium text-slate-800">{v}</span>
              </div>
            ))}
            <div className="pt-2 space-y-2">
              <Btn variant="primary" className="w-full justify-center" onClick={() => {
                setEditingId(drawer._id);
                setEditForm({
                  firstName: drawer.firstName || "",
                  lastName: drawer.lastName || "",
                  email: drawer.email || "",
                  phone: drawer.phone || "",
                  boardRole: drawer.boardRole || "member",
                  designation: drawer.designation || "",
                  tenure: drawer.tenure || "",
                  appointedDate: drawer.appointedDate ? new Date(drawer.appointedDate).toISOString().slice(0, 10) : "",
                  notes: drawer.notes || "",
                });
                setEditModal(true);
              }}>✏️ Edit Member</Btn>
              <Btn variant="secondary" className="w-full justify-center">📅 Meeting History</Btn>
              <Btn variant="secondary" className="w-full justify-center">🔄 Renew Term</Btn>
            </div>
          </div>
        )}
      </Drawer>

      {/* ── Edit Member Modal ─────────────────────────────────────────── */}
      <Modal open={editModal} onClose={() => { setEditModal(false); setEditForm({ ...EMPTY_FORM }); }} title="Edit Board Member" size="md">
        <div className="p-5 grid grid-cols-2 gap-4">
          <FormField label="First Name" required>
            <FInput value={editForm.firstName} onChange={(e) => setEditForm((prev) => ({ ...prev, firstName: e.target.value }))} placeholder="e.g. Yusuf" />
          </FormField>
          <FormField label="Last Name" required>
            <FInput value={editForm.lastName} onChange={(e) => setEditForm((prev) => ({ ...prev, lastName: e.target.value }))} placeholder="e.g. Al-Rashid" />
          </FormField>
          <FormField label="Email">
            <FInput type="email" value={editForm.email} onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))} placeholder="member@board.org" />
          </FormField>
          <FormField label="Phone">
            <FInput value={editForm.phone} onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))} placeholder="+92 300 0000000" />
          </FormField>
          <FormField label="Board Role">
            <FSelect
              options={BOARD_ROLES}
              value={editForm.boardRole}
              onChange={(e) => setEditForm((prev) => ({ ...prev, boardRole: e.target.value }))}
            />
          </FormField>
          <FormField label="Designation">
            <FInput value={editForm.designation} onChange={(e) => setEditForm((prev) => ({ ...prev, designation: e.target.value }))} placeholder="e.g. Finance Expert" />
          </FormField>
          <FormField label="Tenure">
            <FInput value={editForm.tenure} onChange={(e) => setEditForm((prev) => ({ ...prev, tenure: e.target.value }))} placeholder="e.g. 3 years" />
          </FormField>
          <FormField label="Appointed Date">
            <FInput type="date" value={editForm.appointedDate} onChange={(e) => setEditForm((prev) => ({ ...prev, appointedDate: e.target.value }))} />
          </FormField>
          <div className="col-span-2">
            <FormField label="Notes">
              <FInput value={editForm.notes} onChange={(e) => setEditForm((prev) => ({ ...prev, notes: e.target.value }))} placeholder="Additional notes" />
            </FormField>
          </div>
        </div>
        <div className="p-5 border-t border-slate-100 flex justify-end gap-2">
          <Btn variant="secondary" onClick={() => { setEditModal(false); setEditForm({ ...EMPTY_FORM }); }}>Cancel</Btn>
          <Btn variant="primary" onClick={() => editingId && updateMember.mutate({ id: editingId, data: editForm })}>
            {updateMember.isPending ? "Saving…" : "✓ Save Changes"}
          </Btn>
        </div>
      </Modal>

      {/* ── Add Member Modal ──────────────────────────────────────────── */}
      <Modal open={modal} onClose={closeModal} title="Add Board Member" size="md">
        <div className="p-5 grid grid-cols-2 gap-4">
          <FormField label="First Name" required>
            <FInput value={form.firstName} onChange={(e) => setField("firstName", e.target.value)} placeholder="e.g. Yusuf" />
          </FormField>
          <FormField label="Last Name" required>
            <FInput value={form.lastName} onChange={(e) => setField("lastName", e.target.value)} placeholder="e.g. Al-Rashid" />
          </FormField>
          <FormField label="Email">
            <FInput type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} placeholder="member@board.org" />
          </FormField>
          <FormField label="Phone">
            <FInput value={form.phone} onChange={(e) => setField("phone", e.target.value)} placeholder="+92 300 0000000" />
          </FormField>
          <FormField label="Board Role">
            <FSelect
              options={BOARD_ROLES}
              value={form.boardRole}
              onChange={(e) => setField("boardRole", e.target.value)}
            />
          </FormField>
          <FormField label="Designation">
            <FInput value={form.designation} onChange={(e) => setField("designation", e.target.value)} placeholder="e.g. Finance Expert" />
          </FormField>
          <div className="col-span-2">
            <FormField label="Notes">
              <FInput value={form.notes} onChange={(e) => setField("notes", e.target.value)} placeholder="Additional notes" />
            </FormField>
          </div>
        </div>
        <div className="p-5 border-t border-slate-100 flex justify-end gap-2">
          <Btn variant="secondary" onClick={closeModal}>Cancel</Btn>
          <Btn variant="primary" onClick={handleSave}>
            {addMember.isPending ? "Saving…" : "＋ Add Member"}
          </Btn>
        </div>
      </Modal>
    </div>
  );
}
