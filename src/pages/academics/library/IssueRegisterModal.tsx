import React, { useMemo } from 'react';
import { Btn } from './shared';
import { useAllIssuesForRegister } from './hooks';

// One row per issue record, oldest first - the circulation log of a
// school's paper Library Issue Register (who took which book out, when
// it came back, and any fine). English-only, matching the classic
// bilingual ledger's column layout but dropping the Hindi.
const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString('en-GB') : '');

const HEADERS = [
  'Date of Issue', 'Serial No.', 'Name of the Book', 'Condition of the Book', 'Name of the Borrower',
  'Class & Roll No.', 'Signature of the Borrower', 'Date of Return', 'Fine or Compensation (Amount, if any)',
  'Details and Reason of When the Fine was Realised and Deposited in the Library Account',
  'Signature of the Librarian and Remarks',
];

export default function IssueRegisterModal({ onClose }: { onClose: () => void }) {
  const { data, isLoading } = useAllIssuesForRegister();
  const rows = useMemo(() => {
    const all = ((data as any)?.data ?? []) as any[];
    return [...all].sort((a, b) => new Date(a.issueDate).getTime() - new Date(b.issueDate).getTime());
  }, [data]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-[96vw] my-4">
        <div className="library-register-no-print flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <div className="font-bold text-slate-900">Library Issue Register</div>
            <div className="text-xs text-slate-500 mt-0.5">{rows.length} issue {rows.length === 1 ? 'record' : 'records'}</div>
          </div>
          <div className="flex items-center gap-2">
            <Btn variant="primary" onClick={() => window.print()} disabled={isLoading || rows.length === 0}>🖨 Print Register</Btn>
            <button onClick={onClose} className="w-7 h-7 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400">✕</button>
          </div>
        </div>

        <style>{`
          @media print {
            body * { visibility: hidden; }
            #library-issue-register-print-area, #library-issue-register-print-area * { visibility: visible; }
            #library-issue-register-print-area { position: absolute; left: 0; top: 0; width: 100%; }
            @page { size: A3 landscape; margin: 10mm; }
            .library-register-no-print { display: none !important; }
          }
        `}</style>

        <div className="p-4 overflow-x-auto" id="library-issue-register-print-area">
          {isLoading ? (
            <div className="text-center text-slate-400 py-12">Loading…</div>
          ) : rows.length === 0 ? (
            <div className="text-center text-slate-400 py-12">No books have been issued yet.</div>
          ) : (
            <table className="border-collapse text-[10px]" style={{ minWidth: 1600 }}>
              <thead>
                <tr>
                  <th colSpan={HEADERS.length} className="text-center text-lg font-bold py-2 border border-black">
                    LIBRARY ISSUE REGISTER
                  </th>
                </tr>
                <tr>
                  {HEADERS.map((h, i) => (
                    <th key={i} className="border border-black px-1.5 py-1 font-semibold align-bottom">{h}</th>
                  ))}
                </tr>
                <tr>
                  {HEADERS.map((_, i) => (
                    <th key={i} className="border border-black py-0.5 font-normal">{i + 1}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r: any) => (
                  <tr key={r._id}>
                    <td className="border border-black px-1.5 py-1 whitespace-nowrap">{fmtDate(r.issueDate)}</td>
                    <td className="border border-black px-1.5 py-1 font-mono whitespace-nowrap">{r.copyAccessionNo || r.accessionNo || ''}</td>
                    <td className="border border-black px-1.5 py-1">{r.bookTitle}</td>
                    <td className="border border-black px-1.5 py-1 capitalize">{r.status === 'returned' ? (r.condition || '') : ''}</td>
                    <td className="border border-black px-1.5 py-1">{r.borrowerName}</td>
                    <td className="border border-black px-1.5 py-1 whitespace-nowrap">{r.borrowerClass || r.borrowerAdmissionNo || ''}</td>
                    <td className="border border-black px-1.5 py-1"></td>
                    <td className="border border-black px-1.5 py-1 whitespace-nowrap">{fmtDate(r.returnDate)}</td>
                    <td className="border border-black px-1.5 py-1 text-right whitespace-nowrap">
                      {r.fineAmount ? r.fineAmount.toFixed(2) : ''}{r.replacementCharge ? ` +${r.replacementCharge.toFixed(2)}` : ''}
                    </td>
                    <td className="border border-black px-1.5 py-1">{r.finePaid ? 'Paid' : ''}</td>
                    <td className="border border-black px-1.5 py-1 capitalize">{r.status !== 'issued' && r.status !== 'overdue' ? r.status : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
