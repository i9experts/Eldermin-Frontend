import { useState, useRef, useEffect, useCallback } from "react";
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
  ChevronLeft,
  ChevronRight,
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
  const tabScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollButtons = useCallback(() => {
    const el = tabScrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateScrollButtons();
    const el = tabScrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateScrollButtons);
    window.addEventListener("resize", updateScrollButtons);
    return () => {
      el.removeEventListener("scroll", updateScrollButtons);
      window.removeEventListener("resize", updateScrollButtons);
    };
  }, [updateScrollButtons]);

  function scrollTabs(direction: 1 | -1) {
    tabScrollRef.current?.scrollBy({ left: direction * 220, behavior: "smooth" });
  }

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
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 -mx-6 px-6 mb-6 relative">
        {canScrollLeft && (
          <button
            onClick={() => scrollTabs(-1)}
            className="absolute left-0 top-0 bottom-0 z-20 flex items-center pl-1 pr-3 bg-gradient-to-r from-white via-white to-transparent"
            aria-label="Scroll tabs left"
          >
            <ChevronLeft size={16} className="text-slate-400" />
          </button>
        )}
        <div ref={tabScrollRef} className="flex gap-0.5 overflow-x-auto scrollbar-hide">
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
        {canScrollRight && (
          <button
            onClick={() => scrollTabs(1)}
            className="absolute right-0 top-0 bottom-0 z-20 flex items-center pr-1 pl-3 bg-gradient-to-l from-white via-white to-transparent"
            aria-label="Scroll tabs right"
          >
            <ChevronRight size={16} className="text-slate-400" />
          </button>
        )}
      </div>
      {renderTab()}
    </div>
  );
}
