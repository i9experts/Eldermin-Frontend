import React, { useState } from 'react';
import { Send, Clock, Rocket, Copy, Check } from 'lucide-react';
import { useLeads, useLeadStats, useUpdateLead, useAddLeadNote } from '../../hooks/useLeads';
import { useActivateInstitutionFromLead } from '../../hooks/useSuperAdmin';
import { Modal, Field, Sel, BtnPrimary, BtnSecondary } from './shared';

const STAGES = [
  { key: 'new', label: 'New', color: 'bg-blue-100 text-blue-700' },
  { key: 'contacted', label: 'Contacted', color: 'bg-indigo-100 text-indigo-700' },
  { key: 'demo_scheduled', label: 'Demo Scheduled', color: 'bg-purple-100 text-purple-700' },
  { key: 'trial', label: 'Trial', color: 'bg-amber-100 text-amber-700' },
  { key: 'converted', label: 'Converted', color: 'bg-emerald-100 text-emerald-700' },
  { key: 'lost', label: 'Lost', color: 'bg-gray-200 text-gray-600' },
];

const SOURCE_LABEL: Record<string, string> = {
  onboarding_wizard: 'Onboarding wizard',
  contact_form: 'Contact form',
  manual: 'Manual entry',
};

function StageBadge({ stage }: { stage: string }) {
  const s = STAGES.find(s => s.key === stage);
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${s?.color || 'bg-gray-100 text-gray-600'}`}>{s?.label || stage}</span>;
}

function LeadDetailModal({ lead, onClose }: { lead: any; onClose: () => void }) {
  const [note, setNote] = useState('');
  const [copied, setCopied] = useState(false);
  const updateLead = useUpdateLead();
  const addNote = useAddLeadNote();
  const activate = useActivateInstitutionFromLead();

  const alreadyActivated = !!lead.convertedInstitutionId;
  const result = activate.data;

  const copyCredentials = () => {
    if (!result) return;
    const text = `Eldermin login\nURL: ${result.loginUrl}\nEmail: ${result.adminEmail}\nTemporary password: ${result.tempPassword}\n\nPlease log in and change your password after your first sign-in.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal title={lead.schoolName} subtitle={`${lead.adminName} · ${lead.adminEmail}`} onClose={onClose} size="lg">
      <div className="space-y-5">
        {result && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs space-y-2">
            <p className="font-semibold text-emerald-700 flex items-center gap-1.5"><Rocket size={13} /> Institution activated — share these credentials once, they won't be shown again</p>
            <div className="bg-white rounded-lg p-3 font-mono text-[11px] space-y-1 text-gray-700">
              <p>URL: {result.loginUrl}</p>
              <p>Email: {result.adminEmail}</p>
              <p>Temporary password: <strong>{result.tempPassword}</strong></p>
            </div>
            <button onClick={copyCredentials} className="flex items-center gap-1.5 text-emerald-700 font-medium hover:text-emerald-800">
              {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? 'Copied' : 'Copy credentials'}
            </button>
          </div>
        )}

        {!result && alreadyActivated && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs">
            <p className="font-semibold text-emerald-700">This lead has already been activated as a live institution.</p>
          </div>
        )}

        {!result && !alreadyActivated && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-gray-700">Ready to bring this school on board?</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Creates a real, usable account — a tenant, and an admin login for {lead.adminEmail}.</p>
            </div>
            <BtnPrimary icon={<Rocket size={13} />} disabled={activate.isPending}
              onClick={() => activate.mutate(lead._id)}>
              {activate.isPending ? 'Activating…' : 'Activate Institution'}
            </BtnPrimary>
          </div>
        )}
        {activate.isError && (
          <p className="text-xs text-red-600">{(activate.error as any)?.response?.data?.message || 'Activation failed.'}</p>
        )}

        <div className="grid grid-cols-2 gap-3 text-xs">
          <Field label="Stage">
            <Sel value={lead.stage} onChange={(e) => updateLead.mutate({ id: lead._id, data: { stage: e.target.value } })}>
              {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </Sel>
          </Field>
          <Field label="Source"><p className="text-gray-600 pt-2">{SOURCE_LABEL[lead.source] || lead.source}</p></Field>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-2 gap-3 text-xs">
          <div><span className="text-gray-400">School type:</span> <strong className="text-gray-700">{lead.schoolType || '—'}</strong></div>
          <div><span className="text-gray-400">Location:</span> <strong className="text-gray-700">{[lead.city, lead.country].filter(Boolean).join(', ') || '—'}</strong></div>
          <div><span className="text-gray-400">Students:</span> <strong className="text-gray-700">{lead.studentCount || '—'}</strong></div>
          <div><span className="text-gray-400">Staff:</span> <strong className="text-gray-700">{lead.staffCount || '—'}</strong></div>
          <div><span className="text-gray-400">Plan requested:</span> <strong className="text-gray-700">{lead.planRequested || '—'}</strong></div>
          <div><span className="text-gray-400">Phone:</span> <strong className="text-gray-700">{lead.adminPhone || '—'}</strong></div>
        </div>

        {lead.modulesRequested?.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Modules requested</p>
            <div className="flex flex-wrap gap-1.5">
              {lead.modulesRequested.map((m: string) => (
                <span key={m} className="text-[10px] bg-navy-50 text-[#1e3a5f] px-2 py-1 rounded-lg border border-gray-200">{m}</span>
              ))}
            </div>
          </div>
        )}

        {lead.message && (
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Message</p>
            <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3">{lead.message}</p>
          </div>
        )}

        <div>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Notes</p>
          <div className="space-y-2 max-h-48 overflow-y-auto mb-3">
            {(lead.notes || []).length === 0 && <p className="text-xs text-gray-400">No notes yet.</p>}
            {(lead.notes || []).map((n: any, i: number) => (
              <div key={i} className="bg-gray-50 rounded-lg p-3 text-xs">
                <p className="text-gray-700">{n.text}</p>
                <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                  <Clock size={10} /> {n.authorName} · {new Date(n.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note..."
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20" />
            <BtnPrimary icon={<Send size={12} />} disabled={!note.trim() || addNote.isPending}
              onClick={() => { if (note.trim()) { addNote.mutate({ id: lead._id, text: note.trim() }); setNote(''); } }}>
              Add
            </BtnPrimary>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default function CRMTab() {
  const [filter, setFilter] = useState<string>('all');
  const [selected, setSelected] = useState<any>(null);
  const { data: leadsData, isLoading } = useLeads(filter === 'all' ? undefined : filter);
  const { data: stats } = useLeadStats();
  const leads = leadsData || [];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-gray-800">CRM — Leads Pipeline</h2>
        <p className="text-xs text-gray-400">Every onboarding wizard and contact form submission, trackable end to end</p>
      </div>

      <div className="grid grid-cols-6 gap-3">
        {STAGES.map(s => (
          <button key={s.key} onClick={() => setFilter(filter === s.key ? 'all' : s.key)}
            className={`bg-white rounded-xl border p-3 text-left transition-all ${filter === s.key ? 'border-[#1e3a5f] ring-1 ring-[#1e3a5f]' : 'border-gray-100 hover:border-gray-200'}`}>
            <p className="text-[10px] text-gray-400 font-semibold uppercase">{s.label}</p>
            <p className="text-xl font-bold text-gray-800 mt-1">{stats ? stats[s.key] ?? 0 : '—'}</p>
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <button onClick={() => setFilter('all')}
          className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${filter === 'all' ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]' : 'bg-white text-gray-600 border-gray-200'}`}>
          All Leads
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 text-gray-500 border-b border-gray-100">
              <th className="py-3 px-4 text-left font-semibold">School</th>
              <th className="py-3 px-4 text-left font-semibold">Contact</th>
              <th className="py-3 px-4 font-semibold">Source</th>
              <th className="py-3 px-4 font-semibold">Stage</th>
              <th className="py-3 px-4 font-semibold">Received</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && Array.from({ length: 4 }).map((_, i) => (
              <tr key={i} className="border-b border-gray-50"><td colSpan={5} className="py-3 px-4"><div className="animate-pulse h-4 bg-gray-100 rounded w-3/4" /></td></tr>
            ))}
            {!isLoading && leads.length === 0 && (
              <tr><td colSpan={5} className="py-12 text-center text-xs text-gray-400">No leads yet — submissions from the marketing site's onboarding wizard and contact form will appear here.</td></tr>
            )}
            {leads.map((lead: any) => (
              <tr key={lead._id} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer" onClick={() => setSelected(lead)}>
                <td className="py-3 px-4"><p className="font-medium text-gray-800">{lead.schoolName}</p><p className="text-[10px] text-gray-400">{lead.city || '—'}</p></td>
                <td className="py-3 px-4"><p className="text-gray-700">{lead.adminName}</p><p className="text-[10px] text-gray-400">{lead.adminEmail}</p></td>
                <td className="py-3 px-4 text-center text-[10px] text-gray-500">{SOURCE_LABEL[lead.source] || lead.source}</td>
                <td className="py-3 px-4 text-center"><StageBadge stage={lead.stage} /></td>
                <td className="py-3 px-4 text-center text-[10px] text-gray-400">{new Date(lead.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && <LeadDetailModal lead={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
