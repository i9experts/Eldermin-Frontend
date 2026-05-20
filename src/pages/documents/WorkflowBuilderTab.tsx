import { useState } from "react";
import { Card, CardHeader, Btn, FInput, FSelect, FormField } from "./shared";

type StepType = "start" | "upload" | "review" | "approve" | "sign" | "notify" | "end";

interface WFStep {
  id: number;
  type: StepType;
  label: string;
  assignee: string;
  days: number;
}

const STEP_META: Record<StepType, { icon: string; color: string; bg: string }> = {
  start:   { icon: "▶", color: "#16a34a", bg: "#dcfce7" },
  upload:  { icon: "📄", color: "#0C447C", bg: "#dbeafe" },
  review:  { icon: "👁", color: "#d97706", bg: "#fef3c7" },
  approve: { icon: "✓",  color: "#16a34a", bg: "#dcfce7" },
  sign:    { icon: "✍", color: "#7c3aed", bg: "#ede9fe" },
  notify:  { icon: "🔔", color: "#0891b2", bg: "#cffafe" },
  end:     { icon: "⏹", color: "#64748b", bg: "#f1f5f9" },
};

const INITIAL_STEPS: WFStep[] = [
  { id: 1, type: "start",   label: "Trigger",        assignee: "System",         days: 0 },
  { id: 2, type: "upload",  label: "Document Upload", assignee: "HR Manager",     days: 1 },
  { id: 3, type: "review",  label: "First Review",    assignee: "Department Head", days: 2 },
  { id: 4, type: "approve", label: "Principal Approval", assignee: "Principal",   days: 1 },
  { id: 5, type: "sign",    label: "E-Signature",     assignee: "All Parties",    days: 2 },
  { id: 6, type: "end",     label: "Complete",        assignee: "System",         days: 0 },
];

export default function WorkflowBuilderTab() {
  const [steps, setSteps] = useState<WFStep[]>(INITIAL_STEPS);
  const [selected, setSelected] = useState<number | null>(2);
  const [saved, setSaved] = useState(false);

  const sel = steps.find((s) => s.id === selected);

  const addStep = () => {
    const id = Date.now();
    setSteps((prev) => {
      const last = prev.length - 1;
      return [...prev.slice(0, last), { id, type: "review", label: "New Step", assignee: "Unassigned", days: 1 }, prev[last]];
    });
    setSelected(id);
  };

  const removeStep = (id: number) => {
    setSteps((prev) => prev.filter((s) => s.id !== id));
    if (selected === id) setSelected(null);
  };

  const updateSel = (field: keyof WFStep, val: string | number) => {
    setSteps((prev) => prev.map((s) => s.id === selected ? { ...s, [field]: val } : s));
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Workflow Builder</h1>
          <p className="text-sm text-slate-500 mt-0.5">Design custom document approval workflows</p>
        </div>
        <div className="flex gap-2">
          <Btn variant="secondary" size="sm">📂 Load Template</Btn>
          <Btn variant={saved ? "success" : "primary"} size="sm" onClick={handleSave}>
            {saved ? "✓ Saved!" : "💾 Save Workflow"}
          </Btn>
        </div>
      </div>

      {/* Workflow metadata */}
      <Card className="mb-4 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <FormField label="Workflow Name"><FInput defaultValue="Staff Onboarding — HR Policy Flow" /></FormField>
          <FormField label="Type"><FSelect options={["HR", "Policy", "Academic", "Institutional"]} /></FormField>
          <FormField label="Trigger"><FSelect options={["Manual Start", "Doc Upload", "Expiry Reminder", "Annual Trigger", "New Hire"]} /></FormField>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Flow canvas */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader
              title="Workflow Steps"
              actions={
                <div className="flex gap-2">
                  <Btn variant="secondary" size="xs" onClick={addStep}>+ Add Step</Btn>
                  <span className="text-xs text-slate-500 self-center">{steps.length} steps · {steps.reduce((a, s) => a + s.days, 0)} days total</span>
                </div>
              }
            />
            <div className="p-5 space-y-2">
              {steps.map((step, idx) => {
                const meta = STEP_META[step.type];
                const isLast = idx === steps.length - 1;
                return (
                  <div key={step.id}>
                    <div
                      onClick={() => setSelected(step.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selected === step.id ? "border-[#0C447C] bg-blue-50 shadow-sm" : "border-slate-100 bg-white hover:bg-slate-50"}`}
                    >
                      {/* Step number */}
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-slate-500 bg-slate-100 flex-shrink-0">{idx + 1}</div>
                      {/* Icon */}
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0" style={{ background: meta.bg, color: meta.color }}>
                        {meta.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-800 text-sm">{step.label}</div>
                        <div className="text-xs text-slate-500">{step.assignee} {step.days > 0 ? `· ${step.days}d SLA` : ""}</div>
                      </div>
                      {step.type !== "start" && step.type !== "end" && (
                        <button
                          onClick={(e) => { e.stopPropagation(); removeStep(step.id); }}
                          className="w-6 h-6 rounded-full flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 text-xs flex-shrink-0"
                        >✕</button>
                      )}
                    </div>
                    {!isLast && (
                      <div className="flex justify-center my-0.5">
                        <div className="w-0.5 h-4 bg-slate-200" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Config panel */}
        <div>
          <Card>
            <CardHeader title={sel ? `Configure: ${sel.label}` : "Select a step"} />
            {sel ? (
              <div className="p-4 space-y-3">
                <FormField label="Step Name">
                  <FInput value={sel.label} onChange={(e) => updateSel("label", e.target.value)} />
                </FormField>
                <FormField label="Step Type">
                  <FSelect
                    options={["start", "upload", "review", "approve", "sign", "notify", "end"]}
                    value={sel.type}
                    onChange={(e) => updateSel("type", e.target.value as StepType)}
                  />
                </FormField>
                <FormField label="Assigned To">
                  <FSelect
                    options={["System", "HR Manager", "Department Head", "Principal", "Finance Officer", "Academic Coordinator", "All Parties", "Unassigned"]}
                    value={sel.assignee}
                    onChange={(e) => updateSel("assignee", e.target.value)}
                  />
                </FormField>
                {sel.type !== "start" && sel.type !== "end" && (
                  <FormField label="SLA (days)">
                    <FInput
                      type="number"
                      min={0}
                      max={30}
                      value={sel.days}
                      onChange={(e) => updateSel("days", parseInt(e.target.value) || 0)}
                    />
                  </FormField>
                )}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded" /> Send email notification
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input type="checkbox" className="rounded" /> Allow parallel approval
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded" /> Auto-escalate on overdue
                  </label>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-sm">Click a step to configure it</div>
            )}
          </Card>

          {/* Template picker */}
          <Card className="mt-4">
            <CardHeader title="Templates" />
            <div className="p-3 space-y-2">
              {["Staff Onboarding", "Policy Review", "Affiliation Renewal", "Academic Approval"].map((t) => (
                <button key={t} className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <span>📋 {t}</span>
                  <span className="text-[#0C447C] font-semibold">Load →</span>
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
