import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  Badge, Btn, Card, Drawer, FInput, FSelect, FormField, Modal, PageHeader, SearchBar, TableWrapper,
} from "./shared";
import organizationService from "../../services/organization.service";
import { useStaffList } from "../../hooks/useStaffList";

const NO_CAMPUS = "-- All Campuses --";
const ALL_CAMPUSES_FILTER = "All Campuses";
const NO_TEACHER = "-- Select Teacher --";
const WINGS = ["Montessori", "Primary", "Secondary", "O-Level", "Other"];

const EMPTY_FORM = { name: "", code: "", wing: "Primary", campus: NO_CAMPUS, displayOrder: "", status: "Active" };
const EMPTY_SECTION = { name: "", capacity: "", classTeacher: NO_TEACHER };

export default function GradesTab({ initialModal = false }: { initialModal?: boolean }) {
  const [search, setSearch] = useState("");
  const [campusFilter, setCampusFilter] = useState(ALL_CAMPUSES_FILTER);
  const [modal, setModal] = useState(initialModal);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editModal, setEditModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ ...EMPTY_FORM });
  const [manageDrawer, setManageDrawer] = useState<any | null>(null);
  const [sectionForm, setSectionForm] = useState({ ...EMPTY_SECTION });

  const queryClient = useQueryClient();

  const { data: grades = [], isLoading } = useQuery({
    queryKey: ["grades"],
    queryFn: () => organizationService.getGrades(),
  });
  const { data: campuses = [] } = useQuery({ queryKey: ["campuses"], queryFn: organizationService.getCampuses });
  const { data: staff = [] } = useStaffList();

  const campusOptions = [NO_CAMPUS, ...(campuses as any[]).map((c: any) => c.name)];
  const campusFilterOptions = [ALL_CAMPUSES_FILTER, ...(campuses as any[]).map((c: any) => c.name)];
  const teacherOptions = [NO_TEACHER, ...(staff as any[]).map((s: any) => `${s.firstName || ""} ${s.lastName || ""}`.trim()).filter(Boolean)];

  function campusNameFor(g: any) {
    if (!g.campusId) return null;
    return (campuses as any[]).find((c: any) => c._id === g.campusId)?.name || null;
  }

  const createGrade = useMutation({
    mutationFn: organizationService.createGrade,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grades"] });
      toast.success("Class added");
      handleClose();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to add class"),
  });

  const updateGrade = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, any> }) => organizationService.updateGrade(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grades"] });
      toast.success("Class updated");
      setEditModal(false);
      setEditingId(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to update"),
  });

  const deleteGrade = useMutation({
    mutationFn: (id: string) => organizationService.deleteGrade(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grades"] });
      toast.success("Class deactivated");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to deactivate"),
  });

  const seedGrades = useMutation({
    mutationFn: organizationService.seedGrades,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grades"] });
      toast.success("Standard classes added (Pre-Nursery through Grade 12)");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to seed classes"),
  });

  const addSection = useMutation({
    mutationFn: ({ gradeId, section }: { gradeId: string; section: Record<string, any> }) =>
      organizationService.addSection(gradeId, section),
    onSuccess: (updated: any) => {
      queryClient.invalidateQueries({ queryKey: ["grades"] });
      toast.success("Section added");
      setManageDrawer(updated);
      setSectionForm({ ...EMPTY_SECTION });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to add section"),
  });

  const removeSection = useMutation({
    mutationFn: ({ gradeId, sectionId }: { gradeId: string; sectionId: string }) =>
      organizationService.removeSection(gradeId, sectionId),
    onSuccess: (updated: any) => {
      queryClient.invalidateQueries({ queryKey: ["grades"] });
      toast.success("Section removed");
      setManageDrawer(updated);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to remove section"),
  });

  const filtered = (grades as any[]).filter((g) => {
    const matchesSearch =
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      (g.code || "").toLowerCase().includes(search.toLowerCase());
    const matchesCampus =
      campusFilter === ALL_CAMPUSES_FILTER ||
      campusNameFor(g) === campusFilter;
    return matchesSearch && matchesCampus;
  });

  function setField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  }

  function validate(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Class/Grade name is required";
    if (form.displayOrder && isNaN(Number(form.displayOrder))) e.displayOrder = "Must be a number";
    return e;
  }

  function handleSave() {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length === 0) {
      createGrade.mutate({
        name: form.name,
        code: form.code || undefined,
        wing: form.wing,
        campusId: form.campus === NO_CAMPUS ? undefined : (campuses as any[]).find((c: any) => c.name === form.campus)?._id,
        displayOrder: form.displayOrder ? Number(form.displayOrder) : undefined,
        isActive: form.status === "Active",
      });
    }
  }

  function handleClose() {
    setModal(false);
    setForm({ ...EMPTY_FORM });
    setErrors({});
  }

  function openEdit(g: any) {
    setEditingId(g._id);
    setEditForm({
      name: g.name || "",
      code: g.code || "",
      wing: g.wing || "Primary",
      campus: (campuses as any[]).find((c: any) => c._id === g.campusId)?.name || NO_CAMPUS,
      displayOrder: g.displayOrder != null ? String(g.displayOrder) : "",
      status: g.isActive ? "Active" : "Inactive",
    });
    setEditModal(true);
  }

  function saveEdit() {
    if (!editingId) return;
    updateGrade.mutate({
      id: editingId,
      data: {
        name: editForm.name,
        code: editForm.code || undefined,
        wing: editForm.wing,
        campusId: editForm.campus === NO_CAMPUS ? undefined : (campuses as any[]).find((c: any) => c.name === editForm.campus)?._id,
        displayOrder: editForm.displayOrder ? Number(editForm.displayOrder) : undefined,
        isActive: editForm.status === "Active",
      },
    });
  }

  function saveSection() {
    if (!manageDrawer) return;
    if (!sectionForm.name.trim()) { toast.error("Section name is required"); return; }
    addSection.mutate({
      gradeId: manageDrawer._id,
      section: {
        name: sectionForm.name,
        capacity: sectionForm.capacity ? Number(sectionForm.capacity) : undefined,
        classTeacher: sectionForm.classTeacher === NO_TEACHER ? undefined : sectionForm.classTeacher,
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

  return (
    <div className="space-y-5">
      <PageHeader
        breadcrumbs={["Home", "Institution Setup", "Classes & Sections"]}
        title="Classes & Sections"
        subtitle={`${(grades as any[]).length} classes defined`}
        actions={
          <div className="flex gap-2">
            {(grades as any[]).length === 0 && (
              <Btn variant="secondary" size="sm" onClick={() => seedGrades.mutate()}>
                {seedGrades.isPending ? "Adding…" : "＋ Seed Standard Classes"}
              </Btn>
            )}
            <Btn variant="primary" size="sm" onClick={() => setModal(true)}>＋ Add Class</Btn>
          </div>
        }
      />

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="flex-1">
            <SearchBar placeholder="Search classes…" value={search} onChange={setSearch} />
          </div>
          <div className="w-full sm:w-56">
            <FSelect options={campusFilterOptions} value={campusFilter} onChange={(e) => setCampusFilter(e.target.value)} />
          </div>
        </div>
      </Card>

      <Card>
        <TableWrapper headers={["Class / Grade", "Code", "Wing", "Campus", "Sections", "Status", "Actions"]}>
          {filtered.map((g: any) => (
            <tr key={g._id} className="hover:bg-slate-50/60 transition-colors">
              <td className="py-3 px-4 text-sm font-semibold text-slate-800">{g.name}</td>
              <td className="py-3 px-4"><span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{g.code || "—"}</span></td>
              <td className="py-3 px-4 text-xs text-slate-600">{g.wing || "—"}</td>
              <td className="py-3 px-4 text-xs text-slate-600">{campusNameFor(g) || "—"}</td>
              <td className="py-3 px-4">
                {g.sections && g.sections.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {g.sections.map((s: any) => (
                      <span key={s._id} className="text-xs bg-blue-50 text-[#0C447C] px-2 py-0.5 rounded-full">{s.name}</span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-slate-400">No sections yet</span>
                )}
              </td>
              <td className="py-3 px-4"><Badge status={g.isActive ? "Active" : "Inactive"} /></td>
              <td className="py-3 px-4">
                <div className="flex gap-1">
                  <button onClick={() => setManageDrawer(g)} className="p-1.5 hover:bg-blue-50 rounded text-[#0C447C] text-xs" title="Manage Sections">🏷️</button>
                  <button onClick={() => openEdit(g)} className="p-1.5 hover:bg-slate-100 rounded text-slate-500 text-xs" title="Edit">✏️</button>
                  <button onClick={() => deleteGrade.mutate(g._id)} className="p-1.5 hover:bg-red-50 rounded text-red-500 text-xs" title="Deactivate">🗑️</button>
                </div>
              </td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={7} className="py-12 text-center text-sm text-slate-400">
                {(grades as any[]).length === 0
                  ? "No classes yet. Click ＋ Seed Standard Classes for a quick start, or ＋ Add Class to create your own."
                  : "No results match your search."}
              </td>
            </tr>
          )}
        </TableWrapper>
      </Card>

      {/* ── Add Class Modal ───────────────────────────────────────── */}
      <Modal open={modal} onClose={handleClose} title="Add Class / Grade" size="md">
        <div className="p-5 grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <FormField label="Class / Grade Name" required>
              <FInput value={form.name} onChange={(e) => setField("name", e.target.value)} placeholder="e.g. Grade 6" />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </FormField>
          </div>
          <FormField label="Code">
            <FInput value={form.code} onChange={(e) => setField("code", e.target.value.toUpperCase())} placeholder="e.g. G6" />
          </FormField>
          <FormField label="Wing">
            <FSelect options={WINGS} value={form.wing} onChange={(e) => setField("wing", e.target.value)} />
          </FormField>
          <FormField label="Campus">
            <FSelect options={campusOptions} value={form.campus} onChange={(e) => setField("campus", e.target.value)} />
          </FormField>
          <FormField label="Display Order">
            <FInput type="number" value={form.displayOrder} onChange={(e) => setField("displayOrder", e.target.value)} placeholder="e.g. 6" />
            {errors.displayOrder && <p className="text-xs text-red-500 mt-1">{errors.displayOrder}</p>}
          </FormField>
          <FormField label="Status">
            <FSelect options={["Active", "Inactive"]} value={form.status} onChange={(e) => setField("status", e.target.value)} />
          </FormField>
        </div>
        <div className="p-5 border-t border-slate-100 flex justify-end gap-2">
          <Btn variant="secondary" onClick={handleClose}>Cancel</Btn>
          <Btn variant="primary" onClick={handleSave}>
            {createGrade.isPending ? "Saving…" : "＋ Add Class"}
          </Btn>
        </div>
      </Modal>

      {/* ── Edit Class Modal ──────────────────────────────────────── */}
      <Modal open={editModal} onClose={() => { setEditModal(false); setEditingId(null); }} title="Edit Class / Grade" size="md">
        <div className="p-5 grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <FormField label="Class / Grade Name" required>
              <FInput value={editForm.name} onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))} />
            </FormField>
          </div>
          <FormField label="Code">
            <FInput value={editForm.code} onChange={(e) => setEditForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))} />
          </FormField>
          <FormField label="Wing">
            <FSelect options={WINGS} value={editForm.wing} onChange={(e) => setEditForm((prev) => ({ ...prev, wing: e.target.value }))} />
          </FormField>
          <FormField label="Campus">
            <FSelect options={campusOptions} value={editForm.campus} onChange={(e) => setEditForm((prev) => ({ ...prev, campus: e.target.value }))} />
          </FormField>
          <FormField label="Display Order">
            <FInput type="number" value={editForm.displayOrder} onChange={(e) => setEditForm((prev) => ({ ...prev, displayOrder: e.target.value }))} />
          </FormField>
          <FormField label="Status">
            <FSelect options={["Active", "Inactive"]} value={editForm.status} onChange={(e) => setEditForm((prev) => ({ ...prev, status: e.target.value }))} />
          </FormField>
        </div>
        <div className="p-5 border-t border-slate-100 flex justify-end gap-2">
          <Btn variant="secondary" onClick={() => { setEditModal(false); setEditingId(null); }}>Cancel</Btn>
          <Btn variant="primary" onClick={saveEdit}>
            {updateGrade.isPending ? "Saving…" : "✓ Save Changes"}
          </Btn>
        </div>
      </Modal>

      {/* ── Manage Sections Drawer ────────────────────────────────── */}
      <Drawer open={!!manageDrawer} onClose={() => { setManageDrawer(null); setSectionForm({ ...EMPTY_SECTION }); }} title={manageDrawer ? `${manageDrawer.name} — Sections` : "Sections"}>
        {manageDrawer && (
          <div className="p-5 space-y-5">
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">Existing Sections</h3>
              {(!manageDrawer.sections || manageDrawer.sections.length === 0) ? (
                <p className="text-sm text-slate-400">No sections yet — add one below.</p>
              ) : (
                <div className="space-y-2">
                  {manageDrawer.sections.map((s: any) => (
                    <div key={s._id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">Section {s.name}</p>
                        <p className="text-xs text-slate-500">
                          {s.classTeacher ? `Teacher: ${s.classTeacher}` : "No teacher assigned"}
                          {s.capacity ? ` · Capacity: ${s.capacity}` : ""}
                        </p>
                      </div>
                      <button
                        onClick={() => removeSection.mutate({ gradeId: manageDrawer._id, sectionId: s._id })}
                        className="p-1.5 hover:bg-red-50 rounded text-red-500 text-xs"
                        title="Remove section"
                      >🗑️</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="border-t border-slate-100 pt-4">
              <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">Add New Section</h3>
              <div className="space-y-3">
                <FormField label="Section Name" required>
                  <FInput value={sectionForm.name} onChange={(e) => setSectionForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. A" />
                </FormField>
                <FormField label="Capacity">
                  <FInput type="number" value={sectionForm.capacity} onChange={(e) => setSectionForm((p) => ({ ...p, capacity: e.target.value }))} placeholder="e.g. 30" />
                </FormField>
                <FormField label="Class Teacher">
                  <FSelect options={teacherOptions} value={sectionForm.classTeacher} onChange={(e) => setSectionForm((p) => ({ ...p, classTeacher: e.target.value }))} />
                </FormField>
                <Btn variant="primary" className="w-full justify-center" onClick={saveSection}>
                  {addSection.isPending ? "Adding…" : "＋ Add Section"}
                </Btn>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
