import { useState } from "react";
import { Card, CardHeader, Badge, Btn, FormField, FInput } from "./shared";

const DOCUMENT = {
  icon: "PDF", iconBg: "#fee2e2", iconColor: "#991b1b",
  title: "AKU-EB Affiliation Document 2025–26",
  category: "Institutional", version: "v2.1", status: "Approved",
  campus: "All Campuses", dept: "Admin", updated: "17 May 2026",
  expiry: "30 Jun 2026", by: "Sr. Aisha Malik", size: "2.4 MB",
  pages: 12, workflow: "Affiliation Renewal",
  description: "The official AKU-EB affiliation document confirming The Deenway School's accreditation status for the academic year 2025–26. Includes all examination board requirements, code of conduct, and compliance schedules.",
};

const VERSION_HISTORY = [
  { version: "v2.1", date: "17 May 2026", by: "Sr. Aisha Malik",    change: "Updated expiry and board ref number",    status: "Approved" },
  { version: "v2.0", date: "3 Jan 2026",  by: "Principal Yusuf",    change: "Annual renewal — updated terms",         status: "Approved" },
  { version: "v1.1", date: "5 Sep 2025",  by: "Sr. Aisha Malik",    change: "Minor corrections to section 4",         status: "Archived" },
  { version: "v1.0", date: "1 Aug 2025",  by: "Ms. Fatima Qureshi", change: "Initial upload",                         status: "Archived" },
];

const COMMENTS = [
  { initials: "PY", bg: "#dbeafe", color: "#1d4ed8", name: "Principal Yusuf",      date: "17 May, 9:45 AM",  text: "Approved. Ensure a copy is sent to OFSTED contact." },
  { initials: "AA", bg: "#ede9fe", color: "#5b21b6", name: "Sr. Aisha Malik",      date: "17 May, 9:10 AM",  text: "Uploaded v2.1 — updated expiry date and board reference number." },
  { initials: "FQ", bg: "#fee2e2", color: "#991b1b", name: "Ms. Fatima Qureshi",  date: "16 May, 4:30 PM",  text: "Please review and approve before end of day tomorrow." },
];

export default function DetailTab() {
  const [comment, setComment] = useState("");
  const [activeTab, setActiveTab] = useState<"comments" | "history" | "workflow">("comments");

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <span className="px-2 py-1 rounded text-sm font-bold" style={{ background: DOCUMENT.iconBg, color: DOCUMENT.iconColor }}>{DOCUMENT.icon}</span>
          <div>
            <h1 className="text-xl font-bold text-slate-900 leading-tight">{DOCUMENT.title}</h1>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-xs text-slate-500">{DOCUMENT.category}</span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-500">{DOCUMENT.version}</span>
              <Badge status={DOCUMENT.status} />
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Btn variant="secondary" size="sm">↓ Download</Btn>
          <Btn variant="secondary" size="sm">📤 Share</Btn>
          <Btn variant="amber" size="sm">✍ Send for Sign</Btn>
          <Btn variant="primary" size="sm">✏️ New Version</Btn>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Document preview */}
        <div className="lg:col-span-2">
          <Card className="mb-4">
            <CardHeader title="Document Preview" actions={
              <div className="flex gap-2">
                <Btn variant="ghost" size="xs">◀</Btn>
                <span className="text-xs text-slate-500 self-center">Page 1 of {DOCUMENT.pages}</span>
                <Btn variant="ghost" size="xs">▶</Btn>
              </div>
            } />
            <div className="p-5 flex justify-center">
              <div className="w-full max-w-lg bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-[#0C447C] text-white px-6 py-4">
                  <div className="text-sm font-bold text-center">THE DEENWAY SCHOOL</div>
                  <div className="text-xs opacity-80 text-center mt-0.5">Official Document</div>
                </div>
                <div className="p-6">
                  <div className="text-sm font-bold text-slate-800 text-center mb-4">{DOCUMENT.title}</div>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">{DOCUMENT.description}</p>
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="h-2 bg-slate-200 rounded-full mb-2" style={{ width: `${60 + Math.sin(i * 1.2) * 35}%` }} />
                  ))}
                  <div className="mt-6 pt-4 border-t border-slate-200 flex justify-between text-xs text-slate-500">
                    <span>Document Ref: AKU-EB/2025-26/001</span>
                    <span>Valid until: {DOCUMENT.expiry}</span>
                  </div>
                </div>
                <div className="border-t border-slate-200 px-4 py-2 flex justify-center gap-1">
                  {[...Array(DOCUMENT.pages)].map((_, i) => (
                    <button key={i} className={`w-6 h-6 rounded text-xs ${i === 0 ? "bg-[#0C447C] text-white" : "bg-slate-100 text-slate-600"}`}>{i + 1}</button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Comments / History / Workflow tabs */}
          <Card>
            <div className="flex border-b border-slate-100">
              {(["comments", "history", "workflow"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`px-4 py-2.5 text-xs font-semibold capitalize border-b-2 transition-colors ${t === activeTab ? "text-[#0C447C]" : "text-slate-500 hover:text-slate-700 border-transparent"}`}
                  style={t === activeTab ? { borderBottomColor: "#0C447C" } : {}}
                >{t === "history" ? "Version History" : t === "workflow" ? "Workflow" : "Comments"}</button>
              ))}
            </div>

            {activeTab === "comments" && (
              <div>
                <div className="divide-y divide-slate-50">
                  {COMMENTS.map((c, i) => (
                    <div key={i} className="flex items-start gap-3 px-4 py-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: c.bg, color: c.color }}>{c.initials}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-800">{c.name}</span>
                          <span className="text-xs text-slate-400">{c.date}</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">{c.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t border-slate-100">
                  <FormField label="Add Comment">
                    <div className="flex gap-2">
                      <FInput
                        placeholder="Write a comment…"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="flex-1"
                      />
                      <Btn variant="primary" size="sm" onClick={() => setComment("")}>Post</Btn>
                    </div>
                  </FormField>
                </div>
              </div>
            )}

            {activeTab === "history" && (
              <div className="divide-y divide-slate-50">
                {VERSION_HISTORY.map((v, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <span className="text-xs font-bold text-[#0C447C] w-8 flex-shrink-0">{v.version}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-slate-800">{v.change}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{v.by} · {v.date}</div>
                    </div>
                    <Badge status={v.status} />
                    {i > 0 && <Btn variant="ghost" size="xs">Restore</Btn>}
                    <Btn variant="ghost" size="xs">↓</Btn>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "workflow" && (
              <div className="p-4 space-y-3">
                {[
                  { step: "Document Upload",    by: "Sr. Aisha Malik",    date: "17 May 2026", done: true  },
                  { step: "First Review",       by: "Ms. Fatima Qureshi", date: "17 May 2026", done: true  },
                  { step: "Principal Approval", by: "Principal Yusuf",    date: "17 May 2026", done: true  },
                  { step: "Archive & Notify",   by: "System",             date: "17 May 2026", done: true  },
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${step.done ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"}`}>
                      {step.done ? "✓" : i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-slate-800">{step.step}</div>
                      <div className="text-xs text-slate-500">{step.by} · {step.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Metadata sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader title="Document Details" />
            <div className="p-4 space-y-3">
              {[
                { label: "Category",    value: DOCUMENT.category },
                { label: "Version",     value: DOCUMENT.version  },
                { label: "Campus",      value: DOCUMENT.campus   },
                { label: "Department",  value: DOCUMENT.dept     },
                { label: "File Size",   value: DOCUMENT.size     },
                { label: "Pages",       value: `${DOCUMENT.pages} pages` },
                { label: "Uploaded By", value: DOCUMENT.by       },
                { label: "Last Updated", value: DOCUMENT.updated },
                { label: "Expiry Date", value: DOCUMENT.expiry   },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-xs">
                  <span className="text-slate-500 font-semibold">{label}</span>
                  <span className="text-slate-800 text-right max-w-[120px]">{value}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="Linked Workflow" />
            <div className="p-4">
              <div className="text-xs font-semibold text-slate-800 mb-2">🔄 {DOCUMENT.workflow}</div>
              <div className="text-xs text-slate-500 mb-3">Status: <Badge status="Completed" /></div>
              <Btn variant="secondary" size="xs" className="w-full justify-center">View Workflow →</Btn>
            </div>
          </Card>

          <Card>
            <CardHeader title="Quick Actions" />
            <div className="p-4 space-y-2">
              <Btn variant="secondary" size="sm" className="w-full justify-center">↓ Download PDF</Btn>
              <Btn variant="secondary" size="sm" className="w-full justify-center">📤 Share Link</Btn>
              <Btn variant="amber"     size="sm" className="w-full justify-center">✍ Request Signature</Btn>
              <Btn variant="secondary" size="sm" className="w-full justify-center">🔄 Start Review</Btn>
              <Btn variant="danger"    size="xs" className="w-full justify-center">🗑 Archive</Btn>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
