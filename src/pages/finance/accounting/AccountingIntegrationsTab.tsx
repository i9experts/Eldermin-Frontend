import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  useQboConnection, useConnectQuickBooks, useDisconnectQuickBooks,
  useQboExternalAccounts, useInternalAccounts, useSaveAccountMappings,
  useSetAutoSync, useQboSyncLog, useSyncNow, useRetrySync,
} from './hooks';

const STATUS_CLS: Record<string, string> = {
  connected: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  disconnected: 'bg-slate-100 text-slate-500 border-slate-200',
  error: 'bg-red-50 text-red-700 border-red-200',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  failed: 'bg-red-50 text-red-700 border-red-200',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-medium capitalize ${STATUS_CLS[status] ?? 'bg-slate-100 text-slate-500 border-slate-200'}`}>
      {status}
    </span>
  );
}

function AccountMappingCard({ connectionId }: { connectionId: string }) {
  const { data: external, isLoading: loadingExternal } = useQboExternalAccounts(true);
  const { data: internal, isLoading: loadingInternal } = useInternalAccounts(true);
  const { data: connection } = useQboConnection();
  const saveMut = useSaveAccountMappings();

  const [draft, setDraft] = useState<Record<string, string>>({});

  useEffect(() => {
    const initial: Record<string, string> = {};
    ((connection as any)?.accountMappings ?? []).forEach((m: any) => { initial[m.accountCode] = m.externalAccountId; });
    setDraft(initial);
  }, [connection]);

  const internalAccounts = (internal as any[]) ?? [];
  const externalAccounts = (external as any[]) ?? [];

  const save = () => {
    const mappings = internalAccounts
      .filter((a: any) => draft[a.code])
      .map((a: any) => {
        const ext = externalAccounts.find((e: any) => e.id === draft[a.code]);
        return { accountCode: a.code, accountName: a.name, externalAccountId: draft[a.code], externalAccountName: ext?.name || draft[a.code] };
      });
    saveMut.mutate(mappings, {
      onSuccess: () => toast.success('Account mappings saved'),
      onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to save mappings'),
    });
  };

  if (loadingExternal || loadingInternal) {
    return <div className="text-center text-slate-400 py-8">Loading accounts…</div>;
  }

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div>
          <div className="font-semibold text-slate-800 text-sm">Account Mapping</div>
          <div className="text-xs text-slate-500 mt-0.5">Map each Eldermin ledger account to its QuickBooks account before entries can sync</div>
        </div>
        <button onClick={save} disabled={saveMut.isPending}
          className="px-4 py-2 text-xs bg-[#0C447C] text-white rounded-lg hover:bg-[#0b3d6e] font-medium disabled:opacity-50">
          {saveMut.isPending ? 'Saving…' : 'Save Mappings'}
        </button>
      </div>
      <div className="p-5 overflow-x-auto">
        {internalAccounts.length === 0 ? (
          <div className="text-sm text-slate-400 py-6 text-center">No chart of accounts found. Set up your Chart of Accounts in the Ledger tab first.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                <th className="py-2 pr-3">Eldermin Account</th>
                <th className="py-2">QuickBooks Account</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {internalAccounts.map((a: any) => (
                <tr key={a.code}>
                  <td className="py-2 pr-3 whitespace-nowrap"><span className="font-mono text-xs text-slate-400 mr-1.5">{a.code}</span>{a.name}</td>
                  <td className="py-2">
                    <select
                      value={draft[a.code] || ''}
                      onChange={(e) => setDraft((p) => ({ ...p, [a.code]: e.target.value }))}
                      className="w-full max-w-sm px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0C447C]"
                    >
                      <option value="">— Not mapped —</option>
                      {externalAccounts.map((e: any) => <option key={e.id} value={e.id}>{e.name} ({e.type})</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function SyncLogCard() {
  const { data: logs, isLoading } = useQboSyncLog(true);
  const retryMut = useRetrySync();
  const rows = (logs as any[]) ?? [];

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
      <div className="px-5 py-4 border-b border-slate-100">
        <div className="font-semibold text-slate-800 text-sm">Sync Log</div>
        <div className="text-xs text-slate-500 mt-0.5">Latest 100 journal entries synced (or attempted) to QuickBooks</div>
      </div>
      <div className="p-5 overflow-x-auto">
        {isLoading ? (
          <div className="text-center text-slate-400 py-8">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="text-sm text-slate-400 py-6 text-center">Nothing synced yet.</div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-left text-slate-400">
                <th className="py-1.5 pr-3">Entry No.</th>
                <th className="py-1.5 pr-3">Status</th>
                <th className="py-1.5 pr-3">Attempts</th>
                <th className="py-1.5 pr-3">Last Attempt</th>
                <th className="py-1.5 pr-3">Detail</th>
                <th className="py-1.5 pr-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rows.map((r: any) => (
                <tr key={r._id}>
                  <td className="py-1.5 pr-3 font-mono whitespace-nowrap">{r.entryNo}</td>
                  <td className="py-1.5 pr-3"><StatusBadge status={r.status} /></td>
                  <td className="py-1.5 pr-3">{r.attempts}</td>
                  <td className="py-1.5 pr-3 whitespace-nowrap">{r.lastAttemptAt ? new Date(r.lastAttemptAt).toLocaleString() : '—'}</td>
                  <td className="py-1.5 pr-3 text-slate-500 max-w-xs truncate" title={r.errorMessage || r.externalId}>
                    {r.status === 'failed' ? (r.errorMessage || '—') : (r.externalId || '—')}
                  </td>
                  <td className="py-1.5 pr-3">
                    {r.status === 'failed' && (
                      <button
                        onClick={() => retryMut.mutate(r._id, {
                          onSuccess: () => toast.success('Retried'),
                          onError: (e: any) => toast.error(e?.response?.data?.message || 'Retry failed'),
                        })}
                        disabled={retryMut.isPending}
                        className="text-[#0C447C] hover:underline font-medium"
                      >
                        Retry
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default function AccountingIntegrationsTab() {
  const { data: connection, isLoading } = useQboConnection();
  const connectMut = useConnectQuickBooks();
  const disconnectMut = useDisconnectQuickBooks();
  const autoSyncMut = useSetAutoSync();
  const syncNowMut = useSyncNow();

  const conn = connection as any;
  const isConnected = conn?.status === 'connected';

  const connect = () => {
    connectMut.mutate(undefined, {
      onSuccess: (res: any) => { window.location.href = res.url; },
      onError: (e: any) => toast.error(e?.response?.data?.message || 'Could not start QuickBooks connection'),
    });
  };

  if (isLoading) return <div className="text-center text-slate-400 py-12">Loading…</div>;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-wrap gap-2">
          <div>
            <div className="font-semibold text-slate-800 text-sm flex items-center gap-2">
              QuickBooks Online
              {conn?.status && <StatusBadge status={conn.status} />}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {isConnected
                ? `Connected${conn.connectedBy ? ` by ${conn.connectedBy}` : ''}${conn.connectedAt ? ` on ${new Date(conn.connectedAt).toLocaleDateString()}` : ''} — every posted journal entry (fee payments, expenses, payroll) syncs here automatically.`
                : 'Connect your QuickBooks Online company to automatically sync fee payments, expenses and payroll postings.'}
            </div>
          </div>
          {isConnected ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => syncNowMut.mutate(undefined, {
                  onSuccess: (res: any) => toast.success(`Synced ${res.synced}, ${res.failed} failed`),
                  onError: (e: any) => toast.error(e?.response?.data?.message || 'Sync failed'),
                })}
                disabled={syncNowMut.isPending}
                className="px-4 py-2 text-xs bg-[#0C447C] text-white rounded-lg hover:bg-[#0b3d6e] font-medium disabled:opacity-50"
              >
                {syncNowMut.isPending ? 'Syncing…' : '🔄 Sync Now'}
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Disconnect QuickBooks? Auto-sync will stop until reconnected.')) {
                    disconnectMut.mutate(undefined, { onSuccess: () => toast.success('Disconnected') });
                  }
                }}
                disabled={disconnectMut.isPending}
                className="px-4 py-2 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 font-medium disabled:opacity-50"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button onClick={connect} disabled={connectMut.isPending}
              className="px-4 py-2 text-xs bg-[#0C447C] text-white rounded-lg hover:bg-[#0b3d6e] font-medium disabled:opacity-50">
              {connectMut.isPending ? 'Redirecting…' : 'Connect QuickBooks'}
            </button>
          )}
        </div>
        {isConnected && (
          <div className="px-5 py-3 flex items-center justify-between flex-wrap gap-2">
            <label className="flex items-center gap-2 text-xs text-slate-600 font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={!!conn.autoSyncEnabled}
                onChange={(e) => autoSyncMut.mutate(e.target.checked, {
                  onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to update'),
                })}
                className="rounded border-slate-300"
              />
              Auto-sync every minute
            </label>
            <div className="text-xs text-slate-400">
              {conn.lastSyncedAt ? `Last synced ${new Date(conn.lastSyncedAt).toLocaleString()}` : 'Not synced yet'}
              {conn.lastError && <span className="text-red-500 ml-2">— {conn.lastError}</span>}
            </div>
          </div>
        )}
      </div>

      {isConnected && (
        <>
          <AccountMappingCard connectionId={conn._id} />
          <SyncLogCard />
        </>
      )}
    </div>
  );
}
