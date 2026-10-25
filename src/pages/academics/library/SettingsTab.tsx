import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Card, CardHeader, Btn, FormField, FInput, Modal } from './shared';
import { useLibrarySettings, useUpdateLibrarySettings } from './hooks';
import { AGE_BAND_COLORS, AGE_BAND_LABELS, AgeBandId } from './ageBand';
import { printZoneSign, ZONE_SIGN_SIZE_OPTIONS, ZoneSignSize } from './zoneSign';

const ZONE_COLOR_IDS = Object.keys(AGE_BAND_COLORS) as AgeBandId[];

interface LibraryZone {
  name: string;
  description?: string;
  urduLabel?: string | null;
  color?: AgeBandId | null;
}

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
  const [newZoneUrdu, setNewZoneUrdu] = useState('');
  const [newZoneColor, setNewZoneColor] = useState<AgeBandId | ''>('');
  const [printingZone, setPrintingZone] = useState<LibraryZone | null>(null);
  const mut = useUpdateLibrarySettings();

  useEffect(() => {
    if (settings) setForm({ ...DEFAULTS, zones: [], ...(settings as any) });
  }, [settings]);

  const zones: LibraryZone[] = form.zones ?? [];

  const addZone = () => {
    const name = newZone.trim();
    if (!name || zones.some(z => z.name.toLowerCase() === name.toLowerCase())) return;
    setForm((p: any) => ({
      ...p,
      zones: [...zones, { name, urduLabel: newZoneUrdu.trim() || null, color: newZoneColor || null }],
    }));
    setNewZone('');
    setNewZoneUrdu('');
    setNewZoneColor('');
  };

  const removeZone = (name: string) => {
    setForm((p: any) => ({ ...p, zones: zones.filter(z => z.name !== name) }));
  };

  const printZone = (size: ZoneSignSize) => {
    if (!printingZone) return;
    printZoneSign(printingZone, size);
    setPrintingZone(null);
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
              <div className="flex flex-wrap gap-2 mb-2 items-center">
                <FInput value={newZone} onChange={e => setNewZone(e.target.value)} placeholder="e.g. Non-fiction" onKeyDown={e => e.key === 'Enter' && addZone()} className="min-w-[160px] flex-1" />
                <FInput value={newZoneUrdu} onChange={e => setNewZoneUrdu(e.target.value)} placeholder="اردو میں (اختیاری)" dir="rtl" className="min-w-[140px] flex-1" />
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    title="No colour"
                    onClick={() => setNewZoneColor('')}
                    className={`w-5 h-5 rounded-full border-2 ${newZoneColor === '' ? 'border-slate-500' : 'border-transparent'} bg-white`}
                  />
                  {ZONE_COLOR_IDS.map(id => (
                    <button
                      key={id}
                      type="button"
                      title={AGE_BAND_LABELS[id]}
                      onClick={() => setNewZoneColor(id)}
                      className={`w-5 h-5 rounded-full border-2 ${newZoneColor === id ? 'border-slate-700' : 'border-transparent'}`}
                      style={{ background: AGE_BAND_COLORS[id] }}
                    />
                  ))}
                </div>
                <Btn variant="secondary" onClick={addZone} disabled={!newZone.trim()}>+ Add</Btn>
              </div>
              <p className="text-xs text-slate-400 mb-3">Optional: an Urdu label and an accent colour, both shown on the printable zone sign.</p>
              {zones.length === 0 ? (
                <div className="text-sm text-slate-400">No zones defined yet.</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {zones.map(z => (
                    <span key={z.name} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs">
                      {z.color && <span className="w-2 h-2 rounded-full" style={{ background: AGE_BAND_COLORS[z.color] }} />}
                      {z.name}
                      {z.urduLabel && <span dir="rtl" className="text-slate-400">· {z.urduLabel}</span>}
                      <button onClick={() => setPrintingZone(z)} title="Print zone sign" className="text-slate-400 hover:text-[#0C447C]">🖨</button>
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
      {printingZone && (
        <Modal title={`Print sign — ${printingZone.name}`} onClose={() => setPrintingZone(null)}>
          <p className="text-sm text-slate-500">
            Library rooms vary a lot in size — pick the paper size this zone's physical sign should print at.
          </p>
          <div className="grid grid-cols-1 gap-2">
            {ZONE_SIGN_SIZE_OPTIONS.map(opt => (
              <Btn key={opt.value} variant="secondary" onClick={() => printZone(opt.value)} className="justify-center">
                {opt.label}
              </Btn>
            ))}
          </div>
        </Modal>
      )}
    </Card>
  );
}
