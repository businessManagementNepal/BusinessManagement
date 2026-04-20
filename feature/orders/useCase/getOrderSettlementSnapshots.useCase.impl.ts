import { GetBillingOverviewUseCase } from "@/feature/billing/useCase/getBillingOverview.useCase";
import { GetLedgerEntriesUseCase } from "@/feature/ledger/useCase/getLedgerEntries.useCase";
import { TransactionRepository } from "@/feature/transactions/data/repository/transaction.repository";
import { Transaction } from "@/feature/transactions/types/transaction.entity.types";
import { OrderSettlementSnapshot } from "@/feature/orders/types/orderSettlement.dto.types";
import {
  OrderValidationError,
} from "@/feature/orders/types/order.types";
import { calculateOrderCommercialSettlementSnapshot } from "@/feature/orders/utils/orderCommercialProjection.util";
import { RunOrderLegacyTransactionLinkRepairWorkflowUseCase } from "@/workflow/orderLegacyTransactionLinkRepair/useCase/runOrderLegacyTransactionLinkRepairWorkflow.useCase";
import {
  GetOrderSettlementSnapshotsResult,
  GetOrderSettlementSnapshotsUseCase,
} from "./getOrderSettlementSnapshots.useCase";

const safeTrim = (value: string | null | undefined): string =>
  typeof value === "string" ? value.trim() : "";

const buildTransactionsByOrderRemoteId = (params: {
  transactions: readonly Transaction[];
}): Readonly<Record<string, readonly Transaction[]>> => {
  const grouped: Record<string, Transaction[]> = {};

  for (const transaction of params.transactions) {
    const orderRemoteId = safeTrim(transaction.sourceRemoteId);
    if (!orderRemoteId) {
      continue;
    }
    const existing = grouped[orderRemoteId] ?? [];
    existing.push(transaction);
    grouped[orderRemoteId] = existing;
  }

  return grouped;
};

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

    if ((input.attemptLegacyRepair ?? true) && normalizedOwnerUserRemoteId.length > 0) {
      const legacyUnlinkedResult =
        await params.transactionRepository.getLegacyUnlinkedOrderTransactionsForRepair({
          accountRemoteId: normalizedAccountRemoteId,
        });

      if (!legacyUnlinkedResult.success) {
        return {
          success: false,
          error: OrderValidationError(legacyUnlinkedResult.error.message),
        };
      }

      if (legacyUnlinkedResult.value.length > 0) {
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

    const postedOrderTransactionsResult =
      await params.transactionRepository.getPostedOrderLinkedTransactionsByOrderRemoteIds(
        {
          accountRemoteId: normalizedAccountRemoteId,
          orderRemoteIds: normalizedOrders.map((order) => order.remoteId),
        },
      );

    if (!postedOrderTransactionsResult.success) {
      return {
        success: false,
        error: OrderValidationError(postedOrderTransactionsResult.error.message),
      };
    }

    const transactionsByOrderRemoteId = buildTransactionsByOrderRemoteId({
      transactions: postedOrderTransactionsResult.value,
    });

    const snapshotsByOrderRemoteId: Record<string, OrderSettlementSnapshot> = {};

    for (let index = 0; index < normalizedOrders.length; index += 1) {
      const order = normalizedOrders[index];
      const snapshot = calculateOrderCommercialSettlementSnapshot({
        order,
        billingDocuments: billingOverviewResult.value.documents,
        ledgerEntries: ledgerEntriesResult.value,
        transactions: transactionsByOrderRemoteId[order.remoteId] ?? [],
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
