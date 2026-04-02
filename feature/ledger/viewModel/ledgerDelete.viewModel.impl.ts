import { useCallback, useMemo, useState } from "react";
import { DeleteLedgerEntryUseCase } from "@/feature/ledger/useCase/deleteLedgerEntry.useCase";
import { LedgerDeleteViewModel } from "./ledgerDelete.viewModel";

export const useLedgerDeleteViewModel = (
  deleteLedgerEntryUseCase: DeleteLedgerEntryUseCase,
  onDeleted: () => void,
): LedgerDeleteViewModel => {
  const [pendingDeleteRemoteId, setPendingDeleteRemoteId] = useState<string | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const openDelete = useCallback((remoteId: string) => {
    setPendingDeleteRemoteId(remoteId);
    setErrorMessage(null);
  }, []);

  const closeDelete = useCallback(() => {
    setPendingDeleteRemoteId(null);
    setErrorMessage(null);
    setIsDeleting(false);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!pendingDeleteRemoteId) {
      return;
    }

    setIsDeleting(true);
    const result = await deleteLedgerEntryUseCase.execute(pendingDeleteRemoteId);

    if (!result.success) {
      setIsDeleting(false);
      setErrorMessage(result.error.message);
      return;
    }

    closeDelete();
    onDeleted();
  }, [closeDelete, deleteLedgerEntryUseCase, onDeleted, pendingDeleteRemoteId]);

  return useMemo(
    () => ({
      pendingDeleteRemoteId,
      isDeleting,
      errorMessage,
      openDelete,
      closeDelete,
      confirmDelete,
    }),
    [
      closeDelete,
      confirmDelete,
      errorMessage,
      isDeleting,
      openDelete,
      pendingDeleteRemoteId,
    ],
  );
};
