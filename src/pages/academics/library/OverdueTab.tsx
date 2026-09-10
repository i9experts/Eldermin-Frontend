import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Card, Btn, TableWrap, Td, EmptyState } from './shared';
import { useOverdueIssues, useMarkFinePaid } from './hooks';
import { ReturnBookModal } from './IssuesTab';

export default function OverdueTab() {
  const { data: overdue = [], isLoading } = useOverdueIssues();
  const [returningIssue, setReturningIssue] = useState<any>(null);
  const finePaidMut = useMarkFinePaid();
  const list = overdue as any[];

  const markFinePaid = (issue: any) => {
    finePaidMut.mutate(issue._id, {
      onSuccess: () => toast.success('Fine marked as paid'),
      onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to mark fine as paid'),
    });
  };

  return (
    <Card>
      {returningIssue && <ReturnBookModal issue={returningIssue} onClose={() => setReturningIssue(null)} />}

      {isLoading ? (
        <div className="text-center text-slate-400 py-12">Loading…</div>
      ) : list.length === 0 ? (
        <div className="p-5"><EmptyState icon="✅" title="No overdue books!" /></div>
      ) : (
        <div className="p-5">
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
            <span className="font-semibold text-red-600 text-sm">⚠ {list.length} overdue book{list.length !== 1 ? 's' : ''}</span>
          </div>
          <TableWrap headers={['Book', 'Borrower', 'Due Date', 'Days Overdue', 'Fine', 'Actions']}>
            {list.map((o: any) => {
              const days = Math.max(0, Math.ceil((Date.now() - new Date(o.dueDate).getTime()) / (1000 * 60 * 60 * 24)));
              return (
                <tr key={o._id}>
                  <Td className="font-medium">{o.bookTitle}</Td>
                  <Td>{o.borrowerName}</Td>
                  <Td className="text-red-600 text-xs">{new Date(o.dueDate).toLocaleDateString()}</Td>
                  <Td className="text-red-600 font-semibold">{days} days</Td>
                  <Td className="text-red-600 font-semibold text-xs">
                    {o.fineAmount != null ? `PKR ${o.fineAmount}${o.finePaid ? ' (paid)' : ''}` : '—'}
                  </Td>
                  <Td>
                    <div className="flex gap-1.5 flex-wrap">
                      <Btn size="xs" variant="success" onClick={() => setReturningIssue(o)}>Return Now</Btn>
                      {o.fineAmount > 0 && !o.finePaid && (
                        <Btn size="xs" variant="secondary" onClick={() => markFinePaid(o)} disabled={finePaidMut.isPending}>Mark Fine Paid</Btn>
                      )}
                    </div>
                  </Td>
                </tr>
              );
            })}
          </TableWrap>
        </div>
      )}
    </Card>
  );
}
