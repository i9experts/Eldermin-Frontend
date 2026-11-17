import axios from 'axios';

const av = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/v1/admin/app-versions`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

av.interceptors.request.use((config) => {
  const token = localStorage.getItem('eldermin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export interface AppVersionRow {
  id: string;
  app: 'parent' | 'teacher';
  platform: 'android' | 'ios';
  latestVersion: string;
  minVersion: string;
  storeUrl: string;
  updateMessage: string | null;
  updatedAt?: string;
}

export type UpdateAppVersionInput = Partial<Pick<AppVersionRow, 'latestVersion' | 'minVersion' | 'storeUrl' | 'updateMessage'>>;

export const getAppVersions = () =>
  av.get<AppVersionRow[]>('').then(r => r.data);

export const updateAppVersion = (id: string, data: UpdateAppVersionInput) =>
  av.patch<AppVersionRow>(`/${id}`, data).then(r => r.data);

/** Numeric x.y.z compare (not string compare): "1.0.10" > "1.0.9". */
export const isSemver = (v: string) => /^\d+\.\d+\.\d+$/.test(v);
export const compareSemver = (a: string, b: string) => {
  const pa = a.split('.').map(Number), pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) if (pa[i] !== pb[i]) return pa[i] < pb[i] ? -1 : 1;
  return 0;
};
