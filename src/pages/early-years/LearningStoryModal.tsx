import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Modal, Btn, AvatarBubble, FormField } from "./shared";
import eceService, { uploadEceEvidence } from "../../services/ece.service";

const SUGGESTED_INTERESTS = ["Animals", "Vehicles", "Water", "Construction", "Nature", "Stories", "Numbers", "Drawing", "Role Play"];

// A Learning Story is a real Observation (observationType: 'learning_story')
// with a guided, prompted narrative rather than a free-text box - the
// structure the PRD calls for (What happened / What learning did we
// notice / Interests shown / What next), composed into the single
// narrative field so it displays correctly everywhere else that already
// reads observations. Interests mentioned here also get added to the
// child's real Interest tags, closing the loop with that feature rather
// than creating a second, disconnected place interests live.
export default function LearningStoryModal({ child, onClose }: { child: any; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [whatHappened, setWhatHappened] = useState("");
  const [learningNoticed, setLearningNoticed] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [nextOffering, setNextOffering] = useState("");
  const [isShared, setIsShared] = useState(true);
  const [evidence, setEvidence] = useState<{ type: string; url: string; fileName: string }[]>([]);
  const [uploading, setUploading] = useState(false);

  const { data: profile } = useQuery({ queryKey: ["ece-profile", child._id], queryFn: () => eceService.getProfile(child._id) });

  const saveStory = useMutation({
    mutationFn: async () => {
      const narrative = [
        `What happened?\n${whatHappened}`,
        learningNoticed ? `\nWhat learning did we notice?\n${learningNoticed}` : "",
        interests.length ? `\nInterests shown: ${interests.join(", ")}` : "",
      ].join("");

      await eceService.createObservation({
        studentId: child._id,
        observationType: "learning_story",
        narrative,
        nextStep: nextOffering || undefined,
        isSharedWithFamily: isShared,
        evidence: evidence.map((e) => ({ type: e.type, url: e.url })),
      });

      const existingInterests = profile?.interests || [];
      const newInterests = interests.filter((i) => !existingInterests.includes(i));
      if (newInterests.length > 0) {
        await eceService.updateProfileTags(child._id, { interests: [...existingInterests, ...newInterests] });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ece-profile", child._id] });
      queryClient.invalidateQueries({ queryKey: ["ece-observations", child._id] });
      queryClient.invalidateQueries({ queryKey: ["ece-dashboard"] });
      toast.success(`Learning Story saved for ${child.firstName}`);
      onClose();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to save"),
  });

  function toggleInterest(i: string) {
    setInterests((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));
  }

  async function handleFile(file: File | null) {
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadEceEvidence(file);
      const type = file.type.startsWith("video") ? "video" : "photo";
      setEvidence((prev) => [...prev, { type, url: result.url, fileName: result.fileName }]);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Learning Story" sub={`${child.firstName} ${child.lastName}`} maxWidth="max-w-2xl">
      <div className="p-5">
        <div className="flex items-center gap-3 mb-5">
          <AvatarBubble name={`${child.firstName} ${child.lastName}`} photoUrl={child.photo} size="lg" />
          <p className="font-semibold text-slate-800">{child.firstName} {child.lastName}</p>
        </div>

        <FormField label="What happened?" required>
          <textarea
            value={whatHappened}
            onChange={(e) => setWhatHappened(e.target.value)}
            placeholder="Tell the story — what did the child do, say, or explore?"
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]"
            rows={3}
          />
        </FormField>

        <FormField label="What learning did we notice?">
          <textarea
            value={learningNoticed}
            onChange={(e) => setLearningNoticed(e.target.value)}
            placeholder="What development, thinking, or skill showed up in this moment?"
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]"
            rows={2}
          />
        </FormField>

        <FormField label="What interests did the child show?">
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_INTERESTS.map((i) => (
              <button
                key={i}
                onClick={() => toggleInterest(i)}
                className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                  interests.includes(i) ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {i}
              </button>
            ))}
          </div>
        </FormField>

        <FormField label="What should we offer next?">
          <input
            value={nextOffering}
            onChange={(e) => setNextOffering(e.target.value)}
            placeholder="e.g. More construction materials with different textures"
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]"
          />
        </FormField>

        <FormField label="Evidence">
          <label className="cursor-pointer">
            <input type="file" accept="image/*,video/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0] || null)} />
            <span className="inline-block px-3 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50">
              {uploading ? "Uploading…" : "📷 Add Photo or Video"}
            </span>
          </label>
          {evidence.length > 0 && (
            <div className="mt-2 flex gap-1.5 flex-wrap">
              {evidence.map((e, i) => (
                <span key={i} className="text-xs bg-slate-50 px-2 py-1 rounded-lg text-slate-500">{e.fileName}</span>
              ))}
            </div>
          )}
        </FormField>

        <label className="flex items-center gap-2 mb-4 cursor-pointer">
          <input type="checkbox" checked={isShared} onChange={(e) => setIsShared(e.target.checked)} className="rounded" />
          <span className="text-sm text-slate-600">Share with family</span>
        </label>

        <div className="flex justify-end gap-2">
          <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" onClick={() => saveStory.mutate()} disabled={!whatHappened.trim() || saveStory.isPending}>
            {saveStory.isPending ? "Saving…" : "Save Learning Story"}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}
