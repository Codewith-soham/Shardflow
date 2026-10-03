import { Key, Filter, Route, Database, ArrowRight } from 'lucide-react';

export function HowItWorksSection() {
  const steps = [
    {
      step: '01',
      title: 'Authenticate Application Request',
      description: 'Your application sends database operations to ShardFlow using a project API key (X-API-Key).',
      icon: <Key className="w-5 h-5 text-emerald-400" />,
    },
    {
      step: '02',
      title: 'Validate Operation & Allowlist',
      description: 'ShardFlow validates the request against strict MongoDB operator and query option allowlists.',
      icon: <Filter className="w-5 h-5 text-teal-400" />,
    },
    {
      step: '03',
      title: 'Resolve Tenant & Shard Mapping',
      description: 'The routing engine extracts tenantId and resolves the deterministic 1-to-1 shard mapping.',
      icon: <Route className="w-5 h-5 text-emerald-400" />,
    },
    {
      step: '04',
      title: 'Execute on Customer MongoDB',
      description: 'ShardFlow acquires a pooled connection and executes the operation directly on the target shard.',
      icon: <Database className="w-5 h-5 text-cyan-400" />,
    },
  ];

  return (
    <section id="how-it-works" className="py-20 border-b border-emerald-950/80 bg-[#06100B]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="max-w-2xl space-y-3">
          <div className="text-xs font-mono font-medium text-emerald-400 uppercase tracking-wider">How ShardFlow Works</div>
          <h2 className="text-3xl font-bold text-white tracking-tight">
            Clear separation between Control Plane and Data Plane.
          </h2>
          <p className="text-sm text-emerald-100/70 leading-relaxed">
            ShardFlow provides a secure, low-latency pipeline that decouples customer databases from your core application logic.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          {steps.map((s, idx) => (
            <div key={s.step} className="p-5 rounded-xl bg-[#0A1610] border border-emerald-900/60 space-y-3 relative group hover:border-emerald-700 transition-colors">
              <div className="flex items-center justify-between">
                <span className="font-mono text-2xl font-bold text-emerald-900 group-hover:text-emerald-400 transition-colors">{s.step}</span>
                <div className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-800/60">
                  {s.icon}
                </div>
              </div>
              <h3 className="text-sm font-semibold text-white">{s.title}</h3>
              <p className="text-xs text-emerald-200/60 leading-relaxed">{s.description}</p>

              {idx < steps.length - 1 && (
                <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-emerald-800">
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

