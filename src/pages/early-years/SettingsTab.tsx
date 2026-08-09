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

  const { data: frameworks = [] } = useQuery({ queryKey: ["ece-frameworks"], queryFn: eceService.getFrameworks });
  const { data: domains = [] } = useQuery({ queryKey: ["ece-domains"], queryFn: eceService.getDomains });
  const { data: skills = [] } = useQuery({ queryKey: ["ece-skills"], queryFn: () => eceService.getSkills() });

  const seedDomains = useMutation({
    mutationFn: eceService.seedDefaultDomains,
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["ece-domains"] });
      queryClient.invalidateQueries({ queryKey: ["ece-skills"] });
      toast.success(res.message);
    },
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
                <div key={f._id} className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg text-sm">
                  <div>
                    <span className="font-medium text-slate-800">{f.name}</span>
                    <span className="text-xs text-slate-400 ml-2">{f.type.replace("_", " ")}</span>
                  </div>
                  <span className="text-xs text-slate-400">{f.progressionLevels.join(" → ")}</span>
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
          actions={(domains as any[]).length === 0 ? (
            <Btn size="sm" onClick={() => seedDomains.mutate()} disabled={seedDomains.isPending}>
              {seedDomains.isPending ? "Seeding…" : "+ Seed Default Domains"}
            </Btn>
          ) : undefined}
        />
        <div className="p-4">
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
