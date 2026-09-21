import { loadConfig } from './config/index.js';
import { buildApp } from './app.js';

/**
 * Server startup boundary.
 *
 * Loads configuration, builds the application, and starts listening.
 * This is the entry point for both development and production execution.
 */
async function start(): Promise<void> {
  const config = loadConfig();
  const app = await buildApp(config);

  try {
    await app.listen({ port: config.port, host: config.host });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

start();
