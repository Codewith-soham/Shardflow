import React, { createContext, useContext, useState, useEffect } from 'react';
import { Project } from '@/types';

interface ProjectContextType {
  activeProject: Project | null;
  activeProjectId: string | null;
  setActiveProject: (project: Project | null) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

const STORAGE_KEY = 'shardflow_active_project';

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [activeProject, setActiveProjectState] = useState<Project | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Only keep genuine MongoDB ObjectIds (24 hex characters), reject mock 'proj_' IDs
        if (parsed && typeof parsed.id === 'string' && !parsed.id.startsWith('proj_')) {
          return parsed;
        }
      }
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('shardflow_projects_store');
      localStorage.removeItem('shardflow_shards_store');
      localStorage.removeItem('shardflow_api_keys_store');
      localStorage.removeItem('shardflow_mappings_store');
    } catch {
      // ignore
    }
    return null;
  });

  const setActiveProject = (project: Project | null) => {
    setActiveProjectState(project);
    if (project && !project.id.startsWith('proj_')) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  useEffect(() => {
    if (activeProject && !activeProject.id.startsWith('proj_')) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(activeProject));
    } else {
      localStorage.removeItem(STORAGE_KEY);
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
