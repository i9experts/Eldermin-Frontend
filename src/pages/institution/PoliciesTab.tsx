import { useState } from "react";
import {
  POLICIES,
  Badge, Btn, Card, PageHeader, SearchBar, TableWrapper,
} from "./shared";

export default function PoliciesTab() {
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("All");

  const filtered = POLICIES.filter(
    (p) => (cat === "All" || p.category.includes(cat)) && p.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <PageHeader
        breadcrumbs={["Home", "Institution Setup", "Policy Repository"]}
        title="Policy Repository"
        subtitle={`${POLICIES.length} policies — ${POLICIES.filter((p) => p.status === "Active").length} active, ${POLICIES.filter((p) => p.status === "Expiring Soon" || p.status === "Under Review").length} need attention`}
        actions={
          <div className="flex gap-2">
            <Btn variant="secondary" size="sm">⬇️ Export</Btn>
            <Btn variant="primary" size="sm">＋ Upload Policy</Btn>
          </div>
        }
      />

      <Card className="p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <SearchBar placeholder="Search policies…" value={search} onChange={setSearch} />
          <div className="flex gap-1.5 flex-wrap">
            {["All", "Student Affairs", "HR", "Finance", "Academic", "IT"].map((c) => (
              <button key={c} onClick={() => setCat(c)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${cat === c ? "bg-[#0C447C] text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100"}`}>
                {c}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <TableWrapper headers={["Policy Title", "Category", "Version", "Effective Date", "Review Date", "Approved By", "Status", "Actions"]}>
          {filtered.map((p) => (
            <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
              <td className="py-3 px-4">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">📋</span>
                  <div>
                    <div className="text-sm font-semibold text-slate-800">{p.title}</div>
                    <div className="text-xs text-slate-400">POL-{p.id.toString().padStart(4, "0")}</div>
                  </div>
                </div>
              </td>
              <td className="py-3 px-4 text-xs text-slate-600">{p.category}</td>
              <td className="py-3 px-4"><span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{p.version}</span></td>
              <td className="py-3 px-4 text-xs text-slate-600">{p.effective}</td>
              <td className="py-3 px-4 text-xs text-slate-600">{p.review}</td>
              <td className="py-3 px-4 text-xs text-slate-600">{p.approvedBy}</td>
              <td className="py-3 px-4"><Badge status={p.status} /></td>
              <td className="py-3 px-4">
                <div className="flex gap-1">
                  <button className="px-2 py-1 hover:bg-blue-50 rounded text-[#0C447C] text-xs font-medium">👁️ View</button>
                  <button className="px-2 py-1 hover:bg-slate-100 rounded text-slate-500 text-xs">⬇️</button>
                  <button className="px-2 py-1 hover:bg-slate-100 rounded text-slate-500 text-xs">✏️</button>
                </div>
              </td>
            </tr>
          ))}
        </TableWrapper>
        <div className="p-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-400">Showing {filtered.length} policies</span>
          <div className="flex gap-1">
            {[1, 2].map((n) => (
              <button key={n} className={`w-8 h-8 text-xs rounded-lg ${n === 1 ? "bg-[#0C447C] text-white" : "bg-slate-50 text-slate-600"}`}>{n}</button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
