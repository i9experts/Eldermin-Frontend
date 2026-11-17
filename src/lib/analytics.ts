// Thin wrapper around the GA4 gtag() global, loaded conditionally by
// index.html only when VITE_GA4_MEASUREMENT_ID is set at build time. Every
// call here is a safe no-op when GA isn't configured (local dev, or any
// deploy that hasn't set the env var) - never throws, never assumes the
// script loaded.
export function trackPageView(path: string) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag('event', 'page_view', { page_path: path });
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}
