import { useState, useMemo } from 'react'
import {
  Building2, Shield, FileText, Users, GraduationCap,
  CreditCard, ShoppingCart, Building, UserPlus, BookOpen,
  ClipboardList, Calendar, BookMarked, User, BarChart3,
  Heart, TrendingUp, Search, Lock, Package,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

type ModuleStatus = 'active' | 'inactive' | 'locked' | 'trial'

interface Module {
  id: string
  name: string
  category: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  status: ModuleStatus
  progress: number
  dependencies: string[]
  iconBg: string
  iconText: string
}

const modules: Module[] = [
  // FOUNDATION
  {
    id: 'institution-setup',
    name: 'Institution Setup',
    category: 'Foundation',
    description: 'Configure school identity, academic calendar, branches, and core institutional settings.',
    icon: Building2,
    status: 'active',
    progress: 100,
    dependencies: [],
    iconBg: 'bg-blue-50',
    iconText: 'text-blue-600',
  },
  {
    id: 'governance',
    name: 'Governance & Compliance',
    category: 'Foundation',
    description: 'Policy management, regulatory compliance tracking, and institutional governance frameworks.',
    icon: Shield,
    status: 'active',
    progress: 85,
    dependencies: ['Institution Setup'],
    iconBg: 'bg-indigo-50',
    iconText: 'text-indigo-600',
  },
  {
    id: 'documents',
    name: 'Documents & Workflow',
    category: 'Foundation',
    description: 'Document generation, e-signatures, multi-step approvals, and workflow automation.',
    icon: FileText,
    status: 'inactive',
    progress: 0,
    dependencies: ['Institution Setup'],
    iconBg: 'bg-slate-50',
    iconText: 'text-slate-500',
  },
  // PEOPLE
  {
    id: 'staff-hr',
    name: 'Staff & HR',
    category: 'People',
    description: 'Employee records, payroll, leave management, performance reviews, and staff onboarding.',
    icon: Users,
    status: 'active',
    progress: 92,
    dependencies: ['Institution Setup'],
    iconBg: 'bg-violet-50',
    iconText: 'text-violet-600',
  },
  {
    id: 'teaching',
    name: 'Teaching Management',
    category: 'People',
    description: 'Teacher assignment, workload tracking, lesson planning, and professional development.',
    icon: GraduationCap,
    status: 'active',
    progress: 78,
    dependencies: ['Staff & HR', 'Curriculum Intelligence'],
    iconBg: 'bg-purple-50',
    iconText: 'text-purple-600',
  },
  // FINANCE
  {
    id: 'finance',
    name: 'Financial Module',
    category: 'Finance',
    description: 'Fee billing, payment processing, accounts management, budgeting, and financial reporting.',
    icon: CreditCard,
    status: 'active',
    progress: 88,
    dependencies: ['Institution Setup'],
    iconBg: 'bg-emerald-50',
    iconText: 'text-emerald-600',
  },
  {
    id: 'procurement',
    name: 'Procurement & Purchase',
    category: 'Finance',
    description: 'Purchase orders, vendor management, asset tracking, and inventory control systems.',
    icon: ShoppingCart,
    status: 'trial',
    progress: 45,
    dependencies: ['Financial Module'],
    iconBg: 'bg-teal-50',
    iconText: 'text-teal-600',
  },
  {
    id: 'campus',
    name: 'Campus Operations',
    category: 'Finance',
    description: 'Facilities management, school transport, hostel, catering, and campus resource planning.',
    icon: Building,
    status: 'inactive',
    progress: 0,
    dependencies: ['Institution Setup'],
    iconBg: 'bg-cyan-50',
    iconText: 'text-cyan-600',
  },
  // ADMISSIONS
  {
    id: 'admissions',
    name: 'Admission Lifecycle',
    category: 'Admissions',
    description: 'Online applications, entrance screening, enrollment workflows, and new student onboarding.',
    icon: UserPlus,
    status: 'active',
    progress: 95,
    dependencies: ['Institution Setup', 'Financial Module'],
    iconBg: 'bg-orange-50',
    iconText: 'text-orange-600',
  },
  // ACADEMICS
  {
    id: 'curriculum',
    name: 'Curriculum Intelligence',
    category: 'Academics',
    description: 'Curriculum design, subject mapping, learning outcomes, and standards alignment.',
    icon: BookOpen,
    status: 'active',
    progress: 82,
    dependencies: ['Institution Setup'],
    iconBg: 'bg-sky-50',
    iconText: 'text-sky-700',
  },
  {
    id: 'syllabus',
    name: 'Syllabus Tracking',
    category: 'Academics',
    description: 'Real-time syllabus coverage, teacher pacing reports, and completion analytics.',
    icon: ClipboardList,
    status: 'active',
    progress: 70,
    dependencies: ['Curriculum Intelligence', 'Teaching Management'],
    iconBg: 'bg-blue-50',
    iconText: 'text-blue-600',
  },
  {
    id: 'timetable',
    name: 'Timetable Intelligence',
    category: 'Academics',
    description: 'AI-assisted timetable generation, clash detection, and schedule optimisation.',
    icon: Calendar,
    status: 'trial',
    progress: 55,
    dependencies: ['Curriculum Intelligence', 'Staff & HR'],
    iconBg: 'bg-indigo-50',
    iconText: 'text-indigo-600',
  },
  {
    id: 'library',
    name: 'Library Management',
    category: 'Academics',
    description: 'Book cataloguing, borrowing workflows, digital resources, and library analytics.',
    icon: BookMarked,
    status: 'locked',
    progress: 0,
    dependencies: ['Institution Setup'],
    iconBg: 'bg-amber-50',
    iconText: 'text-amber-600',
  },
  // STUDENTS
  {
    id: 'student-360',
    name: 'Student 360',
    category: 'Students',
    description: 'Complete student profile, academic history, attendance records, and holistic progress view.',
    icon: User,
    status: 'active',
    progress: 90,
    dependencies: ['Admission Lifecycle'],
    iconBg: 'bg-green-50',
    iconText: 'text-green-600',
  },
  {
    id: 'assessment',
    name: 'Assessment & Results',
    category: 'Students',
    description: 'Exam management, continuous assessment, result computation, and digital report cards.',
    icon: BarChart3,
    status: 'active',
    progress: 75,
    dependencies: ['Student 360', 'Curriculum Intelligence'],
    iconBg: 'bg-blue-50',
    iconText: 'text-blue-600',
  },
  {
    id: 'behaviour',
    name: 'Behaviour & Tarbiyah',
    category: 'Students',
    description: 'Character development tracking, disciplinary records, mentorship, and pastoral care logs.',
    icon: Heart,
    status: 'trial',
    progress: 30,
    dependencies: ['Student 360'],
    iconBg: 'bg-rose-50',
    iconText: 'text-rose-600',
  },
  // INTELLIGENCE
  {
    id: 'analytics',
    name: 'Analytics & Intelligence',
    category: 'Intelligence',
    description: 'School-wide dashboards, predictive analytics, KPI tracking, and board-level reporting.',
    icon: TrendingUp,
    status: 'locked',
    progress: 0,
    dependencies: ['All core modules'],
    iconBg: 'bg-gold-50',
    iconText: 'text-gold-700',
  },
]

const FILTER_TABS = [
  { key: 'all', label: 'All Modules' },
  { key: 'active', label: 'Active' },
  { key: 'inactive', label: 'Inactive' },
  { key: 'Foundation', label: 'Foundation' },
  { key: 'Finance', label: 'Finance' },
  { key: 'Academics', label: 'Academics' },
  { key: 'Students', label: 'Students' },
  { key: 'Intelligence', label: 'Intelligence' },
] as const

const CATEGORY_ORDER = ['Foundation', 'People', 'Finance', 'Admissions', 'Academics', 'Students', 'Intelligence']

const CATEGORY_LABELS: Record<string, string> = {
  Foundation: 'Foundation',
  People: 'People',
  Finance: 'Finance & Administration',
  Admissions: 'Admissions',
  Academics: 'Academics',
  Students: 'Students',
  Intelligence: 'Intelligence',
}

const STATUS_CONFIG: Record<ModuleStatus, { label: string; className: string }> = {
  active: { label: 'Active', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  inactive: { label: 'Inactive', className: 'bg-gray-100 text-gray-500 border-gray-200' },
  locked: { label: 'Locked', className: 'bg-navy-950 text-navy-200 border-navy-800' },
  trial: { label: 'Trial', className: 'bg-gold-50 text-gold-700 border-gold-200' },
}

const PROGRESS_COLOR: Record<ModuleStatus, string> = {
  active: 'bg-emerald-500',
  inactive: 'bg-gray-200',
  locked: 'bg-gray-200',
  trial: 'bg-gold-400',
}

function getButtonLabel(status: ModuleStatus): string {
  switch (status) {
    case 'active': return 'Configure'
    case 'inactive': return 'Activate Module'
    case 'trial': return 'Continue Trial'
    case 'locked': return 'Request Access'
  }
}

function getButtonVariant(status: ModuleStatus): 'navy' | 'gold' | 'outline' {
  switch (status) {
    case 'active': return 'navy'
    case 'inactive': return 'gold'
    case 'trial': return 'gold'
    case 'locked': return 'outline'
  }
}

function ModuleCard({ module }: { module: Module }) {
  const Icon = module.icon
  const statusConfig = STATUS_CONFIG[module.status]
  const isLocked = module.status === 'locked'

  return (
    <div className={cn(
      'bg-white rounded-xl border border-gray-100 p-5 flex flex-col gap-3.5 shadow-sm hover:shadow-md transition-all duration-200 group',
      isLocked && 'opacity-60'
    )}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center shrink-0 relative', module.iconBg)}>
            {isLocked
              ? <Lock className={cn('w-4 h-4', module.iconText)} />
              : <Icon className={cn('w-5 h-5', module.iconText)} />
            }
          </div>
          <h3 className="font-semibold text-gray-900 text-sm leading-snug">{module.name}</h3>
        </div>
        <span className={cn(
          'shrink-0 text-xs font-medium px-2 py-0.5 rounded-full border whitespace-nowrap',
          statusConfig.className
        )}>
          {statusConfig.label}
        </span>
      </div>

      {/* Description */}
      <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 flex-1">{module.description}</p>

      {/* Dependencies */}
      {module.dependencies.length > 0 && (
        <div className="flex items-start gap-1.5 text-xs">
          <span className="text-gray-400 shrink-0 mt-px">Requires:</span>
          <span className="text-gray-500 leading-relaxed">{module.dependencies.join(' · ')}</span>
        </div>
      )}

      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-400">Setup Progress</span>
          <span className={cn(
            'font-semibold',
            module.progress === 100 ? 'text-emerald-600' : module.status === 'trial' ? 'text-gold-600' : 'text-gray-600'
          )}>
            {module.progress}%
          </span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-500', PROGRESS_COLOR[module.status])}
            style={{ width: `${module.progress}%` }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-0.5">
        <Button
          variant={getButtonVariant(module.status)}
          size="sm"
          disabled={isLocked}
          className="flex-1 h-8 text-xs font-medium"
        >
          {getButtonLabel(module.status)}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs text-gray-500 border-gray-200 hover:border-navy-900 hover:text-navy-900 shrink-0"
        >
          View Details
        </Button>
      </div>
    </div>
  )
}

export default function AppsMarketplace() {
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [search, setSearch] = useState('')

  const activeCount = modules.filter(m => m.status === 'active').length
  const trialCount = modules.filter(m => m.status === 'trial').length
  const lockedCount = modules.filter(m => m.status === 'locked').length

  const filtered = useMemo(() => {
    let result = modules

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(m =>
        m.name.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q)
      )
    }

    if (activeFilter === 'active') result = result.filter(m => m.status === 'active')
    else if (activeFilter === 'inactive') result = result.filter(m => m.status === 'inactive')
    else if (activeFilter !== 'all') result = result.filter(m => m.category === activeFilter)

    return result
  }, [activeFilter, search])

  const grouped = useMemo(() => {
    const map = new Map<string, Module[]>()
    for (const cat of CATEGORY_ORDER) {
      const items = filtered.filter(m => m.category === cat)
      if (items.length > 0) map.set(cat, items)
    }
    return map
  }, [filtered])

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Apps & Modules</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage and configure your Eldermin ERP modules</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 font-medium border border-emerald-100">
            {activeCount} Active
          </span>
          <span className="px-2.5 py-1.5 rounded-lg bg-gold-50 text-gold-700 font-medium border border-gold-100">
            {trialCount} Trial
          </span>
          <span className="px-2.5 py-1.5 rounded-lg bg-gray-50 text-gray-500 font-medium border border-gray-100">
            {lockedCount} Locked
          </span>
        </div>
      </div>

      {/* Search + Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative w-full sm:w-72 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search modules…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 h-9 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-900/20 focus:border-navy-900 transition-colors"
          />
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 flex-wrap">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap',
                activeFilter === tab.key
                  ? 'bg-navy-900 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/70'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Module grid */}
      {grouped.size === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium text-gray-500">No modules match your search</p>
          <p className="text-xs mt-1">Try adjusting the filter or search term</p>
        </div>
      ) : (
        <div className="space-y-10">
          {Array.from(grouped.entries()).map(([category, items]) => (
            <div key={category}>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest shrink-0">
                  {CATEGORY_LABELS[category]}
                </h2>
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-400 shrink-0">
                  {items.length} module{items.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {items.map(m => <ModuleCard key={m.id} module={m} />)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
