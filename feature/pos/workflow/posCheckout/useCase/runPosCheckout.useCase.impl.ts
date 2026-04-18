import {
  BillingDocumentStatus,
  BillingDocumentType,
  BillingTemplateType,
} from "@/feature/billing/types/billing.types";
import type { SaveBillingDocumentUseCase } from "@/feature/billing/useCase/saveBillingDocument.useCase";
import {
  LedgerBalanceDirection,
  LedgerEntryType,
} from "@/feature/ledger/types/ledger.entity.types";
import type { AddLedgerEntryUseCase } from "@/feature/ledger/useCase/addLedgerEntry.useCase";
import type {
  SaveTransactionPayload,
} from "@/feature/transactions/types/transaction.entity.types";
import {
  TransactionDirection,
  TransactionSourceModule,
  TransactionType,
} from "@/feature/transactions/types/transaction.entity.types";
import type { PostBusinessTransactionUseCase } from "@/feature/transactions/useCase/postBusinessTransaction.useCase";
import { resolveCurrencyCode } from "@/shared/utils/currency/accountCurrency";
import type { CommitPosSaleInventoryMutationsUseCase } from "@/feature/pos/useCase/commitPosSaleInventoryMutations.useCase";
import type { CreatePosSaleDraftUseCase } from "@/feature/pos/useCase/createPosSaleDraft.useCase";
import type { UpdatePosSaleWorkflowStateUseCase } from "@/feature/pos/useCase/updatePosSaleWorkflowState.useCase";
import type { PosPaymentPartInput } from "@/feature/pos/types/pos.dto.types";
import type { PosSaleError } from "@/feature/pos/types/posSale.error.types";
import { PosSaleErrorType } from "@/feature/pos/types/posSale.error.types";
import type { PosReceipt } from "@/feature/pos/types/pos.entity.types";
import { PosErrorType, type PosError } from "@/feature/pos/types/pos.error.types";
import type { PosSaleRecord } from "@/feature/pos/types/posSale.entity.types";
import type { PosCheckoutRepository } from "../repository/posCheckout.repository";
import {
  PosCheckoutErrorType,
  type PosCheckoutError,
  type RunPosCheckoutResult,
} from "../types/posCheckout.error.types";
import { PosCheckoutWorkflowStatus } from "../types/posCheckout.state.types";
import type { RunPosCheckoutValue } from "../types/posCheckout.types";
import type { RunPosCheckoutUseCase } from "./runPosCheckout.useCase";

type CreateRunPosCheckoutUseCaseParams = {
  posCheckoutRepository: Pick<PosCheckoutRepository, "getSaleByIdempotencyKey">;
  createPosSaleDraftUseCase: CreatePosSaleDraftUseCase;
  updatePosSaleWorkflowStateUseCase: UpdatePosSaleWorkflowStateUseCase;
  saveBillingDocumentUseCase: SaveBillingDocumentUseCase;
  postBusinessTransactionUseCase: PostBusinessTransactionUseCase;
  addLedgerEntryUseCase: AddLedgerEntryUseCase;
  commitPosSaleInventoryMutationsUseCase: CommitPosSaleInventoryMutationsUseCase;
};

const createSaleRemoteId = (): string => {
  const randomId = globalThis.crypto?.randomUUID?.();
  if (randomId) {
    return randomId;
  }

  return `pos-sale-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
};

const createLedgerEntryRemoteId = (): string => {
  const randomId = globalThis.crypto?.randomUUID?.();
  if (randomId) {
    return randomId;
  }

  return `pos-ledger-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
};

const createBillingDocumentRemoteId = (): string => {
  const randomId = globalThis.crypto?.randomUUID?.();
  if (randomId) {
    return randomId;
  }

  return `pos-doc-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
};

const createTransactionRemoteId = (): string => {
  const randomId = globalThis.crypto?.randomUUID?.();
  if (randomId) {
    return randomId;
  }

  return `txn-pos-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
};

const createPosReceiptNumber = (): string => {
  const timestamp = Date.now().toString().slice(-8);
  return `RCPT-${timestamp}`;
};

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

const mapPosErrorToCheckoutError = (error: PosError): PosCheckoutError => {
  if (error.type === PosErrorType.Validation) {
    return { type: PosCheckoutErrorType.Validation, message: error.message };
  }
  if (error.type === PosErrorType.ContextRequired) {
    return {
      type: PosCheckoutErrorType.ContextRequired,
      message: error.message,
    };
  }
  if (error.type === PosErrorType.EmptyCart) {
    return {
      type: PosCheckoutErrorType.EmptyCart,
      message: error.message,
    };
  }

  return {
    type: PosCheckoutErrorType.PostingFailed,
    message: error.message,
  };
};

const mapExistingSaleForIdempotency = (
  sale: PosSaleRecord,
): RunPosCheckoutResult => {
  if (
    sale.workflowStatus === PosCheckoutWorkflowStatus.PendingValidation ||
    sale.workflowStatus === PosCheckoutWorkflowStatus.PendingPosting
  ) {
    return {
      success: false,
      error: {
        type: PosCheckoutErrorType.IdempotencyConflict,
        message: "Checkout is already in progress for this idempotency key.",
      },
    };
  }

  return {
    success: true,
    value: mapSaleToRunValue(sale),
  };
};

export const createRunPosCheckoutUseCase = ({
  posCheckoutRepository,
  createPosSaleDraftUseCase,
  updatePosSaleWorkflowStateUseCase,
  saveBillingDocumentUseCase,
  postBusinessTransactionUseCase,
  addLedgerEntryUseCase,
  commitPosSaleInventoryMutationsUseCase,
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

    if (params.cartLinesSnapshot.length === 0) {
      return {
        success: false,
        error: {
          type: PosCheckoutErrorType.EmptyCart,
          message: "Add at least one product before taking payment.",
        },
      };
    }

    const existingSaleResult = await posCheckoutRepository.getSaleByIdempotencyKey({
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
      return mapExistingSaleForIdempotency(existingSaleResult.value);
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
          return mapExistingSaleForIdempotency(currentSaleResult.value);
        }
      }
      return {
        success: false,
        error: mapSaleErrorToCheckoutError(draftResult.error),
      };
    }

    const saleRemoteId = draftResult.value.remoteId;

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

    const pendingPostingResult = await persistWorkflowState({
      workflowStatus: PosCheckoutWorkflowStatus.PendingPosting,
      receipt: draftReceipt,
      billingDocumentRemoteId: null,
      ledgerEntryRemoteId: null,
      postedTransactionRemoteIds: [],
      lastErrorType: null,
      lastErrorMessage: null,
    });

    if (!pendingPostingResult.success) {
      return pendingPostingResult;
    }

    const inventoryCommitResult =
      await commitPosSaleInventoryMutationsUseCase.execute({
        businessAccountRemoteId,
        cartLines: params.cartLinesSnapshot,
        saleReferenceNumber: draftReceipt.receiptNumber,
      });

    if (!inventoryCommitResult.success) {
      await persistWorkflowState({
        workflowStatus: PosCheckoutWorkflowStatus.Failed,
        receipt: withPostingSyncFailed(draftReceipt),
        billingDocumentRemoteId: null,
        ledgerEntryRemoteId: null,
        postedTransactionRemoteIds: [],
        lastErrorType: "inventory_commit_failed",
        lastErrorMessage: inventoryCommitResult.error.message,
      });

      return {
        success: false,
        error: mapPosErrorToCheckoutError(inventoryCommitResult.error),
      };
    }

    const billingDocumentRemoteId = createBillingDocumentRemoteId();
    const pricingForDocument = buildPricingForDocument(draftReceipt);
    const happenedAt = parseReceiptIssuedAt(draftReceipt.issuedAt);
    const dueLedgerRemoteId =
      dueAmount > 0 ? createLedgerEntryRemoteId() : null;
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
      noteParts.push(`Discount ${draftReceipt.totals.discountAmount.toFixed(2)}`);
    }
    if (draftReceipt.totals.surchargeAmount > 0) {
      noteParts.push(`Surcharge ${draftReceipt.totals.surchargeAmount.toFixed(2)}`);
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
      accountRemoteId: businessAccountRemoteId,
      documentNumber: buildPosDocumentNumber(draftReceipt.receiptNumber),
      documentType: BillingDocumentType.Receipt,
      templateType: BillingTemplateType.PosReceipt,
      customerName: params.selectedCustomer?.fullName ?? "Walk-in Customer",
      status: BillingDocumentStatus.Pending,
      taxRatePercent: pricingForDocument.taxRatePercent,
      notes: noteParts.length > 0 ? noteParts.join(" | ") : null,
      issuedAt: happenedAt,
      dueAt: dueAmount > 0 ? getTodayStartTimestamp() : null,
      sourceModule: TransactionSourceModule.Pos,
      sourceRemoteId: draftReceipt.receiptNumber,
      linkedLedgerEntryRemoteId: dueLedgerRemoteId,
      items: posLineItems,
      contactRemoteId: params.selectedCustomer?.remoteId ?? null,
    });

    if (!saveDocumentResult.success) {
      return persistWorkflowState({
        workflowStatus: PosCheckoutWorkflowStatus.Failed,
        receipt: withPostingSyncFailed(draftReceipt),
        billingDocumentRemoteId: null,
        ledgerEntryRemoteId: null,
        postedTransactionRemoteIds: [],
        lastErrorType: "billing_document_create_failed",
        lastErrorMessage: saveDocumentResult.error.message,
      });
    }

    const postedTransactionRemoteIds: string[] = [];

    for (const paymentPart of params.paymentParts) {
      if (paymentPart.amount <= 0 || !paymentPart.settlementAccountRemoteId?.trim()) {
        const hasPostedAny = postedTransactionRemoteIds.length > 0;
        return persistWorkflowState({
          workflowStatus: hasPostedAny
            ? PosCheckoutWorkflowStatus.PartiallyPosted
            : PosCheckoutWorkflowStatus.Failed,
          receipt: withPostingSyncFailed(draftReceipt),
          billingDocumentRemoteId,
          ledgerEntryRemoteId: null,
          postedTransactionRemoteIds,
          lastErrorType: "payment_part_validation_failed",
          lastErrorMessage:
            "Payment part amount and settlement account must be valid for posting.",
        });
      }

      const transactionRemoteId = createTransactionRemoteId();
      const payload: SaveTransactionPayload = {
        remoteId: transactionRemoteId,
        ownerUserRemoteId,
        accountRemoteId: businessAccountRemoteId,
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
        idempotencyKey: `pos:${idempotencyKey}:payment:${paymentPart.paymentPartId}`,
        contactRemoteId: params.selectedCustomer?.remoteId ?? null,
      };

      const transactionResult =
        await postBusinessTransactionUseCase.execute(payload);
      if (!transactionResult.success) {
        const hasPostedAny = postedTransactionRemoteIds.length > 0;
        return persistWorkflowState({
          workflowStatus: hasPostedAny
            ? PosCheckoutWorkflowStatus.PartiallyPosted
            : PosCheckoutWorkflowStatus.Failed,
          receipt: withPostingSyncFailed(draftReceipt),
          billingDocumentRemoteId,
          ledgerEntryRemoteId: null,
          postedTransactionRemoteIds,
          lastErrorType: "transaction_post_failed",
          lastErrorMessage: transactionResult.error.message,
        });
      }

      postedTransactionRemoteIds.push(transactionResult.value.remoteId);
    }

    if (dueAmount <= 0) {
      return persistWorkflowState({
        workflowStatus: PosCheckoutWorkflowStatus.Posted,
        receipt: draftReceipt,
        billingDocumentRemoteId,
        ledgerEntryRemoteId: null,
        postedTransactionRemoteIds,
        lastErrorType: null,
        lastErrorMessage: null,
      });
    }

    const ledgerCreateResult = await addLedgerEntryUseCase.execute({
      remoteId: dueLedgerRemoteId as string,
      businessAccountRemoteId,
      ownerUserRemoteId,
      partyName: params.selectedCustomer!.fullName,
      partyPhone: params.selectedCustomer!.phone,
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
      contactRemoteId: params.selectedCustomer!.remoteId,
    });

    if (!ledgerCreateResult.success) {
      return persistWorkflowState({
        workflowStatus: PosCheckoutWorkflowStatus.PartiallyPosted,
        receipt: withDueBalanceCreateFailed(draftReceipt),
        billingDocumentRemoteId,
        ledgerEntryRemoteId: null,
        postedTransactionRemoteIds,
        lastErrorType: "ledger_create_failed",
        lastErrorMessage: ledgerCreateResult.error.message,
      });
    }

    const linkageVerificationResult = await addLedgerEntryUseCase.verifyLinkedDocument(
      billingDocumentRemoteId,
      dueLedgerRemoteId as string,
    );

    if (!linkageVerificationResult.success) {
      return persistWorkflowState({
        workflowStatus: PosCheckoutWorkflowStatus.PartiallyPosted,
        receipt: withDueBalanceCreateFailed(draftReceipt),
        billingDocumentRemoteId,
        ledgerEntryRemoteId: dueLedgerRemoteId,
        postedTransactionRemoteIds,
        lastErrorType: "ledger_linkage_verification_failed",
        lastErrorMessage: linkageVerificationResult.error.message,
      });
    }

    return persistWorkflowState({
      workflowStatus: PosCheckoutWorkflowStatus.Posted,
      receipt: withDueBalanceCreated(draftReceipt),
      billingDocumentRemoteId,
      ledgerEntryRemoteId: dueLedgerRemoteId,
      postedTransactionRemoteIds,
      lastErrorType: null,
      lastErrorMessage: null,
    });
  },
});
