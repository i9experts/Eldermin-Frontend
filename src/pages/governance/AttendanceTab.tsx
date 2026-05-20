import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Card, CardHeader, Btn, TableWrap, Td, ATTENDANCE_RISK } from "./shared";

const campusData = [
  { campus: "Main Campus",  att: 94.2, fill: "#16a34a" },
  { campus: "Boys Campus",  att: 91.8, fill: "#16a34a" },
  { campus: "Girls Campus", att: 88.6, fill: "#EF9F27" },
  { campus: "Riverside",    att: 81.3, fill: "#dc2626" },
];

const attColor = (pct: number) =>
  pct < 80 ? "#991b1b" : pct < 85 ? "#dc2626" : pct < 90 ? "#EF9F27" : "#16a34a";

const statusCls: Record<string, string> = {
  "Persistent Absence": "bg-slate-800 text-slate-100",
  Critical:             "bg-red-50 text-red-700",
  "At Risk":            "bg-amber-50 text-amber-700",
};

export default function AttendanceTab() {
  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-900">Attendance Compliance</h1>
        <p className="text-sm text-slate-500 mt-0.5">Student and staff attendance monitoring against statutory and institutional thresholds</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Overall Attendance Rate",       value: "92.4%", sub: "↑ Target: 90% ✓",         color: "green" },
          { label: "Students at Risk (<85%)",       value: "18",    sub: "↑ +3 this week",           color: "red"   },
          { label: "Persistent Absence (<80%)",     value: "7",     sub: "Requires formal action",    color: "amber" },
          { label: "Staff Attendance",              value: "96.8%", sub: "Above target ↑",           color: "green" },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{k.label}</div>
            <div className="text-2xl font-bold text-slate-800 mt-1">{k.value}</div>
            {k.sub && <div className="text-xs text-slate-400 mt-1">{k.sub}</div>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Campus Attendance Chart */}
        <Card>
          <CardHeader title="Campus Attendance Comparison" />
          <div className="p-5" style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={campusData} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="campus" tick={{ fontSize: 11 }} />
                <YAxis domain={[70, 100]} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(v) => `${v}%`} />
                <ReferenceLine y={90} stroke="#6b7280" strokeDasharray="5 4" strokeWidth={1.5} label={{ value: "Target 90%", position: "right", fontSize: 10, fill: "#6b7280" }} />
                <Bar dataKey="att" name="Attendance %" radius={[4, 4, 0, 0]}>
                  {campusData.map((entry, i) => (
                    <rect key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Risk Breakdown */}
        <Card>
          <CardHeader title="Attendance Risk Categories" />
          <div className="px-5 py-4 divide-y divide-slate-50">
            {[
              { label: "🟢 Compliant (≥95%)",             n: 312, color: "#16a34a" },
              { label: "🟡 Needs Attention (90–94%)",      n: 87,  color: "#EF9F27" },
              { label: "🟠 At Risk (85–89%)",              n: 31,  color: "#ea580c" },
              { label: "🔴 Critical (80–84%)",             n: 11,  color: "#dc2626" },
              { label: "⛔ Persistent Absence (<80%)",      n: 7,   color: "#991b1b" },
            ].map((c) => (
              <div key={c.label} className="flex items-center justify-between py-2.5">
                <span className="text-xs text-slate-600">{c.label}</span>
                <span className="text-xs font-bold" style={{ color: c.color }}>{c.n} students</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Risk Table */}
      <Card>
        <CardHeader
          title="Student Attendance Risk List"
          subtitle="Students below threshold requiring intervention"
          actions={
            <div className="flex gap-2">
              <Btn variant="primary" size="sm">📤 Export Report</Btn>
              <Btn variant="secondary" size="sm">Send Reminders</Btn>
            </div>
          }
        />
        <div className="flex flex-wrap gap-2 px-5 py-3 border-b border-slate-100">
          <input placeholder="🔍 Search students…" className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C] w-40" />
          {[
            ["All Campuses", "Main Campus", "Boys Campus", "Girls Campus", "Riverside"],
            ["All Year Groups", "Year 7", "Year 8", "Year 9", "Year 10", "Year 11"],
            ["All Risk Levels", "Persistent Absence", "Critical", "At Risk"],
          ].map((opts, i) => (
            <select key={i} className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none">
              {opts.map(o => <option key={o}>{o}</option>)}
            </select>
          ))}
        </div>

        <TableWrap headers={["Student", "Year Group", "Campus", "Attendance %", "Days Absent", "Last Absent", "Status", "Actions"]}>
          {ATTENDANCE_RISK.map((s) => (
            <tr key={s.name} className={`hover:bg-slate-50 ${s.pct < 85 ? "bg-red-50/30" : s.pct < 90 ? "bg-amber-50/20" : ""}`}>
              <Td className="font-semibold text-xs">{s.name}</Td>
              <Td className="text-xs">{s.year}</Td>
              <Td className="text-xs">{s.campus}</Td>
              <Td><span className="text-xs font-bold" style={{ color: attColor(s.pct) }}>{s.pct}%</span></Td>
              <Td className="text-xs font-semibold">{s.days} days</Td>
              <Td className="text-xs text-slate-400">{s.last}</Td>
              <Td><span className={`text-xs font-semibold px-2 py-0.5 rounded ${statusCls[s.status] ?? "bg-amber-50 text-amber-700"}`}>{s.status}</span></Td>
              <Td>
                {s.status === "Persistent Absence" ? <Btn variant="danger" size="xs">Escalate</Btn>
                 : s.status === "Critical"         ? <Btn variant="danger" size="xs">Follow-up</Btn>
                 : <Btn variant="secondary" size="xs">Contact</Btn>}
              </Td>
            </tr>
          ))}
        </TableWrap>

        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50 rounded-b-xl">
          <span className="text-xs text-slate-500">Showing 7 of 18 at-risk students</span>
          <div className="flex gap-1">
            {["←", "1", "2", "3", "→"].map((p) => (
              <button key={p} className={`min-w-[28px] h-7 rounded border text-xs font-medium ${p === "1" ? "bg-[#0C447C] text-white border-[#0C447C]" : "bg-white text-slate-600 border-slate-200"}`}>{p}</button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
