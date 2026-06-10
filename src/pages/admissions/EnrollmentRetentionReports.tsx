import React, { useState } from 'react';
import {
  CheckCircle, Clock, AlertCircle, CreditCard, FileText,
  Plus, Search, Download, RefreshCw,
  UserCheck, XCircle, TrendingUp, Users, Calendar,
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Enrollment, RetentionRecord } from './types';
import { useEnrollments, useRetention, useAdmissionDashboard } from '../../hooks/useAdmissions';

// ── Shared spinner ────────────────────────────────────────────
const Spinner: React.FC = () => (
  <div className="flex items-center justify-center py-16">
    <div className="animate-spin w-6 h-6 border-4 border-[#1e3a5f] border-t-transparent rounded-full" />
  </div>
);

// ============================================================
// ENROLLMENT TAB
// ============================================================

const enrollmentStatusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending_fee:       { label: 'Fee Pending', color: 'bg-amber-100 text-amber-700',   icon: <CreditCard size={12} className="text-amber-600" />  },
  fee_paid:          { label: 'Fee Paid',    color: 'bg-blue-100 text-blue-700',     icon: <CheckCircle size={12} className="text-blue-600" />   },
  documents_pending: { label: 'Docs Pending',color: 'bg-purple-100 text-purple-700', icon: <FileText size={12} className="text-purple-600" />   },
  enrolled:          { label: 'Enrolled',    color: 'bg-emerald-100 text-emerald-700',icon: <UserCheck size={12} className="text-emerald-600" /> },
  deferred:          { label: 'Deferred',    color: 'bg-gray-100 text-gray-600',     icon: <Clock size={12} className="text-gray-500" />        },
};

const EnrollmentCard: React.FC<{ enrollment: Enrollment; onView: (e: Enrollment) => void }> = ({ enrollment, onView }) => {
  const cfg = enrollmentStatusConfig[enrollment.status] || enrollmentStatusConfig.pending_fee;
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => onView(enrollment)}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-bold text-sm">
            {(enrollment.studentName || '').split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">{enrollment.studentName}</p>
            <p className="text-[10px] text-gray-400">{enrollment.applicationNumber} · {enrollment.gradeEnrolled}{enrollment.section ? ` - ${enrollment.section}` : ''}</p>
          </div>
        </div>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${cfg.color}`}>
          {cfg.icon} {cfg.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-1.5 mb-3">
        {[
          { label: 'Admission Fee', done: enrollment.admissionFeePaid },
          { label: 'Documents',     done: enrollment.documentsComplete },
          { label: 'Class Assigned',done: !!enrollment.classAssigned },
          { label: 'ID Card',       done: enrollment.idCardIssued || false },
          { label: 'Uniform',       done: enrollment.uniformIssued || false },
          { label: 'Orientation',   done: !!enrollment.orientationDate },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-1.5 text-[10px]">
            {item.done
              ? <CheckCircle size={11} className="text-emerald-500 flex-shrink-0" />
              : <Clock size={11} className="text-gray-300 flex-shrink-0" />}
            <span className={item.done ? 'text-gray-700' : 'text-gray-400'}>{item.label}</span>
          </div>
        ))}
      </div>

      <div className="bg-gray-50 rounded-lg p-2.5 flex items-center justify-between">
        <div>
          <p className="text-[9px] text-gray-400">Admission Fee</p>
          <p className="text-sm font-bold text-gray-800">PKR {(enrollment.admissionFee || 0).toLocaleString()}</p>
        </div>
        {enrollment.feeReceiptNumber && (
          <div className="text-right">
            <p className="text-[9px] text-gray-400">Receipt</p>
            <p className="text-[10px] font-medium text-gray-600">{enrollment.feeReceiptNumber}</p>
          </div>
        )}
        {enrollment.orientationDate && (
          <div className="text-right">
            <p className="text-[9px] text-gray-400">Orientation</p>
            <p className="text-[10px] font-medium text-gray-600">
              {new Date(enrollment.orientationDate).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export const EnrollmentTab: React.FC<{ onOpenModal: (m: string, d?: any) => void }> = ({ onOpenModal }) => {
  const [search, setSearch] = useState('');
  const { data: res, isLoading } = useEnrollments();
  const enrollments: Enrollment[] = (res?.data ?? []) as Enrollment[];

  const statsData = [
    { label: 'Total Enrolled',     value: enrollments.filter(e => e.status === 'enrolled').length,         icon: <UserCheck size={16} className="text-emerald-500" />, bg: 'bg-emerald-50' },
    { label: 'Fee Pending',        value: enrollments.filter(e => !e.admissionFeePaid).length,             icon: <CreditCard size={16} className="text-amber-500" />,  bg: 'bg-amber-50'   },
    { label: 'Docs Pending',       value: enrollments.filter(e => !e.documentsComplete).length,            icon: <FileText size={16} className="text-purple-500" />,   bg: 'bg-purple-50'  },
    { label: 'Orientation Pending',value: enrollments.filter(e => !e.orientationDate).length,              icon: <Calendar size={16} className="text-blue-500" />,     bg: 'bg-blue-50'    },
  ];

  const filtered = enrollments.filter(e => {
    const q = search.toLowerCase();
    return !q || (e.studentName || '').toLowerCase().includes(q) || (e.applicationNumber || '').toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-800">Enrollment Processing</h2>
          <p className="text-xs text-gray-400">Manage accepted students through to enrollment completion</p>
        </div>
        <button onClick={() => onOpenModal('processEnrollment')}
          className="flex items-center gap-1.5 bg-[#1e3a5f] text-white text-xs px-4 py-2 rounded-lg hover:bg-[#16304f] transition-colors font-medium">
          <Plus size={14} /> Process Enrollment
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {statsData.map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex items-center gap-3">
            <div className={`${s.bg} rounded-xl p-2.5`}>{s.icon}</div>
            <div>
              <p className="text-xs text-gray-400">{s.label}</p>
              <p className="text-xl font-bold text-gray-800">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search student or application number..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20" />
        </div>
        <button onClick={() => setSearch('')} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600">
          <RefreshCw size={11} /> Reset
        </button>
        <span className="text-xs text-gray-400">{isLoading ? 'Loading…' : `${filtered.length} records`}</span>
      </div>

      {isLoading ? <Spinner /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.length === 0 ? (
            <div className="col-span-2 py-16 text-center">
              <UserCheck size={32} className="mx-auto text-gray-200 mb-2" />
              <p className="text-sm text-gray-400">No enrollment records found</p>
            </div>
          ) : filtered.map(e => (
            <EnrollmentCard key={(e as any)._id || e.id} enrollment={e} onView={ev => onOpenModal('viewEnrollment', ev)} />
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================
// RETENTION TAB
// ============================================================

const retentionStatusConfig: Record<string, { label: string; color: string }> = {
  active:      { label: 'Active',      color: 'bg-emerald-100 text-emerald-700' },
  at_risk:     { label: 'At Risk',     color: 'bg-red-100 text-red-700'         },
  withdrawn:   { label: 'Withdrawn',   color: 'bg-gray-100 text-gray-600'       },
  re_enrolled: { label: 'Re-Enrolled', color: 'bg-blue-100 text-blue-700'       },
  waitlisted:  { label: 'Waitlisted',  color: 'bg-amber-100 text-amber-700'     },
};

const RetentionCard: React.FC<{ record: RetentionRecord; onView: (r: RetentionRecord) => void }> = ({ record, onView }) => {
  const cfg = retentionStatusConfig[record.status];
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => onView(record)}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-gray-800">{record.studentName}</p>
          <p className="text-[10px] text-gray-400">{record.studentId} · {record.grade} - {record.section}</p>
        </div>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg?.color}`}>{cfg?.label}</span>
      </div>

      {record.atRiskFactors && record.atRiskFactors.length > 0 && (
        <div className="mb-3">
          <p className="text-[9px] text-gray-400 mb-1">Risk Factors</p>
          <div className="flex flex-wrap gap-1">
            {record.atRiskFactors.map(f => (
              <span key={f} className="bg-red-50 text-red-600 text-[9px] px-1.5 py-0.5 rounded">{f}</span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 text-[10px] mb-3">
        {record.reEnrollmentStatus && (
          <div className="bg-gray-50 rounded-lg p-2">
            <p className="text-gray-400">Re-enrollment</p>
            <p className={`font-medium mt-0.5 capitalize ${record.reEnrollmentStatus === 'confirmed' ? 'text-emerald-600' : record.reEnrollmentStatus === 'declined' ? 'text-red-600' : 'text-amber-600'}`}>
              {record.reEnrollmentStatus}
            </p>
          </div>
        )}
        {record.counsellorAssigned && (
          <div className="bg-gray-50 rounded-lg p-2">
            <p className="text-gray-400">Counsellor</p>
            <p className="font-medium text-gray-700 mt-0.5">{record.counsellorAssigned}</p>
          </div>
        )}
        {record.withdrawalReason && (
          <div className="col-span-2 bg-gray-50 rounded-lg p-2">
            <p className="text-gray-400">Withdrawal Reason</p>
            <p className="text-gray-700 mt-0.5">{record.withdrawalReason}</p>
          </div>
        )}
      </div>

      {record.notes && (
        <p className="text-[10px] text-gray-400 italic border-t border-gray-100 pt-2 line-clamp-2">{record.notes}</p>
      )}

      {record.nextFollowUpDate && record.status === 'at_risk' && (
        <div className="mt-2 flex items-center gap-1 text-[10px] text-amber-600 font-medium">
          <Calendar size={10} /> Follow up: {new Date(record.nextFollowUpDate).toLocaleDateString()}
        </div>
      )}
    </div>
  );
};

export const RetentionTab: React.FC<{ onOpenModal: (m: string, d?: any) => void }> = ({ onOpenModal: _onOpenModal }) => {
  const [filter, setFilter] = useState('all');
  const { data: res, isLoading } = useRetention();
  const records: RetentionRecord[] = (res?.data ?? []) as RetentionRecord[];

  const statsData = [
    { label: 'At Risk',        value: records.filter(r => r.status === 'at_risk').length,     color: 'text-red-600',     bg: 'bg-red-50',     icon: <AlertCircle size={16} className="text-red-500" />    },
    { label: 'Re-Enrolled',    value: records.filter(r => r.status === 're_enrolled').length,  color: 'text-blue-600',    bg: 'bg-blue-50',    icon: <Users size={16} className="text-blue-500" />        },
    { label: 'Withdrawn',      value: records.filter(r => r.status === 'withdrawn').length,    color: 'text-gray-600',    bg: 'bg-gray-50',    icon: <XCircle size={16} className="text-gray-400" />      },
    { label: 'Retention Rate', value: records.length > 0
        ? `${(((records.length - records.filter(r => r.status === 'withdrawn').length) / records.length) * 100).toFixed(1)}%`
        : '—',
      color: 'text-emerald-600', bg: 'bg-emerald-50', icon: <TrendingUp size={16} className="text-emerald-500" /> },
  ];

  const filtered = records.filter(r => filter === 'all' || r.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-800">Retention Management</h2>
          <p className="text-xs text-gray-400">Track student retention, re-enrollment, and withdrawal cases</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {statsData.map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex items-center gap-3">
            <div className={`${s.bg} rounded-xl p-2.5`}>{s.icon}</div>
            <div>
              <p className="text-xs text-gray-400">{s.label}</p>
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        {['all', 'at_risk', 're_enrolled', 'withdrawn'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-all font-medium
              ${filter === f ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
            {f === 'all' ? 'All' : retentionStatusConfig[f]?.label}
          </button>
        ))}
      </div>

      {isLoading ? <Spinner /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.length === 0 ? (
            <div className="col-span-3 py-16 text-center">
              <p className="text-sm text-gray-400">No retention records found</p>
            </div>
          ) : filtered.map(r => (
            <RetentionCard key={(r as any)._id || r.id} record={r} onView={rec => _onOpenModal('viewRetention', rec)} />
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================
// REPORTS TAB
// ============================================================

const MONTH_NAMES = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmtMonth = (m: string) => { const p = m.split('-'); return p.length === 2 ? (MONTH_NAMES[parseInt(p[1])] || m) : m; };
const SOURCE_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#06b6d4', '#ef4444'];

export const ReportsTab: React.FC<{ onOpenModal: (m: string, d?: any) => void }> = ({ onOpenModal }) => {
  const [activeReport, setActiveReport] = useState('overview');
  const { data: dash, isLoading } = useAdmissionDashboard();

  const stats        = dash?.stats        ?? {} as any;
  const funnel       = (dash?.funnel       ?? []) as Array<{ stage: string; count: number }>;
  const trendData    = ((dash?.monthlyTrend ?? []) as Array<{ month: string; leads: number; enrolled: number }>)
                         .map(m => ({ ...m, month: fmtMonth(m.month) }));
  const gradeData    = (dash?.gradeDemand   ?? []) as Array<{ grade: string; applications: number }>;
  const sourceData   = ((dash?.sourceBreakdown ?? []) as Array<{ source: string; count: number }>)
                         .map((s, i) => ({ ...s, fill: SOURCE_COLORS[i] ?? '#888' }));
  const maxFunnel    = funnel[0]?.count || 1;

  const reportTypes = [
    { key: 'overview', label: 'Overview'      },
    { key: 'leads',    label: 'Lead Analysis' },
    { key: 'pipeline', label: 'Pipeline'      },
    { key: 'grade',    label: 'Grade Demand'  },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-800">Admission Reports & Analytics</h2>
          <p className="text-xs text-gray-400">Comprehensive data analysis for admission lifecycle</p>
        </div>
        <button onClick={() => onOpenModal('generateReport')}
          className="flex items-center gap-1.5 border border-gray-200 text-gray-600 text-xs px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
          <Download size={14} /> Export Report
        </button>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        {reportTypes.map(r => (
          <button key={r.key} onClick={() => setActiveReport(r.key)}
            className={`px-4 py-2 text-xs font-medium border-b-2 transition-all
              ${activeReport === r.key ? 'border-[#1e3a5f] text-[#1e3a5f]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
            {r.label}
          </button>
        ))}
      </div>

      {isLoading ? <Spinner /> : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Total Leads',   value: stats.totalLeads ?? 0,       sub: 'Academic Year 2025-26',          color: 'text-blue-600'    },
              { label: 'Applications',  value: stats.totalApplications ?? 0, sub: 'Submitted',                     color: 'text-purple-600'  },
              { label: 'Enrolled',      value: stats.enrolled ?? 0,         sub: `${stats.conversionRate ?? 0}% conversion`, color: 'text-emerald-600' },
              { label: 'Accepted',      value: stats.accepted ?? 0,         sub: 'Ready for enrollment',            color: 'text-amber-600'   },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                <p className="text-[10px] text-gray-400">{s.label}</p>
                <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Monthly Trend */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Admission Pipeline Trend</h3>
              {trendData.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-8">No trend data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line dataKey="leads"    stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="Leads"    />
                    <Line dataKey="enrolled" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="Enrolled" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Grade Demand */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Grade Demand</h3>
              {gradeData.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-8">No applications yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={gradeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="grade" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="applications" fill="#6366f1" name="Applications" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Source Performance */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Lead Source Performance</h3>
              {sourceData.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-8">No lead source data yet</p>
              ) : (
                <div className="space-y-3">
                  {sourceData.map(s => (
                    <div key={s.source} className="flex items-center gap-3">
                      <span className="text-xs text-gray-600 w-24 capitalize">{s.source.replace('_', ' ')}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                        <div className="h-2.5 rounded-full" style={{ width: `${sourceData[0]?.count ? (s.count / sourceData[0].count) * 100 : 0}%`, backgroundColor: s.fill }} />
                      </div>
                      <span className="text-xs font-medium text-gray-700 w-8 text-right">{s.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Conversion Funnel Table */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Conversion Analysis</h3>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-100">
                    <th className="pb-2 text-left font-medium">Stage</th>
                    <th className="pb-2 text-center font-medium">Count</th>
                    <th className="pb-2 text-right font-medium">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {funnel.map(f => (
                    <tr key={f.stage} className="border-b border-gray-50">
                      <td className="py-2 text-gray-700 font-medium">{f.stage}</td>
                      <td className="py-2 text-center font-bold text-gray-800">{f.count}</td>
                      <td className="py-2 text-right">
                        <span className={`font-semibold ${
                          (f.count / maxFunnel) * 100 > 50 ? 'text-emerald-600' :
                          (f.count / maxFunnel) * 100 > 20 ? 'text-amber-600' : 'text-red-500'}`}>
                          {maxFunnel > 0 ? ((f.count / maxFunnel) * 100).toFixed(1) : 0}%
                        </span>
                      </td>
                    </tr>
                  ))}
                  {funnel.length === 0 && (
                    <tr><td colSpan={3} className="py-8 text-center text-gray-400">No data yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
