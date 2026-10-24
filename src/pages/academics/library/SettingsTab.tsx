import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Card, CardHeader, Btn, FormField, FInput } from './shared';
import { useLibrarySettings, useUpdateLibrarySettings } from './hooks';

const DEFAULTS = {
  finePerDay: 5, gracePeriodDays: 0, maxFineCap: 0,
  maxBooksStudent: 3, maxBooksStaff: 5, maxRenewals: 2,
  renewalDays: 14, defaultLoanDays: 14,
};

const FIELDS: { key: keyof typeof DEFAULTS; label: string; hint?: string }[] = [
  { key: 'finePerDay', label: 'Fine per Day (PKR)', hint: 'Charged for each day a book is overdue' },
  { key: 'gracePeriodDays', label: 'Grace Period (days)', hint: 'Days after due date before fines start accruing' },
  { key: 'maxFineCap', label: 'Max Fine Cap (PKR)', hint: '0 = no cap' },
  { key: 'maxBooksStudent', label: 'Max Books per Student' },
  { key: 'maxBooksStaff', label: 'Max Books per Staff' },
  { key: 'maxRenewals', label: 'Max Renewals' },
  { key: 'renewalDays', label: 'Renewal Period (days)' },
  { key: 'defaultLoanDays', label: 'Default Loan Period (days)' },
];

export default function SettingsTab() {
  const { data: settings, isLoading } = useLibrarySettings();
  const [form, setForm] = useState<any>(DEFAULTS);
  const [newZone, setNewZone] = useState('');
  const mut = useUpdateLibrarySettings();

  useEffect(() => {
    if (settings) setForm({ ...DEFAULTS, zones: [], ...(settings as any) });
  }, [settings]);

  const zones: { name: string; description?: string }[] = form.zones ?? [];

  const addZone = () => {
    const name = newZone.trim();
    if (!name || zones.some(z => z.name.toLowerCase() === name.toLowerCase())) return;
    setForm((p: any) => ({ ...p, zones: [...zones, { name }] }));
    setNewZone('');
  };

  const removeZone = (name: string) => {
    setForm((p: any) => ({ ...p, zones: zones.filter(z => z.name !== name) }));
  };

  const submit = () => {
    mut.mutate(form, {
      onSuccess: () => toast.success('Library settings saved'),
      onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to save library settings'),
    });
  };

  return (
    <Card>
      <CardHeader title="Library Settings" subtitle="Fines, loan periods and per-borrower limits" />
      <div className="p-5">
        {isLoading ? (
          <div className="text-center text-slate-400 py-8">Loading…</div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {FIELDS.map(f => (
                <FormField key={f.key} label={f.label}>
                  <FInput
                    type="number"
                    min={0}
                    value={form[f.key] ?? 0}
                    onChange={e => setForm((prev: any) => ({ ...prev, [f.key]: Number(e.target.value) || 0 }))}
                  />
                  {f.hint && <div className="text-xs text-slate-400 mt-1">{f.hint}</div>}
                </FormField>
              ))}
            </div>
            <div className="mt-6 pt-5 border-t border-slate-100">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Library Zones</div>
              <p className="text-xs text-slate-400 mb-3">Named physical areas (e.g. Non-fiction, Islamic Books, Early Years) offered when cataloguing a book's Zone/Bay/Shelf location.</p>
              <div className="flex gap-2 mb-3">
                <FInput value={newZone} onChange={e => setNewZone(e.target.value)} placeholder="e.g. Non-fiction" onKeyDown={e => e.key === 'Enter' && addZone()} />
                <Btn variant="secondary" onClick={addZone} disabled={!newZone.trim()}>+ Add</Btn>
              </div>
              {zones.length === 0 ? (
                <div className="text-sm text-slate-400">No zones defined yet.</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {zones.map(z => (
                    <span key={z.name} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs">
                      {z.name}
                      <button onClick={() => removeZone(z.name)} className="text-slate-400 hover:text-red-500">✕</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-5">
              <Btn variant="primary" onClick={submit} disabled={mut.isPending}>{mut.isPending ? 'Saving…' : 'Save Settings'}</Btn>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
