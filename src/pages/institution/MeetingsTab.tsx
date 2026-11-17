import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  MONTHS,
  Badge, Btn, Card, Drawer, FInput, FSelect, FormField, Modal, PageHeader,
} from "./shared";
import organizationService from "../../services/organization.service";

const AGENDA_ITEM_TYPES = [
  { value: "discussion", label: "Discussion" },
  { value: "decision", label: "Decision" },
  { value: "information", label: "Information" },
  { value: "update", label: "Update" },
];

const ATTENDANCE_STATUSES = [
  { value: "present", label: "Present" },
  { value: "absent", label: "Absent" },
  { value: "apologies", label: "Apologies Sent" },
];

const VOTE_OUTCOMES = [
  { value: "none", label: "No vote taken" },
  { value: "unanimous", label: "Carried unanimously" },
  { value: "by_consensus", label: "Carried by consensus" },
  { value: "by_vote", label: "Carried by vote" },
];

const QUORUM_STATUSES = [
  { value: "not_applicable", label: "Not applicable" },
  { value: "met", label: "Quorum met" },
  { value: "not_met", label: "Quorum not met" },
];

const ACTION_ITEM_STATUSES = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
];

const MINUTES_STATUS_STYLE: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600",
  pending_approval: "bg-amber-50 text-amber-700",
  approved: "bg-emerald-50 text-emerald-700",
};
const MINUTES_STATUS_LABEL: Record<string, string> = {
  draft: "Draft", pending_approval: "Pending Approval", approved: "Approved",
};

function findLabel(list: { value: string; label: string }[], value: string, fallback = list[0].label) {
  return list.find((x) => x.value === value)?.label || fallback;
}
function findValue(list: { value: string; label: string }[], label: string, fallback = list[0].value) {
  return list.find((x) => x.label === label)?.value || fallback;
}

function emptyMinutesForm(meeting: any) {
  return {
    attendance: (meeting?.attendees || []).map((name: string) => ({ name, attendanceStatus: "present", kind: "invited" })),
    calledToOrder: "",
    adjournedAt: "",
    quorumStatus: "not_applicable",
    quorumNote: "",
    itemMinutes: (meeting?.agendaItems || []).map((item: any) => ({
      agendaItemOrder: item.order, topic: item.topic, discussion: "", decision: "",
      voteOutcome: "none", votesFor: 0, votesAgainst: 0, votesAbstain: 0,
    })),
    actionItems: [] as { description: string; assignedTo: string; dueDate: string; status: string }[],
    generalNotes: "",
    nextMeetingDate: "",
    status: "draft",
    adhocAttendeeInput: "",
  };
}

/** Merges a saved minutes record onto a freshly-seeded form so attendees/
 * agenda items added to the meeting after minutes were first drafted still
 * show up, without losing anything already recorded. */
function mergeMinutesIntoForm(base: ReturnType<typeof emptyMinutesForm>, saved: any) {
  if (!saved) return base;
  const savedAttendanceByName = new Map((saved.attendance || []).map((a: any) => [a.name, a]));
  const attendance = [
    ...base.attendance.map((a: any) => savedAttendanceByName.get(a.name) || a),
    ...(saved.attendance || []).filter((a: any) => a.kind !== "invited" && !base.attendance.some((x: any) => x.name === a.name)),
  ];
  const savedItemsByOrder = new Map((saved.itemMinutes || []).map((im: any) => [im.agendaItemOrder, im]));
  const itemMinutes = base.itemMinutes.map((im: any) => savedItemsByOrder.get(im.agendaItemOrder) || im);
  return {
    ...base,
    attendance,
    calledToOrder: saved.calledToOrder || "",
    adjournedAt: saved.adjournedAt || "",
    quorumStatus: saved.quorumStatus || "not_applicable",
    quorumNote: saved.quorumNote || "",
    itemMinutes,
    actionItems: (saved.actionItems || []).map((a: any) => ({
      description: a.description || "", assignedTo: a.assignedTo || "",
      dueDate: a.dueDate ? new Date(a.dueDate).toISOString().slice(0, 10) : "", status: a.status || "open",
    })),
    generalNotes: saved.generalNotes || "",
    nextMeetingDate: saved.nextMeetingDate ? new Date(saved.nextMeetingDate).toISOString().slice(0, 10) : "",
    status: saved.status || "draft",
  };
}

const EMPTY_FORM = {
  title: "", committeeId: "", type: "staff", category: "regular",
  scheduledDate: "", scheduledTime: "", durationMinutes: 60,
  mode: "in_person", venue: "", meetingLink: "",
  chairperson: "", minuteTaker: "",
  attendees: [] as string[], attendeeInput: "",
  agenda: "",
  agendaItems: [] as { order: number; topic: string; description: string; presenter: string; durationMinutes: number; itemType: string }[],
};

function capitalize(s: string) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

export default function MeetingsTab({ initialModal = false }: { initialModal?: boolean }) {
  const [view, setView] = useState<"list" | "calendar">("list");
  const [calMonth, setCalMonth] = useState(() => { const d = new Date(); return { year: d.getFullYear(), month: d.getMonth() }; });
  const [modal, setModal] = useState(initialModal);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewDrawer, setViewDrawer] = useState<any | null>(null);
  const [minutesModal, setMinutesModal] = useState<any | null>(null);
  const [minutesForm, setMinutesForm] = useState(emptyMinutesForm(null));

  const queryClient = useQueryClient();

  const { data: meetings = [], isLoading } = useQuery({
    queryKey: ["meetings"],
    queryFn: () => organizationService.getMeetings(),
  });
  const { data: committees = [] } = useQuery({
    queryKey: ["committees"],
    queryFn: organizationService.getCommittees,
  });

  const { data: savedMinutes } = useQuery({
    queryKey: ["meeting-minutes", minutesModal?._id],
    queryFn: () => organizationService.getMeetingMinutes(minutesModal._id),
    enabled: !!minutesModal,
  });

  useEffect(() => {
    if (!minutesModal) return;
    setMinutesForm(mergeMinutesIntoForm(emptyMinutesForm(minutesModal), savedMinutes));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minutesModal?._id, savedMinutes]);

  const saveMeeting = useMutation({
    mutationFn: ({ id, data }: { id: string | null; data: any }) =>
      id ? organizationService.updateMeeting(id, data) : organizationService.createMeeting(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      toast.success(editingId ? "Meeting updated" : "Meeting scheduled");
      closeModal();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed"),
  });

  const notifyMeeting = useMutation({
    mutationFn: organizationService.notifyMeeting,
    onSuccess: (res: any) => {
      const parts = [`${res.emailsSent} email${res.emailsSent === 1 ? "" : "s"} sent`];
      if (res.emailFailures?.length) parts.push(`${res.emailFailures.length} failed`);
      toast.success(parts.join(", "));
      if (res.whatsapp?.reason) toast(res.whatsapp.reason, { icon: "💬", duration: 6000 });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to notify"),
  });

  const deleteMeeting = useMutation({
    mutationFn: organizationService.deleteMeeting,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      toast.success("Meeting deleted");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to delete meeting"),
  });

  function minutesPayload() {
    return {
      attendance: minutesForm.attendance.map(({ name, attendanceStatus, kind }: any) => ({ name, attendanceStatus, kind })),
      calledToOrder: minutesForm.calledToOrder || undefined,
      adjournedAt: minutesForm.adjournedAt || undefined,
      quorumStatus: minutesForm.quorumStatus,
      quorumNote: minutesForm.quorumNote || undefined,
      itemMinutes: minutesForm.itemMinutes,
      actionItems: minutesForm.actionItems.filter((a: any) => a.description.trim()),
      generalNotes: minutesForm.generalNotes || undefined,
      nextMeetingDate: minutesForm.nextMeetingDate || undefined,
    };
  }

  const saveMinutes = useMutation({
    mutationFn: () => organizationService.saveMeetingMinutes(minutesModal._id, minutesPayload()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      queryClient.invalidateQueries({ queryKey: ["meeting-minutes", minutesModal._id] });
      toast.success("Minutes saved");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to save minutes"),
  });

  const submitMinutes = useMutation({
    mutationFn: async () => {
      await organizationService.saveMeetingMinutes(minutesModal._id, minutesPayload());
      return organizationService.submitMeetingMinutes(minutesModal._id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      queryClient.invalidateQueries({ queryKey: ["meeting-minutes", minutesModal._id] });
      toast.success("Minutes submitted for approval");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to submit minutes"),
  });

  const approveMinutes = useMutation({
    mutationFn: () => organizationService.approveMeetingMinutes(minutesModal._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      queryClient.invalidateQueries({ queryKey: ["meeting-minutes", minutesModal._id] });
      toast.success("Minutes approved");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to approve minutes"),
  });

  const downloadMinutesPdf = useMutation({
    mutationFn: () => organizationService.downloadMeetingMinutesPdf(minutesModal._id, minutesModal.title),
    onError: () => toast.error("Failed to download minutes PDF"),
  });

  const items = meetings as any[];
  const committeeList = committees as any[];

  function committeeMembers(committeeId: string): any[] {
    return committeeList.find((c) => c._id === committeeId)?.members || [];
  }

  function handleSave() {
    if (!form.title.trim()) { toast.error("Meeting title is required"); return; }
    if (!form.scheduledDate) { toast.error("Date is required"); return; }
    const scheduledAt = form.scheduledTime ? `${form.scheduledDate}T${form.scheduledTime}:00` : `${form.scheduledDate}T09:00:00`;
    saveMeeting.mutate({
      id: editingId,
      data: {
        title: form.title,
        committeeId: form.committeeId || undefined,
        type: form.committeeId ? "committee" : form.type,
        category: form.category,
        scheduledAt,
        durationMinutes: form.durationMinutes,
        mode: form.mode,
        venue: form.venue || undefined,
        meetingLink: form.meetingLink || undefined,
        chairperson: form.chairperson || undefined,
        minuteTaker: form.minuteTaker || undefined,
        attendees: form.attendees,
        agenda: form.agenda || undefined,
        agendaItems: form.agendaItems.filter((i) => i.topic.trim()),
      },
    });
  }

  function closeModal() {
    setModal(false);
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
  }

  function openEdit(m: any) {
    const d = new Date(m.scheduledAt);
    setEditingId(m._id);
    setForm({
      title: m.title || "", committeeId: m.committeeId || "", type: m.type || "staff", category: m.category || "regular",
      scheduledDate: d.toISOString().slice(0, 10), scheduledTime: d.toTimeString().slice(0, 5),
      durationMinutes: m.durationMinutes || 60,
      mode: m.mode || "in_person", venue: m.venue || "", meetingLink: m.meetingLink || "",
      chairperson: m.chairperson || "", minuteTaker: m.minuteTaker || "",
      attendees: m.attendees || [], attendeeInput: "",
      agenda: m.agenda || "",
      agendaItems: (m.agendaItems || []).map((a: any, i: number) => ({ order: i, topic: a.topic || "", description: a.description || "", presenter: a.presenter || "", durationMinutes: a.durationMinutes || 10, itemType: a.itemType || "discussion" })),
    });
    setModal(true);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-[#0C447C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const calDays = new Date(calMonth.year, calMonth.month + 1, 0).getDate();
  const firstWeekday = new Date(calMonth.year, calMonth.month, 1).getDay();
  const today = new Date();

  return (
    <div className="space-y-5">
      <PageHeader
        breadcrumbs={["Home", "Institution Setup", "Meetings"]}
        title="Meeting Management"
        subtitle="Schedule, manage, and track board and committee meetings"
        actions={
          <div className="flex gap-2">
            <div className="flex gap-0.5 bg-slate-100 rounded-lg p-0.5">
              {([{ v: "list", i: "☰" }, { v: "calendar", i: "📅" }] as const).map(({ v, i }) => (
                <button key={v} onClick={() => setView(v)} className={`px-3 py-1.5 text-sm rounded-md transition-colors ${view === v ? "bg-white shadow-sm" : "text-slate-500"}`}>{i}</button>
              ))}
            </div>
            <Btn variant="primary" size="sm" onClick={() => setModal(true)}>＋ Schedule Meeting</Btn>
          </div>
        }
      />

      {view === "list" ? (
        <div className="space-y-3">
          {items.length === 0 && (
            <div className="py-16 text-center text-sm text-slate-400">No meetings scheduled yet. Click ＋ Schedule Meeting to add one.</div>
          )}
          {items.map((m: any) => {
            const d = new Date(m.scheduledAt);
            return (
              <Card key={m._id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-blue-50 rounded-xl flex flex-col items-center justify-center flex-shrink-0 border border-blue-100">
                    <span className="text-[#0C447C] font-bold text-lg leading-none">{d.getDate()}</span>
                    <span className="text-blue-400 text-xs">{MONTHS[d.getMonth()]}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-semibold text-slate-900 text-sm">{m.title}</h3>
                      <Badge status={capitalize(m.status)} />
                      {m.meetingMinutes?.status && (
                        <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-full ${MINUTES_STATUS_STYLE[m.meetingMinutes.status]}`}>
                          Minutes: {MINUTES_STATUS_LABEL[m.meetingMinutes.status]}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span>👥 {m.type}</span>
                      <span>🕐 {d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      <span>📍 {m.mode === "virtual" ? "Virtual" : m.venue || "—"}</span>
                      {(m.agendaItems || []).length > 0 && <span>📋 {m.agendaItems.length} agenda item{m.agendaItems.length !== 1 ? "s" : ""}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setViewDrawer(m)} className="px-3 py-1.5 text-xs bg-blue-50 text-[#0C447C] rounded-lg hover:bg-blue-100 font-medium">View Agenda</button>
                    {m.status !== "completed" && (
                      <>
                        {m.committeeId && (
                          <button onClick={() => notifyMeeting.mutate(m._id)} disabled={notifyMeeting.isPending}
                            className="px-3 py-1.5 text-xs bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 font-medium disabled:opacity-50">📧 Notify</button>
                        )}
                        <button onClick={() => openEdit(m)} className="px-3 py-1.5 text-xs bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 font-medium">Edit</button>
                      </>
                    )}
                    <button onClick={() => setMinutesModal(m)} className="px-3 py-1.5 text-xs bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 font-medium">📝 Minutes</button>
                    <button
                      onClick={() => {
                        if (m.meetingMinutes?.status === "approved") return;
                        if (window.confirm(`Delete "${m.title}"? This cannot be undone.`)) deleteMeeting.mutate(m._id);
                      }}
                      disabled={deleteMeeting.isPending || m.meetingMinutes?.status === "approved"}
                      title={m.meetingMinutes?.status === "approved" ? "This meeting has approved minutes on file and cannot be deleted." : undefined}
                      className="px-3 py-1.5 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-red-50"
                    >🗑 Delete</button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setCalMonth((p) => p.month === 0 ? { year: p.year - 1, month: 11 } : { year: p.year, month: p.month - 1 })}
              className="px-2 py-1 text-slate-500 hover:bg-slate-50 rounded-lg">←</button>
            <div className="text-center text-slate-700 text-sm font-semibold">{MONTHS[calMonth.month]} {calMonth.year}</div>
            <button onClick={() => setCalMonth((p) => p.month === 11 ? { year: p.year + 1, month: 0 } : { year: p.year, month: p.month + 1 })}
              className="px-2 py-1 text-slate-500 hover:bg-slate-50 rounded-lg">→</button>
          </div>
          <div className="grid grid-cols-7 gap-0.5 mb-2">
            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
              <div key={d} className="text-center text-xs font-medium text-slate-400 py-2">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: Math.ceil((calDays + firstWeekday) / 7) * 7 }, (_, i) => {
              const day = i - firstWeekday + 1;
              const isCurrentMonth = day >= 1 && day <= calDays;
              const isToday = isCurrentMonth && day === today.getDate() && calMonth.month === today.getMonth() && calMonth.year === today.getFullYear();
              const meetingsOnDay = isCurrentMonth ? items.filter((m: any) => {
                const d = new Date(m.scheduledAt);
                return d.getFullYear() === calMonth.year && d.getMonth() === calMonth.month && d.getDate() === day;
              }) : [];
              return (
                <div key={i} className={`min-h-[64px] p-1 rounded-lg text-xs ${isCurrentMonth ? "bg-white hover:bg-slate-50" : "opacity-30"} ${isToday ? "ring-2 ring-[#0C447C]" : ""}`}>
                  {isCurrentMonth && (
                    <>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-0.5 ${isToday ? "bg-[#0C447C] text-white" : "text-slate-600"}`}>{day}</div>
                      {meetingsOnDay.slice(0, 2).map((m: any) => (
                        <button key={m._id} onClick={() => setViewDrawer(m)}
                          className="w-full text-left text-[10px] rounded px-1 py-0.5 truncate mb-0.5 bg-blue-50 text-[#0C447C] hover:bg-blue-100">
                          {m.title}
                        </button>
                      ))}
                      {meetingsOnDay.length > 2 && <div className="text-[9px] text-slate-400 px-1">+{meetingsOnDay.length - 2} more</div>}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ── View Agenda Drawer ──────────────────────────────────────── */}
      <Drawer open={!!viewDrawer} onClose={() => setViewDrawer(null)} title="Meeting Details">
        {viewDrawer && (
          <div className="p-5 space-y-4">
            <div>
              <h3 className="font-bold text-slate-900">{viewDrawer.title}</h3>
              <p className="text-xs text-slate-400 capitalize">{viewDrawer.category || "regular"} · {viewDrawer.type}</p>
              <div className="mt-2"><Badge status={capitalize(viewDrawer.status)} /></div>
            </div>
            {([
              ["Date & Time", `${new Date(viewDrawer.scheduledAt).toLocaleDateString()} · ${new Date(viewDrawer.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`],
              ["Duration", viewDrawer.durationMinutes ? `${viewDrawer.durationMinutes} minutes` : "—"],
              ["Mode", viewDrawer.mode ? viewDrawer.mode.replace("_", "-") : "In-person"],
              [viewDrawer.mode === "virtual" ? "Meeting Link" : "Venue", viewDrawer.mode === "virtual" ? (viewDrawer.meetingLink || "—") : (viewDrawer.venue || "—")],
              ["Chairperson", viewDrawer.chairperson || "—"],
              ["Minute Taker", viewDrawer.minuteTaker || "—"],
            ] as [string, string][]).map(([k, v]) => (
              <div key={k} className="flex justify-between py-2 border-b border-slate-50 text-sm">
                <span className="text-slate-500">{k}</span>
                <span className="font-medium text-slate-800">{v}</span>
              </div>
            ))}
            {(viewDrawer.attendees || []).length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Attendees ({viewDrawer.attendees.length})</p>
                <div className="flex flex-wrap gap-1.5">
                  {viewDrawer.attendees.map((a: string) => <span key={a} className="text-xs bg-slate-50 px-2 py-1 rounded-full text-slate-600">{a}</span>)}
                </div>
              </div>
            )}
            {(viewDrawer.agendaItems || []).length > 0 ? (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Agenda</p>
                <div className="space-y-2">
                  {viewDrawer.agendaItems.map((item: any, i: number) => (
                    <div key={i} className="bg-slate-50 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-800">{i + 1}. {item.topic}</span>
                        {item.durationMinutes ? <span className="text-xs text-slate-400">{item.durationMinutes} min</span> : null}
                      </div>
                      {item.description && <p className="text-xs text-slate-500 mt-1">{item.description}</p>}
                      <div className="mt-1.5 flex items-center gap-2">
                        {item.itemType && <span className="text-[10px] font-semibold uppercase bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">{item.itemType}</span>}
                        {item.presenter && <span className="text-[11px] text-slate-400">by {item.presenter}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : viewDrawer.agenda ? (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Agenda</p>
                <p className="text-sm text-slate-600">{viewDrawer.agenda}</p>
              </div>
            ) : null}
            {viewDrawer.minutes && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Minutes</p>
                <p className="text-sm text-slate-600 whitespace-pre-wrap">{viewDrawer.minutes}</p>
              </div>
            )}
            <div className="pt-2 flex gap-2">
              {viewDrawer.status !== "completed" && (
                <Btn variant="primary" className="flex-1 justify-center" onClick={() => { setViewDrawer(null); openEdit(viewDrawer); }}>✏️ Edit</Btn>
              )}
              {viewDrawer.committeeId && viewDrawer.status !== "completed" && (
                <Btn variant="secondary" className="flex-1 justify-center" onClick={() => notifyMeeting.mutate(viewDrawer._id)}>📧 Notify</Btn>
              )}
              <button
                onClick={() => {
                  if (viewDrawer.meetingMinutes?.status === "approved") return;
                  if (window.confirm(`Delete "${viewDrawer.title}"? This cannot be undone.`)) {
                    deleteMeeting.mutate(viewDrawer._id);
                    setViewDrawer(null);
                  }
                }}
                disabled={deleteMeeting.isPending || viewDrawer.meetingMinutes?.status === "approved"}
                title={viewDrawer.meetingMinutes?.status === "approved" ? "This meeting has approved minutes on file and cannot be deleted." : undefined}
                className="flex-1 justify-center px-3 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-red-50"
              >🗑 Delete</button>
            </div>
          </div>
        )}
      </Drawer>

      {/* ── Meeting Minutes Modal ───────────────────────────────────── */}
      <Modal open={!!minutesModal} onClose={() => setMinutesModal(null)} title="Meeting Minutes" size="lg">
        {minutesModal && (
          <>
            <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-800">{minutesModal.title}</p>
                  <p className="text-xs text-slate-400">{new Date(minutesModal.scheduledAt).toLocaleDateString()}</p>
                </div>
                <span className={`text-[11px] font-semibold uppercase px-2 py-1 rounded-full ${MINUTES_STATUS_STYLE[minutesForm.status]}`}>
                  {MINUTES_STATUS_LABEL[minutesForm.status]}
                </span>
              </div>

              {/* Attendance */}
              <div>
                <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Attendance</p>
                <div className="border border-slate-200 rounded-lg divide-y divide-slate-100">
                  {minutesForm.attendance.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-3">No invited attendees on this meeting — add anyone who showed up below</p>
                  )}
                  {minutesForm.attendance.map((a: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2">
                      <span className="flex-1 text-sm text-slate-700">
                        {a.name}
                        {a.kind !== "invited" && <span className="ml-1.5 text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-full">{a.kind === "adhoc" ? "Ad-hoc" : "Guest"}</span>}
                      </span>
                      <select
                        className="px-2 py-1 text-xs border border-slate-200 rounded-lg bg-white"
                        value={findLabel(ATTENDANCE_STATUSES, a.attendanceStatus)}
                        onChange={(e) => setMinutesForm((p: any) => ({ ...p, attendance: p.attendance.map((x: any, j: number) => j === i ? { ...x, attendanceStatus: findValue(ATTENDANCE_STATUSES, e.target.value) } : x) }))}
                      >
                        {ATTENDANCE_STATUSES.map((s) => <option key={s.value}>{s.label}</option>)}
                      </select>
                      <button onClick={() => setMinutesForm((p: any) => ({ ...p, attendance: p.attendance.filter((_: any, j: number) => j !== i) }))} className="text-slate-400 hover:text-red-500 px-1">✕</button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  <FInput placeholder="Add someone who attended but wasn't invited…" value={minutesForm.adhocAttendeeInput}
                    onChange={(e) => setMinutesForm((p: any) => ({ ...p, adhocAttendeeInput: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === "Enter" && minutesForm.adhocAttendeeInput.trim()) { e.preventDefault(); setMinutesForm((p: any) => ({ ...p, attendance: [...p.attendance, { name: p.adhocAttendeeInput.trim(), attendanceStatus: "present", kind: "adhoc" }], adhocAttendeeInput: "" })); } }} />
                  <Btn variant="secondary" size="sm" onClick={() => { if (minutesForm.adhocAttendeeInput.trim()) setMinutesForm((p: any) => ({ ...p, attendance: [...p.attendance, { name: p.adhocAttendeeInput.trim(), attendanceStatus: "present", kind: "adhoc" }], adhocAttendeeInput: "" })); }}>＋ Add</Btn>
                </div>
              </div>

              {/* Mechanics */}
              <div className="grid grid-cols-3 gap-4">
                <FormField label="Called to Order">
                  <FInput placeholder="e.g. 10:05 AM" value={minutesForm.calledToOrder} onChange={(e) => setMinutesForm((p: any) => ({ ...p, calledToOrder: e.target.value }))} />
                </FormField>
                <FormField label="Adjourned At">
                  <FInput placeholder="e.g. 11:30 AM" value={minutesForm.adjournedAt} onChange={(e) => setMinutesForm((p: any) => ({ ...p, adjournedAt: e.target.value }))} />
                </FormField>
                <FormField label="Quorum">
                  <FSelect options={QUORUM_STATUSES.map((q) => q.label)} value={findLabel(QUORUM_STATUSES, minutesForm.quorumStatus)}
                    onChange={(e) => setMinutesForm((p: any) => ({ ...p, quorumStatus: findValue(QUORUM_STATUSES, e.target.value) }))} />
                </FormField>
              </div>
              {minutesForm.quorumStatus !== "not_applicable" && (
                <FormField label="Quorum Note (optional)">
                  <FInput placeholder="e.g. 6 of 9 members present, quorum of 5 required" value={minutesForm.quorumNote}
                    onChange={(e) => setMinutesForm((p: any) => ({ ...p, quorumNote: e.target.value }))} />
                </FormField>
              )}

              {/* Per-agenda-item minutes */}
              <div>
                <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Agenda Items — Discussion &amp; Decisions</p>
                {minutesForm.itemMinutes.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-3 border border-dashed border-slate-200 rounded-lg">This meeting has no agenda items to record minutes against</p>
                )}
                <div className="space-y-3">
                  {minutesForm.itemMinutes.map((im: any, i: number) => (
                    <div key={im.agendaItemOrder} className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
                      <p className="text-sm font-semibold text-slate-800 mb-2">{i + 1}. {im.topic}</p>
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <textarea className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg resize-none" rows={2} placeholder="Discussion summary…"
                          value={im.discussion} onChange={(e) => setMinutesForm((p: any) => ({ ...p, itemMinutes: p.itemMinutes.map((x: any, j: number) => j === i ? { ...x, discussion: e.target.value } : x) }))} />
                        <textarea className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg resize-none" rows={2} placeholder="Decision / resolution reached…"
                          value={im.decision} onChange={(e) => setMinutesForm((p: any) => ({ ...p, itemMinutes: p.itemMinutes.map((x: any, j: number) => j === i ? { ...x, decision: e.target.value } : x) }))} />
                      </div>
                      <div className="flex items-center gap-2">
                        <FSelect options={VOTE_OUTCOMES.map((v) => v.label)} value={findLabel(VOTE_OUTCOMES, im.voteOutcome)}
                          onChange={(e) => setMinutesForm((p: any) => ({ ...p, itemMinutes: p.itemMinutes.map((x: any, j: number) => j === i ? { ...x, voteOutcome: findValue(VOTE_OUTCOMES, e.target.value) } : x) }))} />
                        {im.voteOutcome === "by_vote" && (
                          <div className="flex gap-1.5">
                            <input type="number" placeholder="For" value={im.votesFor || ""} className="w-16 px-2 py-1.5 text-xs border border-slate-200 rounded-lg"
                              onChange={(e) => setMinutesForm((p: any) => ({ ...p, itemMinutes: p.itemMinutes.map((x: any, j: number) => j === i ? { ...x, votesFor: Number(e.target.value) } : x) }))} />
                            <input type="number" placeholder="Against" value={im.votesAgainst || ""} className="w-16 px-2 py-1.5 text-xs border border-slate-200 rounded-lg"
                              onChange={(e) => setMinutesForm((p: any) => ({ ...p, itemMinutes: p.itemMinutes.map((x: any, j: number) => j === i ? { ...x, votesAgainst: Number(e.target.value) } : x) }))} />
                            <input type="number" placeholder="Abstain" value={im.votesAbstain || ""} className="w-16 px-2 py-1.5 text-xs border border-slate-200 rounded-lg"
                              onChange={(e) => setMinutesForm((p: any) => ({ ...p, itemMinutes: p.itemMinutes.map((x: any, j: number) => j === i ? { ...x, votesAbstain: Number(e.target.value) } : x) }))} />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Action Items</p>
                  <Btn variant="secondary" size="sm" onClick={() => setMinutesForm((p: any) => ({ ...p, actionItems: [...p.actionItems, { description: "", assignedTo: "", dueDate: "", status: "open" }] }))}>＋ Add Action Item</Btn>
                </div>
                {minutesForm.actionItems.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-3 border border-dashed border-slate-200 rounded-lg">No action items yet</p>
                )}
                <div className="space-y-2">
                  {minutesForm.actionItems.map((a: any, i: number) => (
                    <div key={i} className="grid grid-cols-[1fr,140px,130px,120px,auto] gap-2 items-center">
                      <FInput placeholder="Action description…" value={a.description} onChange={(e) => setMinutesForm((p: any) => ({ ...p, actionItems: p.actionItems.map((x: any, j: number) => j === i ? { ...x, description: e.target.value } : x) }))} />
                      <FInput placeholder="Assignee" value={a.assignedTo} onChange={(e) => setMinutesForm((p: any) => ({ ...p, actionItems: p.actionItems.map((x: any, j: number) => j === i ? { ...x, assignedTo: e.target.value } : x) }))} />
                      <FInput type="date" value={a.dueDate} onChange={(e) => setMinutesForm((p: any) => ({ ...p, actionItems: p.actionItems.map((x: any, j: number) => j === i ? { ...x, dueDate: e.target.value } : x) }))} />
                      <FSelect options={ACTION_ITEM_STATUSES.map((s) => s.label)} value={findLabel(ACTION_ITEM_STATUSES, a.status)}
                        onChange={(e) => setMinutesForm((p: any) => ({ ...p, actionItems: p.actionItems.map((x: any, j: number) => j === i ? { ...x, status: findValue(ACTION_ITEM_STATUSES, e.target.value) } : x) }))} />
                      <button onClick={() => setMinutesForm((p: any) => ({ ...p, actionItems: p.actionItems.filter((_: any, j: number) => j !== i) }))} className="text-red-400 hover:text-red-600 px-1">✕</button>
                    </div>
                  ))}
                </div>
              </div>

              <FormField label="Other Business / General Notes (optional)">
                <textarea className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg resize-none" rows={3}
                  placeholder="Anything else discussed that doesn't fit an agenda item…" value={minutesForm.generalNotes}
                  onChange={(e) => setMinutesForm((p: any) => ({ ...p, generalNotes: e.target.value }))} />
              </FormField>

              <FormField label="Next Meeting Date (optional)">
                <FInput type="date" value={minutesForm.nextMeetingDate} onChange={(e) => setMinutesForm((p: any) => ({ ...p, nextMeetingDate: e.target.value }))} />
              </FormField>
            </div>
            <div className="p-5 border-t border-slate-100 flex items-center justify-between gap-2">
              <Btn variant="ghost" onClick={() => downloadMinutesPdf.mutate()}>
                {downloadMinutesPdf.isPending ? "Preparing…" : "📄 Download PDF"}
              </Btn>
              <div className="flex gap-2">
                <Btn variant="secondary" onClick={() => setMinutesModal(null)}>Close</Btn>
                <Btn variant="secondary" onClick={() => saveMinutes.mutate()}>{saveMinutes.isPending ? "Saving…" : "Save Draft"}</Btn>
                {minutesForm.status === "draft" && (
                  <Btn variant="primary" onClick={() => submitMinutes.mutate()}>{submitMinutes.isPending ? "Submitting…" : "Submit for Approval"}</Btn>
                )}
                {minutesForm.status === "pending_approval" && (
                  <Btn variant="success" onClick={() => approveMinutes.mutate()}>{approveMinutes.isPending ? "Approving…" : "✓ Approve Minutes"}</Btn>
                )}
              </div>
            </div>
          </>
        )}
      </Modal>

      {/* ── Schedule / Edit Meeting Modal ───────────────────────────── */}
      <Modal open={modal} onClose={closeModal} title={editingId ? "Edit Meeting" : "Schedule New Meeting"} size="lg">
        <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Meeting Title" required>
              <FInput placeholder="e.g. Q2 Board Meeting 2025" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
            </FormField>
            <FormField label="Linked Committee (optional)">
              <FSelect
                options={["", ...committeeList.map((c: any) => c.name)]}
                value={committeeList.find((c: any) => c._id === form.committeeId)?.name || ""}
                onChange={(e) => {
                  const c = committeeList.find((x: any) => x.name === e.target.value);
                  setForm((p) => ({ ...p, committeeId: c?._id || "", chairperson: c?.chairperson || p.chairperson, attendees: c ? (c.members || []).map((m: any) => m.name) : p.attendees }));
                }}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <FormField label="Meeting Type">
              <FSelect options={["board", "committee", "staff", "parent", "emergency", "other"]} value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))} />
            </FormField>
            <FormField label="Category">
              <FSelect
                options={["Regular", "Emergency", "Special", "Agm"]}
                value={form.category[0].toUpperCase() + form.category.slice(1)}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value.toLowerCase() }))}
              />
            </FormField>
            <FormField label="Duration (mins)">
              <FInput type="number" value={form.durationMinutes} onChange={(e) => setForm((p) => ({ ...p, durationMinutes: Number(e.target.value) }))} />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Date" required>
              <FInput type="date" value={form.scheduledDate} onChange={(e) => setForm((p) => ({ ...p, scheduledDate: e.target.value }))} />
            </FormField>
            <FormField label="Time">
              <FInput type="time" value={form.scheduledTime} onChange={(e) => setForm((p) => ({ ...p, scheduledTime: e.target.value }))} />
            </FormField>
          </div>

          <FormField label="Meeting Mode">
            <div className="flex gap-2">
              {(["in_person", "virtual", "hybrid"] as const).map((mode) => (
                <button key={mode} onClick={() => setForm((p) => ({ ...p, mode }))}
                  className={`flex-1 py-2 rounded-lg border text-xs font-medium capitalize ${form.mode === mode ? "bg-blue-50 text-[#0C447C] border-[#0C447C]" : "bg-white text-slate-500 border-slate-200"}`}>
                  {mode.replace("_", "-")}
                </button>
              ))}
            </div>
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            {form.mode !== "virtual" && (
              <FormField label="Venue">
                <FInput placeholder="e.g. Boardroom A – Main Campus" value={form.venue} onChange={(e) => setForm((p) => ({ ...p, venue: e.target.value }))} />
              </FormField>
            )}
            {form.mode !== "in_person" && (
              <FormField label="Meeting Link">
                <FInput placeholder="https://meet.google.com/…" value={form.meetingLink} onChange={(e) => setForm((p) => ({ ...p, meetingLink: e.target.value }))} />
              </FormField>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Chairperson">
              <FInput value={form.chairperson} onChange={(e) => setForm((p) => ({ ...p, chairperson: e.target.value }))} placeholder="Full name" />
            </FormField>
            <FormField label="Minute Taker">
              <FInput value={form.minuteTaker} onChange={(e) => setForm((p) => ({ ...p, minuteTaker: e.target.value }))} placeholder="Full name" />
            </FormField>
          </div>

          <FormField label={`Attendees (${form.attendees.length})`}>
            {form.committeeId ? (
              <div className="border border-slate-200 rounded-lg p-3 flex flex-wrap gap-2">
                {committeeMembers(form.committeeId).length === 0 && <span className="text-xs text-slate-400">This committee has no members added yet</span>}
                {committeeMembers(form.committeeId).map((m: any) => (
                  <label key={m.name} className="flex items-center gap-1.5 text-xs bg-slate-50 border border-slate-200 rounded-full px-2.5 py-1 cursor-pointer">
                    <input type="checkbox" checked={form.attendees.includes(m.name)}
                      onChange={() => setForm((p) => ({ ...p, attendees: p.attendees.includes(m.name) ? p.attendees.filter((x) => x !== m.name) : [...p.attendees, m.name] }))}
                      className="accent-[#0C447C]" />
                    {m.name}
                  </label>
                ))}
              </div>
            ) : (
              <div className="border border-slate-200 rounded-lg p-3">
                <div className="flex gap-2 mb-2">
                  <FInput placeholder="Add attendee name…" value={form.attendeeInput} onChange={(e) => setForm((p) => ({ ...p, attendeeInput: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (form.attendeeInput.trim()) setForm((p) => ({ ...p, attendees: [...p.attendees, p.attendeeInput.trim()], attendeeInput: "" })); } }} />
                  <Btn variant="secondary" size="sm" onClick={() => { if (form.attendeeInput.trim()) setForm((p) => ({ ...p, attendees: [...p.attendees, p.attendeeInput.trim()], attendeeInput: "" })); }}>＋ Add</Btn>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {form.attendees.map((a) => (
                    <span key={a} className="inline-flex items-center gap-1 px-2 py-1 bg-slate-50 text-slate-600 text-xs rounded-full">
                      {a}
                      <button onClick={() => setForm((p) => ({ ...p, attendees: p.attendees.filter((x) => x !== a) }))} className="text-slate-400 hover:text-slate-700">×</button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </FormField>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Agenda</span>
              <span className="text-[11px] text-slate-400">
                {form.agendaItems.length} item{form.agendaItems.length !== 1 ? "s" : ""}
                {form.agendaItems.some((i) => i.durationMinutes) && ` · ${form.agendaItems.reduce((s, i) => s + (i.durationMinutes || 0), 0)} min planned`}
              </span>
            </div>
            <div className="space-y-2">
              {form.agendaItems.map((item, i) => (
                <div key={i} className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-bold text-slate-400 mt-2 w-4">{i + 1}.</span>
                    <div className="flex-1 space-y-2">
                      <div className="grid grid-cols-[1fr,auto] gap-2">
                        <FInput placeholder="Agenda topic…" value={item.topic}
                          onChange={(e) => setForm((p) => ({ ...p, agendaItems: p.agendaItems.map((x, j) => j === i ? { ...x, topic: e.target.value } : x) }))} />
                        <div className="flex gap-1">
                          <button onClick={() => setForm((p) => ({ ...p, agendaItems: p.agendaItems.map((x, j) => j === i - 1 ? p.agendaItems[i] : j === i ? p.agendaItems[i - 1] : x).map((x, j) => ({ ...x, order: j })) }))}
                            disabled={i === 0} className="px-2 text-slate-400 hover:text-slate-700 disabled:opacity-30">↑</button>
                          <button onClick={() => setForm((p) => ({ ...p, agendaItems: p.agendaItems.map((x, j) => j === i + 1 ? p.agendaItems[i] : j === i ? p.agendaItems[i + 1] : x).map((x, j) => ({ ...x, order: j })) }))}
                            disabled={i === form.agendaItems.length - 1} className="px-2 text-slate-400 hover:text-slate-700 disabled:opacity-30">↓</button>
                          <button onClick={() => setForm((p) => ({ ...p, agendaItems: p.agendaItems.filter((_, j) => j !== i).map((x, j) => ({ ...x, order: j })) }))}
                            className="px-2 text-red-400 hover:text-red-600">✕</button>
                        </div>
                      </div>
                      <textarea className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C] resize-none" rows={1}
                        placeholder="Details (optional)…" value={item.description}
                        onChange={(e) => setForm((p) => ({ ...p, agendaItems: p.agendaItems.map((x, j) => j === i ? { ...x, description: e.target.value } : x) }))} />
                      <div className="grid grid-cols-3 gap-2">
                        <FInput placeholder="Presenter" value={item.presenter}
                          onChange={(e) => setForm((p) => ({ ...p, agendaItems: p.agendaItems.map((x, j) => j === i ? { ...x, presenter: e.target.value } : x) }))} />
                        <FInput type="number" placeholder="Minutes" value={item.durationMinutes || ""}
                          onChange={(e) => setForm((p) => ({ ...p, agendaItems: p.agendaItems.map((x, j) => j === i ? { ...x, durationMinutes: Number(e.target.value) } : x) }))} />
                        <FSelect
                          options={AGENDA_ITEM_TYPES.map((t) => t.label)}
                          value={AGENDA_ITEM_TYPES.find((t) => t.value === item.itemType)?.label || "Discussion"}
                          onChange={(e) => setForm((p) => ({ ...p, agendaItems: p.agendaItems.map((x, j) => j === i ? { ...x, itemType: AGENDA_ITEM_TYPES.find((t) => t.label === e.target.value)?.value || "discussion" } : x) }))}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {form.agendaItems.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-3 border border-dashed border-slate-200 rounded-lg">No agenda items yet — add at least one below</p>
              )}
            </div>
            <Btn variant="secondary" size="sm" className="mt-2"
              onClick={() => setForm((p) => ({ ...p, agendaItems: [...p.agendaItems, { order: p.agendaItems.length, topic: "", description: "", presenter: "", durationMinutes: 10, itemType: "discussion" }] }))}>
              ＋ Add Agenda Item
            </Btn>
          </div>

          <FormField label="Additional Notes (optional)">
            <textarea className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C] resize-none" rows={2}
              placeholder="Anything else attendees should know…" value={form.agenda} onChange={(e) => setForm((p) => ({ ...p, agenda: e.target.value }))} />
          </FormField>
        </div>
        <div className="p-5 border-t border-slate-100 flex justify-end gap-2">
          <Btn variant="secondary" onClick={closeModal}>Cancel</Btn>
          <Btn variant="primary" onClick={handleSave}>{saveMeeting.isPending ? "Saving…" : editingId ? "✓ Save Changes" : "📅 Schedule Meeting"}</Btn>
        </div>
      </Modal>
    </div>
  );
}
