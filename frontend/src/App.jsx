import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AuthLayout from './layouts/AuthLayout';
import MainLayout from './layouts/MainLayout';
import AnalysisPage from './pages/AnalysisPage';
import AnalyticsPage from './pages/AnalyticsPage';
import AssistantPage from './pages/AssistantPage';
import DashboardPage from './pages/DashboardPage';
import HistoryPage from './pages/HistoryPage';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RecommendationsPage from './pages/RecommendationsPage';
import ReportsPage from './pages/ReportsPage';
import ResultsPage from './pages/ResultsPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>
        <Route element={<MainLayout />}>
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
    </BrowserRouter>
  );
}
