// Gregorian -> Hijri (Islamic lunar calendar) conversion, mirroring
// eldermin-backend's src/common/utils/hijri-date.util.ts. Opt-in per school
// via School.showHijriDates (Institution > Preferences) - off by default.
// Uses the tabular ("Kuwaiti algorithm") civil Hijri calendar, a reference
// date rather than a moon-sighting ruling; School.hijriDayAdjustment lets a
// school nudge it by a day or two if their local calendar runs differently.

const HIJRI_MONTHS = [
  'Muharram', 'Safar', "Rabi' al-Awwal", "Rabi' al-Thani",
  'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', "Sha'ban",
  'Ramadan', 'Shawwal', "Dhu al-Qi'dah", 'Dhu al-Hijjah',
];

export interface HijriDate {
  year: number;
  month: number; // 1-12
  day: number;
  monthName: string;
}

export function toHijri(date: Date, dayAdjustment = 0): HijriDate {
  const adjusted = new Date(date.getTime() + dayAdjustment * 86400000);
  const y = adjusted.getUTCFullYear();
  const m = adjusted.getUTCMonth() + 1;
  const d = adjusted.getUTCDate();
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  const jdn = d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4)
    - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;

  const l1 = jdn - 1948440 + 10632;
  const n = Math.floor((l1 - 1) / 10631);
  const l2 = l1 - 10631 * n + 354;
  const j = Math.floor((10985 - l2) / 5316) * Math.floor((50 * l2) / 17719)
    + Math.floor(l2 / 5670) * Math.floor((43 * l2) / 15238);
  const l3 = l2 - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50)
    - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
  const month = Math.floor((24 * l3) / 709);
  const day = l3 - Math.floor((709 * month) / 24);
  const year = 30 * n + j - 30;

  return { year, month, day, monthName: HIJRI_MONTHS[month - 1] };
}

/** "9 Rabi' al-Awwal 1448 AH" style reference string. */
export function formatHijri(date: Date | string | number | null | undefined, dayAdjustment = 0): string {
  if (date === null || date === undefined || date === '') return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const h = toHijri(d, dayAdjustment);
  return `${h.day} ${h.monthName} ${h.year} AH`;
}
