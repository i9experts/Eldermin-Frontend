import { useState } from "react";
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardHeader, Btn, Badge, Alert, Modal, FormField, FInput, FSelect, TableWrap, Td, SAFEGUARDING_CASES, SAFEGUARDING_TRAINING } from "./shared";

const caseChartData = [
  { name: "Resolved",     value: 14, color: "#16a34a" },
  { name: "Under Review", value: 2,  color: "#EF9F27" },
  { name: "Escalated",    value: 1,  color: "#dc2626" },
  { name: "New",          value: 1,  color: "#3b82f6" },
];

const severityBorder: Record<string, string> = {
  critical: "border-l-red-500",
  high:     "border-l-amber-500",
  new:      "border-l-blue-500",
};

export default function SafeguardingTab() {
  const [incidentModal, setIncidentModal] = useState(false);

  return (
    <div>
      {/* Restricted banner */}
      <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 mb-4">
        <span className="text-base">🔒</span>
        <span className="text-xs font-semibold text-red-800">RESTRICTED — Child safeguarding data is strictly confidential. All access is logged and monitored. Authorised personnel only. Breaches will be escalated.</span>
      </div>

      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-900">Child Safeguarding Compliance</h1>
        <p className="text-sm text-slate-500 mt-0.5">Incident reporting, case tracking, staff verification and safeguarding compliance</p>
      </div>

      <Alert type="danger">
        <div className="font-semibold mb-0.5">URGENT: Case #CS-2026-041 — 8 Days Overdue for DSL Resolution</div>
        The Designated Safeguarding Lead must review and action this case immediately. Failure to act may result in regulatory escalation to the Local Authority.
      </Alert>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Open Cases",                 value: "3",    sub: "1 critical overdue",     color: "red"   },
          { label: "Under DSL Review",           value: "2",    sub: "",                       color: "amber" },
          { label: "Resolved This Year",         value: "14",   sub: "",                       color: "green" },
          { label: "Staff Safeguarding Trained", value: "87%",  sub: "9 staff overdue",        color: "blue"  },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{k.label}</div>
            <div className="text-2xl font-bold text-slate-800 mt-1">{k.value}</div>
            {k.sub && <div className="text-xs text-slate-400 mt-1">{k.sub}</div>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Active Cases */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-slate-800">Active Cases</h2>
            <Btn variant="danger" size="sm" onClick={() => setIncidentModal(true)}>+ Report Incident</Btn>
          </div>
          <div className="space-y-3">
            {SAFEGUARDING_CASES.map((c) => (
              <div key={c.id} className={`bg-white border-l-4 rounded-xl border border-slate-100 shadow-sm p-4 ${severityBorder[c.severity] ?? "border-l-slate-200"}`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-xs text-slate-400 font-medium">Case {c.id} · {c.campus}</div>
                    <div className="font-semibold text-slate-800 text-sm">{c.category}</div>
                  </div>
                  <Badge status={c.status} />
                </div>
                <div className="text-xs text-slate-500 mb-2 leading-relaxed">{c.desc}</div>
                <div className="flex items-center flex-wrap gap-2">
                  <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded">{c.year}</span>
                  <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded">Reporter: {c.reporter}</span>
                  {c.days > 0
                    ? <span className="text-red-600 font-bold text-xs">⚠ {c.days} days overdue</span>
                    : <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">New today</span>}
                  <div className="ml-auto">
                    {c.severity === "critical"
                      ? <Btn variant="danger" size="xs">Escalate Now</Btn>
                      : <Btn variant="secondary" size="xs">Review Case</Btn>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {/* Case Status Chart */}
          <Card>
            <CardHeader title="Case Status Summary" />
            <div style={{ height: 200 }} className="px-4 pt-2 pb-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={caseChartData} dataKey="value" cx="50%" cy="50%" innerRadius="55%" outerRadius="75%">
                    {caseChartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* DBS Status */}
          <Card>
            <CardHeader title="Staff DBS Verification Status" />
            <div className="px-5 pb-4">
              <Alert type="danger">
                <div className="font-semibold mb-0.5">2 Staff Missing Valid DBS Clearance</div>
                Must be resolved before next student contact day.
              </Alert>
              {[
                { label: "Total Teaching Staff",      value: "68",      cls: "text-slate-800"   },
                { label: "DBS Cleared & Current",     value: "66 (97%)", cls: "text-emerald-600" },
                { label: "Missing DBS",               value: "2",       cls: "text-red-600"     },
                { label: "DBS Expiring (90 days)",    value: "5",       cls: "text-amber-600"   },
              ].map((s) => (
                <div key={s.label} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <span className="text-xs text-slate-500">{s.label}</span>
                  <span className={`text-xs font-bold ${s.cls}`}>{s.value}</span>
                </div>
              ))}
              <div className="mt-3">
                <Btn variant="danger" size="sm">View Missing DBS Records →</Btn>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Training Table */}
      <Card>
        <CardHeader
          title="Safeguarding Training Compliance"
          actions={
            <div className="flex gap-2">
              <Btn variant="primary" size="sm">Send Reminders</Btn>
              <Btn variant="secondary" size="sm">📤 Export Register</Btn>
            </div>
          }
        />
        <TableWrap headers={["Staff Member", "Role", "Campus", "Last Training", "Next Due", "DBS Status", "Training Status"]}>
          {SAFEGUARDING_TRAINING.map((s) => (
            <tr key={s.name} className={`hover:bg-slate-50 ${s.training === "Overdue" || s.dbs === "Missing" ? "bg-red-50/30" : s.training === "Due Soon" ? "bg-amber-50/20" : ""}`}>
              <Td className="font-semibold text-xs">{s.name}</Td>
              <Td><span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded">{s.role}</span></Td>
              <Td className="text-xs">{s.campus}</Td>
              <Td className="text-xs text-slate-400">{s.last}</Td>
              <Td className="text-xs text-slate-400">{s.next}</Td>
              <Td><Badge status={s.dbs} /></Td>
              <Td><Badge status={s.training} /></Td>
            </tr>
          ))}
        </TableWrap>
      </Card>

      {/* Report Incident Modal */}
      <Modal open={incidentModal} onClose={() => setIncidentModal(false)} title="🔒 Report Safeguarding Incident" size="lg">
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4 text-xs text-red-800 font-semibold">
          🔒 This report is strictly confidential. Do not share with unauthorised persons. Record factual observations only.
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Student Name / Anonymous Code" required><FInput placeholder="Full name or code (e.g. STU-2026-041)" /></FormField>
          <FormField label="Year Group"><FSelect options={["Year 7", "Year 8", "Year 9", "Year 10", "Year 11"]} /></FormField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Incident Type" required>
            <FSelect options={["Select type…", "Welfare Concern", "Behavioural Change", "Disclosure by Student", "Physical Injury / Mark", "Online Safety Concern", "Domestic Situation", "Peer Abuse / Bullying", "Other"]} />
          </FormField>
          <FormField label="Priority" required>
            <FSelect options={["Medium", "High", "Critical — Immediate DSL Action Required"]} />
          </FormField>
        </div>
        <FormField label="Detailed Factual Account" required>
          <textarea className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none resize-none h-24" placeholder="Describe exactly what you observed. Use factual language only — no interpretations. Include date, time, location, and witnesses." />
          <div className="text-xs text-slate-400 mt-1">Do not contact parents or discuss with colleagues. Report directly to the DSL.</div>
        </FormField>
        <FormField label="Assign to DSL">
          <FSelect options={["Dr. Yusuf Al-Amin (DSL — Main Campus)", "Ustadha Zainab Haris (DDSL — Girls Campus)"]} />
        </FormField>
        <FormField label="Supporting Evidence (optional)"><FInput type="file" /></FormField>
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 mt-4">
          <Btn variant="secondary" onClick={() => setIncidentModal(false)}>Cancel</Btn>
          <Btn variant="danger">Submit Confidential Report →</Btn>
        </div>
      </Modal>
    </div>
  );
}
