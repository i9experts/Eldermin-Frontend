import { useState } from "react";
import {
  WORKFLOWS,
  Badge, Btn, Card, FInput, FSelect, FormField, Modal, PageHeader,
} from "./shared";

export default function WorkflowsTab() {
  const [modal, setModal] = useState(false);

  return (
    <div className="space-y-5">
      <PageHeader
        breadcrumbs={["Home", "Institution Setup", "Workflows"]}
        title="Approval Workflow Builder"
        subtitle={`${WORKFLOWS.length} workflows — configure multi-level authorization`}
        actions={<Btn variant="primary" size="sm" onClick={() => setModal(true)}>＋ Create Workflow</Btn>}
      />

      <div className="grid grid-cols-2 gap-4">
        {WORKFLOWS.map((w) => (
          <Card key={w.id} className="p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-sm font-bold text-slate-900">{w.name}</div>
                <div className="text-xs text-slate-400 mt-0.5">Module: {w.module} · Trigger: {w.trigger}</div>
              </div>
              <Badge status={w.status} />
            </div>
            <div className="flex items-center gap-1 mb-3 overflow-x-auto py-1">
              {(["Request", "Dept Head", "Principal", ...(w.levels >= 4 ? ["Director"] : []), ...(w.levels >= 5 ? ["Board"] : []), "Closure"] as string[]).slice(0, w.levels + 1).map((step, i, arr) => (
                <div key={i} className="flex items-center gap-1 flex-shrink-0">
                  {i > 0 && <div className="w-4 h-0.5 bg-slate-200 flex-shrink-0" />}
                  <div className={`px-2 py-1 rounded-md text-xs font-medium flex-shrink-0 ${i === 0 ? "bg-blue-50 text-[#0C447C]" : i === arr.length - 1 ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                    {step}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
              <div className="text-xs text-slate-400">SLA: <span className="font-medium text-slate-700">{w.sla}</span> · {w.levels} levels</div>
              <div className="flex gap-1">
                <button className="px-2 py-1 text-xs bg-blue-50 text-[#0C447C] rounded-lg hover:bg-blue-100 font-medium">Edit</button>
                <button className="px-2 py-1 text-xs bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 font-medium">Clone</button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Create New Workflow" size="lg">
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Workflow Name" required><FInput placeholder="e.g. Budget Approval Workflow" /></FormField>
            <FormField label="Module"><FSelect options={["Finance", "HR", "Academic", "Governance", "IT", "Procurement"]} /></FormField>
            <FormField label="Trigger Event"><FInput placeholder="e.g. Budget Request Submitted" /></FormField>
            <FormField label="SLA Time"><FInput placeholder="e.g. 48 hrs" /></FormField>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">Approval Steps</label>
            <div className="space-y-2">
              {["Request Created (Automatic)", "Department Head Review", "Principal Approval", "Director Approval"].map((step, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="w-6 h-6 bg-[#0C447C] text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</div>
                  <FInput defaultValue={step} />
                  <FSelect options={["Sequential", "Parallel"]} />
                  <FInput placeholder="SLA (hrs)" defaultValue="24" className="w-24" />
                  {i > 0 && <button className="text-red-400 hover:text-red-600 flex-shrink-0">✗</button>}
                </div>
              ))}
              <button className="w-full py-2 text-xs text-[#0C447C] border-2 border-dashed border-blue-200 rounded-lg hover:border-[#0C447C] hover:bg-blue-50 transition-colors">＋ Add Approval Step</button>
            </div>
          </div>
        </div>
        <div className="p-5 border-t border-slate-100 flex justify-end gap-2">
          <Btn variant="secondary" onClick={() => setModal(false)}>Cancel</Btn>
          <Btn variant="primary" onClick={() => setModal(false)}>✓ Save Workflow</Btn>
        </div>
      </Modal>
    </div>
  );
}
