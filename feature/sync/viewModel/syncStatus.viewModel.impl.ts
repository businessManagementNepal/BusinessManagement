import { GetAccountByRemoteIdUseCase } from "@/feature/auth/accountSelection/useCase/getAccountByRemoteId.useCase";
import { SYNC_BACKEND_AUTH_REQUIRED_MESSAGE } from "@/shared/sync/constants/sync.constants";
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
  getAccessToken: () => Promise<string | null>;
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

const normalizeStringValue = (value: string | null | undefined): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

const resolveStatusLabel = ({
  isLoading,
  isRunning,
  syncEnabled,
  requiresBackendAuth,
  errorMessage,
}: {
  isLoading: boolean;
  isRunning: boolean;
  syncEnabled: boolean;
  requiresBackendAuth: boolean;
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

  if (requiresBackendAuth) {
    return "Backend sign-in required";
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
  getAccessToken,
  schemaVersion,
}: Params): SyncStatusViewModel => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingPreference, setIsSavingPreference] = useState(false);
  const [isRunningManualSync, setIsRunningManualSync] = useState(false);
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [pendingCount, setPendingCount] = useState(
    EMPTY_STATUS.pendingChangesCount,
  );
  const [conflictCount, setConflictCount] = useState(
    EMPTY_STATUS.conflictCount,
  );
  const [failedCount, setFailedCount] = useState(
    EMPTY_STATUS.failedRecordsCount,
  );
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(
    EMPTY_STATUS.lastSyncedAt,
  );
  const [isRunning, setIsRunning] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [requiresBackendAuth, setRequiresBackendAuth] = useState(false);
  const [hasResolvedActiveAccount, setHasResolvedActiveAccount] =
    useState(false);

  const resetStatus = useCallback(() => {
    setPendingCount(0);
    setConflictCount(0);
    setFailedCount(0);
    setLastSyncedAt(null);
    setIsRunning(false);
  }, []);

  const loadSyncStatus = useCallback(async () => {
    setIsLoading(true);
    setHasResolvedActiveAccount(false);
    setRequiresBackendAuth(false);

    const syncFlagResult = getSyncFeatureFlagUseCase
      ? await getSyncFeatureFlagUseCase.execute()
      : {
          success: true as const,
          value: { syncEnabled: false },
        };

    if (!syncFlagResult.success) {
      setErrorMessage(syncFlagResult.error.message);
      setNoticeMessage(null);
      setIsLoading(false);
      return;
    }

    setSyncEnabled(syncFlagResult.value.syncEnabled);

    if (!syncFlagResult.value.syncEnabled) {
      resetStatus();
      setErrorMessage(null);
      setNoticeMessage(null);
      setIsLoading(false);
      return;
    }

    if (runtimeError) {
      resetStatus();
      setErrorMessage(runtimeError.message);
      setNoticeMessage(null);
      setIsLoading(false);
      return;
    }

    if (!activeUserRemoteId?.trim()) {
      resetStatus();
      setErrorMessage("Sync requires an active user session.");
      setNoticeMessage(null);
      setIsLoading(false);
      return;
    }

    if (!activeAccountRemoteId?.trim() || !getSyncStatusUseCase) {
      resetStatus();
      setErrorMessage("Sync requires an active account.");
      setNoticeMessage(null);
      setIsLoading(false);
      return;
    }

    const accountResult =
      await getAccountByRemoteIdUseCase.execute(activeAccountRemoteId);
    if (!accountResult.success) {
      resetStatus();
      setErrorMessage(accountResult.error.message);
      setNoticeMessage(null);
      setIsLoading(false);
      return;
    }

    if (!accountResult.value) {
      resetStatus();
      setErrorMessage("Sync requires an active account.");
      setNoticeMessage(null);
      setIsLoading(false);
      return;
    }

    setHasResolvedActiveAccount(true);

    const nextRequiresBackendAuth = !normalizeStringValue(
      await getAccessToken(),
    );
    setRequiresBackendAuth(nextRequiresBackendAuth);

    const deviceId = await getDeviceId();
    const syncStatusResult = await getSyncStatusUseCase.execute({
      deviceId,
      ownerUserRemoteId: accountResult.value.ownerUserRemoteId,
      accountRemoteId: accountResult.value.remoteId,
      schemaVersion,
    });

    if (!syncStatusResult.success) {
      resetStatus();
      setErrorMessage(syncStatusResult.error.message);
      setNoticeMessage(null);
      setIsLoading(false);
      return;
    }

    setPendingCount(syncStatusResult.value.pendingChangesCount);
    setConflictCount(syncStatusResult.value.conflictCount);
    setFailedCount(syncStatusResult.value.failedRecordsCount);
    setLastSyncedAt(syncStatusResult.value.lastSyncedAt);
    setIsRunning(syncStatusResult.value.isRunning);
    setErrorMessage(null);
    setNoticeMessage(
      nextRequiresBackendAuth ? SYNC_BACKEND_AUTH_REQUIRED_MESSAGE : null,
    );
    setIsLoading(false);
  }, [
    activeAccountRemoteId,
    activeUserRemoteId,
    getAccessToken,
    getAccountByRemoteIdUseCase,
    getDeviceId,
    getSyncFeatureFlagUseCase,
    getSyncStatusUseCase,
    resetStatus,
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
        setNoticeMessage(null);
        return;
      }

      setIsSavingPreference(true);
      const result = await updateSyncFeatureFlagUseCase.execute(enabled);
      if (!result.success) {
        setErrorMessage(result.error.message);
        setNoticeMessage(null);
        setIsSavingPreference(false);
        return;
      }

      setSyncEnabled(result.value.syncEnabled);
      setErrorMessage(runtimeError?.message ?? null);
      setNoticeMessage(null);
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
      setNoticeMessage(null);
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
      setNoticeMessage(null);
      setIsRunningManualSync(false);
      await loadSyncStatus();
      return;
    }

    setErrorMessage(runtimeError?.message ?? null);
    setNoticeMessage(null);
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
        requiresBackendAuth,
        errorMessage,
      }),
      rolloutLabel,
      pendingCount,
      conflictCount,
      failedCount,
      lastSyncedLabel: formatLastSyncedLabel(lastSyncedAt),
      errorMessage,
      noticeMessage,
      successMessage,
      canRunManualSync:
        syncEnabled &&
        !requiresBackendAuth &&
        hasResolvedActiveAccount &&
        Boolean(activeUserRemoteId?.trim()) &&
        Boolean(activeAccountRemoteId?.trim()) &&
        !runtimeError &&
        Boolean(runManualSyncUseCase) &&
        !isLoading &&
        !isRunning &&
        !isRunningManualSync &&
        !isSavingPreference,
      onToggleSyncEnabled,
      onRunManualSync,
      onRetry: onRunManualSync,
    }),
    [
      activeAccountRemoteId,
      activeUserRemoteId,
      conflictCount,
      errorMessage,
      failedCount,
      hasResolvedActiveAccount,
      isLoading,
      isRunning,
      isRunningManualSync,
      isSavingPreference,
      lastSyncedAt,
      noticeMessage,
      onRunManualSync,
      onToggleSyncEnabled,
      pendingCount,
      requiresBackendAuth,
      rolloutLabel,
      runManualSyncUseCase,
      runtimeError,
      successMessage,
      syncEnabled,
    ],
  );
};
