import {
  BillingDocumentStatus,
  BillingDocumentType,
  BillingTemplateType,
} from "@/feature/billing/types/billing.types";
import { SaveBillingDocumentUseCase } from "@/feature/billing/useCase/saveBillingDocument.useCase";
import { SaveBillingDocumentAllocationsUseCase } from "@/feature/billing/useCase/saveBillingDocumentAllocations.useCase";
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
import { PosReceipt } from "../types/pos.entity.types";
import { PosPaymentResult } from "../types/pos.error.types";
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
}: CreateCompletePosCheckoutUseCaseParams): CompletePosCheckoutUseCase => ({
  async execute(params: CompletePosCheckoutParams): Promise<PosPaymentResult> {
    const currencyCode = resolveCurrencyCode({
      currencyCode: params.activeAccountCurrencyCode,
      countryCode: params.activeAccountCountryCode,
    });

    const paymentResult = await completePaymentUseCase.execute({
      paidAmount: params.paidAmount,
      activeSettlementAccountRemoteId: params.activeSettlementAccountRemoteId,
    });

    if (!paymentResult.success) {
      return paymentResult;
    }

    const receipt = paymentResult.value;
    const businessAccountRemoteId =
      params.activeBusinessAccountRemoteId?.trim();
    const ownerUserRemoteId = params.activeOwnerUserRemoteId?.trim();
    const settlementAccountRemoteId =
      params.activeSettlementAccountRemoteId?.trim() ?? null;

    if (!businessAccountRemoteId || !ownerUserRemoteId) {
      return paymentResult;
    }

    // ENFORCE: If paid amount > 0, settlement money account must be provided
    // Settlement must be a Money Account ID (resolved from active Money Accounts)
    if (receipt.paidAmount > 0 && !settlementAccountRemoteId) {
      return {
        success: true,
        value: {
          ...receipt,
          ledgerEffect: {
            ...receipt.ledgerEffect,
            type: "posting_sync_failed",
          },
        },
      };
    }

    const happenedAt = parseReceiptIssuedAt(receipt.issuedAt);
    const dueLedgerRemoteId =
      receipt.dueAmount > 0 ? createLedgerEntryRemoteId() : null;
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
      customerName: "Walk-in Customer",
      status: BillingDocumentStatus.Pending,
      taxRatePercent: pricingForDocument.taxRatePercent,
      notes: posDocumentNote,
      issuedAt: happenedAt,
      dueAt: receipt.dueAmount > 0 ? getTodayStartTimestamp() : null,
      sourceModule: TransactionSourceModule.Pos,
      sourceRemoteId: receipt.receiptNumber,
      linkedLedgerEntryRemoteId: dueLedgerRemoteId,
      items: posLineItems,
    });

    if (!saveDocumentResult.success) {
      return buildPostingSyncFailedResult(receipt);
    }

    let paymentTransactionRemoteId: string | null = null;

    if (receipt.paidAmount > 0) {
      if (!settlementAccountRemoteId) {
        return buildPostingSyncFailedResult(receipt);
      }

      const transactionRemoteId = createTransactionRemoteId();
      const postTransactionPayload: SaveTransactionPayload = {
        remoteId: transactionRemoteId,
        ownerUserRemoteId,
        accountRemoteId: businessAccountRemoteId,
        accountDisplayNameSnapshot: "Business Account",
        transactionType: TransactionType.Income,
        direction: TransactionDirection.In,
        title: `POS Payment ${receipt.receiptNumber}`,
        amount: Number(receipt.paidAmount.toFixed(2)),
        currencyCode,
        categoryLabel: "POS",
        note: `Payment for POS receipt ${receipt.receiptNumber}`,
        happenedAt,
        settlementMoneyAccountRemoteId: settlementAccountRemoteId,
        settlementMoneyAccountDisplayNameSnapshot: null,
        sourceModule: TransactionSourceModule.Pos,
        sourceRemoteId: billingDocumentRemoteId,
        sourceAction: "checkout_payment",
        idempotencyKey: `pos:${receipt.receiptNumber}:payment`,
      };

      const postTransactionResult =
        await postBusinessTransactionUseCase.execute(postTransactionPayload);
      if (!postTransactionResult.success) {
        return buildPostingSyncFailedResult(receipt);
      }

      paymentTransactionRemoteId = transactionRemoteId;
      const saveAllocationResult =
        await saveBillingDocumentAllocationsUseCase.execute([
          {
            remoteId: createBillingAllocationRemoteId(),
            accountRemoteId: businessAccountRemoteId,
            documentRemoteId: billingDocumentRemoteId,
            settlementLedgerEntryRemoteId: null,
            settlementTransactionRemoteId: paymentTransactionRemoteId,
            amount: Number(receipt.paidAmount.toFixed(2)),
            settledAt: happenedAt,
            note: `POS payment ${receipt.receiptNumber}`,
          },
        ]);

      if (!saveAllocationResult.success) {
        return buildPostingSyncFailedResult(receipt);
      }
    }

    if (receipt.dueAmount <= 0) {
      return paymentResult;
    }

    const ledgerResult = await addLedgerEntryUseCase.execute({
      remoteId: dueLedgerRemoteId as string,
      businessAccountRemoteId,
      ownerUserRemoteId,
      partyName: "Walk-in Customer",
      partyPhone: null,
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
      settlementAccountRemoteId: settlementAccountRemoteId,
      settlementAccountDisplayNameSnapshot: null,
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

    return {
      success: true,
      value: {
        ...receipt,
        ledgerEffect: {
          ...receipt.ledgerEffect,
          type: "due_balance_created",
        },
      },
    };
  },
});
