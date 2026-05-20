import { useState } from "react";
import { Card, Badge, Btn, Modal, FormField, FInput, FSelect, TableWrap, Td, DOCUMENTS } from "./shared";

const CATEGORIES = ["All", "Policy", "Academic", "Institutional", "Employee Files", "Student Files"];

export default function DocumentsTab() {
  const [cat, setCat] = useState("All");
  const [view, setView] = useState<"grid" | "list">("list");
  const [upload, setUpload] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = DOCUMENTS.filter(
    (d) => (cat === "All" || d.category === cat) && d.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Document Repository</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage and access all school documents</p>
        </div>
        <div className="flex gap-2">
          <Btn variant="secondary" size="sm">📥 Import</Btn>
          <Btn variant="primary" size="sm" onClick={() => setUpload(true)}>+ Upload Document</Btn>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-4">
        <div className="p-4 flex flex-wrap gap-3 items-center">
          <FInput
            placeholder="Search documents…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-48"
          />
          <FSelect options={["All Campuses", "AAA Campus", "Fatima Campus", "Boys Campus"]} className="w-40" />
          <FSelect options={["All Departments", "HR", "Academic", "Finance", "Operations"]} className="w-44" />
          <FSelect options={["All Statuses", "Approved", "Under Review", "Draft", "Expiring", "Pending Sign"]} className="w-44" />
          <div className="ml-auto flex gap-1">
            <button onClick={() => setView("list")} className={`px-2 py-1.5 rounded text-xs border ${view === "list" ? "bg-[#0C447C] text-white border-[#0C447C]" : "bg-white text-slate-600 border-slate-200"}`}>☰ List</button>
            <button onClick={() => setView("grid")} className={`px-2 py-1.5 rounded text-xs border ${view === "grid" ? "bg-[#0C447C] text-white border-[#0C447C]" : "bg-white text-slate-600 border-slate-200"}`}>⊞ Grid</button>
          </div>
        </div>
        {/* Category sub-tabs */}
        <div className="flex overflow-x-auto border-t border-slate-100">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors ${c === cat ? "border-b-2 text-[#0C447C]" : "text-slate-500 hover:text-slate-700"}`}
              style={c === cat ? { borderBottomColor: "#0C447C" } : {}}
            >{c}</button>
          ))}
        </div>
      </Card>

      {view === "list" ? (
        <Card>
          <TableWrap headers={["Document", "Category", "Version", "Status", "Campus", "Dept.", "Updated", "Expiry", "Uploaded By", "Actions"]}>
            {filtered.map((d, i) => (
              <tr key={i} className="hover:bg-slate-50">
                <Td>
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded text-xs font-bold" style={{ background: d.iconBg, color: d.iconColor }}>{d.icon}</span>
                    <span className="font-medium text-slate-800 text-xs max-w-[220px] truncate">{d.title}</span>
                  </div>
                </Td>
                <Td className="text-xs">{d.category}</Td>
                <Td className="text-xs">{d.version}</Td>
                <Td><Badge status={d.status} /></Td>
                <Td className="text-xs">{d.campus}</Td>
                <Td className="text-xs">{d.dept}</Td>
                <Td className="text-xs">{d.updated}</Td>
                <Td className="text-xs">{d.expiry}</Td>
                <Td className="text-xs">{d.by}</Td>
                <Td>
                  <div className="flex gap-1">
                    <Btn variant="ghost" size="xs">👁</Btn>
                    <Btn variant="ghost" size="xs">↓</Btn>
                    <Btn variant="ghost" size="xs">⋯</Btn>
                  </div>
                </Td>
              </tr>
            ))}
          </TableWrap>
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">Showing {filtered.length} of {DOCUMENTS.length} documents</span>
            <div className="flex gap-1">
              <Btn variant="secondary" size="xs">← Prev</Btn>
              <Btn variant="secondary" size="xs">Next →</Btn>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((d, i) => (
            <Card key={i} className="hover:shadow-md transition-shadow">
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <span className="px-2 py-1 rounded text-sm font-bold" style={{ background: d.iconBg, color: d.iconColor }}>{d.icon}</span>
                  <Badge status={d.status} />
                </div>
                <div className="font-semibold text-slate-800 text-sm mb-1 line-clamp-2">{d.title}</div>
                <div className="text-xs text-slate-500 mb-3">{d.category} · {d.version} · {d.campus}</div>
                <div className="text-xs text-slate-400 mb-3">Updated: {d.updated} · By: {d.by}</div>
                {d.expiry !== "—" && (
                  <div className="text-xs text-red-600 font-medium mb-3">Expires: {d.expiry}</div>
                )}
                <div className="flex gap-2">
                  <Btn variant="secondary" size="xs" className="flex-1 justify-center">View</Btn>
                  <Btn variant="ghost" size="xs">↓</Btn>
                  <Btn variant="ghost" size="xs">⋯</Btn>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={upload} onClose={() => setUpload(false)} title="Upload Document" size="md">
        <FormField label="Document Title" required><FInput placeholder="e.g. HR Policy 2026" /></FormField>
        <FormField label="Category" required><FSelect options={["Policy", "Academic", "Institutional", "Employee Files", "Student Files"]} /></FormField>
        <FormField label="Campus"><FSelect options={["All Campuses", "AAA Campus", "Fatima Campus", "Boys Campus"]} /></FormField>
        <FormField label="Department"><FSelect options={["HR", "Academic", "Finance", "Operations", "Admin"]} /></FormField>
        <FormField label="Expiry Date"><FInput type="date" /></FormField>
        <FormField label="File" required>
          <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center">
            <div className="text-2xl mb-2">📎</div>
            <div className="text-sm text-slate-600">Drag & drop or <span className="text-[#0C447C] font-medium cursor-pointer">browse files</span></div>
            <div className="text-xs text-slate-400 mt-1">PDF, DOC, XLS up to 50MB</div>
          </div>
        </FormField>
        <div className="flex gap-2 justify-end mt-2">
          <Btn variant="secondary" size="sm" onClick={() => setUpload(false)}>Cancel</Btn>
          <Btn variant="primary" size="sm">Upload Document</Btn>
        </div>
      </Modal>
    </div>
  );
}
