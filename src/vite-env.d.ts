/// <reference types="vite/client" />

// Injected by vite.config.ts's `define` at build time - see the
// getBuildCommit() comment there for why this is safe to trust in
// production builds (Vercel always builds from a fresh git checkout).
declare const __BUILD_COMMIT__: string
declare const __BUILD_TIME__: string
