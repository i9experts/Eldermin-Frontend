import { useState } from "react";
import { Card, CardHeader, Btn, Toggle } from "./shared";

const NOTIFICATIONS = [
  { label: "Email Notifications — Compliance Alerts",    checked: true  },
  { label: "Auto-Remind Overdue Policy Acknowledgements", checked: true  },
  { label: "SMS Alerts for Critical Risk Events",         checked: false },
  { label: "Weekly Compliance Summary Email",             checked: true  },
  { label: "Daily Audit Log Digest",                      checked: false },
  { label: "Safeguarding Incident Notifications",         checked: true  },
];

const SECURITY = [
  { label: "Two-Factor Authentication (2FA)", checked: true  },
  { label: "Session Timeout (30 minutes)",    checked: true  },
  { label: "IP Allowlisting",                 checked: false },
  { label: "Audit Log Tamper Protection",     checked: true  },
  { label: "Data Encryption at Rest",         checked: true  },
  { label: "Automated Brute-Force Blocking",  checked: true  },
];

export default function SettingsTab() {
  const [notifs, setNotifs] = useState(NOTIFICATIONS.map((n) => n.checked));
  const [security, setSecurity] = useState(SECURITY.map((s) => s.checked));

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-900">System Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">Compliance module configuration, notifications, security and preferences</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Notification Preferences" />
          <div className="px-5 divide-y divide-slate-50">
            {NOTIFICATIONS.map((n, i) => (
              <div key={n.label} className="flex items-center justify-between py-3">
                <span className="text-sm text-slate-700">{n.label}</span>
                <Toggle checked={notifs[i]} onChange={(v) => setNotifs((prev) => prev.map((t, j) => j === i ? v : t))} />
              </div>
            ))}
          </div>
          <div className="flex justify-end px-5 py-3 border-t border-slate-100">
            <Btn variant="primary" size="sm">Save Notifications</Btn>
          </div>
        </Card>

        <Card>
          <CardHeader title="Security Settings" />
          <div className="px-5 divide-y divide-slate-50">
            {SECURITY.map((s, i) => (
              <div key={s.label} className="flex items-center justify-between py-3">
                <span className="text-sm text-slate-700">{s.label}</span>
                <Toggle checked={security[i]} onChange={(v) => setSecurity((prev) => prev.map((t, j) => j === i ? v : t))} />
              </div>
            ))}
          </div>
          <div className="flex justify-end px-5 py-3 border-t border-slate-100">
            <Btn variant="primary" size="sm">Save Security</Btn>
          </div>
        </Card>
      </div>
    </div>
  );
}
