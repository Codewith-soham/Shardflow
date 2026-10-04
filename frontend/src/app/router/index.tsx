import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { LandingPage } from '@/features/landing/pages/LandingPage';
import { SignInPage } from '@/features/auth/pages/SignInPage';
import { SignUpPage } from '@/features/auth/pages/SignUpPage';
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '@/features/auth/pages/ResetPasswordPage';
import { OverviewPage } from '@/features/projects/pages/OverviewPage';
import { ProjectsPage } from '@/features/projects/pages/ProjectsPage';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Layers, Activity, Server, ShieldCheck, ArrowRight } from 'lucide-react';

// Protected Route Guard
function ProtectedRoute({ children }: { children: React.ReactNode }) {
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

// Module Placeholder Page with obsidian & emerald design language
function TempPlaceholder({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-[#06100B] border border-emerald-900/60 shadow-xl relative overflow-hidden">
        <div className="pointer-events-none absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-2xl" />
        <div className="flex items-start justify-between relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800/60 text-[10px] font-mono text-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span>Module Initialized</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
            <p className="text-xs text-zinc-400 max-w-xl">{description}</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-emerald-400 hidden sm:block">
            <Server className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-[#06100B] border border-emerald-950 flex items-center space-x-3">
          <Activity className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <div className="text-[11px] font-mono text-zinc-400">Data Pipeline</div>
            <div className="text-xs font-semibold text-zinc-200">Active Shard Mesh</div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-[#06100B] border border-emerald-950 flex items-center space-x-3">
          <ShieldCheck className="w-5 h-5 text-teal-400 shrink-0" />
          <div>
            <div className="text-[11px] font-mono text-zinc-400">Security Scope</div>
            <div className="text-xs font-semibold text-zinc-200">Project-Isolated</div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-[#06100B] border border-emerald-950 flex items-center space-x-3">
          <ArrowRight className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <div className="text-[11px] font-mono text-zinc-400">Phase Status</div>
            <div className="text-xs font-semibold text-emerald-300">Phase F5 Ready</div>
          </div>
        </div>
      </div>
    </div>
  );
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
          <Route
            path="shards"
            element={
              <TempPlaceholder
                title="Shard Registry"
                description="Register, inspect, and configure backend MongoDB target shards across infrastructure."
              />
            }
          />
          <Route
            path="shards/:shardId"
            element={
              <TempPlaceholder
                title="Shard Detail"
                description="View specific shard connection parameters, admin status, and health history."
              />
            }
          />
          <Route
            path="routing"
            element={
              <TempPlaceholder
                title="Tenant Routing Mappings"
                description="Configure explicit tenant-to-shard mapping rules and default fallback assignments."
              />
            }
          />
          <Route
            path="api-keys"
            element={
              <TempPlaceholder
                title="API Keys"
                description="Generate, inspect, and revoke project API keys used by developer client applications."
              />
            }
          />
          <Route
            path="health"
            element={
              <TempPlaceholder
                title="Shard Health Monitor"
                description="Real-time shard connection pinging, availability status tracking, and latency diagnostics."
              />
            }
          />
          <Route
            path="activity"
            element={
              <TempPlaceholder
                title="Activity Log"
                description="Audit trail of administrative actions, shard modifications, and security events."
              />
            }
          />
          <Route
            path="integration"
            element={
              <TempPlaceholder
                title="Developer Integration Guide"
                description="SDK usage snippets, HTTP header specifications, and API documentation for applications."
              />
            }
          />
          <Route
            path="settings"
            element={
              <TempPlaceholder
                title="Account Settings"
                description="Manage control plane profile, authentication credentials, and system preferences."
              />
            }
          />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
