import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Card, Btn, FormField, FInput, FSelect } from "./shared";
import eceService from "../../services/ece.service";

const AREAS = [
  { value: "practical_life", label: "Practical Life" },
  { value: "sensorial", label: "Sensorial" },
  { value: "language", label: "Language" },
  { value: "mathematics", label: "Mathematics" },
  { value: "culture", label: "Culture" },
];

const EMPTY_FORM = {
  name: "", area: "sensorial", ageRangeLabel: "", prerequisites: "", directAim: "", indirectAim: "",
  presentationSteps: "", controlOfError: "", pointsOfInterest: "", vocabulary: "", extensions: "",
};

export default function MontessoriTab() {
  const queryClient = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filterArea, setFilterArea] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: materials = [], isLoading } = useQuery({ queryKey: ["montessori-materials"], queryFn: () => eceService.getMontessoriMaterials() });

  const seedClassics = useMutation({
    mutationFn: eceService.seedClassicMontessoriMaterials,
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["montessori-materials"] });
      toast.success(res.message);
    },
  });

  const createMaterial = useMutation({
    mutationFn: () => eceService.createMontessoriMaterial({
      ...form,
      presentationSteps: form.presentationSteps.split(",").map((s) => s.trim()).filter(Boolean),
      pointsOfInterest: form.pointsOfInterest.split(",").map((s) => s.trim()).filter(Boolean),
      vocabulary: form.vocabulary.split(",").map((s) => s.trim()).filter(Boolean),
      extensions: form.extensions.split(",").map((s) => s.trim()).filter(Boolean),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["montessori-materials"] });
      toast.success("Material added");
      setShowNew(false);
      setForm(EMPTY_FORM);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to save"),
  });

  const filtered = (materials as any[]).filter((m) => !filterArea || m.area === filterArea);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Montessori Materials</h2>
          <p className="text-sm text-slate-500">{(materials as any[]).length} materials in the library</p>
        </div>
        <div className="flex gap-2">
          {(materials as any[]).length === 0 && (
            <Btn variant="secondary" onClick={() => seedClassics.mutate()} disabled={seedClassics.isPending}>
              {seedClassics.isPending ? "Seeding…" : "+ Seed Classic Materials"}
            </Btn>
          )}
          <Btn onClick={() => setShowNew((v) => !v)}>{showNew ? "Cancel" : "+ Add Material"}</Btn>
        </div>
      </div>

      <div className="flex gap-1.5 mb-4">
        <button onClick={() => setFilterArea("")} className={`px-2.5 py-1 text-xs rounded-full border ${!filterArea ? "bg-[#0C447C] text-white border-[#0C447C]" : "bg-white text-slate-600 border-slate-200"}`}>All</button>
        {AREAS.map((a) => (
          <button key={a.value} onClick={() => setFilterArea(a.value)} className={`px-2.5 py-1 text-xs rounded-full border ${filterArea === a.value ? "bg-[#0C447C] text-white border-[#0C447C]" : "bg-white text-slate-600 border-slate-200"}`}>
            {a.label}
          </button>
        ))}
      </div>

      {showNew && (
        <Card className="p-5 mb-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Name" required>
              <FInput value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Pink Tower" />
            </FormField>
            <FormField label="Area" required>
              <FSelect options={AREAS.map((a) => a.label)} value={AREAS.find((a) => a.value === form.area)?.label} onChange={(e) => setForm((p) => ({ ...p, area: AREAS.find((a) => a.label === e.target.value)?.value || "sensorial" }))} />
            </FormField>
          </div>
          <FormField label="Age Range">
            <FInput value={form.ageRangeLabel} onChange={(e) => setForm((p) => ({ ...p, ageRangeLabel: e.target.value }))} placeholder="e.g. 2.5-4" />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Direct Aim">
              <FInput value={form.directAim} onChange={(e) => setForm((p) => ({ ...p, directAim: e.target.value }))} />
            </FormField>
            <FormField label="Indirect Aim">
              <FInput value={form.indirectAim} onChange={(e) => setForm((p) => ({ ...p, indirectAim: e.target.value }))} />
            </FormField>
          </div>
          <FormField label="Control of Error">
            <FInput value={form.controlOfError} onChange={(e) => setForm((p) => ({ ...p, controlOfError: e.target.value }))} />
          </FormField>
          <FormField label="Presentation Steps (comma-separated)">
            <FInput value={form.presentationSteps} onChange={(e) => setForm((p) => ({ ...p, presentationSteps: e.target.value }))} />
          </FormField>
          <div className="flex justify-end mt-2">
            <Btn onClick={() => createMaterial.mutate()} disabled={!form.name || createMaterial.isPending}>
              {createMaterial.isPending ? "Saving…" : "Save Material"}
            </Btn>
          </div>
        </Card>
      )}

      {isLoading ? (
        <div className="text-center py-16 text-slate-400">Loading…</div>
      ) : filtered.length === 0 ? (
        <Card className="p-16 text-center">
          <div className="text-5xl mb-4">🌸</div>
          <p className="font-semibold text-slate-700 mb-1">No materials yet</p>
          <p className="text-sm text-slate-400">Seed the six classics, or add your own.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {filtered.map((m: any) => {
            const isExpanded = expanded === m._id;
            return (
              <Card key={m._id} className="p-4">
                <button onClick={() => setExpanded(isExpanded ? null : m._id)} className="w-full text-left">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm text-slate-800">{m.name}</p>
                    <span className="text-xs text-slate-400">{m.ageRangeLabel}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 capitalize">{m.area.replace("_", " ")}</p>
                </button>
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                    {m.directAim && <p><span className="font-semibold">Direct Aim:</span> {m.directAim}</p>}
                    {m.indirectAim && <p><span className="font-semibold">Indirect Aim:</span> {m.indirectAim}</p>}
                    {m.controlOfError && <p><span className="font-semibold">Control of Error:</span> {m.controlOfError}</p>}
                    {m.presentationSteps?.length > 0 && (
                      <div>
                        <span className="font-semibold">Presentation Steps:</span>
                        <ol className="list-decimal ml-4 mt-1">
                          {m.presentationSteps.map((s: string, i: number) => <li key={i}>{s}</li>)}
                        </ol>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
