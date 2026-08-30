import { useState, useEffect, useMemo, Fragment } from "react";
import {
  LayoutDashboard, Receipt, Clock, CreditCard, Landmark,
  BarChart3, Shield, FileText, CheckSquare, Plus, Download,
  Search, Eye, Edit, TrendingUp, TrendingDown, AlertTriangle,
  RefreshCw, Printer, Send, Star, Wallet, Building2,
  CheckCircle, XCircle, ArrowUp, ArrowDown, X, Trash2,
  Users, BookOpen, MapPin, ChevronDown, Percent, Award,
  BookText, Handshake, Contact, Gauge, Activity, ArrowLeftRight, Ban, Upload,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import financeService from "../../services/finance.service";
import organizationService from "../../services/organization.service";
import familiesService from "../../services/families.service";
import hrService from "../../services/hr.service";
import { StudentSelect } from "../../components/ui/StudentSelect";
import { useStudents } from "../../hooks/useStudents";
import * as pdfApi from "../../services/pdf.api";
import { useAuth } from "../../contexts/AuthContext";
import { ModuleHeader } from "../../components/layout/ModuleHeader";
import { TabBar } from "../../components/layout/TabBar";

// ─── TYPES ────────────────────────────────────────────────────────────────────
type FinTab =
  | "dashboard" | "fee" | "assignments" | "receivable" | "defaulters" | "payable" | "vouchers"
  | "banking" | "reconciliation" | "budgeting" | "islamic" | "ledger" | "reports" | "audit";

const TABS: { id: FinTab; label: string; icon: LucideIcon; badge?: number }[] = [
  { id: "dashboard",   label: "Dashboard",         icon: LayoutDashboard },
  { id: "fee",         label: "Fee & Revenue",     icon: Receipt         },
  { id: "assignments", label: "Fee Assignment",    icon: Award           },
  { id: "receivable",  label: "Receivables",       icon: Clock, badge: 7 },
  { id: "defaulters",  label: "Defaulters",        icon: AlertTriangle   },
  { id: "payable",     label: "Payables",          icon: CreditCard      },
  // Quick-entry Payment/Receipt Vouchers (ERPNext "Payment Entry" style) —
  // its own top-level tab rather than folded into Payables (bill-centric)
  // or Ledger (report-centric) or Banking (bank-account-setup-centric),
  // since it's a fast day-to-day data-entry action the client wants
  // readily reachable, not nested under a tab about something else.
  { id: "vouchers",    label: "Vouchers",          icon: ArrowLeftRight  },
  { id: "banking",     label: "Banking",           icon: Landmark        },
  { id: "reconciliation", label: "Bank Reconciliation", icon: RefreshCw  },
  { id: "budgeting",   label: "Budgeting",         icon: BarChart3       },
  { id: "islamic",     label: "Islamic Funds",     icon: Shield          },
  { id: "ledger",      label: "Ledger",            icon: BookText        },
  { id: "reports",     label: "Reports",           icon: FileText        },
  { id: "audit",       label: "Audit",             icon: CheckSquare     },
];

// ─── DATA ─────────────────────────────────────────────────────────────────────
const PIE_COLORS = ["#0C447C", "#EF9F27", "#ef4444", "#8b5cf6", "#10b981", "#0891b2"];
// Fixed categorical order (validated for CVD-safety) — same array/order as
// src/pages/hr/index.tsx's VIZ_SERIES, reused here for visual consistency
// across modules. Assign in fixed order, never cycle.
const VIZ_SERIES = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948'];

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

function Btn({ children, variant = "secondary", size = "sm", onClick, disabled = false }: {
  children: React.ReactNode; variant?: "primary" | "secondary" | "danger" | "success";
  size?: "sm" | "md"; onClick?: () => void; disabled?: boolean;
}) {
  const v = {
    primary:   "bg-[#0C447C] text-white hover:bg-[#0b3d6e] border-[#0C447C]",
    secondary: "bg-white text-slate-700 hover:bg-slate-50 border-slate-200",
    danger:    "bg-red-600 text-white hover:bg-red-700 border-red-600",
    success:   "bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-600",
  };
  const s = size === "md" ? "px-4 py-2 text-sm" : "px-3 py-1.5 text-xs";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${v[variant]} ${s} border rounded-lg font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed`}
    >
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
      {actions && <div className="flex items-center gap-2 flex-wrap justify-end">{actions}</div>}
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

// axios requests using responseType: 'blob' (needed for PDF downloads) get
// error response bodies delivered as a Blob even though the server sent
// JSON - err.response.data.message is always undefined unless the blob is
// explicitly read and parsed as text/JSON first.
async function extractBlobError(err: any): Promise<string> {
  const fallback = "Something went wrong.";
  const data = err?.response?.data;
  if (!data) return err?.message || fallback;
  if (data instanceof Blob) {
    try {
      const text = await data.text();
      const parsed = JSON.parse(text);
      return parsed.message || text || fallback;
    } catch {
      return fallback;
    }
  }
  return data.message || fallback;
}

// If the error is the specific "challans exist but under a different
// academic year" mismatch, show a toast with a one-click fix instead of
// just an explanation the person has to act on manually (toggle the
// Academic Year switcher, delete, switch back, regenerate). Returns true
// if it handled the error this way; false means show it as a normal error.
function offerRetagFixIfApplicable(
  message: string,
  scope: { month: string; scopeType: string; scopeValue?: string },
  onFixed: () => void,
): boolean {
  if (!message.includes("but under academic year")) return false;
  const currentYear = localStorage.getItem("academicYear") || "";
  toast((t) => (
    <div className="text-sm">
      <p className="mb-2">{message}</p>
      <div className="flex gap-2">
        <button
          onClick={async () => {
            toast.dismiss(t.id);
            try {
              const result = await financeService.retagInvoiceYear({
                month: scope.month, scopeType: scope.scopeType, scopeValue: scope.scopeValue, toAcademicYear: currentYear,
              });
              toast.success(`Fixed — retagged ${result.retagged} challan(s) to ${result.toAcademicYear}`);
              onFixed();
            } catch (err: any) {
              toast.error(err.response?.data?.message || "Failed to fix automatically");
            }
          }}
          className="px-3 py-1.5 bg-[#0C447C] text-white text-xs font-semibold rounded-lg hover:bg-[#0b3d6e]"
        >
          🔧 Fix Now — retag to {currentYear}
        </button>
        <button onClick={() => toast.dismiss(t.id)} className="px-3 py-1.5 text-xs text-slate-500 border border-slate-200 rounded-lg">
          Dismiss
        </button>
      </div>
    </div>
  ), { duration: 20000 });
  return true;
}

function FInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={fInputCls} />;
}

function FSelect({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) {
  return <select {...props} className={fInputCls + " bg-white cursor-pointer"}>{children}</select>;
}

function FTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={fInputCls + " resize-none"} rows={(props as { rows?: number }).rows ?? 3} />;
}

function ModalFooter({ onCancel, onSave, saveLabel = "Save", saving = false }: { onCancel: () => void; onSave: () => void; saveLabel?: string; saving?: boolean }) {
  // Cancel is deliberately never disabled, even while `saving` is true — a
  // modal that can't be closed while a request is in flight is exactly
  // what reads as "frozen" if that request is slow or never resolves (see
  // the Chart of Accounts Edit Account bug this was built to fix). Only
  // the Save button reflects pending state, so a stuck request can always
  // be escaped by closing the modal.
  return (
    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
      <Btn variant="secondary" size="md" onClick={onCancel}>Cancel</Btn>
      <Btn variant="primary"   size="md" onClick={onSave} disabled={saving}>{saveLabel}</Btn>
    </div>
  );
}

// ─── CHALLAN PREVIEW MODAL (FEE-06) ───────────────────────────────────────────
// "Print Challan" used to trigger an immediate, silent browser download the
// moment it was clicked - there was no way to actually LOOK at a challan
// before committing to print or save it. This shows the exact PDF that
// would be produced in an in-app preview first; Print and Download are
// both explicit actions the user takes from here, never automatic.
function ChallanPreviewModal({ blob, filename, onClose, title = "Challan Preview" }: { blob: Blob; filename: string; onClose: () => void; title?: string }) {
  const url = useMemo(() => URL.createObjectURL(blob), [blob]);
  useEffect(() => () => URL.revokeObjectURL(url), [url]);

  return (
    <Modal title={title} size="lg" onClose={onClose}>
      <div className="h-[65vh] bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
        <iframe src={url} title="Challan Preview" className="w-full h-full" />
      </div>
      <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 mt-3">
        <Btn variant="secondary" size="md" onClick={onClose}>Close</Btn>
        <Btn variant="secondary" size="md" onClick={() => { const w = window.open(url, "_blank"); w?.addEventListener("load", () => w.print()); }}>
          <Printer size={14} /> Print
        </Btn>
        <Btn variant="primary" size="md" onClick={() => pdfApi.downloadBlob(blob, filename)}>
          <Download size={14} /> Download
        </Btn>
      </div>
    </Modal>
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
          { label: "Create Voucher",   tab: "vouchers",    color: "bg-blue-50 text-blue-700 hover:bg-blue-100"     },
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
// discountType/discountValue — this structure's own default discount (item
// 2), distinct from the separate ad-hoc per-student DiscountProgram/
// discount-assignment workflow which stays exactly as-is.
type FeeForm = { head: string; amount: string; freq: string; customFreq: string; dueDate: string; lateFee: string; taxApplicable: boolean; effectiveFrom: string; campus: string; status: string; discountType: string; discountValue: string };
// Single-structure edit form — same fields as FeeForm plus the grade/section/
// academicYear that the Add flow instead derives from the multi-class picker.
type EditFeeForm = FeeForm & { grade: string; section: string; academicYear: string };
type AcctForm = { code: string; name: string; type: string; parent: string; description: string; openingBalance: string; currency: string; status: string };
type ClassSection = { grade: string; section: string };

const BLANK_FEE: FeeForm = { head: "", amount: "", freq: "Monthly", customFreq: "", dueDate: "", lateFee: "", taxApplicable: false, effectiveFrom: "", campus: "", status: "Active", discountType: "none", discountValue: "" };
const BLANK_ACCT: AcctForm = { code: "", name: "", type: "", parent: "", description: "", openingBalance: "", currency: "PKR", status: "Active" };
// The UI shows "Income" (the term accountants/admins actually use) but the
// backend's ChartOfAccount.type enum is 'revenue' (matching the rest of the
// ledger engine's terminology, e.g. revenue accounts 4000/4100/4200). This
// map is the single source of truth for that translation in both
// directions — sending the wrong string here is exactly what caused the
// "Add Account" 500 error (the raw lowercased label "income" was never a
// valid enum value, so Mongoose validation failed on every submit).
const ACCOUNT_TYPE_TO_ENUM: Record<string, string> = {
  Asset: "asset", Liability: "liability", Income: "revenue", Expense: "expense", Equity: "equity",
};
const ACCOUNT_TYPE_FROM_ENUM: Record<string, string> = {
  asset: "Asset", liability: "Liability", revenue: "Income", expense: "Expense", equity: "Equity",
};
const FREQUENCY_OPTIONS = ["Monthly", "Bi-Monthly (2 Months)", "Quarterly", "Termly", "Annually", "One-time", "Custom"];

// Walks parentCode links to find every descendant of `code` within
// `accounts` — used to keep the Parent Account dropdown from offering a
// choice that would create a circular hierarchy (the backend also rejects
// this, but catching it in the picker itself means the school never sees
// the error in the first place).
function getDescendantCodes(code: string, accounts: any[]): Set<string> {
  const directChildren = accounts.filter(a => a.parentCode === code).map(a => a.code);
  const all = new Set<string>(directChildren);
  directChildren.forEach(childCode => {
    getDescendantCodes(childCode, accounts).forEach(d => all.add(d));
  });
  return all;
}

// ── Chart of Accounts bulk import (CSV) ─────────────────────────────────────
// Expected columns (header row required, order doesn't matter):
// code, name, type, parentCode, openingBalance, currency, description, status
// `type` accepts either the schema enum (asset/liability/equity/revenue/
// expense) or the friendly labels shown in the Add Account form (Asset/
// Liability/Equity/Income/Expense) — the backend mirrors this so a school's
// existing spreadsheet doesn't need reformatting.
const COA_TEMPLATE_HEADERS = ["code", "name", "type", "parentCode", "openingBalance", "currency", "description", "status"];
const COA_TEMPLATE_EXAMPLE_ROWS = [
  ["1000", "Cash & Cash Equivalents", "Asset", "", "0", "PKR", "Main cash account", "Active"],
  ["1100", "Bank Accounts", "Asset", "1000", "0", "PKR", "", "Active"],
  ["4000", "Tuition Fee Revenue", "Income", "", "0", "PKR", "", "Active"],
];

function downloadCOATemplate() {
  const rows = [COA_TEMPLATE_HEADERS, ...COA_TEMPLATE_EXAMPLE_ROWS];
  const csv = rows.map(r => r.map(csvEscape).join(",")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "chart-of-accounts-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function csvEscape(value: string): string {
  if (/[",\r\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

// Minimal RFC 4180 CSV parser — handles quoted fields, escaped quotes ("")
// inside quotes, and commas/newlines embedded in quoted fields. Good enough
// for the simple flat COA rows this import expects without pulling in a
// dependency for it.
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const src = text.replace(/\r\n/g, "\n");
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field); field = "";
    } else if (ch === "\n") {
      row.push(field); field = "";
      rows.push(row); row = [];
    } else {
      field += ch;
    }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows.filter(r => r.some(f => f.trim() !== ""));
}

function csvRowsToCOAObjects(text: string): { rows: any[]; parseErrors: string[] } {
  const table = parseCSV(text);
  const parseErrors: string[] = [];
  if (table.length === 0) return { rows: [], parseErrors: ["File is empty."] };
  const headers = table[0].map(h => h.trim().toLowerCase());
  const required = ["code", "name", "type"];
  const missing = required.filter(h => !headers.includes(h));
  if (missing.length > 0) {
    parseErrors.push(`Missing required column(s): ${missing.join(", ")}. Expected headers: ${COA_TEMPLATE_HEADERS.join(", ")}.`);
    return { rows: [], parseErrors };
  }
  const rows = table.slice(1).map(cells => {
    const obj: any = {};
    headers.forEach((h, i) => { obj[h] = (cells[i] ?? "").trim(); });
    return obj;
  });
  return { rows, parseErrors };
}

type BulkImportResult = {
  created: number;
  updated: number;
  errors: { row: number; code?: string; message: string }[];
  warnings: { row: number; code?: string; message: string }[];
};

function FeeRevenueTab({ onNavigate }: { onNavigate?: (tab: FinTab) => void }) {
  const [search, setSearch]           = useState("");
  const [showFeeModal, setShowFeeModal]   = useState(false);
  const [showEditFeeModal, setShowEditFeeModal] = useState(false);
  const [editFeeStructure, setEditFeeStructure] = useState<any | null>(null);
  const [editFeeForm, setEditFeeForm] = useState<EditFeeForm>({ ...BLANK_FEE, grade: "", section: "", academicYear: "" });
  const [feeForm, setFeeForm]         = useState<FeeForm>(BLANK_FEE);
  const [selectedClasses, setSelectedClasses] = useState<ClassSection[]>([]);
  // Item 40 — when saving would trigger FEE-01 versioning (this structure
  // already has real invoices billed against it and the edit touches a
  // pricing-relevant field), show an explicit confirmation of exactly what
  // will and won't be affected before committing, instead of silently
  // versioning with only the small caption text below the form.
  const [showVersionConfirm, setShowVersionConfirm] = useState(false);

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
  // Real single-structure Edit (amount/fee-heads/due date/etc — not just the
  // isActive toggle above). updateFeeStructure on the backend transparently
  // either mutates the existing document in place, or — when the structure
  // has already billed real invoices and the edit touches a pricing field —
  // creates a new versioned document and marks the old one superseded. Both
  // shapes come back as a plain FeeStructure object from the PUT; the only
  // reliable signal that a new version was created is that the returned
  // document's _id differs from the id we sent the edit to.
  const updateFeeHeadMutation = useMutation({
    mutationFn: (vars: { id: string; payload: any }) => financeService.updateFeeStructure(vars.id, vars.payload),
    onSuccess: (res: any, vars) => {
      queryClient.invalidateQueries({ queryKey: ["fee-heads"] });
      setShowEditFeeModal(false);
      setEditFeeStructure(null);
      const wasVersioned = res?._id && String(res._id) !== String(vars.id);
      if (wasVersioned) {
        toast.success(
          `This fee structure has already been billed — your changes were saved as a new version (v${res.version || 2}); the previous version is preserved for historical invoices.`,
          { duration: 7000 },
        );
      } else {
        toast.success("Fee structure updated");
      }
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to update fee structure"),
  });

  const filteredFee = (feeHeads as any[]).filter(h =>
    h.name.toLowerCase().includes(search.toLowerCase()) ||
    (h.grade || "").toLowerCase().includes(search.toLowerCase()) ||
    (h.section || "").toLowerCase().includes(search.toLowerCase())
  );

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
      defaultDiscountType: feeForm.discountType === "none" ? undefined : feeForm.discountType,
      defaultDiscountValue: feeForm.discountType === "none" ? undefined : Number(feeForm.discountValue) || 0,
    }));
    createFeeHeadMutation.mutate(payloads);
  }

  // ── Edit a single fee structure (pre-fill from its current fields) ─────────
  function openEditFeeStructure(h: any) {
    const isKnownFreq = FREQUENCY_OPTIONS.includes(h.frequency);
    setEditFeeForm({
      head: h.name || "",
      amount: String(h.items?.[0]?.amount ?? h.totalAmount ?? ""),
      freq: isKnownFreq ? h.frequency : "Custom",
      customFreq: isKnownFreq ? "" : (h.frequency || ""),
      dueDate: h.dueDay != null ? String(h.dueDay) : "",
      lateFee: h.lateFeeAmount != null ? String(h.lateFeeAmount) : "",
      taxApplicable: !!h.isTaxable,
      effectiveFrom: h.effectiveFrom ? String(h.effectiveFrom).slice(0, 10) : "",
      campus: h.campus || "",
      status: h.isActive ? "Active" : "Inactive",
      grade: h.grade || "",
      section: h.section || "",
      academicYear: h.academicYear || "",
      discountType: h.defaultDiscountType || "none",
      discountValue: h.defaultDiscountValue != null ? String(h.defaultDiscountValue) : "",
    });
    setEditFeeStructure(h);
    setShowEditFeeModal(true);
  }

  // Item 40 — mirrors the backend's FEE_STRUCTURE_PRICING_FIELDS check
  // (finance.service.ts's updateFeeStructure) so the UI can tell, BEFORE
  // saving, whether this specific edit would trigger FEE-01 versioning:
  // only when the structure already has real invoices billed against it
  // (billedInvoiceCount, from getFeeStructures) AND the edit actually
  // touches a pricing-relevant field. A pure label/status/notes edit on an
  // already-billed structure still saves immediately, exactly as before.
  function editTouchesPricing(): boolean {
    if (!editFeeStructure) return false;
    const frequency = editFeeForm.freq === "Custom" ? (editFeeForm.customFreq.trim() || "Custom") : editFeeForm.freq;
    const amount = Number(editFeeForm.amount) || 0;
    const origAmount = editFeeStructure.items?.[0]?.amount ?? editFeeStructure.totalAmount ?? 0;
    return (
      amount !== origAmount ||
      (editFeeForm.dueDate ? Number(editFeeForm.dueDate) : undefined) !== (editFeeStructure.dueDay ?? undefined) ||
      (Number(editFeeForm.lateFee) || 0) !== (editFeeStructure.lateFeeAmount || 0) ||
      frequency !== editFeeStructure.frequency ||
      editFeeForm.taxApplicable !== !!editFeeStructure.isTaxable ||
      (editFeeForm.discountType === "none" ? "none" : editFeeForm.discountType) !== (editFeeStructure.defaultDiscountType || "none") ||
      (editFeeForm.discountType === "none" ? 0 : (Number(editFeeForm.discountValue) || 0)) !== (editFeeStructure.defaultDiscountValue || 0)
    );
  }

  function buildEditFeePayload() {
    const frequency = editFeeForm.freq === "Custom" ? (editFeeForm.customFreq.trim() || "Custom") : editFeeForm.freq;
    const amount = Number(editFeeForm.amount) || 0;
    return {
      name: editFeeForm.head,
      grade: editFeeForm.grade,
      section: editFeeForm.section || undefined,
      academicYear: editFeeForm.academicYear || undefined,
      frequency,
      items: [{ feeHead: editFeeForm.head, amount, discount: 0, isOptional: false }],
      dueDay: editFeeForm.dueDate ? Number(editFeeForm.dueDate) : undefined,
      lateFeeAmount: Number(editFeeForm.lateFee) || 0,
      effectiveFrom: editFeeForm.effectiveFrom || undefined,
      campus: editFeeForm.campus || undefined,
      isTaxable: editFeeForm.taxApplicable,
      isActive: editFeeForm.status === "Active",
      defaultDiscountType: editFeeForm.discountType === "none" ? "none" : editFeeForm.discountType,
      defaultDiscountValue: editFeeForm.discountType === "none" ? 0 : (Number(editFeeForm.discountValue) || 0),
    };
  }

  function saveEditFeeStructure() {
    if (!editFeeStructure) return;
    if (!editFeeForm.head) { toast.error("Fee head name is required"); return; }
    if (!editFeeForm.amount || Number(editFeeForm.amount) <= 0) { toast.error("Amount is required"); return; }
    if (!editFeeForm.grade) { toast.error("Grade / class is required"); return; }
    if ((editFeeStructure.billedInvoiceCount || 0) > 0 && editTouchesPricing()) {
      setShowVersionConfirm(true);
      return;
    }
    updateFeeHeadMutation.mutate({ id: editFeeStructure._id, payload: buildEditFeePayload() });
  }

  function confirmSaveNewVersion() {
    if (!editFeeStructure) return;
    setShowVersionConfirm(false);
    updateFeeHeadMutation.mutate({ id: editFeeStructure._id, payload: buildEditFeePayload() });
  }

  const activeFeeHeads = (feeHeads as any[]).filter(h => h.isActive).length;
  const taxableFeeHeads = (feeHeads as any[]).filter(h => h.isTaxable).length;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        <KPI icon={Receipt}       label="Fee Heads Defined"   value={String((feeHeads as any[]).length)} sub="All fee categories"  color="#0C447C" />
        <KPI icon={CheckCircle}   label="Active Fee Heads"    value={String(activeFeeHeads)}             sub="Currently billable"  color="#10b981" />
        <KPI icon={AlertTriangle} label="Taxable Fee Heads"   value={String(taxableFeeHeads)}            sub="Tax applicable"      color="#EF9F27" />
      </div>

      {/* Fee Structure */}
      <Card>
        <CardHeader
          title="Fee Structure by Class"
          sub={`FY ${localStorage.getItem("academicYear") || "—"} · All Campuses`}
          actions={
            <>
              <SearchBar placeholder="Search class..." value={search} onChange={setSearch} />
              <Btn variant="secondary" onClick={() => window.print()}><Printer size={12} /> Print</Btn>
              <Btn variant="primary" onClick={() => { setFeeForm(BLANK_FEE); setSelectedClasses([]); setShowFeeModal(true); }}><Plus size={12} /> Add Fee Structure</Btn>
            </>
          }
        />
        <TableWrap headers={["Fee Head", "Class / Section", "Academic Year", "Amount (₨)", "Frequency", "Due Day", "Effective From", "Campus", "Tax", "Version", "Status", "Action"]}>
          {feeHeadsLoading ? (
            <tr><td colSpan={12} className="px-4 py-12 text-center"><div className="w-6 h-6 border-4 border-[#0C447C] border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
          ) : filteredFee.length === 0 ? (
            <tr><td colSpan={12} className="px-4 py-12 text-center text-sm text-slate-400">{(feeHeads as any[]).length === 0 ? "No fee structures yet. Click + Add Fee Structure to create one." : "No results match your search."}</td></tr>
          ) : filteredFee.map((h: any) => (
            <tr key={h._id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">{h.name}</td>
              <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">{h.grade}{h.section ? ` – ${h.section}` : ""}</td>
              <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{h.academicYear || "—"}</td>
              <td className="px-4 py-3 font-mono font-bold text-[#0C447C]">{(h.totalAmount ?? 0).toLocaleString()}</td>
              <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">{h.frequency}</td>
              <td className="px-4 py-3 text-xs text-slate-500">{h.dueDay ?? "—"}</td>
              <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                {h.effectiveFrom ? new Date(h.effectiveFrom).toLocaleDateString() : "—"}
                {h.effectiveTo ? ` – ${new Date(h.effectiveTo).toLocaleDateString()}` : ""}
              </td>
              <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">{h.campus || "All Campuses"}</td>
              <td className="px-4 py-3 text-xs text-slate-600">{h.isTaxable ? "Yes" : "No"}</td>
              <td className="px-4 py-3 text-xs text-slate-500 text-center">v{h.version || 1}</td>
              <td className="px-4 py-3">
                <Badge v={h.status === "superseded" ? "gray" : h.status === "draft" ? "amber" : h.isActive ? "green" : "gray"}>
                  {h.status === "superseded" ? "Superseded" : h.status === "draft" ? "Draft" : h.isActive ? "Active" : "Inactive"}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-1">
                  <button
                    onClick={() => openEditFeeStructure(h)}
                    className="p-1.5 text-slate-400 hover:text-[#0C447C] hover:bg-blue-50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-slate-400 disabled:hover:bg-transparent"
                    title={h.status === "superseded" ? "Historical version — read-only" : "Edit"}
                    disabled={h.status === "superseded"}
                  ><Edit size={13} /></button>
                  <button
                    onClick={() => toggleFeeHeadMutation.mutate({ id: h._id, isActive: !h.isActive })}
                    className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-slate-400 disabled:hover:bg-transparent"
                    title={h.isActive ? "Deactivate" : "Activate"}
                    disabled={h.status === "superseded"}
                  >{h.isActive ? <XCircle size={13} /> : <CheckCircle size={13} />}</button>
                </div>
              </td>
            </tr>
          ))}
        </TableWrap>
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

      {/* ── Edit Fee Structure Modal ──
          Saving calls the existing updateFeeStructure endpoint, which the
          backend transparently either applies in place, or — if invoices
          already reference this exact structure and a pricing field changed
          — turns into a new version (old one preserved as "superseded"). */}
      {showEditFeeModal && editFeeStructure && (
        <Modal title="Edit Fee Structure" size="lg" onClose={() => setShowEditFeeModal(false)}>
          <div className="grid grid-cols-2 gap-4">
            <FField label="Fee Head" required>
              <FInput placeholder="e.g. Monthly Tuition Fee" value={editFeeForm.head} onChange={e => setEditFeeForm(f => ({ ...f, head: e.target.value }))} />
            </FField>
            <FField label="Amount (₨)" required>
              <FInput type="number" placeholder="0" value={editFeeForm.amount} onChange={e => setEditFeeForm(f => ({ ...f, amount: e.target.value }))} />
            </FField>
            <FField label="Grade / Class" required>
              <FSelect value={editFeeForm.grade} onChange={e => setEditFeeForm(f => ({ ...f, grade: e.target.value }))}>
                <option value="">Select grade…</option>
                {(grades as any[]).map((g: any) => <option key={g._id} value={g.name}>{g.name}</option>)}
              </FSelect>
            </FField>
            <FField label="Section">
              <FSelect value={editFeeForm.section} onChange={e => setEditFeeForm(f => ({ ...f, section: e.target.value }))}>
                <option value="">All Sections</option>
                {sectionNamesOf((grades as any[]).find((g: any) => g.name === editFeeForm.grade) || {}).filter(Boolean).map(sn => (
                  <option key={sn} value={sn}>Section {sn}</option>
                ))}
              </FSelect>
            </FField>
            <FField label="Academic Year">
              <FInput placeholder="e.g. 2025-2026" value={editFeeForm.academicYear} onChange={e => setEditFeeForm(f => ({ ...f, academicYear: e.target.value }))} />
            </FField>
            <FField label="Frequency">
              <FSelect value={editFeeForm.freq} onChange={e => setEditFeeForm(f => ({ ...f, freq: e.target.value }))}>
                {FREQUENCY_OPTIONS.map(o => <option key={o}>{o}</option>)}
              </FSelect>
            </FField>
            {editFeeForm.freq === "Custom" && (
              <FField label="Custom Frequency Label" required>
                <FInput placeholder="e.g. Every 2 Months" value={editFeeForm.customFreq} onChange={e => setEditFeeForm(f => ({ ...f, customFreq: e.target.value }))} />
              </FField>
            )}
            <FField label="Due Date (day of month)">
              <FInput type="number" min={1} max={31} placeholder="e.g. 10" value={editFeeForm.dueDate} onChange={e => setEditFeeForm(f => ({ ...f, dueDate: e.target.value }))} />
            </FField>
            <FField label="Late Fee (₨)">
              <FInput type="number" placeholder="0" value={editFeeForm.lateFee} onChange={e => setEditFeeForm(f => ({ ...f, lateFee: e.target.value }))} />
            </FField>
            <FField label="Effective From">
              <FInput type="date" value={editFeeForm.effectiveFrom} onChange={e => setEditFeeForm(f => ({ ...f, effectiveFrom: e.target.value }))} />
            </FField>
            <FField label="Campus">
              <FSelect value={editFeeForm.campus} onChange={e => setEditFeeForm(f => ({ ...f, campus: e.target.value }))}>
                <option value="">All Campuses</option>
                {(campuses as any[]).map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
              </FSelect>
            </FField>
            <div className="col-span-2 flex items-center gap-3">
              <label className="text-xs font-semibold text-slate-600">Tax Applicable</label>
              <button
                onClick={() => setEditFeeForm(f => ({ ...f, taxApplicable: !f.taxApplicable }))}
                className={`relative w-10 h-5 rounded-full transition-colors ${editFeeForm.taxApplicable ? "bg-[#0C447C]" : "bg-slate-200"}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${editFeeForm.taxApplicable ? "translate-x-5" : ""}`} />
              </button>
              <span className="text-xs text-slate-500">{editFeeForm.taxApplicable ? "Yes" : "No"}</span>
            </div>
            <FField label="Status">
              <FSelect value={editFeeForm.status} onChange={e => setEditFeeForm(f => ({ ...f, status: e.target.value }))}>
                <option>Active</option><option>Inactive</option>
              </FSelect>
            </FField>
            {/* Item 2 — this structure's own default discount, distinct from
                the separate per-student discount-assignment workflow. */}
            <FField label="Default Discount">
              <FSelect value={editFeeForm.discountType} onChange={e => setEditFeeForm(f => ({ ...f, discountType: e.target.value }))}>
                <option value="none">No discount</option>
                <option value="flat">Flat amount (₨)</option>
                <option value="percent">Percentage (%)</option>
              </FSelect>
            </FField>
            {editFeeForm.discountType !== "none" && (
              <FField label={editFeeForm.discountType === "percent" ? "Discount %" : "Discount ₨"}>
                <FInput type="number" min={0} placeholder="0" value={editFeeForm.discountValue} onChange={e => setEditFeeForm(f => ({ ...f, discountValue: e.target.value }))} />
              </FField>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-3">
            Currently v{editFeeStructure.version || 1}.{" "}
            {(editFeeStructure.billedInvoiceCount || 0) > 0
              ? `${editFeeStructure.billedInvoiceCount} invoice${editFeeStructure.billedInvoiceCount !== 1 ? "s" : ""} already billed from this structure — changing amount, due day, late fee, frequency, tax, or default discount will save as a new version and won't be shown until you confirm.`
              : "No invoices billed from this structure yet, so any change applies in place."}
          </p>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-500">Assign this exact structure to more students (same bulk-assign flow as the Fee Assignment tab).</p>
            <Btn
              variant="secondary"
              size="sm"
              onClick={() => {
                sessionStorage.setItem("pendingAssignFeeStructureId", editFeeStructure._id);
                setShowEditFeeModal(false);
                onNavigate?.("assignments");
              }}
            ><Users size={12} /> Assign to Students</Btn>
          </div>
          <ModalFooter
            onCancel={() => setShowEditFeeModal(false)}
            onSave={saveEditFeeStructure}
            saveLabel={updateFeeHeadMutation.isPending ? "Saving…" : "Save Changes"}
          />
        </Modal>
      )}

      {/* Item 40 — explicit confirmation of exactly what a versioning save
          will and won't affect, shown before it happens rather than only
          the small caption text on the edit form. */}
      {showVersionConfirm && editFeeStructure && (
        <Modal title="This will create a new version" onClose={() => setShowVersionConfirm(false)}>
          <div className="space-y-3 text-sm text-slate-700">
            <p>
              <span className="font-semibold">{editFeeStructure.billedInvoiceCount}</span> invoice{editFeeStructure.billedInvoiceCount !== 1 ? "s" : ""} for{" "}
              <span className="font-semibold">{editFeeStructure.name}</span> ({editFeeStructure.grade}{editFeeStructure.section ? ` - ${editFeeStructure.section}` : ""}) already exist with the current amounts.
            </p>
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-xs text-emerald-800">
              <span className="font-semibold">Will NOT change:</span> the {editFeeStructure.billedInvoiceCount} invoice{editFeeStructure.billedInvoiceCount !== 1 ? "s" : ""} already generated — they keep their original amounts, discounts, and challans exactly as printed. Nothing already billed or paid is touched.
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-800">
              <span className="font-semibold">Will change:</span> a new version (v{(editFeeStructure.version || 1) + 1}) is created with your edits and becomes active immediately — every invoice generated from now on (next "Generate Challan" run onward) uses the new amounts.
            </div>
            <p className="text-xs text-slate-400">The current version is kept, marked superseded, and stays visible/readable for every already-issued invoice — nothing is deleted.</p>
          </div>
          <ModalFooter
            onCancel={() => setShowVersionConfirm(false)}
            onSave={confirmSaveNewVersion}
            saveLabel={updateFeeHeadMutation.isPending ? "Saving…" : "Confirm — Save as New Version"}
          />
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

// A real fee-STRUCTURE assignment (which price list a student is actually
// billed from), deliberately separate from AssignForm above (which only
// ever assigns a discount) - see FEE-02. "student" targets exactly one
// student (the only mode that lets two students in the same class end up
// on different structures); "class" is the bulk convenience for assigning
// the same structure to a whole class/section at once.
type FeeAssignForm = {
  mode: "student" | "class";
  studentId: string;
  grade: string;
  section: string;
  feeStructureId: string;
  academicYear: string;
  effectiveFrom: string;
  effectiveTo: string;
  notes: string;
};
const BLANK_FEE_ASSIGN: FeeAssignForm = {
  mode: "student", studentId: "", grade: "", section: "", feeStructureId: "",
  academicYear: localStorage.getItem("academicYear") || "", effectiveFrom: "", effectiveTo: "", notes: "",
};

// FEE-04: three clearly separated sub-views within the same parent "Fee
// Assignment" tab, mirroring the PAYABLE_SUBTABS pill pattern above. Pure UI
// reorganization — every mutation/query/handler below is unchanged, only
// which Cards render for a given sub-tab.
type FeeAssignSubTab = "assign" | "discounts" | "challans";
const FEE_ASSIGN_SUBTABS: { id: FeeAssignSubTab; label: string }[] = [
  { id: "assign",     label: "Fee Assignment" },
  { id: "discounts",  label: "Discounts & Scholarships" },
  { id: "challans",   label: "Challan Generation" },
];

function FeeAssignmentTab() {
  const queryClient = useQueryClient();
  const [feeSub, setFeeSub] = useState<FeeAssignSubTab>("assign");

  const { data: programs = [], isLoading: programsLoading } = useQuery({ queryKey: ["discount-programs"], queryFn: financeService.getDiscountPrograms });
  const { data: assignmentsList = [], isLoading: assignmentsLoading } = useQuery({ queryKey: ["fee-assignments"], queryFn: financeService.getFeeAssignments });
  const { data: feeStructuresList = [] } = useQuery({ queryKey: ["fee-structures"], queryFn: () => financeService.getFeeStructures() });
  const { data: studentFeeAssignments = [], isLoading: sfaLoading } = useQuery({ queryKey: ["student-fee-assignments"], queryFn: () => financeService.getStudentFeeAssignments() });
  // refetchOnMount: "always" - grade/section data can otherwise be served
  // from cache for up to 5 minutes (global staleTime), so sections added a
  // moment ago in Institution Setup wouldn't show up here yet.
  const { data: grades = [] } = useQuery({ queryKey: ["grades"], queryFn: () => organizationService.getGrades(), refetchOnMount: "always" });
  const { data: campuses = [] } = useQuery({ queryKey: ["campuses"], queryFn: organizationService.getCampuses });

  const [showProgramModal, setShowProgramModal] = useState(false);
  const [programForm, setProgramForm] = useState<ProgramForm>({ ...BLANK_PROGRAM });
  const [editingProgramId, setEditingProgramId] = useState<string | null>(null);

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignForm, setAssignForm] = useState<AssignForm>({ ...BLANK_ASSIGN });
  const [familyResults, setFamilyResults] = useState<any[]>([]);

  const [showFeeAssignModal, setShowFeeAssignModal] = useState(false);
  const [feeAssignForm, setFeeAssignForm] = useState<FeeAssignForm>({ ...BLANK_FEE_ASSIGN });
  const [feeAssignPreviewConflict, setFeeAssignPreviewConflict] = useState<string | null>(null);
  const [bulkFeeAssignConflicts, setBulkFeeAssignConflicts] = useState<{ studentId: string; message?: string }[] | null>(null);

  const bulkPreviewStudents = useStudents(
    { status: "active", limit: 500, grade: feeAssignForm.grade || undefined, section: feeAssignForm.section || undefined },
    { enabled: showFeeAssignModal && feeAssignForm.mode === "class" && !!feeAssignForm.grade },
  );
  const selectedFeeStructure = (feeStructuresList as any[]).find((f: any) => f._id === feeAssignForm.feeStructureId);

  // Item 2 fix — "Assign to Students" from Edit Fee Structure hands off the
  // chosen structure here via sessionStorage (the two modals live in
  // separate top-level tab components) rather than duplicating the
  // bulk-assign flow: this reuses the exact same modal/mutation, just
  // pre-filled and pre-opened for that one structure.
  useEffect(() => {
    const pendingId = sessionStorage.getItem("pendingAssignFeeStructureId");
    if (!pendingId || (feeStructuresList as any[]).length === 0) return;
    const structure = (feeStructuresList as any[]).find((f: any) => f._id === pendingId);
    sessionStorage.removeItem("pendingAssignFeeStructureId");
    if (!structure) return;
    setFeeSub("assign");
    setFeeAssignForm({ ...BLANK_FEE_ASSIGN, feeStructureId: structure._id, academicYear: structure.academicYear || "", mode: "class", grade: structure.grade || "", section: structure.section || "" });
    setFeeAssignPreviewConflict(null);
    setBulkFeeAssignConflicts(null);
    setShowFeeAssignModal(true);
  }, [feeStructuresList]);

  const assignFeeStructureMut = useMutation({
    mutationFn: (payload: any) => financeService.assignFeeStructure(payload),
    onSuccess: (res: any) => {
      if (res.conflict) { setFeeAssignPreviewConflict(res.message); return; }
      toast.success("Fee structure assigned");
      setShowFeeAssignModal(false);
      setFeeAssignForm({ ...BLANK_FEE_ASSIGN });
      setFeeAssignPreviewConflict(null);
      queryClient.invalidateQueries({ queryKey: ["student-fee-assignments"] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Failed to assign fee structure"),
  });
  const bulkAssignFeeStructureMut = useMutation({
    mutationFn: (payload: any) => financeService.bulkAssignFeeStructure(payload),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["student-fee-assignments"] });
      if (res.conflicts?.length) {
        // Don't just toast-and-close: surface exactly which students
        // conflicted so the admin can review and, if they choose, replace
        // all of them in one go — mirrors the single-student flow above.
        toast(`Assigned to ${res.assigned}, but ${res.conflicts.length} student(s) already had an overlapping assignment.`, { icon: "⚠️" });
        setBulkFeeAssignConflicts(res.conflicts);
      } else {
        toast.success(`Fee structure assigned to ${res.assigned} student(s)`);
        setShowFeeAssignModal(false);
        setFeeAssignForm({ ...BLANK_FEE_ASSIGN });
        setBulkFeeAssignConflicts(null);
      }
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Failed to assign fee structure"),
  });
  const removeStudentFeeAssignment = useMutation({
    mutationFn: (id: string) => financeService.deleteStudentFeeAssignment(id),
    onSuccess: () => { toast.success("Removed"); queryClient.invalidateQueries({ queryKey: ["student-fee-assignments"] }); },
  });

  function saveFeeAssignment(replace = false) {
    if (!feeAssignForm.feeStructureId) { toast.error("Select a fee structure"); return; }
    if (!feeAssignForm.effectiveFrom) { toast.error("Effective From date is required"); return; }
    if (feeAssignForm.mode === "student") {
      if (!feeAssignForm.studentId) { toast.error("Select a student"); return; }
      assignFeeStructureMut.mutate({
        studentId: feeAssignForm.studentId, feeStructureId: feeAssignForm.feeStructureId,
        academicYear: feeAssignForm.academicYear, effectiveFrom: feeAssignForm.effectiveFrom,
        effectiveTo: feeAssignForm.effectiveTo || null, notes: feeAssignForm.notes, replace,
      });
    } else {
      if (!feeAssignForm.grade) { toast.error("Select a class"); return; }
      // The roster query failing (e.g. a rejected request) must not be
      // read as "this class has 0 students" - that used to happen
      // silently whenever the roster fetch errored, since `.data` just
      // defaults to [] either way. Surface the real error instead.
      if (bulkPreviewStudents.isError) {
        toast.error((bulkPreviewStudents.error as any)?.response?.data?.message || "Could not load the class roster - try again");
        return;
      }
      const studentIds = ((bulkPreviewStudents.data as any)?.data ?? []).map((s: any) => s._id);
      if (studentIds.length === 0) { toast.error("No active students found for that class/section"); return; }
      bulkAssignFeeStructureMut.mutate({
        studentIds, feeStructureId: feeAssignForm.feeStructureId,
        academicYear: feeAssignForm.academicYear, effectiveFrom: feeAssignForm.effectiveFrom,
        effectiveTo: feeAssignForm.effectiveTo || null, notes: feeAssignForm.notes, replace,
      });
    }
  }

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

  const updateProgramMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => financeService.updateDiscountProgram(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discount-programs"] });
      toast.success("Program updated");
      setShowProgramModal(false);
      setEditingProgramId(null);
      setProgramForm({ ...BLANK_PROGRAM });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to update program"),
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
      setShowGenConfirm(false);
      setDryRunResult(null);
      toast.success(`Generated ${result.created} challan${result.created !== 1 ? "s" : ""}${result.skipped ? `, skipped ${result.skipped}` : ""}`);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to generate challans"),
  });

  // FEE-05: dry-run preview — runs the exact same matching/eligibility logic
  // server-side but persists nothing, so the admin sees willCreate/skipped
  // counts and confirms via a real modal (not window.confirm) before any
  // Invoice document is actually created.
  const [showGenConfirm, setShowGenConfirm] = useState(false);
  const [dryRunResult, setDryRunResult] = useState<any | null>(null);
  const dryRunMutation = useMutation({
    mutationFn: (payload: any) => financeService.generateInvoices({ ...payload, dryRun: true }),
    onSuccess: (result: any) => { setDryRunResult(result); setShowGenConfirm(true); },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to preview challans"),
  });

  function saveProgram() {
    if (!programForm.name.trim()) { toast.error("Program name is required"); return; }
    if (!programForm.value || Number(programForm.value) <= 0) { toast.error("Value is required"); return; }
    const payload = {
      name: programForm.name,
      type: programForm.type,
      valueType: programForm.valueType,
      value: Number(programForm.value),
      maxAmount: programForm.maxAmount ? Number(programForm.maxAmount) : undefined,
      description: programForm.description || undefined,
      validFrom: programForm.validFrom || undefined,
      validTo: programForm.validTo || undefined,
      isActive: programForm.status === "Active",
    };
    if (editingProgramId) {
      updateProgramMutation.mutate({ id: editingProgramId, data: payload });
    } else {
      createProgram.mutate(payload);
    }
  }

  function openEditProgram(p: any) {
    setEditingProgramId(p._id);
    setProgramForm({
      name: p.name,
      type: p.type,
      valueType: p.valueType,
      value: String(p.value ?? ""),
      maxAmount: p.maxAmount != null ? String(p.maxAmount) : "",
      description: p.description || "",
      validFrom: p.validFrom ? String(p.validFrom).slice(0, 10) : "",
      validTo: p.validTo ? String(p.validTo).slice(0, 10) : "",
      status: p.isActive ? "Active" : "Inactive",
    });
    setShowProgramModal(true);
  }

  function closeProgramModal() {
    setShowProgramModal(false);
    setEditingProgramId(null);
    setProgramForm({ ...BLANK_PROGRAM });
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
    const scopeValue = getScopeValue();
    if (genScope !== "all" && !scopeValue) { toast.error("Select a target for this scope"); return; }
    setGenResult(null);
    setDryRunResult(null);
    dryRunMutation.mutate({ month: genMonth, scopeType: genScope, scopeValue });
  }

  function confirmGenerate() {
    const scopeValue = getScopeValue();
    generateMutation.mutate({ month: genMonth, scopeType: genScope, scopeValue });
  }

  function getScopeValue(): string | undefined {
    if (genScope === "class") return genGrade;
    if (genScope === "section") return `${genGrade}::${genSection}`;
    if (genScope === "campus") return genCampus;
    if (genScope === "student") return genStudentId;
    return undefined;
  }

  const [printingChallans, setPrintingChallans] = useState(false);
  const [challanPreview, setChallanPreview] = useState<{ blob: Blob; filename: string } | null>(null);
  async function printChallans() {
    if (!genMonth) { toast.error("Select a month"); return; }
    const scopeValue = getScopeValue();
    if (genScope !== "all" && !scopeValue) { toast.error("Select a target for this scope"); return; }
    setPrintingChallans(true);
    try {
      const blob = await pdfApi.generateBulkChallansPdf({ month: genMonth, scopeType: genScope, scopeValue });
      // Preview first (FEE-06) - Print/Download are both explicit actions
      // the user takes from the preview modal, never automatic on click.
      setChallanPreview({ blob, filename: `challans-${genScope}-${genMonth}.pdf` });
    } catch (err: any) {
      const message = await extractBlobError(err);
      const handled = offerRetagFixIfApplicable(
        message,
        { month: genMonth, scopeType: genScope, scopeValue },
        () => printChallans(), // auto-retry the print once the fix is applied
      );
      if (!handled) toast.error(message);
    } finally {
      setPrintingChallans(false);
    }
  }

  const [deletingChallans, setDeletingChallans] = useState(false);
  async function deleteChallans() {
    if (!genMonth) { toast.error("Select a month"); return; }
    const scopeValue = getScopeValue();
    if (genScope !== "all" && !scopeValue) { toast.error("Select a target for this scope"); return; }
    const scopeLabel = genScope === "all" ? "ALL active students" : `${genScope}: ${scopeValue}`;
    if (!window.confirm(`Undo challans generated for ${genMonth} (${scopeLabel})?\n\nThis soft-deletes every matching invoice - they'll disappear from Receivables/Reports/Print immediately, but stay recoverable in the database if needed. This does not affect payments already collected.`)) {
      return;
    }
    // Extra friction for the "all active students" scope specifically - a
    // whole-school delete is the one shape of this action that can wipe a
    // month's worth of challans by accident (e.g. Scope was just left on
    // its default). Narrower scopes already got an explicit confirm above.
    if (genScope === "all") {
      const typed = window.prompt(`This will delete challans for ALL active students in ${genMonth}. Type DELETE ALL to confirm.`);
      if (typed !== "DELETE ALL") { toast("Cancelled — nothing was deleted", { icon: "ℹ️" }); return; }
    }
    setDeletingChallans(true);
    try {
      const result = await financeService.bulkDeleteInvoices({ month: genMonth, scopeType: genScope, scopeValue });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success(`Reverted ${result.deleted} challan${result.deleted !== 1 ? "s" : ""}`);
      setGenResult(null);
    } catch (err: any) {
      const message = err.response?.data?.message || "Failed to revert challans";
      const handled = offerRetagFixIfApplicable(
        message,
        { month: genMonth, scopeType: genScope, scopeValue },
        () => deleteChallans(), // auto-retry the delete once the fix is applied
      );
      if (!handled) toast.error(message);
    } finally {
      setDeletingChallans(false);
    }
  }

  const sectionsForGrade = (gradeName: string) => (grades as any[]).find((g: any) => g.name === gradeName)?.sections || [];

  return (
    <div className="space-y-5">
      <div className="flex gap-1 border-b border-slate-200">
        {FEE_ASSIGN_SUBTABS.map(t => (
          <button key={t.id} onClick={() => setFeeSub(t.id)}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${feeSub === t.id ? "border-[#0C447C] text-[#0C447C]" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {feeSub === "challans" && (
      <>
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
              {genGrade && sectionsForGrade(genGrade).length === 0 && (
                <p className="text-xs text-amber-600 mt-1">No sections found for {genGrade} — add them in Institution Setup → Classes & Sections.</p>
              )}
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
          <div className="flex gap-2">
            <Btn variant="primary" onClick={runGenerate}>
              {dryRunMutation.isPending ? "Checking…" : generateMutation.isPending ? "Generating…" : "⚡ Generate Challans"}
            </Btn>
            <Btn variant="secondary" onClick={printChallans}>
              {printingChallans ? "Preparing…" : "🖨️ Print Challans"}
            </Btn>
            <button
              onClick={deleteChallans}
              disabled={deletingChallans}
              className="px-3 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50"
            >
              {deletingChallans ? "Reverting…" : "↩ Undo / Delete Challans"}
            </button>
          </div>
        </div>
        <p className="px-4 pb-2 text-xs text-slate-400">"Print Challans" downloads a single PDF with one voucher (3 copies each) per student already billed for this month/scope — generate first, then print. "Undo / Delete" reverts a mistaken or stale generation for the same month/scope (e.g. challans created under the wrong academic year) — it doesn't affect any payments already collected.</p>
        {genResult && (
          <div className="px-4 pb-4">
            <div className="border border-slate-100 rounded-lg p-3 text-sm flex flex-wrap gap-4">
              <span className="text-emerald-600 font-semibold">✓ {genResult.created} created</span>
              {genResult.discountsSynced > 0 && (
                <span className="text-blue-600 font-semibold">↻ {genResult.discountsSynced} updated — discount/scholarship applied to an already-billed, still-unpaid challan</span>
              )}
              {genResult.skippedAlreadyBilled > 0 && (
                <span className="text-slate-500">{genResult.skippedAlreadyBilled} already billed this month</span>
              )}
              {genResult.skippedNoMatch > 0 && (
                <span className="text-amber-600 font-medium">{genResult.skippedNoMatch} skipped — no Fee Structure defined for their class</span>
              )}
              {genResult.errors?.length > 0 && <span className="text-red-500">{genResult.errors.length} errors</span>}
            </div>
            {genResult.noMatchBreakdown?.length > 0 && (
              <div className="mt-2 text-xs text-slate-500">
                <p className="font-semibold mb-1">Classes with no matching Fee Structure — add one under Fee &amp; Revenue → Add Fee Structure:</p>
                <ul className="list-disc pl-5 space-y-0.5">
                  {genResult.noMatchBreakdown.map((g: any, i: number) => (
                    <li key={i}>{g.grade} — {g.count} student{g.count !== 1 ? "s" : ""}</li>
                  ))}
                </ul>
              </div>
            )}
            {genResult.errors?.length > 0 && (
              // FEE-05: show every error instead of capping at 5 — a
              // scrollable list keeps the card's layout bounded even when a
              // bulk run produces dozens of per-student errors.
              <ul className="mt-2 text-xs text-red-500 list-disc pl-5 max-h-40 overflow-y-auto space-y-0.5">
                {genResult.errors.map((e: string, i: number) => <li key={i}>{e}</li>)}
              </ul>
            )}
          </div>
        )}
      </Card>
      </>
      )}

      {feeSub === "discounts" && (
      <>
      {/* Discount / Scholarship Programs */}
      <Card>
        <CardHeader
          title="Discount & Scholarship Programs"
          sub="Reusable templates you can assign to students, families, classes, sections, or campuses"
          actions={<Btn variant="primary" onClick={() => { setEditingProgramId(null); setProgramForm({ ...BLANK_PROGRAM }); setShowProgramModal(true); }}><Plus size={12} /> New Program</Btn>}
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
                <div className="flex gap-1">
                  <button onClick={() => openEditProgram(p)} className="p-1.5 text-slate-400 hover:text-[#0C447C] hover:bg-blue-50 rounded-lg" title="Edit"><Edit size={13} /></button>
                  <button onClick={() => toggleProgram.mutate({ id: p._id, isActive: !p.isActive })} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg" title={p.isActive ? "Deactivate" : "Activate"}>{p.isActive ? <XCircle size={13} /> : <CheckCircle size={13} />}</button>
                </div>
              </td>
            </tr>
          ))}
        </TableWrap>
      </Card>
      </>
      )}

      {feeSub === "assign" && (
      <>
      {/* Assign Fee — which price list a student is actually billed from.
          Deliberately separate from the discount assignments below (see
          FEE-02/FEE-03): two students in the identical class/section can
          each carry a different one of these and bill correctly. */}
      <Card>
        <CardHeader
          title="Assign Fee"
          sub="Which fee structure each student is actually billed from — different students in the same class can have different structures"
          actions={<Btn variant="primary" onClick={() => { setFeeAssignForm({ ...BLANK_FEE_ASSIGN }); setFeeAssignPreviewConflict(null); setBulkFeeAssignConflicts(null); setShowFeeAssignModal(true); }}><Plus size={12} /> Assign Fee</Btn>}
        />
        <TableWrap headers={["Student", "Fee Structure", "Academic Year", "Effective", "Notes", "Action"]}>
          {sfaLoading ? (
            <tr><td colSpan={6} className="px-4 py-12 text-center"><div className="w-6 h-6 border-4 border-[#0C447C] border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
          ) : (studentFeeAssignments as any[]).filter((a: any) => a.isActive).length === 0 ? (
            <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-400">No students have an explicit fee structure assignment yet — they'll bill from whichever structure matches their class/section/campus.</td></tr>
          ) : (studentFeeAssignments as any[]).filter((a: any) => a.isActive).map((a: any) => (
            <tr key={a._id} className="hover:bg-slate-50">
              <td className="px-4 py-3 text-sm font-semibold text-slate-800">{a.studentName}</td>
              <td className="px-4 py-3 text-xs text-slate-600">{a.feeStructureName}</td>
              <td className="px-4 py-3 text-xs text-slate-500">{a.academicYear}</td>
              <td className="px-4 py-3 text-xs text-slate-500">{new Date(a.effectiveFrom).toLocaleDateString()}{a.effectiveTo ? ` – ${new Date(a.effectiveTo).toLocaleDateString()}` : " – ongoing"}</td>
              <td className="px-4 py-3 text-xs text-slate-500">{a.notes || "—"}</td>
              <td className="px-4 py-3">
                <button onClick={() => { if (window.confirm(`Remove ${a.studentName}'s assignment to "${a.feeStructureName}"?\n\nThis only removes the assignment record — it does not delete or reverse any invoices/receipts already generated from it.`)) removeStudentFeeAssignment.mutate(a._id); }} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Remove"><Trash2 size={13} /></button>
              </td>
            </tr>
          ))}
        </TableWrap>
      </Card>
      </>
      )}

      {feeSub === "discounts" && (
      <>
      {/* Assign Discount — a discount/scholarship/grant on top of whatever
          fee structure a student is already billed from (see above) or
          auto-matched to. Kept separate from fee-structure assignment. */}
      <Card>
        <CardHeader
          title="Assign Discount"
          sub="Who actually gets which discount, scholarship, or grant"
          actions={<Btn variant="primary" onClick={() => setShowAssignModal(true)}><Plus size={12} /> Assign Discount</Btn>}
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
                <button onClick={() => { if (window.confirm(`Remove this discount assignment (${a.targetLabel || a.targetValue})?`)) removeAssignment.mutate(a._id); }} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Remove"><Trash2 size={13} /></button>
              </td>
            </tr>
          ))}
        </TableWrap>
      </Card>
      </>
      )}

      {/* Add Program Modal */}
      {showProgramModal && (
        <Modal title={editingProgramId ? "Edit Discount / Scholarship Program" : "New Discount / Scholarship Program"} size="lg" onClose={closeProgramModal}>
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
          <ModalFooter
            onCancel={closeProgramModal}
            onSave={saveProgram}
            saveLabel={
              editingProgramId
                ? (updateProgramMutation.isPending ? "Saving…" : "✓ Save Changes")
                : (createProgram.isPending ? "Saving…" : "＋ Create Program")
            }
          />
        </Modal>
      )}

      {/* Assign Fee Modal — real fee-structure assignment (FEE-02) */}
      {showFeeAssignModal && (
        <Modal title="Assign Fee" size="lg" onClose={() => { setShowFeeAssignModal(false); setBulkFeeAssignConflicts(null); }}>
          <div className="space-y-4">
            <FField label="Assign To" required>
              <div className="flex gap-2">
                <button onClick={() => setFeeAssignForm(f => ({ ...f, mode: "student" }))} className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border ${feeAssignForm.mode === "student" ? "bg-[#0C447C] text-white border-[#0C447C]" : "border-slate-200 text-slate-600"}`}>One Student</button>
                <button onClick={() => setFeeAssignForm(f => ({ ...f, mode: "class" }))} className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border ${feeAssignForm.mode === "class" ? "bg-[#0C447C] text-white border-[#0C447C]" : "border-slate-200 text-slate-600"}`}>Whole Class (bulk)</button>
              </div>
            </FField>

            {feeAssignForm.mode === "student" ? (
              <FField label="Student" required>
                <StudentSelect value={feeAssignForm.studentId} onChange={(id) => setFeeAssignForm(f => ({ ...f, studentId: id }))} />
              </FField>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <FField label="Class" required>
                  <FSelect value={feeAssignForm.grade} onChange={e => setFeeAssignForm(f => ({ ...f, grade: e.target.value, section: "" }))}>
                    <option value="">Select…</option>
                    {(grades as any[]).map((g: any) => <option key={g._id} value={g.name}>{g.name}</option>)}
                  </FSelect>
                </FField>
                <FField label="Section (optional)">
                  <FSelect value={feeAssignForm.section} onChange={e => setFeeAssignForm(f => ({ ...f, section: e.target.value }))}>
                    <option value="">All sections</option>
                    {sectionsForGrade(feeAssignForm.grade).map((s: any) => <option key={s._id} value={s.name}>{s.name}</option>)}
                  </FSelect>
                </FField>
                {feeAssignForm.grade && (
                  <p className={`col-span-2 text-xs ${bulkPreviewStudents.isError ? "text-red-600" : "text-slate-500"}`}>
                    {bulkPreviewStudents.isLoading
                      ? "Loading students…"
                      : bulkPreviewStudents.isError
                      ? "Could not load the class roster — try again."
                      : `Will assign to ${((bulkPreviewStudents.data as any)?.data ?? []).length} active student(s).`}
                  </p>
                )}
              </div>
            )}

            <FField label="Fee Structure" required>
              <FSelect value={feeAssignForm.feeStructureId} onChange={e => setFeeAssignForm(f => ({ ...f, feeStructureId: e.target.value }))}>
                <option value="">Select…</option>
                {(feeStructuresList as any[]).filter((f: any) => f.isActive && f.status !== "superseded").map((f: any) => (
                  <option key={f._id} value={f._id}>{f.name} — ₨{(f.totalAmount || 0).toLocaleString()} ({f.frequency}){f.grade ? ` · ${f.grade}${f.section ? ` ${f.section}` : ""}` : ""}</option>
                ))}
              </FSelect>
            </FField>

            {selectedFeeStructure && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <p className="text-xs font-semibold text-slate-600 mb-1.5">Fee heads in this structure:</p>
                <div className="space-y-1">
                  {(selectedFeeStructure.items || []).map((item: any, i: number) => (
                    <div key={i} className="flex justify-between text-xs text-slate-600">
                      <span>{item.feeHead}</span>
                      <span className="font-mono">₨{(item.amount || 0).toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-xs font-bold text-[#0C447C] pt-1 border-t border-slate-200">
                    <span>Total</span>
                    <span className="font-mono">₨{(selectedFeeStructure.totalAmount || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <FField label="Academic Year" required>
                <FInput value={feeAssignForm.academicYear} onChange={e => setFeeAssignForm(f => ({ ...f, academicYear: e.target.value }))} placeholder="e.g. 2026-27" />
              </FField>
              <FField label="Notes">
                <FInput value={feeAssignForm.notes} onChange={e => setFeeAssignForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional" />
              </FField>
              <FField label="Effective From" required>
                <FInput type="date" value={feeAssignForm.effectiveFrom} onChange={e => setFeeAssignForm(f => ({ ...f, effectiveFrom: e.target.value }))} />
              </FField>
              <FField label="Effective To (optional)">
                <FInput type="date" value={feeAssignForm.effectiveTo} onChange={e => setFeeAssignForm(f => ({ ...f, effectiveTo: e.target.value }))} />
              </FField>
            </div>

            {feeAssignPreviewConflict && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs text-amber-800 mb-2">⚠ {feeAssignPreviewConflict}</p>
                <Btn variant="secondary" onClick={() => saveFeeAssignment(true)}>Replace existing assignment</Btn>
              </div>
            )}

            {bulkFeeAssignConflicts && bulkFeeAssignConflicts.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
                <p className="text-xs font-semibold text-amber-800">
                  ⚠ {bulkFeeAssignConflicts.length} student(s) already have an overlapping fee assignment and were not assigned:
                </p>
                <ul className="text-xs text-amber-800 list-disc pl-4 space-y-0.5 max-h-32 overflow-y-auto">
                  {bulkFeeAssignConflicts.map((c, i) => (
                    <li key={c.studentId || i}>{c.message || c.studentId}</li>
                  ))}
                </ul>
                <Btn variant="secondary" onClick={() => saveFeeAssignment(true)}>
                  {bulkAssignFeeStructureMut.isPending ? "Replacing…" : "Replace all conflicting assignments"}
                </Btn>
              </div>
            )}
          </div>
          <ModalFooter
            onCancel={() => { setShowFeeAssignModal(false); setBulkFeeAssignConflicts(null); }}
            onSave={() => saveFeeAssignment(false)}
            saveLabel={(assignFeeStructureMut.isPending || bulkAssignFeeStructureMut.isPending) ? "Saving…" : "＋ Assign Fee"}
          />
        </Modal>
      )}

      {/* Assign Discount Modal */}
      {showAssignModal && (
        <Modal title="Assign Discount" size="lg" onClose={() => setShowAssignModal(false)}>
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
                    {assignForm.grade && sectionsForGrade(assignForm.grade).length === 0 && (
                      <p className="text-xs text-amber-600 mt-1">No sections found for {assignForm.grade} — add them in Institution Setup → Classes & Sections.</p>
                    )}
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
                <FField label="Discount / Scholarship Program">
                  <FSelect value={assignForm.programId} onChange={e => setAssignForm(f => ({ ...f, programId: e.target.value }))}>
                    <option value="">Select…</option>
                    {(programs as any[]).filter((p: any) => p.isActive).map((p: any) => (
                      <option key={p._id} value={p._id}>{p.name} ({p.valueType === "percentage" ? `${p.value}%` : `₨${p.value}`})</option>
                    ))}
                  </FSelect>
                  {(programs as any[]).filter((p: any) => p.isActive).length === 0 && (
                    <p className="text-xs text-slate-400 mt-1">No active programs yet — create one above, or switch to "Custom One-Off".</p>
                  )}
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

      {challanPreview && (
        <ChallanPreviewModal blob={challanPreview.blob} filename={challanPreview.filename} onClose={() => setChallanPreview(null)} />
      )}

      {/* FEE-05: dry-run preview confirmation — replaces a raw "generate
          immediately on click" with a real Modal the admin must explicitly
          confirm, showing exactly what a real run would do first. */}
      {showGenConfirm && dryRunResult && (
        <Modal title="Confirm Challan Generation" onClose={() => setShowGenConfirm(false)}>
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              Preview for <span className="font-semibold">{genMonth}</span> — scope:{" "}
              <span className="font-semibold">{genScope === "all" ? "All Active Students" : `${genScope}: ${getScopeValue()}`}</span>
            </p>
            <div className="border border-slate-100 rounded-lg p-3 text-sm flex flex-wrap gap-4">
              <span className="text-emerald-600 font-semibold">✓ {dryRunResult.willCreate} will be created</span>
              {/* Item 36 — a discount/scholarship assigned to a student
                  AFTER their challan was already generated this month
                  wasn't reflected until now: this run will resync those
                  (still-unpaid) invoices instead of silently skipping them
                  as "already billed" with no explanation. */}
              {dryRunResult.willSyncDiscounts > 0 && (
                <span className="text-blue-600 font-semibold">↻ {dryRunResult.willSyncDiscounts} will be updated — discount/scholarship assigned after their challan was generated</span>
              )}
              {dryRunResult.skippedAlreadyBilled > 0 && (
                <span className="text-slate-500">{dryRunResult.skippedAlreadyBilled} already billed this month{dryRunResult.willSyncDiscounts > 0 ? " (no discount change)" : ""}</span>
              )}
              {dryRunResult.skippedNoMatch > 0 && (
                <span className="text-amber-600 font-medium">{dryRunResult.skippedNoMatch} skipped — no Fee Structure defined for their class</span>
              )}
            </div>
            {dryRunResult.noMatchBreakdown?.length > 0 && (
              <div className="text-xs text-slate-500">
                <p className="font-semibold mb-1">Classes with no matching Fee Structure:</p>
                <ul className="list-disc pl-5 space-y-0.5">
                  {dryRunResult.noMatchBreakdown.map((g: any, i: number) => (
                    <li key={i}>{g.grade} — {g.count} student{g.count !== 1 ? "s" : ""}</li>
                  ))}
                </ul>
              </div>
            )}
            {dryRunResult.willCreate === 0 && (
              <p className="text-xs text-amber-600">Nothing will be created for this month/scope — everyone matched is already billed, or has no matching Fee Structure.</p>
            )}
          </div>
          <ModalFooter
            onCancel={() => setShowGenConfirm(false)}
            onSave={confirmGenerate}
            saveLabel={generateMutation.isPending ? "Generating…" : `Confirm — Generate ${dryRunResult.willCreate} Challan${dryRunResult.willCreate !== 1 ? "s" : ""}`}
          />
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
  const [challanPreview, setChallanPreview] = useState<{ blob: Blob; filename: string } | null>(null);
  const [editingInvoice, setEditingInvoice] = useState(false);
  const [editDueDate, setEditDueDate] = useState("");
  const [editAdjDesc, setEditAdjDesc] = useState("");
  const [editAdjAmount, setEditAdjAmount] = useState("");
  const [editAdjReason, setEditAdjReason] = useState("");
  const queryClient = useQueryClient();
  const { data: invoices = [], isLoading: invLoading } = useQuery({ queryKey: ["invoices"], queryFn: () => financeService.getInvoices() });
  const { data: payments = [] } = useQuery({ queryKey: ["payments"], queryFn: financeService.getPayments });
  const updateInvoiceMut = useMutation({
    mutationFn: (payload: any) => financeService.updateInvoice(viewInvoice._id, payload),
    onSuccess: (updated: any) => {
      toast.success("Invoice updated");
      setViewInvoice(updated);
      setEditingInvoice(false);
      setEditAdjDesc(""); setEditAdjAmount(""); setEditAdjReason("");
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Failed to update invoice"),
  });
  // Item 1 fix — a fee/receipt used to be deletable with zero restriction:
  // no confirmation, no block on a receipted invoice, and no reversal of
  // whatever it had already posted to the ledger. deleteInvoice now blocks
  // server-side unless every payment against it has been reverted first;
  // reversePayment un-applies a receipt and reverses its GL posting instead
  // of ever deleting it outright.
  const deleteInvoiceMut = useMutation({
    mutationFn: (reason?: string) => financeService.deleteInvoice(viewInvoice._id, reason),
    onSuccess: () => {
      toast.success("Invoice deleted");
      setViewInvoice(null);
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Failed to delete invoice"),
  });
  const revertPaymentMut = useMutation({
    mutationFn: (paymentId: string) => financeService.reversePayment(paymentId, "Reverted by admin from Receivables"),
    onSuccess: () => {
      toast.success("Receipt reverted — invoice balance and ledger updated");
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Failed to revert receipt"),
  });
  const invoicePayments = (payments as any[]).filter(p => viewInvoice && String(p.invoiceId) === String(viewInvoice._id));
  const bulkRemindMut = useMutation({
    mutationFn: (ids: string[]) => financeService.sendBulkDefaulterReminders(ids, "email"),
    onSuccess: (res: any) => {
      const sent = res.results.filter((r: any) => r.status === "sent").length;
      toast.success(`${sent} of ${res.attempted} reminders actually sent`);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Failed to send reminders"),
  });
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
              <Btn variant="secondary" onClick={() => {
                const ids = filtered.filter(i => i.balanceDue > 0).map(i => i._id);
                if (ids.length === 0) { toast("No outstanding invoices to remind", { icon: "ℹ️" }); return; }
                bulkRemindMut.mutate(ids);
              }}><Send size={12} /> Bulk Reminders</Btn>
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
        <Modal title={`Invoice ${viewInvoice.invoiceNumber}`} onClose={() => { setViewInvoice(null); setEditingInvoice(false); }}>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-xs text-slate-400">Student</p><p className="font-semibold">{viewInvoice.studentName}</p></div>
            <div><p className="text-xs text-slate-400">Grade</p><p className="font-semibold">{viewInvoice.grade}</p></div>
            <div><p className="text-xs text-slate-400">Total Amount</p><p className="font-semibold">₨ {(viewInvoice.totalAmount || 0).toLocaleString()}</p></div>
            <div><p className="text-xs text-slate-400">Paid</p><p className="font-semibold text-emerald-600">₨ {(viewInvoice.paidAmount || 0).toLocaleString()}</p></div>
            <div><p className="text-xs text-slate-400">Balance</p><p className="font-semibold">₨ {(viewInvoice.balanceDue || 0).toLocaleString()}</p></div>
            <div><p className="text-xs text-slate-400">Status</p><Badge v={invStatusVariant(viewInvoice.status)}>{viewInvoice.status}</Badge></div>
            <div><p className="text-xs text-slate-400">Due Date</p><p className="font-semibold">{viewInvoice.dueDate ? new Date(viewInvoice.dueDate).toLocaleDateString() : "—"}</p></div>
            <div className="col-span-2">
              <p className="text-xs text-slate-400 mb-1">Line Items</p>
              {(viewInvoice.items || []).map((it: any, i: number) => (
                <div key={i} className={`flex justify-between text-xs py-1 border-b border-slate-50 ${it.feeHead === "adjustment" ? "text-amber-700" : ""}`}>
                  <span>{it.description}{it.feeHead === "adjustment" ? " (adjustment)" : ""}</span><span className="font-mono">₨ {(it.amount || 0).toLocaleString()}</span>
                </div>
              ))}
            </div>
            {invoicePayments.length > 0 && (
              <div className="col-span-2">
                <p className="text-xs text-slate-400 mb-1">Receipts Collected</p>
                {invoicePayments.map((p: any) => (
                  <div key={p._id} className={`flex justify-between items-center text-xs py-1.5 border-b border-slate-50 ${p.isRefunded ? "text-slate-400" : ""}`}>
                    <span className="font-mono">{p.receiptNumber} — ₨ {(p.amount || 0).toLocaleString()} ({p.paymentMethod})</span>
                    {p.isRefunded ? (
                      <span className="text-[11px] italic">Reverted</span>
                    ) : (
                      <button
                        onClick={() => {
                          if (window.confirm(`Revert receipt ${p.receiptNumber} for ₨ ${(p.amount || 0).toLocaleString()}?\n\nThis un-applies the payment from this invoice's paid/balance totals and posts a REVERSING journal entry (the original ledger posting is marked reversed, never deleted). The receipt cannot be un-reverted.`)) {
                            revertPaymentMut.mutate(p._id);
                          }
                        }}
                        className="px-2 py-0.5 text-[11px] font-semibold text-red-600 hover:bg-red-50 rounded"
                      >Revert</button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {editingInvoice ? (
            <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
              {viewInvoice.status === "paid" ? (
                <p className="text-xs text-red-600">This invoice is fully paid and can no longer be edited.</p>
              ) : (
                <>
                  <FField label="Due Date">
                    <FInput type="date" value={editDueDate} onChange={e => setEditDueDate(e.target.value)} />
                  </FField>
                  <p className="text-xs text-slate-500">Manual adjustment (e.g. late-fee waiver or correction) — additive only, never rewrites the original fee-matched items.</p>
                  <div className="grid grid-cols-2 gap-3">
                    <FField label="Description">
                      <FInput value={editAdjDesc} onChange={e => setEditAdjDesc(e.target.value)} placeholder="e.g. Late fee waiver" />
                    </FField>
                    <FField label="Amount (negative to waive/reduce)">
                      <FInput type="number" value={editAdjAmount} onChange={e => setEditAdjAmount(e.target.value)} placeholder="e.g. -500" />
                    </FField>
                    <FField label="Reason (optional)">
                      <FInput value={editAdjReason} onChange={e => setEditAdjReason(e.target.value)} placeholder="Optional" />
                    </FField>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Btn variant="secondary" size="sm" onClick={() => setEditingInvoice(false)}>Cancel</Btn>
                    <Btn
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        const payload: any = {};
                        if (editDueDate) payload.dueDate = editDueDate;
                        if (editAdjDesc || editAdjAmount) {
                          const amt = Number(editAdjAmount);
                          if (!editAdjDesc) { toast.error("Adjustment description is required"); return; }
                          if (!amt) { toast.error("Adjustment amount must be a non-zero number"); return; }
                          payload.adjustment = { description: editAdjDesc, amount: amt, reason: editAdjReason || undefined };
                        }
                        if (!payload.dueDate && !payload.adjustment) { toast.error("Nothing to save"); return; }
                        updateInvoiceMut.mutate(payload);
                      }}
                    >{updateInvoiceMut.isPending ? "Saving…" : "Save Changes"}</Btn>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex justify-end gap-2 pt-3">
              {viewInvoice.status !== "paid" && (
                <Btn
                  variant="secondary"
                  size="md"
                  onClick={() => { setEditDueDate(viewInvoice.dueDate ? new Date(viewInvoice.dueDate).toISOString().slice(0, 10) : ""); setEditingInvoice(true); }}
                ><Edit size={14} /> Edit</Btn>
              )}
              <Btn
                variant="secondary"
                size="md"
                onClick={async () => {
                  try {
                    // Preview first (FEE-06) - this used to trigger an
                    // immediate silent download; now it opens the same PDF in
                    // an in-app preview with explicit Print/Download actions.
                    const blob = await pdfApi.generateInvoicePdf({ invoiceId: viewInvoice._id });
                    setChallanPreview({ blob, filename: `challan-${viewInvoice.invoiceNumber}.pdf` });
                  } catch (err: any) {
                    toast.error(await extractBlobError(err));
                  }
                }}
              ><Download size={14} /> Preview Challan</Btn>
              <Btn
                variant="danger"
                size="md"
                onClick={() => {
                  if (invoicePayments.some((p: any) => !p.isRefunded)) {
                    toast.error("Revert every receipt collected against this invoice first, then delete.");
                    return;
                  }
                  const reason = window.prompt(
                    `Delete invoice ${viewInvoice.invoiceNumber}?\n\nThis cannot be undone from the UI. Any ledger postings this invoice made will be reversed automatically. Enter a reason to confirm:`,
                  );
                  if (reason === null) return; // cancelled
                  if (!reason.trim()) { toast.error("A reason is required to delete an invoice"); return; }
                  deleteInvoiceMut.mutate(reason);
                }}
              ><Trash2 size={14} /> Delete Invoice</Btn>
            </div>
          )}
          <ModalFooter onCancel={() => { setViewInvoice(null); setEditingInvoice(false); }} onSave={() => { setViewInvoice(null); setEditingInvoice(false); }} saveLabel="Close" />
        </Modal>
      )}

      {challanPreview && (
        <ChallanPreviewModal blob={challanPreview.blob} filename={challanPreview.filename} onClose={() => setChallanPreview(null)} />
      )}
    </div>
  );
}

// ─── TAB: ACCOUNTS PAYABLE ────────────────────────────────────────────────────
type InvForm = { id: string; vendor: string; campus: string; amount: string; due: string; category: string; description: string; paymentTerms: string; status: string };
const BLANK_INV: InvForm = { id: "", vendor: "", campus: "", amount: "", due: "", category: "", description: "", paymentTerms: "Net 30", status: "Pending" };

// Renamed from the original PayableTab (Phase 1) — now one of three
// nested sub-tabs under the "Payables" top-level tab, alongside the new
// Phase 2 Vendors / Vendor Bills sub-tabs. Kept exactly as-is so the
// existing simple Expense spend-log flow is not disturbed.
function SimpleExpensesSubTab() {
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

// ─── PHASE 2: VENDORS SUB-TAB (Vendor master) ──────────────────────────────────
type VendorForm = { name: string; contactPerson: string; phone: string; email: string; address: string; taxId: string; paymentTermId: string; withholdingCategoryId: string };
const BLANK_VENDOR: VendorForm = { name: "", contactPerson: "", phone: "", email: "", address: "", taxId: "", paymentTermId: "", withholdingCategoryId: "" };

function VendorsSubTab() {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<VendorForm>(BLANK_VENDOR);
  const [search, setSearch] = useState("");
  const qc = useQueryClient();

  const { data: vendors = [], isLoading } = useQuery({ queryKey: ["vendors"], queryFn: financeService.getVendors });
  const { data: paymentTerms = [] } = useQuery({ queryKey: ["payment-terms"], queryFn: () => financeService.getPaymentTerms() });
  // Phase 3 — vendor's withholding tax category, used at payment time.
  const { data: withholdingCategories = [] } = useQuery({ queryKey: ["withholding-categories"], queryFn: () => financeService.getWithholdingCategories() });

  const createMutation = useMutation({
    mutationFn: financeService.createVendor,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendors"] });
      toast.success("Vendor added");
      setShowModal(false);
      setForm(BLANK_VENDOR);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to add vendor"),
  });

  const list = (vendors as any[]).filter(v => (v.name || "").toLowerCase().includes(search.toLowerCase()));

  function save() {
    if (!form.name) { toast.error("Vendor name is required"); return; }
    createMutation.mutate({
      name: form.name, contactPerson: form.contactPerson, phone: form.phone,
      email: form.email, address: form.address, taxId: form.taxId,
      paymentTermId: form.paymentTermId || undefined,
      withholdingCategoryId: form.withholdingCategoryId || undefined,
    });
  }

  return (
    <Card>
      <CardHeader
        title="Vendors"
        sub="Supplier master — used by Vendor Bills for terms and default account coding"
        actions={
          <>
            <SearchBar placeholder="Search vendors…" value={search} onChange={setSearch} />
            <Btn variant="primary" onClick={() => { setForm(BLANK_VENDOR); setShowModal(true); }}><Plus size={12} /> Add Vendor</Btn>
          </>
        }
      />
      <TableWrap headers={["Name", "Contact", "Phone", "Email", "Payment Term", "Withholding", "Status"]}>
        {isLoading ? (
          <tr><td colSpan={7} className="px-4 py-12 text-center"><div className="w-6 h-6 border-4 border-[#0C447C] border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
        ) : list.length === 0 ? (
          <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-400">No vendors yet. Click + Add Vendor to create one.</td></tr>
        ) : list.map((v: any) => {
          const term = (paymentTerms as any[]).find(t => t._id === v.paymentTermId);
          const whCategory = (withholdingCategories as any[]).find(c => c._id === v.withholdingCategoryId);
          return (
            <tr key={v._id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-semibold text-slate-800">{v.name}</td>
              <td className="px-4 py-3 text-xs text-slate-500">{v.contactPerson || "—"}</td>
              <td className="px-4 py-3 text-xs text-slate-500">{v.phone || "—"}</td>
              <td className="px-4 py-3 text-xs text-slate-500">{v.email || "—"}</td>
              <td className="px-4 py-3 text-xs text-slate-500">{term?.name || "—"}</td>
              <td className="px-4 py-3 text-xs text-slate-500">{whCategory ? `${whCategory.name} (${whCategory.rate}%)` : "—"}</td>
              <td className="px-4 py-3"><Badge v={v.isActive === false ? "gray" : "green"}>{v.isActive === false ? "Inactive" : "Active"}</Badge></td>
            </tr>
          );
        })}
      </TableWrap>

      {showModal && (
        <Modal title="Add Vendor" onClose={() => setShowModal(false)}>
          <div className="grid grid-cols-2 gap-4">
            <FField label="Vendor Name" required>
              <FInput value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </FField>
            <FField label="Contact Person">
              <FInput value={form.contactPerson} onChange={e => setForm(f => ({ ...f, contactPerson: e.target.value }))} />
            </FField>
            <FField label="Phone">
              <FInput value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </FField>
            <FField label="Email">
              <FInput type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </FField>
            <FField label="Tax ID / NTN">
              <FInput value={form.taxId} onChange={e => setForm(f => ({ ...f, taxId: e.target.value }))} />
            </FField>
            <FField label="Payment Term">
              <FSelect value={form.paymentTermId} onChange={e => setForm(f => ({ ...f, paymentTermId: e.target.value }))}>
                <option value="">Select…</option>
                {(paymentTerms as any[]).map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
              </FSelect>
            </FField>
            <FField label="Withholding Tax Category">
              <FSelect value={form.withholdingCategoryId} onChange={e => setForm(f => ({ ...f, withholdingCategoryId: e.target.value }))}>
                <option value="">None</option>
                {(withholdingCategories as any[]).map(c => <option key={c._id} value={c._id}>{c.name} ({c.rate}%)</option>)}
              </FSelect>
            </FField>
            <div className="col-span-2">
              <FField label="Address">
                <FTextarea value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
              </FField>
            </div>
          </div>
          <ModalFooter onCancel={() => setShowModal(false)} onSave={save} saveLabel={createMutation.isPending ? "Saving…" : "Add Vendor"} />
        </Modal>
      )}
    </Card>
  );
}

// ─── PHASE 2: VENDOR BILLS SUB-TAB (Accounts Payable) ──────────────────────────
type BillLineForm = { description: string; accountCode: string; costCenterName: string; amount: string };
const BLANK_BILL_LINE: BillLineForm = { description: "", accountCode: "", costCenterName: "", amount: "" };

function VendorBillsSubTab() {
  const [showModal, setShowModal] = useState(false);
  const [payBill, setPayBill] = useState<any | null>(null);
  const [vendorId, setVendorId] = useState("");
  const [billDate, setBillDate] = useState(new Date().toISOString().slice(0, 10));
  const [referenceNumber, setReferenceNumber] = useState("");
  const [taxAmount, setTaxAmount] = useState("");
  // Phase 5 — optional foreign-currency picker. Left blank (the default),
  // this bill posts exactly as it always has, in the school's base
  // currency — no behavior change unless a currency is explicitly chosen.
  const [currencyCode, setCurrencyCode] = useState("");
  const [lines, setLines] = useState<BillLineForm[]>([{ ...BLANK_BILL_LINE }]);
  const [payForm, setPayForm] = useState({ amount: "", paymentDate: new Date().toISOString().slice(0, 10), paymentMethod: "cash", referenceNumber: "" });
  const qc = useQueryClient();

  const { data: billsRes, isLoading } = useQuery({ queryKey: ["vendor-bills"], queryFn: () => financeService.getVendorBills() });
  const { data: vendors = [] } = useQuery({ queryKey: ["vendors"], queryFn: financeService.getVendors });
  const { data: coa = [] } = useQuery({ queryKey: ["coa"], queryFn: () => financeService.getCOA() });
  const { data: currencies = [] } = useQuery({ queryKey: ["currencies"], queryFn: () => financeService.getCurrencies() });
  const bills = ((billsRes as any)?.data || []) as any[];
  const expenseAccounts = (coa as any[]).filter(a => (a.type === "expense" || a.type === "asset") && a.isActive !== false);
  const foreignCurrencies = (currencies as any[]).filter(c => !c.isBaseCurrency && c.isActive !== false);

  const createMutation = useMutation({
    mutationFn: financeService.createVendorBill,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendor-bills"] });
      qc.invalidateQueries({ queryKey: ["coa"] });
      toast.success("Vendor bill posted");
      setShowModal(false);
      setLines([{ ...BLANK_BILL_LINE }]); setVendorId(""); setReferenceNumber(""); setTaxAmount(""); setCurrencyCode("");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to create bill"),
  });
  const payMutation = useMutation({
    mutationFn: (vars: { id: string; payload: any }) => financeService.recordVendorPayment(vars.id, vars.payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendor-bills"] });
      qc.invalidateQueries({ queryKey: ["coa"] });
      toast.success("Payment recorded");
      setPayBill(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to record payment"),
  });

  function addLine() { setLines(ls => [...ls, { ...BLANK_BILL_LINE }]); }
  function removeLine(i: number) { setLines(ls => ls.filter((_, idx) => idx !== i)); }
  function updateLine(i: number, patch: Partial<BillLineForm>) {
    setLines(ls => ls.map((l, idx) => idx === i ? { ...l, ...patch } : l));
  }
  const linesSubtotal = lines.reduce((a, l) => a + (Number(l.amount) || 0), 0);
  const billTotal = linesSubtotal + (Number(taxAmount) || 0);

  function saveBill() {
    if (!vendorId) { toast.error("Select a vendor"); return; }
    const validLines = lines.filter(l => l.accountCode && Number(l.amount) > 0);
    if (validLines.length === 0) { toast.error("At least one line with an account and amount is required"); return; }
    createMutation.mutate({
      vendorId, billDate, referenceNumber,
      taxAmount: Number(taxAmount) || 0,
      // Left undefined when no foreign currency is picked — createVendorBill
      // treats that exactly as it always has (base-currency posting).
      currencyCode: currencyCode || undefined,
      lines: validLines.map(l => ({ description: l.description, accountCode: l.accountCode, costCenterName: l.costCenterName || undefined, amount: Number(l.amount) })),
    });
  }

  function openPay(bill: any) {
    setPayBill(bill);
    setPayForm({ amount: String(bill.balanceDue || 0), paymentDate: new Date().toISOString().slice(0, 10), paymentMethod: "cash", referenceNumber: "" });
  }
  function savePayment() {
    if (!payBill) return;
    const amount = Number(payForm.amount);
    if (!amount || amount <= 0) { toast.error("Amount must be greater than 0"); return; }
    payMutation.mutate({ id: payBill._id, payload: { ...payForm, amount } });
  }

  const fmt = (n: number) => (n || 0).toLocaleString();
  const isOverdue = (bill: any) => bill.status !== "paid" && bill.status !== "cancelled" && new Date(bill.dueDate) < new Date();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title="Vendor Bills"
          sub="Formal accounts-payable bills with terms, multi-line account coding, and partial payment"
          actions={<Btn variant="primary" onClick={() => setShowModal(true)}><Plus size={12} /> New Bill</Btn>}
        />
        <TableWrap headers={["Bill #", "Vendor", "Bill Date", "Due Date", "Total", "Paid", "Balance", "Status", "Actions"]}>
          {isLoading ? (
            <tr><td colSpan={9} className="px-4 py-12 text-center"><div className="w-6 h-6 border-4 border-[#0C447C] border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
          ) : bills.length === 0 ? (
            <tr><td colSpan={9} className="px-4 py-12 text-center text-sm text-slate-400">No vendor bills yet. Click + New Bill to create one.</td></tr>
          ) : bills.map((bill: any) => (
            <tr key={bill._id} className={`hover:bg-slate-50 ${isOverdue(bill) ? "bg-red-50/50" : ""}`}>
              <td className="px-4 py-3 font-mono text-xs text-[#0C447C] font-bold">{bill.billNo}</td>
              <td className="px-4 py-3 text-sm font-medium text-slate-800">{bill.vendorName}</td>
              <td className="px-4 py-3 text-xs text-slate-500">{new Date(bill.billDate).toLocaleDateString()}</td>
              <td className={`px-4 py-3 text-xs ${isOverdue(bill) ? "text-red-600 font-semibold" : "text-slate-500"}`}>{new Date(bill.dueDate).toLocaleDateString()}</td>
              <td className="px-4 py-3 font-mono font-bold text-slate-800">{bill.currencyCode ? `${bill.currencyCode} ` : ""}{fmt(bill.totalAmount)}</td>
              <td className="px-4 py-3 font-mono text-slate-600">{fmt(bill.paidAmount)}</td>
              <td className="px-4 py-3 font-mono font-semibold text-slate-800">{fmt(bill.balanceDue)}</td>
              <td className="px-4 py-3"><Badge v={bill.status === "paid" ? "green" : bill.status === "partial" ? "amber" : bill.status === "cancelled" ? "gray" : isOverdue(bill) ? "red" : "blue"}>{isOverdue(bill) && bill.status !== "paid" ? "overdue" : bill.status}</Badge></td>
              <td className="px-4 py-3">
                {bill.status !== "paid" && bill.status !== "cancelled" && (
                  <button onClick={() => openPay(bill)} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Record Payment"><Wallet size={13} /></button>
                )}
              </td>
            </tr>
          ))}
        </TableWrap>
      </Card>

      {showModal && (
        <Modal title="New Vendor Bill" size="lg" onClose={() => setShowModal(false)}>
          <div className="grid grid-cols-2 gap-4">
            <FField label="Vendor" required>
              <FSelect value={vendorId} onChange={e => setVendorId(e.target.value)}>
                <option value="">Select vendor…</option>
                {(vendors as any[]).map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
              </FSelect>
            </FField>
            <FField label="Bill Date">
              <FInput type="date" value={billDate} onChange={e => setBillDate(e.target.value)} />
            </FField>
            <FField label="Vendor's Reference #">
              <FInput value={referenceNumber} onChange={e => setReferenceNumber(e.target.value)} placeholder="Vendor's own invoice number" />
            </FField>
            <FField label="Tax Amount (₨)">
              <FInput type="number" value={taxAmount} onChange={e => setTaxAmount(e.target.value)} placeholder="0" />
            </FField>
            <FField label="Currency (optional)">
              <FSelect value={currencyCode} onChange={e => setCurrencyCode(e.target.value)}>
                <option value="">Base currency (default)</option>
                {foreignCurrencies.map((c: any) => <option key={c.code} value={c.code}>{c.code} — {c.name}</option>)}
              </FSelect>
            </FField>
          </div>
          <p className="mt-1 text-xs text-slate-400">Leave blank to auto-apply purchase tax from Ledger → Taxes (Tax Rules / Item Tax Templates matched against each line's account). Entering a manual amount here overrides auto-resolution.</p>
          <p className="mt-1 text-xs text-slate-400">Currency defaults to your base currency — pick a foreign currency (configured under Ledger → Accounting Setup) only if this bill is actually denominated in it; the lines/amounts below stay in that currency and convert to your ledger's base currency automatically using the rate on the bill date.</p>

          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-500 uppercase">Bill Lines</p>
              <Btn onClick={addLine}><Plus size={12} /> Add Line</Btn>
            </div>
            {lines.map((line, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-4"><FInput placeholder="Description" value={line.description} onChange={e => updateLine(i, { description: e.target.value })} /></div>
                <div className="col-span-4">
                  <FSelect value={line.accountCode} onChange={e => updateLine(i, { accountCode: e.target.value })}>
                    <option value="">Account…</option>
                    {expenseAccounts.map((a: any) => <option key={a.code} value={a.code}>{a.code} — {a.name}</option>)}
                  </FSelect>
                </div>
                <div className="col-span-2"><FInput type="number" placeholder="Amount" value={line.amount} onChange={e => updateLine(i, { amount: e.target.value })} /></div>
                <div className="col-span-1">
                  {lines.length > 1 && (
                    <button onClick={() => removeLine(i)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={13} /></button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-end gap-6 text-sm border-t border-slate-100 pt-3">
            <span className="text-slate-500">Subtotal: <span className="font-semibold text-slate-800">₨ {fmt(linesSubtotal)}</span></span>
            <span className="text-slate-500">Tax: <span className="font-semibold text-slate-800">₨ {fmt(Number(taxAmount) || 0)}</span></span>
            <span className="text-slate-500">Total: <span className="font-bold text-[#0C447C]">₨ {fmt(billTotal)}</span></span>
          </div>

          <ModalFooter onCancel={() => setShowModal(false)} onSave={saveBill} saveLabel={createMutation.isPending ? "Posting…" : "Post Bill"} />
        </Modal>
      )}

      {payBill && (
        <Modal title={`Record Payment — ${payBill.billNo}`} onClose={() => setPayBill(null)}>
          <div className="grid grid-cols-2 gap-4">
            <FField label="Amount (₨)" required>
              <FInput type="number" value={payForm.amount} onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))} />
            </FField>
            <FField label="Payment Date">
              <FInput type="date" value={payForm.paymentDate} onChange={e => setPayForm(f => ({ ...f, paymentDate: e.target.value }))} />
            </FField>
            <FField label="Payment Method">
              <FSelect value={payForm.paymentMethod} onChange={e => setPayForm(f => ({ ...f, paymentMethod: e.target.value }))}>
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cheque">Cheque</option>
                <option value="online">Online</option>
                <option value="card">Card</option>
                <option value="mobile_wallet">Mobile Wallet</option>
              </FSelect>
            </FField>
            <FField label="Reference #">
              <FInput value={payForm.referenceNumber} onChange={e => setPayForm(f => ({ ...f, referenceNumber: e.target.value }))} />
            </FField>
          </div>
          <div className="mt-2 text-xs text-slate-400">Balance due: ₨ {fmt(payBill.balanceDue)}</div>
          <ModalFooter onCancel={() => setPayBill(null)} onSave={savePayment} saveLabel={payMutation.isPending ? "Saving…" : "Record Payment"} />
        </Modal>
      )}
    </div>
  );
}

// ─── TAB: FEE DEFAULTERS ──────────────────────────────────────────────────────
// Real engine, not a mock: aging report + severity scale come from
// /finance/defaulters/aging, backed by DefaulterPolicy's configurable
// thresholds. Reminders actually attempt to send (email really goes out
// via SES; SMS/WhatsApp honestly report "not sent" until a gateway is
// connected) and every attempt is logged server-side.
const SEVERITY_LABEL: Record<string, string> = {
  minor_concern: "Minor Concern", concern: "Concern", major_concern: "Major Concern",
};
const SEVERITY_VARIANT: Record<string, BV> = {
  minor_concern: "amber", concern: "red", major_concern: "red",
};
const BUCKET_LABEL: Record<string, string> = {
  current: "Current", "1-30": "1–30 Days", "31-60": "31–60 Days", "61-90": "61–90 Days", "90+": "90+ Days",
};

function DefaultersTab() {
  const qc = useQueryClient();
  const [severityFilter, setSeverityFilter] = useState("");
  const [bucketFilter, setBucketFilter] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showPolicy, setShowPolicy] = useState(false);
  const [showCommitments, setShowCommitments] = useState(false);
  const [commitmentFor, setCommitmentFor] = useState<any | null>(null);

  const { data: aging, isLoading: agingLoading } = useQuery({
    queryKey: ["defaulter-aging"], queryFn: financeService.getDefaulterAging,
  });
  const { data: defaultersResp, isLoading: listLoading } = useQuery({
    queryKey: ["defaulters", severityFilter, bucketFilter],
    queryFn: () => financeService.getDefaulters({ severity: severityFilter || undefined, bucket: bucketFilter || undefined, limit: 100 }),
  });
  const defaulters: any[] = defaultersResp?.data ?? [];

  const remindMut = useMutation({
    mutationFn: ({ id, channel }: { id: string; channel: "email" | "sms" | "whatsapp" }) => financeService.sendDefaulterReminder(id, channel),
    onSuccess: (res: any) => {
      if (res.status === "sent") toast.success(`Reminder sent via ${res.channel}`);
      else toast(`${res.channel} reminder not sent: ${res.reason || "unknown reason"}`, { icon: "⚠️" });
      qc.invalidateQueries({ queryKey: ["defaulters"] });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Failed to send reminder"),
  });

  const bulkRemindMut = useMutation({
    mutationFn: ({ ids, channel }: { ids: string[]; channel: "email" | "sms" | "whatsapp" }) => financeService.sendBulkDefaulterReminders(ids, channel),
    onSuccess: (res: any) => {
      const sent = res.results.filter((r: any) => r.status === "sent").length;
      toast.success(`${sent} of ${res.attempted} reminders sent`);
      setSelected(new Set());
      qc.invalidateQueries({ queryKey: ["defaulters"] });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Failed to send bulk reminders"),
  });

  const penaltyMut = useMutation({
    mutationFn: (id: string) => financeService.applyDefaulterPenalty(id),
    onSuccess: () => { toast.success("Penalty applied"); qc.invalidateQueries({ queryKey: ["defaulters"] }); qc.invalidateQueries({ queryKey: ["defaulter-aging"] }); },
    onError: (e: any) => toast.error(e.response?.data?.message || "Failed to apply penalty"),
  });

  const bulkPenaltyMut = useMutation({
    mutationFn: (ids: string[]) => financeService.applyBulkDefaulterPenalty(ids),
    onSuccess: (res: any) => {
      const applied = res.results.filter((r: any) => r.applied).length;
      toast.success(`Penalty applied to ${applied} of ${res.attempted} invoices`);
      setSelected(new Set());
      qc.invalidateQueries({ queryKey: ["defaulters"] });
      qc.invalidateQueries({ queryKey: ["defaulter-aging"] });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Failed to apply bulk penalty"),
  });

  const fmt = (n: number) => n >= 1_000_000 ? `₨ ${(n / 1_000_000).toFixed(2)}M` : `₨ ${(n || 0).toLocaleString()}`;

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KPI icon={Wallet} label="Total Outstanding" value={agingLoading ? "…" : fmt(aging?.totalOutstanding || 0)} color="#0C447C" />
        {(["current", "1-30", "31-60", "61-90", "90+"] as const).map((b) => (
          <KPI
            key={b}
            icon={b === "current" ? CheckCircle : AlertTriangle}
            label={BUCKET_LABEL[b]}
            value={agingLoading ? "…" : fmt(aging?.buckets?.[b]?.total || 0)}
            sub={agingLoading ? "" : `${aging?.buckets?.[b]?.count || 0} invoice${aging?.buckets?.[b]?.count === 1 ? "" : "s"}`}
            color={b === "current" ? "#10b981" : b === "90+" ? "#ef4444" : "#EF9F27"}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {(["minor_concern", "concern", "major_concern"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSeverityFilter(severityFilter === s ? "" : s)}
            className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-colors ${severityFilter === s ? "border-[#0C447C] bg-blue-50" : "border-slate-200 bg-white hover:bg-slate-50"}`}
          >
            <span className="text-sm font-semibold text-slate-700">{SEVERITY_LABEL[s]}</span>
            <Badge v={SEVERITY_VARIANT[s]}>{agingLoading ? "…" : aging?.severityCounts?.[s] ?? 0}</Badge>
          </button>
        ))}
      </div>

      <Card>
        <CardHeader
          title="Fee Defaulters"
          sub="Overdue invoices with outstanding balance"
          actions={
            <>
              <FSelect value={bucketFilter} onChange={(e) => setBucketFilter(e.target.value)}>
                <option value="">All Aging Buckets</option>
                {Object.entries(BUCKET_LABEL).filter(([k]) => k !== "current").map(([k, label]) => <option key={k} value={k}>{label}</option>)}
              </FSelect>
              <Btn variant="secondary" onClick={() => setShowCommitments(true)}><Handshake size={12} /> Commitments</Btn>
              <Btn variant="secondary" onClick={() => setShowPolicy(true)}><Gauge size={12} /> Policy</Btn>
              {selected.size > 0 && (
                <>
                  <Btn variant="secondary" onClick={() => bulkRemindMut.mutate({ ids: Array.from(selected), channel: "email" })}>
                    <Send size={12} /> Remind {selected.size} (Email)
                  </Btn>
                  <Btn variant="secondary" onClick={() => bulkPenaltyMut.mutate(Array.from(selected))}>
                    <AlertTriangle size={12} /> Apply Penalty ({selected.size})
                  </Btn>
                </>
              )}
            </>
          }
        />
        <TableWrap headers={["", "Invoice #", "Student", "Grade", "Balance Due", "Due Date", "Days Overdue", "Severity", "Actions"]}>
          {listLoading ? (
            <tr><td colSpan={9} className="px-4 py-12 text-center"><div className="w-6 h-6 border-4 border-[#0C447C] border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
          ) : defaulters.length === 0 ? (
            <tr><td colSpan={9} className="px-4 py-12 text-center text-sm text-slate-400">No defaulters match this filter — everyone's either paid up or not yet overdue.</td></tr>
          ) : defaulters.map((inv) => (
            <tr key={inv._id} className="border-b border-slate-50 hover:bg-slate-50/60">
              <td className="px-4 py-3">
                <input type="checkbox" checked={selected.has(inv._id)} onChange={() => toggleSelect(inv._id)} className="rounded border-slate-300" />
              </td>
              <td className="px-4 py-3 text-sm font-medium text-slate-700">{inv.invoiceNumber}</td>
              <td className="px-4 py-3 text-sm text-slate-700">{inv.studentName}</td>
              <td className="px-4 py-3 text-sm text-slate-600">{inv.grade}</td>
              <td className="px-4 py-3 text-sm font-semibold text-slate-800">{fmt(inv.balanceDue)}</td>
              <td className="px-4 py-3 text-sm text-slate-600">{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "—"}</td>
              <td className="px-4 py-3 text-sm text-red-600 font-medium">{inv.daysOverdue}</td>
              <td className="px-4 py-3">{inv.severity ? <Badge v={SEVERITY_VARIANT[inv.severity]}>{SEVERITY_LABEL[inv.severity]}</Badge> : <Badge v="gray">—</Badge>}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <button title="Send email reminder" onClick={() => remindMut.mutate({ id: inv._id, channel: "email" })} className="p-1.5 hover:bg-blue-50 rounded text-[#0C447C]"><Send size={13} /></button>
                  <button title="Apply penalty" onClick={() => penaltyMut.mutate(inv._id)} className="p-1.5 hover:bg-red-50 rounded text-red-500"><AlertTriangle size={13} /></button>
                  <button title="Create payment commitment" onClick={() => setCommitmentFor(inv)} className="p-1.5 hover:bg-emerald-50 rounded text-emerald-600"><Handshake size={13} /></button>
                </div>
              </td>
            </tr>
          ))}
        </TableWrap>
      </Card>

      {showPolicy && <DefaulterPolicyModal onClose={() => setShowPolicy(false)} />}
      {showCommitments && <CommitmentsModal onClose={() => setShowCommitments(false)} />}
      {commitmentFor && <CreateCommitmentModal invoice={commitmentFor} onClose={() => setCommitmentFor(null)} />}
    </div>
  );
}

function DefaulterPolicyModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const { data: policy, isLoading } = useQuery({ queryKey: ["defaulter-policy"], queryFn: financeService.getDefaulterPolicy });
  const [form, setForm] = useState<any | null>(null);
  useEffect(() => { if (policy && !form) setForm(policy); }, [policy, form]);

  const saveMut = useMutation({
    mutationFn: (payload: any) => financeService.updateDefaulterPolicy(payload),
    onSuccess: () => { toast.success("Defaulter policy updated"); qc.invalidateQueries({ queryKey: ["defaulter-policy"] }); onClose(); },
    onError: (e: any) => toast.error(e.response?.data?.message || "Failed to save policy"),
  });

  if (isLoading || !form) return (
    <Modal title="Defaulter Policy" onClose={onClose}><div className="py-8 text-center text-sm text-slate-400">Loading…</div></Modal>
  );

  return (
    <Modal title="Defaulter Policy" size="lg" onClose={onClose}>
      <p className="text-xs text-slate-500 -mt-2">Configurable per school — these thresholds drive the aging buckets, severity scale, reminder cadence, and penalty rule used everywhere in this tab.</p>
      <div className="grid grid-cols-3 gap-3">
        <FField label="Bucket 1 ends (days)"><FInput type="number" value={form.agingBucket1Days} onChange={(e) => setForm({ ...form, agingBucket1Days: Number(e.target.value) })} /></FField>
        <FField label="Bucket 2 ends (days)"><FInput type="number" value={form.agingBucket2Days} onChange={(e) => setForm({ ...form, agingBucket2Days: Number(e.target.value) })} /></FField>
        <FField label="Bucket 3 ends (days)"><FInput type="number" value={form.agingBucket3Days} onChange={(e) => setForm({ ...form, agingBucket3Days: Number(e.target.value) })} /></FField>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <FField label="Minor Concern from (days)"><FInput type="number" value={form.minorConcernDays} onChange={(e) => setForm({ ...form, minorConcernDays: Number(e.target.value) })} /></FField>
        <FField label="Concern from (days)"><FInput type="number" value={form.concernDays} onChange={(e) => setForm({ ...form, concernDays: Number(e.target.value) })} /></FField>
        <FField label="Major Concern from (days)"><FInput type="number" value={form.majorConcernDays} onChange={(e) => setForm({ ...form, majorConcernDays: Number(e.target.value) })} /></FField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FField label="Don't re-remind within (days)"><FInput type="number" value={form.reminderThrottleDays} onChange={(e) => setForm({ ...form, reminderThrottleDays: Number(e.target.value) })} /></FField>
        <FField label="Automated daily reminders">
          <FSelect value={form.automatedRemindersEnabled ? "on" : "off"} onChange={(e) => setForm({ ...form, automatedRemindersEnabled: e.target.value === "on" })}>
            <option value="on">Enabled</option>
            <option value="off">Disabled</option>
          </FSelect>
        </FField>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <FField label="Penalty type">
          <FSelect value={form.penaltyType} onChange={(e) => setForm({ ...form, penaltyType: e.target.value })}>
            <option value="flat">Flat amount (PKR)</option>
            <option value="percentage">% of balance due</option>
          </FSelect>
        </FField>
        <FField label={form.penaltyType === "percentage" ? "Penalty (%)" : "Penalty (PKR)"}>
          <FInput type="number" value={form.penaltyAmount} onChange={(e) => setForm({ ...form, penaltyAmount: Number(e.target.value) })} />
        </FField>
        <FField label="Grace period (days)"><FInput type="number" value={form.penaltyGraceDays} onChange={(e) => setForm({ ...form, penaltyGraceDays: Number(e.target.value) })} /></FField>
      </div>
      <p className="text-xs text-slate-400">Email reminders send for real through the school's configured email service. SMS and WhatsApp will report "not sent" until a gateway account is connected — nothing pretends to succeed here.</p>
      <ModalFooter onCancel={onClose} onSave={() => saveMut.mutate(form)} saveLabel="Save Policy" saving={saveMut.isPending} />
    </Modal>
  );
}

function CommitmentsModal({ onClose }: { onClose: () => void }) {
  const { data: resp, isLoading } = useQuery({ queryKey: ["commitments"], queryFn: () => financeService.getCommitments({ limit: 50 }) });
  const qc = useQueryClient();
  const commitments: any[] = resp?.data ?? [];

  const payMut = useMutation({
    mutationFn: ({ id, num, amount }: { id: string; num: number; amount: number }) => financeService.payCommitmentInstallment(id, num, amount),
    onSuccess: () => { toast.success("Installment marked paid"); qc.invalidateQueries({ queryKey: ["commitments"] }); },
    onError: (e: any) => toast.error(e.response?.data?.message || "Failed"),
  });
  const missMut = useMutation({
    mutationFn: ({ id, num }: { id: string; num: number }) => financeService.missCommitmentInstallment(id, num),
    onSuccess: () => { toast.success("Installment marked missed"); qc.invalidateQueries({ queryKey: ["commitments"] }); },
    onError: (e: any) => toast.error(e.response?.data?.message || "Failed"),
  });

  return (
    <Modal title="Payment Commitments" size="lg" onClose={onClose}>
      {isLoading ? (
        <div className="py-8 text-center text-sm text-slate-400">Loading…</div>
      ) : commitments.length === 0 ? (
        <div className="py-8 text-center text-sm text-slate-400">No commitment plans yet. Create one from a defaulter's row action.</div>
      ) : (
        <div className="space-y-4">
          {commitments.map((c) => (
            <div key={c._id} className="border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{c.studentName} — {c.commitmentNumber}</p>
                  <p className="text-xs text-slate-500">Total: ₨ {c.totalAmount.toLocaleString()}</p>
                </div>
                <Badge v={c.status === "active" ? "blue" : c.status === "completed" ? "green" : "red"}>{c.status}</Badge>
              </div>
              <div className="space-y-1.5">
                {c.installments.map((ins: any) => (
                  <div key={ins.installmentNumber} className="flex items-center justify-between text-xs px-2 py-1.5 bg-slate-50 rounded-lg">
                    <span>#{ins.installmentNumber} — ₨ {ins.amount.toLocaleString()} due {new Date(ins.dueDate).toLocaleDateString()}</span>
                    <div className="flex items-center gap-2">
                      <Badge v={ins.status === "paid" ? "green" : ins.status === "missed" ? "red" : "gray"}>{ins.status}</Badge>
                      {ins.status === "pending" && c.status === "active" && (
                        <>
                          <button onClick={() => payMut.mutate({ id: c._id, num: ins.installmentNumber, amount: ins.amount })} className="text-emerald-600 hover:underline">Mark Paid</button>
                          <button onClick={() => missMut.mutate({ id: c._id, num: ins.installmentNumber })} className="text-red-500 hover:underline">Mark Missed</button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

function CreateCommitmentModal({ invoice, onClose }: { invoice: any; onClose: () => void }) {
  const qc = useQueryClient();
  const [installmentCount, setInstallmentCount] = useState(3);
  const [firstDueDate, setFirstDueDate] = useState("");

  const createMut = useMutation({
    mutationFn: (payload: any) => financeService.createCommitment(payload),
    onSuccess: () => { toast.success("Payment commitment created"); qc.invalidateQueries({ queryKey: ["commitments"] }); onClose(); },
    onError: (e: any) => toast.error(e.response?.data?.message || "Failed to create commitment"),
  });

  function handleCreate() {
    if (!firstDueDate) { toast.error("Pick a first installment due date"); return; }
    const perInstallment = Math.ceil(invoice.balanceDue / installmentCount);
    const installments = Array.from({ length: installmentCount }, (_, i) => {
      const d = new Date(firstDueDate);
      d.setMonth(d.getMonth() + i);
      return { amount: i === installmentCount - 1 ? invoice.balanceDue - perInstallment * (installmentCount - 1) : perInstallment, dueDate: d.toISOString() };
    });
    createMut.mutate({ studentId: invoice.studentId, invoiceIds: [invoice._id], installments, notes: `Commitment plan for overdue invoice ${invoice.invoiceNumber}` });
  }

  return (
    <Modal title={`Payment Commitment — ${invoice.studentName}`} onClose={onClose}>
      <p className="text-xs text-slate-500">Outstanding balance: <strong>₨ {invoice.balanceDue.toLocaleString()}</strong> on invoice {invoice.invoiceNumber}. Split it into equal monthly installments as a promise-to-pay plan for a chronic defaulter.</p>
      <FField label="Number of installments" required>
        <FInput type="number" min={1} max={12} value={installmentCount} onChange={(e) => setInstallmentCount(Math.max(1, Number(e.target.value)))} />
      </FField>
      <FField label="First installment due date" required>
        <FInput type="date" value={firstDueDate} onChange={(e) => setFirstDueDate(e.target.value)} />
      </FField>
      <ModalFooter onCancel={onClose} onSave={handleCreate} saveLabel="Create Commitment" saving={createMut.isPending} />
    </Modal>
  );
}

// ─── TAB: PAYABLES (nested sub-tabs: Expenses / Vendors / Vendor Bills) ────────
type PayableSubTab = "expenses" | "vendors" | "bills";
const PAYABLE_SUBTABS: { id: PayableSubTab; label: string }[] = [
  { id: "expenses", label: "Simple Expenses" },
  { id: "vendors",  label: "Vendors" },
  { id: "bills",    label: "Vendor Bills" },
];

function PayableTab() {
  const [sub, setSub] = useState<PayableSubTab>("expenses");
  return (

    <div className="space-y-4">
      <div className="flex gap-1 border-b border-slate-200">
        {PAYABLE_SUBTABS.map(t => (
          <button key={t.id} onClick={() => setSub(t.id)}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${sub === t.id ? "border-[#0C447C] text-[#0C447C]" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
            {t.label}
          </button>
        ))}
      </div>
      {sub === "expenses" && <SimpleExpensesSubTab />}
      {sub === "vendors" && <VendorsSubTab />}
      {sub === "bills" && <VendorBillsSubTab />}
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

// ─── TAB: BANK RECONCILIATION (Phase 6) ────────────────────────────────────────
// Self-contained: reads/writes only via financeService's new statement-line /
// reconciliation-summary endpoints, so it has no shared state with BankingTab
// or LedgerTab above and doesn't need to touch either of them.

// Parses a pasted CSV/TSV block into the plain-object shape the import
// endpoint expects. Expected columns (header row optional, case-insensitive):
// date, description, reference, amount, balance. Tolerant of a leading
// header row (skipped if the first cell doesn't parse as a date) and of
// comma OR tab-separated input (spreadsheet paste is usually tab-separated).
function parseStatementCsv(raw: string): { statementDate: string; description: string; referenceNumber: string; amount: number; runningBalance?: number }[] {
  const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const rows: { statementDate: string; description: string; referenceNumber: string; amount: number; runningBalance?: number }[] = [];
  for (const line of lines) {
    const cells = (line.includes("\t") ? line.split("\t") : line.split(",")).map(c => c.trim().replace(/^"|"$/g, ""));
    if (cells.length < 3) continue;
    const [dateCell, descCell, refCell, amountCell, balanceCell] = cells;
    const parsedDate = new Date(dateCell);
    if (isNaN(parsedDate.getTime())) continue; // skips a header row like "Date,Description,..."
    const amount = Number((amountCell || "0").replace(/[^0-9.\-]/g, ""));
    if (isNaN(amount)) continue;
    rows.push({
      statementDate: parsedDate.toISOString(),
      description: descCell || "",
      referenceNumber: refCell || "",
      amount,
      runningBalance: balanceCell ? Number(balanceCell.replace(/[^0-9.\-]/g, "")) : undefined,
    });
  }
  return rows;
}

function ImportStatementModal({ bankAccountId, onClose, onImported }: { bankAccountId: string; onClose: () => void; onImported: () => void }) {
  const [csvText, setCsvText] = useState("");
  const preview = parseStatementCsv(csvText);

  const importMutation = useMutation({
    mutationFn: (lines: ReturnType<typeof parseStatementCsv>) => financeService.importBankStatementLines(bankAccountId, lines),
    onSuccess: (result: any) => {
      toast.success(`Imported ${result.count} statement line(s)`);
      onImported();
      onClose();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Import failed"),
  });

  return (
    <Modal title="Import Bank Statement" size="lg" onClose={onClose}>
      <p className="text-xs text-slate-500">
        Paste statement rows below — one per line, columns separated by commas or tabs (a direct copy-paste
        from a spreadsheet works): <span className="font-mono">Date, Description, Reference, Amount, Balance (optional)</span>.
        Amount should be positive for deposits/credits and negative for withdrawals/debits. A header row is
        detected and skipped automatically.
      </p>
      <FTextarea
        rows={8}
        placeholder={"2026-08-01, Fee deposit batch, REF1001, 45000\n2026-08-02, Bank service charge, , -150"}
        value={csvText}
        onChange={e => setCsvText(e.target.value)}
      />
      <div className="text-xs text-slate-500">
        {csvText.trim() ? `${preview.length} line(s) recognized` : "Nothing pasted yet"}
      </div>
      <ModalFooter
        onCancel={onClose}
        onSave={() => { if (preview.length) importMutation.mutate(preview); else toast.error("No valid rows recognized"); }}
        saveLabel={importMutation.isPending ? "Importing…" : `Import ${preview.length || ""}`.trim()}
      />
    </Modal>
  );
}

function BankReconciliationTab() {
  const queryClient = useQueryClient();
  const [bankAccountId, setBankAccountId] = useState<string>("");
  const [showImport, setShowImport] = useState(false);
  const [selectedStatementLine, setSelectedStatementLine] = useState<string | null>(null);
  const [selectedLedgerKeys, setSelectedLedgerKeys] = useState<Set<string>>(new Set());

  const { data: accounts = [] } = useQuery({ queryKey: ["bank-accounts"], queryFn: financeService.getBankAccounts });
  useEffect(() => {
    if (!bankAccountId && (accounts as any[]).length > 0) setBankAccountId((accounts as any[])[0]._id);
  }, [accounts, bankAccountId]);

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["reconciliation-summary", bankAccountId],
    queryFn: () => financeService.getReconciliationSummary(bankAccountId),
    enabled: !!bankAccountId,
  });
  const { data: statementLines = [], isLoading: statementLoading } = useQuery({
    queryKey: ["bank-statement-lines", bankAccountId],
    queryFn: () => financeService.getBankStatementLines(bankAccountId),
    enabled: !!bankAccountId,
  });
  const { data: ledgerLines = [], isLoading: ledgerLoading } = useQuery({
    queryKey: ["unmatched-ledger-lines", bankAccountId],
    queryFn: () => financeService.getUnmatchedLedgerLines(bankAccountId),
    enabled: !!bankAccountId,
  });

  function refreshAll() {
    queryClient.invalidateQueries({ queryKey: ["reconciliation-summary", bankAccountId] });
    queryClient.invalidateQueries({ queryKey: ["bank-statement-lines", bankAccountId] });
    queryClient.invalidateQueries({ queryKey: ["unmatched-ledger-lines", bankAccountId] });
  }

  const matchMutation = useMutation({
    mutationFn: (vars: { statementLineId: string; matches: { journalEntryId: string; lineIndex: number }[] }) =>
      financeService.matchStatementLine(vars.statementLineId, vars.matches),
    onSuccess: (result: any) => {
      if (result?.amountMismatchWarning) toast.error(result.amountMismatchWarning, { duration: 6000 });
      else toast.success("Matched");
      setSelectedStatementLine(null);
      setSelectedLedgerKeys(new Set());
      refreshAll();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Match failed"),
  });
  const unmatchMutation = useMutation({
    mutationFn: (id: string) => financeService.unmatchStatementLine(id),
    onSuccess: () => { toast.success("Unmatched"); refreshAll(); },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed"),
  });
  const ignoreMutation = useMutation({
    mutationFn: (id: string) => financeService.ignoreStatementLine(id),
    onSuccess: () => { toast.success("Ignored"); setSelectedStatementLine(null); refreshAll(); },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed"),
  });

  const unmatched = (statementLines as any[]).filter(l => l.status === "unmatched");
  const matched = (statementLines as any[]).filter(l => l.status === "matched");
  const ignored = (statementLines as any[]).filter(l => l.status === "ignored");

  function ledgerKey(l: any) { return `${l.entryId}:${l.lineIndex}`; }
  function toggleLedgerLine(l: any) {
    setSelectedLedgerKeys(prev => {
      const next = new Set(prev);
      const key = ledgerKey(l);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }
  function doMatch() {
    if (!selectedStatementLine) { toast.error("Select a statement line first"); return; }
    if (selectedLedgerKeys.size === 0) { toast.error("Select at least one ledger line to match against"); return; }
    const matches = Array.from(selectedLedgerKeys).map(k => {
      const [journalEntryId, lineIndex] = k.split(":");
      return { journalEntryId, lineIndex: Number(lineIndex) };
    });
    matchMutation.mutate({ statementLineId: selectedStatementLine, matches });
  }

  const selectedAccount = (accounts as any[]).find(a => a._id === bankAccountId);
  const s = (summary || {}) as any;

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title="Bank Reconciliation"
          sub="Match imported bank statement lines against posted Cash/Bank journal lines"
          actions={
            <>
              <FSelect value={bankAccountId} onChange={e => { setBankAccountId(e.target.value); setSelectedStatementLine(null); setSelectedLedgerKeys(new Set()); }}>
                {(accounts as any[]).length === 0 && <option value="">No bank accounts</option>}
                {(accounts as any[]).map((a: any) => (
                  <option key={a._id} value={a._id}>{a.bankName} — {a.accountTitle}</option>
                ))}
              </FSelect>
              <Btn variant="primary" onClick={() => bankAccountId ? setShowImport(true) : toast.error("Select a bank account first")}>
                <Download size={12} className="rotate-180" /> Import Statement
              </Btn>
            </>
          }
        />
        {!bankAccountId ? (
          <div className="p-10 text-center text-sm text-slate-400">Add a bank account under the Banking tab first.</div>
        ) : summaryLoading ? (
          <div className="p-10 text-center text-slate-400 text-sm animate-pulse">Loading…</div>
        ) : (
          <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPI icon={Landmark} label="Statement Balance" value={`₨ ${money(s.statementBalance || 0)}`} color={VIZ_SERIES[0]} />
            <KPI icon={BookText} label="Book Balance" value={`₨ ${money(s.bookBalance || 0)}`} color={VIZ_SERIES[1]} />
            <KPI icon={s.isBalanced ? CheckCircle : AlertTriangle} label="Difference" value={`₨ ${money(s.difference || 0)}`} color={s.isBalanced ? "#10b981" : "#ef4444"} />
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex flex-col items-start justify-center">
              <div className="text-xs text-slate-500 mb-1">Status</div>
              {s.isBalanced ? <Badge v="green">Balanced</Badge> : (
                <Badge v="amber">{(s.unmatchedStatementCount || 0) + (s.unmatchedLedgerCount || 0)} unmatched line(s)</Badge>
              )}
            </div>
          </div>
        )}
      </Card>

      {bankAccountId && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card>
            <CardHeader title="Unmatched Statement Lines" sub={`${unmatched.length} line(s) awaiting a match`} />
            {statementLoading ? (
              <div className="p-8 text-center text-slate-400 text-sm animate-pulse">Loading…</div>
            ) : unmatched.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400">No unmatched statement lines — import a statement to begin.</div>
            ) : (
              <div className="divide-y divide-slate-50 max-h-[420px] overflow-y-auto">
                {unmatched.map((l: any) => (
                  <label key={l._id} className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 ${selectedStatementLine === l._id ? "bg-blue-50" : ""}`}>
                    <input type="radio" name="stmt-line" checked={selectedStatementLine === l._id}
                      onChange={() => setSelectedStatementLine(l._id)} />
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-slate-700">{l.description || "—"}</span>
                        <span className={`text-sm font-mono font-semibold ${l.amount < 0 ? "text-red-600" : "text-emerald-600"}`}>{money(l.amount)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-400 mt-0.5">
                        <span>{new Date(l.statementDate).toLocaleDateString()} {l.referenceNumber && `· ${l.referenceNumber}`}</span>
                        <button type="button" onClick={(e) => { e.preventDefault(); ignoreMutation.mutate(l._id); }} className="text-slate-400 hover:text-red-500">Ignore</button>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <CardHeader title="Unmatched Ledger Lines" sub={`${(ledgerLines as any[]).length} posted Cash/Bank line(s) not yet matched`} />
            {ledgerLoading ? (
              <div className="p-8 text-center text-slate-400 text-sm animate-pulse">Loading…</div>
            ) : (ledgerLines as any[]).length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400">No unmatched ledger activity for this account.</div>
            ) : (
              <div className="divide-y divide-slate-50 max-h-[420px] overflow-y-auto">
                {(ledgerLines as any[]).map((l: any) => (
                  <label key={ledgerKey(l)} className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 ${selectedLedgerKeys.has(ledgerKey(l)) ? "bg-blue-50" : ""}`}>
                    <input type="checkbox" checked={selectedLedgerKeys.has(ledgerKey(l))} onChange={() => toggleLedgerLine(l)} />
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-slate-700">{l.narration || l.entryNo}</span>
                        <span className={`text-sm font-mono font-semibold ${l.amount < 0 ? "text-red-600" : "text-emerald-600"}`}>{money(l.amount)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-400 mt-0.5">
                        <span>{new Date(l.date).toLocaleDateString()} · {l.entryNo}{!l.isBankAccountTagged && " · unlinked account"}</span>
                        <span>{l.partnerName || ""}</span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {bankAccountId && (unmatched.length > 0 || (ledgerLines as any[]).length > 0) && (
        <div className="flex justify-end">
          <Btn variant="success" size="md" onClick={doMatch}>
            <CheckCircle size={14} /> Match Selected ({selectedLedgerKeys.size} ledger line{selectedLedgerKeys.size === 1 ? "" : "s"})
          </Btn>
        </div>
      )}

      {(matched.length > 0 || ignored.length > 0) && (
        <Card>
          <CardHeader title="Matched / Ignored Lines" sub="History for this bank account" />
          <TableWrap headers={["Date", "Description", "Amount (₨)", "Status", "Matched To", "Action"]}>
            {[...matched, ...ignored].map((l: any) => (
              <tr key={l._id} className="hover:bg-slate-50">
                <td className="px-4 py-2.5 text-xs text-slate-500">{new Date(l.statementDate).toLocaleDateString()}</td>
                <td className="px-4 py-2.5 text-slate-700">{l.description || "—"}</td>
                <td className="px-4 py-2.5 font-mono text-right">{money(l.amount)}</td>
                <td className="px-4 py-2.5"><Badge v={l.status === "matched" ? "green" : "gray"}>{l.status}</Badge></td>
                <td className="px-4 py-2.5 text-xs text-slate-500">
                  {(l.matches || []).map((m: any) => `${m.narration || m.entryNo} (₨${money(m.amount)})`).join("; ") || "—"}
                </td>
                <td className="px-4 py-2.5">
                  {l.status === "matched" && (
                    <button onClick={() => unmatchMutation.mutate(l._id)} className="text-xs text-slate-400 hover:text-[#0C447C]">Unmatch</button>
                  )}
                </td>
              </tr>
            ))}
          </TableWrap>
        </Card>
      )}

      {showImport && bankAccountId && (
        <ImportStatementModal bankAccountId={bankAccountId} onClose={() => setShowImport(false)} onImported={refreshAll} />
      )}
    </div>
  );
}

// ─── TAB: BUDGETING ───────────────────────────────────────────────────────────
type CCForm = { code: string; name: string; dept: string; campus: string; budget: string; description: string; status: string };
const BLANK_CC: CCForm = { code: "", name: "", dept: "", campus: "", budget: "", description: "", status: "Active" };

type BudgetForm = { title: string; year: string; campus: string; dept: string; costCenterId: string; budgetType: string; startDate: string; endDate: string; amount: string; notes: string; status: string };
const BLANK_BUDGET: BudgetForm = { title: "", year: "2025-26", campus: "", dept: "", costCenterId: "", budgetType: "Annual", startDate: "", endDate: "", amount: "", notes: "", status: "Draft" };

// Utilization badge convention for Phase 4 Budget vs Actual: under 90% is
// healthy, 90-100% is a warning, over 100% is over-budget and should stand
// out — that's the entire point of the report.
function utilizationBadge(pct: number | null | undefined) {
  if (pct === null || pct === undefined) return <Badge v="gray">No allocation</Badge>;
  if (pct > 100) return <Badge v="red">{pct}% — Over budget</Badge>;
  if (pct >= 90) return <Badge v="amber">{pct}%</Badge>;
  return <Badge v="green">{pct}%</Badge>;
}

function BudgetVsActualModal({ budgetId, onClose }: { budgetId: string; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ["budget-vs-actual", budgetId],
    queryFn: () => financeService.getBudgetVsActual(budgetId),
  });
  const result = (data || {}) as any;
  const lines = (result.lines || []) as any[];
  const chartData = lines.map((l: any) => ({ name: l.costCenterName, Allocated: l.allocatedAmount, Actual: l.actualAmount }));

  return (
    <Modal title={`Budget vs Actual — ${result.budgetName || ""}`} size="lg" onClose={onClose}>
      {isLoading ? (
        <div className="p-10 text-center text-slate-400 text-sm animate-pulse">Loading…</div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KPI icon={BarChart3} label="Allocated" value={`₨ ${money(result.totalAllocated || 0)}`} color={VIZ_SERIES[0]} />
            <KPI icon={TrendingUp} label="Actual (posted)" value={`₨ ${money(result.totalActual || 0)}`} color={VIZ_SERIES[1]} />
            <KPI icon={result.totalVariance < 0 ? AlertTriangle : CheckCircle} label="Variance" value={`₨ ${money(result.totalVariance || 0)}`} color={(result.totalVariance || 0) < 0 ? "#ef4444" : "#10b981"} />
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex flex-col items-start justify-center">
              <div className="text-xs text-slate-500 mb-1">Utilization</div>
              {utilizationBadge(result.totalUtilizationPct)}
            </div>
          </div>

          {chartData.length > 0 && (
            <div className="p-2">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }} formatter={(v: any) => `₨ ${money(v)}`} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Allocated" fill={VIZ_SERIES[0]} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Actual" fill={VIZ_SERIES[1]} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <TableWrap headers={["Cost Center", "Category", "Allocated (₨)", "Actual (₨)", "Variance (₨)", "Utilization"]}>
            {lines.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-400">No budget lines.</td></tr>
            ) : lines.map((l: any, i: number) => (
              <tr key={i} className="hover:bg-slate-50">
                <td className="px-4 py-2.5 font-medium text-slate-800">{l.costCenterName}</td>
                <td className="px-4 py-2.5 text-slate-600">{l.category}</td>
                <td className="px-4 py-2.5 font-mono text-right">{money(l.allocatedAmount)}</td>
                <td className="px-4 py-2.5 font-mono text-right">{money(l.actualAmount)}</td>
                <td className={`px-4 py-2.5 font-mono text-right font-semibold ${l.variance < 0 ? "text-red-600" : "text-emerald-600"}`}>{money(l.variance)}</td>
                <td className="px-4 py-2.5">{utilizationBadge(l.utilizationPct)}</td>
              </tr>
            ))}
          </TableWrap>
        </div>
      )}
    </Modal>
  );
}

function BudgetSummaryCard() {
  const { data: summary = [], isLoading } = useQuery({ queryKey: ["budget-summary"], queryFn: () => financeService.getBudgetSummary() });
  const rows = summary as any[];
  return (
    <Card>
      <CardHeader title="Budget Summary" sub="Allocated vs actual (real posted spend) across every approved/active budget" />
      {isLoading ? (
        <div className="p-10 text-center text-slate-400 text-sm animate-pulse">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="p-10 text-center text-slate-400 text-sm">No approved or active budgets yet.</div>
      ) : (
        <TableWrap headers={["Budget", "Academic Year", "Status", "Allocated (₨)", "Actual (₨)", "Variance (₨)", "Utilization"]}>
          {rows.map((r: any) => (
            <tr key={r.budgetId} className="hover:bg-slate-50">
              <td className="px-4 py-2.5 font-semibold text-slate-800">{r.budgetName}</td>
              <td className="px-4 py-2.5 text-slate-500">{r.academicYear}</td>
              <td className="px-4 py-2.5"><Badge v={r.status === "approved" || r.status === "active" ? "green" : r.status === "closed" ? "gray" : "amber"}>{r.status}</Badge></td>
              <td className="px-4 py-2.5 font-mono text-right">{money(r.totalAllocated)}</td>
              <td className="px-4 py-2.5 font-mono text-right">{money(r.totalActual)}</td>
              <td className={`px-4 py-2.5 font-mono text-right font-semibold ${r.totalVariance < 0 ? "text-red-600" : "text-emerald-600"}`}>{money(r.totalVariance)}</td>
              <td className="px-4 py-2.5">{utilizationBadge(r.totalUtilizationPct)}</td>
            </tr>
          ))}
        </TableWrap>
      )}
    </Card>
  );
}

function BudgetingTab() {
  const [costCenters, setCostCenters]     = useState<CostCenter[]>(INITIAL_COST_CENTERS);
  const [showCCModal, setShowCCModal]     = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [editCC, setEditCC]               = useState<CostCenter | null>(null);
  const [ccForm, setCCForm]               = useState<CCForm>(BLANK_CC);
  const [budgetForm, setBudgetForm]       = useState<BudgetForm>(BLANK_BUDGET);
  const [budgetErrors, setBudgetErrors]   = useState<Record<string, boolean>>({});
  const [ccSearch, setCCSearch]           = useState("");
  const [viewBudgetId, setViewBudgetId]   = useState<string | null>(null);

  const queryClient = useQueryClient();
  const { data: budgets = [], isLoading: budgetsLoading } = useQuery({ queryKey: ["budgets"], queryFn: () => financeService.getBudgets() });
  const { data: campuses = [] } = useQuery({ queryKey: ["campuses"], queryFn: organizationService.getCampuses });
  // Real Cost Centers (Phase 1 ledger dimension) — offered as an optional
  // dropdown on the create-budget form so new budgets tie cleanly to a real
  // cost center for budget-vs-actual, without forcing schools that haven't
  // seeded Cost Centers to use it (free-text campus/department still works).
  const { data: realCostCenters = [] } = useQuery({ queryKey: ["cost-centers"], queryFn: () => financeService.getCostCenters() });
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
    const selectedCC = (realCostCenters as any[]).find(c => c._id === budgetForm.costCenterId);
    createBudgetMutation.mutate({
      name: budgetForm.title,
      academicYear: budgetForm.year,
      term: budgetForm.budgetType,
      campusId: budgetForm.campus,
      departmentId: budgetForm.dept || undefined,
      lines: [{
        category: budgetForm.dept || budgetForm.title,
        allocatedAmount: Number(budgetForm.amount) || 0,
        ...(selectedCC ? { costCenterId: selectedCC._id, costCenterName: selectedCC.name } : {}),
      }],
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
                <div className="flex items-center">
                  <button onClick={() => setViewBudgetId(b._id)} className="p-1.5 text-slate-400 hover:text-[#0C447C] hover:bg-blue-50 rounded-lg" title="Budget vs Actual"><Eye size={13} /></button>
                  {b.status === "draft" && (
                    <button onClick={() => approveBudgetMutation.mutate(b._id)} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Approve"><CheckCircle size={13} /></button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </TableWrap>
      </Card>

      {/* Budget Summary — portfolio view across all approved/active budgets, real posted spend */}
      <BudgetSummaryCard />

      {viewBudgetId && <BudgetVsActualModal budgetId={viewBudgetId} onClose={() => setViewBudgetId(null)} />}

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
            <FField label="Cost Center (optional)">
              <FSelect value={budgetForm.costCenterId} onChange={e => setBudgetForm(f => ({ ...f, costCenterId: e.target.value }))}>
                <option value="">None — use Campus/Department above</option>
                {(realCostCenters as any[]).map(c => <option key={c._id} value={c._id}>{c.code} — {c.name}</option>)}
              </FSelect>
              <p className="text-xs text-slate-400 mt-0.5">Ties this budget to a real Cost Center for the Budget vs Actual report.</p>
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
  // Item 42 — was a placeholder with no backend endpoint at all; now backed
  // by GET /finance/reports/balance-sheet, "as of" a date since a balance
  // sheet is a point-in-time position, not a period report.
  { name: "Balance Sheet",                desc: "Assets, liabilities and equity, as of a date",         icon: BookOpen,   live: true  },
  { name: "Payroll Summary Report",       desc: "Staff salaries, allowances and deductions",            icon: Users,      live: false },
  { name: "Vendor Payment Report",        desc: "Supplier payment history and outstanding dues",        icon: Building2,  live: false },
  // Phase 6 — no longer a placeholder: this tile now opens the real Bank
  // Reconciliation tab (see the `name === "Bank Reconciliation Report"`
  // special-case in ReportsTab's tile onClick) instead of the generic
  // "no backend data source yet" report-generation modal every other
  // non-live tile still uses.
  { name: "Bank Reconciliation Report",   desc: "Bank statement vs general ledger reconciliation",      icon: RefreshCw,  live: true  },
  { name: "Zakat & Islamic Funds Report", desc: "Shariah-compliant fund utilization details",           icon: Shield,     live: false },
  { name: "Budget vs Actual Report",      desc: "Department-wise budget performance analysis",          icon: BarChart3,  live: false },
  // Phase 7 — no longer a placeholder: "Profitability and cost analysis per
  // campus" is exactly getProfitabilityByCostCenter, so this tile now opens
  // the real report instead of the generic non-live modal, same precedent
  // as the Bank Reconciliation Report tile in Phase 6.
  { name: "Campus-wise Financial Report", desc: "Profitability and cost analysis per campus",           icon: MapPin,     live: true  },
  // Phase 7 — Full report suite. Sales Commission starts genuinely empty
  // until a school configures a referral-source rule and at least one
  // family/student assignment (see FinanceService.getSalesCommissionReport);
  // the other six are backed by real posted journal/payment/vendor data
  // from day one.
  { name: "Sales Commission Report",      desc: "Commission owed by referral source, from real fee collections", icon: Handshake, live: true },
  { name: "Sales Payment Summary",        desc: "Collections by period, payment method and collector",  icon: Wallet,     live: true  },
  { name: "Address & Contacts",           desc: "Vendor contact directory (name, phone, email, address)", icon: Contact,  live: true  },
  { name: "Tax Details",                  desc: "Every posted journal line that hit a tax account",     icon: Percent,    live: true  },
  { name: "Gross Profit Report",          desc: "Fee revenue minus direct cost of service delivery",    icon: Gauge,      live: true  },
  { name: "Revenue & Expense Trends",     desc: "Month-over-month Revenue, Expenses and Net Income",     icon: Activity,   live: true  },
  // FEE-07 — dedicated challan-level report: unlike the two generic
  // Fee Collection/Outstanding Dues tiles above (which only ever show
  // aggregates), this lists one row per invoice/challan with campus,
  // academic year, class, and status filters plus a CSV export.
  { name: "Fee & Challan Report",         desc: "Every challan/invoice — student, class, fee heads, amount and status", icon: Receipt, live: true },
] as const;

// Phase 7 report tiles that open a dedicated live-data view (Modal, size
// "lg") from PHASE7_REPORT_VIEWS, instead of the generic CSV-generation
// modal every earlier report tile still uses.
const PHASE7_REPORT_NAMES = new Set<string>([
  "Campus-wise Financial Report", "Sales Commission Report", "Sales Payment Summary",
  "Address & Contacts", "Tax Details", "Gross Profit Report", "Revenue & Expense Trends",
  "Fee & Challan Report", "Balance Sheet",
]);

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

function ReportsTab({ onNavigate }: { onNavigate: (tab: FinTab) => void }) {
  const [reportModal, setReportModal] = useState<(typeof REPORT_LIST)[number] | null>(null);
  const [filterFrom, setFilterFrom]   = useState("");
  const [filterTo, setFilterTo]       = useState("");
  const [generating, setGenerating]   = useState(false);
  const [groupBy, setGroupBy]         = useState("summary");
  const [reportFormat, setReportFormat] = useState<"summary" | "detail">("summary");
  const [phase7View, setPhase7View]   = useState<string | null>(null);

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
                  {r.name === "Bank Reconciliation Report" ? (
                    <Btn variant="primary" size="sm" onClick={() => onNavigate("reconciliation")}>
                      <RefreshCw size={12} /> Open Bank Reconciliation
                    </Btn>
                  ) : PHASE7_REPORT_NAMES.has(r.name) ? (
                    <Btn variant="primary" size="sm" onClick={() => setPhase7View(r.name)}>
                      <Eye size={12} /> Open Report
                    </Btn>
                  ) : (
                    <Btn variant="primary" size="sm" onClick={() => { setReportModal(r); setGroupBy("summary"); setReportFormat("summary"); }}>
                      <Download size={12} /> Generate Report
                    </Btn>
                  )}
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
            {(reportModal.name === "Fee Collection Report" || reportModal.name === "Outstanding Dues Report" || reportModal.name === "Income & Expense Statement") && (
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
                    } else if (reportModal.name === "Income & Expense Statement") {
                      // Item 3 fix \u2014 this report used to only offer a direct
                      // CSV download with no preview step at all, unlike Fee
                      // Collection/Outstanding Dues alongside it.
                      const ay = localStorage.getItem("academicYear") || "2025-26";
                      const res = await financeService.getIncomeStatement({ academicYear: ay, from: filterFrom || undefined, to: filterTo || undefined });
                      const rows: (string | number)[][] = [
                        ["Total Revenue", res.totalRevenue], ["Total Expenses", res.totalExpenses], ["Net Income", res.netIncome],
                        [], ["Category", "Amount"],
                        ...(res.expenseBreakdown || []).map((e: any) => [e._id, e.total]),
                      ];
                      await printReport("Income & Expense Statement", ay, rows);
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

      {phase7View && (
        <Modal title={phase7View} size="lg" onClose={() => setPhase7View(null)}>
          <Phase7ReportBody reportName={phase7View} />
        </Modal>
      )}
    </div>
  );
}

// ─── PHASE 7 REPORT SUITE — Sales Commission, Payment Summary, Vendor
// Contacts (Address & Contacts), Tax Detail, Gross Profit, Profitability by
// Cost Center, and 12-month Trends. Every number is sourced from real
// posted Payment/JournalEntry/Vendor data (see finance.service.ts's
// "PHASE 7 — REPORT SUITE" section) except Sales Commission, which is
// correctly empty until a school configures at least one referral-source
// rule and assignment — no fabricated placeholder numbers anywhere below.
// ─────────────────────────────────────────────────────────────────────────────
function Phase7ReportBody({ reportName }: { reportName: string }) {
  switch (reportName) {
    case "Sales Commission Report": return <SalesCommissionReportView />;
    case "Sales Payment Summary": return <PaymentSummaryReportView />;
    case "Address & Contacts": return <VendorContactsReportView />;
    case "Tax Details": return <TaxDetailReportView />;
    case "Gross Profit Report": return <GrossProfitReportView />;
    case "Campus-wise Financial Report": return <ProfitabilityByCostCenterView />;
    case "Revenue & Expense Trends": return <TrendsReportView />;
    case "Fee & Challan Report": return <FeeChallanReportView />;
    case "Balance Sheet": return <BalanceSheetReportView />;
    default: return <p className="text-sm text-slate-400">No view available.</p>;
  }
}

// FEE-07 — dedicated Fee & Challan Report: one row per invoice with
// student/class/fee-head/amount/status/date, filterable by campus,
// academic year, class, and status (in addition to date range). Reuses
// the existing GET /finance/invoices endpoint (extended with campus/
// section/from/to filters) rather than adding a new backend query.
const INVOICE_STATUS_OPTIONS = ["draft", "sent", "paid", "partial", "overdue", "cancelled", "waived", "hold"];

function FeeChallanReportView() {
  const [campus, setCampus] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [grade, setGrade] = useState("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const { data: campuses = [] } = useQuery({ queryKey: ["campuses"], queryFn: organizationService.getCampuses });
  const { data: grades = [] } = useQuery({ queryKey: ["grades"], queryFn: () => organizationService.getGrades() });

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["fee-challan-report", campus, academicYear, grade, status, from, to],
    queryFn: () => financeService.getInvoices({
      campus: campus || undefined, academicYear: academicYear || undefined,
      grade: grade || undefined, status: status || undefined,
      from: from || undefined, to: to || undefined, limit: 1000,
    }),
  });
  const rows: any[] = (data as any) || [];
  const totalAmount = rows.reduce((sum: number, r: any) => sum + (r.totalAmount || 0), 0);

  function reportRows() {
    const headers = ["Student", "Class", "Section", "Fee Head(s)", "Amount", "Status", "Date"];
    const body = rows.map((r: any) => [
      r.studentName || "",
      r.grade || "",
      r.section || "",
      (r.items || []).map((i: any) => i.feeHead).filter(Boolean).join("; "),
      money(r.totalAmount ?? 0),
      r.status || "",
      r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "",
    ]);
    body.push(["", "", "", "Total", money(totalAmount), "", ""]);
    return [headers, ...body];
  }

  function exportCsv() {
    downloadCsv(`fee-challan-report-${new Date().toISOString().slice(0, 10)}.csv`, reportRows());
  }

  function printPreview() {
    const subtitleParts = [
      campus && `Campus: ${campus}`, academicYear && `AY: ${academicYear}`,
      grade && `Class: ${grade}`, status && `Status: ${status}`,
      from && to && `${from} to ${to}`,
    ].filter(Boolean);
    printReport("Fee & Challan Report", subtitleParts.join(" · ") || "All challans", reportRows());
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <FField label="Campus">
          <FSelect value={campus} onChange={e => setCampus(e.target.value)}>
            <option value="">All campuses</option>
            {(campuses as any[]).map((c: any) => <option key={c._id} value={c.name}>{c.name}</option>)}
          </FSelect>
        </FField>
        <FField label="Academic Year">
          <FInput value={academicYear} onChange={e => setAcademicYear(e.target.value)} placeholder="e.g. 2026-27" />
        </FField>
        <FField label="Class">
          <FSelect value={grade} onChange={e => setGrade(e.target.value)}>
            <option value="">All classes</option>
            {(grades as any[]).map((g: any) => <option key={g._id} value={g.name}>{g.name}</option>)}
          </FSelect>
        </FField>
        <FField label="Status">
          <FSelect value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            {INVOICE_STATUS_OPTIONS.map(s => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
          </FSelect>
        </FField>
      </div>
      <DateRangeBar from={from} to={to} setFrom={setFrom} setTo={setTo} />
      <div className="flex gap-2">
        <Btn variant="secondary" size="sm" onClick={() => refetch()}>{isFetching ? "Loading…" : "Apply Filters"}</Btn>
        <Btn variant="secondary" size="sm" onClick={printPreview} disabled={rows.length === 0}><Printer size={12} /> Print Preview</Btn>
        <Btn variant="primary" size="sm" onClick={exportCsv} disabled={rows.length === 0}><Download size={12} /> Export CSV</Btn>
      </div>
      {isLoading ? (
        <div className="p-10 text-center text-slate-400 text-sm animate-pulse">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="p-10 text-center text-slate-400 text-sm">No challans match these filters.</div>
      ) : (
        <>
          <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm flex justify-between items-center">
            <span className="text-slate-500">{rows.length} challan{rows.length === 1 ? "" : "s"}</span>
            <span className="font-semibold text-slate-800">Total Amount: <span className="font-mono">₨ {money(totalAmount)}</span></span>
          </div>
          <TableWrap headers={["Student", "Class / Section", "Fee Head(s)", "Amount", "Status", "Date"]}>
            {rows.map((r: any) => (
              <tr key={r._id} className="hover:bg-slate-50">
                <td className="px-4 py-2.5 text-sm font-medium text-slate-800">{r.studentName}</td>
                <td className="px-4 py-2.5 text-xs text-slate-600">{r.grade}{r.section ? ` - ${r.section}` : ""}</td>
                <td className="px-4 py-2.5 text-xs text-slate-600">{(r.items || []).map((i: any) => i.feeHead).filter(Boolean).join(", ") || "—"}</td>
                <td className="px-4 py-2.5 text-sm text-right font-mono">₨ {money(r.totalAmount || 0)}</td>
                <td className="px-4 py-2.5"><Badge v={r.status === "paid" ? "green" : r.status === "overdue" ? "red" : r.status === "partial" ? "amber" : "gray"}>{r.status}</Badge></td>
                <td className="px-4 py-2.5 text-xs text-slate-500">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—"}</td>
              </tr>
            ))}
            <tr className="bg-slate-50 font-semibold">
              <td className="px-4 py-2.5 text-sm text-slate-800" colSpan={3}>Total</td>
              <td className="px-4 py-2.5 text-sm text-right font-mono text-slate-800">₨ {money(totalAmount)}</td>
              <td className="px-4 py-2.5" colSpan={2}></td>
            </tr>
          </TableWrap>
        </>
      )}
    </div>
  );
}

function DateRangeBar({ from, to, setFrom, setTo }: { from: string; to: string; setFrom: (v: string) => void; setTo: (v: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <FField label="From"><FInput type="date" value={from} onChange={e => setFrom(e.target.value)} /></FField>
      <FField label="To"><FInput type="date" value={to} onChange={e => setTo(e.target.value)} /></FField>
    </div>
  );
}

// Item 42 — Balance Sheet: previously a placeholder tile with no backend
// endpoint. Deliberately "as of" a single date rather than a from/to
// range — a balance sheet is a snapshot of financial position, and "assets
// between two dates" isn't a meaningful accounting statement (see
// FinanceService.getBalanceSheet's own note on this).
function BalanceSheetReportView() {
  const [asOf, setAsOf] = useState("");
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["balance-sheet", asOf],
    queryFn: () => financeService.getBalanceSheet(asOf || undefined),
  });
  const bs: any = data || { assets: [], liabilities: [], equity: [], totalAssets: 0, totalLiabilities: 0, totalEquity: 0, currentPeriodNetIncome: 0, isBalanced: true };

  function section(title: string, rows: any[], total: number) {
    return (
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">{title}</p>
        {rows.length === 0 ? (
          <p className="text-xs text-slate-400 px-1">None posted.</p>
        ) : (
          <TableWrap headers={["Code", "Account", "Balance"]}>
            {rows.map((r: any) => (
              <tr key={r.code}>
                <td className="px-4 py-2 text-xs font-mono text-slate-500">{r.code}</td>
                <td className="px-4 py-2 text-sm text-slate-700">{r.name}</td>
                <td className="px-4 py-2 text-sm text-right font-medium">{money(r.balance)}</td>
              </tr>
            ))}
            <tr className="bg-slate-50 font-semibold">
              <td className="px-4 py-2 text-sm" colSpan={2}>Total {title}</td>
              <td className="px-4 py-2 text-sm text-right">{money(total)}</td>
            </tr>
          </TableWrap>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <FField label="As Of"><FInput type="date" value={asOf} onChange={e => setAsOf(e.target.value)} /></FField>
      <Btn variant="secondary" size="sm" onClick={() => refetch()}>Apply Filter</Btn>
      {isLoading ? (
        <div className="p-10 text-center text-slate-400 text-sm animate-pulse">Loading…</div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4">
            <KPI icon={TrendingUp} label="Total Assets" value={`₨ ${money(bs.totalAssets)}`} color={VIZ_SERIES[0]} />
            <KPI icon={AlertTriangle} label="Total Liabilities" value={`₨ ${money(bs.totalLiabilities)}`} color={VIZ_SERIES[1]} />
            <KPI icon={Gauge} label="Total Equity" value={`₨ ${money(bs.totalEquity)}`} color={VIZ_SERIES[2]} />
          </div>
          <p className="text-xs text-slate-400">Equity includes the current period's not-yet-closed net income/loss (₨ {money(bs.currentPeriodNetIncome)}) as "Retained Earnings (current period)".</p>
          {section("Assets", bs.assets, bs.totalAssets)}
          {section("Liabilities", bs.liabilities, bs.totalLiabilities)}
          {section("Equity", bs.equity, bs.totalEquity)}
          <div className={`px-5 py-3 border rounded-lg flex items-center justify-between text-sm font-semibold ${bs.isBalanced ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-700 border-red-100"}`}>
            <span>{bs.isBalanced ? "✓ Balanced — Assets = Liabilities + Equity" : "⚠ Out of balance — check recent journal entries"}</span>
          </div>
        </>
      )}
    </div>
  );
}

function GrossProfitReportView() {
  const [from, setFrom] = useState("");
  const [to, setTo]     = useState("");
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["gross-profit", from, to],
    queryFn: () => financeService.getGrossProfit(from || undefined, to || undefined),
  });
  const r: any = data || {};
  return (
    <div className="space-y-4">
      <DateRangeBar from={from} to={to} setFrom={setFrom} setTo={setTo} />
      <Btn variant="secondary" size="sm" onClick={() => refetch()}>Apply Filter</Btn>
      <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-800">
        {r.definition || "Total Fee Revenue (Tuition + Admission + Transport) minus Salaries & Wages — the direct cost of delivering the educational service. A school is a services business, not a manufacturer, so this replaces a classic COGS split."}
      </div>
      {isLoading ? (
        <div className="p-10 text-center text-slate-400 text-sm animate-pulse">Loading…</div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <KPI icon={TrendingUp} label="Total Fee Revenue" value={`₨ ${money(r.totalRevenue || 0)}`} color={VIZ_SERIES[0]} />
          <KPI icon={Users} label="Salaries & Wages (Direct Cost)" value={`₨ ${money(r.directCost || 0)}`} color={VIZ_SERIES[1]} />
          <KPI icon={Gauge} label="Gross Profit" value={`₨ ${money(r.grossProfit || 0)}`} color={VIZ_SERIES[2]} />
          <KPI icon={Percent} label="Gross Margin" value={`${r.grossMarginPct ?? 0}%`} color={VIZ_SERIES[3]} />
        </div>
      )}
    </div>
  );
}

function ProfitabilityByCostCenterView() {
  const [from, setFrom] = useState("");
  const [to, setTo]     = useState("");
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["profitability-cost-center", from, to],
    queryFn: () => financeService.getProfitabilityByCostCenter(from || undefined, to || undefined),
  });
  const rows: any[] = (data as any)?.rows || [];
  return (
    <div className="space-y-4">
      <DateRangeBar from={from} to={to} setFrom={setFrom} setTo={setTo} />
      <Btn variant="secondary" size="sm" onClick={() => refetch()}>Apply Filter</Btn>
      {isLoading ? (
        <div className="p-10 text-center text-slate-400 text-sm animate-pulse">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="p-10 text-center text-slate-400 text-sm">No cost-center-tagged postings yet.</div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="costCenterName" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }} formatter={(v: any) => `₨ ${money(v)}`} />
              <Bar dataKey="netIncome" name="Net Income" fill={VIZ_SERIES[0]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <TableWrap headers={["Cost Center", "Revenue", "Expense", "Net Income"]}>
            {rows.map((r, i) => (
              <tr key={i}>
                <td className="px-4 py-2.5 text-sm font-medium text-slate-800">{r.costCenterName}</td>
                <td className="px-4 py-2.5 text-sm text-right">{money(r.revenue)}</td>
                <td className="px-4 py-2.5 text-sm text-right">{money(r.expense)}</td>
                <td className={`px-4 py-2.5 text-sm text-right font-semibold ${r.netIncome >= 0 ? "text-emerald-600" : "text-red-500"}`}>{money(r.netIncome)}</td>
              </tr>
            ))}
          </TableWrap>
        </>
      )}
    </div>
  );
}

function TrendsReportView() {
  const { data, isLoading } = useQuery({ queryKey: ["monthly-trends"], queryFn: () => financeService.getMonthlyTrends(12) });
  const rows: any[] = (data as any) || [];
  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="p-10 text-center text-slate-400 text-sm animate-pulse">Loading…</div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }} formatter={(v: any) => `₨ ${money(v)}`} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="revenue" name="Revenue" stroke={VIZ_SERIES[0]} strokeWidth={2} dot={{ r: 2 }} />
              <Line type="monotone" dataKey="expenses" name="Expenses" stroke={VIZ_SERIES[1]} strokeWidth={2} dot={{ r: 2 }} />
              <Line type="monotone" dataKey="netIncome" name="Net Income" stroke={VIZ_SERIES[2]} strokeWidth={2} dot={{ r: 2 }} />
            </LineChart>
          </ResponsiveContainer>
          <TableWrap headers={["Month", "Revenue", "Expenses", "Net Income"]}>
            {rows.map((r, i) => (
              <tr key={i}>
                <td className="px-4 py-2.5 text-sm font-medium text-slate-800">{r.month}</td>
                <td className="px-4 py-2.5 text-sm text-right">{money(r.revenue)}</td>
                <td className="px-4 py-2.5 text-sm text-right">{money(r.expenses)}</td>
                <td className={`px-4 py-2.5 text-sm text-right font-semibold ${r.netIncome >= 0 ? "text-emerald-600" : "text-red-500"}`}>{money(r.netIncome)}</td>
              </tr>
            ))}
          </TableWrap>
        </>
      )}
    </div>
  );
}

function PaymentSummaryReportView() {
  const [from, setFrom]       = useState("");
  const [to, setTo]           = useState("");
  const [groupBy, setGroupBy] = useState("month");
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["payment-summary", from, to, groupBy],
    queryFn: () => financeService.getPaymentSummaryReport(from || undefined, to || undefined, groupBy),
  });
  const r: any = data || {};
  const chartData = (r.byPeriod || []).map((p: any) => ({ period: p.period, total: p.total }));
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <FField label="From"><FInput type="date" value={from} onChange={e => setFrom(e.target.value)} /></FField>
        <FField label="To"><FInput type="date" value={to} onChange={e => setTo(e.target.value)} /></FField>
        <FField label="Period">
          <FSelect value={groupBy} onChange={e => setGroupBy(e.target.value)}>
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
          </FSelect>
        </FField>
      </div>
      <Btn variant="secondary" size="sm" onClick={() => refetch()}>Apply Filter</Btn>
      {isLoading ? (
        <div className="p-10 text-center text-slate-400 text-sm animate-pulse">Loading…</div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4">
            <KPI icon={Wallet} label="Total Collected" value={`₨ ${money(r.totals?.total || 0)}`} color={VIZ_SERIES[0]} />
            <KPI icon={Receipt} label="Payment Count" value={String(r.totals?.count || 0)} color={VIZ_SERIES[1]} />
            <KPI icon={TrendingUp} label="Average Payment" value={`₨ ${money(r.totals?.avgPayment || 0)}`} color={VIZ_SERIES[2]} />
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="period" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }} formatter={(v: any) => `₨ ${money(v)}`} />
              <Bar dataKey="total" name="Collected" fill={VIZ_SERIES[0]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-2">By Payment Method</p>
              <TableWrap headers={["Method", "Total", "Count"]}>
                {(r.byMethod || []).map((m: any, i: number) => (
                  <tr key={i}>
                    <td className="px-4 py-2 text-sm capitalize">{String(m.paymentMethod).replace("_", " ")}</td>
                    <td className="px-4 py-2 text-sm text-right">{money(m.total)}</td>
                    <td className="px-4 py-2 text-sm text-right">{m.count}</td>
                  </tr>
                ))}
              </TableWrap>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-2">By Collector</p>
              <TableWrap headers={["Collected By", "Total", "Count"]}>
                {(r.byCollector || []).map((c: any, i: number) => (
                  <tr key={i}>
                    <td className="px-4 py-2 text-sm">{c.collectedBy}</td>
                    <td className="px-4 py-2 text-sm text-right">{money(c.total)}</td>
                    <td className="px-4 py-2 text-sm text-right">{c.count}</td>
                  </tr>
                ))}
              </TableWrap>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function VendorContactsReportView() {
  const { data, isLoading } = useQuery({ queryKey: ["vendor-contacts"], queryFn: () => financeService.getVendorContactsReport() });
  const rows: any[] = (data as any) || [];
  function contactRows(): (string | number)[][] {
    return [
      ["Name", "Contact Person", "Phone", "Email", "Address", "Tax ID"],
      ...rows.map(v => [v.name, v.contactPerson || "", v.phone || "", v.email || "", v.address || "", v.taxId || ""]),
    ];
  }
  function exportCsv() {
    downloadCsv("vendor-contacts.csv", contactRows());
  }
  // Item 3 fix — this report used to only offer a direct CSV download,
  // with no preview step (unlike Fee & Challan Report alongside it).
  function printPreview() {
    printReport("Address & Contacts", "Vendor contact directory", contactRows());
  }
  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-400">Vendor contact directory — the contact list genuinely owned by Finance. Student/family contacts live in the Students module.</p>
      <div className="flex justify-end gap-2">
        <Btn variant="secondary" size="sm" onClick={printPreview} disabled={rows.length === 0}><Printer size={12} /> Print Preview</Btn>
        <Btn variant="primary" size="sm" onClick={exportCsv} disabled={rows.length === 0}><Download size={12} /> Export CSV</Btn>
      </div>
      {isLoading ? (
        <div className="p-10 text-center text-slate-400 text-sm animate-pulse">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="p-10 text-center text-slate-400 text-sm">No active vendors yet.</div>
      ) : (
        <TableWrap headers={["Name", "Contact Person", "Phone", "Email", "Address", "Tax ID"]}>
          {rows.map((v, i) => (
            <tr key={i}>
              <td className="px-4 py-2.5 text-sm font-medium text-slate-800">{v.name}</td>
              <td className="px-4 py-2.5 text-sm text-slate-600">{v.contactPerson || "—"}</td>
              <td className="px-4 py-2.5 text-sm text-slate-600">{v.phone || "—"}</td>
              <td className="px-4 py-2.5 text-sm text-slate-600">{v.email || "—"}</td>
              <td className="px-4 py-2.5 text-xs text-slate-500">{v.address || "—"}</td>
              <td className="px-4 py-2.5 text-xs font-mono text-slate-500">{v.taxId || "—"}</td>
            </tr>
          ))}
        </TableWrap>
      )}
    </div>
  );
}

function TaxDetailReportView() {
  const [from, setFrom] = useState("");
  const [to, setTo]     = useState("");
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["tax-detail", from, to],
    queryFn: () => financeService.getTaxDetailReport(from || undefined, to || undefined),
  });
  const r: any = data || {};
  const rows: any[] = r.rows || [];
  function taxRows(): (string | number)[][] {
    return [
      ["Date", "Entry No", "Reference", "Account", "Tax Template", "Base Amount", "Debit", "Credit", "Partner"],
      ...rows.map(row => [
        row.date ? new Date(row.date).toLocaleDateString() : "", row.entryNo, row.reference || "",
        `${row.accountCode} ${row.accountName}`, row.taxTemplateName, row.baseAmount, row.debit, row.credit, row.partnerName || "",
      ]),
    ];
  }
  function exportCsv() {
    downloadCsv("tax-detail.csv", taxRows());
  }
  // Item 3 fix — this report used to only offer a direct CSV download,
  // with no preview step (unlike Fee & Challan Report alongside it).
  function printPreview() {
    printReport("Tax Details", from || to ? `${from || "…"} – ${to || "…"}` : "All periods", taxRows());
  }
  return (
    <div className="space-y-4">
      <DateRangeBar from={from} to={to} setFrom={setFrom} setTo={setTo} />
      <div className="flex gap-2">
        <Btn variant="secondary" size="sm" onClick={() => refetch()}>Apply Filter</Btn>
        <Btn variant="secondary" size="sm" onClick={printPreview} disabled={rows.length === 0}><Printer size={12} /> Print Preview</Btn>
        <Btn variant="primary" size="sm" onClick={exportCsv} disabled={rows.length === 0}><Download size={12} /> Export CSV</Btn>
      </div>
      <p className="text-xs text-slate-400">Every posted journal line that hit Sales Tax Payable (2400), Input Tax Receivable (1400) or Withholding Tax Payable (2500) — combined here instead of three separate General Ledger lookups. "Base Amount" is derived from the other (non-tax) lines of the same journal entry.</p>
      {isLoading ? (
        <div className="p-10 text-center text-slate-400 text-sm animate-pulse">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="p-10 text-center text-slate-400 text-sm">No tax-bearing postings in this period.</div>
      ) : (
        <TableWrap headers={["Date", "Entry No", "Account", "Tax Template", "Base Amount", "Debit", "Credit"]}>
          {rows.map((row, i) => (
            <tr key={i}>
              <td className="px-4 py-2.5 text-xs text-slate-500 whitespace-nowrap">{row.date ? new Date(row.date).toLocaleDateString() : "—"}</td>
              <td className="px-4 py-2.5 text-xs font-mono text-slate-500">{row.entryNo}</td>
              <td className="px-4 py-2.5 text-sm text-slate-700">{row.accountCode} · {row.accountName}</td>
              <td className="px-4 py-2.5 text-sm text-slate-600">{row.taxTemplateName}</td>
              <td className="px-4 py-2.5 text-sm text-right">{money(row.baseAmount)}</td>
              <td className="px-4 py-2.5 text-sm text-right">{money(row.debit)}</td>
              <td className="px-4 py-2.5 text-sm text-right">{money(row.credit)}</td>
            </tr>
          ))}
        </TableWrap>
      )}
    </div>
  );
}

function SalesCommissionReportView() {
  const queryClient = useQueryClient();
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [ruleName, setRuleName]   = useState("");
  const [rateType, setRateType]   = useState("percent");
  const [rateValue, setRateValue] = useState("");
  const [assignSource, setAssignSource] = useState("");
  const [familySearch, setFamilySearch] = useState("");

  const { data: rules = [] } = useQuery({ queryKey: ["commission-rules"], queryFn: () => financeService.getSalesCommissionRules() });
  const { data: assignments = [] } = useQuery({ queryKey: ["commission-assignments"], queryFn: () => financeService.getCommissionAssignments() });
  const { data: families = [] } = useQuery({
    queryKey: ["families-search", familySearch],
    queryFn: () => familiesService.getFamilies(familySearch || undefined),
    enabled: showAssignModal,
  });
  const { data: report, isLoading, refetch } = useQuery({
    queryKey: ["sales-commission-report"],
    queryFn: () => financeService.getSalesCommissionReport(),
  });

  const createRule = useMutation({
    mutationFn: financeService.createSalesCommissionRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commission-rules"] });
      toast.success("Referral source rule created");
      setShowRuleModal(false); setRuleName(""); setRateValue(""); setRateType("percent");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to create rule"),
  });

  const createAssignment = useMutation({
    mutationFn: financeService.createCommissionAssignment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commission-assignments"] });
      toast.success("Family assigned to referral source");
      setShowAssignModal(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to assign"),
  });

  function saveRule() {
    if (!ruleName.trim()) { toast.error("Enter a referral source name"); return; }
    const val = Number(rateValue);
    if (!val || val <= 0) { toast.error("Enter a valid rate"); return; }
    createRule.mutate({ referralSourceName: ruleName.trim(), rateType, rateValue: val });
  }

  function assignFamily(f: any) {
    if (!assignSource) { toast.error("Select a referral source first"); return; }
    createAssignment.mutate({
      targetType: "family", targetId: f._id, targetLabel: `${f.familyCode} — ${f.primaryGuardianName || "Family"}`,
      referralSourceName: assignSource,
    });
  }

  const r: any = report || {};

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-400">
        This school ERP has no built-in sales-partner concept — this feature models the closest honest equivalent:
        a free-text referral source (agent, consultancy, individual) with a configurable commission rate, applied
        to real fee collections from families you explicitly assign to it. Starts empty until configured.
      </p>

      <div className="flex gap-2">
        <Btn variant="secondary" size="sm" onClick={() => setShowRuleModal(true)}><Plus size={12} /> New Referral Source Rule</Btn>
        <Btn variant="secondary" size="sm" onClick={() => setShowAssignModal(true)}><Plus size={12} /> Assign Family</Btn>
        <Btn variant="secondary" size="sm" onClick={() => refetch()}>Refresh Report</Btn>
      </div>

      {!r.configured ? (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800">
          {r.note || "No referral-source rules configured yet."}
        </div>
      ) : r.rows?.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800">
          {r.note || "Rules exist but no family/student has been assigned yet."}
        </div>
      ) : null}

      {isLoading ? (
        <div className="p-10 text-center text-slate-400 text-sm animate-pulse">Loading…</div>
      ) : (r.rows || []).length > 0 && (
        <>
          <KPI icon={Handshake} label="Total Commission Owed" value={`₨ ${money(r.totalCommissionOwed || 0)}`} color={VIZ_SERIES[0]} />
          <TableWrap headers={["Referral Source", "Rate", "Assigned", "Collected", "Payments", "Commission Owed"]}>
            {(r.rows || []).map((row: any, i: number) => (
              <tr key={i}>
                <td className="px-4 py-2.5 text-sm font-medium text-slate-800">{row.referralSourceName}</td>
                <td className="px-4 py-2.5 text-sm text-slate-600">{row.rateType === "flat" ? `₨ ${money(row.rateValue)} flat` : `${row.rateValue}%`}</td>
                <td className="px-4 py-2.5 text-sm text-right">{row.assignedTargetCount}</td>
                <td className="px-4 py-2.5 text-sm text-right">{money(row.totalCollected)}</td>
                <td className="px-4 py-2.5 text-sm text-right">{row.paymentCount}</td>
                <td className="px-4 py-2.5 text-sm text-right font-semibold text-emerald-600">{money(row.commissionOwed)}</td>
              </tr>
            ))}
          </TableWrap>
        </>
      )}

      <div>
        <p className="text-xs font-semibold text-slate-500 mb-2">Configured Referral Sources</p>
        <TableWrap headers={["Referral Source", "Rate", "Active"]}>
          {(rules as any[]).length === 0 ? (
            <tr><td colSpan={3} className="px-4 py-6 text-center text-sm text-slate-400">No rules yet.</td></tr>
          ) : (rules as any[]).map((rule: any) => (
            <tr key={rule._id}>
              <td className="px-4 py-2 text-sm">{rule.referralSourceName}</td>
              <td className="px-4 py-2 text-sm">{rule.rateType === "flat" ? `₨ ${money(rule.rateValue)} flat` : `${rule.rateValue}%`}</td>
              <td className="px-4 py-2 text-sm">{rule.isActive ? "Yes" : "No"}</td>
            </tr>
          ))}
        </TableWrap>
      </div>

      <div>
        <p className="text-xs font-semibold text-slate-500 mb-2">Family Assignments ({(assignments as any[]).length})</p>
        <TableWrap headers={["Family", "Referral Source"]}>
          {(assignments as any[]).length === 0 ? (
            <tr><td colSpan={2} className="px-4 py-6 text-center text-sm text-slate-400">No assignments yet.</td></tr>
          ) : (assignments as any[]).map((a: any) => (
            <tr key={a._id}>
              <td className="px-4 py-2 text-sm">{a.targetLabel}</td>
              <td className="px-4 py-2 text-sm">{a.referralSourceName}</td>
            </tr>
          ))}
        </TableWrap>
      </div>

      {showRuleModal && (
        <Modal title="New Referral Source Rule" onClose={() => setShowRuleModal(false)}>
          <FField label="Referral Source Name" required>
            <FInput value={ruleName} onChange={e => setRuleName(e.target.value)} placeholder="e.g. Ahmed Khan (Agent)" />
          </FField>
          <FField label="Rate Type">
            <FSelect value={rateType} onChange={e => setRateType(e.target.value)}>
              <option value="percent">Percent of Collected Fee</option>
              <option value="flat">Flat Amount per Payment</option>
            </FSelect>
          </FField>
          <FField label={rateType === "flat" ? "Flat Amount (₨)" : "Rate (%)"} required>
            <FInput type="number" value={rateValue} onChange={e => setRateValue(e.target.value)} />
          </FField>
          <ModalFooter onCancel={() => setShowRuleModal(false)} onSave={saveRule} saveLabel={createRule.isPending ? "Saving…" : "Create Rule"} />
        </Modal>
      )}

      {showAssignModal && (
        <Modal title="Assign Family to Referral Source" onClose={() => setShowAssignModal(false)}>
          <FField label="Referral Source" required>
            <FSelect value={assignSource} onChange={e => setAssignSource(e.target.value)}>
              <option value="">Select a rule…</option>
              {(rules as any[]).map((rule: any) => (
                <option key={rule._id} value={rule.referralSourceName}>{rule.referralSourceName}</option>
              ))}
            </FSelect>
          </FField>
          <FField label="Search Family">
            <FInput value={familySearch} onChange={e => setFamilySearch(e.target.value)} placeholder="Search by guardian name / phone…" />
          </FField>
          <div className="max-h-60 overflow-y-auto border border-slate-100 rounded-lg divide-y divide-slate-50">
            {(families as any[]).length === 0 ? (
              <p className="text-xs text-slate-400 p-3">No families found.</p>
            ) : (families as any[]).map((f: any) => (
              <button
                key={f._id}
                type="button"
                onClick={() => assignFamily(f)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex justify-between items-center"
              >
                <span>{f.familyCode} — {f.primaryGuardianName || "Family"}</span>
                <span className="text-xs text-slate-400">{f.phone}</span>
              </button>
            ))}
          </div>
          <div className="flex justify-end pt-2 border-t border-slate-100">
            <Btn variant="secondary" size="md" onClick={() => setShowAssignModal(false)}>Close</Btn>
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

// ─── LEDGER TAB — Fiscal Years, Periods, Cost Centers, Payment Terms, Journal
// Entries, Trial Balance, General Ledger, Partner (Student/Supplier) Ledger.
// Phase 1 of the Odoo-standard finance rebuild — see
// claude/finance-module-odoo-standard-build-plan.md.
// ─────────────────────────────────────────────────────────────────────────────
type LedgerSubTab = "chart-of-accounts" | "trial-balance" | "general-ledger" | "partner-ledger" | "journal" | "setup"
  | "ar-aging" | "ap-aging" | "credit-balance" | "payment-period" | "taxes" | "tax-summary" | "fx-exposure";
const LEDGER_SUBTABS: { id: LedgerSubTab; label: string }[] = [
  // Item 39 — Chart of Accounts used to only be reachable from inside the
  // Fee & Revenue tab, with no separation from fee-structure management.
  // It's the real "ledger" sub-module UI, so it now lives here as this
  // tab's first (and default) sub-tab, moved rather than duplicated.
  { id: "chart-of-accounts", label: "Chart of Accounts" },
  { id: "trial-balance",  label: "Trial Balance" },
  { id: "general-ledger", label: "General Ledger" },
  { id: "partner-ledger", label: "Student / Supplier Ledger" },
  { id: "journal",        label: "Journal Entries" },
  { id: "ar-aging",       label: "AR Aging" },
  { id: "ap-aging",       label: "AP Aging" },
  { id: "credit-balance", label: "Customer Credit Balance" },
  { id: "payment-period", label: "Payment Period" },
  { id: "tax-summary",    label: "Tax Summary" },
  { id: "fx-exposure",    label: "FX Exposure" },
  { id: "setup",          label: "Accounting Setup" },
  { id: "taxes",          label: "Taxes" },
];

// ─── PHASE 2: AR/AP AGING, CREDIT BALANCE, PAYMENT PERIOD ──────────────────────
const AGING_BUCKET_KEYS = ["current", "1-30", "31-60", "61-90", "90+"] as const;
const AGING_BUCKET_LABELS: Record<string, string> = {
  current: "Current", "1-30": "1–30 days", "31-60": "31–60 days", "61-90": "61–90 days", "90+": "90+ days",
};

function AgingKpiRow({ buckets }: { buckets: Record<string, number> }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {AGING_BUCKET_KEYS.map((k, i) => (
        <KPI key={k} icon={Clock} label={AGING_BUCKET_LABELS[k]} value={`₨ ${money(buckets[k] || 0)}`} color={VIZ_SERIES[i]} />
      ))}
    </div>
  );
}

function ArAgingSubTab() {
  const { data, isLoading } = useQuery({ queryKey: ["ar-aging"], queryFn: () => financeService.getArAging() });
  const result = (data || { buckets: {}, rows: [], grandTotal: 0 }) as any;
  const chartData = AGING_BUCKET_KEYS.map((k, i) => ({ bucket: AGING_BUCKET_LABELS[k], amount: result.buckets[k] || 0, fill: VIZ_SERIES[i] }));

  return (
    <div className="space-y-4">
      <AgingKpiRow buckets={result.buckets} />
      <Card>
        <CardHeader title="AR Aging by Bucket" sub="Outstanding fee invoice balances bucketed by days overdue" />
        {isLoading ? (
          <div className="p-10 text-center text-slate-400 text-sm animate-pulse">Loading…</div>
        ) : (
          <div className="p-4">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="bucket" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }} formatter={(v: any) => `₨ ${money(v)}`} />
                <Bar dataKey="amount" name="Outstanding" radius={[4, 4, 0, 0]}>
                  {chartData.map((c, i) => <Cell key={i} fill={c.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
      <Card>
        <CardHeader title="AR Aging by Student / Family" sub="Every student with an outstanding balance, split across aging buckets" />
        {(result.rows || []).length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-sm">No outstanding receivables.</div>
        ) : (
          <TableWrap headers={["Student", "Guardian", "Current", "1–30", "31–60", "61–90", "90+", "Total"]}>
            {(result.rows as any[]).map((r, i) => (
              <tr key={i}>
                <td className="px-4 py-2.5 text-sm font-medium text-slate-800">{r.studentName}</td>
                <td className="px-4 py-2.5 text-xs text-slate-500">{r.guardianName || "—"}</td>
                <td className="px-4 py-2.5 text-sm text-right">{money(r.current)}</td>
                <td className="px-4 py-2.5 text-sm text-right">{money(r["1-30"])}</td>
                <td className="px-4 py-2.5 text-sm text-right">{money(r["31-60"])}</td>
                <td className="px-4 py-2.5 text-sm text-right">{money(r["61-90"])}</td>
                <td className="px-4 py-2.5 text-sm text-right text-red-600">{money(r["90+"])}</td>
                <td className="px-4 py-2.5 text-sm text-right font-semibold">{money(r.total)}</td>
              </tr>
            ))}
          </TableWrap>
        )}
      </Card>
    </div>
  );
}

function ApAgingSubTab() {
  const { data, isLoading } = useQuery({ queryKey: ["ap-aging"], queryFn: () => financeService.getApAging() });
  const result = (data || { buckets: {}, rows: [], grandTotal: 0 }) as any;
  const chartData = AGING_BUCKET_KEYS.map((k, i) => ({ bucket: AGING_BUCKET_LABELS[k], amount: result.buckets[k] || 0, fill: VIZ_SERIES[i] }));

  return (
    <div className="space-y-4">
      <AgingKpiRow buckets={result.buckets} />
      <Card>
        <CardHeader title="AP Aging by Bucket" sub="Outstanding vendor bill balances bucketed by days overdue" />
        {isLoading ? (
          <div className="p-10 text-center text-slate-400 text-sm animate-pulse">Loading…</div>
        ) : (
          <div className="p-4">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="bucket" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }} formatter={(v: any) => `₨ ${money(v)}`} />
                <Bar dataKey="amount" name="Outstanding" radius={[4, 4, 0, 0]}>
                  {chartData.map((c, i) => <Cell key={i} fill={c.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
      <Card>
        <CardHeader title="AP Aging by Vendor" sub="Every vendor with an outstanding bill balance, split across aging buckets" />
        {(result.rows || []).length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-sm">No outstanding payables.</div>
        ) : (
          <TableWrap headers={["Vendor", "Current", "1–30", "31–60", "61–90", "90+", "Total"]}>
            {(result.rows as any[]).map((r, i) => (
              <tr key={i}>
                <td className="px-4 py-2.5 text-sm font-medium text-slate-800">{r.vendorName}</td>
                <td className="px-4 py-2.5 text-sm text-right">{money(r.current)}</td>
                <td className="px-4 py-2.5 text-sm text-right">{money(r["1-30"])}</td>
                <td className="px-4 py-2.5 text-sm text-right">{money(r["31-60"])}</td>
                <td className="px-4 py-2.5 text-sm text-right">{money(r["61-90"])}</td>
                <td className="px-4 py-2.5 text-sm text-right text-red-600">{money(r["90+"])}</td>
                <td className="px-4 py-2.5 text-sm text-right font-semibold">{money(r.total)}</td>
              </tr>
            ))}
          </TableWrap>
        )}
      </Card>
    </div>
  );
}

// ─── PHASE 5: FX EXPOSURE REPORT ───────────────────────────────────────────────
function FxExposureSubTab() {
  const { data, isLoading } = useQuery({ queryKey: ["fx-exposure"], queryFn: () => financeService.getFxExposure() });
  const result = (data || { baseCurrency: "PKR", rows: [], totalUnrealized: 0 }) as any;
  const fmt = (n: number) => (n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
  const totalColor = result.totalUnrealized >= 0 ? "text-emerald-600" : "text-red-600";

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title="Unrealized FX Exposure"
          sub={`Every still-open foreign-currency invoice/vendor bill, revalued at today's rate vs the rate it was booked at — the standard month/year-end procedure for anyone holding open foreign-currency receivables/payables. Reporting only — nothing here posts to the ledger. Base currency: ${result.baseCurrency}.`}
        />
        {isLoading ? (
          <div className="p-10 text-center text-slate-400 text-sm animate-pulse">Loading…</div>
        ) : (result.rows || []).length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-sm">No open foreign-currency invoices or vendor bills — either none exist yet, or Multi-currency hasn't been set up under Ledger → Accounting Setup.</div>
        ) : (
          <>
            <TableWrap headers={["Type", "Document", "Partner", "Currency", "Balance", "Booked Rate", "Current Rate", "Booked (₨)", "Current (₨)", "Unrealized Gain/Loss"]}>
              {(result.rows as any[]).map((r, i) => (
                <tr key={i}>
                  <td className="px-4 py-2.5"><Badge v={r.type === "receivable" ? "blue" : "amber"}>{r.type === "receivable" ? "AR" : "AP"}</Badge></td>
                  <td className="px-4 py-2.5 text-xs font-mono text-slate-500">{r.documentNo}</td>
                  <td className="px-4 py-2.5 text-sm font-medium text-slate-800">{r.partnerName}</td>
                  <td className="px-4 py-2.5 text-xs font-mono font-bold text-slate-600">{r.currencyCode}</td>
                  <td className="px-4 py-2.5 text-sm text-right">{fmt(r.foreignBalance)}</td>
                  <td className="px-4 py-2.5 text-xs text-right text-slate-500">{r.bookedRate}</td>
                  <td className="px-4 py-2.5 text-xs text-right text-slate-500">{r.currentRate}</td>
                  <td className="px-4 py-2.5 text-sm text-right">₨ {fmt(r.bookedBase)}</td>
                  <td className="px-4 py-2.5 text-sm text-right">₨ {fmt(r.currentBase)}</td>
                  <td className={`px-4 py-2.5 text-sm text-right font-semibold ${r.unrealizedGainLoss >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {r.unrealizedGainLoss >= 0 ? "+" : ""}₨ {fmt(r.unrealizedGainLoss)}
                  </td>
                </tr>
              ))}
            </TableWrap>
            <div className={`px-5 py-3 border-t border-slate-100 text-sm font-bold flex justify-end ${totalColor}`}>
              Net unrealized {result.totalUnrealized >= 0 ? "gain" : "loss"}: ₨ {fmt(Math.abs(result.totalUnrealized))}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

function CreditBalanceSubTab() {
  const { data, isLoading } = useQuery({ queryKey: ["customer-credit-balance"], queryFn: () => financeService.getCustomerCreditBalance() });
  const result = (data || { rows: [], totalCredit: 0 }) as any;

  return (
    <Card>
      <CardHeader title="Customer Credit Balance" sub="Students/families whose total payments exceed their total fee invoiced — a credit owed back to them" />
      {isLoading ? (
        <div className="p-10 text-center text-slate-400 text-sm animate-pulse">Loading…</div>
      ) : (result.rows || []).length === 0 ? (
        <div className="p-10 text-center text-slate-400 text-sm">No students currently have a credit balance.</div>
      ) : (
        <>
          <TableWrap headers={["Student", "Total Invoiced", "Total Paid", "Credit Balance"]}>
            {(result.rows as any[]).map((r, i) => (
              <tr key={i}>
                <td className="px-4 py-2.5 text-sm font-medium text-slate-800">{r.studentName}</td>
                <td className="px-4 py-2.5 text-sm text-right">{money(r.totalInvoiced)}</td>
                <td className="px-4 py-2.5 text-sm text-right">{money(r.totalPaid)}</td>
                <td className="px-4 py-2.5 text-sm text-right font-semibold text-emerald-600">{money(r.creditAmount)}</td>
              </tr>
            ))}
          </TableWrap>
          <div className="px-5 py-3 border-t border-slate-100 text-sm font-semibold text-slate-700 flex justify-end">
            Total credit outstanding: ₨ {money(result.totalCredit)}
          </div>
        </>
      )}
    </Card>
  );
}

function PaymentPeriodSubTab() {
  const { data, isLoading } = useQuery({ queryKey: ["payment-period"], queryFn: () => financeService.getPaymentPeriodReport() });
  const result = (data || { avgDaysToPay: 0, totalCollected: 0, paymentCount: 0, monthly: [] }) as any;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPI icon={Clock} label="Avg. Days to Collect" value={`${result.avgDaysToPay} days`} sub="From invoice creation to payment" color={VIZ_SERIES[0]} />
        <KPI icon={Wallet} label="Total Collected" value={`₨ ${money(result.totalCollected)}`} color={VIZ_SERIES[1]} />
        <KPI icon={Receipt} label="Payments Recorded" value={String(result.paymentCount)} color={VIZ_SERIES[2]} />
      </div>
      <Card>
        <CardHeader title="Invoiced vs Collected by Month" sub="Month-by-month collection performance and average days-to-pay" />
        {isLoading ? (
          <div className="p-10 text-center text-slate-400 text-sm animate-pulse">Loading…</div>
        ) : (result.monthly || []).length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-sm">No payment data yet.</div>
        ) : (
          <div className="p-4">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={result.monthly}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="invoiced" name="Invoiced" stroke={VIZ_SERIES[0]} strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="collected" name="Collected" stroke={VIZ_SERIES[1]} strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
      {(result.monthly || []).length > 0 && (
        <Card>
          <CardHeader title="Monthly Breakdown" />
          <TableWrap headers={["Month", "Invoiced", "Collected", "Avg. Days to Pay"]}>
            {(result.monthly as any[]).map((m, i) => (
              <tr key={i}>
                <td className="px-4 py-2.5 text-sm font-medium text-slate-800">{m.month}</td>
                <td className="px-4 py-2.5 text-sm text-right">{money(m.invoiced)}</td>
                <td className="px-4 py-2.5 text-sm text-right">{money(m.collected)}</td>
                <td className="px-4 py-2.5 text-sm text-right">{m.avgDaysToPay != null ? `${m.avgDaysToPay} days` : "—"}</td>
              </tr>
            ))}
          </TableWrap>
        </Card>
      )}
    </div>
  );
}

function money(n: number) {
  return (n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function TrialBalanceSubTab() {
  // Item 42 — Trial Balance's "balance" column is cumulative from account
  // inception through a date, exactly like Balance Sheet's position; a
  // from/to RANGE has no accounting meaning here (there's no such thing as
  // "the balance between two dates" — only debit/credit MOVEMENT would be
  // period-scoped, and this report intentionally shows running balances,
  // not movement). So this gets the same "As Of" treatment as Balance
  // Sheet rather than a fabricated range — the backend already only ever
  // supported `asOf` (see getTrialBalance), this just exposes it in the UI.
  const [asOf, setAsOf] = useState("");
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["trial-balance", asOf],
    queryFn: () => financeService.getTrialBalance(asOf || undefined),
  });
  const tb = (data || { rows: [], totalDebit: 0, totalCredit: 0, isBalanced: true }) as any;

  return (
    <Card>
      <CardHeader
        title="Trial Balance"
        sub="Every posted account, debit and credit totals since inception — this must balance to zero for the books to be audit-clean"
        actions={
          <div className="flex items-center gap-2">
            <FField label="As Of"><FInput type="date" value={asOf} onChange={e => setAsOf(e.target.value)} /></FField>
            <Btn onClick={() => refetch()}><RefreshCw size={13} /> Refresh</Btn>
          </div>
        }
      />
      {isLoading ? (
        <div className="p-10 text-center text-slate-400 text-sm animate-pulse">Loading…</div>
      ) : tb.rows.length === 0 ? (
        <div className="p-10 text-center text-slate-400 text-sm">No postings yet — once fee payments, payroll, or expenses are recorded they'll show up here.</div>
      ) : (
        <>
          <TableWrap headers={["Code", "Account", "Type", "Debit", "Credit", "Balance"]}>
            {tb.rows.map((r: any) => (
              <tr key={r.code}>
                <td className="px-4 py-2.5 text-xs font-mono text-slate-500">{r.code}</td>
                <td className="px-4 py-2.5 text-sm font-medium text-slate-800">{r.name}</td>
                <td className="px-4 py-2.5 text-xs text-slate-400 capitalize">{r.type}</td>
                <td className="px-4 py-2.5 text-sm text-right">{r.debit > 0 ? money(r.debit) : "—"}</td>
                <td className="px-4 py-2.5 text-sm text-right">{r.credit > 0 ? money(r.credit) : "—"}</td>
                <td className="px-4 py-2.5 text-sm text-right font-semibold">{money(r.balance)}</td>
              </tr>
            ))}
          </TableWrap>
          <div className={`px-5 py-3 border-t flex items-center justify-between text-sm font-semibold ${tb.isBalanced ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-700 border-red-100"}`}>
            <span>{tb.isBalanced ? "✓ Balanced — total debits equal total credits" : "⚠ Out of balance — this should never happen; check recent journal entries"}</span>
            <span>Total Debit {money(tb.totalDebit)} · Total Credit {money(tb.totalCredit)}</span>
          </div>
        </>
      )}
    </Card>
  );
}

function GeneralLedgerSubTab() {
  const { data: coa = [] } = useQuery({ queryKey: ["coa"], queryFn: () => financeService.getCOA() });
  const accounts = (coa as any[]).filter(a => a.isActive !== false);
  const [accountCode, setAccountCode] = useState("");
  // Item 42 — the backend endpoint already accepted from/to (see
  // financeService.getGeneralLedger and finance.controller.ts's
  // reports/general-ledger route); the UI just never exposed them.
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const { data: gl, isLoading } = useQuery({
    queryKey: ["general-ledger", accountCode, from, to],
    queryFn: () => financeService.getGeneralLedger(accountCode, from || undefined, to || undefined),
    enabled: !!accountCode,
  });
  const result = (gl || { account: null, rows: [] }) as any;

  return (
    <Card>
      <CardHeader
        title="General Ledger"
        sub="Every posted transaction for a single account, with a running balance"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <FSelect value={accountCode} onChange={e => setAccountCode(e.target.value)}>
              <option value="">Select an account…</option>
              {accounts.map((a: any) => <option key={a.code} value={a.code}>{a.code} — {a.name}</option>)}
            </FSelect>
            <div className="w-40"><FInput type="date" value={from} onChange={e => setFrom(e.target.value)} /></div>
            <span className="text-xs text-slate-400">to</span>
            <div className="w-40"><FInput type="date" value={to} onChange={e => setTo(e.target.value)} /></div>
          </div>
        }
      />
      {!accountCode ? (
        <div className="p-10 text-center text-slate-400 text-sm">Choose an account above to see its ledger.</div>
      ) : isLoading ? (
        <div className="p-10 text-center text-slate-400 text-sm animate-pulse">Loading…</div>
      ) : result.rows.length === 0 ? (
        <div className="p-10 text-center text-slate-400 text-sm">No postings for this account yet.</div>
      ) : (
        <TableWrap headers={["Date", "Entry #", "Narration", "Debit", "Credit", "Running Balance"]}>
          {result.rows.map((r: any, i: number) => (
            <tr key={i}>
              <td className="px-4 py-2.5 text-xs text-slate-500">{new Date(r.date).toLocaleDateString()}</td>
              <td className="px-4 py-2.5 text-xs font-mono text-slate-500">{r.entryNo}</td>
              <td className="px-4 py-2.5 text-sm text-slate-700">{r.narration}{r.partnerName ? ` — ${r.partnerName}` : ''}</td>
              <td className="px-4 py-2.5 text-sm text-right">{r.debit > 0 ? money(r.debit) : "—"}</td>
              <td className="px-4 py-2.5 text-sm text-right">{r.credit > 0 ? money(r.credit) : "—"}</td>
              <td className="px-4 py-2.5 text-sm text-right font-semibold">{money(r.runningBalance)}</td>
            </tr>
          ))}
        </TableWrap>
      )}
    </Card>
  );
}

function PartnerLedgerSubTab() {
  const [partnerType, setPartnerType] = useState<"student" | "vendor" | "staff">("student");
  const [partnerName, setPartnerName] = useState("");
  const { data: rows = [], isLoading, refetch } = useQuery({
    queryKey: ["partner-ledger", partnerType, partnerName],
    queryFn: () => financeService.getPartnerLedger(partnerType, undefined, partnerName || undefined),
  });
  const list = rows as any[];
  const runningTotal = list.length > 0 ? list[list.length - 1].runningBalance : 0;

  return (
    <Card>
      <CardHeader
        title={partnerType === "student" ? "Student / Parent Ledger" : partnerType === "vendor" ? "Supplier Ledger" : "Staff Ledger"}
        sub="Derived from the same journal postings, filtered to one counterparty — this is what an auditor asks for first"
        actions={
          <div className="flex gap-2">
            <FSelect value={partnerType} onChange={e => setPartnerType(e.target.value as any)}>
              <option value="student">Students / Parents</option>
              <option value="vendor">Suppliers</option>
              <option value="staff">Staff</option>
            </FSelect>
            <SearchBar placeholder="Filter by name…" value={partnerName} onChange={setPartnerName} />
            <Btn onClick={() => refetch()}><RefreshCw size={13} /></Btn>
          </div>
        }
      />
      {isLoading ? (
        <div className="p-10 text-center text-slate-400 text-sm animate-pulse">Loading…</div>
      ) : list.length === 0 ? (
        <div className="p-10 text-center text-slate-400 text-sm">No postings for this partner type yet.</div>
      ) : (
        <>
          <TableWrap headers={["Date", "Entry #", "Account", "Narration", "Debit", "Credit", "Running Balance"]}>
            {list.map((r: any, i: number) => (
              <tr key={i}>
                <td className="px-4 py-2.5 text-xs text-slate-500">{new Date(r.date).toLocaleDateString()}</td>
                <td className="px-4 py-2.5 text-xs font-mono text-slate-500">{r.entryNo}</td>
                <td className="px-4 py-2.5 text-xs text-slate-500">{r.accountName}</td>
                <td className="px-4 py-2.5 text-sm text-slate-700">{r.narration} — <span className="font-medium">{r.partnerName}</span></td>
                <td className="px-4 py-2.5 text-sm text-right">{r.debit > 0 ? money(r.debit) : "—"}</td>
                <td className="px-4 py-2.5 text-sm text-right">{r.credit > 0 ? money(r.credit) : "—"}</td>
                <td className="px-4 py-2.5 text-sm text-right font-semibold">{money(r.runningBalance)}</td>
              </tr>
            ))}
          </TableWrap>
          <div className="px-5 py-3 border-t border-slate-100 text-sm font-semibold text-slate-700 flex justify-end">
            Net balance: {money(runningTotal)}
          </div>
        </>
      )}
    </Card>
  );
}

function JournalEntriesSubTab() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["journal-entries"], queryFn: () => financeService.getJournalEntries({ limit: 50 }) });
  const entries = ((data as any)?.data || []) as any[];
  const [expanded, setExpanded] = useState<string | null>(null);

  const saveTemplateMut = useMutation({
    mutationFn: ({ id, templateName }: { id: string; templateName: string }) => financeService.saveJournalEntryAsTemplate(id, templateName),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["journal-templates"] }); toast.success("Saved as a Journal Entry Template — find it in Ledger → Accounting Setup"); },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to save as template"),
  });

  function saveAsTemplate(e: any) {
    const templateName = window.prompt(`Save "${e.narration || e.entryNo}" as a reusable template. Template name:`, e.narration || "");
    if (templateName) saveTemplateMut.mutate({ id: e._id, templateName });
  }

  const SOURCE_LABEL: Record<string, string> = {
    fee_invoice: "Fee Invoice", fee_payment: "Fee Payment", expense: "Expense",
    payroll: "Payroll", expense_claim: "Expense Claim", advance: "Advance",
    vendor_bill: "Vendor Bill", vendor_payment: "Vendor Payment", manual: "Manual",
    year_end_closing: "Year-End Closing",
  };

  return (
    <Card>
      <CardHeader title="Journal Entries" sub="Every double-entry posting in the system, most recent first — click a row to see its lines" />
      {isLoading ? (
        <div className="p-10 text-center text-slate-400 text-sm animate-pulse">Loading…</div>
      ) : entries.length === 0 ? (
        <div className="p-10 text-center text-slate-400 text-sm">No journal entries posted yet.</div>
      ) : (
        <TableWrap headers={["Date", "Entry #", "Source", "Narration", "Debit", "Credit"]}>
          {entries.map((e: any) => (
            <Fragment key={e._id}>
              <tr className="cursor-pointer hover:bg-slate-50" onClick={() => setExpanded(expanded === e._id ? null : e._id)}>
                <td className="px-4 py-2.5 text-xs text-slate-500">{new Date(e.date).toLocaleDateString()}</td>
                <td className="px-4 py-2.5 text-xs font-mono text-slate-500">{e.entryNo}</td>
                <td className="px-4 py-2.5 text-xs"><Badge v="blue">{SOURCE_LABEL[e.sourceType] || e.sourceType}</Badge></td>
                <td className="px-4 py-2.5 text-sm text-slate-700">{e.narration}</td>
                <td className="px-4 py-2.5 text-sm text-right">{money(e.totalDebit)}</td>
                <td className="px-4 py-2.5 text-sm text-right">{money(e.totalCredit)}</td>
              </tr>
              {expanded === e._id && (
                <tr>
                  <td colSpan={6} className="bg-slate-50 px-4 py-3">
                    <div className="flex justify-end mb-2">
                      <Btn onClick={() => saveAsTemplate(e)}>
                        {saveTemplateMut.isPending ? "Saving…" : "Save as Template"}
                      </Btn>
                    </div>
                    <table className="w-full text-xs">
                      <thead><tr className="text-slate-400"><th className="text-left py-1">Account</th><th className="text-left py-1">Partner</th><th className="text-right py-1">Debit</th><th className="text-right py-1">Credit</th></tr></thead>
                      <tbody>
                        {(e.lines || []).map((l: any, i: number) => (
                          <tr key={i} className="border-t border-slate-100">
                            <td className="py-1.5">{l.accountCode} — {l.accountName}{l.isUnmapped && <span className="ml-1 text-amber-500">(unmapped → suspense)</span>}</td>
                            <td className="py-1.5 text-slate-500">{l.partnerName || '—'}</td>
                            <td className="py-1.5 text-right">{l.debit > 0 ? money(l.debit) : '—'}</td>
                            <td className="py-1.5 text-right">{l.credit > 0 ? money(l.credit) : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </TableWrap>
      )}
    </Card>
  );
}

// ─── PHASE 5: CURRENCIES CARD ──────────────────────────────────────────────────
const BLANK_CURRENCY = { code: "", name: "", symbol: "" };

function CurrenciesCard() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(BLANK_CURRENCY);
  const { data: currencies = [], isLoading } = useQuery({ queryKey: ["currencies"], queryFn: () => financeService.getCurrencies() });

  const seedMut = useMutation({
    mutationFn: () => financeService.seedCurrencies(),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["currencies"] }); toast.success("Common currencies created (PKR set as base)"); },
    onError: () => toast.error("Failed to seed currencies"),
  });
  const createMut = useMutation({
    mutationFn: financeService.createCurrency,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["currencies"] }); toast.success("Currency created"); setShowModal(false); setForm(BLANK_CURRENCY); },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to create currency"),
  });
  const setBaseMut = useMutation({
    mutationFn: (id: string) => financeService.setBaseCurrency(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["currencies"] }); toast.success("Base currency updated"); },
    onError: () => toast.error("Failed to set base currency"),
  });

  function save() {
    if (!form.code || !form.name) { toast.error("Code and name are required"); return; }
    createMut.mutate({ ...form, code: form.code.toUpperCase() });
  }

  return (
    <Card>
      <CardHeader
        title="Currencies"
        sub="Optional, additive — a school that never touches this keeps operating implicitly in PKR exactly as before. Exactly one currency is marked Base; foreign-currency invoices/bills convert into it at posting time."
        actions={
          <div className="flex items-center gap-2">
            <Btn onClick={() => seedMut.mutate()}>{seedMut.isPending ? "Seeding…" : "Seed Common Currencies"}</Btn>
            <Btn variant="primary" onClick={() => { setForm(BLANK_CURRENCY); setShowModal(true); }}><Plus size={12} /> New Currency</Btn>
          </div>
        }
      />
      <TableWrap headers={["Code", "Name", "Symbol", "Decimals", "Base", "Status", "Actions"]}>
        {isLoading ? (
          <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400 text-sm">Loading…</td></tr>
        ) : (currencies as any[]).length === 0 ? (
          <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400 text-sm">No currencies configured yet — every transaction is implicitly in PKR. Click "Seed Common Currencies" to get started.</td></tr>
        ) : (currencies as any[]).map((c: any) => (
          <tr key={c._id} className="hover:bg-slate-50">
            <td className="px-4 py-2.5 text-xs font-mono font-bold text-slate-700">{c.code}</td>
            <td className="px-4 py-2.5 text-sm font-medium text-slate-800">{c.name}</td>
            <td className="px-4 py-2.5 text-sm text-slate-500">{c.symbol || "—"}</td>
            <td className="px-4 py-2.5 text-xs text-slate-500">{c.decimalPlaces ?? 2}</td>
            <td className="px-4 py-2.5">{c.isBaseCurrency && <Badge v="blue">Base</Badge>}</td>
            <td className="px-4 py-2.5"><Badge v={c.isActive === false ? "gray" : "green"}>{c.isActive === false ? "Inactive" : "Active"}</Badge></td>
            <td className="px-4 py-2.5">
              {!c.isBaseCurrency && (
                <Btn onClick={() => setBaseMut.mutate(c._id)}>{setBaseMut.isPending ? "…" : "Set as Base"}</Btn>
              )}
            </td>
          </tr>
        ))}
      </TableWrap>

      {showModal && (
        <Modal title="New Currency" onClose={() => setShowModal(false)}>
          <div className="grid grid-cols-2 gap-4">
            <FField label="Code (ISO 4217)" required>
              <FInput value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="e.g. USD" maxLength={3} />
            </FField>
            <FField label="Name" required>
              <FInput value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. US Dollar" />
            </FField>
            <FField label="Symbol">
              <FInput value={form.symbol} onChange={e => setForm(f => ({ ...f, symbol: e.target.value }))} placeholder="e.g. $" />
            </FField>
          </div>
          <ModalFooter onCancel={() => setShowModal(false)} onSave={save} saveLabel={createMut.isPending ? "Saving…" : "Create"} />
        </Modal>
      )}
    </Card>
  );
}

// ─── PHASE 5: EXCHANGE RATES CARD ──────────────────────────────────────────────
const BLANK_RATE = { fromCurrency: "", rate: "", rateDate: new Date().toISOString().slice(0, 10), source: "manual" };

function ExchangeRatesCard() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(BLANK_RATE);
  const { data: currencies = [] } = useQuery({ queryKey: ["currencies"], queryFn: () => financeService.getCurrencies() });
  const { data: rates = [], isLoading } = useQuery({ queryKey: ["exchange-rates"], queryFn: () => financeService.getExchangeRates() });

  const baseCurrency = (currencies as any[]).find(c => c.isBaseCurrency);
  const foreignCurrencies = (currencies as any[]).filter(c => !c.isBaseCurrency && c.isActive !== false);

  const createMut = useMutation({
    mutationFn: financeService.createExchangeRate,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["exchange-rates"] }); toast.success("Exchange rate recorded"); setShowModal(false); setForm(BLANK_RATE); },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to record rate"),
  });

  function save() {
    if (!form.fromCurrency || !form.rate) { toast.error("Currency and rate are required"); return; }
    createMut.mutate({
      fromCurrency: form.fromCurrency,
      toCurrency: baseCurrency?.code || "PKR",
      rate: Number(form.rate),
      rateDate: form.rateDate,
      source: form.source || "manual",
    });
  }

  return (
    <Card>
      <CardHeader
        title="Exchange Rates"
        sub={`Point-in-time rates against the base currency (${baseCurrency?.code || "PKR"}) — units of base per 1 unit of the foreign currency. Postings use the most recent rate on/before the transaction date; missing rates degrade gracefully to 1.0 rather than blocking anything.`}
        actions={<Btn variant="primary" onClick={() => { setForm(BLANK_RATE); setShowModal(true); }}><Plus size={12} /> New Rate</Btn>}
      />
      <TableWrap headers={["Date", "From", "To", "Rate", "Source"]}>
        {isLoading ? (
          <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-sm">Loading…</td></tr>
        ) : (rates as any[]).length === 0 ? (
          <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-sm">No exchange rates recorded yet.</td></tr>
        ) : (rates as any[]).slice(0, 30).map((r: any) => (
          <tr key={r._id} className="hover:bg-slate-50">
            <td className="px-4 py-2.5 text-xs text-slate-500">{new Date(r.rateDate).toLocaleDateString()}</td>
            <td className="px-4 py-2.5 text-xs font-mono font-bold text-slate-700">{r.fromCurrency}</td>
            <td className="px-4 py-2.5 text-xs font-mono text-slate-500">{r.toCurrency}</td>
            <td className="px-4 py-2.5 text-sm font-semibold">{r.rate}</td>
            <td className="px-4 py-2.5 text-xs text-slate-400">{r.source || "—"}</td>
          </tr>
        ))}
      </TableWrap>

      {showModal && (
        <Modal title="New Exchange Rate" onClose={() => setShowModal(false)}>
          <div className="grid grid-cols-2 gap-4">
            <FField label="From Currency" required>
              <FSelect value={form.fromCurrency} onChange={e => setForm(f => ({ ...f, fromCurrency: e.target.value }))}>
                <option value="">Select…</option>
                {foreignCurrencies.map((c: any) => <option key={c.code} value={c.code}>{c.code} — {c.name}</option>)}
              </FSelect>
            </FField>
            <FField label={`Rate (${baseCurrency?.code || "PKR"} per unit)`} required>
              <FInput type="number" step="0.0001" value={form.rate} onChange={e => setForm(f => ({ ...f, rate: e.target.value }))} placeholder="e.g. 280.50" />
            </FField>
            <FField label="Rate Date">
              <FInput type="date" value={form.rateDate} onChange={e => setForm(f => ({ ...f, rateDate: e.target.value }))} />
            </FField>
            <FField label="Source">
              <FInput value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} placeholder="e.g. manual, SBP" />
            </FField>
          </div>
          <ModalFooter onCancel={() => setShowModal(false)} onSave={save} saveLabel={createMut.isPending ? "Saving…" : "Record Rate"} />
        </Modal>
      )}
    </Card>
  );
}

// ─── PHASE 8: OPENING BALANCES CARD ────────────────────────────────────────────
const BLANK_OPENING_BALANCE = { accountCode: "", fiscalYearId: "", amount: "" };

function OpeningBalancesCard() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(BLANK_OPENING_BALANCE);
  const { data: coa = [] } = useQuery({ queryKey: ["coa"], queryFn: () => financeService.getCOA() });
  const { data: fiscalYears = [] } = useQuery({ queryKey: ["fiscal-years"], queryFn: () => financeService.getFiscalYears() });
  const { data: balances = [], isLoading } = useQuery({ queryKey: ["opening-balances"], queryFn: () => financeService.getOpeningBalances() });

  const setMut = useMutation({
    mutationFn: financeService.setOpeningBalance,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["opening-balances"] }); qc.invalidateQueries({ queryKey: ["trial-balance"] }); toast.success("Opening balance set"); setShowModal(false); setForm(BLANK_OPENING_BALANCE); },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to set opening balance"),
  });

  function save() {
    if (!form.accountCode || !form.fiscalYearId || form.amount === "") { toast.error("Account, fiscal year, and amount are required"); return; }
    setMut.mutate({ accountCode: form.accountCode, fiscalYearId: form.fiscalYearId, amount: Number(form.amount) });
  }

  const fyById = new Map((fiscalYears as any[]).map((fy: any) => [fy._id, fy.name]));

  return (
    <Card>
      <CardHeader
        title="Opening Balances"
        sub="Per-account, per-fiscal-year opening balance — feeds directly into the Trial Balance for that year. Defaults to 0 until set."
        actions={<Btn variant="primary" onClick={() => { setForm(BLANK_OPENING_BALANCE); setShowModal(true); }}><Plus size={12} /> Set Opening Balance</Btn>}
      />
      <TableWrap headers={["Account", "Fiscal Year", "Amount"]}>
        {isLoading ? (
          <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-400 text-sm">Loading…</td></tr>
        ) : (balances as any[]).length === 0 ? (
          <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-400 text-sm">No opening balances set — every account starts at 0 for every fiscal year until set here.</td></tr>
        ) : (balances as any[]).map((b: any) => (
          <tr key={b._id} className="hover:bg-slate-50">
            <td className="px-4 py-2.5 text-sm font-medium">{b.accountCode} — {b.accountName}</td>
            <td className="px-4 py-2.5 text-xs text-slate-500">{fyById.get(b.fiscalYearId) || b.fiscalYearId}</td>
            <td className="px-4 py-2.5 text-sm text-right font-semibold">{money(b.amount)}</td>
          </tr>
        ))}
      </TableWrap>

      {showModal && (
        <Modal title="Set Opening Balance" onClose={() => setShowModal(false)}>
          <div className="grid grid-cols-2 gap-4">
            <FField label="Account" required>
              <FSelect value={form.accountCode} onChange={e => setForm(f => ({ ...f, accountCode: e.target.value }))}>
                <option value="">Select…</option>
                {(coa as any[]).map((a: any) => <option key={a._id} value={a.code}>{a.code} — {a.name}</option>)}
              </FSelect>
            </FField>
            <FField label="Fiscal Year" required>
              <FSelect value={form.fiscalYearId} onChange={e => setForm(f => ({ ...f, fiscalYearId: e.target.value }))}>
                <option value="">Select…</option>
                {(fiscalYears as any[]).map((fy: any) => <option key={fy._id} value={fy._id}>{fy.name}</option>)}
              </FSelect>
            </FField>
            <FField label="Amount" required>
              <FInput type="number" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" />
            </FField>
          </div>
          <ModalFooter onCancel={() => setShowModal(false)} onSave={save} saveLabel={setMut.isPending ? "Saving…" : "Save"} />
        </Modal>
      )}
    </Card>
  );
}

// ─── PHASE 8: ACCOUNTING DIMENSIONS CARD ───────────────────────────────────────
function DimensionsCard() {
  const qc = useQueryClient();
  const [showDimModal, setShowDimModal] = useState(false);
  const [showValueModal, setShowValueModal] = useState<string | null>(null);
  const [dimName, setDimName] = useState("");
  const [valueForm, setValueForm] = useState({ code: "", name: "" });
  const { data: dimensions = [], isLoading } = useQuery({ queryKey: ["dimensions"], queryFn: () => financeService.getDimensions() });

  const createDimMut = useMutation({
    mutationFn: (name: string) => financeService.createDimension({ name }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["dimensions"] }); toast.success("Dimension created"); setShowDimModal(false); setDimName(""); },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to create dimension"),
  });
  const createValueMut = useMutation({
    mutationFn: ({ dimensionId, payload }: { dimensionId: string; payload: any }) => financeService.createDimensionValue(dimensionId, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["dimension-values"] }); toast.success("Value added"); setShowValueModal(null); setValueForm({ code: "", name: "" }); },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to add value"),
  });

  return (
    <Card>
      <CardHeader
        title="Accounting Dimensions"
        sub='Generalized tagging beyond Cost Center (which remains the primary dimension) — e.g. "Grant", "Project", "Funding Source". Optional, additive infrastructure for future reporting needs.'
        actions={<Btn variant="primary" onClick={() => { setDimName(""); setShowDimModal(true); }}><Plus size={12} /> New Dimension</Btn>}
      />
      {isLoading ? (
        <div className="p-6 text-center text-slate-400 text-sm">Loading…</div>
      ) : (dimensions as any[]).length === 0 ? (
        <div className="p-6 text-center text-slate-400 text-sm">No dimensions defined yet — Cost Center already covers most reporting needs; add one here only if you need a second dimension (e.g. Grant tracking).</div>
      ) : (
        <div className="divide-y divide-slate-50">
          {(dimensions as any[]).map((d: any) => (
            <DimensionRow key={d._id} dimension={d} onAddValue={() => { setValueForm({ code: "", name: "" }); setShowValueModal(d._id); }} />
          ))}
        </div>
      )}

      {showDimModal && (
        <Modal title="New Accounting Dimension" onClose={() => setShowDimModal(false)}>
          <FField label="Name" required>
            <FInput value={dimName} onChange={e => setDimName(e.target.value)} placeholder='e.g. "Grant"' />
          </FField>
          <ModalFooter onCancel={() => setShowDimModal(false)} onSave={() => dimName ? createDimMut.mutate(dimName) : toast.error("Name is required")} saveLabel={createDimMut.isPending ? "Saving…" : "Create"} />
        </Modal>
      )}

      {showValueModal && (
        <Modal title="New Dimension Value" onClose={() => setShowValueModal(null)}>
          <div className="grid grid-cols-2 gap-4">
            <FField label="Code" required>
              <FInput value={valueForm.code} onChange={e => setValueForm(f => ({ ...f, code: e.target.value }))} placeholder="e.g. USAID-2026" />
            </FField>
            <FField label="Name" required>
              <FInput value={valueForm.name} onChange={e => setValueForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. USAID 2026 Grant" />
            </FField>
          </div>
          <ModalFooter
            onCancel={() => setShowValueModal(null)}
            onSave={() => {
              if (!valueForm.code || !valueForm.name) { toast.error("Code and name are required"); return; }
              createValueMut.mutate({ dimensionId: showValueModal, payload: valueForm });
            }}
            saveLabel={createValueMut.isPending ? "Saving…" : "Add Value"}
          />
        </Modal>
      )}
    </Card>
  );
}

function DimensionRow({ dimension, onAddValue }: { dimension: any; onAddValue: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const { data: values = [] } = useQuery({
    queryKey: ["dimension-values", dimension._id],
    queryFn: () => financeService.getDimensionValues(dimension._id),
    enabled: expanded,
  });
  return (
    <div className="px-5 py-3">
      <div className="flex items-center justify-between">
        <button onClick={() => setExpanded(e => !e)} className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <ChevronDown size={14} className={`transition-transform ${expanded ? "" : "-rotate-90"}`} />
          {dimension.name}
        </button>
        <Btn onClick={onAddValue}><Plus size={12} /> Add Value</Btn>
      </div>
      {expanded && (
        <div className="mt-2 ml-6 space-y-1">
          {(values as any[]).length === 0 ? (
            <p className="text-xs text-slate-400">No values yet.</p>
          ) : (values as any[]).map((v: any) => (
            <div key={v._id} className="text-xs text-slate-500 flex items-center gap-2">
              <span className="font-mono font-semibold text-slate-600">{v.code}</span>
              <span>{v.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── PHASE 8: JOURNAL ENTRY TEMPLATES CARD ─────────────────────────────────────
function JournalTemplatesCard() {
  const qc = useQueryClient();
  const [instantiating, setInstantiating] = useState<any | null>(null);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const { data: templates = [], isLoading } = useQuery({ queryKey: ["journal-templates"], queryFn: () => financeService.getJournalTemplates() });

  const instantiateMut = useMutation({
    mutationFn: () => financeService.instantiateJournalTemplate(instantiating._id, { date }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["journal-entries"] }); qc.invalidateQueries({ queryKey: ["trial-balance"] }); toast.success("Journal entry posted from template"); setInstantiating(null); },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to post from template"),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => financeService.deleteJournalTemplate(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["journal-templates"] }); toast.success("Template deleted"); },
    onError: () => toast.error("Failed to delete template"),
  });

  return (
    <Card>
      <CardHeader
        title="Journal Entry Templates"
        sub='Reusable entry shapes for recurring postings (e.g. monthly accruals) — save one from an existing entry in Journal Entries below, then "Use" it here to post a new dated instance.'
      />
      <TableWrap headers={["Template Name", "Lines", "Debit", "Credit", "Actions"]}>
        {isLoading ? (
          <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-sm">Loading…</td></tr>
        ) : (templates as any[]).length === 0 ? (
          <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-sm">No templates saved yet — expand an entry in Journal Entries and click "Save as Template".</td></tr>
        ) : (templates as any[]).map((t: any) => (
          <tr key={t._id} className="hover:bg-slate-50">
            <td className="px-4 py-2.5 text-sm font-medium">{t.templateName}</td>
            <td className="px-4 py-2.5 text-xs text-slate-500">{(t.lines || []).length}</td>
            <td className="px-4 py-2.5 text-sm text-right">{money(t.totalDebit)}</td>
            <td className="px-4 py-2.5 text-sm text-right">{money(t.totalCredit)}</td>
            <td className="px-4 py-2.5">
              <div className="flex items-center gap-2">
                <Btn onClick={() => { setDate(new Date().toISOString().slice(0, 10)); setInstantiating(t); }}>Use Template</Btn>
                <button onClick={() => { if (window.confirm(`Delete template "${t.templateName}"?`)) deleteMut.mutate(t._id); }} className="p-1.5 hover:bg-red-50 rounded-lg text-red-400 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </TableWrap>

      {instantiating && (
        <Modal title={`Post from Template: ${instantiating.templateName}`} onClose={() => setInstantiating(null)}>
          <FField label="Date" required>
            <FInput type="date" value={date} onChange={e => setDate(e.target.value)} />
          </FField>
          <p className="text-xs text-slate-400">Posts a new real journal entry using this template's account/amount shape, dated as selected.</p>
          <ModalFooter onCancel={() => setInstantiating(null)} onSave={() => instantiateMut.mutate()} saveLabel={instantiateMut.isPending ? "Posting…" : "Post Entry"} />
        </Modal>
      )}
    </Card>
  );
}

// ─── PHASE 8: TERMS & CONDITIONS TEMPLATES CARD ────────────────────────────────
const BLANK_TERMS_TEMPLATE = { name: "", content: "", appliesTo: "general", isDefault: false };
const TERMS_APPLIES_TO = [
  { id: "general", label: "General" },
  { id: "invoice", label: "Invoice" },
  { id: "fee_structure", label: "Fee Structure" },
  { id: "vendor_bill", label: "Vendor Bill" },
];

function TermsTemplatesCard() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState(BLANK_TERMS_TEMPLATE);
  const { data: templates = [], isLoading } = useQuery({ queryKey: ["terms-templates"], queryFn: () => financeService.getTermsTemplates() });

  const createMut = useMutation({
    mutationFn: financeService.createTermsTemplate,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["terms-templates"] }); toast.success("Terms template created"); closeModal(); },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to create template"),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => financeService.updateTermsTemplate(id, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["terms-templates"] }); toast.success("Terms template updated"); closeModal(); },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to update template"),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => financeService.deleteTermsTemplate(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["terms-templates"] }); toast.success("Terms template deleted"); },
    onError: () => toast.error("Failed to delete template"),
  });

  function closeModal() { setShowModal(false); setEditing(null); setForm(BLANK_TERMS_TEMPLATE); }
  function openNew() { setEditing(null); setForm(BLANK_TERMS_TEMPLATE); setShowModal(true); }
  function openEdit(t: any) { setEditing(t); setForm({ name: t.name, content: t.content, appliesTo: t.appliesTo, isDefault: !!t.isDefault }); setShowModal(true); }
  function save() {
    if (!form.name || !form.content) { toast.error("Name and content are required"); return; }
    if (editing) updateMut.mutate({ id: editing._id, payload: form });
    else createMut.mutate(form);
  }

  return (
    <Card>
      <CardHeader
        title="Terms & Conditions Templates"
        sub="Reusable T&C text — attachable to invoices and fee structures. Optional; nothing changes for invoices/fee structures that don't set one."
        actions={<Btn variant="primary" onClick={openNew}><Plus size={12} /> New Template</Btn>}
      />
      <TableWrap headers={["Name", "Applies To", "Default", "Status", "Actions"]}>
        {isLoading ? (
          <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-sm">Loading…</td></tr>
        ) : (templates as any[]).length === 0 ? (
          <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-sm">No terms templates yet.</td></tr>
        ) : (templates as any[]).map((t: any) => (
          <tr key={t._id} className="hover:bg-slate-50">
            <td className="px-4 py-2.5 text-sm font-medium">{t.name}</td>
            <td className="px-4 py-2.5 text-xs text-slate-500 capitalize">{(t.appliesTo || "").replace("_", " ")}</td>
            <td className="px-4 py-2.5">{t.isDefault && <Badge v="blue">Default</Badge>}</td>
            <td className="px-4 py-2.5"><Badge v={t.isActive === false ? "gray" : "green"}>{t.isActive === false ? "Inactive" : "Active"}</Badge></td>
            <td className="px-4 py-2.5">
              <div className="flex items-center gap-2">
                <button onClick={() => openEdit(t)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"><Edit size={14} /></button>
                <button onClick={() => { if (window.confirm(`Delete terms template "${t.name}"?`)) deleteMut.mutate(t._id); }} className="p-1.5 hover:bg-red-50 rounded-lg text-red-400 transition-colors"><Trash2 size={14} /></button>
              </div>
            </td>
          </tr>
        ))}
      </TableWrap>

      {showModal && (
        <Modal title={editing ? "Edit Terms Template" : "New Terms Template"} onClose={closeModal}>
          <div className="grid grid-cols-2 gap-4">
            <FField label="Name" required>
              <FInput value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Standard Tuition Invoice Terms" />
            </FField>
            <FField label="Applies To">
              <FSelect value={form.appliesTo} onChange={e => setForm(f => ({ ...f, appliesTo: e.target.value }))}>
                {TERMS_APPLIES_TO.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
              </FSelect>
            </FField>
          </div>
          <FField label="Content" required>
            <FTextarea rows={6} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Terms & conditions text (markdown supported)…" />
          </FField>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={form.isDefault} onChange={e => setForm(f => ({ ...f, isDefault: e.target.checked }))} />
            Set as default for this category
          </label>
          <ModalFooter onCancel={closeModal} onSave={save} saveLabel={(createMut.isPending || updateMut.isPending) ? "Saving…" : "Save"} />
        </Modal>
      )}
    </Card>
  );
}

// ─── PHASE 8: PAYMENT GATEWAY CARD (honest "not configured" state) ────────────
function PaymentGatewayCard() {
  const { data: config } = useQuery({ queryKey: ["payment-gateway-config"], queryFn: () => financeService.getPaymentGatewayConfig() });
  const configured = !!config?.isActive;
  return (
    <Card>
      <CardHeader title="Payment Gateway" sub="Online fee payment via a payment gateway (e.g. Stripe, JazzCash, Easypaisa)" />
      <div className="p-5">
        <div className="flex items-center gap-3">
          <Badge v={configured ? "green" : "gray"}>{configured ? `Configured — ${config.provider}` : "Not configured"}</Badge>
        </div>
        {!configured && (
          <p className="text-xs text-slate-400 mt-3">
            Contact your Eldermin account manager to enable online fee payment via a gateway such as Stripe, JazzCash, or Easypaisa.
            This is a separate workstream that depends on which gateway your school's bank/finance team chooses to integrate.
          </p>
        )}
      </div>
    </Card>
  );
}

function AccountingSetupSubTab() {
  const qc = useQueryClient();
  const { data: fiscalYears = [] } = useQuery({ queryKey: ["fiscal-years"], queryFn: () => financeService.getFiscalYears() });
  const { data: costCenters = [] } = useQuery({ queryKey: ["cost-centers"], queryFn: () => financeService.getCostCenters() });
  const { data: paymentTerms = [] } = useQuery({ queryKey: ["payment-terms"], queryFn: () => financeService.getPaymentTerms() });

  const seedCostCentersMut = useMutation({
    mutationFn: () => financeService.seedCostCenters(),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["cost-centers"] }); toast.success("Cost centers created from your campuses"); },
    onError: () => toast.error("Failed to seed cost centers"),
  });
  const seedTermsMut = useMutation({
    mutationFn: () => financeService.seedPaymentTerms(),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["payment-terms"] }); toast.success("Default payment terms created"); },
    onError: () => toast.error("Failed to seed payment terms"),
  });
  const closeFyMut = useMutation({
    mutationFn: (id: string) => financeService.closeFiscalYear(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fiscal-years"] });
      qc.invalidateQueries({ queryKey: ["trial-balance"] });
      qc.invalidateQueries({ queryKey: ["journal-entries"] });
      toast.success("Fiscal year closed — closing entry posted and all periods locked");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to close fiscal year"),
  });

  function closeFiscalYear(fy: any) {
    const ok = window.confirm(
      `Close "${fy.name}"?\n\nThis will POST A REAL CLOSING JOURNAL ENTRY — every Revenue and Expense account for this year will be zeroed out and the net profit/loss moved to Retained Earnings (3100). Every accounting period in this year will also be locked so nothing can be back-posted into it.\n\nThis cannot be undone from this screen. Continue?`
    );
    if (ok) closeFyMut.mutate(fy._id);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title="Fiscal Years" sub="Postings auto-create a fiscal year (July–June) the first time they're needed if none exists" />
        {(fiscalYears as any[]).length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-sm">No fiscal year configured yet — one will be created automatically the first time something posts to the ledger.</div>
        ) : (
          <TableWrap headers={["Name", "Start", "End", "Status", "Actions"]}>
            {(fiscalYears as any[]).map((fy: any) => (
              <tr key={fy._id}>
                <td className="px-4 py-2.5 text-sm font-medium">{fy.name}</td>
                <td className="px-4 py-2.5 text-xs text-slate-500">{new Date(fy.startDate).toLocaleDateString()}</td>
                <td className="px-4 py-2.5 text-xs text-slate-500">{new Date(fy.endDate).toLocaleDateString()}</td>
                <td className="px-4 py-2.5"><Badge v={fy.isClosed ? "gray" : "green"}>{fy.isClosed ? "Closed" : "Open"}</Badge></td>
                <td className="px-4 py-2.5">
                  {!fy.isClosed && (
                    <Btn variant="danger" onClick={() => closeFiscalYear(fy)}>{closeFyMut.isPending ? "Closing…" : "Close Year"}</Btn>
                  )}
                </td>
              </tr>
            ))}
          </TableWrap>
        )}
      </Card>

      <OpeningBalancesCard />
      <DimensionsCard />
      <JournalTemplatesCard />
      <TermsTemplatesCard />
      <PaymentGatewayCard />

      <Card>
        <CardHeader title="Cost Centers" sub="The dimension every journal line can be tagged with for spend-by-campus/department reporting"
          actions={<Btn onClick={() => seedCostCentersMut.mutate()}>{seedCostCentersMut.isPending ? "Seeding…" : "Seed from Campuses"}</Btn>} />
        {(costCenters as any[]).length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-sm">No cost centers yet — click "Seed from Campuses" to create one per existing campus.</div>
        ) : (
          <TableWrap headers={["Code", "Name", "Type"]}>
            {(costCenters as any[]).map((c: any) => (
              <tr key={c._id}>
                <td className="px-4 py-2.5 text-xs font-mono text-slate-500">{c.code}</td>
                <td className="px-4 py-2.5 text-sm font-medium">{c.name}</td>
                <td className="px-4 py-2.5 text-xs text-slate-400 capitalize">{c.type}</td>
              </tr>
            ))}
          </TableWrap>
        )}
      </Card>

      <Card>
        <CardHeader title="Payment Terms" sub="Used for fee invoice and vendor bill due-date calculation"
          actions={<Btn onClick={() => seedTermsMut.mutate()}>{seedTermsMut.isPending ? "Seeding…" : "Seed Defaults"}</Btn>} />
        {(paymentTerms as any[]).length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-sm">No payment terms yet — click "Seed Defaults" for Due on Receipt / Net 15 / Net 30.</div>
        ) : (
          <TableWrap headers={["Name", "Due Days", "Default"]}>
            {(paymentTerms as any[]).map((t: any) => (
              <tr key={t._id}>
                <td className="px-4 py-2.5 text-sm font-medium">{t.name}</td>
                <td className="px-4 py-2.5 text-sm text-slate-500">{t.dueDays}</td>
                <td className="px-4 py-2.5">{t.isDefault && <Badge v="blue">Default</Badge>}</td>
              </tr>
            ))}
          </TableWrap>
        )}
      </Card>

      <CurrenciesCard />
      <ExchangeRatesCard />
    </div>
  );
}

// ─── PHASE 3: TAX SUMMARY REPORT ───────────────────────────────────────────────
function TaxSummarySubTab() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["tax-summary", from, to],
    queryFn: () => financeService.getTaxSummaryReport(from || undefined, to || undefined),
  });
  const result = (data || { salesTaxCollected: 0, inputTaxRecoverable: 0, withholdingDeducted: 0, breakdown: [] }) as any;
  const fmt = (n: number) => (n || 0).toLocaleString();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title="Tax Summary"
          sub="Sales tax collected, purchase (input) tax recoverable, and withholding deducted — sourced from posted journal lines, not a side calculation"
          actions={
            <div className="flex items-center gap-2">
              <div className="w-36"><FInput type="date" value={from} onChange={e => setFrom(e.target.value)} /></div>
              <span className="text-slate-400 text-xs">to</span>
              <div className="w-36"><FInput type="date" value={to} onChange={e => setTo(e.target.value)} /></div>
              <Btn onClick={() => refetch()}><RefreshCw size={12} /> Apply</Btn>
            </div>
          }
        />
      </Card>
      {isLoading ? (
        <div className="p-10 text-center text-slate-400 text-sm animate-pulse">Loading…</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KPI icon={Percent} label="Sales Tax Collected" value={`₨ ${fmt(result.salesTaxCollected)}`} sub="Tax Payable (2400)" color={VIZ_SERIES[0]} />
            <KPI icon={Percent} label="Input Tax Recoverable" value={`₨ ${fmt(result.inputTaxRecoverable)}`} sub="Purchase Tax Receivable (1400)" color={VIZ_SERIES[1]} />
            <KPI icon={Percent} label="Withholding Deducted" value={`₨ ${fmt(result.withholdingDeducted)}`} sub="Withholding Tax Payable (2500)" color={VIZ_SERIES[2]} />
          </div>
          <Card>
            <CardHeader title="Breakdown by Tax Template" sub="Net amount posted per tax template / withholding category within the selected range" />
            {(result.breakdown || []).length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-sm">No tax postings yet — configure Tax Templates under Ledger → Taxes, or none have been triggered in this range.</div>
            ) : (
              <TableWrap headers={["Tax Template", "Account", "Amount"]}>
                {(result.breakdown as any[]).map((b, i) => (
                  <tr key={i}>
                    <td className="px-4 py-2.5 text-sm font-medium text-slate-800">{b.taxTemplateName}</td>
                    <td className="px-4 py-2.5 text-xs font-mono text-slate-500">{b.accountCode}</td>
                    <td className="px-4 py-2.5 text-sm text-right font-semibold">₨ {fmt(b.amount)}</td>
                  </tr>
                ))}
              </TableWrap>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

// ─── PHASE 3: TAX SETUP — Tax Templates, Item Tax Templates, Tax Rules,
// Withholding Categories. See claude/finance-module-odoo-standard-build-plan.md.
// ─────────────────────────────────────────────────────────────────────────────
const BLANK_TAX_TEMPLATE = { name: "", type: "sales", rate: "", computationMethod: "percentage", accountCode: "" };
const BLANK_ITEM_TAX_TEMPLATE = { itemType: "", direction: "sales", taxTemplateId: "" };
const BLANK_TAX_RULE = { taxTemplateId: "", field: "campus", value: "", priority: "10" };
const BLANK_WITHHOLDING_CATEGORY = { name: "", rate: "", accountCode: "", appliesTo: "vendor" };

function TaxTemplatesCard({ coa }: { coa: any[] }) {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(BLANK_TAX_TEMPLATE);
  const { data: templates = [], isLoading } = useQuery({ queryKey: ["tax-templates"], queryFn: () => financeService.getTaxTemplates() });

  const createMutation = useMutation({
    mutationFn: financeService.createTaxTemplate,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tax-templates"] }); toast.success("Tax template created"); setShowModal(false); setForm(BLANK_TAX_TEMPLATE); },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to create tax template"),
  });
  const toggleMutation = useMutation({
    mutationFn: (vars: { id: string; isActive: boolean }) => financeService.updateTaxTemplate(vars.id, { isActive: vars.isActive }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tax-templates"] }); },
    onError: () => toast.error("Failed to update tax template"),
  });

  function save() {
    if (!form.name || !form.accountCode || !form.rate) { toast.error("Name, rate, and account are required"); return; }
    createMutation.mutate({ ...form, rate: Number(form.rate) });
  }

  return (
    <Card>
      <CardHeader
        title="Tax Templates"
        sub="Sales tax (fee invoices), purchase tax (vendor bills), and withholding — each posts to its own COA account instead of being a side calculation"
        actions={<Btn variant="primary" onClick={() => { setForm(BLANK_TAX_TEMPLATE); setShowModal(true); }}><Plus size={12} /> New Tax Template</Btn>}
      />
      <TableWrap headers={["Name", "Type", "Rate", "Method", "Account", "Status"]}>
        {isLoading ? (
          <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-sm">Loading…</td></tr>
        ) : (templates as any[]).length === 0 ? (
          <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-sm">No tax templates yet.</td></tr>
        ) : (templates as any[]).map((t: any) => (
          <tr key={t._id} className="hover:bg-slate-50">
            <td className="px-4 py-2.5 text-sm font-medium text-slate-800">{t.name}</td>
            <td className="px-4 py-2.5"><Badge v={t.type === "sales" ? "blue" : t.type === "purchase" ? "amber" : "gray"}>{t.type}</Badge></td>
            <td className="px-4 py-2.5 text-sm">{t.computationMethod === "fixed" ? `₨ ${t.rate}` : `${t.rate}%`}</td>
            <td className="px-4 py-2.5 text-xs text-slate-500 capitalize">{t.computationMethod}</td>
            <td className="px-4 py-2.5 text-xs font-mono text-slate-500">{t.accountCode}</td>
            <td className="px-4 py-2.5">
              <button onClick={() => toggleMutation.mutate({ id: t._id, isActive: !t.isActive })}>
                <Badge v={t.isActive === false ? "gray" : "green"}>{t.isActive === false ? "Inactive" : "Active"}</Badge>
              </button>
            </td>
          </tr>
        ))}
      </TableWrap>

      {showModal && (
        <Modal title="New Tax Template" onClose={() => setShowModal(false)}>
          <div className="grid grid-cols-2 gap-4">
            <FField label="Name" required>
              <FInput value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. GST 17%" />
            </FField>
            <FField label="Type" required>
              <FSelect value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                <option value="sales">Sales (fee invoices)</option>
                <option value="purchase">Purchase (vendor bills)</option>
                <option value="withholding">Withholding</option>
              </FSelect>
            </FField>
            <FField label="Computation Method">
              <FSelect value={form.computationMethod} onChange={e => setForm(f => ({ ...f, computationMethod: e.target.value }))}>
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </FSelect>
            </FField>
            <FField label={form.computationMethod === "fixed" ? "Amount (₨)" : "Rate (%)"} required>
              <FInput type="number" value={form.rate} onChange={e => setForm(f => ({ ...f, rate: e.target.value }))} />
            </FField>
            <div className="col-span-2">
              <FField label="Posts To Account" required>
                <FSelect value={form.accountCode} onChange={e => setForm(f => ({ ...f, accountCode: e.target.value }))}>
                  <option value="">Select account…</option>
                  {coa.map((a: any) => <option key={a.code} value={a.code}>{a.code} — {a.name}</option>)}
                </FSelect>
              </FField>
            </div>
          </div>
          <ModalFooter onCancel={() => setShowModal(false)} onSave={save} saveLabel={createMutation.isPending ? "Saving…" : "Create"} />
        </Modal>
      )}
    </Card>
  );
}

function ItemTaxTemplatesCard() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(BLANK_ITEM_TAX_TEMPLATE);
  const { data: items = [], isLoading } = useQuery({ queryKey: ["item-tax-templates"], queryFn: () => financeService.getItemTaxTemplates() });
  const { data: templates = [] } = useQuery({ queryKey: ["tax-templates"], queryFn: () => financeService.getTaxTemplates() });

  const createMutation = useMutation({
    mutationFn: financeService.createItemTaxTemplate,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["item-tax-templates"] }); toast.success("Item tax default created"); setShowModal(false); setForm(BLANK_ITEM_TAX_TEMPLATE); },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to create item tax default"),
  });

  function save() {
    if (!form.itemType || !form.taxTemplateId) { toast.error("Item type and tax template are required"); return; }
    createMutation.mutate(form);
  }

  const templateName = (id: string) => (templates as any[]).find(t => t._id === id)?.name || "—";

  return (
    <Card>
      <CardHeader
        title="Item Tax Templates"
        sub="Default tax auto-applied by item type — e.g. tuition/admission/transport on the sales side, an expense account on the purchase side — so invoices and bills don't need a manual tax lookup"
        actions={<Btn variant="primary" onClick={() => { setForm(BLANK_ITEM_TAX_TEMPLATE); setShowModal(true); }}><Plus size={12} /> New Default</Btn>}
      />
      <TableWrap headers={["Item Type", "Direction", "Tax Template"]}>
        {isLoading ? (
          <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-400 text-sm">Loading…</td></tr>
        ) : (items as any[]).length === 0 ? (
          <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-400 text-sm">No item tax defaults yet.</td></tr>
        ) : (items as any[]).map((it: any) => (
          <tr key={it._id} className="hover:bg-slate-50">
            <td className="px-4 py-2.5 text-sm font-medium text-slate-800">{it.itemType}</td>
            <td className="px-4 py-2.5"><Badge v={it.direction === "sales" ? "blue" : "amber"}>{it.direction}</Badge></td>
            <td className="px-4 py-2.5 text-sm text-slate-600">{it.taxTemplateId?.name || templateName(it.taxTemplateId)}</td>
          </tr>
        ))}
      </TableWrap>

      {showModal && (
        <Modal title="New Item Tax Default" onClose={() => setShowModal(false)}>
          <div className="grid grid-cols-2 gap-4">
            <FField label="Item Type" required>
              <FInput value={form.itemType} onChange={e => setForm(f => ({ ...f, itemType: e.target.value }))} placeholder="e.g. tuition, admission, transport" />
            </FField>
            <FField label="Direction" required>
              <FSelect value={form.direction} onChange={e => setForm(f => ({ ...f, direction: e.target.value }))}>
                <option value="sales">Sales</option>
                <option value="purchase">Purchase</option>
              </FSelect>
            </FField>
            <div className="col-span-2">
              <FField label="Tax Template" required>
                <FSelect value={form.taxTemplateId} onChange={e => setForm(f => ({ ...f, taxTemplateId: e.target.value }))}>
                  <option value="">Select…</option>
                  {(templates as any[]).filter(t => t.type === form.direction).map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                </FSelect>
              </FField>
            </div>
          </div>
          <ModalFooter onCancel={() => setShowModal(false)} onSave={save} saveLabel={createMutation.isPending ? "Saving…" : "Create"} />
        </Modal>
      )}
    </Card>
  );
}

function TaxRulesCard() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(BLANK_TAX_RULE);
  const { data: rules = [], isLoading } = useQuery({ queryKey: ["tax-rules"], queryFn: () => financeService.getTaxRules() });
  const { data: templates = [] } = useQuery({ queryKey: ["tax-templates"], queryFn: () => financeService.getTaxTemplates() });

  const createMutation = useMutation({
    mutationFn: financeService.createTaxRule,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tax-rules"] }); toast.success("Tax rule created"); setShowModal(false); setForm(BLANK_TAX_RULE); },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to create tax rule"),
  });

  function save() {
    if (!form.taxTemplateId || !form.field || !form.value) { toast.error("Tax template, field, and value are required"); return; }
    createMutation.mutate({
      taxTemplateId: form.taxTemplateId,
      condition: { field: form.field, operator: "eq", value: form.value },
      priority: Number(form.priority) || 10,
    });
  }

  return (
    <Card>
      <CardHeader
        title="Tax Rules"
        sub="A simple single-condition override checked in priority order (lower first) before falling back to the item default — e.g. 'campus = Main Campus is tax-exempt'"
        actions={<Btn variant="primary" onClick={() => { setForm(BLANK_TAX_RULE); setShowModal(true); }}><Plus size={12} /> New Rule</Btn>}
      />
      <TableWrap headers={["Priority", "Condition", "Tax Template", "Status"]}>
        {isLoading ? (
          <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400 text-sm">Loading…</td></tr>
        ) : (rules as any[]).length === 0 ? (
          <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400 text-sm">No tax rules yet — invoices/bills fall back to Item Tax Template defaults.</td></tr>
        ) : (rules as any[]).map((r: any) => (
          <tr key={r._id} className="hover:bg-slate-50">
            <td className="px-4 py-2.5 text-sm text-slate-600">{r.priority}</td>
            <td className="px-4 py-2.5 text-xs font-mono text-slate-500">{r.condition?.field} = "{r.condition?.value}"</td>
            <td className="px-4 py-2.5 text-sm text-slate-800">{r.taxTemplateId?.name || "—"}</td>
            <td className="px-4 py-2.5"><Badge v={r.isActive === false ? "gray" : "green"}>{r.isActive === false ? "Inactive" : "Active"}</Badge></td>
          </tr>
        ))}
      </TableWrap>

      {showModal && (
        <Modal title="New Tax Rule" onClose={() => setShowModal(false)}>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <FField label="Tax Template" required>
                <FSelect value={form.taxTemplateId} onChange={e => setForm(f => ({ ...f, taxTemplateId: e.target.value }))}>
                  <option value="">Select…</option>
                  {(templates as any[]).map(t => <option key={t._id} value={t._id}>{t.name} ({t.type})</option>)}
                </FSelect>
              </FField>
            </div>
            <FField label="Field" required>
              <FSelect value={form.field} onChange={e => setForm(f => ({ ...f, field: e.target.value }))}>
                <option value="grade">grade</option>
                <option value="campus">campus</option>
                <option value="vendorId">vendorId</option>
              </FSelect>
            </FField>
            <FField label="Value" required>
              <FInput value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} placeholder="e.g. Main Campus" />
            </FField>
            <FField label="Priority (lower runs first)">
              <FInput type="number" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} />
            </FField>
          </div>
          <ModalFooter onCancel={() => setShowModal(false)} onSave={save} saveLabel={createMutation.isPending ? "Saving…" : "Create"} />
        </Modal>
      )}
    </Card>
  );
}

function WithholdingCategoriesCard({ coa }: { coa: any[] }) {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(BLANK_WITHHOLDING_CATEGORY);
  const { data: categories = [], isLoading } = useQuery({ queryKey: ["withholding-categories"], queryFn: () => financeService.getWithholdingCategories() });

  const createMutation = useMutation({
    mutationFn: financeService.createWithholdingCategory,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["withholding-categories"] }); toast.success("Withholding category created"); setShowModal(false); setForm(BLANK_WITHHOLDING_CATEGORY); },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to create withholding category"),
  });

  function save() {
    if (!form.name || !form.rate || !form.accountCode) { toast.error("Name, rate, and account are required"); return; }
    createMutation.mutate({ ...form, rate: Number(form.rate) });
  }

  return (
    <Card>
      <CardHeader
        title="Withholding Tax Categories"
        sub="Attaches to a vendor (Payables → Vendors) rather than a transaction line — every payment to a tagged vendor withholds this % instead of paying it out in cash"
        actions={<Btn variant="primary" onClick={() => { setForm(BLANK_WITHHOLDING_CATEGORY); setShowModal(true); }}><Plus size={12} /> New Category</Btn>}
      />
      <TableWrap headers={["Name", "Rate", "Account", "Applies To", "Status"]}>
        {isLoading ? (
          <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-sm">Loading…</td></tr>
        ) : (categories as any[]).length === 0 ? (
          <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-sm">No withholding categories yet.</td></tr>
        ) : (categories as any[]).map((c: any) => (
          <tr key={c._id} className="hover:bg-slate-50">
            <td className="px-4 py-2.5 text-sm font-medium text-slate-800">{c.name}</td>
            <td className="px-4 py-2.5 text-sm">{c.rate}%</td>
            <td className="px-4 py-2.5 text-xs font-mono text-slate-500">{c.accountCode}</td>
            <td className="px-4 py-2.5 text-xs text-slate-500 capitalize">{c.appliesTo}</td>
            <td className="px-4 py-2.5"><Badge v={c.isActive === false ? "gray" : "green"}>{c.isActive === false ? "Inactive" : "Active"}</Badge></td>
          </tr>
        ))}
      </TableWrap>

      {showModal && (
        <Modal title="New Withholding Tax Category" onClose={() => setShowModal(false)}>
          <div className="grid grid-cols-2 gap-4">
            <FField label="Name" required>
              <FInput value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Services Withholding Tax" />
            </FField>
            <FField label="Rate (%)" required>
              <FInput type="number" value={form.rate} onChange={e => setForm(f => ({ ...f, rate: e.target.value }))} />
            </FField>
            <FField label="Applies To">
              <FSelect value={form.appliesTo} onChange={e => setForm(f => ({ ...f, appliesTo: e.target.value }))}>
                <option value="vendor">Vendor</option>
                <option value="staff">Staff</option>
                <option value="other">Other</option>
              </FSelect>
            </FField>
            <FField label="Posts To Account" required>
              <FSelect value={form.accountCode} onChange={e => setForm(f => ({ ...f, accountCode: e.target.value }))}>
                <option value="">Select account…</option>
                {coa.map((a: any) => <option key={a.code} value={a.code}>{a.code} — {a.name}</option>)}
              </FSelect>
            </FField>
          </div>
          <ModalFooter onCancel={() => setShowModal(false)} onSave={save} saveLabel={createMutation.isPending ? "Saving…" : "Create"} />
        </Modal>
      )}
    </Card>
  );
}

function TaxesSubTab() {
  const { data: coa = [] } = useQuery({ queryKey: ["coa"], queryFn: () => financeService.getCOA() });
  const liabilityAndAssetAccounts = (coa as any[]).filter(a => (a.type === "liability" || a.type === "asset") && a.isActive !== false);
  return (
    <div className="space-y-4">
      <TaxTemplatesCard coa={liabilityAndAssetAccounts} />
      <ItemTaxTemplatesCard />
      <TaxRulesCard />
      <WithholdingCategoriesCard coa={liabilityAndAssetAccounts} />
    </div>
  );
}

// Item 39 — Chart of Accounts, moved (not duplicated) out of Fee & Revenue's
// FeeRevenueTab into its own Ledger sub-tab, since COA management is a
// ledger/accounting concern, not a fee-pricing one. Every mutation, query,
// and modal below is copied verbatim from the old FeeRevenueTab location.
function ChartOfAccountsSubTab() {
  const queryClient = useQueryClient();
  const [acctSearch, setAcctSearch]   = useState("");
  const [showAcctModal, setShowAcctModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [editAcct, setEditAcct]       = useState<any | null>(null);
  const [bulkImportFile, setBulkImportFile] = useState<File | null>(null);
  const [bulkImportResult, setBulkImportResult] = useState<BulkImportResult | null>(null);
  const [acctForm, setAcctForm]       = useState<AcctForm>(BLANK_ACCT);

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
  const bulkImportAccounts = useMutation({
    mutationFn: (rows: any[]) => financeService.bulkImportCOA(rows),
    onSuccess: (res: BulkImportResult) => {
      queryClient.invalidateQueries({ queryKey: ["coa"] });
      setBulkImportResult(res);
      if (res.errors.length === 0) {
        toast.success(`Imported: ${res.created} created, ${res.updated} updated${res.warnings.length ? `, ${res.warnings.length} warning(s)` : ""}`);
      } else {
        toast.error(`Imported with ${res.errors.length} error(s) — see details below`);
      }
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Bulk import failed"),
  });

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
    setAcctForm({ code: a.code, name: a.name, type: ACCOUNT_TYPE_FROM_ENUM[a.type] || "", parent: a.parentCode || "", description: a.description || "", openingBalance: String(a.currentBalance ?? a.openingBalance ?? 0), currency: a.currencyCode || "PKR", status: a.isActive ? "Active" : "Inactive" });
    setEditAcct(a);
    setShowAcctModal(true);
  }
  function deleteAcct(id: string) {
    removeAccount.mutate(id);
  }
  function openBulkImportModal() {
    setBulkImportFile(null);
    setBulkImportResult(null);
    setShowBulkImportModal(true);
  }
  async function runBulkImport() {
    if (!bulkImportFile) return;
    const text = await bulkImportFile.text();
    const { rows, parseErrors } = csvRowsToCOAObjects(text);
    if (parseErrors.length > 0) {
      setBulkImportResult({ created: 0, updated: 0, errors: parseErrors.map(m => ({ row: 0, message: m })), warnings: [] });
      return;
    }
    if (rows.length === 0) {
      setBulkImportResult({ created: 0, updated: 0, errors: [{ row: 0, message: "No data rows found in file." }], warnings: [] });
      return;
    }
    bulkImportAccounts.mutate(rows);
  }
  function saveAcct() {
    if (!acctForm.code || !acctForm.name || !acctForm.type) return;
    const enumType = ACCOUNT_TYPE_TO_ENUM[acctForm.type];
    if (!enumType) { toast.error(`Unknown account type "${acctForm.type}"`); return; }
    if (editAcct) {
      // currentBalance is intentionally never sent here — it's maintained
      // exclusively by the ledger as transactions are recorded. Editing an
      // account is for fixing its name/type/parent/etc., not for
      // hand-editing its live running balance (the backend also now
      // rejects this field on update as a second line of defense).
      updateAccount.mutate({
        id: editAcct._id,
        payload: {
          code: acctForm.code,
          name: acctForm.name,
          description: acctForm.description,
          type: enumType,
          parentCode: acctForm.parent || null,
          currencyCode: acctForm.currency,
          isActive: acctForm.status === "Active",
        },
      });
    } else {
      addAccount.mutate({
        code: acctForm.code,
        name: acctForm.name,
        description: acctForm.description,
        type: enumType,
        parentCode: acctForm.parent || null,
        openingBalance: Number(acctForm.openingBalance) || 0,
        currentBalance: Number(acctForm.openingBalance) || 0,
        currencyCode: acctForm.currency,
        isActive: acctForm.status === "Active",
      });
    }
  }

  // Keyed by the actual backend enum values ('revenue', not 'income') —
  // this previously had no 'revenue' entry at all, so every Income-type
  // account silently fell back to the plain gray badge and displayed the
  // raw enum string instead of a friendly label.
  const typeColor: Record<string, string> = {
    asset: "bg-blue-50 text-blue-700",
    liability: "bg-red-50 text-red-700",
    revenue: "bg-emerald-50 text-emerald-700",
    expense: "bg-amber-50 text-amber-700",
    equity: "bg-purple-50 text-purple-700",
  };
  // The backend's seedDefaultCOA is safe to run any number of times — every
  // default account is an upsert that only fills in what's missing and
  // never touches an account a school has already customized. Gating the
  // button on "any account exists at all" permanently locked out any
  // school that created even one manual account before running the seed,
  // with no real way back short of deleting everything — which was wrong
  // advice, since re-seeding was never destructive. Just relabel based on
  // whether accounts already exist, and always allow it.
  const coaAlreadyApplied = (coaAccounts as any[]).length > 0;
  const seedButtonLabel = coaAlreadyApplied ? "Add Missing Standard Accounts" : "Seed Standard COA";

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPI icon={BookOpen}    label="Chart of Accounts" value={String((coaAccounts as any[]).length)} sub="Ledger accounts" color="#7c3aed" />
        <KPI icon={CheckCircle} label="Active Accounts"   value={String((coaAccounts as any[]).filter((a: any) => a.isActive).length)} sub="Currently postable" color="#10b981" />
        <KPI icon={AlertTriangle} label="Inactive Accounts" value={String((coaAccounts as any[]).filter((a: any) => !a.isActive).length)} sub="Deactivated" color="#EF9F27" />
      </div>
      <Card>
        <CardHeader
          title="Chart of Accounts"
          sub="General Ledger structure"
          actions={
            <>
              <SearchBar placeholder="Search account…" value={acctSearch} onChange={setAcctSearch} />
              <button
                onClick={() => applyStandard.mutate()}
                disabled={applyStandard.isPending}
                className="px-3 py-1.5 text-xs border rounded-lg font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap bg-white text-slate-700 hover:bg-slate-50 border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={12} /> {applyStandard.isPending ? "Seeding…" : seedButtonLabel}
              </button>
              <button
                onClick={openBulkImportModal}
                className="px-3 py-1.5 text-xs border rounded-lg font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap bg-white text-slate-700 hover:bg-slate-50 border-slate-200"
              >
                <Upload size={12} /> Bulk Import
              </button>
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
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${typeColor[a.type] ?? "bg-slate-100 text-slate-600"}`}>{ACCOUNT_TYPE_FROM_ENUM[a.type] || a.type}</span>
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
                {(() => {
                  const excluded = editAcct ? getDescendantCodes(editAcct.code, coaAccounts as any[]) : new Set<string>();
                  excluded.add(acctForm.code);
                  return (coaAccounts as any[]).filter((a: any) => !excluded.has(a.code)).map((a: any) => (
                    <option key={a.code} value={a.code}>{a.code} – {a.name}</option>
                  ));
                })()}
              </FSelect>
            </FField>
            {editAcct ? (
              <FField label="Current Balance (₨)">
                <div className="px-3 py-2 text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-lg">
                  {Number(acctForm.openingBalance || 0).toLocaleString()} — maintained automatically from posted transactions
                </div>
              </FField>
            ) : (
              <FField label="Opening Balance (₨)">
                <FInput type="number" placeholder="0" value={acctForm.openingBalance} onChange={e => setAcctForm(f => ({ ...f, openingBalance: e.target.value }))} />
              </FField>
            )}
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
          <ModalFooter
            onCancel={() => setShowAcctModal(false)}
            onSave={saveAcct}
            saving={editAcct ? updateAccount.isPending : addAccount.isPending}
            saveLabel={
              editAcct
                ? (updateAccount.isPending ? "Updating…" : "Update Account")
                : (addAccount.isPending ? "Adding…" : "Add Account")
            }
          />
        </Modal>
      )}

      {/* ── Bulk Import (CSV) Modal ── */}
      {showBulkImportModal && (
        <Modal title="Bulk Import Chart of Accounts" size="lg" onClose={() => setShowBulkImportModal(false)}>
          <div className="space-y-4">
            <p className="text-xs text-slate-500">
              Upload a CSV of your existing Chart of Accounts. Columns: <span className="font-mono">{COA_TEMPLATE_HEADERS.join(", ")}</span>.
              An account code that already exists will be updated in place (its running balance is left untouched); a new code creates a new account.
              Parent accounts don't need to appear before their children in the file.
            </p>
            <button onClick={downloadCOATemplate} className="text-xs font-medium text-[#0C447C] hover:underline flex items-center gap-1">
              <Download size={12} /> Download CSV template
            </button>
            <FField label="CSV File">
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={e => { setBulkImportFile(e.target.files?.[0] || null); setBulkImportResult(null); }}
                className="block w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-slate-200 file:text-xs file:font-medium file:bg-white hover:file:bg-slate-50"
              />
            </FField>
            {bulkImportResult && (
              <div className="border border-slate-200 rounded-lg p-3 text-xs space-y-2 max-h-64 overflow-y-auto">
                <div className="flex gap-4 font-semibold text-slate-700">
                  <span>Created: {bulkImportResult.created}</span>
                  <span>Updated: {bulkImportResult.updated}</span>
                  {bulkImportResult.warnings.length > 0 && <span className="text-amber-600">Warnings: {bulkImportResult.warnings.length}</span>}
                  {bulkImportResult.errors.length > 0 && <span className="text-red-600">Errors: {bulkImportResult.errors.length}</span>}
                </div>
                {bulkImportResult.warnings.map((w, i) => (
                  <div key={`w-${i}`} className="text-amber-700">Row {w.row}{w.code ? ` (${w.code})` : ""}: {w.message}</div>
                ))}
                {bulkImportResult.errors.map((e, i) => (
                  <div key={`e-${i}`} className="text-red-700">Row {e.row}{e.code ? ` (${e.code})` : ""}: {e.message}</div>
                ))}
              </div>
            )}
          </div>
          <ModalFooter
            onCancel={() => setShowBulkImportModal(false)}
            onSave={runBulkImport}
            saving={bulkImportAccounts.isPending}
            saveLabel={bulkImportAccounts.isPending ? "Importing…" : "Import"}
          />
        </Modal>
      )}
    </div>
  );
}

function LedgerTab() {
  const [sub, setSub] = useState<LedgerSubTab>("chart-of-accounts");
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Ledger</h1>
          <p className="text-sm text-slate-500 mt-0.5">The double-entry books behind every fee, payroll, and expense transaction — audit-grade, sourced from real postings</p>
        </div>
      </div>
      <div className="flex gap-1 border-b border-slate-200">
        {LEDGER_SUBTABS.map(t => (
          <button key={t.id} onClick={() => setSub(t.id)}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${sub === t.id ? "border-[#0C447C] text-[#0C447C]" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
            {t.label}
          </button>
        ))}
      </div>
      {sub === "chart-of-accounts" && <ChartOfAccountsSubTab />}
      {sub === "trial-balance" && <TrialBalanceSubTab />}
      {sub === "general-ledger" && <GeneralLedgerSubTab />}
      {sub === "partner-ledger" && <PartnerLedgerSubTab />}
      {sub === "journal" && <JournalEntriesSubTab />}
      {sub === "ar-aging" && <ArAgingSubTab />}
      {sub === "ap-aging" && <ApAgingSubTab />}
      {sub === "credit-balance" && <CreditBalanceSubTab />}
      {sub === "payment-period" && <PaymentPeriodSubTab />}
      {sub === "tax-summary" && <TaxSummarySubTab />}
      {sub === "fx-exposure" && <FxExposureSubTab />}
      {sub === "setup" && <AccountingSetupSubTab />}
      {sub === "taxes" && <TaxesSubTab />}
    </div>
  );
}

// ─── TAB: PAYMENT / RECEIPT VOUCHERS ────────────────────────────────────────
// Quick-entry feature, modeled directly on ERPNext's "Payment Entry" — ONE
// form covers both a Receipt (money in) and a Payment (money out), plus an
// internal Transfer, distinguished by Payment Type (the first field, since
// it drives every other field's smart default, exactly like ERPNext's own
// UX). Self-contained: only talks to financeService's voucher endpoints,
// plus read-only master-data lookups (COA, Cost Centers, Currencies, Tax
// Templates) and hrService.getStaff() for the Employee party picker — no
// shared state with any other tab in this file.

const PARTY_TYPES = [
  { id: "student", label: "Student" },
  { id: "family", label: "Family" },
  { id: "employee", label: "Employee" },
  { id: "vendor", label: "Vendor" },
  { id: "shareholder", label: "Shareholder" },
  { id: "other", label: "Other" },
];

const BLANK_VOUCHER = {
  paymentType: "receive" as "receive" | "pay" | "transfer",
  postingDate: new Date().toISOString().slice(0, 10),
  costCenterId: "",
  partyType: "student",
  partyId: "",
  partyName: "",
  paidFromAccountCode: "",
  paidToAccountCode: "",
  currencyCode: "",
  exchangeRate: "1",
  paidAmount: "",
  taxTemplateId: "",
  referenceNumber: "",
  referenceDate: "",
  remarks: "",
};

function voucherTypeBadge(paymentType: string) {
  if (paymentType === "receive") return <Badge v="green">Receive</Badge>;
  if (paymentType === "pay") return <Badge v="red">Pay</Badge>;
  return <Badge v="blue">Transfer</Badge>;
}

function NewVoucherModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ ...BLANK_VOUCHER });
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const { data: coa = [] } = useQuery({ queryKey: ["coa"], queryFn: () => financeService.getCOA() });
  const { data: costCenters = [] } = useQuery({ queryKey: ["cost-centers"], queryFn: financeService.getCostCenters });
  const { data: currencies = [] } = useQuery({ queryKey: ["currencies"], queryFn: financeService.getCurrencies });
  const { data: taxTemplates = [] } = useQuery({ queryKey: ["tax-templates"], queryFn: () => financeService.getTaxTemplates() });
  const { data: vendors = [] } = useQuery({ queryKey: ["vendors"], queryFn: financeService.getVendors, enabled: form.partyType === "vendor" });
  const { data: families = [] } = useQuery({ queryKey: ["families"], queryFn: () => familiesService.getFamilies(), enabled: form.partyType === "family" });
  const { data: staffList = [] } = useQuery({ queryKey: ["staff"], queryFn: hrService.getStaff, enabled: form.partyType === "employee" });

  const baseCurrency = (currencies as any[]).find(c => c.isBaseCurrency)?.code || "PKR";

  // Set the base currency default exactly once, when the Currencies list
  // first arrives (not on every render — the user may deliberately switch
  // to a foreign currency afterwards).
  useEffect(() => {
    if (!form.currencyCode && baseCurrency) setForm(f => ({ ...f, currencyCode: baseCurrency }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseCurrency]);

  // Smart defaults keyed off Payment Type, mirroring ERPNext: Receive
  // defaults Paid From = Receivable (1200), Paid To = Cash (1000); Pay
  // defaults Paid From = Cash (1000), Paid To = Payable (2000); Transfer
  // defaults Cash (1000) → Bank (1100). The user can always override via
  // the dropdowns below — these are just sensible starting points.
  function applyPaymentTypeDefaults(paymentType: string) {
    const byCode = (code: string) => (coa as any[]).find(a => a.code === code);
    let from = "", to = "";
    if (paymentType === "receive") { from = byCode("1200") ? "1200" : ""; to = byCode("1000") ? "1000" : ""; }
    else if (paymentType === "pay") { from = byCode("1000") ? "1000" : ""; to = byCode("2000") ? "2000" : ""; }
    else { from = byCode("1000") ? "1000" : ""; to = byCode("1100") ? "1100" : ""; }
    setForm(f => ({ ...f, paymentType: paymentType as any, paidFromAccountCode: from, paidToAccountCode: to }));
  }

  const partyReady = form.partyType === "shareholder" || form.partyType === "other"
    ? !!form.partyName
    : !!form.partyId;
  const { data: partyBalance } = useQuery({
    queryKey: ["voucher-party-balance", form.partyType, form.partyId, form.partyName],
    queryFn: () => financeService.getVoucherPartyBalance(form.partyType, form.partyId || undefined, form.partyName || undefined),
    enabled: partyReady,
  });

  const selectedTax = (taxTemplates as any[]).find(t => t._id === form.taxTemplateId);
  const amountNum = Number(form.paidAmount) || 0;
  const rateNum = Number(form.exchangeRate) || 1;
  const baseAmount = Math.round(amountNum * rateNum * 100) / 100;
  const previewTaxAmount = selectedTax
    ? (selectedTax.computationMethod === "fixed" ? selectedTax.rate : Math.round(baseAmount * selectedTax.rate) / 100)
    : 0;

  const createMutation = useMutation({
    mutationFn: (payload: any) => financeService.createVoucher(payload),
    onSuccess: (voucher: any) => {
      queryClient.invalidateQueries({ queryKey: ["vouchers"] });
      toast.success(`Voucher posted — ${voucher.voucherNo}`);
      onClose();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to post voucher"),
  });

  function save() {
    const e: Record<string, boolean> = {};
    if (!form.postingDate) e.postingDate = true;
    if (!form.paidFromAccountCode) e.paidFromAccountCode = true;
    if (!form.paidToAccountCode) e.paidToAccountCode = true;
    if (!partyReady) e.party = true;
    if (!amountNum || amountNum <= 0) e.paidAmount = true;
    setErrors(e);
    if (Object.keys(e).length) { toast.error("Fill in all required fields"); return; }

    createMutation.mutate({
      paymentType: form.paymentType,
      postingDate: form.postingDate,
      costCenterId: form.costCenterId || undefined,
      partyType: form.partyType,
      partyId: form.partyId || undefined,
      partyName: form.partyName || undefined,
      paidFromAccountCode: form.paidFromAccountCode,
      paidToAccountCode: form.paidToAccountCode,
      currencyCode: form.currencyCode || baseCurrency,
      exchangeRate: rateNum,
      paidAmount: amountNum,
      taxTemplateId: form.taxTemplateId || undefined,
      referenceNumber: form.referenceNumber || undefined,
      referenceDate: form.referenceDate || undefined,
      remarks: form.remarks || undefined,
    });
  }

  const errStyle = (key: string): React.CSSProperties =>
    errors[key] ? { borderColor: "#ef4444", boxShadow: "0 0 0 1px #ef4444" } : {};

  return (
    <Modal title="New Voucher" size="lg" onClose={onClose}>
      {/* Item 41 — clarifies scope: routine fee/salary transactions already
          have their own dedicated, purpose-built flows (Collect Fee posts
          the fee ledger automatically; Process Payroll posts payslips) —
          a Voucher is for everything else: vendor payments, refunds,
          advances, and other one-off entries. Student/Family/Employee party
          types stay available here for exactly those one-off cases (e.g. a
          fee refund or a staff advance) rather than routine billing. */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-800 mb-4">
        Use this for vendor payments, refunds, and other one-off entries. Routine fee collection posts automatically from <span className="font-semibold">Collect Fee</span> (Receivables), and salaries from <span className="font-semibold">Process Payroll</span> — no voucher needed for those.
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FField label="Payment Type" required>
          <FSelect value={form.paymentType} onChange={e => applyPaymentTypeDefaults(e.target.value)}>
            <option value="receive">Receive</option>
            <option value="pay">Pay</option>
            <option value="transfer">Transfer</option>
          </FSelect>
        </FField>
        <FField label="Posting Date" required>
          <FInput type="date" value={form.postingDate} style={errStyle("postingDate")}
            onChange={e => setForm(f => ({ ...f, postingDate: e.target.value }))} />
        </FField>

        <FField label="Branch / Cost Center">
          <FSelect value={form.costCenterId} onChange={e => setForm(f => ({ ...f, costCenterId: e.target.value }))}>
            <option value="">— None —</option>
            {(costCenters as any[]).map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </FSelect>
        </FField>
        <FField label="Party Type">
          <FSelect value={form.partyType}
            onChange={e => setForm(f => ({ ...f, partyType: e.target.value, partyId: "", partyName: "" }))}>
            {PARTY_TYPES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
          </FSelect>
        </FField>

        <div className="col-span-2">
          <FField label="Party" required>
            {form.partyType === "student" && (
              <StudentSelect
                value={form.partyId}
                onChange={(id, student) => setForm(f => ({ ...f, partyId: id, partyName: student ? `${student.firstName || ""} ${student.lastName || ""}`.trim() : "" }))}
              />
            )}
            {form.partyType === "family" && (
              <FSelect value={form.partyId} style={errStyle("party")}
                onChange={e => {
                  const fam = (families as any[]).find(x => x._id === e.target.value);
                  setForm(f => ({ ...f, partyId: e.target.value, partyName: fam ? (fam.primaryGuardianName || fam.familyCode) : "" }));
                }}>
                <option value="">Select family…</option>
                {(families as any[]).map(fam => <option key={fam._id} value={fam._id}>{fam.familyCode} — {fam.primaryGuardianName}</option>)}
              </FSelect>
            )}
            {form.partyType === "vendor" && (
              <FSelect value={form.partyId} style={errStyle("party")}
                onChange={e => {
                  const v = (vendors as any[]).find(x => x._id === e.target.value);
                  setForm(f => ({ ...f, partyId: e.target.value, partyName: v ? v.name : "" }));
                }}>
                <option value="">Select vendor…</option>
                {(vendors as any[]).map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
              </FSelect>
            )}
            {form.partyType === "employee" && (
              <FSelect value={form.partyId} style={errStyle("party")}
                onChange={e => {
                  const s = (staffList as any[]).find(x => x._id === e.target.value);
                  setForm(f => ({ ...f, partyId: e.target.value, partyName: s ? `${s.firstName || ""} ${s.lastName || ""}`.trim() : "" }));
                }}>
                <option value="">Select employee…</option>
                {(staffList as any[]).map(s => <option key={s._id} value={s._id}>{s.firstName} {s.lastName} ({s.employeeId})</option>)}
              </FSelect>
            )}
            {(form.partyType === "shareholder" || form.partyType === "other") && (
              <FInput placeholder="Enter name…" value={form.partyName} style={errStyle("party")}
                onChange={e => setForm(f => ({ ...f, partyName: e.target.value }))} />
            )}
          </FField>
        </div>

        {partyReady && (
          <div className="col-span-2 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 flex items-center justify-between">
            <span className="text-xs text-slate-500">Party Balance (before this voucher)</span>
            <span className="text-sm font-bold text-[#0C447C]">₨ {(partyBalance?.balance ?? 0).toLocaleString()}</span>
          </div>
        )}

        {/* Item 41 — "Paid From"/"Paid To" renamed to the standard
            accounting terms this actually is: the account credited (money
            left) and the account debited (money landed). The field names
            (paidFromAccountCode/paidToAccountCode) are left as-is — this is
            a labeling fix, not a schema migration; see Voucher schema. */}
        <FField label="Credit Account" required>
          <FSelect value={form.paidFromAccountCode} style={errStyle("paidFromAccountCode")}
            onChange={e => setForm(f => ({ ...f, paidFromAccountCode: e.target.value }))}>
            <option value="">Select account…</option>
            {(coa as any[]).filter(a => a.isActive !== false).map(a => <option key={a._id} value={a.code}>{a.code} — {a.name}</option>)}
          </FSelect>
          <p className="text-[10px] text-slate-400 mt-0.5">Where the money came from (credited) — e.g. the bank/cash account for a payment, or Accounts Receivable for a fee receipt.</p>
        </FField>
        <FField label="Debit Account" required>
          <FSelect value={form.paidToAccountCode} style={errStyle("paidToAccountCode")}
            onChange={e => setForm(f => ({ ...f, paidToAccountCode: e.target.value }))}>
            <option value="">Select account…</option>
            {(coa as any[]).filter(a => a.isActive !== false).map(a => <option key={a._id} value={a.code}>{a.code} — {a.name}</option>)}
          </FSelect>
          <p className="text-[10px] text-slate-400 mt-0.5">Where the money went (debited) — e.g. the vendor/payable account for a payment, or bank/cash for a receipt.</p>
        </FField>

        <FField label="Currency">
          <FSelect value={form.currencyCode} onChange={e => setForm(f => ({ ...f, currencyCode: e.target.value, exchangeRate: e.target.value === baseCurrency ? "1" : f.exchangeRate }))}>
            {(currencies as any[]).length === 0 && <option value={baseCurrency}>{baseCurrency}</option>}
            {(currencies as any[]).map(c => <option key={c._id} value={c.code}>{c.code}{c.isBaseCurrency ? " (base)" : ""}</option>)}
          </FSelect>
        </FField>
        {form.currencyCode && form.currencyCode !== baseCurrency && (
          <FField label="Exchange Rate">
            <FInput type="number" step="0.0001" value={form.exchangeRate}
              onChange={e => setForm(f => ({ ...f, exchangeRate: e.target.value }))} />
          </FField>
        )}

        <FField label="Amount" required>
          <FInput type="number" placeholder="0.00" value={form.paidAmount} style={errStyle("paidAmount")}
            onChange={e => setForm(f => ({ ...f, paidAmount: e.target.value }))} />
        </FField>
        <FField label="Taxes and Charges">
          <FSelect value={form.taxTemplateId} onChange={e => setForm(f => ({ ...f, taxTemplateId: e.target.value }))}>
            <option value="">— None —</option>
            {(taxTemplates as any[]).map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
          </FSelect>
          {selectedTax && <p className="text-xs text-slate-400 mt-1">Estimated tax: ₨ {previewTaxAmount.toLocaleString()}</p>}
        </FField>

        <FField label="Reference Number">
          <FInput value={form.referenceNumber} onChange={e => setForm(f => ({ ...f, referenceNumber: e.target.value }))} />
        </FField>
        <FField label="Reference Date">
          <FInput type="date" value={form.referenceDate} onChange={e => setForm(f => ({ ...f, referenceDate: e.target.value }))} />
        </FField>

        <div className="col-span-2">
          <FField label="Remarks">
            <FTextarea value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} />
          </FField>
        </div>
      </div>
      <ModalFooter onCancel={onClose} onSave={save} saveLabel={createMutation.isPending ? "Posting…" : "Post Voucher"} />
    </Modal>
  );
}

function VoucherDetailModal({ voucher, onClose }: { voucher: any; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [voucherPreview, setVoucherPreview] = useState<{ blob: Blob; filename: string } | null>(null);
  const [printing, setPrinting] = useState(false);
  const cancelMutation = useMutation({
    mutationFn: () => financeService.cancelVoucher(voucher._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vouchers"] });
      toast.success("Voucher cancelled — a reversing entry has been posted");
      onClose();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to cancel voucher"),
  });

  function confirmCancel() {
    if (window.confirm(`Cancel voucher ${voucher.voucherNo}?\n\nThis posts a REVERSING journal entry (the original posting is marked reversed, never deleted) — standard accounting practice. This cannot be undone.`)) {
      cancelMutation.mutate();
    }
  }

  // Item 4 fix — "Print voucher" was missing entirely; reuses the existing
  // /pdf/voucher endpoint (already built for expense vouchers) with an
  // in-app preview first, matching this file's now-consistent
  // preview-before-print convention for every other document.
  async function previewVoucher() {
    setPrinting(true);
    try {
      const blob = await pdfApi.generateVoucherPdf({
        type: "payment_voucher",
        voucherData: {
          voucherNumber: voucher.voucherNo,
          date: voucher.postingDate ? new Date(voucher.postingDate).toLocaleDateString("en-GB") : new Date().toLocaleDateString("en-GB"),
          department: voucher.costCenterName,
          debitAccount: `${voucher.paidToAccountCode} — ${voucher.paidToAccountName}`,
          creditAccount: `${voucher.paidFromAccountCode} — ${voucher.paidFromAccountName}`,
          amount: voucher.paidAmount,
          currency: voucher.currencyCode,
          narration: voucher.remarks || `${voucher.paymentType === "receive" ? "Receipt" : voucher.paymentType === "pay" ? "Payment" : "Transfer"} voucher — ${voucher.partyName}`,
          paidTo: voucher.partyName,
          rows: [
            { account: `${voucher.paidToAccountCode} — ${voucher.paidToAccountName}`, debit: voucher.paidAmount, credit: 0 },
            { account: `${voucher.paidFromAccountCode} — ${voucher.paidFromAccountName}`, debit: 0, credit: voucher.paidAmount },
          ],
          items: [{ description: voucher.remarks || voucher.partyName, amount: voucher.paidAmount }],
        },
      });
      setVoucherPreview({ blob, filename: `voucher-${voucher.voucherNo}.pdf` });
    } catch (err: any) {
      toast.error(await extractBlobError(err));
    } finally {
      setPrinting(false);
    }
  }

  return (
    <Modal title={voucher.voucherNo} onClose={onClose}>
      <div className="flex items-center gap-2 mb-1">
        {voucherTypeBadge(voucher.paymentType)}
        <Badge v={voucher.status === "cancelled" ? "gray" : "green"}>{voucher.status === "cancelled" ? "Cancelled" : "Posted"}</Badge>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div><p className="text-xs text-slate-400">Posting Date</p><p className="font-semibold">{new Date(voucher.postingDate).toLocaleDateString()}</p></div>
        <div><p className="text-xs text-slate-400">Branch / Cost Center</p><p className="font-semibold">{voucher.costCenterName || "—"}</p></div>
        <div><p className="text-xs text-slate-400">Party Type</p><p className="font-semibold capitalize">{voucher.partyType}</p></div>
        <div><p className="text-xs text-slate-400">Party</p><p className="font-semibold">{voucher.partyName}</p></div>
        <div><p className="text-xs text-slate-400">Credit Account</p><p className="font-semibold">{voucher.paidFromAccountCode} — {voucher.paidFromAccountName}</p></div>
        <div><p className="text-xs text-slate-400">Debit Account</p><p className="font-semibold">{voucher.paidToAccountCode} — {voucher.paidToAccountName}</p></div>
        <div><p className="text-xs text-slate-400">Currency</p><p className="font-semibold">{voucher.currencyCode} (rate {voucher.exchangeRate})</p></div>
        <div><p className="text-xs text-slate-400">Amount</p><p className="font-semibold">{voucher.paidAmount?.toLocaleString()} {voucher.currencyCode}</p></div>
        <div><p className="text-xs text-slate-400">Base Amount</p><p className="font-semibold">₨ {voucher.receivedAmount?.toLocaleString()}</p></div>
        <div><p className="text-xs text-slate-400">Party Balance Before</p><p className="font-semibold">₨ {voucher.partyBalanceBefore?.toLocaleString?.() ?? 0}</p></div>
        {voucher.taxTemplateName && (<div><p className="text-xs text-slate-400">Tax</p><p className="font-semibold">{voucher.taxTemplateName} — ₨ {voucher.taxAmount?.toLocaleString()}</p></div>)}
        {voucher.referenceNumber && (<div><p className="text-xs text-slate-400">Reference</p><p className="font-semibold">{voucher.referenceNumber}</p></div>)}
        {voucher.remarks && (<div className="col-span-2"><p className="text-xs text-slate-400">Remarks</p><p className="font-semibold">{voucher.remarks}</p></div>)}
      </div>
      <div className="flex justify-between items-center pt-3 border-t border-slate-100">
        <span className="text-xs text-slate-400">Journal Entry: {voucher.journalEntryId ? String(voucher.journalEntryId).slice(-8) : "—"}</span>
        <div className="flex gap-2">
          <Btn variant="secondary" onClick={previewVoucher} disabled={printing}><Printer size={12} /> {printing ? "Preparing…" : "Print Voucher"}</Btn>
          {voucher.status !== "cancelled" && (
            <Btn variant="danger" onClick={confirmCancel}><Ban size={12} /> {cancelMutation.isPending ? "Cancelling…" : "Cancel Voucher"}</Btn>
          )}
        </div>
      </div>
      {voucherPreview && (
        <ChallanPreviewModal title="Voucher Preview" blob={voucherPreview.blob} filename={voucherPreview.filename} onClose={() => setVoucherPreview(null)} />
      )}
    </Modal>
  );
}

function VouchersTab() {
  const [showNew, setShowNew] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  const [paymentTypeFilter, setPaymentTypeFilter] = useState("");
  const [partyTypeFilter, setPartyTypeFilter] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["vouchers", paymentTypeFilter, partyTypeFilter, from, to],
    queryFn: () => financeService.getVouchers({
      paymentType: paymentTypeFilter || undefined,
      partyType: partyTypeFilter || undefined,
      from: from || undefined,
      to: to || undefined,
    }),
  });
  const vouchers = data?.data || [];

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title="Payment & Receipt Vouchers"
          sub="Quick-entry debit/credit vouchers for vendor payments, refunds, and other one-off entries — every posting lands in the same double-entry ledger as fee and payroll, but Collect Fee (Receivables) and Process Payroll are the dedicated flows for routine fee and salary transactions"
          actions={<Btn variant="primary" onClick={() => setShowNew(true)}><Plus size={12} /> New Voucher</Btn>}
        />
        <div className="flex flex-wrap items-center gap-2 px-5 py-3 border-b border-slate-100">
          <div className="w-40"><FSelect value={paymentTypeFilter} onChange={e => setPaymentTypeFilter(e.target.value)}>
            <option value="">All Types</option>
            <option value="receive">Receive</option>
            <option value="pay">Pay</option>
            <option value="transfer">Transfer</option>
          </FSelect></div>
          <div className="w-40"><FSelect value={partyTypeFilter} onChange={e => setPartyTypeFilter(e.target.value)}>
            <option value="">All Party Types</option>
            {PARTY_TYPES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
          </FSelect></div>
          <div className="w-40"><FInput type="date" value={from} onChange={e => setFrom(e.target.value)} /></div>
          <span className="text-xs text-slate-400">to</span>
          <div className="w-40"><FInput type="date" value={to} onChange={e => setTo(e.target.value)} /></div>
        </div>
        <TableWrap headers={["Voucher #", "Type", "Date", "Party", "Amount", "Status", ""]}>
          {isLoading ? (
            <tr><td colSpan={7} className="px-4 py-12 text-center"><div className="w-6 h-6 border-4 border-[#0C447C] border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
          ) : vouchers.length === 0 ? (
            <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-400">No vouchers yet. Click + New Voucher to record one.</td></tr>
          ) : vouchers.map((v: any) => (
            <tr key={v._id} className="hover:bg-slate-50 cursor-pointer" onClick={() => setSelected(v)}>
              <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-800">{v.voucherNo}</td>
              <td className="px-4 py-3">{voucherTypeBadge(v.paymentType)}</td>
              <td className="px-4 py-3 text-slate-600 text-xs">{new Date(v.postingDate).toLocaleDateString()}</td>
              <td className="px-4 py-3 text-slate-700 text-xs">{v.partyName} <span className="text-slate-400 capitalize">({v.partyType})</span></td>
              <td className="px-4 py-3 font-mono font-semibold text-slate-800">{v.paidAmount?.toLocaleString()} {v.currencyCode}</td>
              <td className="px-4 py-3"><Badge v={v.status === "cancelled" ? "gray" : "green"}>{v.status === "cancelled" ? "Cancelled" : "Posted"}</Badge></td>
              <td className="px-4 py-3"><Eye size={14} className="text-slate-400" /></td>
            </tr>
          ))}
        </TableWrap>
      </Card>

      {showNew && <NewVoucherModal onClose={() => setShowNew(false)} />}
      {selected && <VoucherDetailModal voucher={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function FinancePage() {
  // Sub-module-aware visibility — mirrors what CustomRoleGuard actually
  // enforces server-side for Finance (finance.controller.ts's
  // @RequireModuleAccess() decorators), so a role scoped to only a few
  // Finance sub-modules never sees a tab it would immediately get a 403
  // from, and a standard (non-custom-role) user sees every tab exactly as
  // before, since canAccess() falls back to the module-wide grant for them.
  const { canAccess } = useAuth();
  const visibleTabs = TABS.filter(t => canAccess("finance:view", t.id));
  const [active, setActive] = useState<FinTab>(() => visibleTabs[0]?.id ?? "dashboard");

  function renderTab() {
    // Defense in depth beyond just hiding the tab button above — covers
    // onNavigate() jumps (Dashboard/Reports quick actions) targeting a tab
    // this role isn't actually granted.
    if (!canAccess("finance:view", active)) {
      return (
        <div className="text-center py-16 text-slate-400">
          <p className="text-sm font-medium">You don't have access to this section.</p>
          <p className="text-xs mt-1">Ask an administrator to grant it under Roles &amp; Permissions.</p>
        </div>
      );
    }
    switch (active) {
      case "dashboard":  return <DashboardTab onNavigate={setActive} />;
      case "fee":         return <FeeRevenueTab onNavigate={setActive} />;
      case "assignments": return <FeeAssignmentTab />;
      case "receivable":  return <ReceivableTab />;
      case "defaulters":  return <DefaultersTab />;
      case "payable":    return <PayableTab />;
      case "vouchers":   return <VouchersTab />;
      case "banking":    return <BankingTab />;
      case "reconciliation": return <BankReconciliationTab />;
      case "budgeting":  return <BudgetingTab />;
      case "islamic":    return <IslamicFundsTab />;
      case "ledger":     return <LedgerTab />;
      case "reports":    return <ReportsTab onNavigate={setActive} />;
      case "audit":      return <AuditTab />;
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-white border-b border-gray-100">
        <ModuleHeader
          icon={Wallet}
          title="Finance"
          subtitle="Fee collection, payables, banking, budgeting and financial reporting"
        />
        <div className="px-6">
          <TabBar
            tabs={visibleTabs.map(t => ({ id: t.id, label: t.label, icon: t.icon, count: t.badge }))}
            activeId={active}
            onChange={(id) => setActive(id as FinTab)}
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6">{renderTab()}</div>
    </div>
  );
}
