import { ConfirmationDialog } from '@/components/feedback/ConfirmationDialog';
import { Shard } from '@/types';
import { useToast } from '@/components/feedback/Toast';

export interface DisableShardDialogProps {
  isOpen: boolean;
  shard: Shard | null;
  onClose: () => void;
  onConfirm: (shardId: string) => Promise<unknown>;
  isDisabling?: boolean;
}

export function DisableShardDialog({
  isOpen,
  shard,
  onClose,
  onConfirm,
  isDisabling = false,
}: DisableShardDialogProps) {
  const { toast } = useToast();

  if (!shard) return null;

  const handleConfirm = async () => {
    try {
      await onConfirm(shard.id);
      toast('warning', 'Shard disabled', `Shard "${shard.name}" has been set to DISABLED.`);
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to disable shard';
      toast('error', 'Action failed', msg);
    }
  };

  return (
    <ConfirmationDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleConfirm}
      title={`Disable Shard "${shard.name}"?`}
      description="Disabling a shard marks it inactive for tenant routing. Note: Disabling a shard does not automatically migrate existing customer data or rebalance tenant mappings."
      confirmLabel="Disable Shard"
      variant="danger"
      isLoading={isDisabling}
    />
  );
}
