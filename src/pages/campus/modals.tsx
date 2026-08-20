import { useState } from "react";
import { X, Search, ChevronLeft, ChevronRight, TrendingUp, TrendingDown } from "lucide-react";
import { CampusDropdown } from "../teaching/tabs/shared";
import type { LucideIcon } from "lucide-react";
import type { Building, Room, Ticket, Vehicle, HostelAllocation, Visitor, UtilityReading } from "./types";
import {
  BUILDING_TYPES, ROOM_TYPES, VEHICLE_TYPES, HOSTEL_BLOCKS, UTILITY_TYPES,
  FIRE_STATUSES, PRIORITIES, DEPTS, BUILDING_CODES,
} from "./types";

// ─── SHARED PRIMITIVES ────────────────────────────────────────────────────────
export type BV = "green"|"amber"|"red"|"blue"|"purple"|"gray"|"navy";
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
export function statusBV(s: string): BV {
  const m: Record<string,BV> = {
    Active:"green", Available:"green", Compliant:"green", Normal:"green", Resolved:"green",
    "Checked Out":"gray", "At School":"blue", "En Route":"blue", "In Progress":"blue",
    "Partial Use":"amber", Pending:"amber", Scheduled:"amber", Renovation:"amber", Parked:"gray",
    Overdue:"red", "High Usage":"red", New:"blue", Occupied:"purple", Inside:"purple",
    Urgent:"red", High:"red", Medium:"amber", Low:"gray",
  };
  return m[s] ?? "gray";
}
export function Btn({ children, variant = "secondary", onClick, type = "button" }: {
  children: React.ReactNode; variant?: "primary"|"secondary"|"danger"|"success";
  onClick?: () => void; type?: "button"|"submit";
}) {
  const cls = {
    primary:   "bg-[#0C447C] text-white hover:bg-[#0b3d6e] border-[#0C447C]",
    secondary: "bg-white text-slate-700 hover:bg-slate-50 border-slate-200",
    danger:    "bg-red-600 text-white hover:bg-red-700 border-red-600",
    success:   "bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-600",
  }[variant];
  return <button type={type} onClick={onClick} className={`${cls} px-3 py-1.5 text-xs border rounded-lg font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap`}>{children}</button>;
}
export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white rounded-xl border border-slate-100 shadow-sm ${className}`}>{children}</div>;
}
export function CardHeader({ title, sub, actions }: { title: string; sub?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
      <div><p className="font-semibold text-slate-800 text-sm">{title}</p>{sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}</div>
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
            {trend >= 0 ? <TrendingUp size={11}/> : <TrendingDown size={11}/>}{Math.abs(trend)}%
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
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="pl-9 pr-4 py-1.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0C447C] w-52"/>
    </div>
  );
}
export function THead({ cols }: { cols: string[] }) {
  return (
    <thead><tr className="bg-slate-50 border-b border-slate-100">
      {cols.map(c => <th key={c} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{c}</th>)}
    </tr></thead>
  );
}
export function Pagination({ total, showing }: { total: number; showing: number }) {
  return (
    <div className="px-4 py-3 border-t border-slate-50 flex items-center justify-between">
      <span className="text-xs text-slate-400">Showing {showing} of {total}</span>
      <div className="flex items-center gap-1">
        <button className="p-1.5 rounded hover:bg-slate-100"><ChevronLeft size={14}/></button>
        {[1,2,3].map(n => <button key={n} className={`w-7 h-7 rounded text-xs ${n===1?"bg-[#0C447C] text-white font-semibold":"hover:bg-slate-100 text-slate-600"}`}>{n}</button>)}
        <button className="p-1.5 rounded hover:bg-slate-100"><ChevronRight size={14}/></button>
      </div>
    </div>
  );
}
export function IconBtn({ icon: Icon, title, color, onClick }: { icon: LucideIcon; title: string; color: string; onClick: () => void }) {
  return <button title={title} onClick={onClick} className={`p-1.5 rounded-lg transition-colors text-slate-400 ${color}`}><Icon size={14}/></button>;
}
export function ProgBar({ pct, color = "#0C447C" }: { pct: number; color?: string }) {
  return (
    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
      <div className="h-full rounded-full" style={{ width:`${Math.min(pct,100)}%`, background:color }}/>
    </div>
  );
}

// ─── TOAST ────────────────────────────────────────────────────────────────────
export interface ToastItem { id: number; msg: string; type: "success"|"error"|"info" }
export function Toast({ toasts }: { toasts: ToastItem[] }) {
  const col = { success:"bg-emerald-600", error:"bg-red-600", info:"bg-[#0C447C]" };
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => <div key={t.id} className={`${col[t.type]} text-white px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium`}>{t.msg}</div>)}
    </div>
  );
}

// ─── CONFIRM ──────────────────────────────────────────────────────────────────
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
      <div className={`bg-white rounded-xl shadow-2xl w-full ${wide?"max-w-3xl":"max-w-lg"} relative`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-xl">
          <h2 className="font-semibold text-slate-800 text-sm">{title}</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"><X size={18}/></button>
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
const IC = "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]";
const RC = "w-full px-3 py-2 text-sm border border-slate-100 rounded-lg bg-slate-50 text-slate-500";
function SC({ onSave, onClose, saveLabel }: { onSave: () => void; onClose: () => void; saveLabel: string }) {
  return (
    <div className="flex gap-2 mt-4">
      <button onClick={onClose} className="flex-1 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 font-medium">Cancel</button>
      <button onClick={onSave} className="flex-1 py-2 text-sm bg-[#0C447C] text-white rounded-lg hover:bg-[#0b3d6e] font-medium">{saveLabel}</button>
    </div>
  );
}

// ─── BUILDING MODAL ───────────────────────────────────────────────────────────
export function BuildingModal({ mode, data, onSave, onClose }: {
  mode: "create"|"edit"|"view"; data?: any;
  onSave: (b: any) => void; onClose: () => void;
}) {
  const ro = mode === "view";
  const [f, setF] = useState({
    code:data?.code??"", name:data?.name??"", type:data?.type??"Academic",
    floors:data?.floors??1, capacity:data?.capacity??0, campusId:data?.campusId??"",
    managerName:data?.managerName??"", fireSafety:data?.fireSafety??"Compliant", status:data?.status??"Active",
  });
  const set = (k: string, v: string|number) => setF(p => ({ ...p, [k]:v }));
  return (
    <Modal title={mode==="create"?"Add Building":mode==="edit"?`Edit ${f.code}`:f.name} onClose={onClose} wide>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <FL label="Building Code *" required>
          <input value={f.code} readOnly={mode!=="create"} onChange={e=>set("code",e.target.value)} className={mode!=="create"?RC:IC} placeholder="e.g. MAB-01"/>
        </FL>
        <FL label="Campus">
          {ro ? <input value={f.campusId} readOnly className={RC}/> : <CampusDropdown label="" value={f.campusId} onChange={v=>set("campusId",v)} />}
        </FL>
        <FL label="Status">
          {ro?<input value={f.status} readOnly className={RC}/>:
          <select value={f.status} onChange={e=>set("status",e.target.value)} className={IC}>{["Active","Partial Use","Renovation","Closed"].map(s=><option key={s}>{s}</option>)}</select>}
        </FL>
        <FL label="Building Name *" required span><input value={f.name} readOnly={ro} onChange={e=>set("name",e.target.value)} className={ro?RC:IC} placeholder="Full building name"/></FL>
        <FL label="Type *" required>
          {ro?<input value={f.type} readOnly className={RC}/>:
          <select value={f.type} onChange={e=>set("type",e.target.value)} className={IC}>{BUILDING_TYPES.map(t=><option key={t}>{t}</option>)}</select>}
        </FL>
        <FL label="Floors" required><input type="number" value={f.floors} readOnly={ro} onChange={e=>set("floors",+e.target.value)} className={ro?RC:IC}/></FL>
        <FL label="Capacity"><input type="number" value={f.capacity} readOnly={ro} onChange={e=>set("capacity",+e.target.value)} className={ro?RC:IC}/></FL>
        <FL label="Manager"><input value={f.managerName} readOnly={ro} onChange={e=>set("managerName",e.target.value)} className={ro?RC:IC} placeholder="Responsible manager"/></FL>
        <FL label="Fire Safety">
          {ro?<input value={f.fireSafety} readOnly className={RC}/>:
          <select value={f.fireSafety} onChange={e=>set("fireSafety",e.target.value)} className={IC}>{FIRE_STATUSES.map(s=><option key={s}>{s}</option>)}</select>}
        </FL>
      </div>
      {!ro && <SC saveLabel={mode==="create"?"Add Building":"Save Changes"} onSave={()=>onSave(f)} onClose={onClose}/>}
    </Modal>
  );
}

// ─── ROOM MODAL ───────────────────────────────────────────────────────────────
export function RoomModal({ mode, data, nextNum, onSave, onClose }: {
  mode: "create"|"edit"; data?: Room; nextNum: string;
  onSave: (r: Room) => void; onClose: () => void;
}) {
  const [f, setF] = useState<Room>({
    num:data?.num??nextNum, building:data?.building??"", floor:data?.floor??"G",
    type:data?.type??"Classroom", capacity:data?.capacity??0, dept:data?.dept??"",
    smart:data?.smart??false, avail:data?.avail??"Available", status:data?.status??"Active",
  });
  const set = (k: keyof Room, v: string|number|boolean) => setF(p => ({ ...p, [k]:v }));
  return (
    <Modal title={mode==="create"?"Add Room":`Edit Room ${f.num}`} onClose={onClose} wide>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <FL label="Room Number"><input value={f.num} readOnly={mode==="edit"} onChange={e=>set("num",e.target.value)} className={mode==="edit"?RC:IC}/></FL>
        <FL label="Building *" required>
          <select value={f.building} onChange={e=>set("building",e.target.value)} className={IC}><option value="">Select</option>{BUILDING_CODES.map(c=><option key={c}>{c}</option>)}</select>
        </FL>
        <FL label="Floor"><input value={f.floor} onChange={e=>set("floor",e.target.value)} className={IC} placeholder="G, 1, 2…"/></FL>
        <FL label="Room Type *" required>
          <select value={f.type} onChange={e=>set("type",e.target.value)} className={IC}>{ROOM_TYPES.map(t=><option key={t}>{t}</option>)}</select>
        </FL>
        <FL label="Capacity"><input type="number" value={f.capacity} onChange={e=>set("capacity",+e.target.value)} className={IC}/></FL>
        <FL label="Department">
          <select value={f.dept} onChange={e=>set("dept",e.target.value)} className={IC}><option value="">Select</option>{DEPTS.map(d=><option key={d}>{d}</option>)}</select>
        </FL>
        <FL label="Availability">
          <select value={f.avail} onChange={e=>set("avail",e.target.value)} className={IC}>{["Available","Occupied","Scheduled","N/A"].map(a=><option key={a}>{a}</option>)}</select>
        </FL>
        <FL label="Smart Equipment">
          <select value={f.smart?"Yes":"No"} onChange={e=>set("smart",e.target.value==="Yes")} className={IC}><option>No</option><option>Yes</option></select>
        </FL>
      </div>
      <SC saveLabel={mode==="create"?"Add Room":"Save Changes"} onSave={()=>onSave(f)} onClose={onClose}/>
    </Modal>
  );
}

// ─── TICKET MODAL ─────────────────────────────────────────────────────────────
export function TicketModal({ mode, data, nextId, onSave, onClose }: {
  mode: "create"|"edit"|"view"; data?: Ticket; nextId: string;
  onSave: (t: Ticket) => void; onClose: () => void;
}) {
  const ro = mode === "view";
  const [f, setF] = useState<Ticket>({
    id:data?.id??nextId, title:data?.title??"", building:data?.building??"",
    priority:data?.priority??"Medium", assigned:data?.assigned??"Unassigned",
    reported:data?.reported??new Date().toLocaleDateString("en-GB",{day:"numeric",month:"short"}),
    status:data?.status??"New",
  });
  const set = (k: keyof Ticket, v: string) => setF(p => ({ ...p, [k]:v }));
  return (
    <Modal title={mode==="create"?"New Maintenance Ticket":mode==="edit"?`Edit ${f.id}`:f.id} onClose={onClose} wide>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <FL label="Ticket ID"><input value={f.id} readOnly className={RC}/></FL>
        <FL label="Status">
          {ro?<input value={f.status} readOnly className={RC}/>:
          <select value={f.status} onChange={e=>set("status",e.target.value)} className={IC}>{["New","Pending","In Progress","On Hold","Resolved"].map(s=><option key={s}>{s}</option>)}</select>}
        </FL>
        <FL label="Title *" required span><input value={f.title} readOnly={ro} onChange={e=>set("title",e.target.value)} className={ro?RC:IC} placeholder="Describe the issue"/></FL>
        <FL label="Building *" required>
          {ro?<input value={f.building} readOnly className={RC}/>:
          <select value={f.building} onChange={e=>set("building",e.target.value)} className={IC}><option value="">Select</option>{BUILDING_CODES.map(c=><option key={c}>{c}</option>)}</select>}
        </FL>
        <FL label="Priority">
          {ro?<input value={f.priority} readOnly className={RC}/>:
          <select value={f.priority} onChange={e=>set("priority",e.target.value)} className={IC}>{PRIORITIES.map(p=><option key={p}>{p}</option>)}</select>}
        </FL>
        <FL label="Assigned To"><input value={f.assigned} readOnly={ro} onChange={e=>set("assigned",e.target.value)} className={ro?RC:IC} placeholder="Technician name"/></FL>
      </div>
      {!ro && <SC saveLabel={mode==="create"?"Create Ticket":"Save Changes"} onSave={()=>onSave(f)} onClose={onClose}/>}
    </Modal>
  );
}

// ─── VEHICLE MODAL ────────────────────────────────────────────────────────────
export function VehicleModal({ mode, data, nextId, onSave, onClose }: {
  mode: "create"|"edit"; data?: Vehicle; nextId: string;
  onSave: (v: Vehicle) => void; onClose: () => void;
}) {
  const [f, setF] = useState<Vehicle>({
    id:data?.id??nextId, type:data?.type??"School Bus", model:data?.model??"",
    capacity:data?.capacity??0, driver:data?.driver??"", route:data?.route??"",
    fuel:data?.fuel??100, status:data?.status??"Available",
  });
  const set = (k: keyof Vehicle, v: string|number) => setF(p => ({ ...p, [k]:v }));
  return (
    <Modal title={mode==="create"?"Add Vehicle":`Edit ${f.id}`} onClose={onClose} wide>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <FL label="Vehicle ID"><input value={f.id} readOnly className={RC}/></FL>
        <FL label="Status">
          <select value={f.status} onChange={e=>set("status",e.target.value)} className={IC}>{["Available","En Route","At School","Parked","Maintenance"].map(s=><option key={s}>{s}</option>)}</select>
        </FL>
        <FL label="Vehicle Type *" required>
          <select value={f.type} onChange={e=>set("type",e.target.value)} className={IC}>{VEHICLE_TYPES.map(t=><option key={t}>{t}</option>)}</select>
        </FL>
        <FL label="Model *" required><input value={f.model} onChange={e=>set("model",e.target.value)} className={IC} placeholder="e.g. Hino FC9"/></FL>
        <FL label="Capacity"><input type="number" value={f.capacity} onChange={e=>set("capacity",+e.target.value)} className={IC}/></FL>
        <FL label="Driver"><input value={f.driver} onChange={e=>set("driver",e.target.value)} className={IC} placeholder="Driver name"/></FL>
        <FL label="Route / Use" span><input value={f.route} onChange={e=>set("route",e.target.value)} className={IC} placeholder="Route name or usage"/></FL>
        <FL label="Fuel Level (%)"><input type="number" min="0" max="100" value={f.fuel} onChange={e=>set("fuel",+e.target.value)} className={IC}/></FL>
      </div>
      <SC saveLabel={mode==="create"?"Add Vehicle":"Save Changes"} onSave={()=>onSave(f)} onClose={onClose}/>
    </Modal>
  );
}

// ─── HOSTEL ALLOCATION MODAL ──────────────────────────────────────────────────
export function HostelModal({ data, nextRoll, onSave, onClose }: {
  data?: HostelAllocation; nextRoll: string;
  onSave: (h: HostelAllocation) => void; onClose: () => void;
}) {
  const [f, setF] = useState<HostelAllocation>({
    roll:data?.roll??nextRoll, name:data?.name??"", block:data?.block??"Block A (Boys)",
    room:data?.room??"", bed:data?.bed??"Bed 1",
    checkIn:data?.checkIn??new Date().toLocaleDateString("en-US",{month:"short",day:"2-digit",year:"numeric"}),
    warden:data?.warden??"", status:data?.status??"Active",
  });
  const set = (k: keyof HostelAllocation, v: string) => setF(p => ({ ...p, [k]:v }));
  return (
    <Modal title={data ? `Edit Allocation — ${f.roll}` : "Allocate Bed"} onClose={onClose}>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <FL label="Roll #"><input value={f.roll} readOnly className={RC}/></FL>
        <FL label="Status">
          <select value={f.status} onChange={e=>set("status",e.target.value)} className={IC}>{["Active","Vacated","Suspended"].map(s=><option key={s}>{s}</option>)}</select>
        </FL>
        <FL label="Student Name *" required span><input value={f.name} onChange={e=>set("name",e.target.value)} className={IC} placeholder="Full name"/></FL>
        <FL label="Block *" required>
          <select value={f.block} onChange={e=>set("block",e.target.value)} className={IC}>{HOSTEL_BLOCKS.map(b=><option key={b}>{b}</option>)}</select>
        </FL>
        <FL label="Room"><input value={f.room} onChange={e=>set("room",e.target.value)} className={IC} placeholder="e.g. A-101"/></FL>
        <FL label="Bed"><input value={f.bed} onChange={e=>set("bed",e.target.value)} className={IC} placeholder="e.g. Bed 1"/></FL>
        <FL label="Check-In Date"><input value={f.checkIn} onChange={e=>set("checkIn",e.target.value)} className={IC}/></FL>
        <FL label="Warden"><input value={f.warden} onChange={e=>set("warden",e.target.value)} className={IC} placeholder="Warden name"/></FL>
      </div>
      <SC saveLabel={data ? "Save Changes" : "Allocate Bed"} onSave={()=>onSave(f)} onClose={onClose}/>
    </Modal>
  );
}

// ─── VISITOR CHECK-IN MODAL ───────────────────────────────────────────────────
export function VisitorModal({ nextBadge, onSave, onClose }: {
  nextBadge: string; onSave: (v: Visitor) => void; onClose: () => void;
}) {
  const [f, setF] = useState<Visitor>({
    badge:nextBadge, name:"", purpose:"", checkIn:"", checkOut:"—", host:"", status:"Inside",
  });
  const set = (k: keyof Visitor, v: string) => setF(p => ({ ...p, [k]:v }));
  const now = new Date().toTimeString().slice(0,5);
  return (
    <Modal title="Check In Visitor" onClose={onClose}>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <FL label="Badge #"><input value={f.badge} readOnly className={RC}/></FL>
        <FL label="Check-In Time"><input value={f.checkIn||now} onChange={e=>set("checkIn",e.target.value)} className={IC}/></FL>
        <FL label="Visitor Name *" required span><input value={f.name} onChange={e=>set("name",e.target.value)} className={IC} placeholder="Full name"/></FL>
        <FL label="Purpose *" required span><input value={f.purpose} onChange={e=>set("purpose",e.target.value)} className={IC} placeholder="Reason for visit"/></FL>
        <FL label="Host / Department" span><input value={f.host} onChange={e=>set("host",e.target.value)} className={IC} placeholder="Who is this visitor meeting?"/></FL>
      </div>
      <SC saveLabel="Check In" onSave={()=>onSave({ ...f, checkIn:f.checkIn||now })} onClose={onClose}/>
    </Modal>
  );
}

// ─── UTILITY READING MODAL ────────────────────────────────────────────────────
export function UtilityModal({ nextId, onSave, onClose }: {
  nextId: string; onSave: (u: UtilityReading) => void; onClose: () => void;
}) {
  const [type,     setType]     = useState("Electricity");
  const [building, setBuilding] = useState("");
  const [prev,     setPrev]     = useState(0);
  const [curr,     setCurr]     = useState(0);
  const unitMap: Record<string,string> = { Electricity:"kWh", Water:"L", Generator:"L", Solar:"kWh", Gas:"m³" };
  const consumed = curr - prev;
  const unit = unitMap[type] ?? "Unit";
  return (
    <Modal title="Add Utility Reading" onClose={onClose}>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <FL label="Reading ID"><input value={nextId} readOnly className={RC}/></FL>
        <FL label="Utility Type *" required>
          <select value={type} onChange={e=>setType(e.target.value)} className={IC}>{UTILITY_TYPES.map(t=><option key={t}>{t}</option>)}</select>
        </FL>
        <FL label="Building *" required>
          <select value={building} onChange={e=>setBuilding(e.target.value)} className={IC}><option value="">Select</option>{BUILDING_CODES.map(c=><option key={c}>{c}</option>)}</select>
        </FL>
        <FL label="Unit"><input value={unit} readOnly className={RC}/></FL>
        <FL label="Previous Reading"><input type="number" value={prev} onChange={e=>setPrev(+e.target.value)} className={IC}/></FL>
        <FL label="Current Reading"><input type="number" value={curr} onChange={e=>setCurr(+e.target.value)} className={IC}/></FL>
        <FL label="Consumed (auto)" span><input value={consumed} readOnly className={RC}/></FL>
      </div>
      <SC saveLabel="Save Reading" onSave={() => onSave({
        id:nextId, type, building, prev, curr, consumed, unit, cost:0,
        date:new Date().toLocaleDateString("en-US",{month:"short",day:"numeric"}),
        status: consumed > (prev * 0.25) ? "High Usage" : "Normal",
      })} onClose={onClose}/>
    </Modal>
  );
}
