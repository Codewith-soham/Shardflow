import { useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Project } from '@/types';
import { Copy, Check, Calendar, FolderKanban, ShieldCheck, Key, Database } from 'lucide-react';

interface ProjectDetailsModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ProjectDetailsModal({ project, isOpen, onClose }: ProjectDetailsModalProps) {
  const [copied, setCopied] = useState(false);

  if (!project) return null;

  const handleCopyId = () => {
    navigator.clipboard.writeText(project.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedDate = project.createdAt
    ? new Date(project.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'N/A';

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Project Details">
      <div className="space-y-5 pt-2">
        {/* Header Summary */}
        <div className="p-4 rounded-xl bg-[#07140E] border border-emerald-900/60 flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="p-2.5 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800/80">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">{project.name}</h3>
              <p className="text-xs text-zinc-400 mt-0.5">{project.description || 'No description provided.'}</p>
            </div>
          </div>
          <StatusBadge status={project.status} />
        </div>

        {/* Project Identifier Copy Card */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-300">Project Identifier (Scope Key)</label>
          <div className="flex items-center space-x-2">
            <div className="flex-1 px-3 py-2 rounded-xl bg-[#050B08] border border-emerald-950 font-mono text-xs text-emerald-300 select-all truncate">
              {project.id}
            </div>
            <Button
              onClick={handleCopyId}
              variant="outline"
              className="px-3 py-2 text-xs border-emerald-900/60 hover:bg-emerald-950/60 text-emerald-300 flex items-center space-x-1.5"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </Button>
          </div>
          <p className="text-[10px] font-mono text-zinc-500">
            Pass this Project ID in API request headers or SDK configuration.
          </p>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-[#06100B] border border-emerald-950 flex items-center space-x-3">
            <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] font-mono text-zinc-500">Created Date</div>
              <div className="text-xs font-medium text-zinc-200 truncate">{formattedDate}</div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#06100B] border border-emerald-950 flex items-center space-x-3">
            <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] font-mono text-zinc-500">Security Isolation</div>
              <div className="text-xs font-medium text-emerald-300 truncate">Strict Multi-Tenant</div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#06100B] border border-emerald-950 flex items-center space-x-3">
            <Database className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] font-mono text-zinc-500">Backend Mesh</div>
              <div className="text-xs font-medium text-zinc-200 truncate">MongoDB Shards</div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#06100B] border border-emerald-950 flex items-center space-x-3">
            <Key className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] font-mono text-zinc-500">Access Scope</div>
              <div className="text-xs font-medium text-zinc-200 truncate">Control Plane Keyed</div>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-emerald-950 flex justify-end">
          <Button onClick={onClose} variant="secondary" className="text-xs">
            Close
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
