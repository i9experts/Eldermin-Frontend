import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { StudentSelect } from '../../../components/ui/StudentSelect';
import { StaffSelect } from '../../../components/ui/StaffSelect';
import {
  Card, Btn, Modal, FormField, FSelect, Badge, TableWrap, Td, EmptyState,
} from './shared';
import {
  useIssues, useBooks, useIssueBook, useReturnBook, useRenewIssue,
  useMarkFinePaid, useMarkLost, useMarkDamaged, useLibrarySettings,
} from './hooks';

// ─── ISSUE BOOK MODAL ──────────────────────────────────────────────────────
export function IssueBookModal({ book, onClose }: { book?: any; onClose: () => void }) {
  const [selectedBookId, setSelectedBookId] = useState(book?._id ?? '');
  const { data: booksResp } = useBooks({ available: true, limit: 100 });
  const availableBooks = (booksResp as any)?.data ?? [];
  const chosenBook = book ?? availableBooks.find((b: any) => b._id === selectedBookId);

  const [borrowerType, setBorrowerType] = useState<'student' | 'staff'>('student');
  const [borrowerId, setBorrowerId] = useState('');
  const [staffId, setStaffId] = useState('');
  const [loanDays, setLoanDays] = useState(14);
  const [notes, setNotes] = useState('');
  const dueDate = new Date(); dueDate.setDate(dueDate.getDate() + loanDays);

  const mut = useIssueBook();

  const effectiveBorrowerId = borrowerType === 'student' ? borrowerId : staffId;

  const submit = () => {
    mut.mutate(
      { bookId: chosenBook?._id, borrowerType, borrowerId: effectiveBorrowerId, loanDays, notes: notes || undefined },
      {
        onSuccess: () => { toast.success(`Book issued. Due: ${dueDate.toLocaleDateString()}`); onClose(); },
        onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to issue book — check available copies'),
      },
    );
  };

  const canSubmit = !!chosenBook?._id && !!effectiveBorrowerId;

  return (
    <Modal
      title="Issue Book"
      onClose={onClose}
      footer={<>
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn variant="success" onClick={submit} disabled={!canSubmit || mut.isPending}>
          {mut.isPending ? 'Issuing…' : `Issue Book — Due ${dueDate.toLocaleDateString()}`}
        </Btn>
      </>}
    >
      {!book && (
        <FormField label="Book" required>
          <FSelect value={selectedBookId} onChange={e => setSelectedBookId(e.target.value)}>
            <option value="">Select a book…</option>
            {availableBooks.map((b: any) => (
              <option key={b._id} value={b._id}>{b.title} — {b.author} ({b.availableCopies} available)</option>
            ))}
          </FSelect>
        </FormField>
      )}

      {chosenBook && (
        <div className="bg-[#EBF2FA] rounded-lg p-3">
          <div className="font-semibold text-sm">{chosenBook.title}</div>
          <div className="text-xs text-slate-500">{chosenBook.author} • {chosenBook.availableCopies} copies available</div>
        </div>
      )}

      <div className="flex gap-2">
        {(['student', 'staff'] as const).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setBorrowerType(t)}
            className={`flex-1 py-2 rounded-lg text-sm capitalize ${borrowerType === t ? 'bg-[#0C447C] text-white' : 'bg-slate-100 text-slate-600'}`}
          >
            {t}
          </button>
        ))}
      </div>

      <FormField label="Borrower" required>
        {borrowerType === 'student' ? (
          <StudentSelect value={borrowerId} onChange={(id) => setBorrowerId(id)} />
        ) : (
          <StaffSelect value={staffId} onChange={(e) => setStaffId(e.target.value)} />
        )}
      </FormField>

      <FormField label="Loan Period">
        <div className="flex gap-2">
          {[7, 14, 30].map(d => (
            <button
              key={d}
              type="button"
              onClick={() => setLoanDays(d)}
              className={`flex-1 py-1.5 rounded-lg text-xs ${loanDays === d ? 'bg-[#0C447C] text-white' : 'bg-slate-100 text-slate-600'}`}
            >
              {d} days
            </button>
          ))}
        </div>
        <div className="text-xs text-slate-500 mt-1.5">Due: {dueDate.toLocaleDateString()}</div>
      </FormField>

      <FormField label="Notes">
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]"
        />
      </FormField>
    </Modal>
  );
}

// ─── RETURN BOOK MODAL ─────────────────────────────────────────────────────
export function ReturnBookModal({ issue, onClose }: { issue: any; onClose: () => void }) {
  const [condition, setCondition] = useState('good');
  const [notes, setNotes] = useState('');
  const now = new Date();
  const due = new Date(issue.dueDate);
  const overdueDays = Math.max(0, Math.ceil((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)));

  const mut = useReturnBook();

  const submit = () => {
    mut.mutate({ issueId: issue._id, data: { condition, notes: notes || undefined } }, {
      onSuccess: (res: any) => {
        const fineMsg = res?.fineAmount ? ` Fine: PKR ${res.fineAmount}.` : '';
        toast.success((res?.message || 'Book returned') + fineMsg);
        onClose();
      },
      onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to return book'),
    });
  };

  return (
    <Modal
      title="Return Book"
      onClose={onClose}
      footer={<>
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn variant="success" onClick={submit} disabled={mut.isPending}>{mut.isPending ? 'Processing…' : 'Confirm Return'}</Btn>
      </>}
    >
      <div className="bg-slate-50 rounded-lg p-3">
        <div className="font-semibold text-sm">{issue.bookTitle}</div>
        <div className="text-xs text-slate-500">Borrowed by: {issue.borrowerName}</div>
        <div className="text-xs text-slate-500">Due: {new Date(issue.dueDate).toLocaleDateString()}</div>
      </div>

      {overdueDays > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="font-semibold text-red-600 text-sm">⚠ Overdue by {overdueDays} days</div>
          <div className="text-xs text-red-600 mt-0.5">The exact fine will be computed by the system based on current library settings.</div>
        </div>
      )}

      <FormField label="Book Condition on Return">
        {/* 'damaged'/'lost' are deliberately not options here - returnBook
            always puts the copy back into circulation (availableCopies+1).
            A damaged or lost copy must go through the dedicated Mark
            Damaged/Mark Lost actions instead, which correctly keep it out
            of the available pool and adjust the book's copy counts. */}
        <div className="grid grid-cols-2 gap-1.5">
          {['good', 'fair'].map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setCondition(c)}
              className={`py-1.5 rounded-lg text-xs capitalize ${condition === c ? 'bg-[#0C447C] text-white' : 'bg-slate-100 text-slate-600'}`}
            >
              {c}
            </button>
          ))}
        </div>
      </FormField>

      <FormField label="Notes">
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]"
        />
      </FormField>
    </Modal>
  );
}

// ─── MARK LOST MODAL ───────────────────────────────────────────────────────
function MarkLostModal({ issue, onClose }: { issue: any; onClose: () => void }) {
  const [replacementCharge, setReplacementCharge] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const mut = useMarkLost();
  const submit = () => {
    mut.mutate({ issueId: issue._id, data: { replacementCharge: replacementCharge === '' ? undefined : Number(replacementCharge), notes: notes || undefined } }, {
      onSuccess: () => { toast.success('Book marked as lost'); onClose(); },
      onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to mark book as lost'),
    });
  };
  return (
    <Modal
      title="Mark Book as Lost"
      onClose={onClose}
      footer={<>
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn variant="danger" onClick={submit} disabled={mut.isPending}>{mut.isPending ? 'Saving…' : 'Mark Lost'}</Btn>
      </>}
    >
      <div className="text-sm text-slate-600">{issue.bookTitle} — borrowed by {issue.borrowerName}</div>
      <FormField label="Replacement Charge (optional)">
        <input
          type="number"
          value={replacementCharge}
          onChange={e => setReplacementCharge(e.target.value === '' ? '' : Number(e.target.value))}
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]"
        />
      </FormField>
      <FormField label="Notes">
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]" />
      </FormField>
    </Modal>
  );
}

// ─── MARK DAMAGED MODAL ────────────────────────────────────────────────────
function MarkDamagedModal({ issue, onClose }: { issue: any; onClose: () => void }) {
  const [notes, setNotes] = useState('');
  const mut = useMarkDamaged();
  const submit = () => {
    mut.mutate({ issueId: issue._id, data: { notes: notes || undefined } }, {
      onSuccess: () => { toast.success('Book marked as damaged'); onClose(); },
      onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to mark book as damaged'),
    });
  };
  return (
    <Modal
      title="Mark Book as Damaged"
      onClose={onClose}
      footer={<>
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn variant="danger" onClick={submit} disabled={mut.isPending}>{mut.isPending ? 'Saving…' : 'Mark Damaged'}</Btn>
      </>}
    >
      <div className="text-sm text-slate-600">{issue.bookTitle} — borrowed by {issue.borrowerName}</div>
      <FormField label="Notes">
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]" />
      </FormField>
    </Modal>
  );
}

// ─── ISSUES TAB ────────────────────────────────────────────────────────────
export default function IssuesTab({ onNewIssue }: { onNewIssue: () => void }) {
  const [statusFilter, setStatusFilter] = useState('');
  const [returningIssue, setReturningIssue] = useState<any>(null);
  const [losingIssue, setLosingIssue] = useState<any>(null);
  const [damagingIssue, setDamagingIssue] = useState<any>(null);

  const { data: issuesResp, isLoading } = useIssues({ status: statusFilter || undefined, limit: 100 });
  const issues = (issuesResp as any)?.data ?? [];
  const { data: settings } = useLibrarySettings();
  const finePaidMut = useMarkFinePaid();
  const renewMut = useRenewIssue();

  const markFinePaid = (issue: any) => {
    finePaidMut.mutate(issue._id, {
      onSuccess: () => toast.success('Fine marked as paid'),
      onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to mark fine as paid'),
    });
  };

  const renew = (issue: any) => {
    renewMut.mutate(issue._id, {
      onSuccess: () => toast.success('Issue renewed'),
      onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to renew — try returning the book instead'),
    });
  };

  return (
    <Card>
      {returningIssue && <ReturnBookModal issue={returningIssue} onClose={() => setReturningIssue(null)} />}
      {losingIssue && <MarkLostModal issue={losingIssue} onClose={() => setLosingIssue(null)} />}
      {damagingIssue && <MarkDamagedModal issue={damagingIssue} onClose={() => setDamagingIssue(null)} />}

      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-wrap gap-2">
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0C447C]"
        >
          <option value="">All</option>
          <option value="issued">Issued</option>
          <option value="returned">Returned</option>
          <option value="overdue">Overdue</option>
          <option value="lost">Lost</option>
          <option value="damaged">Damaged</option>
        </select>
        <Btn variant="primary" onClick={onNewIssue}>+ New Issue</Btn>
      </div>

      <div className="p-5">
        {isLoading ? (
          <div className="text-center text-slate-400 py-12">Loading…</div>
        ) : issues.length === 0 ? (
          <EmptyState icon="📤" title="No issue records yet" />
        ) : (
          <TableWrap headers={['Book', 'Borrower', 'Issued', 'Due Date', 'Status', 'Fine', 'Actions']}>
            {issues.map((iss: any) => {
              const now = new Date();
              const due = new Date(iss.dueDate);
              const isOverdue = due < now && iss.status === 'issued';
              const canRenew = iss.status === 'issued' && !isOverdue && (settings ? (iss.renewalCount ?? 0) < (settings as any).maxRenewals : true);
              return (
                <tr key={iss._id} className={isOverdue ? 'bg-red-50/40' : ''}>
                  <Td className="font-medium">{iss.bookTitle}</Td>
                  <Td>{iss.borrowerName}</Td>
                  <Td className="text-xs text-slate-500">{iss.issueDate ? new Date(iss.issueDate).toLocaleDateString() : '—'}</Td>
                  <Td className="text-xs">{iss.dueDate ? new Date(iss.dueDate).toLocaleDateString() : '—'}</Td>
                  <Td><Badge status={isOverdue ? 'overdue' : iss.status} small /></Td>
                  <Td className="text-xs">
                    {iss.fineAmount > 0 ? (
                      <span className={iss.finePaid ? 'text-emerald-600' : 'text-red-600 font-semibold'}>
                        PKR {iss.fineAmount}{iss.finePaid ? ' (paid)' : ''}
                      </span>
                    ) : '—'}
                  </Td>
                  <Td>
                    <div className="flex gap-1.5 flex-wrap">
                      {(iss.status === 'issued' || iss.status === 'overdue') && (
                        <Btn size="xs" variant="success" onClick={() => setReturningIssue(iss)}>Return</Btn>
                      )}
                      {canRenew && (
                        <Btn size="xs" variant="secondary" onClick={() => renew(iss)} disabled={renewMut.isPending}>Renew</Btn>
                      )}
                      {(iss.status === 'issued' || iss.status === 'overdue') && (
                        <>
                          <Btn size="xs" variant="danger" onClick={() => setLosingIssue(iss)}>Mark Lost</Btn>
                          <Btn size="xs" variant="secondary" onClick={() => setDamagingIssue(iss)}>Mark Damaged</Btn>
                        </>
                      )}
                      {iss.fineAmount > 0 && !iss.finePaid && (
                        <Btn size="xs" variant="success" onClick={() => markFinePaid(iss)} disabled={finePaidMut.isPending}>Mark Fine Paid</Btn>
                      )}
                    </div>
                  </Td>
                </tr>
              );
            })}
          </TableWrap>
        )}
      </div>
    </Card>
  );
}
