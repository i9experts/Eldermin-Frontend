import React, { useMemo } from 'react';
import { Btn } from './shared';
import { useAllBooksForRegister } from './hooks';

// One row per physical copy, in the order a school's paper Library Book
// Accession Register is kept: chronological by accession number, every
// title and copy ever catalogued (deaccessioned ones stay in, marked in
// Remarks - a register never deletes rows, it annotates them).
interface RegisterRow {
  date?: string;
  accessionNo: string;
  author: string;
  title: string;
  publisher: string;
  year: number | string;
  callNumber: string;
  rate: number;
  remarks: string;
}

function flattenToRegisterRows(books: any[]): RegisterRow[] {
  const rows: RegisterRow[] = [];
  for (const b of books) {
    const copies = b.copies?.length ? b.copies : [{
      accessionNo: b.accessionNo, status: b.status, addedDate: b.purchaseDate || b.createdAt,
    }];
    for (const c of copies) {
      rows.push({
        date: c.addedDate || b.purchaseDate || b.createdAt,
        accessionNo: c.accessionNo || b.accessionNo,
        author: b.author,
        title: b.title,
        publisher: b.publisher,
        year: b.publishYear,
        callNumber: b.callNumber,
        rate: b.purchasePrice,
        remarks: c.status && c.status !== 'available' ? c.status.charAt(0).toUpperCase() + c.status.slice(1) : '',
      });
    }
  }
  rows.sort((a, b) => (a.accessionNo || '').localeCompare(b.accessionNo || '', undefined, { numeric: true }));
  return rows;
}

const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString('en-GB') : '');
const rsAndPaisa = (rate?: number) => {
  if (!rate) return { rs: '', p: '' };
  const rs = Math.floor(rate);
  const p = Math.round((rate - rs) * 100);
  return { rs: String(rs), p: p ? String(p).padStart(2, '0') : '00' };
};

const HEADERS = [
  'Date', 'Accession No.', 'Author', 'Title Name / Name of Book', 'Name & Address of Publisher', 'Year of Publication',
  'Page', 'Source / Name of Supplier with Address', 'Date', 'Bill No.', 'Volume Qty', 'Rate', 'Cost Rs.', 'Cost P.',
  'Call No. / Class No.', 'Remarks',
];

export default function RegisterReportModal({ onClose }: { onClose: () => void }) {
  const { data, isLoading } = useAllBooksForRegister();
  const rows = useMemo(() => flattenToRegisterRows((data as any)?.data ?? []), [data]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-[96vw] my-4">
        <div className="library-register-no-print flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <div className="font-bold text-slate-900">Library Book Accession Register</div>
            <div className="text-xs text-slate-500 mt-0.5">{rows.length} accessioned {rows.length === 1 ? 'copy' : 'copies'} across the catalogue</div>
          </div>
          <div className="flex items-center gap-2">
            <Btn variant="primary" onClick={() => window.print()} disabled={isLoading || rows.length === 0}>🖨 Print Register</Btn>
            <button onClick={onClose} className="w-7 h-7 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400">✕</button>
          </div>
        </div>

        <style>{`
          @media print {
            body * { visibility: hidden; }
            #library-register-print-area, #library-register-print-area * { visibility: visible; }
            #library-register-print-area { position: absolute; left: 0; top: 0; width: 100%; }
            @page { size: A3 landscape; margin: 10mm; }
            .library-register-no-print { display: none !important; }
          }
        `}</style>

        <div className="p-4 overflow-x-auto" id="library-register-print-area">
          {isLoading ? (
            <div className="text-center text-slate-400 py-12">Loading…</div>
          ) : rows.length === 0 ? (
            <div className="text-center text-slate-400 py-12">No books catalogued yet - add books in the Catalogue tab first.</div>
          ) : (
            <table className="border-collapse text-[10px]" style={{ minWidth: 1500 }}>
              <thead>
                <tr>
                  <th colSpan={16} className="text-center text-lg font-bold py-2 border border-black">
                    LIBRARY BOOK ACCESSION REGISTER
                  </th>
                </tr>
                <tr>
                  {HEADERS.map((h, i) => (
                    <th key={i} className="border border-black px-1.5 py-1 font-semibold align-bottom whitespace-nowrap">{h}</th>
                  ))}
                </tr>
                <tr>
                  {HEADERS.map((_, i) => (
                    <th key={i} className="border border-black py-0.5 font-normal">{i + 1}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const { rs, p } = rsAndPaisa(r.rate);
                  return (
                    <tr key={`${r.accessionNo}-${i}`}>
                      <td className="border border-black px-1.5 py-1 whitespace-nowrap">{fmtDate(r.date)}</td>
                      <td className="border border-black px-1.5 py-1 font-mono whitespace-nowrap">{r.accessionNo}</td>
                      <td className="border border-black px-1.5 py-1">{r.author}</td>
                      <td className="border border-black px-1.5 py-1">{r.title}</td>
                      <td className="border border-black px-1.5 py-1">{r.publisher}</td>
                      <td className="border border-black px-1.5 py-1 text-center">{r.year || ''}</td>
                      <td className="border border-black px-1.5 py-1"></td>
                      <td className="border border-black px-1.5 py-1"></td>
                      <td className="border border-black px-1.5 py-1 whitespace-nowrap">{fmtDate(r.date)}</td>
                      <td className="border border-black px-1.5 py-1"></td>
                      <td className="border border-black px-1.5 py-1 text-center">1</td>
                      <td className="border border-black px-1.5 py-1 text-right">{r.rate ? r.rate.toFixed(2) : ''}</td>
                      <td className="border border-black px-1.5 py-1 text-right">{rs}</td>
                      <td className="border border-black px-1.5 py-1 text-right">{p}</td>
                      <td className="border border-black px-1.5 py-1 text-center">{r.callNumber || ''}</td>
                      <td className="border border-black px-1.5 py-1 whitespace-nowrap">{r.remarks}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
