import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Layout from '@/components/layout/Layout'
import ProtectedRoute from '@/components/layout/ProtectedRoute'
import Login from '@/pages/auth/Login'
import Dashboard from '@/pages/dashboard/Dashboard'
import AppsMarketplace from '@/pages/apps/AppsMarketplace'
import InstitutionSetup from '@/pages/institution'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, retry: 1 },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/apps" element={<AppsMarketplace />} />
              <Route path="/institution" element={<InstitutionSetup />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
