import React from 'react';
import { ScrollText } from 'lucide-react';

export default function AuditTab() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-gray-800">Audit Logs & Settings</h2>
        <p className="text-xs text-gray-400">Every super-admin action, logged</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 flex flex-col items-center text-center">
        <ScrollText size={32} className="text-gray-300 mb-3" strokeWidth={1.5} />
        <p className="text-sm font-medium text-gray-600 mb-1">Coming soon</p>
        <p className="text-xs text-gray-400 max-w-sm">
          A record of who activated/suspended a school, changed a plan, or modified a role — plus
          platform-wide settings like email templates and integration keys. Not built yet.
        </p>
      </div>
    </div>
  );
}
