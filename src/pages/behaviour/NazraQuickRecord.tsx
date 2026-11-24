// ============================================================
// NAZRA QUICK CLASS RECORDING
// Tap-only, whole-class daily recording built for a phone in one hand:
// every student's next lesson is pre-filled from where they stopped,
// a rating is one tap, whole-class actions cover the common case, and
// the class is saved in one go.
// ============================================================

import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { X, Minus, Plus, Check, BookOpen, Search, RotateCcw } from 'lucide-react';
import { useNazraParas, useNazraSurahs, useRecordNazraClassDiary } from '../../hooks/useNazra';
import { useQaidaNazraSettings } from '../../hooks/useQaidaNazraExtras';
import type { NazraRating, QuranSurahDef } from '../../services/nazra.api';
import { formatClassLabel } from './types';

const PASSING: NazraRating[] = ['proficient', 'mastered'];

const QUICK_RATINGS: { value: NazraRating; emoji: string; label: string; on: string; off: string }[] = [
  { value: 'needs_practice', emoji: '😟', label: 'Weak', on: 'bg-red-500 text-white border-red-500', off: 'bg-red-50 text-red-700 border-red-100' },
  { value: 'developing', emoji: '🙂', label: 'Fair', on: 'bg-amber-500 text-white border-amber-500', off: 'bg-amber-50 text-amber-700 border-amber-100' },
  { value: 'proficient', emoji: '👍', label: 'Good', on: 'bg-blue-600 text-white border-blue-600', off: 'bg-blue-50 text-blue-700 border-blue-100' },
  { value: 'mastered', emoji: '⭐', label: 'Excellent', on: 'bg-emerald-600 text-white border-emerald-600', off: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
];

type Mark = 'good' | 'weak' | undefined;

interface Lesson {
  para: number;
  surahNumber?: number;
  surahName?: string;
  ayahFrom?: number;
  ayahTo?: number;
}

interface Row extends Lesson {
  studentId: string;
  studentName: string;
  admissionNumber?: string;
  rating?: NazraRating;
  absent: boolean;
  paraDone: boolean;
  sabqi: Mark;
  manzil: Mark;
  repeating: boolean;
  recordedToday: boolean;
  recordAgain: boolean;
  saved: boolean;
  error?: string;
}

const localDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Next lesson = continue right after where the student stopped, same
// length as last time. A weak last lesson is repeated instead.
function nextLesson(last: any, surahs: QuranSurahDef[], reverse: boolean): { lesson: Omit<Lesson, 'para'>; repeating: boolean } {
  if (!last?.surahNumber) return { lesson: {}, repeating: false };
  const cur = surahs.find((s) => s.number === last.surahNumber);
  if (!cur) return { lesson: {}, repeating: false };
  const lastFrom = last.ayahFrom ?? last.ayahTo ?? 1;
  const lastTo = last.ayahTo ?? last.ayahFrom ?? 1;
  if (last.rating && !PASSING.includes(last.rating)) {
    return { lesson: { surahNumber: cur.number, surahName: cur.nameEn, ayahFrom: lastFrom, ayahTo: lastTo }, repeating: true };
  }
  const size = Math.min(Math.max(lastTo - lastFrom + 1, 1), 20);
  let surah = cur;
  let from = lastTo + 1;
  if (from > cur.ayahCount) {
    const next = surahs.find((s) => s.number === (reverse ? cur.number - 1 : cur.number + 1));
    if (!next) return { lesson: { surahNumber: cur.number, surahName: cur.nameEn, ayahFrom: lastFrom, ayahTo: lastTo }, repeating: false };
    surah = next;
    from = 1;
  }
  return {
    lesson: { surahNumber: surah.number, surahName: surah.nameEn, ayahFrom: from, ayahTo: Math.min(from + size - 1, surah.ayahCount) },
    repeating: false,
  };
}

// Spelling-tolerant surah search for the spellings teachers actually type:
// "yaseen" -> Ya-Sin, "rehman" -> Ar-Rahman, "kausar" -> Al-Kawthar,
// "muzammil" -> Al-Muzzammil. Names are compared in a rough phonetic form
// (th~s, dh~z, w~u, q~k, doubled letters collapsed), then by consonants
// alone, since transliterations mostly differ in vowels.
const phon = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
  .replace(/th/g, 's').replace(/dh/g, 'z').replace(/w/g, 'u').replace(/q/g, 'k')
  .replace(/(.)\1+/g, '$1');
const consonants = (s: string) => phon(s).replace(/[aeiouy]/g, '').replace(/(.)\1+/g, '$1');
const withoutArticle = (s: string) => s.replace(/^(al|an|ar|as|at|ad|adh|az|ash|aal)-/i, '');

// Widely used alternate names, by surah number.
const SURAH_ALIASES: Record<number, string[]> = {
  1: ['alhamd'], 9: ['baraah', 'bara\'at'], 17: ['bani israil'], 40: ['momin', 'mumin'], 47: ['qital'],
  76: ['dahr'], 94: ['alam nashrah', 'inshirah', 'sharh'], 111: ['lahab', 'tabbat'],
};

// Lower score = better match; null = no match.
const surahScore = (s: QuranSurahDef, raw: string): number | null => {
  const q = raw.trim();
  if (!q) return 0;
  if (String(s.number) === q) return 0;
  if (/[؀-ۿ]/.test(q)) return s.nameAr.includes(q) ? 0 : null;
  const pq = phon(q);
  if (!pq) return null;
  const qc = consonants(q);
  const bare = withoutArticle(s.nameEn);
  if (phon(bare) === pq) return 0;
  if (qc && consonants(bare) === qc) return 1;
  if ((SURAH_ALIASES[s.number] || []).some((a) => phon(a).startsWith(pq))) return 1;
  if (phon(bare).startsWith(pq)) return 2;
  if (phon(s.nameEn).includes(pq)) return 3;
  if (qc.length >= 2 && consonants(s.nameEn).includes(qc)) return 4;
  return null;
};

const searchSurahs = (surahs: QuranSurahDef[], raw: string) =>
  surahs
    .map((s) => ({ s, score: surahScore(s, raw) }))
    .filter((x): x is { s: QuranSurahDef; score: number } => x.score !== null)
    .sort((a, b) => a.score - b.score || a.s.number - b.s.number)
    .map((x) => x.s);

const lessonText = (l: Lesson) => {
  if (!l.surahNumber) return null;
  const range = l.ayahFrom ? ` ${l.ayahFrom}${l.ayahTo && l.ayahTo !== l.ayahFrom ? `–${l.ayahTo}` : ''}` : '';
  return `${l.surahName || `Surah ${l.surahNumber}`}${range}`;
};

// ── Big − value + stepper ─────────────────────────────────────
const Stepper: React.FC<{ label: string; value?: number; min: number; max: number; onChange: (v: number) => void; disabled?: boolean }> = ({ label, value, min, max, onChange, disabled }) => (
  <div className="flex-1">
    <p className="text-[11px] font-semibold text-gray-500 mb-1">{label}</p>
    <div className="flex items-center gap-2">
      <button type="button" disabled={disabled || value == null || value <= min} onClick={() => onChange((value ?? min) - 1)}
        className="h-12 w-12 rounded-xl border border-gray-200 bg-white flex items-center justify-center active:bg-gray-100 disabled:opacity-30">
        <Minus size={18} />
      </button>
      <span className="flex-1 text-center text-xl font-bold text-gray-800 tabular-nums">{value ?? '—'}</span>
      <button type="button" disabled={disabled || (value ?? 0) >= max} onClick={() => onChange(Math.min((value ?? min - 1) + 1, max))}
        className="h-12 w-12 rounded-xl border border-gray-200 bg-white flex items-center justify-center active:bg-gray-100 disabled:opacity-30">
        <Plus size={18} />
      </button>
    </div>
  </div>
);

// ── Lesson picker bottom sheet (tap-only) ─────────────────────
const LessonSheet: React.FC<{
  title: string;
  initial: Lesson;
  surahs: QuranSurahDef[];
  paras: { number: number; titleEn: string }[];
  onApply: (l: Lesson) => void;
  onClose: () => void;
}> = ({ title, initial, surahs, paras, onApply, onClose }) => {
  const [l, setL] = useState<Lesson>(initial);
  const [query, setQuery] = useState('');
  const selected = surahs.find((s) => s.number === l.surahNumber);
  // The long surah list only shows while choosing one, so the ayah
  // steppers are never pushed below the fold on a phone.
  const [browsing, setBrowsing] = useState(!initial.surahNumber);
  const list = searchSurahs(surahs, query);

  const pickSurah = (s: QuranSurahDef) => {
    if (s.number !== l.surahNumber) {
      setL({ ...l, surahNumber: s.number, surahName: s.nameEn, ayahFrom: 1, ayahTo: Math.min(5, s.ayahCount) });
    }
    setBrowsing(false);
    setQuery('');
  };
  const setFrom = (v: number) => setL({ ...l, ayahFrom: v, ayahTo: Math.max(v, l.ayahTo ?? v) });
  const setTo = (v: number) => setL({ ...l, ayahTo: v, ayahFrom: Math.min(v, l.ayahFrom ?? v) });

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100">
          <p className="text-base font-bold text-gray-800">{title}</p>
          <button onClick={onClose} title="Close" className="h-10 w-10 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          <div>
            <p className="text-[11px] font-semibold text-gray-500 mb-2">PARA</p>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              {paras.map((p) => (
                <button key={p.number} type="button" onClick={() => setL({ ...l, para: p.number })}
                  className={`shrink-0 h-11 min-w-[2.75rem] px-3 rounded-xl border text-sm font-semibold ${l.para === p.number ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-700 border-gray-200'}`}>
                  {p.number}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold text-gray-500 mb-2">SURAH</p>
            {selected && !browsing ? (
              <button type="button" onClick={() => setBrowsing(true)}
                className="w-full flex items-center justify-between px-4 h-14 rounded-xl border-2 border-teal-500 bg-teal-50 text-left">
                <span className="text-base font-bold text-gray-800"><span className="text-gray-400 font-normal tabular-nums mr-2">{selected.number}</span>{selected.nameEn}</span>
                <span className="text-xs font-semibold text-teal-700">Change</span>
              </button>
            ) : (
            <>
            <div className="relative mb-2">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find a surah (optional)"
                className="w-full h-11 pl-9 pr-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-teal-500" />
            </div>
            <div className="max-h-56 overflow-y-auto rounded-xl border border-gray-100 divide-y divide-gray-50">
              {list.map((s) => (
                <button key={s.number} type="button" onClick={() => pickSurah(s)}
                  className={`w-full flex items-center justify-between px-3 h-12 text-left ${s.number === l.surahNumber ? 'bg-teal-50' : 'active:bg-gray-50'}`}>
                  <span className="text-sm text-gray-800"><span className="text-gray-400 tabular-nums mr-2">{s.number}</span>{s.nameEn}</span>
                  <span className="flex items-center gap-2 text-sm text-gray-500">
                    <span dir="rtl">{s.nameAr}</span>
                    {s.number === l.surahNumber && <Check size={16} className="text-teal-600" />}
                  </span>
                </button>
              ))}
              {list.length === 0 && <p className="text-xs text-gray-400 text-center py-4">No surah matches "{query}"</p>}
            </div>
            </>
            )}
          </div>

          {selected && !browsing && (
            <div className="space-y-3">
              <p className="text-[11px] font-semibold text-gray-500">AYAHS <span className="font-normal text-gray-400">· {selected.nameEn} has {selected.ayahCount}</span></p>
              <div className="flex gap-4">
                <Stepper label="From" value={l.ayahFrom} min={1} max={selected.ayahCount} onChange={setFrom} />
                <Stepper label="To" value={l.ayahTo} min={1} max={selected.ayahCount} onChange={setTo} />
              </div>
              <div className="flex gap-2">
                {[3, 5, 10].map((n) => (
                  <button key={n} type="button" onClick={() => setTo(Math.min((l.ayahFrom ?? 1) + n - 1, selected.ayahCount))}
                    className="flex-1 h-10 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 active:bg-gray-100">
                    {n} ayahs
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100">
          <button type="button" onClick={() => onApply(l)}
            className="w-full h-14 rounded-2xl bg-teal-600 text-white text-base font-bold active:bg-teal-700">
            Use this lesson
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main screen ───────────────────────────────────────────────
export const NazraQuickRecord: React.FC<{ grade: string; section?: string; roster: any[]; onClose: () => void }> = ({ grade, section, roster, onClose }) => {
  const { data: surahsData } = useNazraSurahs();
  const { data: parasData } = useNazraParas();
  const { data: settings } = useQaidaNazraSettings();
  const reverse = !!settings?.nazraReverseOrder;
  const surahs = surahsData?.surahs || [];
  const paras = useMemo(() => {
    const list = parasData?.paras || [];
    return reverse ? [...list].reverse() : list;
  }, [parasData, reverse]);
  const saveMutation = useRecordNazraClassDiary();

  const [date, setDate] = useState(localDay(new Date()));
  const [rows, setRows] = useState<Row[]>([]);
  const [sheet, setSheet] = useState<{ target: 'all' | string } | null>(null);
  const [filter, setFilter] = useState<'all' | 'todo' | 'done'>('all');

  useEffect(() => {
    if (rows.length || !surahs.length || !roster.length) return;
    const today = localDay(new Date());
    setRows(roster.map((r: any) => {
      const { lesson, repeating } = nextLesson(r.lastSabaq, surahs, reverse);
      return {
        studentId: String(r.studentId),
        studentName: r.studentName,
        admissionNumber: r.admissionNumber,
        para: r.currentPara ?? (reverse ? 30 : 1),
        ...lesson,
        repeating,
        absent: false,
        paraDone: false,
        sabqi: undefined,
        manzil: undefined,
        recordedToday: !!r.lastDiaryDate && localDay(new Date(r.lastDiaryDate)) === today,
        recordAgain: false,
        saved: false,
      };
    }));
  }, [roster, surahs, reverse, rows.length]);

  const update = (id: string, patch: Partial<Row>) =>
    setRows((prev) => prev.map((r) => (r.studentId === id ? { ...r, ...patch, error: undefined } : r)));

  const isActive = (r: Row) => !r.absent && !r.saved && (!r.recordedToday || r.recordAgain);
  const toSave = rows.filter((r) => isActive(r) && r.rating);
  const pending = rows.filter((r) => isActive(r) && !r.rating);
  const doneCount = rows.filter((r) => r.saved || (r.recordedToday && !r.recordAgain)).length;

  const previousPara = (p: number) => {
    const prev = reverse ? p + 1 : p - 1;
    return prev >= 1 && prev <= 30 ? prev : null;
  };

  const setRating = (r: Row, rating: NazraRating) => {
    const same = r.rating === rating;
    update(r.studentId, {
      rating: same ? undefined : rating,
      paraDone: same || !PASSING.includes(rating) ? false : r.paraDone,
    });
  };

  const cycle = (m: Mark): Mark => (m === undefined ? 'good' : m === 'good' ? 'weak' : undefined);

  const nudgeTo = (r: Row, delta: number) => {
    const s = surahs.find((x) => x.number === r.surahNumber);
    if (!s || r.ayahTo == null) return;
    const to = Math.min(Math.max(r.ayahTo + delta, r.ayahFrom ?? 1), s.ayahCount);
    update(r.studentId, { ayahTo: to });
  };

  const applyLesson = (l: Lesson) => {
    if (!sheet) return;
    if (sheet.target === 'all') {
      setRows((prev) => prev.map((r) => (isActive(r) ? { ...r, ...l, repeating: false, error: undefined } : r)));
      toast.success('Lesson set for the whole class');
    } else {
      update(sheet.target, { ...l, repeating: false });
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
    const isToday = date === localDay(new Date());
    const when = isToday ? new Date() : new Date(`${date}T12:00:00`);
    const revisionRating = (m: Mark): NazraRating => (m === 'good' ? 'proficient' : 'developing');
    saveMutation.mutate({
      date: when.toISOString(),
      grade,
      section,
      entries: toSave.map((r) => {
        const prev = previousPara(r.para);
        return {
          studentId: r.studentId,
          studentName: r.studentName,
          sabaq: {
            paraNumber: r.para,
            surahNumber: r.surahNumber,
            surahName: r.surahName,
            ayahFrom: r.surahNumber ? r.ayahFrom : undefined,
            ayahTo: r.surahNumber ? r.ayahTo : undefined,
            rating: r.rating!,
            completesPara: r.paraDone && PASSING.includes(r.rating!),
          },
          sabqi: r.sabqi ? { paraNumber: r.para, rating: revisionRating(r.sabqi) } : undefined,
          manzil: r.manzil && prev ? { paraNumber: prev, rating: revisionRating(r.manzil) } : undefined,
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

  const savedRows = rows.filter((r) => r.saved);
  const allDone = rows.length > 0 && rows.every((r) => !isActive(r)) && savedRows.length > 0;

  const sheetRow = sheet && sheet.target !== 'all' ? rows.find((r) => r.studentId === sheet.target) : null;
  const firstActive = rows.find(isActive);
  const sheetInitial: Lesson = sheetRow
    ? { para: sheetRow.para, surahNumber: sheetRow.surahNumber, surahName: sheetRow.surahName, ayahFrom: sheetRow.ayahFrom, ayahTo: sheetRow.ayahTo }
    : { para: firstActive?.para ?? (reverse ? 30 : 1), surahNumber: firstActive?.surahNumber, surahName: firstActive?.surahName, ayahFrom: firstActive?.ayahFrom, ayahTo: firstActive?.ayahTo };

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 shrink-0">
        <div className="max-w-2xl mx-auto px-4 pt-3 pb-3">
          <div className="flex items-center gap-3">
            <button onClick={handleClose} title="Close" className="h-11 w-11 -ml-2 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500"><X size={22} /></button>
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold text-gray-800 truncate">Nazra Recording</p>
              <p className="text-xs text-gray-400 truncate">{formatClassLabel(grade, section)}</p>
            </div>
            <input type="date" value={date} max={localDay(new Date())} onChange={(e) => e.target.value && setDate(e.target.value)}
              title="Lesson date"
              className="h-10 w-[8.5rem] px-2 rounded-xl border border-gray-200 text-xs text-gray-600 focus:outline-none" />
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-gray-500">
            <span><b className="text-gray-800">{doneCount}</b> done · <b className="text-teal-700">{toSave.length}</b> ready · {pending.length} to do</span>
          </div>
          <div className="mt-1.5 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-teal-500 transition-all" style={{ width: `${rows.length ? Math.round(((doneCount + toSave.length) / rows.length) * 100) : 0}%` }} />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-4 space-y-3 pb-32">
          {!surahs.length || (!rows.length && roster.length) ? (
            <p className="text-center text-sm text-gray-400 py-16">Loading class…</p>
          ) : roster.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-16">No active students in this class</p>
          ) : allDone ? (
            <ClassDaySummary rows={rows} onClose={onClose} />
          ) : (
            <>
              {/* Whole-class actions */}
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setSheet({ target: 'all' })}
                  className="h-14 rounded-2xl bg-white border border-gray-200 text-sm font-semibold text-gray-700 flex items-center justify-center gap-2 active:bg-gray-50">
                  <BookOpen size={18} className="text-teal-600" /> Same lesson for all
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
                <StudentCard key={r.studentId} r={r} paraTitle={paras.find((p) => p.number === r.para)?.titleEn}
                  canManzil={previousPara(r.para) != null}
                  onRating={(rating) => setRating(r, rating)}
                  onAbsent={() => update(r.studentId, { absent: !r.absent, rating: undefined, paraDone: false })}
                  onLesson={() => setSheet({ target: r.studentId })}
                  onNudge={(d) => nudgeTo(r, d)}
                  onParaDone={() => update(r.studentId, { paraDone: !r.paraDone })}
                  onSabqi={() => update(r.studentId, { sabqi: cycle(r.sabqi) })}
                  onManzil={() => update(r.studentId, { manzil: cycle(r.manzil) })}
                  onRecordAgain={() => update(r.studentId, { recordAgain: true })}
                />
              ))}
              {visible.length === 0 && <p className="text-center text-sm text-gray-400 py-10">Nothing here</p>}
            </>
          )}
        </div>
      </div>

      {/* Save bar */}
      {!allDone && rows.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
          <div className="max-w-2xl mx-auto px-4 py-3">
            {pending.length > 0 && toSave.length > 0 && (
              <p className="text-[11px] text-gray-400 text-center mb-2">{pending.length} not marked yet — they won't be saved</p>
            )}
            <button type="button" onClick={save} disabled={!toSave.length || saveMutation.isPending}
              className="w-full h-14 rounded-2xl bg-teal-600 text-white text-base font-bold active:bg-teal-700 disabled:opacity-40">
              {saveMutation.isPending ? 'Saving…' : toSave.length ? `Save ${toSave.length} student${toSave.length === 1 ? '' : 's'}` : 'Tap a rating to start'}
            </button>
          </div>
        </div>
      )}

      {sheet && (
        <LessonSheet
          title={sheet.target === 'all' ? 'Lesson for the whole class' : `Lesson · ${sheetRow?.studentName ?? ''}`}
          initial={sheetInitial}
          surahs={surahs}
          paras={paras}
          onApply={applyLesson}
          onClose={() => setSheet(null)}
        />
      )}
    </div>
  );
};

// ── One student card ──────────────────────────────────────────
const StudentCard: React.FC<{
  r: Row;
  paraTitle?: string;
  canManzil: boolean;
  onRating: (rating: NazraRating) => void;
  onAbsent: () => void;
  onLesson: () => void;
  onNudge: (delta: number) => void;
  onParaDone: () => void;
  onSabqi: () => void;
  onManzil: () => void;
  onRecordAgain: () => void;
}> = ({ r, paraTitle, canManzil, onRating, onAbsent, onLesson, onNudge, onParaDone, onSabqi, onManzil, onRecordAgain }) => {
  const passing = !!r.rating && PASSING.includes(r.rating);
  const markChip = (label: string, m: Mark, onClick: () => void, disabled = false) => (
    <button type="button" onClick={onClick} disabled={disabled}
      className={`h-10 px-3 rounded-full border text-xs font-semibold flex items-center gap-1 disabled:opacity-30 ${
        m === 'good' ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
          : m === 'weak' ? 'bg-amber-50 text-amber-700 border-amber-300'
            : 'bg-white text-gray-500 border-gray-200'}`}>
      {m === 'good' ? '✓' : m === 'weak' ? '✗' : '+'} {label}
    </button>
  );

  const border = r.error ? 'border-red-300' : r.saved ? 'border-emerald-200' : r.rating ? 'border-teal-300' : 'border-gray-100';

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
        <p className="mt-2 text-sm text-emerald-700 font-semibold flex items-center gap-1.5"><Check size={16} /> Saved · {lessonText(r) || `Para ${r.para}`}</p>
      ) : r.recordedToday && !r.recordAgain ? (
        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="text-sm text-emerald-700 font-medium flex items-center gap-1.5"><Check size={16} /> Already recorded today</p>
          <button type="button" onClick={onRecordAgain} className="h-9 px-3 rounded-full border border-gray-200 text-xs font-semibold text-gray-600">Record again</button>
        </div>
      ) : r.absent ? null : (
        <div className="mt-3 space-y-3">
          <div className="flex items-stretch gap-2">
            <button type="button" onClick={onLesson} className="flex-1 min-w-0 text-left rounded-xl bg-teal-50 border border-teal-100 px-3 py-2 active:bg-teal-100">
              <p className="text-[11px] text-teal-700 font-semibold truncate">Para {r.para}{paraTitle ? ` · ${paraTitle}` : ''}</p>
              <p className="text-sm font-bold text-gray-800 truncate">{lessonText(r) || 'Tap to choose surah & ayahs'}</p>
              {r.repeating && <p className="text-[10px] text-amber-700 flex items-center gap-1 mt-0.5"><RotateCcw size={10} /> Repeating — last lesson was weak</p>}
            </button>
            {r.surahNumber && r.ayahTo != null && (
              <div className="flex flex-col gap-1 shrink-0">
                <button type="button" onClick={() => onNudge(1)} title="One more ayah" className="h-[26px] w-11 rounded-lg border border-gray-200 flex items-center justify-center active:bg-gray-100"><Plus size={14} /></button>
                <button type="button" onClick={() => onNudge(-1)} title="One less ayah" className="h-[26px] w-11 rounded-lg border border-gray-200 flex items-center justify-center active:bg-gray-100"><Minus size={14} /></button>
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
            {markChip('Sabqi', r.sabqi, onSabqi)}
            {markChip('Manzil', r.manzil, onManzil, !canManzil)}
            <button type="button" onClick={onParaDone} disabled={!passing}
              title={passing ? undefined : 'Rate Good or Excellent first'}
              className={`h-10 px-3 rounded-full border text-xs font-semibold disabled:opacity-30 ${r.paraDone ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-500 border-gray-200'}`}>
              {r.paraDone ? '✓ Para finished' : 'Para finished?'}
            </button>
          </div>

          {r.error && <p className="text-xs text-red-600 font-medium">{r.error}</p>}
        </div>
      )}
    </div>
  );
};

// ── End-of-session class report ───────────────────────────────
const ClassDaySummary: React.FC<{ rows: Row[]; onClose: () => void }> = ({ rows, onClose }) => {
  const saved = rows.filter((r) => r.saved);
  const absent = rows.filter((r) => r.absent).length;
  const counts = QUICK_RATINGS.map((q) => ({ ...q, n: saved.filter((r) => r.rating === q.value).length }));
  const weak = saved.filter((r) => r.rating && !PASSING.includes(r.rating));
  const finished = saved.filter((r) => r.paraDone);
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
          {weak.map((r) => <p key={r.studentId} className="text-sm text-gray-700 py-0.5">{r.studentName} <span className="text-gray-400">· {lessonText(r) || `Para ${r.para}`}</span></p>)}
        </div>
      )}
      {finished.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-xs font-semibold text-emerald-700 mb-2">Finished a Para today 🎉</p>
          {finished.map((r) => <p key={r.studentId} className="text-sm text-gray-700 py-0.5">{r.studentName} <span className="text-gray-400">· Para {r.para}</span></p>)}
        </div>
      )}
      <button type="button" onClick={onClose} className="w-full h-14 rounded-2xl bg-gray-800 text-white text-base font-bold">Done</button>
    </div>
  );
};

export default NazraQuickRecord;
