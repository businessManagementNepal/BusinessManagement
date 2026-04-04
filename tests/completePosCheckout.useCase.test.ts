import { describe, expect, it, vi } from "vitest";
import { AddLedgerEntryUseCase } from "@/feature/ledger/useCase/addLedgerEntry.useCase";
import { CompletePaymentUseCase } from "@/feature/pos/useCase/completePayment.useCase";
import { createCompletePosCheckoutUseCase } from "@/feature/pos/useCase/completePosCheckout.useCase.impl";
import { PosReceipt } from "@/feature/pos/types/pos.entity.types";

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

describe("completePosCheckout.useCase", () => {
  it("does not post ledger when checkout is fully paid", async () => {
    const completePaymentExecuteSpy: CompletePaymentUseCase["execute"] = vi.fn(async () => ({
      success: true as const,
      value: createReceipt(0),
    }));
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

    const useCase = createCompletePosCheckoutUseCase({
      completePaymentUseCase,
      addLedgerEntryUseCase,
    });

    const result = await useCase.execute({
      paidAmount: 1130,
      activeBusinessAccountRemoteId: "business-1",
      activeOwnerUserRemoteId: "user-1",
      activeSettlementAccountRemoteId: "business-1",
      activeAccountCurrencyCode: "NPR",
      activeAccountCountryCode: "NP",
    });

    expect(result.success).toBe(true);
    expect(addLedgerEntryExecuteSpy).not.toHaveBeenCalled();
  });

  it("posts due ledger entry for unpaid balance", async () => {
    const completePaymentExecuteSpy: CompletePaymentUseCase["execute"] = vi.fn(async () => ({
      success: true as const,
      value: createReceipt(300),
    }));
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

    const useCase = createCompletePosCheckoutUseCase({
      completePaymentUseCase,
      addLedgerEntryUseCase,
    });

    const result = await useCase.execute({
      paidAmount: 830,
      activeBusinessAccountRemoteId: "business-1",
      activeOwnerUserRemoteId: "user-1",
      activeSettlementAccountRemoteId: "business-1",
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
    const completePaymentExecuteSpy: CompletePaymentUseCase["execute"] = vi.fn(async () => ({
      success: true as const,
      value: createReceipt(250),
    }));
    const completePaymentUseCase: CompletePaymentUseCase = {
      execute: completePaymentExecuteSpy,
    };

    const addLedgerEntryExecuteSpy: AddLedgerEntryUseCase["execute"] = vi.fn(async () => ({
      success: false as const,
      error: {
        type: "UNKNOWN_ERROR" as const,
        message: "Ledger unavailable",
      },
    }));
    const addLedgerEntryUseCase: AddLedgerEntryUseCase = {
      execute: addLedgerEntryExecuteSpy,
    };

    const useCase = createCompletePosCheckoutUseCase({
      completePaymentUseCase,
      addLedgerEntryUseCase,
    });

    const result = await useCase.execute({
      paidAmount: 880,
      activeBusinessAccountRemoteId: "business-1",
      activeOwnerUserRemoteId: "user-1",
      activeSettlementAccountRemoteId: "business-1",
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
});
