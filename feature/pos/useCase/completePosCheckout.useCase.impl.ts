import {
  BillingDocumentStatus,
  BillingDocumentType,
  BillingTemplateType,
} from "@/feature/billing/types/billing.types";
import { SaveBillingDocumentUseCase } from "@/feature/billing/useCase/saveBillingDocument.useCase";
import { SaveBillingDocumentAllocationsUseCase } from "@/feature/billing/useCase/saveBillingDocumentAllocations.useCase";
import type { GetOrCreateBusinessContactUseCase } from "@/feature/contacts/useCase/getOrCreateBusinessContact.useCase";
import {
  LedgerBalanceDirection,
  LedgerEntryType,
} from "@/feature/ledger/types/ledger.entity.types";
import { AddLedgerEntryUseCase } from "@/feature/ledger/useCase/addLedgerEntry.useCase";
import {
  SaveTransactionPayload,
  TransactionDirection,
  TransactionSourceModule,
  TransactionType,
} from "@/feature/transactions/types/transaction.entity.types";
import { PostBusinessTransactionUseCase } from "@/feature/transactions/useCase/postBusinessTransaction.useCase";
import { resolveCurrencyCode } from "@/shared/utils/currency/accountCurrency";
import type { PosPaymentPartInput } from "../types/pos.dto.types";
import { PosReceipt } from "../types/pos.entity.types";
import { PosErrorType, PosPaymentResult } from "../types/pos.error.types";
import { CompletePaymentUseCase } from "./completePayment.useCase";
import {
  CompletePosCheckoutParams,
  CompletePosCheckoutUseCase,
} from "./completePosCheckout.useCase";

type CreateCompletePosCheckoutUseCaseParams = {
  completePaymentUseCase: CompletePaymentUseCase;
  addLedgerEntryUseCase: AddLedgerEntryUseCase;
  saveBillingDocumentUseCase: SaveBillingDocumentUseCase;
  saveBillingDocumentAllocationsUseCase: SaveBillingDocumentAllocationsUseCase;
  postBusinessTransactionUseCase: PostBusinessTransactionUseCase;
  getOrCreateBusinessContactUseCase: GetOrCreateBusinessContactUseCase;
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

const createBillingAllocationRemoteId = (): string => {
  const randomId = globalThis.crypto?.randomUUID?.();
  if (randomId) {
    return randomId;
  }

  return `pos-alloc-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
};

const createTransactionRemoteId = (): string => {
  const randomId = globalThis.crypto?.randomUUID?.();
  if (randomId) {
    return randomId;
  }

  return `txn-pos-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
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

const buildPostingSyncFailedResult = (
  receipt: PosReceipt,
): PosPaymentResult => ({
  success: true,
  value: {
    ...receipt,
    ledgerEffect: {
      ...receipt.ledgerEffect,
      type: "posting_sync_failed",
    },
  },
});

export const createCompletePosCheckoutUseCase = ({
  completePaymentUseCase,
  addLedgerEntryUseCase,
  saveBillingDocumentUseCase,
  saveBillingDocumentAllocationsUseCase,
  postBusinessTransactionUseCase,
  getOrCreateBusinessContactUseCase,
}: CreateCompletePosCheckoutUseCaseParams): CompletePosCheckoutUseCase => ({
  async execute(params: CompletePosCheckoutParams): Promise<PosPaymentResult> {
    const currencyCode = resolveCurrencyCode({
      currencyCode: params.activeAccountCurrencyCode,
      countryCode: params.activeAccountCountryCode,
    });

    // PRE-COMMIT VALIDATION: Business and user context must be present
    const businessAccountRemoteId =
      params.activeBusinessAccountRemoteId?.trim();
    const ownerUserRemoteId = params.activeOwnerUserRemoteId?.trim();

    if (!businessAccountRemoteId || !ownerUserRemoteId) {
      return {
        success: false,
        error: {
          type: PosErrorType.ContextRequired,
          message:
            "POS requires active business account and owner user context.",
        },
      };
    }

    // PRE-COMMIT VALIDATION: Paid checkout requires settlement money account
    const paidAmount = calculatePaidAmountFromParts(params.paymentParts);
    const hasMissingSettlementAccount = params.paymentParts.some(
      (part) => part.amount > 0 && !part.settlementAccountRemoteId?.trim(),
    );

    if (paidAmount > 0 && hasMissingSettlementAccount) {
      return {
        success: false,
        error: {
          type: PosErrorType.ContextRequired,
          message: "Settlement money account is required for paid sales.",
        },
      };
    }

    // PRE-COMMIT VALIDATION: Unpaid/partial checkout requires customer
    const expectedDueAmount = Math.max(
      params.grandTotalSnapshot - paidAmount,
      0,
    );
    if (expectedDueAmount > 0 && !params.selectedCustomer) {
      return {
        success: false,
        error: {
          type: PosErrorType.ContextRequired,
          message: "Customer selection is required for unpaid sales.",
        },
      };
    }

    const paymentResult = await completePaymentUseCase.execute({
      paymentParts: params.paymentParts,
      selectedCustomer: params.selectedCustomer,
      grandTotalSnapshot: params.grandTotalSnapshot,
    });

    if (!paymentResult.success) {
      return paymentResult;
    }

    const receipt = paymentResult.value;

    // Build payment breakdown for receipt
    const receiptPaymentParts = params.paymentParts.map((part) => ({
      paymentPartId: part.paymentPartId,
      payerLabel: part.payerLabel,
      amount: part.amount,
      settlementAccountRemoteId: part.settlementAccountRemoteId,
      settlementAccountLabel: null, // Settlement account labels would need money account lookup
    }));

    const enrichedReceipt: PosReceipt = {
      ...receipt,
      paymentParts: receiptPaymentParts,
    };

    const happenedAt = parseReceiptIssuedAt(receipt.issuedAt);
    const dueLedgerRemoteId =
      enrichedReceipt.dueAmount > 0 ? createLedgerEntryRemoteId() : null;
    const billingDocumentRemoteId = createBillingDocumentRemoteId();
    const pricingForDocument = buildPricingForDocument(receipt);
    const posLineItems = [
      {
        remoteId: `${billingDocumentRemoteId}-line-1`,
        itemName: `POS Sale ${receipt.receiptNumber}`,
        quantity: 1,
        unitRate: pricingForDocument.adjustedBaseAmount,
        lineOrder: 0,
      },
    ];
    const noteParts: string[] = [];
    if (receipt.totals.discountAmount > 0) {
      noteParts.push(`Discount ${receipt.totals.discountAmount.toFixed(2)}`);
    }
    if (receipt.totals.surchargeAmount > 0) {
      noteParts.push(`Surcharge ${receipt.totals.surchargeAmount.toFixed(2)}`);
    }
    if (receipt.lines.length > 0) {
      const summary = receipt.lines
        .slice(0, 3)
        .map((line) => `${line.productName} x${line.quantity}`)
        .join(", ");
      const remainderCount = receipt.lines.length - 3;
      noteParts.push(
        remainderCount > 0
          ? `Items: ${summary}, +${remainderCount} more`
          : `Items: ${summary}`,
      );
    }
    const posDocumentNote = noteParts.length > 0 ? noteParts.join(" | ") : null;

    const saveDocumentResult = await saveBillingDocumentUseCase.execute({
      remoteId: billingDocumentRemoteId,
      accountRemoteId: businessAccountRemoteId,
      documentNumber: buildPosDocumentNumber(receipt.receiptNumber),
      documentType: BillingDocumentType.Receipt,
      templateType: BillingTemplateType.PosReceipt,
      customerName: params.selectedCustomer?.fullName ?? "Walk-in Customer",
      status: BillingDocumentStatus.Pending,
      taxRatePercent: pricingForDocument.taxRatePercent,
      notes: posDocumentNote,
      issuedAt: happenedAt,
      dueAt: enrichedReceipt.dueAmount > 0 ? getTodayStartTimestamp() : null,
      sourceModule: TransactionSourceModule.Pos,
      sourceRemoteId: receipt.receiptNumber,
      linkedLedgerEntryRemoteId: dueLedgerRemoteId,
      items: posLineItems,
      contactRemoteId: params.selectedCustomer?.remoteId ?? null,
    });

    if (!saveDocumentResult.success) {
      return buildPostingSyncFailedResult(enrichedReceipt);
    }

    let paymentTransactionRemoteId: string | null = null;

    if (enrichedReceipt.paidAmount > 0) {
      // Post one money movement per payment part
      for (const paymentPart of params.paymentParts) {
        if (paymentPart.amount <= 0) {
          return buildPostingSyncFailedResult(enrichedReceipt);
        }

        if (!paymentPart.settlementAccountRemoteId?.trim()) {
          return buildPostingSyncFailedResult(enrichedReceipt);
        }

        const transactionRemoteId = createTransactionRemoteId();
        const postTransactionPayload: SaveTransactionPayload = {
          remoteId: transactionRemoteId,
          ownerUserRemoteId,
          accountRemoteId: businessAccountRemoteId,
          accountDisplayNameSnapshot: "Business Account",
          transactionType: TransactionType.Income,
          direction: TransactionDirection.In,
          title: `POS Payment ${receipt.receiptNumber} - ${paymentPart.paymentPartId}`,
          amount: Number(paymentPart.amount.toFixed(2)),
          currencyCode,
          categoryLabel: "POS",
          note: `Payment for POS receipt ${receipt.receiptNumber} - ${paymentPart.paymentPartId}`,
          happenedAt,
          settlementMoneyAccountRemoteId: paymentPart.settlementAccountRemoteId,
          settlementMoneyAccountDisplayNameSnapshot: null,
          sourceModule: TransactionSourceModule.Pos,
          sourceRemoteId: billingDocumentRemoteId,
          sourceAction: "checkout_payment",
          idempotencyKey: `pos:${receipt.receiptNumber}:payment:${paymentPart.paymentPartId}`,
          contactRemoteId: params.selectedCustomer?.remoteId ?? null,
        };

        const postTransactionResult =
          await postBusinessTransactionUseCase.execute(postTransactionPayload);
        if (!postTransactionResult.success) {
          return buildPostingSyncFailedResult(enrichedReceipt);
        }
      }
    }

    if (enrichedReceipt.dueAmount <= 0) {
      return {
        success: true,
        value: enrichedReceipt,
      };
    }

    const ledgerResult = await addLedgerEntryUseCase.execute({
      remoteId: dueLedgerRemoteId as string,
      businessAccountRemoteId,
      ownerUserRemoteId,
      partyName: params.selectedCustomer!.fullName,
      partyPhone: params.selectedCustomer!.phone,
      entryType: LedgerEntryType.Sale,
      balanceDirection: LedgerBalanceDirection.Receive,
      title: `POS Sale ${receipt.receiptNumber}`,
      amount: receipt.dueAmount,
      currencyCode,
      note: `Unpaid balance from POS receipt ${receipt.receiptNumber}.`,
      happenedAt,
      dueAt: getTodayStartTimestamp(),
      paymentMode: null,
      referenceNumber: receipt.receiptNumber,
      reminderAt: null,
      attachmentUri: null,
      settledAgainstEntryRemoteId: null,
      linkedDocumentRemoteId: billingDocumentRemoteId,
      linkedTransactionRemoteId: null,
      settlementAccountRemoteId: null,
      settlementAccountDisplayNameSnapshot: null,
      contactRemoteId: params.selectedCustomer!.remoteId,
    });

    if (!ledgerResult.success) {
      return {
        success: true,
        value: {
          ...receipt,
          ledgerEffect: {
            ...receipt.ledgerEffect,
            type: "due_balance_create_failed",
          },
        },
      };
    }

    // VERIFY: Ensure Billing ↔ Ledger linkage is consistent
    // Check that the ledger entry can be found by the billing document remote ID
    if (dueLedgerRemoteId) {
      const linkageVerificationResult =
        await addLedgerEntryUseCase.verifyLinkedDocument(
          billingDocumentRemoteId,
          dueLedgerRemoteId,
        );

      if (!linkageVerificationResult.success) {
        return {
          success: false,
          error: {
            type: PosErrorType.Unknown,
            message: `Billing-Ledger linkage verification failed: ${linkageVerificationResult.error?.message || "Unknown error"}`,
          },
        };
      }
    }

    return {
      success: true,
      value: {
        ...receipt,
        paymentParts: receiptPaymentParts,
        ledgerEffect: {
          ...receipt.ledgerEffect,
          type: "due_balance_created",
        },
      },
    };
  },
});
