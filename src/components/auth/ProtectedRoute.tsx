import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Permission } from '../../types/roles';
import React from 'react';

interface ProtectedRouteProps {
  /** If provided, the user must also have this permission; otherwise redirects to /unauthorized */
  permission?: Permission;
  /**
   * If provided, the school must have this module active (per MODULE_REGISTRY
   * id, e.g. 'finance', 'compliance') — checked via AuthContext's hasModule,
   * which reads the school's activeModules set by Super Admin's Module
   * Command Center. Missing it redirects to /unauthorized with a module-specific
   * reason, same as a missing permission would, so a disabled module's page
   * isn't reachable just by typing/bookmarking its URL even once its sidebar
   * link is hidden (see Sidebar.tsx's matching moduleId-based filtering).
   */
  module?: string;
  /** Human-readable module name for the /unauthorized message, e.g. 'Finance'. */
  moduleName?: string;
  children: React.ReactNode;
}

/**
 * Wraps a route element to require authentication (and optionally a permission
 * and/or an active module).
 * - Not authenticated → redirect to /login
 * - Authenticated but missing permission → redirect to /unauthorized
 * - Authenticated but module not active for this school → redirect to /unauthorized?reason=module
 * - OK → render children
 */
export function ProtectedRoute({ permission, module, moduleName, children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, canAccess, hasModule } = useAuth();

  if (isLoading) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (permission && !canAccess(permission)) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (module && !hasModule(module)) {
    const params = new URLSearchParams({ reason: 'module' });
    if (moduleName) params.set('module', moduleName);
    return <Navigate to={`/unauthorized?${params.toString()}`} replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
