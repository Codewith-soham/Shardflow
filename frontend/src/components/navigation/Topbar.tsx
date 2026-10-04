import { useLocation } from 'react-router-dom';
import { Menu, Activity } from 'lucide-react';
import { ProjectSwitcher } from './ProjectSwitcher';
import { NotificationsPopover } from './NotificationsPopover';
import { UserMenu } from './UserMenu';

interface TopbarProps {
  onOpenMobileNav: () => void;
}

const ROUTE_NAMES: Record<string, { title: string; category?: string }> = {
  '/app/overview': { title: 'Overview', category: 'Dashboard' },
  '/app/projects': { title: 'Projects', category: 'Dashboard' },
  '/app/shards': { title: 'Shards', category: 'Database' },
  '/app/routing': { title: 'Routing', category: 'Database' },
  '/app/api-keys': { title: 'API Keys', category: 'Security' },
  '/app/health': { title: 'Health', category: 'Monitoring' },
  '/app/activity': { title: 'Activity', category: 'Monitoring' },
  '/app/integration': { title: 'Integration', category: 'Developer' },
  '/app/settings': { title: 'Settings', category: 'Account' },
};

export function Topbar({ onOpenMobileNav }: TopbarProps) {
  const location = useLocation();

  const getBreadcrumb = () => {
    // Check exact match or dynamic route match (e.g. /app/shards/123)
    const exact = ROUTE_NAMES[location.pathname];
    if (exact) return exact;

    if (location.pathname.startsWith('/app/shards/')) {
      return { title: 'Shard Details', category: 'Database' };
    }

    return { title: 'Dashboard', category: 'Control Plane' };
  };

  const breadcrumb = getBreadcrumb();

  return (
    <header className="sticky top-0 z-30 h-16 w-full border-b border-emerald-950/80 bg-[#050807]/90 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Mobile Toggle & Page Context Title */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onOpenMobileNav}
          className="lg:hidden p-2 text-zinc-400 hover:text-emerald-300 rounded-lg hover:bg-emerald-950/40 transition-colors"
          aria-label="Open Mobile Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col">
          <div className="flex items-center space-x-1.5 text-[11px] font-mono text-emerald-500/70">
            <span>ShardFlow</span>
            {breadcrumb.category && (
              <>
                <span>/</span>
                <span className="text-zinc-500">{breadcrumb.category}</span>
              </>
            )}
          </div>
          <h1 className="text-sm font-bold text-white tracking-tight leading-none">
            {breadcrumb.title}
          </h1>
        </div>
      </div>

      {/* Center: Active Project Switcher */}
      <div className="hidden sm:flex items-center">
        <ProjectSwitcher />
      </div>

      {/* Right: Quick Health Status, Notifications & User Menu */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Quick Health Status Pill */}
        <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-800/40 text-[11px] font-mono text-emerald-300">
          <Activity className="w-3 h-3 text-emerald-400" />
          <span className="text-emerald-400 font-semibold">Mesh:</span>
          <span>100% Healthy</span>
        </div>

        {/* Project Switcher for Mobile */}
        <div className="sm:hidden">
          <ProjectSwitcher />
        </div>

        {/* System Notifications */}
        <NotificationsPopover />

        {/* User Account Menu */}
        <UserMenu />
      </div>
    </header>
  );
}
