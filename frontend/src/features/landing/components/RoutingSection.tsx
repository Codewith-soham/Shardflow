import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Route, ArrowRight, Database } from 'lucide-react';

export function RoutingSection() {
  const sampleMappings = [
    { tenantId: 'tenant_acme_inc', shard: 'shard-01 (US East Primary)', status: 'ACTIVE' },
    { tenantId: 'tenant_stark_ind', shard: 'shard-01 (US East Primary)', status: 'ACTIVE' },
    { tenantId: 'tenant_cyberdyne', shard: 'shard-02 (EU Central Primary)', status: 'ACTIVE' },
    { tenantId: 'tenant_wayne_ent', shard: 'shard-03 (US West Primary)', status: 'ACTIVE' },
  ];

  return (
    <section id="routing" className="py-20 border-b border-emerald-950/80 bg-[#050807]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <div className="text-xs font-mono font-medium text-emerald-400 uppercase tracking-wider">Deterministic Routing Engine</div>
            <h2 className="text-3xl font-bold text-white tracking-tight">
              Predictable tenant-to-shard mapping. No random load balancing.
            </h2>
            <p className="text-sm text-emerald-100/70 leading-relaxed">
              ShardFlow enforces deterministic routing. Requests with a specific tenantId always resolve to the configured target database shard.
            </p>
          </div>

          <Badge variant="emerald" size="md" icon={<Route className="w-3.5 h-3.5" />}>
            TENANT_BASED Strategy
          </Badge>
        </div>

        {/* Interactive Mapping Table Preview */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-emerald-300/70 px-1">
            <span>Project Routing Mappings</span>
            <span className="text-emerald-400 font-semibold">100% Deterministic Guarantee</span>
          </div>

          <Table className="bg-[#08120D] border-emerald-900/60">
            <TableHeader className="bg-[#050B08]">
              <TableRow className="border-emerald-900/60">
                <TableHead className="text-emerald-400 font-mono">Tenant ID (Routing Key)</TableHead>
                <TableHead className="text-emerald-400 font-mono">Target Shard Mapping</TableHead>
                <TableHead className="text-emerald-400 font-mono">Mapping Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sampleMappings.map((m) => (
                <TableRow key={m.tenantId} className="border-emerald-900/40 hover:bg-emerald-950/30">
                  <TableCell className="font-mono text-white font-semibold">{m.tenantId}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2 text-emerald-200 font-mono">
                      <ArrowRight className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <Database className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                      <span>{m.shard}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="emerald" size="sm">{m.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </section>
  );
}

