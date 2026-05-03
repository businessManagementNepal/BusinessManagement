export interface SyncStatusViewModel {
  isLoading: boolean;
  isSavingPreference: boolean;
  isRunningManualSync: boolean;
  syncEnabled: boolean;
  statusLabel: string;
  rolloutLabel: string;
  pendingCount: number;
  conflictCount: number;
  failedCount: number;
  lastSyncedLabel: string;
  errorMessage: string | null;
  successMessage: string | null;
  canRunManualSync: boolean;
  onToggleSyncEnabled: (enabled: boolean) => Promise<void>;
  onRunManualSync: () => Promise<void>;
  onRetry: () => Promise<void>;
}
