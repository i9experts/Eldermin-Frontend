import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AvatarBubble, Badge, Btn, Card, Drawer, EmptyState,
  FInput, FSelect, FormField, Modal, PageHeader, SearchBar, TableWrapper,
} from "./shared";

// TODO: fetch from API when audit log backend is available
const AUDIT_LOGS: any[] = [];
import organizationService from "../../services/organization.service";

function toRow(inst: any) {
  return {
    id: inst._id,
    name: inst.name,
    type: inst.type,
    city: inst.address?.city || "—",
    campuses: 0,
    head: "—",
    status: inst.isActive ? "Active" : "Inactive",
    updated: inst.updatedAt ? new Date(inst.updatedAt).toLocaleDateString() : "—",
  };
}

export default function InstitutionsTab() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [drawer, setDrawer] = useState<any | null>(null);
  const [step, setStep] = useState(0);

  const { data: institution, isLoading: instLoading } = useQuery({
    queryKey: ["institution"],
    queryFn: organizationService.getInstitution,
  });

  const rows = institution ? [toRow(institution)] : [];

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
            <Btn variant="primary" size="sm" onClick={() => setModalOpen(true)}>＋ Add Institution</Btn>
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
                  <button className="p-1.5 hover:bg-slate-100 rounded text-slate-500 text-xs">✏️</button>
                  <button className="p-1.5 hover:bg-slate-100 rounded text-slate-500 text-xs">🏫</button>
                  <button className="p-1.5 hover:bg-red-50 rounded text-red-400 text-xs">🗃️</button>
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
            {["Basic Info", "Location", "Contact", "Settings"].map((s, i) => (
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
          {step === 0 && (
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Organization Name" required><FInput placeholder="e.g. Al-Noor Islamic School" /></FormField>
              <FormField label="Legal Name"><FInput placeholder="Registered legal name" /></FormField>
              <FormField label="Registration Number"><FInput placeholder="NTN / Reg. No." /></FormField>
              <FormField label="Organization Type" required>
                <FSelect options={["Select type…", "Islamic School Group", "Cambridge System", "Montessori", "Standard", "Franchise"]} />
              </FormField>
              <FormField label="Ownership Type">
                <FSelect options={["Private", "Public", "NGO", "Waqf / Trust", "Partnership"]} />
              </FormField>
              <FormField label="Establishment Date"><FInput type="date" /></FormField>
              <FormField label="Status">
                <FSelect options={["Active", "Pending", "Inactive"]} />
              </FormField>
              <FormField label="Logo Upload">
                <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center cursor-pointer hover:border-[#0C447C] transition-colors">
                  <span className="text-2xl">📷</span>
                  <p className="text-xs text-slate-400 mt-1">Click to upload or drag & drop</p>
                  <p className="text-xs text-slate-300">PNG, JPG up to 2MB</p>
                </div>
              </FormField>
            </div>
          )}
          {step === 1 && (
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Country" required><FSelect options={["Pakistan", "UAE", "UK", "Saudi Arabia", "USA"]} /></FormField>
              <FormField label="Province / State"><FInput placeholder="Province" /></FormField>
              <FormField label="City" required><FInput placeholder="City" /></FormField>
              <FormField label="Postal Code"><FInput placeholder="Postal Code" /></FormField>
              <div className="col-span-2">
                <FormField label="Full Address">
                  <textarea className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C] resize-none" rows={3} placeholder="Enter full address…" />
                </FormField>
              </div>
              <FormField label="Regional Office">
                <FSelect options={["– Select Region –", "South Region – Karachi", "Central Region – Lahore", "International – UAE"]} />
              </FormField>
            </div>
          )}
          {step === 2 && (
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Contact Email" required><FInput type="email" placeholder="admin@institution.edu" /></FormField>
              <FormField label="Contact Phone"><FInput placeholder="+92 300 0000000" /></FormField>
              <FormField label="Website"><FInput placeholder="https://www.institution.edu" /></FormField>
              <FormField label="NTN / Tax Number"><FInput placeholder="Tax Number" /></FormField>
              <FormField label="Principal / Head Name"><FInput placeholder="Full name" /></FormField>
              <FormField label="Head Contact Email"><FInput type="email" placeholder="head@institution.edu" /></FormField>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg text-sm text-[#0C447C]">
                <strong>Review & Confirm</strong> — Please verify all details before submitting.
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[["Name", "Al-Noor Islamic School"], ["Type", "Islamic School Group"], ["City", "Karachi, Pakistan"], ["Head", "Dr. Yusuf Al-Rashid"]].map(([k, v]) => (
                  <div key={k} className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500">{k}</span>
                    <span className="font-medium text-slate-800">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="p-5 border-t border-slate-100 flex justify-between">
          <Btn variant="secondary" onClick={() => setStep(Math.max(0, step - 1))} className={step === 0 ? "opacity-50 pointer-events-none" : ""}>← Back</Btn>
          <div className="flex gap-2">
            <Btn variant="ghost" onClick={() => { setModalOpen(false); setStep(0); }}>Cancel</Btn>
            {step < 3 ? (
              <Btn variant="primary" onClick={() => setStep(step + 1)}>Continue →</Btn>
            ) : (
              <Btn variant="success" onClick={() => { setModalOpen(false); setStep(0); }}>✓ Save Institution</Btn>
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
              <Btn variant="primary" className="w-full justify-center">✏️ Edit Institution</Btn>
              <Btn variant="secondary" className="w-full justify-center">🏫 Manage Campuses</Btn>
              <Btn variant="ghost" className="w-full justify-center text-red-500">🗃️ Archive</Btn>
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
