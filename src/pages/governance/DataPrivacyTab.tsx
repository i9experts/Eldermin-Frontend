import { useState } from "react";
import { Card, CardHeader, Btn, Badge, Toggle, Modal, FormField, FInput, FSelect, TableWrap, Td, PRIVACY_CATEGORIES, PRIVACY_REQUESTS, CONSENT_DATA, RETENTION_SETTINGS } from "./shared";

const sensitivityBadge: Record<string, string> = {
  Standard:         "bg-blue-50 text-blue-700",
  "Special Category": "bg-red-50 text-red-700",
  Restricted:       "bg-amber-50 text-amber-700",
};

export default function DataPrivacyTab() {
  const [requestModal, setRequestModal] = useState(false);
  const [toggles, setToggles] = useState(PRIVACY_CATEGORIES.map((c) => c.enabled));

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-900">Data Privacy Controls</h1>
        <p className="text-sm text-slate-500 mt-0.5">GDPR, data protection, consent management and retention settings</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Data Categories Managed", value: "7",  color: "navy"  },
          { label: "Pending Consent Reviews", value: "14", color: "amber" },
          { label: "Export Requests",         value: "3",  color: "blue"  },
          { label: "Deletion Requests",       value: "1",  color: "red"   },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{k.label}</div>
            <div className="text-2xl font-bold text-slate-800 mt-1">{k.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Data Categories */}
        <Card>
          <CardHeader title="Data Categories & Masking Controls" actions={<Btn variant="secondary" size="sm">Privacy Report</Btn>} />
          <div className="divide-y divide-slate-50">
            {PRIVACY_CATEGORIES.map((c, i) => (
              <div key={c.name} className="flex items-center gap-3 px-5 py-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0" style={{ background: c.bg }}>{c.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-slate-800">{c.name}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{c.desc}</div>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded whitespace-nowrap ${sensitivityBadge[c.sensitivity] ?? "bg-slate-100 text-slate-600"}`}>{c.sensitivity}</span>
                <Toggle checked={toggles[i]} onChange={(v) => setToggles((prev) => prev.map((t, j) => j === i ? v : t))} />
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          {/* Subject Rights Requests */}
          <Card>
            <CardHeader title="Subject Rights Requests" actions={<Btn variant="primary" size="sm" onClick={() => setRequestModal(true)}>+ New Request</Btn>} />
            <TableWrap headers={["Subject", "Type", "Submitted", "Status", ""]}>
              {PRIVACY_REQUESTS.map((r) => (
                <tr key={r.subject} className="hover:bg-slate-50">
                  <Td className="font-semibold text-xs">{r.subject}</Td>
                  <Td><span className={`text-xs font-semibold px-2 py-0.5 rounded ${r.type === "Export" ? "bg-blue-50 text-blue-700" : r.type === "Delete" ? "bg-red-50 text-red-700" : "bg-purple-50 text-purple-700"}`}>{r.type}</span></Td>
                  <Td className="text-xs text-slate-400">{r.date}</Td>
                  <Td><Badge status={r.status} /></Td>
                  <Td>
                    {r.status === "Pending" ? <Btn variant="success" size="xs">Approve</Btn>
                     : r.status === "Review"  ? <Btn variant="secondary" size="xs">Review</Btn>
                     : <Btn variant="secondary" size="xs">Download</Btn>}
                  </Td>
                </tr>
              ))}
            </TableWrap>
          </Card>

          {/* Retention Settings */}
          <Card>
            <CardHeader title="Data Retention Periods" />
            <div className="px-5 divide-y divide-slate-50">
              {RETENTION_SETTINGS.map((r) => (
                <div key={r.label} className="flex items-center justify-between py-2.5">
                  <span className="text-xs text-slate-600">{r.label}</span>
                  <select className="px-2 py-1 text-xs border border-slate-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#0C447C]">
                    {[r.value, "3 Years", "5 Years", "7 Years", "30 Days", "90 Days", "Indefinite"].filter((v, i, arr) => arr.indexOf(v) === i).map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <div className="flex justify-end px-5 py-3 border-t border-slate-100">
              <Btn variant="primary" size="sm">💾 Save Settings</Btn>
            </div>
          </Card>
        </div>
      </div>

      {/* Consent Management */}
      <Card>
        <CardHeader title="Consent Management Overview" actions={<Btn variant="secondary" size="sm">📤 Export Register</Btn>} />
        <TableWrap headers={["Stakeholder Group", "Consent Type", "Given", "Pending", "Withdrawn", "Last Reviewed", "Status"]}>
          {CONSENT_DATA.map((c) => (
            <tr key={c.group} className="hover:bg-slate-50">
              <Td className="font-semibold text-xs">{c.group}</Td>
              <Td className="text-xs">{c.type}</Td>
              <Td className="text-xs font-bold text-emerald-600">{c.given}</Td>
              <Td className="text-xs font-bold text-amber-600">{c.pending}</Td>
              <Td className="text-xs font-bold text-red-600">{c.withdrawn}</Td>
              <Td className="text-xs text-slate-400">{c.reviewed}</Td>
              <Td><Badge status={c.status} /></Td>
            </tr>
          ))}
        </TableWrap>
      </Card>

      {/* New Request Modal */}
      <Modal open={requestModal} onClose={() => setRequestModal(false)} title="New Subject Rights Request">
        <FormField label="Request Type" required>
          <FSelect options={["Subject Access Request (SAR)", "Data Deletion (Right to Erasure)", "Data Rectification", "Restriction of Processing", "Data Portability"]} />
        </FormField>
        <FormField label="Subject Name" required><FInput placeholder="Full name of data subject" /></FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Relationship"><FSelect options={["Parent / Guardian", "Student", "Staff"]} /></FormField>
          <FormField label="Request Date"><FInput type="date" defaultValue="2026-05-14" /></FormField>
        </div>
        <FormField label="Description"><textarea className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none resize-none h-20" placeholder="Details of the request…" /></FormField>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 mb-4">
          ⚠ Subject access requests must be fulfilled within 30 days under UK GDPR (Article 15). The response deadline will be automatically calculated.
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <Btn variant="secondary" onClick={() => setRequestModal(false)}>Cancel</Btn>
          <Btn variant="primary">Submit Request</Btn>
        </div>
      </Modal>
    </div>
  );
}
