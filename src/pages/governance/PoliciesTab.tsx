import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardHeader, Btn, Badge, Alert, Modal, FormField, FSelect, ProgressBar, TableWrap, Td, POLICIES, POLICY_ACKS } from "./shared";

const completionData = [
  { campus: "Main Campus",  Acknowledged: 89, Pending: 8,  Overdue: 3  },
  { campus: "Boys Campus",  Acknowledged: 84, Pending: 12, Overdue: 4  },
  { campus: "Girls Campus", Acknowledged: 78, Pending: 16, Overdue: 6  },
  { campus: "Riverside",    Acknowledged: 62, Pending: 24, Overdue: 14 },
];

const ackCls: Record<string, string> = {
  Acknowledged: "bg-emerald-50 text-emerald-700",
  Overdue:      "bg-red-50 text-red-700",
  Viewed:       "bg-amber-50 text-amber-700",
  Assigned:     "bg-indigo-50 text-indigo-700",
};

const barColor = (status: string, pct: number) => {
  if (status === "Complete") return "#16a34a";
  if (status === "Overdue")  return "#dc2626";
  return pct >= 80 ? "#EF9F27" : "#2563eb";
};

export default function PoliciesTab() {
  const [assignModal, setAssignModal] = useState(false);

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-900">Policy Acknowledgement Workflow</h1>
        <p className="text-sm text-slate-500 mt-0.5">Assign, track, and follow up on policy acknowledgements across all staff</p>
      </div>

      <Alert type="warning">
        <div className="font-semibold mb-0.5">27 Policy Acknowledgements Outstanding — 5 Overdue</div>
        The Safeguarding Policy acknowledgement is critically overdue. 28 staff have not yet acknowledged. Campus heads must ensure completion within 48 hours.
      </Alert>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Total Assignments", value: "142", color: "navy"  },
          { label: "Acknowledged",      value: "115", sub: "81% completion rate", color: "green"  },
          { label: "Pending / Viewed",  value: "22",  color: "amber" },
          { label: "Overdue",           value: "5",   sub: "Require escalation", color: "red"    },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{k.label}</div>
            <div className="text-2xl font-bold text-slate-800 mt-1">{k.value}</div>
            {k.sub && <div className="text-xs text-slate-400 mt-1">{k.sub}</div>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Active Policies */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-slate-800">Active Policies</h2>
            <Btn variant="primary" size="sm" onClick={() => setAssignModal(true)}>+ Assign Policy</Btn>
          </div>
          <div className="space-y-3">
            {POLICIES.map((p) => {
              const pct = Math.round((p.acknowledged / p.total) * 100);
              const color = barColor(p.status, pct);
              return (
                <div key={p.title} className={`bg-white border rounded-xl shadow-sm p-4 flex gap-3 ${p.overdue ? "border-red-200 bg-red-50/20" : "border-slate-100"}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${p.overdue ? "bg-red-100" : "bg-slate-100"}`}>{p.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-xs text-slate-800 mb-0.5">{p.title}</div>
                    <div className="text-xs text-slate-400 mb-2">Deadline: {p.deadline} · {p.scope}</div>
                    <ProgressBar pct={pct} color={color} />
                    <div className="text-xs text-slate-400 mt-1">{pct}% acknowledged ({p.acknowledged}/{p.total})</div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <Badge status={p.status} />
                    {p.status === "Complete"
                      ? <Btn variant="secondary" size="xs">Certificate</Btn>
                      : p.overdue
                      ? <Btn variant="danger" size="xs">Escalate</Btn>
                      : <Btn variant="secondary" size="xs">Remind</Btn>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Acknowledgement Status Table */}
        <Card>
          <CardHeader title="Staff Acknowledgement Status" actions={<Btn variant="secondary" size="sm">📤 Export</Btn>} />
          <div className="flex gap-2 px-5 py-2 border-b border-slate-100">
            <input placeholder="🔍 Search staff…" className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none w-36" />
            <select className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none">
              {["All Statuses", "Acknowledged", "Pending", "Overdue"].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <TableWrap headers={["Staff", "Role", "Policy", "Assigned", "Status", "Actions"]}>
            {POLICY_ACKS.map((u) => (
              <tr key={`${u.name}-${u.policy}`} className={`hover:bg-slate-50 ${u.status === "Overdue" ? "bg-red-50/30" : ""}`}>
                <Td className="font-semibold text-xs">{u.name}</Td>
                <Td><span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded">{u.role}</span></Td>
                <Td className="text-xs">{u.policy}</Td>
                <Td className="text-xs text-slate-400">{u.assigned}</Td>
                <Td><span className={`text-xs font-semibold px-2 py-0.5 rounded ${ackCls[u.status] ?? "bg-slate-100 text-slate-600"}`}>{u.status}</span></Td>
                <Td>
                  {u.status === "Overdue"      ? <Btn variant="danger" size="xs">Escalate</Btn>
                   : u.status === "Acknowledged" ? <Btn variant="secondary" size="xs">Certificate</Btn>
                   : <Btn variant="secondary" size="xs">Remind</Btn>}
                </Td>
              </tr>
            ))}
          </TableWrap>
        </Card>
      </div>

      {/* Campus Completion Chart */}
      <Card>
        <CardHeader title="Campus Completion Report — Policy Acknowledgements" />
        <div className="p-5" style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={completionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="campus" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Acknowledged" stackId="a" fill="#16a34a" radius={[0,0,0,0]} />
              <Bar dataKey="Pending"      stackId="a" fill="#fef3c7" radius={[0,0,0,0]} />
              <Bar dataKey="Overdue"      stackId="a" fill="#fee2e2" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Assign Policy Modal */}
      <Modal open={assignModal} onClose={() => setAssignModal(false)} title="Assign Policy for Acknowledgement">
        <FormField label="Select Policy" required>
          <FSelect options={["Staff Code of Conduct 2026", "Safeguarding & Child Protection Policy", "Data Protection Policy 2026", "Health & Safety Policy", "Anti-Bullying & Behaviour Policy", "Mobile Device & IT Acceptable Use"]} />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Assign To" required>
            <FSelect options={["All Staff — All Campuses", "Teaching Staff Only", "Admin Staff Only", "Campus Heads", "New Starters Only", "Select Individuals…"]} />
          </FormField>
          <FormField label="Campus">
            <FSelect options={["All Campuses", "Main Campus", "Boys Campus", "Girls Campus", "Riverside Branch"]} />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Acknowledgement Deadline" required>
            <input type="date" defaultValue="2026-05-31" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]" />
          </FormField>
          <FormField label="Reminder Frequency">
            <FSelect options={["Every 3 days", "Weekly", "Once"]} />
          </FormField>
        </div>
        <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer mb-2">
          <input type="checkbox" defaultChecked className="accent-[#0C447C]" /> Send email notification to all assignees upon assignment
        </label>
        <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
          <input type="checkbox" defaultChecked className="accent-[#0C447C]" /> Generate digital acknowledgement certificate upon completion
        </label>
        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 mt-4">
          <Btn variant="secondary" onClick={() => setAssignModal(false)}>Cancel</Btn>
          <Btn variant="primary">Assign & Notify Staff</Btn>
        </div>
      </Modal>
    </div>
  );
}
