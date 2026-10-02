import * as Sentry from '@sentry/react';
import { useEffect, useState } from 'react';

export function initFrontendSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: 'production',
    tracesSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });

  console.log('✅ Sentry frontend initialized');
}

// Vite builds every route's lazy-loaded chunk with a content hash in its
// filename, and Vercel replaces the previous deploy's assets outright on
// every new deploy - it doesn't keep old hashed chunks around to still
// serve them. A browser tab that's been open since before the latest
// deploy (or one that loaded a cached index.html from just before it) is
// holding route references to chunk filenames that no longer exist on the
// server, so the very next client-side navigation into an not-yet-loaded
// lazy route 404s on its own `import()` - surfacing as this ErrorBoundary,
// not as a normal page error, since React only sees "a lazy component
// failed to load." This is the exact "worked after I clicked Go to
// Dashboard" signature: that link is a hard `<a href>` (full navigation),
// which fetches a fresh index.html referencing the CURRENT deploy's real
// chunk hashes and just works, while "Try Again" (an in-place React
// re-render) retries the same stale `import()` and fails again.
//
// Detects that one specific, well-understood failure mode by its browser-
// level error message (this phrasing is standardized across Vite/webpack/
// the ES module spec, not something this app controls) and silently does
// the equivalent of "Go to Dashboard" itself - a real page reload - instead
// of showing a scary dead-end screen for something that isn't actually a
// bug in the app. Guarded by a one-shot sessionStorage flag so a genuine,
// persistently-broken deploy reloads once and then falls through to the
// real error screen rather than reload-looping forever.
const CHUNK_LOAD_ERROR_PATTERN = /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|Loading chunk .* failed/i;
const RELOAD_GUARD_KEY = 'eldermin_chunk_reload_attempted';

function isChunkLoadError(error: any): boolean {
  const message = `${error?.message || ''} ${error?.name || ''}`;
  return CHUNK_LOAD_ERROR_PATTERN.test(message);
}

export const ErrorFallback = ({ error, resetError }: any) => {
  const [autoReloading, setAutoReloading] = useState(false);

  useEffect(() => {
    if (!isChunkLoadError(error)) return;
    if (sessionStorage.getItem(RELOAD_GUARD_KEY)) return; // already tried once this session - don't loop
    sessionStorage.setItem(RELOAD_GUARD_KEY, '1');
    setAutoReloading(true);
    window.location.reload();
  }, [error]);

  if (autoReloading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', fontFamily: 'Arial', textAlign: 'center', padding: '20px',
      }}>
        <p style={{ color: '#6b7280' }}>Loading the latest version…</p>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      fontFamily: 'Arial',
      textAlign: 'center',
      padding: '20px'
    }}>
      <div style={{ fontSize: '60px', marginBottom: '20px' }}>😵</div>
      <h2 style={{ color: '#1e3a5f' }}>Something went wrong</h2>
      <p style={{ color: '#6b7280', marginBottom: '20px' }}>
        Our team has been notified automatically.
      </p>
      <button
        onClick={resetError}
        style={{
          background: '#1e3a5f',
          color: 'white',
          padding: '10px 25px',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          marginRight: '10px'
        }}
      >
        Try Again
      </button>
      <a href="/dashboard" style={{ color: '#1e3a5f' }}>
        Go to Dashboard
      </a>
    </div>
  );
};
