import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import teachingService from '../../../services/teaching.service';
import {
  ModalShell, FormSection, TeacherDropdown,
  GradeLevelDropdown, SectionDropdown, CampusDropdown, inputCls, labelCls,
} from './shared';

function Spin() {
  return (
    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
      <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}

// ─── PERIOD TYPES ─────────────────────────────────────────────────────────────

interface DiaryPeriod {
  subject: string;
  title: string;
  description: string;
  classworkDescription: string;
  homeworkDescription: string;
}

const EMPTY_PERIOD: DiaryPeriod = {
  subject: '', title: '', description: '', classworkDescription: '', homeworkDescription: '',
};

const TODAY = new Date().toISOString().split('T')[0];

// ─── CREATE / EDIT MODAL ──────────────────────────────────────────────────────

interface DiaryForm {
  teacherName: string;
  teacherId: string;
  campusId: string;
  gradeLevel: string;
  sectionName: string;
  diaryDate: string;
  periods: DiaryPeriod[];
}

const EMPTY_FORM: DiaryForm = {
  teacherName: '', teacherId: '', campusId: '',
  gradeLevel: '', sectionName: '', diaryDate: TODAY,
  periods: [{ ...EMPTY_PERIOD }],
};

function CreateDiaryModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<DiaryForm>(EMPTY_FORM);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);

  const mut = useMutation({
    mutationFn: (payload: DiaryForm) => teachingService.createClassDiaryEntry(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['class-diary'] });
      toast.success('Class diary entry created');
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to create'),
  });

  function handleTeacherSelect(t: any) {
    setSelectedTeacher(t);
    setForm((prev) => ({ ...prev, teacherId: t._id, teacherName: `${t.firstName} ${t.lastName}` }));
  }

  function updatePeriod(idx: number, patch: Partial<DiaryPeriod>) {
    setForm((prev) => ({
      ...prev,
      periods: prev.periods.map((p, i) => (i === idx ? { ...p, ...patch } : p)),
    }));
  }

  function addPeriod() {
    setForm((prev) => ({ ...prev, periods: [...prev.periods, { ...EMPTY_PERIOD }] }));
  }

  function removePeriod(idx: number) {
    setForm((prev) => ({ ...prev, periods: prev.periods.filter((_, i) => i !== idx) }));
  }

  const validPeriods = form.periods.filter((p) => p.subject.trim());
  const canSubmit = form.gradeLevel && form.diaryDate && validPeriods.length > 0 && !mut.isPending;

  return (
    <ModalShell
      title="New Class Diary Entry"
      sub="Log today's classwork and homework across one or more subjects"
      onClose={onClose}
      maxWidth="max-w-3xl"
    >
      <div className="p-6">
        <FormSection title="Teacher & Class">
          <TeacherDropdown value={selectedTeacher} onSelect={handleTeacherSelect} />
          <div className="grid grid-cols-4 gap-3 mt-3">
            <CampusDropdown
              value={form.campusId}
              onChange={(v) => setForm((prev) => ({ ...prev, campusId: v, gradeLevel: '', sectionName: '' }))}
            />
            <GradeLevelDropdown
              campusId={form.campusId}
              value={form.gradeLevel}
              onChange={(v) => setForm((prev) => ({ ...prev, gradeLevel: v, sectionName: '' }))}
            />
            <SectionDropdown
              campusId={form.campusId}
              gradeLevel={form.gradeLevel}
              value={form.sectionName}
              onChange={(v) => setForm((prev) => ({ ...prev, sectionName: v }))}
            />
            <div>
              <label className={labelCls}>Date *</label>
              <input
                type="date"
                value={form.diaryDate}
                onChange={(e) => setForm((prev) => ({ ...prev, diaryDate: e.target.value }))}
                className={inputCls}
              />
            </div>
          </div>
        </FormSection>

        <FormSection title="Periods / Subjects">
          <div className="space-y-4">
            {form.periods.map((p, idx) => (
              <div key={idx} className="border border-slate-200 rounded-xl p-4 relative">
                {form.periods.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePeriod(idx)}
                    className="absolute top-3 right-3 text-slate-300 hover:text-red-500 text-xs"
                  >
                    ✕ Remove
                  </button>
                )}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className={labelCls}>Subject / Period *</label>
                    <input
                      value={p.subject}
                      onChange={(e) => updatePeriod(idx, { subject: e.target.value })}
                      placeholder="e.g. Language Literacy - English"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Title</label>
                    <input
                      value={p.title}
                      onChange={(e) => updatePeriod(idx, { title: e.target.value })}
                      placeholder="e.g. Unit 3 — Sight Words"
                      className={inputCls}
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <label className={labelCls}>Description</label>
                  <input
                    value={p.description}
                    onChange={(e) => updatePeriod(idx, { description: e.target.value })}
                    placeholder="Brief description of the period (optional)"
                    className={inputCls}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Classwork</label>
                    <textarea
                      value={p.classworkDescription}
                      onChange={(e) => updatePeriod(idx, { classworkDescription: e.target.value })}
                      rows={2}
                      placeholder="What was taught/done in class today…"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0C447C] resize-y"
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Homework</label>
                    <textarea
                      value={p.homeworkDescription}
                      onChange={(e) => updatePeriod(idx, { homeworkDescription: e.target.value })}
                      rows={2}
                      placeholder="What's assigned for home (leave blank for routine/non-academic periods)…"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0C447C] resize-y"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addPeriod}
            className="mt-3 w-full flex items-center justify-center gap-2 border border-dashed border-slate-300 rounded-lg py-2 text-xs text-slate-500 hover:border-[#0C447C] hover:text-[#0C447C]"
          >
            + Add another subject / period
          </button>
        </FormSection>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button onClick={onClose} type="button"
            className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => mut.mutate(form)}
            disabled={!canSubmit}
            className="px-4 py-2 text-sm font-medium text-white bg-[#0C447C] rounded-lg hover:bg-[#0b3d6e] transition-colors disabled:opacity-40 flex items-center gap-2"
          >
            {mut.isPending && <Spin />}
            Save Diary Entry
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

// ─── CLASS DIARY TAB ──────────────────────────────────────────────────────────

export function TeachingClassDiaryTab() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['class-diary'],
    queryFn: () => teachingService.getClassDiaryEntries(),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => teachingService.deleteClassDiaryEntry(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['class-diary'] }); toast.success('Entry deleted'); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to delete'),
  });

  const shareMut = useMutation({
    mutationFn: (id: string) => teachingService.shareClassDiaryEntry(id),
    onSuccess: (entry: any) => {
      qc.invalidateQueries({ queryKey: ['class-diary'] });
      toast.success(`Shared with ${entry.notifiedGuardianCount ?? 0} guardian${entry.notifiedGuardianCount === 1 ? '' : 's'}`);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to share'),
  });

  const pdfMut = useMutation({
    mutationFn: (id: string) => teachingService.downloadClassDiaryPdf(id),
    onError: () => toast.error('Failed to generate PDF'),
  });

  const list = (entries as any[]).slice().sort((a, b) => new Date(b.diaryDate).getTime() - new Date(a.diaryDate).getTime());

  return (
    <div>
      {showCreate && <CreateDiaryModal onClose={() => setShowCreate(false)} />}

      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Class Diary</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {list.length} entr{list.length !== 1 ? 'ies' : 'y'} · daily classwork &amp; homework log, shared with parents as a PDF
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-[#0C447C] text-white text-sm font-medium rounded-lg hover:bg-[#0b3d6e] transition-colors flex items-center gap-1.5"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
          New Diary Entry
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-slate-400 gap-2"><Spin /> Loading entries…</div>
      ) : list.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-16 text-center">
          <div className="text-5xl mb-4">📔</div>
          <div className="font-semibold text-slate-700 text-lg mb-1">No class diary entries yet</div>
          <div className="text-sm text-slate-400 mb-5">
            Log each day's classwork/homework across subjects and share it with parents as a PDF — a separate, optional
            tool alongside the Homework tab.
          </div>
          <button onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-[#0C447C] text-white text-sm font-medium rounded-lg hover:bg-[#0b3d6e] transition-colors">
            Create First Entry
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Date', 'Class', 'Teacher', 'Subjects', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap bg-slate-50">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.map((entry: any) => (
                  <tr key={entry._id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap text-slate-700 font-medium">
                      {new Date(entry.diaryDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {entry.gradeLevel}{entry.sectionName ? ` · ${entry.sectionName}` : ''}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{entry.teacherName || '—'}</td>
                    <td className="py-3 px-4 text-slate-500 max-w-[260px] truncate">
                      {(entry.periods || []).map((p: any) => p.subject).filter(Boolean).join(', ') || '—'}
                    </td>
                    <td className="py-3 px-4">
                      {entry.shared ? (
                        <span className="inline-flex items-center px-2 py-0.5 border rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border-emerald-200">
                          Shared · {entry.notifiedGuardianCount ?? 0} guardian{entry.notifiedGuardianCount === 1 ? '' : 's'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 border rounded-full text-xs font-medium bg-slate-100 text-slate-600 border-slate-200">
                          Not shared
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => pdfMut.mutate(entry._id)}
                          disabled={pdfMut.isPending}
                          className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-600 disabled:opacity-40"
                        >
                          PDF
                        </button>
                        <button
                          onClick={() => {
                            if (entry.shared) return;
                            if (window.confirm(`Share this diary entry with parents? Guardians will be notified and the PDF will appear in the Parent Portal.`)) shareMut.mutate(entry._id);
                          }}
                          disabled={entry.shared || shareMut.isPending}
                          className="px-2.5 py-1 text-xs border border-[#0C447C] text-[#0C447C] rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {entry.shared ? 'Shared' : 'Share'}
                        </button>
                        <button
                          onClick={() => { if (window.confirm('Delete this diary entry? This cannot be undone.')) deleteMut.mutate(entry._id); }}
                          disabled={deleteMut.isPending}
                          className="px-2.5 py-1 text-xs border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-40"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
