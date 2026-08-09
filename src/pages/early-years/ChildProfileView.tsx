import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, Btn, AvatarBubble, levelColor } from "./shared";
import eceService from "../../services/ece.service";

export default function ChildProfileView({ child, onClose }: { child: any; onClose: () => void }) {
  const [expandedDomain, setExpandedDomain] = useState<string | null>(null);
  const [tab, setTab] = useState<"development" | "portfolio">("development");

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

  const summaries: any[] = profile?.domainSummaries || [];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
          <div className="flex items-center gap-3">
            <AvatarBubble name={`${child.firstName} ${child.lastName}`} photoUrl={child.photo} size="lg" />
            <div>
              <h2 className="font-bold text-slate-900 text-lg">{child.firstName} {child.lastName}</h2>
              <p className="text-xs text-slate-400">{child.currentGrade}{child.currentSection ? ` — ${child.currentSection}` : ""} · {child.studentId}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">×</button>
        </div>

        <div className="flex border-b border-slate-100 px-6">
          {(["development", "portfolio"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${tab === t ? "text-[#0C447C] border-[#0C447C]" : "text-slate-400 border-transparent hover:text-slate-600"}`}
            >
              {t === "development" ? "Development Profile" : "Portfolio"}
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

              <div className="mt-5 flex flex-wrap gap-1.5">
                {(profile?.interests || []).map((i: string) => (
                  <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">{i}</span>
                ))}
                {(profile?.schemas || []).map((s: string) => (
                  <span key={s} className="text-xs bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full">{s}</span>
                ))}
                {(profile?.interests || []).length === 0 && (profile?.schemas || []).length === 0 && (
                  <p className="text-xs text-slate-400">No interests or play schemas tagged yet.</p>
                )}
              </div>
            </>
          )}

          {tab === "portfolio" && (
            <div className="space-y-3">
              {(portfolio as any[]).length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-10">No portfolio entries yet.</p>
              ) : (
                (portfolio as any[]).map((entry: any) => (
                  <Card key={entry._id} className="p-4">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-sm text-slate-800">{entry.title}</p>
                      {entry.isVisibleToFamily && <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">Shared with family</span>}
                    </div>
                    <p className="text-sm text-slate-600">{entry.narrative}</p>
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
        </div>
      </div>
    </div>
  );
}
