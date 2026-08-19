import { NavLink, Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  Building2, Shield, FileText,
  Users, GraduationCap, CreditCard, ShoppingCart,
  Building, UserPlus, BookOpen, ClipboardList,
  Calendar, BookMarked, User, BarChart3, Heart,
  ChevronRight, BarChart2, Globe, Settings, Wand2, LayoutGrid, LayoutTemplate,
  Contact, MessageSquare, UserCog, ScrollText, Bell, KeyRound, Sprout, X,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Permission } from '@/types/roles'
import { UserRole } from '@/types/roles'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  permission?: Permission
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    label: 'Foundation',
    items: [
      { label: 'Institution Setup',       href: '/institution',  icon: Building2,      permission: 'institution:view' },
      { label: 'Governance & Compliance', href: '/governance',   icon: Shield,         permission: 'governance:view' },
      { label: 'Documents & Workflow',    href: '/documents',    icon: FileText,       permission: 'documents:view' },
      { label: 'Roles & Permissions',     href: '/roles',        icon: KeyRound,       permission: 'institution:manage' },
    ],
  },
  {
    label: 'People',
    items: [
      { label: 'Staff & HR',          href: '/hr',       icon: Users,         permission: 'hr:view' },
      { label: 'Teaching Management', href: '/teaching', icon: GraduationCap, permission: 'teaching:view' },
    ],
  },
  {
    label: 'Finance & Admin',
    items: [
      { label: 'Finance',           href: '/finance',     icon: CreditCard,   permission: 'finance:view' },
      { label: 'Procurement',       href: '/procurement', icon: ShoppingCart, permission: 'procurement:view' },
      { label: 'Campus Operations', href: '/campus',      icon: Building,     permission: 'campus:view' },
    ],
  },
  {
    label: 'Admissions',
    items: [
      { label: 'Admissions', href: '/admissions', icon: UserPlus, permission: 'admissions:view' },
    ],
  },
  {
    label: 'Academics',
    items: [
      { label: 'Curriculum Intelligence', href: '/curriculum', icon: BookOpen,      permission: 'academics:view' },
      { label: 'Syllabus Tracking',        href: '/syllabus',   icon: ClipboardList, permission: 'academics:view' },
      { label: 'Timetable Intelligence',   href: '/timetable',  icon: Calendar,      permission: 'academics:view' },
      { label: 'Library',                  href: '/library',    icon: BookMarked,    permission: 'academics:view' },
    ],
  },
  {
    label: 'Students',
    items: [
      { label: 'Student 360',          href: '/students',    icon: User,     permission: 'students:view' },
      { label: 'Assessment & Results', href: '/assessments', icon: BarChart3, permission: 'assessments:view' },
      { label: 'Behaviour & Tarbiyah', href: '/behaviour',   icon: Heart,    permission: 'behaviour:view' },
      { label: 'Early Years',          href: '/early-years', icon: Sprout,   permission: 'early-years:view' },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { label: 'Analytics & Intelligence', href: '/analytics', icon: BarChart2, permission: 'analytics:view' },
      { label: 'Apps & Modules',           href: '/apps',      icon: LayoutGrid, permission: 'apps:view' },
      { label: 'Report Templates',         href: '/report-templates', icon: LayoutTemplate, permission: 'report-templates:view' },
    ],
  },
]

// Super Admin gets its own dedicated nav — a company control panel, not a school ERP.
// Each item deep-links into the tabbed /super-admin dashboard via ?tab=, except
// Apps & Modules which reuses the existing module marketplace page directly.
const superAdminNav = [
  { label: 'Command Center',        tab: 'bi',            icon: Globe },
  { label: 'CRM',                   tab: 'crm',           icon: Contact },
  { label: 'Institutions',          tab: 'institutions',  icon: Building2 },
  { label: 'Billing & Subscriptions', tab: 'subscriptions', icon: CreditCard },
  { label: 'Support',               tab: 'tickets',       icon: MessageSquare },
  { label: 'Team & Access',         tab: 'team',          icon: UserCog },
  { label: 'Apps & Modules',        href: '/apps',        icon: LayoutGrid },
  { label: 'Analytics & Reports',   tab: 'analytics',     icon: BarChart2 },
  { label: 'Alerts',                tab: 'alerts',        icon: Bell },
  { label: 'Audit & Settings',      tab: 'audit',         icon: ScrollText },
]

function SuperAdminNav() {
  const location = useLocation()
  const currentTab = new URLSearchParams(location.search).get('tab') || 'bi'

  return (
    <nav className="flex-1 overflow-y-auto py-4 px-3">
      <p className="text-navy-400 text-xs font-semibold uppercase tracking-wider px-3 mb-1.5">
        Platform Control
      </p>
      <ul className="space-y-0.5">
        {superAdminNav.map((item) => {
          const Icon = item.icon
          const isActive = item.href
            ? location.pathname === item.href
            : location.pathname === '/super-admin' && currentTab === item.tab
          const to = item.href ?? `/super-admin?tab=${item.tab}`
          return (
            <li key={item.label}>
              <Link
                to={to}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                  isActive
                    ? 'bg-gold-500 text-navy-950 shadow-sm'
                    : 'text-navy-200 hover:bg-white/10 hover:text-white'
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1 truncate">{item.label}</span>
                {isActive && <ChevronRight className="w-3 h-3 opacity-60 shrink-0" />}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export default function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const location = useLocation()
  const { canAccess, user } = useAuth()

  const isSuperAdmin = user?.role === UserRole.SuperAdmin

  const visibleGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.permission || canAccess(item.permission)),
    }))
    .filter((group) => group.items.length > 0)

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'A'

  return (
    <>
      {/* Backdrop - only rendered below lg, where the sidebar is an
          overlay rather than a permanently-visible column. Clicking it
          closes the drawer, same as any standard mobile/tablet nav. */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={onClose} />
      )}
      <aside className={cn(
        'fixed left-0 top-0 h-full w-64 bg-navy-900 flex flex-col z-30 transition-transform duration-200',
        'lg:translate-x-0', // always visible at lg and above, regardless of isOpen
        isOpen ? 'translate-x-0' : '-translate-x-full',
      )}>
        {/* Logo */}
        <div className="flex items-center justify-between px-3 py-4 border-b border-navy-800">
          <div className="flex flex-col items-start">
            <img src="/eldermin-logo.png" alt="Eldermin" style={{ width: 140, objectFit: 'contain' }} />
            <p className="text-navy-300 text-xs mt-1 px-1">
              {isSuperAdmin ? 'Company Control Panel' : 'Elevate. Administer. Excel.'}
            </p>
          </div>
          {/* Close button - only relevant below lg, where this is an overlay */}
          <button onClick={onClose} className="lg:hidden p-1.5 text-navy-300 hover:text-white hover:bg-white/10 rounded-lg shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

      {/* Navigation — completely separate for Super Admin, not appended to school modules */}
      {isSuperAdmin ? (
        <SuperAdminNav />
      ) : (
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {(visibleGroups || []).map((group) => (
            <div key={group.label} className="mb-4">
              <p className="text-navy-400 text-xs font-semibold uppercase tracking-wider px-3 mb-1.5">
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {(group.items || []).map((item) => {
                  const Icon = item.icon
                  const isActive =
                    location.pathname === item.href ||
                    (item.href !== '/dashboard' && location.pathname.startsWith(item.href))
                  return (
                    <li key={item.href}>
                      <NavLink
                        to={item.href}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                          isActive
                            ? 'bg-gold-500 text-navy-950 shadow-sm'
                            : 'text-navy-200 hover:bg-white/10 hover:text-white'
                        )}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="flex-1 truncate">{item.label}</span>
                        {isActive && <ChevronRight className="w-3 h-3 opacity-60 shrink-0" />}
                      </NavLink>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>
      )}

      {/* Footer */}
      <div className="px-3 py-4 border-t border-navy-800">
        {!isSuperAdmin && (
          <NavLink to="/setup-wizard" className="flex items-center gap-2 px-3 py-2 mb-2 rounded-lg text-amber-400 hover:bg-white/10 text-sm font-semibold border border-amber-400/30 hover:border-amber-400/60 transition-all">
            <Wand2 className="w-4 h-4" />
            Setup Wizard
          </NavLink>
        )}
        <Link to="/profile" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 cursor-pointer transition-colors">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
          ) : (
            <div className="w-8 h-8 bg-gold-500 rounded-full flex items-center justify-center text-navy-950 text-sm font-bold shrink-0">
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.name ?? 'Admin User'}</p>
            <p className="text-navy-400 text-xs truncate">{user?.email ?? 'admin@eduos.com'}</p>
          </div>
          <Settings className="w-4 h-4 text-navy-400 shrink-0" />
        </Link>
      </div>
    </aside>
    </>
  )
}
