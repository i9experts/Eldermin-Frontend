import React from "react";

// ─── TYPES ────────────────────────────────────────────────────────────────────
export type DocTab =
  | "dashboard" | "documents" | "workflows" | "wfbuilder"
  | "approvals" | "esignatures" | "tasks" | "notifications"
  | "audit" | "permissions" | "detail";

// Seed data removed — use API

// ─── UI PRIMITIVES ────────────────────────────────────────────────────────────
const STATUS_MAP: Record<string, string> = {
  Approved:       "bg-emerald-50 text-emerald-700 border-emerald-200",
  Complete:       "bg-emerald-50 text-emerald-700 border-emerald-200",
  Completed:      "bg-emerald-50 text-emerald-700 border-emerald-200",
  Pending:        "bg-amber-50 text-amber-700 border-amber-200",
  "Under Review": "bg-amber-50 text-amber-700 border-amber-200",
  "Pending Sign": "bg-orange-50 text-orange-700 border-orange-200",
  Draft:          "bg-slate-100 text-slate-600 border-slate-200",
  Expiring:       "bg-red-50 text-red-700 border-red-200",
  Escalated:      "bg-red-50 text-red-700 border-red-200",
  "At Risk":      "bg-red-50 text-red-700 border-red-200",
  "In Progress":  "bg-blue-50 text-blue-700 border-blue-200",
  Success:        "bg-emerald-50 text-emerald-700 border-emerald-200",
  Warning:        "bg-amber-50 text-amber-700 border-amber-200",
  Critical:       "bg-red-50 text-red-700 border-red-200",
  High:           "bg-orange-50 text-orange-700 border-orange-200",
  Medium:         "bg-amber-50 text-amber-700 border-amber-200",
  Low:            "bg-slate-100 text-slate-600 border-slate-200",
};

export const Badge = ({ status, small }: { status: string; small?: boolean }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-full border font-medium ${small ? "text-xs" : "text-xs"} ${STATUS_MAP[status] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}>
    {status}
  </span>
);

export const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-xl border border-slate-100 shadow-sm ${className}`}>{children}</div>
);

export const CardHeader = ({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) => (
  <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
    <div>
      <div className="font-semibold text-slate-800 text-sm">{title}</div>
      {subtitle && <div className="text-xs text-slate-500 mt-0.5">{subtitle}</div>}
    </div>
    {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
  </div>
);

export const KPICard = ({ icon, label, value, sub, color = "navy" }: { icon: string; label: string; value: string | number; sub?: string; color?: string }) => {
  const bar: Record<string, string> = {
    navy: "bg-[#0C447C]", amber: "bg-[#EF9F27]", red: "bg-red-500",
    green: "bg-emerald-500", blue: "bg-blue-500", orange: "bg-orange-500", purple: "bg-purple-500",
  };
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
      <div className={`h-1 ${bar[color] ?? "bg-slate-300"}`} />
      <div className="p-4">
        {icon && <div className="text-xl mb-2">{icon}</div>}
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</div>
        <div className="text-2xl font-bold text-slate-800 mt-1">{value}</div>
        {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
      </div>
    </div>
  );
};

export const Btn = ({
  variant = "primary", size = "md", children, onClick, className = "",
}: { variant?: "primary" | "secondary" | "danger" | "success" | "amber" | "ghost"; size?: "xs" | "sm" | "md"; children: React.ReactNode; onClick?: () => void; className?: string }) => {
  const v = {
    primary:   "bg-[#0C447C] text-white hover:bg-[#0b3d6e] border-[#0C447C]",
    secondary: "bg-white text-slate-700 hover:bg-slate-50 border-slate-200",
    danger:    "bg-red-600 text-white hover:bg-red-700 border-red-600",
    success:   "bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-600",
    amber:     "bg-[#EF9F27] text-white hover:bg-amber-500 border-[#EF9F27]",
    ghost:     "bg-transparent text-slate-600 hover:bg-slate-50 border-transparent",
  };
  const s = { xs: "px-2 py-1 text-xs", sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm" };
  return (
    <button onClick={onClick} className={`${v[variant]} ${s[size]} border rounded-lg font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${className}`}>
      {children}
    </button>
  );
};

export const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
  <button onClick={() => onChange(!checked)} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${checked ? "bg-emerald-500" : "bg-slate-200"}`}>
    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
  </button>
);

export const Modal = ({ open, onClose, title, children, size = "md" }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; size?: "sm" | "md" | "lg" }) => {
  if (!open) return null;
  const sizes = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-2xl" };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${sizes[size]} max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400">✕</button>
        </div>
        <div className="overflow-y-auto flex-1 px-5 py-4">{children}</div>
      </div>
    </div>
  );
};

export const FormField = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
  <div className="mb-3">
    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

export const FInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} className={`w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C] focus:border-transparent ${props.className ?? ""}`} />
);

export const FSelect = ({ options, ...props }: { options: string[] } & React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select {...props} className={`w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C] focus:border-transparent bg-white ${props.className ?? ""}`}>
    {options.map(o => <option key={o}>{o}</option>)}
  </select>
);

export const TableWrap = ({ headers, children }: { headers: string[]; children: React.ReactNode }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-slate-100">
          {headers.map(h => <th key={h} className="text-left py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap bg-slate-50">{h}</th>)}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-50">{children}</tbody>
    </table>
  </div>
);

export const Td = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <td className={`py-2.5 px-4 text-slate-700 ${className}`}>{children}</td>
);

export const ProgressBar = ({ pct, color = "#0C447C" }: { pct: number; color?: string }) => (
  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden w-full">
    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
  </div>
);
