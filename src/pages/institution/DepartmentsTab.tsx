import { useState } from "react";
import {
  DEPARTMENTS,
  AvatarBubble, Badge, Btn, Card, FSelect, PageHeader, SearchBar, TableWrapper,
} from "./shared";

export default function DepartmentsTab() {
  const [search, setSearch] = useState("");

  const filtered = DEPARTMENTS.filter(
    (d) => d.name.toLowerCase().includes(search.toLowerCase()) || d.head.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <PageHeader
        breadcrumbs={["Home", "Institution Setup", "Departments"]}
        title="Department Hierarchy"
        subtitle={`${DEPARTMENTS.length} departments across all campuses`}
        actions={
          <div className="flex gap-2">
            <Btn variant="secondary" size="sm">⬇️ Export</Btn>
            <Btn variant="primary" size="sm">＋ Add Department</Btn>
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
          {filtered.map((d) => (
            <tr key={d.id} className="hover:bg-slate-50/60 transition-colors">
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
                <div className="flex items-center gap-1.5"><AvatarBubble name={d.head} /><span className="text-xs text-slate-700">{d.head}</span></div>
              </td>
              <td className="py-3 px-4 text-xs text-slate-600">{d.campus}</td>
              <td className="py-3 px-4"><Badge status={d.status} /></td>
              <td className="py-3 px-4">
                <div className="flex gap-1">
                  <button className="p-1.5 hover:bg-blue-50 rounded text-[#0C447C] text-xs">👁️</button>
                  <button className="p-1.5 hover:bg-slate-100 rounded text-slate-500 text-xs">✏️</button>
                </div>
              </td>
            </tr>
          ))}
        </TableWrapper>
      </Card>
    </div>
  );
}
