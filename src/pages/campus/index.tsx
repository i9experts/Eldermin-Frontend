import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard, Building2, DoorOpen, Wrench, Truck, Home, Shield, Zap, BarChart3,
  Plus, Download, Eye, Edit2, Trash2, CheckCircle, XCircle, MapPin, Bus, UserCheck,
  AlertTriangle, Flame, Video, Wifi, Calendar,
} from "lucide-react";
import type { CampusTab, Building, Room, Ticket, Vehicle, HostelAllocation, Visitor, UtilityReading } from "./types";
import {
  INIT_BUILDINGS, INIT_ROOMS, INIT_VISITORS, INIT_UTILITIES,
  FACILITY_UTIL_DATA, TICKET_STATUS_DATA, HOSTEL_BLOCKS_DATA, AUDIT_EVENTS, PIE_COLORS,
} from "./types";
import type { ToastItem } from "./modals";
import {
  Badge, statusBV, Btn, Card, CardHeader, KPI, SearchBar, THead, Pagination,
  IconBtn, ProgBar, Toast, ConfirmDialog,
  BuildingModal, RoomModal, TicketModal, VehicleModal, HostelModal, VisitorModal, UtilityModal,
} from "./modals";
import {
  useCampusDashboard,
  useVehicles, useCreateVehicle, useUpdateVehicle,
  useRoutes,
  useHostelBlocks, useHostelAllocations, useAllocateHostel, useCheckOutHostel,
  useMaintenance, useCreateMaintenance, useUpdateMaintenanceStatus,
} from "../../hooks/useCampus";

const TABS: { id: CampusTab; label: string; icon: LucideIcon }[] = [
  { id:"dashboard",   label:"Dashboard",   icon:LayoutDashboard },
  { id:"buildings",   label:"Buildings",   icon:Building2       },
  { id:"rooms",       label:"Rooms",       icon:DoorOpen        },
  { id:"maintenance", label:"Maintenance", icon:Wrench          },
  { id:"transport",   label:"Transport",   icon:Truck           },
  { id:"hostel",      label:"Hostel",      icon:Home            },
  { id:"security",    label:"Security",    icon:Shield          },
  { id:"utilities",   label:"Utilities",   icon:Zap             },
  { id:"reports",     label:"Reports",     icon:BarChart3       },
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

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function DashboardTab({ onNav }: { onNav: (t: CampusTab) => void }) {
  const { data, isLoading } = useCampusDashboard();
  const d = data as any;

  if (isLoading) return <Spinner />;

  const openTickets = d?.maintenance?.open ?? 0;
  const urgentTickets = d?.maintenance?.urgent ?? 0;
  const activeVehicles = d?.transport?.activeVehicles ?? 0;
  const hostelOccupancy = d?.hostel?.occupancyRate ?? 0;
  const upcomingEvents = d?.events?.upcoming ?? 0;

  return (
    <div className="space-y-5">
      {urgentTickets > 0 && (
        <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertTriangle size={18} className="text-amber-600 flex-shrink-0"/>
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-700">{urgentTickets} Emergency Maintenance Request{urgentTickets > 1 ? 's' : ''}</p>
            <p className="text-xs text-amber-500 mt-0.5">Requires immediate attention</p>
          </div>
          <Badge v="amber">Urgent</Badge>
          <Btn variant="secondary" onClick={() => onNav("maintenance")}>View</Btn>
        </div>
      )}
      <div className="grid grid-cols-5 gap-4">
        <KPI icon={Wrench}        label="Open Tickets"     value={String(openTickets)}                              trend={0}  color="#EF9F27" />
        <KPI icon={Bus}           label="Active Vehicles"  value={String(activeVehicles)}                           trend={0}  color="#0891b2" />
        <KPI icon={Home}          label="Hostel Occupancy" value={`${hostelOccupancy}%`}                            trend={0}  color="#8b5cf6" />
        <KPI icon={AlertTriangle} label="Emergency"        value={String(urgentTickets)}                            trend={0}  color="#ef4444" />
        <KPI icon={Calendar}      label="Upcoming Events"  value={String(upcomingEvents)}                           trend={0}  color="#0C447C" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Facility Utilization by Type" sub="Configured occupancy rates"/>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={FACILITY_UTIL_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                <XAxis dataKey="type" tick={{ fontSize:11, fill:"#94a3b8" }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fontSize:11, fill:"#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v: any) => `${v}%`}/>
                <Tooltip formatter={(v: any) => [`${Number(v ?? 0)}%`, "Utilization"]} contentStyle={{ borderRadius:10, fontSize:12 }}/>
                <Bar dataKey="pct" fill="#0C447C" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <CardHeader title="Maintenance Ticket Status"/>
          <div className="p-4">
            <div className="flex flex-wrap gap-3 mb-3">
              {TICKET_STATUS_DATA.map((d,i) => (
                <div key={d.name} className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ background:PIE_COLORS[i] }}></span>
                  {d.name} ({d.value})
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={TICKET_STATUS_DATA} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                  {TICKET_STATUS_DATA.map((_,i) => <Cell key={i} fill={PIE_COLORS[i]}/>)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius:10, fontSize:12 }}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
      <Card>
        <CardHeader title="Live Activity Feed"/>
        <div className="p-4 space-y-0 divide-y divide-slate-50">
          {(d?.recentMaintenance ?? []).length > 0
            ? (d.recentMaintenance as any[]).map((e: any) => (
                <div key={e._id} className="flex items-start gap-3 py-3">
                  <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0 bg-[#0C447C]"></div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-700">{e.title} — {e.location ?? e.category}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{e.reportedBy} · {e.priority} priority · {e.status}</p>
                  </div>
                </div>
              ))
            : AUDIT_EVENTS.map(e => (
                <div key={e.id} className="flex items-start gap-3 py-3">
                  <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background:e.dot }}></div>
                  <div className="flex-1"><p className="text-sm text-slate-700">{e.desc}</p><p className="text-xs text-slate-400 mt-0.5">{e.time}</p></div>
                </div>
              ))
          }
        </div>
      </Card>
    </div>
  );
}

// ─── BUILDINGS (local state — no backend endpoint) ────────────────────────────
function BuildingsTab({ toast }: { toast: (msg: string, type?: ToastItem["type"]) => void }) {
  const [rows, setRows]   = useState<Building[]>(INIT_BUILDINGS);
  const [modal, setModal] = useState<{ type:"create"|"edit"|"view"; data?: Building } | null>(null);
  const [q,     setQ]     = useState("");
  const list = rows.filter(r => `${r.name} ${r.type} ${r.code}`.toLowerCase().includes(q.toLowerCase()));
  const next = `BLD-${String(rows.length + 1).padStart(2,"0")}`;
  const save = (b: Building) => {
    modal?.type === "create" ? setRows(p => [...p, b]) : setRows(p => p.map(x => x.code === b.code ? b : x));
    toast(modal?.type === "create" ? "Building added" : "Building updated");
    setModal(null);
  };
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-4">
        <KPI icon={Building2}   label="Total Buildings"  value={`${rows.length}`}                               color="#0C447C"/>
        <KPI icon={CheckCircle} label="Fire Safety OK"   value={`${rows.filter(r=>r.fireSafety==="Compliant").length}`} sub={`${rows.filter(r=>r.fireSafety!=="Compliant").length} pending`} color="#10b981"/>
        <KPI icon={Wrench}      label="Under Renovation" value={`${rows.filter(r=>r.status==="Renovation").length}`}    color="#EF9F27"/>
        <KPI icon={DoorOpen}    label="Total Rooms"      value={`${rows.reduce((s,b)=>s+b.rooms,0)}`}           color="#8b5cf6"/>
      </div>
      <Card>
        <CardHeader title="Building Management" sub={`${rows.length} buildings`} actions={
          <><SearchBar value={q} onChange={setQ}/><Btn variant="secondary" onClick={() => toast("Exporting…","info")}><Download size={12}/>Export</Btn><Btn variant="primary" onClick={() => setModal({ type:"create" })}><Plus size={12}/>Add Building</Btn></>
        }/>
        <div className="overflow-x-auto"><table className="w-full">
          <THead cols={["Name","Code","Type","Floors","Rooms","Capacity","Manager","Fire Safety","Status","Actions"]}/>
          <tbody>{list.map(b => (
            <tr key={b.code} className="border-t border-slate-50 hover:bg-slate-50">
              <td className="px-4 py-3 text-xs font-semibold text-slate-800">{b.name}</td>
              <td className="px-4 py-3 text-xs font-mono font-bold text-[#0C447C]">{b.code}</td>
              <td className="px-4 py-3 text-xs text-slate-600">{b.type}</td>
              <td className="px-4 py-3 text-xs text-center text-slate-700">{b.floors}</td>
              <td className="px-4 py-3 text-xs text-center text-slate-700">{b.rooms}</td>
              <td className="px-4 py-3 text-xs text-slate-700">{b.capacity.toLocaleString()}</td>
              <td className="px-4 py-3 text-xs text-slate-600">{b.manager}</td>
              <td className="px-4 py-3"><Badge v={b.fireSafety==="Compliant"?"green":b.fireSafety==="Pending"?"amber":"red"}>{b.fireSafety}</Badge></td>
              <td className="px-4 py-3"><Badge v={statusBV(b.status)}>{b.status}</Badge></td>
              <td className="px-4 py-3"><div className="flex gap-1">
                <IconBtn icon={Eye}   title="View" color="hover:text-[#0C447C] hover:bg-blue-50"  onClick={() => setModal({ type:"view", data:b })}/>
                <IconBtn icon={Edit2} title="Edit" color="hover:text-amber-600 hover:bg-amber-50" onClick={() => setModal({ type:"edit", data:b })}/>
              </div></td>
            </tr>
          ))}</tbody>
        </table></div>
        <Pagination total={rows.length} showing={list.length}/>
      </Card>
      {modal && <BuildingModal mode={modal.type} data={modal.data} nextCode={next} onSave={save} onClose={() => setModal(null)}/>}
    </div>
  );
}

// ─── ROOMS (local state — no backend endpoint) ────────────────────────────────
function RoomsTab({ toast }: { toast: (msg: string, type?: ToastItem["type"]) => void }) {
  const [rows, setRows]   = useState<Room[]>(INIT_ROOMS);
  const [modal, setModal] = useState<{ type:"create"|"edit"; data?: Room } | null>(null);
  const [q,     setQ]     = useState("");
  const list = rows.filter(r => `${r.num} ${r.building} ${r.dept}`.toLowerCase().includes(q.toLowerCase()));
  const next = `R-${String(rows.length + 1).padStart(3,"0")}`;
  const save = (r: Room) => {
    modal?.type === "create" ? setRows(p => [...p, r]) : setRows(p => p.map(x => x.num === r.num ? r : x));
    toast(modal?.type === "create" ? "Room added" : "Room updated");
    setModal(null);
  };
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-4">
        <KPI icon={DoorOpen}    label="Total Rooms"      value={`${rows.length}`}                                    color="#0C447C"/>
        <KPI icon={CheckCircle} label="Available"        value={`${rows.filter(r=>r.avail==="Available").length}`}   color="#10b981"/>
        <KPI icon={Calendar}    label="Scheduled"        value={`${rows.filter(r=>r.avail==="Scheduled").length}`}   color="#EF9F27"/>
        <KPI icon={Shield}      label="Smart Classrooms" value={`${rows.filter(r=>r.smart).length}`}                 color="#8b5cf6"/>
      </div>
      <Card>
        <CardHeader title="Room Management" sub={`${rows.length} rooms`} actions={
          <><SearchBar value={q} onChange={setQ}/><Btn variant="secondary" onClick={() => toast("Coming soon","info")}><Calendar size={12}/>Schedule</Btn><Btn variant="primary" onClick={() => setModal({ type:"create" })}><Plus size={12}/>Add Room</Btn></>
        }/>
        <div className="overflow-x-auto"><table className="w-full">
          <THead cols={["Room No.","Building","Floor","Type","Capacity","Department","Smart","Availability","Status","Actions"]}/>
          <tbody>{list.map(r => (
            <tr key={r.num} className="border-t border-slate-50 hover:bg-slate-50">
              <td className="px-4 py-3 text-xs font-mono font-bold text-[#0C447C]">{r.num}</td>
              <td className="px-4 py-3 text-xs font-mono text-slate-500">{r.building}</td>
              <td className="px-4 py-3 text-xs text-slate-600">{r.floor}</td>
              <td className="px-4 py-3 text-xs text-slate-700">{r.type}</td>
              <td className="px-4 py-3 text-xs text-center text-slate-700">{r.capacity||"—"}</td>
              <td className="px-4 py-3 text-xs text-slate-700">{r.dept}</td>
              <td className="px-4 py-3">
                {r.smart
                  ? <span className="bg-purple-50 text-purple-700 text-xs px-2 py-0.5 rounded-full font-medium border border-purple-100">Smart</span>
                  : <span className="bg-slate-100 text-slate-500 text-xs px-2 py-0.5 rounded-full font-medium">Standard</span>}
              </td>
              <td className="px-4 py-3"><Badge v={statusBV(r.avail)}>{r.avail}</Badge></td>
              <td className="px-4 py-3"><Badge v={statusBV(r.status)}>{r.status}</Badge></td>
              <td className="px-4 py-3"><div className="flex gap-1">
                <IconBtn icon={Edit2} title="Edit" color="hover:text-amber-600 hover:bg-amber-50" onClick={() => setModal({ type:"edit", data:r })}/>
              </div></td>
            </tr>
          ))}</tbody>
        </table></div>
        <Pagination total={rows.length} showing={list.length}/>
      </Card>
      {modal && <RoomModal mode={modal.type} data={modal.data} nextNum={next} onSave={save} onClose={() => setModal(null)}/>}
    </div>
  );
}

// ─── MAINTENANCE ──────────────────────────────────────────────────────────────
function MaintenanceTab({ toast }: { toast: (msg: string, type?: ToastItem["type"]) => void }) {
  const [modal, setModal] = useState<{ type:"create"|"edit"|"view"; data?: Ticket; urgent?: boolean } | null>(null);
  const [q,     setQ]     = useState("");

  const { data: apiData, isLoading } = useMaintenance();
  const createMaint = useCreateMaintenance();
  const updateStatus = useUpdateMaintenanceStatus();

  const rows: (Ticket & { _apiId: string })[] = ((apiData as any)?.data ?? []).map((m: any) => ({
    _apiId:   m._id,
    id:       m.mrNumber ?? "",
    title:    m.title ?? "",
    building: m.location ?? "—",
    priority: (() => {
      const s = m.priority as string;
      const map: Record<string,string> = { low:"Low", medium:"Medium", high:"High", emergency:"Urgent" };
      return map[s] ?? s;
    })(),
    assigned: m.assignedTo ?? "Unassigned",
    reported: m.createdAt ? new Date(m.createdAt).toLocaleDateString("en-GB", { day:"numeric", month:"short" }) : "—",
    status: (() => {
      const s = m.status as string;
      const map: Record<string,string> = { open:"New", assigned:"Pending", in_progress:"In Progress", on_hold:"On Hold", completed:"Resolved", rejected:"Rejected", cancelled:"Cancelled" };
      return map[s] ?? s;
    })(),
  }));

  const list = rows.filter(r => `${r.id} ${r.title} ${r.building}`.toLowerCase().includes(q.toLowerCase()));
  const next = `MR-${new Date().getFullYear()}-${String(1000 + rows.length).padStart(4,"0")}`;

  const save = (t: Ticket) => {
    if (modal?.type === "create") {
      createMaint.mutate({
        title:       t.title,
        description: t.title,
        category:    "other",
        priority:    t.priority?.toLowerCase() === "urgent" ? "emergency" : (t.priority?.toLowerCase() ?? "medium"),
        location:    t.building,
        reportedBy:  "Admin",
      }, {
        onSuccess: () => { toast("Ticket created"); setModal(null); },
        onError: () => { toast("Failed to create ticket", "error"); setModal(null); },
      });
    } else {
      toast("Ticket updated"); setModal(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-4">
        <KPI icon={Wrench}        label="Open Tickets"     value={`${rows.filter(r=>r.status!=="Resolved").length}`} trend={0} color="#0C447C"/>
        <KPI icon={AlertTriangle} label="Urgent / Overdue" value={`${rows.filter(r=>r.priority==="Urgent").length}`}          color="#ef4444"/>
        <KPI icon={Calendar}      label="In Progress"      value={`${rows.filter(r=>r.status==="In Progress").length}`}        color="#EF9F27"/>
        <KPI icon={CheckCircle}   label="Resolved"         value={`${rows.filter(r=>r.status==="Resolved").length}`} trend={0} color="#10b981"/>
      </div>
      <Card>
        <CardHeader title="Maintenance Tickets" sub={`${rows.length} total`} actions={
          <><SearchBar value={q} onChange={setQ}/>
          <Btn variant="danger" onClick={() => setModal({ type:"create", urgent:true })}><AlertTriangle size={12}/>Report Issue</Btn>
          <Btn variant="primary" onClick={() => setModal({ type:"create" })}><Plus size={12}/>New Ticket</Btn></>
        }/>
        {isLoading ? <Spinner /> : (
          <div className="overflow-x-auto"><table className="w-full">
            <THead cols={["Ticket ID","Title","Location","Priority","Assigned To","Reported","Status","Actions"]}/>
            <tbody>
              {list.length === 0 ? <EmptyState message="No maintenance tickets yet" /> : list.map(t => (
                <tr key={t._apiId} className={`border-t border-slate-50 hover:bg-slate-50 ${t.status==="Overdue"?"bg-red-50/40":t.status==="New"?"bg-blue-50/20":""}`}>
                  <td className="px-4 py-3 text-xs font-mono font-bold text-[#0C447C]">{t.id}</td>
                  <td className="px-4 py-3 text-xs font-semibold text-slate-800">{t.title}</td>
                  <td className="px-4 py-3 text-xs font-mono text-slate-500">{t.building}</td>
                  <td className="px-4 py-3"><Badge v={statusBV(t.priority)}>{t.priority}</Badge></td>
                  <td className="px-4 py-3 text-xs text-slate-600">{t.assigned}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{t.reported}</td>
                  <td className="px-4 py-3"><Badge v={statusBV(t.status)}>{t.status}</Badge></td>
                  <td className="px-4 py-3"><div className="flex gap-1">
                    <IconBtn icon={Eye}         title="View"    color="hover:text-[#0C447C] hover:bg-blue-50"       onClick={() => setModal({ type:"view", data:t })}/>
                    <IconBtn icon={Edit2}       title="Edit"    color="hover:text-amber-600 hover:bg-amber-50"      onClick={() => setModal({ type:"edit", data:t })}/>
                    <IconBtn icon={CheckCircle} title="Resolve" color="hover:text-emerald-600 hover:bg-emerald-50"  onClick={() =>
                      updateStatus.mutate({ id: t._apiId, data: { status: "completed", completionNotes: "Resolved by admin" } }, {
                        onSuccess: () => toast("Ticket resolved"),
                        onError: () => toast("Failed", "error"),
                      })}/>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}
        <Pagination total={rows.length} showing={list.length}/>
      </Card>
      {modal && <TicketModal
        mode={modal.type}
        data={modal.urgent ? { id:next, title:"", building:"", priority:"Urgent", assigned:"", reported:"", status:"New" } : modal.data}
        nextId={next}
        onSave={save}
        onClose={() => setModal(null)}/>}
    </div>
  );
}

// ─── TRANSPORT ────────────────────────────────────────────────────────────────
function TransportTab({ toast }: { toast: (msg: string, type?: ToastItem["type"]) => void }) {
  const [modal, setModal] = useState<{ type:"create"|"edit"; data?: Vehicle & { _apiId?: string } } | null>(null);
  const [q, setQ] = useState("");

  const { data: apiData, isLoading } = useVehicles();
  const { data: routeData } = useRoutes();
  const createVehicle = useCreateVehicle();
  const updateVehicle = useUpdateVehicle();

  const rows: (Vehicle & { _apiId: string })[] = ((apiData as any)?.data ?? []).map((v: any) => ({
    _apiId:   v._id,
    id:       v.registrationNumber ?? "",
    type:     v.type ? (v.type.charAt(0).toUpperCase() + v.type.slice(1)) : "Van",
    model:    [v.make, v.model].filter(Boolean).join(" ") || "—",
    capacity: v.capacity ?? 0,
    driver:   v.driverName ?? "Unassigned",
    route:    v.assignedRouteId ?? "—",
    fuel:     60,
    status:   (() => {
      const s = v.status as string;
      const m: Record<string,string> = { active:"Active", maintenance:"Maintenance", inactive:"Inactive", retired:"Retired" };
      return m[s] ?? s;
    })(),
  }));

  const routeNames = ((routeData as any)?.data ?? []).map((r: any) => r.name as string);
  const list = rows.filter(r => `${r.id} ${r.driver} ${r.route}`.toLowerCase().includes(q.toLowerCase()));
  const next = `VEH-${String(rows.length + 1).padStart(3,"0")}`;

  const save = (v: Vehicle) => {
    if (modal?.type === "create") {
      const [make, ...rest] = v.model.split(" ");
      createVehicle.mutate({
        registrationNumber: v.id || next,
        make: make || v.model,
        model: rest.join(" ") || "",
        type: v.type?.toLowerCase().replace(/\s+/g, "_") || "van",
        capacity: v.capacity,
        driverName: v.driver,
      }, {
        onSuccess: () => { toast("Vehicle added"); setModal(null); },
        onError: () => { toast("Failed to add vehicle", "error"); setModal(null); },
      });
    } else if (modal?.type === "edit" && modal.data?._apiId) {
      updateVehicle.mutate({ id: modal.data._apiId, data: { driverName: v.driver, capacity: v.capacity } }, {
        onSuccess: () => { toast("Vehicle updated"); setModal(null); },
        onError: () => { toast("Failed", "error"); setModal(null); },
      });
    } else {
      setModal(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-4">
        <KPI icon={Truck}         label="Total Vehicles"    value={`${rows.length}`}                                                          color="#0C447C"/>
        <KPI icon={Bus}           label="Active"            value={`${rows.filter(r=>r.status==="Active").length}`}                            color="#10b981"/>
        <KPI icon={MapPin}        label="Routes Configured" value={`${((routeData as any)?.meta?.total ?? 0)}`}                               color="#EF9F27"/>
        <KPI icon={AlertTriangle} label="Maintenance"       value={`${rows.filter(r=>r.status==="Maintenance").length}`}                       color="#ef4444"/>
      </div>
      <Card>
        <CardHeader title="Vehicle Fleet" sub={`${rows.length} vehicles`} actions={
          <><SearchBar value={q} onChange={setQ}/><Btn variant="primary" onClick={() => setModal({ type:"create" })}><Plus size={12}/>Add Vehicle</Btn></>
        }/>
        {isLoading ? <Spinner /> : (
          <div className="overflow-x-auto"><table className="w-full">
            <THead cols={["Reg. Number","Type","Model","Capacity","Driver","Route","Status","Actions"]}/>
            <tbody>
              {list.length === 0 ? <EmptyState message="No vehicles registered yet" /> : list.map(v => (
                <tr key={v._apiId} className="border-t border-slate-50 hover:bg-slate-50">
                  <td className="px-4 py-3 text-xs font-mono font-bold text-[#0C447C]">{v.id}</td>
                  <td className="px-4 py-3 text-xs text-slate-700">{v.type}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">{v.model}</td>
                  <td className="px-4 py-3 text-xs text-center text-slate-700">{v.capacity}</td>
                  <td className="px-4 py-3 text-xs text-slate-700">{v.driver}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">{v.route}</td>
                  <td className="px-4 py-3"><Badge v={statusBV(v.status)}>{v.status}</Badge></td>
                  <td className="px-4 py-3"><div className="flex gap-1">
                    <IconBtn icon={Edit2}  title="Edit"  color="hover:text-amber-600 hover:bg-amber-50" onClick={() => setModal({ type:"edit", data:v })}/>
                    <IconBtn icon={MapPin} title="Track" color="hover:text-[#0C447C] hover:bg-blue-50"  onClick={() => toast("GPS tracking coming soon","info")}/>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}
        <Pagination total={rows.length} showing={list.length}/>
      </Card>
      {modal && <VehicleModal mode={modal.type} data={modal.data} nextId={next} onSave={save} onClose={() => setModal(null)}/>}
    </div>
  );
}

// ─── HOSTEL ───────────────────────────────────────────────────────────────────
function HostelTab({ toast }: { toast: (msg: string, type?: ToastItem["type"]) => void }) {
  const [modal, setModal] = useState<{ data?: HostelAllocation & { _apiId?: string } } | null>(null);
  const [conf,  setConf]  = useState<{ roll: string; _apiId: string } | null>(null);

  const { data: blocksData } = useHostelBlocks();
  const { data: allocData, isLoading } = useHostelAllocations({ status: "active" });
  const allocate   = useAllocateHostel();
  const checkOut   = useCheckOutHostel();

  const blocks: any[] = Array.isArray(blocksData) ? blocksData : [];
  const rows: (HostelAllocation & { _apiId: string })[] = ((allocData as any)?.data ?? []).map((a: any) => ({
    _apiId:   a._id,
    roll:     a.studentName ?? a._id?.slice(-6) ?? "—",
    name:     a.studentName ?? "—",
    block:    a.blockName ?? "—",
    room:     a.roomNumber ?? "—",
    bed:      a.bedNumber ?? "—",
    checkIn:  a.checkInDate ? new Date(a.checkInDate).toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" }) : "—",
    warden:   "—",
    status:   a.status === "active" ? "Active" : (a.status ?? "—"),
  }));

  const totalBeds     = blocks.reduce((s: number, b: any) => s + (b.totalBeds ?? 0), 0);
  const occupiedBeds  = blocks.reduce((s: number, b: any) => s + (b.occupiedBeds ?? 0), 0);
  const availableBeds = totalBeds - occupiedBeds;
  const next = `STU-${String(rows.length + 73).padStart(4,"0")}`;

  const save = (h: HostelAllocation) => {
    allocate.mutate({
      studentName: h.name,
      grade:       "—",
      blockName:   h.block,
      roomNumber:  h.room,
      bedNumber:   h.bed,
      checkInDate: new Date().toISOString(),
      academicYear: "2025-26",
    }, {
      onSuccess: () => { toast("Bed allocated"); setModal(null); },
      onError: () => { toast("Failed to allocate", "error"); setModal(null); },
    });
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-4">
        <KPI icon={Home}          label="Total Beds"   value={String(totalBeds > 0 ? totalBeds   : HOSTEL_BLOCKS_DATA.reduce((s,b)=>s+b.capacity,0))} color="#0C447C"/>
        <KPI icon={CheckCircle}   label="Occupied"     value={String(rows.length)} sub="active allocations" color="#10b981"/>
        <KPI icon={Calendar}      label="Available"    value={String(availableBeds > 0 ? availableBeds : HOSTEL_BLOCKS_DATA.reduce((s,b)=>s+b.capacity-b.occupied,0))} color="#EF9F27"/>
        <KPI icon={AlertTriangle} label="Blocks"       value={String(blocks.length > 0 ? blocks.length : HOSTEL_BLOCKS_DATA.length)} color="#8b5cf6"/>
      </div>
      {blocks.length > 0 ? (
        <div className="grid grid-cols-3 gap-4">
          {blocks.map((b: any, i: number) => {
            const pct = b.totalBeds > 0 ? Math.round((b.occupiedBeds / b.totalBeds) * 100) : 0;
            const colors = ["#0C447C","#8b5cf6","#10b981"];
            return (
              <Card key={b._id} className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div><p className="font-semibold text-slate-800 text-sm">{b.name}</p><p className="text-xs text-slate-400 mt-0.5">{b.wardenName ?? "—"}</p></div>
                  <div className="text-right"><p className="text-2xl font-bold" style={{ color:colors[i%3] }}>{pct}%</p><p className="text-xs text-slate-400">Occupancy</p></div>
                </div>
                <ProgBar pct={pct} color={colors[i%3]}/>
                <div className="flex justify-between mt-3 text-xs text-slate-500"><span>{b.occupiedBeds} occupied</span><span>{b.totalBeds - b.occupiedBeds} available</span></div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {HOSTEL_BLOCKS_DATA.map((b,i) => (
            <Card key={b.name} className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div><p className="font-semibold text-slate-800 text-sm">{b.name}</p><p className="text-xs text-slate-400 mt-0.5">{b.warden}</p></div>
                <div className="text-right"><p className="text-2xl font-bold" style={{ color:i===0?"#0C447C":i===1?"#8b5cf6":"#10b981" }}>{b.pct}%</p><p className="text-xs text-slate-400">Occupancy</p></div>
              </div>
              <ProgBar pct={b.pct} color={i===0?"#0C447C":i===1?"#8b5cf6":"#10b981"}/>
              <div className="flex justify-between mt-3 text-xs text-slate-500"><span>{b.occupied} occupied</span><span>{b.capacity-b.occupied} available</span></div>
            </Card>
          ))}
        </div>
      )}
      <Card>
        <CardHeader title="Hostel Allocation List" sub={`${rows.length} students`} actions={
          <Btn variant="primary" onClick={() => setModal({})}><Plus size={12}/>Allocate Bed</Btn>
        }/>
        {isLoading ? <Spinner /> : (
          <div className="overflow-x-auto"><table className="w-full">
            <THead cols={["Student Name","Block","Room","Bed","Check-In","Status","Actions"]}/>
            <tbody>
              {rows.length === 0 ? <EmptyState message="No hostel allocations yet" /> : rows.map(s => (
                <tr key={s._apiId} className="border-t border-slate-50 hover:bg-slate-50">
                  <td className="px-4 py-3 text-xs font-semibold text-slate-800">{s.name}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">{s.block}</td>
                  <td className="px-4 py-3 text-xs font-mono text-slate-500">{s.room}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">{s.bed}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{s.checkIn}</td>
                  <td className="px-4 py-3"><Badge v="green">{s.status}</Badge></td>
                  <td className="px-4 py-3"><div className="flex gap-1">
                    <IconBtn icon={Edit2}  title="Edit"   color="hover:text-amber-600 hover:bg-amber-50" onClick={() => setModal({ data: s })}/>
                    <IconBtn icon={Trash2} title="Vacate" color="hover:text-red-500 hover:bg-red-50"     onClick={() => setConf({ roll: s.name, _apiId: s._apiId })}/>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}
        <Pagination total={rows.length} showing={rows.length}/>
      </Card>
      {modal && <HostelModal data={modal.data} nextRoll={next} onSave={save} onClose={() => setModal(null)}/>}
      {conf  && <ConfirmDialog title="Vacate Bed" message={`Remove allocation for ${conf.roll}?`} confirmLabel="Vacate"
        onConfirm={() => {
          checkOut.mutate(conf._apiId, {
            onSuccess: () => { toast("Allocation removed", "error"); setConf(null); },
            onError: () => { toast("Failed to check out", "error"); setConf(null); },
          });
        }}
        onClose={() => setConf(null)}/>}
    </div>
  );
}

// ─── SECURITY (local state — no backend endpoint) ─────────────────────────────
function SecurityTab({ toast }: { toast: (msg: string, type?: ToastItem["type"]) => void }) {
  const [rows, setRows]    = useState<Visitor[]>(INIT_VISITORS);
  const [showModal, setShowModal] = useState(false);
  const [conf,  setConf]   = useState<string | null>(null);
  const [q,     setQ]      = useState("");
  const list = rows.filter(r => `${r.name} ${r.purpose} ${r.badge}`.toLowerCase().includes(q.toLowerCase()));
  const nextBadge = `V-${String(841 + rows.length).padStart(4,"0")}`;
  const checkin = (v: Visitor) => { setRows(p => [v, ...p]); toast(`${v.name} checked in`); setShowModal(false); };
  const checkout = (badge: string) => {
    const now = new Date().toTimeString().slice(0,5);
    setRows(p => p.map(r => r.badge===badge?{ ...r, checkOut:now, status:"Checked Out" }:r));
    toast("Visitor checked out");
    setConf(null);
  };
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-4">
        <KPI icon={UserCheck}     label="Visitors Today"    value={`${rows.length}`}                                      trend={0} color="#0C447C"/>
        <KPI icon={Shield}        label="Currently Inside"  value={`${rows.filter(r=>r.status==="Inside").length}`}                 color="#8b5cf6"/>
        <KPI icon={AlertTriangle} label="Checked Out"       value={`${rows.filter(r=>r.status==="Checked Out").length}`}             color="#10b981"/>
        <KPI icon={Video}         label="CCTV Online"       value="45/48"                                                            color="#0C447C"/>
      </div>
      <Card>
        <CardHeader title="Visitor Log — Today" actions={
          <><SearchBar value={q} onChange={setQ}/><Btn variant="secondary" onClick={() => toast("Exporting…","info")}><Download size={12}/>Export</Btn><Btn variant="primary" onClick={() => setShowModal(true)}><Plus size={12}/>Check In Visitor</Btn></>
        }/>
        <div className="overflow-x-auto"><table className="w-full">
          <THead cols={["Visitor Name","Purpose","Badge #","Check-In","Check-Out","Host","Status","Actions"]}/>
          <tbody>{list.map(v => (
            <tr key={v.badge} className="border-t border-slate-50 hover:bg-slate-50">
              <td className="px-4 py-3 text-xs font-semibold text-slate-800">{v.name}</td>
              <td className="px-4 py-3 text-xs text-slate-600">{v.purpose}</td>
              <td className="px-4 py-3 text-xs font-mono font-bold text-[#0C447C]">{v.badge}</td>
              <td className="px-4 py-3 text-xs text-slate-500">{v.checkIn}</td>
              <td className="px-4 py-3 text-xs text-slate-500">{v.checkOut}</td>
              <td className="px-4 py-3 text-xs text-slate-600">{v.host}</td>
              <td className="px-4 py-3"><Badge v={statusBV(v.status)}>{v.status}</Badge></td>
              <td className="px-4 py-3"><div className="flex gap-1">
                <IconBtn icon={Eye} title="View" color="hover:text-[#0C447C] hover:bg-blue-50" onClick={() => toast(`${v.name} — ${v.purpose}`,"info")}/>
                {v.status==="Inside" && <IconBtn icon={XCircle} title="Check Out" color="hover:text-emerald-600 hover:bg-emerald-50" onClick={() => setConf(v.badge)}/>}
              </div></td>
            </tr>
          ))}</tbody>
        </table></div>
        <Pagination total={rows.length} showing={list.length}/>
      </Card>
      {showModal && <VisitorModal nextBadge={nextBadge} onSave={checkin} onClose={() => setShowModal(false)}/>}
      {conf  && <ConfirmDialog title="Check Out Visitor" message={`Check out visitor ${conf}?`} confirmLabel="Check Out" variant="primary"
        onConfirm={() => checkout(conf)} onClose={() => setConf(null)}/>}
    </div>
  );
}

// ─── UTILITIES (local state — no backend endpoint) ────────────────────────────
function UtilitiesTab({ toast }: { toast: (msg: string, type?: ToastItem["type"]) => void }) {
  const [rows, setRows]   = useState<UtilityReading[]>(INIT_UTILITIES);
  const [showModal, setShowModal] = useState(false);
  const [q,         setQ]  = useState("");
  const list = rows.filter(r => `${r.type} ${r.building}`.toLowerCase().includes(q.toLowerCase()));
  const next = `UTL-${String(rows.length + 1).padStart(3,"0")}`;
  const save = (u: UtilityReading) => { setRows(p => [u, ...p]); toast("Reading saved"); setShowModal(false); };
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-5 gap-4">
        <KPI icon={Zap}           label="kWh Electricity"  value="48,200" trend={-4}  color="#EF9F27"/>
        <KPI icon={Wifi}          label="Solar Generation" value="8,200"  trend={8}   color="#10b981"/>
        <KPI icon={Flame}         label="Generator Litres" value="320"    trend={12}  color="#94a3b8"/>
        <KPI icon={CheckCircle}   label="Internet Uptime"  value="99.8%"              color="#0C447C"/>
        <KPI icon={AlertTriangle} label="High Usage Alerts" value={`${rows.filter(r=>r.status==="High Usage").length}`} color="#ef4444"/>
      </div>
      <Card>
        <CardHeader title="Electricity Consumption" sub="This Month by Building"/>
        <div className="p-4">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={[{b:"MAB-01",k:2420},{b:"SLB-02",k:1950},{b:"BHA-04",k:1100},{b:"AFB-03",k:870},{b:"ICB-08",k:640}]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
              <XAxis dataKey="b" tick={{ fontSize:11, fill:"#94a3b8" }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize:11, fill:"#94a3b8" }} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{ borderRadius:10, fontSize:12 }}/>
              <Bar dataKey="k" fill="#EF9F27" radius={[4,4,0,0]} name="kWh"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <Card>
        <CardHeader title="Utility Meter Readings" actions={
          <><SearchBar value={q} onChange={setQ}/><Btn variant="primary" onClick={() => setShowModal(true)}><Plus size={12}/>Add Reading</Btn></>
        }/>
        <div className="overflow-x-auto"><table className="w-full">
          <THead cols={["Type","Building","Prev","Current","Consumed","Unit","Cost (PKR)","Date","Status"]}/>
          <tbody>{list.map(u => (
            <tr key={u.id} className="border-t border-slate-50 hover:bg-slate-50">
              <td className="px-4 py-3 text-xs font-semibold text-slate-800">{u.type}</td>
              <td className="px-4 py-3 text-xs font-mono text-slate-500">{u.building}</td>
              <td className="px-4 py-3 text-xs font-mono text-slate-600">{u.prev.toLocaleString()}</td>
              <td className="px-4 py-3 text-xs font-mono text-slate-600">{u.curr.toLocaleString()}</td>
              <td className="px-4 py-3 text-xs font-mono font-bold text-slate-800">{u.consumed.toLocaleString()}</td>
              <td className="px-4 py-3 text-xs text-slate-500">{u.unit}</td>
              <td className="px-4 py-3 text-xs font-mono text-slate-700">{u.cost.toLocaleString()}</td>
              <td className="px-4 py-3 text-xs text-slate-500">{u.date}</td>
              <td className="px-4 py-3"><Badge v={u.status==="Normal"?"green":"red"}>{u.status}</Badge></td>
            </tr>
          ))}</tbody>
        </table></div>
        <Pagination total={rows.length} showing={list.length}/>
      </Card>
      {showModal && <UtilityModal nextId={next} onSave={save} onClose={() => setShowModal(false)}/>}
    </div>
  );
}

// ─── REPORTS ──────────────────────────────────────────────────────────────────
const CAMPUS_REPORTS = [
  { name:"Operations Overview",        desc:"Daily campus operations summary dashboard",     period:"Jun 2026"   },
  { name:"Building Inspection Report", desc:"Fire safety, structural and compliance checks", period:"Q2 FY26"   },
  { name:"Maintenance Summary",        desc:"Ticket resolution rates and pending analysis",  period:"Jun 2026"   },
  { name:"Transport Utilization",      desc:"Route efficiency, fuel, and on-time delivery",  period:"Jun 2026"   },
  { name:"Hostel Occupancy Report",    desc:"Block-wise occupancy and bed management",       period:"Jun 2026"   },
  { name:"Visitor & Gate Log",         desc:"Security log with visitor trends",              period:"Jun 2026"   },
  { name:"Utility Consumption Report", desc:"Electricity, water, generator, solar analysis", period:"Jun 2026"   },
  { name:"Annual Operations Report",   desc:"Full year campus operations performance",       period:"FY 2024–25" },
];

function ReportsTab({ toast }: { toast: (msg: string, type?: ToastItem["type"]) => void }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-4">
        <KPI icon={BarChart3}   label="Reports Available"  value="24"  color="#0C447C"/>
        <KPI icon={Download}    label="Exports (MTD)"      value="11"  color="#10b981"/>
        <KPI icon={Calendar}    label="Scheduled Reports"  value="4"   color="#EF9F27"/>
        <KPI icon={CheckCircle} label="Board Reports Sent" value="1"   color="#8b5cf6"/>
      </div>
      <Card>
        <CardHeader title="Campus Operations Reports" sub="Generate, export and schedule reports"/>
        <div className="p-5 grid grid-cols-2 gap-3">
          {CAMPUS_REPORTS.map(r => (
            <div key={r.name} className="flex items-start justify-between gap-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-[#0C447C]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BarChart3 size={16} className="text-[#0C447C]"/>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{r.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{r.desc}</p>
                  <p className="text-xs text-slate-500 mt-1">{r.period}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <Badge v="green">Ready</Badge>
                <IconBtn icon={Download} title="Download" color="hover:text-[#0C447C] hover:bg-white" onClick={() => toast(`Downloading ${r.name}…`,"info")}/>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function CampusPage() {
  const [tab, setTab] = useState<CampusTab>("dashboard");
  const { toasts, toast } = useToast();

  const { data: maintenanceData } = useMaintenance();
  const openTickets = ((maintenanceData as any)?.meta?.total ?? 0);

  return (
    <div className="space-y-0">
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 -mx-6 px-6 mb-6">
        <div className="flex gap-0.5 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`relative flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${tab===t.id?"border-[#0C447C] text-[#0C447C]":"border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"}`}>
              <t.icon className="w-4 h-4"/><span>{t.label}</span>
              {t.id === "maintenance" && openTickets > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold leading-none">
                  {openTickets > 9 ? "9+" : openTickets}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
      <div className="px-6 pb-6">
        {tab==="dashboard"   && <DashboardTab   onNav={setTab}/>}
        {tab==="buildings"   && <BuildingsTab   toast={toast}/>}
        {tab==="rooms"       && <RoomsTab       toast={toast}/>}
        {tab==="maintenance" && <MaintenanceTab toast={toast}/>}
        {tab==="transport"   && <TransportTab   toast={toast}/>}
        {tab==="hostel"      && <HostelTab      toast={toast}/>}
        {tab==="security"    && <SecurityTab    toast={toast}/>}
        {tab==="utilities"   && <UtilitiesTab   toast={toast}/>}
        {tab==="reports"     && <ReportsTab     toast={toast}/>}
      </div>
      <Toast toasts={toasts}/>
    </div>
  );
}
