import JsBarcode from 'jsbarcode';

export interface BarcodeLabel {
  title: string;
  callNumber?: string;
  accessionNo: string;
  barcode: string;
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
    return `
      <div class="label">
        <div class="title">${l.title.replace(/</g, '&lt;')}</div>
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
    .title { font-size: 8px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
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
