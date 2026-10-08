import { useState } from 'react';
import { useProject } from '@/app/providers/ProjectProvider';
import { useApiKeys } from '@/features/api-keys/hooks/useApiKeys';
import { Select } from '@/components/ui/Select';
import {
  Code,
  Copy,
  Check,
  Terminal,
  Server,
  Layers,
  ArrowRight,
  Database,
  FileCode,
} from 'lucide-react';

export function IntegrationPage() {
  const { activeProject } = useProject();
  const { apiKeys } = useApiKeys(activeProject?.id);

  const [selectedApiKey, setSelectedApiKey] = useState<string>('');
  const [selectedLang, setSelectedLang] = useState<'curl' | 'javascript' | 'python'>('javascript');
  const [selectedOp, setSelectedOp] = useState<'find' | 'insert-one' | 'update-one' | 'delete-one'>('find');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const effectiveKey = selectedApiKey || (apiKeys.length > 0 ? apiKeys[0].id : '<YOUR_API_KEY>');

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const envSnippet = `SHARDFLOW_API_URL=http://localhost:3000
SHARDFLOW_API_KEY=${effectiveKey}`;

  const getCodeSnippet = () => {
    if (selectedLang === 'curl') {
      return `curl -X POST http://localhost:3000/api/v1/data \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${effectiveKey}" \\
  -d '{
    "tenantId": "tenant_001",
    "operation": "${selectedOp}",
    "collection": "users",
    "filter": { "status": "active" }${selectedOp === 'insert-one' ? ',\n    "doc": { "name": "Jane Doe", "email": "jane@example.com" }' : ''}
  }'`;
    }

    if (selectedLang === 'javascript') {
      return `// ShardFlow Data Plane Integration (Node.js / Fetch)
const response = await fetch('http://localhost:3000/api/v1/data', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': process.env.SHARDFLOW_API_KEY,
  },
  body: JSON.stringify({
    tenantId: 'tenant_001',
    operation: '${selectedOp}',
    collection: 'users',
    filter: { status: 'active' },${selectedOp === 'insert-one' ? '\n    doc: { name: "Jane Doe", email: "jane@example.com" },' : ''}
  }),
});

const result = await response.json();
console.log(result.data);`;
    }

    return `# ShardFlow Data Plane Integration (Python requests)
import requests
import os

url = "http://localhost:3000/api/v1/data"
headers = {
    "Content-Type": "application/json",
    "X-API-Key": os.getenv("SHARDFLOW_API_KEY")
}
payload = {
    "tenantId": "tenant_001",
    "operation": "${selectedOp}",
    "collection": "users",
    "filter": {"status": "active"}
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Developer Integration Guide</h1>
        <p className="text-xs text-zinc-400 mt-1">
          Connect your application to the ShardFlow Data Plane for tenant-aware MongoDB routing.
        </p>
      </div>

      {/* Architecture Overview Banner */}
      <div className="p-6 rounded-2xl bg-[#091017] border border-sky-900/60 space-y-4">
        <div className="flex items-center space-x-2 text-sky-400 font-mono text-xs">
          <Terminal className="w-4 h-4" />
          <span>ShardFlow Application Boundary</span>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-black/60 border border-zinc-800 text-xs font-mono">
          <div className="flex items-center space-x-2 text-emerald-300">
            <Server className="w-4 h-4 text-emerald-400" />
            <span>Your Application</span>
          </div>
          <ArrowRight className="w-4 h-4 text-zinc-500 hidden md:block" />
          <div className="flex items-center space-x-2 text-sky-300">
            <Layers className="w-4 h-4 text-sky-400" />
            <span>ShardFlow Data Plane</span>
          </div>
          <ArrowRight className="w-4 h-4 text-zinc-500 hidden md:block" />
          <div className="flex items-center space-x-2 text-purple-300">
            <Database className="w-4 h-4 text-purple-400" />
            <span>MongoDB Shard Node</span>
          </div>
        </div>
      </div>

      {/* Environment Config Snippet */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <FileCode className="w-4 h-4 text-sky-400" />
            <span>1. Environment Variables (.env)</span>
          </h3>

          {apiKeys.length > 0 && (
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-zinc-400">Insert Key:</span>
              <Select
                value={selectedApiKey}
                onChange={(e) => setSelectedApiKey(e.target.value)}
                options={[
                  { value: '', label: 'Select API Key...' },
                  ...apiKeys.map((k) => ({ value: k.id, label: k.name })),
                ]}
              />
            </div>
          )}
        </div>

        <div className="relative group">
          <pre className="p-4 rounded-xl bg-black border border-zinc-800 text-sky-300 font-mono text-xs overflow-x-auto">
            {envSnippet}
          </pre>
          <button
            onClick={() => copyToClipboard(envSnippet, 'env')}
            className="absolute top-3 right-3 p-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            {copiedSection === 'env' ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Interactive Code Snippets */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Code className="w-4 h-4 text-emerald-400" />
            <span>2. Data Plane API Operations</span>
          </h3>

          <div className="flex items-center space-x-2 font-mono text-xs">
            {/* Language Selector */}
            <div className="flex items-center p-1 rounded-lg bg-zinc-900 border border-zinc-800">
              {(['javascript', 'python', 'curl'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setSelectedLang(lang)}
                  className={`px-3 py-1 rounded-md text-[11px] transition-colors ${
                    selectedLang === lang
                      ? 'bg-sky-950 text-sky-300 font-bold border border-sky-800/60'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Operation Picker Tabs */}
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
          {(['find', 'insert-one', 'update-one', 'delete-one'] as const).map((op) => (
            <button
              key={op}
              onClick={() => setSelectedOp(op)}
              className={`px-3 py-1.5 rounded-lg border text-[11px] transition-colors ${
                selectedOp === op
                  ? 'bg-emerald-950 border-emerald-700 text-emerald-300 font-bold'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {op}
            </button>
          ))}
        </div>

        {/* Code Box */}
        <div className="relative group">
          <pre className="p-5 rounded-2xl bg-[#06080A] border border-zinc-800 text-zinc-200 font-mono text-xs overflow-x-auto leading-relaxed">
            {getCodeSnippet()}
          </pre>
          <button
            onClick={() => copyToClipboard(getCodeSnippet(), 'code')}
            className="absolute top-4 right-4 p-2 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors flex items-center space-x-1.5 text-xs font-mono"
          >
            {copiedSection === 'code' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
