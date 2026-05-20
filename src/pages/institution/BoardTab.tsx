import { useState } from "react";
import {
  BOARD_MEMBERS,
  AvatarBubble, Badge, Btn, Card, Drawer, PageHeader,
} from "./shared";

export default function BoardTab() {
  const [drawer, setDrawer] = useState<typeof BOARD_MEMBERS[0] | null>(null);

  return (
    <div className="space-y-5">
      <PageHeader
        breadcrumbs={["Home", "Institution Setup", "Board of Directors"]}
        title="Board of Directors"
        subtitle={`${BOARD_MEMBERS.length} members — ${BOARD_MEMBERS.filter((m) => m.status === "Active").length} active, ${BOARD_MEMBERS.filter((m) => m.status === "Expiring").length} expiring soon`}
        actions={
          <div className="flex gap-2">
            <Btn variant="secondary" size="sm">📊 Attendance Report</Btn>
            <Btn variant="primary" size="sm">＋ Add Member</Btn>
          </div>
        }
      />

      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 flex items-center gap-2">
        ⚠️ <strong>Term Expiry Alert:</strong> Mufti Abdullah Ghazi's term ends 2025-05-31. Please initiate renewal.
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
        {BOARD_MEMBERS.map((m) => (
          <Card key={m.id} className="p-5 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setDrawer(m)}>
            <div className="flex items-start gap-3 mb-3">
              <AvatarBubble name={m.name} size="lg" />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-1">
                  <div>
                    <div className="text-sm font-bold text-slate-900 leading-tight">{m.name}</div>
                    <div className="text-xs text-slate-500">{m.designation}</div>
                  </div>
                  <Badge status={m.status} small />
                </div>
              </div>
            </div>
            <div className="space-y-1.5 text-xs border-t border-slate-100 pt-3">
              <div className="flex justify-between"><span className="text-slate-400">Role</span><span className="text-slate-700 font-medium">{m.role}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Term End</span><span className={`font-medium ${m.status === "Expiring" ? "text-orange-600" : "text-slate-700"}`}>{m.termEnd}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Voting Rights</span><span>{m.voting ? "✅ Yes" : "❌ No"}</span></div>
            </div>
          </Card>
        ))}
      </div>

      <Drawer open={!!drawer} onClose={() => setDrawer(null)} title="Board Member Profile">
        {drawer && (
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
              <AvatarBubble name={drawer.name} size="lg" />
              <div>
                <h3 className="font-bold text-slate-900">{drawer.name}</h3>
                <p className="text-sm text-slate-500">{drawer.designation}</p>
                <Badge status={drawer.status} />
              </div>
            </div>
            {([["Role", drawer.role], ["Email", drawer.email], ["Term Start", drawer.joining], ["Term End", drawer.termEnd], ["Voting Rights", drawer.voting ? "Yes" : "No"]] as [string, string][]).map(([k, v]) => (
              <div key={k} className="flex justify-between py-2.5 border-b border-slate-50 text-sm">
                <span className="text-slate-500">{k}</span>
                <span className={`font-medium ${k === "Term End" && drawer.status === "Expiring" ? "text-orange-600" : "text-slate-800"}`}>{v}</span>
              </div>
            ))}
            <div className="pt-2 space-y-2">
              <Btn variant="primary" className="w-full justify-center">✏️ Edit Member</Btn>
              <Btn variant="secondary" className="w-full justify-center">📅 Meeting History</Btn>
              <Btn variant="secondary" className="w-full justify-center">🔄 Renew Term</Btn>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
