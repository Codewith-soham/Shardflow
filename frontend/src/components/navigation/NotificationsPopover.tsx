import { useState, useRef, useEffect } from 'react';
import { Bell, Check, ShieldAlert, Activity, Key } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const INITIAL_NOTIFICATIONS = [
  {
    id: 'n-1',
    title: 'Shard Health Check Passed',
    message: 'Primary Shard mongo-shard-01 ping response: 2ms',
    time: '5m ago',
    type: 'health',
    read: false,
  },
  {
    id: 'n-2',
    title: 'New API Key Created',
    message: 'Prod-Key-v1 generated for tenant routing service',
    time: '1h ago',
    type: 'security',
    read: false,
  },
  {
    id: 'n-3',
    title: 'Tenant Route Updated',
    message: 'tenant_enterprise_808 mapped to shard_02',
    time: '3h ago',
    type: 'routing',
    read: true,
  },
];

export function NotificationsPopover() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const popoverRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'health':
        return <Activity className="w-3.5 h-3.5 text-emerald-400" />;
      case 'security':
        return <Key className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />;
    }
  };

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-zinc-400 hover:text-emerald-300 rounded-lg hover:bg-emerald-950/40 border border-transparent hover:border-emerald-900/60 transition-all"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-88 rounded-xl bg-[#06100B] border border-emerald-900/80 shadow-2xl shadow-black/90 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="px-4 py-3 border-b border-emerald-950 flex items-center justify-between bg-[#07140E]">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-white tracking-wide">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800 rounded-md">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center space-x-1 font-medium"
              >
                <Check className="w-3 h-3" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          <div className="divide-y divide-emerald-950/60 max-h-80 overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-zinc-500 font-mono">
                No notifications present
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3.5 flex items-start space-x-3 transition-colors ${
                    n.read ? 'bg-transparent opacity-75' : 'bg-emerald-950/20'
                  }`}
                >
                  <div className="p-1.5 rounded-lg bg-emerald-950 border border-emerald-800/60 mt-0.5">
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-zinc-200 truncate">{n.title}</h4>
                      <span className="text-[10px] font-mono text-zinc-500 shrink-0 ml-2">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-2">{n.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-2 border-t border-emerald-950 bg-[#050B08] text-center">
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/app/activity');
              }}
              className="w-full text-center text-[11px] text-emerald-400 hover:text-emerald-300 font-medium py-1 transition-colors"
            >
              View Full Activity Log →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
