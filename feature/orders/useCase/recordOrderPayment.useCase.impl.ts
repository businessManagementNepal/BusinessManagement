import { MoneyAccount } from "@/feature/accounts/types/moneyAccount.types";
import { GetMoneyAccountsUseCase } from "@/feature/accounts/useCase/getMoneyAccounts.useCase";
import { Contact } from "@/feature/contacts/types/contact.types";
import { DeleteBillingDocumentAllocationsBySettlementEntryRemoteIdUseCase } from "@/feature/billing/useCase/deleteBillingDocumentAllocationsBySettlementEntryRemoteId.useCase";
import { ReplaceBillingDocumentAllocationsForSettlementEntryUseCase } from "@/feature/billing/useCase/replaceBillingDocumentAllocationsForSettlementEntry.useCase";
import { AddLedgerEntryUseCase } from "@/feature/ledger/useCase/addLedgerEntry.useCase";
import { DeleteLedgerEntryUseCase } from "@/feature/ledger/useCase/deleteLedgerEntry.useCase";
import { OrderRepository } from "@/feature/orders/data/repository/order.repository";
import {
  OrderOperationResult,
  OrderValidationError,
} from "@/feature/orders/types/order.types";
import {
  buildOrderPaymentSettlementLedgerEntryRemoteId,
  buildOrderPaymentSettlementLedgerPayload,
} from "@/feature/orders/utils/orderCommercialEffects.util";
import {
  ORDER_PAYMENT_TRANSACTION_TITLE_PREFIX,
  ORDER_TRANSACTION_SOURCE_ACTION,
  calculateOrderSettlementSnapshot,
} from "@/feature/orders/utils/orderSettlementFromTransactions.util";
import {
  TransactionDirection,
  TransactionSourceModule,
  TransactionType,
} from "@/feature/transactions/types/transaction.entity.types";
import { AddTransactionUseCase } from "@/feature/transactions/useCase/addTransaction.useCase";
import { DeleteBusinessTransactionUseCase } from "@/feature/transactions/useCase/deleteBusinessTransaction.useCase";
import { GetTransactionsUseCase } from "@/feature/transactions/useCase/getTransactions.useCase";
import * as Crypto from "expo-crypto";
import { EnsureOrderBillingAndDueLinksUseCase } from "./ensureOrderBillingAndDueLinks.useCase";
import { RecordOrderPaymentUseCase } from "./recordOrderPayment.useCase";

const MONEY_EPSILON = 0.0001;

type RecordOrderPaymentDependencies = {
  orderRepository: OrderRepository;
  addTransactionUseCase: AddTransactionUseCase;
  getTransactionsUseCase?: GetTransactionsUseCase;
  deleteBusinessTransactionUseCase?: DeleteBusinessTransactionUseCase;
  getMoneyAccountsUseCase?: GetMoneyAccountsUseCase;
  addLedgerEntryUseCase?: AddLedgerEntryUseCase;
  deleteLedgerEntryUseCase?: DeleteLedgerEntryUseCase;
  replaceBillingDocumentAllocationsForSettlementEntryUseCase?:
    ReplaceBillingDocumentAllocationsForSettlementEntryUseCase;
  deleteBillingDocumentAllocationsBySettlementEntryRemoteIdUseCase?:
    DeleteBillingDocumentAllocationsBySettlementEntryRemoteIdUseCase;
  ensureOrderBillingAndDueLinksUseCase?: EnsureOrderBillingAndDueLinksUseCase;
};

const buildRollbackAwareValidationError = (params: {
  primaryMessage: string;
  rollbackErrors: readonly string[];
}) =>
  OrderValidationError(
    params.rollbackErrors.length > 0
      ? `${params.primaryMessage} Rollback failed: ${params.rollbackErrors.join(" | ")}`
      : params.primaryMessage,
  );

const rollbackOrderTransaction = async (params: {
  transactionRemoteId: string;
  deleteBusinessTransactionUseCase: DeleteBusinessTransactionUseCase;
}): Promise<string | null> => {
  const result = await params.deleteBusinessTransactionUseCase.execute(
    params.transactionRemoteId,
  );

  if (result.success) {
    return null;
  }

  return result.error.message;
};

const resolveActiveSettlementMoneyAccount = (params: {
  moneyAccounts: readonly MoneyAccount[];
  settlementMoneyAccountRemoteId: string;
}): MoneyAccount | null =>
  params.moneyAccounts.find(
    (account) =>
      account.remoteId === params.settlementMoneyAccountRemoteId && account.isActive,
  ) ?? null;

export const createRecordOrderPaymentUseCase = (
  params: RecordOrderPaymentDependencies,
): RecordOrderPaymentUseCase => ({
  async execute({
    orderRemoteId,
    orderNumber,
    ownerUserRemoteId,
    accountRemoteId,
    accountDisplayNameSnapshot,
    currencyCode,
    amount,
    happenedAt,
    settlementMoneyAccountRemoteId,
    settlementMoneyAccountDisplayNameSnapshot,
    note,
  }): Promise<OrderOperationResult> {
    const normalizedOrderRemoteId = orderRemoteId.trim();
    const normalizedOrderNumber = orderNumber.trim();
    const normalizedOwnerUserRemoteId = ownerUserRemoteId.trim();
    const normalizedAccountRemoteId = accountRemoteId.trim();
    const normalizedAccountDisplayNameSnapshot = accountDisplayNameSnapshot.trim();
    const normalizedCurrencyCode = currencyCode?.trim().toUpperCase() ?? null;
    const normalizedSettlementMoneyAccountRemoteId =
      settlementMoneyAccountRemoteId.trim();
    const normalizedSettlementMoneyAccountLabel =
      settlementMoneyAccountDisplayNameSnapshot.trim();

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
    if (!Number.isFinite(amount) || amount <= 0) {
      return {
        success: false,
        error: OrderValidationError("Amount must be greater than zero."),
      };
    }
    if (!Number.isFinite(happenedAt) || happenedAt <= 0) {
      return {
        success: false,
        error: OrderValidationError("Payment date is required."),
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

    const orderResult = await params.orderRepository.getOrderByRemoteId(
      normalizedOrderRemoteId,
    );
    if (!orderResult.success) {
      return { success: false, error: orderResult.error };
    }

    const hasAnyCommercialEffectsDependency = Boolean(
      params.deleteBusinessTransactionUseCase ||
        params.getMoneyAccountsUseCase ||
        params.addLedgerEntryUseCase ||
        params.deleteLedgerEntryUseCase ||
        params.replaceBillingDocumentAllocationsForSettlementEntryUseCase ||
        params.deleteBillingDocumentAllocationsBySettlementEntryRemoteIdUseCase ||
        params.ensureOrderBillingAndDueLinksUseCase,
    );
    const hasAllCommercialEffectsDependencies = Boolean(
      params.deleteBusinessTransactionUseCase &&
        params.getMoneyAccountsUseCase &&
        params.addLedgerEntryUseCase &&
        params.deleteLedgerEntryUseCase &&
        params.replaceBillingDocumentAllocationsForSettlementEntryUseCase &&
        params.deleteBillingDocumentAllocationsBySettlementEntryRemoteIdUseCase &&
        params.ensureOrderBillingAndDueLinksUseCase,
    );

    if (
      hasAnyCommercialEffectsDependency &&
      !hasAllCommercialEffectsDependencies
    ) {
      return {
        success: false,
        error: OrderValidationError(
          "Order payment commercial effects are not fully configured.",
        ),
      };
    }

    if (
      hasAllCommercialEffectsDependencies &&
      !params.getTransactionsUseCase
    ) {
      return {
        success: false,
        error: OrderValidationError(
          "Transaction settlement validation dependency is required.",
        ),
      };
    }

    let ensuredOrder = orderResult.value;
    let ensuredCommercialLinks: {
      contact: Contact;
      billingDocumentRemoteId: string;
      ledgerDueEntryRemoteId: string;
    } | null = null;

    if (hasAllCommercialEffectsDependencies) {
      const ensureResult =
        await (
          params.ensureOrderBillingAndDueLinksUseCase as EnsureOrderBillingAndDueLinksUseCase
        ).execute(normalizedOrderRemoteId);

      if (!ensureResult.success) {
        return { success: false, error: ensureResult.error };
      }

      ensuredOrder = ensureResult.value.order;
      ensuredCommercialLinks = {
        contact: ensureResult.value.contact,
        billingDocumentRemoteId: ensureResult.value.billingDocumentRemoteId,
        ledgerDueEntryRemoteId: ensureResult.value.ledgerDueEntryRemoteId,
      };
    }

    if (params.getTransactionsUseCase) {
      const transactionsResult = await params.getTransactionsUseCase.execute({
        ownerUserRemoteId: normalizedOwnerUserRemoteId,
        accountRemoteId: normalizedAccountRemoteId,
      });

      if (!transactionsResult.success) {
        return {
          success: false,
          error: OrderValidationError(transactionsResult.error.message),
        };
      }

      const settlementSnapshot = calculateOrderSettlementSnapshot({
        order: ensuredOrder,
        transactions: transactionsResult.value,
      });

      if (
        settlementSnapshot.balanceDueAmount !== null &&
        settlementSnapshot.balanceDueAmount <= MONEY_EPSILON
      ) {
        return {
          success: false,
          error: OrderValidationError("This order is already fully paid."),
        };
      }

      if (
        settlementSnapshot.balanceDueAmount !== null &&
        amount > settlementSnapshot.balanceDueAmount + MONEY_EPSILON
      ) {
        return {
          success: false,
          error: OrderValidationError(
            "Payment amount exceeds the remaining balance due.",
          ),
        };
      }
    }

    const transactionResult = await params.addTransactionUseCase.execute({
      remoteId: Crypto.randomUUID(),
      ownerUserRemoteId: normalizedOwnerUserRemoteId,
      accountRemoteId: normalizedAccountRemoteId,
      accountDisplayNameSnapshot: normalizedAccountDisplayNameSnapshot,
      transactionType: TransactionType.Income,
      direction: TransactionDirection.In,
      title: `${ORDER_PAYMENT_TRANSACTION_TITLE_PREFIX}${normalizedOrderNumber}`,
      amount,
      currencyCode:
        normalizedCurrencyCode && normalizedCurrencyCode.length === 3
          ? normalizedCurrencyCode
          : null,
      categoryLabel: "Orders",
      note: note?.trim() || null,
      happenedAt,
      settlementMoneyAccountRemoteId: normalizedSettlementMoneyAccountRemoteId,
      settlementMoneyAccountDisplayNameSnapshot:
        normalizedSettlementMoneyAccountLabel,
      sourceModule: TransactionSourceModule.Orders,
      sourceRemoteId: normalizedOrderRemoteId,
      sourceAction: ORDER_TRANSACTION_SOURCE_ACTION.Payment,
    });

    if (!transactionResult.success) {
      return {
        success: false,
        error: OrderValidationError(transactionResult.error.message),
      };
    }

    if (!hasAllCommercialEffectsDependencies || !ensuredCommercialLinks) {
      return { success: true, value: true };
    }

    const moneyAccountsResult = await (
      params.getMoneyAccountsUseCase as GetMoneyAccountsUseCase
    ).execute(normalizedAccountRemoteId);
    if (!moneyAccountsResult.success) {
      const rollbackError = await rollbackOrderTransaction({
        transactionRemoteId: transactionResult.value.remoteId,
        deleteBusinessTransactionUseCase:
          params.deleteBusinessTransactionUseCase as DeleteBusinessTransactionUseCase,
      });

      return {
        success: false,
        error: buildRollbackAwareValidationError({
          primaryMessage: moneyAccountsResult.error.message,
          rollbackErrors: rollbackError ? [rollbackError] : [],
        }),
      };
    }

    const settlementMoneyAccount = resolveActiveSettlementMoneyAccount({
      moneyAccounts: moneyAccountsResult.value,
      settlementMoneyAccountRemoteId: normalizedSettlementMoneyAccountRemoteId,
    });

    if (!settlementMoneyAccount) {
      const rollbackError = await rollbackOrderTransaction({
        transactionRemoteId: transactionResult.value.remoteId,
        deleteBusinessTransactionUseCase:
          params.deleteBusinessTransactionUseCase as DeleteBusinessTransactionUseCase,
      });

      return {
        success: false,
        error: buildRollbackAwareValidationError({
          primaryMessage: "Choose a valid active money account.",
          rollbackErrors: rollbackError ? [rollbackError] : [],
        }),
      };
    }

    const settlementLedgerEntryRemoteId =
      buildOrderPaymentSettlementLedgerEntryRemoteId({
        orderRemoteId: normalizedOrderRemoteId,
        transactionRemoteId: transactionResult.value.remoteId,
      });

    const ledgerSettlementResult = await (
      params.addLedgerEntryUseCase as AddLedgerEntryUseCase
    ).execute(
      buildOrderPaymentSettlementLedgerPayload({
        order: ensuredOrder,
        contact: ensuredCommercialLinks.contact,
        billingDocumentRemoteId: ensuredCommercialLinks.billingDocumentRemoteId,
        ledgerDueEntryRemoteId: ensuredCommercialLinks.ledgerDueEntryRemoteId,
        settlementLedgerEntryRemoteId,
        linkedTransactionRemoteId: transactionResult.value.remoteId,
        settlementMoneyAccount,
        settlementMoneyAccountDisplayNameSnapshot:
          normalizedSettlementMoneyAccountLabel,
        amount,
        happenedAt,
        note: note?.trim() || null,
        currencyCode:
          normalizedCurrencyCode && normalizedCurrencyCode.length === 3
            ? normalizedCurrencyCode
            : null,
      }),
    );

    if (!ledgerSettlementResult.success) {
      const rollbackError = await rollbackOrderTransaction({
        transactionRemoteId: transactionResult.value.remoteId,
        deleteBusinessTransactionUseCase:
          params.deleteBusinessTransactionUseCase as DeleteBusinessTransactionUseCase,
      });

      return {
        success: false,
        error: buildRollbackAwareValidationError({
          primaryMessage: ledgerSettlementResult.error.message,
          rollbackErrors: rollbackError ? [rollbackError] : [],
        }),
      };
    }

    const allocationResult =
      await (
        params.replaceBillingDocumentAllocationsForSettlementEntryUseCase as ReplaceBillingDocumentAllocationsForSettlementEntryUseCase
      ).execute({
        accountRemoteId: normalizedAccountRemoteId,
        settlementLedgerEntryRemoteId,
        settlementTransactionRemoteId: transactionResult.value.remoteId,
        settledAt: happenedAt,
        note: note?.trim() || null,
        allocations: [
          {
            documentRemoteId: ensuredCommercialLinks.billingDocumentRemoteId,
            amount,
          },
        ],
      });

    if (!allocationResult.success) {
      const rollbackErrors: string[] = [];

      const deleteAllocationsResult =
        await (
          params.deleteBillingDocumentAllocationsBySettlementEntryRemoteIdUseCase as DeleteBillingDocumentAllocationsBySettlementEntryRemoteIdUseCase
        ).execute(settlementLedgerEntryRemoteId);
      if (!deleteAllocationsResult.success) {
        rollbackErrors.push(deleteAllocationsResult.error.message);
      }

      const deleteSettlementLedgerResult =
        await (
          params.deleteLedgerEntryUseCase as DeleteLedgerEntryUseCase
        ).execute(settlementLedgerEntryRemoteId);
      if (!deleteSettlementLedgerResult.success) {
        rollbackErrors.push(deleteSettlementLedgerResult.error.message);
      }

      const deleteOrderTransactionResult =
        await (
          params.deleteBusinessTransactionUseCase as DeleteBusinessTransactionUseCase
        ).execute(transactionResult.value.remoteId);
      if (!deleteOrderTransactionResult.success) {
        rollbackErrors.push(deleteOrderTransactionResult.error.message);
      }

      return {
        success: false,
        error: buildRollbackAwareValidationError({
          primaryMessage: allocationResult.error.message,
          rollbackErrors,
        }),
      };
    }

    return { success: true, value: true };
  },
});
