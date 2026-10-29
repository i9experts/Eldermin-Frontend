// ============================================================
// ASSESSMENT — QUESTION BANK + MARK ENTRY + RESULTS + ANALYTICS
// Eldermin ERP | React + TypeScript + Tailwind
// ============================================================

import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { downloadCsvFile, readObjectsFromFile } from '@/lib/csv';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  BookOpen, Plus, Search, Filter, Trash2, Edit2, Eye,
  CheckCircle, XCircle, Clock, AlertCircle, Download, Upload,
  TrendingUp, Award, Users, Star, BarChart2, RefreshCw,
  FileText, ChevronDown, Check, ChevronLeft, ChevronRight,
  Printer, SlidersHorizontal, X as XIcon, Target, History,
} from 'lucide-react';
import {
  Assessment, Question, MarkEntry, ReportCard,
  QUESTION_TYPES, DIFFICULTY_OPTIONS, BLOOMS_LEVELS,
  GRADE_COLORS, ASSESSMENT_TYPES, TERMS,
} from './types';
import pdfApi from '@/services/pdf.api';
import { TypeBadge } from './DashboardPlannerTabs';
import { useQuestions, useQuestionStats, useMarks, useReportCards, useAnalytics, useAssessments, useDeleteQuestion, useBulkImportQuestions, useUpdateMarkEntry, useDeleteMarkEntry } from '@/hooks/useAssessments';
import academicsService from '@/services/academics.service';
import organizationService from '@/services/organization.service';
import * as complianceApi from '@/services/compliance.api';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState, ErrorState } from '@/components/ui/EmptyState';

// ── Shared ────────────────────────────────────────────────────
const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input {...props} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 text-gray-700 placeholder-gray-400" />
);

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ children, ...props }) => (
  <select {...props} className="text-xs border border-gray-200 rounded-lg px-3 py-2 text-gray-600 focus:outline-none">
    {children}
  </select>
);


// ── Question Bank bulk import (CSV) ─────────────────────────────
// Handed to subject teachers as a fixed spreadsheet format so a whole
// term's worth of questions can be typed once and uploaded together,
// instead of one at a time through Add Question. Columns map 1:1 to the
// real Question schema fields (see assessment.schema.ts) - option1..4 /
// option1Correct..4Correct only matter for MCQ rows, correctAnswer is the
// answer key for short/fill_blank/long/true_false rows.
const QUESTION_TEMPLATE_HEADERS = [
  'subject', 'grade', 'topic', 'chapter', 'type', 'difficulty', 'bloomsLevel',
  'questionText', 'marks', 'tags',
  'option1', 'option1Correct', 'option2', 'option2Correct', 'option3', 'option3Correct', 'option4', 'option4Correct',
  'correctAnswer', 'answerExplanation',
];
const QUESTION_TEMPLATE_EXAMPLE_ROWS = [
  ['Mathematics', 'Grade 7', 'Algebra', 'Linear Equations', 'mcq', 'medium', 'apply', 'Solve for x: 2x + 3 = 11', '2', 'algebra,equations',
    '4', 'true', '3', 'false', '5', 'false', '8', 'false', '', ''],
  ['English', 'Grade 7', 'Grammar', 'Tenses', 'true_false', 'easy', 'remember', '"She go to school every day" is grammatically correct.', '1', 'grammar',
    '', '', '', '', '', '', '', '', 'False', 'Should be "She goes to school every day" - third person singular needs "goes".'],
  ['Science', 'Grade 7', 'Biology', 'Cells', 'short', 'medium', 'understand', 'What is the powerhouse of the cell?', '2', 'biology,cells',
    '', '', '', '', '', '', '', '', 'Mitochondria', ''],
];
const QUESTION_TEMPLATE_HEADER_KEY: Record<string, string> = {
  subject: 'subject', grade: 'grade', topic: 'topic', chapter: 'chapter', type: 'type',
  difficulty: 'difficulty', bloomslevel: 'bloomsLevel', questiontext: 'questionText', marks: 'marks', tags: 'tags',
  option1: 'option1', option1correct: 'option1Correct', option2: 'option2', option2correct: 'option2Correct',
  option3: 'option3', option3correct: 'option3Correct', option4: 'option4', option4correct: 'option4Correct',
  correctanswer: 'correctAnswer', answerexplanation: 'answerExplanation',
};

type QuestionBulkImportResult = {
  created: number;
  skipped: { row: number; message?: string }[];
  errors: { row: number; message?: string }[];
};

const BulkImportQuestionsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<QuestionBulkImportResult | null>(null);
  const bulkImport = useBulkImportQuestions();

  async function runImport() {
    if (!file) return;
    const { rows, parseErrors } = await readObjectsFromFile(file, ['subject', 'grade', 'type', 'questiontext'], QUESTION_TEMPLATE_HEADER_KEY);
    if (parseErrors.length > 0) { setResult({ created: 0, skipped: [], errors: parseErrors.map(m => ({ row: 0, message: m })) }); return; }
    if (rows.length === 0) { setResult({ created: 0, skipped: [], errors: [{ row: 0, message: 'No data rows found in file.' }] }); return; }
    bulkImport.mutate(rows, {
      onSuccess: (res: QuestionBulkImportResult) => {
        setResult(res);
        const issues = res.skipped.length + res.errors.length;
        if (issues === 0) toast.success(`${res.created} question(s) added to the bank`);
        else toast.error(`${res.created} added, ${issues} row(s) need attention — see details below`);
      },
      onError: (err: any) => toast.error(err.response?.data?.message || 'Bulk import failed'),
    });
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center overflow-y-auto py-16 px-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg relative">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-xl">
          <h2 className="font-semibold text-gray-800 text-sm">Bulk Import Questions</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-xs text-gray-500">
            Share this template with subject teachers — one row per question. <span className="font-mono">option1..4</span> / <span className="font-mono">option1Correct..4Correct</span> only matter for MCQ rows;{' '}
            <span className="font-mono">correctAnswer</span> is the answer key for short/fill-in-the-blank/long/true-false rows (use "True"/"False" for true-false).
          </p>
          <button onClick={() => downloadCsvFile('question-bank-template.csv', QUESTION_TEMPLATE_HEADERS, QUESTION_TEMPLATE_EXAMPLE_ROWS)}
            className="text-xs font-medium text-[#1e3a5f] hover:underline flex items-center gap-1">
            <Download size={12} /> Download CSV template
          </button>
          <input
            type="file"
            accept=".csv,text/csv,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            onChange={e => { setFile(e.target.files?.[0] || null); setResult(null); }}
            className="block w-full text-xs text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-gray-200 file:text-xs file:font-medium file:bg-white hover:file:bg-gray-50"
          />
          <p className="text-[10px] text-gray-400">
            For Urdu/Arabic or other non-English questions, upload the .xlsx file (or in Excel use File → Save As →
            "CSV UTF-8 (Comma delimited)") — Excel's plain "CSV (Comma delimited)" export silently destroys non-English
            text. English-only question banks work fine as plain CSV.
          </p>
          {result && (
            <div className="border border-gray-200 rounded-lg p-3 text-xs space-y-2 max-h-64 overflow-y-auto">
              <div className="flex gap-4 font-semibold text-gray-700">
                <span>Added: {result.created}</span>
                {result.skipped.length > 0 && <span className="text-amber-600">Skipped (duplicates): {result.skipped.length}</span>}
                {result.errors.length > 0 && <span className="text-red-600">Errors: {result.errors.length}</span>}
              </div>
              {result.skipped.map((s, i) => <div key={`s-${i}`} className="text-amber-700">Row {s.row}: {s.message}</div>)}
              {result.errors.map((e, i) => <div key={`e-${i}`} className="text-red-700">Row {e.row}: {e.message}</div>)}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 font-medium">Cancel</button>
          <button onClick={runImport} disabled={!file || bulkImport.isPending}
            className="px-4 py-2 text-xs bg-[#1e3a5f] text-white rounded-lg hover:bg-[#16304f] font-medium disabled:opacity-50">
            {bulkImport.isPending ? 'Importing…' : 'Import'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// QUESTION BANK TAB
// ============================================================
interface QuestionBankTabProps { onOpenModal: (m: string, d?: any) => void; }

export const QuestionBankTab: React.FC<QuestionBankTabProps> = ({ onOpenModal }) => {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterGrade, setFilterGrade] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterDiff, setFilterDiff] = useState('all');
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(1); }, [debouncedSearch, filterSubject, filterGrade, filterType, filterDiff]);

  // The subject/grade dropdowns used to be a hardcoded, generic string list
  // (SUBJECTS/GRADES from ./types) unrelated to this tenant's actual,
  // admin-configured Subject/Grade names - any mismatch in spelling/casing/
  // custom naming meant the filter could never match a question that was in
  // fact stored under the tenant's real name. These mirror the same real
  // lists Add/Edit Question already uses to write that name.
  const { data: realSubjects = [] } = useQuery({ queryKey: ['subjects-for-questions'], queryFn: () => academicsService.getSubjects() });
  const { data: realGrades = [] } = useQuery({ queryKey: ['grades-for-questions'], queryFn: () => organizationService.getGrades() });

  // Filtering and pagination now happen server-side (GET /questions/list
  // already supports subject/grade/type/difficulty/search, case-insensitive
  // for subject/grade) instead of fetching a hardcoded limit:1000 page and
  // filtering it client-side with strict equality - that silently hid any
  // question outside the newest-first 1000 window (the "disappeared" Grade
  // 8 / Grade 5 Science banks) and could never match a subject/grade that
  // didn't textually equal one of the hardcoded options above.
  const { data: questionsData, isLoading, isError, refetch } = useQuestions({
    page, limit,
    search: debouncedSearch || undefined,
    subject: filterSubject !== 'all' ? filterSubject : undefined,
    grade: filterGrade !== 'all' ? filterGrade : undefined,
    type: filterType !== 'all' ? filterType : undefined,
    difficulty: filterDiff !== 'all' ? filterDiff : undefined,
  });
  const questions: Question[] = questionsData?.data ?? [];
  const meta = questionsData?.meta ?? { total: questions.length, pages: 1 };

  // Bank-wide totals (for the overview strip) via a true, unpaginated Mongo
  // aggregate, so they stay accurate regardless of how the filters/page
  // above are set - the previous version computed these from the same
  // capped, filtered client-side array it rendered, so the "Total
  // Questions" card itself was wrong (1000 instead of the real 1616).
  const { data: bankStats } = useQuestionStats();
  const byDiff = (bankStats?.byDifficulty ?? []) as { _id: string; count: number }[];
  const diffCount = (d: string) => byDiff.find(b => b._id === d)?.count ?? 0;
  const stats = {
    total: bankStats?.total ?? 0,
    byDiff: { easy: diffCount('easy'), medium: diffCount('medium'), hard: diffCount('hard') },
  };

  const deleteQuestion = useDeleteQuestion();

  function toggleSelected(id: string) {
    setSelected(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  }

  async function handleBulkDelete(ids: string[]) {
    if (ids.length === 0) return;
    if (!window.confirm(`Delete ${ids.length} selected question(s)? This cannot be undone.`)) return;
    setBulkDeleting(true);
    const results = await Promise.allSettled(ids.map(id => deleteQuestion.mutateAsync(id)));
    setBulkDeleting(false);
    const failed = results.filter(r => r.status === 'rejected').length;
    const succeeded = ids.length - failed;
    setSelected(new Set());
    if (failed === 0) toast.success(`${succeeded} question(s) deleted`);
    else toast.error(`${succeeded} deleted, ${failed} failed to delete`);
  }

  if (isLoading) return <LoadingSkeleton variant="table" />;
  if (isError) return <ErrorState message="Could not load question bank" onRetry={refetch} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-800">Question Bank</h2>
          <p className="text-xs text-gray-400">{stats.total} questions across all subjects</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowBulkImport(true)} className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg text-gray-600 hover:bg-gray-50 flex items-center gap-1">
            <Upload size={12} /> Bulk Import
          </button>
          <button onClick={() => onOpenModal('addQuestion')}
            className="flex items-center gap-1.5 bg-[#1e3a5f] text-white text-xs px-4 py-2 rounded-lg hover:bg-[#16304f] font-medium">
            <Plus size={14} /> Add Question
          </button>
        </div>
      </div>
      {showBulkImport && <BulkImportQuestionsModal onClose={() => setShowBulkImport(false)} />}

      {/* Difficulty strip */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Questions', value: stats.total, color: 'text-gray-800', bg: 'bg-gray-50' },
          { label: 'Easy', value: stats.byDiff.easy, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Medium', value: stats.byDiff.medium, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Hard', value: stats.byDiff.hard, color: 'text-red-600', bg: 'bg-red-50' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center border border-gray-100`}>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input placeholder="Search questions, topics..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterSubject} onChange={e => setFilterSubject(e.target.value)}>
          <option value="all">All Subjects</option>
          {(realSubjects as any[]).map(s => <option key={s._id} value={s.name}>{s.name}</option>)}
        </Select>
        <Select value={filterGrade} onChange={e => setFilterGrade(e.target.value)}>
          <option value="all">All Grades</option>
          {(realGrades as any[]).map(g => <option key={g._id} value={g.name}>{g.name}</option>)}
        </Select>
        <Select value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="all">All Types</option>
          {QUESTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </Select>
        <Select value={filterDiff} onChange={e => setFilterDiff(e.target.value)}>
          <option value="all">All Difficulty</option>
          {DIFFICULTY_OPTIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
        </Select>
        <button onClick={() => { setSearch(''); setFilterSubject('all'); setFilterGrade('all'); setFilterType('all'); setFilterDiff('all'); }}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"><RefreshCw size={11} /> Reset</button>
        <span className="text-xs text-gray-400">{meta.total} found</span>
      </div>

      {/* Selection toolbar */}
      <div className="flex items-center gap-3 text-xs">
        <label className="flex items-center gap-1.5 text-gray-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={questions.length > 0 && questions.every(q => selected.has(q._id))}
            onChange={e => setSelected(e.target.checked ? new Set(questions.map(q => q._id)) : new Set())}
          />
          Select all on this page ({questions.length})
        </label>
        {selected.size > 0 && (
          <>
            <span className="text-gray-400">{selected.size} selected</span>
            <button
              onClick={() => handleBulkDelete([...selected])}
              disabled={bulkDeleting}
              className="flex items-center gap-1 text-red-600 border border-red-200 px-2.5 py-1 rounded-lg hover:bg-red-50 disabled:opacity-50"
            >
              <Trash2 size={12} /> {bulkDeleting ? 'Deleting…' : 'Delete Selected'}
            </button>
          </>
        )}
      </div>

      {/* Questions */}
      <div className="space-y-3">
        {questions.length === 0 && (
          <EmptyState title={debouncedSearch || filterSubject !== 'all' || filterGrade !== 'all' || filterType !== 'all' || filterDiff !== 'all'
            ? 'No questions match these filters.' : 'No questions in the bank yet.'} />
        )}
        {questions.map(q => {
          const diffCfg = DIFFICULTY_OPTIONS.find(d => d.value === q.difficulty);
          const bloomCfg = BLOOMS_LEVELS.find(b => b.value === q.bloomsLevel);
          const typeCfg = QUESTION_TYPES.find(t => t.value === q.type);
          return (
            <div key={q._id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-start justify-between gap-4">
                <input
                  type="checkbox"
                  checked={selected.has(q._id)}
                  onChange={() => toggleSelected(q._id)}
                  className="mt-1 flex-shrink-0"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-[10px] font-bold text-[#1e3a5f] bg-blue-50 px-2 py-0.5 rounded">{q.subject}</span>
                    <span className="text-[10px] text-gray-400">{q.grade}</span>
                    {q.topic && <span className="text-[10px] text-gray-400">· {q.topic}</span>}
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${diffCfg?.color}`}>{diffCfg?.label}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${bloomCfg?.color}`}>{bloomCfg?.label}</span>
                    <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{typeCfg?.label}</span>
                    <span className="text-[10px] text-gray-400">{q.marks} mark{q.marks > 1 ? 's' : ''}</span>
                  </div>
                  <p className="text-xs text-gray-700 font-medium mb-2">{q.questionText}</p>
                  {q.type === 'mcq' && q.options.length > 0 && (
                    <div className="grid grid-cols-2 gap-1 mb-2">
                      {q.options.map((opt, i) => (
                        <div key={i} className={`flex items-center gap-1.5 text-[10px] px-2 py-1 rounded ${opt.isCorrect ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-600'}`}>
                          {opt.isCorrect ? <Check size={10} /> : <span className="w-2.5">{String.fromCharCode(65 + i)}.</span>}
                          {opt.text}
                        </div>
                      ))}
                    </div>
                  )}
                  {q.type === 'matching' && (q.matchingPairs?.length || 0) > 0 && (
                    <p className="text-[10px] text-gray-500 mb-2">
                      {q.matchingPairs!.length} pair{q.matchingPairs!.length > 1 ? 's' : ''}:{' '}
                      {q.matchingPairs!.slice(0, 3).map(p => `${p.left} ↔ ${p.right}`).join(', ')}
                      {q.matchingPairs!.length > 3 ? `, +${q.matchingPairs!.length - 3} more` : ''}
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    {q.tags.map(tag => (
                      <span key={tag} className="text-[9px] text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded">#{tag}</span>
                    ))}
                    <span className="text-[10px] text-gray-300 ml-2">Used {q.usageCount}×</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => onOpenModal('editQuestion', q)}
                    className="p-1.5 text-gray-400 hover:text-[#1e3a5f] hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    onClick={() => { if (window.confirm('Delete this question? It will be removed from the bank permanently.')) deleteQuestion.mutate(q._id, { onSuccess: () => toast.success('Question deleted'), onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to delete') }); }}
                    disabled={deleteQuestion.isPending}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {meta.total > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 shadow-sm flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, meta.total)} of {meta.total}
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400">per page</span>
              <select value={limit} onChange={e => { setLimit(Number(e.target.value)); setPage(1); }}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none">
                {[20, 50, 100, 200].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed">
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs text-gray-500 px-2">Page {page} of {Math.max(meta.pages ?? 1, 1)}</span>
            <button onClick={() => setPage(p => Math.min(meta.pages ?? 1, p + 1))} disabled={page >= (meta.pages ?? 1)}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================
// EDIT MARK MODAL — Mark Sheet's "Edit" row action. The only other
// mark-entry screen ("Enter Marks") always seeds blank rows from the class
// roster rather than loading what's already saved, so this is the only
// place an already-entered mark can actually be corrected.
// ============================================================
function EditMarkModal({ mark, onClose }: { mark: MarkEntry; onClose: () => void }) {
  const [obtainedMarks, setObtainedMarks] = useState(mark.isAbsent || mark.isExempt ? '' : String(mark.obtainedMarks ?? ''));
  const [isAbsent, setIsAbsent] = useState(!!mark.isAbsent);
  const [isExempt, setIsExempt] = useState(!!mark.isExempt);
  const [remarks, setRemarks] = useState(mark.remarks || '');
  const updateMark = useUpdateMarkEntry();

  function save() {
    const data: any = { isAbsent, isExempt, remarks };
    if (!isAbsent && !isExempt) {
      const n = Number(obtainedMarks);
      if (obtainedMarks === '' || !Number.isFinite(n) || n < 0 || n > mark.totalMarks) {
        toast.error(`Marks must be between 0 and ${mark.totalMarks}`);
        return;
      }
      data.obtainedMarks = n;
    }
    updateMark.mutate({ id: mark._id, data }, {
      onSuccess: () => { toast.success('Mark updated'); onClose(); },
      onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update mark'),
    });
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center overflow-y-auto py-16 px-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm relative">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800 text-sm">Edit Mark — {mark.studentName}</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">✕</button>
        </div>
        <div className="p-5 space-y-3">
          <label className="flex items-center gap-2 text-xs text-gray-600">
            <input type="checkbox" checked={isAbsent} onChange={e => { setIsAbsent(e.target.checked); if (e.target.checked) setIsExempt(false); }} /> Absent
          </label>
          <label className="flex items-center gap-2 text-xs text-gray-600">
            <input type="checkbox" checked={isExempt} onChange={e => { setIsExempt(e.target.checked); if (e.target.checked) setIsAbsent(false); }} /> Exempt
          </label>
          {!isAbsent && !isExempt && (
            <div>
              <label className="text-[10px] font-semibold text-gray-500 uppercase mb-1 block">Obtained (out of {mark.totalMarks})</label>
              <input type="number" min={0} max={mark.totalMarks} value={obtainedMarks} onChange={e => setObtainedMarks(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" />
            </div>
          )}
          <div>
            <label className="text-[10px] font-semibold text-gray-500 uppercase mb-1 block">Remarks</label>
            <input value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Optional"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" />
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 font-medium">Cancel</button>
          <button onClick={save} disabled={updateMark.isPending}
            className="px-4 py-2 text-xs bg-[#1e3a5f] text-white rounded-lg hover:bg-[#16304f] font-medium disabled:opacity-50">
            {updateMark.isPending ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MARK HISTORY MODAL — a basic who/when/what trail off the global audit
// log (AuditLogInterceptor already captures PATCH/DELETE on
// /assessments/marks/:id automatically). Filtered client-side by this
// mark's own _id since the audit-log endpoint doesn't take a resourceId
// filter - good enough for "who touched this mark and when", not a
// field-level before/after diff.
// ============================================================
function MarkHistoryModal({ mark, onClose }: { mark: MarkEntry; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['assessments', 'mark-history', mark._id],
    queryFn: () => complianceApi.fetchAuditLogs({ module: 'Assessments', limit: 100 }),
  });
  const entries = ((data?.data ?? []) as any[]).filter(e => String(e.resourceId) === String(mark._id));

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center overflow-y-auto py-16 px-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md relative">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800 text-sm">History — {mark.studentName}</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">✕</button>
        </div>
        <div className="p-5 max-h-96 overflow-y-auto">
          {isLoading ? (
            <p className="text-xs text-gray-400 text-center py-6">Loading…</p>
          ) : entries.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">No recorded changes yet for this mark (or they're too old to still be in the recent log).</p>
          ) : (
            <ul className="space-y-2.5">
              {entries.map((e, i) => (
                <li key={e._id || i} className="text-xs border-b border-gray-50 pb-2 last:border-0">
                  <span className="font-semibold text-gray-700">{e.action || 'Updated'}</span>
                  <span className="text-gray-400"> by </span>
                  <span className="text-gray-600">{e.performedBy || 'Unknown'}</span>
                  <div className="text-[10px] text-gray-400">{e.createdAt ? new Date(e.createdAt).toLocaleString() : ''}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MARK ENTRY TAB
// ============================================================
interface MarkEntryTabProps { onOpenModal: (m: string, d?: any) => void; initialAssessmentId?: string; }

export const MarkEntryTab: React.FC<MarkEntryTabProps> = ({ onOpenModal, initialAssessmentId }) => {
  // Was hardcoded to 2 fake assessment IDs ('a2'/'a1') that don't exist in
  // the database at all — every query using them returned empty, which is
  // exactly why no students ever showed up here regardless of how many
  // real assessments or students existed.
  const { data: assessmentsData, isLoading: assessmentsLoading } = useAssessments();
  const assessments: Assessment[] = assessmentsData?.data ?? [];

  const [editingMark, setEditingMark] = useState<MarkEntry | null>(null);
  const [historyMark, setHistoryMark] = useState<MarkEntry | null>(null);
  const deleteMark = useDeleteMarkEntry();

  function handleDeleteMark(m: MarkEntry) {
    if (!window.confirm(`Delete ${m.studentName}'s mark for ${m.subject}? This cannot be undone.`)) return;
    deleteMark.mutate(m._id, {
      onSuccess: () => toast.success('Mark deleted'),
      onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to delete mark'),
    });
  }

  const [selectedAssessment, setSelectedAssessment] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  // Only meaningful when the assessment itself spans "all sections" (no
  // fixed section of its own) - lets the teacher narrow mark entry down
  // to one section instead of getting every section's students lumped
  // into a single long list.
  const [selectedSection, setSelectedSection] = useState('');

  const currentAssessment = assessments.find(a => a._id === selectedAssessment);

  // Once real assessments load, default to the one deep-linked from
  // elsewhere (e.g. Teaching Management's "Enter Marks" action) if it's
  // still in this list, otherwise just the first one instead of a
  // permanently-empty selection.
  React.useEffect(() => {
    if (!selectedAssessment && assessments.length > 0) {
      const target = (initialAssessmentId && assessments.find(a => a._id === initialAssessmentId)) || assessments[0];
      setSelectedAssessment(target._id);
      setSelectedSubject(target.subjects?.[0]?.subject ?? '');
    }
  }, [assessments]); // eslint-disable-line react-hooks/exhaustive-deps

  const { data: gradesData } = useQuery({ queryKey: ['grades-for-mark-entry'], queryFn: () => organizationService.getGrades() });
  const gradeSections: string[] = useMemo(() => {
    const g = (gradesData as any[] | undefined)?.find((x: any) => x.name === currentAssessment?.grade);
    return (g?.sections || []).filter((s: any) => s.isActive !== false).map((s: any) => s.name).filter(Boolean);
  }, [gradesData, currentAssessment?.grade]);

  // The assessment's own fixed section (if any) always wins; otherwise
  // fall back to whatever the teacher picked from the dropdown.
  const effectiveSection = currentAssessment?.section || selectedSection || undefined;

  const { data: marksData, isLoading: marksLoading, isError: marksError, refetch: marksRefetch } = useMarks(
    selectedAssessment ? { assessmentId: selectedAssessment, subject: selectedSubject } : undefined,
  );
  const markSheet: MarkEntry[] = (marksData?.data ?? []).filter((m: MarkEntry) => !effectiveSection || m.section === effectiveSection);

  const summary = {
    total: markSheet.length,
    entered: markSheet.filter(m => m.obtainedMarks !== undefined || m.isAbsent).length,
    pass: markSheet.filter(m => m.result === 'pass').length,
    fail: markSheet.filter(m => m.result === 'fail').length,
    absent: markSheet.filter(m => m.isAbsent).length,
    avg: markSheet.filter(m => m.percentage).reduce((a, m) => a + (m.percentage || 0), 0) / (markSheet.filter(m => m.percentage).length || 1),
  };

  if (assessmentsLoading) return <LoadingSkeleton variant="table" />;

  if (assessments.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 text-center">
        <BookOpen size={32} className="text-gray-300 mx-auto mb-3" />
        <p className="text-sm font-semibold text-gray-600">No assessments created yet</p>
        <p className="text-xs text-gray-400 mt-1">Create an assessment first, then come back here to enter marks for it.</p>
      </div>
    );
  }

  if (marksLoading) return <LoadingSkeleton variant="table" />;
  if (marksError) return <ErrorState message="Could not load mark sheet" onRetry={marksRefetch} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-800">Mark Entry</h2>
          <p className="text-xs text-gray-400">Enter and verify student marks</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => onOpenModal('bulkMarkEntry', {
            assessmentId: selectedAssessment,
            subject: selectedSubject,
            grade: currentAssessment?.grade,
            section: effectiveSection,
            totalMarks: currentAssessment?.subjects?.find(s => s.subject === selectedSubject)?.totalMarks,
            passingMarks: currentAssessment?.subjects?.find(s => s.subject === selectedSubject)?.passingMarks,
          })}
            className="flex items-center gap-1.5 bg-[#1e3a5f] text-white text-xs px-4 py-2 rounded-lg hover:bg-[#16304f] font-medium">
            <FileText size={14} /> Enter Marks
          </button>
        </div>
      </div>

      {/* Select Assessment */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] font-semibold text-gray-500 uppercase mb-1 block">Assessment</label>
            <Select value={selectedAssessment} onChange={e => {
              setSelectedAssessment(e.target.value)
              const a = assessments.find(x => x._id === e.target.value)
              setSelectedSubject(a?.subjects?.[0]?.subject ?? '')
              setSelectedSection('')
            }} className="w-full">
              {assessments.map(a => (
                <option key={a._id} value={a._id}>{a.title} — {a.grade}{a.section ? ` (${a.section})` : ''}</option>
              ))}
            </Select>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-gray-500 uppercase mb-1 block">Subject</label>
            <Select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} className="w-full">
              {(currentAssessment?.subjects ?? []).map(s => (
                <option key={s.subject} value={s.subject}>{s.subject}</option>
              ))}
            </Select>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-gray-500 uppercase mb-1 block">Grade / Section</label>
            {currentAssessment && !currentAssessment.section && gradeSections.length > 0 ? (
              <Select value={selectedSection} onChange={e => setSelectedSection(e.target.value)} className="w-full">
                <option value="">{currentAssessment.grade} (all sections)</option>
                {gradeSections.map(s => (
                  <option key={s} value={s}>{currentAssessment.grade} — {s}</option>
                ))}
              </Select>
            ) : (
              <div className="h-9 flex items-center px-3 text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-lg">
                {currentAssessment ? `${currentAssessment.grade}${currentAssessment.section ? ' — ' + currentAssessment.section : ' (all sections)'}` : '—'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-6 gap-3">
        {[
          { label: 'Total', value: summary.total, color: 'text-gray-700' },
          { label: 'Entered', value: summary.entered, color: 'text-blue-600' },
          { label: 'Pass', value: summary.pass, color: 'text-emerald-600' },
          { label: 'Fail', value: summary.fail, color: 'text-red-600' },
          { label: 'Absent', value: summary.absent, color: 'text-amber-600' },
          { label: 'Avg %', value: summary.avg.toFixed(1) + '%', color: 'text-purple-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-3 text-center shadow-sm">
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Mark Sheet Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-700">Mark Sheet — {selectedSubject}</p>
          <div className="flex gap-2">
            <button onClick={() => onOpenModal('verifyMarks', { subject: selectedSubject })}
              className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg text-gray-600 hover:bg-gray-50 flex items-center gap-1">
              <CheckCircle size={11} /> Verify All
            </button>
            <button
              onClick={() => downloadCsvFile(
                `mark-sheet-${selectedSubject || 'export'}.csv`,
                ['Roll #', 'Student', 'Total', 'Obtained', 'Percentage', 'Grade', 'Result', 'Verified', 'Remarks'],
                markSheet.map(m => [
                  String(m.rollNumber ?? ''), m.studentName ?? '', String(m.totalMarks ?? ''),
                  m.isAbsent ? 'Absent' : String(m.obtainedMarks ?? ''),
                  m.percentage !== undefined ? `${m.percentage}%` : '',
                  m.grade_result ?? '', m.result ?? '', m.verified ? 'Yes' : 'No', m.remarks ?? '',
                ]),
              )}
              disabled={markSheet.length === 0}
              className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg text-gray-600 hover:bg-gray-50 flex items-center gap-1 disabled:opacity-40"
            >
              <Download size={11} /> Export
            </button>
          </div>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 text-gray-500 border-b border-gray-100">
              <th className="py-2.5 px-4 text-left font-semibold">Roll #</th>
              <th className="py-2.5 px-4 text-left font-semibold">Student</th>
              <th className="py-2.5 px-4 text-center font-semibold">Total</th>
              <th className="py-2.5 px-4 text-center font-semibold">Obtained</th>
              <th className="py-2.5 px-4 text-center font-semibold">%</th>
              <th className="py-2.5 px-4 text-center font-semibold">Grade</th>
              <th className="py-2.5 px-4 text-center font-semibold">Result</th>
              <th className="py-2.5 px-4 text-center font-semibold">Verified</th>
              <th className="py-2.5 px-4 font-semibold">Remarks</th>
              <th className="py-2.5 px-4 text-center font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {markSheet.map(m => (
              <tr key={m._id} className={`border-b border-gray-50 hover:bg-gray-50 ${m.isAbsent ? 'bg-amber-50/30' : ''}`}>
                <td className="py-2.5 px-4 font-medium text-gray-600">{m.rollNumber}</td>
                <td className="py-2.5 px-4 font-medium text-gray-800">{m.studentName}</td>
                <td className="py-2.5 px-4 text-center text-gray-500">{m.totalMarks}</td>
                <td className="py-2.5 px-4 text-center">
                  {m.isAbsent
                    ? <span className="text-amber-600 font-medium">Absent</span>
                    : <span className="font-bold text-gray-800">{m.obtainedMarks ?? '—'}</span>}
                </td>
                <td className="py-2.5 px-4 text-center">
                  {m.percentage !== undefined
                    ? <span className={`font-medium ${m.percentage >= 70 ? 'text-emerald-600' : m.percentage >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                        {m.percentage}%
                      </span>
                    : '—'}
                </td>
                <td className="py-2.5 px-4 text-center">
                  {m.grade_result && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${GRADE_COLORS[m.grade_result] || 'bg-gray-100 text-gray-600'}`}>
                      {m.grade_result}
                    </span>
                  )}
                </td>
                <td className="py-2.5 px-4 text-center">
                  {m.result && (
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${m.result === 'pass' ? 'bg-emerald-100 text-emerald-700' : m.result === 'absent' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                      {m.result.toUpperCase()}
                    </span>
                  )}
                </td>
                <td className="py-2.5 px-4 text-center">
                  {m.verified
                    ? <CheckCircle size={14} className="text-emerald-500 mx-auto" />
                    : <Clock size={14} className="text-gray-300 mx-auto" />}
                </td>
                <td className="py-2.5 px-4 text-gray-400 text-[10px]">{m.remarks || '—'}</td>
                <td className="py-2.5 px-4">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      onClick={() => setEditingMark(m)}
                      title="Edit mark"
                      className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => handleDeleteMark(m)}
                      title="Delete mark"
                      className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={13} />
                    </button>
                    <button
                      onClick={() => window.open(`/students/${m.studentId}?tab=academic`, '_blank')}
                      title="View in student profile"
                      className="p-1 rounded text-gray-400 hover:text-purple-600 hover:bg-purple-50"
                    >
                      <Eye size={13} />
                    </button>
                    <button
                      onClick={() => setHistoryMark(m)}
                      title="View history"
                      className="p-1 rounded text-gray-400 hover:text-amber-600 hover:bg-amber-50"
                    >
                      <History size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editingMark && <EditMarkModal mark={editingMark} onClose={() => setEditingMark(null)} />}
      {historyMark && <MarkHistoryModal mark={historyMark} onClose={() => setHistoryMark(null)} />}
    </div>
  );
};

// ============================================================
// RESULTS + REPORT CARDS TAB
// ============================================================
interface ResultsTabProps { onOpenModal: (m: string, d?: any) => void; }

export const ResultsTab: React.FC<ResultsTabProps> = ({ onOpenModal }) => {
  const { data: reportCardsData, isLoading: rcLoading, isError: rcError, refetch: rcRefetch } = useReportCards();
  const reportCards: ReportCard[] = reportCardsData?.data ?? [];

  const [filterAssessment, setFilterAssessment] = useState('all');
  const [filterSection, setFilterSection] = useState('all');
  const [filterResult, setFilterResult] = useState('all');

  const assessmentOptions = Array.from(new Set(reportCards.map((rc: any) => rc.assessmentTitle).filter(Boolean)));
  const sectionOptions = Array.from(new Set(reportCards.map((rc: any) => rc.section).filter(Boolean)));

  const filtered = reportCards.filter((rc: any) => {
    if (filterAssessment !== 'all' && rc.assessmentTitle !== filterAssessment) return false;
    if (filterSection !== 'all' && rc.section !== filterSection) return false;
    if (filterResult !== 'all' && rc.overallResult !== filterResult) return false;
    return true;
  });

  if (rcLoading) return <LoadingSkeleton variant="table" />;
  if (rcError) return <ErrorState message="Could not load report cards" onRetry={rcRefetch} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-800">Results & Report Cards</h2>
          <p className="text-xs text-gray-400">View and publish student results</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => onOpenModal('publishResults')}
            className="flex items-center gap-1.5 bg-emerald-600 text-white text-xs px-4 py-2 rounded-lg hover:bg-emerald-700 font-medium">
            <CheckCircle size={14} /> Publish Results
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm flex items-center gap-3">
        <select value={filterAssessment} onChange={e => setFilterAssessment(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-3 py-2 text-gray-600 focus:outline-none">
          <option value="all">All Assessments</option>
          {assessmentOptions.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select value={filterSection} onChange={e => setFilterSection(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-3 py-2 text-gray-600 focus:outline-none">
          <option value="all">All Sections</option>
          {sectionOptions.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterResult} onChange={e => setFilterResult(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-3 py-2 text-gray-600 focus:outline-none">
          <option value="all">All Results</option>
          <option value="pass">Pass</option>
          <option value="fail">Fail</option>
        </select>
        <button
          onClick={() => downloadCsvFile(
            'report-cards-export.csv',
            ['Roll #', 'Student', 'Grade', 'Section', 'Position', 'Obtained', 'Max', 'Percentage', 'Grade Letter', 'GPA', 'Result', 'Published'],
            filtered.map((rc: any) => [
              String(rc.rollNumber ?? ''), rc.studentName ?? '', rc.grade ?? '', rc.section ?? '',
              String(rc.classPosition ?? ''), String(rc.totalObtainedMarks ?? ''), String(rc.totalMaxMarks ?? ''),
              `${rc.overallPercentage ?? ''}%`, rc.overallGrade ?? '', String(rc.overallGPA ?? ''),
              rc.overallResult ?? '', rc.published ? 'Yes' : 'No',
            ]),
          )}
          disabled={filtered.length === 0}
          className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg text-gray-600 flex items-center gap-1 disabled:opacity-40"
        >
          <Download size={11} /> Export
        </button>
      </div>

      {reportCards.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 text-center">
          <FileText size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-600">No report cards generated yet</p>
          <p className="text-xs text-gray-400 mt-1">Enter marks for an assessment, then generate report cards from there.</p>
        </div>
      )}

      {/* Result Cards */}
      <div className="grid grid-cols-1 gap-3">
        {filtered.map((rc, i) => (
          <div key={rc._id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center gap-4">
              {/* Position */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                ${rc.classPosition === 1 ? 'bg-amber-100 text-amber-700' :
                  rc.classPosition === 2 ? 'bg-gray-100 text-gray-600' :
                  rc.classPosition === 3 ? 'bg-orange-100 text-orange-700' : 'bg-blue-50 text-blue-600'}`}>
                #{rc.classPosition}
              </div>
              {/* Student */}
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800">{rc.studentName}</p>
                <p className="text-[10px] text-gray-400">Roll #{rc.rollNumber} · {rc.grade} {rc.section}</p>
              </div>
              {/* Score */}
              <div className="text-center px-4">
                <p className="text-lg font-bold text-gray-800">{rc.totalObtainedMarks}/{rc.totalMaxMarks}</p>
                <p className="text-[10px] text-gray-400">{rc.overallPercentage}%</p>
              </div>
              {/* Grade */}
              <div className={`px-3 py-1.5 rounded-xl text-center ${GRADE_COLORS[rc.overallGrade] || 'bg-gray-100 text-gray-600'}`}>
                <p className="text-lg font-bold">{rc.overallGrade}</p>
                <p className="text-[9px]">GPA {rc.overallGPA}</p>
              </div>
              {/* Result */}
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${rc.overallResult === 'pass' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                {rc.overallResult.toUpperCase()}
              </span>
              {/* Published */}
              <div className="flex items-center gap-2">
                {rc.published
                  ? <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">Published</span>
                  : <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Draft</span>}
                <button onClick={() => onOpenModal('viewReportCard', rc)}
                  className="text-[10px] text-[#1e3a5f] hover:underline font-medium">View</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================
// ANALYTICS TAB — a real, filterable, exportable performance
// intelligence screen: subject/class/trend breakdowns straight off
// every entered mark (not gated behind a separate "Generate Report
// Cards" step), plus topic/Bloom's-level/difficulty weak-area insight
// wherever online quiz data actually exists for it.
// ============================================================
const PIE_COLORS: Record<string, string> = {
  'A+': '#10b981', 'A': '#3b82f6', 'B+': '#6366f1', 'B': '#8b5cf6',
  'C': '#f59e0b', 'D': '#f97316', 'F': '#ef4444',
};
const BLOOMS_ORDER = ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'];
const DIFFICULTY_ORDER = ['easy', 'medium', 'hard'];
const accuracyColor = (pct: number) => (pct >= 70 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444');

const SectionCard: React.FC<{ title: string; icon?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode; className?: string }> =
  ({ title, icon, action, children, className }) => (
    <div className={`bg-white rounded-xl border border-gray-100 p-5 shadow-sm ${className || ''}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">{icon}{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );

const EmptyNote: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-xs text-gray-400 text-center py-8">{children}</p>
);

export const AnalyticsTab: React.FC = () => {
  const { data: academicYears = [] } = useQuery({ queryKey: ['academic-years-for-analytics'], queryFn: () => organizationService.getAcademicYears() });
  const { data: realGrades = [] } = useQuery({ queryKey: ['grades-for-analytics'], queryFn: () => organizationService.getGrades() });
  const { data: realSubjects = [] } = useQuery({ queryKey: ['subjects-for-analytics'], queryFn: () => academicsService.getSubjects() });

  const [academicYear, setAcademicYear] = useState('');
  const [grade, setGrade] = useState('');
  const [section, setSection] = useState('');
  const [subject, setSubject] = useState('');
  const [term, setTerm] = useState('');
  const [type, setType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Defaults to the school's real current Academic Year (Institution Setup
  // > Academic Years) instead of a hardcoded year - was permanently fixed
  // to '2025-26' before, regardless of which year the school had actually
  // marked current, or the one already in the top-bar's own switcher.
  useEffect(() => {
    if (!academicYear && (academicYears as any[]).length > 0) {
      const current = (academicYears as any[]).find((y: any) => y.isCurrent) || (academicYears as any[])[0];
      setAcademicYear(current.name);
    }
  }, [academicYears]); // eslint-disable-line react-hooks/exhaustive-deps

  const filters = useMemo(() => ({
    academicYear,
    grade: grade || undefined,
    section: section || undefined,
    subject: subject || undefined,
    term: term || undefined,
    type: type || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  }), [academicYear, grade, section, subject, term, type, dateFrom, dateTo]);

  const { data: analyticsData, isLoading: anaLoading, isError: anaError, refetch: anaRefetch } = useAnalytics(filters);
  const ZERO_ANALYTICS = {
    meta: { totalAssessments: 0, totalStudentsEvaluated: 0, totalQuizAttempts: 0 },
    subjectWise: [], gradeDistribution: [], classComparison: [], trendByAssessment: [],
    topPerformers: [], atRiskStudents: [], byTopic: [], byBloomsLevel: [], byDifficulty: [],
  };
  const analytics = analyticsData ?? ZERO_ANALYTICS;

  const sectionsForGrade: string[] = ((realGrades as any[]).find((g: any) => g.name === grade)?.sections || []).map((s: any) => s.name);
  const activeFilterCount = [grade, section, subject, term, type, dateFrom, dateTo].filter(Boolean).length;
  const clearFilters = () => { setGrade(''); setSection(''); setSubject(''); setTerm(''); setType(''); setDateFrom(''); setDateTo(''); };

  const filterSummary = [
    grade && `Grade: ${grade}${section ? ' - ' + section : ''}`,
    subject && `Subject: ${subject}`,
    term && `Term: ${term}`,
    type && `Type: ${ASSESSMENT_TYPES.find(t => t.value === type)?.label || type}`,
    (dateFrom || dateTo) && `Dates: ${dateFrom || '…'} to ${dateTo || '…'}`,
  ].filter(Boolean).join(' · ') || 'All assessments';

  const exportCsv = () => {
    const rows: (string | number)[][] = [];
    rows.push(['SUBJECT-WISE AVERAGE', '', '', '']);
    rows.push(['Subject', 'Avg %', 'Pass Rate %', 'Students']);
    analytics.subjectWise.forEach((s: any) => rows.push([s.subject, s.avgPct, s.passRate, s.total]));
    rows.push(['', '', '', '']);
    rows.push(['CLASS COMPARISON', '', '', '']);
    rows.push(['Grade', 'Section', 'Avg %', 'Pass Rate %']);
    analytics.classComparison.forEach((c: any) => rows.push([c.grade, c.section || '—', c.avgPct, c.passRate]));
    rows.push(['', '', '', '']);
    rows.push(['TOP PERFORMERS', '', '', '']);
    rows.push(['Student', 'Grade', 'Section', 'Overall %']);
    analytics.topPerformers.forEach((s: any) => rows.push([s.studentName, s.grade, s.section || '—', s.overallPct]));
    rows.push(['', '', '', '']);
    rows.push(['AT-RISK STUDENTS (Below 50%)', '', '', '']);
    rows.push(['Student', 'Grade', 'Section', 'Overall % / Weakest Subject']);
    analytics.atRiskStudents.forEach((s: any) => rows.push([s.studentName, s.grade, s.section || '—', `${s.overallPct}% (${s.weakestSubject?.subject || '—'})`]));
    if (analytics.byTopic.length > 0) {
      rows.push(['', '', '', '']);
      rows.push(['ONLINE QUIZ — WEAK TOPICS', '', '', '']);
      rows.push(['Subject', 'Topic', 'Accuracy %', 'Attempts']);
      analytics.byTopic.forEach((t: any) => rows.push([t.subject, t.topic, t.accuracyPct, t.attempts]));
    }
    downloadCsvFile(`assessment-analytics-${academicYear}.csv`, ['A', 'B', 'C', 'D'], rows.map(r => r.map(String)));
  };

  const exportPdf = async () => {
    try {
      const rows: (string | number)[][] = [];
      analytics.subjectWise.forEach((s: any) => rows.push(['Subject-wise', s.subject, `${s.avgPct}%`, `${s.passRate}% pass`, `${s.total} students`]));
      analytics.classComparison.forEach((c: any) => rows.push(['Class Comparison', `${c.grade}${c.section ? ' - ' + c.section : ''}`, `${c.avgPct}%`, `${c.passRate}% pass`, `${c.studentCount} students`]));
      analytics.topPerformers.slice(0, 10).forEach((s: any) => rows.push(['Top Performer', s.studentName, `${s.overallPct}%`, s.grade, s.section || '—']));
      analytics.atRiskStudents.slice(0, 20).forEach((s: any) => rows.push(['At-Risk', s.studentName, `${s.overallPct}%`, `Weak: ${s.weakestSubject?.subject || '—'}`, s.grade]));
      analytics.byTopic.forEach((t: any) => rows.push(['Online Quiz — Topic', `${t.subject}: ${t.topic}`, `${t.accuracyPct}%`, `${t.attempts} attempts`, '']));
      const blob = await pdfApi.generateTabularReportPdf({
        title: `Performance Analytics — ${academicYear}`,
        subtitle: filterSummary,
        filterSummary: `${analytics.meta.totalAssessments} assessment(s) · ${analytics.meta.totalStudentsEvaluated} student(s) evaluated`,
        columns: ['Category', 'Name', 'Value', 'Detail', 'Extra'],
        rows,
      });
      pdfApi.downloadBlob(blob, `assessment-analytics-${academicYear}.pdf`);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to generate PDF');
    }
  };

  return (
    <div className="space-y-6 print:space-y-4">
      <div className="flex items-start justify-between flex-wrap gap-3 print:hidden">
        <div>
          <h2 className="text-base font-semibold text-gray-800">Performance Analytics</h2>
          <p className="text-xs text-gray-400">Academic Year {academicYear || '…'} · {filterSummary}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCsv} disabled={anaLoading} className="flex items-center gap-1.5 text-xs border border-gray-200 px-3 py-1.5 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40">
            <Download size={12} /> CSV
          </button>
          <button onClick={exportPdf} disabled={anaLoading} className="flex items-center gap-1.5 text-xs border border-gray-200 px-3 py-1.5 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40">
            <FileText size={12} /> PDF
          </button>
          <button onClick={() => window.print()} disabled={anaLoading} className="flex items-center gap-1.5 text-xs border border-gray-200 px-3 py-1.5 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40">
            <Printer size={12} /> Print
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm print:hidden">
        <div className="flex items-center gap-2 mb-3">
          <SlidersHorizontal size={13} className="text-gray-400" />
          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Filters</span>
          {activeFilterCount > 0 && (
            <button onClick={clearFilters} className="ml-auto flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-600">
              <XIcon size={10} /> Clear {activeFilterCount} filter{activeFilterCount === 1 ? '' : 's'}
            </button>
          )}
        </div>
        <div className="grid grid-cols-4 lg:grid-cols-8 gap-2">
          <Select value={academicYear} onChange={e => setAcademicYear(e.target.value)}>
            {(academicYears as any[]).length === 0 && <option value="">Loading…</option>}
            {(academicYears as any[]).map((y: any) => <option key={y._id} value={y.name}>{y.name}{y.isCurrent ? ' (current)' : ''}</option>)}
          </Select>
          <Select value={grade} onChange={e => { setGrade(e.target.value); setSection(''); }}>
            <option value="">All Grades</option>
            {(realGrades as any[]).map((g: any) => <option key={g._id} value={g.name}>{g.name}</option>)}
          </Select>
          <Select value={section} onChange={e => setSection(e.target.value)} disabled={!grade}>
            <option value="">All Sections</option>
            {sectionsForGrade.map((s: string) => <option key={s} value={s}>{s}</option>)}
          </Select>
          <Select value={subject} onChange={e => setSubject(e.target.value)}>
            <option value="">All Subjects</option>
            {(realSubjects as any[]).map((s: any) => <option key={s._id} value={s.name}>{s.name}</option>)}
          </Select>
          <Select value={term} onChange={e => setTerm(e.target.value)}>
            <option value="">All Terms</option>
            {TERMS.map(t => <option key={t} value={t}>{t}</option>)}
          </Select>
          <Select value={type} onChange={e => setType(e.target.value)}>
            <option value="">All Types</option>
            {ASSESSMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </Select>
          <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} title="From date" />
          <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} title="To date" />
        </div>
      </div>

      {anaLoading ? (
        <LoadingSkeleton variant="stats" />
      ) : anaError ? (
        <ErrorState message="Could not load analytics" onRetry={anaRefetch} />
      ) : (
        <>
          {/* Meta KPIs */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Assessments in Scope', value: analytics.meta.totalAssessments, color: 'text-gray-800' },
              { label: 'Students Evaluated', value: analytics.meta.totalStudentsEvaluated, color: 'text-gray-800' },
              { label: 'Online Quiz Attempts Analyzed', value: analytics.meta.totalQuizAttempts, color: 'text-gray-800' },
            ].map(k => (
              <div key={k.label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm text-center">
                <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">{k.label}</p>
              </div>
            ))}
          </div>

          {analytics.meta.totalAssessments === 0 ? (
            <SectionCard title="No data for this scope">
              <EmptyNote>No assessments match these filters yet. Try a different Academic Year or clear some filters.</EmptyNote>
            </SectionCard>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <SectionCard title="Subject-wise Average">
                  {analytics.subjectWise.length === 0 ? <EmptyNote>No marks entered yet for this scope.</EmptyNote> : (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={analytics.subjectWise}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="subject" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                        <Tooltip formatter={(v: any) => [`${v.toFixed(1)}%`]} />
                        <Bar dataKey="avgPct" fill="#6366f1" radius={[4, 4, 0, 0]} name="Avg %" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </SectionCard>

                <SectionCard title="Grade Distribution">
                  {analytics.gradeDistribution.every((g: any) => g.count === 0) ? <EmptyNote>No graded students in this scope yet.</EmptyNote> : (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={analytics.gradeDistribution.filter((g: any) => g.count > 0)} dataKey="count" nameKey="grade" cx="50%" cy="50%" outerRadius={75}
                          label={({ grade, percent }: any) => `${grade} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                          {analytics.gradeDistribution.filter((g: any) => g.count > 0).map((entry: any) => (
                            <Cell key={entry.grade} fill={PIE_COLORS[entry.grade] || '#94a3b8'} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </SectionCard>
              </div>

              <SectionCard title="Performance Trend" icon={<TrendingUp size={14} className="text-indigo-500" />}>
                {analytics.trendByAssessment.length === 0 ? <EmptyNote>Not enough assessments in this scope to show a trend.</EmptyNote> : (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={analytics.trendByAssessment}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="title" tick={{ fontSize: 9 }} interval={0} angle={-15} textAnchor="end" height={50} />
                      <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                      <Tooltip formatter={(v: any, n: any) => [`${v}${n === 'avgPct' ? '%' : ''}`, n === 'avgPct' ? 'Avg %' : 'Pass Rate %']} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Line type="monotone" dataKey="avgPct" stroke="#6366f1" strokeWidth={2} name="Avg %" dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="passRate" stroke="#10b981" strokeWidth={2} name="Pass Rate %" dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </SectionCard>

              <SectionCard title="Class Comparison" icon={<Users size={14} className="text-blue-500" />}>
                {analytics.classComparison.length === 0 ? <EmptyNote>No classes to compare in this scope.</EmptyNote> : (
                  <div className="space-y-2.5">
                    {analytics.classComparison.map((c: any) => (
                      <div key={`${c.grade}-${c.section}`} className="flex items-center gap-3">
                        <span className="text-xs text-gray-600 w-28 truncate">{c.grade}{c.section ? ` - ${c.section}` : ''}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-3">
                          <div className="h-3 rounded-full transition-all" style={{ width: `${c.avgPct}%`, backgroundColor: accuracyColor(c.avgPct) }} />
                        </div>
                        <span className="text-xs font-bold text-gray-700 w-12 text-right">{c.avgPct}%</span>
                        <span className="text-[10px] text-gray-400 w-24 text-right">{c.passRate}% pass · {c.studentCount} students</span>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>

              <div className="grid grid-cols-2 gap-4">
                <SectionCard title="Top Performers" icon={<Award size={14} className="text-amber-500" />}>
                  {analytics.topPerformers.length === 0 ? <EmptyNote>No graded students yet.</EmptyNote> : (
                    <div className="space-y-2">
                      {analytics.topPerformers.map((s: any, i: number) => (
                        <div key={s.studentId} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-gray-200 text-gray-600' : 'bg-orange-100 text-orange-700'}`}>
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-700 truncate">{s.studentName}</p>
                            <p className="text-[10px] text-gray-400">{s.grade}{s.section ? ` - ${s.section}` : ''} · Strongest: {s.strongestSubject?.subject || '—'}</p>
                          </div>
                          <span className="text-xs font-bold text-emerald-600">{s.overallPct}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                </SectionCard>

                <SectionCard title="At-Risk Students (Below 50%)" icon={<AlertCircle size={14} className="text-red-500" />}>
                  {analytics.atRiskStudents.length === 0 ? <EmptyNote>No students below 50% in this scope. 🎉</EmptyNote> : (
                    <div className="space-y-2">
                      {analytics.atRiskStudents.map((s: any) => (
                        <div key={s.studentId} className="flex items-center gap-3 p-2 bg-red-50 rounded-lg">
                          <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-700 truncate">{s.studentName}</p>
                            <p className="text-[10px] text-gray-400">{s.grade}{s.section ? ` - ${s.section}` : ''} · Weakest: {s.weakestSubject?.subject || '—'}</p>
                          </div>
                          <span className="text-xs font-bold text-red-600">{s.overallPct}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                </SectionCard>
              </div>

              {/* Online Quiz-only insights - the one place per-question right/wrong data exists */}
              <div className="pt-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Online Quiz Insights — Weak/Strong Areas by Question Data</p>
                <div className="grid grid-cols-3 gap-4">
                  <SectionCard title="Weakest Topics" icon={<Target size={14} className="text-rose-500" />}>
                    {analytics.byTopic.length === 0 ? <EmptyNote>No online quiz attempts in this scope (teacher-marked papers don't record per-question data).</EmptyNote> : (
                      <div className="space-y-2">
                        {analytics.byTopic.slice(0, 8).map((t: any) => (
                          <div key={`${t.subject}-${t.topic}`} className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-600 w-24 truncate" title={`${t.subject} — ${t.topic}`}>{t.topic}</span>
                            <div className="flex-1 bg-gray-100 rounded-full h-2">
                              <div className="h-2 rounded-full" style={{ width: `${t.accuracyPct}%`, backgroundColor: accuracyColor(t.accuracyPct) }} />
                            </div>
                            <span className="text-[10px] font-bold text-gray-700 w-9 text-right">{t.accuracyPct}%</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </SectionCard>

                  <SectionCard title="By Bloom's Level" icon={<Star size={14} className="text-violet-500" />}>
                    {analytics.byBloomsLevel.length === 0 ? <EmptyNote>No online quiz data in this scope.</EmptyNote> : (
                      <div className="space-y-2">
                        {[...analytics.byBloomsLevel].sort((a: any, b: any) => BLOOMS_ORDER.indexOf(a.level) - BLOOMS_ORDER.indexOf(b.level)).map((b: any) => (
                          <div key={b.level} className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-600 w-20 capitalize">{b.level}</span>
                            <div className="flex-1 bg-gray-100 rounded-full h-2">
                              <div className="h-2 rounded-full" style={{ width: `${b.accuracyPct}%`, backgroundColor: accuracyColor(b.accuracyPct) }} />
                            </div>
                            <span className="text-[10px] font-bold text-gray-700 w-9 text-right">{b.accuracyPct}%</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </SectionCard>

                  <SectionCard title="By Difficulty" icon={<BarChart2 size={14} className="text-cyan-500" />}>
                    {analytics.byDifficulty.length === 0 ? <EmptyNote>No online quiz data in this scope.</EmptyNote> : (
                      <div className="space-y-2">
                        {[...analytics.byDifficulty].sort((a: any, b: any) => DIFFICULTY_ORDER.indexOf(a.level) - DIFFICULTY_ORDER.indexOf(b.level)).map((d: any) => (
                          <div key={d.level} className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-600 w-20 capitalize">{d.level}</span>
                            <div className="flex-1 bg-gray-100 rounded-full h-2">
                              <div className="h-2 rounded-full" style={{ width: `${d.accuracyPct}%`, backgroundColor: accuracyColor(d.accuracyPct) }} />
                            </div>
                            <span className="text-[10px] font-bold text-gray-700 w-9 text-right">{d.accuracyPct}%</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </SectionCard>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};
