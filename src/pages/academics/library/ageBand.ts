// Client-side mirror of eldermin-backend's library-age-band.util.ts age-band
// mapping, so the catalogue form can show a live colour-dot preview as a
// librarian ticks gradeLevels, without a round trip. Keep this logic in
// sync with the backend util if either changes - the backend util is the
// source of truth since it's what actually gets stored/reported on.

export type AgeBandId = 'early_years' | 'lower_primary' | 'upper_primary' | 'middle' | 'secondary' | 'reference';

const EARLY_YEARS_WORDS = /\b(play\s*group|pre[-\s]?nursery|nursery|prep|montessori|kg\b|kindergarten|early\s*years)\b/i;
const SECONDARY_WORDS = /\b(o[-\s]?level|a[-\s]?level|matric|ssc|hssc|intermediate|college)\b/i;
const TRAILING_NUMBER = /(\d{1,2})\s*$/;

function classNumberToBand(n: number): AgeBandId {
  if (n <= 2) return 'lower_primary';
  if (n <= 5) return 'upper_primary';
  if (n <= 8) return 'middle';
  return 'secondary';
}

export function inferBandForGradeLevel(gradeLevel: string): AgeBandId | null {
  const g = (gradeLevel || '').trim();
  if (!g) return null;
  if (EARLY_YEARS_WORDS.test(g)) return 'early_years';
  if (SECONDARY_WORDS.test(g)) return 'secondary';
  const m = g.match(TRAILING_NUMBER);
  if (m) return classNumberToBand(parseInt(m[1], 10));
  return null;
}

export interface AgeBandResult {
  bands: AgeBandId[];
  dominant: AgeBandId | 'mixed' | 'unclassified';
}

export function inferAgeBands(gradeLevels: string[] = [], isReferenceOnly = false): AgeBandResult {
  if (isReferenceOnly) return { bands: ['reference'], dominant: 'reference' };
  const bands = Array.from(new Set(
    (gradeLevels || []).map(inferBandForGradeLevel).filter((b): b is AgeBandId => !!b),
  ));
  if (bands.length === 0) return { bands: [], dominant: 'unclassified' };
  if (bands.length === 1) return { bands, dominant: bands[0] };
  return { bands, dominant: 'mixed' };
}

export const AGE_BAND_COLORS: Record<AgeBandId, string> = {
  early_years: '#E8B931',
  lower_primary: '#2E9E4F',
  upper_primary: '#2F7FD6',
  middle: '#E07B2B',
  secondary: '#D03B3B',
  reference: '#7B4FA6',
};

export const AGE_BAND_LABELS: Record<AgeBandId, string> = {
  early_years: 'Early Years',
  lower_primary: 'Lower Primary',
  upper_primary: 'Upper Primary',
  middle: 'Middle',
  secondary: 'Secondary',
  reference: 'Reference / Teachers',
};

// Client-side mirror of the backend's suggestCallNumber/surnameCode - a
// cataloguing AID only, the librarian can always overwrite the result (see
// Library Shelf Visual Guide, pp. 2-5).
export function surnameCode(author: string): string {
  const words = (author || '').trim().split(/\s+/).filter(Boolean);
  const surname = words[words.length - 1] || '';
  return surname.slice(0, 3).toUpperCase();
}

export function suggestCallNumber(input: {
  category: string;
  author: string;
  isPictureBook?: boolean;
  deweyNumber?: number;
  islamicSubCode?: string;
}): string {
  const code = surnameCode(input.author);
  if (input.category === 'islamic' && input.islamicSubCode) {
    return code ? `${input.islamicSubCode} ${code}` : input.islamicSubCode;
  }
  if (input.category === 'fiction') return code ? `F ${code}` : 'F';
  if (input.isPictureBook || input.category === 'children') return code ? `E ${code}` : 'E';
  if (typeof input.deweyNumber === 'number' && !Number.isNaN(input.deweyNumber)) {
    return code ? `${input.deweyNumber} ${code}` : String(input.deweyNumber);
  }
  return code;
}
