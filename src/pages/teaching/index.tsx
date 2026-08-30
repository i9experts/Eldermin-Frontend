import { useState } from "react";
import {
  LayoutDashboard, GraduationCap, User, BookOpen,
  Calendar, ClipboardList, BarChart3, Repeat, Users2,
  Shield, BookMarked, Award, TrendingUp, CalendarCheck2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ModuleHeader } from "../../components/layout/ModuleHeader";
import { TabBar } from "../../components/layout/TabBar";
import { TeachingDashboardTab } from "./tabs/DashboardTab";
import { TeachingTeachersTab } from "./tabs/TeachersTab";
import { TeachingLessonPlansTab } from "./tabs/LessonPlansTab";
import { TeachingBehaviourTab } from "./tabs/BehaviourTab";
import { TeachingAssessmentsTab } from "./tabs/AssessmentsTab";
import { TeachingProfileTab } from "./tabs/ProfileTab";
import { TeachingTimetableTab } from "./tabs/TimetableTab";
import { TeachingFixturesTab } from "./tabs/FixturesTab";
import { TeachingPTMTab } from "./tabs/PTMTab";
import { TeachingSyllabusTab } from "./tabs/SyllabusTab";
import { TeachingHomeworkTab } from "./tabs/HomeworkTab";
import { TeachingAttendanceTab } from "./tabs/AttendanceTab";
import { TeachingAnalyticsTab } from "./tabs/AnalyticsTab";

// ─── TYPES ────────────────────────────────────────────────────────────────────
type TeachTab =
  | "dashboard" | "teachers" | "profile" | "lesson-plans" | "timetable" | "fixtures" | "ptm"
  | "syllabus" | "assessments" | "behaviour" | "homework" | "attendance"
  | "appraisal" | "analytics";

const TABS: { id: TeachTab; label: string; icon: LucideIcon }[] = [
  { id: "dashboard",    label: "Dashboard",         icon: LayoutDashboard },
  { id: "teachers",     label: "Teachers",          icon: GraduationCap   },
  { id: "profile",      label: "Teacher Profile",   icon: User            },
  { id: "lesson-plans", label: "Lesson Plans",      icon: BookOpen        },
  { id: "timetable",    label: "Timetable",         icon: Calendar        },
  { id: "fixtures",     label: "Fixture Management", icon: Repeat         },
  { id: "ptm",          label: "Parent Meetings",   icon: Users2          },
  { id: "syllabus",     label: "Syllabus",          icon: ClipboardList   },
  { id: "assessments",  label: "Assessments",       icon: BarChart3       },
  { id: "behaviour",    label: "Behaviour",         icon: Shield          },
  { id: "homework",     label: "Homework",          icon: BookMarked      },
  { id: "attendance",   label: "Attendance",        icon: CalendarCheck2  },
  { id: "appraisal",    label: "Appraisal & CPD",   icon: Award           },
  { id: "analytics",    label: "Analytics",         icon: TrendingUp      },
];

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white rounded-xl border border-slate-100 shadow-sm ${className}`}>{children}</div>;
}

// ─── APPRAISAL TAB ────────────────────────────────────────────────────────────
function AppraisalTab() {
  const navigate = useNavigate();
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-slate-900">Appraisal & CPD</h1>
      </div>
      <Card className="p-8 text-center">
        <div className="text-4xl mb-4">⭐</div>
        <div className="font-semibold text-slate-800 text-lg mb-2">
          Teacher appraisals are managed in HR → Performance tab
        </div>
        <div className="text-sm text-slate-500 mb-6">
          All appraisal cycles, CPD tracking, and observation scheduling are centralised in the HR module.
        </div>
        <button
          onClick={() => navigate("/hr")}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0C447C] text-white text-sm font-medium rounded-lg hover:bg-[#0b3d6e] transition-colors"
        >
          Go to Performance
        </button>
      </Card>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function TeachingPage() {
  const [active, setActive] = useState<TeachTab>("dashboard");

  const renderTab = () => {
    switch (active) {
      case "dashboard":    return <TeachingDashboardTab />;
      case "teachers":     return <TeachingTeachersTab />;
      case "profile":      return <TeachingProfileTab />;
      case "lesson-plans": return <TeachingLessonPlansTab />;
      case "timetable":    return <TeachingTimetableTab />;
      case "fixtures":     return <TeachingFixturesTab />;
      case "ptm":          return <TeachingPTMTab />;
      case "syllabus":     return <TeachingSyllabusTab />;
      case "assessments":  return <TeachingAssessmentsTab />;
      case "behaviour":    return <TeachingBehaviourTab />;
      case "homework":     return <TeachingHomeworkTab />;
      case "attendance":   return <TeachingAttendanceTab />;
      case "appraisal":    return <AppraisalTab />;
      case "analytics":    return <TeachingAnalyticsTab />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-white border-b border-gray-100">
        <ModuleHeader
          icon={GraduationCap}
          title="Teaching Management"
          subtitle="Teachers, lesson plans, timetables, syllabus tracking and classroom delivery"
        />
        <div className="px-6">
          <TabBar tabs={TABS} activeId={active} onChange={(id) => setActive(id as TeachTab)} />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6">{renderTab()}</div>
    </div>
  );
}
