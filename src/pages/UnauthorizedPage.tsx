import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldOff, PackageX } from 'lucide-react';

/**
 * 403 Unauthorized page — shown when a user is authenticated but either
 * lacks the required permission for the requested route, or (reason=module)
 * their school hasn't had this module activated by Super Admin.
 */
export default function UnauthorizedPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isModuleReason = searchParams.get('reason') === 'module';
  const moduleName = searchParams.get('module');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md px-6">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
            {isModuleReason ? (
              <PackageX className="w-10 h-10 text-red-500" />
            ) : (
              <ShieldOff className="w-10 h-10 text-red-500" />
            )}
          </div>
        </div>
        {isModuleReason ? (
          <>
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Module Not Enabled</h2>
            <p className="text-gray-500 mb-8">
              {moduleName ? `The "${moduleName}" module` : 'This module'} isn&apos;t enabled for
              your school yet. Please contact your Eldermin administrator to have it activated.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">403</h1>
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Access Denied</h2>
            <p className="text-gray-500 mb-8">
              You don&apos;t have permission to view this page. Please contact your administrator
              if you believe this is a mistake.
            </p>
          </>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Go Back
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 text-sm font-medium text-white bg-navy-900 rounded-lg hover:bg-navy-800 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
