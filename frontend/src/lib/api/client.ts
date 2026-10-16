import { env } from '@/app/config/env';
import { supabase } from '@/lib/supabase/client';
import { ApiResponse, ApiErrorResponse } from '@/types';

export class ApiError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

async function getAuthToken(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) {
      return data.session.access_token;
    }
  } catch {}

  try {
    const demo = localStorage.getItem('shardflow_demo_user');
    if (demo) {
      const parsed = JSON.parse(demo);
      const email = parsed.email || 'demo@shardflow.io';
      const id = parsed.id || 'dev';
      const encodedEmail = btoa(email);
      return `demo_${id}_${encodedEmail}`;
    }
  } catch {}

  return null;
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${env.apiBaseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const responseData = await response.json().catch(() => null);

  if (!response.ok) {
    const errorPayload = responseData as ApiErrorResponse | null;
    const errorCode = errorPayload?.error?.code || 'INTERNAL_ERROR';
    const errorMessage = errorPayload?.error?.message || errorPayload?.message || 'An unexpected error occurred';
    throw new ApiError(errorCode, errorMessage, response.status);
  }

  const successPayload = responseData as ApiResponse<T>;
  return successPayload.data;
}
