import { SyncExecutionScope } from "../types/syncExecutionScope.types";

const clonePayload = (
  payload: Record<string, unknown>,
): Record<string, unknown> => ({ ...payload });

const mapScopedIdentityFields = ({
  payload,
  ownerUserRemoteId,
  accountRemoteId,
}: {
  payload: Record<string, unknown>;
  ownerUserRemoteId: string;
  accountRemoteId: string;
}): Record<string, unknown> => {
  const nextPayload = clonePayload(payload);

  if ("owner_user_remote_id" in nextPayload) {
    nextPayload.owner_user_remote_id = ownerUserRemoteId;
  }

  if ("account_remote_id" in nextPayload) {
    nextPayload.account_remote_id = accountRemoteId;
  }

  if ("business_account_remote_id" in nextPayload) {
    nextPayload.business_account_remote_id = accountRemoteId;
  }

  if ("scope_account_remote_id" in nextPayload) {
    nextPayload.scope_account_remote_id = accountRemoteId;
  }

  return nextPayload;
};

export const mapLocalScopedPayloadToRemote = (
  payload: Record<string, unknown>,
  scope: SyncExecutionScope,
): Record<string, unknown> => {
  const ownerUserRemoteId =
    scope.remoteOwnerUserRemoteId?.trim() || scope.ownerUserRemoteId;
  const accountRemoteId =
    scope.remoteAccountRemoteId?.trim() || scope.accountRemoteId;

  return mapScopedIdentityFields({
    payload,
    ownerUserRemoteId,
    accountRemoteId,
  });
};

export const mapRemoteScopedPayloadToLocal = (
  payload: Record<string, unknown>,
  scope: SyncExecutionScope,
): Record<string, unknown> => {
  return mapScopedIdentityFields({
    payload,
    ownerUserRemoteId: scope.ownerUserRemoteId,
    accountRemoteId: scope.accountRemoteId,
  });
};
