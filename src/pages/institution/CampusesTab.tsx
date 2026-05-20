import { useState } from "react";
import {
  CAMPUSES,
  AvatarBubble, Badge, Btn, Card, FSelect, PageHeader, SearchBar, TableWrapper,
} from "./shared";

export default function CampusesTab() {
  const [view, setView] = useState<"table" | "tree">("table");
  const [search, setSearch] = useState("");

  const filtered = CAMPUSES.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.city.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <PageHeader
        breadcrumbs={["Home", "Institution Setup", "Campuses"]}
        title="Campus Management"
        subtitle={`${CAMPUSES.length} campuses across the network`}
        actions={
          <div className="flex gap-2">
            <div className="flex gap-0.5 bg-slate-100 rounded-lg p-0.5">
              {([{ v: "table", i: "☰" }, { v: "tree", i: "🌳" }] as const).map(({ v, i }) => (
                <button key={v} onClick={() => setView(v)} className={`px-3 py-1.5 text-sm rounded-md transition-colors ${view === v ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>{i} {v}</button>
              ))}
            </div>
            <Btn variant="primary" size="sm">＋ Add Campus</Btn>
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
            {filtered.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 text-sm">🏫</div>
                    <span className="text-sm font-semibold text-slate-800">{c.name}</span>
                  </div>
                </td>
                <td className="py-3 px-4"><span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{c.code}</span></td>
                <td className="py-3 px-4 text-xs text-slate-600">{c.type}</td>
                <td className="py-3 px-4 text-xs text-slate-600">📍 {c.city}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1.5"><AvatarBubble name={c.head} /><span className="text-xs text-slate-700">{c.head}</span></div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full w-16">
                      <div className="h-1.5 bg-[#0C447C] rounded-full" style={{ width: `${(c.enrolled / c.capacity) * 100}%` }} />
                    </div>
                    <span className="text-xs text-slate-600">{c.enrolled.toLocaleString()}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-xs text-slate-500">{c.capacity.toLocaleString()}</td>
                <td className="py-3 px-4"><Badge status={c.status} /></td>
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
                {CAMPUSES.filter((_, i) => i % 3 === ri).map((c) => (
                  <div key={c.id} className="ml-6 flex items-center gap-2 p-2.5 bg-white border border-slate-100 rounded-lg mt-1 hover:bg-slate-50 transition-colors cursor-pointer">
                    <span className="text-slate-300 mr-1">└─</span>
                    <span>🏫</span>
                    <span className="text-xs font-medium text-slate-800">{c.name}</span>
                    <Badge status={c.status} small />
                    <span className="ml-auto text-xs text-slate-400">{c.enrolled}/{c.capacity}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
