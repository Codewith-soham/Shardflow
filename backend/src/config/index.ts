export interface AppConfig {
  port: number;
  host: string;
  nodeEnv: string;
  mongodbUri: string;
  mongodbDatabase: string;
}

export function loadConfig(): AppConfig {
  const port = parseInt(process.env['PORT'] ?? '3000', 10);

  if (Number.isNaN(port) || port < 0 || port > 65535) {
    throw new Error(`Invalid PORT: ${process.env['PORT']}`);
  }

  const mongodbUri = process.env['MONGODB_URL'];
  if (!mongodbUri || mongodbUri.trim() === '') {
    throw new Error('Missing required environment variable: MONGODB_URL');
  }

  const mongodbDatabase = process.env['MONGODB_DATABASE']?.trim() || 'shardflow';

  return {
    port,
    host: process.env['HOST'] ?? '0.0.0.0',
    nodeEnv: process.env['NODE_ENV'] ?? 'development',
    mongodbUri,
    mongodbDatabase,
  };
}
