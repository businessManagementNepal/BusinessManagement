import { GetOrdersUseCase } from "@/feature/orders/useCase/getOrders.useCase";
import {
  ORDER_PAYMENT_TRANSACTION_TITLE_PREFIX,
  ORDER_REFUND_TRANSACTION_TITLE_PREFIX,
  ORDER_TRANSACTION_SOURCE_ACTION,
} from "@/feature/orders/utils/orderSettlementFromTransactions.util";
import { TransactionSourceModule } from "@/feature/transactions/types/transaction.entity.types";
import { PostBusinessTransactionUseCase } from "@/feature/transactions/useCase/postBusinessTransaction.useCase";
import { GetTransactionsUseCase } from "@/feature/transactions/useCase/getTransactions.useCase";
import { Result } from "@/shared/types/result.types";
import {
  OrderLegacyTransactionLinkRepairWorkflowInput,
  OrderLegacyTransactionLinkRepairWorkflowResult,
} from "../types/orderLegacyTransactionLinkRepairWorkflow.types";
import { RunOrderLegacyTransactionLinkRepairWorkflowUseCase } from "./runOrderLegacyTransactionLinkRepairWorkflow.useCase";

type ParsedLegacyOrderTransaction = {
  sourceAction: string;
  orderNumber: string;
};

const safeTrim = (value: string | null | undefined): string =>
  typeof value === "string" ? value.trim() : "";

const parseLegacyOrderTransactionTitle = (
  title: string,
): ParsedLegacyOrderTransaction | null => {
  const normalizedTitle = safeTrim(title);

  if (normalizedTitle.startsWith(ORDER_PAYMENT_TRANSACTION_TITLE_PREFIX)) {
    const orderNumber = safeTrim(
      normalizedTitle.slice(ORDER_PAYMENT_TRANSACTION_TITLE_PREFIX.length),
    );
    if (!orderNumber) {
      return null;
    }
    return {
      sourceAction: ORDER_TRANSACTION_SOURCE_ACTION.Payment,
      orderNumber,
    };
  }

  if (normalizedTitle.startsWith(ORDER_REFUND_TRANSACTION_TITLE_PREFIX)) {
    const orderNumber = safeTrim(
      normalizedTitle.slice(ORDER_REFUND_TRANSACTION_TITLE_PREFIX.length),
    );
    if (!orderNumber) {
      return null;
    }
    return {
      sourceAction: ORDER_TRANSACTION_SOURCE_ACTION.Refund,
      orderNumber,
    };
  }

  return null;
};

export const createRunOrderLegacyTransactionLinkRepairWorkflowUseCase = (
  params: {
    getOrdersUseCase: GetOrdersUseCase;
    getTransactionsUseCase: GetTransactionsUseCase;
    postBusinessTransactionUseCase: PostBusinessTransactionUseCase;
  },
): RunOrderLegacyTransactionLinkRepairWorkflowUseCase => ({
  async execute(
    input: OrderLegacyTransactionLinkRepairWorkflowInput,
  ): Promise<Result<OrderLegacyTransactionLinkRepairWorkflowResult>> {
    try {
      const normalizedOwnerUserRemoteId = safeTrim(input.ownerUserRemoteId);
      const normalizedAccountRemoteId = safeTrim(input.accountRemoteId);

      if (!normalizedOwnerUserRemoteId || !normalizedAccountRemoteId) {
        throw new Error("Active account context is required.");
      }

      const [ordersResult, transactionsResult] = await Promise.all([
        params.getOrdersUseCase.execute({
          accountRemoteId: normalizedAccountRemoteId,
        }),
        params.getTransactionsUseCase.execute({
          ownerUserRemoteId: normalizedOwnerUserRemoteId,
          accountRemoteId: normalizedAccountRemoteId,
        }),
      ]);

      if (!ordersResult.success) {
        throw new Error(ordersResult.error.message);
      }

      if (!transactionsResult.success) {
        throw new Error(transactionsResult.error.message);
      }

      const orderByNumber = new Map<string, string>();
      for (const order of ordersResult.value) {
        const normalizedOrderNumber = safeTrim(order.orderNumber).toUpperCase();
        if (!normalizedOrderNumber) {
          continue;
        }

        if (!orderByNumber.has(normalizedOrderNumber)) {
          orderByNumber.set(normalizedOrderNumber, order.remoteId);
        }
      }

      let scannedCount = 0;
      let repairedCount = 0;

      for (const transaction of transactionsResult.value) {
        const parsedLegacyTransaction = parseLegacyOrderTransactionTitle(
          transaction.title,
        );
        if (!parsedLegacyTransaction) {
          continue;
        }

        scannedCount += 1;

        if (
          safeTrim(transaction.sourceRemoteId).length > 0 &&
          safeTrim(transaction.sourceAction).length > 0
        ) {
          continue;
        }

        const linkedOrderRemoteId = orderByNumber.get(
          parsedLegacyTransaction.orderNumber.toUpperCase(),
        );
        if (!linkedOrderRemoteId) {
          continue;
        }

        const repairResult = await params.postBusinessTransactionUseCase.execute({
          remoteId: transaction.remoteId,
          ownerUserRemoteId: transaction.ownerUserRemoteId,
          accountRemoteId: transaction.accountRemoteId,
          accountDisplayNameSnapshot: transaction.accountDisplayNameSnapshot,
          transactionType: transaction.transactionType,
          direction: transaction.direction,
          title: transaction.title,
          amount: transaction.amount,
          currencyCode: transaction.currencyCode,
          categoryLabel: transaction.categoryLabel,
          note: transaction.note,
          happenedAt: transaction.happenedAt,
          settlementMoneyAccountRemoteId:
            transaction.settlementMoneyAccountRemoteId,
          settlementMoneyAccountDisplayNameSnapshot:
            transaction.settlementMoneyAccountDisplayNameSnapshot,
          sourceModule: TransactionSourceModule.Orders,
          sourceRemoteId: linkedOrderRemoteId,
          sourceAction: parsedLegacyTransaction.sourceAction,
          idempotencyKey:
            transaction.idempotencyKey ??
            `orders-legacy-link-${transaction.remoteId}`,
          postingStatus: transaction.postingStatus,
          contactRemoteId: transaction.contactRemoteId,
        });

        if (!repairResult.success) {
          throw new Error(repairResult.error.message);
        }

        repairedCount += 1;
      }

      return {
        success: true,
        value: {
          scannedCount,
          repairedCount,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },
});
