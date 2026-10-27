import { useState } from "react";
import {
  LayoutDashboard, GraduationCap, User, BookOpen,
  Calendar, ClipboardList, BarChart3, Repeat, Users2,
  Shield, BookMarked, Award, TrendingUp, CalendarCheck2, NotebookPen, Settings,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
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
import { TeachingClassDiaryTab } from "./tabs/ClassDiaryTab";
import { TeachingAttendanceTab } from "./tabs/AttendanceTab";
import { TeachingAttendanceSettingsTab } from "./tabs/AttendanceSettingsTab";
import { TeachingAnalyticsTab } from "./tabs/AnalyticsTab";

// ─── TYPES ────────────────────────────────────────────────────────────────────
type TeachTab =
  | "dashboard" | "teachers" | "profile" | "lesson-plans" | "timetable" | "fixtures" | "ptm"
  | "syllabus" | "assessments" | "behaviour" | "homework" | "class-diary" | "attendance"
  | "attendance-settings" | "appraisal" | "analytics";

// Roles allowed to change the school-wide attendance mode - mirrors
// TEACHING_ADMIN_ROLES on the backend (which also enforces this; this is
// just so a plain teacher doesn't see a settings tab that would 403 them
// the moment they tried to save).
const ATTENDANCE_SETTINGS_ROLES = ['super_admin', 'institution_owner', 'principal', 'vice_principal', 'admin', 'academic_coordinator'];

const BASE_TABS: { id: TeachTab; label: string; icon: LucideIcon }[] = [
  { id: "dashboard",    label: "Dashboard",         icon: LayoutDashboard },
  { id: "teachers",     label: "Teachers",          icon: GraduationCap   },
  { id: "profile",      label: "Teacher Profile",   icon: User            },
  { id: "lesson-plans", label: "Lesson Plans",      icon: BookOpen        },
  { id: "timetable",    label: "Timetable",         icon: Calendar        },
  { id: "fixtures",     label: "Fixture Management", icon: Repeat         },
  { id: "ptm",          label: "Parent Meetings",   icon: Users2          },
  { id: "syllabus",     label: "Syllabus",          icon: ClipboardList   },
  { id: "assessments",  label: "Assessments",       icon: BarChart3       },
  { id: "behaviour",    label: "Complaints",        icon: Shield          },
  { id: "homework",     label: "Homework",          icon: BookMarked      },
  { id: "class-diary",  label: "Class Diary",       icon: NotebookPen     },
  { id: "attendance",   label: "Attendance",        icon: CalendarCheck2  },
  { id: "appraisal",    label: "Appraisal & CPD",   icon: Award           },
  { id: "analytics",    label: "Analytics",         icon: TrendingUp      },
];
const ATTENDANCE_SETTINGS_TAB: { id: TeachTab; label: string; icon: LucideIcon } =
  { id: "attendance-settings", label: "Attendance Settings", icon: Settings };

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
const VALID_TABS = new Set<TeachTab>([
  "dashboard", "teachers", "profile", "lesson-plans", "timetable", "fixtures", "ptm",
  "syllabus", "assessments", "behaviour", "homework", "class-diary", "attendance",
  "attendance-settings", "appraisal", "analytics",
]);

export default function TeachingPage() {
  const [searchParams] = useSearchParams();
  const { user, canAccess } = useAuth();
  const canManageAttendanceSettings = ATTENDANCE_SETTINGS_ROLES.includes(user?.role ?? '');
  const allTabs = canManageAttendanceSettings
    ? [...BASE_TABS.slice(0, BASE_TABS.findIndex(t => t.id === 'attendance') + 1), ATTENDANCE_SETTINGS_TAB, ...BASE_TABS.slice(BASE_TABS.findIndex(t => t.id === 'attendance') + 1)]
    : BASE_TABS;
  // A role editor lets an admin grant/restrict access to each Teaching
  // sub-tab independently (Institution Setup → Roles & Permissions →
  // Teaching Management). This is a no-op for anyone on a standard role
  // (canAccess falls back to the coarse module-level check for them,
  // unchanged from before), but for a user holding a CUSTOM role it hides
  // exactly the tabs their role sets to "None" - previously nothing here
  // ever consulted that per-tab grant, so every teacher saw every tab
  // regardless of what Edit Role said.
  const tabs = allTabs.filter(t => canAccess("teaching:view", t.id));

  // Lets other modules (e.g. Students → Attendance Report's "Go Mark
  // Attendance") deep-link straight to a specific tab, e.g.
  // /teaching?tab=attendance, instead of landing on the Dashboard and
  // making the teacher find Attendance themselves.
  const requestedTab = searchParams.get("tab") as TeachTab | null;
  const [active, setActive] = useState<TeachTab>(() => {
    if (requestedTab && VALID_TABS.has(requestedTab) && tabs.some(t => t.id === requestedTab)) return requestedTab;
    return tabs[0]?.id ?? "dashboard";
  });

  const renderTab = () => {
    // Defense in depth beyond just hiding the tab button above - covers a
    // stale/deep-linked tab id (e.g. ?tab=lesson-plans) targeting a
    // sub-tab this role isn't actually granted.
    if (!canAccess("teaching:view", active)) {
      return (
        <div className="text-center py-16 text-slate-400">
          <p className="text-sm font-medium">You don't have access to this section.</p>
          <p className="text-xs mt-1">Ask an administrator to grant it under Roles &amp; Permissions.</p>
        </div>
      );
    }
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
      case "class-diary":  return <TeachingClassDiaryTab />;
      case "attendance":   return <TeachingAttendanceTab />;
      case "attendance-settings": return canManageAttendanceSettings ? <TeachingAttendanceSettingsTab /> : null;
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
          <TabBar tabs={tabs} activeId={active} onChange={(id) => setActive(id as TeachTab)} />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6">{renderTab()}</div>
    </div>
  );
}
