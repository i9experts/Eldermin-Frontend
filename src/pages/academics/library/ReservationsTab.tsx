import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { StudentSelect } from '../../../components/ui/StudentSelect';
import { StaffSelect } from '../../../components/ui/StaffSelect';
import {
  Card, Btn, Modal, FormField, FSelect, Badge, TableWrap, Td, EmptyState,
} from './shared';
import { useReservations, useCreateReservation, useCancelReservation, useBooks } from './hooks';

function CreateReservationModal({ onClose }: { onClose: () => void }) {
  const [bookId, setBookId] = useState('');
  const [borrowerType, setBorrowerType] = useState<'student' | 'staff'>('student');
  const [borrowerId, setBorrowerId] = useState('');
  const [staffId, setStaffId] = useState('');
  const [notes, setNotes] = useState('');

  const { data: booksResp } = useBooks({ limit: 100 });
  const books = (booksResp as any)?.data ?? [];

  const mut = useCreateReservation();
  const effectiveBorrowerId = borrowerType === 'student' ? borrowerId : staffId;

  const submit = () => {
    mut.mutate({ bookId, borrowerType, borrowerId: effectiveBorrowerId, notes: notes || undefined }, {
      onSuccess: () => { toast.success('Reservation created'); onClose(); },
      onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to create reservation'),
    });
  };

  const canSubmit = !!bookId && !!effectiveBorrowerId;

  return (
    <Modal
      title="Reserve a Book"
      onClose={onClose}
      footer={<>
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" onClick={submit} disabled={!canSubmit || mut.isPending}>{mut.isPending ? 'Reserving…' : 'Create Reservation'}</Btn>
      </>}
    >
      <FormField label="Book" required>
        <FSelect value={bookId} onChange={e => setBookId(e.target.value)}>
          <option value="">Select a book…</option>
          {books.map((b: any) => (
            <option key={b._id} value={b._id}>{b.title} — {b.author}{b.availableCopies < 1 ? ' (all issued)' : ''}</option>
          ))}
        </FSelect>
      </FormField>

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

      <FormField label="Notes">
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]" />
      </FormField>
    </Modal>
  );
}

export default function ReservationsTab() {
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const { data: reservations = [], isLoading } = useReservations({ status: statusFilter || undefined });
  const cancelMut = useCancelReservation();

  const cancel = (id: string) => {
    cancelMut.mutate(id, {
      onSuccess: () => toast.success('Reservation cancelled'),
      onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to cancel reservation'),
    });
  };

  const list = reservations as any[];

  return (
    <Card>
      {showCreate && <CreateReservationModal onClose={() => setShowCreate(false)} />}

      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-wrap gap-2">
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0C447C]"
        >
          <option value="">All</option>
          <option value="waiting">Waiting</option>
          <option value="ready-for-pickup">Ready for Pickup</option>
          <option value="fulfilled">Fulfilled</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <Btn variant="primary" onClick={() => setShowCreate(true)}>+ New Reservation</Btn>
      </div>

      <div className="p-5">
        {isLoading ? (
          <div className="text-center text-slate-400 py-12">Loading…</div>
        ) : list.length === 0 ? (
          <EmptyState icon="🔖" title="No reservations yet" action={<Btn variant="primary" onClick={() => setShowCreate(true)}>+ New Reservation</Btn>} />
        ) : (
          <TableWrap headers={['Book', 'Borrower', 'Reserved On', 'Status', 'Actions']}>
            {list.map((r: any) => (
              <tr key={r._id}>
                <Td className="font-medium">{r.bookTitle}</Td>
                <Td>{r.borrowerName}</Td>
                <Td className="text-xs text-slate-500">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}</Td>
                <Td><Badge status={r.status} small /></Td>
                <Td>
                  {(r.status === 'waiting' || r.status === 'ready-for-pickup') && (
                    <Btn size="xs" variant="danger" onClick={() => cancel(r._id)} disabled={cancelMut.isPending}>Cancel</Btn>
                  )}
                </Td>
              </tr>
            ))}
          </TableWrap>
        )}
      </div>
    </Card>
  );
}
