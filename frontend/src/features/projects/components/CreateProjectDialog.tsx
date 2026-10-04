import { useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Boxes, Loader2, AlertCircle, Plus } from 'lucide-react';
import { useProjects } from '../hooks/useProjects';
import { useProject } from '@/app/providers/ProjectProvider';

interface CreateProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateProjectDialog({ isOpen, onClose }: CreateProjectDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { createProject, isCreating } = useProjects();
  const { setActiveProject } = useProject();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Project name is required.');
      return;
    }

    try {
      const newProj = await createProject({
        name: name.trim(),
        description: description.trim() || undefined,
      });

      // Set newly created project as active project in global context
      setActiveProject(newProj);

      // Reset form & close
      setName('');
      setDescription('');
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create project.';
      setError(message);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Create New Project">
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <div className="flex items-center space-x-3 p-3 rounded-xl bg-[#07140E] border border-emerald-900/60">
          <div className="p-2 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800/80 shrink-0">
            <Boxes className="w-5 h-5" />
          </div>
          <p className="text-xs text-zinc-300">
            Projects encapsulate your database target shards, tenant routing rules, and API keys into isolated environments.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-900/80 text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="font-mono text-[11px]">{error}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
            <span>Project Name <span className="text-emerald-400">*</span></span>
          </label>
          <Input
            type="text"
            placeholder="e.g. Analytics Shard Mesh"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isCreating}
            className="bg-[#050B08] border-emerald-950 focus:border-emerald-500/70 text-xs text-zinc-200"
            required
            autoFocus
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-300">Description</label>
          <Textarea
            placeholder="Describe the purpose or environment for this project..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isCreating}
            rows={3}
            className="bg-[#050B08] border-emerald-950 focus:border-emerald-500/70 text-xs text-zinc-200"
          />
        </div>

        <div className="pt-3 border-t border-emerald-950 flex items-center justify-end space-x-3">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isCreating}
            className="text-xs text-zinc-400 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isCreating}
            className="px-4 py-2 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20 flex items-center space-x-2"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-950" />
                <span>Creating...</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>Create Project</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
