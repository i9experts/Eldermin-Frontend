import { useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import teachingService from '../../../services/teaching.service';
import hrService from '../../../services/hr.service';
import organizationService from '../../../services/organization.service';
import academicsService from '../../../services/academics.service';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

export const GRADE_LEVELS = [
  'KG1', 'KG2',
  'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4',
  'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8',
  'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12',
];

export const COMMON_SUBJECTS = [
  'Mathematics', 'English', 'Science', 'Arabic', 'Islamic Studies',
  'Urdu', 'Physics', 'Chemistry', 'Biology', 'History',
  'Geography', 'Computer Science', 'Art', 'Physical Education', 'Music',
];

export const RESOURCES_LIST = [
  'Textbook', 'Whiteboard', 'Projector', 'Lab Equipment', 'Handouts', 'Video',
];

// ─── STYLE HELPERS ────────────────────────────────────────────────────────────

export const inputCls = [
  'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm',
  'focus:outline-none focus:ring-2 focus:ring-[#0C447C] focus:border-transparent',
  'transition-colors bg-white',
].join(' ');

export const labelCls = 'block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5';

// ─── AVATAR HELPERS ───────────────────────────────────────────────────────────

const AV_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#0891b2', '#d97706', '#0C447C'];

export function avatarColor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % AV_COLORS.length;
  return AV_COLORS[Math.abs(h)];
}

export function getInitials(first: string, last: string) {
  return `${(first ?? '')[0] ?? ''}${(last ?? '')[0] ?? ''}`.toUpperCase();
}

// ─── MODAL SHELL ──────────────────────────────────────────────────────────────

export function ModalShell({
  title, sub, onClose, children, maxWidth = 'max-w-2xl',
}: {
  title: string; sub?: string; onClose: () => void;
  children: ReactNode; maxWidth?: string;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${maxWidth} flex flex-col`} style={{ maxHeight: '92vh' }}>
        {/* Navy header */}
        <div className="bg-[#0C447C] rounded-t-2xl px-5 py-4 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-white">{title}</h2>
              {sub && <p className="text-blue-200 text-xs mt-0.5">{sub}</p>}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── FORM SECTION ─────────────────────────────────────────────────────────────

export function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-5 rounded-full bg-[#EF9F27]" />
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">{title}</span>
      </div>
      {children}
    </div>
  );
}

// ─── VISUAL CARD SELECTOR ─────────────────────────────────────────────────────

export function VisualCardSelector({
  options, value, onChange, cols = 3,
}: {
  options: { id: string; icon: string; label: string; activeClass?: string }[];
  value: string;
  onChange: (id: string) => void;
  cols?: number;
}) {
  return (
    <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {options.map(opt => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-center transition-all ${
            value === opt.id
              ? (opt.activeClass ?? 'border-[#EF9F27] bg-amber-50 text-amber-700')
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
          }`}
        >
          <span className="text-2xl leading-none">{opt.icon}</span>
          <span className="text-xs font-medium leading-tight">{opt.label}</span>
        </button>
      ))}
    </div>
  );
}

// ─── TEACHER DROPDOWN (teaching profiles) ────────────────────────────────────

export function TeacherDropdown({
  value, onSelect, label = 'Teacher',
}: {
  value: any;
  onSelect: (t: any) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const { data: teachers = [], isLoading } = useQuery({
    queryKey: ['teachers'],
    queryFn: teachingService.getTeachers,
  });

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = (teachers as any[]).filter(t =>
    `${t.firstName} ${t.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    (t.subjectsCanTeach || []).some((s: string) => s.toLowerCase().includes(search.toLowerCase()))
  );

  const initials = value ? getInitials(value.firstName, value.lastName) : '';
  const avColor = value ? avatarColor(`${value.firstName}${value.lastName}`) : '#0C447C';

  return (
    <div ref={ref} className="relative">
      <label className={labelCls}>{label}</label>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-left flex items-center justify-between hover:border-[#0C447C] focus:outline-none focus:ring-2 focus:ring-[#0C447C] transition-colors bg-white"
      >
        {value ? (
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
              style={{ background: avColor }}>
              {initials}
            </div>
            <span className="font-medium text-slate-800 truncate">{value.firstName} {value.lastName}</span>
            {(value.subjectsCanTeach || []).length > 0 && (
              <span className="text-xs text-slate-400 shrink-0 hidden sm:block">
                · {(value.subjectsCanTeach as string[]).slice(0, 2).join(', ')}
              </span>
            )}
          </div>
        ) : (
          <span className="text-slate-400">
            {isLoading ? 'Loading teachers...' : 'Select teacher...'}
          </span>
        )}
        <svg className={`w-4 h-4 text-slate-400 shrink-0 ml-2 transition-transform ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or subject…"
              className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]"
            />
          </div>
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                {(teachers as any[]).length === 0
                  ? 'No teacher profiles yet — create them in the Teachers tab'
                  : 'No matches found'}
              </div>
            ) : filtered.map((t: any) => (
              <button
                key={t._id}
                type="button"
                onClick={() => { onSelect(t); setSearch(''); setOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 text-left transition-colors border-b border-slate-50 last:border-0"
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{ background: avatarColor(`${t.firstName}${t.lastName}`) }}>
                  {getInitials(t.firstName, t.lastName)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-800">{t.firstName} {t.lastName}</div>
                  <div className="text-xs text-slate-400 truncate">
                    {(t.subjectsCanTeach || []).join(', ') || t.designation || '—'}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── HR STAFF DROPDOWN ────────────────────────────────────────────────────────

export function HRStaffDropdown({
  value, onSelect, label = 'Link HR Staff Record',
}: {
  value: any;
  onSelect: (staff: any) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const { data: staffList = [], isLoading } = useQuery({
    queryKey: ['hr-staff'],
    queryFn: hrService.getStaff,
  });

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = (staffList as any[]).filter(s =>
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    (s.designation ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (s.department ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={ref} className="relative">
      <label className={labelCls}>{label}</label>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-left flex items-center justify-between hover:border-[#0C447C] focus:outline-none focus:ring-2 focus:ring-[#0C447C] transition-colors bg-white"
      >
        {value ? (
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
              style={{ background: avatarColor(`${value.firstName}${value.lastName}`) }}>
              {getInitials(value.firstName, value.lastName)}
            </div>
            <span className="font-medium text-slate-800 truncate">{value.firstName} {value.lastName}</span>
            <span className="text-xs text-slate-400 shrink-0 hidden sm:block">· {value.designation || value.department || ''}</span>
          </div>
        ) : (
          <span className="text-slate-400">
            {isLoading ? 'Loading HR staff…' : 'Search HR staff record…'}
          </span>
        )}
        <svg className={`w-4 h-4 text-slate-400 shrink-0 ml-2 transition-transform ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, designation, department…"
              className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]"
            />
          </div>
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                {(staffList as any[]).length === 0 ? 'No HR staff records found' : 'No matches'}
              </div>
            ) : filtered.map((s: any) => (
              <button
                key={s._id}
                type="button"
                onClick={() => { onSelect(s); setSearch(''); setOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 text-left transition-colors border-b border-slate-50 last:border-0"
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{ background: avatarColor(`${s.firstName}${s.lastName}`) }}>
                  {getInitials(s.firstName, s.lastName)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-800">{s.firstName} {s.lastName}</div>
                  <div className="text-xs text-slate-400 truncate">
                    {[s.designation, s.department].filter(Boolean).join(' · ') || '—'}
                  </div>
                </div>
                {s.employeeId && (
                  <span className="text-xs text-slate-300 shrink-0">{s.employeeId}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SUBJECT DROPDOWN ─────────────────────────────────────────────────────────

export function SubjectDropdown({
  subjects, value, onChange, label = 'Subject',
}: {
  subjects?: string[];
  value: string;
  onChange: (v: string) => void;
  label?: string;
}) {
  // Real subjects from the Academics module - previously fell back to a
  // generic hardcoded list (COMMON_SUBJECTS) whenever a caller didn't
  // explicitly pass real ones in, which was the actual behavior everywhere
  // this was used in Timetable.
  const { data: realSubjects = [] } = useQuery({
    queryKey: ['subjects-for-dropdown'],
    queryFn: () => academicsService.getSubjects(),
    enabled: !subjects || subjects.length === 0,
  });
  const opts = subjects && subjects.length > 0
    ? subjects
    : (realSubjects as any[]).map((s: any) => s.name);
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} className={inputCls}>
        <option value="">Select subject…</option>
        {opts.map((s: string) => <option key={s} value={s}>{s}</option>)}
      </select>
      {opts.length === 0 && (
        <p className="text-xs text-amber-600 mt-1">No subjects set up yet — add them in Academics → Subjects.</p>
      )}
    </div>
  );
}

// ─── CAMPUS DROPDOWN (real Campuses data) ──────────────────────────────────────

export function useRealCampuses() {
  return useQuery({ queryKey: ['campuses-for-dropdown'], queryFn: () => organizationService.getCampuses() });
}

export function CampusDropdown({
  value, onChange, label = 'Campus',
}: {
  value: string;
  onChange: (v: string) => void;
  label?: string;
}) {
  const { data: campuses = [] } = useRealCampuses();
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} className={inputCls}>
        <option value="">All campuses</option>
        {(campuses as any[]).map((c: any) => <option key={c._id} value={c._id}>{c.name}</option>)}
      </select>
    </div>
  );
}

// ─── GRADE LEVEL DROPDOWN (real Classes & Sections data) ──────────────────────

export function useRealGrades(campusId?: string) {
  return useQuery({ queryKey: ['grades-for-dropdown', campusId], queryFn: () => organizationService.getGrades(campusId) });
}

export function GradeLevelDropdown({
  value, onChange, label = 'Grade Level', campusId,
}: {
  value: string;
  onChange: (v: string) => void;
  label?: string;
  campusId?: string;
}) {
  const { data: grades = [] } = useRealGrades(campusId);
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} className={inputCls}>
        <option value="">Select grade…</option>
        {(grades as any[]).map((g: any) => <option key={g._id} value={g.name}>{g.name}{g.wing ? ` (${g.wing})` : ''}</option>)}
      </select>
      {(grades as any[]).length === 0 && (
        <p className="text-xs text-amber-600 mt-1">{campusId ? 'No classes set up yet for this campus' : 'No classes set up yet'} — add them in Institution Setup → Classes & Sections.</p>
      )}
    </div>
  );
}

// ─── SECTION DROPDOWN (real, cascading from the selected grade) ───────────────

export function SectionDropdown({
  gradeLevel, value, onChange, label = 'Section', campusId,
}: {
  gradeLevel: string;
  value: string;
  onChange: (v: string) => void;
  label?: string;
  campusId?: string;
}) {
  const { data: grades = [] } = useRealGrades(campusId);
  const grade = (grades as any[]).find((g: any) => g.name === gradeLevel);
  const sections = grade?.sections || [];
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} className={inputCls} disabled={!gradeLevel}>
        <option value="">{gradeLevel ? 'Select section…' : 'Select a grade first'}</option>
        {sections.map((s: any) => <option key={s._id} value={s.name}>{s.name}</option>)}
      </select>
      {gradeLevel && sections.length === 0 && (
        <p className="text-xs text-amber-600 mt-1">No sections found for {gradeLevel} — add them in Institution Setup → Classes & Sections.</p>
      )}
    </div>
  );
}

// ─── ROOM DROPDOWN (real Room registry) ────────────────────────────────────────

export function RoomDropdown({
  value, onChange, label = 'Room',
}: {
  value: string;
  onChange: (v: string) => void;
  label?: string;
}) {
  const { data: rooms = [] } = useQuery({ queryKey: ['rooms'], queryFn: () => teachingService.getRooms() });
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} className={inputCls}>
        <option value="">No room / TBD</option>
        {(rooms as any[]).map((r: any) => <option key={r._id} value={r.name}>{r.name}{r.capacity ? ` (${r.capacity} seats)` : ''}</option>)}
      </select>
      {(rooms as any[]).length === 0 && (
        <p className="text-xs text-slate-400 mt-1">No rooms set up yet — add them in the Rooms tab, or type a room name freely for now.</p>
      )}
    </div>
  );
}

// ─── GRADE CHECKBOX GRID ──────────────────────────────────────────────────────

export function GradeCheckboxGrid({
  selected, onChange,
}: {
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  function toggle(g: string) {
    onChange(selected.includes(g) ? selected.filter(s => s !== g) : [...selected, g]);
  }
  return (
    <div className="grid grid-cols-4 gap-2">
      {GRADE_LEVELS.map(g => (
        <label key={g} className="flex items-center gap-2 cursor-pointer group">
          <input
            type="checkbox"
            checked={selected.includes(g)}
            onChange={() => toggle(g)}
            className="w-3.5 h-3.5 rounded border-slate-300 text-[#0C447C] focus:ring-[#0C447C] focus:ring-offset-0"
          />
          <span className="text-xs text-slate-700 group-hover:text-slate-900">{g}</span>
        </label>
      ))}
    </div>
  );
}

// ─── SUBJECT CHECKBOX GRID ────────────────────────────────────────────────────

export function SubjectCheckboxGrid({
  selected, onChange,
}: {
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const [custom, setCustom] = useState('');

  function toggle(s: string) {
    onChange(selected.includes(s) ? selected.filter(x => x !== s) : [...selected, s]);
  }

  function addCustom() {
    const trimmed = custom.trim();
    if (trimmed && !selected.includes(trimmed)) {
      onChange([...selected, trimmed]);
    }
    setCustom('');
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        {COMMON_SUBJECTS.map(s => (
          <label key={s} className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={selected.includes(s)}
              onChange={() => toggle(s)}
              className="w-3.5 h-3.5 rounded border-slate-300 text-[#0C447C] focus:ring-[#0C447C] focus:ring-offset-0"
            />
            <span className="text-xs text-slate-700 group-hover:text-slate-900 leading-tight">{s}</span>
          </label>
        ))}
      </div>
      {/* Custom subject input */}
      <div className="flex gap-2 items-center">
        <input
          value={custom}
          onChange={e => setCustom(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustom())}
          placeholder="Add custom subject…"
          className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#0C447C]"
        />
        {custom.trim() && (
          <button
            type="button"
            onClick={addCustom}
            className="px-3 py-1.5 bg-[#EF9F27] text-white text-xs rounded-lg font-medium hover:bg-amber-600 transition-colors"
          >
            Add
          </button>
        )}
      </div>
      {/* Selected tags */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {selected.map(s => (
            <span
              key={s}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-medium"
            >
              {s}
              <button
                type="button"
                onClick={() => toggle(s)}
                className="hover:text-amber-900 font-bold leading-none"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
