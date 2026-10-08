import { useState, useMemo } from 'react';
import { useProject } from '@/app/providers/ProjectProvider';
import { useApiKeys } from '../hooks/useApiKeys';
import { CreateApiKeyDialog } from '../components/CreateApiKeyDialog';
import { ConfirmationDialog } from '@/components/feedback/ConfirmationDialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingState } from '@/components/feedback/LoadingState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { ApiKeyRow } from '@/components/ui/ApiKeyRow';
import { ApiKey, ApiKeyCreatedResponse } from '@/types';
import { Key, Plus, Search, RefreshCw, Shield, Lock } from 'lucide-react';

export function ApiKeysPage() {
  const { activeProject } = useProject();
  const {
    apiKeys,
    isLoading,
    isError,
    error,
    refetch,
    createApiKey,
    revokeApiKey,
  } = useApiKeys(activeProject?.id);

  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [revokingKey, setRevokingKey] = useState<ApiKey | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  const filteredKeys = useMemo(() => {
    if (!search.trim()) return apiKeys;
    const query = search.toLowerCase();
    return apiKeys.filter(
      (k) => k.name.toLowerCase().includes(query) || k.id.toLowerCase().includes(query)
    );
  }, [apiKeys, search]);

  const activeKeysCount = useMemo(
    () => apiKeys.filter((k) => k.status === 'ACTIVE').length,
    [apiKeys]
  );

  const handleCreateSubmit = async (payload: { name: string; expiresAt?: string | null }): Promise<ApiKeyCreatedResponse> => {
    return await createApiKey(payload);
  };

  const handleRevokeConfirm = async () => {
    if (!revokingKey) return;
    try {
      setIsRevoking(true);
      await revokeApiKey(revokingKey.id);
      setRevokingKey(null);
    } finally {
      setIsRevoking(false);
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading API keys..." />;
  }

  if (isError) {
    return (
      <ErrorState
        title="Failed to Load API Keys"
        message={error instanceof Error ? error.message : 'Could not retrieve project API keys.'}
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">API Access Keys</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Manage application API keys used to authenticate Data Plane database requests.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="space-x-1">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </Button>
          <Button onClick={() => setIsCreateOpen(true)} size="sm" className="space-x-1.5">
            <Plus className="w-4 h-4" />
            <span>Generate New Key</span>
          </Button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="p-5 rounded-2xl bg-[#070F16] border border-sky-900/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start space-x-4">
          <div className="p-3 rounded-xl bg-sky-950/80 border border-sky-800/60 text-sky-400">
            <Shield className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-semibold text-white">Data Plane Authentication</h3>
              <span className="flex items-center text-[10px] font-mono text-sky-400 space-x-1">
                <Lock className="w-3 h-3" />
                <span>SHA-256 Hashed</span>
              </span>
            </div>
            <p className="text-xs text-zinc-400 max-w-2xl">
              Applications send database operations to ShardFlow with header <code className="text-sky-300 font-mono">X-API-Key: &lt;raw_key&gt;</code>. Secret keys are never stored in raw text on the server.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-6 shrink-0 font-mono text-xs border-t md:border-t-0 md:border-l border-zinc-800 pt-3 md:pt-0 md:pl-6">
          <div>
            <div className="text-zinc-500 text-[10px]">ACTIVE KEYS</div>
            <div className="text-lg font-bold text-sky-400">{activeKeysCount}</div>
          </div>
          <div>
            <div className="text-zinc-500 text-[10px]">TOTAL KEYS</div>
            <div className="text-lg font-bold text-white">{apiKeys.length}</div>
          </div>
        </div>
      </div>

      {/* Search Filter */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <Input
            placeholder="Search API keys by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs font-mono"
          />
        </div>
      </div>

      {/* Keys List */}
      {filteredKeys.length === 0 ? (
        <EmptyState
          icon={<Key className="w-6 h-6 text-zinc-400" />}
          title={search ? 'No Matching API Keys' : 'No API Keys Found'}
          description={
            search
              ? 'Try adjusting your search filter.'
              : 'Generate your first project API key to allow applications to connect to the ShardFlow Data Plane.'
          }
          actionLabel={search ? undefined : 'Generate API Key'}
          onAction={search ? undefined : () => setIsCreateOpen(true)}
        />
      ) : (
        <div className="space-y-3">
          {filteredKeys.map((keyItem) => (
            <ApiKeyRow
              key={keyItem.id}
              apiKey={keyItem}
              onRevoke={() => setRevokingKey(keyItem)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateApiKeyDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateSubmit}
      />

      <ConfirmationDialog
        isOpen={Boolean(revokingKey)}
        onClose={() => setRevokingKey(null)}
        onConfirm={handleRevokeConfirm}
        title="Revoke API Key"
        description={`Are you sure you want to revoke key "${revokingKey?.name}"? Any applications using this key will immediately lose access to the ShardFlow Data Plane.`}
        confirmLabel="Revoke Key"
        variant="danger"
        isLoading={isRevoking}
      />
    </div>
  );
}
