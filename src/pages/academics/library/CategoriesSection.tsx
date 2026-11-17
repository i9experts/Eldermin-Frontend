import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Card, CardHeader, Btn, FInput, Modal, FormField } from './shared';
import {
  useLibraryCategories, useCreateLibraryCategory, useUpdateLibraryCategory,
  useDeleteLibraryCategory, useSeedDefaultLibraryCategories,
} from './hooks';

interface BookCategory {
  _id: string;
  name: string;
  code: string;
  color?: string;
  order?: number;
  isActive?: boolean;
}

// Dewey's 10 main classes - each category's group is derived from its own
// code's leading digit (e.g. '530' groups under '500'), rather than a
// separate stored field, since every seeded code already follows that rule.
const MAIN_CLASS_LABEL: Record<string, string> = {
  '0': '000 — Computer Science, Information & General Works',
  '1': '100 — Philosophy & Psychology',
  '2': '200 — Religion',
  '3': '300 — Social Sciences',
  '4': '400 — Language',
  '5': '500 — Science',
  '6': '600 — Technology',
  '7': '700 — Arts & Recreation',
  '8': '800 — Literature',
  '9': '900 — History & Geography',
};

export default function CategoriesSection() {
  const { data: categories = [], isLoading } = useLibraryCategories({ includeInactive: 'true' });
  const seedMut = useSeedDefaultLibraryCategories();
  const createMut = useCreateLibraryCategory();
  const updateMut = useUpdateLibraryCategory();
  const deleteMut = useDeleteLibraryCategory();

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState(false);
  const [newCat, setNewCat] = useState({ name: '', code: '', color: '#0C447C' });
  const [editing, setEditing] = useState<BookCategory | null>(null);
  const [editName, setEditName] = useState('');

  const list: BookCategory[] = categories as BookCategory[];
  const groups = new Map<string, BookCategory[]>();
  for (const c of list) {
    const key = c.code?.[0] || '?';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(c);
  }
  const groupKeys = Array.from(groups.keys()).sort();

  const toggleGroup = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const seed = () => {
    seedMut.mutate(undefined, {
      onSuccess: (res: any) => toast.success(res?.message || 'Dewey categories seeded'),
      onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to seed categories'),
    });
  };

  const submitAdd = () => {
    if (!newCat.name.trim() || !newCat.code.trim()) { toast.error('Name and code are required'); return; }
    createMut.mutate(newCat, {
      onSuccess: () => { toast.success('Category added'); setAdding(false); setNewCat({ name: '', code: '', color: '#0C447C' }); },
      onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to add category'),
    });
  };

  const submitEdit = () => {
    if (!editing) return;
    updateMut.mutate({ id: editing._id, data: { name: editName } }, {
      onSuccess: () => { toast.success('Category updated'); setEditing(null); },
      onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to update category'),
    });
  };

  return (
    <Card className="mt-4">
      <CardHeader
        title="Library Categories (Dewey Decimal)"
        subtitle="The classification scheme offered when cataloguing a book - start from the standard Dewey Decimal list, then adjust as needed."
        actions={(
          <>
            <Btn variant="secondary" size="sm" onClick={() => setAdding(true)}>+ Add Category</Btn>
            <Btn variant="primary" size="sm" onClick={seed} disabled={seedMut.isPending}>
              {seedMut.isPending ? 'Seeding…' : list.length === 0 ? 'Seed Dewey Categories' : 'Re-seed Dewey Defaults'}
            </Btn>
          </>
        )}
      />
      <div className="p-5">
        {isLoading ? (
          <div className="text-center text-slate-400 py-8">Loading…</div>
        ) : list.length === 0 ? (
          <div className="text-sm text-slate-400 text-center py-6">
            No library categories yet. Click <span className="font-medium text-slate-600">Seed Dewey Categories</span> to start from
            the standard 100-entry Dewey Decimal Classification, then add or edit entries as your library needs.
          </div>
        ) : (
          <div className="space-y-2">
            {groupKeys.map((key) => {
              const entries = groups.get(key)!.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
              const isOpen = expanded.has(key);
              return (
                <div key={key} className="border border-slate-100 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleGroup(key)}
                    className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-left"
                  >
                    <span className="text-sm font-semibold text-slate-700">{MAIN_CLASS_LABEL[key] || `${key}00`}</span>
                    <span className="text-xs text-slate-400">{entries.length} · {isOpen ? '▲' : '▼'}</span>
                  </button>
                  {isOpen && (
                    <div className="divide-y divide-slate-50">
                      {entries.map((c) => (
                        <div key={c._id} className="flex items-center gap-3 px-4 py-2" style={{ opacity: c.isActive === false ? 0.5 : 1 }}>
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: c.color || '#94a3b8' }} />
                          <span className="text-xs font-mono text-slate-400 w-10 flex-shrink-0">{c.code}</span>
                          <span className="flex-1 text-sm text-slate-700">{c.name}</span>
                          <button onClick={() => { setEditing(c); setEditName(c.name); }} className="text-xs text-slate-400 hover:text-[#0C447C]">Edit</button>
                          <button
                            onClick={() => { if (confirm(`Delete category "${c.name}"?`)) deleteMut.mutate(c._id, { onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to delete category') }); }}
                            className="text-xs text-slate-400 hover:text-red-500"
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {adding && (
        <Modal
          title="Add Library Category"
          onClose={() => setAdding(false)}
          footer={(
            <>
              <Btn variant="secondary" onClick={() => setAdding(false)}>Cancel</Btn>
              <Btn variant="primary" onClick={submitAdd} disabled={createMut.isPending}>{createMut.isPending ? 'Saving…' : 'Add'}</Btn>
            </>
          )}
        >
          <FormField label="Name" required>
            <FInput value={newCat.name} onChange={(e) => setNewCat((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Islamic Studies" />
          </FormField>
          <FormField label="Code" required>
            <FInput value={newCat.code} onChange={(e) => setNewCat((p) => ({ ...p, code: e.target.value }))} placeholder="e.g. 297.1" />
          </FormField>
          <FormField label="Color">
            <input type="color" value={newCat.color} onChange={(e) => setNewCat((p) => ({ ...p, color: e.target.value }))} className="w-full h-9 border border-slate-200 rounded-lg" />
          </FormField>
        </Modal>
      )}

      {editing && (
        <Modal
          title={`Edit "${editing.code}"`}
          onClose={() => setEditing(null)}
          footer={(
            <>
              <Btn variant="secondary" onClick={() => setEditing(null)}>Cancel</Btn>
              <Btn variant="primary" onClick={submitEdit} disabled={updateMut.isPending}>{updateMut.isPending ? 'Saving…' : 'Save'}</Btn>
            </>
          )}
        >
          <FormField label="Name" required>
            <FInput value={editName} onChange={(e) => setEditName(e.target.value)} />
          </FormField>
        </Modal>
      )}
    </Card>
  );
}
