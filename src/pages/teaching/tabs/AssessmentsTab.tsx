import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as assessmentApi from '../../../services/assessment.api';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const TYPE_LABEL: Record<string, string> = {
  quiz: 'Quiz', class_test: 'Class Test', unit_test: 'Unit Test',
  mid_term: 'Mid Term', final_exam: 'Final Exam', assignment: 'Assignment',
  project: 'Project', practical: 'Practical', oral: 'Oral',
};

const STATUS_STYLE: Record<string, string> = {
  draft:             'bg-slate-100 text-slate-600 border-slate-200',
  scheduled:         'bg-blue-50 text-blue-700 border-blue-200',
  ongoing:           'bg-amber-50 text-amber-700 border-amber-200',
  completed:         'bg-purple-50 text-purple-700 border-purple-200',
  result_published:  'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled:         'bg-slate-100 text-slate-500 border-slate-200',
};

const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft', scheduled: 'Scheduled', ongoing: 'Ongoing',
  completed: 'Completed', result_published: 'Results Published', cancelled: 'Cancelled',
};

function fmtDate(d?: string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── VIEW RESULTS MODAL (real data - assessment_marks collection) ─────────────
function ViewResultsModal({ assessment, onClose }: { assessment: any; onClose: () => void }) {
  const { data: marksResponse, isLoading } = useQuery({
    queryKey: ['assessment-marks', assessment._id],
    queryFn: () => assessmentApi.fetchMarks({ assessmentId: assessment._id, limit: 200 }),
  });
  const marks: any[] = marksResponse?.data ?? [];

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-slate-900">{assessment.title}</h2>
            <p className="text-xs text-slate-400">{assessment.grade}{assessment.section ? ` - ${assessment.section}` : ''} · Results</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="text-center py-10 text-slate-400 text-sm">Loading results…</div>
          ) : marks.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">
              No marks entered yet for this assessment. Enter marks in the Assessments module's Mark Entry tab.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Roll No', 'Student', 'Subject', 'Marks', '%', 'Grade', 'Result'].map(h => (
                    <th key={h} className="text-left py-2 px-2 text-xs font-semibold text-slate-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {marks.map((m: any) => (
                  <tr key={m._id} className="border-b border-slate-50">
                    <td className="py-2 px-2 text-xs">{m.rollNumber}</td>
                    <td className="py-2 px-2 text-xs font-medium">{m.studentName}</td>
                    <td className="py-2 px-2 text-xs">{m.subject}</td>
                    <td className="py-2 px-2 text-xs font-mono">
                      {m.isAbsent ? 'Absent' : m.isExempt ? 'Exempt' : `${m.obtainedMarks ?? '—'}/${m.totalMarks}`}
                    </td>
                    <td className="py-2 px-2 text-xs">{m.percentage != null ? `${m.percentage}%` : '—'}</td>
                    <td className="py-2 px-2 text-xs">{m.grade_result || '—'}</td>
                    <td className="py-2 px-2 text-xs capitalize">{m.result || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── ASSESSMENTS TAB ──────────────────────────────────────────────────────────
// Previously this entire tab (5 modals: Create/Edit/Grade/Extend/Results) was
// built on top of the wrong collection entirely - it queried
// teachingService.getAssignments({ type: 'test' }), i.e. the
// Homework/Assignments system, filtered by a type field, and had zero
// connection to the real, full-featured standalone Assessments module
// (question banks, mark entry, analytics, report cards). A teacher entering
// real marks there would never show up here, and vice versa.
//
// Rebuilt following the same pattern already proven for Timetable: create
// and manage in the authoritative place (the real Assessments module),
// view real data here. Results viewing is real and live here since it's a
// low-risk read against the correct collection.
export function TeachingAssessmentsTab() {
  const [viewResults, setViewResults] = useState<any>(null);

  const { data: response, isLoading } = useQuery({
    queryKey: ['real-assessments'],
    queryFn: () => assessmentApi.fetchAssessments({ limit: 100 }),
  });

  const list: any[] = response?.data ?? (Array.isArray(response) ? response : []);

  return (
    <div>
      {viewResults && <ViewResultsModal assessment={viewResults} onClose={() => setViewResults(null)} />}

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Assessments</h1>
          <p className="text-sm text-slate-500 mt-0.5">{list.length} assessment{list.length !== 1 ? 's' : ''}</p>
        </div>
        <a href="/assessments"
          className="px-4 py-2 bg-[#0C447C] text-white text-sm font-medium rounded-lg hover:bg-[#0b3d6e] transition-colors flex items-center gap-1.5">
          Manage in Assessments Module →
        </a>
      </div>

      <p className="text-xs text-slate-400 mb-4 -mt-2">
        Create assessments, set up question banks, and enter marks in the full Assessments module. This is a live view of the same real data.
      </p>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-slate-400 gap-2">
          <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/>
            <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          Loading assessments…
        </div>
      ) : list.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-16 text-center">
          <div className="text-5xl mb-4">📝</div>
          <div className="font-semibold text-slate-700 text-lg mb-1">No assessments yet</div>
          <div className="text-sm text-slate-400 mb-5">Create quizzes, tests, and exams in the Assessments module to track student progress</div>
          <a href="/assessments" className="inline-block px-4 py-2 bg-[#0C447C] text-white text-sm font-medium rounded-lg hover:bg-[#0b3d6e] transition-colors">
            Go to Assessments Module
          </a>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Title', 'Type', 'Grade', 'Subjects', 'Term', 'Dates', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap bg-slate-50">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.map((a: any) => (
                  <tr key={a._id} className="border-b border-slate-50 hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-medium text-slate-800">{a.title}</td>
                    <td className="py-3 px-4 text-xs text-slate-600">{TYPE_LABEL[a.type] || a.type}</td>
                    <td className="py-3 px-4 text-xs text-slate-600">{a.grade}{a.section ? ` - ${a.section}` : ''}</td>
                    <td className="py-3 px-4 text-xs text-slate-500 max-w-[160px] truncate">
                      {(a.subjects || []).map((s: any) => s.subject).join(', ') || '—'}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500">{a.term || '—'}</td>
                    <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">{fmtDate(a.startDate)}{a.endDate ? ` – ${fmtDate(a.endDate)}` : ''}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLE[a.status] ?? STATUS_STYLE.draft}`}>
                        {STATUS_LABEL[a.status] ?? a.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button onClick={() => setViewResults(a)} className="text-xs text-[#0C447C] font-medium hover:underline">
                        View Results
                      </button>
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
