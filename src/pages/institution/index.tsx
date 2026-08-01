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
  GraduationCap,
  CalendarRange,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import DashboardTab from "./DashboardTab";
import InstitutionsTab from "./InstitutionsTab";
import CampusesTab from "./CampusesTab";
import DepartmentsTab from "./DepartmentsTab";
import GradesTab from "./GradesTab";
import AcademicYearsTab from "./AcademicYearsTab";
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
  { id: "grades",       label: "Classes & Sections", icon: GraduationCap },
  { id: "academicYears",label: "Academic Years", icon: CalendarRange },
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
  // openModal tracks which tab should auto-open its modal on next mount
  const [openModal, setOpenModal] = useState<TabSection | null>(null);

  function switchTab(tab: TabSection) {
    setActive(tab);
    setOpenModal(null);
  }

  function handleQuickAction(tab: TabSection, withModal: boolean) {
    setActive(tab);
    setOpenModal(withModal ? tab : null);
  }

  const renderTab = () => {
    switch (active) {
      case "dashboard":    return <DashboardTab setSection={switchTab} onQuickAction={handleQuickAction} />;
      case "institutions": return <InstitutionsTab setSection={switchTab} />;
      case "campuses":     return <CampusesTab initialModal={openModal === "campuses"} />;
      case "departments":  return <DepartmentsTab initialModal={openModal === "departments"} />;
      case "grades":       return <GradesTab initialModal={openModal === "grades"} />;
      case "academicYears": return <AcademicYearsTab initialModal={openModal === "academicYears"} />;
      case "committees":   return <CommitteesTab initialModal={openModal === "committees"} />;
      case "board":        return <BoardTab />;
      case "policies":     return <PoliciesTab />;
      case "approvals":    return <ApprovalsTab />;
      case "meetings":     return <MeetingsTab initialModal={openModal === "meetings"} />;
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
              onClick={() => switchTab(tab.id)}
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
