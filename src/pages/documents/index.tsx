import { useState } from "react";
import {
  LayoutDashboard,
  FileText,
  GitBranch,
  Wrench,
  CheckCircle,
  PenTool,
  ClipboardList,
  Bell,
  Shield,
  Lock,
  Eye,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ModuleHeader } from "../../components/layout/ModuleHeader";
import { TabBar } from "../../components/layout/TabBar";
import { DocTab } from "./shared";
import DashboardTab     from "./DashboardTab";
import DocumentsTab     from "./DocumentsTab";
import WorkflowsTab     from "./WorkflowsTab";
import WorkflowBuilderTab from "./WorkflowBuilderTab";
import ApprovalsTab     from "./ApprovalsTab";
import ESignaturesTab   from "./ESignaturesTab";
import TasksTab         from "./TasksTab";
import NotificationsTab from "./NotificationsTab";
import AuditTab         from "./AuditTab";
import PermissionsTab   from "./PermissionsTab";
import DetailTab        from "./DetailTab";

interface TabDef {
  id: DocTab;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

const TABS: TabDef[] = [
  { id: "dashboard",     label: "Dashboard",       icon: LayoutDashboard },
  { id: "documents",     label: "Documents",        icon: FileText        },
  { id: "workflows",     label: "Workflows",        icon: GitBranch       },
  { id: "wfbuilder",     label: "Workflow Builder", icon: Wrench          },
  { id: "approvals",     label: "Approvals",        icon: CheckCircle  },
  { id: "esignatures",   label: "E-Signatures",     icon: PenTool      },
  { id: "tasks",         label: "Tasks",            icon: ClipboardList },
  { id: "notifications", label: "Notifications",    icon: Bell         },
  { id: "audit",         label: "Audit Trail",      icon: Shield          },
  { id: "permissions",   label: "Permissions",      icon: Lock            },
  { id: "detail",        label: "Doc Detail",       icon: Eye             },
];

export default function DocumentsPage() {
  const [tab, setTab] = useState<DocTab>("dashboard");

  const renderTab = () => {
    switch (tab) {
      case "dashboard":    return <DashboardTab />;
      case "documents":    return <DocumentsTab />;
      case "workflows":    return <WorkflowsTab />;
      case "wfbuilder":    return <WorkflowBuilderTab />;
      case "approvals":    return <ApprovalsTab />;
      case "esignatures":  return <ESignaturesTab />;
      case "tasks":        return <TasksTab />;
      case "notifications": return <NotificationsTab />;
      case "audit":        return <AuditTab />;
      case "permissions":  return <PermissionsTab />;
      case "detail":       return <DetailTab />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-white border-b border-gray-100">
        <ModuleHeader
          icon={FileText}
          title="Documents & Workflow"
          subtitle="Document library, approval workflows, e-signatures and audit trail"
        />
        <div className="px-6">
          <TabBar
            tabs={TABS.map((t) => ({ id: t.id, label: t.label, icon: t.icon, count: t.badge }))}
            activeId={tab}
            onChange={(id) => setTab(id as DocTab)}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {renderTab()}
      </div>
    </div>
  );
}
