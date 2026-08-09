import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Card, Btn, FormField, FInput } from "./shared";
import eceService from "../../services/ece.service";

function daysSince(date?: string): number | null {
  if (!date) return null;
  return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
}

export default function EnvironmentTab() {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [provocationDraft, setProvocationDraft] = useState<Record<string, string>>({});
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({});
  const [newArea, setNewArea] = useState("");

  const { data: areas = [], isLoading } = useQuery({ queryKey: ["ece-environment-areas"], queryFn: eceService.getEnvironmentAreas });

  const seedAreas = useMutation({
    mutationFn: eceService.seedDefaultEnvironmentAreas,
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["ece-environment-areas"] });
      toast.success(res.message);
    },
  });

  const createArea = useMutation({
    mutationFn: () => eceService.createEnvironmentArea({ name: newArea }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ece-environment-areas"] });
      toast.success("Area added");
      setNewArea("");
    },
  });

  const updateProvocation = useMutation({
    mutationFn: ({ id, currentProvocation }: { id: string; currentProvocation: string }) =>
      eceService.updateEnvironmentArea(id, { currentProvocation, rotationDate: new Date().toISOString() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ece-environment-areas"] });
      toast.success("Provocation updated — rotation date refreshed");
    },
  });

  const logSafety = useMutation({
    mutationFn: (id: string) => eceService.logSafetyCheck(id, "Staff"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ece-environment-areas"] });
      toast.success("Safety check logged");
    },
  });

  const addNote = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) => eceService.addEnvironmentObservation(id, note),
    onSuccess: (_r, vars) => {
      queryClient.invalidateQueries({ queryKey: ["ece-environment-areas"] });
      setNoteDraft((p) => ({ ...p, [vars.id]: "" }));
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Environment</h2>
          <p className="text-sm text-slate-500">ECE educators plan environments, not just lessons</p>
        </div>
        {(areas as any[]).length === 0 && !isLoading && (
          <Btn onClick={() => seedAreas.mutate()} disabled={seedAreas.isPending}>
            {seedAreas.isPending ? "Seeding…" : "+ Seed Default Areas"}
          </Btn>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-slate-400">Loading…</div>
      ) : (areas as any[]).length === 0 ? (
        <Card className="p-16 text-center">
          <div className="text-5xl mb-4">🏛️</div>
          <p className="font-semibold text-slate-700 mb-1">No environment areas yet</p>
          <p className="text-sm text-slate-400">Seed the default 10 (Practical Life, Sensorial, Language, Maths, Reading Corner...) and customize from there.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {(areas as any[]).map((area: any) => {
            const isExpanded = expanded === area._id;
            const rotationAge = daysSince(area.rotationDate);
            const safetyAge = daysSince(area.lastSafetyCheckDate);
            return (
              <Card key={area._id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-sm text-slate-800">{area.name}</p>
                  <button onClick={() => setExpanded(isExpanded ? null : area._id)} className="text-xs text-[#0C447C] hover:underline">
                    {isExpanded ? "Hide" : "Manage"}
                  </button>
                </div>

                <div className="flex gap-3 text-xs text-slate-400 mb-2">
                  <span className={rotationAge != null && rotationAge > 21 ? "text-amber-600 font-medium" : ""}>
                    {rotationAge != null ? `Rotated ${rotationAge}d ago` : "Never rotated"}
                  </span>
                  <span className={safetyAge != null && safetyAge > 30 ? "text-red-600 font-medium" : ""}>
                    {safetyAge != null ? `Safety check ${safetyAge}d ago` : "No safety check logged"}
                  </span>
                </div>

                {area.currentProvocation && (
                  <p className="text-xs text-slate-600 bg-slate-50 rounded-lg px-2 py-1.5 mb-2">
                    <span className="font-semibold">Current provocation:</span> {area.currentProvocation}
                  </p>
                )}

                {isExpanded && (
                  <div className="mt-2 pt-2 border-t border-slate-100 space-y-2">
                    <FormField label="Update Current Provocation">
                      <div className="flex gap-2">
                        <FInput
                          value={provocationDraft[area._id] ?? area.currentProvocation ?? ""}
                          onChange={(e) => setProvocationDraft((p) => ({ ...p, [area._id]: e.target.value }))}
                          placeholder="What's currently on offer in this area?"
                        />
                        <Btn size="sm" onClick={() => updateProvocation.mutate({ id: area._id, currentProvocation: provocationDraft[area._id] ?? area.currentProvocation ?? "" })}>
                          Save
                        </Btn>
                      </div>
                    </FormField>

                    <div className="flex justify-between items-center">
                      <button onClick={() => logSafety.mutate(area._id)} className="text-xs text-emerald-600 hover:underline">
                        ✓ Log Safety Check
                      </button>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-slate-500 mb-1">Observations</p>
                      {(area.teacherObservations || []).slice(-3).reverse().map((note: string, i: number) => (
                        <p key={i} className="text-xs text-slate-500 py-0.5">{note}</p>
                      ))}
                      <div className="flex gap-2 mt-1">
                        <input
                          value={noteDraft[area._id] || ""}
                          onChange={(e) => setNoteDraft((p) => ({ ...p, [area._id]: e.target.value }))}
                          placeholder="Add a note about this area…"
                          className="flex-1 px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]"
                        />
                        <button
                          onClick={() => noteDraft[area._id] && addNote.mutate({ id: area._id, note: noteDraft[area._id] })}
                          className="text-xs text-[#0C447C] font-medium px-2"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {(areas as any[]).length > 0 && (
        <div className="flex gap-2 mt-4">
          <input
            value={newArea}
            onChange={(e) => setNewArea(e.target.value)}
            placeholder="Add a custom area…"
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C] flex-1"
          />
          <Btn onClick={() => createArea.mutate()} disabled={!newArea}>+ Add Area</Btn>
        </div>
      )}
    </div>
  );
}
