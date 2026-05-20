import React from "react";

// ─── TYPES ────────────────────────────────────────────────────────────────────
export type DocTab =
  | "dashboard" | "documents" | "workflows" | "wfbuilder"
  | "approvals" | "esignatures" | "tasks" | "notifications"
  | "audit" | "permissions" | "detail";

// ─── DATA ─────────────────────────────────────────────────────────────────────
export const ACTIVITY = [
  { title: "HR Policy 2026",                       action: "uploaded by",            actor: "Ms. Fatima Qureshi",      time: "10 minutes ago",       color: "#10b981" },
  { title: "Teacher Appointment Letter",           action: "sent for e-signature to", actor: "Ustad Bilal Ahmed",       time: "45 minutes ago",       color: "#EF9F27" },
  { title: "AKU-EB Affiliation Document",          action: "approved by",            actor: "Principal Dr. Yusuf",     time: "2 hours ago",          color: "#3b82f6" },
  { title: "Child Protection Policy",             action: "flagged for annual review", actor: "due in 7 days",          time: "3 hours ago",          color: "#ef4444" },
  { title: "Grade 5 Academic Plan",               action: "workflow started by",     actor: "Ms. Amna Siddiqui",       time: "Yesterday, 4:30 PM",   color: "#10b981" },
  { title: "Student Admission File – Zaid Ibrahim",action: "uploaded to",            actor: "Fatima Campus",           time: "Yesterday, 2:15 PM",   color: "#94a3b8" },
];

export const PENDING_APPROVALS_QUEUE = [
  { initials: "FQ", bg: "#fee2e2", color: "#991b1b", doc: "HR Policy 2026 — Final Approval",    dept: "HR & Admin", urgency: "Critical", due: "Today" },
  { initials: "AM", bg: "#ede9fe", color: "#5b21b6", doc: "Grade 8 Curriculum Plan Q3",         dept: "Academic",   urgency: "High",     due: "19 May" },
  { initials: "HR", bg: "#dbeafe", color: "#1d4ed8", doc: "Staff Contract – Ustad Bilal",       dept: "HR & Admin", urgency: "Medium",   due: "21 May" },
  { initials: "ZK", bg: "#fef3c7", color: "#92400e", doc: "Building Safety Audit Report 2026",  dept: "Operations", urgency: "Critical", due: "3 days overdue" },
];

export const EXPIRY_ALERTS = [
  { title: "Child Protection Policy 2026",        days: 7,   level: "critical" },
  { title: "Building NOC — Fatima Campus",        days: 14,  level: "warning"  },
  { title: "AKU-EB Affiliation Renewal",          days: 44,  level: "notice"   },
];

export const WORKFLOW_OVERVIEW = [
  { name: "Staff Onboarding",       pct: 78, color: "#0C447C" },
  { name: "Policy Review",          pct: 45, color: "#EF9F27" },
  { name: "Affiliation Renewal",    pct: 20, color: "#ef4444" },
];

export const MONTHLY_UPLOADS = [
  { month: "Aug", val: 40 }, { month: "Sep", val: 55 }, { month: "Oct", val: 45 },
  { month: "Nov", val: 70 }, { month: "Dec", val: 65 }, { month: "Jan", val: 80 },
  { month: "Feb", val: 75 }, { month: "Mar", val: 60 }, { month: "Apr", val: 85 },
  { month: "May", val: 100 },
];

export const DOC_CATEGORIES_CHART = [
  { label: "Employee Files",  value: 362, color: "#10b981" },
  { label: "Student Files",   value: 518, color: "#0C447C" },
  { label: "Policy Docs",     value: 147, color: "#EF9F27" },
  { label: "Academic Docs",   value: 257, color: "#3b82f6" },
];

export const DOCUMENTS = [
  { icon: "PDF",  iconBg: "#fee2e2", iconColor: "#991b1b", title: "AKU-EB Affiliation Document 2025–26",        category: "Institutional",   version: "v2.1", status: "Approved",      campus: "All",           dept: "Admin",    updated: "17 May 2026",  expiry: "30 Jun 2026",  by: "Sr. Aisha Malik"     },
  { icon: "DOC",  iconBg: "#dbeafe", iconColor: "#1d4ed8", title: "HR Policy 2026 — The Deenway School",       category: "Policy",          version: "v1.3", status: "Under Review",  campus: "AAA Campus",    dept: "HR",       updated: "17 May 2026",  expiry: "—",            by: "Ms. Fatima Qureshi"  },
  { icon: "PDF",  iconBg: "#fee2e2", iconColor: "#991b1b", title: "Child Protection Policy 2026",              category: "Policy",          version: "v3.0", status: "Expiring",      campus: "All",           dept: "Academic", updated: "15 May 2026",  expiry: "24 May 2026",  by: "Ms. Amna Siddiqui"   },
  { icon: "XLS",  iconBg: "#dcfce7", iconColor: "#15803d", title: "Grade 5 Academic Plan — Q3 2026",           category: "Academic",        version: "v1.0", status: "Draft",         campus: "Fatima",        dept: "Academic", updated: "14 May 2026",  expiry: "—",            by: "Ms. Amna Siddiqui"   },
  { icon: "PDF",  iconBg: "#fee2e2", iconColor: "#991b1b", title: "Student Admission File — Zaid Ibrahim",     category: "Student Files",   version: "v1.0", status: "Complete",      campus: "Fatima",        dept: "Admin",    updated: "13 May 2026",  expiry: "—",            by: "Ms. Sara Anwar"      },
  { icon: "DOC",  iconBg: "#dbeafe", iconColor: "#1d4ed8", title: "Appointment Letter — Ustad Bilal Ahmed",    category: "Employee Files",  version: "v1.0", status: "Pending Sign",  campus: "AAA Campus",    dept: "HR",       updated: "12 May 2026",  expiry: "—",            by: "Hr. Dept."           },
  { icon: "PDF",  iconBg: "#fee2e2", iconColor: "#991b1b", title: "Building NOC — Fatima Campus",              category: "Institutional",   version: "v1.0", status: "Expiring",      campus: "Fatima",        dept: "Ops",      updated: "10 May 2026",  expiry: "31 May 2026",  by: "Mr. Zahid"           },
  { icon: "XLS",  iconBg: "#dcfce7", iconColor: "#15803d", title: "Annual Audit Report 2025",                  category: "Institutional",   version: "v2.0", status: "Approved",      campus: "All",           dept: "Finance",  updated: "2 May 2026",   expiry: "—",            by: "Finance Dept."       },
];

export const WORKFLOWS = [
  { name: "Staff Onboarding – Ustad Bilal",     type: "HR",            trigger: "New Hire",        step: "E-Signature",   assigned: "HR Manager",        due: "20 May 2026", status: "In Progress", pct: 78 },
  { name: "HR Policy 2026 Approval",            type: "Policy",        trigger: "Doc Upload",      step: "Review",        assigned: "Principal",         due: "18 May 2026", status: "Escalated",   pct: 40 },
  { name: "AKU-EB Affiliation Renewal",         type: "Institutional", trigger: "Annual Trigger",  step: "Approved",      assigned: "Sr. Admin",         due: "30 Jun 2026", status: "Completed",   pct: 100 },
  { name: "Child Protection Policy Review",     type: "Policy",        trigger: "Expiry Reminder", step: "Draft Review",  assigned: "Academic Coord.",   due: "24 May 2026", status: "Pending",     pct: 20 },
  { name: "Grade 8 Curriculum Approval",        type: "Academic",      trigger: "Manual Start",    step: "Approval",      assigned: "Principal",         due: "25 May 2026", status: "In Progress", pct: 55 },
  { name: "Building NOC Renewal",               type: "Institutional", trigger: "Expiry Alert",    step: "Document Prep", assigned: "Operations",        due: "25 May 2026", status: "At Risk",     pct: 10 },
];

export const APPROVALS = [
  { title: "HR Policy 2026 Final Approval",   doc: "HR Policy 2026.pdf",        requestor: "Ms. Fatima",  dept: "HR & Admin",  priority: "Critical", submitted: "15 May", due: "Today",          status: "Pending"   },
  { title: "Grade 8 Curriculum Approval",     doc: "G8-Curriculum-Q3.docx",    requestor: "Ms. Amna",    dept: "Academic",    priority: "High",     submitted: "16 May", due: "19 May",         status: "Pending"   },
  { title: "Staff Contract – Ustad Bilal",    doc: "Contract-Bilal.pdf",       requestor: "HR Dept.",    dept: "HR & Admin",  priority: "Medium",   submitted: "14 May", due: "21 May",         status: "Pending"   },
  { title: "Building Safety Audit Report",    doc: "Safety-Audit-2026.pdf",    requestor: "Mr. Zahid",   dept: "Operations",  priority: "Critical", submitted: "12 May", due: "3 days overdue", status: "Escalated" },
];

export const ESIGNATURE_QUEUE = [
  { doc: "Appointment Letter – Bilal Ahmed",   sender: "Ms. Fatima",   deadline: "20 May 2026", pages: 2 },
  { doc: "Staff Contract 2026 – Ustad Yusuf", sender: "HR Dept.",     deadline: "Today",       pages: 5 },
  { doc: "MOU – Fatima Campus Expansion",      sender: "Sr. Aisha",    deadline: "25 May 2026", pages: 8 },
];

export const TASKS_TODO = [
  { title: "Prepare Child Protection Policy Draft",           doc: "Child Protection Policy 2026", assigned: "MA", assignedName: "Ms. Amna",    priority: "Critical", due: "22 May 2026" },
  { title: "Collect Missing Student Documents – Grade 3",     doc: "Student Files",                assigned: "SA", assignedName: "Ms. Sara",    priority: "Medium",   due: "25 May 2026" },
  { title: "Upload Annual Audit Files 2026",                  doc: "Institutional Docs",           assigned: "ZK", assignedName: "Mr. Zahid",   priority: "Low",      due: "30 May 2026" },
  { title: "Review Staff Contracts for Renewal",              doc: "Employee Files",               assigned: "FQ", assignedName: "Ms. Fatima",  priority: "High",     due: "23 May 2026" },
];

export const TASKS_IN_PROGRESS = [
  { title: "Update HR Policy Document",                       doc: "HR Policy 2026",               assigned: "FQ", assignedName: "Ms. Fatima",  priority: "Critical", due: "18 May 2026" },
  { title: "Prepare Affiliation Renewal Package",             doc: "AKU-EB Affiliation",           assigned: "AA", assignedName: "Sr. Aisha",   priority: "High",     due: "20 May 2026" },
  { title: "Format Grade 8 Curriculum",                       doc: "G8-Curriculum-Q3",             assigned: "MA", assignedName: "Ms. Amna",    priority: "Medium",   due: "25 May 2026" },
];

export const TASKS_WAITING = [
  { title: "Sign Teacher Appointment Letter",                 doc: "Appointment Letter – Bilal",   assigned: "PY", assignedName: "Principal Yusuf", priority: "High",  due: "20 May 2026" },
  { title: "Approve Building NOC Application",                doc: "Building NOC – Fatima",        assigned: "ZK", assignedName: "Mr. Zahid",   priority: "Critical", due: "Today"       },
  { title: "Final Review of Annual Report",                   doc: "Annual Audit Report 2025",     assigned: "AA", assignedName: "Sr. Aisha",   priority: "Low",      due: "30 May 2026" },
];

export const TASKS_OVERDUE = [
  { title: "Submit SED Annual Returns",                       doc: "Regulatory Docs",              assigned: "AA", assignedName: "Sr. Aisha",   priority: "Critical", due: "10 May 2026" },
  { title: "Renew Child Protection Vetting",                  doc: "HR Records",                   assigned: "PY", assignedName: "Principal Yusuf", priority: "Critical", due: "5 May 2026"  },
];

export const NOTIFICATIONS = [
  { icon: "🔴", bg: "#fee2e2", title: "HR Policy 2026 escalated",                    body: "No approval action taken for 3 days. Escalated to Principal.",    time: "10 min ago",       type: "Approvals"   },
  { icon: "⚠️", bg: "#fef3c7", title: "Child Protection Policy expiring in 7 days",  body: "Document requires renewal before 24 May 2026.",                    time: "1 hour ago",       type: "Expiry"      },
  { icon: "✍️", bg: "#fff7ed", title: "Signature requested from you",                body: "Appointment Letter – Bilal Ahmed requires your e-signature.",       time: "2 hours ago",      type: "Signatures"  },
  { icon: "✅", bg: "#dcfce7", title: "AKU-EB Affiliation Document approved",         body: "Principal Dr. Yusuf approved the document successfully.",           time: "3 hours ago",      type: "Approvals"   },
  { icon: "📋", bg: "#dbeafe", title: "New task assigned: Upload Audit Files",        body: "Mr. Zahid has been assigned to upload Annual Audit Files 2026.",    time: "Yesterday 4:30 PM", type: "Tasks"      },
  { icon: "🔔", bg: "#f5f3ff", title: "Building NOC renewal workflow started",        body: "Automated trigger: expiry alert. Operations team notified.",         time: "Yesterday 2:00 PM", type: "Approvals"  },
];

export const AUDIT_LOGS = [
  { date: "17 May 2026 09:42 AM", user: "Sr. Aisha Malik",      action: "Uploaded",           doc: "HR Policy 2026.pdf",            detail: "v1.0 → v1.3",                 campus: "AAA Campus",    ip: "192.168.1.12",  status: "Success" },
  { date: "17 May 2026 08:15 AM", user: "Principal Yusuf",      action: "Approved",           doc: "AKU-EB Affiliation Doc",        detail: "Pending → Approved",          campus: "Fatima Campus", ip: "10.0.0.5",      status: "Success" },
  { date: "16 May 2026 04:30 PM", user: "Ms. Fatima Qureshi",   action: "Sent for Sign",      doc: "Appointment Letter – Bilal",    detail: "Sent to Sr. Aisha",           campus: "AAA Campus",    ip: "192.168.1.8",   status: "Success" },
  { date: "15 May 2026 11:20 AM", user: "Mr. Zahid",            action: "Deleted",            doc: "Draft Safety Report v1",        detail: "File removed",                campus: "AAA Campus",    ip: "192.168.1.15",  status: "Warning" },
  { date: "15 May 2026 09:05 AM", user: "Sr. Aisha Malik",      action: "Permission Changed", doc: "Role: Finance Officer",         detail: "View → View + Download",      campus: "System",        ip: "192.168.1.12",  status: "Success" },
];

export const PERMISSIONS = [
  { category: "Institutional Docs", superAdmin: [true,true,true,true,true],   campusAdmin: [true,true,false,false,true], principal: [true,false,false,false,true], hrManager: [true,false,false,false,false], acadCoord: [true,false,false,false,false], finance: [false,false,false,false,false], teacher: [false,false,false,false,false], parent: [false,false,false,false,false], student: [false,false,false,false,false] },
  { category: "Employee Files",      superAdmin: [true,true,true,true,true],   campusAdmin: [true,true,true,false,true],  principal: [true,false,false,false,true], hrManager: [true,true,true,false,true],  acadCoord: [false,false,false,false,false], finance: [true,false,false,false,false], teacher: [false,false,false,false,false], parent: [false,false,false,false,false], student: [false,false,false,false,false] },
  { category: "Student Files",       superAdmin: [true,true,true,true,true],   campusAdmin: [true,true,false,false,true], principal: [true,false,false,false,true], hrManager: [false,false,false,false,false], acadCoord: [true,true,false,false,false], finance: [false,false,false,false,false], teacher: [true,false,false,false,false], parent: [true,false,false,false,false], student: [true,false,false,false,false] },
  { category: "Policy Documents",    superAdmin: [true,true,true,true,true],   campusAdmin: [true,true,false,false,true], principal: [true,true,true,false,true],   hrManager: [true,false,false,false,false], acadCoord: [true,false,false,false,false], finance: [false,false,false,false,false], teacher: [true,false,false,false,false], parent: [false,false,false,false,false], student: [false,false,false,false,false] },
  { category: "Academic Documents",  superAdmin: [true,true,true,true,true],   campusAdmin: [true,true,true,false,true],  principal: [true,false,false,false,true], hrManager: [false,false,false,false,false], acadCoord: [true,true,true,false,true],    finance: [false,false,false,false,false], teacher: [true,false,false,false,false], parent: [true,false,false,false,false], student: [true,false,false,false,false] },
];

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

export const KPICard = ({ icon, label, value, sub, color = "navy" }: { icon: string; label: string; value: string; sub?: string; color?: string }) => {
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
