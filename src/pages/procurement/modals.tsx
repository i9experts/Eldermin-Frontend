import { useState } from "react";
import { X, Plus, Minus, TrendingUp, TrendingDown, Search, ChevronLeft, ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Requisition, PurchaseOrder, GRN, Vendor, InventoryItem, Asset, Approval } from "./types";
import { CAMPUSES, DEPTS, VENDOR_CATS, ITEM_CATS, ASSET_CATS, UOM_OPTIONS, PAYMENT_TERMS_LIST, DEPRECIATION_METHODS } from "./types";

// ─── SHARED UI PRIMITIVES ─────────────────────────────────────────────────────
export type BV = "green" | "amber" | "red" | "blue" | "purple" | "gray" | "navy";
const BADGE_CLS: Record<BV, string> = {
  green:  "bg-emerald-50 text-emerald-700 border-emerald-200",
  amber:  "bg-amber-50 text-amber-700 border-amber-200",
  red:    "bg-red-50 text-red-700 border-red-200",
  blue:   "bg-blue-50 text-blue-700 border-blue-200",
  purple: "bg-purple-50 text-purple-700 border-purple-200",
  gray:   "bg-slate-100 text-slate-600 border-slate-200",
  navy:   "bg-[#0C447C] text-white border-[#0C447C]",
};
export function Badge({ v, children }: { v: BV; children: React.ReactNode }) {
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${BADGE_CLS[v]}`}>{children}</span>;
}
export function statusBV(status: string): BV {
  const m: Record<string, BV> = {
    Draft:"gray", Pending:"amber", Approved:"green", Rejected:"red",
    Ordered:"blue", Received:"green", Active:"green", Delivered:"green",
    Overdue:"red", Blacklisted:"red", "Partially Received":"amber",
    "In Stock":"green", "Low Stock":"amber", Critical:"red",
    "Fully Received":"green", "Damaged Items":"red", Maintenance:"amber",
    "Warranty Expired":"red", Urgent:"red", High:"red", Medium:"amber", Low:"gray",
    Submitted:"blue", Revision:"purple",
  };
  return m[status] ?? "gray";
}
export function Btn({ children, variant = "secondary", onClick, type = "button" }: {
  children: React.ReactNode; variant?: "primary"|"secondary"|"danger"|"success"|"ghost";
  onClick?: () => void; type?: "button"|"submit";
}) {
  const cls = {
    primary:   "bg-[#0C447C] text-white hover:bg-[#0b3d6e] border-[#0C447C]",
    secondary: "bg-white text-slate-700 hover:bg-slate-50 border-slate-200",
    danger:    "bg-red-600 text-white hover:bg-red-700 border-red-600",
    success:   "bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-600",
    ghost:     "bg-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100 border-transparent",
  }[variant];
  return <button type={type} onClick={onClick} className={`${cls} px-3 py-1.5 text-xs border rounded-lg font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap`}>{children}</button>;
}
export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white rounded-xl border border-slate-100 shadow-sm ${className}`}>{children}</div>;
}
export function CardHeader({ title, sub, actions }: { title: string; sub?: string; actions?: React.ReactNode }) {
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
export function KPI({ label, value, sub, trend, color = "#0C447C", icon: Icon }: {
  label: string; value: string; sub?: string; trend?: number; color?: string; icon: LucideIcon;
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
export function SearchBar({ placeholder = "Search…", value, onChange }: { placeholder?: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="pl-9 pr-4 py-1.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0C447C] w-52" />
    </div>
  );
}
export function THead({ cols }: { cols: string[] }) {
  return (
    <thead>
      <tr className="bg-slate-50 border-b border-slate-100">
        {cols.map(c => <th key={c} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{c}</th>)}
      </tr>
    </thead>
  );
}
export function Pagination({ total, showing }: { total: number; showing: number }) {
  return (
    <div className="px-4 py-3 border-t border-slate-50 flex items-center justify-between">
      <span className="text-xs text-slate-400">Showing {showing} of {total}</span>
      <div className="flex items-center gap-1">
        <button className="p-1.5 rounded hover:bg-slate-100"><ChevronLeft size={14} /></button>
        {[1,2,3].map(n => <button key={n} className={`w-7 h-7 rounded text-xs ${n===1?"bg-[#0C447C] text-white font-semibold":"hover:bg-slate-100 text-slate-600"}`}>{n}</button>)}
        <button className="p-1.5 rounded hover:bg-slate-100"><ChevronRight size={14} /></button>
      </div>
    </div>
  );
}
export function IconBtn({ icon: Icon, title, color, onClick }: { icon: LucideIcon; title: string; color: string; onClick: () => void }) {
  return (
    <button title={title} onClick={onClick}
      className={`p-1.5 rounded-lg transition-colors text-slate-400 ${color}`}>
      <Icon size={14} />
    </button>
  );
}

// ─── TOAST ────────────────────────────────────────────────────────────────────
export interface ToastItem { id: number; msg: string; type: "success"|"error"|"info" }
export function Toast({ toasts }: { toasts: ToastItem[] }) {
  const col = { success:"bg-emerald-600", error:"bg-red-600", info:"bg-[#0C447C]" };
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className={`${col[t.type]} text-white px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium`}>{t.msg}</div>
      ))}
    </div>
  );
}

// ─── CONFIRM DIALOG ───────────────────────────────────────────────────────────
export function ConfirmDialog({ title, message, confirmLabel = "Confirm", variant = "danger", onConfirm, onClose }: {
  title: string; message: string; confirmLabel?: string;
  variant?: "danger"|"primary"; onConfirm: () => void; onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
        <h3 className="font-semibold text-slate-800 mb-2">{title}</h3>
        <p className="text-sm text-slate-500 mb-5">{message}</p>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 font-medium">Cancel</button>
          <button onClick={() => { onConfirm(); onClose(); }}
            className={`px-4 py-2 text-sm rounded-lg font-medium text-white ${variant==="danger"?"bg-red-600 hover:bg-red-700":"bg-[#0C447C] hover:bg-[#0b3d6e]"}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MODAL WRAPPER ────────────────────────────────────────────────────────────
export function Modal({ title, children, onClose, wide = false }: {
  title: string; children: React.ReactNode; onClose: () => void; wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center overflow-y-auto py-16 px-4">
      <div className={`bg-white rounded-xl shadow-2xl w-full ${wide ? "max-w-3xl" : "max-w-lg"} relative`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-xl">
          <h2 className="font-semibold text-slate-800 text-sm">{title}</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"><X size={18} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// ─── FORM HELPERS ─────────────────────────────────────────────────────────────
function FL({ label, required, children, span }: { label: string; required?: boolean; children: React.ReactNode; span?: boolean }) {
  return (
    <div className={span ? "col-span-2" : ""}>
      <label className="block text-xs font-semibold text-slate-600 mb-1">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      {children}
    </div>
  );
}
const INPUT_CLS = "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]";
const RO_CLS   = "w-full px-3 py-2 text-sm border border-slate-100 rounded-lg bg-slate-50 text-slate-500";

type LineItem = { id: number; name: string; qty: number; unit: string; unitCost: number };
function LineTable({ lines, readOnly, onAdd, onRemove, onUpdate }: {
  lines: LineItem[]; readOnly: boolean;
  onAdd: () => void; onRemove: (id: number) => void;
  onUpdate: (id: number, k: string, v: string | number) => void;
}) {
  const total = lines.reduce((s, l) => s + l.qty * l.unitCost, 0);
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-600">Item Lines</span>
        {!readOnly && <button onClick={onAdd} className="text-xs text-[#0C447C] hover:underline flex items-center gap-1"><Plus size={12} />Add Item</button>}
      </div>
      <div className="border border-slate-200 rounded-lg overflow-hidden mb-2">
        <table className="w-full text-xs">
          <thead><tr className="bg-slate-50">
            <th className="px-2 py-1.5 text-left font-semibold text-slate-500">Item</th>
            <th className="px-2 py-1.5 text-left font-semibold text-slate-500">Qty</th>
            <th className="px-2 py-1.5 text-left font-semibold text-slate-500">Unit</th>
            <th className="px-2 py-1.5 text-left font-semibold text-slate-500">Cost</th>
            <th className="px-2 py-1.5 text-left font-semibold text-slate-500">Total</th>
            {!readOnly && <th></th>}
          </tr></thead>
          <tbody>{lines.map(l => (
            <tr key={l.id} className="border-t border-slate-100">
              <td className="px-2 py-1"><input value={l.name} readOnly={readOnly} onChange={e => onUpdate(l.id,"name",e.target.value)} className="w-28 border border-slate-200 rounded px-2 py-0.5 text-xs focus:outline-none" placeholder="Description" /></td>
              <td className="px-2 py-1"><input type="number" value={l.qty} readOnly={readOnly} onChange={e => onUpdate(l.id,"qty",+e.target.value)} className="w-12 border border-slate-200 rounded px-2 py-0.5 text-xs focus:outline-none" /></td>
              <td className="px-2 py-1"><select value={l.unit} disabled={readOnly} onChange={e => onUpdate(l.id,"unit",e.target.value)} className="border border-slate-200 rounded px-2 py-0.5 text-xs">{UOM_OPTIONS.map(u=><option key={u}>{u}</option>)}</select></td>
              <td className="px-2 py-1"><input type="number" value={l.unitCost} readOnly={readOnly} onChange={e => onUpdate(l.id,"unitCost",+e.target.value)} className="w-20 border border-slate-200 rounded px-2 py-0.5 text-xs focus:outline-none" /></td>
              <td className="px-2 py-1 font-semibold text-slate-700">{(l.qty*l.unitCost).toLocaleString()}</td>
              {!readOnly && <td className="px-2 py-1"><button onClick={() => onRemove(l.id)} className="text-red-400 hover:text-red-600"><Minus size={13}/></button></td>}
            </tr>
          ))}</tbody>
        </table>
      </div>
      <p className="text-right text-sm font-bold text-slate-800">Total: PKR {total.toLocaleString()}</p>
    </div>
  );
}

function SaveCancel({ saveLabel, onSave, onClose }: { saveLabel: string; onSave: () => void; onClose: () => void }) {
  return (
    <div className="flex gap-2 mt-4">
      <button onClick={onClose} className="flex-1 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 font-medium">Cancel</button>
      <button onClick={onSave} className="flex-1 py-2 text-sm bg-[#0C447C] text-white rounded-lg hover:bg-[#0b3d6e] font-medium">{saveLabel}</button>
    </div>
  );
}

// ─── REQUISITION MODAL ────────────────────────────────────────────────────────
export function RequisitionModal({ mode, data, nextId, onSave, onClose }: {
  mode: "create"|"edit"|"view"; data?: Requisition; nextId: string;
  onSave: (r: Requisition) => void; onClose: () => void;
}) {
  const ro = mode === "view";
  const [campus, setCampus] = useState(data?.campus ?? "");
  const [dept,   setDept]   = useState(data?.dept ?? "");
  const [by,     setBy]     = useState(data?.by ?? "");
  const [date,   setDate]   = useState(data?.date ?? new Date().toISOString().slice(0,10));
  const [pri,    setPri]    = useState<string>(data?.priority ?? "Medium");
  const [status, setStatus] = useState(data?.status ?? "Draft");
  const [just,   setJust]   = useState(data?.justification ?? "");
  const [lines, setLines]   = useState<LineItem[]>(
    data ? [{ id:1, name:"Existing items", qty:data.items, unit:"Piece", unitCost: Math.round(data.amount/Math.max(data.items,1)) }]
         : [{ id:1, name:"", qty:1, unit:"Piece", unitCost:0 }]
  );
  const addLine = () => setLines(p=>[...p,{id:Date.now(),name:"",qty:1,unit:"Piece",unitCost:0}]);
  const remLine = (id:number) => setLines(p=>p.filter(l=>l.id!==id));
  const updLine = (id:number,k:string,v:string|number) => setLines(p=>p.map(l=>l.id===id?{...l,[k]:v}:l));
  const total   = lines.reduce((s,l)=>s+l.qty*l.unitCost,0);
  const save = () => onSave({ id:data?.id??nextId, campus, dept, by, date, priority:pri as Requisition["priority"], status, justification:just, items:lines.length, amount:total });

  return (
    <Modal title={mode==="create"?"New Purchase Requisition":mode==="edit"?`Edit ${data?.id??""}`:(data?.id??"")} onClose={onClose} wide>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <FL label="PR Number"><input value={data?.id??nextId} readOnly className={RO_CLS}/></FL>
        <FL label="Date *"><input type="date" value={date} readOnly={ro} onChange={e=>setDate(e.target.value)} className={ro?RO_CLS:INPUT_CLS}/></FL>
        <FL label="Campus *" required>
          {ro?<input value={campus} readOnly className={RO_CLS}/>:
          <select value={campus} onChange={e=>setCampus(e.target.value)} className={INPUT_CLS}><option value="">Select Campus</option>{CAMPUSES.map(c=><option key={c}>{c}</option>)}</select>}
        </FL>
        <FL label="Department *" required>
          {ro?<input value={dept} readOnly className={RO_CLS}/>:
          <select value={dept} onChange={e=>setDept(e.target.value)} className={INPUT_CLS}><option value="">Select Dept</option>{DEPTS.map(d=><option key={d}>{d}</option>)}</select>}
        </FL>
        <FL label="Requested By *" required><input value={by} readOnly={ro} onChange={e=>setBy(e.target.value)} className={ro?RO_CLS:INPUT_CLS} placeholder="Full name"/></FL>
        <FL label="Priority">
          {ro?<input value={pri} readOnly className={RO_CLS}/>:
          <select value={pri} onChange={e=>setPri(e.target.value)} className={INPUT_CLS}>{["Low","Medium","High","Urgent"].map(p=><option key={p}>{p}</option>)}</select>}
        </FL>
        <FL label="Status">
          {ro?<input value={status} readOnly className={RO_CLS}/>:
          <select value={status} onChange={e=>setStatus(e.target.value)} className={INPUT_CLS}>{["Draft","Submitted","Pending","Approved","Rejected"].map(s=><option key={s}>{s}</option>)}</select>}
        </FL>
        <FL label="Justification" span>
          <textarea value={just} readOnly={ro} onChange={e=>setJust(e.target.value)} rows={2} className={`${ro?RO_CLS:INPUT_CLS} resize-none`} placeholder="Purpose and expected benefit…"/>
        </FL>
      </div>
      <LineTable lines={lines} readOnly={ro} onAdd={addLine} onRemove={remLine} onUpdate={updLine}/>
      {!ro && <SaveCancel saveLabel={mode==="create"?"Submit Requisition":"Save Changes"} onSave={save} onClose={onClose}/>}
    </Modal>
  );
}

// ─── APPROVAL MODAL ───────────────────────────────────────────────────────────
export function ApprovalModal({ action, approval, onConfirm, onClose }: {
  action: "approve"|"reject"|"revise"; approval: Approval;
  onConfirm: (notes: string) => void; onClose: () => void;
}) {
  const [notes, setNotes] = useState("");
  const cfg = {
    approve:{ title:"Approve Requisition",  lbl:"Notes (optional)",    btn:"Approve",   cls:"bg-emerald-600 hover:bg-emerald-700" },
    reject: { title:"Reject Requisition",   lbl:"Rejection Reason *",  btn:"Reject",    cls:"bg-red-600 hover:bg-red-700"         },
    revise: { title:"Request Revision",     lbl:"Revision Notes *",    btn:"Send Back", cls:"bg-amber-600 hover:bg-amber-700"     },
  }[action];
  const canSubmit = action === "approve" || notes.trim().length > 0;
  return (
    <Modal title={cfg.title} onClose={onClose}>
      <div className="mb-4 p-3 bg-slate-50 rounded-lg">
        <p className="text-sm font-semibold text-slate-800">{approval.id}</p>
        <p className="text-xs text-slate-500 mt-0.5">PKR {approval.amount.toLocaleString()} · {approval.campus} · Stage: {approval.stage}</p>
        <p className="text-xs text-slate-600 mt-1">{approval.reason}</p>
      </div>
      <FL label={cfg.lbl}><textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={3} placeholder="Enter notes…" className={`${INPUT_CLS} resize-none`}/></FL>
      <div className="flex gap-2 mt-4">
        <button onClick={onClose} className="flex-1 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 font-medium">Cancel</button>
        <button disabled={!canSubmit} onClick={()=>{ onConfirm(notes); onClose(); }}
          className={`flex-1 py-2 text-sm ${cfg.cls} text-white rounded-lg font-medium disabled:opacity-50`}>{cfg.btn}</button>
      </div>
    </Modal>
  );
}

// ─── PURCHASE ORDER MODAL ─────────────────────────────────────────────────────
export function POModal({ mode, data, nextId, vendorNames, onSave, onClose }: {
  mode: "create"|"edit"|"view"; data?: PurchaseOrder; nextId: string;
  vendorNames: string[]; onSave: (p: PurchaseOrder) => void; onClose: () => void;
}) {
  const ro = mode === "view";
  const [vendor,   setVendor]   = useState(data?.vendor ?? "");
  const [campus,   setCampus]   = useState(data?.campus ?? "");
  const [orderDt,  setOrderDt]  = useState(data?.orderDate ?? new Date().toISOString().slice(0,10));
  const [delivDt,  setDelivDt]  = useState(data?.delivery ?? "");
  const [status,   setStatus]   = useState(data?.status ?? "Draft");
  const [tax,      setTax]      = useState(0);
  const [lines, setLines] = useState<LineItem[]>(
    data ? [{ id:1, name:"Existing items", qty:1, unit:"Piece", unitCost:data.amount }]
         : [{ id:1, name:"", qty:1, unit:"Piece", unitCost:0 }]
  );
  const addLine = () => setLines(p=>[...p,{id:Date.now(),name:"",qty:1,unit:"Piece",unitCost:0}]);
  const remLine = (id:number) => setLines(p=>p.filter(l=>l.id!==id));
  const updLine = (id:number,k:string,v:string|number) => setLines(p=>p.map(l=>l.id===id?{...l,[k]:v}:l));
  const subtotal = lines.reduce((s,l)=>s+l.qty*l.unitCost,0);
  const grandTotal = Math.round(subtotal*(1+tax/100));
  const save = () => onSave({ id:data?.id??nextId, vendor, campus, orderDate:orderDt, delivery:delivDt, status, amount:grandTotal });

  return (
    <Modal title={mode==="create"?"New Purchase Order":mode==="edit"?`Edit ${data?.id??""}`:(data?.id??"")} onClose={onClose} wide>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <FL label="PO Number"><input value={data?.id??nextId} readOnly className={RO_CLS}/></FL>
        <FL label="Status">
          {ro?<input value={status} readOnly className={RO_CLS}/>:
          <select value={status} onChange={e=>setStatus(e.target.value)} className={INPUT_CLS}>{["Draft","Active","Delivered","Overdue","Partially Received","Cancelled"].map(s=><option key={s}>{s}</option>)}</select>}
        </FL>
        <FL label="Vendor *" required>
          {ro?<input value={vendor} readOnly className={RO_CLS}/>:
          <select value={vendor} onChange={e=>setVendor(e.target.value)} className={INPUT_CLS}><option value="">Select Vendor</option>{vendorNames.map(v=><option key={v}>{v}</option>)}</select>}
        </FL>
        <FL label="Campus *" required>
          {ro?<input value={campus} readOnly className={RO_CLS}/>:
          <select value={campus} onChange={e=>setCampus(e.target.value)} className={INPUT_CLS}><option value="">Select Campus</option>{CAMPUSES.map(c=><option key={c}>{c}</option>)}</select>}
        </FL>
        <FL label="PO Date *" required><input type="date" value={orderDt} readOnly={ro} onChange={e=>setOrderDt(e.target.value)} className={ro?RO_CLS:INPUT_CLS}/></FL>
        <FL label="Delivery Date *" required><input type="date" value={delivDt} readOnly={ro} onChange={e=>setDelivDt(e.target.value)} className={ro?RO_CLS:INPUT_CLS}/></FL>
      </div>
      <LineTable lines={lines} readOnly={ro} onAdd={addLine} onRemove={remLine} onUpdate={updLine}/>
      {!ro && (
        <div className="flex items-center justify-end gap-3 mt-1 text-sm">
          <span className="text-slate-500 text-xs">Tax %</span>
          <input type="number" value={tax} onChange={e=>setTax(+e.target.value)} className="w-16 border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#0C447C]"/>
          <span className="font-bold text-slate-800">Grand Total: PKR {grandTotal.toLocaleString()}</span>
        </div>
      )}
      {!ro && <SaveCancel saveLabel={mode==="create"?"Create PO":"Save Changes"} onSave={save} onClose={onClose}/>}
    </Modal>
  );
}

// ─── GRN MODAL ────────────────────────────────────────────────────────────────
type GRNLine = { id:number; item:string; ordered:number; received:number; condition:string };
export function GRNModal({ mode, data, nextId, poIds, onSave, onClose }: {
  mode: "create"|"edit"; data?: GRN; nextId: string;
  poIds: string[]; onSave: (g: GRN) => void; onClose: () => void;
}) {
  const [po,     setPo]     = useState(data?.po ?? "");
  const [vendor, setVendor] = useState(data?.vendor ?? "");
  const [recBy,  setRecBy]  = useState(data?.receivedBy ?? "");
  const [date,   setDate]   = useState(data?.date ?? new Date().toISOString().slice(0,10));
  const [status, setStatus] = useState(data?.status ?? "Fully Received");
  const [lines, setLines]   = useState<GRNLine[]>([{id:1,item:"",ordered:0,received:0,condition:"Good"}]);
  const addLine = () => setLines(p=>[...p,{id:Date.now(),item:"",ordered:0,received:0,condition:"Good"}]);
  const remLine = (id:number) => setLines(p=>p.filter(l=>l.id!==id));
  const updLine = (id:number,k:string,v:string|number) => setLines(p=>p.map(l=>l.id===id?{...l,[k]:v}:l));
  const save = () => onSave({ id:data?.id??nextId, po, vendor, receivedBy:recBy, date, items:lines.length, status });
  return (
    <Modal title={mode==="create"?"Record Goods Receipt":`Edit ${data?.id??""}`} onClose={onClose} wide>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <FL label="GRN Number"><input value={data?.id??nextId} readOnly className={RO_CLS}/></FL>
        <FL label="PO Reference *" required>
          <select value={po} onChange={e=>setPo(e.target.value)} className={INPUT_CLS}><option value="">Select PO</option>{poIds.map(p=><option key={p}>{p}</option>)}</select>
        </FL>
        <FL label="Vendor *" required><input value={vendor} onChange={e=>setVendor(e.target.value)} className={INPUT_CLS} placeholder="Vendor name"/></FL>
        <FL label="Received By *" required><input value={recBy} onChange={e=>setRecBy(e.target.value)} className={INPUT_CLS} placeholder="Staff name"/></FL>
        <FL label="Date *" required><input type="date" value={date} onChange={e=>setDate(e.target.value)} className={INPUT_CLS}/></FL>
        <FL label="Status">
          <select value={status} onChange={e=>setStatus(e.target.value)} className={INPUT_CLS}>{["Fully Received","Partially Received","Damaged Items"].map(s=><option key={s}>{s}</option>)}</select>
        </FL>
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-600">Items Received</span>
          <button onClick={addLine} className="text-xs text-[#0C447C] hover:underline flex items-center gap-1"><Plus size={12}/>Add Row</button>
        </div>
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <thead><tr className="bg-slate-50">
              <th className="px-2 py-1.5 text-left font-semibold text-slate-500">Item</th>
              <th className="px-2 py-1.5 text-left font-semibold text-slate-500">Ordered</th>
              <th className="px-2 py-1.5 text-left font-semibold text-slate-500">Received</th>
              <th className="px-2 py-1.5 text-left font-semibold text-slate-500">Condition</th>
              <th></th>
            </tr></thead>
            <tbody>{lines.map(l=>(
              <tr key={l.id} className="border-t border-slate-100">
                <td className="px-2 py-1"><input value={l.item} onChange={e=>updLine(l.id,"item",e.target.value)} className="w-28 border border-slate-200 rounded px-2 py-0.5 text-xs focus:outline-none" placeholder="Description"/></td>
                <td className="px-2 py-1"><input type="number" value={l.ordered} onChange={e=>updLine(l.id,"ordered",+e.target.value)} className="w-14 border border-slate-200 rounded px-2 py-0.5 text-xs"/></td>
                <td className="px-2 py-1"><input type="number" value={l.received} onChange={e=>updLine(l.id,"received",+e.target.value)} className="w-14 border border-slate-200 rounded px-2 py-0.5 text-xs"/></td>
                <td className="px-2 py-1"><select value={l.condition} onChange={e=>updLine(l.id,"condition",e.target.value)} className="border border-slate-200 rounded px-2 py-0.5 text-xs"><option>Good</option><option>Damaged</option><option>Partial</option></select></td>
                <td className="px-2 py-1"><button onClick={()=>remLine(l.id)} className="text-red-400 hover:text-red-600"><Minus size={13}/></button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
      <SaveCancel saveLabel={mode==="create"?"Submit GRN":"Save Changes"} onSave={save} onClose={onClose}/>
    </Modal>
  );
}

// ─── VENDOR MODAL ─────────────────────────────────────────────────────────────
export function VendorModal({ mode, data, nextCode, onSave, onClose }: {
  mode: "create"|"edit"|"view"; data?: Vendor; nextCode: string;
  onSave: (v: Vendor) => void; onClose: () => void;
}) {
  const ro = mode === "view";
  const [f, setF] = useState<Vendor>({
    id:data?.id??nextCode, name:data?.name??"", category:data?.category??"",
    contact:data?.contact??"", phone:data?.phone??"", email:data?.email??"",
    address:data?.address??"", ntn:data?.ntn??"", paymentTerms:data?.paymentTerms??"Net 30",
    rating:data?.rating??0, status:data?.status??"Active", lastOrder:data?.lastOrder??"—",
  });
  const set = (k: keyof Vendor, v: string|number) => setF(p=>({...p,[k]:v}));
  return (
    <Modal title={mode==="create"?"Add Vendor":mode==="edit"?`Edit ${f.name}`:f.name} onClose={onClose} wide>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <FL label="Vendor Code"><input value={f.id} readOnly className={RO_CLS}/></FL>
        <FL label="Status">
          {ro?<input value={f.status} readOnly className={RO_CLS}/>:
          <select value={f.status} onChange={e=>set("status",e.target.value)} className={INPUT_CLS}>{["Active","Inactive"].map(s=><option key={s}>{s}</option>)}</select>}
        </FL>
        <FL label="Vendor Name *" required><input value={f.name} readOnly={ro} onChange={e=>set("name",e.target.value)} className={ro?RO_CLS:INPUT_CLS} placeholder="Company name"/></FL>
        <FL label="Category *" required>
          {ro?<input value={f.category} readOnly className={RO_CLS}/>:
          <select value={f.category} onChange={e=>set("category",e.target.value)} className={INPUT_CLS}><option value="">Select Category</option>{VENDOR_CATS.map(c=><option key={c}>{c}</option>)}</select>}
        </FL>
        <FL label="Contact Person *" required><input value={f.contact} readOnly={ro} onChange={e=>set("contact",e.target.value)} className={ro?RO_CLS:INPUT_CLS} placeholder="Mr./Ms. Name"/></FL>
        <FL label="Phone *" required><input value={f.phone} readOnly={ro} onChange={e=>set("phone",e.target.value)} className={ro?RO_CLS:INPUT_CLS} placeholder="+92-300-0000000"/></FL>
        <FL label="Email *" required><input type="email" value={f.email} readOnly={ro} onChange={e=>set("email",e.target.value)} className={ro?RO_CLS:INPUT_CLS} placeholder="email@domain.pk"/></FL>
        <FL label="NTN"><input value={f.ntn} readOnly={ro} onChange={e=>set("ntn",e.target.value)} className={ro?RO_CLS:INPUT_CLS} placeholder="1234567-8"/></FL>
        <FL label="Payment Terms">
          {ro?<input value={f.paymentTerms} readOnly className={RO_CLS}/>:
          <select value={f.paymentTerms} onChange={e=>set("paymentTerms",e.target.value)} className={INPUT_CLS}>{PAYMENT_TERMS_LIST.map(t=><option key={t}>{t}</option>)}</select>}
        </FL>
        <FL label="Address" span><input value={f.address} readOnly={ro} onChange={e=>set("address",e.target.value)} className={ro?RO_CLS:INPUT_CLS} placeholder="Full address"/></FL>
      </div>
      {!ro && <SaveCancel saveLabel={mode==="create"?"Add Vendor":"Save Changes"} onSave={()=>onSave(f)} onClose={onClose}/>}
    </Modal>
  );
}

// ─── INVENTORY MODAL ──────────────────────────────────────────────────────────
export function InventoryModal({ mode, data, nextCode, onSave, onClose }: {
  mode: "create"|"edit"; data?: InventoryItem; nextCode: string;
  onSave: (item: InventoryItem) => void; onClose: () => void;
}) {
  const [f, setF] = useState<InventoryItem>({
    code:data?.code??nextCode, name:data?.name??"", category:data?.category??"",
    unit:data?.unit??"Piece", stock:data?.stock??0, minStock:data?.minStock??0,
    maxStock:data?.maxStock??0, unitCost:data?.unitCost??0, campus:data?.campus??"",
    location:data?.location??"", value:data?.value??0, status:data?.status??"In Stock",
  });
  const set = (k: keyof InventoryItem, v: string|number) => setF(p=>({...p,[k]:v}));
  const save = () => {
    const val = f.stock * f.unitCost;
    const st  = f.stock <= 0 ? "Critical" : f.stock < f.minStock ? "Low Stock" : "In Stock";
    onSave({...f, value:val, status:st});
  };
  return (
    <Modal title={mode==="create"?"Add Inventory Item":`Edit ${f.code}`} onClose={onClose} wide>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <FL label="Item Code"><input value={f.code} readOnly className={RO_CLS}/></FL>
        <FL label="Item Name *" required span={false}><input value={f.name} onChange={e=>set("name",e.target.value)} className={INPUT_CLS} placeholder="Descriptive item name"/></FL>
        <FL label="Category *" required>
          <select value={f.category} onChange={e=>set("category",e.target.value)} className={INPUT_CLS}><option value="">Select</option>{ITEM_CATS.map(c=><option key={c}>{c}</option>)}</select>
        </FL>
        <FL label="Unit of Measure *" required>
          <select value={f.unit} onChange={e=>set("unit",e.target.value)} className={INPUT_CLS}>{UOM_OPTIONS.map(u=><option key={u}>{u}</option>)}</select>
        </FL>
        <FL label="Current Stock *" required><input type="number" value={f.stock} onChange={e=>set("stock",+e.target.value)} className={INPUT_CLS}/></FL>
        <FL label="Min Stock *" required><input type="number" value={f.minStock} onChange={e=>set("minStock",+e.target.value)} className={INPUT_CLS}/></FL>
        <FL label="Max Stock *" required><input type="number" value={f.maxStock} onChange={e=>set("maxStock",+e.target.value)} className={INPUT_CLS}/></FL>
        <FL label="Unit Cost (PKR) *" required><input type="number" value={f.unitCost} onChange={e=>set("unitCost",+e.target.value)} className={INPUT_CLS}/></FL>
        <FL label="Campus *" required>
          <select value={f.campus} onChange={e=>set("campus",e.target.value)} className={INPUT_CLS}><option value="">Select Campus</option>{CAMPUSES.map(c=><option key={c}>{c}</option>)}</select>
        </FL>
        <FL label="Location"><input value={f.location} onChange={e=>set("location",e.target.value)} className={INPUT_CLS} placeholder="e.g. Central Warehouse"/></FL>
      </div>
      <SaveCancel saveLabel={mode==="create"?"Add Item":"Save Changes"} onSave={save} onClose={onClose}/>
    </Modal>
  );
}

export function StockAdjustModal({ item, onSave, onClose }: {
  item: InventoryItem; onSave: (newStock:number, reason:string)=>void; onClose: ()=>void;
}) {
  const [adj, setAdj] = useState(0);
  const [reason, setReason] = useState("");
  const newStock = item.stock + adj;
  return (
    <Modal title={`Adjust Stock — ${item.code}`} onClose={onClose}>
      <div className="mb-4 p-3 bg-slate-50 rounded-lg text-sm space-y-1">
        <div className="flex justify-between"><span className="text-slate-500">Current</span><span className="font-semibold">{item.stock} {item.unit}</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Minimum</span><span className="font-semibold">{item.minStock} {item.unit}</span></div>
      </div>
      <FL label="Adjustment (+/-)"><input type="number" value={adj} onChange={e=>setAdj(+e.target.value)} className={INPUT_CLS}/></FL>
      <p className={`text-xs mt-1 mb-3 font-medium ${newStock<0?"text-red-500":"text-emerald-600"}`}>New stock: {newStock} {item.unit}</p>
      <FL label="Reason *">
        <select value={reason} onChange={e=>setReason(e.target.value)} className={INPUT_CLS}>
          <option value="">Select reason</option>
          {["Physical count correction","Issued to department","Received from supplier","Damaged / write-off","Inter-campus transfer"].map(r=><option key={r}>{r}</option>)}
        </select>
      </FL>
      <div className="flex gap-2 mt-4">
        <button onClick={onClose} className="flex-1 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 font-medium">Cancel</button>
        <button disabled={!reason||newStock<0} onClick={()=>{ onSave(newStock,reason); onClose(); }}
          className="flex-1 py-2 text-sm bg-[#0C447C] text-white rounded-lg hover:bg-[#0b3d6e] font-medium disabled:opacity-50">Apply Adjustment</button>
      </div>
    </Modal>
  );
}

// ─── ASSET MODAL ──────────────────────────────────────────────────────────────
export function AssetModal({ mode, data, nextTag, vendorNames, onSave, onClose }: {
  mode: "create"|"edit"|"view"; data?: Asset; nextTag: string;
  vendorNames: string[]; onSave: (a: Asset) => void; onClose: () => void;
}) {
  const ro = mode === "view";
  const [f, setF] = useState<Asset>({
    tag:data?.tag??nextTag, name:data?.name??"", category:data?.category??"",
    campus:data?.campus??"", location:data?.location??"", purchaseDate:data?.purchaseDate??"",
    price:data?.price??0, vendor:data?.vendor??"", warranty:data?.warranty??"",
    usefulLife:data?.usefulLife??5, depreciation:data?.depreciation??"Straight Line",
    condition:data?.condition??"Good", assignedTo:data?.assignedTo??"", status:data?.status??"Active",
  });
  const set = (k: keyof Asset, v: string|number) => setF(p=>({...p,[k]:v}));
  return (
    <Modal title={mode==="create"?"Register Asset":mode==="edit"?`Edit ${f.tag}`:f.tag} onClose={onClose} wide>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <FL label="Asset Tag"><input value={f.tag} readOnly className={RO_CLS}/></FL>
        <FL label="Status">
          {ro?<input value={f.status} readOnly className={RO_CLS}/>:
          <select value={f.status} onChange={e=>set("status",e.target.value)} className={INPUT_CLS}>{["Active","Maintenance","Warranty Expired","Disposed"].map(s=><option key={s}>{s}</option>)}</select>}
        </FL>
        <FL label="Asset Name *" required><input value={f.name} readOnly={ro} onChange={e=>set("name",e.target.value)} className={ro?RO_CLS:INPUT_CLS} placeholder="Asset description"/></FL>
        <FL label="Category *" required>
          {ro?<input value={f.category} readOnly className={RO_CLS}/>:
          <select value={f.category} onChange={e=>set("category",e.target.value)} className={INPUT_CLS}><option value="">Select</option>{ASSET_CATS.map(c=><option key={c}>{c}</option>)}</select>}
        </FL>
        <FL label="Purchase Date *" required><input type="date" value={f.purchaseDate} readOnly={ro} onChange={e=>set("purchaseDate",e.target.value)} className={ro?RO_CLS:INPUT_CLS}/></FL>
        <FL label="Purchase Price *" required><input type="number" value={f.price} readOnly={ro} onChange={e=>set("price",+e.target.value)} className={ro?RO_CLS:INPUT_CLS}/></FL>
        <FL label="Vendor">
          {ro?<input value={f.vendor} readOnly className={RO_CLS}/>:
          <select value={f.vendor} onChange={e=>set("vendor",e.target.value)} className={INPUT_CLS}><option value="">Select Vendor</option>{vendorNames.map(v=><option key={v}>{v}</option>)}</select>}
        </FL>
        <FL label="Campus *" required>
          {ro?<input value={f.campus} readOnly className={RO_CLS}/>:
          <select value={f.campus} onChange={e=>set("campus",e.target.value)} className={INPUT_CLS}><option value="">Select Campus</option>{CAMPUSES.map(c=><option key={c}>{c}</option>)}</select>}
        </FL>
        <FL label="Location"><input value={f.location} readOnly={ro} onChange={e=>set("location",e.target.value)} className={ro?RO_CLS:INPUT_CLS} placeholder="Room / block"/></FL>
        <FL label="Warranty Expiry"><input type="date" value={f.warranty} readOnly={ro} onChange={e=>set("warranty",e.target.value)} className={ro?RO_CLS:INPUT_CLS}/></FL>
        <FL label="Useful Life (yrs)"><input type="number" value={f.usefulLife} readOnly={ro} onChange={e=>set("usefulLife",+e.target.value)} className={ro?RO_CLS:INPUT_CLS}/></FL>
        <FL label="Depreciation Method">
          {ro?<input value={f.depreciation} readOnly className={RO_CLS}/>:
          <select value={f.depreciation} onChange={e=>set("depreciation",e.target.value)} className={INPUT_CLS}>{DEPRECIATION_METHODS.map(d=><option key={d}>{d}</option>)}</select>}
        </FL>
        <FL label="Assigned To"><input value={f.assignedTo} readOnly={ro} onChange={e=>set("assignedTo",e.target.value)} className={ro?RO_CLS:INPUT_CLS} placeholder="Person / department"/></FL>
        <FL label="Condition">
          {ro?<input value={f.condition} readOnly className={RO_CLS}/>:
          <select value={f.condition} onChange={e=>set("condition",e.target.value)} className={INPUT_CLS}>{["Excellent","Good","Fair","Poor"].map(c=><option key={c}>{c}</option>)}</select>}
        </FL>
      </div>
      {!ro && <SaveCancel saveLabel={mode==="create"?"Register Asset":"Save Changes"} onSave={()=>onSave(f)} onClose={onClose}/>}
    </Modal>
  );
}

// ─── REPORT FILTER MODAL ──────────────────────────────────────────────────────
export function ReportFilterModal({ reportName, onGenerate, onClose }: {
  reportName: string; onGenerate: (fmt: string) => void; onClose: () => void;
}) {
  const [from, setFrom] = useState("2024-01-01");
  const [to,   setTo]   = useState(new Date().toISOString().slice(0,10));
  const [campus, setCampus] = useState("All Campuses");
  const [fmt, setFmt] = useState("PDF");
  return (
    <Modal title={`Generate: ${reportName}`} onClose={onClose}>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <FL label="From Date"><input type="date" value={from} onChange={e=>setFrom(e.target.value)} className={INPUT_CLS}/></FL>
        <FL label="To Date"><input type="date" value={to} onChange={e=>setTo(e.target.value)} className={INPUT_CLS}/></FL>
        <FL label="Campus">
          <select value={campus} onChange={e=>setCampus(e.target.value)} className={INPUT_CLS}>
            <option>All Campuses</option>{CAMPUSES.map(c=><option key={c}>{c}</option>)}
          </select>
        </FL>
        <FL label="Format">
          <select value={fmt} onChange={e=>setFmt(e.target.value)} className={INPUT_CLS}><option>PDF</option><option>Excel</option><option>CSV</option></select>
        </FL>
      </div>
      <div className="flex gap-2">
        <button onClick={onClose} className="flex-1 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 font-medium">Cancel</button>
        <button onClick={()=>{ onGenerate(fmt); onClose(); }} className="flex-1 py-2 text-sm bg-[#0C447C] text-white rounded-lg hover:bg-[#0b3d6e] font-medium">Generate {fmt}</button>
      </div>
    </Modal>
  );
}
