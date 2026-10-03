import { useState } from 'react';
import { Database, Code2, Cpu, Zap, Activity } from 'lucide-react';

export function InfraVisualization() {
  const [activeShard, setActiveShard] = useState<number>(0);

  const shards = [
    {
      id: '01',
      name: 'Shard 01',
      type: 'MongoDB',
      status: 'Healthy',
      latency: '12ms',
      connections: '42/100',
      usage: '34%',
      glowColor: 'border-emerald-500/60 shadow-emerald-500/25',
    },
    {
      id: '02',
      name: 'Shard 02',
      type: 'MongoDB',
      status: 'Healthy',
      latency: '18ms',
      connections: '37/100',
      usage: '28%',
      glowColor: 'border-teal-500/50 shadow-teal-500/20',
    },
    {
      id: '03',
      name: 'Shard 03',
      type: 'MongoDB',
      status: 'Healthy',
      latency: '16ms',
      connections: '29/100',
      usage: '22%',
      glowColor: 'border-cyan-500/50 shadow-cyan-500/20',
    },
  ];

  return (
    <div className="w-full rounded-2xl bg-[#06100B]/95 border border-emerald-900/60 p-6 md:p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
      {/* Background Mesh and Radial Glow */}
      <div className="absolute inset-0 bg-grid-mesh opacity-30 pointer-events-none" />
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Grid Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        
        {/* Left Column: Application Box & API Request */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-5 rounded-xl bg-[#0B1A13] border border-emerald-800/60 shadow-xl space-y-4">
            <div className="flex items-center space-x-3 text-emerald-400 font-semibold text-sm">
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                <Code2 className="w-4 h-4" />
              </div>
              <span className="text-white text-base">Your Application</span>
            </div>

            <div className="space-y-2 pl-2">
              {[
                'Web App',
                'Mobile App',
                'Backend Service',
                'Any MongoDB Driver',
              ].map((item, idx) => (
                <div key={item} className="flex items-center space-x-2 text-xs text-emerald-200/70">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className={idx === 1 ? 'text-emerald-300 font-semibold' : ''}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* API Request Badge */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-[#0A1610] border border-emerald-800/50 text-xs font-mono text-emerald-200 shadow-md">
            <span className="text-emerald-300/70 font-sans font-medium">API Request</span>
            <span className="px-2.5 py-1 rounded bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-semibold">
              tenantId: 1234
            </span>
          </div>
        </div>

        {/* Center Column: Top Engine Box & 3D ShardFlow Hub */}
        <div className="lg:col-span-4 flex flex-col items-center justify-between space-y-6">
          
          {/* Top Engine Features Box */}
          <div className="w-full max-w-xs p-4 rounded-xl bg-[#0B1A13] border border-emerald-500/30 shadow-lg shadow-emerald-950/40 space-y-3">
            <div className="flex items-start space-x-3">
              <Cpu className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-white">Routing Engine</div>
                <div className="text-[11px] text-emerald-300/70">Smart tenant → shard routing</div>
              </div>
            </div>

            <div className="flex items-start space-x-3 border-t border-emerald-900/60 pt-2.5">
              <Zap className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-white">Connection Pool</div>
                <div className="text-[11px] text-emerald-300/70">Optimized database connections</div>
              </div>
            </div>

            <div className="flex items-start space-x-3 border-t border-emerald-900/60 pt-2.5">
              <Activity className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-white">Health Monitor</div>
                <div className="text-[11px] text-emerald-300/70">Real-time shard health & recovery</div>
              </div>
            </div>
          </div>

          {/* Central 3D Stacked Hub */}
          <div className="relative flex flex-col items-center justify-center my-4 group cursor-pointer" onClick={() => setActiveShard((prev) => (prev + 1) % 3)}>
            <div className="w-32 h-32 rounded-2xl bg-gradient-to-b from-emerald-600/30 via-teal-600/20 to-cyan-600/30 border border-emerald-400/50 shadow-2xl shadow-emerald-500/30 flex flex-col items-center justify-center relative overflow-hidden backdrop-blur-md transform group-hover:scale-105 transition-transform duration-300">
              
              {/* Stacked glowing layer effects */}
              <div className="absolute inset-x-2 top-2 h-1 bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 rounded-full blur-[1px]" />
              <div className="absolute inset-x-4 top-5 h-0.5 bg-emerald-300/50 rounded-full" />
              <div className="absolute inset-x-4 bottom-5 h-0.5 bg-teal-400/50 rounded-full" />
              
              {/* Central Logo */}
              <div className="p-3 rounded-xl bg-[#06120C] border border-emerald-400/50 shadow-inner flex items-center justify-center">
                <Database className="w-8 h-8 text-emerald-400 animate-pulse" />
              </div>

              <span className="text-sm font-extrabold text-white mt-2 tracking-tight">ShardFlow</span>
            </div>

            {/* Glowing Connection Light Streams */}
            <div className="absolute -z-10 inset-0 flex items-center justify-center">
              <div className="w-48 h-48 bg-emerald-500/15 rounded-full blur-2xl" />
            </div>
          </div>
        </div>

        {/* Right Column: 3 MongoDB Shard Cards */}
        <div className="lg:col-span-4 space-y-4">
          {shards.map((shard, index) => {
            const isActive = activeShard === index;
            return (
              <div
                key={shard.id}
                onClick={() => setActiveShard(index)}
                className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer ${
                  isActive
                    ? `bg-[#0C1D15] ${shard.glowColor} border-l-4 border-l-emerald-400 scale-[1.02] shadow-lg`
                    : 'bg-[#0A1610]/80 border-emerald-950 hover:border-emerald-800/80 opacity-85'
                }`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-emerald-900/60">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-6 h-6 rounded-md bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                      <span className="text-emerald-400 text-xs">🍃</span>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{shard.name}</h4>
                      <p className="text-[10px] text-emerald-300/60">{shard.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1.5 text-xs text-emerald-400 font-medium">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>{shard.status}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-3 text-center font-mono">
                  <div>
                    <div className="text-[10px] text-emerald-400/60 uppercase">Latency</div>
                    <div className="text-xs font-bold text-emerald-100">{shard.latency}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-emerald-400/60 uppercase">Connections</div>
                    <div className="text-xs font-bold text-emerald-100">{shard.connections}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-emerald-400/60 uppercase">Usage</div>
                    <div className="text-xs font-bold text-emerald-100">{shard.usage}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

