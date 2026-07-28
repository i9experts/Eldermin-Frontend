import React, { useState } from 'react';
import { Send, Clock } from 'lucide-react';
import { useTickets, useUpdateTicket, useReplyToTicket } from '../../hooks/useSuperAdmin';
import { Modal, Sel, BtnPrimary } from './shared';

const PRIORITY_COLOR: Record<string, string> = {
  critical: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-gray-100 text-gray-600',
};
const STATUS_COLOR: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-purple-100 text-purple-700',
  resolved: 'bg-emerald-100 text-emerald-700',
  closed: 'bg-gray-200 text-gray-600',
};

function TicketModal({ ticket, onClose }: { ticket: any; onClose: () => void }) {
  const [message, setMessage] = useState('');
  const updateTicket = useUpdateTicket();
  const reply = useReplyToTicket();

  return (
    <Modal title={ticket.subject} subtitle={`${ticket.ticketNumber} · ${ticket.institutionName}`} onClose={onClose} size="lg">
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Status</label>
            <Sel value={ticket.status} onChange={(e) => updateTicket.mutate({ id: ticket._id, data: { status: e.target.value } })}>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </Sel>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Priority</label>
            <Sel value={ticket.priority} onChange={(e) => updateTicket.mutate({ id: ticket._id, data: { priority: e.target.value } })}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </Sel>
          </div>
        </div>

        <div>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Description</p>
          <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3">{ticket.description}</p>
        </div>

        <div>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Conversation</p>
          <div className="space-y-2 max-h-56 overflow-y-auto mb-3">
            {(ticket.replies || []).length === 0 && <p className="text-xs text-gray-400">No replies yet.</p>}
            {(ticket.replies || []).map((r: any, i: number) => (
              <div key={i} className="bg-gray-50 rounded-lg p-3 text-xs">
                <p className="text-gray-700">{r.message}</p>
                <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1"><Clock size={10} /> {r.by} · {new Date(r.at).toLocaleString()}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Reply to this ticket..."
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20" />
            <BtnPrimary icon={<Send size={12} />} disabled={!message.trim() || reply.isPending}
              onClick={() => { if (message.trim()) { reply.mutate({ id: ticket._id, message: message.trim() }); setMessage(''); } }}>
              Reply
            </BtnPrimary>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default function SupportTab() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selected, setSelected] = useState<any>(null);
  const { data, isLoading } = useTickets(statusFilter === 'all' ? undefined : { status: statusFilter });
  const tickets = data?.data || [];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-gray-800">Support</h2>
        <p className="text-xs text-gray-400">Tickets raised by schools across the platform</p>
      </div>

      <div className="flex gap-2">
        {['all', 'open', 'in_progress', 'resolved', 'closed'].map(f => (
          <button key={f} onClick={() => setStatusFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-lg border font-medium capitalize transition-all ${statusFilter === f ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]' : 'bg-white text-gray-600 border-gray-200'}`}>
            {f === 'all' ? 'All' : f.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 text-gray-500 border-b border-gray-100">
              <th className="py-3 px-4 text-left font-semibold">Ticket</th>
              <th className="py-3 px-4 text-left font-semibold">Institution</th>
              <th className="py-3 px-4 font-semibold">Priority</th>
              <th className="py-3 px-4 font-semibold">Status</th>
              <th className="py-3 px-4 font-semibold">Raised</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && Array.from({ length: 4 }).map((_, i) => (
              <tr key={i} className="border-b border-gray-50"><td colSpan={5} className="py-3 px-4"><div className="animate-pulse h-4 bg-gray-100 rounded w-3/4" /></td></tr>
            ))}
            {!isLoading && tickets.length === 0 && (
              <tr><td colSpan={5} className="py-12 text-center text-xs text-gray-400">No support tickets yet.</td></tr>
            )}
            {tickets.map((t: any) => (
              <tr key={t._id} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer" onClick={() => setSelected(t)}>
                <td className="py-3 px-4"><p className="font-medium text-gray-800">{t.subject}</p><p className="text-[10px] text-gray-400">{t.ticketNumber}</p></td>
                <td className="py-3 px-4 text-gray-700">{t.institutionName}</td>
                <td className="py-3 px-4 text-center"><span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${PRIORITY_COLOR[t.priority] || 'bg-gray-100 text-gray-600'}`}>{t.priority}</span></td>
                <td className="py-3 px-4 text-center"><span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_COLOR[t.status] || 'bg-gray-100 text-gray-600'}`}>{t.status?.replace('_', ' ')}</span></td>
                <td className="py-3 px-4 text-center text-[10px] text-gray-400">{new Date(t.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && <TicketModal ticket={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
