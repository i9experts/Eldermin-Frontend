import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import authService, { AuthUser } from '../services/auth.service';

interface AuthContextType {
  user: AuthUser | null;
  institution: any;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, slug: string) => Promise<void>;
  logout: () => void;
  hasModule: (moduleName: string) => boolean;
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

  const logout = () => {
    setUser(null);
    setInstitution(null);
    authService.logout();
  };

  const hasModule = (moduleName: string) => {
    return institution?.activeModules?.includes(moduleName) ?? false;
  };

  return (
    <AuthContext.Provider value={{
      user,
      institution,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      hasModule,
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
