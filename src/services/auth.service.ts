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
    localStorage.setItem('eldermin_institution', JSON.stringify(data.institution));
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
    return u ? JSON.parse(u) : null;
  },

  getStoredInstitution() {
    const i = localStorage.getItem('eldermin_institution');
    return i ? JSON.parse(i) : null;
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
