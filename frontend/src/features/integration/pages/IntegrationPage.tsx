import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useProject } from '@/app/providers/ProjectProvider';
import { useApiKeys } from '@/features/api-keys/hooks/useApiKeys';
import { env } from '@/app/config/env';
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
  Key,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';

type SupportedOperation = 'find' | 'find-one' | 'insert-one' | 'update-one' | 'delete-one';

export function IntegrationPage() {
  const { activeProject } = useProject();
  const { apiKeys } = useApiKeys(activeProject?.id);

  const defaultApiOrigin = env.apiBaseUrl.replace(/\/api\/v1\/?$/, '') || 'http://localhost:4000';
  const [apiUrl, setApiUrl] = useState<string>(defaultApiOrigin);
  const [customApiKey, setCustomApiKey] = useState<string>('');
  const [selectedLang, setSelectedLang] = useState<'curl' | 'javascript' | 'python'>('javascript');
  const [selectedOp, setSelectedOp] = useState<SupportedOperation>('find');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const effectiveKey = customApiKey.trim() || 'sf_live_your_secret_api_key';
  const effectiveUrl = apiUrl.trim().replace(/\/+$/, '') || 'http://localhost:4000';

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const envSnippet = `# ShardFlow Data Plane Configuration
SHARDFLOW_API_URL=${effectiveUrl}
SHARDFLOW_API_KEY=${effectiveKey}`;

  const getPayloadObject = (op: SupportedOperation) => {
    switch (op) {
      case 'find':
        return {
          tenantId: 'tenant_001',
          operation: 'find',
          collection: 'users',
          filter: { status: 'active' },
          options: { limit: 20 },
        };
      case 'find-one':
        return {
          tenantId: 'tenant_001',
          operation: 'find-one',
          collection: 'users',
          filter: { status: 'active' },
        };
      case 'insert-one':
        return {
          tenantId: 'tenant_001',
          operation: 'insert-one',
          collection: 'users',
          document: {
            name: 'Jane Doe',
            email: 'jane@example.com',
            status: 'active',
          },
        };
      case 'update-one':
        return {
          tenantId: 'tenant_001',
          operation: 'update-one',
          collection: 'users',
          filter: { email: 'jane@example.com' },
          update: {
            $set: { status: 'verified' },
          },
        };
      case 'delete-one':
        return {
          tenantId: 'tenant_001',
          operation: 'delete-one',
          collection: 'users',
          filter: { email: 'jane@example.com' },
        };
    }
  };

  const getCodeSnippet = () => {
    const payload = getPayloadObject(selectedOp);
    const jsonString = JSON.stringify(payload, null, 2);

    if (selectedLang === 'curl') {
      return `curl -X POST ${effectiveUrl}/api/v1/data \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${effectiveKey}" \\
  -d '${jsonString.replace(/\n/g, '\n  ')}'`;
    }

    if (selectedLang === 'javascript') {
      const indentedJson = jsonString
        .split('\n')
        .map((line, idx) => (idx === 0 ? line : `  ${line}`))
        .join('\n');

      return `// ShardFlow Data Plane Integration (Node.js / Fetch)
const apiUrl = process.env.SHARDFLOW_API_URL || '${effectiveUrl}';
const apiKey = process.env.SHARDFLOW_API_KEY || '${effectiveKey}';

const response = await fetch(\`\${apiUrl}/api/v1/data\`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': apiKey,
  },
  body: JSON.stringify(${indentedJson}),
});

const result = await response.json();
console.log(result.data);`;
    }

    // Python snippet
    const pythonPayload = jsonString
      .split('\n')
      .map((line, idx) => (idx === 0 ? line : `    ${line}`))
      .join('\n');

    return `# ShardFlow Data Plane Integration (Python requests)
import os
import requests

api_url = os.getenv("SHARDFLOW_API_URL", "${effectiveUrl}")
api_key = os.getenv("SHARDFLOW_API_KEY", "${effectiveKey}")

payload = ${pythonPayload}

response = requests.post(
    f"{api_url}/api/v1/data",
    headers={
        "Content-Type": "application/json",
        "X-API-Key": api_key,
    },
    json=payload,
)

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
          <span>ShardFlow Architecture Boundary</span>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-black/60 border border-zinc-800 text-xs font-mono">
          <div className="flex items-center space-x-2 text-emerald-300">
            <Server className="w-4 h-4 text-emerald-400" />
            <span>Your Application</span>
          </div>
          <ArrowRight className="w-4 h-4 text-zinc-500 hidden md:block" />
          <div className="flex items-center space-x-2 text-sky-300">
            <Layers className="w-4 h-4 text-sky-400" />
            <span>ShardFlow Data Plane (:4000)</span>
          </div>
          <ArrowRight className="w-4 h-4 text-zinc-500 hidden md:block" />
          <div className="flex items-center space-x-2 text-purple-300">
            <Database className="w-4 h-4 text-purple-400" />
            <span>Target MongoDB Shard</span>
          </div>
        </div>
      </div>

      {/* Step 1: Environment Configuration */}
      <div className="space-y-4 p-5 rounded-2xl bg-[#06080A] border border-zinc-800/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <FileCode className="w-4 h-4 text-sky-400" />
            <span>1. Environment Variables (.env)</span>
          </h3>

          <Link
            to="/app/api-keys"
            className="inline-flex items-center space-x-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors font-mono"
          >
            <Key className="w-3.5 h-3.5" />
            <span>Manage API Keys</span>
            <ExternalLink className="w-3 h-3 ml-0.5" />
          </Link>
        </div>

        {/* Inputs for Customization */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
          <div className="space-y-1.5">
            <label className="text-zinc-400 block font-sans text-xs">
              ShardFlow API URL
            </label>
            <input
              type="text"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="http://localhost:4000"
              className="w-full px-3 py-2 rounded-lg bg-black border border-zinc-800 text-zinc-200 focus:outline-none focus:border-sky-500 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-zinc-400 block font-sans text-xs">
              Secret API Key (<code className="text-sky-300">sf_live_...</code>)
            </label>
            <input
              type="text"
              value={customApiKey}
              onChange={(e) => setCustomApiKey(e.target.value)}
              placeholder="Paste your sf_live_... key to preview"
              className="w-full px-3 py-2 rounded-lg bg-black border border-zinc-800 text-zinc-200 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>

        {/* Key Security Notice */}
        <div className="flex items-start space-x-2 p-3 rounded-xl bg-amber-950/20 border border-amber-900/40 text-[11px] text-amber-200/80 leading-relaxed font-sans">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span>
              API secret keys are hashed in the database and only revealed once during creation.
              {apiKeys.length > 0 ? (
                <> Active keys found in this project: <strong className="text-amber-100">{apiKeys.map(k => k.name).join(', ')}</strong>. If you do not have the raw secret key saved, create a new one in the <Link to="/app/api-keys" className="underline text-amber-300 hover:text-white">API Keys section</Link>.</>
              ) : (
                <> You don't have any API keys created yet. <Link to="/app/api-keys" className="underline text-amber-300 hover:text-white">Generate your first key</Link> to start sending data queries.</>
              )}
            </span>
          </div>
        </div>

        {/* Snippet Display */}
        <div className="relative group">
          <pre className="p-4 rounded-xl bg-black border border-zinc-800 text-sky-300 font-mono text-xs overflow-x-auto leading-relaxed">
            {envSnippet}
          </pre>
          <button
            onClick={() => copyToClipboard(envSnippet, 'env')}
            className="absolute top-3 right-3 p-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Copy .env snippet"
          >
            {copiedSection === 'env' ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Step 2: Interactive Code Snippets */}
      <div className="space-y-4 p-5 rounded-2xl bg-[#06080A] border border-zinc-800/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Code className="w-4 h-4 text-emerald-400" />
            <span>2. Data Plane API Operations</span>
          </h3>

          {/* Language Selector */}
          <div className="flex items-center p-1 rounded-lg bg-zinc-900 border border-zinc-800 font-mono text-xs">
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

        {/* Operation Picker Tabs */}
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
          {(['find', 'find-one', 'insert-one', 'update-one', 'delete-one'] as const).map((op) => (
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
          <pre className="p-5 rounded-xl bg-black border border-zinc-800 text-zinc-200 font-mono text-xs overflow-x-auto leading-relaxed">
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
