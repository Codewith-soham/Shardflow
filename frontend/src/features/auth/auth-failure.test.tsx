import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// Only the external Supabase client is faked. AuthProvider, ProtectedRoute, SignInPage
// and the API client below are the real application code.
const supabaseAuth = vi.hoisted(() => ({
  getSession: vi.fn(),
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChange: vi.fn(),
}));

vi.mock('@/lib/supabase/client', () => ({ supabase: { auth: supabaseAuth } }));

import { AuthProvider, useAuth } from '@/app/providers/AuthProvider';
import { ProtectedRoute } from '@/app/router';
import { SignInPage } from '@/features/auth/pages/SignInPage';
import { apiClient } from '@/lib/api/client';

const SECRET_FREE_SESSION = {
  access_token: 'test-access-token',
  user: { id: 'user-1', email: 'user@example.com' },
};

function renderSignIn() {
  return render(
    <MemoryRouter initialEntries={['/sign-in']}>
      <Routes>
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/app/overview" element={<div>PROTECTED DASHBOARD</div>} />
      </Routes>
    </MemoryRouter>
  );
}

async function submitCredentials() {
  const user = userEvent.setup();
  await user.type(screen.getByPlaceholderText('admin@organization.com'), 'user@example.com');
  await user.type(screen.getByPlaceholderText('••••••••••••'), 'not-a-real-password');
  await user.click(screen.getByRole('button', { name: /sign in to control plane/i }));
}

function storageHoldsNoSession() {
  const all = JSON.stringify({ ...localStorage }) + JSON.stringify({ ...sessionStorage });
  expect(all).not.toMatch(/demo/i);
  expect(localStorage.length).toBe(0);
  expect(sessionStorage.length).toBe(0);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  supabaseAuth.getSession.mockResolvedValue({ data: { session: null } });
  supabaseAuth.onAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } },
  });
});

describe('sign-in when Supabase fails', () => {
  it('shows an error and never signs in when the auth service is unreachable', async () => {
    supabaseAuth.signInWithPassword.mockRejectedValue(new Error('network down'));
    renderSignIn();

    await submitCredentials();

    expect(await screen.findByText(/unable to reach the authentication service/i)).toBeInTheDocument();
    expect(screen.queryByText('PROTECTED DASHBOARD')).not.toBeInTheDocument();
    storageHoldsNoSession();
  });

  it('shows the provider error and never signs in on rejected credentials', async () => {
    supabaseAuth.signInWithPassword.mockResolvedValue({
      data: { session: null },
      error: { message: 'Invalid login credentials' },
    });
    renderSignIn();

    await submitCredentials();

    expect(await screen.findByText('Invalid login credentials')).toBeInTheDocument();
    expect(screen.queryByText('PROTECTED DASHBOARD')).not.toBeInTheDocument();
    storageHoldsNoSession();
  });

  it('does not sign in when the provider returns no session', async () => {
    supabaseAuth.signInWithPassword.mockResolvedValue({ data: { session: null }, error: null });
    renderSignIn();

    await submitCredentials();

    expect(await screen.findByText(/no session was created/i)).toBeInTheDocument();
    expect(screen.queryByText('PROTECTED DASHBOARD')).not.toBeInTheDocument();
    storageHoldsNoSession();
  });

  it('only navigates into the app when a real session is returned', async () => {
    supabaseAuth.signInWithPassword.mockResolvedValue({
      data: { session: SECRET_FREE_SESSION },
      error: null,
    });
    renderSignIn();

    await submitCredentials();

    expect(await screen.findByText('PROTECTED DASHBOARD')).toBeInTheDocument();
  });
});

describe('session bootstrap when Supabase fails', () => {
  function Probe() {
    const { user, isLoading } = useAuth();
    return <div>{isLoading ? 'loading' : user ? 'signed-in' : 'signed-out'}</div>;
  }

  it('resolves to signed-out (not a fabricated user) when getSession rejects', async () => {
    supabaseAuth.getSession.mockRejectedValue(new Error('network down'));

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    expect(await screen.findByText('signed-out')).toBeInTheDocument();
    storageHoldsNoSession();
  });

  it('redirects protected routes to sign-in when getSession rejects', async () => {
    supabaseAuth.getSession.mockRejectedValue(new Error('network down'));

    render(
      <MemoryRouter initialEntries={['/app/overview']}>
        <AuthProvider>
          <Routes>
            <Route path="/sign-in" element={<div>SIGN IN PAGE</div>} />
            <Route
              path="/app/overview"
              element={
                <ProtectedRoute>
                  <div>PROTECTED DASHBOARD</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText('SIGN IN PAGE')).toBeInTheDocument();
    expect(screen.queryByText('PROTECTED DASHBOARD')).not.toBeInTheDocument();
  });

  it('renders protected content for a genuine session', async () => {
    supabaseAuth.getSession.mockResolvedValue({ data: { session: SECRET_FREE_SESSION } });

    render(
      <MemoryRouter initialEntries={['/app/overview']}>
        <AuthProvider>
          <Routes>
            <Route path="/sign-in" element={<div>SIGN IN PAGE</div>} />
            <Route
              path="/app/overview"
              element={
                <ProtectedRoute>
                  <div>PROTECTED DASHBOARD</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('PROTECTED DASHBOARD')).toBeInTheDocument());
  });
});

describe('API client credentials', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: { ok: true } }),
    });
    vi.stubGlobal('fetch', fetchMock);
  });

  const sentAuthHeader = () => fetchMock.mock.calls[0]![1].headers['Authorization'];

  it('sends the real Supabase access token', async () => {
    supabaseAuth.getSession.mockResolvedValue({ data: { session: SECRET_FREE_SESSION } });

    await apiClient('/me');

    expect(sentAuthHeader()).toBe('Bearer test-access-token');
  });

  it('sends no Authorization header (and no fabricated token) when getSession fails', async () => {
    supabaseAuth.getSession.mockRejectedValue(new Error('network down'));

    await apiClient('/me');

    expect(sentAuthHeader()).toBeUndefined();
  });

  it('sends no Authorization header when there is no session', async () => {
    await apiClient('/me');

    expect(sentAuthHeader()).toBeUndefined();
  });
});

describe('no demo-auth fallback in the frontend source', () => {
  function sourceFiles(dir: string): string[] {
    return readdirSync(dir).flatMap((entry) => {
      const path = join(dir, entry);
      if (statSync(path).isDirectory()) return sourceFiles(path);
      return /\.(ts|tsx)$/.test(entry) && !/\.test\.tsx?$/.test(entry) ? [path] : [];
    });
  }

  it('contains no demo user storage key or demo_ bearer token construction', () => {
    const offenders = sourceFiles(join(process.cwd(), 'src')).filter((file) =>
      /shardflow_demo_user|demo_\$\{|`demo_|'demo_|"demo_/.test(readFileSync(file, 'utf8'))
    );

    expect(offenders).toEqual([]);
  });
});
