import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import React from 'react';
import { useAuthStore } from './store/authStore';
import ErrorBoundary from './components/ui/ErrorBoundary';

// Layout
import AppLayout from './components/layout/AppLayout';
import AuthLayout from './components/layout/AuthLayout';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import TwoFactorPage from './pages/auth/TwoFactorPage';

// Landing
import LandingPage from './pages/LandingPage';

// Main pages
import DashboardPage from './pages/DashboardPage';
import CasesPage from './pages/cases/CasesPage';
import CaseDetailPage from './pages/cases/CaseDetailPage';
import NewCasePage from './pages/cases/NewCasePage';
import EvidencePage from './pages/EvidencePage';
import WitnessesPage from './pages/WitnessesPage';
import VictimsPage from './pages/VictimsPage';
import SuspectsPage from './pages/SuspectsPage';
import FIRAnalyzerPage from './pages/FIRAnalyzerPage';
import CaseFilingPage from './pages/CaseFilingPage';
import LegalProvisionPage from './pages/LegalProvisionPage';
import ChargesheetPage from './pages/ChargesheetPage';
import AIChatPage from './pages/AIChatPage';
import TimelinePage from './pages/TimelinePage';
import AdminPage from './pages/AdminPage';
import AnalyticsPage from './pages/AnalyticsPage';
import NotificationsPage from './pages/NotificationsPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';
import RiskAnalysisPage from './pages/RiskAnalysisPage';
import CourtCalendarPage from './pages/CourtCalendarPage';
import ReportsPage from './pages/ReportsPage';
import RelationshipGraphPage from './pages/RelationshipGraphPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <>{children}</>;
}

export default function App() {
  const { isAuthenticated, fetchMe } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      fetchMe();
    }
  }, [isAuthenticated, fetchMe]);

  /* ── Helper: wrap any page element with its own error boundary ─────── */
  const P = (element: React.ReactNode, label: string) => (
    <ErrorBoundary label={label}>{element}</ErrorBoundary>
  );

  return (
    <Routes>
      {/* Landing Page */}
      <Route path="/" element={P(<LandingPage />, 'Landing')} />

      {/* Auth Pages */}
      <Route element={<AuthLayout />}>
        <Route path="/login"    element={<PublicRoute>{P(<LoginPage />,     'Login')}</PublicRoute>} />
        <Route path="/register" element={<PublicRoute>{P(<RegisterPage />,  'Register')}</PublicRoute>} />
        <Route path="/2fa"      element={P(<TwoFactorPage />, '2FA')} />
      </Route>

      {/* Protected app routes */}
      <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
        <Route path="/dashboard" element={P(<DashboardPage />, 'Dashboard')} />

        {/* Cases */}
        <Route path="/cases"       element={P(<CasesPage />,    'Cases')} />
        <Route path="/cases/new"   element={P(<NewCasePage />,  'New Case')} />
        <Route path="/cases/:id"   element={P(<CaseDetailPage />, 'Case Detail')} />

        {/* Case sub-features */}
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
        <Route path="/graph"          element={P(<RelationshipGraphPage />,'Crime Graph')} />
        <Route path="/admin"          element={P(<AdminPage />,            'Admin')} />
        <Route path="/profile"        element={P(<ProfilePage />,          'Profile')} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
