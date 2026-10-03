import { Link } from 'react-router-dom';
import { ArrowRight, Database } from 'lucide-react';

export function CtaSection() {
  return (
    <section className="py-20 bg-[#050807] relative overflow-hidden border-b border-emerald-950/80">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-emerald-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
        <div className="inline-flex p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
          <Database className="w-7 h-7" />
        </div>

        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Ready to scale your MongoDB infrastructure?
        </h2>

        <p className="text-sm sm:text-base text-emerald-100/70 max-w-xl mx-auto leading-relaxed">
          Focus on building application features. Let ShardFlow manage routing, connections, and health across your database shards.
        </p>

        <div className="pt-3 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/sign-up"
            className="px-6 py-3 rounded-full text-sm font-bold text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 shadow-lg shadow-emerald-500/25 transition-all flex items-center space-x-2"
          >
            <span>Get Started Now</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/sign-in"
            className="px-6 py-3 rounded-full text-sm font-semibold text-emerald-200 hover:text-white bg-emerald-950/60 hover:bg-emerald-900/70 border border-emerald-800/60 shadow-md transition-all"
          >
            Sign In to Workspace
          </Link>
        </div>
      </div>
    </section>
  );
}

