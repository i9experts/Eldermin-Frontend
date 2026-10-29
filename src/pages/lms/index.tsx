import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap, BookOpen, ClipboardList, HelpCircle, Award, ArrowRight, Trophy,
} from 'lucide-react';
import { ModuleHeader } from '../../components/layout/ModuleHeader';
import { fetchLmsOverview } from '../../services/lms.service';
import { fetchLeaderboard, type LeaderboardRow } from '../../services/gamification.service';
import { GradeLevelDropdown, SectionDropdown } from '../teaching/tabs/shared';

// Phase 0 of the LMS unification effort (see eldermin-backend's src/lms/
// module): courses/lessons, assignments, self-paced quizzes and
// course-completion certificates already exist and work - they've just
// never had one named, navigable home. This page doesn't reimplement any
// of them; each card is a stat drawn from the existing dashboards plus a
// link into the real page that already does the work (Syllabus authoring
// lives in Teaching > Syllabus, quizzes are reviewed in Assessment >
// Quiz Review, etc.) so there is exactly one place each feature is
// actually built and maintained.
interface LmsOverview {
  courses: { published: number; totalLessons: number; draft: number; totalSyllabi: number };
  assignments: { total: number; overdue: number };
  quizzes: { pendingReview: number };
  certificates: { issued: number };
}

function StatCard({
  icon: Icon, label, value, detail, cta, onClick,
}: {
  icon: typeof BookOpen; label: string; value: number | string; detail?: string; cta: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="text-left bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:border-[#0C447C]/40 hover:shadow-md transition-all group"
    >
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#1e3a5f] to-blue-400 flex items-center justify-center">
          <Icon size={18} className="text-white" />
        </div>
        <ArrowRight size={16} className="text-gray-300 group-hover:text-[#0C447C] group-hover:translate-x-0.5 transition-all mt-1" />
      </div>
      <p className="text-2xl font-bold text-gray-800 mt-3">{value}</p>
      <p className="text-sm font-medium text-gray-600 mt-0.5">{label}</p>
      {detail && <p className="text-xs text-gray-400 mt-1">{detail}</p>}
      <p className="text-xs font-medium text-[#0C447C] mt-3">{cta} →</p>
    </button>
  );
}

function LeaderboardPanel() {
  const [grade, setGrade] = useState('');
  const [section, setSection] = useState('');
  const { data, isLoading, isError } = useQuery<LeaderboardRow[]>({
    queryKey: ['gamification', 'leaderboard', grade, section],
    queryFn: () => fetchLeaderboard({ grade: grade || undefined, section: section || undefined }),
  });

  return (
    <div className="mt-6 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Trophy size={18} className="text-amber-500" />
          <p className="text-sm font-semibold text-gray-700">Leaderboard</p>
          <span className="text-xs text-gray-400">Points earned from lessons, quizzes and course completions</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-36"><GradeLevelDropdown value={grade} onChange={(v) => { setGrade(v); setSection(''); }} label="" /></div>
          <div className="w-36"><SectionDropdown gradeLevel={grade} value={section} onChange={setSection} label="" /></div>
        </div>
      </div>

      {isLoading && <p className="text-sm text-gray-400">Loading leaderboard…</p>}
      {isError && <p className="text-sm text-red-500">Could not load the leaderboard — try again.</p>}
      {data && data.length === 0 && <p className="text-sm text-gray-400">No points earned yet.</p>}
      {data && data.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {['Rank', 'Student', 'Grade/Section', 'Points'].map((h) => (
                  <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.studentId} className="border-b border-gray-50 last:border-0">
                  <td className="px-3 py-2 text-sm font-semibold text-gray-700">
                    {row.rank <= 3 ? ['🥇', '🥈', '🥉'][row.rank - 1] : row.rank}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-700">{row.studentName}</td>
                  <td className="px-3 py-2 text-sm text-gray-400">{[row.currentGrade, row.currentSection].filter(Boolean).join(' - ') || '—'}</td>
                  <td className="px-3 py-2 text-sm font-semibold text-[#0C447C]">{row.totalPoints}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function LmsModulePage() {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useQuery<LmsOverview>({
    queryKey: ['lms', 'overview'],
    queryFn: () => fetchLmsOverview(),
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <ModuleHeader
        icon={GraduationCap}
        title="Learning (LMS)"
        subtitle="Courses, assignments, quizzes and certificates — one view across Syllabus, Teaching, Assessments and Certificates."
      />

      <div className="p-6 max-w-6xl mx-auto">
        {isLoading && <p className="text-sm text-gray-400">Loading overview…</p>}
        {isError && <p className="text-sm text-red-500">Could not load the LMS overview — try again.</p>}

        {data && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={BookOpen}
              label="Published Courses"
              value={data.courses.published}
              detail={`${data.courses.totalLessons} lesson(s) authored across ${data.courses.totalSyllabi} syllabi`}
              cta="Manage courses in Syllabus Tracking"
              onClick={() => navigate('/syllabus')}
            />
            <StatCard
              icon={ClipboardList}
              label="Assignments"
              value={data.assignments.total}
              detail={data.assignments.overdue > 0 ? `${data.assignments.overdue} overdue` : 'None overdue'}
              cta="Manage assignments in Teaching"
              onClick={() => navigate('/teaching')}
            />
            <StatCard
              icon={HelpCircle}
              label="Quizzes Awaiting Review"
              value={data.quizzes.pendingReview}
              detail="Self-paced online quiz submissions"
              cta="Review in Assessment & Results"
              onClick={() => navigate('/assessments')}
            />
            <StatCard
              icon={Award}
              label="Certificates Issued"
              value={data.certificates.issued}
              detail="Auto-issued on 100% course completion"
              cta="View Certificate Templates"
              onClick={() => navigate('/certificate-templates')}
            />
          </div>
        )}

        <LeaderboardPanel />

        <div className="mt-6 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm font-semibold text-gray-700 mb-1">How this fits together</p>
          <p className="text-xs text-gray-500 leading-relaxed">
            A teacher builds course content (units → topics → lessons) under <span className="font-medium">Teaching → Syllabus</span> and
            publishes it to students. Homework and projects are created and graded under <span className="font-medium">Teaching → Assignments</span>.
            Marking an assessment subject self-paced lets students take it themselves — subjective answers queue here for review under{' '}
            <span className="font-medium">Assessment & Results → Quiz Review</span>. Completing 100% of a published course automatically issues a
            certificate, if the school has a Course Completion template set up under <span className="font-medium">Certificate Templates</span>.
            Students and parents see all of it together in their own <span className="font-medium">My Learning</span> view.
            Completing a lesson, finishing a course or scoring well on a quiz earns points and badges automatically — the{' '}
            <span className="font-medium">Leaderboard</span> above ranks students by total points, filterable by grade/section.
          </p>
        </div>
      </div>
    </div>
  );
}
