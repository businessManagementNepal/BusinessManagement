import {
  BillingDocumentStatus,
  BillingDocumentType,
  BillingTemplateType,
} from "@/feature/billing/types/billing.types";
import {
  AuditModule,
  AuditOutcome,
  AuditSeverity,
} from "@/feature/audit/types/audit.entity.types";
import type { RecordAuditEventUseCase } from "@/feature/audit/useCase/recordAuditEvent.useCase";
import type { SaveBillingDocumentUseCase } from "@/feature/billing/useCase/saveBillingDocument.useCase";
import type { DeleteBillingDocumentUseCase } from "@/feature/billing/useCase/deleteBillingDocument.useCase";
import {
  LedgerBalanceDirection,
  LedgerEntryType,
} from "@/feature/ledger/types/ledger.entity.types";
import type { AddLedgerEntryUseCase } from "@/feature/ledger/useCase/addLedgerEntry.useCase";
import type { DeleteLedgerEntryUseCase } from "@/feature/ledger/useCase/deleteLedgerEntry.useCase";
import type {
  SaveTransactionPayload,
} from "@/feature/transactions/types/transaction.entity.types";
import {
  TransactionDirection,
  TransactionSourceModule,
  TransactionType,
} from "@/feature/transactions/types/transaction.entity.types";
import type { DeleteBusinessTransactionUseCase } from "@/feature/transactions/useCase/deleteBusinessTransaction.useCase";
import type { PostBusinessTransactionUseCase } from "@/feature/transactions/useCase/postBusinessTransaction.useCase";
import { resolveCurrencyCode } from "@/shared/utils/currency/accountCurrency";
import type { CreatePosSaleDraftUseCase } from "@/feature/pos/useCase/createPosSaleDraft.useCase";
import type { UpdatePosSaleWorkflowStateUseCase } from "@/feature/pos/useCase/updatePosSaleWorkflowState.useCase";
import type { PosPaymentPartInput } from "@/feature/pos/types/pos.dto.types";
import type { PosSaleError } from "@/feature/pos/types/posSale.error.types";
import { PosSaleErrorType } from "@/feature/pos/types/posSale.error.types";
import type { PosReceipt } from "@/feature/pos/types/pos.entity.types";
import type { PosSaleRecord } from "@/feature/pos/types/posSale.entity.types";
import type { PosCheckoutRepository } from "../repository/posCheckout.repository";
import {
  PosCheckoutErrorType,
  type PosCheckoutError,
  type RunPosCheckoutResult,
} from "../types/posCheckout.error.types";
import { PosCheckoutWorkflowStatus } from "../types/posCheckout.state.types";
import type { RunPosCheckoutValue } from "../types/posCheckout.types";
import { createPosReceiptNumber } from "../utils/createPosReceiptNumber";
import type { CommitPosCheckoutInventoryUseCase } from "./commitPosCheckoutInventory.useCase";
import type { RunPosCheckoutUseCase } from "./runPosCheckout.useCase";

type CreateRunPosCheckoutUseCaseParams = {
  posCheckoutRepository: Pick<PosCheckoutRepository, "getSaleByIdempotencyKey">;
  createPosSaleDraftUseCase: CreatePosSaleDraftUseCase;
  updatePosSaleWorkflowStateUseCase: UpdatePosSaleWorkflowStateUseCase;
  saveBillingDocumentUseCase: SaveBillingDocumentUseCase;
  deleteBillingDocumentUseCase: DeleteBillingDocumentUseCase;
  postBusinessTransactionUseCase: PostBusinessTransactionUseCase;
  deleteBusinessTransactionUseCase: DeleteBusinessTransactionUseCase;
  addLedgerEntryUseCase: AddLedgerEntryUseCase;
  deleteLedgerEntryUseCase: DeleteLedgerEntryUseCase;
  commitPosCheckoutInventoryUseCase: CommitPosCheckoutInventoryUseCase;
  recordAuditEventUseCase: RecordAuditEventUseCase;
};

const createSaleRemoteId = (): string => {
  const randomId = globalThis.crypto?.randomUUID?.();
  if (randomId) {
    return randomId;
  }

  return `pos-sale-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
};

const buildPosChildRemoteId = (
  prefix: string,
  ...parts: readonly string[]
): string => {
  const safeParts = parts
    .map((part) =>
      part
        .trim()
        .replace(/[^a-zA-Z0-9_-]/g, "-")
        .replace(/-+/g, "-")
        .slice(0, 80),
    )
    .filter((part) => part.length > 0);

  return `${prefix}-${safeParts.join("-")}`;
};

const createBillingDocumentRemoteId = (saleRemoteId: string): string =>
  buildPosChildRemoteId("pos-doc", saleRemoteId);

const createLedgerEntryRemoteId = (saleRemoteId: string): string =>
  buildPosChildRemoteId("pos-ledger", saleRemoteId);

const createTransactionRemoteId = ({
  saleRemoteId,
  paymentPartId,
}: {
  saleRemoteId: string;
  paymentPartId: string;
}): string => buildPosChildRemoteId("txn-pos", saleRemoteId, paymentPartId);

const getTodayStartTimestamp = (): number => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};

const parseReceiptIssuedAt = (issuedAt: string): number => {
  const parsed = new Date(issuedAt).getTime();
  if (!Number.isFinite(parsed)) {
    return Date.now();
  }
  return parsed;
};

const buildPosDocumentNumber = (receiptNumber: string): string =>
  `POS-${receiptNumber}`.toUpperCase();

const calculatePaidAmountFromParts = (
  paymentParts: readonly PosPaymentPartInput[],
): number =>
  Number(paymentParts.reduce((sum, part) => sum + part.amount, 0).toFixed(2));

const buildPricingForDocument = (
  receipt: PosReceipt,
): {
  adjustedBaseAmount: number;
  taxRatePercent: number;
} => {
  const adjustedBaseAmount = Number(
    Math.max(
      receipt.totals.gross -
        receipt.totals.discountAmount +
        receipt.totals.surchargeAmount,
      0,
    ).toFixed(2),
  );

  const taxRatePercent =
    adjustedBaseAmount > 0
      ? Number(
          ((receipt.totals.taxAmount / adjustedBaseAmount) * 100).toFixed(6),
        )
      : 0;

  return {
    adjustedBaseAmount,
    taxRatePercent,
  };
};

const withPostingSyncFailed = (receipt: PosReceipt): PosReceipt => ({
  ...receipt,
  ledgerEffect: {
    ...receipt.ledgerEffect,
    type: "posting_sync_failed",
  },
});

const withDueBalanceCreateFailed = (receipt: PosReceipt): PosReceipt => ({
  ...receipt,
  ledgerEffect: {
    ...receipt.ledgerEffect,
    type: "due_balance_create_failed",
  },
});

const withDueBalanceCreated = (receipt: PosReceipt): PosReceipt => ({
  ...receipt,
  ledgerEffect: {
    ...receipt.ledgerEffect,
    type: "due_balance_created",
  },
});

const mapSaleToRunValue = (sale: PosSaleRecord): RunPosCheckoutValue => ({
  workflowStatus: sale.workflowStatus,
  receipt: sale.receipt,
  billingDocumentRemoteId: sale.billingDocumentRemoteId,
  ledgerEntryRemoteId: sale.ledgerEntryRemoteId,
  postedTransactionRemoteIds: sale.postedTransactionRemoteIds,
});

const buildPosCheckoutAuditMetadata = (params: {
  saleRemoteId: string;
  receiptNumber: string | null;
  billingDocumentRemoteId: string | null;
  ledgerEntryRemoteId: string | null;
  postedTransactionRemoteIds: readonly string[];
  workflowStatus: string;
  errorType: string | null;
  errorMessage: string | null;
}): string =>
  JSON.stringify({
    saleRemoteId: params.saleRemoteId,
    receiptNumber: params.receiptNumber,
    billingDocumentRemoteId: params.billingDocumentRemoteId,
    ledgerEntryRemoteId: params.ledgerEntryRemoteId,
    postedTransactionRemoteIds: params.postedTransactionRemoteIds,
    workflowStatus: params.workflowStatus,
    errorType: params.errorType,
    errorMessage: params.errorMessage,
  });

const mapSaleErrorToCheckoutError = (error: PosSaleError): PosCheckoutError => {
  if (error.type === PosSaleErrorType.Validation) {
    return { type: PosCheckoutErrorType.Validation, message: error.message };
  }
  if (error.type === PosSaleErrorType.Conflict) {
    return {
      type: PosCheckoutErrorType.IdempotencyConflict,
      message: error.message,
    };
  }
  if (error.type === PosSaleErrorType.NotFound) {
    return {
      type: PosCheckoutErrorType.PostingFailed,
      message: error.message,
    };
  }

  return {
    type: PosCheckoutErrorType.Unknown,
    message: error.message,
  };
};

const isRetryableSaleWorkflowStatus = (workflowStatus: string): boolean =>
  workflowStatus === PosCheckoutWorkflowStatus.PendingValidation ||
  workflowStatus === PosCheckoutWorkflowStatus.PendingPosting ||
  workflowStatus === PosCheckoutWorkflowStatus.Failed ||
  workflowStatus === PosCheckoutWorkflowStatus.PartiallyPosted;

type PosCheckoutArtifacts = {
  billingDocumentRemoteId: string | null;
  ledgerEntryRemoteId: string | null;
  postedTransactionRemoteIds: readonly string[];
};

type PosCheckoutRollbackResult = PosCheckoutArtifacts & {
  rollbackErrorMessage: string | null;
};

const rollbackCheckoutArtifacts = async ({
  artifacts,
  deleteBillingDocumentUseCase,
  deleteBusinessTransactionUseCase,
  deleteLedgerEntryUseCase,
}: {
  artifacts: PosCheckoutArtifacts;
  deleteBillingDocumentUseCase: DeleteBillingDocumentUseCase;
  deleteBusinessTransactionUseCase: DeleteBusinessTransactionUseCase;
  deleteLedgerEntryUseCase: DeleteLedgerEntryUseCase;
}): Promise<PosCheckoutRollbackResult> => {
  let billingDocumentRemoteId = artifacts.billingDocumentRemoteId;
  let ledgerEntryRemoteId = artifacts.ledgerEntryRemoteId;
  const postedTransactionRemoteIds: string[] = [];
  const rollbackErrors: string[] = [];

  if (ledgerEntryRemoteId) {
    const deleteLedgerResult =
      await deleteLedgerEntryUseCase.execute(ledgerEntryRemoteId);

    if (deleteLedgerResult.success) {
      ledgerEntryRemoteId = null;
    } else {
      rollbackErrors.push(
        `could not remove ledger due ${ledgerEntryRemoteId}: ${deleteLedgerResult.error.message}`,
      );
    }
  }

  if (billingDocumentRemoteId) {
    const deleteBillingResult =
      await deleteBillingDocumentUseCase.execute(billingDocumentRemoteId);

    if (deleteBillingResult.success) {
      billingDocumentRemoteId = null;
    } else {
      rollbackErrors.push(
        `could not remove billing document ${billingDocumentRemoteId}: ${deleteBillingResult.error.message}`,
      );
    }
  }

  for (const transactionRemoteId of [...artifacts.postedTransactionRemoteIds].reverse()) {
    const deleteTransactionResult =
      await deleteBusinessTransactionUseCase.execute(transactionRemoteId);

    if (!deleteTransactionResult.success) {
      rollbackErrors.push(
        `could not void transaction ${transactionRemoteId}: ${deleteTransactionResult.error.message}`,
      );
      postedTransactionRemoteIds.unshift(transactionRemoteId);
    }
  }

  return {
    billingDocumentRemoteId,
    ledgerEntryRemoteId,
    postedTransactionRemoteIds,
    rollbackErrorMessage:
      rollbackErrors.length > 0 ? rollbackErrors.join(" | ") : null,
  };
};

export const createRunPosCheckoutUseCase = ({
  posCheckoutRepository,
  createPosSaleDraftUseCase,
  updatePosSaleWorkflowStateUseCase,
  saveBillingDocumentUseCase,
  deleteBillingDocumentUseCase,
  postBusinessTransactionUseCase,
  deleteBusinessTransactionUseCase,
  addLedgerEntryUseCase,
  deleteLedgerEntryUseCase,
  commitPosCheckoutInventoryUseCase,
  recordAuditEventUseCase,
}: CreateRunPosCheckoutUseCaseParams): RunPosCheckoutUseCase => ({
  async execute(params): Promise<RunPosCheckoutResult> {
    const businessAccountRemoteId =
      params.activeBusinessAccountRemoteId?.trim() ?? "";
    const ownerUserRemoteId = params.activeOwnerUserRemoteId?.trim() ?? "";
    const idempotencyKey = params.idempotencyKey.trim();

    if (!businessAccountRemoteId || !ownerUserRemoteId) {
      return {
        success: false,
        error: {
          type: PosCheckoutErrorType.ContextRequired,
          message:
            "POS requires active business account and owner user context.",
        },
      };
    }

    if (!idempotencyKey) {
      return {
        success: false,
        error: {
          type: PosCheckoutErrorType.Validation,
          message: "Idempotency key is required for POS checkout.",
        },
      };
    }

    const continuePersistedPosSale = async (
      sale: PosSaleRecord,
    ): Promise<RunPosCheckoutResult> => {
      const saleRemoteId = sale.remoteId.trim();
      const saleBusinessAccountRemoteId = sale.businessAccountRemoteId.trim();
      const saleOwnerUserRemoteId = sale.ownerUserRemoteId.trim();
      const saleIdempotencyKey = sale.idempotencyKey.trim();

      if (!saleRemoteId) {
        return {
          success: false,
          error: {
            type: PosCheckoutErrorType.Validation,
            message: "Persisted POS sale id is required for posting.",
          },
        };
      }

      if (!saleBusinessAccountRemoteId || !saleOwnerUserRemoteId) {
        return {
          success: false,
          error: {
            type: PosCheckoutErrorType.ContextRequired,
            message:
              "Persisted POS sale must include business account and owner context.",
          },
        };
      }

      if (!saleIdempotencyKey) {
        return {
          success: false,
          error: {
            type: PosCheckoutErrorType.Validation,
            message: "Persisted POS sale idempotency key is required.",
          },
        };
      }

      if (sale.cartLinesSnapshot.length === 0) {
        return {
          success: false,
          error: {
            type: PosCheckoutErrorType.EmptyCart,
            message: "Add at least one product before taking payment.",
          },
        };
      }

      if (!sale.receipt) {
        return {
          success: false,
          error: {
            type: PosCheckoutErrorType.Validation,
            message: "Persisted POS sale receipt snapshot is required.",
          },
        };
      }

      const paidAmount = calculatePaidAmountFromParts(sale.paymentParts);
      const hasMissingSettlementAccount = sale.paymentParts.some(
        (part) => part.amount > 0 && !part.settlementAccountRemoteId?.trim(),
      );

      if (paidAmount > 0 && hasMissingSettlementAccount) {
        return {
          success: false,
          error: {
            type: PosCheckoutErrorType.ContextRequired,
            message: "Settlement money account is required for paid sales.",
          },
        };
      }

      const dueAmount = Number(
        Math.max(sale.totalsSnapshot.grandTotal - paidAmount, 0).toFixed(2),
      );

      const selectedCustomer =
        sale.customerRemoteId?.trim() && sale.customerNameSnapshot?.trim()
          ? {
              remoteId: sale.customerRemoteId.trim(),
              fullName: sale.customerNameSnapshot.trim(),
              phone: sale.customerPhoneSnapshot,
              address: null,
            }
          : null;

      if (dueAmount > 0 && !selectedCustomer) {
        return {
          success: false,
          error: {
            type: PosCheckoutErrorType.ContextRequired,
            message: "Customer selection is required for unpaid sales.",
          },
        };
      }

      const draftReceipt = sale.receipt;
      const currencyCode = resolveCurrencyCode({
        currencyCode: sale.currencyCode,
        countryCode: sale.countryCode,
      });
      const happenedAt = parseReceiptIssuedAt(draftReceipt.issuedAt);

      const existingBillingDocumentRemoteId =
        sale.billingDocumentRemoteId?.trim() || null;
      const existingLedgerEntryRemoteId = sale.ledgerEntryRemoteId?.trim() || null;
      const existingPostedTransactionRemoteIds = sale.postedTransactionRemoteIds
        .map((remoteId) => remoteId.trim())
        .filter((remoteId) => remoteId.length > 0);

      const persistWorkflowState = async ({
        workflowStatus,
        receipt,
        billingDocumentRemoteId,
        ledgerEntryRemoteId,
        postedTransactionRemoteIds,
        lastErrorType,
        lastErrorMessage,
      }: {
        workflowStatus: typeof PosCheckoutWorkflowStatus[keyof typeof PosCheckoutWorkflowStatus];
        receipt: PosReceipt | null;
        billingDocumentRemoteId: string | null;
        ledgerEntryRemoteId: string | null;
        postedTransactionRemoteIds: readonly string[];
        lastErrorType: string | null;
        lastErrorMessage: string | null;
      }): Promise<RunPosCheckoutResult> => {
        const updateResult = await updatePosSaleWorkflowStateUseCase.execute({
          saleRemoteId,
          workflowStatus,
          receipt,
          billingDocumentRemoteId,
          ledgerEntryRemoteId,
          postedTransactionRemoteIds,
          lastErrorType,
          lastErrorMessage,
        });

        if (!updateResult.success) {
          return {
            success: false,
            error: mapSaleErrorToCheckoutError(updateResult.error),
          };
        }

        return {
          success: true,
          value: mapSaleToRunValue(updateResult.value),
        };
      };

      const recordCheckoutAudit = async (params: {
        action: string;
        outcome: (typeof AuditOutcome)[keyof typeof AuditOutcome];
        severity: (typeof AuditSeverity)[keyof typeof AuditSeverity];
        summary: string;
        billingDocumentRemoteId: string | null;
        ledgerEntryRemoteId: string | null;
        postedTransactionRemoteIds: readonly string[];
        workflowStatus: string;
        errorType: string | null;
        errorMessage: string | null;
      }): Promise<RunPosCheckoutResult | null> => {
        const auditResult = await recordAuditEventUseCase.execute({
          accountRemoteId: saleBusinessAccountRemoteId,
          ownerUserRemoteId: saleOwnerUserRemoteId,
          actorUserRemoteId: saleOwnerUserRemoteId,
          module: AuditModule.Pos,
          action: params.action,
          sourceModule: "pos",
          sourceRemoteId: saleRemoteId,
          sourceAction: "checkout",
          outcome: params.outcome,
          severity: params.severity,
          summary: params.summary,
          metadataJson: buildPosCheckoutAuditMetadata({
            saleRemoteId,
            receiptNumber: draftReceipt.receiptNumber,
            billingDocumentRemoteId: params.billingDocumentRemoteId,
            ledgerEntryRemoteId: params.ledgerEntryRemoteId,
            postedTransactionRemoteIds: params.postedTransactionRemoteIds,
            workflowStatus: params.workflowStatus,
            errorType: params.errorType,
            errorMessage: params.errorMessage,
          }),
        });

        if (!auditResult.success) {
          return {
            success: false,
            error: {
              type: PosCheckoutErrorType.Unknown,
              message: auditResult.error.message,
            },
          };
        }

        return null;
      };

      const persistFailedCheckout = async ({
        receipt,
        baseErrorType,
        baseErrorMessage,
        artifacts,
      }: {
        receipt: PosReceipt | null;
        baseErrorType: string;
        baseErrorMessage: string;
        artifacts: PosCheckoutArtifacts;
      }): Promise<RunPosCheckoutResult> => {
        const rollbackResult = await rollbackCheckoutArtifacts({
          artifacts,
          deleteBillingDocumentUseCase,
          deleteBusinessTransactionUseCase,
          deleteLedgerEntryUseCase,
        });

        const failedResult = await persistWorkflowState({
          workflowStatus: rollbackResult.rollbackErrorMessage
            ? PosCheckoutWorkflowStatus.PartiallyPosted
            : PosCheckoutWorkflowStatus.Failed,
          receipt,
          billingDocumentRemoteId: rollbackResult.billingDocumentRemoteId,
          ledgerEntryRemoteId: rollbackResult.ledgerEntryRemoteId,
          postedTransactionRemoteIds: rollbackResult.postedTransactionRemoteIds,
          lastErrorType: rollbackResult.rollbackErrorMessage
            ? `${baseErrorType}_rollback_failed`
            : baseErrorType,
          lastErrorMessage: rollbackResult.rollbackErrorMessage
            ? `${baseErrorMessage} | Rollback: ${rollbackResult.rollbackErrorMessage}`
            : baseErrorMessage,
        });

        if (!failedResult.success) {
          return failedResult;
        }

        const auditFailure = await recordCheckoutAudit({
          action: rollbackResult.rollbackErrorMessage
            ? "pos_checkout_partially_posted"
            : "pos_checkout_failed",
          outcome: rollbackResult.rollbackErrorMessage
            ? AuditOutcome.Partial
            : AuditOutcome.Failure,
          severity: rollbackResult.rollbackErrorMessage
            ? AuditSeverity.Critical
            : AuditSeverity.Warning,
          summary: rollbackResult.rollbackErrorMessage
            ? "POS checkout failed and rollback was partial."
            : "POS checkout failed and rollback completed.",
          billingDocumentRemoteId: rollbackResult.billingDocumentRemoteId,
          ledgerEntryRemoteId: rollbackResult.ledgerEntryRemoteId,
          postedTransactionRemoteIds: rollbackResult.postedTransactionRemoteIds,
          workflowStatus: rollbackResult.rollbackErrorMessage
            ? PosCheckoutWorkflowStatus.PartiallyPosted
            : PosCheckoutWorkflowStatus.Failed,
          errorType: rollbackResult.rollbackErrorMessage
            ? `${baseErrorType}_rollback_failed`
            : baseErrorType,
          errorMessage: rollbackResult.rollbackErrorMessage
            ? `${baseErrorMessage} | Rollback: ${rollbackResult.rollbackErrorMessage}`
            : baseErrorMessage,
        });

        return auditFailure ?? failedResult;
      };

      const pendingPostingResult = await persistWorkflowState({
        workflowStatus: PosCheckoutWorkflowStatus.PendingPosting,
        receipt: draftReceipt,
        billingDocumentRemoteId: existingBillingDocumentRemoteId,
        ledgerEntryRemoteId: existingLedgerEntryRemoteId,
        postedTransactionRemoteIds: existingPostedTransactionRemoteIds,
        lastErrorType: null,
        lastErrorMessage: null,
      });

      if (!pendingPostingResult.success) {
        return pendingPostingResult;
      }

      const billingDocumentRemoteId =
        existingBillingDocumentRemoteId ??
        createBillingDocumentRemoteId(saleRemoteId);
      const dueLedgerRemoteId =
        dueAmount > 0
          ? existingLedgerEntryRemoteId ?? createLedgerEntryRemoteId(saleRemoteId)
          : null;
      const pricingForDocument = buildPricingForDocument(draftReceipt);
      const posLineItems = [
        {
          remoteId: `${billingDocumentRemoteId}-line-1`,
          itemName: `POS Sale ${draftReceipt.receiptNumber}`,
          quantity: 1,
          unitRate: pricingForDocument.adjustedBaseAmount,
          lineOrder: 0,
        },
      ];

      const noteParts: string[] = [];
      if (draftReceipt.totals.discountAmount > 0) {
        noteParts.push(
          `Discount ${draftReceipt.totals.discountAmount.toFixed(2)}`,
        );
      }
      if (draftReceipt.totals.surchargeAmount > 0) {
        noteParts.push(
          `Surcharge ${draftReceipt.totals.surchargeAmount.toFixed(2)}`,
        );
      }
      if (draftReceipt.lines.length > 0) {
        const summary = draftReceipt.lines
          .slice(0, 3)
          .map((line) => `${line.productName} x${line.quantity}`)
          .join(", ");
        const remainderCount = draftReceipt.lines.length - 3;
        noteParts.push(
          remainderCount > 0
            ? `Items: ${summary}, +${remainderCount} more`
            : `Items: ${summary}`,
        );
      }

      const saveDocumentResult = await saveBillingDocumentUseCase.execute({
        remoteId: billingDocumentRemoteId,
        accountRemoteId: saleBusinessAccountRemoteId,
        documentNumber: buildPosDocumentNumber(draftReceipt.receiptNumber),
        documentType: BillingDocumentType.Receipt,
        templateType: BillingTemplateType.PosReceipt,
        customerName: selectedCustomer?.fullName ?? "Walk-in Customer",
        status: BillingDocumentStatus.Pending,
        taxRatePercent: pricingForDocument.taxRatePercent,
        notes: noteParts.length > 0 ? noteParts.join(" | ") : null,
        issuedAt: happenedAt,
        dueAt: dueAmount > 0 ? getTodayStartTimestamp() : null,
        sourceModule: TransactionSourceModule.Pos,
        sourceRemoteId: saleRemoteId,
        linkedLedgerEntryRemoteId: dueLedgerRemoteId,
        items: posLineItems,
        contactRemoteId: selectedCustomer?.remoteId ?? null,
      });

      if (!saveDocumentResult.success) {
        return persistWorkflowState({
          workflowStatus: PosCheckoutWorkflowStatus.Failed,
          receipt: withPostingSyncFailed(draftReceipt),
          billingDocumentRemoteId: existingBillingDocumentRemoteId,
          ledgerEntryRemoteId: existingLedgerEntryRemoteId,
          postedTransactionRemoteIds: existingPostedTransactionRemoteIds,
          lastErrorType: "billing_document_create_failed",
          lastErrorMessage: saveDocumentResult.error.message,
        });
      }

      const postedTransactionRemoteIds = [...existingPostedTransactionRemoteIds];

      for (const paymentPart of sale.paymentParts) {
        if (
          paymentPart.amount <= 0 ||
          !paymentPart.settlementAccountRemoteId?.trim()
        ) {
          return persistFailedCheckout({
            receipt: withPostingSyncFailed(draftReceipt),
            baseErrorType: "payment_part_validation_failed",
            baseErrorMessage:
              "Payment part amount and settlement account must be valid for posting.",
            artifacts: {
              billingDocumentRemoteId,
              ledgerEntryRemoteId: dueLedgerRemoteId,
              postedTransactionRemoteIds,
            },
          });
        }

        const transactionRemoteId = createTransactionRemoteId({
          saleRemoteId,
          paymentPartId: paymentPart.paymentPartId,
        });

        if (postedTransactionRemoteIds.includes(transactionRemoteId)) {
          continue;
        }

        const payload: SaveTransactionPayload = {
          remoteId: transactionRemoteId,
          ownerUserRemoteId: saleOwnerUserRemoteId,
          accountRemoteId: saleBusinessAccountRemoteId,
          accountDisplayNameSnapshot: "Business Account",
          transactionType: TransactionType.Income,
          direction: TransactionDirection.In,
          title: `POS Payment ${draftReceipt.receiptNumber} - ${paymentPart.paymentPartId}`,
          amount: Number(paymentPart.amount.toFixed(2)),
          currencyCode,
          categoryLabel: "POS",
          note: `Payment for POS receipt ${draftReceipt.receiptNumber} - ${paymentPart.paymentPartId}`,
          happenedAt,
          settlementMoneyAccountRemoteId: paymentPart.settlementAccountRemoteId,
          settlementMoneyAccountDisplayNameSnapshot: null,
          sourceModule: TransactionSourceModule.Pos,
          sourceRemoteId: billingDocumentRemoteId,
          sourceAction: "checkout_payment",
          idempotencyKey: `pos:${saleIdempotencyKey}:payment:${paymentPart.paymentPartId}`,
          contactRemoteId: selectedCustomer?.remoteId ?? null,
        };

        const transactionResult =
          await postBusinessTransactionUseCase.execute(payload);
        if (!transactionResult.success) {
          return persistFailedCheckout({
            receipt: withPostingSyncFailed(draftReceipt),
            baseErrorType: "transaction_post_failed",
            baseErrorMessage: transactionResult.error.message,
            artifacts: {
              billingDocumentRemoteId,
              ledgerEntryRemoteId: dueLedgerRemoteId,
              postedTransactionRemoteIds,
            },
          });
        }

        postedTransactionRemoteIds.push(transactionRemoteId);
      }

      if (dueAmount <= 0) {
        const inventoryCommitResult =
          await commitPosCheckoutInventoryUseCase.execute({
            businessAccountRemoteId: saleBusinessAccountRemoteId,
            saleRemoteId,
            cartLines: sale.cartLinesSnapshot,
            saleReferenceNumber: draftReceipt.receiptNumber,
            movementAt: happenedAt,
          });

        if (!inventoryCommitResult.success) {
          return persistFailedCheckout({
            receipt: withPostingSyncFailed(draftReceipt),
            baseErrorType: "inventory_commit_failed",
            baseErrorMessage: inventoryCommitResult.error.message,
            artifacts: {
              billingDocumentRemoteId,
              ledgerEntryRemoteId: null,
              postedTransactionRemoteIds,
            },
          });
        }

        const postedResult = await persistWorkflowState({
          workflowStatus: PosCheckoutWorkflowStatus.Posted,
          receipt: draftReceipt,
          billingDocumentRemoteId,
          ledgerEntryRemoteId: null,
          postedTransactionRemoteIds,
          lastErrorType: null,
          lastErrorMessage: null,
        });

        if (!postedResult.success) {
          return postedResult;
        }

        const auditFailure = await recordCheckoutAudit({
          action: "pos_checkout_posted",
          outcome: AuditOutcome.Success,
          severity: AuditSeverity.Info,
          summary: `POS checkout posted: ${draftReceipt.receiptNumber}`,
          billingDocumentRemoteId,
          ledgerEntryRemoteId: null,
          postedTransactionRemoteIds,
          workflowStatus: PosCheckoutWorkflowStatus.Posted,
          errorType: null,
          errorMessage: null,
        });

        return auditFailure ?? postedResult;
      }

      let createdLedgerEntryRemoteId: string | null = dueLedgerRemoteId;

      if (!existingLedgerEntryRemoteId) {
        const ledgerCreateResult = await addLedgerEntryUseCase.execute({
          remoteId: dueLedgerRemoteId as string,
          businessAccountRemoteId: saleBusinessAccountRemoteId,
          ownerUserRemoteId: saleOwnerUserRemoteId,
          partyName: selectedCustomer!.fullName,
          partyPhone: selectedCustomer!.phone,
          entryType: LedgerEntryType.Sale,
          balanceDirection: LedgerBalanceDirection.Receive,
          title: `POS Sale ${draftReceipt.receiptNumber}`,
          amount: dueAmount,
          currencyCode,
          note: `Unpaid balance from POS receipt ${draftReceipt.receiptNumber}.`,
          happenedAt,
          dueAt: getTodayStartTimestamp(),
          paymentMode: null,
          referenceNumber: draftReceipt.receiptNumber,
          reminderAt: null,
          attachmentUri: null,
          settledAgainstEntryRemoteId: null,
          linkedDocumentRemoteId: billingDocumentRemoteId,
          linkedTransactionRemoteId: null,
          settlementAccountRemoteId: null,
          settlementAccountDisplayNameSnapshot: null,
          contactRemoteId: selectedCustomer!.remoteId,
        });

        if (!ledgerCreateResult.success) {
          return persistFailedCheckout({
            receipt: withDueBalanceCreateFailed(draftReceipt),
            baseErrorType: "ledger_create_failed",
            baseErrorMessage: ledgerCreateResult.error.message,
            artifacts: {
              billingDocumentRemoteId,
              ledgerEntryRemoteId: null,
              postedTransactionRemoteIds,
            },
          });
        }

        createdLedgerEntryRemoteId = dueLedgerRemoteId as string;
      }

      const linkageVerificationResult =
        await addLedgerEntryUseCase.verifyLinkedDocument(
          billingDocumentRemoteId,
          dueLedgerRemoteId as string,
        );

      if (!linkageVerificationResult.success) {
        return persistFailedCheckout({
          receipt: withDueBalanceCreateFailed(draftReceipt),
          baseErrorType: "ledger_linkage_verification_failed",
          baseErrorMessage: linkageVerificationResult.error.message,
          artifacts: {
            billingDocumentRemoteId,
            ledgerEntryRemoteId: createdLedgerEntryRemoteId,
            postedTransactionRemoteIds,
          },
        });
      }

      const inventoryCommitResult =
        await commitPosCheckoutInventoryUseCase.execute({
          businessAccountRemoteId: saleBusinessAccountRemoteId,
          saleRemoteId,
          cartLines: sale.cartLinesSnapshot,
          saleReferenceNumber: draftReceipt.receiptNumber,
          movementAt: happenedAt,
        });

      if (!inventoryCommitResult.success) {
        return persistFailedCheckout({
          receipt: withPostingSyncFailed(draftReceipt),
          baseErrorType: "inventory_commit_failed",
          baseErrorMessage: inventoryCommitResult.error.message,
          artifacts: {
            billingDocumentRemoteId,
            ledgerEntryRemoteId: createdLedgerEntryRemoteId,
            postedTransactionRemoteIds,
          },
        });
      }

      const postedResult = await persistWorkflowState({
        workflowStatus: PosCheckoutWorkflowStatus.Posted,
        receipt: withDueBalanceCreated(draftReceipt),
        billingDocumentRemoteId,
        ledgerEntryRemoteId: createdLedgerEntryRemoteId,
        postedTransactionRemoteIds,
        lastErrorType: null,
        lastErrorMessage: null,
      });

      if (!postedResult.success) {
        return postedResult;
      }

      const auditFailure = await recordCheckoutAudit({
        action: "pos_checkout_posted",
        outcome: AuditOutcome.Success,
        severity: AuditSeverity.Info,
        summary: `POS checkout posted: ${draftReceipt.receiptNumber}`,
        billingDocumentRemoteId,
        ledgerEntryRemoteId: createdLedgerEntryRemoteId,
        postedTransactionRemoteIds,
        workflowStatus: PosCheckoutWorkflowStatus.Posted,
        errorType: null,
        errorMessage: null,
      });

      return auditFailure ?? postedResult;
    };

    const existingSaleResult =
      await posCheckoutRepository.getSaleByIdempotencyKey({
        businessAccountRemoteId,
        idempotencyKey,
      });

    if (!existingSaleResult.success) {
      return {
        success: false,
        error: mapSaleErrorToCheckoutError(existingSaleResult.error),
      };
    }

    if (existingSaleResult.value) {
      const existingSale = existingSaleResult.value;

      if (existingSale.workflowStatus === PosCheckoutWorkflowStatus.Posted) {
        return {
          success: true,
          value: mapSaleToRunValue(existingSale),
        };
      }

      if (!isRetryableSaleWorkflowStatus(existingSale.workflowStatus)) {
        return {
          success: false,
          error: {
            type: PosCheckoutErrorType.IdempotencyConflict,
            message: "This POS sale cannot be retried from its current workflow status.",
          },
        };
      }

      return continuePersistedPosSale(existingSale);
    }

    if (params.cartLinesSnapshot.length === 0) {
      return {
        success: false,
        error: {
          type: PosCheckoutErrorType.EmptyCart,
          message: "Add at least one product before taking payment.",
        },
      };
    }

    const paidAmount = calculatePaidAmountFromParts(params.paymentParts);
    const hasMissingSettlementAccount = params.paymentParts.some(
      (part) => part.amount > 0 && !part.settlementAccountRemoteId?.trim(),
    );

    if (paidAmount > 0 && hasMissingSettlementAccount) {
      return {
        success: false,
        error: {
          type: PosCheckoutErrorType.ContextRequired,
          message: "Settlement money account is required for paid sales.",
        },
      };
    }

    const dueAmount = Number(
      Math.max(params.grandTotalSnapshot - paidAmount, 0).toFixed(2),
    );

    if (dueAmount > 0 && !params.selectedCustomer) {
      return {
        success: false,
        error: {
          type: PosCheckoutErrorType.ContextRequired,
          message: "Customer selection is required for unpaid sales.",
        },
      };
    }

    const currencyCode = resolveCurrencyCode({
      currencyCode: params.activeAccountCurrencyCode,
      countryCode: params.activeAccountCountryCode,
    });

    const settlementAccountRemoteId =
      params.paymentParts[0]?.settlementAccountRemoteId?.trim() || null;
    const receiptPaymentParts = params.paymentParts.map((part) => ({
      paymentPartId: part.paymentPartId,
      payerLabel: part.payerLabel,
      amount: Number(part.amount.toFixed(2)),
      settlementAccountRemoteId: part.settlementAccountRemoteId,
      settlementAccountLabel: null,
    }));

    const draftReceipt: PosReceipt = {
      receiptNumber: createPosReceiptNumber(),
      issuedAt: new Date().toISOString(),
      lines: params.cartLinesSnapshot.map((line) => ({ ...line })),
      totals: { ...params.totalsSnapshot },
      paidAmount,
      dueAmount,
      paymentParts: receiptPaymentParts,
      ledgerEffect:
        dueAmount > 0
          ? {
              type: "due_balance_pending",
              dueAmount,
              accountRemoteId: settlementAccountRemoteId,
            }
          : {
              type: "none",
              dueAmount: 0,
              accountRemoteId: settlementAccountRemoteId,
            },
      customerName: params.selectedCustomer?.fullName ?? null,
      customerPhone: params.selectedCustomer?.phone ?? null,
      contactRemoteId: params.selectedCustomer?.remoteId ?? null,
    };

    const draftResult = await createPosSaleDraftUseCase.execute({
      remoteId: createSaleRemoteId(),
      receiptNumber: draftReceipt.receiptNumber,
      businessAccountRemoteId,
      ownerUserRemoteId,
      idempotencyKey,
      customerRemoteId: params.selectedCustomer?.remoteId ?? null,
      customerNameSnapshot: params.selectedCustomer?.fullName ?? null,
      customerPhoneSnapshot: params.selectedCustomer?.phone ?? null,
      currencyCode,
      countryCode: params.activeAccountCountryCode,
      cartLinesSnapshot: params.cartLinesSnapshot,
      totalsSnapshot: params.totalsSnapshot,
      paymentParts: params.paymentParts,
      receipt: draftReceipt,
    });

    if (!draftResult.success) {
      if (draftResult.error.type === PosSaleErrorType.Conflict) {
        const currentSaleResult =
          await posCheckoutRepository.getSaleByIdempotencyKey({
            businessAccountRemoteId,
            idempotencyKey,
          });
        if (currentSaleResult.success && currentSaleResult.value) {
          const currentSale = currentSaleResult.value;

          if (currentSale.workflowStatus === PosCheckoutWorkflowStatus.Posted) {
            return {
              success: true,
              value: mapSaleToRunValue(currentSale),
            };
          }

          if (!isRetryableSaleWorkflowStatus(currentSale.workflowStatus)) {
            return {
              success: false,
              error: {
                type: PosCheckoutErrorType.IdempotencyConflict,
                message:
                  "This POS sale cannot be retried from its current workflow status.",
              },
            };
          }

          return continuePersistedPosSale(currentSale);
        }
      }
      return {
        success: false,
        error: mapSaleErrorToCheckoutError(draftResult.error),
      };
    }

    return continuePersistedPosSale(draftResult.value);
  },
});
