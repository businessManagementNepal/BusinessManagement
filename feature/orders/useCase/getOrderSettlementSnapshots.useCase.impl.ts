import { GetBillingOverviewUseCase } from "@/feature/billing/useCase/getBillingOverview.useCase";
import { GetLedgerEntriesUseCase } from "@/feature/ledger/useCase/getLedgerEntries.useCase";
import { TransactionRepository } from "@/feature/transactions/data/repository/transaction.repository";
import {
  OrderValidationError,
} from "@/feature/orders/types/order.types";
import { calculateOrderCommercialSettlementSnapshot } from "@/feature/orders/utils/orderCommercialProjection.util";
import { RunOrderLegacyTransactionLinkRepairWorkflowUseCase } from "@/workflow/orderLegacyTransactionLinkRepair/useCase/runOrderLegacyTransactionLinkRepairWorkflow.useCase";
import {
  GetOrderSettlementSnapshotsResult,
  GetOrderSettlementSnapshotsUseCase,
  OrderSettlementSnapshot,
} from "./getOrderSettlementSnapshots.useCase";

const safeTrim = (value: string | null | undefined): string =>
  typeof value === "string" ? value.trim() : "";

export const createGetOrderSettlementSnapshotsUseCase = (params: {
  getBillingOverviewUseCase: GetBillingOverviewUseCase;
  getLedgerEntriesUseCase: GetLedgerEntriesUseCase;
  transactionRepository: TransactionRepository;
  runOrderLegacyTransactionLinkRepairWorkflowUseCase: RunOrderLegacyTransactionLinkRepairWorkflowUseCase;
}): GetOrderSettlementSnapshotsUseCase => ({
  async execute(input): Promise<GetOrderSettlementSnapshotsResult> {
    const normalizedAccountRemoteId = safeTrim(input.accountRemoteId);
    if (!normalizedAccountRemoteId) {
      return {
        success: false,
        error: OrderValidationError("A business account is required."),
      };
    }

    const normalizedOrders = input.orders.filter(
      (order) => safeTrim(order.remoteId).length > 0,
    );
    if (normalizedOrders.length === 0) {
      return {
        success: true,
        value: {},
      };
    }

    const normalizedOwnerUserRemoteId = safeTrim(input.ownerUserRemoteId);

    if (
      (input.attemptLegacyRepair ?? true) &&
      normalizedOwnerUserRemoteId.length > 0
    ) {
      const repairResult =
        await params.runOrderLegacyTransactionLinkRepairWorkflowUseCase.execute({
          ownerUserRemoteId: normalizedOwnerUserRemoteId,
          accountRemoteId: normalizedAccountRemoteId,
        });

      if (!repairResult.success) {
        return {
          success: false,
          error: OrderValidationError(repairResult.error.message),
        };
      }
    }

    const [billingOverviewResult, ledgerEntriesResult] =
      await Promise.all([
        params.getBillingOverviewUseCase.execute(normalizedAccountRemoteId),
        params.getLedgerEntriesUseCase.execute({
          businessAccountRemoteId: normalizedAccountRemoteId,
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

    const postedOrderTransactionsResults = await Promise.all(
      normalizedOrders.map((order) =>
        params.transactionRepository.getPostedOrderTransactions({
          accountRemoteId: normalizedAccountRemoteId,
          orderRemoteId: order.remoteId,
        }),
      ),
    );

    for (const transactionResult of postedOrderTransactionsResults) {
      if (!transactionResult.success) {
        return {
          success: false,
          error: OrderValidationError(transactionResult.error.message),
        };
      }
    }

    const snapshotsByOrderRemoteId: Record<string, OrderSettlementSnapshot> = {};

    for (let index = 0; index < normalizedOrders.length; index += 1) {
      const order = normalizedOrders[index];
      const orderTransactionsResult = postedOrderTransactionsResults[index];
      if (!orderTransactionsResult?.success) {
        continue;
      }
      const snapshot = calculateOrderCommercialSettlementSnapshot({
        order,
        billingDocuments: billingOverviewResult.value.documents,
        ledgerEntries: ledgerEntriesResult.value,
        transactions: orderTransactionsResult.value,
      });

      snapshotsByOrderRemoteId[order.remoteId] = {
        orderRemoteId: order.remoteId,
        paidAmount: snapshot.paidAmount,
        refundedAmount: snapshot.refundedAmount,
        balanceDueAmount: snapshot.balanceDueAmount,
        billingDocumentRemoteId: snapshot.billingDocument?.remoteId ?? null,
        dueEntryRemoteId: snapshot.dueEntry?.remoteId ?? null,
      };
    }

    return {
      success: true,
      value: snapshotsByOrderRemoteId,
    };
  },
});
