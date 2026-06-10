import { useState } from "react";
import { Card, CardHeader, Badge, Btn, Modal, FormField, FInput, FSelect, TableWrap, Td } from "./shared";

// TODO: fetch from API when e-signature backend is available
const ESIGNATURE_QUEUE: { doc: string; sender: string; deadline: string; pages: number }[] = [];

export default function ESignaturesTab() {
  const [selected, setSelected] = useState<number | null>(0);
  const [signModal, setSignModal] = useState(false);
  const [sendModal, setSendModal] = useState(false);

  const sel = selected !== null ? ESIGNATURE_QUEUE[selected] : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900">E-Signatures</h1>
          <p className="text-sm text-slate-500 mt-0.5">Documents awaiting your electronic signature</p>
        </div>
        <div className="flex gap-2">
          <Btn variant="secondary" size="sm">📜 Signature History</Btn>
          <Btn variant="primary" size="sm" onClick={() => setSendModal(true)}>+ Send for Signature</Btn>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Awaiting Your Signature", value: "3",  color: "text-[#0C447C]" },
          { label: "Sent for Signature",       value: "7",  color: "text-[#EF9F27]" },
          { label: "Completed This Month",     value: "24", color: "text-emerald-600" },
          { label: "Overdue",                  value: "1",  color: "text-red-600"    },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{k.label}</div>
            <div className={`text-2xl font-bold mt-1 ${k.color}`}>{k.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Queue list */}
        <div>
          <Card>
            <CardHeader title={`Pending Signatures (${ESIGNATURE_QUEUE.length})`} />
            <div className="divide-y divide-slate-50">
              {ESIGNATURE_QUEUE.map((item, i) => (
                <div
                  key={i}
                  onClick={() => setSelected(i)}
                  className={`p-4 cursor-pointer transition-colors ${selected === i ? "bg-blue-50 border-l-2 border-[#0C447C]" : "hover:bg-slate-50"}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="font-semibold text-slate-800 text-xs leading-tight">{item.doc}</div>
                    <Badge status={item.deadline === "Today" ? "Critical" : "Pending"} />
                  </div>
                  <div className="text-xs text-slate-500 mt-1">From: {item.sender}</div>
                  <div className={`text-xs font-medium mt-1 ${item.deadline === "Today" ? "text-red-600" : "text-slate-600"}`}>
                    Due: {item.deadline}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">{item.pages} pages</div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Preview panel */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            {sel ? (
              <>
                <CardHeader
                  title={sel.doc}
                  subtitle={`Sent by ${sel.sender} · ${sel.pages} pages · Due ${sel.deadline}`}
                  actions={
                    <div className="flex gap-2">
                      <Btn variant="secondary" size="sm">↓ Download</Btn>
                      <Btn variant="danger" size="sm">✕ Decline</Btn>
                      <Btn variant="success" size="sm" onClick={() => setSignModal(true)}>✍ Sign Now</Btn>
                    </div>
                  }
                />
                {/* Document preview mockup */}
                <div className="p-5 flex flex-col items-center">
                  <div className="w-full max-w-lg bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                    {/* Doc header */}
                    <div className="bg-[#0C447C] text-white text-center py-3">
                      <div className="text-sm font-bold">THE DEENWAY SCHOOL</div>
                      <div className="text-xs opacity-80 mt-0.5">Official Document</div>
                    </div>
                    {/* Doc body mockup */}
                    <div className="p-6 space-y-3">
                      <div className="text-sm font-bold text-slate-800 text-center">{sel.doc}</div>
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-2.5 bg-slate-200 rounded-full" style={{ width: `${75 + Math.sin(i) * 20}%` }} />
                      ))}
                      <div className="h-2.5 bg-slate-200 rounded-full w-1/2" />
                      <div className="mt-6 pt-4 border-t border-slate-200 grid grid-cols-2 gap-6">
                        <div>
                          <div className="text-xs text-slate-500 mb-1">Prepared by</div>
                          <div className="h-8 border border-dashed border-slate-300 rounded flex items-center justify-center text-xs text-slate-400">Signed</div>
                          <div className="text-xs text-slate-500 mt-1">{sel.sender}</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 mb-1">Signature required</div>
                          <div className="h-8 border-2 border-dashed border-[#0C447C] rounded flex items-center justify-center text-xs text-[#0C447C] font-medium cursor-pointer hover:bg-blue-50" onClick={() => setSignModal(true)}>
                            ✍ Click to sign
                          </div>
                          <div className="text-xs text-slate-500 mt-1">Your signature</div>
                        </div>
                      </div>
                    </div>
                    {/* Page indicator */}
                    <div className="border-t border-slate-200 px-4 py-2 flex items-center justify-between">
                      <span className="text-xs text-slate-400">Page 1 of {sel.pages}</span>
                      <div className="flex gap-1">
                        {[...Array(sel.pages)].map((_, i) => (
                          <button key={i} className={`w-6 h-6 rounded text-xs ${i === 0 ? "bg-[#0C447C] text-white" : "bg-slate-100 text-slate-600"}`}>{i + 1}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-60 text-slate-400">
                <div className="text-4xl mb-3">✍️</div>
                <div className="text-sm">Select a document to preview and sign</div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Signature history */}
      <Card className="mt-4">
        <CardHeader title="Recent Signature Activity" />
        <TableWrap headers={["Document", "Action", "Signed By", "Date", "Status"]}>
          {[
            { doc: "Staff Contract – Ahmed Khan", action: "Signed",      by: "Principal Yusuf",    date: "16 May 2026", status: "Completed" },
            { doc: "MOU – Boys Campus Annex",    action: "Signed",      by: "Sr. Aisha Malik",    date: "14 May 2026", status: "Completed" },
            { doc: "Admission Form – Zaid Ibrahim", action: "Declined", by: "Ms. Fatima Qureshi", date: "13 May 2026", status: "Rejected"  },
          ].map((r, i) => (
            <tr key={i} className="hover:bg-slate-50">
              <Td className="text-xs font-medium">{r.doc}</Td>
              <Td className="text-xs">{r.action}</Td>
              <Td className="text-xs">{r.by}</Td>
              <Td className="text-xs text-slate-500">{r.date}</Td>
              <Td><Badge status={r.status} /></Td>
            </tr>
          ))}
        </TableWrap>
      </Card>

      {/* Sign modal */}
      <Modal open={signModal} onClose={() => setSignModal(false)} title="E-Sign Document" size="sm">
        <p className="text-sm text-slate-700 mb-4">{sel?.doc}</p>
        <div className="border-2 border-dashed border-[#0C447C] rounded-xl h-28 flex flex-col items-center justify-center bg-blue-50 mb-4">
          <div className="text-2xl mb-1">✍️</div>
          <div className="text-xs text-slate-500">Draw your signature here</div>
        </div>
        <FormField label="Full Name" required><FInput placeholder="Type your full legal name" /></FormField>
        <FormField label="Designation"><FInput placeholder="e.g. Principal" /></FormField>
        <p className="text-xs text-slate-400 mb-4">By signing, you confirm this is a legally binding electronic signature.</p>
        <div className="flex gap-2 justify-end">
          <Btn variant="secondary" size="sm" onClick={() => setSignModal(false)}>Cancel</Btn>
          <Btn variant="success" size="sm" onClick={() => setSignModal(false)}>✓ Apply Signature</Btn>
        </div>
      </Modal>

      {/* Send for signature modal */}
      <Modal open={sendModal} onClose={() => setSendModal(false)} title="Send Document for Signature" size="md">
        <FormField label="Document" required><FInput placeholder="Select or attach document…" /></FormField>
        <FormField label="Recipients" required><FInput placeholder="Add names or email addresses…" /></FormField>
        <FormField label="Signing Order"><FSelect options={["Any order", "Sequential (in order)", "Parallel (all at once)"]} /></FormField>
        <FormField label="Deadline"><FInput type="date" /></FormField>
        <FormField label="Message">
          <textarea className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]" rows={3} placeholder="Add a message for signatories…" />
        </FormField>
        <div className="flex gap-2 justify-end mt-2">
          <Btn variant="secondary" size="sm" onClick={() => setSendModal(false)}>Cancel</Btn>
          <Btn variant="primary" size="sm">Send for Signature</Btn>
        </div>
      </Modal>
    </div>
  );
}
