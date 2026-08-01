import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  Badge, Btn, Card, FInput, FormField, Modal, PageHeader, TableWrapper,
} from "./shared";
import organizationService from "../../services/organization.service";

type TermRow = { name: string; startDate: string; endDate: string };
type YearForm = { name: string; startDate: string; endDate: string; totalWorkingDays: string; remarks: string; terms: TermRow[] };

const EMPTY_TERM: TermRow = { name: "", startDate: "", endDate: "" };
const EMPTY_FORM: YearForm = { name: "", startDate: "", endDate: "", totalWorkingDays: "", remarks: "", terms: [{ ...EMPTY_TERM }] };

export default function AcademicYearsTab({ initialModal = false }: { initialModal?: boolean }) {
  const [modal, setModal] = useState(initialModal);
  const [form, setForm] = useState<YearForm>({ ...EMPTY_FORM });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editModal, setEditModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<YearForm>({ ...EMPTY_FORM });

  const queryClient = useQueryClient();

  const { data: years = [], isLoading } = useQuery({
    queryKey: ["academic-years"],
    queryFn: organizationService.getAcademicYears,
  });

  function syncLocalYear(y: any) {
    localStorage.setItem("academicYear", y.name);
  }

  const createYear = useMutation({
    mutationFn: organizationService.createAcademicYear,
    onSuccess: (created: any) => {
      queryClient.invalidateQueries({ queryKey: ["academic-years"] });
      toast.success("Academic year added");
      if (created?.isCurrent) syncLocalYear(created);
      handleClose();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to add academic year"),
  });

  const updateYear = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, any> }) => organizationService.updateAcademicYear(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academic-years"] });
      toast.success("Academic year updated");
      setEditModal(false);
      setEditingId(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to update"),
  });

  const deleteYear = useMutation({
    mutationFn: (id: string) => organizationService.deleteAcademicYear(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academic-years"] });
      toast.success("Academic year deleted");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to delete"),
  });

  const setCurrent = useMutation({
    mutationFn: (id: string) => organizationService.setCurrentYear(id),
    onSuccess: (updated: any) => {
      queryClient.invalidateQueries({ queryKey: ["academic-years"] });
      syncLocalYear(updated);
      toast.success(`${updated.name} is now the current academic year. Reloading so every module picks it up…`);
      setTimeout(() => window.location.reload(), 900);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to set current year"),
  });

  function setField(field: keyof YearForm, value: any) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  }

  function updateTerm(list: "form" | "edit", idx: number, key: keyof TermRow, value: string) {
    const setter = list === "form" ? setForm : setEditForm;
    setter((prev) => ({ ...prev, terms: prev.terms.map((t, i) => (i === idx ? { ...t, [key]: value } : t)) }));
  }
  function addTermRow(list: "form" | "edit") {
    const setter = list === "form" ? setForm : setEditForm;
    setter((prev) => ({ ...prev, terms: [...prev.terms, { ...EMPTY_TERM }] }));
  }
  function removeTermRow(list: "form" | "edit", idx: number) {
    const setter = list === "form" ? setForm : setEditForm;
    setter((prev) => ({ ...prev, terms: prev.terms.filter((_, i) => i !== idx) }));
  }

  function validate(f: YearForm): Record<string, string> {
    const e: Record<string, string> = {};
    if (!f.name.trim()) e.name = "Academic year name is required (e.g. 2026-27)";
    if (!f.startDate) e.startDate = "Start date is required";
    if (!f.endDate) e.endDate = "End date is required";
    if (f.startDate && f.endDate && new Date(f.endDate) <= new Date(f.startDate)) e.endDate = "End date must be after start date";
    return e;
  }

  function handleSave() {
    const e = validate(form);
    setErrors(e);
    if (Object.keys(e).length) return;
    createYear.mutate({
      name: form.name,
      startDate: form.startDate,
      endDate: form.endDate,
      totalWorkingDays: form.totalWorkingDays ? Number(form.totalWorkingDays) : undefined,
      remarks: form.remarks || undefined,
      terms: form.terms.filter((t) => t.name && t.startDate && t.endDate),
      isCurrent: (years as any[]).length === 0, // first year created becomes current automatically
    });
  }

  function handleClose() {
    setModal(false);
    setForm({ ...EMPTY_FORM, terms: [{ ...EMPTY_TERM }] });
    setErrors({});
  }

  function openEdit(y: any) {
    setEditingId(y._id);
    setEditForm({
      name: y.name,
      startDate: y.startDate ? y.startDate.slice(0, 10) : "",
      endDate: y.endDate ? y.endDate.slice(0, 10) : "",
      totalWorkingDays: y.totalWorkingDays != null ? String(y.totalWorkingDays) : "",
      remarks: y.remarks || "",
      terms: (y.terms || []).length
        ? y.terms.map((t: any) => ({ name: t.name, startDate: t.startDate.slice(0, 10), endDate: t.endDate.slice(0, 10) }))
        : [{ ...EMPTY_TERM }],
    });
    setEditModal(true);
  }

  function saveEdit() {
    if (!editingId) return;
    const e = validate(editForm);
    if (Object.keys(e).length) { toast.error(Object.values(e)[0]); return; }
    updateYear.mutate({
      id: editingId,
      data: {
        name: editForm.name,
        startDate: editForm.startDate,
        endDate: editForm.endDate,
        totalWorkingDays: editForm.totalWorkingDays ? Number(editForm.totalWorkingDays) : undefined,
        remarks: editForm.remarks || undefined,
        terms: editForm.terms.filter((t) => t.name && t.startDate && t.endDate),
      },
    });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-[#0C447C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const termFields = (list: "form" | "edit", terms: TermRow[]) => (
    <div className="col-span-2 space-y-2">
      <label className="block text-xs font-semibold text-slate-600 mb-1">Terms</label>
      {terms.map((t, i) => (
        <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end">
          <FInput placeholder="e.g. Term 1" value={t.name} onChange={(e) => updateTerm(list, i, "name", e.target.value)} />
          <FInput type="date" value={t.startDate} onChange={(e) => updateTerm(list, i, "startDate", e.target.value)} />
          <FInput type="date" value={t.endDate} onChange={(e) => updateTerm(list, i, "endDate", e.target.value)} />
          <button
            onClick={() => removeTermRow(list, i)}
            className="p-2 hover:bg-red-50 rounded text-red-500 text-xs h-9"
            title="Remove term"
          >🗑️</button>
        </div>
      ))}
      <button onClick={() => addTermRow(list)} className="text-xs text-[#0C447C] font-medium hover:underline">＋ Add Term</button>
    </div>
  );

  return (
    <div className="space-y-5">
      <PageHeader
        breadcrumbs={["Home", "Institution Setup", "Academic Years"]}
        title="Academic Years"
        subtitle={`${(years as any[]).length} academic year${(years as any[]).length !== 1 ? "s" : ""} defined`}
        actions={
          <Btn variant="primary" size="sm" onClick={() => setModal(true)}>＋ Add Academic Year</Btn>
        }
      />

      <Card>
        <TableWrapper headers={["Academic Year", "Start Date", "End Date", "Terms", "Status", "Actions"]}>
          {(years as any[]).map((y: any) => (
            <tr key={y._id} className="hover:bg-slate-50/60 transition-colors">
              <td className="py-3 px-4 text-sm font-semibold text-slate-800">{y.name}</td>
              <td className="py-3 px-4 text-xs text-slate-600">{new Date(y.startDate).toLocaleDateString()}</td>
              <td className="py-3 px-4 text-xs text-slate-600">{new Date(y.endDate).toLocaleDateString()}</td>
              <td className="py-3 px-4 text-xs text-slate-600">{(y.terms || []).length || "—"}</td>
              <td className="py-3 px-4">
                {y.isCurrent ? <Badge status="Active" /> : <Badge status="Inactive" />}
              </td>
              <td className="py-3 px-4">
                <div className="flex gap-1 items-center">
                  {!y.isCurrent && (
                    <button
                      onClick={() => setCurrent.mutate(y._id)}
                      className="px-2 py-1 text-xs bg-slate-100 hover:bg-blue-50 hover:text-[#0C447C] rounded font-medium"
                      title="Set as current academic year"
                    >Set Current</button>
                  )}
                  <button onClick={() => openEdit(y)} className="p-1.5 hover:bg-slate-100 rounded text-slate-500 text-xs" title="Edit">✏️</button>
                  <button onClick={() => deleteYear.mutate(y._id)} className="p-1.5 hover:bg-red-50 rounded text-red-500 text-xs" title="Delete">🗑️</button>
                </div>
              </td>
            </tr>
          ))}
          {(years as any[]).length === 0 && (
            <tr>
              <td colSpan={6} className="py-12 text-center text-sm text-slate-400">
                No academic years yet. Click ＋ Add Academic Year to create your first one (e.g. "2025-26").
              </td>
            </tr>
          )}
        </TableWrapper>
      </Card>

      {/* ── Add Academic Year Modal ───────────────────────────────── */}
      <Modal open={modal} onClose={handleClose} title="Add Academic Year" size="lg">
        <div className="p-5 grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <FormField label="Academic Year Name" required>
              <FInput value={form.name} onChange={(e) => setField("name", e.target.value)} placeholder="e.g. 2026-27" />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </FormField>
          </div>
          <FormField label="Start Date" required>
            <FInput type="date" value={form.startDate} onChange={(e) => setField("startDate", e.target.value)} />
            {errors.startDate && <p className="text-xs text-red-500 mt-1">{errors.startDate}</p>}
          </FormField>
          <FormField label="End Date" required>
            <FInput type="date" value={form.endDate} onChange={(e) => setField("endDate", e.target.value)} />
            {errors.endDate && <p className="text-xs text-red-500 mt-1">{errors.endDate}</p>}
          </FormField>
          <FormField label="Total Working Days">
            <FInput type="number" value={form.totalWorkingDays} onChange={(e) => setField("totalWorkingDays", e.target.value)} placeholder="e.g. 220" />
          </FormField>
          <FormField label="Remarks">
            <FInput value={form.remarks} onChange={(e) => setField("remarks", e.target.value)} placeholder="Optional" />
          </FormField>
          {termFields("form", form.terms)}
        </div>
        <div className="p-5 border-t border-slate-100 flex justify-end gap-2">
          <Btn variant="secondary" onClick={handleClose}>Cancel</Btn>
          <Btn variant="primary" onClick={handleSave}>
            {createYear.isPending ? "Saving…" : "＋ Add Academic Year"}
          </Btn>
        </div>
      </Modal>

      {/* ── Edit Academic Year Modal ──────────────────────────────── */}
      <Modal open={editModal} onClose={() => { setEditModal(false); setEditingId(null); }} title="Edit Academic Year" size="lg">
        <div className="p-5 grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <FormField label="Academic Year Name" required>
              <FInput value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} />
            </FormField>
          </div>
          <FormField label="Start Date" required>
            <FInput type="date" value={editForm.startDate} onChange={(e) => setEditForm((p) => ({ ...p, startDate: e.target.value }))} />
          </FormField>
          <FormField label="End Date" required>
            <FInput type="date" value={editForm.endDate} onChange={(e) => setEditForm((p) => ({ ...p, endDate: e.target.value }))} />
          </FormField>
          <FormField label="Total Working Days">
            <FInput type="number" value={editForm.totalWorkingDays} onChange={(e) => setEditForm((p) => ({ ...p, totalWorkingDays: e.target.value }))} />
          </FormField>
          <FormField label="Remarks">
            <FInput value={editForm.remarks} onChange={(e) => setEditForm((p) => ({ ...p, remarks: e.target.value }))} />
          </FormField>
          {termFields("edit", editForm.terms)}
        </div>
        <div className="p-5 border-t border-slate-100 flex justify-end gap-2">
          <Btn variant="secondary" onClick={() => { setEditModal(false); setEditingId(null); }}>Cancel</Btn>
          <Btn variant="primary" onClick={saveEdit}>
            {updateYear.isPending ? "Saving…" : "✓ Save Changes"}
          </Btn>
        </div>
      </Modal>
    </div>
  );
}
