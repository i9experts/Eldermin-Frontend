import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import teachingService from '../../../services/teaching.service';
import studentsService from '../../../services/students.service';
import {
  ModalShell, FormSection, TeacherDropdown, HRStaffDropdown,
  inputCls, labelCls, avatarColor, getInitials,
} from './shared';

// ─── INCIDENT TYPE CARDS (unchanged axis - what kind of incident this is) ─────

const TYPES = [
  {
    id: 'positive', icon: '🌟', label: 'Positive',
    activeClass: 'border-emerald-500 bg-emerald-50 text-emerald-700',
  },
  {
    id: 'concern', icon: '⚠️', label: 'Concern',
    activeClass: 'border-amber-500 bg-amber-50 text-amber-700',
  },
  {
    id: 'serious', icon: '🚨', label: 'Serious',
    activeClass: 'border-red-500 bg-red-50 text-red-700',
  },
  {
    id: 'resolved', icon: '✅', label: 'Resolved',
    activeClass: 'border-slate-400 bg-slate-50 text-slate-600',
  },
];

const TYPE_STYLE: Record<string, string> = {
  positive: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  concern:  'bg-amber-50 text-amber-700 border-amber-200',
  serious:  'bg-red-50 text-red-700 border-red-200',
  resolved: 'bg-slate-100 text-slate-600 border-slate-200',
};

// ─── STATUS (the complaint's own lifecycle - separate axis from Incident Type) ─

const STATUSES = [
  { id: 'open',        label: 'Open' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'resolved',    label: 'Resolved' },
  { id: 'closed',      label: 'Closed' },
];

const STATUS_STYLE: Record<string, string> = {
  open:        'bg-red-50 text-red-700 border-red-200',
  in_progress: 'bg-amber-50 text-amber-700 border-amber-200',
  resolved:    'bg-emerald-50 text-emerald-700 border-emerald-200',
  closed:      'bg-slate-100 text-slate-500 border-slate-200',
};

// ─── CATEGORY / COMPLAINANT TYPE ───────────────────────────────────────────────

const CATEGORIES = [
  { id: 'academic',        label: 'Academic' },
  { id: 'conduct',         label: 'Conduct' },
  { id: 'bullying_safety', label: 'Bullying / Safety' },
  { id: 'attendance',      label: 'Attendance' },
  { id: 'facility',        label: 'Facility' },
  { id: 'communication',   label: 'Communication' },
  { id: 'other',           label: 'Other' },
];

const COMPLAINANT_TYPES = [
  { id: 'parent',  label: 'Parent' },
  { id: 'teacher', label: 'Teacher' },
  { id: 'staff',   label: 'Staff' },
  { id: 'student', label: 'Student' },
  { id: 'other',   label: 'Other' },
];

function categoryLabel(id?: string) { return CATEGORIES.find(c => c.id === id)?.label || '—'; }
function statusLabel(id?: string) { return STATUSES.find(s => s.id === id)?.label || 'Open'; }
function complainantLabel(id?: string) { return COMPLAINANT_TYPES.find(c => c.id === id)?.label || ''; }

// ─── STUDENT SEARCH INPUT ─────────────────────────────────────────────────────

function StudentSearch({ onSelect }: { onSelect: (s: any) => void }) {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 350);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    setOpen(debounced.length >= 2);
  }, [debounced]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // GET /students always returns { data, meta } - never a bare array - so
  // the raw query result must be unwrapped before being treated as a list
  // (see IdCardModal.tsx for the same shape handled the same way). Using
  // the unwrapped value directly as the query's `data` default means a
  // still-loading/zero-result response never reaches `.map`/`.length` as
  // anything but an array, which is what was crashing the whole app before.
  const { data: students = [], isFetching } = useQuery({
    queryKey: ['student-search', debounced],
    queryFn: async () => {
      const res = await studentsService.getStudents({ search: debounced });
      return Array.isArray(res) ? res : (res as any)?.data ?? [];
    },
    enabled: debounced.length >= 2,
  });

  return (
    <div ref={ref} className="relative">
      <label className={labelCls}>Search Student *</label>
      <div className="relative">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Type name or admission number…"
          className={inputCls}
        />
        {isFetching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <svg className="animate-spin w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
              <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          </div>
        )}
      </div>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden">
          <div className="max-h-52 overflow-y-auto">
            {(students as any[]).length === 0 && !isFetching ? (
              <div className="p-4 text-center text-xs text-slate-400">No students found for "{debounced}"</div>
            ) : (students as any[]).map((s: any) => (
              <button
                key={s._id}
                type="button"
                onClick={() => {
                  onSelect(s);
                  setQuery(`${s.firstName} ${s.lastName}`);
                  setOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 text-left transition-colors border-b border-slate-50 last:border-0"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{ background: avatarColor(`${s.firstName}${s.lastName}`) }}
                >
                  {getInitials(s.firstName, s.lastName)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-800">{s.firstName} {s.lastName}</div>
                  <div className="text-xs text-slate-400">
                    {[s.admissionNo, s.gradeLevel, s.sectionName].filter(Boolean).join(' · ')}
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

// ─── ADD COMPLAINT MODAL ──────────────────────────────────────────────────────

interface ComplaintForm {
  studentName: string;
  admissionNo: string;
  gradeLevel: string;
  sectionName: string;
  reportedById: string;
  reportedByName: string;
  incidentDate: string;
  type: string;
  note: string;
  actionTaken: string;
  parentNotified: boolean;
  followUpRequired: boolean;
  followUpNote: string;
  complainantType: string;
  complainantName: string;
  category: string;
  assignedTo: string;
  assignedToName: string;
}

const EMPTY: ComplaintForm = {
  studentName: '', admissionNo: '', gradeLevel: '', sectionName: '',
  reportedById: '', reportedByName: '',
  incidentDate: new Date().toISOString().split('T')[0],
  type: 'concern', note: '', actionTaken: '',
  parentNotified: false, followUpRequired: false, followUpNote: '',
  complainantType: 'parent', complainantName: '', category: 'conduct',
  assignedTo: '', assignedToName: '',
};

const MAX_NOTE = 500;

function AddComplaintModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<ComplaintForm>(EMPTY);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  const mut = useMutation({
    mutationFn: (payload: Omit<ComplaintForm, 'reportedById' | 'followUpNote' | 'assignedToName'>) =>
      teachingService.createBehaviourNote(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['complaints'] });
      qc.invalidateQueries({ queryKey: ['behaviour'] });
      toast.success('Complaint added');
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });

  function handleStudentSelect(s: any) {
    setSelectedStudent(s);
    setForm(p => ({
      ...p,
      studentName: `${s.firstName} ${s.lastName}`,
      admissionNo: s.admissionNo || '',
      gradeLevel: s.gradeLevel || s.currentGrade || '',
      sectionName: s.sectionName || s.currentSection || '',
    }));
  }

  function handleTeacherSelect(t: any) {
    setForm(p => ({
      ...p,
      reportedById: t._id,
      reportedByName: `${t.firstName} ${t.lastName}`,
    }));
  }

  function handleAssigneeSelect(s: any) {
    setForm(p => ({ ...p, assignedTo: s._id, assignedToName: `${s.firstName} ${s.lastName}` }));
  }

  function handleSubmit() {
    const { reportedById, followUpNote, assignedToName, ...payload } = form;
    const finalPayload = form.followUpRequired
      ? { ...payload, actionTaken: form.actionTaken || followUpNote }
      : payload;
    mut.mutate(finalPayload);
  }

  const canSubmit = form.studentName && form.note.trim() && !mut.isPending;

  return (
    <ModalShell title="Add Complaint" sub="Record a complaint or behaviour observation for a student" onClose={onClose} maxWidth="max-w-2xl">
      <div className="p-6">

        {/* Section 1: Student */}
        <FormSection title="Student">
          <StudentSearch onSelect={handleStudentSelect} />

          {/* Selected student card */}
          {selectedStudent && (
            <div className="mt-3 p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                style={{ background: avatarColor(`${selectedStudent.firstName}${selectedStudent.lastName}`) }}
              >
                {getInitials(selectedStudent.firstName, selectedStudent.lastName)}
              </div>
              <div>
                <div className="font-semibold text-slate-800 text-sm">
                  {selectedStudent.firstName} {selectedStudent.lastName}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {[selectedStudent.admissionNo, selectedStudent.gradeLevel, selectedStudent.sectionName]
                    .filter(Boolean).join(' · ')}
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setSelectedStudent(null); setForm(p => ({ ...p, studentName: '', admissionNo: '', gradeLevel: '', sectionName: '' })); }}
                className="ml-auto text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>
          )}
        </FormSection>

        {/* Section 2: Complaint Details (who, what category) */}
        <FormSection title="Complaint Details">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className={labelCls}>Complainant Type</label>
              <select value={form.complainantType} onChange={e => setForm(p => ({ ...p, complainantType: e.target.value }))} className={inputCls}>
                {COMPLAINANT_TYPES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Category</label>
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className={inputCls}>
                {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls}>Complainant Name (optional)</label>
            <input
              value={form.complainantName}
              onChange={e => setForm(p => ({ ...p, complainantName: e.target.value }))}
              placeholder="e.g. the parent's name, if not a linked user"
              className={inputCls}
            />
          </div>
        </FormSection>

        {/* Section 3: Incident Type */}
        <FormSection title="Incident Type">
          <div className="grid grid-cols-4 gap-2">
            {TYPES.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setForm(p => ({ ...p, type: t.id }))}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-center transition-all ${
                  form.type === t.id ? t.activeClass : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <span className="text-2xl leading-none">{t.icon}</span>
                <span className="text-xs font-semibold">{t.label}</span>
              </button>
            ))}
          </div>
        </FormSection>

        {/* Section 4: Incident Details */}
        <FormSection title="Incident Details">
          <div className="mb-3">
            <label className={labelCls}>Incident Date *</label>
            <input
              type="date"
              value={form.incidentDate}
              onChange={e => setForm(p => ({ ...p, incidentDate: e.target.value }))}
              className={`${inputCls} max-w-[200px]`}
            />
          </div>

          {/* Reported By */}
          <div className="mb-3">
            <TeacherDropdown
              value={form.reportedByName ? { firstName: form.reportedByName.split(' ')[0], lastName: form.reportedByName.split(' ').slice(1).join(' '), subjectsCanTeach: [] } : null}
              onSelect={handleTeacherSelect}
              label="Reported By (Teacher)"
            />
          </div>

          {/* Assigned To (optional at creation - who follows this up) */}
          <HRStaffDropdown
            value={form.assignedToName ? { firstName: form.assignedToName.split(' ')[0], lastName: form.assignedToName.split(' ').slice(1).join(' ') } : null}
            onSelect={handleAssigneeSelect}
            label="Assign To (optional)"
          />
        </FormSection>

        {/* Section 5: Note */}
        <FormSection title="Observation Note">
          <div className="relative">
            <textarea
              value={form.note}
              onChange={e => {
                if (e.target.value.length <= MAX_NOTE)
                  setForm(p => ({ ...p, note: e.target.value }));
              }}
              rows={4}
              placeholder="Describe the complaint / behaviour in detail…"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0C447C] resize-y"
            />
            <div className={`text-right text-xs mt-1 ${form.note.length > MAX_NOTE * 0.9 ? 'text-amber-600' : 'text-slate-400'}`}>
              {form.note.length} / {MAX_NOTE}
            </div>
          </div>
        </FormSection>

        {/* Section 6: Actions */}
        <FormSection title="Actions & Follow-up">
          <div>
            <label className={labelCls}>Action Taken</label>
            <textarea
              value={form.actionTaken}
              onChange={e => setForm(p => ({ ...p, actionTaken: e.target.value }))}
              rows={2}
              placeholder="What action was taken or will be taken?"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0C447C] resize-y mb-3"
            />
          </div>

          <div className="flex gap-5 mb-3">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <div
                className={`w-10 h-5 rounded-full relative transition-colors ${form.parentNotified ? 'bg-emerald-500' : 'bg-slate-200'}`}
                onClick={() => setForm(p => ({ ...p, parentNotified: !p.parentNotified }))}
              >
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.parentNotified ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
              <span className="text-sm text-slate-700">Parent Notified</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <div
                className={`w-10 h-5 rounded-full relative transition-colors ${form.followUpRequired ? 'bg-amber-500' : 'bg-slate-200'}`}
                onClick={() => setForm(p => ({ ...p, followUpRequired: !p.followUpRequired }))}
              >
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.followUpRequired ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
              <span className="text-sm text-slate-700">Follow-Up Required</span>
            </label>
          </div>

          {/* Conditional follow-up description */}
          {form.followUpRequired && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <label className="block text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1.5">Follow-Up Description</label>
              <textarea
                value={form.followUpNote}
                onChange={e => setForm(p => ({ ...p, followUpNote: e.target.value }))}
                rows={2}
                placeholder="Describe what follow-up is needed and by when…"
                className="w-full border border-amber-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-y bg-white"
              />
            </div>
          )}
        </FormSection>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button onClick={onClose} type="button"
            className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="px-4 py-2 text-sm font-medium text-white bg-[#0C447C] rounded-lg hover:bg-[#0b3d6e] transition-colors disabled:opacity-40 flex items-center gap-2"
          >
            {mut.isPending && (
              <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            )}
            Add Complaint
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

// ─── COMPLAINT DETAIL / UPDATE MODAL ───────────────────────────────────────────

function ComplaintDetailModal({ complaint, onClose }: { complaint: any; onClose: () => void }) {
  const qc = useQueryClient();
  const [status, setStatus] = useState(complaint.status || 'open');
  const [assignee, setAssignee] = useState<{ firstName: string; lastName: string; _id?: string } | null>(
    complaint.assignedToName
      ? { firstName: complaint.assignedToName.split(' ')[0], lastName: complaint.assignedToName.split(' ').slice(1).join(' '), _id: complaint.assignedTo }
      : null
  );
  const [resolutionNotes, setResolutionNotes] = useState(complaint.resolutionNotes || '');

  const mut = useMutation({
    mutationFn: (payload: any) => teachingService.updateBehaviourNote(complaint._id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['complaints'] });
      qc.invalidateQueries({ queryKey: ['behaviour'] });
      toast.success('Complaint updated');
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to update'),
  });

  function handleSave() {
    mut.mutate({
      status,
      assignedTo: assignee?._id || undefined,
      assignedToName: assignee ? `${assignee.firstName} ${assignee.lastName}` : undefined,
      resolutionNotes: resolutionNotes || undefined,
    });
  }

  const typeInfo = TYPES.find(t => t.id === complaint.type);

  return (
    <ModalShell title="Complaint Details" sub={complaint.studentName} onClose={onClose} maxWidth="max-w-xl">
      <div className="p-6">
        <FormSection title="Summary">
          <div className="grid grid-cols-2 gap-3 text-sm mb-3">
            <div><span className="text-xs text-slate-400 block">Category</span>{categoryLabel(complaint.category)}</div>
            <div><span className="text-xs text-slate-400 block">Complainant</span>{complainantLabel(complaint.complainantType) || '—'}{complaint.complainantName ? ` (${complaint.complainantName})` : ''}</div>
            <div><span className="text-xs text-slate-400 block">Incident Type</span>{typeInfo?.icon} {typeInfo?.label || complaint.type}</div>
            <div><span className="text-xs text-slate-400 block">Date</span>{complaint.incidentDate ? new Date(complaint.incidentDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg text-sm text-slate-700 mb-2">{complaint.note}</div>
          {complaint.actionTaken && (
            <div className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
              <span className="font-semibold">Action: </span>{complaint.actionTaken}
            </div>
          )}
        </FormSection>

        <FormSection title="Status & Assignment">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className={labelCls}>Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)} className={inputCls}>
                {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
          </div>
          <HRStaffDropdown value={assignee} onSelect={s => setAssignee(s)} label="Assigned To" />
        </FormSection>

        <FormSection title="Resolution Notes">
          <textarea
            value={resolutionNotes}
            onChange={e => setResolutionNotes(e.target.value)}
            rows={3}
            placeholder="How was this resolved, or what's the current plan?"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0C447C] resize-y"
          />
        </FormSection>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button onClick={onClose} type="button"
            className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={mut.isPending}
            className="px-4 py-2 text-sm font-medium text-white bg-[#0C447C] rounded-lg hover:bg-[#0b3d6e] transition-colors disabled:opacity-40"
          >
            {mut.isPending ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

// ─── COMPLAINTS REGISTER TAB ────────────────────────────────────────────────────

function useDebounced(value: string, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function TeachingBehaviourTab() {
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounced(search);

  useEffect(() => { setPage(1); }, [typeFilter, statusFilter, categoryFilter, debouncedSearch, dateFrom, dateTo]);

  const { data, isLoading } = useQuery({
    queryKey: ['complaints', { typeFilter, statusFilter, categoryFilter, debouncedSearch, dateFrom, dateTo, page }],
    queryFn: () => teachingService.listComplaints({
      ...(typeFilter ? { type: typeFilter } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(categoryFilter ? { category: categoryFilter } : {}),
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(dateFrom ? { dateFrom } : {}),
      ...(dateTo ? { dateTo } : {}),
      page, limit: 20,
    }),
  });

  const complaints = (data?.data ?? []) as any[];
  const meta = data?.meta ?? { page: 1, totalPages: 1, total: 0 };

  return (
    <div>
      {showAdd && <AddComplaintModal onClose={() => setShowAdd(false)} />}
      {selected && <ComplaintDetailModal complaint={selected} onClose={() => setSelected(null)} />}

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Complaints Register</h1>
          <p className="text-sm text-slate-500 mt-0.5">{meta.total} complaint{meta.total !== 1 ? 's' : ''} recorded</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="px-4 py-2 bg-[#0C447C] text-white text-sm font-medium rounded-lg hover:bg-[#0b3d6e] transition-colors flex items-center gap-1.5"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
          Add Complaint
        </button>
      </div>

      {/* Filter bar */}
      <div className="bg-white border border-slate-100 rounded-xl p-3.5 mb-5 shadow-sm">
        <div className="flex flex-wrap gap-2 mb-3">
          <button
            onClick={() => setStatusFilter('')}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium whitespace-nowrap border transition-colors ${
              statusFilter === '' ? 'bg-slate-700 text-white border-slate-700' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
            }`}
          >
            All Status
          </button>
          {STATUSES.map(s => (
            <button
              key={s.id}
              onClick={() => setStatusFilter(statusFilter === s.id ? '' : s.id)}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium whitespace-nowrap border transition-colors ${
                statusFilter === s.id ? `${STATUS_STYLE[s.id]} border-current` : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search student name or admission no…"
            className={inputCls}
          />
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className={inputCls}>
            <option value="">All categories</option>
            {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className={inputCls} placeholder="From" />
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className={inputCls} placeholder="To" />
        </div>

        {/* Incident type quick filter strip */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          <button
            onClick={() => setTypeFilter('')}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium whitespace-nowrap border transition-colors ${
              typeFilter === '' ? 'bg-slate-700 text-white border-slate-700' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
            }`}
          >
            All Types
          </button>
          {TYPES.map(t => (
            <button
              key={t.id}
              onClick={() => setTypeFilter(typeFilter === t.id ? '' : t.id)}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium whitespace-nowrap border transition-colors flex items-center gap-1.5 ${
                typeFilter === t.id ? `${TYPE_STYLE[t.id]} border-current` : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Register table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <svg className="animate-spin w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
            <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          Loading complaints…
        </div>
      ) : complaints.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-16 text-center">
          <div className="text-5xl mb-4">📋</div>
          <div className="font-semibold text-slate-700 text-lg mb-1">No complaints found</div>
          <div className="text-sm text-slate-400 mb-5">Record a complaint or behaviour observation to start the register</div>
          <button onClick={() => setShowAdd(true)}
            className="px-4 py-2 bg-[#0C447C] text-white text-sm font-medium rounded-lg hover:bg-[#0b3d6e] transition-colors">
            Add First Complaint
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                <th className="text-left font-semibold px-4 py-2.5">Student</th>
                <th className="text-left font-semibold px-4 py-2.5">Category</th>
                <th className="text-left font-semibold px-4 py-2.5">Complainant</th>
                <th className="text-left font-semibold px-4 py-2.5">Type</th>
                <th className="text-left font-semibold px-4 py-2.5">Status</th>
                <th className="text-left font-semibold px-4 py-2.5">Assigned To</th>
                <th className="text-left font-semibold px-4 py-2.5">Date</th>
              </tr>
            </thead>
            <tbody>
              {complaints.map((c: any) => {
                const typeInfo = TYPES.find(t => t.id === c.type);
                return (
                  <tr
                    key={c._id}
                    onClick={() => setSelected(c)}
                    className="border-t border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-slate-800">{c.studentName}</div>
                      <div className="text-xs text-slate-400">
                        {[c.gradeLevel, c.sectionName].filter(Boolean).join(' ')}
                        {c.admissionNo ? ` · ${c.admissionNo}` : ''}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">{categoryLabel(c.category)}</td>
                    <td className="px-4 py-2.5 text-slate-600">
                      {complainantLabel(c.complainantType) || '—'}{c.complainantName ? ` (${c.complainantName})` : ''}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 border rounded-full text-xs font-medium ${TYPE_STYLE[c.type] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                        {typeInfo?.icon} {c.type}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center px-2 py-0.5 border rounded-full text-xs font-medium ${STATUS_STYLE[c.status || 'open']}`}>
                        {statusLabel(c.status)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">{c.assignedToName || '—'}</td>
                    <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">
                      {c.incidentDate ? new Date(c.incidentDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-xs text-slate-500">
              <span>Page {meta.page} of {meta.totalPages}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={meta.page <= 1}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                  disabled={meta.page >= meta.totalPages}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
