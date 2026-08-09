import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Card, CardHeader, Btn, FormField, FInput } from "./shared";
import eceService from "../../services/ece.service";

const EMPTY_FORM = {
  title: "", ageRangeLabel: "", domainIds: [] as string[], resources: "", learningIntent: "",
  observationOpportunities: "", differentiation: { support: "", core: "", extension: "" },
};

export default function ExperienceLibraryTab() {
  const queryClient = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: experiences = [], isLoading } = useQuery({ queryKey: ["ece-experiences"], queryFn: () => eceService.getExperiences() });
  const { data: domains = [] } = useQuery({ queryKey: ["ece-domains"], queryFn: eceService.getDomains });

  const createExperience = useMutation({
    mutationFn: () => eceService.createExperience({
      ...form,
      resources: form.resources.split(",").map((r) => r.trim()).filter(Boolean),
      observationOpportunities: form.observationOpportunities.split(",").map((r) => r.trim()).filter(Boolean),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ece-experiences"] });
      toast.success("Added to library");
      setShowNew(false);
      setForm(EMPTY_FORM);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to save"),
  });

  function toggleDomain(id: string) {
    setForm((p) => ({
      ...p,
      domainIds: p.domainIds.includes(id) ? p.domainIds.filter((d) => d !== id) : [...p.domainIds, id],
    }));
  }

  function domainNames(ids: string[]) {
    return (domains as any[]).filter((d) => ids.includes(d._id)).map((d) => d.name).join(", ") || "—";
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Learning Experience Library</h2>
          <p className="text-sm text-slate-500">{(experiences as any[]).length} reusable activities — build once, use every year</p>
        </div>
        <Btn onClick={() => setShowNew((v) => !v)}>{showNew ? "Cancel" : "+ Add Experience"}</Btn>
      </div>

      {showNew && (
        <Card className="p-5 mb-4">
          <FormField label="Title" required>
            <FInput value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="e.g. Water Pouring Activity" />
          </FormField>
          <FormField label="Age Range">
            <FInput value={form.ageRangeLabel} onChange={(e) => setForm((p) => ({ ...p, ageRangeLabel: e.target.value }))} placeholder="e.g. 3-4 years" />
          </FormField>
          <FormField label="Domains">
            <div className="flex flex-wrap gap-1.5">
              {(domains as any[]).map((d: any) => (
                <button
                  key={d._id}
                  onClick={() => toggleDomain(d._id)}
                  className={`px-2.5 py-1 text-xs rounded-full border ${form.domainIds.includes(d._id) ? "bg-[#0C447C] text-white border-[#0C447C]" : "bg-white text-slate-600 border-slate-200"}`}
                >
                  {d.name}
                </button>
              ))}
            </div>
          </FormField>
          <FormField label="Resources (comma-separated)">
            <FInput value={form.resources} onChange={(e) => setForm((p) => ({ ...p, resources: e.target.value }))} placeholder="Tray, Jug, Two containers, Cloth" />
          </FormField>
          <FormField label="Learning Intent">
            <FInput value={form.learningIntent} onChange={(e) => setForm((p) => ({ ...p, learningIntent: e.target.value }))} placeholder="Develop controlled hand movement" />
          </FormField>
          <FormField label="What to Observe (comma-separated)">
            <FInput value={form.observationOpportunities} onChange={(e) => setForm((p) => ({ ...p, observationOpportunities: e.target.value }))} placeholder="Grip, Coordination, Concentration, Independence" />
          </FormField>
          <div className="grid grid-cols-3 gap-2">
            <FormField label="Support">
              <FInput value={form.differentiation.support} onChange={(e) => setForm((p) => ({ ...p, differentiation: { ...p.differentiation, support: e.target.value } }))} placeholder="Larger containers" />
            </FormField>
            <FormField label="Core">
              <FInput value={form.differentiation.core} onChange={(e) => setForm((p) => ({ ...p, differentiation: { ...p.differentiation, core: e.target.value } }))} placeholder="Equal containers" />
            </FormField>
            <FormField label="Extension">
              <FInput value={form.differentiation.extension} onChange={(e) => setForm((p) => ({ ...p, differentiation: { ...p.differentiation, extension: e.target.value } }))} placeholder="Funnel + marked quantities" />
            </FormField>
          </div>
          <div className="flex justify-end mt-2">
            <Btn onClick={() => createExperience.mutate()} disabled={!form.title || createExperience.isPending}>
              {createExperience.isPending ? "Saving…" : "Save to Library"}
            </Btn>
          </div>
        </Card>
      )}

      {isLoading ? (
        <div className="text-center py-16 text-slate-400">Loading…</div>
      ) : (experiences as any[]).length === 0 ? (
        <Card className="p-16 text-center">
          <div className="text-5xl mb-4">🧩</div>
          <p className="font-semibold text-slate-700 mb-1">No experiences yet</p>
          <p className="text-sm text-slate-400">Add activities here once, then reuse them in weekly planning every year.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {(experiences as any[]).map((exp: any) => {
            const isExpanded = expanded === exp._id;
            return (
              <Card key={exp._id} className="p-4">
                <button onClick={() => setExpanded(isExpanded ? null : exp._id)} className="w-full text-left">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm text-slate-800">{exp.title}</p>
                    <span className="text-xs text-slate-400">{exp.ageRangeLabel}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{domainNames(exp.domainIds)}</p>
                </button>
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                    {exp.learningIntent && <p><span className="font-semibold">Intent:</span> {exp.learningIntent}</p>}
                    {exp.resources?.length > 0 && <p><span className="font-semibold">Resources:</span> {exp.resources.join(", ")}</p>}
                    {exp.observationOpportunities?.length > 0 && <p><span className="font-semibold">Observe:</span> {exp.observationOpportunities.join(", ")}</p>}
                    {(exp.differentiation?.support || exp.differentiation?.core || exp.differentiation?.extension) && (
                      <div className="grid grid-cols-3 gap-2 pt-1">
                        {exp.differentiation.support && <div><p className="font-semibold text-amber-600">Support</p><p>{exp.differentiation.support}</p></div>}
                        {exp.differentiation.core && <div><p className="font-semibold text-blue-600">Core</p><p>{exp.differentiation.core}</p></div>}
                        {exp.differentiation.extension && <div><p className="font-semibold text-emerald-600">Extension</p><p>{exp.differentiation.extension}</p></div>}
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
