import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  KeyRound, Plus, Copy, Trash2, Edit2, Users, X, Check, Shield,
} from 'lucide-react'
import rolesService from '../../services/roles.service'

const NAVY = '#0C447C'

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm ${className}`}>{children}</div>
}

function Btn({ children, onClick, variant = 'secondary', disabled = false }: {
  children: React.ReactNode; onClick?: () => void; variant?: 'primary' | 'secondary' | 'danger' | 'ghost'; disabled?: boolean
}) {
  const styles = {
    primary: 'text-white hover:opacity-90',
    secondary: 'border border-gray-200 text-gray-600 hover:bg-gray-50',
    danger: 'text-red-600 hover:bg-red-50',
    ghost: 'text-gray-400 hover:text-gray-600 hover:bg-gray-50',
  }[variant]
  return (
    <button onClick={onClick} disabled={disabled}
      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 ${styles}`}
      style={variant === 'primary' ? { backgroundColor: NAVY } : undefined}>
      {children}
    </button>
  )
}

type ModuleAccess = { moduleKey: string; level: 'view' | 'manage' }
type Role = {
  _id: string; name: string; description?: string; color?: string
  moduleAccess: ModuleAccess[]; isSystemDefault: boolean; assignedCount: number
}

// ─── ROLE FORM MODAL (create + edit) ──────────────────────────────────────────
function RoleFormModal({ role, modules, onClose }: {
  role: Role | null
  modules: { key: string; label: string }[]
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const isEdit = !!role
  const [name, setName] = useState(role?.name ?? '')
  const [description, setDescription] = useState(role?.description ?? '')
  const [color, setColor] = useState(role?.color ?? NAVY)
  const [access, setAccess] = useState<Record<string, 'none' | 'view' | 'manage'>>(() => {
    const initial: Record<string, 'none' | 'view' | 'manage'> = {}
    modules.forEach(m => { initial[m.key] = 'none' })
    role?.moduleAccess.forEach(m => { initial[m.moduleKey] = m.level })
    return initial
  })

  const setLevel = (moduleKey: string, level: 'none' | 'view' | 'manage') =>
    setAccess(prev => ({ ...prev, [moduleKey]: level }))

  const selectedCount = Object.values(access).filter(l => l !== 'none').length

  const saveMutation = useMutation({
    mutationFn: () => {
      const moduleAccess: ModuleAccess[] = Object.entries(access)
        .filter(([, level]) => level !== 'none')
        .map(([moduleKey, level]) => ({ moduleKey, level: level as 'view' | 'manage' }))
      const payload = { name, description: description || undefined, color, moduleAccess }
      return isEdit ? rolesService.updateRole(role!._id, payload) : rolesService.createRole(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      toast.success(isEdit ? 'Role updated' : 'Role created')
      onClose()
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Something went wrong'),
  })

  const submit = () => {
    if (!name.trim()) { toast.error('Give this role a name'); return }
    if (selectedCount === 0) { toast.error('Grant access to at least one module'); return }
    saveMutation.mutate()
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col" style={{ maxHeight: '88vh' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0" style={{ backgroundColor: NAVY, borderRadius: '16px 16px 0 0' }}>
          <div>
            <h2 className="font-bold text-white text-sm">{isEdit ? 'Edit Role' : 'Create Role'}</h2>
            <p className="text-blue-200 text-xs mt-0.5">Choose exactly which modules this role can see, and how much they can do there</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Role Name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Front Office Coordinator"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Color tag</label>
              <div className="flex items-center gap-2">
                <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer" />
                <span className="text-xs text-gray-400">Shown next to this role wherever it's assigned</span>
              </div>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Description <span className="font-normal text-gray-400">(optional)</span></label>
            <input value={description} onChange={e => setDescription(e.target.value)} placeholder="What does someone in this role do day to day?"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-600">Module Access</label>
              <span className="text-[11px] text-gray-400">{selectedCount} of {modules.length} modules granted</span>
            </div>
            <div className="border border-gray-200 rounded-xl divide-y divide-gray-100">
              <div className="grid grid-cols-[1fr,auto,auto,auto] gap-2 px-4 py-2 bg-gray-50 text-[10px] font-semibold text-gray-400 uppercase tracking-wide rounded-t-xl">
                <span>Module</span><span className="w-14 text-center">None</span><span className="w-14 text-center">View</span><span className="w-16 text-center">Manage</span>
              </div>
              {modules.map(m => (
                <div key={m.key} className="grid grid-cols-[1fr,auto,auto,auto] gap-2 px-4 py-2 items-center">
                  <span className="text-sm text-gray-700">{m.label}</span>
                  {(['none', 'view', 'manage'] as const).map(level => (
                    <label key={level} className="flex justify-center cursor-pointer">
                      <input type="radio" name={`level-${m.key}`} checked={access[m.key] === level}
                        onChange={() => setLevel(m.key, level)} className="w-4 h-4 accent-[#0C447C]" />
                    </label>
                  ))}
                </div>
              ))}
            </div>
            <p className="text-[11px] text-gray-400 mt-2">View = can see and read data in that module. Manage = can also create, edit, and act on it.</p>
          </div>
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100 shrink-0 bg-gray-50 rounded-b-2xl">
          <Btn onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" onClick={submit} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? 'Saving…' : <><Check size={13} /> {isEdit ? 'Save Changes' : 'Create Role'}</>}
          </Btn>
        </div>
      </div>
    </div>
  )
}

// ─── ROLE CARD ─────────────────────────────────────────────────────────────────
function RoleCard({ role, modules, onEdit }: { role: Role; modules: { key: string; label: string }[]; onEdit: () => void }) {
  const queryClient = useQueryClient()
  const moduleLabel = (key: string) => modules.find(m => m.key === key)?.label || key

  const duplicateMutation = useMutation({
    mutationFn: () => rolesService.duplicateRole(role._id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['roles'] }); toast.success('Role duplicated — customize the copy freely') },
    onError: () => toast.error('Failed to duplicate role'),
  })
  const deleteMutation = useMutation({
    mutationFn: () => rolesService.deleteRole(role._id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['roles'] }); toast.success('Role deleted') },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to delete role'),
  })

  const manageModules = role.moduleAccess.filter(m => m.level === 'manage')
  const viewOnlyModules = role.moduleAccess.filter(m => m.level === 'view')

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${role.color}1a` }}>
            <KeyRound size={16} style={{ color: role.color }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-gray-800 text-sm">{role.name}</p>
              {role.isSystemDefault && <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-medium">Built-in</span>}
            </div>
            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><Users size={11} /> {role.assignedCount} assigned</p>
          </div>
        </div>
        <div className="flex gap-1">
          {!role.isSystemDefault && (
            <button onClick={onEdit} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-lg"><Edit2 size={13} /></button>
          )}
          <button onClick={() => duplicateMutation.mutate()} disabled={duplicateMutation.isPending}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-lg"><Copy size={13} /></button>
          {!role.isSystemDefault && (
            <button
              onClick={() => { if (confirm(`Delete "${role.name}"? This can't be undone.`)) deleteMutation.mutate() }}
              disabled={deleteMutation.isPending}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={13} /></button>
          )}
        </div>
      </div>
      {role.description && <p className="text-xs text-gray-500 mb-3">{role.description}</p>}
      <div className="flex flex-wrap gap-1.5">
        {manageModules.map(m => (
          <span key={m.moduleKey} className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">{moduleLabel(m.moduleKey)}</span>
        ))}
        {viewOnlyModules.map(m => (
          <span key={m.moduleKey} className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">{moduleLabel(m.moduleKey)} (view)</span>
        ))}
        {role.moduleAccess.length === 0 && <span className="text-[11px] text-gray-400 italic">No modules granted yet</span>}
      </div>
    </Card>
  )
}

const STANDARD_ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin', institution_owner: 'Owner / Principal', principal: 'Principal',
  vice_principal: 'Vice Principal', admin: 'Admin', academic_coordinator: 'Academic Coordinator',
  finance_manager: 'Finance Manager', hr_manager: 'HR Manager', teacher: 'Teacher',
  librarian: 'Librarian', parent: 'Parent', student: 'Student', support_staff: 'Support Staff',
}

// ─── TEAM MEMBERS: assign a custom role to a real user account ───────────────
function TeamMembersSection({ roles }: { roles: Role[] }) {
  const queryClient = useQueryClient()
  const { data: users = [], isLoading } = useQuery({ queryKey: ['roles', 'users'], queryFn: rolesService.getUsers })

  const assignMutation = useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string | null }) => rolesService.assignRole(userId, roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles', 'users'] })
      toast.success('Role updated — takes effect next time they log in')
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to assign role'),
  })

  return (
    <Card className="mt-6">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-800 text-sm">Team Members</h2>
        <p className="text-xs text-gray-400 mt-0.5">Assign one of your custom roles to any staff member with a login account</p>
      </div>
      {isLoading ? (
        <div className="p-8 text-center text-sm text-gray-400">Loading…</div>
      ) : users.length === 0 ? (
        <div className="p-8 text-center text-sm text-gray-400">No user accounts found yet.</div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-400 border-b border-gray-50">
              <th className="px-5 py-2 font-semibold">Name</th>
              <th className="px-5 py-2 font-semibold">Standard Role</th>
              <th className="px-5 py-2 font-semibold">Custom Role</th>
            </tr>
          </thead>
          <tbody>
            {(users as any[]).map(u => (
              <tr key={u.id} className="border-b border-gray-50 last:border-0">
                <td className="px-5 py-3">
                  <p className="font-medium text-gray-700">{u.name}</p>
                  <p className="text-xs text-gray-400">{u.email}</p>
                </td>
                <td className="px-5 py-3 text-gray-500">{STANDARD_ROLE_LABELS[u.standardRole] || u.standardRole}</td>
                <td className="px-5 py-3">
                  <select
                    value={u.customRoleId || ''}
                    onChange={e => assignMutation.mutate({ userId: u.id, roleId: e.target.value || null })}
                    disabled={assignMutation.isPending}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#0C447C] min-w-[180px]"
                  >
                    <option value="">— None (use standard role) —</option>
                    {roles.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  )
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function RolesPage() {
  const [showForm, setShowForm] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)

  const { data: roles = [], isLoading } = useQuery({ queryKey: ['roles'], queryFn: rolesService.getRoles })
  const { data: modules = [] } = useQuery({ queryKey: ['roles', 'modules'], queryFn: rolesService.getAssignableModules })

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Shield size={20} style={{ color: NAVY }} /> Roles & Permissions</h1>
          <p className="text-sm text-gray-500 mt-0.5">Create roles for your staff and choose exactly which modules each one can access</p>
        </div>
        <Btn variant="primary" onClick={() => { setEditingRole(null); setShowForm(true) }}>
          <Plus size={13} /> Create Role
        </Btn>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: '#0C447C33', borderTopColor: NAVY }} />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {(roles as Role[]).map(role => (
            <RoleCard key={role._id} role={role} modules={modules as any[]}
              onEdit={() => { setEditingRole(role); setShowForm(true) }} />
          ))}
        </div>
      )}

      {showForm && (
        <RoleFormModal role={editingRole} modules={modules as any[]} onClose={() => setShowForm(false)} />
      )}

      {!isLoading && <TeamMembersSection roles={roles as Role[]} />}
    </div>
  )
}
