import { BillingErrorType } from "@/feature/billing/types/billing.types";
import type { GetBillingDocumentByRemoteIdUseCase } from "@/feature/billing/useCase/getBillingDocumentByRemoteId.useCase";
import { LedgerErrorType } from "@/feature/ledger/types/ledger.error.types";
import type { GetLedgerEntryByRemoteIdUseCase } from "@/feature/ledger/useCase/getLedgerEntryByRemoteId.useCase";
import { PosErrorType } from "@/feature/pos/types/pos.error.types";
import {
  PosArtifactReconciliationStatus,
  type PosArtifactReconciliationItem,
  type PosSaleReconciliation,
} from "@/feature/pos/types/posSaleHistory.entity.types";
import { PosSaleWorkflowStatus } from "@/feature/pos/types/posSale.constant";
import type { ReconcilePosSaleUseCase } from "./reconcilePosSale.useCase";

type CreateReconcilePosSaleUseCaseParams = {
  getBillingDocumentByRemoteIdUseCase: GetBillingDocumentByRemoteIdUseCase;
  getLedgerEntryByRemoteIdUseCase: GetLedgerEntryByRemoteIdUseCase;
};

const isAbnormalSaleStatus = (workflowStatus: string): boolean => {
  return (
    workflowStatus === PosSaleWorkflowStatus.Failed ||
    workflowStatus === PosSaleWorkflowStatus.PartiallyPosted
  );
};

const buildNotRecordedItem = (
  label: string,
  detail: string,
): PosArtifactReconciliationItem => ({
  label,
  remoteId: null,
  status: PosArtifactReconciliationStatus.NotRecorded,
  detail,
});

const buildPresentItem = (
  label: string,
  remoteId: string,
  detail: string,
): PosArtifactReconciliationItem => ({
  label,
  remoteId,
  status: PosArtifactReconciliationStatus.Present,
  detail,
});

const buildMissingItem = (
  label: string,
  remoteId: string,
  detail: string,
): PosArtifactReconciliationItem => ({
  label,
  remoteId,
  status: PosArtifactReconciliationStatus.Missing,
  detail,
});

export const createReconcilePosSaleUseCase = ({
  getBillingDocumentByRemoteIdUseCase,
  getLedgerEntryByRemoteIdUseCase,
}: CreateReconcilePosSaleUseCaseParams): ReconcilePosSaleUseCase => ({
  async execute({ sale }) {
    if (!sale.remoteId.trim()) {
      return {
        success: false,
        error: {
          type: PosErrorType.Validation,
          message: "POS sale id is required for reconciliation.",
        },
      };
    }

    let billingDocument = buildNotRecordedItem(
      "Billing document",
      "No Billing document reference is recorded on this POS sale.",
    );

    if (sale.billingDocumentRemoteId) {
      const billingResult = await getBillingDocumentByRemoteIdUseCase.execute(
        sale.billingDocumentRemoteId,
      );

      if (billingResult.success) {
        billingDocument = buildPresentItem(
          "Billing document",
          sale.billingDocumentRemoteId,
          `Found Billing receipt ${billingResult.value.documentNumber}.`,
        );
      } else if (billingResult.error.type === BillingErrorType.DocumentNotFound) {
        billingDocument = buildMissingItem(
          "Billing document",
          sale.billingDocumentRemoteId,
          "The linked Billing receipt reference is recorded, but the document no longer exists.",
        );
      } else {
        return {
          success: false,
          error: {
            type: PosErrorType.Unknown,
            message: billingResult.error.message,
          },
        };
      }
    }

    let ledgerEntry = buildNotRecordedItem(
      "Ledger due",
      "No Ledger due reference is recorded on this POS sale.",
    );

    if (sale.ledgerEntryRemoteId) {
      const ledgerResult = await getLedgerEntryByRemoteIdUseCase.execute(
        sale.ledgerEntryRemoteId,
      );

      if (ledgerResult.success) {
        ledgerEntry = buildPresentItem(
          "Ledger due",
          sale.ledgerEntryRemoteId,
          `Found Ledger entry ${ledgerResult.value.referenceNumber ?? ledgerResult.value.remoteId}.`,
        );
      } else if (ledgerResult.error.type === LedgerErrorType.LedgerEntryNotFound) {
        ledgerEntry = buildMissingItem(
          "Ledger due",
          sale.ledgerEntryRemoteId,
          "The linked Ledger due reference is recorded, but the entry no longer exists.",
        );
      } else {
        return {
          success: false,
          error: {
            type: PosErrorType.Unknown,
            message: ledgerResult.error.message,
          },
        };
      }
    }

    const hasRecordedTransactions = sale.postedTransactionRemoteIds.length > 0;

    const reconciliation: PosSaleReconciliation = {
      billingDocument,
      ledgerEntry,
      transactionRefs: {
        remoteIds: sale.postedTransactionRemoteIds,
        status: hasRecordedTransactions
          ? PosArtifactReconciliationStatus.RecordedOnly
          : PosArtifactReconciliationStatus.NotRecorded,
        detail: hasRecordedTransactions
          ? "Recorded POS payment transaction references are available for cleanup. For v1, transaction existence is not independently verified here."
          : "No posted payment transactions are recorded on this POS sale.",
      },
      hasUnresolvedArtifacts:
        billingDocument.status === PosArtifactReconciliationStatus.Present ||
        ledgerEntry.status === PosArtifactReconciliationStatus.Present ||
        hasRecordedTransactions,
      canRunCleanup:
        isAbnormalSaleStatus(sale.workflowStatus) &&
        (billingDocument.status === PosArtifactReconciliationStatus.Present ||
          ledgerEntry.status === PosArtifactReconciliationStatus.Present ||
          hasRecordedTransactions),
      checkedAt: Date.now(),
    };

    return {
      success: true,
      value: reconciliation,
    };
  },
});
