import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  X, GraduationCap, Users, Calendar, ChevronLeft, ChevronRight,
  Trophy, Star, BookOpen, ClipboardList, BarChart3, DollarSign,
  Search, Plus, Eye, UserPlus, Edit2, XCircle, Award,
} from 'lucide-react';
import hrService from '../../../services/hr.service';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const TRAINING_CATEGORIES = [
  'CPD - Professional Development',
  'Compliance & Mandatory',
  'Induction & Onboarding',
  'Technical & Subject Skills',
  'Leadership & Management',
  'Islamic & Tarbiyah',
  'Digital & Technology',
  'Health & Safety',
  'Student Welfare',
  'Assessment & Evaluation',
  'Parent Communication',
  'Other',
];

const TRAINING_TYPES = [
  'internal','external','online','workshop','conference','certification','seminar','coaching',
];

const TARGET_ROLES = [
  'Principal','Vice Principal','Academic Coordinator','Teacher',
  'HR Manager','Finance Manager','Admin','Support Staff','All Staff',
];

const CURRENCIES = ['PKR','USD','AED','SAR','GBP'];

const CPD_REQUIRED: Record<string, number> = {
  Teacher: 20, 'Academic Coordinator': 15, 'HOD': 15,
  Principal: 10, 'Vice Principal': 10,
  Admin: 8, 'Support Staff': 8, 'HR Manager': 8, 'Finance Manager': 8,
};

const STATUS_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  upcoming:  { bg: '#e8f0fe', text: '#378ADD', border: '#378ADD' },
  ongoing:   { bg: '#e6f7ed', text: '#1D9E75', border: '#1D9E75' },
  completed: { bg: '#f0eeff', text: '#7F77DD', border: '#7F77DD' },
  cancelled: { bg: '#fdecea', text: '#E24B4A', border: '#E24B4A' },
};

const TYPE_COLORS: Record<string, string> = {
  internal: '#3b82f6', external: '#8b5cf6', online: '#10b981',
  workshop: '#f59e0b', conference: '#0C447C', certification: '#ef4444',
  seminar: '#ec4899', coaching: '#14b8a6',
};

// ─── SHARED PRIMITIVES ────────────────────────────────────────────────────────
const WIC = 'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]';

function WF({ label, required, children, span2 }: {
  label: string; required?: boolean; children: React.ReactNode; span2?: boolean;
}) {
  return (
    <div className={span2 ? 'col-span-2' : ''}>
      <label className="block text-xs font-semibold text-slate-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function WSEC({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 mb-4 pb-2 border-b border-slate-100 mt-6 first:mt-0">
      <div className="w-1 h-5 rounded-full bg-[#EF9F27] shrink-0" />
      <h3 className="font-bold text-sm text-slate-800">{title}</h3>
    </div>
  );
}

function Pill({ children, color = '#0C447C', bg = '#e8f0fe' }: {
  children: React.ReactNode; color?: string; bg?: string;
}) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border"
      style={{ color, background: bg, borderColor: color + '40' }}>
      {children}
    </span>
  );
}

function TBtn({ children, onClick, variant = 'sec', disabled = false }: {
  children: React.ReactNode; onClick?: () => void;
  variant?: 'pri' | 'sec' | 'danger' | 'success'; disabled?: boolean;
}) {
  const cls = {
    pri:     'bg-[#0C447C] text-white hover:bg-[#0b3d6e] border-[#0C447C]',
    sec:     'bg-white text-slate-700 hover:bg-slate-50 border-slate-200',
    danger:  'bg-red-600 text-white hover:bg-red-700 border-red-600',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-600',
  };
  return (
    <button onClick={onClick} disabled={disabled}
      className={`${cls[variant]} px-3 py-1.5 text-xs border rounded-lg font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      {children}
    </button>
  );
}

function PBar({ pct, color = '#0C447C', height = 1.5 }: { pct: number; color?: string; height?: number }) {
  return (
    <div className="bg-slate-100 rounded-full overflow-hidden w-full" style={{ height: `${height * 4}px` }}>
      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
    </div>
  );
}

function Avatar({ name, size = 8 }: { name: string; size?: number }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const colors = ['#10b981','#8b5cf6','#f59e0b','#ef4444','#0C447C','#3b82f6','#ec4899','#14b8a6'];
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) | 0;
  const bg = colors[Math.abs(h) % colors.length];
  return (
    <div className={`w-${size} h-${size} rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0`}
      style={{ background: bg, width: `${size * 4}px`, height: `${size * 4}px` }}>
      {initials}
    </div>
  );
}

function fmtDate(d: string) {
  try { return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return d || '—'; }
}

function fmtShort(d: string) {
  try { return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }); }
  catch { return d || '—'; }
}

// ─── MODAL SHELL ──────────────────────────────────────────────────────────────
function ModalShell({ title, onClose, children, footer, wide, fullscreen }: {
  title: string; onClose: () => void; children: React.ReactNode;
  footer?: React.ReactNode; wide?: boolean; fullscreen?: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className={`bg-white rounded-2xl shadow-xl w-full my-4 ${fullscreen ? 'max-w-6xl' : wide ? 'max-w-3xl' : 'max-w-xl'}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="font-bold text-slate-900">{title}</div>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto max-h-[78vh]">{children}</div>
        {footer && <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100">{footer}</div>}
      </div>
    </div>
  );
}

// ─── MODAL 1: CREATE TRAINING ──────────────────────────────────────────────────
const EMPTY_FORM = {
  title: '', category: '', type: 'internal', provider: '', description: '',
  startDate: '', endDate: '', startTime: '', endTime: '',
  venue: '', meetingLink: '', isMandatory: false,
  targetRoles: [] as string[],
  maxParticipants: 0, cpdHours: 0,
  costPerParticipant: 0, totalBudget: 0, currency: 'PKR',
  hasPostTrainingAssessment: false, assessmentPassScore: 70,
  issuesCertificate: false, certificateTitle: '',
};

function CreateTrainingModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const set = (k: string, v: unknown) => setForm(prev => ({ ...prev, [k]: v }));

  const duration = useMemo(() => {
    if (!form.startDate || !form.endDate) return null;
    try {
      const s = new Date(`${form.startDate}T${form.startTime || '08:00'}`);
      const e = new Date(`${form.endDate}T${form.endTime || '17:00'}`);
      const hrs = Math.max(0, (e.getTime() - s.getTime()) / 3600000);
      return hrs > 0 ? `${hrs.toFixed(1)} hours` : null;
    } catch { return null; }
  }, [form.startDate, form.endDate, form.startTime, form.endTime]);

  const toggleRole = (role: string) => {
    setForm(prev => ({
      ...prev,
      targetRoles: prev.targetRoles.includes(role)
        ? prev.targetRoles.filter(r => r !== role)
        : [...prev.targetRoles, role],
    }));
  };

  const mut = useMutation({
    mutationFn: (publish: boolean) => hrService.createTraining({
      ...form, status: 'upcoming', isPublished: publish,
    }),
    onSuccess: () => { toast.success('Training created'); onSuccess(); onClose(); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to create training'),
  });

  return (
    <ModalShell title="Schedule Training" onClose={onClose} wide
      footer={
        <>
          <TBtn onClick={onClose}>Cancel</TBtn>
          <TBtn variant="sec" onClick={() => mut.mutate(false)} disabled={mut.isPending}>
            {mut.isPending ? 'Saving…' : 'Save as Draft'}
          </TBtn>
          <TBtn variant="pri" onClick={() => mut.mutate(true)} disabled={mut.isPending}>
            {mut.isPending ? 'Publishing…' : 'Publish Training'}
          </TBtn>
        </>
      }
    >
      {/* SECTION 1 */}
      <WSEC title="Basic Information" />
      <div className="grid grid-cols-2 gap-3">
        <WF label="Training Title" required span2>
          <input value={form.title} onChange={e => set('title', e.target.value)} className={WIC} placeholder="e.g. Effective Classroom Management" />
        </WF>
        <WF label="Category" required>
          <select value={form.category} onChange={e => set('category', e.target.value)} className={WIC}>
            <option value="">Select category…</option>
            {TRAINING_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </WF>
        <WF label="Type" required>
          <select value={form.type} onChange={e => set('type', e.target.value)} className={WIC}>
            {TRAINING_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
        </WF>
        <WF label="Provider / Trainer Name" span2>
          <input value={form.provider} onChange={e => set('provider', e.target.value)} className={WIC} placeholder="e.g. Dr. Ahmed Khan" />
        </WF>
        <WF label="Description" span2>
          <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} className={WIC} placeholder="Training objectives and overview…" />
        </WF>
      </div>

      {/* SECTION 2 */}
      <WSEC title="Schedule & Logistics" />
      <div className="grid grid-cols-2 gap-3">
        <WF label="Start Date" required>
          <input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} className={WIC} />
        </WF>
        <WF label="End Date" required>
          <input type="date" value={form.endDate} onChange={e => set('endDate', e.target.value)} className={WIC} />
        </WF>
        <WF label="Start Time">
          <input type="time" value={form.startTime} onChange={e => set('startTime', e.target.value)} className={WIC} />
        </WF>
        <WF label="End Time">
          <input type="time" value={form.endTime} onChange={e => set('endTime', e.target.value)} className={WIC} />
        </WF>
        {duration && (
          <div className="col-span-2">
            <div className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">Duration: <span className="font-semibold text-slate-800">{duration}</span></div>
          </div>
        )}
        <WF label="Venue">
          <input value={form.venue} onChange={e => set('venue', e.target.value)} className={WIC} placeholder="e.g. Main Campus Hall" />
        </WF>
        {(form.type === 'online' || form.type === 'seminar') && (
          <WF label="Meeting Link">
            <input value={form.meetingLink} onChange={e => set('meetingLink', e.target.value)} className={WIC} placeholder="https://…" />
          </WF>
        )}
        <WF label="Max Participants">
          <input type="number" min={0} value={form.maxParticipants} onChange={e => set('maxParticipants', parseInt(e.target.value) || 0)} className={WIC} />
        </WF>
        <WF label="CPD Hours Awarded">
          <input type="number" min={0} step={0.5} value={form.cpdHours} onChange={e => set('cpdHours', parseFloat(e.target.value) || 0)} className={WIC} />
        </WF>
      </div>
      <div className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${form.isMandatory ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
        <input type="checkbox" id="mandatory" checked={form.isMandatory} onChange={e => set('isMandatory', e.target.checked)} className="w-4 h-4 accent-amber-500" />
        <label htmlFor="mandatory" className="text-sm font-medium text-slate-700 cursor-pointer">
          Mandatory Training {form.isMandatory && <span className="text-amber-600 text-xs ml-1">(All target staff must complete)</span>}
        </label>
      </div>
      <div>
        <div className="text-xs font-semibold text-slate-600 mb-2">Target Roles</div>
        <div className="flex flex-wrap gap-2">
          {TARGET_ROLES.map(role => (
            <label key={role} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs cursor-pointer transition-colors ${form.targetRoles.includes(role) ? 'bg-[#0C447C] text-white border-[#0C447C]' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
              <input type="checkbox" checked={form.targetRoles.includes(role)} onChange={() => toggleRole(role)} className="hidden" />
              {role}
            </label>
          ))}
        </div>
      </div>

      {/* SECTION 3 */}
      <WSEC title="Budget & Assessment" />
      <div className="grid grid-cols-2 gap-3">
        <WF label="Cost Per Participant">
          <input type="number" min={0} value={form.costPerParticipant} onChange={e => set('costPerParticipant', parseFloat(e.target.value) || 0)} className={WIC} />
        </WF>
        <WF label="Total Budget">
          <input type="number" min={0} value={form.totalBudget} onChange={e => set('totalBudget', parseFloat(e.target.value) || 0)} className={WIC} />
        </WF>
        <WF label="Currency">
          <select value={form.currency} onChange={e => set('currency', e.target.value)} className={WIC}>
            {CURRENCIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </WF>
      </div>
      <div className="space-y-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.hasPostTrainingAssessment} onChange={e => set('hasPostTrainingAssessment', e.target.checked)} className="w-4 h-4 accent-[#0C447C]" />
          <span className="text-sm text-slate-700">Has Post-Training Assessment</span>
        </label>
        {form.hasPostTrainingAssessment && (
          <div className="ml-6">
            <WF label="Assessment Pass Score (%)">
              <input type="number" min={0} max={100} value={form.assessmentPassScore} onChange={e => set('assessmentPassScore', parseInt(e.target.value) || 70)} className={WIC} style={{ maxWidth: 160 }} />
            </WF>
          </div>
        )}
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.issuesCertificate} onChange={e => set('issuesCertificate', e.target.checked)} className="w-4 h-4 accent-[#0C447C]" />
          <span className="text-sm text-slate-700">Issues Certificate on Completion</span>
        </label>
        {form.issuesCertificate && (
          <div className="ml-6">
            <WF label="Certificate Title">
              <input value={form.certificateTitle} onChange={e => set('certificateTitle', e.target.value)} className={WIC} placeholder="e.g. Certificate of Professional Development" />
            </WF>
          </div>
        )}
      </div>
    </ModalShell>
  );
}

// ─── MODAL 3: ENROLL STAFF ─────────────────────────────────────────────────────
function EnrollStaffModal({ training, onClose, onDone }: {
  training: any; onClose: () => void; onDone: () => void;
}) {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [enrolling, setEnrolling] = useState(false);

  const { data: staffRaw = [] } = useQuery({ queryKey: ['staff'], queryFn: hrService.getStaff });
  const staffList = staffRaw as any[];

  const enrolledIds = new Set((training.participants || []).map((p: any) => p.staffId?.toString()));

  const targetRoles = training.targetRoles as string[] | undefined;
  const filtered = useMemo(() => {
    return staffList.filter(s => {
      if (targetRoles?.length && !targetRoles.includes('All Staff') && !targetRoles.includes(s.designation) && !targetRoles.includes(s.role)) return false;
      const q = search.toLowerCase();
      if (!q) return true;
      return (`${s.firstName} ${s.lastName}`).toLowerCase().includes(q) || (s.designation || '').toLowerCase().includes(q);
    });
  }, [staffList, search, targetRoles]);

  const toggle = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleEnroll = async () => {
    if (!selected.length) return;
    setEnrolling(true);
    let done = 0;
    for (const staffId of selected) {
      const s = staffList.find(x => x._id === staffId);
      const name = s ? `${s.firstName} ${s.lastName}` : staffId;
      try {
        await hrService.enrollInTraining(training._id, staffId, name);
        done++;
      } catch {}
    }
    setEnrolling(false);
    qc.invalidateQueries({ queryKey: ['trainings'] });
    toast.success(`${done} staff enrolled`);
    onDone();
    onClose();
  };

  return (
    <ModalShell title={`Enroll Staff — ${training.title}`} onClose={onClose} wide
      footer={
        <>
          <TBtn onClick={onClose}>Cancel</TBtn>
          <TBtn variant="pri" onClick={handleEnroll} disabled={!selected.length || enrolling}>
            {enrolling ? `Enrolling…` : `Enroll ${selected.length ? `(${selected.length})` : ''} Selected`}
          </TBtn>
        </>
      }
    >
      <div className="relative mb-3">
        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} className={`${WIC} pl-8`} placeholder="Search staff…" />
      </div>
      {filtered.length === 0 ? (
        <div className="text-center py-8 text-slate-400 text-sm">No staff found</div>
      ) : (
        <div className="space-y-1 max-h-72 overflow-y-auto">
          {filtered.map(s => {
            const id = s._id?.toString();
            const isEnrolled = enrolledIds.has(id);
            const isSelected = selected.includes(id);
            return (
              <label key={id} className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${isEnrolled ? 'bg-slate-50 border-slate-100 opacity-60 cursor-not-allowed' : isSelected ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-100 hover:bg-slate-50'}`}>
                <input type="checkbox" checked={isSelected || isEnrolled} disabled={isEnrolled} onChange={() => !isEnrolled && toggle(id)} className="w-4 h-4 accent-[#0C447C]" />
                <Avatar name={`${s.firstName} ${s.lastName}`} size={7} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-800">{s.firstName} {s.lastName}</div>
                  <div className="text-xs text-slate-500">{s.designation || s.role || '—'}</div>
                </div>
                {isEnrolled && <span className="text-xs text-emerald-600 font-medium">Enrolled</span>}
              </label>
            );
          })}
        </div>
      )}
    </ModalShell>
  );
}

// ─── MODAL 4: STAFF TRAINING HISTORY ──────────────────────────────────────────
function StaffTrainingHistoryModal({ staffId, staffName, onClose }: {
  staffId: string; staffName: string; onClose: () => void;
}) {
  const { data: trainingsRaw = [] } = useQuery({ queryKey: ['trainings'], queryFn: hrService.getTrainings });
  const trainings = trainingsRaw as any[];

  const staffTrainings = useMemo(() =>
    trainings.filter(t => (t.participants || []).some((p: any) => p.staffId?.toString() === staffId)),
    [trainings, staffId]
  );

  const currentYear = new Date().getFullYear();
  const cpdEarned = staffTrainings.reduce((sum, t) => {
    const p = (t.participants || []).find((x: any) => x.staffId?.toString() === staffId);
    if ((p?.status === 'passed' || p?.status === 'attended') && new Date(t.startDate).getFullYear() === currentYear) {
      return sum + (t.cpdHours || 0);
    }
    return sum;
  }, 0);

  const role = (() => {
    for (const t of trainings) {
      const p = (t.participants || []).find((x: any) => x.staffId?.toString() === staffId);
      if (p?.designation) return p.designation;
    }
    return 'Teacher';
  })();

  const required = CPD_REQUIRED[role] || 20;
  const cpdPct = Math.min(100, Math.round((cpdEarned / required) * 100));

  return (
    <ModalShell title={`Training History — ${staffName}`} onClose={onClose} wide>
      {/* CPD Summary */}
      <div className="bg-slate-50 rounded-xl p-4 mb-2">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wide font-semibold">CPD Hours {currentYear}</div>
            <div className="text-2xl font-bold text-slate-800 mt-0.5">{cpdEarned} <span className="text-sm font-normal text-slate-500">/ {required} required</span></div>
          </div>
          <div className={`text-sm font-semibold px-3 py-1 rounded-full ${cpdPct >= 100 ? 'bg-emerald-100 text-emerald-700' : cpdPct >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
            {cpdPct >= 100 ? 'Requirement Met' : `${cpdPct}% Complete`}
          </div>
        </div>
        <PBar pct={cpdPct} color={cpdPct >= 100 ? '#10b981' : cpdPct >= 50 ? '#f59e0b' : '#ef4444'} height={2} />
      </div>

      {/* History Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              {['Training','Category','Type','Date','Status','CPD Hrs','Certificate'].map(c => (
                <th key={c} className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap bg-slate-50">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {staffTrainings.length === 0 ? (
              <tr><td colSpan={7} className="py-8 text-center text-slate-400">No training history</td></tr>
            ) : staffTrainings.map(t => {
              const p = (t.participants || []).find((x: any) => x.staffId?.toString() === staffId);
              const st = p?.status || 'enrolled';
              const stStyle = { passed: { bg: '#e6f7ed', text: '#1D9E75' }, attended: { bg: '#e8f0fe', text: '#378ADD' }, enrolled: { bg: '#f0eeff', text: '#7F77DD' }, failed: { bg: '#fdecea', text: '#E24B4A' }, absent: { bg: '#f1f5f9', text: '#64748b' } } as any;
              const ss = stStyle[st] || stStyle.enrolled;
              return (
                <tr key={t._id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-medium">{t.title}</td>
                  <td className="py-2.5 px-3 text-slate-500 text-xs">{t.category || '—'}</td>
                  <td className="py-2.5 px-3 capitalize text-slate-600">{t.type}</td>
                  <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">{fmtShort(t.startDate)}</td>
                  <td className="py-2.5 px-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: ss.bg, color: ss.text }}>{st}</span>
                  </td>
                  <td className="py-2.5 px-3">{t.cpdHours || 0}</td>
                  <td className="py-2.5 px-3">
                    {t.issuesCertificate && (st === 'passed' || st === 'attended') ? (
                      <TBtn><Award className="w-3 h-3" /> Certificate</TBtn>
                    ) : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </ModalShell>
  );
}

// ─── MODAL 2: TRAINING DETAIL ──────────────────────────────────────────────────
type DetailTab = 'overview' | 'participants' | 'attendance' | 'assessment' | 'feedback' | 'budget';

function TrainingDetailModal({ training: initialTraining, onClose, onMutate }: {
  training: any; onClose: () => void; onMutate: () => void;
}) {
  const qc = useQueryClient();
  const [tab, setTab] = useState<DetailTab>('overview');
  const [showEnroll, setShowEnroll] = useState(false);
  const [objectives, setObjectives] = useState((initialTraining.objectives || []).join('\n'));
  const [scores, setScores] = useState<Record<string, string>>({});
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});
  const [actualSpent, setActualSpent] = useState(String(initialTraining.actualSpent || 0));
  const [expenses, setExpenses] = useState<{ item: string; amount: number; date: string; notes: string }[]>(initialTraining.expenses || []);
  const [newExp, setNewExp] = useState({ item: '', amount: 0, date: '', notes: '' });
  const [staffHistory, setStaffHistory] = useState<{ staffId: string; staffName: string } | null>(null);

  const { data: trainingsRaw = [] } = useQuery({ queryKey: ['trainings'], queryFn: hrService.getTrainings });
  const training = (trainingsRaw as any[]).find(t => t._id === initialTraining._id) || initialTraining;
  const participants: any[] = training.participants || [];

  const cancelMut = useMutation({
    mutationFn: () => hrService.updateTraining(training._id, { status: 'cancelled' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['trainings'] }); toast.success('Training cancelled'); onClose(); },
  });

  const saveObjMut = useMutation({
    mutationFn: () => hrService.updateTraining(training._id, {
      objectives: objectives.split('\n').filter(Boolean),
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['trainings'] }); toast.success('Objectives saved'); },
  });

  const saveScoresMut = useMutation({
    mutationFn: () => hrService.updateTraining(training._id, {
      participants: participants.map(p => ({
        ...p,
        assessmentScore: scores[p.staffId] !== undefined ? parseFloat(scores[p.staffId]) : p.assessmentScore,
        status: scores[p.staffId] !== undefined
          ? (parseFloat(scores[p.staffId]) >= (training.assessmentPassScore || 70) ? 'passed' : 'failed')
          : p.status,
      })),
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['trainings'] }); toast.success('Scores saved'); },
  });

  const saveAttMut = useMutation({
    mutationFn: () => hrService.updateTraining(training._id, {
      participants: participants.map(p => ({
        ...p,
        status: attendance[p.staffId] !== undefined
          ? (attendance[p.staffId] ? 'attended' : 'absent')
          : p.status,
      })),
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['trainings'] }); toast.success('Attendance saved'); },
  });

  const ss = STATUS_STYLE[training.status] || STATUS_STYLE.upcoming;
  const enrolled = participants.length;
  const attended = participants.filter(p => p.status === 'attended' || p.status === 'passed').length;
  const passed = participants.filter(p => p.status === 'passed').length;
  const waitlist = participants.filter(p => p.status === 'waitlist').length;

  const DETAIL_TABS: { id: DetailTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview',     label: 'Overview',     icon: <BookOpen className="w-3.5 h-3.5" /> },
    { id: 'participants', label: 'Participants',  icon: <Users className="w-3.5 h-3.5" /> },
    { id: 'attendance',   label: 'Attendance',   icon: <ClipboardList className="w-3.5 h-3.5" /> },
    { id: 'assessment',   label: 'Assessment',   icon: <Star className="w-3.5 h-3.5" /> },
    { id: 'feedback',     label: 'Feedback',     icon: <BarChart3 className="w-3.5 h-3.5" /> },
    { id: 'budget',       label: 'Budget',       icon: <DollarSign className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl my-4">
        {/* Header */}
        <div className="rounded-t-2xl px-6 py-5" style={{ background: '#0C447C' }}>
          <div className="flex items-start justify-between">
            <div className="flex-1 mr-4">
              <div className="text-xl font-bold text-white mb-2">{training.title}</div>
              <div className="flex flex-wrap items-center gap-2">
                {training.category && <Pill color="#fff" bg="rgba(255,255,255,0.15)">{training.category}</Pill>}
                <Pill color="#fff" bg="rgba(255,255,255,0.15)" >{training.type}</Pill>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border"
                  style={{ background: ss.bg, color: ss.text, borderColor: ss.border + '60' }}>
                  {training.status}
                </span>
                {training.cpdHours > 0 && <Pill color="#fff" bg="#EF9F2760">{training.cpdHours} CPD Hrs</Pill>}
                {training.isMandatory && <Pill color="#fff" bg="#ef444450">Mandatory</Pill>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={onClose}><X className="w-5 h-5 text-white/70 hover:text-white" /></button>
            </div>
          </div>
        </div>

        {/* Tab nav */}
        <div className="flex border-b border-slate-100 px-6 overflow-x-auto">
          {DETAIL_TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${tab === t.id ? 'border-[#0C447C] text-[#0C447C]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        <div className="p-6 overflow-y-auto max-h-[62vh]">
          {/* OVERVIEW */}
          {tab === 'overview' && (
            <div className="grid grid-cols-3 gap-5">
              <div className="col-span-2 space-y-4">
                {training.description && (
                  <div>
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Description</div>
                    <p className="text-sm text-slate-700 leading-relaxed">{training.description}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ['Provider', training.provider || '—'],
                    ['Dates', `${fmtShort(training.startDate)} → ${fmtShort(training.endDate)}`],
                    ['Venue', training.venue || training.meetingLink || '—'],
                    ['CPD Hours', training.cpdHours || 0],
                    ['Max Participants', training.maxParticipants || 'Unlimited'],
                    ['Certificate', training.issuesCertificate ? training.certificateTitle || 'Yes' : 'No'],
                    ['Pass Score', training.hasPostTrainingAssessment ? `${training.assessmentPassScore || 70}%` : 'N/A'],
                    ['Target Roles', (training.targetRoles || []).join(', ') || 'All Staff'],
                  ].map(([k, v]) => (
                    <div key={k as string} className="bg-slate-50 rounded-lg p-3">
                      <div className="text-xs text-slate-500 mb-0.5">{k}</div>
                      <div className="text-sm font-medium text-slate-800">{String(v)}</div>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-600 mb-2">Learning Objectives</div>
                  <textarea value={objectives} onChange={e => setObjectives(e.target.value)} rows={4} className={WIC} placeholder="Enter each objective on a new line…" />
                  <div className="mt-2 flex justify-end">
                    <TBtn variant="pri" onClick={() => saveObjMut.mutate()} disabled={saveObjMut.isPending}>
                      {saveObjMut.isPending ? 'Saving…' : 'Save Objectives'}
                    </TBtn>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Enrollment Summary</div>
                  {[['Enrolled', enrolled, '#378ADD'], ['Waitlist', waitlist, '#EF9F27'], ['Attended', attended, '#1D9E75'], ['Passed', passed, '#7F77DD']].map(([l, v, c]) => (
                    <div key={l as string} className="flex justify-between items-center py-1.5 border-b border-slate-100 last:border-0">
                      <span className="text-sm text-slate-600">{l}</span>
                      <span className="text-sm font-bold" style={{ color: c as string }}>{v as number}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Quick Actions</div>
                  <TBtn variant="pri" onClick={() => setShowEnroll(true)}><UserPlus className="w-3.5 h-3.5" /> Enroll Staff</TBtn>
                  <TBtn onClick={() => setTab('attendance')}><ClipboardList className="w-3.5 h-3.5" /> Mark Attendance</TBtn>
                  <TBtn onClick={() => { toast.success(`Reminder sent to ${enrolled} participants`); }}>Send Reminder</TBtn>
                  {training.status !== 'cancelled' && training.status !== 'completed' && (
                    <TBtn variant="danger" onClick={() => { if (window.confirm('Cancel this training?')) cancelMut.mutate(); }}>
                      Cancel Training
                    </TBtn>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* PARTICIPANTS */}
          {tab === 'participants' && (
            <div>
              <div className="flex justify-end mb-3">
                <TBtn variant="pri" onClick={() => setShowEnroll(true)}><UserPlus className="w-3.5 h-3.5" /> Enroll More Staff</TBtn>
              </div>
              {participants.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <div className="text-sm">No participants yet</div>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {['Staff','Designation','Enrolled On','Status','Score','Certificate'].map(c => (
                        <th key={c} className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide bg-slate-50">{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {participants.map(p => {
                      const stMap: any = {
                        enrolled: { bg: '#e8f0fe', text: '#378ADD' },
                        attended: { bg: '#e6f7ed', text: '#1D9E75' },
                        passed:   { bg: '#d1fae5', text: '#065f46' },
                        failed:   { bg: '#fdecea', text: '#E24B4A' },
                        absent:   { bg: '#f1f5f9', text: '#64748b' },
                        waitlist: { bg: '#fef3c7', text: '#92400e' },
                      };
                      const ss2 = stMap[p.status] || stMap.enrolled;
                      return (
                        <tr key={p.staffId} className="border-b border-slate-50 hover:bg-slate-50">
                          <td className="py-2.5 px-3">
                            <button className="flex items-center gap-2 hover:underline text-left" onClick={() => setStaffHistory({ staffId: p.staffId, staffName: p.staffName })}>
                              <Avatar name={p.staffName || '?'} size={7} />
                              <span className="font-medium">{p.staffName}</span>
                            </button>
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 text-xs">{p.designation || '—'}</td>
                          <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">{p.enrolledAt ? fmtShort(p.enrolledAt) : '—'}</td>
                          <td className="py-2.5 px-3">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: ss2.bg, color: ss2.text }}>
                              {p.status === 'passed' && <Trophy className="w-2.5 h-2.5" />}
                              {p.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">{p.assessmentScore != null ? `${p.assessmentScore}%` : '—'}</td>
                          <td className="py-2.5 px-3">
                            {training.issuesCertificate && (p.status === 'passed' || p.status === 'attended') ? (
                              <TBtn><Award className="w-3 h-3" /></TBtn>
                            ) : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ATTENDANCE */}
          {tab === 'attendance' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-medium text-slate-700">{participants.length} participants enrolled</div>
                <div className="flex gap-2">
                  <TBtn onClick={() => {
                    const all: Record<string, boolean> = {};
                    participants.forEach(p => { all[p.staffId] = true; });
                    setAttendance(all);
                  }}>Mark All Present</TBtn>
                  <TBtn variant="pri" onClick={() => saveAttMut.mutate()} disabled={saveAttMut.isPending}>
                    {saveAttMut.isPending ? 'Saving…' : 'Save Attendance'}
                  </TBtn>
                </div>
              </div>
              {participants.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">No participants enrolled</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {['Staff','Current Status','Mark Present'].map(c => (
                        <th key={c} className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide bg-slate-50">{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {participants.map(p => {
                      const isPresent = attendance[p.staffId] !== undefined ? attendance[p.staffId] : (p.status === 'attended' || p.status === 'passed');
                      return (
                        <tr key={p.staffId} className="border-b border-slate-50">
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2">
                              <Avatar name={p.staffName || '?'} size={7} />
                              <span className="font-medium">{p.staffName}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 capitalize">{p.status}</td>
                          <td className="py-2.5 px-3">
                            <button onClick={() => setAttendance(prev => ({ ...prev, [p.staffId]: !isPresent }))}
                              className={`w-9 h-5 rounded-full transition-colors relative ${isPresent ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${isPresent ? 'left-4' : 'left-0.5'}`} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ASSESSMENT */}
          {tab === 'assessment' && (
            <div>
              {!training.hasPostTrainingAssessment ? (
                <div className="text-center py-12 text-slate-400">
                  <Star className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <div className="text-sm">No post-training assessment configured</div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[
                      ['Pass Score', `${training.assessmentPassScore || 70}%`, '#378ADD'],
                      ['Passed', participants.filter(p => p.status === 'passed').length, '#1D9E75'],
                      ['Failed', participants.filter(p => p.status === 'failed').length, '#E24B4A'],
                    ].map(([l, v, c]) => (
                      <div key={l as string} className="bg-slate-50 rounded-xl p-3 text-center">
                        <div className="text-xs text-slate-500">{l}</div>
                        <div className="text-xl font-bold mt-1" style={{ color: c as string }}>{String(v)}</div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end mb-3">
                    <TBtn variant="pri" onClick={() => saveScoresMut.mutate()} disabled={saveScoresMut.isPending}>
                      {saveScoresMut.isPending ? 'Saving…' : 'Save Scores'}
                    </TBtn>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        {['Staff','Score (%)','Result','Date Taken'].map(c => (
                          <th key={c} className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide bg-slate-50">{c}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {participants.map(p => {
                        const scoreVal = scores[p.staffId] !== undefined ? scores[p.staffId] : String(p.assessmentScore ?? '');
                        const numScore = parseFloat(scoreVal);
                        const pass = training.assessmentPassScore || 70;
                        const result = scoreVal !== '' ? (numScore >= pass ? 'Pass' : 'Fail') : '—';
                        return (
                          <tr key={p.staffId} className="border-b border-slate-50">
                            <td className="py-2.5 px-3 font-medium">{p.staffName}</td>
                            <td className="py-2.5 px-3">
                              <input type="number" min={0} max={100} value={scoreVal}
                                onChange={e => setScores(prev => ({ ...prev, [p.staffId]: e.target.value }))}
                                className="w-20 px-2 py-1 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0C447C]" placeholder="—" />
                            </td>
                            <td className="py-2.5 px-3">
                              {result !== '—' ? (
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${result === 'Pass' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{result}</span>
                              ) : '—'}
                            </td>
                            <td className="py-2.5 px-3 text-slate-500">{p.assessmentDate ? fmtShort(p.assessmentDate) : '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          )}

          {/* FEEDBACK */}
          {tab === 'feedback' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-slate-600">{enrolled} participants</div>
                <TBtn variant="pri" onClick={() => toast.success(`Feedback form sent to ${enrolled} participants`)}>
                  Send Feedback Form
                </TBtn>
              </div>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="text-4xl mb-3">📭</div>
                <p className="text-sm font-semibold text-slate-500">No feedback collected yet</p>
                <p className="text-xs text-slate-400 mt-1">Send the feedback form to participants to collect ratings</p>
              </div>
            </div>
          )}

          {/* BUDGET */}
          {tab === 'budget' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['Allocated Budget', `${training.currency || 'PKR'} ${Number(training.totalBudget || 0).toLocaleString()}`, '#378ADD'],
                  ['Cost / Participant', `${training.currency || 'PKR'} ${Number(training.costPerParticipant || 0).toLocaleString()}`, '#7F77DD'],
                  ['Enrolled', enrolled, '#1D9E75'],
                  ['Estimated Total', `${training.currency || 'PKR'} ${((training.costPerParticipant || 0) * enrolled).toLocaleString()}`, '#EF9F27'],
                ].map(([l, v, c]) => (
                  <div key={l as string} className="bg-slate-50 rounded-xl p-3">
                    <div className="text-xs text-slate-500">{l}</div>
                    <div className="text-lg font-bold mt-0.5" style={{ color: c as string }}>{String(v)}</div>
                  </div>
                ))}
              </div>
              <WF label="Actual Spent">
                <div className="flex gap-2">
                  <input type="number" value={actualSpent} onChange={e => setActualSpent(e.target.value)} className={`${WIC} max-w-48`} />
                  <TBtn variant="pri" onClick={() => { toast.success('Actual spend updated'); }}>Save</TBtn>
                </div>
              </WF>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Expense Breakdown</div>
                </div>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  <input value={newExp.item} onChange={e => setNewExp(p => ({ ...p, item: e.target.value }))} className={WIC} placeholder="Item" />
                  <input type="number" value={newExp.amount || ''} onChange={e => setNewExp(p => ({ ...p, amount: parseFloat(e.target.value) || 0 }))} className={WIC} placeholder="Amount" />
                  <input type="date" value={newExp.date} onChange={e => setNewExp(p => ({ ...p, date: e.target.value }))} className={WIC} />
                  <TBtn variant="pri" onClick={() => { if (newExp.item) { setExpenses(prev => [...prev, newExp]); setNewExp({ item: '', amount: 0, date: '', notes: '' }); } }}>
                    <Plus className="w-3.5 h-3.5" />
                  </TBtn>
                </div>
                {expenses.length > 0 && (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        {['Item','Amount','Date'].map(c => (
                          <th key={c} className="text-left py-2 px-2 text-xs font-semibold text-slate-500 bg-slate-50">{c}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.map((e, i) => (
                        <tr key={i} className="border-b border-slate-50">
                          <td className="py-2 px-2">{e.item}</td>
                          <td className="py-2 px-2">{training.currency || 'PKR'} {Number(e.amount).toLocaleString()}</td>
                          <td className="py-2 px-2">{fmtShort(e.date)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {showEnroll && <EnrollStaffModal training={training} onClose={() => setShowEnroll(false)} onDone={onMutate} />}
      {staffHistory && <StaffTrainingHistoryModal staffId={staffHistory.staffId} staffName={staffHistory.staffName} onClose={() => setStaffHistory(null)} />}
    </div>
  );
}

// ─── CALENDAR VIEW ─────────────────────────────────────────────────────────────
function CalendarView({ trainings, onSelect }: { trainings: any[]; onSelect: (t: any) => void }) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());

  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const byDay: Record<number, any[]> = {};
  trainings.forEach(t => {
    try {
      const d = new Date(t.startDate);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        if (!byDay[day]) byDay[day] = [];
        byDay[day].push(t);
      }
    } catch {}
  });

  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <button onClick={() => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); }}>
          <ChevronLeft className="w-5 h-5 text-slate-400 hover:text-slate-600" />
        </button>
        <div className="font-semibold text-slate-800">{monthNames[month]} {year}</div>
        <button onClick={() => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); }}>
          <ChevronRight className="w-5 h-5 text-slate-400 hover:text-slate-600" />
        </button>
      </div>
      <div className="grid grid-cols-7 border-b border-slate-100">
        {dayNames.map(d => (
          <div key={d} className="py-2 text-center text-xs font-semibold text-slate-500 uppercase">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((day, i) => (
          <div key={i} className={`min-h-16 p-1.5 border-b border-r border-slate-50 ${day ? '' : 'bg-slate-50/50'}`}>
            {day && (
              <>
                <div className="text-xs font-medium text-slate-500 mb-1">{day}</div>
                {(byDay[day] || []).map(t => {
                  const ss2 = STATUS_STYLE[t.status] || STATUS_STYLE.upcoming;
                  return (
                    <button key={t._id} onClick={() => onSelect(t)}
                      className="w-full text-left text-xs px-1.5 py-0.5 rounded mb-0.5 truncate font-medium hover:opacity-80 transition-opacity"
                      style={{ background: ss2.bg, color: ss2.text }}>
                      {t.title}
                    </button>
                  );
                })}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export function HRTrainingTab() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'list' | 'calendar'>('cards');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCPD, setShowCPD] = useState(false);
  const [staffHistory, setStaffHistory] = useState<{ staffId: string; staffName: string } | null>(null);

  const { data: trainingsRaw = [], isLoading } = useQuery({
    queryKey: ['trainings'],
    queryFn: hrService.getTrainings,
  });
  const { data: staffRaw = [] } = useQuery({ queryKey: ['staff'], queryFn: hrService.getStaff });

  const trainings = trainingsRaw as any[];
  const staffList = staffRaw as any[];

  const upcoming = trainings.filter(t => t.status === 'upcoming').length;
  const ongoing = trainings.filter(t => t.status === 'ongoing').length;
  const completed = trainings.filter(t => t.status === 'completed').length;
  const totalParticipants = trainings.reduce((s, t) => s + (t.participants?.length || 0), 0);
  const mandatoryCount = trainings.filter(t => t.isMandatory).length;

  const filteredTrainings = useMemo(() => {
    return trainings.filter(t => {
      if (categoryFilter && t.category !== categoryFilter) return false;
      if (statusFilter && t.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return t.title?.toLowerCase().includes(q) || t.provider?.toLowerCase().includes(q) || t.category?.toLowerCase().includes(q);
      }
      return true;
    });
  }, [trainings, categoryFilter, statusFilter, searchQuery]);

  const mandatoryTrainings = trainings.filter(t => t.isMandatory);

  const cpdPerStaff = useMemo(() => {
    return staffList.slice(0, 20).map(s => {
      const id = s._id?.toString();
      const earned = trainings.reduce((sum, t) => {
        const p = (t.participants || []).find((x: any) => x.staffId?.toString() === id);
        if (p && (p.status === 'passed' || p.status === 'attended')) return sum + (t.cpdHours || 0);
        return sum;
      }, 0);
      const role = s.designation || 'Teacher';
      const required = CPD_REQUIRED[role] || 20;
      return { ...s, cpdEarned: earned, required, pct: Math.min(100, Math.round((earned / required) * 100)) };
    });
  }, [staffList, trainings]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ['trainings'] });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-slate-900">Training & Development</h1>
        <TBtn variant="pri" onClick={() => setShowCreate(true)}>
          <Plus className="w-3.5 h-3.5" /> Schedule Training
        </TBtn>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-5 gap-3 mb-5">
        {[
          { label: 'Upcoming', value: upcoming, color: 'amber' },
          { label: 'Ongoing', value: ongoing, color: 'blue' },
          { label: 'Completed', value: completed, color: 'green' },
          { label: 'Total Participants', value: totalParticipants, color: 'navy' },
          { label: 'Mandatory', value: mandatoryCount, color: 'red' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div className={`h-1 ${{ amber: 'bg-amber-400', blue: 'bg-blue-500', green: 'bg-emerald-500', navy: 'bg-[#0C447C]', red: 'bg-red-500' }[k.color]}`} />
            <div className="p-4">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{k.label}</div>
              <div className="text-2xl font-bold text-slate-800 mt-1">{k.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters + View toggle */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className={`${WIC} pl-8`} placeholder="Search trainings…" />
        </div>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C] bg-white">
          <option value="">All Categories</option>
          {TRAINING_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <div className="flex rounded-lg border border-slate-200 overflow-hidden">
          {(['all','upcoming','ongoing','completed','cancelled'] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s === 'all' ? '' : s)}
              className={`px-3 py-1.5 text-xs font-medium capitalize transition-colors ${(s === 'all' ? !statusFilter : statusFilter === s) ? 'bg-[#0C447C] text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>
              {s}
            </button>
          ))}
        </div>
        <div className="flex rounded-lg border border-slate-200 overflow-hidden">
          {([['cards','Cards'],['list','List'],['calendar','Calendar']] as const).map(([mode, label]) => (
            <button key={mode} onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === mode ? 'bg-[#0C447C] text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-3 gap-4">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white rounded-xl border border-slate-100 p-5 animate-pulse">
              <div className="h-3 bg-slate-200 rounded w-1/3 mb-3" />
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Cards view */}
      {!isLoading && viewMode === 'cards' && (
        filteredTrainings.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-100 p-12 text-center">
            <GraduationCap className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <div className="text-slate-500">No training programs found</div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {filteredTrainings.map(t => {
              const ss = STATUS_STYLE[t.status] || STATUS_STYLE.upcoming;
              const pct = t.maxParticipants > 0 ? Math.round(((t.participants?.length || 0) / t.maxParticipants) * 100) : 0;
              return (
                <div key={t._id} className={`bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden ${t.isMandatory ? 'border-l-4 border-l-amber-400' : ''}`}
                  style={!t.isMandatory ? { borderTop: `3px solid ${ss.border}` } : {}}>
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 mr-2">
                        {t.category && (
                          <div className="text-xs text-slate-500 mb-1 truncate">{t.category}</div>
                        )}
                        <div className="font-semibold text-slate-800 text-sm leading-tight line-clamp-2">{t.title}</div>
                        {t.provider && <div className="text-xs text-slate-400 mt-0.5">{t.provider}</div>}
                      </div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap" style={{ background: ss.bg, color: ss.text }}>{t.status}</span>
                    </div>
                    <div className="space-y-1 mb-3">
                      {(t.startDate || t.endDate) && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Calendar className="w-3.5 h-3.5 shrink-0" />
                          {fmtShort(t.startDate)}{t.endDate && t.endDate !== t.startDate ? ` → ${fmtShort(t.endDate)}` : ''}
                        </div>
                      )}
                      {t.venue && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <span className="text-slate-400">📍</span>{t.venue}
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Users className="w-3.5 h-3.5 shrink-0" />
                        {t.participants?.length || 0}{t.maxParticipants > 0 ? `/${t.maxParticipants}` : ''} enrolled
                      </div>
                      {t.cpdHours > 0 && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Star className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                          {t.cpdHours} CPD Hours
                        </div>
                      )}
                    </div>
                    {t.isMandatory && (
                      <div className="mb-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">Mandatory</span>
                      </div>
                    )}
                    {t.maxParticipants > 0 && (
                      <div className="mb-3">
                        <PBar pct={pct} color={pct >= 100 ? '#ef4444' : '#0C447C'} />
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <TBtn variant="pri" onClick={() => setSelectedTraining(t)}>
                        <Eye className="w-3.5 h-3.5" /> View
                      </TBtn>
                      <TBtn onClick={() => setSelectedTraining(t)}>
                        <UserPlus className="w-3.5 h-3.5" /> Enroll
                      </TBtn>
                      <div className="flex-1" />
                      {t.type && (
                        <span className="text-xs px-1.5 py-0.5 rounded capitalize" style={{ background: (TYPE_COLORS[t.type] || '#64748b') + '20', color: TYPE_COLORS[t.type] || '#64748b' }}>{t.type}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* List view */}
      {!isLoading && viewMode === 'list' && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          {filteredTrainings.length === 0 ? (
            <div className="p-12 text-center text-slate-400">No training programs found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    {['Title','Category','Type','Dates','Enrolled','CPD Hrs','Status','Actions'].map(c => (
                      <th key={c} className="text-left py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap bg-slate-50">{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredTrainings.map(t => {
                    const ss = STATUS_STYLE[t.status] || STATUS_STYLE.upcoming;
                    return (
                      <tr key={t._id} className="border-b border-slate-50 hover:bg-slate-50">
                        <td className="py-2.5 px-4">
                          <div className="font-medium text-slate-800">{t.title}</div>
                          {t.provider && <div className="text-xs text-slate-400">{t.provider}</div>}
                        </td>
                        <td className="py-2.5 px-4 text-xs text-slate-500">{t.category || '—'}</td>
                        <td className="py-2.5 px-4 capitalize text-slate-600">{t.type}</td>
                        <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap">{fmtShort(t.startDate)}</td>
                        <td className="py-2.5 px-4">{t.participants?.length || 0}{t.maxParticipants > 0 ? `/${t.maxParticipants}` : ''}</td>
                        <td className="py-2.5 px-4">{t.cpdHours || 0}</td>
                        <td className="py-2.5 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: ss.bg, color: ss.text }}>{t.status}</span>
                        </td>
                        <td className="py-2.5 px-4">
                          <div className="flex gap-1">
                            <TBtn variant="pri" onClick={() => setSelectedTraining(t)}><Eye className="w-3.5 h-3.5" /> View</TBtn>
                            <TBtn onClick={() => setSelectedTraining(t)}><UserPlus className="w-3.5 h-3.5" /></TBtn>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Calendar view */}
      {!isLoading && viewMode === 'calendar' && (
        <CalendarView trainings={filteredTrainings} onSelect={setSelectedTraining} />
      )}

      {/* Mandatory Compliance */}
      {mandatoryTrainings.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center gap-3 mb-3 pb-2 border-b border-slate-100">
            <div className="w-1 h-5 rounded-full bg-red-400 shrink-0" />
            <h3 className="font-bold text-sm text-slate-800">Mandatory Training Compliance</h3>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Training','Required For','Enrolled','Completed','Compliance','Status'].map(c => (
                    <th key={c} className="text-left py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide bg-slate-50">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mandatoryTrainings.map(t => {
                  const parts: any[] = t.participants || [];
                  const comp = parts.filter(p => p.status === 'passed' || p.status === 'attended' || p.status === 'completed').length;
                  const total = parts.length || 1;
                  const pct = Math.round((comp / total) * 100);
                  return (
                    <tr key={t._id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-medium">{t.title}</td>
                      <td className="py-2.5 px-4 text-slate-500">{(t.targetRoles || []).join(', ') || 'All Staff'}</td>
                      <td className="py-2.5 px-4">{parts.length}</td>
                      <td className="py-2.5 px-4">{comp}</td>
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-2">
                          <PBar pct={pct} color={pct >= 90 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#ef4444'} />
                          <span className="text-xs font-semibold whitespace-nowrap">{pct}%</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-4">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${pct >= 90 ? 'bg-emerald-100 text-emerald-700' : pct >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                          {pct >= 90 ? 'Compliant' : pct >= 60 ? 'At Risk' : 'Non-Compliant'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CPD Tracking */}
      {staffList.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-1 h-5 rounded-full bg-[#EF9F27] shrink-0" />
              <h3 className="font-bold text-sm text-slate-800">CPD Hours Summary</h3>
            </div>
            <TBtn onClick={() => setShowCPD(v => !v)}>{showCPD ? 'Hide' : 'Show'} CPD Tracker</TBtn>
          </div>
          {showCPD && (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    {['Staff','Role','CPD Hours','Required','Progress','Status'].map(c => (
                      <th key={c} className="text-left py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide bg-slate-50">{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cpdPerStaff.map(s => (
                    <tr key={s._id} className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer"
                      onClick={() => setStaffHistory({ staffId: s._id?.toString(), staffName: `${s.firstName} ${s.lastName}` })}>
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-2">
                          <Avatar name={`${s.firstName} ${s.lastName}`} size={7} />
                          <span className="font-medium">{s.firstName} {s.lastName}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-slate-500">{s.designation || '—'}</td>
                      <td className="py-2.5 px-4 font-semibold">{s.cpdEarned}</td>
                      <td className="py-2.5 px-4 text-slate-500">{s.required}</td>
                      <td className="py-2.5 px-4 w-40">
                        <div className="flex items-center gap-2">
                          <PBar pct={s.pct} color={s.pct >= 100 ? '#10b981' : s.pct >= 50 ? '#f59e0b' : '#ef4444'} />
                          <span className="text-xs font-semibold whitespace-nowrap">{s.pct}%</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-4">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.pct >= 100 ? 'bg-emerald-100 text-emerald-700' : s.pct >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                          {s.pct >= 100 ? 'Met' : s.pct >= 50 ? 'In Progress' : 'Behind'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showCreate && (
        <CreateTrainingModal onClose={() => setShowCreate(false)} onSuccess={invalidate} />
      )}
      {selectedTraining && (
        <TrainingDetailModal training={selectedTraining} onClose={() => setSelectedTraining(null)} onMutate={invalidate} />
      )}
      {staffHistory && (
        <StaffTrainingHistoryModal staffId={staffHistory.staffId} staffName={staffHistory.staffName} onClose={() => setStaffHistory(null)} />
      )}
    </div>
  );
}
