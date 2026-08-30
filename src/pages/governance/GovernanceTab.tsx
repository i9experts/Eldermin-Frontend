import { useGovernanceRollup } from "../../hooks/useCompliance";
import { Card, CardHeader, KPICard, TableWrap, Td, HeatCell } from "./shared";

function scoreLevel(score: number): "good" | "review" | "poor" | "critical" {
  if (score >= 85) return "good";
  if (score >= 65) return "review";
  if (score >= 40) return "poor";
  return "critical";
}

const SEVERITY_ICON: Record<string, string> = { critical: "🚨", warning: "⚠️", info: "ℹ️" };
const SEVERITY_STYLE: Record<string, string> = {
  critical: "bg-red-50 border-red-200 text-red-800",
  warning: "bg-amber-50 border-amber-200 text-amber-800",
  info: "bg-blue-50 border-blue-200 text-blue-800",
};

export default function GovernanceTab() {
  const { data, isLoading } = useGovernanceRollup();
  const campuses: any[] = data?.campuses ?? [];
  const actionItems: any[] = data?.actionItems ?? [];
  const accreditation = data?.accreditation;

  const avgScore = campuses.length > 0
    ? Math.round(campuses.reduce((s, c) => s + c.score, 0) / campuses.length)
    : null;
  const worstCampus = campuses.length > 0
    ? [...campuses].sort((a, b) => a.score - b.score)[0]
    : null;

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-900">Multi-Campus Governance</h1>
        <p className="text-sm text-slate-500 mt-0.5">Central office monitoring — governance health, compliance scores, and action plans</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-4 border-[#0C447C] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : campuses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="text-5xl mb-4">🏛️</div>
          <p className="text-sm font-semibold text-gray-500">No governance records yet</p>
          <p className="text-xs text-gray-400 mt-1">This section will populate once configured</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
            <KPICard label="Campuses Monitored" value={String(campuses.length)} color="navy" />
            <KPICard label="Average Governance Score" value={avgScore != null ? String(avgScore) : "—"} color={avgScore != null && avgScore < 65 ? "red" : "green"} />
            <KPICard label="Needs Most Attention" value={worstCampus?.campusName ?? "—"} sub={worstCampus ? `Score ${worstCampus.score}` : undefined} color="amber" />
            <KPICard label="Accreditation Readiness" value={accreditation?.averageReadinessPercent != null ? `${accreditation.averageReadinessPercent}%` : "—"}
              sub={accreditation?.mandatoryGapsCount ? `${accreditation.mandatoryGapsCount} mandatory gaps` : undefined}
              color={accreditation?.mandatoryGapsCount ? "red" : "green"} />
          </div>

          <Card className="mb-5">
            <CardHeader title="Per-Campus Governance Summary" subtitle="Safeguarding, data privacy, and attendance compliance signal, by campus" />
            <div className="p-2">
              <TableWrap headers={["Campus", "Score", "Safeguarding", "Overdue DSAR", "Staff Attendance", "Student Attendance"]}>
                {campuses.map((c: any) => (
                  <tr key={c.campusId ?? "school-wide"}>
                    <Td className="font-medium text-slate-800">{c.campusName}</Td>
                    <Td><HeatCell level={scoreLevel(c.score)} /> <span className="ml-1.5 font-semibold text-slate-700">{c.score}</span></Td>
                    <Td>
                      {c.safeguarding.critical > 0 && <span className="text-red-600 font-semibold mr-1.5">{c.safeguarding.critical} critical</span>}
                      {c.safeguarding.open > 0 ? <span className="text-amber-600">{c.safeguarding.open} open</span> : (c.safeguarding.critical === 0 && <span className="text-emerald-600">None open</span>)}
                    </Td>
                    <Td>{c.overdueDsarCount > 0 ? <span className="text-red-600 font-semibold">{c.overdueDsarCount}</span> : <span className="text-emerald-600">0</span>}</Td>
                    <Td>
                      {c.staffAttendance.ratePercent != null ? `${c.staffAttendance.ratePercent}%` : "—"}
                      {c.staffAttendance.belowThresholdCount > 0 && <span className="text-red-600 ml-1.5">({c.staffAttendance.belowThresholdCount} below)</span>}
                    </Td>
                    <Td>
                      {c.studentAttendance.ratePercent != null ? `${c.studentAttendance.ratePercent}%` : "—"}
                      {c.studentAttendance.belowThresholdCount > 0 && <span className="text-red-600 ml-1.5">({c.studentAttendance.belowThresholdCount} below)</span>}
                    </Td>
                  </tr>
                ))}
              </TableWrap>
            </div>
          </Card>

          <Card>
            <CardHeader title="Action Items" subtitle="Surfaced from real per-campus signal — resolve the most urgent first" />
            <div className="p-4 space-y-2">
              {actionItems.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">No outstanding action items — every campus is within its governance thresholds.</p>
              ) : (
                actionItems.map((a: any, i: number) => (
                  <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border text-sm ${SEVERITY_STYLE[a.severity] ?? SEVERITY_STYLE.info}`}>
                    <span className="text-base">{SEVERITY_ICON[a.severity] ?? "ℹ️"}</span>
                    <span>{a.message}</span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
