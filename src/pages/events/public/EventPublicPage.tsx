import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { usePublicEvent, useCheckout } from '../hooks';
import { SeatGrid, SeatLegend } from '../seat-picker';

function money(n: number) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`;
}

export default function EventPublicPage() {
  const { schoolSlug, eventSlug } = useParams<{ schoolSlug: string; eventSlug: string }>();
  const { data: event, isLoading, error } = usePublicEvent(schoolSlug, eventSlug);
  const checkoutMut = useCheckout(schoolSlug as string, event?._id);

  const [qty, setQty] = useState<Record<string, number>>({});
  const [seatsByType, setSeatsByType] = useState<Record<string, string[]>>({});
  const [promoCode, setPromoCode] = useState('');
  const [buyer, setBuyer] = useState({ name: '', email: '', phone: '' });
  const [confirmed, setConfirmed] = useState<any>(null);

  const ticketTypes = (event?.ticketTypes as any[]) ?? [];
  const theme = event?.theme ?? {};
  const primaryColor = theme.primaryColor || '#0C447C';
  const hasReservedSeating = !!event?.hasReservedSeating;
  const seatMapSeats = event?.seatMap?.seats ?? [];
  const takenElsewhere = new Set(Object.values(seatsByType).flat());

  const setQtyFor = (id: string, v: number) => {
    setQty(p => ({ ...p, [id]: Math.max(0, v) }));
    setSeatsByType(p => ({ ...p, [id]: (p[id] || []).slice(0, v) }));
  };
  const toggleSeat = (ticketTypeId: string, seatId: string, limit: number) => {
    setSeatsByType((prev) => {
      const current = prev[ticketTypeId] || [];
      if (current.includes(seatId)) return { ...prev, [ticketTypeId]: current.filter((s) => s !== seatId) };
      if (current.length >= limit) { toast.error(`Select at most ${limit} seat(s) for this ticket`); return prev; }
      return { ...prev, [ticketTypeId]: [...current, seatId] };
    });
  };

  const lineItems = ticketTypes
    .map(tt => ({
      ticketTypeId: tt._id, name: tt.name, price: tt.currentPrice ?? tt.price, quantity: qty[tt._id] || 0,
      seatIds: (seatsByType[tt._id] || []).length ? seatsByType[tt._id] : undefined,
    }))
    .filter(li => li.quantity > 0);
  const subtotal = lineItems.reduce((s, li) => s + li.price * li.quantity, 0);
  const totalTickets = lineItems.reduce((s, li) => s + li.quantity, 0);

  const submit = () => {
    if (totalTickets === 0) { toast.error('Select at least one ticket'); return; }
    if (!buyer.name.trim() || !buyer.email.trim()) { toast.error('Name and email are required'); return; }
    if (hasReservedSeating) {
      for (const li of lineItems) {
        if ((li.seatIds?.length || 0) !== li.quantity) { toast.error(`Select a seat for every ${li.name} ticket`); return; }
      }
    }
    checkoutMut.mutate(
      {
        buyerName: buyer.name, buyerEmail: buyer.email, buyerPhone: buyer.phone,
        items: lineItems.map(li => ({ ticketTypeId: li.ticketTypeId, quantity: li.quantity, seatIds: li.seatIds })),
        promoCode: promoCode.trim() || undefined,
        paymentMethod: 'bank_transfer',
      },
      {
        onSuccess: (res: any) => { setConfirmed(res); toast.success('Order placed'); },
        onError: (e: any) => toast.error(e?.response?.data?.message || 'Checkout failed'),
      },
    );
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading…</div>;
  }
  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-4">
        <div>
          <div className="text-4xl mb-2">🔍</div>
          <div className="font-semibold text-slate-700">Event not found</div>
          <div className="text-sm text-slate-400 mt-1">This event may be unpublished or the link is incorrect.</div>
        </div>
      </div>
    );
  }

  if (confirmed) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 max-w-lg w-full p-8 text-center">
          <div className="text-5xl mb-3">🎉</div>
          <div className="text-xl font-bold text-slate-900 mb-1">Order Confirmed</div>
          <div className="text-sm text-slate-500 mb-4">Order #{confirmed.orderNo}</div>
          <p className="text-sm text-slate-600">
            We've reserved {totalTickets} ticket(s) for <strong>{event.title}</strong>. Since online payment isn't
            enabled for this school yet, please complete payment via bank transfer or at the door — see the
            confirmation email sent to <strong>{buyer.email}</strong> for details. Your tickets/QR codes will be
            issued once payment is confirmed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="relative h-56 sm:h-72 bg-slate-800 overflow-hidden">
        {theme.bannerUrl ? (
          <img src={theme.bannerUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${primaryColor}, #1a1a2e)` }} />
        )}
        <div className="absolute inset-0 bg-black/30 flex items-end">
          <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 pb-6 flex items-center gap-4">
            {theme.logoUrl && (
              <img src={theme.logoUrl} alt="" className="w-16 h-16 rounded-lg bg-white object-contain p-1 shadow-md shrink-0" />
            )}
            <div>
              <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-white/20 text-white capitalize">
                {event.category?.replace(/_/g, ' ')}
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mt-1">{event.title}</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 gap-6">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600 mb-3">
            {event.sessions?.[0]?.startAt && (
              <div className="flex items-center gap-1.5">
                📅 {new Date(event.sessions[0].startAt).toLocaleString(undefined, { weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
            {event.venueName && <div className="flex items-center gap-1.5">📍 {event.venueName}{event.venueAddress ? `, ${event.venueAddress}` : ''}</div>}
          </div>
          {event.description && <p className="text-sm text-slate-600 whitespace-pre-line">{event.description}</p>}
        </div>

        {event.sponsors?.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">
              {event.sponsors.length === 1 ? 'Sponsor' : 'Sponsors'}
            </div>
            <div className="flex flex-wrap gap-4">
              {[...event.sponsors].sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)).map((s: any, i: number) => {
                const inner = (
                  <div className="flex items-center gap-2">
                    {s.logoUrl ? (
                      <img src={s.logoUrl} alt={s.name} className="h-10 max-w-[120px] object-contain" />
                    ) : (
                      <span className="text-sm font-medium text-slate-700">{s.name}</span>
                    )}
                    {s.tier && <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">{s.tier}</span>}
                  </div>
                );
                return s.websiteUrl ? (
                  <a key={s._id || i} href={s.websiteUrl} target="_blank" rel="noopener noreferrer" className="hover:opacity-80">{inner}</a>
                ) : (
                  <div key={s._id || i}>{inner}</div>
                );
              })}
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 font-semibold text-slate-800 text-sm">Tickets</div>
          <div className="p-5 space-y-3">
            {ticketTypes.length === 0 ? (
              <div className="text-sm text-slate-400 text-center py-6">Tickets aren't available yet — check back soon.</div>
            ) : ticketTypes.map((tt: any) => {
              const soldOut = tt.availableCount <= 0;
              const q = qty[tt._id] || 0;
              const seatsForType = hasReservedSeating
                ? seatMapSeats.filter((s: any) => (!s.ticketTypeId || s.ticketTypeId === tt._id) && (s.status === 'available' || (seatsByType[tt._id] || []).includes(s.seatId)) && !takenElsewhere.has(s.seatId))
                : [];
              return (
                <div key={tt._id} className={`p-3 rounded-lg border ${soldOut ? 'border-slate-100 bg-slate-50 opacity-60' : 'border-slate-200'}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium text-sm text-slate-900">{tt.name}</div>
                      {tt.description && <div className="text-xs text-slate-500">{tt.description}</div>}
                      <div className="text-xs text-slate-400 mt-0.5">{soldOut ? 'Sold out' : `${tt.availableCount} left`}</div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="font-semibold text-sm text-slate-900 w-20 text-right">
                        {tt.isComplimentary || tt.currentPrice === 0 ? 'Free' : money(tt.currentPrice ?? tt.price)}
                      </div>
                      <input
                        type="number" min={0} max={tt.availableCount} disabled={soldOut}
                        value={q}
                        onChange={e => setQtyFor(tt._id, Math.min(tt.availableCount, Number(e.target.value) || 0))}
                        className="w-16 px-2 py-1.5 text-sm text-center border border-slate-200 rounded-lg focus:outline-none focus:ring-2 disabled:bg-slate-100"
                        style={{ ['--tw-ring-color' as any]: primaryColor }}
                      />
                    </div>
                  </div>
                  {hasReservedSeating && q > 0 && (
                    <div className="mt-2.5 pt-2.5 border-t border-slate-100">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                        <span>Pick {q} seat(s) — {(seatsByType[tt._id] || []).length}/{q} selected</span>
                        <SeatLegend />
                      </div>
                      <SeatGrid
                        seats={seatsForType.map((s: any) => ({ ...s, status: (seatsByType[tt._id] || []).includes(s.seatId) ? 'available' : s.status }))}
                        selectedSeatIds={new Set(seatsByType[tt._id] || [])}
                        onToggle={(seatId) => toggleSeat(tt._id, seatId, q)}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {ticketTypes.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-4">
            <div className="font-semibold text-slate-800 text-sm">Your Details</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input placeholder="Full name" value={buyer.name} onChange={e => setBuyer(p => ({ ...p, name: e.target.value }))}
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]" />
              <input placeholder="Email" type="email" value={buyer.email} onChange={e => setBuyer(p => ({ ...p, email: e.target.value }))}
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]" />
              <input placeholder="Phone (optional)" value={buyer.phone} onChange={e => setBuyer(p => ({ ...p, phone: e.target.value }))}
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]" />
              <input placeholder="Promo code (optional)" value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())}
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]" />
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <div className="text-sm text-slate-600">{totalTickets} ticket(s)</div>
              <div className="text-lg font-bold text-slate-900">{money(subtotal)}</div>
            </div>
            <p className="text-xs text-slate-400">
              Online payment isn't set up for this school yet — after placing your order you'll receive an email with
              bank transfer details, or you can pay at the door.
            </p>
            <button
              onClick={submit}
              disabled={checkoutMut.isPending || totalTickets === 0}
              className="w-full py-3 rounded-lg font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              style={{ backgroundColor: primaryColor }}
            >
              {checkoutMut.isPending ? 'Placing order…' : `Reserve ${totalTickets || ''} Ticket(s)`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
