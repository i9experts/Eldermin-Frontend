import { useState } from 'react'
import { Bell, Search, ChevronDown, LogOut, User, Settings } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

const notifications = [
  { id: 1, text: '3 new student registrations', time: '2m ago', unread: true },
  { id: 2, text: 'Fee payment received – John Doe', time: '15m ago', unread: true },
  { id: 3, text: 'Exam results published – Grade 10A', time: '1h ago', unread: false },
]

export default function TopBar() {
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const unreadCount = notifications.filter((n) => n.unread).length

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="fixed top-0 left-64 right-0 h-16 bg-white border-b border-gray-200 flex items-center px-6 z-40 gap-4">
      {/* Search */}
      <div className="relative flex-1 max-w-lg">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search students, teachers, classes..."
          className="pl-10 bg-gray-50 border-gray-200 focus:bg-white h-9 text-sm"
        />
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false) }}
            className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Bell className="w-5 h-5 text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-11 w-80 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
              <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-sm text-gray-900">Notifications</h3>
                <Badge variant="secondary" className="text-xs">{unreadCount} new</Badge>
              </div>
              {notifications.map((n) => (
                <div key={n.id} className={`px-4 py-3 hover:bg-gray-50 cursor-pointer flex gap-3 ${n.unread ? 'bg-gold-50/60' : ''}`}>
                  {n.unread && <div className="w-2 h-2 bg-gold-500 rounded-full mt-1.5 shrink-0" />}
                  {!n.unread && <div className="w-2 h-2 shrink-0" />}
                  <div>
                    <p className="text-sm text-gray-800">{n.text}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{n.time}</p>
                  </div>
                </div>
              ))}
              <div className="px-4 py-2 border-t border-gray-100">
                <button className="text-xs text-gold-600 font-medium hover:underline">View all notifications</button>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-200" />

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => { setShowProfile(!showProfile); setShowNotifications(false) }}
            className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.avatarUrl} />
              <AvatarFallback className="bg-navy-900 text-white text-xs font-semibold">
                {user?.name?.charAt(0) ?? 'A'}
              </AvatarFallback>
            </Avatar>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium text-gray-900 leading-tight">{user?.name ?? 'Admin'}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role ?? 'admin'}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>

          {showProfile && (
            <div className="absolute right-0 top-11 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
              <button
                onClick={() => { setShowProfile(false); navigate('/profile') }}
                className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 text-sm text-gray-700"
              >
                <User className="w-4 h-4" /> My Profile
              </button>
              <button
                onClick={() => { setShowProfile(false); navigate('/profile') }}
                className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 text-sm text-gray-700"
              >
                <Settings className="w-4 h-4" /> Settings
              </button>
              <div className="border-t border-gray-100 mt-1 pt-1">
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-red-50 text-sm text-red-600"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
