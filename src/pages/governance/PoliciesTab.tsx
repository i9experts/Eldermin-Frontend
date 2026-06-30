import { useState } from "react";
import { Card, CardHeader, Btn, Modal, FormField, FSelect, TableWrap, Td } from "./shared";
import { usePolicies, useCreatePolicy, useAcknowledgePolicy } from "../../hooks/useCompliance";

const ackCls: Record<string, string> = {
  Acknowledged: "bg-emerald-50 text-emerald-700",
  Overdue:      "bg-red-50 text-red-700",
  Viewed:       "bg-amber-50 text-amber-700",
  Assigned:     "bg-indigo-50 text-indigo-700",
};

export default function PoliciesTab() {
  const [assignModal, setAssignModal] = useState(false);

  const { data: rawPolicies = [], isLoading } = usePolicies();
  const policies: any[] = Array.isArray(rawPolicies) ? rawPolicies : ((rawPolicies as any)?.data ?? []);
  const acks: any[] = (rawPolicies as any)?.acknowledgements ?? [];

  const createPolicy = useCreatePolicy();
  const acknowledgePolicy = useAcknowledgePolicy();

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-900">Policy Acknowledgement Workflow</h1>
        <p className="text-sm text-slate-500 mt-0.5">Assign, track, and follow up on policy acknowledgements across all staff</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Total Assignments", value: (rawPolicies as any)?.stats?.totalAssignments },
          { label: "Acknowledged",      value: (rawPolicies as any)?.stats?.acknowledged      },
          { label: "Pending / Viewed",  value: (rawPolicies as any)?.stats?.pending           },
          { label: "Overdue",           value: (rawPolicies as any)?.stats?.overdue           },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-[10px] font-bold text-gray-400 uppercase">{k.label}</p>
            <p className="text-3xl font-black text-gray-300 mt-1">{k.value != null ? String(k.value) : "—"}</p>
            <p className="text-[10px] text-gray-300 mt-1">No data yet</p>
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
          {isLoading ? (
            <div className="flex justify-center py-12 bg-white rounded-xl border border-slate-100 shadow-sm">
              <div className="w-5 h-5 border-4 border-[#0C447C] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : policies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-xl border border-slate-100 shadow-sm">
              <div className="text-4xl mb-3">📋</div>
              <p className="text-sm font-semibold text-slate-500">No policies added yet</p>
              <p className="text-xs text-slate-400 mt-1">Use the Assign Policy button to get started</p>
            </div>
          ) : policies.map((p: any) => (
            <div key={p._id ?? p.id ?? p.title} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 mb-2">
              <div className="font-medium text-sm text-slate-800">{p.title ?? p.name}</div>
              {p.status && <div className="text-xs text-slate-400 mt-1">{p.status}</div>}
            </div>
          ))}
        </div>

        {/* Acknowledgement Status Table */}
        <Card>
          <CardHeader title="Staff Acknowledgement Status" actions={<Btn variant="secondary" size="sm">📤 Export</Btn>} />
          <TableWrap headers={["Staff", "Role", "Policy", "Assigned", "Status", "Actions"]}>
            {acks.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-sm text-slate-400">
                  No acknowledgements yet
                </td>
              </tr>
            ) : acks.map((u: any) => (
              <tr key={`${u.name}-${u.policy}`} className={`hover:bg-slate-50 ${u.status === "Overdue" ? "bg-red-50/30" : ""}`}>
                <Td className="font-semibold text-xs">{u.name}</Td>
                <Td><span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded">{u.role}</span></Td>
                <Td className="text-xs">{u.policy}</Td>
                <Td className="text-xs text-slate-400">{u.assigned}</Td>
                <Td><span className={`text-xs font-semibold px-2 py-0.5 rounded ${ackCls[u.status] ?? "bg-slate-100 text-slate-600"}`}>{u.status}</span></Td>
                <Td>
                  {u.status === "Overdue"
                    ? <Btn variant="danger" size="xs">Escalate</Btn>
                    : u.status === "Acknowledged"
                    ? <Btn variant="secondary" size="xs">Certificate</Btn>
                    : <Btn variant="secondary" size="xs">Remind</Btn>}
                </Td>
              </tr>
            ))}
          </TableWrap>
        </Card>
      </div>

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
            <FSelect options={["All Campuses", "Main Campus"]} />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Acknowledgement Deadline" required>
            <input type="date" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]" />
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
          <Btn variant="primary" onClick={() => {
            createPolicy.mutate({ title: "New Policy", status: "active" });
            setAssignModal(false);
          }}>Assign &amp; Notify Staff</Btn>
        </div>
      </Modal>
    </div>
  );
}
