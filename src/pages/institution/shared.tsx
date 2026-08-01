import React from "react";

// ─── TYPES ─────────────────────────────────────────────────────────────────────
export type TabSection =
  | "dashboard"
  | "institutions"
  | "campuses"
  | "departments"
  | "grades"
  | "academicYears"
  | "committees"
  | "board"
  | "policies"
  | "approvals"
  | "meetings"
  | "workflows"
  | "audit";

export type BtnVariant = "primary" | "secondary" | "danger" | "ghost" | "success";

// Seed data removed — use API

// ─── UTILITIES ─────────────────────────────────────────────────────────────────
export const STATUS_COLORS: Record<string, string> = {
  Active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Inactive: "bg-slate-100 text-slate-500 border-slate-200",
  Draft: "bg-amber-50 text-amber-700 border-amber-200",
  Pending: "bg-blue-50 text-blue-700 border-blue-200",
  Approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Rejected: "bg-red-50 text-red-700 border-red-200",
  "Under Review": "bg-purple-50 text-purple-700 border-purple-200",
  Expired: "bg-red-50 text-red-600 border-red-200",
  "Expiring Soon": "bg-orange-50 text-orange-700 border-orange-200",
  Expiring: "bg-orange-50 text-orange-700 border-orange-200",
  Archived: "bg-slate-100 text-slate-500 border-slate-200",
  Upcoming: "bg-blue-50 text-blue-700 border-blue-200",
  Completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Scheduled: "bg-indigo-50 text-indigo-700 border-indigo-200",
  High: "bg-red-50 text-red-700 border-red-200",
  Medium: "bg-amber-50 text-amber-700 border-amber-200",
  Low: "bg-slate-50 text-slate-600 border-slate-200",
  Success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Info: "bg-blue-50 text-blue-700 border-blue-200",
  Warning: "bg-amber-50 text-amber-700 border-amber-200",
};

export const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// ─── UI PRIMITIVES ─────────────────────────────────────────────────────────────
export const Badge = ({ status, small }: { status: string; small?: boolean }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-medium ${STATUS_COLORS[status] ?? "bg-slate-100 text-slate-600 border-slate-200"} ${small ? "text-xs" : ""}`}>
    {status}
  </span>
);

export const AvatarBubble = ({ name, size = "sm", photoUrl }: { name: string; size?: "sm" | "lg"; photoUrl?: string }) => {
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("");
  const palette = ["bg-violet-100 text-violet-700","bg-blue-100 text-blue-700","bg-emerald-100 text-emerald-700","bg-amber-100 text-amber-700","bg-rose-100 text-rose-700","bg-indigo-100 text-indigo-700"];
  const color = palette[name.charCodeAt(0) % palette.length];
  const sz = size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";
  if (photoUrl) return <img src={photoUrl} alt={name} className={`${sz} rounded-full object-cover flex-shrink-0`} />;
  return <div className={`${sz} ${color} rounded-full flex items-center justify-center font-semibold flex-shrink-0`}>{initials}</div>;
};

export const KPICard = ({ icon, label, value, sub, trend, color = "blue" }: { icon: string; label: string; value: string; sub?: string; trend?: number; color?: string }) => {
  const colorMap: Record<string, string> = {
    blue: "from-[#0C447C] to-[#0b3d6e]",
    emerald: "from-emerald-500 to-emerald-600",
    violet: "from-violet-500 to-violet-600",
    amber: "from-[#EF9F27] to-amber-500",
    rose: "from-rose-500 to-rose-600",
    indigo: "from-indigo-500 to-indigo-600",
    teal: "from-teal-500 to-teal-600",
    slate: "from-slate-500 to-slate-600",
  };
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colorMap[color]} flex items-center justify-center text-white text-lg`}>{icon}</div>
        {trend !== undefined && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${trend > 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
            {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-slate-800 mb-0.5">{value}</div>
      <div className="text-sm font-medium text-slate-600">{label}</div>
      {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
    </div>
  );
};

export const SearchBar = ({ placeholder = "Search…", value, onChange }: { placeholder?: string; value: string; onChange: (v: string) => void }) => (
  <div className="relative">
    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
    <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0C447C] focus:border-transparent w-64" />
  </div>
);

export const TableWrapper = ({ children, headers }: { children: React.ReactNode; headers: string[] }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-slate-100">
          {headers.map((h) => (
            <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-50">{children}</tbody>
    </table>
  </div>
);

export const EmptyState = ({ icon, title, desc, action }: { icon: string; title: string; desc: string; action?: string }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="text-5xl mb-4">{icon}</div>
    <div className="text-base font-semibold text-slate-700 mb-1">{title}</div>
    <div className="text-sm text-slate-400 mb-4">{desc}</div>
    {action && <button className="px-4 py-2 bg-[#0C447C] text-white text-sm rounded-lg hover:bg-[#0b3d6e]">{action}</button>}
  </div>
);

export const PageHeader = ({ breadcrumbs, title, subtitle, actions }: { breadcrumbs: string[]; title: string; subtitle?: string; actions?: React.ReactNode }) => (
  <div className="mb-6">
    <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
      {breadcrumbs.map((b, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span>/</span>}
          <span className={i === breadcrumbs.length - 1 ? "text-slate-700 font-medium" : "hover:text-slate-600 cursor-pointer"}>{b}</span>
        </span>
      ))}
    </div>
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  </div>
);

export const Card = ({ children, className = "", onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) => (
  <div className={`bg-white rounded-xl border border-slate-100 ${className}`} onClick={onClick}>{children}</div>
);

export const Modal = ({ open, onClose, title, children, size = "md" }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; size?: "sm" | "md" | "lg" }) => {
  if (!open) return null;
  const sizes = { sm: "max-w-md", md: "max-w-2xl", lg: "max-w-4xl" };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${sizes[size]} max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600">✕</button>
        </div>
        <div className="overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
};

export const Drawer = ({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) => (
  <div className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`}>
    <div className={`absolute inset-0 bg-black/40 transition-opacity ${open ? "opacity-100" : "opacity-0"}`} onClick={onClose} />
    <div className={`absolute right-0 top-0 bottom-0 w-[480px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}>
      <div className="flex items-center justify-between p-5 border-b border-slate-100">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        <button onClick={onClose} className="w-7 h-7 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600">✕</button>
      </div>
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  </div>
);

export const FormField = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
  <div>
    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

export const FInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C] focus:border-transparent" />
);

export const FSelect = ({ options, ...props }: { options: string[] } & React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select {...props} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C] focus:border-transparent bg-white">
    {options.map((o) => <option key={o}>{o}</option>)}
  </select>
);

export const Btn = ({ variant = "primary", size = "md", children, onClick, className = "" }: { variant?: BtnVariant; size?: "sm" | "md" | "lg"; children: React.ReactNode; onClick?: () => void; className?: string }) => {
  const variants: Record<BtnVariant, string> = {
    primary: "bg-[#0C447C] text-white hover:bg-[#0b3d6e] border-[#0C447C]",
    secondary: "bg-white text-slate-700 hover:bg-slate-50 border-slate-200",
    danger: "bg-red-600 text-white hover:bg-red-700 border-red-600",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-50 border-transparent",
    success: "bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-600",
  };
  const sizes = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm", lg: "px-5 py-2.5 text-sm" };
  return (
    <button onClick={onClick} className={`${variants[variant]} ${sizes[size]} border rounded-lg font-medium transition-colors flex items-center gap-1.5 ${className}`}>
      {children}
    </button>
  );
};

export const TabBar = ({ tabs, active, onChange }: { tabs: string[]; active: string; onChange: (t: string) => void }) => (
  <div className="flex gap-1 border-b border-slate-100 mb-5">
    {tabs.map((t) => (
      <button key={t} onClick={() => onChange(t)}
        className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${active === t ? "border-[#0C447C] text-[#0C447C]" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
        {t}
      </button>
    ))}
  </div>
);
