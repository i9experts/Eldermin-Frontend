import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { Card, Btn, Modal, FormField, FInput, FTextarea, FSelect, Badge, EmptyState, EVENT_CATEGORIES } from './shared';
import { useEvents, useCreateEvent, useDeleteEvent } from './hooks';

const emptyForm = {
  title: '', description: '', category: 'other', venueName: '', venueAddress: '',
  visibility: 'public',
  sessions: [{ label: 'Main Session', startAt: '', endAt: '' }],
};

function CreateEventModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const [form, setForm] = useState<any>(emptyForm);
  const createMut = useCreateEvent();

  const submit = () => {
    if (!form.sessions[0].startAt || !form.sessions[0].endAt) {
      toast.error('Set a start and end date/time');
      return;
    }
    createMut.mutate(form, {
      onSuccess: (res: any) => {
        toast.success('Event created');
        // Phase 3 — venue double-booking check: never blocks creation,
        // just surfaces what it found so the admin can fix the venue/time
        // or knowingly proceed (e.g. two small things in the same hall
        // back-to-back is sometimes genuinely fine).
        if (res.venueConflicts?.length) {
          const first = res.venueConflicts[0];
          toast(`⚠️ Venue conflict: "${first.eventTitle}" is already booked at this venue around the same time — check the Overview tab.`, { duration: 8000 });
        }
        onCreated(res._id);
      },
      onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to create event'),
    });
  };

  const canSubmit = form.title.trim();

  return (
    <Modal title="New Event" onClose={onClose} wide
      footer={<>
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" onClick={submit} disabled={!canSubmit || createMut.isPending}>
          {createMut.isPending ? 'Creating…' : '+ Create Event'}
        </Btn>
      </>}>
      <FormField label="Title" required>
        <FInput value={form.title} onChange={e => setForm((p: any) => ({ ...p, title: e.target.value }))} />
      </FormField>
      <FormField label="Description">
        <FTextarea rows={3} value={form.description} onChange={e => setForm((p: any) => ({ ...p, description: e.target.value }))} />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Category">
          <FSelect value={form.category} onChange={e => setForm((p: any) => ({ ...p, category: e.target.value }))}>
            {EVENT_CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
          </FSelect>
        </FormField>
        <FormField label="Visibility">
          <FSelect value={form.visibility} onChange={e => setForm((p: any) => ({ ...p, visibility: e.target.value }))}>
            <option value="public">Public (listed)</option>
            <option value="unlisted">Unlisted (link only)</option>
            <option value="private">Private</option>
            <option value="internal">Internal (staff/parents only)</option>
          </FSelect>
        </FormField>
        <FormField label="Venue Name">
          <FInput value={form.venueName} onChange={e => setForm((p: any) => ({ ...p, venueName: e.target.value }))} />
        </FormField>
        <FormField label="Venue Address">
          <FInput value={form.venueAddress} onChange={e => setForm((p: any) => ({ ...p, venueAddress: e.target.value }))} />
        </FormField>
        <FormField label="Starts" required>
          <FInput type="datetime-local" value={form.sessions[0].startAt}
            onChange={e => setForm((p: any) => ({ ...p, sessions: [{ ...p.sessions[0], startAt: e.target.value }] }))} />
        </FormField>
        <FormField label="Ends" required>
          <FInput type="datetime-local" value={form.sessions[0].endAt}
            onChange={e => setForm((p: any) => ({ ...p, sessions: [{ ...p.sessions[0], endAt: e.target.value }] }))} />
        </FormField>
      </div>
      <p className="text-xs text-slate-400">Add ticket types and set pricing after creating the event — it stays in Draft (not publicly visible) until you publish it.</p>
    </Modal>
  );
}

export default function EventsListTab() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('');
  const { data: events, isLoading } = useEvents({ status: statusFilter || undefined });
  const [showCreate, setShowCreate] = useState(false);
  const deleteMut = useDeleteEvent();
  const rows = (events as any[]) ?? [];

  return (
    <Card>
      {showCreate && <CreateEventModal onClose={() => setShowCreate(false)} onCreated={(id) => navigate(`/events/${id}`)} />}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-wrap gap-2">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0C447C]">
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="cancelled">Cancelled</option>
          <option value="completed">Completed</option>
        </select>
        <Btn variant="primary" onClick={() => setShowCreate(true)}>+ New Event</Btn>
      </div>
      <div className="p-5">
        {isLoading ? (
          <div className="text-center text-slate-400 py-12">Loading…</div>
        ) : rows.length === 0 ? (
          <EmptyState icon="🎉" title="No events yet" action={<Btn variant="primary" onClick={() => setShowCreate(true)}>+ New Event</Btn>} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {rows.map((e: any) => (
              <div key={e._id} className="border border-slate-100 rounded-lg p-4 hover:border-[#0C447C] transition-colors cursor-pointer" onClick={() => navigate(`/events/${e._id}`)}>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 capitalize">{e.category?.replace(/_/g, ' ')}</span>
                  <Badge status={e.status} small />
                </div>
                <div className="font-semibold text-sm text-slate-900 mb-1">{e.title}</div>
                <div className="text-xs text-slate-500 mb-1">{e.venueName || 'Venue TBD'}</div>
                <div className="text-xs text-slate-400">
                  {e.sessions?.[0]?.startAt ? new Date(e.sessions[0].startAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : ''}
                </div>
                <div className="flex justify-end mt-3">
                  <button
                    onClick={(ev) => { ev.stopPropagation(); if (window.confirm(`Delete "${e.title}"?`)) deleteMut.mutate(e._id, { onSuccess: () => toast.success('Deleted') }); }}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
