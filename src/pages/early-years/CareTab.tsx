import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Card, Btn } from "./shared";
import eceService from "../../services/ece.service";

const MOODS = [
  { value: "happy", icon: "😊" }, { value: "calm", icon: "🙂" }, { value: "upset", icon: "😟" },
  { value: "tired", icon: "😴" }, { value: "unwell", icon: "🤒" },
];

export default function CareTab({ child }: { child: any }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<any>({
    date: new Date().toISOString().slice(0, 10), arrivalMood: "", departureMood: "",
    meals: [], waterIntake: "", healthObservation: "", comfortingNotes: "",
    minorInjuries: [],
  });

  const { data: records = [], isLoading } = useQuery({ queryKey: ["ece-care-records", child._id], queryFn: () => eceService.getCareRecords(child._id) });
  const { data: allergyData } = useQuery({ queryKey: ["ece-allergies", child._id], queryFn: () => eceService.getStudentAllergies(child._id) });

  const createRecord = useMutation({
    mutationFn: () => eceService.createCareRecord({ studentId: child._id, ...form }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ece-care-records", child._id] });
      toast.success("Care record saved");
      setShowForm(false);
      setForm({ date: new Date().toISOString().slice(0, 10), arrivalMood: "", departureMood: "", meals: [], waterIntake: "", healthObservation: "", comfortingNotes: "", minorInjuries: [] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to save"),
  });

  function toggleMeal(type: string, amountEaten: string) {
    setForm((p: any) => ({
      ...p,
      meals: [...p.meals.filter((m: any) => m.type !== type), { type, amountEaten }],
    }));
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
        <Btn size="sm" onClick={() => setShowForm((v) => !v)}>{showForm ? "Cancel" : "+ Log Today's Care"}</Btn>
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
            <Btn onClick={() => createRecord.mutate()} disabled={createRecord.isPending}>
              {createRecord.isPending ? "Saving…" : "Save Care Record"}
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
                <div className="flex gap-2 text-sm">
                  {r.arrivalMood && <span title="Arrival">{MOODS.find((m) => m.value === r.arrivalMood)?.icon}</span>}
                  {r.departureMood && <span title="Departure">→ {MOODS.find((m) => m.value === r.departureMood)?.icon}</span>}
                </div>
              </div>
              {r.meals?.length > 0 && (
                <p className="text-xs text-slate-500">
                  {r.meals.map((m: any) => `${m.type}: ${m.amountEaten.replace("_", " ")}`).join(" · ")}
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
