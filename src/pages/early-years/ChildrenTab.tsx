import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, AvatarBubble, Btn } from "./shared";
import eceService from "../../services/ece.service";
import QuickObserveModal from "./QuickObserveModal";
import ObservationFormModal from "./ObservationFormModal";

export default function ChildrenTab({ onOpenProfile }: { onOpenProfile: (child: any) => void }) {
  const [observeChild, setObserveChild] = useState<any>(null);
  const [fullFormChild, setFullFormChild] = useState<any>(null);
  const [search, setSearch] = useState("");

  const { data: children = [], isLoading } = useQuery({ queryKey: ["ece-children"], queryFn: eceService.getChildren });

  const filtered = (children as any[]).filter((c) =>
    `${c.firstName} ${c.lastName}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {observeChild && <QuickObserveModal child={observeChild} onClose={() => setObserveChild(null)} />}
      {fullFormChild && <ObservationFormModal child={fullFormChild} onClose={() => setFullFormChild(null)} />}

      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">My Children</h2>
          <p className="text-sm text-slate-500">{(children as any[]).length} children enrolled in Early Years</p>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search children…"
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C] w-64"
        />
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-slate-400">Loading…</div>
      ) : filtered.length === 0 ? (
        <Card className="p-16 text-center">
          <div className="text-5xl mb-4">🧒</div>
          <p className="font-semibold text-slate-700 mb-1">
            {(children as any[]).length === 0 ? "No Early Years children yet" : "No results"}
          </p>
          <p className="text-sm text-slate-400">
            {(children as any[]).length === 0
              ? "Mark existing students as \"Early Years\" from their profile's Academic tab to see them here."
              : "Try a different search."}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {filtered.map((child: any) => (
            <Card key={child._id} className="p-4">
              <div className="flex flex-col items-center text-center mb-3">
                <AvatarBubble name={`${child.firstName} ${child.lastName}`} photoUrl={child.photo} size="lg" />
                <p className="font-semibold text-slate-800 mt-2 text-sm">{child.firstName} {child.lastName}</p>
                <p className="text-xs text-slate-400">{child.currentGrade}{child.currentSection ? ` — ${child.currentSection}` : ""}</p>
              </div>
              <div className="flex gap-1.5">
                <Btn variant="secondary" size="sm" className="flex-1" onClick={() => onOpenProfile(child)}>Profile</Btn>
                <Btn variant="primary" size="sm" className="flex-1" onClick={() => setObserveChild(child)}>+ Observe</Btn>
              </div>
              <button onClick={() => setFullFormChild(child)} className="w-full text-center text-xs text-slate-400 hover:text-[#0C447C] mt-2">
                Full observation with evidence →
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
