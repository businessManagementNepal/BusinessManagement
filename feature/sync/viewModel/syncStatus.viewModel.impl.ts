import { GetAccountByRemoteIdUseCase } from "@/feature/auth/accountSelection/useCase/getAccountByRemoteId.useCase";
import { GetSyncFeatureFlagUseCase } from "../useCase/getSyncFeatureFlag.useCase";
import { GetSyncStatusUseCase } from "../useCase/getSyncStatus.useCase";
import { RunManualSyncUseCase } from "../useCase/runManualSync.useCase";
import { UpdateSyncFeatureFlagUseCase } from "../useCase/updateSyncFeatureFlag.useCase";
import { getV1SyncRolloutTables } from "../config/syncTableRollout.config";
import { SyncStatusViewModel } from "./syncStatus.viewModel";
import { useCallback, useEffect, useMemo, useState } from "react";

type Params = {
  activeUserRemoteId: string | null;
  activeAccountRemoteId: string | null;
  runtimeError: Error | null;
  getSyncFeatureFlagUseCase: GetSyncFeatureFlagUseCase | null;
  updateSyncFeatureFlagUseCase: UpdateSyncFeatureFlagUseCase | null;
  getSyncStatusUseCase: GetSyncStatusUseCase | null;
  runManualSyncUseCase: RunManualSyncUseCase | null;
  getAccountByRemoteIdUseCase: GetAccountByRemoteIdUseCase;
  getDeviceId: () => Promise<string>;
  schemaVersion: number;
};

const EMPTY_STATUS = {
  pendingChangesCount: 0,
  conflictCount: 0,
  failedRecordsCount: 0,
  lastSyncedAt: null as number | null,
  isRunning: false,
};

const formatLastSyncedLabel = (timestamp: number | null): string => {
  if (timestamp === null) {
    return "Not synced yet";
  }

  return new Date(timestamp).toLocaleString();
};

const resolveStatusLabel = ({
  isLoading,
  isRunning,
  syncEnabled,
  errorMessage,
}: {
  isLoading: boolean;
  isRunning: boolean;
  syncEnabled: boolean;
  errorMessage: string | null;
}): string => {
  if (isLoading) {
    return "Loading sync status";
  }

  if (isRunning) {
    return "Sync in progress";
  }

  if (!syncEnabled) {
    return "Sync disabled";
  }

  if (errorMessage) {
    return "Sync attention required";
  }

  return "Ready for manual sync";
};

export const useSyncStatusViewModel = ({
  activeUserRemoteId,
  activeAccountRemoteId,
  runtimeError,
  getSyncFeatureFlagUseCase,
  updateSyncFeatureFlagUseCase,
  getSyncStatusUseCase,
  runManualSyncUseCase,
  getAccountByRemoteIdUseCase,
  getDeviceId,
  schemaVersion,
}: Params): SyncStatusViewModel => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingPreference, setIsSavingPreference] = useState(false);
  const [isRunningManualSync, setIsRunningManualSync] = useState(false);
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [pendingCount, setPendingCount] = useState(EMPTY_STATUS.pendingChangesCount);
  const [conflictCount, setConflictCount] = useState(EMPTY_STATUS.conflictCount);
  const [failedCount, setFailedCount] = useState(EMPTY_STATUS.failedRecordsCount);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(
    EMPTY_STATUS.lastSyncedAt,
  );
  const [isRunning, setIsRunning] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadSyncStatus = useCallback(async () => {
    setIsLoading(true);

    const syncFlagResult = getSyncFeatureFlagUseCase
      ? await getSyncFeatureFlagUseCase.execute()
      : {
          success: true as const,
          value: { syncEnabled: false },
        };

    if (!syncFlagResult.success) {
      setErrorMessage(syncFlagResult.error.message);
      setIsLoading(false);
      return;
    }

    setSyncEnabled(syncFlagResult.value.syncEnabled);

    if (runtimeError) {
      setPendingCount(0);
      setConflictCount(0);
      setFailedCount(0);
      setLastSyncedAt(null);
      setIsRunning(false);
      setErrorMessage(runtimeError.message);
      setIsLoading(false);
      return;
    }

    if (!activeUserRemoteId?.trim()) {
      setPendingCount(0);
      setConflictCount(0);
      setFailedCount(0);
      setLastSyncedAt(null);
      setIsRunning(false);
      setErrorMessage("Sync requires an active user session.");
      setIsLoading(false);
      return;
    }

    if (!activeAccountRemoteId?.trim() || !getSyncStatusUseCase) {
      setPendingCount(0);
      setConflictCount(0);
      setFailedCount(0);
      setLastSyncedAt(null);
      setIsRunning(false);
      setErrorMessage("Sync requires an active account.");
      setIsLoading(false);
      return;
    }

    const accountResult =
      await getAccountByRemoteIdUseCase.execute(activeAccountRemoteId);
    if (!accountResult.success) {
      setErrorMessage(accountResult.error.message);
      setIsLoading(false);
      return;
    }

    if (!accountResult.value) {
      setErrorMessage("Sync requires an active account.");
      setIsLoading(false);
      return;
    }

    const deviceId = await getDeviceId();
    const syncStatusResult = await getSyncStatusUseCase.execute({
      deviceId,
      ownerUserRemoteId: accountResult.value.ownerUserRemoteId,
      accountRemoteId: accountResult.value.remoteId,
      schemaVersion,
    });

    if (!syncStatusResult.success) {
      setErrorMessage(syncStatusResult.error.message);
      setIsLoading(false);
      return;
    }

    setPendingCount(syncStatusResult.value.pendingChangesCount);
    setConflictCount(syncStatusResult.value.conflictCount);
    setFailedCount(syncStatusResult.value.failedRecordsCount);
    setLastSyncedAt(syncStatusResult.value.lastSyncedAt);
    setIsRunning(syncStatusResult.value.isRunning);
    setErrorMessage(null);
    setIsLoading(false);
  }, [
    activeAccountRemoteId,
    activeUserRemoteId,
    getAccountByRemoteIdUseCase,
    getDeviceId,
    getSyncFeatureFlagUseCase,
    getSyncStatusUseCase,
    runtimeError,
    schemaVersion,
  ]);

  useEffect(() => {
    void loadSyncStatus();
  }, [loadSyncStatus]);

  const onToggleSyncEnabled = useCallback(
    async (enabled: boolean) => {
      if (!updateSyncFeatureFlagUseCase) {
        setErrorMessage(runtimeError?.message ?? "Sync runtime is unavailable.");
        return;
      }

      setIsSavingPreference(true);
      const result = await updateSyncFeatureFlagUseCase.execute(enabled);
      if (!result.success) {
        setErrorMessage(result.error.message);
        setIsSavingPreference(false);
        return;
      }

      setSyncEnabled(result.value.syncEnabled);
      setErrorMessage(runtimeError?.message ?? null);
      setSuccessMessage(
        result.value.syncEnabled
          ? "Sync enabled for staged V1 tables."
          : "Sync disabled. Local-first mode remains active.",
      );
      setIsSavingPreference(false);
      await loadSyncStatus();
    },
    [loadSyncStatus, runtimeError, updateSyncFeatureFlagUseCase],
  );

  const onRunManualSync = useCallback(async () => {
    if (!runManualSyncUseCase) {
      setErrorMessage(runtimeError?.message ?? "Sync runtime is unavailable.");
      return;
    }

    setIsRunningManualSync(true);
    setSuccessMessage(null);
    const result = await runManualSyncUseCase.execute({
      activeUserRemoteId,
      activeAccountRemoteId,
    });

    if (!result.success) {
      setErrorMessage(result.error.message);
      setIsRunningManualSync(false);
      await loadSyncStatus();
      return;
    }

    setErrorMessage(runtimeError?.message ?? null);
    setSuccessMessage(
      `Manual sync completed. Pushed ${result.value.pushedCount}, pulled ${result.value.pulledCount}.`,
    );
    setIsRunningManualSync(false);
    await loadSyncStatus();
  }, [
    activeAccountRemoteId,
    activeUserRemoteId,
    loadSyncStatus,
    runManualSyncUseCase,
    runtimeError,
  ]);

  const rolloutLabel = useMemo(() => {
    return `V1 staging tables: ${getV1SyncRolloutTables().join(", ")}. Financial and workflow tables remain local-only for now.`;
  }, []);

  return useMemo(
    () => ({
      isLoading,
      isSavingPreference,
      isRunningManualSync,
      syncEnabled,
      statusLabel: resolveStatusLabel({
        isLoading,
        isRunning: isRunning || isRunningManualSync,
        syncEnabled,
        errorMessage,
      }),
      rolloutLabel,
      pendingCount,
      conflictCount,
      failedCount,
      lastSyncedLabel: formatLastSyncedLabel(lastSyncedAt),
      errorMessage,
      successMessage,
      canRunManualSync:
        syncEnabled &&
        !isLoading &&
        !isRunning &&
        !isRunningManualSync &&
        !isSavingPreference,
      onToggleSyncEnabled,
      onRunManualSync,
      onRetry: onRunManualSync,
    }),
    [
      conflictCount,
      errorMessage,
      failedCount,
      isLoading,
      isRunning,
      isRunningManualSync,
      isSavingPreference,
      lastSyncedAt,
      onRunManualSync,
      onToggleSyncEnabled,
      pendingCount,
      rolloutLabel,
      successMessage,
      syncEnabled,
    ],
  );
};
