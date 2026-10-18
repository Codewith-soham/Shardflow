import { describe, it, expect, vi, beforeEach } from 'vitest';

import { buildApp } from '../app.js';
import type { AppConfig } from '../config/index.js';
import {
  PasswordResetService,
  type PasswordResetAuthClient,
  type PasswordResetAdminClient,
} from './password-reset.service.js';

const testConfig: AppConfig = {
  port: 3000,
  host: '127.0.0.1',
  nodeEnv: 'test',
  mongodbUri: 'mongodb://localhost:27017',
  mongodbDatabase: 'shardflow_test',
  supabaseUrl: 'https://test.supabase.co',
  supabaseAnonKey: 'test-anon-key',
};

describe('Password reset lifecycle', () => {
  let auth: PasswordResetAuthClient;
  let admin: PasswordResetAdminClient;
  let service: PasswordResetService;

  beforeEach(() => {
    auth = {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'sb_1', email: 'a@b.co' } }, error: null }),
      resetPasswordForEmail: vi.fn().mockResolvedValue({ data: {}, error: null }),
    };
    admin = {
      updateUserById: vi.fn().mockResolvedValue({ data: {}, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    };
    service = new PasswordResetService({ auth, admin, redirectTo: 'http://app/reset-password' });
  });

  const post = async (url: string, payload: unknown) => {
    const app = await buildApp(testConfig, { passwordResetService: service });
    return app.inject({ method: 'POST', url, payload: payload as object });
  };

  it('forgot-password returns 202 and requests a reset email with the redirect URL', async () => {
    const res = await post('/api/v1/auth/forgot-password', { email: 'User@Example.com' });
    expect(res.statusCode).toBe(202);
    expect(auth.resetPasswordForEmail).toHaveBeenCalledWith('user@example.com', {
      redirectTo: 'http://app/reset-password',
    });
  });

  it('forgot-password does not reveal unknown accounts', async () => {
    (auth.resetPasswordForEmail as any).mockResolvedValue({ data: null, error: { message: 'not found', status: 400 } });
    const res = await post('/api/v1/auth/forgot-password', { email: 'ghost@example.com' });
    expect(res.statusCode).toBe(202);
  });

  it('forgot-password rejects invalid emails', async () => {
    const res = await post('/api/v1/auth/forgot-password', { email: 'nope' });
    expect(res.statusCode).toBe(400);
    expect(auth.resetPasswordForEmail).not.toHaveBeenCalled();
  });

  it('forgot-password maps provider rate limiting to 429 and outages to 503', async () => {
    (auth.resetPasswordForEmail as any).mockResolvedValue({ data: null, error: { message: 'rate', status: 429 } });
    expect((await post('/api/v1/auth/forgot-password', { email: 'a@b.co' })).statusCode).toBe(429);

    (auth.resetPasswordForEmail as any).mockRejectedValue(new Error('network'));
    expect((await post('/api/v1/auth/forgot-password', { email: 'a@b.co' })).statusCode).toBe(503);
  });

  it('forgot-password throttles repeated requests from one client', async () => {
    const app = await buildApp(testConfig, { passwordResetService: service });
    const codes: number[] = [];
    for (let i = 0; i < 7; i++) {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/forgot-password',
        payload: { email: 'a@b.co' },
      });
      codes.push(res.statusCode);
    }
    expect(codes.slice(0, 5)).toEqual([202, 202, 202, 202, 202]);
    expect(codes[6]).toBe(429);
  });

  it('reset-password verifies the token, updates the password and revokes sessions', async () => {
    const res = await post('/api/v1/auth/reset-password', { accessToken: 'tok', password: 'new-secret-1' });
    expect(res.statusCode).toBe(200);
    expect(auth.getUser).toHaveBeenCalledWith('tok');
    expect(admin.updateUserById).toHaveBeenCalledWith('sb_1', { password: 'new-secret-1' });
    expect(admin.signOut).toHaveBeenCalledWith('tok', 'global');
  });

  it('reset-password rejects invalid tokens without touching the password', async () => {
    (auth.getUser as any).mockResolvedValue({ data: { user: null }, error: new Error('Invalid signature') });
    const res = await post('/api/v1/auth/reset-password', { accessToken: 'bad', password: 'new-secret-1' });
    expect(res.statusCode).toBe(401);
    expect(admin.updateUserById).not.toHaveBeenCalled();
  });

  it('reset-password rejects expired tokens', async () => {
    (auth.getUser as any).mockResolvedValue({ data: { user: null }, error: new Error('JWT expired') });
    const res = await post('/api/v1/auth/reset-password', { accessToken: 'old', password: 'new-secret-1' });
    expect(res.statusCode).toBe(401);
    expect(res.json().error.code).toBe('AUTH_TOKEN_EXPIRED');
  });

  it('reset-password enforces password length', async () => {
    const res = await post('/api/v1/auth/reset-password', { accessToken: 'tok', password: '123' });
    expect(res.statusCode).toBe(400);
    expect(admin.updateUserById).not.toHaveBeenCalled();
  });

  it('reset-password still succeeds if session revocation fails', async () => {
    (admin.signOut as any).mockRejectedValue(new Error('boom'));
    const res = await post('/api/v1/auth/reset-password', { accessToken: 'tok', password: 'new-secret-1' });
    expect(res.statusCode).toBe(200);
  });

  it('reset-password is unavailable (503) without the service-role admin client', async () => {
    service = new PasswordResetService({ auth });
    const res = await post('/api/v1/auth/reset-password', { accessToken: 'tok', password: 'new-secret-1' });
    expect(res.statusCode).toBe(503);
  });
});
