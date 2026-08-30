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
  Key,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ModuleHeader } from "../../components/layout/ModuleHeader";
import { TabBar } from "../../components/layout/TabBar";
import DashboardTab from "./DashboardTab";
import InstitutionsTab from "./InstitutionsTab";
import CampusesTab from "./CampusesTab";
import DepartmentsTab from "./DepartmentsTab";
import GradesTab from "./GradesTab";
import AcademicYearsTab from "./AcademicYearsTab";
import DelegationsTab from "./DelegationsTab";
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
  { id: "delegations",  label: "Authority Delegation", icon: Key },
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
  const [campusInstitutionFilter, setCampusInstitutionFilter] = useState<string | null>(null);

  function switchTab(tab: TabSection) {
    setActive(tab);
    setOpenModal(null);
    setCampusInstitutionFilter(null);
  }

  function goToCampusesForInstitution(institutionId: string) {
    setActive("campuses");
    setOpenModal(null);
    setCampusInstitutionFilter(institutionId);
  }

  function handleQuickAction(tab: TabSection, withModal: boolean) {
    setActive(tab);
    setOpenModal(withModal ? tab : null);
    setCampusInstitutionFilter(null);
  }

  const renderTab = () => {
    switch (active) {
      case "dashboard":    return <DashboardTab setSection={switchTab} onQuickAction={handleQuickAction} />;
      case "institutions": return <InstitutionsTab setSection={switchTab} onManageCampuses={goToCampusesForInstitution} />;
      case "campuses":     return <CampusesTab initialModal={openModal === "campuses"} initialInstitutionFilter={campusInstitutionFilter} />;
      case "departments":  return <DepartmentsTab initialModal={openModal === "departments"} />;
      case "grades":       return <GradesTab initialModal={openModal === "grades"} />;
      case "academicYears": return <AcademicYearsTab initialModal={openModal === "academicYears"} />;
      case "delegations":  return <DelegationsTab initialModal={openModal === "delegations"} />;
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
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-white border-b border-gray-100">
        <ModuleHeader
          icon={Landmark}
          title="Institution Setup"
          subtitle="Institutions, campuses, departments, academic structure and governance authority"
        />
        <div className="px-6">
          <TabBar tabs={TABS} activeId={active} onChange={(id) => switchTab(id as TabSection)} />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6">{renderTab()}</div>
    </div>
  );
}
