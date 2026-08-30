// ============================================================
// BEHAVIOUR & TARBIYAH — DASHBOARD + RECORDS TABS
// Eldermin ERP | React + TypeScript + Tailwind
// ============================================================

import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  AlertTriangle, CheckCircle, TrendingUp,
  Shield, Clock, Plus,
  Search, RefreshCw, CheckSquare,
  Zap, Flag, MessageSquare,
} from 'lucide-react';
import {
  BehaviourRecord, TYPE_CONFIG, SEVERITY_CONFIG,
  CATEGORY_LABELS, GRADES,
} from './types';
import { useBehaviourDashboard, useRecords } from '../../hooks/useBehaviour';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { EmptyState, ErrorState } from '../../components/ui/EmptyState';

// ── Shared Badges ─────────────────────────────────────────────
export const TypeBadge: React.FC<{ type: string }> = ({ type }) => {
  const cfg = TYPE_CONFIG[type as keyof typeof TYPE_CONFIG];
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg?.bg} ${cfg?.color}`}>
      {cfg?.label || type}
    </span>
  );
};

export const SeverityBadge: React.FC<{ severity: string }> = ({ severity }) => {
  const cfg = SEVERITY_CONFIG[severity as keyof typeof SEVERITY_CONFIG];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg?.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg?.dot}`} />
      {cfg?.label}
    </span>
  );
};

export const PointsBadge: React.FC<{ points: number }> = ({ points }) => (
  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full
    ${points > 0 ? 'bg-emerald-100 text-emerald-700' :
      points < 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
    {points > 0 ? `+${points}` : points} pts
  </span>
);

// ── DASHBOARD ─────────────────────────────────────────────────
const StatCard: React.FC<{
  title: string; value: string | number; sub?: string;
  icon: React.ReactNode; iconBg: string; alert?: boolean;
}> = ({ title, value, sub, icon, iconBg, alert }) => (
  <div className={`bg-white rounded-xl border p-4 shadow-sm hover:shadow-md transition-all ${alert ? 'border-red-200' : 'border-gray-100'}`}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{title}</p>
        <p className={`text-2xl font-bold mt-1 ${alert ? 'text-red-600' : 'text-gray-800'}`}>{value}</p>
        {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
      </div>
      <div className={`${iconBg} rounded-xl p-2.5`}>{icon}</div>
    </div>
  </div>
);

export const BehaviourDashboard: React.FC = () => {
  const { data: dashData, isLoading, isError, refetch } = useBehaviourDashboard();

  if (isLoading) return <LoadingSkeleton variant="stats" />;
  if (isError) return <ErrorState message="Could not load behaviour dashboard" onRetry={refetch} />;

  const ZERO_STATS = {
    totalIncidents: 0, positiveIncidents: 0, negativeIncidents: 0,
    unresolvedCritical: 0, incidentsThisWeek: 0, positivityRatio: 0,
    activeInterventions: 0, pendingCounselling: 0, activeBehaviourContracts: 0, overdueFollowUps: 0,
  };
  const s = dashData?.stats ?? ZERO_STATS;
  const trend:    any[] = dashData?.trendByMonth ?? [];
  const byGrade:  any[] = dashData?.incidentsByGrade ?? [];
  const concerns: any[] = dashData?.topBehaviourConcerns ?? [];
  const atRisk:   any[] = dashData?.studentsAtRisk ?? [];

  return (
    <div className="space-y-6">
      {/* Stats strip — the module header above already establishes the
          "Behaviour & Tarbiyah" title, so this no longer repeats it in a
          second navy banner; it just surfaces the three at-a-glance
          numbers that are useful here and not shown elsewhere. */}
      <div className="flex gap-3">
        {[
          { label: 'Positivity', value: `${s.positivityRatio}%` },
          { label: 'Active Plans', value: s.activeInterventions },
          { label: 'At Risk', value: atRisk.length },
        ].map(x => (
          <div key={x.label} className="flex-1 bg-white rounded-xl border border-gray-100 px-4 py-3 text-center shadow-sm">
            <p className="text-xl font-bold text-gray-800">{x.value}</p>
            <p className="text-gray-400 text-[10px] font-semibold uppercase tracking-wide mt-0.5">{x.label}</p>
          </div>
        ))}
      </div>

      {/* Alert strip */}
      {(s.unresolvedCritical > 0 || s.overdueFollowUps > 0) && (
        <div className="flex gap-3">
          {s.unresolvedCritical > 0 && (
            <div className="flex-1 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-3">
              <AlertTriangle size={16} className="text-red-600 flex-shrink-0" />
              <p className="text-xs text-red-800 font-medium">
                <strong>{s.unresolvedCritical} critical incidents</strong> are unresolved and require immediate attention.
              </p>
              <button className="ml-auto text-xs text-red-600 font-medium hover:underline whitespace-nowrap">View Now →</button>
            </div>
          )}
          {s.overdueFollowUps > 0 && (
            <div className="flex-1 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
              <Clock size={16} className="text-amber-600 flex-shrink-0" />
              <p className="text-xs text-amber-800 font-medium">
                <strong>{s.overdueFollowUps} follow-ups</strong> are overdue.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard title="Total Incidents" value={s.totalIncidents} sub="This academic year"
          icon={<Flag size={16} className="text-gray-500" />} iconBg="bg-gray-50" />
        <StatCard title="Positive Records" value={s.positiveIncidents} sub={`${s.positivityRatio}% positivity`}
          icon={<CheckCircle size={16} className="text-emerald-500" />} iconBg="bg-emerald-50" />
        <StatCard title="Negative Records" value={s.negativeIncidents} sub="Requires monitoring"
          icon={<AlertTriangle size={16} className="text-red-500" />} iconBg="bg-red-50" />
        <StatCard title="Critical Unresolved" value={s.unresolvedCritical} sub="Needs immediate action"
          icon={<Zap size={16} className="text-red-600" />} iconBg="bg-red-50" alert={s.unresolvedCritical > 0} />
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard title="Active Interventions" value={s.activeInterventions} sub="PBIS plans in progress"
          icon={<Shield size={16} className="text-blue-500" />} iconBg="bg-blue-50" />
        <StatCard title="Counselling Scheduled" value={s.pendingCounselling} sub="Upcoming sessions"
          icon={<MessageSquare size={16} className="text-purple-500" />} iconBg="bg-purple-50" />
        <StatCard title="Behaviour Contracts" value={s.activeBehaviourContracts} sub="Active agreements"
          icon={<CheckSquare size={16} className="text-teal-500" />} iconBg="bg-teal-50" />
        <StatCard title="This Week" value={s.incidentsThisWeek} sub="New incidents"
          icon={<TrendingUp size={16} className="text-amber-500" />} iconBg="bg-amber-50" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Monthly Behaviour Trend</h3>
          {trend.length === 0 ? (
            <div className="h-44 flex items-center justify-center">
              <p className="text-xs text-gray-400">No trend data yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }}
                  tickFormatter={(v: string) => { const [, m] = v.split('-'); return ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][+m] || v; }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="positive" fill="#10b981" name="Positive" radius={[3, 3, 0, 0]} />
                <Bar dataKey="negative" fill="#ef4444" name="Negative" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <AlertTriangle size={14} className="text-red-500" /> Students At Risk
          </h3>
          <p className="text-[10px] text-gray-400 mb-3">3+ negative incidents this month</p>
          {atRisk.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">No at-risk students</p>
          ) : (
            <div className="space-y-2">
              {atRisk.map((st: any) => (
                <div key={st.studentName} className="flex items-center gap-3 bg-red-50 rounded-lg p-2.5">
                  <div className="w-7 h-7 rounded-full bg-red-200 flex items-center justify-center text-[10px] font-bold text-red-700">
                    {st.count}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-700">{st.studentName}</p>
                    <p className="text-[10px] text-gray-400">{st.grade}</p>
                  </div>
                  <button className="text-[10px] text-red-600 font-medium hover:underline">View</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Grade + Concerns Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Grade-wise Behaviour</h3>
          {byGrade.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">No grade data yet</p>
          ) : (
            <div className="space-y-3">
              {byGrade.map((g: any) => {
                const posRate = ((g.positive / g.total) * 100).toFixed(0);
                const negRate = ((g.negative / g.total) * 100).toFixed(0);
                return (
                  <div key={g._id} className="flex items-center gap-3">
                    <span className="text-xs text-gray-600 w-20">{g._id}</span>
                    <div className="flex-1 flex h-4 rounded-full overflow-hidden bg-gray-100">
                      <div className="bg-emerald-400 h-full" style={{ width: `${posRate}%` }} />
                      <div className="bg-red-400 h-full" style={{ width: `${negRate}%` }} />
                    </div>
                    <div className="flex gap-2 text-[10px]">
                      <span className="text-emerald-600 font-medium">{g.positive}+</span>
                      <span className="text-red-500 font-medium">{g.negative}-</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Top Behaviour Concerns</h3>
          {concerns.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">No concern data yet</p>
          ) : (
            <div className="space-y-2.5">
              {concerns.map((c: any, i: number) => (
                <div key={c._id} className="flex items-center gap-3">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0
                    ${i === 0 ? 'bg-red-100 text-red-700' : i === 1 ? 'bg-orange-100 text-orange-700' : 'bg-amber-100 text-amber-700'}`}>
                    {i + 1}
                  </span>
                  <span className="text-xs text-gray-600 flex-1">{CATEGORY_LABELS[c._id] || c._id}</span>
                  <div className="w-24 bg-gray-100 rounded-full h-1.5">
                    <div className="bg-red-400 h-1.5 rounded-full" style={{ width: `${(c.count / (concerns[0]?.count ?? 1)) * 100}%` }} />
                  </div>
                  <span className="text-xs font-bold text-gray-700 w-6 text-right">{c.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── BEHAVIOUR RECORDS TAB ─────────────────────────────────────
interface RecordsTabProps { onOpenModal: (m: string, d?: any) => void; }

export const BehaviourRecordsTab: React.FC<RecordsTabProps> = ({ onOpenModal }) => {
  const { data: recordsData, isLoading, isError, refetch } = useRecords();
  const records: BehaviourRecord[] = recordsData?.data ?? [];
  const [filterType, setFilterType] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterGrade, setFilterGrade] = useState('all');
  const [filterResolved, setFilterResolved] = useState('all');
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'table' | 'cards'>('table');

  const filtered = useMemo(() => records.filter(r => {
    const matchType = filterType === 'all' || r.type === filterType;
    const matchSev = filterSeverity === 'all' || r.severity === filterSeverity;
    const matchGrade = filterGrade === 'all' || r.grade === filterGrade;
    const matchRes = filterResolved === 'all' || (filterResolved === 'resolved') === r.resolved;
    const matchSearch = !search || r.studentName.toLowerCase().includes(search.toLowerCase())
      || r.title.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSev && matchGrade && matchRes && matchSearch;
  }), [filterType, filterSeverity, filterGrade, filterResolved, search, records]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-800">Behaviour Records</h2>
          <p className="text-xs text-gray-400">All incidents, observations and commendations</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setView(v => v === 'table' ? 'cards' : 'table')}
            className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg text-gray-600 hover:bg-gray-50">
            {view === 'table' ? '⊞ Cards' : '☰ Table'}
          </button>
          <button onClick={() => onOpenModal('addRecord')}
            className="flex items-center gap-1.5 bg-[#1e3a5f] text-white text-xs px-4 py-2 rounded-lg hover:bg-[#16304f] font-medium">
            <Plus size={14} /> Record Incident
          </button>
        </div>
      </div>

      {isLoading && <LoadingSkeleton variant="table" />}
      {isError && <ErrorState message="Could not load behaviour records" onRetry={refetch} />}

      {!isLoading && !isError && records.length === 0 && (
        <EmptyState
          icon={<Flag size={32} />}
          title="No behaviour records yet"
          description="Start tracking student behaviour, commendations, and observations."
          actionLabel="+ Record Incident"
          onAction={() => onOpenModal('addRecord')}
        />
      )}

      {!isLoading && !isError && records.length > 0 && (
        <>
          <div className="flex gap-2">
            {['all', 'positive', 'negative', 'neutral'].map(t => (
              <button key={t} onClick={() => setFilterType(t)}
                className={`text-xs px-4 py-1.5 rounded-full border font-medium transition-all
                  ${filterType === t ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]' :
                    t === 'positive' ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50' :
                    t === 'negative' ? 'border-red-200 text-red-700 hover:bg-red-50' :
                    t === 'neutral' ? 'border-blue-200 text-blue-700 hover:bg-blue-50' :
                    'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                {t === 'all' ? `All (${records.length})` :
                  `${TYPE_CONFIG[t as keyof typeof TYPE_CONFIG]?.label} (${records.filter(r => r.type === t).length})`}
              </button>
            ))}
            <div className="ml-auto flex gap-2">
              {['all', 'unresolved'].map(r => (
                <button key={r} onClick={() => setFilterResolved(r)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-all
                    ${filterResolved === r ? 'bg-gray-800 text-white border-gray-800' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                  {r === 'all' ? 'All Status' : 'Unresolved Only'}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[180px]">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search student, incident..." value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none text-gray-700 placeholder-gray-400" />
            </div>
            <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-3 py-2 text-gray-600">
              <option value="all">All Severity</option>
              {Object.entries(SEVERITY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <select value={filterGrade} onChange={e => setFilterGrade(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-3 py-2 text-gray-600">
              <option value="all">All Grades</option>
              {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <button onClick={() => { setFilterType('all'); setFilterSeverity('all'); setFilterGrade('all'); setSearch(''); }}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600">
              <RefreshCw size={11} /> Reset
            </button>
            <span className="text-xs text-gray-400 ml-auto">{filtered.length} records</span>
          </div>

          {view === 'table' && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 border-b border-gray-100">
                    <th className="py-3 px-4 text-left font-semibold">Student</th>
                    <th className="py-3 px-4 font-semibold">Type</th>
                    <th className="py-3 px-4 font-semibold">Incident</th>
                    <th className="py-3 px-4 font-semibold">Severity</th>
                    <th className="py-3 px-4 font-semibold">Points</th>
                    <th className="py-3 px-4 font-semibold">Date</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => (
                    <tr key={r._id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors
                      ${r.severity === 'critical' && !r.resolved ? 'bg-red-50/30' : ''}`}>
                      <td className="py-2.5 px-4">
                        <p className="font-medium text-gray-800">{r.studentName}</p>
                        <p className="text-[10px] text-gray-400">{r.grade} {r.section || ''}</p>
                      </td>
                      <td className="py-2.5 px-4"><TypeBadge type={r.type} /></td>
                      <td className="py-2.5 px-4">
                        <p className="font-medium text-gray-700 truncate max-w-[160px]">{r.title}</p>
                        <p className="text-[10px] text-gray-400">{CATEGORY_LABELS[r.category] || r.category}</p>
                      </td>
                      <td className="py-2.5 px-4"><SeverityBadge severity={r.severity} /></td>
                      <td className="py-2.5 px-4"><PointsBadge points={r.points} /></td>
                      <td className="py-2.5 px-4 text-gray-500">{r.date}</td>
                      <td className="py-2.5 px-4">
                        {r.resolved
                          ? <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">Resolved</span>
                          : <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-medium">Open</span>}
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="flex gap-1.5">
                          <button onClick={() => onOpenModal('viewRecord', r)}
                            className="text-[10px] text-[#1e3a5f] hover:underline font-medium">View</button>
                          {!r.resolved && r.type === 'negative' && (
                            <button onClick={() => onOpenModal('resolveRecord', r)}
                              className="text-[10px] text-emerald-600 hover:underline font-medium">Resolve</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={8} className="py-12 text-center text-gray-400">No records match your filters</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {view === 'cards' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filtered.map(r => (
                <div key={r._id} className={`bg-white rounded-xl border p-4 shadow-sm hover:shadow-md transition-all
                  ${r.severity === 'critical' && !r.resolved ? 'border-red-200' : 'border-gray-100'}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <TypeBadge type={r.type} />
                      <SeverityBadge severity={r.severity} />
                      <PointsBadge points={r.points} />
                    </div>
                    {r.resolved
                      ? <span className="text-[10px] text-emerald-600 font-medium">✓ Resolved</span>
                      : <span className="text-[10px] text-amber-600 font-medium">⏳ Open</span>}
                  </div>
                  <p className="text-sm font-semibold text-gray-800 mb-0.5">{r.title}</p>
                  <p className="text-[10px] text-gray-400 mb-2">{r.studentName} · {r.grade} · {r.date}</p>
                  <p className="text-xs text-gray-600 line-clamp-2 mb-3">{r.description}</p>
                  {r.actionTaken && (
                    <div className="bg-gray-50 rounded-lg px-3 py-1.5 text-[10px] text-gray-500 mb-2">
                      <span className="font-medium">Action:</span> {r.actionTaken}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-400">By {r.reportedBy}</span>
                    <div className="flex gap-2">
                      <button onClick={() => onOpenModal('viewRecord', r)}
                        className="text-[10px] text-[#1e3a5f] hover:underline font-medium">View</button>
                      {!r.resolved && (
                        <button onClick={() => onOpenModal('resolveRecord', r)}
                          className="text-[10px] text-emerald-600 hover:underline font-medium">Resolve</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="col-span-2 py-12 text-center text-gray-400 text-xs">No records match your filters</div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
