import { GetBillingOverviewUseCase } from "@/feature/billing/useCase/getBillingOverview.useCase";
import { GetLedgerEntriesUseCase } from "@/feature/ledger/useCase/getLedgerEntries.useCase";
import { OrderRepository } from "@/feature/orders/data/repository/order.repository";
import {
  OrderStatus,
  OrderValidationError,
} from "@/feature/orders/types/order.types";
import { calculateOrderCommercialSettlementSnapshot } from "@/feature/orders/utils/orderCommercialProjection.util";
import { EnsureOrderBillingAndDueLinksUseCase } from "@/feature/orders/useCase/ensureOrderBillingAndDueLinks.useCase";
import { TransactionRepository } from "@/feature/transactions/data/repository/transaction.repository";
import {
  OrderReturnProcessingWorkflowInput,
  OrderReturnProcessingWorkflowResult,
} from "../types/orderReturnProcessingWorkflow.types";
import { RunOrderReturnProcessingWorkflowUseCase } from "./runOrderReturnProcessingWorkflow.useCase";

const MONEY_EPSILON = 0.0001;

export const createRunOrderReturnProcessingWorkflowUseCase = (params: {
  orderRepository: OrderRepository;
  getBillingOverviewUseCase: GetBillingOverviewUseCase;
  getLedgerEntriesUseCase: GetLedgerEntriesUseCase;
  transactionRepository: TransactionRepository;
  ensureOrderBillingAndDueLinksUseCase: EnsureOrderBillingAndDueLinksUseCase;
}): RunOrderReturnProcessingWorkflowUseCase => ({
  async execute(
    input: OrderReturnProcessingWorkflowInput,
  ): Promise<OrderReturnProcessingWorkflowResult> {
    const normalizedOrderRemoteId = input.orderRemoteId.trim();

    if (!normalizedOrderRemoteId) {
      return {
        success: false,
        error: OrderValidationError("Order remote id is required."),
      };
    }

    const orderResult =
      await params.orderRepository.getOrderByRemoteId(normalizedOrderRemoteId);

    if (!orderResult.success) {
      return orderResult;
    }

    const currentOrder = orderResult.value;

    if (currentOrder.status === OrderStatus.Returned) {
      return {
        success: true,
        value: currentOrder,
      };
    }

    if (currentOrder.status === OrderStatus.Cancelled) {
      return {
        success: false,
        error: OrderValidationError(
          "Cancelled orders cannot be marked returned.",
        ),
      };
    }

    if (currentOrder.status !== OrderStatus.Delivered) {
      return {
        success: false,
        error: OrderValidationError(
          "Only delivered orders can be marked returned.",
        ),
      };
    }

    const ensureResult =
      await params.ensureOrderBillingAndDueLinksUseCase.execute(
        normalizedOrderRemoteId,
      );

    if (!ensureResult.success) {
      return {
        success: false,
        error: ensureResult.error,
      };
    }

    const [billingOverviewResult, ledgerEntriesResult, transactionsResult] =
      await Promise.all([
        params.getBillingOverviewUseCase.execute(
          ensureResult.value.order.accountRemoteId,
        ),
        params.getLedgerEntriesUseCase.execute({
          businessAccountRemoteId: ensureResult.value.order.accountRemoteId,
        }),
        params.transactionRepository.getPostedOrderLinkedTransactionsByOrderRemoteIds(
          {
            accountRemoteId: ensureResult.value.order.accountRemoteId,
            orderRemoteIds: [ensureResult.value.order.remoteId],
          },
        ),
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

    if (!settlementSnapshot.billingDocument || !settlementSnapshot.dueEntry) {
      return {
        success: false,
        error: OrderValidationError(
          "Linked billing and due records are required before marking the order returned.",
        ),
      };
    }

    if (settlementSnapshot.balanceDueAmount > MONEY_EPSILON) {
      return {
        success: false,
        error: OrderValidationError(
          "This order still has balance due. Settle or reverse the commercial obligation before marking it returned.",
        ),
      };
    }

    if (settlementSnapshot.paidAmount > MONEY_EPSILON) {
      return {
        success: false,
        error: OrderValidationError(
          "Refund the remaining paid amount before marking the order returned.",
        ),
      };
    }

    return params.orderRepository.updateOrderStatusByRemoteId(
      ensureResult.value.order.remoteId,
      OrderStatus.Returned,
    );
  },
});
