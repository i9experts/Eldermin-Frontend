import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

function checkTeacherConflict(
  teacherId: string, day: number, periodNo: number,
  excludeId: string, allTimetables: any[],
): { conflict: boolean; ttLabel?: string; subject?: string } {
  if (!teacherId) return { conflict: false };
  for (const tt of allTimetables) {
    if (tt._id === excludeId) continue;
    const hit = (tt.periods || []).find(
      (p: any) => p.day === day && p.periodNo === periodNo && p.teacherId === teacherId,
    );
    if (hit) return { conflict: true, ttLabel: `${tt.gradeLevel} ${tt.sectionName}`, subject: hit.subject };
  }
  return { conflict: false };
}

function autoGeneratePeriods(
  subjects: SubjectSetup[], workingDays: number[],
  periodsPerDay: number, periodTimes: PeriodTime[],
): any[] {
  const grid: Record<string, SubjectSetup | null> = {};
  const teacherSlots: Record<string, boolean> = {};
  const periods: any[] = [];
  for (const d of workingDays) for (let p = 1; p <= periodsPerDay; p++) grid[`${d}-${p}`] = null;

  const sorted = subjects.filter(s => s.subject && s.periodsPerWeek > 0)
    .sort((a, b) => b.periodsPerWeek - a.periodsPerWeek);

  for (const subj of sorted) {
    let rem = subj.periodsPerWeek;
    // First pass: one per day spread
    for (const day of workingDays) {
      if (rem === 0) break;
      for (let p = 1; p <= periodsPerDay; p++) {
        if (grid[`${day}-${p}`] !== null) continue;
        if (subj.teacherId && teacherSlots[`${subj.teacherId}-${day}-${p}`]) continue;
        grid[`${day}-${p}`] = subj;
        if (subj.teacherId) teacherSlots[`${subj.teacherId}-${day}-${p}`] = true;
        const pt = periodTimes.find(t => t.periodNo === p) ?? { startTime: '', endTime: '' };
        periods.push({ day, periodNo: p, startTime: pt.startTime, endTime: pt.endTime,
          subject: subj.subject, teacherId: subj.teacherId || null,
          teacherName: subj.teacherName || '', roomNo: subj.room || '', type: 'regular' });
        rem--; break;
      }
    }
    // Second pass: fill remaining anywhere
    outer: while (rem > 0) {
      for (const day of workingDays) {
        for (let p = 1; p <= periodsPerDay; p++) {
          if (grid[`${day}-${p}`] !== null) continue;
          if (subj.teacherId && teacherSlots[`${subj.teacherId}-${day}-${p}`]) continue;
          grid[`${day}-${p}`] = subj;
          if (subj.teacherId) teacherSlots[`${subj.teacherId}-${day}-${p}`] = true;
          const pt = periodTimes.find(t => t.periodNo === p) ?? { startTime: '', endTime: '' };
          periods.push({ day, periodNo: p, startTime: pt.startTime, endTime: pt.endTime,
            subject: subj.subject, teacherId: subj.teacherId || null,
            teacherName: subj.teacherName || '', roomNo: subj.room || '', type: 'regular' });
          rem--; if (rem === 0) break outer;
        }
      }
      break; // no more slots
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
}: {
  period: any; gradeLabel?: string; showGrade?: boolean;
  conflict?: boolean; onClick?: () => void;
}) {
  if (!period) {
    return (
      <div
        onClick={onClick}
        className="rounded-lg border border-dashed border-slate-200 flex items-center justify-center cursor-pointer hover:border-[#0C447C] hover:bg-blue-50 transition-colors"
        style={{ minHeight: 64 }}
      >
        <span className="text-slate-300 text-xs">＋</span>
      </div>
    );
  }

  const style = getSubjectStyle(period.subject || '', period.type || 'regular');
  const isSpecial = ['break','free','assembly'].includes(period.type);

  return (
    <div
      onClick={onClick}
      style={{ background: conflict ? '#FEF2F2' : style.bg, borderColor: conflict ? '#FECACA' : style.border, minHeight: 64 }}
      className={`rounded-lg border p-2 cursor-pointer hover:opacity-90 transition-opacity flex flex-col justify-center ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
    >
      {conflict && <div className="text-xs font-bold text-red-600 mb-0.5">⚠ Conflict</div>}
      {isSpecial ? (
        <div className="text-center text-xs italic" style={{ color: style.color }}>
          {PERIOD_TYPES.find(t => t.id === period.type)?.icon} {period.label || period.type}
        </div>
      ) : (
        <>
          <div className="text-xs font-semibold truncate" style={{ color: style.color }}>
            {period.subject || '—'}
          </div>
          {showGrade && gradeLabel && (
            <div className="text-xs text-slate-500 truncate">{gradeLabel}</div>
          )}
          {period.teacherName && !showGrade && (
            <div className="text-xs text-slate-500 truncate">{period.teacherName}</div>
          )}
          {period.roomNo && (
            <div className="text-xs text-slate-400 truncate">{period.roomNo}</div>
          )}
        </>
      )}
    </div>
  );
}

// ─── TIMETABLE GRID ───────────────────────────────────────────────────────────

function TimetableGrid({
  timetable, allTimetables, periodTimes,
  viewMode = 'class', filterTeacherId = '', filterRoom = '',
  onCellClick,
}: {
  timetable?: any; allTimetables: any[]; periodTimes: PeriodTime[];
  viewMode?: ViewMode; filterTeacherId?: string; filterRoom?: string;
  onCellClick?: (day: number, periodNo: number) => void;
}) {
  const workingDays: number[] = timetable?.workingDays ?? DEFAULT_WORKING_DAYS;
  const periodsPerDay: number = timetable?.periodsPerDay ?? 8;

  // Compute display periods based on view mode
  const displayGrid = useMemo<Record<string, any>>(() => {
    const g: Record<string, any> = {};
    if (viewMode === 'class' && timetable) {
      for (const p of timetable.periods || []) {
        g[`${p.day}-${p.periodNo}`] = p;
      }
    } else if (viewMode === 'teacher' && filterTeacherId) {
      for (const tt of allTimetables) {
        for (const p of tt.periods || []) {
          if (p.teacherId === filterTeacherId) {
            const key = `${p.day}-${p.periodNo}`;
            g[key] = { ...p, gradeLabel: `${tt.gradeLevel} ${tt.sectionName}` };
          }
        }
      }
    } else if (viewMode === 'room' && filterRoom) {
      for (const tt of allTimetables) {
        for (const p of tt.periods || []) {
          if ((p.roomNo || '').toLowerCase() === filterRoom.toLowerCase()) {
            const key = `${p.day}-${p.periodNo}`;
            g[key] = { ...p, gradeLabel: `${tt.gradeLevel} ${tt.sectionName}` };
          }
        }
      }
    }
    return g;
  }, [timetable, allTimetables, viewMode, filterTeacherId, filterRoom]);

  // Detect teacher conflicts within current timetable (class view)
  const conflictKeys = useMemo<Set<string>>(() => {
    const s = new Set<string>();
    if (viewMode !== 'class' || !timetable) return s;
    for (const p of timetable.periods || []) {
      if (!p.teacherId) continue;
      const { conflict } = checkTeacherConflict(p.teacherId, p.day, p.periodNo, timetable._id, allTimetables);
      if (conflict) s.add(`${p.day}-${p.periodNo}`);
    }
    return s;
  }, [timetable, allTimetables, viewMode]);

  return (
    <div className="overflow-x-auto">
      <div style={{ display: 'grid', gridTemplateColumns: `90px repeat(${workingDays.length}, 1fr)`, gap: 4, minWidth: 560 }}>
        {/* Header */}
        <div className="bg-slate-50 rounded-lg flex items-center justify-center text-xs font-semibold text-slate-400 uppercase tracking-wide py-2">
          Period
        </div>
        {workingDays.map(d => (
          <div key={d} className="bg-[#0C447C] text-white rounded-lg py-2 text-center text-xs font-semibold">
            {DAY_NAMES[d]}
          </div>
        ))}

        {/* Rows */}
        {Array.from({ length: periodsPerDay }, (_, i) => {
          const pNo = i + 1;
          const pt = periodTimes.find(t => t.periodNo === pNo);
          return (
            <>
              <div key={`lbl-${pNo}`} className="bg-slate-50 rounded-lg flex flex-col items-center justify-center text-center py-2" style={{ minHeight: 64 }}>
                <div className="text-xs font-bold text-slate-600">P{pNo}</div>
                {pt && <div className="text-xs text-slate-400 mt-0.5">{pt.startTime}</div>}
                {pt && <div className="text-xs text-slate-400">{pt.endTime}</div>}
              </div>
              {workingDays.map(d => {
                const key = `${d}-${pNo}`;
                const period = displayGrid[key];
                const conflict = conflictKeys.has(key);
                return (
                  <PeriodCell
                    key={key}
                    period={period}
                    gradeLabel={period?.gradeLabel}
                    showGrade={viewMode !== 'class'}
                    conflict={conflict}
                    onClick={onCellClick ? () => onCellClick(d, pNo) : undefined}
                  />
                );
              })}
            </>
          );
        })}
      </div>
    </div>
  );
}

// ─── EDIT PERIOD MODAL ────────────────────────────────────────────────────────

function EditPeriodModal({
  timetable, day, periodNo, periodTime, allTimetables, onClose,
}: {
  timetable: any; day: number; periodNo: number;
  periodTime?: PeriodTime; allTimetables: any[]; onClose: () => void;
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

  // Sync teacher object after teachers load
  useEffect(() => {
    if (existing?.teacherId && !selectedTeacher) {
      const found = teacherList.find(t => t._id === existing.teacherId);
      if (found) setSelectedTeacher(found);
    }
  }, [teacherList.length]);

  const conflict = useMemo(() => {
    if (!selectedTeacher) return { conflict: false };
    return checkTeacherConflict(selectedTeacher._id, day, periodNo, timetable._id, allTimetables);
  }, [selectedTeacher, day, periodNo, timetable._id, allTimetables]);

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
    const others = (timetable.periods || []).filter(
      (p: any) => !(p.day === day && p.periodNo === periodNo),
    );
    const isSpecial = ['break','assembly','free'].includes(type);
    const newPeriod: any = {
      day, periodNo,
      startTime: periodTime?.startTime ?? '',
      endTime: periodTime?.endTime ?? '',
      type,
      ...(isSpecial
        ? { label: label || type }
        : {
            subject,
            teacherId: selectedTeacher?._id ?? null,
            teacherName: selectedTeacher ? `${selectedTeacher.firstName} ${selectedTeacher.lastName}` : '',
            roomNo: room,
            notes,
          }),
    };
    mut.mutate([...others, newPeriod]);
  }

  function handleClear() {
    const others = (timetable.periods || []).filter(
      (p: any) => !(p.day === day && p.periodNo === periodNo),
    );
    mut.mutate(others);
  }

  const isSpecial = ['break','assembly','free'].includes(type);
  const canSave = isSpecial || subject.trim() || !mut.isPending;
  const hasConflict = conflict.conflict && !overrideConflict;

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
            </FormSection>

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
          </>
        )}

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
      ? autoGeneratePeriods(subjects.filter(s => s.subject), setup.workingDays, setup.periodsPerDay, periodTimes)
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
          <div className="flex gap-2">
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
            <button onClick={() => printTimetable(selectedTT, periodTimes)}
              className="px-3 py-1.5 text-xs border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors">
              🖨 Export PDF
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
            onCellClick={(day, periodNo) => setEditCtx({ day, periodNo })}
          />
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
      {editCtx && selectedTT && (
        <EditPeriodModal
          timetable={selectedTT}
          day={editCtx.day}
          periodNo={editCtx.periodNo}
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
