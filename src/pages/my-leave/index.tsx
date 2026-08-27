import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { CalendarCheck2, Plus } from 'lucide-react';
import hrService from '../../services/hr.service';

// ─── Self-service "My Leave" page (leave:self permission) ─────────────────
// Reuses the existing Leave data model / HrService via the new narrowly
// scoped self endpoints (/hr/leave/self/*) — server resolves "my own" from
// the caller's Staff record, so no staff id is ever sent from here.

const WIC = 'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]';

function WF({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const BAL_TYPES = [
  { key: 'annual', label: 'Annual' },
  { key: 'sick', label: 'Sick' },
  { key: 'casual', label: 'Casual' },
  { key: 'maternity', label: 'Maternity' },
  { key: 'paternity', label: 'Paternity' },
  { key: 'hajj', label: 'Hajj' },
] as const;

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
  cancelled: 'bg-slate-100 text-slate-500 border-slate-200',
  on_hold: 'bg-blue-50 text-blue-700 border-blue-200',
};

function calcWorkingDays(from: string, to: string): number {
  if (!from || !to) return 0;
  let count = 0;
  const cur = new Date(from);
  const end = new Date(to);
  while (cur <= end) {
    const d = cur.getDay();
    if (d !== 0 && d !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

function ApplyForm({ onClose, onSuccess, balance }: { onClose: () => void; onSuccess: () => void; balance: any }) {
  const [form, setForm] = useState({
    leaveType: 'annual', fromDate: '', toDate: '',
    isHalfDay: false, halfDaySession: 'morning', reason: '',
  });

  const entitled: Record<string, number> = {
    annual: balance?.annual?.entitled ?? 21, sick: balance?.sick?.entitled ?? 10,
    casual: balance?.casual?.entitled ?? 10, maternity: balance?.maternity?.entitled ?? 90,
    paternity: balance?.paternity?.entitled ?? 10, hajj: balance?.hajj?.entitled ?? 0,
    emergency: 3, unpaid: 0, study: 5, other: 5,
  };
  const remaining: Record<string, number> = {
    annual: balance?.annual?.remaining ?? entitled.annual, sick: balance?.sick?.remaining ?? entitled.sick,
    casual: balance?.casual?.remaining ?? entitled.casual, maternity: balance?.maternity?.remaining ?? entitled.maternity,
    paternity: balance?.paternity?.remaining ?? entitled.paternity, hajj: balance?.hajj?.remaining ?? entitled.hajj,
  };
  const balancedTypes = ['annual', 'sick', 'casual', 'maternity', 'paternity', 'hajj'];
  const hasBalance = balancedTypes.includes(form.leaveType);
  const rem = remaining[form.leaveType] ?? 0;

  const workingDays = form.isHalfDay ? 0.5 : calcWorkingDays(form.fromDate, form.toDate);

  const qc = useQueryClient();
  const mut = useMutation({
    // No staffId/staffName/tenantId in this payload — those are resolved
    // server-side from the caller's own Staff record, never trusted from the client.
    mutationFn: () => hrService.createMyLeaveApplication({
      leaveType: form.leaveType,
      fromDate: form.fromDate, toDate: form.toDate,
      totalDays: workingDays,
      isHalfDay: form.isHalfDay, halfDaySession: form.halfDaySession,
      reason: form.reason,
    }),
    onSuccess: () => {
      toast.success('Leave application submitted');
      qc.invalidateQueries({ queryKey: ['my-leave-history'] });
      qc.invalidateQueries({ queryKey: ['my-leave-balance'] });
      onSuccess(); onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to submit leave application'),
  });

  const canSubmit = !!form.fromDate && !!form.toDate && form.reason.trim().length >= 10;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
      <div className="text-sm font-semibold text-[#0C447C] mb-4">Apply for Leave</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        <WF label="Leave Type" required>
          <select value={form.leaveType} onChange={e => setForm(prev => ({ ...prev, leaveType: e.target.value }))} className={WIC}>
            {[
              ['annual', `Annual (${entitled.annual}d entitled)`],
              ['sick', `Sick (${entitled.sick}d entitled)`],
              ['casual', `Casual (${entitled.casual}d entitled)`],
              ['maternity', `Maternity (${entitled.maternity}d entitled)`],
              ['paternity', `Paternity (${entitled.paternity}d entitled)`],
              ['hajj', `Hajj (${entitled.hajj}d entitled)`],
              ['emergency', 'Emergency'],
              ['unpaid', 'Unpaid'],
              ['study', 'Study'],
              ['other', 'Other'],
            ].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </WF>
        <WF label="From Date" required>
          <input type="date" value={form.fromDate} onChange={e => setForm(prev => ({ ...prev, fromDate: e.target.value }))} className={WIC} />
        </WF>
        <WF label="To Date" required>
          <input type="date" value={form.toDate} onChange={e => setForm(prev => ({ ...prev, toDate: e.target.value }))} className={WIC} />
        </WF>
      </div>

      {hasBalance && (
        <div className={`mb-3 text-xs px-3 py-2 rounded-lg font-medium ${rem > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
          {rem > 0 ? `You have ${rem} day(s) remaining for ${form.leaveType} leave` : `Insufficient balance — applying will result in unpaid leave.`}
        </div>
      )}

      <label className="flex items-center gap-2 text-xs text-slate-600 mb-3">
        <input type="checkbox" checked={form.isHalfDay} onChange={e => setForm(prev => ({ ...prev, isHalfDay: e.target.checked }))} />
        Half day
      </label>

      {form.isHalfDay && (
        <div className="mb-3 max-w-xs">
          <WF label="Session">
            <select value={form.halfDaySession} onChange={e => setForm(prev => ({ ...prev, halfDaySession: e.target.value }))} className={WIC}>
              <option value="morning">Morning</option>
              <option value="afternoon">Afternoon</option>
            </select>
          </WF>
        </div>
      )}

      <div className="mb-4">
        <WF label="Reason" required>
          <textarea
            value={form.reason}
            onChange={e => setForm(prev => ({ ...prev, reason: e.target.value }))}
            rows={3}
            placeholder="Briefly describe the reason for this leave request (min 10 characters)"
            className={WIC}
          />
        </WF>
      </div>

      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
        <button
          onClick={() => mut.mutate()}
          disabled={!canSubmit || mut.isPending}
          className="px-4 py-2 text-sm bg-[#0C447C] text-white rounded-lg hover:bg-[#0b3d6e] disabled:opacity-50"
        >
          {mut.isPending ? 'Submitting…' : 'Submit Request'}
        </button>
      </div>
    </div>
  );
}

export default function MyLeavePage() {
  const [showApplyForm, setShowApplyForm] = useState(false);

  const { data: balance, isLoading: balanceLoading } = useQuery({
    queryKey: ['my-leave-balance'],
    queryFn: hrService.getMyLeaveBalance,
  });

  const { data: history = [], isLoading: historyLoading } = useQuery({
    queryKey: ['my-leave-history'],
    queryFn: hrService.getMyLeaveHistory,
  });

  const bal: any = balance || {};
  const requests = (history as any[]) || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarCheck2 className="w-5 h-5 text-[#0C447C]" /> My Leave
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Your own leave balance, requests and history.</p>
        </div>
        <button
          onClick={() => setShowApplyForm(v => !v)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0C447C] text-white text-sm font-medium rounded-lg hover:bg-[#0b3d6e]"
        >
          <Plus className="w-4 h-4" /> Apply for Leave
        </button>
      </div>

      {/* Balance cards */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Leave Balance</div>
        {balanceLoading ? (
          <div className="text-xs text-slate-400 animate-pulse py-6 text-center">Loading balance…</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {BAL_TYPES.map(({ key, label }) => {
              const entry = bal[key] || { entitled: 0, used: 0, remaining: 0 };
              const pct = entry.entitled > 0 ? (entry.remaining / entry.entitled) * 100 : 0;
              const style = pct > 50 ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : pct > 20 ? 'bg-amber-50 border-amber-200 text-amber-700'
                : 'bg-red-50 border-red-200 text-red-700';
              return (
                <div key={key} className={`rounded-lg border p-3 text-center ${style}`}>
                  <div className="text-xs font-semibold text-slate-600 mb-1">{label}</div>
                  <div className="text-xl font-bold">{entry.remaining}</div>
                  <div className="text-xs opacity-70">{entry.used}/{entry.entitled} used</div>
                </div>
              );
            })}
          </div>
        )}
        {!balanceLoading && !bal.hasPolicy && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
            No leave policy has been formally assigned to you yet — showing default entitlements. Contact HR if this looks wrong.
          </div>
        )}
      </div>

      {showApplyForm && (
        <ApplyForm balance={bal} onClose={() => setShowApplyForm(false)} onSuccess={() => {}} />
      )}

      {/* History */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wide">
          My Leave Requests
        </div>
        {historyLoading ? (
          <div className="text-xs text-slate-400 animate-pulse py-10 text-center">Loading requests…</div>
        ) : requests.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-400">
            You haven't applied for any leave yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 uppercase tracking-wide border-b border-slate-100">
                  <th className="px-5 py-2.5 font-medium">Type</th>
                  <th className="px-5 py-2.5 font-medium">From</th>
                  <th className="px-5 py-2.5 font-medium">To</th>
                  <th className="px-5 py-2.5 font-medium">Days</th>
                  <th className="px-5 py-2.5 font-medium">Reason</th>
                  <th className="px-5 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r: any) => (
                  <tr key={r._id} className="border-b border-slate-50 last:border-0">
                    <td className="px-5 py-2.5 capitalize">{(r.leaveType || '').replace('_', ' ')}</td>
                    <td className="px-5 py-2.5">{r.fromDate ? new Date(r.fromDate).toLocaleDateString() : '—'}</td>
                    <td className="px-5 py-2.5">{r.toDate ? new Date(r.toDate).toLocaleDateString() : '—'}</td>
                    <td className="px-5 py-2.5">{r.totalDays ?? '—'}</td>
                    <td className="px-5 py-2.5 text-slate-500 max-w-xs truncate" title={r.reason}>{r.reason || '—'}</td>
                    <td className="px-5 py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs border capitalize ${STATUS_STYLE[r.status] || 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                        {r.status || 'pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
