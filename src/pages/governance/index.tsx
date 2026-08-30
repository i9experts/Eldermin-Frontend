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
  MessageSquareWarning,
  Settings,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ModuleHeader } from "../../components/layout/ModuleHeader";
import { TabBar } from "../../components/layout/TabBar";
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
import ComplaintsTab     from "./ComplaintsTab";
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
  { id: "complaints",    label: "Complaints",    icon: MessageSquareWarning },
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
      case "complaints":    return <ComplaintsTab />;
      case "settings":      return <SettingsTab />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-white border-b border-gray-100">
        <ModuleHeader
          icon={ShieldCheck}
          title="Governance & Compliance"
          subtitle="RBAC, audit logs, data privacy, safeguarding and institutional accreditation"
        />
        <div className="px-6">
          <TabBar tabs={TABS} activeId={active} onChange={(id) => setActive(id as GovTab)} />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6">{renderTab()}</div>
    </div>
  );
}
