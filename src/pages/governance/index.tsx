import { useState } from "react";
import {
  LayoutDashboard,
  KeyRound,
  ClipboardList,
  ShieldCheck,
  Shield,
  Calendar,
  Award,
  Landmark,
  Folder,
  ScrollText,
  Settings,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { GovTab } from "./shared";
import DashboardTab      from "./DashboardTab";
import RBACTab           from "./RBACTab";
import AuditLogsTab      from "./AuditLogsTab";
import DataPrivacyTab    from "./DataPrivacyTab";
import SafeguardingTab   from "./SafeguardingTab";
import AttendanceTab     from "./AttendanceTab";
import AccreditationTab  from "./AccreditationTab";
import GovernanceTab     from "./GovernanceTab";
import DocumentsTab      from "./DocumentsTab";
import PoliciesTab       from "./PoliciesTab";
import SettingsTab       from "./SettingsTab";

const TABS: { id: GovTab; label: string; icon: LucideIcon }[] = [
  { id: "dashboard",     label: "Dashboard",    icon: LayoutDashboard },
  { id: "rbac",          label: "RBAC",          icon: KeyRound        },
  { id: "audit",         label: "Audit Logs",    icon: ClipboardList   },
  { id: "privacy",       label: "Data Privacy",  icon: ShieldCheck     },
  { id: "safeguarding",  label: "Safeguarding",  icon: Shield          },
  { id: "attendance",    label: "Attendance",    icon: Calendar        },
  { id: "accreditation", label: "Accreditation", icon: Award           },
  { id: "governance",    label: "Governance",    icon: Landmark        },
  { id: "documents",     label: "Documents",     icon: Folder          },
  { id: "policies",      label: "Policies",      icon: ScrollText      },
  { id: "settings",      label: "Settings",      icon: Settings        },
];

export default function GovernancePage() {
  const [active, setActive] = useState<GovTab>("dashboard");

  const renderTab = () => {
    switch (active) {
      case "dashboard":     return <DashboardTab setTab={setActive} />;
      case "rbac":          return <RBACTab />;
      case "audit":         return <AuditLogsTab />;
      case "privacy":       return <DataPrivacyTab />;
      case "safeguarding":  return <SafeguardingTab />;
      case "attendance":    return <AttendanceTab />;
      case "accreditation": return <AccreditationTab />;
      case "governance":    return <GovernanceTab />;
      case "documents":     return <DocumentsTab />;
      case "policies":      return <PoliciesTab />;
      case "settings":      return <SettingsTab />;
    }
  };

  return (
    <div className="space-y-0">
      {/* Tab bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 -mx-6 px-6 mb-6">
        <div className="flex gap-0.5 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
                active === tab.id
                  ? "border-[#0C447C] text-[#0C447C]"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {renderTab()}
    </div>
  );
}
