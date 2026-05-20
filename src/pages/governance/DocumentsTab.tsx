import { useState } from "react";
import { Card, CardHeader, Btn, Badge, Modal, FormField, FInput, FSelect, TableWrap, Td, DOCUMENTS } from "./shared";

const DOC_TABS = ["All (342)", "Policy (48)", "Compliance (63)", "Staff (87)", "Accreditation (72)", "Audit (34)"];

const iconCls: Record<string, string> = {
  pdf: "bg-red-100 text-red-700",
  doc: "bg-blue-100 text-blue-700",
  xls: "bg-emerald-100 text-emerald-700",
  ppt: "bg-amber-100 text-amber-700",
};
const catCls: Record<string, string> = {
  Policy: "bg-red-50 text-red-700",
  Compliance: "bg-blue-50 text-blue-700",
  Staff: "bg-slate-100 text-slate-600",
  Accreditation: "bg-purple-50 text-purple-700",
  Audit: "bg-amber-50 text-amber-700",
  Training: "bg-teal-50 text-teal-700",
};

export default function DocumentsTab() {
  const [docTab, setDocTab] = useState(DOC_TABS[0]);
  const [uploadModal, setUploadModal] = useState(false);

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-900">Document Management</h1>
        <p className="text-sm text-slate-500 mt-0.5">Secure document repository — policies, compliance, accreditation, audit files</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Total Documents",    value: "342",    color: "navy"  },
          { label: "Pending Approval",   value: "12",     color: "amber" },
          { label: "Expiring (30 days)", value: "7",      color: "red"   },
          { label: "Storage Used",       value: "4.2 GB", sub: "of 50 GB allocated", color: "blue" },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{k.label}</div>
            <div className="text-2xl font-bold text-slate-800 mt-1">{k.value}</div>
            {k.sub && <div className="text-xs text-slate-400 mt-1">{k.sub}</div>}
          </div>
        ))}
      </div>

      <Card>
        <CardHeader
          title="Document Library"
          actions={
            <div className="flex gap-2">
              <Btn variant="primary" size="sm" onClick={() => setUploadModal(true)}>⬆ Upload Document</Btn>
              <Btn variant="secondary" size="sm">📁 New Folder</Btn>
              <Btn variant="secondary" size="sm">📤 Bulk Export</Btn>
            </div>
          }
        />

        {/* Sub-tabs */}
        <div className="flex overflow-x-auto border-b border-slate-100 px-5">
          {DOC_TABS.map((t) => (
            <button
              key={t}
              onClick={() => setDocTab(t)}
              className={`px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors ${docTab === t ? "border-[#0C447C] text-[#0C447C]" : "border-transparent text-slate-500 hover:text-slate-700"}`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 px-5 py-3 border-b border-slate-100">
          <input placeholder="🔍 Search documents…" className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C] w-52" />
          {[
            ["All Campuses", "Main Campus", "Boys Campus", "Girls Campus", "Riverside"],
            ["All Statuses", "Approved", "Pending Review", "Needs Revision", "Expired"],
            ["Sort: Newest First", "Sort: Oldest First", "Sort: A–Z"],
          ].map((opts, i) => (
            <select key={i} className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none">
              {opts.map(o => <option key={o}>{o}</option>)}
            </select>
          ))}
        </div>

        <TableWrap headers={["Document Name", "Category", "Uploaded By", "Version", "Campus", "Status", "Last Updated", "Actions"]}>
          {DOCUMENTS.map((d) => (
            <tr key={d.name} className="hover:bg-slate-50">
              <Td>
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${iconCls[d.iconCls] ?? "bg-slate-100 text-slate-600"}`}>{d.icon}</div>
                  <span className="font-semibold text-xs text-slate-800">{d.name}</span>
                </div>
              </Td>
              <Td><span className={`text-xs font-semibold px-2 py-0.5 rounded ${catCls[d.cat] ?? "bg-slate-100 text-slate-600"}`}>{d.cat}</span></Td>
              <Td className="text-xs text-slate-600">{d.by}</Td>
              <Td className="text-xs text-slate-400">v{d.ver}</Td>
              <Td className="text-xs">{d.campus}</Td>
              <Td><Badge status={d.status} /></Td>
              <Td className="text-xs text-slate-400 whitespace-nowrap">{d.date}</Td>
              <Td>
                <div className="flex gap-1.5">
                  <Btn variant="secondary" size="xs">View</Btn>
                  {d.status === "Pending Review"  ? <Btn variant="success" size="xs">Approve</Btn>
                   : d.status === "Needs Revision" || d.status === "In Progress" ? <Btn variant="primary" size="xs">Edit</Btn>
                   : <Btn variant="secondary" size="xs">⬇ Download</Btn>}
                </div>
              </Td>
            </tr>
          ))}
        </TableWrap>

        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50 rounded-b-xl">
          <span className="text-xs text-slate-500">Showing 8 of 342 documents</span>
          <div className="flex gap-1">
            {["← Prev", "1", "2", "3", "…", "43", "Next →"].map((p) => (
              <button key={p} className={`min-w-[28px] h-7 rounded border text-xs font-medium px-2 ${p === "1" ? "bg-[#0C447C] text-white border-[#0C447C]" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}>{p}</button>
            ))}
          </div>
        </div>
      </Card>

      {/* Upload Modal */}
      <Modal open={uploadModal} onClose={() => setUploadModal(false)} title="Upload Document">
        <div
          className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center mb-4 cursor-pointer hover:border-[#0C447C] transition-colors"
          onDragOver={(e) => e.preventDefault()}
        >
          <div className="text-4xl mb-3">📄</div>
          <div className="font-semibold text-sm text-slate-700 mb-1">Drag & drop files here</div>
          <div className="text-xs text-slate-400 mb-1">or <span className="text-[#0C447C] underline cursor-pointer">browse files</span></div>
          <div className="text-xs text-slate-400">Supported: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, JPG, PNG · Max 50MB</div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Category" required>
            <FSelect options={["Policy", "Compliance", "Staff Record", "Student Record", "Accreditation Evidence", "Audit File", "Training Material"]} />
          </FormField>
          <FormField label="Campus">
            <FSelect options={["All Campuses", "Main Campus", "Boys Campus", "Girls Campus", "Riverside Branch"]} />
          </FormField>
        </div>
        <FormField label="Document Title"><FInput placeholder="e.g. Safeguarding Policy 2026 v3.2" /></FormField>
        <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer mb-2">
          <input type="checkbox" defaultChecked className="accent-[#0C447C]" /> Requires approval workflow before publishing
        </label>
        <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
          <input type="checkbox" className="accent-[#0C447C]" /> Set document expiry date
        </label>
        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 mt-4">
          <Btn variant="secondary" onClick={() => setUploadModal(false)}>Cancel</Btn>
          <Btn variant="primary">⬆ Upload Document</Btn>
        </div>
      </Modal>
    </div>
  );
}
