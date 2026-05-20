import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardHeader, Btn, Badge, ProgressBar, HeatCell, CAMPUSES, HEATMAP_DATA } from "./shared";

const trendData = [
  { month: "Dec 25", main: 88, boys: 80, girls: 74, river: 55 },
  { month: "Jan 26", main: 89, boys: 81, girls: 75, river: 56 },
  { month: "Feb 26", main: 90, boys: 82, girls: 76, river: 58 },
  { month: "Mar 26", main: 90, boys: 83, girls: 77, river: 60 },
  { month: "Apr 26", main: 91, boys: 83, girls: 78, river: 61 },
  { month: "May 26", main: 91, boys: 84, girls: 79, river: 62 },
];

const scoreColor = (s: number) => s >= 90 ? "#16a34a" : s >= 75 ? "#EF9F27" : "#dc2626";

export default function GovernanceTab() {
  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-900">Multi-Campus Governance</h1>
        <p className="text-sm text-slate-500 mt-0.5">Central office monitoring — governance health, compliance scores, and action plans</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Network Governance Score", value: "84%", color: "green"  },
          { label: "Total Campuses",           value: "4",   color: "navy"   },
          { label: "Total Open Issues",        value: "25",  color: "amber"  },
          { label: "Escalated Items",          value: "6",   color: "red"    },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{k.label}</div>
            <div className="text-2xl font-bold text-slate-800 mt-1">{k.value}</div>
          </div>
        ))}
      </div>

      {/* Campus Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {CAMPUSES.map((c) => (
          <div key={c.id} className={`bg-white rounded-xl border shadow-sm p-5 ${c.status === "Critical" ? "border-red-300" : "border-slate-100"}`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-bold text-slate-800">🏫 {c.name}</div>
                <div className="text-xs text-slate-400 mt-0.5">Head: {c.head}</div>
              </div>
              <Badge status={c.risk} />
            </div>
            <div className="flex items-center gap-3 mb-3">
              <div className="text-3xl font-black leading-none" style={{ color: scoreColor(c.score) }}>{c.score}%</div>
              <div className="flex-1">
                <ProgressBar pct={c.score} color={scoreColor(c.score)} />
                <div className="text-xs text-slate-400 mt-1">Overall governance compliance</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 mb-3">
              <span className="text-xs text-slate-500">📋 Issues: <strong>{c.issues}</strong></span>
              <span className="text-xs text-slate-500">📅 Reviewed: {c.lastReview}</span>
              <span className="text-xs text-slate-500">📊 Attendance: {c.att}%</span>
            </div>
            <div>
              {c.status === "Critical"
                ? <Btn variant="danger" size="sm" className="w-full justify-center">⚠ Review Urgently →</Btn>
                : <Btn variant="secondary" size="sm" className="w-full justify-center">Drill Down →</Btn>}
            </div>
          </div>
        ))}
      </div>

      {/* Governance Trend Chart */}
      <Card className="mb-4">
        <CardHeader title="Governance Scores — 6 Month Trend" />
        <div className="p-5" style={{ height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis domain={[40, 100]} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
              <Tooltip formatter={(v) => `${v}%`} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="main"  name="Main Campus"  stroke="#16a34a" strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="boys"  name="Boys Campus"  stroke="#2563eb" strokeWidth={2}   dot={{ r: 2 }} />
              <Line type="monotone" dataKey="girls" name="Girls Campus" stroke="#EF9F27" strokeWidth={2}   dot={{ r: 2 }} />
              <Line type="monotone" dataKey="river" name="Riverside"    stroke="#dc2626" strokeWidth={2}   strokeDasharray="5 3" dot={{ r: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Risk Heatmap */}
      <Card>
        <CardHeader
          title="Compliance Risk Heatmap — By Area & Campus"
          actions={
            <div className="flex gap-1.5 items-center">
              {["good", "review", "poor", "critical"].map((l) => (
                <HeatCell key={l} level={l} />
              ))}
            </div>
          }
        />
        <div className="overflow-x-auto p-5">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="text-left font-semibold text-slate-600 pb-2 min-w-[140px]">Area</th>
                {["Al-Noor Main", "Boys Campus", "Girls Campus", "Riverside"].map((h) => (
                  <th key={h} className="text-center font-semibold text-slate-600 pb-2 px-2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {HEATMAP_DATA.map((row) => (
                <tr key={row.area}>
                  <td className="py-2 font-semibold text-slate-700">{row.area}</td>
                  <td className="py-2 px-2 text-center"><HeatCell level={row.main} /></td>
                  <td className="py-2 px-2 text-center"><HeatCell level={row.boys} /></td>
                  <td className="py-2 px-2 text-center"><HeatCell level={row.girls} /></td>
                  <td className="py-2 px-2 text-center"><HeatCell level={row.river} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
