import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import syllabusService from '../../../services/syllabus.service';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const TRACK_STATUS_STYLE: Record<string, { cls: string; label: string }> = {
  on_track:    { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'On Track' },
  behind:      { cls: 'bg-red-50 text-red-700 border-red-200',             label: 'Behind' },
  completed:   { cls: 'bg-blue-50 text-blue-700 border-blue-200',          label: 'Completed' },
  not_started: { cls: 'bg-slate-100 text-slate-600 border-slate-200',      label: 'Not Started' },
};

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
export function TeachingSyllabusTab() {
  const qc = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterGrade, setFilterGrade] = useState('');
  const [filterTrack, setFilterTrack] = useState('');

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
        <a href="/academics"
          className="px-4 py-2 bg-[#0C447C] text-white text-sm font-medium rounded-lg hover:bg-[#0b3d6e] transition-colors">
          Design Syllabus in Academics →
        </a>
      </div>

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
                          <label key={`${topic.unitNo}-${topic.topicNo}`} className="flex items-center gap-2.5 py-1.5 border-b border-slate-50 last:border-0 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!!topic.isCovered}
                              onChange={(e) => markTopicMut.mutate({ id: s._id, unitNo: topic.unitNo, topicNo: topic.topicNo, isCovered: e.target.checked })}
                              className="w-4 h-4 rounded border-slate-300 text-[#0C447C] focus:ring-[#0C447C]"
                            />
                            <span className="text-xs text-slate-400 shrink-0">U{topic.unitNo}</span>
                            <span className={`text-sm flex-1 ${topic.isCovered ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                              {topic.topicNo}. {topic.topicName}
                            </span>
                            {topic.isCovered && topic.coveredDate && (
                              <span className="text-xs text-emerald-600">✓ {new Date(topic.coveredDate).toLocaleDateString()}</span>
                            )}
                          </label>
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
    </div>
  );
}
