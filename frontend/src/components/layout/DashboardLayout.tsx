import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/navigation/Sidebar';
import { Topbar } from '@/components/navigation/Topbar';

export function DashboardLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#050807] text-zinc-100 flex flex-col lg:flex-row font-sans selection:bg-emerald-500 selection:text-black">
      {/* Sidebar Navigation */}
      <Sidebar
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Topbar Header */}
        <Topbar onOpenMobileNav={() => setMobileNavOpen(true)} />

        {/* Dashboard Content Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-grid-mesh bg-fixed relative overflow-y-auto">
          {/* Subtle Ambient Light Glow */}
          <div className="pointer-events-none absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl -z-10" />
          <div className="pointer-events-none absolute bottom-1/4 right-10 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl -z-10" />

          <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
