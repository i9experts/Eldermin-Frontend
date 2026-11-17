import React, { useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { GradeCheckboxGrid } from '../../teaching/tabs/shared';
import {
  Card, Btn, Modal, FormField, FInput, FTextarea, FSelect, Badge, Pager, EmptyState, BOOK_CATEGORIES,
} from './shared';
import {
  useBooks, useBook, useCreateBook, useUpdateBook, useDeaccessionBook,
  useLibraryClassificationReference, useLibrarySettings,
} from './hooks';
import { printBookBarcodeLabels } from './barcode';
import { inferAgeBands, suggestCallNumber, AGE_BAND_COLORS, AGE_BAND_LABELS, AgeBandId } from './ageBand';

const CAT_COLORS: Record<string, string> = {
  textbook: '#0C447C', islamic: '#1D9E75', fiction: '#7F77DD', reference: '#BA7517',
  science: '#378ADD', biography: '#D85A30', children: '#E24B4A', periodical: '#888',
  non_fiction: '#555', other: '#aaa',
};

const emptyForm = {
  title: '', author: '', isbn: '', issn: '', publisher: '', publishYear: new Date().getFullYear(),
  edition: '', callNumber: '', category: 'textbook', totalCopies: 1, accessionNo: '', shelfNo: '', location: '',
  purchasePrice: 0, language: 'English', description: '', gradeLevels: [] as string[],
  zoneName: '', bay: '', shelfRange: '', urduTitle: '', isReferenceOnly: false,
  isMushaf: false, islamicSubCode: '', pictureCode: '',
};

function BookFormModal({ book, onClose }: { book?: any; onClose: () => void }) {
  const isEdit = !!book;
  const [form, setForm] = useState<any>(isEdit ? {
    title: book.title ?? '', author: book.author ?? '', isbn: book.isbn ?? '', issn: book.issn ?? '',
    publisher: book.publisher ?? '', publishYear: book.publishYear ?? new Date().getFullYear(),
    edition: book.edition ?? '', callNumber: book.callNumber ?? '', category: book.category ?? 'textbook',
    totalCopies: book.totalCopies ?? 1, accessionNo: book.accessionNo ?? '',
    shelfNo: book.shelfNo ?? '', location: book.location ?? '', purchasePrice: book.purchasePrice ?? 0,
    language: book.language ?? 'English', description: book.description ?? '',
    gradeLevels: book.gradeLevels ?? [],
    zoneName: book.zoneName ?? '', bay: book.bay ?? '', shelfRange: book.shelfRange ?? '',
    urduTitle: book.urduTitle ?? '', isReferenceOnly: book.isReferenceOnly ?? false,
    isMushaf: book.isMushaf ?? false, islamicSubCode: book.islamicSubCode ?? '', pictureCode: book.pictureCode ?? '',
  } : emptyForm);
  const [deweyNumberInput, setDeweyNumberInput] = useState('');

  const { data: reference } = useLibraryClassificationReference();
  const { data: librarySettings } = useLibrarySettings();
  const zoneOptions: string[] = ((librarySettings as any)?.zones ?? []).map((z: any) => z.name);
  const deweyRanges: any[] = (reference as any)?.deweyRanges ?? [];
  const islamicSubscheme: any[] = (reference as any)?.islamicSubscheme ?? [];
  const pictureCodes: any[] = (reference as any)?.pictureCodes ?? [];

  const ageBand = useMemo(() => inferAgeBands(form.gradeLevels, form.isReferenceOnly), [form.gradeLevels, form.isReferenceOnly]);
  const isPictureBook = form.category === 'children' || ageBand.dominant === 'early_years';

  const applySuggestedCallNumber = () => {
    const suggestion = suggestCallNumber({
      category: form.category,
      author: form.author,
      isPictureBook,
      deweyNumber: deweyNumberInput ? parseInt(deweyNumberInput, 10) : undefined,
      islamicSubCode: form.islamicSubCode || undefined,
    });
    if (suggestion) setForm((p: any) => ({ ...p, callNumber: suggestion }));
  };

  const createMut = useCreateBook();
  const updateMut = useUpdateBook();
  const mut = isEdit ? updateMut : createMut;

  const submit = () => {
    if (isEdit) {
      updateMut.mutate({ id: book._id, data: form }, {
        onSuccess: () => { toast.success('Book updated'); onClose(); },
        onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to update book'),
      });
    } else {
      createMut.mutate(form, {
        onSuccess: () => { toast.success('Book added to library'); onClose(); },
        onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to add book'),
      });
    }
  };

  const canSubmit = form.title.trim() && form.author.trim() && form.totalCopies >= 1;

  return (
    <Modal
      title={isEdit ? 'Edit Book' : 'Add Book to Library'}
      onClose={onClose}
      wide
      footer={<>
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" onClick={submit} disabled={!canSubmit || mut.isPending}>
          {mut.isPending ? (isEdit ? 'Saving…' : 'Adding…') : (isEdit ? 'Save Changes' : 'Add Book')}
        </Btn>
      </>}
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <FormField label="Title" required>
            <FInput value={form.title} onChange={e => setForm((p: any) => ({ ...p, title: e.target.value }))} />
          </FormField>
        </div>
        <div className="col-span-2">
          <FormField label="Urdu Title (optional)">
            <FInput dir="rtl" value={form.urduTitle} onChange={e => setForm((p: any) => ({ ...p, urduTitle: e.target.value }))} placeholder="بلاگ شدہ اردو عنوان - printed on bilingual labels" />
          </FormField>
        </div>
        <FormField label="Author" required>
          <FInput value={form.author} onChange={e => setForm((p: any) => ({ ...p, author: e.target.value }))} />
        </FormField>
        <FormField label="ISBN">
          <FInput value={form.isbn} onChange={e => setForm((p: any) => ({ ...p, isbn: e.target.value }))} placeholder="978-0-590-35342-7" />
        </FormField>
        <FormField label="ISSN">
          <FInput value={form.issn} onChange={e => setForm((p: any) => ({ ...p, issn: e.target.value }))} placeholder="Periodicals/journals only" />
        </FormField>
        <FormField label="Publisher">
          <FInput value={form.publisher} onChange={e => setForm((p: any) => ({ ...p, publisher: e.target.value }))} />
        </FormField>
        <FormField label="Publish Year">
          <FInput type="number" value={form.publishYear} onChange={e => setForm((p: any) => ({ ...p, publishYear: parseInt(e.target.value) || undefined }))} />
        </FormField>
        <FormField label="Edition">
          <FInput value={form.edition} onChange={e => setForm((p: any) => ({ ...p, edition: e.target.value }))} />
        </FormField>
        <FormField label="Category" required>
          <FSelect value={form.category} onChange={e => setForm((p: any) => ({ ...p, category: e.target.value }))}>
            {BOOK_CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
          </FSelect>
        </FormField>
        <FormField label="Total Copies" required>
          <FInput type="number" min={1} value={form.totalCopies} onChange={e => setForm((p: any) => ({ ...p, totalCopies: parseInt(e.target.value) || 1 }))} />
        </FormField>
        <FormField label="Accession No">
          <FInput value={form.accessionNo} onChange={e => setForm((p: any) => ({ ...p, accessionNo: e.target.value }))} placeholder="Auto-generated if left blank" />
        </FormField>
        <FormField label="Purchase Price">
          <FInput type="number" value={form.purchasePrice} onChange={e => setForm((p: any) => ({ ...p, purchasePrice: parseFloat(e.target.value) || 0 }))} />
        </FormField>
        <FormField label="Language">
          <FInput value={form.language} onChange={e => setForm((p: any) => ({ ...p, language: e.target.value }))} />
        </FormField>
      </div>

      <p className="text-xs text-slate-400 -mt-1">
        Each physical copy gets its own accession number and barcode automatically (copy 1 uses the Accession No above, additional copies are numbered "{form.accessionNo || 'ACC-…'}-2", "-3", …) — see the Copies list on the book's detail view to print barcode labels once saved.
      </p>

      <div>
        <FormField label="Grade Levels">
          <GradeCheckboxGrid selected={form.gradeLevels} onChange={(v: string[]) => setForm((p: any) => ({ ...p, gradeLevels: v }))} />
        </FormField>
        <label className="flex items-center gap-2 mt-2 cursor-pointer">
          <input type="checkbox" checked={form.isReferenceOnly} onChange={e => setForm((p: any) => ({ ...p, isReferenceOnly: e.target.checked }))} className="w-3.5 h-3.5 rounded border-slate-300" />
          <span className="text-xs text-slate-600">Reference / Teachers only (not shelved by class level)</span>
        </label>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-xs text-slate-500">Age band:</span>
          {ageBand.dominant === 'unclassified' ? (
            <span className="text-xs text-slate-400 italic">No age band — select a recognised class level above, or mark Reference</span>
          ) : ageBand.dominant === 'mixed' ? (
            <span className="text-xs text-amber-600 font-medium">Mixed — spans multiple bands ({ageBand.bands.map(b => AGE_BAND_LABELS[b]).join(', ')}); a single colour can't represent several bands, consider splitting this title across shelves</span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: AGE_BAND_COLORS[ageBand.dominant as AgeBandId] }}>
              <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: AGE_BAND_COLORS[ageBand.dominant as AgeBandId] }} />
              {AGE_BAND_LABELS[ageBand.dominant as AgeBandId]}
            </span>
          )}
        </div>
      </div>

      <div className="border border-slate-100 rounded-lg p-3 bg-slate-50/60 space-y-3">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Classification &amp; Call Number</div>
        {form.category === 'islamic' && (
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Islamic Sub-Category">
              <FSelect value={form.islamicSubCode} onChange={e => setForm((p: any) => ({ ...p, islamicSubCode: e.target.value }))}>
                <option value="">Select…</option>
                {islamicSubscheme.map((s: any) => <option key={s.code} value={s.code}>{s.code} — {s.labelEn}</option>)}
              </FSelect>
            </FormField>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isMushaf} onChange={e => setForm((p: any) => ({ ...p, isMushaf: e.target.checked }))} className="w-3.5 h-3.5 rounded border-slate-300" />
                <span className="text-xs text-slate-600">This is the Mushaf (Qur'an itself) — keep on the top shelf, nothing placed above or on it</span>
              </label>
            </div>
          </div>
        )}
        {(form.category === 'non_fiction' || form.category === 'science' || form.category === 'textbook' || form.category === 'biography') && !isPictureBook && (
          <FormField label="Dewey Subject Range (for reference)">
            <div className="flex gap-2">
              <FSelect className="flex-1" value="" onChange={e => {
                const r = deweyRanges.find((d: any) => d.range === e.target.value);
                if (r) setForm((p: any) => ({ ...p, bay: `${r.range} ${r.nameEn}` }));
              }}>
                <option value="">Pick a standard range to fill Bay…</option>
                {deweyRanges.map((r: any) => <option key={r.range} value={r.range}>{r.range} — {r.nameEn} / {r.nameUr}</option>)}
              </FSelect>
              <FInput className="w-28" type="number" placeholder="e.g. 523" value={deweyNumberInput} onChange={e => setDeweyNumberInput(e.target.value)} />
            </div>
          </FormField>
        )}
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <FormField label="Call Number">
              <FInput value={form.callNumber} onChange={e => setForm((p: any) => ({ ...p, callNumber: e.target.value }))} placeholder="e.g. 523 KHA (Dewey), F ADA (fiction), E DON (picture)" />
            </FormField>
          </div>
          <Btn size="sm" variant="secondary" onClick={applySuggestedCallNumber}>Suggest</Btn>
        </div>
        <p className="text-xs text-slate-400">
          Suggestions follow the school's shelving guide (subject number/F/E + author code, or the approved Islamic sub-code) — always reviewable and overridable; the librarian has final say.
        </p>
      </div>

      {isPictureBook && (
        <FormField label="Early Years Picture Bin">
          <div className="grid grid-cols-3 gap-2">
            {pictureCodes.map((pc: any) => (
              <button
                key={pc.code}
                type="button"
                onClick={() => setForm((p: any) => ({ ...p, pictureCode: p.pictureCode === pc.code ? '' : pc.code }))}
                className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border text-xs ${form.pictureCode === pc.code ? 'border-[#0C447C] bg-[#0C447C]/5 text-[#0C447C] font-medium' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                <span className="text-base">{pc.icon}</span> {pc.labelEn}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-1">Early Years books are matched to a picture-coded bin instead of filed by call number.</p>
        </FormField>
      )}

      <div className="grid grid-cols-3 gap-3">
        <FormField label="Zone">
          <FInput list="library-zone-options" value={form.zoneName} onChange={e => setForm((p: any) => ({ ...p, zoneName: e.target.value }))} placeholder="e.g. Non-fiction" />
          <datalist id="library-zone-options">
            {zoneOptions.map((z: string) => <option key={z} value={z} />)}
          </datalist>
        </FormField>
        <FormField label="Bay / Bookcase">
          <FInput value={form.bay} onChange={e => setForm((p: any) => ({ ...p, bay: e.target.value }))} placeholder="e.g. 500-599 Science & Maths" />
        </FormField>
        <FormField label="Shelf Range">
          <FInput value={form.shelfRange} onChange={e => setForm((p: any) => ({ ...p, shelfRange: e.target.value }))} placeholder="e.g. 520-529 Space & Stars" />
        </FormField>
      </div>
      <p className="text-xs text-slate-400 -mt-1">
        Zone/Bay/Shelf is the structured signage hierarchy; Shelf No and Location below stay for schools still using free-text locations.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Shelf No">
          <FInput value={form.shelfNo} onChange={e => setForm((p: any) => ({ ...p, shelfNo: e.target.value }))} />
        </FormField>
        <FormField label="Location">
          <FInput value={form.location} onChange={e => setForm((p: any) => ({ ...p, location: e.target.value }))} />
        </FormField>
      </div>

      <FormField label="Description">
        <FTextarea rows={3} value={form.description} onChange={e => setForm((p: any) => ({ ...p, description: e.target.value }))} />
      </FormField>
    </Modal>
  );
}

function AgeBandBadge({ book }: { book: any }) {
  const result = useMemo(() => inferAgeBands(book.gradeLevels ?? [], book.isReferenceOnly), [book.gradeLevels, book.isReferenceOnly]);
  if (result.dominant === 'unclassified') return <span className="text-slate-400">—</span>;
  if (result.dominant === 'mixed') return <span className="text-amber-600">Mixed</span>;
  const band = result.dominant as AgeBandId;
  return (
    <span className="inline-flex items-center gap-1.5" style={{ color: AGE_BAND_COLORS[band] }}>
      <span className="w-2 h-2 rounded-full inline-block" style={{ background: AGE_BAND_COLORS[band] }} />
      {AGE_BAND_LABELS[band]}
    </span>
  );
}

const COPY_ACTIVE_STATUSES = ['available', 'issued', 'reserved', 'damaged', 'lost'];

function labelExtrasForBook(book: any) {
  const result = inferAgeBands(book.gradeLevels ?? [], book.isReferenceOnly);
  const ageBand = (result.dominant === 'mixed' || result.dominant === 'unclassified') ? undefined : (result.dominant as AgeBandId);
  return { urduTitle: book.urduTitle, ageBand, isMushaf: book.isMushaf };
}

function CopiesSection({ book }: { book: any }) {
  const deaccessionMut = useDeaccessionBook();
  const [deaccessioningCopy, setDeaccessioningCopy] = useState<string | null>(null);
  const copies: any[] = (book.copies ?? []).filter((c: any) => COPY_ACTIVE_STATUSES.includes(c.status) || c.status === 'deaccessioned');

  const confirmDeaccessionCopy = () => {
    if (!deaccessioningCopy) return;
    deaccessionMut.mutate({ id: book._id, copyAccessionNo: deaccessioningCopy }, {
      onSuccess: () => { toast.success('Copy deaccessioned'); setDeaccessioningCopy(null); },
      onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to deaccession copy'),
    });
  };

  return (
    <div>
      {deaccessioningCopy && (
        <Modal
          title="Deaccession Copy"
          onClose={() => setDeaccessioningCopy(null)}
          footer={<>
            <Btn variant="secondary" onClick={() => setDeaccessioningCopy(null)}>Cancel</Btn>
            <Btn variant="danger" onClick={confirmDeaccessionCopy} disabled={deaccessionMut.isPending}>
              {deaccessionMut.isPending ? 'Removing…' : 'Deaccession'}
            </Btn>
          </>}
        >
          <p className="text-sm text-slate-600">
            Deaccession copy <span className="font-mono font-semibold">{deaccessioningCopy}</span> from the catalogue?
            This removes just this physical copy from circulation and cannot easily be undone.
          </p>
        </Modal>
      )}
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Copies ({copies.length})</div>
        {copies.some(c => c.status !== 'deaccessioned') && (
          <Btn size="xs" variant="secondary" onClick={() => printBookBarcodeLabels(
            copies.filter(c => c.status !== 'deaccessioned').map(c => ({
              title: book.title, callNumber: book.callNumber, accessionNo: c.accessionNo, barcode: c.barcode,
              ...labelExtrasForBook(book),
            })),
          )}>
            🖨 Print All Labels
          </Btn>
        )}
      </div>
      {copies.length === 0 ? (
        <div className="text-sm text-slate-400">No copies recorded yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="text-left text-slate-400 border-b border-slate-100">
              <th className="py-1.5 pr-3">Accession No</th><th className="py-1.5 pr-3">Barcode</th>
              <th className="py-1.5 pr-3">Status</th><th className="py-1.5 pr-3">Condition</th><th className="py-1.5 pr-3"></th>
            </tr></thead>
            <tbody className="divide-y divide-slate-50">
              {copies.map((c: any) => (
                <tr key={c.accessionNo}>
                  <td className="py-1.5 pr-3 font-mono">{c.accessionNo}</td>
                  <td className="py-1.5 pr-3 font-mono text-slate-500">{c.barcode}</td>
                  <td className="py-1.5 pr-3"><Badge status={c.status} small /></td>
                  <td className="py-1.5 pr-3 capitalize">{c.condition || '—'}</td>
                  <td className="py-1.5 pr-3">
                    <div className="flex gap-1.5 justify-end">
                      <button
                        onClick={() => printBookBarcodeLabels([{ title: book.title, callNumber: book.callNumber, accessionNo: c.accessionNo, barcode: c.barcode, ...labelExtrasForBook(book) }])}
                        className="text-[#0C447C] hover:underline"
                      >
                        Print
                      </button>
                      {c.status === 'available' && (
                        <button onClick={() => setDeaccessioningCopy(c.accessionNo)} className="text-red-500 hover:underline">
                          Deaccession
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
  );
}

function BookDetailModal({ bookId, onClose }: { bookId: string; onClose: () => void }) {
  const { data: book, isLoading } = useBook(bookId);
  const issues = (book as any)?.issues ?? [];
  return (
    <Modal title="Book Details" onClose={onClose} wide footer={<Btn variant="secondary" onClick={onClose}>Close</Btn>}>
      {isLoading || !book ? (
        <div className="text-center text-slate-400 py-8">Loading…</div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="text-lg font-semibold text-slate-900">{(book as any).title}</div>
              <div className="text-sm text-slate-500">{(book as any).author}</div>
            </div>
            <Badge status={(book as any).status ?? 'active'} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            <div><div className="text-xs text-slate-400">Category</div><div className="capitalize">{(book as any).category?.replace('_', ' ')}</div></div>
            <div><div className="text-xs text-slate-400">Call Number</div><div>{(book as any).callNumber || '—'}</div></div>
            <div><div className="text-xs text-slate-400">ISBN</div><div>{(book as any).isbn || '—'}</div></div>
            <div><div className="text-xs text-slate-400">ISSN</div><div>{(book as any).issn || '—'}</div></div>
            <div><div className="text-xs text-slate-400">Publisher</div><div>{(book as any).publisher || '—'}</div></div>
            <div><div className="text-xs text-slate-400">Accession No</div><div>{(book as any).accessionNo || '—'}</div></div>
            <div><div className="text-xs text-slate-400">Shelf</div><div>{(book as any).shelfNo || '—'}</div></div>
            <div><div className="text-xs text-slate-400">Copies</div><div>{(book as any).availableCopies}/{(book as any).totalCopies} available</div></div>
            <div>
              <div className="text-xs text-slate-400">Zone / Bay / Shelf</div>
              <div>{[(book as any).zoneName, (book as any).bay, (book as any).shelfRange].filter(Boolean).join(' / ') || '—'}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Age Band</div>
              <AgeBandBadge book={book} />
            </div>
          </div>
          {(book as any).isMushaf && (
            <div className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg px-3 py-2">
              📖 Mushaf — keep on the top shelf, nothing placed above or on it.
            </div>
          )}
          <CopiesSection book={book} />
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Issue History</div>
            {issues.length === 0 ? (
              <div className="text-sm text-slate-400">No issue history for this book yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="text-left text-slate-400 border-b border-slate-100">
                    <th className="py-1.5 pr-3">Borrower</th><th className="py-1.5 pr-3">Issued</th><th className="py-1.5 pr-3">Due</th><th className="py-1.5 pr-3">Status</th>
                  </tr></thead>
                  <tbody className="divide-y divide-slate-50">
                    {issues.map((iss: any) => (
                      <tr key={iss._id}>
                        <td className="py-1.5 pr-3">{iss.borrowerName || '—'}</td>
                        <td className="py-1.5 pr-3">{iss.issueDate ? new Date(iss.issueDate).toLocaleDateString() : '—'}</td>
                        <td className="py-1.5 pr-3">{iss.dueDate ? new Date(iss.dueDate).toLocaleDateString() : '—'}</td>
                        <td className="py-1.5 pr-3"><Badge status={iss.status} small /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </Modal>
  );
}

export default function CatalogueTab({ onIssue }: { onIssue: (book: any) => void }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const limit = 12;
  const [showAdd, setShowAdd] = useState(false);
  const [editingBook, setEditingBook] = useState<any>(null);
  const [detailBookId, setDetailBookId] = useState<string | null>(null);
  const [deaccessioning, setDeaccessioning] = useState<any>(null);

  const { data: booksResp, isLoading } = useBooks({
    search: search.trim() || undefined,
    category: category || undefined,
    page, limit,
  });
  const books = (booksResp as any)?.data ?? [];
  const meta = (booksResp as any)?.meta ?? { total: books.length, pages: 1 };

  const deaccessionMut = useDeaccessionBook();

  const confirmDeaccession = () => {
    if (!deaccessioning) return;
    deaccessionMut.mutate({ id: deaccessioning._id }, {
      onSuccess: () => { toast.success('Book deaccessioned'); setDeaccessioning(null); },
      onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to deaccession book'),
    });
  };

  return (
    <Card>
      {showAdd && <BookFormModal onClose={() => setShowAdd(false)} />}
      {editingBook && <BookFormModal book={editingBook} onClose={() => setEditingBook(null)} />}
      {detailBookId && <BookDetailModal bookId={detailBookId} onClose={() => setDetailBookId(null)} />}
      {deaccessioning && (
        <Modal
          title="Deaccession Book"
          onClose={() => setDeaccessioning(null)}
          footer={<>
            <Btn variant="secondary" onClick={() => setDeaccessioning(null)}>Cancel</Btn>
            <Btn variant="danger" onClick={confirmDeaccession} disabled={deaccessionMut.isPending}>
              {deaccessionMut.isPending ? 'Removing…' : 'Deaccession'}
            </Btn>
          </>}
        >
          <p className="text-sm text-slate-600">
            Deaccession <span className="font-semibold">{deaccessioning.title}</span> from the catalogue?
            This removes it from circulation and cannot easily be undone.
          </p>
        </Modal>
      )}

      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <input
            placeholder="Search title, author…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C] w-56"
          />
          <select
            value={category}
            onChange={e => { setCategory(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0C447C]"
          >
            <option value="">All Categories</option>
            {BOOK_CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
          </select>
        </div>
        <Btn variant="primary" onClick={() => setShowAdd(true)}>+ Add Book</Btn>
      </div>

      <div className="p-5">
        {isLoading ? (
          <div className="text-center text-slate-400 py-12">Loading…</div>
        ) : books.length === 0 ? (
          <EmptyState
            icon="🏛️"
            title={search || category ? 'No books found' : 'Library catalogue is empty'}
            action={!search && !category && <Btn variant="primary" onClick={() => setShowAdd(true)}>+ Add First Book</Btn>}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {books.map((b: any) => (
              <div key={b._id} className="bg-white border border-slate-100 rounded-lg p-4" style={{ borderLeft: `4px solid ${CAT_COLORS[b.category] || '#888'}` }}>
                <div className="flex justify-between items-center mb-2 gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] capitalize" style={{ background: `${CAT_COLORS[b.category] || '#888'}22`, color: CAT_COLORS[b.category] || '#888' }}>
                    {b.category?.replace('_', ' ')}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {b.isMushaf && <span title="Mushaf — keep on top shelf">📖</span>}
                    <AgeBandBadge book={b} />
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${b.availableCopies > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                      {b.availableCopies > 0 ? `${b.availableCopies} available` : 'All issued'}
                    </span>
                  </div>
                </div>
                <button onClick={() => setDetailBookId(b._id)} className="text-left w-full">
                  <div className="font-semibold text-sm text-slate-900 mb-0.5 hover:text-[#0C447C]">{b.title}</div>
                </button>
                <div className="text-xs text-slate-500 mb-0.5">{b.author}</div>
                <div className="text-[11px] text-slate-400 mb-2">{b.publisher}{b.publishYear ? ` • ${b.publishYear}` : ''}</div>
                <div className="text-[11px] text-slate-400 mb-2">Acc: {b.accessionNo || '—'} | {b.totalCopies} copies{b.callNumber ? ` | ${b.callNumber}` : ''}</div>
                <div className="h-1 bg-slate-100 rounded-full mb-3 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${b.totalCopies > 0 ? Math.round((b.availableCopies / b.totalCopies) * 100) : 0}%`, background: b.availableCopies > 0 ? '#1D9E75' : '#E24B4A' }}
                  />
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  <Btn size="xs" variant="primary" onClick={() => onIssue(b)} disabled={b.availableCopies < 1} className="flex-1 justify-center">
                    Issue
                  </Btn>
                  <Btn size="xs" variant="secondary" onClick={() => setEditingBook(b)}>Edit</Btn>
                  {b.status !== 'deaccessioned' && (
                    <Btn size="xs" variant="danger" onClick={() => setDeaccessioning(b)}>Deaccession</Btn>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {books.length > 0 && <Pager page={page} pages={meta.pages ?? 1} total={meta.total ?? books.length} onPageChange={setPage} />}
    </Card>
  );
}
