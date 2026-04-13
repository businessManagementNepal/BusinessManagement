import { SaveBillingDocumentUseCase } from "@/feature/billing/useCase/saveBillingDocument.useCase";
import { SaveBillingDocumentAllocationsUseCase } from "@/feature/billing/useCase/saveBillingDocumentAllocations.useCase";
import { AddLedgerEntryUseCase } from "@/feature/ledger/useCase/addLedgerEntry.useCase";
import { PosReceipt } from "@/feature/pos/types/pos.entity.types";
import { CompletePaymentUseCase } from "@/feature/pos/useCase/completePayment.useCase";
import { createCompletePosCheckoutUseCase } from "@/feature/pos/useCase/completePosCheckout.useCase.impl";
import { PostBusinessTransactionUseCase } from "@/feature/transactions/useCase/postBusinessTransaction.useCase";
import { describe, expect, it, vi } from "vitest";

const createReceipt = (dueAmount: number): PosReceipt => ({
  receiptNumber: "RCPT-12345678",
  issuedAt: "2026-04-03T00:00:00.000Z",
  lines: [],
  totals: {
    itemCount: 1,
    gross: 1000,
    discountAmount: 0,
    surchargeAmount: 0,
    taxAmount: 130,
    grandTotal: 1130,
  },
  paidAmount: Number((1130 - dueAmount).toFixed(2)),
  dueAmount,
  ledgerEffect: {
    type: dueAmount > 0 ? "due_balance_pending" : "none",
    dueAmount,
    accountRemoteId: "business-1",
  },
});

const createCoreSyncUseCases = (): {
  saveBillingDocumentUseCase: SaveBillingDocumentUseCase;
  saveBillingDocumentAllocationsUseCase: SaveBillingDocumentAllocationsUseCase;
  postBusinessTransactionUseCase: PostBusinessTransactionUseCase;
} => {
  const saveBillingDocumentUseCase: SaveBillingDocumentUseCase = {
    execute: vi.fn(async (_payload) => ({
      success: true as const,
      value: {} as never,
    })),
  };
  const saveBillingDocumentAllocationsUseCase: SaveBillingDocumentAllocationsUseCase =
    {
      execute: vi.fn(async (_payloads) => ({
        success: true as const,
        value: true,
      })),
    };
  const postBusinessTransactionUseCase: PostBusinessTransactionUseCase = {
    execute: vi.fn(async (_payload) => ({
      success: true as const,
      value: {} as never,
    })),
  };

  return {
    saveBillingDocumentUseCase,
    saveBillingDocumentAllocationsUseCase,
    postBusinessTransactionUseCase,
  };
};

describe("completePosCheckout.useCase", () => {
  it("does not post ledger when checkout is fully paid", async () => {
    const completePaymentExecuteSpy: CompletePaymentUseCase["execute"] = vi.fn(
      async () => ({
        success: true as const,
        value: createReceipt(0),
      }),
    );
    const completePaymentUseCase: CompletePaymentUseCase = {
      execute: completePaymentExecuteSpy,
    };

    const addLedgerEntryExecuteSpy: AddLedgerEntryUseCase["execute"] = vi.fn(
      async (payload) => ({
        success: true as const,
        value: {
          ...payload,
          createdAt: 1,
          updatedAt: 1,
        },
      }),
    );
    const addLedgerEntryUseCase: AddLedgerEntryUseCase = {
      execute: addLedgerEntryExecuteSpy,
    };
    const coreSyncUseCases = createCoreSyncUseCases();

    const useCase = createCompletePosCheckoutUseCase({
      completePaymentUseCase,
      addLedgerEntryUseCase,
      ...coreSyncUseCases,
    });

    const result = await useCase.execute({
      paidAmount: 1130,
      activeBusinessAccountRemoteId: "business-1",
      activeOwnerUserRemoteId: "user-1",
      activeSettlementAccountRemoteId: "money-cash-1",
      activeAccountCurrencyCode: "NPR",
      activeAccountCountryCode: "NP",
    });

    expect(result.success).toBe(true);
    expect(addLedgerEntryExecuteSpy).not.toHaveBeenCalled();
  });

  it("posts due ledger entry for unpaid balance", async () => {
    const completePaymentExecuteSpy: CompletePaymentUseCase["execute"] = vi.fn(
      async () => ({
        success: true as const,
        value: createReceipt(300),
      }),
    );
    const completePaymentUseCase: CompletePaymentUseCase = {
      execute: completePaymentExecuteSpy,
    };

    const addLedgerEntryExecuteSpy: AddLedgerEntryUseCase["execute"] = vi.fn(
      async (payload) => ({
        success: true as const,
        value: {
          ...payload,
          createdAt: 1,
          updatedAt: 1,
        },
      }),
    );
    const addLedgerEntryUseCase: AddLedgerEntryUseCase = {
      execute: addLedgerEntryExecuteSpy,
    };
    const coreSyncUseCases = createCoreSyncUseCases();

    const useCase = createCompletePosCheckoutUseCase({
      completePaymentUseCase,
      addLedgerEntryUseCase,
      ...coreSyncUseCases,
    });

    const result = await useCase.execute({
      paidAmount: 830,
      activeBusinessAccountRemoteId: "business-1",
      activeOwnerUserRemoteId: "user-1",
      activeSettlementAccountRemoteId: "money-cash-1",
      activeAccountCurrencyCode: "NPR",
      activeAccountCountryCode: "NP",
    });

    expect(result.success).toBe(true);
    expect(addLedgerEntryExecuteSpy).toHaveBeenCalledTimes(1);

    if (result.success) {
      expect(result.value.ledgerEffect.type).toBe("due_balance_created");
      expect(result.value.dueAmount).toBe(300);
    }
  });

  it("marks ledger effect as failed when due posting fails", async () => {
    const completePaymentExecuteSpy: CompletePaymentUseCase["execute"] = vi.fn(
      async () => ({
        success: true as const,
        value: createReceipt(250),
      }),
    );
    const completePaymentUseCase: CompletePaymentUseCase = {
      execute: completePaymentExecuteSpy,
    };

    const addLedgerEntryExecuteSpy: AddLedgerEntryUseCase["execute"] = vi.fn(
      async () => ({
        success: false as const,
        error: {
          type: "UNKNOWN_ERROR" as const,
          message: "Ledger unavailable",
        },
      }),
    );
    const addLedgerEntryUseCase: AddLedgerEntryUseCase = {
      execute: addLedgerEntryExecuteSpy,
    };
    const coreSyncUseCases = createCoreSyncUseCases();

    const useCase = createCompletePosCheckoutUseCase({
      completePaymentUseCase,
      addLedgerEntryUseCase,
      ...coreSyncUseCases,
    });

    const result = await useCase.execute({
      paidAmount: 880,
      activeBusinessAccountRemoteId: "business-1",
      activeOwnerUserRemoteId: "user-1",
      activeSettlementAccountRemoteId: "money-cash-1",
      activeAccountCurrencyCode: "NPR",
      activeAccountCountryCode: "NP",
    });

    expect(result.success).toBe(true);
    expect(addLedgerEntryExecuteSpy).toHaveBeenCalledTimes(1);

    if (result.success) {
      expect(result.value.ledgerEffect.type).toBe("due_balance_create_failed");
      expect(result.value.dueAmount).toBe(250);
    }
  });

  it("REAL FIX VERIFICATION: paid checkout fails when settlement account is missing", async () => {
    const completePaymentExecuteSpy: CompletePaymentUseCase["execute"] = vi.fn(
      async () => ({
        success: true as const,
        value: createReceipt(0),
      }),
    );
    const addLedgerEntryUseCase: AddLedgerEntryUseCase = {
      execute: vi.fn(async (payload) => ({
        success: true as const,
        value: {
          ...payload,
          createdAt: 1,
          updatedAt: 1,
        },
      })),
    };
    const coreSyncUseCases = createCoreSyncUseCases();

    const useCase = createCompletePosCheckoutUseCase({
      completePaymentUseCase: { execute: completePaymentExecuteSpy },
      addLedgerEntryUseCase,
      ...coreSyncUseCases,
    });

    // Paid checkout with NULL settlement account should fail
    const result = await useCase.execute({
      paidAmount: 1130,
      activeBusinessAccountRemoteId: "business-1",
      activeOwnerUserRemoteId: "user-1",
      activeSettlementAccountRemoteId: null,
      activeAccountCurrencyCode: "NPR",
      activeAccountCountryCode: "NP",
    });

    // Result is success, but ledger effect shows posting_sync_failed
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.ledgerEffect.type).toBe("posting_sync_failed");
    }
  });

  it("REAL FIX VERIFICATION: paid checkout succeeds with real money account settlement", async () => {
    const completePaymentExecuteSpy: CompletePaymentUseCase["execute"] = vi.fn(
      async () => ({
        success: true as const,
        value: createReceipt(0),
      }),
    );
    const addLedgerEntryUseCase: AddLedgerEntryUseCase = {
      execute: vi.fn(async (payload) => ({
        success: true as const,
        value: {
          ...payload,
          createdAt: 1,
          updatedAt: 1,
        },
      })),
    };
    const coreSyncUseCases = createCoreSyncUseCases();

    const useCase = createCompletePosCheckoutUseCase({
      completePaymentUseCase: { execute: completePaymentExecuteSpy },
      addLedgerEntryUseCase,
      ...coreSyncUseCases,
    });

    // Paid checkout with REAL MONEY ACCOUNT settlement should succeed
    const result = await useCase.execute({
      paidAmount: 1130,
      activeBusinessAccountRemoteId: "business-1",
      activeOwnerUserRemoteId: "user-1",
      activeSettlementAccountRemoteId: "money-cash-1",
      activeAccountCurrencyCode: "NPR",
      activeAccountCountryCode: "NP",
    });

    // Should succeed and create all downstream records
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.ledgerEffect.type).not.toBe("posting_sync_failed");
    }
    expect(
      coreSyncUseCases.postBusinessTransactionUseCase.execute,
    ).toHaveBeenCalled();
    expect(
      coreSyncUseCases.saveBillingDocumentUseCase.execute,
    ).toHaveBeenCalled();
  });
});
