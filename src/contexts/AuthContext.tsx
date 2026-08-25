import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import authService, { AuthUser } from '../services/auth.service';
import { Permission, roleHasPermission } from '../types/roles';
import { storeResellerPortalSession } from '../services/resellerPortalAuth';

const RESELLER_ROLES = ['reseller_admin', 'reseller_support'];

interface AuthContextType {
  user: AuthUser | null;
  institution: any;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, slug?: string) => Promise<{ role: string }>;
  loginWithToken: (token: string, slug: string) => Promise<void>;
  logout: () => void;
  hasModule: (moduleName: string) => boolean;
  /** Returns true if the current user's role grants the given permission. */
  canAccess: (permission: Permission) => boolean;
  updateAvatar: (avatarUrl: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [institution, setInstitution] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = authService.getStoredUser();
    const storedInst = authService.getStoredInstitution();
    if (storedUser) setUser(storedUser);
    if (storedInst) setInstitution(storedInst);
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string, slug?: string) => {
    const response: any = await authService.login({ email, password, slug });

    // reseller_admin/reseller_support are platform-level accounts with no
    // school Tenant at all (see auth.service.ts's login) — the response
    // has no `institution`, just a `reseller`. They belong in the Reseller
    // Portal's own, separate session (see resellerPortalAuth.ts), not this
    // one: authService.login() already wrote the main-app keys unconditionally,
    // so undo that and store the real portal session instead. The main
    // AuthContext state is deliberately left unauthenticated, so ProtectedRoute
    // sends them to /login rather than into a bogus, empty school dashboard —
    // the caller (Login.tsx) is expected to navigate to /partner instead.
    if (RESELLER_ROLES.includes(response.user.role)) {
      localStorage.removeItem('eldermin_token');
      localStorage.removeItem('eldermin_user');
      localStorage.removeItem('eldermin_institution');
      storeResellerPortalSession(response.accessToken, response.user, response.reseller);
      return { role: response.user.role };
    }

    setUser(response.user);
    setInstitution(response.institution);
    return { role: response.user.role };
  };

  const loginWithToken = async (token: string, slug: string) => {
    localStorage.setItem('eldermin_token', token);
    try {
      const data = await authService.getMe();
      const user: AuthUser = data.user ?? data;
      const inst = data.institution ?? { slug, name: '', plan: '', activeModules: [] };
      localStorage.setItem('eldermin_user', JSON.stringify(user));
      localStorage.setItem('eldermin_institution', JSON.stringify(inst));
      setUser(user);
      setInstitution(inst);
    } catch {
      localStorage.removeItem('eldermin_token');
      throw new Error('Invalid or expired token');
    }
  };

  const logout = () => {
    setUser(null);
    setInstitution(null);
    authService.logout();
  };

  const hasModule = (moduleName: string) => {
    return institution?.activeModules?.includes(moduleName) ?? false;
  };

  const canAccess = (permission: Permission): boolean => {
    // A school-defined custom role, when assigned, fully overrides the
    // standard enum-based matrix below — everyone without one (which is
    // everyone, until this feature is actually used) keeps working exactly
    // as before.
    if (user?.permissions) return user.permissions.includes(permission);
    return roleHasPermission(user?.role, permission);
  };

  const updateAvatar = (avatarUrl: string) => {
    setUser(prev => {
      if (!prev) return prev;
      const next = { ...prev, avatarUrl };
      localStorage.setItem('eldermin_user', JSON.stringify(next));
      return next;
    });
  };

  return (
    <AuthContext.Provider value={{
      user,
      institution,
      isAuthenticated: !!user,
      isLoading,
      login,
      loginWithToken,
      logout,
      hasModule,
      canAccess,
      updateAvatar,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
