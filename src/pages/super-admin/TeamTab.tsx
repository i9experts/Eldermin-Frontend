import React from 'react';
import { UserCog } from 'lucide-react';

export default function TeamTab() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-gray-800">Team & Access</h2>
        <p className="text-xs text-gray-400">Staff accounts and role-based permissions</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 flex flex-col items-center text-center">
        <UserCog size={32} className="text-gray-300 mb-3" strokeWidth={1.5} />
        <p className="text-sm font-medium text-gray-600 mb-1">Coming soon</p>
        <p className="text-xs text-gray-400 max-w-sm">
          Staff accounts, roles (Sales, Support, Onboarding, Finance), and scoped permissions will live here.
          Right now there's a single super_admin account — this is next in the build sequence.
        </p>
      </div>
    </div>
  );
}
