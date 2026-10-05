import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Boxes,
  Database,
  GitFork,
  Key,
  Activity,
  History,
  Code2,
  Settings,
  Layers,
  X,
  Server,
} from 'lucide-react';

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

interface NavGroup {
  groupName?: string;
  items: NavItem[];
}

const NAVIGATION_GROUPS: NavGroup[] = [
  {
    items: [
      { name: 'Overview', href: '/app/overview', icon: LayoutDashboard },
      { name: 'Projects', href: '/app/projects', icon: Boxes },
    ],
  },
  {
    groupName: 'DATABASE',
    items: [
      { name: 'Shards', href: '/app/shards', icon: Database },
      { name: 'Routing', href: '/app/routing', icon: GitFork },
    ],
  },
  {
    groupName: 'SECURITY',
    items: [
      { name: 'API Keys', href: '/app/api-keys', icon: Key },
    ],
  },
  {
    groupName: 'MONITORING',
    items: [
      { name: 'Health', href: '/app/health', icon: Activity, badge: 'Live' },
      { name: 'Activity', href: '/app/activity', icon: History },
    ],
  },
  {
    groupName: 'DEVELOPER',
    items: [
      { name: 'Integration', href: '/app/integration', icon: Code2 },
    ],
  },
];

export function Sidebar({ mobileOpen = false, onCloseMobile }: SidebarProps) {
  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs lg:hidden animate-in fade-in duration-200"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
          fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#06100B] border-r border-emerald-950/80
          flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-emerald-950/80 flex items-center justify-between">
          <NavLink
            to="/app/overview"
            onClick={onCloseMobile}
            className="flex items-center space-x-3 group"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-400 p-0.5 shadow-md shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-shadow">
              <div className="w-full h-full bg-[#06100B] rounded-[7px] flex items-center justify-center">
                <Layers className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-sans font-extrabold text-white text-lg tracking-tight leading-none">
                Shard<span className="text-emerald-400">Flow</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-500/70 tracking-widest mt-0.5">
                CONTROL PLANE
              </span>
            </div>
          </NavLink>

          {/* Close button for mobile drawer */}
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-zinc-400 hover:text-white rounded-md hover:bg-emerald-950/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Content */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 custom-scrollbar">
          {NAVIGATION_GROUPS.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-1">
              {group.groupName && (
                <div className="px-3 pb-1.5 text-[10px] font-mono tracking-widest text-emerald-500/60 font-bold uppercase">
                  {group.groupName}
                </div>
              )}
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    onClick={onCloseMobile}
                    className={({ isActive }) => `
                      flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 relative group
                      ${
                        isActive
                          ? 'bg-emerald-950/60 text-emerald-300 font-semibold border-l-2 border-emerald-400 pl-2.5 shadow-sm shadow-emerald-900/30'
                          : 'text-zinc-400 hover:text-emerald-100 hover:bg-emerald-950/30'
                      }
                    `}
                  >
                    {({ isActive }) => (
                      <>
                        <div className="flex items-center space-x-2.5">
                          <Icon
                            className={`w-4 h-4 transition-colors ${
                              isActive
                                ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]'
                                : 'text-zinc-500 group-hover:text-emerald-400'
                            }`}
                          />
                          <span>{item.name}</span>
                        </div>
                        {item.badge && (
                          <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold tracking-wider uppercase text-emerald-300 bg-emerald-950 border border-emerald-800/80 rounded-full animate-pulse">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </div>

        {/* Bottom Section: Settings & Cluster Status */}
        <div className="p-3 border-t border-emerald-950/80 space-y-3 bg-[#050B08]/60">
          <NavLink
            to="/app/settings"
            onClick={onCloseMobile}
            className={({ isActive }) => `
              flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150
              ${
                isActive
                  ? 'bg-emerald-950/60 text-emerald-300 font-semibold border-l-2 border-emerald-400 pl-2.5'
                  : 'text-zinc-400 hover:text-emerald-100 hover:bg-emerald-950/30'
              }
            `}
          >
            <Settings className="w-4 h-4 text-zinc-400 group-hover:text-emerald-400" />
            <span>Settings</span>
          </NavLink>

          {/* Cluster Status Card */}
          <div className="p-2.5 rounded-lg bg-[#07140E] border border-emerald-900/40 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
              </span>
              <div className="flex flex-col">
                <span className="text-[11px] font-medium text-emerald-200 leading-tight">Mesh Connected</span>
                <span className="text-[9px] font-mono text-emerald-500/70">v1.0.0 • East-Region</span>
              </div>
            </div>
            <Server className="w-3.5 h-3.5 text-emerald-500/50" />
          </div>
        </div>
      </aside>
    </>
  );
}
