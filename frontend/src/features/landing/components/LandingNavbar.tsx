import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Layers } from 'lucide-react';

export function LandingNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-emerald-950/80 bg-[#050807]/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center space-x-3 text-white font-bold text-lg tracking-tight hover:opacity-90 transition-opacity">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-400 p-0.5 shadow-lg shadow-emerald-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-[#06100B] rounded-[7px] flex items-center justify-center">
              <Layers className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <span className="font-sans font-extrabold text-white text-xl">Shard<span className="text-emerald-400">Flow</span></span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-emerald-100/70">
          <a href="#features" className="hover:text-emerald-400 transition-colors">Features</a>
          <a href="#architecture" className="hover:text-emerald-400 transition-colors">Architecture</a>
          <a href="#docs" className="hover:text-emerald-400 transition-colors">Docs</a>
          <a href="#pricing" className="hover:text-emerald-400 transition-colors">Pricing</a>
        </nav>

        {/* Desktop Auth CTAs */}
        <div className="hidden md:flex items-center space-x-4">
          <Link
            to="/sign-in"
            className="px-4 py-1.5 text-xs font-semibold text-emerald-200 hover:text-white bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/50 rounded-lg transition-all"
          >
            Sign In
          </Link>
          <Link
            to="/sign-up"
            className="px-4 py-1.5 text-xs font-semibold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 rounded-lg shadow-md shadow-emerald-500/25 transition-all"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-emerald-300 hover:text-white rounded-md hover:bg-emerald-950 transition-colors"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-emerald-900 bg-[#06100B] px-4 pt-3 pb-6 space-y-4 animate-in slide-in-from-top-2 duration-150">
          <div className="flex flex-col space-y-3 text-sm font-medium text-emerald-200/80">
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="hover:text-emerald-400 py-1">Features</a>
            <a href="#architecture" onClick={() => setMobileMenuOpen(false)} className="hover:text-emerald-400 py-1">Architecture</a>
            <a href="#docs" onClick={() => setMobileMenuOpen(false)} className="hover:text-emerald-400 py-1">Docs</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="hover:text-emerald-400 py-1">Pricing</a>
          </div>
          <div className="pt-3 border-t border-emerald-900 flex flex-col space-y-2">
            <Link to="/sign-in" className="w-full text-center px-4 py-2 text-xs font-semibold text-emerald-200 bg-emerald-950 border border-emerald-800/60 rounded-lg">
              Sign In
            </Link>
            <Link to="/sign-up" className="w-full text-center px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 rounded-lg">
              Get Started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}


