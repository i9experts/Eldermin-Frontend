import { useState, useRef, useEffect, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import Papa from "papaparse";
import {
  LayoutDashboard, Users, TrendingUp, UserPlus,
  ClipboardList, Calendar, CreditCard, FileText,
  BarChart3, GraduationCap, ScrollText, LogOut,
  BookOpen, Star, Check, X, ChevronLeft, ChevronRight,
  ChevronDown, ChevronUp, Plus, Trash2, AlertTriangle,
  Upload, User as UserIcon, Wifi, WifiOff, RefreshCw, KeyRound, Settings,
  MessageSquareWarning, NotebookPen, Receipt,
} from "lucide-react";
import hrService from "../../services/hr.service";
import organizationService from "../../services/organization.service";
import { HRTrainingTab } from "./tabs/TrainingTab";
import { ErpAccessAction } from "./StaffProfile";
import type { LucideIcon } from "lucide-react";
import {
  LineChart, Line,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

// ─── TYPES ────────────────────────────────────────────────────────────────────
type HRTab =
  | "dashboard" | "employees" | "lifecycle" | "recruitment"
  | "onboarding" | "attendance" | "leave" | "payroll" | "payslip"
  | "performance" | "training" | "contracts" | "exit" | "settings"
  | "grievance" | "worksummary" | "expenses" | "reports";

const TABS: { id: HRTab; label: string; icon: LucideIcon; badge?: number }[] = [
  { id: "dashboard",   label: "Dashboard",     icon: LayoutDashboard },
  { id: "employees",   label: "Employees",     icon: Users           },
  { id: "lifecycle",   label: "Lifecycle",     icon: TrendingUp      },
  { id: "recruitment", label: "Recruitment",   icon: UserPlus },
  { id: "onboarding",  label: "Onboarding",    icon: ClipboardList },
  { id: "attendance",  label: "Attendance",    icon: Calendar        },
  { id: "leave",       label: "Leave",         icon: BookOpen        },
  { id: "payroll",     label: "Payroll",       icon: CreditCard      },
  { id: "payslip",     label: "Payslips",      icon: FileText        },
  { id: "performance", label: "Performance",   icon: Star            },
  { id: "training",    label: "Training",      icon: GraduationCap   },
  { id: "contracts",   label: "Contracts",     icon: ScrollText      },
  { id: "exit",        label: "Exit",          icon: LogOut          },
  { id: "grievance",   label: "Grievance",     icon: MessageSquareWarning },
  { id: "worksummary", label: "Work Summary",  icon: NotebookPen     },
  { id: "expenses",    label: "Expense Claims",icon: Receipt         },
  { id: "reports",     label: "HR Reports",    icon: BarChart3       },
  { id: "settings",    label: "HR Settings",   icon: Settings        },
];

// ─── SHARED PRIMITIVES ────────────────────────────────────────────────────────
type BadgeVariant = "green" | "amber" | "red" | "blue" | "purple" | "gray" | "navy";
const BADGE: Record<BadgeVariant, string> = {
  green:  "bg-emerald-50 text-emerald-700 border-emerald-200",
  amber:  "bg-amber-50 text-amber-700 border-amber-200",
  red:    "bg-red-50 text-red-700 border-red-200",
  blue:   "bg-blue-50 text-blue-700 border-blue-200",
  purple: "bg-purple-50 text-purple-700 border-purple-200",
  gray:   "bg-slate-100 text-slate-600 border-slate-200",
  navy:   "bg-[#0C447C] text-white border-[#0C447C]",
};

function Badge({ v, children }: { v: BadgeVariant; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${BADGE[v]}`}>
      {children}
    </span>
  );
}

function Btn({ children, variant = "secondary", onClick, disabled }: {
  children: React.ReactNode; variant?: "primary" | "secondary" | "danger" | "success";
  onClick?: () => void; disabled?: boolean;
}) {
  const v = {
    primary:   "bg-[#0C447C] text-white hover:bg-[#0b3d6e] border-[#0C447C]",
    secondary: "bg-white text-slate-700 hover:bg-slate-50 border-slate-200",
    danger:    "bg-red-600 text-white hover:bg-red-700 border-red-600",
    success:   "bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-600",
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`${v[variant]} px-3 py-1.5 text-xs border rounded-lg font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      {children}
    </button>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white rounded-xl border border-slate-100 shadow-sm ${className}`}>{children}</div>;
}

function CardHeader({ title, sub, actions }: { title: string; sub?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
      <div>
        <div className="font-semibold text-slate-800 text-sm">{title}</div>
        {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap justify-end">{actions}</div>}
    </div>
  );
}

function KPI({ label, value, sub, color = "navy" }: { label: string; value: string; sub?: string; color?: string }) {
  const bar: Record<string, string> = {
    navy: "bg-[#0C447C]", amber: "bg-[#EF9F27]", red: "bg-red-500",
    green: "bg-emerald-500", blue: "bg-blue-500",
  };
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
      <div className={`h-1 ${bar[color] ?? "bg-slate-200"}`} />
      <div className="p-4">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</div>
        <div className="text-2xl font-bold text-slate-800 mt-1">{value}</div>
        {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
      </div>
    </div>
  );
}

function PBar({ pct, color = "#0C447C" }: { pct: number; color?: string }) {
  return (
    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden w-full">
      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

function Alert({ type = "warning", children }: { type?: "warning" | "danger" | "info"; children: React.ReactNode }) {
  const s = {
    warning: "bg-amber-50 border-amber-200 text-amber-800",
    danger:  "bg-red-50 border-red-200 text-red-800",
    info:    "bg-blue-50 border-blue-200 text-blue-800",
  };
  return (
    <div className={`p-3 rounded-lg border mb-4 text-sm ${s[type]}`}>{children}</div>
  );
}

function THead({ cols }: { cols: string[] }) {
  return (
    <thead>
      <tr className="border-b border-slate-100">
        {cols.map((c) => (
          <th key={c} className="text-left py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap bg-slate-50">
            {c}
          </th>
        ))}
      </tr>
    </thead>
  );
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`py-2.5 px-4 text-sm text-slate-700 ${className}`}>{children}</td>;
}

function Avatar({ initials, bg = "#0C447C", src }: { initials: string; bg?: string; src?: string }) {
  const [imgFailed, setImgFailed] = useState(false);
  if (src && !imgFailed) {
    return (
      <img
        src={src}
        alt={initials}
        onError={() => setImgFailed(true)}
        className="w-8 h-8 rounded-full object-cover shrink-0"
      />
    );
  }
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
      style={{ background: bg }}>
      {initials}
    </div>
  );
}


const EMP_STATUS_V: Record<string, BadgeVariant> = {
  Active: "green", Probation: "amber", "On Leave": "blue",
};


const CONTRACT_STATUS_V: Record<string, BadgeVariant> = {
  "Expiring Soon": "red", Active: "green",
};

const PERF_STATUS_V: Record<string, BadgeVariant> = {
  Completed: "green", "In Progress": "amber", Pending: "blue",
};

const API_STATUS_V: Record<string, BadgeVariant> = {
  active: "green", on_leave: "blue", resigned: "gray", terminated: "red",
};

const AVATAR_COLORS = ["#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#0C447C", "#3b82f6"];
function avatarColor(id: string) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) | 0;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}
function staffInitials(first: string, last: string) {
  return `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase();
}

const EMP_EMPTY_FORM = {
  firstName: "", lastName: "", employeeId: "", email: "", phone: "",
  department: "", employmentType: "full_time", dateOfJoining: "",
};

// ─── DASHBOARD TAB ───────────────────────────────────────────────────────────
function DashboardTab({ setTab }: { setTab: (t: HRTab) => void }) {
  const todayIso = new Date().toISOString().split("T")[0];
  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  // ── Real data queries ──────────────────────────────────────────────────────
  const { data: staffList = [] } = useQuery({ queryKey: ["staff"], queryFn: hrService.getStaff });
  const { data: leaveStats }     = useQuery({ queryKey: ["leave-stats"],       queryFn: hrService.getLeaveStats });
  const { data: payrollStats }   = useQuery({ queryKey: ["payroll-stats"],     queryFn: hrService.getPayrollStats });
  const { data: contractStats }  = useQuery({ queryKey: ["contract-stats"],    queryFn: hrService.getContractStats });
  const { data: recruitmentStats } = useQuery({ queryKey: ["recruitment-stats"], queryFn: hrService.getRecruitmentStats });
  const { data: lifecycleData }  = useQuery({ queryKey: ["lifecycle"],         queryFn: hrService.getLifecycle });
  const { data: exitRecords = [] } = useQuery({ queryKey: ["exit-records"],    queryFn: hrService.getExitRecords });
  const { data: todayAttendance = [] } = useQuery({
    queryKey: ["staff-attendance", todayIso],
    queryFn: () => hrService.getStaffAttendance({ date: todayIso }),
  });
  const { data: pendingLeaves = [] } = useQuery({
    queryKey: ["leave-applications", "pending"],
    queryFn: () => hrService.getLeaveApplications({ status: "pending" }),
  });
  const { data: contracts = [] } = useQuery({
    queryKey: ["contracts"],
    queryFn: hrService.getContracts,
  });

  // ── Computed values ────────────────────────────────────────────────────────
  const staff = staffList as any[];
  const att   = todayAttendance as any[];
  const exits = exitRecords as any[];
  const contractList = contracts as any[];
  const leaveList    = pendingLeaves as any[];

  const totalEmployees  = staff.length;
  const presentToday    = att.filter((a: any) => a.status === "present").length;
  const onLeaveToday    = att.filter((a: any) => a.status === "on_leave").length;
  const lateToday       = att.filter((a: any) => a.status === "late").length;
  const attendancePct   = totalEmployees > 0 ? Math.round((presentToday / totalEmployees) * 100) : 0;
  const pendingLeaveCount  = leaveStats?.pending ?? leaveList.length;
  const openPositions      = recruitmentStats?.activeJobs ?? 0;
  const contractsExpiring  = contractStats?.expiringSoon ?? 0;
  const exitCases          = exits.filter((e: any) => e.clearanceStatus !== "completed").length;
  const onboardingCount    = lifecycleData?.grouped?.onboarding?.length ?? 0;
  const thisMonthPayroll   = payrollStats?.thisMonthTotal ?? 0;

  const payrollLabel = thisMonthPayroll > 0
    ? `PKR ${(thisMonthPayroll / 1_000_000).toFixed(1)}M`
    : "—";

  // Recent hires: last 5 staff sorted by createdAt desc
  const recentHires = [...staff]
    .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
    .slice(0, 5);

  // Campus breakdown from real staff data
  const campusMap: Record<string, number> = {};
  for (const s of staff) {
    const c = s.campus || s.campusId?.name || "Unknown";
    campusMap[c] = (campusMap[c] || 0) + 1;
  }
  const campusPieColors = ["#0C447C", "#EF9F27", "#10b981", "#8b5cf6", "#3b82f6", "#ef4444"];
  const campusData = Object.entries(campusMap).map(([name, value], i) => ({
    name, value, color: campusPieColors[i % campusPieColors.length],
  }));

  // Gender breakdown from real staff data
  const genderMap: Record<string, number> = {};
  for (const s of staff) {
    const g = s.gender ? (s.gender.charAt(0).toUpperCase() + s.gender.slice(1)) : "Unknown";
    genderMap[g] = (genderMap[g] || 0) + 1;
  }
  const genderPieColors = ["#0C447C", "#EF9F27", "#10b981"];
  const genderData = Object.entries(genderMap).map(([name, value], i) => ({
    name, value, color: genderPieColors[i % genderPieColors.length],
  }));

  // Contracts expiring within 30 days
  const now = new Date();
  const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const expiringContracts = contractList
    .filter((c: any) => {
      if (!c.endDate && !c.contractEndDate) return false;
      const end = new Date(c.endDate || c.contractEndDate);
      return end >= now && end <= in30;
    })
    .sort((a: any, b: any) => new Date(a.endDate || a.contractEndDate).getTime() - new Date(b.endDate || b.contractEndDate).getTime())
    .slice(0, 5);

  const daysUntil = (dateStr: string) => {
    const d = Math.ceil((new Date(dateStr).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return d;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900">HR Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">{todayLabel}</p>
        </div>
        <div className="flex gap-2">
          <Btn>Export</Btn>
          <Btn>All Campuses ▾</Btn>
        </div>
      </div>

      {/* Primary KPIs */}
      <div className="grid grid-cols-5 gap-3 mb-3">
        <KPI label="Total Employees"
          value={String(totalEmployees)}
          sub={totalEmployees === 0 ? "No staff added yet" : `${staff.filter((s: any) => s.status === "active").length} active`}
          color="navy" />
        <KPI label="Present Today"
          value={att.length > 0 ? String(presentToday) : "—"}
          sub={att.length > 0 ? `${attendancePct}% attendance rate` : "Mark attendance to see data"}
          color="green" />
        <KPI label="On Leave Today"
          value={att.length > 0 ? String(onLeaveToday) : "—"}
          sub={att.length > 0 ? `${lateToday} late arrival${lateToday !== 1 ? "s" : ""}` : "No attendance data"}
          color="amber" />
        <KPI label="Payroll (This Month)"
          value={payrollLabel}
          sub={thisMonthPayroll === 0 ? "No payroll runs yet" : "Current month total"}
          color="red" />
        <KPI label="Onboarding"
          value={String(onboardingCount)}
          sub={onboardingCount === 0 ? "No active onboarding" : "Staff in onboarding"}
          color="blue" />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-5 gap-3 mb-5">
        <KPI label="Open Positions"
          value={String(openPositions)}
          sub={openPositions === 0 ? "No active job postings" : "Active job postings"}
          color="amber" />
        <KPI label="Late Arrivals"
          value={att.length > 0 ? String(lateToday) : "—"}
          sub={att.length > 0 ? "Today" : "No attendance data"}
          color="red" />
        <KPI label="Contracts Expiring"
          value={String(contractsExpiring > 0 ? contractsExpiring : expiringContracts.length)}
          sub="Within 30 days"
          color="amber" />
        <KPI label="Pending Leave"
          value={String(pendingLeaveCount)}
          sub={pendingLeaveCount === 0 ? "No pending requests" : "Awaiting approval"}
          color="navy" />
        <KPI label="Exit Cases"
          value={String(exitCases)}
          sub={exitCases === 0 ? "No pending exits" : "In clearance"}
          color="gray" />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-6 gap-3 mb-5">
        {[
          { label: "Add Employee",       bg: "#eff6ff", onClick: () => setTab("employees")   },
          { label: "Create Job Opening", bg: "#ecfdf5", onClick: () => setTab("recruitment") },
          { label: "Process Payroll",    bg: "#f5f3ff", onClick: () => setTab("payroll")     },
          { label: "Mark Attendance",    bg: "#fffbeb", onClick: () => setTab("attendance")  },
          { label: "Apply Leave",        bg: "#fef2f2", onClick: () => setTab("leave")       },
          { label: "Start Appraisal",    bg: "#f1f5f9", onClick: () => setTab("performance") },
        ].map((qa) => (
          <button key={qa.label} onClick={qa.onClick}
            className="bg-white border border-slate-200 rounded-xl p-3 text-center hover:border-[#0C447C] hover:bg-blue-50 transition-all cursor-pointer flex flex-col items-center gap-1.5">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base" style={{ background: qa.bg }}>
              <BarChart3 className="w-4 h-4 text-slate-600" />
            </div>
            <div className="text-xs font-medium text-slate-600 leading-tight">{qa.label}</div>
          </button>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-3 gap-4 mb-5" style={{ gridTemplateColumns: "2fr 1fr 1fr" }}>
        {/* Attendance — no trend data available; show today's snapshot */}
        <Card>
          <CardHeader title="Attendance Today" sub={todayLabel} />
          {att.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              <div className="text-3xl mb-2">📋</div>
              Mark attendance to see daily stats
            </div>
          ) : (
            <div className="p-5">
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: "Present", value: presentToday, color: "#10b981" },
                  { label: "Absent",  value: att.filter((a: any) => a.status === "absent").length, color: "#ef4444" },
                  { label: "Late",    value: lateToday, color: "#EF9F27" },
                ].map((s) => (
                  <div key={s.label} className="text-center p-3 bg-slate-50 rounded-xl">
                    <div className="text-xl font-bold" style={{ color: s.color }}>{s.value}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
              <PBar pct={attendancePct} color="#10b981" />
              <div className="text-xs text-slate-400 mt-1.5 text-right">{attendancePct}% present</div>
            </div>
          )}
        </Card>

        {/* Staff by Campus */}
        <Card>
          <CardHeader title="Staff by Campus" />
          {campusData.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              <div className="text-3xl mb-2">🏫</div>
              Add staff to see campus breakdown
            </div>
          ) : (
            <div className="p-4">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={campusData} dataKey="value" innerRadius={45} outerRadius={65}>
                    {campusData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Gender Ratio */}
        <Card>
          <CardHeader title="Gender Ratio" />
          {genderData.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              <div className="text-3xl mb-2">👥</div>
              Add staff to see gender breakdown
            </div>
          ) : (
            <div className="p-4">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={genderData} dataKey="value" innerRadius={50} outerRadius={68}>
                    {genderData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-3 gap-4">

        {/* Recent Hires — real data from staffList sorted by createdAt */}
        <Card>
          <CardHeader title="Recent Hires" actions={<Btn onClick={() => setTab("employees")}>View All</Btn>} />
          {recentHires.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              <div className="text-3xl mb-2">👤</div>
              No staff added yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <THead cols={["Employee", "Role", "Joined", "Status"]} />
                <tbody>
                  {recentHires.map((e: any) => {
                    const initials = staffInitials(e.firstName || "", e.lastName || "");
                    const joinDate = e.dateOfJoining
                      ? new Date(e.dateOfJoining).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
                      : "—";
                    return (
                      <tr key={e._id} className="border-b border-slate-50 hover:bg-slate-50">
                        <Td>
                          <div className="flex items-center gap-2">
                            <Avatar initials={initials} bg={avatarColor(e._id || e.firstName || "")} />
                            <div>
                              <div className="font-medium text-slate-800">{e.firstName} {e.lastName}</div>
                              <div className="text-xs text-slate-400">{e.employeeId || "—"}</div>
                            </div>
                          </div>
                        </Td>
                        <Td>
                          <div className="text-xs text-slate-700">{e.designation || e.designationId?.name || "—"}</div>
                          <div className="text-xs text-slate-400">{e.department || "—"}</div>
                        </Td>
                        <Td className="whitespace-nowrap text-slate-500">{joinDate}</Td>
                        <Td><Badge v={API_STATUS_V[e.status] ?? "gray"}>{e.status || "—"}</Badge></Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Pending Leave Approvals — real data */}
        <Card>
          <CardHeader title="Pending Leave Requests" actions={<Btn onClick={() => setTab("leave")}>View All</Btn>} />
          {leaveList.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              <div className="text-3xl mb-2">✅</div>
              No pending leave requests
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <THead cols={["Employee", "Type", "Days", ""]} />
                <tbody>
                  {(leaveList as any[]).slice(0, 5).map((l: any, i: number) => {
                    const name = l.staffName || `${l.firstName || ""} ${l.lastName || ""}`.trim() || "—";
                    const days = l.totalDays ?? l.days ?? "—";
                    const type = l.leaveType || l.type || "Leave";
                    return (
                      <tr key={l._id ?? i} className="border-b border-slate-50 hover:bg-slate-50">
                        <Td><div className="font-medium">{name}</div></Td>
                        <Td>{type}</Td>
                        <Td>{days}</Td>
                        <Td>
                          <Badge v="amber">Pending</Badge>
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Contracts Expiring — real data */}
        <Card>
          <CardHeader title="Contracts Expiring" actions={<Btn onClick={() => setTab("contracts")}>View All</Btn>} />
          {expiringContracts.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              <div className="text-3xl mb-2">📋</div>
              {contractsExpiring > 0
                ? `${contractsExpiring} expiring soon — check Contracts tab`
                : "No contracts expiring in 30 days"}
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {expiringContracts.map((c: any) => {
                const endDate = c.endDate || c.contractEndDate;
                const days = daysUntil(endDate);
                const name = c.staffName || `${c.firstName || ""} ${c.lastName || ""}`.trim() || "—";
                const role = c.designation || c.department || "";
                const campus = c.campus || "";
                const variant: BadgeVariant = days <= 7 ? "red" : days <= 14 ? "amber" : "gray";
                return (
                  <div key={c._id} className="flex items-center justify-between p-4">
                    <div>
                      <div className="text-sm font-medium text-slate-800">{name}</div>
                      <div className="text-xs text-slate-500">{[role, campus].filter(Boolean).join(" · ")}</div>
                    </div>
                    <Badge v={variant}>{days}d</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Upcoming Reminders — birthdays, work anniversaries, holidays */}
        <UpcomingRemindersCard />
      </div>
    </div>
  );
}

function UpcomingRemindersCard() {
  const { data: reminders, isLoading } = useQuery({ queryKey: ['upcoming-reminders'], queryFn: () => hrService.getUpcomingReminders(30) });
  const r = (reminders || {}) as any;
  const items = [
    ...(r.birthdays || []).map((b: any) => ({ ...b, icon: '🎂', label: `${b.name}'s birthday` })),
    ...(r.anniversaries || []).map((a: any) => ({ ...a, icon: '🎉', label: `${a.name} — ${a.years} year${a.years === 1 ? '' : 's'} anniversary` })),
    ...(r.holidays || []).map((h: any) => ({ ...h, icon: '📅', label: h.name })),
  ].sort((a, b) => a.inDays - b.inDays);

  return (
    <Card>
      <CardHeader title="Upcoming (Next 30 Days)" />
      {isLoading ? (
        <div className="p-8 text-center text-slate-400 text-sm animate-pulse">Loading…</div>
      ) : items.length === 0 ? (
        <div className="p-8 text-center text-slate-400 text-sm">
          <div className="text-3xl mb-2">🔔</div>
          Nothing coming up in the next 30 days
        </div>
      ) : (
        <div className="divide-y divide-slate-50">
          {items.slice(0, 6).map((item: any, i: number) => (
            <div key={i} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-2">
                <span>{item.icon}</span>
                <div>
                  <div className="text-sm font-medium text-slate-800">{item.label}</div>
                  {item.department && <div className="text-xs text-slate-500">{item.department}</div>}
                </div>
              </div>
              <Badge v={item.inDays === 0 ? 'green' : item.inDays <= 7 ? 'amber' : 'gray'}>
                {item.inDays === 0 ? 'Today' : `${item.inDays}d`}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STAFF ENROLLMENT WIZARD
// ═══════════════════════════════════════════════════════════════════════════

// ─── WIZARD TYPES ────────────────────────────────────────────────────────────
interface StaffQual { degree:string; field:string; institution:string; country:string; year:string; grade:string; specialization:string }
interface StaffCert { name:string; issuedBy:string; issueDate:string; expiryDate:string }
interface StaffExp  { employer:string; jobTitle:string; fromDate:string; toDate:string; reason:string }

interface StaffWD {
  title:string; firstName:string; middleName:string; lastName:string; preferredName:string; arabicName:string
  dateOfBirth:string; placeOfBirth:string; gender:string; maritalStatus:string; nationality:string
  secondNationality:string; religion:string; bloodGroup:string; motherTongue:string; languagesSpoken:string
  nationalIdNo:string; nationalIdExpiry:string; passportNo:string; passportExpiry:string
  visaNo:string; visaExpiry:string; residencePermitNo:string; residencePermitExpiry:string
  drivingLicenseNo:string; drivingLicenseExpiry:string
  teachingLicenseNo:string; teachingLicenseExpiry:string; teachingLicenseAuthority:string; teachingLicenseCountry:string
  personalPhone:string; altPhone:string; workPhone:string; whatsApp:string
  personalEmail:string; workEmail:string; preferredContact:string
  curStreet:string; curCity:string; curState:string; curCountry:string; curPostal:string
  sameAddress:boolean
  perStreet:string; perCity:string; perState:string; perCountry:string; perPostal:string
  emergencyName:string; emergencyRelation:string; emergencyPhone:string; emergencyAltPhone:string
  designation:string; department:string; campus:string; employmentType:string; erpRole:string
  reportingManager:string; dateOfJoining:string; probationEndDate:string
  contractType:string; contractEndDate:string; workingHours:string; noticePeriod:string; createPortalAccount:boolean
  isTeacher:boolean; subjectsCanTeach:string[]; gradeLevels:string[]
  maxPeriodsPerDay:string; maxPeriodsPerWeek:string; isClassTeacher:boolean; specializations:string
  certCambridge:boolean; certIB:boolean; certGoogle:boolean; certMicrosoft:boolean; certSEN:boolean; certECE:boolean
  qualifications:StaffQual[]; certifications:StaffCert[]; experience:StaffExp[]
  ref1Name:string; ref1Title:string; ref1Org:string; ref1Phone:string; ref1Email:string
  ref2Name:string; ref2Title:string; ref2Org:string; ref2Phone:string; ref2Email:string
  grossSalary:string; currency:string; paymentFrequency:string; salaryEffectiveFrom:string
  bankName:string; accountTitle:string; accountNumber:string; iban:string; branchCode:string; branchName:string; accountCurrency:string; bankVerified:boolean
  uploadedDocs:Record<string,string>
  confirmed1:boolean; confirmed2:boolean
}

const STAFF_EMPTY:StaffWD = {
  title:'Mr', firstName:'', middleName:'', lastName:'', preferredName:'', arabicName:'',
  dateOfBirth:'', placeOfBirth:'', gender:'', maritalStatus:'', nationality:'', secondNationality:'',
  religion:'', bloodGroup:'', motherTongue:'', languagesSpoken:'',
  nationalIdNo:'', nationalIdExpiry:'', passportNo:'', passportExpiry:'',
  visaNo:'', visaExpiry:'', residencePermitNo:'', residencePermitExpiry:'',
  drivingLicenseNo:'', drivingLicenseExpiry:'',
  teachingLicenseNo:'', teachingLicenseExpiry:'', teachingLicenseAuthority:'', teachingLicenseCountry:'',
  personalPhone:'', altPhone:'', workPhone:'', whatsApp:'',
  personalEmail:'', workEmail:'', preferredContact:'Phone',
  curStreet:'', curCity:'', curState:'', curCountry:'', curPostal:'',
  sameAddress:true,
  perStreet:'', perCity:'', perState:'', perCountry:'', perPostal:'',
  emergencyName:'', emergencyRelation:'', emergencyPhone:'', emergencyAltPhone:'',
  designation:'', department:'', campus:'', employmentType:'full_time', erpRole:'',
  reportingManager:'', dateOfJoining:'', probationEndDate:'',
  contractType:'Permanent', contractEndDate:'', workingHours:'40', noticePeriod:'30', createPortalAccount:false,
  isTeacher:false, subjectsCanTeach:[], gradeLevels:[],
  maxPeriodsPerDay:'6', maxPeriodsPerWeek:'25', isClassTeacher:false, specializations:'',
  certCambridge:false, certIB:false, certGoogle:false, certMicrosoft:false, certSEN:false, certECE:false,
  qualifications:[], certifications:[], experience:[],
  ref1Name:'', ref1Title:'', ref1Org:'', ref1Phone:'', ref1Email:'',
  ref2Name:'', ref2Title:'', ref2Org:'', ref2Phone:'', ref2Email:'',
  grossSalary:'', currency:'PKR', paymentFrequency:'Monthly', salaryEffectiveFrom:'',
  bankName:'', accountTitle:'', accountNumber:'', iban:'', branchCode:'', branchName:'', accountCurrency:'PKR', bankVerified:false,
  uploadedDocs:{}, confirmed1:false, confirmed2:false,
}

const HR_DRAFT_KEY  = 'eldermin_staff_enroll_draft'
const HR_STEP_LABELS = ['Personal','Documents','Contact','Employment','Teaching','Qualifications','Salary','Uploads','Review']

// ─── WIZARD UI HELPERS ────────────────────────────────────────────────────────
const WIC = 'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]'
const WRC = 'w-full px-3 py-2 text-sm border border-slate-100 rounded-lg bg-slate-50 text-slate-400'
const WEC = 'w-full px-3 py-2 text-sm border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 bg-red-50'

function WF({ label, required, children, span2, err }:{ label:string; required?:boolean; children:React.ReactNode; span2?:boolean; err?:string }) {
  return (
    <div className={span2 ? 'col-span-2' : ''}>
      <label className="block text-xs font-semibold text-slate-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {err && <p className="text-xs text-red-500 mt-0.5">{err}</p>}
    </div>
  )
}
function WSEC({ title }:{ title:string }) {
  return (
    <div className="flex items-center gap-3 mb-4 pb-2 border-b border-slate-100 mt-6 first:mt-0">
      <div className="w-1 h-5 rounded-full bg-[#EF9F27] shrink-0" />
      <h3 className="font-bold text-sm text-slate-800">{title}</h3>
    </div>
  )
}
function WToggle({ value, onChange }:{ value:boolean; onChange:(v:boolean)=>void }) {
  return (
    <button type="button" onClick={()=>onChange(!value)}
      className={`w-11 h-6 rounded-full transition-colors shrink-0 relative ${value?'bg-[#0C447C]':'bg-slate-200'}`}>
      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${value?'left-5':'left-0.5'}`} />
    </button>
  )
}
function HRStepIndicator({ step }:{ step:number }) {
  return (
    <div className="flex items-start justify-between px-1">
      {HR_STEP_LABELS.map((label, i) => {
        const n=i+1; const done=n<step; const active=n===step
        return (
          <Fragment key={n}>
            {i>0 && <div className={`flex-1 h-0.5 mt-[14px] mx-0.5 ${n<=step?'bg-white/60':'bg-white/20'}`} />}
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                done?'bg-emerald-400 border-emerald-300 text-white':
                active?'bg-white border-white text-[#0C447C]':
                'bg-transparent border-white/30 text-white/50'}`}>
                {done?<Check size={12}/>:n}
              </div>
              <span className={`text-[9px] font-medium whitespace-nowrap ${active?'text-white':'text-white/50'}`}>{label}</span>
            </div>
          </Fragment>
        )
      })}
    </div>
  )
}

type SProp = { data:StaffWD; setData:React.Dispatch<React.SetStateAction<StaffWD>>; errors:Record<string,string> }

// ─── STEP 1: PERSONAL IDENTITY ────────────────────────────────────────────────
function S1Personal({ data:d, setData, errors }:SProp) {
  const ss = (k:keyof StaffWD, v:string) => setData(p=>({...p,[k]:v} as StaffWD))
  return (
    <div className="flex gap-6">
      <div className="flex-1">
        <WSEC title="Name" />
        <div className="grid grid-cols-2 gap-3">
          <WF label="Title">
            <select value={d.title} onChange={e=>ss('title',e.target.value)} className={WIC}>
              {['Mr','Mrs','Ms','Dr','Prof','Sheikh','Haji'].map(t=><option key={t}>{t}</option>)}
            </select>
          </WF>
          <WF label="Employee ID (auto-generated)"><input value={`EMP-${new Date().getFullYear()}-XXXX`} readOnly className={WRC}/></WF>
          <WF label="First Name" required err={errors.firstName}><input value={d.firstName} onChange={e=>ss('firstName',e.target.value)} className={errors.firstName?WEC:WIC} placeholder="First name"/></WF>
          <WF label="Middle Name"><input value={d.middleName} onChange={e=>ss('middleName',e.target.value)} className={WIC} placeholder="Middle name"/></WF>
          <WF label="Last Name" required err={errors.lastName}><input value={d.lastName} onChange={e=>ss('lastName',e.target.value)} className={errors.lastName?WEC:WIC} placeholder="Last name"/></WF>
          <WF label="Preferred Name"><input value={d.preferredName} onChange={e=>ss('preferredName',e.target.value)} className={WIC} placeholder="Name used at work"/></WF>
          <WF label="Arabic Name"><input value={d.arabicName} onChange={e=>ss('arabicName',e.target.value)} className={WIC} placeholder="الاسم بالعربي" dir="rtl"/></WF>
          <WF label="Date of Birth" required err={errors.dateOfBirth}><input type="date" value={d.dateOfBirth} onChange={e=>ss('dateOfBirth',e.target.value)} className={errors.dateOfBirth?WEC:WIC}/></WF>
          <WF label="Place of Birth"><input value={d.placeOfBirth} onChange={e=>ss('placeOfBirth',e.target.value)} className={WIC} placeholder="City, Country"/></WF>
          <WF label="Gender" required err={errors.gender}>
            <select value={d.gender} onChange={e=>ss('gender',e.target.value)} className={errors.gender?WEC:WIC}>
              <option value="">Select gender</option>
              <option value="male">Male</option><option value="female">Female</option>
            </select>
          </WF>
          <WF label="Marital Status">
            <select value={d.maritalStatus} onChange={e=>ss('maritalStatus',e.target.value)} className={WIC}>
              <option value="">Select</option>
              {['Single','Married','Divorced','Widowed'].map(s=><option key={s}>{s}</option>)}
            </select>
          </WF>
          <WF label="Nationality" required err={errors.nationality}><input value={d.nationality} onChange={e=>ss('nationality',e.target.value)} className={errors.nationality?WEC:WIC} placeholder="e.g. Pakistani"/></WF>
          <WF label="Second Nationality"><input value={d.secondNationality} onChange={e=>ss('secondNationality',e.target.value)} className={WIC} placeholder="Optional"/></WF>
          <WF label="Religion">
            <select value={d.religion} onChange={e=>ss('religion',e.target.value)} className={WIC}>
              <option value="">Select</option>
              {['Islam','Christianity','Hinduism','Judaism','Buddhism','Other'].map(r=><option key={r}>{r}</option>)}
            </select>
          </WF>
          <WF label="Blood Group">
            <select value={d.bloodGroup} onChange={e=>ss('bloodGroup',e.target.value)} className={WIC}>
              <option value="">Unknown</option>
              {['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(g=><option key={g}>{g}</option>)}
            </select>
          </WF>
          <WF label="Mother Tongue"><input value={d.motherTongue} onChange={e=>ss('motherTongue',e.target.value)} className={WIC} placeholder="e.g. Urdu"/></WF>
          <WF label="Languages Spoken (comma-separated)" span2><input value={d.languagesSpoken} onChange={e=>ss('languagesSpoken',e.target.value)} className={WIC} placeholder="e.g. English, Urdu, Arabic"/></WF>
        </div>
      </div>
      <div className="w-36 shrink-0 flex flex-col items-center pt-10">
        <div className="w-28 h-28 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center mb-3">
          <UserIcon size={36} className="text-slate-300" />
        </div>
        <p className="text-xs font-semibold text-slate-600 mb-2 text-center">Staff Photo</p>
        <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 font-medium text-slate-600">
          <Upload size={11}/>Choose Photo
          <input type="file" className="sr-only" accept="image/jpeg,image/png"/>
        </label>
        <p className="text-[10px] text-slate-400 mt-1.5 text-center">JPG/PNG<br/>max 2MB</p>
      </div>
    </div>
  )
}

// ─── STEP 2: IDENTITY DOCUMENTS ───────────────────────────────────────────────
function S2Documents({ data:d, setData }:SProp) {
  const ss = (k:keyof StaffWD, v:string) => setData(p=>({...p,[k]:v} as StaffWD))
  return (
    <div>
      <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl mb-5 text-sm text-amber-800">
        <AlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0"/>
        Document expiry dates will trigger automatic alerts 30 days before expiry.
      </div>
      <div className="grid grid-cols-2 gap-3">
        <WF label="National ID No"><input value={d.nationalIdNo} onChange={e=>ss('nationalIdNo',e.target.value)} className={WIC} placeholder="CNIC / National ID"/></WF>
        <WF label="National ID Expiry"><input type="date" value={d.nationalIdExpiry} onChange={e=>ss('nationalIdExpiry',e.target.value)} className={WIC}/></WF>
        <WF label="Passport No"><input value={d.passportNo} onChange={e=>ss('passportNo',e.target.value)} className={WIC} placeholder="Passport number"/></WF>
        <WF label="Passport Expiry"><input type="date" value={d.passportExpiry} onChange={e=>ss('passportExpiry',e.target.value)} className={WIC}/></WF>
        <WF label="Visa No"><input value={d.visaNo} onChange={e=>ss('visaNo',e.target.value)} className={WIC} placeholder="Visa number"/></WF>
        <WF label="Visa Expiry"><input type="date" value={d.visaExpiry} onChange={e=>ss('visaExpiry',e.target.value)} className={WIC}/></WF>
        <WF label="Residence Permit No"><input value={d.residencePermitNo} onChange={e=>ss('residencePermitNo',e.target.value)} className={WIC} placeholder="Iqama / Permit no."/></WF>
        <WF label="Residence Permit Expiry"><input type="date" value={d.residencePermitExpiry} onChange={e=>ss('residencePermitExpiry',e.target.value)} className={WIC}/></WF>
        <WF label="Driving License No"><input value={d.drivingLicenseNo} onChange={e=>ss('drivingLicenseNo',e.target.value)} className={WIC} placeholder="License number"/></WF>
        <WF label="Driving License Expiry"><input type="date" value={d.drivingLicenseExpiry} onChange={e=>ss('drivingLicenseExpiry',e.target.value)} className={WIC}/></WF>
        <WF label="Teaching License No"><input value={d.teachingLicenseNo} onChange={e=>ss('teachingLicenseNo',e.target.value)} className={WIC} placeholder="License number"/></WF>
        <WF label="Teaching License Expiry"><input type="date" value={d.teachingLicenseExpiry} onChange={e=>ss('teachingLicenseExpiry',e.target.value)} className={WIC}/></WF>
        <WF label="Issuing Authority"><input value={d.teachingLicenseAuthority} onChange={e=>ss('teachingLicenseAuthority',e.target.value)} className={WIC} placeholder="e.g. MoE, Teaching Council"/></WF>
        <WF label="Issuing Country"><input value={d.teachingLicenseCountry} onChange={e=>ss('teachingLicenseCountry',e.target.value)} className={WIC} placeholder="e.g. Pakistan, UAE"/></WF>
      </div>
    </div>
  )
}

// ─── STEP 3: CONTACT & ADDRESS ────────────────────────────────────────────────
function S3Contact({ data:d, setData, errors }:SProp) {
  const ss = (k:keyof StaffWD, v:string|boolean) => setData(p=>({...p,[k]:v} as StaffWD))
  return (
    <div>
      <WSEC title="Contact Information"/>
      <div className="grid grid-cols-2 gap-3">
        <WF label="Personal Phone" required err={errors.personalPhone}><input value={d.personalPhone} onChange={e=>ss('personalPhone',e.target.value)} className={errors.personalPhone?WEC:WIC} placeholder="+92 300 0000000"/></WF>
        <WF label="Alternate Phone"><input value={d.altPhone} onChange={e=>ss('altPhone',e.target.value)} className={WIC} placeholder="+92 300 0000000"/></WF>
        <WF label="Work Phone"><input value={d.workPhone} onChange={e=>ss('workPhone',e.target.value)} className={WIC} placeholder="Office / extension"/></WF>
        <WF label="WhatsApp"><input value={d.whatsApp} onChange={e=>ss('whatsApp',e.target.value)} className={WIC} placeholder="+92 300 0000000"/></WF>
        <WF label="Personal Email" required err={errors.personalEmail}><input type="email" value={d.personalEmail} onChange={e=>ss('personalEmail',e.target.value)} className={errors.personalEmail?WEC:WIC} placeholder="personal@email.com"/></WF>
        <WF label="Work Email"><input type="email" value={d.workEmail} onChange={e=>ss('workEmail',e.target.value)} className={WIC} placeholder="name@school.edu"/></WF>
        <WF label="Preferred Contact Method">
          <select value={d.preferredContact} onChange={e=>ss('preferredContact',e.target.value)} className={WIC}>
            {['Phone','Email','WhatsApp'].map(c=><option key={c}>{c}</option>)}
          </select>
        </WF>
      </div>
      <WSEC title="Current Address"/>
      <div className="grid grid-cols-2 gap-3">
        <WF label="Street Address" span2><input value={d.curStreet} onChange={e=>ss('curStreet',e.target.value)} className={WIC} placeholder="Street address"/></WF>
        <WF label="City"><input value={d.curCity} onChange={e=>ss('curCity',e.target.value)} className={WIC} placeholder="City"/></WF>
        <WF label="State / Province"><input value={d.curState} onChange={e=>ss('curState',e.target.value)} className={WIC} placeholder="State"/></WF>
        <WF label="Country"><input value={d.curCountry} onChange={e=>ss('curCountry',e.target.value)} className={WIC} placeholder="Country"/></WF>
        <WF label="Postal Code"><input value={d.curPostal} onChange={e=>ss('curPostal',e.target.value)} className={WIC} placeholder="Postal code"/></WF>
        <div className="col-span-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={d.sameAddress} onChange={e=>ss('sameAddress',e.target.checked)} className="w-4 h-4 accent-[#0C447C]"/>
            <span className="text-sm font-medium text-slate-700">Permanent address same as current address</span>
          </label>
        </div>
      </div>
      {!d.sameAddress && (
        <>
          <WSEC title="Permanent Address"/>
          <div className="grid grid-cols-2 gap-3">
            <WF label="Street Address" span2><input value={d.perStreet} onChange={e=>ss('perStreet',e.target.value)} className={WIC} placeholder="Street address"/></WF>
            <WF label="City"><input value={d.perCity} onChange={e=>ss('perCity',e.target.value)} className={WIC} placeholder="City"/></WF>
            <WF label="State / Province"><input value={d.perState} onChange={e=>ss('perState',e.target.value)} className={WIC} placeholder="State"/></WF>
            <WF label="Country"><input value={d.perCountry} onChange={e=>ss('perCountry',e.target.value)} className={WIC} placeholder="Country"/></WF>
            <WF label="Postal Code"><input value={d.perPostal} onChange={e=>ss('perPostal',e.target.value)} className={WIC} placeholder="Postal code"/></WF>
          </div>
        </>
      )}
      <WSEC title="Emergency Contact"/>
      <div className="grid grid-cols-2 gap-3">
        <WF label="Contact Name" required err={errors.emergencyName}><input value={d.emergencyName} onChange={e=>ss('emergencyName',e.target.value)} className={errors.emergencyName?WEC:WIC} placeholder="Full name"/></WF>
        <WF label="Relationship" required err={errors.emergencyRelation}><input value={d.emergencyRelation} onChange={e=>ss('emergencyRelation',e.target.value)} className={errors.emergencyRelation?WEC:WIC} placeholder="e.g. Spouse, Parent"/></WF>
        <WF label="Phone" required err={errors.emergencyPhone}><input value={d.emergencyPhone} onChange={e=>ss('emergencyPhone',e.target.value)} className={errors.emergencyPhone?WEC:WIC} placeholder="+92 300 0000000"/></WF>
        <WF label="Alternate Phone"><input value={d.emergencyAltPhone} onChange={e=>ss('emergencyAltPhone',e.target.value)} className={WIC} placeholder="+92 300 0000000"/></WF>
      </div>
    </div>
  )
}

// ─── STEP 4: EMPLOYMENT DETAILS ───────────────────────────────────────────────
function S4Employment({ data:d, setData, errors }:SProp) {
  const ss = (k:keyof StaffWD, v:string|boolean) => setData(p=>({...p,[k]:v} as StaffWD))
  return (
    <div>
      <WSEC title="Job Details"/>
      <div className="grid grid-cols-2 gap-3">
        <WF label="Designation" required err={errors.designation}><input value={d.designation} onChange={e=>ss('designation',e.target.value)} className={errors.designation?WEC:WIC} placeholder="e.g. Senior Teacher, HOD Mathematics"/></WF>
        <WF label="Department" required err={errors.department}><input value={d.department} onChange={e=>ss('department',e.target.value)} className={errors.department?WEC:WIC} placeholder="e.g. Teaching, Administration"/></WF>
        <WF label="Campus" required err={errors.campus}><input value={d.campus} onChange={e=>ss('campus',e.target.value)} className={errors.campus?WEC:WIC} placeholder="e.g. Main Campus, Gulberg"/></WF>
        <WF label="Employment Type" required err={errors.employmentType}>
          <select value={d.employmentType} onChange={e=>ss('employmentType',e.target.value)} className={errors.employmentType?WEC:WIC}>
            {[['full_time','Full Time'],['part_time','Part Time'],['contract','Contract'],['visiting','Visiting'],['intern','Intern'],['substitute','Substitute']].map(([v,l])=><option key={v} value={v}>{l}</option>)}
          </select>
        </WF>
        <WF label="ERP Role" required err={errors.erpRole}>
          <select value={d.erpRole} onChange={e=>ss('erpRole',e.target.value)} className={errors.erpRole?WEC:WIC}>
            <option value="">Select role</option>
            {[['principal','Principal'],['vice_principal','Vice Principal'],['academic_coordinator','Academic Coordinator'],['finance_manager','Finance Manager'],['hr_manager','HR Manager'],['teacher','Teacher'],['librarian','Librarian'],['admin','Admin'],['support_staff','Support Staff']].map(([v,l])=><option key={v} value={v}>{l}</option>)}
          </select>
        </WF>
        <WF label="Reporting Manager"><input value={d.reportingManager} onChange={e=>ss('reportingManager',e.target.value)} className={WIC} placeholder="Supervisor name"/></WF>
        <WF label="Date of Joining" required err={errors.dateOfJoining}><input type="date" value={d.dateOfJoining} onChange={e=>ss('dateOfJoining',e.target.value)} className={errors.dateOfJoining?WEC:WIC}/></WF>
        <WF label="Probation End Date"><input type="date" value={d.probationEndDate} onChange={e=>ss('probationEndDate',e.target.value)} className={WIC}/></WF>
        <WF label="Contract Type">
          <select value={d.contractType} onChange={e=>ss('contractType',e.target.value)} className={WIC}>
            {['Permanent','Fixed Term','Probationary','Renewal'].map(c=><option key={c}>{c}</option>)}
          </select>
        </WF>
        <WF label="Contract End Date"><input type="date" value={d.contractEndDate} onChange={e=>ss('contractEndDate',e.target.value)} className={WIC}/></WF>
        <WF label="Working Hours / Week"><input type="number" value={d.workingHours} onChange={e=>ss('workingHours',e.target.value)} className={WIC} placeholder="40"/></WF>
        <WF label="Notice Period (days)"><input type="number" value={d.noticePeriod} onChange={e=>ss('noticePeriod',e.target.value)} className={WIC} placeholder="30"/></WF>
      </div>
      <WSEC title="ERP Portal Access"/>
      <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
        <WToggle value={d.createPortalAccount} onChange={v=>setData(p=>({...p,createPortalAccount:v}))}/>
        <div>
          <p className="text-sm font-semibold text-slate-700">Create ERP portal account for this staff member</p>
          {d.createPortalAccount && <p className="text-xs text-slate-400 mt-0.5">Work email will be used as login: <strong>{d.workEmail || d.personalEmail || 'set in Contact step'}</strong></p>}
        </div>
      </div>
    </div>
  )
}

// ─── STEP 5: TEACHING PROFILE ─────────────────────────────────────────────────
const SUBJECTS = ['Mathematics','English','Science','Arabic','Islamic Studies','Physics','Chemistry','Biology','History','Geography','Computer Science','Art','PE','Music','Urdu','French','Economics','Business Studies']
const GRADES   = ['KG1','KG2','Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12']

function S5Teaching({ data:d, setData }:SProp) {
  const ss  = (k:keyof StaffWD, v:string|boolean) => setData(p=>({...p,[k]:v} as StaffWD))
  const toggleArr = (key:'subjectsCanTeach'|'gradeLevels', val:string) =>
    setData(p=>({...p,[key]: (p[key] as string[]).includes(val) ? (p[key] as string[]).filter(x=>x!==val) : [...(p[key] as string[]),val]}))

  return (
    <div>
      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 mb-5">
        <div>
          <p className="text-sm font-semibold text-slate-700">This staff member has teaching responsibilities</p>
          <p className="text-xs text-slate-400 mt-0.5">Enable to configure subjects, grades and teaching details</p>
        </div>
        <WToggle value={d.isTeacher} onChange={v=>setData(p=>({...p,isTeacher:v}))}/>
      </div>
      {d.isTeacher && (
        <>
          <WSEC title="Subjects Can Teach"/>
          <div className="flex flex-wrap gap-2 mb-4">
            {SUBJECTS.map(s=>(
              <label key={s} className={`flex items-center gap-1.5 px-3 py-1 rounded-full border cursor-pointer text-xs font-medium transition-all ${d.subjectsCanTeach.includes(s)?'bg-[#0C447C] text-white border-[#0C447C]':'border-slate-200 text-slate-600 hover:border-[#0C447C] hover:text-[#0C447C]'}`}>
                <input type="checkbox" className="sr-only" checked={d.subjectsCanTeach.includes(s)} onChange={()=>toggleArr('subjectsCanTeach',s)}/>
                {s}
              </label>
            ))}
          </div>
          <WSEC title="Grade Levels Can Teach"/>
          <div className="flex flex-wrap gap-2 mb-4">
            {GRADES.map(g=>(
              <label key={g} className={`flex items-center gap-1.5 px-3 py-1 rounded-full border cursor-pointer text-xs font-medium transition-all ${d.gradeLevels.includes(g)?'bg-[#0C447C] text-white border-[#0C447C]':'border-slate-200 text-slate-600 hover:border-[#0C447C]'}`}>
                <input type="checkbox" className="sr-only" checked={d.gradeLevels.includes(g)} onChange={()=>toggleArr('gradeLevels',g)}/>
                {g}
              </label>
            ))}
          </div>
          <WSEC title="Teaching Capacity"/>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <WF label="Max Periods / Day"><input type="number" value={d.maxPeriodsPerDay} onChange={e=>ss('maxPeriodsPerDay',e.target.value)} className={WIC} placeholder="6"/></WF>
            <WF label="Max Periods / Week"><input type="number" value={d.maxPeriodsPerWeek} onChange={e=>ss('maxPeriodsPerWeek',e.target.value)} className={WIC} placeholder="25"/></WF>
            <WF label="Specializations"><input value={d.specializations} onChange={e=>ss('specializations',e.target.value)} className={WIC} placeholder="e.g. IB Curriculum, STEM"/></WF>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={d.isClassTeacher} onChange={e=>setData(p=>({...p,isClassTeacher:e.target.checked}))} className="w-4 h-4 accent-[#0C447C]"/>
                <span className="text-sm font-medium text-slate-700">Class Teacher</span>
              </label>
            </div>
          </div>
          <WSEC title="Teaching Certifications"/>
          <div className="grid grid-cols-2 gap-3">
            {([['certCambridge','Cambridge Certified Teacher'],['certIB','IB Certified Teacher'],['certGoogle','Google Certified Educator'],['certMicrosoft','Microsoft Certified Educator'],['certSEN','Special Needs (SEN) Trained'],['certECE','Early Childhood Education Certified']] as [keyof StaffWD, string][]).map(([k,label])=>(
              <label key={k} className="flex items-center gap-2 cursor-pointer py-1">
                <input type="checkbox" checked={d[k] as boolean} onChange={e=>setData(p=>({...p,[k]:e.target.checked} as StaffWD))} className="w-4 h-4 accent-[#0C447C]"/>
                <span className="text-sm text-slate-700">{label}</span>
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─── STEP 6: QUALIFICATIONS & EXPERIENCE ──────────────────────────────────────
const BLANK_QUAL:StaffQual = { degree:'', field:'', institution:'', country:'', year:'', grade:'', specialization:'' }
const BLANK_CERT:StaffCert = { name:'', issuedBy:'', issueDate:'', expiryDate:'' }
const BLANK_EXP:StaffExp   = { employer:'', jobTitle:'', fromDate:'', toDate:'', reason:'' }

function S6Qualifications({ data:d, setData }:SProp) {
  const ss = (k:keyof StaffWD, v:string) => setData(p=>({...p,[k]:v} as StaffWD))
  const addQ  = () => setData(p=>({...p,qualifications:  [...p.qualifications,  {...BLANK_QUAL}]}))
  const addC  = () => setData(p=>({...p,certifications:  [...p.certifications,  {...BLANK_CERT}]}))
  const addE  = () => setData(p=>({...p,experience:      [...p.experience,      {...BLANK_EXP}]}))
  const remQ  = (i:number) => setData(p=>({...p,qualifications:  p.qualifications.filter((_,j)=>j!==i)}))
  const remC  = (i:number) => setData(p=>({...p,certifications:  p.certifications.filter((_,j)=>j!==i)}))
  const remE  = (i:number) => setData(p=>({...p,experience:      p.experience.filter((_,j)=>j!==i)}))
  const updQ  = (i:number, k:keyof StaffQual, v:string) => setData(p=>({...p,qualifications: p.qualifications.map((x,j)=>j===i?{...x,[k]:v}:x)}))
  const updC  = (i:number, k:keyof StaffCert, v:string) => setData(p=>({...p,certifications: p.certifications.map((x,j)=>j===i?{...x,[k]:v}:x)}))
  const updE  = (i:number, k:keyof StaffExp,  v:string) => setData(p=>({...p,experience:     p.experience.map((x,j)=>j===i?{...x,[k]:v}:x)}))

  return (
    <div>
      <WSEC title="Academic Qualifications"/>
      {d.qualifications.map((q,i)=>(
        <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-200 mb-3">
          <div className="grid grid-cols-3 gap-3">
            <WF label="Degree / Level" required>
              <select value={q.degree} onChange={e=>updQ(i,'degree',e.target.value)} className={WIC}>
                <option value="">Select</option>
                {['Secondary','Diploma','Bachelors','Masters','PhD','Certification','Other'].map(d=><option key={d}>{d}</option>)}
              </select>
            </WF>
            <WF label="Field of Study" required><input value={q.field} onChange={e=>updQ(i,'field',e.target.value)} className={WIC} placeholder="e.g. Mathematics"/></WF>
            <WF label="Institution" required><input value={q.institution} onChange={e=>updQ(i,'institution',e.target.value)} className={WIC} placeholder="University/College name"/></WF>
            <WF label="Country"><input value={q.country} onChange={e=>updQ(i,'country',e.target.value)} className={WIC} placeholder="Country"/></WF>
            <WF label="Year of Completion"><input value={q.year} onChange={e=>updQ(i,'year',e.target.value)} className={WIC} placeholder="e.g. 2018"/></WF>
            <WF label="Grade / CGPA"><input value={q.grade} onChange={e=>updQ(i,'grade',e.target.value)} className={WIC} placeholder="e.g. 3.8, A, First Class"/></WF>
            <WF label="Specialization" span2><input value={q.specialization} onChange={e=>updQ(i,'specialization',e.target.value)} className={WIC} placeholder="e.g. Pure Mathematics"/></WF>
            <div className="flex items-end justify-end"><button onClick={()=>remQ(i)} className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={12}/>Remove</button></div>
          </div>
        </div>
      ))}
      <button onClick={addQ} className="flex items-center gap-1.5 text-xs text-[#0C447C] hover:underline font-medium mb-5"><Plus size={13}/>Add Qualification</button>

      <WSEC title="Professional Certifications"/>
      {d.certifications.map((c,i)=>(
        <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-200 mb-3">
          <div className="grid grid-cols-4 gap-3">
            <WF label="Certification Name" required><input value={c.name} onChange={e=>updC(i,'name',e.target.value)} className={WIC} placeholder="Cert name"/></WF>
            <WF label="Issued By"><input value={c.issuedBy} onChange={e=>updC(i,'issuedBy',e.target.value)} className={WIC} placeholder="Issuing body"/></WF>
            <WF label="Issue Date"><input type="date" value={c.issueDate} onChange={e=>updC(i,'issueDate',e.target.value)} className={WIC}/></WF>
            <WF label="Expiry Date">
              <div className="flex gap-1">
                <input type="date" value={c.expiryDate} onChange={e=>updC(i,'expiryDate',e.target.value)} className={WIC}/>
                <button onClick={()=>remC(i)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg shrink-0"><Trash2 size={13}/></button>
              </div>
            </WF>
          </div>
        </div>
      ))}
      <button onClick={addC} className="flex items-center gap-1.5 text-xs text-[#0C447C] hover:underline font-medium mb-5"><Plus size={13}/>Add Certification</button>

      <WSEC title="Work Experience"/>
      {d.experience.map((e,i)=>(
        <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-200 mb-3">
          <div className="grid grid-cols-3 gap-3">
            <WF label="Employer" required><input value={e.employer} onChange={ev=>updE(i,'employer',ev.target.value)} className={WIC} placeholder="Organization name"/></WF>
            <WF label="Job Title" required><input value={e.jobTitle} onChange={ev=>updE(i,'jobTitle',ev.target.value)} className={WIC} placeholder="Your title"/></WF>
            <WF label="From Date"><input type="date" value={e.fromDate} onChange={ev=>updE(i,'fromDate',ev.target.value)} className={WIC}/></WF>
            <WF label="To Date (leave blank if current)"><input type="date" value={e.toDate} onChange={ev=>updE(i,'toDate',ev.target.value)} className={WIC}/></WF>
            <WF label="Reason for Leaving"><input value={e.reason} onChange={ev=>updE(i,'reason',ev.target.value)} className={WIC} placeholder="Optional"/></WF>
            <div className="flex items-end justify-end"><button onClick={()=>remE(i)} className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={12}/>Remove</button></div>
          </div>
        </div>
      ))}
      <button onClick={addE} className="flex items-center gap-1.5 text-xs text-[#0C447C] hover:underline font-medium mb-5"><Plus size={13}/>Add Experience</button>

      <WSEC title="References"/>
      <div className="grid grid-cols-2 gap-6">
        {([1,2] as const).map(n=>{
          const pre = `ref${n}` as 'ref1'|'ref2'
          const fields = [['Name',`${pre}Name`],['Title',`${pre}Title`],['Organization',`${pre}Org`],['Phone',`${pre}Phone`],['Email',`${pre}Email`]] as [string, keyof StaffWD][]
          return (
            <div key={n} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Reference {n}</p>
              {fields.map(([label, key])=>(
                <div key={key} className="mb-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
                  <input value={d[key] as string} onChange={e=>ss(key,e.target.value)} className={WIC} placeholder={label}/>
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── STEP 7: SALARY & BANK DETAILS ────────────────────────────────────────────
function S7Salary({ data:d, setData, errors }:SProp) {
  const ss = (k:keyof StaffWD, v:string|boolean) => setData(p=>({...p,[k]:v} as StaffWD))
  return (
    <div>
      <WSEC title="Compensation"/>
      <div className="grid grid-cols-2 gap-3">
        <WF label="Gross Salary" required err={errors.grossSalary}><input type="number" value={d.grossSalary} onChange={e=>ss('grossSalary',e.target.value)} className={errors.grossSalary?WEC:WIC} placeholder="e.g. 85000"/></WF>
        <WF label="Currency">
          <select value={d.currency} onChange={e=>ss('currency',e.target.value)} className={WIC}>
            {['PKR','USD','AED','SAR','GBP','EUR'].map(c=><option key={c}>{c}</option>)}
          </select>
        </WF>
        <WF label="Payment Frequency">
          <select value={d.paymentFrequency} onChange={e=>ss('paymentFrequency',e.target.value)} className={WIC}>
            {['Monthly','Bi-weekly'].map(f=><option key={f}>{f}</option>)}
          </select>
        </WF>
        <WF label="Effective From Date"><input type="date" value={d.salaryEffectiveFrom} onChange={e=>ss('salaryEffectiveFrom',e.target.value)} className={WIC}/></WF>
      </div>
      <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
        <p className="font-semibold text-slate-700 mb-2">Salary Components (Configured in Payroll Settings)</p>
        <div className="grid grid-cols-4 gap-2">
          {[['Basic','60%'],['HRA','20%'],['Transport','10%'],['Medical','10%']].map(([l,v])=>(
            <div key={l} className="text-center p-2 bg-white rounded-lg border border-slate-200">
              <p className="font-bold text-slate-800">{v}</p>
              <p className="text-slate-400">{l}</p>
            </div>
          ))}
        </div>
      </div>
      <WSEC title="Bank Details"/>
      <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-xl mb-4 text-xs text-red-700">
        <AlertTriangle size={14} className="text-red-500 mt-0.5 shrink-0"/>
        Bank details are encrypted and only visible to Finance Manager and HR Manager.
      </div>
      <div className="grid grid-cols-2 gap-3">
        <WF label="Bank Name"><input value={d.bankName} onChange={e=>ss('bankName',e.target.value)} className={WIC} placeholder="e.g. HBL, UBL, Meezan Bank"/></WF>
        <WF label="Account Title"><input value={d.accountTitle} onChange={e=>ss('accountTitle',e.target.value)} className={WIC} placeholder="Account holder name"/></WF>
        <WF label="Account Number"><input value={d.accountNumber} onChange={e=>ss('accountNumber',e.target.value)} className={WIC} placeholder="Account number"/></WF>
        <WF label="IBAN"><input value={d.iban} onChange={e=>ss('iban',e.target.value)} className={WIC} placeholder="IBAN (if applicable)"/></WF>
        <WF label="Branch Code (IFSC/Swift/Sort)"><input value={d.branchCode} onChange={e=>ss('branchCode',e.target.value)} className={WIC} placeholder="Branch code"/></WF>
        <WF label="Branch Name"><input value={d.branchName} onChange={e=>ss('branchName',e.target.value)} className={WIC} placeholder="Branch name / city"/></WF>
        <WF label="Account Currency">
          <select value={d.accountCurrency} onChange={e=>ss('accountCurrency',e.target.value)} className={WIC}>
            {['PKR','USD','AED','SAR','GBP','EUR'].map(c=><option key={c}>{c}</option>)}
          </select>
        </WF>
        <div className="flex items-end pb-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={d.bankVerified} onChange={e=>setData(p=>({...p,bankVerified:e.target.checked}))} className="w-4 h-4 accent-[#0C447C]"/>
            <span className="text-sm font-medium text-slate-700">Bank details verified</span>
          </label>
        </div>
      </div>
    </div>
  )
}

// ─── STEP 8: DOCUMENT UPLOADS ─────────────────────────────────────────────────
const UPLOAD_DOCS = [
  { key:'nationalId',     label:'National ID / CNIC',          req:'Required',         accept:'JPG/PDF',  maxMb:2 },
  { key:'passport',       label:'Passport Copy',                req:'Required if non-national', accept:'JPG/PDF', maxMb:2 },
  { key:'degree',         label:'Degree Certificate(s)',        req:'Required',         accept:'PDF',      maxMb:5 },
  { key:'teachingLicense',label:'Teaching License',             req:'Required for teachers', accept:'PDF', maxMb:2 },
  { key:'experience',     label:'Experience Letters',           req:'Recommended',      accept:'PDF',      maxMb:5 },
  { key:'medical',        label:'Medical Fitness Certificate',  req:'Required',         accept:'PDF',      maxMb:2 },
  { key:'policeClr',      label:'Police Clearance Certificate', req:'Required',         accept:'PDF',      maxMb:2 },
  { key:'photo',          label:'Passport Photo',               req:'Required',         accept:'JPG',      maxMb:1 },
  { key:'visa',           label:'Visa / Residence Permit',      req:'If applicable',    accept:'JPG/PDF',  maxMb:2 },
  { key:'contract',       label:'Contract Signed Copy',         req:'After joining',    accept:'PDF',      maxMb:5 },
]

function S8Uploads({ data:d, setData }:SProp) {
  const setDoc = (key:string, name:string) => setData(p=>({...p, uploadedDocs:{...p.uploadedDocs,[key]:name}}))
  const remDoc = (key:string) => setData(p=>{ const docs={...p.uploadedDocs}; delete docs[key]; return {...p,uploadedDocs:docs} })
  return (
    <div>
      <p className="text-xs text-slate-500 mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
        Files saved to secure document storage. Access controlled by HR. Upload scanned copies or clear photos.
      </p>
      <div className="grid grid-cols-2 gap-4">
        {UPLOAD_DOCS.map(doc=>(
          <div key={doc.key} className="border-2 border-dashed rounded-xl p-4 hover:border-[#0C447C] transition-colors">
            <div className="flex items-start justify-between mb-2">
              <p className="text-sm font-semibold text-slate-700">{doc.label}</p>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${doc.req==='Required'?'bg-red-50 text-red-600 border border-red-200':doc.req==='Recommended'?'bg-amber-50 text-amber-600 border border-amber-200':'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                {doc.req}
              </span>
            </div>
            {d.uploadedDocs[doc.key] ? (
              <div className="flex items-center gap-2">
                <Check size={14} className="text-emerald-500 shrink-0"/>
                <span className="text-xs text-slate-600 flex-1 truncate">{d.uploadedDocs[doc.key]}</span>
                <button onClick={()=>remDoc(doc.key)} className="p-1 text-red-400 hover:text-red-600 shrink-0"><X size={13}/></button>
              </div>
            ) : (
              <label className="cursor-pointer">
                <div className="flex items-center gap-2 mt-2">
                  <Upload size={14} className="text-slate-400"/>
                  <span className="text-xs text-slate-400">{doc.accept} · max {doc.maxMb}MB</span>
                </div>
                <input type="file" className="sr-only"
                  accept={doc.accept.includes('PDF')&&doc.accept.includes('JPG')?'image/jpeg,application/pdf':doc.accept==='PDF'?'application/pdf':'image/jpeg'}
                  onChange={e=>{ if(e.target.files?.[0]) setDoc(doc.key, e.target.files[0].name) }}/>
              </label>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── STEP 9: REVIEW & SUBMIT ──────────────────────────────────────────────────
function RevSection({ title, rows }:{ title:string; rows:Array<[string,string|undefined]> }) {
  const [open,setOpen] = useState(true)
  const vis = rows.filter(([,v])=>v)
  if (!vis.length) return null
  return (
    <div className="mb-3 border border-slate-200 rounded-xl overflow-hidden">
      <button onClick={()=>setOpen(o=>!o)} className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors">
        <span className="font-semibold text-sm text-slate-800">{title}</span>
        {open?<ChevronUp size={15} className="text-slate-400"/>:<ChevronDown size={15} className="text-slate-400"/>}
      </button>
      {open && (
        <div className="px-4 py-3 grid grid-cols-2 gap-x-6 gap-y-2">
          {vis.map(([label,value])=>(
            <div key={label}>
              <p className="text-xs text-slate-400">{label}</p>
              <p className="text-sm font-medium text-slate-700 break-words">{value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function S9Review({ data:d, setData, errors }:SProp) {
  return (
    <div>
      <div className="flex items-start gap-3 mb-5 p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <AlertTriangle size={18} className="text-amber-500 mt-0.5 shrink-0"/>
        <p className="text-sm text-amber-700 font-medium">Please review carefully. Some details cannot be changed after submission without HR Manager approval.</p>
      </div>
      <RevSection title="Personal Details" rows={[
        ['Full Name',[d.title,d.firstName,d.middleName,d.lastName].filter(Boolean).join(' ')],
        ['Preferred Name',d.preferredName],['Arabic Name',d.arabicName],
        ['Date of Birth',d.dateOfBirth],['Gender',d.gender],['Nationality',d.nationality],
        ['Religion',d.religion],['Blood Group',d.bloodGroup],['Marital Status',d.maritalStatus],
      ]}/>
      <RevSection title="Identity Documents" rows={[
        ['National ID',d.nationalIdNo?`${d.nationalIdNo} (exp: ${d.nationalIdExpiry||'—'})`:undefined],
        ['Passport',d.passportNo?`${d.passportNo} (exp: ${d.passportExpiry||'—'})`:undefined],
        ['Teaching License',d.teachingLicenseNo?`${d.teachingLicenseNo} — ${d.teachingLicenseCountry||''}`:undefined],
      ]}/>
      <RevSection title="Contact & Address" rows={[
        ['Personal Phone',d.personalPhone],['Personal Email',d.personalEmail],
        ['Work Email',d.workEmail],['WhatsApp',d.whatsApp],
        ['Current Address',[d.curStreet,d.curCity,d.curCountry].filter(Boolean).join(', ')],
        ['Emergency Contact',d.emergencyName?`${d.emergencyName} (${d.emergencyRelation}) — ${d.emergencyPhone}`:undefined],
      ]}/>
      <RevSection title="Employment Details" rows={[
        ['Designation',d.designation],['Department',d.department],['Campus',d.campus],
        ['Employment Type',d.employmentType],['ERP Role',d.erpRole],
        ['Date of Joining',d.dateOfJoining],['Contract Type',d.contractType],
      ]}/>
      {d.isTeacher && (
        <RevSection title="Teaching Profile" rows={[
          ['Subjects',d.subjectsCanTeach.join(', ')||undefined],
          ['Grade Levels',d.gradeLevels.join(', ')||undefined],
          ['Max Periods/Day',d.maxPeriodsPerDay],['Class Teacher',d.isClassTeacher?'Yes':undefined],
        ]}/>
      )}
      <RevSection title="Qualifications" rows={[
        ['Qualifications',d.qualifications.length>0?d.qualifications.map(q=>`${q.degree} in ${q.field} — ${q.institution}`).join('; '):undefined],
        ['Experience',d.experience.length>0?d.experience.map(e=>`${e.jobTitle} at ${e.employer}`).join('; '):undefined],
      ]}/>
      <RevSection title="Salary" rows={[
        ['Gross Salary',d.grossSalary?`${d.currency} ${Number(d.grossSalary).toLocaleString()}`:undefined],
        ['Payment Frequency',d.paymentFrequency],['Effective From',d.salaryEffectiveFrom],
        ['Bank Details',d.bankName?`${d.bankName} — ${d.accountTitle||'—'} (details hidden)`:undefined],
      ]}/>
      <RevSection title="Documents Uploaded" rows={
        UPLOAD_DOCS.map(doc=>[doc.label, d.uploadedDocs[doc.key]||undefined] as [string,string|undefined])
      }/>
      <div className="mt-5 p-4 border-2 border-[#0C447C] rounded-xl bg-[#0C447C]/5 space-y-3">
        {[
          ['confirmed1','I confirm all information provided is accurate and complete'],
          ['confirmed2','I have reviewed the employment terms and conditions'],
        ].map(([k,label])=>(
          <label key={k} className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={d[k as keyof StaffWD] as boolean}
              onChange={e=>setData(p=>({...p,[k]:e.target.checked} as StaffWD))}
              className="w-4 h-4 mt-0.5 accent-[#0C447C] shrink-0"/>
            <span className="text-sm font-semibold text-[#0C447C]">{label}</span>
          </label>
        ))}
        {(errors.confirmed1||errors.confirmed2) && <p className="text-xs text-red-500">Both confirmations are required to submit.</p>}
      </div>
    </div>
  )
}

// ─── WIZARD VALIDATION ─────────────────────────────────────────────────────────
function getStaffStepErrors(step:number, d:StaffWD):Record<string,string> {
  const e:Record<string,string> = {}
  if (step===1) {
    if (!d.firstName.trim()) e.firstName='Required'
    if (!d.lastName.trim())  e.lastName='Required'
    if (!d.dateOfBirth)      e.dateOfBirth='Required'
    if (!d.gender)           e.gender='Required'
    if (!d.nationality.trim()) e.nationality='Required'
  }
  if (step===3) {
    if (!d.personalPhone.trim()) e.personalPhone='Required'
    if (!d.personalEmail.trim()) e.personalEmail='Required'
    if (!d.emergencyName.trim()) e.emergencyName='Required'
    if (!d.emergencyRelation.trim()) e.emergencyRelation='Required'
    if (!d.emergencyPhone.trim()) e.emergencyPhone='Required'
  }
  if (step===4) {
    if (!d.designation.trim()) e.designation='Required'
    if (!d.department.trim())  e.department='Required'
    if (!d.campus.trim())      e.campus='Required'
    if (!d.employmentType)     e.employmentType='Required'
    if (!d.erpRole)            e.erpRole='Required'
    if (!d.dateOfJoining)      e.dateOfJoining='Required'
  }
  if (step===7) {
    if (!d.grossSalary) e.grossSalary='Required'
  }
  if (step===9) {
    if (!d.confirmed1) e.confirmed1='Required'
    if (!d.confirmed2) e.confirmed2='Required'
  }
  return e
}

// ─── BUILD PAYLOAD ─────────────────────────────────────────────────────────────
function buildStaffPayload(d:StaffWD) {
  const permAddr = d.sameAddress
    ? { street:d.curStreet, city:d.curCity, state:d.curState, country:d.curCountry, postalCode:d.curPostal }
    : { street:d.perStreet, city:d.perCity, state:d.perState, country:d.perCountry, postalCode:d.perPostal }
  return {
    firstName:d.firstName, lastName:d.lastName,
    email:d.workEmail||d.personalEmail||undefined,
    phone:d.personalPhone||undefined,
    department:d.department||undefined,
    employmentType:d.employmentType,
    dateOfJoining:d.dateOfJoining||undefined,
    designation:d.designation||undefined,
    campus:d.campus||undefined,
    erpRole:d.erpRole||undefined,
    status:'active',
    // gender/dateOfBirth are TOP-LEVEL fields on the Staff schema — the
    // `personal` sub-schema itself doesn't define either, so nesting them
    // there (as this used to) meant Mongoose silently dropped both on
    // every single employee ever added through this wizard.
    gender:d.gender||undefined,
    dateOfBirth:d.dateOfBirth||undefined,
    personal:{
      title:d.title||undefined, middleName:d.middleName||undefined, preferredName:d.preferredName||undefined,
      arabicName:d.arabicName||undefined,
      placeOfBirth:d.placeOfBirth||undefined,
      maritalStatus:d.maritalStatus||undefined, nationality:d.nationality||undefined,
      secondNationality:d.secondNationality||undefined, religion:d.religion||undefined,
      bloodGroup:d.bloodGroup||undefined, motherTongue:d.motherTongue||undefined,
      languagesSpoken:d.languagesSpoken||undefined,
    },
    identityDocs:{
      nationalId:d.nationalIdNo?{no:d.nationalIdNo,expiry:d.nationalIdExpiry||undefined}:undefined,
      passport:d.passportNo?{no:d.passportNo,expiry:d.passportExpiry||undefined}:undefined,
      teachingLicense:d.teachingLicenseNo?{no:d.teachingLicenseNo,expiry:d.teachingLicenseExpiry||undefined,authority:d.teachingLicenseAuthority||undefined,country:d.teachingLicenseCountry||undefined}:undefined,
    },
    contact:{
      altPhone:d.altPhone||undefined, workPhone:d.workPhone||undefined,
      whatsApp:d.whatsApp||undefined, workEmail:d.workEmail||undefined,
      preferredContact:d.preferredContact||undefined,
      currentAddress:{street:d.curStreet,city:d.curCity,state:d.curState,country:d.curCountry,postalCode:d.curPostal},
      permanentAddress:permAddr,
      emergency:d.emergencyName?{name:d.emergencyName,relation:d.emergencyRelation,phone:d.emergencyPhone,altPhone:d.emergencyAltPhone||undefined}:undefined,
    },
    employment:{
      reportingTo:d.reportingManager||undefined, probationEndDate:d.probationEndDate||undefined,
      contractType:d.contractType||undefined, contractEndDate:d.contractEndDate||undefined,
      workingHoursPerWeek:d.workingHours?Number(d.workingHours):40,
      noticePeriodDays:d.noticePeriod?Number(d.noticePeriod):30,
      createPortalAccount:d.createPortalAccount,
    },
    teacherProfile:d.isTeacher?{
      subjectsCanTeach:d.subjectsCanTeach, gradeLevelsCanTeach:d.gradeLevels,
      maxPeriodsPerDay:Number(d.maxPeriodsPerDay)||6, maxPeriodsPerWeek:Number(d.maxPeriodsPerWeek)||25,
      isClassTeacher:d.isClassTeacher, specializations:d.specializations||undefined,
      certifications:{cambridge:d.certCambridge,ib:d.certIB,google:d.certGoogle,microsoft:d.certMicrosoft,sen:d.certSEN,ece:d.certECE},
    }:undefined,
    qualifications:d.qualifications.filter(q=>q.degree&&q.institution),
    certifications:d.certifications.filter(c=>c.name),
    experience:d.experience.filter(e=>e.employer&&e.jobTitle),
    references:[
      d.ref1Name?{name:d.ref1Name,title:d.ref1Title,organization:d.ref1Org,phone:d.ref1Phone,email:d.ref1Email}:null,
      d.ref2Name?{name:d.ref2Name,title:d.ref2Title,organization:d.ref2Org,phone:d.ref2Phone,email:d.ref2Email}:null,
    ].filter(Boolean),
    salary:d.grossSalary?Number(d.grossSalary):undefined,
    salaryCurrency:d.currency||undefined,
    bankDetails:(d.bankName||d.accountNumber)?{
      bankName:d.bankName, accountTitle:d.accountTitle, accountNo:d.accountNumber,
      iban:d.iban, branchCode:d.branchCode, branchName:d.branchName,
      currency:d.accountCurrency, isVerified:d.bankVerified,
    }:undefined,
  }
}

// ─── MAIN WIZARD COMPONENT ─────────────────────────────────────────────────────
function StaffEnrollmentWizard({ onClose, onSuccess }:{ onClose:()=>void; onSuccess?:()=>void }) {
  const queryClient = useQueryClient()
  const [step, setStep] = useState(1)
  const [errors, setErrors] = useState<Record<string,string>>({})
  const [data, setData] = useState<StaffWD>(()=>{
    try { const s=localStorage.getItem(HR_DRAFT_KEY); if(s) return JSON.parse(s) as StaffWD } catch {}
    return {...STAFF_EMPTY}
  })

  const submitMutation = useMutation({
    mutationFn:(d:StaffWD)=>hrService.createStaff(buildStaffPayload(d)),
    onSuccess:(res:any)=>{
      queryClient.invalidateQueries({queryKey:['staff']})
      localStorage.removeItem(HR_DRAFT_KEY)
      toast.success(`Staff member added — ID: ${res.employeeId || 'generated'}`)
      onClose()
      onSuccess?.()
    },
    onError:(err:any)=>toast.error(err.response?.data?.message||'Failed to add staff'),
  })

  const next = ()=>{ const e=getStaffStepErrors(step,data); if(Object.keys(e).length){setErrors(e);return}; setErrors({}); setStep(s=>Math.min(s+1,9)) }
  const back = ()=>{ setErrors({}); setStep(s=>Math.max(s-1,1)) }
  const submit = ()=>{ const e=getStaffStepErrors(9,data); if(Object.keys(e).length){setErrors(e);return}; submitMutation.mutate(data) }
  const saveDraft = ()=>{ localStorage.setItem(HR_DRAFT_KEY,JSON.stringify(data)); toast.success('Draft saved') }

  const sp:SProp = { data, setData, errors }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden" style={{width:'90vw',height:'90vh',maxWidth:'1300px'}}>
        {/* Header */}
        <div className="bg-[#0C447C] px-6 py-4 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-white font-bold text-base">Staff Enrollment Wizard</h2>
              <p className="text-blue-200 text-xs mt-0.5">Step {step} of 9 — {HR_STEP_LABELS[step-1]}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={saveDraft} className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-white/30 text-white rounded-lg hover:bg-white/10 font-medium">Save Draft</button>
              <button onClick={onClose} className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg"><X size={18}/></button>
            </div>
          </div>
          <HRStepIndicator step={step}/>
        </div>
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-white">
          {step===1 && <S1Personal {...sp}/>}
          {step===2 && <S2Documents {...sp}/>}
          {step===3 && <S3Contact {...sp}/>}
          {step===4 && <S4Employment {...sp}/>}
          {step===5 && <S5Teaching {...sp}/>}
          {step===6 && <S6Qualifications {...sp}/>}
          {step===7 && <S7Salary {...sp}/>}
          {step===8 && <S8Uploads {...sp}/>}
          {step===9 && <S9Review {...sp}/>}
        </div>
        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between shrink-0 bg-slate-50 rounded-b-2xl">
          <p className="text-xs text-slate-400">{step<9?'Complete required (*) fields to proceed':'Review all information and confirm to submit'}</p>
          <div className="flex gap-3">
            {step>1 && <button onClick={back} className="flex items-center gap-1.5 px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-600 font-medium"><ChevronLeft size={14}/>Back</button>}
            {step<9
              ? <button onClick={next} className="flex items-center gap-1.5 px-5 py-2 text-sm bg-[#0C447C] text-white rounded-lg hover:bg-[#0b3d6e] font-medium">Next<ChevronRight size={14}/></button>
              : <button onClick={submit} disabled={!data.confirmed1||!data.confirmed2||submitMutation.isPending}
                  className="flex items-center gap-1.5 px-5 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                  <Check size={14}/>{submitMutation.isPending?'Enrolling…':'Submit Enrollment'}
                </button>
            }
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── BULK IMPORT MODAL ────────────────────────────────────────────────────────
const CSV_TEMPLATE_HEADERS = ['firstName','lastName','email','phone','gender','dateOfBirth','nationality','designation','department','campus','employmentType','joiningDate','grossSalary','erpRole']
const CSV_COL_DESCRIPTIONS: Record<string,string> = {
  firstName:'Required', lastName:'Required', email:'Work email address', phone:'Phone with country code',
  gender:'male or female (lowercase)', dateOfBirth:'YYYY-MM-DD format', nationality:'e.g. Pakistani',
  designation:'Job title e.g. Math Teacher', department:'e.g. Teaching, Admin',
  employmentType:'full_time | part_time | contract | visiting | intern | substitute | volunteer',
  joiningDate:'YYYY-MM-DD format', grossSalary:'Number only e.g. 85000',
  erpRole:'teacher | admin | principal | vice_principal | hr_manager | finance_manager | support_staff',
}

interface ImportRow { [key:string]:string }

function CreateLoginsModal({ staffWithoutLogin, onClose }: { staffWithoutLogin: any[]; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [selected, setSelected] = useState<Set<string>>(new Set(staffWithoutLogin.map(s => s._id)))
  const [running, setRunning] = useState(false)
  const [results, setResults] = useState<{ created: any[]; skipped: any[]; emailsSent?: number; emailsFailed?: number } | null>(null)

  const toggle = (id: string) => setSelected(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  const run = async () => {
    setRunning(true)
    try {
      const res = await hrService.bulkCreateLogins(Array.from(selected))
      setResults(res)
      queryClient.invalidateQueries({ queryKey: ['staff'] })
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to create login accounts — please try again')
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col" style={{ maxHeight: '85vh' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-[#0C447C] rounded-t-2xl shrink-0">
          <div>
            <h2 className="font-bold text-white text-sm">Create Login Accounts</h2>
            <p className="text-blue-200 text-xs mt-0.5">Only staff with a login can be assigned a role under Roles & Permissions</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {results ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Created <strong>{results.created.length}</strong> account{results.created.length !== 1 ? 's' : ''}
                {results.skipped.length > 0 ? `, ${results.skipped.length} skipped` : ''}.
                {results.created.length > 0 && (
                  <> {results.emailsSent ?? 0} welcome email{(results.emailsSent ?? 0) === 1 ? '' : 's'} sent{(results.emailsFailed ?? 0) > 0 ? `, ${results.emailsFailed} failed — share those passwords directly` : ''}.</>
                )}
              </p>
              {results.created.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-2">New Accounts — share these temporary passwords once, each person should change it on first login</p>
                  <div className="space-y-1.5 max-h-56 overflow-y-auto">
                    {results.created.map((c: any, i: number) => (
                      <div key={i} className="flex items-center justify-between bg-emerald-50 rounded-lg px-3 py-2 text-xs">
                        <div>
                          <p className="font-medium text-slate-700">{c.name}</p>
                          <p className="text-slate-400">{c.email}</p>
                          <p className={c.emailSent ? 'text-emerald-600' : 'text-red-500'}>{c.emailSent ? '✓ Email sent' : `✗ Email failed${c.emailError ? ` (${c.emailError})` : ''}`}</p>
                        </div>
                        <code className="bg-white border border-emerald-200 rounded px-2 py-1 text-emerald-700 font-mono">{c.tempPassword}</code>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {results.skipped.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Skipped</p>
                  <div className="space-y-1">
                    {results.skipped.map((s: any, i: number) => (
                      <p key={i} className="text-xs text-slate-500">{s.name}: <span className="text-red-500">{s.reason}</span></p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <p className="text-xs text-slate-500 mb-3">Select which staff should get a login account. Each gets a temporary password to share once.</p>
              <div className="space-y-1.5 max-h-72 overflow-y-auto border border-slate-100 rounded-xl p-2">
                {staffWithoutLogin.map(s => (
                  <label key={s._id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <input type="checkbox" checked={selected.has(s._id)} onChange={() => toggle(s._id)} className="w-3.5 h-3.5 accent-[#0C447C]" />
                    <div className="text-xs">
                      <span className="font-medium text-slate-700">{s.firstName} {s.lastName}</span>
                      <span className="text-slate-400"> — {s.email} · {s.erpRole || 'no role set'}</span>
                    </div>
                  </label>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="px-5 py-4 border-t border-slate-100 flex justify-end gap-2 shrink-0 bg-slate-50 rounded-b-2xl">
          <Btn onClick={onClose}>{results ? 'Close' : 'Cancel'}</Btn>
          {!results && (
            <button onClick={run} disabled={running || selected.size === 0}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs bg-[#0C447C] text-white rounded-lg hover:bg-[#0b3d6e] font-medium disabled:opacity-50">
              {running ? 'Creating…' : <><KeyRound size={13} /> Create {selected.size} Login{selected.size !== 1 ? 's' : ''}</>}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function BulkImportModal({ onClose }:{ onClose:()=>void }) {
  const queryClient = useQueryClient()
  const { data: existingStaff = [] } = useQuery({ queryKey: ['staff'], queryFn: hrService.getStaff })
  const [importStep, setImportStep] = useState<1|2|3>(1)
  const [rows, setRows]    = useState<ImportRow[]>([])
  const [errors, setErrors] = useState<Record<number,string[]>>({})
  const [imported, setImported] = useState(0)
  const [importFailures, setImportFailures] = useState<string[]>([])
  const [skippedDuplicateCount, setSkippedDuplicateCount] = useState(0)
  const [importing, setImporting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function csvEscape(field: string): string {
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`
    }
    return field
  }

  function downloadTemplate() {
    const guidance: Record<string,string> = {
      firstName: '# REQUIRED', lastName: '# REQUIRED', email: '# REQUIRED — work email',
      phone: 'optional, with country code', gender: '# REQUIRED — male or female (lowercase)',
      dateOfBirth: 'YYYY-MM-DD', nationality: 'e.g. Pakistani',
      designation: 'e.g. Math Teacher', department: 'e.g. Teaching, Admin',
      campus: 'e.g. Main Campus, Gulberg — leave blank if single-campus school',
      employmentType: 'full_time, part_time, contract, visiting, intern, substitute, or volunteer',
      joiningDate: 'YYYY-MM-DD', grossSalary: 'number only, e.g. 85000',
      erpRole: 'teacher, admin, principal, vice_principal, hr_manager, finance_manager, or support_staff',
    }
    const example: Record<string,string> = {
      firstName: 'SAMPLE', lastName: 'DELETE-THIS-ROW', email: 'sample.delete@example.com',
      phone: '03001234567', gender: 'male', dateOfBirth: '1990-05-12', nationality: 'Pakistani',
      designation: 'Math Teacher', department: 'Teaching', campus: 'Main Campus', employmentType: 'full_time',
      joiningDate: '2026-01-15', grossSalary: '85000', erpRole: 'teacher',
    }
    const rows = [
      CSV_TEMPLATE_HEADERS,
      CSV_TEMPLATE_HEADERS.map(h => guidance[h] || ''),
      CSV_TEMPLATE_HEADERS.map(h => example[h] || ''),
    ]
    const csv = rows.map(r => r.map(csvEscape).join(',')).join('\n') + '\n'
    const blob = new Blob([csv], {type:'text/csv'})
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href=url; a.download='staff_import_template.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  function handleFile(file:File) {
    Papa.parse<ImportRow>(file, {
      header:true, skipEmptyLines:true,
      complete:(result)=>{
        // Skip the template's own guidance row ('#'-prefixed) and the
        // obviously-a-placeholder sample row, in case the user forgets to
        // delete either before uploading their real data.
        const parsed = result.data.filter(row => {
          const first = (row.firstName || '').trim()
          return !first.startsWith('#') && first.toUpperCase() !== 'SAMPLE'
        })
        const errs:Record<number,string[]> = {}
        parsed.forEach((row,i)=>{
          const rowErrs:string[] = []
          if (!row.firstName?.trim()) rowErrs.push('First name missing')
          if (!row.lastName?.trim())  rowErrs.push('Last name missing')
          if (!row.email?.trim())     rowErrs.push('Email missing')
          if (row.dateOfBirth && !/^\d{4}-\d{2}-\d{2}$/.test(row.dateOfBirth)) rowErrs.push('Invalid date format (use YYYY-MM-DD)')
          if (row.grossSalary && isNaN(Number(row.grossSalary))) rowErrs.push('Salary must be a number')
          if (rowErrs.length) errs[i]=rowErrs
        })
        setRows(parsed); setErrors(errs); setImportStep(2)
      },
      error:()=>toast.error('Failed to parse CSV file'),
    })
  }

  async function handleImport() {
    const validRows = rows.filter((_,i)=>!errors[i])
    if (!validRows.length) { toast.error('No valid rows to import'); return }
    setImporting(true); setImported(0)
    const failures: string[] = []
    // Staff.email has no unique constraint at all — re-importing the same
    // file (or overlapping data) would otherwise silently create duplicate
    // employee records with zero warning.
    const existingEmails = new Set((existingStaff as any[]).map(s => (s.email || '').toLowerCase().trim()).filter(Boolean))
    let skippedDuplicates = 0
    for (const row of validRows) {
      const emailLc = (row.email || '').toLowerCase().trim()
      if (emailLc && existingEmails.has(emailLc)) {
        skippedDuplicates++
        continue
      }
      try {
        await hrService.createStaff({
          firstName:row.firstName, lastName:row.lastName, email:row.email||undefined,
          phone:row.phone||undefined, department:row.department||undefined, campus:row.campus||undefined,
          employmentType:(row.employmentType||'full_time').toLowerCase().trim(),
          dateOfJoining:row.joiningDate||undefined,
          designation:row.designation||undefined, erpRole:row.erpRole||undefined, status:'active',
          // gender/dateOfBirth are TOP-LEVEL fields on the Staff schema, not
          // nested under `personal` (personal's own sub-schema only covers
          // nationality/religion/etc.) — nesting them here meant Mongoose
          // silently dropped both on every import, same bug class as the
          // one fixed in the Student Edit Profile form.
          gender: row.gender ? row.gender.toLowerCase().trim() : undefined,
          dateOfBirth: row.dateOfBirth || undefined,
          personal:{ nationality:row.nationality||undefined },
          salary:row.grossSalary?Number(row.grossSalary):undefined,
        })
        if (emailLc) existingEmails.add(emailLc)
        setImported(n=>n+1)
      } catch (err: any) {
        failures.push(`${row.firstName || ''} ${row.lastName || ''}`.trim() + ': ' + (err?.response?.data?.message || 'failed to save'))
      }
    }
    setImporting(false)
    setImportFailures(failures)
    setSkippedDuplicateCount(skippedDuplicates)
    queryClient.invalidateQueries({queryKey:['staff']})
    setImportStep(3)
  }

  const validCount = rows.filter((_,i)=>!errors[i]).length
  const errorCount = Object.keys(errors).length

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col" style={{maxHeight:'85vh'}}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-[#0C447C] rounded-t-2xl shrink-0">
          <div>
            <h2 className="font-bold text-white text-sm">Bulk Staff Import</h2>
            <p className="text-blue-200 text-xs mt-0.5">Step {importStep} of 3</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg"><X size={18}/></button>
        </div>
        {/* Steps indicator */}
        <div className="flex border-b border-slate-100 shrink-0">
          {[['1','Download Template'],['2','Upload & Preview'],['3','Review & Import']].map(([n,label])=>(
            <div key={n} className={`flex-1 py-3 text-center text-xs font-semibold ${Number(n)===importStep?'text-[#0C447C] border-b-2 border-[#0C447C]':'text-slate-400'}`}>
              {n}. {label}
            </div>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {/* Step 1: Download Template */}
          {importStep===1 && (
            <div>
              <p className="text-sm text-slate-600 mb-4">Download the CSV template, fill in your staff data, then upload it in Step 2.</p>
              <button onClick={downloadTemplate}
                className="flex items-center gap-2 px-4 py-3 bg-[#0C447C] text-white rounded-xl hover:bg-[#0b3d6e] font-medium text-sm mb-5">
                <Upload size={16}/>Download Staff Import Template (CSV)
              </button>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-4 py-2 border-b border-slate-200"><p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Column Reference</p></div>
                <div className="divide-y divide-slate-100">
                  {CSV_TEMPLATE_HEADERS.map(h=>(
                    <div key={h} className="flex items-center gap-4 px-4 py-2.5">
                      <code className="text-xs font-mono text-[#0C447C] w-36 shrink-0">{h}</code>
                      <p className="text-xs text-slate-500">{CSV_COL_DESCRIPTIONS[h]}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-5">
                <p className="text-sm font-semibold text-slate-700 mb-2">Or upload your file now:</p>
                <label className="flex flex-col items-center gap-2 p-8 border-2 border-dashed border-slate-300 rounded-xl hover:border-[#0C447C] transition-colors cursor-pointer">
                  <Upload size={24} className="text-slate-400"/>
                  <span className="text-sm text-slate-500">Click to upload CSV or Excel file</span>
                  <span className="text-xs text-slate-400">CSV, .xlsx supported</span>
                  <input ref={fileRef} type="file" className="sr-only" accept=".csv,.xlsx"
                    onChange={e=>{ if(e.target.files?.[0]) handleFile(e.target.files[0]) }}/>
                </label>
              </div>
            </div>
          )}
          {/* Step 2: Preview */}
          {importStep===2 && (
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2 text-center">
                  <p className="text-xl font-bold text-emerald-600">{validCount}</p>
                  <p className="text-xs text-emerald-500">Valid rows</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-center">
                  <p className="text-xl font-bold text-red-600">{errorCount}</p>
                  <p className="text-xs text-red-500">Rows with errors</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-center">
                  <p className="text-xl font-bold text-slate-700">{rows.length}</p>
                  <p className="text-xs text-slate-400">Total rows</p>
                </div>
              </div>
              {errorCount>0 && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm font-semibold text-red-700 mb-2">Rows with errors:</p>
                  {Object.entries(errors).map(([rowIdx,errs])=>(
                    <div key={rowIdx} className="text-xs text-red-600 mb-1">
                      Row {Number(rowIdx)+2}: {errs.join('; ')}
                    </div>
                  ))}
                </div>
              )}
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-3 py-2 text-left text-slate-500 font-semibold">#</th>
                      {CSV_TEMPLATE_HEADERS.slice(0,6).map(h=><th key={h} className="px-3 py-2 text-left text-slate-500 font-semibold">{h}</th>)}
                      <th className="px-3 py-2 text-left text-slate-500 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0,10).map((row,i)=>(
                      <tr key={i} className={`border-b border-slate-100 ${errors[i]?'bg-red-50':''}`}>
                        <td className="px-3 py-2 text-slate-400">{i+1}</td>
                        {CSV_TEMPLATE_HEADERS.slice(0,6).map(h=><td key={h} className="px-3 py-2 text-slate-700">{row[h]||'—'}</td>)}
                        <td className="px-3 py-2">
                          {errors[i]
                            ? <span className="text-red-500 font-semibold">✗ Error</span>
                            : <span className="text-emerald-500 font-semibold">✓ Valid</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rows.length>10 && <p className="px-3 py-2 text-xs text-slate-400 bg-slate-50">… and {rows.length-10} more rows</p>}
              </div>
            </div>
          )}
          {/* Step 3: Result */}
          {importStep===3 && (
            <div className="py-4">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check size={32} className="text-emerald-600"/>
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">Import Complete</h3>
                <p className="text-slate-500">{imported} staff member{imported!==1?'s':''} imported successfully{errorCount>0?`, ${errorCount} row${errorCount!==1?'s':''} skipped (validation)`:''}{skippedDuplicateCount>0?`, ${skippedDuplicateCount} skipped (email already exists)`:''}{importFailures.length>0?`, ${importFailures.length} failed to save`:''}</p>
              </div>
              {importFailures.length>0 && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-left max-h-40 overflow-y-auto">
                  <p className="text-sm font-semibold text-red-700 mb-2">These rows failed to save — nothing was silently skipped:</p>
                  {importFailures.map((f,i)=>(
                    <div key={i} className="text-xs text-red-600 mb-1">{f}</div>
                  ))}
                </div>
              )}
              <div className="text-center"><Btn variant="primary" onClick={onClose}>Close</Btn></div>
            </div>
          )}
        </div>
        {/* Footer */}
        {importStep!==3 && (
          <div className="px-5 py-4 border-t border-slate-100 flex justify-between shrink-0 bg-slate-50 rounded-b-2xl">
            <div>
              {importStep===2 && (
                <label className="flex items-center gap-2 text-xs text-[#0C447C] cursor-pointer font-medium hover:underline">
                  <Upload size={13}/>Upload different file
                  <input type="file" className="sr-only" accept=".csv,.xlsx"
                    onChange={e=>{ if(e.target.files?.[0]) handleFile(e.target.files[0]) }}/>
                </label>
              )}
            </div>
            <div className="flex gap-2">
              <Btn onClick={onClose}>Cancel</Btn>
              {importStep===1 && <Btn variant="primary" onClick={()=>fileRef.current?.click()}>Upload File</Btn>}
              {importStep===2 && (
                <button onClick={handleImport} disabled={validCount===0||importing}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs bg-[#0C447C] text-white rounded-lg hover:bg-[#0b3d6e] font-medium disabled:opacity-50">
                  {importing?`Importing… ${imported}/${validCount}`:`Import ${validCount} Staff Members`}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── EMPLOYEES TAB ────────────────────────────────────────────────────────────
function EmployeesTab() {
  const navigate   = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch]       = useState("");
  const [campusFilter, setCampusFilter] = useState("All Campuses");
  const [deptFilter, setDeptFilter] = useState("All Departments");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showWizard, setShowWizard] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showCreateLogins, setShowCreateLogins] = useState(false);
  const [showLoginFor, setShowLoginFor] = useState<any>(null);

  const { data: staff = [], isLoading } = useQuery({ queryKey: ["staff"], queryFn: hrService.getStaff });
  const { data: realCampuses = [] } = useQuery({ queryKey: ["campuses"], queryFn: organizationService.getCampuses });
  const staffWithoutLogin = (staff as any[]).filter(e => !e.userId && e.email);

  // Was previously derived from whatever campus values happened to
  // already be set on existing staff records - meaning the filter only
  // ever showed as many options as staff who'd been assigned a campus
  // so far, not the school's real campus list. With adoption still low
  // right after this feature shipped, that showed just one stray value.
  const campusOptions = (realCampuses as any[]).map((c: any) => c.name).sort();
  const deptOptions = Array.from(new Set((staff as any[]).map(e => e.department).filter(Boolean))).sort();
  const statusOptions = Array.from(new Set((staff as any[]).map(e => e.status).filter(Boolean))).sort();

  const filtered = (staff as any[]).filter((e) => {
    const name = `${e.firstName} ${e.lastName}`.toLowerCase();
    const matchesSearch = name.includes(search.toLowerCase())
      || (e.employeeId || "").toLowerCase().includes(search.toLowerCase())
      || (e.email || "").toLowerCase().includes(search.toLowerCase());
    const matchesCampus = campusFilter === "All Campuses" || (e.campusId?.name || e.campus) === campusFilter;
    const matchesDept = deptFilter === "All Departments" || e.department === deptFilter;
    const matchesStatus = statusFilter === "All Status" || e.status === statusFilter;
    return matchesSearch && matchesCampus && matchesDept && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function resetFiltersAndPage(setter: () => void) {
    setter();
    setPage(1);
  }

  function toggleRow(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  function toggleSelectAllOnPage() {
    const pageIds = pageRows.map(e => e._id);
    const allSelected = pageIds.every(id => selected.has(id));
    setSelected(prev => {
      const next = new Set(prev);
      pageIds.forEach(id => allSelected ? next.delete(id) : next.add(id));
      return next;
    });
  }

  function exportCSV(rows: any[], filename: string) {
    const headers = ["Employee ID", "First Name", "Last Name", "Email", "Designation", "Campus", "Department", "Join Date", "Status", "Gross Salary"];
    const csvRows = rows.map(e => [
      e.employeeId || "", e.firstName || "", e.lastName || "", e.email || "",
      e.designationId?.name || e.designation || "", e.campusId?.name || e.campus || "",
      e.department || "", e.dateOfJoining ? new Date(e.dateOfJoining).toLocaleDateString() : "",
      e.status || "", e.salary?.gross ?? e.salary ?? "",
    ]);
    const csv = [headers, ...csvRows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} employee${rows.length !== 1 ? "s" : ""}`);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-[#0C447C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Employee Directory</h1>
          <p className="text-sm text-slate-500 mt-0.5">{staff.length} total employees across all campuses</p>
        </div>
        <div className="flex gap-2">
          <Btn onClick={() => exportCSV(filtered, "employee-directory.csv")}>Export</Btn>
          {staffWithoutLogin.length > 0 && (
            <button onClick={()=>setShowCreateLogins(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-amber-200 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 font-medium transition-colors">
              <KeyRound size={13}/>Create Login Accounts ({staffWithoutLogin.length})
            </button>
          )}
          <button onClick={()=>setShowImport(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-slate-200 bg-white text-slate-600 rounded-lg hover:bg-slate-50 font-medium transition-colors">
            <Upload size={13}/>Bulk Import
          </button>
          <button onClick={()=>setShowWizard(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#0C447C] text-white rounded-lg hover:bg-[#0b3d6e] font-medium transition-colors">
            <Plus size={13}/>Add Employee
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        <input
          className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C] min-w-[220px]"
          placeholder="Search by name, ID, email…"
          value={search}
          onChange={(e) => resetFiltersAndPage(() => setSearch(e.target.value))}
        />
        <select value={campusFilter} onChange={(e) => resetFiltersAndPage(() => setCampusFilter(e.target.value))}
          className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none">
          <option>All Campuses</option>
          {campusOptions.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={deptFilter} onChange={(e) => resetFiltersAndPage(() => setDeptFilter(e.target.value))}
          className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none">
          <option>All Departments</option>
          {deptOptions.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => resetFiltersAndPage(() => setStatusFilter(e.target.value))}
          className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none">
          <option>All Status</option>
          {statusOptions.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
        </select>
      </div>

      {selected.size > 0 && (
        <div className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-lg px-4 py-2 mb-3">
          <span className="text-xs font-medium text-[#0C447C]">{selected.size} selected</span>
          <div className="flex gap-2">
            <button
              onClick={() => exportCSV((staff as any[]).filter(e => selected.has(e._id)), "selected-employees.csv")}
              className="text-xs px-3 py-1 bg-white border border-blue-200 rounded-lg text-[#0C447C] hover:bg-blue-100 font-medium"
            >Export Selected</button>
            <button onClick={() => setSelected(new Set())} className="text-xs px-3 py-1 text-slate-500 hover:text-slate-700 font-medium">Clear</button>
          </div>
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-4 py-2.5 text-left">
                  <input type="checkbox"
                    checked={pageRows.length > 0 && pageRows.every(e => selected.has(e._id))}
                    onChange={toggleSelectAllOnPage} />
                </th>
                {["Employee", "ID", "Designation", "Campus", "Department", "Join Date", "Status", "Salary", "Actions"].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((e: any) => (
                <tr key={e._id} className="border-b border-slate-50 hover:bg-slate-50">
                  <Td><input type="checkbox" checked={selected.has(e._id)} onChange={() => toggleRow(e._id)} /></Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <Avatar initials={staffInitials(e.firstName, e.lastName)} bg={avatarColor(e._id)} src={e.avatarUrl} />
                      <div>
                        <div className="font-medium">{e.firstName} {e.lastName}</div>
                        <div className="text-xs text-slate-400">{e.email || "No email on file"}</div>
                      </div>
                    </div>
                  </Td>
                  <Td className="text-slate-400">{e.employeeId}</Td>
                  <Td>{e.designationId?.name || e.designation || "—"}</Td>
                  <Td>{e.campusId?.name || e.campus || "—"}</Td>
                  <Td>{e.department || "—"}</Td>
                  <Td>{e.dateOfJoining ? new Date(e.dateOfJoining).toLocaleDateString() : "—"}</Td>
                  <Td><Badge v={API_STATUS_V[e.status] ?? "gray"}>{e.status}</Badge></Td>
                  <Td>{e.salary?.gross ? `PKR ${Number(e.salary.gross).toLocaleString()}` : e.salary ? `PKR ${e.salary.toLocaleString()}` : "—"}</Td>
                  <Td>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => navigate(`/hr/staff/${e._id}`)}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs border border-[#0C447C] text-[#0C447C] rounded-lg hover:bg-[#0C447C] hover:text-white font-medium transition-colors whitespace-nowrap">
                        View Profile
                      </button>
                      <button onClick={() => setShowLoginFor(e)} title="Create or reset login - useful when the welcome email didn't reach them"
                        className="flex items-center justify-center w-8 h-8 border border-slate-200 text-slate-500 rounded-lg hover:bg-slate-100 transition-colors shrink-0">
                        <KeyRound size={13}/>
                      </button>
                    </div>
                  </Td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-sm text-slate-400">
                    {(staff as any[]).length === 0
                      ? "No staff members yet. Click + Add Employee to get started."
                      : "No results match your search."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
          <span className="text-xs text-slate-500">
            {filtered.length === 0 ? "0 employees" : `Showing ${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, filtered.length)} of ${filtered.length} employees`}
          </span>
          <div className="flex gap-1 items-center">
            <Btn onClick={() => setPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Prev</Btn>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
              .map((p, i, arr) => (
                <span key={p} className="flex items-center">
                  {i > 0 && arr[i - 1] !== p - 1 && <span className="px-1 text-xs text-slate-300">…</span>}
                  <button onClick={() => setPage(p)}
                    className={`w-8 h-7 text-xs rounded-lg font-medium ${p === currentPage ? "bg-[#0C447C] text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                    {p}
                  </button>
                </span>
              ))}
            <Btn onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</Btn>
          </div>
        </div>
      </Card>

      {showWizard && <StaffEnrollmentWizard onClose={()=>setShowWizard(false)} onSuccess={()=>{ queryClient.invalidateQueries({queryKey:['staff']}); setShowWizard(false); }}/>}
      {showImport && <BulkImportModal onClose={()=>setShowImport(false)}/>}
      {showCreateLogins && <CreateLoginsModal staffWithoutLogin={staffWithoutLogin} onClose={()=>setShowCreateLogins(false)}/>}
      {showLoginFor && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div>
                <h2 className="font-bold text-slate-800 text-sm">Portal Login — {showLoginFor.firstName} {showLoginFor.lastName}</h2>
                <p className="text-xs text-slate-400 mt-0.5">Available for every employee, in case the welcome email never reached them</p>
              </div>
              <button onClick={() => setShowLoginFor(null)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"><X size={18}/></button>
            </div>
            <div className="p-5">
              <ErpAccessAction staff={showLoginFor} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── LIFECYCLE HELPERS ────────────────────────────────────────────────────────
const LC_STAGE_COLOR: Record<string, string> = {
  candidate:  "bg-slate-100",
  interview:  "bg-blue-50 border border-blue-100",
  selected:   "bg-purple-50 border border-purple-100",
  offered:    "bg-amber-50 border border-amber-100",
  onboarding: "bg-emerald-50 border border-emerald-200",
  active:     "bg-sky-50 border border-sky-200",
  exit:       "bg-red-50 border border-red-100",
  rejected:   "bg-slate-100",
  withdrawn:  "bg-slate-100",
};
const LC_BADGE: Record<string, BadgeVariant> = {
  candidate: "gray", interview: "blue", selected: "purple",
  offered: "amber", onboarding: "green", active: "blue", exit: "red",
  rejected: "red", withdrawn: "gray",
};
const LC_COLUMNS = ["candidate","interview","selected","offered","onboarding","active","exit"] as const;
const LC_LABEL: Record<string, string> = {
  candidate:"Candidate", interview:"Interview", selected:"Selected",
  offered:"Offered", onboarding:"Onboarding", active:"Active Employees", exit:"Exit",
};
const CATEGORY_ICON: Record<string, string> = {
  documents:"📄", access:"💻", training:"🎓", introduction:"🤝", equipment:"🔧",
};

function lcInitials(c: any) {
  return `${c.firstName?.[0]??''}${c.lastName?.[0]??''}`.toUpperCase();
}

// ─── SHARED FORM PRIMITIVES (top-level to avoid remount on every render) ──────
function LcInput({ label, k, form, setForm, type = 'text', span }: {
  label: string; k: string; form: any; setForm: (u: (p: any) => any) => void; type?: string; span?: number;
}) {
  return (
    <div style={span ? { gridColumn: `span ${span}` } : undefined}>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      <input type={type} value={form[k] ?? ''} onChange={e => { const v = e.target.value; setForm(p => ({ ...p, [k]: v })); }}
        className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0C447C]/20 focus:border-[#0C447C]" />
    </div>
  );
}
function LcSelect({ label, k, form, setForm, opts }: {
  label: string; k: string; form: any; setForm: (u: (p: any) => any) => void; opts: [string, string][];
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      <select value={form[k] ?? ''} onChange={e => { const v = e.target.value; setForm(p => ({ ...p, [k]: v })); }}
        className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0C447C]/20 focus:border-[#0C447C]">
        {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );
}

// ─── ADD CANDIDATE MODAL ──────────────────────────────────────────────────────
function AddCandidateModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<Record<string,any>>({
    firstName:'', lastName:'', email:'', phone:'',
    positionTitle:'', department:'', employmentType:'full_time',
    expectedSalary:'', currency:'PKR',
    source:'', referredBy:'', yearsOfExperience:'',
    highestQualification:'', currentEmployer:'', noticePeriodDays:'',
    availability:'', notes:'',
  });
  const mut = useMutation({
    mutationFn: (d: any) => hrService.createCandidate(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lifecycle'] });
      qc.invalidateQueries({ queryKey: ['lifecycle-stats'] });
      toast.success('Candidate added to pipeline');
      onSaved();
    },
    onError: () => toast.error('Failed to add candidate'),
  });
  const submit = () => {
    if (!form.firstName || !form.lastName || !form.positionTitle) {
      toast.error('First name, last name and position are required'); return;
    }
    mut.mutate({ ...form, expectedSalary: form.expectedSalary ? Number(form.expectedSalary) : undefined,
      yearsOfExperience: form.yearsOfExperience ? Number(form.yearsOfExperience) : undefined,
      noticePeriodDays: form.noticePeriodDays ? Number(form.noticePeriodDays) : undefined });
  };
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="font-semibold text-slate-800">Add Candidate to Pipeline</div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-6">
          <div className="grid grid-cols-2 gap-3">
            <LcInput label="First Name *" k="firstName" form={form} setForm={setForm} />
            <LcInput label="Last Name *" k="lastName" form={form} setForm={setForm} />
            <LcInput label="Email" k="email" type="email" form={form} setForm={setForm} />
            <LcInput label="Phone" k="phone" form={form} setForm={setForm} />
            <LcInput label="Position Title *" k="positionTitle" form={form} setForm={setForm} />
            <LcInput label="Department" k="department" form={form} setForm={setForm} />
            <LcSelect label="Employment Type" k="employmentType" form={form} setForm={setForm} opts={[['full_time','Full Time'],['part_time','Part Time'],['contract','Contract'],['visiting','Visiting']]} />
            <LcInput label="Expected Salary" k="expectedSalary" type="number" form={form} setForm={setForm} />
            <LcSelect label="Currency" k="currency" form={form} setForm={setForm} opts={[['PKR','PKR'],['USD','USD'],['AED','AED']]} />
            <LcSelect label="Source" k="source" form={form} setForm={setForm} opts={[['','Select source'],['linkedin','LinkedIn'],['referral','Referral'],['walk_in','Walk-in'],['website','Website'],['agency','Agency'],['other','Other']]} />
            <LcInput label="Referred By" k="referredBy" form={form} setForm={setForm} />
            <LcInput label="Years of Experience" k="yearsOfExperience" type="number" form={form} setForm={setForm} />
            <LcInput label="Highest Qualification" k="highestQualification" form={form} setForm={setForm} />
            <LcInput label="Current Employer" k="currentEmployer" form={form} setForm={setForm} />
            <LcInput label="Notice Period (days)" k="noticePeriodDays" type="number" form={form} setForm={setForm} />
            <LcSelect label="Availability" k="availability" form={form} setForm={setForm} opts={[['','Select'],['Immediate','Immediate'],['2 weeks','2 weeks'],['1 month','1 month'],['other','Other']]} />
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
              <textarea value={form.notes} onChange={e => { const v = e.target.value; setForm(p => ({ ...p, notes: v })); }} rows={3}
                className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0C447C]/20 focus:border-[#0C447C]" />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100">
          <Btn onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" onClick={submit}>{mut.isPending ? 'Saving…' : 'Add to Pipeline'}</Btn>
        </div>
      </div>
    </div>
  );
}

// ─── STAGE MOVE PANEL ─────────────────────────────────────────────────────────
function StageMovePanel({ candidate, targetStage, label, onDone, onCancel }: {
  candidate: any; targetStage: string; label: string; onDone: () => void; onCancel: () => void;
}) {
  const [note, setNote] = useState('');
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: () => hrService.moveToStage(candidate._id, targetStage, note),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['lifecycle'] }); qc.invalidateQueries({ queryKey: ['lifecycle-stats'] }); toast.success(`Moved to ${LC_LABEL[targetStage]}`); onDone(); },
    onError: () => toast.error('Stage move failed'),
  });
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mt-3">
      <div className="text-sm font-medium text-slate-700 mb-2">Moving <span className="text-[#0C447C]">{candidate.firstName} {candidate.lastName}</span> → <Badge v={LC_BADGE[targetStage] ?? 'gray'}>{LC_LABEL[targetStage]}</Badge></div>
      <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note (optional)…" rows={2}
        className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0C447C]/20 focus:border-[#0C447C] mb-2" />
      <div className="flex gap-2">
        <Btn variant="primary" onClick={() => mut.mutate()}>{mut.isPending ? 'Moving…' : label}</Btn>
        <Btn onClick={onCancel}>Cancel</Btn>
      </div>
    </div>
  );
}

// ─── CANDIDATE DETAIL MODAL ───────────────────────────────────────────────────
function CandidateDetailModal({ candidateId, onClose }: { candidateId: string; onClose: () => void }) {
  const [tab, setTab] = useState<'overview'|'timeline'|'interviews'|'offer'|'onboarding'|'exit'>('overview');
  const [activePanel, setActivePanel] = useState<string|null>(null);
  const [interviewForm, setInterviewForm] = useState<Record<string,any>>({ round:1, type:'in_person', scheduledAt:'', scheduledTime:'', venue:'', interviewers:'' });
  const [feedbackForm, setFeedbackForm] = useState<Record<string,any>>({ rating:0, recommendation:'hire', feedback:'' });
  const [feedbackRound, setFeedbackRound] = useState<number|null>(null);
  const [offerForm, setOfferForm] = useState<Record<string,any>>({ offeredSalary:'', currency:'PKR', designation:'', department:'', joiningDate:'', expiryDate:'', notes:'' });
  const [offerResponseNote, setOfferResponseNote] = useState('');
  const [exitForm, setExitForm] = useState<Record<string,any>>({ exitType:'', exitDate:'', lastWorkingDay:'', reason:'', noticePeriodServed:false, exitInterviewDone:false, exitInterviewNotes:'', finalSettlementAmount:'', finalSettlementDate:'', clearanceStatus:'pending' });
  const qc = useQueryClient();

  const { data: candidate, isLoading } = useQuery({
    queryKey: ['lifecycle-candidate', candidateId],
    queryFn: () => hrService.getLifecycleById(candidateId),
    enabled: !!candidateId,
    refetchOnWindowFocus: false,
  });

  const refetchAll = () => {
    qc.invalidateQueries({ queryKey: ['lifecycle-candidate', candidateId] });
    qc.invalidateQueries({ queryKey: ['lifecycle'] });
    qc.invalidateQueries({ queryKey: ['lifecycle-stats'] });
  };

  const interviewMut = useMutation({
    mutationFn: (d: any) => hrService.scheduleInterview(candidateId, d),
    onSuccess: () => { refetchAll(); toast.success('Interview scheduled'); setActivePanel(null); },
    onError: () => toast.error('Failed to schedule interview'),
  });
  const feedbackMut = useMutation({
    mutationFn: ({ round, d }: { round: number; d: any }) => hrService.updateInterviewFeedback(candidateId, round, d),
    onSuccess: () => { refetchAll(); toast.success('Feedback saved'); setFeedbackRound(null); },
    onError: () => toast.error('Failed to save feedback'),
  });
  const offerMut = useMutation({
    mutationFn: (d: any) => hrService.makeOffer(candidateId, d),
    onSuccess: () => { refetchAll(); toast.success('Offer extended'); setActivePanel(null); },
    onError: () => toast.error('Failed to extend offer'),
  });
  const respondMut = useMutation({
    mutationFn: ({ resp, note }: { resp: string; note: string }) => hrService.respondToOffer(candidateId, resp, note),
    onSuccess: () => { refetchAll(); toast.success('Response recorded'); setActivePanel(null); },
    onError: () => toast.error('Failed to record response'),
  });
  const taskMut = useMutation({
    mutationFn: ({ idx, isDone }: { idx: number; isDone: boolean }) => hrService.updateOnboardingTask(candidateId, idx, isDone),
    onSuccess: () => { refetchAll(); },
    onError: () => toast.error('Failed to update task'),
  });
  const updateMut = useMutation({
    mutationFn: (d: any) => hrService.updateCandidate(candidateId, d),
    onSuccess: () => { refetchAll(); toast.success('Saved'); },
    onError: () => toast.error('Save failed'),
  });

  const DETAIL_TABS = [
    { id: 'overview',    label: 'Overview' },
    { id: 'timeline',   label: 'Timeline' },
    { id: 'interviews', label: 'Interviews' },
    { id: 'offer',      label: 'Offer' },
    { id: 'onboarding', label: 'Onboarding' },
    { id: 'exit',       label: 'Exit' },
  ] as const;

  if (isLoading || !candidate) {
    return (
      <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 text-slate-500 text-sm">Loading…</div>
      </div>
    );
  }

  const stage = candidate.stage as string;
  const checklist: any[] = candidate.onboardingChecklist ?? [];
  const doneCount = checklist.filter((t: any) => t.isDone).length;
  const pct = checklist.length ? Math.round((doneCount / checklist.length) * 100) : 0;

  const cats = Array.from(new Set(checklist.map((t: any) => t.category)));

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-4 px-6 py-4 border-b border-slate-100">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0"
            style={{ background: AVATAR_COLORS[Math.abs(candidate._id?.charCodeAt(0)??0) % AVATAR_COLORS.length] }}>
            {lcInitials(candidate)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-slate-900 text-base">{candidate.firstName} {candidate.lastName}</div>
            <div className="text-xs text-slate-500">{candidate.positionTitle}{candidate.department ? ` · ${candidate.department}` : ''}</div>
          </div>
          <Badge v={LC_BADGE[stage] ?? 'gray'}>{LC_LABEL[stage] ?? stage}</Badge>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 ml-2"><X className="w-5 h-5" /></button>
        </div>

        {/* Sub-tabs */}
        <div className="flex gap-0.5 bg-slate-50 px-6 py-2 border-b border-slate-100">
          {DETAIL_TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-1.5 text-xs rounded-md font-medium transition-colors ${tab === t.id ? 'bg-white text-slate-800 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto flex-1 p-6">

          {/* ── OVERVIEW ── */}
          {tab === 'overview' && (
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Personal</div>
                  {[['Name', `${candidate.firstName} ${candidate.lastName}`], ['Email', candidate.email||'—'], ['Phone', candidate.phone||'—']].map(([l,v]) => (
                    <div key={l} className="flex justify-between text-sm"><span className="text-slate-500">{l}</span><span className="font-medium text-slate-800">{v}</span></div>
                  ))}
                </div>
                <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Application</div>
                  {[
                    ['Source', candidate.source||'—'],
                    ['Applied', candidate.applicationDate ? new Date(candidate.applicationDate).toLocaleDateString() : '—'],
                    ['Experience', candidate.yearsOfExperience != null ? `${candidate.yearsOfExperience} yrs` : '—'],
                    ['Qualification', candidate.highestQualification||'—'],
                    ['Current Employer', candidate.currentEmployer||'—'],
                    ['Notice Period', candidate.noticePeriodDays != null ? `${candidate.noticePeriodDays} days` : '—'],
                    ['Availability', candidate.availability||'—'],
                  ].map(([l,v]) => (
                    <div key={l} className="flex justify-between text-sm"><span className="text-slate-500">{l}</span><span className="font-medium text-slate-800 text-right max-w-[55%]">{v}</span></div>
                  ))}
                </div>
                <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Position</div>
                  {[['Title', candidate.positionTitle], ['Department', candidate.department||'—'], ['Type', candidate.employmentType||'—'], ['Expected Salary', candidate.expectedSalary ? `${candidate.currency??''} ${candidate.expectedSalary.toLocaleString()}` : '—']].map(([l,v]) => (
                    <div key={l} className="flex justify-between text-sm"><span className="text-slate-500">{l}</span><span className="font-medium text-slate-800">{v}</span></div>
                  ))}
                </div>
                {candidate.notes && (
                  <div className="bg-slate-50 rounded-xl p-4">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Notes</div>
                    <div className="text-sm text-slate-700 leading-relaxed">{candidate.notes}</div>
                  </div>
                )}
              </div>

              {/* Stage actions */}
              <div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Pipeline Actions</div>
                  <div className="space-y-2">
                    {stage === 'candidate' && (
                      activePanel === 'interview' ? (
                        <StageMovePanel candidate={candidate} targetStage="interview" label="Confirm → Interview"
                          onDone={() => { setActivePanel(null); refetchAll(); }} onCancel={() => setActivePanel(null)} />
                      ) : <Btn variant="primary" onClick={() => setActivePanel('interview')}>Schedule Interview</Btn>
                    )}
                    {stage === 'interview' && (
                      activePanel === 'selected' ? (
                        <StageMovePanel candidate={candidate} targetStage="selected" label="Mark as Selected"
                          onDone={() => { setActivePanel(null); refetchAll(); }} onCancel={() => setActivePanel(null)} />
                      ) : <Btn variant="primary" onClick={() => setActivePanel('selected')}>Mark as Selected</Btn>
                    )}
                    {stage === 'selected' && (
                      activePanel === 'offered' ? (
                        <StageMovePanel candidate={candidate} targetStage="offered" label="Move to Offered"
                          onDone={() => { setActivePanel(null); refetchAll(); }} onCancel={() => setActivePanel(null)} />
                      ) : <Btn variant="primary" onClick={() => { setActivePanel('offered'); setTab('offer'); }}>Extend Offer</Btn>
                    )}
                    {stage === 'offered' && candidate.offer?.status === 'pending' && (
                      <div className="space-y-2">
                        {activePanel === 'accept' ? (
                          <div className="bg-white border border-slate-200 rounded-xl p-3">
                            <div className="text-xs font-medium text-slate-600 mb-2">Note for acceptance</div>
                            <textarea value={offerResponseNote} onChange={e => setOfferResponseNote(e.target.value)} rows={2}
                              className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none mb-2" placeholder="Optional note…" />
                            <div className="flex gap-2">
                              <Btn variant="success" onClick={() => respondMut.mutate({ resp:'accepted', note: offerResponseNote })}>Confirm Accept</Btn>
                              <Btn onClick={() => setActivePanel(null)}>Cancel</Btn>
                            </div>
                          </div>
                        ) : activePanel === 'reject' ? (
                          <div className="bg-white border border-slate-200 rounded-xl p-3">
                            <div className="text-xs font-medium text-slate-600 mb-2">Reason for rejection</div>
                            <textarea value={offerResponseNote} onChange={e => setOfferResponseNote(e.target.value)} rows={2}
                              className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none mb-2" placeholder="Reason…" />
                            <div className="flex gap-2">
                              <Btn variant="danger" onClick={() => respondMut.mutate({ resp:'rejected', note: offerResponseNote })}>Confirm Reject</Btn>
                              <Btn onClick={() => setActivePanel(null)}>Cancel</Btn>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <Btn variant="success" onClick={() => { setActivePanel('accept'); setOfferResponseNote(''); }}>Offer Accepted</Btn>
                            <Btn variant="danger" onClick={() => { setActivePanel('reject'); setOfferResponseNote(''); }}>Offer Rejected</Btn>
                          </div>
                        )}
                      </div>
                    )}
                    {stage === 'onboarding' && (
                      activePanel === 'active' ? (
                        <StageMovePanel candidate={candidate} targetStage="active" label="Convert to Active Employee"
                          onDone={() => { setActivePanel(null); refetchAll(); }} onCancel={() => setActivePanel(null)} />
                      ) : <Btn variant="success" onClick={() => setActivePanel('active')}>Mark as Active Employee</Btn>
                    )}
                    {!['exit','active','rejected','withdrawn'].includes(stage) && (
                      activePanel === 'reject' ? (
                        <StageMovePanel candidate={candidate} targetStage="rejected" label="Confirm Reject"
                          onDone={() => { setActivePanel(null); refetchAll(); }} onCancel={() => setActivePanel(null)} />
                      ) : (
                        <div className="pt-2 border-t border-slate-200 mt-2">
                          <Btn variant="danger" onClick={() => setActivePanel('reject')}>Reject Candidate</Btn>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── TIMELINE ── */}
          {tab === 'timeline' && (
            <div className="space-y-0">
              {[...(candidate.stageHistory ?? [])].reverse().map((h: any, i: number) => (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-white border-2 border-[#0C447C] flex items-center justify-center shrink-0">
                      <div className="w-2 h-2 rounded-full bg-[#0C447C]" />
                    </div>
                    {i < (candidate.stageHistory?.length - 1) && <div className="w-0.5 flex-1 bg-slate-200 my-1" />}
                  </div>
                  <div className="pb-5 pt-1 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge v={LC_BADGE[h.stage] ?? 'gray'}>{LC_LABEL[h.stage] ?? h.stage}</Badge>
                      <span className="text-xs text-slate-400">{h.movedAt ? new Date(h.movedAt).toLocaleString() : ''}</span>
                    </div>
                    {h.note && <div className="text-sm text-slate-600">{h.note}</div>}
                  </div>
                </div>
              ))}
              {(!candidate.stageHistory || candidate.stageHistory.length === 0) && (
                <div className="text-sm text-slate-400 text-center py-8">No stage history yet</div>
              )}
            </div>
          )}

          {/* ── INTERVIEWS ── */}
          {tab === 'interviews' && (
            <div className="space-y-4">
              {(candidate.interviews ?? []).map((iv: any, i: number) => (
                <div key={i} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-sm text-slate-800">Round {iv.round} · <span className="font-normal text-slate-500 capitalize">{iv.type?.replace('_',' ')}</span></div>
                    <Badge v={iv.status === 'completed' ? 'green' : iv.status === 'cancelled' ? 'red' : 'blue'}>{iv.status}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                    <div><span className="text-slate-500">Date: </span>{iv.scheduledAt ? new Date(iv.scheduledAt).toLocaleString() : '—'}</div>
                    <div><span className="text-slate-500">Venue: </span>{iv.venue||'—'}</div>
                    {iv.interviewers?.length > 0 && <div className="col-span-2"><span className="text-slate-500">Interviewers: </span>{(iv.interviewers as string[]).join(', ')}</div>}
                  </div>
                  {iv.status === 'completed' && (
                    <div className="bg-white rounded-lg p-3 border border-slate-200 space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">Rating:</span>
                        <div className="flex">
                          {[1,2,3,4,5].map(s => <span key={s} className={`text-lg ${s <= iv.rating ? 'text-amber-400' : 'text-slate-200'}`}>★</span>)}
                        </div>
                      </div>
                      {iv.recommendation && <div><span className="text-slate-500">Recommendation: </span><Badge v={iv.recommendation==='hire'?'green':iv.recommendation==='reject'?'red':'amber'}>{iv.recommendation}</Badge></div>}
                      {iv.feedback && <div><span className="text-slate-500">Feedback: </span>{iv.feedback}</div>}
                    </div>
                  )}
                  {iv.status !== 'completed' && (
                    feedbackRound === iv.round ? (
                      <div className="mt-3 bg-white border border-slate-200 rounded-xl p-3 space-y-3">
                        <div className="text-xs font-semibold text-slate-600">Add Interview Feedback</div>
                        <div>
                          <div className="text-xs text-slate-500 mb-1">Rating</div>
                          <div className="flex gap-1">
                            {[1,2,3,4,5].map(s => (
                              <button key={s} onClick={() => setFeedbackForm(p => ({...p, rating:s}))}
                                className={`text-2xl transition-colors ${s <= feedbackForm.rating ? 'text-amber-400' : 'text-slate-200 hover:text-amber-200'}`}>★</button>
                            ))}
                          </div>
                        </div>
                        <LcSelect label="Recommendation" k="recommendation" form={feedbackForm} setForm={setFeedbackForm}
                          opts={[['hire','Hire'],['reject','Reject'],['hold','Hold'],['next_round','Next Round']]} />
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Feedback</label>
                          <textarea value={feedbackForm.feedback} onChange={e => setFeedbackForm(p=>({...p,feedback:e.target.value}))} rows={3}
                            className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none" />
                        </div>
                        <div className="flex gap-2">
                          <Btn variant="primary" onClick={() => feedbackMut.mutate({ round: iv.round, d: feedbackForm })}>{feedbackMut.isPending?'Saving…':'Save Feedback'}</Btn>
                          <Btn onClick={() => setFeedbackRound(null)}>Cancel</Btn>
                        </div>
                      </div>
                    ) : <Btn onClick={() => { setFeedbackRound(iv.round); setFeedbackForm({ rating:0, recommendation:'hire', feedback:'' }); }}>Add Feedback</Btn>
                  )}
                </div>
              ))}
              {(!candidate.interviews || candidate.interviews.length === 0) && (
                <div className="text-sm text-slate-400 text-center py-4">No interviews scheduled yet</div>
              )}
              {activePanel === 'schedule-interview' ? (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <div className="text-xs font-semibold text-slate-700">Schedule Interview</div>
                  <div className="grid grid-cols-2 gap-3">
                    <LcInput label="Round #" k="round" form={interviewForm} setForm={setInterviewForm} type="number" />
                    <LcSelect label="Type" k="type" form={interviewForm} setForm={setInterviewForm}
                      opts={[['in_person','In Person'],['phone','Phone'],['video','Video'],['technical','Technical'],['hr','HR']]} />
                    <LcInput label="Date *" k="scheduledAt" form={interviewForm} setForm={setInterviewForm} type="date" />
                    <LcInput label="Time" k="scheduledTime" form={interviewForm} setForm={setInterviewForm} type="time" />
                    <LcInput label="Venue" k="venue" form={interviewForm} setForm={setInterviewForm} />
                    <LcInput label="Interviewers (comma-separated)" k="interviewers" form={interviewForm} setForm={setInterviewForm} />
                  </div>
                  <div className="flex gap-2">
                    <Btn variant="primary" onClick={() => {
                      const dateStr = interviewForm.scheduledAt + (interviewForm.scheduledTime ? `T${interviewForm.scheduledTime}:00` : 'T09:00:00');
                      interviewMut.mutate({
                        round: Number(interviewForm.round),
                        type: interviewForm.type,
                        scheduledAt: new Date(dateStr).toISOString(),
                        venue: interviewForm.venue,
                        interviewers: interviewForm.interviewers ? interviewForm.interviewers.split(',').map((s: string) => s.trim()) : [],
                      });
                    }}>{interviewMut.isPending?'Scheduling…':'Schedule'}</Btn>
                    <Btn onClick={() => setActivePanel(null)}>Cancel</Btn>
                  </div>
                </div>
              ) : (
                <Btn variant="primary" onClick={() => {
                  setActivePanel('schedule-interview');
                  setInterviewForm({ round: (candidate.interviews?.length ?? 0) + 1, type:'in_person', scheduledAt:'', scheduledTime:'', venue:'', interviewers:'' });
                }}>+ Schedule Interview</Btn>
              )}
            </div>
          )}

          {/* ── OFFER ── */}
          {tab === 'offer' && (
            <div>
              {candidate.offer ? (
                <div className="space-y-4">
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-semibold text-slate-700">Offer Details</div>
                      <Badge v={candidate.offer.status==='accepted'?'green':candidate.offer.status==='rejected'?'red':candidate.offer.status==='negotiating'?'amber':'blue'}>{candidate.offer.status}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {[
                        ['Offered Salary', `${candidate.offer.currency??''} ${candidate.offer.offeredSalary?.toLocaleString()??'—'}`],
                        ['Designation', candidate.offer.designation||'—'],
                        ['Department', candidate.offer.department||'—'],
                        ['Joining Date', candidate.offer.joiningDate ? new Date(candidate.offer.joiningDate).toLocaleDateString() : '—'],
                        ['Offer Date', candidate.offer.offerDate ? new Date(candidate.offer.offerDate).toLocaleDateString() : '—'],
                        ['Expiry Date', candidate.offer.expiryDate ? new Date(candidate.offer.expiryDate).toLocaleDateString() : '—'],
                      ].map(([l,v]) => (
                        <div key={l}><span className="text-slate-500">{l}: </span><span className="font-medium text-slate-800">{v}</span></div>
                      ))}
                    </div>
                    {candidate.offer.candidateResponse && (
                      <div className="mt-3 pt-3 border-t border-slate-200 text-sm">
                        <span className="text-slate-500">Candidate note: </span>{candidate.offer.candidateResponse}
                      </div>
                    )}
                  </div>
                  {candidate.offer.status === 'pending' && (
                    <div className="space-y-2">
                      {activePanel === 'accept' ? (
                        <div className="bg-white border border-slate-200 rounded-xl p-3">
                          <textarea value={offerResponseNote} onChange={e => setOfferResponseNote(e.target.value)} rows={2} placeholder="Optional note…"
                            className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none mb-2" />
                          <div className="flex gap-2">
                            <Btn variant="success" onClick={() => respondMut.mutate({ resp:'accepted', note: offerResponseNote })}>Confirm Accept</Btn>
                            <Btn onClick={() => setActivePanel(null)}>Cancel</Btn>
                          </div>
                        </div>
                      ) : activePanel === 'reject' ? (
                        <div className="bg-white border border-slate-200 rounded-xl p-3">
                          <textarea value={offerResponseNote} onChange={e => setOfferResponseNote(e.target.value)} rows={2} placeholder="Reason…"
                            className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none mb-2" />
                          <div className="flex gap-2">
                            <Btn variant="danger" onClick={() => respondMut.mutate({ resp:'rejected', note: offerResponseNote })}>Confirm Reject</Btn>
                            <Btn onClick={() => setActivePanel(null)}>Cancel</Btn>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Btn variant="success" onClick={() => { setActivePanel('accept'); setOfferResponseNote(''); }}>Candidate Accepted</Btn>
                          <Btn variant="danger" onClick={() => { setActivePanel('reject'); setOfferResponseNote(''); }}>Candidate Rejected</Btn>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                activePanel === 'make-offer' ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                    <div className="text-xs font-semibold text-slate-700">Extend Offer</div>
                    <div className="grid grid-cols-2 gap-3">
                      <LcInput label="Offered Salary *" k="offeredSalary" form={offerForm} setForm={setOfferForm} type="number" />
                      <LcSelect label="Currency" k="currency" form={offerForm} setForm={setOfferForm} opts={[['PKR','PKR'],['USD','USD'],['AED','AED']]} />
                      <LcInput label="Designation" k="designation" form={offerForm} setForm={setOfferForm} />
                      <LcInput label="Department" k="department" form={offerForm} setForm={setOfferForm} />
                      <LcInput label="Joining Date" k="joiningDate" form={offerForm} setForm={setOfferForm} type="date" />
                      <LcInput label="Offer Expiry Date" k="expiryDate" form={offerForm} setForm={setOfferForm} type="date" />
                    </div>
                    <div className="flex gap-2">
                      <Btn variant="primary" onClick={() => offerMut.mutate({ ...offerForm, offeredSalary: Number(offerForm.offeredSalary) })}>{offerMut.isPending?'Sending…':'Send Offer'}</Btn>
                      <Btn onClick={() => setActivePanel(null)}>Cancel</Btn>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-slate-400 text-sm mb-4">No offer has been extended yet</div>
                    <Btn variant="primary" onClick={() => setActivePanel('make-offer')}>+ Extend Offer</Btn>
                  </div>
                )
              )}
            </div>
          )}

          {/* ── ONBOARDING ── */}
          {tab === 'onboarding' && (
            <div>
              {stage !== 'onboarding' ? (
                <div className="text-center py-8 text-slate-400 text-sm">Onboarding checklist becomes available once the candidate is in the Onboarding stage.</div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="flex-1"><PBar pct={pct} color="#10b981" /></div>
                    <div className="text-sm font-semibold text-slate-700 shrink-0">{doneCount}/{checklist.length} tasks ({pct}%)</div>
                  </div>
                  {cats.map(cat => (
                    <div key={cat} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                        {CATEGORY_ICON[cat] ?? '📋'} {cat}
                      </div>
                      <div className="space-y-2">
                        {checklist.map((t: any, idx: number) => t.category !== cat ? null : (
                          <label key={idx} className="flex items-center gap-3 cursor-pointer group">
                            <input type="checkbox" checked={t.isDone} onChange={e => taskMut.mutate({ idx, isDone: e.target.checked })}
                              className="w-4 h-4 rounded accent-emerald-600" />
                            <span className={`text-sm flex-1 ${t.isDone ? 'line-through text-slate-400' : 'text-slate-700'}`}>{t.task}</span>
                            {t.isDone && t.doneAt && <span className="text-xs text-slate-400">{new Date(t.doneAt).toLocaleDateString()}</span>}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                  {pct === 100 && (
                    <div className="pt-2">
                      <Btn variant="success" onClick={() => setTab('overview')}>Convert to Active Employee →</Btn>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── EXIT ── */}
          {tab === 'exit' && (
            <div>
              {stage !== 'exit' ? (
                <div className="text-center py-8 text-slate-400 text-sm">Exit details are recorded when the candidate/employee is in the Exit stage.</div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <LcSelect label="Exit Type" k="exitType" form={exitForm} setForm={setExitForm}
                      opts={[['','Select'],['resignation','Resignation'],['termination','Termination'],['retirement','Retirement'],['contract_end','Contract End'],['death','Death']]} />
                    <LcInput label="Exit Date" k="exitDate" form={exitForm} setForm={setExitForm} type="date" />
                    <LcInput label="Last Working Day" k="lastWorkingDay" form={exitForm} setForm={setExitForm} type="date" />
                    <LcSelect label="Clearance Status" k="clearanceStatus" form={exitForm} setForm={setExitForm}
                      opts={[['pending','Pending'],['in_progress','In Progress'],['complete','Complete']]} />
                    <LcSelect label="Notice Period Served" k="noticePeriodServed" form={exitForm} setForm={setExitForm}
                      opts={[['false','No'],['true','Yes']]} />
                    <LcSelect label="Exit Interview Done" k="exitInterviewDone" form={exitForm} setForm={setExitForm}
                      opts={[['false','No'],['true','Yes']]} />
                    <LcInput label="Final Settlement Amount" k="finalSettlementAmount" form={exitForm} setForm={setExitForm} type="number" />
                    <LcInput label="Settlement Date" k="finalSettlementDate" form={exitForm} setForm={setExitForm} type="date" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Reason</label>
                    <textarea value={exitForm.reason} onChange={e => setExitForm((p: any) => ({...p, reason: e.target.value}))} rows={2}
                      className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Exit Interview Notes</label>
                    <textarea value={exitForm.exitInterviewNotes} onChange={e => setExitForm((p: any) => ({...p, exitInterviewNotes: e.target.value}))} rows={2}
                      className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none" />
                  </div>
                  <Btn variant="primary" onClick={() => updateMut.mutate({ exitDetails: { ...exitForm, noticePeriodServed: exitForm.noticePeriodServed === 'true', exitInterviewDone: exitForm.exitInterviewDone === 'true', finalSettlementAmount: exitForm.finalSettlementAmount ? Number(exitForm.finalSettlementAmount) : undefined } })}>
                    {updateMut.isPending ? 'Saving…' : 'Save Exit Details'}
                  </Btn>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ─── LIFECYCLE TAB ────────────────────────────────────────────────────────────
function LifecycleTab() {
  const [showAdd, setShowAdd] = useState(false);
  const [selectedId, setSelectedId] = useState<string|null>(null);

  const { data: lifecycleData, isLoading } = useQuery({
    queryKey: ['lifecycle'],
    queryFn: hrService.getLifecycle,
  });
  const { data: stats } = useQuery({
    queryKey: ['lifecycle-stats'],
    queryFn: hrService.getLifecycleStats,
  });

  console.log('lifecycle data:', lifecycleData);
  console.log('grouped:', lifecycleData?.grouped);

  const grouped: Record<string, any[]> = lifecycleData?.grouped ?? {
    candidate:[], interview:[], selected:[], offered:[], onboarding:[], active:[], exit:[],
  };

  return (
    <div>
      {showAdd && <AddCandidateModal onClose={() => setShowAdd(false)} onSaved={() => setShowAdd(false)} />}
      {selectedId && <CandidateDetailModal candidateId={selectedId} onClose={() => setSelectedId(null)} />}

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-slate-900">Employee Lifecycle</h1>
        <Btn variant="primary" onClick={() => setShowAdd(true)}><Plus className="w-3.5 h-3.5" /> Add Candidate</Btn>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-5 gap-3 mb-5">
        <KPI label="Total Pipeline"   value={String(lifecycleData?.total ?? 0)}          color="navy"  />
        <KPI label="This Month"       value={String(stats?.thisMonth ?? 0)}              color="blue"  />
        <KPI label="In Interview"     value={String(grouped.interview?.length ?? 0)}     color="amber" />
        <KPI label="Offers Pending"   value={String(grouped.offered?.length ?? 0)}       color="green" />
        <KPI label="Active Staff"     value={String(grouped.active?.length ?? 0)}        color="navy"  />
      </div>

      {isLoading ? (
        <div className="text-sm text-slate-400 py-8 text-center">Loading pipeline…</div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {LC_COLUMNS.map(stage => {
            const items: any[] = grouped[stage] ?? [];
            return (
              <div key={stage} className={`min-w-[210px] rounded-xl p-3 ${LC_STAGE_COLOR[stage]}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">{LC_LABEL[stage]}</span>
                  <span className="bg-white border border-slate-200 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full">{items.length}</span>
                </div>
                <div className="space-y-2">
                  {items.map((c: any) => (
                    <div key={c._id} onClick={() => setSelectedId(c._id)}
                      className="bg-white rounded-lg border border-slate-200 p-3 cursor-pointer hover:shadow-sm hover:border-[#0C447C]/30 transition-all">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                          style={{ background: AVATAR_COLORS[Math.abs((c._id?.charCodeAt(0)??0)) % AVATAR_COLORS.length] }}>
                          {lcInitials(c)}
                        </div>
                        <div className="font-medium text-sm text-slate-800 leading-tight truncate">{c.firstName} {c.lastName}</div>
                      </div>
                      <div className="text-xs text-slate-500 truncate">{c.positionTitle}</div>
                      {c.department && <div className="text-xs text-slate-400 truncate">{c.department}</div>}
                      {stage === 'active' && <div className="text-xs text-sky-600 font-medium mt-0.5">Converted to Staff</div>}
                      <div className="mt-2">
                        <Badge v={LC_BADGE[c.stage] ?? 'gray'}>{LC_LABEL[c.stage] ?? c.stage}</Badge>
                      </div>
                    </div>
                  ))}
                  {items.length === 0 && (
                    <div className="text-center py-4 text-xs text-slate-400">Empty</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── RECRUITMENT HELPERS ─────────────────────────────────────────────────────
const JOB_STATUS_V: Record<string, BadgeVariant> = {
  draft: "gray", active: "green", paused: "amber", closed: "red", filled: "blue", cancelled: "gray",
};
const APP_STAGE_V: Record<string, BadgeVariant> = {
  applied: "gray", screening: "blue", shortlisted: "purple", interview: "amber",
  selected: "green", offered: "blue", hired: "green", rejected: "red", withdrawn: "gray",
};
const IV_STATUS_V: Record<string, BadgeVariant> = {
  scheduled: "blue", completed: "green", cancelled: "red", no_show: "amber", rescheduled: "purple",
};
const APP_STAGES = ["applied","screening","shortlisted","interview","selected","offered","hired","rejected","withdrawn"] as const;

function DynList({ label, items, setItems }: { label: string; items: string[]; setItems: (v: string[]) => void }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-medium text-slate-600">{label}</label>
        <button type="button" onClick={() => setItems([...items, ''])}
          className="text-xs text-[#0C447C] hover:underline flex items-center gap-0.5"><Plus className="w-3 h-3" />Add</button>
      </div>
      <div className="space-y-1">
        {items.map((v, i) => (
          <div key={i} className="flex gap-1">
            <input value={v} onChange={e => { const a = [...items]; a[i] = e.target.value; setItems(a); }}
              className="flex-1 border border-slate-200 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#0C447C]/20 focus:border-[#0C447C]" />
            <button type="button" onClick={() => setItems(items.filter((_, j) => j !== i))}
              className="text-slate-400 hover:text-red-500 px-1"><X className="w-3.5 h-3.5" /></button>
          </div>
        ))}
        {items.length === 0 && <div className="text-xs text-slate-400 italic">None added yet</div>}
      </div>
    </div>
  );
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(s => (
        <button key={s} type="button" onClick={() => onChange(s)}
          className={`text-xl transition-colors ${s <= value ? 'text-amber-400' : 'text-slate-200 hover:text-amber-200'}`}>★</button>
      ))}
      {value > 0 && <span className="text-xs text-slate-500 ml-1 self-center">{value}/5</span>}
    </div>
  );
}

// ─── FORM SECTION HEADER (top-level — no state deps) ─────────────────────────
function CjSH({ title }: { title: string }) {
  return (
    <div className="col-span-2 border-b border-slate-100 pb-1 mb-1">
      <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">{title}</span>
    </div>
  );
}

// ─── CHECKBOX FIELD (top-level — receives form + setter as props) ─────────────
function CjChk({ label, k, form, setForm }: {
  label: string; k: string; form: any; setForm: (u: (p: any) => any) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
      <input type="checkbox" checked={!!form[k]}
        onChange={e => { const v = e.target.checked; setForm(p => ({ ...p, [k]: v })); }}
        className="w-4 h-4 accent-[#0C447C]" />
      {label}
    </label>
  );
}

// ─── CREATE JOB MODAL ────────────────────────────────────────────────────────
function CreateJobModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<Record<string,any>>({
    title:'', department:'', campusName:'', type:'permanent', vacancies:1, level:'mid',
    hiringManagerName:'', isUrgent:false, minSalary:'', maxSalary:'', currency:'PKR',
    showSalary:false, applicationDeadline:'', expectedJoiningDate:'', description:'',
  });
  const [requirements, setRequirements] = useState<string[]>([]);
  const [responsibilities, setResponsibilities] = useState<string[]>([]);
  const [qualifications, setQualifications] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [benefits, setBenefits] = useState<string[]>([]);

  const mut = useMutation({
    mutationFn: (status: string) => hrService.createJob({
      ...form, status,
      vacancies: Number(form.vacancies),
      minSalary: form.minSalary ? Number(form.minSalary) : undefined,
      maxSalary: form.maxSalary ? Number(form.maxSalary) : undefined,
      isPublished: status === 'active',
      requirements: requirements.filter(Boolean),
      responsibilities: responsibilities.filter(Boolean),
      qualifications: qualifications.filter(Boolean),
      skills: skills.filter(Boolean),
      benefits: benefits.filter(Boolean),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jobs'] });
      qc.invalidateQueries({ queryKey: ['recruitment-stats'] });
      toast.success('Job opening created');
      onSaved();
    },
    onError: () => toast.error('Failed to create job'),
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto py-6 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <div className="font-semibold text-slate-800">Create Job Opening</div>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <CjSH title="Basic Info" />
            <LcInput label="Job Title *" k="title" form={form} setForm={setForm} span={2} />
            <LcInput label="Department *" k="department" form={form} setForm={setForm} />
            <LcInput label="Campus" k="campusName" form={form} setForm={setForm} />
            <LcSelect label="Employment Type *" k="type" form={form} setForm={setForm} opts={[['permanent','Permanent'],['contract','Contract'],['part_time','Part Time'],['visiting','Visiting'],['temporary','Temporary']]} />
            <LcSelect label="Level" k="level" form={form} setForm={setForm} opts={[['entry','Entry'],['mid','Mid'],['senior','Senior'],['lead','Lead'],['head','Head'],['executive','Executive']]} />
            <LcInput label="Vacancies *" k="vacancies" type="number" form={form} setForm={setForm} />
            <LcInput label="Hiring Manager" k="hiringManagerName" form={form} setForm={setForm} />
            <div className="col-span-2"><CjChk label="Mark as Urgent" k="isUrgent" form={form} setForm={setForm} /></div>

            <CjSH title="Salary" />
            <LcInput label="Min Salary" k="minSalary" type="number" form={form} setForm={setForm} />
            <LcInput label="Max Salary" k="maxSalary" type="number" form={form} setForm={setForm} />
            <LcSelect label="Currency" k="currency" form={form} setForm={setForm} opts={[['PKR','PKR'],['USD','USD'],['AED','AED']]} />
            <div className="flex items-end pb-1"><CjChk label="Show salary on posting" k="showSalary" form={form} setForm={setForm} /></div>

            <CjSH title="Dates" />
            <LcInput label="Application Deadline *" k="applicationDeadline" type="date" form={form} setForm={setForm} />
            <LcInput label="Expected Joining Date" k="expectedJoiningDate" type="date" form={form} setForm={setForm} />

            <CjSH title="Job Description" />
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
              <textarea value={form.description} rows={4}
                onChange={e => { const v = e.target.value; setForm(p => ({ ...p, description: v })); }}
                className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0C447C]/20 focus:border-[#0C447C]" />
            </div>

            <CjSH title="Requirements & Details" />
            <div className="col-span-2 grid grid-cols-2 gap-4">
              <DynList label="Requirements" items={requirements} setItems={setRequirements} />
              <DynList label="Responsibilities" items={responsibilities} setItems={setResponsibilities} />
              <DynList label="Qualifications" items={qualifications} setItems={setQualifications} />
              <DynList label="Skills Required" items={skills} setItems={setSkills} />
              <DynList label="Benefits" items={benefits} setItems={setBenefits} />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100 sticky bottom-0 bg-white rounded-b-2xl">
          <Btn onClick={onClose}>Cancel</Btn>
          <Btn onClick={() => mut.mutate('draft')} variant="secondary">{mut.isPending ? '…' : 'Save as Draft'}</Btn>
          <Btn onClick={() => mut.mutate('active')} variant="primary">{mut.isPending ? '…' : 'Post Job'}</Btn>
        </div>
      </div>
    </div>
  );
}

// ─── ADD APPLICATION MODAL ────────────────────────────────────────────────────
function AddApplicationModal({ jobId, jobTitle, onClose, onSaved }: { jobId: string; jobTitle: string; onClose: () => void; onSaved: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<Record<string,any>>({
    firstName:'', lastName:'', email:'', phone:'', currentEmployer:'', currentDesignation:'',
    yearsOfExperience:'', highestQualification:'', expectedSalary:'', noticePeriodDays:'',
    source:'website', referredBy:'', availability:'', coverLetter:'',
  });
  const mut = useMutation({
    mutationFn: () => hrService.createApplication({ ...form, jobId,
      yearsOfExperience: form.yearsOfExperience ? Number(form.yearsOfExperience) : undefined,
      expectedSalary: form.expectedSalary ? Number(form.expectedSalary) : undefined,
      noticePeriodDays: form.noticePeriodDays ? Number(form.noticePeriodDays) : undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['applications'] });
      qc.invalidateQueries({ queryKey: ['jobs'] });
      qc.invalidateQueries({ queryKey: ['recruitment-stats'] });
      toast.success('Application added');
      onSaved();
    },
    onError: () => toast.error('Failed to add application'),
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[88vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <div className="font-semibold text-slate-800">Add Application</div>
            <div className="text-xs text-slate-500">{jobTitle}</div>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-6">
          <div className="grid grid-cols-2 gap-3">
            <LcInput label="First Name *" k="firstName" form={form} setForm={setForm} />
            <LcInput label="Last Name *" k="lastName" form={form} setForm={setForm} />
            <LcInput label="Email *" k="email" type="email" form={form} setForm={setForm} />
            <LcInput label="Phone" k="phone" form={form} setForm={setForm} />
            <LcInput label="Current Employer" k="currentEmployer" form={form} setForm={setForm} />
            <LcInput label="Current Designation" k="currentDesignation" form={form} setForm={setForm} />
            <LcInput label="Years of Experience" k="yearsOfExperience" type="number" form={form} setForm={setForm} />
            <LcInput label="Highest Qualification" k="highestQualification" form={form} setForm={setForm} />
            <LcInput label="Expected Salary" k="expectedSalary" type="number" form={form} setForm={setForm} />
            <LcInput label="Notice Period (days)" k="noticePeriodDays" type="number" form={form} setForm={setForm} />
            <LcSelect label="Source" k="source" form={form} setForm={setForm} opts={[['linkedin','LinkedIn'],['referral','Referral'],['walk_in','Walk-in'],['website','Website'],['agency','Agency'],['job_portal','Job Portal'],['other','Other']]} />
            <LcInput label="Referred By" k="referredBy" form={form} setForm={setForm} />
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Cover Letter</label>
              <textarea value={form.coverLetter ?? ''} rows={3}
                onChange={e => { const v = e.target.value; setForm(p => ({ ...p, coverLetter: v })); }}
                className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none" />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100">
          <Btn onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" onClick={() => mut.mutate()}>{mut.isPending ? 'Adding…' : 'Add Application'}</Btn>
        </div>
      </div>
    </div>
  );
}

// ─── SCHEDULE INTERVIEW MODAL ────────────────────────────────────────────────
function ScheduleInterviewModal({ application, existingCount, onClose, onSaved }: {
  application: any; existingCount: number; onClose: () => void; onSaved: () => void;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState<Record<string,any>>({
    round: existingCount + 1, type:'in_person', scheduledDate:'', scheduledTime:'09:00',
    durationMins: 60, venue:'', meetingLink:'', interviewers:'', panelLead:'', notes:'',
  });
  const sf = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const mut = useMutation({
    mutationFn: () => hrService.scheduleRecruitmentInterview({
      applicationId: application._id,
      round: Number(form.round),
      type: form.type,
      scheduledAt: new Date(`${form.scheduledDate}T${form.scheduledTime}:00`).toISOString(),
      durationMins: Number(form.durationMins),
      venue: form.venue,
      meetingLink: form.meetingLink,
      interviewers: form.interviewers ? form.interviewers.split(',').map((s: string) => s.trim()) : [],
      panelLead: form.panelLead,
      notes: form.notes,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['interviews'] });
      qc.invalidateQueries({ queryKey: ['recruitment-stats'] });
      toast.success('Interview scheduled');
      onSaved();
    },
    onError: () => toast.error('Failed to schedule interview'),
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[88vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <div className="font-semibold text-slate-800">Schedule Interview</div>
            <div className="text-xs text-slate-500">{application.firstName} {application.lastName} · {application.jobTitle}</div>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-6">
          <div className="grid grid-cols-2 gap-3">
            {[
              ['Round #','round','number'],['Type','type','sel'],
              ['Date *','scheduledDate','date'],['Time *','scheduledTime','time'],
              ['Duration (mins)','durationMins','number'],['Venue','venue','text'],
              ['Meeting Link','meetingLink','text'],['Panel Lead','panelLead','text'],
            ].map(([label, k, type]) => type === 'sel' ? (
              <div key={k}>
                <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
                <select value={form[k]??''} onChange={sf(k)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none">
                  {[['in_person','In Person'],['phone','Phone'],['video','Video'],['technical','Technical'],['hr','HR'],['panel','Panel']].map(([v,l]) =>
                    <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            ) : (
              <div key={k}>
                <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
                <input type={type} value={form[k]??''} onChange={sf(k)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0C447C]/20 focus:border-[#0C447C]" />
              </div>
            ))}
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Interviewers (comma-separated)</label>
              <input value={form.interviewers??''} onChange={sf('interviewers')}
                className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0C447C]/20 focus:border-[#0C447C]" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
              <textarea value={form.notes??''} onChange={sf('notes')} rows={2}
                className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none" />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100">
          <Btn onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" onClick={() => mut.mutate()}>{mut.isPending ? 'Scheduling…' : 'Schedule Interview'}</Btn>
        </div>
      </div>
    </div>
  );
}

// ─── INTERVIEW FEEDBACK MODAL ─────────────────────────────────────────────────
function InterviewFeedbackModal({ interview, onClose, onSaved }: { interview: any; onClose: () => void; onSaved: () => void }) {
  const qc = useQueryClient();
  const [techR, setTechR] = useState(0);
  const [commR, setCommR] = useState(0);
  const [attR, setAttR] = useState(0);
  const [form, setForm] = useState<Record<string,any>>({ recommendation:'hold', strengths:'', weaknesses:'', feedback:'' });
  const sf = (k: string) => (e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const overall = techR && commR && attR ? Math.round((techR + commR + attR) / 3 * 10) / 10 : 0;

  const mut = useMutation({
    mutationFn: () => hrService.submitInterviewFeedback(interview._id, {
      technicalRating: techR, communicationRating: commR, attitudeRating: attR,
      ...form,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['interviews'] });
      toast.success('Feedback submitted');
      onSaved();
    },
    onError: () => toast.error('Failed to submit feedback'),
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[88vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <div className="font-semibold text-slate-800">Interview Feedback</div>
            <div className="text-xs text-slate-500">{interview.candidateName} · Round {interview.round} · {interview.jobTitle}</div>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          {[['Technical Skills', techR, setTechR],['Communication', commR, setCommR],['Attitude / Culture Fit', attR, setAttR]].map(([label, val, set]) => (
            <div key={label as string}>
              <div className="text-xs font-medium text-slate-600 mb-1">{label as string}</div>
              <StarRating value={val as number} onChange={set as (v: number) => void} />
            </div>
          ))}
          {overall > 0 && (
            <div className="bg-slate-50 rounded-lg p-3 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Overall Rating</span>
              <span className="text-lg font-bold text-[#0C447C]">{overall}/5</span>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Recommendation *</label>
            <select value={form.recommendation} onChange={sf('recommendation')}
              className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0C447C]/20">
              {[['strongly_hire','Strongly Hire'],['hire','Hire'],['hold','Hold'],['no_hire','No Hire'],['reject','Reject']].map(([v,l]) =>
                <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          {[['strengths','Strengths'],['weaknesses','Weaknesses'],['feedback','Detailed Feedback']].map(([k,label]) => (
            <div key={k}>
              <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
              <textarea value={form[k]??''} onChange={sf(k)} rows={2}
                className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0C447C]/20" />
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100">
          <Btn onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" onClick={() => mut.mutate()}>{mut.isPending ? 'Submitting…' : 'Submit Feedback'}</Btn>
        </div>
      </div>
    </div>
  );
}

// ─── JOB DETAIL MODAL ────────────────────────────────────────────────────────
function JobDetailModal({ jobId, onClose }: { jobId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const [showAddApp, setShowAddApp] = useState(false);
  const [scheduleApp, setScheduleApp] = useState<any>(null);
  const { data: job, isLoading } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => hrService.getJobById(jobId),
    enabled: !!jobId,
  });
  const stageMut = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: string }) => hrService.updateAppStage(id, stage, ''),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['job', jobId] }); qc.invalidateQueries({ queryKey: ['applications'] }); toast.success('Stage updated'); },
    onError: () => toast.error('Update failed'),
  });

  if (isLoading || !job) return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 text-sm text-slate-500">Loading…</div>
    </div>
  );

  const apps: any[] = job.applications ?? [];
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      {showAddApp && <AddApplicationModal jobId={jobId} jobTitle={job.title} onClose={() => setShowAddApp(false)} onSaved={() => { setShowAddApp(false); qc.invalidateQueries({ queryKey: ['job', jobId] }); }} />}
      {scheduleApp && <ScheduleInterviewModal application={scheduleApp} existingCount={0} onClose={() => setScheduleApp(null)} onSaved={() => setScheduleApp(null)} />}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <div className="font-bold text-slate-800">{job.title}</div>
            <div className="text-xs text-slate-500">{job.jobCode} · {job.department}{job.campusName ? ` · ${job.campusName}` : ''}</div>
          </div>
          <div className="flex items-center gap-2">
            <Badge v={JOB_STATUS_V[job.status] ?? 'gray'}>{job.status}</Badge>
            <button onClick={onClose}><X className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
          </div>
        </div>
        <div className="overflow-y-auto flex-1 grid grid-cols-2 divide-x divide-slate-100">
          {/* Left: job details */}
          <div className="p-5 space-y-4 overflow-y-auto">
            <div className="grid grid-cols-2 gap-2 text-sm">
              {[['Type', job.type],['Level', job.level],['Vacancies', job.vacancies],['Applications', job.applicationsCount],
                ['Shortlisted', job.shortlistedCount],['Deadline', job.applicationDeadline ? new Date(job.applicationDeadline).toLocaleDateString() : '—'],
              ].map(([l,v]) => <div key={l}><span className="text-slate-500">{l}: </span><span className="font-medium">{v}</span></div>)}
              {job.minSalary && <div className="col-span-2"><span className="text-slate-500">Salary: </span><span className="font-medium">{job.currency} {job.minSalary?.toLocaleString()} – {job.maxSalary?.toLocaleString()}</span></div>}
            </div>
            {job.description && <div><div className="text-xs font-semibold text-slate-500 uppercase mb-1">Description</div><p className="text-sm text-slate-700 leading-relaxed">{job.description}</p></div>}
            {[['Requirements', job.requirements],['Responsibilities', job.responsibilities],['Qualifications', job.qualifications],['Skills', job.skills]].map(([label, list]: any) =>
              list?.length > 0 ? (
                <div key={label}><div className="text-xs font-semibold text-slate-500 uppercase mb-1">{label}</div>
                  <ul className="space-y-0.5">{list.map((r: string, i: number) => <li key={i} className="text-sm text-slate-700 flex gap-1.5"><span className="text-slate-300 mt-0.5">•</span>{r}</li>)}</ul>
                </div>
              ) : null
            )}
          </div>
          {/* Right: applications */}
          <div className="p-5 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold text-slate-700">Applications ({apps.length})</div>
              <Btn variant="primary" onClick={() => setShowAddApp(true)}><Plus className="w-3 h-3" /> Add</Btn>
            </div>
            <div className="space-y-2 overflow-y-auto flex-1">
              {apps.length === 0 && <div className="text-xs text-slate-400 text-center py-8">No applications yet</div>}
              {apps.map((a: any) => (
                <div key={a._id} className="border border-slate-200 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-medium text-sm text-slate-800">{a.firstName} {a.lastName}</div>
                    <Badge v={APP_STAGE_V[a.stage] ?? 'gray'}>{a.stage}</Badge>
                  </div>
                  <div className="text-xs text-slate-500 mb-2">{a.email}{a.yearsOfExperience ? ` · ${a.yearsOfExperience} yrs` : ''}</div>
                  <div className="flex gap-1 flex-wrap">
                    {a.stage !== 'shortlisted' && !['selected','offered','hired','rejected'].includes(a.stage) &&
                      <button onClick={() => stageMut.mutate({ id: a._id, stage: 'shortlisted' })} className="text-[10px] bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-lg">Shortlist</button>}
                    {!['rejected','withdrawn'].includes(a.stage) &&
                      <button onClick={() => stageMut.mutate({ id: a._id, stage: 'rejected' })} className="text-[10px] bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-lg">Reject</button>}
                    {!['rejected','withdrawn','hired'].includes(a.stage) &&
                      <button onClick={() => setScheduleApp(a)} className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-lg">Schedule Interview</button>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── APPLICATION DETAIL MODAL ─────────────────────────────────────────────────
function ApplicationDetailModal({ application, onClose }: { application: any; onClose: () => void }) {
  const [tab, setTab] = useState<'profile'|'history'|'interviews'>('profile');
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const qc = useQueryClient();
  const stageMut = useMutation({
    mutationFn: ({ stage, note }: { stage: string; note: string }) => hrService.updateAppStage(application._id, stage, note),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['applications'] }); toast.success('Stage updated'); onClose(); },
    onError: () => toast.error('Update failed'),
  });
  const [nextStage, setNextStage] = useState('');
  const NEXT: Record<string, string> = { applied:'screening', screening:'shortlisted', shortlisted:'interview', interview:'selected', selected:'offered', offered:'hired' };
  const canAdvance = NEXT[application.stage];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      {scheduleOpen && <ScheduleInterviewModal application={application} existingCount={0} onClose={() => setScheduleOpen(false)} onSaved={() => setScheduleOpen(false)} />}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-full bg-[#0C447C] flex items-center justify-center text-white text-sm font-bold shrink-0">
            {application.firstName?.[0]}{application.lastName?.[0]}
          </div>
          <div className="flex-1">
            <div className="font-bold text-slate-800">{application.firstName} {application.lastName}</div>
            <div className="text-xs text-slate-500">{application.jobTitle} · {application.applicationNo}</div>
          </div>
          <Badge v={APP_STAGE_V[application.stage] ?? 'gray'}>{application.stage}</Badge>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400 hover:text-slate-600 ml-2" /></button>
        </div>
        <div className="flex gap-0.5 bg-slate-50 px-6 py-2 border-b border-slate-100">
          {(['profile','history','interviews'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 text-xs rounded-md font-medium transition-colors capitalize ${tab === t ? 'bg-white text-slate-800 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>
              {t === 'history' ? 'Stage History' : t}
            </button>
          ))}
        </div>
        <div className="overflow-y-auto flex-1 p-5">
          {tab === 'profile' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm bg-slate-50 rounded-xl p-4">
                {[['Email', application.email],['Phone', application.phone||'—'],['Current Employer', application.currentEmployer||'—'],
                  ['Current Title', application.currentDesignation||'—'],['Experience', application.yearsOfExperience ? `${application.yearsOfExperience} yrs` : '—'],
                  ['Qualification', application.highestQualification||'—'],['Expected Salary', application.expectedSalary ? `${application.currency} ${application.expectedSalary.toLocaleString()}` : '—'],
                  ['Notice Period', application.noticePeriodDays ? `${application.noticePeriodDays} days` : '—'],
                  ['Source', application.source||'—'],['Applied', application.createdAt ? new Date(application.createdAt).toLocaleDateString() : '—'],
                ].map(([l,v]) => <div key={l}><span className="text-slate-500">{l}: </span><span className="font-medium text-slate-800">{v}</span></div>)}
              </div>
              {application.coverLetter && <div className="text-sm text-slate-700 bg-slate-50 rounded-xl p-4"><div className="text-xs font-semibold text-slate-500 uppercase mb-1">Cover Letter</div>{application.coverLetter}</div>}
              <div className="flex gap-2 flex-wrap pt-2 border-t border-slate-100">
                {canAdvance && <Btn variant="primary" onClick={() => stageMut.mutate({ stage: NEXT[application.stage], note: '' })}>Move to {NEXT[application.stage]}</Btn>}
                <Btn onClick={() => setScheduleOpen(true)}>Schedule Interview</Btn>
                {!['rejected','withdrawn'].includes(application.stage) && <Btn variant="danger" onClick={() => stageMut.mutate({ stage: 'rejected', note: '' })}>Reject</Btn>}
              </div>
            </div>
          )}
          {tab === 'history' && (
            <div className="space-y-0">
              {[...(application.stageHistory ?? [])].reverse().map((h: any, i: number) => (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-7 h-7 rounded-full bg-white border-2 border-[#0C447C] flex items-center justify-center shrink-0">
                      <div className="w-2 h-2 rounded-full bg-[#0C447C]" />
                    </div>
                    {i < (application.stageHistory?.length - 1) && <div className="w-0.5 flex-1 bg-slate-200 my-1" />}
                  </div>
                  <div className="pb-4 pt-1 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Badge v={APP_STAGE_V[h.stage] ?? 'gray'}>{h.stage}</Badge>
                      <span className="text-xs text-slate-400">{h.movedAt ? new Date(h.movedAt).toLocaleString() : ''}</span>
                    </div>
                    {h.note && <div className="text-xs text-slate-600">{h.note}</div>}
                  </div>
                </div>
              ))}
              {!application.stageHistory?.length && <div className="text-sm text-slate-400 text-center py-8">No history yet</div>}
            </div>
          )}
          {tab === 'interviews' && (
            <div className="space-y-2">
              <div className="text-xs text-slate-400 text-center py-4">Interview records linked to lifecycle system</div>
              <Btn onClick={() => setScheduleOpen(true)} variant="primary">+ Schedule Interview</Btn>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── CALENDAR VIEW ─────────────────────────────────────────────────────────────
function WeekCalendar({ interviews }: { interviews: any[] }) {
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date(); d.setHours(0,0,0,0);
    d.setDate(d.getDate() - d.getDay() + 1);
    return d;
  });
  const days = Array.from({ length: 5 }, (_, i) => { const d = new Date(weekStart); d.setDate(d.getDate() + i); return d; });
  const hours = Array.from({ length: 10 }, (_, i) => i + 8);
  const [popup, setPopup] = useState<any>(null);

  const ivForSlot = (day: Date, hour: number) => interviews.filter(iv => {
    const d = new Date(iv.scheduledAt);
    return d.getFullYear() === day.getFullYear() && d.getMonth() === day.getMonth() &&
      d.getDate() === day.getDate() && d.getHours() === hour;
  });

  const prev = () => { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d); };
  const next = () => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d); };
  const today = () => { const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate() - d.getDay() + 1); setWeekStart(d); };

  const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 4);
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <Btn onClick={prev}><ChevronLeft className="w-3.5 h-3.5" /></Btn>
        <span className="text-sm font-medium text-slate-700">{fmt(weekStart)} – {fmt(weekEnd)}</span>
        <Btn onClick={next}><ChevronRight className="w-3.5 h-3.5" /></Btn>
        <Btn onClick={today}>Today</Btn>
      </div>
      {popup && (
        <div className="mb-3 bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-800">{popup.candidateName}</div>
            <div className="text-xs text-slate-500">{popup.jobTitle} · Round {popup.round} · {new Date(popup.scheduledAt).toLocaleTimeString()}</div>
            {popup.venue && <div className="text-xs text-slate-500">📍 {popup.venue}</div>}
            {popup.interviewers?.length > 0 && <div className="text-xs text-slate-500">👥 {popup.interviewers.join(', ')}</div>}
          </div>
          <button onClick={() => setPopup(null)}><X className="w-4 h-4 text-slate-400" /></button>
        </div>
      )}
      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          <div className="grid text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-200 pb-1 mb-1"
            style={{ gridTemplateColumns: '50px repeat(5, 1fr)' }}>
            <div />
            {days.map(d => <div key={d.toISOString()} className="text-center py-1">{d.toLocaleDateString('en-US',{weekday:'short'})} {d.getDate()}</div>)}
          </div>
          {hours.map(h => (
            <div key={h} className="grid border-b border-slate-50" style={{ gridTemplateColumns: '50px repeat(5, 1fr)' }}>
              <div className="text-xs text-slate-400 pr-2 pt-0.5 text-right">{h}:00</div>
              {days.map(d => {
                const ivs = ivForSlot(d, h);
                return (
                  <div key={d.toISOString()} className="border-l border-slate-100 min-h-[36px] p-0.5">
                    {ivs.map(iv => (
                      <div key={iv._id} onClick={() => setPopup(iv)}
                        className={`text-[10px] rounded px-1 py-0.5 cursor-pointer truncate mb-0.5 ${iv.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : iv.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                        {iv.candidateName}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── RECRUITMENT TAB ─────────────────────────────────────────────────────────
function RecruitmentTab() {
  const qc = useQueryClient();
  const [sub, setSub] = useState(0);
  const [showCreateJob, setShowCreateJob] = useState(false);
  const [viewJobId, setViewJobId] = useState<string|null>(null);
  const [viewApp, setViewApp] = useState<any>(null);
  const [scheduleApp, setScheduleApp] = useState<any>(null);
  const [feedbackIv, setFeedbackIv] = useState<any>(null);
  const [ivView, setIvView] = useState<'list'|'calendar'>('list');
  const [appSearch, setAppSearch] = useState('');
  const [appJobFilter, setAppJobFilter] = useState('');
  const [appStageFilter, setAppStageFilter] = useState('');
  const [showHiringSettings, setShowHiringSettings] = useState(false);

  const { data: stats } = useQuery({ queryKey: ['recruitment-stats'], queryFn: hrService.getRecruitmentStats });
  const { data: jobs = [], isLoading: jobsLoading, refetch: refetchJobs } = useQuery({ queryKey: ['jobs'], queryFn: hrService.getJobs });
  const { data: applications = [], refetch: refetchApps } = useQuery({ queryKey: ['applications'], queryFn: hrService.getApplications });
  const { data: interviews = [], refetch: refetchInterviews } = useQuery({ queryKey: ['interviews'], queryFn: hrService.getInterviews });

  const jobsArr: any[] = Array.isArray(jobs) ? jobs : [];
  const appsArr: any[] = Array.isArray(applications) ? applications : [];
  const ivsArr: any[] = Array.isArray(interviews) ? interviews : [];

  const urgentCount = jobsArr.filter(j => j.isUrgent && j.status === 'active').length;
  const closingSoon = jobsArr.filter(j => {
    if (!j.applicationDeadline) return false;
    const diff = (new Date(j.applicationDeadline).getTime() - Date.now()) / 86400000;
    return diff >= 0 && diff <= 7 && j.status === 'active';
  }).length;

  const filteredApps = appsArr.filter(a => {
    const name = `${a.firstName} ${a.lastName} ${a.email}`.toLowerCase();
    if (appSearch && !name.includes(appSearch.toLowerCase())) return false;
    if (appJobFilter && a.jobId !== appJobFilter) return false;
    if (appStageFilter && a.stage !== appStageFilter) return false;
    return true;
  });

  const stageMut = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: string }) => hrService.updateAppStage(id, stage, ''),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['applications'] }); qc.invalidateQueries({ queryKey: ['recruitment-stats'] }); toast.success('Stage updated'); },
    onError: () => toast.error('Update failed'),
  });
  const jobMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => hrService.updateJob(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['jobs'] }); qc.invalidateQueries({ queryKey: ['recruitment-stats'] }); toast.success('Job updated'); },
    onError: () => toast.error('Update failed'),
  });

  return (
    <div>
      {showCreateJob && <CreateJobModal onClose={() => setShowCreateJob(false)} onSaved={() => setShowCreateJob(false)} />}
      {viewJobId && <JobDetailModal jobId={viewJobId} onClose={() => setViewJobId(null)} />}
      {viewApp && <ApplicationDetailModal application={viewApp} onClose={() => setViewApp(null)} />}
      {scheduleApp && <ScheduleInterviewModal application={scheduleApp} existingCount={0} onClose={() => setScheduleApp(null)} onSaved={() => { setScheduleApp(null); refetchInterviews(); }} />}
      {feedbackIv && <InterviewFeedbackModal interview={feedbackIv} onClose={() => setFeedbackIv(null)} onSaved={() => { setFeedbackIv(null); refetchInterviews(); }} />}

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-slate-900">Recruitment</h1>
        <div className="flex gap-2">
          <Btn onClick={() => setShowHiringSettings(true)}>⚙️ Hiring Settings</Btn>
          <Btn variant="primary" onClick={() => setShowCreateJob(true)}><Plus className="w-3.5 h-3.5" /> Create Job Opening</Btn>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <KPI label="Total Jobs"          value={String(stats?.totalJobs ?? 0)}          color="navy" />
        <KPI label="Active Openings"     value={String(stats?.activeJobs ?? 0)}          color="green" />
        <KPI label="Total Applications"  value={String(stats?.totalApplications ?? 0)}   color="blue" />
        <KPI label="Pending Interviews"  value={String(stats?.pendingInterviews ?? 0)}   color="amber" />
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-0.5 bg-slate-100 rounded-lg p-1 w-fit mb-4">
        {['Job Openings','Applications','Interview Schedule'].map((t, i) => (
          <button key={t} onClick={() => setSub(i)}
            className={`px-4 py-1.5 text-sm rounded-md font-medium transition-colors ${sub === i ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {t}{i === 0 && jobsArr.length > 0 ? ` (${jobsArr.length})` : ''}{i === 1 && appsArr.length > 0 ? ` (${appsArr.length})` : ''}{i === 2 && ivsArr.length > 0 ? ` (${ivsArr.length})` : ''}
          </button>
        ))}
      </div>

      {/* ── SUB-TAB 0: JOB OPENINGS ── */}
      {sub === 0 && (
        <div>
          {closingSoon > 0 && <Alert type="warning">⚠ {closingSoon} position{closingSoon > 1 ? 's' : ''} closing within 7 days.</Alert>}
          {jobsLoading ? <div className="text-sm text-slate-400 text-center py-8">Loading jobs…</div> : (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <THead cols={["Job Title","Campus · Dept","Type","Vacancies","Applications","Status","Deadline","Actions"]} />
                  <tbody>
                    {jobsArr.length === 0 && (
                      <tr><td colSpan={8} className="text-center py-8 text-slate-400 text-sm">No job openings yet. Click "Create Job Opening" to start.</td></tr>
                    )}
                    {jobsArr.map((j: any) => {
                      const daysLeft = j.applicationDeadline ? Math.ceil((new Date(j.applicationDeadline).getTime() - Date.now()) / 86400000) : null;
                      return (
                        <tr key={j._id} className="border-b border-slate-50 hover:bg-slate-50">
                          <Td>
                            <div className="font-medium flex items-center gap-1">
                              {j.isUrgent && <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                              {j.title}
                            </div>
                            <div className="text-xs text-slate-400">{j.jobCode}</div>
                          </Td>
                          <Td><div>{j.campusName || '—'}</div><div className="text-xs text-slate-400">{j.department}</div></Td>
                          <Td className="capitalize">{j.type?.replace('_',' ')}</Td>
                          <Td>{j.vacancies}</Td>
                          <Td>{j.applicationsCount ?? 0}</Td>
                          <Td><Badge v={JOB_STATUS_V[j.status] ?? 'gray'}>{j.status}</Badge></Td>
                          <Td className={daysLeft !== null && daysLeft <= 7 && daysLeft >= 0 ? 'text-red-600 font-medium' : ''}>
                            {j.applicationDeadline ? new Date(j.applicationDeadline).toLocaleDateString() : '—'}
                            {daysLeft !== null && daysLeft >= 0 && daysLeft <= 7 && <div className="text-xs">{daysLeft}d left</div>}
                          </Td>
                          <Td>
                            <div className="flex gap-1 flex-wrap">
                              <Btn onClick={() => setViewJobId(j._id)}>View</Btn>
                              {j.status === 'draft' && <Btn variant="primary" onClick={() => jobMut.mutate({ id: j._id, data: { status: 'active', isPublished: true } })}>Activate</Btn>}
                              {j.status === 'active' && <Btn onClick={() => jobMut.mutate({ id: j._id, data: { status: 'paused' } })}>Pause</Btn>}
                              {j.status === 'paused' && <Btn variant="primary" onClick={() => jobMut.mutate({ id: j._id, data: { status: 'active' } })}>Resume</Btn>}
                              {!['closed','filled','cancelled'].includes(j.status) && <Btn variant="danger" onClick={() => jobMut.mutate({ id: j._id, data: { status: 'closed' } })}>Close</Btn>}
                            </div>
                          </Td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ── SUB-TAB 1: APPLICATIONS ── */}
      {sub === 1 && (
        <div>
          {/* Filter bar */}
          <div className="flex gap-2 mb-3 flex-wrap">
            <input value={appSearch} onChange={e => setAppSearch(e.target.value)} placeholder="Search name / email…"
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0C447C]/20 focus:border-[#0C447C] w-52" />
            <select value={appJobFilter} onChange={e => setAppJobFilter(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none w-48">
              <option value="">All Jobs</option>
              {jobsArr.map(j => <option key={j._id} value={j._id}>{j.title}</option>)}
            </select>
            <select value={appStageFilter} onChange={e => setAppStageFilter(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none w-40">
              <option value="">All Stages</option>
              {APP_STAGES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
            </select>
            {(appSearch || appJobFilter || appStageFilter) &&
              <Btn onClick={() => { setAppSearch(''); setAppJobFilter(''); setAppStageFilter(''); }}>Clear</Btn>}
          </div>
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <THead cols={["Applicant","Job","Experience","Qualification","Source","Stage","Applied","Actions"]} />
                <tbody>
                  {filteredApps.length === 0 && (
                    <tr><td colSpan={8} className="text-center py-8 text-slate-400 text-sm">
                      {appsArr.length === 0 ? 'No applications yet.' : 'No applications match your filters.'}
                    </td></tr>
                  )}
                  {filteredApps.map((a: any) => (
                    <tr key={a._id} className="border-b border-slate-50 hover:bg-slate-50">
                      <Td>
                        <div className="font-medium">{a.firstName} {a.lastName}</div>
                        <div className="text-xs text-slate-400">{a.email}</div>
                      </Td>
                      <Td><div>{a.jobTitle || '—'}</div><div className="text-xs text-slate-400">{a.jobCode}</div></Td>
                      <Td>{a.yearsOfExperience != null ? `${a.yearsOfExperience} yrs` : '—'}</Td>
                      <Td>{a.highestQualification || '—'}</Td>
                      <Td className="capitalize">{a.source?.replace('_',' ') || '—'}</Td>
                      <Td><Badge v={APP_STAGE_V[a.stage] ?? 'gray'}>{a.stage}</Badge></Td>
                      <Td>{a.createdAt ? new Date(a.createdAt).toLocaleDateString() : '—'}</Td>
                      <Td>
                        <div className="flex gap-1 flex-wrap">
                          <Btn onClick={() => setViewApp(a)}>View</Btn>
                          {!['rejected','withdrawn','hired'].includes(a.stage) &&
                            <Btn onClick={() => setScheduleApp(a)}>Interview</Btn>}
                          {!['rejected','withdrawn'].includes(a.stage) &&
                            <Btn variant="danger" onClick={() => stageMut.mutate({ id: a._id, stage: 'rejected' })}>Reject</Btn>}
                        </div>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ── SUB-TAB 2: INTERVIEW SCHEDULE ── */}
      {sub === 2 && (
        <div>
          <div className="flex gap-2 mb-3">
            <Btn onClick={() => setIvView('list')} variant={ivView === 'list' ? 'primary' : 'secondary'}>List View</Btn>
            <Btn onClick={() => setIvView('calendar')} variant={ivView === 'calendar' ? 'primary' : 'secondary'}>Calendar View</Btn>
          </div>
          {ivView === 'calendar' ? (
            <Card className="p-4"><WeekCalendar interviews={ivsArr} /></Card>
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <THead cols={["Candidate","Job","Round","Type","Date & Time","Venue","Interviewers","Status","Actions"]} />
                  <tbody>
                    {ivsArr.length === 0 && (
                      <tr><td colSpan={9} className="text-center py-8 text-slate-400 text-sm">No interviews scheduled yet.</td></tr>
                    )}
                    {ivsArr.map((iv: any) => (
                      <tr key={iv._id} className="border-b border-slate-50 hover:bg-slate-50">
                        <Td><div className="font-medium">{iv.candidateName || '—'}</div></Td>
                        <Td><div>{iv.jobTitle || '—'}</div><div className="text-xs text-slate-400">{iv.jobCode}</div></Td>
                        <Td>Round {iv.round}</Td>
                        <Td className="capitalize">{iv.type?.replace('_',' ')}</Td>
                        <Td>
                          <div>{iv.scheduledAt ? new Date(iv.scheduledAt).toLocaleDateString() : '—'}</div>
                          <div className="text-xs text-slate-400">{iv.scheduledAt ? new Date(iv.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</div>
                        </Td>
                        <Td>{iv.venue || iv.meetingLink || '—'}</Td>
                        <Td>{(iv.interviewers as string[])?.join(', ') || '—'}</Td>
                        <Td><Badge v={IV_STATUS_V[iv.status] ?? 'gray'}>{iv.status}</Badge></Td>
                        <Td>
                          <div className="flex gap-1">
                            {iv.status === 'scheduled' && <Btn variant="primary" onClick={() => setFeedbackIv(iv)}>Feedback</Btn>}
                            {iv.status === 'completed' && iv.overallRating && <span className="text-amber-500 text-xs font-medium">★ {iv.overallRating}</span>}
                          </div>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}
      {showHiringSettings && <HiringSettingsModal onClose={() => setShowHiringSettings(false)} />}
    </div>
  );
}

function HiringSettingsModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const { data: settings, isLoading } = useQuery({ queryKey: ['hiring-settings'], queryFn: hrService.getHiringSettings });
  const [form, setForm] = useState<any | null>(null);

  useEffect(() => {
    if (settings && !form) setForm(settings);
  }, [settings]);

  const saveMut = useMutation({
    mutationFn: (payload: any) => hrService.updateHiringSettings(payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['hiring-settings'] }); toast.success('Hiring settings saved'); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to save settings'),
  });

  if (isLoading || !form) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-10 text-center text-sm text-slate-400 animate-pulse">Loading hiring settings…</div>
      </div>
    );
  }

  function updateStage(idx: number, field: 'name' | 'order', value: string) {
    const list = [...(form.interviewStages || [])];
    list[idx] = { ...list[idx], [field]: field === 'order' ? Number(value) || 0 : value };
    setForm({ ...form, interviewStages: list });
  }
  function removeStage(idx: number) {
    setForm({ ...form, interviewStages: form.interviewStages.filter((_: any, i: number) => i !== idx) });
  }
  function addStage() {
    setForm({ ...form, interviewStages: [...(form.interviewStages || []), { name: '', order: (form.interviewStages?.length || 0) + 1 }] });
  }
  function updateQuestion(idx: number, value: string) {
    const list = [...(form.defaultScreeningQuestions || [])];
    list[idx] = value;
    setForm({ ...form, defaultScreeningQuestions: list });
  }
  function removeQuestion(idx: number) {
    setForm({ ...form, defaultScreeningQuestions: form.defaultScreeningQuestions.filter((_: any, i: number) => i !== idx) });
  }
  function addQuestion() {
    setForm({ ...form, defaultScreeningQuestions: [...(form.defaultScreeningQuestions || []), ''] });
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col" style={{ maxHeight: '85vh' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div>
            <div className="font-bold text-slate-900">Hiring Settings</div>
            <p className="text-xs text-slate-400 mt-0.5">Interview pipeline stages, offer letter template, and default screening questions</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-slate-700">Interview Pipeline Stages</p>
              <button onClick={addStage} className="text-xs text-[#0C447C] font-medium hover:underline">+ Add stage</button>
            </div>
            <div className="space-y-2">
              {(form.interviewStages || []).sort((a: any, b: any) => a.order - b.order).map((s: any, i: number) => (
                <div key={i} className="flex gap-2 items-center">
                  <input type="number" value={s.order} onChange={(e) => updateStage(i, 'order', e.target.value)} className="w-14 px-2 py-1.5 text-xs border border-slate-200 rounded-lg" />
                  <input value={s.name} onChange={(e) => updateStage(i, 'name', e.target.value)} placeholder="Stage name" className="flex-1 px-2 py-1.5 text-xs border border-slate-200 rounded-lg" />
                  <button onClick={() => removeStage(i)} className="px-2 text-red-400 hover:text-red-600 text-xs">✕</button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-700 mb-2">Offer Letter Template</p>
            <textarea value={form.offerLetterTemplate || ''} onChange={(e) => setForm({ ...form, offerLetterTemplate: e.target.value })}
              rows={5} placeholder="Use placeholders like {{candidateName}}, {{jobTitle}}, {{startDate}}, {{salary}}"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-slate-700">Default Screening Questions</p>
              <button onClick={addQuestion} className="text-xs text-[#0C447C] font-medium hover:underline">+ Add question</button>
            </div>
            <div className="space-y-2">
              {(form.defaultScreeningQuestions || []).map((q: string, i: number) => (
                <div key={i} className="flex gap-2">
                  <input value={q} onChange={(e) => updateQuestion(i, e.target.value)} placeholder="Question" className="flex-1 px-2 py-1.5 text-xs border border-slate-200 rounded-lg" />
                  <button onClick={() => removeQuestion(i)} className="px-2 text-red-400 hover:text-red-600 text-xs">✕</button>
                </div>
              ))}
              {(!form.defaultScreeningQuestions || form.defaultScreeningQuestions.length === 0) && <div className="text-xs text-slate-400">No screening questions yet.</div>}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100 shrink-0">
          <Btn onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" onClick={() => saveMut.mutate(form)}>{saveMut.isPending ? 'Saving…' : 'Save Settings'}</Btn>
        </div>
      </div>
    </div>
  );
}

// ─── ONBOARDING TAB ───────────────────────────────────────────────────────────
interface OnboardingEmployee {
  _id: string;
  firstName: string;
  lastName: string;
  positionTitle?: string;
  department?: string;
  onboardingChecklist: Array<{ task: string; category: string; isDone: boolean; doneAt?: string }>;
}

const CATEGORY_LABEL: Record<string, string> = {
  documents: 'Documents',
  access: 'System Access',
  training: 'Training & Orientation',
  equipment: 'Equipment & Setup',
  introduction: 'Introductions',
};

function OnboardingTab() {
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [localEmployee, setLocalEmployee] = useState<OnboardingEmployee | null>(null);
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set());
  const [showConfirmConvert, setShowConfirmConvert] = useState(false);
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [newTask, setNewTask] = useState({ task: '', category: 'documents' });

  const { data: onboardingList = [], isLoading, refetch } = useQuery({
    queryKey: ['onboarding-employees'],
    queryFn: hrService.getOnboardingEmployees,
    refetchInterval: 30000,
  });

  const typedList = onboardingList as OnboardingEmployee[];

  const selectedEmployee = typedList.find(e => e._id === selectedId) ?? typedList[0] ?? null;

  useEffect(() => {
    if (typedList.length > 0 && !selectedId) {
      setSelectedId(typedList[0]._id);
    }
  }, [typedList, selectedId]);

  useEffect(() => {
    if (selectedEmployee) setLocalEmployee(selectedEmployee);
  }, [selectedEmployee]);

  const checklist = localEmployee?.onboardingChecklist ?? [];
  const total = checklist.length;
  const done = checklist.filter(t => t.isDone).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const allDone = total > 0 && done === total;

  const cats = Array.from(new Set(checklist.map(t => t.category)));

  const toggleTask = async (taskIndex: number) => {
    if (!localEmployee) return;
    const newIsDone = !localEmployee.onboardingChecklist[taskIndex].isDone;
    const newChecklist = localEmployee.onboardingChecklist.map((t, i) =>
      i === taskIndex
        ? { ...t, isDone: newIsDone, doneAt: newIsDone ? new Date().toISOString() : undefined }
        : t
    );
    setLocalEmployee({ ...localEmployee, onboardingChecklist: newChecklist });
    try {
      await hrService.updateOnboardingTask(localEmployee._id, taskIndex, newIsDone);
      refetch();
      toast.success(newIsDone ? 'Task marked complete' : 'Task unmarked');
    } catch {
      setLocalEmployee(selectedEmployee);
      toast.error('Failed to update task');
    }
  };

  const toggleCat = (cat: string) => {
    setCollapsedCats(prev => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  const convertMut = useMutation({
    mutationFn: () => hrService.completeOnboarding(localEmployee!._id),
    onSuccess: () => {
      const prevId = localEmployee?._id;
      setShowConfirmConvert(false);
      setLocalEmployee(null);
      refetch();
      qc.invalidateQueries({ queryKey: ['lifecycle'] });
      toast.success('Employee is now active!');
      const remaining = typedList.filter(e => e._id !== prevId);
      setSelectedId(remaining[0]?._id ?? null);
    },
    onError: () => toast.error('Failed to convert employee'),
  });

  const saveNewTask = async () => {
    if (!localEmployee || !newTask.task.trim()) return;
    const updated = [
      ...localEmployee.onboardingChecklist,
      { task: newTask.task.trim(), category: newTask.category, isDone: false },
    ];
    try {
      await hrService.updateCandidate(localEmployee._id, { onboardingChecklist: updated });
      refetch();
      toast.success('Task added');
      setNewTask({ task: '', category: 'documents' });
      setAddTaskOpen(false);
    } catch {
      toast.error('Failed to add task');
    }
  };

  if (isLoading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-bold text-slate-900">Employee Onboarding</h1>
        </div>
        <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 2fr' }}>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-xl border border-slate-100 p-4 animate-pulse">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-slate-200 rounded w-3/4" />
                    <div className="h-2.5 bg-slate-100 rounded w-1/2" />
                  </div>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full" />
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl border border-slate-100 p-6 animate-pulse space-y-4">
            <div className="h-4 bg-slate-200 rounded w-1/3" />
            <div className="h-2 bg-slate-100 rounded-full w-full" />
            {[1, 2, 3, 4].map(i => <div key={i} className="h-10 bg-slate-50 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-slate-900">Employee Onboarding</h1>
        <Badge v={typedList.length > 0 ? 'amber' : 'gray'}>
          {typedList.length} {typedList.length === 1 ? 'Employee' : 'Employees'} in Onboarding
        </Badge>
      </div>

      {typedList.length === 0 ? (
        <Card className="py-16 text-center">
          <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <div className="text-slate-500 font-medium">No employees in onboarding</div>
          <div className="text-xs text-slate-400 mt-1">Candidates move here after accepting an offer</div>
        </Card>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 2fr' }}>
          {/* LEFT — Employee list */}
          <div className="space-y-2 overflow-y-auto max-h-[70vh] pr-1">
            {typedList.map(emp => {
              const cl = emp.onboardingChecklist ?? [];
              const empDone = cl.filter(t => t.isDone).length;
              const empTotal = cl.length;
              const empPct = empTotal > 0 ? Math.round((empDone / empTotal) * 100) : 0;
              const isSelected = emp._id === (selectedId ?? typedList[0]?._id);
              return (
                <button
                  key={emp._id}
                  onClick={() => setSelectedId(emp._id)}
                  className={`w-full text-left rounded-xl border p-4 transition-all ${isSelected ? 'border-[#0C447C] bg-blue-50 shadow-sm' : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50'}`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                      style={{ background: avatarColor(emp._id) }}
                    >
                      {lcInitials(emp)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-slate-800 truncate">{emp.firstName} {emp.lastName}</div>
                      <div className="text-xs text-slate-500 truncate">{emp.positionTitle || emp.department || '—'}</div>
                    </div>
                    {empPct === 100 && <span className="text-emerald-500 text-xs">✓</span>}
                  </div>
                  <PBar pct={empPct} color={empPct === 100 ? '#10b981' : '#0C447C'} />
                  <div className="flex justify-between mt-1.5">
                    <span className="text-xs text-slate-500">{empDone} of {empTotal} done</span>
                    <span className={`text-xs font-semibold ${empPct === 100 ? 'text-emerald-600' : 'text-[#0C447C]'}`}>{empPct}%</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* RIGHT — Checklist */}
          {localEmployee && (
            <Card>
              {/* Header */}
              <div className="px-5 py-4 border-b border-slate-100">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <div className="font-bold text-slate-900">{localEmployee.firstName} {localEmployee.lastName}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{localEmployee.positionTitle || localEmployee.department || '—'}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs text-slate-500">{done} of {total} complete</div>
                    <div className={`text-sm font-bold ${pct === 100 ? 'text-emerald-600' : 'text-[#0C447C]'}`}>{pct}%</div>
                  </div>
                </div>
                <PBar pct={pct} color={pct === 100 ? '#10b981' : '#0C447C'} />
              </div>

              {/* All-done banner */}
              {allDone && (
                <div className="mx-5 mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <div className="text-sm font-semibold text-emerald-700">All tasks complete!</div>
                      <div className="text-xs text-emerald-600">Ready to mark as Active Employee</div>
                    </div>
                  </div>
                  {showConfirmConvert ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-slate-600">Confirm?</span>
                      <Btn variant="success" onClick={() => convertMut.mutate()}>
                        {convertMut.isPending ? 'Converting…' : 'Yes, Convert'}
                      </Btn>
                      <Btn onClick={() => setShowConfirmConvert(false)}>Cancel</Btn>
                    </div>
                  ) : (
                    <Btn variant="primary" onClick={() => setShowConfirmConvert(true)}>
                      Convert to Active Employee
                    </Btn>
                  )}
                </div>
              )}

              {/* Checklist grouped by category */}
              <div className="p-4 space-y-3">
                {checklist.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-sm">No checklist items yet</div>
                ) : (
                  cats.map(cat => {
                    const catTasks = checklist
                      .map((t, i) => ({ ...t, _idx: i }))
                      .filter(t => t.category === cat);
                    const catDone = catTasks.filter(t => t.isDone).length;
                    const isCollapsed = collapsedCats.has(cat);
                    return (
                      <div key={cat} className="border border-slate-200 rounded-xl overflow-hidden">
                        <button
                          onClick={() => toggleCat(cat)}
                          className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span>{CATEGORY_ICON[cat] ?? '📋'}</span>
                            <span className="text-sm font-semibold text-slate-700">
                              {CATEGORY_LABEL[cat] ?? cat}
                            </span>
                            <span className="text-xs text-slate-400">({catDone}/{catTasks.length} done)</span>
                          </div>
                          {isCollapsed
                            ? <ChevronDown size={14} className="text-slate-400" />
                            : <ChevronUp size={14} className="text-slate-400" />}
                        </button>
                        {!isCollapsed && (
                          <div className="divide-y divide-slate-50">
                            {catTasks.map(task => (
                              <div key={task._idx} className="flex items-start gap-3 px-4 py-3">
                                <button
                                  onClick={() => toggleTask(task._idx)}
                                  className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${task.isDone ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 hover:border-[#0C447C]'}`}
                                >
                                  {task.isDone && <span className="text-[10px] leading-none">✓</span>}
                                </button>
                                <div className="flex-1 min-w-0">
                                  <div className={`text-sm ${task.isDone ? 'line-through text-slate-400' : 'font-medium text-slate-800'}`}>
                                    {task.task}
                                  </div>
                                  {task.isDone ? (
                                    <div className="text-xs text-slate-400 mt-0.5">
                                      Done{task.doneAt ? ` on ${new Date(task.doneAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : ''}
                                    </div>
                                  ) : (
                                    <div className="text-xs text-amber-500 font-medium mt-0.5">Pending</div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}

                {/* Add task */}
                {addTaskOpen ? (
                  <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50">
                    <div className="text-xs font-semibold text-slate-600">Add New Task</div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Task name</label>
                      <input
                        value={newTask.task}
                        onChange={e => setNewTask(p => ({ ...p, task: e.target.value }))}
                        placeholder="e.g. Submit passport copy"
                        className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0C447C]/20 focus:border-[#0C447C]"
                        onKeyDown={e => e.key === 'Enter' && saveNewTask()}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Category</label>
                      <select
                        value={newTask.category}
                        onChange={e => setNewTask(p => ({ ...p, category: e.target.value }))}
                        className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#0C447C]"
                      >
                        {Object.entries(CATEGORY_LABEL).map(([key, label]) => (
                          <option key={key} value={key}>{CATEGORY_ICON[key] ?? '📋'} {label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <Btn variant="primary" onClick={saveNewTask}>Add Task</Btn>
                      <Btn onClick={() => { setAddTaskOpen(false); setNewTask({ task: '', category: 'documents' }); }}>Cancel</Btn>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setAddTaskOpen(true)}
                    className="flex items-center gap-1.5 text-xs text-[#0C447C] hover:underline font-medium pt-1"
                  >
                    <Plus size={13} />Add Task
                  </button>
                )}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

// ─── SHARED MODAL HELPER ──────────────────────────────────────────────────────
function ModalShell({ title, onClose, children, footer, wide }: {
  title: string; onClose: () => void; children: React.ReactNode;
  footer?: React.ReactNode; wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className={`bg-white rounded-2xl shadow-xl w-full ${wide ? 'max-w-3xl' : 'max-w-xl'} my-4`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="font-bold text-slate-900">{title}</div>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">{children}</div>
        {footer && <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100">{footer}</div>}
      </div>
    </div>
  );
}

// ─── LEAVE POLICY MODALS ──────────────────────────────────────────────────────
function CreatePolicyModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    name: '', code: '', applicableTo: 'all', isDefault: false,
    annualDays: 21, sickDays: 10, casualDays: 10, maternityDays: 90,
    paternityDays: 10, emergencyDays: 3, studyDays: 5, unpaidDays: 0, hajjDays: 0,
    allowCarryForward: false, maxCarryForwardDays: 0,
    allowEncashment: false, maxEncashmentDays: 0,
    allowedDuringProbation: false, probationAnnualDays: 0,
  });

  const mut = useMutation({
    mutationFn: () => hrService.createLeavePolicy({
      name: form.name, code: form.code, applicableTo: form.applicableTo,
      isDefault: form.isDefault,
      annualDays: form.annualDays, sickDays: form.sickDays,
      casualDays: form.casualDays, maternityDays: form.maternityDays,
      paternityDays: form.paternityDays, emergencyDays: form.emergencyDays,
      studyDays: form.studyDays, unpaidDays: form.unpaidDays, hajjDays: form.hajjDays,
      allowCarryForward: form.allowCarryForward,
      maxCarryForwardDays: form.allowCarryForward ? form.maxCarryForwardDays : 0,
      allowEncashment: form.allowEncashment,
      maxEncashmentDays: form.allowEncashment ? form.maxEncashmentDays : 0,
      allowedDuringProbation: form.allowedDuringProbation,
      probationAnnualDays: form.allowedDuringProbation ? form.probationAnnualDays : 0,
    }),
    onSuccess: () => { toast.success('Leave policy created'); onSuccess(); onClose(); },
    onError: () => toast.error('Failed to create policy'),
  });

  const canSubmit = form.name.length > 0 && form.code.length > 0;

  return (
    <ModalShell title="Create Leave Policy" onClose={onClose} wide
      footer={<><Btn onClick={onClose}>Cancel</Btn><Btn variant="primary" onClick={() => mut.mutate()} disabled={!canSubmit || mut.isPending}>{mut.isPending ? 'Creating…' : 'Create Policy'}</Btn></>}>

      <div className="grid grid-cols-2 gap-3">
        <WF label="Policy Name" required>
          <input value={form.name} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))} className={WIC} placeholder="e.g. Standard Teacher Policy" />
        </WF>
        <WF label="Code" required>
          <input value={form.code} onChange={e => setForm(prev => ({ ...prev, code: e.target.value }))} className={WIC} placeholder="e.g. STP-2025" />
        </WF>
        <WF label="Applicable To">
          <select value={form.applicableTo} onChange={e => setForm(prev => ({ ...prev, applicableTo: e.target.value }))} className={WIC}>
            {[['all','All Staff'],['permanent','Permanent'],['contract','Contract'],['part_time','Part Time'],['visiting','Visiting']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </WF>
        <WF label="Is Default Policy">
          <label className="flex items-center gap-2 mt-1.5 cursor-pointer">
            <input type="checkbox" checked={form.isDefault} onChange={e => setForm(prev => ({ ...prev, isDefault: e.target.checked }))} className="w-4 h-4 accent-[#0C447C]" />
            <span className="text-sm text-slate-700">Set as default policy</span>
          </label>
        </WF>
      </div>

      <div>
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Leave Entitlements</div>
        <div className="grid grid-cols-2 gap-3">
          <WF label="Annual Leave Days" required>
            <input type="number" min={0} value={form.annualDays} onChange={e => setForm(prev => ({ ...prev, annualDays: Number(e.target.value) }))} className={WIC} />
          </WF>
          <WF label="Sick Leave Days" required>
            <input type="number" min={0} value={form.sickDays} onChange={e => setForm(prev => ({ ...prev, sickDays: Number(e.target.value) }))} className={WIC} />
          </WF>
          <WF label="Casual Leave Days" required>
            <input type="number" min={0} value={form.casualDays} onChange={e => setForm(prev => ({ ...prev, casualDays: Number(e.target.value) }))} className={WIC} />
          </WF>
          <WF label="Maternity Leave Days">
            <input type="number" min={0} value={form.maternityDays} onChange={e => setForm(prev => ({ ...prev, maternityDays: Number(e.target.value) }))} className={WIC} />
          </WF>
          <WF label="Paternity Leave Days">
            <input type="number" min={0} value={form.paternityDays} onChange={e => setForm(prev => ({ ...prev, paternityDays: Number(e.target.value) }))} className={WIC} />
          </WF>
          <WF label="Emergency Leave Days">
            <input type="number" min={0} value={form.emergencyDays} onChange={e => setForm(prev => ({ ...prev, emergencyDays: Number(e.target.value) }))} className={WIC} />
          </WF>
          <WF label="Study Leave Days">
            <input type="number" min={0} value={form.studyDays} onChange={e => setForm(prev => ({ ...prev, studyDays: Number(e.target.value) }))} className={WIC} />
          </WF>
          <WF label="Unpaid Days Allowed">
            <input type="number" min={0} value={form.unpaidDays} onChange={e => setForm(prev => ({ ...prev, unpaidDays: Number(e.target.value) }))} className={WIC} />
          </WF>
          <WF label="Hajj Leave Days">
            <input type="number" min={0} value={form.hajjDays} onChange={e => setForm(prev => ({ ...prev, hajjDays: Number(e.target.value) }))} className={WIC} />
          </WF>
        </div>
      </div>

      <div>
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Carry Forward Rules</div>
        <label className="flex items-center gap-2 cursor-pointer mb-2">
          <input type="checkbox" checked={form.allowCarryForward} onChange={e => setForm(prev => ({ ...prev, allowCarryForward: e.target.checked }))} className="w-4 h-4 accent-[#0C447C]" />
          <span className="text-sm text-slate-700">Allow Carry Forward</span>
        </label>
        {form.allowCarryForward && (
          <WF label="Max Carry Forward Days">
            <input type="number" min={0} value={form.maxCarryForwardDays} onChange={e => setForm(prev => ({ ...prev, maxCarryForwardDays: Number(e.target.value) }))} className={WIC} />
          </WF>
        )}
      </div>

      <div>
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Encashment Rules</div>
        <label className="flex items-center gap-2 cursor-pointer mb-2">
          <input type="checkbox" checked={form.allowEncashment} onChange={e => setForm(prev => ({ ...prev, allowEncashment: e.target.checked }))} className="w-4 h-4 accent-[#0C447C]" />
          <span className="text-sm text-slate-700">Allow Encashment</span>
        </label>
        {form.allowEncashment && (
          <WF label="Max Encashment Days">
            <input type="number" min={0} value={form.maxEncashmentDays} onChange={e => setForm(prev => ({ ...prev, maxEncashmentDays: Number(e.target.value) }))} className={WIC} />
          </WF>
        )}
      </div>

      <div>
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Probation Rules</div>
        <label className="flex items-center gap-2 cursor-pointer mb-2">
          <input type="checkbox" checked={form.allowedDuringProbation} onChange={e => setForm(prev => ({ ...prev, allowedDuringProbation: e.target.checked }))} className="w-4 h-4 accent-[#0C447C]" />
          <span className="text-sm text-slate-700">Leave Allowed During Probation</span>
        </label>
        {form.allowedDuringProbation && (
          <WF label="Probation Annual Days">
            <input type="number" min={0} value={form.probationAnnualDays} onChange={e => setForm(prev => ({ ...prev, probationAnnualDays: Number(e.target.value) }))} className={WIC} />
          </WF>
        )}
      </div>
    </ModalShell>
  );
}

function EditPolicyModal({ policy, onClose, onSuccess }: { policy: any; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    name: policy.name ?? '', code: policy.code ?? '', applicableTo: policy.applicableTo ?? 'all', isDefault: !!policy.isDefault,
    annualDays: policy.annualDays ?? 21, sickDays: policy.sickDays ?? 10, casualDays: policy.casualDays ?? 10, maternityDays: policy.maternityDays ?? 90,
    paternityDays: policy.paternityDays ?? 10, emergencyDays: policy.emergencyDays ?? 3, studyDays: policy.studyDays ?? 5, unpaidDays: policy.unpaidDays ?? 0, hajjDays: policy.hajjDays ?? 0,
    allowCarryForward: !!policy.allowCarryForward, maxCarryForwardDays: policy.maxCarryForwardDays ?? 0,
    allowEncashment: !!policy.allowEncashment, maxEncashmentDays: policy.maxEncashmentDays ?? 0,
    allowedDuringProbation: !!policy.allowedDuringProbation, probationAnnualDays: policy.probationAnnualDays ?? 0,
  });

  const mut = useMutation({
    mutationFn: () => hrService.updateLeavePolicy(policy._id, {
      name: form.name, code: form.code, applicableTo: form.applicableTo,
      isDefault: form.isDefault,
      annualDays: form.annualDays, sickDays: form.sickDays,
      casualDays: form.casualDays, maternityDays: form.maternityDays,
      paternityDays: form.paternityDays, emergencyDays: form.emergencyDays,
      studyDays: form.studyDays, unpaidDays: form.unpaidDays, hajjDays: form.hajjDays,
      allowCarryForward: form.allowCarryForward,
      maxCarryForwardDays: form.allowCarryForward ? form.maxCarryForwardDays : 0,
      allowEncashment: form.allowEncashment,
      maxEncashmentDays: form.allowEncashment ? form.maxEncashmentDays : 0,
      allowedDuringProbation: form.allowedDuringProbation,
      probationAnnualDays: form.allowedDuringProbation ? form.probationAnnualDays : 0,
    }),
    onSuccess: () => { toast.success('Leave policy updated'); onSuccess(); onClose(); },
    onError: () => toast.error('Failed to update policy'),
  });

  const canSubmit = form.name.length > 0 && form.code.length > 0;

  return (
    <ModalShell title="Edit Leave Policy" onClose={onClose} wide
      footer={<><Btn onClick={onClose}>Cancel</Btn><Btn variant="primary" onClick={() => mut.mutate()} disabled={!canSubmit || mut.isPending}>{mut.isPending ? 'Saving…' : 'Save Changes'}</Btn></>}>

      <div className="grid grid-cols-2 gap-3">
        <WF label="Policy Name" required>
          <input value={form.name} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))} className={WIC} placeholder="e.g. Standard Teacher Policy" />
        </WF>
        <WF label="Code" required>
          <input value={form.code} onChange={e => setForm(prev => ({ ...prev, code: e.target.value }))} className={WIC} placeholder="e.g. STP-2025" />
        </WF>
        <WF label="Applicable To">
          <select value={form.applicableTo} onChange={e => setForm(prev => ({ ...prev, applicableTo: e.target.value }))} className={WIC}>
            {[['all','All Staff'],['permanent','Permanent'],['contract','Contract'],['part_time','Part Time'],['visiting','Visiting']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </WF>
        <WF label="Is Default Policy">
          <label className="flex items-center gap-2 mt-1.5 cursor-pointer">
            <input type="checkbox" checked={form.isDefault} onChange={e => setForm(prev => ({ ...prev, isDefault: e.target.checked }))} className="w-4 h-4 accent-[#0C447C]" />
            <span className="text-sm text-slate-700">Set as default policy</span>
          </label>
        </WF>
      </div>

      <div>
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Leave Entitlements</div>
        <div className="grid grid-cols-2 gap-3">
          <WF label="Annual Leave Days" required>
            <input type="number" min={0} value={form.annualDays} onChange={e => setForm(prev => ({ ...prev, annualDays: Number(e.target.value) }))} className={WIC} />
          </WF>
          <WF label="Sick Leave Days" required>
            <input type="number" min={0} value={form.sickDays} onChange={e => setForm(prev => ({ ...prev, sickDays: Number(e.target.value) }))} className={WIC} />
          </WF>
          <WF label="Casual Leave Days" required>
            <input type="number" min={0} value={form.casualDays} onChange={e => setForm(prev => ({ ...prev, casualDays: Number(e.target.value) }))} className={WIC} />
          </WF>
          <WF label="Maternity Leave Days">
            <input type="number" min={0} value={form.maternityDays} onChange={e => setForm(prev => ({ ...prev, maternityDays: Number(e.target.value) }))} className={WIC} />
          </WF>
          <WF label="Paternity Leave Days">
            <input type="number" min={0} value={form.paternityDays} onChange={e => setForm(prev => ({ ...prev, paternityDays: Number(e.target.value) }))} className={WIC} />
          </WF>
          <WF label="Emergency Leave Days">
            <input type="number" min={0} value={form.emergencyDays} onChange={e => setForm(prev => ({ ...prev, emergencyDays: Number(e.target.value) }))} className={WIC} />
          </WF>
          <WF label="Study Leave Days">
            <input type="number" min={0} value={form.studyDays} onChange={e => setForm(prev => ({ ...prev, studyDays: Number(e.target.value) }))} className={WIC} />
          </WF>
          <WF label="Unpaid Days Allowed">
            <input type="number" min={0} value={form.unpaidDays} onChange={e => setForm(prev => ({ ...prev, unpaidDays: Number(e.target.value) }))} className={WIC} />
          </WF>
          <WF label="Hajj Leave Days">
            <input type="number" min={0} value={form.hajjDays} onChange={e => setForm(prev => ({ ...prev, hajjDays: Number(e.target.value) }))} className={WIC} />
          </WF>
        </div>
      </div>

      <div>
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Carry Forward Rules</div>
        <label className="flex items-center gap-2 cursor-pointer mb-2">
          <input type="checkbox" checked={form.allowCarryForward} onChange={e => setForm(prev => ({ ...prev, allowCarryForward: e.target.checked }))} className="w-4 h-4 accent-[#0C447C]" />
          <span className="text-sm text-slate-700">Allow Carry Forward</span>
        </label>
        {form.allowCarryForward && (
          <WF label="Max Carry Forward Days">
            <input type="number" min={0} value={form.maxCarryForwardDays} onChange={e => setForm(prev => ({ ...prev, maxCarryForwardDays: Number(e.target.value) }))} className={WIC} />
          </WF>
        )}
      </div>

      <div>
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Encashment Rules</div>
        <label className="flex items-center gap-2 cursor-pointer mb-2">
          <input type="checkbox" checked={form.allowEncashment} onChange={e => setForm(prev => ({ ...prev, allowEncashment: e.target.checked }))} className="w-4 h-4 accent-[#0C447C]" />
          <span className="text-sm text-slate-700">Allow Encashment</span>
        </label>
        {form.allowEncashment && (
          <WF label="Max Encashment Days">
            <input type="number" min={0} value={form.maxEncashmentDays} onChange={e => setForm(prev => ({ ...prev, maxEncashmentDays: Number(e.target.value) }))} className={WIC} />
          </WF>
        )}
      </div>

      <div>
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Probation Rules</div>
        <label className="flex items-center gap-2 cursor-pointer mb-2">
          <input type="checkbox" checked={form.allowedDuringProbation} onChange={e => setForm(prev => ({ ...prev, allowedDuringProbation: e.target.checked }))} className="w-4 h-4 accent-[#0C447C]" />
          <span className="text-sm text-slate-700">Leave Allowed During Probation</span>
        </label>
        {form.allowedDuringProbation && (
          <WF label="Probation Annual Days">
            <input type="number" min={0} value={form.probationAnnualDays} onChange={e => setForm(prev => ({ ...prev, probationAnnualDays: Number(e.target.value) }))} className={WIC} />
          </WF>
        )}
      </div>
    </ModalShell>
  );
}

function BulkAssignModal({ policy, staffCount, onClose, onSuccess }: { policy: any; staffCount: number; onClose: () => void; onSuccess: () => void }) {
  const [academicYear, setAcademicYear] = useState('2025-2026');
  const mut = useMutation({
    mutationFn: () => hrService.bulkAssignLeavePolicy(policy._id, academicYear),
    onSuccess: (res: any) => {
      toast.success(`Policy assigned to ${res?.assignedCount ?? staffCount} staff members`);
      onSuccess();
      onClose();
    },
    onError: () => toast.error('Failed to assign policy'),
  });
  return (
    <ModalShell title={`Assign "${policy.name}" to All Staff`} onClose={onClose}
      footer={<><Btn onClick={onClose}>Cancel</Btn><Btn variant="primary" onClick={() => mut.mutate()} disabled={!academicYear || mut.isPending}>{mut.isPending ? 'Assigning…' : 'Confirm Assign'}</Btn></>}>
      <p className="text-sm text-slate-600">This will set leave balances for all <span className="font-semibold">{staffCount}</span> active staff members.</p>
      <WF label="Academic Year" required>
        <input value={academicYear} onChange={e => setAcademicYear(e.target.value)} className={WIC} placeholder="e.g. 2025-2026" />
      </WF>
    </ModalShell>
  );
}

function AssignPolicyModal({ staff, policies, onClose, onSuccess }: { staff: any; policies: any[]; onClose: () => void; onSuccess: () => void }) {
  const [policyId, setPolicyId] = useState('');
  const [academicYear, setAcademicYear] = useState('2025-2026');
  const mut = useMutation({
    mutationFn: () => hrService.assignLeavePolicy(policyId, staff._id, academicYear),
    onSuccess: () => { toast.success('Policy assigned'); onSuccess(); onClose(); },
    onError: () => toast.error('Failed to assign policy'),
  });
  return (
    <ModalShell title={`Assign Policy — ${staff.firstName} ${staff.lastName}`} onClose={onClose}
      footer={<><Btn onClick={onClose}>Cancel</Btn><Btn variant="primary" onClick={() => mut.mutate()} disabled={!policyId || !academicYear || mut.isPending}>{mut.isPending ? 'Assigning…' : 'Assign Policy'}</Btn></>}>
      <WF label="Policy" required>
        <select value={policyId} onChange={e => setPolicyId(e.target.value)} className={WIC}>
          <option value="">Select policy…</option>
          {policies.map((p: any) => <option key={p._id} value={p._id}>{p.name} ({p.code})</option>)}
        </select>
      </WF>
      <WF label="Academic Year" required>
        <input value={academicYear} onChange={e => setAcademicYear(e.target.value)} className={WIC} placeholder="e.g. 2025-2026" />
      </WF>
    </ModalShell>
  );
}

// Green when plenty remains, amber when running low, red when exhausted.
function balanceCellClass(remaining: number, entitled: number): string {
  if (entitled <= 0) return 'text-slate-400';
  const pct = (remaining / entitled) * 100;
  if (remaining <= 0) return 'text-red-600 font-semibold';
  if (pct <= 25) return 'text-amber-600 font-semibold';
  return 'text-emerald-600 font-semibold';
}

function exportLeaveBalancesToExcel(rows: any[]) {
  const headers = ['Staff Name', 'Employee ID', 'Department', 'Annual Allocated', 'Annual Used', 'Annual Remaining', 'Sick Allocated', 'Sick Used', 'Sick Remaining', 'Casual Allocated', 'Casual Used', 'Casual Remaining', 'Maternity Allocated', 'Maternity Used', 'Maternity Remaining', 'Paternity Allocated', 'Paternity Used', 'Paternity Remaining', 'Hajj Allocated', 'Hajj Used', 'Hajj Remaining'];
  const escape = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [headers.join(',')];
  rows.forEach((r: any) => {
    lines.push([
      r.staffName, r.employeeId, r.department,
      r.annual.entitled, r.annual.used, r.annual.remaining,
      r.sick.entitled, r.sick.used, r.sick.remaining,
      r.casual.entitled, r.casual.used, r.casual.remaining,
      r.maternity.entitled, r.maternity.used, r.maternity.remaining,
      r.paternity.entitled, r.paternity.used, r.paternity.remaining,
      r.hajj.entitled, r.hajj.used, r.hajj.remaining,
    ].map(escape).join(','));
  });
  const blob = new Blob([lines.join('\n')], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `leave_balances_${new Date().toISOString().slice(0, 10)}.xls`; a.click();
  URL.revokeObjectURL(url);
}

function PoliciesBalancesSubTab({ onRefetchAll }: { onRefetchAll: () => void }) {
  const qc = useQueryClient();
  const [showCreatePolicy, setShowCreatePolicy] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<any>(null);
  const [bulkAssignPolicy, setBulkAssignPolicy] = useState<any>(null);
  const [assignPolicyStaff, setAssignPolicyStaff] = useState<any>(null);

  const { data: policiesData = [], refetch: refetchPolicies } = useQuery({ queryKey: ['leave-policies'], queryFn: hrService.getLeavePolicies });
  const { data: staffData = [] } = useQuery({ queryKey: ['staff'], queryFn: hrService.getStaff });
  const { data: balancesData = [], isLoading: balancesLoading, refetch: refetchAllBalances } = useQuery({ queryKey: ['leave-balances'], queryFn: hrService.getAllLeaveBalances });

  const policies = policiesData as any[];
  const staffList = staffData as any[];
  const balanceRows = balancesData as any[];

  const seedMut = useMutation({
    mutationFn: hrService.seedLeavePolicies,
    onSuccess: () => { toast.success('4 default policies created'); refetchPolicies(); },
    onError: () => toast.error('Failed to seed policies'),
  });

  const deactivateMut = useMutation({
    mutationFn: (id: string) => hrService.updateLeavePolicy(id, { isActive: false }),
    onSuccess: () => { toast.success('Policy deactivated'); qc.invalidateQueries({ queryKey: ['leave-policies'] }); refetchPolicies(); onRefetchAll(); },
    onError: () => toast.error('Failed to deactivate policy'),
  });

  const refetchBalances = () => { qc.invalidateQueries({ queryKey: ['leave-balance'] }); refetchAllBalances(); };

  const APPLICABLE_LABELS: Record<string, string> = {
    all: 'All Staff', permanent: 'Permanent', contract: 'Contract',
    part_time: 'Part Time', visiting: 'Visiting',
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Leave Policies"
          actions={<>
            <button
              onClick={() => seedMut.mutate()}
              disabled={seedMut.isPending}
              className={`bg-white text-amber-600 border border-amber-300 hover:bg-amber-50 px-3 py-1.5 text-xs rounded-lg font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${seedMut.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}>
              {seedMut.isPending ? 'Seeding…' : 'Seed Default Policies'}
            </button>
            <Btn variant="primary" onClick={() => setShowCreatePolicy(true)}>+ Create Policy</Btn>
          </>}
        />
        {policies.length === 0 ? (
          <div className="p-12 text-center">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <div className="text-slate-500 mb-2">No leave policies found</div>
            <div className="text-xs text-slate-400">Click "Seed Default Policies" to create standard policies</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <THead cols={['Policy Name', 'Applicable To', 'Annual', 'Sick', 'Casual', 'Maternity', 'Hajj', 'Default', 'Actions']} />
              <tbody>
                {policies.map((p: any) => (
                  <tr key={p._id} className="border-b border-slate-50 hover:bg-slate-50">
                    <Td><div className="font-medium">{p.name}</div><div className="text-xs text-slate-400">{p.code}</div></Td>
                    <Td><Badge v="blue">{APPLICABLE_LABELS[p.applicableTo] ?? p.applicableTo}</Badge></Td>
                    <Td>{p.annualDays ?? '—'} days</Td>
                    <Td>{p.sickDays ?? '—'} days</Td>
                    <Td>{p.casualDays ?? '—'} days</Td>
                    <Td>{p.maternityDays ?? '—'} days</Td>
                    <Td>{p.hajjDays ?? '—'} days</Td>
                    <Td>{p.isDefault ? <Badge v="green">Default</Badge> : <span className="text-slate-400">—</span>}</Td>
                    <Td>
                      <div className="flex gap-1 flex-wrap">
                        <button onClick={() => setEditingPolicy(p)} className="bg-slate-50 text-slate-700 border border-slate-200 text-xs px-2 py-0.5 rounded-lg hover:bg-slate-100">Edit</button>
                        <button
                          onClick={() => { if (window.confirm(`Deactivate "${p.name}"? Staff on this policy will keep their existing balances but it will no longer be assignable.`)) deactivateMut.mutate(p._id); }}
                          disabled={deactivateMut.isPending}
                          className="bg-red-50 text-red-700 border border-red-200 text-xs px-2 py-0.5 rounded-lg hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed">
                          Deactivate
                        </button>
                        <button onClick={() => setBulkAssignPolicy(p)} className="bg-[#0C447C]/10 text-[#0C447C] border border-[#0C447C]/20 text-xs px-2 py-0.5 rounded-lg hover:bg-[#0C447C]/20">Assign to All Staff</button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card>
        <CardHeader
          title="Leave Balances"
          sub="Allocated / used / remaining per staff for the current academic year"
          actions={
            <button
              onClick={() => exportLeaveBalancesToExcel(balanceRows)}
              disabled={balanceRows.length === 0}
              className="bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 px-3 py-1.5 text-xs rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              Export to Excel
            </button>
          }
        />
        {balancesLoading ? (
          <div className="p-8 text-center text-slate-400 text-sm animate-pulse">Loading balances…</div>
        ) : balanceRows.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No staff found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <THead cols={['Staff Name', 'Department', 'Annual', 'Sick', 'Casual', 'Maternity', 'Paternity', 'Hajj', 'Actions']} />
              <tbody>
                {balanceRows.map((r: any) => {
                  const staff = staffList.find((s: any) => s._id === r.staffId);
                  return (
                    <tr key={r.staffId} className="border-b border-slate-50 hover:bg-slate-50">
                      <Td><div className="font-medium">{r.staffName}</div><div className="text-xs text-slate-400">{r.employeeId}</div></Td>
                      <Td className="text-slate-500">{r.department}</Td>
                      {(['annual', 'sick', 'casual', 'maternity', 'paternity', 'hajj'] as const).map((type) => (
                        <Td key={type}>
                          {!r.hasPolicy ? (
                            <span className="text-red-500 text-xs font-medium">Not set</span>
                          ) : (
                            <span className={balanceCellClass(r[type].remaining, r[type].entitled)}>
                              {r[type].remaining}/{r[type].entitled}
                            </span>
                          )}
                        </Td>
                      ))}
                      <Td>
                        <button onClick={() => setAssignPolicyStaff(staff || { _id: r.staffId, firstName: r.staffName.split(' ')[0], lastName: r.staffName.split(' ').slice(1).join(' ') })} className="bg-[#0C447C]/10 text-[#0C447C] border border-[#0C447C]/20 text-xs px-2 py-0.5 rounded-lg hover:bg-[#0C447C]/20">Assign Policy</button>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showCreatePolicy && <CreatePolicyModal onClose={() => setShowCreatePolicy(false)} onSuccess={() => { refetchPolicies(); onRefetchAll(); }} />}
      {editingPolicy && <EditPolicyModal policy={editingPolicy} onClose={() => setEditingPolicy(null)} onSuccess={() => { refetchPolicies(); onRefetchAll(); }} />}
      {bulkAssignPolicy && <BulkAssignModal policy={bulkAssignPolicy} staffCount={staffList.length} onClose={() => setBulkAssignPolicy(null)} onSuccess={() => { refetchBalances(); onRefetchAll(); }} />}
      {assignPolicyStaff && <AssignPolicyModal staff={assignPolicyStaff} policies={policies} onClose={() => setAssignPolicyStaff(null)} onSuccess={() => { refetchBalances(); onRefetchAll(); }} />}
    </div>
  );
}

// ─── APPLY LEAVE MODAL ─────────────────────────────────────────────────────────
function ApplyLeaveModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const qc = useQueryClient();
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [form, setForm] = useState({
    leaveType: 'annual', fromDate: '', toDate: '',
    isHalfDay: false, halfDaySession: 'morning',
    reason: '', coveringStaffId: '',
    contactPhone: '', contactEmail: '', emergencyContact: '',
  });

  const { data: staffData = [] } = useQuery({ queryKey: ['staff'], queryFn: hrService.getStaff });
  const { data: balance, isLoading: balanceLoading } = useQuery({
    queryKey: ['leave-balance', selectedStaffId],
    queryFn: () => hrService.getLeaveBalance(selectedStaffId),
    enabled: !!selectedStaffId,
  });

  const staffList = staffData as any[];
  const selectedStaff = staffList.find((s: any) => s._id === selectedStaffId);
  const bal = balance as any;
  const coveringStaff = staffList.find((s: any) => s._id === form.coveringStaffId);

  const entitled: Record<string, number> = {
    annual: bal?.annualEntitled ?? 21, sick: bal?.sickEntitled ?? 10,
    casual: bal?.casualEntitled ?? 10, maternity: bal?.maternityEntitled ?? 90,
    paternity: bal?.paternityEntitled ?? 10, hajj: bal?.hajjEntitled ?? 0,
    emergency: 3, unpaid: 0, study: 5, other: 5,
  };
  const used: Record<string, number> = {
    annual: bal?.annualUsed ?? 0, sick: bal?.sickUsed ?? 0,
    casual: bal?.casualUsed ?? 0, maternity: bal?.maternityUsed ?? 0, paternity: bal?.paternityUsed ?? 0,
    hajj: bal?.hajjUsed ?? 0, emergency: 0, unpaid: 0, study: 0, other: 0,
  };
  const remaining = (type: string) => (entitled[type] ?? 0) - (used[type] ?? 0);

  const calcWorkingDays = (from: string, to: string): number => {
    if (!from || !to) return 0;
    let count = 0;
    const cur = new Date(from);
    const end = new Date(to);
    while (cur <= end) {
      const d = cur.getDay();
      if (d !== 0 && d !== 6) count++;
      cur.setDate(cur.getDate() + 1);
    }
    return count;
  };

  const workingDays = form.isHalfDay ? 0.5 : calcWorkingDays(form.fromDate, form.toDate);
  const calendarDays = (form.fromDate && form.toDate)
    ? Math.ceil((new Date(form.toDate).getTime() - new Date(form.fromDate).getTime()) / 86400000) + 1 : 0;
  const rem = remaining(form.leaveType);
  const balancedTypes = ['annual','sick','casual','maternity','paternity','hajj'];
  const hasBalance = balancedTypes.includes(form.leaveType);

  const mut = useMutation({
    mutationFn: () => hrService.createLeaveApplication({
      staffId: selectedStaffId,
      staffName: selectedStaff ? `${selectedStaff.firstName} ${selectedStaff.lastName}` : '',
      department: selectedStaff?.department || '',
      leaveType: form.leaveType,
      fromDate: form.fromDate, toDate: form.toDate,
      totalDays: workingDays,
      isHalfDay: form.isHalfDay, halfDaySession: form.halfDaySession,
      reason: form.reason,
      coveringStaffId: form.coveringStaffId,
      coveringStaffName: coveringStaff ? `${coveringStaff.firstName} ${coveringStaff.lastName}` : '',
    }),
    onSuccess: () => {
      toast.success('Leave application submitted');
      qc.invalidateQueries({ queryKey: ['leave-applications'] });
      qc.invalidateQueries({ queryKey: ['leave-stats'] });
      onSuccess(); onClose();
    },
    onError: () => toast.error('Failed to submit leave application'),
  });

  const canSubmit = !!selectedStaffId && !!form.fromDate && !!form.toDate && form.reason.length >= 20;

  const BAL_TYPES = [
    { key: 'annual', label: 'Annual' }, { key: 'sick', label: 'Sick' },
    { key: 'casual', label: 'Casual' }, { key: 'maternity', label: 'Maternity' },
    { key: 'hajj', label: 'Hajj' },
  ];

  return (
    <ModalShell title="Apply Leave" onClose={onClose} wide
      footer={<>
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" onClick={() => mut.mutate()} disabled={!canSubmit || mut.isPending}>
          {mut.isPending ? 'Submitting…' : 'Submit Leave Application'}
        </Btn>
      </>}>

      {/* Step 1 — Staff */}
      <div>
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Step 1 — Staff Member</div>
        <WF label="Staff Member" required>
          <select value={selectedStaffId} onChange={e => setSelectedStaffId(e.target.value)} className={WIC}>
            <option value="">Select staff member…</option>
            {staffList.map((s: any) => (
              <option key={s._id} value={s._id}>
                {s.firstName} {s.lastName} — {s.designationId?.name || s.department || '—'}
              </option>
            ))}
          </select>
        </WF>
      </div>

      {/* Step 2 — Balance */}
      {selectedStaffId && (
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Leave Balance — {selectedStaff?.firstName} {selectedStaff?.lastName}
          </div>
          {balanceLoading ? (
            <div className="text-xs text-slate-400 animate-pulse">Loading balance…</div>
          ) : (
            <div className="grid grid-cols-5 gap-2">
              {BAL_TYPES.map(({ key, label }) => {
                const ent = entitled[key] ?? 0;
                const rem2 = remaining(key);
                const pct = ent > 0 ? (rem2 / ent) * 100 : 0;
                const style = pct > 50 ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : pct > 20 ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-red-50 border-red-200 text-red-700';
                return (
                  <div key={key} className={`rounded-lg border p-2.5 text-center ${style}`}>
                    <div className="text-xs font-semibold text-slate-600 mb-1">{label}</div>
                    <div className="text-xl font-bold">{rem2}</div>
                    <div className="text-xs opacity-70">{used[key]}/{ent} used</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* No Policy Warning */}
      {selectedStaffId && !balanceLoading && (!bal || (bal.annualEntitled === 21 && bal.sickEntitled === 10 && bal.casualEntitled === 10 && bal.maternityEntitled === 90)) && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
          ℹ No leave policy has been formally assigned to this staff member. Showing default entitlements. HR Admin can assign a policy from Leave → Policies &amp; Balances tab.
        </div>
      )}

      {/* Step 3 — Leave Type */}
      {selectedStaffId && (
        <div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Step 3 — Leave Type</div>
          <WF label="Leave Type" required>
            <select value={form.leaveType} onChange={e => setForm(prev => ({ ...prev, leaveType: e.target.value }))} className={WIC}>
              {[
                ['annual', `Annual Leave (${entitled.annual} days entitled)`],
                ['sick', `Sick Leave (${entitled.sick} days entitled)`],
                ['casual', `Casual Leave (${entitled.casual} days entitled)`],
                ['maternity', `Maternity Leave (${entitled.maternity} days entitled)`],
                ['paternity', `Paternity Leave (${entitled.paternity} days entitled)`],
                ['hajj', `Hajj Leave (${entitled.hajj} days entitled)`],
                ['emergency', 'Emergency Leave'],
                ['unpaid', 'Unpaid Leave'],
                ['study', 'Study Leave'],
                ['other', 'Other'],
              ].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </WF>
          {hasBalance && (
            <div className={`mt-1.5 text-xs px-3 py-2 rounded-lg font-medium ${rem > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
              {rem > 0 ? `You have ${rem} days remaining for ${form.leaveType} leave` : `⚠ Insufficient balance. Applying will result in unpaid leave.`}
            </div>
          )}
        </div>
      )}

      {/* Step 4 — Dates */}
      {selectedStaffId && (
        <div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Step 4 — Date Range</div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <WF label="From Date" required>
              <input type="date" value={form.fromDate} onChange={e => setForm(prev => ({ ...prev, fromDate: e.target.value }))} className={WIC} />
            </WF>
            <WF label="To Date" required>
              <input type="date" value={form.toDate} onChange={e => setForm(prev => ({ ...prev, toDate: e.target.value }))} className={WIC} />
            </WF>
          </div>
          {form.fromDate && form.toDate && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl mb-3 space-y-1">
              <div className="text-sm font-semibold text-blue-800">Total Working Days: {workingDays}</div>
              <div className="text-xs text-blue-600">Calendar days: {calendarDays} (weekends excluded)</div>
              {hasBalance && rem > 0 && workingDays > rem && (
                <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 mt-2">
                  ⚠ Requesting {workingDays} days but only {rem} remaining. Excess {Number(workingDays) - rem} {Number(workingDays) - rem === 1 ? 'day' : 'days'} will be unpaid.
                </div>
              )}
            </div>
          )}
          <label className="flex items-center gap-2 cursor-pointer mb-2">
            <input type="checkbox" checked={form.isHalfDay} onChange={e => setForm(prev => ({ ...prev, isHalfDay: e.target.checked }))} className="w-4 h-4 accent-[#0C447C]" />
            <span className="text-sm text-slate-700">Half Day</span>
          </label>
          {form.isHalfDay && (
            <div className="flex gap-2 ml-6">
              {['morning','afternoon'].map(s => (
                <button key={s} onClick={() => setForm(prev => ({ ...prev, halfDaySession: s }))}
                  className={`px-3 py-1 text-xs rounded-lg border font-medium capitalize ${form.halfDaySession === s ? 'bg-[#0C447C] text-white border-[#0C447C]' : 'bg-white text-slate-600 border-slate-200'}`}>
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 5 — Additional Details */}
      {selectedStaffId && (
        <div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Step 5 — Details</div>
          <WF label={`Reason (min 20 chars — ${Math.max(0, 20 - form.reason.length)} more needed)`} required>
            <textarea value={form.reason} onChange={e => setForm(prev => ({ ...prev, reason: e.target.value }))} rows={3} className={form.reason.length > 0 && form.reason.length < 20 ? WEC : WIC} placeholder="Describe your reason in detail…" />
          </WF>
          <WF label="Covering Staff (who will cover your responsibilities?)">
            <select value={form.coveringStaffId} onChange={e => setForm(prev => ({ ...prev, coveringStaffId: e.target.value }))} className={WIC}>
              <option value="">Optional — select covering staff…</option>
              {staffList.filter((s: any) => s._id !== selectedStaffId).map((s: any) => (
                <option key={s._id} value={s._id}>{s.firstName} {s.lastName} — {s.designationId?.name || '—'}</option>
              ))}
            </select>
          </WF>
          <div className="grid grid-cols-2 gap-3">
            <WF label="Contact Phone During Leave">
              <input value={form.contactPhone} onChange={e => setForm(prev => ({ ...prev, contactPhone: e.target.value }))} className={WIC} placeholder="+92 300 0000000" />
            </WF>
            <WF label="Emergency Contact">
              <input value={form.emergencyContact} onChange={e => setForm(prev => ({ ...prev, emergencyContact: e.target.value }))} className={WIC} placeholder="Name and phone" />
            </WF>
          </div>
          {form.leaveType === 'sick' && workingDays > 2 && (
            <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              📋 Medical certificate required for sick leave exceeding 2 days.
            </div>
          )}
        </div>
      )}

      {/* Step 6 — Summary */}
      {selectedStaffId && form.fromDate && form.toDate && (
        <div className="p-4 rounded-xl border border-[#0C447C]/20 bg-[#0C447C]/5">
          <div className="text-xs font-semibold text-[#0C447C] uppercase tracking-wide mb-3">Leave Summary</div>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Staff:</span><span className="font-medium">{selectedStaff?.firstName} {selectedStaff?.lastName}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Type:</span><span className="font-medium capitalize">{form.leaveType.replace('_', ' ')} Leave</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Period:</span><span className="font-medium">{form.fromDate} → {form.toDate}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Working Days:</span><span className="font-bold text-[#0C447C]">{workingDays}</span></div>
            {hasBalance && (
              <div className="flex justify-between">
                <span className="text-slate-500">Balance After:</span>
                <span className={`font-medium ${rem - Number(workingDays) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{Math.max(0, rem - Number(workingDays))} days remaining</span>
              </div>
            )}
            {coveringStaff && <div className="flex justify-between"><span className="text-slate-500">Covering:</span><span className="font-medium">{coveringStaff.firstName} {coveringStaff.lastName}</span></div>}
          </div>
        </div>
      )}
    </ModalShell>
  );
}

// ─── APPROVE/REJECT MODAL ──────────────────────────────────────────────────────
function ApproveRejectModal({ action, leaveId, onClose, onSuccess }: { action: 'approve' | 'reject'; leaveId: string; onClose: () => void; onSuccess: () => void }) {
  const [note, setNote] = useState('');
  const mut = useMutation({
    mutationFn: () => hrService.updateLeaveStatus(leaveId, action === 'approve' ? 'approved' : 'rejected', note),
    onSuccess: () => { toast.success(action === 'approve' ? 'Leave approved' : 'Leave rejected'); onSuccess(); onClose(); },
    onError: () => toast.error('Failed to update status'),
  });
  return (
    <ModalShell title={action === 'approve' ? 'Approve Leave' : 'Reject Leave'} onClose={onClose}
      footer={<><Btn onClick={onClose}>Cancel</Btn><Btn variant={action === 'approve' ? 'success' : 'danger'} onClick={() => mut.mutate()}>{mut.isPending ? 'Saving…' : action === 'approve' ? 'Confirm Approve' : 'Confirm Reject'}</Btn></>}>
      <WF label={action === 'approve' ? 'Approval Note (optional)' : 'Rejection Reason'} required={action === 'reject'}>
        <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} className={WIC} placeholder={action === 'approve' ? 'Optional note…' : 'Reason for rejection…'} />
      </WF>
    </ModalShell>
  );
}

// ─── PAYROLL PROCESSING MODAL ──────────────────────────────────────────────────
interface PayrollRow {
  staffId: string; staffName: string; employeeId: string;
  designation: string; department: string; included: boolean;
  basicSalary: number; hra: number; transportAllowance: number;
  medicalAllowance: number; otherAllowances: number;
  absentDays: number; leaveDays: number; lateCount: number; halfDayCount: number;
  incomeTax: number; providentFund: number; otherDeductions: number;
  hasStructure: boolean;
}

function PayrollProcessingModal({ onClose, onSuccess, resumeRun }: { onClose: () => void; onSuccess: () => void; resumeRun?: { month: number; year: number } }) {
  const qc = useQueryClient();
  const now = new Date();
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const [month, setMonth] = useState(resumeRun?.month ?? now.getMonth() + 1);
  const [year, setYear] = useState(resumeRun?.year ?? now.getFullYear());
  const [step, setStep] = useState<1|2|3>(1);
  const [rows, setRows] = useState<PayrollRow[]>([]);
  const [processing, setProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);

  const { data: staffData = [] } = useQuery({ queryKey: ['staff'], queryFn: hrService.getStaff });
  const { data: salaryComponents = [] } = useQuery({ queryKey: ['salary-components'], queryFn: hrService.getSalaryComponents });
  const { data: existingRuns = [] } = useQuery({ queryKey: ['payroll-runs'], queryFn: hrService.getPayrollRuns });
  const { data: attSummary = [] } = useQuery({
    queryKey: ['attendance-summary', month, year],
    queryFn: () => hrService.getAttendanceSummary(month, year),
    enabled: step >= 2,
  });
  const { data: attendanceSettings } = useQuery({ queryKey: ['attendance-settings'], queryFn: hrService.getAttendanceSettings, enabled: step >= 2 });

  const staffList = staffData as any[];
  const components = salaryComponents as any[];
  const attData = attSummary as any[];
  const settings = attendanceSettings as any;
  const latesPerDayDeduction = settings?.latesPerDayDeduction || 3;
  const halfDayDeductionValue = settings?.halfDayDeductionValue ?? 0.5;

  const countByStatus = (staffId: string, status: string) =>
    attData.filter((a: any) => a._id?.staffId?.toString() === staffId.toString() && a._id?.status === status)
      .reduce((s: number, e: any) => s + (e.count || 0), 0);
  const getAbsentDays = (staffId: string) => countByStatus(staffId, 'absent');
  // Real attendance data that already existed but was never used in
  // payroll at all - late arrivals and half-days had zero effect on pay
  // before this, even though the data to handle them correctly was
  // already being tracked. Converted to an equivalent "days" figure
  // using the school's own configurable rule (not hardcoded), then
  // folded into the same absence-deduction math already in place.
  const getLateCount = (staffId: string) => countByStatus(staffId, 'late');
  const getHalfDayCount = (staffId: string) => countByStatus(staffId, 'half_day');
  const lateDaysEquivalent = (lateCount: number) => Math.floor(lateCount / latesPerDayDeduction);
  const halfDaysEquivalent = (halfDayCount: number) => halfDayCount * halfDayDeductionValue;

  // Each employee's actual configured salary structure (set via Staff
  // Profile → Payroll → Salary Structure) drives these numbers — not a
  // hardcoded default. For anyone not yet individually configured, this
  // falls back to the school's own component defaults (still real,
  // school-defined numbers, never a hardcoded literal), so a completely
  // unconfigured staff member visibly shows 0s rather than a fabricated
  // number that looks like real data.
  const componentDefault = (code: string): number => {
    const comp = components.find(c => c.code === code);
    if (!comp) return 0;
    return comp.calculationType === 'fixed' ? (comp.defaultAmount || 0) : 0;
  };
  const structureAmount = (staff: any, code: string): number => {
    const line = (staff.salaryStructure || []).find((l: any) => l.code === code);
    return line ? line.amount : componentDefault(code);
  };
  const structureAmountByType = (staff: any, type: 'earning' | 'deduction', excludeCodes: string[]): number => {
    return (staff.salaryStructure || [])
      .filter((l: any) => l.type === type && !excludeCodes.includes(l.code))
      .reduce((s: number, l: any) => s + (l.amount || 0), 0);
  };

  const initRows = () => {
    setRows(staffList.map((s: any) => ({
      staffId: s._id, staffName: `${s.firstName} ${s.lastName}`,
      employeeId: s.employeeId || '',
      designation: s.designationId?.name || s.department || '—',
      department: s.department || '—',
      included: true,
      basicSalary: structureAmount(s, 'BASIC'),
      hra: structureAmount(s, 'HRA'),
      transportAllowance: structureAmount(s, 'TRANSPORT'),
      medicalAllowance: structureAmount(s, 'MEDICAL'),
      otherAllowances: structureAmountByType(s, 'earning', ['BASIC', 'HRA', 'TRANSPORT', 'MEDICAL']),
      absentDays: getAbsentDays(s._id), leaveDays: 0,
      lateCount: getLateCount(s._id), halfDayCount: getHalfDayCount(s._id),
      incomeTax: structureAmount(s, 'TAX'),
      providentFund: structureAmount(s, 'PF'),
      otherDeductions: structureAmountByType(s, 'deduction', ['TAX', 'PF']),
      hasStructure: (s.salaryStructure || []).length > 0,
    })));
    setStep(2);
  };

  const updateRow = (idx: number, field: keyof PayrollRow, value: number | boolean) => {
    setRows(prev => prev.map((r, i) => {
      if (i !== idx) return r;
      const updated = { ...r, [field]: value };
      if (field === 'basicSalary') {
        const hraComponent = components.find(c => c.code === 'HRA' && c.calculationType === 'percentage_of_basic');
        if (hraComponent) updated.hra = Math.round((value as number) * ((hraComponent.percentageValue || 0) / 100));
      }
      return updated;
    }));
  };

  const calcGross = (r: PayrollRow) => r.basicSalary + r.hra + r.transportAllowance + r.medicalAllowance + r.otherAllowances;
  const calcPerDay = (r: PayrollRow) => r.basicSalary > 0 ? r.basicSalary / 26 : 0;
  const calcAbsentDeduct = (r: PayrollRow) => Math.round(r.absentDays * calcPerDay(r));
  const calcLeaveDeduct = (r: PayrollRow) => Math.round(r.leaveDays * calcPerDay(r));
  const calcAttendanceDaysEquivalent = (r: PayrollRow) => lateDaysEquivalent(r.lateCount) + halfDaysEquivalent(r.halfDayCount);
  const calcAttendanceDeduct = (r: PayrollRow) => Math.round(calcAttendanceDaysEquivalent(r) * calcPerDay(r));
  const calcTotalDeduct = (r: PayrollRow) => calcAbsentDeduct(r) + calcLeaveDeduct(r) + calcAttendanceDeduct(r) + r.incomeTax + r.providentFund + r.otherDeductions;
  const calcNet = (r: PayrollRow) => calcGross(r) - calcTotalDeduct(r);

  const included = rows.filter(r => r.included);
  const totalGross = included.reduce((s, r) => s + calcGross(r), 0);
  const totalDeductions = included.reduce((s, r) => s + calcTotalDeduct(r), 0);
  const totalNet = included.reduce((s, r) => s + calcNet(r), 0);
  const fmt = (n: number) => Math.round(n).toLocaleString();

  const handleProcess = async () => {
    setProcessing(true);
    setProcessedCount(0);
    try {
      // Reuse an existing run for this exact month/year if one already
      // exists (the actual retry case this whole fix is for) - trying
      // to create a fresh one here would hit PayrollRun's own
      // uniqueness rule on (month, year) and fail immediately, before
      // ever reaching the part of this that's actually retry-safe.
      const existing = (existingRuns as any[]).find((r: any) => r.month === month && r.year === year && r.status !== 'completed' && r.status !== 'cancelled');
      const runId = existing?._id || (await hrService.createPayrollRun({
        month, year, totalEmployees: included.length,
        totalGrossSalary: totalGross, totalDeductions, totalNetSalary: totalNet, status: 'processing',
      }) as any)?._id;
      // Single request, whole batch handled server-side - the actual
      // fix for the bug found in QA: previously this looped one HTTP
      // call per staff member with no error isolation and no way to
      // retry a partial failure (a payslip uniqueness rule made a retry
      // immediately fail on the first already-processed person and
      // abort before reaching anyone still needing one). The backend
      // now skips anyone already processed and reports exactly who
      // succeeded/was skipped/genuinely failed, so this call is safe to
      // run again if it doesn't fully complete.
      const result: any = await hrService.processPayrollBatch(runId, included.map(r => ({
        staffId: r.staffId, staffName: r.staffName, employeeId: r.employeeId,
        designation: r.designation, department: r.department,
        month, year,
        basicSalary: r.basicSalary, hra: r.hra,
        transportAllowance: r.transportAllowance, medicalAllowance: r.medicalAllowance,
        otherAllowances: r.otherAllowances, grossSalary: calcGross(r),
        incomeTax: r.incomeTax, providentFund: r.providentFund,
        loanDeduction: 0, leaveDeduction: calcLeaveDeduct(r),
        otherDeductions: calcAbsentDeduct(r) + calcAttendanceDeduct(r) + r.otherDeductions,
        totalDeductions: calcTotalDeduct(r), netSalary: calcNet(r),
        presentDays: Math.max(0, 26 - r.absentDays - r.leaveDays - calcAttendanceDaysEquivalent(r)),
        absentDays: r.absentDays, leaveDays: r.leaveDays,
      })));
      setProcessedCount(result.succeededCount + result.skippedCount);

      if (result.status === 'completed') {
        toast.success(`Payroll processed for ${included.length} staff`);
        qc.invalidateQueries({ queryKey: ['payroll-runs'] });
        qc.invalidateQueries({ queryKey: ['payroll-stats'] });
        qc.invalidateQueries({ queryKey: ['payslips'] });
        onSuccess(); onClose();
      } else {
        // Genuinely, honestly incomplete - the run stays open, and the
        // admin sees exactly who failed rather than a false "success" or
        // a silently stuck run with no visibility into what went wrong.
        toast.error(`${result.failedCount} of ${included.length} staff failed - ${result.succeededCount + result.skippedCount} processed successfully. Fix the issue and click Process again to retry just the ones that failed.`);
        // Awaited, not fire-and-forget - a fast retry click needs
        // existingRuns to already reflect the run just created/updated
        // above, or it would try to create a second one and hit
        // PayrollRun's own uniqueness rule on (month, year).
        await qc.invalidateQueries({ queryKey: ['payroll-runs'] });
      }
    } catch {
      toast.error('Failed to process payroll');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl my-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div>
            <div className="font-bold text-slate-900">Process Payroll — {MONTHS[month-1]} {year}</div>
            <div className="flex gap-2 mt-1">
              {([1,2,3] as const).map(s => (
                <span key={s} className={`text-xs px-2 py-0.5 rounded-full ${step === s ? 'bg-[#0C447C] text-white' : step > s ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                  {s === 1 ? '1. Period' : s === 2 ? '2. Salary Table' : '3. Review & Process'}
                </span>
              ))}
            </div>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[75vh]">
          {step === 1 && (
            <div className="max-w-sm">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Select Payroll Period</div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <WF label="Month" required>
                  <select value={month} onChange={e => setMonth(parseInt(e.target.value))} className={WIC}>
                    {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
                  </select>
                </WF>
                <WF label="Year" required>
                  <input type="number" value={year} onChange={e => setYear(parseInt(e.target.value) || now.getFullYear())} className={WIC} />
                </WF>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 mb-4">
                <div className="grid grid-cols-3 gap-4 text-center text-sm">
                  <div><div className="text-xl font-bold text-slate-800">22</div><div className="text-xs text-slate-500">Working Days</div></div>
                  <div><div className="text-xl font-bold text-slate-800">{staffList.length}</div><div className="text-xs text-slate-500">Staff Count</div></div>
                  <div><div className="text-xl font-bold text-emerald-600">Ready</div><div className="text-xs text-slate-500">Status</div></div>
                </div>
              </div>
              <Btn variant="primary" onClick={initRows}>Continue to Salary Table →</Btn>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{staffList.length} staff · {MONTHS[month-1]} {year}</div>
                <Btn onClick={() => setStep(3)}>Review Totals →</Btn>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="py-2 px-2 text-left w-6"><input type="checkbox" defaultChecked onChange={e => setRows(prev => prev.map(r => ({ ...r, included: e.target.checked })))} /></th>
                      <th className="py-2 px-2 text-left font-semibold text-slate-500">Staff</th>
                      <th className="py-2 px-2 text-left font-semibold text-slate-500">Basic</th>
                      <th className="py-2 px-2 text-left font-semibold text-slate-500">HRA</th>
                      <th className="py-2 px-2 text-left font-semibold text-slate-500">Transport</th>
                      <th className="py-2 px-2 text-left font-semibold text-slate-500">Medical</th>
                      <th className="py-2 px-2 text-left font-semibold text-emerald-600">Gross</th>
                      <th className="py-2 px-2 text-left font-semibold text-amber-600">Absent Ded.</th>
                      <th className="py-2 px-2 text-left font-semibold text-slate-500">Tax</th>
                      <th className="py-2 px-2 text-left font-semibold text-slate-500">PF</th>
                      <th className="py-2 px-2 text-left font-semibold text-red-500">Total Ded.</th>
                      <th className="py-2 px-2 text-left font-semibold text-[#0C447C]">Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={r.staffId} className={`border-b border-slate-50 hover:bg-slate-50 ${!r.included ? 'opacity-40' : ''}`}>
                        <td className="py-1.5 px-2"><input type="checkbox" checked={r.included} onChange={e => updateRow(i, 'included', e.target.checked)} /></td>
                        <td className="py-1.5 px-2">
                          <div className="font-medium text-slate-800 whitespace-nowrap">{r.staffName}</div>
                          <div className="text-slate-400">{r.designation}</div>
                          {r.absentDays > 0 && <div className="text-amber-600 text-[10px]">{r.absentDays} absent days</div>}
                          {r.lateCount > 0 && <div className="text-sky-600 text-[10px]">{r.lateCount} late{r.lateCount === 1 ? '' : 's'} ({lateDaysEquivalent(r.lateCount)} day equiv.)</div>}
                          {r.halfDayCount > 0 && <div className="text-orange-600 text-[10px]">{r.halfDayCount} half-day{r.halfDayCount === 1 ? '' : 's'}</div>}
                          {r.basicSalary === 0 && !r.hasStructure && <div className="text-red-500 text-[10px]">⚠ No salary structure configured</div>}
                          {r.basicSalary === 0 && r.hasStructure && <div className="text-red-500 text-[10px]">⚠ Basic Salary is 0 in their structure - check Staff Profile</div>}
                        </td>
                        <td className="py-1 px-1"><input type="number" value={r.basicSalary} onChange={e => updateRow(i, 'basicSalary', parseFloat(e.target.value) || 0)} className="w-20 px-1.5 py-1 border border-slate-200 rounded text-xs" /></td>
                        <td className="py-1 px-1"><input type="number" value={r.hra} onChange={e => updateRow(i, 'hra', parseFloat(e.target.value) || 0)} className="w-16 px-1.5 py-1 border border-slate-200 rounded text-xs" /></td>
                        <td className="py-1 px-1"><input type="number" value={r.transportAllowance} onChange={e => updateRow(i, 'transportAllowance', parseFloat(e.target.value) || 0)} className="w-16 px-1.5 py-1 border border-slate-200 rounded text-xs" /></td>
                        <td className="py-1 px-1"><input type="number" value={r.medicalAllowance} onChange={e => updateRow(i, 'medicalAllowance', parseFloat(e.target.value) || 0)} className="w-16 px-1.5 py-1 border border-slate-200 rounded text-xs" /></td>
                        <td className="py-1.5 px-2 font-semibold text-emerald-600 whitespace-nowrap">{fmt(calcGross(r))}</td>
                        <td className="py-1.5 px-2 whitespace-nowrap">{(calcAbsentDeduct(r) + calcAttendanceDeduct(r)) > 0 ? <span className="text-amber-600">-{fmt(calcAbsentDeduct(r) + calcAttendanceDeduct(r))}</span> : '—'}</td>
                        <td className="py-1 px-1"><input type="number" value={r.incomeTax} onChange={e => updateRow(i, 'incomeTax', parseFloat(e.target.value) || 0)} className="w-14 px-1.5 py-1 border border-slate-200 rounded text-xs" /></td>
                        <td className="py-1 px-1"><input type="number" value={r.providentFund} onChange={e => updateRow(i, 'providentFund', parseFloat(e.target.value) || 0)} className="w-14 px-1.5 py-1 border border-slate-200 rounded text-xs" /></td>
                        <td className="py-1.5 px-2 font-semibold text-red-500 whitespace-nowrap">{fmt(calcTotalDeduct(r))}</td>
                        <td className="py-1.5 px-2 font-bold text-[#0C447C] whitespace-nowrap">{fmt(calcNet(r))}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-[#0C447C] text-white text-xs">
                      <td colSpan={6} className="py-2 px-2 font-semibold">TOTALS ({included.length} included)</td>
                      <td className="py-2 px-2 font-bold">{fmt(totalGross)}</td>
                      <td colSpan={3} className="py-2 px-2"></td>
                      <td className="py-2 px-2 font-bold">{fmt(totalDeductions)}</td>
                      <td className="py-2 px-2 font-bold">{fmt(totalNet)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Payroll Summary — {MONTHS[month-1]} {year}</div>
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  {[['Period',`${MONTHS[month-1]} ${year}`],['Total Staff',`${included.length} employees`],['Total Gross',`PKR ${fmt(totalGross)}`],['Total Deductions',`PKR ${fmt(totalDeductions)}`]].map(([k,v]) => (
                    <div key={k} className="flex justify-between text-sm"><span className="text-slate-500">{k}</span><span className="font-medium">{v}</span></div>
                  ))}
                  <div className="flex justify-between text-sm font-bold border-t border-slate-200 pt-2">
                    <span className="text-[#0C447C]">Total Net Payable</span>
                    <span className="text-[#0C447C]">PKR {fmt(totalNet)}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700">✓ {included.length} payslips will be generated</div>
                  {processing && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                      <div className="text-xs text-blue-700 mb-1.5">Processing {processedCount}/{included.length} payslips…</div>
                      <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${included.length > 0 ? (processedCount/included.length)*100 : 0}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Btn onClick={() => setStep(2)}>← Back to Table</Btn>
                <Btn variant="primary" onClick={handleProcess} disabled={processing || included.length === 0}>
                  {processing ? `Processing ${processedCount}/${included.length}…` : `Process Payroll for ${included.length} Staff`}
                </Btn>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── CREATE REVIEW MODAL ───────────────────────────────────────────────────────
const getCriteriaForRole = (erpRole: string): any[] => {
  if (erpRole === 'teacher') return [
    { category: 'Teaching Excellence', criteria: 'Lesson Planning & Curriculum Coverage', weight: 20, selfScore: 0, managerScore: 0, comments: '' },
    { category: 'Teaching Excellence', criteria: 'Student Engagement & Classroom Management', weight: 20, selfScore: 0, managerScore: 0, comments: '' },
    { category: 'Teaching Excellence', criteria: 'Assessment & Student Progress Tracking', weight: 15, selfScore: 0, managerScore: 0, comments: '' },
    { category: 'Professionalism', criteria: 'Punctuality, Attendance & Reliability', weight: 15, selfScore: 0, managerScore: 0, comments: '' },
    { category: 'Professionalism', criteria: 'Communication with Parents & Colleagues', weight: 10, selfScore: 0, managerScore: 0, comments: '' },
    { category: 'Growth & Development', criteria: 'Professional Development & Training', weight: 10, selfScore: 0, managerScore: 0, comments: '' },
    { category: 'Growth & Development', criteria: 'Contribution to School Culture & Events', weight: 10, selfScore: 0, managerScore: 0, comments: '' },
  ];
  if (['principal','vice_principal'].includes(erpRole)) return [
    { category: 'Leadership', criteria: 'Strategic Planning & Vision', weight: 25, selfScore: 0, managerScore: 0, comments: '' },
    { category: 'Leadership', criteria: 'Staff Management & Development', weight: 20, selfScore: 0, managerScore: 0, comments: '' },
    { category: 'Academic', criteria: 'Academic Standards & Results', weight: 20, selfScore: 0, managerScore: 0, comments: '' },
    { category: 'Operations', criteria: 'School Operations & Administration', weight: 15, selfScore: 0, managerScore: 0, comments: '' },
    { category: 'Stakeholder', criteria: 'Parent & Community Engagement', weight: 10, selfScore: 0, managerScore: 0, comments: '' },
    { category: 'Growth', criteria: 'Innovation & Continuous Improvement', weight: 10, selfScore: 0, managerScore: 0, comments: '' },
  ];
  return [
    { category: 'Work Quality', criteria: 'Accuracy & Quality of Work', weight: 25, selfScore: 0, managerScore: 0, comments: '' },
    { category: 'Work Quality', criteria: 'Productivity & Task Completion', weight: 20, selfScore: 0, managerScore: 0, comments: '' },
    { category: 'Professionalism', criteria: 'Punctuality & Attendance', weight: 20, selfScore: 0, managerScore: 0, comments: '' },
    { category: 'Professionalism', criteria: 'Team Collaboration & Attitude', weight: 20, selfScore: 0, managerScore: 0, comments: '' },
    { category: 'Growth', criteria: 'Learning & Self-Improvement', weight: 15, selfScore: 0, managerScore: 0, comments: '' },
  ];
};

function CreateReviewModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const qc = useQueryClient();
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [criteriaList, setCriteriaList] = useState<any[]>([]);
  const [customizing, setCustomizing] = useState(false);
  const [config, setConfig] = useState({ reviewType: 'annual', reviewPeriod: '', reviewerName: '', reviewDeadline: '', requireSelfReview: false });

  const { data: staffData = [] } = useQuery({ queryKey: ['staff'], queryFn: hrService.getStaff });
  const { data: trainings = [] } = useQuery({ queryKey: ['trainings'], queryFn: hrService.getTrainings, enabled: !!selectedStaffId });

  const staffList = staffData as any[];
  const selectedStaff = staffList.find((s: any) => s._id === selectedStaffId);

  const handleStaffChange = (id: string) => {
    setSelectedStaffId(id);
    const s = staffList.find((x: any) => x._id === id);
    if (s) setCriteriaList(getCriteriaForRole(s.erpRole || ''));
    else setCriteriaList([]);
  };

  const staffTrainings = (trainings as any[]).filter((t: any) =>
    (t.participants || []).some((p: any) => p.staffId?.toString() === selectedStaffId && p.status === 'completed')
  );

  const categories = Array.from(new Set(criteriaList.map(c => c.category)));

  const mut = useMutation({
    mutationFn: () => hrService.createPerformanceReview({
      staffId: selectedStaffId,
      staffName: selectedStaff ? `${selectedStaff.firstName} ${selectedStaff.lastName}` : '',
      designation: selectedStaff?.designationId?.name || selectedStaff?.department || '',
      department: selectedStaff?.department || '',
      reviewType: config.reviewType, reviewPeriod: config.reviewPeriod,
      reviewerName: config.reviewerName,
      criteria: criteriaList,
    }),
    onSuccess: () => { toast.success('Review created'); qc.invalidateQueries({ queryKey: ['performance'] }); onSuccess(); onClose(); },
    onError: () => toast.error('Failed to create review'),
  });

  const canSubmit = !!selectedStaffId && !!config.reviewPeriod;

  return (
    <ModalShell title="Start Performance Review" onClose={onClose} wide
      footer={<><Btn onClick={onClose}>Cancel</Btn><Btn variant="primary" onClick={() => mut.mutate()} disabled={!canSubmit || mut.isPending}>{mut.isPending ? 'Creating…' : 'Create Review'}</Btn></>}>

      {/* Step 1 — Staff */}
      <div>
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Step 1 — Select Staff Member</div>
        <WF label="Staff Member" required>
          <select value={selectedStaffId} onChange={e => handleStaffChange(e.target.value)} className={WIC}>
            <option value="">Select staff member…</option>
            {staffList.map((s: any) => (
              <option key={s._id} value={s._id}>{s.firstName} {s.lastName} — {s.designationId?.name || s.department || '—'}</option>
            ))}
          </select>
        </WF>
      </div>

      {/* Staff Profile Card */}
      {selectedStaff && (
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0" style={{ background: avatarColor(selectedStaff._id) }}>
              {lcInitials(selectedStaff)}
            </div>
            <div>
              <div className="font-semibold text-slate-800">{selectedStaff.firstName} {selectedStaff.lastName}</div>
              <div className="text-xs text-slate-500">{selectedStaff.designationId?.name || '—'} · {selectedStaff.department || '—'}</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div><span className="text-slate-400">ERP Role: </span><span className="font-medium capitalize">{(selectedStaff.erpRole || '—').replace('_', ' ')}</span></div>
            <div><span className="text-slate-400">Campus: </span><span className="font-medium">{selectedStaff.campusId?.name || '—'}</span></div>
            <div><span className="text-slate-400 ">Training: </span><span className="font-medium text-emerald-600">{staffTrainings.length} completed</span></div>
          </div>
          {staffTrainings.length > 0 && (
            <div className="mt-2 pt-2 border-t border-slate-200 flex flex-wrap gap-1">
              {staffTrainings.slice(0, 3).map((t: any) => <Badge key={t._id} v="blue">{t.title}</Badge>)}
            </div>
          )}
        </div>
      )}

      {/* Step 2 — Configuration */}
      {selectedStaff && (
        <div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Step 2 — Review Configuration</div>
          <div className="grid grid-cols-2 gap-3">
            <WF label="Review Type" required>
              <select value={config.reviewType} onChange={e => setConfig(prev => ({ ...prev, reviewType: e.target.value }))} className={WIC}>
                <option value="annual">Annual Review</option>
                <option value="mid_year">Mid-Year Review</option>
                <option value="probation">Probation Review</option>
                <option value="pip">Performance Improvement Plan</option>
              </select>
            </WF>
            <WF label="Review Period" required>
              <input value={config.reviewPeriod} onChange={e => setConfig(prev => ({ ...prev, reviewPeriod: e.target.value }))} className={WIC} placeholder="e.g. 2025-2026" />
            </WF>
            <WF label="Reviewer Name">
              <input value={config.reviewerName} onChange={e => setConfig(prev => ({ ...prev, reviewerName: e.target.value }))} className={WIC} placeholder="Your name" />
            </WF>
            <WF label="Review Deadline">
              <input type="date" value={config.reviewDeadline} onChange={e => setConfig(prev => ({ ...prev, reviewDeadline: e.target.value }))} className={WIC} />
            </WF>
          </div>
          <label className="flex items-center gap-2 cursor-pointer mt-2">
            <input type="checkbox" checked={config.requireSelfReview} onChange={e => setConfig(prev => ({ ...prev, requireSelfReview: e.target.checked }))} className="w-4 h-4 accent-[#0C447C]" />
            <span className="text-sm text-slate-700">Require self-review from staff member</span>
          </label>
        </div>
      )}

      {/* Criteria Preview */}
      {selectedStaff && criteriaList.length > 0 && (
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-semibold text-slate-600">
              {criteriaList.length} criteria across {categories.length} categories (for {(selectedStaff.erpRole || 'staff').replace('_', ' ')})
            </div>
            <button onClick={() => setCustomizing(!customizing)} className="text-xs text-[#0C447C] hover:underline font-medium">
              {customizing ? 'Done' : 'Customize'}
            </button>
          </div>
          {!customizing ? (
            <div className="space-y-2">
              {categories.map(cat => (
                <div key={cat}>
                  <div className="text-xs font-semibold text-slate-500 mb-0.5">{cat}</div>
                  {criteriaList.filter(c => c.category === cat).map((c, i) => (
                    <div key={i} className="flex justify-between text-xs py-0.5 pl-3 text-slate-600">
                      <span>{c.criteria}</span><span className="text-slate-400 font-medium">{c.weight}%</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {criteriaList.map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input value={c.category} onChange={e => setCriteriaList(prev => prev.map((x, j) => j === i ? { ...x, category: e.target.value } : x))} className="px-2 py-1 text-xs border border-slate-200 rounded w-28 shrink-0" placeholder="Category" />
                  <input value={c.criteria} onChange={e => setCriteriaList(prev => prev.map((x, j) => j === i ? { ...x, criteria: e.target.value } : x))} className="px-2 py-1 text-xs border border-slate-200 rounded flex-1" placeholder="Criteria" />
                  <input type="number" value={c.weight} onChange={e => setCriteriaList(prev => prev.map((x, j) => j === i ? { ...x, weight: parseInt(e.target.value) || 0 } : x))} className="px-2 py-1 text-xs border border-slate-200 rounded w-14 shrink-0" placeholder="%" />
                  <button onClick={() => setCriteriaList(prev => prev.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 shrink-0">✕</button>
                </div>
              ))}
              <button onClick={() => setCriteriaList(prev => [...prev, { category: '', criteria: '', weight: 10, selfScore: 0, managerScore: 0, comments: '' }])} className="text-xs text-[#0C447C] hover:underline flex items-center gap-1 mt-1">
                <Plus size={11} />Add Criterion
              </button>
            </div>
          )}
        </div>
      )}
    </ModalShell>
  );
}

// ─── REVIEW DETAIL MODAL ───────────────────────────────────────────────────────
const REVIEW_RATING_V: Record<string, BadgeVariant> = { outstanding: 'purple', exceeds_expectations: 'green', meets_expectations: 'blue', needs_improvement: 'amber', unsatisfactory: 'red' };
const REVIEW_RATING_COLOR: Record<string, string> = { outstanding: 'text-purple-600', exceeds_expectations: 'text-emerald-600', meets_expectations: 'text-blue-600', needs_improvement: 'text-amber-600', unsatisfactory: 'text-red-600' };
const REVIEW_INCREMENT: Record<string, string> = { outstanding: '15%', exceeds_expectations: '10%', meets_expectations: '5%', needs_improvement: '0%', unsatisfactory: '0%' };

function ReviewDetailModal({ review, onClose, onSuccess }: { review: any; onClose: () => void; onSuccess: () => void }) {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<'self'|'manager'|'summary'|'history'>('manager');
  const [localCriteria, setLocalCriteria] = useState<any[]>(() => (review.criteria || []).map((c: any) => ({ ...c })));
  const [selfComments, setSelfComments] = useState(review.selfComments || '');
  const [managerComments, setManagerComments] = useState(review.managerComments || '');
  const [rating, setRating] = useState(review.rating || '');
  const [goals, setGoals] = useState(review.goals || '');
  const [developmentPlan, setDevelopmentPlan] = useState(review.developmentPlan || '');
  const [enrollTrainingId, setEnrollTrainingId] = useState('');

  const { data: trainings = [] } = useQuery({ queryKey: ['trainings'], queryFn: hrService.getTrainings });
  const { data: historyData = [] } = useQuery({
    queryKey: ['performance-history', review.staffId],
    queryFn: () => hrService.getPerformanceReviews({ staffId: review.staffId }),
    enabled: !!review.staffId && activeTab === 'history',
  });

  const trainingList = trainings as any[];
  const historyList = (historyData as any[]).filter((r: any) => r._id !== review._id);

  const totalWeight = localCriteria.reduce((s: number, c: any) => s + (Number(c.weight) || 0), 0);
  const weightedSelf = totalWeight > 0 ? Math.round(localCriteria.reduce((s: number, c: any) => s + (Number(c.selfScore) || 0) * (Number(c.weight) || 0), 0) / totalWeight * 10) / 10 : 0;
  const weightedManager = totalWeight > 0 ? Math.round(localCriteria.reduce((s: number, c: any) => s + (Number(c.managerScore) || 0) * (Number(c.weight) || 0), 0) / totalWeight * 10) / 10 : 0;
  const hasSelf = localCriteria.some(c => c.selfScore > 0);
  const finalScore = hasSelf ? Math.round((weightedSelf + weightedManager) / 2 * 10) / 10 : weightedManager;
  const autoRating = finalScore >= 9 ? 'outstanding' : finalScore >= 7 ? 'exceeds_expectations' : finalScore >= 5 ? 'meets_expectations' : finalScore >= 3 ? 'needs_improvement' : 'unsatisfactory';
  const effectiveRating = rating || autoRating;

  const updateSelf = (i: number, v: number) => setLocalCriteria(prev => prev.map((x, j) => j === i ? { ...x, selfScore: v } : x));
  const updateManager = (i: number, v: number) => setLocalCriteria(prev => prev.map((x, j) => j === i ? { ...x, managerScore: v } : x));
  const updateComment = (i: number, v: string) => setLocalCriteria(prev => prev.map((x, j) => j === i ? { ...x, comments: v } : x));

  const selfMut = useMutation({
    mutationFn: () => hrService.updatePerformanceReview(review._id, { criteria: localCriteria, selfComments, selfOverallScore: weightedSelf, status: 'manager_review', selfReviewedAt: new Date().toISOString() }),
    onSuccess: () => { toast.success('Self review submitted'); qc.invalidateQueries({ queryKey: ['performance'] }); onSuccess(); },
    onError: () => toast.error('Failed to submit'),
  });

  const managerMut = useMutation({
    mutationFn: () => hrService.updatePerformanceReview(review._id, { criteria: localCriteria, managerComments, rating: effectiveRating, finalScore, managerOverallScore: weightedManager, goals, developmentPlan, status: 'completed', reviewedAt: new Date().toISOString() }),
    onSuccess: () => { toast.success('Review completed'); qc.invalidateQueries({ queryKey: ['performance'] }); onSuccess(); },
    onError: () => toast.error('Failed to complete review'),
  });

  const enrollMut = useMutation({
    mutationFn: () => hrService.enrollInTraining(enrollTrainingId, review.staffId, review.staffName || ''),
    onSuccess: () => { toast.success('Staff enrolled'); setEnrollTrainingId(''); qc.invalidateQueries({ queryKey: ['trainings'] }); },
    onError: () => toast.error('Failed to enroll'),
  });

  const lowCriteria = localCriteria.filter(c => c.managerScore > 0 && c.managerScore < 5);
  const TABS = [{ id: 'self' as const, label: 'Self Review' },{ id: 'manager' as const, label: 'Manager Review' },{ id: 'summary' as const, label: 'Summary' },{ id: 'history' as const, label: 'History' }];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl my-4">
        <div className="px-6 py-4 border-b border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-bold text-slate-900">{review.staffName || '—'}</div>
              <div className="text-xs text-slate-500 mt-0.5">{review.reviewPeriod} · {(review.reviewType || '').replace('_', ' ')}</div>
            </div>
            <div className="flex items-center gap-2">
              <Badge v={{ draft: 'gray' as BadgeVariant, self_review: 'amber' as BadgeVariant, manager_review: 'blue' as BadgeVariant, completed: 'green' as BadgeVariant }[review.status as string] ?? 'gray'}>{(review.status || '').replace('_', ' ')}</Badge>
              <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
          </div>
          <div className="flex gap-1">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${activeTab === t.id ? 'bg-[#0C447C] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{t.label}</button>
            ))}
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[65vh] space-y-4">
          {/* SELF REVIEW */}
          {activeTab === 'self' && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">Score yourself honestly 0–10 for each criterion.</div>
              {localCriteria.map((c: any, i: number) => (
                <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <div><div className="text-xs text-slate-400">{c.category}</div><div className="text-sm font-medium text-slate-800">{c.criteria}</div></div>
                    <span className="text-xs bg-slate-200 text-slate-500 px-2 py-0.5 rounded">{c.weight}%</span>
                  </div>
                  <div className="flex items-center gap-3 mb-2">
                    <input type="range" min={0} max={10} value={c.selfScore || 0} onChange={e => updateSelf(i, parseInt(e.target.value))} className="flex-1 accent-amber-500" />
                    <span className="w-12 text-center font-bold text-amber-600">{c.selfScore || 0}/10</span>
                  </div>
                  <textarea value={c.comments || ''} onChange={e => updateComment(i, e.target.value)} rows={2} className={`${WIC} text-xs`} placeholder="Your self-assessment…" />
                </div>
              ))}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
                <span className="text-sm text-amber-700">Weighted Self Score</span>
                <span className="text-xl font-bold text-amber-600">{weightedSelf} / 10</span>
              </div>
              <WF label="Overall Self Comments"><textarea value={selfComments} onChange={e => setSelfComments(e.target.value)} rows={3} className={WIC} placeholder="Overall self-assessment…" /></WF>
              <Btn variant="primary" onClick={() => selfMut.mutate()}>{selfMut.isPending ? 'Submitting…' : 'Submit Self Review'}</Btn>
            </div>
          )}

          {/* MANAGER REVIEW */}
          {activeTab === 'manager' && (
            <div className="space-y-4">
              {localCriteria.map((c: any, i: number) => {
                const variance = (c.managerScore || 0) - (c.selfScore || 0);
                return (
                  <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <div><div className="text-xs text-slate-400">{c.category}</div><div className="text-sm font-medium text-slate-800">{c.criteria}</div></div>
                      <span className="text-xs bg-slate-200 text-slate-500 px-2 py-0.5 rounded">{c.weight}%</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-2">
                      <div>
                        <div className="text-xs text-amber-600 mb-1">Self Score (read-only)</div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-amber-100 rounded-full overflow-hidden"><div className="h-full bg-amber-400 rounded-full" style={{ width: `${(c.selfScore || 0) * 10}%` }} /></div>
                          <span className="text-xs font-semibold text-amber-600 w-8">{c.selfScore > 0 ? `${c.selfScore}/10` : '—'}</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-blue-600 mb-1">Manager Score {c.managerScore > 0 && c.selfScore > 0 && <span className={variance > 0 ? 'text-emerald-600' : variance < 0 ? 'text-red-500' : 'text-slate-400'}>{variance > 0 ? `+${variance}` : variance} ↕</span>}</div>
                        <div className="flex items-center gap-2">
                          <input type="range" min={0} max={10} value={c.managerScore || 0} onChange={e => updateManager(i, parseInt(e.target.value))} className="flex-1 accent-blue-500" />
                          <span className="text-xs font-bold text-blue-600 w-8">{c.managerScore || 0}/10</span>
                        </div>
                      </div>
                    </div>
                    <textarea value={c.comments || ''} onChange={e => updateComment(i, e.target.value)} rows={2} className={`${WIC} text-xs`} placeholder="Manager comments for this criterion…" />
                  </div>
                );
              })}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-xs text-blue-600">Weighted Manager Score</div>
                  <div className="text-xs text-slate-500 mt-0.5">Auto-suggested: <span className="font-semibold capitalize">{autoRating.replace(/_/g, ' ')}</span></div>
                </div>
                <span className="text-xl font-bold text-blue-600">{weightedManager} / 10</span>
              </div>
              {lowCriteria.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="text-xs font-semibold text-amber-700 mb-1">Recommended development areas (score &lt; 5):</div>
                  {lowCriteria.map((c: any, i: number) => (
                    <div key={i} className="text-xs text-amber-600">• {c.criteria} → {c.category.includes('Teach') ? 'Teaching Methodology Workshop' : 'Professional Development Program'}</div>
                  ))}
                </div>
              )}
              <WF label="Rating (override auto-suggestion)">
                <select value={rating} onChange={e => setRating(e.target.value)} className={WIC}>
                  <option value="">Auto: {autoRating.replace(/_/g, ' ')}</option>
                  {['outstanding','exceeds_expectations','meets_expectations','needs_improvement','unsatisfactory'].map(v => (
                    <option key={v} value={v}>{v.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </WF>
              <WF label="Manager Comments"><textarea value={managerComments} onChange={e => setManagerComments(e.target.value)} rows={3} className={WIC} placeholder="Overall manager feedback…" /></WF>
              <WF label="Goals for Next Period"><textarea value={goals} onChange={e => setGoals(e.target.value)} rows={3} className={WIC} placeholder="Set goals for next review period…" /></WF>
              <WF label="Development Plan"><textarea value={developmentPlan} onChange={e => setDevelopmentPlan(e.target.value)} rows={3} className={WIC} placeholder="Training, mentoring, activities…" /></WF>
              <Btn variant="primary" onClick={() => managerMut.mutate()}>{managerMut.isPending ? 'Saving…' : 'Save & Complete Review'}</Btn>
            </div>
          )}

          {/* SUMMARY */}
          {activeTab === 'summary' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-semibold text-slate-800">Score Summary</div>
                  <span className={`text-sm font-bold capitalize ${REVIEW_RATING_COLOR[review.rating || effectiveRating] || 'text-slate-600'}`}>{(review.rating || effectiveRating).replace(/_/g, ' ')}</span>
                </div>
                <div className="space-y-2">
                  {localCriteria.map((c: any, i: number) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="text-xs text-slate-600 flex-1 truncate">{c.criteria}</div>
                      <div className="flex gap-1 text-xs">
                        {c.selfScore > 0 && <span className="text-amber-500 w-6 text-right">{c.selfScore}</span>}
                        <span className="text-blue-600 font-semibold w-6 text-right">{c.managerScore || '—'}</span>
                      </div>
                      <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-[#0C447C] rounded-full" style={{ width: `${(c.managerScore || 0) * 10}%` }} />
                      </div>
                      <span className="text-xs text-slate-400 w-6">{c.weight}%</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-slate-200 flex justify-between">
                  <span className="text-sm text-slate-600">Final Score</span>
                  <span className="text-xl font-bold text-[#0C447C]">{review.finalScore ?? finalScore} / 10</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-xs font-semibold text-slate-500 mb-2">Enroll in Training</div>
                  <select value={enrollTrainingId} onChange={e => setEnrollTrainingId(e.target.value)} className={`${WIC} mb-2`}>
                    <option value="">Select training…</option>
                    {trainingList.filter((t: any) => t.status === 'upcoming').map((t: any) => <option key={t._id} value={t._id}>{t.title}</option>)}
                  </select>
                  <Btn variant="primary" onClick={() => enrollMut.mutate()} disabled={!enrollTrainingId || enrollMut.isPending}>
                    {enrollMut.isPending ? 'Enrolling…' : 'Enroll Staff'}
                  </Btn>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-xs font-semibold text-slate-500 mb-2">Recommended Increment</div>
                  <div className="text-2xl font-bold text-[#0C447C] mb-1">{REVIEW_INCREMENT[review.rating || effectiveRating] || '—'}</div>
                  <div className="text-xs text-slate-500">Based on <span className="capitalize">{(review.rating || effectiveRating).replace(/_/g, ' ')}</span> rating</div>
                </div>
              </div>
            </div>
          )}

          {/* HISTORY */}
          {activeTab === 'history' && (
            <div>
              {historyList.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">No previous reviews on record for this staff member.</div>
              ) : (
                <>
                  <div className="space-y-2">
                    {historyList.map((r: any) => (
                      <div key={r._id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="flex-1">
                          <div className="text-sm font-medium">{r.reviewPeriod || '—'}</div>
                          <div className="text-xs text-slate-500 capitalize">{(r.reviewType || '').replace('_', ' ')}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-[#0C447C]">{r.finalScore ?? '—'}</div>
                          <div className="text-xs text-slate-400">/ 10</div>
                        </div>
                        {r.rating && <Badge v={REVIEW_RATING_V[r.rating] ?? 'gray'}>{r.rating.replace(/_/g, ' ')}</Badge>}
                        <div className="text-xs text-slate-400">{r.reviewerName || '—'}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm text-center">
                    Average across {historyList.length} review{historyList.length !== 1 ? 's' : ''}:{' '}
                    <span className="font-bold text-[#0C447C]">
                      {historyList.some((r: any) => r.finalScore) ? (historyList.reduce((s: number, r: any) => s + (r.finalScore || 0), 0) / historyList.filter((r: any) => r.finalScore).length).toFixed(1) : '—'} / 10
                    </span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── CREATE CONTRACT MODAL ─────────────────────────────────────────────────────
function CreateContractModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ staffName: '', type: 'permanent', designation: '', department: '', startDate: '', endDate: '', grossSalary: 0, currency: 'PKR', noticePeriodDays: 30, workingHoursPerWeek: 40, autoRenew: false, termsAndConditions: '' });
  const mut = useMutation({
    mutationFn: () => hrService.createContract(form),
    onSuccess: () => { toast.success('Contract created'); onSuccess(); onClose(); },
    onError: () => toast.error('Failed to create contract'),
  });
  return (
    <ModalShell title="New Contract" onClose={onClose} footer={<><Btn onClick={onClose}>Cancel</Btn><Btn variant="primary" onClick={() => mut.mutate()}>{mut.isPending ? 'Creating…' : 'Create Contract'}</Btn></>}>
      <div className="grid grid-cols-2 gap-3">
        <WF label="Staff Name" required><input value={form.staffName} onChange={e => setForm(prev => ({ ...prev, staffName: e.target.value }))} className={WIC} placeholder="Full name" /></WF>
        <WF label="Contract Type" required>
          <select value={form.type} onChange={e => setForm(prev => ({ ...prev, type: e.target.value }))} className={WIC}>
            {[['permanent','Permanent'],['fixed_term','Fixed Term'],['probationary','Probationary'],['part_time','Part Time'],['visiting','Visiting'],['renewal','Renewal']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </WF>
        <WF label="Designation"><input value={form.designation} onChange={e => setForm(prev => ({ ...prev, designation: e.target.value }))} className={WIC} /></WF>
        <WF label="Department"><input value={form.department} onChange={e => setForm(prev => ({ ...prev, department: e.target.value }))} className={WIC} /></WF>
        <WF label="Start Date" required><input type="date" value={form.startDate} onChange={e => setForm(prev => ({ ...prev, startDate: e.target.value }))} className={WIC} /></WF>
        <WF label="End Date (blank = permanent)"><input type="date" value={form.endDate} onChange={e => setForm(prev => ({ ...prev, endDate: e.target.value }))} className={WIC} /></WF>
        <WF label="Gross Salary" required><input type="number" value={form.grossSalary} onChange={e => setForm(prev => ({ ...prev, grossSalary: parseFloat(e.target.value) || 0 }))} className={WIC} /></WF>
        <WF label="Currency"><select value={form.currency} onChange={e => setForm(prev => ({ ...prev, currency: e.target.value }))} className={WIC}>{['PKR','USD','AED','SAR'].map(c => <option key={c}>{c}</option>)}</select></WF>
        <WF label="Notice Period (days)"><input type="number" value={form.noticePeriodDays} onChange={e => setForm(prev => ({ ...prev, noticePeriodDays: parseInt(e.target.value) || 30 }))} className={WIC} /></WF>
        <WF label="Hours/Week"><input type="number" value={form.workingHoursPerWeek} onChange={e => setForm(prev => ({ ...prev, workingHoursPerWeek: parseInt(e.target.value) || 40 }))} className={WIC} /></WF>
      </div>
      <WF label="Terms & Conditions"><textarea value={form.termsAndConditions} onChange={e => setForm(prev => ({ ...prev, termsAndConditions: e.target.value }))} rows={3} className={WIC} placeholder="Key terms…" /></WF>
      <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.autoRenew} onChange={e => setForm(prev => ({ ...prev, autoRenew: e.target.checked }))} className="w-4 h-4 accent-[#0C447C]" /><span className="text-sm text-slate-700">Auto-renew on expiry</span></label>
    </ModalShell>
  );
}

// ─── PROCESS EXIT MODAL ────────────────────────────────────────────────────────
function ProcessExitModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ staffName: '', employeeId: '', exitType: 'resignation', resignationDate: '', lastWorkingDay: '', reason: '', noticePeriodServed: false, noticePeriodDays: 30, finalSettlementAmount: 0, finalSettlementDate: '', gratuityAmount: 0, leaveEncashment: 0 });
  const mut = useMutation({
    mutationFn: () => hrService.createExitRecord(form),
    onSuccess: () => { toast.success('Exit record created'); onSuccess(); onClose(); },
    onError: () => toast.error('Failed to process exit'),
  });
  return (
    <ModalShell title="Process Exit" onClose={onClose} footer={<><Btn onClick={onClose}>Cancel</Btn><Btn variant="danger" onClick={() => mut.mutate()}>{mut.isPending ? 'Processing…' : 'Process Exit'}</Btn></>}>
      <div className="grid grid-cols-2 gap-3">
        <WF label="Staff Name" required><input value={form.staffName} onChange={e => setForm(prev => ({ ...prev, staffName: e.target.value }))} className={WIC} placeholder="Full name" /></WF>
        <WF label="Employee ID"><input value={form.employeeId} onChange={e => setForm(prev => ({ ...prev, employeeId: e.target.value }))} className={WIC} placeholder="EMP-XXXX" /></WF>
        <WF label="Exit Type" required>
          <select value={form.exitType} onChange={e => setForm(prev => ({ ...prev, exitType: e.target.value }))} className={WIC}>
            {[['resignation','Resignation'],['termination','Termination'],['retirement','Retirement'],['contract_end','Contract End'],['mutual_agreement','Mutual Agreement'],['death','Death'],['abandonment','Abandonment']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </WF>
        <WF label="Notice Period Days"><input type="number" value={form.noticePeriodDays} onChange={e => setForm(prev => ({ ...prev, noticePeriodDays: parseInt(e.target.value) || 0 }))} className={WIC} /></WF>
        <WF label="Resignation Date" required><input type="date" value={form.resignationDate} onChange={e => setForm(prev => ({ ...prev, resignationDate: e.target.value }))} className={WIC} /></WF>
        <WF label="Last Working Day" required><input type="date" value={form.lastWorkingDay} onChange={e => setForm(prev => ({ ...prev, lastWorkingDay: e.target.value }))} className={WIC} /></WF>
        <WF label="Final Settlement"><input type="number" value={form.finalSettlementAmount} onChange={e => setForm(prev => ({ ...prev, finalSettlementAmount: parseFloat(e.target.value) || 0 }))} className={WIC} /></WF>
        <WF label="Settlement Date"><input type="date" value={form.finalSettlementDate} onChange={e => setForm(prev => ({ ...prev, finalSettlementDate: e.target.value }))} className={WIC} /></WF>
        <WF label="Gratuity Amount"><input type="number" value={form.gratuityAmount} onChange={e => setForm(prev => ({ ...prev, gratuityAmount: parseFloat(e.target.value) || 0 }))} className={WIC} /></WF>
        <WF label="Leave Encashment"><input type="number" value={form.leaveEncashment} onChange={e => setForm(prev => ({ ...prev, leaveEncashment: parseFloat(e.target.value) || 0 }))} className={WIC} /></WF>
      </div>
      <WF label="Reason"><textarea value={form.reason} onChange={e => setForm(prev => ({ ...prev, reason: e.target.value }))} rows={3} className={WIC} placeholder="Reason for exit…" /></WF>
      <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.noticePeriodServed} onChange={e => setForm(prev => ({ ...prev, noticePeriodServed: e.target.checked }))} className="w-4 h-4 accent-[#0C447C]" /><span className="text-sm text-slate-700">Notice period served</span></label>
    </ModalShell>
  );
}

// ─── CLEARANCE MODAL ───────────────────────────────────────────────────────────
function ClearanceModal({ exitRecord, onClose, onSuccess }: { exitRecord: any; onClose: () => void; onSuccess: () => void }) {
  const checklist: any[] = exitRecord.clearanceChecklist || [];
  const cleared = checklist.filter((c: any) => c.isDone).length;
  const pct = checklist.length > 0 ? Math.round((cleared / checklist.length) * 100) : 0;
  const byDept: Record<string, { item: any; idx: number }[]> = {};
  checklist.forEach((item: any, idx: number) => {
    const dept = item.department || 'General';
    if (!byDept[dept]) byDept[dept] = [];
    byDept[dept].push({ item, idx });
  });
  const handleToggle = async (idx: number, currentDone: boolean) => {
    try {
      await hrService.updateClearanceItem(exitRecord._id, idx, !currentDone, 'HR Admin');
      toast.success(!currentDone ? 'Item cleared' : 'Item unmarked');
      onSuccess();
    } catch {
      toast.error('Failed to update clearance item');
    }
  };
  return (
    <ModalShell title={`Clearance — ${exitRecord.staffName || '—'}`} onClose={onClose} footer={<Btn onClick={onClose}>Close</Btn>}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-slate-500">{cleared} of {checklist.length} items cleared</span>
        <span className={`text-xs font-semibold ${pct === 100 ? 'text-emerald-600' : 'text-slate-500'}`}>{pct}%</span>
      </div>
      <PBar pct={pct} color={pct === 100 ? '#10b981' : '#0C447C'} />
      {Object.entries(byDept).map(([dept, items]) => (
        <div key={dept}>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 mt-3">{dept}</div>
          {items.map(({ item, idx }) => (
            <div key={idx} className="flex items-start gap-3 py-2 border-b border-slate-50 last:border-0">
              <button onClick={() => handleToggle(idx, item.isDone)} className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${item.isDone ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 hover:border-[#0C447C]'}`}>
                {item.isDone && <span className="text-[10px]">✓</span>}
              </button>
              <div className="flex-1">
                <div className={`text-sm ${item.isDone ? 'line-through text-slate-400' : 'text-slate-800'}`}>{item.item}</div>
                {item.isDone && item.clearedBy && <div className="text-xs text-slate-400">Cleared by {item.clearedBy}{item.clearedAt ? ` · ${new Date(item.clearedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : ''}</div>}
              </div>
            </div>
          ))}
        </div>
      ))}
    </ModalShell>
  );
}

// ─── ATTENDANCE TAB ───────────────────────────────────────────────────────────
function AttendanceTab() {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [markingMode, setMarkingMode] = useState(false);
  const [draftRows, setDraftRows] = useState<Record<string, { status: string; checkInTime: string; checkOutTime: string }>>({});
  const [showAttendanceSettings, setShowAttendanceSettings] = useState(false);
  const [showShiftsModal, setShowShiftsModal] = useState(false);
  const qc = useQueryClient();

  const { data: attendance = [], isLoading: attLoading } = useQuery({
    queryKey: ['staff-attendance', selectedDate],
    queryFn: () => hrService.getStaffAttendance({ date: selectedDate }),
  });
  const { data: staff = [] } = useQuery({ queryKey: ['staff'], queryFn: hrService.getStaff });

  const markMut = useMutation({
    mutationFn: (records: any[]) => hrService.markStaffAttendance(records),
    onSuccess: () => { toast.success('Attendance saved'); qc.invalidateQueries({ queryKey: ['staff-attendance'] }); setMarkingMode(false); setDraftRows({}); },
    onError: () => toast.error('Failed to save attendance'),
  });

  // ── Biometric integration ──────────────────────────────────────────
  const [bioIp, setBioIp] = useState('');
  const [bioPort, setBioPort] = useState(4370);
  const [bioType, setBioType] = useState('zkteco');
  const [autoSync, setAutoSync] = useState(false);
  const [autoSyncMins, setAutoSyncMins] = useState(30);
  const bioInitialized = useRef(false);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const { data: bioStatus } = useQuery({
    queryKey: ['biometric-status'],
    queryFn: hrService.getBiometricStatus,
    refetchInterval: 60000,
  });
  const bs = bioStatus as any;

  useEffect(() => {
    if (bs?.configured && !bioInitialized.current) {
      setBioIp(bs.deviceIp || '');
      setBioPort(bs.devicePort || 4370);
      setBioType(bs.deviceType || 'zkteco');
      setAutoSync(!!bs.autoSyncEnabled);
      setAutoSyncMins(bs.autoSyncIntervalMins || 30);
      bioInitialized.current = true;
    }
  }, [bs]);

  const saveConfigMut = useMutation({
    mutationFn: (payload: any) => hrService.saveBiometricConfig(payload),
    onSuccess: () => { toast.success('Biometric device configuration saved'); qc.invalidateQueries({ queryKey: ['biometric-status'] }); },
    onError: () => toast.error('Failed to save device configuration'),
  });
  const syncMut = useMutation({
    mutationFn: () => hrService.syncBiometricAttendance(),
    onSuccess: (res: any) => { toast.success(res?.message || 'Sync complete'); qc.invalidateQueries({ queryKey: ['biometric-status'] }); qc.invalidateQueries({ queryKey: ['staff-attendance'] }); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Sync failed'),
  });
  const importMut = useMutation({
    mutationFn: (file: File) => hrService.importAttendanceCsv(file),
    onSuccess: (res: any) => { toast.success(res?.message || 'Attendance imported'); qc.invalidateQueries({ queryKey: ['staff-attendance'] }); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Import failed'),
  });

  useEffect(() => {
    if (!autoSync || !bs?.configured) return;
    const id = setInterval(() => syncMut.mutate(), Math.max(autoSyncMins, 1) * 60000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSync, autoSyncMins, bs?.configured]);

  const handleSaveBioConfig = () => {
    if (!bioIp.trim()) { toast.error('Enter the device IP first'); return; }
    saveConfigMut.mutate({ deviceIp: bioIp.trim(), devicePort: bioPort, deviceType: bioType, autoSyncEnabled: autoSync, autoSyncIntervalMins: autoSyncMins });
  };
  const handleToggleAutoSync = () => {
    if (!bioIp.trim()) { toast.error('Configure and save the device IP first'); return; }
    const next = !autoSync;
    setAutoSync(next);
    saveConfigMut.mutate({ deviceIp: bioIp.trim(), devicePort: bioPort, deviceType: bioType, autoSyncEnabled: next, autoSyncIntervalMins: autoSyncMins });
  };
  const handleCsvSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) importMut.mutate(file);
    e.target.value = '';
  };

  const attList = attendance as any[];
  const staffList = staff as any[];
  const attMap = new Map(attList.map((a: any) => [a.staffId?.toString(), a]));

  const present = attList.filter((a: any) => a.status === 'present').length;
  const absent = attList.filter((a: any) => a.status === 'absent').length;
  const late = attList.filter((a: any) => a.status === 'late').length;
  const onLeave = attList.filter((a: any) => a.status === 'on_leave').length;

  const handleStartMarking = () => {
    const draft: Record<string, { status: string; checkInTime: string; checkOutTime: string }> = {};
    staffList.forEach((s: any) => {
      const ex = attMap.get(s._id?.toString());
      draft[s._id] = { status: ex?.status || 'present', checkInTime: ex?.checkInTime || '', checkOutTime: ex?.checkOutTime || '' };
    });
    setDraftRows(draft);
    setMarkingMode(true);
  };

  const handleSave = () => {
    const records = staffList.map((s: any) => ({
      staffId: s._id, date: selectedDate,
      status: draftRows[s._id]?.status || 'absent',
      checkInTime: draftRows[s._id]?.checkInTime || '',
      checkOutTime: draftRows[s._id]?.checkOutTime || '',
    }));
    markMut.mutate(records);
  };

  const sV: Record<string, BadgeVariant> = { present: 'green', absent: 'red', late: 'amber', half_day: 'blue', on_leave: 'blue', remote: 'purple', holiday: 'gray', weekend: 'gray' };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-slate-900">Attendance Management</h1>
        <div className="flex gap-2">
          <Btn onClick={() => setShowShiftsModal(true)}>⏰ Shifts</Btn>
          <Btn onClick={() => setShowAttendanceSettings(true)}>⚙️ Attendance Settings</Btn>
          {markingMode ? (
            <><Btn onClick={() => setMarkingMode(false)}>Cancel</Btn><Btn variant="success" onClick={handleSave}>{markMut.isPending ? 'Saving…' : 'Save All'}</Btn></>
          ) : <Btn variant="primary" onClick={handleStartMarking}>Mark Attendance</Btn>}
        </div>
      </div>
      <div className="grid grid-cols-4 gap-3 mb-5">
        <KPI label="Present" value={String(present)} color="green" />
        <KPI label="Absent" value={String(absent)} color="red" />
        <KPI label="Late" value={String(late)} color="amber" />
        <KPI label="On Leave" value={String(onLeave)} color="navy" />
      </div>
      <div className="flex items-center gap-3 mb-4">
        <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white" />
        <span className="text-xs text-slate-500">{attList.length} records for this date</span>
      </div>
      <Card>
        {attLoading ? (
          <div className="p-8 text-center text-slate-400 text-sm animate-pulse">Loading attendance…</div>
        ) : markingMode ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <THead cols={['Employee', 'Designation', 'Status', 'Check In', 'Check Out']} />
              <tbody>
                {staffList.map((s: any) => (
                  <tr key={s._id} className="border-b border-slate-50">
                    <Td>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: avatarColor(s._id) }}>{lcInitials(s)}</div>
                        <span className="font-medium">{s.firstName} {s.lastName}</span>
                      </div>
                    </Td>
                    <Td>{s.designation || s.designationId?.name || '—'}</Td>
                    <Td>
                      <select value={draftRows[s._id]?.status || 'present'} onChange={e => setDraftRows(prev => ({ ...prev, [s._id]: { ...prev[s._id], status: e.target.value } }))} className="px-2 py-1 text-xs border border-slate-200 rounded-lg">
                        {['present','absent','late','half_day','on_leave','remote'].map(v => <option key={v} value={v}>{v.replace('_', ' ')}</option>)}
                      </select>
                    </Td>
                    <Td><input type="time" value={draftRows[s._id]?.checkInTime || ''} onChange={e => setDraftRows(prev => ({ ...prev, [s._id]: { ...prev[s._id], checkInTime: e.target.value } }))} className="px-2 py-1 text-xs border border-slate-200 rounded-lg" /></Td>
                    <Td><input type="time" value={draftRows[s._id]?.checkOutTime || ''} onChange={e => setDraftRows(prev => ({ ...prev, [s._id]: { ...prev[s._id], checkOutTime: e.target.value } }))} className="px-2 py-1 text-xs border border-slate-200 rounded-lg" /></Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : attList.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <div className="text-slate-500 font-medium">No attendance records for this date</div>
            <div className="text-xs text-slate-400 mt-1">Click "Mark Attendance" to add records</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <THead cols={['Employee', 'Designation', 'Check In', 'Check Out', 'Hours', 'Status']} />
              <tbody>
                {attList.map((a: any, i: number) => (
                  <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                    <Td><div className="font-medium">{a.staffId?.firstName || '—'} {a.staffId?.lastName || ''}</div></Td>
                    <Td>{a.staffId?.designation || a.staffId?.designationId?.name || '—'}</Td>
                    <Td>{a.checkInTime || '—'}</Td>
                    <Td>{a.checkOutTime || '—'}</Td>
                    <Td>{a.workingHours ? `${a.workingHours}h` : '—'}</Td>
                    <Td><Badge v={sV[a.status] ?? 'gray'}>{(a.status || '').replace('_', ' ')}</Badge></Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="mt-5">
        <CardHeader title="Biometric Integration" sub="Pull attendance from a fingerprint/face device (ZKTeco and compatible)" />
        <div className="p-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              {bs?.connected ? (
                <Badge v="green"><Wifi size={12} />Connected</Badge>
              ) : bs?.configured ? (
                <Badge v="red"><WifiOff size={12} />Disconnected</Badge>
              ) : (
                <Badge v="gray">Not configured</Badge>
              )}
              <span className="text-xs text-slate-400">
                Last sync: {bs?.lastSyncAt ? new Date(bs.lastSyncAt).toLocaleString() : 'Never'}
              </span>
            </div>
            <div className="flex gap-2">
              <Btn onClick={() => syncMut.mutate()} disabled={syncMut.isPending || !bs?.configured}>
                <RefreshCw size={13} className={syncMut.isPending ? 'animate-spin' : ''} />
                {syncMut.isPending ? 'Syncing…' : 'Sync Now'}
              </Btn>
              <Btn onClick={() => csvInputRef.current?.click()} disabled={importMut.isPending}>
                <Upload size={13} />
                {importMut.isPending ? 'Importing…' : 'Import from CSV/Excel'}
              </Btn>
              <input ref={csvInputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleCsvSelected} />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3 items-end">
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">Device IP</label>
              <input value={bioIp} onChange={e => setBioIp(e.target.value)} placeholder="192.168.1.201" className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">Port</label>
              <input type="number" value={bioPort} onChange={e => setBioPort(parseInt(e.target.value) || 4370)} className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">Device Type</label>
              <select value={bioType} onChange={e => setBioType(e.target.value)} className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white">
                <option value="zkteco">ZKTeco</option>
                <option value="other">Other</option>
              </select>
            </div>
            <Btn variant="primary" onClick={handleSaveBioConfig} disabled={saveConfigMut.isPending}>
              {saveConfigMut.isPending ? 'Saving…' : 'Save Config'}
            </Btn>
          </div>
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100">
            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
              <input type="checkbox" checked={autoSync} onChange={handleToggleAutoSync} className="rounded" />
              Auto Sync every
            </label>
            <input type="number" min={5} value={autoSyncMins} onChange={e => setAutoSyncMins(parseInt(e.target.value) || 30)} disabled={!autoSync} className="w-20 px-2 py-1 text-xs border border-slate-200 rounded-lg disabled:opacity-50" />
            <span className="text-xs text-slate-500">minutes</span>
          </div>
        </div>
      </Card>
      {showAttendanceSettings && <AttendanceSettingsModal onClose={() => setShowAttendanceSettings(false)} />}
      {showShiftsModal && <ShiftsModal onClose={() => setShowShiftsModal(false)} />}
    </div>
  );
}

function AttendanceSettingsModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const { data: settings, isLoading } = useQuery({ queryKey: ['attendance-settings'], queryFn: hrService.getAttendanceSettings });
  const [form, setForm] = useState<any | null>(null);

  useEffect(() => {
    if (settings && !form) setForm(settings);
  }, [settings]);

  const saveMut = useMutation({
    mutationFn: (payload: any) => hrService.updateAttendanceSettings(payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['attendance-settings'] }); toast.success('Attendance settings saved'); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to save settings'),
  });

  if (isLoading || !form) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-10 text-center text-sm text-slate-400 animate-pulse">Loading attendance settings…</div>
      </div>
    );
  }

  const days = [['mon','Mon'],['tue','Tue'],['wed','Wed'],['thu','Thu'],['fri','Fri'],['sat','Sat'],['sun','Sun']];
  const workingDays: string[] = form.workingDays || [];
  function toggleDay(d: string) {
    setForm({ ...form, workingDays: workingDays.includes(d) ? workingDays.filter(x => x !== d) : [...workingDays, d] });
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col" style={{ maxHeight: '85vh' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div>
            <div className="font-bold text-slate-900">Attendance Settings</div>
            <p className="text-xs text-slate-400 mt-0.5">Grace period and cutoffs used to determine present/late/half-day when attendance is imported without an explicit status</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Standard Check-in Time</label>
              <input type="time" value={form.standardCheckInTime || '08:00'} onChange={(e) => setForm({ ...form, standardCheckInTime: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Half-Day Cutoff Time</label>
              <input type="time" value={form.halfDayCutoffTime || '13:00'} onChange={(e) => setForm({ ...form, halfDayCutoffTime: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Grace Period (minutes)</label>
              <input type="number" value={form.graceMinutes ?? 15} onChange={(e) => setForm({ ...form, graceMinutes: Number(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" />
              <p className="text-[10px] text-slate-400 mt-1">Check-ins within this many minutes after the standard time still count as on-time</p>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Late Threshold (minutes)</label>
              <input type="number" value={form.lateThresholdMinutes ?? 60} onChange={(e) => setForm({ ...form, lateThresholdMinutes: Number(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" />
              <p className="text-[10px] text-slate-400 mt-1">Beyond grace but within this window still counts as "late" rather than half-day</p>
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-2 block">Working Days</label>
            <div className="flex gap-2">
              {days.map(([v, l]) => (
                <button key={v} onClick={() => toggleDay(v)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${workingDays.includes(v) ? 'bg-blue-50 text-[#0C447C] border-blue-300' : 'bg-white text-slate-400 border-slate-200'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div className="pt-4 border-t border-slate-100">
            <div className="font-semibold text-sm text-slate-800 mb-1">Payroll Impact</div>
            <p className="text-xs text-slate-400 mb-3">How lates and half-days actually affect pay in the payroll wizard - start simple, adjust as your school's real policy is confirmed</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Lates per Day Deducted</label>
                <input type="number" min={1} value={form.latesPerDayDeduction ?? 3} onChange={(e) => setForm({ ...form, latesPerDayDeduction: Number(e.target.value) || 1 })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" />
                <p className="text-[10px] text-slate-400 mt-1">This many "late" days in a payroll period = 1 full day's pay deducted</p>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Half-Day Deduction</label>
                <input type="number" min={0} max={1} step={0.05} value={form.halfDayDeductionValue ?? 0.5} onChange={(e) => setForm({ ...form, halfDayDeductionValue: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" />
                <p className="text-[10px] text-slate-400 mt-1">Each "half-day" costs this fraction of a full day's pay (0.5 = half pay)</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100 shrink-0">
          <Btn onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" onClick={() => saveMut.mutate(form)}>{saveMut.isPending ? 'Saving…' : 'Save Settings'}</Btn>
        </div>
      </div>
    </div>
  );
}

const EMPTY_SHIFT_FORM = { name: '', startTime: '08:00', endTime: '15:00', graceMinutes: 15, lateThresholdMinutes: 60, halfDayCutoffTime: '', applicableDays: ['mon', 'tue', 'wed', 'thu', 'fri'], isDefault: false, saturdayPolicy: 'all', saturdayOffOccurrence: 5 };
const SHIFT_DAYS: [string, string][] = [['mon', 'Mon'], ['tue', 'Tue'], ['wed', 'Wed'], ['thu', 'Thu'], ['fri', 'Fri'], ['sat', 'Sat'], ['sun', 'Sun']];

function ShiftsModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'shifts' | 'assign'>('shifts');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_SHIFT_FORM });
  const [expandedStaffId, setExpandedStaffId] = useState<string | null>(null);
  const [draftShiftIds, setDraftShiftIds] = useState<string[]>([]);

  const { data: shifts = [], isLoading } = useQuery({ queryKey: ['shifts'], queryFn: hrService.getShifts });
  const { data: staffList = [] } = useQuery({ queryKey: ['staff'], queryFn: hrService.getStaff });
  const list = shifts as any[];
  const staffArr = staffList as any[];

  const createMut = useMutation({
    mutationFn: hrService.createShift,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['shifts'] }); toast.success('Shift added'); closeForm(); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to add shift'),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => hrService.updateShift(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['shifts'] }); toast.success('Shift updated'); closeForm(); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update shift'),
  });
  const deleteMut = useMutation({
    mutationFn: hrService.deleteShift,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['shifts'] }); toast.success('Shift deleted'); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to delete — it may be assigned to staff'),
  });
  const assignMultiMut = useMutation({
    mutationFn: ({ staffId, shiftIds }: { staffId: string; shiftIds: string[] }) => hrService.assignStaffShifts(staffId, shiftIds),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['staff'] }); toast.success('Shifts updated'); setExpandedStaffId(null); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to assign shifts - check for overlapping days'),
  });

  function openAssignPanel(s: any) {
    const current: string[] = (s.shiftIds && s.shiftIds.length > 0) ? s.shiftIds.map((id: any) => id?._id || id) : (s.shiftId ? [s.shiftId?._id || s.shiftId] : []);
    setDraftShiftIds(current);
    setExpandedStaffId(s._id);
  }
  function toggleDraftShift(shiftId: string) {
    setDraftShiftIds(p => p.includes(shiftId) ? p.filter(x => x !== shiftId) : [...p, shiftId]);
  }

  function closeForm() { setShowForm(false); setEditingId(null); setForm({ ...EMPTY_SHIFT_FORM }); }
  function openEdit(s: any) {
    setEditingId(s._id);
    setForm({
      name: s.name, startTime: s.startTime, endTime: s.endTime,
      graceMinutes: s.graceMinutes, lateThresholdMinutes: s.lateThresholdMinutes,
      halfDayCutoffTime: s.halfDayCutoffTime || '', applicableDays: s.applicableDays || [], isDefault: !!s.isDefault,
      saturdayPolicy: s.saturdayPolicy || 'all', saturdayOffOccurrence: s.saturdayOffOccurrence ?? 5,
    });
    setShowForm(true);
  }
  function toggleDay(d: string) {
    setForm(p => ({ ...p, applicableDays: p.applicableDays.includes(d) ? p.applicableDays.filter(x => x !== d) : [...p.applicableDays, d] }));
  }
  function handleSave() {
    if (!form.name.trim()) { toast.error('Shift name is required'); return; }
    const payload = { ...form, halfDayCutoffTime: form.halfDayCutoffTime || undefined };
    if (editingId) updateMut.mutate({ id: editingId, data: payload });
    else createMut.mutate(payload);
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col" style={{ maxHeight: '85vh' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div>
            <div className="font-bold text-slate-900">Shifts</div>
            <p className="text-xs text-slate-400 mt-0.5">Define work shifts and assign staff — attendance status is computed against each person's own shift</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"><X size={18} /></button>
        </div>
        <div className="flex gap-2 px-6 pt-3 border-b border-slate-100 shrink-0">
          {(['shifts', 'assign'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px ${tab === t ? 'border-[#0C447C] text-[#0C447C]' : 'border-transparent text-slate-400'}`}>
              {t === 'shifts' ? 'Shifts' : 'Assign Staff'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {tab === 'shifts' ? (
            isLoading ? (
              <div className="py-12 text-center text-sm text-slate-400 animate-pulse">Loading shifts…</div>
            ) : (
              <div className="space-y-2">
                {list.map((s: any) => (
                  <div key={s._id} className={`flex items-center justify-between p-3 rounded-lg border ${s.isActive ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50 opacity-60'}`}>
                    <div className="flex items-center gap-3">
                      {s.isDefault && <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-50 text-[#0C447C]">Default</span>}
                      <div>
                        <div className="text-sm font-semibold text-slate-800">{s.name}</div>
                        <div className="text-xs text-slate-400">
                          {s.startTime}–{s.endTime} · {s.graceMinutes}m grace · {(s.applicableDays || []).map((d: string) => d.slice(0, 1).toUpperCase()).join('')}
                          {(s.applicableDays || []).includes('sat') && s.saturdayPolicy && s.saturdayPolicy !== 'all' && (
                            <span className="text-amber-600"> · {s.saturdayPolicy === 'alternate_odd' ? 'Alt Sat (1st/3rd)' : s.saturdayPolicy === 'alternate_even' ? 'Alt Sat (2nd/4th)' : `Sat off (${s.saturdayOffOccurrence === 5 ? 'last' : `${s.saturdayOffOccurrence}${['','st','nd','rd'][s.saturdayOffOccurrence] || 'th'}`})`}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(s)} className="px-2 py-1 text-xs bg-blue-50 text-[#0C447C] rounded-lg hover:bg-blue-100 font-medium">Edit</button>
                      <button onClick={() => { if (confirm(`Delete "${s.name}"? This cannot be undone.`)) deleteMut.mutate(s._id); }} className="px-2 py-1 text-xs text-red-500 hover:bg-red-50 rounded-lg font-medium">Delete</button>
                    </div>
                  </div>
                ))}
                {list.length === 0 && <div className="py-8 text-center text-sm text-slate-400">No shifts configured yet — attendance falls back to Attendance Settings until you add one</div>}

                {showForm ? (
                  <div className="mt-4 p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <label className="text-xs text-slate-500 mb-1 block">Shift Name</label>
                        <input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]" placeholder="e.g. Morning Shift, Admin Hours" />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">Start Time</label>
                        <input type="time" value={form.startTime} onChange={(e) => setForm(p => ({ ...p, startTime: e.target.value }))} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">End Time</label>
                        <input type="time" value={form.endTime} onChange={(e) => setForm(p => ({ ...p, endTime: e.target.value }))} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">Grace Period (minutes)</label>
                        <input type="number" value={form.graceMinutes} onChange={(e) => setForm(p => ({ ...p, graceMinutes: Number(e.target.value) || 0 }))} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">Late Threshold (minutes)</label>
                        <input type="number" value={form.lateThresholdMinutes} onChange={(e) => setForm(p => ({ ...p, lateThresholdMinutes: Number(e.target.value) || 0 }))} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" />
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs text-slate-500 mb-2 block">Applicable Days</label>
                        <div className="flex gap-2">
                          {SHIFT_DAYS.map(([v, l]) => (
                            <button key={v} type="button" onClick={() => toggleDay(v)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${form.applicableDays.includes(v) ? 'bg-blue-50 text-[#0C447C] border-blue-300' : 'bg-white text-slate-400 border-slate-200'}`}>
                              {l}
                            </button>
                          ))}
                        </div>
                      </div>
                      {form.applicableDays.includes('sat') && (
                        <div className="col-span-2 p-3 bg-amber-50/50 border border-amber-100 rounded-lg space-y-2">
                          <label className="text-xs font-medium text-slate-600 block">Saturday Policy</label>
                          <select value={form.saturdayPolicy} onChange={(e) => setForm(p => ({ ...p, saturdayPolicy: e.target.value }))}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white">
                            <option value="all">Every Saturday is a working day</option>
                            <option value="alternate_odd">Alternate Saturdays - 1st &amp; 3rd of the month</option>
                            <option value="alternate_even">Alternate Saturdays - 2nd &amp; 4th of the month</option>
                            <option value="all_except_nth">Every Saturday except one specific occurrence</option>
                          </select>
                          {form.saturdayPolicy === 'all_except_nth' && (
                            <select value={form.saturdayOffOccurrence} onChange={(e) => setForm(p => ({ ...p, saturdayOffOccurrence: Number(e.target.value) }))}
                              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white">
                              <option value={1}>1st Saturday off</option>
                              <option value={2}>2nd Saturday off</option>
                              <option value={3}>3rd Saturday off</option>
                              <option value={4}>4th Saturday off</option>
                              <option value={5}>Last Saturday off (whether the month has 4 or 5)</option>
                            </select>
                          )}
                        </div>
                      )}
                      <div className="flex items-end pb-2">
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm(p => ({ ...p, isDefault: e.target.checked }))} className="accent-[#0C447C]" />
                          Default shift for unassigned staff
                        </label>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Btn onClick={closeForm}>Cancel</Btn>
                      <Btn variant="primary" onClick={handleSave}>{(createMut.isPending || updateMut.isPending) ? 'Saving…' : editingId ? 'Save Changes' : '+ Add Shift'}</Btn>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setShowForm(true)} className="w-full mt-4 py-2.5 text-sm text-[#0C447C] border-2 border-dashed border-blue-200 rounded-lg hover:border-[#0C447C] hover:bg-blue-50 transition-colors">
                    ＋ Add Shift
                  </button>
                )}
              </div>
            )
          ) : (
            <div className="space-y-1">
              {staffArr.map((s: any) => {
                const assignedIds: string[] = (s.shiftIds && s.shiftIds.length > 0) ? s.shiftIds.map((id: any) => id?._id || id) : (s.shiftId ? [s.shiftId?._id || s.shiftId] : []);
                const assignedShifts = list.filter((sh: any) => assignedIds.includes(sh._id));
                const isExpanded = expandedStaffId === s._id;
                return (
                  <div key={s._id} className="rounded-lg hover:bg-slate-50">
                    <div className="flex items-center justify-between p-2.5">
                      <div className="flex-1">
                        <div className="text-sm text-slate-700">{s.firstName} {s.lastName} <span className="text-xs text-slate-400">{s.department || ''}</span></div>
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {assignedShifts.length === 0
                            ? <span className="text-[11px] text-slate-400">Default / Unassigned</span>
                            : assignedShifts.map((sh: any) => (
                                <span key={sh._id} className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-[#0C447C] border border-blue-100">
                                  {sh.name} ({(sh.applicableDays || []).map((d: string) => d.slice(0,1).toUpperCase()).join('')})
                                </span>
                              ))}
                        </div>
                      </div>
                      <button onClick={() => isExpanded ? setExpandedStaffId(null) : openAssignPanel(s)} className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg hover:bg-slate-50 font-medium">
                        {isExpanded ? 'Close' : 'Manage Shifts'}
                      </button>
                    </div>
                    {isExpanded && (
                      <div className="mx-2.5 mb-2.5 p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                        <p className="text-[11px] text-slate-500">Select one or more shifts - each can cover different days (e.g. a Mon-Thu shift plus a separate Friday or Saturday shift). Assigned shifts can't overlap on the same day.</p>
                        <div className="space-y-1.5">
                          {list.map((sh: any) => (
                            <label key={sh._id} className="flex items-center gap-2 text-xs cursor-pointer">
                              <input type="checkbox" checked={draftShiftIds.includes(sh._id)} onChange={() => toggleDraftShift(sh._id)} className="accent-[#0C447C]" />
                              <span className="font-medium text-slate-700">{sh.name}</span>
                              <span className="text-slate-400">{sh.startTime}–{sh.endTime} · {(sh.applicableDays || []).map((d: string) => d.slice(0,1).toUpperCase()).join('')}</span>
                            </label>
                          ))}
                          {list.length === 0 && <p className="text-xs text-slate-400">No shifts configured yet - add one in the Shifts tab first.</p>}
                        </div>
                        <div className="flex justify-end gap-2 pt-1">
                          <Btn onClick={() => setExpandedStaffId(null)}>Cancel</Btn>
                          <Btn variant="primary" onClick={() => assignMultiMut.mutate({ staffId: s._id, shiftIds: draftShiftIds })}>
                            {assignMultiMut.isPending ? 'Saving…' : 'Save'}
                          </Btn>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {staffArr.length === 0 && <div className="py-8 text-center text-sm text-slate-400">No staff found</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── LEAVE TAB ────────────────────────────────────────────────────────────────
function LeaveTab() {
  const qc = useQueryClient();
  type SubTab = 'all' | 'pending' | 'approved' | 'rejected' | 'policies';
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('all');
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [approveRejectState, setApproveRejectState] = useState<{ action: 'approve' | 'reject'; id: string } | null>(null);

  const { data: leaveStats } = useQuery({ queryKey: ['leave-stats'], queryFn: hrService.getLeaveStats });
  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['leave-applications', activeSubTab],
    queryFn: () => hrService.getLeaveApplications(activeSubTab === 'all' ? undefined : { status: activeSubTab }),
    enabled: activeSubTab !== 'policies',
  });

  const refetchAll = () => { qc.invalidateQueries({ queryKey: ['leave-applications'] }); qc.invalidateQueries({ queryKey: ['leave-stats'] }); };
  const appList = applications as any[];
  const stats = leaveStats as any;
  const fmt = (d: string) => { try { return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return d || '—'; } };
  const lV: Record<string, BadgeVariant> = { pending: 'amber', approved: 'green', rejected: 'red', cancelled: 'gray', on_hold: 'blue' };
  const SUB_TABS: { key: SubTab; label: string }[] = [
    { key: 'all', label: 'All Applications' },
    { key: 'pending', label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
    { key: 'policies', label: 'Policies & Balances' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-slate-900">Leave Management</h1>
        <Btn variant="primary" onClick={() => setShowApplyModal(true)}>+ Apply Leave</Btn>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-5">
        <KPI label="Pending Approvals" value={String(stats?.pending ?? 0)} color="amber" />
        <KPI label="Approved This Month" value={String(stats?.approved ?? 0)} color="green" />
        <KPI label="Total Applications" value={String(stats?.total ?? 0)} color="navy" />
      </div>
      <div className="flex gap-1 mb-4 flex-wrap">
        {SUB_TABS.map(({ key, label }) => (
          <button key={key} onClick={() => setActiveSubTab(key)} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${activeSubTab === key ? 'bg-[#0C447C] text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{label}</button>
        ))}
      </div>
      {activeSubTab === 'policies' ? (
        <PoliciesBalancesSubTab onRefetchAll={refetchAll} />
      ) : (
        <Card>
          {isLoading ? (
            <div className="p-8 text-center text-slate-400 text-sm animate-pulse">Loading applications…</div>
          ) : appList.length === 0 ? (
            <div className="p-12 text-center"><BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" /><div className="text-slate-500">No leave applications found</div></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <THead cols={['Staff Name', 'Leave Type', 'From', 'To', 'Days', 'Reason', 'Status', 'Actions']} />
                <tbody>
                  {appList.map((l: any) => (
                    <tr key={l._id} className="border-b border-slate-50 hover:bg-slate-50">
                      <Td><div className="font-medium">{l.staffName || '—'}</div><div className="text-xs text-slate-400">{l.staffEmployeeId}</div></Td>
                      <Td className="capitalize">{(l.leaveType || '').replace('_', ' ')}</Td>
                      <Td>{fmt(l.fromDate)}</Td>
                      <Td>{fmt(l.toDate)}</Td>
                      <Td>{l.totalDays ?? '—'}</Td>
                      <Td><div className="max-w-[160px] truncate text-slate-500">{l.reason || '—'}</div></Td>
                      <Td><Badge v={lV[l.status] ?? 'gray'}>{l.status}</Badge></Td>
                      <Td>
                        {l.status === 'pending' && (
                          <div className="flex gap-1">
                            <button onClick={() => setApproveRejectState({ action: 'approve', id: l._id })} className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-2 py-0.5 rounded-lg">Approve</button>
                            <button onClick={() => setApproveRejectState({ action: 'reject', id: l._id })} className="bg-red-50 text-red-700 border border-red-200 text-xs px-2 py-0.5 rounded-lg">Reject</button>
                          </div>
                        )}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
      {showApplyModal && <ApplyLeaveModal onClose={() => setShowApplyModal(false)} onSuccess={refetchAll} />}
      {approveRejectState && <ApproveRejectModal action={approveRejectState.action} leaveId={approveRejectState.id} onClose={() => setApproveRejectState(null)} onSuccess={refetchAll} />}
    </div>
  );
}

// ─── PAYROLL TAB ──────────────────────────────────────────────────────────────
// ─── SALARY COMPONENTS MODAL (payroll configuration root system) ──────────────
const EMPTY_COMPONENT_FORM = { name: '', type: 'earning', calculationType: 'fixed', defaultAmount: '', percentageValue: '', isTaxable: true, description: '' };

function SalaryComponentsModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_COMPONENT_FORM });

  const { data: components = [], isLoading } = useQuery({ queryKey: ['salary-components'], queryFn: hrService.getSalaryComponents });

  const createMut = useMutation({
    mutationFn: hrService.createSalaryComponent,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['salary-components'] }); toast.success('Component added'); closeForm(); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to add component'),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => hrService.updateSalaryComponent(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['salary-components'] }); toast.success('Component updated'); closeForm(); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update component'),
  });
  const deleteMut = useMutation({
    mutationFn: hrService.deleteSalaryComponent,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['salary-components'] }); toast.success('Component deleted'); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to delete — it may be assigned to staff'),
  });
  const toggleActiveMut = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => hrService.updateSalaryComponent(id, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['salary-components'] }),
  });

  const list = components as any[];

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm({ ...EMPTY_COMPONENT_FORM });
  }

  function openEdit(c: any) {
    setEditingId(c._id);
    setForm({
      name: c.name, type: c.type, calculationType: c.calculationType,
      defaultAmount: c.defaultAmount ?? '', percentageValue: c.percentageValue ?? '',
      isTaxable: c.isTaxable, description: c.description || '',
    });
    setShowForm(true);
  }

  function handleSave() {
    if (!form.name.trim()) { toast.error('Component name is required'); return; }
    const payload = {
      ...form,
      defaultAmount: form.calculationType === 'fixed' ? Number(form.defaultAmount) || 0 : undefined,
      percentageValue: form.calculationType === 'percentage_of_basic' ? Number(form.percentageValue) || 0 : undefined,
    };
    if (editingId) updateMut.mutate({ id: editingId, data: payload });
    else createMut.mutate(payload);
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col" style={{ maxHeight: '85vh' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div>
            <div className="font-bold text-slate-900">Salary Components</div>
            <p className="text-xs text-slate-400 mt-0.5">Define the earnings and deductions your payroll actually uses — fully editable, nothing is fixed by the app</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="py-12 text-center text-sm text-slate-400 animate-pulse">Loading components…</div>
          ) : (
            <div className="space-y-2">
              {list.map((c: any) => (
                <div key={c._id} className={`flex items-center justify-between p-3 rounded-lg border ${c.isActive ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50 opacity-60'}`}>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${c.type === 'earning' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                      {c.type === 'earning' ? 'Earning' : 'Deduction'}
                    </span>
                    <div>
                      <div className="text-sm font-semibold text-slate-800">{c.name}</div>
                      <div className="text-xs text-slate-400">
                        {c.calculationType === 'percentage_of_basic' ? `${c.percentageValue}% of Basic Salary` :
                         c.calculationType === 'fixed' ? `Fixed — PKR ${Number(c.defaultAmount || 0).toLocaleString()} default` :
                         'Entered manually each time'}
                        {!c.isTaxable && ' · Non-taxable'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer">
                      <input type="checkbox" checked={c.isActive} onChange={(e) => toggleActiveMut.mutate({ id: c._id, isActive: e.target.checked })} className="accent-[#0C447C]" />
                      Active
                    </label>
                    <button onClick={() => openEdit(c)} className="px-2 py-1 text-xs bg-blue-50 text-[#0C447C] rounded-lg hover:bg-blue-100 font-medium">Edit</button>
                    <button onClick={() => { if (confirm(`Delete "${c.name}"? This cannot be undone.`)) deleteMut.mutate(c._id); }} className="px-2 py-1 text-xs text-red-500 hover:bg-red-50 rounded-lg font-medium">Delete</button>
                  </div>
                </div>
              ))}
              {list.length === 0 && <div className="py-8 text-center text-sm text-slate-400">No components configured yet</div>}
            </div>
          )}

          {showForm ? (
            <div className="mt-4 p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Component Name</label>
                  <input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]"
                    placeholder="e.g. Fuel Allowance, Ramadan Bonus, Hostel Deduction" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Type</label>
                  <div className="flex gap-2">
                    {(['earning', 'deduction'] as const).map(t => (
                      <button key={t} onClick={() => setForm(p => ({ ...p, type: t }))}
                        className={`flex-1 py-2 rounded-lg border text-xs font-medium capitalize ${form.type === t ? (t === 'earning' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-red-50 text-red-700 border-red-300') : 'bg-white text-slate-500 border-slate-200'}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">How is this calculated?</label>
                  <select value={form.calculationType} onChange={(e) => setForm(p => ({ ...p, calculationType: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none">
                    <option value="fixed">Fixed amount</option>
                    <option value="percentage_of_basic">Percentage of Basic Salary</option>
                    <option value="manual">Entered manually each time</option>
                  </select>
                </div>
                {form.calculationType === 'fixed' && (
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Default Amount (PKR)</label>
                    <input type="number" value={form.defaultAmount} onChange={(e) => setForm(p => ({ ...p, defaultAmount: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]" />
                  </div>
                )}
                {form.calculationType === 'percentage_of_basic' && (
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Percentage of Basic Salary</label>
                    <input type="number" value={form.percentageValue} onChange={(e) => setForm(p => ({ ...p, percentageValue: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]" placeholder="e.g. 40" />
                  </div>
                )}
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={form.isTaxable} onChange={(e) => setForm(p => ({ ...p, isTaxable: e.target.checked }))} className="accent-[#0C447C]" />
                    Taxable
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Btn onClick={closeForm}>Cancel</Btn>
                <Btn variant="primary" onClick={handleSave}>{(createMut.isPending || updateMut.isPending) ? 'Saving…' : editingId ? 'Save Changes' : '+ Add Component'}</Btn>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowForm(true)} className="w-full mt-4 py-2.5 text-sm text-[#0C447C] border-2 border-dashed border-blue-200 rounded-lg hover:border-[#0C447C] hover:bg-blue-50 transition-colors">
              ＋ Add Salary Component
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Addresses "everything is manual" directly - an admin defines a
// reusable structure once (e.g. "Teacher": Basic 50,000, HRA 40%) and
// applies it when configuring a new hire's Salary Structure, instead of
// typing every component from scratch for every person. Deliberately
// does NOT apply a template directly to a staff member from here - see
// the "Apply Template" action inside the Salary Structure editor itself,
// which pre-fills for review rather than silently committing anything.
const EMPTY_TEMPLATE_FORM = { name: '', designationId: '', description: '', lines: {} as Record<string, string> };
function SalaryTemplatesModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_TEMPLATE_FORM });

  const { data: templates = [], isLoading } = useQuery({ queryKey: ['salary-templates'], queryFn: hrService.getSalaryTemplates });
  const { data: components = [] } = useQuery({ queryKey: ['salary-components'], queryFn: hrService.getSalaryComponents });
  const { data: designations = [] } = useQuery({ queryKey: ['designations'], queryFn: hrService.getDesignations });

  const compList = components as any[];
  const list = templates as any[];

  const createMut = useMutation({
    mutationFn: hrService.createSalaryTemplate,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['salary-templates'] }); toast.success('Template created'); closeForm(); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create template'),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => hrService.updateSalaryTemplate(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['salary-templates'] }); toast.success('Template updated'); closeForm(); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update template'),
  });
  const deleteMut = useMutation({
    mutationFn: hrService.deleteSalaryTemplate,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['salary-templates'] }); toast.success('Template deleted'); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to delete template'),
  });

  function closeForm() { setShowForm(false); setEditingId(null); setForm({ ...EMPTY_TEMPLATE_FORM }); }

  function openEdit(t: any) {
    setEditingId(t._id);
    const lines: Record<string, string> = {};
    for (const l of t.lines || []) lines[l.componentId?._id || l.componentId] = String(l.amount);
    setForm({ name: t.name, designationId: t.designationId?._id || t.designationId || '', description: t.description || '', lines });
    setShowForm(true);
  }

  function handleSave() {
    if (!form.name.trim()) { toast.error('Template name is required'); return; }
    const lines = Object.entries(form.lines).filter(([, amt]) => amt !== '').map(([componentId, amt]) => ({ componentId, amount: Number(amt) || 0 }));
    if (lines.length === 0) { toast.error('Add at least one component with an amount'); return; }
    const payload = { name: form.name, designationId: form.designationId || undefined, description: form.description || undefined, lines };
    if (editingId) updateMut.mutate({ id: editingId, data: payload });
    else createMut.mutate(payload);
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col" style={{ maxHeight: '85vh' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div>
            <div className="font-bold text-slate-900">Salary Templates</div>
            <p className="text-xs text-slate-400 mt-0.5">Define a reusable structure once (e.g. "Teacher"), then apply it when setting up a new hire's pay instead of typing everything from scratch</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {!showForm ? (
            <>
              <button onClick={() => setShowForm(true)} className="mb-4 px-3 py-1.5 text-xs bg-[#0C447C] text-white rounded-lg hover:bg-[#0b3d6e] font-medium">+ New Template</button>
              {isLoading ? (
                <div className="py-12 text-center text-sm text-slate-400 animate-pulse">Loading templates…</div>
              ) : list.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-400">No templates yet. Create one to stop retyping the same structure for every new hire.</div>
              ) : (
                <div className="space-y-2">
                  {list.map((t: any) => {
                    const gross = (t.lines || []).reduce((s: number, l: any) => s + (l.amount || 0), 0);
                    return (
                      <div key={t._id} className="p-3 rounded-lg border border-slate-200 bg-white">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-sm text-slate-800">{t.name}</div>
                            {t.designationId?.name && <div className="text-[10px] text-slate-400">Suggested for: {t.designationId.name}</div>}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-bold text-[#0C447C]">{gross.toLocaleString()}</div>
                            <button onClick={() => openEdit(t)} className="text-xs text-[#0C447C] hover:underline">Edit</button>
                            <button onClick={() => { if (confirm(`Delete template "${t.name}"?`)) deleteMut.mutate(t._id); }} className="text-xs text-red-500 hover:underline">Delete</button>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {(t.lines || []).map((l: any, i: number) => (
                            <span key={i} className="text-[10px] px-2 py-0.5 bg-slate-50 border border-slate-100 rounded-full text-slate-600">
                              {l.componentId?.name || 'Component'}: {(l.amount || 0).toLocaleString()}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Template Name *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Teacher, Admin Staff"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Suggested Designation (optional)</label>
                <select value={form.designationId} onChange={(e) => setForm({ ...form, designationId: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg">
                  <option value="">None - generic template</option>
                  {(designations as any[]).map((d: any) => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
              </div>
              <div className="pt-2 border-t border-slate-100">
                <label className="text-xs text-slate-500 mb-2 block">Component Amounts</label>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {compList.filter((c) => c.isActive).map((c) => (
                    <div key={c._id} className="flex items-center justify-between gap-3">
                      <span className="text-sm text-slate-700">{c.name}</span>
                      <input type="number" value={form.lines[c._id] ?? ''} onChange={(e) => setForm({ ...form, lines: { ...form.lines, [c._id]: e.target.value } })}
                        placeholder="0" className="w-28 px-2 py-1.5 text-sm border border-slate-200 rounded-lg text-right" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <Btn onClick={closeForm}>Cancel</Btn>
                <Btn variant="primary" onClick={handleSave}>{(createMut.isPending || updateMut.isPending) ? 'Saving…' : editingId ? 'Save Changes' : 'Create Template'}</Btn>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PayrollTab() {
  const qc = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showComponentsModal, setShowComponentsModal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [resumeRun, setResumeRun] = useState<{ month: number; year: number } | null>(null);

  const { data: payrollStats } = useQuery({ queryKey: ['payroll-stats'], queryFn: hrService.getPayrollStats });
  const { data: runs = [], isLoading } = useQuery({ queryKey: ['payroll-runs'], queryFn: hrService.getPayrollRuns });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => hrService.updatePayrollStatus(id, status),
    onSuccess: () => { toast.success('Status updated'); qc.invalidateQueries({ queryKey: ['payroll-runs', 'payroll-stats'] }); },
    onError: () => toast.error('Failed to update status'),
  });

  const stats = payrollStats as any;
  const runList = runs as any[];
  const sV: Record<string, BadgeVariant> = { draft: 'gray', processing: 'blue', completed: 'green', approved: 'green', paid: 'green', cancelled: 'red' };
  const fmt = (n: number) => Number(n || 0).toLocaleString();

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-slate-900">Payroll Management</h1>
        <div className="flex gap-2">
          <Btn onClick={() => setShowComponentsModal(true)}>⚙️ Salary Components</Btn>
          <Btn onClick={() => setShowTemplatesModal(true)}>📋 Salary Templates</Btn>
          <Btn variant="primary" onClick={() => setShowCreateModal(true)}>+ New Payroll Run</Btn>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-5">
        <KPI label="Net Salary This Month" value={fmt(stats?.thisMonthTotal)} color="navy" />
        <KPI label="Total Payslips" value={String(stats?.totalPayslips ?? 0)} color="green" />
        <KPI label="Pending Runs" value={String(stats?.pendingRuns ?? 0)} color="amber" />
      </div>
      <Card>
        <CardHeader title="Payroll Runs" />
        {isLoading ? (
          <div className="p-8 text-center text-slate-400 text-sm animate-pulse">Loading payroll runs…</div>
        ) : runList.length === 0 ? (
          <div className="p-12 text-center"><CreditCard className="w-10 h-10 text-slate-300 mx-auto mb-3" /><div className="text-slate-500">No payroll runs yet</div><div className="text-xs text-slate-400 mt-1">Create a payroll run to get started</div></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <THead cols={['Period', 'Employees', 'Gross Total', 'Deductions', 'Net Total', 'Status', 'Actions']} />
              <tbody>
                {runList.map((r: any) => (
                  <tr key={r._id} className="border-b border-slate-50 hover:bg-slate-50">
                    <Td><div className="font-medium">{r.periodLabel || `${r.month}/${r.year}`}</div></Td>
                    <Td>{r.totalEmployees || '—'}</Td>
                    <Td>{fmt(r.totalGrossSalary)}</Td>
                    <Td>{fmt(r.totalDeductions)}</Td>
                    <Td className="font-semibold text-emerald-600">{fmt(r.totalNetSalary)}</Td>
                    <Td><Badge v={sV[r.status] ?? 'gray'}>{r.status}</Badge></Td>
                    <Td>
                      <div className="flex gap-1">
                        {r.status === 'draft' && <Btn onClick={() => statusMut.mutate({ id: r._id, status: 'processing' })}>Process</Btn>}
                        {r.status === 'processing' && (
                          <>
                            <Btn onClick={() => setResumeRun({ month: r.month, year: r.year })}>Resume</Btn>
                            <Btn variant="secondary" onClick={() => statusMut.mutate({ id: r._id, status: 'cancelled' })}>Cancel</Btn>
                          </>
                        )}
                        {r.status === 'completed' && <Btn variant="primary" onClick={() => statusMut.mutate({ id: r._id, status: 'approved' })}>Approve</Btn>}
                        {r.status === 'approved' && <Btn variant="success" onClick={() => statusMut.mutate({ id: r._id, status: 'paid' })}>Mark Paid</Btn>}
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {(showCreateModal || resumeRun) && <PayrollProcessingModal
        resumeRun={resumeRun || undefined}
        onClose={() => { setShowCreateModal(false); setResumeRun(null); }}
        onSuccess={() => qc.invalidateQueries({ queryKey: ['payroll-runs', 'payroll-stats'] })}
      />}
      {showComponentsModal && <SalaryComponentsModal onClose={() => setShowComponentsModal(false)} />}
      {showTemplatesModal && <SalaryTemplatesModal onClose={() => setShowTemplatesModal(false)} />}
    </div>
  );
}

// ─── PAYSLIP TAB ──────────────────────────────────────────────────────────────
function PayslipTab() {
  const qc = useQueryClient();
  const now = new Date();
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [staffSearch, setStaffSearch] = useState('');
  const [monthFilter, setMonthFilter] = useState(0);
  const [yearFilter, setYearFilter] = useState(now.getFullYear());

  const filters = {
    ...(staffSearch ? { staffName: staffSearch } : {}),
    ...(monthFilter ? { month: monthFilter } : {}),
    ...(yearFilter ? { year: yearFilter } : {}),
  };
  const { data: payslips = [], isLoading } = useQuery({
    queryKey: ['payslips', filters],
    queryFn: () => hrService.getPayslips(Object.keys(filters).length ? filters : undefined),
  });

  const pList = payslips as any[];
  const sV: Record<string, BadgeVariant> = { draft: 'gray', issued: 'blue', paid: 'green' };
  const fmt = (n: number) => Number(n || 0).toLocaleString();
  const MONTHS = ['All','January','February','March','April','May','June','July','August','September','October','November','December'];

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-slate-900">Payslips</h1>
        <Btn variant="primary" onClick={() => setShowGenerateModal(true)}>+ Generate Payslip</Btn>
      </div>
      <div className="flex gap-3 mb-4">
        <input value={staffSearch} onChange={e => setStaffSearch(e.target.value)} placeholder="Search by staff name…" className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white flex-1 max-w-xs" />
        <select value={monthFilter} onChange={e => setMonthFilter(parseInt(e.target.value))} className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white">
          {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
        </select>
        <input type="number" value={yearFilter} onChange={e => setYearFilter(parseInt(e.target.value) || now.getFullYear())} className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white w-24" />
        <Btn onClick={() => { setStaffSearch(''); setMonthFilter(0); setYearFilter(now.getFullYear()); }}>Clear</Btn>
      </div>
      <Card>
        {isLoading ? (
          <div className="p-8 text-center text-slate-400 text-sm animate-pulse">Loading payslips…</div>
        ) : pList.length === 0 ? (
          <div className="p-12 text-center"><FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" /><div className="text-slate-500">No payslips found</div><div className="text-xs text-slate-400 mt-1">Generate payslips to get started</div></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <THead cols={['Employee', 'Period', 'Basic', 'Gross', 'Deductions', 'Net Salary', 'Attendance', 'Status']} />
              <tbody>
                {pList.map((p: any) => (
                  <tr key={p._id} className="border-b border-slate-50 hover:bg-slate-50">
                    <Td><div className="font-medium">{p.staffName || '—'}</div><div className="text-xs text-slate-400">{p.employeeId}</div></Td>
                    <Td>{p.periodLabel || `${p.month}/${p.year}`}</Td>
                    <Td>{fmt(p.basicSalary)}</Td>
                    <Td>{fmt(p.grossSalary)}</Td>
                    <Td className="text-red-600">{fmt(p.totalDeductions)}</Td>
                    <Td className="font-semibold text-emerald-600">{fmt(p.netSalary)}</Td>
                    <Td>{p.presentDays}P · {p.absentDays}A</Td>
                    <Td><Badge v={sV[p.status] ?? 'gray'}>{p.status}</Badge></Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {showGenerateModal && <PayrollProcessingModal onClose={() => setShowGenerateModal(false)} onSuccess={() => qc.invalidateQueries({ queryKey: ['payslips'] })} />}
    </div>
  );
}

// ─── PERFORMANCE TAB ─────────────────────────────────────────────────────────
function PerformanceTab() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState<any | null>(null);

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['performance', statusFilter],
    queryFn: () => hrService.getPerformanceReviews(statusFilter ? { status: statusFilter } : undefined),
  });

  const reviewList = reviews as any[];
  const total = reviewList.length;
  const pending = reviewList.filter((r: any) => ['draft','self_review','manager_review'].includes(r.status)).length;
  const completed = reviewList.filter((r: any) => r.status === 'completed').length;

  const rV: Record<string, BadgeVariant> = { outstanding: 'purple', exceeds_expectations: 'green', meets_expectations: 'blue', needs_improvement: 'amber', unsatisfactory: 'red' };
  const sV: Record<string, BadgeVariant> = { draft: 'gray', self_review: 'amber', manager_review: 'blue', completed: 'green' };
  const STATUS_FILTERS = ['', 'draft', 'self_review', 'manager_review', 'completed'];
  const STATUS_LABELS: Record<string, string> = { '': 'All', draft: 'Draft', self_review: 'Self Review', manager_review: 'Manager Review', completed: 'Completed' };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-slate-900">Performance Management</h1>
        <Btn variant="primary" onClick={() => setShowCreateModal(true)}>+ Start Review</Btn>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-5">
        <KPI label="Total Reviews" value={String(total)} color="navy" />
        <KPI label="Pending" value={String(pending)} color="amber" />
        <KPI label="Completed" value={String(completed)} color="green" />
      </div>
      <div className="flex gap-1 mb-4">
        {STATUS_FILTERS.map(f => (
          <button key={f} onClick={() => setStatusFilter(f)} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${statusFilter === f ? 'bg-[#0C447C] text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{STATUS_LABELS[f]}</button>
        ))}
      </div>
      <Card>
        {isLoading ? (
          <div className="p-8 text-center text-slate-400 text-sm animate-pulse">Loading reviews…</div>
        ) : reviewList.length === 0 ? (
          <div className="p-12 text-center"><Star className="w-10 h-10 text-slate-300 mx-auto mb-3" /><div className="text-slate-500">No reviews found</div></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <THead cols={['Staff Name', 'Period', 'Type', 'Self Score', 'Manager Score', 'Final Score', 'Rating', 'Status', 'Actions']} />
              <tbody>
                {reviewList.map((r: any) => (
                  <tr key={r._id} className="border-b border-slate-50 hover:bg-slate-50">
                    <Td><div className="font-medium">{r.staffName || '—'}</div></Td>
                    <Td>{r.reviewPeriod || '—'}</Td>
                    <Td className="capitalize">{(r.reviewType || '').replace('_', ' ')}</Td>
                    <Td>{r.selfOverallScore ?? '—'}</Td>
                    <Td>{r.managerOverallScore ?? '—'}</Td>
                    <Td><span className="font-semibold text-[#0C447C]">{r.finalScore ?? '—'}</span></Td>
                    <Td>{r.rating ? <Badge v={rV[r.rating] ?? 'gray'}>{r.rating.replace('_', ' ')}</Badge> : '—'}</Td>
                    <Td><Badge v={sV[r.status] ?? 'gray'}>{(r.status || '').replace('_', ' ')}</Badge></Td>
                    <Td><Btn onClick={() => setSelectedReview(r)}>View / Score</Btn></Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {showCreateModal && <CreateReviewModal onClose={() => setShowCreateModal(false)} onSuccess={() => qc.invalidateQueries({ queryKey: ['performance'] })} />}
      {selectedReview && <ReviewDetailModal review={selectedReview} onClose={() => setSelectedReview(null)} onSuccess={() => { qc.invalidateQueries({ queryKey: ['performance'] }); setSelectedReview(null); }} />}
    </div>
  );
}

// ─── TRAINING TAB ─────────────────────────────────────────────────────────────
// ─── CONTRACTS TAB ────────────────────────────────────────────────────────────
function ContractsTab() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: contractStats } = useQuery({ queryKey: ['contract-stats'], queryFn: hrService.getContractStats });
  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ['contracts', statusFilter],
    queryFn: () => hrService.getContracts(statusFilter ? { status: statusFilter } : undefined),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => hrService.updateContract(id, payload),
    onSuccess: () => { toast.success('Contract updated'); qc.invalidateQueries({ queryKey: ['contracts', 'contract-stats'] }); },
    onError: () => toast.error('Failed to update contract'),
  });

  const cList = contracts as any[];
  const stats = contractStats as any;
  const sV: Record<string, BadgeVariant> = { draft: 'gray', sent: 'blue', signed: 'purple', active: 'green', expired: 'red', terminated: 'red' };
  const fmt = (d: string) => { try { return d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Permanent'; } catch { return d || 'Permanent'; } };
  const STATUS_FILTERS = ['', 'draft', 'sent', 'signed', 'active', 'expired', 'terminated'];

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-slate-900">Contract Management</h1>
        <Btn variant="primary" onClick={() => setShowCreateModal(true)}>+ New Contract</Btn>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <KPI label="Active Contracts" value={String(stats?.active ?? 0)} color="green" />
        <KPI label="Expiring Soon (30d)" value={String(stats?.expiringSoon ?? 0)} color="amber" />
        <KPI label="Expired" value={String(stats?.expired ?? 0)} color="red" />
      </div>
      {(stats?.expiringSoon ?? 0) > 0 && <Alert type="warning">⚠ {stats.expiringSoon} contract{stats.expiringSoon > 1 ? 's' : ''} expiring within 30 days. Renewal action required.</Alert>}
      <div className="flex gap-1 mb-4">
        {STATUS_FILTERS.map(f => (
          <button key={f} onClick={() => setStatusFilter(f)} className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-colors ${statusFilter === f ? 'bg-[#0C447C] text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{f || 'All'}</button>
        ))}
      </div>
      <Card>
        {isLoading ? (
          <div className="p-8 text-center text-slate-400 text-sm animate-pulse">Loading contracts…</div>
        ) : cList.length === 0 ? (
          <div className="p-12 text-center"><ScrollText className="w-10 h-10 text-slate-300 mx-auto mb-3" /><div className="text-slate-500">No contracts found</div></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <THead cols={['Staff Name', 'Contract No', 'Type', 'Start', 'End', 'Salary', 'Status', 'Actions']} />
              <tbody>
                {cList.map((c: any) => (
                  <tr key={c._id} className="border-b border-slate-50 hover:bg-slate-50">
                    <Td><div className="font-medium">{c.staffName || '—'}</div><div className="text-xs text-slate-400">{c.designation}</div></Td>
                    <Td><span className="font-mono text-xs">{c.contractNo || '—'}</span></Td>
                    <Td className="capitalize">{(c.type || '').replace('_', ' ')}</Td>
                    <Td>{fmt(c.startDate)}</Td>
                    <Td>{fmt(c.endDate)}</Td>
                    <Td>{c.grossSalary ? `${c.currency} ${Number(c.grossSalary).toLocaleString()}` : '—'}</Td>
                    <Td><Badge v={sV[c.status] ?? 'gray'}>{c.status}</Badge></Td>
                    <Td>
                      <div className="flex gap-1">
                        {c.status === 'expired' && <Btn onClick={() => updateMut.mutate({ id: c._id, payload: { status: 'active' } })}>Renew</Btn>}
                        {c.status === 'active' && <Btn variant="danger" onClick={() => updateMut.mutate({ id: c._id, payload: { status: 'terminated' } })}>Terminate</Btn>}
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {showCreateModal && <CreateContractModal onClose={() => setShowCreateModal(false)} onSuccess={() => qc.invalidateQueries({ queryKey: ['contracts', 'contract-stats'] })} />}
    </div>
  );
}

// ─── EXIT TAB ─────────────────────────────────────────────────────────────────
function ExitTab() {
  const qc = useQueryClient();
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [clearanceRecord, setClearanceRecord] = useState<any | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const { data: exitRecords = [], isLoading } = useQuery({ queryKey: ['exit-records'], queryFn: hrService.getExitRecords });

  const eList = exitRecords as any[];
  const pendingClearance = eList.filter((e: any) => e.clearanceStatus !== 'completed').length;
  const now = new Date();
  const thisMonthExits = eList.filter((e: any) => { try { const d = new Date(e.resignationDate); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); } catch { return false; } }).length;
  const settlementsPending = eList.filter((e: any) => e.settlementStatus === 'pending' || e.settlementStatus === 'processing').length;

  const exitTypeV: Record<string, BadgeVariant> = { resignation: 'amber', termination: 'red', retirement: 'blue', contract_end: 'gray', mutual_agreement: 'purple', death: 'red', abandonment: 'red' };
  const clearV: Record<string, BadgeVariant> = { pending: 'red', in_progress: 'amber', completed: 'green' };
  const settleV: Record<string, BadgeVariant> = { pending: 'amber', processing: 'blue', paid: 'green' };
  const fmt = (d: string) => { try { return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return d || '—'; } };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-slate-900">Exit Management</h1>
        <div className="flex gap-2">
          <Btn onClick={() => setShowSettingsModal(true)}>⚙️ Exit Settings</Btn>
          <Btn variant="primary" onClick={() => setShowProcessModal(true)}>+ Process Exit</Btn>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-5">
        <KPI label="Pending Clearance" value={String(pendingClearance)} color="red" />
        <KPI label="This Month Exits" value={String(thisMonthExits)} color="navy" />
        <KPI label="Settlements Pending" value={String(settlementsPending)} color="amber" />
      </div>
      <Card>
        <CardHeader title="Exit Records" />
        {isLoading ? (
          <div className="p-8 text-center text-slate-400 text-sm animate-pulse">Loading exit records…</div>
        ) : eList.length === 0 ? (
          <div className="p-12 text-center"><LogOut className="w-10 h-10 text-slate-300 mx-auto mb-3" /><div className="text-slate-500">No exit records found</div></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <THead cols={['Employee', 'Exit Type', 'Resignation Date', 'Last Working Day', 'Clearance', 'Settlement', 'Actions']} />
              <tbody>
                {eList.map((e: any) => (
                  <tr key={e._id} className="border-b border-slate-50 hover:bg-slate-50">
                    <Td><div className="font-medium">{e.staffName || '—'}</div><div className="text-xs text-slate-400">{e.employeeId}</div></Td>
                    <Td><Badge v={exitTypeV[e.exitType] ?? 'gray'}>{(e.exitType || '').replace('_', ' ')}</Badge></Td>
                    <Td>{fmt(e.resignationDate)}</Td>
                    <Td>{fmt(e.lastWorkingDay)}</Td>
                    <Td><Badge v={clearV[e.clearanceStatus] ?? 'gray'}>{e.clearanceStatus?.replace('_', ' ')}</Badge></Td>
                    <Td><Badge v={settleV[e.settlementStatus] ?? 'gray'}>{e.settlementStatus}</Badge></Td>
                    <Td><Btn onClick={() => setClearanceRecord(e)}>Clearance</Btn></Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {showProcessModal && <ProcessExitModal onClose={() => setShowProcessModal(false)} onSuccess={() => qc.invalidateQueries({ queryKey: ['exit-records'] })} />}
      {clearanceRecord && <ClearanceModal exitRecord={clearanceRecord} onClose={() => setClearanceRecord(null)} onSuccess={() => { qc.invalidateQueries({ queryKey: ['exit-records'] }); setClearanceRecord(null); }} />}
      {showSettingsModal && <ExitSettingsModal onClose={() => setShowSettingsModal(false)} />}
    </div>
  );
}

function ExitSettingsModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const { data: settings, isLoading } = useQuery({ queryKey: ['exit-settings'], queryFn: hrService.getExitSettings });
  const [form, setForm] = useState<any | null>(null);

  useEffect(() => {
    if (settings && !form) setForm(settings);
  }, [settings]);

  const saveMut = useMutation({
    mutationFn: (payload: any) => hrService.updateExitSettings(payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['exit-settings'] }); toast.success('Exit settings saved'); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to save settings'),
  });

  if (isLoading || !form) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-10 text-center text-sm text-slate-400 animate-pulse">Loading exit settings…</div>
      </div>
    );
  }

  const employmentTypes = ['permanent', 'contract', 'probation', 'part_time'];
  const noticeMap = form.noticePeriodDaysByEmploymentType || {};

  function updateChecklistItem(idx: number, field: 'department' | 'item', value: string) {
    const list = [...(form.clearanceChecklistTemplate || [])];
    list[idx] = { ...list[idx], [field]: value };
    setForm({ ...form, clearanceChecklistTemplate: list });
  }
  function removeChecklistItem(idx: number) {
    setForm({ ...form, clearanceChecklistTemplate: form.clearanceChecklistTemplate.filter((_: any, i: number) => i !== idx) });
  }
  function addChecklistItem() {
    setForm({ ...form, clearanceChecklistTemplate: [...(form.clearanceChecklistTemplate || []), { department: '', item: '' }] });
  }
  function updateQuestion(idx: number, value: string) {
    const list = [...(form.exitInterviewQuestions || [])];
    list[idx] = value;
    setForm({ ...form, exitInterviewQuestions: list });
  }
  function removeQuestion(idx: number) {
    setForm({ ...form, exitInterviewQuestions: form.exitInterviewQuestions.filter((_: any, i: number) => i !== idx) });
  }
  function addQuestion() {
    setForm({ ...form, exitInterviewQuestions: [...(form.exitInterviewQuestions || []), ''] });
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col" style={{ maxHeight: '85vh' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div>
            <div className="font-bold text-slate-900">Exit Settings</div>
            <p className="text-xs text-slate-400 mt-0.5">Default notice periods, clearance checklist, and exit interview questions — used to pre-fill every new exit record</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-2">Notice Period (days) by Employment Type</p>
            <div className="grid grid-cols-2 gap-3">
              {employmentTypes.map(t => (
                <div key={t}>
                  <label className="text-xs text-slate-500 mb-1 block capitalize">{t.replace('_', ' ')}</label>
                  <input type="number" value={noticeMap[t] ?? ''} onChange={(e) => setForm({ ...form, noticePeriodDaysByEmploymentType: { ...noticeMap, [t]: Number(e.target.value) || 0 } })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]" />
                </div>
              ))}
            </div>
            <div className="mt-2">
              <label className="text-xs text-slate-500 mb-1 block">Fallback (no employment type match)</label>
              <input type="number" value={form.defaultNoticePeriodDays ?? ''} onChange={(e) => setForm({ ...form, defaultNoticePeriodDays: Number(e.target.value) || 0 })}
                className="w-40 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-slate-700">Clearance Checklist Template</p>
              <button onClick={addChecklistItem} className="text-xs text-[#0C447C] font-medium hover:underline">+ Add item</button>
            </div>
            <div className="space-y-2">
              {(form.clearanceChecklistTemplate || []).map((c: any, i: number) => (
                <div key={i} className="flex gap-2">
                  <input value={c.department} onChange={(e) => updateChecklistItem(i, 'department', e.target.value)} placeholder="Department"
                    className="w-32 px-2 py-1.5 text-xs border border-slate-200 rounded-lg" />
                  <input value={c.item} onChange={(e) => updateChecklistItem(i, 'item', e.target.value)} placeholder="Checklist item"
                    className="flex-1 px-2 py-1.5 text-xs border border-slate-200 rounded-lg" />
                  <button onClick={() => removeChecklistItem(i)} className="px-2 text-red-400 hover:text-red-600 text-xs">✕</button>
                </div>
              ))}
              {(!form.clearanceChecklistTemplate || form.clearanceChecklistTemplate.length === 0) && <div className="text-xs text-slate-400">No checklist items — add at least one so new exits have a starting checklist.</div>}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-slate-700">Exit Interview Questions</p>
              <button onClick={addQuestion} className="text-xs text-[#0C447C] font-medium hover:underline">+ Add question</button>
            </div>
            <div className="space-y-2">
              {(form.exitInterviewQuestions || []).map((q: string, i: number) => (
                <div key={i} className="flex gap-2">
                  <input value={q} onChange={(e) => updateQuestion(i, e.target.value)} placeholder="Question"
                    className="flex-1 px-2 py-1.5 text-xs border border-slate-200 rounded-lg" />
                  <button onClick={() => removeQuestion(i)} className="px-2 text-red-400 hover:text-red-600 text-xs">✕</button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100 shrink-0">
          <Btn onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" onClick={() => saveMut.mutate(form)}>{saveMut.isPending ? 'Saving…' : 'Save Settings'}</Btn>
        </div>
      </div>
    </div>
  );
}

// ─── GRIEVANCE TAB ──────────────────────────────────────────────────────────────
const GRIEVANCE_CATEGORIES = ['harassment', 'discrimination', 'workplace_conflict', 'compensation', 'safety', 'policy_violation', 'other'];
const grievanceStatusV: Record<string, BadgeVariant> = { submitted: 'amber', investigating: 'blue', resolved: 'green', escalated: 'red', dismissed: 'gray' };
const GRIEVANCE_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const grievancePriorityV: Record<string, BadgeVariant> = { low: 'gray', medium: 'blue', high: 'amber', urgent: 'red' };
const TIMELINE_DOT: Record<string, string> = {
  submitted: 'bg-amber-400', investigating: 'bg-blue-500', resolved: 'bg-emerald-500', escalated: 'bg-red-500', dismissed: 'bg-slate-400',
};

function GrievanceTab() {
  const qc = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [viewing, setViewing] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  const { data: staffList = [] } = useQuery({ queryKey: ['staff'], queryFn: hrService.getStaff });
  const { data: grievances = [], isLoading } = useQuery({
    queryKey: ['grievances', statusFilter, categoryFilter, priorityFilter],
    queryFn: () => hrService.getGrievances({
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(categoryFilter ? { category: categoryFilter } : {}),
      ...(priorityFilter ? { priority: priorityFilter } : {}),
    }),
  });
  const list = grievances as any[];
  const staffArr = staffList as any[];

  const [form, setForm] = useState({ raisedByStaffId: '', category: 'other', priority: 'medium', description: '', isConfidential: false });
  const createMut = useMutation({
    mutationFn: () => {
      const staff = staffArr.find((s: any) => s._id === form.raisedByStaffId);
      return hrService.createGrievance({ ...form, raisedByName: staff ? `${staff.firstName} ${staff.lastName}` : 'Staff' });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['grievances'] }); toast.success('Grievance submitted'); setShowNew(false); setForm({ raisedByStaffId: '', category: 'other', priority: 'medium', description: '', isConfidential: false }); },
    onError: () => toast.error('Failed to submit grievance'),
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: string; note: string }) => hrService.updateGrievanceStatus(id, status, note, 'HR'),
    onSuccess: (updated: any) => { qc.invalidateQueries({ queryKey: ['grievances'] }); toast.success('Status updated'); setViewing(updated); },
    onError: () => toast.error('Failed to update status'),
  });

  const assignMut = useMutation({
    mutationFn: ({ id, staffId }: { id: string; staffId: string }) => {
      const staff = staffArr.find((s: any) => s._id === staffId);
      return hrService.assignGrievance(id, staffId, staff ? `${staff.firstName} ${staff.lastName}` : '');
    },
    onSuccess: (updated: any) => { qc.invalidateQueries({ queryKey: ['grievances'] }); toast.success('Case assigned'); setViewing(updated); },
    onError: () => toast.error('Failed to assign case'),
  });

  const pending = list.filter(g => g.status === 'submitted' || g.status === 'investigating').length;
  const resolved = list.filter(g => g.status === 'resolved').length;
  const escalated = list.filter(g => g.status === 'escalated').length;
  const overdue = list.filter(g => g.isOverdue).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-slate-900">Grievance Management</h1>
        <Btn variant="primary" onClick={() => setShowNew(true)}>+ Submit Grievance</Btn>
      </div>
      <div className="grid grid-cols-4 gap-3 mb-5">
        <KPI label="Open" value={String(pending)} color="amber" />
        <KPI label="Resolved" value={String(resolved)} color="green" />
        <KPI label="Escalated" value={String(escalated)} color="red" />
        <KPI label="Overdue (past SLA)" value={String(overdue)} color="red" />
      </div>
      <Card>
        <CardHeader title="Cases" actions={
          <div className="flex gap-2">
            <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className="px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white">
              <option value="">All priorities</option>
              {GRIEVANCE_PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white">
              <option value="">All categories</option>
              {GRIEVANCE_CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white">
              <option value="">All statuses</option>
              {Object.keys(grievanceStatusV).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        } />
        {isLoading ? (
          <div className="p-8 text-center text-slate-400 text-sm animate-pulse">Loading cases…</div>
        ) : list.length === 0 ? (
          <div className="p-12 text-center"><MessageSquareWarning className="w-10 h-10 text-slate-300 mx-auto mb-3" /><div className="text-slate-500">No grievances recorded</div></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <THead cols={['Case #', 'Raised By', 'Category', 'Priority', 'Status', 'Due', 'Assigned To', '']} />
              <tbody>
                {list.map((g: any) => (
                  <tr key={g._id} className={`border-b border-slate-50 hover:bg-slate-50 ${g.isOverdue ? 'bg-red-50/40' : ''}`}>
                    <Td className="font-medium">{g.caseNo}</Td>
                    <Td>{g.isConfidential ? '🔒 Confidential' : g.raisedByName}</Td>
                    <Td className="capitalize">{g.category.replace(/_/g, ' ')}</Td>
                    <Td><Badge v={grievancePriorityV[g.priority] || 'gray'}>{g.priority || 'medium'}</Badge></Td>
                    <Td><Badge v={grievanceStatusV[g.status] || 'gray'}>{g.status}</Badge></Td>
                    <Td>
                      {g.dueDate ? (
                        <span className={g.isOverdue ? 'text-red-600 font-semibold' : 'text-slate-500'}>
                          {new Date(g.dueDate).toLocaleDateString()}{g.isOverdue ? ' ⚠ overdue' : ''}
                        </span>
                      ) : '—'}
                    </Td>
                    <Td>
                      <select
                        value={g.assignedToStaffId || ''}
                        onChange={e => e.target.value && assignMut.mutate({ id: g._id, staffId: e.target.value })}
                        className="text-xs border border-slate-200 rounded-lg px-1.5 py-1 bg-white max-w-[140px]"
                      >
                        <option value="">{g.assignedToName ? g.assignedToName : 'Unassigned'}</option>
                        {staffArr.filter((s: any) => s._id !== g.assignedToStaffId).map((s: any) => (
                          <option key={s._id} value={s._id}>{s.firstName} {s.lastName}</option>
                        ))}
                      </select>
                    </Td>
                    <Td><button onClick={() => setViewing(g)} className="text-xs text-[#0C447C] font-medium hover:underline">View</button></Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showNew && (
        <ModalShell title="Submit Grievance" onClose={() => setShowNew(false)} footer={<><Btn onClick={() => setShowNew(false)}>Cancel</Btn><Btn variant="primary" onClick={() => createMut.mutate()}>{createMut.isPending ? 'Submitting…' : 'Submit'}</Btn></>}>
          <WF label="Staff Member" required>
            <select value={form.raisedByStaffId} onChange={e => setForm(p => ({ ...p, raisedByStaffId: e.target.value }))} className={WIC}>
              <option value="">Select staff…</option>
              {staffArr.map((s: any) => <option key={s._id} value={s._id}>{s.firstName} {s.lastName}</option>)}
            </select>
          </WF>
          <WF label="Category" required>
            <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className={WIC}>
              {GRIEVANCE_CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
            </select>
          </WF>
          <WF label="Priority" required>
            <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))} className={WIC}>
              {GRIEVANCE_PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </WF>
          <WF label="Description" required>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={4} className={WIC} placeholder="Describe what happened…" />
          </WF>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.isConfidential} onChange={e => setForm(p => ({ ...p, isConfidential: e.target.checked }))} className="accent-[#0C447C]" />
            Keep raised-by identity confidential (hidden from anyone but the assigned handler)
          </label>
        </ModalShell>
      )}

      {viewing && (
        <ModalShell title={`Case ${viewing.caseNo}`} onClose={() => setViewing(null)} wide footer={<Btn onClick={() => setViewing(null)}>Close</Btn>}>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge v={grievanceStatusV[viewing.status] || 'gray'}>{viewing.status}</Badge>
            <Badge v={grievancePriorityV[viewing.priority] || 'gray'}>{viewing.priority || 'medium'} priority</Badge>
            <span className="text-xs text-slate-400 capitalize">{viewing.category.replace(/_/g, ' ')}</span>
            {viewing.dueDate && (
              <span className={`text-xs ${viewing.isOverdue ? 'text-red-600 font-semibold' : 'text-slate-400'}`}>
                Due {new Date(viewing.dueDate).toLocaleDateString()}{viewing.isOverdue ? ' — overdue' : ''}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-700">{viewing.description}</p>

          <div className="flex items-center gap-2 pt-3">
            <span className="text-xs font-semibold text-slate-500">Assigned to:</span>
            <select
              value={viewing.assignedToStaffId || ''}
              onChange={e => e.target.value && assignMut.mutate({ id: viewing._id, staffId: e.target.value })}
              className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white"
            >
              <option value="">{viewing.assignedToName ? viewing.assignedToName : 'Unassigned — choose a handler'}</option>
              {staffArr.filter((s: any) => s._id !== viewing.assignedToStaffId).map((s: any) => (
                <option key={s._id} value={s._id}>{s.firstName} {s.lastName}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {Object.keys(grievanceStatusV).filter(s => s !== viewing.status).map(s => (
              <button key={s} onClick={() => statusMut.mutate({ id: viewing._id, status: s, note: `Marked as ${s}` })}
                className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 capitalize">
                Mark {s}
              </button>
            ))}
          </div>
          <div className="pt-2">
            <p className="text-xs font-semibold text-slate-500 mb-2">Timeline</p>
            <div className="space-y-3">
              {(viewing.timeline || []).map((t: any, i: number) => (
                <div key={i} className="flex gap-2.5">
                  <div className="flex flex-col items-center pt-0.5">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${TIMELINE_DOT[t.status] || 'bg-slate-300'}`} />
                    {i < (viewing.timeline || []).length - 1 && <span className="w-px flex-1 bg-slate-200 mt-1" />}
                  </div>
                  <div className="pb-2">
                    <div className="text-xs text-slate-700"><span className="font-medium">{t.byName}</span> — {t.note}</div>
                    <div className="text-[11px] text-slate-400">{new Date(t.at).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  );
}

// ─── WORK SUMMARY TAB ───────────────────────────────────────────────────────────
// Fixed categorical order (validated for CVD-safety) — used consistently across
// HR Reports and this trend chart so a hue always means the same series.
const VIZ_SERIES = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948'];

function WorkSummaryTab() {
  const qc = useQueryClient();
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [showSubmit, setShowSubmit] = useState(false);
  const [historyStaff, setHistoryStaff] = useState<any>(null);

  const fromDate = new Date(); fromDate.setDate(fromDate.getDate() - 13);
  const from = fromDate.toISOString().split('T')[0];

  const { data: staffList = [] } = useQuery({ queryKey: ['staff'], queryFn: hrService.getStaff });
  const { data: rollup, isLoading } = useQuery({ queryKey: ['work-summary-rollup', date], queryFn: () => hrService.getDailyWorkSummaryRollup(date) });
  const { data: trendRaw = [] } = useQuery({ queryKey: ['work-summary-trend', from, today], queryFn: () => hrService.getDailyWorkSummaries({ from, to: today }) });
  const staffArr = staffList as any[];
  const r = (rollup || { submitted: [], missing: [], totalStaff: 0 }) as any;

  // Build a 14-day trend: submissions per day + high-workload count per day.
  const trendMap = new Map<string, { date: string; submitted: number; high: number }>();
  for (let i = 0; i < 14; i++) {
    const d = new Date(fromDate); d.setDate(d.getDate() + i);
    const key = d.toISOString().split('T')[0];
    trendMap.set(key, { date: key, submitted: 0, high: 0 });
  }
  (trendRaw as any[]).forEach((s: any) => {
    const key = new Date(s.date).toISOString().split('T')[0];
    const row = trendMap.get(key);
    if (row) { row.submitted += 1; if (s.workload === 'high') row.high += 1; }
  });
  const trendData = Array.from(trendMap.values()).map(r2 => ({ ...r2, label: new Date(r2.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) }));

  const [form, setForm] = useState({ staffId: '', date: today, summary: '', workload: 'normal', blockers: '', tasks: [] as { task: string; isDone: boolean }[] });
  const [newTask, setNewTask] = useState('');
  const submitMut = useMutation({
    mutationFn: () => {
      const staff = staffArr.find((s: any) => s._id === form.staffId);
      return hrService.upsertDailyWorkSummary({ ...form, staffName: staff ? `${staff.firstName} ${staff.lastName}` : '', department: staff?.department });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['work-summary-rollup'] }); qc.invalidateQueries({ queryKey: ['work-summary-trend'] }); toast.success('Summary saved'); setShowSubmit(false); setForm({ staffId: '', date: today, summary: '', workload: 'normal', blockers: '', tasks: [] }); },
    onError: () => toast.error('Failed to save summary'),
  });
  const ackMut = useMutation({
    mutationFn: (id: string) => hrService.acknowledgeDailyWorkSummary(id, 'HR'),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['work-summary-rollup'] }); },
  });

  const addTask = () => { if (!newTask.trim()) return; setForm(p => ({ ...p, tasks: [...p.tasks, { task: newTask.trim(), isDone: false }] })); setNewTask(''); };
  const toggleTask = (i: number) => setForm(p => ({ ...p, tasks: p.tasks.map((t, idx) => idx === i ? { ...t, isDone: !t.isDone } : t) }));
  const removeTask = (i: number) => setForm(p => ({ ...p, tasks: p.tasks.filter((_, idx) => idx !== i) }));

  const { data: historyRaw = [] } = useQuery({
    queryKey: ['work-summary-history', historyStaff?._id],
    queryFn: () => hrService.getDailyWorkSummaries({ staffId: historyStaff._id }),
    enabled: !!historyStaff,
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-slate-900">Daily Work Summary</h1>
        <div className="flex gap-2">
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white" />
          <Btn variant="primary" onClick={() => { setForm(p => ({ ...p, date })); setShowSubmit(true); }}>+ Log Summary</Btn>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-5">
        <KPI label="Total Staff" value={String(r.totalStaff)} color="navy" />
        <KPI label="Submitted" value={String(r.submitted.length)} color="green" />
        <KPI label="Missing" value={String(r.missing.length)} color="amber" />
      </div>

      <Card className="mb-4">
        <CardHeader title="Submission Trend" sub="Last 14 days — daily submissions vs. high-workload days" />
        <div className="p-4" style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="submitted" name="Submitted" stroke={VIZ_SERIES[0]} strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="high" name="High workload" stroke={VIZ_SERIES[1]} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Submitted" />
          {isLoading ? (
            <div className="p-8 text-center text-slate-400 text-sm animate-pulse">Loading…</div>
          ) : r.submitted.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">No summaries logged for this date yet</div>
          ) : (
            <div className="divide-y divide-slate-50">
              {r.submitted.map((s: any) => {
                const tasks = s.tasks || [];
                const doneCount = tasks.filter((t: any) => t.isDone).length;
                return (
                  <div key={s._id} className="p-3">
                    <div className="flex items-center justify-between">
                      <button onClick={() => setHistoryStaff({ _id: s.staffId, name: s.staffName })} className="text-sm font-medium text-slate-800 hover:underline hover:text-[#0C447C]">{s.staffName}</button>
                      <div className="flex items-center gap-2">
                        <Badge v={s.workload === 'high' ? 'red' : s.workload === 'low' ? 'gray' : 'blue'}>{s.workload}</Badge>
                        {!s.acknowledged && <button onClick={() => ackMut.mutate(s._id)} className="text-xs text-[#0C447C] hover:underline">Acknowledge</button>}
                        {s.acknowledged && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{s.summary}</p>
                    {tasks.length > 0 && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] text-slate-400">{doneCount}/{tasks.length} tasks done</span>
                        </div>
                        <PBar pct={tasks.length > 0 ? (doneCount / tasks.length) * 100 : 0} color={doneCount === tasks.length ? '#1baf7a' : '#2a78d6'} />
                        <div className="mt-1.5 space-y-0.5">
                          {tasks.map((t: any, i: number) => (
                            <div key={i} className={`text-[11px] flex items-center gap-1.5 ${t.isDone ? 'text-slate-400 line-through' : 'text-slate-600'}`}>
                              {t.isDone ? <Check className="w-3 h-3 text-emerald-500 shrink-0" /> : <span className="w-3 h-3 rounded-sm border border-slate-300 shrink-0" />}
                              {t.task}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {s.blockers && <p className="text-xs text-red-500 mt-1">⚠ {s.blockers}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
        <Card>
          <CardHeader title="Missing" />
          {r.missing.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">Everyone has logged a summary 🎉</div>
          ) : (
            <div className="divide-y divide-slate-50">
              {r.missing.map((s: any) => (
                <div key={s.staffId} className="flex items-center justify-between p-3">
                  <div className="text-sm text-slate-700">{s.name}</div>
                  <div className="text-xs text-slate-400">{s.department || ''}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {showSubmit && (
        <ModalShell title="Log Daily Work Summary" onClose={() => setShowSubmit(false)} footer={<><Btn onClick={() => setShowSubmit(false)}>Cancel</Btn><Btn variant="primary" onClick={() => submitMut.mutate()}>{submitMut.isPending ? 'Saving…' : 'Save'}</Btn></>}>
          <WF label="Staff Member" required>
            <select value={form.staffId} onChange={e => setForm(p => ({ ...p, staffId: e.target.value }))} className={WIC}>
              <option value="">Select staff…</option>
              {staffArr.map((s: any) => <option key={s._id} value={s._id}>{s.firstName} {s.lastName}</option>)}
            </select>
          </WF>
          <WF label="Date" required><input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} className={WIC} /></WF>
          <WF label="What did they work on today?" required>
            <textarea value={form.summary} onChange={e => setForm(p => ({ ...p, summary: e.target.value }))} rows={3} className={WIC} />
          </WF>
          <WF label="Task Checklist (optional)" span2>
            <div className="flex gap-2 mb-2">
              <input value={newTask} onChange={e => setNewTask(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTask())} placeholder="Add a task…" className={WIC} />
              <Btn onClick={addTask}>Add</Btn>
            </div>
            <div className="space-y-1.5">
              {form.tasks.map((t, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={t.isDone} onChange={() => toggleTask(i)} className="accent-[#0C447C]" />
                  <span className={t.isDone ? 'line-through text-slate-400 flex-1' : 'flex-1'}>{t.task}</span>
                  <button onClick={() => removeTask(i)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                </div>
              ))}
              {form.tasks.length === 0 && <div className="text-xs text-slate-400">No tasks added — the free-text summary above still works fine on its own.</div>}
            </div>
          </WF>
          <WF label="Workload">
            <select value={form.workload} onChange={e => setForm(p => ({ ...p, workload: e.target.value }))} className={WIC}>
              <option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option>
            </select>
          </WF>
          <WF label="Blockers (optional)"><input value={form.blockers} onChange={e => setForm(p => ({ ...p, blockers: e.target.value }))} className={WIC} /></WF>
        </ModalShell>
      )}

      {historyStaff && (
        <ModalShell title={`Work Summary History — ${historyStaff.name}`} onClose={() => setHistoryStaff(null)} wide footer={<Btn onClick={() => setHistoryStaff(null)}>Close</Btn>}>
          {(historyRaw as any[]).length === 0 ? (
            <p className="text-sm text-slate-400">No summaries logged by this staff member yet.</p>
          ) : (
            <div className="space-y-3 max-h-[50vh] overflow-y-auto">
              {(historyRaw as any[]).map((s: any) => (
                <div key={s._id} className="border border-slate-100 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-700">{new Date(s.date).toLocaleDateString()}</span>
                    <Badge v={s.workload === 'high' ? 'red' : s.workload === 'low' ? 'gray' : 'blue'}>{s.workload}</Badge>
                  </div>
                  <p className="text-xs text-slate-600">{s.summary}</p>
                  {(s.tasks || []).length > 0 && (
                    <div className="mt-1.5 space-y-0.5">
                      {(s.tasks || []).map((t: any, i: number) => (
                        <div key={i} className={`text-[11px] ${t.isDone ? 'text-slate-400 line-through' : 'text-slate-600'}`}>{t.isDone ? '✓' : '○'} {t.task}</div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ModalShell>
      )}
    </div>
  );
}

// ─── EXPENSE CLAIMS TAB ─────────────────────────────────────────────────────────
const EXPENSE_CATEGORIES = ['travel', 'meals', 'supplies', 'training', 'transport', 'accommodation', 'other'];
const claimStatusV: Record<string, BadgeVariant> = { draft: 'gray', submitted: 'amber', approved: 'green', rejected: 'red', paid: 'blue' };
const advanceStatusV: Record<string, BadgeVariant> = { requested: 'amber', approved: 'blue', rejected: 'red', disbursed: 'purple', settled: 'green', partially_settled: 'amber' };

function ExpenseClaimsTab() {
  const qc = useQueryClient();
  const [sub, setSub] = useState<'claims' | 'advances'>('claims');
  const [showNewClaim, setShowNewClaim] = useState(false);
  const [showNewAdvance, setShowNewAdvance] = useState(false);
  const [viewingClaim, setViewingClaim] = useState<any>(null);
  const [claimStatusFilter, setClaimStatusFilter] = useState('');
  const [claimCategoryFilter, setClaimCategoryFilter] = useState('');
  const [pendingReceipt, setPendingReceipt] = useState<File | null>(null);

  const { data: staffList = [] } = useQuery({ queryKey: ['staff'], queryFn: hrService.getStaff });
  const { data: claims = [], isLoading: claimsLoading } = useQuery({ queryKey: ['expense-claims'], queryFn: () => hrService.getExpenseClaims() });
  const { data: advances = [], isLoading: advancesLoading } = useQuery({ queryKey: ['advances'], queryFn: () => hrService.getAdvances() });
  const staffArr = staffList as any[];
  const claimsArrAll = claims as any[];
  const advancesArr = advances as any[];
  const claimsArr = claimsArrAll.filter(c =>
    (!claimStatusFilter || c.status === claimStatusFilter) &&
    (!claimCategoryFilter || c.category === claimCategoryFilter));

  const [claimForm, setClaimForm] = useState({ staffId: '', category: 'other', description: '', amount: 0, expenseDate: new Date().toISOString().split('T')[0], settlementMethod: 'payroll', advanceId: '' });
  const createClaimMut = useMutation({
    mutationFn: () => {
      const staff = staffArr.find((s: any) => s._id === claimForm.staffId);
      return hrService.createExpenseClaim({ ...claimForm, advanceId: claimForm.advanceId || null, staffName: staff ? `${staff.firstName} ${staff.lastName}` : '' });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['expense-claims'] }); toast.success('Claim submitted'); setShowNewClaim(false); setClaimForm({ staffId: '', category: 'other', description: '', amount: 0, expenseDate: new Date().toISOString().split('T')[0], settlementMethod: 'payroll', advanceId: '' }); },
    onError: () => toast.error('Failed to submit claim'),
  });
  const claimStatusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => hrService.updateExpenseClaimStatus(id, status, 'HR'),
    onSuccess: (updated: any) => { qc.invalidateQueries({ queryKey: ['expense-claims'] }); qc.invalidateQueries({ queryKey: ['advances'] }); toast.success('Claim updated'); if (viewingClaim) setViewingClaim(updated); },
    onError: () => toast.error('Failed to update claim'),
  });
  const uploadReceiptMut = useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => hrService.addExpenseClaimReceipt(id, file),
    onSuccess: (updated: any) => { qc.invalidateQueries({ queryKey: ['expense-claims'] }); toast.success('Receipt uploaded'); setViewingClaim(updated); setPendingReceipt(null); },
    onError: () => toast.error('Failed to upload receipt — check the file is an image or PDF under 10MB'),
  });

  const approvedAdvancesForStaff = (staffId: string) => advancesArr.filter(a => String(a.staffId) === String(staffId) && ['approved', 'disbursed', 'partially_settled'].includes(a.status));

  const [advanceForm, setAdvanceForm] = useState({ staffId: '', reason: '', amount: 0, requestedDate: new Date().toISOString().split('T')[0] });
  const createAdvanceMut = useMutation({
    mutationFn: () => {
      const staff = staffArr.find((s: any) => s._id === advanceForm.staffId);
      return hrService.createAdvance({ ...advanceForm, staffName: staff ? `${staff.firstName} ${staff.lastName}` : '' });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['advances'] }); toast.success('Advance requested'); setShowNewAdvance(false); },
    onError: () => toast.error('Failed to request advance'),
  });
  const advanceStatusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => hrService.updateAdvanceStatus(id, status, 'HR'),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['advances'] }); toast.success('Advance updated'); },
    onError: () => toast.error('Failed to update advance'),
  });

  const pendingClaims = claimsArrAll.filter(c => c.status === 'submitted').length;
  const totalApprovedThisMonth = claimsArrAll.filter(c => c.status === 'approved' || c.status === 'paid').reduce((s, c) => s + (c.amount || 0), 0);
  const outstandingAdvances = advancesArr.filter(a => a.status === 'disbursed' || a.status === 'approved').reduce((s, a) => s + ((a.amount || 0) - (a.settledAmount || 0)), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-slate-900">Expense Claims</h1>
        <Btn variant="primary" onClick={() => sub === 'claims' ? setShowNewClaim(true) : setShowNewAdvance(true)}>+ {sub === 'claims' ? 'New Claim' : 'New Advance'}</Btn>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-5">
        <KPI label="Pending Claims" value={String(pendingClaims)} color="amber" />
        <KPI label="Approved (Total)" value={`PKR ${totalApprovedThisMonth.toLocaleString()}`} color="green" />
        <KPI label="Outstanding Advances" value={`PKR ${outstandingAdvances.toLocaleString()}`} color="navy" />
      </div>
      <div className="flex gap-2 mb-4">
        {(['claims', 'advances'] as const).map(t => (
          <button key={t} onClick={() => setSub(t)}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px ${sub === t ? 'border-[#0C447C] text-[#0C447C]' : 'border-transparent text-slate-400'}`}>
            {t === 'claims' ? 'Claims' : 'Advances'}
          </button>
        ))}
      </div>

      {sub === 'claims' ? (
        <Card>
          <CardHeader title="Expense Claims" actions={
            <div className="flex gap-2">
              <select value={claimCategoryFilter} onChange={e => setClaimCategoryFilter(e.target.value)} className="px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white">
                <option value="">All categories</option>
                {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={claimStatusFilter} onChange={e => setClaimStatusFilter(e.target.value)} className="px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white">
                <option value="">All statuses</option>
                {Object.keys(claimStatusV).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          } />
          {claimsLoading ? (
            <div className="p-8 text-center text-slate-400 text-sm animate-pulse">Loading…</div>
          ) : claimsArr.length === 0 ? (
            <div className="p-12 text-center"><Receipt className="w-10 h-10 text-slate-300 mx-auto mb-3" /><div className="text-slate-500">No expense claims match these filters</div></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <THead cols={['Claim #', 'Staff', 'Category', 'Amount', 'Receipts', 'Settlement', 'Status', 'Actions']} />
                <tbody>
                  {claimsArr.map((c: any) => (
                    <tr key={c._id} className="border-b border-slate-50 hover:bg-slate-50">
                      <Td className="font-medium"><button onClick={() => setViewingClaim(c)} className="hover:underline hover:text-[#0C447C]">{c.claimNo}</button></Td>
                      <Td>{c.staffName}</Td>
                      <Td className="capitalize">{c.category}</Td>
                      <Td>{c.currency} {Number(c.amount).toLocaleString()}</Td>
                      <Td>{(c.receipts || []).length > 0 ? <span className="text-xs text-slate-500">📎 {(c.receipts || []).length}</span> : <span className="text-xs text-slate-300">—</span>}</Td>
                      <Td>
                        <span className="text-xs text-slate-500">{c.settlementMethod === 'payroll' ? 'Payroll' : 'Direct'}</span>
                        {c.settlementMethod === 'payroll' && c.status === 'approved' && (
                          c.settledInPayroll
                            ? <span className="block text-[11px] text-emerald-600">✓ netted in payslip</span>
                            : <span className="block text-[11px] text-amber-600">pending next payslip</span>
                        )}
                      </Td>
                      <Td><Badge v={claimStatusV[c.status] || 'gray'}>{c.status}</Badge></Td>
                      <Td>
                        <div className="flex gap-1.5">
                          <button onClick={() => setViewingClaim(c)} className="px-2 py-1 text-xs bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 font-medium">View</button>
                          {c.status === 'submitted' && (
                            <>
                              <button onClick={() => claimStatusMut.mutate({ id: c._id, status: 'approved' })} className="px-2 py-1 text-xs bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 font-medium">Approve</button>
                              <button onClick={() => claimStatusMut.mutate({ id: c._id, status: 'rejected' })} className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium">Reject</button>
                            </>
                          )}
                        </div>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      ) : (
        <Card>
          <CardHeader title="Advances" />
          {advancesLoading ? (
            <div className="p-8 text-center text-slate-400 text-sm animate-pulse">Loading…</div>
          ) : advancesArr.length === 0 ? (
            <div className="p-12 text-center"><Receipt className="w-10 h-10 text-slate-300 mx-auto mb-3" /><div className="text-slate-500">No advances yet</div></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <THead cols={['Advance #', 'Staff', 'Reason', 'Amount', 'Settled', 'Status', 'Actions']} />
                <tbody>
                  {advancesArr.map((a: any) => (
                    <tr key={a._id} className="border-b border-slate-50 hover:bg-slate-50">
                      <Td className="font-medium">{a.advanceNo}</Td>
                      <Td>{a.staffName}</Td>
                      <Td>{a.reason}</Td>
                      <Td>{a.currency} {Number(a.amount).toLocaleString()}</Td>
                      <Td>{a.currency} {Number(a.settledAmount || 0).toLocaleString()}</Td>
                      <Td><Badge v={advanceStatusV[a.status] || 'gray'}>{a.status}</Badge></Td>
                      <Td>
                        {a.status === 'requested' && (
                          <div className="flex gap-1.5">
                            <button onClick={() => advanceStatusMut.mutate({ id: a._id, status: 'approved' })} className="px-2 py-1 text-xs bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 font-medium">Approve</button>
                            <button onClick={() => advanceStatusMut.mutate({ id: a._id, status: 'rejected' })} className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium">Reject</button>
                          </div>
                        )}
                        {a.status === 'approved' && (
                          <button onClick={() => advanceStatusMut.mutate({ id: a._id, status: 'disbursed' })} className="px-2 py-1 text-xs bg-blue-50 text-[#0C447C] rounded-lg hover:bg-blue-100 font-medium">Mark Disbursed</button>
                        )}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {showNewClaim && (
        <ModalShell title="Submit Expense Claim" onClose={() => setShowNewClaim(false)} footer={<><Btn onClick={() => setShowNewClaim(false)}>Cancel</Btn><Btn variant="primary" onClick={() => createClaimMut.mutate()}>{createClaimMut.isPending ? 'Submitting…' : 'Submit'}</Btn></>}>
          <WF label="Staff Member" required>
            <select value={claimForm.staffId} onChange={e => setClaimForm(p => ({ ...p, staffId: e.target.value }))} className={WIC}>
              <option value="">Select staff…</option>
              {staffArr.map((s: any) => <option key={s._id} value={s._id}>{s.firstName} {s.lastName}</option>)}
            </select>
          </WF>
          <WF label="Category" required>
            <select value={claimForm.category} onChange={e => setClaimForm(p => ({ ...p, category: e.target.value }))} className={WIC}>
              {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </WF>
          <WF label="Description" required><input value={claimForm.description} onChange={e => setClaimForm(p => ({ ...p, description: e.target.value }))} className={WIC} /></WF>
          <WF label="Amount (PKR)" required><input type="number" value={claimForm.amount} onChange={e => setClaimForm(p => ({ ...p, amount: Number(e.target.value) || 0 }))} className={WIC} /></WF>
          <WF label="Expense Date" required><input type="date" value={claimForm.expenseDate} onChange={e => setClaimForm(p => ({ ...p, expenseDate: e.target.value }))} className={WIC} /></WF>
          <WF label="Settlement Method">
            <select value={claimForm.settlementMethod} onChange={e => setClaimForm(p => ({ ...p, settlementMethod: e.target.value }))} className={WIC}>
              <option value="payroll">Net into next payslip</option>
              <option value="direct">Direct payout (outside payroll)</option>
            </select>
          </WF>
          {claimForm.staffId && approvedAdvancesForStaff(claimForm.staffId).length > 0 && (
            <WF label="Settling an Advance? (optional)">
              <select value={claimForm.advanceId} onChange={e => setClaimForm(p => ({ ...p, advanceId: e.target.value }))} className={WIC}>
                <option value="">Not linked to an advance</option>
                {approvedAdvancesForStaff(claimForm.staffId).map((a: any) => (
                  <option key={a._id} value={a._id}>{a.advanceNo} — {a.currency} {Number(a.amount).toLocaleString()} ({a.reason})</option>
                ))}
              </select>
            </WF>
          )}
        </ModalShell>
      )}

      {viewingClaim && (
        <ModalShell title={`Claim ${viewingClaim.claimNo}`} onClose={() => setViewingClaim(null)} wide footer={<Btn onClick={() => setViewingClaim(null)}>Close</Btn>}>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Badge v={claimStatusV[viewingClaim.status] || 'gray'}>{viewingClaim.status}</Badge>
            <span className="text-xs text-slate-400 capitalize">{viewingClaim.category}</span>
            <span className="text-xs text-slate-400">{viewingClaim.settlementMethod === 'payroll' ? 'Netting into payroll' : 'Direct payout'}</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm py-2">
            <div><span className="text-slate-400 text-xs block">Staff</span>{viewingClaim.staffName}</div>
            <div><span className="text-slate-400 text-xs block">Amount</span>{viewingClaim.currency} {Number(viewingClaim.amount).toLocaleString()}</div>
            <div><span className="text-slate-400 text-xs block">Expense Date</span>{new Date(viewingClaim.expenseDate).toLocaleDateString()}</div>
            <div><span className="text-slate-400 text-xs block">Description</span>{viewingClaim.description}</div>
            {viewingClaim.advanceId && (
              <div className="col-span-2"><span className="text-slate-400 text-xs block">Linked Advance</span>{advancesArr.find((a: any) => a._id === viewingClaim.advanceId)?.advanceNo || viewingClaim.advanceId}</div>
            )}
            {viewingClaim.status === 'approved' && viewingClaim.settlementMethod === 'payroll' && (
              <div className="col-span-2">
                <span className="text-slate-400 text-xs block">Payroll Settlement</span>
                {viewingClaim.settledInPayroll ? <span className="text-emerald-600">✓ Netted into a payslip</span> : <span className="text-amber-600">Pending — will net into this staff member's next processed payslip</span>}
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500 mb-2">Receipts</p>
            {(viewingClaim.receipts || []).length === 0 ? (
              <p className="text-xs text-slate-400 mb-2">No receipts uploaded yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2 mb-2">
                {(viewingClaim.receipts || []).map((r: any, i: number) => (
                  <a key={i} href={r.url} target="_blank" rel="noreferrer" className="text-xs px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100">📎 {r.fileName || r.label || `Receipt ${i + 1}`}</a>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2">
              <input type="file" accept="image/*,application/pdf" onChange={e => setPendingReceipt(e.target.files?.[0] || null)} className="text-xs" />
              <Btn onClick={() => pendingReceipt && uploadReceiptMut.mutate({ id: viewingClaim._id, file: pendingReceipt })} disabled={!pendingReceipt || uploadReceiptMut.isPending}>
                {uploadReceiptMut.isPending ? 'Uploading…' : 'Upload'}
              </Btn>
            </div>
          </div>

          {viewingClaim.status === 'submitted' && (
            <div className="flex gap-2 pt-3 border-t border-slate-100">
              <button onClick={() => claimStatusMut.mutate({ id: viewingClaim._id, status: 'approved' })} className="px-3 py-1.5 text-xs bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 font-medium">Approve</button>
              <button onClick={() => claimStatusMut.mutate({ id: viewingClaim._id, status: 'rejected' })} className="px-3 py-1.5 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium">Reject</button>
            </div>
          )}
          {viewingClaim.rejectionReason && <p className="text-xs text-red-500 pt-2">Rejection reason: {viewingClaim.rejectionReason}</p>}
        </ModalShell>
      )}

      {showNewAdvance && (
        <ModalShell title="Request Advance" onClose={() => setShowNewAdvance(false)} footer={<><Btn onClick={() => setShowNewAdvance(false)}>Cancel</Btn><Btn variant="primary" onClick={() => createAdvanceMut.mutate()}>{createAdvanceMut.isPending ? 'Submitting…' : 'Submit'}</Btn></>}>
          <WF label="Staff Member" required>
            <select value={advanceForm.staffId} onChange={e => setAdvanceForm(p => ({ ...p, staffId: e.target.value }))} className={WIC}>
              <option value="">Select staff…</option>
              {staffArr.map((s: any) => <option key={s._id} value={s._id}>{s.firstName} {s.lastName}</option>)}
            </select>
          </WF>
          <WF label="Reason" required><input value={advanceForm.reason} onChange={e => setAdvanceForm(p => ({ ...p, reason: e.target.value }))} className={WIC} placeholder="e.g. Upcoming conference travel" /></WF>
          <WF label="Amount (PKR)" required><input type="number" value={advanceForm.amount} onChange={e => setAdvanceForm(p => ({ ...p, amount: Number(e.target.value) || 0 }))} className={WIC} /></WF>
          <WF label="Requested Date" required><input type="date" value={advanceForm.requestedDate} onChange={e => setAdvanceForm(p => ({ ...p, requestedDate: e.target.value }))} className={WIC} /></WF>
        </ModalShell>
      )}
    </div>
  );
}

// ─── HR REPORTS ─────────────────────────────────────────────────────────────
function downloadHrCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows.map(r => r.map(c => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

const EXIT_TYPE_LABEL: Record<string, string> = {
  resignation: 'Resignation', termination: 'Termination', retirement: 'Retirement',
  contract_end: 'Contract End', mutual_agreement: 'Mutual Agreement', death: 'Death', abandonment: 'Abandonment',
};

const RATING_LABEL: Record<string, string> = {
  outstanding: 'Outstanding', exceeds_expectations: 'Exceeds Expectations', meets_expectations: 'Meets Expectations',
  needs_improvement: 'Needs Improvement', unsatisfactory: 'Unsatisfactory',
};

function ReportsTab() {
  const [openReport, setOpenReport] = useState<'headcount' | 'turnover' | 'leave' | 'performance' | null>(null);
  const [exitDrillType, setExitDrillType] = useState<string | null>(null);

  const { data: staffData = [], isLoading: staffLoading } = useQuery({ queryKey: ['staff'], queryFn: hrService.getStaff });
  const { data: exitData = [], isLoading: exitLoading } = useQuery({ queryKey: ['exit-records'], queryFn: hrService.getExitRecords });
  const { data: balancesData = [], isLoading: balancesLoading } = useQuery({ queryKey: ['leave-balances'], queryFn: hrService.getAllLeaveBalances });
  const { data: reviewsData = [], isLoading: reviewsLoading } = useQuery({ queryKey: ['performance-reviews-all'], queryFn: () => hrService.getPerformanceReviews() });

  const staffArr = staffData as any[];
  const exitArr = exitData as any[];
  const balanceArr = balancesData as any[];
  const reviewArr = reviewsData as any[];

  const isLoading = staffLoading || exitLoading || balancesLoading || reviewsLoading;

  // Headcount by department
  const deptMap = new Map<string, { total: number; active: number }>();
  staffArr.forEach((s: any) => {
    const dept = s.department || 'Unassigned';
    const row = deptMap.get(dept) || { total: 0, active: 0 };
    row.total += 1;
    if ((s.status || '').toLowerCase() === 'active') row.active += 1;
    deptMap.set(dept, row);
  });
  const deptRows = Array.from(deptMap.entries()).map(([department, v]) => ({ department, ...v })).sort((a, b) => b.total - a.total);

  // Turnover / exit reasons
  const exitTypeMap = new Map<string, number>();
  exitArr.forEach((e: any) => { const t = e.exitType || 'other'; exitTypeMap.set(t, (exitTypeMap.get(t) || 0) + 1); });
  const exitTypeRows = Array.from(exitTypeMap.entries()).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count);
  const totalExits = exitArr.length;
  const turnoverRate = staffArr.length > 0 ? ((totalExits / (staffArr.length + totalExits)) * 100).toFixed(1) : '0.0';

  // Leave utilization
  const leaveTypes = ['annual', 'sick', 'casual', 'maternity', 'paternity', 'hajj'] as const;
  const leaveUtil = leaveTypes.map((type) => {
    let entitled = 0, remaining = 0;
    balanceArr.forEach((r: any) => {
      if (r.hasPolicy && r[type]) { entitled += r[type].entitled || 0; remaining += r[type].remaining || 0; }
    });
    const used = entitled - remaining;
    return { type, entitled, used, remaining, utilizationPct: entitled > 0 ? Math.round((used / entitled) * 100) : 0 };
  });

  // Performance rating distribution
  const ratingMap = new Map<string, number>();
  reviewArr.forEach((r: any) => { if (r.rating) ratingMap.set(r.rating, (ratingMap.get(r.rating) || 0) + 1); });
  const ratingRows = Array.from(ratingMap.entries()).map(([rating, count]) => ({ rating, count })).sort((a, b) => b.count - a.count);
  const totalRated = reviewArr.filter((r: any) => r.rating).length;

  function exportHeadcountCsv() {
    downloadHrCsv(`headcount-by-department-${new Date().toISOString().slice(0, 10)}.csv`, [
      ['Headcount by Department Report'], ['Generated', new Date().toLocaleString()], [],
      ['Department', 'Total Staff', 'Active'],
      ...deptRows.map(r => [r.department, r.total, r.active]),
    ]);
  }

  function exportTurnoverCsv() {
    downloadHrCsv(`turnover-exit-reasons-${new Date().toISOString().slice(0, 10)}.csv`, [
      ['Turnover / Exit Reasons Report'], ['Generated', new Date().toLocaleString()], ['Turnover Rate', `${turnoverRate}%`], [],
      ['Exit Type', 'Count'],
      ...exitTypeRows.map(r => [EXIT_TYPE_LABEL[r.type] || r.type, r.count]), [],
      ['Staff Name', 'Exit Type', 'Exit Date', 'Reason'],
      ...exitArr.map((e: any) => [e.staffName || '—', EXIT_TYPE_LABEL[e.exitType] || e.exitType || '—', e.exitDate ? new Date(e.exitDate).toLocaleDateString() : '—', e.reason || '—']),
    ]);
  }

  function exportLeaveUtilCsv() {
    downloadHrCsv(`leave-utilization-${new Date().toISOString().slice(0, 10)}.csv`, [
      ['Leave Utilization Report'], ['Generated', new Date().toLocaleString()], [],
      ['Leave Type', 'Entitled Days', 'Used Days', 'Remaining Days', 'Utilization %'],
      ...leaveUtil.map(r => [r.type, r.entitled, r.used, r.remaining, `${r.utilizationPct}%`]),
    ]);
  }

  function exportPerformanceCsv() {
    downloadHrCsv(`performance-rating-distribution-${new Date().toISOString().slice(0, 10)}.csv`, [
      ['Performance Rating Distribution Report'], ['Generated', new Date().toLocaleString()], ['Total Rated Reviews', totalRated], [],
      ['Rating', 'Count', 'Share %'],
      ...ratingRows.map(r => [RATING_LABEL[r.rating] || r.rating, r.count, totalRated > 0 ? `${Math.round((r.count / totalRated) * 100)}%` : '0%']),
    ]);
  }

  const REPORTS: { id: 'headcount' | 'turnover' | 'leave' | 'performance'; icon: string; title: string; desc: string; onExport: () => void }[] = [
    { id: 'headcount', icon: '🏢', title: 'Headcount by Department', desc: 'Staff count and active ratio per department', onExport: exportHeadcountCsv },
    { id: 'turnover', icon: '🚪', title: 'Turnover & Exit Reasons', desc: 'Exit type breakdown and turnover rate', onExport: exportTurnoverCsv },
    { id: 'leave', icon: '🏖️', title: 'Leave Utilization', desc: 'Entitled vs used vs remaining leave days', onExport: exportLeaveUtilCsv },
    { id: 'performance', icon: '⭐', title: 'Performance Rating Distribution', desc: 'Spread of ratings across completed reviews', onExport: exportPerformanceCsv },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-[#0C447C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">HR Reports</h1>
        <p className="text-sm text-slate-500 mt-0.5">Headcount, turnover, leave, and performance analytics built from your live HR data</p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <KPI label="Total Staff" value={String(staffArr.length)} />
        <KPI label="Total Exits" value={String(totalExits)} sub={`${turnoverRate}% turnover rate`} color="red" />
        <KPI label="Staff On Leave Policy" value={String(balanceArr.filter((r: any) => r.hasPolicy).length)} color="blue" />
        <KPI label="Reviews Completed" value={String(totalRated)} color="green" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {REPORTS.map((r) => (
          <Card key={r.id} className="p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">{r.icon}</span>
              <div className="flex-1">
                <div className="text-sm font-semibold text-slate-900 mb-0.5">{r.title}</div>
                <div className="text-xs text-slate-400">{r.desc}</div>
              </div>
            </div>
            <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
              <button onClick={() => setOpenReport(r.id)} className="flex-1 text-xs py-1.5 bg-blue-50 text-[#0C447C] rounded-lg hover:bg-blue-100 font-medium">📊 Generate</button>
              <button onClick={r.onExport} className="text-xs py-1.5 px-3 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 font-medium">⬇️ Export</button>
            </div>
          </Card>
        ))}
      </div>

      {openReport === 'headcount' && (
        <ModalShell title="Headcount by Department" onClose={() => setOpenReport(null)} footer={<><Btn onClick={() => setOpenReport(null)}>Close</Btn><Btn variant="primary" onClick={exportHeadcountCsv}>⬇️ Export CSV</Btn></>} wide>
          {deptRows.length > 0 && (
            <div style={{ height: 260 }} className="mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptRows} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="department" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} interval={0} angle={-20} textAnchor="end" height={60} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="total" name="Total Staff" fill={VIZ_SERIES[0]} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="active" name="Active" fill={VIZ_SERIES[1]} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <THead cols={['Department', 'Total Staff', 'Active']} />
              <tbody>
                {deptRows.map((r) => (
                  <tr key={r.department} className="border-b border-slate-50">
                    <Td className="font-medium">{r.department}</Td>
                    <Td>{r.total}</Td>
                    <Td>{r.active}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ModalShell>
      )}

      {openReport === 'turnover' && (
        <ModalShell title="Turnover & Exit Reasons" onClose={() => { setOpenReport(null); setExitDrillType(null); }} footer={<><Btn onClick={() => setOpenReport(null)}>Close</Btn><Btn variant="primary" onClick={exportTurnoverCsv}>⬇️ Export CSV</Btn></>} wide>
          <div className="mb-4 text-sm text-slate-600">Turnover rate: <span className="font-bold text-slate-900">{turnoverRate}%</span> · {totalExits} exit{totalExits !== 1 ? 's' : ''} recorded</div>
          {exitTypeRows.length === 0 ? (
            <p className="text-sm text-slate-400">No exit records yet.</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div style={{ height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={exitTypeRows} dataKey="count" nameKey="type" innerRadius={50} outerRadius={80}
                        onClick={(d: any) => setExitDrillType(d.type === exitDrillType ? null : d.type)}
                        label={({ type, percent }: any) => `${EXIT_TYPE_LABEL[type] || type} ${Math.round(percent * 100)}%`}
                        labelLine={false} style={{ fontSize: 11, cursor: 'pointer' }}>
                        {exitTypeRows.map((r, i) => (
                          <Cell key={r.type} fill={VIZ_SERIES[i % VIZ_SERIES.length]} stroke={r.type === exitDrillType ? '#0C447C' : '#fff'} strokeWidth={r.type === exitDrillType ? 2 : 1} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} formatter={(v: any, _n: any, p: any) => [v, EXIT_TYPE_LABEL[p.payload.type] || p.payload.type]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <THead cols={['Exit Type', 'Count']} />
                    <tbody>
                      {exitTypeRows.map((r, i) => (
                        <tr key={r.type} onClick={() => setExitDrillType(r.type === exitDrillType ? null : r.type)}
                          className={`border-b border-slate-50 cursor-pointer hover:bg-slate-50 ${r.type === exitDrillType ? 'bg-blue-50/60' : ''}`}>
                          <Td className="font-medium"><span className="inline-block w-2.5 h-2.5 rounded-full mr-2" style={{ background: VIZ_SERIES[i % VIZ_SERIES.length] }} />{EXIT_TYPE_LABEL[r.type] || r.type}</Td>
                          <Td>{r.count}</Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-2">
                  {exitDrillType ? `Exit records — ${EXIT_TYPE_LABEL[exitDrillType] || exitDrillType} (click again to clear)` : 'All exit records (click a slice or row above to filter)'}
                </p>
                <div className="overflow-x-auto max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <THead cols={['Staff Name', 'Exit Type', 'Exit Date', 'Reason']} />
                    <tbody>
                      {exitArr.filter((e: any) => !exitDrillType || e.exitType === exitDrillType).map((e: any, i: number) => (
                        <tr key={i} className="border-b border-slate-50">
                          <Td>{e.staffName || '—'}</Td>
                          <Td className="capitalize">{EXIT_TYPE_LABEL[e.exitType] || e.exitType || '—'}</Td>
                          <Td>{e.exitDate ? new Date(e.exitDate).toLocaleDateString() : '—'}</Td>
                          <Td className="max-w-[240px] truncate">{e.reason || '—'}</Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </ModalShell>
      )}

      {openReport === 'leave' && (
        <ModalShell title="Leave Utilization" onClose={() => setOpenReport(null)} footer={<><Btn onClick={() => setOpenReport(null)}>Close</Btn><Btn variant="primary" onClick={exportLeaveUtilCsv}>⬇️ Export CSV</Btn></>} wide>
          <div style={{ height: 240 }} className="mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leaveUtil} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="type" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} className="capitalize" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="entitled" name="Entitled" fill={VIZ_SERIES[0]} radius={[4, 4, 0, 0]} />
                <Bar dataKey="used" name="Used" fill={VIZ_SERIES[1]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <THead cols={['Leave Type', 'Entitled', 'Used', 'Remaining', 'Utilization']} />
              <tbody>
                {leaveUtil.map((r) => (
                  <tr key={r.type} className="border-b border-slate-50">
                    <Td className="font-medium capitalize">{r.type}</Td>
                    <Td>{r.entitled}</Td>
                    <Td>{r.used}</Td>
                    <Td>{r.remaining}</Td>
                    <Td>{r.utilizationPct}%</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ModalShell>
      )}

      {openReport === 'performance' && (
        <ModalShell title="Performance Rating Distribution" onClose={() => setOpenReport(null)} footer={<><Btn onClick={() => setOpenReport(null)}>Close</Btn><Btn variant="primary" onClick={exportPerformanceCsv}>⬇️ Export CSV</Btn></>} wide>
          {ratingRows.length === 0 ? (
            <p className="text-sm text-slate-400">No completed reviews with a rating yet.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={ratingRows} dataKey="count" nameKey="rating" innerRadius={50} outerRadius={80}
                      label={({ rating, percent }: any) => `${Math.round(percent * 100)}%`}
                      labelLine={false} style={{ fontSize: 11 }}>
                      {ratingRows.map((r, i) => <Cell key={r.rating} fill={VIZ_SERIES[i % VIZ_SERIES.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} formatter={(v: any, _n: any, p: any) => [v, RATING_LABEL[p.payload.rating] || p.payload.rating]} />
                    <Legend wrapperStyle={{ fontSize: 11 }} formatter={(_v: any, entry: any) => RATING_LABEL[entry?.payload?.rating] || entry?.payload?.rating} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <THead cols={['Rating', 'Count', 'Share']} />
                  <tbody>
                    {ratingRows.map((r) => (
                      <tr key={r.rating} className="border-b border-slate-50">
                        <Td><Badge v={REVIEW_RATING_V[r.rating] ?? 'gray'}>{RATING_LABEL[r.rating] || r.rating}</Badge></Td>
                        <Td>{r.count}</Td>
                        <Td>{totalRated > 0 ? Math.round((r.count / totalRated) * 100) : 0}%</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </ModalShell>
      )}
    </div>
  );
}

// ─── HR SETTINGS (consolidated hub) ────────────────────────────────────────────
function SettingsCard({ icon, title, description, onClick }: { icon: string; title: string; description: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-left p-4 rounded-xl border border-slate-200 bg-white hover:border-[#0C447C] hover:shadow-sm transition-all">
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-sm font-semibold text-slate-800">{title}</div>
      <div className="text-xs text-slate-500 mt-1">{description}</div>
    </button>
  );
}

function SettingsTab({ setTab }: { setTab: (t: HRTab) => void }) {
  const [openModal, setOpenModal] = useState<'shifts' | 'attendance' | 'exit' | 'hiring' | null>(null);

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-900">HR Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">Everything that configures how HR behaves for your school, in one place</p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <SettingsCard icon="⏰" title="Shifts" description="Define work shifts and assign staff to them" onClick={() => setOpenModal('shifts')} />
        <SettingsCard icon="📋" title="Attendance Settings" description="Grace period, late threshold, half-day cutoff" onClick={() => setOpenModal('attendance')} />
        <SettingsCard icon="🚪" title="Exit Settings" description="Notice periods, clearance checklist, exit interview questions" onClick={() => setOpenModal('exit')} />
        <SettingsCard icon="🧑‍💼" title="Hiring Settings" description="Interview stages, offer letter template, screening questions" onClick={() => setOpenModal('hiring')} />
        <SettingsCard icon="🏖️" title="Leave Policies" description="Configure leave types, allocations, and assign policies to staff" onClick={() => setTab('leave')} />
        <SettingsCard icon="💰" title="Salary Components" description="Define payroll earnings and deductions" onClick={() => setTab('payroll')} />
      </div>

      {openModal === 'shifts' && <ShiftsModal onClose={() => setOpenModal(null)} />}
      {openModal === 'attendance' && <AttendanceSettingsModal onClose={() => setOpenModal(null)} />}
      {openModal === 'exit' && <ExitSettingsModal onClose={() => setOpenModal(null)} />}
      {openModal === 'hiring' && <HiringSettingsModal onClose={() => setOpenModal(null)} />}
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function HRPage() {
  const [active, setActive] = useState<HRTab>("dashboard");

  const renderTab = () => {
    switch (active) {
      case "dashboard":   return <DashboardTab setTab={setActive} />;
      case "employees":   return <EmployeesTab />;
      case "lifecycle":   return <LifecycleTab />;
      case "recruitment": return <RecruitmentTab />;
      case "onboarding":  return <OnboardingTab />;
      case "attendance":  return <AttendanceTab />;
      case "leave":       return <LeaveTab />;
      case "payroll":     return <PayrollTab />;
      case "payslip":     return <PayslipTab />;
      case "performance": return <PerformanceTab />;
      case "training":    return <HRTrainingTab />;
      case "contracts":   return <ContractsTab />;
      case "exit":        return <ExitTab />;
      case "grievance":   return <GrievanceTab />;
      case "worksummary": return <WorkSummaryTab />;
      case "expenses":    return <ExpenseClaimsTab />;
      case "reports":     return <ReportsTab />;
      case "settings":    return <SettingsTab setTab={setActive} />;
    }
  };

  return (
    <div className="space-y-0">
      {/* Tab bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 -mx-6 px-6 mb-6">
        <div className="flex gap-0.5 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
                active === tab.id
                  ? "border-[#0C447C] text-[#0C447C]"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${
                  active === tab.id ? "bg-[#0C447C] text-white" : "bg-[#EF9F27] text-white"
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {renderTab()}
    </div>
  );
}
