import { AGE_BAND_COLORS, AgeBandId } from './ageBand';

export interface ZoneSignData {
  name: string;
  urduLabel?: string | null;
  color?: AgeBandId | string | null;
}

export type ZoneSignSize = 'A5' | 'A4' | 'A3';

// Library Shelf Visual Guide calls for a Zone-level sign to be readable
// from across the room - much larger than the A4 bay signs and the small
// shelf-edge labels `barcode.ts` already prints. Libraries vary a lot in
// size school to school, so the admin picks a paper size per sign rather
// than this being fixed; title size scales up with the page so it stays
// proportionally "room visible" at every size.
const SIZE_SPEC: Record<ZoneSignSize, { titlePt: number; urduPt: number; borderMm: number; label: string }> = {
  A5: { titlePt: 56, urduPt: 30, borderMm: 4, label: 'Small (A5)' },
  A4: { titlePt: 80, urduPt: 42, borderMm: 6, label: 'Medium (A4)' },
  A3: { titlePt: 120, urduPt: 60, borderMm: 9, label: 'Large (A3)' },
};

export const ZONE_SIGN_SIZE_OPTIONS: { value: ZoneSignSize; label: string }[] =
  (Object.keys(SIZE_SPEC) as ZoneSignSize[]).map((value) => ({ value, label: SIZE_SPEC[value].label }));

// Same hidden-iframe + window.print() shape as printBookBarcodeLabels in
// this folder - isolates the print job from whatever modal is open behind
// it. Unlike the 3-up barcode sheet, a zone sign is one single sign per
// print job: it's meant to be cut out (or printed on card) and physically
// posted at the zone, not issued as a batch.
export function printZoneSign(zone: ZoneSignData, size: ZoneSignSize = 'A4') {
  if (!zone?.name) return;
  const spec = SIZE_SPEC[size];
  const accent = zone.color ? AGE_BAND_COLORS[zone.color as AgeBandId] : null;
  const esc = (s: string) => s.replace(/</g, '&lt;');

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);
  const doc = iframe.contentWindow?.document;
  if (!doc) { document.body.removeChild(iframe); return; }
  doc.open();
  doc.write(`<!doctype html><html><head><title>Zone Sign - ${esc(zone.name)}</title><style>
    @page { size: ${size}; margin: 0; }
    * { box-sizing: border-box; }
    html, body { height: 100%; margin: 0; }
    body { font-family: -apple-system, Arial, sans-serif; display: flex; }
    .sign {
      flex: 1; margin: 8mm; display: flex; flex-direction: column;
      align-items: center; justify-content: center; text-align: center;
      border: ${spec.borderMm}mm solid ${accent || '#0C447C'}; border-radius: 4mm;
      padding: 10mm; gap: 6mm;
    }
    .name { font-size: ${spec.titlePt}pt; font-weight: 800; line-height: 1.05; color: #0F2A44; word-break: break-word; }
    .urdu { font-size: ${spec.urduPt}pt; font-weight: 600; color: #333; direction: rtl; }
  </style></head><body>
    <div class="sign">
      <div class="name">${esc(zone.name)}</div>
      ${zone.urduLabel ? `<div class="urdu">${esc(zone.urduLabel)}</div>` : ''}
    </div>
  </body></html>`);
  doc.close();
  iframe.onload = () => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => document.body.removeChild(iframe), 1000);
  };
}
