import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Permission } from '../../types/roles';
import React from 'react';

interface ProtectedRouteProps {
  /** If provided, the user must also have this permission; otherwise redirects to /unauthorized */
  permission?: Permission;
  children: React.ReactNode;
}

/**
 * Wraps a route element to require authentication (and optionally a permission).
 * - Not authenticated → redirect to /login
 * - Authenticated but missing permission → redirect to /unauthorized
 * - OK → render children
 */
export function ProtectedRoute({ permission, children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, canAccess } = useAuth();

  if (isLoading) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (permission && !canAccess(permission)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
