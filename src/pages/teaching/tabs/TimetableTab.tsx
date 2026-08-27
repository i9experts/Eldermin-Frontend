import { useState, useEffect, useMemo, Fragment } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DndContext, useDraggable, useDroppable, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import toast from 'react-hot-toast';
import teachingService from '../../../services/teaching.service';
import organizationService from '../../../services/organization.service';
import academicsService from '../../../services/academics.service';
import api from '../../../lib/api';
import {
  ModalShell, FormSection, TeacherDropdown, GradeLevelDropdown, SectionDropdown,
  SubjectDropdown, RoomDropdown, useRealGrades, inputCls, labelCls,
} from './shared';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const DAY_NAMES  = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const DAY_SHORT  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const DEFAULT_WORKING_DAYS = [1,2,3,4,5];
const PERIODS_OPTIONS = [6,7,8,9,10];

const PERIOD_TYPES = [
  { id: 'regular',  icon: '📚', label: 'Regular' },
  { id: 'lab',      icon: '🔬', label: 'Lab' },
  { id: 'pe',       icon: '⚽', label: 'PE' },
  { id: 'break',    icon: '☕', label: 'Break' },
  { id: 'assembly', icon: '🎪', label: 'Assembly' },
  { id: 'free',     icon: '⬜', label: 'Free' },
];

const STATUS_CLS: Record<string,string> = {
  draft:    'bg-slate-100 text-slate-600 border-slate-200',
  active:   'bg-emerald-50 text-emerald-700 border-emerald-200',
  archived: 'bg-red-50 text-red-600 border-red-200',
};

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface PeriodTime { periodNo: number; startTime: string; endTime: string; }

interface SubjectSetup {
  id: string; subject: string; periodsPerWeek: number;
  teacherId: string; teacherName: string; room: string;
  // Which alternating week this subject's periods belong to when
  // reconstructing a flexible set for "Regenerate Open Slots" - 'both'
  // (the default) means every week, same as a subject with no cycle at all.
  weekCycle?: 'both' | 'A' | 'B';
}

interface TimetableSetupForm {
  gradeLevel: string; sectionName: string; academicYearLabel: string; campus: string;
  workingDays: number[]; periodsPerDay: number;
  startTime: string; periodDuration: number;
  breakAfterPeriod: number; breakDuration: number;
}

type ViewMode = 'class' | 'teacher' | 'room';

// ─── UTILITIES ────────────────────────────────────────────────────────────────

function minsToTime(m: number): string {
  const h = Math.floor(m / 60) % 24;
  const mm = m % 60;
  return `${String(h).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;
}

function generatePeriodTimes(
  startTime: string, periodDuration: number, periodsPerDay: number,
  breakAfterPeriod: number, breakDuration: number,
): PeriodTime[] {
  const [sh, sm] = startTime.split(':').map(Number);
  let cur = sh * 60 + sm;
  const out: PeriodTime[] = [];
  for (let i = 1; i <= periodsPerDay; i++) {
    const s = minsToTime(cur);
    cur += periodDuration;
    out.push({ periodNo: i, startTime: s, endTime: minsToTime(cur) });
    if (i === breakAfterPeriod) cur += breakDuration;
  }
  return out;
}

function getSubjectStyle(subject: string, type: string): { bg: string; border: string; color: string } {
  if (type === 'break' || type === 'assembly') return { bg: '#F5F5F5', border: '#E5E7EB', color: '#6B7280' };
  if (type === 'free')    return { bg: '#FAFAFA', border: '#F0F0F0', color: '#9CA3AF' };
  if (type === 'lab')     return { bg: '#F0EEFF', border: '#DDD6FE', color: '#5b21b6' };
  if (type === 'pe')      return { bg: '#FFF3DC', border: '#FDE68A', color: '#92400e' };
  const s = (subject || '').toLowerCase();
  if (/islam|arabic|quran|religious|urdu/.test(s))      return { bg: '#E6F7ED', border: '#A7F3D0', color: '#065f46' };
  if (/pe|sport|physical|gym/.test(s))                  return { bg: '#FFF3DC', border: '#FDE68A', color: '#92400e' };
  if (/lab|practical|chemistry|biology|physics/.test(s)) return { bg: '#F0EEFF', border: '#DDD6FE', color: '#5b21b6' };
  return { bg: '#EBF2FA', border: '#BFDBFE', color: '#1e40af' };
}

// Two slots at the same day/period only actually clash if some week runs
// both - 'both' runs every week, so it clashes with anything; 'A' and 'B'
// only clash with themselves or 'both', never with each other.
function weekCyclesClash(a: string = 'both', b: string = 'both'): boolean {
  if (a === 'both' || b === 'both') return true;
  return a === b;
}

function checkTeacherConflict(
  teacherId: string, day: number, periodNo: number,
  excludeId: string, allTimetables: any[],
  // The period being checked - its own weekCycle/electiveGroupId, used to
  // skip false positives: an 'A'-only slot never clashes with a 'B'-only
  // one in the same cell, and two legs of the same elective group are
  // meant to share a teacher/room, not clash over it.
  opts: { weekCycle?: string; electiveGroupId?: string } = {},
): { conflict: boolean; ttLabel?: string; subject?: string } {
  if (!teacherId) return { conflict: false };
  for (const tt of allTimetables) {
    if (tt._id === excludeId) continue;
    const hit = (tt.periods || []).find((p: any) => {
      if (p.day !== day || p.periodNo !== periodNo) return false;
      if (opts.electiveGroupId && p.electiveGroupId && String(p.electiveGroupId) === String(opts.electiveGroupId)) return false;
      if (!weekCyclesClash(opts.weekCycle, p.weekCycle)) return false;
      if (p.teacherId === teacherId) return true;
      if (Array.isArray(p.splitGroups)) return p.splitGroups.some((g: any) => g.teacherId === teacherId);
      return false;
    });
    if (hit) return { conflict: true, ttLabel: `${tt.gradeLevel} ${tt.sectionName}`, subject: hit.subject };
  }
  return { conflict: false };
}

function autoGeneratePeriods(
  subjects: SubjectSetup[], workingDays: number[],
  periodsPerDay: number, periodTimes: PeriodTime[],
  // Cross-timetable awareness: without these, generation only avoided
  // double-booking a teacher WITHIN the class being built - it happily
  // assigned a teacher already teaching a different class at that same
  // slot, silently producing a real clash the admin would only discover
  // afterward from the conflict banner. allTimetables/excludeId let it
  // skip slots a teacher is already committed to elsewhere, same as a
  // real scheduling engine (aSc, FET, etc) would.
  allTimetables: any[] = [], excludeId: string = '',
  // Slots already spoken for - used by "Regenerate Open Slots" to keep
  // locked periods fixed and only fill in around them. Grid creation
  // passes nothing here (an empty grid, exactly the old behaviour).
  lockedPeriods: any[] = [],
): any[] {
  // Cell occupancy is tracked per week-cycle rather than as a single
  // boolean, so an 'A'-only subject and a 'B'-only subject can legally
  // share the same day/period cell - a 'both' occupant fills both letters.
  const grid: Record<string, Set<'A' | 'B'>> = {};
  const teacherSlots: Record<string, Set<'A' | 'B'>> = {};
  const periods: any[] = [];
  for (const d of workingDays) for (let p = 1; p <= periodsPerDay; p++) grid[`${d}-${p}`] = new Set();

  const cyclesOf = (wc?: string): ('A' | 'B')[] => (!wc || wc === 'both') ? ['A', 'B'] : [wc as 'A' | 'B'];
  const isFree = (day: number, p: number, wc?: string) => {
    const occ = grid[`${day}-${p}`];
    return cyclesOf(wc).every(c => !occ.has(c));
  };
  const teacherFree = (teacherId: string, day: number, p: number, wc?: string) => {
    const occ = teacherSlots[`${teacherId}-${day}-${p}`];
    return !occ || cyclesOf(wc).every(c => !occ.has(c));
  };
  const occupy = (day: number, p: number, teacherId: string | undefined, wc?: string) => {
    for (const c of cyclesOf(wc)) grid[`${day}-${p}`].add(c);
    if (teacherId) {
      const key = `${teacherId}-${day}-${p}`;
      teacherSlots[key] ??= new Set();
      for (const c of cyclesOf(wc)) teacherSlots[key].add(c);
    }
  };

  for (const lp of lockedPeriods) occupy(lp.day, lp.periodNo, lp.teacherId, lp.weekCycle);

  const sorted = subjects.filter(s => s.subject && s.periodsPerWeek > 0)
    .sort((a, b) => b.periodsPerWeek - a.periodsPerWeek);

  const teacherBusyElsewhere = (teacherId: string, day: number, periodNo: number, wc?: string) =>
    !!teacherId && checkTeacherConflict(teacherId, day, periodNo, excludeId, allTimetables, { weekCycle: wc }).conflict;

  const place = (subj: SubjectSetup, day: number, p: number, pt: PeriodTime) => {
    occupy(day, p, subj.teacherId, subj.weekCycle);
    periods.push({ day, periodNo: p, startTime: pt.startTime, endTime: pt.endTime,
      subject: subj.subject, teacherId: subj.teacherId || null,
      teacherName: subj.teacherName || '', roomNo: subj.room || '', type: 'regular',
      weekCycle: subj.weekCycle || 'both' });
  };

  for (const subj of sorted) {
    let rem = subj.periodsPerWeek;
    // First pass: one per day spread
    for (const day of workingDays) {
      if (rem === 0) break;
      for (let p = 1; p <= periodsPerDay; p++) {
        if (!isFree(day, p, subj.weekCycle)) continue;
        if (subj.teacherId && !teacherFree(subj.teacherId, day, p, subj.weekCycle)) continue;
        if (teacherBusyElsewhere(subj.teacherId, day, p, subj.weekCycle)) continue;
        const pt = periodTimes.find(t => t.periodNo === p) ?? { startTime: '', endTime: '' } as PeriodTime;
        place(subj, day, p, pt);
        rem--; break;
      }
    }
    // Second pass: fill remaining anywhere
    outer: while (rem > 0) {
      let placedThisRound = false;
      for (const day of workingDays) {
        for (let p = 1; p <= periodsPerDay; p++) {
          if (!isFree(day, p, subj.weekCycle)) continue;
          if (subj.teacherId && !teacherFree(subj.teacherId, day, p, subj.weekCycle)) continue;
          if (teacherBusyElsewhere(subj.teacherId, day, p, subj.weekCycle)) continue;
          const pt = periodTimes.find(t => t.periodNo === p) ?? { startTime: '', endTime: '' } as PeriodTime;
          place(subj, day, p, pt);
          rem--; placedThisRound = true; if (rem === 0) break outer;
        }
      }
      // No free, teacher-available slot left anywhere for this subject -
      // stop instead of looping forever (previously this bare `break` was
      // reachable after only one pass either way, but now that a slot can
      // be skipped for being externally busy, a genuinely fully-booked
      // teacher needs this to actually terminate the loop).
      if (!placedThisRound) break;
    }
  }
  return periods;
}

function getFreeTeachersAtSlot(day: number, periodNo: number, allTimetables: any[], allTeachers: any[]): any[] {
  const busy = new Set<string>();
  for (const tt of allTimetables) {
    for (const p of tt.periods || []) {
      if (p.day === day && p.periodNo === periodNo && p.teacherId) busy.add(p.teacherId);
    }
  }
  return allTeachers.filter(t => !busy.has(t._id));
}

function printTimetable(tt: any, periodTimes: PeriodTime[]) {
  const win = window.open('', '_blank');
  if (!win) { toast.error('Allow pop-ups to export'); return; }
  const days: number[] = tt.workingDays ?? DEFAULT_WORKING_DAYS;
  const dayHdrs = days.map(d => `<th style="padding:8px;background:#0C447C;color:#fff;font-size:12px">${DAY_NAMES[d]}</th>`).join('');
  const rows = Array.from({ length: tt.periodsPerDay ?? 8 }, (_, i) => {
    const pNo = i + 1;
    const pt = periodTimes.find(t => t.periodNo === pNo);
    const timeStr = pt ? `${pt.startTime}–${pt.endTime}` : `P${pNo}`;
    const cells = days.map(d => {
      const p = (tt.periods || []).find((x: any) => x.day === d && x.periodNo === pNo);
      if (!p) return '<td style="padding:8px;border:1px solid #e5e7eb;font-size:11px;color:#aaa;text-align:center">—</td>';
      return `<td style="padding:8px;border:1px solid #e5e7eb;font-size:11px">
        <strong>${p.subject || p.type || '—'}</strong><br>
        <span style="color:#555">${p.teacherName || ''}</span><br>
        <span style="color:#aaa">${p.roomNo || ''}</span>
      </td>`;
    }).join('');
    return `<tr><td style="padding:8px;background:#f9f9f9;font-size:10px;font-weight:600;white-space:nowrap;border:1px solid #e5e7eb">P${pNo}<br><span style="font-weight:400;color:#888">${timeStr}</span></td>${cells}</tr>`;
  }).join('');
  win.document.write(`<!DOCTYPE html><html><head><title>Timetable — ${tt.gradeLevel} ${tt.sectionName}</title>
<style>body{font-family:sans-serif;padding:20px}table{border-collapse:collapse;width:100%}@media print{body{padding:0}}</style>
</head><body>
<h2 style="color:#0C447C;margin-bottom:4px">${tt.gradeLevel} — Section ${tt.sectionName}</h2>
<p style="color:#888;font-size:12px;margin:0 0 16px">${tt.academicYearLabel || ''} &nbsp;|&nbsp; ${days.map(d => DAY_NAMES[d]).join(', ')}</p>
<table><thead><tr><th style="padding:8px;background:#0C447C;color:#fff;font-size:12px">Period</th>${dayHdrs}</tr></thead><tbody>${rows}</tbody></table>
</body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 400);
}

// ─── SPINNER ──────────────────────────────────────────────────────────────────

function Spin({ size = 'w-5 h-5' }: { size?: string }) {
  return (
    <svg className={`animate-spin ${size}`} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/>
      <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8v8z"/>
    </svg>
  );
}

// ─── PERIOD CELL ──────────────────────────────────────────────────────────────

function PeriodCell({
  period, gradeLabel, showGrade = false, conflict = false, onClick,
  gridColumn, gridRow, draggable = false, dragId,
}: {
  period: any; gradeLabel?: string; showGrade?: boolean;
  conflict?: boolean; onClick?: () => void;
  gridColumn: number; gridRow: string;
  draggable?: boolean; dragId?: string;
}) {
  // Draggable only when there's something to move and the caller allows it
  // (class view with an active edit session) - locked and block periods
  // opt out below at the call site, not here.
  const dnd = useDraggable({ id: dragId || 'unused', disabled: !draggable || !dragId });
  const dragStyle = dnd.transform
    ? { transform: `translate3d(${dnd.transform.x}px, ${dnd.transform.y}px, 0)`, zIndex: 20 }
    : undefined;

  if (!period) {
    return (
      <div
        onClick={onClick}
        className="rounded-lg border border-dashed border-slate-200 flex items-center justify-center cursor-pointer hover:border-[#0C447C] hover:bg-blue-50 transition-colors"
        style={{ minHeight: 64, height: '100%', gridColumn, gridRow }}
      >
        <span className="text-slate-300 text-xs">＋</span>
      </div>
    );
  }

  const style = getSubjectStyle(period.subject || '', period.type || 'regular');
  const isSpecial = ['break','free','assembly'].includes(period.type);
  const isBlock = !!period.blockId;
  const isElective = !!period.electiveGroupId;
  const isSplit = Array.isArray(period.splitGroups) && period.splitGroups.length >= 2;

  return (
    <div
      ref={draggable ? dnd.setNodeRef : undefined}
      {...(draggable ? dnd.listeners : {})}
      {...(draggable ? dnd.attributes : {})}
      onClick={onClick}
      style={{
        background: conflict ? '#FEF2F2' : style.bg, borderColor: conflict ? '#FECACA' : style.border,
        minHeight: 64, height: '100%', gridColumn, gridRow, opacity: dnd.isDragging ? 0.35 : 1, ...dragStyle,
      }}
      className={`rounded-lg border p-2 hover:opacity-90 transition-opacity flex flex-col justify-center relative ${onClick ? 'cursor-pointer' : 'cursor-default'} ${draggable ? 'cursor-grab active:cursor-grabbing' : ''}`}
    >
      {period.locked && <span className="absolute top-1 right-1.5 text-[10px]" title="Locked - won't move on drag or regenerate">🔒</span>}
      {period.weekCycle && period.weekCycle !== 'both' && (
        <span className="absolute top-1 left-1.5 text-[9px] font-bold px-1 rounded" style={{ background: style.color, color: '#fff' }} title={`Runs on Week ${period.weekCycle} only`}>
          {period.weekCycle}
        </span>
      )}
      {conflict && <div className="text-xs font-bold text-red-600 mb-0.5">⚠ Conflict</div>}
      {isSpecial ? (
        <div className="text-center text-xs italic" style={{ color: style.color }}>
          {PERIOD_TYPES.find(t => t.id === period.type)?.icon} {period.label || period.type}
        </div>
      ) : (
        <>
          <div className="text-xs font-semibold truncate flex items-center gap-1" style={{ color: style.color }}>
            {period.subject || '—'}
            {isBlock && <span className="text-[9px] font-bold px-1 py-0.5 rounded border" style={{ borderColor: style.color, color: style.color }}>BLOCK</span>}
            {isElective && <span className="text-[9px] font-bold px-1 py-0.5 rounded border" style={{ borderColor: style.color, color: style.color }}>🔀</span>}
          </div>
          {showGrade && gradeLabel && (
            <div className="text-xs text-slate-500 truncate">{gradeLabel}</div>
          )}
          {isSplit ? (
            <div className="mt-0.5 space-y-0.5">
              {period.splitGroups.map((g: any, i: number) => (
                <div key={i} className="text-[10px] text-slate-500 truncate border-t border-slate-200/70 pt-0.5 first:border-t-0 first:pt-0">
                  <span className="font-medium">{g.label || `Group ${i + 1}`}:</span> {g.teacherName || '—'} · {g.roomNo || '—'}
                </div>
              ))}
            </div>
          ) : (
            <>
              {period.teacherName && !showGrade && (
                <div className="text-xs text-slate-500 truncate">{period.teacherName}</div>
              )}
              {period.roomNo && (
                <div className="text-xs text-slate-400 truncate">{period.roomNo}</div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

// ─── DROPPABLE CELL WRAPPER ───────────────────────────────────────────────────
// A thin invisible layer over an empty grid slot so dnd-kit can register it
// as a drop target - PeriodCell itself stays the visible, styled element.
function DroppableSlot({ id, gridColumn, gridRow, children }: { id: string; gridColumn: number; gridRow: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} style={{ gridColumn, gridRow, outline: isOver ? '2px solid #0C447C' : 'none', outlineOffset: -2, borderRadius: 8 }}>
      {children}
    </div>
  );
}

// ─── TIMETABLE GRID ───────────────────────────────────────────────────────────

function TimetableGrid({
  timetable, allTimetables, periodTimes,
  viewMode = 'class', filterTeacherId = '', filterRoom = '', activeWeek,
  onCellClick, onMovePeriod,
}: {
  timetable?: any; allTimetables: any[]; periodTimes: PeriodTime[];
  viewMode?: ViewMode; filterTeacherId?: string; filterRoom?: string;
  // Which alternating week is being viewed - a period with weekCycle 'A' or
  // 'B' only shows when it matches (or when no week is selected at all,
  // i.e. this timetable doesn't use the cycle). 'both' periods always show.
  activeWeek?: 'A' | 'B' | null;
  onCellClick?: (day: number, periodNo: number) => void;
  onMovePeriod?: (from: { day: number; periodNo: number }, to: { day: number; periodNo: number }) => void;
}) {
  const workingDays: number[] = timetable?.workingDays ?? DEFAULT_WORKING_DAYS;
  const periodsPerDay: number = timetable?.periodsPerDay ?? 8;
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const showsThisWeek = (p: any) => !activeWeek || !p.weekCycle || p.weekCycle === 'both' || p.weekCycle === activeWeek;

  // Compute display periods based on view mode
  const displayGrid = useMemo<Record<string, any>>(() => {
    const g: Record<string, any> = {};
    if (viewMode === 'class' && timetable) {
      for (const p of timetable.periods || []) {
        if (!showsThisWeek(p)) continue;
        g[`${p.day}-${p.periodNo}`] = p;
      }
    } else if (viewMode === 'teacher' && filterTeacherId) {
      for (const tt of allTimetables) {
        for (const p of tt.periods || []) {
          if (!showsThisWeek(p)) continue;
          if (p.teacherId === filterTeacherId || (p.splitGroups || []).some((sg: any) => sg.teacherId === filterTeacherId)) {
            const key = `${p.day}-${p.periodNo}`;
            g[key] = { ...p, gradeLabel: `${tt.gradeLevel} ${tt.sectionName}` };
          }
        }
      }
    } else if (viewMode === 'room' && filterRoom) {
      for (const tt of allTimetables) {
        for (const p of tt.periods || []) {
          if (!showsThisWeek(p)) continue;
          if ((p.roomNo || '').toLowerCase() === filterRoom.toLowerCase()) {
            const key = `${p.day}-${p.periodNo}`;
            g[key] = { ...p, gradeLabel: `${tt.gradeLevel} ${tt.sectionName}` };
          }
        }
      }
    }
    return g;
  }, [timetable, allTimetables, viewMode, filterTeacherId, filterRoom, activeWeek]);

  // Block (double/triple period) detection: a cell is a "block start" if it
  // carries a blockId and no other period sharing that blockId on the same
  // day has a lower periodNo - block starts render with a row-span; every
  // other period in the block is skipped entirely (the span already covers
  // that grid position, the same way an HTML table rowspan works).
  const { blockSpan, skipKeys } = useMemo(() => {
    const span: Record<string, number> = {};
    const skip = new Set<string>();
    const byDay: Record<number, any[]> = {};
    for (const key of Object.keys(displayGrid)) {
      const p = displayGrid[key];
      if (!p?.blockId) continue;
      (byDay[p.day] ??= []).push(p);
    }
    for (const day of Object.keys(byDay)) {
      const list = byDay[Number(day)];
      const groups: Record<string, any[]> = {};
      for (const p of list) (groups[p.blockId] ??= []).push(p);
      for (const g of Object.values(groups)) {
        g.sort((a, b) => a.periodNo - b.periodNo);
        span[`${g[0].day}-${g[0].periodNo}`] = g.length;
        for (let i = 1; i < g.length; i++) skip.add(`${g[i].day}-${g[i].periodNo}`);
      }
    }
    return { blockSpan: span, skipKeys: skip };
  }, [displayGrid]);

  // Detect teacher conflicts within current timetable (class view). A split
  // period has no single teacherId of its own - each sub-group is checked
  // individually instead.
  const conflictKeys = useMemo<Set<string>>(() => {
    const s = new Set<string>();
    if (viewMode !== 'class' || !timetable) return s;
    for (const p of timetable.periods || []) {
      const opts = { weekCycle: p.weekCycle, electiveGroupId: p.electiveGroupId };
      if (Array.isArray(p.splitGroups) && p.splitGroups.length >= 2) {
        for (const g of p.splitGroups) {
          if (!g.teacherId) continue;
          if (checkTeacherConflict(g.teacherId, p.day, p.periodNo, timetable._id, allTimetables, opts).conflict) {
            s.add(`${p.day}-${p.periodNo}`);
          }
        }
        continue;
      }
      if (!p.teacherId) continue;
      const { conflict } = checkTeacherConflict(p.teacherId, p.day, p.periodNo, timetable._id, allTimetables, opts);
      if (conflict) s.add(`${p.day}-${p.periodNo}`);
    }
    return s;
  }, [timetable, allTimetables, viewMode]);

  const dragEnabled = viewMode === 'class' && !!onMovePeriod;

  function handleDragEnd(evt: any) {
    if (!onMovePeriod) return;
    const { active, over } = evt;
    if (!over || active.id === over.id) return;
    const [fromDay, fromPNo] = String(active.id).split('-').map(Number);
    const [toDay, toPNo] = String(over.id).split('-').map(Number);
    onMovePeriod({ day: fromDay, periodNo: fromPNo }, { day: toDay, periodNo: toPNo });
  }

  const grid = (
    <div className="overflow-x-auto">
      <div style={{ display: 'grid', gridTemplateColumns: `90px repeat(${workingDays.length}, 1fr)`, gridAutoRows: 'minmax(64px, auto)', gap: 4, minWidth: 560 }}>
        {/* Header */}
        <div style={{ gridColumn: 1, gridRow: 1 }} className="bg-slate-50 rounded-lg flex items-center justify-center text-xs font-semibold text-slate-400 uppercase tracking-wide py-2">
          Period
        </div>
        {workingDays.map((d, di) => (
          <div key={d} style={{ gridColumn: di + 2, gridRow: 1 }} className="bg-[#0C447C] text-white rounded-lg py-2 text-center text-xs font-semibold">
            {DAY_NAMES[d]}
          </div>
        ))}

        {/* Time labels */}
        {Array.from({ length: periodsPerDay }, (_, i) => {
          const pNo = i + 1;
          const pt = periodTimes.find(t => t.periodNo === pNo);
          return (
            <div key={`lbl-${pNo}`} style={{ gridColumn: 1, gridRow: pNo + 1, minHeight: 64 }} className="bg-slate-50 rounded-lg flex flex-col items-center justify-center text-center py-2">
              <div className="text-xs font-bold text-slate-600">P{pNo}</div>
              {pt && <div className="text-xs text-slate-400 mt-0.5">{pt.startTime}</div>}
              {pt && <div className="text-xs text-slate-400">{pt.endTime}</div>}
            </div>
          );
        })}

        {/* Cells */}
        {workingDays.flatMap((d, di) =>
          Array.from({ length: periodsPerDay }, (_, i) => {
            const pNo = i + 1;
            const key = `${d}-${pNo}`;
            if (skipKeys.has(key)) return null; // covered by a block's row-span above it
            const period = displayGrid[key];
            const conflict = conflictKeys.has(key);
            const span = blockSpan[key];
            const gridRow = span ? `${pNo + 1} / span ${span}` : `${pNo + 1}`;
            const canDrag = dragEnabled && !!period && !period.locked && !period.blockId
              && !period.electiveGroupId && !(Array.isArray(period.splitGroups) && period.splitGroups.length >= 2);
            const cell = (
              <PeriodCell
                key={key}
                period={period}
                gradeLabel={period?.gradeLabel}
                showGrade={viewMode !== 'class'}
                conflict={conflict}
                onClick={onCellClick ? () => onCellClick(d, pNo) : undefined}
                gridColumn={di + 2}
                gridRow={gridRow}
                draggable={canDrag}
                dragId={key}
              />
            );
            // Drop targets only make sense in class view while editing, and
            // never onto a block's covered (skipped) position - handled
            // above by the skipKeys.has(key) early return.
            if (!dragEnabled) return cell;
            return (
              <DroppableSlot key={`drop-${key}`} id={key} gridColumn={di + 2} gridRow={gridRow}>
                {cell}
              </DroppableSlot>
            );
          }),
        )}
      </div>
    </div>
  );

  if (!dragEnabled) return grid;
  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      {grid}
    </DndContext>
  );
}

// ─── EDIT PERIOD MODAL ────────────────────────────────────────────────────────

function EditPeriodModal({
  timetable, day, periodNo, periodTime, periodTimes, allTimetables, onClose,
}: {
  timetable: any; day: number; periodNo: number;
  periodTime?: PeriodTime; periodTimes: PeriodTime[]; allTimetables: any[]; onClose: () => void;
}) {
  const qc = useQueryClient();
  const { data: teachers = [] } = useQuery({ queryKey: ['teachers'], queryFn: teachingService.getTeachers });
  const teacherList = teachers as any[];

  const existing = (timetable.periods || []).find(
    (p: any) => p.day === day && p.periodNo === periodNo,
  );

  const [type, setType] = useState<string>(existing?.type ?? 'regular');
  const [subject, setSubject] = useState(existing?.subject ?? '');
  const [selectedTeacher, setSelectedTeacher] = useState<any>(
    existing?.teacherId ? teacherList.find(t => t._id === existing.teacherId) ?? null : null,
  );
  const [room, setRoom] = useState(existing?.roomNo ?? '');
  const [label, setLabel] = useState(existing?.label ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [overrideConflict, setOverrideConflict] = useState(false);
  const [locked, setLocked] = useState<boolean>(!!existing?.locked);
  const [isDouble, setIsDouble] = useState<boolean>(!!existing?.blockId);
  const [weekCycle, setWeekCycle] = useState<'both' | 'A' | 'B'>(existing?.weekCycle || 'both');
  const [isSplit, setIsSplit] = useState<boolean>(Array.isArray(existing?.splitGroups) && existing.splitGroups.length >= 2);
  const [splitGroups, setSplitGroups] = useState<{ label: string; teacherId: string; teacherName: string; roomNo: string }[]>(
    Array.isArray(existing?.splitGroups) && existing.splitGroups.length >= 2
      ? existing.splitGroups.map((g: any) => ({ label: g.label || '', teacherId: g.teacherId || '', teacherName: g.teacherName || '', roomNo: g.roomNo || '' }))
      : [{ label: 'Group A', teacherId: '', teacherName: '', roomNo: '' }, { label: 'Group B', teacherId: '', teacherName: '', roomNo: '' }],
  );
  // Managed by an Elective Group ("Manage Electives") - editing here would
  // just get overwritten the next time that group's periods are synced, so
  // this modal is read-only for it and points the admin to the right place.
  const isElectiveManaged = !!existing?.electiveGroupId;

  // Sync teacher object after teachers load
  useEffect(() => {
    if (existing?.teacherId && !selectedTeacher) {
      const found = teacherList.find(t => t._id === existing.teacherId);
      if (found) setSelectedTeacher(found);
    }
  }, [teacherList.length]);

  const periodsPerDay: number = timetable.periodsPerDay ?? 8;
  const nextPeriodNo = periodNo + 1;
  // The next slot is fair game for a double period if it's empty, or
  // already the second half of THIS SAME block (editing an existing
  // double period) - anything else (occupied by an unrelated lesson,
  // or simply the last period of the day) blocks the option.
  const nextSlotOccupant = (timetable.periods || []).find((p: any) => p.day === day && p.periodNo === nextPeriodNo);
  const canDouble = !isSplit && nextPeriodNo <= periodsPerDay
    && (!nextSlotOccupant || (existing?.blockId && nextSlotOccupant.blockId === existing.blockId));

  const conflict = useMemo(() => {
    if (!selectedTeacher || isSplit) return { conflict: false };
    return checkTeacherConflict(selectedTeacher._id, day, periodNo, timetable._id, allTimetables, { weekCycle });
  }, [selectedTeacher, day, periodNo, timetable._id, allTimetables, weekCycle, isSplit]);

  const conflictNext = useMemo(() => {
    if (!selectedTeacher || !isDouble) return { conflict: false };
    return checkTeacherConflict(selectedTeacher._id, day, nextPeriodNo, timetable._id, allTimetables, { weekCycle });
  }, [selectedTeacher, isDouble, day, nextPeriodNo, timetable._id, allTimetables, weekCycle]);

  // Split lesson: one conflict check per sub-group's teacher, keyed by
  // array index so the warning can be attached to the right row.
  const splitConflicts = useMemo(() => {
    if (!isSplit) return [];
    return splitGroups.map(g => g.teacherId
      ? checkTeacherConflict(g.teacherId, day, periodNo, timetable._id, allTimetables, { weekCycle })
      : { conflict: false });
  }, [isSplit, splitGroups, day, periodNo, timetable._id, allTimetables, weekCycle]);

  const mut = useMutation({
    mutationFn: (periods: any[]) => teachingService.updateTimetable(timetable._id, { periods }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['timetables'] });
      toast.success('Period updated');
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed'),
  });

  function handleSave() {
    const others = (timetable.periods || []).filter((p: any) => {
      if (p.day !== day) return true;
      if (p.periodNo === periodNo) return false;
      if (isDouble && p.periodNo === nextPeriodNo) return false;
      return true;
    });
    const isSpecial = ['break','assembly','free'].includes(type);
    // Reuse the existing blockId when re-saving an already-doubled period
    // (keeps it the same logical block instead of orphaning the old id).
    const blockId = isDouble ? (existing?.blockId || `block-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`) : null;
    const useSplit = isSplit && !isSpecial;
    const shared = {
      day, type, locked, weekCycle,
      ...(isSpecial
        ? { label: label || type }
        : {
            subject,
            teacherId: useSplit ? null : (selectedTeacher?._id ?? null),
            teacherName: useSplit ? '' : (selectedTeacher ? `${selectedTeacher.firstName} ${selectedTeacher.lastName}` : ''),
            roomNo: useSplit ? '' : room,
            notes,
            splitGroups: useSplit ? splitGroups.filter(g => g.teacherId || g.roomNo || g.label) : [],
          }),
    };
    const period1: any = { ...shared, periodNo, startTime: periodTime?.startTime ?? '', endTime: periodTime?.endTime ?? '', blockId };
    const newPeriods = [period1];
    if (isDouble) {
      const nextTime = periodTimes.find(t => t.periodNo === nextPeriodNo);
      newPeriods.push({ ...shared, periodNo: nextPeriodNo, startTime: nextTime?.startTime ?? '', endTime: nextTime?.endTime ?? '', blockId });
    }
    mut.mutate([...others, ...newPeriods]);
  }

  function handleClear() {
    const others = (timetable.periods || []).filter((p: any) => {
      if (p.day !== day) return true;
      if (p.periodNo === periodNo) return false;
      if (existing?.blockId && p.blockId === existing.blockId) return false;
      return true;
    });
    mut.mutate(others);
  }

  const isSpecial = ['break','assembly','free'].includes(type);
  const splitValid = !isSplit || splitGroups.filter(g => g.teacherId).length >= 2;
  const canSave = !isElectiveManaged && splitValid && (isSpecial || subject.trim() || !mut.isPending);
  const hasSplitConflict = isSplit && splitConflicts.some(c => c.conflict);
  const hasConflict = (conflict.conflict || conflictNext.conflict || hasSplitConflict) && !overrideConflict;

  if (isElectiveManaged) {
    return (
      <ModalShell
        title={`${DAY_NAMES[day]} — Period ${periodNo}`}
        sub={periodTime ? `${periodTime.startTime} – ${periodTime.endTime}` : undefined}
        onClose={onClose}
        maxWidth="max-w-lg"
      >
        <div className="p-6">
          <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-sm text-indigo-800">
            🔀 This period belongs to the elective group <strong>{existing.electiveGroupName || 'Elective'}</strong>.
            It's shared across every class that takes this elective, so it can only be edited from{' '}
            <strong>Manage Electives</strong> — editing it here would just be overwritten next time that group syncs.
          </div>
          <div className="flex justify-end mt-4">
            <button onClick={onClose} type="button"
              className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              Close
            </button>
          </div>
        </div>
      </ModalShell>
    );
  }

  return (
    <ModalShell
      title={`${DAY_NAMES[day]} — Period ${periodNo}`}
      sub={periodTime ? `${periodTime.startTime} – ${periodTime.endTime}` : undefined}
      onClose={onClose}
      maxWidth="max-w-lg"
    >
      <div className="p-6">

        {/* Type selector */}
        <FormSection title="Period Type">
          <div className="flex gap-2 flex-wrap">
            {PERIOD_TYPES.map(pt => (
              <button
                key={pt.id}
                type="button"
                onClick={() => setType(pt.id)}
                className={`px-3 py-2 text-xs font-medium rounded-xl border-2 flex flex-col items-center gap-1 min-w-[60px] transition-colors ${
                  type === pt.id
                    ? 'bg-[#0C447C] text-white border-[#0C447C]'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                <span className="text-lg leading-none">{pt.icon}</span>
                <span>{pt.label}</span>
              </button>
            ))}
          </div>
        </FormSection>

        {/* Break / Assembly / Free → just a label */}
        {isSpecial && (
          <FormSection title="Label">
            <input
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder={`e.g. ${type === 'break' ? 'Lunch Break' : type === 'assembly' ? 'Morning Assembly' : 'Free Period'}`}
              className={inputCls}
            />
          </FormSection>
        )}

        {/* Regular / Lab / PE */}
        {!isSpecial && (
          <>
            <FormSection title="Subject & Teacher">
              <div className="mb-3">
                <SubjectDropdown value={subject} onChange={setSubject} />
              </div>

              {!isSplit && (
                <>
                  <TeacherDropdown
                    value={selectedTeacher}
                    onSelect={t => { setSelectedTeacher(t); setOverrideConflict(false); }}
                  />

                  {/* Conflict warning */}
                  {conflict.conflict && (
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs">
                      <div className="font-semibold text-amber-800 mb-1">
                        ⚠ {selectedTeacher?.firstName} {selectedTeacher?.lastName} is already teaching{' '}
                        <strong>{conflict.subject}</strong> at <strong>{conflict.ttLabel}</strong> during this slot.
                      </div>
                      <label className="flex items-center gap-2 mt-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={overrideConflict}
                          onChange={e => setOverrideConflict(e.target.checked)}
                          className="w-3.5 h-3.5 rounded border-amber-400 text-[#EF9F27] focus:ring-[#EF9F27]"
                        />
                        <span className="text-amber-700">Override conflict (I confirm this is intentional)</span>
                      </label>
                    </div>
                  )}
                  {conflictNext.conflict && (
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs">
                      <div className="font-semibold text-amber-800">
                        ⚠ Second half of this double period (P{nextPeriodNo}): {selectedTeacher?.firstName} {selectedTeacher?.lastName} is already teaching{' '}
                        <strong>{conflictNext.subject}</strong> at <strong>{conflictNext.ttLabel}</strong> then too.
                      </div>
                    </div>
                  )}
                </>
              )}
            </FormSection>

            {!isSplit && (
              <div className="grid grid-cols-2 gap-3 mb-4">
                <RoomDropdown value={room} onChange={setRoom} label="Room / Lab" />
                <div>
                  <label className={labelCls}>Notes</label>
                  <input
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Optional notes"
                    className={inputCls}
                  />
                </div>
              </div>
            )}

            {/* Split lesson: the class divides into sub-groups, each with its
                own teacher/room, all running in this same slot. */}
            {isSplit && (
              <FormSection title="Split Groups">
                <div className="space-y-3">
                  {splitGroups.map((g, i) => (
                    <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          value={g.label}
                          onChange={e => setSplitGroups(gs => gs.map((x, xi) => xi === i ? { ...x, label: e.target.value } : x))}
                          placeholder={`Group ${i + 1} label`}
                          className={`${inputCls} flex-1`}
                        />
                        {splitGroups.length > 2 && (
                          <button type="button" onClick={() => setSplitGroups(gs => gs.filter((_, xi) => xi !== i))}
                            className="text-xs text-red-500 hover:text-red-700 px-2">Remove</button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <TeacherDropdown
                          value={teacherList.find(t => t._id === g.teacherId) ?? null}
                          onSelect={t => setSplitGroups(gs => gs.map((x, xi) => xi === i ? { ...x, teacherId: t?._id ?? '', teacherName: t ? `${t.firstName} ${t.lastName}` : '' } : x))}
                        />
                        <RoomDropdown
                          value={g.roomNo}
                          onChange={v => setSplitGroups(gs => gs.map((x, xi) => xi === i ? { ...x, roomNo: v } : x))}
                          label=""
                        />
                      </div>
                      {splitConflicts[i]?.conflict && (
                        <div className="mt-2 text-xs text-amber-700">
                          ⚠ {g.teacherName} is already teaching <strong>{splitConflicts[i].subject}</strong> at <strong>{splitConflicts[i].ttLabel}</strong> during this slot.
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <button type="button" onClick={() => setSplitGroups(gs => [...gs, { label: `Group ${gs.length + 1}`, teacherId: '', teacherName: '', roomNo: '' }])}
                  className="mt-2 text-xs text-[#0C447C] font-medium hover:underline">+ Add another group</button>
                {hasSplitConflict && (
                  <label className="flex items-center gap-2 mt-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={overrideConflict}
                      onChange={e => setOverrideConflict(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-amber-400 text-[#EF9F27] focus:ring-[#EF9F27]"
                    />
                    <span className="text-amber-700 text-xs">Override conflict (I confirm this is intentional)</span>
                  </label>
                )}
              </FormSection>
            )}

            {timetable.weekCycleEnabled && (
              <FormSection title="Week Cycle">
                <div className="flex gap-2">
                  {([['both', 'Every week'], ['A', 'Week A only'], ['B', 'Week B only']] as const).map(([id, lbl]) => (
                    <button key={id} type="button" onClick={() => setWeekCycle(id)}
                      className={`px-3 py-1.5 text-xs rounded-lg border font-medium transition-colors ${weekCycle === id ? 'bg-[#0C447C] text-white border-[#0C447C]' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}>
                      {lbl}
                    </button>
                  ))}
                </div>
              </FormSection>
            )}

            <label className={`flex items-center gap-2 mb-3 ${canDouble ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}`}>
              <input
                type="checkbox"
                checked={isDouble}
                disabled={!canDouble}
                onChange={e => setIsDouble(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-[#0C447C] focus:ring-[#0C447C]"
              />
              <span className="text-sm text-slate-700">
                Double period — also occupy P{nextPeriodNo}
                {!canDouble && isSplit && <span className="text-slate-400"> (can't combine with a split lesson)</span>}
                {!canDouble && !isSplit && <span className="text-slate-400"> (P{nextPeriodNo} isn't free)</span>}
              </span>
            </label>

            <label className={`flex items-center gap-2 mb-3 ${!isDouble ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}`}>
              <input
                type="checkbox"
                checked={isSplit}
                disabled={isDouble}
                onChange={e => setIsSplit(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-[#0C447C] focus:ring-[#0C447C]"
              />
              <span className="text-sm text-slate-700">
                Split lesson — divide the class between different teachers/rooms
                {isDouble && <span className="text-slate-400"> (can't combine with a double period)</span>}
              </span>
            </label>
          </>
        )}

        <label className="flex items-center gap-2 mb-4 cursor-pointer">
          <input
            type="checkbox"
            checked={locked}
            onChange={e => setLocked(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-[#0C447C] focus:ring-[#0C447C]"
          />
          <span className="text-sm text-slate-700">🔒 Lock this period — skip it when dragging or regenerating</span>
        </label>

        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          {existing && (
            <button
              type="button"
              onClick={handleClear}
              disabled={mut.isPending}
              className="text-xs text-red-500 hover:text-red-700 transition-colors disabled:opacity-40"
            >
              Clear Period
            </button>
          )}
          <div className={`flex gap-2 ${!existing ? 'ml-auto' : ''}`}>
            <button onClick={onClose} type="button"
              className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!canSave || hasConflict || mut.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-[#0C447C] rounded-lg hover:bg-[#0b3d6e] transition-colors disabled:opacity-40 flex items-center gap-2"
            >
              {mut.isPending && <Spin size="w-3.5 h-3.5" />}
              Save Period
            </button>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}

// ─── ASSIGN SUBSTITUTE MODAL ──────────────────────────────────────────────────

function AssignSubstituteModal({
  timetable, day, periodNo, periodTime, allTimetables, onClose,
}: {
  timetable: any; day: number; periodNo: number; periodTime?: PeriodTime;
  allTimetables: any[]; onClose: () => void;
}) {
  const qc = useQueryClient();
  const { data: teachers = [] } = useQuery({ queryKey: ['teachers'], queryFn: teachingService.getTeachers });
  const freeTeachers = getFreeTeachersAtSlot(day, periodNo, allTimetables, teachers as any[]);
  const [selectedSub, setSelectedSub] = useState<any>(null);

  const period = (timetable.periods || []).find(
    (p: any) => p.day === day && p.periodNo === periodNo,
  );

  const mut = useMutation({
    mutationFn: (periods: any[]) => teachingService.updateTimetable(timetable._id, { periods }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['timetables'] });
      toast.success('Substitute assigned');
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed'),
  });

  function handleAssign() {
    if (!selectedSub || !period) return;
    const others = (timetable.periods || []).filter(
      (p: any) => !(p.day === day && p.periodNo === periodNo),
    );
    mut.mutate([...others, {
      ...period,
      teacherId: selectedSub._id,
      teacherName: `${selectedSub.firstName} ${selectedSub.lastName}`,
    }]);
  }

  return (
    <ModalShell
      title="Assign Substitute"
      sub={`${DAY_NAMES[day]} P${periodNo} · ${period?.subject || '—'} · ${timetable.gradeLevel} ${timetable.sectionName}`}
      onClose={onClose}
      maxWidth="max-w-sm"
    >
      <div className="p-6">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
          Teachers Free at This Slot ({freeTeachers.length})
        </div>
        {freeTeachers.length === 0 ? (
          <div className="text-sm text-slate-400 py-4 text-center">No free teachers at this slot</div>
        ) : (
          <div className="space-y-1 max-h-56 overflow-y-auto mb-4">
            {freeTeachers.map(t => (
              <button
                key={t._id}
                type="button"
                onClick={() => setSelectedSub(t)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg border text-sm transition-colors ${
                  selectedSub?._id === t._id
                    ? 'bg-[#0C447C] text-white border-[#0C447C]'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-[#0C447C]'
                }`}
              >
                <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold shrink-0">
                  {t.firstName?.[0]}{t.lastName?.[0]}
                </div>
                <div className="text-left min-w-0">
                  <div className="font-medium truncate">{t.firstName} {t.lastName}</div>
                  <div className={`text-xs truncate ${selectedSub?._id === t._id ? 'text-blue-200' : 'text-slate-400'}`}>
                    {(t.subjectsCanTeach || []).slice(0,2).join(', ') || '—'}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button onClick={onClose} type="button"
            className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAssign}
            disabled={!selectedSub || mut.isPending}
            className="px-4 py-2 text-sm text-white bg-[#0C447C] rounded-lg hover:bg-[#0b3d6e] transition-colors disabled:opacity-40 flex items-center gap-2"
          >
            {mut.isPending && <Spin size="w-3.5 h-3.5" />}
            Assign
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

// ─── ROOMS & PERIOD TEMPLATES SETUP MODAL ─────────────────────────────────────

const ROOM_TYPES = ['classroom', 'lab', 'hall', 'gym', 'library', 'auditorium', 'art_room', 'music_room', 'other'];
const TEMPLATE_SLOT_TYPES = ['regular', 'break', 'assembly', 'prayer', 'lunch', 'sports'];

function RoomsAndPeriodsModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'rooms' | 'periods'>('rooms');

  // ── Rooms ──
  const { data: rooms = [] } = useQuery({ queryKey: ['rooms'], queryFn: () => teachingService.getRooms() });
  const { data: campuses = [] } = useQuery({ queryKey: ['campuses'], queryFn: organizationService.getCampuses });
  const [roomForm, setRoomForm] = useState({ name: '', code: '', type: 'classroom', capacity: 30, campusId: '' });

  const createRoom = useMutation({
    mutationFn: () => teachingService.createRoom(roomForm),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['rooms'] }); toast.success('Room added'); setRoomForm({ name: '', code: '', type: 'classroom', capacity: 30, campusId: '' }); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });
  const deleteRoom = useMutation({
    mutationFn: (id: string) => teachingService.deleteRoom(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['rooms'] }); toast.success('Room removed'); },
  });

  // ── Period Templates ──
  const { data: templates = [] } = useQuery({ queryKey: ['period-templates'], queryFn: () => teachingService.getPeriodTemplates() });
  const [editingTemplate, setEditingTemplate] = useState<any>(null);

  const seedDefault = useMutation({
    mutationFn: () => teachingService.seedDefaultPeriodTemplate(),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['period-templates'] }); toast.success('Default 8-period day created — customize it below'); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });
  const deleteTemplate = useMutation({
    mutationFn: (id: string) => teachingService.deletePeriodTemplate(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['period-templates'] }); toast.success('Template removed'); },
  });

  return (
    <ModalShell title="Rooms & Period Templates" sub="Shared setup used across every timetable" onClose={onClose} maxWidth="max-w-3xl">
      <div className="flex border-b border-slate-100 px-6">
        {(['rooms', 'periods'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'text-[#0C447C] border-[#0C447C]' : 'text-slate-400 border-transparent hover:text-slate-600'}`}>
            {t === 'rooms' ? 'Rooms' : 'Period Templates'}
          </button>
        ))}
      </div>

      <div className="p-6">
        {tab === 'rooms' && (
          <>
            <div className="grid grid-cols-5 gap-2 mb-4 items-end">
              <div className="col-span-2">
                <label className={labelCls}>Name</label>
                <input value={roomForm.name} onChange={e => setRoomForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Room 101" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Type</label>
                <select value={roomForm.type} onChange={e => setRoomForm(p => ({ ...p, type: e.target.value }))} className={inputCls}>
                  {ROOM_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Capacity</label>
                <input type="number" value={roomForm.capacity} onChange={e => setRoomForm(p => ({ ...p, capacity: Number(e.target.value) || 0 }))} className={inputCls} />
              </div>
              <button onClick={() => createRoom.mutate()} disabled={!roomForm.name || createRoom.isPending}
                className="px-3 py-2 bg-[#0C447C] text-white text-sm rounded-lg hover:bg-[#0b3d6e] disabled:opacity-40 h-[38px]">
                + Add
              </button>
            </div>
            <div className="space-y-1.5">
              {(rooms as any[]).length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">No rooms added yet.</p>
              ) : (rooms as any[]).map((r: any) => (
                <div key={r._id} className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg text-sm">
                  <div>
                    <span className="font-medium text-slate-800">{r.name}</span>
                    <span className="text-xs text-slate-400 ml-2">{r.type.replace('_', ' ')} · {r.capacity} seats</span>
                  </div>
                  <button onClick={() => deleteRoom.mutate(r._id)} className="text-xs text-red-500 hover:underline">Remove</button>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'periods' && (
          <>
            {(templates as any[]).length === 0 ? (
              <div className="text-center py-10">
                <p className="text-sm text-slate-400 mb-4">No period template yet — every timetable needs one shared definition of what each period means (e.g. Period 3 = 09:20–10:00), so different classes' schedules are genuinely comparable for conflict detection.</p>
                <button onClick={() => seedDefault.mutate()} disabled={seedDefault.isPending}
                  className="px-4 py-2 bg-[#0C447C] text-white text-sm font-medium rounded-lg hover:bg-[#0b3d6e]">
                  {seedDefault.isPending ? 'Creating…' : '+ Create Default 8-Period Day'}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {(templates as any[]).map((t: any) => (
                  <div key={t._id} className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-800">{t.name}</span>
                        {t.isDefault && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Default</span>}
                        <span className="text-xs text-slate-400">{t.periods.length} slots</span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setEditingTemplate(editingTemplate?._id === t._id ? null : t)} className="text-xs text-[#0C447C] hover:underline">
                          {editingTemplate?._id === t._id ? 'Hide' : 'View/Edit'}
                        </button>
                        <button onClick={() => deleteTemplate.mutate(t._id)} className="text-xs text-red-500 hover:underline">Remove</button>
                      </div>
                    </div>
                    {editingTemplate?._id === t._id && <PeriodTemplateEditor template={t} onClose={() => setEditingTemplate(null)} />}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </ModalShell>
  );
}

function PeriodTemplateEditor({ template, onClose }: { template: any; onClose: () => void }) {
  const qc = useQueryClient();
  const [periods, setPeriods] = useState<any[]>(template.periods || []);

  const save = useMutation({
    mutationFn: () => teachingService.updatePeriodTemplate(template._id, { periods }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['period-templates'] }); toast.success('Saved'); onClose(); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });

  function updateSlot(i: number, field: string, val: any) {
    setPeriods(prev => prev.map((p, idx) => idx === i ? { ...p, [field]: val } : p));
  }
  function addSlot() {
    const next = periods.length + 1;
    setPeriods(prev => [...prev, { periodNo: next, label: `Period ${next}`, startTime: '00:00', endTime: '00:40', type: 'regular' }]);
  }
  function removeSlot(i: number) {
    setPeriods(prev => prev.filter((_, idx) => idx !== i));
  }

  return (
    <div className="p-4 space-y-2">
      <div className="grid gap-2 px-1" style={{ gridTemplateColumns: '2fr 90px 90px 1fr 24px' }}>
        {['Label', 'Start', 'End', 'Type', ''].map(h => (
          <span key={h} className="text-xs font-semibold text-slate-400 uppercase">{h}</span>
        ))}
      </div>
      {periods.map((p, i) => (
        <div key={i} className="grid gap-2 items-center" style={{ gridTemplateColumns: '2fr 90px 90px 1fr 24px' }}>
          <input value={p.label} onChange={e => updateSlot(i, 'label', e.target.value)} className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm" />
          <input type="time" value={p.startTime} onChange={e => updateSlot(i, 'startTime', e.target.value)} className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm" />
          <input type="time" value={p.endTime} onChange={e => updateSlot(i, 'endTime', e.target.value)} className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm" />
          <select value={p.type} onChange={e => updateSlot(i, 'type', e.target.value)} className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm bg-white">
            {TEMPLATE_SLOT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <button onClick={() => removeSlot(i)} className="text-slate-300 hover:text-red-500 text-sm">✕</button>
        </div>
      ))}
      <div className="flex justify-between items-center pt-2">
        <button onClick={addSlot} className="text-xs text-[#0C447C] font-medium hover:underline">+ Add Slot</button>
        <button onClick={() => save.mutate()} disabled={save.isPending} className="px-3 py-1.5 bg-[#0C447C] text-white text-xs rounded-lg hover:bg-[#0b3d6e]">
          {save.isPending ? 'Saving…' : 'Save Periods'}
        </button>
      </div>
    </div>
  );
}


const EMPTY_SETUP: TimetableSetupForm = {
  gradeLevel: '', sectionName: '', academicYearLabel: localStorage.getItem('academicYear') || '', campus: '',
  workingDays: DEFAULT_WORKING_DAYS, periodsPerDay: 8,
  startTime: '08:00', periodDuration: 40, breakAfterPeriod: 4, breakDuration: 20,
};

const mkSubject = (id: string): SubjectSetup => ({
  id, subject: '', periodsPerWeek: 4, teacherId: '', teacherName: '', room: '',
});

function CreateTimetableModal({ onClose, onCreated }: { onClose: () => void; onCreated?: (id: string) => void }) {
  const qc = useQueryClient();
  const { data: teachers = [] } = useQuery({ queryKey: ['teachers'], queryFn: teachingService.getTeachers });
  const { data: realCampuses = [] } = useQuery({ queryKey: ['campuses'], queryFn: organizationService.getCampuses });
  const { data: realSubjects = [] } = useQuery({ queryKey: ['subjects-for-dropdown'], queryFn: () => academicsService.getSubjects() });
  const { data: realRooms = [] } = useQuery({ queryKey: ['rooms'], queryFn: () => teachingService.getRooms() });
  // So Auto-Generate can avoid double-booking a teacher who's already
  // committed to a different class's timetable at that slot - see the
  // comment on autoGeneratePeriods for why this matters.
  const { data: allTimetables = [] } = useQuery({ queryKey: ['timetables'], queryFn: () => teachingService.getTimetables() });

  const [step, setStep] = useState(1);
  const [setup, setSetup] = useState<TimetableSetupForm>(EMPTY_SETUP);
  const [subjects, setSubjects] = useState<SubjectSetup[]>([mkSubject('s1'), mkSubject('s2'), mkSubject('s3')]);

  const periodTimes = useMemo(() =>
    generatePeriodTimes(setup.startTime, setup.periodDuration, setup.periodsPerDay, setup.breakAfterPeriod, setup.breakDuration),
    [setup.startTime, setup.periodDuration, setup.periodsPerDay, setup.breakAfterPeriod, setup.breakDuration],
  );

  const totalAllocated = subjects.reduce((sum, s) => sum + (s.periodsPerWeek || 0), 0);
  const totalSlots = setup.periodsPerDay * setup.workingDays.length;

  const mut = useMutation({
    mutationFn: (payload: any) => teachingService.createTimetable(payload),
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ['timetables'] });
      toast.success('Timetable created');
      onCreated?.(data._id);
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed'),
  });

  function toggleDay(d: number) {
    setSetup(prev => ({
      ...prev,
      workingDays: prev.workingDays.includes(d)
        ? prev.workingDays.filter(x => x !== d)
        : [...prev.workingDays, d].sort(),
    }));
  }

  function addSubject() {
    setSubjects(prev => [...prev, mkSubject(`s${Date.now()}`)]);
  }

  function updateSubject(idx: number, key: keyof SubjectSetup, val: any) {
    setSubjects(prev => prev.map((s, i) => i === idx ? { ...s, [key]: val } : s));
  }

  function removeSubject(idx: number) {
    setSubjects(prev => prev.filter((_, i) => i !== idx));
  }

  function handleBuild(auto: boolean) {
    const periods = auto
      ? autoGeneratePeriods(subjects.filter(s => s.subject), setup.workingDays, setup.periodsPerDay, periodTimes, allTimetables as any[], '')
      : [];
    mut.mutate({
      gradeLevel: setup.gradeLevel,
      sectionName: setup.sectionName,
      academicYearLabel: setup.academicYearLabel,
      campus: setup.campus,
      workingDays: setup.workingDays,
      periodsPerDay: setup.periodsPerDay,
      status: 'draft',
      periods,
    });
  }

  const step1Valid = setup.gradeLevel && setup.sectionName && setup.workingDays.length > 0;

  return (
    <ModalShell title="Create Timetable" sub={`Step ${step} of 3`} onClose={onClose} maxWidth="max-w-3xl">
      <div className="p-6">

        {/* Step indicator */}
        <div className="flex items-center gap-0 mb-6">
          {[1,2,3].map((s,i) => (
            <div key={s} className="flex items-center">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                step === s ? 'bg-[#0C447C] border-[#0C447C] text-white' :
                step > s ? 'bg-[#EF9F27] border-[#EF9F27] text-white' :
                'bg-white border-slate-300 text-slate-400'
              }`}>{step > s ? '✓' : s}</div>
              <div className="text-xs ml-2 mr-4 font-medium" style={{ color: step >= s ? '#0C447C' : '#9CA3AF' }}>
                {['Basic Setup','Subject Allocation','Generate'][i]}
              </div>
              {i < 2 && <div className={`flex-1 h-0.5 mr-4 min-w-[32px] ${step > s ? 'bg-[#EF9F27]' : 'bg-slate-200'}`}/>}
            </div>
          ))}
        </div>

        {/* ── STEP 1: Basic Setup ──────────────────────────────────────────── */}
        {step === 1 && (
          <>
            <FormSection title="Class">
              <div className="grid grid-cols-3 gap-3">
                <GradeLevelDropdown value={setup.gradeLevel} onChange={v => setSetup(p => ({ ...p, gradeLevel: v, sectionName: '' }))} />
                <SectionDropdown gradeLevel={setup.gradeLevel} value={setup.sectionName} onChange={v => setSetup(p => ({ ...p, sectionName: v }))} />
                <div>
                  <label className={labelCls}>Academic Year</label>
                  <input value={setup.academicYearLabel} onChange={e => setSetup(p => ({ ...p, academicYearLabel: e.target.value }))}
                    placeholder="2025-2026" className={inputCls} />
                </div>
              </div>
            </FormSection>

            <FormSection title="Schedule">
              <div className="mb-4">
                <label className={labelCls}>Working Days</label>
                <div className="flex gap-2 mt-1 flex-wrap">
                  {[1,2,3,4,5,6,0].map(d => (
                    <button key={d} type="button" onClick={() => toggleDay(d)}
                      className={`w-12 h-9 rounded-lg text-xs font-semibold border-2 transition-colors ${
                        setup.workingDays.includes(d)
                          ? 'bg-[#0C447C] text-white border-[#0C447C]'
                          : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                      }`}>
                      {DAY_SHORT[d]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className={labelCls}>Periods per Day</label>
                  <select value={setup.periodsPerDay} onChange={e => setSetup(p => ({ ...p, periodsPerDay: Number(e.target.value) }))} className={inputCls}>
                    {PERIODS_OPTIONS.map(n => <option key={n} value={n}>{n} periods</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Campus</label>
                  <select value={setup.campus} onChange={e => setSetup(p => ({ ...p, campus: e.target.value }))} className={inputCls}>
                    <option value="">Select campus…</option>
                    {(realCampuses as any[]).map((c: any) => <option key={c._id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
              </div>
            </FormSection>

            <FormSection title="Period Timing">
              <div className="grid grid-cols-4 gap-3 mb-4">
                <div>
                  <label className={labelCls}>Start Time</label>
                  <input type="time" value={setup.startTime} onChange={e => setSetup(p => ({ ...p, startTime: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Period (mins)</label>
                  <input type="number" min={20} max={90} value={setup.periodDuration}
                    onChange={e => setSetup(p => ({ ...p, periodDuration: Number(e.target.value) || 40 }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Break After P</label>
                  <select value={setup.breakAfterPeriod} onChange={e => setSetup(p => ({ ...p, breakAfterPeriod: Number(e.target.value) }))} className={inputCls}>
                    {Array.from({ length: setup.periodsPerDay - 1 }, (_, i) => i + 1).map(n =>
                      <option key={n} value={n}>After P{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Break (mins)</label>
                  <input type="number" min={5} max={60} value={setup.breakDuration}
                    onChange={e => setSetup(p => ({ ...p, breakDuration: Number(e.target.value) || 20 }))} className={inputCls} />
                </div>
              </div>
              {/* Preview */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 text-xs font-mono text-slate-600 flex flex-wrap gap-x-3 gap-y-1">
                {periodTimes.map((pt, i) => (
                  <span key={i}>
                    <span className="font-semibold text-[#0C447C]">P{pt.periodNo}:</span> {pt.startTime}–{pt.endTime}
                    {pt.periodNo === setup.breakAfterPeriod && (
                      <span className="text-amber-600 ml-1">| Break {setup.breakDuration}m</span>
                    )}
                  </span>
                ))}
              </div>
            </FormSection>
          </>
        )}

        {/* ── STEP 2: Subject Allocation ───────────────────────────────────── */}
        {step === 2 && (
          <>
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold text-slate-700">Subject Schedule</div>
              <div className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                totalAllocated > totalSlots ? 'bg-red-50 text-red-600 border-red-200' :
                totalAllocated === totalSlots ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                {totalAllocated} / {totalSlots} periods allocated
              </div>
            </div>
            <div className="space-y-2 mb-4">
              <div className="grid gap-2 px-1" style={{ gridTemplateColumns: '2fr 60px 2fr 1fr 28px' }}>
                {['Subject','P/Wk','Teacher','Room',''].map(h => (
                  <span key={h} className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{h}</span>
                ))}
              </div>
              {subjects.map((s, idx) => (
                <div key={s.id} className="grid gap-2 items-center" style={{ gridTemplateColumns: '2fr 60px 2fr 1fr 28px' }}>
                  <select
                    value={s.subject}
                    onChange={e => updateSubject(idx, 'subject', e.target.value)}
                    className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0C447C] bg-white"
                  >
                    <option value="">Select subject…</option>
                    {(realSubjects as any[]).map((sub: any) => (
                      <option key={sub._id} value={sub.name}>{sub.name}</option>
                    ))}
                  </select>
                  <input
                    type="number" min={1} max={totalSlots}
                    value={s.periodsPerWeek}
                    onChange={e => updateSubject(idx, 'periodsPerWeek', Number(e.target.value) || 1)}
                    className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#0C447C]"
                  />
                  <select
                    value={s.teacherId}
                    onChange={e => {
                      const t = (teachers as any[]).find(x => x._id === e.target.value);
                      updateSubject(idx, 'teacherId', e.target.value);
                      updateSubject(idx, 'teacherName', t ? `${t.firstName} ${t.lastName}` : '');
                    }}
                    className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0C447C] bg-white"
                  >
                    <option value="">— No teacher —</option>
                    {(teachers as any[]).map(t => (
                      <option key={t._id} value={t._id}>{t.firstName} {t.lastName}</option>
                    ))}
                  </select>
                  <select
                    value={s.room}
                    onChange={e => updateSubject(idx, 'room', e.target.value)}
                    className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0C447C] bg-white"
                  >
                    <option value="">Room…</option>
                    {(realRooms as any[]).map((r: any) => (
                      <option key={r._id} value={r.name}>{r.name}</option>
                    ))}
                  </select>
                  <button type="button" onClick={() => removeSubject(idx)}
                    className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
                  </button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addSubject}
              className="text-xs font-medium text-[#0C447C] hover:text-[#0b3d6e] flex items-center gap-1 transition-colors">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
              Add Subject
            </button>
          </>
        )}

        {/* ── STEP 3: Generate ─────────────────────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
              <strong>{setup.gradeLevel} — Section {setup.sectionName}</strong> &nbsp;·&nbsp;
              {setup.academicYearLabel} &nbsp;·&nbsp;
              {setup.periodsPerDay} periods/day &nbsp;·&nbsp;
              {setup.workingDays.map(d => DAY_SHORT[d]).join(', ')}
              <div className="mt-1 text-xs text-blue-600">
                {subjects.filter(s => s.subject).length} subjects · {totalAllocated} of {totalSlots} slots planned
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleBuild(true)}
                disabled={mut.isPending}
                className="flex flex-col items-center gap-3 p-6 bg-[#0C447C] text-white rounded-xl hover:bg-[#0b3d6e] transition-colors disabled:opacity-50"
              >
                {mut.isPending ? <Spin /> : <span className="text-3xl">⚡</span>}
                <div>
                  <div className="font-semibold text-sm">Auto-Generate Timetable</div>
                  <div className="text-xs opacity-75 mt-0.5">Distribute subjects automatically with conflict avoidance</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleBuild(false)}
                disabled={mut.isPending}
                className="flex flex-col items-center gap-3 p-6 bg-white border-2 border-slate-200 text-slate-700 rounded-xl hover:border-[#0C447C] hover:bg-blue-50 transition-colors disabled:opacity-50"
              >
                <span className="text-3xl">🏗</span>
                <div>
                  <div className="font-semibold text-sm">Build Manually</div>
                  <div className="text-xs text-slate-400 mt-0.5">Start with an empty grid and fill in each cell</div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-5 mt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={step === 1 ? onClose : () => setStep(s => s - 1)}
            className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            {step === 1 ? 'Cancel' : '← Back'}
          </button>
          {step < 3 && (
            <button
              type="button"
              onClick={() => setStep(s => s + 1)}
              disabled={step === 1 && !step1Valid}
              className="px-4 py-2 text-sm font-medium text-white bg-[#0C447C] rounded-lg hover:bg-[#0b3d6e] transition-colors disabled:opacity-40"
            >
              Continue →
            </button>
          )}
        </div>
      </div>
    </ModalShell>
  );
}

// ─── SUBSTITUTION BANNER ──────────────────────────────────────────────────────

function SubstitutionBanner({
  timetables, teachers,
}: {
  timetables: any[]; teachers: any[];
}) {
  const [subCtx, setSubCtx] = useState<{ timetable: any; day: number; periodNo: number } | null>(null);
  const todayDow = new Date().getDay(); // 0=Sun ... 6=Sat

  const absentTeachers = (teachers as any[]).filter(t => t.status === 'absent');
  if (absentTeachers.length === 0) return null;

  type AffectedPeriod = {
    teacher: any; timetable: any; period: any;
  };

  const affected: AffectedPeriod[] = [];
  for (const teacher of absentTeachers) {
    for (const tt of timetables) {
      for (const p of tt.periods || []) {
        if (p.day === todayDow && p.teacherId === teacher._id) {
          affected.push({ teacher, timetable: tt, period: p });
        }
      }
    }
  }

  if (affected.length === 0) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 flex items-center gap-3">
        <span className="text-lg">⚠</span>
        <div className="text-sm text-amber-800">
          <strong>{absentTeachers.map(t => `${t.firstName} ${t.lastName}`).join(', ')}</strong>
          {absentTeachers.length === 1 ? ' is' : ' are'} absent today — no periods scheduled for today ({DAY_NAMES[todayDow]}).
        </div>
      </div>
    );
  }

  return (
    <>
      {subCtx && (
        <AssignSubstituteModal
          timetable={subCtx.timetable}
          day={subCtx.day}
          periodNo={subCtx.periodNo}
          allTimetables={timetables}
          onClose={() => setSubCtx(null)}
        />
      )}
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5">
        <div className="flex items-center gap-2 font-semibold text-red-800 text-sm mb-3">
          ⚠ Absent Teacher Alert — {DAY_NAMES[todayDow]}
        </div>
        <div className="space-y-2">
          {affected.map((a, i) => (
            <div key={i} className="flex items-center justify-between bg-white rounded-lg border border-red-100 px-4 py-2.5">
              <div className="text-sm">
                <span className="font-semibold text-red-700">{a.teacher.firstName} {a.teacher.lastName}</span>
                <span className="text-slate-500"> — P{a.period.periodNo} &nbsp;·&nbsp; </span>
                <span className="text-slate-700">{a.period.subject || '—'}</span>
                <span className="text-slate-400"> ({a.timetable.gradeLevel} {a.timetable.sectionName})</span>
              </div>
              <button
                onClick={() => setSubCtx({ timetable: a.timetable, day: todayDow, periodNo: a.period.periodNo })}
                className="px-3 py-1 text-xs bg-[#EF9F27] text-white rounded-lg hover:bg-amber-600 transition-colors shrink-0"
              >
                Assign Substitute
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── ELECTIVE / CROSS-CLASS GROUPS ─────────────────────────────────────────────
// Manages subject blocks that draw students out of several class-sections at
// once (e.g. "Computer Science" pulling from three different Grade 10
// sections for the same period) - the kind of structure colleges and
// coaching centres run on but a single-class timetable model can't express.
// The backend projects each group's period into every member timetable, so
// editing a specific elective slot happens here, not in the per-class grid.

function ElectiveGroupForm({ allTimetables, existing, onDone }: { allTimetables: any[]; existing?: any; onDone: () => void }) {
  const qc = useQueryClient();
  const { data: teachers = [] } = useQuery({ queryKey: ['teachers'], queryFn: teachingService.getTeachers });
  const teacherList = teachers as any[];

  const [name, setName] = useState(existing?.name ?? '');
  const [subject, setSubject] = useState(existing?.subject ?? '');
  const [selectedTeacher, setSelectedTeacher] = useState<any>(
    existing?.teacherId ? teacherList.find(t => t._id === existing.teacherId) ?? null : null,
  );
  const [room, setRoom] = useState(existing?.roomNo ?? '');
  const [day, setDay] = useState<number>(existing?.day ?? 1);
  const [periodNo, setPeriodNo] = useState<number>(existing?.periodNo ?? 1);
  const [startTime, setStartTime] = useState(existing?.startTime ?? '08:00');
  const [endTime, setEndTime] = useState(existing?.endTime ?? '08:40');
  const [weekCycle, setWeekCycle] = useState<'both' | 'A' | 'B'>(existing?.weekCycle ?? 'both');
  const [memberIds, setMemberIds] = useState<Set<string>>(
    new Set((existing?.members ?? []).map((m: any) => String(m.timetableId))),
  );

  const mut = useMutation({
    mutationFn: (payload: any) => existing
      ? teachingService.updateElectiveGroup(existing._id, payload)
      : teachingService.createElectiveGroup(payload),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ['electiveGroups'] });
      qc.invalidateQueries({ queryKey: ['timetables'] });
      if (res?.conflicts?.length) toast(`Saved with ${res.conflicts.length} conflict(s) - review the timetable grid`, { icon: '⚠️' });
      else toast.success(existing ? 'Elective group updated' : 'Elective group created');
      onDone();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to save'),
  });

  function toggleMember(id: string) {
    setMemberIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function handleSave() {
    const members = allTimetables
      .filter(tt => memberIds.has(tt._id))
      .map(tt => ({ timetableId: tt._id, gradeLevel: tt.gradeLevel, sectionName: tt.sectionName }));
    mut.mutate({
      name, subject, day, periodNo, startTime, endTime, weekCycle, members,
      teacherId: selectedTeacher?._id ?? null,
      teacherName: selectedTeacher ? `${selectedTeacher.firstName} ${selectedTeacher.lastName}` : '',
      roomNo: room,
    });
  }

  const canSave = name.trim() && subject.trim() && memberIds.size >= 2 && !mut.isPending;

  return (
    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className={labelCls}>Group Name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Computer Science Elective" className={inputCls} />
        </div>
        <div>
          <SubjectDropdown value={subject} onChange={setSubject} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <TeacherDropdown value={selectedTeacher} onSelect={setSelectedTeacher} />
        <RoomDropdown value={room} onChange={setRoom} label="Room / Lab" />
      </div>

      <div className="grid grid-cols-4 gap-3 mb-3">
        <div>
          <label className={labelCls}>Day</label>
          <select value={day} onChange={e => setDay(Number(e.target.value))} className={inputCls}>
            {DEFAULT_WORKING_DAYS.map(d => <option key={d} value={d}>{DAY_NAMES[d]}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Period #</label>
          <input type="number" min={1} value={periodNo} onChange={e => setPeriodNo(Number(e.target.value) || 1)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Start</label>
          <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>End</label>
          <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className={inputCls} />
        </div>
      </div>

      <div className="mb-3">
        <label className={labelCls}>Week Cycle</label>
        <div className="flex gap-2">
          {([['both', 'Every week'], ['A', 'Week A only'], ['B', 'Week B only']] as const).map(([id, lbl]) => (
            <button key={id} type="button" onClick={() => setWeekCycle(id)}
              className={`px-3 py-1.5 text-xs rounded-lg border font-medium transition-colors ${weekCycle === id ? 'bg-[#0C447C] text-white border-[#0C447C]' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}>
              {lbl}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3">
        <label className={labelCls}>Member Classes (pick 2 or more)</label>
        <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg bg-white divide-y divide-slate-100">
          {allTimetables.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">No timetables yet - create one first.</p>
          ) : allTimetables.map(tt => (
            <label key={tt._id} className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-slate-50">
              <input type="checkbox" checked={memberIds.has(tt._id)} onChange={() => toggleMember(tt._id)}
                className="w-3.5 h-3.5 rounded border-slate-300 text-[#0C447C] focus:ring-[#0C447C]" />
              {tt.gradeLevel} — {tt.sectionName}
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onDone} className="px-3 py-1.5 text-xs text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
        <button type="button" onClick={handleSave} disabled={!canSave}
          className="px-3 py-1.5 text-xs font-medium text-white bg-[#0C447C] rounded-lg hover:bg-[#0b3d6e] disabled:opacity-40">
          {mut.isPending ? 'Saving…' : existing ? 'Save Changes' : 'Create Group'}
        </button>
      </div>
    </div>
  );
}

function ElectiveGroupsModal({ allTimetables, onClose }: { allTimetables: any[]; onClose: () => void }) {
  const qc = useQueryClient();
  const { data: groups = [] } = useQuery({ queryKey: ['electiveGroups'], queryFn: () => teachingService.getElectiveGroups() });
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const deleteMut = useMutation({
    mutationFn: (id: string) => teachingService.deleteElectiveGroup(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['electiveGroups'] });
      qc.invalidateQueries({ queryKey: ['timetables'] });
      toast.success('Elective group removed');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed'),
  });

  return (
    <ModalShell title="Manage Electives" sub="Cross-class subject blocks shared by several sections at once" onClose={onClose} maxWidth="max-w-2xl">
      <div className="p-6">
        {(showForm || editing) ? (
          <ElectiveGroupForm allTimetables={allTimetables} existing={editing} onDone={() => { setShowForm(false); setEditing(null); }} />
        ) : (
          <>
            <button onClick={() => setShowForm(true)}
              className="mb-4 px-4 py-2 bg-[#0C447C] text-white text-sm font-medium rounded-lg hover:bg-[#0b3d6e]">
              + New Elective Group
            </button>
            {(groups as any[]).length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-10">No elective groups yet.</p>
            ) : (
              <div className="space-y-2">
                {(groups as any[]).map((g: any) => (
                  <div key={g._id} className="flex items-center justify-between px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <div>
                      <div className="font-semibold text-sm text-slate-800">{g.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {g.subject} · {g.teacherName || 'No teacher'} · {g.roomNo || 'No room'} · {DAY_NAMES[g.day]} P{g.periodNo} ({g.startTime}–{g.endTime})
                        {g.weekCycle !== 'both' && <span> · Week {g.weekCycle}</span>}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {(g.members || []).map((m: any) => `${m.gradeLevel} ${m.sectionName}`).join(', ') || 'No member classes'}
                      </div>
                    </div>
                    <div className="flex gap-3 shrink-0 ml-3">
                      <button onClick={() => setEditing(g)} className="text-xs text-[#0C447C] hover:underline">Edit</button>
                      <button onClick={() => deleteMut.mutate(g._id)} className="text-xs text-red-500 hover:underline">Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </ModalShell>
  );
}

// ─── DUTY ROSTER ────────────────────────────────────────────────────────────────
// Supervision duty (gate, exam hall, corridor, lunch, bus, library...)
// assigned to a teacher, run through the exact same conflict engine as
// lessons - a teacher already teaching, or already on another duty, can't be
// double-booked onto a new one.

const DUTY_TYPES = [
  { id: 'gate', label: 'Gate Duty' },
  { id: 'exam_hall', label: 'Exam Hall' },
  { id: 'corridor', label: 'Corridor' },
  { id: 'assembly', label: 'Assembly' },
  { id: 'lunch', label: 'Lunch/Cafeteria' },
  { id: 'bus', label: 'Bus Duty' },
  { id: 'library', label: 'Library' },
  { id: 'custom', label: 'Other' },
];

function DutyRosterForm({ existing, onDone }: { existing?: any; onDone: () => void }) {
  const qc = useQueryClient();
  const { data: teachers = [] } = useQuery({ queryKey: ['teachers'], queryFn: teachingService.getTeachers });
  const teacherList = teachers as any[];

  const [title, setTitle] = useState(existing?.title ?? '');
  const [dutyType, setDutyType] = useState(existing?.dutyType ?? 'custom');
  const [location, setLocation] = useState(existing?.location ?? '');
  const [selectedTeacher, setSelectedTeacher] = useState<any>(
    existing?.teacherId ? teacherList.find(t => t._id === existing.teacherId) ?? null : null,
  );
  const [day, setDay] = useState<number>(existing?.day ?? 1);
  const [startTime, setStartTime] = useState(existing?.startTime ?? '08:00');
  const [endTime, setEndTime] = useState(existing?.endTime ?? '08:40');
  const [weekCycle, setWeekCycle] = useState<'both' | 'A' | 'B'>(existing?.weekCycle ?? 'both');

  const mut = useMutation({
    mutationFn: (payload: any) => existing
      ? teachingService.updateDutyRoster(existing._id, payload)
      : teachingService.createDutyRoster(payload),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ['dutyRoster'] });
      if (res?.conflicts?.length) toast(`Saved with a conflict: ${res.conflicts[0].message}`, { icon: '⚠️' });
      else toast.success(existing ? 'Duty updated' : 'Duty assigned');
      onDone();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to save'),
  });

  function handleSave() {
    mut.mutate({
      title, dutyType, location, day, startTime, endTime, weekCycle,
      teacherId: selectedTeacher?._id ?? null,
      teacherName: selectedTeacher ? `${selectedTeacher.firstName} ${selectedTeacher.lastName}` : '',
    });
  }

  const canSave = title.trim() && selectedTeacher && !mut.isPending;

  return (
    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className={labelCls}>Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Main Gate Morning Duty" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Type</label>
          <select value={dutyType} onChange={e => setDutyType(e.target.value)} className={inputCls}>
            {DUTY_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <TeacherDropdown value={selectedTeacher} onSelect={setSelectedTeacher} />
        <div>
          <label className={labelCls}>Location</label>
          <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Main Gate" className={inputCls} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-3">
        <div>
          <label className={labelCls}>Day</label>
          <select value={day} onChange={e => setDay(Number(e.target.value))} className={inputCls}>
            {DEFAULT_WORKING_DAYS.map(d => <option key={d} value={d}>{DAY_NAMES[d]}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Start</label>
          <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>End</label>
          <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className={inputCls} />
        </div>
      </div>

      <div className="mb-3">
        <label className={labelCls}>Week Cycle</label>
        <div className="flex gap-2">
          {([['both', 'Every week'], ['A', 'Week A only'], ['B', 'Week B only']] as const).map(([id, lbl]) => (
            <button key={id} type="button" onClick={() => setWeekCycle(id)}
              className={`px-3 py-1.5 text-xs rounded-lg border font-medium transition-colors ${weekCycle === id ? 'bg-[#0C447C] text-white border-[#0C447C]' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}>
              {lbl}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onDone} className="px-3 py-1.5 text-xs text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
        <button type="button" onClick={handleSave} disabled={!canSave}
          className="px-3 py-1.5 text-xs font-medium text-white bg-[#0C447C] rounded-lg hover:bg-[#0b3d6e] disabled:opacity-40">
          {mut.isPending ? 'Saving…' : existing ? 'Save Changes' : 'Assign Duty'}
        </button>
      </div>
    </div>
  );
}

function DutyRosterModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const { data: duties = [] } = useQuery({ queryKey: ['dutyRoster'], queryFn: () => teachingService.getDutyRoster() });
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const deleteMut = useMutation({
    mutationFn: (id: string) => teachingService.deleteDutyRoster(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['dutyRoster'] }); toast.success('Duty removed'); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed'),
  });

  const byDay = useMemo(() => {
    const g: Record<number, any[]> = {};
    for (const d of (duties as any[])) (g[d.day] ??= []).push(d);
    return g;
  }, [duties]);

  return (
    <ModalShell title="Duty Roster" sub="Supervision duty, checked against lessons by the same conflict engine" onClose={onClose} maxWidth="max-w-2xl">
      <div className="p-6">
        {(showForm || editing) ? (
          <DutyRosterForm existing={editing} onDone={() => { setShowForm(false); setEditing(null); }} />
        ) : (
          <>
            <button onClick={() => setShowForm(true)}
              className="mb-4 px-4 py-2 bg-[#0C447C] text-white text-sm font-medium rounded-lg hover:bg-[#0b3d6e]">
              + Assign Duty
            </button>
            {(duties as any[]).length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-10">No duties assigned yet.</p>
            ) : (
              <div className="space-y-4">
                {DEFAULT_WORKING_DAYS.filter(d => byDay[d]?.length).map(d => (
                  <div key={d}>
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">{DAY_NAMES[d]}</div>
                    <div className="space-y-2">
                      {byDay[d].sort((a, b) => a.startTime.localeCompare(b.startTime)).map((duty: any) => (
                        <div key={duty._id} className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                          <div>
                            <div className="font-semibold text-sm text-slate-800">
                              {duty.title} <span className="text-xs font-normal text-slate-400">({DUTY_TYPES.find(t => t.id === duty.dutyType)?.label})</span>
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              {duty.teacherName} · {duty.startTime}–{duty.endTime}{duty.location ? ` · ${duty.location}` : ''}
                              {duty.weekCycle !== 'both' && <span> · Week {duty.weekCycle}</span>}
                            </div>
                          </div>
                          <div className="flex gap-3 shrink-0 ml-3">
                            <button onClick={() => setEditing(duty)} className="text-xs text-[#0C447C] hover:underline">Edit</button>
                            <button onClick={() => deleteMut.mutate(duty._id)} className="text-xs text-red-500 hover:underline">Remove</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </ModalShell>
  );
}

// ─── WHOLE-SCHOOL OPTIMIZER ─────────────────────────────────────────────────────
// The genuinely hard part: instead of generating (or regenerating) one
// class's timetable at a time, this sends a batch of classes to the
// backend's TimetableSolverService, which schedules all of them together so
// a shared teacher's availability is respected school-wide - and produces
// several scored draft "variants" to compare before publishing one.

function ScoreBadge({ label, value, good }: { label: string; value: number; good: boolean }) {
  return (
    <div className={`px-2 py-1 rounded-lg text-xs font-medium ${good ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
      {label}: <strong>{value}</strong>
    </div>
  );
}

function VariantCard({ variant, allTimetables, onPublished, onDiscarded }: { variant: any; allTimetables: any[]; onPublished: () => void; onDiscarded: () => void }) {
  const qc = useQueryClient();
  const [previewClassIdx, setPreviewClassIdx] = useState<number | null>(null);

  const publishMut = useMutation({
    mutationFn: () => teachingService.publishTimetableVariant(variant._id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['timetableVariants'] });
      qc.invalidateQueries({ queryKey: ['timetables'] });
      toast.success('Variant published — this is now the live schedule for its classes');
      onPublished();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to publish'),
  });
  const discardMut = useMutation({
    mutationFn: () => teachingService.deleteTimetableVariant(variant._id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['timetableVariants'] }); onDiscarded(); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed'),
  });

  const previewClass = variant.classes.find((c: any) => c.classIdx === previewClassIdx) ?? variant.classes[previewClassIdx ?? -1];
  const previewIdx = previewClassIdx ?? 0;
  const selectedClass = variant.classes[previewIdx];
  const sourceTT = selectedClass ? allTimetables.find((tt: any) => tt._id === (selectedClass.timetableId?._id || selectedClass.timetableId)) : null;

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50">
        <div>
          <div className="font-semibold text-sm text-slate-800 flex items-center gap-2">
            {variant.name}
            {variant.status === 'published' && <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold uppercase">Published</span>}
          </div>
          <div className="flex gap-1.5 flex-wrap mt-1.5">
            <ScoreBadge label="Unplaced" value={variant.score.unplaced} good={variant.score.unplaced === 0} />
            <ScoreBadge label="Free-day violations" value={variant.score.freeDayViolations} good={variant.score.freeDayViolations === 0} />
            <ScoreBadge label="Consecutive violations" value={variant.score.consecutiveViolations} good={variant.score.consecutiveViolations === 0} />
            <ScoreBadge label="Total gaps" value={variant.score.totalGaps} good={variant.score.totalGaps < 10} />
          </div>
        </div>
        {variant.status !== 'published' && (
          <div className="flex gap-2 shrink-0 ml-3">
            <button onClick={() => discardMut.mutate()} disabled={discardMut.isPending}
              className="px-3 py-1.5 text-xs text-red-500 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-40">
              Discard
            </button>
            <button onClick={() => publishMut.mutate()} disabled={publishMut.isPending || variant.score.unplaced > 0}
              title={variant.score.unplaced > 0 ? 'Some lessons could not be placed - review before publishing' : undefined}
              className="px-3 py-1.5 text-xs font-medium text-white bg-[#0C447C] rounded-lg hover:bg-[#0b3d6e] disabled:opacity-40">
              {publishMut.isPending ? 'Publishing…' : 'Publish'}
            </button>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex flex-wrap gap-1.5 mb-3">
          {variant.classes.map((c: any, i: number) => (
            <button key={i} onClick={() => setPreviewClassIdx(i)}
              className={`px-2.5 py-1 text-xs rounded-lg border font-medium transition-colors ${previewIdx === i ? 'bg-[#0C447C] text-white border-[#0C447C]' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}>
              {c.gradeLevel} {c.sectionName}
            </button>
          ))}
        </div>
        {selectedClass && (
          <TimetableGrid
            timetable={{ ...selectedClass, workingDays: sourceTT?.workingDays, periodsPerDay: sourceTT?.periodsPerDay }}
            allTimetables={[]}
            periodTimes={sourceTT ? Array.from({ length: sourceTT.periodsPerDay || 8 }, (_, i) => {
              const pNo = i + 1;
              const p = (selectedClass.periods || []).find((x: any) => x.periodNo === pNo && x.startTime);
              return { periodNo: pNo, startTime: p?.startTime || '', endTime: p?.endTime || '' };
            }) : []}
            viewMode="class"
          />
        )}
      </div>
    </div>
  );
}

function OptimizerModal({ allTimetables, onClose }: { allTimetables: any[]; onClose: () => void }) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(allTimetables.map(tt => tt._id)));
  const [variantCount, setVariantCount] = useState(3);
  const [runId, setRunId] = useState<string | null>(null);

  const generateMut = useMutation({
    mutationFn: () => teachingService.generateTimetableVariants([...selectedIds], variantCount),
    onSuccess: (variants: any[]) => {
      setRunId(variants[0]?.runId ?? null);
      toast.success(`Generated ${variants.length} schedule option${variants.length !== 1 ? 's' : ''}`);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Generation failed'),
  });

  const { data: variants = [], refetch } = useQuery({
    queryKey: ['timetableVariants', runId],
    queryFn: () => teachingService.getTimetableVariants(runId ? { runId } : { status: 'draft' }),
    enabled: !!runId,
  });

  function toggle(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  return (
    <ModalShell title="Whole-School Optimizer" sub="Generates every selected class's timetable together, minimizing gaps and clashes school-wide" onClose={onClose} maxWidth="max-w-4xl">
      <div className="p-6">
        {!runId ? (
          <>
            <div className="mb-4">
              <label className={labelCls}>Classes to include ({selectedIds.size} selected)</label>
              <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-lg bg-white divide-y divide-slate-100">
                {allTimetables.map(tt => (
                  <label key={tt._id} className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-slate-50">
                    <input type="checkbox" checked={selectedIds.has(tt._id)} onChange={() => toggle(tt._id)}
                      className="w-3.5 h-3.5 rounded border-slate-300 text-[#0C447C] focus:ring-[#0C447C]" />
                    {tt.gradeLevel} — {tt.sectionName}
                  </label>
                ))}
              </div>
            </div>
            <div className="mb-5">
              <label className={labelCls}>Number of options to generate</label>
              <input type="number" min={1} max={6} value={variantCount}
                onChange={e => setVariantCount(Math.min(6, Math.max(1, parseInt(e.target.value) || 1)))}
                className={`${inputCls} max-w-[100px]`} />
            </div>
            <button onClick={() => generateMut.mutate()} disabled={generateMut.isPending || selectedIds.size === 0}
              className="px-4 py-2 bg-[#0C447C] text-white text-sm font-medium rounded-lg hover:bg-[#0b3d6e] disabled:opacity-40 flex items-center gap-2">
              {generateMut.isPending && <Spin size="w-3.5 h-3.5" />}
              {generateMut.isPending ? 'Generating…' : '🧬 Generate Options'}
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-slate-500">Comparing {variants.length} option{variants.length !== 1 ? 's' : ''} — lowest-penalty first. Publishing writes it into the real timetables and discards the rest.</p>
              <button onClick={() => setRunId(null)} className="text-xs text-[#0C447C] font-medium hover:underline shrink-0 ml-3">← Generate again</button>
            </div>
            <div className="space-y-4">
              {[...(variants as any[])].sort((a, b) => a.score.totalPenalty - b.score.totalPenalty).map(v => (
                <VariantCard key={v._id} variant={v} allTimetables={allTimetables} onPublished={onClose} onDiscarded={() => refetch()} />
              ))}
            </div>
          </>
        )}
      </div>
    </ModalShell>
  );
}

// ─── EXAM TIMETABLING ────────────────────────────────────────────────────────────
// A second scheduler for exam sessions - real calendar dates rather than a
// recurring weekly grid, checked for room/invigilator/class clashes via the
// backend's own overlap engine (ExamService.checkExamConflicts), the same
// pattern as the duty roster above.

function ExamSessionForm({ existing, onDone }: { existing?: any; onDone: () => void }) {
  const qc = useQueryClient();
  const { data: teachers = [] } = useQuery({ queryKey: ['teachers'], queryFn: teachingService.getTeachers });
  const teacherList = teachers as any[];
  const { data: realGrades = [] } = useRealGrades();

  const [examName, setExamName] = useState(existing?.examName ?? '');
  const [subject, setSubject] = useState(existing?.subject ?? '');
  const [date, setDate] = useState(existing?.date ? String(existing.date).slice(0, 10) : '');
  const [startTime, setStartTime] = useState(existing?.startTime ?? '09:00');
  const [endTime, setEndTime] = useState(existing?.endTime ?? '11:00');
  const [room, setRoom] = useState(existing?.roomNo ?? '');
  const [gradeLevel, setGradeLevel] = useState(existing?.groups?.[0]?.gradeLevel ?? '');
  const [sectionName, setSectionName] = useState(existing?.groups?.[0]?.sectionName ?? '');
  const [invigilator, setInvigilator] = useState<any>(
    existing?.invigilators?.[0]?.staffId ? teacherList.find(t => t._id === existing.invigilators[0].staffId) ?? null : null,
  );
  const [notes, setNotes] = useState(existing?.notes ?? '');

  const mut = useMutation({
    mutationFn: (payload: any) => existing
      ? teachingService.updateExam(existing._id, payload)
      : teachingService.createExam(payload),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ['exams'] });
      if (res?.conflicts?.length) toast(`Saved with a conflict: ${res.conflicts[0].message}`, { icon: '⚠️' });
      else toast.success(existing ? 'Exam updated' : 'Exam scheduled');
      onDone();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to save'),
  });

  function handleSave() {
    mut.mutate({
      examName, subject, date, startTime, endTime, roomNo: room, notes,
      groups: gradeLevel && sectionName ? [{ gradeLevel, sectionName }] : [],
      invigilators: invigilator ? [{ staffId: invigilator._id, staffName: `${invigilator.firstName} ${invigilator.lastName}` }] : [],
    });
  }

  const canSave = examName.trim() && subject.trim() && date && !mut.isPending;

  return (
    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className={labelCls}>Exam Name</label>
          <input value={examName} onChange={e => setExamName(e.target.value)} placeholder="e.g. Mid-Term Examination" className={inputCls} />
        </div>
        <div>
          <SubjectDropdown value={subject} onChange={setSubject} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-3">
        <div>
          <label className={labelCls}>Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Start</label>
          <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>End</label>
          <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className={inputCls} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-3">
        <div>
          <label className={labelCls}>Grade</label>
          <select value={gradeLevel} onChange={e => { setGradeLevel(e.target.value); setSectionName(''); }} className={inputCls}>
            <option value="">Select grade…</option>
            {(realGrades as any[]).map((g: any) => <option key={g._id} value={g.name}>{g.name}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Section</label>
          <input value={sectionName} onChange={e => setSectionName(e.target.value)} placeholder="e.g. A" className={inputCls} />
        </div>
        <RoomDropdown value={room} onChange={setRoom} label="Room / Hall" />
      </div>

      <div className="mb-3">
        <TeacherDropdown value={invigilator} onSelect={setInvigilator} />
      </div>

      <div className="mb-3">
        <label className={labelCls}>Notes</label>
        <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes" className={inputCls} />
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onDone} className="px-3 py-1.5 text-xs text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
        <button type="button" onClick={handleSave} disabled={!canSave}
          className="px-3 py-1.5 text-xs font-medium text-white bg-[#0C447C] rounded-lg hover:bg-[#0b3d6e] disabled:opacity-40">
          {mut.isPending ? 'Saving…' : existing ? 'Save Changes' : 'Schedule Exam'}
        </button>
      </div>
    </div>
  );
}

function ExamTimetableModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const { data: exams = [] } = useQuery({ queryKey: ['exams'], queryFn: () => teachingService.getExams() });
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const deleteMut = useMutation({
    mutationFn: (id: string) => teachingService.deleteExam(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['exams'] }); toast.success('Exam removed'); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed'),
  });

  const byDate = useMemo(() => {
    const g: Record<string, any[]> = {};
    for (const e of (exams as any[])) {
      const key = String(e.date).slice(0, 10);
      (g[key] ??= []).push(e);
    }
    return g;
  }, [exams]);

  return (
    <ModalShell title="Exam Timetabling" sub="A second scheduler for exam sessions, checked against the same room/invigilator/class clash rules" onClose={onClose} maxWidth="max-w-2xl">
      <div className="p-6">
        {(showForm || editing) ? (
          <ExamSessionForm existing={editing} onDone={() => { setShowForm(false); setEditing(null); }} />
        ) : (
          <>
            <button onClick={() => setShowForm(true)}
              className="mb-4 px-4 py-2 bg-[#0C447C] text-white text-sm font-medium rounded-lg hover:bg-[#0b3d6e]">
              + Schedule Exam
            </button>
            {(exams as any[]).length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-10">No exams scheduled yet.</p>
            ) : (
              <div className="space-y-4">
                {Object.keys(byDate).sort().map(dateKey => (
                  <div key={dateKey}>
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                      {new Date(dateKey).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                    <div className="space-y-2">
                      {byDate[dateKey].sort((a, b) => a.startTime.localeCompare(b.startTime)).map((exam: any) => (
                        <div key={exam._id} className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                          <div>
                            <div className="font-semibold text-sm text-slate-800">{exam.subject} <span className="text-xs font-normal text-slate-400">({exam.examName})</span></div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              {exam.startTime}–{exam.endTime} · {exam.roomNo || 'No room'}
                              {(exam.groups || []).length > 0 && <span> · {exam.groups.map((g: any) => `${g.gradeLevel} ${g.sectionName}`).join(', ')}</span>}
                              {(exam.invigilators || []).length > 0 && <span> · Invigilator: {exam.invigilators.map((i: any) => i.staffName).join(', ')}</span>}
                            </div>
                          </div>
                          <div className="flex gap-3 shrink-0 ml-3">
                            <button onClick={() => setEditing(exam)} className="text-xs text-[#0C447C] hover:underline">Edit</button>
                            <button onClick={() => deleteMut.mutate(exam._id)} className="text-xs text-red-500 hover:underline">Remove</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </ModalShell>
  );
}

// ─── MAIN TAB ─────────────────────────────────────────────────────────────────

export function TeachingTimetableTab() {
  const qc = useQueryClient();

  // View state
  const [showCreate, setShowCreate]   = useState(false);
  const [showSetup, setShowSetup]     = useState(false);
  const [selectedId, setSelectedId]   = useState<string | null>(null);
  const [viewMode, setViewMode]       = useState<ViewMode>('class');
  const [filterGrade, setFilterGrade] = useState('');
  const { data: realGrades = [] } = useRealGrades();
  const [filterSection, setFilterSection] = useState('');
  const [filterTeacherId, setFilterTeacherId] = useState('');
  const [filterRoom, setFilterRoom]   = useState('');

  // Period edit modal
  const [editCtx, setEditCtx] = useState<{ day: number; periodNo: number } | null>(null);
  // Which alternating week is showing in grid view, for timetables with
  // weekCycleEnabled - defaults to A so there's always a concrete view.
  const [activeWeek, setActiveWeek] = useState<'A' | 'B'>('A');
  const [showElectives, setShowElectives] = useState(false);
  const [showDutyRoster, setShowDutyRoster] = useState(false);
  const [showOptimizer, setShowOptimizer] = useState(false);
  const [showExamTimetable, setShowExamTimetable] = useState(false);

  // Queries
  const { data: timetables = [], isLoading } = useQuery({
    queryKey: ['timetables'],
    queryFn: () => teachingService.getTimetables(),
  });

  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers'],
    queryFn: teachingService.getTeachers,
  });

  const allTimetables = timetables as any[];
  const teacherList   = teachers as any[];

  // Selected timetable (class view)
  const selectedTT = allTimetables.find(tt => tt._id === selectedId);

  // Period times for selected timetable (derive from first period's times, or default)
  const periodTimes = useMemo<PeriodTime[]>(() => {
    if (!selectedTT) return generatePeriodTimes('08:00', 40, 8, 4, 20);
    // Reconstruct from stored period startTime/endTime or generate default
    const stored = Array.from({ length: selectedTT.periodsPerDay ?? 8 }, (_, i) => {
      const pNo = i + 1;
      const p = (selectedTT.periods || []).find((x: any) => x.startTime && x.periodNo === pNo);
      if (p?.startTime) return { periodNo: pNo, startTime: p.startTime, endTime: p.endTime };
      return null;
    });
    if (stored.every(Boolean)) return stored as PeriodTime[];
    return generatePeriodTimes('08:00', 40, selectedTT.periodsPerDay ?? 8, 4, 20);
  }, [selectedTT]);

  // Teacher view: find teacher object matching filterTeacherId
  const filterTeacherObj = teacherList.find(t => t._id === filterTeacherId) ?? null;

  // Sections available for selected grade
  const availableSections = useMemo(() => {
    if (!filterGrade) return [];
    return [...new Set(allTimetables.filter(tt => tt.gradeLevel === filterGrade).map(tt => tt.sectionName))];
  }, [allTimetables, filterGrade]);

  // Conflicts across all timetables
  const globalConflicts = useMemo(() => {
    const seen: Record<string, string> = {};
    const msgs: string[] = [];
    for (const tt of allTimetables) {
      for (const p of tt.periods || []) {
        if (!p.teacherName || !p.teacherId) continue;
        const key = `${p.teacherName}-${p.day}-${p.periodNo}`;
        if (seen[key]) msgs.push(`${p.teacherName} double-booked on ${DAY_NAMES[p.day]} P${p.periodNo} (${seen[key]} & ${tt.gradeLevel} ${tt.sectionName})`);
        else seen[key] = `${tt.gradeLevel} ${tt.sectionName}`;
      }
    }
    return msgs;
  }, [allTimetables]);

  // Status toggle mutation
  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      teachingService.updateTimetable(id, { status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['timetables'] }); toast.success('Status updated'); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed'),
  });

  // Turns the A/B alternating-week cycle on/off for this timetable. Existing
  // periods keep whatever weekCycle they already have ('both' by default),
  // so switching this on doesn't retroactively split anything - it just
  // makes the week toggle and per-period A/B selector available.
  const weekCycleMut = useMutation({
    mutationFn: ({ id, weekCycleEnabled }: { id: string; weekCycleEnabled: boolean }) =>
      teachingService.updateTimetable(id, { weekCycleEnabled }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['timetables'] }); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed'),
  });

  // Branded PDF export - routes through the school's own Report Templates
  // engine (letterhead/logo/colours) instead of the old browser print
  // dialog. That's kept below as a small secondary "quick print" action
  // for when a formatted download isn't necessary.
  const pdfMut = useMutation({
    mutationFn: (tt: any) => teachingService.downloadTimetablePdf(
      tt._id, `timetable-${tt.gradeLevel}-${tt.sectionName}.pdf`, undefined,
      tt.weekCycleEnabled ? activeWeek : undefined,
    ),
    onError: () => toast.error('Failed to generate timetable PDF'),
  });

  // Move-by-drag mutation - swaps two periods (or relocates into an empty
  // slot) without reopening the edit modal. Locked and block periods are
  // filtered out of draggability in TimetableGrid itself; this is the
  // second line of defence in case a stale drag event slips through.
  const moveMut = useMutation({
    mutationFn: (periods: any[]) => teachingService.updateTimetable(selectedTT!._id, { periods }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['timetables'] }); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to move period'),
  });

  function handleMovePeriod(from: { day: number; periodNo: number }, to: { day: number; periodNo: number }) {
    if (!selectedTT || (from.day === to.day && from.periodNo === to.periodNo)) return;
    const list: any[] = selectedTT.periods || [];
    const fromP = list.find(p => p.day === from.day && p.periodNo === from.periodNo);
    if (!fromP) return;
    if (fromP.locked) { toast.error('That period is locked - unlock it first.'); return; }
    if (fromP.blockId) { toast.error("Double periods can't be dragged yet - edit them individually."); return; }
    if (fromP.electiveGroupId) { toast.error('This period belongs to an elective group - edit it from Manage Electives.'); return; }
    if (Array.isArray(fromP.splitGroups) && fromP.splitGroups.length >= 2) { toast.error("Split lessons can't be dragged yet - edit them individually."); return; }
    const toP = list.find(p => p.day === to.day && p.periodNo === to.periodNo);
    if (toP?.locked) { toast.error('The target period is locked.'); return; }
    if (toP?.blockId) { toast.error("Can't drop onto a double period."); return; }
    if (toP?.electiveGroupId) { toast.error("Can't drop onto an elective group period."); return; }

    const fromTime = periodTimes.find(t => t.periodNo === from.periodNo);
    const toTime = periodTimes.find(t => t.periodNo === to.periodNo);
    const movedFrom = { ...fromP, day: to.day, periodNo: to.periodNo, startTime: toTime?.startTime ?? fromP.startTime, endTime: toTime?.endTime ?? fromP.endTime };
    const next = toP
      ? list.map(p => p === fromP ? movedFrom : p === toP ? { ...toP, day: from.day, periodNo: from.periodNo, startTime: fromTime?.startTime ?? toP.startTime, endTime: fromTime?.endTime ?? toP.endTime } : p)
      : list.map(p => p === fromP ? movedFrom : p);
    moveMut.mutate(next);
  }

  // "Regenerate Open Slots" - re-runs the same greedy generator used at
  // creation time, but treats every locked period as a fixed obstacle and
  // only redistributes the unlocked ones. There's no separately-persisted
  // "subject / periods-per-week" plan to regenerate from (the wizard's
  // subject list only ever lived in that modal's own local state), so this
  // reconstructs one from the timetable's own current unlocked periods -
  // grouping by (subject, teacher, room) and counting how many periods
  // each combination already has - then clears and reshuffles just those
  // around whatever's locked, avoiding cross-class teacher conflicts the
  // same way the creation wizard's Auto-Generate does.
  const regenerateMut = useMutation({
    mutationFn: (periods: any[]) => teachingService.updateTimetable(selectedTT!._id, { periods }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['timetables'] }); toast.success('Open slots regenerated'); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to regenerate'),
  });

  function handleRegenerate() {
    if (!selectedTT) return;
    const list: any[] = selectedTT.periods || [];
    // Block (double/triple) periods are structural, the same way a locked
    // period is - the single-period generator has no concept of "these two
    // periods are one lesson" and would otherwise regenerate them as two
    // independent Science periods scattered across different days,
    // silently breaking the block. Elective-group periods are owned by
    // Manage Electives (regenerating here would just get overwritten on
    // the next sync), and a split lesson has no single teacher/room the
    // generator could faithfully reconstruct - both are fixed obstacles too.
    const isFlexible = (p: any) => !p.locked && !p.blockId && !p.electiveGroupId
      && !(Array.isArray(p.splitGroups) && p.splitGroups.length >= 2)
      && p.subject && !['break','assembly','free'].includes(p.type);
    const fixed = list.filter(p => !isFlexible(p));
    const flexible = list.filter(isFlexible);

    // Keyed by weekCycle too, so an 'A'-only Science and a 'B'-only Science
    // (two different subjects worth of periods sharing a slot on alternate
    // weeks) don't get merged into one inflated count.
    const bySubject: Record<string, SubjectSetup & { count: number }> = {};
    for (const p of flexible) {
      const key = `${p.subject}|${p.teacherId || ''}|${p.roomNo || ''}|${p.weekCycle || 'both'}`;
      if (!bySubject[key]) {
        bySubject[key] = { id: key, subject: p.subject, periodsPerWeek: 0, teacherId: p.teacherId || '', teacherName: p.teacherName || '', room: p.roomNo || '', weekCycle: p.weekCycle || 'both' } as any;
      }
      (bySubject[key] as any).count = ((bySubject[key] as any).count || 0) + 1;
    }
    const subjectsSetup: SubjectSetup[] = Object.values(bySubject).map(s => ({ ...s, periodsPerWeek: (s as any).count }));
    if (subjectsSetup.length === 0) { toast.error('Nothing left to regenerate - everything is locked or part of a double period.'); return; }

    const workingDays: number[] = selectedTT.workingDays || DEFAULT_WORKING_DAYS;
    const regenerated = autoGeneratePeriods(subjectsSetup, workingDays, selectedTT.periodsPerDay || 8, periodTimes, allTimetables, selectedTT._id, fixed);
    regenerateMut.mutate([...fixed, ...regenerated]);
  }

  // Duplicate mutation
  const duplicateMut = useMutation({
    mutationFn: (tt: any) => teachingService.createTimetable({
      gradeLevel: tt.gradeLevel,
      sectionName: `${tt.sectionName} (Copy)`,
      academicYearLabel: tt.academicYearLabel || '',
      workingDays: tt.workingDays || DEFAULT_WORKING_DAYS,
      periodsPerDay: tt.periodsPerDay || 8,
      periods: tt.periods || [],
      status: 'draft',
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['timetables'] }); toast.success('Timetable duplicated'); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed'),
  });

  // Filter timetables for list view
  const filteredList = useMemo(() => {
    return allTimetables.filter(tt => {
      if (filterGrade && tt.gradeLevel !== filterGrade) return false;
      if (filterSection && tt.sectionName !== filterSection) return false;
      return true;
    });
  }, [allTimetables, filterGrade, filterSection]);

  // ── GRID VIEW ────────────────────────────────────────────────────────────────

  if (selectedId && selectedTT) {
    return (
      <div>
        {showCreate && <CreateTimetableModal onClose={() => setShowCreate(false)} />}
        {editCtx && (
          <EditPeriodModal
            timetable={selectedTT}
            day={editCtx.day}
            periodNo={editCtx.periodNo}
            periodTime={periodTimes.find(t => t.periodNo === editCtx.periodNo)}
            periodTimes={periodTimes}
            allTimetables={allTimetables}
            onClose={() => setEditCtx(null)}
          />
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <button onClick={() => { setSelectedId(null); setEditCtx(null); }}
              className="px-3 py-1.5 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1">
              ← Back
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{selectedTT.gradeLevel} — Section {selectedTT.sectionName}</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedTT.academicYearLabel || ''} · {(selectedTT.workingDays || DEFAULT_WORKING_DAYS).map((d: number) => DAY_SHORT[d]).join(', ')} · {selectedTT.periodsPerDay || 8} periods/day
              </p>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer mr-1" title="Alternate this timetable between two different weekly schedules (Week A / Week B)">
              <input
                type="checkbox"
                checked={!!selectedTT.weekCycleEnabled}
                onChange={e => weekCycleMut.mutate({ id: selectedTT._id, weekCycleEnabled: e.target.checked })}
                className="w-3.5 h-3.5 rounded border-slate-300 text-[#0C447C] focus:ring-[#0C447C]"
              />
              Week A/B cycle
            </label>
            {selectedTT.weekCycleEnabled && (
              <div className="flex gap-0.5 bg-slate-100 rounded-lg p-1 mr-1">
                {(['A', 'B'] as const).map(w => (
                  <button key={w} onClick={() => setActiveWeek(w)}
                    className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${activeWeek === w ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    Week {w}
                  </button>
                ))}
              </div>
            )}
            <span className={`inline-flex items-center px-2.5 py-1 border rounded-full text-xs font-medium ${STATUS_CLS[selectedTT.status] ?? STATUS_CLS.draft}`}>
              {selectedTT.status}
            </span>
            {selectedTT.status === 'draft' && (
              <button onClick={() => statusMut.mutate({ id: selectedTT._id, status: 'active' })}
                disabled={statusMut.isPending}
                className="px-3 py-1.5 text-xs bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50">
                Activate
              </button>
            )}
            {selectedTT.status === 'active' && (
              <button onClick={() => statusMut.mutate({ id: selectedTT._id, status: 'draft' })}
                disabled={statusMut.isPending}
                className="px-3 py-1.5 text-xs border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50">
                Set Draft
              </button>
            )}
            <button onClick={handleRegenerate} disabled={regenerateMut.isPending}
              title="Keeps locked periods fixed, reshuffles everything else"
              className="px-3 py-1.5 text-xs border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50">
              {regenerateMut.isPending ? 'Regenerating…' : '🔁 Regenerate Open Slots'}
            </button>
            <button onClick={() => pdfMut.mutate(selectedTT)} disabled={pdfMut.isPending}
              className="px-3 py-1.5 text-xs bg-[#0C447C] text-white rounded-lg hover:bg-[#0b3d6e] transition-colors disabled:opacity-50">
              {pdfMut.isPending ? 'Generating…' : '📄 Export PDF'}
            </button>
            <button onClick={() => printTimetable(selectedTT, periodTimes)}
              title="Quick browser print, unbranded"
              className="px-3 py-1.5 text-xs border border-slate-200 text-slate-500 rounded-lg hover:bg-slate-50 transition-colors">
              🖨
            </button>
          </div>
        </div>

        {/* Conflicts in this timetable */}
        {globalConflicts.filter(c => c.includes(`${selectedTT.gradeLevel} ${selectedTT.sectionName}`)).length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
            <div className="font-semibold text-amber-800 text-sm mb-1">⚠ Conflicts in this timetable</div>
            {globalConflicts.map((c, i) => <div key={i} className="text-xs text-amber-700">• {c}</div>)}
          </div>
        )}

        {/* Grid */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <TimetableGrid
            timetable={selectedTT}
            allTimetables={allTimetables}
            periodTimes={periodTimes}
            viewMode="class"
            activeWeek={selectedTT.weekCycleEnabled ? activeWeek : null}
            onCellClick={(day, periodNo) => setEditCtx({ day, periodNo })}
            onMovePeriod={handleMovePeriod}
          />
          <p className="text-xs text-slate-400 mt-3">Drag a period onto another slot to move or swap it. Locked (🔒) and double periods can't be dragged — edit them directly instead.</p>
        </div>

        {/* Period list */}
        {(selectedTT.periods || []).length > 0 && (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm mt-4 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 font-semibold text-sm text-slate-800">
              Period List ({selectedTT.periods.length})
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    {['Day','P#','Time','Type','Subject','Teacher','Room'].map(h => (
                      <th key={h} className="text-left py-2.5 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wide bg-slate-50">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...(selectedTT.periods || [])].sort((a: any, b: any) => a.day - b.day || a.periodNo - b.periodNo).map((p: any, i: number) => (
                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => setEditCtx({ day: p.day, periodNo: p.periodNo })}>
                      <td className="py-2.5 px-4 font-medium text-slate-700">{DAY_NAMES[p.day]}</td>
                      <td className="py-2.5 px-4 text-slate-500">P{p.periodNo}</td>
                      <td className="py-2.5 px-4 text-slate-400 whitespace-nowrap text-xs">{p.startTime || '—'}{p.endTime ? `–${p.endTime}` : ''}</td>
                      <td className="py-2.5 px-4"><span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 capitalize">{p.type || 'regular'}</span></td>
                      <td className="py-2.5 px-4">{p.subject && <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-medium">{p.subject}</span>}</td>
                      <td className="py-2.5 px-4 text-slate-600">{p.teacherName || '—'}</td>
                      <td className="py-2.5 px-4 text-slate-400">{p.roomNo || '—'}</td>
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

  // ── LIST VIEW ────────────────────────────────────────────────────────────────

  return (
    <div>
      {showCreate && (
        <CreateTimetableModal
          onClose={() => setShowCreate(false)}
          onCreated={id => setSelectedId(id)}
        />
      )}
      {showSetup && <RoomsAndPeriodsModal onClose={() => setShowSetup(false)} />}
      {showElectives && <ElectiveGroupsModal allTimetables={allTimetables} onClose={() => setShowElectives(false)} />}
      {showDutyRoster && <DutyRosterModal onClose={() => setShowDutyRoster(false)} />}
      {showOptimizer && <OptimizerModal allTimetables={allTimetables} onClose={() => setShowOptimizer(false)} />}
      {showExamTimetable && <ExamTimetableModal onClose={() => setShowExamTimetable(false)} />}
      {editCtx && selectedTT && (
        <EditPeriodModal
          timetable={selectedTT}
          day={editCtx.day}
          periodNo={editCtx.periodNo}
          periodTime={periodTimes.find(t => t.periodNo === editCtx.periodNo)}
          periodTimes={periodTimes}
          allTimetables={allTimetables}
          onClose={() => setEditCtx(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Timetable Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {allTimetables.length} timetable{allTimetables.length !== 1 ? 's' : ''}
            {globalConflicts.length > 0 && <span className="text-amber-600"> · ⚠ {globalConflicts.length} conflict{globalConflicts.length !== 1 ? 's' : ''}</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowOptimizer(true)}
            className="px-4 py-2 border border-[#0C447C] text-[#0C447C] text-sm font-medium rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-1.5">
            🧬 Optimizer
          </button>
          <button onClick={() => setShowExamTimetable(true)}
            className="px-4 py-2 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5">
            📝 Exams
          </button>
          <button onClick={() => setShowDutyRoster(true)}
            className="px-4 py-2 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5">
            🛡️ Duty Roster
          </button>
          <button onClick={() => setShowElectives(true)}
            className="px-4 py-2 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5">
            🔀 Electives
          </button>
          <button onClick={() => setShowSetup(true)}
            className="px-4 py-2 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5">
            ⚙️ Rooms & Periods
          </button>
          <button onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-[#0C447C] text-white text-sm font-medium rounded-lg hover:bg-[#0b3d6e] transition-colors flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
            New Timetable
          </button>
        </div>
      </div>

      {/* Substitution banner */}
      <SubstitutionBanner timetables={allTimetables} teachers={teacherList} />

      {/* Global conflicts */}
      {globalConflicts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
          <div className="font-semibold text-amber-800 text-sm mb-2">⚠ Schedule Conflicts</div>
          {globalConflicts.map((c, i) => <div key={i} className="text-xs text-amber-700">• {c}</div>)}
        </div>
      )}

      {/* View mode + filters */}
      <div className="flex flex-wrap gap-3 mb-5 items-center">
        {/* View mode toggle */}
        <div className="flex gap-0.5 bg-slate-100 rounded-lg p-1">
          {([
            { id: 'class',   label: '📅 Class View' },
            { id: 'teacher', label: '👨‍🏫 Teacher View' },
            { id: 'room',    label: '🏢 Room View' },
          ] as { id: ViewMode; label: string }[]).map(vm => (
            <button key={vm.id} onClick={() => setViewMode(vm.id)}
              className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${viewMode === vm.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              {vm.label}
            </button>
          ))}
        </div>

        {viewMode === 'class' && (
          <>
            <select value={filterGrade} onChange={e => { setFilterGrade(e.target.value); setFilterSection(''); }}
              className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0C447C]">
              <option value="">All Grades</option>
              {(realGrades as any[]).map((g: any) => <option key={g._id} value={g.name}>{g.name}</option>)}
            </select>
            {filterGrade && (
              <select value={filterSection} onChange={e => setFilterSection(e.target.value)}
                className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0C447C]">
                <option value="">All Sections</option>
                {availableSections.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            )}
          </>
        )}

        {viewMode === 'teacher' && (
          <select value={filterTeacherId} onChange={e => setFilterTeacherId(e.target.value)}
            className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0C447C] min-w-[200px]">
            <option value="">Select teacher…</option>
            {teacherList.map(t => <option key={t._id} value={t._id}>{t.firstName} {t.lastName}</option>)}
          </select>
        )}

        {viewMode === 'room' && (
          <input value={filterRoom} onChange={e => setFilterRoom(e.target.value)}
            placeholder="Enter room (e.g. Room 204)"
            className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C] min-w-[200px]" />
        )}
      </div>

      {/* Teacher / Room view grid */}
      {viewMode !== 'class' && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 mb-5">
          {(viewMode === 'teacher' && !filterTeacherId) ? (
            <div className="py-12 text-center text-slate-400 text-sm">Select a teacher to view their weekly schedule</div>
          ) : (viewMode === 'room' && !filterRoom) ? (
            <div className="py-12 text-center text-slate-400 text-sm">Enter a room to see its weekly occupancy</div>
          ) : (
            <>
              <div className="text-sm font-semibold text-slate-700 mb-4">
                {viewMode === 'teacher' && filterTeacherObj
                  ? `${filterTeacherObj.firstName} ${filterTeacherObj.lastName} — Weekly Schedule`
                  : viewMode === 'room' ? `Room: ${filterRoom}` : ''}
              </div>
              <TimetableGrid
                allTimetables={allTimetables}
                periodTimes={generatePeriodTimes('08:00', 40, 8, 4, 20)}
                viewMode={viewMode}
                filterTeacherId={filterTeacherId}
                filterRoom={filterRoom}
              />
            </>
          )}
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-slate-400 gap-2"><Spin /> Loading timetables…</div>
      ) : allTimetables.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-16 text-center">
          <div className="text-5xl mb-4">📅</div>
          <div className="font-semibold text-slate-700 text-lg mb-1">No timetables yet</div>
          <div className="text-sm text-slate-400 mb-5">Create a timetable for each class and section</div>
          <button onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-[#0C447C] text-white text-sm font-medium rounded-lg hover:bg-[#0b3d6e] transition-colors">
            Create First Timetable
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Grade / Section','Academic Year','Days','Periods/Day','Slots Filled','Status','Actions'].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap bg-slate-50">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredList.map((tt: any) => {
                  const totalSlots = (tt.periodsPerDay || 8) * (tt.workingDays || DEFAULT_WORKING_DAYS).length;
                  const filled = (tt.periods || []).length;
                  const pct = totalSlots > 0 ? Math.round((filled / totalSlots) * 100) : 0;
                  const hasConflict = globalConflicts.some(c => c.includes(`${tt.gradeLevel} ${tt.sectionName}`));
                  return (
                    <tr key={tt._id} className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${hasConflict ? 'bg-amber-50/40' : ''}`}>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{tt.gradeLevel}</div>
                        <div className="text-xs text-slate-400">Section {tt.sectionName}{hasConflict ? ' ⚠' : ''}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-xs">{tt.academicYearLabel || '—'}</td>
                      <td className="py-3 px-4 text-slate-500 text-xs">{(tt.workingDays || DEFAULT_WORKING_DAYS).map((d: number) => DAY_SHORT[d]).join(', ')}</td>
                      <td className="py-3 px-4 text-slate-600">{tt.periodsPerDay || 8}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-700 font-medium text-xs">{filled}/{totalSlots}</span>
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-[#0C447C]" style={{ width: `${pct}%` }}/>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 border rounded-full text-xs font-medium ${STATUS_CLS[tt.status] ?? STATUS_CLS.draft}`}>
                          {tt.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1.5 flex-wrap">
                          <button onClick={() => setSelectedId(tt._id)}
                            className="px-2.5 py-1 text-xs bg-[#0C447C] text-white rounded-lg hover:bg-[#0b3d6e] transition-colors">
                            View Grid
                          </button>
                          {tt.status === 'draft' && (
                            <button onClick={() => statusMut.mutate({ id: tt._id, status: 'active' })}
                              disabled={statusMut.isPending}
                              className="px-2.5 py-1 text-xs bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50">
                              Activate
                            </button>
                          )}
                          {tt.status === 'active' && (
                            <button onClick={() => statusMut.mutate({ id: tt._id, status: 'draft' })}
                              disabled={statusMut.isPending}
                              className="px-2.5 py-1 text-xs border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50">
                              Draft
                            </button>
                          )}
                          <button onClick={() => duplicateMut.mutate(tt)}
                            disabled={duplicateMut.isPending}
                            className="px-2.5 py-1 text-xs border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50">
                            Duplicate
                          </button>
                          <button onClick={() => printTimetable(tt, generatePeriodTimes('08:00', 40, tt.periodsPerDay ?? 8, 4, 20))}
                            className="px-2.5 py-1 text-xs border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors">
                            🖨
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
