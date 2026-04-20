import { GetOrdersUseCase } from "@/feature/orders/useCase/getOrders.useCase";
import { TransactionRepository } from "@/feature/transactions/data/repository/transaction.repository";
import { TransactionSourceModule } from "@/feature/transactions/types/transaction.entity.types";
import { PostBusinessTransactionUseCase } from "@/feature/transactions/useCase/postBusinessTransaction.useCase";
import { Result } from "@/shared/types/result.types";
import {
  ORDER_LEGACY_TITLE_PREFIX,
  ORDER_LINKED_SOURCE_ACTION,
  OrderLegacyTransactionLinkRepairWorkflowInput,
  OrderLegacyTransactionLinkRepairWorkflowResult,
} from "../types/orderLegacyTransactionLinkRepairWorkflow.types";
import { RunOrderLegacyTransactionLinkRepairWorkflowUseCase } from "./runOrderLegacyTransactionLinkRepairWorkflow.useCase";

type ParsedLegacyOrderTransaction = {
  sourceAction: "payment" | "refund";
  orderNumber: string;
};

const safeTrim = (value: string | null | undefined): string =>
  typeof value === "string" ? value.trim() : "";

const parseLegacyOrderTransactionTitle = (
  title: string,
): ParsedLegacyOrderTransaction | null => {
  const normalizedTitle = safeTrim(title);

  if (normalizedTitle.startsWith(ORDER_LEGACY_TITLE_PREFIX.Payment)) {
    const orderNumber = safeTrim(
      normalizedTitle.slice(ORDER_LEGACY_TITLE_PREFIX.Payment.length),
    );
    if (!orderNumber) {
      return null;
    }
    return {
      sourceAction: ORDER_LINKED_SOURCE_ACTION.Payment,
      orderNumber,
    };
  }

  if (normalizedTitle.startsWith(ORDER_LEGACY_TITLE_PREFIX.Refund)) {
    const orderNumber = safeTrim(
      normalizedTitle.slice(ORDER_LEGACY_TITLE_PREFIX.Refund.length),
    );
    if (!orderNumber) {
      return null;
    }
    return {
      sourceAction: ORDER_LINKED_SOURCE_ACTION.Refund,
      orderNumber,
    };
  }

  return null;
};

export const createRunOrderLegacyTransactionLinkRepairWorkflowUseCase = (
  params: {
    getOrdersUseCase: GetOrdersUseCase;
    transactionRepository: TransactionRepository;
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

      const [ordersResult, legacyUnlinkedTransactionsResult] = await Promise.all([
        params.getOrdersUseCase.execute({
          accountRemoteId: normalizedAccountRemoteId,
        }),
        params.transactionRepository.getLegacyUnlinkedOrderTransactionsForRepair({
          accountRemoteId: normalizedAccountRemoteId,
        }),
      ]);

      if (!ordersResult.success) {
        throw new Error(ordersResult.error.message);
      }

      if (!legacyUnlinkedTransactionsResult.success) {
        throw new Error(legacyUnlinkedTransactionsResult.error.message);
      }

      const orderRemoteIdsByNumber = new Map<string, string[]>();
      for (const order of ordersResult.value) {
        const normalizedOrderNumber = safeTrim(order.orderNumber).toUpperCase();
        if (!normalizedOrderNumber) {
          continue;
        }
        const existing = orderRemoteIdsByNumber.get(normalizedOrderNumber) ?? [];
        existing.push(order.remoteId);
        orderRemoteIdsByNumber.set(normalizedOrderNumber, existing);
      }

      let scannedCount = 0;
      let repairedCount = 0;
      let ambiguousCount = 0;
      let skippedCount = 0;

      for (const transaction of legacyUnlinkedTransactionsResult.value) {
        const parsedLegacyTransaction = parseLegacyOrderTransactionTitle(
          transaction.title,
        );
        if (!parsedLegacyTransaction) {
          skippedCount += 1;
          continue;
        }

        scannedCount += 1;

        if (
          safeTrim(transaction.sourceRemoteId).length > 0 &&
          safeTrim(transaction.sourceAction).length > 0
        ) {
          skippedCount += 1;
          continue;
        }

        const matchedOrderRemoteIds =
          orderRemoteIdsByNumber.get(parsedLegacyTransaction.orderNumber.toUpperCase()) ??
          [];

        if (matchedOrderRemoteIds.length !== 1) {
          if (matchedOrderRemoteIds.length > 1) {
            ambiguousCount += 1;
          } else {
            skippedCount += 1;
          }
          continue;
        }
        const linkedOrderRemoteId = matchedOrderRemoteIds[0];

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
          ambiguousCount,
          skippedCount,
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
