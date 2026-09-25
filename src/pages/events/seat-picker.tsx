// Shared between the admin Seating tab (live occupancy view) and both
// checkout paths (box office + public) picking specific seats.
export function SeatGrid({
  seats, selectedSeatIds, onToggle, readOnly,
}: {
  seats: any[];
  selectedSeatIds: Set<string>;
  onToggle?: (seatId: string) => void;
  readOnly?: boolean;
}) {
  const rows = Array.from(new Set(seats.map((s: any) => s.row))).sort();
  return (
    <div className="space-y-2 overflow-x-auto pb-1">
      {rows.map((row) => (
        <div key={row} className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-400 w-6 shrink-0">{row}</span>
          <div className="flex gap-1 flex-wrap">
            {seats.filter((s: any) => s.row === row).sort((a: any, b: any) => a.number - b.number).map((s: any) => {
              const taken = s.status === 'taken';
              const selected = selectedSeatIds.has(s.seatId);
              const disabled = readOnly || (taken && !selected);
              return (
                <button
                  key={s.seatId} type="button" disabled={disabled}
                  onClick={() => onToggle?.(s.seatId)}
                  title={taken ? `Taken${s.attendeeName ? ` — ${s.attendeeName}` : ''}` : s.seatId}
                  className={`w-8 h-8 text-[10px] rounded flex items-center justify-center border font-medium transition-colors shrink-0
                    ${selected ? 'bg-[#0C447C] text-white border-[#0C447C]' :
                      taken ? 'bg-slate-200 text-slate-400 border-slate-200 cursor-not-allowed' :
                      readOnly ? 'bg-emerald-50 text-emerald-600 border-emerald-200 cursor-default' :
                      'bg-white text-slate-600 border-slate-200 hover:border-[#0C447C] cursor-pointer'}`}
                >
                  {s.number}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export function SeatLegend() {
  return (
    <div className="flex items-center gap-4 text-[11px] text-slate-500">
      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-white border border-slate-200 inline-block" /> Available</span>
      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#0C447C] inline-block" /> Selected</span>
      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-200 inline-block" /> Taken</span>
    </div>
  );
}

// Deterministic A, B, ... Z, AA, AB... row label generator for the layout
// generator below.
export function rowLabel(index: number): string {
  let n = index, label = '';
  do { label = String.fromCharCode(65 + (n % 26)) + label; n = Math.floor(n / 26) - 1; } while (n >= 0);
  return label;
}

export function generateSeats(rowCount: number, seatsPerRow: number): any[] {
  const seats: any[] = [];
  for (let r = 0; r < rowCount; r++) {
    const row = rowLabel(r);
    for (let n = 1; n <= seatsPerRow; n++) {
      seats.push({ seatId: `${row}-${n}`, row, number: n, ticketTypeId: null });
    }
  }
  return seats;
}
