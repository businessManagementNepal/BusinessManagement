import { describe, expect, it, vi } from "vitest";
import { BillingDocumentType } from "@/feature/billing/types/billing.types";
import { createPayBillingDocumentUseCase } from "@/feature/billing/useCase/payBillingDocument.useCase.impl";
import { SaveBillingDocumentAllocationsUseCase } from "@/feature/billing/useCase/saveBillingDocumentAllocations.useCase";
import { DeleteBusinessTransactionUseCase } from "@/feature/transactions/useCase/deleteBusinessTransaction.useCase";
import { PostBusinessTransactionUseCase } from "@/feature/transactions/useCase/postBusinessTransaction.useCase";
import {
  TransactionDirection,
  TransactionSourceModule,
  TransactionType,
} from "@/feature/transactions/types/transaction.entity.types";

describe("payBillingDocument.useCase", () => {
  it("posts a billing transaction and matching allocation for a paid invoice", async () => {
    const postBusinessTransactionUseCase = {
      execute: vi.fn(async (_payload: any) => ({
        success: true as const,
        value: true,
      })),
    };
    const deleteBusinessTransactionUseCase = {
      execute: vi.fn(async () => ({
        success: true as const,
        value: true,
      })),
    };
    const saveBillingDocumentAllocationsUseCase = {
      execute: vi.fn(async (_payloads: any) => ({
        success: true as const,
        value: true,
      })),
    };

    const useCase = createPayBillingDocumentUseCase(
      postBusinessTransactionUseCase as unknown as PostBusinessTransactionUseCase,
      deleteBusinessTransactionUseCase as unknown as DeleteBusinessTransactionUseCase,
      saveBillingDocumentAllocationsUseCase as unknown as SaveBillingDocumentAllocationsUseCase,
    );

    const result = await useCase.execute({
      billingDocumentRemoteId: "bill-1",
      accountRemoteId: "business-1",
      accountDisplayNameSnapshot: "Main Business",
      ownerUserRemoteId: "user-1",
      settlementMoneyAccountRemoteId: "cash-1",
      settlementMoneyAccountDisplayNameSnapshot: "Cash Box",
      amount: 500,
      settledAt: 1_710_000_000_000,
      note: "cash payment",
      documentType: BillingDocumentType.Invoice,
      documentNumber: "INV-2026-001",
    });

    expect(result.success).toBe(true);
    expect(postBusinessTransactionUseCase.execute).toHaveBeenCalledTimes(1);
    expect(saveBillingDocumentAllocationsUseCase.execute).toHaveBeenCalledTimes(
      1,
    );
    expect(deleteBusinessTransactionUseCase.execute).not.toHaveBeenCalled();

    const transactionPayload =
      postBusinessTransactionUseCase.execute.mock.calls[0]![0];
    expect(transactionPayload).toMatchObject({
      ownerUserRemoteId: "user-1",
      accountRemoteId: "business-1",
      accountDisplayNameSnapshot: "Main Business",
      transactionType: TransactionType.Income,
      direction: TransactionDirection.In,
      title: "Received for INV-2026-001",
      amount: 500,
      currencyCode: null,
      categoryLabel: "Billing",
      note: "cash payment",
      happenedAt: 1_710_000_000_000,
      settlementMoneyAccountRemoteId: "cash-1",
      settlementMoneyAccountDisplayNameSnapshot: "Cash Box",
      sourceModule: TransactionSourceModule.Billing,
      sourceRemoteId: "bill-1",
      sourceAction: "document_payment",
    });
    expect(transactionPayload.remoteId).toMatch(/^txn-billing-/);
    expect(transactionPayload.idempotencyKey).toBe(
      `billing:bill-1:payment:${transactionPayload.remoteId}`,
    );

    const allocationPayloads =
      saveBillingDocumentAllocationsUseCase.execute.mock.calls[0]![0];
    expect(allocationPayloads).toHaveLength(1);
    expect(allocationPayloads[0]).toMatchObject({
      accountRemoteId: "business-1",
      documentRemoteId: "bill-1",
      settlementLedgerEntryRemoteId: null,
      settlementTransactionRemoteId: transactionPayload.remoteId,
      amount: 500,
      settledAt: 1_710_000_000_000,
      note: "cash payment",
    });
    expect(allocationPayloads[0].remoteId).toMatch(/^alloc-billing-/);
  });

  it("posts an expense transaction and matching allocation for a paid receipt", async () => {
    const postBusinessTransactionUseCase = {
      execute: vi.fn(async (_payload: any) => ({
        success: true as const,
        value: true,
      })),
    };
    const deleteBusinessTransactionUseCase = {
      execute: vi.fn(async () => ({
        success: true as const,
        value: true,
      })),
    };
    const saveBillingDocumentAllocationsUseCase = {
      execute: vi.fn(async (_payloads: any) => ({
        success: true as const,
        value: true,
      })),
    };

    const useCase = createPayBillingDocumentUseCase(
      postBusinessTransactionUseCase as unknown as PostBusinessTransactionUseCase,
      deleteBusinessTransactionUseCase as unknown as DeleteBusinessTransactionUseCase,
      saveBillingDocumentAllocationsUseCase as unknown as SaveBillingDocumentAllocationsUseCase,
    );

    const result = await useCase.execute({
      billingDocumentRemoteId: "bill-receipt-1",
      accountRemoteId: "business-1",
      accountDisplayNameSnapshot: "Main Business",
      ownerUserRemoteId: "user-1",
      settlementMoneyAccountRemoteId: "bank-1",
      settlementMoneyAccountDisplayNameSnapshot: "NMB Bank",
      amount: 250,
      settledAt: 1_710_000_050_000,
      note: "vendor paid",
      documentType: BillingDocumentType.Receipt,
      documentNumber: "RCPT-2026-001",
    });

    expect(result.success).toBe(true);
    expect(postBusinessTransactionUseCase.execute).toHaveBeenCalledTimes(1);
    expect(saveBillingDocumentAllocationsUseCase.execute).toHaveBeenCalledTimes(
      1,
    );
    expect(deleteBusinessTransactionUseCase.execute).not.toHaveBeenCalled();

    const transactionPayload =
      postBusinessTransactionUseCase.execute.mock.calls[0]![0];
    expect(transactionPayload).toMatchObject({
      transactionType: TransactionType.Expense,
      direction: TransactionDirection.Out,
      title: "Paid for RCPT-2026-001",
      amount: 250,
      settlementMoneyAccountRemoteId: "bank-1",
      sourceModule: TransactionSourceModule.Billing,
      sourceRemoteId: "bill-receipt-1",
      sourceAction: "document_payment",
    });

    const allocationPayloads =
      saveBillingDocumentAllocationsUseCase.execute.mock.calls[0]![0];
    expect(allocationPayloads[0]).toMatchObject({
      documentRemoteId: "bill-receipt-1",
      settlementLedgerEntryRemoteId: null,
      settlementTransactionRemoteId: transactionPayload.remoteId,
      amount: 250,
    });
  });

  it("rolls back the created transaction when allocation persistence fails", async () => {
    const postBusinessTransactionUseCase = {
      execute: vi.fn(async (_payload: any) => ({
        success: true as const,
        value: true,
      })),
    };
    const deleteBusinessTransactionUseCase = {
      execute: vi.fn(async () => ({
        success: true as const,
        value: true,
      })),
    };
    const saveBillingDocumentAllocationsUseCase = {
      execute: vi.fn(async (_payloads: any) => ({
        success: false as const,
        error: {
          type: "VALIDATION_ERROR" as const,
          message: "allocation write failed",
        },
      })),
    };

    const useCase = createPayBillingDocumentUseCase(
      postBusinessTransactionUseCase as unknown as PostBusinessTransactionUseCase,
      deleteBusinessTransactionUseCase as unknown as DeleteBusinessTransactionUseCase,
      saveBillingDocumentAllocationsUseCase as unknown as SaveBillingDocumentAllocationsUseCase,
    );

    const result = await useCase.execute({
      billingDocumentRemoteId: "bill-2",
      accountRemoteId: "business-1",
      accountDisplayNameSnapshot: "Main Business",
      ownerUserRemoteId: "user-1",
      settlementMoneyAccountRemoteId: "bank-1",
      settlementMoneyAccountDisplayNameSnapshot: "NMB Bank",
      amount: 300,
      settledAt: 1_710_000_100_000,
      note: null,
      documentType: BillingDocumentType.Receipt,
      documentNumber: "RCPT-2026-002",
    });

    expect(result.success).toBe(false);
    expect(postBusinessTransactionUseCase.execute).toHaveBeenCalledTimes(1);
    expect(saveBillingDocumentAllocationsUseCase.execute).toHaveBeenCalledTimes(
      1,
    );

    const transactionPayload =
      postBusinessTransactionUseCase.execute.mock.calls[0]![0];
    expect(deleteBusinessTransactionUseCase.execute).toHaveBeenCalledWith(
      transactionPayload.remoteId,
    );

    if (!result.success) {
      expect(result.error.message).toContain("Payment allocation failed");
      expect(result.error.message).toContain("allocation write failed");
    }
  });

  it("does not create allocations or rollback when transaction posting fails", async () => {
    const postBusinessTransactionUseCase = {
      execute: vi.fn(async (_payload: any) => ({
        success: false as const,
        error: {
          type: "UNKNOWN_ERROR" as const,
          message: "post failed",
        },
      })),
    };
    const deleteBusinessTransactionUseCase = {
      execute: vi.fn(),
    };
    const saveBillingDocumentAllocationsUseCase = {
      execute: vi.fn(),
    };

    const useCase = createPayBillingDocumentUseCase(
      postBusinessTransactionUseCase as unknown as PostBusinessTransactionUseCase,
      deleteBusinessTransactionUseCase as unknown as DeleteBusinessTransactionUseCase,
      saveBillingDocumentAllocationsUseCase as unknown as SaveBillingDocumentAllocationsUseCase,
    );

    const result = await useCase.execute({
      billingDocumentRemoteId: "bill-2",
      accountRemoteId: "business-1",
      accountDisplayNameSnapshot: "Main Business",
      ownerUserRemoteId: "user-1",
      settlementMoneyAccountRemoteId: "cash-1",
      settlementMoneyAccountDisplayNameSnapshot: "Cash Box",
      amount: 300,
      settledAt: 1_710_000_100_000,
      note: null,
      documentType: BillingDocumentType.Invoice,
      documentNumber: "INV-2026-002",
    });

    expect(result.success).toBe(false);
    expect(saveBillingDocumentAllocationsUseCase.execute).not.toHaveBeenCalled();
    expect(deleteBusinessTransactionUseCase.execute).not.toHaveBeenCalled();
    if (!result.success) {
      expect(result.error.message).toContain("Payment posting failed");
      expect(result.error.message).toContain("post failed");
    }
  });

  it("stops before side effects when required payment data is missing", async () => {
    const postBusinessTransactionUseCase = {
      execute: vi.fn(),
    };
    const deleteBusinessTransactionUseCase = {
      execute: vi.fn(),
    };
    const saveBillingDocumentAllocationsUseCase = {
      execute: vi.fn(),
    };

    const useCase = createPayBillingDocumentUseCase(
      postBusinessTransactionUseCase as unknown as PostBusinessTransactionUseCase,
      deleteBusinessTransactionUseCase as unknown as DeleteBusinessTransactionUseCase,
      saveBillingDocumentAllocationsUseCase as unknown as SaveBillingDocumentAllocationsUseCase,
    );

    const result = await useCase.execute({
      billingDocumentRemoteId: "bill-3",
      accountRemoteId: "business-1",
      accountDisplayNameSnapshot: "Main Business",
      ownerUserRemoteId: "user-1",
      settlementMoneyAccountRemoteId: "   ",
      settlementMoneyAccountDisplayNameSnapshot: "Cash Box",
      amount: 125,
      settledAt: 1_710_000_200_000,
      note: null,
      documentType: BillingDocumentType.Invoice,
      documentNumber: "INV-2026-003",
    });

    expect(result.success).toBe(false);
    expect(postBusinessTransactionUseCase.execute).not.toHaveBeenCalled();
    expect(saveBillingDocumentAllocationsUseCase.execute).not.toHaveBeenCalled();
    expect(deleteBusinessTransactionUseCase.execute).not.toHaveBeenCalled();
  });
});
