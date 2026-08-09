import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Modal, Btn, AvatarBubble, levelColor } from "./shared";
import eceService from "../../services/ece.service";

export default function QuickObserveModal({ child, onClose }: { child: any; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [domainId, setDomainId] = useState<string>("");
  const [skillId, setSkillId] = useState<string>("");
  const [level, setLevel] = useState<string>("");
  const [narrative, setNarrative] = useState("");

  const { data: domains = [] } = useQuery({ queryKey: ["ece-domains"], queryFn: eceService.getDomains });
  const { data: skills = [] } = useQuery({ queryKey: ["ece-skills"], queryFn: () => eceService.getSkills() });
  const { data: frameworks = [] } = useQuery({ queryKey: ["ece-frameworks"], queryFn: eceService.getFrameworks });

  const progressionLevels: string[] =
    (frameworks as any[])[0]?.progressionLevels || ["Not Observed", "Emerging", "Developing", "Consistent", "Independent", "Mastered"];

  const skillsForDomain = (skills as any[]).filter((s: any) => s.domainId === domainId);

  const quickObserve = useMutation({
    mutationFn: () => eceService.quickObserve({ studentId: child._id, skillId, progressionLevel: level, narrative: narrative || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ece-profile", child._id] });
      queryClient.invalidateQueries({ queryKey: ["ece-dashboard"] });
      toast.success(`Observation saved for ${child.firstName}`);
      onClose();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to save observation"),
  });

  function handleSave() {
    if (!skillId) { toast.error("Select a skill"); return; }
    if (!level) { toast.error("Select a level"); return; }
    quickObserve.mutate();
  }

  return (
    <Modal open onClose={onClose} title="Quick Observation" sub={`${child.firstName} ${child.lastName}`}>
      <div className="p-5">
        <div className="flex items-center gap-3 mb-5">
          <AvatarBubble name={`${child.firstName} ${child.lastName}`} photoUrl={child.photo} size="lg" />
          <div>
            <p className="font-semibold text-slate-800">{child.firstName} {child.lastName}</p>
            <p className="text-xs text-slate-400">{child.currentGrade}{child.currentSection ? ` — ${child.currentSection}` : ""}</p>
          </div>
        </div>

        {/* Step 1: Domain */}
        <p className="text-xs font-semibold text-slate-500 uppercase mb-2">1. Domain</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {(domains as any[]).map((d: any) => (
            <button
              key={d._id}
              onClick={() => { setDomainId(d._id); setSkillId(""); }}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                domainId === d._id ? "bg-[#0C447C] text-white border-[#0C447C]" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {d.name}
            </button>
          ))}
          {(domains as any[]).length === 0 && (
            <p className="text-xs text-amber-600">No domains set up yet — seed defaults in Settings first.</p>
          )}
        </div>

        {/* Step 2: Skill */}
        {domainId && (
          <>
            <p className="text-xs font-semibold text-slate-500 uppercase mb-2">2. Skill</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {skillsForDomain.map((s: any) => (
                <button
                  key={s._id}
                  onClick={() => setSkillId(s._id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                    skillId === s._id ? "bg-[#0C447C] text-white border-[#0C447C]" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {s.name}
                </button>
              ))}
              {skillsForDomain.length === 0 && <p className="text-xs text-slate-400">No skills under this domain yet.</p>}
            </div>
          </>
        )}

        {/* Step 3: Progression Level */}
        {skillId && (
          <>
            <p className="text-xs font-semibold text-slate-500 uppercase mb-2">3. Level</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {progressionLevels.map((lvl: string) => (
                <button
                  key={lvl}
                  onClick={() => setLevel(lvl)}
                  style={level === lvl ? { background: levelColor(lvl), borderColor: levelColor(lvl) } : {}}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                    level === lvl ? "text-white" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </>
        )}

        {level && (
          <textarea
            value={narrative}
            onChange={(e) => setNarrative(e.target.value)}
            placeholder="Optional: what did you actually see? (e.g. 'Used tripod grip independently while cutting along a curved line')"
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C] mb-4"
            rows={2}
          />
        )}

        <div className="flex justify-end gap-2">
          <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" onClick={handleSave} disabled={quickObserve.isPending}>
            {quickObserve.isPending ? "Saving…" : "Save Observation"}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}
