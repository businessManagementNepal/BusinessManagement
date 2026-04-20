import { OrderRepository } from "@/feature/orders/data/repository/order.repository";
import {
  OrderOperationResult,
  OrderValidationError,
} from "@/feature/orders/types/order.types";
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
import { GetTransactionsUseCase } from "@/feature/transactions/useCase/getTransactions.useCase";
import * as Crypto from "expo-crypto";
import { RecordOrderPaymentUseCase } from "./recordOrderPayment.useCase";

const MONEY_EPSILON = 0.0001;

export const createRecordOrderPaymentUseCase = (params: {
  orderRepository: OrderRepository;
  addTransactionUseCase: AddTransactionUseCase;
  getTransactionsUseCase: GetTransactionsUseCase;
}): RecordOrderPaymentUseCase => ({
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
      order: orderResult.value,
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

    return { success: true, value: true };
  },
});
