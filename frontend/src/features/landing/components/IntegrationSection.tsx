import { useState } from 'react';
import { Tabs } from '@/components/ui/Tabs';
import { Button } from '@/components/ui/Button';
import { Code2, Copy, Check } from 'lucide-react';

export function IntegrationSection() {
  const [activeTab, setActiveTab] = useState('curl');
  const [copied, setCopied] = useState(false);

  const snippets: Record<string, string> = {
    curl: `curl -X POST https://api.shardflow.io/api/v1/data \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: sf_live_a1b2c3d4e5f6g7h8i9j0" \\
  -d '{
    "tenantId": "tenant_acme_inc",
    "operation": "find",
    "collection": "users",
    "filter": { "status": "active" },
    "options": { "limit": 20, "skip": 0 }
  }'`,
    node: `import fetch from 'node-fetch';

const response = await fetch('https://api.shardflow.io/api/v1/data', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': process.env.SHARDFLOW_API_KEY
  },
  body: JSON.stringify({
    tenantId: 'tenant_acme_inc',
    operation: 'find-one',
    collection: 'users',
    filter: { _id: '60d5ec49f1b2c52d88f8e1a1' }
  })
});

const { data } = await response.json();
console.log('Document:', data.document);`,
    env: `# Environment Variable Configuration
SHARDFLOW_API_URL=https://api.shardflow.io/api/v1
SHARDFLOW_API_KEY=sf_live_a1b2c3d4e5f6g7h8i9j0
`,
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(snippets[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="integration" className="py-20 border-b border-emerald-950/80 bg-[#06100B]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="max-w-2xl space-y-3">
          <div className="text-xs font-mono font-medium text-emerald-400 uppercase tracking-wider">Developer Integration</div>
          <h2 className="text-3xl font-bold text-white tracking-tight">
            Simple HTTP REST interface. No native driver complexity.
          </h2>
          <p className="text-sm text-emerald-100/70 leading-relaxed">
            Send structured MongoDB database requests over HTTP with tenant key headers. ShardFlow validates operators and routes to the correct shard.
          </p>
        </div>

        {/* Code Snippet Box */}
        <div className="rounded-xl bg-[#050B08] border border-emerald-900/60 overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between px-4 py-3 bg-[#08150E] border-b border-emerald-900/60">
            <Tabs
              tabs={[
                { id: 'curl', label: 'cURL' },
                { id: 'node', label: 'Node.js / Fetch' },
                { id: 'env', label: '.env Setup' },
              ]}
              activeTab={activeTab}
              onChange={setActiveTab}
              className="border-none pb-0"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="border-emerald-800/60 text-emerald-300 hover:bg-emerald-950/60"
              icon={copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            >
              {copied ? 'Copied' : 'Copy Code'}
            </Button>
          </div>

          <pre className="p-6 font-mono text-xs text-emerald-100/90 overflow-x-auto leading-relaxed">
            <code>{snippets[activeTab]}</code>
          </pre>
        </div>

        {/* Permitted Operator Allowlists */}
        <div className="p-6 rounded-xl bg-[#08120D] border border-emerald-900/60 space-y-4">
          <div className="flex items-center space-x-2 text-xs font-mono text-emerald-400">
            <Code2 className="w-4 h-4" />
            <span>V1 Permitted Operator Allowlist</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
            <div className="space-y-1 p-3 rounded-lg bg-[#050A08] border border-emerald-900/40">
              <span className="text-emerald-400/80 font-semibold block mb-1">Filter Operators</span>
              <span className="text-emerald-300">$eq, $ne, $gt, $gte, $lt, $lte, $in, $nin, $exists</span>
            </div>
            <div className="space-y-1 p-3 rounded-lg bg-[#050A08] border border-emerald-900/40">
              <span className="text-emerald-400/80 font-semibold block mb-1">Logical & Array</span>
              <span className="text-teal-300">$and, $or, $not, $elemMatch</span>
            </div>
            <div className="space-y-1 p-3 rounded-lg bg-[#050A08] border border-emerald-900/40">
              <span className="text-emerald-400/80 font-semibold block mb-1">Update Operators</span>
              <span className="text-cyan-300">$set, $unset, $inc, $min, $max, $mul</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

