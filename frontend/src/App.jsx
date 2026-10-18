import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, ProtectedRoute } from './context/AuthContext';
import AuthLayout from './layouts/AuthLayout';
import MainLayout from './layouts/MainLayout';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const AnalysisPage = lazy(() => import('./pages/AnalysisPage'));
const ResultsPage = lazy(() => import('./pages/ResultsPage'));
const RecommendationsPage = lazy(() => import('./pages/RecommendationsPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const HistoryPage = lazy(() => import('./pages/HistoryPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const AssistantPage = lazy(() => import('./pages/AssistantPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

function PageLoader() {
  return (
    <div
      className="flex min-h-[50vh] items-center justify-center bg-slate-50 dark:bg-slate-950"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
        <span
          className="h-5 w-5 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600"
          aria-hidden="true"
        />
        Loading WebIntel…
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />

            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>

            <Route
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/analyze" element={<AnalysisPage />} />
              <Route path="/results/:id" element={<ResultsPage />} />
              <Route path="/recommendations/:id" element={<RecommendationsPage />} />
              <Route path="/analytics/:id" element={<AnalyticsPage />} />
              <Route path="/history/:websiteId" element={<HistoryPage />} />
              <Route path="/reports/:id" element={<ReportsPage />} />
              <Route path="/assistant/:id" element={<AssistantPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
