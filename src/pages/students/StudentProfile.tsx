import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  ArrowLeft, Edit2, LayoutDashboard, Users, Heart, FileText,
  ClipboardList, BookOpen, CalendarDays, Activity, Plus, X,
  Download, CheckCircle, AlertTriangle, ChevronDown, ChevronUp,
  Phone, Mail, User, MapPin, Stethoscope, Award, Shield,
  GraduationCap, History, FileCheck,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import studentsService from '../../services/students.service'
import { useStudent360, useFeeStatement, useCollectFee, useStudentBehaviour, useCreateBehaviour, useAttendance } from '../../hooks/useStudents'

// ─── TYPES ────────────────────────────────────────────────────────────────────
type ProfileTab = 'overview' | 'personal' | 'academic' | 'guardians' | 'attendance' | 'fees' | 'behaviour' | 'health' | 'documents' | 'notes' | 'history'
type BV = 'green' | 'amber' | 'red' | 'blue' | 'purple' | 'gray' | 'navy'

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
const BADGE_CLS: Record<BV, string> = {
  green:  'bg-emerald-50 text-emerald-700 border-emerald-200',
  amber:  'bg-amber-50 text-amber-700 border-amber-200',
  red:    'bg-red-50 text-red-700 border-red-200',
  blue:   'bg-blue-50 text-blue-700 border-blue-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
  gray:   'bg-slate-100 text-slate-600 border-slate-200',
  navy:   'bg-[#0C447C] text-white border-[#0C447C]',
}
function Badge({ v, children }: { v: BV; children: React.ReactNode }) {
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-medium ${BADGE_CLS[v]}`}>{children}</span>
}
function statusBV(s: string): BV {
  const m: Record<string, BV> = {
    enrolled:'green', admitted:'blue', prospect:'gray', applied:'amber',
    alumni:'purple', withdrawn:'red', expelled:'red', transferred:'amber',
    present:'green', absent:'red', late:'amber', on_leave:'blue',
    half_day_am:'amber', half_day_pm:'amber', medical:'purple', holiday:'gray',
    pass:'green', fail:'red', distinction:'navy', merit:'blue', incomplete:'amber',
    promoted:'green', retained:'amber', graduated:'navy', transferred_out:'amber', withdrawn_hist:'red',
  }
  return m[s] ?? 'gray'
}
const INPUT_CLS = 'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]'
const RO_CLS    = 'w-full px-3 py-2 text-sm border border-slate-100 rounded-lg bg-slate-50 text-slate-500'
function FL({ label, required, children, span }: { label: string; required?: boolean; children: React.ReactNode; span?: boolean }) {
  return (
    <div className={span ? 'col-span-2' : ''}>
      <label className="block text-xs font-semibold text-slate-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}
function Modal({ title, children, onClose, wide = false }: { title: string; children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center overflow-y-auto py-12 px-4">
      <div className={`bg-white rounded-xl shadow-2xl w-full ${wide ? 'max-w-2xl' : 'max-w-md'} relative`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-xl">
          <h2 className="font-semibold text-slate-800 text-sm">{title}</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"><X size={18} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
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

// ─── DATE HELPERS ─────────────────────────────────────────────────────────────
function getMonthDays(year: number, month: number): Date[] {
  const days: Date[] = []
  const d = new Date(year, month, 1)
  while (d.getMonth() === month) { days.push(new Date(d)); d.setDate(d.getDate() + 1) }
  return days
}
function fmt(d?: string | Date): string {
  if (!d) return '—'
  try { return new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) }
  catch { return '—' }
}
function fullName(s: any): string {
  return [s?.personal?.firstName, s?.personal?.middleName, s?.personal?.lastName].filter(Boolean).join(' ') || 'Unknown Student'
}
function initials(s: any): string {
  const f = s?.personal?.firstName?.[0] ?? ''
  const l = s?.personal?.lastName?.[0] ?? ''
  return (f + l).toUpperCase() || 'ST'
}

// Maps the new flat student schema to the shape the existing UI components expect
function toProfile(s: any, s360?: any): any {
  if (!s) return null
  return {
    ...s,
    admissionNo: s.admissionNumber,
    personal: {
      firstName: s.firstName, lastName: s.lastName, middleName: s.middleName,
      gender: s.gender, dateOfBirth: s.dateOfBirth, nationality: s.nationality,
      bloodGroup: s.bloodGroup,
    },
    contact: { email: s.email, phone: s.phone },
    currentPlacement: {
      gradeLevelName: s.currentGrade,
      sectionName: s.currentSection,
      yearLabel: s.currentAcademicYear,
      rollNo: null,
    },
    admission: { admissionDate: s.admissionDate, admissionType: 'new' },
    stats: {
      attendancePct: s360?.attendance?.percentage ?? 0,
      totalAbsenceDays: s360?.attendance?.summary?.absent ?? 0,
      currentGpa: '—',
    },
    flags: { isSEN: !!s.specialNeeds },
    guardians: [],
    tags: [],
  }
}

// ─── PROFILE HEADER ───────────────────────────────────────────────────────────
function ProfileHeader({ student, onBack }: { student: any; onBack: () => void }) {
  const name = fullName(student)
  const ini  = initials(student)
  return (
    <div className="bg-white border-b border-slate-100 shadow-sm shrink-0">
      <div className="px-6 py-5">
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0C447C] to-[#1a5fa0] flex items-center justify-center text-white text-xl font-bold shrink-0 shadow-md">
            {ini}
          </div>
          {/* Info block */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-slate-800">{name}</h1>
              <Badge v="navy">{student.admissionNo}</Badge>
              <Badge v={statusBV(student.status)}>{student.status}</Badge>
              {student.flags?.isSEN        && <Badge v="red">SEN</Badge>}
              {student.flags?.isGifted     && <Badge v="amber">Gifted</Badge>}
              {student.flags?.isOnScholarship && <Badge v="purple">Scholarship</Badge>}
            </div>
            <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-500 flex-wrap">
              {student.currentPlacement?.rollNo && <span>Roll: <strong>{student.currentPlacement.rollNo}</strong></span>}
              {student.contact?.email  && <span className="flex items-center gap-1"><Mail size={11}/>{student.contact.email}</span>}
              {student.contact?.phone  && <span className="flex items-center gap-1"><Phone size={11}/>{student.contact.phone}</span>}
            </div>
            {/* Quick KPIs */}
            <div className="flex items-center gap-5 mt-3">
              <div>
                <p className="text-lg font-bold text-[#0C447C]">{student.stats?.attendancePct ?? 0}%</p>
                <p className="text-xs text-slate-400">Attendance</p>
              </div>
              <div className="w-px h-8 bg-slate-100" />
              <div>
                <p className="text-lg font-bold text-[#EF9F27]">{student.stats?.currentGpa ?? '—'}</p>
                <p className="text-xs text-slate-400">GPA</p>
              </div>
              <div className="w-px h-8 bg-slate-100" />
              <div>
                <p className="text-lg font-bold text-slate-700">{student.stats?.totalAbsenceDays ?? 0}</p>
                <p className="text-xs text-slate-400">Days Absent</p>
              </div>
            </div>
          </div>
          {/* Actions */}
          <div className="flex gap-2 shrink-0">
            <button onClick={onBack}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 font-medium">
              <ArrowLeft size={13} /> Back
            </button>
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#EF9F27] text-white rounded-lg hover:bg-[#d98e22] font-medium">
              <Edit2 size={13} /> Edit Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── OVERVIEW TAB ─────────────────────────────────────────────────────────────
function OverviewTab({ student, notes, attendance }: { student: any; notes: any[]; attendance: any[] }) {
  const last7 = useMemo(() => {
    const days: { date: string; label: string; status?: string }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const key = d.toISOString().split('T')[0]
      const rec = attendance.find(a => new Date(a.date).toISOString().split('T')[0] === key)
      days.push({ date: key, label: d.toLocaleDateString('en', { weekday:'short' }), status: rec?.status })
    }
    return days
  }, [attendance])

  const dotCls: Record<string, string> = {
    present:'bg-emerald-500', absent:'bg-red-500', late:'bg-amber-400',
    on_leave:'bg-blue-400', medical:'bg-purple-400', holiday:'bg-slate-300',
  }

  const guardians = (student.guardians ?? []) as any[]
  const recentNotes = notes.slice(0, 3)

  return (
    <div className="grid grid-cols-3 gap-4">
      {/* LEFT 2/3 */}
      <div className="col-span-2 space-y-4">
        {/* Personal summary */}
        <Card>
          <CardHeader title="Personal Information" />
          <div className="p-4">
            <InfoRow icon={User}      label="Full Name"    value={fullName(student)} />
            <InfoRow icon={CalendarDays} label="Date of Birth" value={fmt(student.personal?.dateOfBirth)} />
            <InfoRow icon={User}      label="Gender"       value={student.personal?.gender} />
            <InfoRow icon={MapPin}    label="Nationality"  value={student.personal?.nationality} />
            <InfoRow icon={Heart}     label="Blood Group"  value={student.personal?.bloodGroup} />
            <InfoRow icon={Phone}     label="Phone"        value={student.contact?.phone} />
            <InfoRow icon={Mail}      label="Email"        value={student.contact?.email} />
          </div>
        </Card>
        {/* Current placement */}
        <Card>
          <CardHeader title="Current Placement" />
          <div className="p-4">
            <InfoRow icon={GraduationCap} label="Academic Year"  value={student.currentPlacement?.yearLabel} />
            <InfoRow icon={BookOpen}      label="Grade Level"    value={student.currentPlacement?.gradeLevelName} />
            <InfoRow icon={Users}         label="Section"        value={student.currentPlacement?.sectionName} />
            <InfoRow icon={FileCheck}     label="Roll Number"    value={student.currentPlacement?.rollNo} />
            <InfoRow icon={CalendarDays}  label="Admission Date" value={fmt(student.admission?.admissionDate)} />
            <InfoRow icon={Activity}      label="Admission Type" value={student.admission?.admissionType} />
            {student.admission?.previousSchoolName && (
              <InfoRow icon={History} label="Previous School" value={student.admission.previousSchoolName} />
            )}
          </div>
        </Card>
        {/* 7-day attendance */}
        <Card>
          <CardHeader title="Last 7 Days Attendance" />
          <div className="p-4">
            <div className="flex gap-2">
              {last7.map(d => (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5">
                  <p className="text-xs text-slate-400 font-medium">{d.label}</p>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${d.status ? (dotCls[d.status] ?? 'bg-slate-200') : 'bg-slate-100'}`}>
                    {d.status === 'present' && <CheckCircle size={14} className="text-white" />}
                    {d.status === 'absent'  && <X size={14} className="text-white" />}
                    {d.status === 'late'    && <AlertTriangle size={12} className="text-white" />}
                    {!d.status && <span className="text-slate-300 text-xs">—</span>}
                  </div>
                  <p className="text-[10px] text-slate-400">{d.date.slice(8)}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-50">
              {[['bg-emerald-500','Present'],['bg-red-500','Absent'],['bg-amber-400','Late'],['bg-blue-400','On Leave']].map(([bg, label]) => (
                <div key={label} className="flex items-center gap-1.5 text-xs text-slate-500">
                  <div className={`w-2.5 h-2.5 rounded-full ${bg}`} />{label}
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* RIGHT 1/3 */}
      <div className="space-y-4">
        {/* Stats cards */}
        {[
          { label:'Attendance', value:`${student.stats?.attendancePct ?? 0}%`, color:'#059669', icon:Activity },
          { label:'Total Absences', value:String(student.stats?.totalAbsenceDays ?? 0), color:'#dc2626', icon:CalendarDays },
          { label:'GPA', value:String(student.stats?.currentGpa ?? '—'), color:'#EF9F27', icon:Award },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: s.color + '18' }}>
              <s.icon size={18} style={{ color: s.color }} />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-800">{s.value}</p>
              <p className="text-xs text-slate-400">{s.label}</p>
            </div>
          </div>
        ))}

        {/* Flags */}
        {(student.flags?.isSEN || student.flags?.isGifted || student.flags?.isOnScholarship || student.flags?.hasTransportService) && (
          <Card>
            <CardHeader title="Flags" />
            <div className="p-4 flex flex-wrap gap-2">
              {student.flags?.isSEN             && <Badge v="red">SEN</Badge>}
              {student.flags?.isGifted          && <Badge v="amber">Gifted & Talented</Badge>}
              {student.flags?.isOnScholarship   && <Badge v="purple">Scholarship</Badge>}
              {student.flags?.hasTransportService && <Badge v="blue">Transport</Badge>}
            </div>
          </Card>
        )}

        {/* Guardians preview */}
        {guardians.length > 0 && (
          <Card>
            <CardHeader title="Guardians" sub={`${guardians.length} linked`} />
            <div className="p-4 space-y-3">
              {guardians.slice(0, 2).map((g: any) => (
                <div key={g._id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#0C447C]/10 flex items-center justify-center text-[#0C447C] text-xs font-bold shrink-0">
                    {(g.firstName?.[0] ?? '') + (g.lastName?.[0] ?? '')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700 truncate">{g.firstName} {g.lastName}</p>
                    <p className="text-xs text-slate-400">{g.phone}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Recent notes */}
        {recentNotes.length > 0 && (
          <Card>
            <CardHeader title="Recent Notes" sub={`${notes.length} total`} />
            <div className="p-4 space-y-3">
              {recentNotes.map((n: any) => (
                <div key={n._id} className="border-b border-slate-50 last:border-0 pb-2 last:pb-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Badge v={statusBV(n.category)}>{n.category}</Badge>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2">{n.title || n.content}</p>
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
function PersonalTab({ student, studentId }: { student: any; studentId: string }) {
  const queryClient = useQueryClient()

  type F = {
    // Section 1 – Basic Identity
    firstName: string; middleName: string; lastName: string
    preferredName: string; arabicName: string
    dateOfBirth: string; placeOfBirth: string; gender: string
    nationality: string; secondNationality: string; religion: string; motherTongue: string
    // Section 2 – Identity Documents
    passportNo: string; nationalId: string; birthCertNo: string; visaNo: string
    bloodGroup: string; bloodGroupConfirmedOn: string
    // Section 3 – Contact
    studentPhone: string; studentEmail: string; whatsApp: string; altPhone: string
    // Section 4 – Address
    curStreet: string; curCity: string; curState: string; curCountry: string; curPostal: string
    sameAddress: boolean
    perStreet: string; perCity: string; perState: string; perCountry: string; perPostal: string
    // Section 6 – Flags & Services
    isSEN: boolean; senDetails: string; isGifted: boolean; isESL: boolean
    hasTransport: boolean; transportRoute: string; transportStop: string
    hasHostel: boolean; hasCafeteria: boolean; isSiblingOfStaff: boolean; isOnScholarship: boolean
    // Section 7 – Physical
    heightCm: string; weightKg: string; lastMeasuredOn: string
  }

  const EMPTY_F: F = {
    firstName:'', middleName:'', lastName:'', preferredName:'', arabicName:'',
    dateOfBirth:'', placeOfBirth:'', gender:'', nationality:'', secondNationality:'',
    religion:'', motherTongue:'',
    passportNo:'', nationalId:'', birthCertNo:'', visaNo:'', bloodGroup:'', bloodGroupConfirmedOn:'',
    studentPhone:'', studentEmail:'', whatsApp:'', altPhone:'',
    curStreet:'', curCity:'', curState:'', curCountry:'', curPostal:'',
    sameAddress:true,
    perStreet:'', perCity:'', perState:'', perCountry:'', perPostal:'',
    isSEN:false, senDetails:'', isGifted:false, isESL:false,
    hasTransport:false, transportRoute:'', transportStop:'',
    hasHostel:false, hasCafeteria:false, isSiblingOfStaff:false, isOnScholarship:false,
    heightCm:'', weightKg:'', lastMeasuredOn:'',
  }

  const [f, setF] = useState<F>(EMPTY_F)
  const ss = (k: keyof F, v: string)  => setF(p => ({ ...p, [k]: v } as F))
  const sb = (k: keyof F, v: boolean) => setF(p => ({ ...p, [k]: v } as F))

  // Populate from student data once it loads (or after save)
  const prevStudentRef = useRef({ id: '' })
  useEffect(() => {
    if (!student) return
    if (prevStudentRef.current.id === student._id) return   // already initialized for this student
    prevStudentRef.current.id = student._id
    const p   = student.personal   ?? {}
    const c   = student.contact    ?? {}
    const ca  = c.currentAddress   ?? {}
    const pa  = c.permanentAddress ?? {}
    const fl  = student.flags      ?? {}
    setF({
      firstName:      p.firstName          ?? '',
      middleName:     p.middleName         ?? '',
      lastName:       p.lastName           ?? '',
      preferredName:  p.preferredName      ?? '',
      arabicName:     p.arabicName         ?? '',
      dateOfBirth:    p.dateOfBirth ? new Date(p.dateOfBirth).toISOString().slice(0,10) : '',
      placeOfBirth:   p.placeOfBirth       ?? '',
      gender:         p.gender             ?? '',
      nationality:    p.nationality        ?? '',
      secondNationality: p.secondNationality ?? '',
      religion:       p.religion           ?? '',
      motherTongue:   p.motherTongue       ?? '',
      passportNo:     p.passportNo         ?? '',
      nationalId:     p.nationalId         ?? '',
      birthCertNo:    p.birthCertNo        ?? '',
      visaNo:         p.visaNo             ?? '',
      bloodGroup:     p.bloodGroup         ?? '',
      bloodGroupConfirmedOn: p.bloodGroupConfirmedOn
        ? new Date(p.bloodGroupConfirmedOn).toISOString().slice(0,10) : '',
      studentPhone:   c.phone              ?? '',
      studentEmail:   c.email              ?? '',
      whatsApp:       c.whatsapp           ?? p.whatsapp ?? '',
      altPhone:       c.altPhone           ?? '',
      curStreet:  ca.street  ?? '', curCity:  ca.city     ?? '',
      curState:   ca.state   ?? '', curCountry: ca.country ?? '', curPostal: ca.postalCode ?? '',
      sameAddress: !pa.street,
      perStreet:  pa.street  ?? '', perCity:  pa.city     ?? '',
      perState:   pa.state   ?? '', perCountry: pa.country ?? '', perPostal: pa.postalCode ?? '',
      isSEN:            !!fl.isSEN,
      senDetails:       fl.senDetails      ?? '',
      isGifted:         !!fl.isGifted,
      isESL:            !!fl.isESL,
      hasTransport:     !!fl.hasTransportService,
      transportRoute:   fl.transportRoute  ?? '',
      transportStop:    fl.transportStop   ?? '',
      hasHostel:        !!fl.hasHostelService,
      hasCafeteria:     !!fl.hasCafeteriaService,
      isSiblingOfStaff: !!fl.isSiblingOfStaff,
      isOnScholarship:  !!fl.isOnScholarship,
      heightCm:    String(p.heightCm  ?? ''),
      weightKg:    String(p.weightKg  ?? ''),
      lastMeasuredOn: p.lastMeasuredOn
        ? new Date(p.lastMeasuredOn).toISOString().slice(0,10) : '',
    })
  }, [student]) // eslint-disable-line react-hooks/exhaustive-deps

  const updateMutation = useMutation({
    mutationFn: (payload: any) => studentsService.updateStudent(studentId, payload),
    onSuccess: () => {
      prevStudentRef.current.id = ''    // allow re-init after invalidation
      queryClient.invalidateQueries({ queryKey: ['student', studentId] })
      toast.success('Profile updated')
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Update failed'),
  })

  const handleSave = () => {
    const permAddr = f.sameAddress
      ? { street: f.curStreet, city: f.curCity, state: f.curState, country: f.curCountry, postalCode: f.curPostal }
      : { street: f.perStreet, city: f.perCity, state: f.perState, country: f.perCountry, postalCode: f.perPostal }
    updateMutation.mutate({
      personal: {
        firstName: f.firstName, middleName: f.middleName || undefined, lastName: f.lastName,
        preferredName: f.preferredName || undefined, arabicName: f.arabicName || undefined,
        dateOfBirth: f.dateOfBirth || undefined, placeOfBirth: f.placeOfBirth || undefined,
        gender: f.gender || undefined, nationality: f.nationality || undefined,
        secondNationality: f.secondNationality || undefined, religion: f.religion || undefined,
        motherTongue: f.motherTongue || undefined, bloodGroup: f.bloodGroup || undefined,
        bloodGroupConfirmedOn: f.bloodGroupConfirmedOn || undefined,
        passportNo: f.passportNo || undefined, nationalId: f.nationalId || undefined,
        birthCertNo: f.birthCertNo || undefined, visaNo: f.visaNo || undefined,
        heightCm: f.heightCm ? Number(f.heightCm) : undefined,
        weightKg: f.weightKg ? Number(f.weightKg) : undefined,
        lastMeasuredOn: f.lastMeasuredOn || undefined,
      },
      contact: {
        phone: f.studentPhone || undefined,
        email: f.studentEmail || undefined,
        whatsapp: f.whatsApp || undefined,
        altPhone: f.altPhone || undefined,
        currentAddress:  { street: f.curStreet, city: f.curCity, state: f.curState, country: f.curCountry, postalCode: f.curPostal },
        permanentAddress: permAddr,
      },
      flags: {
        isSEN: f.isSEN, isGifted: f.isGifted, isESL: f.isESL,
        hasTransportService: f.hasTransport,
        hasHostelService: f.hasHostel,
        hasCafeteriaService: f.hasCafeteria,
        isSiblingOfStaff: f.isSiblingOfStaff,
        isOnScholarship: f.isOnScholarship,
        senDetails: f.senDetails || undefined,
        transportRoute: f.hasTransport ? (f.transportRoute || undefined) : undefined,
        transportStop:  f.hasTransport ? (f.transportStop  || undefined) : undefined,
      },
    })
  }

  // ── Section header helper ──────────────────────────────────────────────────
  const SH = ({ title }: { title: string }) => (
    <div className="flex items-center gap-3 px-5 py-3 bg-slate-50 border-y border-slate-100">
      <div className="w-1 h-5 rounded-full bg-[#EF9F27] shrink-0" />
      <h3 className="font-bold text-sm text-slate-700">{title}</h3>
    </div>
  )

  // ── Checkbox row helper ────────────────────────────────────────────────────
  const CB = ({ field, label }: { field: keyof F; label: string }) => (
    <label className="flex items-center gap-2 cursor-pointer py-1">
      <input type="checkbox" checked={f[field] as boolean}
        onChange={e => sb(field, e.target.checked)}
        className="w-4 h-4 accent-[#0C447C] shrink-0" />
      <span className="text-sm text-slate-700">{label}</span>
    </label>
  )

  return (
    <div className="space-y-4">
      {/* ── Main editable card ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader title="Personal Details" sub="Edit all sections below then click Save Changes"
          actions={
            <Btn variant="primary" onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
            </Btn>
          } />

        {/* SECTION 1 – Basic Identity */}
        <SH title="Basic Identity" />
        <div className="px-5 py-4 grid grid-cols-2 gap-4">
          <FL label="First Name" required>
            <input value={f.firstName} onChange={e=>ss('firstName',e.target.value)} className={INPUT_CLS} placeholder="First name" />
          </FL>
          <FL label="Middle Name">
            <input value={f.middleName} onChange={e=>ss('middleName',e.target.value)} className={INPUT_CLS} placeholder="Middle name" />
          </FL>
          <FL label="Last Name" required>
            <input value={f.lastName} onChange={e=>ss('lastName',e.target.value)} className={INPUT_CLS} placeholder="Last name" />
          </FL>
          <FL label="Preferred Name (used in class)">
            <input value={f.preferredName} onChange={e=>ss('preferredName',e.target.value)} className={INPUT_CLS} placeholder="Nickname or preferred name" />
          </FL>
          <FL label="Arabic Name">
            <input value={f.arabicName} onChange={e=>ss('arabicName',e.target.value)} className={INPUT_CLS} placeholder="الاسم بالعربي" dir="rtl" />
          </FL>
          <FL label="Date of Birth" required>
            <input type="date" value={f.dateOfBirth} onChange={e=>ss('dateOfBirth',e.target.value)} className={INPUT_CLS} />
          </FL>
          <FL label="Place of Birth">
            <input value={f.placeOfBirth} onChange={e=>ss('placeOfBirth',e.target.value)} className={INPUT_CLS} placeholder="City, Country" />
          </FL>
          <FL label="Gender" required>
            <select value={f.gender} onChange={e=>ss('gender',e.target.value)} className={INPUT_CLS}>
              <option value="">Select gender</option>
              {['Male','Female','Other'].map(g=><option key={g}>{g}</option>)}
            </select>
          </FL>
          <FL label="Nationality">
            <input value={f.nationality} onChange={e=>ss('nationality',e.target.value)} className={INPUT_CLS} placeholder="e.g. British" />
          </FL>
          <FL label="Second Nationality">
            <input value={f.secondNationality} onChange={e=>ss('secondNationality',e.target.value)} className={INPUT_CLS} placeholder="Optional" />
          </FL>
          <FL label="Religion">
            <select value={f.religion} onChange={e=>ss('religion',e.target.value)} className={INPUT_CLS}>
              <option value="">Select</option>
              {['Islam','Christianity','Hinduism','Judaism','Buddhism','Other','Prefer not to say'].map(r=><option key={r}>{r}</option>)}
            </select>
          </FL>
          <FL label="Mother Tongue">
            <input value={f.motherTongue} onChange={e=>ss('motherTongue',e.target.value)} className={INPUT_CLS} placeholder="e.g. Arabic" />
          </FL>
        </div>

        {/* SECTION 2 – Identity Documents */}
        <SH title="Identity Documents" />
        <div className="px-5 py-4 grid grid-cols-2 gap-4">
          <FL label="Passport Number">
            <input value={f.passportNo} onChange={e=>ss('passportNo',e.target.value)} className={INPUT_CLS} placeholder="Passport no." />
          </FL>
          <FL label="National ID">
            <input value={f.nationalId} onChange={e=>ss('nationalId',e.target.value)} className={INPUT_CLS} placeholder="National ID no." />
          </FL>
          <FL label="Birth Certificate No">
            <input value={f.birthCertNo} onChange={e=>ss('birthCertNo',e.target.value)} className={INPUT_CLS} placeholder="Certificate no." />
          </FL>
          <FL label="Visa No">
            <input value={f.visaNo} onChange={e=>ss('visaNo',e.target.value)} className={INPUT_CLS} placeholder="Visa no. (if applicable)" />
          </FL>
          <FL label="Blood Group">
            <select value={f.bloodGroup} onChange={e=>ss('bloodGroup',e.target.value)} className={INPUT_CLS}>
              <option value="">Unknown</option>
              {['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(g=><option key={g}>{g}</option>)}
            </select>
          </FL>
          <FL label="Blood Group Confirmed On">
            <input type="date" value={f.bloodGroupConfirmedOn} onChange={e=>ss('bloodGroupConfirmedOn',e.target.value)} className={INPUT_CLS} />
          </FL>
        </div>

        {/* SECTION 3 – Contact Information */}
        <SH title="Contact Information" />
        <div className="px-5 py-4 grid grid-cols-2 gap-4">
          <FL label="Student Phone">
            <input value={f.studentPhone} onChange={e=>ss('studentPhone',e.target.value)} className={INPUT_CLS} placeholder="+1 000 000 0000" />
          </FL>
          <FL label="Student Email">
            <input type="email" value={f.studentEmail} onChange={e=>ss('studentEmail',e.target.value)} className={INPUT_CLS} placeholder="student@school.com" />
          </FL>
          <FL label="WhatsApp">
            <input value={f.whatsApp} onChange={e=>ss('whatsApp',e.target.value)} className={INPUT_CLS} placeholder="+1 000 000 0000" />
          </FL>
          <FL label="Alternate Phone">
            <input value={f.altPhone} onChange={e=>ss('altPhone',e.target.value)} className={INPUT_CLS} placeholder="+1 000 000 0000" />
          </FL>
        </div>

        {/* SECTION 4 – Current Address */}
        <SH title="Current Address" />
        <div className="px-5 py-4 grid grid-cols-2 gap-4">
          <FL label="Street Address" span>
            <input value={f.curStreet} onChange={e=>ss('curStreet',e.target.value)} className={INPUT_CLS} placeholder="Street address" />
          </FL>
          <FL label="City">
            <input value={f.curCity} onChange={e=>ss('curCity',e.target.value)} className={INPUT_CLS} placeholder="City" />
          </FL>
          <FL label="State / Province">
            <input value={f.curState} onChange={e=>ss('curState',e.target.value)} className={INPUT_CLS} placeholder="State" />
          </FL>
          <FL label="Country">
            <input value={f.curCountry} onChange={e=>ss('curCountry',e.target.value)} className={INPUT_CLS} placeholder="Country" />
          </FL>
          <FL label="Postal Code">
            <input value={f.curPostal} onChange={e=>ss('curPostal',e.target.value)} className={INPUT_CLS} placeholder="Postal code" />
          </FL>
          <div className="col-span-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={f.sameAddress} onChange={e=>sb('sameAddress',e.target.checked)} className="w-4 h-4 accent-[#0C447C]" />
              <span className="text-sm font-medium text-slate-700">Permanent address same as current address</span>
            </label>
          </div>
        </div>
        {!f.sameAddress && (
          <>
            <SH title="Permanent Address" />
            <div className="px-5 py-4 grid grid-cols-2 gap-4">
              <FL label="Street Address" span>
                <input value={f.perStreet} onChange={e=>ss('perStreet',e.target.value)} className={INPUT_CLS} placeholder="Street address" />
              </FL>
              <FL label="City">
                <input value={f.perCity} onChange={e=>ss('perCity',e.target.value)} className={INPUT_CLS} placeholder="City" />
              </FL>
              <FL label="State / Province">
                <input value={f.perState} onChange={e=>ss('perState',e.target.value)} className={INPUT_CLS} placeholder="State" />
              </FL>
              <FL label="Country">
                <input value={f.perCountry} onChange={e=>ss('perCountry',e.target.value)} className={INPUT_CLS} placeholder="Country" />
              </FL>
              <FL label="Postal Code">
                <input value={f.perPostal} onChange={e=>ss('perPostal',e.target.value)} className={INPUT_CLS} placeholder="Postal code" />
              </FL>
            </div>
          </>
        )}

        {/* SECTION 6 – Flags & Services */}
        <SH title="Flags & Services" />
        <div className="px-5 py-4 grid grid-cols-2 gap-x-8 gap-y-1">
          <div>
            <CB field="isSEN" label="Special Educational Needs (SEN)" />
            {f.isSEN && (
              <textarea rows={2} value={f.senDetails} onChange={e=>ss('senDetails',e.target.value)}
                className={`${INPUT_CLS} resize-none mt-2`} placeholder="SEN details and accommodations required…" />
            )}
          </div>
          <CB field="isGifted"        label="Gifted Student" />
          <CB field="isESL"           label="English as Second Language (ESL)" />
          <CB field="isOnScholarship" label="On Scholarship" />
          <CB field="isSiblingOfStaff" label="Staff Ward (staff child)" />
          <CB field="hasCafeteria"    label="Cafeteria Service" />
          <CB field="hasHostel"       label="Hostel Service" />
          <div>
            <CB field="hasTransport" label="Transport Service" />
            {f.hasTransport && (
              <div className="grid grid-cols-2 gap-3 mt-2">
                <FL label="Route">
                  <input value={f.transportRoute} onChange={e=>ss('transportRoute',e.target.value)} className={INPUT_CLS} placeholder="Route name" />
                </FL>
                <FL label="Stop">
                  <input value={f.transportStop} onChange={e=>ss('transportStop',e.target.value)} className={INPUT_CLS} placeholder="Stop name" />
                </FL>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 7 – Physical Details */}
        <SH title="Physical Details" />
        <div className="px-5 py-4 grid grid-cols-2 gap-4">
          <FL label="Height (cm)">
            <input type="number" value={f.heightCm} onChange={e=>ss('heightCm',e.target.value)} className={INPUT_CLS} placeholder="e.g. 145" />
          </FL>
          <FL label="Weight (kg)">
            <input type="number" value={f.weightKg} onChange={e=>ss('weightKg',e.target.value)} className={INPUT_CLS} placeholder="e.g. 42" />
          </FL>
          <FL label="Last Measured On">
            <input type="date" value={f.lastMeasuredOn} onChange={e=>ss('lastMeasuredOn',e.target.value)} className={INPUT_CLS} />
          </FL>
        </div>
      </Card>

      {/* ── Admission Details — read-only info cards ───────────────────────── */}
      <Card>
        <div className="flex items-center gap-3 px-5 py-3 bg-slate-50 border-b border-slate-100 rounded-t-xl">
          <div className="w-1 h-5 rounded-full bg-[#EF9F27] shrink-0" />
          <h3 className="font-bold text-sm text-slate-700">Admission Details</h3>
          <span className="text-xs text-slate-400 ml-1">— read only</span>
        </div>
        <div className="p-5 grid grid-cols-4 gap-3">
          {([
            ['Admission No',        student?.admissionNo],
            ['Status',             student?.status],
            ['Admission Date',     fmt(student?.admission?.admissionDate)],
            ['Admission Type',     student?.admission?.admissionType],
            ['Previous School',    student?.admission?.previousSchoolName],
            ['Previous Grade',     student?.admission?.previousGrade],
            ['Transfer Cert No',   student?.admission?.transferCertNo],
          ] as [string, string | undefined][]).map(([label, value]) => (
            value ? (
              <div key={label} className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                <p className="text-xs text-slate-400 mb-1">{label}</p>
                <p className="text-sm font-semibold text-slate-700 break-words">{value}</p>
              </div>
            ) : null
          ))}
        </div>
      </Card>
    </div>
  )
}

// ─── ACADEMIC TAB ─────────────────────────────────────────────────────────────
function AcademicTab({ student }: { student: any }) {
  const cp = student?.currentPlacement ?? {}
  const stats = student?.stats ?? {}
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title="Current Enrollment" />
        <div className="p-5 grid grid-cols-2 gap-4">
          <FL label="Grade Level"><input value={cp.gradeLevelName ?? '—'} readOnly className={RO_CLS} /></FL>
          <FL label="Section"><input value={cp.sectionName ?? '—'} readOnly className={RO_CLS} /></FL>
          <FL label="Roll Number"><input value={cp.rollNo ?? '—'} readOnly className={RO_CLS} /></FL>
          <FL label="Academic Year"><input value={cp.yearLabel ?? '—'} readOnly className={RO_CLS} /></FL>
        </div>
      </Card>
      <div className="grid grid-cols-3 gap-4">
        {[
          { label:'Attendance %', value:`${stats.attendancePct ?? 0}%`, color:'#059669', icon:CalendarDays },
          { label:'Current GPA',  value:String(stats.currentGpa ?? '—'),  color:'#EF9F27', icon:Award },
          { label:'Total Absences', value:String(stats.totalAbsenceDays ?? 0), color:'#dc2626', icon:AlertTriangle },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: s.color + '18' }}>
              <s.icon size={20} style={{ color: s.color }} />
            </div>
            <p className="text-2xl font-bold text-slate-800">{s.value}</p>
            <p className="text-xs text-slate-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>
      <Card>
        <CardHeader title="Tags" sub="Labels applied to this student" />
        <div className="p-4 flex flex-wrap gap-2">
          {(student?.tags ?? []).length === 0
            ? <p className="text-xs text-slate-400">No tags assigned</p>
            : (student.tags as string[]).map((t: string) => <Badge key={t} v="gray">{t}</Badge>)}
        </div>
      </Card>
    </div>
  )
}

// ─── GUARDIANS TAB ────────────────────────────────────────────────────────────
function AddGuardianModal({ onClose, onSave, isPending }: { onClose: () => void; onSave: (d: any) => void; isPending: boolean }) {
  const [f, setF] = useState({ firstName:'', lastName:'', phone:'', email:'', occupation:'', employer:'' })
  const set = (k: keyof typeof f, v: string) => setF(p => ({ ...p, [k]: v }))
  const submit = () => {
    if (!f.firstName || !f.lastName || !f.phone) { toast.error('Name and phone required'); return }
    onSave({ firstName:f.firstName, lastName:f.lastName, phone:f.phone, email:f.email||undefined, occupation:f.occupation||undefined, employer:f.employer||undefined })
  }
  return (
    <Modal title="Add Guardian" onClose={onClose}>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <FL label="First Name" required><input value={f.firstName} onChange={e=>set('firstName',e.target.value)} className={INPUT_CLS} placeholder="First name" /></FL>
        <FL label="Last Name"  required><input value={f.lastName}  onChange={e=>set('lastName', e.target.value)} className={INPUT_CLS} placeholder="Last name"  /></FL>
        <FL label="Phone" required><input value={f.phone} onChange={e=>set('phone',e.target.value)} className={INPUT_CLS} placeholder="+1 000 000 0000" /></FL>
        <FL label="Email"><input type="email" value={f.email} onChange={e=>set('email',e.target.value)} className={INPUT_CLS} placeholder="guardian@email.com" /></FL>
        <FL label="Occupation"><input value={f.occupation} onChange={e=>set('occupation',e.target.value)} className={INPUT_CLS} placeholder="e.g. Engineer" /></FL>
        <FL label="Employer"><input value={f.employer} onChange={e=>set('employer',e.target.value)} className={INPUT_CLS} placeholder="Company name" /></FL>
      </div>
      <div className="flex gap-2">
        <button onClick={onClose} className="flex-1 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 font-medium">Cancel</button>
        <button onClick={submit} disabled={isPending} className="flex-1 py-2 text-sm bg-[#0C447C] text-white rounded-lg hover:bg-[#0b3d6e] font-medium disabled:opacity-50">
          {isPending ? 'Saving…' : 'Add Guardian'}
        </button>
      </div>
    </Modal>
  )
}

function GuardiansTab({ student, studentId }: { student: any; studentId: string }) {
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const guardians = (student?.guardians ?? []) as any[]

  const createMutation = useMutation({
    mutationFn: (payload: any) => studentsService.createGuardian({ ...payload, studentId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', studentId] })
      toast.success('Guardian added')
      setShowModal(false)
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed'),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-800">Guardians & Contacts</h2>
          <p className="text-xs text-slate-400">{guardians.length} guardian{guardians.length !== 1 ? 's' : ''} linked to this student</p>
        </div>
        <Btn variant="primary" onClick={() => setShowModal(true)}><Plus size={13} />Add Guardian</Btn>
      </div>
      {guardians.length === 0 ? (
        <Card><div className="px-5 py-12 text-center text-sm text-slate-400">No guardians linked. Add the first guardian above.</div></Card>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {guardians.map((g: any) => (
            <Card key={g._id}>
              <div className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-full bg-[#0C447C] flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {(g.firstName?.[0] ?? '') + (g.lastName?.[0] ?? '')}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{g.firstName} {g.lastName}</p>
                    {g.occupation && <p className="text-xs text-slate-400">{g.occupation}{g.employer ? ` · ${g.employer}` : ''}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  {g.phone && <div className="flex items-center gap-2 text-sm text-slate-600"><Phone size={13} className="text-slate-400 shrink-0" />{g.phone}</div>}
                  {g.email && <div className="flex items-center gap-2 text-sm text-slate-600"><Mail size={13} className="text-slate-400 shrink-0" />{g.email}</div>}
                  {g.address?.city && <div className="flex items-center gap-2 text-sm text-slate-600"><MapPin size={13} className="text-slate-400 shrink-0" />{[g.address.street, g.address.city, g.address.country].filter(Boolean).join(', ')}</div>}
                </div>
                <div className="mt-3 pt-3 border-t border-slate-50 flex items-center gap-2">
                  <Badge v="blue">{g.linkedStudentIds?.length ?? 0} {g.linkedStudentIds?.length === 1 ? 'child' : 'children'}</Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      {showModal && <AddGuardianModal onClose={() => setShowModal(false)} onSave={d => createMutation.mutate(d)} isPending={createMutation.isPending} />}
    </div>
  )
}

// ─── ATTENDANCE TAB ───────────────────────────────────────────────────────────
const ATT_DOT: Record<string, string> = {
  present:'bg-emerald-500', absent:'bg-red-500', late:'bg-amber-400',
  on_leave:'bg-blue-400', half_day_am:'bg-blue-300', half_day_pm:'bg-blue-300',
  medical:'bg-purple-400', holiday:'bg-slate-300',
}

function AttendanceTab({ studentId, allAtt = [] }: { studentId: string; allAtt?: any[] }) {
  const now = new Date()
  const [year, setYear]   = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  const attMap = useMemo(() => {
    const m: Record<string, any> = {}
    for (const r of allAtt as any[]) {
      const d = new Date(r.date)
      m[`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`] = r
    }
    return m
  }, [allAtt])

  const monthDays   = getMonthDays(year, month)
  const firstDay    = new Date(year, month, 1).getDay()
  const monthLabel  = new Date(year, month).toLocaleDateString('en', { month:'long', year:'numeric' })
  const prevMonth   = () => { if (month === 0) { setYear(y => y-1); setMonth(11) } else setMonth(m => m-1) }
  const nextMonth   = () => { if (month === 11) { setYear(y => y+1); setMonth(0)  } else setMonth(m => m+1) }

  const monthRecs = (allAtt as any[]).filter(r => {
    const d = new Date(r.date)
    return d.getFullYear() === year && d.getMonth() === month
  })
  const counts = { present:0, absent:0, late:0, leave:0 }
  for (const r of monthRecs) {
    if (r.status === 'present') counts.present++
    else if (r.status === 'absent') counts.absent++
    else if (r.status === 'late') counts.late++
    else counts.leave++
  }
  const absences = monthRecs.filter(r => r.status === 'absent' || r.status === 'late')

  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Calendar */}
      <div className="col-span-2">
        <Card>
          <CardHeader title="Attendance Calendar" sub={monthLabel}
            actions={
              <div className="flex items-center gap-2">
                <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><ChevronUp size={14} className="rotate-[-90deg]" /></button>
                <span className="text-xs font-semibold text-slate-700 w-28 text-center">{monthLabel}</span>
                <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><ChevronUp size={14} className="rotate-90" /></button>
              </div>
            } />
          <div className="p-4">
            <div className="grid grid-cols-7 gap-1 mb-1">
              {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                <p key={d} className="text-center text-xs font-semibold text-slate-400 py-1">{d}</p>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
              {monthDays.map(day => {
                const key = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`
                const rec = attMap[key]
                const dotBg = rec ? (ATT_DOT[rec.status] ?? 'bg-slate-200') : 'bg-slate-50 border border-slate-100'
                const textCls = rec ? 'text-white' : 'text-slate-400'
                return (
                  <div key={key} title={rec?.status ?? 'No record'}
                    className={`${dotBg} rounded-lg h-10 flex flex-col items-center justify-center cursor-default transition-opacity hover:opacity-80`}>
                    <span className={`text-xs font-semibold ${textCls}`}>{day.getDate()}</span>
                    {rec && <span className={`text-[9px] ${textCls} opacity-80`}>{rec.status.slice(0,3)}</span>}
                  </div>
                )
              })}
            </div>
            {/* Legend */}
            <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-slate-50">
              {[['bg-emerald-500','Present'],['bg-red-500','Absent'],['bg-amber-400','Late'],['bg-blue-400','Leave'],['bg-purple-400','Medical']].map(([bg,label]) => (
                <div key={label} className="flex items-center gap-1.5 text-xs text-slate-500">
                  <div className={`w-2.5 h-2.5 rounded-sm ${bg}`} />{label}
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Summary + absences */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {[
            { label:'Present', value:counts.present, color:'#059669', bg:'#05966918' },
            { label:'Absent',  value:counts.absent,  color:'#dc2626', bg:'#dc262618' },
            { label:'Late',    value:counts.late,    color:'#d97706', bg:'#d9770618' },
            { label:'On Leave',value:counts.leave,   color:'#2563eb', bg:'#2563eb18' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-3 text-center">
              <p className="text-2xl font-bold" style={{ color:s.color }}>{s.value}</p>
              <p className="text-xs text-slate-400">{s.label}</p>
            </div>
          ))}
        </div>
        <Card>
          <CardHeader title="Absences & Lates" sub={`${absences.length} records`} />
          <div className="divide-y divide-slate-50">
            {absences.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs text-slate-400">No absences this month</p>
            ) : absences.map((r: any) => (
              <div key={r._id} className="px-4 py-3">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-semibold text-slate-700">{fmt(r.date)}</span>
                  <Badge v={statusBV(r.status)}>{r.status.replace(/_/g,' ')}</Badge>
                </div>
                {r.absenceReason && <p className="text-xs text-slate-400">{r.absenceReason}</p>}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

// ─── HEALTH TAB ───────────────────────────────────────────────────────────────
function EditMedicalModal({ medical, onClose, onSave, isPending }: { medical: any; onClose: () => void; onSave: (d: any) => void; isPending: boolean }) {
  const [bloodGroup, setBloodGroup] = useState(medical?.bloodGroup ?? 'unknown')
  const [emergencyAction, setEmergencyAction] = useState(medical?.emergencyAction ?? '')
  const [notes, setNotes] = useState(medical?.notes ?? '')
  const [doctorName, setDoctorName] = useState(medical?.familyDoctor?.name ?? '')
  const [doctorPhone, setDoctorPhone] = useState(medical?.familyDoctor?.phone ?? '')
  const [doctorClinic, setDoctorClinic] = useState(medical?.familyDoctor?.clinic ?? '')
  const [allergiesText, setAllergiesText]   = useState((medical?.allergies ?? []).map((a: any) => a.name).join('\n'))
  const [conditionsText, setConditionsText] = useState((medical?.conditions ?? []).map((c: any) => c.name).join('\n'))
  const [medicationsText, setMedicationsText] = useState((medical?.medications ?? []).map((m: any) => m.name).join('\n'))

  const submit = () => {
    const allergies   = allergiesText.split('\n').filter(Boolean).map((name: string) => ({ name }))
    const conditions  = conditionsText.split('\n').filter(Boolean).map((name: string) => ({ name }))
    const medications = medicationsText.split('\n').filter(Boolean).map((name: string) => ({ name }))
    onSave({ bloodGroup, emergencyAction: emergencyAction||undefined, notes: notes||undefined,
      familyDoctor: doctorName ? { name:doctorName, phone:doctorPhone, clinic:doctorClinic } : undefined,
      allergies, conditions, medications })
  }

  return (
    <Modal title="Edit Medical Record" onClose={onClose} wide>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <FL label="Blood Group">
          <select value={bloodGroup} onChange={e=>setBloodGroup(e.target.value)} className={INPUT_CLS}>
            {['unknown','A+','A-','B+','B-','O+','O-','AB+','AB-'].map(g=><option key={g}>{g}</option>)}
          </select>
        </FL>
        <FL label="Family Doctor Name"><input value={doctorName} onChange={e=>setDoctorName(e.target.value)} className={INPUT_CLS} placeholder="Dr. Name" /></FL>
        <FL label="Doctor Phone"><input value={doctorPhone} onChange={e=>setDoctorPhone(e.target.value)} className={INPUT_CLS} placeholder="+1 000 000 0000" /></FL>
        <FL label="Clinic"><input value={doctorClinic} onChange={e=>setDoctorClinic(e.target.value)} className={INPUT_CLS} placeholder="Clinic / Hospital" /></FL>
        <FL label="Allergies (one per line)" span>
          <textarea rows={3} value={allergiesText} onChange={e=>setAllergiesText(e.target.value)} className={`${INPUT_CLS} resize-none`} placeholder="e.g. Peanuts&#10;Penicillin" />
        </FL>
        <FL label="Conditions (one per line)" span>
          <textarea rows={3} value={conditionsText} onChange={e=>setConditionsText(e.target.value)} className={`${INPUT_CLS} resize-none`} placeholder="e.g. Asthma&#10;Type 1 Diabetes" />
        </FL>
        <FL label="Medications (one per line)" span>
          <textarea rows={3} value={medicationsText} onChange={e=>setMedicationsText(e.target.value)} className={`${INPUT_CLS} resize-none`} placeholder="e.g. Ventolin 100mcg&#10;Metformin 500mg" />
        </FL>
        <FL label="Emergency Action" span>
          <textarea rows={3} value={emergencyAction} onChange={e=>setEmergencyAction(e.target.value)} className={`${INPUT_CLS} resize-none`} placeholder="Describe emergency protocol…" />
        </FL>
        <FL label="Notes" span>
          <textarea rows={2} value={notes} onChange={e=>setNotes(e.target.value)} className={`${INPUT_CLS} resize-none`} />
        </FL>
      </div>
      <div className="flex gap-2">
        <button onClick={onClose} className="flex-1 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 font-medium">Cancel</button>
        <button onClick={submit} disabled={isPending} className="flex-1 py-2 text-sm bg-[#0C447C] text-white rounded-lg hover:bg-[#0b3d6e] font-medium disabled:opacity-50">
          {isPending ? 'Saving…' : 'Save Medical Record'}
        </button>
      </div>
    </Modal>
  )
}

function HealthTab({ medical, studentId }: { medical: any; studentId: string }) {
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)

  const upsertMutation = useMutation({
    mutationFn: (payload: any) => studentsService.upsertMedicalRecord(studentId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-medical', studentId] })
      toast.success('Medical record updated')
      setShowModal(false)
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed'),
  })

  const allergySeverityBV = (s?: string): BV => (({ anaphylactic:'red', severe:'red', moderate:'amber', mild:'amber' })[s ?? ''] ?? 'gray') as BV

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-800">Health & Medical</h2>
          <p className="text-xs text-slate-400">Medical information, allergies and conditions</p>
        </div>
        <Btn variant="primary" onClick={() => setShowModal(true)}><Edit2 size={13} />Edit Medical Record</Btn>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Blood group prominent */}
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-5 text-white text-center shadow-md">
          <div className="text-4xl font-black mb-1">{medical?.bloodGroup ?? '?'}</div>
          <p className="text-red-100 text-sm font-medium">Blood Group</p>
        </div>
        {/* Emergency action */}
        <div className={`col-span-2 rounded-xl border-2 p-4 ${medical?.emergencyAction ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-slate-50'}`}>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-red-500" />
            <p className="font-semibold text-sm text-red-700">Emergency Action Plan</p>
          </div>
          <p className="text-sm text-red-600">{medical?.emergencyAction || 'No emergency action plan recorded.'}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Allergies */}
        <Card>
          <CardHeader title="Allergies" sub={`${(medical?.allergies ?? []).length} recorded`} />
          <div className="p-4">
            {(medical?.allergies ?? []).length === 0
              ? <p className="text-xs text-slate-400">No allergies recorded</p>
              : (medical.allergies as any[]).map((a: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{a.name}</p>
                    {a.reaction && <p className="text-xs text-slate-400">{a.reaction}</p>}
                  </div>
                  {a.severity && <Badge v={allergySeverityBV(a.severity)}>{a.severity}</Badge>}
                </div>
              ))}
          </div>
        </Card>
        {/* Conditions */}
        <Card>
          <CardHeader title="Medical Conditions" sub={`${(medical?.conditions ?? []).length} recorded`} />
          <div className="p-4">
            {(medical?.conditions ?? []).length === 0
              ? <p className="text-xs text-slate-400">No conditions recorded</p>
              : (medical.conditions as any[]).map((c: any, i: number) => (
                <div key={i} className="py-2 border-b border-slate-50 last:border-0">
                  <p className="text-sm font-semibold text-slate-800">{c.name}</p>
                  {c.severity && <Badge v={allergySeverityBV(c.severity)}>{c.severity}</Badge>}
                  {c.managementPlan && <p className="text-xs text-slate-500 mt-1">{c.managementPlan}</p>}
                </div>
              ))}
          </div>
        </Card>
        {/* Medications */}
        <Card>
          <CardHeader title="Current Medications" sub={`${(medical?.medications ?? []).length} active`} />
          <div className="p-4">
            {(medical?.medications ?? []).length === 0
              ? <p className="text-xs text-slate-400">No medications recorded</p>
              : (medical.medications as any[]).map((m: any, i: number) => (
                <div key={i} className="py-2 border-b border-slate-50 last:border-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-800">{m.name}</p>
                    {m.isActive && <Badge v="green">Active</Badge>}
                  </div>
                  {m.dosage && <p className="text-xs text-slate-500">{m.dosage} — {m.frequency}</p>}
                  {m.keptAt && <p className="text-xs text-slate-400">Kept at: {m.keptAt}</p>}
                </div>
              ))}
          </div>
        </Card>
        {/* Learning support */}
        <Card>
          <CardHeader title="Learning Support" />
          <div className="p-4">
            {!medical?.learningSupport ? (
              <p className="text-xs text-slate-400">No learning support data</p>
            ) : (
              <>
                <div className="flex flex-wrap gap-2 mb-3">
                  {medical.learningSupport.hasDyslexia && <Badge v="amber">Dyslexia</Badge>}
                  {medical.learningSupport.hasADHD     && <Badge v="amber">ADHD</Badge>}
                  {medical.learningSupport.hasASD      && <Badge v="blue">ASD</Badge>}
                  {medical.learningSupport.iepExists   && <Badge v="navy">IEP Exists</Badge>}
                </div>
                {(medical.learningSupport.accommodations ?? []).length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 mb-1">Accommodations</p>
                    <ul className="space-y-1">
                      {(medical.learningSupport.accommodations as string[]).map((a: string, i: number) => (
                        <li key={i} className="flex items-center gap-2 text-xs text-slate-600">
                          <CheckCircle size={11} className="text-emerald-500 shrink-0" />{a}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        </Card>
      </div>
      {/* Family doctor */}
      {medical?.familyDoctor?.name && (
        <Card>
          <CardHeader title="Family Doctor" />
          <div className="p-4">
            <InfoRow icon={Stethoscope} label="Doctor Name" value={medical.familyDoctor.name} />
            <InfoRow icon={Phone}       label="Phone"        value={medical.familyDoctor.phone} />
            <InfoRow icon={MapPin}      label="Clinic"       value={medical.familyDoctor.clinic} />
          </div>
        </Card>
      )}
      {showModal && <EditMedicalModal medical={medical} onClose={() => setShowModal(false)} onSave={d => upsertMutation.mutate(d)} isPending={upsertMutation.isPending} />}
    </div>
  )
}

// ─── DOCUMENTS TAB ────────────────────────────────────────────────────────────
const DOC_ICONS: Record<string, LucideIcon> = {
  birth_certificate: FileCheck, passport: Shield, national_id: User,
  report_card: GraduationCap, medical_report: Stethoscope, vaccination_card: Heart,
}

function AddDocumentModal({ onClose, onSave, isPending }: { onClose: () => void; onSave: (d: any) => void; isPending: boolean }) {
  const [f, setF] = useState({ type:'other', label:'', s3Key:'', mimeType:'', fileSizeKb:'' })
  const set = (k: keyof typeof f, v: string) => setF(p => ({ ...p, [k]: v }))
  const submit = () => {
    if (!f.label || !f.s3Key) { toast.error('Label and file key required'); return }
    onSave({ type:f.type, label:f.label, s3Key:f.s3Key, mimeType:f.mimeType||undefined, fileSizeKb:f.fileSizeKb ? Number(f.fileSizeKb) : undefined })
  }
  const docTypes = ['birth_certificate','passport','national_id','previous_school_report','transfer_certificate','medical_report','vaccination_card','report_card','id_card','other']
  return (
    <Modal title="Upload Document" onClose={onClose}>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <FL label="Document Type">
          <select value={f.type} onChange={e=>set('type',e.target.value)} className={INPUT_CLS}>
            {docTypes.map(t => <option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
          </select>
        </FL>
        <FL label="Label" required><input value={f.label} onChange={e=>set('label',e.target.value)} className={INPUT_CLS} placeholder="e.g. Birth Certificate 2024" /></FL>
        <FL label="File Key / URL" required span>
          <input value={f.s3Key} onChange={e=>set('s3Key',e.target.value)} className={INPUT_CLS} placeholder="s3://bucket/path or https://…" />
        </FL>
        <FL label="MIME Type"><input value={f.mimeType} onChange={e=>set('mimeType',e.target.value)} className={INPUT_CLS} placeholder="application/pdf" /></FL>
        <FL label="File Size (KB)"><input type="number" value={f.fileSizeKb} onChange={e=>set('fileSizeKb',e.target.value)} className={INPUT_CLS} placeholder="1024" /></FL>
      </div>
      <div className="flex gap-2">
        <button onClick={onClose} className="flex-1 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 font-medium">Cancel</button>
        <button onClick={submit} disabled={isPending} className="flex-1 py-2 text-sm bg-[#0C447C] text-white rounded-lg hover:bg-[#0b3d6e] font-medium disabled:opacity-50">
          {isPending ? 'Saving…' : 'Add Document'}
        </button>
      </div>
    </Modal>
  )
}

function DocumentsTab({ documents, studentId }: { documents: any[]; studentId: string }) {
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)

  const createMutation = useMutation({
    mutationFn: (payload: any) => studentsService.createStudentDocument(studentId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-docs', studentId] })
      toast.success('Document added')
      setShowModal(false)
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed'),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-800">Documents</h2>
          <p className="text-xs text-slate-400">{documents.length} document{documents.length !== 1 ? 's' : ''} on file</p>
        </div>
        <Btn variant="primary" onClick={() => setShowModal(true)}><Plus size={13} />Upload Document</Btn>
      </div>
      {documents.length === 0 ? (
        <Card><div className="px-5 py-12 text-center text-sm text-slate-400">No documents uploaded yet.</div></Card>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {documents.map((doc: any) => {
            const Icon = DOC_ICONS[doc.type] ?? FileText
            return (
              <Card key={doc._id}>
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-11 h-11 rounded-xl bg-[#0C447C]/8 flex items-center justify-center">
                      <Icon size={22} className="text-[#0C447C]" />
                    </div>
                    {doc.verified && <Badge v="green"><CheckCircle size={10} />Verified</Badge>}
                  </div>
                  <p className="font-semibold text-sm text-slate-800 mb-1 truncate">{doc.label}</p>
                  <Badge v="gray">{doc.type.replace(/_/g,' ')}</Badge>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-50">
                    <p className="text-xs text-slate-400 flex-1">{fmt(doc.createdAt)}</p>
                    {doc.fileSizeKb && <p className="text-xs text-slate-400">{doc.fileSizeKb} KB</p>}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <a href={doc.s3Key} target="_blank" rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 font-medium">
                      <Download size={11} />Download
                    </a>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
      {showModal && <AddDocumentModal onClose={() => setShowModal(false)} onSave={d => createMutation.mutate(d)} isPending={createMutation.isPending} />}
    </div>
  )
}

// ─── NOTES TAB ────────────────────────────────────────────────────────────────
const NOTE_CAT_BV: Record<string, BV> = {
  academic:'blue', pastoral:'purple', medical:'red', behavioural:'amber',
  positive:'green', counselling:'purple', safeguarding:'red', general:'gray',
}
const NOTE_DOT: Record<string, string> = {
  academic:'bg-blue-500', pastoral:'bg-purple-500', medical:'bg-red-500',
  behavioural:'bg-amber-500', positive:'bg-emerald-500', counselling:'bg-violet-500',
  safeguarding:'bg-red-600', general:'bg-slate-400',
}

function AddNoteModal({ onClose, onSave, isPending }: { onClose: () => void; onSave: (d: any) => void; isPending: boolean }) {
  const [f, setF] = useState({ category:'general', title:'', content:'', visibility:'all_staff', isFollowUpRequired:false, followUpDate:'' })
  const set = (k: keyof typeof f, v: string | boolean) => setF(p => ({ ...p, [k]: v }))
  const submit = () => {
    if (!f.content.trim()) { toast.error('Note content is required'); return }
    onSave({ category:f.category, title:f.title||undefined, content:f.content, visibility:f.visibility,
      isFollowUpRequired:f.isFollowUpRequired, followUpDate:f.followUpDate||undefined })
  }
  return (
    <Modal title="Add Note" onClose={onClose} wide>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <FL label="Category">
          <select value={f.category} onChange={e=>set('category',e.target.value)} className={INPUT_CLS}>
            {['academic','pastoral','medical','behavioural','positive','counselling','safeguarding','general'].map(c=><option key={c}>{c}</option>)}
          </select>
        </FL>
        <FL label="Visibility">
          <select value={f.visibility} onChange={e=>set('visibility',e.target.value)} className={INPUT_CLS}>
            {['all_staff','class_teacher_only','management_only','counsellor_only'].map(v=><option key={v} value={v}>{v.replace(/_/g,' ')}</option>)}
          </select>
        </FL>
        <FL label="Title" span><input value={f.title} onChange={e=>set('title',e.target.value)} className={INPUT_CLS} placeholder="Brief title (optional)" /></FL>
        <FL label="Content" required span>
          <textarea rows={4} value={f.content} onChange={e=>set('content',e.target.value)} className={`${INPUT_CLS} resize-none`} placeholder="Note content…" />
        </FL>
        <FL label="Follow-up Required">
          <div className="flex items-center gap-2 py-2">
            <input type="checkbox" id="followup" checked={f.isFollowUpRequired} onChange={e=>set('isFollowUpRequired',e.target.checked)} className="w-4 h-4 accent-[#0C447C]" />
            <label htmlFor="followup" className="text-sm text-slate-600">Requires follow-up</label>
          </div>
        </FL>
        {f.isFollowUpRequired && (
          <FL label="Follow-up Date"><input type="date" value={f.followUpDate} onChange={e=>set('followUpDate',e.target.value)} className={INPUT_CLS} /></FL>
        )}
      </div>
      <div className="flex gap-2">
        <button onClick={onClose} className="flex-1 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 font-medium">Cancel</button>
        <button onClick={submit} disabled={isPending} className="flex-1 py-2 text-sm bg-[#0C447C] text-white rounded-lg hover:bg-[#0b3d6e] font-medium disabled:opacity-50">
          {isPending ? 'Saving…' : 'Add Note'}
        </button>
      </div>
    </Modal>
  )
}

function NotesTab({ notes, studentId }: { notes: any[]; studentId: string }) {
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter] = useState('all')

  const createMutation = useMutation({
    mutationFn: (payload: any) => studentsService.createStudentNote(studentId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-notes', studentId] })
      toast.success('Note added')
      setShowModal(false)
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed'),
  })

  const cats = ['all', 'academic','pastoral','medical','behavioural','positive','counselling','safeguarding','general']
  const filtered = filter === 'all' ? notes : notes.filter(n => n.category === filter)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-800">Staff Notes</h2>
          <p className="text-xs text-slate-400">{notes.length} note{notes.length !== 1 ? 's' : ''} recorded</p>
        </div>
        <Btn variant="primary" onClick={() => setShowModal(true)}><Plus size={13} />Add Note</Btn>
      </div>
      {/* Category filter */}
      <div className="flex gap-1 flex-wrap">
        {cats.map(c => (
          <button key={c} onClick={() => setFilter(c)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${filter === c ? 'bg-[#0C447C] text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            {c}
          </button>
        ))}
      </div>
      {/* Timeline */}
      {filtered.length === 0 ? (
        <Card><div className="px-5 py-12 text-center text-sm text-slate-400">No notes in this category.</div></Card>
      ) : (
        <div className="relative">
          <div className="absolute left-[19px] top-0 bottom-0 w-px bg-slate-100" />
          <div className="space-y-4">
            {filtered.map((note: any) => (
              <div key={note._id} className="flex gap-4 relative">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 ${NOTE_DOT[note.category] ?? 'bg-slate-400'} shadow-sm`}>
                  <FileText size={15} className="text-white" />
                </div>
                <Card className="flex-1">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge v={NOTE_CAT_BV[note.category] ?? 'gray'}>{note.category}</Badge>
                        {note.isFollowUpRequired && <Badge v="amber">Follow-up needed</Badge>}
                        <span className="text-xs text-slate-400">{note.visibility?.replace(/_/g,' ')}</span>
                      </div>
                      <span className="text-xs text-slate-400">{fmt(note.createdAt)}</span>
                    </div>
                    {note.title && <p className="font-semibold text-sm text-slate-800 mb-1">{note.title}</p>}
                    <p className="text-sm text-slate-600 leading-relaxed">{note.content}</p>
                    <p className="text-xs text-slate-400 mt-2">— {note.createdByName || 'Staff'}</p>
                    {note.followUpDate && <p className="text-xs text-amber-600 mt-1">Follow-up: {fmt(note.followUpDate)}</p>}
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}
      {showModal && <AddNoteModal onClose={() => setShowModal(false)} onSave={d => createMutation.mutate(d)} isPending={createMutation.isPending} />}
    </div>
  )
}

// ─── HISTORY TAB ─────────────────────────────────────────────────────────────
function HistoryTab({ history, studentId }: { history: any[]; studentId: string }) {
  const queryClient = useQueryClient()
  const [expanded, setExpanded] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [f, setF] = useState({ yearLabel:'', gradeLevelName:'', sectionName:'', schoolName:'', finalResult:'pass', finalPercentage:'', finalGpa:'', finalGrade:'', classRank:'', teacherComment:'', promotionStatus:'promoted' })
  const set = (k: keyof typeof f, v: string) => setF(p => ({ ...p, [k]: v }))

  const createMutation = useMutation({
    mutationFn: (payload: any) => studentsService.createAcademicHistory(studentId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-history', studentId] })
      toast.success('Academic record added')
      setShowModal(false)
    },
    onError: () => toast.error('Failed to add record'),
  })

  const resultBV = (r?: string): BV => (({ pass:'green', fail:'red', distinction:'navy', merit:'blue', incomplete:'amber', withdrawn:'red', transferred:'amber' })[r ?? ''] ?? 'gray') as BV

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-800">Academic History</h2>
          <p className="text-xs text-slate-400">{history.length} year{history.length !== 1 ? 's' : ''} on record</p>
        </div>
        <Btn variant="primary" onClick={() => setShowModal(true)}><Plus size={13} />Add Record</Btn>
      </div>
      {history.length === 0 ? (
        <Card><div className="px-5 py-12 text-center text-sm text-slate-400">No academic history recorded yet.</div></Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['Year','Grade','School','Result','GPA','Attendance','Rank','Promotion',''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((row: any) => (
                  <>
                    <tr key={row._id} className="border-t border-slate-50 hover:bg-slate-50 cursor-pointer" onClick={() => setExpanded(expanded === row._id ? null : row._id)}>
                      <td className="px-4 py-3 text-xs font-mono font-semibold text-[#0C447C]">{row.yearLabel || '—'}</td>
                      <td className="px-4 py-3 text-xs text-slate-700">{row.gradeLevelName || '—'}</td>
                      <td className="px-4 py-3 text-xs text-slate-500 max-w-[140px] truncate">{row.schoolName || '—'}</td>
                      <td className="px-4 py-3">{row.finalResult ? <Badge v={resultBV(row.finalResult)}>{row.finalResult}</Badge> : '—'}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-[#EF9F27]">{row.finalGpa ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-slate-600">{row.attendance?.percentage != null ? `${row.attendance.percentage}%` : '—'}</td>
                      <td className="px-4 py-3 text-xs text-slate-600">{row.classRank ? `#${row.classRank}` : '—'}</td>
                      <td className="px-4 py-3">{row.promotionStatus ? <Badge v={statusBV(row.promotionStatus)}>{row.promotionStatus.replace(/_/g,' ')}</Badge> : '—'}</td>
                      <td className="px-4 py-3">
                        {expanded === row._id ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                      </td>
                    </tr>
                    {expanded === row._id && (
                      <tr key={`${row._id}-exp`} className="bg-slate-50">
                        <td colSpan={9} className="px-4 py-4">
                          {row.subjects?.length > 0 ? (
                            <div>
                              <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Subject Breakdown</p>
                              <div className="grid grid-cols-4 gap-2">
                                {(row.subjects as any[]).map((s: any, i: number) => (
                                  <div key={i} className="bg-white rounded-lg border border-slate-200 p-3">
                                    <p className="text-xs font-semibold text-slate-700 truncate">{s.subjectName}</p>
                                    <p className="text-xs text-slate-500 mt-1">{s.finalMark}/{s.maxMark} · {s.grade}</p>
                                    {s.percentage != null && (
                                      <div className="mt-1.5 h-1 bg-slate-100 rounded-full">
                                        <div className="h-full rounded-full bg-[#0C447C]" style={{ width:`${s.percentage}%` }} />
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400">No subject breakdown available</p>
                          )}
                          {row.teacherComment && (
                            <div className="mt-3 p-3 bg-white rounded-lg border border-slate-200">
                              <p className="text-xs font-semibold text-slate-500 mb-1">Teacher Comment</p>
                              <p className="text-sm text-slate-600 italic">"{row.teacherComment}"</p>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      {showModal && (
        <Modal title="Add Academic History Record" onClose={() => setShowModal(false)} wide>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <FL label="Year Label" required><input value={f.yearLabel} onChange={e=>set('yearLabel',e.target.value)} className={INPUT_CLS} placeholder="e.g. 2023-24" /></FL>
            <FL label="Grade Level"><input value={f.gradeLevelName} onChange={e=>set('gradeLevelName',e.target.value)} className={INPUT_CLS} placeholder="e.g. Grade 7" /></FL>
            <FL label="Section"><input value={f.sectionName} onChange={e=>set('sectionName',e.target.value)} className={INPUT_CLS} placeholder="e.g. 7-A" /></FL>
            <FL label="School Name"><input value={f.schoolName} onChange={e=>set('schoolName',e.target.value)} className={INPUT_CLS} placeholder="Previous school name" /></FL>
            <FL label="Final Result">
              <select value={f.finalResult} onChange={e=>set('finalResult',e.target.value)} className={INPUT_CLS}>
                {['pass','fail','distinction','merit','incomplete','withdrawn','transferred'].map(r=><option key={r}>{r}</option>)}
              </select>
            </FL>
            <FL label="Promotion Status">
              <select value={f.promotionStatus} onChange={e=>set('promotionStatus',e.target.value)} className={INPUT_CLS}>
                {['promoted','retained','graduated','transferred_out','withdrawn'].map(r=><option key={r} value={r}>{r.replace(/_/g,' ')}</option>)}
              </select>
            </FL>
            <FL label="Final % "><input type="number" value={f.finalPercentage} onChange={e=>set('finalPercentage',e.target.value)} className={INPUT_CLS} placeholder="e.g. 87.5" /></FL>
            <FL label="GPA"><input type="number" step="0.01" value={f.finalGpa} onChange={e=>set('finalGpa',e.target.value)} className={INPUT_CLS} placeholder="e.g. 3.8" /></FL>
            <FL label="Grade"><input value={f.finalGrade} onChange={e=>set('finalGrade',e.target.value)} className={INPUT_CLS} placeholder="e.g. A+" /></FL>
            <FL label="Class Rank"><input type="number" value={f.classRank} onChange={e=>set('classRank',e.target.value)} className={INPUT_CLS} placeholder="e.g. 5" /></FL>
            <FL label="Teacher Comment" span>
              <textarea rows={2} value={f.teacherComment} onChange={e=>set('teacherComment',e.target.value)} className={`${INPUT_CLS} resize-none`} />
            </FL>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowModal(false)} className="flex-1 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 font-medium">Cancel</button>
            <button onClick={() => createMutation.mutate({ yearLabel:f.yearLabel, gradeLevelName:f.gradeLevelName||undefined, sectionName:f.sectionName||undefined, schoolName:f.schoolName||undefined, finalResult:f.finalResult, promotionStatus:f.promotionStatus, finalPercentage:f.finalPercentage?Number(f.finalPercentage):undefined, finalGpa:f.finalGpa?Number(f.finalGpa):undefined, finalGrade:f.finalGrade||undefined, classRank:f.classRank?Number(f.classRank):undefined, teacherComment:f.teacherComment||undefined })} disabled={createMutation.isPending || !f.yearLabel} className="flex-1 py-2 text-sm bg-[#0C447C] text-white rounded-lg hover:bg-[#0b3d6e] font-medium disabled:opacity-50">
              {createMutation.isPending ? 'Saving…' : 'Add Record'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─── FEES TAB ─────────────────────────────────────────────────────────────────
function FeesTab({ studentId }: { studentId: string }) {
  const { data: feeData, isLoading } = useFeeStatement(studentId)
  const collectMutation = useCollectFee()
  const [collectingId, setCollectingId] = useState<string | null>(null)
  const [form, setForm] = useState({ paidAmount: '', paymentMethod: 'cash', receiptNumber: '', remarks: '' })

  const fees    = (feeData as any)?.fees    ?? []
  const summary = (feeData as any)?.summary ?? []

  const totalDue  = summary.reduce((a: number, s: any) => a + (s.totalAmount ?? 0), 0)
  const totalPaid = summary.reduce((a: number, s: any) => a + (s.totalPaid   ?? 0), 0)

  const doCollect = (feeId: string) => {
    if (!form.paidAmount) { toast.error('Enter payment amount'); return }
    collectMutation.mutate(
      { id: feeId, data: { paidAmount: Number(form.paidAmount), paymentMethod: form.paymentMethod, receiptNumber: form.receiptNumber || undefined, remarks: form.remarks || undefined } },
      {
        onSuccess: () => { toast.success('Payment collected'); setCollectingId(null); setForm({ paidAmount: '', paymentMethod: 'cash', receiptNumber: '', remarks: '' }) },
        onError: (err: any) => toast.error(err.response?.data?.message || 'Failed'),
      }
    )
  }

  const feeStatusBV = (s: string): BV => ({ paid: 'green', partial: 'amber', pending: 'red', overdue: 'red' }[s] ?? 'gray') as BV

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Due',  value: `₦${totalDue.toLocaleString()}`,  color: '#0C447C' },
          { label: 'Total Paid', value: `₦${totalPaid.toLocaleString()}`, color: '#059669' },
          { label: 'Balance',    value: `₦${(totalDue - totalPaid).toLocaleString()}`, color: '#dc2626' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-slate-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>
      <Card>
        <CardHeader title="Fee Ledger" sub={`${fees.length} records`} />
        {isLoading ? (
          <div className="p-8 text-center"><div className="w-6 h-6 border-2 border-[#0C447C] border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : fees.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-slate-400">No fee records found for this student.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['Month', 'Type', 'Amount', 'Paid', 'Balance', 'Status', 'Action'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(fees as any[]).map((fee: any) => (
                  <>
                    <tr key={fee._id} className="border-t border-slate-50 hover:bg-slate-50">
                      <td className="px-4 py-3 text-xs font-mono text-slate-700">{fee.month || '—'}</td>
                      <td className="px-4 py-3 text-xs text-slate-600 capitalize">{fee.feeType?.replace(/_/g, ' ') || '—'}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-slate-800">₦{(fee.netAmount ?? fee.amount ?? 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-xs text-emerald-600 font-semibold">₦{(fee.paidAmount ?? 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-xs text-red-600 font-semibold">₦{((fee.netAmount ?? fee.amount ?? 0) - (fee.paidAmount ?? 0)).toLocaleString()}</td>
                      <td className="px-4 py-3"><Badge v={feeStatusBV(fee.status)}>{fee.status}</Badge></td>
                      <td className="px-4 py-3">
                        {fee.status !== 'paid' && (
                          <button onClick={() => setCollectingId(collectingId === fee._id ? null : fee._id)}
                            className="px-3 py-1 text-xs bg-[#0C447C] text-white rounded-lg hover:bg-[#0b3d6e] font-medium">
                            Collect
                          </button>
                        )}
                      </td>
                    </tr>
                    {collectingId === fee._id && (
                      <tr key={`${fee._id}-collect`} className="bg-blue-50">
                        <td colSpan={7} className="px-4 py-3">
                          <div className="flex items-center gap-3 flex-wrap">
                            <input type="number" value={form.paidAmount} onChange={e => setForm(p => ({ ...p, paidAmount: e.target.value }))}
                              placeholder="Amount" className="w-32 px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]" />
                            <select value={form.paymentMethod} onChange={e => setForm(p => ({ ...p, paymentMethod: e.target.value }))}
                              className="px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]">
                              {['cash', 'bank_transfer', 'card', 'cheque'].map(m => <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>)}
                            </select>
                            <input value={form.receiptNumber} onChange={e => setForm(p => ({ ...p, receiptNumber: e.target.value }))}
                              placeholder="Receipt No." className="w-36 px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]" />
                            <input value={form.remarks} onChange={e => setForm(p => ({ ...p, remarks: e.target.value }))}
                              placeholder="Remarks (optional)" className="flex-1 min-w-32 px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]" />
                            <button onClick={() => doCollect(fee._id)} disabled={collectMutation.isPending}
                              className="px-3 py-1.5 text-xs bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium disabled:opacity-50">
                              {collectMutation.isPending ? 'Saving…' : 'Confirm'}
                            </button>
                            <button onClick={() => setCollectingId(null)} className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">Cancel</button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

// ─── BEHAVIOUR TAB ────────────────────────────────────────────────────────────
function BehaviourTab({ studentId, student }: { studentId: string; student: any }) {
  const { data: behaviourData, isLoading } = useStudentBehaviour(studentId)
  const createMutation = useCreateBehaviour()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ type: 'positive', description: '', severity: 'low', points: '0', date: new Date().toISOString().split('T')[0] })

  const records = (behaviourData as any) ?? []
  const totalPoints = Array.isArray(records) ? records.reduce((a: number, r: any) => a + (r.type === 'positive' ? (r.points ?? 0) : -(r.points ?? 0)), 0) : 0

  const doCreate = () => {
    if (!form.description.trim()) { toast.error('Description is required'); return }
    const schoolSlug   = localStorage.getItem('schoolSlug')   || 'demo-school'
    const academicYear = localStorage.getItem('academicYear') || '2025-26'
    createMutation.mutate(
      {
        studentId,
        type: form.type,
        description: form.description,
        severity: form.severity,
        points: Number(form.points) || 0,
        date: form.date,
        grade: student?.currentGrade || student?.currentPlacement?.gradeLevelName,
        section: student?.currentSection,
        schoolSlug,
        academicYear,
        reportedBy: 'Staff',
      },
      {
        onSuccess: () => { toast.success('Behaviour record added'); setShowForm(false); setForm({ type: 'positive', description: '', severity: 'low', points: '0', date: new Date().toISOString().split('T')[0] }) },
        onError: (err: any) => toast.error(err.response?.data?.message || 'Failed'),
      }
    )
  }

  const typeBV = (t: string): BV => ({ positive: 'green', negative: 'red', neutral: 'gray' }[t] ?? 'gray') as BV

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-800">Behaviour Records</h2>
          <p className="text-xs text-slate-400">Points balance: <strong className={totalPoints >= 0 ? 'text-emerald-600' : 'text-red-600'}>{totalPoints > 0 ? '+' : ''}{totalPoints}</strong></p>
        </div>
        <Btn variant="primary" onClick={() => setShowForm(s => !s)}><Plus size={13} />Log Behaviour</Btn>
      </div>

      {showForm && (
        <Card>
          <CardHeader title="New Behaviour Report" />
          <div className="p-4 grid grid-cols-2 gap-3">
            <FL label="Type">
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className={INPUT_CLS}>
                {['positive', 'negative', 'neutral'].map(t => <option key={t}>{t}</option>)}
              </select>
            </FL>
            <FL label="Severity">
              <select value={form.severity} onChange={e => setForm(p => ({ ...p, severity: e.target.value }))} className={INPUT_CLS}>
                {['low', 'medium', 'high', 'critical'].map(s => <option key={s}>{s}</option>)}
              </select>
            </FL>
            <FL label="Points">
              <input type="number" value={form.points} onChange={e => setForm(p => ({ ...p, points: e.target.value }))} className={INPUT_CLS} placeholder="0" />
            </FL>
            <FL label="Date">
              <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} className={INPUT_CLS} />
            </FL>
            <FL label="Description" span>
              <textarea rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                className={`${INPUT_CLS} resize-none`} placeholder="Describe the behaviour incident…" />
            </FL>
            <div className="col-span-2 flex gap-2">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 font-medium">Cancel</button>
              <button onClick={doCreate} disabled={createMutation.isPending}
                className="px-4 py-2 text-sm bg-[#0C447C] text-white rounded-lg hover:bg-[#0b3d6e] font-medium disabled:opacity-50">
                {createMutation.isPending ? 'Saving…' : 'Save Record'}
              </button>
            </div>
          </div>
        </Card>
      )}

      {isLoading ? (
        <div className="p-8 text-center"><div className="w-6 h-6 border-2 border-[#0C447C] border-t-transparent rounded-full animate-spin mx-auto" /></div>
      ) : !Array.isArray(records) || records.length === 0 ? (
        <Card><div className="px-5 py-10 text-center text-sm text-slate-400">No behaviour records. Use the button above to log one.</div></Card>
      ) : (
        <div className="space-y-3">
          {(records as any[]).map((r: any) => (
            <Card key={r._id}>
              <div className="p-4 flex items-start gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white font-bold text-sm ${r.type === 'positive' ? 'bg-emerald-500' : r.type === 'negative' ? 'bg-red-500' : 'bg-slate-400'}`}>
                  {r.type === 'positive' ? '+' : r.type === 'negative' ? '−' : '•'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge v={typeBV(r.type)}>{r.type}</Badge>
                    {r.severity && <Badge v="gray">{r.severity}</Badge>}
                    {r.points != null && r.points !== 0 && (
                      <span className={`text-xs font-semibold ${r.type === 'positive' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {r.type === 'positive' ? '+' : '-'}{Math.abs(r.points)} pts
                      </span>
                    )}
                    <span className="text-xs text-slate-400 ml-auto">{fmt(r.date)}</span>
                  </div>
                  <p className="text-sm text-slate-700">{r.description}</p>
                  {r.reportedBy && <p className="text-xs text-slate-400 mt-1">— {r.reportedBy}</p>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── TABS CONFIG ──────────────────────────────────────────────────────────────
const PROFILE_TABS: { id: ProfileTab; label: string; icon: LucideIcon }[] = [
  { id:'overview',    label:'Overview',    icon:LayoutDashboard },
  { id:'personal',    label:'Personal',    icon:User            },
  { id:'academic',    label:'Academic',    icon:GraduationCap   },
  { id:'guardians',   label:'Guardians',   icon:Users           },
  { id:'attendance',  label:'Attendance',  icon:CalendarDays    },
  { id:'fees',        label:'Fees',        icon:Activity        },
  { id:'behaviour',   label:'Behaviour',   icon:Shield          },
  { id:'health',      label:'Health',      icon:Heart           },
  { id:'documents',   label:'Documents',   icon:FileText        },
  { id:'notes',       label:'Notes',       icon:ClipboardList   },
  { id:'history',     label:'History',     icon:History         },
]

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function StudentProfile() {
  const params    = useParams<{ id: string }>()
  const navigate  = useNavigate()
  const studentId = params.id ?? ''

  const [tab, setTab] = useState<ProfileTab>('overview')

  const { data: s360, isLoading } = useStudent360(studentId)

  const rawStudent = (s360 as any)?.student
  const student    = toProfile(rawStudent, s360)

  // Still fetch medical/notes/docs/history via existing service
  const { data: medical      } = useQuery({ queryKey: ['student-medical',  studentId], queryFn: () => studentsService.getMedicalRecord(studentId),    enabled: !!studentId })
  const { data: notes   = [] } = useQuery({ queryKey: ['student-notes',    studentId], queryFn: () => studentsService.getStudentNotes(studentId),      enabled: !!studentId })
  const { data: documents = [] } = useQuery({ queryKey: ['student-docs',   studentId], queryFn: () => studentsService.getStudentDocuments(studentId),  enabled: !!studentId })
  const { data: history   = [] } = useQuery({ queryKey: ['student-history',studentId], queryFn: () => studentsService.getAcademicHistory(studentId),   enabled: !!studentId })

  // Attendance from 360 recent data (last 30 records) — used by OverviewTab
  const attendance360 = ((s360 as any)?.attendance?.recent ?? []) as any[]

  // Full attendance list for the AttendanceTab calendar
  const { data: attData } = useAttendance({ studentId })
  const allAtt = ((attData as any)?.data ?? []) as any[]

  if (!studentId) return (
    <div className="p-12 text-center text-slate-500">
      <p className="text-lg font-semibold mb-2">Invalid student URL</p>
      <Btn variant="primary" onClick={() => navigate('/students')}><ArrowLeft size={13}/>Back to Students</Btn>
    </div>
  )

  if (isLoading) return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-slate-100 px-6 py-5">
        <div className="flex items-start gap-5">
          <Skeleton className="w-16 h-16 rounded-2xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-4 w-48" />
            <div className="flex gap-5 mt-3"><Skeleton className="h-10 w-20" /><Skeleton className="h-10 w-20" /><Skeleton className="h-10 w-20" /></div>
          </div>
        </div>
      </div>
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="col-span-2 h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    </div>
  )

  if (!student) return (
    <div className="p-12 text-center text-slate-500">
      <p className="text-lg font-semibold mb-2">Student not found</p>
      <Btn variant="primary" onClick={() => navigate('/students')}><ArrowLeft size={13}/>Back to Students</Btn>
    </div>
  )

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <ProfileHeader student={student} onBack={() => navigate('/students')} />

      {/* Tab bar */}
      <div className="bg-white border-b border-slate-100 px-6 shrink-0">
        <div className="flex gap-0.5 overflow-x-auto py-1 no-scrollbar">
          {PROFILE_TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium whitespace-nowrap transition-all border-b-2 ${
                tab === t.id
                  ? 'border-[#0C447C] text-[#0C447C]'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}>
              <t.icon size={13} />{t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-6">
        {tab === 'overview'   && <OverviewTab   student={student}                notes={notes as any[]}         attendance={attendance360} />}
        {tab === 'personal'   && <PersonalTab   student={student}                studentId={studentId} />}
        {tab === 'academic'   && <AcademicTab   student={student} />}
        {tab === 'guardians'  && <GuardiansTab  student={student}                studentId={studentId} />}
        {tab === 'attendance' && <AttendanceTab studentId={studentId}            allAtt={allAtt} />}
        {tab === 'fees'       && <FeesTab       studentId={studentId} />}
        {tab === 'behaviour'  && <BehaviourTab  studentId={studentId}            student={rawStudent} />}
        {tab === 'health'     && <HealthTab     medical={medical}                studentId={studentId} />}
        {tab === 'documents'  && <DocumentsTab  documents={documents as any[]}   studentId={studentId} />}
        {tab === 'notes'      && <NotesTab      notes={notes as any[]}           studentId={studentId} />}
        {tab === 'history'    && <HistoryTab    history={history as any[]}       studentId={studentId} />}
      </div>
    </div>
  )
}
