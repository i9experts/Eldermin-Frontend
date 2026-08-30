import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Power } from "lucide-react";
import type { ToastItem } from "./modals";
import { Card, CardHeader, Btn, IconBtn, ConfirmDialog } from "./modals";
import {
  useVendorCategories, useCreateVendorCategory, useUpdateVendorCategory, useDeleteVendorCategory,
  useItemCategories, useCreateItemCategory, useUpdateItemCategory, useDeleteItemCategory,
  useAssetCategories, useCreateAssetCategory, useUpdateAssetCategory, useDeleteAssetCategory,
  useUnitsOfMeasure, useCreateUnitOfMeasure, useUpdateUnitOfMeasure, useDeleteUnitOfMeasure,
  usePaymentTerms, useCreatePaymentTerm, useUpdatePaymentTerm, useDeletePaymentTerm,
  useDepreciationMethods, useCreateDepreciationMethod, useUpdateDepreciationMethod, useDeleteDepreciationMethod,
  useSeedProcurementSettingsDefaults,
} from "../../hooks/useProcurement";

// ─── SHARED "CATEGORY LIST" PANEL ─────────────────────────────────────────────
// One generic list+add+edit+delete/deactivate panel, reused for all six
// Master Settings sections below — mirrors ManageCategoriesModal's UI shape
// (academics/index.tsx) but laid out as an inline tab panel rather than a
// modal, since Master Settings has six of these rather than one.

type SettingRow = { _id: string; name: string; code: string; isActive?: boolean; order?: number; shortCode?: string };

function slugifyCode(name: string): string {
  return name.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function SettingsListPanel({
  title, description, hasShortCode, deleteBlockedHint,
  useList, useCreate, useUpdate, useDelete,
  toast,
}: {
  title: string;
  description: string;
  hasShortCode?: boolean;
  /** Shown next to Delete when this list has no in-use guard (UOM/Payment Terms/Depreciation) — deactivate is the safe alternative. */
  deleteBlockedHint?: boolean;
  useList: (includeInactive?: boolean) => { data?: SettingRow[]; isLoading: boolean; isPending: boolean; isSuccess: boolean };
  useCreate: () => { mutate: (data: any, opts?: any) => void; isPending: boolean };
  useUpdate: () => { mutate: (args: { id: string; data: any }, opts?: any) => void; isPending: boolean };
  useDelete: () => { mutate: (id: string, opts?: any) => void; isPending: boolean };
  toast: (msg: string, type?: ToastItem["type"]) => void;
}) {
  const { data: rows = [], isLoading } = useList(true);
  const createMut = useCreate();
  const updateMut = useUpdate();
  const deleteMut = useDelete();
  const seedMut = useSeedProcurementSettingsDefaults();

  const [editing, setEditing] = useState<SettingRow | {} | null>(null); // null = closed, {} = new
  const [form, setForm] = useState({ name: "", code: "", shortCode: "", order: 0 });
  const [confirmDelete, setConfirmDelete] = useState<SettingRow | null>(null);

  // Auto-seed once, on first load, if this school hasn't run seed-defaults
  // yet — same guarded (isPending/isSuccess-checked, loop-safe) pattern as
  // academics' useSubjectCategories auto-seed effect. seed-defaults seeds
  // all six lists together, so any one empty section triggers it.
  useEffect(() => {
    if (!isLoading && rows.length === 0 && !seedMut.isPending && !seedMut.isSuccess) {
      seedMut.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, rows.length]);

  const startNew = () => { setEditing({}); setForm({ name: "", code: "", shortCode: "", order: rows.length + 1 }); };
  const startEdit = (r: SettingRow) => { setEditing(r); setForm({ name: r.name, code: r.code, shortCode: r.shortCode ?? "", order: r.order ?? 0 }); };

  const save = () => {
    const isEdit = editing && "_id" in (editing as SettingRow);
    const payload: any = { name: form.name, code: form.code, order: form.order };
    if (hasShortCode) payload.shortCode = form.shortCode;
    if (isEdit) {
      updateMut.mutate({ id: (editing as SettingRow)._id, data: payload }, {
        onSuccess: () => { toast(`${title.slice(0, -1)} updated`); setEditing(null); },
        onError: (e: any) => toast(e?.response?.data?.message || "Failed to save", "error"),
      });
    } else {
      createMut.mutate(payload, {
        onSuccess: () => { toast(`${title.slice(0, -1)} added`); setEditing(null); },
        onError: (e: any) => toast(e?.response?.data?.message || "Failed to save", "error"),
      });
    }
  };

  const toggleActive = (r: SettingRow) => {
    updateMut.mutate({ id: r._id, data: { isActive: !(r.isActive ?? true) } }, {
      onSuccess: () => toast(r.isActive ?? true ? "Deactivated" : "Activated"),
      onError: () => toast("Failed", "error"),
    });
  };

  const confirmDeleteNow = () => {
    if (!confirmDelete) return;
    deleteMut.mutate(confirmDelete._id, {
      onSuccess: () => toast(`${title.slice(0, -1)} deleted`),
      // The backend's in-use guard (where one exists) names exactly what's
      // still using this entry — surface it verbatim rather than a generic
      // failure toast, same convention as academics' ManageCategoriesModal.
      onError: (e: any) => toast(e?.response?.data?.message || "Could not delete", "error"),
    });
    setConfirmDelete(null);
  };

  const saving = createMut.isPending || updateMut.isPending;
  const isEdit = editing && "_id" in (editing as SettingRow);

  return (
    <Card>
      <CardHeader title={title} sub={description} actions={
        <Btn variant="primary" onClick={startNew}><Plus size={13} />Add</Btn>
      } />
      <div className="p-4 space-y-3">
        {editing !== null && (
          <div className="p-3 border border-slate-200 rounded-lg bg-slate-50">
            <div className={`grid ${hasShortCode ? "grid-cols-4" : "grid-cols-3"} gap-2 mb-2`}>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Name *</label>
                <input value={form.name}
                  onChange={e => {
                    const name = e.target.value;
                    setForm(p => ({ ...p, name, code: isEdit ? p.code : slugifyCode(name) }));
                  }}
                  className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]" placeholder="e.g. Catering" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Code *</label>
                <input value={form.code} disabled={!!isEdit}
                  onChange={e => setForm(p => ({ ...p, code: e.target.value.toLowerCase().replace(/\s+/g, "_") }))}
                  className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C] disabled:opacity-60 disabled:bg-slate-100" placeholder="e.g. catering" />
              </div>
              {hasShortCode && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Short Code</label>
                  <input value={form.shortCode} onChange={e => setForm(p => ({ ...p, shortCode: e.target.value }))}
                    className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]" placeholder="e.g. Ltr" />
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Order</label>
                <input type="number" value={form.order} onChange={e => setForm(p => ({ ...p, order: parseInt(e.target.value) || 0 }))}
                  className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]" />
              </div>
            </div>
            <div className="flex gap-2">
              <Btn variant="primary" onClick={save}>{saving ? "Saving…" : "Save"}</Btn>
              <Btn variant="secondary" onClick={() => setEditing(null)}>Cancel</Btn>
            </div>
          </div>
        )}

        {isLoading ? (
          <p className="text-xs text-slate-400 py-6 text-center">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">No entries yet.</p>
        ) : (
          <div className="space-y-1.5">
            {rows.map(r => (
              <div key={r._id} className={`flex items-center gap-2 px-3 py-2 border border-slate-100 rounded-lg ${r.isActive === false ? "opacity-50" : ""}`}>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium text-slate-800">{r.name}</span>
                  {r.shortCode && <span className="text-xs text-slate-400 ml-1.5">({r.shortCode})</span>}
                  <span className="text-xs text-slate-400 ml-2 font-mono">{r.code}</span>
                </div>
                <IconBtn icon={Edit2} title="Edit" color="hover:text-amber-600 hover:bg-amber-50" onClick={() => startEdit(r)} />
                <IconBtn icon={Power} title={r.isActive === false ? "Activate" : "Deactivate"} color="hover:text-[#0C447C] hover:bg-blue-50" onClick={() => toggleActive(r)} />
                <IconBtn icon={Trash2} title="Delete" color="hover:text-red-500 hover:bg-red-50" onClick={() => setConfirmDelete(r)} />
              </div>
            ))}
          </div>
        )}
        {deleteBlockedHint && (
          <p className="text-xs text-slate-400 pt-1">
            Deleting isn't blocked when this value is in use elsewhere (it isn't tracked as a formal reference) — deactivate instead if you just want it off new forms.
          </p>
        )}
      </div>
      {confirmDelete && (
        <ConfirmDialog
          title={`Delete "${confirmDelete.name}"?`}
          message="This can't be undone. If it's still referenced somewhere and that's tracked, the delete will be blocked and tell you what's using it."
          confirmLabel="Delete"
          onConfirm={confirmDeleteNow}
          onClose={() => setConfirmDelete(null)}
        />
      )}
    </Card>
  );
}

// ─── MASTER SETTINGS TAB ──────────────────────────────────────────────────────
const SECTIONS = [
  { id: "vendor-categories",   label: "Vendor Categories" },
  { id: "item-categories",     label: "Item Categories" },
  { id: "asset-categories",    label: "Asset Categories" },
  { id: "units-of-measure",    label: "Units of Measure" },
  { id: "payment-terms",       label: "Payment Terms" },
  { id: "depreciation-methods",label: "Depreciation Methods" },
] as const;
type SectionId = typeof SECTIONS[number]["id"];

export default function MasterSettingsTab({ toast }: { toast: (msg: string, type?: ToastItem["type"]) => void }) {
  const [section, setSection] = useState<SectionId>("vendor-categories");

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5 flex-wrap">
        {SECTIONS.map(s => (
          <button key={s.id} onClick={() => setSection(s.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              section === s.id
                ? "bg-[#0C447C] text-white border-[#0C447C]"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}>
            {s.label}
          </button>
        ))}
      </div>

      {section === "vendor-categories" && (
        <SettingsListPanel title="Vendor Categories" description="Used on the Vendor form's Category dropdown"
          useList={useVendorCategories} useCreate={useCreateVendorCategory} useUpdate={useUpdateVendorCategory} useDelete={useDeleteVendorCategory}
          toast={toast} />
      )}
      {section === "item-categories" && (
        <SettingsListPanel title="Item Categories" description="Used on the Inventory Item form's Category dropdown"
          useList={useItemCategories} useCreate={useCreateItemCategory} useUpdate={useUpdateItemCategory} useDelete={useDeleteItemCategory}
          toast={toast} />
      )}
      {section === "asset-categories" && (
        <SettingsListPanel title="Asset Categories" description="Used on the Asset form's Category dropdown"
          useList={useAssetCategories} useCreate={useCreateAssetCategory} useUpdate={useUpdateAssetCategory} useDelete={useDeleteAssetCategory}
          toast={toast} />
      )}
      {section === "units-of-measure" && (
        <SettingsListPanel title="Units of Measure" description="Used on line items and the Inventory Item form" hasShortCode deleteBlockedHint
          useList={useUnitsOfMeasure} useCreate={useCreateUnitOfMeasure} useUpdate={useUpdateUnitOfMeasure} useDelete={useDeleteUnitOfMeasure}
          toast={toast} />
      )}
      {section === "payment-terms" && (
        <SettingsListPanel title="Payment Terms" description="Used on the Vendor form's Payment Terms dropdown" deleteBlockedHint
          useList={usePaymentTerms} useCreate={useCreatePaymentTerm} useUpdate={useUpdatePaymentTerm} useDelete={useDeletePaymentTerm}
          toast={toast} />
      )}
      {section === "depreciation-methods" && (
        <SettingsListPanel title="Depreciation Methods" description="Used on the Asset form's Depreciation Method dropdown" deleteBlockedHint
          useList={useDepreciationMethods} useCreate={useCreateDepreciationMethod} useUpdate={useUpdateDepreciationMethod} useDelete={useDeleteDepreciationMethod}
          toast={toast} />
      )}
    </div>
  );
}
