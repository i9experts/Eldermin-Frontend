import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Card, CardHeader, Btn, FormField, FInput, FSelect } from "./shared";
import eceService from "../../services/ece.service";

const FRAMEWORK_TYPES = ["montessori", "kindergarten", "head_start", "play_based", "reggio", "eccd", "national", "custom"];

export default function SettingsTab() {
  const queryClient = useQueryClient();
  const [newDomain, setNewDomain] = useState({ name: "", canonicalKey: "" });
  const [newSkillFor, setNewSkillFor] = useState<string | null>(null);
  const [newSkillName, setNewSkillName] = useState("");
  const [showNewFramework, setShowNewFramework] = useState(false);
  const [frameworkForm, setFrameworkForm] = useState({ name: "", type: "custom" });
  const [mappingFrameworkId, setMappingFrameworkId] = useState<string | null>(null);
  const [mappingForm, setMappingForm] = useState({ skillId: "", displayDomainName: "", displaySkillName: "" });

  const { data: frameworks = [] } = useQuery({ queryKey: ["ece-frameworks"], queryFn: eceService.getFrameworks });
  const { data: domains = [] } = useQuery({ queryKey: ["ece-domains"], queryFn: eceService.getDomains });
  const { data: skills = [] } = useQuery({ queryKey: ["ece-skills"], queryFn: () => eceService.getSkills() });
  const { data: mappings = [] } = useQuery({
    queryKey: ["ece-framework-mappings", mappingFrameworkId],
    queryFn: () => eceService.getFrameworkMappings(mappingFrameworkId as string),
    enabled: !!mappingFrameworkId,
  });

  const createMapping = useMutation({
    mutationFn: () => eceService.createFrameworkMapping({ frameworkId: mappingFrameworkId, ...mappingForm }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ece-framework-mappings", mappingFrameworkId] });
      toast.success("Mapping added");
      setMappingForm({ skillId: "", displayDomainName: "", displaySkillName: "" });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed - this skill may already be mapped for this framework"),
  });

  const deleteMapping = useMutation({
    mutationFn: (id: string) => eceService.deleteFrameworkMapping(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ece-framework-mappings", mappingFrameworkId] });
      toast.success("Mapping removed");
    },
  });

  function skillName(id: string) {
    return (skills as any[]).find((s: any) => s._id === id)?.name || "—";
  }

  const seedDomains = useMutation({
    mutationFn: eceService.seedDefaultDomains,
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["ece-domains"] });
      queryClient.invalidateQueries({ queryKey: ["ece-skills"] });
      toast.success(res.message);
    },
  });

  const seedPakistanSNC = useMutation({
    mutationFn: eceService.seedPakistanNationalCurriculum,
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["ece-domains"] });
      queryClient.invalidateQueries({ queryKey: ["ece-skills"] });
      queryClient.invalidateQueries({ queryKey: ["ece-frameworks"] });
      queryClient.invalidateQueries({ queryKey: ["ece-age-bands"] });
      toast.success(res.message);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to seed"),
  });

  const createFramework = useMutation({
    mutationFn: () => eceService.createFramework(frameworkForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ece-frameworks"] });
      toast.success("Framework added");
      setShowNewFramework(false);
      setFrameworkForm({ name: "", type: "custom" });
    },
  });

  const createDomain = useMutation({
    mutationFn: () => eceService.createDomain({ ...newDomain, order: (domains as any[]).length }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ece-domains"] });
      toast.success("Domain added");
      setNewDomain({ name: "", canonicalKey: "" });
    },
  });

  const createSkill = useMutation({
    mutationFn: (domainId: string) => eceService.createSkill({
      domainId, name: newSkillName, canonicalKey: newSkillName.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ece-skills"] });
      toast.success("Skill added");
      setNewSkillName("");
      setNewSkillFor(null);
    },
  });

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title="Frameworks"
          sub="A school can run more than one (e.g. different campuses)"
          actions={<Btn size="sm" onClick={() => setShowNewFramework(true)}>+ Add Framework</Btn>}
        />
        <div className="p-4">
          {(frameworks as any[]).length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">No framework configured yet — add one to get started.</p>
          ) : (
            <div className="space-y-2">
              {(frameworks as any[]).map((f: any) => (
                <div key={f._id} className="bg-slate-50 rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 text-sm">
                    <div>
                      <span className="font-medium text-slate-800">{f.name}</span>
                      <span className="text-xs text-slate-400 ml-2">{f.type.replace("_", " ")}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400">{f.progressionLevels.join(" → ")}</span>
                      <button
                        onClick={() => setMappingFrameworkId(mappingFrameworkId === f._id ? null : f._id)}
                        className="text-xs text-[#0C447C] hover:underline"
                      >
                        {mappingFrameworkId === f._id ? "Hide Mappings" : "Manage Mappings"}
                      </button>
                    </div>
                  </div>

                  {mappingFrameworkId === f._id && (
                    <div className="px-3 pb-3 pt-1 border-t border-slate-100">
                      <p className="text-xs text-slate-400 mb-2">
                        Map canonical skills to how {f.name} names and groups them — the same skill, labeled this framework's way, without duplicating it.
                      </p>
                      {(mappings as any[]).length > 0 && (
                        <div className="space-y-1 mb-2">
                          {(mappings as any[]).map((m: any) => (
                            <div key={m._id} className="flex items-center justify-between text-xs bg-white px-2 py-1.5 rounded-lg">
                              <span className="text-slate-500">{skillName(m.skillId)} →</span>
                              <span className="font-medium text-slate-700">{m.displayDomainName} / {m.displaySkillName}</span>
                              <button onClick={() => deleteMapping.mutate(m._id)} className="text-red-400 hover:text-red-600">✕</button>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="grid grid-cols-4 gap-1.5">
                        <select
                          value={mappingForm.skillId}
                          onChange={(e) => setMappingForm((p) => ({ ...p, skillId: e.target.value }))}
                          className="text-xs px-2 py-1.5 border border-slate-200 rounded-lg bg-white"
                        >
                          <option value="">Skill…</option>
                          {(skills as any[]).map((s: any) => <option key={s._id} value={s._id}>{s.name}</option>)}
                        </select>
                        <input
                          value={mappingForm.displayDomainName}
                          onChange={(e) => setMappingForm((p) => ({ ...p, displayDomainName: e.target.value }))}
                          placeholder="Display domain"
                          className="text-xs px-2 py-1.5 border border-slate-200 rounded-lg"
                        />
                        <input
                          value={mappingForm.displaySkillName}
                          onChange={(e) => setMappingForm((p) => ({ ...p, displaySkillName: e.target.value }))}
                          placeholder="Display skill name"
                          className="text-xs px-2 py-1.5 border border-slate-200 rounded-lg"
                        />
                        <Btn size="sm" onClick={() => createMapping.mutate()} disabled={!mappingForm.skillId || !mappingForm.displayDomainName}>
                          + Map
                        </Btn>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {showNewFramework && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <FormField label="Name" required>
                <FInput value={frameworkForm.name} onChange={(e) => setFrameworkForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Montessori" />
              </FormField>
              <FormField label="Type" required>
                <FSelect options={FRAMEWORK_TYPES} value={frameworkForm.type} onChange={(e) => setFrameworkForm((p) => ({ ...p, type: e.target.value }))} />
              </FormField>
              <div className="flex justify-end gap-2 mt-2">
                <Btn variant="secondary" size="sm" onClick={() => setShowNewFramework(false)}>Cancel</Btn>
                <Btn size="sm" onClick={() => createFramework.mutate()} disabled={!frameworkForm.name}>Save</Btn>
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Developmental Domains & Skills"
          sub="Real, school-editable registries — never hardcoded"
          actions={
            <div className="flex gap-2">
              {(domains as any[]).length === 0 && (
                <Btn size="sm" variant="secondary" onClick={() => seedDomains.mutate()} disabled={seedDomains.isPending}>
                  {seedDomains.isPending ? "Seeding…" : "+ Seed Generic Domains"}
                </Btn>
              )}
              <Btn size="sm" onClick={() => seedPakistanSNC.mutate()} disabled={seedPakistanSNC.isPending}>
                {seedPakistanSNC.isPending ? "Seeding…" : "🇵🇰 Seed Pakistan National Curriculum (SNC-ECE)"}
              </Btn>
            </div>
          }
        />
        <div className="p-4">
          <p className="text-xs text-slate-400 -mt-1 mb-3">
            The Pakistan option seeds the real, official SNC-ECE curriculum — 7 Key Learning Areas, 26 Strands, and 219 coded Learning Outcomes with age-band differentiation (3-4 / 4-5 years), with official SLO codes preserved for traceability.
          </p>
          {(domains as any[]).length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">
              No domains yet. Seed the default 8 (Physical, Cognitive, Language & Communication, Social, Emotional, Creative, Executive Function, Practical Life) and customize from there.
            </p>
          ) : (
            <div className="space-y-3">
              {(domains as any[]).map((domain: any) => {
                const domainSkills = (skills as any[]).filter((s: any) => s.domainId === domain._id);
                return (
                  <div key={domain._id} className="border border-slate-100 rounded-lg p-3">
                    <p className="font-semibold text-sm text-slate-800 mb-2">{domain.name}</p>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {domainSkills.map((s: any) => (
                        <span key={s._id} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">{s.name}</span>
                      ))}
                    </div>
                    {newSkillFor === domain._id ? (
                      <div className="flex gap-2 mt-2">
                        <input
                          value={newSkillName}
                          onChange={(e) => setNewSkillName(e.target.value)}
                          placeholder="New skill name…"
                          className="flex-1 px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]"
                        />
                        <Btn size="sm" onClick={() => createSkill.mutate(domain._id)} disabled={!newSkillName}>Add</Btn>
                        <Btn size="sm" variant="secondary" onClick={() => setNewSkillFor(null)}>Cancel</Btn>
                      </div>
                    ) : (
                      <button onClick={() => setNewSkillFor(domain._id)} className="text-xs text-[#0C447C] hover:underline">+ Add Skill</button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-3 pt-3 border-t border-slate-100 flex gap-2">
            <input
              value={newDomain.name}
              onChange={(e) => setNewDomain({ name: e.target.value, canonicalKey: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "_") })}
              placeholder="New domain name…"
              className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]"
            />
            <Btn onClick={() => createDomain.mutate()} disabled={!newDomain.name}>+ Add Domain</Btn>
          </div>
        </div>
      </Card>
    </div>
  );
}
