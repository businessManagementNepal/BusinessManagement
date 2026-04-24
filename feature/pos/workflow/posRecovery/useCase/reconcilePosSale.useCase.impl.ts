import { BillingErrorType } from "@/feature/billing/types/billing.types";
import type { GetBillingDocumentByRemoteIdUseCase } from "@/feature/billing/useCase/getBillingDocumentByRemoteId.useCase";
import { InventoryMovementSourceModule } from "@/feature/inventory/types/inventory.types";
import type { GetInventoryMovementsBySourceUseCase } from "@/feature/inventory/useCase/getInventoryMovementsBySource.useCase";
import { LedgerErrorType } from "@/feature/ledger/types/ledger.error.types";
import type { GetLedgerEntryByRemoteIdUseCase } from "@/feature/ledger/useCase/getLedgerEntryByRemoteId.useCase";
import { PosErrorType } from "@/feature/pos/types/pos.error.types";
import {
  PosArtifactReconciliationStatus,
  type PosArtifactReconciliationItem,
  type PosArtifactReconciliationRefs,
  type PosSaleReconciliation,
} from "@/feature/pos/types/posSaleHistory.entity.types";
import { isPosSaleCleanupAllowedWorkflowStatus } from "@/feature/pos/utils/posSaleRecoveryStatus.util";
import type { ReconcilePosSaleUseCase } from "./reconcilePosSale.useCase";

type CreateReconcilePosSaleUseCaseParams = {
  getInventoryMovementsBySourceUseCase: GetInventoryMovementsBySourceUseCase;
  getBillingDocumentByRemoteIdUseCase: GetBillingDocumentByRemoteIdUseCase;
  getLedgerEntryByRemoteIdUseCase: GetLedgerEntryByRemoteIdUseCase;
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

const buildNotRecordedRefs = (detail: string): PosArtifactReconciliationRefs => ({
  remoteIds: [],
  status: PosArtifactReconciliationStatus.NotRecorded,
  detail,
});

const buildPresentRefs = (
  remoteIds: readonly string[],
  detail: string,
): PosArtifactReconciliationRefs => ({
  remoteIds,
  status: PosArtifactReconciliationStatus.Present,
  detail,
});

const buildRecordedOnlyRefs = (
  remoteIds: readonly string[],
  detail: string,
): PosArtifactReconciliationRefs => ({
  remoteIds,
  status: PosArtifactReconciliationStatus.RecordedOnly,
  detail,
});

const isCleanupActionableStatus = (
  status: (typeof PosArtifactReconciliationStatus)[keyof typeof PosArtifactReconciliationStatus],
): boolean => {
  return (
    status === PosArtifactReconciliationStatus.Present ||
    status === PosArtifactReconciliationStatus.Missing
  );
};

export const createReconcilePosSaleUseCase = ({
  getInventoryMovementsBySourceUseCase,
  getBillingDocumentByRemoteIdUseCase,
  getLedgerEntryByRemoteIdUseCase,
}: CreateReconcilePosSaleUseCaseParams): ReconcilePosSaleUseCase => ({
  async execute({ sale }) {
    const saleRemoteId = sale.remoteId.trim();
    const businessAccountRemoteId = sale.businessAccountRemoteId.trim();
    const billingDocumentRemoteId = sale.billingDocumentRemoteId?.trim() || null;
    const ledgerEntryRemoteId = sale.ledgerEntryRemoteId?.trim() || null;
    const postedTransactionRemoteIds = sale.postedTransactionRemoteIds
      .map((remoteId) => remoteId.trim())
      .filter((remoteId) => remoteId.length > 0);

    if (!saleRemoteId) {
      return {
        success: false,
        error: {
          type: PosErrorType.Validation,
          message: "POS sale id is required for reconciliation.",
        },
      };
    }

    if (!businessAccountRemoteId) {
      return {
        success: false,
        error: {
          type: PosErrorType.Validation,
          message: "Business account context is required for reconciliation.",
        },
      };
    }

    let inventoryMovements = buildNotRecordedRefs(
      "No inventory movements are currently linked to this POS sale.",
    );

    const inventoryResult = await getInventoryMovementsBySourceUseCase.execute({
      accountRemoteId: businessAccountRemoteId,
      sourceModule: InventoryMovementSourceModule.Pos,
      sourceRemoteId: saleRemoteId,
    });

    if (!inventoryResult.success) {
      return {
        success: false,
        error: {
          type: PosErrorType.Unknown,
          message: inventoryResult.error.message,
        },
      };
    }

    if (inventoryResult.value.length > 0) {
      const inventoryRemoteIds = inventoryResult.value.map(
        (movement) => movement.remoteId,
      );
      inventoryMovements = buildPresentRefs(
        inventoryRemoteIds,
        `Found ${inventoryRemoteIds.length} linked inventory movement${
          inventoryRemoteIds.length === 1 ? "" : "s"
        } for this POS sale.`,
      );
    }

    let billingDocument = buildNotRecordedItem(
      "Billing document",
      "No Billing document reference is recorded on this POS sale.",
    );

    if (billingDocumentRemoteId) {
      const billingResult = await getBillingDocumentByRemoteIdUseCase.execute(
        billingDocumentRemoteId,
      );

      if (billingResult.success) {
        billingDocument = buildPresentItem(
          "Billing document",
          billingDocumentRemoteId,
          `Found Billing receipt ${billingResult.value.documentNumber}.`,
        );
      } else if (billingResult.error.type === BillingErrorType.DocumentNotFound) {
        billingDocument = buildMissingItem(
          "Billing document",
          billingDocumentRemoteId,
          "The linked Billing receipt reference is recorded, but the document no longer exists. Cleanup can clear this stale reference.",
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

    if (ledgerEntryRemoteId) {
      const ledgerResult = await getLedgerEntryByRemoteIdUseCase.execute(
        ledgerEntryRemoteId,
      );

      if (ledgerResult.success) {
        ledgerEntry = buildPresentItem(
          "Ledger due",
          ledgerEntryRemoteId,
          `Found Ledger entry ${ledgerResult.value.referenceNumber ?? ledgerResult.value.remoteId}.`,
        );
      } else if (ledgerResult.error.type === LedgerErrorType.LedgerEntryNotFound) {
        ledgerEntry = buildMissingItem(
          "Ledger due",
          ledgerEntryRemoteId,
          "The linked Ledger due reference is recorded, but the entry no longer exists. Cleanup can clear this stale reference.",
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

    const hasRecordedTransactions = postedTransactionRemoteIds.length > 0;

    const transactionRefs = hasRecordedTransactions
      ? buildRecordedOnlyRefs(
          postedTransactionRemoteIds,
          "Recorded POS payment transaction references are available for cleanup. For v1, transaction existence is not independently verified here.",
        )
      : buildNotRecordedRefs(
          "No posted payment transactions are recorded on this POS sale.",
        );

    const hasUnresolvedArtifacts =
      inventoryMovements.status === PosArtifactReconciliationStatus.Present ||
      isCleanupActionableStatus(billingDocument.status) ||
      isCleanupActionableStatus(ledgerEntry.status) ||
      hasRecordedTransactions;

    const reconciliation: PosSaleReconciliation = {
      inventoryMovements,
      billingDocument,
      ledgerEntry,
      transactionRefs,
      hasUnresolvedArtifacts,
      canRunCleanup:
        isPosSaleCleanupAllowedWorkflowStatus(sale.workflowStatus) &&
        hasUnresolvedArtifacts,
      checkedAt: Date.now(),
    };

    return {
      success: true,
      value: reconciliation,
    };
  },
});
