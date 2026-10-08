import { useState, useMemo } from 'react';
import { useProject } from '@/app/providers/ProjectProvider';
import { useRouting } from '../hooks/useRouting';
import { useShards } from '@/features/shards/hooks/useShards';
import { CreateMappingDialog } from '../components/CreateMappingDialog';
import { UpdateMappingDialog } from '../components/UpdateMappingDialog';
import { ConfirmationDialog } from '@/components/feedback/ConfirmationDialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingState } from '@/components/feedback/LoadingState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { TenantMappingRow } from '@/components/ui/TenantMappingRow';
import { TenantMapping } from '@/types';
import {
  GitFork,
  Plus,
  Search,
  RefreshCw,
  Layers,
  CheckCircle2,
} from 'lucide-react';

export function RoutingPage() {
  const { activeProject } = useProject();
  const {
    config,
    mappings,
    isMappingsLoading,
    isError,
    error,
    refetch,
    createMapping,
    updateMapping,
    deleteMapping,
  } = useRouting(activeProject?.id);

  const { shards } = useShards(activeProject?.id);

  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingMapping, setEditingMapping] = useState<TenantMapping | null>(null);
  const [deletingMapping, setDeletingMapping] = useState<TenantMapping | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Map shardId to Shard object for quick lookup
  const shardMap = useMemo(() => {
    const map = new Map<string, string>();
    shards.forEach((s) => map.set(s.id, s.name));
    return map;
  }, [shards]);

  const filteredMappings = useMemo(() => {
    if (!search.trim()) return mappings;
    const query = search.toLowerCase();
    return mappings.filter(
      (m) =>
        m.tenantId.toLowerCase().includes(query) ||
        m.shardId.toLowerCase().includes(query) ||
        (shardMap.get(m.shardId) || '').toLowerCase().includes(query)
    );
  }, [mappings, search, shardMap]);

  const handleCreateSuccess = async (tenantId: string, shardId: string) => {
    await createMapping({ tenantId, shardId });
  };

  const handleUpdateSuccess = async (tenantId: string, shardId: string) => {
    await updateMapping({ tenantId, shardId });
  };

  const handleDeleteConfirm = async () => {
    if (!deletingMapping) return;
    try {
      setIsDeleting(true);
      await deleteMapping(deletingMapping.tenantId);
      setDeletingMapping(null);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isMappingsLoading) {
    return <LoadingState message="Loading tenant routing table..." />;
  }

  if (isError) {
    return (
      <ErrorState
        title="Failed to Load Routing Rules"
        message={error instanceof Error ? error.message : 'Could not fetch tenant-shard mappings.'}
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-white tracking-tight">Tenant Routing Table</h1>
            <span className="px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-800/60 text-[10px] font-mono text-emerald-400">
              {config?.strategy || 'TENANT_BASED'}
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Map incoming tenant identifiers to dedicated MongoDB shard nodes in your cluster.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="space-x-1">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </Button>
          <Button onClick={() => setIsCreateOpen(true)} size="sm" className="space-x-1.5">
            <Plus className="w-4 h-4" />
            <span>New Mapping</span>
          </Button>
        </div>
      </div>

      {/* Infrastructure Strategy Banner */}
      <div className="p-5 rounded-2xl bg-[#09140E] border border-emerald-900/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start space-x-4">
          <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-800/60 text-emerald-400">
            <GitFork className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-semibold text-white">Deterministic Shard Routing</h3>
              <span className="flex items-center text-[10px] font-mono text-emerald-400 space-x-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Active Layer</span>
              </span>
            </div>
            <p className="text-xs text-zinc-400 max-w-2xl">
              ShardFlow inspects <code className="text-emerald-300 font-mono">tenantId</code> on each Data Plane request and resolves the connection pool for the corresponding MongoDB shard automatically.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-6 shrink-0 font-mono text-xs border-t md:border-t-0 md:border-l border-zinc-800 pt-3 md:pt-0 md:pl-6">
          <div>
            <div className="text-zinc-500 text-[10px]">TOTAL MAPPINGS</div>
            <div className="text-lg font-bold text-emerald-400">{mappings.length}</div>
          </div>
          <div>
            <div className="text-zinc-500 text-[10px]">SHARDS ONLINE</div>
            <div className="text-lg font-bold text-white">{shards.length}</div>
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <Input
            placeholder="Search by tenant ID or shard name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 font-mono text-xs"
          />
        </div>
      </div>

      {/* Mappings List / Empty State */}
      {filteredMappings.length === 0 ? (
        <EmptyState
          icon={<Layers className="w-6 h-6 text-zinc-400" />}
          title={search ? 'No Matching Mappings Found' : 'No Tenant Mappings Registered'}
          description={
            search
              ? 'Try adjusting your search query.'
              : 'Add your first tenant-to-shard mapping to begin routing application traffic.'
          }
          actionLabel={search ? undefined : 'Add First Mapping'}
          onAction={search ? undefined : () => setIsCreateOpen(true)}
        />
      ) : (
        <div className="space-y-3">
          {filteredMappings.map((mapping) => (
            <TenantMappingRow
              key={mapping.tenantId}
              mapping={mapping}
              shardName={shardMap.get(mapping.shardId) || mapping.shardId}
              onEdit={() => setEditingMapping(mapping)}
              onDelete={() => setDeletingMapping(mapping)}
            />
          ))}
        </div>
      )}

      {/* Dialog Modals */}
      <CreateMappingDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={handleCreateSuccess}
        shards={shards}
      />

      <UpdateMappingDialog
        isOpen={Boolean(editingMapping)}
        onClose={() => setEditingMapping(null)}
        mapping={editingMapping}
        onSuccess={handleUpdateSuccess}
        shards={shards}
      />

      <ConfirmationDialog
        isOpen={Boolean(deletingMapping)}
        onClose={() => setDeletingMapping(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Tenant Mapping"
        description={`Are you sure you want to remove the routing mapping for "${deletingMapping?.tenantId}"? Unmapped tenant requests will fail until re-assigned.`}
        confirmLabel="Remove Mapping"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
