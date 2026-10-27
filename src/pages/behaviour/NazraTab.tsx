// ============================================================
// NAZRA (QUR'AN READING) TRACKER
// 30-Para progress tracking + daily Sabaq/Sabqi/Manzil diary
// Eldermin ERP | React + TypeScript + Tailwind
// ============================================================

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import {
  BookMarked, X, Save, CheckCircle2, AlertTriangle, Circle, PlayCircle, Sparkles,
} from 'lucide-react';
import { GradeLevelDropdown, SectionDropdown } from '../teaching/tabs/shared';
import {
  useNazraParas, useNazraSummary, useNazraClassProgress, useNazraProgress,
  useInitNazraProgress, useRecordNazraDiaryEntry, useUpdateParaStatus, useUpdateNazraRemarks,
} from '../../hooks/useNazra';
import type { DiaryRevisionInput, NazraRating } from '../../services/nazra.api';

const STATUS_STYLE: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  completed: { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Completed' },
  in_progress: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500', label: 'In Progress' },
  needs_revision: { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500', label: 'Needs Revision' },
  not_started: { bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-400', label: 'Not Started' },
};

const RATING_OPTIONS: { value: NazraRating; label: string; color: string }[] = [
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
  qalqalah_missed: 'Qalqalah missed',
  idgham_missed: 'Idgham missed',
  ikhfa_missed: 'Ikhfa missed',
  izhar_missed: 'Izhar missed',
  iqlab_missed: 'Iqlab missed',
  waqf_ignored: 'Waqf ignored',
  tashdeed_not_doubled: 'Tashdeed not doubled',
  fluency_too_slow: 'Fluency too slow',
  word_misread: 'Word misread',
};

type RevisionKind = 'sabqi' | 'manzil';

const emptyRevision = (paraNumber: number): DiaryRevisionInput => ({
  paraNumber, pageFrom: '', pageTo: '', rating: 'proficient', errorsNoted: [], remarks: '',
});

// ── Student Detail / Record-Diary Modal ──────────────────────
const NazraStudentModal: React.FC<{ student: { studentId: string; studentName: string; grade: string; section?: string }; onClose: () => void }> = ({ student, onClose }) => {
  const { data: parasData } = useNazraParas();
  const paras = parasData?.paras || [];
  const { data: progress, isLoading, isError } = useNazraProgress(student.studentId);
  const initMutation = useInitNazraProgress();
  const diaryMutation = useRecordNazraDiaryEntry();
  const statusMutation = useUpdateParaStatus();
  const remarksMutation = useUpdateNazraRemarks();

  const [showForm, setShowForm] = useState(false);
  const todayStr = () => new Date().toISOString().slice(0, 10);
  const nowStr = () => new Date().toTimeString().slice(0, 5);
  const [entryDate, setEntryDate] = useState(todayStr());
  const [entryTime, setEntryTime] = useState(nowStr());

  const [sabaqPara, setSabaqPara] = useState(1);
  const [sabaqFrom, setSabaqFrom] = useState('');
  const [sabaqTo, setSabaqTo] = useState('');
  const [sabaqRating, setSabaqRating] = useState<NazraRating>('developing');
  const [makhraj, setMakhraj] = useState(3);
  const [tajweed, setTajweed] = useState(3);
  const [fluency, setFluency] = useState(3);
  const [sabaqErrors, setSabaqErrors] = useState<string[]>([]);
  const [sabaqRemarks, setSabaqRemarks] = useState('');

  const [sabqi, setSabqi] = useState<DiaryRevisionInput | null>(null);
  const [manzil, setManzil] = useState<DiaryRevisionInput | null>(null);

  const progressMap = new Map((progress?.paras || []).map((p: any) => [p.paraNumber, p]));
  const currentPara = progress?.currentPara ?? 1;
  const completedParas = (progress?.paras || []).filter((p: any) => p.status === 'completed');

  const openForm = (paraNumber: number) => {
    setSabaqPara(paraNumber);
    setSabaqFrom(''); setSabaqTo(''); setSabaqRating('developing');
    setMakhraj(3); setTajweed(3); setFluency(3); setSabaqErrors([]); setSabaqRemarks('');
    setSabqi(null); setManzil(null);
    setEntryDate(todayStr()); setEntryTime(nowStr());
    setShowForm(true);
  };

  const toggleSabaqError = (key: string) =>
    setSabaqErrors(prev => prev.includes(key) ? prev.filter(e => e !== key) : [...prev, key]);

  const toggleRevisionError = (kind: RevisionKind, key: string) => {
    const set = kind === 'sabqi' ? setSabqi : setManzil;
    set(prev => prev ? {
      ...prev,
      errorsNoted: (prev.errorsNoted || []).includes(key)
        ? (prev.errorsNoted || []).filter(e => e !== key)
        : [...(prev.errorsNoted || []), key],
    } : prev);
  };

  const submitDiary = () => {
    const date = entryDate ? new Date(`${entryDate}T${entryTime || '00:00'}`).toISOString() : undefined;
    diaryMutation.mutate({
      studentId: student.studentId,
      data: {
        date,
        sabaq: {
          paraNumber: sabaqPara, pageFrom: sabaqFrom || undefined, pageTo: sabaqTo || undefined,
          rating: sabaqRating, makhrajAccuracy: makhraj, tajweedAccuracy: tajweed, fluency,
          errorsNoted: sabaqErrors, remarks: sabaqRemarks || undefined,
        },
        sabqi: sabqi ? { ...sabqi, pageFrom: sabqi.pageFrom || undefined, pageTo: sabqi.pageTo || undefined, remarks: sabqi.remarks || undefined } : undefined,
        manzil: manzil ? { ...manzil, pageFrom: manzil.pageFrom || undefined, pageTo: manzil.pageTo || undefined, remarks: manzil.remarks || undefined } : undefined,
      },
    }, {
      onSuccess: () => { toast.success('Diary entry recorded'); setShowForm(false); },
      onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to record diary entry'),
    });
  };

  const renderRevisionBlock = (kind: RevisionKind) => {
    const value = kind === 'sabqi' ? sabqi : manzil;
    const setValue = kind === 'sabqi' ? setSabqi : setManzil;
    const label = kind === 'sabqi' ? 'Sabqi (Recent Revision)' : 'Manzil (Long-Cycle Revision)';
    const hint = kind === 'sabqi'
      ? 'Revising the last few days’/week’s sabaq so fluency doesn’t fade.'
      : 'Revising portions completed long ago, to keep them fresh over the whole program.';
    return (
      <div className="border border-gray-200 rounded-xl p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-700">{label}</p>
            <p className="text-[10px] text-gray-400">{hint}</p>
          </div>
          <label className="flex items-center gap-1.5 text-[10px] text-gray-500 cursor-pointer">
            <input type="checkbox" checked={!!value}
              onChange={e => setValue(e.target.checked ? emptyRevision(completedParas[0]?.paraNumber || 1) : null)} />
            Include today
          </label>
        </div>
        {value && (
          <div className="space-y-2.5">
            <div className="grid grid-cols-3 gap-2">
              <select value={value.paraNumber} onChange={e => setValue({ ...value, paraNumber: Number(e.target.value) })}
                className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none">
                {paras.map((p: any) => <option key={p.number} value={p.number}>Para {p.number} — {p.titleEn}</option>)}
              </select>
              <input value={value.pageFrom || ''} onChange={e => setValue({ ...value, pageFrom: e.target.value })} placeholder="Page from"
                className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none" />
              <input value={value.pageTo || ''} onChange={e => setValue({ ...value, pageTo: e.target.value })} placeholder="Page to"
                className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none" />
            </div>
            <div className="flex gap-1.5">
              {RATING_OPTIONS.map(r => (
                <button key={r.value} type="button" onClick={() => setValue({ ...value, rating: r.value })}
                  className={`flex-1 py-1.5 rounded-lg border text-[10px] font-medium transition-all ${value.rating === r.value ? r.color : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}>
                  {r.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(ERROR_LABELS).map(([key, errLabel]) => (
                <button key={key} type="button" onClick={() => toggleRevisionError(kind, key)}
                  className={`text-[9px] px-2 py-0.5 rounded-full border transition-all ${(value.errorsNoted || []).includes(key) ? 'bg-amber-100 text-amber-700 border-amber-300' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}>
                  {errLabel}
                </button>
              ))}
            </div>
            <input value={value.remarks || ''} onChange={e => setValue({ ...value, remarks: e.target.value })} placeholder="Remarks (optional)..."
              className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none" />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600"><BookMarked size={18} /></div>
            <div>
              <h2 className="text-base font-bold text-gray-800">{student.studentName}</h2>
              <p className="text-xs text-gray-400">{student.grade} {student.section || ''} · Nazra Qur'an Diary</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {isLoading && <div className="py-10 text-center text-gray-400 text-sm">Loading progress…</div>}

          {isError && !isLoading && (
            <div className="text-center py-10">
              <Sparkles size={28} className="mx-auto text-teal-400 mb-3" />
              <p className="text-sm font-semibold text-gray-700 mb-1">Not started yet</p>
              <p className="text-xs text-gray-400 mb-4">Begin this student's Nazra journey at Para 1 — Alif Lam Meem.</p>
              <button
                onClick={() => initMutation.mutate({
                  studentId: student.studentId,
                  data: { studentName: student.studentName, grade: student.grade, section: student.section },
                }, { onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to start tracking') })}
                disabled={initMutation.isPending}
                className="inline-flex items-center gap-1.5 bg-teal-600 text-white text-xs px-4 py-2.5 rounded-lg hover:bg-teal-700 font-medium disabled:opacity-50">
                <PlayCircle size={14} /> {initMutation.isPending ? 'Starting…' : 'Start Nazra Tracking'}
              </button>
            </div>
          )}

          {progress && !isLoading && (
            <>
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-emerald-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-emerald-700">{(progress.paras || []).filter((p: any) => p.status === 'completed').length}/{paras.length || 30}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Completed</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-blue-700">Para {currentPara}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Currently On</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-amber-700">{(progress.paras || []).filter((p: any) => p.status === 'needs_revision').length}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Needs Revision</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-gray-700 capitalize">{(progress.overallStatus || '').replace(/_/g, ' ')}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Overall Status</p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">The 30-Para Journey</p>
                  <button onClick={() => openForm(currentPara)}
                    className="text-[11px] text-teal-700 font-medium hover:underline">Record Today's Diary Entry</button>
                </div>
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                  {paras.map((p: any) => {
                    const record: any = progressMap.get(p.number);
                    const status = record?.status || 'not_started';
                    const style = STATUS_STYLE[status];
                    return (
                      <button key={p.number} onClick={() => openForm(p.number)}
                        className={`${style.bg} rounded-lg p-2 text-center hover:ring-2 hover:ring-offset-1 hover:ring-teal-300 transition-all`}
                        title={`${p.titleEn} (${p.titleAr})`}>
                        <p className={`text-sm font-bold ${style.text}`}>{p.number}</p>
                        <p className={`text-[8px] font-medium ${style.text} leading-tight line-clamp-1`}>{p.titleEn}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {showForm && (
                <div className="border border-teal-200 bg-teal-50/30 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-800">Record Today's Diary Entry</p>
                    <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] text-gray-500 mb-1">Date</p>
                      <input type="date" value={entryDate} onChange={e => setEntryDate(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 mb-1">Time</p>
                      <input type="time" value={entryTime} onChange={e => setEntryTime(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none" />
                    </div>
                  </div>

                  <div className="border border-teal-200 rounded-xl p-3 space-y-2.5 bg-white">
                    <p className="text-xs font-semibold text-gray-700">Sabaq (Today's New Lesson)</p>
                    <div className="grid grid-cols-3 gap-2">
                      <select value={sabaqPara} onChange={e => setSabaqPara(Number(e.target.value))}
                        className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none">
                        {paras.map((p: any) => <option key={p.number} value={p.number}>Para {p.number} — {p.titleEn}</option>)}
                      </select>
                      <input value={sabaqFrom} onChange={e => setSabaqFrom(e.target.value)} placeholder="Page from"
                        className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none" />
                      <input value={sabaqTo} onChange={e => setSabaqTo(e.target.value)} placeholder="Page to"
                        className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none" />
                    </div>

                    <div className="flex gap-2">
                      {RATING_OPTIONS.map(r => (
                        <button key={r.value} onClick={() => setSabaqRating(r.value)}
                          className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-all ${sabaqRating === r.value ? r.color : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}>
                          {r.label}
                        </button>
                      ))}
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
                                className={`w-6 h-6 rounded-full text-[10px] font-bold transition-all ${f.value >= n ? 'bg-teal-500 text-white' : 'bg-gray-200 text-gray-500 hover:bg-teal-100'}`}>
                                {n}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(ERROR_LABELS).map(([key, label]) => (
                        <button key={key} onClick={() => toggleSabaqError(key)}
                          className={`text-[10px] px-2.5 py-1 rounded-full border transition-all ${sabaqErrors.includes(key) ? 'bg-amber-100 text-amber-700 border-amber-300' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}>
                          {label}
                        </button>
                      ))}
                    </div>

                    <textarea rows={2} value={sabaqRemarks} onChange={e => setSabaqRemarks(e.target.value)} placeholder="Remarks (optional)..."
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none resize-none" />
                  </div>

                  {renderRevisionBlock('sabqi')}
                  {renderRevisionBlock('manzil')}

                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => statusMutation.mutate({ studentId: student.studentId, paraNumber: sabaqPara, status: 'needs_revision' }, {
                        onSuccess: () => { toast.success('Marked for revision'); setShowForm(false); },
                      })}
                      className="text-xs text-amber-600 font-medium hover:underline">
                      Mark Para Needs Revision (no diary entry)
                    </button>
                    <button onClick={submitDiary} disabled={diaryMutation.isPending}
                      className="flex items-center gap-1.5 bg-teal-600 text-white text-xs px-4 py-2 rounded-lg hover:bg-teal-700 font-medium disabled:opacity-50">
                      <Save size={12} /> {diaryMutation.isPending ? 'Saving…' : 'Save Diary Entry'}
                    </button>
                  </div>
                </div>
              )}

              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">Diary Log</p>
                <div className="space-y-1.5 max-h-56 overflow-y-auto">
                  {(!progress.diaryEntries || progress.diaryEntries.length === 0) && (
                    <p className="text-xs text-gray-400 py-4 text-center bg-gray-50 rounded-lg">No diary entries recorded yet — click a Para above to record today's lesson.</p>
                  )}
                  {(progress.diaryEntries || []).slice().reverse().map((e: any, i: number) => (
                    <div key={i} className="bg-gray-50 rounded-lg px-3 py-2 text-xs space-y-1">
                      <p className="text-[10px] text-gray-400">{new Date(e.date).toLocaleDateString()} · {e.assessedBy}</p>
                      <p className="text-gray-700">
                        <span className="font-medium">Sabaq:</span> Para {e.sabaq.paraNumber}
                        {e.sabaq.pageFrom && ` (p.${e.sabaq.pageFrom}${e.sabaq.pageTo ? `–${e.sabaq.pageTo}` : ''})`}
                        {' '}<span className="capitalize text-teal-600">{e.sabaq.rating.replace('_', ' ')}</span>
                      </p>
                      {e.sabqi && (
                        <p className="text-gray-600"><span className="font-medium">Sabqi:</span> Para {e.sabqi.paraNumber} <span className="capitalize text-blue-600">{e.sabqi.rating.replace('_', ' ')}</span></p>
                      )}
                      {e.manzil && (
                        <p className="text-gray-600"><span className="font-medium">Manzil:</span> Para {e.manzil.paraNumber} <span className="capitalize text-indigo-600">{e.manzil.rating.replace('_', ' ')}</span></p>
                      )}
                    </div>
                  ))}
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
                }} placeholder="Overall progress remarks for this student's Nazra journey..."
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
export const NazraTab: React.FC = () => {
  const [grade, setGrade] = useState('');
  const [section, setSection] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  const { data: summary } = useNazraSummary();
  const { data: roster = [], isLoading } = useNazraClassProgress(grade, section || undefined);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-gray-800">Nazra Qur'an Tracker</h2>
        <p className="text-xs text-gray-400">30-Para progress tracking with a daily Sabaq / Sabqi / Manzil diary</p>
      </div>

      {summary && (
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xl font-bold text-gray-800">{summary.totalStudentsTracked}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Students Tracked</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xl font-bold text-emerald-600">{summary.completedCount}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Completed All 30</p>
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
          <BookMarked size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-gray-500">Select a grade to see the class's Nazra progress</p>
        </div>
      )}

      {grade && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 text-gray-500 border-b border-gray-100">
                <th className="py-3 px-4 text-left font-semibold">Student</th>
                <th className="py-3 px-4 font-semibold">Current Para</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Completion</th>
                <th className="py-3 px-4 font-semibold">Flags</th>
                <th className="py-3 px-4 font-semibold">Last Entry</th>
                <th className="py-3 px-4 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-b border-gray-50"><td colSpan={7} className="py-3 px-4"><div className="animate-pulse h-4 bg-gray-100 rounded w-3/4" /></td></tr>
              ))}
              {!isLoading && roster.length === 0 && (
                <tr><td colSpan={7} className="py-12 text-center text-gray-400">No active students in this class</td></tr>
              )}
              {roster.map((r: any) => {
                const style = STATUS_STYLE[r.overallStatus] || STATUS_STYLE.not_started;
                return (
                  <tr key={r.studentId} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedStudent(r)}>
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-800">{r.studentName}</p>
                      <p className="text-[10px] text-gray-400">{r.admissionNumber || '—'}</p>
                    </td>
                    <td className="py-3 px-4 text-center font-medium text-gray-700">Para {r.currentPara}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} /> {style.label}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 rounded-full h-1.5 w-20">
                          <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${r.completionPct}%` }} />
                        </div>
                        <span className="text-[10px] text-gray-500">{r.completionPct}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {r.needsRevisionCount > 0 && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-amber-600"><AlertTriangle size={11} /> {r.needsRevisionCount}</span>
                      )}
                      {r.overallStatus === 'completed' && <CheckCircle2 size={14} className="text-emerald-500 inline" />}
                      {!r.hasProgress && <Circle size={11} className="text-gray-300 inline" />}
                    </td>
                    <td className="py-3 px-4 text-center text-[10px] text-gray-400">
                      {r.lastDiaryDate ? new Date(r.lastDiaryDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button onClick={(e) => { e.stopPropagation(); setSelectedStudent(r); }}
                        className="text-[11px] text-teal-700 font-medium hover:underline">
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
        <NazraStudentModal
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

export default NazraTab;
