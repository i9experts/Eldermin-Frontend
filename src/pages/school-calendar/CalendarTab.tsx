import React, { useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { GradeCheckboxGrid } from '../teaching/tabs/shared';
import { useCampuses } from '../../hooks/useOrganization';
import {
  Card, Btn, Modal, FormField, FInput, FTextarea, FSelect, EmptyState,
  CALENDAR_EVENT_TYPES, CALENDAR_EVENT_COLORS,
} from './shared';
import {
  useCalendarEvents, useCreateCalendarEvent, useUpdateCalendarEvent, useDeleteCalendarEvent,
} from './hooks';
import schoolCalendarApi from './api';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function toISODate(d: Date) { return d.toISOString().slice(0, 10); }

const emptyForm = {
  title: '', description: '', type: 'event', color: '', startDate: '', endDate: '',
  campusId: '', gradeLevels: [] as string[],
};

function EventFormModal({ event, defaultDate, onClose }: { event?: any; defaultDate?: string; onClose: () => void }) {
  const isEdit = !!event;
  const { data: campuses } = useCampuses();
  const [form, setForm] = useState<any>(isEdit ? {
    title: event.title, description: event.description || '', type: event.type, color: event.color || '',
    startDate: toISODate(new Date(event.startDate)), endDate: toISODate(new Date(event.endDate)),
    campusId: event.campusId || '', gradeLevels: event.gradeLevels || [],
  } : { ...emptyForm, startDate: defaultDate || toISODate(new Date()), endDate: defaultDate || toISODate(new Date()) });

  const createMut = useCreateCalendarEvent();
  const updateMut = useUpdateCalendarEvent();
  const mut = isEdit ? updateMut : createMut;

  const submit = () => {
    const payload: any = { ...form, campusId: form.campusId || null };
    if (!payload.color) delete payload.color;
    if (isEdit) {
      updateMut.mutate({ id: event._id, data: payload }, {
        onSuccess: () => { toast.success('Event updated'); onClose(); },
        onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to update event'),
      });
    } else {
      createMut.mutate(payload, {
        onSuccess: () => { toast.success('Event added to calendar'); onClose(); },
        onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to add event'),
      });
    }
  };

  const canSubmit = form.title.trim() && form.type && form.startDate;

  return (
    <Modal
      title={isEdit ? 'Edit Event' : 'Add Calendar Event'}
      onClose={onClose}
      wide
      footer={<>
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" onClick={submit} disabled={!canSubmit || mut.isPending}>
          {mut.isPending ? (isEdit ? 'Saving…' : 'Adding…') : (isEdit ? 'Save Changes' : 'Add Event')}
        </Btn>
      </>}
    >
      <FormField label="Title" required>
        <FInput value={form.title} onChange={e => setForm((p: any) => ({ ...p, title: e.target.value }))} />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Type" required>
          <FSelect value={form.type} onChange={e => setForm((p: any) => ({ ...p, type: e.target.value }))}>
            {CALENDAR_EVENT_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
          </FSelect>
        </FormField>
        <FormField label="Color">
          <div className="flex items-center gap-2">
            <input type="color" value={form.color || CALENDAR_EVENT_COLORS[form.type] || '#0C447C'}
              onChange={e => setForm((p: any) => ({ ...p, color: e.target.value }))}
              className="w-10 h-9 rounded border border-slate-200 cursor-pointer" />
            <span className="text-xs text-slate-400">Defaults to the type's color</span>
          </div>
        </FormField>
        <FormField label="Start Date" required>
          <FInput type="date" value={form.startDate} onChange={e => setForm((p: any) => ({ ...p, startDate: e.target.value }))} />
        </FormField>
        <FormField label="End Date">
          <FInput type="date" value={form.endDate} min={form.startDate} onChange={e => setForm((p: any) => ({ ...p, endDate: e.target.value }))} />
        </FormField>
        <FormField label="Campus">
          <FSelect value={form.campusId} onChange={e => setForm((p: any) => ({ ...p, campusId: e.target.value }))}>
            <option value="">All Campuses</option>
            {(campuses as any[] ?? []).map((c: any) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </FSelect>
        </FormField>
      </div>
      <FormField label="Grade Levels (leave blank for all grades)">
        <GradeCheckboxGrid selected={form.gradeLevels} onChange={(v: string[]) => setForm((p: any) => ({ ...p, gradeLevels: v }))} />
      </FormField>
      <FormField label="Description">
        <FTextarea rows={2} value={form.description} onChange={e => setForm((p: any) => ({ ...p, description: e.target.value }))} />
      </FormField>
    </Modal>
  );
}

function DayDetailModal({ date, events, onClose, onEdit, onAdd }: { date: string; events: any[]; onClose: () => void; onEdit: (e: any) => void; onAdd: () => void }) {
  const deleteMut = useDeleteCalendarEvent();
  return (
    <Modal title={new Date(date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} onClose={onClose}
      footer={<Btn variant="primary" onClick={onAdd}>+ Add Event on This Day</Btn>}>
      {events.length === 0 ? (
        <div className="text-sm text-slate-400 text-center py-4">No events on this day.</div>
      ) : (
        <div className="space-y-2">
          {events.map((e: any) => (
            <div key={e._id} className="flex items-start gap-3 p-3 rounded-lg border border-slate-100">
              <div className="w-2.5 h-2.5 rounded-full mt-1 shrink-0" style={{ background: e.color }} />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-slate-800">{e.title}</div>
                <div className="text-xs text-slate-400 capitalize">{e.type.replace(/_/g, ' ')}{e.source === 'finance' ? ' · synced from Finance' : ''}</div>
                {e.description && <div className="text-xs text-slate-500 mt-1">{e.description}</div>}
              </div>
              {e.source !== 'finance' && (
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => onEdit(e)} className="text-xs text-[#0C447C] hover:underline">Edit</button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete "${e.title}"?`)) {
                        deleteMut.mutate(e._id, { onSuccess: () => toast.success('Event deleted') });
                      }
                    }}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

export default function CalendarTab() {
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const [showAdd, setShowAdd] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [dayDetail, setDayDetail] = useState<string | null>(null);
  const [printing, setPrinting] = useState(false);

  const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
  const gridStart = new Date(monthStart);
  gridStart.setDate(gridStart.getDate() - gridStart.getDay());
  const gridEnd = new Date(monthEnd);
  gridEnd.setDate(gridEnd.getDate() + (6 - gridEnd.getDay()));

  const { data: events, isLoading } = useCalendarEvents({ from: toISODate(gridStart), to: toISODate(gridEnd) });

  const eventsByDay = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const e of (events as any[]) ?? []) {
      const start = new Date(e.startDate);
      const end = new Date(e.endDate);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const key = toISODate(d);
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(e);
      }
    }
    return map;
  }, [events]);

  const days: Date[] = [];
  for (let d = new Date(gridStart); d <= gridEnd; d.setDate(d.getDate() + 1)) days.push(new Date(d));

  const today = toISODate(new Date());

  const printYearlyCalendar = async () => {
    setPrinting(true);
    try {
      const year = cursor.getFullYear();
      const resp = await schoolCalendarApi.getEvents({ from: `${year}-01-01`, to: `${year}-12-31` });
      openYearlyPrintWindow(year, resp as any[]);
    } catch {
      toast.error('Failed to load events for printing');
    } finally {
      setPrinting(false);
    }
  };

  return (
    <div className="space-y-4">
      {showAdd !== null && <EventFormModal defaultDate={showAdd} onClose={() => setShowAdd(null)} />}
      {editingEvent && <EventFormModal event={editingEvent} onClose={() => setEditingEvent(null)} />}
      {dayDetail && (
        <DayDetailModal
          date={dayDetail}
          events={eventsByDay.get(dayDetail) ?? []}
          onClose={() => setDayDetail(null)}
          onEdit={(e) => { setDayDetail(null); setEditingEvent(e); }}
          onAdd={() => { setShowAdd(dayDetail); setDayDetail(null); }}
        />
      )}

      <Card>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <Btn size="sm" variant="secondary" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>‹</Btn>
            <div className="font-semibold text-slate-800 w-40 text-center">{MONTH_NAMES[cursor.getMonth()]} {cursor.getFullYear()}</div>
            <Btn size="sm" variant="secondary" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>›</Btn>
            <Btn size="sm" variant="secondary" onClick={() => { const d = new Date(); d.setDate(1); setCursor(d); }}>Today</Btn>
          </div>
          <div className="flex items-center gap-2">
            <Btn size="sm" variant="secondary" onClick={printYearlyCalendar} disabled={printing}>
              {printing ? 'Loading…' : '🖨 Print Yearly Calendar'}
            </Btn>
            <Btn size="sm" variant="primary" onClick={() => setShowAdd(toISODate(new Date()))}>+ Add Event</Btn>
          </div>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-7 gap-px bg-slate-100 rounded-lg overflow-hidden">
            {WEEKDAYS.map(w => (
              <div key={w} className="bg-slate-50 text-center text-xs font-semibold text-slate-500 py-2">{w}</div>
            ))}
            {days.map((d) => {
              const key = toISODate(d);
              const dayEvents = eventsByDay.get(key) ?? [];
              const inMonth = d.getMonth() === cursor.getMonth();
              return (
                <button
                  key={key}
                  onClick={() => setDayDetail(key)}
                  className={`bg-white min-h-[92px] p-1.5 text-left hover:bg-slate-50 transition-colors ${!inMonth ? 'opacity-40' : ''}`}
                >
                  <div className={`text-xs font-medium mb-1 ${key === today ? 'inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#0C447C] text-white' : 'text-slate-600'}`}>
                    {d.getDate()}
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 3).map((e: any) => (
                      <div key={e._id} className="text-[10px] px-1 py-0.5 rounded truncate text-white" style={{ background: e.color }} title={e.title}>
                        {e.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && <div className="text-[10px] text-slate-400">+{dayEvents.length - 3} more</div>}
                  </div>
                </button>
              );
            })}
          </div>
          {isLoading && <div className="text-center text-slate-400 py-4 text-sm">Loading…</div>}
        </div>

        <div className="flex flex-wrap gap-3 px-5 py-3 border-t border-slate-100">
          {Object.entries(CALENDAR_EVENT_COLORS).map(([type, color]) => (
            <div key={type} className="flex items-center gap-1.5 text-xs text-slate-500 capitalize">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
              {type.replace(/_/g, ' ')}
            </div>
          ))}
        </div>
      </Card>

      {(!events || (events as any[]).length === 0) && !isLoading && (
        <EmptyState title="No events this month" action={<Btn variant="primary" onClick={() => setShowAdd(toISODate(new Date()))}>+ Add Event</Btn>} />
      )}
    </div>
  );
}

function openYearlyPrintWindow(year: number, events: any[]) {
  const byMonth: any[][] = Array.from({ length: 12 }, () => []);
  for (const e of events) {
    const d = new Date(e.startDate);
    if (d.getFullYear() === year) byMonth[d.getMonth()].push(e);
  }

  const monthHtml = MONTH_NAMES.map((name, i) => {
    const first = new Date(year, i, 1);
    const gridStart = new Date(first);
    gridStart.setDate(gridStart.getDate() - gridStart.getDay());
    const cells: string[] = [];
    const monthEvents = new Map<string, any[]>();
    for (const e of byMonth[i]) {
      const start = new Date(e.startDate);
      const end = new Date(e.endDate);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const key = toISODate(d);
        if (!monthEvents.has(key)) monthEvents.set(key, []);
        monthEvents.get(key)!.push(e);
      }
    }
    for (let d = new Date(gridStart), n = 0; n < 42; d.setDate(d.getDate() + 1), n++) {
      const inMonth = d.getMonth() === i;
      const key = toISODate(d);
      const dots = (monthEvents.get(key) ?? []).slice(0, 3).map((e: any) => `<span class="dot" style="background:${e.color}"></span>`).join('');
      cells.push(`<td class="${inMonth ? '' : 'muted'}"><div class="daynum">${d.getDate()}</div><div class="dots">${dots}</div></td>`);
    }
    let rows = '';
    for (let r = 0; r < 6; r++) rows += `<tr>${cells.slice(r * 7, r * 7 + 7).join('')}</tr>`;
    return `<div class="month"><div class="month-title">${name}</div><table><thead><tr>${WEEKDAYS.map(w => `<th>${w[0]}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div>`;
  }).join('');

  const legend = Object.entries(CALENDAR_EVENT_COLORS).map(([type, color]) =>
    `<span class="legend-item"><span class="dot" style="background:${color}"></span>${type.replace(/_/g, ' ')}</span>`).join('');

  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(`<!doctype html><html><head><title>${year} Academic Calendar</title><style>
    @page { size: A3 landscape; margin: 10mm; }
    * { box-sizing: border-box; }
    body { font-family: -apple-system, Arial, sans-serif; margin: 0; }
    h1 { text-align: center; font-size: 20px; margin: 0 0 10px; }
    .legend { text-align: center; margin-bottom: 10px; font-size: 10px; }
    .legend-item { display: inline-flex; align-items: center; gap: 4px; margin: 0 8px; text-transform: capitalize; }
    .dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6mm; }
    .month { border: 1px solid #ddd; border-radius: 4px; padding: 3mm; break-inside: avoid; }
    .month-title { font-weight: 700; font-size: 11px; text-align: center; margin-bottom: 2mm; }
    table { width: 100%; border-collapse: collapse; }
    th { font-size: 7px; color: #888; font-weight: 500; }
    td { width: 14.28%; height: 11mm; vertical-align: top; border: 0.5px solid #f0f0f0; padding: 1px; }
    td.muted { opacity: 0.3; }
    .daynum { font-size: 7px; color: #555; }
    .dots { display: flex; gap: 1px; flex-wrap: wrap; }
  </style></head><body>
    <h1>${year} Academic Calendar</h1>
    <div class="legend">${legend}</div>
    <div class="grid">${monthHtml}</div>
    <script>window.onload = () => { window.print(); };</script>
  </body></html>`);
  win.document.close();
}
