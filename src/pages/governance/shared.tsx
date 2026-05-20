import React from "react";

// ─── TYPES ────────────────────────────────────────────────────────────────────
export type GovTab =
  | "dashboard" | "rbac" | "audit" | "privacy"
  | "safeguarding" | "attendance" | "accreditation"
  | "governance" | "documents" | "policies" | "settings";

// ─── DATA ─────────────────────────────────────────────────────────────────────
export const CAMPUSES = [
  { id: "main",  name: "Al-Noor Main Campus",  head: "Dr. Yusuf Al-Amin",      score: 91, issues: 2,  att: 94.2, lastReview: "10 May 2026", risk: "Low",    status: "Compliant" },
  { id: "boys",  name: "Al-Noor Boys Campus",  head: "Ustadh Ibrahim Malik",   score: 84, issues: 5,  att: 91.8, lastReview: "8 May 2026",  risk: "Medium", status: "Attention" },
  { id: "girls", name: "Al-Noor Girls Campus", head: "Ustadha Zainab Haris",  score: 79, issues: 7,  att: 88.6, lastReview: "5 May 2026",  risk: "Medium", status: "Attention" },
  { id: "river", name: "Riverside Branch",     head: "Br. Khalid Siddiqui",   score: 62, issues: 11, att: 81.3, lastReview: "28 Apr 2026", risk: "High",   status: "Critical"  },
];

export const BREAKDOWN = [
  { label: "Data Privacy & GDPR",      pct: 94, color: "#16a34a" },
  { label: "Attendance Compliance",    pct: 92, color: "#16a34a" },
  { label: "Policy Acknowledgements",  pct: 83, color: "#EF9F27" },
  { label: "Child Safeguarding",       pct: 78, color: "#EF9F27" },
  { label: "Accreditation Readiness",  pct: 74, color: "#7c3aed" },
  { label: "Staff DBS & HR Clearances",pct: 72, color: "#dc2626" },
];

export const ACTIVITY_FEED = [
  { icon: "🚨", bg: "#fee2e2", text: "Safeguarding incident reported — Case #CS-2026-043",             meta: "Today, 09:12 · Fatima Al-Razi · Main Campus",    badge: "Critical" },
  { icon: "⚠️", bg: "#fef3c7", text: "Policy \"Staff Code of Conduct 2026\" sent for acknowledgement", meta: "Today, 08:45 · HR System · All Campuses",         badge: "Medium"   },
  { icon: "✅", bg: "#dcfce7", text: "Accreditation evidence uploaded — Section 4.2 Welfare Strategy", meta: "Yesterday, 16:30 · Ibrahim Qureshi · Boys Campus", badge: "Low"      },
  { icon: "📤", bg: "#dbeafe", text: "Data export approved — Parent contact data batch",               meta: "Yesterday, 14:15 · Amina Khalid · Data Controller", badge: "Medium"  },
  { icon: "🔴", bg: "#fee2e2", text: "5× Failed login attempts — IP 192.168.2.41 blocked",            meta: "13 May, 22:07 · Unknown · Girls Campus",           badge: "Critical" },
  { icon: "✅", bg: "#dcfce7", text: "Annual safeguarding training completed — 12 staff certified",    meta: "12 May, 11:00 · Training System · Main Campus",    badge: "Info"     },
];

export const AUDIT_LOGS = [
  { dt: "14 May 2026 09:41", user: "Amina Khalid",     role: "Compliance Officer", campus: "Main Campus",  action: "Exported student data batch (312 records)",  module: "Data Privacy",    ip: "192.168.1.14", device: "Chrome/Win",  risk: "Medium",   status: "Success" },
  { dt: "14 May 2026 09:12", user: "Fatima Al-Razi",  role: "Teacher",             campus: "Main Campus",  action: "Submitted safeguarding report #CS-2026-043", module: "Safeguarding",    ip: "192.168.1.22", device: "Safari/iOS",  risk: "Critical", status: "Success" },
  { dt: "13 May 2026 22:07", user: "Unknown",          role: "—",                   campus: "Girls Campus", action: "5× Failed login attempts",                   module: "Authentication",  ip: "192.168.2.41", device: "Chrome/Win",  risk: "Critical", status: "Blocked" },
  { dt: "13 May 2026 16:30", user: "Ibrahim Qureshi",  role: "Teacher",             campus: "Boys Campus",  action: "Uploaded accreditation evidence doc (4.2)",   module: "Accreditation",   ip: "10.0.0.5",    device: "Firefox/Mac", risk: "Low",      status: "Success" },
  { dt: "13 May 2026 11:45", user: "Dr. Yusuf Al-Amin",role: "Principal",          campus: "Main Campus",  action: "Approved staff role change — HR Officer",    module: "RBAC",            ip: "192.168.1.2",  device: "Chrome/Win",  risk: "High",     status: "Success" },
  { dt: "12 May 2026 09:00", user: "Ext. Auditor",     role: "Auditor",             campus: "All Campuses", action: "External audit session initiated",            module: "Audit",           ip: "203.0.113.50", device: "Chrome/Win",  risk: "Info",     status: "Success" },
  { dt: "11 May 2026 14:22", user: "Amina Khalid",     role: "Compliance Officer", campus: "All Campuses", action: "Bulk-deleted 5 expired draft records",        module: "Documents",       ip: "192.168.1.14", device: "Chrome/Win",  risk: "High",     status: "Success" },
  { dt: "10 May 2026 09:18", user: "HR System",        role: "System",              campus: "All Campuses", action: "Auto-sent DBS renewal reminders — 5 staff",  module: "HR",              ip: "Internal",     device: "Server",      risk: "Low",      status: "Success" },
];

export const USERS = [
  { initials: "YA", bg: "#dbeafe", color: "#1d4ed8", name: "Dr. Yusuf Al-Amin",    email: "yusuf@alnoor.edu",    role: "Principal",          campus: "Main Campus",  login: "Today, 07:30", status: "Active"   },
  { initials: "AK", bg: "#dcfce7", color: "#15803d", name: "Amina Khalid",          email: "amina@alnoor.edu",    role: "Compliance Officer", campus: "All Campuses", login: "Today, 09:41", status: "Active"   },
  { initials: "IQ", bg: "#fef3c7", color: "#92400e", name: "Ibrahim Qureshi",       email: "ibrahim@alnoor.edu",  role: "Teacher",            campus: "Boys Campus",  login: "Yesterday",    status: "Active"   },
  { initials: "ZH", bg: "#ede9fe", color: "#5b21b6", name: "Ustadha Zainab Haris", email: "zainab@alnoor.edu",   role: "Principal",          campus: "Girls Campus", login: "Today, 08:10", status: "Active"   },
  { initials: "FS", bg: "#fee2e2", color: "#991b1b", name: "Fatima Siddiqui",      email: "fatima.s@alnoor.edu", role: "HR Officer",         campus: "Main Campus",  login: "13 May 2026",  status: "Inactive" },
];

export const ROLES = [
  { name: "Super Admin",        view: true,  create: true,  edit: true,  del: true,  approve: true,  export: true,  assign: true,  lock: true,  users: 2   },
  { name: "Owner",              view: true,  create: true,  edit: true,  del: true,  approve: true,  export: true,  assign: true,  lock: false, users: 1   },
  { name: "Principal",          view: true,  create: true,  edit: true,  del: false, approve: true,  export: true,  assign: false, lock: false, users: 4   },
  { name: "Campus Head",        view: true,  create: true,  edit: true,  del: false, approve: true,  export: true,  assign: false, lock: false, users: 4   },
  { name: "Compliance Officer", view: true,  create: true,  edit: true,  del: false, approve: true,  export: true,  assign: true,  lock: false, users: 3   },
  { name: "HR Officer",         view: true,  create: true,  edit: true,  del: false, approve: false, export: true,  assign: false, lock: false, users: 8   },
  { name: "Accountant",         view: true,  create: true,  edit: false, del: false, approve: false, export: true,  assign: false, lock: false, users: 6   },
  { name: "Teacher",            view: true,  create: true,  edit: false, del: false, approve: false, export: false, assign: false, lock: false, users: 68  },
  { name: "Auditor",            view: true,  create: false, edit: false, del: false, approve: false, export: true,  assign: false, lock: false, users: 5   },
  { name: "Parent",             view: true,  create: false, edit: false, del: false, approve: false, export: false, assign: false, lock: false, users: 320 },
  { name: "Viewer",             view: true,  create: false, edit: false, del: false, approve: false, export: false, assign: false, lock: false, users: 12  },
];

export const PRIVACY_CATEGORIES = [
  { icon: "👤", bg: "#dbeafe", name: "Student Personal Data",   desc: "Name, DOB, nationality, photo, emergency contacts", sensitivity: "Standard",        enabled: true  },
  { icon: "👨‍👩‍👧", bg: "#fef3c7", name: "Parent Contact Data",     desc: "Phone, email, home address, preferred contact",     sensitivity: "Standard",        enabled: true  },
  { icon: "🏥", bg: "#fee2e2", name: "Medical Information",      desc: "Conditions, medications, allergies, SEND records",  sensitivity: "Special Category", enabled: true  },
  { icon: "📅", bg: "#f0fdf4", name: "Attendance Records",       desc: "Daily attendance, absence reasons, late arrivals",  sensitivity: "Standard",        enabled: true  },
  { icon: "📊", bg: "#ede9fe", name: "Academic Records",         desc: "Grades, assessments, reports, target grades",       sensitivity: "Standard",        enabled: true  },
  { icon: "💰", bg: "#fef3c7", name: "Financial Records",        desc: "Fee payments, invoices, bursary information",       sensitivity: "Restricted",       enabled: true  },
  { icon: "👔", bg: "#f3f4f6", name: "Staff Records",            desc: "Contracts, HR data, DBS, payroll, performance",    sensitivity: "Restricted",       enabled: true  },
];

export const SAFEGUARDING_CASES = [
  { id: "CS-2026-041", campus: "Main Campus",  reporter: "Ustadha Maryam", severity: "critical", status: "Escalated",    year: "Year 7", category: "Welfare / Behaviour",   desc: "Repeated unexplained absences and significant behavioural changes observed over 3 weeks. Parent contact unsuccessful.", days: 8 },
  { id: "CS-2026-042", campus: "Girls Campus", reporter: "Ustadha Zainab", severity: "high",     status: "Under Review", year: "Year 9", category: "Domestic Situation",    desc: "Student disclosed difficult home circumstances affecting wellbeing and concentration. Referred to DDSL.", days: 3 },
  { id: "CS-2026-043", campus: "Main Campus",  reporter: "Fatima Al-Razi", severity: "new",      status: "Reported",     year: "Year 8", category: "New — Awaiting Triage", desc: "New incident reported today. Awaiting initial DSL assessment and triage meeting.", days: 0 },
];

export const SAFEGUARDING_TRAINING = [
  { name: "Dr. Yusuf Al-Amin",   role: "DSL",         campus: "Main Campus",  last: "Jan 2026", next: "Jan 2027", dbs: "Current",   training: "Current"   },
  { name: "Ustadha Zainab",      role: "DDSL",        campus: "Girls Campus", last: "Mar 2026", next: "Mar 2027", dbs: "Current",   training: "Current"   },
  { name: "Amina Khalid",        role: "Compliance",  campus: "All",          last: "Feb 2026", next: "Feb 2027", dbs: "Current",   training: "Current"   },
  { name: "Ibrahim Qureshi",     role: "Teacher",     campus: "Boys Campus",  last: "Sep 2024", next: "Sep 2025", dbs: "Current",   training: "Overdue"   },
  { name: "Fatima Al-Razi",      role: "Teacher",     campus: "Main Campus",  last: "Oct 2025", next: "Oct 2026", dbs: "Current",   training: "Due Soon"  },
  { name: "Br. Khalid Siddiqui", role: "Campus Head", campus: "Riverside",    last: "Aug 2024", next: "Aug 2025", dbs: "Missing",   training: "Overdue"   },
  { name: "Ahmad Nasr",          role: "Teacher",     campus: "Boys Campus",  last: "Nov 2025", next: "Nov 2026", dbs: "Current",   training: "Current"   },
];

export const ATTENDANCE_RISK = [
  { name: "Ahmad Bilal",    year: "Year 9",  campus: "Main",      pct: 73, days: 23, last: "Today",        status: "Persistent Absence" },
  { name: "Maryam Saeed",  year: "Year 7",  campus: "Girls",     pct: 78, days: 19, last: "13 May 2026",  status: "Critical"            },
  { name: "Hamza Rauf",    year: "Year 10", campus: "Boys",      pct: 81, days: 16, last: "12 May 2026",  status: "Critical"            },
  { name: "Ayesha Dar",    year: "Year 8",  campus: "Girls",     pct: 86, days: 12, last: "10 May 2026",  status: "At Risk"             },
  { name: "Usman Khan",    year: "Year 11", campus: "Boys",      pct: 87, days: 11, last: "9 May 2026",   status: "At Risk"             },
  { name: "Sara Qadri",    year: "Year 9",  campus: "Riverside", pct: 83, days: 14, last: "13 May 2026",  status: "Critical"            },
  { name: "Bilal Rashid",  year: "Year 7",  campus: "Riverside", pct: 79, days: 18, last: "14 May 2026",  status: "Persistent Absence" },
];

export const ACCREDITATION = [
  { ref: "1.1", section: "Leadership",  req: "Governance structure documented and published",          evidence: 3, status: "Approved",       note: "All documents current and satisfactory" },
  { ref: "1.2", section: "Leadership",  req: "Strategic Development Plan 2024–2027 in place",          evidence: 1, status: "Approved",       note: "Approved by Governors — March 2026" },
  { ref: "1.3", section: "Leadership",  req: "Governor minutes and meeting records",                    evidence: 6, status: "Approved",       note: "Fully documented" },
  { ref: "2.1", section: "Safeguarding",req: "Safeguarding policy current and KCSIE-compliant",         evidence: 1, status: "Needs Revision", note: "Must be updated for Sep 2026 KCSIE revision" },
  { ref: "2.2", section: "Safeguarding",req: "DSL and DDSL training certificates",                      evidence: 4, status: "Approved",       note: "All staff certificates current" },
  { ref: "2.3", section: "Safeguarding",req: "Staff safeguarding training register (all staff)",        evidence: 1, status: "In Progress",    note: "9 staff training records outstanding" },
  { ref: "3.1", section: "Quality",     req: "Curriculum planning and schemes of work",                 evidence: 0, status: "Not Started",    note: "⚠ Required for submission — urgent" },
  { ref: "3.2", section: "Quality",     req: "Assessment, feedback and marking policy",                 evidence: 2, status: "In Progress",    note: "Awaiting final ratification by Principal" },
  { ref: "4.1", section: "Welfare",     req: "SEND policy and provision map",                           evidence: 2, status: "Approved",       note: "Good practice model noted by reviewer" },
  { ref: "4.2", section: "Welfare",     req: "Mental health and wellbeing strategy",                    evidence: 1, status: "In Progress",    note: "Draft submitted — pending final review" },
  { ref: "5.1", section: "Finance",     req: "Audited financial statements 2024/25",                    evidence: 0, status: "Not Started",    note: "⚠ Required — contact finance director" },
  { ref: "5.2", section: "Finance",     req: "Annual budget and financial reserves policy",             evidence: 1, status: "Approved",       note: "Approved by Governors" },
];

export const HEATMAP_DATA = [
  { area: "Safeguarding",  main: "good",   boys: "review",  girls: "good",   river: "poor"     },
  { area: "Attendance",    main: "good",   boys: "good",    girls: "review", river: "critical"  },
  { area: "Data Privacy",  main: "good",   boys: "good",    girls: "review", river: "poor"      },
  { area: "HR Compliance", main: "good",   boys: "review",  girls: "review", river: "critical"  },
  { area: "Finance",       main: "good",   boys: "good",    girls: "good",   river: "poor"      },
  { area: "IT Security",   main: "good",   boys: "review",  girls: "poor",   river: "poor"      },
  { area: "Accreditation", main: "review", boys: "review",  girls: "review", river: "critical"  },
];

export const DOCUMENTS = [
  { icon: "PDF", iconCls: "pdf",   name: "Safeguarding Policy 2026 v3.1",        cat: "Policy",        by: "Amina Khalid",       ver: "3.1", campus: "All",   status: "Needs Revision", date: "2 Jan 2026"  },
  { icon: "DOC", iconCls: "doc",   name: "Staff Code of Conduct 2026",           cat: "Compliance",    by: "Dr. Yusuf Al-Amin",  ver: "2.0", campus: "All",   status: "Approved",       date: "1 Mar 2026"  },
  { icon: "XLS", iconCls: "xls",   name: "DBS Clearance Register 2026",          cat: "Staff",         by: "HR System",          ver: "1.8", campus: "All",   status: "Approved",       date: "14 May 2026" },
  { icon: "PDF", iconCls: "pdf",   name: "OFSTED Self-Evaluation Form 2026",     cat: "Accreditation", by: "Amina Khalid",       ver: "1.3", campus: "All",   status: "In Progress",    date: "10 May 2026" },
  { icon: "PDF", iconCls: "pdf",   name: "External Audit Report — May 2026",     cat: "Audit",         by: "External Auditor",   ver: "1.0", campus: "All",   status: "Pending Review", date: "12 May 2026" },
  { icon: "PPT", iconCls: "ppt",   name: "Governor Safeguarding Training Slides",cat: "Training",      by: "Training Dept.",     ver: "2.2", campus: "Main",  status: "Approved",       date: "15 Jan 2026" },
  { icon: "DOC", iconCls: "doc",   name: "Data Protection Policy 2026",          cat: "Compliance",    by: "Amina Khalid",       ver: "3.0", campus: "All",   status: "Approved",       date: "1 Feb 2026"  },
  { icon: "XLS", iconCls: "xls",   name: "Attendance Register — May 2026",       cat: "Compliance",    by: "Attendance System",  ver: "1.0", campus: "All",   status: "Approved",       date: "14 May 2026" },
];

export const POLICIES = [
  { icon: "📋", title: "Staff Code of Conduct 2026",             deadline: "20 May 2026", scope: "All Staff",  acknowledged: 53, total: 72, status: "Pending",  overdue: false },
  { icon: "🔒", title: "Data Protection Policy 2026",            deadline: "15 May 2026", scope: "All Staff",  acknowledged: 67, total: 72, status: "Urgent",   overdue: false },
  { icon: "🚨", title: "Safeguarding & Child Protection Policy",  deadline: "1 May 2026",  scope: "All Staff",  acknowledged: 44, total: 72, status: "Overdue",  overdue: true  },
  { icon: "📱", title: "Mobile Device & IT Acceptable Use",      deadline: "30 Apr 2026", scope: "IT Staff",   acknowledged: 12, total: 12, status: "Complete", overdue: false },
  { icon: "🏥", title: "Health & Safety Policy 2026",            deadline: "30 May 2026", scope: "All Staff",  acknowledged: 18, total: 72, status: "Assigned", overdue: false },
];

export const POLICY_ACKS = [
  { name: "Fatima Al-Razi",      role: "Teacher",     policy: "Safeguarding",    assigned: "1 May 2026", status: "Overdue"      },
  { name: "Ahmad Nasr",          role: "Teacher",     policy: "Code of Conduct", assigned: "5 May 2026", status: "Viewed"       },
  { name: "Ustadha Maryam",      role: "Teacher",     policy: "Safeguarding",    assigned: "1 May 2026", status: "Acknowledged" },
  { name: "Br. Khalid Siddiqui", role: "Campus Head", policy: "Data Protection", assigned: "1 May 2026", status: "Overdue"      },
  { name: "Ibrahim Qureshi",     role: "Teacher",     policy: "Code of Conduct", assigned: "5 May 2026", status: "Assigned"     },
  { name: "Zainab Haris",        role: "Principal",   policy: "Safeguarding",    assigned: "1 May 2026", status: "Acknowledged" },
  { name: "Amina Khalid",        role: "Compliance",  policy: "All Policies",    assigned: "1 May 2026", status: "Acknowledged" },
];

export const PRIVACY_REQUESTS = [
  { subject: "Parent: Br. Tariq Ali",   type: "Export",  date: "12 May 2026", status: "Pending"  },
  { subject: "Student: Zara Hussain",   type: "Delete",  date: "10 May 2026", status: "Review"   },
  { subject: "Staff: Mrs. Rehana Khan", type: "Export",  date: "8 May 2026",  status: "Approved" },
];

export const CONSENT_DATA = [
  { group: "Students (all)",      type: "Educational Use of Data",    given: 486, pending: 12,  withdrawn: 2,  reviewed: "Jan 2026", status: "Compliant" },
  { group: "Parents / Guardians", type: "Contact & Communication",   given: 432, pending: 28,  withdrawn: 5,  reviewed: "Jan 2026", status: "Attention" },
  { group: "Staff",               type: "Employment Data Processing", given: 68,  pending: 0,   withdrawn: 0,  reviewed: "Mar 2026", status: "Compliant" },
  { group: "Parents",             type: "Photo & Media Consent",      given: 310, pending: 84,  withdrawn: 22, reviewed: "Sep 2025", status: "Attention" },
  { group: "Students (16+)",      type: "Self-Consent for Records",   given: 142, pending: 8,   withdrawn: 1,  reviewed: "Jan 2026", status: "Compliant" },
];

export const RETENTION_SETTINGS = [
  { label: "Student Educational Records", value: "7 Years" },
  { label: "Financial & Fee Records",     value: "7 Years" },
  { label: "Audit Log Files",             value: "3 Years" },
  { label: "CCTV / Surveillance",         value: "30 Days" },
  { label: "Staff HR Records",            value: "7 Years" },
  { label: "Attendance Records",          value: "5 Years" },
  { label: "Parent Communication Logs",   value: "3 Years" },
];

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────
const STATUS_MAP: Record<string, string> = {
  Active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Inactive: "bg-slate-100 text-slate-500 border-slate-200",
  Compliant: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Attention: "bg-amber-50 text-amber-700 border-amber-200",
  Critical: "bg-red-50 text-red-700 border-red-200",
  Approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Pending: "bg-blue-50 text-blue-700 border-blue-200",
  "Pending Review": "bg-blue-50 text-blue-700 border-blue-200",
  "Under Review": "bg-purple-50 text-purple-700 border-purple-200",
  "In Progress": "bg-blue-50 text-blue-700 border-blue-200",
  "Not Started": "bg-slate-100 text-slate-500 border-slate-200",
  "Needs Revision": "bg-amber-50 text-amber-700 border-amber-200",
  Complete: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Assigned: "bg-indigo-50 text-indigo-700 border-indigo-200",
  Viewed: "bg-amber-50 text-amber-700 border-amber-200",
  Acknowledged: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Overdue: "bg-red-50 text-red-700 border-red-200",
  Urgent: "bg-red-50 text-red-700 border-red-200",
  Escalated: "bg-red-50 text-red-700 border-red-200",
  Reported: "bg-blue-50 text-blue-700 border-blue-200",
  Current: "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Due Soon": "bg-amber-50 text-amber-700 border-amber-200",
  Missing: "bg-red-50 text-red-700 border-red-200",
  Review: "bg-amber-50 text-amber-700 border-amber-200",
  Success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Blocked: "bg-red-50 text-red-700 border-red-200",
  "Persistent Absence": "bg-slate-800 text-slate-100 border-slate-700",
  "At Risk": "bg-amber-50 text-amber-700 border-amber-200",
  Critical_attendance: "bg-red-50 text-red-700 border-red-200",
  Low: "bg-slate-50 text-slate-600 border-slate-200",
  Medium: "bg-amber-50 text-amber-700 border-amber-200",
  High: "bg-red-50 text-red-700 border-red-200",
  Info: "bg-blue-50 text-blue-700 border-blue-200",
};

export const Badge = ({ status, small }: { status: string; small?: boolean }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-full border font-medium ${small ? "text-xs" : "text-xs"} ${STATUS_MAP[status] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}>
    {status}
  </span>
);

export const RiskBadge = ({ risk }: { risk: string }) => {
  const cls: Record<string, string> = {
    Low: "bg-slate-100 text-slate-600",
    Medium: "bg-amber-50 text-amber-700",
    High: "bg-red-50 text-red-700",
    Critical: "bg-red-900 text-red-100",
    Info: "bg-blue-50 text-blue-700",
  };
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${cls[risk] ?? "bg-slate-100 text-slate-600"}`}>{risk}</span>;
};

// ─── UI PRIMITIVES ────────────────────────────────────────────────────────────
export const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-xl border border-slate-100 shadow-sm ${className}`}>{children}</div>
);

export const CardHeader = ({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) => (
  <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
    <div>
      <div className="font-semibold text-slate-800 text-sm">{title}</div>
      {subtitle && <div className="text-xs text-slate-500 mt-0.5">{subtitle}</div>}
    </div>
    {actions && <div className="flex items-center gap-2">{actions}</div>}
  </div>
);

export const KPICard = ({
  label, value, sub, color = "navy", icon,
}: { label: string; value: string; sub?: string; color?: string; icon?: string }) => {
  const bar: Record<string, string> = {
    navy: "bg-[#0C447C]", amber: "bg-[#EF9F27]", red: "bg-red-500",
    green: "bg-emerald-500", blue: "bg-blue-500", purple: "bg-purple-500", teal: "bg-teal-500",
  };
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
      <div className={`h-1 ${bar[color] ?? "bg-slate-200"}`} />
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
}: { variant?: "primary" | "secondary" | "danger" | "success" | "amber"; size?: "sm" | "md" | "xs"; children: React.ReactNode; onClick?: () => void; className?: string }) => {
  const v = {
    primary:   "bg-[#0C447C] text-white hover:bg-[#0b3d6e] border-[#0C447C]",
    secondary: "bg-white text-slate-700 hover:bg-slate-50 border-slate-200",
    danger:    "bg-red-600 text-white hover:bg-red-700 border-red-600",
    success:   "bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-600",
    amber:     "bg-[#EF9F27] text-white hover:bg-amber-500 border-[#EF9F27]",
  };
  const s = { xs: "px-2 py-1 text-xs", sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm" };
  return (
    <button onClick={onClick} className={`${v[variant]} ${s[size]} border rounded-lg font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${className}`}>
      {children}
    </button>
  );
};

export const FInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} className={`w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C] focus:border-transparent ${props.className ?? ""}`} />
);

export const FSelect = ({ options, ...props }: { options: string[] } & React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select {...props} className={`w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C] focus:border-transparent bg-white ${props.className ?? ""}`}>
    {options.map((o) => <option key={o}>{o}</option>)}
  </select>
);

export const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
  <button
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${checked ? "bg-emerald-500" : "bg-slate-200"}`}
  >
    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
  </button>
);

export const Modal = ({
  open, onClose, title, children, size = "md",
}: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; size?: "sm" | "md" | "lg" }) => {
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

export const TableWrap = ({ headers, children }: { headers: string[]; children: React.ReactNode }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-slate-100">
          {headers.map((h) => (
            <th key={h} className="text-left py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap bg-slate-50">{h}</th>
          ))}
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

export const Alert = ({
  type = "danger", children,
}: { type?: "danger" | "warning" | "info" | "success"; children: React.ReactNode }) => {
  const styles = {
    danger:  "bg-red-50 border-red-200 text-red-800",
    warning: "bg-amber-50 border-amber-200 text-amber-800",
    info:    "bg-blue-50 border-blue-200 text-blue-800",
    success: "bg-emerald-50 border-emerald-200 text-emerald-800",
  };
  const icons = { danger: "🚨", warning: "⚠️", info: "ℹ️", success: "✅" };
  return (
    <div className={`flex gap-3 p-3 rounded-lg border mb-4 text-sm ${styles[type]}`}>
      <span className="text-base">{icons[type]}</span>
      <div>{children}</div>
    </div>
  );
};

export const HeatCell = ({ level }: { level: string }) => {
  const cls: Record<string, string> = {
    good:     "bg-emerald-100 text-emerald-800",
    review:   "bg-amber-100 text-amber-800",
    poor:     "bg-red-100 text-red-800",
    critical: "bg-red-900 text-red-100",
  };
  const labels: Record<string, string> = { good: "Good", review: "Review", poor: "Poor", critical: "Critical" };
  return (
    <span className={`inline-block px-2 py-1 rounded text-xs font-semibold whitespace-nowrap ${cls[level] ?? "bg-slate-100 text-slate-600"}`}>
      {labels[level] ?? level}
    </span>
  );
};
