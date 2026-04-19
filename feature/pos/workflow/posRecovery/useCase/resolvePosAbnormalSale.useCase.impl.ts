import type { DeleteBillingDocumentUseCase } from "@/feature/billing/useCase/deleteBillingDocument.useCase";
import type { DeleteLedgerEntryUseCase } from "@/feature/ledger/useCase/deleteLedgerEntry.useCase";
import { PosErrorType } from "@/feature/pos/types/pos.error.types";
import { PosSaleWorkflowStatus } from "@/feature/pos/types/posSale.constant";
import type { UpdatePosSaleWorkflowStateUseCase } from "@/feature/pos/useCase/updatePosSaleWorkflowState.useCase";
import type { DeleteBusinessTransactionUseCase } from "@/feature/transactions/useCase/deleteBusinessTransaction.useCase";
import type { ResolvePosAbnormalSaleUseCase } from "./resolvePosAbnormalSale.useCase";

type CreateResolvePosAbnormalSaleUseCaseParams = {
  deleteBillingDocumentUseCase: DeleteBillingDocumentUseCase;
  deleteLedgerEntryUseCase: DeleteLedgerEntryUseCase;
  deleteBusinessTransactionUseCase: DeleteBusinessTransactionUseCase;
  updatePosSaleWorkflowStateUseCase: UpdatePosSaleWorkflowStateUseCase;
};

const isAbnormalSaleStatus = (workflowStatus: string): boolean => {
  return (
    workflowStatus === PosSaleWorkflowStatus.Failed ||
    workflowStatus === PosSaleWorkflowStatus.PartiallyPosted
  );
};

export const createResolvePosAbnormalSaleUseCase = ({
  deleteBillingDocumentUseCase,
  deleteLedgerEntryUseCase,
  deleteBusinessTransactionUseCase,
  updatePosSaleWorkflowStateUseCase,
}: CreateResolvePosAbnormalSaleUseCaseParams): ResolvePosAbnormalSaleUseCase => ({
  async execute({ sale }) {
    const saleRemoteId = sale.remoteId.trim();

    if (!saleRemoteId) {
      return {
        success: false,
        error: {
          type: PosErrorType.Validation,
          message: "POS sale id is required.",
        },
      };
    }

    if (!isAbnormalSaleStatus(sale.workflowStatus)) {
      return {
        success: false,
        error: {
          type: PosErrorType.UnsupportedOperation,
          message:
            "Cleanup is only allowed for failed or partially-posted POS sales.",
        },
      };
    }

    let remainingBillingDocumentRemoteId = sale.billingDocumentRemoteId;
    let remainingLedgerEntryRemoteId = sale.ledgerEntryRemoteId;
    const remainingTransactionRemoteIds: string[] = [];
    const cleanupErrors: string[] = [];

    if (remainingLedgerEntryRemoteId) {
      const deleteLedgerResult = await deleteLedgerEntryUseCase.execute(
        remainingLedgerEntryRemoteId,
      );

      if (deleteLedgerResult.success) {
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

      if (deleteBillingResult.success) {
        remainingBillingDocumentRemoteId = null;
      } else {
        cleanupErrors.push(
          `could not remove billing document ${remainingBillingDocumentRemoteId}: ${deleteBillingResult.error.message}`,
        );
      }
    }

    for (const transactionRemoteId of [...sale.postedTransactionRemoteIds].reverse()) {
      const normalizedTransactionRemoteId = transactionRemoteId.trim();
      if (!normalizedTransactionRemoteId) {
        continue;
      }

      const deleteTransactionResult = await deleteBusinessTransactionUseCase.execute(
        normalizedTransactionRemoteId,
      );

      if (!deleteTransactionResult.success) {
        cleanupErrors.push(
          `could not void transaction ${normalizedTransactionRemoteId}: ${deleteTransactionResult.error.message}`,
        );
        remainingTransactionRemoteIds.unshift(normalizedTransactionRemoteId);
      }
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
          ? "POS abnormal sale cleanup completed. Linked accounting artifacts were cleared."
          : `POS abnormal sale cleanup could not clear all linked accounting artifacts: ${cleanupErrors.join(
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
