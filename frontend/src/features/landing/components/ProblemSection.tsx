import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Layers, Network, ServerOff, ShieldAlert } from 'lucide-react';

export function ProblemSection() {
  const problems = [
    {
      title: 'Monolithic Connection Management',
      description: 'Maintaining independent MongoDB drivers and connection pools across dozens of customer database clusters bloats backend application code.',
      icon: <Network className="w-5 h-5 text-emerald-400" />,
    },
    {
      title: 'Tightly Coupled Routing Logic',
      description: 'Embedding tenant-to-shard mapping rules inside business domain services creates tight coupling and security vulnerabilities.',
      icon: <Layers className="w-5 h-5 text-teal-400" />,
    },
    {
      title: 'Silent Shard Outages',
      description: 'Without centralized health checks, a single unreachable database shard can cause cascading connection timeouts across your application.',
      icon: <ServerOff className="w-5 h-5 text-amber-400" />,
    },
    {
      title: 'Credential & Key Sprawl',
      description: 'Hardcoding raw MongoDB connection strings or distributing database credentials across services exposes sensitive database access secrets.',
      icon: <ShieldAlert className="w-5 h-5 text-rose-400" />,
    },
  ];

  return (
    <section id="problem" className="py-20 border-b border-emerald-950/80 bg-[#050807]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="max-w-2xl space-y-3">
          <div className="text-xs font-mono font-medium text-emerald-400 uppercase tracking-wider">The Infrastructure Problem</div>
          <h2 className="text-3xl font-bold text-white tracking-tight">
            Multi-tenant database scaling shouldn't pollute your application logic.
          </h2>
          <p className="text-sm text-emerald-100/70 leading-relaxed">
            As multi-tenant SaaS applications scale, distributing customer data across multiple MongoDB shards introduces operational overhead that distracts from building core features.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {problems.map((p) => (
            <Card key={p.title} className="p-6 space-y-3 bg-[#08120D] border-emerald-900/60 hover:border-emerald-800 transition-colors">
              <CardHeader className="p-0 border-none mb-0 flex items-center justify-start space-x-3">
                <div className="p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-800/60 shrink-0">
                  {p.icon}
                </div>
                <CardTitle className="text-base font-semibold text-white">{p.title}</CardTitle>
              </CardHeader>
              <CardDescription className="text-xs text-emerald-200/60 leading-relaxed">
                {p.description}
              </CardDescription>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

