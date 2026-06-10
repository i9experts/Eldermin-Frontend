import React, { useState } from 'react';
import {
  ClipboardList, Calendar, CheckCircle,
  AlertCircle, Plus, TrendingUp, Award,
  MessageSquare,
} from 'lucide-react';
import { EntranceTest, Interview } from './types';
import { useTests, useInterviews } from '../../hooks/useAdmissions';

// ── Score Circle ──────────────────────────────────────────────
const ScoreCircle: React.FC<{ score: number; max: number; size?: number }> = ({ score, max, size = 48 }) => {
  const pct = (score / max) * 100;
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  const color = pct >= 80 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#ef4444';
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f0f0f0" strokeWidth={4} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={4}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <span className="absolute text-[10px] font-bold" style={{ color }}>{pct.toFixed(0)}%</span>
    </div>
  );
};

// ── Entrance Test Card ────────────────────────────────────────
const TestCard: React.FC<{ test: EntranceTest; onView: (t: EntranceTest) => void }> = ({ test, onView }) => {
  const statusConfig: Record<string, { color: string; label: string }> = {
    scheduled:   { color: 'bg-blue-100 text-blue-700',    label: 'Scheduled'   },
    in_progress: { color: 'bg-amber-100 text-amber-700',  label: 'In Progress' },
    completed:   { color: 'bg-emerald-100 text-emerald-700', label: 'Completed' },
    cancelled:   { color: 'bg-red-100 text-red-700',      label: 'Cancelled'   },
    pending:     { color: 'bg-gray-100 text-gray-600',    label: 'Pending'     },
  };
  const cfg = statusConfig[test.status] || statusConfig.pending;
  const testId = (test as any)._id || test.id;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => onView(test)}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-gray-800">{test.applicantName}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">{testId}</p>
        </div>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-gray-50 rounded-lg p-2">
          <p className="text-[9px] text-gray-400">Date & Time</p>
          <p className="text-[11px] font-medium text-gray-700 mt-0.5">
            {test.scheduledDate ? new Date(test.scheduledDate).toLocaleDateString() : '—'}
          </p>
          <p className="text-[10px] text-gray-500">{test.scheduledTime || '—'}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <p className="text-[9px] text-gray-400">Venue</p>
          <p className="text-[11px] font-medium text-gray-700 mt-0.5">{test.venue || '—'}</p>
          {test.examiner && <p className="text-[10px] text-gray-500">{test.examiner}</p>}
        </div>
      </div>

      {test.subjects && test.subjects.length > 0 && (
        <div className="mb-3">
          <p className="text-[9px] text-gray-400 mb-1">Subjects</p>
          <div className="flex flex-wrap gap-1">
            {test.subjects.map(s => (
              <span key={s} className="bg-indigo-50 text-indigo-600 text-[9px] px-1.5 py-0.5 rounded">{s}</span>
            ))}
          </div>
        </div>
      )}

      {test.status === 'completed' && test.obtainedScore !== undefined && (
        <div className="flex items-center gap-4 bg-gray-50 rounded-lg p-3">
          <ScoreCircle score={test.obtainedScore} max={test.maxScore} />
          <div>
            <p className="text-xs font-semibold text-gray-700">{test.obtainedScore}/{test.maxScore}</p>
            <p className={`text-[10px] font-bold mt-0.5 ${test.result === 'pass' ? 'text-emerald-600' : test.result === 'borderline' ? 'text-amber-600' : 'text-red-600'}`}>
              {test.result?.toUpperCase() || '-'}
            </p>
            {test.remarks && <p className="text-[9px] text-gray-400 mt-0.5 line-clamp-1">{test.remarks}</p>}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Interview Card ────────────────────────────────────────────
const InterviewCard: React.FC<{ interview: Interview; onView: (i: Interview) => void }> = ({ interview, onView }) => {
  const totalScore = interview.scores ? interview.scores.reduce((acc, s) => acc + s.score, 0) : 0;
  const totalMax   = interview.scores ? interview.scores.reduce((acc, s) => acc + s.maxScore, 0) : 0;

  const decisionConfig: Record<string, string> = {
    recommended:     'text-emerald-600',
    not_recommended: 'text-red-600',
    borderline:      'text-amber-600',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => onView(interview)}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-gray-800">{interview.applicantName}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">
            {(interview as any)._id || interview.id} · {interview.type?.charAt(0).toUpperCase() + interview.type?.slice(1)} Interview
          </p>
        </div>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${interview.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
          {interview.status?.charAt(0).toUpperCase() + interview.status?.slice(1)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-gray-50 rounded-lg p-2">
          <p className="text-[9px] text-gray-400">Scheduled</p>
          <p className="text-[11px] font-medium text-gray-700">
            {interview.scheduledDate ? new Date(interview.scheduledDate).toLocaleDateString() : '—'}
          </p>
          <p className="text-[10px] text-gray-500">{interview.scheduledTime || '—'}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <p className="text-[9px] text-gray-400">Panel</p>
          {(interview.interviewers || []).map(i => (
            <p key={i} className="text-[10px] text-gray-600">{i}</p>
          ))}
        </div>
      </div>

      {interview.scores && interview.scores.length > 0 && (
        <div className="mb-3">
          <p className="text-[9px] text-gray-400 mb-2">Evaluation Scores</p>
          <div className="space-y-1.5">
            {interview.scores.map(s => (
              <div key={s.criteria} className="flex items-center gap-2">
                <span className="text-[10px] text-gray-600 w-28">{s.criteria}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                  <div className="bg-[#1e3a5f] h-1.5 rounded-full" style={{ width: `${(s.score / s.maxScore) * 100}%` }} />
                </div>
                <span className="text-[10px] font-medium text-gray-700 w-10 text-right">{s.score}/{s.maxScore}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
            <span className="text-[10px] font-semibold text-gray-600">Total: {totalScore}/{totalMax}</span>
            {interview.decision && (
              <span className={`text-[10px] font-bold uppercase ${decisionConfig[interview.decision]}`}>
                {interview.decision.replace('_', ' ')}
              </span>
            )}
          </div>
        </div>
      )}

      {interview.remarks && (
        <p className="text-[10px] text-gray-400 italic line-clamp-2">"{interview.remarks}"</p>
      )}
    </div>
  );
};

// ── Statistics Strip ──────────────────────────────────────────
const EvalStats: React.FC<{ tests: EntranceTest[] }> = ({ tests }) => {
  const completed = tests.filter(t => t.status === 'completed');
  const passRate = completed.length > 0
    ? ((completed.filter(t => t.result === 'pass').length / completed.length) * 100).toFixed(0)
    : 0;
  const avgScore = completed.length > 0
    ? (completed.reduce((a, t) => a + (t.percentage || 0), 0) / completed.length).toFixed(1)
    : 0;

  return (
    <div className="grid grid-cols-4 gap-4">
      {[
        { label: 'Tests Scheduled', value: tests.filter(t => t.status === 'scheduled').length, icon: <Calendar size={16} className="text-blue-500" />,   bg: 'bg-blue-50'   },
        { label: 'Tests Completed', value: completed.length,                                   icon: <CheckCircle size={16} className="text-emerald-500" />, bg: 'bg-emerald-50' },
        { label: 'Pass Rate',       value: `${passRate}%`,                                     icon: <TrendingUp size={16} className="text-purple-500" />,  bg: 'bg-purple-50'  },
        { label: 'Avg Score',       value: `${avgScore}%`,                                     icon: <Award size={16} className="text-amber-500" />,       bg: 'bg-amber-50'   },
      ].map(s => (
        <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex items-center gap-3">
          <div className={`${s.bg} rounded-xl p-2.5`}>{s.icon}</div>
          <div>
            <p className="text-xs text-gray-400">{s.label}</p>
            <p className="text-xl font-bold text-gray-800">{s.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

// ── Main Evaluation Tab ───────────────────────────────────────
interface EvaluationTabProps {
  onOpenModal: (modal: string, data?: any) => void;
}

const EvaluationTab: React.FC<EvaluationTabProps> = ({ onOpenModal }) => {
  const [activeSection, setActiveSection] = useState<'tests' | 'interviews'>('tests');

  const { data: testsRes,      isLoading: testsLoading }      = useTests();
  const { data: interviewsRes, isLoading: interviewsLoading } = useInterviews();

  const tests:      EntranceTest[] = (testsRes?.data      ?? []) as EntranceTest[];
  const interviews: Interview[]    = (interviewsRes?.data  ?? []) as Interview[];

  const isLoading = testsLoading || interviewsLoading;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-800">Evaluation Center</h2>
          <p className="text-xs text-gray-400">Manage entrance tests and interviews</p>
        </div>
        <div className="flex items-center gap-2">
          {activeSection === 'tests' && (
            <button onClick={() => onOpenModal('scheduleTest')}
              className="flex items-center gap-1.5 bg-[#1e3a5f] text-white text-xs px-4 py-2 rounded-lg hover:bg-[#16304f] transition-colors font-medium">
              <Plus size={14} /> Schedule Test
            </button>
          )}
          {activeSection === 'interviews' && (
            <button onClick={() => onOpenModal('scheduleInterview')}
              className="flex items-center gap-1.5 bg-[#1e3a5f] text-white text-xs px-4 py-2 rounded-lg hover:bg-[#16304f] transition-colors font-medium">
              <Plus size={14} /> Schedule Interview
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <EvalStats tests={tests} />

      {/* Section Tabs */}
      <div className="flex border-b border-gray-200">
        {[
          { key: 'tests',      label: 'Entrance Tests', icon: <ClipboardList size={14} />, count: tests.length      },
          { key: 'interviews', label: 'Interviews',     icon: <MessageSquare size={14} />, count: interviews.length },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveSection(tab.key as 'tests' | 'interviews')}
            className={`flex items-center gap-2 px-5 py-2.5 text-xs font-medium border-b-2 transition-all
              ${activeSection === tab.key ? 'border-[#1e3a5f] text-[#1e3a5f]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
          >
            {tab.icon} {tab.label}
            <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${activeSection === tab.key ? 'bg-[#1e3a5f] text-white' : 'bg-gray-100 text-gray-500'}`}>
              {isLoading ? '…' : tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Upcoming Alert */}
      {tests.filter(t => t.status === 'scheduled').length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <AlertCircle size={16} className="text-amber-600 flex-shrink-0" />
          <p className="text-xs text-amber-800">
            <strong>Upcoming:</strong> {tests.filter(t => t.status === 'scheduled').length} entrance test(s) scheduled. Ensure venues and examiners are confirmed.
          </p>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin w-6 h-6 border-4 border-[#1e3a5f] border-t-transparent rounded-full" />
        </div>
      )}

      {/* Tests */}
      {!isLoading && activeSection === 'tests' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {tests.length === 0 ? (
            <div className="col-span-3 py-16 text-center">
              <ClipboardList size={32} className="mx-auto text-gray-200 mb-2" />
              <p className="text-sm text-gray-400">No tests scheduled yet</p>
              <button onClick={() => onOpenModal('scheduleTest')}
                className="mt-3 text-xs text-[#1e3a5f] font-medium hover:underline">
                Schedule first test →
              </button>
            </div>
          ) : tests.map(test => (
            <TestCard key={(test as any)._id || test.id} test={test} onView={t => onOpenModal('viewEvaluation', t)} />
          ))}
        </div>
      )}

      {/* Interviews */}
      {!isLoading && activeSection === 'interviews' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {interviews.length === 0 ? (
            <div className="col-span-2 py-16 text-center">
              <MessageSquare size={32} className="mx-auto text-gray-200 mb-2" />
              <p className="text-sm text-gray-400">No interviews scheduled yet</p>
              <button onClick={() => onOpenModal('scheduleInterview')}
                className="mt-3 text-xs text-[#1e3a5f] font-medium hover:underline">
                Schedule first interview →
              </button>
            </div>
          ) : interviews.map(interview => (
            <InterviewCard key={(interview as any)._id || interview.id} interview={interview} onView={i => onOpenModal('viewEvaluation', i)} />
          ))}
        </div>
      )}
    </div>
  );
};

export default EvaluationTab;
