import {
  GraduationCap, Users, CreditCard, TrendingUp,
  ArrowUp, ArrowDown, MoreHorizontal, CheckCircle2, Clock, XCircle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const stats = [
  {
    title: 'Total Students',
    value: '2,847',
    change: '+12%',
    trend: 'up',
    icon: GraduationCap,
    color: 'bg-blue-50 text-blue-600',
    borderColor: 'border-l-blue-500',
  },
  {
    title: 'Total Teachers',
    value: '184',
    change: '+3%',
    trend: 'up',
    icon: Users,
    color: 'bg-emerald-50 text-emerald-600',
    borderColor: 'border-l-emerald-500',
  },
  {
    title: 'Fee Collection',
    value: '₦4.2M',
    change: '+8%',
    trend: 'up',
    icon: CreditCard,
    color: 'bg-gold-50 text-gold-600',
    borderColor: 'border-l-gold-500',
  },
  {
    title: 'Attendance Rate',
    value: '94.2%',
    change: '-1.3%',
    trend: 'down',
    icon: TrendingUp,
    color: 'bg-purple-50 text-purple-600',
    borderColor: 'border-l-purple-500',
  },
]

const recentStudents = [
  { id: 'STU-001', name: 'Adaeze Okonkwo', class: 'SS2A', status: 'active', date: 'May 15, 2026' },
  { id: 'STU-002', name: 'Emeka Nwosu', class: 'JS3B', status: 'active', date: 'May 14, 2026' },
  { id: 'STU-003', name: 'Fatima Bello', class: 'SS1C', status: 'pending', date: 'May 14, 2026' },
  { id: 'STU-004', name: 'Chukwuemeka Eze', class: 'JS1A', status: 'active', date: 'May 13, 2026' },
  { id: 'STU-005', name: 'Ngozi Adeleke', class: 'SS3B', status: 'inactive', date: 'May 12, 2026' },
]

const upcomingEvents = [
  { title: 'Mid-term Examinations', date: 'May 20–24', type: 'exam', color: 'bg-blue-100 text-blue-700' },
  { title: 'PTA Meeting', date: 'May 25', type: 'meeting', color: 'bg-gold-100 text-gold-700' },
  { title: 'Inter-House Sports Day', date: 'June 1', type: 'event', color: 'bg-emerald-100 text-emerald-700' },
  { title: 'End of Term Fee Deadline', date: 'June 5', type: 'deadline', color: 'bg-red-100 text-red-700' },
  { title: 'Staff Development Day', date: 'June 8', type: 'meeting', color: 'bg-purple-100 text-purple-700' },
]

const statusIcon = {
  active: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />,
  pending: <Clock className="w-3.5 h-3.5 text-gold-500" />,
  inactive: <XCircle className="w-3.5 h-3.5 text-red-400" />,
}

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Welcome back — here's what's happening today</p>
        </div>
        <div className="text-sm text-gray-500">
          {new Date().toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className={cn('border-l-4', stat.borderColor)}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                    <div className="flex items-center gap-1 mt-1.5">
                      {stat.trend === 'up'
                        ? <ArrowUp className="w-3 h-3 text-emerald-500" />
                        : <ArrowDown className="w-3 h-3 text-red-400" />}
                      <span className={cn('text-xs font-medium', stat.trend === 'up' ? 'text-emerald-600' : 'text-red-500')}>
                        {stat.change} this month
                      </span>
                    </div>
                  </div>
                  <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center', stat.color)}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Two-panel grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Recent students - wider */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Recent Admissions</CardTitle>
              <button className="text-xs text-emerald-600 font-medium hover:underline">View all</button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-1">
              {recentStudents.map((s) => (
                <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-navy-900 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                    {s.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{s.name}</p>
                    <p className="text-xs text-gray-500">{s.id} · {s.class}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {statusIcon[s.status as keyof typeof statusIcon]}
                    <span className="text-xs text-gray-500 capitalize hidden sm:block">{s.status}</span>
                  </div>
                  <span className="text-xs text-gray-400 hidden md:block shrink-0">{s.date}</span>
                  <button className="text-gray-300 hover:text-gray-500 ml-1">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming events - narrower */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Upcoming Events</CardTitle>
              <button className="text-xs text-emerald-600 font-medium hover:underline">Calendar</button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {upcomingEvents.map((ev) => (
                <div key={ev.title} className="flex items-start gap-3">
                  <span className={cn('text-xs font-semibold px-2 py-1 rounded-md shrink-0 mt-0.5', ev.color)}>
                    {ev.type.toUpperCase()}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{ev.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{ev.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
