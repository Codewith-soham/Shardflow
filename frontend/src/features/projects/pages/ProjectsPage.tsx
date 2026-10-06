import { useState } from 'react';
import { useProjects } from '../hooks/useProjects';
import { ProjectCard } from '../components/ProjectCard';
import { CreateProjectDialog } from '../components/CreateProjectDialog';
import { ProjectDetailsModal } from '../components/ProjectDetailsModal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { Project } from '@/types';
import { Plus, Search, Boxes, Sparkles } from 'lucide-react';

export function ProjectsPage() {
  const { projects, isLoading, isError, refetch } = useProjects();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedDetailsProject, setSelectedDetailsProject] = useState<Project | null>(null);

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-[#06100B] border border-emerald-900/60 shadow-xl relative overflow-hidden">
        <div className="pointer-events-none absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="space-y-1.5 relative z-10">
          <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800/60 text-[10px] font-mono text-emerald-300">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>Multi-Tenant Environment Scope</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Project Management</h1>
          <p className="text-xs text-zinc-400 max-w-xl">
            Create and manage isolated database environments, tenant shard maps, and application security contexts.
          </p>
        </div>

        <Button
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center space-x-2 shrink-0 relative z-10"
        >
          <Plus className="w-4 h-4" />
          <span>Create Project</span>
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Input
            type="text"
            placeholder="Search projects by name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-[#06100B] border-emerald-950 focus:border-emerald-500/70 text-xs text-zinc-200 placeholder:text-zinc-600"
          />
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
        </div>

        <div className="text-xs font-mono text-zinc-400 self-end sm:self-center">
          Showing <span className="text-emerald-400 font-bold">{filteredProjects.length}</span> of {projects.length} Projects
        </div>
      </div>

      {/* Content State Handling */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-5 rounded-2xl bg-[#06100B] border border-emerald-950 space-y-4">
              <div className="flex items-center justify-between">
                <Skeleton className="w-32 h-5 bg-emerald-950/60" />
                <Skeleton className="w-16 h-5 bg-emerald-950/60" />
              </div>
              <Skeleton className="w-full h-10 bg-emerald-950/40" />
              <div className="pt-3 border-t border-emerald-950 flex justify-between">
                <Skeleton className="w-16 h-6 bg-emerald-950/40" />
                <Skeleton className="w-24 h-6 bg-emerald-950/60" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          title="Failed to Load Projects"
          message="Could not fetch project list from control plane API."
          onRetry={refetch}
        />
      ) : filteredProjects.length === 0 ? (
        <EmptyState
          icon={<Boxes className="w-6 h-6 text-emerald-400" />}
          title={searchQuery ? 'No Matching Projects' : 'No Projects Created'}
          description={
            searchQuery
              ? `No projects match "${searchQuery}". Try clearing search filter.`
              : 'Create your first project environment to start registering target MongoDB shards and routing rules.'
          }
          actionLabel={searchQuery ? 'Clear Search' : 'Create First Project'}
          onAction={() => (searchQuery ? setSearchQuery('') : setIsCreateOpen(true))}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onViewDetails={(p) => setSelectedDetailsProject(p)}
            />
          ))}
        </div>
      )}

      {/* Create Project Modal Dialog */}
      <CreateProjectDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />

      {/* Project Details Modal */}
      <ProjectDetailsModal
        project={selectedDetailsProject}
        isOpen={!!selectedDetailsProject}
        onClose={() => setSelectedDetailsProject(null)}
      />
    </div>
  );
}
