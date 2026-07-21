import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, Suspense, lazy } from 'react';
import React from 'react';
import { useAuthStore } from './store/authStore';
import ErrorBoundary from './components/ui/ErrorBoundary';
import LoadingSpinner from './components/ui/LoadingSpinner';

// ─── Layouts (loaded eagerly — needed for every route) ──────────────────────
import AppLayout    from './components/layout/AppLayout';
import AuthLayout   from './components/layout/AuthLayout';

// ─── Lazy-loaded pages ───────────────────────────────────────────────────────
const LandingPage           = lazy(() => import('./pages/LandingPage'));
const LoginPage             = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage          = lazy(() => import('./pages/auth/RegisterPage'));
const TwoFactorPage         = lazy(() => import('./pages/auth/TwoFactorPage'));
const DashboardPage         = lazy(() => import('./pages/DashboardPage'));
const CasesPage             = lazy(() => import('./pages/cases/CasesPage'));
const CaseDetailPage        = lazy(() => import('./pages/cases/CaseDetailPage'));
const NewCasePage           = lazy(() => import('./pages/cases/NewCasePage'));
const EvidencePage          = lazy(() => import('./pages/EvidencePage'));
const WitnessesPage         = lazy(() => import('./pages/WitnessesPage'));
const VictimsPage           = lazy(() => import('./pages/VictimsPage'));
const SuspectsPage          = lazy(() => import('./pages/SuspectsPage'));
const FIRAnalyzerPage       = lazy(() => import('./pages/FIRAnalyzerPage'));
const CaseFilingPage        = lazy(() => import('./pages/CaseFilingPage'));
const LegalProvisionPage    = lazy(() => import('./pages/LegalProvisionPage'));
const ChargesheetPage       = lazy(() => import('./pages/ChargesheetPage'));
const AIChatPage            = lazy(() => import('./pages/AIChatPage'));
const TimelinePage          = lazy(() => import('./pages/TimelinePage'));
const AdminPage             = lazy(() => import('./pages/AdminPage'));
const AnalyticsPage         = lazy(() => import('./pages/AnalyticsPage'));
const NotificationsPage     = lazy(() => import('./pages/NotificationsPage'));
const ProfilePage           = lazy(() => import('./pages/ProfilePage'));
const NotFoundPage          = lazy(() => import('./pages/NotFoundPage'));
const RiskAnalysisPage      = lazy(() => import('./pages/RiskAnalysisPage'));
const CourtCalendarPage     = lazy(() => import('./pages/CourtCalendarPage'));
const ReportsPage           = lazy(() => import('./pages/ReportsPage'));
const RelationshipGraphPage = lazy(() => import('./pages/RelationshipGraphPage'));

// ─── Route guards ────────────────────────────────────────────────────────────
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <>{children}</>;
}

// ─── Page fallback ───────────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <LoadingSpinner size="lg" />
    </div>
  );
}

// ─── Wrap page with ErrorBoundary + Suspense ─────────────────────────────────
function P(element: React.ReactNode, label: string) {
  return (
    <ErrorBoundary label={label}>
      <Suspense fallback={<PageLoader />}>
        {element}
      </Suspense>
    </ErrorBoundary>
  );
}

export default function App() {
  const { isAuthenticated, fetchMe } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) { fetchMe(); }
  }, [isAuthenticated, fetchMe]);

  return (
    <Routes>
      {/* Landing */}
      <Route path="/" element={P(<LandingPage />, 'Landing')} />

      {/* Auth */}
      <Route element={<AuthLayout />}>
        <Route path="/login"    element={<PublicRoute>{P(<LoginPage />,    'Login')}</PublicRoute>} />
        <Route path="/register" element={<PublicRoute>{P(<RegisterPage />, 'Register')}</PublicRoute>} />
        <Route path="/2fa"      element={P(<TwoFactorPage />, '2FA')} />
      </Route>

      {/* Protected */}
      <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
        <Route path="/dashboard" element={P(<DashboardPage />, 'Dashboard')} />

        {/* Cases */}
        <Route path="/cases"     element={P(<CasesPage />,    'Cases')} />
        <Route path="/cases/new" element={P(<NewCasePage />,  'New Case')} />
        <Route path="/cases/:id" element={P(<CaseDetailPage />, 'Case Detail')} />

        {/* Case sub-pages */}
        <Route path="/cases/:id/evidence"    element={P(<EvidencePage />,       'Evidence')} />
        <Route path="/cases/:id/witnesses"   element={P(<WitnessesPage />,      'Witnesses')} />
        <Route path="/cases/:id/victims"     element={P(<VictimsPage />,        'Victims')} />
        <Route path="/cases/:id/suspects"    element={P(<SuspectsPage />,       'Suspects')} />
        <Route path="/cases/:id/timeline"    element={P(<TimelinePage />,       'Timeline')} />
        <Route path="/cases/:id/chargesheet" element={P(<ChargesheetPage />,    'Chargesheet')} />
        <Route path="/cases/:id/legal"       element={P(<LegalProvisionPage />, 'Legal Provisions')} />

        {/* Standalone tools */}
        <Route path="/evidence"       element={P(<EvidencePage />,         'Evidence')} />
        <Route path="/suspects"       element={P(<SuspectsPage />,         'Suspects')} />
        <Route path="/witnesses"      element={P(<WitnessesPage />,        'Witnesses')} />
        <Route path="/victims"        element={P(<VictimsPage />,          'Victims')} />
        <Route path="/legal"          element={P(<LegalProvisionPage />,   'Legal Provisions')} />
        <Route path="/fir-analyzer"   element={P(<FIRAnalyzerPage />,      'FIR Analyzer')} />
        <Route path="/case-filing"    element={P(<CaseFilingPage />,       'Smart FIR')} />
        <Route path="/ai-chat"        element={P(<AIChatPage />,           'AI Assistant')} />
        <Route path="/analytics"      element={P(<AnalyticsPage />,        'Analytics')} />
        <Route path="/notifications"  element={P(<NotificationsPage />,    'Notifications')} />
        <Route path="/risk-analysis"  element={P(<RiskAnalysisPage />,     'Risk Analysis')} />
        <Route path="/court-calendar" element={P(<CourtCalendarPage />,    'Court Calendar')} />
        <Route path="/reports"        element={P(<ReportsPage />,          'Reports')} />
        <Route path="/graph"          element={P(<RelationshipGraphPage />, 'Crime Graph')} />
        <Route path="/admin"          element={P(<AdminPage />,            'Admin')} />
        <Route path="/profile"        element={P(<ProfilePage />,          'Profile')} />
      </Route>

      <Route path="*" element={P(<NotFoundPage />, '404')} />
    </Routes>
  );
}
