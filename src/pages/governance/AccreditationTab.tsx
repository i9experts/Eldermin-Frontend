import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardHeader, Btn, Badge, Alert, TableWrap, Td, ACCREDITATION } from "./shared";

const sections = ["Leadership", "Safeguarding", "Quality", "Welfare", "Finance"];

const sectionData = sections.map((sec) => {
  const items = ACCREDITATION.filter((a) => a.section === sec);
  return {
    section: sec,
    Approved:    items.filter((a) => a.status === "Approved").length,
    "In Progress": items.filter((a) => a.status === "In Progress" || a.status === "Needs Revision").length,
    "Not Started": items.filter((a) => a.status === "Not Started").length,
  };
});

export default function AccreditationTab() {
  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-900">Accreditation Reports</h1>
        <p className="text-sm text-slate-500 mt-0.5">Inspection readiness, evidence mapping, checklist and gap analysis</p>
      </div>

      <Alert type="info">
        <div className="font-semibold mb-0.5">Next OFSTED Inspection: 15 July 2026 — 62 days remaining</div>
        Current readiness: 74%. Target before inspection: 90%. 8 gaps identified. Focus areas: Curriculum Documentation, Financial Statements, and Safeguarding Policy update.
      </Alert>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Readiness Score",           value: "74%",    sub: "Target: 90% by 30 Jun", color: "purple" },
          { label: "Checklist Items Complete",  value: "35 / 48", sub: "",                     color: "green"  },
          { label: "Evidence Documents",        value: "127",    sub: "",                      color: "blue"   },
          { label: "Gaps Identified",           value: "8",      sub: "Requires action",       color: "red"    },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{k.label}</div>
            <div className="text-2xl font-bold text-slate-800 mt-1">{k.value}</div>
            {k.sub && <div className="text-xs text-slate-400 mt-1">{k.sub}</div>}
          </div>
        ))}
      </div>

      {/* Progress Chart */}
      <Card className="mb-4">
        <CardHeader title="Overall Readiness Progress" subtitle="By section — approved vs. in progress vs. not started" />
        <div className="p-5" style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sectionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="section" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Approved"      stackId="a" fill="#16a34a" radius={[0,0,0,0]} />
              <Bar dataKey="In Progress"   stackId="a" fill="#3b82f6" radius={[0,0,0,0]} />
              <Bar dataKey="Not Started"   stackId="a" fill="#fee2e2" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Checklist Table */}
      <Card>
        <CardHeader
          title="Accreditation Checklist"
          actions={
            <div className="flex gap-2">
              <Btn variant="primary" size="sm">📤 Download Full Report</Btn>
              <Btn variant="secondary" size="sm">⬆ Upload Evidence</Btn>
            </div>
          }
        />
        <div className="flex gap-2 px-5 py-3 border-b border-slate-100">
          {[
            ["All Sections", "Leadership", "Safeguarding", "Quality of Education", "Welfare", "Finance"],
            ["All Statuses", "Approved", "In Progress", "Not Started", "Needs Revision"],
          ].map((opts, i) => (
            <select key={i} className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none">
              {opts.map(o => <option key={o}>{o}</option>)}
            </select>
          ))}
        </div>

        <TableWrap headers={["Ref", "Section", "Requirement", "Evidence", "Status", "Inspector Notes", "Actions"]}>
          {ACCREDITATION.map((a) => (
            <tr key={a.ref} className={`hover:bg-slate-50 ${a.status === "Not Started" ? "bg-red-50/30" : a.status === "Needs Revision" ? "bg-amber-50/20" : ""}`}>
              <Td className="font-bold text-[#0C447C] text-xs">{a.ref}</Td>
              <Td><span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded">{a.section}</span></Td>
              <Td className="text-xs max-w-[200px]">{a.req}</Td>
              <Td>
                {a.evidence > 0
                  ? <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${a.evidence >= 2 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{a.evidence} doc{a.evidence !== 1 ? "s" : ""}</span>
                  : <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">0 docs</span>}
              </Td>
              <Td><Badge status={a.status} /></Td>
              <Td className="text-xs text-slate-400 max-w-[180px]">{a.note}</Td>
              <Td>
                {a.status === "Not Started"
                  ? <Btn variant="danger" size="xs">Start →</Btn>
                  : a.status === "Needs Revision" || a.status === "In Progress"
                  ? <Btn variant="primary" size="xs">Update</Btn>
                  : <Btn variant="secondary" size="xs">View</Btn>}
              </Td>
            </tr>
          ))}
        </TableWrap>
      </Card>
    </div>
  );
}
