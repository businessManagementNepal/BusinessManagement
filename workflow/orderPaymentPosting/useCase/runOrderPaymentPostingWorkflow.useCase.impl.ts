import {
    MoneyAccount,
    MoneyAccountType,
} from "@/feature/accounts/types/moneyAccount.types";
import { GetMoneyAccountsUseCase } from "@/feature/accounts/useCase/getMoneyAccounts.useCase";
import { GetBillingOverviewUseCase } from "@/feature/billing/useCase/getBillingOverview.useCase";
import {
    LedgerBalanceDirection,
    LedgerEntryType,
    LedgerPaymentMode,
    LedgerPaymentModeValue
} from "@/feature/ledger/types/ledger.entity.types";
import { GetLedgerEntriesUseCase } from "@/feature/ledger/useCase/getLedgerEntries.useCase";
import { SaveLedgerEntryWithSettlementUseCase } from "@/feature/ledger/useCase/saveLedgerEntryWithSettlement.useCase";
import { EnsureOrderBillingAndDueLinksUseCase } from "@/feature/orders/useCase/ensureOrderBillingAndDueLinks.useCase";
import {
    buildOrderBillingDocumentNumber,
    buildOrderLedgerDueEntryRemoteId,
} from "@/feature/orders/utils/orderCommercialEffects.util";
import { findBillingDocumentForOrder } from "@/feature/orders/utils/orderCommercialProjection.util";
import {
    TransactionDirection,
    TransactionSourceModule,
    TransactionType,
} from "@/feature/transactions/types/transaction.entity.types";
import { DeleteBusinessTransactionUseCase } from "@/feature/transactions/useCase/deleteBusinessTransaction.useCase";
import { PostBusinessTransactionUseCase } from "@/feature/transactions/useCase/postBusinessTransaction.useCase";
import * as Crypto from "expo-crypto";
import {
    OrderPaymentPostingWorkflowInput,
    OrderPaymentPostingWorkflowResult,
} from "../types/orderPaymentPostingWorkflow.types";
import { RunOrderPaymentPostingWorkflowUseCase } from "./runOrderPaymentPostingWorkflow.useCase";

const MONEY_EPSILON = 0.0001;

const createWorkflowError = (
  type: "VALIDATION_ERROR" | "BUSINESS_RULE_ERROR" | "SETTLEMENT_ERROR" | "UNKNOWN_ERROR",
  message: string,
): OrderPaymentPostingWorkflowResult => ({
  success: false,
  error: { type, message },
});

const derivePaymentModeFromMoneyAccount = (
  moneyAccount: MoneyAccount,
): LedgerPaymentModeValue => {
  if (moneyAccount.type === MoneyAccountType.Cash) {
    return LedgerPaymentMode.Cash;
  }

  if (moneyAccount.type === MoneyAccountType.Wallet) {
    return LedgerPaymentMode.MobileWallet;
  }

  return LedgerPaymentMode.BankTransfer;
};

export const createRunOrderPaymentPostingWorkflowUseCase = (params: {
  getBillingOverviewUseCase: GetBillingOverviewUseCase;
  getLedgerEntriesUseCase: GetLedgerEntriesUseCase;
  getMoneyAccountsUseCase: GetMoneyAccountsUseCase;
  postBusinessTransactionUseCase: PostBusinessTransactionUseCase;
  deleteBusinessTransactionUseCase: DeleteBusinessTransactionUseCase;
  saveLedgerEntryWithSettlementUseCase: SaveLedgerEntryWithSettlementUseCase;
  ensureOrderBillingAndDueLinksUseCase: EnsureOrderBillingAndDueLinksUseCase;
}): RunOrderPaymentPostingWorkflowUseCase => ({
  async execute(
    input: OrderPaymentPostingWorkflowInput,
  ): Promise<OrderPaymentPostingWorkflowResult> {
    const normalizedOrderRemoteId = input.orderRemoteId.trim();
    const normalizedOrderNumber = input.orderNumber.trim();
    const normalizedOwnerUserRemoteId = input.ownerUserRemoteId.trim();
    const normalizedAccountRemoteId = input.accountRemoteId.trim();
    const normalizedAccountDisplayNameSnapshot =
      input.accountDisplayNameSnapshot.trim();
    const normalizedCurrencyCode = input.currencyCode?.trim().toUpperCase() ?? null;
    const normalizedSettlementMoneyAccountRemoteId =
      input.settlementMoneyAccountRemoteId.trim();
    const normalizedSettlementMoneyAccountLabel =
      input.settlementMoneyAccountDisplayNameSnapshot.trim();

    // Validation
    if (!normalizedOrderRemoteId) {
      return createWorkflowError("VALIDATION_ERROR", "Order remote id is required.");
    }

    if (!normalizedOrderNumber) {
      return createWorkflowError("VALIDATION_ERROR", "Order number is required.");
    }

    if (!normalizedOwnerUserRemoteId || !normalizedAccountRemoteId) {
      return createWorkflowError("VALIDATION_ERROR", "Active account context is required.");
    }

    if (!normalizedAccountDisplayNameSnapshot) {
      return createWorkflowError("VALIDATION_ERROR", "Account label is required.");
    }

    if (!Number.isFinite(input.amount) || input.amount <= 0) {
      return createWorkflowError("VALIDATION_ERROR", "Amount must be greater than zero.");
    }

    if (!Number.isFinite(input.happenedAt) || input.happenedAt <= 0) {
      return createWorkflowError("VALIDATION_ERROR", "Payment date is required.");
    }

    if (!normalizedSettlementMoneyAccountRemoteId) {
      return createWorkflowError("VALIDATION_ERROR", "Money account is required.");
    }

    if (!normalizedSettlementMoneyAccountLabel) {
      return createWorkflowError("VALIDATION_ERROR", "Money account label is required.");
    }

    // Validate money account
    const moneyAccountsResult =
      await params.getMoneyAccountsUseCase.execute(normalizedAccountRemoteId);
    if (!moneyAccountsResult.success) {
      return createWorkflowError("UNKNOWN_ERROR", moneyAccountsResult.error.message);
    }

    const settlementMoneyAccount = moneyAccountsResult.value
      .filter((moneyAccount) => moneyAccount.isActive)
      .find(
        (moneyAccount) =>
          moneyAccount.remoteId === normalizedSettlementMoneyAccountRemoteId,
      );

    if (!settlementMoneyAccount) {
      return createWorkflowError("VALIDATION_ERROR", "Choose a valid active money account.");
    }

    // Ensure order billing and due links
    const ensureResult =
      await params.ensureOrderBillingAndDueLinksUseCase.execute(
        normalizedOrderRemoteId,
      );

    if (!ensureResult.success) {
      return createWorkflowError("BUSINESS_RULE_ERROR", ensureResult.error.message);
    }

    // Get billing overview
    const billingOverviewResult =
      await params.getBillingOverviewUseCase.execute(normalizedAccountRemoteId);

    if (!billingOverviewResult.success) {
      return createWorkflowError("UNKNOWN_ERROR", billingOverviewResult.error.message);
    }

    const linkedBillingDocument =
      findBillingDocumentForOrder({
        orderRemoteId: ensureResult.value.order.remoteId,
        billingDocuments: billingOverviewResult.value.documents,
      }) ??
      billingOverviewResult.value.documents.find(
        (document) =>
          document.remoteId === ensureResult.value.billingDocumentRemoteId,
      ) ??
      null;

    if (!linkedBillingDocument) {
      return createWorkflowError(
        "BUSINESS_RULE_ERROR",
        "The linked billing document for this order could not be found.",
      );
    }

    // Check overpayment
    if (linkedBillingDocument.outstandingAmount <= MONEY_EPSILON) {
      return createWorkflowError("BUSINESS_RULE_ERROR", "This order is already fully paid.");
    }

    if (input.amount > linkedBillingDocument.outstandingAmount + MONEY_EPSILON) {
      return createWorkflowError(
        "BUSINESS_RULE_ERROR",
        "Payment amount exceeds the remaining balance due.",
      );
    }

    // Get ledger entries
    const ledgerEntriesResult = await params.getLedgerEntriesUseCase.execute({
      businessAccountRemoteId: normalizedAccountRemoteId,
    });

    if (!ledgerEntriesResult.success) {
      return createWorkflowError("UNKNOWN_ERROR", ledgerEntriesResult.error.message);
    }

    // Find due entry
    const deterministicDueEntryRemoteId = buildOrderLedgerDueEntryRemoteId(
      ensureResult.value.order.remoteId,
    );
    const linkedDueEntry =
      ledgerEntriesResult.value.find(
        (entry) => entry.remoteId === ensureResult.value.ledgerDueEntryRemoteId,
      ) ??
      ledgerEntriesResult.value.find(
        (entry) => entry.remoteId === deterministicDueEntryRemoteId,
      ) ??
      null;

    if (!linkedDueEntry) {
      return createWorkflowError(
        "BUSINESS_RULE_ERROR",
        "The linked ledger due entry for this order could not be found.",
      );
    }

    // Create Orders-linked payment transaction
    const paymentTransactionRemoteId = Crypto.randomUUID();
    const paymentTransactionResult = await params.postBusinessTransactionUseCase.execute({
      remoteId: paymentTransactionRemoteId,
      ownerUserRemoteId: normalizedOwnerUserRemoteId,
      accountRemoteId: normalizedAccountRemoteId,
      accountDisplayNameSnapshot: normalizedAccountDisplayNameSnapshot,
      transactionType: TransactionType.Income,
      direction: TransactionDirection.In,
      title: `Order Payment ${normalizedOrderNumber}`,
      amount: input.amount,
      currencyCode: normalizedCurrencyCode,
      categoryLabel: "Orders",
      note: input.note?.trim() || null,
      happenedAt: input.happenedAt,
      settlementMoneyAccountRemoteId: settlementMoneyAccount.remoteId,
      settlementMoneyAccountDisplayNameSnapshot: settlementMoneyAccount.name,
      sourceModule: TransactionSourceModule.Orders,
      sourceRemoteId: ensureResult.value.order.remoteId,
      sourceAction: "payment",
      idempotencyKey: `orders:${ensureResult.value.order.remoteId}:payment`,
    });

    if (!paymentTransactionResult.success) {
      return createWorkflowError("SETTLEMENT_ERROR", paymentTransactionResult.error.message);
    }

    // Create settlement with external transaction
    const settlementResult =
      await params.saveLedgerEntryWithSettlementUseCase.execute({
        mode: "create",
        businessAccountDisplayName: normalizedAccountDisplayNameSnapshot,
        selectedSettlementAccountRemoteId: normalizedSettlementMoneyAccountRemoteId,
        ledgerEntry: {
          remoteId: Crypto.randomUUID(),
          businessAccountRemoteId: normalizedAccountRemoteId,
          ownerUserRemoteId: normalizedOwnerUserRemoteId,
          partyName: ensureResult.value.contact.fullName,
          partyPhone: ensureResult.value.contact.phoneNumber ?? null,
          contactRemoteId: ensureResult.value.contact.remoteId,
          entryType: LedgerEntryType.Collection,
          balanceDirection: LedgerBalanceDirection.Receive,
          title: `Order Payment ${normalizedOrderNumber}`,
          amount: input.amount,
          currencyCode:
            normalizedCurrencyCode && normalizedCurrencyCode.length === 3
              ? normalizedCurrencyCode
              : null,
          note: input.note?.trim() || null,
          happenedAt: input.happenedAt,
          dueAt: null,
          paymentMode: null,
          referenceNumber: buildOrderBillingDocumentNumber(normalizedOrderNumber),
          reminderAt: null,
          attachmentUri: null,
          settledAgainstEntryRemoteId: linkedDueEntry.remoteId,
          linkedDocumentRemoteId: linkedBillingDocument.remoteId,
          linkedTransactionRemoteId: null,
          settlementAccountRemoteId: null,
          settlementAccountDisplayNameSnapshot: null,
        },
        existingLedgerEntries: ledgerEntriesResult.value,
        settlementCandidates: [
          {
            remoteId: linkedDueEntry.remoteId,
            outstandingAmount: linkedBillingDocument.outstandingAmount,
          },
        ],
        externalSettlementTransaction: {
          remoteId: paymentTransactionRemoteId,
          settlementMoneyAccountRemoteId: settlementMoneyAccount.remoteId,
          settlementMoneyAccountDisplayNameSnapshot: settlementMoneyAccount.name,
          paymentMode: derivePaymentModeFromMoneyAccount(settlementMoneyAccount),
        },
      });

    if (!settlementResult.success) {
      // Rollback payment transaction
      await params.deleteBusinessTransactionUseCase.execute(paymentTransactionRemoteId);
      return createWorkflowError("SETTLEMENT_ERROR", settlementResult.error.message);
    }

    return {
      success: true,
      value: {
        orderRemoteId: ensureResult.value.order.remoteId,
        paymentTransactionRemoteId,
        settlementLedgerEntryRemoteId: settlementResult.value.remoteId,
        billingDocumentRemoteId: linkedBillingDocument.remoteId,
        ledgerDueEntryRemoteId: linkedDueEntry.remoteId,
      },
    };
  },
});
