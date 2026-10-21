// ============================================================
// BEHAVIOUR & TARBIYAH — TARBIYAH TAB
// Islamic Character Development Assessment
// Eldermin ERP | React + TypeScript + Tailwind
// ============================================================

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Star, BookOpen, Heart, Award, Plus,
  Share2, Download,
  TrendingUp, Trophy, FileBarChart, ClipboardCheck,
} from 'lucide-react';
import {
  TarbiyahAssessment, TARBIYAH_TRAITS, TARBIYAH_RATING_CONFIG, GRADES,
} from './types';
import { useTarbiyah, useUpdateTarbiyah } from '../../hooks/useBehaviour';
import * as behaviourApi from '../../services/behaviour.api';
import pdfApi from '../../services/pdf.api';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { EmptyState, ErrorState } from '../../components/ui/EmptyState';
import { GradeLevelDropdown, SectionDropdown } from '../teaching/tabs/shared';
import { useStudents } from '../../hooks/useStudents';
import homeTasksService from '../../services/homeTasks.service';

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
  traitList: any[];
  scaleMax: number;
}> = ({ assessment: a, traitList, scaleMax }) => {
  const updateTarbiyah = useUpdateTarbiyah();
  const [downloading, setDownloading] = useState(false);
  const toggleShare = () => updateTarbiyah.mutate(
    { id: (a as any)._id, data: { parentShared: !a.parentShared } },
    {
      onSuccess: () => toast.success(a.parentShared ? 'Hidden from parent' : 'Shared with parent'),
      onError: () => toast.error('Could not update sharing'),
    },
  );
  const handleDownload = async () => {
    setDownloading(true);
    try {
      const blob = await pdfApi.generateTarbiyahReportPdf({ assessmentId: (a as any)._id });
      pdfApi.downloadBlob(blob, `tarbiyah-report-${a.studentName.replace(/\s+/g, '-')}-${a.period.replace(/\s+/g, '-')}.pdf`);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to generate report');
    } finally {
      setDownloading(false);
    }
  };
  const ratingCfg = TARBIYAH_RATING_CONFIG[a.overallRating];
  const traitMap = Object.fromEntries(a.traits.map(t => [t.traitKey, t.score]));
  // Rating config's "stars" assumes a 1-5 scale - scale proportionally to
  // this school's actual configured max rather than showing a fixed count.
  const displayStars = Math.round(((ratingCfg?.stars || 0) / 5) * scaleMax);

  const radarData = traitList.slice(0, 8).map((t: any) => ({
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
          <div className="mt-1"><StarRating score={displayStars} max={scaleMax} size="sm" /></div>
        </div>
      </div>

      {/* Overall Score */}
      <div className="flex items-center gap-4 mb-4 bg-gray-50 rounded-xl p-3">
        <ScoreCircle score={a.overallScore} max={scaleMax} size={64} />
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
          {a.traits.filter(t => t.score >= scaleMax * 0.8).slice(0, 3).map(t => {
            const trait = traitList.find((tr: any) => tr.key === t.traitKey);
            return (
              <div key={t.traitKey} className="flex items-center gap-1.5 mb-1">
                <StarRating score={t.score} max={scaleMax} size="sm" />
                <span className="text-[10px] text-gray-600">{trait?.nameEn.split(' ')[0]}</span>
              </div>
            );
          })}
        </div>
        <div>
          <p className="text-[9px] font-semibold text-amber-600 uppercase mb-1.5">⚠ Needs Work</p>
          {a.traits.filter(t => t.score <= scaleMax * 0.4).slice(0, 3).map(t => {
            const trait = traitList.find((tr: any) => tr.key === t.traitKey);
            return (
              <div key={t.traitKey} className="flex items-center gap-1.5 mb-1">
                <StarRating score={t.score} max={scaleMax} size="sm" />
                <span className="text-[10px] text-gray-600">{trait?.nameEn.split(' ')[0]}</span>
              </div>
            );
          })}
          {a.traits.filter(t => t.score <= scaleMax * 0.4).length === 0 && (
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
          <button onClick={toggleShare} disabled={updateTarbiyah.isPending}
            title={a.parentShared ? 'Stop sharing with parent' : 'Share with parent'}
            className="text-[10px] border border-gray-200 px-2 py-1 rounded text-gray-500 hover:bg-gray-50 disabled:opacity-50">
            <Share2 size={10} />
          </button>
          <button onClick={handleDownload} disabled={downloading}
            className="text-[10px] text-[#1e3a5f] hover:underline font-medium flex items-center gap-1 disabled:opacity-50">
            <Download size={10} /> {downloading ? 'Generating…' : 'Full Report'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Trait Analytics Panel ─────────────────────────────────────
const TraitAnalyticsPanel: React.FC<{ traitList: any[]; scaleMax: number }> = ({ traitList, scaleMax }) => {
  const { data: tarbiyahData } = useTarbiyah();
  const assessments: TarbiyahAssessment[] = tarbiyahData?.data ?? [];
  const traitData = traitList.map((t: any) => {
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
          const pct = (t.score / scaleMax) * 100;
          const color = pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-blue-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-500';
          return (
            <div key={t.trait} className="flex items-center gap-3">
              <span className="text-[10px] text-gray-600 w-28 truncate">{t.trait}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                <div className={`${color} h-2.5 rounded-full`} style={{ width: `${pct}%` }} />
              </div>
              <span className="text-[10px] font-bold text-gray-700 w-8 text-right">{t.score}/{scaleMax}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Reports: class-wise / school-wide / consolidated leaderboard ──
const CATEGORY_OPTIONS = [
  { value: '', label: 'All Categories' },
  { value: 'character', label: 'Character' },
  { value: 'social', label: 'Social' },
  { value: 'academic', label: 'Academic' },
  { value: 'spiritual', label: 'Spiritual' },
];

const ReportsPanel: React.FC<{ traitList: any[]; scaleMax: number; displayName: string }> = ({ scaleMax, displayName }) => {
  const [grade, setGrade] = useState('');
  const [section, setSection] = useState('');
  const [period, setPeriod] = useState('');
  const [category, setCategory] = useState('');
  const [downloading, setDownloading] = useState(false);

  const filters = { grade: grade || undefined, section: section || undefined, period: period || undefined, category: category || undefined };
  const { data: report, isLoading } = useQuery({
    queryKey: ['tarbiyah-report', filters],
    queryFn: () => behaviourApi.fetchTarbiyahReport(filters),
  });

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const blob = grade
        ? await pdfApi.generateTarbiyahClassReportPdf({ grade, section: section || undefined, period: period || undefined, category: category || undefined })
        : await pdfApi.generateTarbiyahSchoolReportPdf({ period: period || undefined, category: category || undefined });
      pdfApi.downloadBlob(blob, grade ? `tarbiyah-class-report-${grade}${section ? '-' + section : ''}.pdf` : 'tarbiyah-school-report.pdf');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to generate report');
    } finally {
      setDownloading(false);
    }
  };

  const scope = grade ? `Class Report — ${grade}${section ? ' ' + section : ''}` : 'School-Wide Report';
  const scopeLabel = period || 'Consolidated — All Periods';

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1">Grade</label>
          <select value={grade} onChange={e => { setGrade(e.target.value); setSection(''); }}
            className="text-xs border border-gray-200 rounded-lg px-3 py-2 text-gray-600">
            <option value="">All Grades (School-Wide)</option>
            {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1">Section</label>
          <input value={section} onChange={e => setSection(e.target.value)} placeholder="e.g. B" disabled={!grade}
            className="text-xs border border-gray-200 rounded-lg px-3 py-2 text-gray-600 w-20 disabled:bg-gray-50 disabled:text-gray-300" />
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1">Period</label>
          <input value={period} onChange={e => setPeriod(e.target.value)} placeholder="e.g. Term 1 2025-26"
            className="text-xs border border-gray-200 rounded-lg px-3 py-2 text-gray-600 w-40" />
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1">Characteristic</label>
          <select value={category} onChange={e => setCategory(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-3 py-2 text-gray-600">
            {CATEGORY_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <button onClick={handleDownload} disabled={downloading || isLoading}
          className="ml-auto flex items-center gap-1.5 bg-[#1e3a5f] text-white text-xs px-4 py-2 rounded-lg hover:bg-[#16304f] font-medium disabled:opacity-50">
          <Download size={13} /> {downloading ? 'Generating…' : 'Download PDF'}
        </button>
      </div>

      {isLoading && <LoadingSkeleton variant="cards" rows={3} />}

      {report && !isLoading && (
        <>
          <div>
            <p className="text-sm font-semibold text-gray-800">{scope}</p>
            <p className="text-[11px] text-gray-400">{scopeLabel}</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm text-center">
              <p className="text-xl font-bold text-[#1e3a5f]">{report.summary.totalStudents}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Students</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm text-center">
              <p className="text-xl font-bold text-[#1e3a5f]">{report.summary.totalAssessments}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Assessments</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm text-center">
              <p className="text-xl font-bold text-[#1e3a5f]">{report.summary.avgOverallScore.toFixed(1)}/{scaleMax}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Avg Overall Score</p>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Trophy size={13} className="text-amber-500" /> Who's Leading — Characteristic Leaderboard
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {report.traitLeaderboard.map((t: any) => (
                <div key={t.key} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-gray-800">{t.nameEn}</p>
                      <CategoryBadge category={t.category} />
                    </div>
                    <p className="text-[10px] text-gray-400">Avg {t.traitAvg.toFixed(1)}/{scaleMax}</p>
                  </div>
                  {t.topClass && !grade && (
                    <p className="text-[10px] text-blue-600 mb-1.5">
                      Top class: {t.topClass.grade}{t.topClass.section ? ' ' + t.topClass.section : ''} ({t.topClass.avgScore.toFixed(1)})
                    </p>
                  )}
                  {t.topStudents.length > 0 ? t.topStudents.map((s: any, i: number) => (
                    <div key={s.studentId} className="flex items-center justify-between text-[11px] py-0.5">
                      <span className="text-gray-600">
                        <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold mr-1.5
                          ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-gray-100 text-gray-600' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-50 text-gray-400'}`}>{i + 1}</span>
                        {s.studentName} — {s.grade}{s.section ? ' ' + s.section : ''}
                      </span>
                      <span className="font-semibold text-emerald-600">{s.avgScore.toFixed(1)}</span>
                    </div>
                  )) : <p className="text-[10px] text-gray-400 italic">No scores recorded yet</p>}
                </div>
              ))}
            </div>
          </div>

          {report.classComparison && (
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">Class Comparison</p>
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 border-b border-gray-100">
                      <th className="py-2 px-4 text-left font-semibold">#</th>
                      <th className="py-2 px-4 text-left font-semibold">Class</th>
                      <th className="py-2 px-4 text-left font-semibold">Students</th>
                      <th className="py-2 px-4 text-left font-semibold">Avg Overall Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.classComparison.map((c: any, i: number) => (
                      <tr key={`${c.grade}-${c.section}`} className="border-b border-gray-50">
                        <td className="py-2 px-4 text-gray-400">{i + 1}</td>
                        <td className="py-2 px-4 font-medium text-gray-700">{c.grade}{c.section ? ' ' + c.section : ''}</td>
                        <td className="py-2 px-4 text-gray-600">{c.studentCount}</td>
                        <td className="py-2 px-4 text-gray-700">{c.avgOverallScore.toFixed(1)}/{scaleMax}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">Student Ranking</p>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden max-h-96 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0">
                  <tr className="bg-gray-50 text-gray-500 border-b border-gray-100">
                    <th className="py-2 px-4 text-left font-semibold">#</th>
                    <th className="py-2 px-4 text-left font-semibold">Student</th>
                    <th className="py-2 px-4 text-left font-semibold">Class</th>
                    <th className="py-2 px-4 text-left font-semibold">Assessments</th>
                    <th className="py-2 px-4 text-left font-semibold">Avg Overall Score</th>
                  </tr>
                </thead>
                <tbody>
                  {report.studentRanking.map((s: any, i: number) => (
                    <tr key={s.studentId} className="border-b border-gray-50">
                      <td className="py-2 px-4 text-gray-400">{i + 1}</td>
                      <td className="py-2 px-4 font-medium text-gray-700">{s.studentName}</td>
                      <td className="py-2 px-4 text-gray-600">{s.grade}{s.section ? ' ' + s.section : ''}</td>
                      <td className="py-2 px-4 text-gray-600">{s.assessmentCount}</td>
                      <td className="py-2 px-4 text-gray-700">{s.avgOverallScore.toFixed(1)}/{scaleMax}</td>
                    </tr>
                  ))}
                  {report.studentRanking.length === 0 && (
                    <tr><td colSpan={5} className="py-8 text-center text-gray-400">No assessments match these filters</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {report.periodTrend && report.periodTrend.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">Period Trend — Consolidated Across All Periods</p>
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 border-b border-gray-100">
                      <th className="py-2 px-4 text-left font-semibold">Period</th>
                      <th className="py-2 px-4 text-left font-semibold">Assessments</th>
                      <th className="py-2 px-4 text-left font-semibold">Avg Overall Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.periodTrend.map((p: any) => (
                      <tr key={p.period} className="border-b border-gray-50">
                        <td className="py-2 px-4 font-medium text-gray-700">{p.period}</td>
                        <td className="py-2 px-4 text-gray-600">{p.assessmentCount}</td>
                        <td className="py-2 px-4 text-gray-700">{p.avgOverallScore.toFixed(1)}/{scaleMax}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ── Main Tarbiyah Tab ─────────────────────────────────────────
interface TarbiyahTabProps { onOpenModal: (m: string, d?: any) => void; }

export const TarbiyahTab: React.FC<TarbiyahTabProps> = ({ onOpenModal }) => {
  const { data: tarbiyahData, isLoading, isError, refetch } = useTarbiyah();
  const { data: characterSettings } = useQuery({ queryKey: ['character-settings'], queryFn: behaviourApi.getCharacterSettings });
  const displayName = characterSettings?.moduleDisplayName || 'Tarbiyah';
  const traitList = characterSettings?.characteristics?.length ? characterSettings.characteristics : TARBIYAH_TRAITS;
  const scaleMin = characterSettings?.ratingScale?.min ?? 1;
  const scaleMax = characterSettings?.ratingScale?.max ?? 5;
  const allAssessments: TarbiyahAssessment[] = tarbiyahData?.data ?? [];
  const [activeView, setActiveView] = useState<'assessments' | 'traits' | 'matrix' | 'reports' | 'home-tasks'>('assessments');
  const [filterGrade, setFilterGrade] = useState('all');

  const filtered = allAssessments.filter((a: TarbiyahAssessment) => filterGrade === 'all' || a.grade === filterGrade);

  if (isLoading) return <LoadingSkeleton variant="cards" rows={4} />;
  if (isError) return <ErrorState message="Could not load Tarbiyah assessments" onRetry={refetch} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-800">{displayName} — Character Development</h2>
          <p className="text-xs text-gray-400">Character assessment based on {traitList.length} characteristics</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => onOpenModal('addTarbiyah')}
            className="flex items-center gap-1.5 bg-[#1e3a5f] text-white text-xs px-4 py-2 rounded-lg hover:bg-[#16304f] font-medium">
            <Plus size={14} /> New Assessment
          </button>
        </div>
      </div>

      {/* Islamic Quote Banner - only shown when running the default Tarbiyah
          programme; a school running their own differently-named,
          differently-purposed character programme shouldn't have Islamic
          religious framing forced on it by default. */}
      {displayName === 'Tarbiyah' && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4 text-center">
          <p className="text-sm text-emerald-800 font-medium arabic-text mb-1" dir="rtl">
            إِنَّمَا بُعِثْتُ لِأُتَمِّمَ مَكَارِمَ الْأَخْلَاقِ
          </p>
          <p className="text-[11px] text-emerald-600 italic">
            "I was sent only to perfect the noble character traits." — Prophet Muhammad ﷺ
          </p>
        </div>
      )}

      {/* View Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {[
          { key: 'assessments', label: 'Student Assessments', icon: <BookOpen size={13} /> },
          { key: 'traits', label: 'Trait Analytics', icon: <TrendingUp size={13} /> },
          { key: 'matrix', label: 'Traits Reference', icon: <Award size={13} /> },
          { key: 'reports', label: 'Reports', icon: <FileBarChart size={13} /> },
          { key: 'home-tasks', label: `${displayName}-at-Home`, icon: <ClipboardCheck size={13} /> },
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
            <TarbiyahCard key={a._id} assessment={a} traitList={traitList} scaleMax={scaleMax} />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-2">
              <EmptyState
                icon={<Heart size={32} />}
                title={`No ${displayName} assessments yet`}
                description={`Begin assessing students on your ${traitList.length} configured characteristics.`}
                actionLabel="+ New Assessment"
                onAction={() => onOpenModal('addTarbiyah')}
              />
            </div>
          )}
        </div>
      )}

      {/* Trait Analytics */}
      {activeView === 'traits' && <TraitAnalyticsPanel traitList={traitList} scaleMax={scaleMax} />}

      {/* Traits Reference Matrix */}
      {activeView === 'matrix' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {traitList.map((t: any) => {
            const localLabel = t.nameLocal || t.nameAr;
            // Generate the score reference dynamically from the school's
            // actual configured scale rather than a hardcoded 5-4-3-2-1 -
            // descriptions are generic milestones that work at any scale.
            const descriptors = ['Does not yet demonstrate this', 'Rarely demonstrates this', 'Sometimes demonstrates this', 'Usually demonstrates this', 'Consistently and exceptionally demonstrates this'];
            const steps = scaleMax - scaleMin + 1;
            const scoreRef = Array.from({ length: steps }, (_, i) => {
              const score = scaleMax - i;
              const descIdx = Math.round(((score - scaleMin) / (scaleMax - scaleMin || 1)) * (descriptors.length - 1));
              return { score, desc: descriptors[descIdx] };
            });
            return (
              <div key={t.key} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex items-start gap-4">
                {localLabel && (
                  <div className="bg-emerald-50 rounded-xl p-3 text-center flex-shrink-0 min-w-[60px]">
                    <p className="text-lg font-bold text-emerald-700 arabic-text" dir="rtl">{localLabel}</p>
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-gray-800">{t.nameEn}</p>
                    <CategoryBadge category={t.category} />
                  </div>
                  <div className="mt-2">
                    {scoreRef.map(s => (
                      <div key={s.score} className="flex items-start gap-2 mb-0.5">
                        <div className="flex gap-0.5 mt-0.5 flex-shrink-0">
                          {Array.from({ length: s.score - scaleMin + 1 }).map((_, i) => (
                            <div key={i} className="w-2 h-2 rounded-full bg-amber-400" />
                          ))}
                        </div>
                        <p className="text-[10px] text-gray-500">{s.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reports: class-wise / school-wide / consolidated leaderboard */}
      {activeView === 'reports' && <ReportsPanel traitList={traitList} scaleMax={scaleMax} displayName={displayName} />}

      {/* Tarbiyah-at-home: teacher assigns a home task, parent completes it
          via the parent app, teacher may optionally rate it afterward. */}
      {activeView === 'home-tasks' && <HomeTasksPanel traitList={traitList} displayName={displayName} />}
    </div>
  );
};

// ── Tarbiyah-at-Home: assign tasks, track parent completion ────
const HomeTasksPanel: React.FC<{ traitList: any[]; displayName: string }> = ({ traitList, displayName }) => {
  const qc = useQueryClient();
  const [grade, setGrade] = useState('');
  const [section, setSection] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [traitKey, setTraitKey] = useState('');
  const [assignedDate, setAssignedDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data: studentsData, isLoading: loadingStudents } = useStudents(
    { grade, section, status: 'active', limit: 200 }, { enabled: !!grade },
  );
  const students: any[] = (studentsData as any)?.data || studentsData || [];

  const { data: classTasks = [], isLoading: loadingTasks } = useQuery({
    queryKey: ['home-tasks', 'class', grade, section],
    queryFn: () => homeTasksService.getClassTasks({ grade, section: section || undefined }),
    enabled: !!grade,
  });

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const toggleSelectAll = () => {
    setSelectedIds(prev => (prev.size === students.length ? new Set() : new Set(students.map((s: any) => s._id))));
  };

  const assignMutation = useMutation({
    mutationFn: homeTasksService.assign,
    onSuccess: (res: any) => {
      toast.success(`Assigned to ${res.assigned} student${res.assigned === 1 ? '' : 's'}`);
      setTitle(''); setDescription(''); setTraitKey(''); setDueDate(''); setSelectedIds(new Set());
      qc.invalidateQueries({ queryKey: ['home-tasks', 'class'] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to assign task'),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ taskId, reviewRating, reviewNotes }: { taskId: string; reviewRating: number; reviewNotes?: string }) =>
      homeTasksService.review(taskId, { reviewRating, reviewNotes }),
    onSuccess: () => {
      toast.success('Review saved');
      qc.invalidateQueries({ queryKey: ['home-tasks', 'class'] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to save review'),
  });

  const assign = () => {
    if (!title.trim() || selectedIds.size === 0) {
      toast.error('Enter a title and select at least one student');
      return;
    }
    assignMutation.mutate({
      studentIds: Array.from(selectedIds), title: title.trim(), description: description.trim() || undefined,
      traitKey: traitKey || undefined, assignedDate, dueDate: dueDate || undefined,
    });
  };

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm space-y-3">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Assign a {displayName}-at-Home Task</p>
        <div className="grid grid-cols-2 gap-3 max-w-md">
          <GradeLevelDropdown value={grade} onChange={(v) => { setGrade(v); setSection(''); setSelectedIds(new Set()); }} />
          <SectionDropdown gradeLevel={grade} value={section} onChange={setSection} />
        </div>
        {grade && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Task title (e.g. Practice Sidq at home)"
                className="text-xs border border-gray-200 rounded-lg px-3 py-2 col-span-2" />
              <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description / instructions for the parent (optional)"
                rows={2} className="text-xs border border-gray-200 rounded-lg px-3 py-2 col-span-2 resize-none" />
              <select value={traitKey} onChange={e => setTraitKey(e.target.value)} className="text-xs border border-gray-200 rounded-lg px-3 py-2">
                <option value="">No specific trait</option>
                {traitList.map((t: any) => <option key={t.key} value={t.key}>{t.nameEn}</option>)}
              </select>
              <div className="flex gap-2">
                <input type="date" value={assignedDate} onChange={e => setAssignedDate(e.target.value)} className="text-xs border border-gray-200 rounded-lg px-3 py-2 flex-1" />
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} placeholder="Due date" className="text-xs border border-gray-200 rounded-lg px-3 py-2 flex-1" />
              </div>
            </div>

            {loadingStudents ? (
              <div className="py-4 text-center text-gray-400 text-xs">Loading class…</div>
            ) : (
              <div className="border border-gray-100 rounded-lg max-h-56 overflow-y-auto">
                <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-50 bg-gray-50">
                  <input type="checkbox" checked={students.length > 0 && selectedIds.size === students.length} onChange={toggleSelectAll} />
                  <span className="text-[11px] text-gray-500">Select all ({students.length})</span>
                </div>
                {students.map((s: any) => (
                  <label key={s._id} className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 cursor-pointer">
                    <input type="checkbox" checked={selectedIds.has(s._id)} onChange={() => toggleSelectOne(s._id)} />
                    {s.firstName} {s.lastName}
                  </label>
                ))}
                {students.length === 0 && <p className="px-3 py-3 text-xs text-gray-400">No active students in this class</p>}
              </div>
            )}

            <button onClick={assign} disabled={assignMutation.isPending}
              className="bg-[#1e3a5f] text-white text-xs font-medium px-4 py-2 rounded-lg hover:bg-[#16304f] disabled:opacity-50">
              {assignMutation.isPending ? 'Assigning…' : `Assign to ${selectedIds.size || 0} Selected`}
            </button>
          </>
        )}
      </div>

      {grade && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-50">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Class Tasks & Completion</p>
          </div>
          {loadingTasks && <div className="py-6 text-center text-gray-400 text-xs">Loading…</div>}
          {!loadingTasks && classTasks.length === 0 && (
            <div className="py-6 text-center text-gray-400 text-xs">No home tasks assigned yet for this class</div>
          )}
          <div className="divide-y divide-gray-50">
            {classTasks.map((t: any) => (
              <HomeTaskRow key={t._id} task={t} onReview={(reviewRating, reviewNotes) => reviewMutation.mutate({ taskId: t._id, reviewRating, reviewNotes })} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const HomeTaskRow: React.FC<{ task: any; onReview: (reviewRating: number, reviewNotes?: string) => void }> = ({ task, onReview }) => {
  const [rating, setRating] = useState(task.reviewRating || 0);
  const [showReview, setShowReview] = useState(false);
  const statusStyle = task.status === 'completed'
    ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500';

  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-700">{task.studentName} — {task.title}</p>
          <p className="text-[10px] text-gray-400">
            Assigned {new Date(task.assignedDate).toLocaleDateString()}
            {task.completedAt && ` · Completed ${new Date(task.completedAt).toLocaleDateString()}`}
          </p>
          {task.parentNotes && <p className="text-[10px] text-gray-500 mt-0.5 italic">"{task.parentNotes}"</p>}
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${statusStyle}`}>{task.status}</span>
          {task.status === 'completed' && !task.reviewRating && !showReview && (
            <button onClick={() => setShowReview(true)} className="text-[10px] text-[#1e3a5f] font-medium hover:underline">Review</button>
          )}
          {task.reviewRating ? <StarRating score={task.reviewRating} /> : null}
        </div>
      </div>
      {showReview && (
        <div className="mt-2 flex items-center gap-2">
          {[1, 2, 3, 4, 5].map(n => (
            <button key={n} onClick={() => setRating(n)} className={`w-6 h-6 rounded-full text-[10px] font-bold ${rating >= n ? 'bg-amber-400 text-white' : 'bg-gray-100 text-gray-400'}`}>{n}</button>
          ))}
          <button onClick={() => { onReview(rating || 5); setShowReview(false); }}
            className="text-[10px] bg-[#1e3a5f] text-white px-2.5 py-1 rounded-lg">Save</button>
        </div>
      )}
    </div>
  );
};
