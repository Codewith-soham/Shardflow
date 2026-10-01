import type { Db } from 'mongodb';
import { UserRepository } from './repositories/user.repository.js';
import { ProjectRepository } from './repositories/project.repository.js';
import { ApiKeyRepository } from './repositories/api-key.repository.js';

// ShardFlow — Control Plane module
export * from './models/index.js';
export * from './repositories/index.js';
export * from './controllers/user.controller.js';
export * from './routes/me.routes.js';

/**
 * Ensures required indexes across all control-plane collections (users, projects, apiKeys)
 * as defined in docs/database_design.md.
 */
export async function initControlPlaneIndexes(db?: Db): Promise<void> {
  const userRepo = new UserRepository(db);
  const projectRepo = new ProjectRepository(db);
  const apiKeyRepo = new ApiKeyRepository(db);

  await Promise.all([
    userRepo.ensureIndexes(),
    projectRepo.ensureIndexes(),
    apiKeyRepo.ensureIndexes(),
  ]);
}
