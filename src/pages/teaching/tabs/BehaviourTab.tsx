import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import teachingService from '../../../services/teaching.service';
import studentsService from '../../../services/students.service';
import {
  ModalShell, FormSection, TeacherDropdown,
  inputCls, labelCls, avatarColor, getInitials,
} from './shared';

// ─── BEHAVIOUR TYPE CARDS ─────────────────────────────────────────────────────

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

const TYPE_BORDER: Record<string, string> = {
  positive: 'border-emerald-400',
  concern:  'border-amber-400',
  serious:  'border-red-400',
  resolved: 'border-slate-300',
};

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

  const { data: results = [], isFetching } = useQuery({
    queryKey: ['student-search', debounced],
    queryFn: () => studentsService.getStudents({ search: debounced }),
    enabled: debounced.length >= 2,
  });

  const students = results as any[];

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
            {students.length === 0 && !isFetching ? (
              <div className="p-4 text-center text-xs text-slate-400">No students found for "{debounced}"</div>
            ) : students.map((s: any) => (
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

// ─── ADD BEHAVIOUR MODAL ──────────────────────────────────────────────────────

interface BehaviourForm {
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
}

const EMPTY: BehaviourForm = {
  studentName: '', admissionNo: '', gradeLevel: '', sectionName: '',
  reportedById: '', reportedByName: '',
  incidentDate: new Date().toISOString().split('T')[0],
  type: 'concern', note: '', actionTaken: '',
  parentNotified: false, followUpRequired: false, followUpNote: '',
};

const MAX_NOTE = 500;

function AddBehaviourModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<BehaviourForm>(EMPTY);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  const mut = useMutation({
    mutationFn: (payload: Omit<BehaviourForm, 'reportedById' | 'followUpNote'>) =>
      teachingService.createBehaviourNote(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['behaviour'] });
      toast.success('Behaviour note added');
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

  function handleSubmit() {
    const { reportedById, followUpNote, ...payload } = form;
    const finalPayload = form.followUpRequired
      ? { ...payload, actionTaken: form.actionTaken || followUpNote }
      : payload;
    mut.mutate(finalPayload);
  }

  const canSubmit = form.studentName && form.note.trim() && !mut.isPending;

  return (
    <ModalShell title="Add Behaviour Note" sub="Record a student behaviour observation" onClose={onClose} maxWidth="max-w-2xl">
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

        {/* Section 2: Incident Type */}
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

        {/* Section 3: Incident Details */}
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
          <TeacherDropdown
            value={form.reportedByName ? { firstName: form.reportedByName.split(' ')[0], lastName: form.reportedByName.split(' ').slice(1).join(' '), subjectsCanTeach: [] } : null}
            onSelect={handleTeacherSelect}
            label="Reported By (Teacher)"
          />
        </FormSection>

        {/* Section 4: Note */}
        <FormSection title="Observation Note">
          <div className="relative">
            <textarea
              value={form.note}
              onChange={e => {
                if (e.target.value.length <= MAX_NOTE)
                  setForm(p => ({ ...p, note: e.target.value }));
              }}
              rows={4}
              placeholder="Describe the behaviour in detail…"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0C447C] resize-y"
            />
            <div className={`text-right text-xs mt-1 ${form.note.length > MAX_NOTE * 0.9 ? 'text-amber-600' : 'text-slate-400'}`}>
              {form.note.length} / {MAX_NOTE}
            </div>
          </div>
        </FormSection>

        {/* Section 5: Actions */}
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
            Add Behaviour Note
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

// ─── BEHAVIOUR TAB ────────────────────────────────────────────────────────────

export function TeachingBehaviourTab() {
  const [showAdd, setShowAdd] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['behaviour', typeFilter],
    queryFn: () => teachingService.getBehaviourNotes(typeFilter ? { type: typeFilter } : {}),
  });

  const noteList = notes as any[];

  const counts = TYPES.reduce<Record<string, number>>((acc, t) => {
    acc[t.id] = noteList.filter(n => n.type === t.id).length;
    return acc;
  }, {});

  return (
    <div>
      {showAdd && <AddBehaviourModal onClose={() => setShowAdd(false)} />}

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Behaviour & Tarbiyah Notes</h1>
          <p className="text-sm text-slate-500 mt-0.5">{noteList.length} note{noteList.length !== 1 ? 's' : ''} recorded</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="px-4 py-2 bg-[#0C447C] text-white text-sm font-medium rounded-lg hover:bg-[#0b3d6e] transition-colors flex items-center gap-1.5"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
          Add Note
        </button>
      </div>

      {/* Type filter strip */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        <button
          onClick={() => setTypeFilter('')}
          className={`px-3 py-1.5 text-xs rounded-lg font-medium whitespace-nowrap border transition-colors ${
            typeFilter === '' ? 'bg-slate-700 text-white border-slate-700' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
          }`}
        >
          All ({noteList.length})
        </button>
        {TYPES.map(t => (
          <button
            key={t.id}
            onClick={() => setTypeFilter(typeFilter === t.id ? '' : t.id)}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium whitespace-nowrap border transition-colors flex items-center gap-1.5 ${
              typeFilter === t.id
                ? `${TYPE_STYLE[t.id]} border-current`
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
            }`}
          >
            {t.icon} {t.label} ({counts[t.id] ?? 0})
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <svg className="animate-spin w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
            <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          Loading behaviour notes…
        </div>
      ) : noteList.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-16 text-center">
          <div className="text-5xl mb-4">📝</div>
          <div className="font-semibold text-slate-700 text-lg mb-1">No behaviour notes yet</div>
          <div className="text-sm text-slate-400 mb-5">Record positive and concern notes to track student behaviour</div>
          <button onClick={() => setShowAdd(true)}
            className="px-4 py-2 bg-[#0C447C] text-white text-sm font-medium rounded-lg hover:bg-[#0b3d6e] transition-colors">
            Add First Note
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {noteList.map((n: any) => {
            const typeStyle = TYPE_STYLE[n.type] || 'bg-slate-100 text-slate-600 border-slate-200';
            const borderStyle = TYPE_BORDER[n.type] || 'border-slate-300';
            const typeInfo = TYPES.find(t => t.id === n.type);
            return (
              <div key={n._id}
                className={`bg-white border border-slate-100 border-l-4 ${borderStyle} rounded-xl p-4 shadow-sm`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-semibold text-slate-800 text-sm">{n.studentName}</div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {[n.gradeLevel, n.sectionName].filter(Boolean).join(' ')}
                      {n.admissionNo ? ` · ${n.admissionNo}` : ''}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 border rounded-full text-xs font-medium ${typeStyle}`}>
                      {typeInfo?.icon} {n.type}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed mb-3">{n.note}</p>

                {n.actionTaken && (
                  <div className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2 mb-2">
                    <span className="font-semibold">Action: </span>{n.actionTaken}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-3">
                    {n.reportedByName && <span>{n.reportedByName}</span>}
                    {n.parentNotified && <span className="text-emerald-600 font-medium">✓ Parent notified</span>}
                    {n.followUpRequired && <span className="text-amber-600 font-medium">⚠ Follow-up</span>}
                  </div>
                  {n.incidentDate && (
                    <span>{new Date(n.incidentDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
