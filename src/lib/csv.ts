// Shared CSV helpers for bulk-import features (Question Bank, Fee
// Assignments, Chart of Accounts). Minimal RFC 4180 parser — handles
// quoted fields, escaped quotes ("") inside quotes, and commas/newlines
// embedded in quoted fields. Good enough for simple flat bulk-import rows
// without pulling in a dependency for it.

export function csvEscape(value: string): string {
  if (/[",\r\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  const src = text.replace(/\r\n/g, '\n');
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field); field = '';
    } else if (ch === '\n') {
      row.push(field); field = '';
      rows.push(row); row = [];
    } else {
      field += ch;
    }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows.filter(r => r.some(f => f.trim() !== ''));
}

export function downloadCsvFile(filename: string, headers: string[], exampleRows: string[][]) {
  const rows = [headers, ...exampleRows];
  const csv = rows.map(r => r.map(csvEscape).join(',')).join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Parses a CSV file's text into an array of plain objects keyed by the
 * lowercased header row, remapped to the given camelCase field names.
 * `headerKey` maps lowercased-header -> object key (e.g. {questiontext:
 * 'questionText'}); a header not in the map is used as-is. */
export function csvRowsToObjects(text: string, requiredHeaders: string[], headerKey: Record<string, string> = {}): { rows: any[]; parseErrors: string[] } {
  const table = parseCSV(text);
  const parseErrors: string[] = [];
  if (table.length === 0) return { rows: [], parseErrors: ['File is empty.'] };
  const headers = table[0].map(h => h.trim().toLowerCase());
  const missing = requiredHeaders.filter(h => !headers.includes(h));
  if (missing.length > 0) {
    parseErrors.push(`Missing required column(s): ${missing.join(', ')}.`);
    return { rows: [], parseErrors };
  }
  const rows = table.slice(1).map(cells => {
    const obj: any = {};
    headers.forEach((h, i) => { const key = headerKey[h] || h; obj[key] = (cells[i] ?? '').trim(); });
    return obj;
  });
  return { rows, parseErrors };
}
