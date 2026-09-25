import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useEvent, useCheckIn, useCheckInSearch, useGateStats, K } from './hooks';
import { FInput, Btn } from './shared';
import eventsApi from './api';
import { safeParseLocalStorage } from '../../lib/safeParseLocalStorage';

type QueuedCheckIn = { qrToken: string; gate?: string; attendeeHint?: string; queuedAt: number };

// A gate device can lose signal mid-event (a packed hall, a spotty campus
// router) - rather than losing scans, a failed check-in that looks like a
// network problem (no response at all, not a rejection from the server)
// gets queued here and retried automatically once connectivity returns.
function queueKey(eventId: string) {
  return `kiosk_offline_queue_${eventId}`;
}
function readQueue(eventId: string): QueuedCheckIn[] {
  return safeParseLocalStorage<QueuedCheckIn[]>(queueKey(eventId)) || [];
}
function writeQueue(eventId: string, queue: QueuedCheckIn[]) {
  try { localStorage.setItem(queueKey(eventId), JSON.stringify(queue)); } catch { /* storage unavailable */ }
}

// Fullscreen, chrome-free door-entry mode for a tablet/phone propped at a
// gate - deliberately outside the tabbed admin console (EventDetailPage)
// and its Layout sidebar, since door staff need a big scan target and
// nothing else. Multiple devices can run this simultaneously against
// different gates; getGateStats (polled) shows each gate's running count.
export default function EventKioskPage() {
  const { id } = useParams();
  const { data: event } = useEvent(id);
  const [gate, setGate] = useState(() => (id ? localStorage.getItem(`kiosk_gate_${id}`) || '' : ''));
  const [gateLocked, setGateLocked] = useState(!!gate);
  const [search, setSearch] = useState('');
  const [flash, setFlash] = useState<{ ok: boolean; text: string } | null>(null);
  const scannerRef = useRef<any>(null);
  const lastCodeRef = useRef<{ code: string; at: number } | null>(null);
  const checkInMut = useCheckIn(id as string);
  const { data: searchResults } = useCheckInSearch(id as string, search);
  const { data: gateStats } = useGateStats(id, { refetchInterval: 10000 });
  const myGateCount = ((gateStats as any[]) ?? []).find((s: any) => s.gate === (gate || 'Unspecified'))?.count ?? 0;
  const qc = useQueryClient();
  const [pendingCount, setPendingCount] = useState(() => (id ? readQueue(id).length : 0));
  const flushingRef = useRef(false);

  const flushQueue = async () => {
    if (!id || flushingRef.current || !navigator.onLine) return;
    flushingRef.current = true;
    try {
      let queue = readQueue(id);
      while (queue.length > 0) {
        const [next, ...rest] = queue;
        try {
          await eventsApi.checkIn(id, next.qrToken, next.gate);
        } catch (e: any) {
          if (!e?.response) break; // still offline/unreachable — stop and retry later, keep the whole queue intact
          // a real rejection from the server (already checked in, invalid ticket, etc.) — drop it, nothing more to retry
        }
        queue = rest;
        writeQueue(id, queue);
        setPendingCount(queue.length);
      }
      qc.invalidateQueries({ queryKey: K.attendees(id) });
      qc.invalidateQueries({ queryKey: K.gateStats(id) });
    } finally {
      flushingRef.current = false;
    }
  };

  const doCheckIn = (qrToken: string) => {
    const now = Date.now();
    if (lastCodeRef.current?.code === qrToken && now - lastCodeRef.current.at < 4000) return; // debounce the same code re-firing while it's still in frame
    lastCodeRef.current = { code: qrToken, at: now };
    checkInMut.mutate({ qrToken, gate: gate || undefined }, {
      onSuccess: (t: any) => setFlash({ ok: true, text: `✓ ${t.attendeeName}` }),
      onError: (e: any) => {
        if (!e?.response && id) {
          // no response at all - the network dropped, not a rejection. Queue it so a
          // real check-in isn't lost, and retry automatically once connectivity returns.
          const queue = readQueue(id);
          queue.push({ qrToken, gate: gate || undefined, queuedAt: Date.now() });
          writeQueue(id, queue);
          setPendingCount(queue.length);
          setFlash({ ok: true, text: `📡 Queued offline (${queue.length} pending)` });
          return;
        }
        setFlash({ ok: false, text: e?.response?.data?.message || 'Check-in failed' });
      },
    });
  };

  useEffect(() => {
    if (!id) return;
    flushQueue();
    const onOnline = () => flushQueue();
    window.addEventListener('online', onOnline);
    const interval = setInterval(flushQueue, 15000);
    return () => { window.removeEventListener('online', onOnline); clearInterval(interval); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!gateLocked) return;
    let cancelled = false;
    (async () => {
      try {
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode');
        if (cancelled) return;
        const instance = new Html5Qrcode('kiosk-scanner', { formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE], verbose: false });
        scannerRef.current = instance;
        await instance.start({ facingMode: 'environment' }, { fps: 10, qrbox: { width: 280, height: 280 } },
          (decodedText: string) => doCheckIn(decodedText), () => {});
      } catch (err: any) {
        toast.error(err?.message || 'Camera unavailable — use name search below.');
      }
    })();
    return () => {
      cancelled = true;
      const i = scannerRef.current;
      if (i?.isScanning) i.stop().then(() => i.clear()).catch(() => {}); else i?.clear?.().catch?.(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gateLocked]);

  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 2500);
    return () => clearTimeout(t);
  }, [flash]);

  if (!gateLocked) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center">
          <div className="text-3xl mb-2">🚪</div>
          <div className="font-bold text-slate-900 mb-1">{(event as any)?.title || 'Kiosk Check-In'}</div>
          <p className="text-xs text-slate-500 mb-4">Name this gate/device before scanning starts.</p>
          <FInput autoFocus value={gate} onChange={e => setGate(e.target.value)} placeholder="Main Gate, Gate 2…" className="mb-3 text-center" />
          <Btn variant="primary" className="w-full justify-center" onClick={() => { if (id) localStorage.setItem(`kiosk_gate_${id}`, gate); setGateLocked(true); }}>Start Scanning</Btn>
          <Link to={`/events/${id}`} className="block mt-3 text-xs text-slate-400 hover:underline">← Back to admin console</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
        <div>
          <div className="text-sm font-semibold">{(event as any)?.title}</div>
          <div className="text-xs text-slate-400">Gate: {gate || 'Unspecified'} · {myGateCount} checked in here</div>
        </div>
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <span className="text-xs px-2 py-1 rounded-full bg-amber-500/20 text-amber-300">📡 {pendingCount} pending sync</span>
          )}
          <Link to={`/events/${id}`} className="text-xs text-slate-400 hover:underline">Exit Kiosk</Link>
          <button onClick={() => setGateLocked(false)} className="text-xs text-slate-400 hover:underline">Change Gate</button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4 gap-4">
        {flash && (
          <div className={`w-full max-w-md text-center py-4 rounded-xl text-lg font-bold ${flash.ok ? 'bg-emerald-600' : 'bg-red-600'}`}>{flash.text}</div>
        )}
        <div id="kiosk-scanner" className="w-full max-w-md aspect-square rounded-2xl overflow-hidden bg-black" />
        <div className="w-full max-w-md">
          <FInput value={search} onChange={e => setSearch(e.target.value)} placeholder="Or search by attendee name…"
            className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500" />
          {((searchResults as any[]) ?? []).length > 0 && (
            <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto">
              {((searchResults as any[]) ?? []).map((t: any) => (
                <button key={t._id} onClick={() => { doCheckIn(t.qrToken); setSearch(''); }}
                  disabled={t.status === 'checked_in'}
                  className="w-full text-left px-3 py-2 bg-slate-800 rounded-lg text-sm flex items-center justify-between disabled:opacity-50">
                  <span>{t.attendeeName} <span className="text-slate-500 text-xs">({t.ticketTypeName})</span></span>
                  {t.status === 'checked_in' && <span className="text-emerald-400 text-xs">✓ In</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
