import { BillingErrorType } from "@/feature/billing/types/billing.types";
import type { DeleteBillingDocumentUseCase } from "@/feature/billing/useCase/deleteBillingDocument.useCase";
import { InventoryMovementSourceModule } from "@/feature/inventory/types/inventory.types";
import type { DeleteInventoryMovementsBySourceUseCase } from "@/feature/inventory/useCase/deleteInventoryMovementsBySource.useCase";
import { LedgerErrorType } from "@/feature/ledger/types/ledger.error.types";
import type { DeleteLedgerEntryUseCase } from "@/feature/ledger/useCase/deleteLedgerEntry.useCase";
import { PosErrorType } from "@/feature/pos/types/pos.error.types";
import { PosSaleWorkflowStatus } from "@/feature/pos/types/posSale.constant";
import { isPosSaleCleanupAllowedWorkflowStatus } from "@/feature/pos/utils/posSaleRecoveryStatus.util";
import type { UpdatePosSaleWorkflowStateUseCase } from "@/feature/pos/useCase/updatePosSaleWorkflowState.useCase";
import { TransactionErrorType } from "@/feature/transactions/types/transaction.error.types";
import type { DeleteBusinessTransactionUseCase } from "@/feature/transactions/useCase/deleteBusinessTransaction.useCase";
import type { ResolvePosAbnormalSaleUseCase } from "./resolvePosAbnormalSale.useCase";

type CreateResolvePosAbnormalSaleUseCaseParams = {
  deleteInventoryMovementsBySourceUseCase: DeleteInventoryMovementsBySourceUseCase;
  deleteBillingDocumentUseCase: DeleteBillingDocumentUseCase;
  deleteLedgerEntryUseCase: DeleteLedgerEntryUseCase;
  deleteBusinessTransactionUseCase: DeleteBusinessTransactionUseCase;
  updatePosSaleWorkflowStateUseCase: UpdatePosSaleWorkflowStateUseCase;
};

const isBillingAlreadyClearedError = (error: { type?: string } | null | undefined) =>
  error?.type === BillingErrorType.DocumentNotFound;

const isLedgerAlreadyClearedError = (error: { type?: string } | null | undefined) =>
  error?.type === LedgerErrorType.LedgerEntryNotFound;

const isTransactionAlreadyClearedError = (
  error: { type?: string } | null | undefined,
) => error?.type === TransactionErrorType.TransactionNotFound;

export const createResolvePosAbnormalSaleUseCase = ({
  deleteInventoryMovementsBySourceUseCase,
  deleteBillingDocumentUseCase,
  deleteLedgerEntryUseCase,
  deleteBusinessTransactionUseCase,
  updatePosSaleWorkflowStateUseCase,
}: CreateResolvePosAbnormalSaleUseCaseParams): ResolvePosAbnormalSaleUseCase => ({
  async execute({ sale }) {
    const saleRemoteId = sale.remoteId.trim();
    const businessAccountRemoteId = sale.businessAccountRemoteId.trim();
    const normalizedBillingDocumentRemoteId =
      sale.billingDocumentRemoteId?.trim() || null;
    const normalizedLedgerEntryRemoteId = sale.ledgerEntryRemoteId?.trim() || null;
    const normalizedTransactionRemoteIds = sale.postedTransactionRemoteIds
      .map((remoteId) => remoteId.trim())
      .filter((remoteId) => remoteId.length > 0);

    if (!saleRemoteId) {
      return {
        success: false,
        error: {
          type: PosErrorType.Validation,
          message: "POS sale id is required.",
        },
      };
    }

    if (!businessAccountRemoteId) {
      return {
        success: false,
        error: {
          type: PosErrorType.Validation,
          message: "Business account context is required.",
        },
      };
    }

    if (!isPosSaleCleanupAllowedWorkflowStatus(sale.workflowStatus)) {
      return {
        success: false,
        error: {
          type: PosErrorType.UnsupportedOperation,
          message:
            "Cleanup is only allowed for failed or partially-posted POS sales.",
        },
      };
    }

    let remainingBillingDocumentRemoteId = normalizedBillingDocumentRemoteId;
    let remainingLedgerEntryRemoteId = normalizedLedgerEntryRemoteId;
    const remainingTransactionRemoteIds: string[] = [];
    const cleanupErrors: string[] = [];

    const deleteInventoryResult =
      await deleteInventoryMovementsBySourceUseCase.execute({
        accountRemoteId: businessAccountRemoteId,
        sourceModule: InventoryMovementSourceModule.Pos,
        sourceRemoteId: saleRemoteId,
      });

    if (!deleteInventoryResult.success) {
      cleanupErrors.push(
        `could not reverse inventory for POS sale ${saleRemoteId}: ${deleteInventoryResult.error.message}`,
      );
    }

    if (remainingLedgerEntryRemoteId) {
      const deleteLedgerResult = await deleteLedgerEntryUseCase.execute(
        remainingLedgerEntryRemoteId,
      );

      if (
        deleteLedgerResult.success ||
        isLedgerAlreadyClearedError(deleteLedgerResult.error)
      ) {
        remainingLedgerEntryRemoteId = null;
      } else {
        cleanupErrors.push(
          `could not remove ledger due ${remainingLedgerEntryRemoteId}: ${deleteLedgerResult.error.message}`,
        );
      }
    }

    if (remainingBillingDocumentRemoteId) {
      const deleteBillingResult = await deleteBillingDocumentUseCase.execute(
        remainingBillingDocumentRemoteId,
      );

      if (
        deleteBillingResult.success ||
        isBillingAlreadyClearedError(deleteBillingResult.error)
      ) {
        remainingBillingDocumentRemoteId = null;
      } else {
        cleanupErrors.push(
          `could not remove billing document ${remainingBillingDocumentRemoteId}: ${deleteBillingResult.error.message}`,
        );
      }
    }

    for (const transactionRemoteId of [...normalizedTransactionRemoteIds].reverse()) {
      const deleteTransactionResult =
        await deleteBusinessTransactionUseCase.execute(transactionRemoteId);

      if (
        deleteTransactionResult.success ||
        isTransactionAlreadyClearedError(deleteTransactionResult.error)
      ) {
        continue;
      }

      cleanupErrors.push(
        `could not void transaction ${transactionRemoteId}: ${deleteTransactionResult.error.message}`,
      );
      remainingTransactionRemoteIds.unshift(transactionRemoteId);
    }

    const updateResult = await updatePosSaleWorkflowStateUseCase.execute({
      saleRemoteId,
      workflowStatus:
        cleanupErrors.length === 0
          ? PosSaleWorkflowStatus.Failed
          : PosSaleWorkflowStatus.PartiallyPosted,
      receipt: sale.receipt,
      billingDocumentRemoteId: remainingBillingDocumentRemoteId,
      ledgerEntryRemoteId: remainingLedgerEntryRemoteId,
      postedTransactionRemoteIds: remainingTransactionRemoteIds,
      lastErrorType:
        cleanupErrors.length === 0
          ? "manual_cleanup_completed"
          : "manual_cleanup_partial",
      lastErrorMessage:
        cleanupErrors.length === 0
          ? "POS abnormal sale cleanup completed. Linked inventory and accounting artifacts were cleared."
          : `POS abnormal sale cleanup could not clear all linked inventory/accounting artifacts: ${cleanupErrors.join(
              " | ",
            )}`,
    });

    if (!updateResult.success) {
      return {
        success: false,
        error: {
          type: PosErrorType.Unknown,
          message: updateResult.error.message,
        },
      };
    }

    return {
      success: true,
      value: {
        wasFullyCleaned: cleanupErrors.length === 0,
      },
    };
  },
});
