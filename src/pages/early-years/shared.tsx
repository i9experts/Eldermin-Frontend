import React from "react";

export const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-xl border border-slate-100 shadow-sm ${className}`}>{children}</div>
);

export const CardHeader = ({ title, sub, actions }: { title: string; sub?: string; actions?: React.ReactNode }) => (
  <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
    <div>
      <h3 className="font-semibold text-slate-800 text-sm">{title}</h3>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
    {actions}
  </div>
);

export const Btn = ({
  variant = "primary", size = "md", children, onClick, disabled, className = "",
}: {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md";
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) => {
  const base = "font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const sizes = size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm";
  const variants: Record<string, string> = {
    primary: "bg-[#0C447C] text-white hover:bg-[#0b3d6e]",
    secondary: "border border-slate-200 text-slate-600 hover:bg-slate-50",
    danger: "text-red-600 hover:bg-red-50",
    ghost: "text-[#0C447C] hover:underline",
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${sizes} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

export const Modal = ({
  open, onClose, title, sub, children, maxWidth = "max-w-lg",
}: {
  open: boolean; onClose: () => void; title: string; sub?: string; children: React.ReactNode; maxWidth?: string;
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${maxWidth} max-h-[88vh] overflow-y-auto`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
          <div>
            <h2 className="font-bold text-slate-900">{title}</h2>
            {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
        </div>
        {children}
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

export const inputCls = "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C] bg-white";

export const FInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} className={`${inputCls} ${props.className || ""}`} />
);

export const FSelect = ({ options, ...props }: { options: string[] } & React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select {...props} className={`${inputCls} ${props.className || ""}`}>
    {options.map((o) => <option key={o} value={o}>{o}</option>)}
  </select>
);

export const AvatarBubble = ({ name, photoUrl, size = "md" }: { name: string; photoUrl?: string; size?: "sm" | "md" | "lg" }) => {
  const dims = size === "sm" ? "w-8 h-8 text-xs" : size === "lg" ? "w-16 h-16 text-xl" : "w-10 h-10 text-sm";
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  if (photoUrl) return <img src={photoUrl} alt={name} className={`${dims} rounded-full object-cover`} />;
  return (
    <div className={`${dims} rounded-full bg-[#0C447C] text-white flex items-center justify-center font-semibold`}>
      {initials}
    </div>
  );
};

// The progression continuum color scale - deliberately not a percentage
// gradient. These map to the DEFAULT seeded labels; a school's actual
// configured labels always win when rendering text (see resolveLevel
// usage in the pages themselves) - this is just a sensible default
// color hint, not a hardcoded label list.
export const LEVEL_COLORS: Record<string, string> = {
  "Not Observed": "#94a3b8",
  "Emerging": "#f59e0b",
  "Developing": "#3b82f6",
  "Consistent": "#8b5cf6",
  "Independent": "#10b981",
  "Mastered": "#059669",
};

export function levelColor(level: string): string {
  return LEVEL_COLORS[level] || "#64748b";
}
