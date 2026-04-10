import { useCallback, useMemo, useState } from "react";
import { DeleteLedgerEntryUseCase } from "@/feature/ledger/useCase/deleteLedgerEntry.useCase";
import { GetLedgerEntryByRemoteIdUseCase } from "@/feature/ledger/useCase/getLedgerEntryByRemoteId.useCase";
import { DeleteBusinessTransactionUseCase } from "@/feature/transactions/useCase/deleteBusinessTransaction.useCase";
import { DeleteBillingDocumentAllocationsBySettlementEntryRemoteIdUseCase } from "@/feature/billing/useCase/deleteBillingDocumentAllocationsBySettlementEntryRemoteId.useCase";
import { DeleteBillingDocumentUseCase } from "@/feature/billing/useCase/deleteBillingDocument.useCase";
import { LedgerDeleteViewModel } from "./ledgerDelete.viewModel";

type UseLedgerDeleteViewModelParams = {
  deleteLedgerEntryUseCase: DeleteLedgerEntryUseCase;
  getLedgerEntryByRemoteIdUseCase: GetLedgerEntryByRemoteIdUseCase;
  deleteBusinessTransactionUseCase: DeleteBusinessTransactionUseCase;
  deleteBillingDocumentAllocationsBySettlementEntryRemoteIdUseCase: DeleteBillingDocumentAllocationsBySettlementEntryRemoteIdUseCase;
  deleteBillingDocumentUseCase: DeleteBillingDocumentUseCase;
  onDeleted: () => void;
};

export const useLedgerDeleteViewModel = ({
  deleteLedgerEntryUseCase,
  getLedgerEntryByRemoteIdUseCase,
  deleteBusinessTransactionUseCase,
  deleteBillingDocumentAllocationsBySettlementEntryRemoteIdUseCase,
  deleteBillingDocumentUseCase,
  onDeleted,
}: UseLedgerDeleteViewModelParams): LedgerDeleteViewModel => {
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
    const entryResult = await getLedgerEntryByRemoteIdUseCase.execute(
      pendingDeleteRemoteId,
    );

    if (!entryResult.success) {
      setIsDeleting(false);
      setErrorMessage(entryResult.error.message);
      return;
    }

    const result = await deleteLedgerEntryUseCase.execute(pendingDeleteRemoteId);

    if (!result.success) {
      setIsDeleting(false);
      setErrorMessage(result.error.message);
      return;
    }
    const cleanupEntry = entryResult.value;

    if (cleanupEntry.linkedTransactionRemoteId) {
      await deleteBusinessTransactionUseCase.execute(
        cleanupEntry.linkedTransactionRemoteId,
      );
    }

    await deleteBillingDocumentAllocationsBySettlementEntryRemoteIdUseCase.execute(
      cleanupEntry.remoteId,
    );

    if (cleanupEntry.linkedDocumentRemoteId) {
      await deleteBillingDocumentUseCase.execute(
        cleanupEntry.linkedDocumentRemoteId,
      );
    }

    closeDelete();
    onDeleted();
  }, [
    closeDelete,
    deleteBillingDocumentAllocationsBySettlementEntryRemoteIdUseCase,
    deleteBillingDocumentUseCase,
    deleteBusinessTransactionUseCase,
    deleteLedgerEntryUseCase,
    getLedgerEntryByRemoteIdUseCase,
    onDeleted,
    pendingDeleteRemoteId,
  ]);

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
