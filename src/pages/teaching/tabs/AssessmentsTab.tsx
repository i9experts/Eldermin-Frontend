import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import teachingService from '../../../services/teaching.service';
import {
  ModalShell, FormSection, TeacherDropdown, SubjectDropdown,
  GradeLevelDropdown, inputCls, labelCls,
} from './shared';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const ASSESSMENT_TYPES = [
  { id: 'quiz',         icon: '📝', label: 'Quiz' },
  { id: 'test',         icon: '📋', label: 'Test' },
  { id: 'lab',          icon: '🔬', label: 'Lab Work' },
  { id: 'project',      icon: '📊', label: 'Project' },
  { id: 'presentation', icon: '🎤', label: 'Presentation' },
];

const STATUS_STYLE: Record<string, string> = {
  draft:     'bg-slate-100 text-slate-600 border-slate-200',
  assigned:  'bg-blue-50 text-blue-700 border-blue-200',
  submitted: 'bg-purple-50 text-purple-700 border-purple-200',
  graded:    'bg-emerald-50 text-emerald-700 border-emerald-200',
  overdue:   'bg-red-50 text-red-700 border-red-200',
  cancelled: 'bg-slate-100 text-slate-500 border-slate-200',
};

const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft', assigned: 'Published', submitted: 'Submitted',
  graded: 'Graded', overdue: 'Overdue', cancelled: 'Cancelled',
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function Spin() {
  return (
    <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
      <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}

function fmtDate(d: string | null | undefined, fallback = '—'): string {
  if (!d) return fallback;
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function isOverdue(a: any): boolean {
  if (!a.dueDate) return false;
  if (a.status === 'graded' || a.status === 'cancelled') return false;
  return new Date(a.dueDate) < new Date();
}

function typeLabel(a: any): string {
  const key = a.type || a.assessmentType || '';
  const found = ASSESSMENT_TYPES.find(t => t.id === key);
  if (found) return `${found.icon} ${found.label}`;
  if (key) return key;
  return '—';
}

// ─── MARKING SCHEME ───────────────────────────────────────────────────────────

interface MarkRow { topic: string; marks: number }

function MarkingScheme({ rows, onChange }: { rows: MarkRow[]; onChange: (r: MarkRow[]) => void }) {
  const total = rows.reduce((s, r) => s + (Number(r.marks) || 0), 0);
  return (
    <div>
      {rows.length > 0 && (
        <div className="mb-2">
          <div className="grid grid-cols-[1fr_100px_32px] gap-2 mb-1 px-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Topic / Component</span>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Marks</span>
            <span />
          </div>
          <div className="space-y-1.5">
            {rows.map((r, i) => (
              <div key={i} className="grid grid-cols-[1fr_100px_32px] gap-2 items-center">
                <input value={r.topic}
                  onChange={e => onChange(rows.map((x, j) => j === i ? { ...x, topic: e.target.value } : x))}
                  placeholder={`e.g. Question ${i + 1}`}
                  className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0C447C]"
                />
                <input type="number" min={0} max={200} value={r.marks}
                  onChange={e => onChange(rows.map((x, j) => j === i ? { ...x, marks: parseInt(e.target.value) || 0 } : x))}
                  className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0C447C] text-center"
                />
                <button type="button" onClick={() => onChange(rows.filter((_, j) => j !== i))}
                  className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="flex items-center justify-between mt-2">
        <button type="button" onClick={() => onChange([...rows, { topic: '', marks: 10 }])}
          className="text-xs font-medium text-[#0C447C] hover:text-[#0b3d6e] flex items-center gap-1 transition-colors">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
          Add Row
        </button>
        {rows.length > 0 && (
          <div className="flex items-center gap-2 bg-[#0C447C]/5 px-3 py-1.5 rounded-lg">
            <span className="text-xs text-slate-500">Total Marks:</span>
            <span className="text-sm font-bold text-[#0C447C]">{total}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SHARED ASSESSMENT FORM BODY ──────────────────────────────────────────────

interface AssessmentForm {
  title: string; teacherName: string; teacherId: string;
  subject: string; gradeLevel: string; sectionName: string;
  assessmentType: string; assessmentDate: string;
  markingScheme: MarkRow[]; totalMarks: number;
  instructions: string; status: string;
}

const EMPTY: AssessmentForm = {
  title: '', teacherName: '', teacherId: '',
  subject: '', gradeLevel: '', sectionName: '',
  assessmentType: 'quiz', assessmentDate: '',
  markingScheme: [], totalMarks: 0,
  instructions: '', status: 'draft',
};

function AssessmentFormBody({
  form, setForm, selectedTeacher, onTeacherSelect, readonlyTeacher = false,
}: {
  form: AssessmentForm;
  setForm: React.Dispatch<React.SetStateAction<AssessmentForm>>;
  selectedTeacher: any;
  onTeacherSelect: (t: any) => void;
  readonlyTeacher?: boolean;
}) {
  const teacherSubjects: string[] = selectedTeacher?.subjectsCanTeach ?? [];
  return (
    <>
      <FormSection title="Teacher & Class">
        {readonlyTeacher
          ? <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm font-medium text-[#0C447C]">{form.teacherName || 'No teacher assigned'}</div>
          : <TeacherDropdown value={selectedTeacher} onSelect={onTeacherSelect} />}
        <div className="grid grid-cols-3 gap-3 mt-3">
          <SubjectDropdown subjects={teacherSubjects} value={form.subject} onChange={v => setForm(p => ({ ...p, subject: v }))} />
          <GradeLevelDropdown value={form.gradeLevel} onChange={v => setForm(p => ({ ...p, gradeLevel: v }))} />
          <div>
            <label className={labelCls}>Section</label>
            <input value={form.sectionName} onChange={e => setForm(p => ({ ...p, sectionName: e.target.value }))} placeholder="e.g. A, B" className={inputCls} />
          </div>
        </div>
      </FormSection>

      <FormSection title="Assessment Type">
        <div className="grid grid-cols-5 gap-2">
          {ASSESSMENT_TYPES.map(t => (
            <button key={t.id} type="button" onClick={() => setForm(p => ({ ...p, assessmentType: t.id }))}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-center transition-all ${
                form.assessmentType === t.id ? 'border-[#0C447C] bg-[#0C447C]/5 text-[#0C447C]' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}>
              <span className="text-2xl leading-none">{t.icon}</span>
              <span className="text-xs font-medium leading-tight">{t.label}</span>
            </button>
          ))}
        </div>
      </FormSection>

      <FormSection title="Assessment Details">
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className={labelCls}>Assessment Title *</label>
            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Chapter 5 Quiz — Algebra" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Assessment Date *</label>
            <input type="date" value={form.assessmentDate} onChange={e => setForm(p => ({ ...p, assessmentDate: e.target.value }))} className={inputCls} />
          </div>
        </div>
      </FormSection>

      <FormSection title="Marking Scheme">
        <MarkingScheme
          rows={form.markingScheme}
          onChange={rows => {
            const total = rows.reduce((s, r) => s + (Number(r.marks) || 0), 0);
            setForm(p => ({ ...p, markingScheme: rows, totalMarks: total }));
          }}
        />
        {form.markingScheme.length === 0 && (
          <div className="mt-1">
            <label className={labelCls}>Total Marks (if no breakdown)</label>
            <input type="number" min={0} value={form.totalMarks}
              onChange={e => setForm(p => ({ ...p, totalMarks: parseInt(e.target.value) || 0 }))}
              placeholder="e.g. 50" className={`${inputCls} max-w-[120px]`} />
          </div>
        )}
      </FormSection>

      <FormSection title="Instructions">
        <textarea value={form.instructions} onChange={e => setForm(p => ({ ...p, instructions: e.target.value }))}
          rows={3} placeholder="Instructions for students (allowed materials, time, format…)"
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0C447C] resize-y" />
      </FormSection>
    </>
  );
}

// ─── CREATE ASSESSMENT MODAL ──────────────────────────────────────────────────

function CreateAssessmentModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<AssessmentForm>(EMPTY);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);

  const mut = useMutation({
    mutationFn: (payload: any) => teachingService.createAssignment(payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['assessments'] }); toast.success('Assessment created'); onClose(); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });

  function handleTeacherSelect(t: any) {
    setSelectedTeacher(t);
    setForm(p => ({ ...p, teacherId: t._id, teacherName: `${t.firstName} ${t.lastName}`, subject: '' }));
  }

  function handleSubmit(status: string) {
    mut.mutate({ ...form, status });
  }

  const canSubmit = form.title && form.subject && form.gradeLevel && form.assessmentDate && !mut.isPending;

  return (
    <ModalShell title="Create Assessment" sub="Schedule a quiz, test, or project for a class" onClose={onClose} maxWidth="max-w-2xl">
      <div className="p-6">
        <AssessmentFormBody form={form} setForm={setForm} selectedTeacher={selectedTeacher} onTeacherSelect={handleTeacherSelect} />
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button onClick={onClose} type="button" className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">Cancel</button>
          <button type="button" onClick={() => handleSubmit('draft')} disabled={!form.title || mut.isPending}
            className="px-4 py-2 text-sm font-medium text-[#0C447C] border border-[#0C447C] rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-40">
            Save as Draft
          </button>
          <button type="button" onClick={() => handleSubmit('assigned')} disabled={!canSubmit}
            className="px-4 py-2 text-sm font-medium text-white bg-[#0C447C] rounded-lg hover:bg-[#0b3d6e] transition-colors disabled:opacity-40 flex items-center gap-2">
            {mut.isPending && <Spin />}
            Create Assessment
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

// ─── EDIT ASSESSMENT MODAL ────────────────────────────────────────────────────

function EditAssessmentModal({ assessment, onClose }: { assessment: any; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<AssessmentForm>(EMPTY);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);

  useEffect(() => {
    const dateStr = assessment.dueDate || assessment.assignedDate || assessment.assessmentDate || '';
    setForm({
      title:          assessment.title || '',
      teacherName:    assessment.teacherName || '',
      teacherId:      assessment.teacherId || '',
      subject:        assessment.subject || '',
      gradeLevel:     assessment.gradeLevel || '',
      sectionName:    assessment.sectionName || '',
      assessmentType: assessment.type || assessment.assessmentType || 'quiz',
      assessmentDate: dateStr ? new Date(dateStr).toISOString().split('T')[0] : '',
      markingScheme:  assessment.markingScheme || [],
      totalMarks:     assessment.totalMarks || 0,
      instructions:   assessment.instructions || '',
      status:         assessment.status || 'draft',
    });
  }, [assessment._id]);

  const mut = useMutation({
    mutationFn: (data: any) => teachingService.updateAssignment(assessment._id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['assessments'] }); toast.success('Assessment updated'); onClose(); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });

  function handleTeacherSelect(t: any) {
    setSelectedTeacher(t);
    setForm(p => ({ ...p, teacherId: t._id, teacherName: `${t.firstName} ${t.lastName}`, subject: '' }));
  }

  function handleSave() {
    mut.mutate({ ...form });
  }

  const canSave = form.title && !mut.isPending;

  return (
    <ModalShell title="Edit Assessment" sub={assessment.title} onClose={onClose} maxWidth="max-w-2xl">
      <div className="p-6">
        <AssessmentFormBody
          form={form} setForm={setForm}
          selectedTeacher={selectedTeacher} onTeacherSelect={handleTeacherSelect}
          readonlyTeacher={!selectedTeacher && !!form.teacherName}
        />
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button onClick={onClose} type="button" className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">Cancel</button>
          <button type="button" onClick={handleSave} disabled={!canSave}
            className="px-4 py-2 text-sm font-medium text-white bg-[#0C447C] rounded-lg hover:bg-[#0b3d6e] transition-colors disabled:opacity-40 flex items-center gap-2">
            {mut.isPending && <Spin />}
            Save Changes
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

// ─── GRADE ASSESSMENT MODAL ───────────────────────────────────────────────────

function GradeAssessmentModal({ assessment, onClose }: { assessment: any; onClose: () => void }) {
  const qc = useQueryClient();
  const [avgScore, setAvgScore] = useState<number>(assessment.avgScore || 0);
  const [submissionsCount, setSubmissionsCount] = useState<number>(assessment.submissionsCount || 0);
  const [passCount, setPassCount] = useState<number>(0);
  const [notes, setNotes] = useState('');

  const mut = useMutation({
    mutationFn: () => teachingService.updateAssignment(assessment._id, {
      avgScore, submissionsCount, status: 'graded',
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['assessments'] }); toast.success('Assessment graded'); onClose(); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });

  const pct = assessment.totalMarks > 0 ? Math.round((avgScore / assessment.totalMarks) * 100) : 0;
  const passPct = submissionsCount > 0 ? Math.round((passCount / submissionsCount) * 100) : 0;

  return (
    <ModalShell title="Grade Assessment" sub={assessment.title} onClose={onClose} maxWidth="max-w-md">
      <div className="p-6">
        {/* Summary */}
        <div className="bg-slate-50 rounded-xl p-4 mb-5 grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-xs text-slate-400 mb-0.5">Subject</div>
            <div className="text-sm font-semibold text-slate-700">{assessment.subject || '—'}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-0.5">Grade</div>
            <div className="text-sm font-semibold text-slate-700">{assessment.gradeLevel || '—'}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-0.5">Total Marks</div>
            <div className="text-sm font-semibold text-slate-700">{assessment.totalMarks || 0}</div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className={labelCls}>Average Score (out of {assessment.totalMarks || 100})</label>
            <div className="flex items-center gap-3">
              <input type="number" min={0} max={assessment.totalMarks || 100} value={avgScore}
                onChange={e => setAvgScore(parseFloat(e.target.value) || 0)} className={`${inputCls} max-w-[120px]`} />
              <span className={`text-sm font-semibold ${pct >= 60 ? 'text-emerald-600' : 'text-red-600'}`}>{pct}%</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Submissions Received</label>
              <input type="number" min={0} value={submissionsCount}
                onChange={e => setSubmissionsCount(parseInt(e.target.value) || 0)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Students Passed</label>
              <div className="flex items-center gap-2">
                <input type="number" min={0} max={submissionsCount} value={passCount}
                  onChange={e => setPassCount(parseInt(e.target.value) || 0)} className={inputCls} />
                {submissionsCount > 0 && <span className="text-xs text-slate-400 whitespace-nowrap">{passPct}% pass</span>}
              </div>
            </div>
          </div>
          <div>
            <label className={labelCls}>Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              placeholder="General remarks about this assessment's results…"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0C447C] resize-y" />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 mt-4">
          <button onClick={onClose} type="button" className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">Cancel</button>
          <button onClick={() => mut.mutate()} disabled={mut.isPending}
            className="px-4 py-2 text-sm text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-40 flex items-center gap-2">
            {mut.isPending && <Spin />}
            Save Grades
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

// ─── RESULTS MODAL ────────────────────────────────────────────────────────────

function ResultsModal({ assessment, onClose }: { assessment: any; onClose: () => void }) {
  const pct = assessment.totalMarks > 0 && assessment.avgScore > 0
    ? Math.round((assessment.avgScore / assessment.totalMarks) * 100) : 0;

  function handlePrint() {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>Results — ${assessment.title}</title>
<style>body{font-family:sans-serif;padding:24px;color:#333}h2{color:#0C447C}table{border-collapse:collapse;width:100%;margin-top:16px}td,th{border:1px solid #e5e7eb;padding:8px 12px;text-align:left;font-size:13px}th{background:#f9f9f9}@media print{body{padding:0}}</style>
</head><body>
<h2>${assessment.title}</h2>
<p style="color:#888;font-size:13px">${assessment.subject || ''} · ${assessment.gradeLevel || ''} · ${assessment.teacherName || ''}</p>
<table><tr><th>Metric</th><th>Value</th></tr>
<tr><td>Total Marks</td><td>${assessment.totalMarks || 0}</td></tr>
<tr><td>Average Score</td><td>${assessment.avgScore || 0} (${pct}%)</td></tr>
<tr><td>Submissions Received</td><td>${assessment.submissionsCount || 0}</td></tr>
<tr><td>Due Date</td><td>${assessment.dueDate ? new Date(assessment.dueDate).toLocaleDateString('en-GB') : '—'}</td></tr>
</table></body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  }

  return (
    <ModalShell title="Assessment Results" sub={assessment.title} onClose={onClose} maxWidth="max-w-md">
      <div className="p-6">
        <div className="grid grid-cols-2 gap-4 mb-5">
          {[
            { label: 'Average Score', value: `${assessment.avgScore || 0} / ${assessment.totalMarks || 0}`, sub: `${pct}%`, color: pct >= 60 ? '#1D9E75' : '#E24B4A' },
            { label: 'Submissions', value: assessment.submissionsCount || 0, color: '#0C447C' },
          ].map(s => (
            <div key={s.label} className="bg-white border border-slate-100 rounded-xl p-4 text-center" style={{ borderTop: `3px solid ${s.color}` }}>
              <div className="text-xs text-slate-400 mb-1">{s.label}</div>
              <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
              {s.sub && <div className="text-xs text-slate-500 mt-0.5">{s.sub}</div>}
            </div>
          ))}
        </div>

        {/* Score bar */}
        <div className="mb-5">
          <div className="flex justify-between text-xs text-slate-500 mb-1"><span>Class Average</span><span>{pct}%</span></div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: pct >= 60 ? '#1D9E75' : '#E24B4A' }} />
          </div>
        </div>

        <div className="bg-slate-50 rounded-xl p-4 text-sm space-y-2">
          <div className="flex justify-between"><span className="text-slate-500">Subject</span><span className="font-medium">{assessment.subject || '—'}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Grade</span><span className="font-medium">{assessment.gradeLevel || '—'}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Teacher</span><span className="font-medium">{assessment.teacherName || '—'}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Due Date</span><span className="font-medium">{fmtDate(assessment.dueDate)}</span></div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 mt-4">
          <button onClick={handlePrint} className="px-4 py-2 text-sm border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors">🖨 Download</button>
          <button onClick={onClose} className="px-4 py-2 text-sm text-white bg-[#0C447C] rounded-lg hover:bg-[#0b3d6e] transition-colors">Close</button>
        </div>
      </div>
    </ModalShell>
  );
}

// ─── EXTEND DEADLINE MODAL ────────────────────────────────────────────────────

function ExtendDeadlineModal({ assessment, onClose }: { assessment: any; onClose: () => void }) {
  const qc = useQueryClient();
  const existing = assessment.dueDate ? new Date(assessment.dueDate).toISOString().split('T')[0] : '';
  const [newDate, setNewDate] = useState(existing);

  const mut = useMutation({
    mutationFn: () => teachingService.updateAssignment(assessment._id, { dueDate: newDate, status: 'assigned' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['assessments'] }); toast.success('Deadline extended'); onClose(); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });

  return (
    <ModalShell title="Extend Deadline" sub={assessment.title} onClose={onClose} maxWidth="max-w-sm">
      <div className="p-6">
        {existing && (
          <div className="text-xs text-slate-400 mb-3">Current due date: <strong className="text-red-600">{fmtDate(assessment.dueDate)}</strong></div>
        )}
        <div>
          <label className={labelCls}>New Due Date *</label>
          <input type="date" value={newDate} min={new Date().toISOString().split('T')[0]}
            onChange={e => setNewDate(e.target.value)} className={inputCls} />
        </div>
        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 mt-4">
          <button onClick={onClose} type="button" className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">Cancel</button>
          <button onClick={() => mut.mutate()} disabled={!newDate || mut.isPending}
            className="px-4 py-2 text-sm text-white bg-[#EF9F27] rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-40 flex items-center gap-2">
            {mut.isPending && <Spin />}
            Extend
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

// ─── ASSESSMENTS TAB ──────────────────────────────────────────────────────────

export function TeachingAssessmentsTab() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate]         = useState(false);
  const [editAssessment, setEditAssessment] = useState<any>(null);
  const [gradeAssessment, setGradeAssessment] = useState<any>(null);
  const [viewResults, setViewResults]       = useState<any>(null);
  const [extendDeadline, setExtendDeadline] = useState<any>(null);

  const { data: assessments = [], isLoading } = useQuery({
    queryKey: ['assessments'],
    queryFn: () => teachingService.getAssignments({ type: 'test' }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => teachingService.updateAssignment(id, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['assessments'] });
      const msg = vars.data.status === 'assigned' ? 'Assessment published'
        : vars.data.status === 'cancelled' ? 'Assessment cancelled'
        : vars.data.status === 'graded'    ? 'Assessment closed'
        : 'Assessment updated';
      toast.success(msg);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });

  function confirmCancel(a: any) {
    if (window.confirm(`Cancel "${a.title}"? This cannot be undone.`)) {
      updateMut.mutate({ id: a._id, data: { status: 'cancelled' } });
    }
  }

  const list = assessments as any[];
  const today = new Date();

  return (
    <div>
      {showCreate      && <CreateAssessmentModal onClose={() => setShowCreate(false)} />}
      {editAssessment  && <EditAssessmentModal assessment={editAssessment} onClose={() => setEditAssessment(null)} />}
      {gradeAssessment && <GradeAssessmentModal assessment={gradeAssessment} onClose={() => setGradeAssessment(null)} />}
      {viewResults     && <ResultsModal assessment={viewResults} onClose={() => setViewResults(null)} />}
      {extendDeadline  && <ExtendDeadlineModal assessment={extendDeadline} onClose={() => setExtendDeadline(null)} />}

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Assessments</h1>
          <p className="text-sm text-slate-500 mt-0.5">{list.length} assessment{list.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-[#0C447C] text-white text-sm font-medium rounded-lg hover:bg-[#0b3d6e] transition-colors flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
          New Assessment
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-slate-400 gap-2">
          <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/>
            <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          Loading assessments…
        </div>
      ) : list.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-16 text-center">
          <div className="text-5xl mb-4">📝</div>
          <div className="font-semibold text-slate-700 text-lg mb-1">No assessments yet</div>
          <div className="text-sm text-slate-400 mb-5">Create quizzes, tests, and projects to track student progress</div>
          <button onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-[#0C447C] text-white text-sm font-medium rounded-lg hover:bg-[#0b3d6e] transition-colors">
            Create First Assessment
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Title', 'Teacher', 'Subject', 'Grade', 'Type', 'Due Date', 'Marks', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap bg-slate-50">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.map((a: any) => {
                  const statusStyle = STATUS_STYLE[a.status] ?? STATUS_STYLE.draft;
                  const overdueFlag = isOverdue(a);
                  const dueDate = a.dueDate || a.assignedDate;
                  const avgPct = a.totalMarks > 0 && a.avgScore > 0
                    ? Math.round((a.avgScore / a.totalMarks) * 100) : null;

                  return (
                    <tr key={a._id} className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${overdueFlag ? 'bg-red-50/20' : ''}`}>
                      {/* Title */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800 max-w-[180px] truncate">{a.title}</div>
                        {a.instructions && <div className="text-xs text-slate-400 max-w-[180px] truncate">{a.instructions}</div>}
                      </td>

                      {/* Teacher */}
                      <td className="py-3 px-4 text-slate-600">{a.teacherName || '—'}</td>

                      {/* Subject */}
                      <td className="py-3 px-4">
                        {a.subject && (
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-medium">{a.subject}</span>
                        )}
                      </td>

                      {/* Grade */}
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        {a.gradeLevel || '—'}
                        {a.sectionName && <span className="text-slate-400"> · {a.sectionName}</span>}
                      </td>

                      {/* Type — fixed: reads a.type (DB field), not a.assessmentType */}
                      <td className="py-3 px-4 text-slate-500 text-xs">{typeLabel(a)}</td>

                      {/* Due Date — fixed: reads a.dueDate */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {dueDate ? (
                          <div>
                            <div className={`text-xs font-medium ${overdueFlag ? 'text-red-600' : 'text-slate-600'}`}>
                              {overdueFlag && '⚠ '}{new Date(dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                            </div>
                            <div className="text-xs text-slate-400">{new Date(dueDate).getFullYear()}</div>
                          </div>
                        ) : <span className="text-slate-400">—</span>}
                      </td>

                      {/* Marks */}
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-700">{a.totalMarks || 0}</span>
                        {avgPct !== null && (
                          <div className={`text-xs ${avgPct >= 60 ? 'text-emerald-600' : 'text-red-500'}`}>Avg: {avgPct}%</div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 border rounded-full text-xs font-medium ${statusStyle}`}>
                          {STATUS_LABEL[a.status] ?? a.status}
                        </span>
                      </td>

                      {/* Actions — per status */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">

                          {/* draft */}
                          {a.status === 'draft' && (
                            <>
                              <button onClick={() => setEditAssessment(a)}
                                className="px-2.5 py-1 text-xs border border-[#0C447C] text-[#0C447C] rounded-lg hover:bg-blue-50 transition-colors">
                                Edit
                              </button>
                              <button
                                onClick={() => updateMut.mutate({ id: a._id, data: { status: 'assigned' } })}
                                disabled={updateMut.isPending}
                                className="px-2.5 py-1 text-xs bg-[#0C447C] text-white rounded-lg hover:bg-[#0b3d6e] transition-colors disabled:opacity-50">
                                Publish
                              </button>
                              <button onClick={() => confirmCancel(a)}
                                className="text-xs text-red-500 hover:text-red-700 transition-colors px-1">
                                Delete
                              </button>
                            </>
                          )}

                          {/* assigned (published) */}
                          {a.status === 'assigned' && (
                            <>
                              <button onClick={() => setGradeAssessment(a)}
                                className="px-2.5 py-1 text-xs bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                                Grade
                              </button>
                              <button
                                onClick={() => updateMut.mutate({ id: a._id, data: { status: 'graded' } })}
                                disabled={updateMut.isPending}
                                className="px-2.5 py-1 text-xs border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50">
                                Close
                              </button>
                            </>
                          )}

                          {/* graded */}
                          {a.status === 'graded' && (
                            <>
                              <button onClick={() => setViewResults(a)}
                                className="px-2.5 py-1 text-xs bg-[#0C447C] text-white rounded-lg hover:bg-[#0b3d6e] transition-colors">
                                View Results
                              </button>
                              <button onClick={() => {
                                const win = window.open('', '_blank');
                                if (win) { setViewResults(a); }
                              }}
                                className="px-2.5 py-1 text-xs border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors">
                                🖨
                              </button>
                            </>
                          )}

                          {/* overdue */}
                          {a.status === 'overdue' && (
                            <>
                              <button onClick={() => setExtendDeadline(a)}
                                className="px-2.5 py-1 text-xs border border-[#EF9F27] text-[#BA7517] rounded-lg hover:bg-amber-50 transition-colors">
                                Extend
                              </button>
                              <button
                                onClick={() => updateMut.mutate({ id: a._id, data: { status: 'graded' } })}
                                disabled={updateMut.isPending}
                                className="px-2.5 py-1 text-xs border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50">
                                Close
                              </button>
                            </>
                          )}

                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
