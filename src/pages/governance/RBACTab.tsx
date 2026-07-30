import { useNavigate } from "react-router-dom";
import { KeyRound } from "lucide-react";

export default function RBACTab() {
  const navigate = useNavigate();
  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-900">Role-Based Access Control</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage roles, permissions, and user access across all campuses</p>
      </div>
      <div className="flex flex-col items-center justify-center py-20 border border-dashed border-slate-200 rounded-2xl">
        <KeyRound size={40} className="text-slate-300 mb-4" />
        <p className="text-sm font-semibold text-gray-600">Role management now lives under Foundation</p>
        <p className="text-xs text-gray-400 mt-1 max-w-sm text-center">
          Create custom roles, choose exactly which modules each one can access, and assign them to your team from one place.
        </p>
        <button
          onClick={() => navigate('/roles')}
          className="mt-4 flex items-center gap-1.5 px-4 py-2 text-xs bg-[#0C447C] text-white rounded-lg hover:bg-[#0b3d6e] font-medium"
        >
          <KeyRound size={13} /> Go to Roles & Permissions
        </button>
      </div>
    </div>
  );
}
