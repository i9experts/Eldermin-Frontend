import { Permission } from '@/types/roles'
import { getVisibleNavGroups } from '@/components/layout/Sidebar'
import type { TourStep } from './TourOverlay'

// One line per sidebar group, in plain language for a first-time admin.
// Falls back to listing the group's visible item labels for any group not
// named here, so a new group added to Sidebar.tsx never silently gets a
// blank tour step.
const GROUP_DESCRIPTIONS: Record<string, string> = {
  'Foundation': 'Set up your institution profile, campuses, academic years, departments, classes, and governance policies.',
  'People': 'Manage staff records, hiring, teaching assignments, and staff self-service for leave and attendance.',
  'Finance & Admin': 'Collect fees, manage purchasing, campus operations, the school calendar, and events.',
  'Admissions': 'Run your admissions pipeline from enquiry through to enrollment.',
  'Academics': 'Plan curriculum, track syllabus coverage, build timetables, and manage the library.',
  'Students': "Student profiles, learning content, assessments & report cards, Behaviour & Tarbiyah, and Early Years.",
  'Intelligence': 'School-wide analytics, the module marketplace, and your report, ID card, and certificate templates.',
}

/** Builds the global orientation tour from exactly the sidebar groups this
 * user's role can actually see - reuses Sidebar's own filtering (getVisibleNavGroups)
 * instead of a second, separately-maintained list that could drift out of sync. */
export function buildGlobalTourSteps(
  canAccess: (permission: Permission, subModuleKey?: string) => boolean,
  hasModule: (moduleName: string) => boolean,
): TourStep[] {
  const groups = getVisibleNavGroups(canAccess, hasModule)
  const steps: TourStep[] = [
    { target: 'search', title: 'Search anything', content: 'Quickly find a student, staff member, class, or document from anywhere in Eldermin.' },
    { target: 'academic-year', title: 'Academic Year', content: "Everything you see is filtered by this. If something looks missing, check it's set to the year you expect." },
    { target: 'notifications', title: 'Notifications', content: 'Stay on top of fee payments, admissions, and other activity across your school.' },
    { target: 'profile-menu', title: 'Your profile', content: 'Update your details here, and come back to this tour anytime with "Show Me Around".' },
  ]
  for (const group of groups) {
    steps.push({
      target: `nav-group-${group.label}`,
      title: group.label,
      content: GROUP_DESCRIPTIONS[group.label] ?? `Access ${group.items.map((i) => i.label).join(', ')} here.`,
    })
  }
  return steps
}
