import React from "react";

// ─── TYPES ─────────────────────────────────────────────────────────────────────
export type TabSection =
  | "dashboard"
  | "institutions"
  | "campuses"
  | "departments"
  | "committees"
  | "board"
  | "policies"
  | "approvals"
  | "meetings"
  | "workflows"
  | "audit";

export type BtnVariant = "primary" | "secondary" | "danger" | "ghost" | "success";

// ─── DATA ──────────────────────────────────────────────────────────────────────
export const INSTITUTIONS = [
  { id: 1, name: "Al-Noor Islamic School Network", type: "Islamic School Group", city: "Karachi", campuses: 6, head: "Dr. Yusuf Al-Rashid", status: "Active", updated: "2025-05-10" },
  { id: 2, name: "Beacon Grammar School", type: "Cambridge System", city: "Lahore", campuses: 4, head: "Mrs. Fatima Siddiqui", status: "Active", updated: "2025-05-08" },
  { id: 3, name: "Sunrise Academy International", type: "Franchise", city: "Dubai", campuses: 3, head: "Mr. Hassan Al-Farsi", status: "Active", updated: "2025-04-30" },
  { id: 4, name: "Future Scholars Institute", type: "Standard", city: "Islamabad", campuses: 2, head: "Dr. Amina Khan", status: "Pending", updated: "2025-04-20" },
  { id: 5, name: "Heritage Montessori Group", type: "Montessori", city: "Karachi", campuses: 5, head: "Ms. Zara Ahmed", status: "Active", updated: "2025-05-01" },
];

export const CAMPUSES = [
  { id: 1, name: "North Campus – Main", code: "ANN-001", type: "Main Campus", city: "Karachi", head: "Usman Tariq", enrolled: 1240, capacity: 1500, status: "Active" },
  { id: 2, name: "South Campus – DHA", code: "ANS-002", type: "Branch Campus", city: "Karachi", head: "Sana Malik", enrolled: 870, capacity: 1000, status: "Active" },
  { id: 3, name: "Gulshan Campus", code: "ANG-003", type: "Branch Campus", city: "Karachi", head: "Tariq Jameel", enrolled: 620, capacity: 800, status: "Active" },
  { id: 4, name: "Lahore Campus – Gulberg", code: "ANL-001", type: "Branch Campus", city: "Lahore", head: "Dr. Nadia Shah", enrolled: 940, capacity: 1200, status: "Active" },
  { id: 5, name: "Online Campus", code: "ANN-ONL", type: "Virtual Campus", city: "Remote", head: "Ahmad Raza", enrolled: 380, capacity: 999, status: "Active" },
];

export const COMMITTEES = [
  { id: 1, name: "Board of Directors", type: "Governance", chair: "Dr. Yusuf Al-Rashid", members: 7, meetings: 12, status: "Active" },
  { id: 2, name: "Shariah Advisory Board", type: "Religious", chair: "Mufti Abdullah Ghazi", members: 5, meetings: 8, status: "Active" },
  { id: 3, name: "Academic Committee", type: "Academic", chair: "Dr. Amina Khan", members: 9, meetings: 18, status: "Active" },
  { id: 4, name: "Finance Committee", type: "Finance", chair: "CA. Bilal Siddiqui", members: 5, meetings: 12, status: "Active" },
  { id: 5, name: "HR Committee", type: "HR", chair: "Ms. Hina Baig", members: 4, meetings: 10, status: "Active" },
  { id: 6, name: "Examination Committee", type: "Academic", chair: "Dr. Rashid Mehmood", members: 6, meetings: 15, status: "Active" },
  { id: 7, name: "Procurement Committee", type: "Finance", chair: "Mr. Saeed Khan", members: 4, meetings: 8, status: "Inactive" },
];

export const APPROVALS = [
  { id: 1, title: "Annual Budget 2025–26 Approval", type: "Budget", requestedBy: "Finance Dept.", level: "Board Review", due: "2025-05-20", status: "Pending", priority: "High" },
  { id: 2, title: "New Teacher Hiring – 12 Posts", type: "HR", requestedBy: "HR Dept.", level: "Principal Approval", due: "2025-05-18", status: "Pending", priority: "Medium" },
  { id: 3, title: "Fee Revision Policy FY2026", type: "Policy", requestedBy: "Admin Dept.", level: "Director Approval", due: "2025-05-25", status: "Under Review", priority: "High" },
  { id: 4, title: "IT Infrastructure Upgrade", type: "Procurement", requestedBy: "IT Dept.", level: "Finance Committee", due: "2025-05-30", status: "Pending", priority: "Medium" },
  { id: 5, title: "Hifz Program Expansion – New Batch", type: "Academic", requestedBy: "Hifz Dept.", level: "Academic Committee", due: "2025-06-01", status: "Approved", priority: "Low" },
];

export const MEETINGS = [
  { id: 1, title: "Q2 Board Meeting", committee: "Board of Directors", date: "2025-05-20", time: "10:00 AM", venue: "Boardroom A", status: "Upcoming" },
  { id: 2, title: "Shariah Advisory Session", committee: "Shariah Advisory Board", date: "2025-05-22", time: "2:00 PM", venue: "Conference Hall", status: "Upcoming" },
  { id: 3, title: "Academic Year Planning", committee: "Academic Committee", date: "2025-05-28", time: "9:00 AM", venue: "Seminar Room 1", status: "Upcoming" },
  { id: 4, title: "Q1 Finance Review", committee: "Finance Committee", date: "2025-05-10", time: "11:00 AM", venue: "Finance Office", status: "Completed" },
  { id: 5, title: "Annual HR Policy Meeting", committee: "HR Committee", date: "2025-06-05", time: "3:00 PM", venue: "HR Conference Room", status: "Scheduled" },
];

export const POLICIES = [
  { id: 1, title: "Student Discipline & Conduct Policy", category: "Student Affairs", version: "v3.1", effective: "2025-01-01", review: "2025-12-31", approvedBy: "Board of Directors", status: "Active" },
  { id: 2, title: "Staff Recruitment & Hiring Policy", category: "HR", version: "v2.4", effective: "2024-07-01", review: "2025-06-30", approvedBy: "HR Committee", status: "Active" },
  { id: 3, title: "Fee Collection & Refund Policy", category: "Finance", version: "v5.0", effective: "2025-01-01", review: "2025-12-31", approvedBy: "Finance Committee", status: "Active" },
  { id: 4, title: "Hifz Program Academic Standards", category: "Academic – Islamic", version: "v1.2", effective: "2024-09-01", review: "2025-08-31", approvedBy: "Shariah Advisory Board", status: "Under Review" },
  { id: 5, title: "IT & Data Security Policy", category: "IT", version: "v2.0", effective: "2024-11-01", review: "2025-10-31", approvedBy: "Board of Directors", status: "Active" },
  { id: 6, title: "Anti-Harassment & Safe School Policy", category: "Student Affairs", version: "v1.5", effective: "2024-08-01", review: "2025-07-31", approvedBy: "Board of Directors", status: "Expiring Soon" },
];

export const DEPARTMENTS = [
  { id: 1, name: "Academic – Pre-Primary", code: "AC-PP", head: "Ms. Aisha Noor", campus: "North Campus", status: "Active" },
  { id: 2, name: "Academic – Primary", code: "AC-PR", head: "Ms. Saira Iqbal", campus: "North Campus", status: "Active" },
  { id: 3, name: "Academic – Secondary", code: "AC-SE", head: "Dr. Imran Hussain", campus: "North Campus", status: "Active" },
  { id: 4, name: "Hifz & Quran Department", code: "HF-01", head: "Hafiz Muhammd Bilal", campus: "All Campuses", status: "Active" },
  { id: 5, name: "Tarbiyah & Islamic Studies", code: "TB-01", head: "Maulana Tariq Jameel", campus: "All Campuses", status: "Active" },
  { id: 6, name: "Finance & Accounts", code: "FN-01", head: "CA. Bilal Siddiqui", campus: "Main", status: "Active" },
  { id: 7, name: "Human Resources", code: "HR-01", head: "Ms. Hina Baig", campus: "Main", status: "Active" },
  { id: 8, name: "IT & Digital Services", code: "IT-01", head: "Eng. Umar Farooq", campus: "Main", status: "Active" },
  { id: 9, name: "Transport & Logistics", code: "TR-01", head: "Mr. Khalid Pervez", campus: "All Campuses", status: "Active" },
  { id: 10, name: "Examinations", code: "EX-01", head: "Dr. Rashid Mehmood", campus: "All Campuses", status: "Active" },
];

export const BOARD_MEMBERS = [
  { id: 1, name: "Dr. Yusuf Al-Rashid", designation: "Chairman", role: "Chairperson", email: "y.rashid@alnoor.edu.pk", joining: "2020-01-01", termEnd: "2026-12-31", voting: true, status: "Active" },
  { id: 2, name: "Mrs. Fatima Siddiqui", designation: "Vice Chairperson", role: "Board Member", email: "f.siddiqui@alnoor.edu.pk", joining: "2021-03-01", termEnd: "2025-06-30", voting: true, status: "Active" },
  { id: 3, name: "CA. Bilal Siddiqui", designation: "CFO & Director Finance", role: "Board Member", email: "b.siddiqui@alnoor.edu.pk", joining: "2020-01-01", termEnd: "2026-12-31", voting: true, status: "Active" },
  { id: 4, name: "Mufti Abdullah Ghazi", designation: "Shariah Advisor", role: "Advisory Member", email: "m.ghazi@alnoor.edu.pk", joining: "2020-06-01", termEnd: "2025-05-31", voting: false, status: "Expiring" },
  { id: 5, name: "Dr. Amina Khan", designation: "Director Academic", role: "Board Member", email: "a.khan@alnoor.edu.pk", joining: "2022-01-01", termEnd: "2027-12-31", voting: true, status: "Active" },
];

export const AUDIT_LOGS = [
  { id: 1, time: "2025-05-15 09:34", user: "Dr. Yusuf Al-Rashid", action: "Approved", module: "Policy", record: "Fee Collection Policy v5.0", ip: "192.168.1.10", status: "Success" },
  { id: 2, time: "2025-05-15 08:22", user: "Ms. Hina Baig", action: "Created", module: "Committee", record: "HR Committee Meeting #28", ip: "192.168.1.24", status: "Success" },
  { id: 3, time: "2025-05-14 16:45", user: "CA. Bilal Siddiqui", action: "Updated", module: "Budget", record: "Annual Budget 2025-26 Draft", ip: "192.168.1.15", status: "Success" },
  { id: 4, time: "2025-05-14 14:10", user: "Admin System", action: "Alert Sent", module: "Governance", record: "Mufti Abdullah – Term Expiry Warning", ip: "System", status: "Info" },
  { id: 5, time: "2025-05-13 11:20", user: "Dr. Amina Khan", action: "Rejected", module: "Approval", record: "Hifz Expansion Budget Request #14", ip: "192.168.1.42", status: "Warning" },
];

export const WORKFLOWS = [
  { id: 1, name: "Fee Discount Approval", module: "Finance", trigger: "Discount Request", levels: 3, sla: "48 hrs", status: "Active" },
  { id: 2, name: "Staff Hiring Authorization", module: "HR", trigger: "Job Requisition", levels: 4, sla: "72 hrs", status: "Active" },
  { id: 3, name: "Policy Publishing Workflow", module: "Governance", trigger: "Policy Draft Upload", levels: 5, sla: "7 days", status: "Active" },
  { id: 4, name: "Procurement Approval", module: "Finance", trigger: "Purchase Request", levels: 3, sla: "48 hrs", status: "Active" },
  { id: 5, name: "Academic Program Launch", module: "Academic", trigger: "Program Proposal", levels: 4, sla: "14 days", status: "Draft" },
];

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

export const AvatarBubble = ({ name, size = "sm" }: { name: string; size?: "sm" | "lg" }) => {
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("");
  const palette = ["bg-violet-100 text-violet-700","bg-blue-100 text-blue-700","bg-emerald-100 text-emerald-700","bg-amber-100 text-amber-700","bg-rose-100 text-rose-700","bg-indigo-100 text-indigo-700"];
  const color = palette[name.charCodeAt(0) % palette.length];
  const sz = size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";
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
