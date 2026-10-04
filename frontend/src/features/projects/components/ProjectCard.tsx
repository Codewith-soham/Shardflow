import { Project } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FolderKanban, Check, Info, ArrowRight } from 'lucide-react';
import { useProject } from '@/app/providers/ProjectProvider';

interface ProjectCardProps {
  project: Project;
  onViewDetails: (project: Project) => void;
}

export function ProjectCard({ project, onViewDetails }: ProjectCardProps) {
  const { activeProject, setActiveProject } = useProject();
  const isActive = activeProject?.id === project.id;

  return (
    <Card
      className={`
        relative transition-all duration-200 flex flex-col justify-between p-5 rounded-2xl bg-[#06100B] border
        ${
          isActive
            ? 'border-emerald-500/80 shadow-lg shadow-emerald-500/10 glow-emerald'
            : 'border-emerald-950 hover:border-emerald-800/60 hover:shadow-md'
        }
      `}
    >
      <div className="space-y-3">
        {/* Header Bar */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-xl ${isActive ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-[#07140E] text-zinc-400 border border-emerald-950'}`}>
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight leading-tight">{project.name}</h3>
              <span className="text-[10px] font-mono text-zinc-500">ID: {project.id}</span>
            </div>
          </div>
          <StatusBadge status={project.status} />
        </div>

        {/* Description */}
        <p className="text-xs text-zinc-400 line-clamp-2 min-h-[32px]">
          {project.description || 'No description provided.'}
        </p>
      </div>

      {/* Footer Actions */}
      <div className="pt-4 mt-4 border-t border-emerald-950/80 flex items-center justify-between">
        <Button
          onClick={() => onViewDetails(project)}
          variant="ghost"
          className="text-xs text-zinc-400 hover:text-emerald-300 p-0 h-auto flex items-center space-x-1"
        >
          <Info className="w-3.5 h-3.5" />
          <span>Details</span>
        </Button>

        {isActive ? (
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-emerald-950 border border-emerald-800 text-xs font-semibold text-emerald-300">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>Active Workspace</span>
          </div>
        ) : (
          <Button
            onClick={() => setActiveProject(project)}
            className="px-3 py-1 bg-emerald-950 hover:bg-emerald-900/60 border border-emerald-800/60 text-xs text-emerald-200 hover:text-white rounded-lg transition-all flex items-center space-x-1"
          >
            <span>Select Project</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    </Card>
  );
}
