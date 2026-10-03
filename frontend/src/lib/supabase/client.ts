import { createClient } from '@supabase/supabase-js';
import { env } from '@/app/config/env';

// Fallback to placeholder if environment variables are not configured yet
const supabaseUrl = env.supabaseUrl || 'https://placeholder.supabase.co';
const supabaseAnonKey = env.supabaseAnonKey || 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
