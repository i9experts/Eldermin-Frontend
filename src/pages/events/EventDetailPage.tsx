import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  Card, CardHeader, Btn, Modal, FormField, FInput, FTextarea, FSelect, Badge, EmptyState, EVENT_CATEGORIES,
} from './shared';
import {
  useEvent, useUpdateEvent, useDeleteEvent, useSetEventStatus, useEventDashboard,
  useCreateTicketType, useUpdateTicketType, useDeleteTicketType,
  useCreatePromoCode, useDeletePromoCode,
  useOrders, useCreateBoxOfficeOrder, useMarkOrderPaid, useCancelOrder,
  useAttendees, useCheckIn, useCheckInSearch,
} from './hooks';
import eventsApi from './api';
import { safeParseLocalStorage } from '../../lib/safeParseLocalStorage';

type Tab = 'overview' | 'tickets' | 'promo' | 'boxoffice' | 'attendees' | 'checkin' | 'badges';
const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'tickets', label: 'Ticket Types' },
  { id: 'promo', label: 'Promo Codes' },
  { id: 'boxoffice', label: 'Box Office' },
  { id: 'attendees', label: 'Attendees' },
  { id: 'checkin', label: 'Check-In' },
  { id: 'badges', label: 'Badges' },
];

// ─── Overview ──────────────────────────────────────────────────────────────

function OverviewTab({ event }: { event: any }) {
  const navigate = useNavigate();
  const statusMut = useSetEventStatus();
  const deleteMut = useDeleteEvent();
  const { data: dashboard } = useEventDashboard(event._id);
  const d = dashboard as any;
  const schoolSlug = safeParseLocalStorage('eldermin_institution')?.slug || 'demo-school';
  const publicUrl = `${window.location.origin}/e/${schoolSlug}/${event.slug}`;

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge status={event.status} />
              <span className="text-xs text-slate-400 capitalize">{event.category?.replace(/_/g, ' ')}</span>
            </div>
            <div className="text-lg font-bold text-slate-900">{event.title}</div>
            <div className="text-sm text-slate-500">{event.venueName}</div>
          </div>
          <div className="flex gap-2">
            {event.status === 'draft' && (
              <Btn variant="success" onClick={() => statusMut.mutate({ id: event._id, status: 'published' }, {
                onSuccess: () => toast.success('Event published'),
                onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to publish'),
              })}>Publish</Btn>
            )}
            {event.status === 'published' && (
              <Btn variant="secondary" onClick={() => statusMut.mutate({ id: event._id, status: 'cancelled' })}>Cancel Event</Btn>
            )}
            <Btn variant="danger" onClick={() => {
              if (window.confirm(`Delete "${event.title}"? This only works if no orders exist yet.`)) {
                deleteMut.mutate(event._id, { onSuccess: () => navigate('/events'), onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to delete') });
              }
            }}>Delete</Btn>
          </div>
        </div>
        {event.status === 'published' && (
          <div className="mt-4 p-3 bg-slate-50 rounded-lg flex items-center justify-between gap-2 flex-wrap">
            <code className="text-xs text-slate-600 break-all">{publicUrl}</code>
            <Btn size="xs" variant="secondary" onClick={() => { navigator.clipboard.writeText(publicUrl); toast.success('Link copied'); }}>Copy Link</Btn>
          </div>
        )}
      </Card>

      {d && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="p-4"><div className="text-xs text-slate-400">Revenue</div><div className="text-xl font-bold text-slate-900">₨{d.revenue.toLocaleString()}</div></Card>
          <Card className="p-4"><div className="text-xs text-slate-400">Paid Orders</div><div className="text-xl font-bold text-slate-900">{d.paidOrders}</div></Card>
          <Card className="p-4"><div className="text-xs text-slate-400">Tickets Sold</div><div className="text-xl font-bold text-slate-900">{d.totalSoldCount}</div></Card>
          <Card className="p-4"><div className="text-xs text-slate-400">Checked In</div><div className="text-xl font-bold text-emerald-600">{d.checkedInCount}</div></Card>
        </div>
      )}

      {d?.byTicketType?.length > 0 && (
        <Card>
          <CardHeader title="Sales by Ticket Type" />
          <div className="p-5 space-y-2">
            {d.byTicketType.map((t: any) => (
              <div key={t.name} className="flex items-center justify-between text-sm">
                <span className="text-slate-700">{t.name}</span>
                <span className="text-slate-500">{t.sold} / {t.capacity} sold</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── Ticket Types ──────────────────────────────────────────────────────────

const emptyTicketType = { name: '', description: '', capacity: 50, isComplimentary: false, priceTiers: [{ name: 'Regular', price: 0, startsAt: '' }] };

function TicketTypeModal({ eventId, ticketType, onClose }: { eventId: string; ticketType?: any; onClose: () => void }) {
  const isEdit = !!ticketType;
  const [form, setForm] = useState<any>(isEdit ? {
    name: ticketType.name, description: ticketType.description || '', capacity: ticketType.capacity,
    isComplimentary: ticketType.isComplimentary,
    priceTiers: (ticketType.priceTiers || []).map((t: any) => ({ ...t, startsAt: t.startsAt ? new Date(t.startsAt).toISOString().slice(0, 16) : '' })),
  } : emptyTicketType);
  const createMut = useCreateTicketType(eventId);
  const updateMut = useUpdateTicketType(eventId);
  const mut = isEdit ? updateMut : createMut;

  const addTier = () => setForm((p: any) => ({ ...p, priceTiers: [...p.priceTiers, { name: '', price: 0, startsAt: '' }] }));
  const updateTier = (i: number, field: string, value: any) => setForm((p: any) => ({ ...p, priceTiers: p.priceTiers.map((t: any, idx: number) => idx === i ? { ...t, [field]: value } : t) }));
  const removeTier = (i: number) => setForm((p: any) => ({ ...p, priceTiers: p.priceTiers.filter((_: any, idx: number) => idx !== i) }));

  const submit = () => {
    const payload = { ...form, priceTiers: form.isComplimentary ? [] : form.priceTiers.map((t: any) => ({ ...t, price: Number(t.price) })) };
    const onSuccess = () => { toast.success(isEdit ? 'Updated' : 'Ticket type added'); onClose(); };
    const onError = (e: any) => toast.error(e?.response?.data?.message || 'Failed to save');
    if (isEdit) updateMut.mutate({ id: ticketType._id, data: payload }, { onSuccess, onError });
    else createMut.mutate(payload, { onSuccess, onError });
  };

  return (
    <Modal title={isEdit ? 'Edit Ticket Type' : 'New Ticket Type'} onClose={onClose} wide
      footer={<><Btn variant="secondary" onClick={onClose}>Cancel</Btn><Btn variant="primary" onClick={submit} disabled={mut.isPending || !form.name.trim()}>{mut.isPending ? 'Saving…' : 'Save'}</Btn></>}>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Name" required><FInput value={form.name} onChange={e => setForm((p: any) => ({ ...p, name: e.target.value }))} placeholder="General, VIP, Student…" /></FormField>
        <FormField label="Capacity" required><FInput type="number" min={1} value={form.capacity} onChange={e => setForm((p: any) => ({ ...p, capacity: parseInt(e.target.value) || 1 }))} /></FormField>
      </div>
      <FormField label="Description"><FTextarea rows={2} value={form.description} onChange={e => setForm((p: any) => ({ ...p, description: e.target.value }))} /></FormField>
      <label className="flex items-center gap-2 text-xs text-slate-600 font-medium cursor-pointer">
        <input type="checkbox" checked={form.isComplimentary} onChange={e => setForm((p: any) => ({ ...p, isComplimentary: e.target.checked }))} className="rounded border-slate-300" />
        Complimentary (free — VIP/guest invites)
      </label>
      {!form.isComplimentary && (
        <FormField label="Pricing (Early Bird → Regular → Last Minute, by date)">
          <div className="space-y-2">
            {form.priceTiers.map((t: any, i: number) => (
              <div key={i} className="grid grid-cols-[1fr_100px_1fr_auto] gap-2 items-center">
                <FInput placeholder="Tier name" value={t.name} onChange={e => updateTier(i, 'name', e.target.value)} />
                <FInput type="number" placeholder="Price" value={t.price} onChange={e => updateTier(i, 'price', e.target.value)} />
                <FInput type="datetime-local" value={t.startsAt} onChange={e => updateTier(i, 'startsAt', e.target.value)} />
                <button onClick={() => removeTier(i)} className="text-red-500 text-xs hover:underline">Remove</button>
              </div>
            ))}
            <Btn size="xs" variant="secondary" onClick={addTier}>+ Add Price Tier</Btn>
          </div>
        </FormField>
      )}
    </Modal>
  );
}

function TicketTypesTab({ event }: { event: any }) {
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const deleteMut = useDeleteTicketType(event._id);
  const types = event.ticketTypes ?? [];

  return (
    <Card>
      {showAdd && <TicketTypeModal eventId={event._id} onClose={() => setShowAdd(false)} />}
      {editing && <TicketTypeModal eventId={event._id} ticketType={editing} onClose={() => setEditing(null)} />}
      <CardHeader title="Ticket Types" actions={<Btn size="sm" variant="primary" onClick={() => setShowAdd(true)}>+ Add Ticket Type</Btn>} />
      <div className="p-5">
        {types.length === 0 ? (
          <EmptyState title="No ticket types yet — add one before publishing" action={<Btn variant="primary" onClick={() => setShowAdd(true)}>+ Add Ticket Type</Btn>} />
        ) : (
          <div className="space-y-2">
            {types.map((t: any) => (
              <div key={t._id} className="border border-slate-100 rounded-lg p-4 flex items-center justify-between flex-wrap gap-2">
                <div>
                  <div className="font-semibold text-sm text-slate-900">{t.name} {t.isComplimentary && <span className="text-xs text-emerald-600 ml-1">(Free)</span>}</div>
                  <div className="text-xs text-slate-500">{t.soldCount} / {t.capacity} sold</div>
                  {!t.isComplimentary && t.priceTiers?.length > 0 && (
                    <div className="text-xs text-slate-400 mt-1">{t.priceTiers.map((p: any) => `${p.name}: ₨${p.price}`).join(' · ')}</div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Btn size="xs" variant="secondary" onClick={() => setEditing(t)}>Edit</Btn>
                  {t.soldCount === 0 && (
                    <Btn size="xs" variant="danger" onClick={() => { if (window.confirm(`Delete "${t.name}"?`)) deleteMut.mutate(t._id, { onSuccess: () => toast.success('Deleted') }); }}>Delete</Btn>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

// ─── Promo Codes ─────────────────────────────────────────────────────────

function PromoCodeModal({ eventId, onClose }: { eventId: string; onClose: () => void }) {
  const [form, setForm] = useState({ code: '', discountType: 'percentage', discountValue: 10, maxUses: '', expiresAt: '' });
  const createMut = useCreatePromoCode(eventId);
  const submit = () => createMut.mutate(
    { ...form, discountValue: Number(form.discountValue), maxUses: form.maxUses ? Number(form.maxUses) : undefined, expiresAt: form.expiresAt || undefined },
    { onSuccess: () => { toast.success('Promo code added'); onClose(); }, onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to add') },
  );
  return (
    <Modal title="New Promo Code" onClose={onClose} footer={<><Btn variant="secondary" onClick={onClose}>Cancel</Btn><Btn variant="primary" onClick={submit} disabled={createMut.isPending || !form.code.trim()}>Add</Btn></>}>
      <FormField label="Code" required><FInput value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="EARLYBIRD10" /></FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Discount Type"><FSelect value={form.discountType} onChange={e => setForm(p => ({ ...p, discountType: e.target.value }))}><option value="percentage">Percentage (%)</option><option value="flat">Flat Amount (₨)</option></FSelect></FormField>
        <FormField label="Value" required><FInput type="number" value={form.discountValue} onChange={e => setForm(p => ({ ...p, discountValue: Number(e.target.value) }))} /></FormField>
        <FormField label="Max Uses (optional)"><FInput type="number" value={form.maxUses} onChange={e => setForm(p => ({ ...p, maxUses: e.target.value }))} placeholder="Unlimited" /></FormField>
        <FormField label="Expires (optional)"><FInput type="date" value={form.expiresAt} onChange={e => setForm(p => ({ ...p, expiresAt: e.target.value }))} /></FormField>
      </div>
    </Modal>
  );
}

function PromoCodesTab({ event }: { event: any }) {
  const [showAdd, setShowAdd] = useState(false);
  const deleteMut = useDeletePromoCode(event._id);
  const codes = event.promoCodes ?? [];
  return (
    <Card>
      {showAdd && <PromoCodeModal eventId={event._id} onClose={() => setShowAdd(false)} />}
      <CardHeader title="Promo Codes" actions={<Btn size="sm" variant="primary" onClick={() => setShowAdd(true)}>+ Add Promo Code</Btn>} />
      <div className="p-5">
        {codes.length === 0 ? <EmptyState icon="🏷️" title="No promo codes yet" /> : (
          <div className="space-y-2">
            {codes.map((c: any) => (
              <div key={c._id} className="border border-slate-100 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <code className="font-mono font-semibold text-sm">{c.code}</code>
                  <span className="text-xs text-slate-500 ml-2">{c.discountType === 'percentage' ? `${c.discountValue}% off` : `₨${c.discountValue} off`} · used {c.usedCount}{c.maxUses ? `/${c.maxUses}` : ''}</span>
                </div>
                <button onClick={() => deleteMut.mutate(c._id, { onSuccess: () => toast.success('Deleted') })} className="text-xs text-red-500 hover:underline">Delete</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

// ─── Box Office ────────────────────────────────────────────────────────────

function BoxOfficeOrderModal({ event, onClose }: { event: any; onClose: () => void }) {
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [qty, setQty] = useState<Record<string, number>>({});
  const createMut = useCreateBoxOfficeOrder(event._id);

  const items = Object.entries(qty).filter(([, q]) => q > 0).map(([ticketTypeId, quantity]) => ({ ticketTypeId, quantity }));
  const submit = () => {
    if (!buyerName.trim() || items.length === 0) { toast.error('Buyer name and at least one ticket required'); return; }
    createMut.mutate({ buyerName, buyerPhone, paymentMethod, items }, {
      onSuccess: () => { toast.success('Order created'); onClose(); },
      onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to create order'),
    });
  };

  return (
    <Modal title="Box Office — Walk-up Sale" onClose={onClose} wide
      footer={<><Btn variant="secondary" onClick={onClose}>Cancel</Btn><Btn variant="primary" onClick={submit} disabled={createMut.isPending}>{createMut.isPending ? 'Processing…' : 'Complete Sale'}</Btn></>}>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Buyer Name" required><FInput value={buyerName} onChange={e => setBuyerName(e.target.value)} /></FormField>
        <FormField label="Phone"><FInput value={buyerPhone} onChange={e => setBuyerPhone(e.target.value)} /></FormField>
      </div>
      <FormField label="Payment Method">
        <FSelect value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
          <option value="cash">Cash (paid now)</option>
          <option value="complimentary">Complimentary (free)</option>
          <option value="bank_transfer">Bank Transfer (pending confirmation)</option>
          <option value="at_door">Pay at Door (pending confirmation)</option>
        </FSelect>
      </FormField>
      <FormField label="Tickets">
        <div className="space-y-2">
          {(event.ticketTypes ?? []).filter((t: any) => t.isActive !== false).map((t: any) => (
            <div key={t._id} className="flex items-center justify-between border border-slate-100 rounded-lg p-2.5">
              <div className="text-sm">{t.name} <span className="text-xs text-slate-400">({t.capacity - t.soldCount} left)</span></div>
              <FInput type="number" min={0} className="w-20" value={qty[t._id] || 0} onChange={e => setQty(p => ({ ...p, [t._id]: parseInt(e.target.value) || 0 }))} />
            </div>
          ))}
        </div>
      </FormField>
    </Modal>
  );
}

function BoxOfficeTab({ event }: { event: any }) {
  const [showSale, setShowSale] = useState(false);
  const { data: orders, isLoading } = useOrders(event._id);
  const markPaidMut = useMarkOrderPaid(event._id);
  const cancelMut = useCancelOrder(event._id);
  const rows = (orders as any[]) ?? [];

  return (
    <Card>
      {showSale && <BoxOfficeOrderModal event={event} onClose={() => setShowSale(false)} />}
      <CardHeader title="Orders" subtitle="All ticket sales — online, box office, and pending-payment reservations" actions={<Btn size="sm" variant="primary" onClick={() => setShowSale(true)}>+ Walk-up Sale</Btn>} />
      <div className="p-5">
        {isLoading ? <div className="text-center text-slate-400 py-8">Loading…</div> : rows.length === 0 ? <EmptyState title="No orders yet" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="text-left text-slate-400 border-b border-slate-100">
                <th className="py-2 pr-3">Order</th><th className="py-2 pr-3">Buyer</th><th className="py-2 pr-3">Items</th><th className="py-2 pr-3">Total</th><th className="py-2 pr-3">Method</th><th className="py-2 pr-3">Status</th><th className="py-2 pr-3"></th>
              </tr></thead>
              <tbody className="divide-y divide-slate-50">
                {rows.map((o: any) => (
                  <tr key={o._id}>
                    <td className="py-2 pr-3 font-mono">{o.orderNo}</td>
                    <td className="py-2 pr-3">{o.buyerName}</td>
                    <td className="py-2 pr-3">{o.items.map((i: any) => `${i.quantity}x ${i.ticketTypeName}`).join(', ')}</td>
                    <td className="py-2 pr-3">₨{o.totalAmount.toLocaleString()}</td>
                    <td className="py-2 pr-3 capitalize">{o.paymentMethod.replace(/_/g, ' ')}</td>
                    <td className="py-2 pr-3"><Badge status={o.status} small /></td>
                    <td className="py-2 pr-3">
                      <div className="flex gap-2">
                        {o.status === 'pending_payment' && (
                          <button onClick={() => markPaidMut.mutate(o._id, { onSuccess: () => toast.success('Marked paid') })} className="text-[#0C447C] hover:underline">Mark Paid</button>
                        )}
                        {(o.status === 'pending_payment' || o.status === 'paid') && (
                          <button onClick={() => { if (window.confirm('Cancel/refund this order?')) cancelMut.mutate({ orderId: o._id }, { onSuccess: () => toast.success('Done') }); }} className="text-red-500 hover:underline">
                            {o.status === 'paid' ? 'Refund' : 'Cancel'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  );
}

// ─── Attendees ─────────────────────────────────────────────────────────────

function AttendeesTab({ event, selected, onToggleSelect }: { event: any; selected: Set<string>; onToggleSelect: (id: string) => void }) {
  const { data: attendees, isLoading } = useAttendees(event._id);
  const rows = (attendees as any[]) ?? [];
  return (
    <Card>
      <CardHeader title="Attendees" subtitle={`${rows.length} ticket(s)`} />
      <div className="p-5">
        {isLoading ? <div className="text-center text-slate-400 py-8">Loading…</div> : rows.length === 0 ? <EmptyState title="No attendees yet" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="text-left text-slate-400 border-b border-slate-100">
                <th className="py-2 pr-3"></th><th className="py-2 pr-3">Name</th><th className="py-2 pr-3">Ticket Type</th><th className="py-2 pr-3">Contact</th><th className="py-2 pr-3">Status</th><th className="py-2 pr-3">Badge</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-50">
                {rows.map((t: any) => (
                  <tr key={t._id}>
                    <td className="py-2 pr-3"><input type="checkbox" checked={selected.has(t._id)} onChange={() => onToggleSelect(t._id)} /></td>
                    <td className="py-2 pr-3 font-medium">{t.attendeeName}</td>
                    <td className="py-2 pr-3">{t.ticketTypeName}</td>
                    <td className="py-2 pr-3 text-slate-500">{t.attendeeEmail || t.attendeePhone || '—'}</td>
                    <td className="py-2 pr-3"><Badge status={t.status} small /></td>
                    <td className="py-2 pr-3">{t.badgePrinted ? '✓ Printed' : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  );
}

// ─── Check-In ───────────────────────────────────────────────────────────

function QrScannerModal({ onDetect, onClose }: { onDetect: (code: string) => void; onClose: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const elId = 'event-checkin-scanner';
  useState(() => {
    let cancelled = false; let instance: any = null;
    (async () => {
      try {
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode');
        if (cancelled) return;
        instance = new Html5Qrcode(elId, { formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE], verbose: false });
        await instance.start({ facingMode: 'environment' }, { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText: string) => onDetect(decodedText), () => {});
      } catch (err: any) {
        setError(err?.message || 'Camera unavailable — search by name instead.');
      }
    })();
    return () => { cancelled = true; const i = instance; if (i?.isScanning) i.stop().then(() => i.clear()).catch(() => {}); else i?.clear?.().catch?.(() => {}); };
  });
  return (
    <Modal title="Scan Ticket QR" onClose={onClose}>
      {error ? <p className="text-xs text-red-500 py-4 text-center">{error}</p> : <div id={elId} className="rounded-lg overflow-hidden bg-slate-900 min-h-[220px]" />}
      <p className="text-[11px] text-slate-400 mt-3 text-center">Point the camera at the attendee's QR ticket.</p>
    </Modal>
  );
}

function CheckInTab({ event }: { event: any }) {
  const [showScanner, setShowScanner] = useState(false);
  const [search, setSearch] = useState('');
  const [gate, setGate] = useState('');
  const checkInMut = useCheckIn(event._id);
  const { data: searchResults } = useCheckInSearch(event._id, search);

  const doCheckIn = (qrToken: string) => {
    checkInMut.mutate({ qrToken, gate: gate || undefined }, {
      onSuccess: (t: any) => toast.success(`✓ ${t.attendeeName} checked in`),
      onError: (e: any) => toast.error(e?.response?.data?.message || 'Check-in failed'),
    });
  };

  return (
    <Card>
      {showScanner && <QrScannerModal onClose={() => setShowScanner(false)} onDetect={(code) => { doCheckIn(code); setShowScanner(false); }} />}
      <CardHeader title="Door Entry / Check-In" actions={<Btn size="sm" variant="primary" onClick={() => setShowScanner(true)}>📷 Scan QR</Btn>} />
      <div className="p-5 space-y-4">
        <FormField label="Gate / Entry Point (optional)">
          <FInput value={gate} onChange={e => setGate(e.target.value)} placeholder="Main Gate, Gate 2…" className="max-w-xs" />
        </FormField>
        <FormField label="Or search by name">
          <FInput value={search} onChange={e => setSearch(e.target.value)} placeholder="Type attendee name…" />
        </FormField>
        <div className="space-y-2">
          {((searchResults as any[]) ?? []).map((t: any) => (
            <div key={t._id} className="flex items-center justify-between border border-slate-100 rounded-lg p-3">
              <div>
                <div className="font-medium text-sm">{t.attendeeName}</div>
                <div className="text-xs text-slate-500">{t.ticketTypeName}</div>
              </div>
              {t.status === 'checked_in' ? <Badge status="checked_in" /> : (
                <Btn size="xs" variant="primary" onClick={() => doCheckIn(t.qrToken)} disabled={checkInMut.isPending}>Check In</Btn>
              )}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

// ─── Badges ─────────────────────────────────────────────────────────────

function BadgesTab({ event, selected, onToggleSelect }: { event: any; selected: Set<string>; onToggleSelect: (id: string) => void }) {
  const { data: attendees } = useAttendees(event._id);
  const rows = ((attendees as any[]) ?? []).filter((t: any) => t.status === 'valid' || t.status === 'checked_in');
  const [generating, setGenerating] = useState(false);

  const generate = async (ids: string[]) => {
    if (ids.length === 0) { toast.error('Select at least one attendee'); return; }
    setGenerating(true);
    try {
      await eventsApi.generateBadges(ids);
      toast.success('Badges generated');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to generate badges');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader title="Badges" subtitle="Print badges for check-in-ready attendees — at the desk or in advance"
        actions={<Btn size="sm" variant="primary" onClick={() => generate(Array.from(selected))} disabled={generating}>{generating ? 'Generating…' : `🖨 Print ${selected.size || 'All'} Badge(s)`}</Btn>} />
      <div className="p-5">
        {rows.length === 0 ? <EmptyState title="No paid attendees to badge yet" /> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {rows.map((t: any) => (
              <label key={t._id} className="flex items-center gap-2 border border-slate-100 rounded-lg p-2.5 text-sm cursor-pointer">
                <input type="checkbox" checked={selected.has(t._id)} onChange={() => onToggleSelect(t._id)} />
                <span>{t.attendeeName} <span className="text-xs text-slate-400">({t.ticketTypeName})</span></span>
                {t.badgePrinted && <span className="text-[10px] text-emerald-600 ml-auto">✓ printed</span>}
              </label>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

// ─── Main ───────────────────────────────────────────────────────────────

export default function EventDetailPage() {
  const { id } = useParams();
  const { data: event, isLoading } = useEvent(id);
  const [active, setActive] = useState<Tab>('overview');
  const [selectedAttendees, setSelectedAttendees] = useState<Set<string>>(new Set());

  const toggleSelect = (ticketId: string) => setSelectedAttendees((prev) => {
    const next = new Set(prev);
    if (next.has(ticketId)) next.delete(ticketId); else next.add(ticketId);
    return next;
  });

  if (isLoading || !event) return <div className="text-center text-slate-400 py-16">Loading…</div>;
  const e = event as any;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-100">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActive(t.id)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${active === t.id ? 'border-[#0C447C] text-[#0C447C]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            {t.label}
          </button>
        ))}
      </div>
      {active === 'overview' && <OverviewTab event={e} />}
      {active === 'tickets' && <TicketTypesTab event={e} />}
      {active === 'promo' && <PromoCodesTab event={e} />}
      {active === 'boxoffice' && <BoxOfficeTab event={e} />}
      {active === 'attendees' && <AttendeesTab event={e} selected={selectedAttendees} onToggleSelect={toggleSelect} />}
      {active === 'checkin' && <CheckInTab event={e} />}
      {active === 'badges' && <BadgesTab event={e} selected={selectedAttendees} onToggleSelect={toggleSelect} />}
    </div>
  );
}
