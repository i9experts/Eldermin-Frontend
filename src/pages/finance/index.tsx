import { useState, Fragment } from "react";
import {
  LayoutDashboard, Receipt, Clock, CreditCard, Landmark,
  BarChart3, Shield, FileText, CheckSquare, Plus, Download,
  Search, Eye, Edit, TrendingUp, TrendingDown, AlertTriangle,
  RefreshCw, Printer, Send, Star, Wallet, Building2,
  CheckCircle, XCircle, ArrowUp, ArrowDown, X, Trash2,
  Users, BookOpen, MapPin, ChevronDown,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import financeService from "../../services/finance.service";

// ─── TYPES ────────────────────────────────────────────────────────────────────
type FinTab =
  | "dashboard" | "fee" | "receivable" | "payable"
  | "banking" | "budgeting" | "islamic" | "reports" | "audit";

const TABS: { id: FinTab; label: string; icon: LucideIcon; badge?: number }[] = [
  { id: "dashboard",  label: "Dashboard",       icon: LayoutDashboard },
  { id: "fee",        label: "Fee & Revenue",   icon: Receipt         },
  { id: "receivable", label: "Receivables",     icon: Clock, badge: 7 },
  { id: "payable",    label: "Payables",        icon: CreditCard      },
  { id: "banking",    label: "Banking",         icon: Landmark        },
  { id: "budgeting",  label: "Budgeting",       icon: BarChart3       },
  { id: "islamic",    label: "Islamic Funds",   icon: Shield          },
  { id: "reports",    label: "Reports",         icon: FileText        },
  { id: "audit",      label: "Audit",           icon: CheckSquare     },
];

// ─── DATA ─────────────────────────────────────────────────────────────────────
// TODO: fetch chart data from API when finance dashboard backend is available
const revExpData: any[] = [];
const campusProfitData: any[] = [];
const feeCollectionData: any[] = [];
const donorData: any[] = [];

const PIE_COLORS = ["#0C447C", "#EF9F27", "#ef4444"];

// TODO: fetch transactions from API
const transactions: any[] = [];



type BankAccount = { bank: string; title: string; number: string; iban: string; branch: string; campus: string; balance: number; type: string; status: string };

// TODO: fetch budget items from API
const budgetItems: any[] = [];

type IslamicTxn = { id: string; date: string; donor: string; type: string; amount: number; utilization: string; status: string };
// TODO: fetch Islamic donations from API
const INITIAL_ISLAMIC_TXN: IslamicTxn[] = [];

type AuditEntry = { id: number; time: string; user: string; action: string; module: string; description: string; ip: string };
// TODO: fetch audit logs from API
const AUDIT_LOGS: AuditEntry[] = [];


// ─── CHART OF ACCOUNTS DATA ───────────────────────────────────────────────────
type CoAEntry = { code: string; name: string; type: string; parent: string; balance: number; status: string };

const ACCOUNT_TYPES = ["Asset", "Liability", "Income", "Expense", "Equity"];
const CURRENCIES    = ["PKR", "USD", "GBP", "SAR", "AED"];

// ─── COST CENTERS DATA ────────────────────────────────────────────────────────
type CostCenter = { code: string; name: string; dept: string; campus: string; allocated: number; spent: number };
// TODO: fetch cost centers from API
const INITIAL_COST_CENTERS: CostCenter[] = [];

const DEPARTMENTS = ["Academics", "Administration", "Transport", "IT", "Islamic Edu.", "Marketing", "HR", "Finance", "Sports"];
const CAMPUSES    = ["All Campuses", "Main Campus – Karachi", "North Branch – Lahore", "East Campus – Islamabad"];

// ─── INVOICE DATA ─────────────────────────────────────────────────────────────
type Invoice = { id: string; vendor: string; campus: string; amount: number; due: string; status: string; category?: string };

// ─── SHARED PRIMITIVES ────────────────────────────────────────────────────────
type BV = "green" | "amber" | "red" | "blue" | "purple" | "gray" | "navy";
const BADGE: Record<BV, string> = {
  green:  "bg-emerald-50 text-emerald-700 border-emerald-200",
  amber:  "bg-amber-50 text-amber-700 border-amber-200",
  red:    "bg-red-50 text-red-700 border-red-200",
  blue:   "bg-blue-50 text-blue-700 border-blue-200",
  purple: "bg-purple-50 text-purple-700 border-purple-200",
  gray:   "bg-slate-100 text-slate-600 border-slate-200",
  navy:   "bg-[#0C447C] text-white border-[#0C447C]",
};

function Badge({ v, children }: { v: BV; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${BADGE[v]}`}>
      {children}
    </span>
  );
}

function statusBadge(status: string): BV {
  const map: Record<string, BV> = {
    Posted: "green", Paid: "green", Active: "green", Allocated: "green", Compliant: "green", Success: "green",
    Pending: "amber", Partial: "amber", Unallocated: "amber", Warning: "amber",
    Overdue: "red", Due: "red", "High Risk": "red",
    Credit: "blue", Current: "blue",
    Debit: "purple", Zakat: "purple",
  };
  return map[status] ?? "gray";
}

function Btn({ children, variant = "secondary", size = "sm", onClick }: {
  children: React.ReactNode; variant?: "primary" | "secondary" | "danger" | "success";
  size?: "sm" | "md"; onClick?: () => void;
}) {
  const v = {
    primary:   "bg-[#0C447C] text-white hover:bg-[#0b3d6e] border-[#0C447C]",
    secondary: "bg-white text-slate-700 hover:bg-slate-50 border-slate-200",
    danger:    "bg-red-600 text-white hover:bg-red-700 border-red-600",
    success:   "bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-600",
  };
  const s = size === "md" ? "px-4 py-2 text-sm" : "px-3 py-1.5 text-xs";
  return (
    <button onClick={onClick} className={`${v[variant]} ${s} border rounded-lg font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap`}>
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
        <p className="font-semibold text-slate-800 text-sm">{title}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

function KPI({ label, value, sub, trend, color = "#0C447C", icon: Icon }: {
  label: string; value: string; sub?: string; trend?: number;
  color?: string; icon: LucideIcon;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: color + "18" }}>
          <Icon size={18} style={{ color }} />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-semibold ${trend >= 0 ? "text-emerald-600" : "text-red-500"}`}>
            {trend >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="text-xl font-bold text-slate-800">{value}</div>
      <div className="text-xs text-slate-500 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
    </div>
  );
}

function ProgBar({ pct, color = "#0C447C" }: { pct: number; color?: string }) {
  const capped = Math.min(pct, 100);
  return (
    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all" style={{ width: `${capped}%`, background: color }} />
    </div>
  );
}

function TableWrap({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-100">
            {headers.map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">{children}</tbody>
      </table>
    </div>
  );
}

// ─── SEARCH BAR ───────────────────────────────────────────────────────────────
function SearchBar({ placeholder = "Search…", value, onChange }: { placeholder?: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="pl-9 pr-4 py-1.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0C447C] w-56"
      />
    </div>
  );
}

// ─── MODAL & FORM PRIMITIVES ─────────────────────────────────────────────────
function Modal({ title, size = "md", onClose, children }: {
  title: string; size?: "md" | "lg"; onClose: () => void; children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${size === "lg" ? "max-w-2xl" : "max-w-lg"} max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <h2 className="text-base font-bold text-slate-800">{title}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-5 overflow-y-auto space-y-4">{children}</div>
      </div>
    </div>
  );
}

function FField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const fInputCls = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0C447C] focus:border-transparent";

function FInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={fInputCls} />;
}

function FSelect({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) {
  return <select {...props} className={fInputCls + " bg-white cursor-pointer"}>{children}</select>;
}

function FTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={fInputCls + " resize-none"} rows={(props as { rows?: number }).rows ?? 3} />;
}

function ModalFooter({ onCancel, onSave, saveLabel = "Save" }: { onCancel: () => void; onSave: () => void; saveLabel?: string }) {
  return (
    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
      <Btn variant="secondary" size="md" onClick={onCancel}>Cancel</Btn>
      <Btn variant="primary"   size="md" onClick={onSave}>{saveLabel}</Btn>
    </div>
  );
}

// ─── TAB: DASHBOARD ───────────────────────────────────────────────────────────
function DashboardTab() {
  const { data: stats } = useQuery({ queryKey: ["finance-dashboard"], queryFn: financeService.getDashboard });
  const fmt = (n?: number) => {
    if (!n) return "₨ 0";
    if (n >= 1_000_000) return `₨ ${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `₨ ${(n / 1_000).toFixed(0)}K`;
    return `₨ ${n.toLocaleString()}`;
  };
  const collectionRate = stats?.totalInvoiced ? Math.round((stats.totalCollected / stats.totalInvoiced) * 100) : 0;
  return (
    <div className="space-y-5">
      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: "Create Voucher",   color: "bg-blue-50 text-blue-700 hover:bg-blue-100"     },
          { label: "Collect Fee",      color: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" },
          { label: "Add Expense",      color: "bg-red-50 text-red-700 hover:bg-red-100"         },
          { label: "Add Donor",        color: "bg-purple-50 text-purple-700 hover:bg-purple-100" },
          { label: "Create Budget",    color: "bg-[#EF9F27]/10 text-amber-700 hover:bg-amber-100" },
          { label: "Reconcile Bank",   color: "bg-teal-50 text-teal-700 hover:bg-teal-100"     },
          { label: "Generate Report",  color: "bg-slate-100 text-slate-700 hover:bg-slate-200" },
        ].map(a => (
          <button key={a.label} className={`${a.color} px-4 py-2 text-xs font-semibold rounded-lg transition-colors`}>
            {a.label}
          </button>
        ))}
      </div>

      {/* KPI Row 1 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPI icon={TrendingUp}   label="Total Invoiced"      value={fmt(stats?.totalInvoiced)}        sub="All invoices raised"     color="#0C447C"  />
        <KPI icon={TrendingDown} label="Total Expenses"      value={fmt(stats?.totalExpenses)}        sub="Excl. rejected"          color="#ef4444"  />
        <KPI icon={Star}         label="Net Collected"       value={fmt(stats?.totalCollected)}       sub="Payments received"       color="#10b981"  />
        <KPI icon={CheckCircle}  label="Fee Collection Rate" value={`${collectionRate}%`}             sub={`${stats?.overdueCount ?? 0} overdue`} color="#EF9F27" />
      </div>

      {/* KPI Row 2 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPI icon={Clock}         label="Outstanding Receivables" value={fmt(stats?.outstanding)}           sub={`${stats?.overdueCount ?? 0} students overdue`} color="#EF9F27" />
        <KPI icon={AlertTriangle} label="Pending Expenses"        value={fmt(stats?.totalPendingExpenses)}  sub={`${stats?.pendingExpenses ?? 0} awaiting approval`} color="#ef4444" />
        <KPI icon={Landmark}      label="Cash in Bank"            value="₨ 0" sub="Live data coming soon"  color="#0C447C" />
        <KPI icon={Wallet}        label="Cash in Hand / Petty"    value="₨ 0" sub="Live data coming soon"  color="#8b5cf6" />
      </div>

      {/* Islamic Fund KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Zakat Fund",       value: "₨ 0", sub: "Live data coming soon", border: "#7c3aed" },
          { label: "Sadaqah Fund",     value: "₨ 0", sub: "Live data coming soon", border: "#0891b2" },
          { label: "Waqf Corpus",      value: "₨ 0", sub: "Live data coming soon", border: "#047857" },
          { label: "Scholarship Used", value: "₨ 0", sub: "Live data coming soon", border: "#EF9F27" },
        ].map(f => (
          <div key={f.label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4" style={{ borderLeft: `3px solid ${f.border}` }}>
            <div className="text-xl font-bold text-slate-800">{f.value}</div>
            <div className="text-xs font-medium text-slate-600 mt-0.5">{f.label}</div>
            <div className="text-xs text-slate-400 mt-1">{f.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Revenue vs Expenses — Monthly Trend" sub="April 2024 to April 2025" />
          <div className="p-4">
            <div className="flex gap-4 mb-3">
              {[["Revenue", "#0C447C"], ["Expenses", "#ef4444"]].map(([name, color]) => (
                <div key={name} className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span className="w-3 h-2 rounded inline-block" style={{ background: color as string }}></span>{name}
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={revExpData}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0C447C" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#0C447C" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => `${v}M`} />
                <Tooltip formatter={(v: any, n?: any) => [`₨ ${v ?? 0}M`, n === "revenue" ? "Revenue" : "Expenses"]} contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12 }} />
                <Area type="monotone" dataKey="revenue" stroke="#0C447C" strokeWidth={2} fill="url(#revGrad)" dot={false} />
                <Area type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} fill="none" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="Campus-wise Profitability" sub="Current FY · Net surplus per campus" />
          <div className="p-4">
            <div className="flex gap-4 mb-3">
              {[["Revenue", "#0C447C"], ["Surplus", "#10b981"]].map(([name, color]) => (
                <div key={name} className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span className="w-3 h-2 rounded inline-block" style={{ background: color as string }}></span>{name}
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={campusProfitData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="campus" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => `${v}M`} />
                <Tooltip formatter={(v: any, n?: any) => [`₨ ${v ?? 0}M`, n === "revenue" ? "Revenue" : "Surplus"]} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                <Bar dataKey="revenue" fill="#0C447C" radius={[4, 4, 0, 0]} />
                <Bar dataKey="surplus" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader title="Fee Collection Status" sub="April 2025" />
          <div className="p-4">
            <ResponsiveContainer width="100%" height={170}>
              <PieChart>
                <Pie data={feeCollectionData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                  {feeCollectionData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                </Pie>
                <Tooltip formatter={(v: any) => [`${v ?? 0}%`]} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-1 mt-1">
              {feeCollectionData.map((d, i) => (
                <div key={d.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: PIE_COLORS[i] }}></span>
                    <span className="text-slate-600">{d.name}</span>
                  </div>
                  <span className="font-semibold text-slate-700">{d.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Budget Utilization" sub="Dept-wise · FY 2024–25" />
          <div className="p-4 space-y-3">
            {budgetItems.slice(0, 5).map(b => (
              <div key={b.dept}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600">{b.dept}</span>
                  <span className={`font-semibold ${b.pct > 100 ? "text-red-600" : b.pct > 85 ? "text-amber-600" : "text-slate-700"}`}>{b.pct}%</span>
                </div>
                <ProgBar pct={b.pct} color={b.pct > 100 ? "#ef4444" : b.pct > 85 ? "#EF9F27" : "#0C447C"} />
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Donor Contributions" sub="Last 6 months · by Fund" />
          <div className="p-4">
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={donorData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                <Bar dataKey="zakat" stackId="a" fill="#7c3aed" radius={[0, 0, 0, 0]} />
                <Bar dataKey="sadaqah" stackId="a" fill="#0891b2" radius={[0, 0, 0, 0]} />
                <Bar dataKey="general" stackId="a" fill="#EF9F27" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader
          title="Recent Transactions"
          sub="Last 7 entries"
          actions={
            <>
              <Btn variant="secondary"><Download size={12} /> Export</Btn>
              <Btn variant="primary"><Plus size={12} /> New Transaction</Btn>
            </>
          }
        />
        <TableWrap headers={["Voucher #", "Date", "Description", "Category", "Campus", "Fund", "Amount (PKR)", "Type", "Status", "Action"]}>
          {transactions.map(t => (
            <tr key={t.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-4 py-3 font-mono text-xs text-[#0C447C] font-bold">{t.id}</td>
              <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{t.date}</td>
              <td className="px-4 py-3 text-slate-700 font-medium text-xs">{t.desc}</td>
              <td className="px-4 py-3"><Badge v={statusBadge(t.cat)}>{t.cat}</Badge></td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">{t.campus}</span>
              </td>
              <td className="px-4 py-3">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${t.fund === "Zakat" ? "bg-purple-50 text-purple-700" : t.fund === "Sadaqah" ? "bg-cyan-50 text-cyan-700" : "bg-slate-100 text-slate-600"}`}>{t.fund}</span>
              </td>
              <td className={`px-4 py-3 font-mono font-bold text-sm ${t.amount > 0 ? "text-emerald-600" : "text-red-600"}`}>
                {t.amount > 0 ? "+" : "−"} {Math.abs(t.amount).toLocaleString()}
              </td>
              <td className="px-4 py-3"><Badge v={t.type === "Credit" ? "green" : "red"}>{t.type}</Badge></td>
              <td className="px-4 py-3"><Badge v={statusBadge(t.status)}>{t.status}</Badge></td>
              <td className="px-4 py-3">
                <button className="p-1.5 text-slate-400 hover:text-[#0C447C] hover:bg-blue-50 rounded-lg"><Eye size={14} /></button>
              </td>
            </tr>
          ))}
        </TableWrap>
        <div className="px-4 py-3 border-t border-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-400">Showing 7 of 1,248 transactions</span>
          <div className="flex items-center gap-1">
            {[1, 2, 3, "...", 52].map((p, i) => (
              <button key={i} className={`w-7 h-7 rounded text-xs ${p === 1 ? "bg-[#0C447C] text-white" : "hover:bg-slate-100 text-slate-600"}`}>{p}</button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─── TAB: FEE & REVENUE ───────────────────────────────────────────────────────
type FeeForm = { head: string; grade: string; amount: string; freq: string; dueDate: string; lateFee: string; taxApplicable: boolean; effectiveFrom: string; campus: string; status: string };
type AcctForm = { code: string; name: string; type: string; parent: string; description: string; openingBalance: string; currency: string; status: string };

const BLANK_FEE: FeeForm = { head: "", grade: "", amount: "", freq: "Monthly", dueDate: "", lateFee: "", taxApplicable: false, effectiveFrom: "", campus: "", status: "Active" };
const BLANK_ACCT: AcctForm = { code: "", name: "", type: "", parent: "", description: "", openingBalance: "", currency: "PKR", status: "Active" };

function FeeRevenueTab() {
  const [search, setSearch]           = useState("");
  const [acctSearch, setAcctSearch]   = useState("");
  const [showFeeModal, setShowFeeModal]   = useState(false);
  const [showAcctModal, setShowAcctModal] = useState(false);
  const [editAcct, setEditAcct]       = useState<any | null>(null);
  const [feeForm, setFeeForm]         = useState<FeeForm>(BLANK_FEE);
  const [acctForm, setAcctForm]       = useState<AcctForm>(BLANK_ACCT);

  const queryClient = useQueryClient();
  const { data: feeHeads = [], isLoading: feeHeadsLoading } = useQuery({ queryKey: ["fee-heads"], queryFn: financeService.getFeeHeads });
  const createFeeHeadMutation = useMutation({
    mutationFn: financeService.createFeeHead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fee-heads"] });
      toast.success("Fee head created");
      setShowFeeModal(false);
      setFeeForm(BLANK_FEE);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed"),
  });

  const { data: coaAccounts = [], isLoading: coaLoading } = useQuery({ queryKey: ["coa"], queryFn: financeService.getCOA });
  const addAccount = useMutation({
    mutationFn: financeService.createCOAAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coa"] });
      toast.success("Account created");
      setShowAcctModal(false);
      setAcctForm(BLANK_ACCT);
      setEditAcct(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to create account"),
  });
  const applyStandard = useMutation({
    mutationFn: (withCodes: boolean) => financeService.applyStandardCOA(withCodes),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["coa"] });
      toast.success(res.message);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed"),
  });

  const filteredFee = (feeHeads as any[]).filter(h => h.name.toLowerCase().includes(search.toLowerCase()));
  const filteredAccts = (coaAccounts as any[]).filter(a =>
    a.name.toLowerCase().includes(acctSearch.toLowerCase()) ||
    a.code.toLowerCase().includes(acctSearch.toLowerCase())
  );

  function openAddAcct() {
    setAcctForm(BLANK_ACCT);
    setEditAcct(null);
    setShowAcctModal(true);
  }
  function openEditAcct(a: any) {
    setAcctForm({ code: a.code, name: a.name, type: a.type ? a.type.charAt(0).toUpperCase() + a.type.slice(1) : "", parent: a.parentCode || "", description: "", openingBalance: String(a.balance || 0), currency: a.currency || "PKR", status: a.isActive ? "Active" : "Inactive" });
    setEditAcct(a);
    setShowAcctModal(true);
  }
  function deleteAcct(id: string) {
    financeService.deleteCOAAccount(id)
      .then(() => { queryClient.invalidateQueries({ queryKey: ["coa"] }); toast.success("Account deactivated"); })
      .catch((err: any) => toast.error(err.response?.data?.message || "Failed to delete"));
  }
  function saveAcct() {
    if (!acctForm.code || !acctForm.name || !acctForm.type) return;
    if (editAcct) {
      financeService.updateCOAAccount(editAcct._id, {
        name: acctForm.name,
        type: acctForm.type.toLowerCase(),
        parentCode: acctForm.parent || null,
        balance: Number(acctForm.openingBalance) || 0,
        isActive: acctForm.status === "Active",
      }).then(() => {
        queryClient.invalidateQueries({ queryKey: ["coa"] });
        toast.success("Account updated");
        setShowAcctModal(false);
        setEditAcct(null);
      }).catch((err: any) => toast.error(err.response?.data?.message || "Failed to update"));
    } else {
      addAccount.mutate({
        code: acctForm.code,
        name: acctForm.name,
        type: acctForm.type.toLowerCase(),
        parentCode: acctForm.parent || null,
        balance: Number(acctForm.openingBalance) || 0,
        currency: acctForm.currency,
        isActive: acctForm.status === "Active",
      });
    }
  }
  function saveFeeStructure() {
    if (!feeForm.head) { toast.error("Fee head name is required"); return; }
    const code = (feeForm.grade || feeForm.head).replace(/[^A-Z0-9]/gi, "-").toUpperCase().slice(0, 10) || `FH-${Date.now()}`;
    createFeeHeadMutation.mutate({
      name: feeForm.head,
      code,
      category: "tuition",
      isTaxable: feeForm.taxApplicable,
      isActive: feeForm.status === "Active",
    });
  }

  const typeColor: Record<string, string> = {
    Asset: "bg-blue-50 text-blue-700",     asset: "bg-blue-50 text-blue-700",
    Liability: "bg-red-50 text-red-700",   liability: "bg-red-50 text-red-700",
    Income: "bg-emerald-50 text-emerald-700", income: "bg-emerald-50 text-emerald-700",
    Expense: "bg-amber-50 text-amber-700", expense: "bg-amber-50 text-amber-700",
    Equity: "bg-purple-50 text-purple-700", equity: "bg-purple-50 text-purple-700",
  };
  const coaAlreadyApplied = (coaAccounts as any[]).length > 0;
  const applyTip = coaAlreadyApplied ? "COA already applied. Delete all accounts to reapply." : undefined;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPI icon={TrendingUp}    label="Monthly Fee Billed"          value="₨ 32.4M"  sub="Apr 2025"      trend={5.2} color="#0C447C" />
        <KPI icon={CheckCircle}   label="Fees Collected"              value="₨ 28.3M"  sub="87.3% rate"    trend={3.1} color="#10b981" />
        <KPI icon={AlertTriangle} label="Outstanding Fees"            value="₨ 4.1M"   sub="342 students"              color="#EF9F27" />
        <KPI icon={XCircle}       label="Fee Waivers (Scholarships)"  value="₨ 1.85M"  sub="74 students"               color="#7c3aed" />
      </div>

      {/* Fee Structure */}
      <Card>
        <CardHeader
          title="Fee Structure by Class"
          sub="FY 2024–25 · All Campuses"
          actions={
            <>
              <SearchBar placeholder="Search class..." value={search} onChange={setSearch} />
              <Btn variant="secondary"><Printer size={12} /> Print</Btn>
              <Btn variant="primary" onClick={() => setShowFeeModal(true)}><Plus size={12} /> Add Fee Structure</Btn>
            </>
          }
        />
        <TableWrap headers={["Fee Head Name", "Category", "Code", "GL Account", "Tax", "Status", "Action"]}>
          {feeHeadsLoading ? (
            <tr><td colSpan={7} className="px-4 py-12 text-center"><div className="w-6 h-6 border-4 border-[#0C447C] border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
          ) : filteredFee.length === 0 ? (
            <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-400">{(feeHeads as any[]).length === 0 ? "No fee heads yet. Click + Add Fee Head to create one." : "No results match your search."}</td></tr>
          ) : filteredFee.map((h: any) => (
            <tr key={h._id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-semibold text-slate-800">{h.name}</td>
              <td className="px-4 py-3 text-xs text-slate-600">{h.category}</td>
              <td className="px-4 py-3 font-mono text-xs text-[#0C447C] font-bold">{h.code}</td>
              <td className="px-4 py-3 font-mono text-xs text-slate-500">{h.glAccountCode || "—"}</td>
              <td className="px-4 py-3 text-xs text-slate-600">{h.isTaxable ? `${h.taxRate}%` : "No"}</td>
              <td className="px-4 py-3"><Badge v={h.isActive ? "green" : "gray"}>{h.isActive ? "Active" : "Inactive"}</Badge></td>
              <td className="px-4 py-3">
                <div className="flex gap-1">
                  <button className="p-1.5 text-slate-400 hover:text-[#0C447C] hover:bg-blue-50 rounded-lg" title="Edit"><Edit size={13} /></button>
                </div>
              </td>
            </tr>
          ))}
        </TableWrap>
      </Card>

      {/* Chart of Accounts */}
      <Card>
        <CardHeader
          title="Chart of Accounts"
          sub="General Ledger structure"
          actions={
            <>
              <SearchBar placeholder="Search account…" value={acctSearch} onChange={setAcctSearch} />
              <div title={applyTip}>
                <button
                  onClick={() => applyStandard.mutate(true)}
                  disabled={applyStandard.isPending || coaAlreadyApplied}
                  className={`px-3 py-1.5 text-xs border rounded-lg font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${coaAlreadyApplied ? "opacity-40 cursor-not-allowed bg-white text-slate-400 border-slate-200" : "bg-white text-slate-700 hover:bg-slate-50 border-slate-200"}`}
                >
                  <Plus size={12} /> Standard COA (with codes)
                </button>
              </div>
              <div title={applyTip}>
                <button
                  onClick={() => applyStandard.mutate(false)}
                  disabled={applyStandard.isPending || coaAlreadyApplied}
                  className={`px-3 py-1.5 text-xs border rounded-lg font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${coaAlreadyApplied ? "opacity-40 cursor-not-allowed bg-white text-slate-400 border-slate-200" : "bg-white text-slate-700 hover:bg-slate-50 border-slate-200"}`}
                >
                  <Plus size={12} /> Standard COA (no codes)
                </button>
              </div>
              <Btn variant="primary" onClick={openAddAcct}><Plus size={12} /> Add Account</Btn>
            </>
          }
        />
        <TableWrap headers={["Account Code", "Account Name", "Type", "Parent Account", "Balance (₨)", "Status", "Actions"]}>
          {coaLoading ? (
            <tr><td colSpan={7} className="px-4 py-12 text-center"><div className="w-6 h-6 border-4 border-[#0C447C] border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
          ) : filteredAccts.length === 0 ? (
            <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">{coaAlreadyApplied ? "No results match your search." : "No accounts yet. Click 'Standard COA' to seed or 'Add Account' to create manually."}</td></tr>
          ) : filteredAccts.map((a: any) => (
            <tr key={a._id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-mono text-xs font-bold text-[#0C447C]">{a.code}</td>
              <td className="px-4 py-3 font-semibold text-slate-800">{a.name}</td>
              <td className="px-4 py-3">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${typeColor[a.type] ?? "bg-slate-100 text-slate-600"}`}>{a.type}</span>
              </td>
              <td className="px-4 py-3 font-mono text-xs text-slate-500">{a.parentCode || "—"}</td>
              <td className="px-4 py-3 font-mono text-slate-800 font-semibold">{(a.balance || 0).toLocaleString()}</td>
              <td className="px-4 py-3"><Badge v={a.isActive ? "green" : "gray"}>{a.isActive ? "Active" : "Inactive"}</Badge></td>
              <td className="px-4 py-3">
                <div className="flex gap-1">
                  <button onClick={() => openEditAcct(a)} className="p-1.5 text-slate-400 hover:text-[#0C447C] hover:bg-blue-50 rounded-lg" title="Edit"><Edit size={13} /></button>
                  <button onClick={() => deleteAcct(a._id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Delete"><Trash2 size={13} /></button>
                </div>
              </td>
            </tr>
          ))}
        </TableWrap>
        <div className="px-4 py-3 border-t border-slate-50 text-xs text-slate-400">
          {filteredAccts.length} account{filteredAccts.length !== 1 ? "s" : ""}
        </div>
      </Card>

      {/* ── Add Fee Structure Modal ── */}
      {showFeeModal && (
        <Modal title="Add Fee Structure" size="lg" onClose={() => setShowFeeModal(false)}>
          <div className="grid grid-cols-2 gap-4">
            <FField label="Fee Head" required>
              <FInput placeholder="e.g. Monthly Tuition Fee" value={feeForm.head} onChange={e => setFeeForm(f => ({ ...f, head: e.target.value }))} />
            </FField>
            <FField label="Grade / Class" required>
              <FSelect value={feeForm.grade} onChange={e => setFeeForm(f => ({ ...f, grade: e.target.value }))}>
                <option value="">Select grade…</option>
                {["Nursery – KG", "Class 1 – 5", "Class 6 – 8", "Class 9 – 10", "Hifz Program", "O-Levels"].map(g => (
                  <option key={g}>{g}</option>
                ))}
              </FSelect>
            </FField>
            <FField label="Amount (₨)" required>
              <FInput type="number" placeholder="0" value={feeForm.amount} onChange={e => setFeeForm(f => ({ ...f, amount: e.target.value }))} />
            </FField>
            <FField label="Frequency">
              <FSelect value={feeForm.freq} onChange={e => setFeeForm(f => ({ ...f, freq: e.target.value }))}>
                {["Monthly", "Quarterly", "Annual", "One-time"].map(o => <option key={o}>{o}</option>)}
              </FSelect>
            </FField>
            <FField label="Due Date (day of month)">
              <FInput type="number" min={1} max={31} placeholder="e.g. 10" value={feeForm.dueDate} onChange={e => setFeeForm(f => ({ ...f, dueDate: e.target.value }))} />
            </FField>
            <FField label="Late Fee (₨)">
              <FInput type="number" placeholder="0" value={feeForm.lateFee} onChange={e => setFeeForm(f => ({ ...f, lateFee: e.target.value }))} />
            </FField>
            <FField label="Effective From">
              <FInput type="date" value={feeForm.effectiveFrom} onChange={e => setFeeForm(f => ({ ...f, effectiveFrom: e.target.value }))} />
            </FField>
            <FField label="Campus">
              <FSelect value={feeForm.campus} onChange={e => setFeeForm(f => ({ ...f, campus: e.target.value }))}>
                <option value="">All Campuses</option>
                {CAMPUSES.map(c => <option key={c}>{c}</option>)}
              </FSelect>
            </FField>
            <div className="col-span-2 flex items-center gap-3">
              <label className="text-xs font-semibold text-slate-600">Tax Applicable</label>
              <button
                onClick={() => setFeeForm(f => ({ ...f, taxApplicable: !f.taxApplicable }))}
                className={`relative w-10 h-5 rounded-full transition-colors ${feeForm.taxApplicable ? "bg-[#0C447C]" : "bg-slate-200"}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${feeForm.taxApplicable ? "translate-x-5" : ""}`} />
              </button>
              <span className="text-xs text-slate-500">{feeForm.taxApplicable ? "Yes" : "No"}</span>
            </div>
            <FField label="Status">
              <FSelect value={feeForm.status} onChange={e => setFeeForm(f => ({ ...f, status: e.target.value }))}>
                <option>Active</option><option>Inactive</option>
              </FSelect>
            </FField>
          </div>
          <ModalFooter onCancel={() => setShowFeeModal(false)} onSave={saveFeeStructure} saveLabel="Add Fee Structure" />
        </Modal>
      )}

      {/* ── Add / Edit Account Modal ── */}
      {showAcctModal && (
        <Modal title={editAcct ? "Edit Account" : "Add Account"} size="lg" onClose={() => setShowAcctModal(false)}>
          <div className="grid grid-cols-2 gap-4">
            <FField label="Account Code" required>
              <FInput placeholder="e.g. 4300" value={acctForm.code} onChange={e => setAcctForm(f => ({ ...f, code: e.target.value }))} />
            </FField>
            <FField label="Account Name" required>
              <FInput placeholder="e.g. Exam Fee Revenue" value={acctForm.name} onChange={e => setAcctForm(f => ({ ...f, name: e.target.value }))} />
            </FField>
            <FField label="Account Type" required>
              <FSelect value={acctForm.type} onChange={e => setAcctForm(f => ({ ...f, type: e.target.value }))}>
                <option value="">Select type…</option>
                {ACCOUNT_TYPES.map(t => <option key={t}>{t}</option>)}
              </FSelect>
            </FField>
            <FField label="Parent Account">
              <FSelect value={acctForm.parent} onChange={e => setAcctForm(f => ({ ...f, parent: e.target.value }))}>
                <option value="">— None (root account) —</option>
                {(coaAccounts as any[]).filter((a: any) => a.code !== acctForm.code).map((a: any) => (
                  <option key={a.code} value={a.code}>{a.code} – {a.name}</option>
                ))}
              </FSelect>
            </FField>
            <FField label="Opening Balance (₨)">
              <FInput type="number" placeholder="0" value={acctForm.openingBalance} onChange={e => setAcctForm(f => ({ ...f, openingBalance: e.target.value }))} />
            </FField>
            <FField label="Currency">
              <FSelect value={acctForm.currency} onChange={e => setAcctForm(f => ({ ...f, currency: e.target.value }))}>
                {CURRENCIES.map(c => <option key={c}>{c}</option>)}
              </FSelect>
            </FField>
            <div className="col-span-2">
              <FField label="Description">
                <FTextarea placeholder="Optional description…" value={acctForm.description} onChange={e => setAcctForm(f => ({ ...f, description: e.target.value }))} />
              </FField>
            </div>
            <FField label="Status">
              <FSelect value={acctForm.status} onChange={e => setAcctForm(f => ({ ...f, status: e.target.value }))}>
                <option>Active</option><option>Inactive</option>
              </FSelect>
            </FField>
          </div>
          <ModalFooter onCancel={() => setShowAcctModal(false)} onSave={saveAcct} saveLabel={editAcct ? "Update Account" : "Add Account"} />
        </Modal>
      )}
    </div>
  );
}

// ─── TAB: ACCOUNTS RECEIVABLE ─────────────────────────────────────────────────
function ReceivableTab() {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();
  const { data: invoices = [], isLoading: invLoading } = useQuery({ queryKey: ["invoices"], queryFn: () => financeService.getInvoices() });
  const createInvoiceMutation = useMutation({
    mutationFn: financeService.createInvoice,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["invoices"] }); toast.success("Invoice created"); },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed"),
  });
  const filtered = (invoices as any[]).filter(inv =>
    (inv.studentName || "").toLowerCase().includes(search.toLowerCase()) ||
    (inv.gradeLevelName || "").toLowerCase().includes(search.toLowerCase()) ||
    (inv.invoiceNo || "").toLowerCase().includes(search.toLowerCase())
  );
  function invStatusVariant(s: string): BV {
    const m: Record<string,BV> = { paid: "green", partially_paid: "amber", overdue: "red", issued: "blue", draft: "gray", cancelled: "gray" };
    return m[s] ?? "gray";
  }
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPI icon={Clock} label="Total Receivable"   value="₨ 8.45M" color="#0C447C" />
        <KPI icon={CheckCircle} label="Current Due"  value="₨ 3.22M" sub="On time"   color="#10b981" />
        <KPI icon={AlertTriangle} label="30–60 Days" value="₨ 4.02M" sub="214 students" color="#EF9F27" />
        <KPI icon={XCircle} label="90+ Days Overdue" value="₨ 1.21M" sub="High risk"   color="#ef4444" />
      </div>
      <Card>
        <CardHeader
          title="Student Fee Ledger"
          sub="All campuses · April 2025"
          actions={
            <>
              <SearchBar placeholder="Search student…" value={search} onChange={setSearch} />
              <Btn variant="secondary"><Send size={12} /> Bulk Reminders</Btn>
              <Btn variant="primary"><Download size={12} /> Export</Btn>
            </>
          }
        />
        <TableWrap headers={["Invoice #", "Student", "Grade", "Total Due", "Paid", "Balance", "Due Date", "Status", "Actions"]}>
          {invLoading ? (
            <tr><td colSpan={9} className="px-4 py-12 text-center"><div className="w-6 h-6 border-4 border-[#0C447C] border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
          ) : filtered.length === 0 ? (
            <tr><td colSpan={9} className="px-4 py-12 text-center text-sm text-slate-400">{(invoices as any[]).length === 0 ? "No invoices yet." : "No results match your search."}</td></tr>
          ) : filtered.map((inv: any) => (
            <tr key={inv._id} className={`hover:bg-slate-50 ${inv.status === "overdue" ? "bg-red-50/30" : ""}`}>
              <td className="px-4 py-3 font-mono text-xs text-[#0C447C] font-bold">{inv.invoiceNo}</td>
              <td className="px-4 py-3 font-semibold text-slate-800">{inv.studentName || "—"}</td>
              <td className="px-4 py-3 text-slate-600 text-xs">{inv.gradeLevelName || "—"}</td>
              <td className="px-4 py-3 font-mono text-slate-700">{(inv.totalAmount || 0).toLocaleString()}</td>
              <td className="px-4 py-3 font-mono text-emerald-600 font-semibold">{(inv.paidAmount || 0).toLocaleString()}</td>
              <td className={`px-4 py-3 font-mono font-bold ${inv.balanceAmount === 0 ? "text-emerald-600" : inv.status === "overdue" ? "text-red-600" : "text-amber-600"}`}>
                {(inv.balanceAmount || 0).toLocaleString()}
              </td>
              <td className="px-4 py-3 text-xs text-slate-500">{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "—"}</td>
              <td className="px-4 py-3"><Badge v={invStatusVariant(inv.status)}>{inv.status}</Badge></td>
              <td className="px-4 py-3">
                <div className="flex gap-1">
                  <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Eye size={13} /></button>
                  <button className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg"><Send size={13} /></button>
                </div>
              </td>
            </tr>
          ))}
        </TableWrap>
        <div className="px-4 py-3 border-t border-slate-50 text-xs text-slate-400">
          Showing {filtered.length} of {(invoices as any[]).length} invoices
        </div>
      </Card>
    </div>
  );
}

// ─── TAB: ACCOUNTS PAYABLE ────────────────────────────────────────────────────
type InvForm = { id: string; vendor: string; campus: string; amount: string; due: string; category: string; description: string; paymentTerms: string; status: string };
const BLANK_INV: InvForm = { id: "", vendor: "", campus: "", amount: "", due: "", category: "", description: "", paymentTerms: "Net 30", status: "Pending" };

function PayableTab() {
  const [search, setSearch]           = useState("");
  const [showModal, setShowModal]     = useState(false);
  const [form, setForm]               = useState<InvForm>(BLANK_INV);

  const queryClient = useQueryClient();
  const { data: expenses = [], isLoading: expLoading } = useQuery({ queryKey: ["expenses"], queryFn: financeService.getExpenses });
  const { data: payments = [] } = useQuery({ queryKey: ["payments"], queryFn: financeService.getPayments });
  const createExpenseMutation = useMutation({
    mutationFn: financeService.createExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast.success("Expense recorded");
      setShowModal(false);
      setForm(BLANK_INV);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed"),
  });
  const createPaymentMutation = useMutation({
    mutationFn: financeService.createPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments", "invoices"] });
      toast.success("Payment recorded");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed"),
  });

  const filtered = (expenses as any[]).filter(e =>
    (e.description || "").toLowerCase().includes(search.toLowerCase()) ||
    (e.expenseNo || "").toLowerCase().includes(search.toLowerCase()) ||
    (e.paidTo || "").toLowerCase().includes(search.toLowerCase())
  );

  function openAdd() { setForm(BLANK_INV); setShowModal(true); }
  function saveInv() {
    if (!form.vendor || !form.amount) { toast.error("Description and amount are required"); return; }
    createExpenseMutation.mutate({
      description: form.vendor,
      amount: Number(form.amount),
      expenseDate: form.due || new Date().toISOString().slice(0, 10),
      category: form.category || "miscellaneous",
      paidTo: form.vendor,
      status: "submitted",
    });
  }

  const invCategories = ["Stationery", "Services", "Utilities", "Furniture", "IT", "Salary", "Maintenance", "Transport", "Other"];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KPI icon={CreditCard}    label="Total Payables"      value="₨ 4.12M"  color="#0C447C" />
        <KPI icon={AlertTriangle} label="Due This Week"       value="₨ 1.82M"  color="#ef4444" />
        <KPI icon={Clock}         label="Overdue"             value="₨ 680K"   color="#EF9F27" />
        <KPI icon={Building2}     label="Vendor Outstanding"  value="₨ 2.40M"  color="#8b5cf6" />
        <KPI icon={Receipt}       label="Payroll Liabilities" value="₨ 1.72M"  color="#0891b2" />
      </div>
      <Card>
        <CardHeader
          title="Payable Invoices — Approval Queue"
          sub="Pending payment processing"
          actions={
            <>
              <SearchBar placeholder="Search vendor, invoice…" value={search} onChange={setSearch} />
              <Btn variant="primary" onClick={openAdd}><Plus size={12} /> Add Invoice</Btn>
            </>
          }
        />
        <TableWrap headers={["Expense #", "Description", "Paid To", "Category", "Amount (₨)", "Date", "Status", "Actions"]}>
          {expLoading ? (
            <tr><td colSpan={8} className="px-4 py-12 text-center"><div className="w-6 h-6 border-4 border-[#0C447C] border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
          ) : filtered.length === 0 ? (
            <tr><td colSpan={8} className="px-4 py-12 text-center text-sm text-slate-400">{(expenses as any[]).length === 0 ? "No expenses yet. Click + Add Invoice to record one." : "No results match your search."}</td></tr>
          ) : filtered.map((exp: any) => (
            <tr key={exp._id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-mono text-xs text-[#0C447C] font-bold">{exp.expenseNo}</td>
              <td className="px-4 py-3 font-semibold text-slate-800 max-w-xs truncate">{exp.description}</td>
              <td className="px-4 py-3 text-slate-600 text-xs">{exp.paidTo || "—"}</td>
              <td className="px-4 py-3 text-xs text-slate-500">{exp.category || "—"}</td>
              <td className="px-4 py-3 font-mono font-bold text-slate-800">{(exp.amount || 0).toLocaleString()}</td>
              <td className="px-4 py-3 text-xs text-slate-500">{exp.expenseDate ? new Date(exp.expenseDate).toLocaleDateString() : "—"}</td>
              <td className="px-4 py-3"><Badge v={exp.status === "approved" || exp.status === "posted" ? "green" : exp.status === "rejected" ? "red" : exp.status === "submitted" ? "amber" : "blue"}>{exp.status}</Badge></td>
              <td className="px-4 py-3">
                <div className="flex gap-1">
                  <button className="p-1.5 text-slate-400 hover:text-[#0C447C] hover:bg-blue-50 rounded-lg" title="Edit"><Edit size={13} /></button>
                  <button className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Approve"><CheckCircle size={13} /></button>
                  <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="View"><Eye size={13} /></button>
                </div>
              </td>
            </tr>
          ))}
        </TableWrap>
        <div className="px-4 py-3 border-t border-slate-50 text-xs text-slate-400">
          {filtered.length} expense{filtered.length !== 1 ? "s" : ""} · {(payments as any[]).length} payments recorded
        </div>
      </Card>

      {/* ── Add / Edit Invoice Modal ── */}
      {showModal && (
        <Modal title="Add Invoice" size="lg" onClose={() => setShowModal(false)}>
          <div className="grid grid-cols-2 gap-4">
            <FField label="Invoice Number">
              <FInput placeholder="e.g. INV-2025-0050" value={form.id} onChange={e => setForm(f => ({ ...f, id: e.target.value }))} />
            </FField>
            <FField label="Vendor Name" required>
              <FInput placeholder="Vendor / supplier name" value={form.vendor} onChange={e => setForm(f => ({ ...f, vendor: e.target.value }))} />
            </FField>
            <FField label="Campus">
              <FSelect value={form.campus} onChange={e => setForm(f => ({ ...f, campus: e.target.value }))}>
                <option value="">All Campuses</option>
                {CAMPUSES.map(c => <option key={c}>{c}</option>)}
                <option value="Fatima">Fatima Campus</option>
                <option value="Abu Ayub">Abu Ayub Campus</option>
                <option value="Brainy">Brainy Campus</option>
              </FSelect>
            </FField>
            <FField label="Category">
              <FSelect value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                <option value="">Select category…</option>
                {invCategories.map(c => <option key={c}>{c}</option>)}
              </FSelect>
            </FField>
            <FField label="Invoice Amount (₨)" required>
              <FInput type="number" placeholder="0" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
            </FField>
            <FField label="Due Date">
              <FInput type="date" value={form.due} onChange={e => setForm(f => ({ ...f, due: e.target.value }))} />
            </FField>
            <FField label="Payment Terms">
              <FSelect value={form.paymentTerms} onChange={e => setForm(f => ({ ...f, paymentTerms: e.target.value }))}>
                {["Net 7", "Net 15", "Net 30", "Net 60", "Immediate", "COD"].map(o => <option key={o}>{o}</option>)}
              </FSelect>
            </FField>
            <FField label="Status">
              <FSelect value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                {["Pending", "Due", "Overdue", "Paid"].map(o => <option key={o}>{o}</option>)}
              </FSelect>
            </FField>
            <div className="col-span-2">
              <FField label="Description / Narration">
                <FTextarea placeholder="Invoice description or notes…" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </FField>
            </div>
          </div>
          <ModalFooter onCancel={() => setShowModal(false)} onSave={saveInv} saveLabel={createExpenseMutation.isPending ? "Saving…" : "Add Expense"} />
        </Modal>
      )}
    </div>
  );
}

// ─── TAB: BANKING & TREASURY ──────────────────────────────────────────────────
type BankForm = { bank: string; title: string; number: string; iban: string; branch: string; type: string; balance: string; currency: string; campus: string; status: string };
const BLANK_BANK: BankForm = { bank: "", title: "", number: "", iban: "", branch: "", type: "Current", balance: "", currency: "PKR", campus: "", status: "Active" };
const BANK_CAMPUSES = ["Gulberg Campus", "DHA Campus", "Johar Town Campus", "All Campuses"];

function BankingTab() {
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankForm, setBankForm]       = useState<BankForm>(BLANK_BANK);
  const [bankErrors, setBankErrors]   = useState<Record<string, boolean>>({});

  const queryClient = useQueryClient();
  const { data: accounts = [], isLoading: bankLoading } = useQuery({
    queryKey: ["bank-accounts"],
    queryFn: financeService.getBankAccounts,
  });
  const createBankMutation = useMutation({
    mutationFn: financeService.createBankAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
      toast.success("Bank account added");
      setShowBankModal(false);
      setBankForm(BLANK_BANK);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed"),
  });

  function openAddBank() { setBankForm(BLANK_BANK); setBankErrors({}); setShowBankModal(true); }
  function saveBank() {
    const e: Record<string, boolean> = {};
    if (!bankForm.bank)   e.bank   = true;
    if (!bankForm.title)  e.title  = true;
    if (!bankForm.number) e.number = true;
    if (!bankForm.type)   e.type   = true;
    setBankErrors(e);
    if (Object.keys(e).length) return;
    createBankMutation.mutate({
      bankName: bankForm.bank,
      accountTitle: bankForm.title,
      accountNumber: bankForm.number,
      iban: bankForm.iban,
      branchName: bankForm.branch,
      accountType: bankForm.type.toLowerCase(),
      openingBalance: Number(bankForm.balance) || 0,
      isActive: bankForm.status === "Active",
    });
  }

  const errStyle = (key: string): React.CSSProperties =>
    bankErrors[key] ? { borderColor: "#ef4444", boxShadow: "0 0 0 1px #ef4444" } : {};

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <KPI icon={Landmark}  label="Total Cash in Bank" value="₨ 28.7M" trend={2.3} color="#0C447C" />
        <KPI icon={ArrowUp}   label="Inflow (April)"     value="₨ 42.8M" trend={8.4} color="#10b981" />
        <KPI icon={ArrowDown} label="Outflow (April)"    value="₨ 31.2M" trend={3.1} color="#ef4444" />
      </div>
      <Card>
        <CardHeader
          title="Bank Accounts"
          sub="Linked accounts overview"
          actions={
            <>
              <Btn variant="secondary"><RefreshCw size={12} /> Reconcile</Btn>
              <Btn variant="primary" onClick={openAddBank}><Plus size={12} /> Add Account</Btn>
            </>
          }
        />
        <TableWrap headers={["Bank Name", "Account Title", "Account Number", "IBAN", "Branch", "Balance (₨)", "Type", "Status", "Action"]}>
          {bankLoading ? (
            <tr><td colSpan={9} className="px-4 py-12 text-center"><div className="w-6 h-6 border-4 border-[#0C447C] border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
          ) : (accounts as any[]).length === 0 ? (
            <tr><td colSpan={9} className="px-4 py-12 text-center text-sm text-slate-400">No bank accounts yet. Click + Add Account to add one.</td></tr>
          ) : (accounts as any[]).map((b: any, i: number) => (
            <tr key={b._id || i} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">{b.bankName}</td>
              <td className="px-4 py-3 text-slate-600 text-xs">{b.accountTitle}</td>
              <td className="px-4 py-3 font-mono text-xs text-slate-500">{b.accountNumber}</td>
              <td className="px-4 py-3 font-mono text-xs text-slate-400">{b.iban || "—"}</td>
              <td className="px-4 py-3 text-slate-600 text-xs">{b.branchName || "—"}</td>
              <td className="px-4 py-3 font-mono font-bold text-[#0C447C]">{(b.currentBalance ?? b.openingBalance ?? 0).toLocaleString()}</td>
              <td className="px-4 py-3 text-slate-600 text-xs">{b.accountType}</td>
              <td className="px-4 py-3"><Badge v={b.isActive ? "green" : "gray"}>{b.isActive ? "Active" : "Inactive"}</Badge></td>
              <td className="px-4 py-3">
                <button className="p-1.5 text-slate-400 hover:text-[#0C447C] hover:bg-blue-50 rounded-lg"><Eye size={14} /></button>
              </td>
            </tr>
          ))}
        </TableWrap>
      </Card>
      <Card>
        <CardHeader title="Cash Flow Summary" sub="April 2025" />
        <div className="p-5">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={[
              { week: "Wk 1", inflow: 12.4, outflow: 8.2 },
              { week: "Wk 2", inflow: 10.8, outflow: 7.9 },
              { week: "Wk 3", inflow: 11.2, outflow: 8.5 },
              { week: "Wk 4", inflow: 8.4,  outflow: 6.6 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="week" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => `${v}M`} />
              <Tooltip formatter={(v: any, n?: any) => [`₨ ${v ?? 0}M`, n === "inflow" ? "Inflow" : "Outflow"]} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
              <Bar dataKey="inflow"  fill="#0C447C" radius={[4, 4, 0, 0]} />
              <Bar dataKey="outflow" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* ── Add Bank Account Modal ── */}
      {showBankModal && (
        <Modal title="Add Bank Account" size="lg" onClose={() => setShowBankModal(false)}>
          <div className="grid grid-cols-2 gap-4">
            <FField label="Bank Name" required>
              <FInput placeholder="e.g. Meezan Bank" value={bankForm.bank} style={errStyle("bank")}
                onChange={e => { setBankForm(f => ({ ...f, bank: e.target.value })); setBankErrors(r => ({ ...r, bank: false })); }} />
              {bankErrors.bank && <p className="text-xs text-red-500 mt-0.5">Required</p>}
            </FField>
            <FField label="Account Title" required>
              <FInput placeholder="e.g. Main Operating Account" value={bankForm.title} style={errStyle("title")}
                onChange={e => { setBankForm(f => ({ ...f, title: e.target.value })); setBankErrors(r => ({ ...r, title: false })); }} />
              {bankErrors.title && <p className="text-xs text-red-500 mt-0.5">Required</p>}
            </FField>
            <FField label="Account Number" required>
              <FInput placeholder="e.g. 1234-5678-9012" value={bankForm.number} style={errStyle("number")}
                onChange={e => { setBankForm(f => ({ ...f, number: e.target.value })); setBankErrors(r => ({ ...r, number: false })); }} />
              {bankErrors.number && <p className="text-xs text-red-500 mt-0.5">Required</p>}
            </FField>
            <FField label="IBAN">
              <FInput placeholder="e.g. PK36MEZN000116..." value={bankForm.iban}
                onChange={e => setBankForm(f => ({ ...f, iban: e.target.value }))} />
            </FField>
            <FField label="Branch Name">
              <FInput placeholder="e.g. Gulberg Branch" value={bankForm.branch}
                onChange={e => setBankForm(f => ({ ...f, branch: e.target.value }))} />
            </FField>
            <FField label="Account Type" required>
              <FSelect value={bankForm.type} style={errStyle("type")}
                onChange={e => { setBankForm(f => ({ ...f, type: e.target.value })); setBankErrors(r => ({ ...r, type: false })); }}>
                {["Current", "Savings", "Islamic"].map(o => <option key={o}>{o}</option>)}
              </FSelect>
            </FField>
            <FField label="Opening Balance (₨)">
              <FInput type="number" placeholder="0" value={bankForm.balance}
                onChange={e => setBankForm(f => ({ ...f, balance: e.target.value }))} />
            </FField>
            <FField label="Currency">
              <FSelect value={bankForm.currency} onChange={e => setBankForm(f => ({ ...f, currency: e.target.value }))}>
                {["PKR", "USD", "GBP", "SAR"].map(o => <option key={o}>{o}</option>)}
              </FSelect>
            </FField>
            <FField label="Campus" required>
              <FSelect value={bankForm.campus} style={errStyle("campus")}
                onChange={e => { setBankForm(f => ({ ...f, campus: e.target.value })); setBankErrors(r => ({ ...r, campus: false })); }}>
                <option value="">Select campus…</option>
                {BANK_CAMPUSES.map(c => <option key={c}>{c}</option>)}
              </FSelect>
            </FField>
            <FField label="Status">
              <FSelect value={bankForm.status} onChange={e => setBankForm(f => ({ ...f, status: e.target.value }))}>
                <option>Active</option><option>Inactive</option>
              </FSelect>
            </FField>
          </div>
          <ModalFooter onCancel={() => setShowBankModal(false)} onSave={saveBank} saveLabel="Add Account" />
        </Modal>
      )}
    </div>
  );
}

// ─── TAB: BUDGETING ───────────────────────────────────────────────────────────
type CCForm = { code: string; name: string; dept: string; campus: string; budget: string; description: string; status: string };
const BLANK_CC: CCForm = { code: "", name: "", dept: "", campus: "", budget: "", description: "", status: "Active" };

type BudgetRow = { dept: string; allocated: number; spent: number; pct: number };
type BudgetForm = { title: string; year: string; campus: string; dept: string; budgetType: string; startDate: string; endDate: string; amount: string; notes: string; status: string };
const BLANK_BUDGET: BudgetForm = { title: "", year: "2025-26", campus: "", dept: "", budgetType: "Annual", startDate: "", endDate: "", amount: "", notes: "", status: "Draft" };

function BudgetingTab() {
  const [costCenters, setCostCenters]     = useState<CostCenter[]>(INITIAL_COST_CENTERS);
  const [budgetRows, setBudgetRows]       = useState<BudgetRow[]>(budgetItems);
  const [showCCModal, setShowCCModal]     = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [editCC, setEditCC]               = useState<CostCenter | null>(null);
  const [ccForm, setCCForm]               = useState<CCForm>(BLANK_CC);
  const [budgetForm, setBudgetForm]       = useState<BudgetForm>(BLANK_BUDGET);
  const [budgetErrors, setBudgetErrors]   = useState<Record<string, boolean>>({});
  const [ccSearch, setCCSearch]           = useState("");

  const filteredCC = costCenters.filter(c =>
    c.name.toLowerCase().includes(ccSearch.toLowerCase()) ||
    c.code.toLowerCase().includes(ccSearch.toLowerCase())
  );

  function openAddCC() { setCCForm(BLANK_CC); setEditCC(null); setShowCCModal(true); }
  function openEditCC(c: CostCenter) {
    setCCForm({ code: c.code, name: c.name, dept: c.dept, campus: c.campus, budget: String(c.allocated), description: "", status: "Active" });
    setEditCC(c);
    setShowCCModal(true);
  }
  function deleteCC(code: string) { setCostCenters(l => l.filter(c => c.code !== code)); }
  function saveCC() {
    if (!ccForm.code || !ccForm.name || !ccForm.dept || !ccForm.campus) return;
    const entry: CostCenter = {
      code: ccForm.code, name: ccForm.name, dept: ccForm.dept, campus: ccForm.campus,
      allocated: Number(ccForm.budget) || 0, spent: editCC?.spent ?? 0,
    };
    if (editCC) {
      setCostCenters(l => l.map(c => c.code === editCC.code ? entry : c));
    } else {
      setCostCenters(l => [...l, entry]);
    }
    setShowCCModal(false);
  }

  function openAddBudget() { setBudgetForm(BLANK_BUDGET); setBudgetErrors({}); setShowBudgetModal(true); }
  function saveBudget() {
    const e: Record<string, boolean> = {};
    if (!budgetForm.title)     e.title     = true;
    if (!budgetForm.campus)    e.campus    = true;
    if (!budgetForm.budgetType) e.budgetType = true;
    if (!budgetForm.startDate) e.startDate = true;
    if (!budgetForm.endDate)   e.endDate   = true;
    if (!budgetForm.amount)    e.amount    = true;
    setBudgetErrors(e);
    if (Object.keys(e).length) return;
    const dept = budgetForm.dept || budgetForm.title;
    const allocated = Number(budgetForm.amount) || 0;
    setBudgetRows(rows => [...rows, { dept, allocated, spent: 0, pct: 0 }]);
    setShowBudgetModal(false);
  }

  const bErrStyle = (k: string): React.CSSProperties =>
    budgetErrors[k] ? { borderColor: "#ef4444", boxShadow: "0 0 0 1px #ef4444" } : {};

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPI icon={BarChart3}     label="Total Budget FY25"      value="₨ 38.2M"  color="#0C447C" />
        <KPI icon={TrendingUp}    label="Total Spent"            value="₨ 30.1M"  sub="78.8% utilized" color="#EF9F27" />
        <KPI icon={CheckCircle}   label="Departments On Track"   value="4 / 6"    color="#10b981" />
        <KPI icon={AlertTriangle} label="Over Budget"            value="1 dept"   sub="IT exceeded 108%" color="#ef4444" />
      </div>

      {/* Department Budget vs Actuals */}
      <Card>
        <CardHeader
          title="Department Budget vs Actuals"
          sub="FY 2024–25"
          actions={
            <>
              <Btn variant="secondary"><Download size={12} /> Export</Btn>
              <Btn variant="primary" onClick={openAddBudget}><Plus size={12} /> New Budget</Btn>
            </>
          }
        />
        <TableWrap headers={["Department", "Allocated (₨)", "Spent (₨)", "Remaining (₨)", "Utilization", "Status"]}>
          {budgetRows.map(b => (
            <tr key={b.dept} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-semibold text-slate-800">{b.dept}</td>
              <td className="px-4 py-3 font-mono text-slate-700">{b.allocated.toLocaleString()}</td>
              <td className="px-4 py-3 font-mono text-slate-700">{b.spent.toLocaleString()}</td>
              <td className={`px-4 py-3 font-mono font-semibold ${b.pct > 100 ? "text-red-600" : "text-emerald-600"}`}>
                {b.pct > 100 ? `−${(b.spent - b.allocated).toLocaleString()}` : (b.allocated - b.spent).toLocaleString()}
              </td>
              <td className="px-4 py-3 w-40">
                <div className="flex items-center gap-2">
                  <ProgBar pct={b.pct} color={b.pct > 100 ? "#ef4444" : b.pct > 85 ? "#EF9F27" : "#10b981"} />
                  <span className="text-xs font-semibold w-9 text-slate-700">{b.pct}%</span>
                </div>
              </td>
              <td className="px-4 py-3">
                <Badge v={b.pct > 100 ? "red" : b.pct > 85 ? "amber" : "green"}>
                  {b.pct > 100 ? "Over Budget" : b.pct > 85 ? "Near Limit" : "On Track"}
                </Badge>
              </td>
            </tr>
          ))}
        </TableWrap>
      </Card>

      {/* Cost Centers */}
      <Card>
        <CardHeader
          title="Cost Centers"
          sub="Budget allocation by cost center"
          actions={
            <>
              <SearchBar placeholder="Search cost center…" value={ccSearch} onChange={setCCSearch} />
              <Btn variant="primary" onClick={openAddCC}><Plus size={12} /> Add Cost Center</Btn>
            </>
          }
        />
        <TableWrap headers={["Code", "Cost Center Name", "Department", "Campus", "Budget Allocated (₨)", "Spent (₨)", "Remaining (₨)", "Actions"]}>
          {filteredCC.map(c => {
            const remaining = c.allocated - c.spent;
            const pct = c.allocated > 0 ? Math.round((c.spent / c.allocated) * 100) : 0;
            return (
              <tr key={c.code} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-xs font-bold text-[#0C447C]">{c.code}</td>
                <td className="px-4 py-3 font-semibold text-slate-800">{c.name}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{c.dept}</td>
                <td className="px-4 py-3">
                  <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap">{c.campus}</span>
                </td>
                <td className="px-4 py-3 font-mono text-slate-700">{c.allocated.toLocaleString()}</td>
                <td className="px-4 py-3 font-mono text-slate-700">{c.spent.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <span className={`font-mono font-semibold text-xs ${remaining < 0 ? "text-red-600" : "text-emerald-600"}`}>
                      {remaining < 0 ? "−" : ""}{Math.abs(remaining).toLocaleString()}
                    </span>
                    <ProgBar pct={pct} color={pct > 100 ? "#ef4444" : pct > 85 ? "#EF9F27" : "#10b981"} />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => openEditCC(c)} className="p-1.5 text-slate-400 hover:text-[#0C447C] hover:bg-blue-50 rounded-lg" title="Edit"><Edit size={13} /></button>
                    <button onClick={() => deleteCC(c.code)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Delete"><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            );
          })}
        </TableWrap>
        <div className="px-4 py-3 border-t border-slate-50 text-xs text-slate-400">
          {filteredCC.length} cost center{filteredCC.length !== 1 ? "s" : ""}
        </div>
      </Card>

      {/* ── New Budget Modal ── */}
      {showBudgetModal && (
        <Modal title="Create New Budget" size="lg" onClose={() => setShowBudgetModal(false)}>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <FField label="Budget Title" required>
                <FInput placeholder="e.g. Academic Operations Budget FY 2025-26" value={budgetForm.title} style={bErrStyle("title")}
                  onChange={e => { setBudgetForm(f => ({ ...f, title: e.target.value })); setBudgetErrors(r => ({ ...r, title: false })); }} />
                {budgetErrors.title && <p className="text-xs text-red-500 mt-0.5">Required</p>}
              </FField>
            </div>
            <FField label="Academic Year" required>
              <FSelect value={budgetForm.year} onChange={e => setBudgetForm(f => ({ ...f, year: e.target.value }))}>
                {["2024-25", "2025-26", "2026-27"].map(y => <option key={y}>{y}</option>)}
              </FSelect>
            </FField>
            <FField label="Budget Type" required>
              <FSelect value={budgetForm.budgetType} style={bErrStyle("budgetType")}
                onChange={e => { setBudgetForm(f => ({ ...f, budgetType: e.target.value })); setBudgetErrors(r => ({ ...r, budgetType: false })); }}>
                {["Annual", "Term", "Project"].map(o => <option key={o}>{o}</option>)}
              </FSelect>
            </FField>
            <FField label="Campus" required>
              <FSelect value={budgetForm.campus} style={bErrStyle("campus")}
                onChange={e => { setBudgetForm(f => ({ ...f, campus: e.target.value })); setBudgetErrors(r => ({ ...r, campus: false })); }}>
                <option value="">Select campus…</option>
                {CAMPUSES.map(c => <option key={c}>{c}</option>)}
              </FSelect>
              {budgetErrors.campus && <p className="text-xs text-red-500 mt-0.5">Required</p>}
            </FField>
            <FField label="Department">
              <FSelect value={budgetForm.dept} onChange={e => setBudgetForm(f => ({ ...f, dept: e.target.value }))}>
                <option value="">All Departments</option>
                {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
              </FSelect>
            </FField>
            <FField label="Start Date" required>
              <FInput type="date" value={budgetForm.startDate} style={bErrStyle("startDate")}
                onChange={e => { setBudgetForm(f => ({ ...f, startDate: e.target.value })); setBudgetErrors(r => ({ ...r, startDate: false })); }} />
              {budgetErrors.startDate && <p className="text-xs text-red-500 mt-0.5">Required</p>}
            </FField>
            <FField label="End Date" required>
              <FInput type="date" value={budgetForm.endDate} style={bErrStyle("endDate")}
                onChange={e => { setBudgetForm(f => ({ ...f, endDate: e.target.value })); setBudgetErrors(r => ({ ...r, endDate: false })); }} />
              {budgetErrors.endDate && <p className="text-xs text-red-500 mt-0.5">Required</p>}
            </FField>
            <FField label="Total Amount (₨)" required>
              <FInput type="number" placeholder="0" value={budgetForm.amount} style={bErrStyle("amount")}
                onChange={e => { setBudgetForm(f => ({ ...f, amount: e.target.value })); setBudgetErrors(r => ({ ...r, amount: false })); }} />
              {budgetErrors.amount && <p className="text-xs text-red-500 mt-0.5">Required</p>}
            </FField>
            <FField label="Status">
              <FSelect value={budgetForm.status} onChange={e => setBudgetForm(f => ({ ...f, status: e.target.value }))}>
                {["Draft", "Active", "Closed"].map(o => <option key={o}>{o}</option>)}
              </FSelect>
            </FField>
            <div className="col-span-2">
              <FField label="Notes">
                <FTextarea placeholder="Budget notes or special instructions…" value={budgetForm.notes}
                  onChange={e => setBudgetForm(f => ({ ...f, notes: e.target.value }))} />
              </FField>
            </div>
          </div>
          <ModalFooter onCancel={() => setShowBudgetModal(false)} onSave={saveBudget} saveLabel="Create Budget" />
        </Modal>
      )}

      {/* ── Add / Edit Cost Center Modal ── */}
      {showCCModal && (
        <Modal title={editCC ? "Edit Cost Center" : "Add Cost Center"} size="lg" onClose={() => setShowCCModal(false)}>
          <div className="grid grid-cols-2 gap-4">
            <FField label="Cost Center Code" required>
              <FInput placeholder="e.g. CC-007" value={ccForm.code} onChange={e => setCCForm(f => ({ ...f, code: e.target.value }))} />
            </FField>
            <FField label="Cost Center Name" required>
              <FInput placeholder="e.g. Student Welfare Fund" value={ccForm.name} onChange={e => setCCForm(f => ({ ...f, name: e.target.value }))} />
            </FField>
            <FField label="Department" required>
              <FSelect value={ccForm.dept} onChange={e => setCCForm(f => ({ ...f, dept: e.target.value }))}>
                <option value="">Select department…</option>
                {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
              </FSelect>
            </FField>
            <FField label="Campus" required>
              <FSelect value={ccForm.campus} onChange={e => setCCForm(f => ({ ...f, campus: e.target.value }))}>
                <option value="">Select campus…</option>
                {CAMPUSES.map(c => <option key={c}>{c}</option>)}
              </FSelect>
            </FField>
            <div className="col-span-2">
              <FField label="Annual Budget (₨)">
                <FInput type="number" placeholder="0" value={ccForm.budget} onChange={e => setCCForm(f => ({ ...f, budget: e.target.value }))} />
              </FField>
            </div>
            <div className="col-span-2">
              <FField label="Description">
                <FTextarea placeholder="Purpose and scope of this cost center…" value={ccForm.description} onChange={e => setCCForm(f => ({ ...f, description: e.target.value }))} />
              </FField>
            </div>
            <FField label="Status">
              <FSelect value={ccForm.status} onChange={e => setCCForm(f => ({ ...f, status: e.target.value }))}>
                <option>Active</option><option>Inactive</option>
              </FSelect>
            </FField>
          </div>
          <ModalFooter onCancel={() => setShowCCModal(false)} onSave={saveCC} saveLabel={editCC ? "Update Cost Center" : "Add Cost Center"} />
        </Modal>
      )}
    </div>
  );
}

// ─── TAB: ISLAMIC FUNDS ───────────────────────────────────────────────────────
type DonationForm = { type: string; donor: string; contact: string; amount: string; currency: string; date: string; method: string; purpose: string; campus: string; note: string };
const BLANK_DONATION: DonationForm = { type: "Zakat", donor: "", contact: "", amount: "", currency: "PKR", date: "", method: "Cash", purpose: "", campus: "", note: "" };
const DONATION_TYPES   = ["Zakat", "Sadaqah", "Waqf", "Lillah", "Khums", "Fitrana"];
const PAYMENT_METHODS  = ["Cash", "Bank Transfer", "Cheque", "Online"];

function IslamicFundsTab() {
  const [txns, setTxns]                     = useState<IslamicTxn[]>(INITIAL_ISLAMIC_TXN);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [donationForm, setDonationForm]     = useState<DonationForm>(BLANK_DONATION);
  const [donationErrors, setDonationErrors] = useState<Record<string, boolean>>({});

  function openDonation() { setDonationForm(BLANK_DONATION); setDonationErrors({}); setShowDonationModal(true); }
  function saveDonation() {
    const e: Record<string, boolean> = {};
    if (!donationForm.donor)  e.donor  = true;
    if (!donationForm.amount) e.amount = true;
    if (!donationForm.date)   e.date   = true;
    if (!donationForm.method) e.method = true;
    setDonationErrors(e);
    if (Object.keys(e).length) return;
    const nextNum = String(txns.length + 1).padStart(3, "0");
    const newTxn: IslamicTxn = {
      id:          `DON-${nextNum}`,
      date:        donationForm.date,
      donor:       donationForm.donor,
      type:        donationForm.type,
      amount:      Number(donationForm.amount),
      utilization: donationForm.purpose || "Pending assignment",
      status:      "Unallocated",
    };
    setTxns(t => [newTxn, ...t]);
    setShowDonationModal(false);
  }

  const dErrStyle = (k: string): React.CSSProperties =>
    donationErrors[k] ? { borderColor: "#ef4444", boxShadow: "0 0 0 1px #ef4444" } : {};

  const fundTypeStyle: Record<string, string> = {
    Zakat:   "bg-purple-50 text-purple-700",
    Sadaqah: "bg-cyan-50 text-cyan-700",
    Waqf:    "bg-emerald-50 text-emerald-700",
    Lillah:  "bg-amber-50 text-amber-700",
    Khums:   "bg-rose-50 text-rose-700",
    Fitrana: "bg-sky-50 text-sky-700",
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Zakat Fund Balance",   value: "₨ 2.84M", sub: "Utilized: ₨ 1.62M", color: "#7c3aed" },
          { label: "Sadaqah Fund Balance", value: "₨ 1.23M", sub: "47 beneficiaries",   color: "#0891b2" },
          { label: "Waqf Corpus",          value: "₨ 18.5M", sub: "Yield: ₨ 1.1M/yr",  color: "#047857" },
          { label: "Total Donors (2025)",  value: String(txns.length + 79), sub: "across all funds", color: "#EF9F27" },
        ].map(f => (
          <div key={f.label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4" style={{ borderLeft: `3px solid ${f.color}` }}>
            <div className="text-xl font-bold" style={{ color: f.color }}>{f.value}</div>
            <div className="text-xs font-medium text-slate-600 mt-0.5">{f.label}</div>
            <div className="text-xs text-slate-400 mt-1">{f.sub}</div>
          </div>
        ))}
      </div>
      <Card>
        <CardHeader
          title="Islamic Fund Transactions"
          sub="All funds · April 2025"
          actions={<Btn variant="primary" onClick={openDonation}><Plus size={12} /> Record Donation</Btn>}
        />
        <TableWrap headers={["Receipt No", "Date", "Donor", "Fund Type", "Amount (₨)", "Purpose / Utilization", "Status"]}>
          {txns.map(t => (
            <tr key={t.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-mono text-xs text-[#0C447C] font-bold">{t.id}</td>
              <td className="px-4 py-3 text-xs text-slate-500">{t.date}</td>
              <td className="px-4 py-3 font-semibold text-slate-800">{t.donor}</td>
              <td className="px-4 py-3">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${fundTypeStyle[t.type] ?? "bg-slate-100 text-slate-600"}`}>{t.type}</span>
              </td>
              <td className="px-4 py-3 font-mono font-bold text-emerald-600">+{t.amount.toLocaleString()}</td>
              <td className="px-4 py-3 text-xs text-slate-500">{t.utilization}</td>
              <td className="px-4 py-3">
                <Badge v={t.status === "Allocated" ? "green" : t.status === "Pending" ? "amber" : t.status === "Unallocated" ? "blue" : "gray"}>{t.status}</Badge>
              </td>
            </tr>
          ))}
        </TableWrap>
        <div className="px-4 py-3 border-t border-slate-50 text-xs text-slate-400">{txns.length} donation records</div>
      </Card>

      {/* ── Record Donation Modal ── */}
      {showDonationModal && (
        <Modal title="Record Donation" size="lg" onClose={() => setShowDonationModal(false)}>
          <div className="grid grid-cols-2 gap-4">
            <FField label="Donation Type" required>
              <FSelect value={donationForm.type} onChange={e => setDonationForm(f => ({ ...f, type: e.target.value }))}>
                {DONATION_TYPES.map(t => <option key={t}>{t}</option>)}
              </FSelect>
            </FField>
            <FField label="Donor Name" required>
              <FInput placeholder="Full name or 'Anonymous'" value={donationForm.donor} style={dErrStyle("donor")}
                onChange={e => { setDonationForm(f => ({ ...f, donor: e.target.value })); setDonationErrors(r => ({ ...r, donor: false })); }} />
              {donationErrors.donor && <p className="text-xs text-red-500 mt-0.5">Required</p>}
            </FField>
            <FField label="Donor Contact">
              <FInput placeholder="+92-300-1234567" value={donationForm.contact}
                onChange={e => setDonationForm(f => ({ ...f, contact: e.target.value }))} />
            </FField>
            <FField label="Amount" required>
              <FInput type="number" placeholder="0" value={donationForm.amount} style={dErrStyle("amount")}
                onChange={e => { setDonationForm(f => ({ ...f, amount: e.target.value })); setDonationErrors(r => ({ ...r, amount: false })); }} />
              {donationErrors.amount && <p className="text-xs text-red-500 mt-0.5">Required</p>}
            </FField>
            <FField label="Currency">
              <FSelect value={donationForm.currency} onChange={e => setDonationForm(f => ({ ...f, currency: e.target.value }))}>
                {["PKR", "USD", "GBP", "SAR"].map(c => <option key={c}>{c}</option>)}
              </FSelect>
            </FField>
            <FField label="Donation Date" required>
              <FInput type="date" value={donationForm.date} style={dErrStyle("date")}
                onChange={e => { setDonationForm(f => ({ ...f, date: e.target.value })); setDonationErrors(r => ({ ...r, date: false })); }} />
              {donationErrors.date && <p className="text-xs text-red-500 mt-0.5">Required</p>}
            </FField>
            <FField label="Payment Method" required>
              <FSelect value={donationForm.method} style={dErrStyle("method")}
                onChange={e => { setDonationForm(f => ({ ...f, method: e.target.value })); setDonationErrors(r => ({ ...r, method: false })); }}>
                {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
              </FSelect>
            </FField>
            <FField label="Campus">
              <FSelect value={donationForm.campus} onChange={e => setDonationForm(f => ({ ...f, campus: e.target.value }))}>
                <option value="">All Campuses</option>
                {CAMPUSES.map(c => <option key={c}>{c}</option>)}
              </FSelect>
            </FField>
            <div className="col-span-2">
              <FField label="Purpose / Utilization">
                <FInput placeholder="e.g. Fee waivers for needy students" value={donationForm.purpose}
                  onChange={e => setDonationForm(f => ({ ...f, purpose: e.target.value }))} />
              </FField>
            </div>
            <div className="col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-600">Receipt No</label>
                <span className="text-xs text-[#EF9F27] font-semibold bg-amber-50 px-2 py-0.5 rounded-full">
                  Auto: DON-{String(txns.length + 1).padStart(3, "0")}
                </span>
              </div>
            </div>
            <div className="col-span-2">
              <FField label="Shariah Note">
                <FTextarea placeholder="Any Shariah compliance notes or conditions attached to this donation…" value={donationForm.note}
                  onChange={e => setDonationForm(f => ({ ...f, note: e.target.value }))} />
              </FField>
            </div>
          </div>
          <ModalFooter onCancel={() => setShowDonationModal(false)} onSave={saveDonation} saveLabel="Record Donation" />
        </Modal>
      )}
    </div>
  );
}

// ─── TAB: REPORTS ─────────────────────────────────────────────────────────────
const REPORT_LIST = [
  { name: "Fee Collection Report",        desc: "Campus-wise and class-wise fee analysis",              icon: Receipt   },
  { name: "Outstanding Dues Report",      desc: "Student overdue fees with aging buckets",              icon: Clock     },
  { name: "Income & Expense Statement",   desc: "Revenue vs expenses with surplus/deficit",             icon: TrendingUp},
  { name: "Balance Sheet",                desc: "Assets, liabilities and equity snapshot",              icon: BookOpen  },
  { name: "Payroll Summary Report",       desc: "Staff salaries, allowances and deductions",            icon: Users     },
  { name: "Vendor Payment Report",        desc: "Supplier payment history and outstanding dues",        icon: Building2 },
  { name: "Bank Reconciliation Report",   desc: "Bank statement vs general ledger reconciliation",      icon: RefreshCw },
  { name: "Zakat & Islamic Funds Report", desc: "Shariah-compliant fund utilization details",           icon: Shield    },
  { name: "Budget vs Actual Report",      desc: "Department-wise budget performance analysis",          icon: BarChart3 },
  { name: "Campus-wise Financial Report", desc: "Profitability and cost analysis per campus",           icon: MapPin    },
] as const;

function ReportsTab() {
  const [reportModal, setReportModal] = useState<string | null>(null);
  const [toast, setToast]             = useState<{ msg: string; success: boolean } | null>(null);
  const [filterFrom, setFilterFrom]   = useState("");
  const [filterTo, setFilterTo]       = useState("");
  const [filterCampus, setFilterCampus] = useState("");
  const [filterFormat, setFilterFormat] = useState("PDF");

  function showToast(msg: string, success = true) {
    setToast({ msg, success });
    setTimeout(() => setToast(null), 3000);
  }

  return (
    <div className="space-y-5">
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-xl text-sm font-medium text-white ${toast.success ? "bg-emerald-600" : "bg-slate-700"}`}>
          {toast.msg}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPI icon={FileText}    label="Reports Generated"  value="128"  sub="This month"   color="#0C447C" />
        <KPI icon={Download}    label="Exports (PDF/XLSX)" value="47"   sub="Last 30 days" color="#10b981" />
        <KPI icon={BarChart3}   label="Scheduled Reports"  value="8"    sub="Auto-run"     color="#EF9F27" />
        <KPI icon={CheckCircle} label="Board Reports Sent" value="3"    sub="This quarter" color="#8b5cf6" />
      </div>

      <Card>
        <CardHeader title="Available Reports" sub="Generate, download or schedule financial reports" />
        <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          {REPORT_LIST.map(r => {
            const Icon = r.icon;
            return (
              <div key={r.name} className="border border-slate-100 rounded-xl p-4 hover:shadow-md hover:border-[#0C447C]/20 transition-all bg-white flex flex-col justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[#0C447C]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon size={18} className="text-[#0C447C]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{r.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{r.desc}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Btn variant="primary" size="sm" onClick={() => setReportModal(r.name)}>
                    <Download size={12} /> Generate Report
                  </Btn>
                  <Btn variant="secondary" size="sm" onClick={() => showToast("Scheduling coming soon — this feature will be available in the next release.", false)}>
                    <Clock size={12} /> Schedule
                  </Btn>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {reportModal && (
        <Modal title={`Generate: ${reportModal}`} size="md" onClose={() => setReportModal(null)}>
          <div className="grid grid-cols-2 gap-4">
            <FField label="Date From">
              <FInput type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} />
            </FField>
            <FField label="Date To">
              <FInput type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)} />
            </FField>
          </div>
          <FField label="Campus">
            <FSelect value={filterCampus} onChange={e => setFilterCampus(e.target.value)}>
              <option value="">All Campuses</option>
              <option value="Fatima">Fatima Campus</option>
              <option value="Abu Ayub">Abu Ayub Campus</option>
              <option value="Brainy">Brainy Campus</option>
            </FSelect>
          </FField>
          <FField label="Format">
            <FSelect value={filterFormat} onChange={e => setFilterFormat(e.target.value)}>
              <option value="PDF">PDF</option>
              <option value="Excel">Excel</option>
              <option value="CSV">CSV</option>
            </FSelect>
          </FField>
          <ModalFooter
            onCancel={() => setReportModal(null)}
            onSave={() => {
              const name = reportModal;
              setReportModal(null);
              showToast(`"${name}" downloaded as ${filterFormat} successfully.`);
            }}
            saveLabel="Download"
          />
        </Modal>
      )}
    </div>
  );
}

// ─── TAB: AUDIT ───────────────────────────────────────────────────────────────
const AUDIT_USERS   = ["All", "Faisal Mahmood", "Admin", "Sana Rehman", "Usman Tariq", "System"];
const AUDIT_ACTIONS = ["All", "Created", "Updated", "Deleted", "Approved"];
const AUDIT_MODULES = ["All", "Fee", "Invoice", "Budget", "Banking", "Donation"];

const ACTION_BADGE: Record<string, string> = {
  Created:  "bg-emerald-50 text-emerald-700 border border-emerald-200",
  Updated:  "bg-blue-50 text-blue-700 border border-blue-200",
  Deleted:  "bg-red-50 text-red-700 border border-red-200",
  Approved: "bg-amber-50 text-amber-700 border border-amber-200",
};

function AuditTab() {
  const [dateFrom, setDateFrom]           = useState("");
  const [dateTo, setDateTo]               = useState("");
  const [userFilter, setUserFilter]       = useState("All");
  const [actionFilter, setActionFilter]   = useState("All");
  const [moduleFilter, setModuleFilter]   = useState("All");
  const [expandedRow, setExpandedRow]     = useState<number | null>(null);
  const [toast, setToast]                 = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  const hasFilter = dateFrom || dateTo || userFilter !== "All" || actionFilter !== "All" || moduleFilter !== "All";

  const filtered = AUDIT_LOGS.filter(l => {
    if (userFilter   !== "All" && l.user   !== userFilter)   return false;
    if (actionFilter !== "All" && l.action !== actionFilter) return false;
    if (moduleFilter !== "All" && l.module !== moduleFilter) return false;
    if (dateFrom && l.time.slice(0, 10) < dateFrom) return false;
    if (dateTo   && l.time.slice(0, 10) > dateTo)   return false;
    return true;
  });

  const selCls   = "border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#0C447C] cursor-pointer";
  const inpCls   = "border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#0C447C] w-32";

  return (
    <div className="space-y-5">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-xl text-sm font-medium">
          {toast}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPI icon={CheckSquare}   label="Total Audit Events"  value="1,842"  sub="FY 2024–25"       color="#0C447C" />
        <KPI icon={CheckCircle}   label="Success Actions"     value="1,790"  sub="97.2%"            color="#10b981" />
        <KPI icon={AlertTriangle} label="Warning Events"      value="38"     sub="Requires review"  color="#EF9F27" />
        <KPI icon={XCircle}       label="Failed / Errors"     value="14"     sub="All investigated" color="#ef4444" />
      </div>

      <Card>
        <CardHeader
          title="Audit Log"
          sub="Complete trail of all financial module actions"
          actions={
            <Btn variant="secondary" onClick={() => showToast("Audit log exported as CSV successfully.")}>
              <Download size={12} /> Export CSV
            </Btn>
          }
        />

        {/* Filter Bar */}
        <div className="px-5 py-3 border-b border-slate-100 flex flex-wrap gap-3 items-center bg-slate-50/50">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Date From</span>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className={inpCls} />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Date To</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className={inpCls} />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500">User</span>
            <select value={userFilter} onChange={e => setUserFilter(e.target.value)} className={selCls}>
              {AUDIT_USERS.map(u => <option key={u}>{u}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500">Action</span>
            <select value={actionFilter} onChange={e => setActionFilter(e.target.value)} className={selCls}>
              {AUDIT_ACTIONS.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500">Module</span>
            <select value={moduleFilter} onChange={e => setModuleFilter(e.target.value)} className={selCls}>
              {AUDIT_MODULES.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          {hasFilter && (
            <button
              onClick={() => { setDateFrom(""); setDateTo(""); setUserFilter("All"); setActionFilter("All"); setModuleFilter("All"); }}
              className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1 ml-1"
            >
              <X size={12} /> Clear
            </button>
          )}
          <span className="ml-auto text-xs text-slate-400">{filtered.length} of {AUDIT_LOGS.length} entries</span>
        </div>

        <TableWrap headers={["Timestamp", "User", "Action", "Module", "Description", "IP Address", ""]}>
          {filtered.map(l => (
            <Fragment key={l.id}>
              <tr
                className="hover:bg-slate-50 cursor-pointer transition-colors"
                onClick={() => setExpandedRow(expandedRow === l.id ? null : l.id)}
              >
                <td className="px-4 py-3 font-mono text-xs text-slate-500 whitespace-nowrap">{l.time}</td>
                <td className="px-4 py-3 font-semibold text-slate-800 text-xs whitespace-nowrap">{l.user}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${ACTION_BADGE[l.action] ?? "bg-slate-100 text-slate-600 border border-slate-200"}`}>
                    {l.action}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="bg-[#0C447C]/10 text-[#0C447C] text-xs px-2 py-0.5 rounded-full font-medium">{l.module}</span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-600 max-w-xs truncate">{l.description}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-400 whitespace-nowrap">{l.ip}</td>
                <td className="px-4 py-3 w-8">
                  <ChevronDown size={14} className={`text-slate-400 transition-transform ${expandedRow === l.id ? "rotate-180" : ""}`} />
                </td>
              </tr>
              {expandedRow === l.id && (
                <tr className="bg-slate-50/80">
                  <td colSpan={7} className="px-6 py-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                      <div>
                        <p className="font-semibold text-slate-500 mb-1">Timestamp</p>
                        <p className="font-mono text-slate-700">{l.time}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-500 mb-1">User</p>
                        <p className="text-slate-700">{l.user}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-500 mb-1">IP Address</p>
                        <p className="font-mono text-slate-700">{l.ip}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-500 mb-1">Module</p>
                        <p className="text-slate-700">{l.module}</p>
                      </div>
                      <div className="col-span-2 md:col-span-4">
                        <p className="font-semibold text-slate-500 mb-1">Full Description</p>
                        <p className="text-slate-700 leading-relaxed">{l.description}</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </TableWrap>

        <div className="px-4 py-3 border-t border-slate-50 text-xs text-slate-400">
          Showing {filtered.length} of {AUDIT_LOGS.length} audit entries
        </div>
      </Card>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function FinancePage() {
  const [active, setActive] = useState<FinTab>("dashboard");

  function renderTab() {
    switch (active) {
      case "dashboard":  return <DashboardTab />;
      case "fee":        return <FeeRevenueTab />;
      case "receivable": return <ReceivableTab />;
      case "payable":    return <PayableTab />;
      case "banking":    return <BankingTab />;
      case "budgeting":  return <BudgetingTab />;
      case "islamic":    return <IslamicFundsTab />;
      case "reports":    return <ReportsTab />;
      case "audit":      return <AuditTab />;
    }
  }

  return (
    <div className="space-y-0">
      {/* Tab bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 -mx-6 px-6 mb-6">
        <div className="flex gap-0.5 overflow-x-auto">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActive(tab.id)}
                className={`relative flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
                  active === tab.id
                    ? "border-[#0C447C] text-[#0C447C]"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold leading-none">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
      {renderTab()}
    </div>
  );
}
