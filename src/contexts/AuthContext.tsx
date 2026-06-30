import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import authService, { AuthUser } from '../services/auth.service';
import { Permission, roleHasPermission } from '../types/roles';

interface AuthContextType {
  user: AuthUser | null;
  institution: any;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, slug: string) => Promise<void>;
  loginWithToken: (token: string, slug: string) => Promise<void>;
  logout: () => void;
  hasModule: (moduleName: string) => boolean;
  /** Returns true if the current user's role grants the given permission. */
  canAccess: (permission: Permission) => boolean;
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

  const login = async (email: string, password: string, slug: string) => {
    const response = await authService.login({ email, password, slug });
    setUser(response.user);
    setInstitution(response.institution);
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
    return roleHasPermission(user?.role, permission);
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
