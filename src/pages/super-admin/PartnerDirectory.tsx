// ============================================================
// PARTNER DIRECTORY — Eldermin Partner Network (Phase 1)
// Super Admin control-center surface for the reseller program:
// list/create/approve partners, see institutions attributed to each,
// provision an institution under a partner, and view the (Phase 1,
// estimate-only) commission summary. Automated payouts, self-serve
// provisioning, and a partner-facing portal are Phase 2+.
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  Handshake, Plus, X, Save, Building2, MapPin, ShieldCheck,
  Ban, CheckCircle2, Clock, DollarSign, ChevronRight, Users,
  PlayCircle, Inbox, Target, UserPlus, Mail, Wallet, Palette,
} from 'lucide-react';
import {
  useResellers, useReseller, useCreateReseller, useUpdateResellerStatus,
  useProvisionInstitution, useCommissionSummary,
  useRunCommissionBatch, useCommissionLedger,
  useProvisioningQueue, useReviewProvisioningRequest,
  useDeals, useConvertDeal, useRejectDeal,
  useCreatePortalUser, usePortalUsers,
  useMdfSummary, useSetMdfBudget, useMdfClaims, useReviewMdfClaim, usePayMdfClaim,
  useSetBranding,
} from '../../hooks/useResellers';

// ── Local shared bits (kept local rather than importing from index.tsx,
// which doesn't export its Modal/Field/Input — avoids coupling this
// page to another tab's internals) ──────────────────────────────────
const Modal: React.FC<{
  title: string; subtitle?: string; onClose: () => void;
  size?: 'sm' | 'md' | 'lg' | 'xl'; footer?: React.ReactNode; children: React.ReactNode;
}> = ({ title, subtitle, onClose, size = 'lg', footer, children }) => {
  const w = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-2xl', xl: 'max-w-4xl' }[size];
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
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
const Sel: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ children, ...p }) => (
  <select {...p} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none text-gray-600">{children}</select>
);
const TextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (p) => (
  <textarea {...p} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs resize-none text-gray-700" />
);
type BtnProps = { onClick?: () => void; icon?: React.ReactNode; children: React.ReactNode; disabled?: boolean };
const BtnPrimary: React.FC<BtnProps> = ({ onClick, icon, children, disabled }) => (
  <button onClick={onClick} disabled={disabled}
    className="flex items-center gap-1.5 bg-[#1e3a5f] text-white hover:bg-[#16304f] transition-colors text-xs px-5 py-2.5 rounded-lg font-medium disabled:opacity-50">
    {icon}{children}
  </button>
);
const BtnSecondary: React.FC<BtnProps> = ({ onClick, children }) => (
  <button onClick={onClick} className="flex items-center gap-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs px-5 py-2.5 rounded-lg font-medium">
    {children}
  </button>
);

// ── Tier / status config ─────────────────────────────────────────
const TIER_CONFIG: Record<string, { label: string; color: string; track: 'A' | 'B' }> = {
  certified_partner: { label: 'Certified Partner', color: 'bg-gray-100 text-gray-700', track: 'A' },
  regional_partner: { label: 'Regional Partner', color: 'bg-amber-100 text-amber-700', track: 'A' },
  master_distributor: { label: 'Master Distributor', color: 'bg-emerald-100 text-emerald-700', track: 'B' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  active: { label: 'Active', color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  suspended: { label: 'Suspended', color: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
  terminated: { label: 'Terminated', color: 'bg-gray-100 text-gray-500', dot: 'bg-gray-400' },
};

const TierBadge: React.FC<{ tier: string }> = ({ tier }) => {
  const cfg = TIER_CONFIG[tier];
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg?.color}`}>{cfg?.label || tier}</span>;
};
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg?.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg?.dot}`} />{cfg?.label || status}
    </span>
  );
};

// ── Create Partner modal ─────────────────────────────────────────
const CreatePartnerModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const create = useCreateReseller();
  const [form, setForm] = useState({
    name: '', tier: 'certified_partner',
    territoryCountry: '', territoryRegion: '', territoryExclusive: false,
    contactName: '', contactEmail: '', contactPhone: '',
    notes: '',
  });
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const submit = () => {
    if (!form.name || !form.contactEmail) return;
    create.mutate({
      name: form.name,
      tier: form.tier,
      territoryCountry: form.territoryCountry,
      territoryRegion: form.territoryRegion,
      territoryExclusive: form.territoryExclusive,
      primaryContact: { name: form.contactName, email: form.contactEmail, phone: form.contactPhone },
      notes: form.notes,
    }, { onSuccess: onClose });
  };

  return (
    <Modal title="Add Reseller Application" subtitle="Stage 1 of the lifecycle: apply & vet" onClose={onClose} size="lg"
      footer={<>
        <BtnSecondary onClick={onClose}>Cancel</BtnSecondary>
        <BtnPrimary icon={<Save size={12} />} onClick={submit} disabled={create.isPending}>
          {create.isPending ? 'Saving…' : 'Save as Pending'}
        </BtnPrimary>
      </>}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Company / Partner Name" required>
            <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Gulf Education Partners" />
          </Field>
          <Field label="Requested Tier" required>
            <Sel value={form.tier} onChange={e => set('tier', e.target.value)}>
              {Object.entries(TIER_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </Sel>
          </Field>
          <Field label="Territory — Country"><Input value={form.territoryCountry} onChange={e => set('territoryCountry', e.target.value)} placeholder="e.g. UAE" /></Field>
          <Field label="Territory — Region / City"><Input value={form.territoryRegion} onChange={e => set('territoryRegion', e.target.value)} placeholder="e.g. Dubai" /></Field>
        </div>
        <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
          <input type="checkbox" className="rounded" checked={form.territoryExclusive} onChange={e => set('territoryExclusive', e.target.checked)} />
          Requesting territory exclusivity (only meaningful for Master Distributor)
        </label>
        <p className="text-[10px] font-bold text-gray-400 uppercase">Primary Contact</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="Name" required><Input value={form.contactName} onChange={e => set('contactName', e.target.value)} /></Field>
          <Field label="Email" required><Input type="email" value={form.contactEmail} onChange={e => set('contactEmail', e.target.value)} /></Field>
          <Field label="Phone"><Input value={form.contactPhone} onChange={e => set('contactPhone', e.target.value)} /></Field>
        </div>
        <Field label="Notes"><TextArea rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Existing customer base, sector experience…" /></Field>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
          Saved as <strong>Pending</strong>. Approve the partner from their profile once the agreement is signed and certification is complete — that's what unlocks provisioning.
        </div>
      </div>
    </Modal>
  );
};

// ── Provision Institution modal ──────────────────────────────────
const ProvisionInstitutionModal: React.FC<{ resellerId: string; resellerName: string; onClose: () => void }> = ({ resellerId, resellerName, onClose }) => {
  const provision = useProvisionInstitution();
  const [form, setForm] = useState({ name: '', slug: '', city: '', country: 'Pakistan', contactName: '', contactEmail: '', contactPhone: '' });
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const submit = () => {
    if (!form.name || !form.slug) return;
    provision.mutate({
      id: resellerId,
      data: {
        name: form.name, slug: form.slug, city: form.city, country: form.country,
        primaryContact: { name: form.contactName, email: form.contactEmail, phone: form.contactPhone },
      },
    }, { onSuccess: onClose });
  };

  return (
    <Modal title="Provision Institution" subtitle={`Under ${resellerName}`} onClose={onClose} size="lg"
      footer={<>
        <BtnSecondary onClick={onClose}>Cancel</BtnSecondary>
        <BtnPrimary icon={<Building2 size={12} />} onClick={submit} disabled={provision.isPending}>
          {provision.isPending ? 'Creating…' : 'Create & Tag to Partner'}
        </BtnPrimary>
      </>}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Institution Name" required><Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Al-Noor Islamic School" /></Field>
          <Field label="Slug (URL)" required><Input value={form.slug} onChange={e => set('slug', e.target.value)} placeholder="e.g. al-noor-school" /></Field>
          <Field label="City"><Input value={form.city} onChange={e => set('city', e.target.value)} /></Field>
          <Field label="Country"><Input value={form.country} onChange={e => set('country', e.target.value)} /></Field>
        </div>
        <p className="text-[10px] font-bold text-gray-400 uppercase">Primary Contact</p>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Name"><Input value={form.contactName} onChange={e => set('contactName', e.target.value)} /></Field>
          <Field label="Email"><Input type="email" value={form.contactEmail} onChange={e => set('contactEmail', e.target.value)} /></Field>
          <Field label="Phone"><Input value={form.contactPhone} onChange={e => set('contactPhone', e.target.value)} /></Field>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
          Phase 1: Super Admin provisions on the partner's behalf. This institution starts on Free Trial and is tagged to <strong>{resellerName}</strong> immediately — it will count toward their quota and commission.
        </div>
      </div>
    </Modal>
  );
};

// ── Reseller detail modal ────────────────────────────────────────
const ResellerDetailModal: React.FC<{ id: string; onClose: () => void; onProvision: () => void }> = ({ id, onClose, onProvision }) => {
  const { data, isLoading } = useReseller(id);
  const { data: commission } = useCommissionSummary(id);
  const { data: ledger } = useCommissionLedger(id, { limit: 10 });
  const { data: portalUsers } = usePortalUsers(id);
  const { data: mdfSummary } = useMdfSummary(id);
  const updateStatus = useUpdateResellerStatus();
  const createPortalUser = useCreatePortalUser();
  const setMdfBudget = useSetMdfBudget();
  const setBranding = useSetBranding();
  const [reason, setReason] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', name: '' });
  const [mdfForm, setMdfForm] = useState({ amount: '', fiscalYear: String(new Date().getFullYear()) });
  const [brandingForm, setBrandingForm] = useState({ logoUrl: '', accentColor: '' });
  const [brandingLoaded, setBrandingLoaded] = useState(false);

  // Every hook must run on every render regardless of loading state — the
  // early return below happens AFTER this, never before it, or React throws
  // "Rendered more hooks than during the previous render" once `data`
  // resolves and a render stops early-returning.
  useEffect(() => {
    if (!brandingLoaded && data?.reseller?.branding) {
      setBrandingForm({ logoUrl: data.reseller.branding.logoUrl || '', accentColor: data.reseller.branding.accentColor || '' });
      setBrandingLoaded(true);
    }
  }, [data, brandingLoaded]);

  if (isLoading || !data) {
    return (
      <Modal title="Loading…" onClose={onClose} size="lg">
        <div className="h-40 flex items-center justify-center text-xs text-gray-400">Loading partner…</div>
      </Modal>
    );
  }

  const { reseller, institutions, quota, summary } = data;
  const tierCfg = TIER_CONFIG[reseller.tier];
  const phase3Eligible = reseller.tier === 'regional_partner' || reseller.tier === 'master_distributor';

  return (
    <Modal title={reseller.name} subtitle={`${reseller.territoryRegion || ''}${reseller.territoryRegion && reseller.territoryCountry ? ', ' : ''}${reseller.territoryCountry || ''}`} onClose={onClose} size="xl"
      footer={<>
        {reseller.status === 'pending' && (
          <BtnPrimary icon={<CheckCircle2 size={12} />} onClick={() => updateStatus.mutate({ id, data: { status: 'active' } })}>
            Approve & Activate
          </BtnPrimary>
        )}
        {reseller.status === 'active' && (
          <BtnSecondary onClick={() => updateStatus.mutate({ id, data: { status: 'suspended', reason } })}>
            <Ban size={12} className="text-red-500" /> Suspend
          </BtnSecondary>
        )}
        {reseller.status === 'suspended' && (
          <BtnPrimary icon={<CheckCircle2 size={12} />} onClick={() => updateStatus.mutate({ id, data: { status: 'active' } })}>
            Reactivate
          </BtnPrimary>
        )}
        {reseller.status === 'active' && (
          <BtnPrimary icon={<Building2 size={12} />} onClick={onProvision}>Provision Institution</BtnPrimary>
        )}
      </>}>
      <div className="space-y-5">
        <div className="flex items-center gap-2 flex-wrap">
          <TierBadge tier={reseller.tier} />
          <StatusBadge status={reseller.status} />
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">Track {reseller.track}</span>
          {reseller.territoryExclusive && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">Exclusive territory</span>}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-[10px] text-gray-400 uppercase font-semibold">Institutions</p>
            <p className="text-lg font-bold text-gray-800">{summary.institutionsActive} <span className="text-xs text-gray-400 font-normal">/ {summary.institutionsTotal}</span></p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-[10px] text-gray-400 uppercase font-semibold">Revenue attributed</p>
            <p className="text-lg font-bold text-gray-800">PKR {summary.monthlyRevenueAttributed.toLocaleString()}<span className="text-xs text-gray-400 font-normal">/mo</span></p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-[10px] text-gray-400 uppercase font-semibold">Rate</p>
            <p className="text-lg font-bold text-gray-800">
              {reseller.track === 'A' ? `${reseller.commissionRateYear1}%` : `${reseller.wholesaleDiscount}% off`}
            </p>
          </div>
          <div className={`rounded-xl p-3 ${quota.met ? 'bg-emerald-50' : 'bg-amber-50'}`}>
            <p className="text-[10px] text-gray-400 uppercase font-semibold">Quota ({quota.windowMonths}mo)</p>
            <p className={`text-lg font-bold ${quota.met ? 'text-emerald-700' : 'text-amber-700'}`}>
              {quota.liveWithinWindow}{quota.required > 0 ? ` / ${quota.required}` : ''}
            </p>
          </div>
        </div>

        {commission && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 flex items-start gap-2">
            <DollarSign size={14} className="flex-shrink-0 mt-0.5" />
            <div>
              <p><strong>Estimated monthly commission: PKR {commission.estimatedMonthlyCommission.toLocaleString()}</strong></p>
              <p className="text-[11px] mt-0.5 opacity-80">{commission.note}</p>
            </div>
          </div>
        )}

        {ledger && ledger.data.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-2">Posted commission ledger (most recent)</p>
            <div className="border border-gray-100 rounded-xl overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 border-b border-gray-100">
                    <th className="py-2 px-3 text-left font-semibold">Period</th>
                    <th className="py-2 px-3 text-left font-semibold">Institution</th>
                    <th className="py-2 px-3 text-right font-semibold">Revenue</th>
                    <th className="py-2 px-3 text-right font-semibold">Rate</th>
                    <th className="py-2 px-3 text-right font-semibold">Posted</th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.data.map((p: any) => (
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
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-700">Partner Portal logins</p>
            {reseller.status === 'active' && (
              <button onClick={() => setShowInvite(true)} className="flex items-center gap-1 text-[11px] font-medium text-[#1e3a5f] hover:underline">
                <UserPlus size={12} /> Invite partner login
              </button>
            )}
          </div>
          {!portalUsers || portalUsers.length === 0 ? (
            <div className="text-xs text-gray-400 bg-gray-50 rounded-xl p-3 text-center">No Reseller Portal logins created yet.</div>
          ) : (
            <div className="space-y-1.5">
              {portalUsers.map((u: any) => (
                <div key={u._id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-xs">
                  <span className="flex items-center gap-1.5 text-gray-700"><Mail size={11} className="text-gray-400" /> {u.email}</span>
                  <span className="text-[10px] text-gray-400 capitalize">{u.primaryRole?.replace('_', ' ')}{u.lastLoginAt ? ` · last login ${new Date(u.lastLoginAt).toLocaleDateString()}` : ' · never logged in'}</span>
                </div>
              ))}
            </div>
          )}
          {showInvite && (
            <div className="mt-2 bg-blue-50 border border-blue-200 rounded-xl p-3 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Field label="Email" required><Input type="email" value={inviteForm.email} onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))} /></Field>
                <Field label="Name"><Input value={inviteForm.name} onChange={e => setInviteForm(f => ({ ...f, name: e.target.value }))} /></Field>
              </div>
              <div className="flex justify-end gap-2">
                <BtnSecondary onClick={() => setShowInvite(false)}>Cancel</BtnSecondary>
                <BtnPrimary
                  icon={<UserPlus size={12} />}
                  disabled={!inviteForm.email || createPortalUser.isPending}
                  onClick={() => createPortalUser.mutate({ id, data: inviteForm }, { onSuccess: () => { setShowInvite(false); setInviteForm({ email: '', name: '' }); } })}
                >
                  {createPortalUser.isPending ? 'Sending invite…' : 'Send invite'}
                </BtnPrimary>
              </div>
            </div>
          )}
        </div>

        {reseller.status === 'active' && !quota.met && quota.required > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700 flex items-center gap-2">
            <Clock size={13} /> Below quota to hold {tierCfg?.label} — {quota.liveWithinWindow} of {quota.required} institutions live in the trailing {quota.windowMonths} months.
          </div>
        )}

        {phase3Eligible && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-3 space-y-2">
              <p className="text-xs font-semibold text-gray-700 flex items-center gap-1.5"><Wallet size={13} /> MDF Budget ({mdfSummary?.fiscalYear || new Date().getFullYear()})</p>
              {mdfSummary && (
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div><p className="text-[10px] text-gray-400 uppercase">Allocated</p><p className="text-sm font-bold text-gray-800">{mdfSummary.allocated.toLocaleString()}</p></div>
                  <div><p className="text-[10px] text-gray-400 uppercase">Committed</p><p className="text-sm font-bold text-gray-800">{mdfSummary.committed.toLocaleString()}</p></div>
                  <div><p className="text-[10px] text-gray-400 uppercase">Remaining</p><p className="text-sm font-bold text-emerald-700">{mdfSummary.remaining.toLocaleString()}</p></div>
                </div>
              )}
              <div className="flex gap-2 items-end">
                <div className="flex-1"><Field label="Budget"><Input type="number" value={mdfForm.amount} onChange={e => setMdfForm(f => ({ ...f, amount: e.target.value }))} placeholder="0" /></Field></div>
                <div className="w-20"><Field label="Year"><Input type="number" value={mdfForm.fiscalYear} onChange={e => setMdfForm(f => ({ ...f, fiscalYear: e.target.value }))} /></Field></div>
                <BtnSecondary
                  disabled={!mdfForm.amount || setMdfBudget.isPending}
                  onClick={() => setMdfBudget.mutate({ id, amount: Number(mdfForm.amount), fiscalYear: Number(mdfForm.fiscalYear) }, { onSuccess: () => setMdfForm({ amount: '', fiscalYear: mdfForm.fiscalYear }) })}
                >
                  Set
                </BtnSecondary>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 space-y-2">
              <p className="text-xs font-semibold text-gray-700 flex items-center gap-1.5"><Palette size={13} /> Branding</p>
              <Field label="Logo URL"><Input value={brandingForm.logoUrl} onChange={e => setBrandingForm(f => ({ ...f, logoUrl: e.target.value }))} placeholder="https://…" /></Field>
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Field label="Accent Colour">
                    <div className="flex items-center gap-2">
                      <input type="color" value={brandingForm.accentColor || '#1e3a5f'} onChange={e => setBrandingForm(f => ({ ...f, accentColor: e.target.value }))} className="h-8 w-10 rounded border border-gray-200" />
                      <Input value={brandingForm.accentColor} onChange={e => setBrandingForm(f => ({ ...f, accentColor: e.target.value }))} placeholder="#1e3a5f" />
                    </div>
                  </Field>
                </div>
                <BtnSecondary
                  disabled={setBranding.isPending}
                  onClick={() => setBranding.mutate({ id, data: brandingForm })}
                >
                  Save
                </BtnSecondary>
              </div>
              <p className="text-[10px] text-gray-400">Shown in this partner's own Reseller Portal — a Regional Partner+ benefit, not visible to institutions.</p>
            </div>
          </div>
        )}

        <div>
          <p className="text-xs font-semibold text-gray-700 mb-2">Institutions under this partner</p>
          {institutions.length === 0 ? (
            <div className="text-xs text-gray-400 bg-gray-50 rounded-xl p-4 text-center">No institutions provisioned yet.</div>
          ) : (
            <div className="border border-gray-100 rounded-xl overflow-x-auto">
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
                      <td className="py-2 px-3"><StatusBadge status={inst.status} /></td>
                      <td className="py-2 px-3 capitalize text-gray-600">{inst.plan?.replace('_', ' ')}</td>
                      <td className="py-2 px-3 text-right text-gray-700 font-medium">{inst.monthlyRevenue ? `PKR ${inst.monthlyRevenue.toLocaleString()}` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {reseller.status === 'active' && (
          <Field label="Suspension reason (used if you suspend below)">
            <Input value={reason} onChange={e => setReason(e.target.value)} placeholder="Optional — payment overdue, agreement breach…" />
          </Field>
        )}
      </div>
    </Modal>
  );
};

// ── Provisioning Queue (Phase 2) ─────────────────────────────────
const ProvisioningQueueTab: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState('pending_review');
  const { data, isLoading } = useProvisioningQueue({ limit: 100, status: statusFilter || undefined });
  const review = useReviewProvisioningRequest();
  const requests = data?.data || [];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2"><Inbox size={16} className="text-[#1e3a5f]" /> Provisioning Queue</h2>
        <p className="text-xs text-gray-400">Self-serve institution requests from partners — Regional/Master-tier certified partners auto-approve; everyone else lands here.</p>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['pending_review', 'approved', 'rejected', ''].map(f => (
          <button key={f || 'all'} onClick={() => setStatusFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-lg border font-medium capitalize transition-all
              ${statusFilter === f ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]' : 'bg-white text-gray-600 border-gray-200'}`}>
            {(f || 'all').replace('_', ' ')}
          </button>
        ))}
      </div>
      {isLoading ? (
        <div className="h-32 bg-white rounded-xl border border-gray-100 animate-pulse" />
      ) : requests.length === 0 ? (
        <div className="text-center text-xs text-gray-400 bg-white rounded-xl border border-gray-100 p-12">Nothing here.</div>
      ) : (
        <div className="border border-gray-100 rounded-xl overflow-x-auto bg-white">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 text-gray-500 border-b border-gray-100">
                <th className="py-2 px-3 text-left font-semibold">Partner</th>
                <th className="py-2 px-3 text-left font-semibold">Institution requested</th>
                <th className="py-2 px-3 text-left font-semibold">Status</th>
                <th className="py-2 px-3 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r: any) => (
                <tr key={r._id} className="border-b border-gray-50">
                  <td className="py-2 px-3 text-gray-700 font-medium">{r.resellerName}</td>
                  <td className="py-2 px-3 text-gray-600">
                    {r.institution?.name} <span className="text-gray-400">({[r.institution?.city, r.institution?.country].filter(Boolean).join(', ') || 'no location'})</span>
                  </td>
                  <td className="py-2 px-3">
                    <StatusBadge status={r.status === 'pending_review' ? 'pending' : r.status === 'approved' ? 'active' : 'terminated'} />
                    {r.autoApproved && <span className="ml-1.5 text-[10px] text-emerald-600">auto</span>}
                  </td>
                  <td className="py-2 px-3 text-right">
                    {r.status === 'pending_review' && (
                      <div className="flex justify-end gap-2">
                        <button onClick={() => review.mutate({ id: r._id, data: { decision: 'rejected' } })}
                          className="text-[11px] font-medium text-red-600 hover:underline">Reject</button>
                        <button onClick={() => review.mutate({ id: r._id, data: { decision: 'approved' } })}
                          className="text-[11px] font-medium text-emerald-600 hover:underline">Approve</button>
                      </div>
                    )}
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

// ── Deal Registration (Phase 2) ──────────────────────────────────
const DealRegistryTab: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState('');
  const { data, isLoading } = useDeals({ limit: 100, status: statusFilter || undefined });
  const convertDeal = useConvertDeal();
  const rejectDeal = useRejectDeal();
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [institutionId, setInstitutionId] = useState('');
  const deals = data?.data || [];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2"><Target size={16} className="text-[#1e3a5f]" /> Deal Registry</h2>
        <p className="text-xs text-gray-400">Prospects partners have locked in — 90-day protection window, first-registered wins on conflict.</p>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['', 'registered', 'converted', 'expired', 'rejected'].map(f => (
          <button key={f || 'all'} onClick={() => setStatusFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-lg border font-medium capitalize transition-all
              ${statusFilter === f ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]' : 'bg-white text-gray-600 border-gray-200'}`}>
            {f || 'all'}
          </button>
        ))}
      </div>
      {isLoading ? (
        <div className="h-32 bg-white rounded-xl border border-gray-100 animate-pulse" />
      ) : deals.length === 0 ? (
        <div className="text-center text-xs text-gray-400 bg-white rounded-xl border border-gray-100 p-12">No deals registered yet.</div>
      ) : (
        <div className="border border-gray-100 rounded-xl overflow-x-auto bg-white">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 text-gray-500 border-b border-gray-100">
                <th className="py-2 px-3 text-left font-semibold">Partner</th>
                <th className="py-2 px-3 text-left font-semibold">Prospect</th>
                <th className="py-2 px-3 text-left font-semibold">Protected until</th>
                <th className="py-2 px-3 text-left font-semibold">Status</th>
                <th className="py-2 px-3 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {deals.map((d: any) => (
                <tr key={d._id} className="border-b border-gray-50">
                  <td className="py-2 px-3 text-gray-700 font-medium">{d.resellerName}</td>
                  <td className="py-2 px-3 text-gray-600">{d.prospectName} <span className="text-gray-400">({d.contactEmail || 'no contact'})</span></td>
                  <td className="py-2 px-3 text-gray-500">{new Date(d.protectionExpiresAt).toLocaleDateString()}</td>
                  <td className="py-2 px-3 capitalize text-gray-600">{d.status}</td>
                  <td className="py-2 px-3 text-right">
                    {d.status === 'registered' && (
                      convertingId === d._id ? (
                        <div className="flex justify-end gap-1.5 items-center">
                          <input value={institutionId} onChange={e => setInstitutionId(e.target.value)} placeholder="Institution ID"
                            className="border border-gray-200 rounded-lg px-2 py-1 text-[11px] w-32" />
                          <button disabled={!institutionId || convertDeal.isPending}
                            onClick={() => convertDeal.mutate({ id: d._id, institutionId }, { onSuccess: () => { setConvertingId(null); setInstitutionId(''); } })}
                            className="text-[11px] font-medium text-emerald-600 hover:underline disabled:opacity-40">Confirm</button>
                          <button onClick={() => setConvertingId(null)} className="text-[11px] text-gray-400 hover:underline">Cancel</button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <button onClick={() => rejectDeal.mutate({ id: d._id })} className="text-[11px] font-medium text-red-600 hover:underline">Reject</button>
                          <button onClick={() => setConvertingId(d._id)} className="text-[11px] font-medium text-emerald-600 hover:underline">Convert…</button>
                        </div>
                      )
                    )}
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

// ── MDF Claims Queue (Phase 3) ────────────────────────────────────
const PAY_METHODS = [
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cash', label: 'Cash' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'online', label: 'Online' },
];

const MdfClaimsQueueTab: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState('pending_review');
  const { data, isLoading } = useMdfClaims({ limit: 100, status: statusFilter || undefined });
  const review = useReviewMdfClaim();
  const pay = usePayMdfClaim();
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payForm, setPayForm] = useState({ paymentMethod: 'bank_transfer', bankAccountId: '', referenceNumber: '' });
  const claims = data?.data || [];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2"><Wallet size={16} className="text-[#1e3a5f]" /> MDF Claims</h2>
        <p className="text-xs text-gray-400">Marketing Development Fund claims from Regional Partner+ partners, against their allocated budget.</p>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['pending_review', 'approved', 'paid', 'rejected', ''].map(f => (
          <button key={f || 'all'} onClick={() => setStatusFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-lg border font-medium capitalize transition-all
              ${statusFilter === f ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]' : 'bg-white text-gray-600 border-gray-200'}`}>
            {(f || 'all').replace('_', ' ')}
          </button>
        ))}
      </div>
      {isLoading ? (
        <div className="h-32 bg-white rounded-xl border border-gray-100 animate-pulse" />
      ) : claims.length === 0 ? (
        <div className="text-center text-xs text-gray-400 bg-white rounded-xl border border-gray-100 p-12">No MDF claims yet.</div>
      ) : (
        <div className="border border-gray-100 rounded-xl overflow-x-auto bg-white">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 text-gray-500 border-b border-gray-100">
                <th className="py-2 px-3 text-left font-semibold">Partner</th>
                <th className="py-2 px-3 text-left font-semibold">Activity</th>
                <th className="py-2 px-3 text-right font-semibold">Requested</th>
                <th className="py-2 px-3 text-left font-semibold">Status</th>
                <th className="py-2 px-3 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {claims.map((c: any) => (
                <tr key={c._id} className="border-b border-gray-50">
                  <td className="py-2 px-3 text-gray-700 font-medium">{c.resellerName}</td>
                  <td className="py-2 px-3 text-gray-600 capitalize">{c.activityType?.replace('_', ' ')} <span className="text-gray-400">— {c.description}</span></td>
                  <td className="py-2 px-3 text-right text-gray-600">{c.amountRequested?.toLocaleString()}</td>
                  <td className="py-2 px-3 capitalize text-gray-600">{c.status.replace('_', ' ')}</td>
                  <td className="py-2 px-3 text-right">
                    {c.status === 'pending_review' && (
                      <div className="flex justify-end gap-2">
                        <button onClick={() => review.mutate({ id: c._id, data: { decision: 'rejected' } })} className="text-[11px] font-medium text-red-600 hover:underline">Reject</button>
                        <button onClick={() => review.mutate({ id: c._id, data: { decision: 'approved' } })} className="text-[11px] font-medium text-emerald-600 hover:underline">Approve</button>
                      </div>
                    )}
                    {c.status === 'approved' && (
                      payingId === c._id ? (
                        <div className="flex justify-end gap-1.5 items-center">
                          <select value={payForm.paymentMethod} onChange={e => setPayForm(f => ({ ...f, paymentMethod: e.target.value }))} className="border border-gray-200 rounded-lg px-1.5 py-1 text-[11px]">
                            {PAY_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                          </select>
                          {payForm.paymentMethod !== 'cash' && (
                            <input value={payForm.bankAccountId} onChange={e => setPayForm(f => ({ ...f, bankAccountId: e.target.value }))} placeholder="Bank account ID"
                              className="border border-gray-200 rounded-lg px-2 py-1 text-[11px] w-28" />
                          )}
                          <button disabled={pay.isPending || (payForm.paymentMethod !== 'cash' && !payForm.bankAccountId)}
                            onClick={() => pay.mutate({ id: c._id, data: payForm }, { onSuccess: () => setPayingId(null) })}
                            className="text-[11px] font-medium text-emerald-600 hover:underline disabled:opacity-40">Confirm</button>
                          <button onClick={() => setPayingId(null)} className="text-[11px] text-gray-400 hover:underline">Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => setPayingId(c._id)} className="text-[11px] font-medium text-emerald-600 hover:underline">Pay…</button>
                      )
                    )}
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

// ── Main tab ──────────────────────────────────────────────────────
const SUB_TABS = [
  { key: 'partners', label: 'Partners', icon: <Handshake size={13} /> },
  { key: 'provisioning', label: 'Provisioning Queue', icon: <Inbox size={13} /> },
  { key: 'deals', label: 'Deal Registry', icon: <Target size={13} /> },
  { key: 'mdf', label: 'MDF Claims', icon: <Wallet size={13} /> },
];

export const PartnerDirectoryTab: React.FC = () => {
  const [subTab, setSubTab] = useState<'partners' | 'provisioning' | 'deals' | 'mdf'>('partners');
  const runBatch = useRunCommissionBatch();
  const [lastBatchResult, setLastBatchResult] = useState<any>(null);

  const [statusFilter, setStatusFilter] = useState('all');
  const { data, isLoading } = useResellers({ limit: 100, status: statusFilter === 'all' ? undefined : statusFilter });
  const resellers = data?.data || [];

  const [showCreate, setShowCreate] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [provisionFor, setProvisionFor] = useState<{ id: string; name: string } | null>(null);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 overflow-x-auto max-w-full">
          {SUB_TABS.map(t => (
            <button key={t.key} onClick={() => setSubTab(t.key as any)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md font-medium transition-all
                ${subTab === t.key ? 'bg-white text-[#1e3a5f] shadow-sm' : 'text-gray-500'}`}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => runBatch.mutate(undefined, { onSuccess: setLastBatchResult })}
            disabled={runBatch.isPending}
            className="flex items-center gap-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs px-4 py-2 rounded-lg font-medium disabled:opacity-50"
          >
            <PlayCircle size={13} /> {runBatch.isPending ? 'Posting commission…' : 'Run Commission Batch'}
          </button>
        </div>
      </div>

      {lastBatchResult && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700 flex items-center justify-between">
          <span>
            Commission batch for <strong>{lastBatchResult.periodMonth}</strong>: {lastBatchResult.succeeded} posted,
            {' '}{lastBatchResult.skipped} skipped (already posted / no revenue), {lastBatchResult.failed} failed.
          </span>
          <button onClick={() => setLastBatchResult(null)}><X size={13} /></button>
        </div>
      )}

      {subTab === 'provisioning' && <ProvisioningQueueTab />}
      {subTab === 'deals' && <DealRegistryTab />}
      {subTab === 'mdf' && <MdfClaimsQueueTab />}
      {subTab === 'partners' && (
      <>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400">Reseller applications, tiers, territories, and the institutions attributed to each</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 bg-[#1e3a5f] text-white text-xs px-4 py-2 rounded-lg hover:bg-[#16304f] font-medium">
          <Plus size={13} /> Add Reseller
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {['all', 'pending', 'active', 'suspended', 'terminated'].map(f => (
          <button key={f} onClick={() => setStatusFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-lg border font-medium capitalize transition-all
              ${statusFilter === f ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]' : 'bg-white text-gray-600 border-gray-200'}`}>
            {f}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading && Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-40 bg-white rounded-xl border border-gray-100 animate-pulse" />
        ))}
        {!isLoading && resellers.length === 0 && (
          <div className="sm:col-span-2 lg:col-span-3 text-center text-xs text-gray-400 bg-white rounded-xl border border-gray-100 p-12">
            No partners yet. Add the first reseller application to get started.
          </div>
        )}
        {resellers.map((r: any) => {
          const tierCfg = TIER_CONFIG[r.tier];
          return (
            <button key={r._id} onClick={() => setDetailId(r._id)}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-left hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-sm truncate">{r.name}</p>
                  <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                    <MapPin size={10} /> {[r.territoryRegion, r.territoryCountry].filter(Boolean).join(', ') || 'No territory set'}
                  </p>
                </div>
                <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
              </div>
              <div className="flex items-center gap-1.5 flex-wrap mb-3">
                <TierBadge tier={r.tier} />
                <StatusBadge status={r.status} />
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-50 pt-2">
                <span className="flex items-center gap-1"><Users size={12} /> {r.institutionsActive}/{r.institutionsTotal} live</span>
                <span className="font-medium text-gray-700">
                  {tierCfg?.track === 'A' ? `${r.commissionRateYear1}%` : `${r.wholesaleDiscount}% wholesale`}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {showCreate && <CreatePartnerModal onClose={() => setShowCreate(false)} />}
      {detailId && (
        <ResellerDetailModal
          id={detailId}
          onClose={() => setDetailId(null)}
          onProvision={() => {
            const r = resellers.find((x: any) => x._id === detailId);
            if (r) setProvisionFor({ id: r._id, name: r.name });
          }}
        />
      )}
      {provisionFor && (
        <ProvisionInstitutionModal
          resellerId={provisionFor.id}
          resellerName={provisionFor.name}
          onClose={() => setProvisionFor(null)}
        />
      )}
      </>
      )}
    </div>
  );
};

export default PartnerDirectoryTab;
