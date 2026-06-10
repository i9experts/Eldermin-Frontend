import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import teachingService from '../../../services/teaching.service';
import {
  ModalShell, FormSection, TeacherDropdown, SubjectDropdown,
  GradeLevelDropdown, VisualCardSelector, inputCls, labelCls,
} from './shared';

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
}

const TODAY = new Date().toISOString().split('T')[0];

const EMPTY: HWForm = {
  title: '', description: '',
  teacherName: '', teacherId: '',
  subject: '', gradeLevel: '', sectionName: '',
  type: 'homework',
  assignedDate: TODAY, dueDate: '',
  totalMarks: 10, passingMarks: 5,
  instructions: '', status: 'assigned',
};

function CreateHomeworkModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<HWForm>(EMPTY);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);

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
          <div className="grid grid-cols-3 gap-3 mt-3">
            <SubjectDropdown
              subjects={teacherSubjects}
              value={form.subject}
              onChange={v => setForm(prev => ({ ...prev, subject: v }))}
            />
            <GradeLevelDropdown
              value={form.gradeLevel}
              onChange={v => setForm(prev => ({ ...prev, gradeLevel: v }))}
            />
            <div>
              <label className={labelCls}>Section</label>
              <input
                value={form.sectionName}
                onChange={e => setForm(prev => ({ ...prev, sectionName: e.target.value }))}
                placeholder="e.g. A, B"
                className={inputCls}
              />
            </div>
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

// ─── UPDATE STATUS MODAL ──────────────────────────────────────────────────────

function UpdateStatusModal({ assignment, onClose }: { assignment: any; onClose: () => void }) {
  const qc = useQueryClient();
  const [status, setStatus] = useState(assignment.status);
  const [submissionsCount, setSubmissionsCount] = useState(assignment.submissionsCount || 0);
  const [avgScore, setAvgScore] = useState(assignment.avgScore || 0);

  const mut = useMutation({
    mutationFn: () => teachingService.updateAssignment(assignment._id, { status, submissionsCount, avgScore }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['homework'] });
      toast.success('Assignment updated');
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });

  return (
    <ModalShell title="Update Assignment" sub={assignment.title} onClose={onClose} maxWidth="max-w-sm">
      <div className="p-6 space-y-4">
        <div>
          <label className={labelCls}>Status</label>
          <div className="flex flex-col gap-2 mt-1">
            {['assigned', 'submitted', 'graded', 'overdue'].map(s => (
              <label key={s} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value={s}
                  checked={status === s}
                  onChange={() => setStatus(s)}
                  className="text-[#0C447C] focus:ring-[#0C447C]"
                />
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLE[s]}`}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className={labelCls}>Submissions Received</label>
          <input
            type="number" min={0}
            value={submissionsCount}
            onChange={e => setSubmissionsCount(parseInt(e.target.value) || 0)}
            className={inputCls}
          />
        </div>
        {(status === 'graded') && (
          <div>
            <label className={labelCls}>Average Score</label>
            <input
              type="number" min={0} max={assignment.totalMarks}
              value={avgScore}
              onChange={e => setAvgScore(parseFloat(e.target.value) || 0)}
              className={inputCls}
            />
          </div>
        )}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button onClick={onClose} type="button"
            className="px-3 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={() => mut.mutate()}
            disabled={mut.isPending}
            className="px-4 py-2 text-sm text-white bg-[#0C447C] rounded-lg hover:bg-[#0b3d6e] transition-colors disabled:opacity-40 flex items-center gap-2"
          >
            {mut.isPending && <Spin />}
            Save
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

// ─── HOMEWORK TAB ─────────────────────────────────────────────────────────────

export function TeachingHomeworkTab() {
  const [showCreate, setShowCreate] = useState(false);
  const [editAssignment, setEditAssignment] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [search, setSearch] = useState('');

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

  // Stats
  const total = list.length;
  const overdue = (homework as any[]).filter(a => a.status === 'overdue').length;
  const pending = (homework as any[]).filter(a => a.status === 'assigned').length;
  const graded = (homework as any[]).filter(a => a.status === 'graded').length;

  function isOverdue(a: any) {
    if (a.status === 'graded' || a.status === 'submitted') return false;
    if (!a.dueDate) return false;
    return new Date(a.dueDate) < new Date();
  }

  return (
    <div>
      {showCreate && <CreateHomeworkModal onClose={() => setShowCreate(false)} />}
      {editAssignment && <UpdateStatusModal assignment={editAssignment} onClose={() => setEditAssignment(null)} />}

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
            { v: 'submitted', l: 'Submitted' },
            { v: 'graded', l: 'Graded' },
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
                        <button
                          onClick={() => setEditAssignment(a)}
                          className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-600"
                        >
                          Update
                        </button>
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
