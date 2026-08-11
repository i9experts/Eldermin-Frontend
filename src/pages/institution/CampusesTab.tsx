import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  AvatarBubble, Badge, Btn, Card, FInput, FSelect, FormField, Modal, PageHeader, SearchBar, TableWrapper,
} from "./shared";
import organizationService from "../../services/organization.service";
import hrService from "../../services/hr.service";
import { useStaffList } from "../../hooks/useStaffList";

const EMPTY_FORM = {
  name: "", code: "", type: "Branch Campus", city: "",
  address: "", phone: "", head: "-- Select Head --", status: "Active", capacity: "",
};

export default function CampusesTab({ initialModal = false }: { initialModal?: boolean }) {
  const [view, setView] = useState<"table" | "tree" | "dashboard">("table");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(initialModal);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingCampus, setViewingCampus] = useState<any>(null);

  const queryClient = useQueryClient();

  const { data: campuses = [], isLoading: campusLoading } = useQuery({
    queryKey: ["campuses"],
    queryFn: organizationService.getCampuses,
  });
  const { data: clusters = [] } = useQuery({ queryKey: ["clusters"], queryFn: organizationService.getClusters });
  const { data: clusterDashboard } = useQuery({
    queryKey: ["cluster-dashboard"],
    queryFn: () => organizationService.getClusterDashboard(),
    enabled: view === "dashboard",
  });
  const [showClusterModal, setShowClusterModal] = useState(false);
  const [newClusterName, setNewClusterName] = useState("");
  const [newClusterRegion, setNewClusterRegion] = useState("");

  const assignCluster = useMutation({
    mutationFn: ({ campusId, clusterId }: { campusId: string; clusterId: string | null }) =>
      organizationService.assignCampusToCluster(campusId, clusterId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campuses"] });
      toast.success("Cluster assignment updated");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to update"),
  });

  const createClusterMut = useMutation({
    mutationFn: () => organizationService.createCluster({ name: newClusterName, region: newClusterRegion || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clusters"] });
      toast.success("Cluster created");
      setNewClusterName("");
      setNewClusterRegion("");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to create cluster"),
  });

  const deleteClusterMut = useMutation({
    mutationFn: (id: string) => organizationService.deleteCluster(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clusters"] });
      toast.success("Cluster removed");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to remove cluster"),
  });

  const assignSupervisor = useMutation({
    mutationFn: ({ staffId, clusterId, add }: { staffId: string; clusterId: string; add: boolean }) => {
      const staff = (staffList as any[]).find((s) => s._id === staffId);
      const current: string[] = (staff?.supervisedClusterIds || []).map((id: any) => String(id?._id || id));
      const updated = add ? [...new Set([...current, clusterId])] : current.filter((id) => id !== clusterId);
      return hrService.updateStaff(staffId, { supervisedClusterIds: updated });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff", "dropdown"] });
      toast.success("Supervisor assignment updated");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to update"),
  });
  const { data: overview } = useQuery({ queryKey: ["org", "overview"], queryFn: organizationService.getOverview });
  const schoolName = overview?.school?.name || "Your School";
  const { data: staffList = [] } = useStaffList();
  const campusHeadOptions = [
    "-- Select Head --",
    ...(staffList as any[]).map((s) => `${s.firstName || ""} ${s.lastName || ""}`.trim()).filter(Boolean),
  ];

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

  const updateCampus = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => organizationService.updateCampus(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campuses"] });
      toast.success("Campus updated successfully");
      setModal(false);
      setEditingId(null);
      setForm({ ...EMPTY_FORM });
      setErrors({});
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to update campus"),
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

  function openEditModal(c: any) {
    setEditingId(c._id);
    setForm({
      name: c.name || "",
      code: c.code || "",
      type: c.type || "Branch Campus",
      city: c.city || "",
      address: c.address || "",
      phone: c.phone || "",
      head: c.principalName || "-- Select Head --",
      status: c.isActive ? "Active" : "Inactive",
      capacity: c.capacity != null ? String(c.capacity) : "",
    });
    setErrors({});
    setModal(true);
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
      const payload = {
        name: form.name,
        code: form.code,
        type: form.type || undefined,
        phone: form.phone,
        address: form.address,
        city: form.city,
        principalName: form.head === "-- Select Head --" ? undefined : form.head,
        capacity: form.capacity ? Number(form.capacity) : undefined,
        isActive: form.status !== "Inactive",
      };
      if (editingId) {
        updateCampus.mutate({ id: editingId, payload });
      } else {
        createCampus.mutate(payload);
      }
    }
  }

  function handleClose() {
    setModal(false);
    setEditingId(null);
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
              {([{ v: "table", i: "☰" }, { v: "tree", i: "🌳" }, { v: "dashboard", i: "📊" }] as const).map(({ v, i }) => (
                <button key={v} onClick={() => setView(v)} className={`px-3 py-1.5 text-sm rounded-md transition-colors ${view === v ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>{i} {v}</button>
              ))}
            </div>
            <Btn variant="secondary" size="sm" onClick={() => setShowClusterModal(true)}>🗂️ Manage Clusters</Btn>
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
          <TableWrapper headers={["Campus", "Code", "Type", "City", "Cluster", "Head", "Enrollment", "Capacity", "Status", "Actions"]}>
            {filtered.map((c: any) => (
              <tr key={c._id} className="hover:bg-slate-50/60 transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 text-sm">🏫</div>
                    <span className="text-sm font-semibold text-slate-800">{c.name}</span>
                  </div>
                </td>
                <td className="py-3 px-4"><span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{c.code}</span></td>
                <td className="py-3 px-4 text-xs text-slate-600">{c.type || "—"}</td>
                <td className="py-3 px-4 text-xs text-slate-600">📍 {c.city || "—"}</td>
                <td className="py-3 px-4">
                  <select
                    value={c.clusterId || ""}
                    onChange={(e) => assignCluster.mutate({ campusId: c._id, clusterId: e.target.value || null })}
                    className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-[#0C447C]"
                  >
                    <option value="">— None —</option>
                    {(clusters as any[]).map((cl: any) => <option key={cl._id} value={cl._id}>{cl.name}</option>)}
                  </select>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-600">{c.principalName || "—"}</span>
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
                <td className="py-3 px-4 text-xs text-slate-500">{c.capacity ?? "—"}</td>
                <td className="py-3 px-4"><Badge status={c.isActive ? "Active" : "Inactive"} /></td>
                <td className="py-3 px-4">
                  <div className="flex gap-1">
                    <button onClick={() => setViewingCampus(c)} className="p-1.5 hover:bg-blue-50 rounded text-[#0C447C] text-xs">👁️</button>
                    <button onClick={() => openEditModal(c)} className="p-1.5 hover:bg-slate-100 rounded text-slate-500 text-xs">✏️</button>
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
      ) : null}

      {view === "tree" && (
        <Card className="p-5">
          <h3 className="font-semibold text-slate-800 text-sm mb-4">Campus Hierarchy Tree</h3>
          <div className="space-y-1">
            <div className="flex items-center gap-2 p-3 bg-[#0C447C] text-white rounded-lg">
              <span>🏛️</span>
              <span className="text-sm font-bold">{schoolName}</span>
              <span className="ml-auto text-xs opacity-75">Group HQ</span>
            </div>
            {Array.from(new Set((campuses as any[]).map((c) => c.city).filter(Boolean))).map((city) => (
              <div key={city} className="ml-6">
                <div className="flex items-center gap-2 p-2.5 bg-slate-800 text-white rounded-lg mt-1">
                  <span className="text-slate-400 mr-1">├─</span>
                  <span>📍</span>
                  <span className="text-sm font-semibold">{city}</span>
                </div>
                {(campuses as any[]).filter((c) => c.city === city).map((c: any) => (
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

      {view === "dashboard" && (
        <div className="space-y-4">
          {!clusterDashboard ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-[#0C447C] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-4">
                <Card className="p-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Clusters</p>
                  <p className="text-3xl font-bold text-[#0C447C]">{clusterDashboard.totalClusters}</p>
                </Card>
                <Card className="p-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Total Campuses</p>
                  <p className="text-3xl font-bold text-slate-800">{clusterDashboard.totalCampuses}</p>
                </Card>
                <Card className="p-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Total Students</p>
                  <p className="text-3xl font-bold text-slate-800">{clusterDashboard.totalStudents}</p>
                </Card>
                <Card className="p-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Fee Collection Rate</p>
                  <p className="text-3xl font-bold text-emerald-600">{clusterDashboard.feeCollectionRate != null ? `${clusterDashboard.feeCollectionRate}%` : "—"}</p>
                </Card>
              </div>

              <Card>
                <div className="p-4 border-b border-slate-100">
                  <h3 className="font-semibold text-slate-800 text-sm">By Cluster</h3>
                </div>
                {clusterDashboard.clusters.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-10">No clusters configured yet — group campuses under "Manage Clusters" to see regional breakdowns here.</p>
                ) : (
                  <TableWrapper headers={["Cluster", "Region", "Campuses", "Students"]}>
                    {clusterDashboard.clusters.map((cl: any) => (
                      <tr key={cl.clusterId} className="hover:bg-slate-50/60">
                        <td className="py-3 px-4 text-sm font-medium text-slate-800">{cl.name}</td>
                        <td className="py-3 px-4 text-xs text-slate-500">{cl.region || "—"}</td>
                        <td className="py-3 px-4 text-xs text-slate-600">{cl.campusCount}</td>
                        <td className="py-3 px-4 text-xs text-slate-600">{cl.studentCount}</td>
                      </tr>
                    ))}
                  </TableWrapper>
                )}
                {clusterDashboard.unclusteredCampuses && (
                  <div className="p-3 border-t border-slate-100 text-xs text-slate-400">
                    + {clusterDashboard.unclusteredCampuses.campusCount} campus(es) not yet assigned to a cluster ({clusterDashboard.unclusteredCampuses.studentCount} students)
                  </div>
                )}
              </Card>
            </>
          )}
        </div>
      )}

      {/* ── Add Campus Modal ───────────────────────────────────────── */}
      <Modal open={modal} onClose={handleClose} title={editingId ? "Edit Campus" : "Add New Campus"} size="md">
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
              options={campusHeadOptions}
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
            {(createCampus.isPending || updateCampus.isPending) ? "Saving…" : editingId ? "Save Changes" : "＋ Add Campus"}
          </Btn>
        </div>
      </Modal>

      {/* ── View Campus Panel ──────────────────────────────────────── */}
      <Modal open={!!viewingCampus} onClose={() => setViewingCampus(null)} title={viewingCampus?.name || "Campus Details"} size="md">
        {viewingCampus && (
          <div className="p-5 space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-[11px] text-slate-400 uppercase font-semibold">Code</p><p className="text-sm text-slate-700">{viewingCampus.code || "—"}</p></div>
              <div><p className="text-[11px] text-slate-400 uppercase font-semibold">Type</p><p className="text-sm text-slate-700">{viewingCampus.type || "—"}</p></div>
              <div><p className="text-[11px] text-slate-400 uppercase font-semibold">City</p><p className="text-sm text-slate-700">{viewingCampus.city || "—"}</p></div>
              <div><p className="text-[11px] text-slate-400 uppercase font-semibold">Phone</p><p className="text-sm text-slate-700">{viewingCampus.phone || "—"}</p></div>
              <div className="col-span-2"><p className="text-[11px] text-slate-400 uppercase font-semibold">Address</p><p className="text-sm text-slate-700">{viewingCampus.address || "—"}</p></div>
              <div><p className="text-[11px] text-slate-400 uppercase font-semibold">Campus Head</p><p className="text-sm text-slate-700">{viewingCampus.principalName || "—"}</p></div>
              <div><p className="text-[11px] text-slate-400 uppercase font-semibold">Capacity</p><p className="text-sm text-slate-700">{viewingCampus.capacity ?? "—"}</p></div>
              <div><p className="text-[11px] text-slate-400 uppercase font-semibold">Status</p><Badge status={viewingCampus.isActive ? "Active" : "Inactive"} /></div>
            </div>
          </div>
        )}
        <div className="p-5 border-t border-slate-100 flex justify-end gap-2">
          <Btn variant="secondary" onClick={() => setViewingCampus(null)}>Close</Btn>
          <Btn variant="primary" onClick={() => { const c = viewingCampus; setViewingCampus(null); openEditModal(c); }}>Edit</Btn>
        </div>
      </Modal>

      {/* ── Manage Clusters Modal ──────────────────────────────────── */}
      <Modal open={showClusterModal} onClose={() => setShowClusterModal(false)} title="Manage Clusters" size="md">
        <div className="p-5">
          <p className="text-xs text-slate-400 mb-3">
            Groups campuses into supervised regions — for large multi-campus networks. Most schools never need this.
          </p>
          <div className="space-y-2 mb-4">
            {(clusters as any[]).length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No clusters yet.</p>
            ) : (
              (clusters as any[]).map((cl: any) => {
                const supervisors = (staffList as any[]).filter((s: any) =>
                  (s.supervisedClusterIds || []).some((id: any) => String(id?._id || id) === cl._id)
                );
                return (
                  <div key={cl._id} className="px-3 py-2 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium text-slate-800">{cl.name}</span>
                        {cl.region && <span className="text-xs text-slate-400 ml-2">{cl.region}</span>}
                        <span className="text-xs text-slate-400 ml-2">· {cl.campusCount || 0} campus{cl.campusCount === 1 ? "" : "es"}</span>
                      </div>
                      <button onClick={() => deleteClusterMut.mutate(cl._id)} className="text-xs text-red-500 hover:underline">Remove</button>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      {supervisors.map((s: any) => (
                        <span key={s._id} className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                          {s.firstName} {s.lastName}
                          <button onClick={() => assignSupervisor.mutate({ staffId: s._id, clusterId: cl._id, add: false })} className="hover:text-blue-900">×</button>
                        </span>
                      ))}
                      <select
                        value=""
                        onChange={(e) => e.target.value && assignSupervisor.mutate({ staffId: e.target.value, clusterId: cl._id, add: true })}
                        className="text-[10px] border border-slate-200 rounded-full px-2 py-0.5 bg-white"
                      >
                        <option value="">+ Assign supervisor…</option>
                        {(staffList as any[])
                          .filter((s: any) => !supervisors.some((sv: any) => sv._id === s._id))
                          .map((s: any) => <option key={s._id} value={s._id}>{s.firstName} {s.lastName}</option>)}
                      </select>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className="flex gap-2">
            <FInput value={newClusterName} onChange={(e) => setNewClusterName(e.target.value)} placeholder="Cluster name, e.g. Multan North" />
            <FInput value={newClusterRegion} onChange={(e) => setNewClusterRegion(e.target.value)} placeholder="Region (optional)" />
            <Btn variant="primary" size="sm" onClick={() => newClusterName.trim() && !createClusterMut.isPending && createClusterMut.mutate()}>
              {createClusterMut.isPending ? "Adding…" : "+ Add"}
            </Btn>
          </div>
        </div>
        <div className="p-5 border-t border-slate-100 flex justify-end">
          <Btn variant="secondary" onClick={() => setShowClusterModal(false)}>Close</Btn>
        </div>
      </Modal>
    </div>
  );
}
