// Single source of truth for "what academic year is it right now" on the
// client. TopBar.tsx is responsible for keeping localStorage's
// 'academicYear' key in sync with whichever AcademicYear the backend has
// marked isCurrent (see its self-heal effect + switchYear mutation) - this
// helper is just the one place that READS it, so a request that fires
// before TopBar has resolved (or a tenant with no AcademicYear marked
// current yet) all land on the same computed fallback instead of each
// call site freezing its own hardcoded year literal (that bug recurred
// independently across ~20 files/lines before this helper existed - see
// the PR that introduced this file).
//
// The fallback is computed from today's date under this app's convention
// (confirmed via AcademicYearsTab/Institution Setup - a school year runs
// July -> June, named "YYYY-YY"), not a frozen literal - so it's never
// more than a few months out of date even when localStorage genuinely has
// nothing yet, and it ages correctly on its own without another manual
// per-year edit anywhere.
export function computeFallbackAcademicYear(d: Date = new Date()): string {
  const year = d.getMonth() >= 6 /* July */ ? d.getFullYear() : d.getFullYear() - 1;
  const endYY = String((year + 1) % 100).padStart(2, '0');
  return `${year}-${endYY}`;
}

export function getCurrentAcademicYear(): string {
  const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('academicYear') : null;
  return stored || computeFallbackAcademicYear();
}

// A rolling "YYYY-YY" window centered on the real current academic year, for
// a picklist that needs a few adjacent years (e.g. selecting which year a
// Budget belongs to) but has no live Academic Years list handy to pull
// options from - ages on its own instead of going stale the way a frozen
// literal triplet does.
export function academicYearWindow(before = 1, after = 1): string[] {
  const current = getCurrentAcademicYear();
  const startYear = parseInt(current.slice(0, 4), 10);
  if (Number.isNaN(startYear)) return [current];
  const years: string[] = [];
  for (let offset = -before; offset <= after; offset++) {
    const y = startYear + offset;
    years.push(`${y}-${String((y + 1) % 100).padStart(2, '0')}`);
  }
  return years;
}
