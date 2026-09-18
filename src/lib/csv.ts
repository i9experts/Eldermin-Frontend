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

/** Reads an uploaded bulk-import file into a plain rows table, whether it's
 * a real CSV or an actual Excel workbook. School admins routinely open the
 * downloaded .csv template in Excel to fill it in, and Excel's "Save"
 * re-writes that file as a real binary .xlsx (not text) if they don't
 * explicitly keep the CSV format - reading that file with `.text()` and
 * feeding it to parseCSV produces garbage and a false "missing columns"
 * error, since the header row is never actually found. Detects the real
 * file type from its magic bytes (not just the extension, which a rename
 * can get wrong) and parses accordingly. */
export async function readFileAsTable(file: File): Promise<string[][]> {
  const head = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  // .xlsx (and .xlsm/.docx/...) are ZIP containers ("PK\x03\x04..."); old
  // .xls is an OLE/CFB file ("\xD0\xCF\x11\xE0..."). Either way, that's
  // binary content that must go through a real spreadsheet parser, not
  // be decoded as UTF-8 text.
  const isZip = head[0] === 0x50 && head[1] === 0x4b;
  const isOle = head[0] === 0xd0 && head[1] === 0xcf && head[2] === 0x11 && head[3] === 0xe0;
  if (isZip || isOle) {
    const XLSX = await import('xlsx');
    const buf = await file.arrayBuffer();
    const workbook = XLSX.read(buf, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' });
    return rows
      .map(r => r.map(cell => String(cell ?? '').trim()))
      .filter(r => r.some(cell => cell !== ''));
  }
  const text = await file.text();
  return parseCSV(text);
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

/** Turns an already-parsed rows table (header row + data rows) into an
 * array of plain objects keyed by the lowercased header row, remapped to
 * the given camelCase field names. `headerKey` maps lowercased-header ->
 * object key (e.g. {questiontext: 'questionText'}); a header not in the
 * map is used as-is. */
export function tableToObjects(table: string[][], requiredHeaders: string[], headerKey: Record<string, string> = {}): { rows: any[]; parseErrors: string[] } {
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

/** Parses a CSV file's text into an array of plain objects. See
 * `tableToObjects` for the header-matching rules. */
export function csvRowsToObjects(text: string, requiredHeaders: string[], headerKey: Record<string, string> = {}): { rows: any[]; parseErrors: string[] } {
  return tableToObjects(parseCSV(text), requiredHeaders, headerKey);
}

/** Reads an uploaded file (CSV or real Excel workbook - see
 * `readFileAsTable`) straight into bulk-import objects. */
export async function readObjectsFromFile(file: File, requiredHeaders: string[], headerKey: Record<string, string> = {}): Promise<{ rows: any[]; parseErrors: string[] }> {
  const table = await readFileAsTable(file);
  return tableToObjects(table, requiredHeaders, headerKey);
}
