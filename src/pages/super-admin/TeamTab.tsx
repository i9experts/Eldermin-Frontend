import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  UserCog, Plus, Copy, Trash2, Edit2, Users, X, Check, KeyRound, Power, RotateCcw,
} from 'lucide-react';
import platformTeamService from '../../services/platformTeam.service';

const NAVY = '#0C447C';

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm ${className}`}>{children}</div>;
}

function Btn({ children, onClick, variant = 'secondary', disabled = false }: {
  children: React.ReactNode; onClick?: () => void; variant?: 'primary' | 'secondary' | 'danger' | 'ghost'; disabled?: boolean;
}) {
  const styles = {
    primary: 'text-white hover:opacity-90',
    secondary: 'border border-gray-200 text-gray-600 hover:bg-gray-50',
    danger: 'text-red-600 hover:bg-red-50',
    ghost: 'text-gray-400 hover:text-gray-600 hover:bg-gray-50',
  }[variant];
  return (
    <button onClick={onClick} disabled={disabled}
      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 ${styles}`}
      style={variant === 'primary' ? { backgroundColor: NAVY } : undefined}>
      {children}
    </button>
  );
}

type Level = 'none' | 'view' | 'manage';
type ModuleAccess = { tabKey: string; level: 'view' | 'manage'; subTabKey?: string };
type TabDef = { key: string; label: string; subTabs: { key: string; label: string }[] };
type PlatformRole = {
  _id: string; name: string; description?: string; color?: string;
  moduleAccess: ModuleAccess[]; isSystemDefault: boolean; assignedCount: number;
};
type Staff = {
  id: string; name: string; email: string; isActive: boolean;
  lastLoginAt: string | null; createdAt: string;
  customPlatformRoleId: string | null; role: { _id: string; name: string; color?: string } | null;
};

// Every tab currently has exactly one sub-tab (itself) - no expandable tree
// needed yet, unlike the institution-level Finance-style multi-sub-module
// case. Picking a level for the tab sets that one entry directly.
function buildInitialAccess(role: PlatformRole | null, tabs: TabDef[]): Record<string, Level> {
  const initial: Record<string, Level> = {};
  tabs.forEach(t => {
    const grant = role?.moduleAccess.find(ma => ma.tabKey === t.key);
    initial[t.key] = grant ? grant.level : 'none';
  });
  return initial;
}

function buildPayload(access: Record<string, Level>): ModuleAccess[] {
  return Object.entries(access)
    .filter(([, level]) => level !== 'none')
    .map(([tabKey, level]) => ({ tabKey, level: level as 'view' | 'manage' }));
}

const LEVEL_COLS = ['none', 'view', 'manage'] as const;

function LevelRadios({ name, value, onChange }: { name: string; value: Level; onChange: (level: Level) => void }) {
  return (
    <>
      {LEVEL_COLS.map(level => (
        <label key={level} className="flex justify-center cursor-pointer">
          <input type="radio" name={name} checked={value === level} onChange={() => onChange(level)} className="w-4 h-4 accent-[#0C447C]" />
        </label>
      ))}
    </>
  );
}

// ─── ROLE FORM MODAL (create + edit) ──────────────────────────────────────────
function RoleFormModal({ role, tabs, onClose }: { role: PlatformRole | null; tabs: TabDef[]; onClose: () => void }) {
  const queryClient = useQueryClient();
  const isEdit = !!role;
  const [name, setName] = useState(role?.name ?? '');
  const [description, setDescription] = useState(role?.description ?? '');
  const [color, setColor] = useState(role?.color ?? NAVY);
  const [access, setAccess] = useState<Record<string, Level>>(() => buildInitialAccess(role, tabs));

  const setLevel = (tabKey: string, level: Level) => setAccess(prev => ({ ...prev, [tabKey]: level }));
  const selectedTabCount = tabs.filter(t => access[t.key] && access[t.key] !== 'none').length;

  const saveMutation = useMutation({
    mutationFn: () => {
      const moduleAccess = buildPayload(access);
      const payload = { name, description: description || undefined, color, moduleAccess };
      return isEdit ? platformTeamService.updateRole(role!._id, payload) : platformTeamService.createRole(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-team', 'roles'] });
      toast.success(isEdit ? 'Role updated' : 'Role created');
      onClose();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Something went wrong'),
  });

  const submit = () => {
    if (!name.trim()) { toast.error('Give this role a name'); return; }
    if (selectedTabCount === 0) { toast.error('Grant access to at least one tab'); return; }
    saveMutation.mutate();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col" style={{ maxHeight: '88vh' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0" style={{ backgroundColor: NAVY, borderRadius: '16px 16px 0 0' }}>
          <div>
            <h2 className="font-bold text-white text-sm">{isEdit ? 'Edit Role' : 'Create Role'}</h2>
            <p className="text-blue-200 text-xs mt-0.5">Choose exactly which Super Admin tabs this role can see, and how much they can do there</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Role Name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Regional Sales Lead"
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
              <label className="text-xs font-semibold text-gray-600">Tab Access</label>
              <span className="text-[11px] text-gray-400">{selectedTabCount} of {tabs.length} tabs granted</span>
            </div>
            <div className="border border-gray-200 rounded-xl divide-y divide-gray-100">
              <div className="grid grid-cols-[1fr,auto,auto,auto] gap-2 px-4 py-2 bg-gray-50 text-[10px] font-semibold text-gray-400 uppercase tracking-wide rounded-t-xl">
                <span>Tab</span><span className="w-14 text-center">None</span><span className="w-14 text-center">View</span><span className="w-16 text-center">Manage</span>
              </div>
              {tabs.map(t => (
                <div key={t.key} className="grid grid-cols-[1fr,auto,auto,auto] gap-2 px-4 py-2 items-center">
                  <span className="text-sm text-gray-700">{t.label}</span>
                  <LevelRadios name={`level-${t.key}`} value={access[t.key] ?? 'none'} onChange={level => setLevel(t.key, level)} />
                </div>
              ))}
            </div>
            <p className="text-[11px] text-gray-400 mt-2">View = can see and read data in that tab. Manage = can also create, edit, and act on it.</p>
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
  );
}

// ─── ROLE CARD ─────────────────────────────────────────────────────────────────
function RoleCard({ role, tabs, onEdit }: { role: PlatformRole; tabs: TabDef[]; onEdit: () => void }) {
  const queryClient = useQueryClient();
  const tabLabel = (key: string) => tabs.find(t => t.key === key)?.label || key;

  const duplicateMutation = useMutation({
    mutationFn: () => platformTeamService.duplicateRole(role._id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['platform-team', 'roles'] }); toast.success('Role duplicated — customize the copy freely'); },
    onError: () => toast.error('Failed to duplicate role'),
  });
  const deleteMutation = useMutation({
    mutationFn: () => platformTeamService.deleteRole(role._id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['platform-team', 'roles'] }); toast.success('Role deleted'); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to delete role'),
  });

  const manageTabs = role.moduleAccess.filter(m => m.level === 'manage').map(m => m.tabKey);
  const viewOnlyTabs = role.moduleAccess.filter(m => m.level === 'view').map(m => m.tabKey);

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
              onClick={() => { if (confirm(`Delete "${role.name}"? This can't be undone.`)) deleteMutation.mutate(); }}
              disabled={deleteMutation.isPending}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={13} /></button>
          )}
        </div>
      </div>
      {role.description && <p className="text-xs text-gray-500 mb-3">{role.description}</p>}
      <div className="flex flex-wrap gap-1.5">
        {manageTabs.map(key => (
          <span key={key} className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">{tabLabel(key)}</span>
        ))}
        {viewOnlyTabs.map(key => (
          <span key={key} className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">{tabLabel(key)} (view)</span>
        ))}
        {role.moduleAccess.length === 0 && <span className="text-[11px] text-gray-400 italic">No tabs granted yet</span>}
      </div>
    </Card>
  );
}

// ─── CREATE STAFF MODAL ────────────────────────────────────────────────────────
function CreateStaffModal({ roles, onClose }: { roles: PlatformRole[]; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [roleId, setRoleId] = useState('');
  const [created, setCreated] = useState<{ email: string; tempPassword: string } | null>(null);

  const createMutation = useMutation({
    mutationFn: () => platformTeamService.createStaff({ firstName, lastName, email, roleId: roleId || undefined }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['platform-team', 'staff'] });
      queryClient.invalidateQueries({ queryKey: ['platform-team', 'roles'] });
      setCreated({ email: data.email, tempPassword: data.tempPassword });
      toast.success('Staff account created');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create staff account'),
  });

  const submit = () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) { toast.error('Name and email are required'); return; }
    createMutation.mutate();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800 text-sm">Add Staff Account</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg"><X size={18} /></button>
        </div>
        {created ? (
          <div className="p-5 space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-800 space-y-2">
              <p>Account created for <strong>{created.email}</strong>. Share this temporary password securely — it's shown only once:</p>
              <p className="font-mono text-sm bg-white border border-emerald-200 rounded-lg px-3 py-2 select-all">{created.tempPassword}</p>
            </div>
            <div className="flex justify-end"><Btn variant="primary" onClick={onClose}>Done</Btn></div>
          </div>
        ) : (
          <>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">First Name</label>
                  <input value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Last Name</label>
                  <input value={lastName} onChange={e => setLastName(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@i9experts.com"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Role</label>
                <select value={roleId} onChange={e => setRoleId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]">
                  <option value="">— Unrestricted (full Super Admin access) —</option>
                  {roles.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <Btn onClick={onClose}>Cancel</Btn>
              <Btn variant="primary" onClick={submit} disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating…' : 'Create Account'}
              </Btn>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── STAFF SECTION ─────────────────────────────────────────────────────────────
function StaffSection({ roles }: { roles: PlatformRole[] }) {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const { data: staff = [], isLoading } = useQuery<Staff[]>({ queryKey: ['platform-team', 'staff'], queryFn: platformTeamService.getStaff });

  const assignMutation = useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string | null }) => platformTeamService.assignRole(userId, roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-team', 'staff'] });
      queryClient.invalidateQueries({ queryKey: ['platform-team', 'roles'] });
      toast.success('Role updated — takes effect next time they log in');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to assign role'),
  });
  const statusMutation = useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) => platformTeamService.setStaffActive(userId, isActive),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['platform-team', 'staff'] });
      toast.success(vars.isActive ? 'Account reactivated' : 'Account deactivated');
    },
    onError: () => toast.error('Failed to update account status'),
  });
  const resetMutation = useMutation({
    mutationFn: (userId: string) => platformTeamService.resetStaffPassword(userId),
    onSuccess: (data: any) => {
      toast.success(`New temporary password: ${data.tempPassword}`, { duration: 15000 });
    },
    onError: () => toast.error('Failed to reset password'),
  });

  return (
    <Card className="mt-6">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-gray-800 text-sm">Staff Accounts</h2>
          <p className="text-xs text-gray-400 mt-0.5">i9experts' own internal team managing the Eldermin platform</p>
        </div>
        <Btn variant="primary" onClick={() => setShowCreate(true)}><Plus size={13} /> Add Staff</Btn>
      </div>
      {isLoading ? (
        <div className="p-8 text-center text-sm text-gray-400">Loading…</div>
      ) : staff.length === 0 ? (
        <div className="p-8 text-center text-sm text-gray-400">No staff accounts yet.</div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-400 border-b border-gray-50">
              <th className="px-5 py-2 font-semibold">Name</th>
              <th className="px-5 py-2 font-semibold">Role</th>
              <th className="px-5 py-2 font-semibold">Status</th>
              <th className="px-5 py-2 font-semibold">Last Login</th>
              <th className="px-5 py-2 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {staff.map(s => (
              <tr key={s.id} className="border-b border-gray-50 last:border-0">
                <td className="px-5 py-3">
                  <p className="font-medium text-gray-700">{s.name}</p>
                  <p className="text-xs text-gray-400">{s.email}</p>
                </td>
                <td className="px-5 py-3">
                  <select
                    value={s.customPlatformRoleId || ''}
                    onChange={e => assignMutation.mutate({ userId: s.id, roleId: e.target.value || null })}
                    disabled={assignMutation.isPending}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#0C447C] min-w-[200px]"
                  >
                    <option value="">— Unrestricted (full access) —</option>
                    {roles.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
                  </select>
                </td>
                <td className="px-5 py-3">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${s.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                    {s.isActive ? 'Active' : 'Deactivated'}
                  </span>
                </td>
                <td className="px-5 py-3 text-xs text-gray-500">{s.lastLoginAt ? new Date(s.lastLoginAt).toLocaleDateString() : 'Never'}</td>
                <td className="px-5 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => resetMutation.mutate(s.id)} disabled={resetMutation.isPending}
                      title="Reset password" className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-lg"><RotateCcw size={13} /></button>
                    <button
                      onClick={() => statusMutation.mutate({ userId: s.id, isActive: !s.isActive })}
                      disabled={statusMutation.isPending}
                      title={s.isActive ? 'Deactivate' : 'Reactivate'}
                      className={`p-1.5 rounded-lg hover:bg-gray-50 ${s.isActive ? 'text-gray-400 hover:text-red-600' : 'text-gray-400 hover:text-emerald-600'}`}>
                      <Power size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {showCreate && <CreateStaffModal roles={roles} onClose={() => setShowCreate(false)} />}
    </Card>
  );
}

// ─── MAIN TAB ──────────────────────────────────────────────────────────────────
export default function TeamTab() {
  const [showForm, setShowForm] = useState(false);
  const [editingRole, setEditingRole] = useState<PlatformRole | null>(null);

  const { data: roles = [], isLoading } = useQuery<PlatformRole[]>({ queryKey: ['platform-team', 'roles'], queryFn: platformTeamService.getRoles });
  const { data: tabs = [] } = useQuery<TabDef[]>({ queryKey: ['platform-team', 'tabs'], queryFn: platformTeamService.getTabs });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2"><UserCog size={16} style={{ color: NAVY }} /> Team & Access</h2>
          <p className="text-xs text-gray-400">Staff accounts, roles, and scoped permissions for i9experts' own internal team</p>
        </div>
        <Btn variant="primary" onClick={() => { setEditingRole(null); setShowForm(true); }}>
          <Plus size={13} /> Create Role
        </Btn>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: '#0C447C33', borderTopColor: NAVY }} />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {roles.map(role => (
            <RoleCard key={role._id} role={role} tabs={tabs} onEdit={() => { setEditingRole(role); setShowForm(true); }} />
          ))}
        </div>
      )}

      {showForm && <RoleFormModal role={editingRole} tabs={tabs} onClose={() => setShowForm(false)} />}

      {!isLoading && <StaffSection roles={roles} />}
    </div>
  );
}
