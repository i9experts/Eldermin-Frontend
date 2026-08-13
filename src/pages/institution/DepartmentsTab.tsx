import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  AvatarBubble, Badge, Btn, Card, Drawer, FInput, FSelect, FormField, Modal, PageHeader, SearchBar, TableWrapper,
} from "./shared";
import organizationService from "../../services/organization.service";

const NO_HEAD = "-- Select Head --";
const NO_CAMPUS_FILTER = "All Campuses";

const EMPTY_FORM = {
  name: "", code: "", campus: "-- Select Campus --",
  head: NO_HEAD, description: "", staffCount: "", budget: "", status: "Active",
};

const EMPTY_EDIT_FORM = { name: "", code: "", campus: "-- Select Campus --", head: NO_HEAD, description: "", status: "Active" };

export default function DepartmentsTab({ initialModal = false }: { initialModal?: boolean }) {
  const [search, setSearch] = useState("");
  const [campusFilter, setCampusFilter] = useState(NO_CAMPUS_FILTER);
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [modal, setModal] = useState(initialModal);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [drawer, setDrawer] = useState<any | null>(null);
  const [editModal, setEditModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ ...EMPTY_EDIT_FORM });

  const queryClient = useQueryClient();

  const { data: departments = [], isLoading } = useQuery({
    queryKey: ["departments"],
    queryFn: () => organizationService.getDepartments(),
  });

  const { data: campuses = [] } = useQuery({
    queryKey: ["campuses"],
    queryFn: organizationService.getCampuses,
  });

  const { data: staff = [] } = useQuery({
    queryKey: ["staff"],
    queryFn: () => organizationService.getStaff(),
  });

  function campusNameForDept(d: any) {
    if (!d.campusId) return null;
    return (campuses as any[]).find((c: any) => c._id === d.campusId)?.name || null;
  }

  /** Staff assigned to the given campus selection — "All Campuses" (or the
   * unselected placeholder) returns everyone so the Head dropdown isn't
   * empty before a campus is chosen; a specific campus narrows the list
   * to staff actually assigned there, since a department head should
   * come from the campus the department belongs to. */
  function staffForCampus(campusName: string) {
    if (campusName === "-- Select Campus --" || campusName === NO_CAMPUS_FILTER) return staff as any[];
    return (staff as any[]).filter((s: any) => s.campusId?.name === campusName);
  }

  const headOptions = [NO_HEAD, ...staffForCampus(form.campus).map((s: any) => `${s.firstName} ${s.lastName}`)];
  const editHeadOptions = [NO_HEAD, ...staffForCampus(editForm.campus).map((s: any) => `${s.firstName} ${s.lastName}`)];

  const createDept = useMutation({
    mutationFn: organizationService.createDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      toast.success("Department created");
      setModal(false);
      setForm({ ...EMPTY_FORM });
      setErrors({});
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed"),
  });

  const updateDept = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, any> }) =>
      organizationService.updateDepartment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      toast.success("Department updated");
      setEditModal(false);
      setEditingId(null);
      setEditForm({ ...EMPTY_EDIT_FORM });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed"),
  });

  const filtered = (departments as any[]).filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      (d.code || "").toLowerCase().includes(search.toLowerCase());
    const matchesCampus = campusFilter === NO_CAMPUS_FILTER || campusNameForDept(d) === campusFilter;
    const matchesStatus = statusFilter === "All Status" || (d.isActive ? "Active" : "Inactive") === statusFilter;
    return matchesSearch && matchesCampus && matchesStatus;
  });

  const campusOptions = [
    "-- Select Campus --",
    NO_CAMPUS_FILTER,
    ...(campuses as any[]).map((c: any) => c.name),
  ];

  function setField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  }

  function setField2(patch: Record<string, string>) {
    setForm((prev) => ({ ...prev, ...patch }));
    const clearedKeys = Object.keys(patch).filter((k) => errors[k]);
    if (clearedKeys.length) {
      setErrors((prev) => {
        const next = { ...prev };
        clearedKeys.forEach((k) => { next[k] = ""; });
        return next;
      });
    }
  }

  function validate(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!form.name.trim())                                    e.name       = "Department name is required";
    if (!form.code.trim())                                    e.code       = "Department code is required";
    if (form.campus === "-- Select Campus --")                e.campus     = "Campus is required";
    if (form.staffCount && isNaN(Number(form.staffCount)))    e.staffCount = "Must be a number";
    return e;
  }

  function handleSave() {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length === 0) {
      createDept.mutate({
        name: form.name,
        code: form.code,
        description: form.description,
        head: form.head === NO_HEAD ? undefined : form.head,
        campusId: form.campus === NO_CAMPUS_FILTER ? undefined : (campuses as any[]).find((c: any) => c.name === form.campus)?._id,
      });
    }
  }

  function handleClose() {
    setModal(false);
    setForm({ ...EMPTY_FORM });
    setErrors({});
  }

  function openView(d: any) {
    setDrawer(d);
  }

  function openEdit(d: any) {
    setEditingId(d._id);
    setEditForm({
      name: d.name || "",
      code: d.code || "",
      campus: campusNameForDept(d) || NO_CAMPUS_FILTER,
      head: d.head || NO_HEAD,
      description: d.description || "",
      status: d.isActive ? "Active" : "Inactive",
    });
    setEditModal(true);
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
        breadcrumbs={["Home", "Institution Setup", "Departments"]}
        title="Department Hierarchy"
        subtitle={`${(departments as any[]).length} departments across all campuses`}
        actions={
          <div className="flex gap-2">
            <Btn variant="secondary" size="sm">⬇️ Export</Btn>
            <Btn variant="primary" size="sm" onClick={() => setModal(true)}>＋ Add Department</Btn>
          </div>
        }
      />

      <Card className="p-4">
        <div className="flex gap-3">
          <SearchBar placeholder="Search departments…" value={search} onChange={setSearch} />
          <FSelect options={[NO_CAMPUS_FILTER, ...(campuses as any[]).map((c: any) => c.name)]} value={campusFilter} onChange={(e) => setCampusFilter(e.target.value)} />
          <FSelect options={["All Status", "Active", "Inactive"]} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} />
        </div>
      </Card>

      <Card>
        <TableWrapper headers={["Department", "Code", "Head", "Campus", "Status", "Actions"]}>
          {filtered.map((d: any) => (
            <tr key={d._id} className="hover:bg-slate-50/60 transition-colors">
              <td className="py-3 px-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center text-violet-600 text-sm">
                    {d.name.includes("Hifz") ? "🕌" : d.name.includes("Finance") ? "💰" : d.name.includes("IT") ? "💻" : d.name.includes("Transport") ? "🚌" : "📚"}
                  </div>
                  <span className="text-sm font-semibold text-slate-800">{d.name}</span>
                </div>
              </td>
              <td className="py-3 px-4"><span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{d.code}</span></td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-500">{d.head || "—"}</span>
                </div>
              </td>
              <td className="py-3 px-4 text-xs text-slate-600">{campusNameForDept(d) || NO_CAMPUS_FILTER}</td>
              <td className="py-3 px-4"><Badge status={d.isActive ? "Active" : "Inactive"} /></td>
              <td className="py-3 px-4">
                <div className="flex gap-1">
                  <button onClick={() => openView(d)} className="p-1.5 hover:bg-blue-50 rounded text-[#0C447C] text-xs">👁️</button>
                  <button onClick={() => openEdit(d)} className="p-1.5 hover:bg-slate-100 rounded text-slate-500 text-xs">✏️</button>
                </div>
              </td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={6} className="py-12 text-center text-sm text-slate-400">
                {(departments as any[]).length === 0
                  ? "No departments yet. Click ＋ Add Department to create one."
                  : "No results match your search."}
              </td>
            </tr>
          )}
        </TableWrapper>
      </Card>

      {/* ── Add Department Modal ───────────────────────────────────── */}
      <Modal open={modal} onClose={handleClose} title="Add New Department" size="md">
        <div className="p-5 grid grid-cols-2 gap-4">

          <div className="col-span-2">
            <FormField label="Department Name" required>
              <FInput
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="e.g. Academic – Senior Secondary"
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </FormField>
          </div>

          <FormField label="Department Code" required>
            <FInput
              value={form.code}
              onChange={(e) => setField("code", e.target.value.toUpperCase())}
              placeholder="e.g. AC-SS"
            />
            {errors.code && <p className="text-xs text-red-500 mt-1">{errors.code}</p>}
          </FormField>

          <FormField label="Campus" required>
            <FSelect
              options={campusOptions}
              value={form.campus}
              onChange={(e) => setField2({ campus: e.target.value, head: NO_HEAD })}
            />
            {errors.campus && <p className="text-xs text-red-500 mt-1">{errors.campus}</p>}
          </FormField>

          <FormField label="Head of Department">
            <FSelect
              options={headOptions}
              value={form.head}
              onChange={(e) => setField("head", e.target.value)}
            />
          </FormField>

          <div className="col-span-2">
            <FormField label="Description">
              <textarea
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C] resize-none"
                rows={2}
                placeholder="Department description…"
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
              />
            </FormField>
          </div>

          <FormField label="Status">
            <FSelect
              options={["Active", "Inactive"]}
              value={form.status}
              onChange={(e) => setField("status", e.target.value)}
            />
          </FormField>

          <FormField label="Staff Count">
            <FInput
              type="number"
              value={form.staffCount}
              onChange={(e) => setField("staffCount", e.target.value)}
              placeholder="e.g. 12"
              min="0"
            />
            {errors.staffCount && <p className="text-xs text-red-500 mt-1">{errors.staffCount}</p>}
          </FormField>

          <FormField label="Annual Budget (PKR)">
            <FInput
              value={form.budget}
              onChange={(e) => setField("budget", e.target.value)}
              placeholder="e.g. 5,000,000"
            />
          </FormField>

        </div>
        <div className="p-5 border-t border-slate-100 flex justify-end gap-2">
          <Btn variant="secondary" onClick={handleClose}>Cancel</Btn>
          <Btn variant="primary" onClick={handleSave}>
            {createDept.isPending ? "Saving…" : "＋ Add Department"}
          </Btn>
        </div>
      </Modal>

      {/* ── View Department Drawer ─────────────────────────────────── */}
      <Drawer open={!!drawer} onClose={() => setDrawer(null)} title="Department Details">
        {drawer && (
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
              <AvatarBubble name={drawer.name} size="lg" />
              <div>
                <h3 className="font-bold text-slate-900">{drawer.name}</h3>
                <Badge status={drawer.isActive ? "Active" : "Inactive"} />
              </div>
            </div>
            {([
              ["Code",        drawer.code || "—"],
              ["Campus",      campusNameForDept(drawer) || NO_CAMPUS_FILTER],
              ["Head",        drawer.head || "—"],
              ["Description", drawer.description || "—"],
            ] as [string, string][]).map(([k, v]) => (
              <div key={k} className="flex justify-between py-2.5 border-b border-slate-50 text-sm">
                <span className="text-slate-500">{k}</span>
                <span className="font-medium text-slate-800">{v}</span>
              </div>
            ))}
            <div className="pt-2">
              <Btn variant="primary" className="w-full justify-center" onClick={() => { setDrawer(null); openEdit(drawer); }}>✏️ Edit Department</Btn>
            </div>
          </div>
        )}
      </Drawer>

      {/* ── Edit Department Modal ──────────────────────────────────── */}
      <Modal open={editModal} onClose={() => { setEditModal(false); setEditForm({ ...EMPTY_EDIT_FORM }); }} title="Edit Department" size="md">
        <div className="p-5 grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <FormField label="Department Name" required>
              <FInput value={editForm.name} onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="e.g. Academic – Senior Secondary" />
            </FormField>
          </div>
          <FormField label="Department Code">
            <FInput value={editForm.code} onChange={(e) => setEditForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))} placeholder="e.g. AC-SS" />
          </FormField>
          <FormField label="Campus" required>
            <FSelect
              options={[NO_CAMPUS_FILTER, ...(campuses as any[]).map((c: any) => c.name)]}
              value={editForm.campus}
              onChange={(e) => setEditForm((prev) => ({ ...prev, campus: e.target.value, head: NO_HEAD }))}
            />
          </FormField>
          <FormField label="Head of Department">
            <FSelect options={editHeadOptions} value={editForm.head} onChange={(e) => setEditForm((prev) => ({ ...prev, head: e.target.value }))} />
          </FormField>
          <FormField label="Status">
            <FSelect options={["Active", "Inactive"]} value={editForm.status} onChange={(e) => setEditForm((prev) => ({ ...prev, status: e.target.value }))} />
          </FormField>
          <div className="col-span-2">
            <FormField label="Description">
              <textarea
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C] resize-none"
                rows={2}
                value={editForm.description}
                onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </FormField>
          </div>
        </div>
        <div className="p-5 border-t border-slate-100 flex justify-end gap-2">
          <Btn variant="secondary" onClick={() => { setEditModal(false); setEditForm({ ...EMPTY_EDIT_FORM }); }}>Cancel</Btn>
          <Btn variant="primary" onClick={() => editingId && updateDept.mutate({
            id: editingId,
            data: {
              name: editForm.name,
              code: editForm.code,
              head: editForm.head === NO_HEAD ? undefined : editForm.head,
              description: editForm.description,
              isActive: editForm.status === "Active",
              campusId: editForm.campus === NO_CAMPUS_FILTER ? null : (campuses as any[]).find((c: any) => c.name === editForm.campus)?._id,
            },
          })}>
            {updateDept.isPending ? "Saving…" : "✓ Save Changes"}
          </Btn>
        </div>
      </Modal>
    </div>
  );
}
