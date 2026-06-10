export default function RBACTab() {
  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-900">Role-Based Access Control</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage roles, permissions, and user access across all campuses</p>
      </div>
      <div className="flex flex-col items-center justify-center py-20">
        <div className="text-5xl mb-4">🛡️</div>
        <p className="text-sm font-semibold text-gray-500">No RBAC records yet</p>
        <p className="text-xs text-gray-400 mt-1">This section will populate once configured</p>
      </div>
    </div>
  );
}
