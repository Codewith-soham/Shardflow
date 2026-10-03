import { Link } from 'react-router-dom';
import { Database } from 'lucide-react';

export function LandingFooter() {
  return (
    <footer className="border-t border-emerald-950 bg-[#050807] py-12 text-xs text-emerald-300/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="space-y-3">
            <Link to="/" className="flex items-center space-x-2 text-white font-semibold text-sm">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Database className="w-3.5 h-3.5" />
              </div>
              <span className="font-mono">Shard<span className="text-emerald-400">Flow</span></span>
            </Link>
            <p className="text-emerald-300/50 leading-relaxed">
              Database infrastructure layer for multi-tenant SaaS applications operating across MongoDB shards.
            </p>
          </div>

          {/* Product Links */}
          <div className="space-y-3">
            <h4 className="font-mono font-semibold text-emerald-200 uppercase tracking-wider text-[11px]">Product</h4>
            <ul className="space-y-2">
              <li><a href="#how-it-works" className="hover:text-emerald-400 transition-colors">How It Works</a></li>
              <li><a href="#routing" className="hover:text-emerald-400 transition-colors">Deterministic Routing</a></li>
              <li><a href="#shards" className="hover:text-emerald-400 transition-colors">Shard Management</a></li>
              <li><a href="#health" className="hover:text-emerald-400 transition-colors">Health Monitoring</a></li>
            </ul>
          </div>

          {/* Developer Links */}
          <div className="space-y-3">
            <h4 className="font-mono font-semibold text-emerald-200 uppercase tracking-wider text-[11px]">Developers</h4>
            <ul className="space-y-2">
              <li><a href="#integration" className="hover:text-emerald-400 transition-colors">API Integration</a></li>
              <li><a href="#architecture" className="hover:text-emerald-400 transition-colors">Architecture Overview</a></li>
              <li><Link to="/sign-in" className="hover:text-emerald-400 transition-colors">Control Plane Access</Link></li>
              <li><Link to="/sign-up" className="hover:text-emerald-400 transition-colors">Get API Keys</Link></li>
            </ul>
          </div>

          {/* Authentication & Access */}
          <div className="space-y-3">
            <h4 className="font-mono font-semibold text-emerald-200 uppercase tracking-wider text-[11px]">Authentication</h4>
            <ul className="space-y-2">
              <li><Link to="/sign-in" className="hover:text-emerald-400 transition-colors">Sign In</Link></li>
              <li><Link to="/sign-up" className="hover:text-emerald-400 transition-colors">Create Account</Link></li>
              <li><Link to="/forgot-password" className="hover:text-emerald-400 transition-colors">Forgot Password</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-emerald-950/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-emerald-400/50 font-mono text-[11px]">
          <div>© {new Date().getFullYear()} ShardFlow V1.0. All rights reserved.</div>
          <div>Database Infrastructure Layer for Multi-Tenant MongoDB</div>
        </div>
      </div>
    </footer>
  );
}

