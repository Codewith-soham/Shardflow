import { HealthBadge } from '@/components/ui/HealthBadge';
import { ActivityItem } from '@/components/ui/ActivityItem';
import { HealthEvent } from '@/types';
import { Activity, Bell } from 'lucide-react';

export function HealthSection() {
  const sampleEvents: HealthEvent[] = [
    {
      id: 'event_001',
      shardId: 'shard-us-west-backup',
      status: 'DEGRADED',
      latency: 480,
      error: 'Ping response threshold exceeded (>350ms)',
      createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    },
    {
      id: 'event_002',
      shardId: 'shard-eu-central-primary',
      status: 'HEALTHY',
      latency: 42,
      createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    },
  ];

  return (
    <section id="health" className="py-20 border-b border-emerald-950/80 bg-[#050807]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="max-w-2xl space-y-3">
          <div className="text-xs font-mono font-medium text-emerald-400 uppercase tracking-wider">Health Monitoring & Alerts</div>
          <h2 className="text-3xl font-bold text-white tracking-tight">
            Independent background health verification.
          </h2>
          <p className="text-sm text-emerald-100/70 leading-relaxed">
            ShardFlow continuously checks database reachability and latency independently of application traffic, notifying administrators when shard state transitions occur.
          </p>
        </div>

        {/* Health States Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-[#08120D] border border-emerald-900/60 space-y-2">
            <HealthBadge status="HEALTHY" />
            <p className="text-xs text-emerald-200/60">Normal database reachability and low ping latency.</p>
          </div>
          <div className="p-4 rounded-xl bg-[#08120D] border border-emerald-900/60 space-y-2">
            <HealthBadge status="DEGRADED" />
            <p className="text-xs text-emerald-200/60">High latency or transient connection retries detected.</p>
          </div>
          <div className="p-4 rounded-xl bg-[#08120D] border border-emerald-900/60 space-y-2">
            <HealthBadge status="UNHEALTHY" />
            <p className="text-xs text-emerald-200/60">Database unreachable or ping failed. Requests rejected.</p>
          </div>
          <div className="p-4 rounded-xl bg-[#08120D] border border-emerald-900/60 space-y-2">
            <HealthBadge status="UNKNOWN" />
            <p className="text-xs text-emerald-200/60">Initial registration state before health ping check.</p>
          </div>
        </div>

        {/* Live Health Events Preview */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-mono text-emerald-300/70">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Recent Health State Transitions</span>
            </div>
            <div className="flex items-center space-x-1.5 text-amber-400">
              <Bell className="w-3.5 h-3.5" />
              <span>Transactional Email Notifications Active</span>
            </div>
          </div>

          <div className="space-y-3">
            {sampleEvents.map((evt) => (
              <ActivityItem key={evt.id} event={evt} />
            ))}

          </div>
        </div>
      </div>
    </section>
  );
}

