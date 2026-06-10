// ============================================================
// ANALYTICS & INTELLIGENCE — TYPES + API SERVICE
// Eldermin ERP | Aggregates ALL module APIs
// ============================================================

// ── Types ─────────────────────────────────────────────────────
export interface OverviewStats {
  students: { total: number; active: number; male: number; female: number; newThisMonth: number };
  staff: { total: number; teaching: number; nonTeaching: number };
  finance: { collected: number; outstanding: number; expenses: number; netIncome: number };
  admissions: { leads: number; applications: number; enrolled: number; conversionRate: number };
  attendance: { students: number; staff: number };
  behaviour: { positive: number; negative: number; critical: number };
  assessment: { assessments: number; avgPercentage: number; passRate: number };
  tarbiyah: { avgScore: number; assessed: number };
}

export interface TrendPoint { label: string; value: number; value2?: number }
export interface PieSegment { name: string; value: number; fill: string }
export interface HeatmapCell { day: string; week: number; value: number; date: string }

// ── API Base ──────────────────────────────────────────────────
const BASE = (import.meta as any).env?.VITE_API_URL || 'http://93.127.163.238:3001';

const headers = () => ({
  'Content-Type': 'application/json',
  'x-school-slug': localStorage.getItem('schoolSlug') || 'demo-school',
  'x-academic-year': localStorage.getItem('academicYear') || '2025-26',
});

const get = async (path: string) => {
  try {
    const res = await fetch(`${BASE}/api/v1${path}`, { headers: headers() });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
};

// ── Individual API Fetchers ───────────────────────────────────
export const analyticsApi = {
  // Students
  fetchStudentStats: () => get('/students/dashboard'),
  fetchAttendanceSummary: (month: string) => get(`/students/attendance/list?month=${month}&limit=1`),
  fetchFeeCollection: (month: string) => get(`/students/fees/list?month=${month}&limit=1`),
  fetchGradeDistribution: () => get('/students?limit=1'), // meta.gradeDistribution

  // Admissions
  fetchAdmissionDashboard: () => get('/admissions/dashboard'),

  // Finance
  fetchFinanceDashboard: () => get('/finance/dashboard'),
  fetchIncomeStatement: (ay: string) => get(`/finance/reports/income-statement?academicYear=${ay}`),
  fetchFeeCollectionReport: (month: string) => get(`/finance/reports/fee-collection?month=${month}`),

  // Assessment
  fetchAssessmentDashboard: () => get('/assessments/dashboard'),
  fetchAnalytics: (ay: string) => get(`/assessments/analytics/performance?academicYear=${ay}`),

  // Behaviour
  fetchBehaviourDashboard: () => get('/behaviour/dashboard'),
  fetchTarbiyahAnalytics: () => get('/behaviour/tarbiyah/analytics'),

  // HR (if endpoint exists)
  fetchHRStats: () => get('/hr/dashboard'),

  // Organization
  fetchOrgOverview: () => get('/organization/overview'),
};

// ── Aggregate All Data ────────────────────────────────────────
export const fetchAllAnalytics = async (academicYear: string, month: string) => {
  const [
    studentStats, admissionDash, financeDash,
    incomeStatement, assessmentDash, assessmentAnalytics,
    behaviourDash, tarbiyahAnalytics, orgOverview,
    feeCollectionReport,
  ] = await Promise.all([
    analyticsApi.fetchStudentStats(),
    analyticsApi.fetchAdmissionDashboard(),
    analyticsApi.fetchFinanceDashboard(),
    analyticsApi.fetchIncomeStatement(academicYear),
    analyticsApi.fetchAssessmentDashboard(),
    analyticsApi.fetchAnalytics(academicYear),
    analyticsApi.fetchBehaviourDashboard(),
    analyticsApi.fetchTarbiyahAnalytics(),
    analyticsApi.fetchOrgOverview(),
    analyticsApi.fetchFeeCollectionReport(month),
  ]);

  return {
    studentStats, admissionDash, financeDash,
    incomeStatement, assessmentDash, assessmentAnalytics,
    behaviourDash, tarbiyahAnalytics, orgOverview,
    feeCollectionReport,
  };
};

// ── Color Palettes ────────────────────────────────────────────
export const COLORS = {
  primary: '#1e3a5f',
  emerald: '#10b981',
  amber: '#f59e0b',
  red: '#ef4444',
  blue: '#3b82f6',
  purple: '#8b5cf6',
  teal: '#14b8a6',
  orange: '#f97316',
  indigo: '#6366f1',
  pink: '#ec4899',
};

export const PIE_COLORS = [
  '#1e3a5f','#10b981','#f59e0b','#3b82f6',
  '#8b5cf6','#14b8a6','#f97316','#ec4899',
];

// ── Shared UI Components ──────────────────────────────────────
import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

export const KPICard: React.FC<{
  title: string; value: string | number; sub?: string;
  icon: React.ReactNode; iconBg: string; trend?: number;
  trendLabel?: string; alert?: boolean;
}> = ({ title, value, sub, icon, iconBg, trend, trendLabel, alert }) => (
  <div className={`bg-white rounded-xl border p-4 shadow-sm hover:shadow-md transition-all
    ${alert ? 'border-red-200' : 'border-gray-100'}`}>
    <div className="flex items-start justify-between">
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide truncate">{title}</p>
        <p className={`text-2xl font-bold mt-1 ${alert ? 'text-red-600' : 'text-gray-800'}`}>{value}</p>
        {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
        {trend !== undefined && (
          <div className={`flex items-center gap-1 mt-1.5 text-[10px] font-medium
            ${trend > 0 ? 'text-emerald-600' : trend < 0 ? 'text-red-500' : 'text-gray-400'}`}>
            {trend > 0 ? <ArrowUpRight size={10} /> : trend < 0 ? <ArrowDownRight size={10} /> : <Minus size={10} />}
            {Math.abs(trend)}% {trendLabel || 'vs last month'}
          </div>
        )}
      </div>
      <div className={`${iconBg} rounded-xl p-2.5 flex-shrink-0 ml-2`}>{icon}</div>
    </div>
  </div>
);

export const SectionCard: React.FC<{
  title: string; subtitle?: string; children: React.ReactNode;
  action?: React.ReactNode; height?: number;
}> = ({ title, subtitle, children, action, height }) => (
  <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
    <div className="flex items-start justify-between mb-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
        {subtitle && <p className="text-[10px] text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
    <div style={height ? { height } : {}}>{children}</div>
  </div>
);

export const EmptyChart: React.FC<{ message?: string }> = ({ message = 'No data available yet' }) => (
  <div className="flex flex-col items-center justify-center h-full py-8 text-gray-300">
    <div className="text-4xl mb-2">📊</div>
    <p className="text-xs text-gray-400">{message}</p>
  </div>
);

export const SkeletonCard: React.FC = () => (
  <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm animate-pulse">
    <div className="flex justify-between">
      <div className="space-y-2 flex-1">
        <div className="h-2.5 bg-gray-200 rounded w-24" />
        <div className="h-7 bg-gray-200 rounded w-16" />
        <div className="h-2 bg-gray-100 rounded w-32" />
      </div>
      <div className="w-10 h-10 bg-gray-200 rounded-xl" />
    </div>
  </div>
);

export const ProgressBar: React.FC<{ label: string; value: number; max: number; color?: string; showPct?: boolean }> =
  ({ label, value, max, color = '#1e3a5f', showPct = true }) => {
    const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
    return (
      <div className="flex items-center gap-3">
        <span className="text-[10px] text-gray-600 w-28 truncate">{label}</span>
        <div className="flex-1 bg-gray-100 rounded-full h-2">
          <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
        </div>
        <span className="text-[10px] font-medium text-gray-700 w-10 text-right">
          {showPct ? `${pct.toFixed(0)}%` : value}
        </span>
      </div>
    );
  };
