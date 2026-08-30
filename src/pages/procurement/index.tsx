import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer,
} from "recharts";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard, FileText, CheckSquare, ShoppingCart, Package, Truck,
  Archive, Cpu, BarChart2, Plus, Download, Eye, Edit2, Trash2,
  CheckCircle, XCircle, RotateCcw, AlertTriangle, DollarSign, RefreshCw,
} from "lucide-react";
import type { ProcTab, Requisition, PurchaseOrder, GRN, Vendor, InventoryItem, Asset, Approval } from "./types";
import { INIT_ASSETS, INIT_VENDORS, MONTHLY_DATA, CATEGORY_SPEND, PR_CATEGORIES } from "./types";
import { useRealCampuses } from "../teaching/tabs/shared";
import organizationService from "../../services/organization.service";
import type { ToastItem } from "./modals";
import {
  Badge, statusBV, Btn, Card, CardHeader, KPI, SearchBar, THead, Pagination, IconBtn,
  Toast, ConfirmDialog, RequisitionModal, ApprovalModal, POModal, GRNModal,
  VendorModal, InventoryModal, StockAdjustModal, AssetModal, ReportFilterModal,
} from "./modals";
import {
  useProcurementDashboard,
  useVendors, useCreateVendor, useUpdateVendor,
  usePRs, useCreatePR, useApprovePR, useRejectPR,
  usePOs, useCreatePO,
  useGRNs, useCreateGRN, useVerifyGRN,
  useInventory, useCreateInventoryItem, useAdjustStock,
  useInventorySummary,
} from "../../hooks/useProcurement";
import * as procApi from "../../services/procurement.api";
import { ModuleHeader } from "../../components/layout/ModuleHeader";
import { TabBar } from "../../components/layout/TabBar";

const PIE_COLORS = ["#0C447C","#059669","#d97706","#7c3aed","#dc2626"];

const TABS: { id: ProcTab; label: string; icon: LucideIcon }[] = [
  { id:"dashboard",       label:"Dashboard",       icon:LayoutDashboard },
  { id:"requisitions",    label:"Requisitions",    icon:FileText },
  { id:"approvals",       label:"Approvals",       icon:CheckSquare },
  { id:"purchase-orders", label:"Purchase Orders", icon:ShoppingCart },
  { id:"grn",             label:"GRN",             icon:Package },
  { id:"vendors",         label:"Vendors",         icon:Truck },
  { id:"inventory",       label:"Inventory",       icon:Archive },
  { id:"assets",          label:"Assets",          icon:Cpu },
  { id:"reports",         label:"Reports",         icon:BarChart2 },
];

function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toast = (msg: string, type: ToastItem["type"] = "success") => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000);
  };
  return { toasts, toast };
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-6 h-6 border-2 border-[#0C447C] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function EmptyState({ message = "No records found" }: { message?: string }) {
  return (
    <tr>
      <td colSpan={12} className="px-4 py-12 text-center text-sm text-slate-400">{message}</td>
    </tr>
  );
}

// ─── DASHBOARD TAB ────────────────────────────────────────────────────────────
function DashboardTab({ onNav }: { onNav: (t: ProcTab) => void }) {
  const { data, isLoading } = useProcurementDashboard();
  const stats = (data as any)?.stats ?? {};

  if (isLoading) return <Spinner />;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-5 gap-4">
        <KPI label="Total Vendors"    value={String(stats.totalVendors    ?? 0)} sub="Registered"   trend={0} icon={Truck}         />
        <KPI label="Active Vendors"   value={String(stats.activeVendors   ?? 0)} sub="Approved"     trend={0} icon={Truck}         color="#059669" />
        <KPI label="Open POs"         value={String(stats.activePOs       ?? 0)} sub="In progress"  trend={0} icon={ShoppingCart}  />
        <KPI label="Total Spend"      value={`PKR ${((stats.totalSpend ?? 0) / 1000).toFixed(0)}K`} sub="All time" trend={0} icon={DollarSign} />
        <KPI label="Low Stock Items"  value={String((stats.lowStockItems ?? 0) + (stats.outOfStockItems ?? 0))} sub="Need reorder" trend={0} icon={AlertTriangle} color="#dc2626" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Card className="col-span-2">
          <CardHeader title="Monthly Procurement Spend" />
          <div className="p-4">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={MONTHLY_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="spend" stroke="#0C447C" fill="#0C447C22" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <CardHeader title="Category Spend" />
          <div className="p-4">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={CATEGORY_SPEND} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                  {CATEGORY_SPEND.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
      <Card>
        <CardHeader title="Quick Actions" />
        <div className="p-4 grid grid-cols-4 gap-3">
          {([
            { label:"New Requisition",    tab:"requisitions"    as ProcTab, icon:FileText,    color:"#0C447C" },
            { label:"New Purchase Order", tab:"purchase-orders" as ProcTab, icon:ShoppingCart, color:"#059669" },
            { label:"Record GRN",         tab:"grn"             as ProcTab, icon:Package,     color:"#d97706" },
            { label:"Add Vendor",         tab:"vendors"         as ProcTab, icon:Truck,       color:"#7c3aed" },
          ] as { label:string; tab:ProcTab; icon:LucideIcon; color:string }[]).map(a => (
            <button key={a.label} onClick={() => onNav(a.tab)}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: a.color + "18" }}>
                <a.icon size={20} style={{ color: a.color }} />
              </div>
              <span className="text-xs font-medium text-slate-600">{a.label}</span>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── REQUISITIONS TAB ─────────────────────────────────────────────────────────
function RequisitionsTab({ toast }: { toast: (msg: string, type?: ToastItem["type"]) => void }) {
  const [modal, setModal] = useState<{ type:"create"|"edit"|"view"; data?: Requisition } | null>(null);
  const [q, setQ] = useState("");

  const { data: apiData, isLoading } = usePRs();
  const createPR = useCreatePR();
  const { data: campuses = [] } = useRealCampuses();
  const { data: departments = [] } = useQuery({ queryKey: ["departments-for-dropdown"], queryFn: () => organizationService.getDepartments() });
  const campusName = (id: string) => (campuses as any[]).find(c => c._id === id)?.name ?? id;
  const deptName = (id: string) => (departments as any[]).find((d: any) => d._id === id)?.name ?? id;
  const categoryLabel = (v: string) => PR_CATEGORIES.find(c => c.value === v)?.label ?? v;

  const rows: Requisition[] = ((apiData as any)?.data ?? []).map((pr: any) => ({
    id:            pr.prNumber ?? "",
    campus:        pr.campusId ? campusName(pr.campusId) : "—",
    campusId:      pr.campusId ?? "",
    dept:          pr.departmentId ? deptName(pr.departmentId) : "—",
    departmentId:  pr.departmentId ?? "",
    category:      pr.category ?? "",
    by:            pr.requestedBy ?? "—",
    items:         (pr.items ?? []).length,
    amount:        pr.estimatedTotal ?? 0,
    priority:      pr.priority ? (pr.priority.charAt(0).toUpperCase() + pr.priority.slice(1)) : "Medium",
    status:        (() => {
      const s = pr.status as string;
      const m: Record<string, string> = { draft:"Draft", submitted:"Submitted", under_review:"Pending", approved:"Approved", rejected:"Rejected", po_raised:"Ordered", completed:"Received", cancelled:"Cancelled" };
      return m[s] ?? s;
    })(),
    date:          pr.createdAt ? new Date(pr.createdAt).toISOString().slice(0,10) : "—",
    justification: pr.description ?? pr.title ?? "",
    lineItems:     (pr.items ?? []).map((i: any) => ({ name: i.itemName ?? i.description ?? "", qty: i.quantity ?? 0, unit: i.unit ?? "Piece", unitCost: i.estimatedUnitPrice ?? 0 })),
    _apiId:        pr._id,
  }));

  const list = rows.filter(r => `${r.id} ${r.dept} ${r.by}`.toLowerCase().includes(q.toLowerCase()));
  // Cosmetic preview only — the real prNumber is assigned sequentially by the
  // backend (see PurchaseRequestSchema's pre('validate') hook) once created.
  const next = `PR-${new Date().getFullYear()}-${String(1000 + rows.length).padStart(4,"0")}`;

  const save = (r: Requisition) => {
    if (modal?.type === "create") {
      const title = r.justification?.trim()
        || `${categoryLabel(r.category || "other")} requisition${r.dept ? ` — ${r.dept}` : ""}`;
      createPR.mutate({
        title,
        description:   r.justification,
        category:      r.category || "other",
        campusId:      r.campusId || undefined,
        departmentId:  r.departmentId || undefined,
        priority:      r.priority?.toLowerCase() || "medium",
        requestedBy:   r.by,
        items:         (r.lineItems ?? []).map(l => ({
          itemName:            l.name,
          quantity:            l.qty,
          unit:                l.unit,
          estimatedUnitPrice:  l.unitCost,
          estimatedTotal:      l.qty * l.unitCost,
        })),
        academicYear:  "2025-26",
      }, {
        onSuccess: () => { toast("Requisition created"); setModal(null); },
        onError: () => { toast("Failed to create requisition", "error"); setModal(null); },
      });
    } else {
      toast("Requisition updated"); setModal(null);
    }
  };

  return (
    <Card>
      <CardHeader title="Purchase Requisitions" sub={`${rows.length} total`} actions={
        <><SearchBar value={q} onChange={setQ}/><Btn variant="secondary" onClick={() => toast("Exporting…","info")}><Download size={13}/>Export</Btn><Btn variant="primary" onClick={() => setModal({ type:"create" })}><Plus size={13}/>New Requisition</Btn></>
      }/>
      {isLoading ? <Spinner /> : (
        <div className="overflow-x-auto"><table className="w-full">
          <THead cols={["PR #","Dept/Category","Requested By","Items","Amount","Priority","Status","Date","Actions"]}/>
          <tbody>
            {list.length === 0 ? <EmptyState message="No requisitions yet" /> : list.map(r => (
              <tr key={r.id} className="border-t border-slate-50 hover:bg-slate-50">
                <td className="px-4 py-3 text-xs font-mono font-semibold text-[#0C447C]">{r.id}</td>
                <td className="px-4 py-3 text-xs text-slate-600">{r.dept}{r.category ? ` · ${categoryLabel(r.category)}` : ""}</td>
                <td className="px-4 py-3 text-xs text-slate-600">{r.by}</td>
                <td className="px-4 py-3 text-xs text-slate-600">{r.items}</td>
                <td className="px-4 py-3 text-xs font-semibold">PKR {r.amount.toLocaleString()}</td>
                <td className="px-4 py-3"><Badge v={statusBV(r.priority)}>{r.priority}</Badge></td>
                <td className="px-4 py-3"><Badge v={statusBV(r.status)}>{r.status}</Badge></td>
                <td className="px-4 py-3 text-xs text-slate-500">{r.date}</td>
                <td className="px-4 py-3"><div className="flex gap-1">
                  <IconBtn icon={Eye}   title="View" color="hover:text-[#0C447C] hover:bg-blue-50"  onClick={() => setModal({ type:"view", data:r })}/>
                  <IconBtn icon={Edit2} title="Edit" color="hover:text-amber-600 hover:bg-amber-50" onClick={() => setModal({ type:"edit", data:r })}/>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
      <Pagination total={rows.length} showing={list.length}/>
      {modal && <RequisitionModal mode={modal.type} data={modal.data} nextId={next} onSave={save} onClose={() => setModal(null)}/>}
    </Card>
  );
}

// ─── APPROVALS TAB ────────────────────────────────────────────────────────────
function ApprovalsTab({ toast }: { toast: (msg: string, type?: ToastItem["type"]) => void }) {
  const [modal, setModal] = useState<{ action:"approve"|"reject"|"revise"; approval:Approval } | null>(null);
  const [q, setQ] = useState("");

  const { data: apiData, isLoading } = usePRs({ status: "submitted" });
  const approvePR = useApprovePR();
  const rejectPR  = useRejectPR();

  const rows: (Approval & { _apiId: string })[] = ((apiData as any)?.data ?? []).map((pr: any) => ({
    _apiId:    pr._id,
    id:        pr.prNumber ?? "",
    by:        pr.requestedBy ?? "—",
    campus:    pr.schoolSlug ?? "—",
    amount:    pr.estimatedTotal ?? 0,
    priority:  pr.priority ? (pr.priority.charAt(0).toUpperCase() + pr.priority.slice(1)) : "Medium",
    reason:    pr.description ?? pr.title ?? "",
    stage:     "Pending Review",
    level:     1,
    submitted: pr.createdAt ? new Date(pr.createdAt).toISOString().slice(0,10) : "—",
    status:    "Pending",
  }));

  const list = rows.filter(r => `${r.id} ${r.by}`.toLowerCase().includes(q.toLowerCase()));

  const confirm = (notes: string) => {
    if (!modal) return;
    const { action, approval } = modal;
    const apiId = (approval as any)._apiId;
    if (action === "approve") {
      approvePR.mutate({ id: apiId, data: { notes } }, {
        onSuccess: () => { toast(`${approval.id} approved`); setModal(null); },
        onError: () => { toast("Failed to approve", "error"); setModal(null); },
      });
    } else if (action === "reject") {
      rejectPR.mutate({ id: apiId, data: { reason: notes } }, {
        onSuccess: () => { toast(`${approval.id} rejected`, "error"); setModal(null); },
        onError: () => { toast("Failed to reject", "error"); setModal(null); },
      });
    } else {
      toast(`${approval.id} sent for revision`); setModal(null);
    }
  };

  return (
    <Card>
      <CardHeader title="Pending Approvals" sub={`${rows.length} pending`} actions={
        <><SearchBar value={q} onChange={setQ}/><Btn variant="secondary" onClick={() => toast("Exporting…","info")}><Download size={13}/>Export</Btn></>
      }/>
      {isLoading ? <Spinner /> : (
        <div className="overflow-x-auto"><table className="w-full">
          <THead cols={["ID","Requested By","Amount","Priority","Stage","Submitted","Status","Actions"]}/>
          <tbody>
            {list.length === 0 ? <EmptyState message="No pending approvals" /> : list.map(r => (
              <tr key={r.id} className="border-t border-slate-50 hover:bg-slate-50">
                <td className="px-4 py-3 text-xs font-mono font-semibold text-[#0C447C]">{r.id}</td>
                <td className="px-4 py-3 text-xs text-slate-600">{r.by}</td>
                <td className="px-4 py-3 text-xs font-semibold">PKR {r.amount.toLocaleString()}</td>
                <td className="px-4 py-3"><Badge v={statusBV(r.priority)}>{r.priority}</Badge></td>
                <td className="px-4 py-3 text-xs text-slate-600">{r.stage}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{r.submitted}</td>
                <td className="px-4 py-3"><Badge v={statusBV(r.status)}>{r.status}</Badge></td>
                <td className="px-4 py-3"><div className="flex gap-1">
                  <IconBtn icon={CheckCircle} title="Approve" color="hover:text-emerald-600 hover:bg-emerald-50" onClick={() => setModal({ action:"approve", approval:r })}/>
                  <IconBtn icon={XCircle}     title="Reject"  color="hover:text-red-500 hover:bg-red-50"         onClick={() => setModal({ action:"reject",  approval:r })}/>
                  <IconBtn icon={RotateCcw}   title="Revise"  color="hover:text-amber-600 hover:bg-amber-50"     onClick={() => setModal({ action:"revise",  approval:r })}/>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
      <Pagination total={rows.length} showing={list.length}/>
      {modal && <ApprovalModal action={modal.action} approval={modal.approval} onConfirm={confirm} onClose={() => setModal(null)}/>}
    </Card>
  );
}

// ─── PURCHASE ORDERS TAB ──────────────────────────────────────────────────────
function POsTab({ toast }: { toast: (msg: string, type?: ToastItem["type"]) => void }) {
  const [modal, setModal] = useState<{ type:"create"|"edit"|"view"; data?: PurchaseOrder } | null>(null);
  const [q, setQ] = useState("");

  const { data: apiData, isLoading } = usePOs();
  const { data: vendorData } = useVendors();
  const createPO = useCreatePO();

  const rows: (PurchaseOrder & { _apiId: string })[] = ((apiData as any)?.data ?? []).map((p: any) => ({
    _apiId:    p._id,
    id:        p.poNumber ?? "",
    vendor:    p.vendorName ?? "—",
    campus:    "—",
    amount:    p.totalAmount ?? 0,
    orderDate: p.orderDate ? new Date(p.orderDate).toISOString().slice(0,10) : "—",
    delivery:  p.expectedDeliveryDate ? new Date(p.expectedDeliveryDate).toISOString().slice(0,10) : "—",
    status:    (() => {
      const s = p.status as string;
      const m: Record<string,string> = { draft:"Draft", sent:"Active", acknowledged:"Active", partially_received:"Partially Received", fully_received:"Delivered", invoiced:"Active", paid:"Delivered", cancelled:"Cancelled" };
      return m[s] ?? s;
    })(),
  }));

  const vNames = ((vendorData as any)?.data ?? []).map((v: any) => v.name as string);
  const list = rows.filter(r => `${r.id} ${r.vendor}`.toLowerCase().includes(q.toLowerCase()));
  const next = `PO-${new Date().getFullYear()}-${String(1000 + rows.length).padStart(4,"0")}`;

  const save = (r: PurchaseOrder) => {
    if (modal?.type === "create") {
      createPO.mutate({
        vendorName: r.vendor,
        title:      `PO for ${r.vendor}`,
        items:      [],
        academicYear: "2025-26",
      }, {
        onSuccess: () => { toast("Purchase order created"); setModal(null); },
        onError: () => { toast("Failed to create PO", "error"); setModal(null); },
      });
    } else {
      toast("Purchase order updated"); setModal(null);
    }
  };

  return (
    <Card>
      <CardHeader title="Purchase Orders" sub={`${rows.length} total`} actions={
        <><SearchBar value={q} onChange={setQ}/><Btn variant="secondary" onClick={() => toast("Exporting…","info")}><Download size={13}/>Export</Btn><Btn variant="primary" onClick={() => setModal({ type:"create" })}><Plus size={13}/>New PO</Btn></>
      }/>
      {isLoading ? <Spinner /> : (
        <div className="overflow-x-auto"><table className="w-full">
          <THead cols={["PO #","Vendor","Amount","Order Date","Expected Delivery","Status","Actions"]}/>
          <tbody>
            {list.length === 0 ? <EmptyState message="No purchase orders yet" /> : list.map(r => (
              <tr key={r.id} className="border-t border-slate-50 hover:bg-slate-50">
                <td className="px-4 py-3 text-xs font-mono font-semibold text-[#0C447C]">{r.id}</td>
                <td className="px-4 py-3 text-xs text-slate-600">{r.vendor}</td>
                <td className="px-4 py-3 text-xs font-semibold">PKR {r.amount.toLocaleString()}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{r.orderDate}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{r.delivery}</td>
                <td className="px-4 py-3"><Badge v={statusBV(r.status)}>{r.status}</Badge></td>
                <td className="px-4 py-3"><div className="flex gap-1">
                  <IconBtn icon={Eye}   title="View" color="hover:text-[#0C447C] hover:bg-blue-50"  onClick={() => setModal({ type:"view", data:r })}/>
                  <IconBtn icon={Edit2} title="Edit" color="hover:text-amber-600 hover:bg-amber-50" onClick={() => setModal({ type:"edit", data:r })}/>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
      <Pagination total={rows.length} showing={list.length}/>
      {modal && <POModal mode={modal.type} data={modal.data} nextId={next} vendorNames={vNames} onSave={save} onClose={() => setModal(null)}/>}
    </Card>
  );
}

// ─── GRN TAB ──────────────────────────────────────────────────────────────────
function GRNTab({ toast }: { toast: (msg: string, type?: ToastItem["type"]) => void }) {
  const [modal, setModal] = useState<{ type:"create"|"edit"; data?: GRN } | null>(null);
  const [q, setQ] = useState("");

  const { data: apiData, isLoading } = useGRNs();
  const { data: poData } = usePOs();
  const createGRN = useCreateGRN();
  const verifyGRN = useVerifyGRN();

  const rows: (GRN & { _apiId: string })[] = ((apiData as any)?.data ?? []).map((g: any) => ({
    _apiId:     g._id,
    id:         g.grnNumber ?? "",
    po:         g.poNumber ?? "—",
    vendor:     g.vendorName ?? "—",
    receivedBy: g.receivedBy ?? "—",
    date:       g.receivedDate ? new Date(g.receivedDate).toISOString().slice(0,10) : "—",
    items:      (g.items ?? []).length,
    status:     g.verified ? "Fully Received" : "Pending Verification",
  }));

  const poIds = ((poData as any)?.data ?? []).map((p: any) => p.poNumber as string);
  const list  = rows.filter(r => `${r.id} ${r.po} ${r.vendor}`.toLowerCase().includes(q.toLowerCase()));
  const next  = `GRN-${new Date().getFullYear()}-${String(1000 + rows.length).padStart(4,"0")}`;

  const save = (r: GRN) => {
    if (modal?.type === "create") {
      createGRN.mutate({
        poNumber:    r.po,
        vendorName:  r.vendor,
        receivedBy:  r.receivedBy,
        receivedDate: r.date,
        items:       [],
        academicYear: "2025-26",
      }, {
        onSuccess: () => { toast("GRN recorded"); setModal(null); },
        onError: () => { toast("Failed to record GRN", "error"); setModal(null); },
      });
    } else {
      toast("GRN updated"); setModal(null);
    }
  };

  return (
    <Card>
      <CardHeader title="Goods Receipt Notes" sub={`${rows.length} total`} actions={
        <><SearchBar value={q} onChange={setQ}/><Btn variant="secondary" onClick={() => toast("Exporting…","info")}><Download size={13}/>Export</Btn><Btn variant="primary" onClick={() => setModal({ type:"create" })}><Plus size={13}/>Record GRN</Btn></>
      }/>
      {isLoading ? <Spinner /> : (
        <div className="overflow-x-auto"><table className="w-full">
          <THead cols={["GRN #","PO Reference","Vendor","Received By","Date","Items","Status","Actions"]}/>
          <tbody>
            {list.length === 0 ? <EmptyState message="No GRNs recorded yet" /> : list.map(r => (
              <tr key={r.id} className="border-t border-slate-50 hover:bg-slate-50">
                <td className="px-4 py-3 text-xs font-mono font-semibold text-[#0C447C]">{r.id}</td>
                <td className="px-4 py-3 text-xs text-[#0C447C] font-medium">{r.po}</td>
                <td className="px-4 py-3 text-xs text-slate-600">{r.vendor}</td>
                <td className="px-4 py-3 text-xs text-slate-600">{r.receivedBy}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{r.date}</td>
                <td className="px-4 py-3 text-xs text-slate-600">{r.items}</td>
                <td className="px-4 py-3"><Badge v={statusBV(r.status)}>{r.status}</Badge></td>
                <td className="px-4 py-3"><div className="flex gap-1">
                  <IconBtn icon={Edit2} title="Edit" color="hover:text-amber-600 hover:bg-amber-50" onClick={() => setModal({ type:"edit", data:r })}/>
                  {!(r as any)._apiVerified && (
                    <IconBtn icon={CheckCircle} title="Verify" color="hover:text-emerald-600 hover:bg-emerald-50"
                      onClick={() => verifyGRN.mutate((r as any)._apiId, { onSuccess: () => toast("GRN verified") })}/>
                  )}
                </div></td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
      <Pagination total={rows.length} showing={list.length}/>
      {modal && <GRNModal mode={modal.type} data={modal.data} nextId={next} poIds={poIds} onSave={save} onClose={() => setModal(null)}/>}
    </Card>
  );
}

// ─── VENDORS TAB ──────────────────────────────────────────────────────────────
function VendorsTab({ toast }: { toast: (msg: string, type?: ToastItem["type"]) => void }) {
  const qc = useQueryClient();
  const [modal, setModal] = useState<{ type:"create"|"edit"|"view"; data?: Vendor & { _apiId?: string } } | null>(null);
  const [conf, setConf]   = useState<{ id: string; _apiId: string; action:"delete"|"blacklist" } | null>(null);
  const [q, setQ]         = useState("");

  const { data: apiData, isLoading } = useVendors();
  const createVendor = useCreateVendor();
  const updateVendor = useUpdateVendor();

  const rows: (Vendor & { _apiId: string; rawStatus: string })[] = ((apiData as any)?.data ?? []).map((v: any) => ({
    _apiId:       v._id,
    rawStatus:    v.status,
    id:           v.code ?? "",
    name:         v.name ?? "",
    category:     v.category ?? "—",
    contact:      v.contactPerson ?? "—",
    phone:        v.phone ?? "",
    email:        v.email ?? "",
    address:      [v.address, v.city].filter(Boolean).join(", "),
    ntn:          v.taxNumber ?? "",
    paymentTerms: v.paymentTerms ?? "Net 30",
    rating:       v.rating ?? 0,
    status:       (() => {
      const s = v.status as string;
      const m: Record<string,string> = { active:"Active", inactive:"Inactive", blacklisted:"Blacklisted", on_hold:"On Hold" };
      return m[s] ?? s;
    })(),
    lastOrder: "—",
  }));

  const list = rows.filter(r => `${r.id} ${r.name} ${r.category}`.toLowerCase().includes(q.toLowerCase()));
  const next = `V-${String(rows.length + 1).padStart(3,"0")}`;

  const save = (r: Vendor) => {
    if (modal?.type === "create") {
      createVendor.mutate({
        name:          r.name,
        phone:         r.phone,
        email:         r.email,
        category:      r.category,
        contactPerson: r.contact,
        address:       r.address,
        paymentTerms:  r.paymentTerms,
      }, {
        onSuccess: () => { toast("Vendor added"); setModal(null); },
        onError: () => { toast("Failed to add vendor", "error"); setModal(null); },
      });
    } else if (modal?.type === "edit" && (modal.data as any)?._apiId) {
      updateVendor.mutate({
        id:   (modal.data as any)._apiId,
        data: { name: r.name, phone: r.phone, email: r.email, category: r.category, contactPerson: r.contact, paymentTerms: r.paymentTerms },
      }, {
        onSuccess: () => { toast("Vendor updated"); setModal(null); },
        onError: () => { toast("Failed to update vendor", "error"); setModal(null); },
      });
    } else {
      setModal(null);
    }
  };

  return (
    <Card>
      <CardHeader title="Vendor Directory" sub={`${rows.length} vendors`} actions={
        <><SearchBar value={q} onChange={setQ}/><Btn variant="secondary" onClick={() => toast("Exporting…","info")}><Download size={13}/>Export</Btn><Btn variant="primary" onClick={() => setModal({ type:"create" })}><Plus size={13}/>Add Vendor</Btn></>
      }/>
      {isLoading ? <Spinner /> : (
        <div className="overflow-x-auto"><table className="w-full">
          <THead cols={["ID","Name","Category","Contact","Phone","Rating","Terms","Status","Actions"]}/>
          <tbody>
            {list.length === 0 ? <EmptyState message="No vendors registered yet" /> : list.map(r => (
              <tr key={r._apiId} className="border-t border-slate-50 hover:bg-slate-50">
                <td className="px-4 py-3 text-xs font-mono text-slate-500">{r.id}</td>
                <td className="px-4 py-3 text-xs font-semibold text-slate-800">{r.name}</td>
                <td className="px-4 py-3 text-xs text-slate-600">{r.category}</td>
                <td className="px-4 py-3 text-xs text-slate-600">{r.contact}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{r.phone}</td>
                <td className="px-4 py-3 text-xs font-semibold text-amber-600">★ {r.rating}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{r.paymentTerms}</td>
                <td className="px-4 py-3"><Badge v={statusBV(r.status)}>{r.status}</Badge></td>
                <td className="px-4 py-3"><div className="flex gap-1">
                  <IconBtn icon={Eye}           title="View"      color="hover:text-[#0C447C] hover:bg-blue-50"     onClick={() => setModal({ type:"view", data:r })}/>
                  <IconBtn icon={Edit2}         title="Edit"      color="hover:text-amber-600 hover:bg-amber-50"    onClick={() => setModal({ type:"edit", data:r })}/>
                  <IconBtn icon={AlertTriangle} title="Blacklist" color="hover:text-orange-500 hover:bg-orange-50"  onClick={() => setConf({ id:r.id, _apiId:r._apiId, action:"blacklist" })}/>
                  <IconBtn icon={Trash2}        title="Delete"    color="hover:text-red-500 hover:bg-red-50"        onClick={() => setConf({ id:r.id, _apiId:r._apiId, action:"delete" })}/>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
      <Pagination total={rows.length} showing={list.length}/>
      {modal && <VendorModal mode={modal.type} data={modal.data} nextCode={next} onSave={save} onClose={() => setModal(null)}/>}
      {conf && <ConfirmDialog
        title={conf.action === "delete" ? "Delete Vendor" : "Blacklist Vendor"}
        message={conf.action === "delete" ? `Permanently delete vendor ${conf.id}?` : `Mark ${conf.id} as blacklisted?`}
        confirmLabel={conf.action === "delete" ? "Delete" : "Blacklist"}
        variant={conf.action === "delete" ? "danger" : "primary"}
        onConfirm={() => {
          procApi.updateVendor(conf._apiId, { status: conf.action === "blacklist" ? "blacklisted" : "inactive" })
            .then(() => { qc.invalidateQueries({ queryKey: ["procurement", "vendors"] }); toast(conf.action === "blacklist" ? "Vendor blacklisted" : "Vendor removed", "error"); })
            .catch(() => toast("Failed", "error"));
          setConf(null);
        }}
        onClose={() => setConf(null)}/>}
    </Card>
  );
}

// ─── INVENTORY TAB ────────────────────────────────────────────────────────────
function InventoryTab({ toast }: { toast: (msg: string, type?: ToastItem["type"]) => void }) {
  const [modal, setModal] = useState<{ type:"create"|"edit"; data?: InventoryItem & { _apiId?: string } } | null>(null);
  const [stock, setStock] = useState<(InventoryItem & { _apiId: string }) | null>(null);
  const [q, setQ]         = useState("");

  const { data: apiData, isLoading } = useInventory();
  const { data: summaryData } = useInventorySummary();
  const createItem  = useCreateInventoryItem();
  const adjustStock = useAdjustStock();

  const rows: (InventoryItem & { _apiId: string })[] = ((apiData as any)?.data ?? []).map((i: any) => ({
    _apiId:   i._id,
    code:     i.code ?? "",
    name:     i.name ?? "",
    category: i.category ?? "",
    unit:     i.unit ?? "Piece",
    stock:    i.currentStock ?? 0,
    minStock: i.minimumStock ?? 0,
    maxStock: i.maximumStock ?? 0,
    unitCost: i.unitCost ?? 0,
    campus:   "—",
    location: i.storageLocation ?? "—",
    value:    i.totalValue ?? 0,
    status:   (() => {
      const s = i.status as string;
      const m: Record<string,string> = { in_stock:"In Stock", low_stock:"Low Stock", out_of_stock:"Critical", discontinued:"Inactive" };
      return m[s] ?? s;
    })(),
  }));

  const list = rows.filter(r => `${r.code} ${r.name} ${r.category}`.toLowerCase().includes(q.toLowerCase()));
  const next = `ITM-${String(rows.length + 1).padStart(4,"0")}`;
  const lowStockCount = ((summaryData as any)?.lowStock ?? 0) + ((summaryData as any)?.outOfStock ?? 0);

  const save = (r: InventoryItem) => {
    if (modal?.type === "create") {
      createItem.mutate({
        name:         r.name,
        category:     r.category,
        unit:         r.unit,
        currentStock: r.stock,
        minimumStock: r.minStock,
        maximumStock: r.maxStock,
        unitCost:     r.unitCost,
        storageLocation: r.location,
      }, {
        onSuccess: () => { toast("Item added to inventory"); setModal(null); },
        onError: () => { toast("Failed to add item", "error"); setModal(null); },
      });
    } else {
      toast("Item updated"); setModal(null);
    }
  };

  return (
    <Card>
      <CardHeader title="Inventory" sub={`${rows.length} items${lowStockCount > 0 ? ` · ${lowStockCount} low/out of stock` : ""}`} actions={
        <><SearchBar value={q} onChange={setQ}/><Btn variant="secondary" onClick={() => toast("Exporting…","info")}><Download size={13}/>Export</Btn><Btn variant="primary" onClick={() => setModal({ type:"create" })}><Plus size={13}/>Add Item</Btn></>
      }/>
      {isLoading ? <Spinner /> : (
        <div className="overflow-x-auto"><table className="w-full">
          <THead cols={["Code","Name","Category","Unit","Stock","Min","Unit Cost","Value","Status","Actions"]}/>
          <tbody>
            {list.length === 0 ? <EmptyState message="No inventory items yet" /> : list.map(r => (
              <tr key={r._apiId} className="border-t border-slate-50 hover:bg-slate-50">
                <td className="px-4 py-3 text-xs font-mono text-slate-500">{r.code}</td>
                <td className="px-4 py-3 text-xs font-semibold text-slate-800">{r.name}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{r.category}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{r.unit}</td>
                <td className="px-4 py-3 text-xs font-semibold text-slate-800">{r.stock}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{r.minStock}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{r.unitCost.toLocaleString()}</td>
                <td className="px-4 py-3 text-xs font-semibold">PKR {r.value.toLocaleString()}</td>
                <td className="px-4 py-3"><Badge v={statusBV(r.status)}>{r.status}</Badge></td>
                <td className="px-4 py-3"><div className="flex gap-1">
                  <IconBtn icon={Edit2}     title="Edit"         color="hover:text-amber-600 hover:bg-amber-50" onClick={() => setModal({ type:"edit", data:r })}/>
                  <IconBtn icon={RefreshCw} title="Adjust Stock" color="hover:text-[#0C447C] hover:bg-blue-50"  onClick={() => setStock(r)}/>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
      <Pagination total={rows.length} showing={list.length}/>
      {modal && <InventoryModal mode={modal.type} data={modal.data} nextCode={next} onSave={save} onClose={() => setModal(null)}/>}
      {stock && <StockAdjustModal item={stock}
        onSave={(newStock, reason) => {
          const adj = newStock - stock.stock;
          adjustStock.mutate({ id: stock._apiId, data: { adjustment: adj, reason } }, {
            onSuccess: () => { toast(`Stock adjusted: ${reason}`); setStock(null); },
            onError:   () => { toast("Failed to adjust stock", "error"); setStock(null); },
          });
        }}
        onClose={() => setStock(null)}/>}
    </Card>
  );
}

// ─── ASSETS TAB ───────────────────────────────────────────────────────────────
function AssetsTab({ toast }: { toast: (msg: string, type?: ToastItem["type"]) => void }) {
  const [rows, setRows]   = useState<Asset[]>(INIT_ASSETS);
  const [modal, setModal] = useState<{ type:"create"|"edit"|"view"; data?: Asset } | null>(null);
  const [conf, setConf]   = useState<string | null>(null);
  const [q, setQ]         = useState("");
  const list    = rows.filter(r => `${r.tag} ${r.name} ${r.category}`.toLowerCase().includes(q.toLowerCase()));
  const next    = `AST-${new Date().getFullYear()}-${String(rows.length + 1).padStart(4,"0")}`;
  const vNames  = INIT_VENDORS.map(v => v.name);
  const save = (r: Asset) => {
    modal?.type === "create" ? setRows(p => [...p, r]) : setRows(p => p.map(x => x.tag === r.tag ? r : x));
    toast(modal?.type === "create" ? "Asset registered" : "Asset updated");
    setModal(null);
  };
  return (
    <Card>
      <CardHeader title="Asset Register" sub={`${rows.length} assets`} actions={
        <><SearchBar value={q} onChange={setQ}/><Btn variant="secondary" onClick={() => toast("Exporting…","info")}><Download size={13}/>Export</Btn><Btn variant="primary" onClick={() => setModal({ type:"create" })}><Plus size={13}/>Register Asset</Btn></>
      }/>
      <div className="overflow-x-auto"><table className="w-full">
        <THead cols={["Tag","Name","Category","Campus","Location","Purchase Date","Price","Condition","Status","Actions"]}/>
        <tbody>{list.map(r => (
          <tr key={r.tag} className="border-t border-slate-50 hover:bg-slate-50">
            <td className="px-4 py-3 text-xs font-mono text-slate-500">{r.tag}</td>
            <td className="px-4 py-3 text-xs font-semibold text-slate-800">{r.name}</td>
            <td className="px-4 py-3 text-xs text-slate-500">{r.category}</td>
            <td className="px-4 py-3 text-xs text-slate-500">{r.campus.split("–")[0].trim()}</td>
            <td className="px-4 py-3 text-xs text-slate-500">{r.location}</td>
            <td className="px-4 py-3 text-xs text-slate-500">{r.purchaseDate}</td>
            <td className="px-4 py-3 text-xs font-semibold">PKR {r.price.toLocaleString()}</td>
            <td className="px-4 py-3"><Badge v={statusBV(r.condition)}>{r.condition}</Badge></td>
            <td className="px-4 py-3"><Badge v={statusBV(r.status)}>{r.status}</Badge></td>
            <td className="px-4 py-3"><div className="flex gap-1">
              <IconBtn icon={Eye}    title="View"   color="hover:text-[#0C447C] hover:bg-blue-50"  onClick={() => setModal({ type:"view", data:r })}/>
              <IconBtn icon={Edit2}  title="Edit"   color="hover:text-amber-600 hover:bg-amber-50" onClick={() => setModal({ type:"edit", data:r })}/>
              <IconBtn icon={Trash2} title="Delete" color="hover:text-red-500 hover:bg-red-50"     onClick={() => setConf(r.tag)}/>
            </div></td>
          </tr>
        ))}</tbody>
      </table></div>
      <Pagination total={rows.length} showing={list.length}/>
      {modal && <AssetModal mode={modal.type} data={modal.data} nextTag={next} vendorNames={vNames} onSave={save} onClose={() => setModal(null)}/>}
      {conf  && <ConfirmDialog title="Delete Asset" message={`Delete asset ${conf}?`} confirmLabel="Delete"
        onConfirm={() => { setRows(p => p.filter(r => r.tag !== conf)); toast("Asset deleted","error"); setConf(null); }} onClose={() => setConf(null)}/>}
    </Card>
  );
}

// ─── REPORTS TAB ──────────────────────────────────────────────────────────────
const REPORT_NAMES = [
  "Procurement Summary","Vendor Performance","Requisition Status","Spend Analysis",
  "GRN Report","Asset Register","Inventory Valuation","Budget vs Actual",
];

function ReportsTab({ toast }: { toast: (msg: string, type?: ToastItem["type"]) => void }) {
  const [gen, setGen] = useState<string | null>(null);
  return (
    <div>
      <div className="grid grid-cols-4 gap-4">
        {REPORT_NAMES.map(name => (
          <Card key={name}>
            <div className="p-5">
              <div className="w-10 h-10 bg-[#0C447C]/10 rounded-xl flex items-center justify-center mb-3">
                <BarChart2 size={20} className="text-[#0C447C]" />
              </div>
              <h4 className="font-semibold text-sm text-slate-800 mb-1">{name}</h4>
              <p className="text-xs text-slate-400 mb-4">Generate or schedule this report</p>
              <div className="flex gap-2">
                <Btn variant="primary" onClick={() => setGen(name)}><Download size={12}/>Generate</Btn>
                <Btn variant="secondary" onClick={() => toast("Coming soon – schedule feature","info")}>Schedule</Btn>
              </div>
            </div>
          </Card>
        ))}
      </div>
      {gen && <ReportFilterModal reportName={gen}
        onGenerate={(fmt) => { toast(`Downloading ${gen} as ${fmt}…`,"info"); setGen(null); }}
        onClose={() => setGen(null)}/>}
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function ProcurementPage() {
  const [tab, setTab] = useState<ProcTab>("dashboard");
  const { toasts, toast } = useToast();

  const { data: summaryData } = useInventorySummary();
  const lowStockCount = ((summaryData as any)?.lowStock ?? 0) + ((summaryData as any)?.outOfStock ?? 0);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-white border-b border-gray-100">
        <ModuleHeader
          icon={ShoppingCart}
          title="Procurement & Inventory"
          subtitle="Manage requisitions, vendors, purchase orders, assets and inventory"
        />
        <div className="px-6">
          <TabBar
            tabs={TABS.map(t => ({ id: t.id, label: t.label, icon: t.icon, count: t.id === "inventory" && lowStockCount > 0 ? lowStockCount : undefined }))}
            activeId={tab}
            onChange={(id) => setTab(id as ProcTab)}
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
      {tab==="dashboard"       && <DashboardTab onNav={setTab}/>}
      {tab==="requisitions"    && <RequisitionsTab toast={toast}/>}
      {tab==="approvals"       && <ApprovalsTab toast={toast}/>}
      {tab==="purchase-orders" && <POsTab toast={toast}/>}
      {tab==="grn"             && <GRNTab toast={toast}/>}
      {tab==="vendors"         && <VendorsTab toast={toast}/>}
      {tab==="inventory"       && <InventoryTab toast={toast}/>}
      {tab==="assets"          && <AssetsTab toast={toast}/>}
      {tab==="reports"         && <ReportsTab toast={toast}/>}
      <Toast toasts={toasts}/>
      </div>
    </div>
  );
}
