import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { LandingPage } from '@/features/landing/pages/LandingPage';

// Protected Route Guard
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center text-zinc-400 font-mono text-sm">
        <div className="flex items-center space-x-3">
          <div className="w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin"></div>
          <span>Authenticating session...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/sign-in" replace />;
  }

  return <>{children}</>;
}

// Placeholder Page Wrapper for Router initialization test
function TempPlaceholder({ title }: { title: string }) {
  return (
    <div className="p-8 text-zinc-200">
      <h1 className="text-xl font-semibold mb-2">{title}</h1>
      <p className="text-sm text-zinc-400 font-mono">Module route placeholder ready for implementation.</p>
    </div>
  );
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/sign-in" element={<TempPlaceholder title="Sign In" />} />
        <Route path="/sign-up" element={<TempPlaceholder title="Sign Up" />} />
        <Route path="/forgot-password" element={<TempPlaceholder title="Forgot Password" />} />
        <Route path="/reset-password" element={<TempPlaceholder title="Reset Password" />} />

        {/* Protected Dashboard Application Routes */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <Navigate to="/app/overview" replace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/overview"
          element={
            <ProtectedRoute>
              <TempPlaceholder title="Dashboard Overview" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/projects"
          element={
            <ProtectedRoute>
              <TempPlaceholder title="Project Management" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/shards"
          element={
            <ProtectedRoute>
              <TempPlaceholder title="Shard Registry" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/shards/:shardId"
          element={
            <ProtectedRoute>
              <TempPlaceholder title="Shard Detail" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/routing"
          element={
            <ProtectedRoute>
              <TempPlaceholder title="Tenant Routing Mappings" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/api-keys"
          element={
            <ProtectedRoute>
              <TempPlaceholder title="API Keys" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/health"
          element={
            <ProtectedRoute>
              <TempPlaceholder title="Shard Health Monitor" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/activity"
          element={
            <ProtectedRoute>
              <TempPlaceholder title="Activity Log" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/integration"
          element={
            <ProtectedRoute>
              <TempPlaceholder title="Developer Integration" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/settings"
          element={
            <ProtectedRoute>
              <TempPlaceholder title="Settings" />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
