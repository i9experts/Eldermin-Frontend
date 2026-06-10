import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Building2, Shield, FileText,
  Users, GraduationCap, CreditCard, ShoppingCart,
  Building, UserPlus, BookOpen, ClipboardList,
  Calendar, BookMarked, User, BarChart3, Heart,
  TrendingUp, LayoutGrid, Settings, HelpCircle,
  ChevronRight, BarChart2, Globe,
} from 'lucide-react'
import authService from '@/services/auth.service'

const navGroups = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Foundation',
    items: [
      { label: 'Institution Setup', href: '/institution', icon: Building2 },
      { label: 'Gov & Compliance', href: '/governance', icon: Shield },
      { label: 'Documents', href: '/documents', icon: FileText },
    ],
  },
  {
    label: 'People',
    items: [
      { label: 'Staff & HR', href: '/hr', icon: Users },
      { label: 'Teaching Management', href: '/teaching', icon: GraduationCap },
    ],
  },
  {
    label: 'Finance',
    items: [
      { label: 'Finance', href: '/finance', icon: CreditCard },
      { label: 'Procurement', href: '/procurement', icon: ShoppingCart },
      { label: 'Campus Operations', href: '/campus', icon: Building },
    ],
  },
  {
    label: 'Admissions',
    items: [
      { label: 'Admission Lifecycle', href: '/admissions', icon: UserPlus },
    ],
  },
  {
    label: 'Academics',
    items: [
      { label: 'Curriculum', href: '/curriculum', icon: BookOpen },
      { label: 'Syllabus', href: '/syllabus', icon: ClipboardList },
      { label: 'Timetable', href: '/timetable', icon: Calendar },
      { label: 'Library', href: '/library', icon: BookMarked },
      { label: 'Assessment Module', href: '/assessments', icon: ClipboardList },
    ],
  },
  {
    label: 'Students',
    items: [
      { label: 'Students', href: '/students', icon: User },
      { label: 'Assessment', href: '/assessment', icon: BarChart3 },
      { label: 'Behaviour & Tarbiyah', href: '/behaviour', icon: Heart },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { label: 'Analytics & Intelligence', href: '/analytics', icon: BarChart2 },
    ],
  },
  {
    label: 'ERP',
    items: [
      { label: 'Apps & Modules', href: '/apps', icon: LayoutGrid },
      { label: 'Settings', href: '/settings', icon: Settings },
      { label: 'Support', href: '/support', icon: HelpCircle },
    ],
  },
]


export default function Sidebar() {
  const location = useLocation()
  const isSuperAdmin = authService.getStoredUser()?.role === 'super_admin'

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-navy-900 flex flex-col z-30">
      {/* Logo */}
      <div className="flex flex-col items-start px-3 py-4 border-b border-navy-800">
        <img src="/eldermin-logo.png" alt="Eldermin" style={{ width: 140, objectFit: "contain" }} />
        <p className="text-navy-300 text-xs mt-1 px-1">Elevate. Administer. Excel.</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {[...navGroups, ...(isSuperAdmin ? [{
          label: 'Super Admin',
          items: [{ label: 'Platform Management', href: '/super-admin', icon: Globe }],
        }] : [])].map((group) => (
          <div key={group.label} className="mb-4">
            <p className="text-navy-400 text-xs font-semibold uppercase tracking-wider px-3 mb-1.5">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.href ||
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

      {/* User footer */}
      <div className="px-3 py-4 border-t border-navy-800">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 cursor-pointer transition-colors">
          <div className="w-8 h-8 bg-gold-500 rounded-full flex items-center justify-center text-navy-950 text-sm font-bold shrink-0">
            A
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">Admin User</p>
            <p className="text-navy-400 text-xs truncate">admin@eduos.com</p>
          </div>
          <Settings className="w-4 h-4 text-navy-400 shrink-0" />
        </div>
      </div>
    </aside>
  )
}
