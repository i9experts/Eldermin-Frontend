import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Permission } from '../../types/roles';

interface CanDoProps {
  /** The permission to check against the current user's role */
  permission: Permission;
  /** Rendered when the user has the permission */
  children: React.ReactNode;
  /** Optional fallback when the user lacks the permission */
  fallback?: React.ReactNode;
}

/**
 * Conditionally renders children only when the current user has the given permission.
 *
 * Usage:
 *   <CanDo permission="finance:manage">
 *     <DeleteButton />
 *   </CanDo>
 *
 *   <CanDo permission="hr:manage" fallback={<span>Read-only</span>}>
 *     <EditButton />
 *   </CanDo>
 */
export function CanDo({ permission, children, fallback = null }: CanDoProps) {
  const { canAccess } = useAuth();
  return canAccess(permission) ? <>{children}</> : <>{fallback}</>;
}

export default CanDo;
