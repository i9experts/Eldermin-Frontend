import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Card, CardHeader, Btn, EmptyState } from './shared';
import {
  useDefaultersReport, useMostBorrowedReport, useCirculationByCategoryReport,
} from './hooks';
import libraryApi from './api';
import RegisterReportModal from './RegisterReportModal';
import IssueRegisterModal from './IssueRegisterModal';

function GenericTable({ rows, columns }: { rows: any[]; columns?: string[] }) {
  if (!rows || rows.length === 0) return <EmptyState icon="📊" title="No data available" />;
  const cols = columns ?? Object.keys(rows[0]).filter(k => !k.startsWith('_'));
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100">
            {cols.map(c => (
              <th key={c} className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap bg-slate-50">
                {c.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {rows.map((row, i) => (
            <tr key={row._id ?? i}>
              {cols.map(c => (
                <td key={c} className="py-2 px-3 text-slate-700">{formatCell(row[c])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatCell(v: any) {
  if (v == null) return '—';
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

function ExportButton({ type }: { type: 'defaulters' | 'most-borrowed' | 'circulation' }) {
  const [downloading, setDownloading] = useState(false);
  const download = async () => {
    setDownloading(true);
    try {
      await libraryApi.exportReport(type);
      toast.success('Report exported');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to export report');
    } finally {
      setDownloading(false);
    }
  };
  return <Btn size="sm" variant="secondary" onClick={download} disabled={downloading}>{downloading ? 'Exporting…' : 'Export to Excel'}</Btn>;
}

export default function ReportsTab() {
  const { data: defaulters = [], isLoading: loadingDefaulters } = useDefaultersReport();
  const { data: mostBorrowed = [], isLoading: loadingMostBorrowed } = useMostBorrowedReport(10);
  const { data: circulation = [], isLoading: loadingCirculation } = useCirculationByCategoryReport();
  const [showRegister, setShowRegister] = useState(false);
  const [showIssueRegister, setShowIssueRegister] = useState(false);

  return (
    <div className="space-y-4">
      {showRegister && <RegisterReportModal onClose={() => setShowRegister(false)} />}
      {showIssueRegister && <IssueRegisterModal onClose={() => setShowIssueRegister(false)} />}

      <Card>
        <CardHeader
          title="Library Book Accession Register"
          subtitle="Printable ledger — one row per physical copy, in the classic accession-register format"
          actions={<Btn size="sm" variant="primary" onClick={() => setShowRegister(true)}>📖 Open Register</Btn>}
        />
      </Card>

      <Card>
        <CardHeader
          title="Library Issue Register"
          subtitle="Printable circulation ledger — who borrowed which book, when it was returned, and any fine"
          actions={<Btn size="sm" variant="primary" onClick={() => setShowIssueRegister(true)}>📖 Open Register</Btn>}
        />
      </Card>

      <Card>
        <CardHeader title="Defaulters" subtitle="Borrowers with overdue books and outstanding fines" actions={<ExportButton type="defaulters" />} />
        <div className="p-5">
          {loadingDefaulters ? <div className="text-center text-slate-400 py-8">Loading…</div> : <GenericTable rows={defaulters as any[]} />}
        </div>
      </Card>

      <Card>
        <CardHeader title="Most Borrowed Books" subtitle="Top titles by circulation" actions={<ExportButton type="most-borrowed" />} />
        <div className="p-5">
          {loadingMostBorrowed ? <div className="text-center text-slate-400 py-8">Loading…</div> : <GenericTable rows={mostBorrowed as any[]} />}
        </div>
      </Card>

      <Card>
        <CardHeader title="Circulation by Category" subtitle="Issue counts grouped by book category" actions={<ExportButton type="circulation" />} />
        <div className="p-5">
          {loadingCirculation ? <div className="text-center text-slate-400 py-8">Loading…</div> : <GenericTable rows={circulation as any[]} />}
        </div>
      </Card>
    </div>
  );
}
