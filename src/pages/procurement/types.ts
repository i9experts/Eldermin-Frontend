// ─── TYPES ────────────────────────────────────────────────────────────────────
export type ProcTab =
  | "dashboard" | "requisitions" | "approvals" | "purchase-orders"
  | "grn" | "vendors" | "inventory" | "assets" | "reports" | "settings";

export type Priority = "Low" | "Medium" | "High" | "Urgent";

export interface RequisitionLineItem {
  name: string;
  qty: number;
  unit: string;
  unitCost: number;
}

export interface Requisition {
  id: string;
  campus: string;        // display name (resolved from campusId for the table/view)
  campusId?: string;      // real Campus _id, sent to the backend
  dept: string;           // display name (resolved from departmentId for the table/view)
  departmentId?: string;  // real Department _id, sent to the backend
  category?: string;      // backend PurchaseRequest.category enum value, distinct from department
  by: string;
  items: number;
  amount: number;
  priority: Priority;
  status: string;
  date: string;
  justification: string;
  lineItems?: RequisitionLineItem[]; // the actual line items entered in the modal
}

export interface PurchaseOrder {
  id: string;
  vendor: string;
  vendorId?: string;      // real Vendor _id, sent to the backend
  campus: string;         // display name (resolved from campusId for the table/view)
  campusId?: string;      // real Campus _id, sent to the backend
  amount: number;
  orderDate: string;
  delivery: string;
  status: string;
  purchaseRequestId?: string; // set when raised against an approved Requisition
  prNumber?: string;          // the originating PR's number, for display
  lineItems?: RequisitionLineItem[]; // the actual line items entered in the modal
}

export interface GRN {
  id: string;
  po: string;
  vendor: string;
  receivedBy: string;
  date: string;
  items: number;
  status: string;
}

export interface Vendor {
  id: string;
  name: string;
  category: string;
  contact: string;
  phone: string;
  email: string;
  address: string;
  ntn: string;
  paymentTerms: string;
  rating: number;
  status: string;
  lastOrder: string;
}

export interface InventoryItem {
  code: string;
  name: string;
  category: string;
  unit: string;
  stock: number;
  minStock: number;
  maxStock: number;
  unitCost: number;
  campus: string;        // display name (resolved from campusId for the table/view)
  campusId?: string;     // real Campus _id, sent to the backend
  location: string;
  value: number;
  status: string;
  barcode?: string;
  imageUrl?: string;
  imageKey?: string;
}

export interface Asset {
  tag: string;
  name: string;
  category: string;
  campus: string;        // display name (resolved from campusId for the table/view)
  campusId?: string;     // real Campus _id, sent to the backend
  location: string;
  purchaseDate: string;
  price: number;
  vendor: string;        // display name (resolved from vendorId for the table/view)
  vendorId?: string;     // real Vendor _id, sent to the backend
  warranty: string;
  usefulLife: number;
  depreciation: string;
  condition: string;
  assignedTo: string;
  status: string;
}

export interface Approval {
  id: string;
  by: string;
  campus: string;
  amount: number;
  priority: Priority;
  reason: string;
  stage: string;
  level: number;
  submitted: string;
  status: string;
}

// ─── OPTION LISTS ─────────────────────────────────────────────────────────────
export const CAMPUSES = [
  "Main Campus – Karachi",
  "North Branch – Lahore",
  "East Campus – Islamabad",
  "West Wing – Faisalabad",
];
export const DEPTS = ["IT Department","Science Lab","Library","Admin","Sports","Chemistry Lab","Computer Lab","Finance","HR","Maintenance"];
// Real Purchase Request category enum (must match PurchaseRequest.category in
// eldermin-backend/src/procurement/procurement.schema.ts) — distinct from the
// requesting Department, which is a separate real entity (see DepartmentsTab).
export const PR_CATEGORIES: { value: string; label: string }[] = [
  { value: "stationery",   label: "Stationery" },
  { value: "it_equipment", label: "IT Equipment" },
  { value: "furniture",    label: "Furniture" },
  { value: "cleaning",     label: "Cleaning" },
  { value: "food",         label: "Food" },
  { value: "maintenance",  label: "Maintenance" },
  { value: "books",        label: "Books" },
  { value: "sports",       label: "Sports" },
  { value: "medical",      label: "Medical" },
  { value: "other",        label: "Other" },
];
// VENDOR_CATS / ITEM_CATS / ASSET_CATS / UOM_OPTIONS / PAYMENT_TERMS_LIST /
// DEPRECIATION_METHODS used to be hardcoded here (same anti-pattern PR #38
// fixed for Subject Category in Academics). They're now school-configurable
// master data served from /procurement/settings/* — see the
// useVendorCategories/useItemCategories/useAssetCategories/
// useUnitsOfMeasure/usePaymentTerms/useDepreciationMethods hooks in
// hooks/useProcurement.ts (consumed directly by modals.tsx and
// MasterSettingsTab.tsx) rather than a static array here.

// ─── SEED DATA ────────────────────────────────────────────────────────────────
export const INIT_REQUISITIONS: Requisition[] = [
  { id:"PR-2024-0891", campus:"Main Campus – Karachi",    dept:"IT Department",  by:"Ahmed Raza",     items:8,  amount:245000, priority:"High",   status:"Pending",  date:"2024-11-15", justification:"IT Lab upgrade – 8 desktops needed for expanded CS program" },
  { id:"PR-2024-0890", campus:"North Branch – Lahore",   dept:"Science Lab",    by:"Fatima Khan",    items:12, amount:189500, priority:"Medium", status:"Approved", date:"2024-11-14", justification:"Lab supplies restock for semester practical exams" },
  { id:"PR-2024-0889", campus:"East Campus – Islamabad", dept:"Library",        by:"Usman Ali",      items:25, amount:67200,  priority:"Low",    status:"Draft",    date:"2024-11-13", justification:"New reference books for grade 9–12 curriculum" },
  { id:"PR-2024-0888", campus:"West Wing – Faisalabad",  dept:"Admin",          by:"Sara Malik",     items:5,  amount:32000,  priority:"Urgent", status:"Rejected", date:"2024-11-12", justification:"Office stationery and consumables restock" },
  { id:"PR-2024-0887", campus:"Main Campus – Karachi",   dept:"Sports",         by:"Bilal Ahmed",    items:15, amount:156000, priority:"Medium", status:"Ordered",  date:"2024-11-11", justification:"Sports equipment for upcoming annual events" },
  { id:"PR-2024-0886", campus:"North Branch – Lahore",   dept:"Chemistry Lab",  by:"Hina Nasir",     items:20, amount:421000, priority:"High",   status:"Received", date:"2024-11-10", justification:"Chemicals and glassware for practical sessions" },
  { id:"PR-2024-0885", campus:"East Campus – Islamabad", dept:"Computer Lab",   by:"Zara Qureshi",   items:6,  amount:890000, priority:"Urgent", status:"Pending",  date:"2024-11-09", justification:"Server replacement – admin network down since Nov 8" },
  { id:"PR-2024-0884", campus:"West Wing – Faisalabad",  dept:"HR",             by:"Noman Yusuf",    items:4,  amount:28000,  priority:"Low",    status:"Draft",    date:"2024-11-08", justification:"HR stationery and onboarding materials" },
  { id:"PR-2024-0883", campus:"Main Campus – Karachi",   dept:"Finance",        by:"Sana Mirza",     items:3,  amount:45000,  priority:"Medium", status:"Approved", date:"2024-11-07", justification:"Accounting software license renewal for FY2025" },
  { id:"PR-2024-0882", campus:"North Branch – Lahore",   dept:"Science Lab",    by:"Noman Yusuf",    items:9,  amount:56000,  priority:"Medium", status:"Pending",  date:"2024-11-07", justification:"Science lab consumables for term-end exams" },
  { id:"PR-2024-0881", campus:"East Campus – Islamabad", dept:"IT Department",  by:"Asif Khan",      items:7,  amount:320000, priority:"High",   status:"Draft",    date:"2024-11-06", justification:"Network switches for campus connectivity upgrade" },
  { id:"PR-2024-0880", campus:"Main Campus – Karachi",   dept:"Library",        by:"Rabia Siddiqui", items:30, amount:95000,  priority:"Low",    status:"Approved", date:"2024-11-05", justification:"Reference books and periodicals for new batch" },
];

export const INIT_POS: PurchaseOrder[] = [
  { id:"PO-2024-0312", vendor:"TechVision Supplies",  campus:"Main Campus – Karachi",    amount:485000,  orderDate:"2024-11-10", delivery:"2024-11-25", status:"Active"             },
  { id:"PO-2024-0311", vendor:"Al-Baraka Traders",    campus:"North Branch – Lahore",    amount:127500,  orderDate:"2024-11-08", delivery:"2024-11-18", status:"Delivered"          },
  { id:"PO-2024-0310", vendor:"Crescent Stationery",  campus:"East Campus – Islamabad",  amount:34800,   orderDate:"2024-11-07", delivery:"2024-11-14", status:"Overdue"            },
  { id:"PO-2024-0309", vendor:"Global Lab Equip",     campus:"West Wing – Faisalabad",   amount:672000,  orderDate:"2024-11-05", delivery:"2024-11-30", status:"Active"             },
  { id:"PO-2024-0308", vendor:"Future IT Hub",        campus:"Main Campus – Karachi",    amount:1250000, orderDate:"2024-11-03", delivery:"2024-11-20", status:"Partially Received" },
  { id:"PO-2024-0307", vendor:"Global Lab Equip",     campus:"North Branch – Lahore",    amount:89400,   orderDate:"2024-10-28", delivery:"2024-11-10", status:"Delivered"          },
  { id:"PO-2024-0306", vendor:"Fast Forward Books",   campus:"East Campus – Islamabad",  amount:210000,  orderDate:"2024-10-25", delivery:"2024-11-05", status:"Delivered"          },
  { id:"PO-2024-0305", vendor:"TechVision Supplies",  campus:"West Wing – Faisalabad",   amount:320000,  orderDate:"2024-10-20", delivery:"2024-11-01", status:"Active"             },
  { id:"PO-2024-0304", vendor:"Al-Baraka Traders",    campus:"Main Campus – Karachi",    amount:55000,   orderDate:"2024-10-18", delivery:"2024-10-28", status:"Delivered"          },
  { id:"PO-2024-0303", vendor:"Future IT Hub",        campus:"North Branch – Lahore",    amount:780000,  orderDate:"2024-10-15", delivery:"2024-10-30", status:"Active"             },
];

// INIT_VENDORS used to be the mock data behind VendorsTab and AssetModal's
// vendor dropdown — both now read real vendors via useVendors() (see
// VendorsTab and AssetModal), so this hardcoded list has no remaining
// readers and was removed.

export const INIT_INVENTORY: InventoryItem[] = [
  { code:"ITM-001", name:"A4 Paper Ream (500 sheets)",    category:"Stationery",        unit:"Ream",  stock:45,  minStock:100, maxStock:500, unitCost:1250,   campus:"Main Campus – Karachi",    location:"Central Warehouse",  value:56250,  status:"Low Stock" },
  { code:"ITM-002", name:"HP LaserJet Toner 85A",         category:"IT Consumables",    unit:"Piece", stock:8,   minStock:20,  maxStock:60,  unitCost:16000,  campus:"Main Campus – Karachi",    location:"Main Campus Store",  value:128000, status:"Low Stock" },
  { code:"ITM-003", name:"Whiteboard Marker Set",         category:"Stationery",        unit:"Pack",  stock:250, minStock:50,  maxStock:300, unitCost:75,     campus:"North Branch – Lahore",    location:"Central Warehouse",  value:18750,  status:"In Stock"  },
  { code:"ITM-004", name:"Chemistry Reagent Kit",         category:"Lab Supplies",      unit:"Kit",   stock:12,  minStock:10,  maxStock:50,  unitCost:12000,  campus:"East Campus – Islamabad",  location:"Science Lab Store",  value:144000, status:"In Stock"  },
  { code:"ITM-005", name:"Laptop Dell Latitude 5540",     category:"IT Equipment",      unit:"Piece", stock:3,   minStock:10,  maxStock:25,  unitCost:160000, campus:"Main Campus – Karachi",    location:"IT Store",           value:480000, status:"Critical"  },
  { code:"ITM-006", name:"Student Chair with Armrest",    category:"Furniture",         unit:"Piece", stock:85,  minStock:50,  maxStock:200, unitCost:9000,   campus:"Main Campus – Karachi",    location:"Central Warehouse",  value:765000, status:"In Stock"  },
  { code:"ITM-007", name:"Projector Bulb Epson EB-X51",  category:"IT Consumables",    unit:"Piece", stock:4,   minStock:10,  maxStock:30,  unitCost:8500,   campus:"North Branch – Lahore",    location:"AV Store",           value:34000,  status:"Critical"  },
  { code:"ITM-008", name:"A3 Color Printer Paper",        category:"Stationery",        unit:"Pack",  stock:120, minStock:50,  maxStock:250, unitCost:900,    campus:"East Campus – Islamabad",  location:"Print Room",         value:108000, status:"In Stock"  },
  { code:"ITM-009", name:"Hand Sanitizer 5L",             category:"Cleaning Supplies", unit:"Piece", stock:18,  minStock:20,  maxStock:60,  unitCost:2200,   campus:"West Wing – Faisalabad",   location:"Health Office",      value:39600,  status:"Low Stock" },
  { code:"ITM-010", name:"Ball Point Pen Box (50pk)",     category:"Stationery",        unit:"Box",   stock:300, minStock:100, maxStock:600, unitCost:350,    campus:"Main Campus – Karachi",    location:"Stationery Store",   value:105000, status:"In Stock"  },
  { code:"ITM-011", name:"Microscope Slides 100pk",       category:"Lab Supplies",      unit:"Pack",  stock:6,   minStock:10,  maxStock:40,  unitCost:1800,   campus:"North Branch – Lahore",    location:"Biology Lab",        value:10800,  status:"Critical"  },
  { code:"ITM-012", name:"USB Flash Drive 64GB",          category:"IT Consumables",    unit:"Piece", stock:35,  minStock:20,  maxStock:80,  unitCost:1200,   campus:"Main Campus – Karachi",    location:"IT Store",           value:42000,  status:"In Stock"  },
  { code:"ITM-013", name:"Whiteboard Eraser",             category:"Stationery",        unit:"Piece", stock:80,  minStock:30,  maxStock:150, unitCost:120,    campus:"East Campus – Islamabad",  location:"Central Warehouse",  value:9600,   status:"In Stock"  },
];

// INIT_ASSETS used to be the mock data behind AssetsTab (11 fake sample
// assets held in local React state, nothing persisted — see the PR that
// wired AssetsTab/AssetModal to the real /procurement/assets backend).
// AssetsTab now reads real data via useAssets(), so this hardcoded list
// has no remaining readers and was removed.

export const INIT_GRNS: GRN[] = [
  { id:"GRN-2024-0156", po:"PO-2024-0311", vendor:"Al-Baraka Traders",   receivedBy:"Warehouse Incharge",  date:"2024-11-17", items:12, status:"Fully Received"     },
  { id:"GRN-2024-0155", po:"PO-2024-0308", vendor:"Future IT Hub",       receivedBy:"IT Store Manager",    date:"2024-11-16", items:8,  status:"Partially Received" },
  { id:"GRN-2024-0154", po:"PO-2024-0307", vendor:"Global Lab Equip",    receivedBy:"Lab Incharge",        date:"2024-11-14", items:5,  status:"Damaged Items"      },
  { id:"GRN-2024-0153", po:"PO-2024-0306", vendor:"Fast Forward Books",  receivedBy:"Library Incharge",    date:"2024-11-12", items:30, status:"Fully Received"     },
  { id:"GRN-2024-0152", po:"PO-2024-0309", vendor:"Global Lab Equip",    receivedBy:"Lab Incharge",        date:"2024-11-11", items:15, status:"Fully Received"     },
  { id:"GRN-2024-0151", po:"PO-2024-0305", vendor:"TechVision Supplies", receivedBy:"IT Store Manager",    date:"2024-11-10", items:6,  status:"Partially Received" },
  { id:"GRN-2024-0150", po:"PO-2024-0304", vendor:"Al-Baraka Traders",   receivedBy:"Warehouse Incharge",  date:"2024-11-08", items:10, status:"Fully Received"     },
  { id:"GRN-2024-0149", po:"PO-2024-0303", vendor:"Future IT Hub",       receivedBy:"IT Store Manager",    date:"2024-11-05", items:18, status:"Partially Received" },
  { id:"GRN-2024-0148", po:"PO-2024-0302", vendor:"National Furniture",  receivedBy:"Facility Manager",    date:"2024-11-03", items:40, status:"Fully Received"     },
  { id:"GRN-2024-0147", po:"PO-2024-0301", vendor:"Eco-Electric Co.",    receivedBy:"Electrical Tech",     date:"2024-11-01", items:8,  status:"Damaged Items"      },
];

export const INIT_APPROVALS: Approval[] = [
  { id:"PR-2024-0891", by:"Ahmed Raza",    campus:"Main Campus – Karachi",    amount:245000, priority:"High",   reason:"IT Lab upgrade – 8 desktops for expanded CS program",       stage:"Finance Review",     level:2, submitted:"2024-11-15", status:"Pending" },
  { id:"PR-2024-0885", by:"Zara Qureshi",  campus:"East Campus – Islamabad",  amount:890000, priority:"Urgent", reason:"Server replacement – admin network down since Nov 8",         stage:"Principal Approval", level:3, submitted:"2024-11-09", status:"Pending" },
  { id:"PR-2024-0882", by:"Noman Yusuf",   campus:"North Branch – Lahore",    amount:56000,  priority:"Medium", reason:"Science lab consumables restock for term-end exams",           stage:"HOD Review",         level:1, submitted:"2024-11-07", status:"Pending" },
  { id:"PR-2024-0881", by:"Asif Khan",     campus:"East Campus – Islamabad",  amount:320000, priority:"High",   reason:"Network switches for campus connectivity upgrade",              stage:"Finance Review",     level:2, submitted:"2024-11-06", status:"Pending" },
  { id:"PR-2024-0879", by:"Sana Mirza",    campus:"Main Campus – Karachi",    amount:45000,  priority:"Medium", reason:"Accounting software license renewal for FY2025",               stage:"HOD Review",         level:1, submitted:"2024-11-05", status:"Pending" },
  { id:"PR-2024-0876", by:"Bilal Ahmed",   campus:"West Wing – Faisalabad",   amount:178000, priority:"Medium", reason:"Sports equipment for inter-school tournament preparation",       stage:"Principal Approval", level:3, submitted:"2024-11-04", status:"Pending" },
  { id:"PR-2024-0870", by:"Hina Nasir",    campus:"North Branch – Lahore",    amount:62000,  priority:"Low",    reason:"Library books for new batch curriculum update – batch 2025",   stage:"HOD Review",         level:1, submitted:"2024-11-02", status:"Pending" },
];

export const MONTHLY_DATA = [
  { month:"Jun", spend:1.2 }, { month:"Jul", spend:1.8 },
  { month:"Aug", spend:2.4 }, { month:"Sep", spend:1.9 },
  { month:"Oct", spend:3.1 }, { month:"Nov", spend:2.7 },
];

export const CATEGORY_SPEND = [
  { name:"IT Equipment", value:38 }, { name:"Lab Supplies", value:24 },
  { name:"Furniture",    value:18 }, { name:"Stationery",   value:12 },
  { name:"Others",       value:8  },
];

export const PIE_COLORS = ["#0C447C","#10b981","#EF9F27","#8b5cf6","#ef4444"];
