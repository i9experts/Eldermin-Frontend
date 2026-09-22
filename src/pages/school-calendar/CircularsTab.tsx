import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { GradeCheckboxGrid } from '../teaching/tabs/shared';
import { useCampuses } from '../../hooks/useOrganization';
import { StudentSelect } from '../../components/ui/StudentSelect';
import { StaffSelect } from '../../components/ui/StaffSelect';
import RichTextEditor from './RichTextEditor';
import {
  Card, Btn, Modal, FormField, FInput, FSelect, Badge, EmptyState, CIRCULAR_CATEGORIES,
} from './shared';
import {
  useCirculars, useCreateCircular, useUpdateCircular, useDeleteCircular, usePublishCircular,
  useAcknowledgmentStatus,
} from './hooks';

const ROLE_OPTIONS = [
  { value: 'parent', label: 'Parents' },
  { value: 'staff', label: 'Staff' },
  { value: 'student', label: 'Students' },
];

const emptyForm = {
  title: '', body: '', category: 'other', priority: 'normal', requiresAcknowledgment: false,
  audience: {
    roles: ['parent'], scope: 'school', campusId: '', gradeLevels: [] as string[],
    individualStudentIds: [] as string[], individualStaffIds: [] as string[],
  },
  publishAt: '',
};

// { id, label } pairs so the picker can show a name without a second
// lookup - only the ids are sent to the backend.
function MultiPicker({
  picked, onAdd, onRemove, placeholder, children,
}: {
  picked: { id: string; label: string }[];
  onAdd: (id: string, label: string) => void;
  onRemove: (id: string) => void;
  placeholder: string;
  children: (onPick: (id: string, label: string) => void) => React.ReactNode;
}) {
  return (
    <div>
      {picked.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {picked.map((p) => (
            <span key={p.id} className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-full text-xs text-slate-700">
              {p.label}
              <button onClick={() => onRemove(p.id)} className="text-slate-400 hover:text-red-500">✕</button>
            </span>
          ))}
        </div>
      )}
      {children(onAdd)}
      <p className="text-[11px] text-slate-400 mt-1">{placeholder}</p>
    </div>
  );
}

function CircularFormModal({ circular, onClose }: { circular?: any; onClose: () => void }) {
  const isEdit = !!circular;
  const { data: campuses } = useCampuses();
  const [form, setForm] = useState<any>(isEdit ? {
    title: circular.title, body: circular.body, category: circular.category, priority: circular.priority,
    requiresAcknowledgment: circular.requiresAcknowledgment,
    audience: { ...circular.audience, campusId: circular.audience?.campusId || '' },
    publishAt: circular.publishAt ? new Date(circular.publishAt).toISOString().slice(0, 16) : '',
  } : emptyForm);
  // Tracked separately from form.audience so the picker can show a real
  // name - names for already-picked individuals on edit aren't stored on
  // the circular (only ids are), so those chips fall back to the raw id
  // rather than making extra lookups just to pretty-print them.
  const [pickedStudents, setPickedStudents] = useState<{ id: string; label: string }[]>(
    (circular?.audience?.individualStudentIds || []).map((id: string) => ({ id, label: id })),
  );
  const [pickedStaff, setPickedStaff] = useState<{ id: string; label: string }[]>(
    (circular?.audience?.individualStaffIds || []).map((id: string) => ({ id, label: id })),
  );

  const createMut = useCreateCircular();
  const updateMut = useUpdateCircular();
  const publishMut = usePublishCircular();
  const mut = isEdit ? updateMut : createMut;

  const toggleRole = (role: string) => {
    setForm((p: any) => ({
      ...p,
      audience: {
        ...p.audience,
        roles: p.audience.roles.includes(role) ? p.audience.roles.filter((r: string) => r !== role) : [...p.audience.roles, role],
      },
    }));
  };

  const buildPayload = () => ({
    title: form.title, body: form.body, category: form.category, priority: form.priority,
    requiresAcknowledgment: form.requiresAcknowledgment,
    audience: {
      ...form.audience,
      campusId: form.audience.campusId || null,
      individualStudentIds: pickedStudents.map((p) => p.id),
      individualStaffIds: pickedStaff.map((p) => p.id),
    },
    publishAt: form.publishAt ? new Date(form.publishAt).toISOString() : undefined,
  });

  const save = (thenPublish?: boolean) => {
    const payload = buildPayload();
    const onSuccess = (res: any) => {
      toast.success(isEdit ? 'Circular updated' : (form.publishAt ? 'Circular scheduled' : 'Saved as draft'));
      const id = isEdit ? circular._id : res._id;
      if (thenPublish && id) {
        publishMut.mutate(id, {
          onSuccess: (r: any) => { toast.success(`Published to ${r.recipientCount} recipient(s)`); onClose(); },
          onError: (e: any) => toast.error(e?.response?.data?.message || 'Publish failed'),
        });
      } else {
        onClose();
      }
    };
    const onError = (e: any) => toast.error(e?.response?.data?.message || 'Failed to save circular');
    if (isEdit) updateMut.mutate({ id: circular._id, data: payload }, { onSuccess, onError });
    else createMut.mutate(payload, { onSuccess, onError });
  };

  const canSubmit = form.title.trim() && form.body.trim() && (
    form.audience.scope === 'individual'
      ? pickedStudents.length > 0 || pickedStaff.length > 0
      : form.audience.roles.length > 0
  );

  return (
    <Modal
      title={isEdit ? 'Edit Circular' : 'New Circular'}
      onClose={onClose}
      wide
      footer={<>
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn variant="secondary" onClick={() => save(false)} disabled={!canSubmit || mut.isPending}>
          {form.publishAt ? 'Save Schedule' : 'Save Draft'}
        </Btn>
        <Btn variant="primary" onClick={() => save(true)} disabled={!canSubmit || mut.isPending || publishMut.isPending}>
          {publishMut.isPending ? 'Publishing…' : 'Publish Now'}
        </Btn>
      </>}
    >
      <FormField label="Title" required>
        <FInput value={form.title} onChange={e => setForm((p: any) => ({ ...p, title: e.target.value }))} />
      </FormField>
      <FormField label="Message" required>
        <RichTextEditor value={form.body} onChange={(html) => setForm((p: any) => ({ ...p, body: html }))} placeholder="Write the circular…" />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Category">
          <FSelect value={form.category} onChange={e => setForm((p: any) => ({ ...p, category: e.target.value }))}>
            {CIRCULAR_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </FSelect>
        </FormField>
        <FormField label="Priority">
          <FSelect value={form.priority} onChange={e => setForm((p: any) => ({ ...p, priority: e.target.value }))}>
            <option value="normal">Normal (in-app only)</option>
            <option value="urgent">Urgent (in-app + email)</option>
          </FSelect>
        </FormField>
      </div>

      <FormField label="Audience — who should receive this" required>
        <FSelect value={form.audience.scope} onChange={e => setForm((p: any) => ({ ...p, audience: { ...p.audience, scope: e.target.value } }))}>
          <option value="school">Entire School</option>
          <option value="campus">A Specific Campus</option>
          <option value="grade">Specific Grade Level(s)</option>
          <option value="individual">Specific People</option>
        </FSelect>

        {form.audience.scope !== 'individual' && (
          <div className="flex gap-3 my-2">
            {ROLE_OPTIONS.map(r => (
              <label key={r.value} className="flex items-center gap-1.5 text-xs text-slate-600 font-medium cursor-pointer">
                <input type="checkbox" checked={form.audience.roles.includes(r.value)} onChange={() => toggleRole(r.value)} className="rounded border-slate-300" />
                {r.label}
              </label>
            ))}
          </div>
        )}
        {form.audience.scope === 'campus' && (
          <FSelect className="mt-2" value={form.audience.campusId} onChange={e => setForm((p: any) => ({ ...p, audience: { ...p.audience, campusId: e.target.value } }))}>
            <option value="">Select campus…</option>
            {(campuses as any[] ?? []).map((c: any) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </FSelect>
        )}
        {form.audience.scope === 'grade' && (
          <div className="mt-2">
            <GradeCheckboxGrid selected={form.audience.gradeLevels} onChange={(v: string[]) => setForm((p: any) => ({ ...p, audience: { ...p.audience, gradeLevels: v } }))} />
          </div>
        )}
        {form.audience.scope === 'individual' && (
          <div className="mt-3 space-y-3">
            <div>
              <div className="text-xs font-semibold text-slate-600 mb-1.5">Specific Students (their parent is notified)</div>
              <MultiPicker
                picked={pickedStudents}
                onAdd={(id, label) => setPickedStudents((p) => p.some(x => x.id === id) ? p : [...p, { id, label }])}
                onRemove={(id) => setPickedStudents((p) => p.filter(x => x.id !== id))}
                placeholder="Search and select — repeat to add more"
              >
                {() => (
                  <StudentSelect
                    value=""
                    onChange={(id, student) => {
                      if (!id) return;
                      const label = student ? `${student.firstName || ''} ${student.lastName || ''}`.trim() : id;
                      setPickedStudents((p) => p.some(x => x.id === id) ? p : [...p, { id, label: label || id }]);
                    }}
                  />
                )}
              </MultiPicker>
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-600 mb-1.5">Specific Staff</div>
              <MultiPicker
                picked={pickedStaff}
                onAdd={(id, label) => setPickedStaff((p) => p.some(x => x.id === id) ? p : [...p, { id, label }])}
                onRemove={(id) => setPickedStaff((p) => p.filter(x => x.id !== id))}
                placeholder="Select — repeat to add more"
              >
                {() => (
                  <StaffSelect
                    value=""
                    onChange={(e: any) => {
                      const id = e.target.value;
                      if (!id) return;
                      const label = e.target.options[e.target.selectedIndex]?.text || id;
                      setPickedStaff((p) => p.some(x => x.id === id) ? p : [...p, { id, label }]);
                      e.target.value = '';
                    }}
                  />
                )}
              </MultiPicker>
            </div>
          </div>
        )}
      </FormField>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-xs text-slate-600 font-medium cursor-pointer">
          <input type="checkbox" checked={form.requiresAcknowledgment} onChange={e => setForm((p: any) => ({ ...p, requiresAcknowledgment: e.target.checked }))} className="rounded border-slate-300" />
          Require recipients to acknowledge
        </label>
      </div>

      <FormField label="Schedule for later (optional — leave blank to publish immediately or save as draft)">
        <FInput type="datetime-local" value={form.publishAt} onChange={e => setForm((p: any) => ({ ...p, publishAt: e.target.value }))} />
      </FormField>
    </Modal>
  );
}

function AckStatusModal({ circularId, onClose }: { circularId: string; onClose: () => void }) {
  const { data, isLoading } = useAcknowledgmentStatus(circularId);
  const status = data as any;
  return (
    <Modal title="Acknowledgment Status" onClose={onClose} footer={<Btn variant="secondary" onClick={onClose}>Close</Btn>}>
      {isLoading ? (
        <div className="text-center text-slate-400 py-8">Loading…</div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 text-sm mb-4">
            <div><div className="text-xs text-slate-400">Acknowledged</div><div className="text-lg font-bold text-emerald-600">{status.acknowledged} / {status.total}</div></div>
            <div><div className="text-xs text-slate-400">Pending</div><div className="text-lg font-bold text-amber-600">{status.pending.length}</div></div>
          </div>
          {status.pending.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Not yet acknowledged</div>
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-50">
                {status.pending.map((p: any) => <div key={p.userId} className="py-1.5 text-sm text-slate-600">{p.name}</div>)}
              </div>
            </div>
          )}
        </>
      )}
    </Modal>
  );
}

export default function CircularsTab() {
  const [statusFilter, setStatusFilter] = useState('');
  const { data: circulars, isLoading } = useCirculars({ status: statusFilter || undefined });
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [ackViewId, setAckViewId] = useState<string | null>(null);
  const deleteMut = useDeleteCircular();
  const publishMut = usePublishCircular();

  const rows = (circulars as any[]) ?? [];

  return (
    <Card>
      {showAdd && <CircularFormModal onClose={() => setShowAdd(false)} />}
      {editing && <CircularFormModal circular={editing} onClose={() => setEditing(null)} />}
      {ackViewId && <AckStatusModal circularId={ackViewId} onClose={() => setAckViewId(null)} />}

      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-wrap gap-2">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0C447C]">
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
          <option value="published">Published</option>
        </select>
        <Btn variant="primary" onClick={() => setShowAdd(true)}>+ New Circular</Btn>
      </div>

      <div className="p-5">
        {isLoading ? (
          <div className="text-center text-slate-400 py-12">Loading…</div>
        ) : rows.length === 0 ? (
          <EmptyState icon="📢" title="No circulars yet" action={<Btn variant="primary" onClick={() => setShowAdd(true)}>+ New Circular</Btn>} />
        ) : (
          <div className="space-y-2">
            {rows.map((c: any) => (
              <div key={c._id} className="border border-slate-100 rounded-lg p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-sm text-slate-900">{c.title}</span>
                      <Badge status={c.status} small />
                      {c.priority === 'urgent' && <Badge status="urgent" small />}
                      <span className="text-xs text-slate-400 capitalize">{c.category}</span>
                    </div>
                    <div className="text-xs text-slate-500">
                      Audience: {c.audience.roles.join(', ')} · {c.audience.scope}
                      {c.status === 'published' && ` · ${c.recipientCount} recipient(s)`}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0 flex-wrap">
                    {c.status !== 'published' && (
                      <>
                        <Btn size="xs" variant="secondary" onClick={() => setEditing(c)}>Edit</Btn>
                        <Btn size="xs" variant="primary" onClick={() => publishMut.mutate(c._id, {
                          onSuccess: (r: any) => toast.success(`Published to ${r.recipientCount} recipient(s)`),
                          onError: (e: any) => toast.error(e?.response?.data?.message || 'Publish failed'),
                        })}>
                          Publish Now
                        </Btn>
                        <Btn size="xs" variant="danger" onClick={() => {
                          if (window.confirm(`Delete "${c.title}"?`)) {
                            deleteMut.mutate(c._id, { onSuccess: () => toast.success('Deleted') });
                          }
                        }}>
                          Delete
                        </Btn>
                      </>
                    )}
                    {c.status === 'published' && c.requiresAcknowledgment && (
                      <Btn size="xs" variant="secondary" onClick={() => setAckViewId(c._id)}>Acknowledgment Status</Btn>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
