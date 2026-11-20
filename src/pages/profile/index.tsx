import { useState, type ChangeEvent, type FormEvent } from 'react'
import { User, Mail, Shield, Building2, KeyRound } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import authService from '../../services/auth.service'
import toast from 'react-hot-toast'

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

// Roles with nobody above them inside their own institution - Owner/
// Principal (and the one-off Super Admin accounts i9experts itself
// provisions) have no "institution's Super Admin" to ask, so pointing
// them there was a dead end. Everyone else still has an Owner/Principal/
// Super Admin at their own school to ask.
const TOP_OF_INSTITUTION_ROLES = ['super_admin', 'institution_owner', 'principal']

export default function ProfilePage() {
  const { user, institution, updateAvatar } = useAuth()
  const [uploading, setUploading] = useState(false)
  const initials = (user?.name || 'A').split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
  const roleLabel = ROLE_LABELS[user?.role ?? ''] || user?.role || '—'
  const isTopOfInstitution = TOP_OF_INSTITUTION_ROLES.includes(user?.role ?? '')

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault()
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirmation do not match')
      return
    }
    setChangingPassword(true)
    try {
      await authService.changePassword(currentPassword, newPassword)
      toast.success('Password updated')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update password')
    } finally {
      setChangingPassword(false)
    }
  }

  const handlePhotoChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Photo must be under 2MB')
      e.target.value = ''
      return
    }
    setUploading(true)
    try {
      const result = await authService.uploadAvatar(file)
      updateAvatar(result.avatarUrl)
      toast.success('Profile photo updated')
    } catch {
      toast.error('Upload failed — please try again')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold text-gray-900 mb-1">My Profile</h1>
      <p className="text-sm text-gray-500 mb-6">Your account information</p>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-4 pb-6 border-b border-gray-100">
          <label className="relative group cursor-pointer">
            <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={handlePhotoChange} disabled={uploading} />
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="Profile" className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <div className="w-16 h-16 bg-[#0C447C] rounded-full flex items-center justify-center text-white text-xl font-bold shrink-0">
                {initials}
              </div>
            )}
            <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-[9px] font-medium text-center leading-tight px-1">
                {uploading ? 'Uploading…' : 'Change'}
              </span>
            </div>
          </label>
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

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mt-5">
        <div className="flex items-center gap-2 mb-4">
          <KeyRound size={16} className="text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-900">Change Password</h2>
        </div>
        <form onSubmit={handleChangePassword} className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
          <div className="sm:col-span-2">
            <label className="block text-xs text-gray-400 mb-1">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0C447C]/20"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
              minLength={6}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0C447C]/20"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0C447C]/20"
            />
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={changingPassword}
              className="bg-[#0C447C] text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-[#0a3863] transition-colors disabled:opacity-60"
            >
              {changingPassword ? 'Updating…' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>

      <p className="text-xs text-gray-400 mt-4">
        {isTopOfInstitution
          ? "Need to update your name, email or other account details? Contact Eldermin support for now — self-service editing of those is coming soon."
          : "Need to update your name, email or other account details? Contact your institution's Super Admin for now — self-service editing of those is coming soon."}
      </p>
    </div>
  )
}
