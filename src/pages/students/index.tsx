import { useState, useEffect, useCallback, Fragment } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  LayoutDashboard, Users, UserCheck, CalendarCheck2,
  Plus, Download, Search, X, ChevronLeft, ChevronRight,
  TrendingUp, TrendingDown, GraduationCap, UserMinus,
  UserPlus, Activity, ExternalLink, Check, ChevronDown, ChevronUp,
  AlertTriangle, Edit2, Trash2, Settings, ArrowUp, ArrowDown,
  Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2, Printer,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import studentsService from '../../services/students.service'
import { useStudentDashboard, useStudents, useBulkMarkAttendance, useAttendance } from '../../hooks/useStudents'

// ─── TYPES ────────────────────────────────────────────────────────────────────
type TabId = 'dashboard' | 'students' | 'guardians' | 'attendance'

interface AllergyItem    { type: string; name: string; severity: string; treatment: string }
interface ConditionItem  { name: string; severity: string; emergencyProtocol: string }
interface MedicationItem { name: string; dosage: string; frequency: string; keptAt: string }
interface EnrollmentFieldItem {
  _id: string; label: string; fieldKey: string; fieldType: string
  options: string[]; isRequired: boolean; section: string; sortOrder: number
  placeholder?: string; helpText?: string; isSystemField: boolean
}
interface GData {
  title: string; firstName: string; lastName: string; relationship: string
  phone: string; altPhone: string; whatsApp: string
  email: string; occupation: string; employer: string
  nationalId: string; annualIncome: string
  isPrimary: boolean; isFinancial: boolean; isEmergency: boolean; canPickup: boolean
  street: string; city: string; country: string
}
interface WizardData {
  // Step 1 – Identity
  firstName: string; middleName: string; lastName: string
  arabicName: string; preferredName: string
  dateOfBirth: string; placeOfBirth: string; gender: string
  nationality: string; secondNationality: string; religion: string
  bloodGroup: string; motherTongue: string
  passportNo: string; nationalId: string; birthCertNo: string
  // Step 2 – Contact
  studentPhone: string; studentEmail: string
  sameAddress: boolean
  curStreet: string; curCity: string; curState: string; curCountry: string; curPostal: string
  perStreet: string; perCity: string; perState: string; perCountry: string; perPostal: string
  // Step 3 – Admission
  admissionDate: string; admissionType: string
  gradeLevelName: string; campusName: string; academicYearName: string; status: string
  prevSchoolName: string; prevSchoolCity: string; prevGrade: string; transferCertNo: string; tcDate: string
  // Steps 4 & 5 – Guardians
  g1: GData
  hasSecondGuardian: boolean
  g2: GData
  // Step 6 – Health
  allergies: AllergyItem[]; conditions: ConditionItem[]; medications: MedicationItem[]
  isSEN: boolean; senDetails: string; hasPERestrictions: boolean; peRestrictions: string
  dietaryRestrictions: string; emergencyAction: string
  doctorName: string; doctorPhone: string; doctorClinic: string
  // Step 7 – Services
  hasTransport: boolean; transportRoute: string; transportStop: string
  transportMorning: boolean; transportEvening: boolean
  hasHostel: boolean; hostelRoom: string
  hasCafeteria: boolean
  hasSibling: boolean; siblingName: string; siblingAdmissionNo: string; siblingGrade: string
  customFields: Record<string, any>
  // Step 8
  confirmed: boolean
}

const EMPTY_G: GData = {
  title:'', firstName:'', lastName:'', relationship:'',
  phone:'', altPhone:'', whatsApp:'', email:'', occupation:'', employer:'',
  nationalId:'', annualIncome:'',
  isPrimary:false, isFinancial:false, isEmergency:true, canPickup:true,
  street:'', city:'', country:'',
}
const EMPTY: WizardData = {
  firstName:'', middleName:'', lastName:'', arabicName:'', preferredName:'',
  dateOfBirth:'', placeOfBirth:'', gender:'', nationality:'', secondNationality:'',
  religion:'', bloodGroup:'', motherTongue:'', passportNo:'', nationalId:'', birthCertNo:'',
  studentPhone:'', studentEmail:'',
  sameAddress:true,
  curStreet:'', curCity:'', curState:'', curCountry:'', curPostal:'',
  perStreet:'', perCity:'', perState:'', perCountry:'', perPostal:'',
  admissionDate:'', admissionType:'new', gradeLevelName:'', campusName:'', academicYearName:'',
  status:'enrolled', prevSchoolName:'', prevSchoolCity:'', prevGrade:'', transferCertNo:'', tcDate:'',
  g1:{ ...EMPTY_G, title:'Mr', relationship:'Father', isPrimary:true, isFinancial:true, isEmergency:true, canPickup:true },
  hasSecondGuardian:false,
  g2:{ ...EMPTY_G, title:'Mrs', relationship:'Mother', isPrimary:false, isFinancial:false, isEmergency:true, canPickup:true },
  allergies:[], conditions:[], medications:[],
  isSEN:false, senDetails:'', hasPERestrictions:false, peRestrictions:'',
  dietaryRestrictions:'', emergencyAction:'',
  doctorName:'', doctorPhone:'', doctorClinic:'',
  hasTransport:false, transportRoute:'', transportStop:'', transportMorning:true, transportEvening:true,
  hasHostel:false, hostelRoom:'', hasCafeteria:false,
  hasSibling:false, siblingName:'', siblingAdmissionNo:'', siblingGrade:'',
  customFields:{}, confirmed:false,
}

const STEP_LABELS = ['Identity','Contact','Admission','Guardian 1','Guardian 2','Health','Services','Review']

// ─── SHARED UI PRIMITIVES ─────────────────────────────────────────────────────
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white rounded-xl border border-slate-100 shadow-sm ${className}`}>{children}</div>
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
  )
}
function Btn({ children, variant = 'secondary', onClick, type = 'button', disabled }: {
  children: React.ReactNode; variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  onClick?: () => void; type?: 'button' | 'submit'; disabled?: boolean;
}) {
  const cls = {
    primary:   'bg-[#0C447C] text-white hover:bg-[#0b3d6e] border-[#0C447C]',
    secondary: 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200',
    danger:    'bg-red-600 text-white hover:bg-red-700 border-red-600',
    ghost:     'bg-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100 border-transparent',
  }[variant]
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`${cls} px-3 py-1.5 text-xs border rounded-lg font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed`}>
      {children}
    </button>
  )
}
type BV = 'green' | 'amber' | 'red' | 'blue' | 'purple' | 'gray' | 'navy'
const BADGE_CLS: Record<BV, string> = {
  green:'bg-emerald-50 text-emerald-700 border-emerald-200', amber:'bg-amber-50 text-amber-700 border-amber-200',
  red:'bg-red-50 text-red-700 border-red-200', blue:'bg-blue-50 text-blue-700 border-blue-200',
  purple:'bg-purple-50 text-purple-700 border-purple-200', gray:'bg-slate-100 text-slate-600 border-slate-200',
  navy:'bg-[#0C447C] text-white border-[#0C447C]',
}
function Badge({ v, children }: { v: BV; children: React.ReactNode }) {
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-medium ${BADGE_CLS[v]}`}>{children}</span>
}
function statusBV(s: string): BV {
  const m: Record<string, BV> = {
    enrolled:'green', admitted:'blue', prospect:'gray', applied:'amber',
    alumni:'purple', withdrawn:'red', expelled:'red', transferred:'amber',
    present:'green', absent:'red', late:'amber', on_leave:'blue',
    half_day_am:'amber', half_day_pm:'amber', medical:'blue', holiday:'gray',
  }
  return m[s] ?? 'gray'
}
function THead({ cols }: { cols: string[] }) {
  return (
    <thead>
      <tr className="bg-slate-50 border-b border-slate-100">
        {cols.map(c => <th key={c} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{c}</th>)}
      </tr>
    </thead>
  )
}
function Pagination({ total, showing, page = 1, pages = 1, limit = 20, onPageChange, onLimitChange }: {
  total: number; showing: number; page?: number; pages?: number; limit?: number;
  onPageChange?: (p: number) => void; onLimitChange?: (l: number) => void;
}) {
  const from = total === 0 ? 0 : (page - 1) * limit + 1
  const to = Math.min(page * limit, total)
  return (
    <div className="px-4 py-3 border-t border-slate-50 flex items-center justify-between flex-wrap gap-3">
      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-400">Showing {from}–{to} of {total}</span>
        {onLimitChange && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400">per page</span>
            <select value={limit} onChange={e => onLimitChange(Number(e.target.value))}
              className="text-xs border border-slate-200 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-[#0C447C]">
              {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        )}
      </div>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange?.(Math.max(1, page - 1))} disabled={!onPageChange || page <= 1}
          className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed">
          <ChevronLeft size={14} />
        </button>
        <span className="text-xs text-slate-500 px-2">Page {page} of {Math.max(pages, 1)}</span>
        <button onClick={() => onPageChange?.(Math.min(pages, page + 1))} disabled={!onPageChange || page >= pages}
          className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed">
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}
function Spinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-6 h-6 border-2 border-[#0C447C] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
function KPI({ label, value, sub, color = '#0C447C', icon: Icon }: { label: string; value: string | number; sub?: string; color?: string; icon: LucideIcon }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: color + '18' }}>
          <Icon size={18} style={{ color }} />
        </div>
      </div>
      <div className="text-2xl font-bold text-slate-800">{value}</div>
      <div className="text-xs text-slate-500 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
    </div>
  )
}

// ─── DASHBOARD TAB ────────────────────────────────────────────────────────────
function DashboardTab() {
  const { data: stats } = useStudentDashboard()
  const s   = (stats as any)?.students        ?? {}
  const att = (stats as any)?.todayAttendance ?? {}
  const total = s.total ?? 1
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-5 gap-4">
        <KPI label="Total Students"  value={s.total        ?? 0} sub="All records"        color="#0C447C" icon={Users}         />
        <KPI label="Active"          value={s.active       ?? 0} sub="Currently enrolled"  color="#059669" icon={GraduationCap} />
        <KPI label="Today Present"   value={att.present    ?? 0} sub="Attendance today"    color="#2563eb" icon={UserCheck}     />
        <KPI label="Today Absent"    value={att.absent     ?? 0} sub="Attendance today"    color="#dc2626" icon={UserMinus}     />
        <KPI label="Scholarship"     value={s.scholarship  ?? 0} sub="On scholarship"      color="#7c3aed" icon={Activity}      />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Card className="col-span-2">
          <CardHeader title="Grade Distribution" sub="Active students by grade" />
          <div className="p-5 space-y-3">
            {((stats as any)?.gradeDistribution ?? []).slice(0, 6).map((row: any) => (
              <div key={row._id}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 font-medium">{row._id || 'Unassigned'}</span>
                  <span className="font-semibold text-slate-800">{row.count}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full">
                  <div className="h-full rounded-full transition-all bg-[#0C447C]"
                    style={{ width: `${Math.min(100, (row.count / total) * 100)}%` }} />
                </div>
              </div>
            ))}
            {((stats as any)?.gradeDistribution ?? []).length === 0 && (
              <p className="text-xs text-slate-400 text-center py-4">No students enrolled yet</p>
            )}
          </div>
        </Card>
        <Card>
          <CardHeader title="Quick Stats" />
          <div className="p-4 space-y-3">
            {[
              { label: 'Total Students',  value: s.total        ?? 0, icon: Users,       color: '#0C447C' },
              { label: 'Active',          value: s.active       ?? 0, icon: TrendingUp,  color: '#059669' },
              { label: 'New This Month',  value: s.newThisMonth ?? 0, icon: UserPlus,    color: '#2563eb' },
            ].map(st => (
              <div key={st.label} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: st.color + '18' }}>
                  <st.icon size={15} style={{ color: st.color }} />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-500">{st.label}</p>
                  <p className="text-sm font-bold text-slate-800">{st.value}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

// ─── WIZARD HELPERS ───────────────────────────────────────────────────────────
const IC  = 'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]'
const EC  = 'w-full px-3 py-2 text-sm border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 bg-red-50'

function F({ label, required, children, span2, err }: { label: string; required?: boolean; children: React.ReactNode; span2?: boolean; err?: string }) {
  return (
    <div className={span2 ? 'col-span-2' : ''}>
      <label className="block text-xs font-semibold text-slate-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {err && <p className="text-xs text-red-500 mt-0.5">{err}</p>}
    </div>
  )
}
function SH({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4 pb-2 border-b border-slate-100 mt-5 first:mt-0">
      <div className="w-1 h-5 rounded-full bg-[#EF9F27] shrink-0" />
      <h3 className="font-bold text-sm text-slate-800">{children}</h3>
    </div>
  )
}
function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!value)}
      className={`w-11 h-6 rounded-full transition-colors shrink-0 relative ${value ? 'bg-[#0C447C]' : 'bg-slate-200'}`}>
      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${value ? 'left-5' : 'left-0.5'}`} />
    </button>
  )
}

// ─── STEP INDICATOR ───────────────────────────────────────────────────────────
function StepIndicator({ step }: { step: number }) {
  return (
    <div className="flex items-start justify-between px-2">
      {STEP_LABELS.map((label, i) => {
        const n = i + 1
        const done   = n < step
        const active = n === step
        return (
          <Fragment key={n}>
            {i > 0 && (
              <div className={`flex-1 h-0.5 mt-4 mx-1 ${n <= step ? 'bg-white/60' : 'bg-white/20'}`} />
            )}
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2 ${
                done   ? 'bg-emerald-400 border-emerald-300 text-white' :
                active ? 'bg-white border-white text-[#0C447C]' :
                         'bg-transparent border-white/30 text-white/50'
              }`}>
                {done ? <Check size={14} /> : n}
              </div>
              <span className={`text-[10px] font-medium whitespace-nowrap ${active ? 'text-white' : 'text-white/50'}`}>{label}</span>
            </div>
          </Fragment>
        )
      })}
    </div>
  )
}

// ─── STEP 1: IDENTITY ─────────────────────────────────────────────────────────
function Step1Identity({ data, setData, errors }: { data: WizardData; setData: React.Dispatch<React.SetStateAction<WizardData>>; errors: Record<string, string> }) {
  const set = (k: keyof WizardData, v: string) => setData(d => ({ ...d, [k]: v }))
  return (
    <div>
      <SH>Name</SH>
      <div className="grid grid-cols-3 gap-3">
        <F label="First Name" required err={errors.firstName}>
          <input value={data.firstName} onChange={e=>set('firstName',e.target.value)} className={errors.firstName ? EC : IC} placeholder="First name" />
        </F>
        <F label="Middle Name">
          <input value={data.middleName} onChange={e=>set('middleName',e.target.value)} className={IC} placeholder="Middle name" />
        </F>
        <F label="Last Name" required err={errors.lastName}>
          <input value={data.lastName} onChange={e=>set('lastName',e.target.value)} className={errors.lastName ? EC : IC} placeholder="Last name" />
        </F>
        <F label="Arabic Name">
          <input value={data.arabicName} onChange={e=>set('arabicName',e.target.value)} className={IC} placeholder="الاسم بالعربي" dir="rtl" />
        </F>
        <F label="Preferred Name (used in class)">
          <input value={data.preferredName} onChange={e=>set('preferredName',e.target.value)} className={IC} placeholder="Nickname or preferred name" />
        </F>
      </div>
      <SH>Personal Details</SH>
      <div className="grid grid-cols-3 gap-3">
        <F label="Date of Birth" required err={errors.dateOfBirth}>
          <input type="date" value={data.dateOfBirth} onChange={e=>set('dateOfBirth',e.target.value)} className={errors.dateOfBirth ? EC : IC} />
        </F>
        <F label="Place of Birth">
          <input value={data.placeOfBirth} onChange={e=>set('placeOfBirth',e.target.value)} className={IC} placeholder="City, Country" />
        </F>
        <F label="Gender" required err={errors.gender}>
          <select value={data.gender} onChange={e=>set('gender',e.target.value)} className={errors.gender ? EC : IC}>
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </F>
        <F label="Nationality" required err={errors.nationality}>
          <input value={data.nationality} onChange={e=>set('nationality',e.target.value)} className={errors.nationality ? EC : IC} placeholder="e.g. British" />
        </F>
        <F label="Second Nationality">
          <input value={data.secondNationality} onChange={e=>set('secondNationality',e.target.value)} className={IC} placeholder="Optional" />
        </F>
        <F label="Religion">
          <select value={data.religion} onChange={e=>set('religion',e.target.value)} className={IC}>
            <option value="">Select</option>
            {['Islam','Christianity','Hinduism','Judaism','Buddhism','Other'].map(r=><option key={r}>{r}</option>)}
          </select>
        </F>
        <F label="Blood Group">
          <select value={data.bloodGroup} onChange={e=>set('bloodGroup',e.target.value)} className={IC}>
            <option value="">Unknown</option>
            {['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(g=><option key={g}>{g}</option>)}
          </select>
        </F>
        <F label="Mother Tongue">
          <input value={data.motherTongue} onChange={e=>set('motherTongue',e.target.value)} className={IC} placeholder="e.g. Arabic" />
        </F>
      </div>
      <SH>Identity Documents</SH>
      <div className="grid grid-cols-3 gap-3">
        <F label="Passport Number">
          <input value={data.passportNo} onChange={e=>set('passportNo',e.target.value)} className={IC} placeholder="Passport no." />
        </F>
        <F label="National ID">
          <input value={data.nationalId} onChange={e=>set('nationalId',e.target.value)} className={IC} placeholder="National ID no." />
        </F>
        <F label="Birth Certificate No">
          <input value={data.birthCertNo} onChange={e=>set('birthCertNo',e.target.value)} className={IC} placeholder="Certificate no." />
        </F>
      </div>
    </div>
  )
}

// ─── STEP 2: CONTACT & ADDRESS ────────────────────────────────────────────────
function Step2Contact({ data, setData }: { data: WizardData; setData: React.Dispatch<React.SetStateAction<WizardData>>; errors: Record<string, string> }) {
  const set = (k: keyof WizardData, v: string | boolean) => setData(d => ({ ...d, [k]: v }))
  const AddrFields = (prefix: 'cur' | 'per') => (
    <div className="grid grid-cols-3 gap-3">
      <F label="Street Address" span2>
        <input value={data[`${prefix}Street`]} onChange={e=>set(`${prefix}Street` as keyof WizardData,e.target.value)} className={IC} placeholder="Street address" />
      </F>
      <F label="City">
        <input value={data[`${prefix}City`]} onChange={e=>set(`${prefix}City` as keyof WizardData,e.target.value)} className={IC} placeholder="City" />
      </F>
      <F label="State / Province">
        <input value={data[`${prefix}State`]} onChange={e=>set(`${prefix}State` as keyof WizardData,e.target.value)} className={IC} placeholder="State" />
      </F>
      <F label="Country">
        <input value={data[`${prefix}Country`]} onChange={e=>set(`${prefix}Country` as keyof WizardData,e.target.value)} className={IC} placeholder="Country" />
      </F>
      <F label="Postal Code">
        <input value={data[`${prefix}Postal`]} onChange={e=>set(`${prefix}Postal` as keyof WizardData,e.target.value)} className={IC} placeholder="Postal code" />
      </F>
    </div>
  )
  return (
    <div>
      <SH>Student Contact</SH>
      <div className="grid grid-cols-2 gap-3">
        <F label="Student Phone"><input value={data.studentPhone} onChange={e=>set('studentPhone',e.target.value)} className={IC} placeholder="+1 000 000 0000" /></F>
        <F label="Student Email"><input type="email" value={data.studentEmail} onChange={e=>set('studentEmail',e.target.value)} className={IC} placeholder="student@school.com" /></F>
      </div>
      <SH>Current Address</SH>
      {AddrFields('cur')}
      <div className="flex items-center gap-2 my-4">
        <input type="checkbox" id="sameAddr" checked={data.sameAddress} onChange={e=>set('sameAddress',e.target.checked)} className="w-4 h-4 accent-[#0C447C]" />
        <label htmlFor="sameAddr" className="text-sm font-medium text-slate-700">Permanent address same as current</label>
      </div>
      {!data.sameAddress && (
        <>
          <SH>Permanent Address</SH>
          {AddrFields('per')}
        </>
      )}
    </div>
  )
}

// ─── STEP 3: ADMISSION DETAILS ────────────────────────────────────────────────
function Step3Admission({ data, setData, errors }: { data: WizardData; setData: React.Dispatch<React.SetStateAction<WizardData>>; errors: Record<string, string> }) {
  const set = (k: keyof WizardData, v: string) => setData(d => ({ ...d, [k]: v }))
  const showPrev = data.admissionType === 'transfer' || data.admissionType === 'readmission'
  return (
    <div>
      <SH>Admission Information</SH>
      <div className="grid grid-cols-2 gap-3">
        <F label="Admission Date" required err={errors.admissionDate}>
          <input type="date" value={data.admissionDate} onChange={e=>set('admissionDate',e.target.value)} className={errors.admissionDate ? EC : IC} />
        </F>
        <F label="Admission Type" required err={errors.admissionType}>
          <select value={data.admissionType} onChange={e=>set('admissionType',e.target.value)} className={errors.admissionType ? EC : IC}>
            <option value="">Select type</option>
            {[['new','New Enrollment'],['transfer','Transfer'],['readmission','Re-Admission'],['lateral','Lateral Entry']].map(([v,l])=><option key={v} value={v}>{l}</option>)}
          </select>
        </F>
        <F label="Applying for Grade">
          <input value={data.gradeLevelName} onChange={e=>set('gradeLevelName',e.target.value)} className={IC} placeholder="e.g. Grade 5" />
        </F>
        <F label="Campus">
          <input value={data.campusName} onChange={e=>set('campusName',e.target.value)} className={IC} placeholder="e.g. Main Campus" />
        </F>
        <F label="Academic Year">
          <input value={data.academicYearName} onChange={e=>set('academicYearName',e.target.value)} className={IC} placeholder="e.g. 2024-25" />
        </F>
        <F label="Enrollment Status" required err={errors.status}>
          <select value={data.status} onChange={e=>set('status',e.target.value)} className={errors.status ? EC : IC}>
            {['prospect','applied','admitted','enrolled'].map(s=><option key={s}>{s}</option>)}
          </select>
        </F>
      </div>
      {showPrev && (
        <>
          <SH>Previous School</SH>
          <div className="grid grid-cols-2 gap-3">
            <F label="Previous School Name">
              <input value={data.prevSchoolName} onChange={e=>set('prevSchoolName',e.target.value)} className={IC} placeholder="School name" />
            </F>
            <F label="School City">
              <input value={data.prevSchoolCity} onChange={e=>set('prevSchoolCity',e.target.value)} className={IC} placeholder="City, Country" />
            </F>
            <F label="Previous Grade">
              <input value={data.prevGrade} onChange={e=>set('prevGrade',e.target.value)} className={IC} placeholder="e.g. Grade 4" />
            </F>
            <F label="Transfer Certificate No">
              <input value={data.transferCertNo} onChange={e=>set('transferCertNo',e.target.value)} className={IC} placeholder="TC no." />
            </F>
            <F label="TC Issue Date">
              <input type="date" value={data.tcDate} onChange={e=>set('tcDate',e.target.value)} className={IC} />
            </F>
          </div>
        </>
      )}
    </div>
  )
}

// ─── GUARDIAN FORM SECTION (reusable for steps 4 & 5) ────────────────────────
function GuardianFormSection({ g, onG, errors, prefix }: { g: GData; onG: (u: Partial<GData>) => void; errors: Record<string, string>; prefix: string }) {
  const s  = (k: keyof GData, v: string | boolean) => onG({ [k]: v })
  const e  = (k: string) => errors[`${prefix}_${k}`]
  const C  = (k: keyof GData): string => e(k) ? EC : IC
  return (
    <div>
      <SH>Personal Details</SH>
      <div className="grid grid-cols-3 gap-3">
        <F label="Title">
          <select value={g.title} onChange={ev=>s('title',ev.target.value)} className={IC}>
            {['Mr','Mrs','Ms','Dr','Sheikh','Prof'].map(t=><option key={t}>{t}</option>)}
          </select>
        </F>
        <F label="First Name" required err={e('firstName')}>
          <input value={g.firstName} onChange={ev=>s('firstName',ev.target.value)} className={C('firstName')} placeholder="First name" />
        </F>
        <F label="Last Name" required err={e('lastName')}>
          <input value={g.lastName}  onChange={ev=>s('lastName', ev.target.value)} className={C('lastName')}  placeholder="Last name"  />
        </F>
        <F label="Relationship" required err={e('relationship')}>
          <select value={g.relationship} onChange={ev=>s('relationship',ev.target.value)} className={C('relationship')}>
            <option value="">Select</option>
            {['Father','Mother','Grandfather','Grandmother','Uncle','Aunt','Legal Guardian','Sibling','Other'].map(r=><option key={r}>{r}</option>)}
          </select>
        </F>
        <F label="National ID">
          <input value={g.nationalId} onChange={ev=>s('nationalId',ev.target.value)} className={IC} placeholder="ID no." />
        </F>
        <F label="Annual Income (optional)">
          <input value={g.annualIncome} onChange={ev=>s('annualIncome',ev.target.value)} className={IC} placeholder="For scholarship eligibility" />
        </F>
      </div>
      <SH>Contact</SH>
      <div className="grid grid-cols-3 gap-3">
        <F label="Phone" required err={e('phone')}>
          <input value={g.phone}    onChange={ev=>s('phone',   ev.target.value)} className={C('phone')}   placeholder="+1 000 000 0000" />
        </F>
        <F label="Alternate Phone">
          <input value={g.altPhone} onChange={ev=>s('altPhone',ev.target.value)} className={IC}            placeholder="+1 000 000 0000" />
        </F>
        <F label="WhatsApp">
          <input value={g.whatsApp} onChange={ev=>s('whatsApp',ev.target.value)} className={IC}            placeholder="+1 000 000 0000" />
        </F>
        <F label="Email">
          <input type="email" value={g.email} onChange={ev=>s('email',ev.target.value)} className={IC}     placeholder="guardian@email.com" />
        </F>
        <F label="Occupation">
          <input value={g.occupation} onChange={ev=>s('occupation',ev.target.value)} className={IC}         placeholder="e.g. Engineer" />
        </F>
        <F label="Employer">
          <input value={g.employer} onChange={ev=>s('employer',ev.target.value)} className={IC}             placeholder="Company name" />
        </F>
      </div>
      <SH>Permissions</SH>
      <div className="grid grid-cols-2 gap-3">
        {([['isPrimary','Primary Contact'],['isFinancial','Financial Contact'],['isEmergency','Emergency Contact'],['canPickup','Can Pickup Student']] as [keyof GData,string][]).map(([k,label])=>(
          <label key={k} className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={g[k] as boolean} onChange={ev=>s(k,ev.target.checked)} className="w-4 h-4 accent-[#0C447C]" />
            <span className="text-sm text-slate-700">{label}</span>
          </label>
        ))}
      </div>
      <SH>Address</SH>
      <div className="grid grid-cols-3 gap-3">
        <F label="Street" span2>
          <input value={g.street} onChange={ev=>s('street',ev.target.value)} className={IC} placeholder="Street address" />
        </F>
        <F label="City">
          <input value={g.city} onChange={ev=>s('city',ev.target.value)} className={IC} placeholder="City" />
        </F>
        <F label="Country">
          <input value={g.country} onChange={ev=>s('country',ev.target.value)} className={IC} placeholder="Country" />
        </F>
      </div>
    </div>
  )
}

// ─── STEP 4: PRIMARY GUARDIAN ─────────────────────────────────────────────────
function Step4Guardian({ data, setData, errors }: { data: WizardData; setData: React.Dispatch<React.SetStateAction<WizardData>>; errors: Record<string, string> }) {
  return (
    <GuardianFormSection
      g={data.g1}
      onG={u => setData(d => ({ ...d, g1: { ...d.g1, ...u } }))}
      errors={errors}
      prefix="g1"
    />
  )
}

// ─── STEP 5: SECONDARY GUARDIAN ───────────────────────────────────────────────
function Step5Secondary({ data, setData, errors }: { data: WizardData; setData: React.Dispatch<React.SetStateAction<WizardData>>; errors: Record<string, string> }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-5 p-4 bg-slate-50 rounded-xl border border-slate-200">
        <div>
          <p className="font-semibold text-slate-800 text-sm">Add Secondary Guardian</p>
          <p className="text-xs text-slate-400 mt-0.5">Optional — click the toggle to add a second guardian</p>
        </div>
        <Toggle value={data.hasSecondGuardian} onChange={v => setData(d => ({ ...d, hasSecondGuardian: v }))} />
      </div>
      {data.hasSecondGuardian && (
        <GuardianFormSection
          g={data.g2}
          onG={u => setData(d => ({ ...d, g2: { ...d.g2, ...u } }))}
          errors={errors}
          prefix="g2"
        />
      )}
    </div>
  )
}

// ─── STEP 6: HEALTH & MEDICAL ─────────────────────────────────────────────────
function Step6Health({ data, setData }: { data: WizardData; setData: React.Dispatch<React.SetStateAction<WizardData>>; errors: Record<string, string> }) {
  const set = (k: keyof WizardData, v: string | boolean) => setData(d => ({ ...d, [k]: v }))

  const addAllergy    = () => setData(d => ({ ...d, allergies:   [...d.allergies,   { type:'food', name:'', severity:'mild', treatment:'' }] }))
  const addCondition  = () => setData(d => ({ ...d, conditions:  [...d.conditions,  { name:'', severity:'moderate', emergencyProtocol:'' }] }))
  const addMedication = () => setData(d => ({ ...d, medications: [...d.medications, { name:'', dosage:'', frequency:'', keptAt:'home' }] }))

  const updateAllergy    = (i: number, k: keyof AllergyItem,    v: string) => setData(d => ({ ...d, allergies:   d.allergies.map((a,j)   => j===i ? {...a,[k]:v} : a) }))
  const updateCondition  = (i: number, k: keyof ConditionItem,  v: string) => setData(d => ({ ...d, conditions:  d.conditions.map((c,j)  => j===i ? {...c,[k]:v} : c) }))
  const updateMedication = (i: number, k: keyof MedicationItem, v: string) => setData(d => ({ ...d, medications: d.medications.map((m,j) => j===i ? {...m,[k]:v} : m) }))

  const removeAllergy    = (i: number) => setData(d => ({ ...d, allergies:   d.allergies.filter((_,j)   => j!==i) }))
  const removeCondition  = (i: number) => setData(d => ({ ...d, conditions:  d.conditions.filter((_,j)  => j!==i) }))
  const removeMedication = (i: number) => setData(d => ({ ...d, medications: d.medications.filter((_,j) => j!==i) }))

  return (
    <div>
      <SH>Allergies</SH>
      {data.allergies.map((a,i) => (
        <div key={i} className="grid grid-cols-4 gap-2 mb-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
          <F label="Type">
            <select value={a.type} onChange={e=>updateAllergy(i,'type',e.target.value)} className={IC}>
              {['food','medication','environmental','latex','other'].map(t=><option key={t}>{t}</option>)}
            </select>
          </F>
          <F label="Allergen Name">
            <input value={a.name} onChange={e=>updateAllergy(i,'name',e.target.value)} className={IC} placeholder="e.g. Peanuts" />
          </F>
          <F label="Severity">
            <select value={a.severity} onChange={e=>updateAllergy(i,'severity',e.target.value)} className={IC}>
              {['mild','moderate','severe','anaphylactic'].map(s=><option key={s}>{s}</option>)}
            </select>
          </F>
          <F label="Treatment / Action">
            <div className="flex gap-1">
              <input value={a.treatment} onChange={e=>updateAllergy(i,'treatment',e.target.value)} className={IC} placeholder="e.g. EpiPen" />
              <button onClick={()=>removeAllergy(i)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg shrink-0"><X size={14}/></button>
            </div>
          </F>
        </div>
      ))}
      <button onClick={addAllergy} className="flex items-center gap-1.5 text-xs text-[#0C447C] hover:underline font-medium mb-4"><Plus size={13}/>Add Allergy</button>

      <SH>Medical Conditions</SH>
      {data.conditions.map((c,i) => (
        <div key={i} className="grid grid-cols-3 gap-2 mb-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
          <F label="Condition Name">
            <input value={c.name} onChange={e=>updateCondition(i,'name',e.target.value)} className={IC} placeholder="e.g. Asthma" />
          </F>
          <F label="Severity">
            <select value={c.severity} onChange={e=>updateCondition(i,'severity',e.target.value)} className={IC}>
              {['mild','moderate','severe','critical'].map(s=><option key={s}>{s}</option>)}
            </select>
          </F>
          <F label="Emergency Protocol">
            <div className="flex gap-1">
              <input value={c.emergencyProtocol} onChange={e=>updateCondition(i,'emergencyProtocol',e.target.value)} className={IC} placeholder="e.g. Use inhaler" />
              <button onClick={()=>removeCondition(i)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg shrink-0"><X size={14}/></button>
            </div>
          </F>
        </div>
      ))}
      <button onClick={addCondition} className="flex items-center gap-1.5 text-xs text-[#0C447C] hover:underline font-medium mb-4"><Plus size={13}/>Add Condition</button>

      <SH>Current Medications</SH>
      {data.medications.map((m,i) => (
        <div key={i} className="grid grid-cols-4 gap-2 mb-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
          <F label="Medication Name">
            <input value={m.name} onChange={e=>updateMedication(i,'name',e.target.value)} className={IC} placeholder="e.g. Ventolin" />
          </F>
          <F label="Dosage">
            <input value={m.dosage} onChange={e=>updateMedication(i,'dosage',e.target.value)} className={IC} placeholder="100mcg" />
          </F>
          <F label="Frequency">
            <input value={m.frequency} onChange={e=>updateMedication(i,'frequency',e.target.value)} className={IC} placeholder="Twice daily" />
          </F>
          <F label="Kept At">
            <div className="flex gap-1">
              <select value={m.keptAt} onChange={e=>updateMedication(i,'keptAt',e.target.value)} className={IC}>
                {['home','school','student bag','office'].map(k=><option key={k}>{k}</option>)}
              </select>
              <button onClick={()=>removeMedication(i)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg shrink-0"><X size={14}/></button>
            </div>
          </F>
        </div>
      ))}
      <button onClick={addMedication} className="flex items-center gap-1.5 text-xs text-[#0C447C] hover:underline font-medium mb-4"><Plus size={13}/>Add Medication</button>

      <SH>Special Needs</SH>
      <div className="space-y-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={data.isSEN} onChange={e=>set('isSEN',e.target.checked)} className="w-4 h-4 accent-[#0C447C]" />
          <span className="text-sm font-medium text-slate-700">Has Special Educational Needs (SEN)</span>
        </label>
        {data.isSEN && <textarea rows={2} value={data.senDetails} onChange={e=>set('senDetails',e.target.value)} className={`${IC} resize-none`} placeholder="Describe SEN requirements and accommodations…" />}
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={data.hasPERestrictions} onChange={e=>set('hasPERestrictions',e.target.checked)} className="w-4 h-4 accent-[#0C447C]" />
          <span className="text-sm font-medium text-slate-700">PE / Physical Activity Restrictions</span>
        </label>
        {data.hasPERestrictions && <textarea rows={2} value={data.peRestrictions} onChange={e=>set('peRestrictions',e.target.value)} className={`${IC} resize-none`} placeholder="Describe physical activity restrictions…" />}
      </div>

      <SH>Dietary & Emergency</SH>
      <div className="grid grid-cols-2 gap-3">
        <F label="Dietary Restrictions">
          <input value={data.dietaryRestrictions} onChange={e=>set('dietaryRestrictions',e.target.value)} className={IC} placeholder="e.g. Halal, vegetarian, nut-free" />
        </F>
        <F label="Family Doctor Name">
          <input value={data.doctorName} onChange={e=>set('doctorName',e.target.value)} className={IC} placeholder="Dr. Name" />
        </F>
        <F label="Doctor Phone">
          <input value={data.doctorPhone} onChange={e=>set('doctorPhone',e.target.value)} className={IC} placeholder="+1 000 000 0000" />
        </F>
        <F label="Clinic / Hospital">
          <input value={data.doctorClinic} onChange={e=>set('doctorClinic',e.target.value)} className={IC} placeholder="Clinic name" />
        </F>
      </div>
      <div className="mt-3">
        <label className="block text-xs font-bold text-red-600 mb-1 flex items-center gap-1.5">
          <AlertTriangle size={12}/> CRITICAL — Emergency Medical Action
        </label>
        <textarea rows={3} value={data.emergencyAction} onChange={e=>set('emergencyAction',e.target.value)}
          className="w-full px-3 py-2 text-sm border-2 border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 resize-none bg-red-50 placeholder-red-300"
          placeholder="Describe exactly what to do in a medical emergency…" />
      </div>
    </div>
  )
}

// ─── STEP 7: SERVICES & CUSTOM FIELDS ─────────────────────────────────────────
function Step7Services({ data, setData, enrollmentFields }: { data: WizardData; setData: React.Dispatch<React.SetStateAction<WizardData>>; errors: Record<string, string>; enrollmentFields: EnrollmentFieldItem[] }) {
  const set  = (k: keyof WizardData, v: string | boolean) => setData(d => ({ ...d, [k]: v }))
  const setC = (k: string, v: any) => setData(d => ({ ...d, customFields: { ...d.customFields, [k]: v } }))

  const fieldsBySection = enrollmentFields.reduce((acc, f) => {
    const sec = f.section ?? 'other'
    if (!acc[sec]) acc[sec] = []
    acc[sec].push(f)
    return acc
  }, {} as Record<string, EnrollmentFieldItem[]>)

  const renderField = (f: EnrollmentFieldItem) => {
    const val = data.customFields[f.fieldKey] ?? ''
    const cls = f.isRequired && !val ? EC : IC
    switch (f.fieldType) {
      case 'textarea':
        return <textarea rows={2} value={val as string} onChange={e=>setC(f.fieldKey,e.target.value)} className={`${cls} resize-none`} placeholder={f.placeholder ?? ''} />
      case 'select':
        return (
          <select value={val as string} onChange={e=>setC(f.fieldKey,e.target.value)} className={cls}>
            <option value="">Select…</option>
            {f.options.map(o=><option key={o}>{o}</option>)}
          </select>
        )
      case 'multiselect':
        return (
          <div className="flex flex-wrap gap-2">
            {f.options.map(o => (
              <label key={o} className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={(val as string[]).includes(o)}
                  onChange={e => {
                    const arr = (val as string[] | undefined) ?? []
                    setC(f.fieldKey, e.target.checked ? [...arr, o] : arr.filter((x: string)=>x!==o))
                  }}
                  className="w-3.5 h-3.5 accent-[#0C447C]" />
                <span className="text-xs text-slate-700">{o}</span>
              </label>
            ))}
          </div>
        )
      case 'checkbox':
        return (
          <label className="flex items-center gap-2 cursor-pointer mt-1">
            <input type="checkbox" checked={!!val} onChange={e=>setC(f.fieldKey,e.target.checked)} className="w-4 h-4 accent-[#0C447C]" />
            <span className="text-sm text-slate-700">{f.helpText || f.label}</span>
          </label>
        )
      case 'date':
        return <input type="date" value={val as string} onChange={e=>setC(f.fieldKey,e.target.value)} className={cls} />
      case 'number':
        return <input type="number" value={val as string} onChange={e=>setC(f.fieldKey,e.target.value)} className={cls} placeholder={f.placeholder ?? ''} />
      default:
        return <input type={f.fieldType === 'email' ? 'email' : f.fieldType === 'phone' ? 'tel' : 'text'} value={val as string} onChange={e=>setC(f.fieldKey,e.target.value)} className={cls} placeholder={f.placeholder ?? ''} />
    }
  }

  return (
    <div>
      <SH>Services Required</SH>
      <div className="space-y-4">
        {/* Transport */}
        <div className="p-4 border border-slate-200 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-semibold text-sm text-slate-800">Transport Service</p>
              <p className="text-xs text-slate-400">School bus or van service</p>
            </div>
            <Toggle value={data.hasTransport} onChange={v=>set('hasTransport',v)} />
          </div>
          {data.hasTransport && (
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
              <F label="Route"><input value={data.transportRoute} onChange={e=>set('transportRoute',e.target.value)} className={IC} placeholder="Route name" /></F>
              <F label="Stop"><input value={data.transportStop} onChange={e=>set('transportStop',e.target.value)} className={IC} placeholder="Stop name" /></F>
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={data.transportMorning} onChange={e=>set('transportMorning',e.target.checked)} className="w-4 h-4 accent-[#0C447C]" /><span className="text-sm text-slate-700">Morning Pickup</span></label>
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={data.transportEvening} onChange={e=>set('transportEvening',e.target.checked)} className="w-4 h-4 accent-[#0C447C]" /><span className="text-sm text-slate-700">Evening Dropoff</span></label>
            </div>
          )}
        </div>
        {/* Hostel */}
        <div className="p-4 border border-slate-200 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <div><p className="font-semibold text-sm text-slate-800">Hostel Service</p><p className="text-xs text-slate-400">Boarding accommodation</p></div>
            <Toggle value={data.hasHostel} onChange={v=>set('hasHostel',v)} />
          </div>
          {data.hasHostel && <div className="pt-3 border-t border-slate-100"><F label="Room Preference"><input value={data.hostelRoom} onChange={e=>set('hostelRoom',e.target.value)} className={IC} placeholder="e.g. Single, Ground Floor" /></F></div>}
        </div>
        {/* Cafeteria */}
        <div className="p-4 border border-slate-200 rounded-xl flex items-center justify-between">
          <div><p className="font-semibold text-sm text-slate-800">Cafeteria Service</p><p className="text-xs text-slate-400">School meal plan</p></div>
          <Toggle value={data.hasCafeteria} onChange={v=>set('hasCafeteria',v)} />
        </div>
        {/* Sibling */}
        <div className="p-4 border border-slate-200 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <div><p className="font-semibold text-sm text-slate-800">Sibling at School</p><p className="text-xs text-slate-400">Another child enrolled here</p></div>
            <Toggle value={data.hasSibling} onChange={v=>set('hasSibling',v)} />
          </div>
          {data.hasSibling && (
            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100">
              <F label="Sibling Name"><input value={data.siblingName} onChange={e=>set('siblingName',e.target.value)} className={IC} placeholder="Full name" /></F>
              <F label="Admission No"><input value={data.siblingAdmissionNo} onChange={e=>set('siblingAdmissionNo',e.target.value)} className={IC} placeholder="e.g. STU-2024-0001" /></F>
              <F label="Grade"><input value={data.siblingGrade} onChange={e=>set('siblingGrade',e.target.value)} className={IC} placeholder="e.g. Grade 3" /></F>
            </div>
          )}
        </div>
      </div>

      {/* Custom Fields by section */}
      {Object.entries(fieldsBySection).map(([section, fields]) => (
        <div key={section}>
          <SH>{section.charAt(0).toUpperCase() + section.slice(1)} — Additional Fields</SH>
          <div className="grid grid-cols-2 gap-3">
            {fields.map(f => (
              <F key={f.fieldKey} label={f.label} required={f.isRequired}
                span2={f.fieldType === 'textarea' || f.fieldType === 'multiselect'}>
                {renderField(f)}
                {f.helpText && <p className="text-xs text-slate-400 mt-0.5">{f.helpText}</p>}
              </F>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── STEP 8: REVIEW & SUBMIT ──────────────────────────────────────────────────
function ReviewSection({ title, rows }: { title: string; rows: Array<[string, string | undefined]> }) {
  const [open, setOpen] = useState(true)
  const visible = rows.filter(([, v]) => v)
  if (visible.length === 0) return null
  return (
    <div className="mb-3 border border-slate-200 rounded-xl overflow-hidden">
      <button onClick={()=>setOpen(o=>!o)} className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors">
        <span className="font-semibold text-sm text-slate-800">{title}</span>
        {open ? <ChevronUp size={15} className="text-slate-400"/> : <ChevronDown size={15} className="text-slate-400"/>}
      </button>
      {open && (
        <div className="px-4 py-3 grid grid-cols-2 gap-x-6 gap-y-2">
          {visible.map(([label, value]) => (
            <div key={label}>
              <p className="text-xs text-slate-400">{label}</p>
              <p className="text-sm font-medium text-slate-700 break-words">{value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Step8Review({ data, setData, errors }: { data: WizardData; setData: React.Dispatch<React.SetStateAction<WizardData>>; errors: Record<string, string> }) {
  return (
    <div>
      <div className="flex items-start gap-3 mb-5 p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <AlertTriangle size={18} className="text-amber-500 mt-0.5 shrink-0" />
        <p className="text-sm text-amber-700 font-medium">Please review all information carefully before submitting. Changes may require admin approval after enrollment.</p>
      </div>

      <ReviewSection title="Student Identity" rows={[
        ['Full Name', [data.firstName, data.middleName, data.lastName].filter(Boolean).join(' ')],
        ['Arabic Name', data.arabicName], ['Preferred Name', data.preferredName],
        ['Date of Birth', data.dateOfBirth], ['Place of Birth', data.placeOfBirth],
        ['Gender', data.gender], ['Nationality', data.nationality],
        ['Second Nationality', data.secondNationality], ['Religion', data.religion],
        ['Blood Group', data.bloodGroup], ['Mother Tongue', data.motherTongue],
        ['Passport No', data.passportNo], ['National ID', data.nationalId],
      ]} />

      <ReviewSection title="Contact & Address" rows={[
        ['Phone', data.studentPhone], ['Email', data.studentEmail],
        ['Current Address', [data.curStreet, data.curCity, data.curCountry].filter(Boolean).join(', ')],
      ]} />

      <ReviewSection title="Admission" rows={[
        ['Admission Date', data.admissionDate], ['Admission Type', data.admissionType],
        ['Grade', data.gradeLevelName], ['Campus', data.campusName],
        ['Academic Year', data.academicYearName], ['Status', data.status],
        ['Previous School', data.prevSchoolName], ['Transfer Certificate', data.transferCertNo],
      ]} />

      <ReviewSection title="Primary Guardian" rows={[
        ['Name', [data.g1.title, data.g1.firstName, data.g1.lastName].filter(Boolean).join(' ')],
        ['Relationship', data.g1.relationship], ['Phone', data.g1.phone],
        ['Email', data.g1.email], ['Occupation', data.g1.occupation],
      ]} />

      {data.hasSecondGuardian && data.g2.firstName && (
        <ReviewSection title="Secondary Guardian" rows={[
          ['Name', [data.g2.title, data.g2.firstName, data.g2.lastName].filter(Boolean).join(' ')],
          ['Relationship', data.g2.relationship], ['Phone', data.g2.phone],
          ['Email', data.g2.email],
        ]} />
      )}

      <ReviewSection title="Health" rows={[
        ['Blood Group', data.bloodGroup],
        ['Allergies', data.allergies.length > 0 ? data.allergies.map(a=>a.name).join(', ') : undefined],
        ['Conditions', data.conditions.length > 0 ? data.conditions.map(c=>c.name).join(', ') : undefined],
        ['SEN', data.isSEN ? 'Yes' : undefined],
        ['Dietary Restrictions', data.dietaryRestrictions],
        ['Emergency Action', data.emergencyAction ? 'Recorded ✓' : undefined],
      ]} />

      <ReviewSection title="Services" rows={[
        ['Transport', data.hasTransport ? `Yes — Route: ${data.transportRoute || 'TBD'}` : undefined],
        ['Hostel', data.hasHostel ? 'Yes' : undefined],
        ['Cafeteria', data.hasCafeteria ? 'Yes' : undefined],
        ['Sibling', data.hasSibling ? data.siblingName : undefined],
      ]} />

      <div className="mt-5 p-4 border-2 border-[#0C447C] rounded-xl bg-[#0C447C]/5">
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={data.confirmed} onChange={e=>setData(d=>({...d,confirmed:e.target.checked}))} className="w-4 h-4 mt-0.5 accent-[#0C447C]" />
          <span className="text-sm font-semibold text-[#0C447C]">I confirm that all the information provided is accurate and complete. I understand this creates an official enrollment record.</span>
        </label>
        {errors.confirmed && <p className="text-xs text-red-500 mt-2">{errors.confirmed}</p>}
      </div>
    </div>
  )
}

// ─── WIZARD VALIDATION ────────────────────────────────────────────────────────
function getStepErrors(step: number, data: WizardData): Record<string, string> {
  const e: Record<string, string> = {}
  if (step === 1) {
    if (!data.firstName.trim())  e.firstName  = 'First name is required'
    if (!data.lastName.trim())   e.lastName   = 'Last name is required'
    if (!data.dateOfBirth)       e.dateOfBirth = 'Date of birth is required'
    if (!data.gender)            e.gender     = 'Gender is required'
    if (!data.nationality.trim()) e.nationality = 'Nationality is required'
  }
  if (step === 3) {
    if (!data.admissionDate)  e.admissionDate  = 'Admission date is required'
    if (!data.admissionType)  e.admissionType  = 'Admission type is required'
    if (!data.status)         e.status         = 'Status is required'
  }
  if (step === 4) {
    if (!data.g1.firstName.trim())  e.g1_firstName  = 'Required'
    if (!data.g1.lastName.trim())   e.g1_lastName   = 'Required'
    if (!data.g1.relationship)      e.g1_relationship = 'Required'
    if (!data.g1.phone.trim())      e.g1_phone      = 'Required'
  }
  if (step === 5 && data.hasSecondGuardian) {
    if (!data.g2.firstName.trim())  e.g2_firstName  = 'Required'
    if (!data.g2.lastName.trim())   e.g2_lastName   = 'Required'
    if (!data.g2.relationship)      e.g2_relationship = 'Required'
    if (!data.g2.phone.trim())      e.g2_phone      = 'Required'
  }
  if (step === 8) {
    if (!data.confirmed) e.confirmed = 'Please confirm before submitting'
  }
  return e
}

// ─── BUILD PAYLOAD ────────────────────────────────────────────────────────────
function buildPayload(d: WizardData) {
  return {
    personal: {
      firstName: d.firstName, middleName: d.middleName || undefined, lastName: d.lastName,
      dateOfBirth: d.dateOfBirth || undefined, placeOfBirth: d.placeOfBirth || undefined,
      gender: d.gender || undefined, nationality: d.nationality || undefined,
      bloodGroup: d.bloodGroup || undefined, motherTongue: d.motherTongue || undefined,
    },
    contact: {
      phone: d.studentPhone || undefined,
      email: d.studentEmail || undefined,
    },
    admission: {
      admissionDate: d.admissionDate || undefined,
      admissionType: d.admissionType || undefined,
      previousSchoolName: d.prevSchoolName || undefined,
    },
    currentPlacement: {
      gradeLevelName: d.gradeLevelName || undefined,
    },
    status: d.status,
    flags: {
      isSEN: d.isSEN,
      hasTransportService: d.hasTransport,
    },
    tags: [],
  }
}

// ─── ENROLLMENT WIZARD ────────────────────────────────────────────────────────
const DRAFT_KEY = 'eldermin_enroll_draft'

function EnrollmentWizard({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient()
  const [step, setStep] = useState(1)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [data, setData] = useState<WizardData>(() => {
    try {
      const s = localStorage.getItem(DRAFT_KEY)
      if (s) return JSON.parse(s) as WizardData
    } catch { /* ignore */ }
    return EMPTY
  })

  const { data: enrollmentFields = [] } = useQuery({
    queryKey: ['enrollment-fields'],
    queryFn: studentsService.getEnrollmentFields,
  })

  const submitMutation = useMutation({
    mutationFn: async (d: WizardData) => {
      const student = await studentsService.createStudent(buildPayload(d))
      if (d.g1.firstName.trim()) {
        await studentsService.createGuardian({
          firstName: d.g1.firstName, lastName: d.g1.lastName,
          phone: d.g1.phone, email: d.g1.email || undefined,
          occupation: d.g1.occupation || undefined, employer: d.g1.employer || undefined,
          studentId: student._id,
        })
      }
      if (d.hasSecondGuardian && d.g2.firstName.trim()) {
        await studentsService.createGuardian({
          firstName: d.g2.firstName, lastName: d.g2.lastName,
          phone: d.g2.phone, email: d.g2.email || undefined,
          occupation: d.g2.occupation || undefined, employer: d.g2.employer || undefined,
          studentId: student._id,
        })
      }
      return student
    },
    onSuccess: (student: any) => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
      queryClient.invalidateQueries({ queryKey: ['students-dashboard'] })
      localStorage.removeItem(DRAFT_KEY)
      toast.success(`Enrolled! Admission No: ${student.admissionNo}`)
      onClose()
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Enrollment failed'),
  })

  const next = () => {
    const errs = getStepErrors(step, data)
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    setStep(s => Math.min(s + 1, 8))
  }
  const back = () => { setErrors({}); setStep(s => Math.max(s - 1, 1)) }
  const submit = () => {
    const errs = getStepErrors(8, data)
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    submitMutation.mutate(data)
  }
  const saveDraft = () => { localStorage.setItem(DRAFT_KEY, JSON.stringify(data)); toast.success('Draft saved') }

  const stepProps = { data, setData, errors }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden" style={{ width:'90vw', height:'90vh', maxWidth:'1200px' }}>
        {/* Header */}
        <div className="bg-[#0C447C] px-6 py-4 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-white font-bold text-base">Student Enrollment Wizard</h2>
              <p className="text-blue-200 text-xs mt-0.5">Step {step} of 8 — {STEP_LABELS[step-1]}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={saveDraft}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-white/30 text-white rounded-lg hover:bg-white/10 font-medium transition-colors">
                Save Draft
              </button>
              <button onClick={onClose} className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>
          </div>
          <StepIndicator step={step} />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-white">
          {step === 1 && <Step1Identity    {...stepProps} />}
          {step === 2 && <Step2Contact     {...stepProps} />}
          {step === 3 && <Step3Admission   {...stepProps} />}
          {step === 4 && <Step4Guardian    {...stepProps} />}
          {step === 5 && <Step5Secondary   {...stepProps} />}
          {step === 6 && <Step6Health      {...stepProps} />}
          {step === 7 && <Step7Services    data={data} setData={setData} errors={errors} enrollmentFields={enrollmentFields as EnrollmentFieldItem[]} />}
          {step === 8 && <Step8Review      {...stepProps} />}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between shrink-0 bg-slate-50">
          <p className="text-xs text-slate-400">
            {step < 8 ? 'Complete required fields (*) to proceed to next step' : 'Review all information, then confirm and submit'}
          </p>
          <div className="flex gap-3">
            {step > 1 && (
              <button onClick={back} className="flex items-center gap-1.5 px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-600 font-medium">
                <ChevronLeft size={15} />Back
              </button>
            )}
            {step < 8 ? (
              <button onClick={next} className="flex items-center gap-1.5 px-5 py-2 text-sm bg-[#0C447C] text-white rounded-lg hover:bg-[#0b3d6e] font-medium">
                Next<ChevronRight size={15} />
              </button>
            ) : (
              <button onClick={submit} disabled={!data.confirmed || submitMutation.isPending}
                className="flex items-center gap-1.5 px-5 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                <Check size={15} />{submitMutation.isPending ? 'Enrolling…' : 'Submit Enrollment'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── MANAGE CUSTOM FIELDS MODAL ───────────────────────────────────────────────
const FIELD_TYPES = ['text','number','date','select','multiselect','checkbox','textarea','phone','email']
const SECTIONS    = ['personal','admission','health','services','other']

function ManageCustomFieldsModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient()
  const { data: fields = [], isLoading } = useQuery({
    queryKey: ['enrollment-fields'],
    queryFn: studentsService.getEnrollmentFields,
  })
  const [editId, setEditId]   = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [newF, setNewF] = useState({ label:'', fieldKey:'', fieldType:'text', section:'personal', isRequired:false, options:'' })

  const createMutation = useMutation({
    mutationFn: (payload: any) => studentsService.createEnrollmentField(payload),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['enrollment-fields'] }); toast.success('Field added'); setShowAdd(false); setNewF({ label:'', fieldKey:'', fieldType:'text', section:'personal', isRequired:false, options:'' }) },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed'),
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => studentsService.updateEnrollmentField(id, payload),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['enrollment-fields'] }); setEditId(null); toast.success('Field updated') },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Cannot update system fields'),
  })
  const deleteMutation = useMutation({
    mutationFn: (id: string) => studentsService.deleteEnrollmentField(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['enrollment-fields'] }); toast.success('Field deleted') },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Cannot delete system fields'),
  })

  const allFields = fields as EnrollmentFieldItem[]
  const bySection = allFields.reduce((acc, f) => {
    const s = f.section ?? 'other'
    if (!acc[s]) acc[s] = []
    acc[s].push(f)
    return acc
  }, {} as Record<string, EnrollmentFieldItem[]>)

  const handleKeyGen = (label: string) =>
    label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')

  const addField = () => {
    if (!newF.label.trim()) { toast.error('Label is required'); return }
    const opts = newF.options.split(',').map(o=>o.trim()).filter(Boolean)
    createMutation.mutate({
      label: newF.label, fieldKey: newF.fieldKey || handleKeyGen(newF.label),
      fieldType: newF.fieldType, section: newF.section,
      isRequired: newF.isRequired, options: opts,
    })
  }

  const reorder = (f: EnrollmentFieldItem, dir: -1 | 1) => {
    updateMutation.mutate({ id: f._id, payload: { sortOrder: f.sortOrder + dir } })
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col" style={{ maxHeight:'85vh' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-[#0C447C] rounded-t-2xl shrink-0">
          <div>
            <h2 className="font-bold text-white text-sm">Manage Enrollment Fields</h2>
            <p className="text-blue-200 text-xs mt-0.5">{allFields.length} fields · {allFields.filter(f=>!f.isSystemField).length} custom</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowAdd(s=>!s)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#EF9F27] text-white rounded-lg hover:bg-[#d98e22] font-medium">
              <Plus size={13}/>Add Field
            </button>
            <button onClick={onClose} className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg"><X size={18}/></button>
          </div>
        </div>

        {/* Add form */}
        {showAdd && (
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 shrink-0">
            <p className="font-semibold text-sm text-slate-800 mb-3">New Custom Field</p>
            <div className="grid grid-cols-3 gap-3">
              <F label="Label" required>
                <input value={newF.label} onChange={e=>{ const l=e.target.value; setNewF(p=>({...p, label:l, fieldKey:handleKeyGen(l)})) }} className={IC} placeholder="Field label" />
              </F>
              <F label="Field Key">
                <input value={newF.fieldKey} onChange={e=>setNewF(p=>({...p,fieldKey:e.target.value}))} className={IC} placeholder="auto_generated" />
              </F>
              <F label="Field Type">
                <select value={newF.fieldType} onChange={e=>setNewF(p=>({...p,fieldType:e.target.value}))} className={IC}>
                  {FIELD_TYPES.map(t=><option key={t}>{t}</option>)}
                </select>
              </F>
              <F label="Section">
                <select value={newF.section} onChange={e=>setNewF(p=>({...p,section:e.target.value}))} className={IC}>
                  {SECTIONS.map(s=><option key={s}>{s}</option>)}
                </select>
              </F>
              <F label="Options (comma-separated)" span2={newF.fieldType==='select'||newF.fieldType==='multiselect'}>
                {(newF.fieldType==='select'||newF.fieldType==='multiselect')
                  ? <input value={newF.options} onChange={e=>setNewF(p=>({...p,options:e.target.value}))} className={IC} placeholder="Option 1, Option 2, Option 3" />
                  : <span className="text-xs text-slate-400 py-2 block">N/A for this field type</span>}
              </F>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer mb-1">
                  <input type="checkbox" checked={newF.isRequired} onChange={e=>setNewF(p=>({...p,isRequired:e.target.checked}))} className="w-4 h-4 accent-[#0C447C]" />
                  <span className="text-sm text-slate-700 font-medium">Required</span>
                </label>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={()=>setShowAdd(false)} className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 font-medium">Cancel</button>
              <button onClick={addField} disabled={createMutation.isPending} className="px-4 py-2 text-sm bg-[#0C447C] text-white rounded-lg hover:bg-[#0b3d6e] font-medium disabled:opacity-50">
                {createMutation.isPending ? 'Adding…' : 'Add Field'}
              </button>
            </div>
          </div>
        )}

        {/* Fields list */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? <Spinner /> : Object.entries(bySection).map(([section, sFields]) => (
            <div key={section}>
              <div className="px-5 py-2 bg-slate-50 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{section}</p>
              </div>
              {sFields.map(f => (
                <div key={f._id} className="flex items-center gap-3 px-5 py-3 border-b border-slate-50 hover:bg-slate-50">
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button onClick={()=>reorder(f,-1)} disabled={f.isSystemField} className="p-0.5 text-slate-300 hover:text-slate-500 disabled:cursor-not-allowed"><ArrowUp size={12}/></button>
                    <button onClick={()=>reorder(f,1)}  disabled={f.isSystemField} className="p-0.5 text-slate-300 hover:text-slate-500 disabled:cursor-not-allowed"><ArrowDown size={12}/></button>
                  </div>
                  <div className="flex-1 min-w-0">
                    {editId === f._id ? (
                      <div className="flex gap-2 items-center">
                        <input value={editLabel} onChange={e=>setEditLabel(e.target.value)}
                          className="flex-1 px-2 py-1 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]" />
                        <button onClick={()=>updateMutation.mutate({ id:f._id, payload:{ label:editLabel } })} className="px-2 py-1 text-xs bg-[#0C447C] text-white rounded-lg">Save</button>
                        <button onClick={()=>setEditId(null)} className="px-2 py-1 text-xs border border-slate-200 rounded-lg">Cancel</button>
                      </div>
                    ) : (
                      <div>
                        <span className="text-sm font-medium text-slate-800">{f.label}</span>
                        <span className="text-xs text-slate-400 ml-2 font-mono">{f.fieldKey}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge v="gray">{f.fieldType}</Badge>
                    {f.isRequired && <Badge v="amber">Required</Badge>}
                    {f.isSystemField ? <Badge v="navy">System</Badge> : <Badge v="blue">Custom</Badge>}
                  </div>
                  {!f.isSystemField && editId !== f._id && (
                    <div className="flex gap-1 shrink-0">
                      <button onClick={()=>{ setEditId(f._id); setEditLabel(f.label) }} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg"><Edit2 size={13}/></button>
                      <button onClick={()=>deleteMutation.mutate(f._id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={13}/></button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}


// ─── BULK IMPORT MODAL ─────────────────────────────────────────────────────────
type ImportStep = 'upload' | 'preview' | 'result'

function BulkImportModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient()
  const [step, setStep] = useState<ImportStep>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [previewData, setPreviewData] = useState<any>(null)
  const [duplicateAction, setDuplicateAction] = useState<'skip' | 'update' | 'createAnyway'>('skip')
  const [result, setResult] = useState<any>(null)

  const previewMutation = useMutation({
    mutationFn: (f: File) => studentsService.previewBulkImport(f),
    onSuccess: (data: any) => { setPreviewData(data); setStep('preview') },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to parse CSV'),
  })

  const commitMutation = useMutation({
    mutationFn: () => {
      const validRows = (previewData?.preview ?? []).filter((r: any) => r.errors.length === 0)
      return studentsService.commitBulkImport({ rows: validRows, duplicateAction })
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
      queryClient.invalidateQueries({ queryKey: ['students-dashboard'] })
      setResult(data)
      setStep('result')
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Import failed'),
  })

  const downloadTemplate = async () => {
    try {
      const blob = await studentsService.getBulkImportTemplate()
      const url = window.URL.createObjectURL(new Blob([blob]))
      const a = document.createElement('a')
      a.href = url
      a.download = 'student-import-template.csv'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      toast.error('Failed to download template')
    }
  }

  const handleFileSelect = (f: File | null) => {
    if (!f) return
    if (!f.name.toLowerCase().endsWith('.csv')) { toast.error('Please select a CSV file'); return }
    setFile(f)
  }

  const handlePreview = () => {
    if (!file) { toast.error('Please select a file first'); return }
    previewMutation.mutate(file)
  }

  const reset = () => { setStep('upload'); setFile(null); setPreviewData(null); setResult(null) }

  const validRows = previewData?.preview?.filter((r: any) => r.errors.length === 0) ?? []
  const invalidRows = previewData?.preview?.filter((r: any) => r.errors.length > 0) ?? []
  const duplicateCount = previewData?.duplicates?.length ?? 0

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col" style={{ maxHeight: '90vh' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-[#0C447C] rounded-t-2xl shrink-0">
          <div>
            <h2 className="font-bold text-white text-sm">Bulk Import Students</h2>
            <p className="text-blue-200 text-xs mt-0.5">
              {step === 'upload' && 'Step 1 of 3 — Upload CSV'}
              {step === 'preview' && 'Step 2 of 3 — Review & Confirm'}
              {step === 'result' && 'Step 3 of 3 — Import Complete'}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {step === 'upload' && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                <AlertCircle size={16} className="text-amber-500 mt-0.5 shrink-0" />
                <div className="text-xs text-amber-700 space-y-1">
                  <p>Download the template first — it includes a guidance row explaining each column, and the importer automatically skips that row and the sample row for you.</p>
                  <ul className="list-disc list-inside space-y-0.5 pl-1">
                    <li>Required: firstName, lastName (leave blank if one name only), dateOfBirth, gender, currentGrade</li>
                    <li>dateOfBirth: DD/MM/YYYY or YYYY-MM-DD</li>
                    <li>gender: male or female</li>
                    <li>If any field (like address) contains a comma, wrap the whole field in quotes — e.g. "House 12, Block A"</li>
                  </ul>
                </div>
              </div>
              <button onClick={downloadTemplate}
                className="flex items-center gap-2 px-4 py-2.5 text-sm border border-[#0C447C] text-[#0C447C] rounded-lg hover:bg-[#0C447C]/5 font-medium w-full justify-center">
                <FileSpreadsheet size={15} />Download CSV Template
              </button>
              <label className="block border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer hover:border-[#0C447C] hover:bg-slate-50 transition-colors">
                <input type="file" accept=".csv" className="hidden"
                  onChange={e => handleFileSelect(e.target.files?.[0] ?? null)} />
                <Upload size={28} className="mx-auto text-slate-300 mb-2" />
                {file ? (
                  <p className="text-sm font-medium text-slate-700">{file.name}</p>
                ) : (
                  <>
                    <p className="text-sm font-medium text-slate-600">Click to select a CSV file</p>
                    <p className="text-xs text-slate-400 mt-1">or drag and drop</p>
                  </>
                )}
              </label>
            </div>
          )}

          {step === 'preview' && previewData && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                  <p className="text-2xl font-bold text-emerald-600">{previewData.validRows}</p>
                  <p className="text-xs text-emerald-700 font-medium">Valid Rows</p>
                </div>
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-center">
                  <p className="text-2xl font-bold text-red-500">{previewData.invalidRows}</p>
                  <p className="text-xs text-red-600 font-medium">Invalid Rows</p>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
                  <p className="text-2xl font-bold text-amber-500">{duplicateCount}</p>
                  <p className="text-xs text-amber-700 font-medium">Duplicates Found</p>
                </div>
              </div>

              {duplicateCount > 0 && (
                <div className="p-3 border border-slate-200 rounded-xl">
                  <p className="text-xs font-semibold text-slate-700 mb-2">How should duplicates be handled?</p>
                  <div className="flex gap-3">
                    {(['skip', 'update', 'createAnyway'] as const).map(opt => (
                      <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
                        <input type="radio" name="dupAction" checked={duplicateAction === opt}
                          onChange={() => setDuplicateAction(opt)} className="w-3.5 h-3.5 accent-[#0C447C]" />
                        <span className="text-xs text-slate-600 capitalize">
                          {opt === 'createAnyway' ? 'Create anyway' : opt}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="overflow-y-auto" style={{ maxHeight: '280px' }}>
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold text-slate-500">Row</th>
                        <th className="px-3 py-2 text-left font-semibold text-slate-500">Name</th>
                        <th className="px-3 py-2 text-left font-semibold text-slate-500">Grade</th>
                        <th className="px-3 py-2 text-left font-semibold text-slate-500">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(previewData.preview ?? []).map((r: any) => (
                        <tr key={r.row} className={`border-t border-slate-50 ${r.errors.length > 0 ? 'bg-red-50' : ''}`}>
                          <td className="px-3 py-2 text-slate-500">{r.row}</td>
                          <td className="px-3 py-2 text-slate-700">{[r.data.firstName, r.data.lastName].filter(Boolean).join(' ') || '—'}</td>
                          <td className="px-3 py-2 text-slate-500">{r.data.currentGrade || '—'}</td>
                          <td className="px-3 py-2">
                            {r.errors.length > 0 ? (
                              <span className="text-red-600">{r.errors.join('; ')}</span>
                            ) : r.isDuplicate ? (
                              <span className="text-amber-600">Duplicate</span>
                            ) : (
                              <span className="text-emerald-600">Ready</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              {invalidRows.length > 0 && (
                <p className="text-xs text-slate-400">
                  {invalidRows.length} row(s) have errors and will be skipped. Only valid rows will be imported.
                </p>
              )}
            </div>
          )}

          {step === 'result' && result && (
            <div className="text-center py-6 space-y-4">
              <CheckCircle2 size={40} className="mx-auto text-emerald-500" />
              <p className="font-semibold text-slate-800">Import Complete</p>
              <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
                <div>
                  <p className="text-xl font-bold text-emerald-600">{result.created}</p>
                  <p className="text-xs text-slate-400">Created</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-blue-600">{result.updated}</p>
                  <p className="text-xs text-slate-400">Updated</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-slate-400">{result.skipped}</p>
                  <p className="text-xs text-slate-400">Skipped</p>
                </div>
              </div>
              {result.failed?.length > 0 && (
                <div className="text-left p-3 bg-red-50 border border-red-200 rounded-xl max-w-md mx-auto">
                  <p className="text-xs font-semibold text-red-600 mb-1">{result.failed.length} row(s) failed:</p>
                  {result.failed.map((f: any, i: number) => (
                    <p key={i} className="text-xs text-red-500">Row {f.row}: {f.error}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-slate-100 flex justify-end gap-2 shrink-0 bg-slate-50">
          {step === 'upload' && (
            <>
              <button onClick={onClose} className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 font-medium">Cancel</button>
              <button onClick={handlePreview} disabled={!file || previewMutation.isPending}
                className="flex items-center gap-1.5 px-4 py-2 text-sm bg-[#0C447C] text-white rounded-lg hover:bg-[#0b3d6e] font-medium disabled:opacity-50">
                {previewMutation.isPending ? <><Loader2 size={14} className="animate-spin" />Parsing…</> : 'Preview'}
              </button>
            </>
          )}
          {step === 'preview' && (
            <>
              <button onClick={reset} className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 font-medium">Back</button>
              <button onClick={() => commitMutation.mutate()} disabled={validRows.length === 0 || commitMutation.isPending}
                className="flex items-center gap-1.5 px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium disabled:opacity-50">
                {commitMutation.isPending ? <><Loader2 size={14} className="animate-spin" />Importing…</> : `Import ${validRows.length} Student(s)`}
              </button>
            </>
          )}
          {step === 'result' && (
            <button onClick={onClose} className="px-4 py-2 text-sm bg-[#0C447C] text-white rounded-lg hover:bg-[#0b3d6e] font-medium">Done</button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── STUDENTS TAB ─────────────────────────────────────────────────────────────
function StudentsTab() {
  const navigate = useNavigate()
  const [search, setSearch]           = useState('')
  const [debouncedSearch, setDebounced] = useState('')
  const [showWizard, setShowWizard]   = useState(false)
  const [showManage, setShowManage]   = useState(false)
  const [showBulkImport, setShowBulkImport] = useState(false)
  const [showPrintReport, setShowPrintReport] = useState(false)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 400)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => { setPage(1) }, [debouncedSearch])

  const { data: studentsData, isLoading } = useStudents({ search: debouncedSearch || undefined, page, limit })

  const rows = ((studentsData as any)?.data ?? []) as any[]
  const meta = (studentsData as any)?.meta ?? { total: rows.length, pages: 1 }
  const fullName = useCallback((s: any) =>
    [s?.firstName, s?.lastName].filter(Boolean).join(' ') || '—', [])

  return (
    <Card>
      <CardHeader title="Student Directory" sub={`${rows.length} students`} actions={
        <>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search students…"
              className="pl-9 pr-4 py-1.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0C447C] w-52" />
          </div>
          <Btn variant="secondary"><Download size={13}/>Export</Btn>
          <button onClick={() => setShowPrintReport(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-slate-200 bg-white text-slate-600 rounded-lg hover:bg-slate-50 font-medium transition-colors">
            <Printer size={13}/>Print Report
          </button>
          <button onClick={() => setShowBulkImport(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-slate-200 bg-white text-slate-600 rounded-lg hover:bg-slate-50 font-medium transition-colors">
            <Upload size={13}/>Bulk Import
          </button>
          <button onClick={() => setShowManage(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-slate-200 bg-white text-slate-600 rounded-lg hover:bg-slate-50 font-medium transition-colors">
            <Settings size={13}/>Custom Fields
          </button>
          <button onClick={() => setShowWizard(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#0C447C] text-white rounded-lg hover:bg-[#0b3d6e] font-medium transition-colors">
            <Plus size={13}/>Enroll Student
          </button>
        </>
      }/>
      {isLoading ? <Spinner /> : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <THead cols={['Admission No','Full Name','Gender','Status','Grade','Actions']} />
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-400">No students found. Click "Enroll Student" to get started.</td></tr>
              ) : rows.map((s: any) => (
                <tr key={s._id} className="border-t border-slate-50 hover:bg-slate-50">
                  <td className="px-4 py-3 text-xs font-mono font-semibold text-[#0C447C]">{s.admissionNumber}</td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-800">{fullName(s)}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 capitalize">{s.gender || '—'}</td>
                  <td className="px-4 py-3"><Badge v={statusBV(s.status)}>{s.status}</Badge></td>
                  <td className="px-4 py-3 text-xs text-slate-500">{s.currentGrade || '—'}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => navigate(`/students/${s._id}`)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[#0C447C] text-[#0C447C] rounded-lg hover:bg-[#0C447C] hover:text-white font-medium transition-colors whitespace-nowrap">
                      <ExternalLink size={11}/>View Profile
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination total={meta.total ?? rows.length} showing={rows.length}
        page={page} pages={meta.pages ?? 1} limit={limit}
        onPageChange={setPage} onLimitChange={(l) => { setLimit(l); setPage(1) }} />
      {showWizard && <EnrollmentWizard onClose={() => setShowWizard(false)} />}
      {showManage && <ManageCustomFieldsModal onClose={() => setShowManage(false)} />}
      {showBulkImport && <BulkImportModal onClose={() => setShowBulkImport(false)} />}
      {showPrintReport && <PrintReportModal onClose={() => setShowPrintReport(false)} />}
    </Card>
  )
}

// ─── PRINT STUDENT LIST REPORT MODAL ──────────────────────────────────────────
const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive / Left' },
  { value: 'on_leave', label: 'On Leave' },
  { value: 'transferred', label: 'Transferred' },
  { value: 'graduated', label: 'Graduated' },
  { value: 'expelled', label: 'Expelled' },
]

function PrintReportModal({ onClose }: { onClose: () => void }) {
  const { data: filterOptions } = useQuery({
    queryKey: ['students', 'filter-options'],
    queryFn: () => studentsService.getDistinctGradesSections(),
  })
  const grades: string[] = (filterOptions as any)?.grades || []
  const sections: string[] = (filterOptions as any)?.sections || []
  const [selectedGrades, setSelectedGrades] = useState<Set<string>>(new Set())
  const [selectedSections, setSelectedSections] = useState<Set<string>>(new Set())
  const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(new Set(['active']))
  const [generating, setGenerating] = useState(false)

  const toggle = (set: Set<string>, setter: (s: Set<string>) => void, value: string) => {
    const next = new Set(set)
    next.has(value) ? next.delete(value) : next.add(value)
    setter(next)
  }

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      await studentsService.generateStudentListPdf({
        grades: selectedGrades.size > 0 ? Array.from(selectedGrades) : undefined,
        sections: selectedSections.size > 0 ? Array.from(selectedSections) : undefined,
        statuses: selectedStatuses.size > 0 ? Array.from(selectedStatuses) : undefined,
      })
      toast.success('Report generated')
      onClose()
    } catch {
      toast.error('Failed to generate report — please try again')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col" style={{ maxHeight: '85vh' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-[#0C447C] rounded-t-2xl shrink-0">
          <div>
            <h2 className="font-bold text-white text-sm">Print Student List Report</h2>
            <p className="text-blue-200 text-xs mt-0.5">GR No, guardians with CNIC, age, B-Form, address</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">Class / Grade</p>
              <span className="text-[10px] text-slate-400">{selectedGrades.size === 0 ? 'All grades' : `${selectedGrades.size} selected`}</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 max-h-32 overflow-y-auto p-2 border border-slate-200 rounded-lg">
              {grades.length === 0 && <p className="text-xs text-slate-400 italic col-span-3">No grade data found on existing students yet.</p>}
              {grades.map(g => (
                <label key={g} className="flex items-center gap-1.5 text-xs cursor-pointer">
                  <input type="checkbox" checked={selectedGrades.has(g)}
                    onChange={() => toggle(selectedGrades, setSelectedGrades, g)}
                    className="w-3.5 h-3.5 accent-[#0C447C]" />
                  {g}
                </label>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">Section</p>
              <span className="text-[10px] text-slate-400">{selectedSections.size === 0 ? 'All sections' : `${selectedSections.size} selected`}</span>
            </div>
            {sections.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No section data found on existing students yet.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {sections.map(s => (
                  <label key={s} className="flex items-center gap-1.5 text-xs cursor-pointer border border-slate-200 rounded-lg px-2 py-1">
                    <input type="checkbox" checked={selectedSections.has(s)}
                      onChange={() => toggle(selectedSections, setSelectedSections, s)}
                      className="w-3.5 h-3.5 accent-[#0C447C]" />
                    {s}
                  </label>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Status</p>
            <div className="grid grid-cols-2 gap-1.5">
              {STATUS_OPTIONS.map(opt => (
                <label key={opt.value} className="flex items-center gap-1.5 text-xs cursor-pointer">
                  <input type="checkbox" checked={selectedStatuses.has(opt.value)}
                    onChange={() => toggle(selectedStatuses, setSelectedStatuses, opt.value)}
                    className="w-3.5 h-3.5 accent-[#0C447C]" />
                  {opt.label}
                </label>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 mt-2">
              Note: the system doesn't currently track a separate "Suspended" status — closest matches are Inactive/Left or On Leave.
            </p>
          </div>
        </div>
        <div className="px-5 py-4 border-t border-slate-100 flex justify-end gap-2 shrink-0 bg-slate-50 rounded-b-2xl">
          <Btn onClick={onClose}>Cancel</Btn>
          <button onClick={handleGenerate} disabled={generating}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs bg-[#0C447C] text-white rounded-lg hover:bg-[#0b3d6e] font-medium disabled:opacity-50">
            {generating ? 'Generating…' : <><Printer size={13} /> Generate PDF</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── ADD GUARDIAN MODAL ───────────────────────────────────────────────────────
function AddGuardianModal({ onClose, onSave, isPending }: {
  onClose: () => void; onSave: (data: any) => void; isPending: boolean
}) {
  const [f, setF] = useState({ firstName:'', lastName:'', phone:'', email:'', occupation:'', employer:'' })
  const set = (k: keyof typeof f, v: string) => setF(p => ({ ...p, [k]: v }))
  const submit = () => {
    if (!f.firstName || !f.lastName || !f.phone) { toast.error('Name and phone required'); return }
    onSave({ firstName:f.firstName, lastName:f.lastName, phone:f.phone, email:f.email||undefined, occupation:f.occupation||undefined, employer:f.employer||undefined })
  }
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center overflow-y-auto py-16 px-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md relative">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-xl">
          <h2 className="font-semibold text-slate-800 text-sm">Add Guardian</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"><X size={18}/></button>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <F label="First Name" required><input value={f.firstName} onChange={e=>set('firstName',e.target.value)} className={IC} placeholder="First name"/></F>
            <F label="Last Name"  required><input value={f.lastName}  onChange={e=>set('lastName', e.target.value)} className={IC} placeholder="Last name" /></F>
            <F label="Phone" required><input value={f.phone} onChange={e=>set('phone',e.target.value)} className={IC} placeholder="+1 000 000 0000"/></F>
            <F label="Email"><input type="email" value={f.email} onChange={e=>set('email',e.target.value)} className={IC} placeholder="guardian@email.com"/></F>
            <F label="Occupation"><input value={f.occupation} onChange={e=>set('occupation',e.target.value)} className={IC} placeholder="e.g. Engineer"/></F>
            <F label="Employer"><input value={f.employer} onChange={e=>set('employer',e.target.value)} className={IC} placeholder="Company name"/></F>
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 font-medium">Cancel</button>
            <button onClick={submit} disabled={isPending} className="flex-1 py-2 text-sm bg-[#0C447C] text-white rounded-lg hover:bg-[#0b3d6e] font-medium disabled:opacity-50">
              {isPending ? 'Saving…' : 'Add Guardian'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── GUARDIANS TAB ────────────────────────────────────────────────────────────
function GuardiansTab() {
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [q, setQ] = useState('')

  const { data: guardians = [], isLoading } = useQuery({ queryKey:['guardians'], queryFn:()=>studentsService.getGuardians() })
  const createMutation = useMutation({
    mutationFn: studentsService.createGuardian,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey:['guardians'] }); toast.success('Guardian added'); setShowModal(false) },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed'),
  })

  const rows = (guardians as any[]).filter(g => `${g.firstName} ${g.lastName} ${g.phone}`.toLowerCase().includes(q.toLowerCase()))

  return (
    <Card>
      <CardHeader title="Guardian Directory" sub={`${(guardians as any[]).length} guardians`} actions={
        <>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search guardians…"
              className="pl-9 pr-4 py-1.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0C447C] w-48"/>
          </div>
          <Btn variant="secondary"><Download size={13}/>Export</Btn>
          <Btn variant="primary" onClick={()=>setShowModal(true)}><Plus size={13}/>Add Guardian</Btn>
        </>
      }/>
      {isLoading ? <Spinner /> : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <THead cols={['Name','Phone','Email','Children','Occupation','Actions']}/>
            <tbody>
              {rows.length === 0
                ? <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-400">No guardians found.</td></tr>
                : rows.map((g:any) => (
                  <tr key={g._id} className="border-t border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-semibold text-slate-800">{g.firstName} {g.lastName}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{g.phone}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{g.email || '—'}</td>
                    <td className="px-4 py-3"><Badge v="blue">{(g.linkedStudentIds?.length ?? 0)} {(g.linkedStudentIds?.length ?? 0)===1?'child':'children'}</Badge></td>
                    <td className="px-4 py-3 text-xs text-slate-500">{g.occupation || '—'}</td>
                    <td className="px-4 py-3"><Btn variant="ghost"><Search size={12}/>View</Btn></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination total={(guardians as any[]).length} showing={rows.length}/>
      {showModal && <AddGuardianModal onClose={()=>setShowModal(false)} onSave={d=>createMutation.mutate(d)} isPending={createMutation.isPending}/>}
    </Card>
  )
}

// ─── ATTENDANCE TAB ───────────────────────────────────────────────────────────
const ATTENDANCE_STATUSES = ['present','absent','late','half_day_am','half_day_pm','on_leave','medical'] as const
type AttendanceStatus = typeof ATTENDANCE_STATUSES[number]

function AttendanceTab() {
  const queryClient = useQueryClient()
  const today = new Date().toISOString().split('T')[0]
  const [selectedDate, setSelectedDate] = useState(today)
  const [localStatus, setLocalStatus]   = useState<Record<string, AttendanceStatus>>({})

  const { data: attendanceData } = useAttendance({ date: selectedDate })
  const { data: studentsData, isLoading } = useStudents({ status: 'active' })

  const attendance   = ((attendanceData as any)?.data ?? []) as any[]
  const studentRows  = ((studentsData  as any)?.data ?? []) as any[]

  useEffect(() => {
    const initial: Record<string, AttendanceStatus> = {}
    for (const rec of attendance) { initial[rec.studentId] = rec.status as AttendanceStatus }
    setLocalStatus(initial)
  }, [attendance])

  const markMutation = useBulkMarkAttendance()

  const handleSave = () => {
    if (studentRows.length === 0) { toast.error('No students loaded'); return }
    const schoolSlug   = localStorage.getItem('schoolSlug')   || 'demo-school'
    const academicYear = localStorage.getItem('academicYear') || '2025-26'
    markMutation.mutate(
      {
        schoolSlug,
        academicYear,
        records: studentRows.map((s: any) => ({
          studentId: s._id,
          date: selectedDate,
          status: localStatus[s._id] ?? 'absent',
          schoolSlug,
        })),
      },
      {
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['students', 'attendance'] }); toast.success('Attendance marked') },
        onError: () => toast.error('Failed to save attendance'),
      }
    )
  }

  const attendanceMap = Object.fromEntries(attendance.map((a: any) => [a.studentId, a]))
  const presentCount  = Object.values(localStatus).filter(s => s === 'present').length
  const absentCount   = Object.values(localStatus).filter(s => s === 'absent').length

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title="Daily Attendance" sub={`Active students · ${selectedDate}`} actions={
          <>
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]" />
            <Btn variant="primary" onClick={handleSave} disabled={markMutation.isPending || studentRows.length === 0}>
              <CalendarCheck2 size={13} />{markMutation.isPending ? 'Saving…' : 'Mark Attendance'}
            </Btn>
          </>
        } />
        {studentRows.length > 0 && (
          <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex gap-4 text-xs">
            <span className="text-slate-500">Total: <strong className="text-slate-800">{studentRows.length}</strong></span>
            <span className="text-emerald-600">Present: <strong>{presentCount}</strong></span>
            <span className="text-red-500">Absent: <strong>{absentCount}</strong></span>
            <span className="text-slate-400">Unmarked: <strong>{studentRows.length - Object.keys(localStatus).length}</strong></span>
          </div>
        )}
        {isLoading ? <Spinner /> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <THead cols={['Admission No', 'Name', 'Grade', 'Status', 'Mark As']} />
              <tbody>
                {studentRows.length === 0
                  ? <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-400">No active students found.</td></tr>
                  : studentRows.map((s: any) => {
                    const cur = localStatus[s._id] ?? (attendanceMap[s._id]?.status as AttendanceStatus | undefined)
                    return (
                      <tr key={s._id} className="border-t border-slate-50 hover:bg-slate-50">
                        <td className="px-4 py-3 text-xs font-mono font-semibold text-[#0C447C]">{s.admissionNumber}</td>
                        <td className="px-4 py-3 text-sm font-medium text-slate-800">
                          {[s.firstName, s.lastName].filter(Boolean).join(' ') || '—'}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">{s.currentGrade || '—'}</td>
                        <td className="px-4 py-3">
                          {cur ? <Badge v={statusBV(cur)}>{cur.replace(/_/g, ' ')}</Badge> : <span className="text-xs text-slate-400 italic">Not marked</span>}
                        </td>
                        <td className="px-4 py-3">
                          <select value={localStatus[s._id] ?? ''}
                            onChange={e => setLocalStatus(p => ({ ...p, [s._id]: e.target.value as AttendanceStatus }))}
                            className="px-2 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0C447C]">
                            <option value="">— select —</option>
                            {ATTENDANCE_STATUSES.map(st => <option key={st} value={st}>{st.replace(/_/g, ' ')}</option>)}
                          </select>
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        )}
        <Pagination total={studentRows.length} showing={studentRows.length} />
      </Card>
    </div>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
const TABS: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id:'dashboard',  label:'Dashboard',  icon:LayoutDashboard },
  { id:'students',   label:'Students',   icon:Users           },
  { id:'guardians',  label:'Guardians',  icon:UserCheck       },
  { id:'attendance', label:'Attendance', icon:CalendarCheck2  },
]

export default function StudentsPage() {
  const [tab, setTab] = useState<TabId>('dashboard')
  return (
    <div className="p-6 space-y-4 min-h-screen bg-slate-50">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Student Management</h1>
        <p className="text-sm text-slate-400 mt-0.5">Manage student records, guardians and daily attendance</p>
      </div>
      <div className="overflow-x-auto">
        <div className="flex gap-1 bg-white rounded-xl border border-slate-100 p-1 shadow-sm w-max min-w-full">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${tab===t.id?'bg-[#0C447C] text-white shadow-sm':'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
              <t.icon size={13}/>{t.label}
            </button>
          ))}
        </div>
      </div>
      {tab==='dashboard'  && <DashboardTab />}
      {tab==='students'   && <StudentsTab />}
      {tab==='guardians'  && <GuardiansTab />}
      {tab==='attendance' && <AttendanceTab />}
    </div>
  )
}
