// ============================================================
// BEHAVIOUR — COUNSELLING + INTERVENTIONS + REPORTS + MODALS + INDEX
// Eldermin ERP | React + TypeScript + Tailwind
// ============================================================

import React, { useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  MessageSquare, Shield, BarChart2, Plus, Calendar,
  CheckCircle, Clock, AlertTriangle, User, Users,
  Flag, ChevronRight, BookOpen, Star, Heart, Award,
  Zap, X, Save, Send, Trash2, Check, Activity,
} from 'lucide-react';
import {
  CounsellingSession, Intervention,
  GRADES, TARBIYAH_TRAITS, TYPE_CONFIG,
  SEVERITY_CONFIG, CATEGORY_LABELS, BEHAVIOUR_CATEGORIES,
  INTERVENTION_TIERS, TARBIYAH_RATING_CONFIG,
} from './types';
import { StaffSelect } from '../../components/ui/StaffSelect';
import { StudentSelect } from '../../components/ui/StudentSelect';
import { useStaffList } from '../../hooks/useStaffList';
import { useStudents } from '../../hooks/useStudents';
import { TypeBadge, SeverityBadge, PointsBadge, BehaviourDashboard, BehaviourRecordsTab } from './DashboardRecordsTabs';
import { TarbiyahTab } from './TarbiyahTab';
import {
  useCounselling, useInterventions, useBehaviourReport,
  useCreateRecord, useCreateTarbiyah, useCreateSession, useCreateIntervention,
  useRecords, useTarbiyah,
} from '../../hooks/useBehaviour';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { EmptyState, ErrorState } from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';

// ── Shared ────────────────────────────────────────────────────
const ModalWrapper: React.FC<{ title: string; subtitle?: string; onClose: () => void; size?: 'md'|'lg'|'xl'; footer?: React.ReactNode; children: React.ReactNode }> =
  ({ title, subtitle, onClose, size = 'lg', footer, children }) => {
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
    <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (p) => (
  <input {...p} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 text-gray-700 placeholder-gray-400" />
);

const Sel: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ children, ...p }) => (
  <select {...p} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none text-gray-600">{children}</select>
);

const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (p) => (
  <textarea {...p} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none text-gray-700 placeholder-gray-400 resize-none" />
);

const BtnPrimary: React.FC<{ onClick?: () => void; icon?: React.ReactNode; children: React.ReactNode; color?: string }> =
  ({ onClick, icon, children, color = 'bg-[#1e3a5f] hover:bg-[#16304f]' }) => (
    <button onClick={onClick} className={`flex items-center gap-1.5 ${color} text-white text-xs px-5 py-2.5 rounded-lg font-medium transition-colors`}>
      {icon}{children}
    </button>
  );

const BtnSecondary: React.FC<{ onClick?: () => void; children: React.ReactNode }> = ({ onClick, children }) => (
  <button onClick={onClick} className="text-xs border border-gray-200 px-5 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 font-medium">{children}</button>
);

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
  <div className="flex items-center gap-2 mt-3 mb-2">
    <p className="text-[10px] font-bold text-[#1e3a5f] uppercase tracking-wider">{title}</p>
    <div className="flex-1 h-px bg-gray-100" />
  </div>
);

// ============================================================
// COUNSELLING TAB
// ============================================================
const CounsellingCard: React.FC<{ session: CounsellingSession; onView: (s: CounsellingSession) => void }> = ({ session: s, onView }) => {
  const statusCfg: Record<string, string> = {
    scheduled: 'bg-blue-100 text-blue-700',
    completed: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-gray-100 text-gray-600',
    no_show: 'bg-red-100 text-red-700',
  };
  const typeCfg: Record<string, string> = {
    behavioural: 'bg-red-50 text-red-600',
    academic: 'bg-blue-50 text-blue-600',
    emotional: 'bg-purple-50 text-purple-600',
    social: 'bg-teal-50 text-teal-600',
    tarbiyah: 'bg-emerald-50 text-emerald-600',
    family: 'bg-amber-50 text-amber-600',
    general: 'bg-gray-50 text-gray-600',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => onView(s)}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-gray-800">{s.studentName}</p>
          <p className="text-[10px] text-gray-400">{s.grade} · Referred by {s.referredBy}</p>
        </div>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusCfg[s.status]}`}>
          {s.status.replace('_', ' ')}
        </span>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span className={`text-[10px] px-2 py-0.5 rounded font-medium capitalize ${typeCfg[s.type] || 'bg-gray-50 text-gray-600'}`}>
          {s.type} counselling
        </span>
        <span className="text-[10px] text-gray-400 capitalize">{s.format} session</span>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-gray-50 rounded-lg p-2">
          <p className="text-[9px] text-gray-400">Date & Time</p>
          <p className="text-[11px] font-medium text-gray-700 mt-0.5">{s.sessionDate}</p>
          {s.sessionTime && <p className="text-[10px] text-gray-500">{s.sessionTime}</p>}
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <p className="text-[9px] text-gray-400">Counsellor</p>
          <p className="text-[11px] font-medium text-gray-700 mt-0.5">{s.counsellor}</p>
          {s.duration && <p className="text-[10px] text-gray-500">{s.duration} min</p>}
        </div>
      </div>

      {s.status === 'completed' && s.actionPlan && (
        <div className="bg-emerald-50 rounded-lg px-3 py-2 text-[10px] text-emerald-700 mb-2">
          <span className="font-semibold">Action Plan:</span> {s.actionPlan}
        </div>
      )}

      <div className="flex items-center justify-between text-[10px]">
        <div className="flex items-center gap-2">
          {s.parentInformed && <span className="text-emerald-600">✓ Parent informed</span>}
          {s.confidential && <span className="text-gray-400">🔒 Confidential</span>}
          {s.followUpRequired && <span className="text-amber-600">⏰ Follow-up needed</span>}
        </div>
        <button className="text-[#1e3a5f] font-medium hover:underline">View →</button>
      </div>
    </div>
  );
};

export const CounsellingTab: React.FC<{ onOpenModal: (m: string, d?: any) => void }> = ({ onOpenModal }) => {
  const { data: counsellingData, isLoading, isError, refetch } = useCounselling();
  const sessions: CounsellingSession[] = counsellingData?.data ?? [];
  const [filter, setFilter] = useState('all');
  const stats = {
    scheduled: sessions.filter((s: CounsellingSession) => s.status === 'scheduled').length,
    completed: sessions.filter((s: CounsellingSession) => s.status === 'completed').length,
    followUp: sessions.filter((s: CounsellingSession) => s.followUpRequired).length,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-800">Counselling Sessions</h2>
          <p className="text-xs text-gray-400">Student support and guidance records</p>
        </div>
        <button onClick={() => onOpenModal('scheduleSession')}
          className="flex items-center gap-1.5 bg-[#1e3a5f] text-white text-xs px-4 py-2 rounded-lg hover:bg-[#16304f] font-medium">
          <Plus size={14} /> Schedule Session
        </button>
      </div>

      {isLoading && <LoadingSkeleton variant="cards" rows={4} />}
      {isError && <ErrorState message="Could not load counselling sessions" onRetry={refetch} />}

      {!isLoading && !isError && sessions.length === 0 && (
        <EmptyState
          icon={<MessageSquare size={32} />}
          title="No counselling sessions yet"
          description="Schedule sessions to provide targeted support for students."
          actionLabel="+ Schedule Session"
          onAction={() => onOpenModal('scheduleSession')}
        />
      )}

      {!isLoading && !isError && sessions.length > 0 && (
        <>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Total Sessions', value: sessions.length, icon: <MessageSquare size={15} className="text-blue-500" />, bg: 'bg-blue-50' },
              { label: 'Scheduled', value: stats.scheduled, icon: <Clock size={15} className="text-amber-500" />, bg: 'bg-amber-50' },
              { label: 'Completed', value: stats.completed, icon: <CheckCircle size={15} className="text-emerald-500" />, bg: 'bg-emerald-50' },
              { label: 'Need Follow-up', value: stats.followUp, icon: <AlertTriangle size={15} className="text-red-500" />, bg: 'bg-red-50' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3 shadow-sm">
                <div className={`${s.bg} rounded-xl p-2.5`}>{s.icon}</div>
                <div><p className="text-xs text-gray-400">{s.label}</p><p className="text-xl font-bold text-gray-800">{s.value}</p></div>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            {['all', 'scheduled', 'completed', 'no_show'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all capitalize
                  ${filter === f ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
                {f === 'all' ? 'All' : f.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sessions.filter((s: CounsellingSession) => filter === 'all' || s.status === filter).map((s: CounsellingSession) => (
              <CounsellingCard key={s._id} session={s} onView={s => onOpenModal('viewSession', s)} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ============================================================
// INTERVENTIONS TAB
// ============================================================
export const InterventionsTab: React.FC<{ onOpenModal: (m: string, d?: any) => void }> = ({ onOpenModal }) => {
  const { data: interventionsData, isLoading, isError, refetch } = useInterventions();
  const interventionsList: Intervention[] = interventionsData?.data ?? [];
  const [filter, setFilter] = useState('all');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-800">Intervention Plans</h2>
          <p className="text-xs text-gray-400">PBIS-aligned behaviour support plans (Tier 1, 2, 3)</p>
        </div>
        <button onClick={() => onOpenModal('createIntervention')}
          className="flex items-center gap-1.5 bg-[#1e3a5f] text-white text-xs px-4 py-2 rounded-lg hover:bg-[#16304f] font-medium">
          <Plus size={14} /> New Plan
        </button>
      </div>

      {isLoading && <LoadingSkeleton variant="cards" rows={3} />}
      {isError && <ErrorState message="Could not load intervention plans" onRetry={refetch} />}

      {!isLoading && !isError && interventionsList.length === 0 && (
        <EmptyState
          icon={<Shield size={32} />}
          title="No intervention plans yet"
          description="Create PBIS-aligned support plans for students who need targeted help."
          actionLabel="+ New Plan"
          onAction={() => onOpenModal('createIntervention')}
        />
      )}

      {!isLoading && !isError && interventionsList.length > 0 && (
        <>
          {/* Tier Legend */}
          <div className="grid grid-cols-3 gap-3">
            {INTERVENTION_TIERS.map(t => (
              <div key={t.value} className={`rounded-xl border p-3 ${t.color.replace('text-', 'border-').replace('700', '200').replace('600', '200')} bg-white shadow-sm`}>
                <p className={`text-xs font-bold ${t.color}`}>{t.label}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{t.desc}</p>
                <p className="text-lg font-bold text-gray-800 mt-1">
                  {interventionsList.filter((i: Intervention) => i.tier === t.value).length}
                </p>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            {['all', 'active', 'under_review', 'completed'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`text-xs px-3 py-1.5 rounded-lg border font-medium capitalize transition-all
                  ${filter === f ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
                {f === 'all' ? 'All' : f.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {interventionsList.filter((i: Intervention) => filter === 'all' || i.status === filter).map((int: Intervention) => {
          const tierCfg = INTERVENTION_TIERS.find(t => t.value === int.tier);
          const doneActions = int.actions.filter(a => a.status === 'completed').length;
          const progressPct = int.actions.length > 0 ? (doneActions / int.actions.length) * 100 : 0;

          return (
            <div key={int._id} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${tierCfg?.color}`}>{tierCfg?.label}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize
                      ${int.status === 'active' ? 'bg-blue-100 text-blue-700' :
                        int.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                      {int.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-gray-800">{int.title}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{int.studentName} · {int.grade} · Started {int.startDate}</p>
                </div>
                <div className="text-right">
                  {int.reviewDate && (
                    <p className="text-[10px] text-amber-600 font-medium">Review: {int.reviewDate}</p>
                  )}
                </div>
              </div>

              <p className="text-xs text-gray-600 mb-3 line-clamp-2">{int.concern}</p>

              {/* Action Progress */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] font-medium text-gray-600">Action Plan Progress</p>
                  <p className="text-[10px] text-gray-500">{doneActions}/{int.actions.length} actions</p>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className={`h-2 rounded-full transition-all ${progressPct === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                    style={{ width: `${progressPct}%` }} />
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-1.5 mb-3">
                {int.actions.map(a => (
                  <div key={a._id} className="flex items-center gap-2 text-[10px]">
                    {a.status === 'completed'
                      ? <CheckCircle size={12} className="text-emerald-500 flex-shrink-0" />
                      : a.status === 'in_progress'
                      ? <Clock size={12} className="text-amber-500 flex-shrink-0" />
                      : <div className="w-3 h-3 rounded-full border-2 border-gray-300 flex-shrink-0" />}
                    <span className={a.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-600'}>{a.action}</span>
                    <span className="text-gray-400 ml-auto">{a.responsible}</span>
                  </div>
                ))}
              </div>

              {/* Team & Progress Notes */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-[10px] text-gray-400">
                  <Users size={10} />
                  <span>{int.team.slice(0, 2).join(', ')}{int.team.length > 2 ? ` +${int.team.length - 2}` : ''}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => onOpenModal('addProgress', int)}
                    className="text-[10px] border border-gray-200 px-2.5 py-1 rounded text-gray-600 hover:bg-gray-50">
                    + Progress Note
                  </button>
                  <button onClick={() => onOpenModal('viewIntervention', int)}
                    className="text-[10px] text-[#1e3a5f] font-medium hover:underline">Full Plan →</button>
                </div>
              </div>
            </div>
            );
          })}
          </div>
        </>
      )}
    </div>
  );
};

// ============================================================
// REPORTS TAB
// ============================================================
export const BehaviourReportsTab: React.FC = () => {
  const { data: reportData, isLoading, isError, refetch } = useBehaviourReport('2025-26');
  const reportRecords:  any[] = (reportData as any)?.records  ?? [];
  const reportSessions: any[] = (reportData as any)?.sessions ?? [];
  const reportPlans:    any[] = (reportData as any)?.plans    ?? [];
  const reportTarbiyah: any[] = (reportData as any)?.tarbiyah ?? [];
  // Was a hardcoded array of fake category counts ('Late Coming: 18',
  // 'Uniform Violation: 14', etc.) that never reflected real data at all —
  // computed from the actual fetched records instead, same source as every
  // other stat on this page.
  const categoryData = Object.values(
    reportRecords.reduce((acc: Record<string, { name: string; count: number; type: string }>, r: any) => {
      if (!acc[r.category]) acc[r.category] = { name: CATEGORY_LABELS[r.category] || r.category, count: 0, type: r.type };
      acc[r.category].count++;
      return acc;
    }, {})
  ).sort((a: any, b: any) => b.count - a.count).slice(0, 8);

  const tarbiyahChartData = TARBIYAH_TRAITS.map(t => ({
    name: t.nameEn.split('(')[0].trim().split(' ')[0],
    score: reportTarbiyah.length > 0
      ? parseFloat((reportTarbiyah.reduce((sum: number, a: any) => {
          const ts = a.traits?.find((tr: any) => tr.traitKey === t.key);
          return sum + (ts?.score || 0);
        }, 0) / reportTarbiyah.length).toFixed(2))
      : 0,
  })).slice(0, 8);

  if (isLoading) return <LoadingSkeleton variant="stats" />;
  if (isError) return <ErrorState message="Could not load behaviour reports" onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-gray-800">Behaviour & Tarbiyah Reports</h2>
        <p className="text-xs text-gray-400">Academic Year 2025–26 · Comprehensive analysis</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: 'Positivity Rate', value: `${reportRecords.length ? ((reportRecords.filter((r: any) => r.type === 'positive').length / reportRecords.length) * 100).toFixed(1) : '0.0'}%`, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Resolved Rate', value: `${reportRecords.length ? ((reportRecords.filter((r: any) => r.resolved).length / reportRecords.length) * 100).toFixed(0) : 0}%`, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Interventions', value: reportPlans.length, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Sessions Done', value: reportSessions.filter((s: any) => s.status === 'completed').length, color: 'text-teal-600', bg: 'bg-teal-50' },
          { label: 'Avg Tarbiyah', value: `${reportTarbiyah.length ? (reportTarbiyah.reduce((a: number, t: any) => a + t.overallScore, 0) / reportTarbiyah.length).toFixed(1) : '0.0'}/5`, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl p-4 text-center border border-gray-100`}>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Category Chart */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Top Behaviour Categories</h3>
          {categoryData.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-16">No behaviour records yet this academic year</p>
          ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={categoryData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} width={100} />
              <Tooltip />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}
                fill="#6366f1"
                label={{ position: 'right', fontSize: 10, fill: '#6b7280' }} />
            </BarChart>
          </ResponsiveContainer>
          )}
        </div>

        {/* Tarbiyah Scores */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Average Tarbiyah Scores by Trait</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={tarbiyahChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 9 }} />
              <YAxis domain={[0, 5]} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="score" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Positive Students */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Award size={14} className="text-amber-500" /> Merit Honours
          </h3>
          <div className="space-y-2">
            {reportRecords.filter((r: any) => r.type === 'positive')
              .reduce((acc: any[], r: any) => {
                const e = acc.find(a => a.name === r.studentName);
                if (e) { e.count++; e.points += r.points; }
                else acc.push({ name: r.studentName, grade: r.grade, count: 1, points: r.points });
                return acc;
              }, [])
              .sort((a: any, b: any) => b.points - a.points)
              .slice(0, 5)
              .map((s: any, i: number) => (
                <div key={s.name} className="flex items-center gap-3 bg-amber-50 rounded-lg px-3 py-2">
                  <span className="w-5 h-5 rounded-full bg-amber-200 flex items-center justify-center text-[9px] font-bold text-amber-700">{i + 1}</span>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-700">{s.name}</p>
                    <p className="text-[10px] text-gray-400">{s.grade}</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-600">+{s.points} pts</span>
                </div>
              ))}
          </div>
        </div>

        {/* Concern Students */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <AlertTriangle size={14} className="text-red-500" /> Students of Concern
          </h3>
          <div className="space-y-2">
            {reportRecords.filter((r: any) => r.type === 'negative')
              .reduce((acc: any[], r: any) => {
                const e = acc.find(a => a.name === r.studentName);
                if (e) { e.count++; e.points += r.points; }
                else acc.push({ name: r.studentName, grade: r.grade, count: 1, points: r.points });
                return acc;
              }, [])
              .sort((a: any, b: any) => a.points - b.points)
              .slice(0, 5)
              .map((s: any, i: number) => (
                <div key={s.name} className="flex items-center gap-3 bg-red-50 rounded-lg px-3 py-2">
                  <AlertTriangle size={12} className="text-red-500 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-700">{s.name}</p>
                    <p className="text-[10px] text-gray-400">{s.grade} · {s.count} incidents</p>
                  </div>
                  <span className="text-xs font-bold text-red-600">{s.points} pts</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};
// ============================================================
// KEY MODALS
// ============================================================
export const AddRecordModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [type, setType] = useState<'positive' | 'negative' | 'neutral'>('negative');
  const cats = BEHAVIOUR_CATEGORIES[type as keyof typeof BEHAVIOUR_CATEGORIES] || [];
  const createRecord = useCreateRecord();

  const [studentId, setStudentId] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [severity, setSeverity] = useState('medium');
  const [title, setTitle] = useState('');
  const [points, setPoints] = useState(type === 'positive' ? 5 : -5);
  const [consequence, setConsequence] = useState('no_action');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [reportedBy, setReportedBy] = useState('');
  const [parentNotified, setParentNotified] = useState(false);
  const [followUpRequired, setFollowUpRequired] = useState(false);

  const submit = () => {
    const student = selectedStudent;
    if (!student) { toast.error('Select a student'); return; }
    if (!category) { toast.error('Select a category'); return; }
    if (!title.trim()) { toast.error('Enter a title'); return; }
    if (!description.trim()) { toast.error('Enter a description'); return; }
    createRecord.mutate({
      studentId,
      studentName: `${student.firstName || ''} ${student.lastName || ''}`.trim(),
      grade: student.currentGrade,
      section: student.currentSection,
      rollNumber: student.currentRollNumber,
      date, type, category, title, description, severity, points,
      consequence: consequence || undefined,
      location: location || undefined,
      reportedBy: reportedBy || undefined,
      parentNotified, followUpRequired,
    }, {
      onSuccess: () => { toast.success('Behaviour record saved'); onClose(); },
      onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to save record'),
    });
  };

  return (
    <ModalWrapper title="Record Behaviour Incident" onClose={onClose} size="lg"
      footer={<><BtnSecondary onClick={onClose}>Cancel</BtnSecondary><BtnPrimary onClick={submit} icon={<Save size={12} />}>{createRecord.isPending ? 'Saving…' : 'Save Record'}</BtnPrimary></>}>
      <div className="space-y-3">
        {/* Type selector */}
        <div>
          <p className="text-[11px] font-semibold text-gray-500 uppercase mb-2">Behaviour Type *</p>
          <div className="flex gap-2">
            {(['positive', 'negative', 'neutral'] as const).map(t => (
              <button key={t} onClick={() => { setType(t); setCategory(''); setPoints(t === 'positive' ? 5 : t === 'negative' ? -5 : 0); }}
                className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-all capitalize
                  ${type === t ? `${TYPE_CONFIG[t].bg} ${TYPE_CONFIG[t].color} ${TYPE_CONFIG[t].border} border` :
                  'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}>
                {TYPE_CONFIG[t].label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Student" required span><StudentSelect value={studentId} onChange={(id, student) => { setStudentId(id); setSelectedStudent(student); }} /></Field>
          <Field label="Category" required>
            <Sel value={category} onChange={e => setCategory(e.target.value)}><option value="">Select</option>
              {cats.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c] || c}</option>)}
            </Sel>
          </Field>
          <Field label="Date & Time" required><Input type="date" value={date} onChange={e => setDate(e.target.value)} /></Field>
          <Field label="Severity">
            <Sel value={severity} onChange={e => setSeverity(e.target.value)}>
              {Object.entries(SEVERITY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </Sel>
          </Field>
          <Field label="Title" required span><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Brief title of the incident" /></Field>
          <Field label="Points" required><Input type="number" value={points} onChange={e => setPoints(Number(e.target.value))} /></Field>
          <Field label="Consequence">
            <Sel value={consequence} onChange={e => setConsequence(e.target.value)}>
              <option value="no_action">No Action</option><option value="verbal_warning">Verbal Warning</option>
              <option value="written_warning">Written Warning</option><option value="parent_notification">Parent Notification</option>
              <option value="counselling">Counselling</option><option value="detention">Detention</option>
              <option value="suspension">Suspension</option><option value="commendation">Commendation</option>
            </Sel>
          </Field>
        </div>
        <Field label="Description" required>
          <Textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="Detailed description of the incident or observation..." />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Location"><Input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Classroom, Playground, Corridor" /></Field>
          <Field label="Reported By"><StaffSelect onChange={e => setReportedBy(e.target.options[e.target.selectedIndex]?.text ?? '')} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
            <input type="checkbox" checked={parentNotified} onChange={e => setParentNotified(e.target.checked)} className="rounded" /> Parent Notification Required
          </label>
          <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
            <input type="checkbox" checked={followUpRequired} onChange={e => setFollowUpRequired(e.target.checked)} className="rounded" /> Follow-up Required
          </label>
        </div>
      </div>
    </ModalWrapper>
  );
};

export const AddTarbiyahModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [scores, setScores] = useState<Record<string, number>>(
    Object.fromEntries(TARBIYAH_TRAITS.map(t => [t.key, 3]))
  );
  const [notes, setNotes] = useState<Record<string, string>>({});
  const createTarbiyah = useCreateTarbiyah();

  const [studentId, setStudentId] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [period, setPeriod] = useState('');
  const [periodType, setPeriodType] = useState('termly');
  const [assessmentDate, setAssessmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [teacherObservations, setTeacherObservations] = useState('');

  const submit = () => {
    const student = selectedStudent;
    if (!student) { toast.error('Select a student'); return; }
    if (!period.trim()) { toast.error('Enter the assessment period, e.g. Term 1 2025-26'); return; }
    const traits = TARBIYAH_TRAITS.map(t => ({ traitKey: t.key, score: scores[t.key], observation: notes[t.key] || undefined }));
    const overallScore = traits.reduce((a, t) => a + t.score, 0) / traits.length;
    createTarbiyah.mutate({
      studentId,
      studentName: `${student.firstName || ''} ${student.lastName || ''}`.trim(),
      grade: student.currentGrade,
      section: student.currentSection,
      period, periodType, assessmentDate, traits,
      overallScore: Math.round(overallScore * 10) / 10,
      teacherObservations: teacherObservations || undefined,
    }, {
      onSuccess: () => { toast.success('Tarbiyah assessment saved'); onClose(); },
      onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to save assessment'),
    });
  };

  return (
    <ModalWrapper title="Tarbiyah Assessment" subtitle="Islamic Character Development Evaluation" onClose={onClose} size="xl"
      footer={<><BtnSecondary onClick={onClose}>Cancel</BtnSecondary><BtnPrimary onClick={submit} icon={<Save size={12} />}>{createTarbiyah.isPending ? 'Saving…' : 'Save Assessment'}</BtnPrimary></>}>
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <Field label="Student" required span><StudentSelect value={studentId} onChange={(id, student) => { setStudentId(id); setSelectedStudent(student); }} /></Field>
          <Field label="Period" required><Input value={period} onChange={e => setPeriod(e.target.value)} placeholder="e.g. Term 1 2025-26" /></Field>
          <Field label="Assessment Date" required><Input type="date" value={assessmentDate} onChange={e => setAssessmentDate(e.target.value)} /></Field>
          <Field label="Period Type">
            <Sel value={periodType} onChange={e => setPeriodType(e.target.value)}>
              <option value="termly">Termly</option><option value="monthly">Monthly</option><option value="annual">Annual</option>
            </Sel>
          </Field>
        </div>

        <SectionHeader title="Trait Scores (1 = Critical · 5 = Excellent)" />
        <div className="grid grid-cols-2 gap-3">
          {TARBIYAH_TRAITS.map(t => (
            <div key={t.key} className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-xs font-semibold text-gray-700">{t.nameEn}</p>
                  <p className="text-[10px] text-gray-400" dir="rtl">{t.nameAr}</p>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(s => (
                    <button key={s} onClick={() => setScores(prev => ({ ...prev, [t.key]: s }))}
                      className={`w-6 h-6 rounded-full text-[10px] font-bold transition-all
                        ${scores[t.key] >= s ? 'bg-amber-400 text-white' : 'bg-gray-200 text-gray-500 hover:bg-amber-100'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <Input placeholder="Observation note..." value={notes[t.key] || ''} onChange={e => setNotes(prev => ({ ...prev, [t.key]: e.target.value }))} className="text-[10px]" />
            </div>
          ))}
        </div>

        <Field label="Teacher Observations">
          <Textarea rows={2} value={teacherObservations} onChange={e => setTeacherObservations(e.target.value)} placeholder="Overall character observations and recommendations..." />
        </Field>
      </div>
    </ModalWrapper>
  );
};

export const ScheduleSessionModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const createSession = useCreateSession();

  const [studentId, setStudentId] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [type, setType] = useState('behavioural');
  const [format, setFormat] = useState('individual');
  const [sessionDate, setSessionDate] = useState('');
  const [sessionTime, setSessionTime] = useState('');
  const [duration, setDuration] = useState(45);
  const [counsellor, setCounsellor] = useState('');
  const [referredBy, setReferredBy] = useState('');
  const [referralReason, setReferralReason] = useState('');
  const [parentInformed, setParentInformed] = useState(false);
  const [confidential, setConfidential] = useState(false);

  const submit = () => {
    const student = selectedStudent;
    if (!student) { toast.error('Select a student'); return; }
    if (!sessionDate) { toast.error('Select a session date'); return; }
    if (!counsellor) { toast.error('Select a counsellor'); return; }
    if (!referredBy) { toast.error('Select who referred this student'); return; }
    createSession.mutate({
      studentId,
      studentName: `${student.firstName || ''} ${student.lastName || ''}`.trim(),
      grade: student.currentGrade,
      section: student.currentSection,
      sessionDate, sessionTime: sessionTime || undefined, duration,
      type, format, counsellor, referredBy,
      referralReason: referralReason || undefined,
      parentInformed, confidential,
    }, {
      onSuccess: () => { toast.success('Counselling session scheduled'); onClose(); },
      onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to schedule session'),
    });
  };

  return (
    <ModalWrapper title="Schedule Counselling Session" onClose={onClose} size="md"
      footer={<><BtnSecondary onClick={onClose}>Cancel</BtnSecondary><BtnPrimary onClick={submit} icon={<Calendar size={12} />}>{createSession.isPending ? 'Scheduling…' : 'Schedule'}</BtnPrimary></>}>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Student" required span><StudentSelect value={studentId} onChange={(id, student) => { setStudentId(id); setSelectedStudent(student); }} /></Field>
          <Field label="Counselling Type" required>
            <Sel value={type} onChange={e => setType(e.target.value)}>
              <option value="behavioural">Behavioural</option><option value="academic">Academic</option>
              <option value="emotional">Emotional</option><option value="social">Social</option>
              <option value="tarbiyah">Tarbiyah</option><option value="family">Family</option>
            </Sel>
          </Field>
          <Field label="Format">
            <Sel value={format} onChange={e => setFormat(e.target.value)}>
              <option value="individual">Individual</option><option value="group">Group</option>
              <option value="parent">With Parent</option><option value="family">Family</option>
            </Sel>
          </Field>
          <Field label="Session Date" required><Input type="date" value={sessionDate} onChange={e => setSessionDate(e.target.value)} /></Field>
          <Field label="Session Time"><Input type="time" value={sessionTime} onChange={e => setSessionTime(e.target.value)} /></Field>
          <Field label="Duration (mins)"><Input type="number" value={duration} onChange={e => setDuration(Number(e.target.value))} /></Field>
          <Field label="Counsellor" required><StaffSelect placeholder="Select Counsellor" onChange={e => setCounsellor(e.target.options[e.target.selectedIndex]?.text ?? '')} /></Field>
          <Field label="Referred By" required><StaffSelect onChange={e => setReferredBy(e.target.options[e.target.selectedIndex]?.text ?? '')} /></Field>
        </div>
        <Field label="Referral Reason">
          <Textarea rows={2} value={referralReason} onChange={e => setReferralReason(e.target.value)} placeholder="Why is this student being referred for counselling?" />
        </Field>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
            <input type="checkbox" checked={parentInformed} onChange={e => setParentInformed(e.target.checked)} className="rounded" /> Inform Parent
          </label>
          <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
            <input type="checkbox" checked={confidential} onChange={e => setConfidential(e.target.checked)} className="rounded" /> Confidential Session
          </label>
        </div>
      </div>
    </ModalWrapper>
  );
};

export const CreateInterventionModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [actions, setActions] = useState([{ action: '', responsible: '', dueDate: '' }]);
  const { data: staffData } = useStaffList();
  const createIntervention = useCreateIntervention();

  const [studentId, setStudentId] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [type, setType] = useState('behavioural');
  const [tier, setTier] = useState(INTERVENTION_TIERS[0]?.value ?? 'tier2_targeted');
  const [startDate, setStartDate] = useState('');
  const [reviewDate, setReviewDate] = useState('');
  const [title, setTitle] = useState('');
  const [concern, setConcern] = useState('');
  const [team, setTeam] = useState<string[]>([]);

  const toggleTeamMember = (name: string) =>
    setTeam(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);

  const submit = () => {
    const student = selectedStudent;
    if (!student) { toast.error('Select a student'); return; }
    if (!title.trim()) { toast.error('Enter a title'); return; }
    if (!concern.trim()) { toast.error('Describe the concern'); return; }
    if (!startDate) { toast.error('Select a start date'); return; }
    createIntervention.mutate({
      studentId,
      studentName: `${student.firstName || ''} ${student.lastName || ''}`.trim(),
      grade: student.currentGrade,
      section: student.currentSection,
      type, tier, title, concern, startDate,
      reviewDate: reviewDate || undefined,
      actions: actions.filter(a => a.action.trim()),
      team,
    }, {
      onSuccess: () => { toast.success('Intervention plan created'); onClose(); },
      onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to create plan'),
    });
  };

  return (
    <ModalWrapper title="Create Intervention Plan" subtitle="PBIS-aligned behaviour support" onClose={onClose} size="xl"
      footer={<><BtnSecondary onClick={onClose}>Cancel</BtnSecondary><BtnPrimary onClick={submit} icon={<Save size={12} />}>{createIntervention.isPending ? 'Creating…' : 'Create Plan'}</BtnPrimary></>}>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Student" required span><StudentSelect value={studentId} onChange={(id, student) => { setStudentId(id); setSelectedStudent(student); }} /></Field>
          <Field label="Type" required>
            <Sel value={type} onChange={e => setType(e.target.value)}>
              <option value="behavioural">Behavioural</option><option value="academic">Academic</option>
              <option value="emotional">Emotional</option><option value="tarbiyah">Tarbiyah</option>
              <option value="attendance">Attendance</option>
            </Sel>
          </Field>
          <Field label="Tier" required>
            <Sel value={tier} onChange={e => setTier(e.target.value)}>
              {INTERVENTION_TIERS.map(t => <option key={t.value} value={t.value}>{t.label} — {t.desc}</option>)}
            </Sel>
          </Field>
          <Field label="Start Date" required><Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></Field>
          <Field label="Review Date"><Input type="date" value={reviewDate} onChange={e => setReviewDate(e.target.value)} /></Field>
        </div>
        <Field label="Title" required><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Behaviour Improvement Plan — Student Name" /></Field>
        <Field label="Concern" required>
          <Textarea rows={2} value={concern} onChange={e => setConcern(e.target.value)} placeholder="What specific behaviour concern is this plan addressing?" />
        </Field>
        <SectionHeader title="Action Steps" />
        {actions.map((a, i) => (
          <div key={i} className="grid grid-cols-5 gap-2 items-end">
            <div className="col-span-2">
              {i === 0 && <p className="text-[10px] text-gray-400 mb-1">Action</p>}
              <Input placeholder="Specific action step" value={a.action} onChange={e => setActions(prev => prev.map((x, j) => j === i ? { ...x, action: e.target.value } : x))} />
            </div>
            <div>
              {i === 0 && <p className="text-[10px] text-gray-400 mb-1">Responsible</p>}
              <StaffSelect placeholder="Staff" onChange={e => {
                const name = e.target.options[e.target.selectedIndex]?.text ?? '';
                setActions(prev => prev.map((x, j) => j === i ? { ...x, responsible: name } : x));
              }} />
            </div>
            <div>
              {i === 0 && <p className="text-[10px] text-gray-400 mb-1">Due Date</p>}
              <Input type="date" value={a.dueDate} onChange={e => setActions(prev => prev.map((x, j) => j === i ? { ...x, dueDate: e.target.value } : x))} />
            </div>
            <button onClick={() => setActions(prev => prev.filter((_, j) => j !== i))}
              className="p-2 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={13} /></button>
          </div>
        ))}
        <button onClick={() => setActions(prev => [...prev, { action: '', responsible: '', dueDate: '' }])}
          className="flex items-center gap-1.5 text-xs text-[#1e3a5f] font-medium hover:underline">
          <Plus size={12} /> Add Action
        </button>
        <SectionHeader title="Support Team" />
        <div className="grid grid-cols-3 gap-2">
          {(staffData || []).slice(0, 6).map((s: any) => {
            const name = `${s.firstName} ${s.lastName}`
            return (
              <label key={s._id} className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer bg-gray-50 rounded-lg px-3 py-2">
                <input type="checkbox" checked={team.includes(name)} onChange={() => toggleTeamMember(name)} className="rounded" />{name}
              </label>
            )
          })}
        </div>
      </div>
    </ModalWrapper>
  );
};

// ============================================================
// MAIN INDEX
// ============================================================
const TABS = [
  { key: 'dashboard', label: 'Dashboard', icon: <BarChart2 size={14} /> },
  { key: 'records', label: 'Records', icon: <Flag size={14} /> },
  { key: 'tarbiyah', label: 'Tarbiyah', icon: <Heart size={14} /> },
  { key: 'counselling', label: 'Counselling', icon: <MessageSquare size={14} /> },
  { key: 'interventions', label: 'Interventions', icon: <Shield size={14} /> },
  { key: 'reports', label: 'Reports', icon: <Activity size={14} /> },
] as const;

type TabKey = typeof TABS[number]['key'];
const DEFAULT_MODALS = {
  addRecord: false, viewRecord: false, resolveRecord: false,
  addTarbiyah: false, viewTarbiyah: false,
  scheduleSession: false, viewSession: false,
  createIntervention: false, viewIntervention: false, addProgress: false,
};

const BehaviourModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [modals, setModals] = useState(DEFAULT_MODALS);
  const [selectedData, setSelectedData] = useState<any>(null);

  // Tab badges used to be hardcoded strings ('5', '2', '1', '1') baked into
  // the TABS array — permanently showing the same fake counts no matter how
  // many real records/sessions/interventions actually existed. Computing
  // them for real here instead.
  const { data: recordsForBadge } = useRecords();
  const { data: tarbiyahForBadge } = useTarbiyah();
  const { data: counsellingForBadge } = useCounselling();
  const { data: interventionsForBadge } = useInterventions();
  const badgeCounts: Record<string, number> = {
    records: (recordsForBadge?.data ?? []).filter((r: any) => !r.resolved).length,
    tarbiyah: (tarbiyahForBadge?.data ?? []).filter((t: any) => t.overallScore < 3).length,
    counselling: (counsellingForBadge?.data ?? []).filter((s: any) => s.status === 'scheduled').length,
    interventions: (interventionsForBadge?.data ?? []).filter((i: any) => i.status === 'active').length,
  };

  const openModal = (modal: string, data?: any) => {
    setSelectedData(data);
    setModals({ ...DEFAULT_MODALS, [modal]: true });
  };
  const closeModals = () => { setModals(DEFAULT_MODALS); setSelectedData(null); };

  const renderTab = () => {
    switch (activeTab) {
      case 'dashboard': return <BehaviourDashboard />;
      case 'records': return <BehaviourRecordsTab onOpenModal={openModal} />;
      case 'tarbiyah': return <TarbiyahTab onOpenModal={openModal} />;
      case 'counselling': return <CounsellingTab onOpenModal={openModal} />;
      case 'interventions': return <InterventionsTab onOpenModal={openModal} />;
      case 'reports': return <BehaviourReportsTab />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 pt-5 pb-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-[#1e3a5f] to-emerald-500 rounded-xl flex items-center justify-center">
              <Heart size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Behaviour & Tarbiyah</h1>
              <p className="text-xs text-gray-400">Character Development & Conduct Management · 2025–26</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => openModal('addRecord')}
              className="flex items-center gap-1.5 bg-[#1e3a5f] text-white text-xs px-4 py-2 rounded-lg hover:bg-[#16304f] font-medium shadow-sm">
              <Plus size={13} /> Record Incident
            </button>
            <button onClick={() => openModal('addTarbiyah')}
              className="flex items-center gap-1.5 bg-emerald-600 text-white text-xs px-4 py-2 rounded-lg hover:bg-emerald-700 font-medium">
              <Heart size={13} /> Tarbiyah Assessment
            </button>
          </div>
        </div>
        <div className="flex gap-0">
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-medium border-b-2 whitespace-nowrap transition-all
                ${activeTab === tab.key ? 'border-[#1e3a5f] text-[#1e3a5f]' : 'border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}>
              {tab.icon} {tab.label}
              {badgeCounts[tab.key] > 0 && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">
                  {badgeCounts[tab.key]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">{renderTab()}</div>

      {/* Modals */}
      {modals.addRecord && <AddRecordModal onClose={closeModals} />}
      {modals.addTarbiyah && <AddTarbiyahModal onClose={closeModals} />}
      {modals.scheduleSession && <ScheduleSessionModal onClose={closeModals} />}
      {modals.createIntervention && <CreateInterventionModal onClose={closeModals} />}
    </div>
  );
};

export default BehaviourModule;
