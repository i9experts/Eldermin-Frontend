// ============================================================
// ASSESSMENT — MODALS + MAIN INDEX
// Eldermin ERP | React + TypeScript + Tailwind
// ============================================================

import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Save, Calendar, Plus, Trash2, CheckCircle, Send, BookOpen, ClipboardList, BarChart2, FileText, Award, TrendingUp, CheckSquare, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { safeParseLocalStorage } from '../../lib/safeParseLocalStorage';
import { ASSESSMENT_TYPES, TERMS, QUESTION_TYPES, DIFFICULTY_OPTIONS, BLOOMS_LEVELS, Assessment } from './types';
import { ModuleHeader } from '../../components/layout/ModuleHeader';
import { TabBar } from '../../components/layout/TabBar';
import { Button } from '../../components/ui/button';
import { AssessmentDashboard, PlannerTab, StatCard, StatusBadge, TypeBadge } from './DashboardPlannerTabs';
import { QuestionBankTab, MarkEntryTab, ResultsTab, AnalyticsTab } from './OtherTabs';
import PaperGenerationTab from './PaperGenerationTab';
import { useStudents } from '../../hooks/useStudents';
import { useBulkEnterMarks, useCreateAssessment, useUpdateAssessment, useUpdateAssessmentStatus, useDeleteAssessment, useGenerateReportCards, usePublishResults, useAssessmentDashboard } from '../../hooks/useAssessments';
import * as assessmentApi from '../../services/assessment.api';
import academicsService from '../../services/academics.service';
import organizationService from '../../services/organization.service';
import { useAuth } from '../../contexts/AuthContext';

// ── Shared Form Components ────────────────────────────────────
const ModalWrapper: React.FC<{ title: string; subtitle?: string; onClose: () => void; size?: 'md'|'lg'|'xl'; footer?: React.ReactNode; children: React.ReactNode }> = ({ title, subtitle, onClose, size = 'lg', footer, children }) => {
  const w = { md: 'max-w-xl', lg: 'max-w-2xl', xl: 'max-w-4xl' }[size];
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${w} max-h-[90vh] flex flex-col`} onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-800">{title}</h2>
            {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
        {footer && <div className="border-t border-gray-100 p-4 flex justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
};

const Field: React.FC<{ label: string; required?: boolean; span?: boolean; children: React.ReactNode }> = ({ label, required, span, children }) => (
  <div className={span ? 'col-span-2' : ''}>
    <label className="block text-[11px] font-semibold text-gray-500 mb-1 uppercase tracking-wide">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
  </div>
);

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input {...props} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 text-gray-700 placeholder-gray-400" />
);

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ children, ...props }) => (
  <select {...props} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 text-gray-600">{children}</select>
);

const Btn = (color: string) => ({ onClick, children, icon }: any) => (
  <button onClick={onClick} className={`flex items-center gap-1.5 ${color} text-xs px-5 py-2.5 rounded-lg font-medium transition-colors`}>
    {icon}{children}
  </button>
);

const BtnPrimary = Btn('bg-[#1e3a5f] text-white hover:bg-[#16304f]');
const BtnSecondary = Btn('border border-gray-200 text-gray-600 hover:bg-gray-50');
const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
  <div className="flex items-center gap-2 mt-4 mb-3">
    <p className="text-[10px] font-bold text-[#1e3a5f] uppercase tracking-wider">{title}</p>
    <div className="flex-1 h-px bg-gray-100" />
  </div>
);

// A date coming back from the API is a full ISO timestamp
// ("2026-03-02T00:00:00.000Z") - <input type="date"> needs just the
// yyyy-mm-dd slice or it silently refuses to show the prefilled value.
const toDateInputValue = (d?: string | null): string => (d ? String(d).slice(0, 10) : '');

const UPLOAD_API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';
function uploadAuthHeaders() {
  const token = localStorage.getItem('eldermin_token') || '';
  const schoolSlug = safeParseLocalStorage<{ slug?: string }>('eldermin_institution')?.slug || 'demo-school';
  return { Authorization: `Bearer ${token}`, 'x-school-slug': schoolSlug };
}

// ── Create / Edit Assessment Modal ────────────────────────────
// Also fixes a dead "Edit" button on the Planner tab (DashboardPlannerTabs.tsx)
// that opened a modal nothing rendered - reusing this same component for
// both create and edit means admins can now go back and adjust exam
// dates/times/venues after the fact, which a real timetable needs.
type SubjectRow = { subject: string; totalMarks: number; passingMarks: number; date: string; startTime: string; duration: number; venue: string; examPaperId: string; attemptsAllowed: number };

export const CreateAssessmentModal: React.FC<{ assessment?: any; onClose: () => void }> = ({ assessment, onClose }) => {
  const isEdit = !!assessment;
  const [subjects, setSubjects] = useState<SubjectRow[]>(
    assessment?.subjects?.length
      ? assessment.subjects.map((s: any) => ({
          subject: s.subject, totalMarks: s.totalMarks, passingMarks: s.passingMarks ?? 40,
          date: toDateInputValue(s.date), startTime: s.startTime || '', duration: s.duration ?? 180, venue: s.venue || '',
          examPaperId: s.examPaperId || '', attemptsAllowed: s.attemptsAllowed ?? 1,
        }))
      : [{ subject: '', totalMarks: 100, passingMarks: 40, date: '', startTime: '', duration: 180, venue: '', examPaperId: '', attemptsAllowed: 1 }],
  );
  const createAssessment = useCreateAssessment();
  const updateAssessment = useUpdateAssessment();
  const { data: realGrades = [] } = useQuery({ queryKey: ['grades-for-assessment'], queryFn: () => organizationService.getGrades() });
  const { data: realSubjects = [] } = useQuery({ queryKey: ['subjects-for-assessment'], queryFn: () => academicsService.getSubjects() });
  const { data: realAcademicYears = [] } = useQuery({ queryKey: ['academic-years-for-assessment'], queryFn: () => organizationService.getAcademicYears() });

  const [title, setTitle] = useState(assessment?.title || '');
  const [type, setType] = useState(assessment?.type || '');
  const [grade, setGrade] = useState(assessment?.grade || '');
  const [section, setSection] = useState(assessment?.section || '');
  const [term, setTerm] = useState(assessment?.term || '');
  const [academicYear, setAcademicYear] = useState(assessment?.academicYear || '');
  const [startDate, setStartDate] = useState(toDateInputValue(assessment?.startDate));
  // LMS Phase 2 — when online, each subject's ExamPaper (built in Paper
  // Generation, same question bank) becomes that subject's quiz, instead
  // of a teacher always entering marks by hand.
  const [deliveryMode, setDeliveryMode] = useState(assessment?.deliveryMode || 'teacher_marked');
  const { data: examPapersForGrade = [] } = useQuery({
    queryKey: ['exam-papers-for-assessment', grade],
    queryFn: () => assessmentApi.fetchExamPapers({ grade }),
    enabled: deliveryMode === 'self_paced_online' && !!grade,
  });

  useEffect(() => {
    if (!isEdit && !academicYear && (realAcademicYears as any[]).length > 0) {
      const current = (realAcademicYears as any[]).find((y: any) => y.isCurrent) || (realAcademicYears as any[])[0];
      setAcademicYear(current.name);
    }
  }, [realAcademicYears]); // eslint-disable-line react-hooks/exhaustive-deps
  const [endDate, setEndDate] = useState(toDateInputValue(assessment?.endDate));

  const saving = createAssessment.isPending || updateAssessment.isPending;

  const submit = () => {
    if (!title.trim()) { toast.error('Enter a title'); return; }
    if (!type) { toast.error('Select a type'); return; }
    if (!grade) { toast.error('Select a grade'); return; }
    if (!startDate) { toast.error('Select a start date'); return; }
    const validSubjects = subjects.filter(s => s.subject);
    if (validSubjects.length === 0) { toast.error('Configure at least one subject'); return; }

    if (deliveryMode === 'self_paced_online' && validSubjects.some(s => !s.examPaperId)) {
      toast.error('Link a quiz paper to every subject, or switch that subject\'s assessment back to Teacher-Marked');
      return;
    }

    const payload = {
      title, type, grade,
      section: section || undefined,
      academicYear,
      term: term || undefined,
      deliveryMode,
      subjects: validSubjects.map(s => ({ ...s, examPaperId: s.examPaperId || undefined })),
      startDate,
      endDate: endDate || undefined,
    };

    if (isEdit) {
      updateAssessment.mutate({ id: assessment._id, data: payload }, {
        onSuccess: () => { toast.success('Assessment updated'); onClose(); },
        onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to update assessment'),
      });
    } else {
      createAssessment.mutate(payload, {
        onSuccess: () => { toast.success('Assessment created'); onClose(); },
        onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to create assessment'),
      });
    }
  };

  return (
    <ModalWrapper title={isEdit ? 'Edit Assessment' : 'Create New Assessment'} onClose={onClose} size="xl"
      footer={<><BtnSecondary onClick={onClose}>Cancel</BtnSecondary><BtnPrimary onClick={submit} icon={<Save size={12} />}>{saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Assessment'}</BtnPrimary></>}>
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Title" required span><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Mid Term Examination 2025" /></Field>
          <Field label="Type" required>
            <Select value={type} onChange={e => setType(e.target.value)}>
              <option value="">Select Type</option>{ASSESSMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Select>
          </Field>
          <Field label="Grade" required>
            <Select value={grade} onChange={e => { setGrade(e.target.value); setSection(''); }}>
              <option value="">Select Grade</option>{(realGrades as any[]).map((g: any) => <option key={g._id} value={g.name}>{g.name}</option>)}
            </Select>
          </Field>
          <Field label="Section">
            <Select value={section} onChange={e => setSection(e.target.value)}>
              <option value="">All Sections</option>
              {((realGrades as any[]).find((g: any) => g.name === grade)?.sections || []).map((s: any) => <option key={s._id} value={s.name}>{s.name}</option>)}
            </Select>
          </Field>
          <Field label="Term">
            <Select value={term} onChange={e => setTerm(e.target.value)}>
              <option value="">Select Term</option>{TERMS.map(t => <option key={t} value={t}>{t}</option>)}
            </Select>
          </Field>
          <Field label="Academic Year">
            <Select value={academicYear} onChange={e => setAcademicYear(e.target.value)}>
              <option value="">Select Year</option>
              {(realAcademicYears as any[]).map((y: any) => <option key={y._id} value={y.name}>{y.name}</option>)}
            </Select>
          </Field>
          <Field label="Start Date" required><Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></Field>
          <Field label="End Date"><Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} /></Field>
          <Field label="Delivery" span>
            <div className="flex gap-2">
              <button type="button" onClick={() => setDeliveryMode('teacher_marked')}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium border ${deliveryMode === 'teacher_marked' ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]' : 'border-gray-200 text-gray-600'}`}>
                Teacher-Marked (default)
              </button>
              <button type="button" onClick={() => setDeliveryMode('self_paced_online')}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium border ${deliveryMode === 'self_paced_online' ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]' : 'border-gray-200 text-gray-600'}`}>
                Self-Paced Online Quiz
              </button>
            </div>
            {deliveryMode === 'self_paced_online' && (
              <p className="text-[10px] text-gray-400 mt-1">
                Link each subject below to a quiz paper (built in Assessments → Paper Generation) - students take it themselves in Parent Portal, and MCQ/True-False questions grade automatically.
              </p>
            )}
          </Field>
        </div>

        <SectionHeader title="Subjects Configuration" />
        <p className="text-[10px] text-gray-400 -mt-2 mb-1">Date, time and venue per subject are what "Generate Timetable" prints - fill these in to get a real schedule, not just a subject list.</p>
        {subjects.map((s, i) => (
          <div key={i} className="p-3 bg-gray-50 rounded-xl space-y-2">
            <div className="grid grid-cols-6 gap-2 items-end">
              <div className="col-span-2">
                <p className="text-[10px] text-gray-500 mb-1">Subject</p>
                <Select value={s.subject} onChange={e => setSubjects(prev => prev.map((x, j) => j === i ? { ...x, subject: e.target.value } : x))}>
                  <option value="">Select Subject</option>
                  {(realSubjects as any[]).map((sub: any) => <option key={sub._id} value={sub.name}>{sub.name}</option>)}
                </Select>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 mb-1">Total Marks</p>
                <Input type="number" value={s.totalMarks} onChange={e => setSubjects(prev => prev.map((x, j) => j === i ? { ...x, totalMarks: +e.target.value } : x))} />
              </div>
              <div>
                <p className="text-[10px] text-gray-500 mb-1">Passing</p>
                <Input type="number" value={s.passingMarks} onChange={e => setSubjects(prev => prev.map((x, j) => j === i ? { ...x, passingMarks: +e.target.value } : x))} />
              </div>
              <div>
                <p className="text-[10px] text-gray-500 mb-1">Date</p>
                <Input type="date" value={s.date} onChange={e => setSubjects(prev => prev.map((x, j) => j === i ? { ...x, date: e.target.value } : x))} />
              </div>
              <div className="flex items-end">
                <button onClick={() => setSubjects(prev => prev.filter((_, j) => j !== i))}
                  className="p-2 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={13} /></button>
              </div>
            </div>
            <div className="grid grid-cols-6 gap-2 items-end">
              <div>
                <p className="text-[10px] text-gray-500 mb-1">Start Time</p>
                <Input type="time" value={s.startTime} onChange={e => setSubjects(prev => prev.map((x, j) => j === i ? { ...x, startTime: e.target.value } : x))} />
              </div>
              <div>
                <p className="text-[10px] text-gray-500 mb-1">Duration (min)</p>
                <Input type="number" value={s.duration} onChange={e => setSubjects(prev => prev.map((x, j) => j === i ? { ...x, duration: +e.target.value } : x))} />
              </div>
              <div className="col-span-2">
                <p className="text-[10px] text-gray-500 mb-1">Venue / Room</p>
                <Input value={s.venue} placeholder="e.g. Hall A, Room 12" onChange={e => setSubjects(prev => prev.map((x, j) => j === i ? { ...x, venue: e.target.value } : x))} />
              </div>
            </div>
            {deliveryMode === 'self_paced_online' && (
              <div className="grid grid-cols-6 gap-2 items-end pt-1 border-t border-gray-100">
                <div className="col-span-4">
                  <p className="text-[10px] text-gray-500 mb-1">Quiz Paper (from Paper Generation)</p>
                  <Select value={s.examPaperId} onChange={e => setSubjects(prev => prev.map((x, j) => j === i ? { ...x, examPaperId: e.target.value } : x))}>
                    <option value="">Select a paper…</option>
                    {(examPapersForGrade as any[]).filter((p: any) => p.subject === s.subject).map((p: any) => (
                      <option key={p._id} value={p._id}>{p.title} ({p.questionCount} questions, {p.totalMarks} marks)</option>
                    ))}
                  </Select>
                  {s.subject && (examPapersForGrade as any[]).filter((p: any) => p.subject === s.subject).length === 0 && (
                    <p className="text-[10px] text-amber-600 mt-0.5">No papers found for {s.subject} / {grade} yet - create one in Paper Generation first.</p>
                  )}
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] text-gray-500 mb-1">Attempts Allowed</p>
                  <Input type="number" min={1} value={s.attemptsAllowed} onChange={e => setSubjects(prev => prev.map((x, j) => j === i ? { ...x, attemptsAllowed: +e.target.value } : x))} />
                </div>
              </div>
            )}
          </div>
        ))}
        <button onClick={() => setSubjects(prev => [...prev, { subject: '', totalMarks: 100, passingMarks: 40, date: '', startTime: '', duration: 180, venue: '', examPaperId: '', attemptsAllowed: 1 }])}
          className="flex items-center gap-1.5 text-xs text-[#1e3a5f] font-medium hover:underline mt-1">
          <Plus size={12} /> Add Subject
        </button>
      </div>
    </ModalWrapper>
  );
};

// ── Bulk Mark Entry Modal ──────────────────────────────────────
// This is the actual fix for "student list not showing anywhere in
// Assessment" — the Enter Marks button previously opened this modal by
// name, but no component existed for it at all; nothing rendered, the
// button did literally nothing visible.
type MarkRow = { studentId: string; studentName: string; rollNumber: string; section?: string; obtainedMarks?: number; isAbsent?: boolean; isExempt?: boolean; remarks?: string };

export const BulkMarkEntryModal: React.FC<{ data?: any; onClose: () => void }> = ({ data, onClose }) => {
  const { assessmentId, subject, grade, section, totalMarks, passingMarks } = data || {};
  const { data: studentsData, isLoading: studentsLoading } = useStudents(
    grade ? { grade, section: section || undefined, status: 'active', limit: 100 } : undefined,
  );
  const students = studentsData?.data ?? [];
  const bulkEnterMarks = useBulkEnterMarks();

  const [rows, setRows] = useState<MarkRow[]>([]);

  useEffect(() => {
    setRows(students.map((s: any) => ({
      studentId: s._id,
      studentName: `${s.firstName || ''} ${s.lastName || ''}`.trim(),
      rollNumber: s.currentRollNumber || '',
      section: s.currentSection,
    })));
  }, [studentsData]); // eslint-disable-line react-hooks/exhaustive-deps

  const setRow = (studentId: string, patch: Partial<MarkRow>) =>
    setRows(prev => prev.map(r => r.studentId === studentId ? { ...r, ...patch } : r));

  const submit = () => {
    const marks = rows.filter(r => r.obtainedMarks !== undefined || r.isAbsent || r.isExempt);
    if (marks.length === 0) { toast.error('Enter marks (or mark absent/exempt) for at least one student'); return; }
    const invalid = marks.find(m => m.obtainedMarks !== undefined && totalMarks && m.obtainedMarks > totalMarks);
    if (invalid) { toast.error(`${invalid.studentName}'s marks can't exceed the total (${totalMarks})`); return; }
    bulkEnterMarks.mutate(
      { assessmentId, subject, grade, marks },
      {
        onSuccess: () => { toast.success(`Saved marks for ${marks.length} student(s)`); onClose(); },
        onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to save marks'),
      },
    );
  };

  return (
    <ModalWrapper
      title="Enter Marks"
      subtitle={`${subject} — ${grade}${section ? ` (${section})` : ''}${totalMarks ? ` · Total: ${totalMarks}` : ''}`}
      onClose={onClose}
      size="xl"
      footer={<>
        <BtnSecondary onClick={onClose}>Cancel</BtnSecondary>
        <BtnPrimary onClick={submit} icon={<Save size={13} />}>{bulkEnterMarks.isPending ? 'Saving…' : 'Save Marks'}</BtnPrimary>
      </>}
    >
      {!grade ? (
        <p className="text-sm text-gray-400 text-center py-10">Select an assessment and subject first.</p>
      ) : studentsLoading ? (
        <p className="text-sm text-gray-400 text-center py-10">Loading students…</p>
      ) : rows.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-sm font-semibold text-gray-600">No active students found for {grade}{section ? ` — ${section}` : ''}</p>
          <p className="text-xs text-gray-400 mt-1">Enroll students in this grade/section first, then come back to enter marks.</p>
        </div>
      ) : (
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 text-gray-500 border-b border-gray-100 sticky top-0">
              <th className="py-2 px-3 text-left font-semibold">Roll #</th>
              <th className="py-2 px-3 text-left font-semibold">Student</th>
              <th className="py-2 px-3 text-center font-semibold">Marks {totalMarks ? `(/ ${totalMarks})` : ''}</th>
              <th className="py-2 px-3 text-center font-semibold">Absent</th>
              <th className="py-2 px-3 text-center font-semibold">Exempt</th>
              <th className="py-2 px-3 text-left font-semibold">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.studentId} className="border-b border-gray-50">
                <td className="py-1.5 px-3 text-gray-500">{r.rollNumber || '—'}</td>
                <td className="py-1.5 px-3 font-medium text-gray-800">{r.studentName}</td>
                <td className="py-1.5 px-3 text-center">
                  <input type="number" min={0} max={totalMarks} value={r.obtainedMarks ?? ''}
                    disabled={r.isAbsent || r.isExempt}
                    onChange={e => setRow(r.studentId, { obtainedMarks: e.target.value === '' ? undefined : Number(e.target.value) })}
                    className="w-20 border border-gray-200 rounded-lg px-2 py-1 text-center text-xs disabled:bg-gray-50 disabled:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20" />
                </td>
                <td className="py-1.5 px-3 text-center">
                  <input type="checkbox" checked={!!r.isAbsent}
                    onChange={e => setRow(r.studentId, { isAbsent: e.target.checked, obtainedMarks: e.target.checked ? undefined : r.obtainedMarks })}
                    className="w-3.5 h-3.5 accent-amber-500" />
                </td>
                <td className="py-1.5 px-3 text-center">
                  <input type="checkbox" checked={!!r.isExempt}
                    onChange={e => setRow(r.studentId, { isExempt: e.target.checked, obtainedMarks: e.target.checked ? undefined : r.obtainedMarks })}
                    className="w-3.5 h-3.5 accent-gray-400" />
                </td>
                <td className="py-1.5 px-3">
                  <input value={r.remarks ?? ''} onChange={e => setRow(r.studentId, { remarks: e.target.value })}
                    placeholder="optional"
                    className="w-full border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </ModalWrapper>
  );
};

// ── Add Question Modal ────────────────────────────────────────
export const AddQuestionModal: React.FC<{ onClose: () => void; question?: any }> = ({ onClose, question }) => {
  const isEdit = !!question;
  const queryClient = useQueryClient();
  const [qType, setQType] = useState(question?.type || 'mcq');
  const [subject, setSubject] = useState(question?.subject || '');
  const [grade, setGrade] = useState(question?.grade || '');
  const [topic, setTopic] = useState(question?.topic || '');
  const [chapter, setChapter] = useState(question?.chapter || '');
  const [difficulty, setDifficulty] = useState(question?.difficulty || 'medium');
  const [bloomsLevel, setBloomsLevel] = useState(question?.bloomsLevel || 'understand');
  const [marks, setMarks] = useState(question?.marks || 1);
  const [questionText, setQuestionText] = useState(question?.questionText || '');
  const [modelAnswer, setModelAnswer] = useState(question?.correctAnswer || '');
  const [tags, setTags] = useState((question?.tags || []).join(', '));
  const [questionImage, setQuestionImage] = useState(question?.questionImage || '');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [answerLines, setAnswerLines] = useState(question?.answerLines ?? '');
  const imageInputRef = useRef<HTMLInputElement>(null);

  async function handleImageUpload(file: File) {
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${UPLOAD_API_BASE}/api/v1/upload/single/question-images`, {
        method: 'POST', headers: uploadAuthHeaders(), body: formData,
      });
      if (!res.ok) {
        // Surfaces the server's own error (e.g. "File too large", a
        // storage misconfiguration) instead of a generic message that
        // hides what actually went wrong - this was previously swallowed
        // entirely, so a real failure gave no way to diagnose it.
        let detail = '';
        try { detail = (await res.json())?.message; } catch { /* body wasn't JSON */ }
        throw new Error(detail || `Upload failed (${res.status})`);
      }
      const body = await res.json();
      setQuestionImage(body.data.url);
    } catch (err: any) {
      console.error('Question image upload failed:', err);
      toast.error(err?.message || 'Image upload failed');
    } finally {
      setUploadingImage(false);
    }
  }
  const [options, setOptions] = useState<{ text: string; isCorrect: boolean }[]>(
    question?.options?.length ? question.options : [{ text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }],
  );
  const [aiSuggestion, setAiSuggestion] = useState<{ bloomsLevel: string; reasoning: string } | null>(null);
  const [classifying, setClassifying] = useState(false);

  // A teacher only sees the subjects/grades their own Teaching Profile
  // was actually assigned - an admin (or anyone else) still sees the
  // whole school's master list, exactly as before.
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';
  const { data: realSubjects = [] } = useQuery({ queryKey: ['subjects-for-questions', isTeacher], queryFn: () => academicsService.getSubjects(isTeacher ? { assignedOnly: 'true' } : undefined) });
  const { data: realGrades = [] } = useQuery({ queryKey: ['grades-for-questions', isTeacher], queryFn: () => organizationService.getGrades(undefined, isTeacher) });

  const payload = {
    subject, grade, topic: topic || undefined, chapter: chapter || undefined,
    type: qType, bloomsLevel, difficulty, marks,
    questionText,
    questionImage: questionImage || undefined,
    answerLines: answerLines === '' ? undefined : Number(answerLines),
    options: qType === 'mcq' ? options.filter((o: any) => o.text.trim()) : undefined,
    // Backend's CreateQuestionDto/Question schema field is `correctAnswer`
    // - was previously sent as `modelAnswer`, which the global
    // ValidationPipe's whitelist:true silently stripped (no error, no
    // sign anything was wrong), so every short/fill-blank/long/true-false
    // question ever saved through this form had its answer key discarded.
    correctAnswer: (qType === 'short' || qType === 'fill_blank' || qType === 'long' || qType === 'true_false') ? modelAnswer || undefined : undefined,
    tags: tags.split(',').map((t: string) => t.trim()).filter(Boolean),
  };

  const createQuestionMut = useMutation({
    mutationFn: () => assessmentApi.createQuestion(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments', 'questions'] });
      toast.success('Question saved to bank');
      onClose();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to save question'),
  });

  const updateQuestionMut = useMutation({
    mutationFn: () => assessmentApi.updateQuestion(question._id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments', 'questions'] });
      toast.success('Question updated');
      onClose();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update question'),
  });

  async function handleAiClassify() {
    if (!questionText.trim()) { toast.error('Enter the question text first'); return; }
    setClassifying(true);
    setAiSuggestion(null);
    try {
      const result = await assessmentApi.classifyBloomsLevel({
        questionText, questionType: qType,
        options: qType === 'mcq' ? options.map(o => o.text).filter(Boolean) : undefined,
      });
      if (result.bloomsLevel) {
        setAiSuggestion({ bloomsLevel: result.bloomsLevel, reasoning: result.reasoning });
      } else {
        toast(result.note || 'Could not classify this question confidently', { icon: 'ℹ️' });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'AI classification failed');
    } finally {
      setClassifying(false);
    }
  }

  function acceptAiSuggestion() {
    if (aiSuggestion) {
      setBloomsLevel(aiSuggestion.bloomsLevel);
      setAiSuggestion(null);
    }
  }

  function handleSave() {
    if (!subject || !grade || !questionText.trim()) { toast.error('Subject, Grade, and Question Text are required'); return; }
    if (isEdit) updateQuestionMut.mutate();
    else createQuestionMut.mutate();
  }
  const saving = createQuestionMut.isPending || updateQuestionMut.isPending;

  return (
    <ModalWrapper title={isEdit ? 'Edit Question' : 'Add Question to Bank'} onClose={onClose} size="lg"
      footer={<><BtnSecondary onClick={onClose}>Cancel</BtnSecondary><BtnPrimary icon={<Save size={12} />} onClick={handleSave}>{saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Save Question'}</BtnPrimary></>}>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Subject" required>
            <Select value={subject} onChange={e => setSubject(e.target.value)}>
              <option value="">Select</option>{(realSubjects as any[]).map((s: any) => <option key={s._id} value={s.name}>{s.name}</option>)}
            </Select>
          </Field>
          <Field label="Grade" required>
            <Select value={grade} onChange={e => setGrade(e.target.value)}>
              <option value="">Select</option>{(realGrades as any[]).map((g: any) => <option key={g._id} value={g.name}>{g.name}</option>)}
            </Select>
          </Field>
          <Field label="Topic"><Input placeholder="e.g. Algebra, Grammar" value={topic} onChange={e => setTopic(e.target.value)} /></Field>
          <Field label="Chapter"><Input placeholder="e.g. Chapter 3" value={chapter} onChange={e => setChapter(e.target.value)} /></Field>
          <Field label="Question Type" required>
            <Select value={qType} onChange={e => setQType(e.target.value)}>
              {QUESTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Select>
          </Field>
          <Field label="Difficulty">
            <Select value={difficulty} onChange={e => setDifficulty(e.target.value)}>
              <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
            </Select>
          </Field>
          <Field label="Bloom's Level">
            <div className="flex gap-1.5">
              <Select value={bloomsLevel} onChange={e => setBloomsLevel(e.target.value)} className="flex-1">
                {BLOOMS_LEVELS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
              </Select>
              <button
                type="button"
                onClick={handleAiClassify}
                disabled={classifying || !questionText.trim()}
                className="text-[10px] px-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 whitespace-nowrap"
                title="Suggest Bloom's Level from the question text"
              >
                {classifying ? '…' : '✨ AI'}
              </button>
            </div>
            {aiSuggestion && (
              <div className="mt-1.5 bg-blue-50 border border-blue-200 rounded-lg p-2">
                <p className="text-[10px] text-blue-800">
                  Suggested: <strong>{BLOOMS_LEVELS.find(b => b.value === aiSuggestion.bloomsLevel)?.label}</strong> — {aiSuggestion.reasoning}
                </p>
                <div className="flex gap-2 mt-1">
                  <button type="button" onClick={acceptAiSuggestion} className="text-[10px] text-blue-700 font-semibold hover:underline">Accept</button>
                  <button type="button" onClick={() => setAiSuggestion(null)} className="text-[10px] text-gray-500 hover:underline">Dismiss</button>
                </div>
              </div>
            )}
          </Field>
          <Field label="Marks"><Input type="number" value={marks} onChange={e => setMarks(Number(e.target.value) || 1)} /></Field>
        </div>
        <Field label="Question Text" required span>
          <textarea rows={3} value={questionText} onChange={e => setQuestionText(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 text-gray-700 resize-none" placeholder="Enter the question..." />
          <p className="text-[10px] text-gray-400 mt-1">A blank line here prints as a real gap on the paper - use it to separate "attempt one of two options" alternatives.</p>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Picture (optional)">
            <input ref={imageInputRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); e.target.value = ''; }} />
            {questionImage ? (
              <div className="flex items-center gap-2">
                <img src={questionImage} alt="Question" className="h-12 w-16 object-cover rounded-lg border border-gray-200" />
                <button type="button" onClick={() => setQuestionImage('')} className="text-[10px] text-red-500 hover:underline">Remove</button>
              </div>
            ) : (
              <button type="button" onClick={() => imageInputRef.current?.click()} disabled={uploadingImage}
                className="w-full border border-dashed border-gray-300 rounded-lg py-2 text-[10px] text-gray-500 hover:border-[#1e3a5f] hover:text-[#1e3a5f] disabled:opacity-50">
                {uploadingImage ? 'Uploading…' : '+ Attach a picture'}
              </button>
            )}
          </Field>
          <Field label="Answer Lines (optional)">
            <Input type="number" min={0} placeholder="Auto" value={answerLines}
              onChange={e => setAnswerLines(e.target.value === '' ? '' : Number(e.target.value))} />
            <p className="text-[10px] text-gray-400 mt-1">Leave blank to size automatically from marks/type - set a higher number for a longer composition.</p>
          </Field>
        </div>
        {qType === 'mcq' && (
          <div>
            <SectionHeader title="Answer Options" />
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2 mb-2">
                <input type="radio" name="correct" checked={opt.isCorrect}
                  onChange={() => setOptions(prev => prev.map((o, j) => ({ ...o, isCorrect: j === i })))}
                  className="flex-shrink-0" />
                <Input placeholder={`Option ${String.fromCharCode(65 + i)}`}
                  value={opt.text} onChange={e => setOptions(prev => prev.map((o, j) => j === i ? { ...o, text: e.target.value } : o))} />
              </div>
            ))}
            <p className="text-[10px] text-gray-400">Select the radio button next to the correct answer</p>
          </div>
        )}
        {(qType === 'short' || qType === 'fill_blank' || qType === 'long') && (
          <Field label="Model Answer">
            <textarea rows={qType === 'long' ? 4 : 2} value={modelAnswer} onChange={e => setModelAnswer(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none resize-none text-gray-700" placeholder="Expected correct answer..." />
          </Field>
        )}
        {qType === 'true_false' && (
          <Field label="Correct Answer">
            <div className="flex gap-2">
              {['True', 'False'].map(v => (
                <button key={v} type="button" onClick={() => setModelAnswer(v)}
                  className={`px-4 py-1.5 text-xs rounded-lg border ${modelAnswer === v ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                  {v}
                </button>
              ))}
            </div>
          </Field>
        )}
        <Field label="Tags (comma separated)">
          <Input placeholder="e.g. algebra, equations, grade9" value={tags} onChange={e => setTags(e.target.value)} />
        </Field>
      </div>
    </ModalWrapper>
  );
};

// ── Generate Report Cards Modal ───────────────────────────────
export const GenerateReportCardsModal: React.FC<{ assessment?: Assessment; onClose: () => void }> = ({ assessment, onClose }) => {
  const { data: assessmentsData } = useQuery({ queryKey: ['assessments', 'list'], queryFn: () => assessmentApi.fetchAssessments() });
  const assessments: Assessment[] = assessmentsData?.data ?? [];
  const [assessmentId, setAssessmentId] = useState(assessment?._id || '');
  const generateMut = useGenerateReportCards();

  function handleGenerate() {
    if (!assessmentId) { toast.error('Select an assessment first'); return; }
    generateMut.mutate({ assessmentId }, {
      onSuccess: () => { toast.success('Report cards generated'); onClose(); },
      onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to generate report cards'),
    });
  }

  const selected = assessment || assessments.find(a => a._id === assessmentId);

  return (
    <ModalWrapper title="Generate Report Cards" subtitle={selected?.title} onClose={onClose} size="md"
      footer={<><BtnSecondary onClick={onClose}>Cancel</BtnSecondary><BtnPrimary icon={<FileText size={12} />} onClick={handleGenerate}>{generateMut.isPending ? 'Generating…' : 'Generate Now'}</BtnPrimary></>}>
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
          <CheckCircle size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-blue-800">
            <p className="font-semibold mb-1">Before generating report cards:</p>
            <ul className="space-y-0.5 list-disc list-inside text-blue-700">
              <li>All marks must be entered for all subjects</li>
              <li>Marks should be verified by subject teachers</li>
              <li>Class positions will be calculated automatically</li>
            </ul>
          </div>
        </div>
        {!assessment && (
          <Field label="Select Assessment" required>
            <Select value={assessmentId} onChange={e => setAssessmentId(e.target.value)}>
              <option value="">Select</option>
              {assessments.map(a => <option key={a._id} value={a._id}>{a.title} — {a.grade}{a.section ? ` (${a.section})` : ''}</option>)}
            </Select>
          </Field>
        )}
        {selected && (
          <div className="bg-gray-50 rounded-xl p-4 space-y-1">
            <p className="text-xs font-semibold text-gray-700">{selected.title}</p>
            <p className="text-[10px] text-gray-500">{selected.grade} · {selected.type} · {selected.startDate}</p>
            <p className="text-[10px] text-gray-500">{selected.subjects.length} subjects configured</p>
          </div>
        )}
      </div>
    </ModalWrapper>
  );
};

// ── Publish Results Modal ─────────────────────────────────────
export const PublishResultsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { data: assessmentsData } = useQuery({ queryKey: ['assessments', 'list'], queryFn: () => assessmentApi.fetchAssessments() });
  const assessments: Assessment[] = assessmentsData?.data ?? [];
  const [assessmentId, setAssessmentId] = useState('');
  const publishMut = usePublishResults();

  function handlePublish() {
    if (!assessmentId) { toast.error('Select an assessment first'); return; }
    publishMut.mutate({ assessmentId }, {
      onSuccess: () => { toast.success('Results published'); onClose(); },
      onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to publish results'),
    });
  }

  return (
    <ModalWrapper title="Publish Results" onClose={onClose} size="md"
      footer={<><BtnSecondary onClick={onClose}>Cancel</BtnSecondary>
        <button onClick={handlePublish} disabled={publishMut.isPending}
          className="flex items-center gap-1.5 bg-emerald-600 text-white text-xs px-5 py-2.5 rounded-lg hover:bg-emerald-700 font-medium disabled:opacity-50">
          <Send size={12} /> {publishMut.isPending ? 'Publishing…' : 'Publish Now'}
        </button></>}>
      <div className="space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <CheckCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800">Publishing results will make them visible to parents and students via their dashboards. This action cannot be undone.</p>
        </div>
        <Field label="Select Assessment" required>
          <Select value={assessmentId} onChange={e => setAssessmentId(e.target.value)}>
            <option value="">Select</option>
            {assessments.map(a => <option key={a._id} value={a._id}>{a.title} — {a.grade}{a.section ? ` (${a.section})` : ''}</option>)}
          </Select>
        </Field>
      </div>
    </ModalWrapper>
  );
};

// ── View Assessment Modal ──────────────────────────────────────
// Fixes a dead "View" button on the Planner tab - onOpenModal('viewAssessment', a)
// set the modal flag and selectedData, but nothing ever rendered in
// response, so clicking it visibly did nothing. Read-only: all the data
// it needs is already on the Assessment object the Planner card passed in.
export const ViewAssessmentModal: React.FC<{ assessment: Assessment; onClose: () => void }> = ({ assessment: a, onClose }) => {
  const fmtDate = (d?: string | null) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  return (
    <ModalWrapper
      title={a.title}
      subtitle={`${a.grade}${a.section ? ' - ' + a.section : ''} · ${a.term || 'No Term'} · ${a.academicYear}`}
      onClose={onClose} size="lg"
      footer={<BtnSecondary onClick={onClose}>Close</BtnSecondary>}
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <TypeBadge type={a.type} />
          <StatusBadge status={a.status} />
        </div>
        {a.description && (
          <div>
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Description</p>
            <p className="text-xs text-gray-600">{a.description}</p>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div><p className="text-gray-400">Start Date</p><p className="font-semibold text-gray-700 mt-0.5">{fmtDate(a.startDate)}</p></div>
          <div><p className="text-gray-400">End Date</p><p className="font-semibold text-gray-700 mt-0.5">{fmtDate(a.endDate)}</p></div>
          <div><p className="text-gray-400">Results Published</p><p className="font-semibold text-gray-700 mt-0.5">{a.resultPublished ? 'Yes' : 'No'}</p></div>
          <div><p className="text-gray-400">Report Cards Generated</p><p className="font-semibold text-gray-700 mt-0.5">{a.gradeCardsGenerated ? 'Yes' : 'No'}</p></div>
        </div>
        <div>
          <SectionHeader title={`Subjects (${a.subjects.length})`} />
          <div className="space-y-1.5">
            {a.subjects.map(s => (
              <div key={s.subject} className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs">
                <span className="font-medium text-gray-700">{s.subject}</span>
                <span className="text-gray-400">Total {s.totalMarks} · Pass {s.passingMarks}{s.date ? ` · ${fmtDate(s.date)}` : ''}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
};

// ── Confirm Action Modal ───────────────────────────────────────
// Fixes a dead "Activate"/"Start"/"Complete"/"Cancel"/"Delete" set of
// buttons on the Planner tab - onOpenModal('confirmAction', { assessment, action })
// set the modal flag, but with nothing rendering for it the status update
// (or delete) never actually fired, which is exactly why clicking
// "Activate" left the card showing "Draft" forever.
const CONFIRM_ACTION_STATUS: Record<string, string> = {
  Activate: 'scheduled', Start: 'ongoing', Complete: 'completed', Cancel: 'cancelled',
};
const CONFIRM_ACTION_MESSAGE: Record<string, string> = {
  Activate: 'This moves the assessment from Draft to Scheduled, publishing its timetable to teachers and students.',
  Start: 'This marks the assessment as Ongoing and opens mark entry for every subject in it.',
  Complete: 'This marks the assessment as Completed. Report cards can then be generated for it.',
  Cancel: 'This cancels the assessment. It will no longer appear as scheduled, and no marks can be entered against it.',
  Delete: 'This permanently deletes this draft assessment. This cannot be undone.',
};
const CONFIRM_ACTION_VERB: Record<string, string> = {
  Activate: 'activated', Start: 'started', Complete: 'marked complete', Cancel: 'cancelled', Delete: 'deleted',
};

export const ConfirmActionModal: React.FC<{ assessment: Assessment; action: string; onClose: () => void }> = ({ assessment: a, action, onClose }) => {
  const statusMut = useUpdateAssessmentStatus();
  const deleteMut = useDeleteAssessment();
  const isDelete = action === 'Delete';
  const isDestructive = isDelete || action === 'Cancel';
  const pending = isDelete ? deleteMut.isPending : statusMut.isPending;

  function handleConfirm() {
    if (isDelete) {
      deleteMut.mutate(a._id, {
        onSuccess: () => { toast.success(`"${a.title}" deleted`); onClose(); },
        onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to delete assessment'),
      });
      return;
    }
    const status = CONFIRM_ACTION_STATUS[action];
    if (!status) { toast.error(`Unknown action "${action}"`); return; }
    statusMut.mutate({ id: a._id, status }, {
      onSuccess: () => { toast.success(`"${a.title}" ${CONFIRM_ACTION_VERB[action] || 'updated'}`); onClose(); },
      onError: (err: any) => toast.error(err.response?.data?.message || `Failed to ${action.toLowerCase()} assessment`),
    });
  }

  return (
    <ModalWrapper title={`${action} Assessment`} onClose={onClose} size="md"
      footer={<>
        <BtnSecondary onClick={onClose}>Cancel</BtnSecondary>
        <button onClick={handleConfirm} disabled={pending}
          className={`flex items-center gap-1.5 text-xs px-5 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 ${isDestructive ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-[#1e3a5f] text-white hover:bg-[#16304f]'}`}>
          {pending ? 'Working…' : `${action} Assessment`}
        </button>
      </>}
    >
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-gray-800 mb-1">{a.title}</p>
          <p className="text-xs text-amber-800">{CONFIRM_ACTION_MESSAGE[action] || `Are you sure you want to ${action.toLowerCase()} this assessment?`}</p>
        </div>
      </div>
    </ModalWrapper>
  );
};

// ============================================================
// QUIZ REVIEW TAB — LMS Phase 2
// Online quizzes auto-grade MCQ/True-False at submit time; short/long/
// fill-blank/matching answers are free text and need a human - this is
// that queue. Grading one attempt here feeds straight into the same
// MarkEntry/Report Card pipeline teacher-entered marks already use
// (AssessmentService.upsertMarkEntryFromAttempt), so nothing downstream
// needs to know whether a mark came from a quiz or from Mark Entry.
// ============================================================
function QuizReviewTab() {
  const qc = useQueryClient();
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const { data: pending = [], isLoading } = useQuery({
    queryKey: ['quiz-attempts-pending-review'],
    queryFn: () => assessmentApi.fetchQuizAttemptsPendingReview(),
  });

  const { data: attempt, isLoading: attemptLoading } = useQuery({
    queryKey: ['quiz-attempt-review', reviewingId],
    queryFn: () => assessmentApi.fetchQuizAttemptForReview(reviewingId as string),
    enabled: !!reviewingId,
  });

  const [grades, setGrades] = useState<Record<string, number>>({});

  const gradeMut = useMutation({
    mutationFn: () => assessmentApi.gradeQuizAttempt(reviewingId as string, Object.entries(grades).map(([questionId, marksAwarded]) => ({ questionId, marksAwarded }))),
    onSuccess: () => {
      toast.success('Grades saved');
      qc.invalidateQueries({ queryKey: ['quiz-attempts-pending-review'] });
      setReviewingId(null); setGrades({});
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to save grades'),
  });

  if (reviewingId) {
    const pendingAnswers = (attempt?.answers || []).filter((a: any) => a.needsManualGrading);
    return (
      <div>
        <button onClick={() => { setReviewingId(null); setGrades({}); }} className="text-xs text-[#1e3a5f] hover:underline mb-3">← Back to review queue</button>
        {attemptLoading ? (
          <p className="text-sm text-gray-400 text-center py-10">Loading attempt…</p>
        ) : !attempt ? (
          <p className="text-sm text-gray-400 text-center py-10">Attempt not found.</p>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-800">{attempt.studentName} — {attempt.subject}</h2>
              <p className="text-xs text-gray-400">{attempt.assessmentTitle} · Roll #{attempt.rollNumber}</p>
            </div>
            <div className="p-5 space-y-4">
              {pendingAnswers.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">No subjective answers to grade on this attempt.</p>
              ) : pendingAnswers.map((a: any) => (
                <div key={a.questionId} className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-800 font-medium mb-1">{a.question?.questionText}</p>
                  <p className="text-xs text-gray-500 mb-2">Student's answer: <span className="text-gray-700">{a.textAnswer || <em>left blank</em>}</span></p>
                  {a.question?.correctAnswer && <p className="text-[11px] text-emerald-600 mb-2">Model answer: {a.question.correctAnswer}</p>}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-500">Marks (out of {a.question?.marks}):</span>
                    <input type="number" min={0} max={a.question?.marks}
                      value={grades[String(a.questionId)] ?? ''}
                      onChange={e => setGrades(prev => ({ ...prev, [String(a.questionId)]: +e.target.value }))}
                      className="w-20 border border-gray-200 rounded-lg px-2 py-1 text-xs text-center" />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100">
              <BtnPrimary onClick={() => gradeMut.mutate()} icon={<Save size={12} />}>
                {gradeMut.isPending ? 'Saving…' : 'Save Grades'}
              </BtnPrimary>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-base font-semibold text-gray-800">Quiz Review</h2>
        <p className="text-xs text-gray-400">Online quiz attempts with subjective answers awaiting a mark</p>
      </div>
      {isLoading ? (
        <p className="text-sm text-gray-400 text-center py-10">Loading…</p>
      ) : pending.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-16 text-center">
          <CheckSquare size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-600">Nothing to review</p>
          <p className="text-xs text-gray-400 mt-1">Every submitted quiz has either auto-graded fully or already been reviewed.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {pending.map((a: any) => (
            <div key={a._id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-800">{a.studentName} — {a.subject}</p>
                <p className="text-xs text-gray-400">{a.assessmentTitle} · submitted {a.submittedAt ? new Date(a.submittedAt).toLocaleString() : '—'}</p>
              </div>
              <button onClick={() => setReviewingId(a._id)} className="px-3 py-1.5 text-xs bg-[#1e3a5f] text-white rounded-lg hover:bg-[#16304f] font-medium">
                Review
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// MAIN INDEX — AssessmentModule
// ============================================================
// Tab badges used to be hardcoded placeholders ('3', '342', '2') left over
// from whenever this screen was first built - a brand-new school with zero
// assessments, zero questions, and zero marks entered still saw "Planner 3",
// "Question Bank 342", "Mark Entry 2", which is exactly backwards: the
// badges should reflect what's actually in the database and update the
// moment an admin adds something, not show fake activity when there is
// none. Badges are built below from the same live /assessments/dashboard
// stats the Dashboard tab already renders - TabBar hides a badge entirely
// when its count is 0/undefined, so an empty school correctly shows no
// badges at all.
const TAB_DEFS = [
  { key: 'dashboard', label: 'Dashboard', icon: BarChart2 },
  { key: 'planner', label: 'Planner', icon: Calendar },
  { key: 'questions', label: 'Question Bank', icon: BookOpen },
  { key: 'papers', label: 'Paper Generation', icon: FileText },
  { key: 'marks', label: 'Mark Entry', icon: ClipboardList },
  { key: 'quizReview', label: 'Quiz Review', icon: CheckSquare },
  { key: 'results', label: 'Results', icon: Award },
  { key: 'analytics', label: 'Analytics', icon: TrendingUp },
] as const;

type TabKey = typeof TAB_DEFS[number]['key'];

const DEFAULT_MODALS = {
  createAssessment: false, editAssessment: false, viewAssessment: false,
  addQuestion: false, editQuestion: false, deleteQuestion: false,
  bulkMarkEntry: false, verifyMarks: false,
  generateReportCards: false, viewReportCard: false,
  publishResults: false, confirmAction: false,
};

const AssessmentModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [modals, setModals] = useState(DEFAULT_MODALS);
  const [selectedData, setSelectedData] = useState<any>(null);

  const { data: dashboardData } = useAssessmentDashboard();
  const stats = (dashboardData as any)?.stats;
  // Mark Entry's badge is "assessments that actually need marks entered
  // right now" - ongoing (exam window open) or completed (exam over, not
  // yet marked) - not scheduled/draft (nothing to mark yet) and not
  // already result_published (marking is done).
  const badgeByTab: Partial<Record<TabKey, number>> = {
    planner: stats?.total,
    questions: stats?.totalQuestions,
    marks: stats ? (stats.ongoing || 0) + (stats.completed || 0) : undefined,
  };
  const TABS = TAB_DEFS.map(tab => ({ ...tab, badge: badgeByTab[tab.key] }));

  const openModal = (modal: string, data?: any) => {
    setSelectedData(data);
    setModals(prev => ({ ...DEFAULT_MODALS, [modal]: true }));
  };
  const closeModals = () => { setModals(DEFAULT_MODALS); setSelectedData(null); };

  const renderTab = () => {
    switch (activeTab) {
      case 'dashboard': return <AssessmentDashboard />;
      case 'planner': return <PlannerTab onOpenModal={openModal} />;
      case 'questions': return <QuestionBankTab onOpenModal={openModal} />;
      case 'papers': return <PaperGenerationTab />;
      case 'marks': return <MarkEntryTab onOpenModal={openModal} />;
      case 'quizReview': return <QuizReviewTab />;
      case 'results': return <ResultsTab onOpenModal={openModal} />;
      case 'analytics': return <AnalyticsTab />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <ModuleHeader
          icon={ClipboardList}
          title="Assessment Module"
          subtitle="Academic Year 2025–26 · Spring Term"
          actions={
            <>
              <Button variant="navy" size="sm" className="text-xs" onClick={() => openModal('createAssessment')}>
                <Plus size={13} className="mr-1.5" /> New Assessment
              </Button>
              <Button variant="outline" size="sm" className="text-xs" onClick={() => openModal('addQuestion')}>
                <BookOpen size={13} className="mr-1.5" /> Add Question
              </Button>
            </>
          }
        />

        {/* Tabs */}
        <div className="px-6">
          <TabBar
            tabs={TABS.map(tab => ({ id: tab.key, label: tab.label, icon: tab.icon, count: (tab as any).badge }))}
            activeId={activeTab}
            onChange={(id) => setActiveTab(id as TabKey)}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">{renderTab()}</div>

      {/* Modals */}
      {modals.createAssessment && <CreateAssessmentModal onClose={closeModals} />}
      {modals.editAssessment && <CreateAssessmentModal assessment={selectedData} onClose={closeModals} />}
      {modals.viewAssessment && <ViewAssessmentModal assessment={selectedData} onClose={closeModals} />}
      {modals.confirmAction && <ConfirmActionModal assessment={selectedData?.assessment} action={selectedData?.action} onClose={closeModals} />}
      {modals.bulkMarkEntry && <BulkMarkEntryModal data={selectedData} onClose={closeModals} />}
      {modals.addQuestion && <AddQuestionModal onClose={closeModals} />}
      {modals.editQuestion && <AddQuestionModal onClose={closeModals} question={selectedData} />}
      {modals.generateReportCards && <GenerateReportCardsModal assessment={selectedData} onClose={closeModals} />}
      {modals.publishResults && <PublishResultsModal onClose={closeModals} />}
    </div>
  );
};

export default AssessmentModule;
