import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Card, Badge, Btn, Modal, FormField, FInput, FSelect, TableWrap, Td } from "./shared";
import documentsService from "../../services/documents.service";
import { FileUpload } from "../../components/ui/FileUpload";

const CATEGORIES = ["All", "Policy", "Academic", "Institutional", "Employee Files", "Student Files"];

const ICON_MAP: Record<string, { icon: string; iconBg: string; iconColor: string }> = {
  pdf:  { icon: "PDF", iconBg: "#fee2e2", iconColor: "#991b1b" },
  doc:  { icon: "DOC", iconBg: "#dbeafe", iconColor: "#1d4ed8" },
  docx: { icon: "DOC", iconBg: "#dbeafe", iconColor: "#1d4ed8" },
  xls:  { icon: "XLS", iconBg: "#dcfce7", iconColor: "#15803d" },
  xlsx: { icon: "XLS", iconBg: "#dcfce7", iconColor: "#15803d" },
};

function getIconProps(fileType?: string, fileName?: string) {
  const ext = (fileType || fileName || "").toLowerCase().split(".").pop() || "pdf";
  return ICON_MAP[ext] ?? ICON_MAP.pdf;
}

function formatDate(d?: string | Date) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function categoryLabel(c: string) {
  const MAP: Record<string, string> = {
    policy: "Policy", form: "Academic", template: "Academic",
    letter: "Institutional", certificate: "Institutional",
    report: "Institutional", contract: "Institutional",
    notice: "Institutional", circular: "Institutional",
    admission_doc: "Student Files", hr_doc: "Employee Files",
    finance_doc: "Institutional", other: "Institutional",
  };
  return MAP[c] ?? c;
}

export default function DocumentsTab() {
  const [cat, setCat] = useState("All");
  const [view, setView] = useState<"grid" | "list">("list");
  const [upload, setUpload] = useState(false);
  const [search, setSearch] = useState("");
  const [uploadForm, setUploadForm] = useState({ title: "", category: "Policy", campus: "", dept: "", expiryDate: "", fileUrl: "", fileKey: "", fileName: "", fileSize: 0 });

  const queryClient = useQueryClient();

  const { data: rawDocs = [], isLoading } = useQuery({
    queryKey: ["documents", cat, search],
    queryFn: () => documentsService.getDocuments({
      category: cat !== "All" ? cat.toLowerCase().replace(" ", "_") : undefined,
      search: search || undefined,
    }),
  });

  const createDoc = useMutation({
    mutationFn: documentsService.createDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document uploaded");
      setUpload(false);
      setUploadForm({ title: "", category: "Policy", campus: "", dept: "", expiryDate: "", fileUrl: "", fileKey: "", fileName: "", fileSize: 0 });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to upload"),
  });

  const docList: any[] = Array.isArray(rawDocs) ? rawDocs : ((rawDocs as any)?.data ?? []);
  const docs = docList.map((d: any) => ({
    ...getIconProps(d.fileType, d.fileName),
    _id: d._id,
    title: d.title,
    category: categoryLabel(d.category),
    version: d.version || "v1.0",
    status: d.status ? (d.status.charAt(0).toUpperCase() + d.status.slice(1)) : "Draft",
    campus: d.tags?.find((t: string) => t.startsWith("campus:"))?.replace("campus:", "") || "All",
    dept: d.tags?.find((t: string) => t.startsWith("dept:"))?.replace("dept:", "") || "—",
    updated: formatDate((d as any).updatedAt),
    expiry: d.expiryDate ? formatDate(d.expiryDate) : "—",
    by: d.uploadedBy || "—",
  }));

  const filtered = docs.filter(
    (d) => (cat === "All" || d.category === cat) && d.title.toLowerCase().includes(search.toLowerCase())
  );

  function handleUpload() {
    if (!uploadForm.title) { toast.error("Title is required"); return; }
    createDoc.mutate({
      title: uploadForm.title,
      category: uploadForm.category.toLowerCase().replace(" ", "_"),
      expiryDate: uploadForm.expiryDate || undefined,
      tags: [
        uploadForm.campus ? `campus:${uploadForm.campus}` : null,
        uploadForm.dept ? `dept:${uploadForm.dept}` : null,
      ].filter(Boolean),
    });
  }

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

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="w-6 h-6 border-4 border-[#0C447C] border-t-transparent rounded-full animate-spin" /></div>
      ) : view === "list" ? (
        <Card>
          <TableWrap headers={["Document", "Category", "Version", "Status", "Campus", "Dept.", "Updated", "Expiry", "Uploaded By", "Actions"]}>
            {filtered.length === 0 ? (
              <tr><td colSpan={10} className="px-4 py-12 text-center text-sm text-slate-400">No documents yet. Click + Upload Document to add one.</td></tr>
            ) : filtered.map((d, i) => (
              <tr key={d._id || i} className="hover:bg-slate-50">
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
            <span className="text-xs text-slate-500">Showing {filtered.length} document{filtered.length !== 1 ? "s" : ""}</span>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.length === 0 ? (
            <div className="col-span-3 py-12 text-center text-sm text-slate-400">No documents yet.</div>
          ) : filtered.map((d, i) => (
            <Card key={d._id || i} className="hover:shadow-md transition-shadow">
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
        <FormField label="Document Title" required>
          <FInput placeholder="e.g. HR Policy 2026" value={uploadForm.title} onChange={e => setUploadForm(f => ({ ...f, title: e.target.value }))} />
        </FormField>
        <FormField label="Category" required>
          <FSelect options={["Policy", "Academic", "Institutional", "Employee Files", "Student Files"]} value={uploadForm.category} onChange={e => setUploadForm(f => ({ ...f, category: e.target.value }))} />
        </FormField>
        <FormField label="Campus">
          <FSelect options={["", "All Campuses", "AAA Campus", "Fatima Campus", "Boys Campus"]} value={uploadForm.campus} onChange={e => setUploadForm(f => ({ ...f, campus: e.target.value }))} />
        </FormField>
        <FormField label="Department">
          <FSelect options={["", "HR", "Academic", "Finance", "Operations", "Admin"]} value={uploadForm.dept} onChange={e => setUploadForm(f => ({ ...f, dept: e.target.value }))} />
        </FormField>
        <FormField label="Expiry Date">
          <FInput type="date" value={uploadForm.expiryDate} onChange={e => setUploadForm(f => ({ ...f, expiryDate: e.target.value }))} />
        </FormField>
        <FileUpload
          folder="documents"
          accept=".pdf,.doc,.docx,.jpg,.png"
          multiple={false}
          onUpload={(files) => {
            if (files[0]) {
              setUploadForm(prev => ({
                ...prev,
                fileUrl: files[0].url,
                fileKey: files[0].key,
                fileName: files[0].fileName,
                fileSize: files[0].fileSize,
              }));
            }
          }}
          label="Upload Document File"
          sublabel="PDF, Word, Images supported (Max 10MB)"
        />
        <div className="flex gap-2 justify-end mt-2">
          <Btn variant="secondary" size="sm" onClick={() => setUpload(false)}>Cancel</Btn>
          <Btn variant="primary" size="sm" onClick={handleUpload}>{createDoc.isPending ? "Uploading…" : "Upload Document"}</Btn>
        </div>
      </Modal>
    </div>
  );
}
