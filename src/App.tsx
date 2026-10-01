import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import Layout from '@/components/layout/Layout'
import LayoutProtectedRoute from '@/components/layout/ProtectedRoute'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import RouteLoading from '@/components/layout/RouteLoading'

// Every page below used to be a plain static `import X from '...'` - Vite
// has no way to split a statically-imported module out of the entry
// chunk, so ALL of these (HR at 10k lines, Finance at 8.5k, Academics,
// Students, every other module) were bundled into one ~4.3MB/~1MB-gzip
// JS file that had to fully download, parse and execute before ANYTHING
// rendered - including the login screen for a user who hasn't even
// authenticated yet. On a slow connection or an older school-office PC
// that is indistinguishable from "the tab won't even open", which is
// exactly what schools were reporting. lazy() + Suspense (below) makes
// each route its own chunk, fetched only when actually visited.
const Login = lazy(() => import('@/pages/auth/Login'))
const ResetPassword = lazy(() => import('@/pages/auth/ResetPassword'))
const ModuleMarketplace = lazy(() => import('@/pages/marketplace/index'))
const InstitutionSetup = lazy(() => import('@/pages/institution'))
const GovernancePage = lazy(() => import('@/pages/governance'))
const DocumentsPage = lazy(() => import('@/pages/documents'))
const HRPage = lazy(() => import('@/pages/hr'))
const TeachingPage = lazy(() => import('@/pages/teaching'))
const MyLeavePage = lazy(() => import('@/pages/my-leave'))
const EarlyYearsPage = lazy(() => import('@/pages/early-years'))
const FinancePage = lazy(() => import('@/pages/finance'))
const ProcurementPage = lazy(() => import('@/pages/procurement'))
const CampusPage = lazy(() => import('@/pages/campus'))
const SchoolCalendarPage = lazy(() => import('@/pages/school-calendar'))
const AdmissionsPage = lazy(() => import('@/pages/admissions'))
const StudentsPage = lazy(() => import('@/pages/students'))
const StudentProfile = lazy(() => import('@/pages/students/StudentProfile'))
const StaffProfile = lazy(() => import('@/pages/hr/StaffProfile'))
const AcademicsPage = lazy(() => import('@/pages/academics/index'))
const AssessmentModule = lazy(() => import('@/pages/assessments/index'))
const BehaviourModule = lazy(() => import('@/pages/behaviour/index'))
const AnalyticsDashboard = lazy(() => import('./pages/analytics/index'))
const SuperAdminDashboard = lazy(() => import('./pages/super-admin/index'))
const HomeDashboard = lazy(() => import('./pages/home/index'))
const ProfilePage = lazy(() => import('./pages/profile/index'))
const RolesPage = lazy(() => import('./pages/roles/index'))
const UnauthorizedPage = lazy(() => import('./pages/UnauthorizedPage'))
const SetupWizard = lazy(() => import('@/pages/setup-wizard/index'))
const ReportTemplatesList = lazy(() => import('@/pages/report-templates/index'))
const ReportTemplatesDesigner = lazy(() => import('@/pages/report-templates/designer'))
const IdCardTemplatesPage = lazy(() => import('@/pages/id-card-templates/index'))
const CertificateTemplatesPage = lazy(() => import('@/pages/certificate-templates/index'))
const KnowledgeBasePage = lazy(() => import('@/pages/knowledge-base/index'))
const ResellerPortalLogin = lazy(() => import('@/pages/reseller-portal/Login'))
const ResellerPortalDashboard = lazy(() => import('@/pages/reseller-portal/Dashboard'))
const RequireResellerAuth = lazy(() => import('@/pages/reseller-portal/RequireResellerAuth'))
const EventsListTab = lazy(() => import('@/pages/events/EventsListTab'))
const EventDetailPage = lazy(() => import('@/pages/events/EventDetailPage'))
const EventKioskPage = lazy(() => import('@/pages/events/EventKioskPage'))
const EventPublicPage = lazy(() => import('@/pages/events/public/EventPublicPage'))
const ESignPublicPage = lazy(() => import('@/pages/documents/ESignPublicPage'))

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
        <Suspense fallback={<RouteLoading />}>
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

          {/* Public Event page — no auth, no tenant chrome. A prospective
              attendee (parent, alumnus, community member) opens this link
              directly, so it lives outside LayoutProtectedRoute same as
              /partner/login above. */}
          <Route path="/e/:schoolSlug/:eventSlug" element={<EventPublicPage />} />
          {/* Public e-signature recipient page - a recipient may have no
              account at all, same reasoning as the event public page above. */}
          <Route path="/e-sign/:token" element={<ESignPublicPage />} />
          <Route element={<LayoutProtectedRoute />}>
            <Route path="/setup-wizard" element={<SetupWizard />} />
            {/* Kiosk (door-entry) mode - deliberately outside <Layout> below,
                same reasoning as /setup-wizard: a tablet propped at a gate
                needs a fullscreen scan target, not the admin sidebar. */}
            <Route path="/events/:id/kiosk" element={<EventKioskPage />} />
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<HomeDashboard />} />
              <Route path="/profile" element={<ProfilePage />} />
              {/* Help content, open to any authenticated user - no permission gate,
                  same as /profile above */}
              <Route path="/knowledge-base" element={<KnowledgeBasePage />} />
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
              <Route path="/my-leave" element={
                <ProtectedRoute permission="leave:self">
                  <MyLeavePage />
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
              <Route path="/school-calendar" element={
                <ProtectedRoute permission="school-calendar:view">
                  <SchoolCalendarPage />
                </ProtectedRoute>
              } />
              <Route path="/events" element={
                <ProtectedRoute permission="events:view">
                  <EventsListTab />
                </ProtectedRoute>
              } />
              <Route path="/events/:id" element={
                <ProtectedRoute permission="events:view">
                  <EventDetailPage />
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
              <Route path="/id-card-templates" element={
                <ProtectedRoute permission="report-templates:view">
                  <IdCardTemplatesPage />
                </ProtectedRoute>
              } />
              <Route path="/certificate-templates" element={
                <ProtectedRoute permission="report-templates:view">
                  <CertificateTemplatesPage />
                </ProtectedRoute>
              } />
              <Route path="/" element={<HomeDashboard />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
