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
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ModuleHeader } from "../../components/layout/ModuleHeader";
import { TabBar } from "../../components/layout/TabBar";
import ModuleTourButton from "../../components/tour/ModuleTourButton";
import { buildModuleTourSteps } from "../../components/tour/moduleTourSteps";
import { useAuth } from "../../contexts/AuthContext";
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
];

export default function DocumentsPage() {
  const { canAccess } = useAuth();
  const visibleTabs = TABS.filter(t => canAccess("documents:view", t.id));
  const [tab, setTab] = useState<DocTab>(() => visibleTabs[0]?.id ?? "dashboard");

  const renderTab = () => {
    if (!canAccess("documents:view", tab)) {
      return (
        <div className="text-center py-16 text-slate-400">
          <p className="text-sm font-medium">You don't have access to this section.</p>
          <p className="text-xs mt-1">Ask an administrator to grant it under Roles &amp; Permissions.</p>
        </div>
      );
    }
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
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-white border-b border-gray-100">
        <ModuleHeader
          icon={FileText}
          title="Documents & Workflow"
          subtitle="Document library, approval workflows, e-signatures and audit trail"
          actions={<ModuleTourButton moduleKey="documents" steps={buildModuleTourSteps(visibleTabs, {
            dashboard: 'An overview of documents, pending approvals, and tasks.',
            documents: 'Your document library - store, organize, and share files.',
            workflows: 'Approval workflows already set up for documents.',
            wfbuilder: 'Build a new approval workflow from scratch.',
            approvals: 'Documents awaiting your approval.',
            esignatures: 'Request and track e-signatures on documents.',
            tasks: 'Document-related tasks assigned to you or your team.',
            notifications: 'Document and workflow notifications.',
            audit: 'An audit trail of every document action.',
            permissions: 'Who can view, edit, or approve each document.',
            detail: 'A single document\'s full detail view.',
          })} />}
        />
        <div className="px-6">
          <TabBar
            tabs={visibleTabs.map((t) => ({ id: t.id, label: t.label, icon: t.icon, count: t.badge }))}
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
