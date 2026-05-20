import { useState } from "react";
import {
  COMMITTEES,
  Badge, Btn, Card, FInput, FSelect, FormField, Modal, PageHeader, SearchBar,
} from "./shared";

export default function CommitteesTab() {
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);

  const filtered = COMMITTEES.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.chair.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <PageHeader
        breadcrumbs={["Home", "Institution Setup", "Committees"]}
        title="Committee Management"
        subtitle={`${COMMITTEES.length} committees — ${COMMITTEES.filter((c) => c.status === "Active").length} active`}
        actions={
          <div className="flex gap-2">
            <Btn variant="secondary" size="sm">⬇️ Export</Btn>
            <Btn variant="primary" size="sm" onClick={() => setModal(true)}>＋ Create Committee</Btn>
          </div>
        }
      />

      <Card className="p-4">
        <div className="flex gap-3 flex-wrap">
          <SearchBar placeholder="Search committees…" value={search} onChange={setSearch} />
          <FSelect options={["All Types", "Governance", "Academic", "Finance", "HR", "Religious"]} />
          <FSelect options={["All Status", "Active", "Inactive"]} />
        </div>
      </Card>

      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((c) => (
          <Card key={c.id} className="p-5 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
                  c.type === "Governance" ? "bg-blue-50" : c.type === "Religious" ? "bg-emerald-50" : c.type === "Finance" ? "bg-amber-50" : c.type === "Academic" ? "bg-violet-50" : "bg-slate-50"
                }`}>
                  {c.type === "Governance" ? "⚖️" : c.type === "Religious" ? "🕌" : c.type === "Finance" ? "💰" : c.type === "Academic" ? "📚" : "👥"}
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">{c.name}</div>
                  <div className="text-xs text-slate-400">{c.type}</div>
                </div>
              </div>
              <Badge status={c.status} />
            </div>
            <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
              <div className="flex items-center gap-1.5"><span>👤</span><span className="font-medium">Chair:</span> {c.chair}</div>
              <div className="flex justify-between">
                <span className="flex items-center gap-1"><span>👥</span>{c.members} members</span>
                <span className="flex items-center gap-1"><span>📅</span>{c.meetings} meetings/yr</span>
              </div>
            </div>
            <div className="flex gap-1.5 mt-3 pt-3 border-t border-slate-100">
              <button className="flex-1 text-xs py-1.5 bg-blue-50 text-[#0C447C] rounded-lg hover:bg-blue-100 font-medium">View</button>
              <button className="flex-1 text-xs py-1.5 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 font-medium">Edit</button>
              <button className="text-xs py-1.5 px-2 bg-amber-50 text-[#EF9F27] rounded-lg hover:bg-amber-100 font-medium">Schedule</button>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Create New Committee" size="md">
        <div className="p-5 grid grid-cols-2 gap-4">
          <div className="col-span-2"><FormField label="Committee Name" required><FInput placeholder="e.g. Academic Excellence Committee" /></FormField></div>
          <FormField label="Committee Type" required>
            <FSelect options={["Governance", "Academic", "Finance", "HR", "Religious", "Procurement", "Discipline"]} />
          </FormField>
          <FormField label="Status"><FSelect options={["Active", "Inactive"]} /></FormField>
          <div className="col-span-2">
            <FormField label="Purpose">
              <textarea className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C] resize-none" rows={2} placeholder="Committee purpose and responsibilities…" />
            </FormField>
          </div>
          <FormField label="Chairperson" required><FInput placeholder="Full name" /></FormField>
          <FormField label="Secretary"><FInput placeholder="Full name" /></FormField>
          <FormField label="Start Date"><FInput type="date" /></FormField>
          <FormField label="End Date"><FInput type="date" /></FormField>
          <div className="col-span-2">
            <FormField label="Members">
              <div className="border border-slate-200 rounded-lg p-3">
                <div className="flex gap-2 mb-2">
                  <FInput placeholder="Add member name…" />
                  <Btn variant="secondary" size="sm">＋ Add</Btn>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {["Dr. Amina Khan", "CA. Bilal Siddiqui", "Ms. Hina Baig"].map((m) => (
                    <span key={m} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-[#0C447C] text-xs rounded-full">
                      {m}<button className="text-blue-400 hover:text-blue-700 ml-0.5">×</button>
                    </span>
                  ))}
                </div>
              </div>
            </FormField>
          </div>
        </div>
        <div className="p-5 border-t border-slate-100 flex justify-end gap-2">
          <Btn variant="secondary" onClick={() => setModal(false)}>Cancel</Btn>
          <Btn variant="ghost">💾 Save as Draft</Btn>
          <Btn variant="primary" onClick={() => setModal(false)}>✓ Create Committee</Btn>
        </div>
      </Modal>
    </div>
  );
}
