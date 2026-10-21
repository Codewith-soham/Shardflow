import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { LandingPage } from '@/features/landing/pages/LandingPage';
import { SignInPage } from '@/features/auth/pages/SignInPage';
import { SignUpPage } from '@/features/auth/pages/SignUpPage';
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '@/features/auth/pages/ResetPasswordPage';
import { OverviewPage } from '@/features/projects/pages/OverviewPage';
import { ProjectsPage } from '@/features/projects/pages/ProjectsPage';
import { ShardsPage } from '@/features/shards/pages/ShardsPage';
import { ShardDetailPage } from '@/features/shards/pages/ShardDetailPage';
import { RoutingPage } from '@/features/routing/pages/RoutingPage';
import { ApiKeysPage } from '@/features/api-keys/pages/ApiKeysPage';
import { HealthPage } from '@/features/health/pages/HealthPage';
import { ActivityPage } from '@/features/activity/pages/ActivityPage';
import { IntegrationPage } from '@/features/integration/pages/IntegrationPage';
import { SettingsPage } from '@/features/settings/pages/SettingsPage';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Layers } from 'lucide-react';

// Protected Route Guard
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050807] flex items-center justify-center text-emerald-400 font-mono text-sm">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-800/80 p-0.5 flex items-center justify-center glow-emerald">
            <div className="w-full h-full bg-[#06100B] rounded-lg flex items-center justify-center">
              <Layers className="w-5 h-5 text-emerald-400 animate-pulse" />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs font-semibold text-emerald-300">Authenticating control plane session...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/sign-up" element={<SignUpPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Protected Application Dashboard Routes */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/app/overview" replace />} />
          <Route path="overview" element={<OverviewPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="shards" element={<ShardsPage />} />
          <Route path="shards/:shardId" element={<ShardDetailPage />} />
          <Route path="routing" element={<RoutingPage />} />
          <Route path="api-keys" element={<ApiKeysPage />} />
          <Route path="health" element={<HealthPage />} />
          <Route path="activity" element={<ActivityPage />} />
          <Route path="integration" element={<IntegrationPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
