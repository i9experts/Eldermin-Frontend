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
  { id: "approvals",     label: "Approvals",        icon: CheckCircle,  badge: 7 },
  { id: "esignatures",   label: "E-Signatures",     icon: PenTool,      badge: 3 },
  { id: "tasks",         label: "Tasks",            icon: ClipboardList, badge: 5 },
  { id: "notifications", label: "Notifications",    icon: Bell,         badge: 6 },
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
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex overflow-x-auto px-4">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${tab === t.id ? "border-[#0C447C] text-[#0C447C]" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"}`}
            >
              <t.icon className="w-4 h-4" />
              <span>{t.label}</span>
              {t.badge !== undefined && (
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${tab === t.id ? "bg-[#0C447C] text-white" : "bg-[#EF9F27] text-white"}`}>
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {renderTab()}
      </div>
    </div>
  );
}
