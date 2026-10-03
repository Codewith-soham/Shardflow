/**
 * ShardFlow V1 Domain Types & API Response Models
 */

// API Response Wrappers
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message: string;
}

export interface ApiErrorPayload {
  code: string;
  message: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  error: ApiErrorPayload;
}

// User Entity
export interface User {
  id: string;
  supabaseUserId: string;
  email: string;
}

// Project Entity
export type ProjectStatus = 'ACTIVE' | 'DISABLED';

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  createdAt?: string;
  updatedAt?: string;
}

// Shard Entity
export type ShardAdminStatus = 'ACTIVE' | 'DISABLED';
export type ShardHealthStatus = 'UNKNOWN' | 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';

export interface Shard {
  id: string;
  projectId?: string;
  name: string;
  status: ShardAdminStatus;
  healthStatus: ShardHealthStatus;
  lastHealthCheckAt?: string | null;
  lastSuccessfulHealthCheckAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// Routing Strategy & Tenant Mapping
export type RoutingStrategy = 'TENANT_BASED';

export interface RoutingConfig {
  strategy: RoutingStrategy;
}

export interface TenantMapping {
  id: string;
  tenantId: string;
  shardId: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

// API Key Entity
export type ApiKeyStatus = 'ACTIVE' | 'REVOKED' | 'EXPIRED';

export interface ApiKey {
  id: string;
  name: string;
  status: ApiKeyStatus;
  expiresAt?: string | null;
  lastUsedAt?: string | null;
  createdAt: string;
}

export interface ApiKeyCreatedResponse extends ApiKey {
  key: string; // Raw key returned ONCE upon creation
}

// Health Monitoring
export interface ShardHealthSummary {
  shardId: string;
  status: ShardAdminStatus;
  healthStatus: ShardHealthStatus;
  lastHealthCheckAt?: string | null;
}

export interface HealthEvent {
  id: string;
  shardId: string;
  status: ShardHealthStatus;
  latency?: number;
  error?: string | Record<string, unknown>;
  createdAt: string;
}
