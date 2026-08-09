import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Card, Btn } from "./shared";
import eceService from "../../services/ece.service";
import organizationService from "../../services/organization.service";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function mondayOf(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // snap back to Monday
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

export default function WeeklyPlanTab() {
  const queryClient = useQueryClient();
  const [gradeLevel, setGradeLevel] = useState("");
  const [sectionName, setSectionName] = useState("");
  const [weekStartDate, setWeekStartDate] = useState(mondayOf(new Date()));
  const [pickerForDay, setPickerForDay] = useState<number | null>(null);

  const { data: grades = [] } = useQuery({ queryKey: ["ece-grades"], queryFn: () => organizationService.getGrades() });
  const { data: experiences = [] } = useQuery({ queryKey: ["ece-experiences"], queryFn: () => eceService.getExperiences() });
  const { data: plan, isLoading } = useQuery({
    queryKey: ["ece-weekly-plan", gradeLevel, sectionName, weekStartDate],
    queryFn: () => eceService.getWeeklyPlan(gradeLevel, sectionName, weekStartDate),
    enabled: !!gradeLevel,
  });

  const sections = (grades as any[]).find((g: any) => g.name === gradeLevel)?.sections || [];
  const plannedExperiences: any[] = plan?.plannedExperiences || [];

  const savePlan = useMutation({
    mutationFn: (updated: { day: number; experienceId: string; notes?: string }[]) =>
      eceService.upsertWeeklyPlan({ gradeLevel, sectionName, weekStartDate, plannedExperiences: updated }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ece-weekly-plan", gradeLevel, sectionName, weekStartDate] });
      queryClient.invalidateQueries({ queryKey: ["ece-experiences"] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to save"),
  });

  function addExperience(day: number, experienceId: string) {
    const current = plannedExperiences.map((p: any) => ({
      day: p.day, experienceId: p.experienceId?._id || p.experienceId, notes: p.notes,
    }));
    savePlan.mutate([...current, { day, experienceId }]);
    setPickerForDay(null);
  }

  function removeExperience(day: number, experienceId: string) {
    const current = plannedExperiences
      .map((p: any) => ({ day: p.day, experienceId: p.experienceId?._id || p.experienceId, notes: p.notes }))
      .filter((p) => !(p.day === day && p.experienceId === experienceId));
    savePlan.mutate(current);
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-900">Weekly Provision Plan</h2>
        <p className="text-sm text-slate-500">Pick real experiences from the library into this classroom's week</p>
      </div>

      <div className="flex gap-3 mb-5">
        <select
          value={gradeLevel}
          onChange={(e) => { setGradeLevel(e.target.value); setSectionName(""); }}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0C447C]"
        >
          <option value="">Select grade…</option>
          {(grades as any[]).map((g: any) => <option key={g._id} value={g.name}>{g.name}</option>)}
        </select>
        <select
          value={sectionName}
          onChange={(e) => setSectionName(e.target.value)}
          disabled={!gradeLevel}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0C447C] disabled:bg-slate-50"
        >
          <option value="">Select section…</option>
          {sections.map((s: any) => <option key={s._id} value={s.name}>{s.name}</option>)}
        </select>
        <input
          type="date"
          value={weekStartDate}
          onChange={(e) => setWeekStartDate(mondayOf(new Date(e.target.value)))}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]"
        />
        <span className="text-xs text-slate-400 self-center">Week of {new Date(weekStartDate).toLocaleDateString()}</span>
      </div>

      {!gradeLevel ? (
        <Card className="p-16 text-center">
          <p className="text-sm text-slate-400">Select a grade and section to plan its week.</p>
        </Card>
      ) : isLoading ? (
        <div className="text-center py-16 text-slate-400">Loading…</div>
      ) : (
        <div className="grid grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((day) => {
            const dayItems = plannedExperiences.filter((p: any) => p.day === day);
            return (
              <Card key={day} className="p-3">
                <p className="text-xs font-semibold text-slate-500 uppercase mb-2">{DAY_NAMES[day]}</p>
                <div className="space-y-1.5 min-h-[60px]">
                  {dayItems.map((p: any) => {
                    const exp = typeof p.experienceId === "object" ? p.experienceId : (experiences as any[]).find((e) => e._id === p.experienceId);
                    if (!exp) return null;
                    return (
                      <div key={exp._id} className="flex items-center justify-between px-2 py-1.5 bg-slate-50 rounded-lg text-xs">
                        <span className="text-slate-700 truncate">{exp.title}</span>
                        <button onClick={() => removeExperience(day, exp._id)} className="text-slate-300 hover:text-red-500 shrink-0 ml-1">✕</button>
                      </div>
                    );
                  })}
                </div>
                {pickerForDay === day ? (
                  <div className="mt-2">
                    <select
                      autoFocus
                      onChange={(e) => e.target.value && addExperience(day, e.target.value)}
                      className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded-lg bg-white"
                    >
                      <option value="">Pick from library…</option>
                      {(experiences as any[]).map((e: any) => <option key={e._id} value={e._id}>{e.title}</option>)}
                    </select>
                    <button onClick={() => setPickerForDay(null)} className="text-xs text-slate-400 mt-1">Cancel</button>
                  </div>
                ) : (
                  <button onClick={() => setPickerForDay(day)} className="text-xs text-[#0C447C] font-medium hover:underline mt-2">+ Add</button>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {(experiences as any[]).length === 0 && gradeLevel && (
        <p className="text-xs text-amber-600 mt-3">No experiences in the library yet — add some in the Experience Library tab first.</p>
      )}
    </div>
  );
}
