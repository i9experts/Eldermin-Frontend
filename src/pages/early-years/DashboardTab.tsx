import { useQuery } from "@tanstack/react-query";
import { Card } from "./shared";
import eceService from "../../services/ece.service";

export default function DashboardTab() {
  const { data: stats } = useQuery({ queryKey: ["ece-dashboard"], queryFn: eceService.getDashboard });

  const cards = [
    { label: "Children Present Today", value: stats ? `${stats.presentToday}/${stats.totalChildren}` : "—", color: "#0C447C" },
    { label: "Observations Logged Today", value: stats?.observationsToday ?? "—", color: "#10b981" },
    { label: "Not Observed in 7 Days", value: stats?.notObservedInLast7Days ?? "—", color: stats?.notObservedInLast7Days > 0 ? "#f59e0b" : "#10b981" },
  ];

  return (
    <div>
      <h2 className="text-lg font-bold text-slate-900 mb-1">Today</h2>
      <p className="text-sm text-slate-500 mb-5">Every number here is a real, current count — not a placeholder.</p>
      <div className="grid grid-cols-3 gap-4">
        {cards.map((c) => (
          <Card key={c.label} className="p-5" >
            <div style={{ borderTop: `3px solid ${c.color}` }} className="pt-0 -mt-5 -mx-5 px-5 pt-5 rounded-t-xl">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{c.label}</p>
              <p className="text-3xl font-bold" style={{ color: c.color }}>{c.value}</p>
            </div>
          </Card>
        ))}
      </div>

      {stats && stats.notObservedInLast7Days > 0 && (
        <Card className="p-4 mt-4 border-amber-200 bg-amber-50">
          <p className="text-sm text-amber-800">
            <strong>{stats.notObservedInLast7Days}</strong> {stats.notObservedInLast7Days === 1 ? "child hasn't" : "children haven't"} been observed in the last 7 days.
            This is an attention signal for you to review, not an alert about the children themselves.
          </p>
        </Card>
      )}
    </div>
  );
}
