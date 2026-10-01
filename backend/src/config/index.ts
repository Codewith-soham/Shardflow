export interface AppConfig {
  port: number;
  host: string;
  nodeEnv: string;
  mongodbUri: string;
  mongodbDatabase: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey?: string;
  supabaseJwtSecret?: string;
}

export function loadConfig(): AppConfig {
  const port = parseInt(process.env['PORT'] ?? '3000', 10);

  if (Number.isNaN(port) || port < 0 || port > 65535) {
    throw new Error(`Invalid PORT: ${process.env['PORT']}`);
  }

  const mongodbUri = process.env['MONGODB_URI'];
  if (!mongodbUri || mongodbUri.trim() === '') {
    throw new Error('Missing required environment variable: MONGODB_URI');
  }

  const mongodbDatabase = process.env['MONGODB_DATABASE']?.trim() || 'shardflow';

  const nodeEnv = process.env['NODE_ENV'] ?? 'development';
  const supabaseUrl = process.env['SUPABASE_URL']?.trim() || (nodeEnv === 'test' ? 'https://test.supabase.co' : '');
  if (!supabaseUrl) {
    throw new Error('Missing required environment variable: SUPABASE_URL');
  }

  const supabaseAnonKey = process.env['SUPABASE_ANON_KEY']?.trim() || (nodeEnv === 'test' ? 'test-anon-key' : '');
  if (!supabaseAnonKey) {
    throw new Error('Missing required environment variable: SUPABASE_ANON_KEY');
  }

  return {
    port,
    host: process.env['HOST'] ?? '0.0.0.0',
    nodeEnv,
    mongodbUri,
    mongodbDatabase,
    supabaseUrl,
    supabaseAnonKey,
    supabaseServiceRoleKey: process.env['SUPABASE_SERVICE_ROLE_KEY']?.trim(),
    supabaseJwtSecret: process.env['SUPABASE_JWT_SECRET']?.trim(),
  };
}
