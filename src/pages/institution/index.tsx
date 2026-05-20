import { useState } from "react";
import {
  LayoutDashboard,
  Landmark,
  School,
  Building2,
  Users,
  Scale,
  ScrollText,
  CheckCircle,
  Calendar,
  GitBranch,
  BarChart2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import DashboardTab from "./DashboardTab";
import InstitutionsTab from "./InstitutionsTab";
import CampusesTab from "./CampusesTab";
import DepartmentsTab from "./DepartmentsTab";
import CommitteesTab from "./CommitteesTab";
import BoardTab from "./BoardTab";
import PoliciesTab from "./PoliciesTab";
import ApprovalsTab from "./ApprovalsTab";
import MeetingsTab from "./MeetingsTab";
import WorkflowsTab from "./WorkflowsTab";
import AuditTab from "./AuditTab";
import type { TabSection } from "./shared";

const TABS: { id: TabSection; label: string; icon: LucideIcon }[] = [
  { id: "dashboard",    label: "Overview",     icon: LayoutDashboard },
  { id: "institutions", label: "Institutions", icon: Landmark        },
  { id: "campuses",     label: "Campuses",     icon: School          },
  { id: "departments",  label: "Departments",  icon: Building2       },
  { id: "committees",   label: "Committees",   icon: Users           },
  { id: "board",        label: "Board",        icon: Scale           },
  { id: "policies",     label: "Policies",     icon: ScrollText      },
  { id: "approvals",    label: "Approvals",    icon: CheckCircle     },
  { id: "meetings",     label: "Meetings",     icon: Calendar        },
  { id: "workflows",    label: "Workflows",    icon: GitBranch       },
  { id: "audit",        label: "Audit Logs",   icon: BarChart2       },
];

export default function InstitutionSetup() {
  const [active, setActive] = useState<TabSection>("dashboard");

  const renderTab = () => {
    switch (active) {
      case "dashboard":    return <DashboardTab setSection={setActive} />;
      case "institutions": return <InstitutionsTab />;
      case "campuses":     return <CampusesTab />;
      case "departments":  return <DepartmentsTab />;
      case "committees":   return <CommitteesTab />;
      case "board":        return <BoardTab />;
      case "policies":     return <PoliciesTab />;
      case "approvals":    return <ApprovalsTab />;
      case "meetings":     return <MeetingsTab />;
      case "workflows":    return <WorkflowsTab />;
      case "audit":        return <AuditTab />;
    }
  };

  return (
    <div className="space-y-0">
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
