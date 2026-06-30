import * as Sentry from '@sentry/react';

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

export const ErrorFallback = ({ error, resetError }: any) => (
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
