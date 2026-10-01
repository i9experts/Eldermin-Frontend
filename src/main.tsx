import { initFrontendSentry, ErrorFallback } from './sentry.tsx';
import * as Sentry from '@sentry/react';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import './index.css';

initFrontendSentry();

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
