import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import teachingService from '../../../services/teaching.service';
import {
  ModalShell, FormSection, TeacherDropdown, SubjectDropdown,
  GradeLevelDropdown, inputCls, labelCls,
} from './shared';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const TRACK_STATUS_STYLE: Record<string, { cls: string; label: string }> = {
  on_track:    { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'On Track' },
  behind:      { cls: 'bg-red-50 text-red-700 border-red-200',             label: 'Behind' },
  completed:   { cls: 'bg-blue-50 text-blue-700 border-blue-200',          label: 'Completed' },
  not_started: { cls: 'bg-slate-100 text-slate-600 border-slate-200',      label: 'Not Started' },
};

// ─── SPINNER ──────────────────────────────────────────────────────────────────

function Spin() {
  return (
    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
      <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}

// ─── PROGRESS BAR ─────────────────────────────────────────────────────────────

function PBar({ pct, color = '#0C447C' }: { pct: number; color?: string }) {
  const bg = pct >= 80 ? '#10b981' : pct >= 60 ? '#EF9F27' : '#ef4444';
  return (
    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(pct, 100)}%`, background: color === '#0C447C' ? bg : color }}
      />
    </div>
  );
}

// ─── UPSERT SYLLABUS MODAL ────────────────────────────────────────────────────

interface ChapterRow {
  chapterNo: number;
  chapterName: string;
  totalLessons: number;
  coveredLessons: number;
  isCovered: boolean;
  notes: string;
}

interface SyllabusForm {
  teacherName: string;
  teacherId: string;
  subject: string;
  gradeLevel: string;
  sectionName: string;
  totalTopics: number;
  coveredTopics: number;
  trackStatus: string;
  chapters: ChapterRow[];
}

const EMPTY_FORM: SyllabusForm = {
  teacherName: '', teacherId: '', subject: '', gradeLevel: '', sectionName: '',
  totalTopics: 0, coveredTopics: 0, trackStatus: 'not_started', chapters: [],
};

function UpsertSyllabusModal({ existing, onClose }: { existing?: any; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<SyllabusForm>(
    existing
      ? {
          teacherName: existing.teacherName || '',
          teacherId: existing.teacherId || '',
          subject: existing.subject || '',
          gradeLevel: existing.gradeLevel || '',
          sectionName: existing.sectionName || '',
          totalTopics: existing.totalTopics || 0,
          coveredTopics: existing.coveredTopics || 0,
          trackStatus: existing.trackStatus || 'not_started',
          chapters: (existing.chapters || []).map((c: any) => ({ ...c })),
        }
      : EMPTY_FORM,
  );
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);

  const mut = useMutation({
    mutationFn: (payload: SyllabusForm) => teachingService.upsertSyllabus(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['syllabus'] });
      toast.success(existing ? 'Syllabus updated' : 'Syllabus record created');
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });

  function handleTeacherSelect(t: any) {
    setSelectedTeacher(t);
    setForm(prev => ({
      ...prev,
      teacherId: t._id,
      teacherName: `${t.firstName} ${t.lastName}`,
      subject: '',
    }));
  }

  function addChapter() {
    setForm(prev => ({
      ...prev,
      chapters: [
        ...prev.chapters,
        { chapterNo: prev.chapters.length + 1, chapterName: '', totalLessons: 5, coveredLessons: 0, isCovered: false, notes: '' },
      ],
    }));
  }

  function updateChapter(i: number, field: keyof ChapterRow, val: any) {
    setForm(prev => {
      const chapters = prev.chapters.map((c, idx) =>
        idx === i ? { ...c, [field]: val, isCovered: idx === i && field === 'coveredLessons' ? val >= c.totalLessons : c.isCovered } : c,
      );
      const coveredTopics = chapters.filter(c => c.isCovered).length;
      return { ...prev, chapters, coveredTopics, totalTopics: chapters.length };
    });
  }

  function removeChapter(i: number) {
    setForm(prev => {
      const chapters = prev.chapters.filter((_, idx) => idx !== i).map((c, idx) => ({ ...c, chapterNo: idx + 1 }));
      return { ...prev, chapters, totalTopics: chapters.length, coveredTopics: chapters.filter(c => c.isCovered).length };
    });
  }

  const coveragePct = form.totalTopics > 0 ? Math.round((form.coveredTopics / form.totalTopics) * 100) : 0;
  const teacherSubjects: string[] = selectedTeacher?.subjectsCanTeach ?? [];
  const canSubmit = form.subject && form.gradeLevel && form.teacherName && !mut.isPending;

  return (
    <ModalShell
      title={existing ? 'Update Syllabus Coverage' : 'Add Syllabus Record'}
      sub="Track chapter-by-chapter coverage for this class"
      onClose={onClose}
      maxWidth="max-w-3xl"
    >
      <div className="p-6">

        <FormSection title="Teacher & Class">
          {!existing && <TeacherDropdown value={selectedTeacher} onSelect={handleTeacherSelect} />}
          {existing && (
            <div className="p-3 bg-blue-50 rounded-lg text-sm font-medium text-[#0C447C]">
              {existing.teacherName} · {existing.subject} · {existing.gradeLevel}
            </div>
          )}
          {!existing && (
            <div className="grid grid-cols-3 gap-3 mt-3">
              <SubjectDropdown subjects={teacherSubjects} value={form.subject} onChange={v => setForm(prev => ({ ...prev, subject: v }))} />
              <GradeLevelDropdown value={form.gradeLevel} onChange={v => setForm(prev => ({ ...prev, gradeLevel: v }))} />
              <div>
                <label className={labelCls}>Section</label>
                <input value={form.sectionName} onChange={e => setForm(prev => ({ ...prev, sectionName: e.target.value }))} placeholder="e.g. A" className={inputCls} />
              </div>
            </div>
          )}
        </FormSection>

        <FormSection title="Track Status">
          <div className="flex gap-2 flex-wrap">
            {Object.entries(TRACK_STATUS_STYLE).map(([k, v]) => (
              <button
                key={k}
                type="button"
                onClick={() => setForm(prev => ({ ...prev, trackStatus: k }))}
                className={`px-3 py-1.5 text-xs font-medium border rounded-lg transition-colors ${
                  form.trackStatus === k ? v.cls + ' border-2' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </FormSection>

        {/* Coverage summary */}
        {form.chapters.length > 0 && (
          <div className="mb-5 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium">Coverage Summary</span>
              <span className="font-semibold text-[#0C447C]">{coveragePct}%</span>
            </div>
            <PBar pct={coveragePct} />
            <div className="text-xs text-slate-500 mt-2">{form.coveredTopics} of {form.totalTopics} chapters covered</div>
          </div>
        )}

        <FormSection title={`Chapters (${form.chapters.length})`}>
          {form.chapters.length > 0 && (
            <div className="mb-3">
              <div className="grid gap-2 px-1 mb-2" style={{ gridTemplateColumns: '32px 1fr 80px 80px 80px 32px' }}>
                <span className="text-xs font-semibold text-slate-400 uppercase">#</span>
                <span className="text-xs font-semibold text-slate-400 uppercase">Chapter Name</span>
                <span className="text-xs font-semibold text-slate-400 uppercase text-center">Lessons</span>
                <span className="text-xs font-semibold text-slate-400 uppercase text-center">Covered</span>
                <span className="text-xs font-semibold text-slate-400 uppercase text-center">Done?</span>
                <span />
              </div>
              <div className="space-y-2">
                {form.chapters.map((c, i) => (
                  <div key={i} className="grid gap-2 items-center" style={{ gridTemplateColumns: '32px 1fr 80px 80px 80px 32px' }}>
                    <div className="text-xs font-semibold text-slate-400 text-right">{c.chapterNo}.</div>
                    <input
                      value={c.chapterName}
                      onChange={e => updateChapter(i, 'chapterName', e.target.value)}
                      placeholder={`Chapter ${c.chapterNo}`}
                      className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0C447C]"
                    />
                    <input
                      type="number" min={1} max={100}
                      value={c.totalLessons}
                      onChange={e => updateChapter(i, 'totalLessons', parseInt(e.target.value) || 1)}
                      className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0C447C] text-center"
                    />
                    <input
                      type="number" min={0} max={c.totalLessons}
                      value={c.coveredLessons}
                      onChange={e => updateChapter(i, 'coveredLessons', parseInt(e.target.value) || 0)}
                      className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0C447C] text-center"
                    />
                    <div className="flex justify-center">
                      <input
                        type="checkbox"
                        checked={c.isCovered}
                        onChange={e => updateChapter(i, 'isCovered', e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-[#0C447C] focus:ring-[#0C447C]"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeChapter(i)}
                      className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={addChapter}
            className="text-xs font-medium text-[#0C447C] hover:text-[#0b3d6e] flex items-center gap-1 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
            Add Chapter
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
            {existing ? 'Update Syllabus' : 'Create Record'}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

// ─── CHAPTER UPDATE MODAL ─────────────────────────────────────────────────────

function UpdateChapterModal({ syllabusId, chapter, chapterIndex, onClose }: {
  syllabusId: string;
  chapter: any;
  chapterIndex: number;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [covered, setCovered] = useState(chapter.coveredLessons || 0);
  const [isDone, setIsDone] = useState(chapter.isCovered || false);
  const [notes, setNotes] = useState(chapter.notes || '');

  const mut = useMutation({
    mutationFn: () => teachingService.updateChapter(syllabusId, chapterIndex, {
      coveredLessons: covered,
      isCovered: isDone,
      notes,
      coveredDate: isDone ? new Date().toISOString() : undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['syllabus'] });
      toast.success('Chapter updated');
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });

  return (
    <ModalShell title={`Chapter ${chapter.chapterNo}: ${chapter.chapterName || 'Update'}`} onClose={onClose} maxWidth="max-w-sm">
      <div className="p-6 space-y-4">
        <div>
          <label className={labelCls}>Lessons Covered</label>
          <div className="flex items-center gap-3">
            <input
              type="number" min={0} max={chapter.totalLessons}
              value={covered}
              onChange={e => setCovered(parseInt(e.target.value) || 0)}
              className={`${inputCls} max-w-[100px]`}
            />
            <span className="text-sm text-slate-500">of {chapter.totalLessons} total</span>
          </div>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isDone}
            onChange={e => setIsDone(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-[#0C447C] focus:ring-[#0C447C]"
          />
          <span className="text-sm font-medium text-slate-700">Mark chapter as fully covered</span>
        </label>
        <div>
          <label className={labelCls}>Notes</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            placeholder="Any notes about this chapter's coverage…"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0C447C] resize-y"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button onClick={onClose} type="button"
            className="px-3 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={() => mut.mutate()}
            disabled={mut.isPending}
            className="px-4 py-2 text-sm text-white bg-[#0C447C] rounded-lg hover:bg-[#0b3d6e] transition-colors disabled:opacity-40 flex items-center gap-2"
          >
            {mut.isPending && <Spin />}
            Save
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

// ─── SYLLABUS TAB ─────────────────────────────────────────────────────────────

export function TeachingSyllabusTab() {
  const [showCreate, setShowCreate] = useState(false);
  const [editRecord, setEditRecord] = useState<any>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [chapterCtx, setChapterCtx] = useState<{ syllabusId: string; chapter: any; index: number } | null>(null);
  const [filterGrade, setFilterGrade] = useState('');
  const [filterTrack, setFilterTrack] = useState('');

  const { data: syllabus = [], isLoading } = useQuery({
    queryKey: ['syllabus', filterGrade, filterTrack],
    queryFn: () => teachingService.getSyllabus({
      ...(filterGrade ? { gradeLevel: filterGrade } : {}),
      ...(filterTrack ? { trackStatus: filterTrack } : {}),
    }),
  });

  const list = syllabus as any[];

  // Stats
  const totalRecords = list.length;
  const onTrack = list.filter(s => s.trackStatus === 'on_track').length;
  const behind = list.filter(s => s.trackStatus === 'behind').length;
  const avgCoverage = totalRecords > 0
    ? Math.round(list.reduce((sum, s) => sum + (s.coveragePct || 0), 0) / totalRecords)
    : 0;

  return (
    <div>
      {showCreate && <UpsertSyllabusModal onClose={() => setShowCreate(false)} />}
      {editRecord && <UpsertSyllabusModal existing={editRecord} onClose={() => setEditRecord(null)} />}
      {chapterCtx && (
        <UpdateChapterModal
          syllabusId={chapterCtx.syllabusId}
          chapter={chapterCtx.chapter}
          chapterIndex={chapterCtx.index}
          onClose={() => setChapterCtx(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Syllabus Coverage</h1>
          <p className="text-sm text-slate-500 mt-0.5">{totalRecords} record{totalRecords !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-[#0C447C] text-white text-sm font-medium rounded-lg hover:bg-[#0b3d6e] transition-colors flex items-center gap-1.5"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
          Add Record
        </button>
      </div>

      {/* Stats KPIs */}
      {totalRecords > 0 && (
        <div className="grid grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Avg Coverage', value: `${avgCoverage}%`, color: '#0C447C' },
            { label: 'On Track', value: onTrack, color: '#1D9E75' },
            { label: 'Behind', value: behind, color: '#E24B4A' },
            { label: 'Total Records', value: totalRecords, color: '#7F77DD' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4" style={{ borderTop: `3px solid ${s.color}` }}>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{s.label}</div>
              <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap items-center">
        <select
          value={filterGrade}
          onChange={e => setFilterGrade(e.target.value)}
          className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0C447C]"
        >
          <option value="">All Grades</option>
          {['Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12'].map(g => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
        <select
          value={filterTrack}
          onChange={e => setFilterTrack(e.target.value)}
          className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0C447C]"
        >
          <option value="">All Statuses</option>
          {Object.entries(TRACK_STATUS_STYLE).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        {(filterGrade || filterTrack) && (
          <button
            onClick={() => { setFilterGrade(''); setFilterTrack(''); }}
            className="text-xs text-[#0C447C] hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-slate-400 gap-2"><Spin /> Loading syllabus records…</div>
      ) : list.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-16 text-center">
          <div className="text-5xl mb-4">📚</div>
          <div className="font-semibold text-slate-700 text-lg mb-1">No syllabus records yet</div>
          <div className="text-sm text-slate-400 mb-5">Track subject coverage for each teacher and class</div>
          <button onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-[#0C447C] text-white text-sm font-medium rounded-lg hover:bg-[#0b3d6e] transition-colors">
            Add First Record
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((s: any) => {
            const pct = s.coveragePct || (s.totalTopics > 0 ? Math.round((s.coveredTopics / s.totalTopics) * 100) : 0);
            const trackInfo = TRACK_STATUS_STYLE[s.trackStatus] ?? TRACK_STATUS_STYLE.not_started;
            const isExpanded = expandedId === s._id;
            const barColor = pct >= 80 ? '#10b981' : pct >= 60 ? '#EF9F27' : '#ef4444';
            return (
              <div key={s._id} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                {/* Summary row */}
                <div className="flex items-center gap-4 px-5 py-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-slate-800">{s.subject}</span>
                      <span className="text-slate-400 text-xs">·</span>
                      <span className="text-sm text-slate-500">{s.gradeLevel}{s.sectionName ? ` — ${s.sectionName}` : ''}</span>
                      <span className="text-slate-400 text-xs">·</span>
                      <span className="text-xs text-slate-400">{s.teacherName}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 max-w-xs">
                        <PBar pct={pct} color={barColor} />
                      </div>
                      <span className="text-sm font-semibold" style={{ color: barColor }}>{pct}%</span>
                      <span className="text-xs text-slate-400">{s.coveredTopics}/{s.totalTopics} chapters</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`inline-flex items-center px-2 py-0.5 border rounded-full text-xs font-medium ${trackInfo.cls}`}>
                      {trackInfo.label}
                    </span>
                    <button
                      onClick={() => setEditRecord(s)}
                      className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : s._id)}
                      className="px-2.5 py-1 text-xs bg-[#0C447C] text-white rounded-lg hover:bg-[#0b3d6e] transition-colors"
                    >
                      {isExpanded ? 'Hide' : 'Chapters'}
                    </button>
                  </div>
                </div>

                {/* Chapters panel */}
                {isExpanded && (
                  <div className="border-t border-slate-100 px-5 pb-4 pt-3">
                    {(s.chapters || []).length === 0 ? (
                      <div className="text-sm text-slate-400 py-4 text-center">No chapters recorded — click Edit to add chapters</div>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-100">
                            {['#', 'Chapter', 'Lessons', 'Covered', 'Status', 'Notes', ''].map(h => (
                              <th key={h} className="text-left py-2 px-2 text-xs font-semibold text-slate-400 uppercase tracking-wide">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {(s.chapters || []).map((ch: any, i: number) => {
                            const chPct = ch.totalLessons > 0 ? Math.round((ch.coveredLessons / ch.totalLessons) * 100) : 0;
                            return (
                              <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                <td className="py-2 px-2 text-slate-400 text-xs">{ch.chapterNo}</td>
                                <td className="py-2 px-2 font-medium text-slate-800">{ch.chapterName || `Chapter ${ch.chapterNo}`}</td>
                                <td className="py-2 px-2 text-slate-500 text-center">{ch.totalLessons}</td>
                                <td className="py-2 px-2 text-center">
                                  <span className="font-semibold" style={{ color: chPct >= 100 ? '#10b981' : chPct > 50 ? '#EF9F27' : '#ef4444' }}>
                                    {ch.coveredLessons}
                                  </span>
                                </td>
                                <td className="py-2 px-2">
                                  {ch.isCovered
                                    ? <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs">Done</span>
                                    : <span className="px-2 py-0.5 bg-slate-100 text-slate-500 border border-slate-200 rounded-full text-xs">In Progress</span>}
                                </td>
                                <td className="py-2 px-2 text-slate-400 text-xs max-w-[140px] truncate">{ch.notes || '—'}</td>
                                <td className="py-2 px-2">
                                  <button
                                    onClick={() => setChapterCtx({ syllabusId: s._id, chapter: ch, index: i })}
                                    className="px-2 py-0.5 text-xs text-[#0C447C] border border-[#0C447C] rounded-lg hover:bg-blue-50 transition-colors"
                                  >
                                    Update
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
