// ─── TYPES ────────────────────────────────────────────────────────────────────
export type CampusTab =
  | "dashboard" | "buildings" | "rooms" | "maintenance"
  | "transport" | "hostel" | "security" | "utilities" | "reports";

export interface Building {
  code: string; name: string; type: string;
  floors: number; rooms: number; capacity: number;
  manager: string; fireSafety: string; status: string;
}

export interface Room {
  num: string; building: string; floor: string; type: string;
  capacity: number; dept: string; smart: boolean; avail: string; status: string;
}

export interface Ticket {
  id: string; title: string; building: string; priority: string;
  assigned: string; reported: string; status: string;
}

export interface Vehicle {
  id: string; type: string; model: string; capacity: number;
  driver: string; route: string; fuel: number; status: string;
}

export interface HostelAllocation {
  roll: string; name: string; block: string; room: string;
  bed: string; checkIn: string; warden: string; status: string;
}

export interface Visitor {
  badge: string; name: string; purpose: string;
  checkIn: string; checkOut: string; host: string; status: string;
}

export interface UtilityReading {
  id: string; type: string; building: string;
  prev: number; curr: number; consumed: number;
  unit: string; cost: number; date: string; status: string;
}

// ─── OPTION LISTS ─────────────────────────────────────────────────────────────
export const BUILDING_TYPES = ["Academic","Laboratory","Administrative","Hostel","Sports","Library","Medical","Cafeteria"];
export const ROOM_TYPES     = ["Classroom","Lab","Office","Meeting Room","Store Room","Lecture Hall","Auditorium"];
export const VEHICLE_TYPES  = ["School Bus","Mini Bus","School Van","Staff Vehicle","Ambulance"];
export const HOSTEL_BLOCKS  = ["Block A (Boys)","Block B (Girls)","Block C (Staff)"];
export const UTILITY_TYPES  = ["Electricity","Water","Generator","Solar","Gas"];
export const FIRE_STATUSES  = ["Compliant","Pending","Overdue"];
export const PRIORITIES     = ["Urgent","High","Medium","Low"];
export const DEPTS          = ["Mathematics","English","Physics","Chemistry","Biology","Computer Science","Principal","Admin","HR","Finance","Facility"];
export const BUILDING_CODES = ["MAB-01","SLB-02","AFB-03","BHA-04","GHB-05","SG-06","LMC-07","ICB-08"];

// ─── SEED DATA ────────────────────────────────────────────────────────────────
export const INIT_BUILDINGS: Building[] = [
  { code:"MAB-01", name:"Main Academic Block",   type:"Academic",       floors:4, rooms:64, capacity:2400, manager:"Dr. Tariq Mahmood",  fireSafety:"Compliant", status:"Active"       },
  { code:"SLB-02", name:"Science & Lab Block",   type:"Laboratory",     floors:3, rooms:28, capacity:840,  manager:"Prof. Sara Ahmed",    fireSafety:"Compliant", status:"Active"       },
  { code:"AFB-03", name:"Admin & Faculty Block", type:"Administrative", floors:2, rooms:42, capacity:600,  manager:"Mr. Khalid Hussain",  fireSafety:"Compliant", status:"Active"       },
  { code:"BHA-04", name:"Boys Hostel Block A",   type:"Hostel",         floors:3, rooms:80, capacity:160,  manager:"Warden Hassan Ali",   fireSafety:"Compliant", status:"Active"       },
  { code:"GHB-05", name:"Girls Hostel Block B",  type:"Hostel",         floors:3, rooms:70, capacity:140,  manager:"Warden Fatima Zaidi", fireSafety:"Compliant", status:"Active"       },
  { code:"SG-06",  name:"Sports & Gymnasium",    type:"Sports",         floors:1, rooms:12, capacity:500,  manager:"Coach Ali Raza",      fireSafety:"Pending",   status:"Partial Use" },
  { code:"LMC-07", name:"Library & Media Ctr",   type:"Library",        floors:2, rooms:8,  capacity:320,  manager:"Ms. Nadia Khan",      fireSafety:"Overdue",   status:"Renovation"  },
  { code:"ICB-08", name:"IT & Computer Block",   type:"Academic",       floors:2, rooms:18, capacity:360,  manager:"Mr. Zia Ahmad",       fireSafety:"Compliant", status:"Active"       },
];

export const INIT_ROOMS: Room[] = [
  { num:"101",      building:"MAB-01", floor:"G", type:"Classroom",   capacity:60, dept:"Mathematics", smart:true,  avail:"Available", status:"Active" },
  { num:"102",      building:"MAB-01", floor:"G", type:"Classroom",   capacity:60, dept:"English",     smart:true,  avail:"Occupied",  status:"Active" },
  { num:"Lab-01",   building:"SLB-02", floor:"1", type:"Lab",         capacity:30, dept:"Physics",     smart:false, avail:"Scheduled", status:"Active" },
  { num:"Lab-02",   building:"SLB-02", floor:"1", type:"Lab",         capacity:30, dept:"Chemistry",   smart:false, avail:"Available", status:"Active" },
  { num:"205",      building:"MAB-01", floor:"2", type:"Office",      capacity:10, dept:"Principal",   smart:false, avail:"Occupied",  status:"Active" },
  { num:"Conf-A",   building:"AFB-03", floor:"1", type:"Meeting Room",capacity:20, dept:"Admin",       smart:true,  avail:"Available", status:"Active" },
  { num:"Store-01", building:"MAB-01", floor:"G", type:"Store Room",  capacity:0,  dept:"Facility",    smart:false, avail:"N/A",       status:"Active" },
];

export const INIT_TICKETS: Ticket[] = [
  { id:"MNT-0124", title:"Electrical fault — Lab Block B",      building:"SLB-02", priority:"High",   assigned:"Usman Tariq",   reported:"May 15", status:"In Progress" },
  { id:"MNT-0123", title:"Generator maintenance overdue",        building:"AFB-03", priority:"High",   assigned:"Usman Tariq",   reported:"May 12", status:"Overdue"     },
  { id:"MNT-0122", title:"Classroom 201 projector calibration",  building:"MAB-01", priority:"Medium", assigned:"Zia Ahmad",     reported:"May 14", status:"Pending"     },
  { id:"MNT-0121", title:"Plumbing leak — Girls Hostel 2nd fl", building:"GHB-05", priority:"High",   assigned:"Khalid Pervez", reported:"May 13", status:"In Progress" },
  { id:"MNT-0120", title:"Fire exit door faulty — Block A",      building:"BHA-04", priority:"Urgent", assigned:"Unassigned",    reported:"May 15", status:"New"         },
  { id:"MNT-0119", title:"CCTV camera offline — Main Gate",      building:"Main",   priority:"Medium", assigned:"Zia Ahmad",     reported:"May 11", status:"Resolved"    },
];

export const INIT_VEHICLES: Vehicle[] = [
  { id:"LEA-001", type:"School Bus",    model:"Hino FC9",       capacity:55, driver:"Rafiq Khan",    route:"Route 1 – Gulberg",    fuel:72, status:"En Route"   },
  { id:"LEA-002", type:"School Bus",    model:"Hino FC9",       capacity:55, driver:"Anwar Shah",    route:"Route 2 – DHA",        fuel:48, status:"At School"  },
  { id:"LEA-003", type:"Mini Bus",      model:"Toyota Coaster", capacity:28, driver:"Tariq Bashir",  route:"Route 3 – Johar Town", fuel:91, status:"En Route"   },
  { id:"LEA-004", type:"School Van",    model:"Toyota Hiace",   capacity:14, driver:"Imtiaz Ahmed",  route:"Route 4 – Model Town", fuel:35, status:"Parked"     },
  { id:"LEA-005", type:"Staff Vehicle", model:"Toyota Corolla", capacity:5,  driver:"N/A",           route:"Admin Use",            fuel:60, status:"Available"  },
];

export const INIT_HOSTEL: HostelAllocation[] = [
  { roll:"STU-0021", name:"Hamza Ali",     block:"Block A", room:"A-101", bed:"Bed 1", checkIn:"Sep 01, 2024", warden:"Warden Hassan Ali",   status:"Active" },
  { roll:"STU-0034", name:"Zubair Ahmed",  block:"Block A", room:"A-101", bed:"Bed 2", checkIn:"Sep 01, 2024", warden:"Warden Hassan Ali",   status:"Active" },
  { roll:"STU-0058", name:"Fatima Malik",  block:"Block B", room:"B-201", bed:"Bed 1", checkIn:"Sep 03, 2024", warden:"Warden Fatima Zaidi", status:"Active" },
  { roll:"STU-0072", name:"Khadija Tariq", block:"Block B", room:"B-202", bed:"Bed 1", checkIn:"Sep 05, 2024", warden:"Warden Fatima Zaidi", status:"Active" },
];

export const INIT_VISITORS: Visitor[] = [
  { badge:"V-0841", name:"Ahmad Qureshi",   purpose:"Meeting Principal",  checkIn:"09:15", checkOut:"10:30", host:"Principal Office", status:"Checked Out" },
  { badge:"V-0842", name:"Mrs. Sana Tariq", purpose:"Parent Meeting",     checkIn:"10:00", checkOut:"—",     host:"Class Teacher",    status:"Inside"      },
  { badge:"V-0843", name:"Delivery – TCS",  purpose:"Package Delivery",   checkIn:"11:20", checkOut:"11:35", host:"Admin Office",     status:"Checked Out" },
  { badge:"V-0844", name:"Mr. Hamza Rehman",purpose:"Job Interview",      checkIn:"14:00", checkOut:"—",     host:"HR Office",        status:"Inside"      },
  { badge:"V-0845", name:"Contractor – Elec",purpose:"Maintenance Visit", checkIn:"08:00", checkOut:"12:00", host:"Facility Manager", status:"Checked Out" },
];

export const INIT_UTILITIES: UtilityReading[] = [
  { id:"UTL-001", type:"Electricity", building:"MAB-01", prev:12400, curr:14820, consumed:2420, unit:"kWh", cost:96800, date:"May 14", status:"Normal"    },
  { id:"UTL-002", type:"Electricity", building:"SLB-02", prev:8200,  curr:10150, consumed:1950, unit:"kWh", cost:78000, date:"May 14", status:"High Usage" },
  { id:"UTL-003", type:"Water",       building:"BHA-04", prev:4200,  curr:4900,  consumed:700,  unit:"L",   cost:2100,  date:"May 14", status:"Normal"    },
  { id:"UTL-004", type:"Generator",   building:"Admin",  prev:1240,  curr:1560,  consumed:320,  unit:"L",   cost:64000, date:"May 13", status:"High Usage" },
  { id:"UTL-005", type:"Solar",       building:"All",    prev:0,     curr:8200,  consumed:8200, unit:"kWh", cost:0,     date:"May 14", status:"Normal"    },
];

// ─── CHART DATA ───────────────────────────────────────────────────────────────
export const FACILITY_UTIL_DATA = [
  { type:"Academic", pct:88 }, { type:"Admin",   pct:75 },
  { type:"Lab",      pct:92 }, { type:"Sports",  pct:45 },
  { type:"Hostel",   pct:87 }, { type:"Library", pct:62 },
];

export const TICKET_STATUS_DATA = [
  { name:"New",         value:4 }, { name:"In Progress", value:5 },
  { name:"On Hold",     value:2 }, { name:"Resolved",    value:8 },
];

export const HOSTEL_BLOCKS_DATA = [
  { name:"Block A (Boys)",  capacity:160, occupied:142, pct:89, warden:"Warden Hassan Ali"   },
  { name:"Block B (Girls)", capacity:140, occupied:118, pct:84, warden:"Warden Fatima Zaidi" },
  { name:"Block C (Staff)", capacity:40,  occupied:32,  pct:80, warden:"Admin Office"         },
];

export const AUDIT_EVENTS = [
  { id:"MNT-0124", time:"5 min ago",  desc:"Ticket assigned to Usman Tariq — Electrical fault, Lab Block B",          dot:"#0C447C" },
  { id:"TRP-001",  time:"22 min ago", desc:"Bus LEA-001 completed Route 1 – Gulberg morning pickup",                  dot:"#10b981" },
  { id:"SEC-001",  time:"35 min ago", desc:"Visitor Ahmad Qureshi checked in at Main Gate — Meeting Principal",        dot:"#EF9F27" },
  { id:"SEC-002",  time:"1 hr ago",   desc:"Gate Pass GP-2045 overdue — Student Hamza Ali has not returned",          dot:"#ef4444" },
  { id:"FAC-001",  time:"2 hrs ago",  desc:"Auditorium booked for Annual Prize Day on May 20 by Admin Office",        dot:"#8b5cf6" },
  { id:"FAC-002",  time:"3 hrs ago",  desc:"Smart classroom Room 201 camera restored and back online",                dot:"#10b981" },
];

export const PIE_COLORS = ["#0C447C","#EF9F27","#94a3b8","#10b981"];
