// ============================================================
// QAIDA QUICK CLASS RECORDING
// Tap-only, whole-class daily recording built for a phone in one hand:
// every student's next sabaq is pre-filled from where they stopped, a
// rating is one tap, whole-class actions cover the common case, and the
// class is saved in one go. Same model as NazraQuickRecord.
// ============================================================

import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { X, Minus, Plus, Check, BookOpen, RotateCcw } from 'lucide-react';
import { useQaidaTakhtis, useRecordQaidaClassAttempts } from '../../hooks/useQaida';
import type { QaidaRating, QaidaTakhtiDef } from '../../services/qaida.api';
import { formatClassLabel } from './types';

const PASSING: QaidaRating[] = ['proficient', 'mastered'];
const DEFAULT_SPAN = 3;

const QUICK_RATINGS: { value: QaidaRating; emoji: string; label: string; on: string; off: string }[] = [
  { value: 'needs_practice', emoji: '😟', label: 'Weak', on: 'bg-red-500 text-white border-red-500', off: 'bg-red-50 text-red-700 border-red-100' },
  { value: 'developing', emoji: '🙂', label: 'Fair', on: 'bg-amber-500 text-white border-amber-500', off: 'bg-amber-50 text-amber-700 border-amber-100' },
  { value: 'proficient', emoji: '👍', label: 'Good', on: 'bg-blue-600 text-white border-blue-600', off: 'bg-blue-50 text-blue-700 border-blue-100' },
  { value: 'mastered', emoji: '⭐', label: 'Excellent', on: 'bg-emerald-600 text-white border-emerald-600', off: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
];

interface Sabaq {
  takhti: number;
  fromIdx?: number;
  toIdx?: number;
}

interface Row extends Sabaq {
  studentId: string;
  studentName: string;
  admissionNumber?: string;
  rating?: QaidaRating;
  absent: boolean;
  boardDone: boolean;
  repeating: boolean;
  recordedToday: boolean;
  recordAgain: boolean;
  saved: boolean;
  error?: string;
}

const localDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// The tappable letter list for a board, if it has a fixed one. Matches what
// the detailed modal stores as sabaqFrom/sabaqTo.
const labelsOf = (t?: QaidaTakhtiDef) => t?.referenceLabels || t?.referenceContent;

// Next sabaq = continue right after where the student stopped on their
// current board, same number of letters as last time. A weak last sabaq is
// repeated instead. A board with no letter list has nothing to pre-fill.
function nextSabaq(currentTakhti: number, last: any, takhtis: QaidaTakhtiDef[]): { sabaq: Sabaq; repeating: boolean } {
  const board = takhtis.find((t) => t.number === currentTakhti);
  const labels = labelsOf(board);
  if (!labels?.length) return { sabaq: { takhti: currentTakhti }, repeating: false };
  const fresh = { takhti: currentTakhti, fromIdx: 0, toIdx: Math.min(DEFAULT_SPAN, labels.length) - 1 };
  if (!last || last.takhtiNumber !== currentTakhti) return { sabaq: fresh, repeating: false };
  const lastFrom = labels.indexOf(last.sabaqFrom);
  const lastTo = labels.indexOf(last.sabaqTo ?? last.sabaqFrom);
  if (lastTo < 0) return { sabaq: fresh, repeating: false };
  const from0 = lastFrom < 0 ? lastTo : Math.min(lastFrom, lastTo);
  if (last.rating && !PASSING.includes(last.rating)) {
    return { sabaq: { takhti: currentTakhti, fromIdx: from0, toIdx: lastTo }, repeating: true };
  }
  const span = Math.min(Math.max(lastTo - from0 + 1, 1), 10);
  const from = lastTo + 1;
  if (from >= labels.length) return { sabaq: { takhti: currentTakhti }, repeating: false };
  return { sabaq: { takhti: currentTakhti, fromIdx: from, toIdx: Math.min(from + span - 1, labels.length - 1) }, repeating: false };
}

const sabaqText = (s: Sabaq, takhtis: QaidaTakhtiDef[]) => {
  const labels = labelsOf(takhtis.find((t) => t.number === s.takhti));
  if (!labels || s.fromIdx == null) return null;
  const from = labels[s.fromIdx];
  const to = s.toIdx != null && s.toIdx !== s.fromIdx ? labels[s.toIdx] : null;
  return to ? `${from} – ${to}` : from;
};

// ── Sabaq picker bottom sheet (tap-only) ──────────────────────
const SabaqSheet: React.FC<{
  title: string;
  initial: Sabaq;
  takhtis: QaidaTakhtiDef[];
  onApply: (s: Sabaq) => void;
  onClose: () => void;
}> = ({ title, initial, takhtis, onApply, onClose }) => {
  const [s, setS] = useState<Sabaq>(initial);
  const board = takhtis.find((t) => t.number === s.takhti);
  const labels = labelsOf(board);
  const arabic = board?.referenceContent;

  const pickBoard = (n: number) => {
    if (n === s.takhti) return;
    const l = labelsOf(takhtis.find((t) => t.number === n));
    setS(l?.length ? { takhti: n, fromIdx: 0, toIdx: Math.min(DEFAULT_SPAN, l.length) - 1 } : { takhti: n });
  };

  // First tap sets "From"; the next tap on or after it sets "To"; tapping
  // before "From" restarts the range - same as the detailed screen.
  const [awaitingTo, setAwaitingTo] = useState(false);
  const tapLetter = (i: number) => {
    if (!awaitingTo || s.fromIdx == null || i < s.fromIdx) {
      setS({ ...s, fromIdx: i, toIdx: i });
      setAwaitingTo(true);
    } else {
      setS({ ...s, toIdx: i });
      setAwaitingTo(false);
    }
  };
  const setSpan = (n: number) => {
    if (!labels || s.fromIdx == null) return;
    setS({ ...s, toIdx: Math.min(s.fromIdx + n - 1, labels.length - 1) });
    setAwaitingTo(false);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100">
          <p className="text-base font-bold text-gray-800">{title}</p>
          <button onClick={onClose} title="Close" className="h-10 w-10 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          <div>
            <p className="text-[11px] font-semibold text-gray-500 mb-2">TAKHTI (BOARD)</p>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              {takhtis.map((t) => (
                <button key={t.number} type="button" onClick={() => pickBoard(t.number)}
                  className={`shrink-0 h-11 min-w-[2.75rem] px-3 rounded-xl border text-sm font-semibold ${s.takhti === t.number ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-700 border-gray-200'}`}>
                  {t.number}
                </button>
              ))}
            </div>
            {board && <p className="text-sm font-semibold text-gray-800 mt-2">{board.titleEn} <span className="font-normal text-gray-400" dir="rtl">{board.titleUr}</span></p>}
          </div>

          {labels?.length ? (
            <div>
              <p className="text-[11px] font-semibold text-gray-500 mb-2">
                SABAQ <span className="font-normal text-gray-400">· tap the first letter, then the last</span>
              </p>
              <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
                {labels.map((label, i) => {
                  const inRange = s.fromIdx != null && i >= s.fromIdx && i <= (s.toIdx ?? s.fromIdx);
                  const isEnd = i === s.fromIdx || i === s.toIdx;
                  return (
                    <button key={i} type="button" onClick={() => tapLetter(i)}
                      className={`h-16 rounded-xl border flex flex-col items-center justify-center ${
                        isEnd ? 'bg-emerald-600 text-white border-emerald-600'
                          : inRange ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-white text-gray-700 border-gray-200'}`}>
                      {arabic && arabic[i] !== label && <span className="text-xl leading-none" dir="rtl">{arabic[i]}</span>}
                      <span className={`text-[10px] font-semibold leading-tight text-center px-0.5 ${arabic && arabic[i] !== label ? 'mt-1' : 'text-xs'}`}>{label}</span>
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2 mt-3">
                {[1, 3, 5].map((n) => (
                  <button key={n} type="button" onClick={() => setSpan(n)} disabled={s.fromIdx == null}
                    className="flex-1 h-10 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 active:bg-gray-100 disabled:opacity-30">
                    {n} letter{n === 1 ? '' : 's'}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 bg-gray-50 rounded-xl p-3">
              This board has no fixed letter list — just rate the student. Use the detailed screen if you want to note the exact page or words.
            </p>
          )}
        </div>

        <div className="p-4 border-t border-gray-100">
          <button type="button" onClick={() => onApply(s)}
            className="w-full h-14 rounded-2xl bg-emerald-600 text-white text-base font-bold active:bg-emerald-700">
            Use this sabaq
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main screen ───────────────────────────────────────────────
export const QaidaQuickRecord: React.FC<{ grade: string; section?: string; roster: any[]; onClose: () => void }> = ({ grade, section, roster, onClose }) => {
  const { data: takhtisData } = useQaidaTakhtis();
  const takhtis = useMemo(() => takhtisData?.takhtis || [], [takhtisData]);
  const saveMutation = useRecordQaidaClassAttempts();

  const [date, setDate] = useState(localDay(new Date()));
  const [rows, setRows] = useState<Row[]>([]);
  const [sheet, setSheet] = useState<{ target: 'all' | string } | null>(null);
  const [filter, setFilter] = useState<'all' | 'todo' | 'done'>('all');

  useEffect(() => {
    if (rows.length || !takhtis.length || !roster.length) return;
    const today = localDay(new Date());
    setRows(roster.map((r: any) => {
      const { sabaq, repeating } = nextSabaq(r.currentTakhti ?? 1, r.lastAttempt, takhtis);
      return {
        studentId: String(r.studentId),
        studentName: r.studentName,
        admissionNumber: r.admissionNumber,
        ...sabaq,
        repeating,
        absent: false,
        boardDone: false,
        recordedToday: !!r.lastAttemptDate && localDay(new Date(r.lastAttemptDate)) === today,
        recordAgain: false,
        saved: false,
      };
    }));
  }, [roster, takhtis, rows.length]);

  const update = (id: string, patch: Partial<Row>) =>
    setRows((prev) => prev.map((r) => (r.studentId === id ? { ...r, ...patch, error: undefined } : r)));

  const isActive = (r: Row) => !r.absent && !r.saved && (!r.recordedToday || r.recordAgain);
  const toSave = rows.filter((r) => isActive(r) && r.rating);
  const pending = rows.filter((r) => isActive(r) && !r.rating);
  const doneCount = rows.filter((r) => r.saved || (r.recordedToday && !r.recordAgain)).length;

  const setRating = (r: Row, rating: QaidaRating) => {
    const same = r.rating === rating;
    update(r.studentId, {
      rating: same ? undefined : rating,
      boardDone: same || !PASSING.includes(rating) ? false : r.boardDone,
    });
  };

  const nudgeTo = (r: Row, delta: number) => {
    const labels = labelsOf(takhtis.find((t) => t.number === r.takhti));
    if (!labels || r.fromIdx == null) return;
    const to = Math.min(Math.max((r.toIdx ?? r.fromIdx) + delta, r.fromIdx), labels.length - 1);
    update(r.studentId, { toIdx: to });
  };

  const applySabaq = (s: Sabaq) => {
    if (!sheet) return;
    if (sheet.target === 'all') {
      setRows((prev) => prev.map((r) => (isActive(r) ? { ...r, ...s, repeating: false, error: undefined } : r)));
      toast.success('Sabaq set for the whole class');
    } else {
      update(sheet.target, { ...s, repeating: false });
    }
    setSheet(null);
  };

  const markAllGood = () => {
    const n = pending.length;
    if (!n) return;
    setRows((prev) => prev.map((r) => (isActive(r) && !r.rating ? { ...r, rating: 'proficient' } : r)));
    toast.success(`${n} student${n === 1 ? '' : 's'} marked Good`);
  };

  const handleClose = () => {
    if (toSave.length && !window.confirm(`${toSave.length} marked student${toSave.length === 1 ? ' is' : 's are'} not saved yet. Close anyway?`)) return;
    onClose();
  };

  const save = () => {
    if (!toSave.length) return;
    const when = date === localDay(new Date()) ? new Date() : new Date(`${date}T12:00:00`);
    saveMutation.mutate({
      date: when.toISOString(),
      grade,
      section,
      entries: toSave.map((r) => {
        const labels = labelsOf(takhtis.find((t) => t.number === r.takhti));
        return {
          studentId: r.studentId,
          studentName: r.studentName,
          takhtiNumber: r.takhti,
          rating: r.rating!,
          sabaqFrom: labels && r.fromIdx != null ? labels[r.fromIdx] : undefined,
          sabaqTo: labels && r.fromIdx != null ? labels[r.toIdx ?? r.fromIdx] : undefined,
          completesTakhti: r.boardDone && PASSING.includes(r.rating!),
        };
      }),
    }, {
      onSuccess: (res) => {
        const byId = new Map(res.results.map((x) => [x.studentId, x]));
        setRows((prev) => prev.map((r) => {
          const result = byId.get(r.studentId);
          if (!result) return r;
          return result.ok ? { ...r, saved: true, error: undefined } : { ...r, error: result.error || 'Could not save' };
        }));
        if (res.failed) toast.error(`${res.saved} saved · ${res.failed} need attention (shown in red)`);
        else toast.success(`Saved ${res.saved} student${res.saved === 1 ? '' : 's'} ✓`);
      },
      onError: (e: any) => toast.error(e?.response?.data?.message || 'Could not save — check your connection and try again'),
    });
  };

  const visible = rows.filter((r) => {
    if (filter === 'todo') return isActive(r) && !r.rating;
    if (filter === 'done') return !isActive(r) || !!r.rating;
    return true;
  });

  const allDone = rows.length > 0 && rows.every((r) => !isActive(r)) && rows.some((r) => r.saved);

  const sheetRow = sheet && sheet.target !== 'all' ? rows.find((r) => r.studentId === sheet.target) : null;
  const firstActive = rows.find(isActive);
  const base = sheetRow || firstActive;
  const sheetInitial: Sabaq = { takhti: base?.takhti ?? 1, fromIdx: base?.fromIdx, toIdx: base?.toIdx };

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 shrink-0">
        <div className="max-w-2xl mx-auto px-4 pt-3 pb-3">
          <div className="flex items-center gap-3">
            <button onClick={handleClose} title="Close" className="h-11 w-11 -ml-2 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500"><X size={22} /></button>
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold text-gray-800 truncate">Qaida Recording</p>
              <p className="text-xs text-gray-400 truncate">{formatClassLabel(grade, section)}</p>
            </div>
            <input type="date" value={date} max={localDay(new Date())} onChange={(e) => e.target.value && setDate(e.target.value)}
              title="Sabaq date"
              className="h-10 w-[8.5rem] px-2 rounded-xl border border-gray-200 text-xs text-gray-600 focus:outline-none" />
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-gray-500">
            <span><b className="text-gray-800">{doneCount}</b> done · <b className="text-emerald-700">{toSave.length}</b> ready · {pending.length} to do</span>
          </div>
          <div className="mt-1.5 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 transition-all" style={{ width: `${rows.length ? Math.round(((doneCount + toSave.length) / rows.length) * 100) : 0}%` }} />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-4 space-y-3 pb-32">
          {!takhtis.length || (!rows.length && roster.length) ? (
            <p className="text-center text-sm text-gray-400 py-16">Loading class…</p>
          ) : roster.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-16">No active students in this class</p>
          ) : allDone ? (
            <ClassDaySummary rows={rows} takhtis={takhtis} onClose={onClose} />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setSheet({ target: 'all' })}
                  className="h-14 rounded-2xl bg-white border border-gray-200 text-sm font-semibold text-gray-700 flex items-center justify-center gap-2 active:bg-gray-50">
                  <BookOpen size={18} className="text-emerald-600" /> Same sabaq for all
                </button>
                <button type="button" onClick={markAllGood} disabled={!pending.length}
                  className="h-14 rounded-2xl bg-white border border-gray-200 text-sm font-semibold text-gray-700 flex items-center justify-center gap-2 active:bg-gray-50 disabled:opacity-40">
                  <span className="text-lg">👍</span> Everyone Good
                </button>
              </div>
              <p className="text-[11px] text-gray-400 px-1">Each student is already set to continue from where they stopped. Just tap a rating — change only what's different.</p>

              <div className="flex gap-2">
                {([['all', `All ${rows.length}`], ['todo', `To do ${pending.length}`], ['done', 'Marked']] as const).map(([k, label]) => (
                  <button key={k} type="button" onClick={() => setFilter(k)}
                    className={`h-9 px-4 rounded-full text-xs font-semibold border ${filter === k ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200'}`}>
                    {label}
                  </button>
                ))}
              </div>

              {visible.map((r) => (
                <StudentCard key={r.studentId} r={r} takhtis={takhtis}
                  onRating={(rating) => setRating(r, rating)}
                  onAbsent={() => update(r.studentId, { absent: !r.absent, rating: undefined, boardDone: false })}
                  onSabaq={() => setSheet({ target: r.studentId })}
                  onNudge={(d) => nudgeTo(r, d)}
                  onBoardDone={() => update(r.studentId, { boardDone: !r.boardDone })}
                  onRecordAgain={() => update(r.studentId, { recordAgain: true })}
                />
              ))}
              {visible.length === 0 && <p className="text-center text-sm text-gray-400 py-10">Nothing here</p>}
            </>
          )}
        </div>
      </div>

      {!allDone && rows.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
          <div className="max-w-2xl mx-auto px-4 py-3">
            {pending.length > 0 && toSave.length > 0 && (
              <p className="text-[11px] text-gray-400 text-center mb-2">{pending.length} not marked yet — they won't be saved</p>
            )}
            <button type="button" onClick={save} disabled={!toSave.length || saveMutation.isPending}
              className="w-full h-14 rounded-2xl bg-emerald-600 text-white text-base font-bold active:bg-emerald-700 disabled:opacity-40">
              {saveMutation.isPending ? 'Saving…' : toSave.length ? `Save ${toSave.length} student${toSave.length === 1 ? '' : 's'}` : 'Tap a rating to start'}
            </button>
          </div>
        </div>
      )}

      {sheet && (
        <SabaqSheet
          title={sheet.target === 'all' ? 'Sabaq for the whole class' : `Sabaq · ${sheetRow?.studentName ?? ''}`}
          initial={sheetInitial}
          takhtis={takhtis}
          onApply={applySabaq}
          onClose={() => setSheet(null)}
        />
      )}
    </div>
  );
};

// ── One student card ──────────────────────────────────────────
const StudentCard: React.FC<{
  r: Row;
  takhtis: QaidaTakhtiDef[];
  onRating: (rating: QaidaRating) => void;
  onAbsent: () => void;
  onSabaq: () => void;
  onNudge: (delta: number) => void;
  onBoardDone: () => void;
  onRecordAgain: () => void;
}> = ({ r, takhtis, onRating, onAbsent, onSabaq, onNudge, onBoardDone, onRecordAgain }) => {
  const passing = !!r.rating && PASSING.includes(r.rating);
  const board = takhtis.find((t) => t.number === r.takhti);
  const text = sabaqText(r, takhtis);
  const border = r.error ? 'border-red-300' : r.saved ? 'border-emerald-200' : r.rating ? 'border-emerald-300' : 'border-gray-100';

  return (
    <div className={`bg-white rounded-2xl border-2 ${border} p-3 sm:p-4 transition-colors`}>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-gray-800 truncate">{r.studentName}</p>
          {r.admissionNumber && <p className="text-[11px] text-gray-400">{r.admissionNumber}</p>}
        </div>
        {!r.saved && (!r.recordedToday || r.recordAgain) && (
          <button type="button" onClick={onAbsent}
            className={`h-9 px-3 rounded-full border text-xs font-semibold shrink-0 ${r.absent ? 'bg-gray-700 text-white border-gray-700' : 'bg-white text-gray-500 border-gray-200'}`}>
            {r.absent ? 'Absent' : 'Absent?'}
          </button>
        )}
      </div>

      {r.saved ? (
        <p className="mt-2 text-sm text-emerald-700 font-semibold flex items-center gap-1.5"><Check size={16} /> Saved · Takhti {r.takhti}{text ? ` · ${text}` : ''}</p>
      ) : r.recordedToday && !r.recordAgain ? (
        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="text-sm text-emerald-700 font-medium flex items-center gap-1.5"><Check size={16} /> Already recorded today</p>
          <button type="button" onClick={onRecordAgain} className="h-9 px-3 rounded-full border border-gray-200 text-xs font-semibold text-gray-600">Record again</button>
        </div>
      ) : r.absent ? null : (
        <div className="mt-3 space-y-3">
          <div className="flex items-stretch gap-2">
            <button type="button" onClick={onSabaq} className="flex-1 min-w-0 text-left rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2 active:bg-emerald-100">
              <p className="text-[11px] text-emerald-700 font-semibold truncate">Takhti {r.takhti}{board ? ` · ${board.titleEn}` : ''}</p>
              <p className="text-sm font-bold text-gray-800 truncate">{text || (labelsOf(board)?.length ? 'Tap to choose letters' : 'Whole board')}</p>
              {r.repeating && <p className="text-[10px] text-amber-700 flex items-center gap-1 mt-0.5"><RotateCcw size={10} /> Repeating — last sabaq was weak</p>}
            </button>
            {r.fromIdx != null && (
              <div className="flex flex-col gap-1 shrink-0">
                <button type="button" onClick={() => onNudge(1)} title="One more letter" className="h-[26px] w-11 rounded-lg border border-gray-200 flex items-center justify-center active:bg-gray-100"><Plus size={14} /></button>
                <button type="button" onClick={() => onNudge(-1)} title="One less letter" className="h-[26px] w-11 rounded-lg border border-gray-200 flex items-center justify-center active:bg-gray-100"><Minus size={14} /></button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-4 gap-2">
            {QUICK_RATINGS.map((q) => (
              <button key={q.value} type="button" onClick={() => onRating(q.value)}
                className={`h-16 rounded-xl border-2 flex flex-col items-center justify-center gap-0.5 transition-colors ${r.rating === q.value ? q.on : q.off}`}>
                <span className="text-xl leading-none">{q.emoji}</span>
                <span className="text-[11px] font-bold">{q.label}</span>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={onBoardDone} disabled={!passing}
              title={passing ? undefined : 'Rate Good or Excellent first'}
              className={`h-10 px-3 rounded-full border text-xs font-semibold disabled:opacity-30 ${r.boardDone ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-500 border-gray-200'}`}>
              {r.boardDone ? '✓ Takhti finished' : 'Takhti finished?'}
            </button>
          </div>

          {r.error && <p className="text-xs text-red-600 font-medium">{r.error}</p>}
        </div>
      )}
    </div>
  );
};

// ── End-of-session class report ───────────────────────────────
const ClassDaySummary: React.FC<{ rows: Row[]; takhtis: QaidaTakhtiDef[]; onClose: () => void }> = ({ rows, takhtis, onClose }) => {
  const saved = rows.filter((r) => r.saved);
  const absent = rows.filter((r) => r.absent).length;
  const counts = QUICK_RATINGS.map((q) => ({ ...q, n: saved.filter((r) => r.rating === q.value).length }));
  const weak = saved.filter((r) => r.rating && !PASSING.includes(r.rating));
  const finished = saved.filter((r) => r.boardDone);
  const where = (r: Row) => `Takhti ${r.takhti}${sabaqText(r, takhtis) ? ` · ${sabaqText(r, takhtis)}` : ''}`;
  return (
    <div className="space-y-3">
      <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
        <div className="mx-auto h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center mb-2"><Check size={28} className="text-emerald-600" /></div>
        <p className="text-lg font-bold text-gray-800">Class recorded</p>
        <p className="text-sm text-gray-500">{saved.length} saved{absent ? ` · ${absent} absent` : ''}</p>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {counts.map((c) => (
          <div key={c.value} className="bg-white rounded-2xl border border-gray-100 py-3 text-center">
            <p className="text-xl">{c.emoji}</p>
            <p className="text-lg font-bold text-gray-800">{c.n}</p>
            <p className="text-[10px] text-gray-400">{c.label}</p>
          </div>
        ))}
      </div>
      {weak.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-xs font-semibold text-amber-700 mb-2">Needs attention tomorrow ({weak.length})</p>
          {weak.map((r) => <p key={r.studentId} className="text-sm text-gray-700 py-0.5">{r.studentName} <span className="text-gray-400">· {where(r)}</span></p>)}
        </div>
      )}
      {finished.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-xs font-semibold text-emerald-700 mb-2">Finished a Takhti today 🎉</p>
          {finished.map((r) => <p key={r.studentId} className="text-sm text-gray-700 py-0.5">{r.studentName} <span className="text-gray-400">· Takhti {r.takhti}</span></p>)}
        </div>
      )}
      <button type="button" onClick={onClose} className="w-full h-14 rounded-2xl bg-gray-800 text-white text-base font-bold">Done</button>
    </div>
  );
};

export default QaidaQuickRecord;
