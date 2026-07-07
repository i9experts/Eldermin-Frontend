import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  AvatarBubble, Badge, Btn, Card, FInput, FSelect, FormField, Modal, PageHeader, SearchBar, TableWrapper,
} from "./shared";
import organizationService from "../../services/organization.service";

const CAMPUS_HEADS = [
  "-- Select Head --",
  "Dr. Yusuf Al-Rashid",
  "Mrs. Fatima Siddiqui",
  "Dr. Amina Khan",
  "Usman Tariq",
  "Sana Malik",
  "Tariq Jameel",
  "Dr. Nadia Shah",
  "Ahmad Raza",
  "Ms. Zara Ahmed",
  "Ms. Hina Baig",
  "CA. Bilal Siddiqui",
];

const EMPTY_FORM = {
  name: "", code: "", type: "Branch Campus", city: "",
  address: "", phone: "", head: "-- Select Head --", status: "Active", capacity: "",
};

export default function CampusesTab({ initialModal = false }: { initialModal?: boolean }) {
  const [view, setView] = useState<"table" | "tree">("table");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(initialModal);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const queryClient = useQueryClient();

  const { data: campuses = [], isLoading: campusLoading } = useQuery({
    queryKey: ["campuses"],
    queryFn: organizationService.getCampuses,
  });

  const createCampus = useMutation({
    mutationFn: (data: any) => organizationService.createCampus(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campuses"] });
      toast.success("Campus created successfully");
      setModal(false);
      setForm({ ...EMPTY_FORM });
      setErrors({});
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to create campus"),
  });

  const filtered = (campuses as any[]).filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.address?.city || "").toLowerCase().includes(search.toLowerCase())
  );

  function setField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  }

  function validate(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!form.name.trim())                             e.name     = "Campus name is required";
    if (!form.code.trim())                             e.code     = "Campus code is required";
    if (!form.city.trim())                             e.city     = "City is required";
    if (form.head === "-- Select Head --")             e.head     = "Campus head is required";
    if (form.capacity && isNaN(Number(form.capacity))) e.capacity = "Must be a number";
    return e;
  }

  function handleSave() {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length === 0) {
      createCampus.mutate({
        name: form.name,
        code: form.code,
        phone: form.phone,
        address: form.address,
        city: form.city,
        principalName: form.head === "-- Select Head --" ? undefined : form.head,
        capacity: form.capacity ? Number(form.capacity) : undefined,
      });
    }
  }

  function handleClose() {
    setModal(false);
    setForm({ ...EMPTY_FORM });
    setErrors({});
  }

  if (campusLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-[#0C447C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        breadcrumbs={["Home", "Institution Setup", "Campuses"]}
        title="Campus Management"
        subtitle={`${campuses.length} campuses across the network`}
        actions={
          <div className="flex gap-2">
            <div className="flex gap-0.5 bg-slate-100 rounded-lg p-0.5">
              {([{ v: "table", i: "☰" }, { v: "tree", i: "🌳" }] as const).map(({ v, i }) => (
                <button key={v} onClick={() => setView(v)} className={`px-3 py-1.5 text-sm rounded-md transition-colors ${view === v ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>{i} {v}</button>
              ))}
            </div>
            <Btn variant="primary" size="sm" onClick={() => setModal(true)}>＋ Add Campus</Btn>
          </div>
        }
      />

      <Card className="p-4">
        <div className="flex gap-3">
          <SearchBar placeholder="Search campuses…" value={search} onChange={setSearch} />
          <FSelect options={["All Types", "Main Campus", "Branch Campus", "Virtual Campus"]} />
          <FSelect options={["All Status", "Active", "Inactive"]} />
        </div>
      </Card>

      {view === "table" ? (
        <Card>
          <TableWrapper headers={["Campus", "Code", "Type", "City", "Head", "Enrollment", "Capacity", "Status", "Actions"]}>
            {filtered.map((c: any) => (
              <tr key={c._id} className="hover:bg-slate-50/60 transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 text-sm">🏫</div>
                    <span className="text-sm font-semibold text-slate-800">{c.name}</span>
                  </div>
                </td>
                <td className="py-3 px-4"><span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{c.code}</span></td>
                <td className="py-3 px-4 text-xs text-slate-600">{c.type}</td>
                <td className="py-3 px-4 text-xs text-slate-600">📍 {c.address?.city || "—"}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-500">—</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full w-16">
                      <div className="h-1.5 bg-[#0C447C] rounded-full" style={{ width: "0%" }} />
                    </div>
                    <span className="text-xs text-slate-600">{c.currentStudentCount || 0}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-xs text-slate-500">—</td>
                <td className="py-3 px-4"><Badge status={c.isActive ? "Active" : "Inactive"} /></td>
                <td className="py-3 px-4">
                  <div className="flex gap-1">
                    <button className="p-1.5 hover:bg-blue-50 rounded text-[#0C447C] text-xs">👁️</button>
                    <button className="p-1.5 hover:bg-slate-100 rounded text-slate-500 text-xs">✏️</button>
                  </div>
                </td>
              </tr>
            ))}
          </TableWrapper>
          <div className="p-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400">Showing {filtered.length} campuses</span>
            <div className="flex gap-1">
              {[1, 2].map((n) => (
                <button key={n} className={`w-8 h-8 text-xs rounded-lg ${n === 1 ? "bg-[#0C447C] text-white" : "bg-slate-50 text-slate-600"}`}>{n}</button>
              ))}
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-5">
          <h3 className="font-semibold text-slate-800 text-sm mb-4">Campus Hierarchy Tree</h3>
          <div className="space-y-1">
            <div className="flex items-center gap-2 p-3 bg-[#0C447C] text-white rounded-lg">
              <span>🏛️</span>
              <span className="text-sm font-bold">Al-Noor Islamic School Network</span>
              <span className="ml-auto text-xs opacity-75">Group HQ</span>
            </div>
            {["Karachi Region", "Lahore Region", "International"].map((region, ri) => (
              <div key={region} className="ml-6">
                <div className="flex items-center gap-2 p-2.5 bg-slate-800 text-white rounded-lg mt-1">
                  <span className="text-slate-400 mr-1">├─</span>
                  <span>📍</span>
                  <span className="text-sm font-semibold">{region}</span>
                </div>
                {(campuses as any[]).filter((_, i) => i % 3 === ri).map((c: any) => (
                  <div key={c._id} className="ml-6 flex items-center gap-2 p-2.5 bg-white border border-slate-100 rounded-lg mt-1 hover:bg-slate-50 transition-colors cursor-pointer">
                    <span className="text-slate-300 mr-1">└─</span>
                    <span>🏫</span>
                    <span className="text-xs font-medium text-slate-800">{c.name}</span>
                    <Badge status={c.isActive ? "Active" : "Inactive"} small />
                    <span className="ml-auto text-xs text-slate-400">{c.currentStudentCount || 0}/—</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Add Campus Modal ───────────────────────────────────────── */}
      <Modal open={modal} onClose={handleClose} title="Add New Campus" size="md">
        <div className="p-5 grid grid-cols-2 gap-4">

          <div className="col-span-2">
            <FormField label="Campus Name" required>
              <FInput
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="e.g. Clifton Campus – DHA"
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </FormField>
          </div>

          <FormField label="Campus Code" required>
            <FInput
              value={form.code}
              onChange={(e) => setField("code", e.target.value.toUpperCase())}
              placeholder="e.g. ANC-006"
            />
            {errors.code && <p className="text-xs text-red-500 mt-1">{errors.code}</p>}
          </FormField>

          <FormField label="Campus Type">
            <FSelect
              options={["Main Campus", "Branch Campus", "Virtual Campus", "Satellite Campus"]}
              value={form.type}
              onChange={(e) => setField("type", e.target.value)}
            />
          </FormField>

          <FormField label="City" required>
            <FInput
              value={form.city}
              onChange={(e) => setField("city", e.target.value)}
              placeholder="e.g. Karachi"
            />
            {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
          </FormField>

          <FormField label="Phone">
            <FInput
              value={form.phone}
              onChange={(e) => setField("phone", e.target.value)}
              placeholder="+92 21 0000000"
            />
          </FormField>

          <div className="col-span-2">
            <FormField label="Address">
              <FInput
                value={form.address}
                onChange={(e) => setField("address", e.target.value)}
                placeholder="Full campus address"
              />
            </FormField>
          </div>

          <FormField label="Campus Head" required>
            <FSelect
              options={CAMPUS_HEADS}
              value={form.head}
              onChange={(e) => setField("head", e.target.value)}
            />
            {errors.head && <p className="text-xs text-red-500 mt-1">{errors.head}</p>}
          </FormField>

          <FormField label="Status">
            <FSelect
              options={["Active", "Inactive", "Under Construction"]}
              value={form.status}
              onChange={(e) => setField("status", e.target.value)}
            />
          </FormField>

          <FormField label="Student Capacity">
            <FInput
              type="number"
              value={form.capacity}
              onChange={(e) => setField("capacity", e.target.value)}
              placeholder="e.g. 1200"
              min="0"
            />
            {errors.capacity && <p className="text-xs text-red-500 mt-1">{errors.capacity}</p>}
          </FormField>

        </div>
        <div className="p-5 border-t border-slate-100 flex justify-end gap-2">
          <Btn variant="secondary" onClick={handleClose}>Cancel</Btn>
          <Btn variant="primary" onClick={handleSave}>
            {createCampus.isPending ? "Saving…" : "＋ Add Campus"}
          </Btn>
        </div>
      </Modal>
    </div>
  );
}
