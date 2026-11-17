import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { CalendarClock, Plus } from 'lucide-react';
import hrService from '../../services/hr.service';

// ─── Self-service "My Attendance" page (attendance:self permission) ───────
// Lets a staff member (e.g. a Teacher whose biometric punch was missed or
// wrong) view their own attendance and submit a correction request — the
// request never changes the real attendance record itself; only an HR/admin
// reviewer's approval (via the admin Correction Requests screen) does that.
// Server resolves "my own" from the caller's Staff record, so no staff id
// is ever sent from here.

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

const STATUS_OPTIONS = [
  { value: 'present', label: 'Present' },
  { value: 'late', label: 'Late' },
  { value: 'half_day', label: 'Half Day' },
  { value: 'absent', label: 'Absent' },
  { value: 'on_leave', label: 'On Leave' },
  { value: 'sick_leave', label: 'Sick Leave' },
  { value: 'remote', label: 'Remote / Work From Home' },
  { value: 'extra_day', label: 'Extra Day' },
];
const STATUS_LABEL: Record<string, string> = Object.fromEntries(STATUS_OPTIONS.map(s => [s.value, s.label]));

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
};

function RequestCorrectionForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    attendanceDate: '', requestedStatus: 'present',
    requestedCheckInTime: '', requestedCheckOutTime: '', reason: '',
  });

  const qc = useQueryClient();
  const mut = useMutation({
    // No staffId/staffName/tenantId/status in this payload — those are
    // resolved/decided server-side; a correction request always starts pending.
    mutationFn: () => hrService.createMyAttendanceCorrectionRequest({
      attendanceDate: form.attendanceDate,
      requestedStatus: form.requestedStatus,
      requestedCheckInTime: form.requestedCheckInTime || undefined,
      requestedCheckOutTime: form.requestedCheckOutTime || undefined,
      reason: form.reason,
    }),
    onSuccess: () => {
      toast.success('Correction request submitted');
      qc.invalidateQueries({ queryKey: ['my-attendance-corrections'] });
      onSuccess(); onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to submit correction request'),
  });

  const canSubmit = !!form.attendanceDate && form.reason.trim().length >= 10;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
      <div className="text-sm font-semibold text-[#0C447C] mb-4">Request Attendance Correction</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        <WF label="Date" required>
          <input type="date" value={form.attendanceDate} onChange={e => setForm(prev => ({ ...prev, attendanceDate: e.target.value }))} className={WIC} />
        </WF>
        <WF label="What actually happened" required>
          <select value={form.requestedStatus} onChange={e => setForm(prev => ({ ...prev, requestedStatus: e.target.value }))} className={WIC}>
            {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </WF>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <WF label="Check-in time (if known)">
          <input type="time" value={form.requestedCheckInTime} onChange={e => setForm(prev => ({ ...prev, requestedCheckInTime: e.target.value }))} className={WIC} />
        </WF>
        <WF label="Check-out time (if known)">
          <input type="time" value={form.requestedCheckOutTime} onChange={e => setForm(prev => ({ ...prev, requestedCheckOutTime: e.target.value }))} className={WIC} />
        </WF>
      </div>
      <div className="mb-4">
        <WF label="Reason" required>
          <textarea
            value={form.reason}
            onChange={e => setForm(prev => ({ ...prev, reason: e.target.value }))}
            rows={3}
            placeholder="e.g. Forgot to tap in, arrived at 8am (min 10 characters)"
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

export default function MyAttendancePage() {
  const [showForm, setShowForm] = useState(false);

  const { data: history = [], isLoading: historyLoading } = useQuery({
    queryKey: ['my-attendance-history'],
    queryFn: () => hrService.getMyAttendance(),
  });
  const { data: corrections = [], isLoading: correctionsLoading } = useQuery({
    queryKey: ['my-attendance-corrections'],
    queryFn: hrService.getMyAttendanceCorrectionRequests,
  });

  const rows = (history as any[]) || [];
  const requests = (corrections as any[]) || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-[#0C447C]" /> My Attendance
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Your own attendance history. Spot something wrong? Request a correction below.</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0C447C] text-white text-sm font-medium rounded-lg hover:bg-[#0b3d6e]"
        >
          <Plus className="w-4 h-4" /> Request Correction
        </button>
      </div>

      {showForm && <RequestCorrectionForm onClose={() => setShowForm(false)} onSuccess={() => {}} />}

      {/* Recent attendance */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-6">
        <div className="px-5 py-3 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wide">
          Recent Attendance
        </div>
        {historyLoading ? (
          <div className="text-xs text-slate-400 animate-pulse py-10 text-center">Loading attendance…</div>
        ) : rows.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-400">No attendance recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 uppercase tracking-wide border-b border-slate-100">
                  <th className="px-5 py-2.5 font-medium">Date</th>
                  <th className="px-5 py-2.5 font-medium">Status</th>
                  <th className="px-5 py-2.5 font-medium">Check-in</th>
                  <th className="px-5 py-2.5 font-medium">Check-out</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 30).map((r: any) => (
                  <tr key={r._id} className="border-b border-slate-50 last:border-0">
                    <td className="px-5 py-2.5">{r.date ? new Date(r.date).toLocaleDateString() : '—'}</td>
                    <td className="px-5 py-2.5 capitalize">{STATUS_LABEL[r.status] || (r.status || '—').replace('_', ' ')}</td>
                    <td className="px-5 py-2.5 text-slate-500">{r.checkInTime || '—'}</td>
                    <td className="px-5 py-2.5 text-slate-500">{r.checkOutTime || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Correction requests */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wide">
          My Correction Requests
        </div>
        {correctionsLoading ? (
          <div className="text-xs text-slate-400 animate-pulse py-10 text-center">Loading requests…</div>
        ) : requests.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-400">You haven't requested any corrections yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 uppercase tracking-wide border-b border-slate-100">
                  <th className="px-5 py-2.5 font-medium">Date</th>
                  <th className="px-5 py-2.5 font-medium">Requested</th>
                  <th className="px-5 py-2.5 font-medium">Reason</th>
                  <th className="px-5 py-2.5 font-medium">Status</th>
                  <th className="px-5 py-2.5 font-medium">Reviewer Note</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r: any) => (
                  <tr key={r._id} className="border-b border-slate-50 last:border-0">
                    <td className="px-5 py-2.5">{r.attendanceDate ? new Date(r.attendanceDate).toLocaleDateString() : '—'}</td>
                    <td className="px-5 py-2.5 capitalize">{STATUS_LABEL[r.requestedStatus] || (r.requestedStatus || '—').replace('_', ' ')}</td>
                    <td className="px-5 py-2.5 text-slate-500 max-w-xs truncate" title={r.reason}>{r.reason || '—'}</td>
                    <td className="px-5 py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs border capitalize ${STATUS_STYLE[r.status] || 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                        {r.status || 'pending'}
                      </span>
                    </td>
                    <td className="px-5 py-2.5 text-slate-500 max-w-xs truncate" title={r.reviewNotes}>{r.reviewNotes || '—'}</td>
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
