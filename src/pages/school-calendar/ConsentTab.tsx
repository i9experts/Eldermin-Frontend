import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Download, X as XIcon } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { GradeCheckboxGrid } from '../teaching/tabs/shared';
import { Card, CardHeader, Btn, Modal, FormField, FInput, FSelect, EmptyState, Badge } from './shared';
import RichTextEditor from './RichTextEditor';
import schoolCalendarApi from './api';
import pdfApi from '../../services/pdf.api';
import { useHijriPreference } from '../../hooks/useOrganization';
import { formatHijri } from '../../utils/hijri';

const CATEGORIES = ['field_trip', 'medical', 'photo_video', 'data_sharing', 'other'];
const KEY = ['parent-portal', 'consent-requests'];

const emptyForm = { title: '', description: '', category: 'other', dueDate: '', allStudents: false, grades: [] as string[], attachments: [] as string[] };

function NewConsentModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<any>(emptyForm);
  const hijri = useHijriPreference();
  const create = useMutation({
    mutationFn: schoolCalendarApi.createConsentRequest,
    onSuccess: (r: any) => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success(`Consent request sent for ${r.studentCount} student(s)`);
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to create consent request'),
  });
  // description is rendered as HTML, so "has content" means more than empty tags.
  const hasDescription = form.description.replace(/<[^>]*>/g, '').trim().length > 0;
  const canSubmit = form.title.trim() && hasDescription && (form.allStudents || form.grades.length > 0);
  const submit = () => {
    const payload: any = { title: form.title, description: form.description, category: form.category, attachments: form.attachments };
    if (form.dueDate) payload.dueDate = form.dueDate;
    if (form.allStudents) payload.allStudents = true; else payload.grades = form.grades;
    create.mutate(payload);
  };
  return (
    <Modal title="New Consent Request" onClose={onClose} wide
      footer={<><Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn onClick={submit} disabled={!canSubmit || create.isPending}>{create.isPending ? 'Sending…' : 'Send to parents'}</Btn></>}>
      <FormField label="Title" required><FInput value={form.title} onChange={e => setForm((p: any) => ({ ...p, title: e.target.value }))} placeholder="e.g. Museum field trip" /></FormField>
      <FormField label="Details" required>
        <RichTextEditor value={form.description} onChange={(html) => setForm((p: any) => ({ ...p, description: html }))}
          placeholder="Describe what parents are being asked to consent to…" imageUploadFolder="consent-attachments" />
      </FormField>
      {form.attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {form.attachments.map((url: string, i: number) => (
            <div key={url} className="relative">
              <img src={url} alt="" className="h-16 w-16 object-cover rounded-lg border border-slate-200" />
              <button type="button" onClick={() => setForm((p: any) => ({ ...p, attachments: p.attachments.filter((_: string, j: number) => j !== i) }))}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-red-500 flex items-center justify-center">
                <XIcon size={11} />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Category">
          <FSelect value={form.category} onChange={e => setForm((p: any) => ({ ...p, category: e.target.value }))}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
          </FSelect>
        </FormField>
        <FormField label="Respond by">
          <FInput type="date" value={form.dueDate} onChange={e => setForm((p: any) => ({ ...p, dueDate: e.target.value }))} />
          {hijri.enabled && form.dueDate && (
            <div className="text-[11px] text-slate-400 mt-1">{formatHijri(form.dueDate, hijri.dayAdjustment)}</div>
          )}
        </FormField>
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

function ResultsModal({ requestId, onClose }: { requestId: string; onClose: () => void }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['parent-portal', 'consent-requests', requestId, 'results'],
    queryFn: () => schoolCalendarApi.getConsentRequestResults(requestId),
  });
  const [downloading, setDownloading] = useState(false);
  const result = data as any;
  const hijri = useHijriPreference();

  const downloadPdf = async () => {
    if (!result) return;
    setDownloading(true);
    try {
      const { request, students, classSummary } = result;
      const granted = students.filter((s: any) => s.decision === 'granted').length;
      const declined = students.filter((s: any) => s.decision === 'declined').length;
      const pending = students.filter((s: any) => s.decision === 'pending').length;
      const blob = await pdfApi.generateTabularReportPdf({
        title: `Parent Consent Report — ${request.title}`,
        subtitle: `${request.category.replace(/_/g, ' ')}${request.dueDate ? ` · Due ${new Date(request.dueDate).toLocaleDateString()}${hijri.enabled ? ` (${formatHijri(request.dueDate, hijri.dayAdjustment)})` : ''}` : ''}`,
        filterSummary: `${granted} granted · ${declined} declined · ${pending} pending of ${students.length}` +
          (classSummary?.length ? ` · ${classSummary.map((c: any) => `${c.grade}${c.section ? ' ' + c.section : ''}: ${c.granted}/${c.total}`).join(', ')}` : ''),
        columns: ['Student', 'Grade', 'Section', 'Status', 'Responded By', 'Date & Time', 'Notes'],
        rows: students.map((s: any) => [
          s.studentName, s.grade, s.section,
          s.decision.charAt(0).toUpperCase() + s.decision.slice(1),
          s.respondedByName || '—',
          s.respondedAt ? new Date(s.respondedAt).toLocaleString() : '—',
          s.notes || '',
        ]),
      });
      pdfApi.downloadBlob(blob, `consent-report-${request.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to generate PDF');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Modal title="Consent Results" onClose={onClose} wide
      footer={<>
        <Btn variant="secondary" onClick={onClose}>Close</Btn>
        <Btn onClick={downloadPdf} disabled={!result || downloading}>
          <Download size={13} /> {downloading ? 'Generating…' : 'Download PDF'}
        </Btn>
      </>}>
      {isLoading ? (
        <div className="text-center text-slate-400 py-10">Loading…</div>
      ) : isError || !result ? (
        <div className="text-center text-red-500 py-10">Could not load results.</div>
      ) : (
        <>
          <div>
            <div className="font-semibold text-sm text-slate-800">{result.request.title}</div>
            <div className="text-xs text-slate-500 mt-1" dangerouslySetInnerHTML={{ __html: result.request.description }} />
            {result.request.attachments?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {result.request.attachments.map((url: string) => (
                  <a key={url} href={url} target="_blank" rel="noreferrer">
                    <img src={url} alt="" className="h-14 w-14 object-cover rounded-lg border border-slate-200" />
                  </a>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Class-wise Summary</div>
            <div className="border border-slate-100 rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500">
                    <th className="py-2 px-3 text-left font-semibold">Class</th>
                    <th className="py-2 px-3 text-center font-semibold">Granted</th>
                    <th className="py-2 px-3 text-center font-semibold">Declined</th>
                    <th className="py-2 px-3 text-center font-semibold">Pending</th>
                    <th className="py-2 px-3 text-center font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {result.classSummary.map((c: any) => (
                    <tr key={`${c.grade}-${c.section}`} className="border-t border-slate-50">
                      <td className="py-1.5 px-3 font-medium text-slate-700">{c.grade}{c.section ? ` — ${c.section}` : ''}</td>
                      <td className="py-1.5 px-3 text-center text-emerald-600 font-medium">{c.granted}</td>
                      <td className="py-1.5 px-3 text-center text-red-600 font-medium">{c.declined}</td>
                      <td className="py-1.5 px-3 text-center text-amber-600 font-medium">{c.pending}</td>
                      <td className="py-1.5 px-3 text-center text-slate-500">{c.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Student-wise Detail</div>
            <div className="border border-slate-100 rounded-lg overflow-hidden max-h-80 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0">
                  <tr className="bg-slate-50 text-slate-500">
                    <th className="py-2 px-3 text-left font-semibold">Student</th>
                    <th className="py-2 px-3 text-left font-semibold">Class</th>
                    <th className="py-2 px-3 text-center font-semibold">Status</th>
                    <th className="py-2 px-3 text-left font-semibold">Responded By</th>
                    <th className="py-2 px-3 text-left font-semibold">Date &amp; Time</th>
                  </tr>
                </thead>
                <tbody>
                  {result.students.map((s: any) => (
                    <tr key={s.studentId} className="border-t border-slate-50">
                      <td className="py-1.5 px-3 font-medium text-slate-700">{s.studentName}{s.rollNumber ? ` (#${s.rollNumber})` : ''}</td>
                      <td className="py-1.5 px-3 text-slate-500">{s.grade}{s.section ? ` — ${s.section}` : ''}</td>
                      <td className="py-1.5 px-3 text-center"><Badge status={s.decision} small /></td>
                      <td className="py-1.5 px-3 text-slate-500">{s.respondedByName || '—'}</td>
                      <td className="py-1.5 px-3 text-slate-500">{s.respondedAt ? new Date(s.respondedAt).toLocaleString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </Modal>
  );
}

export default function ConsentTab() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [resultsId, setResultsId] = useState<string | null>(null);
  const hijri = useHijriPreference();
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
                        {r.attachments?.length > 0 && <span className="text-xs text-slate-400">📎 {r.attachments.length}</span>}
                      </div>
                      <div className="text-xs text-slate-500 mt-1 line-clamp-2" dangerouslySetInnerHTML={{ __html: r.description }} />
                      <div className="text-xs text-slate-600 mt-2">
                        <span className="text-emerald-600 font-medium">{r.granted} granted</span> ·{' '}
                        <span className="text-red-600 font-medium">{r.declined} declined</span> ·{' '}
                        <span className="text-amber-600 font-medium">{r.pending} pending</span> of {r.total}
                        {r.dueDate && <> · due {new Date(r.dueDate).toLocaleDateString()}{hijri.enabled && ` (${formatHijri(r.dueDate, hijri.dayAdjustment)})`}</>}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      <Btn size="sm" variant="secondary" onClick={() => setResultsId(r._id)}>View Results</Btn>
                      {r.isActive && <Btn size="sm" variant="secondary" disabled={close.isPending} onClick={() => close.mutate(r._id)}>Close</Btn>}
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>
      </Card>
      {open && <NewConsentModal onClose={() => setOpen(false)} />}
      {resultsId && <ResultsModal requestId={resultsId} onClose={() => setResultsId(null)} />}
    </>
  );
}
