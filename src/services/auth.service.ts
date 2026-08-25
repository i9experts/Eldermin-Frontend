import api from '../lib/api';

export interface LoginPayload {
  email: string;
  password: string;
  slug?: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
  permissions?: string[];
  campusId?: string;
  department?: string;
  classTeacherOfGradeId?: string;
  classTeacherOfGradeName?: string;
  classTeacherOfSectionName?: string;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
  institution: {
    name: string;
    slug?: string;
    plan: string;
    activeModules: string[];
  };
}

const authService = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/login', payload);
    localStorage.setItem('eldermin_token', data.accessToken);
    localStorage.setItem('eldermin_user', JSON.stringify(data.user));
    // A reseller_admin/reseller_support login response has no `institution`
    // key at all (see AuthContext.login - those roles get routed into the
    // separate Reseller Portal session instead). JSON.stringify(undefined)
    // returns the JS value `undefined`, and localStorage.setItem coerces
    // that to the literal 4-character string "undefined" - which is not
    // valid JSON. If anything interrupted the reseller login flow before
    // AuthContext's cleanup ran (a refresh, a slow network, a closed tab),
    // that string was left behind, and every future page load - including
    // bare /login - crashed on JSON.parse("undefined") in getStoredInstitution
    // before the app ever rendered anything (a genuine blank white screen,
    // since AuthProvider sits above the Sentry error boundary). Only write
    // a real value here.
    if (data.institution) {
      localStorage.setItem('eldermin_institution', JSON.stringify(data.institution));
    } else {
      localStorage.removeItem('eldermin_institution');
    }
    return data;
  },

  async getMe() {
    const { data } = await api.get('/auth/me');
    return data;
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    const { data } = await api.post('/auth/forgot-password', { email });
    return data;
  },

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const { data } = await api.post('/auth/reset-password', { token, newPassword });
    return data;
  },

  async uploadAvatar(file: File) {
    const formData = new FormData();
    formData.append('avatar', file);
    const { data } = await api.post('/auth/me/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    return data;
  },

  logout() {
    localStorage.removeItem('eldermin_token');
    localStorage.removeItem('eldermin_user');
    localStorage.removeItem('eldermin_institution');
    window.location.href = '/login';
  },

  getStoredUser(): AuthUser | null {
    const u = localStorage.getItem('eldermin_user');
    if (!u) return null;
    try {
      return JSON.parse(u);
    } catch {
      // A corrupt/non-JSON value (e.g. the literal string "undefined")
      // must not keep crashing every page load forever - self-heal by
      // clearing it and falling back to logged-out, same as if it were
      // never set. See the note in login() for how this got written.
      localStorage.removeItem('eldermin_user');
      return null;
    }
  },

  getStoredInstitution() {
    const i = localStorage.getItem('eldermin_institution');
    if (!i) return null;
    try {
      return JSON.parse(i);
    } catch {
      localStorage.removeItem('eldermin_institution');
      return null;
    }
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('eldermin_token');
  },

  hasModule(moduleName: string): boolean {
    const inst = this.getStoredInstitution();
    return inst?.activeModules?.includes(moduleName) ?? false;
  },
};

export default authService;
