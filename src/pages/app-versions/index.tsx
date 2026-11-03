import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import type { AxiosError } from 'axios';
import { AlertTriangle, Pencil, Save, Smartphone } from 'lucide-react';
import * as api from '../../services/appVersions.api';
import type { AppVersionRow } from '../../services/appVersions.api';
import { BtnPrimary, BtnSecondary, Field, Input, Modal } from '../super-admin/shared';

const KEY = ['sa', 'appVersions'] as const;

const EditModal: React.FC<{ row: AppVersionRow; onClose: () => void }> = ({ row, onClose }) => {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    latestVersion: row.latestVersion,
    minVersion: row.minVersion,
    storeUrl: row.storeUrl,
    updateMessage: row.updateMessage ?? '',
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const save = useMutation({
    mutationFn: () => api.updateAppVersion(row.id, {
      latestVersion: form.latestVersion.trim(),
      minVersion: form.minVersion.trim(),
      storeUrl: form.storeUrl.trim(),
      updateMessage: form.updateMessage.trim() || null,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); toast.success('App version updated'); onClose(); },
    onError: (e: AxiosError<{ message?: string | string[] }>) => {
      const m = e.response?.data?.message;
      toast.error(Array.isArray(m) ? m.join(', ') : m || 'Failed to update app version');
    },
  });

  const handleSave = () => {
    const latest = form.latestVersion.trim(), min = form.minVersion.trim();
    if (!api.isSemver(latest)) { toast.error('Latest version must look like 1.0.8'); return; }
    if (!api.isSemver(min)) { toast.error('Min version must look like 1.0.8'); return; }
    if (api.compareSemver(min, latest) > 0) { toast.error('Min version cannot be greater than latest version'); return; }
    if (!/^https?:\/\/\S+$/.test(form.storeUrl.trim())) { toast.error('Store URL must be a valid http(s) link'); return; }
    save.mutate();
  };

  return (
    <Modal title="Edit App Version" subtitle={`${row.app} · ${row.platform}`} onClose={onClose} size="md"
      footer={<><BtnSecondary onClick={onClose}>Cancel</BtnSecondary><BtnPrimary icon={<Save size={12} />} onClick={handleSave} disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save Changes'}</BtnPrimary></>}>
      <div className="space-y-4">
        <Field label="Latest version" required htmlFor="av-latest">
          <Input id="av-latest" value={form.latestVersion} placeholder="1.0.8" onChange={e => set('latestVersion', e.target.value)} />
        </Field>
        <Field label="Min version" required htmlFor="av-min">
          <Input id="av-min" value={form.minVersion} placeholder="0.0.0" onChange={e => set('minVersion', e.target.value)} />
          <p className="flex items-start gap-1.5 text-[11px] text-red-600 mt-1.5">
            <AlertTriangle size={12} className="shrink-0 mt-0.5" />
            Users below this version will be FORCED to update. Only raise it after the new version is live on the store.
          </p>
        </Field>
        <Field label="Store URL" required htmlFor="av-url">
          <Input id="av-url" value={form.storeUrl} onChange={e => set('storeUrl', e.target.value)} />
        </Field>
        <Field label="Update message (optional)" htmlFor="av-msg">
          <textarea id="av-msg" rows={3} maxLength={500} value={form.updateMessage} onChange={e => set('updateMessage', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 text-gray-700" />
        </Field>
      </div>
    </Modal>
  );
};

export default function AppVersionsPage() {
  const [editing, setEditing] = useState<AppVersionRow | null>(null);
  const { data, isLoading, isError } = useQuery({ queryKey: KEY, queryFn: api.getAppVersions });

  return (
    <div className="p-3 sm:p-6 space-y-5">
      <div>
        <h2 className="text-base font-semibold text-gray-800">App Versions</h2>
        <p className="text-xs text-gray-400">Controls the "update available" / "force update" popups in the Parent and Teacher mobile apps</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
        {isLoading ? (
          <p className="text-sm text-gray-400 text-center py-10">Loading…</p>
        ) : isError ? (
          <p className="text-sm text-red-600 text-center py-10">Failed to load app versions</p>
        ) : !data?.length ? (
          <div className="flex flex-col items-center py-12 text-center">
            <Smartphone size={32} className="text-gray-300 mb-3" strokeWidth={1.5} />
            <p className="text-sm text-gray-500">No app versions found</p>
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100">
                {['App', 'Platform', 'Latest version', 'Min version', 'Store URL', 'Message', 'Updated at', ''].map(h => <th key={h} className="px-4 py-3">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {data.map(r => (
                <tr key={r.id} className="border-b border-gray-50 last:border-0 text-gray-700">
                  <td className="px-4 py-3 font-medium capitalize">{r.app}</td>
                  <td className="px-4 py-3 capitalize">{r.platform}</td>
                  <td className="px-4 py-3 font-mono">{r.latestVersion}</td>
                  <td className="px-4 py-3 font-mono">{r.minVersion}</td>
                  <td className="px-4 py-3 max-w-[220px] truncate"><a href={r.storeUrl} target="_blank" rel="noreferrer" className="text-[#1e3a5f] hover:underline" title={r.storeUrl}>{r.storeUrl}</a></td>
                  <td className="px-4 py-3 max-w-[200px] truncate" title={r.updateMessage ?? ''}>{r.updateMessage || <span className="text-gray-300">—</span>}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{r.updatedAt ? new Date(r.updatedAt).toLocaleString() : '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setEditing(r)} aria-label={`Edit ${r.app} ${r.platform}`} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"><Pencil size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editing && <EditModal row={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
