import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Card, Btn } from "./shared";
import eceService from "../../services/ece.service";

const MOODS = [
  { value: "happy", icon: "😊" }, { value: "calm", icon: "🙂" }, { value: "upset", icon: "😟" },
  { value: "tired", icon: "😴" }, { value: "unwell", icon: "🤒" },
];

const EMPTY_CARE_FORM = {
  date: new Date().toISOString().slice(0, 10), arrivalMood: "", departureMood: "",
  meals: [] as any[], waterIntake: "", healthObservation: "", comfortingNotes: "",
  naps: [] as any[], toileting: [] as any[], medicationGiven: [] as any[], minorInjuries: [] as any[],
};

export default function CareTab({ child }: { child: any }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<any>(EMPTY_CARE_FORM);

  const { data: records = [], isLoading } = useQuery({ queryKey: ["ece-care-records", child._id], queryFn: () => eceService.getCareRecords(child._id) });
  const { data: allergyData } = useQuery({ queryKey: ["ece-allergies", child._id], queryFn: () => eceService.getStudentAllergies(child._id) });

  const saveRecord = useMutation({
    mutationFn: () => editingId
      ? eceService.updateCareRecord(editingId, form)
      : eceService.createCareRecord({ studentId: child._id, ...form }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ece-care-records", child._id] });
      toast.success(editingId ? "Care record updated" : "Care record saved");
      closeForm();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to save"),
  });

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_CARE_FORM);
  }

  function startEdit(r: any) {
    setForm({
      date: new Date(r.date).toISOString().slice(0, 10),
      arrivalMood: r.arrivalMood || "", departureMood: r.departureMood || "",
      meals: r.meals || [], waterIntake: r.waterIntake || "",
      healthObservation: r.healthObservation || "", comfortingNotes: r.comfortingNotes || "",
      naps: r.naps || [], toileting: r.toileting || [], medicationGiven: r.medicationGiven || [],
      minorInjuries: r.minorInjuries || [],
    });
    setEditingId(r._id);
    setShowForm(true);
  }

  function toggleMeal(type: string, amountEaten: string) {
    setForm((p: any) => ({
      ...p,
      meals: [...p.meals.filter((m: any) => m.type !== type), { type, amountEaten }],
    }));
  }

  function addNap() {
    setForm((p: any) => ({ ...p, naps: [...p.naps, { startTime: "", endTime: "", quality: "" }] }));
  }
  function updateNap(i: number, field: string, value: string) {
    setForm((p: any) => ({ ...p, naps: p.naps.map((n: any, idx: number) => (idx === i ? { ...n, [field]: value } : n)) }));
  }
  function removeNap(i: number) {
    setForm((p: any) => ({ ...p, naps: p.naps.filter((_: any, idx: number) => idx !== i) }));
  }

  function addToileting() {
    setForm((p: any) => ({ ...p, toileting: [...p.toileting, { time: "", type: "wet", notes: "" }] }));
  }
  function updateToileting(i: number, field: string, value: string) {
    setForm((p: any) => ({ ...p, toileting: p.toileting.map((t: any, idx: number) => (idx === i ? { ...t, [field]: value } : t)) }));
  }
  function removeToileting(i: number) {
    setForm((p: any) => ({ ...p, toileting: p.toileting.filter((_: any, idx: number) => idx !== i) }));
  }

  function addMedication() {
    setForm((p: any) => ({ ...p, medicationGiven: [...p.medicationGiven, { name: "", dose: "", time: "", givenBy: "" }] }));
  }
  function updateMedication(i: number, field: string, value: string) {
    setForm((p: any) => ({ ...p, medicationGiven: p.medicationGiven.map((m: any, idx: number) => (idx === i ? { ...m, [field]: value } : m)) }));
  }
  function removeMedication(i: number) {
    setForm((p: any) => ({ ...p, medicationGiven: p.medicationGiven.filter((_: any, idx: number) => idx !== i) }));
  }

  return (
    <div>
      {(allergyData?.allergies?.length ?? 0) > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
          <p className="text-xs font-semibold text-red-700">⚠ Known Allergies</p>
          <p className="text-xs text-red-600 mt-0.5">{allergyData.allergies.join(", ")}</p>
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-slate-700">Care & Wellbeing</p>
        <Btn size="sm" onClick={() => (showForm ? closeForm() : setShowForm(true))}>{showForm ? "Cancel" : "+ Log Today's Care"}</Btn>
      </div>

      {showForm && (
        <Card className="p-4 mb-4">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1">Arrival Mood</p>
              <div className="flex gap-1.5">
                {MOODS.map((m) => (
                  <button key={m.value} onClick={() => setForm((p: any) => ({ ...p, arrivalMood: m.value }))}
                    className={`text-lg p-1.5 rounded-lg ${form.arrivalMood === m.value ? "bg-blue-100" : "hover:bg-slate-50"}`}>
                    {m.icon}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1">Departure Mood</p>
              <div className="flex gap-1.5">
                {MOODS.map((m) => (
                  <button key={m.value} onClick={() => setForm((p: any) => ({ ...p, departureMood: m.value }))}
                    className={`text-lg p-1.5 rounded-lg ${form.departureMood === m.value ? "bg-blue-100" : "hover:bg-slate-50"}`}>
                    {m.icon}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <p className="text-xs font-semibold text-slate-500 mb-1">Meals</p>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {["breakfast", "lunch", "snack"].map((type) => (
              <div key={type}>
                <p className="text-xs text-slate-600 capitalize mb-1">{type}</p>
                <select
                  value={form.meals.find((m: any) => m.type === type)?.amountEaten || ""}
                  onChange={(e) => toggleMeal(type, e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white"
                >
                  <option value="">Not offered</option>
                  <option value="all">Ate all</option>
                  <option value="most">Ate most</option>
                  <option value="some">Ate some</option>
                  <option value="none">Ate none</option>
                  <option value="refused">Refused</option>
                </select>
              </div>
            ))}
          </div>

          <div className="mb-3">
            <p className="text-xs font-semibold text-slate-500 mb-1">Water Intake</p>
            <select value={form.waterIntake} onChange={(e) => setForm((p: any) => ({ ...p, waterIntake: e.target.value }))} className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white">
              <option value="">Not recorded</option>
              <option value="good">Good</option>
              <option value="adequate">Adequate</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold text-slate-500">Naps</p>
              <button onClick={addNap} className="text-xs text-[#0C447C] font-medium">+ Add nap</button>
            </div>
            {form.naps.map((n: any, i: number) => (
              <div key={i} className="grid grid-cols-4 gap-1.5 mb-1.5 items-center">
                <input type="time" value={n.startTime} onChange={(e) => updateNap(i, "startTime", e.target.value)}
                  className="text-xs border border-slate-200 rounded-lg px-2 py-1.5" />
                <input type="time" value={n.endTime} onChange={(e) => updateNap(i, "endTime", e.target.value)}
                  className="text-xs border border-slate-200 rounded-lg px-2 py-1.5" />
                <select value={n.quality} onChange={(e) => updateNap(i, "quality", e.target.value)}
                  className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white">
                  <option value="">Quality…</option>
                  <option value="restful">Restful</option>
                  <option value="restless">Restless</option>
                  <option value="none">Didn't sleep</option>
                </select>
                <button onClick={() => removeNap(i)} className="text-slate-300 hover:text-red-500 text-xs">✕ Remove</button>
              </div>
            ))}
          </div>

          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold text-slate-500">Toileting</p>
              <button onClick={addToileting} className="text-xs text-[#0C447C] font-medium">+ Add entry</button>
            </div>
            {form.toileting.map((t: any, i: number) => (
              <div key={i} className="grid grid-cols-4 gap-1.5 mb-1.5 items-center">
                <input type="time" value={t.time} onChange={(e) => updateToileting(i, "time", e.target.value)}
                  className="text-xs border border-slate-200 rounded-lg px-2 py-1.5" />
                <select value={t.type} onChange={(e) => updateToileting(i, "type", e.target.value)}
                  className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white">
                  <option value="wet">Wet</option>
                  <option value="dry">Dry</option>
                  <option value="bm">BM</option>
                  <option value="accident">Accident</option>
                </select>
                <input value={t.notes} onChange={(e) => updateToileting(i, "notes", e.target.value)} placeholder="Notes"
                  className="text-xs border border-slate-200 rounded-lg px-2 py-1.5" />
                <button onClick={() => removeToileting(i)} className="text-slate-300 hover:text-red-500 text-xs">✕ Remove</button>
              </div>
            ))}
          </div>

          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold text-slate-500">Medication Given</p>
              <button onClick={addMedication} className="text-xs text-[#0C447C] font-medium">+ Add medication</button>
            </div>
            {form.medicationGiven.map((m: any, i: number) => (
              <div key={i} className="grid gap-1.5 mb-1.5 items-center" style={{ gridTemplateColumns: "1.2fr 0.8fr 0.8fr 1fr 24px" }}>
                <input value={m.name} onChange={(e) => updateMedication(i, "name", e.target.value)} placeholder="Medication name"
                  className="text-xs border border-slate-200 rounded-lg px-2 py-1.5" />
                <input value={m.dose} onChange={(e) => updateMedication(i, "dose", e.target.value)} placeholder="Dose"
                  className="text-xs border border-slate-200 rounded-lg px-2 py-1.5" />
                <input type="time" value={m.time} onChange={(e) => updateMedication(i, "time", e.target.value)}
                  className="text-xs border border-slate-200 rounded-lg px-2 py-1.5" />
                <input value={m.givenBy} onChange={(e) => updateMedication(i, "givenBy", e.target.value)} placeholder="Given by"
                  className="text-xs border border-slate-200 rounded-lg px-2 py-1.5" />
                <button onClick={() => removeMedication(i)} className="text-slate-300 hover:text-red-500 text-xs">✕</button>
              </div>
            ))}
            {form.medicationGiven.length > 0 && (
              <p className="text-xs text-amber-600 mt-1">⚠ Medication records are compliance-sensitive — confirm name, dose and time are accurate before saving.</p>
            )}
          </div>

          <div className="mb-3">
            <p className="text-xs font-semibold text-slate-500 mb-1">Health Observation</p>
            <input
              value={form.healthObservation}
              onChange={(e) => setForm((p: any) => ({ ...p, healthObservation: e.target.value }))}
              placeholder="e.g. mild cough noticed, temperature normal"
              className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5"
            />
          </div>

          <div className="mb-3">
            <p className="text-xs font-semibold text-slate-500 mb-1">Comforting / General Notes</p>
            <input
              value={form.comfortingNotes}
              onChange={(e) => setForm((p: any) => ({ ...p, comfortingNotes: e.target.value }))}
              placeholder="Anything else worth noting today"
              className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5"
            />
          </div>

          <div className="flex justify-end">
            <Btn onClick={() => saveRecord.mutate()} disabled={saveRecord.isPending}>
              {saveRecord.isPending ? "Saving…" : editingId ? "Update Care Record" : "Save Care Record"}
            </Btn>
          </div>
        </Card>
      )}

      {isLoading ? (
        <p className="text-sm text-slate-400 text-center py-10">Loading…</p>
      ) : (records as any[]).length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-10">No care records logged yet.</p>
      ) : (
        <div className="space-y-2">
          {(records as any[]).map((r: any) => (
            <Card key={r._id} className="p-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold text-slate-700">{new Date(r.date).toLocaleDateString()}</p>
                <div className="flex items-center gap-2">
                  <div className="flex gap-2 text-sm">
                    {r.arrivalMood && <span title="Arrival">{MOODS.find((m) => m.value === r.arrivalMood)?.icon}</span>}
                    {r.departureMood && <span title="Departure">→ {MOODS.find((m) => m.value === r.departureMood)?.icon}</span>}
                  </div>
                  <button onClick={() => startEdit(r)} className="text-xs text-[#0C447C] font-medium hover:underline">Edit</button>
                </div>
              </div>
              {r.meals?.length > 0 && (
                <p className="text-xs text-slate-500">
                  {r.meals.map((m: any) => `${m.type}: ${m.amountEaten.replace("_", " ")}`).join(" · ")}
                </p>
              )}
              {r.naps?.length > 0 && (
                <p className="text-xs text-slate-500 mt-1">
                  😴 {r.naps.map((n: any) => `${n.startTime || "?"}–${n.endTime || "?"}${n.quality ? ` (${n.quality})` : ""}`).join(" · ")}
                </p>
              )}
              {r.toileting?.length > 0 && (
                <p className="text-xs text-slate-500 mt-1">
                  🚻 {r.toileting.map((t: any) => `${t.time} ${t.type}`).join(" · ")}
                </p>
              )}
              {r.medicationGiven?.length > 0 && (
                <p className="text-xs text-purple-700 mt-1">
                  💊 {r.medicationGiven.map((m: any) => `${m.name}${m.dose ? ` ${m.dose}` : ""} @ ${m.time} (by ${m.givenBy})`).join(" · ")}
                </p>
              )}
              {r.healthObservation && <p className="text-xs text-amber-600 mt-1">⚠ {r.healthObservation}</p>}
              {r.comfortingNotes && <p className="text-xs text-slate-500 mt-1">{r.comfortingNotes}</p>}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
