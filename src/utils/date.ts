// Shared date-display helper, driven by the school's configured dateFormat
// preference (Institution > Preferences - see School.dateFormat on the
// backend). Day-first ('DD/MM/YYYY') is the Pakistani/most-of-the-world
// default; 'MM/DD/YYYY' is offered for schools that want the US convention.
// Call sites should use this instead of a bare `.toLocaleDateString()`,
// whose output otherwise silently depends on the browser's own locale.

export type DateFormatPreference = 'DD/MM/YYYY' | 'MM/DD/YYYY';

const STORAGE_KEY = 'eldermin_date_format';

/** Cheap, synchronous read for call sites that can't use the useDateFormat()
 * hook (plain functions, outside a component). Falls back to day-first.
 * Kept in sync by useDateFormat() below whenever the school profile loads. */
export function getCachedDateFormat(): DateFormatPreference {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === 'MM/DD/YYYY' ? 'MM/DD/YYYY' : 'DD/MM/YYYY';
  } catch {
    return 'DD/MM/YYYY';
  }
}

export function setCachedDateFormat(pref?: string) {
  try {
    localStorage.setItem(STORAGE_KEY, pref === 'MM/DD/YYYY' ? 'MM/DD/YYYY' : 'DD/MM/YYYY');
  } catch { /* storage unavailable (private mode, etc.) - formatDate() just falls back to the default */ }
}

/** Numeric, slash-separated date, e.g. "02/10/2026" (day-first) or "10/02/2026" (month-first). */
export function formatDate(date: Date | string | number | null | undefined, pref?: DateFormatPreference): string {
  if (date === null || date === undefined || date === '') return '—';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';
  const preference = pref || getCachedDateFormat();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return preference === 'MM/DD/YYYY' ? `${month}/${day}/${year}` : `${day}/${month}/${year}`;
}

/** Month-abbreviated date, e.g. "02 Oct 2026" or "Oct 02, 2026". */
export function formatDateShort(date: Date | string | number | null | undefined, pref?: DateFormatPreference): string {
  if (date === null || date === undefined || date === '') return '—';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';
  const preference = pref || getCachedDateFormat();
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const day = String(d.getDate()).padStart(2, '0');
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return preference === 'MM/DD/YYYY' ? `${month} ${day}, ${year}` : `${day} ${month} ${year}`;
}

/** Date + time, e.g. "02/10/2026, 4:35 PM". */
export function formatDateTime(date: Date | string | number | null | undefined, pref?: DateFormatPreference): string {
  if (date === null || date === undefined || date === '') return '—';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${formatDate(d, pref)}, ${time}`;
}
