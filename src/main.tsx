import { initFrontendSentry, ErrorFallback } from './sentry.tsx';
import * as Sentry from '@sentry/react';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import './index.css';

initFrontendSentry();

// Vite's own first-class signal for exactly the "stale deploy, lazy route
// chunk 404s" failure described in sentry.tsx's ErrorFallback - its
// generated preload-helper dispatches this event for every failed dynamic
// import() (which is what every React.lazy() route in App.tsx compiles
// to), independent of whether React happens to catch the rejection and
// surface it through the Sentry ErrorBoundary. Catching it here means a
// user often never sees the error screen at all - just a clean reload
// straight to the current deploy's working assets. Shares the same
// one-shot sessionStorage guard as the ErrorBoundary fallback so the two
// layers (whichever happens to fire first for a given failure) never
// compound into a reload loop.
window.addEventListener('vite:preloadError', () => {
  if (sessionStorage.getItem('eldermin_chunk_reload_attempted')) return;
  sessionStorage.setItem('eldermin_chunk_reload_attempted', '1');
  window.location.reload();
});

// App.tsx owns the single QueryClient (and its own QueryClientProvider) -
// a second one used to be created here too, nested one level further out.
// The inner one always wins for every actual query in the app, so this
// outer client/provider was dead weight that just disagreed with the real
// one on cache policy (30s staleTime here vs. 5min in App.tsx) - a trap
// for whoever next tried to tune caching and edited the wrong file.
const AppWithSentry = Sentry.withErrorBoundary(App, {
  fallback: ErrorFallback,
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <AppWithSentry />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            fontSize: '13px',
            borderRadius: '8px',
          },
        }}
      />
    </AuthProvider>
  </React.StrictMode>,
);

// The reload guard above is one-shot per stale-chunk *incident*, not per
// tab lifetime - a tab can easily stay open across more than one deploy
// in a workday. Once the app's been running cleanly for a while, clear it
// so a later, genuinely new stale-chunk event can still auto-recover
// instead of silently falling through to the error screen because of a
// guard flag set hours earlier for an unrelated deploy.
window.setTimeout(() => sessionStorage.removeItem('eldermin_chunk_reload_attempted'), 15000);
