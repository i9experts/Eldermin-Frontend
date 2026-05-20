import { useState } from "react";
import { Card, CardHeader, Btn, Toggle, NOTIFICATIONS } from "./shared";

const FILTER_TABS = ["All", "Approvals", "Expiry", "Signatures", "Tasks"];

export default function NotificationsTab() {
  const [filter, setFilter] = useState("All");
  const [emailNew,    setEmailNew]    = useState(true);
  const [emailExpiry, setEmailExpiry] = useState(true);
  const [pushApprove, setPushApprove] = useState(false);
  const [pushTask,    setPushTask]    = useState(true);
  const [dailyDigest, setDailyDigest] = useState(true);

  const filtered = filter === "All" ? NOTIFICATIONS : NOTIFICATIONS.filter((n) => n.type === filter);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Notifications</h1>
          <p className="text-sm text-slate-500 mt-0.5">Document activity alerts and workflow updates</p>
        </div>
        <div className="flex gap-2">
          <Btn variant="ghost" size="sm">Mark All Read</Btn>
          <Btn variant="secondary" size="sm">Clear All</Btn>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Notification list */}
        <div className="lg:col-span-2">
          <Card>
            {/* Filter tabs */}
            <div className="flex border-b border-slate-100">
              {FILTER_TABS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${f === filter ? "text-[#0C447C]" : "text-slate-500 hover:text-slate-700 border-transparent"}`}
                  style={f === filter ? { borderBottomColor: "#0C447C" } : {}}
                >
                  {f}
                  {f !== "All" && (
                    <span className="ml-1 text-xs bg-slate-100 text-slate-600 px-1.5 rounded-full">
                      {NOTIFICATIONS.filter((n) => n.type === f).length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <CardHeader
              title={`${filtered.length} notifications`}
              actions={<Btn variant="ghost" size="xs">Filter ▾</Btn>}
            />

            <div className="divide-y divide-slate-50">
              {filtered.map((n, i) => (
                <div key={i} className={`flex items-start gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer ${i === 0 ? "bg-blue-50/30" : ""}`}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0" style={{ background: n.bg }}>
                    {n.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-semibold text-slate-800 text-sm leading-snug">{n.title}</div>
                      {i === 0 && <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{n.body}</div>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-xs text-slate-400">{n.time}</span>
                      <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">{n.type}</span>
                    </div>
                  </div>
                  <button className="text-slate-300 hover:text-slate-500 text-xs flex-shrink-0 mt-1">✕</button>
                </div>
              ))}
            </div>

            <div className="px-4 py-3 border-t border-slate-100 text-center">
              <Btn variant="ghost" size="sm">Load more notifications</Btn>
            </div>
          </Card>
        </div>

        {/* Notification settings */}
        <div className="space-y-4">
          <Card>
            <CardHeader title="Email Notifications" />
            <div className="p-4 space-y-3">
              {[
                { label: "New approval requests",   sub: "Immediate email on new tasks",   val: emailNew,    set: setEmailNew    },
                { label: "Expiry alerts",            sub: "7 days and 1 day before",        val: emailExpiry, set: setEmailExpiry },
                { label: "Daily digest",             sub: "Summary at 8:00 AM daily",       val: dailyDigest, set: setDailyDigest },
              ].map(({ label, sub, val, set }) => (
                <div key={label} className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold text-slate-700">{label}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{sub}</div>
                  </div>
                  <Toggle checked={val} onChange={set} />
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="Push Notifications" />
            <div className="p-4 space-y-3">
              {[
                { label: "Approval actions",  sub: "When someone approves/rejects", val: pushApprove, set: setPushApprove },
                { label: "Task updates",      sub: "When tasks are updated",        val: pushTask,    set: setPushTask    },
              ].map(({ label, sub, val, set }) => (
                <div key={label} className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold text-slate-700">{label}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{sub}</div>
                  </div>
                  <Toggle checked={val} onChange={set} />
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="Notification Summary" />
            <div className="p-4 space-y-2">
              {FILTER_TABS.slice(1).map((type) => {
                const count = NOTIFICATIONS.filter((n) => n.type === type).length;
                return (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-xs text-slate-600">{type}</span>
                    <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-full">{count}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
