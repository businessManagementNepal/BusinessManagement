import { describe, expect, it, vi } from "vitest";
import { PosReceipt } from "@/feature/pos/types/pos.entity.types";
import { createCompletePosCheckoutUseCase } from "@/feature/pos/useCase/completePosCheckout.useCase.impl";
import { CompletePaymentUseCase } from "@/feature/pos/useCase/completePayment.useCase";
import { AddLedgerEntryUseCase } from "@/feature/ledger/useCase/addLedgerEntry.useCase";
import { SaveBillingDocumentUseCase } from "@/feature/billing/useCase/saveBillingDocument.useCase";
import { SaveBillingDocumentAllocationsUseCase } from "@/feature/billing/useCase/saveBillingDocumentAllocations.useCase";
import { PostBusinessTransactionUseCase } from "@/feature/transactions/useCase/postBusinessTransaction.useCase";

const createReceipt = (dueAmount: number, paymentParts?: any[]): PosReceipt => ({
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
  customerName: null,
  customerPhone: null,
  contactRemoteId: null,
  paymentParts: paymentParts ?? [],
});

const createCoreSyncUseCases = () => {
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

describe("POS Split Bill Integration", () => {
  it("normal payment works through one payment part", async () => {
    const completePaymentExecuteSpy: CompletePaymentUseCase["execute"] = vi.fn(
      async () => ({
        success: true as const,
        value: createReceipt(0, [{
          paymentPartId: "part-1",
          payerLabel: null,
          amount: 1130,
          settlementAccountRemoteId: "money-cash-1",
        }]),
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
      verifyLinkedDocument: vi.fn(async () => ({
        success: true as const,
        value: {} as never,
      })),
    };
    const coreSyncUseCases = createCoreSyncUseCases();

    const useCase = createCompletePosCheckoutUseCase({
      completePaymentUseCase,
      addLedgerEntryUseCase,
      getOrCreateBusinessContactUseCase: {
        execute: vi.fn(),
      },
      ...coreSyncUseCases,
    });

    const result = await useCase.execute({
      paymentParts: [{
        paymentPartId: "part-1",
        payerLabel: null,
        amount: 1130,
        settlementAccountRemoteId: "money-cash-1",
      }],
      selectedCustomer: null,
      grandTotalSnapshot: 1130,
      activeBusinessAccountRemoteId: "business-1",
      activeOwnerUserRemoteId: "user-1",
      activeAccountCurrencyCode: "NPR",
      activeAccountCountryCode: "NP",
    });

    expect(result.success).toBe(true);
    expect(addLedgerEntryExecuteSpy).not.toHaveBeenCalled();
    expect(coreSyncUseCases.postBusinessTransactionUseCase.execute).toHaveBeenCalledTimes(1);
  });

  it("one payer can pay using two settlement accounts", async () => {
    const completePaymentExecuteSpy: CompletePaymentUseCase["execute"] = vi.fn(
      async () => ({
        success: true as const,
        value: createReceipt(0, [
          {
            paymentPartId: "part-1",
            payerLabel: "John",
            amount: 600,
            settlementAccountRemoteId: "money-cash-1",
          },
          {
            paymentPartId: "part-2", 
            payerLabel: "John",
            amount: 530,
            settlementAccountRemoteId: "money-bank-1",
          },
        ]),
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
      verifyLinkedDocument: vi.fn(async () => ({
        success: true as const,
        value: {} as never,
      })),
    };
    const coreSyncUseCases = createCoreSyncUseCases();

    const useCase = createCompletePosCheckoutUseCase({
      completePaymentUseCase,
      addLedgerEntryUseCase,
      getOrCreateBusinessContactUseCase: {
        execute: vi.fn(),
      },
      ...coreSyncUseCases,
    });

    const result = await useCase.execute({
      paymentParts: [
        {
          paymentPartId: "part-1",
          payerLabel: "John",
          amount: 600,
          settlementAccountRemoteId: "money-cash-1",
        },
        {
          paymentPartId: "part-2", 
          payerLabel: "John",
          amount: 530,
          settlementAccountRemoteId: "money-bank-1",
        },
      ],
      selectedCustomer: null,
      grandTotalSnapshot: 1130,
      activeBusinessAccountRemoteId: "business-1",
      activeOwnerUserRemoteId: "user-1",
      activeAccountCurrencyCode: "NPR",
      activeAccountCountryCode: "NP",
    });

    expect(result.success).toBe(true);
    expect(addLedgerEntryExecuteSpy).not.toHaveBeenCalled();
    expect(coreSyncUseCases.postBusinessTransactionUseCase.execute).toHaveBeenCalledTimes(2);
  });

  it("multiple friends can pay different amounts", async () => {
    const completePaymentExecuteSpy: CompletePaymentUseCase["execute"] = vi.fn(
      async () => ({
        success: true as const,
        value: createReceipt(0, [
          {
            paymentPartId: "part-1",
            payerLabel: "Alice",
            amount: 400,
            settlementAccountRemoteId: "money-cash-1",
          },
          {
            paymentPartId: "part-2",
            payerLabel: "Bob",
            amount: 350,
            settlementAccountRemoteId: "money-bank-1",
          },
          {
            paymentPartId: "part-3",
            payerLabel: "Charlie",
            amount: 380,
            settlementAccountRemoteId: "money-wallet-1",
          },
        ]),
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
      verifyLinkedDocument: vi.fn(async () => ({
        success: true as const,
        value: {} as never,
      })),
    };
    const coreSyncUseCases = createCoreSyncUseCases();

    const useCase = createCompletePosCheckoutUseCase({
      completePaymentUseCase,
      addLedgerEntryUseCase,
      getOrCreateBusinessContactUseCase: {
        execute: vi.fn(),
      },
      ...coreSyncUseCases,
    });

    const result = await useCase.execute({
      paymentParts: [
        {
          paymentPartId: "part-1",
          payerLabel: "Alice",
          amount: 400,
          settlementAccountRemoteId: "money-cash-1",
        },
        {
          paymentPartId: "part-2",
          payerLabel: "Bob",
          amount: 350,
          settlementAccountRemoteId: "money-bank-1",
        },
        {
          paymentPartId: "part-3",
          payerLabel: "Charlie",
          amount: 380,
          settlementAccountRemoteId: "money-wallet-1",
        },
      ],
      selectedCustomer: null,
      grandTotalSnapshot: 1130,
      activeBusinessAccountRemoteId: "business-1",
      activeOwnerUserRemoteId: "user-1",
      activeAccountCurrencyCode: "NPR",
      activeAccountCountryCode: "NP",
    });

    expect(result.success).toBe(true);
    expect(addLedgerEntryExecuteSpy).not.toHaveBeenCalled();
    expect(coreSyncUseCases.postBusinessTransactionUseCase.execute).toHaveBeenCalledTimes(3);
  });

  it("total allocated over grand total is blocked", async () => {
    const completePaymentExecuteSpy: CompletePaymentUseCase["execute"] = vi.fn(
      async () => ({
        success: true as const,
        value: createReceipt(-100, [
          {
            paymentPartId: "part-1",
            payerLabel: "Alice",
            amount: 600,
            settlementAccountRemoteId: "money-cash-1",
          },
          {
            paymentPartId: "part-2",
            payerLabel: "Bob",
            amount: 600,
            settlementAccountRemoteId: "money-bank-1",
          },
        ]),
      }),
    );
    const completePaymentUseCase: CompletePaymentUseCase = {
      execute: completePaymentExecuteSpy,
    };

    const addLedgerEntryUseCase: AddLedgerEntryUseCase = {
      execute: vi.fn(async (payload) => ({
        success: true as const,
        value: {
          ...payload,
          createdAt: 1,
          updatedAt: 1,
        },
      })),
      verifyLinkedDocument: vi.fn(async () => ({
        success: true as const,
        value: {} as never,
      })),
    };
    const coreSyncUseCases = createCoreSyncUseCases();

    const useCase = createCompletePosCheckoutUseCase({
      completePaymentUseCase,
      addLedgerEntryUseCase,
      getOrCreateBusinessContactUseCase: {
        execute: vi.fn(),
      },
      ...coreSyncUseCases,
    });

    const result = await useCase.execute({
      paymentParts: [
        {
          paymentPartId: "part-1",
          payerLabel: "Alice",
          amount: 600,
          settlementAccountRemoteId: "money-cash-1",
        },
        {
          paymentPartId: "part-2",
          payerLabel: "Bob",
          amount: 600,
          settlementAccountRemoteId: "money-bank-1",
        },
      ],
      selectedCustomer: null,
      grandTotalSnapshot: 1130,
      activeBusinessAccountRemoteId: "business-1",
      activeOwnerUserRemoteId: "user-1",
      activeAccountCurrencyCode: "NPR",
      activeAccountCountryCode: "NP",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe("VALIDATION_ERROR");
      expect(result.error.message).toContain("over grand total");
    }
  });

  it("remaining due requires customer", async () => {
    const completePaymentExecuteSpy: CompletePaymentUseCase["execute"] = vi.fn(
      async () => ({
        success: true as const,
        value: createReceipt(300, [
          {
            paymentPartId: "part-1",
            payerLabel: "Alice",
            amount: 830,
            settlementAccountRemoteId: "money-cash-1",
          },
        ]),
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
      verifyLinkedDocument: vi.fn(async () => ({
        success: true as const,
        value: {} as never,
      })),
    };
    const coreSyncUseCases = createCoreSyncUseCases();

    const useCase = createCompletePosCheckoutUseCase({
      completePaymentUseCase,
      addLedgerEntryUseCase,
      getOrCreateBusinessContactUseCase: {
        execute: vi.fn(),
      },
      ...coreSyncUseCases,
    });

    // Test without customer - should fail
    const result = await useCase.execute({
      paymentParts: [
        {
          paymentPartId: "part-1",
          payerLabel: "Alice",
          amount: 830,
          settlementAccountRemoteId: "money-cash-1",
        },
      ],
      selectedCustomer: null,
      grandTotalSnapshot: 1130,
      activeBusinessAccountRemoteId: "business-1",
      activeOwnerUserRemoteId: "user-1",
      activeAccountCurrencyCode: "NPR",
      activeAccountCountryCode: "NP",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe("CONTEXT_REQUIRED");
      expect(result.error.message).toContain("Customer selection is required");
    }
  });

  it("each split part requires settlement account", async () => {
    const completePaymentExecuteSpy: CompletePaymentUseCase["execute"] = vi.fn(
      async () => ({
        success: true as const,
        value: createReceipt(0, [
          {
            paymentPartId: "part-1",
            payerLabel: "Alice",
            amount: 565,
            settlementAccountRemoteId: "money-cash-1",
          },
          {
            paymentPartId: "part-2",
            payerLabel: "Bob",
            amount: 565,
            settlementAccountRemoteId: "", // Empty settlement account
          },
        ]),
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
      verifyLinkedDocument: vi.fn(async () => ({
        success: true as const,
        value: {} as never,
      })),
    };
    const coreSyncUseCases = createCoreSyncUseCases();

    const useCase = createCompletePosCheckoutUseCase({
      completePaymentUseCase,
      addLedgerEntryUseCase,
      getOrCreateBusinessContactUseCase: {
        execute: vi.fn(),
      },
      ...coreSyncUseCases,
    });

    const result = await useCase.execute({
      paymentParts: [
        {
          paymentPartId: "part-1",
          payerLabel: "Alice",
          amount: 565,
          settlementAccountRemoteId: "money-cash-1",
        },
        {
          paymentPartId: "part-2",
          payerLabel: "Bob",
          amount: 565,
          settlementAccountRemoteId: "", // Empty settlement account
        },
      ],
      selectedCustomer: null,
      grandTotalSnapshot: 1130,
      activeBusinessAccountRemoteId: "business-1",
      activeOwnerUserRemoteId: "user-1",
      activeAccountCurrencyCode: "NPR",
      activeAccountCountryCode: "NP",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe("VALIDATION_ERROR");
      expect(result.error.message).toContain("settlement account");
    }
  });

  it("receipt contains payment breakdown", async () => {
    const completePaymentExecuteSpy: CompletePaymentUseCase["execute"] = vi.fn(
      async () => ({
        success: true as const,
        value: createReceipt(0, [
          {
            paymentPartId: "part-1",
            payerLabel: "Alice",
            amount: 400,
            settlementAccountRemoteId: "money-cash-1",
          },
          {
            paymentPartId: "part-2",
            payerLabel: "Bob",
            amount: 350,
            settlementAccountRemoteId: "money-bank-1",
          },
          {
            paymentPartId: "part-3",
            payerLabel: "Charlie",
            amount: 380,
            settlementAccountRemoteId: "money-wallet-1",
          },
        ]),
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
      verifyLinkedDocument: vi.fn(async () => ({
        success: true as const,
        value: {} as never,
      })),
    };
    const coreSyncUseCases = createCoreSyncUseCases();

    const useCase = createCompletePosCheckoutUseCase({
      completePaymentUseCase,
      addLedgerEntryUseCase,
      getOrCreateBusinessContactUseCase: {
        execute: vi.fn(),
      },
      ...coreSyncUseCases,
    });

    const result = await useCase.execute({
      paymentParts: [
        {
          paymentPartId: "part-1",
          payerLabel: "Alice",
          amount: 400,
          settlementAccountRemoteId: "money-cash-1",
        },
        {
          paymentPartId: "part-2",
          payerLabel: "Bob",
          amount: 350,
          settlementAccountRemoteId: "money-bank-1",
        },
        {
          paymentPartId: "part-3",
          payerLabel: "Charlie",
          amount: 380,
          settlementAccountRemoteId: "money-wallet-1",
        },
      ],
      selectedCustomer: null,
      grandTotalSnapshot: 1130,
      activeBusinessAccountRemoteId: "business-1",
      activeOwnerUserRemoteId: "user-1",
      activeAccountCurrencyCode: "NPR",
      activeAccountCountryCode: "NP",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.paymentParts).toHaveLength(3);
      expect(result.value.paymentParts[0].paymentPartId).toBe("part-1");
      expect(result.value.paymentParts[0].payerLabel).toBe("Alice");
      expect(result.value.paymentParts[0].amount).toBe(400);
      expect(result.value.paymentParts[0].settlementAccountRemoteId).toBe("money-cash-1");
    }
  });
});
