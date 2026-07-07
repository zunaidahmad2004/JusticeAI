import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';

// Layout
import AppLayout from './components/layout/AppLayout';
import AuthLayout from './components/layout/AuthLayout';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

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

  return (
    <Routes>
      {/* Landing Page - Completely Standalone */}
      <Route path="/" element={<LandingPage />} />

      {/* Auth Pages - Wrapped in AuthLayout */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      </Route>

      {/* Protected app routes */}
      <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* Cases */}
        <Route path="/cases" element={<CasesPage />} />
        <Route path="/cases/new" element={<NewCasePage />} />
        <Route path="/cases/:id" element={<CaseDetailPage />} />

        {/* Case sub-features */}
        <Route path="/cases/:id/evidence" element={<EvidencePage />} />
        <Route path="/cases/:id/witnesses" element={<WitnessesPage />} />
        <Route path="/cases/:id/victims" element={<VictimsPage />} />
        <Route path="/cases/:id/suspects" element={<SuspectsPage />} />
        <Route path="/cases/:id/timeline" element={<TimelinePage />} />
        <Route path="/cases/:id/chargesheet" element={<ChargesheetPage />} />
        <Route path="/cases/:id/legal" element={<LegalProvisionPage />} />

        {/* Standalone tools */}
        <Route path="/evidence" element={<EvidencePage />} />
        <Route path="/fir-analyzer" element={<FIRAnalyzerPage />} />
        <Route path="/case-filing" element={<CaseFilingPage />} />
        <Route path="/ai-chat" element={<AIChatPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/risk-analysis"   element={<RiskAnalysisPage />} />
        <Route path="/court-calendar"  element={<CourtCalendarPage />} />
        <Route path="/reports"         element={<ReportsPage />} />
        <Route path="/graph"           element={<RelationshipGraphPage />} />
        <Route path="/admin"           element={<AdminPage />} />
        <Route path="/profile"         element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
