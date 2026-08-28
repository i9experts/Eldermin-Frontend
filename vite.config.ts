import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { execSync } from 'child_process'

// Deploy-version visibility (mirrors the backend's GET /health): stamp the
// build with the commit it was built from and when, so anyone - a school
// admin testing a fix, a future Claude session - can visually confirm what
// is actually live without shell access. Vercel checks out the repo fresh
// for every build and runs `npm run build`, so `git rev-parse` here always
// reflects the commit being deployed. Falls back gracefully if git isn't
// available (e.g. a build from a tarball with no .git directory).
function getBuildCommit(): string {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim()
  } catch {
    return 'unknown'
  }
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  base: '/',
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: ['eldermin.com', 'www.eldermin.com', 'localhost', 'all'],
  },
  build: {
    outDir: 'dist',
  },
  define: {
    __BUILD_COMMIT__: JSON.stringify(getBuildCommit()),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
})
