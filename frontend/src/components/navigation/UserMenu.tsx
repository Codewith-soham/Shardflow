import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/app/providers/AuthProvider';
import { User, LogOut, Settings, ShieldCheck, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function UserMenu() {
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setIsOpen(false);
    await signOut();
    navigate('/sign-in');
  };

  const userEmail = user?.email || 'admin@shardflow.io';
  const userInitials = userEmail.substring(0, 2).toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2.5 p-1 sm:px-2.5 sm:py-1.5 rounded-lg bg-[#07140E] hover:bg-[#0A1A13] border border-emerald-900/60 hover:border-emerald-700/60 transition-all"
        aria-expanded={isOpen}
      >
        <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 flex items-center justify-center font-mono font-bold text-[10px] text-slate-950 shadow-xs">
          <div className="w-full h-full bg-[#06100B] rounded-[5px] flex items-center justify-center text-emerald-300 font-semibold">
            {userInitials}
          </div>
        </div>
        <span className="hidden md:inline-block text-xs text-zinc-200 font-medium max-w-[120px] truncate">
          {userEmail}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-emerald-400/70 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[#06100B] border border-emerald-900/80 shadow-2xl shadow-black/90 z-50 py-1.5 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3.5 py-2.5 border-b border-emerald-950 bg-[#07140E]">
            <p className="text-xs font-semibold text-white truncate">{userEmail}</p>
            <div className="flex items-center space-x-1.5 mt-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span className="text-[10px] font-mono text-emerald-400 uppercase font-semibold">
                Control Plane Admin
              </span>
            </div>
          </div>

          <div className="py-1">
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/app/settings');
              }}
              className="w-full px-3.5 py-2 text-left flex items-center space-x-2.5 text-xs text-zinc-300 hover:bg-emerald-950/40 hover:text-white transition-colors"
            >
              <Settings className="w-3.5 h-3.5 text-zinc-400" />
              <span>Account Settings</span>
            </button>
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/app/overview');
              }}
              className="w-full px-3.5 py-2 text-left flex items-center space-x-2.5 text-xs text-zinc-300 hover:bg-emerald-950/40 hover:text-white transition-colors"
            >
              <User className="w-3.5 h-3.5 text-zinc-400" />
              <span>Organization Profile</span>
            </button>
          </div>

          <div className="pt-1 border-t border-emerald-950">
            <button
              onClick={handleSignOut}
              className="w-full px-3.5 py-2 text-left flex items-center space-x-2.5 text-xs text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 transition-colors font-medium"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
