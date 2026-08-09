import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Modal, Btn, AvatarBubble, FormField, FSelect, levelColor } from "./shared";
import eceService, { uploadEceEvidence } from "../../services/ece.service";

const OBSERVATION_TYPES = [
  { value: "spontaneous", label: "Spontaneous" },
  { value: "planned", label: "Planned Activity" },
  { value: "montessori_presentation", label: "Montessori Presentation" },
  { value: "learning_story", label: "Learning Story" },
];

const EVIDENCE_TYPES = [
  { type: "photo", label: "📷 Photo", accept: "image/*" },
  { type: "video", label: "🎥 Video", accept: "video/*" },
  { type: "voice_note", label: "🎤 Voice Note", accept: "audio/*" },
  { type: "work_sample", label: "📄 Work Sample", accept: "image/*,.pdf" },
  { type: "document", label: "📝 Document", accept: ".pdf,.doc,.docx" },
];

type SkillRow = { domainId: string; skillId: string; indicatorId?: string; progressionLevel: string };
type EvidenceRow = { type: string; url: string; caption: string; fileName: string };

export default function ObservationFormModal({ child, onClose }: { child: any; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [observationType, setObservationType] = useState("spontaneous");
  const [context, setContext] = useState("");
  const [narrative, setNarrative] = useState("");
  const [nextStep, setNextStep] = useState("");
  const [isShared, setIsShared] = useState(false);
  const [skillRows, setSkillRows] = useState<SkillRow[]>([{ domainId: "", skillId: "", progressionLevel: "" }]);
  const [evidence, setEvidence] = useState<EvidenceRow[]>([]);
  const [uploadingType, setUploadingType] = useState<string | null>(null);

  const { data: domains = [] } = useQuery({ queryKey: ["ece-domains"], queryFn: eceService.getDomains });
  const { data: skills = [] } = useQuery({ queryKey: ["ece-skills"], queryFn: () => eceService.getSkills() });
  const { data: frameworks = [] } = useQuery({ queryKey: ["ece-frameworks"], queryFn: eceService.getFrameworks });
  const progressionLevels: string[] =
    (frameworks as any[])[0]?.progressionLevels || ["Not Observed", "Emerging", "Developing", "Consistent", "Independent", "Mastered"];

  const createObservation = useMutation({
    mutationFn: () => eceService.createObservation({
      studentId: child._id,
      observationType,
      context: context || undefined,
      narrative,
      nextStep: nextStep || undefined,
      isSharedWithFamily: isShared,
      skillMappings: skillRows
        .filter((r) => r.skillId && r.progressionLevel)
        .map((r) => ({ skillId: r.skillId, indicatorId: r.indicatorId, progressionLevel: r.progressionLevel })),
      evidence: evidence.map((e) => ({ type: e.type, url: e.url, caption: e.caption || undefined })),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ece-profile", child._id] });
      queryClient.invalidateQueries({ queryKey: ["ece-observations", child._id] });
      queryClient.invalidateQueries({ queryKey: ["ece-dashboard"] });
      toast.success(`Observation saved for ${child.firstName}`);
      onClose();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to save observation"),
  });

  function updateRow(index: number, field: keyof SkillRow, value: string) {
    setSkillRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value, ...(field === "domainId" ? { skillId: "" } : {}) } : r)));
  }
  function addRow() {
    setSkillRows((prev) => [...prev, { domainId: "", skillId: "", progressionLevel: "" }]);
  }
  function removeRow(index: number) {
    setSkillRows((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleFileSelect(type: string, file: File | null) {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("File too large — max 10MB"); return; }
    setUploadingType(type);
    try {
      const result = await uploadEceEvidence(file);
      setEvidence((prev) => [...prev, { type, url: result.url, fileName: result.fileName, caption: "" }]);
      toast.success("Uploaded");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setUploadingType(null);
    }
  }

  function updateCaption(index: number, caption: string) {
    setEvidence((prev) => prev.map((e, i) => (i === index ? { ...e, caption } : e)));
  }
  function removeEvidence(index: number) {
    setEvidence((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSave() {
    if (!narrative.trim()) { toast.error("Describe what you observed"); return; }
    createObservation.mutate();
  }

  return (
    <Modal open onClose={onClose} title="Full Observation" sub={`${child.firstName} ${child.lastName}`} maxWidth="max-w-2xl">
      <div className="p-5">
        <div className="flex items-center gap-3 mb-5">
          <AvatarBubble name={`${child.firstName} ${child.lastName}`} photoUrl={child.photo} size="lg" />
          <div>
            <p className="font-semibold text-slate-800">{child.firstName} {child.lastName}</p>
            <p className="text-xs text-slate-400">{child.currentGrade}{child.currentSection ? ` — ${child.currentSection}` : ""}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Observation Type">
            <FSelect
              options={OBSERVATION_TYPES.map((t) => t.label)}
              value={OBSERVATION_TYPES.find((t) => t.value === observationType)?.label}
              onChange={(e) => setObservationType(OBSERVATION_TYPES.find((t) => t.label === e.target.value)?.value || "spontaneous")}
            />
          </FormField>
          <FormField label="Context">
            <input
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="e.g. Outdoor play, Work cycle"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]"
            />
          </FormField>
        </div>

        <FormField label="What did you observe?" required>
          <textarea
            value={narrative}
            onChange={(e) => setNarrative(e.target.value)}
            placeholder="Be specific about what the child actually did — 'Fatima independently organised four children to build a sand structure' is far more useful than 'Fatima played well.'"
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]"
            rows={3}
          />
        </FormField>

        {/* Skill Mappings */}
        <p className="text-xs font-semibold text-slate-600 mb-2 mt-4">Map to Development</p>
        <div className="space-y-2 mb-2">
          {skillRows.map((row, i) => {
            const skillsForDomain = (skills as any[]).filter((s: any) => s.domainId === row.domainId);
            return (
              <div key={i} className="grid gap-2 items-center" style={{ gridTemplateColumns: "1.2fr 1.2fr 1.2fr 24px" }}>
                <select
                  value={row.domainId}
                  onChange={(e) => updateRow(i, "domainId", e.target.value)}
                  className="px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0C447C]"
                >
                  <option value="">Domain…</option>
                  {(domains as any[]).map((d: any) => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
                <select
                  value={row.skillId}
                  onChange={(e) => updateRow(i, "skillId", e.target.value)}
                  disabled={!row.domainId}
                  className="px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0C447C] disabled:bg-slate-50"
                >
                  <option value="">Skill…</option>
                  {skillsForDomain.map((s: any) => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
                <select
                  value={row.progressionLevel}
                  onChange={(e) => updateRow(i, "progressionLevel", e.target.value)}
                  disabled={!row.skillId}
                  className="px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0C447C] disabled:bg-slate-50"
                >
                  <option value="">Level…</option>
                  {progressionLevels.map((lvl) => <option key={lvl} value={lvl}>{lvl}</option>)}
                </select>
                {skillRows.length > 1 && (
                  <button onClick={() => removeRow(i)} className="text-slate-300 hover:text-red-500 text-sm">✕</button>
                )}
              </div>
            );
          })}
        </div>
        <button onClick={addRow} className="text-xs text-[#0C447C] font-medium hover:underline mb-4">+ Map another skill</button>

        {/* Evidence */}
        <p className="text-xs font-semibold text-slate-600 mb-2">Evidence</p>
        <div className="flex gap-1.5 mb-3 flex-wrap">
          {EVIDENCE_TYPES.map((et) => (
            <label key={et.type} className="cursor-pointer">
              <input
                type="file"
                accept={et.accept}
                className="hidden"
                onChange={(e) => handleFileSelect(et.type, e.target.files?.[0] || null)}
              />
              <span className={`inline-block px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors ${uploadingType === et.type ? "opacity-50" : ""}`}>
                {uploadingType === et.type ? "Uploading…" : et.label}
              </span>
            </label>
          ))}
        </div>
        {evidence.length > 0 && (
          <div className="space-y-1.5 mb-4">
            {evidence.map((ev, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg">
                <span className="text-xs font-medium text-slate-600 shrink-0">{EVIDENCE_TYPES.find((t) => t.type === ev.type)?.label}</span>
                <span className="text-xs text-slate-400 truncate flex-1">{ev.fileName}</span>
                <input
                  value={ev.caption}
                  onChange={(e) => updateCaption(i, e.target.value)}
                  placeholder="Optional caption…"
                  className="text-xs px-2 py-1 border border-slate-200 rounded-lg w-40 focus:outline-none focus:ring-2 focus:ring-[#0C447C]"
                />
                <button onClick={() => removeEvidence(i)} className="text-slate-300 hover:text-red-500 text-xs shrink-0">✕</button>
              </div>
            ))}
          </div>
        )}

        <FormField label="Suggested Next Step">
          <input
            value={nextStep}
            onChange={(e) => setNextStep(e.target.value)}
            placeholder="e.g. Curved-line cutting activity"
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]"
          />
        </FormField>

        <label className="flex items-center gap-2 mb-4 cursor-pointer">
          <input type="checkbox" checked={isShared} onChange={(e) => setIsShared(e.target.checked)} className="rounded" />
          <span className="text-sm text-slate-600">Share with family</span>
        </label>

        <div className="flex justify-end gap-2">
          <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" onClick={handleSave} disabled={createObservation.isPending}>
            {createObservation.isPending ? "Saving…" : "Save Observation"}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}
