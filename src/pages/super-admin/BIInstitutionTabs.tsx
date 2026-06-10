// ============================================================
// SUPER ADMIN — BUSINESS INTELLIGENCE + INSTITUTION MANAGEMENT
// Eldermin SaaS Platform | React + TypeScript + Tailwind
// ============================================================

import React, { useState } from 'react';
import {
  BarChart, Bar, AreaChart, Area,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Building2, Users, DollarSign, TrendingUp, ArrowUpRight,
  ArrowDownRight, AlertTriangle, CheckCircle, Clock,
  Globe, MapPin, Activity, Zap, Eye, Power,
  UserPlus, RefreshCw, Search, Shield,
} from 'lucide-react';
import { useBIDashboard, useInstitutions } from '../../hooks/useSuperAdmin';

// ── Types ─────────────────────────────────────────────────────
export interface Institution {
  _id: string;
  slug: string;
  name: string;
  plan: 'free_trial' | 'starter' | 'professional' | 'enterprise';
  status: 'trial' | 'active' | 'suspended' | 'churned' | 'pending_setup';
  city: string;
  country: string;
  monthlyRevenue: number;
  healthScore: number;
  isAtChurnRisk: boolean;
  lastActivityAt: string;
  trialEndDate?: string;
  subscriptionEndDate?: string;
  autoRenew?: boolean;
  usage: { totalStudents: number; totalStaff: number; campusCount: number };
  primaryContact?: { name: string; email: string; phone: string };
  createdAt: string;
}

// ── Constants ─────────────────────────────────────────────────
export const PLAN_CONFIG = {
  free_trial: { label: 'Free Trial', color: 'bg-gray-100 text-gray-700', border: 'border-gray-300', price: 0 },
  starter: { label: 'Starter', color: 'bg-blue-100 text-blue-700', border: 'border-blue-300', price: 4999 },
  professional: { label: 'Professional', color: 'bg-purple-100 text-purple-700', border: 'border-purple-300', price: 12999 },
  enterprise: { label: 'Enterprise', color: 'bg-amber-100 text-amber-700', border: 'border-amber-300', price: 29999 },
};

export const STATUS_CONFIG = {
  trial: { label: 'Trial', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  active: { label: 'Active', color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  suspended: { label: 'Suspended', color: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
  churned: { label: 'Churned', color: 'bg-gray-100 text-gray-500', dot: 'bg-gray-400' },
  pending_setup: { label: 'Setup Pending', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
};

// ── Shared Components ─────────────────────────────────────────
export const MetricCard: React.FC<{
  title: string; value: string | number; sub?: string;
  icon: React.ReactNode; iconBg: string; trend?: number;
  alert?: boolean; onClick?: () => void;
}> = ({ title, value, sub, icon, iconBg, trend, alert, onClick }) => (
  <div onClick={onClick}
    className={`bg-white rounded-xl border p-4 shadow-sm transition-all
      ${alert ? 'border-red-200' : 'border-gray-100'}
      ${onClick ? 'cursor-pointer hover:shadow-md' : 'hover:shadow-sm'}`}>
    <div className="flex items-start justify-between">
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{title}</p>
        <p className={`text-2xl font-bold mt-1 ${alert ? 'text-red-600' : 'text-gray-800'}`}>{value}</p>
        {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
        {trend !== undefined && (
          <div className={`flex items-center gap-1 mt-1 text-[10px] font-medium
            ${trend > 0 ? 'text-emerald-600' : trend < 0 ? 'text-red-500' : 'text-gray-400'}`}>
            {trend > 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
            {Math.abs(trend)}% MoM
          </div>
        )}
      </div>
      <div className={`${iconBg} rounded-xl p-2.5 flex-shrink-0 ml-2`}>{icon}</div>
    </div>
  </div>
);

export const PlanBadge: React.FC<{ plan: string }> = ({ plan }) => {
  const cfg = PLAN_CONFIG[plan as keyof typeof PLAN_CONFIG];
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg?.color}`}>{cfg?.label || plan}</span>;
};

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg?.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg?.dot}`} />
      {cfg?.label || status}
    </span>
  );
};

export const HealthScore: React.FC<{ score: number; size?: 'sm' | 'md' }> = ({ score }) => {
  const color = score >= 70 ? 'text-emerald-600' : score >= 40 ? 'text-amber-600' : 'text-red-600';
  const bg = score >= 70 ? 'bg-emerald-500' : score >= 40 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 bg-gray-100 rounded-full h-1.5">
        <div className={`${bg} h-1.5 rounded-full`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-[10px] font-bold ${color}`}>{score}</span>
    </div>
  );
};

const SkeletonRow = () => (
  <div className="animate-pulse flex gap-4 py-3 px-4 border-b border-gray-50">
    <div className="w-8 h-8 bg-gray-200 rounded-lg flex-shrink-0" />
    <div className="flex-1 space-y-1.5">
      <div className="h-3 bg-gray-200 rounded w-48" />
      <div className="h-2 bg-gray-100 rounded w-24" />
    </div>
    <div className="h-4 bg-gray-200 rounded w-16" />
    <div className="h-4 bg-gray-200 rounded w-20" />
  </div>
);

// ============================================================
// BUSINESS INTELLIGENCE TAB
// ============================================================
const PIE_COLORS = ['#6366f1', '#3b82f6', '#8b5cf6', '#f59e0b'];

export const BusinessIntelligenceTab: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const { data, isLoading } = useBIDashboard();

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-36 bg-gradient-to-r from-[#1e3a5f] to-indigo-800 rounded-xl" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 bg-white rounded-xl border border-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-300">
        <Globe size={48} />
        <p className="text-sm text-gray-400 mt-4">No platform data available yet.</p>
      </div>
    );
  }

  const o = data.overview || {};
  const r = data.revenue || {};
  const planDist = data.planDistribution || [];
  const monthlyGrowth = data.monthlyGrowth || [];
  const cityDist = data.cityDistribution || [];
  const recentSignups = data.recentSignups || [];

  return (
    <div className="space-y-6">
      {/* Revenue Banner */}
      <div className="bg-gradient-to-r from-[#1e3a5f] to-indigo-800 rounded-xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-blue-300 text-xs font-semibold uppercase tracking-wider mb-1">Monthly Recurring Revenue</p>
            <p className="text-4xl font-black">PKR {(r.mrr || 0).toLocaleString()}</p>
            <div className="flex items-center gap-2 mt-1">
              <ArrowUpRight size={14} className="text-emerald-400" />
              <span className="text-emerald-400 text-sm font-semibold">+{r.mrrGrowth || 0}% MoM</span>
              <span className="text-blue-300 text-xs ml-2">ARR: PKR {((r.arr || 0) / 1000000).toFixed(1)}M</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Institutions', value: o.totalInstitutions || 0 },
              { label: 'Active', value: o.activeInstitutions || 0 },
              { label: 'Students', value: (o.totalStudents || 0).toLocaleString() },
              { label: 'Churn Rate', value: `${r.churnRate || 0}%` },
            ].map(s => (
              <div key={s.label} className="bg-white/10 rounded-xl px-4 py-2.5 text-center min-w-[90px]">
                <p className="text-xl font-bold text-white">{s.value}</p>
                <p className="text-blue-300 text-[10px]">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard title="Total Institutions" value={o.totalInstitutions || 0}
          sub={`+${o.newThisMonth || 0} this month`}
          icon={<Building2 size={16} className="text-blue-500" />} iconBg="bg-blue-50"
          trend={parseFloat(String(o.growthRate || 0))} />
        <MetricCard title="Active Subscriptions" value={o.activeInstitutions || 0}
          sub={`${o.trialInstitutions || 0} on trial`}
          icon={<CheckCircle size={16} className="text-emerald-500" />} iconBg="bg-emerald-50" />
        <MetricCard title="Total Students" value={(o.totalStudents || 0).toLocaleString()}
          sub={`Across ${o.totalInstitutions || 0} institutions`}
          icon={<Users size={16} className="text-purple-500" />} iconBg="bg-purple-50" />
        <MetricCard title="Open Support Tickets" value={o.openTickets || 0}
          sub="Requires attention"
          icon={<AlertTriangle size={16} className="text-red-500" />} iconBg="bg-red-50"
          alert={(o.openTickets || 0) > 0} onClick={() => onNavigate('tickets')} />
      </div>

      <div className="grid grid-cols-4 gap-4">
        <MetricCard title="New Today" value={o.newToday || 0} sub="Signups in last 24h"
          icon={<Zap size={14} className="text-amber-500" />} iconBg="bg-amber-50" />
        <MetricCard title="New This Week" value={o.newThisWeek || 0} sub="Last 7 days"
          icon={<TrendingUp size={14} className="text-teal-500" />} iconBg="bg-teal-50" />
        <MetricCard title="Suspended" value={o.suspendedInstitutions || 0}
          sub="Payment or policy issues"
          icon={<Power size={14} className="text-orange-500" />} iconBg="bg-orange-50"
          alert={(o.suspendedInstitutions || 0) > 0} />
        <MetricCard title="Total Staff" value={(o.totalStaff || 0).toLocaleString()}
          sub="Teachers & admin across all"
          icon={<Activity size={14} className="text-indigo-500" />} iconBg="bg-indigo-50" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-1">MRR Growth Trend</h3>
          <p className="text-xs text-gray-400 mb-4">Monthly recurring revenue (PKR)</p>
          {monthlyGrowth.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={monthlyGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 9 }}
                  tickFormatter={(v: string) => {
                    const [, m] = v.split('-');
                    return ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][+m] || m;
                  }} />
                <YAxis tick={{ fontSize: 9 }} tickFormatter={(v: number) => `${(v/1000).toFixed(0)}K`} />
                <Tooltip formatter={(v: any) => `PKR ${Number(v).toLocaleString()}`} />
                <Area type="monotone" dataKey="revenue" stroke="#1e3a5f" fill="#1e3a5f20" strokeWidth={2} name="MRR" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-44 text-gray-300 text-xs">No revenue data yet</div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Plan Distribution</h3>
          {planDist.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={planDist} dataKey="count" cx="50%" cy="50%" outerRadius={55}
                    label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                    {planDist.map((_: any, i: number) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                  </Pie>
                  <Tooltip formatter={(v: any, _n: any, p: any) => [v, PLAN_CONFIG[p.payload._id as keyof typeof PLAN_CONFIG]?.label || p.payload._id]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {planDist.map((p: any, i: number) => (
                  <div key={p._id} className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                      <span className="text-gray-600">{PLAN_CONFIG[p._id as keyof typeof PLAN_CONFIG]?.label || p._id}</span>
                    </div>
                    <span className="font-bold text-gray-800">{p.count}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-44 text-gray-300 text-xs">No subscriptions yet</div>
          )}
        </div>
      </div>

      {/* Growth + City + Recent */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Monthly Signups</h3>
          {monthlyGrowth.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={monthlyGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 9 }}
                  tickFormatter={(v: string) => ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][+v.split('-')[1]] || ''} />
                <YAxis tick={{ fontSize: 9 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#6366f1" radius={[3, 3, 0, 0]} name="New Institutions" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-40 text-gray-300 text-xs">No signup data yet</div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <MapPin size={14} className="text-gray-400" /> Top Cities
          </h3>
          {cityDist.length > 0 ? (
            <div className="space-y-2.5">
              {cityDist.slice(0, 5).map((c: any, i: number) => (
                <div key={c._id} className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-gray-500 w-4">{i + 1}</span>
                  <span className="text-xs text-gray-700 flex-1">{c._id}</span>
                  <div className="w-20 bg-gray-100 rounded-full h-1.5">
                    <div className="bg-[#1e3a5f] h-1.5 rounded-full"
                      style={{ width: `${(c.count / (cityDist[0]?.count || 1)) * 100}%` }} />
                  </div>
                  <span className="text-[10px] font-bold text-gray-700 w-4 text-right">{c.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 text-gray-300 text-xs">No geographic data</div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Recent Signups</h3>
          {recentSignups.length > 0 ? (
            <div className="space-y-3">
              {recentSignups.map((s: any) => (
                <div key={s.slug} className="flex items-start gap-3 pb-3 border-b border-gray-50 last:border-0">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1e3a5f] to-indigo-400 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                    {s.name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate">{s.name}</p>
                    <p className="text-[10px] text-gray-400">{s.city} · {new Date(s.createdAt).toLocaleDateString()}</p>
                  </div>
                  <PlanBadge plan={s.plan} />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 text-gray-300 text-xs">No recent signups</div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// INSTITUTION MANAGEMENT TAB
// ============================================================
export const InstitutionManagementTab: React.FC<{
  onOpenModal: (m: string, d?: any) => void;
}> = ({ onOpenModal }) => {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPlan, setFilterPlan] = useState('all');

  const { data: instData, isLoading } = useInstitutions({ limit: 200 });
  const institutions: Institution[] = instData?.data || [];

  const filtered = institutions.filter(i => {
    const matchSearch = !search || i.name.toLowerCase().includes(search.toLowerCase())
      || i.city.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || i.status === filterStatus;
    const matchPlan = filterPlan === 'all' || i.plan === filterPlan;
    return matchSearch && matchStatus && matchPlan;
  });

  const daysSinceActive = (dateStr: string) => {
    const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days}d ago`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-800">Institution Management</h2>
          <p className="text-xs text-gray-400">{institutions.length} institutions · manage subscriptions, status, access</p>
        </div>
        <button onClick={() => onOpenModal('createInstitution')}
          className="flex items-center gap-1.5 bg-[#1e3a5f] text-white text-xs px-4 py-2 rounded-lg hover:bg-[#16304f] font-medium">
          <UserPlus size={13} /> Add Institution
        </button>
      </div>

      {/* Status Strip */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'active', 'trial', 'suspended', 'churned'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`text-xs px-3 py-1.5 rounded-lg border font-medium capitalize transition-all
              ${filterStatus === s ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]' :
                'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
            {s === 'all' ? `All (${institutions.length})` :
              `${STATUS_CONFIG[s as keyof typeof STATUS_CONFIG]?.label} (${institutions.filter(i => i.status === s).length})`}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm flex gap-3 items-center">
        <div className="relative flex-1">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search institution, city..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none text-gray-700" />
        </div>
        <select value={filterPlan} onChange={e => setFilterPlan(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-3 py-2 text-gray-600">
          <option value="all">All Plans</option>
          {Object.entries(PLAN_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <span className="text-xs text-gray-400">{filtered.length} results</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 text-gray-500 border-b border-gray-100">
              <th className="py-3 px-4 text-left font-semibold">Institution</th>
              <th className="py-3 px-4 font-semibold">Status</th>
              <th className="py-3 px-4 font-semibold">Plan</th>
              <th className="py-3 px-4 font-semibold">Revenue</th>
              <th className="py-3 px-4 font-semibold">Students</th>
              <th className="py-3 px-4 font-semibold">Health</th>
              <th className="py-3 px-4 font-semibold">Last Active</th>
              <th className="py-3 px-4 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && Array.from({ length: 5 }).map((_, i) => <tr key={i}><td colSpan={8}><SkeletonRow /></td></tr>)}
            {!isLoading && filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="py-16 text-center text-gray-300">
                  <Building2 size={36} className="mx-auto mb-2" />
                  <p className="text-xs text-gray-400">No institutions found</p>
                </td>
              </tr>
            )}
            {filtered.map(inst => (
              <tr key={inst._id}
                className={`border-b border-gray-50 hover:bg-gray-50 transition-colors
                  ${inst.isAtChurnRisk ? 'bg-red-50/20' : ''}`}>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1e3a5f] to-indigo-400 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                      {inst.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{inst.name}</p>
                      <p className="text-[10px] text-gray-400">{inst.slug} · {inst.city}</p>
                    </div>
                    {inst.isAtChurnRisk && (
                      <AlertTriangle size={12} className="text-red-500 flex-shrink-0" />
                    )}
                  </div>
                </td>
                <td className="py-3 px-4"><StatusBadge status={inst.status} /></td>
                <td className="py-3 px-4"><PlanBadge plan={inst.plan} /></td>
                <td className="py-3 px-4 font-medium text-gray-700">
                  {inst.monthlyRevenue > 0 ? `PKR ${inst.monthlyRevenue.toLocaleString()}` : '—'}
                </td>
                <td className="py-3 px-4 text-gray-600">{inst.usage?.totalStudents || 0}</td>
                <td className="py-3 px-4"><HealthScore score={inst.healthScore} /></td>
                <td className="py-3 px-4 text-gray-400 text-[10px]">
                  {inst.lastActivityAt ? daysSinceActive(inst.lastActivityAt) : '—'}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => onOpenModal('viewInstitution', inst)}
                      className="p-1.5 text-gray-400 hover:text-[#1e3a5f] hover:bg-blue-50 rounded-lg" title="View Details">
                      <Eye size={13} />
                    </button>
                    <button onClick={() => onOpenModal('manageSubscription', inst)}
                      className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg" title="Manage Subscription">
                      <DollarSign size={13} />
                    </button>
                    <button onClick={() => onOpenModal('impersonate', inst)}
                      className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg" title="Support Access">
                      <Shield size={13} />
                    </button>
                    {inst.status === 'active' || inst.status === 'trial' ? (
                      <button onClick={() => onOpenModal('suspendInstitution', inst)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Suspend">
                        <Power size={13} />
                      </button>
                    ) : (
                      <button onClick={() => onOpenModal('reactivateInstitution', inst)}
                        className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Reactivate">
                        <RefreshCw size={13} />
                      </button>
                    )}
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
