import {
    MoneyAccount,
    MoneyAccountType,
} from "@/feature/accounts/types/moneyAccount.types";
import { GetMoneyAccountsUseCase } from "@/feature/accounts/useCase/getMoneyAccounts.useCase";
import { DeleteBillingDocumentUseCase } from "@/feature/billing/useCase/deleteBillingDocument.useCase";
import { GetBillingOverviewUseCase } from "@/feature/billing/useCase/getBillingOverview.useCase";
import { SaveBillingDocumentUseCase } from "@/feature/billing/useCase/saveBillingDocument.useCase";
import {
    LedgerEntryType,
    LedgerPaymentMode,
    LedgerPaymentModeValue,
} from "@/feature/ledger/types/ledger.entity.types";
import { GetLedgerEntriesUseCase } from "@/feature/ledger/useCase/getLedgerEntries.useCase";
import { SaveLedgerEntryWithSettlementUseCase } from "@/feature/ledger/useCase/saveLedgerEntryWithSettlement.useCase";
import { OrderValidationError } from "@/feature/orders/types/order.types";
import { EnsureOrderBillingAndDueLinksUseCase } from "@/feature/orders/useCase/ensureOrderBillingAndDueLinks.useCase";
import {
    buildOrderRefundBillingDocumentNumber,
    buildOrderRefundBillingDocumentPayload,
    buildOrderRefundBillingDocumentRemoteId,
    buildOrderRefundIdempotencyKey,
    buildOrderRefundSettlementLedgerEntryRemoteId,
    buildOrderRefundTransactionRemoteId,
} from "@/feature/orders/utils/orderCommercialEffects.util";
import { calculateOrderCommercialSettlementSnapshot } from "@/feature/orders/utils/orderCommercialProjection.util";
import { TransactionRepository } from "@/feature/transactions/data/repository/transaction.repository";
import {
    SaveTransactionPayload,
    TransactionDirection,
    TransactionSourceModule,
    TransactionType,
} from "@/feature/transactions/types/transaction.entity.types";
import { DeleteBusinessTransactionUseCase } from "@/feature/transactions/useCase/deleteBusinessTransaction.useCase";
import { PostBusinessTransactionUseCase } from "@/feature/transactions/useCase/postBusinessTransaction.useCase";
import {
    OrderRefundPostingWorkflowInput,
    OrderRefundPostingWorkflowResult,
} from "../types/orderRefundPostingWorkflow.types";
import { RunOrderRefundPostingWorkflowUseCase } from "./runOrderRefundPostingWorkflow.useCase";

const MONEY_EPSILON = 0.0001;

const buildRollbackAwareValidationError = (params: {
  primaryMessage: string;
  rollbackMessage: string | null;
}) =>
  OrderValidationError(
    params.rollbackMessage
      ? `${params.primaryMessage} Rollback failed: ${params.rollbackMessage}` 
      : params.primaryMessage,
  );

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

const buildOrderRefundTransactionPayload = (params: {
  remoteId: string;
  orderRemoteId: string;
  orderNumber: string;
  ownerUserRemoteId: string;
  accountRemoteId: string;
  accountDisplayNameSnapshot: string;
  currencyCode: string | null;
  amount: number;
  happenedAt: number;
  settlementMoneyAccountRemoteId: string;
  settlementMoneyAccountDisplayNameSnapshot: string;
  note: string | null;
  contactRemoteId: string | null;
  refundAttemptRemoteId: string;
}): SaveTransactionPayload => ({
  remoteId: params.remoteId,
  ownerUserRemoteId: params.ownerUserRemoteId,
  accountRemoteId: params.accountRemoteId,
  accountDisplayNameSnapshot: params.accountDisplayNameSnapshot,
  transactionType: TransactionType.Expense,
  direction: TransactionDirection.Out,
  title: `Order Refund ${params.orderNumber}`,
  amount: params.amount,
  currencyCode: params.currencyCode,
  categoryLabel: "Orders",
  note: params.note,
  happenedAt: params.happenedAt,
  settlementMoneyAccountRemoteId: params.settlementMoneyAccountRemoteId,
  settlementMoneyAccountDisplayNameSnapshot:
    params.settlementMoneyAccountDisplayNameSnapshot,
  sourceModule: TransactionSourceModule.Orders,
  sourceRemoteId: params.orderRemoteId,
  sourceAction: "refund",
  idempotencyKey: buildOrderRefundIdempotencyKey(params.refundAttemptRemoteId),
  contactRemoteId: params.contactRemoteId,
});

const rollbackCreatedOrderRefundTransaction = async (params: {
  refundTransactionRemoteId: string;
  deleteBusinessTransactionUseCase: DeleteBusinessTransactionUseCase;
}): Promise<string | null> => {
  const deleteResult = await params.deleteBusinessTransactionUseCase.execute(
    params.refundTransactionRemoteId,
  );

  if (deleteResult.success) {
    return null;
  }

  return deleteResult.error.message;
};

const rollbackCreatedRefundBillingDocument = async (params: {
  refundBillingDocumentRemoteId: string;
  deleteBillingDocumentUseCase: DeleteBillingDocumentUseCase;
}): Promise<string | null> => {
  const deleteResult = await params.deleteBillingDocumentUseCase.execute(
    params.refundBillingDocumentRemoteId,
  );

  if (deleteResult.success) {
    return null;
  }

  return deleteResult.error.message;
};

const rollbackRefundArtifacts = async (params: {
  refundTransactionRemoteId: string | null;
  refundBillingDocumentRemoteId: string | null;
  deleteBusinessTransactionUseCase: DeleteBusinessTransactionUseCase;
  deleteBillingDocumentUseCase: DeleteBillingDocumentUseCase;
}): Promise<string | null> => {
  const rollbackMessages: string[] = [];

  if (params.refundTransactionRemoteId) {
    const transactionRollback = await rollbackCreatedOrderRefundTransaction({
      refundTransactionRemoteId: params.refundTransactionRemoteId,
      deleteBusinessTransactionUseCase:
        params.deleteBusinessTransactionUseCase,
    });

    if (transactionRollback) {
      rollbackMessages.push(
        `refund transaction rollback failed: ${transactionRollback}`,
      );
    }
  }

  if (params.refundBillingDocumentRemoteId) {
    const billingRollback = await rollbackCreatedRefundBillingDocument({
      refundBillingDocumentRemoteId: params.refundBillingDocumentRemoteId,
      deleteBillingDocumentUseCase: params.deleteBillingDocumentUseCase,
    });

    if (billingRollback) {
      rollbackMessages.push(
        `refund billing rollback failed: ${billingRollback}`,
      );
    }
  }

  return rollbackMessages.length > 0 ? rollbackMessages.join(" | ") : null;
};

export const createRunOrderRefundPostingWorkflowUseCase = (params: {
  getBillingOverviewUseCase: GetBillingOverviewUseCase;
  getLedgerEntriesUseCase: GetLedgerEntriesUseCase;
  getMoneyAccountsUseCase: GetMoneyAccountsUseCase;
  transactionRepository: TransactionRepository;
  postBusinessTransactionUseCase: PostBusinessTransactionUseCase;
  deleteBusinessTransactionUseCase: DeleteBusinessTransactionUseCase;
  saveBillingDocumentUseCase: SaveBillingDocumentUseCase;
  deleteBillingDocumentUseCase: DeleteBillingDocumentUseCase;
  saveLedgerEntryWithSettlementUseCase: SaveLedgerEntryWithSettlementUseCase;
  ensureOrderBillingAndDueLinksUseCase: EnsureOrderBillingAndDueLinksUseCase;
}): RunOrderRefundPostingWorkflowUseCase => ({
  async execute(
    input: OrderRefundPostingWorkflowInput,
  ): Promise<OrderRefundPostingWorkflowResult> {
    const normalizedOrderRemoteId = input.orderRemoteId.trim();
    const normalizedOrderNumber = input.orderNumber.trim();
    const normalizedRefundAttemptRemoteId = input.refundAttemptRemoteId.trim();
    const normalizedOwnerUserRemoteId = input.ownerUserRemoteId.trim();
    const normalizedAccountRemoteId = input.accountRemoteId.trim();
    const normalizedAccountDisplayNameSnapshot =
      input.accountDisplayNameSnapshot.trim();
    const normalizedCurrencyCode =
      input.currencyCode?.trim().toUpperCase() ?? null;
    const normalizedSettlementMoneyAccountRemoteId =
      input.settlementMoneyAccountRemoteId.trim();
    const normalizedSettlementMoneyAccountLabel =
      input.settlementMoneyAccountDisplayNameSnapshot.trim();

    if (!normalizedRefundAttemptRemoteId) {
      return {
        success: false,
        error: OrderValidationError("Refund attempt id is required."),
      };
    }

    if (!normalizedOrderRemoteId) {
      return {
        success: false,
        error: OrderValidationError("Order remote id is required."),
      };
    }

    if (!normalizedOrderNumber) {
      return {
        success: false,
        error: OrderValidationError("Order number is required."),
      };
    }

    if (!normalizedOwnerUserRemoteId || !normalizedAccountRemoteId) {
      return {
        success: false,
        error: OrderValidationError("Active account context is required."),
      };
    }

    if (!normalizedAccountDisplayNameSnapshot) {
      return {
        success: false,
        error: OrderValidationError("Account label is required."),
      };
    }

    if (!Number.isFinite(input.amount) || input.amount <= 0) {
      return {
        success: false,
        error: OrderValidationError("Amount must be greater than zero."),
      };
    }

    if (!Number.isFinite(input.happenedAt) || input.happenedAt <= 0) {
      return {
        success: false,
        error: OrderValidationError("Refund date is required."),
      };
    }

    if (!normalizedSettlementMoneyAccountRemoteId) {
      return {
        success: false,
        error: OrderValidationError("Money account is required."),
      };
    }

    if (!normalizedSettlementMoneyAccountLabel) {
      return {
        success: false,
        error: OrderValidationError("Money account label is required."),
      };
    }

    const moneyAccountsResult =
      await params.getMoneyAccountsUseCase.execute(normalizedAccountRemoteId);

    if (!moneyAccountsResult.success) {
      return {
        success: false,
        error: OrderValidationError(moneyAccountsResult.error.message),
      };
    }

    const settlementMoneyAccount = moneyAccountsResult.value
      .filter((moneyAccount) => moneyAccount.isActive)
      .find(
        (moneyAccount) =>
          moneyAccount.remoteId === normalizedSettlementMoneyAccountRemoteId,
      );

    if (!settlementMoneyAccount) {
      return {
        success: false,
        error: OrderValidationError("Choose a valid active money account."),
      };
    }

    const ensureResult =
      await params.ensureOrderBillingAndDueLinksUseCase.execute(
        normalizedOrderRemoteId,
      );

    if (!ensureResult.success) {
      return { success: false, error: ensureResult.error };
    }

    const [billingOverviewResult, ledgerEntriesResult, transactionsResult] =
      await Promise.all([
        params.getBillingOverviewUseCase.execute(normalizedAccountRemoteId),
        params.getLedgerEntriesUseCase.execute({
          businessAccountRemoteId: normalizedAccountRemoteId,
        }),
        params.transactionRepository.getPostedOrderLinkedTransactionsByOrderRemoteIds({
          accountRemoteId: normalizedAccountRemoteId,
          orderRemoteIds: [normalizedOrderRemoteId],
        }),
      ]);

    if (!billingOverviewResult.success) {
      return {
        success: false,
        error: OrderValidationError(billingOverviewResult.error.message),
      };
    }

    if (!ledgerEntriesResult.success) {
      return {
        success: false,
        error: OrderValidationError(ledgerEntriesResult.error.message),
      };
    }

    if (!transactionsResult.success) {
      return {
        success: false,
        error: OrderValidationError(transactionsResult.error.message),
      };
    }

    const settlementSnapshot = calculateOrderCommercialSettlementSnapshot({
      order: ensureResult.value.order,
      billingDocuments: billingOverviewResult.value.documents,
      ledgerEntries: ledgerEntriesResult.value,
      transactions: transactionsResult.value,
    });

    if (!settlementSnapshot.dueEntry) {
      return {
        success: false,
        error: OrderValidationError(
          "The linked ledger due entry for this order could not be found.",
        ),
      };
    }

    if (settlementSnapshot.paidAmount <= MONEY_EPSILON) {
      return {
        success: false,
        error: OrderValidationError(
          "This order has no paid amount available for refund.",
        ),
      };
    }

    if (input.amount > settlementSnapshot.paidAmount + MONEY_EPSILON) {
      return {
        success: false,
        error: OrderValidationError(
          "Refund amount exceeds the net paid amount for this order.",
        ),
      };
    }

    const refundTransactionRemoteId = buildOrderRefundTransactionRemoteId(
      normalizedRefundAttemptRemoteId,
    );

    const refundSettlementLedgerEntryRemoteId =
      buildOrderRefundSettlementLedgerEntryRemoteId(
        normalizedRefundAttemptRemoteId,
      );

    const existingRefundSettlementEntry =
      ledgerEntriesResult.value.find(
        (entry) => entry.remoteId === refundSettlementLedgerEntryRemoteId,
      ) ?? null;

    const refundBillingDocumentRemoteId = buildOrderRefundBillingDocumentRemoteId(
      {
        orderRemoteId: ensureResult.value.order.remoteId,
        refundLedgerEntryRemoteId: refundSettlementLedgerEntryRemoteId,
      },
    );

    const refundTransactionResult =
      await params.postBusinessTransactionUseCase.execute(
        buildOrderRefundTransactionPayload({
          remoteId: refundTransactionRemoteId,
          orderRemoteId: ensureResult.value.order.remoteId,
          orderNumber: normalizedOrderNumber,
          ownerUserRemoteId: normalizedOwnerUserRemoteId,
          accountRemoteId: normalizedAccountRemoteId,
          accountDisplayNameSnapshot: normalizedAccountDisplayNameSnapshot,
          currencyCode:
            normalizedCurrencyCode && normalizedCurrencyCode.length === 3
              ? normalizedCurrencyCode
              : null,
          amount: input.amount,
          happenedAt: input.happenedAt,
          settlementMoneyAccountRemoteId: settlementMoneyAccount.remoteId,
          settlementMoneyAccountDisplayNameSnapshot: settlementMoneyAccount.name,
          note: input.note?.trim() || null,
          contactRemoteId: ensureResult.value.contact.remoteId,
          refundAttemptRemoteId: normalizedRefundAttemptRemoteId,
        }),
      );

    if (!refundTransactionResult.success) {
      return {
        success: false,
        error: OrderValidationError(refundTransactionResult.error.message),
      };
    }

    const saveRefundDocumentResult =
      await params.saveBillingDocumentUseCase.execute(
        buildOrderRefundBillingDocumentPayload({
          order: ensureResult.value.order,
          contact: ensureResult.value.contact,
          refundBillingDocumentRemoteId,
          refundLedgerEntryRemoteId: refundSettlementLedgerEntryRemoteId,
          amount: input.amount,
          happenedAt: input.happenedAt,
          note: input.note?.trim() || null,
        }),
      );

    if (!saveRefundDocumentResult.success) {
      const rollbackMessage =
        existingRefundSettlementEntry === null
          ? await rollbackCreatedOrderRefundTransaction({
              refundTransactionRemoteId,
              deleteBusinessTransactionUseCase:
                params.deleteBusinessTransactionUseCase,
            })
          : null;

      return {
        success: false,
        error: buildRollbackAwareValidationError({
          primaryMessage: saveRefundDocumentResult.error.message,
          rollbackMessage,
        }),
      };
    }

    const settlementResult =
      await params.saveLedgerEntryWithSettlementUseCase.execute({
        mode: existingRefundSettlementEntry ? "update" : "create",
        businessAccountDisplayName: normalizedAccountDisplayNameSnapshot,
        selectedSettlementAccountRemoteId:
          normalizedSettlementMoneyAccountRemoteId,
        externalSettlementTransaction: {
          remoteId: refundTransactionRemoteId,
          settlementMoneyAccountRemoteId: settlementMoneyAccount.remoteId,
          settlementMoneyAccountDisplayNameSnapshot: settlementMoneyAccount.name,
          paymentMode: derivePaymentModeFromMoneyAccount(settlementMoneyAccount),
        },
        ledgerEntry: {
          remoteId: refundSettlementLedgerEntryRemoteId,
          businessAccountRemoteId: normalizedAccountRemoteId,
          ownerUserRemoteId: normalizedOwnerUserRemoteId,
          partyName: ensureResult.value.contact.fullName,
          partyPhone: ensureResult.value.contact.phoneNumber ?? null,
          contactRemoteId: ensureResult.value.contact.remoteId,
          entryType: LedgerEntryType.PaymentOut,
          balanceDirection: settlementSnapshot.dueEntry.balanceDirection,
          title: `Order Refund ${normalizedOrderNumber}`,
          amount: input.amount,
          currencyCode:
            normalizedCurrencyCode && normalizedCurrencyCode.length === 3
              ? normalizedCurrencyCode
              : null,
          note: input.note?.trim() || null,
          happenedAt: input.happenedAt,
          dueAt: null,
          paymentMode: null,
          referenceNumber: buildOrderRefundBillingDocumentNumber({
            orderNumber: normalizedOrderNumber,
            refundLedgerEntryRemoteId: refundSettlementLedgerEntryRemoteId,
          }),
          reminderAt: null,
          attachmentUri: null,
          settledAgainstEntryRemoteId: settlementSnapshot.dueEntry.remoteId,
          linkedDocumentRemoteId: refundBillingDocumentRemoteId,
          linkedTransactionRemoteId: null,
          settlementAccountRemoteId: null,
          settlementAccountDisplayNameSnapshot: null,
        },
        existingLedgerEntries: ledgerEntriesResult.value,
        settlementCandidates: [],
      });

    if (!settlementResult.success) {
      const rollbackMessage =
        existingRefundSettlementEntry === null
          ? await rollbackRefundArtifacts({
              refundTransactionRemoteId,
              refundBillingDocumentRemoteId,
              deleteBusinessTransactionUseCase:
                params.deleteBusinessTransactionUseCase,
              deleteBillingDocumentUseCase: params.deleteBillingDocumentUseCase,
            })
          : null;

      return {
        success: false,
        error: buildRollbackAwareValidationError({
          primaryMessage: settlementResult.error.message,
          rollbackMessage,
        }),
      };
    }

    return {
      success: true,
      value: {
        orderRemoteId: ensureResult.value.order.remoteId,
        refundTransactionRemoteId,
        refundSettlementLedgerEntryRemoteId: settlementResult.value.remoteId,
        refundBillingDocumentRemoteId,
        originalDueEntryRemoteId: settlementSnapshot.dueEntry.remoteId,
      },
    };
  },
});
