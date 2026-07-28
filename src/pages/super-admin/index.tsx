// ============================================================
// SUPER ADMIN — SUBSCRIPTION + ANALYTICS + ALERTS + MODALS + INDEX
// Eldermin SaaS Platform | React + TypeScript + Tailwind
// ============================================================

import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  CreditCard, Bell, AlertTriangle, CheckCircle, Clock, Zap,
  Building2, TrendingUp, BarChart2, Users,
  Shield, Plus, Send, X, Save, Eye, Power, RefreshCw,
  Activity, Globe, MessageSquare, UserCog, ScrollText, Contact,
} from 'lucide-react';
import {
  MetricCard, PlanBadge, StatusBadge, HealthScore,
  BusinessIntelligenceTab, InstitutionManagementTab,
  PLAN_CONFIG,
} from './BIInstitutionTabs';
import { useAlerts, useInstitutions, usePlatformAnalytics } from '../../hooks/useSuperAdmin';
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

  const summary = alerts?.summary || { criticalAlerts: 0, highAlerts: 0, churnRiskCount: 0 };
  const trialsExpiring3Days = alerts?.trialsExpiring3Days || [];
  const inactiveInstitutions = alerts?.inactiveInstitutions || [];
  const churnRisk = alerts?.churnRisk || [];

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
export const ManageSubscriptionModal: React.FC<{ institution: any; onClose: () => void }> = ({ institution: inst, onClose }) => (
  <Modal title="Manage Subscription" subtitle={inst?.name} onClose={onClose} size="md"
    footer={<><BtnSecondary onClick={onClose}>Cancel</BtnSecondary><BtnPrimary icon={<Save size={12} />}>Save Changes</BtnPrimary></>}>
    <div className="space-y-4">
      <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-2 gap-3 text-xs">
        <div><span className="text-gray-400">Current Plan:</span> <strong className="text-gray-700">{PLAN_CONFIG[inst?.plan as keyof typeof PLAN_CONFIG]?.label}</strong></div>
        <div><span className="text-gray-400">Status:</span> <strong className="text-gray-700 capitalize">{inst?.status}</strong></div>
        <div><span className="text-gray-400">MRR:</span> <strong className="text-gray-700">PKR {(inst?.monthlyRevenue || 0).toLocaleString()}</strong></div>
        <div><span className="text-gray-400">Students:</span> <strong className="text-gray-700">{inst?.usage?.totalStudents || 0}</strong></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="New Plan" required>
          <Sel defaultValue={inst?.plan}>
            {Object.entries(PLAN_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.label} — PKR {v.price.toLocaleString()}/mo</option>
            ))}
          </Sel>
        </Field>
        <Field label="Custom Price (PKR)">
          <Input type="number" placeholder="Leave blank for standard pricing" />
        </Field>
        <Field label="Start Date" required><Input type="date" /></Field>
        <Field label="End Date" required><Input type="date" /></Field>
        <Field label="Billing Cycle">
          <Sel><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="annual">Annual</option></Sel>
        </Field>
        <Field label="Payment Method">
          <Sel><option>Bank Transfer</option><option>Cash</option><option>Online</option><option>Cheque</option></Sel>
        </Field>
        <Field label="Transaction ID"><Input placeholder="Optional" /></Field>
        <Field label="Payment Status">
          <Sel><option value="paid">Paid</option><option value="pending">Pending</option><option value="free">Free/Override</option></Sel>
        </Field>
      </div>
      <div>
        <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
          <input type="checkbox" className="rounded" /> Auto-renew enabled
        </label>
      </div>
      <Field label="Notes">
        <textarea rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs resize-none text-gray-700"
          placeholder="Internal notes about this subscription change..." />
      </Field>
    </div>
  </Modal>
);

export const CreateInstitutionModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <Modal title="Create New Institution" subtitle="Manually onboard a new school" onClose={onClose} size="lg"
    footer={<><BtnSecondary onClick={onClose}>Cancel</BtnSecondary><BtnPrimary icon={<Building2 size={12} />}>Create & Start Trial</BtnPrimary></>}>
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Institution Name" required><Input placeholder="e.g. Al-Noor Islamic School" /></Field>
        <Field label="Slug (URL)" required><Input placeholder="e.g. al-noor-school" /></Field>
        <Field label="Type" required>
          <Sel><option>School</option><option>College</option><option>Madrassa</option><option>Institute</option></Sel>
        </Field>
        <Field label="Curriculum">
          <Sel><option>Matric</option><option>Cambridge</option><option>O-Levels</option><option>Mixed</option></Sel>
        </Field>
        <Field label="City" required><Input placeholder="Lahore" /></Field>
        <Field label="Country"><Input defaultValue="Pakistan" /></Field>
        <Field label="Phone"><Input placeholder="+92 300 0000000" /></Field>
        <Field label="Email"><Input type="email" placeholder="admin@school.edu.pk" /></Field>
      </div>
      <p className="text-[10px] font-bold text-gray-400 uppercase">Primary Contact</p>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Name" required><Input placeholder="Principal / IT Admin" /></Field>
        <Field label="Email" required><Input type="email" placeholder="contact@school.pk" /></Field>
        <Field label="Phone"><Input placeholder="+92 300 0000000" /></Field>
      </div>
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
        Institution will be created on <strong>Free Trial (14 days)</strong>. You can upgrade the plan after setup.
      </div>
    </div>
  </Modal>
);

export const SuspendModal: React.FC<{ institution: any; action: 'suspend'|'reactivate'; onClose: () => void }> = ({ institution: inst, action, onClose }) => (
  <Modal title={action === 'suspend' ? 'Suspend Institution' : 'Reactivate Institution'}
    subtitle={inst?.name} onClose={onClose} size="sm"
    footer={<>
      <BtnSecondary onClick={onClose}>Cancel</BtnSecondary>
      <button className={`flex items-center gap-1.5 text-xs px-5 py-2.5 rounded-lg font-medium text-white
        ${action === 'suspend' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
        <Power size={12} /> {action === 'suspend' ? 'Suspend' : 'Reactivate'}
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
        <textarea rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs resize-none text-gray-700"
          placeholder={action === 'suspend' ? 'Payment overdue / Policy violation...' : 'Payment received, account restored...'} />
      </Field>
    </div>
  </Modal>
);

export const AnnouncementModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <Modal title="Send Platform Announcement" onClose={onClose} size="md"
    footer={<><BtnSecondary onClick={onClose}>Cancel</BtnSecondary><BtnPrimary icon={<Send size={12} />}>Send Announcement</BtnPrimary></>}>
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Type" required>
          <Sel><option value="info">Info</option><option value="warning">Warning</option>
            <option value="maintenance">Maintenance</option><option value="success">Success</option>
            <option value="critical">Critical</option></Sel>
        </Field>
        <Field label="Target">
          <Sel><option>All Institutions</option><option>Trial Only</option><option>Active Only</option>
            <option>Professional + Enterprise</option></Sel>
        </Field>
      </div>
      <Field label="Title" required><Input placeholder="Announcement title..." /></Field>
      <Field label="Message" required>
        <textarea rows={4} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs resize-none text-gray-700"
          placeholder="Full announcement message..." />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Schedule At"><Input type="datetime-local" /></Field>
        <Field label="Expires At"><Input type="datetime-local" /></Field>
      </div>
    </div>
  </Modal>
);

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
] as const;

type TabKey = typeof TABS[number]['key'];

const DEFAULT_MODALS = {
  createInstitution: false, viewInstitution: false,
  manageSubscription: false, suspendInstitution: false,
  reactivateInstitution: false, impersonate: false,
  announcement: false,
};

const SuperAdminDashboard: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as TabKey) || 'bi';
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
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-[#0f2647] px-6 pt-5 pb-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
              <Globe size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Eldermin Super Admin</h1>
              <p className="text-blue-400 text-xs">SaaS Platform Management · {new Date().toLocaleDateString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => openModal('announcement')}
              className="flex items-center gap-1.5 bg-amber-500 text-white text-xs px-4 py-2 rounded-lg hover:bg-amber-600 font-medium">
              <Send size={13} /> Broadcast
            </button>
            <button onClick={() => openModal('createInstitution')}
              className="flex items-center gap-1.5 bg-white text-[#1e3a5f] text-xs px-4 py-2 rounded-lg hover:bg-gray-100 font-semibold">
              <Plus size={13} /> Add Institution
            </button>
          </div>
        </div>

        <div className="flex gap-0">
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-medium border-b-2 whitespace-nowrap transition-all
                ${activeTab === tab.key
                  ? 'border-amber-400 text-white'
                  : 'border-transparent text-blue-300 hover:text-white hover:bg-white/5'}`}>
              <span className={activeTab === tab.key ? 'text-amber-400' : 'text-blue-400'}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">{renderTab()}</div>

      {modals.createInstitution && <CreateInstitutionModal onClose={closeModals} />}
      {modals.manageSubscription && <ManageSubscriptionModal institution={selectedData} onClose={closeModals} />}
      {modals.suspendInstitution && <SuspendModal institution={selectedData} action="suspend" onClose={closeModals} />}
      {modals.reactivateInstitution && <SuspendModal institution={selectedData} action="reactivate" onClose={closeModals} />}
      {modals.announcement && <AnnouncementModal onClose={closeModals} />}
    </div>
  );
};

export default SuperAdminDashboard;
