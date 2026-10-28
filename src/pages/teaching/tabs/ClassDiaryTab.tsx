import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import teachingService from '../../../services/teaching.service';
import {
  ModalShell, FormSection, TeacherDropdown,
  GradeLevelDropdown, SectionDropdown, CampusDropdown, inputCls, labelCls,
} from './shared';
import { RichTextEditor } from '../../../components/ui/RichTextEditor';
import { useAuth } from '../../../contexts/AuthContext';

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

// Reconstructs a minimal teacher object from an existing entry's
// teacherId/teacherName (all the edit form has, since it doesn't refetch
// the full teacher directory) - enough for TeacherDropdown to display the
// current selection without the user having to re-pick the same teacher.
function teacherFromEntry(entry: any): any {
  if (!entry?.teacherId) return null;
  const [firstName, ...rest] = (entry.teacherName || '').split(' ');
  return { _id: entry.teacherId, firstName: firstName || entry.teacherName || '', lastName: rest.join(' '), subjectsCanTeach: [] };
}

function formFromEntry(entry: any): DiaryForm {
  return {
    teacherName: entry.teacherName || '',
    teacherId: entry.teacherId || '',
    campusId: entry.campusId || '',
    gradeLevel: entry.gradeLevel || '',
    sectionName: entry.sectionName || '',
    diaryDate: entry.diaryDate ? new Date(entry.diaryDate).toISOString().split('T')[0] : TODAY,
    periods: (entry.periods || []).length
      ? entry.periods.map((p: any) => ({
        subject: p.subject || '', title: p.title || '', description: p.description || '',
        classworkDescription: p.classworkDescription || '', homeworkDescription: p.homeworkDescription || '',
      }))
      : [{ ...EMPTY_PERIOD }],
  };
}

function CreateDiaryModal({ onClose, entry }: { onClose: () => void; entry?: any }) {
  const qc = useQueryClient();
  const isEdit = !!entry;
  const [form, setForm] = useState<DiaryForm>(() => (entry ? formFromEntry(entry) : EMPTY_FORM));
  const [selectedTeacher, setSelectedTeacher] = useState<any>(() => teacherFromEntry(entry));

  const mut = useMutation({
    mutationFn: (payload: DiaryForm) => isEdit
      ? teachingService.updateClassDiaryEntry(entry._id, payload)
      : teachingService.createClassDiaryEntry(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['class-diary'] });
      toast.success(isEdit ? 'Class diary entry updated' : 'Class diary entry created');
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'}`),
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
      title={isEdit ? 'Edit Class Diary Entry' : 'New Class Diary Entry'}
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
                  <RichTextEditor
                    value={p.description}
                    onChange={(html) => updatePeriod(idx, { description: html })}
                    placeholder="Brief description of the period (optional)"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Classwork</label>
                    <RichTextEditor
                      value={p.classworkDescription}
                      onChange={(html) => updatePeriod(idx, { classworkDescription: html })}
                      placeholder="What was taught/done in class today…"
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Homework</label>
                    <RichTextEditor
                      value={p.homeworkDescription}
                      onChange={(html) => updatePeriod(idx, { homeworkDescription: html })}
                      placeholder="What's assigned for home (leave blank for routine/non-academic periods)…"
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

// ─── ADMIN SUMMARY ────────────────────────────────────────────────────────────

// Same role list Teaching's own attendance-settings access check uses
// (src/pages/teaching/index.tsx) - the school-admin-facing overview below
// is for roles with a whole-school view, not an individual teacher's.
const ADMIN_SUMMARY_ROLES = ['super_admin', 'institution_owner', 'principal', 'vice_principal', 'admin', 'academic_coordinator'];

function stripHtml(html: string): string {
  return (html || '').replace(/<[^>]*>/g, '').trim();
}

function daysAgo(date: Date): number {
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 86400000));
}

interface TeacherDiaryStat {
  teacherName: string;
  entries: number;
  shared: number;
  distinctDays: number;
  daysSinceLast: number | null;
}

/**
 * School-wide Class Diary overview for admin-type roles: total entries and
 * how many were shared with parents, how many distinct subjects are being
 * logged, how often homework is actually being assigned, and per-teacher
 * consistency (entries submitted, share rate, how recently each teacher
 * last logged one - the thing an admin actually wants to catch: a teacher
 * who's gone quiet). Computed entirely from the already-fetched entries
 * list - the backend returns every entry (not teacher-scoped) to any
 * non-teacher caller, so no extra endpoint is needed.
 */
function ClassDiarySummary({ entries }: { entries: any[] }) {
  const stats = useMemo(() => {
    const totalEntries = entries.length;
    const sharedEntries = entries.filter((e) => e.shared).length;
    const subjectCounts = new Map<string, number>();
    let totalPeriods = 0;
    let periodsWithHomework = 0;
    const byTeacher = new Map<string, TeacherDiaryStat & { days: Set<string>; lastDate: Date | null }>();

    for (const e of entries) {
      const key = e.teacherId || e.teacherName || 'unknown';
      if (!byTeacher.has(key)) {
        byTeacher.set(key, { teacherName: e.teacherName || 'Unassigned', entries: 0, shared: 0, distinctDays: 0, daysSinceLast: null, days: new Set(), lastDate: null });
      }
      const t = byTeacher.get(key)!;
      t.entries += 1;
      if (e.shared) t.shared += 1;
      const d = e.diaryDate ? new Date(e.diaryDate) : null;
      if (d && !isNaN(d.getTime())) {
        t.days.add(d.toISOString().split('T')[0]);
        if (!t.lastDate || d > t.lastDate) t.lastDate = d;
      }
      for (const p of (e.periods || [])) {
        totalPeriods += 1;
        const subject = (p.subject || '').trim();
        if (subject) subjectCounts.set(subject, (subjectCounts.get(subject) || 0) + 1);
        if (stripHtml(p.homeworkDescription)) periodsWithHomework += 1;
      }
    }

    const teacherStats: TeacherDiaryStat[] = Array.from(byTeacher.values())
      .map(({ days, lastDate, ...rest }) => ({ ...rest, distinctDays: days.size, daysSinceLast: lastDate ? daysAgo(lastDate) : null }))
      .sort((a, b) => (a.daysSinceLast ?? 999) - (b.daysSinceLast ?? 999));

    const topSubjects = Array.from(subjectCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8);

    return {
      totalEntries,
      sharedRate: totalEntries ? Math.round((sharedEntries / totalEntries) * 100) : 0,
      subjectsCovered: subjectCounts.size,
      homeworkRate: totalPeriods ? Math.round((periodsWithHomework / totalPeriods) * 100) : 0,
      teacherStats,
      topSubjects,
    };
  }, [entries]);

  const cards = [
    { label: 'Total Entries', value: stats.totalEntries, color: '#0C447C' },
    { label: 'Shared with Parents', value: `${stats.sharedRate}%`, color: '#1D9E75' },
    { label: 'Subjects Covered', value: stats.subjectsCovered, color: '#7F77DD' },
    { label: 'Homework Given', value: `${stats.homeworkRate}%`, color: '#BA7517' },
  ];

  return (
    <div className="mb-6">
      <h2 className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">School Overview</h2>
      <div className="grid grid-cols-4 gap-3 mb-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-white border border-slate-100 rounded-xl p-4" style={{ borderTop: `3px solid ${c.color}` }}>
            <div className="text-[11px] text-slate-400 uppercase tracking-wide mb-1">{c.label}</div>
            <div className="text-2xl font-semibold" style={{ color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-100 text-xs font-semibold text-slate-600 uppercase tracking-wide bg-slate-50">
            Teacher Consistency
          </div>
          <div className="max-h-64 overflow-y-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-400">
                  <th className="text-left px-4 py-2 font-medium">Teacher</th>
                  <th className="text-right px-4 py-2 font-medium">Entries</th>
                  <th className="text-right px-4 py-2 font-medium">Shared</th>
                  <th className="text-right px-4 py-2 font-medium">Last Entry</th>
                </tr>
              </thead>
              <tbody>
                {stats.teacherStats.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400">No entries yet</td></tr>
                ) : stats.teacherStats.map((t) => (
                  <tr key={t.teacherName} className="border-t border-slate-50">
                    <td className="px-4 py-2 text-slate-700 truncate max-w-[140px]">{t.teacherName}</td>
                    <td className="px-4 py-2 text-right text-slate-600">{t.entries}</td>
                    <td className="px-4 py-2 text-right text-slate-600">{t.entries ? Math.round((t.shared / t.entries) * 100) : 0}%</td>
                    <td className="px-4 py-2 text-right">
                      {t.daysSinceLast === null ? (
                        <span className="text-slate-300">—</span>
                      ) : (
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                          t.daysSinceLast <= 1 ? 'bg-emerald-50 text-emerald-700' : t.daysSinceLast <= 3 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                        }`}>
                          {t.daysSinceLast === 0 ? 'Today' : `${t.daysSinceLast}d ago`}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-100 text-xs font-semibold text-slate-600 uppercase tracking-wide bg-slate-50">
            Subject Coverage
          </div>
          <div className="max-h-64 overflow-y-auto p-4 space-y-2.5">
            {stats.topSubjects.length === 0 ? (
              <div className="text-center text-slate-400 text-xs py-4">No subjects logged yet</div>
            ) : stats.topSubjects.map(([subject, count]) => {
              const pct = stats.topSubjects[0] ? Math.round((count / stats.topSubjects[0][1]) * 100) : 0;
              return (
                <div key={subject}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-700 truncate">{subject}</span>
                    <span className="text-slate-400">{count}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#0C447C] rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CLASS DIARY TAB ──────────────────────────────────────────────────────────

export function TeachingClassDiaryTab() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const isAdminView = ADMIN_SUMMARY_ROLES.includes(user?.role ?? '');

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
      {editingEntry && <CreateDiaryModal entry={editingEntry} onClose={() => setEditingEntry(null)} />}

      {isAdminView && <ClassDiarySummary entries={list} />}

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
                          onClick={() => setEditingEntry(entry)}
                          title={entry.shared ? 'Editing a shared entry does not update what parents already received — re-share after saving' : undefined}
                          className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-600"
                        >
                          Edit
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
