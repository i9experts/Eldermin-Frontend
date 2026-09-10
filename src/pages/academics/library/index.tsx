import React, { useState } from 'react';
import { useBooks, useIssues, useReservations, useOverdueIssues } from './hooks';
import CatalogueTab from './CatalogueTab';
import IssuesTab, { IssueBookModal } from './IssuesTab';
import ReservationsTab from './ReservationsTab';
import OverdueTab from './OverdueTab';
import ReportsTab from './ReportsTab';
import SettingsTab from './SettingsTab';

const TABS = [
  { key: 'catalogue', label: 'Catalogue' },
  { key: 'issues', label: 'Issues' },
  { key: 'reservations', label: 'Reservations' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'reports', label: 'Reports' },
  { key: 'settings', label: 'Settings' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

function KpiCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="h-1" style={{ background: color }} />
      <div className="p-4 text-center">
        <div className="text-2xl font-bold" style={{ color }}>{value}</div>
        <div className="text-xs text-slate-400 mt-1">{label}</div>
      </div>
    </div>
  );
}

export default function LibraryTab() {
  const [tab, setTab] = useState<TabKey>('catalogue');
  const [issuingBook, setIssuingBook] = useState<any>(null);

  // Lightweight aggregate query for the KPI row — first page is enough to read `meta.total`.
  const { data: allBooksResp } = useBooks({ limit: 1 });
  const { data: availableResp } = useBooks({ limit: 1, available: true });
  const { data: issuedResp } = useIssues({ status: 'issued', limit: 1 });
  const { data: overdue = [] } = useOverdueIssues();
  const { data: reservations = [] } = useReservations({ status: 'waiting' });

  const totalBooks = (allBooksResp as any)?.meta?.total ?? 0;
  const availableBooks = (availableResp as any)?.meta?.total ?? 0;
  const issuedCount = (issuedResp as any)?.meta?.total ?? 0;
  const overdueCount = (overdue as any[]).length;
  const reservationCount = (reservations as any[]).length;

  return (
    <div className="p-4 space-y-4">
      {issuingBook !== null && (
        <IssueBookModal book={issuingBook === true ? undefined : issuingBook} onClose={() => setIssuingBook(null)} />
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <KpiCard label="Total Books" value={totalBooks} color="#0C447C" />
        <KpiCard label="Available" value={availableBooks} color="#1D9E75" />
        <KpiCard label="Issued" value={issuedCount} color="#378ADD" />
        <KpiCard label="Overdue" value={overdueCount} color="#E24B4A" />
        <KpiCard label="Reservations" value={reservationCount} color="#EF9F27" />
      </div>

      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit flex-wrap">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
              tab === t.key ? 'bg-[#0C447C] text-white' : 'text-slate-600 hover:bg-white'
            }`}
          >
            {t.key === 'overdue' && overdueCount > 0 && (
              <span className="bg-red-500 text-white rounded-full px-1.5 text-[10px] leading-4">{overdueCount}</span>
            )}
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'catalogue' && <CatalogueTab onIssue={setIssuingBook} />}
      {tab === 'issues' && <IssuesTab onNewIssue={() => setIssuingBook(true)} />}
      {tab === 'reservations' && <ReservationsTab />}
      {tab === 'overdue' && <OverdueTab />}
      {tab === 'reports' && <ReportsTab />}
      {tab === 'settings' && <SettingsTab />}
    </div>
  );
}
