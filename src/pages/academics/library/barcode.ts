import JsBarcode from 'jsbarcode';
import { AGE_BAND_COLORS, AgeBandId } from './ageBand';

export interface BarcodeLabel {
  title: string;
  callNumber?: string;
  accessionNo: string;
  barcode: string;
  urduTitle?: string;
  ageBand?: AgeBandId; // omitted for 'mixed'/'unclassified' - no dot printed
  isMushaf?: boolean;
}

// Same hidden-iframe + window.print() shape used for inventory labels in
// src/pages/procurement/modals.tsx (printInventoryLabel) - a label sheet
// needs to print in isolation regardless of what's open behind the modal,
// rather than the whole-page @media-print pattern used elsewhere.
// Renders one label per copy, laid out 3-up per row so a batch of copies
// prints as a sheet instead of one page per label.
export function printBookBarcodeLabels(labels: BarcodeLabel[]) {
  if (labels.length === 0) return;

  const cells = labels.map((l) => {
    const canvas = document.createElement('canvas');
    try {
      JsBarcode(canvas, l.barcode, { format: 'CODE128', displayValue: false, height: 36, margin: 0 });
    } catch { /* fall through with a blank canvas - text still prints */ }
    const imgSrc = canvas.toDataURL('image/png');
    const dotColor = l.ageBand ? AGE_BAND_COLORS[l.ageBand] : null;
    return `
      <div class="label">
        <div class="title-row">
          ${dotColor ? `<span class="dot" style="background:${dotColor}"></span>` : ''}
          <div class="title">${l.title.replace(/</g, '&lt;')}</div>
        </div>
        ${l.urduTitle ? `<div class="urdu-title" dir="rtl">${l.urduTitle.replace(/</g, '&lt;')}</div>` : ''}
        ${l.isMushaf ? `<div class="mushaf-note">Keep on top shelf</div>` : ''}
        ${l.callNumber ? `<div class="call">${l.callNumber.replace(/</g, '&lt;')}</div>` : ''}
        <img src="${imgSrc}" alt="barcode"/>
        <div class="acc">${l.accessionNo.replace(/</g, '&lt;')}</div>
      </div>`;
  }).join('');

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
  doc.write(`<!doctype html><html><head><title>Barcode Labels</title><style>
    @page { size: A4; margin: 8mm; }
    * { box-sizing: border-box; }
    body { font-family: -apple-system, Arial, sans-serif; margin: 0; }
    .sheet { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3mm; }
    .label {
      border: 1px dashed #ccc; border-radius: 2px; padding: 2mm 1.5mm;
      text-align: center; break-inside: avoid; overflow: hidden;
    }
    .title-row { display: flex; align-items: center; justify-content: center; gap: 1mm; }
    .dot { width: 2mm; height: 2mm; border-radius: 50%; flex-shrink: 0; display: inline-block; }
    .title { font-size: 8px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .urdu-title { font-size: 7px; color: #333; margin-top: 0.3mm; }
    .mushaf-note { font-size: 6px; color: #1D9E75; font-weight: 600; margin-top: 0.3mm; }
    .call { font-size: 7px; color: #555; margin-top: 0.5mm; }
    img { width: 100%; max-height: 12mm; margin-top: 1mm; }
    .acc { font-size: 8px; font-family: monospace; margin-top: 0.5mm; }
  </style></head><body><div class="sheet">${cells}</div></body></html>`);
  doc.close();
  iframe.onload = () => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => document.body.removeChild(iframe), 1000);
  };
}
