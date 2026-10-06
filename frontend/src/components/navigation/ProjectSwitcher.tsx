import { useState, useRef, useEffect } from 'react';
import { useProject } from '@/app/providers/ProjectProvider';
import { useProjects } from '@/features/projects/hooks/useProjects';
import { Boxes, ChevronDown, Check, Plus, FolderKanban } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function ProjectSwitcher() {
  const { activeProject, setActiveProject } = useProject();
  const { projects } = useProjects();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Set default active project from real projects list if none selected or invalid
  useEffect(() => {
    if (projects.length > 0) {
      if (!activeProject || !projects.some((p) => p.id === activeProject.id)) {
        setActiveProject(projects[0]);
      }
    }
  }, [projects, activeProject, setActiveProject]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentProject = activeProject || projects[0] || {
    id: 'proj_default',
    name: 'Select Project Workspace',
    description: 'No Project Selected',
    status: 'ACTIVE',
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2.5 px-3 py-1.5 rounded-lg bg-[#07140E] hover:bg-[#0A1A13] border border-emerald-900/60 hover:border-emerald-700/60 text-xs text-emerald-100 transition-all shadow-xs"
        aria-expanded={isOpen}
      >
        <div className="w-5 h-5 rounded bg-emerald-950 border border-emerald-800/80 flex items-center justify-center text-emerald-400">
          <Boxes className="w-3 h-3" />
        </div>
        <div className="flex flex-col items-start text-left">
          <span className="font-semibold text-white tracking-tight leading-tight max-w-[130px] sm:max-w-[180px] truncate">
            {currentProject.name}
          </span>
          <span className="text-[9px] font-mono text-emerald-400/80 uppercase">
            {currentProject.description || 'ACTIVE'}
          </span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-emerald-400/70 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-72 rounded-xl bg-[#06100B] border border-emerald-900/80 shadow-2xl shadow-black/80 z-50 py-1.5 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1.5 text-[10px] font-mono tracking-wider text-emerald-500/70 font-semibold uppercase border-b border-emerald-950">
            Active Workspace Projects ({projects.length})
          </div>

          <div className="py-1 max-h-60 overflow-y-auto">
            {projects.map((proj) => {
              const isSelected = proj.id === currentProject.id;
              return (
                <button
                  key={proj.id}
                  onClick={() => {
                    setActiveProject(proj);
                    setIsOpen(false);
                  }}
                  className={`
                    w-full px-3 py-2 text-left flex items-center justify-between text-xs transition-colors
                    ${isSelected ? 'bg-emerald-950/70 text-emerald-200 font-semibold' : 'text-zinc-300 hover:bg-emerald-950/30 hover:text-white'}
                  `}
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <FolderKanban className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-400' : 'text-zinc-500'}`} />
                    <div className="flex flex-col min-w-0">
                      <span className="truncate">{proj.name}</span>
                      <span className="text-[9px] font-mono text-zinc-500 truncate">{proj.id}</span>
                    </div>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>

          <div className="pt-1 border-t border-emerald-950">
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/app/projects');
              }}
              className="w-full px-3 py-2 text-left flex items-center space-x-2 text-xs text-emerald-400 hover:bg-emerald-950/50 hover:text-emerald-300 font-medium transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Manage / Create Projects</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
