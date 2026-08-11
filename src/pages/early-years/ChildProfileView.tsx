import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Card, CardHeader, Btn, AvatarBubble, levelColor } from "./shared";
import eceService, { downloadLearningJourneyPdf } from "../../services/ece.service";
import ObservationFormModal from "./ObservationFormModal";
import CareTab from "./CareTab";
import SupportTab from "./SupportTab";

export default function ChildProfileView({ child, onClose }: { child: any; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [expandedDomain, setExpandedDomain] = useState<string | null>(null);
  const [tab, setTab] = useState<"development" | "portfolio" | "montessori" | "care" | "support">("development");
  const [showObserveForm, setShowObserveForm] = useState(false);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [entryForm, setEntryForm] = useState({ title: "", narrative: "", isVisibleToFamily: false, tryThisAtHome: "" });
  const [newInterest, setNewInterest] = useState("");
  const [newSchema, setNewSchema] = useState("");
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  async function handleDownloadJourney() {
    setDownloadingPdf(true);
    try {
      await downloadLearningJourneyPdf(child._id, `${child.firstName}-${child.lastName}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to generate PDF");
    } finally {
      setDownloadingPdf(false);
    }
  }

  const { data: profile } = useQuery({ queryKey: ["ece-profile", child._id], queryFn: () => eceService.getProfile(child._id) });
  const { data: domains = [] } = useQuery({ queryKey: ["ece-domains"], queryFn: eceService.getDomains });
  const { data: observations = [] } = useQuery({
    queryKey: ["ece-observations", child._id],
    queryFn: () => eceService.getObservations({ studentId: child._id }),
  });
  const { data: portfolio = [] } = useQuery({
    queryKey: ["ece-portfolio", child._id],
    queryFn: () => eceService.getPortfolio(child._id),
  });

  const { data: materials = [] } = useQuery({ queryKey: ["montessori-materials"], queryFn: () => eceService.getMontessoriMaterials() });
  const { data: workRecords = [] } = useQuery({ queryKey: ["montessori-work-records", child._id], queryFn: () => eceService.getWorkRecords(child._id) });

  const upsertRecord = useMutation({
    mutationFn: (payload: { materialId: string; status: string; note?: string }) =>
      eceService.upsertWorkRecord({ studentId: child._id, ...payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["montessori-work-records", child._id] });
      toast.success("Work record updated");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to update"),
  });

  const createEntry = useMutation({
    mutationFn: () => eceService.createPortfolioEntry({ studentId: child._id, ...entryForm }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ece-portfolio", child._id] });
      toast.success(entryForm.isVisibleToFamily ? "Added to portfolio and shared with family" : "Added to portfolio");
      setShowNewEntry(false);
      setEntryForm({ title: "", narrative: "", isVisibleToFamily: false, tryThisAtHome: "" });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to save"),
  });

  const toggleShare = useMutation({
    mutationFn: ({ id, share }: { id: string; share: boolean }) => eceService.shareEntry(id, share),
    onSuccess: (res: any, vars) => {
      queryClient.invalidateQueries({ queryKey: ["ece-portfolio", child._id] });
      if (vars.share) {
        toast.success(res.familyNotified ? "Shared — family notified by email" : "Shared, but no guardian email on file to notify");
      } else {
        toast.success("Unshared");
      }
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to update"),
  });

  const updateTags = useMutation({
    mutationFn: (payload: { interests?: string[]; schemas?: string[] }) => eceService.updateProfileTags(child._id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ece-profile", child._id] }),
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to update"),
  });

  function addInterest(value: string) {
    if (!value.trim()) return;
    const current = profile?.interests || [];
    if (current.includes(value)) return;
    updateTags.mutate({ interests: [...current, value] });
    setNewInterest("");
  }
  function removeInterest(value: string) {
    updateTags.mutate({ interests: (profile?.interests || []).filter((i: string) => i !== value) });
  }
  function addSchema(value: string) {
    if (!value.trim()) return;
    const current = profile?.schemas || [];
    if (current.includes(value)) return;
    updateTags.mutate({ schemas: [...current, value] });
    setNewSchema("");
  }
  function removeSchema(value: string) {
    updateTags.mutate({ schemas: (profile?.schemas || []).filter((s: string) => s !== value) });
  }

  const summaries: any[] = profile?.domainSummaries || [];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      {showObserveForm && <ObservationFormModal child={child} onClose={() => setShowObserveForm(false)} />}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
          <div className="flex items-center gap-3">
            <AvatarBubble name={`${child.firstName} ${child.lastName}`} photoUrl={child.photo} size="lg" />
            <div>
              <h2 className="font-bold text-slate-900 text-lg">{child.firstName} {child.lastName}</h2>
              <p className="text-xs text-slate-400">{child.currentGrade}{child.currentSection ? ` — ${child.currentSection}` : ""} · {child.studentId}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Btn variant="secondary" size="sm" onClick={handleDownloadJourney} disabled={downloadingPdf}>
              {downloadingPdf ? "Generating…" : "📖 My Learning Journey"}
            </Btn>
            <Btn size="sm" onClick={() => setShowObserveForm(true)}>+ New Observation</Btn>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">×</button>
          </div>
        </div>

        <div className="flex border-b border-slate-100 px-6">
          {(["development", "portfolio", "montessori", "care", "support"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${tab === t ? "text-[#0C447C] border-[#0C447C]" : "text-slate-400 border-transparent hover:text-slate-600"}`}
            >
              {t === "development" ? "Development Profile" : t === "portfolio" ? "Portfolio" : t === "montessori" ? "Montessori" : t === "care" ? "Care" : "Support"}
            </button>
          ))}
        </div>

        <div className="p-6">
          {tab === "development" && (
            <>
              {(domains as any[]).length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-10">No domains configured yet — set them up in Settings.</p>
              ) : (
                <div className="space-y-2">
                  {(domains as any[]).map((domain: any) => {
                    const summary = summaries.find((s: any) => String(s.domainId) === domain._id);
                    const isExpanded = expandedDomain === domain._id;
                    return (
                      <div key={domain._id} className="border border-slate-100 rounded-lg overflow-hidden">
                        <button
                          onClick={() => setExpandedDomain(isExpanded ? null : domain._id)}
                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
                        >
                          <span className="font-medium text-sm text-slate-800">{domain.name}</span>
                          {summary ? (
                            <span
                              className="text-xs font-semibold px-2.5 py-1 rounded-full text-white"
                              style={{ background: levelColor(summary.currentLevel) }}
                            >
                              {summary.currentLevel}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 px-2.5 py-1 rounded-full bg-slate-100">Not yet observed</span>
                          )}
                        </button>
                        {isExpanded && (
                          <div className="px-4 pb-3 border-t border-slate-50">
                            <p className="text-xs text-slate-400 pt-2 pb-1">
                              {summary ? `${summary.evidenceCount} observation(s) — no developmental judgement without evidence:` : "No observations recorded for this domain yet."}
                            </p>
                            {(observations as any[])
                              .filter((o: any) => o.skillMappings?.length > 0)
                              .slice(0, 5)
                              .map((o: any) => (
                                <div key={o._id} className="text-xs text-slate-600 py-1.5 border-b border-slate-50 last:border-0">
                                  <span className="text-slate-400">{new Date(o.createdAt).toLocaleDateString()}:</span> {o.narrative}
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-5">
                <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Interests</p>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {(profile?.interests || []).map((i: string) => (
                    <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full flex items-center gap-1">
                      {i}
                      <button onClick={() => removeInterest(i)} className="hover:text-blue-900">×</button>
                    </span>
                  ))}
                  {(profile?.interests || []).length === 0 && <p className="text-xs text-slate-400">None tagged yet.</p>}
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {["Animals", "Vehicles", "Water", "Construction", "Nature", "Stories", "Numbers", "Drawing", "Role Play"]
                    .filter((i) => !(profile?.interests || []).includes(i))
                    .map((i) => (
                      <button key={i} onClick={() => addInterest(i)} className="text-xs border border-slate-200 text-slate-500 px-2 py-0.5 rounded-full hover:bg-slate-50">+ {i}</button>
                    ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={newInterest}
                    onChange={(e) => setNewInterest(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addInterest(newInterest)}
                    placeholder="Add a custom interest…"
                    className="flex-1 px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]"
                  />
                  <button onClick={() => addInterest(newInterest)} className="text-xs text-[#0C447C] font-medium px-2">Add</button>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Play Schemas</p>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {(profile?.schemas || []).map((s: string) => (
                    <span key={s} className="text-xs bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full flex items-center gap-1">
                      {s}
                      <button onClick={() => removeSchema(s)} className="hover:text-purple-900">×</button>
                    </span>
                  ))}
                  {(profile?.schemas || []).length === 0 && <p className="text-xs text-slate-400">None tagged yet.</p>}
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {["Transporting", "Connecting", "Enclosing", "Rotation", "Trajectory", "Positioning", "Transforming"]
                    .filter((s) => !(profile?.schemas || []).includes(s))
                    .map((s) => (
                      <button key={s} onClick={() => addSchema(s)} className="text-xs border border-slate-200 text-slate-500 px-2 py-0.5 rounded-full hover:bg-slate-50">+ {s}</button>
                    ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={newSchema}
                    onChange={(e) => setNewSchema(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addSchema(newSchema)}
                    placeholder="Add a custom schema…"
                    className="flex-1 px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]"
                  />
                  <button onClick={() => addSchema(newSchema)} className="text-xs text-[#0C447C] font-medium px-2">Add</button>
                </div>
              </div>
            </>
          )}

          {tab === "portfolio" && (
            <div className="space-y-3">
              <div className="flex justify-end">
                <Btn size="sm" onClick={() => setShowNewEntry((v) => !v)}>{showNewEntry ? "Cancel" : "+ Add Entry"}</Btn>
              </div>

              {showNewEntry && (
                <Card className="p-4">
                  <input
                    value={entryForm.title}
                    onChange={(e) => setEntryForm((p) => ({ ...p, title: e.target.value }))}
                    placeholder="Title — e.g. 'Today I Discovered…'"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C] mb-2"
                  />
                  <textarea
                    value={entryForm.narrative}
                    onChange={(e) => setEntryForm((p) => ({ ...p, narrative: e.target.value }))}
                    placeholder="What happened, in plain language a parent will enjoy reading…"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C] mb-2"
                    rows={3}
                  />
                  <input
                    value={entryForm.tryThisAtHome}
                    onChange={(e) => setEntryForm((p) => ({ ...p, tryThisAtHome: e.target.value }))}
                    placeholder="Optional: Try This at Home — a specific, actionable suggestion for the family"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C] mb-2"
                  />
                  <label className="flex items-center gap-2 mb-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={entryForm.isVisibleToFamily}
                      onChange={(e) => setEntryForm((p) => ({ ...p, isVisibleToFamily: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm text-slate-600">Share with family now (sends a real email to their primary guardian)</span>
                  </label>
                  <div className="flex justify-end">
                    <Btn onClick={() => createEntry.mutate()} disabled={!entryForm.title || !entryForm.narrative || createEntry.isPending}>
                      {createEntry.isPending ? "Saving…" : "Save Entry"}
                    </Btn>
                  </div>
                </Card>
              )}

              {(portfolio as any[]).length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-10">No portfolio entries yet.</p>
              ) : (
                (portfolio as any[]).map((entry: any) => (
                  <Card key={entry._id} className="p-4">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-sm text-slate-800">{entry.title}</p>
                      <div className="flex items-center gap-2">
                        {entry.isVisibleToFamily && <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">Shared with family</span>}
                        <button
                          onClick={() => toggleShare.mutate({ id: entry._id, share: !entry.isVisibleToFamily })}
                          disabled={toggleShare.isPending}
                          className="text-xs text-[#0C447C] hover:underline"
                        >
                          {entry.isVisibleToFamily ? "Unshare" : "Share"}
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600">{entry.narrative}</p>
                    {entry.tryThisAtHome && (
                      <div className="mt-2 bg-blue-50 rounded-lg px-3 py-2">
                        <p className="text-xs font-semibold text-[#0C447C]">Try This at Home</p>
                        <p className="text-xs text-slate-600 mt-0.5">{entry.tryThisAtHome}</p>
                      </div>
                    )}
                    {entry.familyResponse && (
                      <div className="mt-2 pt-2 border-t border-slate-50 text-xs text-slate-500">
                        <span className="font-medium">{entry.familyResponse.respondedBy}:</span> {entry.familyResponse.text}
                      </div>
                    )}
                  </Card>
                ))
              )}
            </div>
          )}

          {tab === "montessori" && (
            <div className="space-y-2">
              {(materials as any[]).length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-10">No materials in the library yet — add some in the Montessori tab.</p>
              ) : (
                (materials as any[]).map((m: any) => {
                  const record = (workRecords as any[]).find((r: any) => (r.materialId?._id || r.materialId) === m._id);
                  return (
                    <div key={m._id} className="flex items-center justify-between px-3 py-2.5 bg-slate-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{m.name}</p>
                        <p className="text-xs text-slate-400 capitalize">{m.area.replace("_", " ")}</p>
                      </div>
                      <select
                        value={record?.status || ""}
                        onChange={(e) => e.target.value && upsertRecord.mutate({ materialId: m._id, status: e.target.value })}
                        className="text-xs px-2 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0C447C]"
                      >
                        <option value="">Not yet presented</option>
                        <option value="presented">Presented</option>
                        <option value="practising">Practising</option>
                        <option value="repeated_independently">Repeated Independently</option>
                        <option value="needs_representation">Needs Re-presentation</option>
                        <option value="mastered">Mastered</option>
                        <option value="ready_for_extension">Ready for Extension</option>
                      </select>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {tab === "care" && <CareTab child={child} />}
          {tab === "support" && <SupportTab child={child} />}
        </div>
      </div>
    </div>
  );
}
