import { useState, useEffect } from 'react';
import { useAuth } from '@/app/providers/AuthProvider';
import { useProject } from '@/app/providers/ProjectProvider';
import { updateProject as updateProjectApi, deleteProject as deleteProjectApi } from '@/features/projects/api/projectsApi';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { ConfirmationDialog } from '@/components/feedback/ConfirmationDialog';
import {
  User as UserIcon,
  Folder,
  ShieldAlert,
  LogOut,
  Trash2,
  Save,
  CheckCircle2,
  Bell,
  Lock,
} from 'lucide-react';

export function SettingsPage() {
  const { user, signOut } = useAuth();
  const { activeProject, setActiveProject } = useProject();

  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [isSavingProject, setIsSavingProject] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [healthAlerts, setHealthAlerts] = useState(true);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeletingProject, setIsDeletingProject] = useState(false);

  useEffect(() => {
    if (activeProject) {
      setProjectName(activeProject.name);
      setProjectDesc(activeProject.description || '');
    }
  }, [activeProject]);

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject || !projectName.trim()) return;

    try {
      setIsSavingProject(true);
      const updated = await updateProjectApi(activeProject.id, {
        name: projectName.trim(),
        description: projectDesc.trim() || undefined,
      });
      setActiveProject(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setIsSavingProject(false);
    }
  };

  const handleDeleteProjectConfirm = async () => {
    if (!activeProject) return;
    try {
      setIsDeletingProject(true);
      await deleteProjectApi(activeProject.id);
      setActiveProject(null);
      setIsDeleteOpen(false);
    } finally {
      setIsDeletingProject(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Platform & Project Settings</h1>
        <p className="text-xs text-zinc-400 mt-1">
          Manage user identity, project metadata, notifications, and security controls.
        </p>
      </div>

      {/* User Account Section */}
      <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
        <div className="flex items-center space-x-2 text-white font-bold text-sm">
          <UserIcon className="w-4 h-4 text-emerald-400" />
          <span>User Profile & Authentication</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
            <span className="text-[10px] text-zinc-500">AUTHENTICATED EMAIL</span>
            <p className="text-emerald-300 font-semibold">{user?.email || 'user@example.com'}</p>
          </div>
          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
            <span className="text-[10px] text-zinc-500">SUPABASE AUTH USER ID</span>
            <p className="text-zinc-400 truncate">{user?.id || 'sb_usr_102948'}</p>
          </div>
        </div>
      </div>

      {/* Project Metadata Section */}
      {activeProject && (
        <form onSubmit={handleSaveProject} className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-white font-bold text-sm">
              <Folder className="w-4 h-4 text-sky-400" />
              <span>Project Configuration ({activeProject.id})</span>
            </div>
            {saveSuccess && (
              <span className="flex items-center space-x-1 text-xs text-emerald-400 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Project updated!</span>
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">Project Name</label>
            <Input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Project Name"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">Project Description</label>
            <Textarea
              value={projectDesc}
              onChange={(e) => setProjectDesc(e.target.value)}
              placeholder="Add project description..."
              rows={3}
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" isLoading={isSavingProject} className="space-x-1.5">
              <Save className="w-4 h-4" />
              <span>Save Project Settings</span>
            </Button>
          </div>
        </form>
      )}

      {/* Notifications Section */}
      <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
        <div className="flex items-center space-x-2 text-white font-bold text-sm">
          <Bell className="w-4 h-4 text-amber-400" />
          <span>Notification Preferences</span>
        </div>

        <div className="space-y-3 text-xs">
          <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 transition-colors">
            <input
              type="checkbox"
              checked={emailNotifications}
              onChange={(e) => setEmailNotifications(e.target.checked)}
              className="w-4 h-4 accent-emerald-500 rounded bg-zinc-900 border-zinc-700"
            />
            <div>
              <span className="text-white font-medium block">Brevo Email Notifications</span>
              <span className="text-zinc-400 text-[11px]">
                Receive email alerts when MongoDB shards change health states.
              </span>
            </div>
          </label>

          <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 transition-colors">
            <input
              type="checkbox"
              checked={healthAlerts}
              onChange={(e) => setHealthAlerts(e.target.checked)}
              className="w-4 h-4 accent-emerald-500 rounded bg-zinc-900 border-zinc-700"
            />
            <div>
              <span className="text-white font-medium block">Shard Health Degraded Alerts</span>
              <span className="text-zinc-400 text-[11px]">
                Immediate warnings when socket ping latency exceeds 200ms threshold.
              </span>
            </div>
          </label>
        </div>
      </div>

      {/* Security & Sign Out Section */}
      <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
        <div className="flex items-center space-x-2 text-white font-bold text-sm">
          <Lock className="w-4 h-4 text-purple-400" />
          <span>Security & Active Session</span>
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-950 border border-zinc-800">
          <div className="space-y-0.5">
            <span className="text-xs font-semibold text-white">Sign Out of Control Plane</span>
            <p className="text-[11px] text-zinc-400">
              Clear local Supabase Auth session tokens.
            </p>
          </div>
          <Button variant="outline" onClick={signOut} className="space-x-1.5 text-zinc-300">
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </Button>
        </div>
      </div>

      {/* Danger Zone */}
      {activeProject && (
        <div className="p-6 rounded-2xl bg-red-950/20 border border-red-900/40 space-y-4">
          <div className="flex items-center space-x-2 text-red-400 font-bold text-sm">
            <ShieldAlert className="w-4 h-4" />
            <span>Danger Zone</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-red-950/40 border border-red-900/60">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-red-200">Delete Project Scope</span>
              <p className="text-[11px] text-red-300/80">
                Permanently delete this project, all registered shards, tenant mappings, and API keys.
              </p>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setIsDeleteOpen(true)}
              className="space-x-1.5 shrink-0"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Project</span>
            </Button>
          </div>
        </div>
      )}

      {/* Delete Project Dialog */}
      <ConfirmationDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteProjectConfirm}
        title="Delete Project Scope"
        description={`Are you sure you want to permanently delete project "${activeProject?.name}"? All associated shards, tenant routing rules, and API keys will be erased.`}
        confirmLabel="Delete Project Permanently"
        variant="danger"
        isLoading={isDeletingProject}
      />
    </div>
  );
}
