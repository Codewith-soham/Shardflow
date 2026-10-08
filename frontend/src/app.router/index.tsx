import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';

// Feature Pages & Layout Imports
import { LandingPage } from '@/features/landing/pages/LandingPage';
import { SignInPage } from '@/features/auth/pages/SignInPage';
import { SignUpPage } from '@/features/auth/pages/SignUpPage';
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '@/features/auth/pages/ResetPasswordPage';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
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

// Protected Route Guard
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050807] flex items-center justify-center text-zinc-400 font-mono text-sm">
        <div className="flex items-center space-x-3">
          <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
          <span>Authenticating ShardFlow session...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/sign-in" replace />;
  }

  return <>{children}</>;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Marketing & Auth Routes */}
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
