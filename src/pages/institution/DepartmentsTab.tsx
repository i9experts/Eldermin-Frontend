import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  AvatarBubble, Badge, Btn, Card, FInput, FSelect, FormField, Modal, PageHeader, SearchBar, TableWrapper,
} from "./shared";
import organizationService from "../../services/organization.service";

const DEPT_HEADS = [
  "-- Select Head --",
  "Ms. Aisha Noor",
  "Ms. Saira Iqbal",
  "Dr. Imran Hussain",
  "Hafiz Muhammad Bilal",
  "Maulana Tariq Jameel",
  "CA. Bilal Siddiqui",
  "Ms. Hina Baig",
  "Eng. Umar Farooq",
  "Mr. Khalid Pervez",
  "Dr. Rashid Mehmood",
  "Dr. Amina Khan",
  "Mrs. Fatima Siddiqui",
];

const EMPTY_FORM = {
  name: "", code: "", campus: "-- Select Campus --",
  head: "-- Select Head --", staffCount: "", budget: "", status: "Active",
};

export default function DepartmentsTab({ initialModal = false }: { initialModal?: boolean }) {
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(initialModal);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const queryClient = useQueryClient();

  const { data: departments = [], isLoading } = useQuery({
    queryKey: ["departments"],
    queryFn: organizationService.getDepartments,
  });

  const { data: campuses = [] } = useQuery({
    queryKey: ["campuses"],
    queryFn: organizationService.getCampuses,
  });

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

  const filtered = (departments as any[]).filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      (d.code || "").toLowerCase().includes(search.toLowerCase())
  );

  const campusOptions = [
    "-- Select Campus --",
    "All Campuses",
    ...(campuses as any[]).map((c: any) => c.name),
  ];

  function setField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
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
      const matchedCampus = (campuses as any[]).find((c: any) => c.name === form.campus);
      createDept.mutate({
        name: form.name,
        code: form.code,
        type: "academic",
        ...(matchedCampus ? { campusId: matchedCampus._id } : {}),
      });
    }
  }

  function handleClose() {
    setModal(false);
    setForm({ ...EMPTY_FORM });
    setErrors({});
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
          <FSelect options={["All Campuses", "North Campus", "South Campus", "Lahore Campus"]} />
          <FSelect options={["All Status", "Active", "Inactive"]} />
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
                  <span className="text-xs text-slate-500">—</span>
                </div>
              </td>
              <td className="py-3 px-4 text-xs text-slate-600">—</td>
              <td className="py-3 px-4"><Badge status={d.isActive ? "Active" : "Inactive"} /></td>
              <td className="py-3 px-4">
                <div className="flex gap-1">
                  <button className="p-1.5 hover:bg-blue-50 rounded text-[#0C447C] text-xs">👁️</button>
                  <button className="p-1.5 hover:bg-slate-100 rounded text-slate-500 text-xs">✏️</button>
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
              onChange={(e) => setField("campus", e.target.value)}
            />
            {errors.campus && <p className="text-xs text-red-500 mt-1">{errors.campus}</p>}
          </FormField>

          <FormField label="Head of Department">
            <FSelect
              options={DEPT_HEADS}
              value={form.head}
              onChange={(e) => setField("head", e.target.value)}
            />
          </FormField>

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
    </div>
  );
}
