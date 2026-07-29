import { useState, type ChangeEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  AvatarBubble, Badge, Btn, Card, Drawer, EmptyState,
  FInput, FSelect, FormField, Modal, PageHeader, SearchBar, TableWrapper,
} from "./shared";

// TODO: fetch from API when audit log backend is available
const AUDIT_LOGS: any[] = [];
import organizationService from "../../services/organization.service";
import type { TabSection } from "./shared";

const INSTITUTION_TYPES = ["Select type…", "Islamic School Group", "Cambridge System", "Montessori", "Standard", "Franchise"];
const OWNERSHIP_TYPES = ["Private", "Public", "NGO", "Waqf / Trust", "Partnership"];
const STATUS_OPTIONS = ["Active", "Pending", "Inactive"];
const COUNTRIES = ["Pakistan", "UAE", "UK", "Saudi Arabia", "USA"];
const REGIONAL_OFFICES = ["– Select Region –", "South Region – Karachi", "Central Region – Lahore", "International – UAE"];
const STEPS = ["Basic Info", "Location", "Contact", "Settings"];

const EMPTY_FORM = {
  name: "", legalName: "", registrationNumber: "", type: INSTITUTION_TYPES[0],
  ownershipType: OWNERSHIP_TYPES[0], establishedDate: "", status: "Active", logoUrl: "",
  country: COUNTRIES[0], province: "", city: "", postalCode: "", fullAddress: "", regionalOffice: REGIONAL_OFFICES[0],
  email: "", phone: "", website: "", taxNumber: "", principalName: "", headEmail: "",
};

type InstitutionForm = typeof EMPTY_FORM;

function toRow(inst: any) {
  return {
    id: inst._id,
    name: inst.name,
    type: inst.type || "—",
    city: inst.address?.city || "—",
    campuses: 0,
    head: inst.principalName || "—",
    status: inst.status || (inst.isActive ? "Active" : "Inactive"),
    updated: inst.updatedAt ? new Date(inst.updatedAt).toLocaleDateString() : "—",
  };
}

function buildPayload(form: InstitutionForm) {
  return {
    name: form.name,
    legalName: form.legalName,
    registrationNumber: form.registrationNumber,
    type: form.type === INSTITUTION_TYPES[0] ? "" : form.type,
    ownershipType: form.ownershipType,
    establishedDate: form.establishedDate || undefined,
    status: form.status,
    logoUrl: form.logoUrl,
    address: {
      country: form.country,
      province: form.province,
      city: form.city,
      postalCode: form.postalCode,
      fullAddress: form.fullAddress,
    },
    regionalOffice: form.regionalOffice === REGIONAL_OFFICES[0] ? "" : form.regionalOffice,
    email: form.email,
    phone: form.phone,
    website: form.website,
    taxNumber: form.taxNumber,
    principalName: form.principalName,
    headEmail: form.headEmail,
  };
}

function field(form: InstitutionForm, setForm: (fn: (prev: InstitutionForm) => InstitutionForm) => void, key: keyof InstitutionForm) {
  return {
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value })),
  };
}

function InstitutionStepFields({ step, form, setForm }: { step: number; form: InstitutionForm; setForm: (fn: (prev: InstitutionForm) => InstitutionForm) => void }) {
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const handleLogoChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo must be under 2MB');
      e.target.value = '';
      return;
    }
    setUploadingLogo(true);
    try {
      const result = await organizationService.uploadLogo(file);
      setForm(prev => ({ ...prev, logoUrl: result.logoUrl }));
      toast.success('Logo uploaded');
    } catch {
      toast.error('Logo upload failed — please try again');
    } finally {
      setUploadingLogo(false);
      e.target.value = '';
    }
  };

  if (step === 0) {
    return (
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Organization Name" required><FInput placeholder="e.g. Al-Noor Islamic School" {...field(form, setForm, "name")} /></FormField>
        <FormField label="Legal Name"><FInput placeholder="Registered legal name" {...field(form, setForm, "legalName")} /></FormField>
        <FormField label="Registration Number"><FInput placeholder="NTN / Reg. No." {...field(form, setForm, "registrationNumber")} /></FormField>
        <FormField label="Organization Type" required>
          <FSelect options={INSTITUTION_TYPES} {...field(form, setForm, "type")} />
        </FormField>
        <FormField label="Ownership Type">
          <FSelect options={OWNERSHIP_TYPES} {...field(form, setForm, "ownershipType")} />
        </FormField>
        <FormField label="Establishment Date"><FInput type="date" {...field(form, setForm, "establishedDate")} /></FormField>
        <FormField label="Status">
          <FSelect options={STATUS_OPTIONS} {...field(form, setForm, "status")} />
        </FormField>
        <FormField label="Logo Upload">
          <label className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center cursor-pointer hover:border-[#0C447C] transition-colors flex flex-col items-center block">
            <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleLogoChange} disabled={uploadingLogo} />
            {form.logoUrl ? (
              <img src={form.logoUrl} alt="Institution logo" className="h-12 object-contain mb-1" />
            ) : (
              <span className="text-2xl">📷</span>
            )}
            <p className="text-xs text-slate-400 mt-1">
              {uploadingLogo ? 'Uploading…' : form.logoUrl ? 'Click to replace' : 'Click to upload or drag & drop'}
            </p>
            <p className="text-xs text-slate-300">PNG, JPG up to 2MB</p>
          </label>
        </FormField>
      </div>
    );
  }
  if (step === 1) {
    return (
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Country" required><FSelect options={COUNTRIES} {...field(form, setForm, "country")} /></FormField>
        <FormField label="Province / State"><FInput placeholder="Province" {...field(form, setForm, "province")} /></FormField>
        <FormField label="City" required><FInput placeholder="City" {...field(form, setForm, "city")} /></FormField>
        <FormField label="Postal Code"><FInput placeholder="Postal Code" {...field(form, setForm, "postalCode")} /></FormField>
        <div className="col-span-2">
          <FormField label="Full Address">
            <textarea
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C] resize-none"
              rows={3} placeholder="Enter full address…" {...field(form, setForm, "fullAddress")}
            />
          </FormField>
        </div>
        <FormField label="Regional Office">
          <FSelect options={REGIONAL_OFFICES} {...field(form, setForm, "regionalOffice")} />
        </FormField>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-4">
      <FormField label="Contact Email" required><FInput type="email" placeholder="admin@institution.edu" {...field(form, setForm, "email")} /></FormField>
      <FormField label="Contact Phone"><FInput placeholder="+92 300 0000000" {...field(form, setForm, "phone")} /></FormField>
      <FormField label="Website"><FInput placeholder="https://www.institution.edu" {...field(form, setForm, "website")} /></FormField>
      <FormField label="NTN / Tax Number"><FInput placeholder="Tax Number" {...field(form, setForm, "taxNumber")} /></FormField>
      <FormField label="Principal / Head Name"><FInput placeholder="Full name" {...field(form, setForm, "principalName")} /></FormField>
      <FormField label="Head Contact Email"><FInput type="email" placeholder="head@institution.edu" {...field(form, setForm, "headEmail")} /></FormField>
    </div>
  );
}

function InstitutionReviewStep({ form }: { form: InstitutionForm }) {
  const rows: [string, string][] = [
    ["Name", form.name || "—"],
    ["Type", form.type === INSTITUTION_TYPES[0] ? "—" : form.type],
    ["City", [form.city, form.country].filter(Boolean).join(", ") || "—"],
    ["Head", form.principalName || "—"],
  ];
  return (
    <div className="space-y-4">
      <div className="p-4 bg-blue-50 rounded-lg text-sm text-[#0C447C]">
        <strong>Review & Confirm</strong> — Please verify all details before submitting.
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-slate-500">{k}</span>
            <span className="font-medium text-slate-800">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function InstitutionsTab({ setSection }: { setSection?: (t: TabSection) => void }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [drawer, setDrawer] = useState<any | null>(null);
  const [step, setStep] = useState(0);
  const [addForm, setAddForm] = useState<InstitutionForm>({ ...EMPTY_FORM });
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editStep, setEditStep] = useState(0);
  const [editForm, setEditForm] = useState<InstitutionForm>({ ...EMPTY_FORM });
  const [editingId, setEditingId] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const { data: institutionsData, isLoading: instLoading } = useQuery({
    queryKey: ["institutions"],
    queryFn: organizationService.getInstitutions,
  });

  const institutions: any[] = institutionsData || [];
  const rows = institutions.map((inst) => ({ ...toRow(inst), raw: inst }));

  function invalidateAndClose(closeFn: () => void) {
    queryClient.invalidateQueries({ queryKey: ["institutions"] });
    closeFn();
  }

  const createInstitutionMut = useMutation({
    mutationFn: (payload: Record<string, any>) => organizationService.createInstitution(payload),
    onSuccess: () => {
      toast.success("Institution added");
      invalidateAndClose(() => { setModalOpen(false); setStep(0); setAddForm({ ...EMPTY_FORM }); });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to add institution"),
  });

  const updateInstitutionMut = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, any> }) =>
      organizationService.updateInstitutionRecord(id, payload),
    onSuccess: () => {
      toast.success("Institution updated");
      invalidateAndClose(() => { setEditModalOpen(false); setEditStep(0); setEditForm({ ...EMPTY_FORM }); setEditingId(null); });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to update"),
  });

  const archiveInstitutionMut = useMutation({
    mutationFn: (id: string) => organizationService.archiveInstitutionRecord(id),
    onSuccess: () => {
      toast.success("Institution archived");
      queryClient.invalidateQueries({ queryKey: ["institutions"] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to archive"),
  });

  function openAddModal() {
    setAddForm({ ...EMPTY_FORM });
    setStep(0);
    setModalOpen(true);
  }

  function openEditModal(raw: any) {
    setEditingId(raw._id);
    setEditForm({
      name: raw.name || "",
      legalName: raw.legalName || "",
      registrationNumber: raw.registrationNumber || "",
      type: raw.type || INSTITUTION_TYPES[0],
      ownershipType: raw.ownershipType || OWNERSHIP_TYPES[0],
      establishedDate: raw.establishedDate ? String(raw.establishedDate).slice(0, 10) : "",
      status: raw.status || "Active",
      logoUrl: raw.logoUrl || "",
      country: raw.address?.country || COUNTRIES[0],
      province: raw.address?.province || "",
      city: raw.address?.city || "",
      postalCode: raw.address?.postalCode || "",
      fullAddress: raw.address?.fullAddress || "",
      regionalOffice: raw.regionalOffice || REGIONAL_OFFICES[0],
      email: raw.email || "",
      phone: raw.phone || "",
      website: raw.website || "",
      taxNumber: raw.taxNumber || "",
      principalName: raw.principalName || "",
      headEmail: raw.headEmail || "",
    });
    setEditStep(0);
    setEditModalOpen(true);
  }

  const filtered = rows.filter((i) =>
    (filter === "All" || i.type === filter || i.status === filter) &&
    (i.name.toLowerCase().includes(search.toLowerCase()) || i.city.toLowerCase().includes(search.toLowerCase()))
  );

  if (instLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-[#0C447C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        breadcrumbs={["Home", "Institution Setup", "Institutions"]}
        title="Group Institutions"
        subtitle={`${rows.length} institution${rows.length !== 1 ? "s" : ""} registered`}
        actions={
          <div className="flex gap-2">
            <Btn variant="secondary" size="sm">⬇️ Export</Btn>
            <Btn variant="primary" size="sm" onClick={openAddModal}>＋ Add Institution</Btn>
          </div>
        }
      />

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <SearchBar placeholder="Search by name, city…" value={search} onChange={setSearch} />
          <div className="flex gap-1.5">
            {["All", "Active", "Pending", "Islamic School Group", "Cambridge System", "Franchise"].map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${filter === f ? "bg-[#0C447C] text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100"}`}>
                {f}
              </button>
            ))}
          </div>
          <div className="ml-auto text-xs text-slate-400">{filtered.length} of {rows.length} shown</div>
        </div>
      </Card>

      <Card>
        <TableWrapper headers={["Institution Name", "Type", "City", "Campuses", "Head", "Status", "Last Updated", "Actions"]}>
          {filtered.map((inst) => (
            <tr key={inst.id} className="hover:bg-slate-50/60 transition-colors">
              <td className="py-3 px-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-[#0C447C] text-sm font-bold">{inst.name[0]}</div>
                  <div>
                    <div className="text-sm font-semibold text-slate-800">{inst.name}</div>
                    <div className="text-xs text-slate-400">ID: INST-{String(inst.id).slice(-6).toUpperCase()}</div>
                  </div>
                </div>
              </td>
              <td className="py-3 px-4 text-xs text-slate-600">{inst.type}</td>
              <td className="py-3 px-4 text-xs text-slate-600">📍 {inst.city}</td>
              <td className="py-3 px-4">
                <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-50 text-[#0C447C] text-xs font-bold rounded-full">{inst.campuses}</span>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-500">{inst.head}</span>
                </div>
              </td>
              <td className="py-3 px-4"><Badge status={inst.status} /></td>
              <td className="py-3 px-4 text-xs text-slate-400">{inst.updated}</td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-1">
                  <button onClick={() => setDrawer(inst)} className="p-1.5 hover:bg-blue-50 rounded text-[#0C447C] text-xs">👁️</button>
                  <button onClick={() => openEditModal(inst.raw)} className="p-1.5 hover:bg-slate-100 rounded text-slate-500 text-xs">✏️</button>
                  <button className="p-1.5 hover:bg-slate-100 rounded text-slate-500 text-xs">🏫</button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Archive ${inst.name}? This will mark the institution as inactive.`)) {
                        archiveInstitutionMut.mutate(inst.id);
                      }
                    }}
                    className="p-1.5 hover:bg-red-50 rounded text-red-400 text-xs"
                  >🗃️</button>
                </div>
              </td>
            </tr>
          ))}
        </TableWrapper>
        {filtered.length === 0 && <EmptyState icon="🏛️" title="No institutions found" desc="Try adjusting your search or filter" action="Add Institution" />}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-400">Showing {filtered.length} results</span>
          <div className="flex gap-1">
            {[1, 2, 3].map((n) => (
              <button key={n} className={`w-8 h-8 text-xs rounded-lg ${n === 1 ? "bg-[#0C447C] text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100"}`}>{n}</button>
            ))}
          </div>
        </div>
      </Card>

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setStep(0); }} title="Add New Institution" size="lg">
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                {i > 0 && <div className={`flex-1 h-0.5 w-8 ${i <= step ? "bg-[#0C447C]" : "bg-slate-200"}`} />}
                <div className={`flex items-center gap-1.5 ${i === step ? "text-[#0C447C]" : i < step ? "text-emerald-600" : "text-slate-400"}`}>
                  <div className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold ${i === step ? "bg-[#0C447C] text-white" : i < step ? "bg-emerald-500 text-white" : "bg-slate-100"}`}>{i < step ? "✓" : i + 1}</div>
                  <span className="text-xs font-medium hidden sm:block">{s}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="p-5">
          {step < 3 ? <InstitutionStepFields step={step} form={addForm} setForm={setAddForm} /> : <InstitutionReviewStep form={addForm} />}
        </div>
        <div className="p-5 border-t border-slate-100 flex justify-between">
          <Btn variant="secondary" onClick={() => setStep(Math.max(0, step - 1))} className={step === 0 ? "opacity-50 pointer-events-none" : ""}>← Back</Btn>
          <div className="flex gap-2">
            <Btn variant="ghost" onClick={() => { setModalOpen(false); setStep(0); }}>Cancel</Btn>
            {step < 3 ? (
              <Btn variant="primary" onClick={() => setStep(step + 1)}>Continue →</Btn>
            ) : (
              <Btn variant="success" onClick={() => createInstitutionMut.mutate(buildPayload(addForm))}>
                {createInstitutionMut.isPending ? "Saving…" : "✓ Save Institution"}
              </Btn>
            )}
          </div>
        </div>
      </Modal>

      <Modal open={editModalOpen} onClose={() => { setEditModalOpen(false); setEditStep(0); }} title="Edit Institution" size="lg">
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                {i > 0 && <div className={`flex-1 h-0.5 w-8 ${i <= editStep ? "bg-[#0C447C]" : "bg-slate-200"}`} />}
                <div className={`flex items-center gap-1.5 ${i === editStep ? "text-[#0C447C]" : i < editStep ? "text-emerald-600" : "text-slate-400"}`}>
                  <div className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold ${i === editStep ? "bg-[#0C447C] text-white" : i < editStep ? "bg-emerald-500 text-white" : "bg-slate-100"}`}>{i < editStep ? "✓" : i + 1}</div>
                  <span className="text-xs font-medium hidden sm:block">{s}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="p-5">
          {editStep < 3 ? <InstitutionStepFields step={editStep} form={editForm} setForm={setEditForm} /> : <InstitutionReviewStep form={editForm} />}
        </div>
        <div className="p-5 border-t border-slate-100 flex justify-between">
          <Btn variant="secondary" onClick={() => setEditStep(Math.max(0, editStep - 1))} className={editStep === 0 ? "opacity-50 pointer-events-none" : ""}>← Back</Btn>
          <div className="flex gap-2">
            <Btn variant="ghost" onClick={() => { setEditModalOpen(false); setEditStep(0); }}>Cancel</Btn>
            {editStep < 3 ? (
              <Btn variant="primary" onClick={() => setEditStep(editStep + 1)}>Continue →</Btn>
            ) : (
              <Btn
                variant="success"
                onClick={() => editingId && updateInstitutionMut.mutate({ id: editingId, payload: buildPayload(editForm) })}
              >
                {updateInstitutionMut.isPending ? "Saving…" : "✓ Save Changes"}
              </Btn>
            )}
          </div>
        </div>
      </Modal>

      <Drawer open={!!drawer} onClose={() => setDrawer(null)} title={drawer?.name ?? ""}>
        {drawer && (
          <div className="p-5 space-y-5">
            <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl">
              <div className="w-14 h-14 bg-[#0C447C] rounded-xl flex items-center justify-center text-white text-xl font-bold">{drawer.name[0]}</div>
              <div>
                <h3 className="font-bold text-slate-900">{drawer.name}</h3>
                <p className="text-sm text-slate-500">{drawer.type}</p>
                <Badge status={drawer.status} />
              </div>
            </div>
            {(["Head", "City", "Campuses", "Last Updated"] as const).map((k) => (
              <div key={k} className="flex justify-between py-2.5 border-b border-slate-50 text-sm">
                <span className="text-slate-500">{k}</span>
                <span className="font-medium text-slate-800">{drawer[k === "Head" ? "head" : k === "City" ? "city" : k === "Campuses" ? "campuses" : "updated"]}</span>
              </div>
            ))}
            <div className="pt-2 space-y-2">
              <Btn variant="primary" className="w-full justify-center" onClick={() => { const raw = drawer.raw; setDrawer(null); openEditModal(raw); }}>✏️ Edit Institution</Btn>
              <Btn variant="secondary" className="w-full justify-center" onClick={() => { setDrawer(null); setSection?.("campuses"); }}>🏫 Manage Campuses</Btn>
              <Btn
                variant="ghost"
                className="w-full justify-center text-red-500"
                onClick={() => {
                  if (window.confirm(`Archive ${drawer.name}? This will mark the institution as inactive.`)) {
                    archiveInstitutionMut.mutate(drawer.id);
                    setDrawer(null);
                  }
                }}
              >🗃️ Archive</Btn>
            </div>
            <div className="mt-4">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Recent Activity</h4>
              {AUDIT_LOGS.slice(0, 3).map((log) => (
                <div key={log.id} className="flex gap-2 py-2 border-b border-slate-50">
                  <div className="w-1.5 h-1.5 bg-[#EF9F27] rounded-full mt-2 flex-shrink-0" />
                  <div>
                    <span className="text-xs font-medium text-slate-700">{log.action}</span>
                    <span className="text-xs text-slate-400 ml-1">by {log.user}</span>
                    <div className="text-xs text-slate-300">{log.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
