import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import teachingService from '../../../services/teaching.service';
import { safeParseLocalStorage } from '../../../lib/safeParseLocalStorage';
import {
  ModalShell, FormSection, TeacherDropdown, SubjectDropdown,
  GradeLevelDropdown, SectionDropdown, CampusDropdown, VisualCardSelector, inputCls, labelCls,
} from './shared';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';
function getAuthHeaders() {
  const token = localStorage.getItem('eldermin_token') || '';
  const schoolSlug = safeParseLocalStorage<{ slug?: string }>('eldermin_institution')?.slug || 'demo-school';
  return { Authorization: `Bearer ${token}`, 'x-school-slug': schoolSlug };
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const HW_TYPES = [
  { id: 'homework',     icon: '📝', label: 'Homework' },
  { id: 'classwork',   icon: '✏️', label: 'Classwork' },
  { id: 'project',     icon: '📊', label: 'Project' },
  { id: 'lab_work',    icon: '🔬', label: 'Lab Work' },
  { id: 'presentation',icon: '🎤', label: 'Presentation' },
  { id: 'other',       icon: '📌', label: 'Other' },
];

const STATUS_STYLE: Record<string, string> = {
  draft:     'bg-slate-100 text-slate-600 border-slate-200',
  assigned:  'bg-blue-50 text-blue-700 border-blue-200',
  submitted: 'bg-purple-50 text-purple-700 border-purple-200',
  graded:    'bg-emerald-50 text-emerald-700 border-emerald-200',
  overdue:   'bg-red-50 text-red-700 border-red-200',
};

// ─── SPINNER ──────────────────────────────────────────────────────────────────

function Spin() {
  return (
    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
      <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}

// ─── CREATE HOMEWORK MODAL ────────────────────────────────────────────────────

interface HWForm {
  title: string;
  description: string;
  teacherName: string;
  teacherId: string;
  campusId: string;
  subject: string;
  gradeLevel: string;
  sectionName: string;
  type: string;
  assignedDate: string;
  dueDate: string;
  totalMarks: number;
  passingMarks: number;
  instructions: string;
  status: string;
  attachmentS3Keys: string[];
}

const TODAY = new Date().toISOString().split('T')[0];

const EMPTY: HWForm = {
  title: '', description: '',
  teacherName: '', teacherId: '', campusId: '',
  subject: '', gradeLevel: '', sectionName: '',
  type: 'homework',
  assignedDate: TODAY, dueDate: '',
  totalMarks: 10, passingMarks: 5,
  instructions: '', status: 'assigned',
  attachmentS3Keys: [],
};

function CreateHomeworkModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<HWForm>(EMPTY);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleAttach(file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_BASE}/api/v1/upload/single/homework-attachments`, {
        method: 'POST', headers: getAuthHeaders(), body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      const body = await res.json();
      setForm((prev) => ({ ...prev, attachmentS3Keys: [...prev.attachmentS3Keys, body.data.key] }));
    } catch {
      toast.error('Attachment upload failed');
    } finally {
      setUploading(false);
    }
  }

  const mut = useMutation({
    mutationFn: (payload: HWForm) => teachingService.createAssignment(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['homework'] });
      toast.success('Assignment created');
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to create'),
  });

  function handleTeacherSelect(t: any) {
    setSelectedTeacher(t);
    setForm(prev => ({
      ...prev,
      teacherId: t._id,
      teacherName: `${t.firstName} ${t.lastName}`,
      subject: '',
    }));
  }

  function handleSubmit(status: string) {
    mut.mutate({ ...form, status });
  }

  const teacherSubjects: string[] = selectedTeacher?.subjectsCanTeach ?? [];
  const canSubmit = form.title && form.subject && form.gradeLevel && form.dueDate && !mut.isPending;

  return (
    <ModalShell
      title="Create Assignment"
      sub="Assign homework, classwork, or a project"
      onClose={onClose}
      maxWidth="max-w-2xl"
    >
      <div className="p-6">

        <FormSection title="Teacher & Class">
          <TeacherDropdown value={selectedTeacher} onSelect={handleTeacherSelect} />
          <div className="grid grid-cols-4 gap-3 mt-3">
            <CampusDropdown
              value={form.campusId}
              onChange={v => setForm(prev => ({ ...prev, campusId: v, gradeLevel: '', sectionName: '' }))}
            />
            <SubjectDropdown
              subjects={teacherSubjects}
              value={form.subject}
              onChange={v => setForm(prev => ({ ...prev, subject: v }))}
            />
            <GradeLevelDropdown
              campusId={form.campusId}
              value={form.gradeLevel}
              onChange={v => setForm(prev => ({ ...prev, gradeLevel: v, sectionName: '' }))}
            />
            <SectionDropdown
              campusId={form.campusId}
              gradeLevel={form.gradeLevel}
              value={form.sectionName}
              onChange={v => setForm(prev => ({ ...prev, sectionName: v }))}
            />
          </div>
        </FormSection>

        <FormSection title="Assignment Type">
          <VisualCardSelector
            options={HW_TYPES}
            value={form.type}
            onChange={v => setForm(prev => ({ ...prev, type: v }))}
            cols={6}
          />
        </FormSection>

        <FormSection title="Assignment Details">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="col-span-2">
              <label className={labelCls}>Title *</label>
              <input
                value={form.title}
                onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g. Exercise 5.3 — Factoring Polynomials"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Assigned Date</label>
              <input
                type="date"
                value={form.assignedDate}
                onChange={e => setForm(prev => ({ ...prev, assignedDate: e.target.value }))}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Due Date *</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={e => setForm(prev => ({ ...prev, dueDate: e.target.value }))}
                min={form.assignedDate}
                className={inputCls}
              />
            </div>
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <input
              value={form.description}
              onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of this assignment…"
              className={inputCls}
            />
          </div>
        </FormSection>

        <FormSection title="Marks">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Total Marks</label>
              <input
                type="number" min={0}
                value={form.totalMarks}
                onChange={e => setForm(prev => ({ ...prev, totalMarks: parseInt(e.target.value) || 0 }))}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Passing Marks</label>
              <input
                type="number" min={0} max={form.totalMarks}
                value={form.passingMarks}
                onChange={e => setForm(prev => ({ ...prev, passingMarks: parseInt(e.target.value) || 0 }))}
                className={inputCls}
              />
            </div>
          </div>
        </FormSection>

        <FormSection title="Instructions">
          <textarea
            value={form.instructions}
            onChange={e => setForm(prev => ({ ...prev, instructions: e.target.value }))}
            rows={3}
            placeholder="Instructions for students (format, materials allowed, submission method…)"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0C447C] resize-y"
          />
        </FormSection>

        <FormSection title="Attachments (optional)">
          <input ref={fileInputRef} type="file" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAttach(f); e.target.value = ''; }} />
          {form.attachmentS3Keys.length > 0 && (
            <div className="space-y-1.5 mb-2">
              {form.attachmentS3Keys.map((key, i) => (
                <div key={key} className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5 text-xs">
                  <span className="truncate text-slate-600">{key.split('/').pop()}</span>
                  <button type="button" onClick={() => setForm((prev) => ({ ...prev, attachmentS3Keys: prev.attachmentS3Keys.filter((_, idx) => idx !== i) }))}
                    className="text-slate-400 hover:text-red-600 ml-2">✕</button>
                </div>
              ))}
            </div>
          )}
          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
            className="w-full flex items-center justify-center gap-2 border border-dashed border-slate-300 rounded-lg py-2 text-xs text-slate-500 hover:border-[#0C447C] hover:text-[#0C447C] disabled:opacity-50">
            {uploading ? 'Uploading…' : '+ Attach a worksheet or resource file'}
          </button>
        </FormSection>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button onClick={onClose} type="button"
            className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleSubmit('draft')}
            disabled={!form.title || mut.isPending}
            className="px-4 py-2 text-sm font-medium text-[#0C447C] border border-[#0C447C] rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-40"
          >
            Save as Draft
          </button>
          <button
            type="button"
            onClick={() => handleSubmit('assigned')}
            disabled={!canSubmit}
            className="px-4 py-2 text-sm font-medium text-white bg-[#0C447C] rounded-lg hover:bg-[#0b3d6e] transition-colors disabled:opacity-40 flex items-center gap-2"
          >
            {mut.isPending && <Spin />}
            Assign to Class
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

// ─── SUBMISSION STATUS STYLE (per-student, distinct from the assignment-level one) ──

const SUB_STATUS_STYLE: Record<string, string> = {
  pending:   'bg-slate-100 text-slate-600 border-slate-200',
  submitted: 'bg-purple-50 text-purple-700 border-purple-200',
  late:      'bg-amber-50 text-amber-700 border-amber-200',
  graded:    'bg-emerald-50 text-emerald-700 border-emerald-200',
  missed:    'bg-red-50 text-red-700 border-red-200',
};

// ─── GRADING MODAL ────────────────────────────────────────────────────────────
// Replaces the old "Update Assignment" modal, which just let a teacher
// hand-type a fake submissions count and average score. This shows the
// REAL per-student roster (auto-built from the class the moment homework
// is assigned) and lets a teacher grade each submission individually,
// backed by the real AssignmentSubmission workflow.

function GradeRow({ assignmentId, submission }: { assignmentId: string; submission: any }) {
  const qc = useQueryClient();
  const [grade, setGrade] = useState(submission.grade ?? '');
  const [feedback, setFeedback] = useState(submission.feedback ?? '');
  const canGrade = submission.status === 'submitted' || submission.status === 'late' || submission.status === 'graded';

  const mut = useMutation({
    mutationFn: () => teachingService.gradeSubmission(assignmentId, submission._id, { grade: Number(grade), feedback: feedback || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['homework-submissions', assignmentId] });
      qc.invalidateQueries({ queryKey: ['homework'] });
      toast.success(`${submission.studentName} graded`);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to save grade'),
  });

  return (
    <tr className="border-b border-slate-50">
      <td className="py-2.5 px-3 font-medium text-slate-700">{submission.studentName}</td>
      <td className="py-2.5 px-3">
        <span className={`inline-flex items-center px-2 py-0.5 border rounded-full text-xs font-medium ${SUB_STATUS_STYLE[submission.status] ?? SUB_STATUS_STYLE.pending}`}>
          {submission.status}
        </span>
        {submission.submittedAt && <div className="text-[10px] text-slate-400 mt-0.5">{new Date(submission.submittedAt).toLocaleString()}</div>}
      </td>
      <td className="py-2.5 px-3 max-w-[220px]">
        {submission.textResponse && <div className="text-xs text-slate-600 truncate" title={submission.textResponse}>{submission.textResponse}</div>}
        {(submission.attachmentS3Keys || []).length > 0 && (
          <div className="text-[10px] text-slate-400 mt-0.5">{submission.attachmentS3Keys.length} attachment{submission.attachmentS3Keys.length !== 1 ? 's' : ''}</div>
        )}
        {!submission.textResponse && !(submission.attachmentS3Keys || []).length && <span className="text-xs text-slate-300 italic">Not submitted</span>}
      </td>
      <td className="py-2.5 px-3">
        <div className="flex items-center gap-1.5">
          <input type="number" min={0} max={submission.maxGrade} value={grade}
            onChange={(e) => setGrade(e.target.value)} disabled={!canGrade}
            className="w-16 border border-slate-200 rounded-lg px-2 py-1 text-xs disabled:bg-slate-50 disabled:text-slate-300" />
          <span className="text-xs text-slate-400">/ {submission.maxGrade}</span>
        </div>
      </td>
      <td className="py-2.5 px-3">
        <input value={feedback} onChange={(e) => setFeedback(e.target.value)} disabled={!canGrade}
          placeholder="Feedback (optional)"
          className="w-full border border-slate-200 rounded-lg px-2 py-1 text-xs disabled:bg-slate-50" />
      </td>
      <td className="py-2.5 px-3">
        <button onClick={() => mut.mutate()} disabled={!canGrade || grade === '' || mut.isPending}
          className="px-2.5 py-1 text-xs bg-[#0C447C] text-white rounded-lg hover:bg-[#0b3d6e] disabled:opacity-30 disabled:cursor-not-allowed">
          {mut.isPending ? '…' : submission.status === 'graded' ? 'Update' : 'Save'}
        </button>
      </td>
    </tr>
  );
}

function GradingModal({ assignment, onClose }: { assignment: any; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['homework-submissions', assignment._id],
    queryFn: () => teachingService.getSubmissions(assignment._id),
  });
  const submissions: any[] = data?.submissions || [];

  return (
    <ModalShell title="Grade Submissions" sub={assignment.title} onClose={onClose} maxWidth="max-w-4xl">
      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-10 text-slate-400 gap-2"><Spin /> Loading roster…</div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-4xl mb-3">🧑‍🎓</div>
            <div className="font-semibold text-slate-600">No students on roster</div>
            <div className="text-sm text-slate-400 mt-1">
              This can happen if the assignment is still a draft, or no active students match its class/section yet.
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-100 rounded-xl">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {['Student', 'Status', 'Submission', 'Grade', 'Feedback', ''].map((h) => (
                    <th key={h} className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {submissions.map((s) => <GradeRow key={s._id} assignmentId={assignment._id} submission={s} />)}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex justify-end pt-4 mt-2 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Close</button>
        </div>
      </div>
    </ModalShell>
  );
}

// ─── HOMEWORK TAB ─────────────────────────────────────────────────────────────

export function TeachingHomeworkTab() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [gradeAssignment, setGradeAssignment] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [search, setSearch] = useState('');

  const deleteMut = useMutation({
    mutationFn: (id: string) => teachingService.deleteAssignment(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['homework'] }); toast.success('Assignment deleted'); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to delete'),
  });

  const { data: homework = [], isLoading } = useQuery({
    queryKey: ['homework', filterStatus, filterType],
    queryFn: () => teachingService.getAssignments({
      ...(filterStatus ? { status: filterStatus } : {}),
      ...(filterType ? { type: filterType } : {}),
    }),
  });

  const list = (homework as any[]).filter(a => {
    if (!search) return true;
    return (
      a.title?.toLowerCase().includes(search.toLowerCase()) ||
      a.teacherName?.toLowerCase().includes(search.toLowerCase()) ||
      a.subject?.toLowerCase().includes(search.toLowerCase())
    );
  });

  // Stats. Assignment.status now only ever settles on 'draft' | 'assigned' |
  // 'overdue' (the daily cron sets the last one) - real per-student
  // submission/grading state lives on AssignmentSubmission instead (see
  // the Grade button), so "Graded" here means "has at least one graded
  // submission" (avgScore > 0), not a status value that no longer exists.
  const total = list.length;
  const overdue = (homework as any[]).filter(a => a.status === 'overdue').length;
  const pending = (homework as any[]).filter(a => a.status === 'assigned').length;
  const graded = (homework as any[]).filter(a => a.avgScore > 0).length;

  function isOverdue(a: any) {
    if (a.status === 'overdue') return true;
    if (!a.dueDate) return false;
    return new Date(a.dueDate) < new Date();
  }

  return (
    <div>
      {showCreate && <CreateHomeworkModal onClose={() => setShowCreate(false)} />}
      {gradeAssignment && <GradingModal assignment={gradeAssignment} onClose={() => setGradeAssignment(null)} />}

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Homework & Assignments</h1>
          <p className="text-sm text-slate-500 mt-0.5">{(homework as any[]).length} assignment{(homework as any[]).length !== 1 ? 's' : ''}{overdue > 0 ? ` · ⚠ ${overdue} overdue` : ''}</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-[#0C447C] text-white text-sm font-medium rounded-lg hover:bg-[#0b3d6e] transition-colors flex items-center gap-1.5"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
          Assign Homework
        </button>
      </div>

      {/* KPI cards */}
      {(homework as any[]).length > 0 && (
        <div className="grid grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Total', value: (homework as any[]).length, color: '#0C447C' },
            { label: 'Pending', value: pending, color: '#BA7517' },
            { label: 'Overdue', value: overdue, color: '#E24B4A' },
            { label: 'Graded', value: graded, color: '#1D9E75' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4" style={{ borderTop: `3px solid ${s.color}` }}>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{s.label}</div>
              <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Overdue alert */}
      {overdue > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5">
          <div className="font-semibold text-red-800 text-sm">
            ⚠ {overdue} assignment{overdue !== 1 ? 's are' : ' is'} overdue — students have not submitted
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by title, teacher, subject…"
          className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C] min-w-[220px]"
        />
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
          {[
            { v: '', l: 'All' },
            { v: 'assigned', l: 'Active' },
            { v: 'overdue', l: 'Overdue' },
            { v: 'draft', l: 'Draft' },
          ].map(f => (
            <button
              key={f.v}
              onClick={() => setFilterStatus(f.v)}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${filterStatus === f.v ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {f.l}
            </button>
          ))}
        </div>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0C447C]"
        >
          <option value="">All Types</option>
          {HW_TYPES.map(t => (
            <option key={t.id} value={t.id}>{t.icon} {t.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-slate-400 gap-2"><Spin /> Loading assignments…</div>
      ) : (homework as any[]).length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-16 text-center">
          <div className="text-5xl mb-4">📝</div>
          <div className="font-semibold text-slate-700 text-lg mb-1">No assignments yet</div>
          <div className="text-sm text-slate-400 mb-5">Create homework, classwork, projects, and other assignments</div>
          <button onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-[#0C447C] text-white text-sm font-medium rounded-lg hover:bg-[#0b3d6e] transition-colors">
            Create First Assignment
          </button>
        </div>
      ) : list.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-12 text-center">
          <div className="text-4xl mb-3">🔍</div>
          <div className="font-semibold text-slate-600">No matches</div>
          <div className="text-sm text-slate-400 mt-1">Try adjusting filters or search</div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Assignment', 'Teacher', 'Subject / Grade', 'Type', 'Assigned', 'Due', 'Marks', 'Submissions', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap bg-slate-50">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.map((a: any) => {
                  const typeInfo = HW_TYPES.find(t => t.id === a.type);
                  const statusStyle = STATUS_STYLE[a.status] ?? STATUS_STYLE.draft;
                  const overdueFlag = isOverdue(a);
                  const dueDateStr = a.dueDate ? new Date(a.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—';
                  const assignedStr = a.assignedDate ? new Date(a.assignedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—';
                  const avgPct = a.totalMarks > 0 && a.avgScore > 0 ? Math.round((a.avgScore / a.totalMarks) * 100) : null;
                  return (
                    <tr key={a._id} className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${overdueFlag ? 'bg-red-50/30' : ''}`}>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800 max-w-[180px] truncate">{a.title}</div>
                        {a.description && <div className="text-xs text-slate-400 max-w-[180px] truncate">{a.description}</div>}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{a.teacherName || '—'}</td>
                      <td className="py-3 px-4">
                        {a.subject && (
                          <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-xs font-medium">{a.subject}</span>
                        )}
                        {a.gradeLevel && <div className="text-xs text-slate-400 mt-0.5">{a.gradeLevel}{a.sectionName ? ` · ${a.sectionName}` : ''}</div>}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {typeInfo ? `${typeInfo.icon} ${typeInfo.label}` : (a.type || '—')}
                      </td>
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">{assignedStr}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={overdueFlag ? 'text-red-600 font-semibold' : 'text-slate-500'}>{dueDateStr}</span>
                        {overdueFlag && <div className="text-xs text-red-500">Overdue</div>}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        <div className="font-semibold">{a.totalMarks || 0}</div>
                        {avgPct !== null && <div className="text-xs text-slate-400">Avg: {avgPct}%</div>}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {a.submissionsCount || 0}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 border rounded-full text-xs font-medium ${statusStyle}`}>
                          {a.status || 'draft'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setGradeAssignment(a)}
                            className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-600"
                          >
                            Grade
                          </button>
                          <button
                            onClick={() => { if (window.confirm(`Delete "${a.title}"? This cannot be undone.`)) deleteMut.mutate(a._id); }}
                            disabled={deleteMut.isPending}
                            className="px-2.5 py-1 text-xs border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-40"
                          >
                            Delete
                          </button>
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
