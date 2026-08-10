import { useQuery } from "@tanstack/react-query";
import { Card } from "./shared";
import eceService from "../../services/ece.service";

export default function InsightsTab() {
  const { data, isLoading } = useQuery({ queryKey: ["ece-coordinator-insights"], queryFn: eceService.getCoordinatorInsights });

  if (isLoading || !data) {
    return <div className="text-center py-16 text-slate-400">Loading…</div>;
  }

  const coveragePct = data.totalChildren > 0 ? Math.round((data.observedLast7Days / data.totalChildren) * 100) : 0;
  const maxDomainCount = Math.max(1, ...data.domainCoverage.map((d: any) => d.observationCount));

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-lg font-bold text-slate-900">Insights</h2>
        <p className="text-sm text-slate-500">The first aggregate view of the whole programme — not what one classroom is doing, but all of them</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-5">
        <Card className="p-4">
          <div style={{ borderTop: "3px solid #0C447C" }} className="-mx-4 -mt-4 px-4 pt-4">
            <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Observation Coverage (7 days)</p>
            <p className="text-3xl font-bold text-[#0C447C]">{coveragePct}%</p>
            <p className="text-xs text-slate-400 mt-1">{data.observedLast7Days} of {data.totalChildren} children observed</p>
          </div>
        </Card>
        <Card className="p-4">
          <div style={{ borderTop: "3px solid #10b981" }} className="-mx-4 -mt-4 px-4 pt-4">
            <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Family Response Rate</p>
            <p className="text-3xl font-bold text-emerald-600">{data.familyEngagement.responseRate != null ? `${data.familyEngagement.responseRate}%` : "—"}</p>
            <p className="text-xs text-slate-400 mt-1">{data.familyEngagement.respondedCount} of {data.familyEngagement.sharedCount} shared entries got a response</p>
          </div>
        </Card>
        <Card className="p-4">
          <div style={{ borderTop: "3px solid #f59e0b" }} className="-mx-4 -mt-4 px-4 pt-4">
            <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Environment Areas Needing Attention</p>
            <p className="text-3xl font-bold text-amber-600">{data.staleEnvironmentAreas.length}</p>
            <p className="text-xs text-slate-400 mt-1">stale on rotation or safety check</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <p className="text-sm font-semibold text-slate-800 mb-3">Domain Coverage (last 30 days)</p>
          <p className="text-xs text-slate-400 mb-3">Are children getting balanced attention across domains, or is one doing all the work?</p>
          <div className="space-y-2">
            {data.domainCoverage.map((d: any) => (
              <div key={d.domainId}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600">{d.domainName}</span>
                  <span className="text-slate-400">{d.observationCount}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#0C447C]"
                    style={{ width: `${(d.observationCount / maxDomainCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {data.domainCoverage.every((d: any) => d.observationCount === 0) && (
              <p className="text-xs text-slate-400 text-center py-4">No observations recorded in the last 30 days.</p>
            )}
          </div>
        </Card>

        <Card className="p-4">
          <p className="text-sm font-semibold text-slate-800 mb-3">Educator Workload (last 7 days)</p>
          <p className="text-xs text-slate-400 mb-3">Who's actively observing, who might need support</p>
          <div className="space-y-1.5">
            {data.educatorWorkload.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No observations logged in the last 7 days.</p>
            ) : (
              data.educatorWorkload.map((w: any) => (
                <div key={w.teacherName} className="flex items-center justify-between text-xs px-2 py-1.5 bg-slate-50 rounded-lg">
                  <span className="text-slate-700">{w.teacherName}</span>
                  <span className="font-semibold text-slate-500">{w.observationsLast7Days} observation{w.observationsLast7Days !== 1 ? "s" : ""}</span>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="p-4">
          <p className="text-sm font-semibold text-slate-800 mb-3">Children Not Observed (7 days)</p>
          {data.neverObservedLast7Days.length === 0 ? (
            <p className="text-xs text-emerald-600 py-4 text-center">Every child has been observed in the last 7 days.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {data.neverObservedLast7Days.map((c: any) => (
                <span key={c._id} className="text-xs bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full">{c.name}</span>
              ))}
            </div>
          )}
          <p className="text-xs text-slate-400 mt-2">This is an attention signal for review, not an alert about the children themselves.</p>
        </Card>

        <Card className="p-4">
          <p className="text-sm font-semibold text-slate-800 mb-3">Environment Areas Needing Attention</p>
          {data.staleEnvironmentAreas.length === 0 ? (
            <p className="text-xs text-emerald-600 py-4 text-center">All areas are current on rotation and safety checks.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {data.staleEnvironmentAreas.map((a: any) => (
                <span key={a._id} className="text-xs bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full">{a.name}</span>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
