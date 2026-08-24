import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import Layout from '@/components/layout/Layout'
import LayoutProtectedRoute from '@/components/layout/ProtectedRoute'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import Login from '@/pages/auth/Login'
import ResetPassword from '@/pages/auth/ResetPassword'
import ModuleMarketplace from '@/pages/marketplace/index'
import InstitutionSetup from '@/pages/institution'
import GovernancePage from '@/pages/governance'
import DocumentsPage from '@/pages/documents'
import HRPage from '@/pages/hr'
import TeachingPage from '@/pages/teaching'
import EarlyYearsPage from '@/pages/early-years'
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
import ProfilePage from './pages/profile/index'
import RolesPage from './pages/roles/index'
import UnauthorizedPage from './pages/UnauthorizedPage'
import SetupWizard from '@/pages/setup-wizard/index'
import ReportTemplatesList from '@/pages/report-templates/index'
import ReportTemplatesDesigner from '@/pages/report-templates/designer'
import ResellerPortalLogin from '@/pages/reseller-portal/Login'
import ResellerPortalDashboard from '@/pages/reseller-portal/Dashboard'
import RequireResellerAuth from '@/pages/reseller-portal/RequireResellerAuth'

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
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Eldermin Partner Network — Reseller Portal v1. Deliberately
              outside the tenant/Super-Admin <Layout> subtree below: a
              partner has no school tenant, so none of that chrome
              (sidebar, academic year switcher, etc.) applies to them. */}
          <Route path="/partner/login" element={<ResellerPortalLogin />} />
          <Route element={<RequireResellerAuth />}>
            <Route path="/partner" element={<ResellerPortalDashboard />} />
          </Route>
          <Route element={<LayoutProtectedRoute />}>
            <Route path="/setup-wizard" element={<SetupWizard />} />
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<HomeDashboard />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/roles" element={
                <ProtectedRoute permission="institution:manage">
                  <RolesPage />
                </ProtectedRoute>
              } />
              <Route path="/apps" element={
                <ProtectedRoute permission="apps:view">
                  <ModuleMarketplace />
                </ProtectedRoute>
              } />
              <Route path="/institution" element={
                <ProtectedRoute permission="institution:view">
                  <InstitutionSetup />
                </ProtectedRoute>
              } />
              <Route path="/governance" element={
                <ProtectedRoute permission="governance:view">
                  <GovernancePage />
                </ProtectedRoute>
              } />
              <Route path="/documents" element={
                <ProtectedRoute permission="documents:view">
                  <DocumentsPage />
                </ProtectedRoute>
              } />
              <Route path="/hr" element={
                <ProtectedRoute permission="hr:view">
                  <HRPage />
                </ProtectedRoute>
              } />
              <Route path="/teaching" element={
                <ProtectedRoute permission="teaching:view">
                  <TeachingPage />
                </ProtectedRoute>
              } />
              <Route path="/early-years" element={
                <ProtectedRoute permission="early-years:view">
                  <EarlyYearsPage />
                </ProtectedRoute>
              } />
              <Route path="/finance" element={
                <ProtectedRoute permission="finance:view">
                  <FinancePage />
                </ProtectedRoute>
              } />
              <Route path="/procurement" element={
                <ProtectedRoute permission="procurement:view">
                  <ProcurementPage />
                </ProtectedRoute>
              } />
              <Route path="/campus" element={
                <ProtectedRoute permission="campus:view">
                  <CampusPage />
                </ProtectedRoute>
              } />
              <Route path="/admissions" element={
                <ProtectedRoute permission="admissions:view">
                  <AdmissionsPage />
                </ProtectedRoute>
              } />
              <Route path="/students" element={
                <ProtectedRoute permission="students:view">
                  <StudentsPage />
                </ProtectedRoute>
              } />
              <Route path="/students/:id" element={
                <ProtectedRoute permission="students:view">
                  <StudentProfile />
                </ProtectedRoute>
              } />
              <Route path="/hr/staff/:id" element={
                <ProtectedRoute permission="hr:view">
                  <StaffProfile />
                </ProtectedRoute>
              } />
              <Route path="/assessments" element={
                <ProtectedRoute permission="assessments:view">
                  <AssessmentModule />
                </ProtectedRoute>
              } />
              <Route path="/academics" element={
                <ProtectedRoute permission="academics:view">
                  <AcademicsPage />
                </ProtectedRoute>
              } />
              <Route path="/academics/*" element={
                <ProtectedRoute permission="academics:view">
                  <AcademicsPage />
                </ProtectedRoute>
              } />
              <Route path="/behaviour" element={
                <ProtectedRoute permission="behaviour:view">
                  <BehaviourModule />
                </ProtectedRoute>
              } />
              <Route path="/analytics" element={
                <ProtectedRoute permission="analytics:view">
                  <AnalyticsDashboard />
                </ProtectedRoute>
              } />
              <Route path="/super-admin" element={
                <ProtectedRoute permission="super_admin:view">
                  <SuperAdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/curriculum" element={
                <ProtectedRoute permission="academics:view">
                  <AcademicsPage />
                </ProtectedRoute>
              } />
              <Route path="/curriculum/*" element={
                <ProtectedRoute permission="academics:view">
                  <AcademicsPage />
                </ProtectedRoute>
              } />
              <Route path="/syllabus" element={
                <ProtectedRoute permission="academics:view">
                  <AcademicsPage />
                </ProtectedRoute>
              } />
              <Route path="/syllabus/*" element={
                <ProtectedRoute permission="academics:view">
                  <AcademicsPage />
                </ProtectedRoute>
              } />
              <Route path="/timetable" element={
                <ProtectedRoute permission="academics:view">
                  <AcademicsPage />
                </ProtectedRoute>
              } />
              <Route path="/timetable/*" element={
                <ProtectedRoute permission="academics:view">
                  <AcademicsPage />
                </ProtectedRoute>
              } />
              <Route path="/library" element={
                <ProtectedRoute permission="academics:view">
                  <AcademicsPage />
                </ProtectedRoute>
              } />
              <Route path="/library/*" element={
                <ProtectedRoute permission="academics:view">
                  <AcademicsPage />
                </ProtectedRoute>
              } />
              <Route path="/report-templates" element={
                <ProtectedRoute permission="report-templates:view">
                  <ReportTemplatesList />
                </ProtectedRoute>
              } />
              <Route path="/report-templates/designer/:id" element={
                <ProtectedRoute permission="report-templates:manage">
                  <ReportTemplatesDesigner />
                </ProtectedRoute>
              } />
              <Route path="/" element={<HomeDashboard />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
