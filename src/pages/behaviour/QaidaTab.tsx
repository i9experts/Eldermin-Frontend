// ============================================================
// QAIDA & TAJWEED TRACKER
// Noorani Qaida (16-Takhti) progress tracking + assessment reports
// Eldermin ERP | React + TypeScript + Tailwind
// ============================================================

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import {
  BookOpen, X, Save, Download, RotateCcw, CheckCircle2,
  AlertTriangle, Circle, PlayCircle, Sparkles,
} from 'lucide-react';
import { GradeLevelDropdown, SectionDropdown } from '../teaching/tabs/shared';
import pdfApi from '../../services/pdf.api';
import {
  useQaidaTakhtis, useQaidaSummary, useQaidaClassProgress, useQaidaProgress,
  useInitQaidaProgress, useRecordTakhtiAttempt, useUpdateTakhtiStatus, useUpdateQaidaRemarks,
} from '../../hooks/useQaida';

const STATUS_STYLE: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  mastered: { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Mastered' },
  in_progress: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500', label: 'In Progress' },
  needs_revision: { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500', label: 'Needs Revision' },
  not_started: { bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-400', label: 'Not Started' },
  completed: { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Completed' },
};

const RATING_OPTIONS = [
  { value: 'needs_practice', label: 'Needs Practice', color: 'bg-red-50 text-red-600 border-red-200' },
  { value: 'developing', label: 'Developing', color: 'bg-amber-50 text-amber-600 border-amber-200' },
  { value: 'proficient', label: 'Proficient', color: 'bg-blue-50 text-blue-600 border-blue-200' },
  { value: 'mastered', label: 'Mastered', color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
];

const ERROR_LABELS: Record<string, string> = {
  makhraj_confusion: 'Makhraj confusion (similar letters)',
  missed_ghunna: 'Missed ghunna',
  madd_too_short: 'Madd too short',
  madd_too_long: 'Madd too long',
  tashdeed_not_doubled: 'Tashdeed not doubled',
  waqf_ignored: 'Waqf ignored',
  tanween_as_noon: 'Tanween read as noon',
  letter_shape_misread: 'Letter shape misread',
};

// ── Student Detail / Record-Attempt Modal ──────────────────────
const QaidaStudentModal: React.FC<{ student: { studentId: string; studentName: string; grade: string; section?: string }; onClose: () => void }> = ({ student, onClose }) => {
  const { data: takhtisData } = useQaidaTakhtis();
  const takhtis = takhtisData?.takhtis || [];
  const { data: progress, isLoading, isError } = useQaidaProgress(student.studentId);
  const initMutation = useInitQaidaProgress();
  const attemptMutation = useRecordTakhtiAttempt();
  const statusMutation = useUpdateTakhtiStatus();
  const remarksMutation = useUpdateQaidaRemarks();

  const [showForm, setShowForm] = useState(false);
  const [selectedTakhti, setSelectedTakhti] = useState<number | null>(null);
  const [rating, setRating] = useState('developing');
  const [makhraj, setMakhraj] = useState(3);
  const [tajweed, setTajweed] = useState(3);
  const [fluency, setFluency] = useState(3);
  const [errors, setErrors] = useState<string[]>([]);
  const [remarks, setRemarks] = useState('');
  const [overallRemarks, setOverallRemarks] = useState('');
  const [downloading, setDownloading] = useState(false);

  // Sabaq (lesson range) selection - teacher clicks a starting letter then an
  // ending letter on the Qaida page, e.g. "Alif" to "Kaf". Indices into the
  // active takhti's referenceContent/referenceLabels arrays.
  const [sabaqFromIdx, setSabaqFromIdx] = useState<number | null>(null);
  const [sabaqToIdx, setSabaqToIdx] = useState<number | null>(null);
  // Free-text fallback for boards with no fixed reference content to click on
  // (Murakkabat, the Mashq practice boards).
  const [sabaqFromText, setSabaqFromText] = useState('');
  const [sabaqToText, setSabaqToText] = useState('');
  const todayStr = () => new Date().toISOString().slice(0, 10);
  const nowStr = () => new Date().toTimeString().slice(0, 5);
  const [attemptDate, setAttemptDate] = useState(todayStr());
  const [attemptTime, setAttemptTime] = useState(nowStr());

  const progressMap = new Map((progress?.takhtis || []).map((t: any) => [t.takhtiNumber, t]));
  const currentTakhti = progress?.currentTakhti ?? 1;

  const openForm = (num: number) => {
    setSelectedTakhti(num);
    setRating('developing'); setMakhraj(3); setTajweed(3); setFluency(3); setErrors([]); setRemarks('');
    setSabaqFromIdx(null); setSabaqToIdx(null); setSabaqFromText(''); setSabaqToText('');
    setAttemptDate(todayStr()); setAttemptTime(nowStr());
    setShowForm(true);
  };

  const toggleError = (key: string) =>
    setErrors(prev => prev.includes(key) ? prev.filter(e => e !== key) : [...prev, key]);

  // Click a letter on the Qaida page to mark the sabaq range: first click
  // sets "From", the next click (on or after it) sets "To" and highlights
  // the span; clicking before the current "From" restarts the range there.
  const handleLetterClick = (i: number) => {
    if (sabaqFromIdx === null || sabaqToIdx !== null) {
      setSabaqFromIdx(i); setSabaqToIdx(null);
    } else if (i < sabaqFromIdx) {
      setSabaqFromIdx(i); setSabaqToIdx(null);
    } else {
      setSabaqToIdx(i);
    }
  };

  const submitAttempt = () => {
    if (!selectedTakhti) return;
    const activeTakhti = takhtis.find((t: any) => t.number === selectedTakhti);
    const labels = activeTakhti?.referenceLabels || activeTakhti?.referenceContent;
    const sabaqFrom = labels && sabaqFromIdx !== null ? labels[sabaqFromIdx] : (sabaqFromText || undefined);
    const sabaqTo = labels && sabaqToIdx !== null ? labels[sabaqToIdx] : (sabaqToText || undefined);
    const date = attemptDate ? new Date(`${attemptDate}T${attemptTime || '00:00'}`).toISOString() : undefined;
    attemptMutation.mutate({
      studentId: student.studentId,
      data: {
        takhtiNumber: selectedTakhti, rating: rating as any,
        makhrajAccuracy: makhraj, tajweedAccuracy: tajweed, fluency,
        errorsNoted: errors, remarks: remarks || undefined,
        sabaqFrom, sabaqTo, date,
      },
    }, {
      onSuccess: () => { toast.success('Attempt recorded'); setShowForm(false); },
      onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to record attempt'),
    });
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const blob = await pdfApi.generateQaidaReportPdf({ studentId: student.studentId });
      pdfApi.downloadBlob(blob, `qaida-report-${student.studentName.replace(/\s+/g, '-')}.pdf`);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to generate report');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600"><BookOpen size={18} /></div>
            <div>
              <h2 className="text-base font-bold text-gray-800">{student.studentName}</h2>
              <p className="text-xs text-gray-400">{student.grade} {student.section || ''} · Noorani Qaida Tracker</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {progress && (
              <button onClick={handleDownload} disabled={downloading}
                className="flex items-center gap-1.5 border border-gray-200 text-gray-600 text-xs px-3 py-2 rounded-lg hover:bg-gray-50 font-medium disabled:opacity-50">
                <Download size={13} /> {downloading ? 'Generating…' : 'Download Report'}
              </button>
            )}
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"><X size={18} /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {isLoading && <div className="py-10 text-center text-gray-400 text-sm">Loading progress…</div>}

          {isError && !isLoading && (
            <div className="text-center py-10">
              <Sparkles size={28} className="mx-auto text-emerald-400 mb-3" />
              <p className="text-sm font-semibold text-gray-700 mb-1">Not started yet</p>
              <p className="text-xs text-gray-400 mb-4">Begin this student's Qaida journey at Takhti 1 — Mufradat.</p>
              <button
                onClick={() => initMutation.mutate({
                  studentId: student.studentId,
                  data: { studentName: student.studentName, grade: student.grade, section: student.section },
                }, { onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to start tracking') })}
                disabled={initMutation.isPending}
                className="inline-flex items-center gap-1.5 bg-emerald-600 text-white text-xs px-4 py-2.5 rounded-lg hover:bg-emerald-700 font-medium disabled:opacity-50">
                <PlayCircle size={14} /> {initMutation.isPending ? 'Starting…' : 'Start Qaida Tracking'}
              </button>
            </div>
          )}

          {progress && !isLoading && (
            <>
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-emerald-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-emerald-700">{(progress.takhtis || []).filter((t: any) => t.status === 'mastered').length}/{takhtis.length || 16}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Mastered</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-blue-700">Takhti {currentTakhti}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Currently On</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-amber-700">{(progress.takhtis || []).filter((t: any) => t.status === 'needs_revision').length}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Needs Revision</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-gray-700 capitalize">{(progress.overallStatus || '').replace(/_/g, ' ')}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Overall Status</p>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">The 16-Takhti Journey</p>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {takhtis.map((t: any) => {
                    const record: any = progressMap.get(t.number);
                    const status = record?.status || 'not_started';
                    const style = STATUS_STYLE[status];
                    return (
                      <button key={t.number} onClick={() => openForm(t.number)}
                        className={`${style.bg} rounded-lg p-2 text-center hover:ring-2 hover:ring-offset-1 hover:ring-emerald-300 transition-all`}
                        title={`${t.titleEn} (${t.titleUr})`}>
                        <p className={`text-sm font-bold ${style.text}`}>{t.number}</p>
                        <p className={`text-[8px] font-medium ${style.text} leading-tight line-clamp-2`}>{t.titleEn}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {showForm && selectedTakhti && (() => {
                const activeTakhti = takhtis.find((t: any) => t.number === selectedTakhti);
                return (
                <div className="border border-emerald-200 bg-emerald-50/30 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        Record Attempt — Takhti {selectedTakhti}: {activeTakhti?.titleEn}
                        {activeTakhti?.titleUr && <span className="text-gray-400 font-normal"> ({activeTakhti.titleUr})</span>}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{activeTakhti?.description}</p>
                    </div>
                    <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 flex-shrink-0 ml-2"><X size={16} /></button>
                  </div>

                  {/* The actual Qaida page - this is the whole point of opening
                      a takhti, not just a rating form with nothing to look at.
                      Teacher clicks a starting letter then an ending letter to
                      mark today's sabaq (lesson range), e.g. "Alif" to "Kaf". */}
                  {activeTakhti?.referenceContent && activeTakhti.referenceContent.length > 0 ? (() => {
                    const sabaqLabels: string[] = activeTakhti.referenceLabels || activeTakhti.referenceContent || [];
                    return (
                    <div className="bg-[#fdfaf2] border-2 border-amber-200 rounded-2xl p-5 shadow-inner relative overflow-hidden">
                      <div className="absolute inset-2 border border-amber-300/50 rounded-xl pointer-events-none" />
                      <div className="relative flex items-center justify-between mb-3">
                        <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wide">
                          Noorani Qaida — {activeTakhti.pageReference}
                        </p>
                        <p className="text-[10px] text-amber-500 font-medium">
                          {sabaqFromIdx === null
                            ? 'Click a letter to start the sabaq'
                            : sabaqToIdx === null
                              ? `From: ${sabaqLabels[sabaqFromIdx]} — click where it ends`
                              : `Sabaq: ${sabaqLabels[sabaqFromIdx]} → ${sabaqLabels[sabaqToIdx]}`}
                        </p>
                      </div>
                      <div dir="rtl" className="relative flex flex-wrap gap-2.5 justify-center py-2">
                        {activeTakhti.referenceContent.map((letter: string, i: number) => {
                          const label = sabaqLabels[i];
                          const inRange = sabaqFromIdx !== null && sabaqToIdx !== null && i >= sabaqFromIdx && i <= sabaqToIdx;
                          const isFrom = i === sabaqFromIdx;
                          const isTo = i === sabaqToIdx;
                          return (
                            <button key={i} type="button" onClick={() => handleLetterClick(i)} title={label}
                              className={`w-12 h-12 flex items-center justify-center text-2xl rounded-xl border-2 transition-all font-serif
                                ${inRange ? 'bg-amber-400 text-white border-amber-500 shadow-md scale-105'
                                  : (isFrom || isTo) ? 'bg-amber-200 text-amber-900 border-amber-400'
                                  : 'bg-white text-emerald-800 border-emerald-100 hover:border-amber-300 hover:bg-amber-50'}`}>
                              {letter}
                            </button>
                          );
                        })}
                      </div>
                      {sabaqFromIdx !== null && (
                        <div className="relative flex justify-end mt-2">
                          <button onClick={() => { setSabaqFromIdx(null); setSabaqToIdx(null); }}
                            className="text-[10px] text-amber-600 hover:underline font-medium">Clear sabaq range</button>
                        </div>
                      )}
                    </div>
                    );
                  })() : (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 space-y-2">
                      <p className="text-xs text-amber-700">
                        This board's specific words/ayat are on <strong>Noorani Qaida {activeTakhti?.pageReference}</strong> — keep the physical copy open to that page while assessing.
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <input value={sabaqFromText} onChange={e => setSabaqFromText(e.target.value)} placeholder="Sabaq from (e.g. line 1)"
                          className="border border-amber-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none" />
                        <input value={sabaqToText} onChange={e => setSabaqToText(e.target.value)} placeholder="Sabaq to (e.g. line 4)"
                          className="border border-amber-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none" />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] text-gray-500 mb-1">Date</p>
                      <input type="date" value={attemptDate} onChange={e => setAttemptDate(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 mb-1">Time</p>
                      <input type="time" value={attemptTime} onChange={e => setAttemptTime(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none" />
                    </div>
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold text-gray-500 uppercase mb-1.5">Rating</p>
                    <div className="flex gap-2">
                      {RATING_OPTIONS.map(r => (
                        <button key={r.value} onClick={() => setRating(r.value)}
                          className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-all ${rating === r.value ? r.color : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}>
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Makhraj Accuracy', value: makhraj, set: setMakhraj },
                      { label: 'Tajweed Accuracy', value: tajweed, set: setTajweed },
                      { label: 'Fluency', value: fluency, set: setFluency },
                    ].map(f => (
                      <div key={f.label}>
                        <p className="text-[10px] text-gray-500 mb-1">{f.label}</p>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map(n => (
                            <button key={n} onClick={() => f.set(n)}
                              className={`w-6 h-6 rounded-full text-[10px] font-bold transition-all ${f.value >= n ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500 hover:bg-emerald-100'}`}>
                              {n}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold text-gray-500 uppercase mb-1.5">Errors Noted (optional)</p>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(ERROR_LABELS).map(([key, label]) => (
                        <button key={key} onClick={() => toggleError(key)}
                          className={`text-[10px] px-2.5 py-1 rounded-full border transition-all ${errors.includes(key) ? 'bg-amber-100 text-amber-700 border-amber-300' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <textarea rows={2} value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Remarks (optional)..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none resize-none" />

                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => statusMutation.mutate({ studentId: student.studentId, takhtiNumber: selectedTakhti, status: 'needs_revision' }, {
                        onSuccess: () => { toast.success('Marked for revision'); setShowForm(false); },
                      })}
                      className="text-xs text-amber-600 font-medium hover:underline flex items-center gap-1">
                      <RotateCcw size={12} /> Mark Needs Revision (no attempt)
                    </button>
                    <button onClick={submitAttempt} disabled={attemptMutation.isPending}
                      className="flex items-center gap-1.5 bg-emerald-600 text-white text-xs px-4 py-2 rounded-lg hover:bg-emerald-700 font-medium disabled:opacity-50">
                      <Save size={12} /> {attemptMutation.isPending ? 'Saving…' : 'Save Attempt'}
                    </button>
                  </div>
                </div>
                );
              })()}

              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">Attempt History</p>
                <div className="space-y-1.5 max-h-56 overflow-y-auto">
                  {takhtis.filter((t: any) => (progressMap.get(t.number) as any)?.attempts?.length > 0).length === 0 && (
                    <p className="text-xs text-gray-400 py-4 text-center bg-gray-50 rounded-lg">No attempts recorded yet — click any takhti above to record one.</p>
                  )}
                  {takhtis.map((t: any) => {
                    const record: any = progressMap.get(t.number);
                    if (!record?.attempts?.length) return null;
                    const latest = record.attempts[record.attempts.length - 1];
                    const style = STATUS_STYLE[record.status];
                    return (
                      <div key={t.number} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2 text-xs">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${style.bg} ${style.text}`}>{t.number}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-700 truncate">{t.titleEn}</p>
                          <p className="text-[10px] text-gray-400">
                            {new Date(latest.date).toLocaleDateString()} · {latest.assessedBy} · {record.attempts.length} attempt{record.attempts.length > 1 ? 's' : ''}
                            {latest.sabaqFrom && <span className="text-amber-600"> · Sabaq: {latest.sabaqFrom}{latest.sabaqTo ? ` → ${latest.sabaqTo}` : ''}</span>}
                          </p>
                        </div>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${style.bg} ${style.text} capitalize`}>{latest.rating.replace('_', ' ')}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">Overall Remarks</p>
                <textarea rows={2} defaultValue={progress.overallRemarks || ''} onBlur={e => {
                  if (e.target.value !== (progress.overallRemarks || '')) {
                    remarksMutation.mutate({ studentId: student.studentId, remarks: e.target.value }, {
                      onSuccess: () => toast.success('Remarks saved'),
                    });
                  }
                }} placeholder="Overall progress remarks for this student's Qaida journey..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none resize-none" />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Class Roster Tab ────────────────────────────────────────────
export const QaidaTab: React.FC = () => {
  const [grade, setGrade] = useState('');
  const [section, setSection] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  const { data: summary } = useQaidaSummary();
  const { data: roster = [], isLoading } = useQaidaClassProgress(grade, section || undefined);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-gray-800">Qaida & Tajweed Tracker</h2>
        <p className="text-xs text-gray-400">Noorani Qaida — 16-Takhti progress tracking, makhraj &amp; tajweed assessment</p>
      </div>

      {summary && (
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xl font-bold text-gray-800">{summary.totalStudentsTracked}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Students Tracked</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xl font-bold text-emerald-600">{summary.completedCount}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Completed All 16</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xl font-bold text-blue-600">{summary.inProgressCount}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">In Progress</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xl font-bold text-amber-600">{summary.needingRevisionCount}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Need Revision</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm grid grid-cols-2 gap-3 max-w-md">
        <GradeLevelDropdown value={grade} onChange={v => { setGrade(v); setSection(''); }} />
        <SectionDropdown gradeLevel={grade} value={section} onChange={setSection} />
      </div>

      {!grade && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <BookOpen size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-gray-500">Select a grade to see the class's Qaida progress</p>
        </div>
      )}

      {grade && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 text-gray-500 border-b border-gray-100">
                <th className="py-3 px-4 text-left font-semibold">Student</th>
                <th className="py-3 px-4 font-semibold">Current Takhti</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Mastery</th>
                <th className="py-3 px-4 font-semibold">Flags</th>
                <th className="py-3 px-4 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-b border-gray-50"><td colSpan={6} className="py-3 px-4"><div className="animate-pulse h-4 bg-gray-100 rounded w-3/4" /></td></tr>
              ))}
              {!isLoading && roster.length === 0 && (
                <tr><td colSpan={6} className="py-12 text-center text-gray-400">No active students in this class</td></tr>
              )}
              {roster.map((r: any) => {
                const style = STATUS_STYLE[r.overallStatus] || STATUS_STYLE.not_started;
                return (
                  <tr key={r.studentId} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedStudent(r)}>
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-800">{r.studentName}</p>
                      <p className="text-[10px] text-gray-400">{r.admissionNumber || '—'}</p>
                    </td>
                    <td className="py-3 px-4 text-center font-medium text-gray-700">Takhti {r.currentTakhti}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} /> {style.label}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 rounded-full h-1.5 w-20">
                          <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${r.masteryPct}%` }} />
                        </div>
                        <span className="text-[10px] text-gray-500">{r.masteryPct}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {r.needsRevisionCount > 0 && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-amber-600"><AlertTriangle size={11} /> {r.needsRevisionCount}</span>
                      )}
                      {r.overallStatus === 'completed' && <CheckCircle2 size={14} className="text-emerald-500 inline" />}
                      {!r.hasProgress && <Circle size={11} className="text-gray-300 inline" />}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button onClick={(e) => { e.stopPropagation(); setSelectedStudent(r); }}
                        className="text-[11px] text-emerald-700 font-medium hover:underline">
                        {r.hasProgress ? 'View / Record' : 'Start Tracking'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selectedStudent && (
        <QaidaStudentModal
          student={{
            studentId: selectedStudent.studentId,
            studentName: selectedStudent.studentName,
            grade: selectedStudent.grade || grade,
            section: selectedStudent.section || section,
          }}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </div>
  );
};

export default QaidaTab;
