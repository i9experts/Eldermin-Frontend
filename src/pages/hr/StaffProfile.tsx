import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  ArrowLeft, Edit2, LayoutDashboard, User, Briefcase,
  GraduationCap, ClipboardList, CalendarDays, BookOpen,
  CreditCard, FileText, MessageSquare, Phone, Mail,
  MapPin, Heart, Award, CheckCircle, AlertTriangle,
  ChevronDown, ChevronUp, Plus, X, Download, Check, Trash2, Camera, Loader2,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import hrService from '../../services/hr.service'
import organizationService from '../../services/organization.service'
import authService from '../../services/auth.service'

// ─── TYPES ────────────────────────────────────────────────────────────────────
type StaffTab = 'overview' | 'personal' | 'employment' | 'teaching' | 'qualifications' | 'attendance' | 'leave' | 'payroll' | 'documents' | 'notes'
type BV = 'green' | 'amber' | 'red' | 'blue' | 'purple' | 'gray' | 'navy'

// ─── UI PRIMITIVES ────────────────────────────────────────────────────────────
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
    active:'green', on_leave:'blue', resigned:'gray', terminated:'red', probation:'amber', suspended:'red',
    present:'green', absent:'red', late:'amber', approved:'green', pending:'amber', rejected:'red',
  }
  return m[s] ?? 'gray'
}
const IC = 'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]'
const RO = 'w-full px-3 py-2 text-sm border border-slate-100 rounded-lg bg-slate-50 text-slate-500'
function FL({ label, required, children, span, ro }: { label: string; required?: boolean; children: React.ReactNode; span?: boolean; ro?: boolean }) {
  return (
    <div className={span ? 'col-span-2' : ''}>
      <label className="block text-xs font-semibold text-slate-600 mb-1">
        {label}{required && !ro && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}
function SH({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 mb-4 pb-2 border-b border-slate-100 mt-5 first:mt-0">
      <div className="w-1 h-5 rounded-full bg-[#EF9F27] shrink-0" />
      <h3 className="font-bold text-sm text-slate-800">{title}</h3>
    </div>
  )
}
function InfoRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value?: string }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3 py-2 border-b border-slate-50 last:border-0">
      <div className="w-7 h-7 rounded-lg bg-[#0C447C]/8 flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={13} className="text-[#0C447C]" />
      </div>
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm font-medium text-slate-700">{value}</p>
      </div>
    </div>
  )
}
function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-100 rounded-lg ${className}`} />
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function fmt(d?: string | Date): string {
  if (!d) return '—'
  try { return new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) } catch { return '—' }
}
function staffFull(s: any): string {
  return [s?.personal?.title, s?.firstName, s?.personal?.middleName, s?.lastName].filter(Boolean).join(' ') || 'Unknown Staff'
}
function staffInitials(s: any): string {
  return ((s?.firstName?.[0] ?? '') + (s?.lastName?.[0] ?? '')).toUpperCase() || 'ST'
}
function yearsOfService(joiningDate?: string | Date): string {
  if (!joiningDate) return '—'
  const ms = Date.now() - new Date(joiningDate).getTime()
  const y = Math.floor(ms / (1000 * 60 * 60 * 24 * 365))
  const m = Math.floor((ms % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30))
  return y > 0 ? `${y}y ${m}m` : `${m} months`
}
function getMonthDays(year: number, month: number): Date[] {
  const days: Date[] = []
  const d = new Date(year, month, 1)
  while (d.getMonth() === month) { days.push(new Date(d)); d.setDate(d.getDate() + 1) }
  return days
}

// ─── PROFILE HEADER ───────────────────────────────────────────────────────────
function ProfileHeader({ staff, staffId, onBack, onEdit }: { staff: any; staffId: string; onBack: () => void; onEdit: () => void }) {
  const name = staffFull(staff)
  const ini  = staffInitials(staff)
  const desig = staff.designationId?.name || staff.designation || '—'
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [photoFailed, setPhotoFailed] = useState(false)

  const photoMutation = useMutation({
    mutationFn: (file: File) => hrService.uploadStaffPhoto(staffId, file),
    onSuccess: (data: any) => {
      queryClient.setQueryData(['staff-member', staffId], (old: any) => old ? { ...old, avatarUrl: data.avatarUrl } : old)
      setPhotoFailed(false)
      toast.success('Photo updated')
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to upload photo'),
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) photoMutation.mutate(file)
    e.target.value = ''
  }

  return (
    <div className="bg-[#0C447C] shrink-0">
      <div className="px-6 py-5">
        <div className="flex items-start gap-5">
          <div className="relative w-16 h-16 shrink-0 group">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-white text-xl font-bold shadow-lg overflow-hidden">
              {staff.avatarUrl && !photoFailed ? (
                <img src={staff.avatarUrl} alt={name} className="w-full h-full object-cover" onError={() => setPhotoFailed(true)} />
              ) : ini}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              title="Change photo"
            >
              {photoMutation.isPending ? <Loader2 size={18} className="text-white animate-spin" /> : <Camera size={18} className="text-white" />}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-white">{name}</h1>
              <Badge v="navy">{staff.employeeId || '—'}</Badge>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-medium ${staff.status === 'active' ? 'bg-emerald-400/20 text-emerald-100 border-emerald-400/40' : 'bg-amber-400/20 text-amber-100 border-amber-400/40'}`}>
                {staff.status || 'active'}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              {desig !== '—' && <span className="text-blue-200 text-xs font-medium">{desig}</span>}
              {staff.department && <span className="text-blue-200 text-xs">· {staff.department}</span>}
              {(staff.campusId?.name || staff.campus) && <span className="text-blue-200 text-xs">· {staff.campusId?.name || staff.campus}</span>}
            </div>
            <div className="flex items-center gap-5 mt-3">
              <div><p className="text-lg font-bold text-white">{yearsOfService(staff.dateOfJoining)}</p><p className="text-xs text-blue-300">Service</p></div>
              <div className="w-px h-8 bg-white/20" />
              <div><p className="text-lg font-bold text-white capitalize">{staff.employmentType?.replace('_',' ') || '—'}</p><p className="text-xs text-blue-300">Type</p></div>
              <div className="w-px h-8 bg-white/20" />
              <div><p className="text-lg font-bold text-white">{staff.email ? '✓' : '—'}</p><p className="text-xs text-blue-300">Portal</p></div>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={onBack} className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-white/30 text-white rounded-lg hover:bg-white/10 font-medium">
              <ArrowLeft size={13}/>Back
            </button>
            <button onClick={onEdit} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#EF9F27] text-white rounded-lg hover:bg-[#d98e22] font-medium">
              <Edit2 size={13}/>Edit
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── EDIT STAFF MODAL ─────────────────────────────────────────────────────────
interface EQual { degree: string; field: string; institution: string; country: string; year: string; grade: string; specialization: string }
interface ECert { name: string; issuedBy: string; issueDate: string; expiryDate: string }
interface EExp  { employer: string; jobTitle: string; fromDate: string; toDate: string; reason: string }
interface ERef  { name: string; title: string; organization: string; phone: string; email: string }

const EDIT_SUBJECTS = ['Mathematics','English','Science','Arabic','Islamic Studies','Physics','Chemistry','Biology','History','Geography','Computer Science','Art','PE','Music','Urdu','French','Economics','Business Studies']
const EDIT_GRADES   = ['KG1','KG2','Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12']

type EditSection = 'personal' | 'employment' | 'salary' | 'teaching' | 'qualifications'
const EDIT_SECTIONS: { id: EditSection; label: string }[] = [
  { id: 'personal',       label: 'Personal & Contact' },
  { id: 'employment',     label: 'Employment' },
  { id: 'salary',         label: 'Salary & Bank' },
  { id: 'teaching',       label: 'Teaching Profile' },
  { id: 'qualifications', label: 'Qualifications' },
]

function dstr(d?: string | Date | null): string {
  if (!d) return ''
  try { return new Date(d).toISOString().slice(0, 10) } catch { return '' }
}

function buildEditForm(staff: any) {
  const p    = staff?.personal ?? {}
  const c    = staff?.contact ?? {}
  const ca   = c.currentAddress ?? staff?.address ?? {}
  const pa   = c.permanentAddress ?? {}
  const em   = c.emergency ?? {}
  const ids  = staff?.identityDocs ?? {}
  const emp  = staff?.employment ?? {}
  const tp   = staff?.teacherProfile ?? {}
  const tpc  = tp.certifications ?? {}
  const bd   = staff?.bankDetails ?? {}
  const refs = (staff?.references ?? []) as any[]
  return {
    // ── Personal & Contact ──
    firstName: staff?.firstName ?? '', lastName: staff?.lastName ?? '',
    title: p.title ?? '', middleName: p.middleName ?? '', preferredName: p.preferredName ?? '', arabicName: p.arabicName ?? '',
    dateOfBirth: dstr(staff?.dateOfBirth), placeOfBirth: p.placeOfBirth ?? '', gender: staff?.gender ?? '',
    maritalStatus: p.maritalStatus ?? '', nationality: p.nationality ?? '', secondNationality: p.secondNationality ?? '',
    religion: p.religion ?? '', bloodGroup: p.bloodGroup ?? '', motherTongue: p.motherTongue ?? '', languagesSpoken: p.languagesSpoken ?? '',
    nationalIdNo: ids.nationalId?.no ?? '', nationalIdExpiry: dstr(ids.nationalId?.expiry),
    passportNo: ids.passport?.no ?? '', passportExpiry: dstr(ids.passport?.expiry),
    teachingLicenseNo: ids.teachingLicense?.no ?? '', teachingLicenseExpiry: dstr(ids.teachingLicense?.expiry),
    personalPhone: c.personalPhone ?? staff?.phone ?? '', workPhone: c.workPhone ?? '', whatsApp: c.whatsApp ?? '', altPhone: c.altPhone ?? '',
    personalEmail: staff?.email ?? '', workEmail: c.workEmail ?? '',
    curStreet: ca.street ?? '', curCity: ca.city ?? '', curState: ca.state ?? '', curCountry: ca.country ?? '', curPostal: ca.postalCode ?? '',
    sameAddress: !pa.street,
    perStreet: pa.street ?? '', perCity: pa.city ?? '', perState: pa.state ?? '', perCountry: pa.country ?? '', perPostal: pa.postalCode ?? '',
    emergencyName: em.name ?? '', emergencyRelation: em.relation ?? '', emergencyPhone: em.phone ?? '', emergencyAltPhone: em.altPhone ?? '',
    // ── Employment ──
    designation: staff?.designationId?.name ?? staff?.designation ?? '',
    department: staff?.department ?? '',
    campusId: staff?.campusId?._id ?? '',
    employmentType: staff?.employmentType ?? 'full_time', erpRole: staff?.erpRole ?? '',
    reportingManager: emp.reportingTo ?? '', dateOfJoining: dstr(staff?.dateOfJoining), probationEndDate: dstr(emp.probationEndDate),
    contractType: emp.contractType ?? 'Permanent', contractEndDate: dstr(emp.contractEndDate),
    workingHours: emp.workingHoursPerWeek != null ? String(emp.workingHoursPerWeek) : '40',
    noticePeriod: emp.noticePeriodDays != null ? String(emp.noticePeriodDays) : '30',
    createPortalAccount: emp.createPortalAccount ?? false,
    status: staff?.status ?? 'active',
    // ── Salary & Bank ──
    grossSalary: staff?.salary != null ? String(staff.salary) : '', currency: staff?.salaryCurrency ?? 'PKR',
    bankName: bd.bankName ?? '', accountTitle: bd.accountTitle ?? '', accountNumber: bd.accountNo ?? '',
    iban: bd.iban ?? '', branchCode: bd.branchCode ?? '', branchName: bd.branchName ?? '',
    accountCurrency: bd.currency ?? 'PKR', bankVerified: bd.isVerified ?? false,
    // ── Teaching Profile ──
    isTeacher: staff?.erpRole === 'teacher' || !!staff?.teacherProfile,
    subjectsCanTeach: ((tp.subjectsCanTeach ?? []) as string[]),
    gradeLevels: ((tp.gradeLevelsCanTeach ?? []) as string[]),
    maxPeriodsPerDay: tp.maxPeriodsPerDay != null ? String(tp.maxPeriodsPerDay) : '6',
    maxPeriodsPerWeek: tp.maxPeriodsPerWeek != null ? String(tp.maxPeriodsPerWeek) : '25',
    isClassTeacher: tp.isClassTeacher ?? false, specializations: tp.specializations ?? '',
    certCambridge: tpc.cambridge ?? false, certIB: tpc.ib ?? false, certGoogle: tpc.google ?? false,
    certMicrosoft: tpc.microsoft ?? false, certSEN: tpc.sen ?? false, certECE: tpc.ece ?? false,
    // ── Qualifications & Experience ──
    qualifications: ((staff?.qualifications ?? []) as any[]).map(q => ({
      degree: q?.degree ?? '', field: q?.field ?? '', institution: q?.institution ?? '',
      country: q?.country ?? '', year: q?.year ?? '', grade: q?.grade ?? '', specialization: q?.specialization ?? '',
    })) as EQual[],
    certifications: ((staff?.certifications ?? []) as any[]).map(c2 => ({
      name: c2?.name ?? '', issuedBy: c2?.issuedBy ?? '', issueDate: dstr(c2?.issueDate), expiryDate: dstr(c2?.expiryDate),
    })) as ECert[],
    experience: ((staff?.experience ?? []) as any[]).map(e => ({
      employer: e?.employer ?? '', jobTitle: e?.jobTitle ?? '', fromDate: dstr(e?.fromDate), toDate: dstr(e?.toDate), reason: e?.reason ?? '',
    })) as EExp[],
    references: refs.slice(0, 2).map((r: any) => ({
      name: r?.name ?? '', title: r?.title ?? '', organization: r?.organization ?? '', phone: r?.phone ?? '', email: r?.email ?? '',
    })) as ERef[],
  }
}
type EditForm = ReturnType<typeof buildEditForm>

function EditStaffModal({ staff, staffId, onClose }: { staff: any; staffId: string; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [section, setSection] = useState<EditSection>('personal')
  const [f, setF] = useState<EditForm>(() => buildEditForm(staff))
  const { data: realCampuses = [] } = useQuery({ queryKey: ['campuses'], queryFn: organizationService.getCampuses })

  const ss = <K extends keyof EditForm>(k: K, v: EditForm[K]) => setF(prev => ({ ...prev, [k]: v }))
  const toggleArr = (key: 'subjectsCanTeach' | 'gradeLevels', val: string) =>
    setF(p => ({ ...p, [key]: (p[key] ?? []).includes(val) ? (p[key] ?? []).filter(x => x !== val) : [...(p[key] ?? []), val] }))

  const addQ = () => setF(p => ({ ...p, qualifications: [...(p.qualifications ?? []), { degree:'', field:'', institution:'', country:'', year:'', grade:'', specialization:'' }] }))
  const remQ = (i: number) => setF(p => ({ ...p, qualifications: (p.qualifications ?? []).filter((_, j) => j !== i) }))
  const updQ = (i: number, k: keyof EQual, v: string) => setF(p => ({ ...p, qualifications: (p.qualifications ?? []).map((x, j) => j === i ? { ...x, [k]: v } : x) }))

  const addC = () => setF(p => ({ ...p, certifications: [...(p.certifications ?? []), { name:'', issuedBy:'', issueDate:'', expiryDate:'' }] }))
  const remC = (i: number) => setF(p => ({ ...p, certifications: (p.certifications ?? []).filter((_, j) => j !== i) }))
  const updC = (i: number, k: keyof ECert, v: string) => setF(p => ({ ...p, certifications: (p.certifications ?? []).map((x, j) => j === i ? { ...x, [k]: v } : x) }))

  const addE = () => setF(p => ({ ...p, experience: [...(p.experience ?? []), { employer:'', jobTitle:'', fromDate:'', toDate:'', reason:'' }] }))
  const remE = (i: number) => setF(p => ({ ...p, experience: (p.experience ?? []).filter((_, j) => j !== i) }))
  const updE = (i: number, k: keyof EExp, v: string) => setF(p => ({ ...p, experience: (p.experience ?? []).map((x, j) => j === i ? { ...x, [k]: v } : x) }))

  const updR = (i: number, k: keyof ERef, v: string) => setF(p => {
    const refs = [...(p.references ?? [])]
    while (refs.length <= i) refs.push({ name:'', title:'', organization:'', phone:'', email:'' })
    refs[i] = { ...refs[i], [k]: v }
    return { ...p, references: refs }
  })

  const updateMutation = useMutation({
    mutationFn: (payload: any) => hrService.updateStaff(staffId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-member', staffId] })
      queryClient.invalidateQueries({ queryKey: ['staff'] })
      toast.success('Staff record updated')
      onClose()
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Update failed'),
  })

  const handleSave = () => {
    const permAddr = f.sameAddress
      ? { street: f.curStreet, city: f.curCity, state: f.curState, country: f.curCountry, postalCode: f.curPostal }
      : { street: f.perStreet, city: f.perCity, state: f.perState, country: f.perCountry, postalCode: f.perPostal }
    updateMutation.mutate({
      firstName: f.firstName, lastName: f.lastName,
      phone: f.personalPhone || undefined, email: f.workEmail || f.personalEmail || undefined,
      gender: f.gender || undefined, dateOfBirth: f.dateOfBirth || undefined,
      department: f.department || undefined, employmentType: f.employmentType,
      dateOfJoining: f.dateOfJoining || undefined, designation: f.designation || undefined,
      campusId: f.campusId || undefined, erpRole: f.erpRole || undefined, status: f.status,
      salary: f.grossSalary ? Number(f.grossSalary) : undefined, salaryCurrency: f.currency,
      address: { street: f.curStreet, city: f.curCity, state: f.curState, country: f.curCountry, postalCode: f.curPostal },
      personal: {
        title: f.title || undefined, middleName: f.middleName || undefined, preferredName: f.preferredName || undefined,
        arabicName: f.arabicName || undefined, placeOfBirth: f.placeOfBirth || undefined, maritalStatus: f.maritalStatus || undefined,
        nationality: f.nationality || undefined, secondNationality: f.secondNationality || undefined, religion: f.religion || undefined,
        bloodGroup: f.bloodGroup || undefined, motherTongue: f.motherTongue || undefined, languagesSpoken: f.languagesSpoken || undefined,
      },
      identityDocs: {
        nationalId: f.nationalIdNo ? { no: f.nationalIdNo, expiry: f.nationalIdExpiry || undefined } : undefined,
        passport: f.passportNo ? { no: f.passportNo, expiry: f.passportExpiry || undefined } : undefined,
        teachingLicense: f.teachingLicenseNo ? { no: f.teachingLicenseNo, expiry: f.teachingLicenseExpiry || undefined } : undefined,
      },
      contact: {
        personalPhone: f.personalPhone || undefined, workPhone: f.workPhone || undefined, whatsApp: f.whatsApp || undefined,
        altPhone: f.altPhone || undefined, workEmail: f.workEmail || undefined,
        currentAddress: { street: f.curStreet, city: f.curCity, state: f.curState, country: f.curCountry, postalCode: f.curPostal },
        permanentAddress: permAddr,
        emergency: f.emergencyName ? { name: f.emergencyName, relation: f.emergencyRelation, phone: f.emergencyPhone, altPhone: f.emergencyAltPhone || undefined } : undefined,
      },
      employment: {
        reportingTo: f.reportingManager || undefined, probationEndDate: f.probationEndDate || undefined,
        contractType: f.contractType || undefined, contractEndDate: f.contractEndDate || undefined,
        workingHoursPerWeek: f.workingHours ? Number(f.workingHours) : 40,
        noticePeriodDays: f.noticePeriod ? Number(f.noticePeriod) : 30,
        createPortalAccount: f.createPortalAccount,
      },
      teacherProfile: f.isTeacher ? {
        subjectsCanTeach: f.subjectsCanTeach ?? [], gradeLevelsCanTeach: f.gradeLevels ?? [],
        maxPeriodsPerDay: Number(f.maxPeriodsPerDay) || 6, maxPeriodsPerWeek: Number(f.maxPeriodsPerWeek) || 25,
        isClassTeacher: f.isClassTeacher, specializations: f.specializations || undefined,
        certifications: { cambridge: f.certCambridge, ib: f.certIB, google: f.certGoogle, microsoft: f.certMicrosoft, sen: f.certSEN, ece: f.certECE },
      } : undefined,
      qualifications: (f.qualifications ?? []).filter(q => q.degree && q.institution),
      certifications: (f.certifications ?? []).filter(c2 => c2.name),
      experience: (f.experience ?? []).filter(e => e.employer && e.jobTitle),
      references: (f.references ?? []).filter(r => r.name),
      bankDetails: (f.bankName || f.accountNumber) ? {
        bankName: f.bankName, accountTitle: f.accountTitle, accountNo: f.accountNumber, iban: f.iban,
        branchCode: f.branchCode, branchName: f.branchName, currency: f.accountCurrency, isVerified: f.bankVerified,
      } : undefined,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center overflow-y-auto py-8 px-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <h2 className="font-semibold text-slate-800 text-sm">Edit Staff — {staffFull(staff)}</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"><X size={18}/></button>
        </div>
        <div className="flex gap-0 overflow-x-auto px-5 border-b border-slate-100">
          {EDIT_SECTIONS.map(s => (
            <button key={s.id} onClick={() => setSection(s.id)}
              className={`px-4 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-all ${
                section === s.id ? 'border-[#0C447C] text-[#0C447C]' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}>
              {s.label}
            </button>
          ))}
        </div>

        <div className="p-5 max-h-[65vh] overflow-y-auto">
          {section === 'personal' && (
            <div>
              <SH title="Basic Identity" />
              <div className="grid grid-cols-2 gap-4">
                <FL label="Title"><select value={f.title} onChange={e=>ss('title',e.target.value)} className={IC}><option value="">Select</option>{['Mr','Mrs','Ms','Dr','Prof','Sheikh','Haji'].map(t=><option key={t}>{t}</option>)}</select></FL>
                <FL label="Employee ID" ro><input value={staff.employeeId || '—'} readOnly className={RO}/></FL>
                <FL label="First Name" required><input value={f.firstName} onChange={e=>ss('firstName',e.target.value)} className={IC}/></FL>
                <FL label="Middle Name"><input value={f.middleName} onChange={e=>ss('middleName',e.target.value)} className={IC}/></FL>
                <FL label="Last Name" required><input value={f.lastName} onChange={e=>ss('lastName',e.target.value)} className={IC}/></FL>
                <FL label="Preferred Name"><input value={f.preferredName} onChange={e=>ss('preferredName',e.target.value)} className={IC}/></FL>
                <FL label="Arabic Name"><input value={f.arabicName} onChange={e=>ss('arabicName',e.target.value)} className={IC} dir="rtl"/></FL>
                <FL label="Date of Birth"><input type="date" value={f.dateOfBirth} onChange={e=>ss('dateOfBirth',e.target.value)} className={IC}/></FL>
                <FL label="Place of Birth"><input value={f.placeOfBirth} onChange={e=>ss('placeOfBirth',e.target.value)} className={IC}/></FL>
                <FL label="Gender"><select value={f.gender} onChange={e=>ss('gender',e.target.value)} className={IC}><option value="">Select</option><option value="male">Male</option><option value="female">Female</option></select></FL>
                <FL label="Marital Status"><select value={f.maritalStatus} onChange={e=>ss('maritalStatus',e.target.value)} className={IC}><option value="">Select</option>{['Single','Married','Divorced','Widowed'].map(s=><option key={s}>{s}</option>)}</select></FL>
                <FL label="Nationality"><input value={f.nationality} onChange={e=>ss('nationality',e.target.value)} className={IC}/></FL>
                <FL label="Second Nationality"><input value={f.secondNationality} onChange={e=>ss('secondNationality',e.target.value)} className={IC}/></FL>
                <FL label="Religion"><select value={f.religion} onChange={e=>ss('religion',e.target.value)} className={IC}><option value="">Select</option>{['Islam','Christianity','Hinduism','Judaism','Buddhism','Other'].map(r=><option key={r}>{r}</option>)}</select></FL>
                <FL label="Blood Group"><select value={f.bloodGroup} onChange={e=>ss('bloodGroup',e.target.value)} className={IC}><option value="">Unknown</option>{['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(g=><option key={g}>{g}</option>)}</select></FL>
                <FL label="Mother Tongue"><input value={f.motherTongue} onChange={e=>ss('motherTongue',e.target.value)} className={IC}/></FL>
                <FL label="Languages Spoken" span><input value={f.languagesSpoken} onChange={e=>ss('languagesSpoken',e.target.value)} className={IC}/></FL>
              </div>
              <SH title="Identity Documents" />
              <div className="grid grid-cols-2 gap-4">
                <FL label="National ID No"><input value={f.nationalIdNo} onChange={e=>ss('nationalIdNo',e.target.value)} className={IC}/></FL>
                <FL label="National ID Expiry"><input type="date" value={f.nationalIdExpiry} onChange={e=>ss('nationalIdExpiry',e.target.value)} className={IC}/></FL>
                <FL label="Passport No"><input value={f.passportNo} onChange={e=>ss('passportNo',e.target.value)} className={IC}/></FL>
                <FL label="Passport Expiry"><input type="date" value={f.passportExpiry} onChange={e=>ss('passportExpiry',e.target.value)} className={IC}/></FL>
                <FL label="Teaching License No"><input value={f.teachingLicenseNo} onChange={e=>ss('teachingLicenseNo',e.target.value)} className={IC}/></FL>
                <FL label="Teaching License Expiry"><input type="date" value={f.teachingLicenseExpiry} onChange={e=>ss('teachingLicenseExpiry',e.target.value)} className={IC}/></FL>
              </div>
              <SH title="Contact Information" />
              <div className="grid grid-cols-2 gap-4">
                <FL label="Personal Phone"><input value={f.personalPhone} onChange={e=>ss('personalPhone',e.target.value)} className={IC}/></FL>
                <FL label="Work Phone"><input value={f.workPhone} onChange={e=>ss('workPhone',e.target.value)} className={IC}/></FL>
                <FL label="WhatsApp"><input value={f.whatsApp} onChange={e=>ss('whatsApp',e.target.value)} className={IC}/></FL>
                <FL label="Alternate Phone"><input value={f.altPhone} onChange={e=>ss('altPhone',e.target.value)} className={IC}/></FL>
                <FL label="Personal Email"><input type="email" value={f.personalEmail} onChange={e=>ss('personalEmail',e.target.value)} className={IC}/></FL>
                <FL label="Work Email"><input type="email" value={f.workEmail} onChange={e=>ss('workEmail',e.target.value)} className={IC}/></FL>
              </div>
              <SH title="Current Address" />
              <div className="grid grid-cols-2 gap-4">
                <FL label="Street Address" span><input value={f.curStreet} onChange={e=>ss('curStreet',e.target.value)} className={IC}/></FL>
                <FL label="City"><input value={f.curCity} onChange={e=>ss('curCity',e.target.value)} className={IC}/></FL>
                <FL label="State / Province"><input value={f.curState} onChange={e=>ss('curState',e.target.value)} className={IC}/></FL>
                <FL label="Country"><input value={f.curCountry} onChange={e=>ss('curCountry',e.target.value)} className={IC}/></FL>
                <FL label="Postal Code"><input value={f.curPostal} onChange={e=>ss('curPostal',e.target.value)} className={IC}/></FL>
                <div className="col-span-2"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={f.sameAddress} onChange={e=>ss('sameAddress',e.target.checked)} className="w-4 h-4 accent-[#0C447C]"/><span className="text-sm font-medium text-slate-700">Permanent address same as current</span></label></div>
              </div>
              {!f.sameAddress && (
                <>
                  <SH title="Permanent Address" />
                  <div className="grid grid-cols-2 gap-4">
                    <FL label="Street" span><input value={f.perStreet} onChange={e=>ss('perStreet',e.target.value)} className={IC}/></FL>
                    <FL label="City"><input value={f.perCity} onChange={e=>ss('perCity',e.target.value)} className={IC}/></FL>
                    <FL label="Country"><input value={f.perCountry} onChange={e=>ss('perCountry',e.target.value)} className={IC}/></FL>
                  </div>
                </>
              )}
              <SH title="Emergency Contact" />
              <div className="grid grid-cols-2 gap-4">
                <FL label="Contact Name"><input value={f.emergencyName} onChange={e=>ss('emergencyName',e.target.value)} className={IC}/></FL>
                <FL label="Relationship"><input value={f.emergencyRelation} onChange={e=>ss('emergencyRelation',e.target.value)} className={IC}/></FL>
                <FL label="Phone"><input value={f.emergencyPhone} onChange={e=>ss('emergencyPhone',e.target.value)} className={IC}/></FL>
                <FL label="Alternate Phone"><input value={f.emergencyAltPhone} onChange={e=>ss('emergencyAltPhone',e.target.value)} className={IC}/></FL>
              </div>
            </div>
          )}

          {section === 'employment' && (
            <div>
              <SH title="Job Details" />
              <div className="grid grid-cols-2 gap-4">
                <FL label="Designation"><input value={f.designation} onChange={e=>ss('designation',e.target.value)} className={IC}/></FL>
                <FL label="Department"><input value={f.department} onChange={e=>ss('department',e.target.value)} className={IC}/></FL>
                <FL label="Campus">
                  <select value={f.campusId} onChange={e=>ss('campusId',e.target.value)} className={IC}>
                    <option value="">Select</option>
                    {(realCampuses as any[]).map((c: any) => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </FL>
                <FL label="Employment Type">
                  <select value={f.employmentType} onChange={e=>ss('employmentType',e.target.value)} className={IC}>
                    {[['full_time','Full Time'],['part_time','Part Time'],['contract','Contract'],['visiting','Visiting'],['intern','Intern'],['substitute','Substitute']].map(([v,l])=><option key={v} value={v}>{l}</option>)}
                  </select>
                </FL>
                <FL label="ERP Role">
                  <select value={f.erpRole} onChange={e=>ss('erpRole',e.target.value)} className={IC}>
                    <option value="">Select role</option>
                    {[['principal','Principal'],['vice_principal','Vice Principal'],['academic_coordinator','Academic Coordinator'],['finance_manager','Finance Manager'],['hr_manager','HR Manager'],['teacher','Teacher'],['librarian','Librarian'],['admin','Admin'],['support_staff','Support Staff']].map(([v,l])=><option key={v} value={v}>{l}</option>)}
                  </select>
                </FL>
                <FL label="Reporting Manager"><input value={f.reportingManager} onChange={e=>ss('reportingManager',e.target.value)} className={IC}/></FL>
                <FL label="Date of Joining"><input type="date" value={f.dateOfJoining} onChange={e=>ss('dateOfJoining',e.target.value)} className={IC}/></FL>
                <FL label="Probation End Date"><input type="date" value={f.probationEndDate} onChange={e=>ss('probationEndDate',e.target.value)} className={IC}/></FL>
                <FL label="Contract Type">
                  <select value={f.contractType} onChange={e=>ss('contractType',e.target.value)} className={IC}>
                    {['Permanent','Fixed Term','Probationary','Renewal'].map(c=><option key={c}>{c}</option>)}
                  </select>
                </FL>
                <FL label="Contract End Date"><input type="date" value={f.contractEndDate} onChange={e=>ss('contractEndDate',e.target.value)} className={IC}/></FL>
                <FL label="Working Hours / Week"><input type="number" value={f.workingHours} onChange={e=>ss('workingHours',e.target.value)} className={IC}/></FL>
                <FL label="Notice Period (days)"><input type="number" value={f.noticePeriod} onChange={e=>ss('noticePeriod',e.target.value)} className={IC}/></FL>
                <FL label="Status">
                  <select value={f.status} onChange={e=>ss('status',e.target.value)} className={IC}>
                    {['active','on_leave','probation','suspended','resigned','terminated'].map(s=><option key={s} value={s}>{s.replace('_',' ')}</option>)}
                  </select>
                </FL>
              </div>
              <SH title="ERP Portal Access" />
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={f.createPortalAccount} onChange={e=>ss('createPortalAccount',e.target.checked)} className="w-4 h-4 accent-[#0C447C]"/>
                  <span className="text-sm font-medium text-slate-700">ERP portal account enabled for this staff member</span>
                </label>
              </div>
            </div>
          )}

          {section === 'salary' && (
            <div>
              <SH title="Compensation" />
              <div className="grid grid-cols-2 gap-4">
                <FL label="Gross Salary"><input type="number" value={f.grossSalary} onChange={e=>ss('grossSalary',e.target.value)} className={IC}/></FL>
                <FL label="Currency">
                  <select value={f.currency} onChange={e=>ss('currency',e.target.value)} className={IC}>
                    {['PKR','USD','AED','SAR','GBP','EUR'].map(c=><option key={c}>{c}</option>)}
                  </select>
                </FL>
              </div>
              <SH title="Bank Details" />
              <div className="grid grid-cols-2 gap-4">
                <FL label="Bank Name"><input value={f.bankName} onChange={e=>ss('bankName',e.target.value)} className={IC}/></FL>
                <FL label="Account Title"><input value={f.accountTitle} onChange={e=>ss('accountTitle',e.target.value)} className={IC}/></FL>
                <FL label="Account Number"><input value={f.accountNumber} onChange={e=>ss('accountNumber',e.target.value)} className={IC}/></FL>
                <FL label="IBAN"><input value={f.iban} onChange={e=>ss('iban',e.target.value)} className={IC}/></FL>
                <FL label="Branch Code"><input value={f.branchCode} onChange={e=>ss('branchCode',e.target.value)} className={IC}/></FL>
                <FL label="Branch Name"><input value={f.branchName} onChange={e=>ss('branchName',e.target.value)} className={IC}/></FL>
                <FL label="Account Currency">
                  <select value={f.accountCurrency} onChange={e=>ss('accountCurrency',e.target.value)} className={IC}>
                    {['PKR','USD','AED','SAR','GBP','EUR'].map(c=><option key={c}>{c}</option>)}
                  </select>
                </FL>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={f.bankVerified} onChange={e=>ss('bankVerified',e.target.checked)} className="w-4 h-4 accent-[#0C447C]"/>
                    <span className="text-sm font-medium text-slate-700">Bank details verified</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {section === 'teaching' && (
            <div>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 mb-5">
                <div>
                  <p className="text-sm font-semibold text-slate-700">This staff member has teaching responsibilities</p>
                  <p className="text-xs text-slate-400 mt-0.5">Enable to configure subjects, grades and teaching details</p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={f.isTeacher} onChange={e=>ss('isTeacher',e.target.checked)} className="w-4 h-4 accent-[#0C447C]"/>
                </label>
              </div>
              {f.isTeacher && (
                <>
                  <SH title="Subjects Can Teach" />
                  <div className="flex flex-wrap gap-2 mb-4">
                    {EDIT_SUBJECTS.map(s => (
                      <label key={s} className={`flex items-center gap-1.5 px-3 py-1 rounded-full border cursor-pointer text-xs font-medium transition-all ${(f.subjectsCanTeach ?? []).includes(s) ? 'bg-[#0C447C] text-white border-[#0C447C]' : 'border-slate-200 text-slate-600 hover:border-[#0C447C] hover:text-[#0C447C]'}`}>
                        <input type="checkbox" className="sr-only" checked={(f.subjectsCanTeach ?? []).includes(s)} onChange={()=>toggleArr('subjectsCanTeach', s)}/>
                        {s}
                      </label>
                    ))}
                  </div>
                  <SH title="Grade Levels Can Teach" />
                  <div className="flex flex-wrap gap-2 mb-4">
                    {EDIT_GRADES.map(g => (
                      <label key={g} className={`flex items-center gap-1.5 px-3 py-1 rounded-full border cursor-pointer text-xs font-medium transition-all ${(f.gradeLevels ?? []).includes(g) ? 'bg-[#0C447C] text-white border-[#0C447C]' : 'border-slate-200 text-slate-600 hover:border-[#0C447C]'}`}>
                        <input type="checkbox" className="sr-only" checked={(f.gradeLevels ?? []).includes(g)} onChange={()=>toggleArr('gradeLevels', g)}/>
                        {g}
                      </label>
                    ))}
                  </div>
                  <SH title="Teaching Capacity" />
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <FL label="Max Periods / Day"><input type="number" value={f.maxPeriodsPerDay} onChange={e=>ss('maxPeriodsPerDay',e.target.value)} className={IC}/></FL>
                    <FL label="Max Periods / Week"><input type="number" value={f.maxPeriodsPerWeek} onChange={e=>ss('maxPeriodsPerWeek',e.target.value)} className={IC}/></FL>
                    <FL label="Specializations"><input value={f.specializations} onChange={e=>ss('specializations',e.target.value)} className={IC}/></FL>
                    <div className="flex items-end pb-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={f.isClassTeacher} onChange={e=>ss('isClassTeacher',e.target.checked)} className="w-4 h-4 accent-[#0C447C]"/>
                        <span className="text-sm font-medium text-slate-700">Class Teacher</span>
                      </label>
                    </div>
                  </div>
                  <SH title="Teaching Certifications" />
                  <div className="grid grid-cols-2 gap-3">
                    {([['certCambridge','Cambridge Certified Teacher'],['certIB','IB Certified Teacher'],['certGoogle','Google Certified Educator'],['certMicrosoft','Microsoft Certified Educator'],['certSEN','Special Needs (SEN) Trained'],['certECE','Early Childhood Education Certified']] as [keyof EditForm, string][]).map(([k, label]) => (
                      <label key={k} className="flex items-center gap-2 cursor-pointer py-1">
                        <input type="checkbox" checked={f[k] as boolean} onChange={e=>ss(k, e.target.checked as EditForm[typeof k])} className="w-4 h-4 accent-[#0C447C]"/>
                        <span className="text-sm text-slate-700">{label}</span>
                      </label>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {section === 'qualifications' && (
            <div>
              <SH title="Academic Qualifications" />
              {(f.qualifications ?? []).map((q, i) => (
                <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-200 mb-3">
                  <div className="grid grid-cols-3 gap-3">
                    <FL label="Degree / Level">
                      <select value={q.degree} onChange={e=>updQ(i,'degree',e.target.value)} className={IC}>
                        <option value="">Select</option>
                        {['Secondary','Diploma','Bachelors','Masters','PhD','Certification','Other'].map(d=><option key={d}>{d}</option>)}
                      </select>
                    </FL>
                    <FL label="Field of Study"><input value={q.field} onChange={e=>updQ(i,'field',e.target.value)} className={IC}/></FL>
                    <FL label="Institution"><input value={q.institution} onChange={e=>updQ(i,'institution',e.target.value)} className={IC}/></FL>
                    <FL label="Country"><input value={q.country} onChange={e=>updQ(i,'country',e.target.value)} className={IC}/></FL>
                    <FL label="Year of Completion"><input value={q.year} onChange={e=>updQ(i,'year',e.target.value)} className={IC}/></FL>
                    <FL label="Grade / CGPA"><input value={q.grade} onChange={e=>updQ(i,'grade',e.target.value)} className={IC}/></FL>
                    <FL label="Specialization" span><input value={q.specialization} onChange={e=>updQ(i,'specialization',e.target.value)} className={IC}/></FL>
                    <div className="flex items-end justify-end"><button onClick={()=>remQ(i)} className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={12}/>Remove</button></div>
                  </div>
                </div>
              ))}
              <button onClick={addQ} className="flex items-center gap-1.5 text-xs text-[#0C447C] hover:underline font-medium mb-5"><Plus size={13}/>Add Qualification</button>

              <SH title="Professional Certifications" />
              {(f.certifications ?? []).map((c2, i) => (
                <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-200 mb-3">
                  <div className="grid grid-cols-4 gap-3">
                    <FL label="Certification Name"><input value={c2.name} onChange={e=>updC(i,'name',e.target.value)} className={IC}/></FL>
                    <FL label="Issued By"><input value={c2.issuedBy} onChange={e=>updC(i,'issuedBy',e.target.value)} className={IC}/></FL>
                    <FL label="Issue Date"><input type="date" value={c2.issueDate} onChange={e=>updC(i,'issueDate',e.target.value)} className={IC}/></FL>
                    <FL label="Expiry Date">
                      <div className="flex gap-1">
                        <input type="date" value={c2.expiryDate} onChange={e=>updC(i,'expiryDate',e.target.value)} className={IC}/>
                        <button onClick={()=>remC(i)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg shrink-0"><Trash2 size={13}/></button>
                      </div>
                    </FL>
                  </div>
                </div>
              ))}
              <button onClick={addC} className="flex items-center gap-1.5 text-xs text-[#0C447C] hover:underline font-medium mb-5"><Plus size={13}/>Add Certification</button>

              <SH title="Work Experience" />
              {(f.experience ?? []).map((e2, i) => (
                <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-200 mb-3">
                  <div className="grid grid-cols-3 gap-3">
                    <FL label="Employer"><input value={e2.employer} onChange={ev=>updE(i,'employer',ev.target.value)} className={IC}/></FL>
                    <FL label="Job Title"><input value={e2.jobTitle} onChange={ev=>updE(i,'jobTitle',ev.target.value)} className={IC}/></FL>
                    <FL label="From Date"><input type="date" value={e2.fromDate} onChange={ev=>updE(i,'fromDate',ev.target.value)} className={IC}/></FL>
                    <FL label="To Date"><input type="date" value={e2.toDate} onChange={ev=>updE(i,'toDate',ev.target.value)} className={IC}/></FL>
                    <FL label="Reason for Leaving"><input value={e2.reason} onChange={ev=>updE(i,'reason',ev.target.value)} className={IC}/></FL>
                    <div className="flex items-end justify-end"><button onClick={()=>remE(i)} className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={12}/>Remove</button></div>
                  </div>
                </div>
              ))}
              <button onClick={addE} className="flex items-center gap-1.5 text-xs text-[#0C447C] hover:underline font-medium mb-5"><Plus size={13}/>Add Experience</button>

              <SH title="References" />
              <div className="grid grid-cols-2 gap-6">
                {([0, 1] as const).map(n => {
                  const r = (f.references ?? [])[n] ?? { name:'', title:'', organization:'', phone:'', email:'' }
                  return (
                    <div key={n} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Reference {n + 1}</p>
                      {([['Name','name'],['Title','title'],['Organization','organization'],['Phone','phone'],['Email','email']] as [string, keyof ERef][]).map(([label, key]) => (
                        <div key={key} className="mb-2">
                          <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
                          <input value={r[key]} onChange={e=>updR(n, key, e.target.value)} className={IC} placeholder={label}/>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-slate-100 flex gap-2 justify-end shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 font-medium">Cancel</button>
          <button onClick={handleSave} disabled={updateMutation.isPending}
            className="px-4 py-2 text-sm bg-[#0C447C] text-white rounded-lg hover:bg-[#0b3d6e] font-medium disabled:opacity-50">
            {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── OVERVIEW TAB ─────────────────────────────────────────────────────────────
function OverviewTab({ staff, notes }: { staff: any; notes: any[] }) {
  const last7 = useMemo(() => {
    const days: { date: string; label: string }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      days.push({ date: d.toISOString().split('T')[0], label: d.toLocaleDateString('en', { weekday:'short' }) })
    }
    return days
  }, [])

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="col-span-2 space-y-4">
        <Card>
          <CardHeader title="Personal Information" />
          <div className="p-4">
            <InfoRow icon={User}        label="Full Name"       value={staffFull(staff)} />
            <InfoRow icon={CalendarDays} label="Date of Birth"  value={fmt(staff.dateOfBirth)} />
            <InfoRow icon={User}        label="Gender"          value={staff.gender} />
            <InfoRow icon={MapPin}      label="Nationality"     value={staff.personal?.nationality} />
            <InfoRow icon={Heart}       label="Blood Group"     value={staff.personal?.bloodGroup} />
            <InfoRow icon={Phone}       label="Phone"           value={staff.phone} />
            <InfoRow icon={Mail}        label="Email"           value={staff.email} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Employment Details" />
          <div className="p-4">
            <InfoRow icon={Briefcase}   label="Designation"     value={staff.designationId?.name || staff.designation} />
            <InfoRow icon={GraduationCap} label="Department"    value={staff.department} />
            <InfoRow icon={MapPin}      label="Campus"          value={staff.campusId?.name || staff.campus} />
            <InfoRow icon={User}        label="Employment Type" value={staff.employmentType?.replace('_', ' ')} />
            <InfoRow icon={CalendarDays} label="Joining Date"   value={fmt(staff.dateOfJoining)} />
            <InfoRow icon={User}        label="ERP Role"        value={staff.erpRole} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Last 7 Days Attendance" />
          <div className="p-4 flex gap-2">
            {last7.map(d => (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5">
                <p className="text-xs text-slate-400 font-medium">{d.label}</p>
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                  <span className="text-slate-300 text-xs">—</span>
                </div>
                <p className="text-[10px] text-slate-400">{d.date.slice(8)}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <div className="space-y-4">
        {[
          { label:'Years of Service', value:yearsOfService(staff.dateOfJoining), color:'#0C447C', icon:Award },
          { label:'Department', value:staff.department || '—', color:'#059669', icon:Briefcase },
          { label:'Contract Type', value:staff.employment?.contractType || staff.contractType || '—', color:'#EF9F27', icon:FileText },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: s.color + '18' }}>
              <s.icon size={18} style={{ color: s.color }} />
            </div>
            <div>
              <p className="text-base font-bold text-slate-800">{s.value}</p>
              <p className="text-xs text-slate-400">{s.label}</p>
            </div>
          </div>
        ))}
        {(staff.contact?.emergency || staff.emergencyName) && (
          <Card>
            <CardHeader title="Emergency Contact" />
            <div className="p-4">
              <p className="text-sm font-semibold text-slate-700">{staff.contact?.emergency?.name || staff.emergencyName || '—'}</p>
              <p className="text-xs text-slate-400 mt-0.5">{staff.contact?.emergency?.relation || staff.emergencyRelation || '—'}</p>
              <p className="text-sm text-slate-600 mt-2 flex items-center gap-1.5"><Phone size={12} className="text-slate-400"/>{staff.contact?.emergency?.phone || staff.emergencyPhone || '—'}</p>
            </div>
          </Card>
        )}
        {notes.length > 0 && (
          <Card>
            <CardHeader title="Recent Notes" sub={`${notes.length} total`} />
            <div className="p-4 space-y-3">
              {notes.slice(0, 3).map((n: any) => (
                <div key={n._id} className="border-b border-slate-50 last:border-0 pb-2 last:pb-0">
                  <Badge v={statusBV(n.category ?? 'general')}>{n.category || 'general'}</Badge>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2">{n.title || n.content}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{fmt(n.createdAt)}</p>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

// ─── PERSONAL TAB ─────────────────────────────────────────────────────────────
function PersonalTab({ staff, staffId }: { staff: any; staffId: string }) {
  const queryClient = useQueryClient()
  const p   = staff?.personal   ?? {}
  const c   = staff?.contact    ?? {}
  const ca  = c.currentAddress  ?? staff?.address ?? {}
  const pa  = c.permanentAddress ?? {}
  const em  = c.emergency        ?? {}
  const ids = staff?.identityDocs ?? {}

  type F = {
    firstName:string; lastName:string; phone:string; email:string
    gender:string; dateOfBirth:string; title:string; middleName:string; preferredName:string; arabicName:string
    placeOfBirth:string; maritalStatus:string; nationality:string; secondNationality:string
    religion:string; bloodGroup:string; motherTongue:string; languagesSpoken:string
    nationalIdNo:string; nationalIdExpiry:string; passportNo:string; passportExpiry:string
    visaNo:string; visaExpiry:string; residencePermitNo:string; residencePermitExpiry:string
    teachingLicenseNo:string; teachingLicenseExpiry:string
    personalPhone:string; workPhone:string; whatsApp:string; altPhone:string; workEmail:string
    curStreet:string; curCity:string; curState:string; curCountry:string; curPostal:string
    sameAddress:boolean
    perStreet:string; perCity:string; perState:string; perCountry:string; perPostal:string
    emergencyName:string; emergencyRelation:string; emergencyPhone:string; emergencyAltPhone:string
  }

  const [f, setF] = useState<F>({
    firstName:'', lastName:'', phone:'', email:'', gender:'', dateOfBirth:'',
    title:'', middleName:'', preferredName:'', arabicName:'', placeOfBirth:'',
    maritalStatus:'', nationality:'', secondNationality:'', religion:'', bloodGroup:'', motherTongue:'', languagesSpoken:'',
    nationalIdNo:'', nationalIdExpiry:'', passportNo:'', passportExpiry:'',
    visaNo:'', visaExpiry:'', residencePermitNo:'', residencePermitExpiry:'',
    teachingLicenseNo:'', teachingLicenseExpiry:'',
    personalPhone:'', workPhone:'', whatsApp:'', altPhone:'', workEmail:'',
    curStreet:'', curCity:'', curState:'', curCountry:'', curPostal:'',
    sameAddress:true,
    perStreet:'', perCity:'', perState:'', perCountry:'', perPostal:'',
    emergencyName:'', emergencyRelation:'', emergencyPhone:'', emergencyAltPhone:'',
  })

  const initRef = useRef({ id:'' })
  useEffect(() => {
    if (!staff || initRef.current.id === staff._id) return
    initRef.current.id = staff._id
    setF({
      firstName:    staff.firstName        ?? '',
      lastName:     staff.lastName         ?? '',
      phone:        staff.phone            ?? '',
      email:        staff.email            ?? '',
      gender:       staff.gender           ?? '',
      dateOfBirth:  staff.dateOfBirth ? new Date(staff.dateOfBirth).toISOString().slice(0,10) : '',
      title:        p.title               ?? '',
      middleName:   p.middleName          ?? '',
      preferredName:p.preferredName       ?? '',
      arabicName:   p.arabicName          ?? '',
      placeOfBirth: p.placeOfBirth        ?? '',
      maritalStatus:p.maritalStatus       ?? '',
      nationality:  p.nationality         ?? '',
      secondNationality: p.secondNationality ?? '',
      religion:     p.religion            ?? '',
      bloodGroup:   p.bloodGroup          ?? '',
      motherTongue: p.motherTongue        ?? '',
      languagesSpoken: p.languagesSpoken  ?? '',
      nationalIdNo:   ids.nationalId?.no    ?? '',
      nationalIdExpiry: ids.nationalId?.expiry ? new Date(ids.nationalId.expiry).toISOString().slice(0,10) : '',
      passportNo:     ids.passport?.no      ?? '',
      passportExpiry: ids.passport?.expiry ? new Date(ids.passport.expiry).toISOString().slice(0,10) : '',
      visaNo:         ids.visa?.no          ?? '',
      visaExpiry:     ids.visa?.expiry ? new Date(ids.visa.expiry).toISOString().slice(0,10) : '',
      residencePermitNo:     ids.residencePermit?.no     ?? '',
      residencePermitExpiry: ids.residencePermit?.expiry ? new Date(ids.residencePermit.expiry).toISOString().slice(0,10) : '',
      teachingLicenseNo:     ids.teachingLicense?.no     ?? '',
      teachingLicenseExpiry: ids.teachingLicense?.expiry ? new Date(ids.teachingLicense.expiry).toISOString().slice(0,10) : '',
      personalPhone: c.personalPhone ?? staff.phone ?? '',
      workPhone:     c.workPhone     ?? '',
      whatsApp:      c.whatsApp      ?? '',
      altPhone:      c.altPhone      ?? '',
      workEmail:     c.workEmail     ?? staff.email ?? '',
      curStreet: ca.street ?? '', curCity: ca.city ?? '', curState: ca.state ?? '',
      curCountry: ca.country ?? '', curPostal: ca.postalCode ?? '',
      sameAddress: !pa.street,
      perStreet: pa.street ?? '', perCity: pa.city ?? '', perState: pa.state ?? '',
      perCountry: pa.country ?? '', perPostal: pa.postalCode ?? '',
      emergencyName:     em.name     ?? '',
      emergencyRelation: em.relation ?? '',
      emergencyPhone:    em.phone    ?? '',
      emergencyAltPhone: em.altPhone ?? '',
    })
  }, [staff]) // eslint-disable-line react-hooks/exhaustive-deps

  const ss = (k: keyof F, v: string | boolean) => setF(prev => ({ ...prev, [k]: v } as F))

  const updateMutation = useMutation({
    mutationFn: (payload: any) => hrService.updateStaff(staffId, payload),
    onSuccess: () => {
      initRef.current.id = ''
      queryClient.invalidateQueries({ queryKey: ['staff-member', staffId] })
      toast.success('Profile updated')
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Update failed'),
  })

  const handleSave = () => {
    const permAddr = f.sameAddress
      ? { street: f.curStreet, city: f.curCity, state: f.curState, country: f.curCountry, postalCode: f.curPostal }
      : { street: f.perStreet, city: f.perCity, state: f.perState, country: f.perCountry, postalCode: f.perPostal }
    updateMutation.mutate({
      firstName: f.firstName, lastName: f.lastName,
      phone: f.personalPhone || f.phone || undefined,
      email: f.workEmail || f.email || undefined,
      gender: f.gender || undefined,
      dateOfBirth: f.dateOfBirth || undefined,
      address: { street: f.curStreet, city: f.curCity, state: f.curState, country: f.curCountry, postalCode: f.curPostal },
      personal: {
        title: f.title || undefined, middleName: f.middleName || undefined,
        preferredName: f.preferredName || undefined, arabicName: f.arabicName || undefined,
        placeOfBirth: f.placeOfBirth || undefined, maritalStatus: f.maritalStatus || undefined,
        nationality: f.nationality || undefined, secondNationality: f.secondNationality || undefined,
        religion: f.religion || undefined, bloodGroup: f.bloodGroup || undefined,
        motherTongue: f.motherTongue || undefined, languagesSpoken: f.languagesSpoken || undefined,
      },
      contact: {
        personalPhone: f.personalPhone || undefined, workPhone: f.workPhone || undefined,
        whatsApp: f.whatsApp || undefined, altPhone: f.altPhone || undefined,
        workEmail: f.workEmail || undefined,
        currentAddress: { street: f.curStreet, city: f.curCity, state: f.curState, country: f.curCountry, postalCode: f.curPostal },
        permanentAddress: permAddr,
        emergency: f.emergencyName ? { name: f.emergencyName, relation: f.emergencyRelation, phone: f.emergencyPhone, altPhone: f.emergencyAltPhone || undefined } : undefined,
      },
    })
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title="Personal Details" sub="Edit all sections then click Save Changes"
          actions={<button onClick={handleSave} disabled={updateMutation.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#0C447C] text-white rounded-lg hover:bg-[#0b3d6e] font-medium disabled:opacity-50">
            {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
          </button>} />
        <SH title="Basic Identity" />
        <div className="px-5 pb-5 grid grid-cols-2 gap-4">
          <FL label="Title"><select value={f.title} onChange={e=>ss('title',e.target.value)} className={IC}><option value="">Select</option>{['Mr','Mrs','Ms','Dr','Prof','Sheikh','Haji'].map(t=><option key={t}>{t}</option>)}</select></FL>
          <FL label="Employee ID" ro><input value={staff.employeeId || '—'} readOnly className={RO}/></FL>
          <FL label="First Name" required><input value={f.firstName} onChange={e=>ss('firstName',e.target.value)} className={IC} placeholder="First name"/></FL>
          <FL label="Middle Name"><input value={f.middleName} onChange={e=>ss('middleName',e.target.value)} className={IC} placeholder="Middle name"/></FL>
          <FL label="Last Name" required><input value={f.lastName} onChange={e=>ss('lastName',e.target.value)} className={IC} placeholder="Last name"/></FL>
          <FL label="Preferred Name"><input value={f.preferredName} onChange={e=>ss('preferredName',e.target.value)} className={IC} placeholder="Name at work"/></FL>
          <FL label="Arabic Name"><input value={f.arabicName} onChange={e=>ss('arabicName',e.target.value)} className={IC} placeholder="الاسم بالعربي" dir="rtl"/></FL>
          <FL label="Date of Birth"><input type="date" value={f.dateOfBirth} onChange={e=>ss('dateOfBirth',e.target.value)} className={IC}/></FL>
          <FL label="Place of Birth"><input value={f.placeOfBirth} onChange={e=>ss('placeOfBirth',e.target.value)} className={IC} placeholder="City, Country"/></FL>
          <FL label="Gender"><select value={f.gender} onChange={e=>ss('gender',e.target.value)} className={IC}><option value="">Select</option><option>Male</option><option>Female</option></select></FL>
          <FL label="Marital Status"><select value={f.maritalStatus} onChange={e=>ss('maritalStatus',e.target.value)} className={IC}><option value="">Select</option>{['Single','Married','Divorced','Widowed'].map(s=><option key={s}>{s}</option>)}</select></FL>
          <FL label="Nationality"><input value={f.nationality} onChange={e=>ss('nationality',e.target.value)} className={IC} placeholder="e.g. Pakistani"/></FL>
          <FL label="Second Nationality"><input value={f.secondNationality} onChange={e=>ss('secondNationality',e.target.value)} className={IC} placeholder="Optional"/></FL>
          <FL label="Religion"><select value={f.religion} onChange={e=>ss('religion',e.target.value)} className={IC}><option value="">Select</option>{['Islam','Christianity','Hinduism','Judaism','Buddhism','Other'].map(r=><option key={r}>{r}</option>)}</select></FL>
          <FL label="Blood Group"><select value={f.bloodGroup} onChange={e=>ss('bloodGroup',e.target.value)} className={IC}><option value="">Unknown</option>{['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(g=><option key={g}>{g}</option>)}</select></FL>
          <FL label="Mother Tongue"><input value={f.motherTongue} onChange={e=>ss('motherTongue',e.target.value)} className={IC} placeholder="e.g. Urdu"/></FL>
          <FL label="Languages Spoken" span><input value={f.languagesSpoken} onChange={e=>ss('languagesSpoken',e.target.value)} className={IC} placeholder="e.g. English, Urdu, Arabic"/></FL>
        </div>
        <SH title="Identity Documents" />
        <div className="px-5 pb-5 grid grid-cols-2 gap-4">
          <FL label="National ID No"><input value={f.nationalIdNo} onChange={e=>ss('nationalIdNo',e.target.value)} className={IC} placeholder="CNIC / National ID"/></FL>
          <FL label="National ID Expiry"><input type="date" value={f.nationalIdExpiry} onChange={e=>ss('nationalIdExpiry',e.target.value)} className={IC}/></FL>
          <FL label="Passport No"><input value={f.passportNo} onChange={e=>ss('passportNo',e.target.value)} className={IC} placeholder="Passport number"/></FL>
          <FL label="Passport Expiry"><input type="date" value={f.passportExpiry} onChange={e=>ss('passportExpiry',e.target.value)} className={IC}/></FL>
          <FL label="Visa No"><input value={f.visaNo} onChange={e=>ss('visaNo',e.target.value)} className={IC} placeholder="Visa number"/></FL>
          <FL label="Visa Expiry"><input type="date" value={f.visaExpiry} onChange={e=>ss('visaExpiry',e.target.value)} className={IC}/></FL>
          <FL label="Teaching License No"><input value={f.teachingLicenseNo} onChange={e=>ss('teachingLicenseNo',e.target.value)} className={IC} placeholder="License number"/></FL>
          <FL label="Teaching License Expiry"><input type="date" value={f.teachingLicenseExpiry} onChange={e=>ss('teachingLicenseExpiry',e.target.value)} className={IC}/></FL>
        </div>
        <SH title="Contact Information" />
        <div className="px-5 pb-5 grid grid-cols-2 gap-4">
          <FL label="Personal Phone"><input value={f.personalPhone} onChange={e=>ss('personalPhone',e.target.value)} className={IC} placeholder="+92 300 0000000"/></FL>
          <FL label="Work Phone"><input value={f.workPhone} onChange={e=>ss('workPhone',e.target.value)} className={IC} placeholder="Office / extension"/></FL>
          <FL label="WhatsApp"><input value={f.whatsApp} onChange={e=>ss('whatsApp',e.target.value)} className={IC} placeholder="+92 300 0000000"/></FL>
          <FL label="Alternate Phone"><input value={f.altPhone} onChange={e=>ss('altPhone',e.target.value)} className={IC} placeholder="+92 300 0000000"/></FL>
          <FL label="Personal Email"><input type="email" value={f.email} onChange={e=>ss('email',e.target.value)} className={IC} placeholder="personal@email.com"/></FL>
          <FL label="Work Email"><input type="email" value={f.workEmail} onChange={e=>ss('workEmail',e.target.value)} className={IC} placeholder="name@school.edu"/></FL>
        </div>
        <SH title="Current Address" />
        <div className="px-5 pb-5 grid grid-cols-2 gap-4">
          <FL label="Street Address" span><input value={f.curStreet} onChange={e=>ss('curStreet',e.target.value)} className={IC} placeholder="Street address"/></FL>
          <FL label="City"><input value={f.curCity} onChange={e=>ss('curCity',e.target.value)} className={IC} placeholder="City"/></FL>
          <FL label="State / Province"><input value={f.curState} onChange={e=>ss('curState',e.target.value)} className={IC} placeholder="State"/></FL>
          <FL label="Country"><input value={f.curCountry} onChange={e=>ss('curCountry',e.target.value)} className={IC} placeholder="Country"/></FL>
          <FL label="Postal Code"><input value={f.curPostal} onChange={e=>ss('curPostal',e.target.value)} className={IC} placeholder="Postal code"/></FL>
          <div className="col-span-2"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={f.sameAddress} onChange={e=>ss('sameAddress',e.target.checked)} className="w-4 h-4 accent-[#0C447C]"/><span className="text-sm font-medium text-slate-700">Permanent address same as current</span></label></div>
        </div>
        {!f.sameAddress && (
          <>
            <SH title="Permanent Address" />
            <div className="px-5 pb-5 grid grid-cols-2 gap-4">
              <FL label="Street" span><input value={f.perStreet} onChange={e=>ss('perStreet',e.target.value)} className={IC}/></FL>
              <FL label="City"><input value={f.perCity} onChange={e=>ss('perCity',e.target.value)} className={IC}/></FL>
              <FL label="Country"><input value={f.perCountry} onChange={e=>ss('perCountry',e.target.value)} className={IC}/></FL>
            </div>
          </>
        )}
        <SH title="Emergency Contact" />
        <div className="px-5 pb-5 grid grid-cols-2 gap-4">
          <FL label="Contact Name"><input value={f.emergencyName} onChange={e=>ss('emergencyName',e.target.value)} className={IC} placeholder="Full name"/></FL>
          <FL label="Relationship"><input value={f.emergencyRelation} onChange={e=>ss('emergencyRelation',e.target.value)} className={IC} placeholder="e.g. Spouse, Parent"/></FL>
          <FL label="Phone"><input value={f.emergencyPhone} onChange={e=>ss('emergencyPhone',e.target.value)} className={IC} placeholder="+92 300 0000000"/></FL>
          <FL label="Alternate Phone"><input value={f.emergencyAltPhone} onChange={e=>ss('emergencyAltPhone',e.target.value)} className={IC}/></FL>
        </div>
      </Card>
    </div>
  )
}

function ErpAccessAction({ staff }: { staff: any }) {
  const queryClient = useQueryClient()
  const [createdPassword, setCreatedPassword] = useState<string | null>(null)

  const createLoginMutation = useMutation({
    mutationFn: () => hrService.createLoginForStaff(staff._id),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['staff-member', staff._id] })
      setCreatedPassword(res.tempPassword)
      toast.success('Portal account created')
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create login'),
  })

  const resetLinkMutation = useMutation({
    mutationFn: () => authService.forgotPassword(staff.email),
    onSuccess: () => toast.success(`Reset link sent to ${staff.email}`),
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to send reset link'),
  })

  if (createdPassword) {
    return (
      <div className="text-right">
        <p className="text-xs text-amber-600 font-medium mb-1">Temporary password (shown once only):</p>
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5">
          <code className="text-sm font-mono text-slate-700">{createdPassword}</code>
          <button onClick={() => { navigator.clipboard.writeText(createdPassword); toast.success('Copied') }} className="text-xs text-[#0C447C] font-medium hover:underline">Copy</button>
        </div>
        <p className="text-xs text-slate-400 mt-1">Share this once, directly — it can't be retrieved again after you leave this page.</p>
      </div>
    )
  }

  if (!staff.userId) {
    if (!staff.email) return <span className="text-xs text-slate-400">Add a work email first</span>
    return (
      <button onClick={() => createLoginMutation.mutate()} disabled={createLoginMutation.isPending}
        className="px-3 py-1.5 text-xs bg-[#0C447C] text-white rounded-lg hover:bg-[#0b3d6e] font-medium disabled:opacity-50 whitespace-nowrap">
        {createLoginMutation.isPending ? 'Creating…' : 'Create Login'}
      </button>
    )
  }

  return (
    <button onClick={() => resetLinkMutation.mutate()} disabled={resetLinkMutation.isPending}
      className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-700 font-medium disabled:opacity-50 whitespace-nowrap">
      {resetLinkMutation.isPending ? 'Sending…' : 'Send Password Reset Link'}
    </button>
  )
}

// ─── EMPLOYMENT TAB ───────────────────────────────────────────────────────────
function EmploymentTab({ staff }: { staff: any }) {
  const emp = staff?.employment ?? {}
  const fields = [
    ['Employee ID',       staff.employeeId],
    ['Designation',       staff.designationId?.name || staff.designation],
    ['Department',        staff.department],
    ['Campus',            staff.campusId?.name || staff.campus],
    ['Employment Type',   staff.employmentType?.replace('_',' ')],
    ['ERP Role',          staff.erpRole],
    ['Reporting Manager', emp.reportingTo || staff.reportingManager],
    ['Date of Joining',   fmt(staff.dateOfJoining)],
    ['Contract Type',     emp.contractType || staff.contractType],
    ['Contract End Date', fmt(emp.contractEndDate)],
    ['Probation End',     fmt(emp.probationEndDate)],
    ['Notice Period',     emp.noticePeriodDays ? `${emp.noticePeriodDays} days` : undefined],
    ['Working Hours/Week',emp.workingHoursPerWeek ? `${emp.workingHoursPerWeek} hrs` : undefined],
    ['Status',            staff.status],
  ]
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title="Current Position" sub="Read-only — edit via HR Manager" />
        <div className="p-5 grid grid-cols-4 gap-3">
          {fields.filter(([,v])=>v).map(([label, value]) => (
            <div key={label as string} className="bg-slate-50 border border-slate-100 rounded-xl p-3">
              <p className="text-xs text-slate-400 mb-1">{label as string}</p>
              <p className="text-sm font-semibold text-slate-700 capitalize">{value as string}</p>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <CardHeader title="ERP Portal Access" />
        <div className="p-5">
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${staff.userId ? 'bg-emerald-100' : 'bg-slate-200'}`}>
              {staff.userId ? <CheckCircle size={20} className="text-emerald-600"/> : <X size={20} className="text-slate-400"/>}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-700">{staff.userId ? 'Portal account exists' : 'No portal account'}</p>
              <p className="text-xs text-slate-400">{staff.email || 'No work email configured'}</p>
            </div>
            <ErpAccessAction staff={staff} />
          </div>
          {staff.userId && (
            <p className="text-xs text-slate-400 mt-3">
              Passwords are stored securely and can never be viewed or retrieved, even by an admin — that's true of any real system. To share access, send a reset link: {staff.firstName} gets an email to set their own password directly, valid for 1 hour.
            </p>
          )}
        </div>
      </Card>
    </div>
  )
}

// ─── TEACHING TAB ─────────────────────────────────────────────────────────────
function TeachingTab({ staff }: { staff: any }) {
  const tp = staff?.teacherProfile
  if (!tp && staff.erpRole !== 'teacher') {
    return <Card><div className="px-5 py-12 text-center text-sm text-slate-400">This staff member does not have a teaching profile configured.</div></Card>
  }
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Subjects Can Teach" sub={`${(tp?.subjectsCanTeach ?? []).length} subjects`}/>
          <div className="p-4 flex flex-wrap gap-2">
            {(tp?.subjectsCanTeach ?? []).length === 0
              ? <p className="text-xs text-slate-400">Not configured</p>
              : (tp.subjectsCanTeach as string[]).map((s: string) => <Badge key={s} v="blue">{s}</Badge>)}
          </div>
        </Card>
        <Card>
          <CardHeader title="Grade Levels" sub={`${(tp?.gradeLevelsCanTeach ?? []).length} levels`}/>
          <div className="p-4 flex flex-wrap gap-2">
            {(tp?.gradeLevelsCanTeach ?? []).length === 0
              ? <p className="text-xs text-slate-400">Not configured</p>
              : (tp.gradeLevelsCanTeach as string[]).map((g: string) => <Badge key={g} v="green">{g}</Badge>)}
          </div>
        </Card>
      </div>
      <Card>
        <CardHeader title="Teaching Capacity & Details"/>
        <div className="p-5 grid grid-cols-3 gap-4">
          {[
            ['Max Periods / Day',  tp?.maxPeriodsPerDay ?? '—'],
            ['Max Periods / Week', tp?.maxPeriodsPerWeek ?? '—'],
            ['Class Teacher',      tp?.isClassTeacher ? 'Yes' : 'No'],
            ['Specializations',    tp?.specializations || '—'],
          ].map(([k,v]) => <div key={k as string} className="bg-slate-50 rounded-xl p-3 border border-slate-100"><p className="text-xs text-slate-400 mb-1">{k as string}</p><p className="text-sm font-semibold text-slate-700">{v as string}</p></div>)}
        </div>
      </Card>
      {tp?.certifications && (
        <Card>
          <CardHeader title="Teaching Certifications"/>
          <div className="p-4 flex flex-wrap gap-2">
            {Object.entries(tp.certifications as Record<string, boolean>).filter(([,v])=>v).map(([k])=>(
              <Badge key={k} v="navy">{k.toUpperCase()}</Badge>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

// ─── QUALIFICATIONS TAB ───────────────────────────────────────────────────────
function QualificationsTab({ staff }: { staff: any }) {
  const quals = (staff?.qualifications ?? []) as any[]
  const certs = (staff?.certifications ?? []) as any[]
  const exps  = (staff?.experience ?? []) as any[]
  const refs  = (staff?.references ?? []) as any[]
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title="Academic Qualifications" sub={`${quals.length} recorded`}/>
        {quals.length === 0 ? <div className="p-5 text-sm text-center text-slate-400">No qualifications recorded</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-slate-50 border-b border-slate-100">{['Degree','Field','Institution','Country','Year','Grade'].map(h=><th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase">{h}</th>)}</tr></thead>
              <tbody>{quals.map((q:any,i:number)=><tr key={i} className="border-b border-slate-50"><td className="px-4 py-3 text-slate-700">{q.degree}</td><td className="px-4 py-3 text-slate-700">{q.field}</td><td className="px-4 py-3 text-slate-700">{q.institution}</td><td className="px-4 py-3 text-slate-500">{q.country||'—'}</td><td className="px-4 py-3 text-slate-500">{q.year||'—'}</td><td className="px-4 py-3 text-slate-500">{q.grade||'—'}</td></tr>)}</tbody>
            </table>
          </div>
        )}
      </Card>
      <Card>
        <CardHeader title="Professional Certifications" sub={`${certs.length} recorded`}/>
        {certs.length === 0 ? <div className="p-5 text-sm text-center text-slate-400">No certifications recorded</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-slate-50 border-b border-slate-100">{['Certification','Issued By','Issue Date','Expiry'].map(h=><th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase">{h}</th>)}</tr></thead>
              <tbody>{certs.map((c:any,i:number)=><tr key={i} className="border-b border-slate-50"><td className="px-4 py-3 text-slate-700">{c.name}</td><td className="px-4 py-3 text-slate-500">{c.issuedBy||'—'}</td><td className="px-4 py-3 text-slate-500">{fmt(c.issueDate)}</td><td className="px-4 py-3"><Badge v={c.expiryDate&&new Date(c.expiryDate)<new Date()?'red':'green'}>{fmt(c.expiryDate)}</Badge></td></tr>)}</tbody>
            </table>
          </div>
        )}
      </Card>
      <Card>
        <CardHeader title="Work Experience" sub={`${exps.length} entries`}/>
        {exps.length === 0 ? <div className="p-5 text-sm text-center text-slate-400">No experience recorded</div> : (
          <div className="p-4 space-y-3">
            {exps.map((e:any,i:number)=>(
              <div key={i} className="flex gap-3 pb-3 border-b border-slate-50 last:border-0">
                <div className="w-2 h-2 rounded-full bg-[#0C447C] mt-2 shrink-0"/>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{e.jobTitle} — {e.employer}</p>
                  <p className="text-xs text-slate-500">{fmt(e.fromDate)} → {e.toDate ? fmt(e.toDate) : 'Present'}</p>
                  {e.reason && <p className="text-xs text-slate-400 mt-0.5">{e.reason}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
      {refs.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {refs.map((r:any,i:number)=>(
            <Card key={i}>
              <CardHeader title={`Reference ${i+1}`}/>
              <div className="p-4">
                <p className="text-sm font-semibold text-slate-700">{r.name}</p>
                <p className="text-xs text-slate-500">{r.title}{r.organization ? ` · ${r.organization}` : ''}</p>
                {r.phone && <p className="text-xs text-slate-500 mt-1 flex items-center gap-1"><Phone size={11}/>{r.phone}</p>}
                {r.email && <p className="text-xs text-slate-500 flex items-center gap-1"><Mail size={11}/>{r.email}</p>}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── ATTENDANCE TAB ───────────────────────────────────────────────────────────
const ATT_DOT_HR: Record<string, string> = { present:'bg-emerald-500', absent:'bg-red-500', late:'bg-amber-400', on_leave:'bg-blue-400', medical:'bg-purple-400' }

function AttendanceTab({ staffId }: { staffId: string }) {
  const now = new Date()
  const [year, setYear]   = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  const { data: attendance = [] } = useQuery({ queryKey: ['staff-attendance', staffId], queryFn: () => hrService.getStaffAttendance(staffId), enabled: !!staffId })

  const attMap = useMemo(() => {
    const m: Record<string, any> = {}
    for (const r of attendance as any[]) {
      const d = new Date(r.date)
      m[`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`] = r
    }
    return m
  }, [attendance])

  const monthDays = getMonthDays(year, month)
  const firstDay  = new Date(year, month, 1).getDay()
  const monthLabel = new Date(year, month).toLocaleDateString('en', { month:'long', year:'numeric' })
  const prevMonth = () => { if (month===0){setYear(y=>y-1);setMonth(11)}else setMonth(m=>m-1) }
  const nextMonth = () => { if (month===11){setYear(y=>y+1);setMonth(0)}else setMonth(m=>m+1) }
  const monthRecs = (attendance as any[]).filter(r => { const d=new Date(r.date); return d.getFullYear()===year&&d.getMonth()===month })
  const counts = { present:0, absent:0, late:0, leave:0 }
  for (const r of monthRecs) { if(r.status==='present')counts.present++; else if(r.status==='absent')counts.absent++; else if(r.status==='late')counts.late++; else counts.leave++ }

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="col-span-2">
        <Card>
          <CardHeader title="Attendance Calendar" sub={monthLabel} actions={
            <div className="flex items-center gap-2">
              <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><ChevronUp size={14} className="rotate-[-90deg]"/></button>
              <span className="text-xs font-semibold text-slate-700 w-28 text-center">{monthLabel}</span>
              <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><ChevronUp size={14} className="rotate-90"/></button>
            </div>
          }/>
          <div className="p-4">
            <div className="grid grid-cols-7 gap-1 mb-1">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=><p key={d} className="text-center text-xs font-semibold text-slate-400 py-1">{d}</p>)}</div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({length:firstDay}).map((_,i)=><div key={`e${i}`}/>)}
              {monthDays.map(day=>{
                const key=`${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`
                const rec=attMap[key]
                const dotBg=rec?(ATT_DOT_HR[rec.status]??'bg-slate-200'):'bg-slate-50 border border-slate-100'
                return <div key={key} className={`${dotBg} rounded-lg h-10 flex flex-col items-center justify-center`}><span className={`text-xs font-semibold ${rec?'text-white':'text-slate-400'}`}>{day.getDate()}</span></div>
              })}
            </div>
          </div>
        </Card>
      </div>
      <div className="space-y-3">
        {[['Present',counts.present,'#059669'],['Absent',counts.absent,'#dc2626'],['Late',counts.late,'#d97706'],['On Leave',counts.leave,'#2563eb']].map(([l,v,c])=>(
          <div key={l as string} className="bg-white rounded-xl border border-slate-100 shadow-sm p-3 text-center">
            <p className="text-2xl font-bold" style={{color:c as string}}>{v as number}</p>
            <p className="text-xs text-slate-400">{l as string}</p>
          </div>
        ))}
        {(attendance as any[]).length === 0 && <p className="text-xs text-center text-slate-400 pt-4">No attendance records available</p>}
      </div>
    </div>
  )
}

// ─── LEAVE TAB ────────────────────────────────────────────────────────────────
function LeaveTab({ staffId }: { staffId: string }) {
  const { data: leave = [] } = useQuery({ queryKey: ['staff-leave', staffId], queryFn: () => hrService.getStaffLeave(staffId), enabled: !!staffId })
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
        Leave balance entitlements are managed in HR settings. Balances will appear here once configured.
      </div>
      <Card>
        <CardHeader title="Leave History" sub={`${(leave as any[]).length} applications`}/>
        {(leave as any[]).length === 0 ? <div className="px-5 py-10 text-center text-sm text-slate-400">No leave history available</div> : (
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="bg-slate-50 border-b border-slate-100">{['Type','From','To','Days','Status','Approved By'].map(h=><th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase">{h}</th>)}</tr></thead>
            <tbody>{(leave as any[]).map((l:any,i:number)=><tr key={i} className="border-b border-slate-50"><td className="px-4 py-3">{l.leaveType}</td><td className="px-4 py-3 text-slate-500">{fmt(l.fromDate)}</td><td className="px-4 py-3 text-slate-500">{fmt(l.toDate)}</td><td className="px-4 py-3">{l.days}</td><td className="px-4 py-3"><Badge v={statusBV(l.status)}>{l.status}</Badge></td><td className="px-4 py-3 text-slate-500">{l.approvedBy?.profile?.firstName ? `${l.approvedBy.profile.firstName} ${l.approvedBy.profile.lastName||''}`.trim() : '—'}</td></tr>)}</tbody>
          </table></div>
        )}
      </Card>
    </div>
  )
}

// ─── PAYROLL TAB ──────────────────────────────────────────────────────────────
function PayrollTab({ staff, staffId }: { staff: any; staffId: string }) {
  const qc = useQueryClient()
  const { data: payslips = [] } = useQuery({ queryKey: ['staff-payslips', staffId], queryFn: () => hrService.getStaffPayslips(staffId), enabled: !!staffId })
  const { data: components = [] } = useQuery({ queryKey: ['salary-components'], queryFn: hrService.getSalaryComponents })
  const [editing, setEditing] = useState(false)
  const [lines, setLines] = useState<Record<string, string>>({})

  const compList = components as any[]
  const structure = staff?.salaryStructure || []
  const gross = structure.filter((l:any) => l.type === 'earning').reduce((s:number,l:any) => s + (l.amount||0), 0)

  const saveMut = useMutation({
    mutationFn: () => hrService.setStaffSalaryStructure(staffId, compList.filter(c => c.isActive).map(c => ({ componentId: c._id, amount: Number(lines[c._id]) || 0 }))),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['staff-member', staffId] }); toast.success('Salary structure updated'); setEditing(false) },
    onError: (err:any) => toast.error(err.response?.data?.message || 'Failed to update salary structure'),
  })

  function openEditor() {
    const initial: Record<string, string> = {}
    for (const c of compList) {
      const existing = structure.find((l:any) => l.componentId === c._id || l.code === c.code)
      initial[c._id] = existing ? String(existing.amount) : (c.calculationType === 'fixed' ? String(c.defaultAmount || 0) : '')
    }
    setLines(initial)
    setEditing(true)
  }

  const basicId = compList.find(c => c.code === 'BASIC')?._id
  const basicAmount = Number(lines[basicId || ''] || 0)

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title="Current Salary Structure" sub="Configured per employee from this school's Salary Components" actions={<button onClick={openEditor} className="px-3 py-1.5 text-xs bg-[#0C447C] text-white rounded-lg hover:bg-[#0b3d6e] font-medium">{structure.length ? 'Edit' : '+ Configure'}</button>}/>
        <div className="p-5">
          <div className="text-center mb-5">
            <p className="text-3xl font-black text-[#0C447C]">{gross ? `${staff?.salaryCurrency || 'PKR'} ${gross.toLocaleString()}` : '— Not configured'}</p>
            <p className="text-sm text-slate-400 mt-1">Gross Monthly Salary</p>
          </div>
          {structure.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {structure.map((l:any) => (
                <div key={l.code} className={`rounded-xl p-3 text-center border ${l.type === 'earning' ? 'bg-emerald-50/50 border-emerald-100' : 'bg-red-50/50 border-red-100'}`}>
                  <p className="text-lg font-bold text-slate-800">{(l.amount||0).toLocaleString()}</p>
                  <p className="text-xs text-slate-400">{l.name}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
      <Card>
        <CardHeader title="Payslip History" sub={`${(payslips as any[]).length} payslips`}/>
        {(payslips as any[]).length === 0 ? <div className="px-5 py-10 text-center text-sm text-slate-400">No payslips available</div> : (
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="bg-slate-50 border-b border-slate-100">{['Month','Gross','Deductions','Net Pay','Status',''].map(h=><th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase">{h}</th>)}</tr></thead>
            <tbody>{(payslips as any[]).map((p:any,i:number)=><tr key={i} className="border-b border-slate-50"><td className="px-4 py-3">{p.periodLabel || `${p.month}/${p.year}`}</td><td className="px-4 py-3">{p.grossSalary?.toLocaleString()}</td><td className="px-4 py-3 text-red-500">{p.totalDeductions?.toLocaleString()}</td><td className="px-4 py-3 font-semibold text-emerald-600">{p.netSalary?.toLocaleString()}</td><td className="px-4 py-3"><Badge v={statusBV(p.status)}>{p.status}</Badge></td><td className="px-4 py-3"><button onClick={()=>hrService.downloadPayslipPdf(p._id, `payslip-${p.periodLabel||p.month}.pdf`)} className="flex items-center gap-1 text-xs text-[#0C447C] hover:underline"><Download size={12}/>PDF</button></td></tr>)}</tbody>
          </table></div>
        )}
      </Card>

      {editing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="font-bold text-slate-900">Salary Structure — {staff?.firstName} {staff?.lastName}</div>
              <button onClick={() => setEditing(false)} className="p-1.5 text-slate-400 hover:text-slate-700"><X size={18}/></button>
            </div>
            <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
              {compList.filter(c => c.isActive).map(c => (
                <div key={c._id} className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{c.name}</p>
                    <p className="text-[11px] text-slate-400">{c.type === 'earning' ? 'Earning' : 'Deduction'}{c.calculationType === 'percentage_of_basic' ? ` · ${c.percentageValue}% of Basic (auto)` : ''}</p>
                  </div>
                  {c.calculationType === 'percentage_of_basic' ? (
                    <div className="w-32 text-right text-sm font-semibold text-slate-500">{Math.round(basicAmount * ((c.percentageValue||0)/100)).toLocaleString()}</div>
                  ) : (
                    <input type="number" value={lines[c._id] ?? ''} onChange={e => setLines(p => ({ ...p, [c._id]: e.target.value }))}
                      className="w-32 px-3 py-1.5 text-sm border border-slate-200 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-[#0C447C]" />
                  )}
                </div>
              ))}
              {compList.length === 0 && <p className="text-sm text-slate-400 text-center py-4">No salary components configured for this school yet — set these up from Payroll → Salary Components first.</p>}
            </div>
            <div className="p-5 border-t border-slate-100 flex justify-end gap-2">
              <button onClick={() => setEditing(false)} className="px-4 py-2 text-sm border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-medium">Cancel</button>
              <button onClick={() => saveMut.mutate()} className="px-4 py-2 text-sm bg-[#0C447C] text-white rounded-lg hover:bg-[#0b3d6e] font-medium disabled:opacity-50" disabled={saveMut.isPending}>{saveMut.isPending ? 'Saving…' : 'Save Structure'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── DOCUMENTS TAB ────────────────────────────────────────────────────────────
function DocumentsTab({ staffId }: { staffId: string }) {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pendingLabel = useRef<string>('')
  const { data: documents = [] } = useQuery({ queryKey: ['staff-documents', staffId], queryFn: () => hrService.getStaffDocuments(staffId), enabled: !!staffId })
  const DOC_TYPES = ['National ID / CNIC','Passport Copy','Degree Certificate','Teaching License','Experience Letter','Medical Certificate','Police Clearance','Contract Copy']

  const uploadMutation = useMutation({
    mutationFn: ({ file, label }: { file: File; label: string }) => hrService.uploadStaffDocument(staffId, file, label),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['staff-documents', staffId] }); toast.success('Document uploaded') },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to upload document'),
  })

  const triggerUpload = (label: string) => {
    pendingLabel.current = label
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadMutation.mutate({ file, label: pendingLabel.current || file.name })
    e.target.value = ''
  }

  return (
    <div className="space-y-4">
      <input ref={fileInputRef} type="file" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt" className="hidden" onChange={handleFileChange} />
      <div className="flex items-center justify-between">
        <div><h2 className="text-base font-bold text-slate-800">Staff Documents</h2><p className="text-xs text-slate-400">{(documents as any[]).length} documents on file</p></div>
        <button onClick={() => triggerUpload('')} disabled={uploadMutation.isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#0C447C] text-white rounded-lg hover:bg-[#0b3d6e] font-medium disabled:opacity-60">
          {uploadMutation.isPending ? <Loader2 size={13} className="animate-spin"/> : <Plus size={13}/>}Upload Document
        </button>
      </div>
      {(documents as any[]).length === 0 ? (
        <div className="grid grid-cols-2 gap-4">
          {DOC_TYPES.map(d=>(
            <button key={d} onClick={() => triggerUpload(d)} disabled={uploadMutation.isPending}
              className="border-2 border-dashed border-slate-200 rounded-xl p-4 flex items-center gap-3 text-left hover:border-[#0C447C] hover:bg-slate-50 transition-colors disabled:opacity-60">
              <FileText size={20} className="text-slate-300 shrink-0"/>
              <div><p className="text-sm font-semibold text-slate-600">{d}</p><p className="text-xs text-slate-400">Not uploaded</p></div>
            </button>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {(documents as any[]).map((doc:any)=>(
            <Card key={doc._id ?? doc.key}>
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <FileText size={20} className="text-[#0C447C]"/>
                  {doc.verified && <Badge v="green"><Check size={10}/>Verified</Badge>}
                </div>
                <p className="font-semibold text-sm text-slate-800 truncate">{doc.label}</p>
                <p className="text-xs text-slate-400 mt-1">{fmt(doc.uploadedAt)}</p>
                <a href={doc.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 mt-3 text-xs text-[#0C447C] hover:underline">
                  <Download size={11}/>Download
                </a>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── NOTES TAB ────────────────────────────────────────────────────────────────
const NOTE_CAT_BV_HR: Record<string, BV> = { performance:'blue', disciplinary:'red', commendation:'green', training:'purple', general:'gray' }
const NOTE_DOT_HR: Record<string, string> = { performance:'bg-blue-500', disciplinary:'bg-red-500', commendation:'bg-emerald-500', training:'bg-purple-500', general:'bg-slate-400' }

function NotesTab({ notes, staffId }: { notes: any[]; staffId: string }) {
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter] = useState('all')
  const [nf, setNF] = useState({ category:'general', title:'', content:'', visibility:'all_staff' })

  const createMutation = useMutation({
    mutationFn: (payload: any) => hrService.createStaffNote(staffId, payload),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['staff-notes', staffId] }); toast.success('Note added'); setShowModal(false) },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed'),
  })

  const cats = ['all','performance','disciplinary','commendation','training','general']
  const filtered = filter === 'all' ? notes : notes.filter(n => n.category === filter)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h2 className="text-base font-bold text-slate-800">Staff Notes</h2><p className="text-xs text-slate-400">{notes.length} notes</p></div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#0C447C] text-white rounded-lg hover:bg-[#0b3d6e] font-medium"><Plus size={13}/>Add Note</button>
      </div>
      <div className="flex gap-1 flex-wrap">
        {cats.map(c=>(
          <button key={c} onClick={()=>setFilter(c)} className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${filter===c?'bg-[#0C447C] text-white':'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{c}</button>
        ))}
      </div>
      {filtered.length === 0 ? <Card><div className="px-5 py-12 text-center text-sm text-slate-400">No notes yet.</div></Card> : (
        <div className="relative">
          <div className="absolute left-[19px] top-0 bottom-0 w-px bg-slate-100"/>
          <div className="space-y-4">
            {filtered.map((note: any) => (
              <div key={note._id} className="flex gap-4 relative">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 ${NOTE_DOT_HR[note.category]??'bg-slate-400'} shadow-sm`}>
                  <MessageSquare size={15} className="text-white"/>
                </div>
                <Card className="flex-1">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge v={NOTE_CAT_BV_HR[note.category] ?? 'gray'}>{note.category || 'general'}</Badge>
                        <span className="text-xs text-slate-400">{note.visibility?.replace(/_/g,' ')}</span>
                      </div>
                      <span className="text-xs text-slate-400">{fmt(note.createdAt)}</span>
                    </div>
                    {note.title && <p className="font-semibold text-sm text-slate-800 mb-1">{note.title}</p>}
                    <p className="text-sm text-slate-600 leading-relaxed">{note.content}</p>
                    <p className="text-xs text-slate-400 mt-2">— {note.createdByName || 'HR Staff'}</p>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center overflow-y-auto py-16 px-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800 text-sm">Add Note</h2>
              <button onClick={()=>setShowModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"><X size={18}/></button>
            </div>
            <div className="p-5 space-y-3">
              <div><label className="block text-xs font-semibold text-slate-600 mb-1">Category</label>
                <select value={nf.category} onChange={e=>setNF(p=>({...p,category:e.target.value}))} className={IC}>
                  {['performance','disciplinary','commendation','training','general'].map(c=><option key={c}>{c}</option>)}
                </select></div>
              <div><label className="block text-xs font-semibold text-slate-600 mb-1">Title (optional)</label>
                <input value={nf.title} onChange={e=>setNF(p=>({...p,title:e.target.value}))} className={IC} placeholder="Brief title"/></div>
              <div><label className="block text-xs font-semibold text-slate-600 mb-1">Content <span className="text-red-500">*</span></label>
                <textarea rows={4} value={nf.content} onChange={e=>setNF(p=>({...p,content:e.target.value}))} className={`${IC} resize-none`} placeholder="Note content…"/></div>
            </div>
            <div className="px-5 pb-5 flex gap-2">
              <button onClick={()=>setShowModal(false)} className="flex-1 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 font-medium">Cancel</button>
              <button onClick={()=>{ if(!nf.content.trim()){toast.error('Content required');return}; createMutation.mutate(nf) }}
                disabled={createMutation.isPending} className="flex-1 py-2 text-sm bg-[#0C447C] text-white rounded-lg hover:bg-[#0b3d6e] font-medium disabled:opacity-50">
                {createMutation.isPending ? 'Saving…' : 'Add Note'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── TABS CONFIG ──────────────────────────────────────────────────────────────
const STAFF_TABS: { id: StaffTab; label: string; icon: LucideIcon }[] = [
  { id:'overview',       label:'Overview',       icon:LayoutDashboard },
  { id:'personal',       label:'Personal',       icon:User            },
  { id:'employment',     label:'Employment',     icon:Briefcase       },
  { id:'teaching',       label:'Teaching',       icon:GraduationCap   },
  { id:'qualifications', label:'Qualifications', icon:Award           },
  { id:'attendance',     label:'Attendance',     icon:CalendarDays    },
  { id:'leave',          label:'Leave',          icon:BookOpen        },
  { id:'payroll',        label:'Payroll',        icon:CreditCard      },
  { id:'documents',      label:'Documents',      icon:FileText        },
  { id:'notes',          label:'Notes',          icon:MessageSquare   },
]

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function StaffProfile() {
  const { id }   = useParams<{ id: string }>()
  const navigate = useNavigate()
  const staffId  = id ?? ''
  const [tab, setTab] = useState<StaffTab>('overview')
  const [showEdit, setShowEdit] = useState(false)

  const { data: staff, isLoading } = useQuery({
    queryKey: ['staff-member', staffId],
    queryFn:  () => hrService.getStaffById(staffId),
    enabled:  !!staffId,
  })
  const { data: notes = [] }     = useQuery({ queryKey: ['staff-notes', staffId], queryFn: () => hrService.getStaffNotes(staffId), enabled: !!staffId })

  if (!staffId) return (
    <div className="p-12 text-center text-slate-500">
      <p className="text-lg font-semibold mb-2">Invalid staff URL</p>
      <button onClick={()=>navigate('/hr')} className="flex items-center gap-1.5 px-4 py-2 text-sm bg-[#0C447C] text-white rounded-lg hover:bg-[#0b3d6e] font-medium mx-auto">
        <ArrowLeft size={14}/>Back to HR
      </button>
    </div>
  )

  if (isLoading) return (
    <div className="flex flex-col h-full">
      <div className="bg-[#0C447C] px-6 py-5">
        <div className="flex items-start gap-5">
          <Skeleton className="w-16 h-16 rounded-2xl" />
          <div className="flex-1 space-y-2"><Skeleton className="h-7 w-64 bg-white/20" /><Skeleton className="h-4 w-48 bg-white/10" /></div>
        </div>
      </div>
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-3 gap-4"><Skeleton className="col-span-2 h-48" /><Skeleton className="h-48" /></div>
      </div>
    </div>
  )

  if (!staff) return (
    <div className="p-12 text-center text-slate-500">
      <p className="text-lg font-semibold mb-2">Staff member not found</p>
      <button onClick={()=>navigate('/hr')} className="flex items-center gap-1.5 px-4 py-2 text-sm bg-[#0C447C] text-white rounded-lg hover:bg-[#0b3d6e] font-medium mx-auto">
        <ArrowLeft size={14}/>Back to HR
      </button>
    </div>
  )

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <ProfileHeader staff={staff} staffId={staffId} onBack={() => navigate('/hr')} onEdit={() => setShowEdit(true)} />
      {/* Tab bar */}
      <div className="bg-white border-b border-slate-100 px-6 shrink-0">
        <div className="flex gap-0 overflow-x-auto py-1">
          {STAFF_TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium whitespace-nowrap transition-all border-b-2 ${
                tab === t.id ? 'border-[#0C447C] text-[#0C447C]' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}>
              <t.icon size={13}/>{t.label}
            </button>
          ))}
        </div>
      </div>
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {tab === 'overview'       && <OverviewTab       staff={staff} notes={notes as any[]} />}
        {tab === 'personal'       && <PersonalTab       staff={staff} staffId={staffId} />}
        {tab === 'employment'     && <EmploymentTab     staff={staff} />}
        {tab === 'teaching'       && <TeachingTab       staff={staff} />}
        {tab === 'qualifications' && <QualificationsTab staff={staff} />}
        {tab === 'attendance'     && <AttendanceTab     staffId={staffId} />}
        {tab === 'leave'          && <LeaveTab          staffId={staffId} />}
        {tab === 'payroll'        && <PayrollTab        staff={staff} staffId={staffId} />}
        {tab === 'documents'      && <DocumentsTab      staffId={staffId} />}
        {tab === 'notes'          && <NotesTab          notes={notes as any[]} staffId={staffId} />}
      </div>
      {showEdit && <EditStaffModal staff={staff} staffId={staffId} onClose={() => setShowEdit(false)} />}
    </div>
  )
}
