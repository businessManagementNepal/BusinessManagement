import { createGetOrderSettlementSnapshotsUseCase } from "@/feature/orders/useCase/getOrderSettlementSnapshots.useCase.impl";
import { TransactionPostingStatus } from "@/feature/transactions/types/transaction.entity.types";
import { describe, expect, it, vi } from "vitest";

const createOrder = (overrides: Partial<any> = {}) =>
  ({
    remoteId: overrides.remoteId ?? "order-1",
    ownerUserRemoteId: "user-1",
    accountRemoteId: "business-1",
    orderNumber: overrides.orderNumber ?? "ORD-1",
    orderDate: 1_710_000_000_000,
    customerRemoteId: null,
    deliveryOrPickupDetails: null,
    notes: null,
    tags: null,
    internalRemarks: null,
    status: "confirmed",
    taxRatePercent: 0,
    subtotalAmount: 100,
    taxAmount: 0,
    discountAmount: 0,
    totalAmount: 100,
    linkedBillingDocumentRemoteId: null,
    linkedLedgerDueEntryRemoteId: null,
    items: [],
    createdAt: 1,
    updatedAt: 1,
  }) as any;

describe("getOrderSettlementSnapshots use case", () => {
  it("uses strict batch linked-transaction read path for order snapshots", async () => {
    const getBillingOverviewUseCase = {
      execute: vi.fn(async () => ({
        success: true as const,
        value: { documents: [] },
      })),
    };
    const getLedgerEntriesUseCase = {
      execute: vi.fn(async () => ({
        success: true as const,
        value: [],
      })),
    };
    const transactionRepository = {
      getLegacyUnlinkedOrderTransactionsForRepair: vi.fn(async () => ({
        success: true as const,
        value: [],
      })),
      getPostedOrderLinkedTransactionsByOrderRemoteIds: vi.fn(async () => ({
        success: true as const,
        value: [
          {
            remoteId: "txn-order-1-payment",
            sourceModule: "orders",
            sourceRemoteId: "order-1",
            sourceAction: "payment",
            postingStatus: TransactionPostingStatus.Posted,
            amount: 40,
          },
          {
            remoteId: "txn-order-2-payment",
            sourceModule: "orders",
            sourceRemoteId: "order-2",
            sourceAction: "payment",
            postingStatus: TransactionPostingStatus.Posted,
            amount: 15,
          },
        ],
      })),
    };
    const runOrderLegacyTransactionLinkRepairWorkflowUseCase = {
      execute: vi.fn(async () => ({
        success: true as const,
        value: { scannedCount: 0, repairedCount: 0 },
      })),
    };

    const useCase = createGetOrderSettlementSnapshotsUseCase({
      getBillingOverviewUseCase: getBillingOverviewUseCase as any,
      getLedgerEntriesUseCase: getLedgerEntriesUseCase as any,
      transactionRepository: transactionRepository as any,
      runOrderLegacyTransactionLinkRepairWorkflowUseCase:
        runOrderLegacyTransactionLinkRepairWorkflowUseCase as any,
    });

    const result = await useCase.execute({
      accountRemoteId: "business-1",
      ownerUserRemoteId: "user-1",
      orders: [createOrder({ remoteId: "order-1" }), createOrder({ remoteId: "order-2" })],
    });

    expect(result.success).toBe(true);
    expect(
      transactionRepository.getPostedOrderLinkedTransactionsByOrderRemoteIds,
    ).toHaveBeenCalledWith({
      accountRemoteId: "business-1",
      orderRemoteIds: ["order-1", "order-2"],
    });
    expect(
      transactionRepository.getLegacyUnlinkedOrderTransactionsForRepair,
    ).toHaveBeenCalledWith({
      accountRemoteId: "business-1",
    });

    if (result.success) {
      expect(result.value["order-1"]?.paidAmount).toBe(40);
      expect(result.value["order-2"]?.paidAmount).toBe(15);
    }
  });

  it("runs legacy repair bridge only when unlinked legacy order transactions exist", async () => {
    const getBillingOverviewUseCase = {
      execute: vi.fn(async () => ({
        success: true as const,
        value: { documents: [] },
      })),
    };
    const getLedgerEntriesUseCase = {
      execute: vi.fn(async () => ({
        success: true as const,
        value: [],
      })),
    };
    const transactionRepository = {
      getLegacyUnlinkedOrderTransactionsForRepair: vi.fn(async () => ({
        success: true as const,
        value: [{ remoteId: "legacy-1" }],
      })),
      getPostedOrderLinkedTransactionsByOrderRemoteIds: vi.fn(async () => ({
        success: true as const,
        value: [],
      })),
    };
    const runOrderLegacyTransactionLinkRepairWorkflowUseCase = {
      execute: vi.fn(async () => ({
        success: true as const,
        value: { scannedCount: 1, repairedCount: 1 },
      })),
    };

    const useCase = createGetOrderSettlementSnapshotsUseCase({
      getBillingOverviewUseCase: getBillingOverviewUseCase as any,
      getLedgerEntriesUseCase: getLedgerEntriesUseCase as any,
      transactionRepository: transactionRepository as any,
      runOrderLegacyTransactionLinkRepairWorkflowUseCase:
        runOrderLegacyTransactionLinkRepairWorkflowUseCase as any,
    });

    const result = await useCase.execute({
      accountRemoteId: "business-1",
      ownerUserRemoteId: "user-1",
      orders: [createOrder({ remoteId: "order-1" })],
    });

    expect(result.success).toBe(true);
    expect(
      runOrderLegacyTransactionLinkRepairWorkflowUseCase.execute,
    ).toHaveBeenCalledWith({
      ownerUserRemoteId: "user-1",
      accountRemoteId: "business-1",
    });
  });
});
