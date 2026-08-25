// ============================================================
// RESELLER PORTAL AUTH — Eldermin Partner Network (Phase 2)
// A partner login is intentionally isolated from the tenant/Super-Admin
// session (separate localStorage keys) — someone testing the portal in
// one tab shouldn't clobber (or be clobbered by) a Super Admin session
// open in another tab of the same browser.
// ============================================================
import axios from 'axios';

const API_BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/v1`;

const TOKEN_KEY = 'eldermin_reseller_token';
const USER_KEY = 'eldermin_reseller_user';
const RESELLER_KEY = 'eldermin_reseller_info';

export interface ResellerPortalUser {
  id: string;
  name: string;
  email: string;
  role: string;
  resellerId: string;
}

export interface ResellerPortalReseller {
  id: string;
  name: string;
  slug: string;
  tier: string;
  track: string;
  status: string;
}

export async function resellerPortalLogin(email: string, password: string) {
  const res = await axios.post(`${API_BASE}/auth/login`, { email, password });
  const { accessToken, user, reseller } = res.data;
  storeResellerPortalSession(accessToken, user, reseller);
  return { user, reseller };
}

// Used by the main /login page, which also calls the same /auth/login
// endpoint and gets back this exact reseller shape when the account is
// reseller_admin/reseller_support — stores it under the portal's own keys
// without a second network round-trip.
export function storeResellerPortalSession(accessToken: string, user: ResellerPortalUser, reseller: ResellerPortalReseller) {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem(RESELLER_KEY, JSON.stringify(reseller));
}

export function resellerPortalLogout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(RESELLER_KEY);
}

export function getResellerPortalToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getResellerPortalUser(): ResellerPortalUser | null {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function getResellerPortalReseller(): ResellerPortalReseller | null {
  const raw = localStorage.getItem(RESELLER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function isResellerPortalAuthenticated(): boolean {
  return !!getResellerPortalToken();
}
