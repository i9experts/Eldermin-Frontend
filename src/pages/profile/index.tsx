import { User, Mail, Shield, Building2 } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  institution_owner: 'Owner / Principal',
  principal: 'Principal',
  vice_principal: 'Vice Principal',
  admin: 'Admin',
  academic_coordinator: 'Academic Coordinator',
  finance_manager: 'Finance Manager',
  hr_manager: 'HR Manager',
  teacher: 'Teacher',
  librarian: 'Librarian',
  parent: 'Parent',
  student: 'Student',
  support_staff: 'Support Staff',
}

export default function ProfilePage() {
  const { user, institution } = useAuth()
  const initials = (user?.name || 'A').split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
  const roleLabel = ROLE_LABELS[user?.role ?? ''] || user?.role || '—'

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold text-gray-900 mb-1">My Profile</h1>
      <p className="text-sm text-gray-500 mb-6">Your account information</p>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-4 pb-6 border-b border-gray-100">
          <div className="w-16 h-16 bg-[#0C447C] rounded-full flex items-center justify-center text-white text-xl font-bold shrink-0">
            {initials}
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900">{user?.name || 'Admin User'}</p>
            <p className="text-sm text-gray-500">{roleLabel}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-6">
          <div className="flex items-start gap-3">
            <User size={16} className="text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs text-gray-400">Full Name</p>
              <p className="text-sm font-medium text-gray-800">{user?.name || '—'}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Mail size={16} className="text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs text-gray-400">Email</p>
              <p className="text-sm font-medium text-gray-800">{user?.email || '—'}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Shield size={16} className="text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs text-gray-400">Role</p>
              <p className="text-sm font-medium text-gray-800">{roleLabel}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Building2 size={16} className="text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs text-gray-400">Institution</p>
              <p className="text-sm font-medium text-gray-800">{institution?.name || '—'}</p>
            </div>
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-4">
        Need to change your password or update these details? Contact your institution's Super Admin for now — self-service account editing is coming soon.
      </p>
    </div>
  )
}
