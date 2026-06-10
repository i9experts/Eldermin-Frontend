// ============================================================
// BEHAVIOUR & TARBIYAH — TARBIYAH TAB
// Islamic Character Development Assessment
// Eldermin ERP | React + TypeScript + Tailwind
// ============================================================

import React, { useState } from 'react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Star, BookOpen, Heart, Users, Award, Plus,
  ChevronDown, ChevronRight, Eye, Share2, Download,
  TrendingUp, AlertTriangle,
} from 'lucide-react';
import {
  TarbiyahAssessment, TARBIYAH_TRAITS, TARBIYAH_RATING_CONFIG, GRADES,
} from './types';
import { useTarbiyah } from '../../hooks/useBehaviour';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { EmptyState, ErrorState } from '../../components/ui/EmptyState';

// ── Star Rating ───────────────────────────────────────────────
const StarRating: React.FC<{ score: number; max?: number; size?: 'sm' | 'md' }> = ({ score, max = 5, size = 'sm' }) => {
  const s = size === 'sm' ? 'w-3 h-3' : 'w-5 h-5';
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <svg key={i} className={`${s} ${i < score ? 'text-amber-400' : 'text-gray-200'}`}
          fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
};

// ── Score Circle ──────────────────────────────────────────────
const ScoreCircle: React.FC<{ score: number; max?: number; size?: number; label?: string }> = ({ score, max = 5, size = 72, label }) => {
  const pct = (score / max) * 100;
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const color = pct >= 80 ? '#10b981' : pct >= 60 ? '#3b82f6' : pct >= 40 ? '#f59e0b' : '#ef4444';
  return (
    <div className="relative flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f0f0f0" strokeWidth={6} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={6}
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm font-bold text-gray-800">{score.toFixed(1)}</span>
          <span className="text-[8px] text-gray-400">/{max}</span>
        </div>
      </div>
      {label && <p className="text-[10px] text-gray-500 mt-1 text-center">{label}</p>}
    </div>
  );
};

// ── Trait Category Badge ──────────────────────────────────────
const CategoryBadge: React.FC<{ category: string }> = ({ category }) => {
  const cfg: Record<string, string> = {
    character: 'bg-purple-100 text-purple-700',
    social: 'bg-blue-100 text-blue-700',
    academic: 'bg-amber-100 text-amber-700',
    spiritual: 'bg-emerald-100 text-emerald-700',
  };
  return (
    <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wide ${cfg[category] || 'bg-gray-100 text-gray-600'}`}>
      {category}
    </span>
  );
};

// ── Tarbiyah Card ─────────────────────────────────────────────
const TarbiyahCard: React.FC<{
  assessment: TarbiyahAssessment;
  onView: (a: TarbiyahAssessment) => void;
}> = ({ assessment: a, onView }) => {
  const ratingCfg = TARBIYAH_RATING_CONFIG[a.overallRating];
  const traitMap = Object.fromEntries(a.traits.map(t => [t.traitKey, t.score]));

  const radarData = TARBIYAH_TRAITS.slice(0, 8).map(t => ({
    trait: t.nameEn.split(' ')[0],
    score: traitMap[t.key] || 0,
  }));

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1e3a5f] to-indigo-400 flex items-center justify-center text-white font-bold text-sm">
            {a.studentName.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">{a.studentName}</p>
            <p className="text-[10px] text-gray-400">{a.grade} · {a.period}</p>
          </div>
        </div>
        <div className="text-right">
          <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${ratingCfg?.color}`}>
            {ratingCfg?.label}
          </span>
          <div className="mt-1"><StarRating score={ratingCfg?.stars || 0} size="sm" /></div>
        </div>
      </div>

      {/* Overall Score */}
      <div className="flex items-center gap-4 mb-4 bg-gray-50 rounded-xl p-3">
        <ScoreCircle score={a.overallScore} size={64} />
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-600 mb-1">Overall Tarbiyah Score</p>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="h-2 rounded-full transition-all"
              style={{
                width: `${a.overallPercentage}%`,
                backgroundColor: a.overallPercentage >= 80 ? '#10b981' : a.overallPercentage >= 60 ? '#3b82f6' : a.overallPercentage >= 40 ? '#f59e0b' : '#ef4444',
              }} />
          </div>
          <p className="text-[10px] text-gray-400 mt-1">{a.overallPercentage}% · Assessed by {a.assessedBy}</p>
        </div>
      </div>

      {/* Top & Bottom Traits */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <p className="text-[9px] font-semibold text-emerald-600 uppercase mb-1.5">✦ Strengths</p>
          {a.traits.filter(t => t.score >= 4).slice(0, 3).map(t => {
            const trait = TARBIYAH_TRAITS.find(tr => tr.key === t.traitKey);
            return (
              <div key={t.traitKey} className="flex items-center gap-1.5 mb-1">
                <StarRating score={t.score} size="sm" />
                <span className="text-[10px] text-gray-600">{trait?.nameEn.split(' ')[0]}</span>
              </div>
            );
          })}
        </div>
        <div>
          <p className="text-[9px] font-semibold text-amber-600 uppercase mb-1.5">⚠ Needs Work</p>
          {a.traits.filter(t => t.score <= 2).slice(0, 3).map(t => {
            const trait = TARBIYAH_TRAITS.find(tr => tr.key === t.traitKey);
            return (
              <div key={t.traitKey} className="flex items-center gap-1.5 mb-1">
                <StarRating score={t.score} size="sm" />
                <span className="text-[10px] text-gray-600">{trait?.nameEn.split(' ')[0]}</span>
              </div>
            );
          })}
          {a.traits.filter(t => t.score <= 2).length === 0 && (
            <p className="text-[10px] text-gray-400 italic">None identified</p>
          )}
        </div>
      </div>

      {/* Teacher Note */}
      {a.teacherObservations && (
        <p className="text-[10px] text-gray-500 italic border-t border-gray-100 pt-2 line-clamp-2">
          "{a.teacherObservations}"
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-1.5">
          {a.parentShared
            ? <span className="text-[10px] text-emerald-600 font-medium">✓ Shared with Parent</span>
            : <span className="text-[10px] text-amber-600 font-medium">⏳ Not Shared</span>}
        </div>
        <div className="flex gap-2">
          <button className="text-[10px] border border-gray-200 px-2 py-1 rounded text-gray-500 hover:bg-gray-50">
            <Share2 size={10} />
          </button>
          <button onClick={() => onView(a)}
            className="text-[10px] text-[#1e3a5f] hover:underline font-medium flex items-center gap-1">
            Full Report <ChevronRight size={10} />
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Trait Analytics Panel ─────────────────────────────────────
const TraitAnalyticsPanel: React.FC = () => {
  const { data: tarbiyahData } = useTarbiyah();
  const assessments: TarbiyahAssessment[] = tarbiyahData?.data ?? [];
  const traitData = TARBIYAH_TRAITS.map(t => {
    const avgScore = assessments.reduce((acc: number, a: any) => {
      const ts = a.traits.find((tr: any) => tr.traitKey === t.key);
      return acc + (ts?.score || 0);
    }, 0) / (assessments.length || 1);
    return { trait: t.nameEn.split('(')[0].trim(), score: parseFloat(avgScore.toFixed(2)), category: t.category };
  }).sort((a, b) => b.score - a.score);

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Class-wide Trait Performance</h3>
      <div className="space-y-2">
        {traitData.map(t => {
          const pct = (t.score / 5) * 100;
          const color = pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-blue-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-500';
          return (
            <div key={t.trait} className="flex items-center gap-3">
              <span className="text-[10px] text-gray-600 w-28 truncate">{t.trait}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                <div className={`${color} h-2.5 rounded-full`} style={{ width: `${pct}%` }} />
              </div>
              <span className="text-[10px] font-bold text-gray-700 w-8 text-right">{t.score}/5</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Main Tarbiyah Tab ─────────────────────────────────────────
interface TarbiyahTabProps { onOpenModal: (m: string, d?: any) => void; }

export const TarbiyahTab: React.FC<TarbiyahTabProps> = ({ onOpenModal }) => {
  const { data: tarbiyahData, isLoading, isError, refetch } = useTarbiyah();
  const allAssessments: TarbiyahAssessment[] = tarbiyahData?.data ?? [];
  const [activeView, setActiveView] = useState<'assessments' | 'traits' | 'matrix'>('assessments');
  const [filterGrade, setFilterGrade] = useState('all');

  const filtered = allAssessments.filter((a: TarbiyahAssessment) => filterGrade === 'all' || a.grade === filterGrade);

  if (isLoading) return <LoadingSkeleton variant="cards" rows={4} />;
  if (isError) return <ErrorState message="Could not load Tarbiyah assessments" onRetry={refetch} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-800">Tarbiyah — Character Development</h2>
          <p className="text-xs text-gray-400">Islamic character assessment based on 12 core traits</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => onOpenModal('addTarbiyah')}
            className="flex items-center gap-1.5 bg-[#1e3a5f] text-white text-xs px-4 py-2 rounded-lg hover:bg-[#16304f] font-medium">
            <Plus size={14} /> New Assessment
          </button>
        </div>
      </div>

      {/* Islamic Quote Banner */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4 text-center">
        <p className="text-sm text-emerald-800 font-medium arabic-text mb-1" dir="rtl">
          إِنَّمَا بُعِثْتُ لِأُتَمِّمَ مَكَارِمَ الْأَخْلَاقِ
        </p>
        <p className="text-[11px] text-emerald-600 italic">
          "I was sent only to perfect the noble character traits." — Prophet Muhammad ﷺ
        </p>
      </div>

      {/* View Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {[
          { key: 'assessments', label: 'Student Assessments', icon: <BookOpen size={13} /> },
          { key: 'traits', label: 'Trait Analytics', icon: <TrendingUp size={13} /> },
          { key: 'matrix', label: 'Traits Reference', icon: <Award size={13} /> },
        ].map(v => (
          <button key={v.key} onClick={() => setActiveView(v.key as any)}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium border-b-2 transition-all
              ${activeView === v.key ? 'border-[#1e3a5f] text-[#1e3a5f]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
            {v.icon} {v.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      {activeView === 'assessments' && (
        <div className="flex items-center gap-3">
          <select value={filterGrade} onChange={e => setFilterGrade(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-3 py-2 text-gray-600">
            <option value="all">All Grades</option>
            {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <select className="text-xs border border-gray-200 rounded-lg px-3 py-2 text-gray-600">
            <option>All Periods</option>
            <option>Term 1 2025-26</option>
            <option>Term 2 2025-26</option>
          </select>
          <span className="text-xs text-gray-400 ml-auto">{filtered.length} assessments</span>
        </div>
      )}

      {/* Assessments Grid */}
      {activeView === 'assessments' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(a => (
            <TarbiyahCard key={a._id} assessment={a} onView={a => onOpenModal('viewTarbiyah', a)} />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-2">
              <EmptyState
                icon={<Heart size={32} />}
                title="No Tarbiyah assessments yet"
                description="Begin assessing students on the 12 core Islamic character traits."
                actionLabel="+ New Assessment"
                onAction={() => onOpenModal('addTarbiyah')}
              />
            </div>
          )}
        </div>
      )}

      {/* Trait Analytics */}
      {activeView === 'traits' && <TraitAnalyticsPanel />}

      {/* Traits Reference Matrix */}
      {activeView === 'matrix' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {TARBIYAH_TRAITS.map(t => (
            <div key={t.key} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex items-start gap-4">
              <div className="bg-emerald-50 rounded-xl p-3 text-center flex-shrink-0 min-w-[60px]">
                <p className="text-lg font-bold text-emerald-700 arabic-text" dir="rtl">{t.nameAr}</p>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold text-gray-800">{t.nameEn}</p>
                  <CategoryBadge category={t.category} />
                </div>
                <div className="mt-2">
                  {[
                    { score: 5, desc: 'Consistently and exceptionally demonstrates this trait' },
                    { score: 4, desc: 'Usually demonstrates this trait' },
                    { score: 3, desc: 'Sometimes demonstrates this trait' },
                    { score: 2, desc: 'Rarely demonstrates this trait' },
                    { score: 1, desc: 'Does not yet demonstrate this trait' },
                  ].map(s => (
                    <div key={s.score} className="flex items-start gap-2 mb-0.5">
                      <div className="flex gap-0.5 mt-0.5 flex-shrink-0">
                        {Array.from({ length: s.score }).map((_, i) => (
                          <div key={i} className="w-2 h-2 rounded-full bg-amber-400" />
                        ))}
                      </div>
                      <p className="text-[10px] text-gray-500">{s.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
