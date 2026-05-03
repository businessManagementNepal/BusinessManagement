import { SyncScope } from "@/shared/sync/types/syncScope.types";

export type SyncExecutionScope = SyncScope & {
  remoteOwnerUserRemoteId?: string | null;
  remoteAccountRemoteId?: string | null;
};

export const toRemoteSyncScope = (
  scope: SyncExecutionScope,
): SyncScope => ({
  deviceId: scope.deviceId,
  ownerUserRemoteId:
    scope.remoteOwnerUserRemoteId?.trim() || scope.ownerUserRemoteId,
  accountRemoteId: scope.remoteAccountRemoteId?.trim() || scope.accountRemoteId,
  schemaVersion: scope.schemaVersion,
});
