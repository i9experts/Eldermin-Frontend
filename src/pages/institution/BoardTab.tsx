import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  AvatarBubble, Badge, Btn, Card, Drawer, FInput, FSelect, FormField, Modal, PageHeader,
} from "./shared";
import organizationService from "../../services/organization.service";

const EMPTY_FORM = {
  firstName: "", lastName: "", email: "", phone: "", biography: "", gender: "",
  boardRole: "member", directorType: "non_executive", designation: "",
  appointedDate: "", termStartDate: "", termEndDate: "", termNumber: 1,
  expertiseAreas: [] as string[],
  conflictOfInterestDeclared: false, conflictOfInterestDetails: "", conflictOfInterestDate: "",
  codeOfConductSigned: false, orientationCompleted: false,
  isVoluntary: true, annualRemuneration: "",
  notes: "",
};

const ROLE_LABELS: Record<string, string> = {
  chair: "Chair", "vice-chair": "Vice Chair",
  secretary: "Secretary", treasurer: "Treasurer", member: "Member",
};
const BOARD_ROLES = ["chair", "vice-chair", "secretary", "treasurer", "member"];

const DIRECTOR_TYPE_LABELS: Record<string, string> = {
  independent: "Independent Director", non_executive: "Non-Executive Director", executive: "Executive Director",
};
const DIRECTOR_TYPE_BADGE: Record<string, string> = {
  independent: "bg-emerald-50 text-emerald-700", non_executive: "bg-blue-50 text-blue-700", executive: "bg-amber-50 text-amber-700",
};

const EXPERTISE_OPTIONS = [
  "Finance", "Legal", "Education", "Fundraising", "HR", "Marketing", "Audit", "IT/Technology", "Healthcare", "Real Estate", "Islamic Studies", "Strategy",
];

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

  const { data: composition } = useQuery({
    queryKey: ["board-composition"],
    queryFn: organizationService.getBoardComposition,
  });

  const { data: meetings = [] } = useQuery({
    queryKey: ["meetings"],
    queryFn: () => organizationService.getMeetings(),
  });

  const updateMember = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      organizationService.updateBoardMember(id, { ...data, annualRemuneration: data.annualRemuneration ? Number(data.annualRemuneration) : undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board-members"] });
      queryClient.invalidateQueries({ queryKey: ["board-composition"] });
      toast.success("Board member updated");
      setEditModal(false);
      setEditingId(null);
      setEditForm({ ...EMPTY_FORM });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed"),
  });

  const addMember = useMutation({
    mutationFn: (data: any) => organizationService.createBoardMember({ ...data, annualRemuneration: data.annualRemuneration ? Number(data.annualRemuneration) : undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board-members"] });
      queryClient.invalidateQueries({ queryKey: ["board-composition"] });
      toast.success("Board member added");
      setModal(false);
      setForm({ ...EMPTY_FORM });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed"),
  });

  function setField(field: string, value: any) {
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

  function openEdit(m: any) {
    setEditingId(m._id);
    setEditForm({
      firstName: m.firstName || "", lastName: m.lastName || "",
      email: m.email || "", phone: m.phone || "", biography: m.biography || "", gender: m.gender || "",
      boardRole: m.boardRole || "member", directorType: m.directorType || "non_executive", designation: m.designation || "",
      appointedDate: m.appointedDate ? new Date(m.appointedDate).toISOString().slice(0, 10) : "",
      termStartDate: m.termStartDate ? new Date(m.termStartDate).toISOString().slice(0, 10) : "",
      termEndDate: m.termEndDate ? new Date(m.termEndDate).toISOString().slice(0, 10) : "",
      termNumber: m.termNumber || 1,
      expertiseAreas: m.expertiseAreas || [],
      conflictOfInterestDeclared: !!m.conflictOfInterestDeclared,
      conflictOfInterestDetails: m.conflictOfInterestDetails || "",
      conflictOfInterestDate: m.conflictOfInterestDate ? new Date(m.conflictOfInterestDate).toISOString().slice(0, 10) : "",
      codeOfConductSigned: !!m.codeOfConductSigned,
      orientationCompleted: !!m.orientationCompleted,
      isVoluntary: m.isVoluntary !== false,
      annualRemuneration: m.annualRemuneration || "",
      notes: m.notes || "",
    });
    setEditModal(true);
  }

  const members = boardMembers as any[];
  const activeCount = members.filter((m) => m.status === "active").length;
  const memberMeetingHistory = (memberName: string) =>
    (meetings as any[]).filter((mt: any) => (mt.attendees || []).includes(memberName) || mt.chairperson === memberName);

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
            <Btn variant="primary" size="sm" onClick={() => setModal(true)}>＋ Add Member</Btn>
          </div>
        }
      />

      {/* ── Board Composition Dashboard ─────────────────────────────── */}
      {composition && composition.totalMembers > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4">
            <p className="text-[11px] text-slate-400 uppercase font-semibold">Independence Ratio</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{composition.independenceRatio}%</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{composition.byDirectorType?.independent ?? 0} independent director(s)</p>
          </Card>
          <Card className="p-4">
            <p className="text-[11px] text-slate-400 uppercase font-semibold">Gender Diversity</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{composition.genderDiversityRatio}%</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Female representation</p>
          </Card>
          <Card className="p-4">
            <p className="text-[11px] text-slate-400 uppercase font-semibold">Avg. Tenure</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{composition.averageTenureYears}y</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Across active members</p>
          </Card>
          <Card className="p-4">
            <p className="text-[11px] text-slate-400 uppercase font-semibold">Governance Compliance</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{composition.governanceCompliance?.conflictOfInterestDeclaredPct ?? 0}%</p>
            <p className="text-[11px] text-slate-400 mt-0.5">COI declared · {composition.governanceCompliance?.codeOfConductSignedPct ?? 0}% Code of Conduct signed</p>
          </Card>
        </div>
      )}

      {composition?.expiringTerms?.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-amber-800">⚠️ {composition.expiringTerms.length} term(s) expiring within 90 days</p>
          <div className="mt-2 space-y-1">
            {composition.expiringTerms.map((t: any, i: number) => (
              <p key={i} className="text-xs text-amber-700">{t.name} — term ends {new Date(t.termEndDate).toLocaleDateString()}</p>
            ))}
          </div>
        </div>
      )}

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
            <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mb-2 ${DIRECTOR_TYPE_BADGE[m.directorType] || "bg-slate-100 text-slate-600"}`}>
              {DIRECTOR_TYPE_LABELS[m.directorType] || "Non-Executive Director"}
            </span>
            <div className="space-y-1.5 text-xs border-t border-slate-100 pt-3">
              <div className="flex justify-between"><span className="text-slate-400">Appointed</span><span className="text-slate-700 font-medium">{m.appointedDate ? new Date(m.appointedDate).toLocaleDateString() : "—"}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Term Ends</span><span className="text-slate-700 font-medium">{m.termEndDate ? new Date(m.termEndDate).toLocaleDateString() : "—"}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Expertise</span><span className="text-slate-700 font-medium truncate max-w-[140px]">{(m.expertiseAreas || []).join(", ") || "—"}</span></div>
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
                <div className="flex gap-1.5 mt-1">
                  <Badge status={drawer.status === "active" ? "Active" : "Inactive"} small />
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${DIRECTOR_TYPE_BADGE[drawer.directorType] || "bg-slate-100 text-slate-600"}`}>
                    {DIRECTOR_TYPE_LABELS[drawer.directorType] || "Non-Executive Director"}
                  </span>
                </div>
              </div>
            </div>

            {drawer.biography && (
              <div className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3">{drawer.biography}</div>
            )}

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Contact & Role</p>
              {([
                ["Email", drawer.email || "—"],
                ["Phone", drawer.phone || "—"],
                ["Designation", drawer.designation || "—"],
                ["Gender", drawer.gender ? drawer.gender.replace(/_/g, " ") : "—"],
              ] as [string, string][]).map(([k, v]) => (
                <div key={k} className="flex justify-between py-2 border-b border-slate-50 text-sm">
                  <span className="text-slate-500">{k}</span>
                  <span className="font-medium text-slate-800 capitalize">{v}</span>
                </div>
              ))}
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Term & Appointment</p>
              {([
                ["Appointed", drawer.appointedDate ? new Date(drawer.appointedDate).toLocaleDateString() : "—"],
                ["Term Start", drawer.termStartDate ? new Date(drawer.termStartDate).toLocaleDateString() : "—"],
                ["Term End", drawer.termEndDate ? new Date(drawer.termEndDate).toLocaleDateString() : "—"],
                ["Term Number", drawer.termNumber ? `Term ${drawer.termNumber}` : "—"],
              ] as [string, string][]).map(([k, v]) => (
                <div key={k} className="flex justify-between py-2 border-b border-slate-50 text-sm">
                  <span className="text-slate-500">{k}</span>
                  <span className="font-medium text-slate-800">{v}</span>
                </div>
              ))}
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Expertise</p>
              <div className="flex flex-wrap gap-1.5">
                {(drawer.expertiseAreas || []).map((a: string) => (
                  <span key={a} className="text-xs bg-blue-50 text-[#0C447C] px-2 py-1 rounded-full">{a}</span>
                ))}
                {(!drawer.expertiseAreas || drawer.expertiseAreas.length === 0) && <span className="text-xs text-slate-400">None specified</span>}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Governance Compliance</p>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-sm py-1">
                  <span className="text-slate-500">Conflict of Interest Declared</span>
                  <Badge status={drawer.conflictOfInterestDeclared ? "Active" : "Inactive"} small />
                </div>
                {drawer.conflictOfInterestDeclared && drawer.conflictOfInterestDetails && (
                  <p className="text-xs text-slate-500 bg-slate-50 rounded-lg p-2">{drawer.conflictOfInterestDetails}</p>
                )}
                <div className="flex items-center justify-between text-sm py-1">
                  <span className="text-slate-500">Code of Conduct Signed</span>
                  <Badge status={drawer.codeOfConductSigned ? "Active" : "Inactive"} small />
                </div>
                <div className="flex items-center justify-between text-sm py-1">
                  <span className="text-slate-500">Orientation Completed</span>
                  <Badge status={drawer.orientationCompleted ? "Active" : "Inactive"} small />
                </div>
                <div className="flex items-center justify-between text-sm py-1">
                  <span className="text-slate-500">Voluntary Position</span>
                  <span className="font-medium text-slate-800">{drawer.isVoluntary === false ? `Remunerated${drawer.annualRemuneration ? ` (${drawer.annualRemuneration.toLocaleString()}/yr)` : ""}` : "Yes"}</span>
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Meeting History ({memberMeetingHistory(`${drawer.firstName} ${drawer.lastName}`).length})</p>
              <div className="space-y-1.5">
                {memberMeetingHistory(`${drawer.firstName} ${drawer.lastName}`).slice(0, 5).map((mt: any) => (
                  <div key={mt._id} className="flex items-center justify-between text-xs bg-slate-50 rounded-lg px-3 py-2">
                    <span className="text-slate-700">{mt.title}</span>
                    <span className="text-slate-400">{new Date(mt.scheduledAt).toLocaleDateString()}</span>
                  </div>
                ))}
                {memberMeetingHistory(`${drawer.firstName} ${drawer.lastName}`).length === 0 && (
                  <span className="text-xs text-slate-400">No recorded meetings yet</span>
                )}
              </div>
            </div>

            {drawer.notes && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Notes</p>
                <p className="text-sm text-slate-600">{drawer.notes}</p>
              </div>
            )}

            <div className="pt-2">
              <Btn variant="primary" className="w-full justify-center" onClick={() => openEdit(drawer)}>✏️ Edit Member</Btn>
            </div>
          </div>
        )}
      </Drawer>

      {/* ── Add / Edit Member Modal (shared layout) ────────────────────── */}
      {[
        { open: modal, close: closeModal, f: form, setF: setForm, title: "Add Board Member", onSave: handleSave, pending: addMember.isPending, saveLabel: "＋ Add Member" },
        { open: editModal, close: () => { setEditModal(false); setEditForm({ ...EMPTY_FORM }); }, f: editForm, setF: setEditForm, title: "Edit Board Member", onSave: () => editingId && updateMember.mutate({ id: editingId, data: editForm }), pending: updateMember.isPending, saveLabel: "✓ Save Changes" },
      ].map((cfg, idx) => (
        <Modal key={idx} open={cfg.open} onClose={cfg.close} title={cfg.title} size="lg">
          <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="First Name" required>
                <FInput value={cfg.f.firstName} onChange={(e) => cfg.setF((p: any) => ({ ...p, firstName: e.target.value }))} placeholder="e.g. Yusuf" />
              </FormField>
              <FormField label="Last Name" required>
                <FInput value={cfg.f.lastName} onChange={(e) => cfg.setF((p: any) => ({ ...p, lastName: e.target.value }))} placeholder="e.g. Al-Rashid" />
              </FormField>
              <FormField label="Email">
                <FInput type="email" value={cfg.f.email} onChange={(e) => cfg.setF((p: any) => ({ ...p, email: e.target.value }))} placeholder="member@board.org" />
              </FormField>
              <FormField label="Phone">
                <FInput value={cfg.f.phone} onChange={(e) => cfg.setF((p: any) => ({ ...p, phone: e.target.value }))} placeholder="+92 300 0000000" />
              </FormField>
              <FormField label="Gender">
                <FSelect options={["", "male", "female", "other", "prefer_not_to_say"]} value={cfg.f.gender} onChange={(e) => cfg.setF((p: any) => ({ ...p, gender: e.target.value }))} />
              </FormField>
              <FormField label="Designation">
                <FInput value={cfg.f.designation} onChange={(e) => cfg.setF((p: any) => ({ ...p, designation: e.target.value }))} placeholder="e.g. Finance Expert" />
              </FormField>
              <FormField label="Board Role">
                <FSelect options={BOARD_ROLES} value={cfg.f.boardRole} onChange={(e) => cfg.setF((p: any) => ({ ...p, boardRole: e.target.value }))} />
              </FormField>
              <FormField label="Director Type" required>
                <FSelect
                  options={["independent", "non_executive", "executive"]}
                  value={cfg.f.directorType}
                  onChange={(e) => cfg.setF((p: any) => ({ ...p, directorType: e.target.value }))}
                />
              </FormField>
            </div>

            <div className="col-span-2">
              <FormField label="Biography">
                <textarea
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C] resize-none"
                  rows={2} placeholder="Brief professional background…"
                  value={cfg.f.biography} onChange={(e) => cfg.setF((p: any) => ({ ...p, biography: e.target.value }))}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <FormField label="Appointed Date"><FInput type="date" value={cfg.f.appointedDate} onChange={(e) => cfg.setF((p: any) => ({ ...p, appointedDate: e.target.value }))} /></FormField>
              <FormField label="Term Start"><FInput type="date" value={cfg.f.termStartDate} onChange={(e) => cfg.setF((p: any) => ({ ...p, termStartDate: e.target.value }))} /></FormField>
              <FormField label="Term End"><FInput type="date" value={cfg.f.termEndDate} onChange={(e) => cfg.setF((p: any) => ({ ...p, termEndDate: e.target.value }))} /></FormField>
              <FormField label="Term #"><FInput type="number" value={cfg.f.termNumber} onChange={(e) => cfg.setF((p: any) => ({ ...p, termNumber: Number(e.target.value) }))} /></FormField>
            </div>

            <FormField label="Areas of Expertise">
              <div className="flex flex-wrap gap-1.5 border border-slate-200 rounded-lg p-2">
                {EXPERTISE_OPTIONS.map((area) => (
                  <label key={area} className={`text-xs px-2.5 py-1 rounded-full cursor-pointer border ${cfg.f.expertiseAreas.includes(area) ? "bg-blue-50 text-[#0C447C] border-[#0C447C]" : "bg-white text-slate-500 border-slate-200"}`}>
                    <input type="checkbox" className="hidden" checked={cfg.f.expertiseAreas.includes(area)} onChange={() => cfg.setF((p: any) => ({ ...p, expertiseAreas: p.expertiseAreas.includes(area) ? p.expertiseAreas.filter((a: string) => a !== area) : [...p.expertiseAreas, area] }))} />
                    {area}
                  </label>
                ))}
              </div>
            </FormField>

            <div className="border border-slate-200 rounded-lg p-3 space-y-2">
              <p className="text-xs font-semibold text-slate-700 uppercase">Governance Compliance</p>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={cfg.f.conflictOfInterestDeclared} onChange={(e) => cfg.setF((p: any) => ({ ...p, conflictOfInterestDeclared: e.target.checked }))} className="accent-[#0C447C]" />
                Conflict of interest declared
              </label>
              {cfg.f.conflictOfInterestDeclared && (
                <div className="grid grid-cols-2 gap-2 pl-6">
                  <FInput placeholder="Details of declared interest…" value={cfg.f.conflictOfInterestDetails} onChange={(e) => cfg.setF((p: any) => ({ ...p, conflictOfInterestDetails: e.target.value }))} />
                  <FInput type="date" value={cfg.f.conflictOfInterestDate} onChange={(e) => cfg.setF((p: any) => ({ ...p, conflictOfInterestDate: e.target.value }))} />
                </div>
              )}
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={cfg.f.codeOfConductSigned} onChange={(e) => cfg.setF((p: any) => ({ ...p, codeOfConductSigned: e.target.checked }))} className="accent-[#0C447C]" />
                Code of Conduct signed
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={cfg.f.orientationCompleted} onChange={(e) => cfg.setF((p: any) => ({ ...p, orientationCompleted: e.target.checked }))} className="accent-[#0C447C]" />
                New-director orientation completed
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4 items-end">
              <FormField label="Position Type">
                <div className="flex gap-2">
                  <button onClick={() => cfg.setF((p: any) => ({ ...p, isVoluntary: true }))}
                    className={`flex-1 py-2 rounded-lg border text-xs font-medium ${cfg.f.isVoluntary ? "bg-blue-50 text-[#0C447C] border-[#0C447C]" : "bg-white text-slate-500 border-slate-200"}`}>Voluntary</button>
                  <button onClick={() => cfg.setF((p: any) => ({ ...p, isVoluntary: false }))}
                    className={`flex-1 py-2 rounded-lg border text-xs font-medium ${!cfg.f.isVoluntary ? "bg-blue-50 text-[#0C447C] border-[#0C447C]" : "bg-white text-slate-500 border-slate-200"}`}>Remunerated</button>
                </div>
              </FormField>
              {!cfg.f.isVoluntary && (
                <FormField label="Annual Remuneration">
                  <FInput type="number" value={cfg.f.annualRemuneration} onChange={(e) => cfg.setF((p: any) => ({ ...p, annualRemuneration: e.target.value }))} placeholder="PKR per year" />
                </FormField>
              )}
            </div>

            <FormField label="Notes">
              <FInput value={cfg.f.notes} onChange={(e) => cfg.setF((p: any) => ({ ...p, notes: e.target.value }))} placeholder="Additional notes" />
            </FormField>
          </div>
          <div className="p-5 border-t border-slate-100 flex justify-end gap-2">
            <Btn variant="secondary" onClick={cfg.close}>Cancel</Btn>
            <Btn variant="primary" onClick={cfg.onSave}>{cfg.pending ? "Saving…" : cfg.saveLabel}</Btn>
          </div>
        </Modal>
      ))}
    </div>
  );
}
