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
  Printer, SlidersHorizontal, X as XIcon, Target, History, Trophy,
  List as ListIcon, LayoutGrid, Table as TableIcon,
} from 'lucide-react';
import {
  Assessment, Question, MarkEntry, ReportCard, TermReportCard,
  QUESTION_TYPES, DIFFICULTY_OPTIONS, BLOOMS_LEVELS,
  GRADE_COLORS, ASSESSMENT_TYPES, TERMS, formatResultLabel,
} from './types';
import pdfApi from '@/services/pdf.api';
import { TypeBadge } from './DashboardPlannerTabs';
import { useQuestions, useQuestionStats, useMarks, useReportCards, useTermReportCards, useAnalytics, useAssessments, useDeleteQuestion, useBulkImportQuestions, useUpdateMarkEntry, useDeleteMarkEntry, useVisibilitySettings } from '@/hooks/useAssessments';
import academicsService from '@/services/academics.service';
import organizationService from '@/services/organization.service';
import * as complianceApi from '@/services/compliance.api';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState, ErrorState } from '@/components/ui/EmptyState';

// ── Shared ────────────────────────────────────────────────────
const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input {...props} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 text-gray-700 placeholder-gray-400" />
);

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ children, className, ...props }) => (
  <select {...props} className={`text-xs border border-gray-200 rounded-lg px-3 py-2 text-gray-600 focus:outline-none truncate ${className || ''}`}>
    {children}
  </select>
);

// Matches the Pager used in academics/library (shared.tsx) - same look, kept
// local here since assessments and library are separate domains.
const Pager: React.FC<{ page: number; pages: number; total: number; onPageChange: (p: number) => void }> = ({ page, pages, total, onPageChange }) => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex items-center justify-between flex-wrap gap-3">
    <span className="text-xs text-gray-400">{total} total</span>
    <div className="flex items-center gap-1">
      <button onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page <= 1}
        className="px-2.5 py-1 text-xs rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed border border-gray-200">
        Prev
      </button>
      <span className="text-xs text-gray-500 px-2">Page {page} of {Math.max(pages, 1)}</span>
      <button onClick={() => onPageChange(Math.min(pages, page + 1))} disabled={page >= pages}
        className="px-2.5 py-1 text-xs rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed border border-gray-200">
        Next
      </button>
    </div>
  </div>
);


// A small deterministic palette (not random per-render) so the same
// student always gets the same fallback color across views/reloads.
const AVATAR_COLORS = ['#1e3a5f', '#7C3AED', '#0D9488', '#B45309', '#BE123C', '#2563EB', '#15803D'];
function avatarColorFor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}
function initialsOf(name: string) {
  return (name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('') || '?';
}

const StudentAvatar: React.FC<{ name: string; photo?: string | null; size?: number }> = ({ name, photo, size = 40 }) => (
  photo ? (
    <img src={photo} alt="" className="rounded-full object-cover flex-shrink-0" style={{ width: size, height: size }} />
  ) : (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
      style={{ width: size, height: size, background: avatarColorFor(name || '?'), fontSize: size * 0.36 }}
    >
      {initialsOf(name)}
    </div>
  )
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

  // Grade/Section are picked FIRST, independently of any assessment - the
  // Assessment dropdown below is then filtered down to whichever
  // assessments actually match. This used to run backwards: an assessment
  // had to be picked first, and Grade/Section was just a read-only display
  // derived from it (only genuinely selectable in the one case where the
  // assessment itself had no fixed section) - not how a class teacher
  // thinks about entering marks ("show me MY class"), and not how every
  // other picker in this app works (see GradeLevelDropdown/SectionDropdown).
  const [selectedGrade, setSelectedGrade] = useState('');
  // Only meaningful when the matched assessment itself spans "all sections"
  // (no fixed section of its own) - lets the teacher narrow mark entry down
  // to one section instead of getting every section's students lumped
  // into a single long list.
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedAssessment, setSelectedAssessment] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

  const currentAssessment = assessments.find(a => a._id === selectedAssessment);

  const { data: gradesData } = useQuery({ queryKey: ['grades-for-mark-entry'], queryFn: () => organizationService.getGrades() });
  const gradeSections: string[] = useMemo(() => {
    const g = (gradesData as any[] | undefined)?.find((x: any) => x.name === selectedGrade);
    return (g?.sections || []).filter((s: any) => s.isActive !== false).map((s: any) => s.name).filter(Boolean);
  }, [gradesData, selectedGrade]);

  // Assessments narrowed to the chosen Grade/Section - an assessment with
  // no fixed section of its own still shows once a specific section is
  // selected (it spans every section of that grade, this one included).
  const gradeFilteredAssessments = useMemo(
    () => assessments.filter(a =>
      (!selectedGrade || a.grade === selectedGrade) &&
      (!selectedSection || !a.section || a.section === selectedSection)),
    [assessments, selectedGrade, selectedSection],
  );

  // Once real assessments/grades load, default to whichever assessment is
  // deep-linked from elsewhere (e.g. Teaching Management's "Enter Marks"
  // action) - deriving Grade/Section from it so the new selectors reflect
  // it correctly. With no deep link, leave Grade unset so the admin picks
  // their class explicitly rather than landing on an arbitrary first
  // assessment for a grade they may not even teach.
  React.useEffect(() => {
    if (!selectedAssessment && assessments.length > 0 && initialAssessmentId) {
      const target = assessments.find(a => a._id === initialAssessmentId);
      if (target) {
        setSelectedGrade(target.grade);
        setSelectedSection(target.section || '');
        setSelectedAssessment(target._id);
        setSelectedSubject(target.subjects?.[0]?.subject ?? '');
      }
    }
  }, [assessments]); // eslint-disable-line react-hooks/exhaustive-deps

  // If the currently-selected assessment no longer matches the Grade/
  // Section filter (because the admin just changed one), fall back to the
  // first assessment that does - never leave a stale, now-mismatched
  // assessment selected underneath a different class. Also auto-selects
  // once a Grade is actually chosen and nothing is selected yet - the
  // common case is exactly one assessment per class/term, and making the
  // admin additionally click the Assessment dropdown after already
  // picking their class is redundant. Skipped while a deep-linked
  // assessment is still being resolved by the effect above, so this
  // doesn't stomp that target with an arbitrary first match in the same
  // render pass.
  React.useEffect(() => {
    const pendingDeepLink = !!initialAssessmentId && !selectedAssessment && assessments.some(a => a._id === initialAssessmentId);
    if (pendingDeepLink) return;
    if (selectedGrade && !gradeFilteredAssessments.some(a => a._id === selectedAssessment)) {
      const next = gradeFilteredAssessments[0];
      setSelectedAssessment(next?._id ?? '');
      setSelectedSubject(next?.subjects?.[0]?.subject ?? '');
    }
  }, [gradeFilteredAssessments]); // eslint-disable-line react-hooks/exhaustive-deps

  // The assessment's own fixed section (if any) always wins; otherwise
  // fall back to whatever the teacher picked from the dropdown.
  const effectiveSection = currentAssessment?.section || selectedSection || undefined;

  // Explicit high limit (also the backend's own default/cap for this exact
  // endpoint - see MarkQueryDto) so the Mark Sheet always loads this
  // class/subject's FULL roster in one request: the summary cards below and
  // "Verify All" both operate over whatever this query returns, and this
  // screen has no pagination control to reach any rows past a page cap.
  const { data: marksData, isLoading: marksLoading, isError: marksError, refetch: marksRefetch } = useMarks(
    selectedAssessment ? { assessmentId: selectedAssessment, subject: selectedSubject, limit: 2000 } : undefined,
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
            disabled={!currentAssessment}
            className="flex items-center gap-1.5 bg-[#1e3a5f] text-white text-xs px-4 py-2 rounded-lg hover:bg-[#16304f] font-medium disabled:opacity-40">
            <FileText size={14} /> Enter Marks
          </button>
        </div>
      </div>

      {/* Select Grade / Section, then Assessment */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
        <div className="grid grid-cols-4 gap-3">
          <div className="min-w-0">
            <label className="text-[10px] font-semibold text-gray-500 uppercase mb-1 block">Grade</label>
            <Select value={selectedGrade} onChange={e => {
              setSelectedGrade(e.target.value)
              setSelectedSection('')
            }} className="w-full">
              <option value="">Select grade…</option>
              {(gradesData as any[] | undefined)?.map((g: any) => (
                <option key={g._id} value={g.name}>{g.name}</option>
              ))}
            </Select>
          </div>
          <div className="min-w-0">
            <label className="text-[10px] font-semibold text-gray-500 uppercase mb-1 block">Section</label>
            <Select value={selectedSection} onChange={e => setSelectedSection(e.target.value)} className="w-full" disabled={!selectedGrade}>
              <option value="">{selectedGrade ? 'All sections' : 'Select a grade first'}</option>
              {gradeSections.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
          </div>
          <div className="min-w-0">
            <label className="text-[10px] font-semibold text-gray-500 uppercase mb-1 block">Assessment</label>
            <Select value={selectedAssessment} onChange={e => {
              setSelectedAssessment(e.target.value)
              const a = assessments.find(x => x._id === e.target.value)
              setSelectedSubject(a?.subjects?.[0]?.subject ?? '')
            }} className="w-full" disabled={gradeFilteredAssessments.length === 0}>
              {gradeFilteredAssessments.length === 0 ? (
                <option value="">{selectedGrade ? 'No assessments for this class' : 'Select a grade first'}</option>
              ) : (
                <>
                  {/* Explicit empty option so the dropdown never visually
                      falls back to displaying its first <option> (the
                      browser's native behavior when `value` matches
                      nothing) while selectedAssessment is still actually
                      empty - that mismatch used to make an assessment
                      LOOK selected while currentAssessment resolved to
                      undefined underneath, leaving Subject empty and
                      Enter Marks permanently disabled with no visible
                      explanation ("paper not appearing"). */}
                  {!selectedAssessment && <option value="">Select an assessment…</option>}
                  {gradeFilteredAssessments.map(a => (
                    <option key={a._id} value={a._id}>{a.title} — {a.grade}{a.section ? ` (${a.section})` : ''}</option>
                  ))}
                </>
              )}
            </Select>
          </div>
          <div className="min-w-0">
            <label className="text-[10px] font-semibold text-gray-500 uppercase mb-1 block">Subject</label>
            <Select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} className="w-full" disabled={!currentAssessment}>
              {!selectedSubject && (currentAssessment?.subjects?.length ?? 0) > 0 && <option value="">Select a subject…</option>}
              {(currentAssessment?.subjects ?? []).map(s => (
                <option key={s.subject} value={s.subject}>{s.subject}</option>
              ))}
            </Select>
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
            <button onClick={() => onOpenModal('verifyMarks', {
              assessmentId: selectedAssessment,
              assessmentTitle: currentAssessment?.title,
              subject: selectedSubject,
              grade: currentAssessment?.grade,
              section: effectiveSection,
            })}
              disabled={!currentAssessment || !selectedSubject}
              className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg text-gray-600 hover:bg-gray-50 flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed">
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
  const [view, setView] = useState<'exam' | 'term'>('exam');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-800">Results & Report Cards</h2>
          <p className="text-xs text-gray-400">View and publish student results</p>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button onClick={() => setView('exam')} className={`px-3 py-1.5 rounded-md text-xs font-medium ${view === 'exam' ? 'bg-white shadow-sm text-[#1e3a5f]' : 'text-gray-500'}`}>Per Exam</button>
          <button onClick={() => setView('term')} className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1 ${view === 'term' ? 'bg-white shadow-sm text-[#1e3a5f]' : 'text-gray-500'}`}><Trophy size={12} /> Whole Term</button>
        </div>
      </div>
      {view === 'exam' ? <ExamReportCardsView onOpenModal={onOpenModal} /> : <TermReportCardsView onOpenModal={onOpenModal} />}
    </div>
  );
};

const ExamReportCardsView: React.FC<ResultsTabProps> = ({ onOpenModal }) => {
  // The assessment picker is driven by the real assessments list (not by
  // titles seen in an already-fetched, already-truncated report-card page) -
  // and the selected assessment's _id is sent to the backend so it can
  // filter + paginate server-side. Previously this called useReportCards()
  // with no params at all, which silently applied the API's default
  // page=1/limit=20 across EVERY assessment in the school sorted by
  // classPosition - so a given assessment's own roster (sorted #1, #2, #3...)
  // got crowded out by #1-ranked students from other classes/assessments,
  // and only whichever handful happened to land in that first global page of
  // 20 ever showed up here, regardless of how many students actually sat
  // that exam.
  const { data: assessmentsData } = useAssessments({ limit: 100 });
  const assessmentsList: Assessment[] = assessmentsData?.data ?? [];
  const { data: visibilitySettings } = useVisibilitySettings();

  const [filterAssessmentId, setFilterAssessmentId] = useState('all');
  const [filterSection, setFilterSection] = useState('all');
  const [filterResult, setFilterResult] = useState('all');
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'table'>('list');
  const limit = 50;

  // Master search - a student can be anywhere across however many pages/
  // assessments are in scope, so this has to hit the backend (matched by
  // name or roll number) rather than only filtering whatever one page of
  // results already happens to be loaded client-side.
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 350);
    return () => clearTimeout(t);
  }, [searchQuery]);
  useEffect(() => { setPage(1); }, [debouncedSearch]);

  const { data: reportCardsData, isLoading: rcLoading, isError: rcError, refetch: rcRefetch } = useReportCards({
    limit, page,
    ...(filterAssessmentId !== 'all' ? { assessmentId: filterAssessmentId } : {}),
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  });
  const reportCards: ReportCard[] = reportCardsData?.data ?? [];
  const meta = (reportCardsData as any)?.meta ?? { total: reportCards.length, pages: 1 };

  const sectionOptions = Array.from(new Set(reportCards.map((rc: any) => rc.section).filter(Boolean)));

  const filtered = reportCards.filter((rc: any) => {
    if (filterSection !== 'all' && rc.section !== filterSection) return false;
    if (filterResult !== 'all' && rc.overallResult !== filterResult) return false;
    return true;
  });

  const [printingId, setPrintingId] = useState<string | null>(null);
  const printReportCard = async (rc: ReportCard) => {
    setPrintingId(rc._id);
    try {
      const blob = await pdfApi.generateExamReportCardPdf({ assessmentId: rc.assessmentId, studentId: rc.studentId });
      pdfApi.downloadBlob(blob, `report-card-${rc.studentName.replace(/\s+/g, '-')}.pdf`);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to generate PDF');
    } finally {
      setPrintingId(null);
    }
  };

  if (rcLoading) return <LoadingSkeleton variant="table" />;
  if (rcError) return <ErrorState message="Could not load report cards" onRetry={rcRefetch} />;

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <button onClick={() => onOpenModal('unpublishResults')}
          className="flex items-center gap-1.5 border border-gray-200 text-gray-600 text-xs px-4 py-2 rounded-lg hover:bg-gray-50 font-medium">
          <XIcon size={14} /> Unpublish Results
        </button>
        <button onClick={() => onOpenModal('publishResults')}
          className="flex items-center gap-1.5 bg-emerald-600 text-white text-xs px-4 py-2 rounded-lg hover:bg-emerald-700 font-medium">
          <CheckCircle size={14} /> Publish Results
        </button>
      </div>

      {/* Master search */}
      <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search any student by name or roll number…"
            className="w-full border border-gray-200 rounded-lg pl-8 pr-3 py-2 text-xs text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20"
          />
        </div>
        <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-0.5">
          {([
            { mode: 'list' as const, icon: ListIcon, label: 'List' },
            { mode: 'grid' as const, icon: LayoutGrid, label: 'Grid' },
            { mode: 'table' as const, icon: TableIcon, label: 'Table' },
          ]).map(({ mode, icon: Icon, label }) => (
            <button key={mode} onClick={() => setViewMode(mode)} title={label}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-colors ${viewMode === mode ? 'bg-[#1e3a5f] text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm flex items-center gap-3">
        <select value={filterAssessmentId} onChange={e => { setFilterAssessmentId(e.target.value); setPage(1); }}
          className="text-xs border border-gray-200 rounded-lg px-3 py-2 text-gray-600 focus:outline-none">
          <option value="all">All Assessments</option>
          {assessmentsList.map(a => <option key={a._id} value={a._id}>{a.title}</option>)}
        </select>
        <select value={filterSection} onChange={e => { setFilterSection(e.target.value); setPage(1); }}
          className="text-xs border border-gray-200 rounded-lg px-3 py-2 text-gray-600 focus:outline-none">
          <option value="all">All Sections</option>
          {sectionOptions.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterResult} onChange={e => { setFilterResult(e.target.value); setPage(1); }}
          className="text-xs border border-gray-200 rounded-lg px-3 py-2 text-gray-600 focus:outline-none">
          <option value="all">All Results</option>
          <option value="pass">{(visibilitySettings as any)?.passLabel || 'Pass'}</option>
          <option value="fail">{(visibilitySettings as any)?.failLabel || 'Fail'}</option>
        </select>
        <button
          onClick={() => downloadCsvFile(
            'report-cards-export.csv',
            ['Roll #', 'Student', 'Grade', 'Section', 'Position', 'Obtained', 'Max', 'Percentage', 'Grade Letter', 'GPA', 'Result', 'Published'],
            filtered.map((rc: any) => [
              String(rc.rollNumber ?? ''), rc.studentName ?? '', rc.grade ?? '', rc.section ?? '',
              String(rc.classPosition ?? ''), String(rc.totalObtainedMarks ?? ''), String(rc.totalMaxMarks ?? ''),
              `${rc.overallPercentage ?? ''}%`, rc.overallGrade ?? '', String(rc.overallGPA ?? ''),
              rc.overallResult ? formatResultLabel(rc.overallResult, visibilitySettings as any) : '', rc.published ? 'Yes' : 'No',
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

      {/* List view */}
      {viewMode === 'list' && (
        <div className="grid grid-cols-1 gap-3">
          {filtered.map((rc) => (
            <div key={rc._id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-4">
                {/* Position */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                  ${rc.classPosition === 1 ? 'bg-amber-100 text-amber-700' :
                    rc.classPosition === 2 ? 'bg-gray-100 text-gray-600' :
                    rc.classPosition === 3 ? 'bg-orange-100 text-orange-700' : 'bg-blue-50 text-blue-600'}`}>
                  #{rc.classPosition}
                </div>
                <StudentAvatar name={rc.studentName} photo={rc.studentPhoto} size={36} />
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
                  {formatResultLabel(rc.overallResult, visibilitySettings as any)}
                </span>
                {/* Published */}
                <div className="flex items-center gap-2">
                  {rc.published
                    ? <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">Published</span>
                    : <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Draft</span>}
                  <button onClick={() => printReportCard(rc)} disabled={printingId === rc._id}
                    className="text-[10px] text-gray-500 hover:text-gray-700 hover:underline font-medium disabled:opacity-40 flex items-center gap-0.5">
                    <Printer size={10} /> {printingId === rc._id ? '…' : 'Print'}
                  </button>
                  <button onClick={() => onOpenModal('viewReportCard', rc)}
                    className="text-[10px] text-[#1e3a5f] hover:underline font-medium">View</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Grid view - photo-forward cards */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map((rc) => (
            <div key={rc._id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center">
              <div className="relative mb-2">
                <StudentAvatar name={rc.studentName} photo={rc.studentPhoto} size={64} />
                <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-white
                  ${rc.classPosition === 1 ? 'bg-amber-100 text-amber-700' :
                    rc.classPosition === 2 ? 'bg-gray-100 text-gray-600' :
                    rc.classPosition === 3 ? 'bg-orange-100 text-orange-700' : 'bg-blue-50 text-blue-600'}`}>
                  {rc.classPosition}
                </div>
              </div>
              <p className="text-sm font-semibold text-gray-800">{rc.studentName}</p>
              <p className="text-[10px] text-gray-400 mb-2">Roll #{rc.rollNumber} · {rc.grade} {rc.section}</p>
              <div className="flex items-center gap-2 mb-2">
                <div className={`px-2.5 py-1 rounded-lg text-center ${GRADE_COLORS[rc.overallGrade] || 'bg-gray-100 text-gray-600'}`}>
                  <p className="text-sm font-bold leading-none">{rc.overallGrade}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${rc.overallResult === 'pass' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  {formatResultLabel(rc.overallResult, visibilitySettings as any)}
                </span>
              </div>
              <p className="text-xs text-gray-600 font-medium">{rc.totalObtainedMarks}/{rc.totalMaxMarks} · {rc.overallPercentage}%</p>
              {rc.published
                ? <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-medium mt-2">Published</span>
                : <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full mt-2">Draft</span>}
              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-50 w-full justify-center">
                <button onClick={() => printReportCard(rc)} disabled={printingId === rc._id}
                  className="text-[10px] text-gray-500 hover:text-gray-700 hover:underline font-medium disabled:opacity-40 flex items-center gap-0.5">
                  <Printer size={10} /> {printingId === rc._id ? '…' : 'Print'}
                </button>
                <button onClick={() => onOpenModal('viewReportCard', rc)}
                  className="text-[10px] text-[#1e3a5f] hover:underline font-medium">View</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table view - dense rows */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 text-[10px] uppercase tracking-wide">
                <th className="text-left py-2.5 px-4">#</th>
                <th className="text-left py-2.5 px-2">Student</th>
                <th className="text-left py-2.5 px-2">Roll</th>
                <th className="text-left py-2.5 px-2">Class</th>
                <th className="text-right py-2.5 px-2">Marks</th>
                <th className="text-right py-2.5 px-2">%</th>
                <th className="text-center py-2.5 px-2">Grade</th>
                <th className="text-center py-2.5 px-2">Result</th>
                <th className="text-center py-2.5 px-2">Status</th>
                <th className="text-right py-2.5 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((rc) => (
                <tr key={rc._id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="py-2 px-4 text-gray-500 font-medium">#{rc.classPosition}</td>
                  <td className="py-2 px-2">
                    <div className="flex items-center gap-2">
                      <StudentAvatar name={rc.studentName} photo={rc.studentPhoto} size={26} />
                      <span className="font-semibold text-gray-800">{rc.studentName}</span>
                    </div>
                  </td>
                  <td className="py-2 px-2 text-gray-500">{rc.rollNumber}</td>
                  <td className="py-2 px-2 text-gray-500">{rc.grade} {rc.section}</td>
                  <td className="py-2 px-2 text-right text-gray-700">{rc.totalObtainedMarks}/{rc.totalMaxMarks}</td>
                  <td className="py-2 px-2 text-right text-gray-500">{rc.overallPercentage}%</td>
                  <td className="py-2 px-2 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${GRADE_COLORS[rc.overallGrade] || 'bg-gray-100 text-gray-600'}`}>{rc.overallGrade}</span>
                  </td>
                  <td className="py-2 px-2 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${rc.overallResult === 'pass' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {formatResultLabel(rc.overallResult, visibilitySettings as any)}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-center">
                    {rc.published
                      ? <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">Published</span>
                      : <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Draft</span>}
                  </td>
                  <td className="py-2 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => printReportCard(rc)} disabled={printingId === rc._id}
                        className="text-[10px] text-gray-500 hover:text-gray-700 hover:underline font-medium disabled:opacity-40 flex items-center gap-0.5">
                        <Printer size={10} /> {printingId === rc._id ? '…' : 'Print'}
                      </button>
                      <button onClick={() => onOpenModal('viewReportCard', rc)}
                        className="text-[10px] text-[#1e3a5f] hover:underline font-medium">View</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {reportCards.length > 0 && <Pager page={page} pages={meta.pages ?? 1} total={meta.total ?? reportCards.length} onPageChange={setPage} />}
    </div>
  );
};

// ── Term Report Cards (comprehensive, whole-term report) ────────
const TermReportCardsView: React.FC<ResultsTabProps> = ({ onOpenModal }) => {
  // Same fix as ExamReportCardsView: never call the list endpoint with no
  // params (silently caps at page=1/limit=20 across every term/grade in the
  // school) and push the selected filters to the backend instead of
  // filtering an already-truncated page client-side.
  const [filterTerm, setFilterTerm] = useState('all');
  const [filterSection, setFilterSection] = useState('all');
  const [page, setPage] = useState(1);
  const limit = 50;

  const { data: trcData, isLoading, isError, refetch } = useTermReportCards({
    limit, page,
    term: filterTerm === 'all' ? undefined : filterTerm,
    section: filterSection === 'all' ? undefined : filterSection,
  });
  const cards: TermReportCard[] = trcData?.data ?? [];
  const meta = (trcData as any)?.meta ?? { total: cards.length, pages: 1 };

  // Unfiltered option list (so the dropdowns always offer every term/section,
  // not just the ones in the currently-filtered result set).
  const { data: allTrcData } = useTermReportCards({ limit: 100 });
  const allCards: TermReportCard[] = allTrcData?.data ?? [];
  const termOptions = Array.from(new Set(allCards.map((c: any) => c.term).filter(Boolean)));
  const sectionOptions = Array.from(new Set(allCards.map((c: any) => c.section).filter(Boolean)));

  const filtered = cards;

  if (isLoading) return <LoadingSkeleton variant="table" />;
  if (isError) return <ErrorState message="Could not load term report cards" onRetry={refetch} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm flex items-center gap-3">
          <select value={filterTerm} onChange={e => { setFilterTerm(e.target.value); setPage(1); }}
            className="text-xs border border-gray-200 rounded-lg px-3 py-2 text-gray-600 focus:outline-none">
            <option value="all">All Terms</option>
            {termOptions.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={filterSection} onChange={e => { setFilterSection(e.target.value); setPage(1); }}
            className="text-xs border border-gray-200 rounded-lg px-3 py-2 text-gray-600 focus:outline-none">
            <option value="all">All Sections</option>
            {sectionOptions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <button onClick={() => onOpenModal('unpublishTermReportCards')}
            className="flex items-center gap-1.5 border border-gray-200 text-gray-600 text-xs px-4 py-2 rounded-lg hover:bg-gray-50 font-medium">
            <XIcon size={14} /> Unpublish
          </button>
          <button onClick={() => onOpenModal('publishTermReportCards')}
            className="flex items-center gap-1.5 bg-emerald-600 text-white text-xs px-4 py-2 rounded-lg hover:bg-emerald-700 font-medium">
            <CheckCircle size={14} /> Publish
          </button>
          <button onClick={() => onOpenModal('generateTermReportCards')}
            className="flex items-center gap-1.5 bg-[#1e3a5f] text-white text-xs px-4 py-2 rounded-lg hover:bg-[#16304f] font-medium">
            <Trophy size={14} /> Generate Term Report Cards
          </button>
        </div>
      </div>

      {cards.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 text-center">
          <Trophy size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-600">No term report cards generated yet</p>
          <p className="text-xs text-gray-400 mt-1">Generate a comprehensive, whole-term report combining academics with Tarbiyah, attendance, and more.</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3">
        {filtered.map((rc: any) => (
          <div key={rc._id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center gap-4">
              {rc.hasAcademicData === false ? (
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 bg-gray-100 text-gray-400">—</div>
              ) : (
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                  ${rc.classPosition === 1 ? 'bg-amber-100 text-amber-700' :
                    rc.classPosition === 2 ? 'bg-gray-100 text-gray-600' :
                    rc.classPosition === 3 ? 'bg-orange-100 text-orange-700' : 'bg-blue-50 text-blue-600'}`}>
                  #{rc.classPosition}
                </div>
              )}
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800">{rc.studentName}</p>
                <p className="text-[10px] text-gray-400">Roll #{rc.rollNumber} · {rc.grade} {rc.section} · {rc.term} {rc.academicYear}</p>
              </div>
              {rc.hasAcademicData === false ? (
                <span className="text-[10px] text-gray-400 bg-gray-50 px-3 py-1.5 rounded-xl">No marks this term</span>
              ) : (
                <>
                  <div className="text-center px-4">
                    <p className="text-lg font-bold text-gray-800">{rc.totalObtainedMarks}/{rc.totalMaxMarks}</p>
                    <p className="text-[10px] text-gray-400">{rc.overallPercentage}%</p>
                  </div>
                  <div className={`px-3 py-1.5 rounded-xl text-center ${GRADE_COLORS[rc.overallGrade] || 'bg-gray-100 text-gray-600'}`}>
                    <p className="text-lg font-bold">{rc.overallGrade}</p>
                    <p className="text-[9px]">GPA {rc.overallGPA}</p>
                  </div>
                </>
              )}
              <div className="flex items-center gap-1">
                {Object.entries(rc.sectionsIncluded || {}).filter(([, v]) => v).map(([k]) => (
                  <span key={k} className="w-1.5 h-1.5 rounded-full bg-[#1e3a5f]" title={k} />
                ))}
              </div>
              <div className="flex items-center gap-2">
                {rc.published
                  ? <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">Published</span>
                  : <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Draft</span>}
                <button onClick={() => onOpenModal('viewTermReportCard', rc)}
                  className="text-[10px] text-[#1e3a5f] hover:underline font-medium">View</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {cards.length > 0 && <Pager page={page} pages={meta.pages ?? 1} total={meta.total ?? cards.length} onPageChange={setPage} />}
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

  // Defaults to "All Years" (empty = unfiltered) rather than guessing at the
  // school's Institution Setup "current" Academic Year: that flag and the
  // free-text academicYear actually stored on an assessment at creation
  // time are two independent values that can drift apart, which used to
  // leave this tab permanently blank with no indication why, even right
  // after publishing real results (same class of bug as the old hardcoded
  // '2025-26' default this used to carry). A specific year can still be
  // picked from the dropdown below to narrow the view down.

  const filters = useMemo(() => ({
    academicYear: academicYear || undefined,
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
    downloadCsvFile(`assessment-analytics-${academicYear || 'all-years'}.csv`, ['A', 'B', 'C', 'D'], rows.map(r => r.map(String)));
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
        title: `Performance Analytics — ${academicYear || 'All Years'}`,
        subtitle: filterSummary,
        filterSummary: `${analytics.meta.totalAssessments} assessment(s) · ${analytics.meta.totalStudentsEvaluated} student(s) evaluated`,
        columns: ['Category', 'Name', 'Value', 'Detail', 'Extra'],
        rows,
      });
      pdfApi.downloadBlob(blob, `assessment-analytics-${academicYear || 'all-years'}.pdf`);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to generate PDF');
    }
  };

  return (
    <div className="space-y-6 print:space-y-4">
      <div className="flex items-start justify-between flex-wrap gap-3 print:hidden">
        <div>
          <h2 className="text-base font-semibold text-gray-800">Performance Analytics</h2>
          <p className="text-xs text-gray-400">{academicYear || 'All Academic Years'} · {filterSummary}</p>
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
            <option value="">All Years</option>
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
