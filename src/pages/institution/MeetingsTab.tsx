import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  MONTHS, STATUS_COLORS,
  Badge, Btn, Card, FInput, FSelect, FormField, Modal, PageHeader,
} from "./shared";
import organizationService from "../../services/organization.service";

const EMPTY_FORM = { title: "", type: "staff", scheduledDate: "", scheduledTime: "", venue: "", agenda: "" };

function capitalize(s: string) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

export default function MeetingsTab({ initialModal = false }: { initialModal?: boolean }) {
  const [view, setView] = useState<"list" | "calendar">("list");
  const [modal, setModal] = useState(initialModal);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const queryClient = useQueryClient();

  const { data: meetings = [], isLoading } = useQuery({
    queryKey: ["meetings"],
    queryFn: organizationService.getMeetings,
  });

  const createMeeting = useMutation({
    mutationFn: organizationService.createMeeting,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      toast.success("Meeting scheduled");
      setModal(false);
      setForm({ ...EMPTY_FORM });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed"),
  });

  const items = meetings as any[];

  function handleSave() {
    if (!form.title.trim()) { toast.error("Meeting title is required"); return; }
    if (!form.scheduledDate) { toast.error("Date is required"); return; }
    const scheduledAt = form.scheduledTime
      ? `${form.scheduledDate}T${form.scheduledTime}:00`
      : `${form.scheduledDate}T09:00:00`;
    createMeeting.mutate({ title: form.title, type: form.type, scheduledAt, venue: form.venue, agenda: form.agenda });
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
              <Card key={m._id} className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-blue-50 rounded-xl flex flex-col items-center justify-center flex-shrink-0 border border-blue-100">
                    <span className="text-[#0C447C] font-bold text-lg leading-none">{d.getDate()}</span>
                    <span className="text-blue-400 text-xs">{MONTHS[d.getMonth()]}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-semibold text-slate-900 text-sm">{m.title}</h3>
                      <Badge status={capitalize(m.status)} />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span>👥 {m.type}</span>
                      <span>🕐 {d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      <span>📍 {m.venue || "—"}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {m.status !== "completed" && (
                      <>
                        <button className="px-3 py-1.5 text-xs bg-blue-50 text-[#0C447C] rounded-lg hover:bg-blue-100 font-medium">View Agenda</button>
                        <button className="px-3 py-1.5 text-xs bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 font-medium">Edit</button>
                      </>
                    )}
                    {m.status === "completed" && (
                      <button className="px-3 py-1.5 text-xs bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 font-medium">📝 Minutes</button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-5">
          <div className="text-center text-slate-500 text-sm mb-4 font-semibold">May 2025</div>
          <div className="grid grid-cols-7 gap-0.5 mb-2">
            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
              <div key={d} className="text-center text-xs font-medium text-slate-400 py-2">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: 35 }, (_, i) => {
              const day = i - 1;
              const isCurrentMonth = day >= 1 && day <= 31;
              const meetingOnDay = items.find((m: any) => new Date(m.scheduledAt).getDate() === day);
              return (
                <div key={i} className={`min-h-[52px] p-1 rounded-lg text-xs ${isCurrentMonth ? "bg-white hover:bg-slate-50 cursor-pointer" : "opacity-30"} ${day === 15 ? "ring-2 ring-[#0C447C]" : ""}`}>
                  {isCurrentMonth && (
                    <>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-0.5 ${day === 15 ? "bg-[#0C447C] text-white" : "text-slate-600"}`}>{day}</div>
                      {meetingOnDay && (
                        <div className={`text-xs rounded px-1 py-0.5 truncate ${STATUS_COLORS[capitalize(meetingOnDay.status)] ?? "bg-blue-50 text-[#0C447C]"}`} style={{ fontSize: "10px" }}>
                          {meetingOnDay.title.split(" ")[0]}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <Modal open={modal} onClose={closeModal} title="Schedule New Meeting" size="lg">
        <div className="p-5 grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <FormField label="Meeting Title" required>
              <FInput placeholder="e.g. Q2 Board Meeting 2025" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
            </FormField>
          </div>
          <FormField label="Meeting Type">
            <FSelect options={["board", "committee", "staff", "parent", "emergency", "other"]} value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))} />
          </FormField>
          <FormField label="Committee / Board" required>
            <FSelect options={["Board of Directors", "Shariah Advisory Board", "Academic Committee", "Finance Committee", "HR Committee"]} />
          </FormField>
          <FormField label="Date" required>
            <FInput type="date" value={form.scheduledDate} onChange={(e) => setForm((p) => ({ ...p, scheduledDate: e.target.value }))} />
          </FormField>
          <FormField label="Time" required>
            <FInput type="time" value={form.scheduledTime} onChange={(e) => setForm((p) => ({ ...p, scheduledTime: e.target.value }))} />
          </FormField>
          <FormField label="Venue">
            <FInput placeholder="e.g. Boardroom A – Main Campus" value={form.venue} onChange={(e) => setForm((p) => ({ ...p, venue: e.target.value }))} />
          </FormField>
          <FormField label="Online Meeting Link"><FInput placeholder="https://meet.google.com/…" /></FormField>
          <div className="col-span-2">
            <FormField label="Agenda">
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                {["Opening & Recitation", "Minutes of Previous Meeting", "Financial Review Q2", "Policy Updates", "Any Other Business"].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 p-2.5 border-b border-slate-100 last:border-b-0">
                    <span className="w-5 h-5 bg-blue-50 text-[#0C447C] text-xs rounded-full flex items-center justify-center font-bold">{i + 1}</span>
                    <FInput defaultValue={item} />
                    <button className="text-red-400 hover:text-red-600 text-xs">✗</button>
                  </div>
                ))}
                <div className="p-2">
                  <button className="text-xs text-[#0C447C] hover:text-[#0b3d6e] flex items-center gap-1">＋ Add agenda item</button>
                </div>
              </div>
            </FormField>
          </div>
          <FormField label="Attachments">
            <div className="border-2 border-dashed border-slate-200 rounded-lg p-3 text-center cursor-pointer hover:border-[#0C447C]">
              <span className="text-slate-400 text-sm">📎 Drag files here or click to upload</span>
            </div>
          </FormField>
          <FormField label="Status"><FSelect options={["Upcoming", "Scheduled", "Cancelled"]} /></FormField>
        </div>
        <div className="p-5 border-t border-slate-100 flex justify-end gap-2">
          <Btn variant="secondary" onClick={closeModal}>Cancel</Btn>
          <Btn variant="ghost">💾 Save Draft</Btn>
          <Btn variant="primary" onClick={handleSave}>{createMeeting.isPending ? "Scheduling…" : "📅 Schedule Meeting"}</Btn>
        </div>
      </Modal>
    </div>
  );
}
