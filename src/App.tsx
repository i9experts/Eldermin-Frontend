import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import Layout from '@/components/layout/Layout'
import ProtectedRoute from '@/components/layout/ProtectedRoute'
import Login from '@/pages/auth/Login'
import AppsMarketplace from '@/pages/apps/AppsMarketplace'
import InstitutionSetup from '@/pages/institution'
import GovernancePage from '@/pages/governance'
import DocumentsPage from '@/pages/documents'
import HRPage from '@/pages/hr'
import TeachingPage from '@/pages/teaching'
import FinancePage from '@/pages/finance'
import ProcurementPage from '@/pages/procurement'
import CampusPage from '@/pages/campus'
import AdmissionsPage from '@/pages/admissions'
import StudentsPage from '@/pages/students'
import StudentProfile from '@/pages/students/StudentProfile'
import StaffProfile from '@/pages/hr/StaffProfile'
import AcademicsPage from '@/pages/academics/index'
import AssessmentModule from '@/pages/assessments/index'
import BehaviourModule from '@/pages/behaviour/index'
import AnalyticsDashboard from './pages/analytics/index'
import SuperAdminDashboard from './pages/super-admin/index'
import HomeDashboard from './pages/home/index'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, retry: 1 },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<HomeDashboard />} />
              <Route path="/apps" element={<AppsMarketplace />} />
              <Route path="/institution" element={<InstitutionSetup />} />
              <Route path="/governance" element={<GovernancePage />} />
              <Route path="/documents" element={<DocumentsPage />} />
              <Route path="/hr" element={<HRPage />} />
              <Route path="/teaching" element={<TeachingPage />} />
              <Route path="/finance" element={<FinancePage />} />
              <Route path="/procurement" element={<ProcurementPage />} />
              <Route path="/campus" element={<CampusPage />} />
              <Route path="/admissions" element={<AdmissionsPage />} />
              <Route path="/students" element={<StudentsPage />} />
              <Route path="/students/:id" element={<StudentProfile />} />
              <Route path="/hr/staff/:id" element={<StaffProfile />} />
              <Route path="/assessments" element={<AssessmentModule />} />
              <Route path="/academics" element={<AcademicsPage />} />
              <Route path="/academics/*" element={<AcademicsPage />} />
              <Route path="/behaviour" element={<BehaviourModule />} />
              <Route path="/analytics" element={<AnalyticsDashboard />} />
              <Route path="/super-admin" element={<SuperAdminDashboard />} />
              <Route path="/curriculum" element={<AcademicsPage />} />
              <Route path="/curriculum/*" element={<AcademicsPage />} />
              <Route path="/syllabus" element={<AcademicsPage />} />
              <Route path="/syllabus/*" element={<AcademicsPage />} />
              <Route path="/timetable" element={<AcademicsPage />} />
              <Route path="/timetable/*" element={<AcademicsPage />} />
              <Route path="/library" element={<AcademicsPage />} />
              <Route path="/library/*" element={<AcademicsPage />} />
              <Route path="/" element={<HomeDashboard />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
