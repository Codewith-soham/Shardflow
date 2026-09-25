import { loadConfig } from './config/index.js';
import { connectDatabase, closeDatabase } from './database/index.js';
import { buildApp } from './app.js';

/**
 * Server startup boundary.
 *
 * Loads configuration, connects to the metadata database,
 * builds the Fastify application, registers signal handlers, and starts listening.
 */
async function start(): Promise<void> {
  const config = loadConfig();
  const app = await buildApp(config);

  // Graceful shutdown handlers
  const shutdown = async (signal: string) => {
    app.log.info(`Received ${signal}, initiating graceful shutdown...`);
    try {
      await app.close();
      app.log.info('Server and database connections closed gracefully.');
      process.exit(0);
    } catch (err) {
      app.log.error(err, 'Error during graceful shutdown');
      process.exit(1);
    }
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));

  try {
    app.log.info('Connecting to metadata database...');
    await connectDatabase(config);
    app.log.info('Connected to metadata database successfully.');

    await app.listen({ port: config.port, host: config.host });
  } catch (error) {
    app.log.error(error);
    await closeDatabase().catch(() => {});
    process.exit(1);
  }
}

start();
