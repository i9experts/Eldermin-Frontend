// Every API client in this app reads `eldermin_institution` out of
// localStorage on every single request to set the x-school-slug header.
// A plain JSON.parse there crashes the moment that value is ever anything
// other than valid JSON - notably the literal string "undefined", which
// `localStorage.setItem(key, JSON.stringify(possiblyUndefinedValue))`
// silently writes whenever the value being stringified is undefined (a
// real case: a reseller_admin/reseller_support login response has no
// `institution` key at all - see auth.service.ts). Since this runs in a
// request interceptor invoked on every API call app-wide, one poisoned
// key took down the entire app on every page, not just the feature that
// wrote it.
export function safeParseLocalStorage<T = any>(key: string): T | null {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}
