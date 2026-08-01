import { useState, Fragment } from "react";
import {
  LayoutDashboard, Receipt, Clock, CreditCard, Landmark,
  BarChart3, Shield, FileText, CheckSquare, Plus, Download,
  Search, Eye, Edit, TrendingUp, TrendingDown, AlertTriangle,
  RefreshCw, Printer, Send, Star, Wallet, Building2,
  CheckCircle, XCircle, ArrowUp, ArrowDown, X, Trash2,
  Users, BookOpen, MapPin, ChevronDown, Percent, Award,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import financeService from "../../services/finance.service";
import organizationService from "../../services/organization.service";
import familiesService from "../../services/families.service";
import { StudentSelect } from "../../components/ui/StudentSelect";
import * as pdfApi from "../../services/pdf.api";

// ─── TYPES ────────────────────────────────────────────────────────────────────
type FinTab =
  | "dashboard" | "fee" | "assignments" | "receivable" | "payable"
  | "banking" | "budgeting" | "islamic" | "reports" | "audit";

const TABS: { id: FinTab; label: string; icon: LucideIcon; badge?: number }[] = [
  { id: "dashboard",   label: "Dashboard",         icon: LayoutDashboard },
  { id: "fee",         label: "Fee & Revenue",     icon: Receipt         },
  { id: "assignments", label: "Fee Assignment",    icon: Award           },
  { id: "receivable",  label: "Receivables",       icon: Clock, badge: 7 },
  { id: "payable",     label: "Payables",          icon: CreditCard      },
  { id: "banking",     label: "Banking",           icon: Landmark        },
  { id: "budgeting",   label: "Budgeting",         icon: BarChart3       },
  { id: "islamic",     label: "Islamic Funds",     icon: Shield          },
  { id: "reports",     label: "Reports",           icon: FileText        },
  { id: "audit",       label: "Audit",             icon: CheckSquare     },
];

// ─── DATA ─────────────────────────────────────────────────────────────────────
const PIE_COLORS = ["#0C447C", "#EF9F27", "#ef4444", "#8b5cf6", "#10b981", "#0891b2"];

type IslamicTxn = { id: string; date: string; donor: string; type: string; amount: number; utilization: string; status: string };
// No backend yet for Islamic Funds — local-only, resets on refresh (documented in audit report)
const INITIAL_ISLAMIC_TXN: IslamicTxn[] = [];

type AuditEntry = { id: number; time: string; user: string; action: string; module: string; description: string; ip: string };
// No backend yet for financial audit logging — local-only placeholder (documented in audit report)
const AUDIT_LOGS: AuditEntry[] = [];

const ACCOUNT_TYPES = ["Asset", "Liability", "Income", "Expense", "Equity"];
const CURRENCIES    = ["PKR", "USD", "GBP", "SAR", "AED"];

// ─── COST CENTERS DATA ────────────────────────────────────────────────────────
type CostCenter = { code: string; name: string; dept: string; campus: string; allocated: number; spent: number };
// No backend yet for Cost Centers — local-only, resets on refresh (documented in audit report)
const INITIAL_COST_CENTERS: CostCenter[] = [];

const DEPARTMENTS = ["Academics", "Administration", "Transport", "IT", "Islamic Edu.", "Marketing", "HR", "Finance", "Sports"];
const CAMPUSES    = ["All Campuses", "Main Campus – Karachi", "North Branch – Lahore", "East Campus – Islamabad"];

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

// ─── COLLECT FEE MODAL ────────────────────────────────────────────────────────
function CollectFeeModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const { data: invoices = [] } = useQuery({ queryKey: ["invoices"], queryFn: () => financeService.getInvoices() });
  const [studentQuery, setStudentQuery]     = useState("");
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [amount, setAmount]                 = useState("");
  const [paymentMethod, setPaymentMethod]   = useState("cash");
  const [paymentDate, setPaymentDate]       = useState(new Date().toISOString().slice(0, 10));
  const [referenceNumber, setReferenceNumber] = useState("");
  const [remarks, setRemarks]               = useState("");
  const [receipt, setReceipt]               = useState<any | null>(null);

  const outstanding = (invoices as any[]).filter(inv => (inv.balanceDue || 0) > 0);
  const studentMatches = Array.from(new Set(outstanding.map(i => i.studentName)))
    .filter(name => name.toLowerCase().includes(studentQuery.toLowerCase()));
  const studentInvoices = selectedStudent ? outstanding.filter(i => i.studentName === selectedStudent) : [];

  const collectMutation = useMutation({
    mutationFn: financeService.collectFee,
    onSuccess: (payment: any) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["finance-dashboard"] });
      toast.success(`Payment recorded — receipt ${payment.receiptNumber}`);
      setReceipt(payment);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to record payment"),
  });

  function selectStudent(name: string) {
    setSelectedStudent(name);
    setSelectedInvoice(null);
    setAmount("");
  }
  function selectInvoice(inv: any) {
    setSelectedInvoice(inv);
    setAmount(String(inv.balanceDue));
  }
  function save() {
    if (!selectedInvoice) { toast.error("Select an outstanding invoice"); return; }
    const amt = Number(amount);
    if (!amt || amt <= 0) { toast.error("Enter a valid amount"); return; }
    if (amt > selectedInvoice.balanceDue) { toast.error("Amount exceeds balance due"); return; }
    collectMutation.mutate({
      invoiceId: selectedInvoice._id,
      studentId: selectedInvoice.studentId,
      amount: amt,
      paymentMethod,
      paymentDate,
      referenceNumber: referenceNumber || undefined,
      remarks: remarks || undefined,
    });
  }

  if (receipt) {
    const receiptId = receipt._id || receipt.id || receipt.paymentId;
    async function downloadReceiptPdf() {
      try {
        const blob = await pdfApi.generateFeeReceiptPdf({ paymentId: receiptId });
        pdfApi.downloadBlob(blob, `receipt-${receipt.receiptNumber}.pdf`);
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Failed to download receipt PDF");
      }
    }
    return (
      <Modal title="Payment Recorded" onClose={onClose}>
        <div className="space-y-3 text-sm">
          <p className="text-center text-emerald-600 font-bold text-base">✓ Payment collected successfully</p>
          <div className="border border-slate-100 rounded-lg p-4 space-y-1.5">
            <div className="flex justify-between"><span className="text-slate-400">Receipt No</span><span className="font-mono font-semibold">{receipt.receiptNumber}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Student</span><span className="font-semibold">{receipt.studentName}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Invoice</span><span className="font-mono">{receipt.invoiceNumber}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Amount</span><span className="font-bold">₨ {(receipt.amount || 0).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Method</span><span className="capitalize">{(receipt.paymentMethod || "").replace("_", " ")}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Date</span><span>{receipt.paymentDate ? new Date(receipt.paymentDate).toLocaleDateString() : "—"}</span></div>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <Btn variant="secondary" size="md" onClick={onClose}>Close</Btn>
          <Btn variant="secondary" size="md" onClick={downloadReceiptPdf}><Download size={14} /> Download PDF</Btn>
          <Btn variant="primary" size="md" onClick={() => window.print()}><Printer size={14} /> Print Receipt</Btn>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="Collect Fee" size="lg" onClose={onClose}>
      <div className="space-y-4">
        <FField label="Search Student" required>
          <SearchBar placeholder="Search by student name…" value={studentQuery} onChange={v => { setStudentQuery(v); setSelectedStudent(null); setSelectedInvoice(null); }} />
        </FField>

        {!selectedStudent && studentQuery && (
          <div className="border border-slate-100 rounded-lg divide-y divide-slate-50 max-h-40 overflow-y-auto">
            {studentMatches.length === 0 ? (
              <p className="px-3 py-3 text-xs text-slate-400">No students with outstanding balances match "{studentQuery}".</p>
            ) : studentMatches.map(name => (
              <button key={name} onClick={() => selectStudent(name)} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50">{name}</button>
            ))}
          </div>
        )}

        {selectedStudent && (
          <>
            <FField label="Selected Student">
              <div className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                <span className="font-semibold text-sm">{selectedStudent}</span>
                <button onClick={() => { setSelectedStudent(null); setSelectedInvoice(null); setStudentQuery(""); }} className="text-xs text-[#0C447C] hover:underline">Change</button>
              </div>
            </FField>
            <FField label="Outstanding Invoice" required>
              <div className="border border-slate-100 rounded-lg divide-y divide-slate-50 max-h-40 overflow-y-auto">
                {studentInvoices.map(inv => (
                  <button
                    key={inv._id}
                    onClick={() => selectInvoice(inv)}
                    className={`w-full text-left px-3 py-2 text-xs flex justify-between items-center gap-2 hover:bg-slate-50 ${selectedInvoice?._id === inv._id ? "bg-blue-50" : ""}`}
                  >
                    <span className="font-mono text-[#0C447C] font-bold whitespace-nowrap">{inv.invoiceNumber}</span>
                    <span className="text-slate-500 whitespace-nowrap">{inv.month}</span>
                    <span className="font-semibold whitespace-nowrap">Due ₨ {(inv.balanceDue || 0).toLocaleString()}</span>
                  </button>
                ))}
              </div>
            </FField>
          </>
        )}

        {selectedInvoice && (
          <div className="grid grid-cols-2 gap-4">
            <FField label="Amount to Collect (₨)" required>
              <FInput type="number" max={selectedInvoice.balanceDue} value={amount} onChange={e => setAmount(e.target.value)} />
            </FField>
            <FField label="Payment Method" required>
              <FSelect value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cheque">Cheque</option>
                <option value="online">Online</option>
              </FSelect>
            </FField>
            <FField label="Payment Date" required>
              <FInput type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} />
            </FField>
            <FField label="Reference Number">
              <FInput placeholder="Bank/cheque ref (optional)" value={referenceNumber} onChange={e => setReferenceNumber(e.target.value)} />
            </FField>
            <div className="col-span-2">
              <FField label="Remarks">
                <FTextarea placeholder="Optional notes…" value={remarks} onChange={e => setRemarks(e.target.value)} />
              </FField>
            </div>
          </div>
        )}
      </div>
      <ModalFooter onCancel={onClose} onSave={save} saveLabel={collectMutation.isPending ? "Recording…" : "Record Payment"} />
    </Modal>
  );
}

// ─── TAB: DASHBOARD ───────────────────────────────────────────────────────────
function EmptyChart({ label }: { label: string }) {
  return (
    <div className="h-[170px] flex items-center justify-center text-xs text-slate-400 text-center px-6">
      {label}
    </div>
  );
}

function DashboardTab({ onNavigate }: { onNavigate: (tab: FinTab) => void }) {
  const [showCollectFee, setShowCollectFee] = useState(false);
  const { data: stats } = useQuery({ queryKey: ["finance-dashboard"], queryFn: financeService.getDashboard });
  const { data: budgets = [] } = useQuery({ queryKey: ["budgets"], queryFn: () => financeService.getBudgets() });
  const summary = stats?.summary;
  const fmt = (n?: number) => {
    if (!n) return "₨ 0";
    if (n >= 1_000_000) return `₨ ${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `₨ ${(n / 1_000).toFixed(0)}K`;
    return `₨ ${n.toLocaleString()}`;
  };
  const collectionRate = summary?.totalInvoiced ? Math.round((summary.totalCollected / summary.totalInvoiced) * 100) : 0;
  const cashInBank = ((stats?.bankBalances || []) as any[]).reduce((a, b) => a + (b.currentBalance || 0), 0);
  const recentPayments = (stats?.recentPayments || []) as any[];
  const invoicesByStatus = (stats?.invoicesByStatus || []) as any[];
  const feePieData = invoicesByStatus.map((s: any) => ({ name: s._id, value: s.total }));
  const budgetRows = (budgets as any[]).slice(0, 5).map((b: any) => {
    const pct = b.totalAllocated > 0 ? Math.round((b.totalSpent / b.totalAllocated) * 100) : 0;
    return { dept: b.name, pct };
  });

  function quickAction(tab: FinTab | null, label: string) {
    if (label === "Collect Fee") { setShowCollectFee(true); return; }
    if (!tab) { toast("Coming soon — this feature will be available in a future release."); return; }
    onNavigate(tab);
  }

  return (
    <div className="space-y-5">
      {showCollectFee && <CollectFeeModal onClose={() => setShowCollectFee(false)} />}
      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: "Create Voucher",   tab: null,          color: "bg-blue-50 text-blue-700 hover:bg-blue-100"     },
          { label: "Collect Fee",      tab: "receivable",  color: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" },
          { label: "Add Expense",      tab: "payable",     color: "bg-red-50 text-red-700 hover:bg-red-100"         },
          { label: "Add Donor",        tab: "islamic",     color: "bg-purple-50 text-purple-700 hover:bg-purple-100" },
          { label: "Create Budget",    tab: "budgeting",   color: "bg-[#EF9F27]/10 text-amber-700 hover:bg-amber-100" },
          { label: "Reconcile Bank",   tab: "banking",     color: "bg-teal-50 text-teal-700 hover:bg-teal-100"     },
          { label: "Generate Report",  tab: "reports",     color: "bg-slate-100 text-slate-700 hover:bg-slate-200" },
        ].map(a => (
          <button key={a.label} onClick={() => quickAction(a.tab as FinTab | null, a.label)} className={`${a.color} px-4 py-2 text-xs font-semibold rounded-lg transition-colors`}>
            {a.label}
          </button>
        ))}
      </div>

      {/* KPI Row 1 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPI icon={TrendingUp}   label="Total Invoiced"      value={fmt(summary?.totalInvoiced)}        sub="All invoices raised"     color="#0C447C"  />
        <KPI icon={TrendingDown} label="Total Expenses"      value={fmt(summary?.totalExpenses)}        sub="Approved & paid"         color="#ef4444"  />
        <KPI icon={Star}         label="Net Collected"       value={fmt(summary?.totalCollected)}       sub="Payments received"       color="#10b981"  />
        <KPI icon={CheckCircle}  label="Fee Collection Rate" value={`${collectionRate}%`}             sub={`${summary?.overdueCount ?? 0} overdue`} color="#EF9F27" />
      </div>

      {/* KPI Row 2 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPI icon={Clock}         label="Outstanding Receivables" value={fmt(summary?.totalOutstanding)}    sub={`${summary?.overdueCount ?? 0} overdue invoices`} color="#EF9F27" />
        <KPI icon={AlertTriangle} label="Pending Expenses"        value={fmt(summary?.totalPendingExpenses)}  sub={`${summary?.pendingExpensesCount ?? 0} awaiting approval`} color="#ef4444" />
        <KPI icon={Landmark}      label="Cash in Bank"            value={fmt(cashInBank)} sub={`${(stats?.bankBalances || []).length} linked accounts`}  color="#0C447C" />
        <KPI icon={Wallet}        label="Collected This Month"    value={fmt(summary?.collectedThisMonth)} sub="Current calendar month" color="#8b5cf6" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Fee Collection Status" sub="By invoice status" />
          <div className="p-4">
            {feePieData.length === 0 ? <EmptyChart label="No invoices yet — create invoices to see collection status here." /> : (
              <>
                <ResponsiveContainer width="100%" height={170}>
                  <PieChart>
                    <Pie data={feePieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                      {feePieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: any) => [`₨ ${(v ?? 0).toLocaleString()}`]} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-1 mt-1">
                  {feePieData.map((d, i) => (
                    <div key={d.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}></span>
                        <span className="text-slate-600 capitalize">{d.name}</span>
                      </div>
                      <span className="font-semibold text-slate-700">₨ {d.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Budget Utilization" sub="Top 5 budgets" actions={<Btn variant="secondary" size="sm" onClick={() => onNavigate("budgeting")}>Open Budgeting</Btn>} />
          <div className="p-4 space-y-3">
            {budgetRows.length === 0 ? <EmptyChart label="No budgets yet — create one from the Budgeting tab." /> : budgetRows.map(b => (
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
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader
          title="Recent Payments"
          sub="Last 5 receipts"
          actions={<Btn variant="secondary" onClick={() => onNavigate("receivable")}><Eye size={12} /> View All</Btn>}
        />
        <TableWrap headers={["Receipt #", "Date", "Student", "Method", "Amount (PKR)"]}>
          {recentPayments.length === 0 ? (
            <tr><td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-400">No payments recorded yet.</td></tr>
          ) : recentPayments.map(t => (
            <tr key={t._id} className="hover:bg-slate-50 transition-colors">
              <td className="px-4 py-3 font-mono text-xs text-[#0C447C] font-bold">{t.receiptNumber}</td>
              <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{t.paymentDate ? new Date(t.paymentDate).toLocaleDateString() : "—"}</td>
              <td className="px-4 py-3 text-slate-700 font-medium text-xs">{t.studentName}</td>
              <td className="px-4 py-3"><Badge v="blue">{t.paymentMethod}</Badge></td>
              <td className="px-4 py-3 font-mono font-bold text-sm text-emerald-600">+ {(t.amount || 0).toLocaleString()}</td>
            </tr>
          ))}
        </TableWrap>
      </Card>
    </div>
  );
}

// ─── TAB: FEE & REVENUE ───────────────────────────────────────────────────────
type FeeForm = { head: string; amount: string; freq: string; customFreq: string; dueDate: string; lateFee: string; taxApplicable: boolean; effectiveFrom: string; campus: string; status: string };
type AcctForm = { code: string; name: string; type: string; parent: string; description: string; openingBalance: string; currency: string; status: string };
type ClassSection = { grade: string; section: string };

const BLANK_FEE: FeeForm = { head: "", amount: "", freq: "Monthly", customFreq: "", dueDate: "", lateFee: "", taxApplicable: false, effectiveFrom: "", campus: "", status: "Active" };
const BLANK_ACCT: AcctForm = { code: "", name: "", type: "", parent: "", description: "", openingBalance: "", currency: "PKR", status: "Active" };
const FREQUENCY_OPTIONS = ["Monthly", "Bi-Monthly (2 Months)", "Quarterly", "Termly", "Annually", "One-time", "Custom"];

function FeeRevenueTab() {
  const [search, setSearch]           = useState("");
  const [acctSearch, setAcctSearch]   = useState("");
  const [showFeeModal, setShowFeeModal]   = useState(false);
  const [showAcctModal, setShowAcctModal] = useState(false);
  const [editAcct, setEditAcct]       = useState<any | null>(null);
  const [feeForm, setFeeForm]         = useState<FeeForm>(BLANK_FEE);
  const [acctForm, setAcctForm]       = useState<AcctForm>(BLANK_ACCT);
  const [selectedClasses, setSelectedClasses] = useState<ClassSection[]>([]);

  const queryClient = useQueryClient();
  const { data: feeHeads = [], isLoading: feeHeadsLoading } = useQuery({ queryKey: ["fee-heads"], queryFn: financeService.getFeeHeads });
  const { data: grades = [] } = useQuery({ queryKey: ["grades"], queryFn: () => organizationService.getGrades() });
  const { data: campuses = [] } = useQuery({ queryKey: ["campuses"], queryFn: organizationService.getCampuses });
  const createFeeHeadMutation = useMutation({
    mutationFn: (payloads: any[]) => Promise.all(payloads.map(p => financeService.createFeeStructure(p))),
    onSuccess: (_res, payloads: any[]) => {
      queryClient.invalidateQueries({ queryKey: ["fee-heads"] });
      toast.success(`Fee structure added for ${payloads.length} class${payloads.length !== 1 ? "es" : ""}`);
      setShowFeeModal(false);
      setFeeForm(BLANK_FEE);
      setSelectedClasses([]);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed"),
  });
  const toggleFeeHeadMutation = useMutation({
    mutationFn: (vars: { id: string; isActive: boolean }) => financeService.updateFeeStructure(vars.id, { isActive: vars.isActive }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["fee-heads"] }); toast.success("Fee head updated"); },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to update"),
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
  const updateAccount = useMutation({
    mutationFn: (vars: { id: string; payload: any }) => financeService.updateCOAAccount(vars.id, vars.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coa"] });
      toast.success("Account updated");
      setShowAcctModal(false);
      setEditAcct(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to update"),
  });
  const removeAccount = useMutation({
    mutationFn: (id: string) => financeService.deleteCOAAccount(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["coa"] }); toast.success("Account deactivated"); },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to delete"),
  });
  const applyStandard = useMutation({
    mutationFn: () => financeService.applyStandardCOA(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coa"] });
      toast.success("Standard Chart of Accounts applied");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed"),
  });

  const filteredFee = (feeHeads as any[]).filter(h =>
    h.name.toLowerCase().includes(search.toLowerCase()) ||
    (h.grade || "").toLowerCase().includes(search.toLowerCase()) ||
    (h.section || "").toLowerCase().includes(search.toLowerCase())
  );
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
    setAcctForm({ code: a.code, name: a.name, type: a.type ? a.type.charAt(0).toUpperCase() + a.type.slice(1) : "", parent: a.parentCode || "", description: "", openingBalance: String(a.currentBalance ?? a.openingBalance ?? 0), currency: a.currency || "PKR", status: a.isActive ? "Active" : "Inactive" });
    setEditAcct(a);
    setShowAcctModal(true);
  }
  function deleteAcct(id: string) {
    removeAccount.mutate(id);
  }
  function saveAcct() {
    if (!acctForm.code || !acctForm.name || !acctForm.type) return;
    if (editAcct) {
      updateAccount.mutate({
        id: editAcct._id,
        payload: {
          name: acctForm.name,
          type: acctForm.type.toLowerCase(),
          parentCode: acctForm.parent || null,
          currentBalance: Number(acctForm.openingBalance) || 0,
          isActive: acctForm.status === "Active",
        },
      });
    } else {
      addAccount.mutate({
        code: acctForm.code,
        name: acctForm.name,
        type: acctForm.type.toLowerCase(),
        parentCode: acctForm.parent || null,
        openingBalance: Number(acctForm.openingBalance) || 0,
        currentBalance: Number(acctForm.openingBalance) || 0,
        currency: acctForm.currency,
        isActive: acctForm.status === "Active",
      });
    }
  }

  // ── Class/Section selection (real grades+sections, not mock data) ──────────
  function sectionNamesOf(grade: any): string[] {
    return (grade.sections || []).length ? grade.sections.map((s: any) => s.name) : [""];
  }
  function isClassSelected(gradeName: string, sectionName: string) {
    return selectedClasses.some(c => c.grade === gradeName && c.section === sectionName);
  }
  function toggleClassSection(gradeName: string, sectionName: string) {
    setSelectedClasses(prev =>
      isClassSelected(gradeName, sectionName)
        ? prev.filter(c => !(c.grade === gradeName && c.section === sectionName))
        : [...prev, { grade: gradeName, section: sectionName }]
    );
  }
  function toggleWholeGrade(grade: any) {
    const names = sectionNamesOf(grade);
    const allSelected = names.every(sn => isClassSelected(grade.name, sn));
    setSelectedClasses(prev => {
      const withoutThisGrade = prev.filter(c => c.grade !== grade.name);
      return allSelected ? withoutThisGrade : [...withoutThisGrade, ...names.map(sn => ({ grade: grade.name, section: sn }))];
    });
  }

  function saveFeeStructure() {
    if (!feeForm.head) { toast.error("Fee head name is required"); return; }
    if (!feeForm.amount || Number(feeForm.amount) <= 0) { toast.error("Amount is required"); return; }
    if (selectedClasses.length === 0) { toast.error("Select at least one class/section"); return; }
    const frequency = feeForm.freq === "Custom" ? (feeForm.customFreq.trim() || "Custom") : feeForm.freq;
    const amount = Number(feeForm.amount) || 0;
    const payloads = selectedClasses.map(c => ({
      name: feeForm.head,
      grade: c.grade,
      section: c.section || undefined,
      frequency,
      items: [{ feeHead: feeForm.head, amount, discount: 0, isOptional: false }],
      dueDay: feeForm.dueDate ? Number(feeForm.dueDate) : undefined,
      lateFeeAmount: Number(feeForm.lateFee) || 0,
      effectiveFrom: feeForm.effectiveFrom || undefined,
      campus: feeForm.campus || undefined,
      isTaxable: feeForm.taxApplicable,
      isActive: feeForm.status === "Active",
    }));
    createFeeHeadMutation.mutate(payloads);
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

  const activeFeeHeads = (feeHeads as any[]).filter(h => h.isActive).length;
  const taxableFeeHeads = (feeHeads as any[]).filter(h => h.isTaxable).length;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPI icon={Receipt}       label="Fee Heads Defined"   value={String((feeHeads as any[]).length)} sub="All fee categories"  color="#0C447C" />
        <KPI icon={CheckCircle}   label="Active Fee Heads"    value={String(activeFeeHeads)}             sub="Currently billable"  color="#10b981" />
        <KPI icon={AlertTriangle} label="Taxable Fee Heads"   value={String(taxableFeeHeads)}            sub="Tax applicable"      color="#EF9F27" />
        <KPI icon={BookOpen}      label="Chart of Accounts"   value={String((coaAccounts as any[]).length)} sub="Ledger accounts" color="#7c3aed" />
      </div>

      {/* Fee Structure */}
      <Card>
        <CardHeader
          title="Fee Structure by Class"
          sub="FY 2024–25 · All Campuses"
          actions={
            <>
              <SearchBar placeholder="Search class..." value={search} onChange={setSearch} />
              <Btn variant="secondary" onClick={() => window.print()}><Printer size={12} /> Print</Btn>
              <Btn variant="primary" onClick={() => { setFeeForm(BLANK_FEE); setSelectedClasses([]); setShowFeeModal(true); }}><Plus size={12} /> Add Fee Structure</Btn>
            </>
          }
        />
        <TableWrap headers={["Fee Head", "Class / Section", "Amount (₨)", "Frequency", "Due Day", "Late Fee (₨)", "Effective From", "Campus", "Tax", "Status", "Action"]}>
          {feeHeadsLoading ? (
            <tr><td colSpan={11} className="px-4 py-12 text-center"><div className="w-6 h-6 border-4 border-[#0C447C] border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
          ) : filteredFee.length === 0 ? (
            <tr><td colSpan={11} className="px-4 py-12 text-center text-sm text-slate-400">{(feeHeads as any[]).length === 0 ? "No fee structures yet. Click + Add Fee Structure to create one." : "No results match your search."}</td></tr>
          ) : filteredFee.map((h: any) => (
            <tr key={h._id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">{h.name}</td>
              <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">{h.grade}{h.section ? ` – ${h.section}` : ""}</td>
              <td className="px-4 py-3 font-mono font-bold text-[#0C447C]">{(h.totalAmount ?? 0).toLocaleString()}</td>
              <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">{h.frequency}</td>
              <td className="px-4 py-3 text-xs text-slate-500">{h.dueDay ?? "—"}</td>
              <td className="px-4 py-3 text-xs text-slate-500">{(h.lateFeeAmount ?? 0).toLocaleString()}</td>
              <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{h.effectiveFrom ? new Date(h.effectiveFrom).toLocaleDateString() : "—"}</td>
              <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">{h.campus || "All Campuses"}</td>
              <td className="px-4 py-3 text-xs text-slate-600">{h.isTaxable ? "Yes" : "No"}</td>
              <td className="px-4 py-3"><Badge v={h.isActive ? "green" : "gray"}>{h.isActive ? "Active" : "Inactive"}</Badge></td>
              <td className="px-4 py-3">
                <div className="flex gap-1">
                  <button
                    onClick={() => toggleFeeHeadMutation.mutate({ id: h._id, isActive: !h.isActive })}
                    className="p-1.5 text-slate-400 hover:text-[#0C447C] hover:bg-blue-50 rounded-lg"
                    title={h.isActive ? "Deactivate" : "Activate"}
                  ><Edit size={13} /></button>
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
                  onClick={() => applyStandard.mutate()}
                  disabled={applyStandard.isPending || coaAlreadyApplied}
                  className={`px-3 py-1.5 text-xs border rounded-lg font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${coaAlreadyApplied ? "opacity-40 cursor-not-allowed bg-white text-slate-400 border-slate-200" : "bg-white text-slate-700 hover:bg-slate-50 border-slate-200"}`}
                >
                  <Plus size={12} /> Seed Standard COA
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
              <td className="px-4 py-3 font-mono text-slate-800 font-semibold">{(a.currentBalance ?? a.openingBalance ?? 0).toLocaleString()}</td>
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
            <FField label="Amount (₨)" required>
              <FInput type="number" placeholder="0" value={feeForm.amount} onChange={e => setFeeForm(f => ({ ...f, amount: e.target.value }))} />
            </FField>

            <div className="col-span-2">
              <FField label="Grade / Class & Section" required>
                <div className="border border-slate-200 rounded-lg max-h-56 overflow-y-auto divide-y divide-slate-100">
                  {grades.length === 0 ? (
                    <p className="px-3 py-4 text-xs text-slate-400 text-center">No classes set up yet. Add grades/sections under Institution Setup first.</p>
                  ) : (grades as any[]).map((g: any) => {
                    const names = sectionNamesOf(g);
                    const allSelected = names.every(sn => isClassSelected(g.name, sn));
                    return (
                      <div key={g._id} className="px-3 py-2">
                        <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                          <input type="checkbox" checked={allSelected} onChange={() => toggleWholeGrade(g)} />
                          {g.name}
                        </label>
                        {g.sections && g.sections.length > 0 && (
                          <div className="flex flex-wrap gap-3 mt-1.5 ml-5">
                            {g.sections.map((s: any) => (
                              <label key={s._id} className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isClassSelected(g.name, s.name)}
                                  onChange={() => toggleClassSection(g.name, s.name)}
                                />
                                Section {s.name}
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {selectedClasses.length > 0 && (
                  <p className="text-xs text-slate-400 mt-1">{selectedClasses.length} class/section{selectedClasses.length !== 1 ? "s" : ""} selected</p>
                )}
              </FField>
            </div>

            <FField label="Frequency">
              <FSelect value={feeForm.freq} onChange={e => setFeeForm(f => ({ ...f, freq: e.target.value }))}>
                {FREQUENCY_OPTIONS.map(o => <option key={o}>{o}</option>)}
              </FSelect>
            </FField>
            {feeForm.freq === "Custom" && (
              <FField label="Custom Frequency Label" required>
                <FInput placeholder="e.g. Every 2 Months" value={feeForm.customFreq} onChange={e => setFeeForm(f => ({ ...f, customFreq: e.target.value }))} />
              </FField>
            )}
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
                {(campuses as any[]).map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
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
          <ModalFooter
            onCancel={() => setShowFeeModal(false)}
            onSave={saveFeeStructure}
            saveLabel={createFeeHeadMutation.isPending ? "Saving…" : "Add Fee Structure"}
          />
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

// ─── TAB: FEE ASSIGNMENT (Discounts, Scholarships & Challan Generation) ──────
type ProgramForm = { name: string; type: string; valueType: string; value: string; maxAmount: string; description: string; validFrom: string; validTo: string; status: string };
const BLANK_PROGRAM: ProgramForm = { name: "", type: "scholarship", valueType: "percentage", value: "", maxAmount: "", description: "", validFrom: "", validTo: "", status: "Active" };

type AssignForm = {
  targetType: "student" | "family" | "class" | "section" | "campus";
  studentId: string;
  familyQuery: string;
  familyId: string;
  familyLabel: string;
  grade: string;
  section: string;
  campus: string;
  mode: "program" | "custom";
  programId: string;
  overrideValueType: string;
  overrideValue: string;
  feeHeadName: string;
  effectiveFrom: string;
  effectiveTo: string;
  notes: string;
};
const BLANK_ASSIGN: AssignForm = {
  targetType: "student", studentId: "", familyQuery: "", familyId: "", familyLabel: "",
  grade: "", section: "", campus: "",
  mode: "program", programId: "", overrideValueType: "percentage", overrideValue: "",
  feeHeadName: "", effectiveFrom: "", effectiveTo: "", notes: "",
};

function FeeAssignmentTab() {
  const queryClient = useQueryClient();

  const { data: programs = [], isLoading: programsLoading } = useQuery({ queryKey: ["discount-programs"], queryFn: financeService.getDiscountPrograms });
  const { data: assignmentsList = [], isLoading: assignmentsLoading } = useQuery({ queryKey: ["fee-assignments"], queryFn: financeService.getFeeAssignments });
  const { data: grades = [] } = useQuery({ queryKey: ["grades"], queryFn: () => organizationService.getGrades() });
  const { data: campuses = [] } = useQuery({ queryKey: ["campuses"], queryFn: organizationService.getCampuses });

  const [showProgramModal, setShowProgramModal] = useState(false);
  const [programForm, setProgramForm] = useState<ProgramForm>({ ...BLANK_PROGRAM });

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignForm, setAssignForm] = useState<AssignForm>({ ...BLANK_ASSIGN });
  const [familyResults, setFamilyResults] = useState<any[]>([]);

  const [genMonth, setGenMonth] = useState(new Date().toISOString().slice(0, 7));
  const [genScope, setGenScope] = useState<"all" | "class" | "section" | "campus" | "student">("all");
  const [genGrade, setGenGrade] = useState("");
  const [genSection, setGenSection] = useState("");
  const [genCampus, setGenCampus] = useState("");
  const [genStudentId, setGenStudentId] = useState("");
  const [genResult, setGenResult] = useState<any | null>(null);

  const createProgram = useMutation({
    mutationFn: financeService.createDiscountProgram,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discount-programs"] });
      toast.success("Discount/Scholarship program created");
      setShowProgramModal(false);
      setProgramForm({ ...BLANK_PROGRAM });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to create program"),
  });

  const toggleProgram = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => financeService.updateDiscountProgram(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discount-programs"] });
      toast.success("Updated");
    },
  });

  const createAssignment = useMutation({
    mutationFn: financeService.createFeeAssignment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fee-assignments"] });
      toast.success("Assigned");
      setShowAssignModal(false);
      setAssignForm({ ...BLANK_ASSIGN });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to assign"),
  });

  const removeAssignment = useMutation({
    mutationFn: (id: string) => financeService.deleteFeeAssignment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fee-assignments"] });
      toast.success("Removed");
    },
  });

  const generateMutation = useMutation({
    mutationFn: (payload: any) => financeService.generateInvoices(payload),
    onSuccess: (result: any) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      setGenResult(result);
      toast.success(`Generated ${result.created} challan${result.created !== 1 ? "s" : ""}${result.skipped ? `, skipped ${result.skipped}` : ""}`);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to generate challans"),
  });

  function saveProgram() {
    if (!programForm.name.trim()) { toast.error("Program name is required"); return; }
    if (!programForm.value || Number(programForm.value) <= 0) { toast.error("Value is required"); return; }
    createProgram.mutate({
      name: programForm.name,
      type: programForm.type,
      valueType: programForm.valueType,
      value: Number(programForm.value),
      maxAmount: programForm.maxAmount ? Number(programForm.maxAmount) : undefined,
      description: programForm.description || undefined,
      validFrom: programForm.validFrom || undefined,
      validTo: programForm.validTo || undefined,
      isActive: programForm.status === "Active",
    });
  }

  async function searchFamilies(q: string) {
    setAssignForm(f => ({ ...f, familyQuery: q, familyId: "", familyLabel: "" }));
    if (q.trim().length < 2) { setFamilyResults([]); return; }
    try {
      const res = await familiesService.getFamilies(q);
      setFamilyResults(res || []);
    } catch { setFamilyResults([]); }
  }

  function selectFamily(f: any) {
    setAssignForm(prev => ({ ...prev, familyId: f._id, familyLabel: `${f.familyCode} — ${f.primaryGuardianName || "Unnamed"}`, familyQuery: "" }));
    setFamilyResults([]);
  }

  function saveAssignment() {
    let targetValue = "";
    let targetLabel = "";
    if (assignForm.targetType === "student") {
      if (!assignForm.studentId) { toast.error("Select a student"); return; }
      targetValue = assignForm.studentId;
      targetLabel = "Student";
    } else if (assignForm.targetType === "family") {
      if (!assignForm.familyId) { toast.error("Select a family"); return; }
      targetValue = assignForm.familyId;
      targetLabel = assignForm.familyLabel;
    } else if (assignForm.targetType === "class") {
      if (!assignForm.grade) { toast.error("Select a class"); return; }
      targetValue = assignForm.grade;
      targetLabel = assignForm.grade;
    } else if (assignForm.targetType === "section") {
      if (!assignForm.grade || !assignForm.section) { toast.error("Select class and section"); return; }
      targetValue = `${assignForm.grade}::${assignForm.section}`;
      targetLabel = `${assignForm.grade} - Section ${assignForm.section}`;
    } else if (assignForm.targetType === "campus") {
      if (!assignForm.campus) { toast.error("Select a campus"); return; }
      targetValue = assignForm.campus;
      targetLabel = assignForm.campus;
    }

    if (assignForm.mode === "program" && !assignForm.programId) { toast.error("Select a discount/scholarship program"); return; }
    if (assignForm.mode === "custom" && (!assignForm.overrideValue || Number(assignForm.overrideValue) <= 0)) { toast.error("Enter a discount value"); return; }

    createAssignment.mutate({
      targetType: assignForm.targetType,
      targetValue,
      targetLabel,
      discountProgramId: assignForm.mode === "program" ? assignForm.programId : undefined,
      overrideValueType: assignForm.mode === "custom" ? assignForm.overrideValueType : undefined,
      overrideValue: assignForm.mode === "custom" ? Number(assignForm.overrideValue) : undefined,
      feeHeadName: assignForm.feeHeadName || undefined,
      effectiveFrom: assignForm.effectiveFrom || undefined,
      effectiveTo: assignForm.effectiveTo || undefined,
      notes: assignForm.notes || undefined,
    });
  }

  function runGenerate() {
    if (!genMonth) { toast.error("Select a month"); return; }
    let scopeValue: string | undefined;
    if (genScope === "class") scopeValue = genGrade;
    if (genScope === "section") scopeValue = `${genGrade}::${genSection}`;
    if (genScope === "campus") scopeValue = genCampus;
    if (genScope === "student") scopeValue = genStudentId;
    if (genScope !== "all" && !scopeValue) { toast.error("Select a target for this scope"); return; }
    setGenResult(null);
    generateMutation.mutate({ month: genMonth, scopeType: genScope, scopeValue });
  }

  const sectionsForGrade = (gradeName: string) => (grades as any[]).find((g: any) => g.name === gradeName)?.sections || [];

  return (
    <div className="space-y-5">
      {/* Generate Challans */}
      <Card>
        <CardHeader title="Generate Challans" sub="Create real invoices for a month from Fee Structure + applicable discounts" />
        <div className="p-4 grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
          <FField label="Month">
            <input type="month" value={genMonth} onChange={e => setGenMonth(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
          </FField>
          <FField label="Scope">
            <FSelect value={genScope} onChange={e => setGenScope(e.target.value as any)}>
              <option value="all">All Active Students</option>
              <option value="class">By Class</option>
              <option value="section">By Class + Section</option>
              <option value="campus">By Campus</option>
              <option value="student">Single Student</option>
            </FSelect>
          </FField>
          {(genScope === "class" || genScope === "section") && (
            <FField label="Class">
              <FSelect value={genGrade} onChange={e => { setGenGrade(e.target.value); setGenSection(""); }}>
                <option value="">Select…</option>
                {(grades as any[]).map((g: any) => <option key={g._id} value={g.name}>{g.name}</option>)}
              </FSelect>
            </FField>
          )}
          {genScope === "section" && (
            <FField label="Section">
              <FSelect value={genSection} onChange={e => setGenSection(e.target.value)}>
                <option value="">Select…</option>
                {sectionsForGrade(genGrade).map((s: any) => <option key={s._id} value={s.name}>{s.name}</option>)}
              </FSelect>
            </FField>
          )}
          {genScope === "campus" && (
            <FField label="Campus">
              <FSelect value={genCampus} onChange={e => setGenCampus(e.target.value)}>
                <option value="">Select…</option>
                {(campuses as any[]).map((c: any) => <option key={c._id} value={c.name}>{c.name}</option>)}
              </FSelect>
            </FField>
          )}
          {genScope === "student" && (
            <div className="col-span-2">
              <FField label="Student">
                <StudentSelect value={genStudentId} onChange={(id) => setGenStudentId(id)} />
              </FField>
            </div>
          )}
          <Btn variant="primary" onClick={runGenerate}>
            {generateMutation.isPending ? "Generating…" : "⚡ Generate Challans"}
          </Btn>
        </div>
        {genResult && (
          <div className="px-4 pb-4">
            <div className="border border-slate-100 rounded-lg p-3 text-sm flex flex-wrap gap-4">
              <span className="text-emerald-600 font-semibold">✓ {genResult.created} created</span>
              <span className="text-slate-500">{genResult.skipped} skipped (already billed or no fee structure match)</span>
              {genResult.errors?.length > 0 && <span className="text-red-500">{genResult.errors.length} errors</span>}
            </div>
            {genResult.errors?.length > 0 && (
              <ul className="mt-2 text-xs text-red-500 list-disc pl-5">
                {genResult.errors.slice(0, 5).map((e: string, i: number) => <li key={i}>{e}</li>)}
              </ul>
            )}
          </div>
        )}
      </Card>

      {/* Discount / Scholarship Programs */}
      <Card>
        <CardHeader
          title="Discount & Scholarship Programs"
          sub="Reusable templates you can assign to students, families, classes, sections, or campuses"
          actions={<Btn variant="primary" onClick={() => setShowProgramModal(true)}><Plus size={12} /> New Program</Btn>}
        />
        <TableWrap headers={["Name", "Type", "Value", "Max Cap", "Validity", "Status", "Action"]}>
          {programsLoading ? (
            <tr><td colSpan={7} className="px-4 py-12 text-center"><div className="w-6 h-6 border-4 border-[#0C447C] border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
          ) : (programs as any[]).length === 0 ? (
            <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-400">No discount/scholarship programs yet.</td></tr>
          ) : (programs as any[]).map((p: any) => (
            <tr key={p._id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-semibold text-slate-800">{p.name}</td>
              <td className="px-4 py-3 text-xs text-slate-600 capitalize">{p.type}</td>
              <td className="px-4 py-3 font-mono text-[#0C447C] font-bold">{p.valueType === "percentage" ? `${p.value}%` : `₨ ${(p.value || 0).toLocaleString()}`}</td>
              <td className="px-4 py-3 text-xs text-slate-500">{p.maxAmount ? `₨ ${p.maxAmount.toLocaleString()}` : "—"}</td>
              <td className="px-4 py-3 text-xs text-slate-500">{p.validFrom || p.validTo ? `${p.validFrom ? new Date(p.validFrom).toLocaleDateString() : "…"} – ${p.validTo ? new Date(p.validTo).toLocaleDateString() : "…"}` : "Always"}</td>
              <td className="px-4 py-3"><Badge v={p.isActive ? "green" : "gray"}>{p.isActive ? "Active" : "Inactive"}</Badge></td>
              <td className="px-4 py-3">
                <button onClick={() => toggleProgram.mutate({ id: p._id, isActive: !p.isActive })} className="p-1.5 text-slate-400 hover:text-[#0C447C] hover:bg-blue-50 rounded-lg" title={p.isActive ? "Deactivate" : "Activate"}><Edit size={13} /></button>
              </td>
            </tr>
          ))}
        </TableWrap>
      </Card>

      {/* Fee Assignments */}
      <Card>
        <CardHeader
          title="Fee Assignments"
          sub="Who actually gets which discount, scholarship, or grant"
          actions={<Btn variant="primary" onClick={() => setShowAssignModal(true)}><Plus size={12} /> Assign Fee/Discount</Btn>}
        />
        <TableWrap headers={["Target", "Discount / Scholarship", "Fee Head", "Effective", "Notes", "Action"]}>
          {assignmentsLoading ? (
            <tr><td colSpan={6} className="px-4 py-12 text-center"><div className="w-6 h-6 border-4 border-[#0C447C] border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
          ) : (assignmentsList as any[]).length === 0 ? (
            <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-400">No fee assignments yet.</td></tr>
          ) : (assignmentsList as any[]).map((a: any) => (
            <tr key={a._id} className="hover:bg-slate-50">
              <td className="px-4 py-3">
                <span className="text-xs font-semibold uppercase text-slate-400 mr-1">{a.targetType}</span>
                <span className="text-sm font-semibold text-slate-800">{a.targetLabel || a.targetValue}</span>
              </td>
              <td className="px-4 py-3 text-xs text-slate-600">
                {a.discountProgramName || (a.overrideValueType === "percentage" ? `${a.overrideValue}% (custom)` : `₨ ${(a.overrideValue || 0).toLocaleString()} (custom)`)}
              </td>
              <td className="px-4 py-3 text-xs text-slate-500">{a.feeHeadName || "All fee heads"}</td>
              <td className="px-4 py-3 text-xs text-slate-500">{a.effectiveFrom || a.effectiveTo ? `${a.effectiveFrom ? new Date(a.effectiveFrom).toLocaleDateString() : "…"} – ${a.effectiveTo ? new Date(a.effectiveTo).toLocaleDateString() : "…"}` : "Always"}</td>
              <td className="px-4 py-3 text-xs text-slate-500">{a.notes || "—"}</td>
              <td className="px-4 py-3">
                <button onClick={() => removeAssignment.mutate(a._id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Remove"><Trash2 size={13} /></button>
              </td>
            </tr>
          ))}
        </TableWrap>
      </Card>

      {/* Add Program Modal */}
      {showProgramModal && (
        <Modal title="New Discount / Scholarship Program" size="lg" onClose={() => setShowProgramModal(false)}>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <FField label="Program Name" required>
                <FInput placeholder="e.g. Merit Scholarship 2026" value={programForm.name} onChange={e => setProgramForm(f => ({ ...f, name: e.target.value }))} />
              </FField>
            </div>
            <FField label="Type">
              <FSelect value={programForm.type} onChange={e => setProgramForm(f => ({ ...f, type: e.target.value }))}>
                <option value="scholarship">Scholarship</option>
                <option value="discount">Discount</option>
                <option value="grant">Grant</option>
                <option value="incentive">Incentive</option>
              </FSelect>
            </FField>
            <FField label="Value Type">
              <FSelect value={programForm.valueType} onChange={e => setProgramForm(f => ({ ...f, valueType: e.target.value }))}>
                <option value="percentage">Percentage (%)</option>
                <option value="flat">Flat Amount (₨)</option>
              </FSelect>
            </FField>
            <FField label={programForm.valueType === "percentage" ? "Value (%)" : "Value (₨)"} required>
              <FInput type="number" value={programForm.value} onChange={e => setProgramForm(f => ({ ...f, value: e.target.value }))} placeholder="0" />
            </FField>
            {programForm.valueType === "percentage" && (
              <FField label="Max Cap (₨, optional)">
                <FInput type="number" value={programForm.maxAmount} onChange={e => setProgramForm(f => ({ ...f, maxAmount: e.target.value }))} placeholder="No cap" />
              </FField>
            )}
            <FField label="Valid From">
              <FInput type="date" value={programForm.validFrom} onChange={e => setProgramForm(f => ({ ...f, validFrom: e.target.value }))} />
            </FField>
            <FField label="Valid To">
              <FInput type="date" value={programForm.validTo} onChange={e => setProgramForm(f => ({ ...f, validTo: e.target.value }))} />
            </FField>
            <FField label="Status">
              <FSelect value={programForm.status} onChange={e => setProgramForm(f => ({ ...f, status: e.target.value }))}>
                <option>Active</option><option>Inactive</option>
              </FSelect>
            </FField>
            <div className="col-span-2">
              <FField label="Description">
                <FInput value={programForm.description} onChange={e => setProgramForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional" />
              </FField>
            </div>
          </div>
          <ModalFooter onCancel={() => setShowProgramModal(false)} onSave={saveProgram} saveLabel={createProgram.isPending ? "Saving…" : "＋ Create Program"} />
        </Modal>
      )}

      {/* Assign Fee/Discount Modal */}
      {showAssignModal && (
        <Modal title="Assign Fee / Discount" size="lg" onClose={() => setShowAssignModal(false)}>
          <div className="space-y-4">
            <FField label="Assign To" required>
              <FSelect value={assignForm.targetType} onChange={e => setAssignForm(() => ({ ...BLANK_ASSIGN, targetType: e.target.value as any }))}>
                <option value="student">Specific Student</option>
                <option value="family">Family</option>
                <option value="class">Whole Class</option>
                <option value="section">Class + Section</option>
                <option value="campus">Whole Campus</option>
              </FSelect>
            </FField>

            {assignForm.targetType === "student" && (
              <FField label="Student" required>
                <StudentSelect value={assignForm.studentId} onChange={(id) => setAssignForm(f => ({ ...f, studentId: id }))} />
              </FField>
            )}

            {assignForm.targetType === "family" && (
              <FField label="Family" required>
                {assignForm.familyId ? (
                  <div className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                    <span className="text-sm font-semibold">{assignForm.familyLabel}</span>
                    <button onClick={() => setAssignForm(f => ({ ...f, familyId: "", familyLabel: "" }))} className="text-slate-400 hover:text-slate-600"><X size={14} /></button>
                  </div>
                ) : (
                  <div className="relative">
                    <SearchBar placeholder="Search by guardian name or phone…" value={assignForm.familyQuery} onChange={searchFamilies} />
                    {familyResults.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {familyResults.map((fam: any) => (
                          <button key={fam._id} onClick={() => selectFamily(fam)} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 border-b border-slate-50 last:border-0">
                            {fam.familyCode} — {fam.primaryGuardianName || "Unnamed"} {fam.phone ? `(${fam.phone})` : ""}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </FField>
            )}

            {(assignForm.targetType === "class" || assignForm.targetType === "section") && (
              <div className="grid grid-cols-2 gap-3">
                <FField label="Class" required>
                  <FSelect value={assignForm.grade} onChange={e => setAssignForm(f => ({ ...f, grade: e.target.value, section: "" }))}>
                    <option value="">Select…</option>
                    {(grades as any[]).map((g: any) => <option key={g._id} value={g.name}>{g.name}</option>)}
                  </FSelect>
                </FField>
                {assignForm.targetType === "section" && (
                  <FField label="Section" required>
                    <FSelect value={assignForm.section} onChange={e => setAssignForm(f => ({ ...f, section: e.target.value }))}>
                      <option value="">Select…</option>
                      {sectionsForGrade(assignForm.grade).map((s: any) => <option key={s._id} value={s.name}>{s.name}</option>)}
                    </FSelect>
                  </FField>
                )}
              </div>
            )}

            {assignForm.targetType === "campus" && (
              <FField label="Campus" required>
                <FSelect value={assignForm.campus} onChange={e => setAssignForm(f => ({ ...f, campus: e.target.value }))}>
                  <option value="">Select…</option>
                  {(campuses as any[]).map((c: any) => <option key={c._id} value={c.name}>{c.name}</option>)}
                </FSelect>
              </FField>
            )}

            <div className="border-t border-slate-100 pt-4 space-y-3">
              <FField label="Discount Source">
                <div className="flex gap-2">
                  <button onClick={() => setAssignForm(f => ({ ...f, mode: "program" }))} className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border ${assignForm.mode === "program" ? "bg-[#0C447C] text-white border-[#0C447C]" : "border-slate-200 text-slate-600"}`}>Use a Program</button>
                  <button onClick={() => setAssignForm(f => ({ ...f, mode: "custom" }))} className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border ${assignForm.mode === "custom" ? "bg-[#0C447C] text-white border-[#0C447C]" : "border-slate-200 text-slate-600"}`}>Custom One-Off</button>
                </div>
              </FField>
              {assignForm.mode === "program" ? (
                <FField label="Discount / Scholarship Program" required>
                  <FSelect value={assignForm.programId} onChange={e => setAssignForm(f => ({ ...f, programId: e.target.value }))}>
                    <option value="">Select…</option>
                    {(programs as any[]).filter((p: any) => p.isActive).map((p: any) => (
                      <option key={p._id} value={p._id}>{p.name} ({p.valueType === "percentage" ? `${p.value}%` : `₨${p.value}`})</option>
                    ))}
                  </FSelect>
                </FField>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <FField label="Value Type">
                    <FSelect value={assignForm.overrideValueType} onChange={e => setAssignForm(f => ({ ...f, overrideValueType: e.target.value }))}>
                      <option value="percentage">Percentage (%)</option>
                      <option value="flat">Flat Amount (₨)</option>
                    </FSelect>
                  </FField>
                  <FField label="Value" required>
                    <FInput type="number" value={assignForm.overrideValue} onChange={e => setAssignForm(f => ({ ...f, overrideValue: e.target.value }))} placeholder="0" />
                  </FField>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FField label="Restrict to Fee Head (optional)">
                <FInput value={assignForm.feeHeadName} onChange={e => setAssignForm(f => ({ ...f, feeHeadName: e.target.value }))} placeholder="e.g. Tuition Fee — leave blank for all" />
              </FField>
              <FField label="Notes">
                <FInput value={assignForm.notes} onChange={e => setAssignForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional" />
              </FField>
              <FField label="Effective From">
                <FInput type="date" value={assignForm.effectiveFrom} onChange={e => setAssignForm(f => ({ ...f, effectiveFrom: e.target.value }))} />
              </FField>
              <FField label="Effective To">
                <FInput type="date" value={assignForm.effectiveTo} onChange={e => setAssignForm(f => ({ ...f, effectiveTo: e.target.value }))} />
              </FField>
            </div>
          </div>
          <ModalFooter onCancel={() => setShowAssignModal(false)} onSave={saveAssignment} saveLabel={createAssignment.isPending ? "Saving…" : "＋ Assign"} />
        </Modal>
      )}
    </div>
  );
}

// ─── TAB: ACCOUNTS RECEIVABLE ─────────────────────────────────────────────────
function ReceivableTab() {
  const [search, setSearch] = useState("");
  const [viewInvoice, setViewInvoice] = useState<any | null>(null);
  const [showCollectFee, setShowCollectFee] = useState(false);
  const { data: invoices = [], isLoading: invLoading } = useQuery({ queryKey: ["invoices"], queryFn: () => financeService.getInvoices() });
  const filtered = (invoices as any[]).filter(inv =>
    (inv.studentName || "").toLowerCase().includes(search.toLowerCase()) ||
    (inv.grade || "").toLowerCase().includes(search.toLowerCase()) ||
    (inv.invoiceNumber || "").toLowerCase().includes(search.toLowerCase())
  );
  function invStatusVariant(s: string): BV {
    const m: Record<string,BV> = { paid: "green", partial: "amber", overdue: "red", sent: "blue", draft: "gray", cancelled: "gray", waived: "purple" };
    return m[s] ?? "gray";
  }
  const now = Date.now();
  const dueAgeMs = (inv: any) => inv.dueDate ? now - new Date(inv.dueDate).getTime() : 0;
  const totalReceivable = (invoices as any[]).reduce((a, i) => a + (i.balanceDue || 0), 0);
  const currentDue = (invoices as any[]).filter(i => i.balanceDue > 0 && dueAgeMs(i) <= 30 * 86400000).reduce((a, i) => a + i.balanceDue, 0);
  const due30to90 = (invoices as any[]).filter(i => i.balanceDue > 0 && dueAgeMs(i) > 30 * 86400000 && dueAgeMs(i) <= 90 * 86400000).reduce((a, i) => a + i.balanceDue, 0);
  const overdue90 = (invoices as any[]).filter(i => i.balanceDue > 0 && dueAgeMs(i) > 90 * 86400000).reduce((a, i) => a + i.balanceDue, 0);
  const fmt = (n: number) => n >= 1_000_000 ? `₨ ${(n / 1_000_000).toFixed(2)}M` : `₨ ${n.toLocaleString()}`;

  function exportCsv() {
    const rows = [["Invoice #", "Student", "Grade", "Total Due", "Paid", "Balance", "Due Date", "Status"]];
    filtered.forEach(inv => rows.push([inv.invoiceNumber, inv.studentName, inv.grade, String(inv.totalAmount || 0), String(inv.paidAmount || 0), String(inv.balanceDue || 0), inv.dueDate || "", inv.status]));
    const csv = rows.map(r => r.map(c => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "student-fee-ledger.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPI icon={Clock} label="Total Receivable"   value={fmt(totalReceivable)} color="#0C447C" />
        <KPI icon={CheckCircle} label="Current Due"  value={fmt(currentDue)} sub="Within 30 days"   color="#10b981" />
        <KPI icon={AlertTriangle} label="30–90 Days" value={fmt(due30to90)} color="#EF9F27" />
        <KPI icon={XCircle} label="90+ Days Overdue" value={fmt(overdue90)} sub="High risk"   color="#ef4444" />
      </div>
      <Card>
        <CardHeader
          title="Student Fee Ledger"
          sub="All campuses"
          actions={
            <>
              <SearchBar placeholder="Search student…" value={search} onChange={setSearch} />
              <Btn variant="secondary" onClick={() => toast.success(`Reminder queued for ${filtered.filter(i => i.balanceDue > 0).length} students with outstanding balances`)}><Send size={12} /> Bulk Reminders</Btn>
              <Btn variant="secondary" onClick={exportCsv}><Download size={12} /> Export</Btn>
              <Btn variant="primary" onClick={() => setShowCollectFee(true)}><Plus size={12} /> Collect Fee</Btn>
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
              <td className="px-4 py-3 font-mono text-xs text-[#0C447C] font-bold">{inv.invoiceNumber}</td>
              <td className="px-4 py-3 font-semibold text-slate-800">{inv.studentName || "—"}</td>
              <td className="px-4 py-3 text-slate-600 text-xs">{inv.grade || "—"}</td>
              <td className="px-4 py-3 font-mono text-slate-700">{(inv.totalAmount || 0).toLocaleString()}</td>
              <td className="px-4 py-3 font-mono text-emerald-600 font-semibold">{(inv.paidAmount || 0).toLocaleString()}</td>
              <td className={`px-4 py-3 font-mono font-bold ${inv.balanceDue === 0 ? "text-emerald-600" : inv.status === "overdue" ? "text-red-600" : "text-amber-600"}`}>
                {(inv.balanceDue || 0).toLocaleString()}
              </td>
              <td className="px-4 py-3 text-xs text-slate-500">{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "—"}</td>
              <td className="px-4 py-3"><Badge v={invStatusVariant(inv.status)}>{inv.status}</Badge></td>
              <td className="px-4 py-3">
                <div className="flex gap-1">
                  <button onClick={() => setViewInvoice(inv)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="View"><Eye size={13} /></button>
                  <button onClick={() => toast.success(`Reminder sent to ${inv.studentName}`)} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg" title="Send Reminder"><Send size={13} /></button>
                </div>
              </td>
            </tr>
          ))}
        </TableWrap>
        <div className="px-4 py-3 border-t border-slate-50 text-xs text-slate-400">
          Showing {filtered.length} of {(invoices as any[]).length} invoices
        </div>
      </Card>

      {showCollectFee && <CollectFeeModal onClose={() => setShowCollectFee(false)} />}

      {viewInvoice && (
        <Modal title={`Invoice ${viewInvoice.invoiceNumber}`} onClose={() => setViewInvoice(null)}>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-xs text-slate-400">Student</p><p className="font-semibold">{viewInvoice.studentName}</p></div>
            <div><p className="text-xs text-slate-400">Grade</p><p className="font-semibold">{viewInvoice.grade}</p></div>
            <div><p className="text-xs text-slate-400">Total Amount</p><p className="font-semibold">₨ {(viewInvoice.totalAmount || 0).toLocaleString()}</p></div>
            <div><p className="text-xs text-slate-400">Paid</p><p className="font-semibold text-emerald-600">₨ {(viewInvoice.paidAmount || 0).toLocaleString()}</p></div>
            <div><p className="text-xs text-slate-400">Balance</p><p className="font-semibold">₨ {(viewInvoice.balanceDue || 0).toLocaleString()}</p></div>
            <div><p className="text-xs text-slate-400">Status</p><Badge v={invStatusVariant(viewInvoice.status)}>{viewInvoice.status}</Badge></div>
            <div className="col-span-2">
              <p className="text-xs text-slate-400 mb-1">Line Items</p>
              {(viewInvoice.items || []).map((it: any, i: number) => (
                <div key={i} className="flex justify-between text-xs py-1 border-b border-slate-50">
                  <span>{it.description}</span><span className="font-mono">₨ {(it.amount || 0).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <Btn
              variant="secondary"
              size="md"
              onClick={async () => {
                try {
                  const blob = await pdfApi.generateInvoicePdf({ invoiceId: viewInvoice._id });
                  pdfApi.downloadBlob(blob, `challan-${viewInvoice.invoiceNumber}.pdf`);
                } catch (err: any) {
                  toast.error(err.response?.data?.message || "Failed to download challan PDF");
                }
              }}
            ><Download size={14} /> Download Challan</Btn>
          </div>
          <ModalFooter onCancel={() => setViewInvoice(null)} onSave={() => setViewInvoice(null)} saveLabel="Close" />
        </Modal>
      )}
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
  const [viewExpense, setViewExpense] = useState<any | null>(null);

  const queryClient = useQueryClient();
  const { data: expenses = [], isLoading: expLoading } = useQuery({ queryKey: ["expenses"], queryFn: financeService.getExpenses });
  const { data: payments = [] } = useQuery({ queryKey: ["payments"], queryFn: financeService.getPayments });
  const { data: campuses = [] } = useQuery({ queryKey: ["campuses"], queryFn: organizationService.getCampuses });
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
  const approveExpenseMutation = useMutation({
    mutationFn: (id: string) => financeService.approveExpense(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["expenses"] }); toast.success("Expense approved"); },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to approve"),
  });
  const payExpenseMutation = useMutation({
    mutationFn: (id: string) => financeService.payExpense(id, { paymentMethod: "bank_transfer" }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["expenses"] }); toast.success("Expense marked as paid"); },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to mark paid"),
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
  const fmt = (n: number) => n >= 1_000_000 ? `₨ ${(n / 1_000_000).toFixed(2)}M` : `₨ ${n.toLocaleString()}`;
  const list = expenses as any[];
  const totalPayables = list.filter(e => e.status === "submitted" || e.status === "approved").reduce((a, e) => a + (e.amount || 0), 0);
  const pendingApproval = list.filter(e => e.status === "submitted").reduce((a, e) => a + (e.amount || 0), 0);
  const approvedAwaiting = list.filter(e => e.status === "approved").reduce((a, e) => a + (e.amount || 0), 0);
  const totalPaid = list.filter(e => e.status === "paid").reduce((a, e) => a + (e.amount || 0), 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPI icon={CreditCard}    label="Total Payables"        value={fmt(totalPayables)}  sub="Submitted + approved" color="#0C447C" />
        <KPI icon={AlertTriangle} label="Pending Approval"      value={fmt(pendingApproval)} sub={`${list.filter(e => e.status === "submitted").length} expenses`} color="#ef4444" />
        <KPI icon={Clock}         label="Approved, Awaiting Pay" value={fmt(approvedAwaiting)} color="#EF9F27" />
        <KPI icon={CheckCircle}   label="Total Paid"            value={fmt(totalPaid)}      sub={`${(payments as any[]).length} payments recorded`} color="#10b981" />
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
              <td className="px-4 py-3 text-xs text-slate-500">{exp.date ? new Date(exp.date).toLocaleDateString() : "—"}</td>
              <td className="px-4 py-3"><Badge v={exp.status === "approved" || exp.status === "paid" ? "green" : exp.status === "rejected" ? "red" : exp.status === "submitted" ? "amber" : "blue"}>{exp.status}</Badge></td>
              <td className="px-4 py-3">
                <div className="flex gap-1">
                  {exp.status === "submitted" && (
                    <button onClick={() => approveExpenseMutation.mutate(exp._id)} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Approve"><CheckCircle size={13} /></button>
                  )}
                  {exp.status === "approved" && (
                    <button onClick={() => payExpenseMutation.mutate(exp._id)} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Mark Paid"><Wallet size={13} /></button>
                  )}
                  <button onClick={() => setViewExpense(exp)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="View"><Eye size={13} /></button>
                  <button
                    onClick={async () => {
                      try {
                        const blob = await pdfApi.generateVoucherPdf({ expenseId: exp._id, type: "payment_voucher" });
                        pdfApi.downloadBlob(blob, `voucher-${exp._id}.pdf`);
                      } catch (err: any) {
                        toast.error(err.response?.data?.message || "Failed to download voucher PDF");
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-[#0C447C] hover:bg-blue-50 rounded-lg"
                    title="Download Voucher"
                  >
                    <FileText size={13} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </TableWrap>
        <div className="px-4 py-3 border-t border-slate-50 text-xs text-slate-400">
          {filtered.length} expense{filtered.length !== 1 ? "s" : ""} · {(payments as any[]).length} payments recorded
        </div>
      </Card>

      {viewExpense && (
        <Modal title={`Expense ${viewExpense.expenseNo}`} onClose={() => setViewExpense(null)}>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-xs text-slate-400">Description</p><p className="font-semibold">{viewExpense.description}</p></div>
            <div><p className="text-xs text-slate-400">Paid To</p><p className="font-semibold">{viewExpense.paidTo || "—"}</p></div>
            <div><p className="text-xs text-slate-400">Category</p><p className="font-semibold">{viewExpense.category}</p></div>
            <div><p className="text-xs text-slate-400">Amount</p><p className="font-semibold">₨ {(viewExpense.amount || 0).toLocaleString()}</p></div>
            <div><p className="text-xs text-slate-400">Date</p><p className="font-semibold">{viewExpense.date ? new Date(viewExpense.date).toLocaleDateString() : "—"}</p></div>
            <div><p className="text-xs text-slate-400">Status</p><Badge v={viewExpense.status === "approved" || viewExpense.status === "paid" ? "green" : viewExpense.status === "rejected" ? "red" : "amber"}>{viewExpense.status}</Badge></div>
          </div>
          <ModalFooter onCancel={() => setViewExpense(null)} onSave={() => setViewExpense(null)} saveLabel="Close" />
        </Modal>
      )}

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
                {(campuses as any[]).map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
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

function BankingTab() {
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankForm, setBankForm]       = useState<BankForm>(BLANK_BANK);
  const [bankErrors, setBankErrors]   = useState<Record<string, boolean>>({});
  const [reconcileAcc, setReconcileAcc] = useState<any | null>(null);
  const [reconcileValue, setReconcileValue] = useState("");
  const [viewAcc, setViewAcc] = useState<any | null>(null);

  const queryClient = useQueryClient();
  const { data: accounts = [], isLoading: bankLoading } = useQuery({
    queryKey: ["bank-accounts"],
    queryFn: financeService.getBankAccounts,
  });
  const { data: payments = [] } = useQuery({ queryKey: ["payments"], queryFn: financeService.getPayments });
  const { data: expenses = [] } = useQuery({ queryKey: ["expenses"], queryFn: financeService.getExpenses });
  const { data: campuses = [] } = useQuery({ queryKey: ["campuses"], queryFn: organizationService.getCampuses });
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
  const reconcileMutation = useMutation({
    mutationFn: (vars: { id: string; balance: number }) => financeService.updateBankBalance(vars.id, vars.balance),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
      toast.success("Balance reconciled");
      setReconcileAcc(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to reconcile"),
  });

  function openAddBank() { setBankForm(BLANK_BANK); setBankErrors({}); setShowBankModal(true); }
  function openReconcile(acc: any) { setReconcileAcc(acc); setReconcileValue(String(acc.currentBalance ?? acc.openingBalance ?? 0)); }
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
      campus: bankForm.campus,
    });
  }

  const errStyle = (key: string): React.CSSProperties =>
    bankErrors[key] ? { borderColor: "#ef4444", boxShadow: "0 0 0 1px #ef4444" } : {};

  const totalCash = (accounts as any[]).reduce((a, b) => a + (b.currentBalance ?? b.openingBalance ?? 0), 0);
  const totalInflow = (payments as any[]).reduce((a, p) => a + (p.amount || 0), 0);
  const totalOutflow = (expenses as any[]).filter(e => e.status === "paid").reduce((a, e) => a + (e.amount || 0), 0);
  const fmt = (n: number) => n >= 1_000_000 ? `₨ ${(n / 1_000_000).toFixed(2)}M` : `₨ ${n.toLocaleString()}`;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <KPI icon={Landmark}  label="Total Cash in Bank" value={fmt(totalCash)} sub={`${(accounts as any[]).length} linked accounts`} color="#0C447C" />
        <KPI icon={ArrowUp}   label="Total Inflow"       value={fmt(totalInflow)} sub="All fee payments received" color="#10b981" />
        <KPI icon={ArrowDown} label="Total Outflow"      value={fmt(totalOutflow)} sub="All paid expenses" color="#ef4444" />
      </div>
      <Card>
        <CardHeader
          title="Bank Accounts"
          sub="Linked accounts overview"
          actions={
            <>
              <Btn variant="secondary" onClick={() => (accounts as any[])[0] ? openReconcile((accounts as any[])[0]) : toast.error("Add a bank account first")}><RefreshCw size={12} /> Reconcile</Btn>
              <Btn variant="primary" onClick={openAddBank}><Plus size={12} /> Add Account</Btn>
            </>
          }
        />
        <TableWrap headers={["Bank Name", "Account Title", "Account Number", "IBAN", "Branch", "Campus", "Balance (₨)", "Type", "Status", "Action"]}>
          {bankLoading ? (
            <tr><td colSpan={10} className="px-4 py-12 text-center"><div className="w-6 h-6 border-4 border-[#0C447C] border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
          ) : (accounts as any[]).length === 0 ? (
            <tr><td colSpan={10} className="px-4 py-12 text-center text-sm text-slate-400">No bank accounts yet. Click + Add Account to add one.</td></tr>
          ) : (accounts as any[]).map((b: any, i: number) => (
            <tr key={b._id || i} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">{b.bankName}</td>
              <td className="px-4 py-3 text-slate-600 text-xs">{b.accountTitle}</td>
              <td className="px-4 py-3 font-mono text-xs text-slate-500">{b.accountNumber}</td>
              <td className="px-4 py-3 font-mono text-xs text-slate-400">{b.iban || "—"}</td>
              <td className="px-4 py-3 text-slate-600 text-xs">{b.branchName || "—"}</td>
              <td className="px-4 py-3 text-slate-600 text-xs">{b.campus || "—"}</td>
              <td className="px-4 py-3 font-mono font-bold text-[#0C447C]">{(b.currentBalance ?? b.openingBalance ?? 0).toLocaleString()}</td>
              <td className="px-4 py-3 text-slate-600 text-xs">{b.accountType}</td>
              <td className="px-4 py-3"><Badge v={b.isActive ? "green" : "gray"}>{b.isActive ? "Active" : "Inactive"}</Badge></td>
              <td className="px-4 py-3">
                <div className="flex gap-1">
                  <button onClick={() => setViewAcc(b)} className="p-1.5 text-slate-400 hover:text-[#0C447C] hover:bg-blue-50 rounded-lg" title="View"><Eye size={14} /></button>
                  <button onClick={() => openReconcile(b)} className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg" title="Reconcile"><RefreshCw size={14} /></button>
                </div>
              </td>
            </tr>
          ))}
        </TableWrap>
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
                {(campuses as any[]).map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
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

      {viewAcc && (
        <Modal title={viewAcc.bankName} onClose={() => setViewAcc(null)}>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-xs text-slate-400">Account Title</p><p className="font-semibold">{viewAcc.accountTitle}</p></div>
            <div><p className="text-xs text-slate-400">Account Number</p><p className="font-mono font-semibold">{viewAcc.accountNumber}</p></div>
            <div><p className="text-xs text-slate-400">IBAN</p><p className="font-mono font-semibold">{viewAcc.iban || "—"}</p></div>
            <div><p className="text-xs text-slate-400">Branch</p><p className="font-semibold">{viewAcc.branchName || "—"}</p></div>
            <div><p className="text-xs text-slate-400">Type</p><p className="font-semibold">{viewAcc.accountType}</p></div>
            <div><p className="text-xs text-slate-400">Campus</p><p className="font-semibold">{viewAcc.campus || "—"}</p></div>
            <div><p className="text-xs text-slate-400">Balance</p><p className="font-semibold">₨ {(viewAcc.currentBalance ?? viewAcc.openingBalance ?? 0).toLocaleString()}</p></div>
          </div>
          <ModalFooter onCancel={() => setViewAcc(null)} onSave={() => setViewAcc(null)} saveLabel="Close" />
        </Modal>
      )}

      {reconcileAcc && (
        <Modal title={`Reconcile — ${reconcileAcc.bankName}`} onClose={() => setReconcileAcc(null)}>
          <FField label="Confirmed Bank Statement Balance (₨)" required>
            <FInput type="number" value={reconcileValue} onChange={e => setReconcileValue(e.target.value)} />
          </FField>
          <ModalFooter
            onCancel={() => setReconcileAcc(null)}
            onSave={() => reconcileMutation.mutate({ id: reconcileAcc._id, balance: Number(reconcileValue) || 0 })}
            saveLabel={reconcileMutation.isPending ? "Saving…" : "Save Balance"}
          />
        </Modal>
      )}
    </div>
  );
}

// ─── TAB: BUDGETING ───────────────────────────────────────────────────────────
type CCForm = { code: string; name: string; dept: string; campus: string; budget: string; description: string; status: string };
const BLANK_CC: CCForm = { code: "", name: "", dept: "", campus: "", budget: "", description: "", status: "Active" };

type BudgetForm = { title: string; year: string; campus: string; dept: string; budgetType: string; startDate: string; endDate: string; amount: string; notes: string; status: string };
const BLANK_BUDGET: BudgetForm = { title: "", year: "2025-26", campus: "", dept: "", budgetType: "Annual", startDate: "", endDate: "", amount: "", notes: "", status: "Draft" };

function BudgetingTab() {
  const [costCenters, setCostCenters]     = useState<CostCenter[]>(INITIAL_COST_CENTERS);
  const [showCCModal, setShowCCModal]     = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [editCC, setEditCC]               = useState<CostCenter | null>(null);
  const [ccForm, setCCForm]               = useState<CCForm>(BLANK_CC);
  const [budgetForm, setBudgetForm]       = useState<BudgetForm>(BLANK_BUDGET);
  const [budgetErrors, setBudgetErrors]   = useState<Record<string, boolean>>({});
  const [ccSearch, setCCSearch]           = useState("");

  const queryClient = useQueryClient();
  const { data: budgets = [], isLoading: budgetsLoading } = useQuery({ queryKey: ["budgets"], queryFn: () => financeService.getBudgets() });
  const { data: campuses = [] } = useQuery({ queryKey: ["campuses"], queryFn: organizationService.getCampuses });
  const createBudgetMutation = useMutation({
    mutationFn: financeService.createBudget,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["budgets"] }); toast.success("Budget created"); setShowBudgetModal(false); },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed"),
  });
  const approveBudgetMutation = useMutation({
    mutationFn: (id: string) => financeService.approveBudget(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["budgets"] }); toast.success("Budget approved"); },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to approve"),
  });

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
    createBudgetMutation.mutate({
      name: budgetForm.title,
      academicYear: budgetForm.year,
      term: budgetForm.budgetType,
      campusId: budgetForm.campus,
      departmentId: budgetForm.dept || undefined,
      lines: [{ category: budgetForm.dept || budgetForm.title, allocatedAmount: Number(budgetForm.amount) || 0 }],
      notes: budgetForm.notes,
      status: budgetForm.status.toLowerCase(),
    });
  }

  const bErrStyle = (k: string): React.CSSProperties =>
    budgetErrors[k] ? { borderColor: "#ef4444", boxShadow: "0 0 0 1px #ef4444" } : {};

  const budgetRows = (budgets as any[]).map((b: any) => {
    const pct = b.totalAllocated > 0 ? Math.round(((b.totalSpent || 0) / b.totalAllocated) * 100) : 0;
    return { ...b, pct };
  });
  const totalBudget = budgetRows.reduce((a, b) => a + (b.totalAllocated || 0), 0);
  const totalSpent = budgetRows.reduce((a, b) => a + (b.totalSpent || 0), 0);
  const onTrackCount = budgetRows.filter(b => b.pct <= 85).length;
  const overBudgetCount = budgetRows.filter(b => b.pct > 100).length;
  const fmt = (n: number) => n >= 1_000_000 ? `₨ ${(n / 1_000_000).toFixed(2)}M` : `₨ ${n.toLocaleString()}`;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPI icon={BarChart3}     label="Total Budget"           value={fmt(totalBudget)}  sub={`${budgetRows.length} budgets`} color="#0C447C" />
        <KPI icon={TrendingUp}    label="Total Spent"            value={fmt(totalSpent)}  sub={totalBudget ? `${Math.round(totalSpent / totalBudget * 100)}% utilized` : undefined} color="#EF9F27" />
        <KPI icon={CheckCircle}   label="On Track"                value={`${onTrackCount} / ${budgetRows.length}`}    color="#10b981" />
        <KPI icon={AlertTriangle} label="Over Budget"            value={String(overBudgetCount)}   color="#ef4444" />
      </div>

      {/* Budgets */}
      <Card>
        <CardHeader
          title="Budgets vs Actuals"
          sub="All academic years"
          actions={<Btn variant="primary" onClick={openAddBudget}><Plus size={12} /> New Budget</Btn>}
        />
        <TableWrap headers={["Budget", "Allocated (₨)", "Spent (₨)", "Remaining (₨)", "Utilization", "Status", "Actions"]}>
          {budgetsLoading ? (
            <tr><td colSpan={7} className="px-4 py-12 text-center"><div className="w-6 h-6 border-4 border-[#0C447C] border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
          ) : budgetRows.length === 0 ? (
            <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-400">No budgets yet. Click + New Budget to create one.</td></tr>
          ) : budgetRows.map(b => (
            <tr key={b._id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-semibold text-slate-800">{b.name}</td>
              <td className="px-4 py-3 font-mono text-slate-700">{(b.totalAllocated || 0).toLocaleString()}</td>
              <td className="px-4 py-3 font-mono text-slate-700">{(b.totalSpent || 0).toLocaleString()}</td>
              <td className={`px-4 py-3 font-mono font-semibold ${b.pct > 100 ? "text-red-600" : "text-emerald-600"}`}>
                {((b.totalAllocated || 0) - (b.totalSpent || 0)).toLocaleString()}
              </td>
              <td className="px-4 py-3 w-40">
                <div className="flex items-center gap-2">
                  <ProgBar pct={b.pct} color={b.pct > 100 ? "#ef4444" : b.pct > 85 ? "#EF9F27" : "#10b981"} />
                  <span className="text-xs font-semibold w-9 text-slate-700">{b.pct}%</span>
                </div>
              </td>
              <td className="px-4 py-3"><Badge v={b.status === "approved" || b.status === "active" ? "green" : b.status === "closed" ? "gray" : "amber"}>{b.status}</Badge></td>
              <td className="px-4 py-3">
                {b.status === "draft" && (
                  <button onClick={() => approveBudgetMutation.mutate(b._id)} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Approve"><CheckCircle size={13} /></button>
                )}
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
                {(campuses as any[]).map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
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
                {(campuses as any[]).map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
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
  const { data: campuses = [] } = useQuery({ queryKey: ["campuses"], queryFn: organizationService.getCampuses });

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

  const fundTotal = (type: string) => txns.filter(t => t.type === type).reduce((a, t) => a + t.amount, 0);
  const uniqueDonors = new Set(txns.map(t => t.donor)).size;
  const fmt = (n: number) => n >= 1_000_000 ? `₨ ${(n / 1_000_000).toFixed(2)}M` : `₨ ${n.toLocaleString()}`;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Zakat Fund",     value: fmt(fundTotal("Zakat")),   sub: "This session",       color: "#7c3aed" },
          { label: "Sadaqah Fund",   value: fmt(fundTotal("Sadaqah")), sub: "This session",       color: "#0891b2" },
          { label: "Waqf Corpus",    value: fmt(fundTotal("Waqf")),    sub: "This session",       color: "#047857" },
          { label: "Total Donors",   value: String(uniqueDonors),      sub: "Recorded this session", color: "#EF9F27" },
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
                {(campuses as any[]).map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
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
  { name: "Fee Collection Report",        desc: "Campus-wise and class-wise fee analysis",              icon: Receipt,    live: true  },
  { name: "Income & Expense Statement",   desc: "Revenue vs expenses with surplus/deficit",             icon: TrendingUp, live: true  },
  { name: "Outstanding Dues Report",      desc: "Student overdue fees with aging buckets",              icon: Clock,      live: true  },
  { name: "Balance Sheet",                desc: "Assets, liabilities and equity snapshot",              icon: BookOpen,   live: false },
  { name: "Payroll Summary Report",       desc: "Staff salaries, allowances and deductions",            icon: Users,      live: false },
  { name: "Vendor Payment Report",        desc: "Supplier payment history and outstanding dues",        icon: Building2,  live: false },
  { name: "Bank Reconciliation Report",   desc: "Bank statement vs general ledger reconciliation",      icon: RefreshCw,  live: false },
  { name: "Zakat & Islamic Funds Report", desc: "Shariah-compliant fund utilization details",           icon: Shield,     live: false },
  { name: "Budget vs Actual Report",      desc: "Department-wise budget performance analysis",          icon: BarChart3,  live: false },
  { name: "Campus-wise Financial Report", desc: "Profitability and cost analysis per campus",           icon: MapPin,     live: false },
] as const;

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows.map(r => r.map(c => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

const GROUPBY_OPTIONS: Record<string, { value: string; label: string }[]> = {
  "Fee Collection Report": [
    { value: "summary",     label: "Summary" },
    { value: "class",       label: "Class-wise" },
    { value: "month",       label: "Month-wise" },
    { value: "classMonth",  label: "Class + Month-wise" },
    { value: "feeCategory", label: "Fee Category-wise" },
    { value: "wing",        label: "Wing-wise (Academic Department)" },
    { value: "family",      label: "Family-wise" },
    { value: "slip",        label: "Slip-wise (all receipts)" },
    { value: "exemptions",  label: "Exemptions / Waived Fees" },
  ],
  "Outstanding Dues Report": [
    { value: "summary", label: "Summary" },
    { value: "class",   label: "Class-wise" },
    { value: "family",  label: "Family-wise" },
    { value: "wing",    label: "Wing-wise (Academic Department)" },
    { value: "hold",    label: "Hold Fee" },
    { value: "deleted", label: "Deleted Invoices" },
  ],
};

const FIELD_LABELS: Record<string, string> = {
  _id: "Group", totalCollected: "Total Collected", totalOutstanding: "Total Outstanding",
  paymentCount: "Payment Count", invoiceCount: "Invoice Count", students: "Students",
  guardianName: "Guardian Name", receiptNumber: "Receipt No.", invoiceNumber: "Invoice No.",
  studentName: "Student Name", amount: "Amount", paymentMethod: "Payment Method",
  paymentDate: "Payment Date", collectedBy: "Collected By", grade: "Grade",
  totalAmount: "Total Amount", balanceDue: "Balance Due", month: "Month",
  deletedAt: "Deleted On", deletedBy: "Deleted By", deleteReason: "Delete Reason",
  totalDiscount: "Discount", status: "Status",
};
const labelFor = (key: string) => FIELD_LABELS[key] || key.replace(/([A-Z])/g, " $1").replace(/^./, c => c.toUpperCase());

function reportDataToRows(data: any): (string | number)[][] {
  if (Array.isArray(data)) {
    if (data.length === 0) return [["No data found"]];
    const rawHeaders = Array.from(new Set(data.flatMap((r: any) => Object.keys(r))));
    const headers = rawHeaders.map(labelFor);
    const rows: (string | number)[][] = [headers];
    for (const item of data) {
      rows.push(rawHeaders.map(h => {
        const v = item[h];
        if (v === null || v === undefined) return "";
        return typeof v === "object" ? JSON.stringify(v) : v;
      }));
    }
    return rows;
  }
  // Summary-shaped object: { totals/total: {...}, byStatus: [...] }
  const rows: (string | number)[][] = [];
  const totalsKey = data.totals ? "totals" : data.total ? "total" : null;
  if (totalsKey) {
    rows.push(["Metric", "Value"]);
    for (const [k, v] of Object.entries(data[totalsKey] || {})) {
      if (k === "_id") continue;
      rows.push([k, v as any]);
    }
  }
  if (Array.isArray(data.byStatus) && data.byStatus.length > 0) {
    rows.push([]);
    rows.push(["Status", "Count", "Total"]);
    for (const s of data.byStatus) rows.push([s._id, s.count, s.total]);
  }
  return rows.length > 0 ? rows : [["No data found"]];
}

async function printDetailReport(title: string, data: any) {
  let school: any = {};
  try {
    school = await organizationService.getProfile();
  } catch {
    school = { name: 'School Name', address: {}, phone: '', email: '' };
  }
  const addr = school.address || {};
  const addressLine = [addr.street, addr.city, addr.state, addr.country].filter(Boolean).join(', ');

  const esc = (v: any) => String(v ?? '');
  const money = (n: number) => (n || 0).toLocaleString();

  const groupBlocks = (data.groups || []).map((g: any) => {
    const studentRows = (g.students || []).map((s: any) => {
      const itemRows = (s.items || []).map((it: any, idx: number) => {
        const nameCell = idx === 0
          ? '<td rowspan="' + (s.items.length + (s.items.length > 1 ? 1 : 0)) + '">' + esc(s.admissionNumber) + '</td>' +
            '<td rowspan="' + (s.items.length + (s.items.length > 1 ? 1 : 0)) + '">' + esc(s.studentName) + '</td>' +
            '<td rowspan="' + (s.items.length + (s.items.length > 1 ? 1 : 0)) + '">' + esc(s.contact) + '</td>'
          : '';
        return '<tr>' + nameCell + '<td>' + esc(it.particular) + '</td><td class="num">' + money(it.balance) + '</td></tr>';
      }).join('');
      const subtotalRow = s.items.length > 1
        ? '<tr class="subtotal"><td colspan="4" class="num"></td><td class="num bold">' + money(s.subtotal) + '</td></tr>'
        : '';
      return itemRows + subtotalRow;
    }).join('');

    return (
      '<div class="group-header">' + esc(g.groupLabel) + '</div>' +
      '<table>' +
      '<thead><tr><th>GR#</th><th>Student Name</th><th>Contact #</th><th>Particular</th><th class="num">Balance</th></tr></thead>' +
      '<tbody>' + studentRows + '</tbody>' +
      '</table>' +
      '<div class="group-total">' + esc(g.groupLabel) + ' &middot; ' + g.studentCount + ' students' +
        (g.maleCount || g.femaleCount ? ' (' + g.maleCount + ' M | ' + g.femaleCount + ' F)' : '') +
        ' &middot; Rs.' + money(g.totalBalance) + '</div>'
    );
  }).join('');

  const html = (
    '<!DOCTYPE html><html><head><meta charset="utf-8" />' +
    '<title>' + esc(title) + '</title>' +
    '<style>' +
    '@page { size: A4; margin: 12mm; }' +
    'body { font-family: Arial, Helvetica, sans-serif; color: #1e293b; margin: 0; font-size: 11px; }' +
    '.letterhead { display: flex; align-items: center; gap: 14px; border-bottom: 2px solid #0C447C; padding-bottom: 10px; margin-bottom: 12px; }' +
    '.letterhead img { width: 48px; height: 48px; object-fit: contain; }' +
    '.school-name { font-size: 16px; font-weight: 700; color: #0C447C; margin: 0; }' +
    '.school-meta { font-size: 10px; color: #64748b; margin: 2px 0 0; }' +
    'h1 { font-size: 14px; color: #0C447C; margin: 0 0 10px; text-align: center; }' +
    '.group-header { background: #0C447C; color: white; font-weight: 700; padding: 5px 8px; margin-top: 14px; font-size: 11px; }' +
    'table { width: 100%; border-collapse: collapse; font-size: 10.5px; }' +
    'th { background: #eef2f7; text-align: left; padding: 4px 6px; border-bottom: 1px solid #cbd5e1; }' +
    'td { padding: 4px 6px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }' +
    '.num { text-align: right; }' +
    '.bold { font-weight: 700; }' +
    'tr.subtotal td { border-top: 1px solid #94a3b8; }' +
    '.group-total { text-align: right; font-weight: 700; font-size: 11px; padding: 5px 8px; background: #f8fafc; border-bottom: 2px solid #0C447C; }' +
    '.grand-total { text-align: right; font-weight: 700; font-size: 13px; color: #0C447C; margin-top: 16px; padding-top: 8px; border-top: 2px solid #0C447C; }' +
    '.footer { margin-top: 20px; font-size: 9px; color: #94a3b8; text-align: right; }' +
    '</style></head><body>' +
    '<div class="letterhead">' +
    (school.logo ? '<img src="' + school.logo + '" />' : '') +
    '<div><p class="school-name">' + esc(school.name || 'School') + '</p>' +
    '<p class="school-meta">' + esc(addressLine) + '</p>' +
    '<p class="school-meta">' + [school.phone, school.email].filter(Boolean).join(' &middot; ') + '</p></div></div>' +
    '<h1>' + esc(title) + '</h1>' +
    groupBlocks +
    '<div class="grand-total">Grand Total &middot; ' + data.grandTotal.studentCount + ' students &middot; Rs.' + money(data.grandTotal.totalBalance) + '</div>' +
    '<p class="footer">Printed: ' + new Date().toLocaleDateString() + ' &middot; Eldermin ERP</p>' +
    '</body></html>'
  );

  const win = window.open('', '_blank');
  if (!win) { alert('Please allow popups to print this report.'); return; }
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.onload = () => { win.focus(); win.print(); };
}

async function printReport(title: string, subtitle: string, rows: (string | number)[][]) {
  let school: any = {};
  try {
    school = await organizationService.getProfile();
  } catch {
    school = { name: "School Name", address: {}, phone: "", email: "" };
  }
  const addr = school.address || {};
  const addressLine = [addr.street, addr.city, addr.state, addr.country].filter(Boolean).join(", ");

  const [headerRow, ...dataRows] = rows;
  const theadHtml = headerRow
    ? `<tr>${headerRow.map(h => `<th>${String(h)}</th>`).join("")}</tr>`
    : "";
  const tbodyHtml = dataRows
    .map(r => {
      if (r.length === 0) return `<tr><td colspan="99" style="height:8px;border:none;"></td></tr>`;
      return `<tr>${r.map(c => `<td>${String(c ?? "")}</td>`).join("")}</tr>`;
    })
    .join("");

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>${title}</title>
      <style>
        @page { size: A4; margin: 15mm; }
        body { font-family: Arial, Helvetica, sans-serif; color: #1e293b; margin: 0; }
        .letterhead { display: flex; align-items: center; gap: 14px; border-bottom: 2px solid #0C447C; padding-bottom: 12px; margin-bottom: 16px; }
        .letterhead img { width: 56px; height: 56px; object-fit: contain; }
        .school-name { font-size: 18px; font-weight: 700; color: #0C447C; margin: 0; }
        .school-meta { font-size: 11px; color: #64748b; margin: 2px 0 0; }
        h1 { font-size: 15px; color: #0C447C; margin: 0 0 2px; text-align: center; }
        .subtitle { font-size: 11px; color: #94a3b8; text-align: center; margin: 0 0 16px; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        th { background: #0C447C; color: white; text-align: left; padding: 6px 8px; }
        td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; }
        tr:nth-child(even) td { background: #f8fafc; }
        .footer { margin-top: 24px; font-size: 10px; color: #94a3b8; text-align: right; }
        @media print { .no-print { display: none; } }
      </style>
    </head>
    <body>
      <div class="letterhead">
        ${school.logo ? `<img src="${school.logo}" />` : ""}
        <div>
          <p class="school-name">${school.name || "School"}</p>
          <p class="school-meta">${addressLine}</p>
          <p class="school-meta">${[school.phone, school.email].filter(Boolean).join(" \u00b7 ")}</p>
        </div>
      </div>
      <h1>${title}</h1>
      <p class="subtitle">${subtitle}</p>
      <table>
        <thead>${theadHtml}</thead>
        <tbody>${tbodyHtml}</tbody>
      </table>
      <p class="footer">Printed: ${new Date().toLocaleDateString()} \u00b7 Eldermin ERP</p>
    </body>
    </html>
  `;

  const win = window.open("", "_blank");
  if (!win) { alert("Please allow popups to print this report."); return; }
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.onload = () => { win.focus(); win.print(); };
}

function ReportsTab() {
  const [reportModal, setReportModal] = useState<(typeof REPORT_LIST)[number] | null>(null);
  const [filterFrom, setFilterFrom]   = useState("");
  const [filterTo, setFilterTo]       = useState("");
  const [generating, setGenerating]   = useState(false);
  const [groupBy, setGroupBy]         = useState("summary");
  const [reportFormat, setReportFormat] = useState<"summary" | "detail">("summary");

  const liveCount = REPORT_LIST.filter(r => r.live).length;

  async function generate() {
    if (!reportModal) return;
    setGenerating(true);
    try {
      if (reportModal.name === "Income & Expense Statement") {
        const ay = localStorage.getItem("academicYear") || "2025-26";
        const res = await financeService.getIncomeStatement({ academicYear: ay, from: filterFrom || undefined, to: filterTo || undefined });
        downloadCsv("income-expense-statement.csv", [
          ["Total Revenue", res.totalRevenue], ["Total Expenses", res.totalExpenses], ["Net Income", res.netIncome],
          [], ["Category", "Amount"],
          ...(res.expenseBreakdown || []).map((e: any) => [e._id, e.total]),
        ]);
        toast.success("Income & Expense Statement downloaded");
      } else if (reportModal.name === "Fee Collection Report") {
        const res = await financeService.getCollectionReport({
          groupBy, from: filterFrom || undefined, to: filterTo || undefined,
        });
        downloadCsv(`fee-collection-${groupBy}.csv`, reportDataToRows(res));
        toast.success("Fee Collection Report downloaded");
      } else if (reportModal.name === "Outstanding Dues Report") {
        const res = await financeService.getOutstandingReport({ groupBy });
        downloadCsv(`outstanding-dues-${groupBy}.csv`, reportDataToRows(res));
        toast.success("Outstanding Dues Report downloaded");
      } else {
        toast(`"${reportModal.name}" isn't wired to live data yet — no backend endpoint exists for it.`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to generate report");
    } finally {
      setGenerating(false);
      setReportModal(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
        <KPI icon={FileText}    label="Report Types Available"  value={String(REPORT_LIST.length)}  color="#0C447C" />
        <KPI icon={CheckCircle} label="Wired to Live Data"       value={`${liveCount} / ${REPORT_LIST.length}`}  sub="Rest need backend support" color="#EF9F27" />
      </div>

      <Card>
        <CardHeader title="Available Reports" sub="Generate and download financial reports" />
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
                    <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">{r.name} {!r.live && <span className="text-[10px] font-normal text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">Preview only</span>}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{r.desc}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Btn variant="primary" size="sm" onClick={() => { setReportModal(r); setGroupBy("summary"); setReportFormat("summary"); }}>
                    <Download size={12} /> Generate Report
                  </Btn>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {reportModal && (
        <Modal title={`Generate: ${reportModal.name}`} size="md" onClose={() => setReportModal(null)}>
          {!reportModal.live && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              This report type has no backend data source yet — generating it will not download real data.
            </p>
          )}
          {GROUPBY_OPTIONS[reportModal.name] && (
            <FField label="Group By">
              <select
                value={groupBy}
                onChange={e => setGroupBy(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]"
              >
                {GROUPBY_OPTIONS[reportModal.name].map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </FField>
          )}
          {(reportModal.name === "Outstanding Dues Report" || reportModal.name === "Fee Collection Report") && (
            <FField label="Format">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setReportFormat("summary")}
                  className={`flex-1 px-3 py-2 text-sm rounded-lg border font-medium ${reportFormat === "summary" ? "bg-[#0C447C] text-white border-[#0C447C]" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                >
                  Summary
                </button>
                <button
                  type="button"
                  onClick={() => setReportFormat("detail")}
                  className={`flex-1 px-3 py-2 text-sm rounded-lg border font-medium ${reportFormat === "detail" ? "bg-[#0C447C] text-white border-[#0C447C]" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                >
                  Detail (Class + Section)
                </button>
              </div>
            </FField>
          )}
          <div className="grid grid-cols-2 gap-4">
            <FField label="Date From">
              <FInput type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} />
            </FField>
            <FField label="Date To">
              <FInput type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)} />
            </FField>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Btn variant="secondary" size="md" onClick={() => setReportModal(null)}>Cancel</Btn>
            {(reportModal.name === "Fee Collection Report" || reportModal.name === "Outstanding Dues Report") && (
              <Btn
                variant="secondary"
                size="md"
                onClick={async () => {
                  setGenerating(true);
                  try {
                    if (reportModal.name === "Outstanding Dues Report" && reportFormat === "detail") {
                      const detailRes = await financeService.getOutstandingDetailReport({});
                      await printDetailReport("Outstanding Dues Report \u2014 Detail", detailRes);
                    } else if (reportModal.name === "Fee Collection Report" && reportFormat === "detail") {
                      const detailRes = await financeService.getCollectionDetailReport({
                        from: filterFrom || undefined, to: filterTo || undefined,
                      });
                      await printDetailReport("Fee Collection Report \u2014 Detail", detailRes);
                    } else {
                      const res = reportModal.name === "Fee Collection Report"
                        ? await financeService.getCollectionReport({ groupBy, from: filterFrom || undefined, to: filterTo || undefined })
                        : await financeService.getOutstandingReport({ groupBy });
                      const groupLabel = GROUPBY_OPTIONS[reportModal.name]?.find(o => o.value === groupBy)?.label || groupBy;
                      await printReport(reportModal.name, groupLabel, reportDataToRows(res));
                    }
                  } catch (err: any) {
                    toast.error(err.response?.data?.message || "Failed to generate print preview");
                  } finally {
                    setGenerating(false);
                  }
                }}
              >
                Print Preview
              </Btn>
            )}
            <Btn variant="primary" size="md" onClick={generate}>
              {generating ? "Generating…" : "Download CSV"}
            </Btn>
          </div>
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

  const hasFilter = dateFrom || dateTo || userFilter !== "All" || actionFilter !== "All" || moduleFilter !== "All";

  const filtered = AUDIT_LOGS.filter(l => {
    if (userFilter   !== "All" && l.user   !== userFilter)   return false;
    if (actionFilter !== "All" && l.action !== actionFilter) return false;
    if (moduleFilter !== "All" && l.module !== moduleFilter) return false;
    if (dateFrom && l.time.slice(0, 10) < dateFrom) return false;
    if (dateTo   && l.time.slice(0, 10) > dateTo)   return false;
    return true;
  });

  function exportAuditCsv() {
    if (filtered.length === 0) { toast.error("No audit entries to export yet."); return; }
    downloadCsv("finance-audit-log.csv", [
      ["Timestamp", "User", "Action", "Module", "Description", "IP Address"],
      ...filtered.map(l => [l.time, l.user, l.action, l.module, l.description, l.ip]),
    ]);
  }

  const selCls   = "border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#0C447C] cursor-pointer";
  const inpCls   = "border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#0C447C] w-32";

  return (
    <div className="space-y-5">
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800">
        Financial audit logging is not yet backed by a live activity feed — this tab shows the intended layout only.
      </div>

      <Card>
        <CardHeader
          title="Audit Log"
          sub="Complete trail of all financial module actions"
          actions={
            <Btn variant="secondary" onClick={exportAuditCsv}>
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
          {filtered.length === 0 ? (
            <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-400">No audit entries recorded yet.</td></tr>
          ) : filtered.map(l => (
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
      case "dashboard":  return <DashboardTab onNavigate={setActive} />;
      case "fee":         return <FeeRevenueTab />;
      case "assignments": return <FeeAssignmentTab />;
      case "receivable":  return <ReceivableTab />;
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
