import { Link } from 'react-router-dom';
import { InfraVisualization } from './InfraVisualization';
import { Database, Zap, GitBranch, Shield, ChevronRight } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative pt-12 pb-16 overflow-hidden bg-[#050807] text-white">
      {/* Ambient Glow Effects - Emerald & Mint */}
      <div className="absolute top-10 left-1/4 w-[500px] h-[300px] bg-emerald-600/15 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute top-36 right-1/4 w-[400px] h-[300px] bg-teal-500/15 rounded-full blur-[130px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 relative z-10">

        {/* Headline & Value Proposition */}
        <div className="max-w-3xl space-y-6">
          {/* Top Pill Badge */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-950/70 border border-emerald-800/50 text-xs font-medium text-emerald-300 shadow-inner">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Distributed MongoDB for Modern Applications</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]">
            Scale Your Data. <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              Without Complexity.
            </span>
          </h1>

          {/* Description Subtext */}
          <p className="text-base sm:text-lg text-emerald-100/70 leading-relaxed max-w-2xl font-normal">
            ShardFlow intelligently routes your requests across MongoDB shards, giving you high availability, seamless scaling, and complete control — all in one place.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              to="/sign-up"
              className="px-6 py-3 rounded-full text-sm font-bold text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all flex items-center space-x-2"
            >
              <span>Get Started Free</span>
              <span className="text-base">→</span>
            </Link>

            <a
              href="#docs"
              className="px-6 py-3 rounded-full text-sm font-semibold text-emerald-200 hover:text-white bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-800/60 shadow-md transition-all"
            >
              View Documentation
            </a>
          </div>
        </div>

        {/* Infrastructure Topology Visualizer */}
        <div className="w-full pt-4">
          <InfraVisualization />
        </div>

        {/* Bottom Metrics Bar */}
        <div className="w-full pt-4">
          <div className="p-4 sm:p-5 rounded-xl bg-slate-950/90 border border-emerald-900/60 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl backdrop-blur-md">

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full md:w-auto">
              {/* Metric 1 */}
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center shrink-0">
                  <Database className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <div className="text-sm font-extrabold text-white">99.99%</div>
                  <div className="text-[11px] text-emerald-300/60">Uptime</div>
                </div>
              </div>

              {/* Metric 2 */}
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4 text-teal-400" />
                </div>
                <div>
                  <div className="text-sm font-extrabold text-white">&lt; 50ms</div>
                  <div className="text-[11px] text-emerald-300/60">Routing Latency</div>
                </div>
              </div>

              {/* Metric 3 */}
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center shrink-0">
                  <GitBranch className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <div className="text-sm font-extrabold text-white">Unlimited</div>
                  <div className="text-[11px] text-emerald-300/60">Horizontal Scaling</div>
                </div>
              </div>

              {/* Metric 4 */}
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center shrink-0">
                  <Shield className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <div className="text-sm font-extrabold text-white">Real-time</div>
                  <div className="text-[11px] text-emerald-300/60">Health Monitoring</div>
                </div>
              </div>
            </div>

            {/* Operational Status Pill */}
            <div className="w-full md:w-auto flex justify-end">
              <a href="#shards" className="w-full md:w-auto px-4 py-2 rounded-lg bg-emerald-950/60 border border-emerald-500/40 hover:border-emerald-400 text-xs text-emerald-200 flex items-center justify-between space-x-3 transition-colors">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-medium text-emerald-300">All shards operational</span>
                </div>
                <div className="flex items-center space-x-1 text-emerald-400/80 font-mono text-[11px]">
                  <span>3/3 healthy</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </a>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}


