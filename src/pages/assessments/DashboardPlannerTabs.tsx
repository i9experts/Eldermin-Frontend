// ============================================================
// ASSESSMENT — DASHBOARD + PLANNER TABS
// Eldermin ERP | React + TypeScript + Tailwind
// ============================================================

import React, { useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  ClipboardList, CheckCircle, Clock, AlertTriangle, TrendingUp,
  BookOpen, Star, Users, Calendar, Plus, Eye, Edit2,
  ArrowUpRight, ChevronRight, Award, Target, Filter,
  BarChart2, Play, Pause, CheckSquare, XCircle, Send,
} from 'lucide-react';
import { Assessment, ASSESSMENT_TYPES, ASSESSMENT_STATUSES, GRADES, TERMS, SUBJECTS } from './types';
import { useAssessmentDashboard, useAssessments } from '@/hooks/useAssessments';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState, ErrorState } from '@/components/ui/EmptyState';

// ── Shared UI ─────────────────────────────────────────────────
export const StatCard: React.FC<{
  title: string; value: string | number; sub?: string;
  icon: React.ReactNode; iconBg: string; trend?: number;
}> = ({ title, value, sub, icon, iconBg, trend }) => (
  <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{title}</p>
        <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
        {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
        {trend !== undefined && (
          <div className={`flex items-center gap-1 mt-1 text-[10px] font-medium ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            <ArrowUpRight size={10} />{Math.abs(trend)}% vs last month
          </div>
        )}
      </div>
      <div className={`${iconBg} rounded-xl p-3`}>{icon}</div>
    </div>
  </div>
);

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const cfg = ASSESSMENT_STATUSES.find(s => s.value === status);
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg?.color || 'bg-gray-100 text-gray-600'}`}>
      {cfg?.label || status}
    </span>
  );
};

export const TypeBadge: React.FC<{ type: string }> = ({ type }) => {
  const cfg = ASSESSMENT_TYPES.find(t => t.value === type);
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg?.color || 'bg-gray-100 text-gray-600'}`}>
      {cfg?.label || type}
    </span>
  );
};

// ── DASHBOARD ─────────────────────────────────────────────────
const ZERO_DASH = {
  stats: { total: 0, scheduled: 0, ongoing: 0, completed: 0, published: 0, totalQuestions: 0, totalMarksEntered: 0 },
  byType: [] as { _id: string; count: number }[],
  avgPerformance: [] as { _id: string; avgPct: number; passCount: number; failCount: number; total: number }[],
  upcomingAssessments: [] as { _id: string; title: string; type: string; grade: string; status: string; startDate: string }[],
};

export const AssessmentDashboard: React.FC = () => {
  const { data, isLoading, isError, refetch } = useAssessmentDashboard();

  if (isLoading) return <LoadingSkeleton variant="stats" />;
  if (isError) return <ErrorState message="Could not load assessment dashboard" onRetry={refetch} />;

  const d = (data ?? ZERO_DASH) as typeof ZERO_DASH;

  const gradeRadarData = d.avgPerformance.map(g => ({
    grade: g._id,
    average: parseFloat(g.avgPct.toFixed(1)),
    passRate: parseFloat(((g.passCount / g.total) * 100).toFixed(1)),
  }));

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2563eb] rounded-xl p-5 text-white flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Assessment & Examination Center</h2>
          <p className="text-blue-200 text-xs mt-0.5">Academic Year 2025–26 · Spring Term</p>
        </div>
        <div className="flex gap-3">
          {[
            { label: 'Published', value: d.stats.published },
            { label: 'Ongoing', value: d.stats.ongoing },
            { label: 'Scheduled', value: d.stats.scheduled },
          ].map(s => (
            <div key={s.label} className="bg-white/10 rounded-lg px-4 py-2 text-center">
              <p className="text-xl font-bold">{s.value}</p>
              <p className="text-blue-200 text-[10px]">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard title="Total Assessments" value={d.stats.total} sub="This academic year"
          icon={<ClipboardList size={18} className="text-blue-600" />} iconBg="bg-blue-50" trend={8} />
        <StatCard title="Results Published" value={d.stats.published} sub="Accessible to parents"
          icon={<CheckCircle size={18} className="text-emerald-600" />} iconBg="bg-emerald-50" />
        <StatCard title="Question Bank" value={d.stats.totalQuestions} sub="Active questions"
          icon={<BookOpen size={18} className="text-purple-600" />} iconBg="bg-purple-50" trend={15} />
        <StatCard title="Marks Entered" value={d.stats.totalMarksEntered.toLocaleString()} sub="Student-subject records"
          icon={<Target size={18} className="text-amber-600" />} iconBg="bg-amber-50" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-3 gap-4">
        {/* By Type */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Assessment by Type</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={d.byType} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis dataKey="_id" type="category" tick={{ fontSize: 10 }} width={70}
                tickFormatter={v => ASSESSMENT_TYPES.find(t => t.value === v)?.label || v} />
              <Tooltip formatter={(v, n, p) => [v, ASSESSMENT_TYPES.find(t => t.value === p.payload._id)?.label || p.payload._id]} />
              <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} name="Count" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Grade Performance */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Grade Performance</h3>
          <ResponsiveContainer width="100%" height={180}>
            <RadarChart data={gradeRadarData}>
              <PolarGrid stroke="#f0f0f0" />
              <PolarAngleAxis dataKey="grade" tick={{ fontSize: 10 }} />
              <Radar name="Average %" dataKey="average" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
              <Radar name="Pass Rate %" dataKey="passRate" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Upcoming */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Upcoming Assessments</h3>
          <div className="space-y-2">
            {d.upcomingAssessments.map(a => (
              <div key={a._id} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="bg-blue-50 rounded-lg p-2 flex-shrink-0">
                  <Calendar size={12} className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-700 truncate">{a.title}</p>
                  <p className="text-[10px] text-gray-400">{a.grade} · {a.startDate}</p>
                </div>
                <TypeBadge type={a.type} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Table */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Grade-wise Performance Summary</h3>
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 text-gray-500 border-b border-gray-100">
              <th className="py-2 px-4 text-left font-semibold">Grade</th>
              <th className="py-2 px-4 text-center font-semibold">Avg %</th>
              <th className="py-2 px-4 text-center font-semibold">Pass</th>
              <th className="py-2 px-4 text-center font-semibold">Fail</th>
              <th className="py-2 px-4 text-center font-semibold">Total</th>
              <th className="py-2 px-4 text-center font-semibold">Pass Rate</th>
            </tr>
          </thead>
          <tbody>
            {d.avgPerformance.map(g => (
              <tr key={g._id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-2.5 px-4 font-medium text-gray-800">{g._id}</td>
                <td className="py-2.5 px-4 text-center">
                  <span className={`font-bold ${g.avgPct >= 70 ? 'text-emerald-600' : g.avgPct >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                    {g.avgPct.toFixed(1)}%
                  </span>
                </td>
                <td className="py-2.5 px-4 text-center text-emerald-600 font-medium">{g.passCount}</td>
                <td className="py-2.5 px-4 text-center text-red-500 font-medium">{g.failCount}</td>
                <td className="py-2.5 px-4 text-center text-gray-600">{g.total}</td>
                <td className="py-2.5 px-4 text-center">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                      <div className="bg-emerald-500 h-1.5 rounded-full"
                        style={{ width: `${(g.passCount / g.total) * 100}%` }} />
                    </div>
                    <span className="text-gray-600 w-10 text-right">
                      {((g.passCount / g.total) * 100).toFixed(0)}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── PLANNER TAB ───────────────────────────────────────────────
interface PlannerTabProps { onOpenModal: (modal: string, data?: any) => void; }

export const PlannerTab: React.FC<PlannerTabProps> = ({ onOpenModal }) => {
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterGrade, setFilterGrade] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [view, setView] = useState<'cards' | 'table'>('cards');

  const { data: listData, isLoading, isError, refetch } = useAssessments();
  const assessments: Assessment[] = (listData?.data as Assessment[] | undefined) ?? [];

  const filtered = assessments.filter(a => {
    const matchStatus = filterStatus === 'all' || a.status === filterStatus;
    const matchGrade = filterGrade === 'all' || a.grade === filterGrade;
    const matchType = filterType === 'all' || a.type === filterType;
    return matchStatus && matchGrade && matchType;
  });

  const statusActions: Record<string, string[]> = {
    draft: ['Edit', 'Activate', 'Delete'],
    scheduled: ['Edit', 'Start', 'Cancel'],
    ongoing: ['Enter Marks', 'Complete'],
    completed: ['Enter Marks', 'Generate Report Cards'],
    result_published: ['View Report Cards'],
    cancelled: [],
  };

  if (isLoading) return <LoadingSkeleton variant="cards" rows={6} />;
  if (isError) return <ErrorState message="Could not load assessments" onRetry={refetch} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-800">Assessment Planner</h2>
          <p className="text-xs text-gray-400">Schedule and manage all assessments</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setView(v => v === 'cards' ? 'table' : 'cards')}
            className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg text-gray-600 hover:bg-gray-50">
            {view === 'cards' ? '☰ Table' : '⊞ Cards'}
          </button>
          <button onClick={() => onOpenModal('createAssessment')}
            className="flex items-center gap-1.5 bg-[#1e3a5f] text-white text-xs px-4 py-2 rounded-lg hover:bg-[#16304f] font-medium">
            <Plus size={14} /> New Assessment
          </button>
        </div>
      </div>

      {/* Status strip */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['all', ...ASSESSMENT_STATUSES.map(s => s.value)].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-lg border font-medium transition-all
              ${filterStatus === s ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
            {s === 'all' ? 'All' : ASSESSMENT_STATUSES.find(st => st.value === s)?.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm flex items-center gap-3">
        <select value={filterGrade} onChange={e => setFilterGrade(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-3 py-2 text-gray-600 focus:outline-none">
          <option value="all">All Grades</option>
          {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-3 py-2 text-gray-600 focus:outline-none">
          <option value="all">All Types</option>
          {ASSESSMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <span className="text-xs text-gray-400 ml-auto">{filtered.length} assessments</span>
      </div>

      {/* Cards */}
      {view === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(a => (
            <div key={a._id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{a.title}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{a.grade} · {a.term || 'No Term'} · {a.academicYear}</p>
                </div>
                <StatusBadge status={a.status} />
              </div>

              <div className="flex items-center gap-2 mb-3">
                <TypeBadge type={a.type} />
                <span className="text-[10px] text-gray-400">
                  <Calendar size={9} className="inline mr-0.5" />{a.startDate}
                </span>
              </div>

              {/* Subjects */}
              <div className="bg-gray-50 rounded-lg p-2 mb-3">
                <p className="text-[9px] text-gray-400 font-semibold mb-1">SUBJECTS ({a.subjects.length})</p>
                <div className="flex flex-wrap gap-1">
                  {a.subjects.map(s => (
                    <span key={s.subject} className="text-[9px] bg-white border border-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                      {s.subject} / {s.totalMarks}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-wrap">
                <button onClick={() => onOpenModal('viewAssessment', a)}
                  className="text-[10px] border border-gray-200 px-2.5 py-1 rounded-lg text-gray-600 hover:bg-gray-50 flex items-center gap-1">
                  <Eye size={10} /> View
                </button>
                {(statusActions[a.status] || []).map(action => (
                  <button key={action}
                    onClick={() => {
                      if (action === 'Enter Marks') onOpenModal('markEntry', a);
                      else if (action === 'Generate Report Cards') onOpenModal('generateReportCards', a);
                      else if (action === 'View Report Cards') onOpenModal('viewReportCards', a);
                      else if (action === 'Edit') onOpenModal('editAssessment', a);
                      else onOpenModal('confirmAction', { assessment: a, action });
                    }}
                    className={`text-[10px] px-2.5 py-1 rounded-lg flex items-center gap-1 font-medium transition-colors
                      ${action === 'Enter Marks' ? 'bg-[#1e3a5f] text-white hover:bg-[#16304f]' :
                        action.includes('Report') ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' :
                        'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                    {action}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {assessments.length === 0 && (
            <div className="col-span-3">
              <EmptyState
                icon={<ClipboardList size={32} />}
                title="No assessments yet"
                description="Create your first assessment to get started."
                actionLabel="+ New Assessment"
                onAction={() => onOpenModal('createAssessment')}
              />
            </div>
          )}
          {assessments.length > 0 && filtered.length === 0 && (
            <div className="col-span-3 py-12 text-center text-sm text-gray-400">No assessments match your filters</div>
          )}
        </div>
      )}

      {/* Table */}
      {view === 'table' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 text-gray-500 border-b border-gray-100">
                <th className="py-3 px-4 text-left font-semibold">Title</th>
                <th className="py-3 px-4 font-semibold">Type</th>
                <th className="py-3 px-4 font-semibold">Grade</th>
                <th className="py-3 px-4 font-semibold">Date</th>
                <th className="py-3 px-4 font-semibold">Subjects</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(a => (
                <tr key={a._id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2.5 px-4 font-medium text-gray-800">{a.title}</td>
                  <td className="py-2.5 px-4"><TypeBadge type={a.type} /></td>
                  <td className="py-2.5 px-4 text-gray-600">{a.grade}</td>
                  <td className="py-2.5 px-4 text-gray-500">{a.startDate}</td>
                  <td className="py-2.5 px-4 text-gray-500">{a.subjects.length} subjects</td>
                  <td className="py-2.5 px-4"><StatusBadge status={a.status} /></td>
                  <td className="py-2.5 px-4">
                    <div className="flex gap-1">
                      <button onClick={() => onOpenModal('viewAssessment', a)}
                        className="text-[10px] text-[#1e3a5f] hover:underline">View</button>
                      {a.status === 'completed' && (
                        <button onClick={() => onOpenModal('markEntry', a)}
                          className="text-[10px] text-emerald-600 hover:underline ml-1">Marks</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
