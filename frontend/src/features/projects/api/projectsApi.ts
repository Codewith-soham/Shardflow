import { apiClient } from '@/lib/api/client';
import { Project } from '@/types';

export async function fetchProjects(): Promise<Project[]> {
  try {
    const data = await apiClient<{ projects: Project[] } | Project[]>('/projects');
    if (data && 'projects' in data && Array.isArray((data as { projects: Project[] }).projects)) {
      return (data as { projects: Project[] }).projects;
    }
    if (Array.isArray(data)) {
      return data;
    }
    return [];
  } catch (err) {
    console.error('Failed to fetch projects from backend:', err);
    throw err;
  }
}

export async function createProject(payload: { name: string; description?: string }): Promise<Project> {
  const newProject = await apiClient<Project>('/projects', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return newProject;
}

export async function updateProject(id: string, payload: { name: string; description?: string }): Promise<Project> {
  const updated = await apiClient<Project>(`/projects/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return updated;
}

export async function deleteProject(id: string): Promise<void> {
  await apiClient(`/projects/${id}`, { method: 'DELETE' });
}

export async function getProjectById(id: string): Promise<Project | null> {
  try {
    const project = await apiClient<Project>(`/projects/${id}`);
    return project;
  } catch {
    return null;
  }
}
