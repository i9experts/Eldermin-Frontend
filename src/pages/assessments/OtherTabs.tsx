// ============================================================
// ASSESSMENT — QUESTION BANK + MARK ENTRY + RESULTS + ANALYTICS
// Eldermin ERP | React + TypeScript + Tailwind
// ============================================================

import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  BookOpen, Plus, Search, Filter, Trash2, Edit2, Eye,
  CheckCircle, XCircle, Clock, AlertCircle, Download,
  TrendingUp, Award, Users, Star, BarChart2, RefreshCw,
  FileText, ChevronDown, Check,
} from 'lucide-react';
import {
  Question, MarkEntry, ReportCard,
  QUESTION_TYPES, DIFFICULTY_OPTIONS, BLOOMS_LEVELS,
  SUBJECTS, GRADES, GRADE_COLORS,
} from './types';
import { TypeBadge } from './DashboardPlannerTabs';
import { useQuestions, useMarks, useReportCards, useAnalytics } from '@/hooks/useAssessments';
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


// ============================================================
// QUESTION BANK TAB
// ============================================================
interface QuestionBankTabProps { onOpenModal: (m: string, d?: any) => void; }

export const QuestionBankTab: React.FC<QuestionBankTabProps> = ({ onOpenModal }) => {
  const [search, setSearch] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterGrade, setFilterGrade] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterDiff, setFilterDiff] = useState('all');

  const { data: questionsData, isLoading, isError, refetch } = useQuestions();
  const questions: Question[] = questionsData?.data ?? [];

  const filtered = questions.filter(q => {
    const matchSearch = !search || q.questionText.toLowerCase().includes(search.toLowerCase()) || q.topic?.toLowerCase().includes(search.toLowerCase());
    const matchSubject = filterSubject === 'all' || q.subject === filterSubject;
    const matchGrade = filterGrade === 'all' || q.grade === filterGrade;
    const matchType = filterType === 'all' || q.type === filterType;
    const matchDiff = filterDiff === 'all' || q.difficulty === filterDiff;
    return matchSearch && matchSubject && matchGrade && matchType && matchDiff;
  });

  const stats = {
    total: questions.length,
    byDiff: {
      easy: questions.filter(q => q.difficulty === 'easy').length,
      medium: questions.filter(q => q.difficulty === 'medium').length,
      hard: questions.filter(q => q.difficulty === 'hard').length,
    },
  };

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
          <button className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg text-gray-600 hover:bg-gray-50 flex items-center gap-1">
            <Download size={12} /> Export
          </button>
          <button onClick={() => onOpenModal('addQuestion')}
            className="flex items-center gap-1.5 bg-[#1e3a5f] text-white text-xs px-4 py-2 rounded-lg hover:bg-[#16304f] font-medium">
            <Plus size={14} /> Add Question
          </button>
        </div>
      </div>

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
          {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
        </Select>
        <Select value={filterGrade} onChange={e => setFilterGrade(e.target.value)}>
          <option value="all">All Grades</option>
          {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
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
        <span className="text-xs text-gray-400">{filtered.length} found</span>
      </div>

      {/* Questions */}
      <div className="space-y-3">
        {filtered.map(q => {
          const diffCfg = DIFFICULTY_OPTIONS.find(d => d.value === q.difficulty);
          const bloomCfg = BLOOMS_LEVELS.find(b => b.value === q.bloomsLevel);
          const typeCfg = QUESTION_TYPES.find(t => t.value === q.type);
          return (
            <div key={q._id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-start justify-between gap-4">
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
                  <div className="flex items-center gap-2">
                    {q.tags.map(tag => (
                      <span key={tag} className="text-[9px] text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded">#{tag}</span>
                    ))}
                    <span className="text-[10px] text-gray-300 ml-2">Used {q.usageCount}×</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => onOpenModal('editQuestion', q)} className="p-1.5 text-gray-400 hover:text-[#1e3a5f] hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={13} /></button>
                  <button onClick={() => onOpenModal('deleteQuestion', q)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={13} /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================
// MARK ENTRY TAB
// ============================================================
interface MarkEntryTabProps { onOpenModal: (m: string, d?: any) => void; }

export const MarkEntryTab: React.FC<MarkEntryTabProps> = ({ onOpenModal }) => {
  const [selectedAssessment, setSelectedAssessment] = useState('a2');
  const [selectedSubject, setSelectedSubject] = useState('Mathematics');

  const { data: marksData, isLoading: marksLoading, isError: marksError, refetch: marksRefetch } = useMarks({ assessmentId: selectedAssessment, subject: selectedSubject });
  const markSheet: MarkEntry[] = marksData?.data ?? [];

  const summary = {
    total: markSheet.length,
    entered: markSheet.filter(m => m.obtainedMarks !== undefined || m.isAbsent).length,
    pass: markSheet.filter(m => m.result === 'pass').length,
    fail: markSheet.filter(m => m.result === 'fail').length,
    absent: markSheet.filter(m => m.isAbsent).length,
    avg: markSheet.filter(m => m.percentage).reduce((a, m) => a + (m.percentage || 0), 0) / (markSheet.filter(m => m.percentage).length || 1),
  };

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
          <button onClick={() => onOpenModal('bulkMarkEntry')}
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
            <Select value={selectedAssessment} onChange={e => setSelectedAssessment(e.target.value)} className="w-full">
              <option value="a2">Weekly Math Quiz — Grade 7</option>
              <option value="a1">Mid Term Exam — Grade 9</option>
            </Select>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-gray-500 uppercase mb-1 block">Subject</label>
            <Select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} className="w-full">
              <option value="Mathematics">Mathematics</option>
              <option value="English">English</option>
            </Select>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-gray-500 uppercase mb-1 block">Section</label>
            <Select className="w-full">
              <option>All Sections</option>
              <option>Section A</option>
              <option>Section B</option>
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
            <button onClick={() => onOpenModal('verifyMarks', { subject: selectedSubject })}
              className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg text-gray-600 hover:bg-gray-50 flex items-center gap-1">
              <CheckCircle size={11} /> Verify All
            </button>
            <button className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg text-gray-600 hover:bg-gray-50 flex items-center gap-1">
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
        <select className="text-xs border border-gray-200 rounded-lg px-3 py-2 text-gray-600 focus:outline-none">
          <option>Weekly Math Quiz — Grade 7</option>
          <option>Mid Term Exam — Grade 9</option>
        </select>
        <select className="text-xs border border-gray-200 rounded-lg px-3 py-2 text-gray-600 focus:outline-none">
          <option>All Sections</option>
          <option>Section A</option>
        </select>
        <select className="text-xs border border-gray-200 rounded-lg px-3 py-2 text-gray-600 focus:outline-none">
          <option>All Results</option>
          <option>Pass</option>
          <option>Fail</option>
        </select>
        <button className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg text-gray-600 flex items-center gap-1">
          <Download size={11} /> Export
        </button>
      </div>

      {/* Result Cards */}
      <div className="grid grid-cols-1 gap-3">
        {reportCards.map((rc, i) => (
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
// ANALYTICS TAB
// ============================================================
const PIE_COLORS: Record<string, string> = {
  'A+': '#10b981', 'A': '#3b82f6', 'B+': '#6366f1', 'B': '#8b5cf6',
  'C': '#f59e0b', 'D': '#f97316', 'F': '#ef4444',
};

export const AnalyticsTab: React.FC = () => {
  const { data: analyticsData, isLoading: anaLoading, isError: anaError, refetch: anaRefetch } = useAnalytics('2025-26');
  const ZERO_ANALYTICS = { subjectWise: [], gradeDistribution: [], topPerformers: [], weakStudents: [] };
  const analytics = analyticsData ?? ZERO_ANALYTICS;

  if (anaLoading) return <LoadingSkeleton variant="stats" />;
  if (anaError) return <ErrorState message="Could not load analytics" onRetry={anaRefetch} />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-gray-800">Performance Analytics</h2>
        <p className="text-xs text-gray-400">Academic Year 2025–26 · All assessments</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Subject Performance */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Subject-wise Average</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={analytics.subjectWise}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="_id" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
              <Tooltip formatter={(v: any) => [`${v.toFixed(1)}%`]} />
              <Bar dataKey="avgPct" fill="#6366f1" radius={[4, 4, 0, 0]} name="Avg %" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Grade Distribution */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Grade Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={analytics.gradeDistribution} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={75} label={({ _id, percent }: any) => `${_id} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {analytics.gradeDistribution.map((entry: any) => (
                  <Cell key={entry._id} fill={PIE_COLORS[entry._id] || '#94a3b8'} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top Performers */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Award size={14} className="text-amber-500" /> Top Performers
          </h3>
          <div className="space-y-2">
            {analytics.topPerformers.map((s: any, i: number) => (
              <div key={s.studentName} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-gray-200 text-gray-600' : 'bg-orange-100 text-orange-700'}`}>
                  {i + 1}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-700">{s.studentName}</p>
                  <p className="text-[10px] text-gray-400">{s.grade}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${GRADE_COLORS[s.overallGrade]}`}>{s.overallGrade}</span>
                <span className="text-xs font-bold text-gray-700">{s.overallPercentage}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* At-Risk Students */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <AlertCircle size={14} className="text-red-500" /> At-Risk Students (Below 50%)
          </h3>
          <div className="space-y-2">
            {analytics.weakStudents.map((s: any) => (
              <div key={s.studentName} className="flex items-center gap-3 p-2 bg-red-50 rounded-lg">
                <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-700">{s.studentName}</p>
                  <p className="text-[10px] text-gray-400">{s.grade}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${GRADE_COLORS[s.overallGrade]}`}>{s.overallGrade}</span>
                <span className="text-xs font-bold text-red-600">{s.overallPercentage}%</span>
              </div>
            ))}
          </div>
          <button className="mt-3 w-full text-[10px] text-[#1e3a5f] font-medium hover:underline text-center">
            View all at-risk students →
          </button>
        </div>
      </div>

      {/* Pass Rate by Subject */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Subject Pass Rate Comparison</h3>
        <div className="space-y-3">
          {analytics.subjectWise.map((s: any) => (
            <div key={s._id} className="flex items-center gap-4">
              <span className="text-xs text-gray-600 w-24">{s._id}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-3">
                <div className="h-3 rounded-full transition-all" style={{ width: `${s.passRate * 100}%`, backgroundColor: s.passRate >= 0.85 ? '#10b981' : s.passRate >= 0.70 ? '#f59e0b' : '#ef4444' }} />
              </div>
              <span className="text-xs font-bold text-gray-700 w-12 text-right">{(s.passRate * 100).toFixed(0)}%</span>
              <span className="text-xs text-gray-400 w-10 text-right">{s.total} students</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
