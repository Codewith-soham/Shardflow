import React, { createContext, useContext, useState, useEffect } from 'react';
import { Project } from '@/types';

interface ProjectContextType {
  activeProject: Project | null;
  activeProjectId: string | null;
  setActiveProject: (project: Project | null) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

const STORAGE_KEY = 'shardflow_active_project';

const DEFAULT_PROJECT: Project = {
  id: 'proj_prod_shard_01',
  name: 'Production Shard Cluster',
  description: 'Primary multi-region MongoDB sharded cluster servicing core enterprise tenant workloads.',
  status: 'ACTIVE',
  createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date().toISOString(),
};

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [activeProject, setActiveProjectState] = useState<Project | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_PROJECT;
    } catch {
      return DEFAULT_PROJECT;
    }
  });

  const setActiveProject = (project: Project | null) => {
    setActiveProjectState(project);
    if (project) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  useEffect(() => {
    if (activeProject) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(activeProject));
    }
  }, [activeProject]);

  return (
    <ProjectContext.Provider
      value={{
        activeProject,
        activeProjectId: activeProject?.id || null,
        setActiveProject,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}
