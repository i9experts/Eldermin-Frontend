import { useState } from "react";
import {
  LayoutDashboard, GraduationCap, User, BookOpen,
  Calendar, ClipboardList, BarChart3, Repeat,
  Shield, BookMarked, Award, TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { TeachingDashboardTab } from "./tabs/DashboardTab";
import { TeachingTeachersTab } from "./tabs/TeachersTab";
import { TeachingLessonPlansTab } from "./tabs/LessonPlansTab";
import { TeachingBehaviourTab } from "./tabs/BehaviourTab";
import { TeachingAssessmentsTab } from "./tabs/AssessmentsTab";
import { TeachingProfileTab } from "./tabs/ProfileTab";
import { TeachingTimetableTab } from "./tabs/TimetableTab";
import { TeachingFixturesTab } from "./tabs/FixturesTab";
import { TeachingSyllabusTab } from "./tabs/SyllabusTab";
import { TeachingHomeworkTab } from "./tabs/HomeworkTab";
import { TeachingAnalyticsTab } from "./tabs/AnalyticsTab";

// ─── TYPES ────────────────────────────────────────────────────────────────────
type TeachTab =
  | "dashboard" | "teachers" | "profile" | "lesson-plans" | "timetable" | "fixtures"
  | "syllabus" | "assessments" | "behaviour" | "homework"
  | "appraisal" | "analytics";

const TABS: { id: TeachTab; label: string; icon: LucideIcon }[] = [
  { id: "dashboard",    label: "Dashboard",         icon: LayoutDashboard },
  { id: "teachers",     label: "Teachers",          icon: GraduationCap   },
  { id: "profile",      label: "Teacher Profile",   icon: User            },
  { id: "lesson-plans", label: "Lesson Plans",      icon: BookOpen        },
  { id: "timetable",    label: "Timetable",         icon: Calendar        },
  { id: "fixtures",     label: "Fixture Management", icon: Repeat         },
  { id: "syllabus",     label: "Syllabus",          icon: ClipboardList   },
  { id: "assessments",  label: "Assessments",       icon: BarChart3       },
  { id: "behaviour",    label: "Behaviour",         icon: Shield          },
  { id: "homework",     label: "Homework",          icon: BookMarked      },
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
      case "syllabus":     return <TeachingSyllabusTab />;
      case "assessments":  return <TeachingAssessmentsTab />;
      case "behaviour":    return <TeachingBehaviourTab />;
      case "homework":     return <TeachingHomeworkTab />;
      case "appraisal":    return <AppraisalTab />;
      case "analytics":    return <TeachingAnalyticsTab />;
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
