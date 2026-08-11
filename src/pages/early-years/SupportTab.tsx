import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Card, Btn } from "./shared";
import eceService from "../../services/ece.service";

const AREAS = [
  { value: "communication", label: "Communication" },
  { value: "motor_development", label: "Motor Development" },
  { value: "sensory_needs", label: "Sensory Needs" },
  { value: "social_interaction", label: "Social Interaction" },
  { value: "attention", label: "Attention" },
  { value: "emotional_regulation", label: "Emotional Regulation" },
  { value: "self_care", label: "Self-Care" },
  { value: "other", label: "Other" },
];

const STATUS_LABELS: Record<string, string> = {
  open: "Open", monitoring: "Monitoring", external_referral_discussed: "Referral Discussed", closed: "Closed",
};
const STATUS_COLORS: Record<string, string> = {
  open: "bg-amber-50 text-amber-700", monitoring: "bg-blue-50 text-blue-700",
  external_referral_discussed: "bg-purple-50 text-purple-700", closed: "bg-slate-100 text-slate-500",
};

export default function SupportTab({ child }: { child: any }) {
  const queryClient = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [area, setArea] = useState("communication");
  const [concern, setConcern] = useState("");
  const [strategyDraft, setStrategyDraft] = useState<Record<string, string>>({});
  const [reviewDraft, setReviewDraft] = useState<Record<string, string>>({});

  const { data: cases = [], isLoading } = useQuery({ queryKey: ["ece-support-cases", child._id], queryFn: () => eceService.getSupportCases(child._id) });

  const createCase = useMutation({
    mutationFn: () => eceService.createSupportCase({ studentId: child._id, area, initialConcern: concern }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ece-support-cases", child._id] });
      toast.success("Support case opened for educator review");
      setShowNew(false);
      setConcern("");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to save"),
  });

  const addStrategy = useMutation({
    mutationFn: ({ id, description }: { id: string; description: string }) => eceService.addSupportStrategy(id, { description }),
    onSuccess: (_r, vars) => {
      queryClient.invalidateQueries({ queryKey: ["ece-support-cases", child._id] });
      setStrategyDraft((p) => ({ ...p, [vars.id]: "" }));
      toast.success("Strategy added");
    },
  });

  const addReview = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) => eceService.addSupportReview(id, { reviewedBy: "Staff", notes, recommendation: "continue" }),
    onSuccess: (_r, vars) => {
      queryClient.invalidateQueries({ queryKey: ["ece-support-cases", child._id] });
      setReviewDraft((p) => ({ ...p, [vars.id]: "" }));
      toast.success("Review added");
    },
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => eceService.updateSupportCase(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ece-support-cases", child._id] });
      toast.success("Status updated");
    },
  });

  return (
    <div>
      <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 mb-4">
        <p className="text-xs text-slate-500">
          This tracks patterns worth an educator's attention — it never diagnoses. Every case is a professional judgement call, reviewed over time, not a label.
        </p>
      </div>

      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-slate-700">Additional Support</p>
        <Btn size="sm" onClick={() => setShowNew((v) => !v)}>{showNew ? "Cancel" : "+ Raise a Concern"}</Btn>
      </div>

      {showNew && (
        <Card className="p-4 mb-4">
          <p className="text-xs font-semibold text-slate-500 mb-1">Area</p>
          <select value={area} onChange={(e) => setArea(e.target.value)} className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 bg-white mb-3">
            {AREAS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
          </select>
          <p className="text-xs font-semibold text-slate-500 mb-1">What was observed?</p>
          <textarea
            value={concern}
            onChange={(e) => setConcern(e.target.value)}
            placeholder="Describe the specific pattern you've noticed, in your own words"
            className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 mb-3"
            rows={3}
          />
          <div className="flex justify-end">
            <Btn onClick={() => createCase.mutate()} disabled={!concern.trim() || createCase.isPending}>
              {createCase.isPending ? "Saving…" : "Open for Review"}
            </Btn>
          </div>
        </Card>
      )}

      {isLoading ? (
        <p className="text-sm text-slate-400 text-center py-10">Loading…</p>
      ) : (cases as any[]).length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-10">No support cases raised.</p>
      ) : (
        <div className="space-y-2">
          {(cases as any[]).map((c: any) => {
            const isExpanded = expandedId === c._id;
            return (
              <Card key={c._id} className="p-3">
                <button onClick={() => setExpandedId(isExpanded ? null : c._id)} className="w-full text-left">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-800">{AREAS.find((a) => a.value === c.area)?.label}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[c.status]}`}>{STATUS_LABELS[c.status]}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{c.initialConcern}</p>
                  <p className="text-xs text-slate-400 mt-1">Raised {new Date(c.raisedDate).toLocaleDateString()} by {c.raisedBy}</p>
                </button>

                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 mb-1">Strategies</p>
                      {(c.strategies || []).map((s: any, i: number) => (
                        <p key={i} className="text-xs text-slate-600 py-0.5">• {s.description} <span className="text-slate-400">({s.status})</span></p>
                      ))}
                      <div className="flex gap-2 mt-1">
                        <input
                          value={strategyDraft[c._id] || ""}
                          onChange={(e) => setStrategyDraft((p) => ({ ...p, [c._id]: e.target.value }))}
                          placeholder="Add a strategy to try…"
                          className="flex-1 text-xs border border-slate-200 rounded-lg px-2 py-1.5"
                        />
                        <button
                          onClick={() => strategyDraft[c._id] && addStrategy.mutate({ id: c._id, description: strategyDraft[c._id] })}
                          className="text-xs text-[#0C447C] font-medium px-2"
                        >
                          Add
                        </button>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-slate-500 mb-1">Reviews</p>
                      {(c.reviews || []).map((r: any, i: number) => (
                        <p key={i} className="text-xs text-slate-600 py-0.5">
                          {new Date(r.date).toLocaleDateString()} — {r.notes} <span className="text-slate-400">({r.reviewedBy})</span>
                        </p>
                      ))}
                      <div className="flex gap-2 mt-1">
                        <input
                          value={reviewDraft[c._id] || ""}
                          onChange={(e) => setReviewDraft((p) => ({ ...p, [c._id]: e.target.value }))}
                          placeholder="Add a review note…"
                          className="flex-1 text-xs border border-slate-200 rounded-lg px-2 py-1.5"
                        />
                        <button
                          onClick={() => reviewDraft[c._id] && addReview.mutate({ id: c._id, notes: reviewDraft[c._id] })}
                          className="text-xs text-[#0C447C] font-medium px-2"
                        >
                          Add
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-slate-500">Status:</p>
                      <select
                        value={c.status}
                        onChange={(e) => updateStatus.mutate({ id: c._id, status: e.target.value })}
                        className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white"
                      >
                        {Object.entries(STATUS_LABELS).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                      </select>
                    </div>
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
