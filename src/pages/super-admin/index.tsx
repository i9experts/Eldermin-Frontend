// ============================================================
// SUPER ADMIN — SUBSCRIPTION + ANALYTICS + ALERTS + MODALS + INDEX
// Eldermin SaaS Platform | React + TypeScript + Tailwind
// ============================================================

import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  CreditCard, Bell, AlertTriangle, CheckCircle, Clock, Zap,
  Building2, TrendingUp, BarChart2, Users,
  Shield, Plus, Send, X, Save, Eye, Power, RefreshCw,
  Activity, Globe, MessageSquare, UserCog, ScrollText, Contact, Handshake,
} from 'lucide-react';
import {
  MetricCard, PlanBadge, StatusBadge, HealthScore,
  BusinessIntelligenceTab, InstitutionManagementTab,
  PLAN_CONFIG,
} from './BIInstitutionTabs';
import { PartnerDirectoryTab } from './PartnerDirectory';
import {
  useAlerts, useInstitutions, usePlatformAnalytics, useInstitution, useAnnouncements,
  useCreateInstitution, useUpdateStatus, useUpdateSubscription, useCreateAnnouncement, useImpersonate,
} from '../../hooks/useSuperAdmin';
import { Modal, Field, Input, Sel, BtnPrimary, BtnSecondary } from './shared';
import CRMTab from './CRMTab';
import SupportTab from './SupportTab';
import TeamTab from './TeamTab';
import AuditTab from './SuperAdminAuditTab';

// ============================================================
// SUBSCRIPTION TAB
// ============================================================
export const SubscriptionTab: React.FC<{ onOpenModal: (m: string, d?: any) => void }> = ({ onOpenModal }) => {
  const [filter, setFilter] = useState('all');
  const { data: instData, isLoading } = useInstitutions({ limit: 200 });
  const institutions = instData?.data || [];

  const subs = institutions.map((i: any) => ({
    ...i,
    renewalDate: i.subscriptionEndDate || i.trialEndDate || '',
    paymentStatus: i.status === 'active' ? 'paid' : i.status === 'trial' ? 'trial' : 'overdue',
  }));

  const filtered = filter === 'all' ? subs : subs.filter((s: any) => s.paymentStatus === filter || s.status === filter);

  const mrrByPlan = Object.entries(PLAN_CONFIG).map(([k, v]) => ({
    plan: v.label,
    institutions: institutions.filter((i: any) => i.plan === k).length,
    revenue: institutions.filter((i: any) => i.plan === k).reduce((a: number, i: any) => a + (i.monthlyRevenue || 0), 0),
  }));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-800">Subscription Management</h2>
          <p className="text-xs text-gray-400">Billing status, plan changes, renewal tracking</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {mrrByPlan.map(p => (
          <div key={p.plan} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className="text-[10px] text-gray-400 font-semibold uppercase">{p.plan}</p>
            <p className="text-xl font-bold text-gray-800 mt-1">
              {isLoading ? <span className="inline-block h-6 w-8 bg-gray-200 animate-pulse rounded" /> : p.institutions}
            </p>
            <p className="text-xs text-emerald-600 font-medium mt-0.5">PKR {p.revenue.toLocaleString()}/mo</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        {['all', 'trial', 'active', 'overdue', 'churned'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-lg border font-medium capitalize transition-all
              ${filter === f ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]' : 'bg-white text-gray-600 border-gray-200'}`}>
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 text-gray-500 border-b border-gray-100">
              <th className="py-3 px-4 text-left font-semibold">Institution</th>
              <th className="py-3 px-4 font-semibold">Plan</th>
              <th className="py-3 px-4 font-semibold">MRR</th>
              <th className="py-3 px-4 font-semibold">Payment</th>
              <th className="py-3 px-4 font-semibold">Renewal</th>
              <th className="py-3 px-4 font-semibold">Auto-Renew</th>
              <th className="py-3 px-4 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-gray-50">
                <td colSpan={7} className="py-3 px-4">
                  <div className="animate-pulse h-4 bg-gray-100 rounded w-3/4" />
                </td>
              </tr>
            ))}
            {!isLoading && filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="py-12 text-center text-xs text-gray-400">No subscriptions found</td>
              </tr>
            )}
            {filtered.map((s: any) => {
              const daysToRenewal = s.renewalDate
                ? Math.ceil((new Date(s.renewalDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                : null;
              return (
                <tr key={s._id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <p className="font-medium text-gray-800">{s.name}</p>
                    <p className="text-[10px] text-gray-400">{s.city}</p>
                  </td>
                  <td className="py-3 px-4"><PlanBadge plan={s.plan} /></td>
                  <td className="py-3 px-4 font-bold text-gray-700">
                    {s.monthlyRevenue > 0 ? `PKR ${s.monthlyRevenue.toLocaleString()}` : '—'}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize
                      ${s.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                        s.paymentStatus === 'trial' ? 'bg-blue-100 text-blue-700' :
                        'bg-red-100 text-red-700'}`}>
                      {s.paymentStatus}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {daysToRenewal !== null ? (
                      <span className={`text-[10px] font-medium ${daysToRenewal <= 3 ? 'text-red-600' : daysToRenewal <= 7 ? 'text-amber-600' : 'text-gray-500'}`}>
                        {daysToRenewal > 0 ? `${daysToRenewal}d` : 'Expired'}
                      </span>
                    ) : <span className="text-gray-300 text-[10px]">—</span>}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-[10px] ${s.autoRenew ? 'text-emerald-600' : 'text-gray-400'}`}>
                      {s.autoRenew ? '✓ Yes' : '✗ No'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button onClick={() => onOpenModal('manageSubscription', s)}
                      className="text-[10px] text-[#1e3a5f] hover:underline font-medium">
                      Manage
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ============================================================
// ALERTS TAB
// ============================================================
export const AlertsTab: React.FC<{ onOpenModal: (m: string, d?: any) => void }> = ({ onOpenModal }) => {
  const { data: alerts, isLoading } = useAlerts();
  const { data: announcements, isLoading: announcementsLoading } = useAnnouncements();

  const summary = alerts?.summary || { criticalAlerts: 0, highAlerts: 0, churnRiskCount: 0 };
  const trialsExpiring3Days = alerts?.trialsExpiring3Days || [];
  const inactiveInstitutions = alerts?.inactiveInstitutions || [];
  const churnRisk = alerts?.churnRisk || [];
  const recentAnnouncements: any[] = announcements || [];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-gray-800">Alerts & Health Monitoring</h2>
        <p className="text-xs text-gray-400">Platform-wide alerts requiring your attention</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <Zap size={20} className="text-red-600 flex-shrink-0" />
          <div>
            <p className="text-2xl font-bold text-red-700">
              {isLoading ? <span className="inline-block h-7 w-6 bg-red-200 animate-pulse rounded" /> : summary.criticalAlerts}
            </p>
            <p className="text-xs text-red-600">Critical Alerts</p>
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle size={20} className="text-amber-600 flex-shrink-0" />
          <div>
            <p className="text-2xl font-bold text-amber-700">
              {isLoading ? <span className="inline-block h-7 w-6 bg-amber-200 animate-pulse rounded" /> : summary.highAlerts}
            </p>
            <p className="text-xs text-amber-600">High Priority</p>
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
          <TrendingUp size={20} className="text-blue-600 flex-shrink-0" />
          <div>
            <p className="text-2xl font-bold text-blue-700">
              {isLoading ? <span className="inline-block h-7 w-6 bg-blue-200 animate-pulse rounded" /> : summary.churnRiskCount}
            </p>
            <p className="text-xs text-blue-600">Churn Risk</p>
          </div>
        </div>
      </div>

      {[
        {
          title: '🚨 Trials Expiring in 3 Days', color: 'border-red-200 bg-red-50',
          items: trialsExpiring3Days,
          render: (i: any) => (
            <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-red-100">
              <AlertTriangle size={14} className="text-red-500 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-800">{i.name}</p>
                <p className="text-[10px] text-gray-400">{i.city} · Trial expires {i.trialEndDate ? new Date(i.trialEndDate).toLocaleDateString() : '—'}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => onOpenModal('manageSubscription', i)}
                  className="text-[10px] bg-[#1e3a5f] text-white px-3 py-1 rounded-lg font-medium">
                  Convert Now
                </button>
              </div>
            </div>
          ),
        },
        {
          title: '⚠️ Inactive 7+ Days', color: 'border-amber-200 bg-amber-50',
          items: inactiveInstitutions,
          render: (i: any) => (
            <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-amber-100">
              <Clock size={14} className="text-amber-500 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-800">{i.name}</p>
                <p className="text-[10px] text-gray-400">{i.plan} · Last active: {i.lastActivityAt ? new Date(i.lastActivityAt).toLocaleDateString() : '—'}</p>
              </div>
              <HealthScore score={i.healthScore || 0} />
            </div>
          ),
        },
        {
          title: '📉 Churn Risk', color: 'border-blue-200 bg-blue-50',
          items: churnRisk,
          render: (i: any) => (
            <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-blue-100">
              <TrendingUp size={14} className="text-blue-500 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-800">{i.name}</p>
                <p className="text-[10px] text-gray-400">{i.churnRiskReason || 'Low engagement'}</p>
              </div>
              <HealthScore score={i.healthScore || 0} />
              <PlanBadge plan={i.plan} />
            </div>
          ),
        },
      ].map(section => (
        <div key={section.title} className={`rounded-xl border p-4 ${section.color}`}>
          <p className="text-sm font-semibold text-gray-700 mb-3">{section.title}</p>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2].map(i => (
                <div key={i} className="h-12 bg-white/60 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : section.items.length > 0 ? (
            <div className="space-y-2">{section.items.map((item: any, i: number) => (
              <div key={i}>{section.render(item)}</div>
            ))}</div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-emerald-600 bg-white rounded-xl p-3">
              <CheckCircle size={13} /> All clear — no alerts in this category
            </div>
          )}
        </div>
      ))}

      <div className="rounded-xl border border-gray-100 bg-white p-4">
        <p className="text-sm font-semibold text-gray-700 mb-3">📢 Recent Announcements</p>
        {announcementsLoading ? (
          <div className="space-y-2">{[1, 2].map(i => <div key={i} className="h-10 bg-gray-100 animate-pulse rounded-xl" />)}</div>
        ) : recentAnnouncements.length === 0 ? (
          <p className="text-xs text-gray-400 py-4 text-center">No announcements sent yet - use the Broadcast button above.</p>
        ) : (
          <div className="space-y-2">
            {recentAnnouncements.slice(0, 5).map((a: any) => (
              <div key={a._id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase flex-shrink-0 mt-0.5
                  ${a.type === 'critical' ? 'bg-red-100 text-red-700' : a.type === 'warning' ? 'bg-amber-100 text-amber-700'
                    : a.type === 'success' ? 'bg-emerald-100 text-emerald-700' : a.type === 'maintenance' ? 'bg-purple-100 text-purple-700'
                    : 'bg-blue-100 text-blue-700'}`}>{a.type}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800">{a.title}</p>
                  <p className="text-[10px] text-gray-500 line-clamp-2">{a.message}</p>
                  <p className="text-[9px] text-gray-400 mt-0.5">{a.createdAt ? new Date(a.createdAt).toLocaleString() : ''}{!a.isActive && ' · expired'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================
// PLATFORM ANALYTICS TAB — wired to real /super-admin/analytics data
// ============================================================
export const PlatformAnalyticsTab: React.FC = () => {
  const { data: analytics, isLoading: analyticsLoading } = usePlatformAnalytics();
  const { data: instData, isLoading: instLoading } = useInstitutions({ limit: 500 });

  const institutions = instData?.data || [];
  const totalInstitutions = institutions.length;
  const moduleAdoption = analytics?.moduleAdoption || [];
  const activityTrend = (analytics?.featureUsageTrend || []).map((d: any) => ({
    month: d._id,
    totalLogins: d.totalLogins,
    activeInstitutions: d.activeInstitutions,
  }));

  const healthBuckets = [
    { range: '80-100', label: 'Excellent', min: 80, max: 100, color: 'bg-emerald-500' },
    { range: '60-79', label: 'Good', min: 60, max: 79, color: 'bg-blue-500' },
    { range: '40-59', label: 'Fair', min: 40, max: 59, color: 'bg-amber-500' },
    { range: '20-39', label: 'At Risk', min: 20, max: 39, color: 'bg-orange-500' },
    { range: '0-19', label: 'Critical', min: 0, max: 19, color: 'bg-red-500' },
  ].map(b => ({
    ...b,
    count: institutions.filter((i: any) => (i.healthScore ?? 0) >= b.min && (i.healthScore ?? 0) <= b.max).length,
  }));
  const maxBucketCount = Math.max(1, ...healthBuckets.map(b => b.count));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-gray-800">Analytics & Reports</h2>
        <p className="text-xs text-gray-400">Feature adoption, activity trends, module usage — real platform data</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Module Adoption (Active Institutions)</h3>
          {analyticsLoading ? (
            <div className="space-y-2.5">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-4 bg-gray-100 animate-pulse rounded" />)}</div>
          ) : moduleAdoption.length === 0 ? (
            <p className="text-xs text-gray-400 py-6 text-center">No module usage data yet.</p>
          ) : (
            <div className="space-y-2.5">
              {moduleAdoption.map((m: any) => {
                const pct = totalInstitutions > 0 ? (m.count / totalInstitutions) * 100 : 0;
                const label = String(m._id).charAt(0).toUpperCase() + String(m._id).slice(1).replace('_', ' ');
                return (
                  <div key={m._id} className="flex items-center gap-3">
                    <span className="text-[10px] text-gray-600 w-24 truncate">{label}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                      <div className="bg-[#1e3a5f] h-2.5 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[10px] font-bold text-gray-700 w-8 text-right">{m.count}</span>
                    <span className="text-[10px] text-gray-400 w-10 text-right">{pct.toFixed(0)}%</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Platform Activity Trend (30 days)</h3>
          {analyticsLoading ? (
            <div className="h-[220px] bg-gray-100 animate-pulse rounded-xl" />
          ) : activityTrend.length === 0 ? (
            <p className="text-xs text-gray-400 py-16 text-center">No activity logged yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={activityTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 9 }} tickFormatter={(v: string) => v?.slice(5)} />
                <YAxis tick={{ fontSize: 9 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Line dataKey="totalLogins" stroke="#1e3a5f" strokeWidth={2} name="Total Logins" dot={{ r: 3 }} />
                <Line dataKey="activeInstitutions" stroke="#10b981" strokeWidth={2} name="Active Institutions" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Institution Health Score Distribution</h3>
        <p className="text-[10px] text-gray-400 mb-4">Computed live from {totalInstitutions} institution{totalInstitutions !== 1 ? 's' : ''}</p>
        <div className="grid grid-cols-5 gap-3">
          {healthBuckets.map(h => (
            <div key={h.range} className="text-center">
              <div className="h-20 bg-gray-100 rounded-xl relative overflow-hidden mb-2">
                {!instLoading && (
                  <div className={`${h.color} absolute bottom-0 left-0 right-0 rounded-xl transition-all`}
                    style={{ height: `${(h.count / maxBucketCount) * 100}%` }} />
                )}
              </div>
              <p className="text-lg font-bold text-gray-800">{instLoading ? '—' : h.count}</p>
              <p className="text-[10px] text-gray-500">{h.label}</p>
              <p className="text-[9px] text-gray-400">{h.range}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// KEY MODALS
// ============================================================
export const ManageSubscriptionModal: React.FC<{ institution: any; onClose: () => void }> = ({ institution: inst, onClose }) => {
  const updateSubscription = useUpdateSubscription();
  const [form, setForm] = useState({
    plan: inst?.plan || 'starter',
    customPrice: '',
    startDate: '',
    endDate: '',
    billingCycle: 'monthly',
    paymentMethod: 'Bank Transfer',
    transactionId: '',
    paymentStatus: 'paid',
    autoRenew: !!inst?.autoRenew,
    notes: '',
  });
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.plan || !form.startDate || !form.endDate) {
      toast.error('Plan, Start Date, and End Date are required'); return;
    }
    updateSubscription.mutate(
      {
        slug: inst.slug,
        data: {
          plan: form.plan,
          customPrice: form.customPrice ? Number(form.customPrice) : undefined,
          startDate: form.startDate, endDate: form.endDate,
          billingCycle: form.billingCycle, paymentMethod: form.paymentMethod,
          transactionId: form.transactionId || undefined, paymentStatus: form.paymentStatus,
          autoRenew: form.autoRenew, notes: form.notes || undefined,
        },
      },
      {
        onSuccess: () => { toast.success('Subscription updated'); onClose(); },
        onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to update subscription'),
      },
    );
  };

  return (
    <Modal title="Manage Subscription" subtitle={inst?.name} onClose={onClose} size="md"
      footer={<><BtnSecondary onClick={onClose}>Cancel</BtnSecondary><BtnPrimary icon={<Save size={12} />} onClick={handleSave} disabled={updateSubscription.isPending}>{updateSubscription.isPending ? 'Saving…' : 'Save Changes'}</BtnPrimary></>}>
      <div className="space-y-4">
        <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-2 gap-3 text-xs">
          <div><span className="text-gray-400">Current Plan:</span> <strong className="text-gray-700">{PLAN_CONFIG[inst?.plan as keyof typeof PLAN_CONFIG]?.label}</strong></div>
          <div><span className="text-gray-400">Status:</span> <strong className="text-gray-700 capitalize">{inst?.status}</strong></div>
          <div><span className="text-gray-400">MRR:</span> <strong className="text-gray-700">PKR {(inst?.monthlyRevenue || 0).toLocaleString()}</strong></div>
          <div><span className="text-gray-400">Students:</span> <strong className="text-gray-700">{inst?.usage?.totalStudents || 0}</strong></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="New Plan" required>
            <Sel value={form.plan} onChange={e => set('plan', e.target.value)}>
              {Object.entries(PLAN_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.label} — PKR {v.price.toLocaleString()}/mo</option>
              ))}
            </Sel>
          </Field>
          <Field label="Custom Price (PKR)">
            <Input type="number" value={form.customPrice} onChange={e => set('customPrice', e.target.value)} placeholder="Leave blank for standard pricing" />
          </Field>
          <Field label="Start Date" required><Input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} /></Field>
          <Field label="End Date" required><Input type="date" value={form.endDate} onChange={e => set('endDate', e.target.value)} /></Field>
          <Field label="Billing Cycle">
            <Sel value={form.billingCycle} onChange={e => set('billingCycle', e.target.value)}>
              <option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="annual">Annual</option>
            </Sel>
          </Field>
          <Field label="Payment Method">
            <Sel value={form.paymentMethod} onChange={e => set('paymentMethod', e.target.value)}>
              <option>Bank Transfer</option><option>Cash</option><option>Online</option><option>Cheque</option>
            </Sel>
          </Field>
          <Field label="Transaction ID"><Input value={form.transactionId} onChange={e => set('transactionId', e.target.value)} placeholder="Optional" /></Field>
          <Field label="Payment Status">
            <Sel value={form.paymentStatus} onChange={e => set('paymentStatus', e.target.value)}>
              <option value="paid">Paid</option><option value="pending">Pending</option><option value="free">Free/Override</option>
            </Sel>
          </Field>
        </div>
        <div>
          <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
            <input type="checkbox" className="rounded" checked={form.autoRenew} onChange={e => set('autoRenew', e.target.checked)} /> Auto-renew enabled
          </label>
        </div>
        <Field label="Notes">
          <textarea rows={2} value={form.notes} onChange={e => set('notes', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs resize-none text-gray-700"
            placeholder="Internal notes about this subscription change..." />
        </Field>
      </div>
    </Modal>
  );
};

export const CreateInstitutionModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const createInstitution = useCreateInstitution();
  const [form, setForm] = useState({
    name: '', slug: '', type: 'school', curriculum: 'Matric',
    city: '', country: 'Pakistan', phone: '', email: '',
    contactName: '', contactEmail: '', contactPhone: '',
  });
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const slugify = (v: string) => v.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');

  const handleCreate = () => {
    if (!form.name.trim() || !form.slug.trim() || !form.city.trim() || !form.contactName.trim() || !form.contactEmail.trim()) {
      toast.error('Institution Name, Slug, City, and Primary Contact Name/Email are required'); return;
    }
    createInstitution.mutate(
      {
        name: form.name, slug: form.slug, type: form.type, curriculum: form.curriculum,
        city: form.city, country: form.country, phone: form.phone || undefined, email: form.email || undefined,
        primaryContact: { name: form.contactName, email: form.contactEmail, phone: form.contactPhone || undefined },
      },
      {
        onSuccess: () => { toast.success(`${form.name} created on Free Trial`); onClose(); },
        onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to create institution'),
      },
    );
  };

  return (
    <Modal title="Create New Institution" subtitle="Manually onboard a new school" onClose={onClose} size="lg"
      footer={<><BtnSecondary onClick={onClose}>Cancel</BtnSecondary><BtnPrimary icon={<Building2 size={12} />} onClick={handleCreate} disabled={createInstitution.isPending}>{createInstitution.isPending ? 'Creating…' : 'Create & Start Trial'}</BtnPrimary></>}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Institution Name" required>
            <Input value={form.name} onChange={e => { set('name', e.target.value); if (!form.slug) set('slug', slugify(e.target.value)); }} placeholder="e.g. Al-Noor Islamic School" />
          </Field>
          <Field label="Slug (URL)" required><Input value={form.slug} onChange={e => set('slug', slugify(e.target.value))} placeholder="e.g. al-noor-school" /></Field>
          <Field label="Type" required>
            <Sel value={form.type} onChange={e => set('type', e.target.value)}>
              <option value="school">School</option><option value="college">College</option>
              <option value="madrassa">Madrassa</option><option value="institute">Institute</option>
            </Sel>
          </Field>
          <Field label="Curriculum">
            <Sel value={form.curriculum} onChange={e => set('curriculum', e.target.value)}>
              <option>Matric</option><option>Cambridge</option><option>O-Levels</option><option>Mixed</option>
            </Sel>
          </Field>
          <Field label="City" required><Input value={form.city} onChange={e => set('city', e.target.value)} placeholder="Lahore" /></Field>
          <Field label="Country"><Input value={form.country} onChange={e => set('country', e.target.value)} /></Field>
          <Field label="Phone"><Input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+92 300 0000000" /></Field>
          <Field label="Email"><Input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="admin@school.edu.pk" /></Field>
        </div>
        <p className="text-[10px] font-bold text-gray-400 uppercase">Primary Contact</p>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Name" required><Input value={form.contactName} onChange={e => set('contactName', e.target.value)} placeholder="Principal / IT Admin" /></Field>
          <Field label="Email" required><Input type="email" value={form.contactEmail} onChange={e => set('contactEmail', e.target.value)} placeholder="contact@school.pk" /></Field>
          <Field label="Phone"><Input value={form.contactPhone} onChange={e => set('contactPhone', e.target.value)} placeholder="+92 300 0000000" /></Field>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
          Institution will be created on <strong>Free Trial (14 days)</strong>. You can upgrade the plan after setup.
        </div>
      </div>
    </Modal>
  );
};

export const SuspendModal: React.FC<{ institution: any; action: 'suspend'|'reactivate'; onClose: () => void }> = ({ institution: inst, action, onClose }) => {
  const updateStatus = useUpdateStatus();
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    updateStatus.mutate(
      { slug: inst.slug, data: { status: action === 'suspend' ? 'suspended' : 'active', reason } },
      {
        onSuccess: () => { toast.success(action === 'suspend' ? 'Institution suspended' : 'Institution reactivated'); onClose(); },
        onError: (e: any) => toast.error(e?.response?.data?.message || `Failed to ${action} institution`),
      },
    );
  };

  return (
    <Modal title={action === 'suspend' ? 'Suspend Institution' : 'Reactivate Institution'}
      subtitle={inst?.name} onClose={onClose} size="sm"
      footer={<>
        <BtnSecondary onClick={onClose}>Cancel</BtnSecondary>
        <button onClick={handleConfirm} disabled={updateStatus.isPending}
          className={`flex items-center gap-1.5 text-xs px-5 py-2.5 rounded-lg font-medium text-white disabled:opacity-50
            ${action === 'suspend' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
          <Power size={12} /> {updateStatus.isPending ? 'Working…' : action === 'suspend' ? 'Suspend' : 'Reactivate'}
        </button>
      </>}>
      <div className="space-y-4">
        <div className={`rounded-xl p-4 ${action === 'suspend' ? 'bg-red-50 border border-red-200 text-red-800' : 'bg-emerald-50 border border-emerald-200 text-emerald-800'}`}>
          <p className="text-xs">
            {action === 'suspend'
              ? `Suspending ${inst?.name} will prevent all users from logging in. Data is preserved.`
              : `Reactivating ${inst?.name} will restore full access for all users.`}
          </p>
        </div>
        <Field label={action === 'suspend' ? 'Suspension Reason' : 'Reactivation Notes'}>
          <textarea rows={3} value={reason} onChange={e => setReason(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs resize-none text-gray-700"
            placeholder={action === 'suspend' ? 'Payment overdue / Policy violation...' : 'Payment received, account restored...'} />
        </Field>
      </div>
    </Modal>
  );
};

const ANNOUNCEMENT_TARGETS: Record<string, string[]> = {
  all: [], trial: ['free_trial'], active: ['starter', 'professional', 'enterprise'], pro_ent: ['professional', 'enterprise'],
};

export const AnnouncementModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const createAnnouncement = useCreateAnnouncement();
  const [form, setForm] = useState({
    type: 'info', target: 'all', title: '', message: '', scheduledAt: '', expiresAt: '',
  });
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleSend = () => {
    if (!form.title.trim() || !form.message.trim()) {
      toast.error('Title and Message are required'); return;
    }
    createAnnouncement.mutate(
      {
        type: form.type, title: form.title, message: form.message,
        targetPlans: ANNOUNCEMENT_TARGETS[form.target] || [],
        scheduledAt: form.scheduledAt || undefined, expiresAt: form.expiresAt || undefined,
      },
      {
        onSuccess: () => { toast.success('Announcement sent'); onClose(); },
        onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to send announcement'),
      },
    );
  };

  return (
    <Modal title="Send Platform Announcement" onClose={onClose} size="md"
      footer={<><BtnSecondary onClick={onClose}>Cancel</BtnSecondary><BtnPrimary icon={<Send size={12} />} onClick={handleSend} disabled={createAnnouncement.isPending}>{createAnnouncement.isPending ? 'Sending…' : 'Send Announcement'}</BtnPrimary></>}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Type" required>
            <Sel value={form.type} onChange={e => set('type', e.target.value)}>
              <option value="info">Info</option><option value="warning">Warning</option>
              <option value="maintenance">Maintenance</option><option value="success">Success</option>
              <option value="critical">Critical</option>
            </Sel>
          </Field>
          <Field label="Target">
            <Sel value={form.target} onChange={e => set('target', e.target.value)}>
              <option value="all">All Institutions</option><option value="trial">Trial Only</option>
              <option value="active">Active Only</option><option value="pro_ent">Professional + Enterprise</option>
            </Sel>
          </Field>
        </div>
        <Field label="Title" required><Input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Announcement title..." /></Field>
        <Field label="Message" required>
          <textarea rows={4} value={form.message} onChange={e => set('message', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs resize-none text-gray-700"
            placeholder="Full announcement message..." />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Schedule At"><Input type="datetime-local" value={form.scheduledAt} onChange={e => set('scheduledAt', e.target.value)} /></Field>
          <Field label="Expires At"><Input type="datetime-local" value={form.expiresAt} onChange={e => set('expiresAt', e.target.value)} /></Field>
        </div>
      </div>
    </Modal>
  );
};

// Opens a real 30-minute session as this institution's own owner/admin
// in a new tab, via the one-time URL-fragment handoff /impersonate reads
// and immediately clears (see ImpersonateHandoffPage). The original
// super-admin tab's own in-memory session is untouched - only a
// subsequent reload of THIS tab would pick up the new localStorage
// session, so the admin's own tab stays themselves until they choose to.
export const ImpersonateModal: React.FC<{ institution: any; onClose: () => void }> = ({ institution: inst, onClose }) => {
  const impersonate = useImpersonate();

  const handleContinue = () => {
    impersonate.mutate(inst.slug, {
      onSuccess: (data: any) => {
        const handoff = { accessToken: data.accessToken, user: data.user, institution: data.institution };
        const encoded = btoa(encodeURIComponent(JSON.stringify(handoff)));
        window.open(`/impersonate#data=${encoded}`, '_blank');
        toast.success(`Opened a 30-minute session as ${data.user?.name || 'their admin'}`);
        onClose();
      },
      onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to start impersonation session'),
    });
  };

  return (
    <Modal title="Support Access" subtitle={inst?.name} onClose={onClose} size="sm"
      footer={<>
        <BtnSecondary onClick={onClose}>Cancel</BtnSecondary>
        <BtnPrimary icon={<Shield size={12} />} onClick={handleContinue} disabled={impersonate.isPending}>
          {impersonate.isPending ? 'Opening…' : 'Continue in New Tab'}
        </BtnPrimary>
      </>}>
      <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 text-xs text-teal-800 space-y-2">
        <p>You're about to open a <strong>30-minute support session</strong> logged in as {inst?.name}'s own owner/admin account, in a new browser tab.</p>
        <p>Your own Super Admin session in this tab is unaffected. This impersonation is tied to your admin account for audit purposes.</p>
      </div>
    </Modal>
  );
};

export const InstitutionDetailModal: React.FC<{ institution: any; onClose: () => void }> = ({ institution: row, onClose }) => {
  const { data, isLoading } = useInstitution(row?.slug);
  const inst = data?.institution || row;
  const subHistory: any[] = data?.subHistory || [];
  const usageTrend: any[] = data?.usageTrend || [];

  return (
    <Modal title="Institution Details" subtitle={inst?.name} onClose={onClose} size="lg" footer={<BtnSecondary onClick={onClose}>Close</BtnSecondary>}>
      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-5 bg-gray-100 animate-pulse rounded" />)}</div>
      ) : (
        <div className="space-y-5">
          <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-3 gap-3 text-xs">
            <div><span className="text-gray-400">Status:</span> <strong className="text-gray-700 capitalize">{inst?.status}</strong></div>
            <div><span className="text-gray-400">Plan:</span> <strong className="text-gray-700">{PLAN_CONFIG[inst?.plan as keyof typeof PLAN_CONFIG]?.label}</strong></div>
            <div><span className="text-gray-400">MRR:</span> <strong className="text-gray-700">PKR {(inst?.monthlyRevenue || 0).toLocaleString()}</strong></div>
            <div><span className="text-gray-400">Health Score:</span> <strong className="text-gray-700">{inst?.healthScore ?? 0}</strong></div>
            <div><span className="text-gray-400">Students:</span> <strong className="text-gray-700">{inst?.usage?.totalStudents || 0}</strong></div>
            <div><span className="text-gray-400">Staff:</span> <strong className="text-gray-700">{inst?.usage?.totalStaff || 0}</strong></div>
            <div><span className="text-gray-400">City:</span> <strong className="text-gray-700">{inst?.city || '—'}, {inst?.country || '—'}</strong></div>
            <div><span className="text-gray-400">Contact:</span> <strong className="text-gray-700">{inst?.primaryContact?.name || '—'}</strong></div>
            <div><span className="text-gray-400">Modules:</span> <strong className="text-gray-700">{(inst?.enabledModules || []).length}</strong></div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Subscription History</h3>
            {subHistory.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center bg-gray-50 rounded-xl">No subscription events yet.</p>
            ) : (
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                {subHistory.map((h: any) => (
                  <div key={h._id} className="flex items-center justify-between px-3 py-2 text-xs border-b border-gray-50 last:border-0">
                    <span className="capitalize text-gray-700 font-medium">{h.event?.replace(/_/g, ' ')}</span>
                    <span className="text-gray-400">{h.fromPlan && h.toPlan ? `${h.fromPlan} → ${h.toPlan}` : h.toPlan || '—'}</span>
                    <span className="text-gray-400">{h.effectiveDate ? new Date(h.effectiveDate).toLocaleDateString() : '—'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Usage (Last 30 Days)</h3>
            {usageTrend.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center bg-gray-50 rounded-xl">No usage logged yet.</p>
            ) : (
              <div className="grid grid-cols-7 gap-1">
                {usageTrend.slice(-14).map((u: any) => (
                  <div key={u._id} className="text-center bg-gray-50 rounded-lg p-1.5" title={new Date(u.date).toLocaleDateString()}>
                    <p className="text-[9px] text-gray-400">{new Date(u.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}</p>
                    <p className="text-xs font-bold text-gray-700">{u.dailyLogins || 0}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};

// ============================================================
// MAIN SUPER ADMIN INDEX
// ============================================================
const TABS = [
  { key: 'bi', label: 'Command Center', icon: <BarChart2 size={14} /> },
  { key: 'crm', label: 'CRM', icon: <Contact size={14} /> },
  { key: 'institutions', label: 'Institutions', icon: <Building2 size={14} /> },
  { key: 'subscriptions', label: 'Billing & Subscriptions', icon: <CreditCard size={14} /> },
  { key: 'tickets', label: 'Support', icon: <MessageSquare size={14} /> },
  { key: 'team', label: 'Team & Access', icon: <UserCog size={14} /> },
  { key: 'analytics', label: 'Analytics & Reports', icon: <Activity size={14} /> },
  { key: 'alerts', label: 'Alerts', icon: <Bell size={14} /> },
  { key: 'audit', label: 'Audit & Settings', icon: <ScrollText size={14} /> },
  { key: 'partners', label: 'Partner Network', icon: <Handshake size={14} /> },
] as const;

type TabKey = typeof TABS[number]['key'];

const DEFAULT_MODALS = {
  createInstitution: false, viewInstitution: false,
  manageSubscription: false, suspendInstitution: false,
  reactivateInstitution: false, impersonate: false,
  announcement: false,
};

const SuperAdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  // platformPermissions is only present for a super_admin with a restricted
  // PlatformRole assigned (see Team & Access) - undefined/absent means the
  // existing, unrestricted behavior: every tab visible, same as before this
  // feature existed. When present, hide any tab the role doesn't grant
  // "view" on, so a Support/Sales/etc. staffer isn't shown tabs the backend
  // would 403 them out of anyway.
  const visibleTabs = user?.platformPermissions
    ? TABS.filter(t => user.platformPermissions!.includes(`${t.key}:view`))
    : TABS;
  const activeTab = (searchParams.get('tab') as TabKey) || visibleTabs[0]?.key || 'bi';
  const setActiveTab = (tab: TabKey) => setSearchParams({ tab });
  const [modals, setModals] = useState(DEFAULT_MODALS);
  const [selectedData, setSelectedData] = useState<any>(null);

  const openModal = (modal: string, data?: any) => {
    setSelectedData(data);
    setModals({ ...DEFAULT_MODALS, [modal]: true });
  };
  const closeModals = () => { setModals(DEFAULT_MODALS); setSelectedData(null); };

  const renderTab = () => {
    switch (activeTab) {
      case 'bi': return <BusinessIntelligenceTab onNavigate={(t) => setActiveTab(t as TabKey)} />;
      case 'crm': return <CRMTab />;
      case 'institutions': return <InstitutionManagementTab onOpenModal={openModal} />;
      case 'subscriptions': return <SubscriptionTab onOpenModal={openModal} />;
      case 'tickets': return <SupportTab />;
      case 'team': return <TeamTab />;
      case 'analytics': return <PlatformAnalyticsTab />;
      case 'alerts': return <AlertsTab onOpenModal={openModal} />;
      case 'audit': return <AuditTab />;
      case 'partners': return <PartnerDirectoryTab />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-x-hidden">
      {/* Header */}
      <div className="bg-[#0f2647] px-4 sm:px-6 pt-5 pb-0">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shrink-0">
              <Globe size={18} className="text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-white truncate">Eldermin Super Admin</h1>
              <p className="text-blue-400 text-xs truncate">SaaS Platform Management · {new Date().toLocaleDateString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => openModal('announcement')}
              className="flex items-center gap-1.5 bg-amber-500 text-white text-xs px-3 sm:px-4 py-2 rounded-lg hover:bg-amber-600 font-medium whitespace-nowrap">
              <Send size={13} /> <span className="hidden sm:inline">Broadcast</span>
            </button>
            <button onClick={() => openModal('createInstitution')}
              className="flex items-center gap-1.5 bg-white text-[#1e3a5f] text-xs px-3 sm:px-4 py-2 rounded-lg hover:bg-gray-100 font-semibold whitespace-nowrap">
              <Plus size={13} /> <span className="hidden sm:inline">Add Institution</span>
            </button>
          </div>
        </div>

        <div className="flex gap-0 overflow-x-auto -mx-4 sm:-mx-6 px-4 sm:px-6 [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5">
          {visibleTabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 sm:px-5 py-3 text-xs font-medium border-b-2 whitespace-nowrap transition-all shrink-0
                ${activeTab === tab.key
                  ? 'border-amber-400 text-white'
                  : 'border-transparent text-blue-300 hover:text-white hover:bg-white/5'}`}>
              <span className={activeTab === tab.key ? 'text-amber-400' : 'text-blue-400'}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-6">{renderTab()}</div>

      {modals.createInstitution && <CreateInstitutionModal onClose={closeModals} />}
      {modals.manageSubscription && <ManageSubscriptionModal institution={selectedData} onClose={closeModals} />}
      {modals.suspendInstitution && <SuspendModal institution={selectedData} action="suspend" onClose={closeModals} />}
      {modals.reactivateInstitution && <SuspendModal institution={selectedData} action="reactivate" onClose={closeModals} />}
      {modals.announcement && <AnnouncementModal onClose={closeModals} />}
      {modals.viewInstitution && <InstitutionDetailModal institution={selectedData} onClose={closeModals} />}
      {modals.impersonate && <ImpersonateModal institution={selectedData} onClose={closeModals} />}
    </div>
  );
};

export default SuperAdminDashboard;
