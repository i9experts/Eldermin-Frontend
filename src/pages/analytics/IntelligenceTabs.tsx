// ============================================================
// ANALYTICS — STUDENT + FINANCIAL + ADMISSIONS + BEHAVIOUR TABS
// Eldermin ERP | React + TypeScript + Recharts
// ============================================================

import React from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, ComposedChart,
  PieChart, Pie, Cell, FunnelChart, Funnel, LabelList,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  Users, DollarSign, TrendingUp, Heart, AlertTriangle,
  CheckCircle, CreditCard, Award, BookOpen, Target, Shield,
  ArrowUpRight, Clock, Star, Zap, Landmark, Wallet, PiggyBank,
  Receipt, Percent, ShieldCheck, Building2, ExternalLink,
} from 'lucide-react';
import {
  KPICard, SectionCard, EmptyChart, ProgressBar, COLORS, PIE_COLORS, SkeletonCard,
} from './types';

// ============================================================
// STUDENT INTELLIGENCE TAB
// ============================================================
export const StudentIntelligenceTab: React.FC<{ data: any; isLoading: boolean }> = ({ data, isLoading }) => {
  const s = data?.studentStats;
  const b = data?.behaviourDash;
  const f = data?.financeDash;

  const totalStudents = s?.students?.active || 0;
  const todayPresent = s?.todayAttendance?.present || 0;
  const todayAbsent = s?.todayAttendance?.absent || 0;
  const todayLate = s?.todayAttendance?.late || 0;
  const todayTotal = s?.todayAttendance?.total || 0;
  const attPct = todayTotal > 0 ? ((todayPresent / todayTotal) * 100).toFixed(1) : 'N/A';

  const attendancePie = [
    { name: 'Present', value: todayPresent, fill: COLORS.emerald },
    { name: 'Absent', value: todayAbsent, fill: COLORS.red },
    { name: 'Late', value: todayLate, fill: COLORS.amber },
  ].filter(d => d.value > 0);

  const genderData = [
    { name: 'Male', value: s?.students?.male || 0, fill: COLORS.blue },
    { name: 'Female', value: s?.students?.female || 0, fill: COLORS.pink },
  ];

  const gradeData = (s?.gradeDistribution || []).slice(0, 10).map((g: any) => ({
    grade: g._id?.replace('Grade ', 'G') || g._id,
    count: g.count,
  }));

  const feeOutstanding = s?.fees?.outstanding || 0;
  const feeCollected = f?.summary?.collectedThisMonth || 0;

  const studentsAtRisk = b?.studentsAtRisk || [];

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard title="Active Students" value={totalStudents.toLocaleString()}
          sub={`${s?.students?.newThisMonth || 0} enrolled this month`}
          icon={<Users size={15} className="text-blue-500" />} iconBg="bg-blue-50" />
        <KPICard title="Today's Attendance" value={`${attPct}%`}
          sub={`${todayPresent} present · ${todayAbsent} absent`}
          icon={<CheckCircle size={15} className="text-emerald-500" />} iconBg="bg-emerald-50"
          alert={parseFloat(String(attPct)) < 85} />
        <KPICard title="Fee Outstanding" value={`PKR ${(feeOutstanding / 1000).toFixed(0)}K`}
          sub="Unpaid fees balance"
          icon={<CreditCard size={15} className="text-red-500" />} iconBg="bg-red-50"
          alert={feeOutstanding > 0} />
        <KPICard title="At Risk Students" value={studentsAtRisk.length}
          sub="3+ negative incidents this month"
          icon={<AlertTriangle size={15} className="text-amber-500" />} iconBg="bg-amber-50"
          alert={studentsAtRisk.length > 0} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Attendance Donut */}
        <SectionCard title="Today's Attendance" subtitle="Real-time">
          {attendancePie.length > 0 ? (
            <div>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={attendancePie} dataKey="value" cx="50%" cy="50%" outerRadius={60}
                    label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                    {attendancePie.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-1">
                {attendancePie.map(d => (
                  <div key={d.name} className="flex items-center gap-1 text-[10px]">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.fill }} />
                    <span className="text-gray-600">{d.name}: {d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <EmptyChart message="No attendance marked today" />}
        </SectionCard>

        {/* Gender Split */}
        <SectionCard title="Gender Distribution" subtitle="Active students">
          {(s?.students?.male + s?.students?.female) > 0 ? (
            <div>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={genderData} dataKey="value" cx="50%" cy="50%" outerRadius={60}
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                    {genderData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 mt-1">
                {genderData.map(d => (
                  <div key={d.name} className="text-center">
                    <p className="text-lg font-bold text-gray-800">{d.value}</p>
                    <p className="text-[10px] text-gray-500">{d.name}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : <EmptyChart message="No students enrolled" />}
        </SectionCard>

        {/* Students at Risk */}
        <SectionCard title="Students At Risk" subtitle="Behaviour & attendance concerns">
          {studentsAtRisk.length > 0 ? (
            <div className="space-y-2">
              {studentsAtRisk.slice(0, 5).map((s: any, i: number) => (
                <div key={i} className="flex items-center gap-2 bg-red-50 rounded-lg px-2.5 py-2">
                  <div className="w-6 h-6 rounded-full bg-red-200 flex items-center justify-center text-[9px] font-bold text-red-700">
                    {s.count}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-700 truncate">{s.studentName}</p>
                    <p className="text-[10px] text-gray-400">{s.grade}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-emerald-400">
              <CheckCircle size={28} />
              <p className="text-xs text-emerald-600 mt-2 font-medium">No students at risk</p>
            </div>
          )}
        </SectionCard>
      </div>

      {/* Grade Distribution Bar */}
      {gradeData.length > 0 && (
        <SectionCard title="Students by Grade" subtitle="Current enrollment breakdown">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={gradeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="grade" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 9 }} />
              <Tooltip />
              <Bar dataKey="count" fill={COLORS.primary} radius={[4, 4, 0, 0]} name="Students" />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>
      )}
    </div>
  );
};

// ============================================================
// FINANCIAL INTELLIGENCE TAB — 360° financial oversight
// ============================================================

// Aging buckets read as a severity ramp (current -> 90+ overdue), not an
// arbitrary categorical set - green/good through red/critical, consistent
// with how the rest of the app (and the dataviz skill's status palette)
// treats state-not-identity data. Fixed order, never re-cycled per filter.
const AGING_BUCKETS = ['current', '1-30', '31-60', '61-90', '90+'] as const;
const AGING_LABELS: Record<string, string> = {
  current: 'Current', '1-30': '1–30 days', '31-60': '31–60 days', '61-90': '61–90 days', '90+': '90+ days',
};
const AGING_COLORS: Record<string, string> = {
  current: '#10b981', '1-30': '#84cc16', '31-60': '#f59e0b', '61-90': '#f97316', '90+': '#ef4444',
};

const fmtK = (n: number) => `PKR ${(Math.abs(n) / 1000).toFixed((Math.abs(n) >= 1_000_000) ? 1 : 0)}${Math.abs(n) >= 1_000_000 ? 'M' : 'K'}`;
const fmtFull = (n: number) => `PKR ${Math.round(n || 0).toLocaleString()}`;

const BUDGET_HEALTH_COLOR: Record<string, string> = {
  healthy: '#10b981', on_track: '#10b981', watch: '#f59e0b', at_risk: '#f97316', over_budget: '#ef4444', exceeded: '#ef4444',
};

export const FinancialIntelligenceTab: React.FC<{ data: any; isLoading: boolean }> = ({ data, isLoading }) => {
  const f = data?.financeDash;
  const bs = data?.balanceSheet;
  const arAging = data?.arAging;
  const apAging = data?.apAging;
  const monthlyTrends: any[] = data?.monthlyTrends || [];
  const topDefaultersRaw: any[] = data?.topDefaulters?.data || [];
  const budgetSummary: any[] = data?.budgetSummary || [];
  const fcr = data?.feeCollectionReport;

  const totalCollected = f?.summary?.totalCollected || 0;
  const totalOutstanding = f?.summary?.totalOutstanding || 0;
  const collectedThisMonth = f?.summary?.collectedThisMonth || 0;
  const expensesThisMonth = f?.summary?.expensesThisMonth || 0;
  const totalExpenses = f?.summary?.totalExpenses || 0;
  const overdueCount = f?.summary?.overdueCount || 0;
  const totalPendingExpenses = f?.summary?.totalPendingExpenses || 0;
  const pendingExpensesCount = f?.summary?.pendingExpensesCount || 0;

  // Net income from the real double-entry Balance Sheet (true GL-based
  // profit/loss) when available, falling back to the simple collected-
  // minus-expenses approximation only if the ledger hasn't been used yet.
  const netIncome = bs?.currentPeriodNetIncome ?? (totalCollected - totalExpenses);
  const netMargin = totalCollected > 0 ? ((netIncome / totalCollected) * 100).toFixed(1) : '0.0';

  const bankBalances = f?.bankBalances || [];
  const totalCash = bankBalances.reduce((s: number, b: any) => s + (b.currentBalance || 0), 0);
  const expenseByCategory = f?.expenseByCategory || [];
  const recentPayments = f?.recentPayments || [];

  const invoiceStatus = (f?.invoicesByStatus || []).map((s: any, i: number) => ({
    name: s._id?.replace('_', ' ')?.replace(/\b\w/g, (l: string) => l.toUpperCase()),
    value: s.count,
    amount: s.total,
    fill: PIE_COLORS[i % PIE_COLORS.length],
  }));

  const collectionRate = (totalCollected + totalOutstanding) > 0
    ? ((totalCollected / (totalCollected + totalOutstanding)) * 100).toFixed(1) : '0.0';

  const payablesOutstanding = apAging?.grandTotal || 0;

  // Trend chart: revenue/expenses as thin bars, net income as a line -
  // two measures of the SAME currency scale, so one y-axis, never two.
  const trendData = monthlyTrends.map((m: any) => ({
    month: m.month ? `${m.month.slice(5)}/${m.month.slice(2, 4)}` : m.month,
    Revenue: m.revenue, Expenses: m.expenses, 'Net Income': m.netIncome,
  }));
  const hasRealTrend = monthlyTrends.some((m: any) => m.revenue || m.expenses);

  const arBucketData = arAging?.buckets
    ? AGING_BUCKETS.map((b) => ({ bucket: AGING_LABELS[b], amount: arAging.buckets[b] || 0, fill: AGING_COLORS[b] }))
    : [];
  const arHasData = arBucketData.some((b) => b.amount > 0);

  const topDefaulters = [...topDefaultersRaw]
    .sort((a, b) => (b.balanceDue || 0) - (a.balanceDue || 0))
    .slice(0, 6);

  const byGrade: any[] = fcr?.byGrade || [];
  const collectionByGrade = byGrade
    .filter((g: any) => g._id)
    .map((g: any) => ({
      grade: String(g._id).replace('Grade ', 'G'),
      Invoiced: g.invoiced || 0,
      Collected: g.collected || 0,
    }));

  return (
    <div className="space-y-6">
      {/* Executive KPI row */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard title="Total Collected" value={fmtK(totalCollected)}
          sub={`${collectionRate}% collection rate`}
          icon={<DollarSign size={15} className="text-emerald-500" />} iconBg="bg-emerald-50" />
        <KPICard title="Outstanding Fees" value={fmtK(totalOutstanding)}
          sub={`${overdueCount} overdue invoice${overdueCount === 1 ? '' : 's'}`}
          icon={<CreditCard size={15} className="text-red-500" />} iconBg="bg-red-50"
          alert={totalOutstanding > 0} />
        <KPICard title="Net Income" value={fmtK(netIncome)}
          sub={`${netMargin}% margin${bs?.isBalanced === false ? ' · ledger unbalanced' : ''}`}
          icon={<TrendingUp size={15} className={netIncome >= 0 ? 'text-emerald-500' : 'text-red-500'} />}
          iconBg={netIncome >= 0 ? 'bg-emerald-50' : 'bg-red-50'} alert={netIncome < 0} />
        <KPICard title="Cash in Bank" value={fmtK(totalCash)}
          sub={`${bankBalances.length} account${bankBalances.length === 1 ? '' : 's'}`}
          icon={<Wallet size={15} className="text-blue-500" />} iconBg="bg-blue-50" />
        <KPICard title="Payables Outstanding" value={fmtK(payablesOutstanding)}
          sub="Owed to vendors"
          icon={<Landmark size={15} className="text-amber-500" />} iconBg="bg-amber-50"
          alert={payablesOutstanding > totalCash} />
        <KPICard title="Pending Expenses" value={fmtK(totalPendingExpenses)}
          sub={`${pendingExpensesCount} awaiting approval`}
          icon={<Receipt size={15} className="text-purple-500" />} iconBg="bg-purple-50"
          alert={pendingExpensesCount > 0} />
      </div>

      {/* Revenue & Expense Trend */}
      <SectionCard title="Revenue, Expenses & Net Income" subtitle="Trailing 12 months, from the general ledger">
        {hasRealTrend ? (
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 9 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
              <Tooltip formatter={(v: any) => fmtFull(Number(v))} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="Revenue" fill={COLORS.emerald} radius={[3, 3, 0, 0]} barSize={14} />
              <Bar dataKey="Expenses" fill={COLORS.red} radius={[3, 3, 0, 0]} barSize={14} />
              <Line type="monotone" dataKey="Net Income" stroke={COLORS.primary} strokeWidth={2} dot={{ r: 2 }} />
            </ComposedChart>
          </ResponsiveContainer>
        ) : <EmptyChart message="No posted ledger entries yet for a trend — revenue/expense journal postings will appear here" />}
      </SectionCard>

      <div className="grid grid-cols-2 gap-4">
        {/* AR Aging */}
        <SectionCard title="Receivables Aging" subtitle={`Who owes what, and for how long — PKR ${Math.round(arAging?.grandTotal || 0).toLocaleString()} total outstanding`}>
          {arHasData ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={arBucketData} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 9 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                <YAxis type="category" dataKey="bucket" tick={{ fontSize: 10 }} width={72} />
                <Tooltip formatter={(v: any) => fmtFull(Number(v))} />
                <Bar dataKey="amount" radius={[0, 4, 4, 0]} barSize={16}>
                  {arBucketData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart message="No outstanding receivables" />}
        </SectionCard>

        {/* AP Aging */}
        <SectionCard title="Payables Aging" subtitle={`What's owed to vendors — PKR ${Math.round(apAging?.grandTotal || 0).toLocaleString()} total outstanding`}>
          {(apAging?.rows || []).length > 0 ? (
            <div className="space-y-2 mt-1">
              {AGING_BUCKETS.map((b) => {
                const amt = apAging.buckets?.[b] || 0;
                if (!amt) return null;
                return <ProgressBar key={b} label={AGING_LABELS[b]} value={amt} max={apAging.grandTotal || 1} color={AGING_COLORS[b]} showPct={false} />;
              })}
              {(apAging.rows || []).length === 0 && <EmptyChart message="No outstanding vendor bills" />}
            </div>
          ) : <EmptyChart message="No outstanding vendor bills" />}
        </SectionCard>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Top Defaulters */}
        <SectionCard title="Top Fee Defaulters" subtitle="Largest overdue balances, by student">
          {topDefaulters.length > 0 ? (
            <div className="space-y-1.5 mt-1">
              {topDefaulters.map((d: any, i: number) => (
                <div key={d._id || i} className="flex items-center justify-between gap-2 bg-red-50/60 rounded-lg px-2.5 py-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-700 truncate">{d.studentName}</p>
                    <p className="text-[10px] text-gray-400">{d.grade || '—'} · {d.daysOverdue}d overdue</p>
                  </div>
                  <p className="text-xs font-bold text-red-600 whitespace-nowrap">{fmtFull(d.balanceDue)}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-emerald-400">
              <ShieldCheck size={28} />
              <p className="text-xs text-emerald-600 mt-2 font-medium">No overdue fee defaulters</p>
            </div>
          )}
        </SectionCard>

        {/* Budget vs Actual */}
        <SectionCard title="Budget vs Actual" subtitle="Active budgets, utilization this year">
          {budgetSummary.length > 0 ? (
            <div className="space-y-3 mt-1">
              {budgetSummary.slice(0, 5).map((b: any) => (
                <div key={b.budgetId}>
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="text-gray-600 font-medium truncate">{b.budgetName}</span>
                    <span className="font-semibold" style={{ color: BUDGET_HEALTH_COLOR[b.healthStatus] || COLORS.primary }}>
                      {b.totalUtilizationPct?.toFixed(0)}% used
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="h-2 rounded-full" style={{
                      width: `${Math.min(b.totalUtilizationPct || 0, 100)}%`,
                      backgroundColor: BUDGET_HEALTH_COLOR[b.healthStatus] || COLORS.primary,
                    }} />
                  </div>
                  <p className="text-[9px] text-gray-400 mt-0.5">{fmtFull(b.totalActual)} of {fmtFull(b.totalAllocated)}</p>
                </div>
              ))}
            </div>
          ) : <EmptyChart message="No active budgets set up yet" />}
        </SectionCard>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Invoice Status */}
        <SectionCard title="Invoice Status" subtitle="By payment status">
          {invoiceStatus.length > 0 ? (
            <div>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={invoiceStatus} dataKey="value" cx="50%" cy="50%" outerRadius={55}
                    label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                    {invoiceStatus.map((d: any, i: number) => <Cell key={i} fill={d.fill} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1 mt-2">
                {invoiceStatus.map((s: any) => (
                  <div key={s.name} className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.fill }} />
                      <span className="text-gray-600">{s.name}</span>
                    </div>
                    <span className="font-medium text-gray-700">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <EmptyChart message="No invoices created yet" />}
        </SectionCard>

        {/* Expense Breakdown */}
        <SectionCard title="Expense by Category" subtitle="Approved & paid">
          {expenseByCategory.length > 0 ? (
            <div className="space-y-2 mt-2">
              {expenseByCategory.slice(0, 6).map((e: any) => (
                <ProgressBar key={e._id} label={e._id}
                  value={e.total} max={expenseByCategory[0]?.total || 1}
                  color={COLORS.amber} showPct={false} />
              ))}
            </div>
          ) : <EmptyChart message="No expenses recorded yet" />}
        </SectionCard>

        {/* Bank Balances */}
        <SectionCard title="Bank Accounts" subtitle="Current balances">
          {bankBalances.length > 0 ? (
            <div className="space-y-3">
              {bankBalances.map((b: any, i: number) => (
                <div key={i} className={`rounded-xl p-3 ${b.isPrimary ? 'bg-[#1e3a5f] text-white' : 'bg-gray-50'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-xs font-semibold ${b.isPrimary ? 'text-white' : 'text-gray-700'}`}>{b.bankName}</p>
                      <p className={`text-[10px] ${b.isPrimary ? 'text-blue-200' : 'text-gray-400'}`}>{b.accountTitle}</p>
                    </div>
                    {b.isPrimary && <span className="text-[9px] bg-white/20 px-1.5 py-0.5 rounded text-blue-100">Primary</span>}
                  </div>
                  <p className={`text-lg font-bold mt-1 ${b.isPrimary ? 'text-white' : 'text-gray-800'}`}>
                    PKR {(b.currentBalance || 0).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          ) : <EmptyChart message="No bank accounts configured" />}
        </SectionCard>
      </div>

      {/* Collection by Grade */}
      {collectionByGrade.length > 0 && (
        <SectionCard title="Collection by Grade" subtitle="Invoiced vs. collected this month, by class">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={collectionByGrade}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="grade" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 9 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
              <Tooltip formatter={(v: any) => fmtFull(Number(v))} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="Invoiced" fill={COLORS.indigo} radius={[3, 3, 0, 0]} barSize={16} />
              <Bar dataKey="Collected" fill={COLORS.emerald} radius={[3, 3, 0, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>
      )}

      {/* Recent Payments */}
      {recentPayments.length > 0 && (
        <SectionCard title="Recent Fee Collections" subtitle="Latest payment receipts">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-400 border-b border-gray-100">
                <th className="pb-2 text-left font-medium">Receipt</th>
                <th className="pb-2 text-left font-medium">Student</th>
                <th className="pb-2 text-center font-medium">Method</th>
                <th className="pb-2 text-right font-medium">Amount</th>
                <th className="pb-2 text-right font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentPayments.map((p: any, i: number) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2 font-mono text-[10px] text-gray-500">{p.receiptNumber}</td>
                  <td className="py-2 font-medium text-gray-700">{p.studentName}</td>
                  <td className="py-2 text-center capitalize text-gray-500">{p.paymentMethod?.replace('_', ' ')}</td>
                  <td className="py-2 text-right font-bold text-emerald-600">PKR {p.amount?.toLocaleString()}</td>
                  <td className="py-2 text-right text-gray-400 text-[10px]">{new Date(p.paymentDate).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>
      )}
    </div>
  );
};

// ============================================================
// ADMISSIONS INTELLIGENCE TAB
// ============================================================
export const AdmissionsIntelligenceTab: React.FC<{ data: any; isLoading: boolean }> = ({ data, isLoading }) => {
  const a = data?.admissionDash;
  const stats = a?.stats || {};
  const funnel = a?.funnel || [];
  const sourceBreakdown = a?.sourceBreakdown || [];
  const monthlyTrend = a?.monthlyTrend || [];
  const gradeDemand = a?.gradeDemand || [];

  const funnelData = funnel.map((f: any, i: number) => ({
    ...f,
    fill: PIE_COLORS[i % PIE_COLORS.length],
    pct: funnel[0]?.count > 0 ? ((f.count / funnel[0].count) * 100).toFixed(1) : 0,
  }));

  const sourceData = sourceBreakdown.map((s: any, i: number) => ({
    name: s.source?.replace('_', ' ')?.replace(/\b\w/g, (l: string) => l.toUpperCase()),
    value: s.count,
    fill: PIE_COLORS[i % PIE_COLORS.length],
  }));

  const trendData = monthlyTrend.map((m: any) => ({
    month: m.month,
    leads: m.leads,
    enrolled: m.enrolled,
  }));

  const demandData = gradeDemand.slice(0, 6).map((g: any) => ({
    grade: g.grade?.replace('Grade ', 'G'),
    applications: g.applications,
  }));

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard title="Total Leads" value={stats.totalLeads || 0}
          sub={`+${stats.leadsThisMonth || 0} this month`}
          icon={<Users size={15} className="text-blue-500" />} iconBg="bg-blue-50" />
        <KPICard title="Applications" value={stats.totalApplications || 0}
          sub={`${stats.leadToApplicationRate || 0}% lead conversion`}
          icon={<BookOpen size={15} className="text-purple-500" />} iconBg="bg-purple-50" />
        <KPICard title="Enrolled" value={stats.enrolled || 0}
          sub={`${stats.conversionRate || 0}% overall conversion`}
          icon={<CheckCircle size={15} className="text-emerald-500" />} iconBg="bg-emerald-50" />
        <KPICard title="Avg Processing" value={`${stats.averageProcessingDays || 0}d`}
          sub="Lead to enrollment time"
          icon={<Clock size={15} className="text-amber-500" />} iconBg="bg-amber-50" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Admission Funnel */}
        <SectionCard title="Admission Funnel" subtitle="Lead to enrollment pipeline">
          {funnelData.length > 0 ? (
            <div className="space-y-1.5 mt-2">
              {funnelData.map((f: any) => (
                <div key={f.stage} className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-500 w-20 text-right">{f.stage}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                    <div className="h-5 rounded-full flex items-center justify-end pr-2 text-white text-[9px] font-bold transition-all"
                      style={{ width: `${f.pct}%`, backgroundColor: f.fill }}>
                      {f.count}
                    </div>
                  </div>
                  <span className="text-[9px] text-gray-400 w-8">{f.pct}%</span>
                </div>
              ))}
            </div>
          ) : <EmptyChart message="No admission data yet" />}
        </SectionCard>

        {/* Lead Sources */}
        <SectionCard title="Lead Sources" subtitle="Where leads come from">
          {sourceData.length > 0 ? (
            <div>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={sourceData} dataKey="value" cx="50%" cy="50%" outerRadius={55}>
                    {sourceData.map((d: any, i: number) => <Cell key={i} fill={d.fill} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1 mt-2">
                {sourceData.map((s: any) => (
                  <div key={s.name} className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.fill }} />
                      <span className="text-gray-600">{s.name}</span>
                    </div>
                    <span className="font-medium text-gray-700">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <EmptyChart message="No leads recorded yet" />}
        </SectionCard>

        {/* Grade Demand */}
        <SectionCard title="Grade Demand" subtitle="Applications by grade">
          {demandData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={demandData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 9 }} />
                <YAxis dataKey="grade" type="category" tick={{ fontSize: 9 }} width={30} />
                <Tooltip />
                <Bar dataKey="applications" fill={COLORS.purple} radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart message="No applications received" />}
        </SectionCard>
      </div>

      {/* Monthly Trend */}
      {trendData.length > 0 && (
        <SectionCard title="Monthly Admission Trend" subtitle="Leads vs enrollments over time">
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 9 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Area type="monotone" dataKey="leads" stroke={COLORS.blue} fill={`${COLORS.blue}20`} name="Leads" strokeWidth={2} />
              <Area type="monotone" dataKey="enrolled" stroke={COLORS.emerald} fill={`${COLORS.emerald}20`} name="Enrolled" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </SectionCard>
      )}

      {/* Conversion Table */}
      <SectionCard title="Conversion Analysis" subtitle="Stage by stage breakdown">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-400 border-b border-gray-100">
              <th className="pb-2 text-left font-medium">Stage</th>
              <th className="pb-2 text-center font-medium">Count</th>
              <th className="pb-2 text-right font-medium">Conversion Rate</th>
            </tr>
          </thead>
          <tbody>
            {funnelData.map((f: any, i: number) => (
              <tr key={f.stage} className="border-b border-gray-50">
                <td className="py-2 font-medium text-gray-700">{f.stage}</td>
                <td className="py-2 text-center font-bold text-gray-800">{f.count}</td>
                <td className="py-2 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-20 bg-gray-100 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full" style={{ width: `${f.pct}%`, backgroundColor: f.fill }} />
                    </div>
                    <span className="font-semibold text-gray-700">{f.pct}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>
    </div>
  );
};

// ============================================================
// BEHAVIOUR INTELLIGENCE TAB
// ============================================================
export const BehaviourIntelligenceTab: React.FC<{ data: any; isLoading: boolean }> = ({ data, isLoading }) => {
  const b = data?.behaviourDash;
  const t = data?.tarbiyahAnalytics;

  const stats = b?.stats || {};
  const trendData = (b?.trendByMonth || []).map((m: any) => ({
    month: m.month,
    positive: m.positive,
    negative: m.negative,
  }));

  const gradeData = (b?.incidentsByGrade || []).map((g: any) => ({
    grade: g._id?.replace('Grade ', 'G') || g._id,
    positive: g.positive,
    negative: g.negative,
  }));

  const concerns = b?.topBehaviourConcerns || [];
  const studentsAtRisk = b?.studentsAtRisk || [];

  // Tarbiyah trait averages
  const traitData = (t?.traitAverages || []).map((t: any) => {
    const trait = (t?.traits || []).find((tr: any) => tr.key === t._id);
    return {
      trait: trait?.nameEn?.split('(')[0]?.trim()?.split(' ')[0] || t._id,
      avg: parseFloat((t.avgScore || 0).toFixed(2)),
    };
  }).slice(0, 8);

  const positivityRatio = stats.positivityRatio || 0;
  const positivityColor = positivityRatio >= 60 ? COLORS.emerald : positivityRatio >= 40 ? COLORS.amber : COLORS.red;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard title="Positivity Ratio" value={`${positivityRatio}%`}
          sub={`${stats.positiveIncidents || 0} positive records`}
          icon={<Heart size={15} className="text-pink-500" />} iconBg="bg-pink-50" />
        <KPICard title="Critical Unresolved" value={stats.unresolvedCritical || 0}
          sub="Needs immediate action"
          icon={<AlertTriangle size={15} className="text-red-500" />} iconBg="bg-red-50"
          alert={(stats.unresolvedCritical || 0) > 0} />
        <KPICard title="Active Interventions" value={stats.activeInterventions || 0}
          sub="PBIS plans in progress"
          icon={<Shield size={15} className="text-indigo-500" />} iconBg="bg-indigo-50" />
        <KPICard title="Overdue Follow-ups" value={stats.overdueFollowUps || 0}
          sub="Past scheduled date"
          icon={<Clock size={15} className="text-amber-500" />} iconBg="bg-amber-50"
          alert={(stats.overdueFollowUps || 0) > 0} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Trend */}
        <SectionCard title="Behaviour Trend" subtitle="Monthly positive vs negative">
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 9 }}
                  tickFormatter={(v: string) => {
                    const [y, m] = v.split('-');
                    return ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][+m] || m;
                  }} />
                <YAxis tick={{ fontSize: 9 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="positive" fill={COLORS.emerald} name="Positive" radius={[3, 3, 0, 0]} />
                <Bar dataKey="negative" fill={COLORS.red} name="Negative" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart message="No behaviour records yet" />}
        </SectionCard>

        {/* Grade Breakdown */}
        <SectionCard title="Grade-wise Behaviour" subtitle="Positive vs negative per grade">
          {gradeData.length > 0 ? (
            <div className="space-y-2.5 mt-2">
              {gradeData.slice(0, 6).map((g: any) => {
                const total = g.positive + g.negative;
                const posPct = total > 0 ? (g.positive / total) * 100 : 0;
                return (
                  <div key={g.grade} className="flex items-center gap-3">
                    <span className="text-[10px] text-gray-500 w-10">{g.grade}</span>
                    <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden flex">
                      <div className="bg-emerald-400 h-full" style={{ width: `${posPct}%` }} />
                      <div className="bg-red-400 h-full flex-1" />
                    </div>
                    <span className="text-[10px] text-emerald-600 font-medium w-6">{g.positive}</span>
                    <span className="text-[10px] text-red-500 font-medium w-6">{g.negative}</span>
                  </div>
                );
              })}
            </div>
          ) : <EmptyChart message="No incident data by grade" />}
        </SectionCard>

        {/* Top Concerns */}
        <SectionCard title="Top Behaviour Concerns" subtitle="Most frequent negative categories">
          {concerns.length > 0 ? (
            <div className="space-y-2.5 mt-2">
              {concerns.map((c: any, i: number) => (
                <div key={c._id} className="flex items-center gap-3">
                  <span className={`w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center flex-shrink-0
                    ${i === 0 ? 'bg-red-200 text-red-700' : 'bg-orange-100 text-orange-600'}`}>{i + 1}</span>
                  <span className="text-xs text-gray-600 flex-1 capitalize">{c._id?.replace(/_/g, ' ')}</span>
                  <div className="w-20 bg-gray-100 rounded-full h-1.5">
                    <div className="bg-red-400 h-1.5 rounded-full" style={{ width: `${(c.count / concerns[0].count) * 100}%` }} />
                  </div>
                  <span className="text-xs font-bold text-gray-700 w-6 text-right">{c.count}</span>
                </div>
              ))}
            </div>
          ) : <EmptyChart message="No negative incidents recorded" />}
        </SectionCard>

        {/* Tarbiyah Averages */}
        <SectionCard title="Tarbiyah Trait Averages" subtitle="School-wide character scores (out of 5)">
          {traitData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={traitData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 9 }} />
                <YAxis dataKey="trait" type="category" tick={{ fontSize: 9 }} width={65} />
                <Tooltip />
                <Bar dataKey="avg" fill={COLORS.emerald} radius={[0, 3, 3, 0]} name="Avg Score" />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart message="No Tarbiyah assessments done yet" />}
        </SectionCard>
      </div>

      {/* Students At Risk */}
      {studentsAtRisk.length > 0 && (
        <SectionCard title="Students Requiring Urgent Attention" subtitle="Multiple negative incidents this month">
          <div className="grid grid-cols-2 gap-2">
            {studentsAtRisk.map((s: any, i: number) => (
              <div key={i} className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                <div className="w-8 h-8 rounded-full bg-red-200 flex items-center justify-center text-sm font-bold text-red-700">
                  {s.count}
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-800">{s.studentName}</p>
                  <p className="text-[10px] text-gray-500">{s.grade} · {s.count} incidents this month</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
};
