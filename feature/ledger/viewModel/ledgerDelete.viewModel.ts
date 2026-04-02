export interface LedgerDeleteViewModel {
  pendingDeleteRemoteId: string | null;
  isDeleting: boolean;
  errorMessage: string | null;
  openDelete: (remoteId: string) => void;
  closeDelete: () => void;
  confirmDelete: () => Promise<void>;
}
