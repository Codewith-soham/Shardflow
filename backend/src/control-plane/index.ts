import type { Db } from 'mongodb';
import { UserRepository } from './repositories/user.repository.js';
import { ProjectRepository } from './repositories/project.repository.js';
import { ApiKeyRepository } from './repositories/api-key.repository.js';
import { ShardRepository } from './repositories/shard.repository.js';
import { TenantMappingRepository } from './repositories/tenant-mapping.repository.js';
import { RoutingConfigRepository } from './repositories/routing-config.repository.js';

// ShardFlow — Control Plane module
export * from './models/index.js';
export * from './repositories/index.js';
export * from './services/index.js';
export * from './controllers/index.js';
export * from './routes/index.js';

/**
 * Ensures required indexes across all control-plane collections
 * (users, projects, apiKeys, shards, tenantShardMappings, routingConfigs) as defined in docs/database_design.md.
 */
export async function initControlPlaneIndexes(db?: Db): Promise<void> {
  const userRepo = new UserRepository(db);
  const projectRepo = new ProjectRepository(db);
  const apiKeyRepo = new ApiKeyRepository(db);
  const shardRepo = new ShardRepository(db);
  const tenantMappingRepo = new TenantMappingRepository(db);
  const routingConfigRepo = new RoutingConfigRepository(db);

  await Promise.all([
    userRepo.ensureIndexes(),
    projectRepo.ensureIndexes(),
    apiKeyRepo.ensureIndexes(),
    shardRepo.ensureIndexes(),
    tenantMappingRepo.ensureIndexes(),
    routingConfigRepo.ensureIndexes(),
  ]);
}

