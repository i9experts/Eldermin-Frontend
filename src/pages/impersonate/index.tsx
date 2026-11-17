// ============================================================
// IMPERSONATION HANDOFF — Super Admin "Support Access"
// Reads the one-time session handoff out of the URL fragment (never
// sent to any server/proxy, unlike a query string), writes it into this
// tab's own localStorage under the exact same keys the normal login flow
// uses, then redirects into the app. The fragment is cleared immediately
// so the token never lingers in browser history past this one load.
// ============================================================
import { useEffect, useState } from 'react';

export default function ImpersonateHandoffPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash;
    const match = hash.match(/data=([^&]+)/);
    if (!match) { setError('No session data found in this link.'); return; }

    try {
      const decoded = JSON.parse(decodeURIComponent(atob(match[1])));
      if (!decoded.accessToken || !decoded.user) throw new Error('Incomplete session data');

      localStorage.setItem('eldermin_token', decoded.accessToken);
      localStorage.setItem('eldermin_user', JSON.stringify(decoded.user));
      if (decoded.institution) {
        localStorage.setItem('eldermin_institution', JSON.stringify(decoded.institution));
      } else {
        localStorage.removeItem('eldermin_institution');
      }

      // Clear the fragment before navigating away, then a full reload
      // (not client-side navigate) so AuthContext boots fresh from the
      // localStorage just written, exactly like a normal login would.
      window.history.replaceState(null, '', window.location.pathname);
      window.location.replace('/dashboard');
    } catch {
      setError('This support-access link is invalid or has expired. Ask the super admin to open a new one.');
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-sm text-center">
        {error ? (
          <>
            <p className="text-sm font-semibold text-red-600 mb-1">Could not start session</p>
            <p className="text-xs text-gray-500">{error}</p>
          </>
        ) : (
          <>
            <p className="text-sm font-semibold text-gray-700 mb-1">Starting support session…</p>
            <p className="text-xs text-gray-400">You'll be redirected in a moment.</p>
          </>
        )}
      </div>
    </div>
  );
}
