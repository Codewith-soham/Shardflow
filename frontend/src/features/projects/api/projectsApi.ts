import { apiClient } from '@/lib/api/client';
import { Project } from '@/types';

// In-memory demo store fallback for local environment testing
let MOCK_PROJECTS: Project[] = [
  {
    id: 'proj_prod_shard_01',
    name: 'Production Shard Cluster',
    description: 'Primary multi-region MongoDB sharded cluster servicing core enterprise tenant workloads.',
    status: 'ACTIVE',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'proj_staging_mesh_02',
    name: 'Staging E-Commerce Mesh',
    description: 'Staging cluster for testing tenant sharding rules and schema migrations.',
    status: 'ACTIVE',
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'proj_dev_analytics_03',
    name: 'Dev Analytics Engine',
    description: 'Development environment for testing real-time event routing and telemetry aggregation.',
    status: 'ACTIVE',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export async function fetchProjects(): Promise<Project[]> {
  try {
    const data = await apiClient<Project[]>('/projects');
    if (Array.isArray(data) && data.length > 0) {
      return data;
    }
    return MOCK_PROJECTS;
  } catch (err) {
    console.warn('Backend API unaccessible, using initial project dataset:', err);
    return MOCK_PROJECTS;
  }
}

export async function createProject(payload: { name: string; description?: string }): Promise<Project> {
  try {
    const newProject = await apiClient<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    MOCK_PROJECTS = [newProject, ...MOCK_PROJECTS];
    return newProject;
  } catch (err) {
    console.warn('Backend API unaccessible, creating project locally:', err);
    const newProject: Project = {
      id: `proj_${Math.random().toString(36).substring(2, 9)}`,
      name: payload.name,
      description: payload.description || 'No description provided.',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    MOCK_PROJECTS = [newProject, ...MOCK_PROJECTS];
    return newProject;
  }
}

export async function getProjectById(id: string): Promise<Project | null> {
  try {
    const project = await apiClient<Project>(`/projects/${id}`);
    return project;
  } catch {
    return MOCK_PROJECTS.find((p) => p.id === id) || null;
  }
}
