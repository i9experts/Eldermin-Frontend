export interface InstitutionData {
  name: string;
  type: string;
  country: string;
  city: string;
  language: string;
  currency: string;
  academicSystem: string[];
  logo: File | null;
}

export interface CampusData {
  name: string;
  code: string;
  address: string;
  head: string;
  phone: string;
}

export interface AcademicsData {
  yearStart: string;
  yearEnd: string;
  terms: string[];
  grades: string[];
  sectionsPerGrade: number;
  subjects: string[];
}

export interface FinanceData {
  feeFrequency: string;
  lateFeePolicy: string;
  tax: string;
  bankAccount: string;
  feeHeads: string[];
  payrollStructure: string;
}

export interface DocumentsData {
  admissionDocs: string[];
  employeeDocs: string[];
  policyDocs: string[];
}

export interface WizardState {
  institution: InstitutionData;
  campuses: CampusData[];
  academics: AcademicsData;
  selectedRoles: string[];
  selectedModules: number[];
  finance: FinanceData;
  documents: DocumentsData;
}

export const WIZARD_STEPS = [
  { id: 1, label: 'Institution', icon: '🏫' },
  { id: 2, label: 'Campus',      icon: '🏛️' },
  { id: 3, label: 'Academics',   icon: '📚' },
  { id: 4, label: 'Roles',       icon: '👥' },
  { id: 5, label: 'Modules',     icon: '🧩' },
  { id: 6, label: 'Finance',     icon: '💰' },
  { id: 7, label: 'Documents',   icon: '📋' },
  { id: 8, label: 'Launch',      icon: '🚀' },
] as const;

export const ALL_MODULES = [
  { name: 'Institution Setup',        icon: '🏫', desc: 'Core org profile, campuses, settings.', dep: null },
  { name: 'Governance & Compliance',  icon: '🛡️', desc: 'Policies, audits, risk management.',    dep: null },
  { name: 'Documents & Workflow',     icon: '📋', desc: 'Document management and approvals.',    dep: 'Institution required' },
  { name: 'Staff & HR',               icon: '👥', desc: 'Staff records, leave, payroll.',         dep: null },
  { name: 'Teaching Management',      icon: '🎓', desc: 'Lesson plans, observations, CPD.',       dep: 'Staff & HR required' },
  { name: 'Finance',                  icon: '💰', desc: 'Fees, invoices, budgets, payroll.',      dep: null },
  { name: 'Procurement',              icon: '🛒', desc: 'Purchase orders, vendors, stock.',       dep: 'Finance required' },
  { name: 'Campus Operations',        icon: '🏛️', desc: 'Rooms, assets, events, maintenance.',   dep: null },
  { name: 'Admissions',               icon: '📝', desc: 'Lead tracking, enrollment, forms.',      dep: 'Finance + Institution' },
  { name: 'Curriculum Intelligence',  icon: '📚', desc: 'SLOs, standards, curriculum mapping.',  dep: null },
  { name: 'Syllabus Tracking',        icon: '📊', desc: 'Coverage tracking, lesson updates.',    dep: 'Curriculum + Teaching' },
  { name: 'Timetable Intelligence',   icon: '🗓️', desc: 'Smart scheduling, conflict detection.', dep: 'Teaching required' },
  { name: 'Library',                  icon: '📖', desc: 'Books, issues, returns, catalog.',       dep: null },
  { name: 'Student 360',              icon: '🧑‍🎓', desc: 'Full student profile and history.',  dep: 'Admissions required' },
  { name: 'Assessment & Results',     icon: '📝', desc: 'Tests, marks, report cards, GPA.',       dep: 'Student 360 + Teaching' },
  { name: 'Behaviour & Tarbiyah',     icon: '🌱', desc: 'Character tracking, Islamic values.',   dep: 'Student 360 required' },
  { name: 'Analytics & Intelligence', icon: '🤖', desc: 'AI insights, KPIs, dashboards.',        dep: 'Any module required' },
] as const;

export const BUNDLES = [
  { name: 'Starter School ERP',     desc: 'Perfect for small schools getting started.',       mods: [0,2,3,5,8,13],                        recommended: false },
  { name: 'Academic Excellence',    desc: 'For schools focused on teaching & learning.',      mods: [0,4,9,10,11,12,13,14],                recommended: true },
  { name: 'Operations Suite',       desc: 'For institutions needing admin control.',          mods: [0,2,3,5,6,7],                         recommended: false },
  { name: 'Enterprise Complete ERP',desc: 'All modules — full multi-campus ERP.',             mods: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16], recommended: false },
] as const;

export const ALL_ROLES = [
  { name: 'Owner / Director', icon: '👑', desc: 'Full system access' },
  { name: 'Principal',        icon: '🎓', desc: 'Academic oversight' },
  { name: 'Administrator',    icon: '⚙️', desc: 'Operations & admin' },
  { name: 'Accountant',       icon: '💰', desc: 'Finance access' },
  { name: 'HR Manager',       icon: '👥', desc: 'Staff management' },
  { name: 'Academic Coord.',  icon: '📚', desc: 'Curriculum & academics' },
  { name: 'Teacher',          icon: '🎒', desc: 'Classroom tools' },
  { name: 'Parent',           icon: '👪', desc: 'Child info & fees' },
  { name: 'Student',          icon: '🧑‍🎓', desc: 'Learning resources' },
] as const;

export const FEE_HEADS = ['Tuition Fee','Admission Fee','Transport Fee','Book Fee','Uniform Fee','Exam Fee','Activity Fee','Lab Fee'] as const;
