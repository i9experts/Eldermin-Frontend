// ============================================================
// RESELLER PORTAL DASHBOARD — Eldermin Partner Network (Phase 2)
// The partner's own view: their institutions, quota progress, posted
// commission ledger, self-serve provisioning requests, and deal
// registration — all scoped server-side to their own resellerId via
// resolveResellerScope (see backend reseller-portal.controller.ts).
// ============================================================
import React, { useState } from 'react';
import {
  Handshake, LogOut, Building2, Users, DollarSign, Clock,
  Inbox, Target, Plus, X,
} from 'lucide-react';
import {
  useResellerDashboard, useResellerCommissionLedger, useResellerCommissionSummary,
  useResellerProvisioningRequests, useSubmitProvisioningRequest,
  useResellerDeals, useRegisterDeal,
} from '../../hooks/useResellerPortal';
import { getResellerPortalReseller, getResellerPortalUser, resellerPortalLogout } from '../../services/resellerPortalAuth';
import { useNavigate } from 'react-router-dom';

const Field: React.FC<{ label: string; required?: boolean; children: React.ReactNode }> = ({ label, required, children }) => (
  <div>
    <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);
const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (p) => (
  <input {...p} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 text-gray-700" />
);

const TABS = [
  { key: 'overview', label: 'Overview', icon: <Building2 size={13} /> },
  { key: 'commission', label: 'Commission Ledger', icon: <DollarSign size={13} /> },
  { key: 'provisioning', label: 'Request Institution', icon: <Inbox size={13} /> },
  { key: 'deals', label: 'Register a Deal', icon: <Target size={13} /> },
];

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const reseller = getResellerPortalReseller();
  const user = getResellerPortalUser();
  const [tab, setTab] = useState<'overview' | 'commission' | 'provisioning' | 'deals'>('overview');

  const { data, isLoading } = useResellerDashboard();

  const logout = () => {
    resellerPortalLogout();
    navigate('/partner/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#1e3a5f] flex items-center justify-center">
            <Handshake size={15} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-800 text-sm">{reseller?.name || 'Partner Portal'}</p>
            <p className="text-[10px] text-gray-400">{user?.email}</p>
          </div>
        </div>
        <button onClick={logout} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-600">
          <LogOut size={13} /> Sign out
        </button>
      </header>

      <div className="max-w-5xl mx-auto p-6 space-y-5">
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 w-fit">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md font-medium transition-all
                ${tab === t.key ? 'bg-white text-[#1e3a5f] shadow-sm' : 'text-gray-500'}`}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="h-40 bg-white rounded-xl border border-gray-100 animate-pulse" />
        ) : (
          <>
            {tab === 'overview' && data && <OverviewPanel data={data} />}
            {tab === 'commission' && <CommissionPanel />}
            {tab === 'provisioning' && <ProvisioningPanel />}
            {tab === 'deals' && <DealsPanel />}
          </>
        )}
      </div>
    </div>
  );
};

const OverviewPanel: React.FC<{ data: any }> = ({ data }) => {
  const { reseller, institutions, quota, summary } = data;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 p-3">
          <p className="text-[10px] text-gray-400 uppercase font-semibold">Institutions</p>
          <p className="text-lg font-bold text-gray-800">{summary.institutionsActive} <span className="text-xs text-gray-400 font-normal">/ {summary.institutionsTotal}</span></p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-3">
          <p className="text-[10px] text-gray-400 uppercase font-semibold">Revenue attributed</p>
          <p className="text-lg font-bold text-gray-800">PKR {summary.monthlyRevenueAttributed.toLocaleString()}<span className="text-xs text-gray-400 font-normal">/mo</span></p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-3">
          <p className="text-[10px] text-gray-400 uppercase font-semibold">Your rate</p>
          <p className="text-lg font-bold text-gray-800">
            {reseller.track === 'A' ? `${reseller.commissionRateYear1}%` : `${reseller.wholesaleDiscount}% off`}
          </p>
        </div>
        <div className={`rounded-xl p-3 border ${quota.met ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
          <p className="text-[10px] text-gray-400 uppercase font-semibold">Quota ({quota.windowMonths}mo)</p>
          <p className={`text-lg font-bold ${quota.met ? 'text-emerald-700' : 'text-amber-700'}`}>
            {quota.liveWithinWindow}{quota.required > 0 ? ` / ${quota.required}` : ''}
          </p>
        </div>
      </div>

      {reseller.status === 'active' && !quota.met && quota.required > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700 flex items-center gap-2">
          <Clock size={13} /> Below quota to hold your current tier — {quota.liveWithinWindow} of {quota.required} institutions live in the trailing {quota.windowMonths} months.
        </div>
      )}

      <div>
        <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5"><Users size={13} /> Your institutions</p>
        {institutions.length === 0 ? (
          <div className="text-xs text-gray-400 bg-white rounded-xl border border-gray-100 p-6 text-center">
            No institutions yet — request one from the "Request Institution" tab.
          </div>
        ) : (
          <div className="border border-gray-100 rounded-xl overflow-hidden bg-white">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 text-gray-500 border-b border-gray-100">
                  <th className="py-2 px-3 text-left font-semibold">Institution</th>
                  <th className="py-2 px-3 text-left font-semibold">Status</th>
                  <th className="py-2 px-3 text-left font-semibold">Plan</th>
                  <th className="py-2 px-3 text-right font-semibold">MRR</th>
                </tr>
              </thead>
              <tbody>
                {institutions.map((inst: any) => (
                  <tr key={inst._id} className="border-b border-gray-50">
                    <td className="py-2 px-3 text-gray-800 font-medium">{inst.name} <span className="text-gray-400">({inst.city})</span></td>
                    <td className="py-2 px-3 capitalize text-gray-600">{inst.status}</td>
                    <td className="py-2 px-3 capitalize text-gray-600">{inst.plan?.replace('_', ' ')}</td>
                    <td className="py-2 px-3 text-right text-gray-700 font-medium">{inst.monthlyRevenue ? `PKR ${inst.monthlyRevenue.toLocaleString()}` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const CommissionPanel: React.FC = () => {
  const { data: summary } = useResellerCommissionSummary();
  const { data: ledger, isLoading } = useResellerCommissionLedger({ limit: 30 });
  const rows = ledger?.data || [];

  return (
    <div className="space-y-4">
      {summary && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 flex items-start gap-2">
          <DollarSign size={14} className="flex-shrink-0 mt-0.5" />
          <div>
            <p><strong>Estimated current-month commission: PKR {summary.estimatedMonthlyCommission.toLocaleString()}</strong></p>
            <p className="text-[11px] mt-0.5 opacity-80">{summary.note}</p>
          </div>
        </div>
      )}
      <p className="text-xs font-semibold text-gray-700">Posted commission history</p>
      {isLoading ? (
        <div className="h-24 bg-white rounded-xl border border-gray-100 animate-pulse" />
      ) : rows.length === 0 ? (
        <div className="text-xs text-gray-400 bg-white rounded-xl border border-gray-100 p-6 text-center">No commission has been posted yet.</div>
      ) : (
        <div className="border border-gray-100 rounded-xl overflow-hidden bg-white">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 text-gray-500 border-b border-gray-100">
                <th className="py-2 px-3 text-left font-semibold">Period</th>
                <th className="py-2 px-3 text-left font-semibold">Institution</th>
                <th className="py-2 px-3 text-right font-semibold">Revenue</th>
                <th className="py-2 px-3 text-right font-semibold">Rate</th>
                <th className="py-2 px-3 text-right font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p: any) => (
                <tr key={p._id} className="border-b border-gray-50">
                  <td className="py-2 px-3 text-gray-700">{p.periodMonth}</td>
                  <td className="py-2 px-3 text-gray-600">{p.institutionName}</td>
                  <td className="py-2 px-3 text-right text-gray-600">PKR {p.revenueAmount.toLocaleString()}</td>
                  <td className="py-2 px-3 text-right text-gray-600">{p.rateApplied}%</td>
                  <td className="py-2 px-3 text-right font-medium text-gray-800">PKR {p.amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const ProvisioningPanel: React.FC = () => {
  const { data, isLoading } = useResellerProvisioningRequests();
  const submit = useSubmitProvisioningRequest();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', city: '', country: '', plan: 'starter', contactName: '', contactEmail: '' });
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  const requests = data?.data || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-700">Your provisioning requests</p>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 bg-[#1e3a5f] text-white text-xs px-3 py-1.5 rounded-lg hover:bg-[#16304f] font-medium">
          <Plus size={13} /> Request new institution
        </button>
      </div>

      {isLoading ? (
        <div className="h-24 bg-white rounded-xl border border-gray-100 animate-pulse" />
      ) : requests.length === 0 ? (
        <div className="text-xs text-gray-400 bg-white rounded-xl border border-gray-100 p-6 text-center">No requests yet.</div>
      ) : (
        <div className="border border-gray-100 rounded-xl overflow-hidden bg-white">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 text-gray-500 border-b border-gray-100">
                <th className="py-2 px-3 text-left font-semibold">Institution</th>
                <th className="py-2 px-3 text-left font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r: any) => (
                <tr key={r._id} className="border-b border-gray-50">
                  <td className="py-2 px-3 text-gray-700">{r.institution?.name}</td>
                  <td className="py-2 px-3 capitalize text-gray-600">{r.status.replace('_', ' ')}{r.autoApproved ? ' (auto-approved)' : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-800">Request a new institution</h3>
              <button onClick={() => setShowForm(false)}><X size={16} className="text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <Field label="Institution Name" required><Input value={form.name} onChange={e => set('name', e.target.value)} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="City"><Input value={form.city} onChange={e => set('city', e.target.value)} /></Field>
                <Field label="Country"><Input value={form.country} onChange={e => set('country', e.target.value)} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Contact Name"><Input value={form.contactName} onChange={e => set('contactName', e.target.value)} /></Field>
                <Field label="Contact Email"><Input type="email" value={form.contactEmail} onChange={e => set('contactEmail', e.target.value)} /></Field>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowForm(false)} className="text-xs px-4 py-2 rounded-lg border border-gray-200 text-gray-600">Cancel</button>
                <button
                  disabled={!form.name || submit.isPending}
                  onClick={() => submit.mutate(form, { onSuccess: () => { setShowForm(false); setForm({ name: '', city: '', country: '', plan: 'starter', contactName: '', contactEmail: '' }); } })}
                  className="text-xs px-4 py-2 rounded-lg bg-[#1e3a5f] text-white font-medium disabled:opacity-50"
                >
                  {submit.isPending ? 'Submitting…' : 'Submit request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DealsPanel: React.FC = () => {
  const { data, isLoading } = useResellerDeals();
  const register = useRegisterDeal();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ prospectName: '', contactName: '', contactEmail: '', contactPhone: '', city: '', country: '' });
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  const [error, setError] = useState('');
  const deals = data?.data || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-700">Your registered deals</p>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 bg-[#1e3a5f] text-white text-xs px-3 py-1.5 rounded-lg hover:bg-[#16304f] font-medium">
          <Plus size={13} /> Register a deal
        </button>
      </div>

      {isLoading ? (
        <div className="h-24 bg-white rounded-xl border border-gray-100 animate-pulse" />
      ) : deals.length === 0 ? (
        <div className="text-xs text-gray-400 bg-white rounded-xl border border-gray-100 p-6 text-center">No deals registered yet.</div>
      ) : (
        <div className="border border-gray-100 rounded-xl overflow-hidden bg-white">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 text-gray-500 border-b border-gray-100">
                <th className="py-2 px-3 text-left font-semibold">Prospect</th>
                <th className="py-2 px-3 text-left font-semibold">Protected until</th>
                <th className="py-2 px-3 text-left font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {deals.map((d: any) => (
                <tr key={d._id} className="border-b border-gray-50">
                  <td className="py-2 px-3 text-gray-700">{d.prospectName}</td>
                  <td className="py-2 px-3 text-gray-500">{new Date(d.protectionExpiresAt).toLocaleDateString()}</td>
                  <td className="py-2 px-3 capitalize text-gray-600">{d.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-800">Register a deal</h3>
              <button onClick={() => setShowForm(false)}><X size={16} className="text-gray-400" /></button>
            </div>
            {error && <div className="mb-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg p-2.5">{error}</div>}
            <div className="space-y-3">
              <Field label="Prospect / School Name" required><Input value={form.prospectName} onChange={e => set('prospectName', e.target.value)} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Contact Name"><Input value={form.contactName} onChange={e => set('contactName', e.target.value)} /></Field>
                <Field label="Contact Email"><Input type="email" value={form.contactEmail} onChange={e => set('contactEmail', e.target.value)} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="City"><Input value={form.city} onChange={e => set('city', e.target.value)} /></Field>
                <Field label="Country"><Input value={form.country} onChange={e => set('country', e.target.value)} /></Field>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowForm(false)} className="text-xs px-4 py-2 rounded-lg border border-gray-200 text-gray-600">Cancel</button>
                <button
                  disabled={!form.prospectName || register.isPending}
                  onClick={() => {
                    setError('');
                    register.mutate(form, {
                      onSuccess: () => { setShowForm(false); setForm({ prospectName: '', contactName: '', contactEmail: '', contactPhone: '', city: '', country: '' }); },
                      onError: (err: any) => setError(err?.response?.data?.message || 'Could not register this deal.'),
                    });
                  }}
                  className="text-xs px-4 py-2 rounded-lg bg-[#1e3a5f] text-white font-medium disabled:opacity-50"
                >
                  {register.isPending ? 'Registering…' : 'Register deal'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
