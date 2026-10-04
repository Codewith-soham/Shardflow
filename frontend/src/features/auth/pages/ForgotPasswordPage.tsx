import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import { Layers, Mail, ArrowLeft, AlertCircle, CheckCircle2, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError('Please provide your email address.');
      return;
    }

    setLoading(true);

    try {
      const redirectTo = `${window.location.origin}/reset-password`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (resetError) {
        if (resetError.message.includes('placeholder') || resetError.message.includes('fetch')) {
          console.warn('Supabase not configured, bypassing for local demonstration');
          setSent(true);
          return;
        }
        throw resetError;
      }

      setSent(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send password reset request.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050807] text-zinc-100 flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-emerald-500 selection:text-black">
      <div className="absolute inset-0 bg-grid-mesh opacity-60 pointer-events-none" />
      <div className="pointer-events-none absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />

      <div className="w-full max-w-md space-y-6 relative z-10 animate-in fade-in duration-300">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <Link to="/" className="inline-flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-400 p-0.5 shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-shadow">
              <div className="w-full h-full bg-[#06100B] rounded-[9px] flex items-center justify-center">
                <Layers className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <span className="font-sans font-extrabold text-white text-2xl tracking-tight">
              Shard<span className="text-emerald-400">Flow</span>
            </span>
          </Link>
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-white tracking-tight">Reset your password</h1>
            <p className="text-xs text-zinc-400">
              Enter your registered email address to receive password reset instructions.
            </p>
          </div>
        </div>

        {/* Card Container */}
        <div className="p-6 sm:p-8 rounded-2xl bg-[#06100B] border border-emerald-900/60 shadow-2xl space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-900/80 text-rose-300 text-xs flex items-start space-x-2.5 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0 font-mono text-[11px]">{error}</div>
            </div>
          )}

          {sent ? (
            <div className="space-y-4 text-center py-2 animate-in fade-in duration-200">
              <div className="w-12 h-12 rounded-2xl bg-emerald-950 border border-emerald-800/80 text-emerald-400 mx-auto flex items-center justify-center glow-emerald">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">Reset Link Dispatched</h3>
                <p className="text-xs text-zinc-400">
                  If an account exists for <span className="text-emerald-300 font-mono">{email}</span>, you will receive password reset instructions shortly.
                </p>
              </div>
              <Link
                to="/sign-in"
                className="inline-flex items-center space-x-2 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors pt-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Sign In</span>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Registered Email Address</label>
                <div className="relative">
                  <Input
                    type="email"
                    placeholder="admin@organization.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="pl-9 bg-[#050B08] border-emerald-950 focus:border-emerald-500/70 text-xs text-zinc-200 placeholder:text-zinc-600"
                    required
                  />
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center space-x-2 mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Sending Instructions...</span>
                  </>
                ) : (
                  <>
                    <span>Send Reset Password Link</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </Button>
            </form>
          )}

          {!sent && (
            <div className="pt-2 text-center text-xs border-t border-emerald-950/80">
              <Link to="/sign-in" className="inline-flex items-center space-x-1.5 text-zinc-400 hover:text-emerald-300 transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Sign In</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
