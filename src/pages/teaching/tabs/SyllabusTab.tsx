import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import syllabusService from '../../../services/syllabus.service';
import { TeacherDropdown } from './shared';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const TRACK_STATUS_STYLE: Record<string, { cls: string; label: string }> = {
  on_track:    { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'On Track' },
  behind:      { cls: 'bg-red-50 text-red-700 border-red-200',             label: 'Behind' },
  completed:   { cls: 'bg-blue-50 text-blue-700 border-blue-200',          label: 'Completed' },
  not_started: { cls: 'bg-slate-100 text-slate-600 border-slate-200',      label: 'Not Started' },
};

const LESSON_TYPE_ICON: Record<string, string> = { video: '🎬', document: '📄', reading: '📖', link: '🔗' };
const LESSON_TYPE_LABEL: Record<string, string> = { video: 'Video', document: 'Document', reading: 'Reading', link: 'Link' };

function Spin() {
  return (
    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
      <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}

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

// ─── SYLLABUS TAB (Teaching Management) ────────────────────────────────────────
// Previously this whole tab was built on a completely separate "chapters"
// data model (SyllabusCoverage collection) disconnected from the real
// syllabus design in Academics - a teacher marking progress here and a
// coordinator reviewing "the syllabus" there were never looking at the
// same thing. This is now a real, live tracking view into the same
// unified syllabus data: teachers mark actual topics (designed in
// Academics) as covered, and it updates the exact same record a
// coordinator sees. Designing a new syllabus happens in Academics ->
// Syllabus Manager, matching the same pattern already proven for
// Timetable and Assessments.
// ─── TEACHER WEEKLY PLANNER ─────────────────────────────────────────────────
// A genuine "what am I teaching this week" view - separate from the
// coverage list below because it answers a different question (not "how
// far along is this whole syllabus" but "what do I actually need to teach
// in the next few days, across every class I have"). Requires picking a
// teacher explicitly (via the same TeacherDropdown used everywhere else in
// Teaching) rather than assuming the logged-in user's own identity, since
// the auth user record has no linked staff/teacher id to resolve that
// safely - a coordinator can just as easily check any teacher's week this
// way too.
function WeeklyPlannerView() {
  const qc = useQueryClient();
  const [teacher, setTeacher] = useState<any>(null);

  const { data: weekly = [], isLoading } = useQuery({
    queryKey: ['syllabus-weekly-planner', teacher?._id],
    queryFn: () => syllabusService.getWeeklyPlanner(teacher._id),
    enabled: !!teacher?._id,
  });

  const markSubTopicMut = useMutation({
    mutationFn: (vars: { id: string; unitNo: number; topicNo: number; subTopicNo: number; isCovered: boolean }) =>
      syllabusService.markSubTopic(vars.id, { unitNo: vars.unitNo, topicNo: vars.topicNo, subTopicNo: vars.subTopicNo, isCovered: vars.isCovered, coveredBy: teacher?.firstName ? `${teacher.firstName} ${teacher.lastName}` : 'Teacher' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['syllabus-weekly-planner', teacher?._id] }),
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to update coverage'),
  });

  const totalSubTopics = weekly.reduce((sum: number, s: any) => sum + s.subTopics.length, 0);
  const totalCovered = weekly.reduce((sum: number, s: any) => sum + s.subTopics.filter((t: any) => t.isCovered).length, 0);

  return (
    <div>
      <div className="mb-4 max-w-xs">
        <TeacherDropdown value={teacher} onSelect={setTeacher} label="View weekly plan for" />
      </div>

      {!teacher ? (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-16 text-center">
          <div className="text-5xl mb-4">🗓️</div>
          <div className="font-semibold text-slate-700 text-lg mb-1">Select a teacher</div>
          <div className="text-sm text-slate-400">See exactly what they're teaching this week, across every subject and class</div>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-16 text-slate-400 gap-2"><Spin /> Loading this week's plan…</div>
      ) : weekly.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-16 text-center">
          <div className="text-5xl mb-4">📭</div>
          <div className="font-semibold text-slate-700 text-lg mb-1">Nothing planned for this week yet</div>
          <div className="text-sm text-slate-400">Either no sub-topics are assigned to the current week, or this teacher's syllabi haven't started their term yet</div>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 mb-4 flex items-center justify-between" style={{ borderTop: '3px solid #7F77DD' }}>
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">This Week</div>
              <div className="text-2xl font-bold text-[#7F77DD]">{totalCovered}/{totalSubTopics} <span className="text-sm font-medium text-slate-400">sub-topics covered</span></div>
            </div>
          </div>
          <div className="space-y-3">
            {weekly.map((s: any) => (
              <div key={s.syllabusId} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
                  <span className="font-semibold text-slate-800">{s.subjectName}</span>
                  <span className="text-slate-400 text-xs mx-2">·</span>
                  <span className="text-sm text-slate-500">{s.gradeLevel}{s.sectionName ? ` — ${s.sectionName}` : ''}</span>
                  <span className="text-xs text-[#7F77DD] bg-[#F1F0FC] px-2 py-0.5 rounded-full ml-2">Week {s.currentWeek}</span>
                </div>
                <div className="px-5 py-2">
                  {s.subTopics.map((sub: any) => (
                    <label key={`${sub.unitNo}-${sub.topicNo}-${sub.subTopicNo}`} className="flex items-center gap-2.5 py-1.5 border-b border-slate-50 last:border-0 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!sub.isCovered}
                        onChange={(e) => markSubTopicMut.mutate({ id: s.syllabusId, unitNo: sub.unitNo, topicNo: sub.topicNo, subTopicNo: sub.subTopicNo, isCovered: e.target.checked })}
                        className="w-4 h-4 rounded border-slate-300 text-[#0C447C] focus:ring-[#0C447C]"
                      />
                      <span className="text-xs text-slate-400 shrink-0">{sub.topicName}</span>
                      <span className={`text-sm flex-1 ${sub.isCovered ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                        {sub.topicNo}.{sub.subTopicNo} {sub.subTopicName}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── ADD LESSON MODAL ───────────────────────────────────────────────────────
// Deliberately link-only (no file upload here) - matches the decision that
// LMS content is hosted by a third-party video service (YouTube/Vimeo/etc)
// or an existing document link, not uploaded through Eldermin itself.
function AddLessonModal({ syllabusId, unitNo, topicNo, onClose }: { syllabusId: string; unitNo: number; topicNo: number; onClose: () => void }) {
  const qc = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('video');
  const [url, setUrl] = useState('');
  const [dueDate, setDueDate] = useState('');

  const addMut = useMutation({
    mutationFn: () => syllabusService.addLesson(syllabusId, { unitNo, topicNo, title, description: description || undefined, type, url, dueDate: dueDate || undefined }),
    onSuccess: () => { toast.success('Lesson added'); qc.invalidateQueries({ queryKey: ['syllabi-teaching'] }); onClose(); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to add lesson'),
  });

  function submit() {
    if (!title.trim()) { toast.error('Enter a lesson title'); return; }
    if (!url.trim()) { toast.error('Paste a link (video, document, or reading)'); return; }
    addMut.mutate();
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800 text-sm">Add Lesson</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg leading-none">×</button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1 uppercase">Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Introduction to Fractions"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0C447C]/20" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1 uppercase">Type</label>
            <select value={type} onChange={e => setType(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
              {Object.entries(LESSON_TYPE_LABEL).map(([k, label]) => <option key={k} value={k}>{LESSON_TYPE_ICON[k]} {label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1 uppercase">
              {type === 'video' ? 'Video Link (YouTube, Vimeo…)' : type === 'document' ? 'Document Link' : type === 'reading' ? 'Reading Link' : 'Link'}
            </label>
            <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://…"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0C447C]/20" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1 uppercase">Description (optional)</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0C447C]/20 resize-none" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1 uppercase">Due Date (optional)</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0C447C]/20" />
            <p className="text-[11px] text-slate-400 mt-1">Setting this also adds it to the class's Homework list in Parent Portal.</p>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 text-xs border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium">Cancel</button>
          <button onClick={submit} disabled={addMut.isPending} className="px-4 py-2 text-xs bg-[#0C447C] text-white rounded-lg hover:bg-[#0b3d6e] font-medium disabled:opacity-50">
            {addMut.isPending ? 'Adding…' : 'Add Lesson'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function TeachingSyllabusTab() {
  const qc = useQueryClient();
  const [view, setView] = useState<'coverage' | 'weekly'>('coverage');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterGrade, setFilterGrade] = useState('');
  const [filterTrack, setFilterTrack] = useState('');
  const [addLessonFor, setAddLessonFor] = useState<{ syllabusId: string; unitNo: number; topicNo: number } | null>(null);

  const { data: rawList = [], isLoading } = useQuery({
    queryKey: ['syllabi-teaching'],
    queryFn: () => syllabusService.getAll(),
  });
  const list: any[] = (Array.isArray(rawList) ? rawList : (rawList as any)?.data ?? [])
    .filter((s: any) => !filterGrade || s.gradeLevel === filterGrade)
    .filter((s: any) => !filterTrack || s.trackStatus === filterTrack);

  const markTopicMut = useMutation({
    mutationFn: (vars: { id: string; unitNo: number; topicNo: number; isCovered: boolean }) =>
      syllabusService.markTopic(vars.id, { unitNo: vars.unitNo, topicNo: vars.topicNo, isCovered: vars.isCovered, coveredBy: 'Teacher' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['syllabi-teaching'] }),
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to update coverage'),
  });

  const markSubTopicMut = useMutation({
    mutationFn: (vars: { id: string; unitNo: number; topicNo: number; subTopicNo: number; isCovered: boolean }) =>
      syllabusService.markSubTopic(vars.id, { unitNo: vars.unitNo, topicNo: vars.topicNo, subTopicNo: vars.subTopicNo, isCovered: vars.isCovered, coveredBy: 'Teacher' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['syllabi-teaching'] }),
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to update coverage'),
  });

  const deleteLessonMut = useMutation({
    mutationFn: (vars: { id: string; unitNo: number; topicNo: number; lessonNo: number }) =>
      syllabusService.deleteLesson(vars.id, { unitNo: vars.unitNo, topicNo: vars.topicNo, lessonNo: vars.lessonNo }),
    onSuccess: () => { toast.success('Lesson removed'); qc.invalidateQueries({ queryKey: ['syllabi-teaching'] }); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to remove lesson'),
  });

  const setPublishedMut = useMutation({
    mutationFn: (vars: { id: string; published: boolean }) => syllabusService.setPublished(vars.id, vars.published),
    onSuccess: (_data, vars) => { toast.success(vars.published ? 'Published — students can now see this course' : 'Unpublished'); qc.invalidateQueries({ queryKey: ['syllabi-teaching'] }); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to update publish status'),
  });

  const totalRecords = list.length;
  const avgCoverage = totalRecords > 0 ? Math.round(list.reduce((s, x) => s + (x.coveragePct || 0), 0) / totalRecords) : 0;
  const onTrack = list.filter(s => s.trackStatus === 'on_track' || s.trackStatus === 'completed').length;
  const behind = list.filter(s => s.trackStatus === 'behind').length;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Syllabus Coverage</h1>
          <p className="text-sm text-slate-500 mt-0.5">Track topic-by-topic coverage against the real syllabus design</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 rounded-lg p-0.5">
            <button onClick={() => setView('coverage')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${view === 'coverage' ? 'bg-white text-[#0C447C] shadow-sm' : 'text-slate-500'}`}>
              All Syllabi
            </button>
            <button onClick={() => setView('weekly')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${view === 'weekly' ? 'bg-white text-[#0C447C] shadow-sm' : 'text-slate-500'}`}>
              This Week
            </button>
          </div>
          <a href="/academics"
            className="px-4 py-2 bg-[#0C447C] text-white text-sm font-medium rounded-lg hover:bg-[#0b3d6e] transition-colors">
            Design Syllabus in Academics →
          </a>
        </div>
      </div>

      {view === 'weekly' ? <WeeklyPlannerView /> : (
      <>
      {totalRecords > 0 && (
        <div className="grid grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Avg Coverage', value: `${avgCoverage}%`, color: '#0C447C' },
            { label: 'On Track', value: onTrack, color: '#1D9E75' },
            { label: 'Behind', value: behind, color: '#E24B4A' },
            { label: 'Total Syllabi', value: totalRecords, color: '#7F77DD' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4" style={{ borderTop: `3px solid ${s.color}` }}>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{s.label}</div>
              <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

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
          <button onClick={() => { setFilterGrade(''); setFilterTrack(''); }} className="text-xs text-[#0C447C] hover:underline">
            Clear filters
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-slate-400 gap-2"><Spin /> Loading syllabi…</div>
      ) : list.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-16 text-center">
          <div className="text-5xl mb-4">📚</div>
          <div className="font-semibold text-slate-700 text-lg mb-1">No syllabi designed yet</div>
          <div className="text-sm text-slate-400 mb-5">A coordinator needs to design a syllabus in Academics before coverage can be tracked here</div>
          <a href="/academics" className="inline-block px-4 py-2 bg-[#0C447C] text-white text-sm font-medium rounded-lg hover:bg-[#0b3d6e] transition-colors">
            Go to Academics
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((s: any) => {
            const pct = s.coveragePct || 0;
            const trackInfo = TRACK_STATUS_STYLE[s.trackStatus] ?? TRACK_STATUS_STYLE.not_started;
            const isExpanded = expandedId === s._id;
            const barColor = pct >= 80 ? '#10b981' : pct >= 60 ? '#EF9F27' : '#ef4444';
            const allTopics = (s.units || []).flatMap((u: any) => (u.topics || []).map((t: any) => ({ ...t, unitNo: u.unitNo, unitName: u.unitName })));
            return (
              <div key={s._id} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="flex items-center gap-4 px-5 py-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-slate-800">{s.subjectName}</span>
                      <span className="text-slate-400 text-xs">·</span>
                      <span className="text-sm text-slate-500">{s.gradeLevel}{s.sectionName ? ` — ${s.sectionName}` : ''}</span>
                      {s.teacherName && <><span className="text-slate-400 text-xs">·</span><span className="text-xs text-slate-400">{s.teacherName}</span></>}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 max-w-xs"><PBar pct={pct} color={barColor} /></div>
                      <span className="text-sm font-semibold" style={{ color: barColor }}>{pct}%</span>
                      <span className="text-xs text-slate-400">{s.coveredTopics || 0}/{s.totalTopics || 0} topics</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`inline-flex items-center px-2 py-0.5 border rounded-full text-xs font-medium ${trackInfo.cls}`}>
                      {trackInfo.label}
                    </span>
                    <button
                      title={s.publishedToStudents ? 'Students can see this course - click to unpublish' : 'Not visible to students yet - click to publish'}
                      onClick={() => setPublishedMut.mutate({ id: s._id, published: !s.publishedToStudents })}
                      disabled={setPublishedMut.isPending}
                      className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors border disabled:opacity-50 ${s.publishedToStudents ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'}`}
                    >
                      {s.publishedToStudents ? '✓ Published' : 'Unpublished'}
                    </button>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : s._id)}
                      className="px-2.5 py-1 text-xs bg-[#0C447C] text-white rounded-lg hover:bg-[#0b3d6e] transition-colors"
                    >
                      {isExpanded ? 'Hide' : 'Topics'}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-slate-100 px-5 pb-4 pt-3">
                    {allTopics.length === 0 ? (
                      <div className="text-sm text-slate-400 py-4 text-center">
                        No topics designed yet for this syllabus - add units/topics in Academics → Syllabus Manager
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {allTopics.map((topic: any) => (
                          <div key={`${topic.unitNo}-${topic.topicNo}`} className="py-1.5 border-b border-slate-50 last:border-0">
                            <label className="flex items-center gap-2.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={!!topic.isCovered}
                                disabled={(topic.subTopics || []).length > 0}
                                onChange={(e) => markTopicMut.mutate({ id: s._id, unitNo: topic.unitNo, topicNo: topic.topicNo, isCovered: e.target.checked })}
                                className="w-4 h-4 rounded border-slate-300 text-[#0C447C] focus:ring-[#0C447C] disabled:opacity-40"
                              />
                              <span className="text-xs text-slate-400 shrink-0">U{topic.unitNo}</span>
                              <span className={`text-sm flex-1 ${topic.isCovered ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                                {topic.topicNo}. {topic.topicName}
                              </span>
                              {topic.isCovered && topic.coveredDate && (
                                <span className="text-xs text-emerald-600">✓ {new Date(topic.coveredDate).toLocaleDateString()}</span>
                              )}
                            </label>
                            {(topic.subTopics || []).length > 0 && (
                              <div className="ml-8 mt-1 pl-2 border-l-2 border-slate-100 space-y-1">
                                {topic.subTopics.map((sub: any) => (
                                  <label key={sub.subTopicNo} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={!!sub.isCovered}
                                      onChange={(e) => markSubTopicMut.mutate({ id: s._id, unitNo: topic.unitNo, topicNo: topic.topicNo, subTopicNo: sub.subTopicNo, isCovered: e.target.checked })}
                                      className="w-3.5 h-3.5 rounded border-slate-300 text-[#0C447C] focus:ring-[#0C447C]"
                                    />
                                    <span className={`text-xs flex-1 ${sub.isCovered ? 'line-through text-slate-400' : 'text-slate-600'}`}>
                                      {topic.topicNo}.{sub.subTopicNo} {sub.subTopicName}
                                    </span>
                                    {sub.plannedWeek && (
                                      <span className="text-[10px] text-[#7F77DD] bg-[#F1F0FC] px-1.5 py-0.5 rounded-full">Week {sub.plannedWeek}</span>
                                    )}
                                  </label>
                                ))}
                              </div>
                            )}

                            {/* ── LMS lessons attached to this topic ── */}
                            <div className="ml-8 mt-1.5 space-y-1">
                              {(topic.lessons || []).slice().sort((a: any, b: any) => a.order - b.order).map((lesson: any) => (
                                <div key={lesson.lessonNo} className="flex items-center gap-2 text-xs bg-slate-50 rounded-lg px-2.5 py-1.5">
                                  <span className="shrink-0">{LESSON_TYPE_ICON[lesson.type] || '📎'}</span>
                                  <a href={lesson.url || lesson.fileUrl} target="_blank" rel="noreferrer" className="flex-1 text-[#0C447C] hover:underline truncate">
                                    {lesson.title}
                                  </a>
                                  <span className="text-[10px] text-slate-400 shrink-0">{LESSON_TYPE_LABEL[lesson.type]}</span>
                                  <button
                                    onClick={() => { if (window.confirm(`Remove lesson "${lesson.title}"?`)) deleteLessonMut.mutate({ id: s._id, unitNo: topic.unitNo, topicNo: topic.topicNo, lessonNo: lesson.lessonNo }); }}
                                    className="text-slate-300 hover:text-red-500 shrink-0 px-1"
                                  >×</button>
                                </div>
                              ))}
                              <button
                                onClick={() => setAddLessonFor({ syllabusId: s._id, unitNo: topic.unitNo, topicNo: topic.topicNo })}
                                className="text-[11px] text-[#0C447C] hover:underline font-medium"
                              >
                                + Add lesson content
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      </>
      )}

      {addLessonFor && (
        <AddLessonModal
          syllabusId={addLessonFor.syllabusId}
          unitNo={addLessonFor.unitNo}
          topicNo={addLessonFor.topicNo}
          onClose={() => setAddLessonFor(null)}
        />
      )}
    </div>
  );
}
