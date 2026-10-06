import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { GradeCheckboxGrid } from '../teaching/tabs/shared';
import { Card, CardHeader, Btn, Modal, FormField, FInput, FTextarea, FSelect, EmptyState, Badge } from './shared';
import schoolCalendarApi from './api';

const CATEGORIES = ['field_trip', 'medical', 'photo_video', 'data_sharing', 'other'];
const KEY = ['parent-portal', 'consent-requests'];

const emptyForm = { title: '', description: '', category: 'other', dueDate: '', allStudents: false, grades: [] as string[] };

function NewConsentModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<any>(emptyForm);
  const create = useMutation({
    mutationFn: schoolCalendarApi.createConsentRequest,
    onSuccess: (r: any) => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success(`Consent request sent for ${r.studentCount} student(s)`);
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to create consent request'),
  });
  const canSubmit = form.title.trim() && form.description.trim() && (form.allStudents || form.grades.length > 0);
  const submit = () => {
    const payload: any = { title: form.title, description: form.description, category: form.category };
    if (form.dueDate) payload.dueDate = form.dueDate;
    if (form.allStudents) payload.allStudents = true; else payload.grades = form.grades;
    create.mutate(payload);
  };
  return (
    <Modal title="New Consent Request" onClose={onClose} wide
      footer={<><Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn onClick={submit} disabled={!canSubmit || create.isPending}>{create.isPending ? 'Sending…' : 'Send to parents'}</Btn></>}>
      <FormField label="Title" required><FInput value={form.title} onChange={e => setForm((p: any) => ({ ...p, title: e.target.value }))} placeholder="e.g. Museum field trip" /></FormField>
      <FormField label="Details" required><FTextarea rows={3} value={form.description} onChange={e => setForm((p: any) => ({ ...p, description: e.target.value }))} /></FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Category">
          <FSelect value={form.category} onChange={e => setForm((p: any) => ({ ...p, category: e.target.value }))}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
          </FSelect>
        </FormField>
        <FormField label="Respond by"><FInput type="date" value={form.dueDate} onChange={e => setForm((p: any) => ({ ...p, dueDate: e.target.value }))} /></FormField>
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" checked={form.allStudents} onChange={e => setForm((p: any) => ({ ...p, allStudents: e.target.checked }))} />
        Whole school
      </label>
      {!form.allStudents && (
        <FormField label="Grades" required>
          <GradeCheckboxGrid selected={form.grades} onChange={(v: string[]) => setForm((p: any) => ({ ...p, grades: v }))} />
        </FormField>
      )}
    </Modal>
  );
}

export default function ConsentTab() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data, isLoading, isError } = useQuery({ queryKey: KEY, queryFn: schoolCalendarApi.getConsentRequests });
  const close = useMutation({
    mutationFn: schoolCalendarApi.closeConsentRequest,
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); toast.success('Request closed'); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to close request'),
  });
  const rows: any[] = Array.isArray(data) ? data : [];

  return (
    <>
      <Card>
        <CardHeader title="Parent Consent Requests" subtitle="Field trips, medical and media permissions — parents answer from the parent app"
          actions={<Btn onClick={() => setOpen(true)}>+ New request</Btn>} />
        <div className="p-5">
          {isLoading ? <div className="text-sm text-slate-400">Loading…</div>
            : isError ? <div className="text-sm text-red-500">Could not load consent requests.</div>
            : rows.length === 0 ? <EmptyState icon="📝" title="No consent requests yet" />
            : (
              <div className="space-y-3">
                {rows.map(r => (
                  <div key={r._id} className="border border-slate-100 rounded-lg p-4 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-slate-800">{r.title}</span>
                        <Badge status={r.isActive ? 'published' : 'draft'} />
                        <span className="text-xs text-slate-400 capitalize">{String(r.category).replace(/_/g, ' ')}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1 line-clamp-2">{r.description}</div>
                      <div className="text-xs text-slate-600 mt-2">
                        <span className="text-emerald-600 font-medium">{r.granted} granted</span> ·{' '}
                        <span className="text-red-600 font-medium">{r.declined} declined</span> ·{' '}
                        <span className="text-amber-600 font-medium">{r.pending} pending</span> of {r.total}
                        {r.dueDate && <> · due {new Date(r.dueDate).toLocaleDateString()}</>}
                      </div>
                    </div>
                    {r.isActive && <Btn size="sm" variant="secondary" disabled={close.isPending} onClick={() => close.mutate(r._id)}>Close</Btn>}
                  </div>
                ))}
              </div>
            )}
        </div>
      </Card>
      {open && <NewConsentModal onClose={() => setOpen(false)} />}
    </>
  );
}
