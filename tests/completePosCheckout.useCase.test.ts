import { SaveBillingDocumentUseCase } from "@/feature/billing/useCase/saveBillingDocument.useCase";
import { SaveBillingDocumentAllocationsUseCase } from "@/feature/billing/useCase/saveBillingDocumentAllocations.useCase";
import { AddLedgerEntryUseCase } from "@/feature/ledger/useCase/addLedgerEntry.useCase";
import { PosReceipt, PosReceiptPaymentPart } from "@/feature/pos/types/pos.entity.types";
import { CompletePaymentUseCase } from "@/feature/pos/useCase/completePayment.useCase";
import { createCompletePosCheckoutUseCase } from "@/feature/pos/useCase/completePosCheckout.useCase.impl";
import { PostBusinessTransactionUseCase } from "@/feature/transactions/useCase/postBusinessTransaction.useCase";
import { describe, expect, it, vi } from "vitest";

const createReceipt = (
  dueAmount: number,
  paymentParts?: readonly PosReceiptPaymentPart[],
): PosReceipt => ({
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
        value: createReceipt(0, [
          {
            paymentPartId: "part-1",
            payerLabel: null,
            amount: 1130,
            settlementAccountRemoteId: "money-cash-1",
            settlementAccountLabel: "Cash Account",
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
          payerLabel: null,
          amount: 1130,
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

    expect(result.success).toBe(true);
    expect(addLedgerEntryExecuteSpy).not.toHaveBeenCalled();
  });

  it("posts due ledger entry for unpaid balance", async () => {
    const completePaymentExecuteSpy: CompletePaymentUseCase["execute"] = vi.fn(
      async () => ({
        success: true as const,
        value: createReceipt(300, [
          {
            paymentPartId: "part-1",
            payerLabel: null,
            amount: 830,
            settlementAccountRemoteId: "money-cash-1",
            settlementAccountLabel: "Cash Account",
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
          payerLabel: null,
          amount: 830,
          settlementAccountRemoteId: "money-cash-1",
        },
      ],
      selectedCustomer: {
        remoteId: "customer-1",
        fullName: "John Doe",
        phone: "+1234567890",
        address: null,
      },
      grandTotalSnapshot: 1130,
      activeBusinessAccountRemoteId: "business-1",
      activeOwnerUserRemoteId: "user-1",
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
          payerLabel: null,
          amount: 880,
          settlementAccountRemoteId: "money-cash-1",
        },
      ],
      activeBusinessAccountRemoteId: "business-1",
      activeOwnerUserRemoteId: "user-1",
      activeAccountCurrencyCode: "NPR",
      activeAccountCountryCode: "NP",
      selectedCustomer: {
        remoteId: "customer-1",
        fullName: "John Doe",
        phone: "+1234567890",
        address: null,
      },
      grandTotalSnapshot: 1130,
    });

    expect(result.success).toBe(true);
    expect(addLedgerEntryExecuteSpy).toHaveBeenCalledTimes(1);

    if (result.success) {
      expect(result.value.ledgerEffect.type).toBe("due_balance_create_failed");
      expect(result.value.dueAmount).toBe(250);
    }
  });

  it("REAL FIX VERIFICATION: paid checkout fails when settlement account is missing - OLD", async () => {
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
      verifyLinkedDocument: vi.fn(async () => ({
        success: true as const,
        value: {} as never,
      })),
    };
    const coreSyncUseCases = createCoreSyncUseCases();

    const useCase = createCompletePosCheckoutUseCase({
      completePaymentUseCase: { execute: completePaymentExecuteSpy },
      addLedgerEntryUseCase,
      getOrCreateBusinessContactUseCase: {
        execute: vi.fn(),
      },
      ...coreSyncUseCases,
    });

    // Paid checkout with NULL settlement account should fail
    const result = await useCase.execute({
      paymentParts: [
        {
          paymentPartId: "part-1",
          payerLabel: null,
          amount: 1130,
          settlementAccountRemoteId: "",
        },
      ],
      activeBusinessAccountRemoteId: "business-1",
      activeOwnerUserRemoteId: "user-1",
      activeAccountCurrencyCode: "NPR",
      activeAccountCountryCode: "NP",
      selectedCustomer: null,
      grandTotalSnapshot: 1130,
    });

    // Result should be real failure with our production fix
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe("CONTEXT_REQUIRED");
      expect(result.error.message).toContain("Settlement money account");
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
      verifyLinkedDocument: vi.fn(async () => ({
        success: true as const,
        value: {} as never,
      })),
    };
    const coreSyncUseCases = createCoreSyncUseCases();

    const useCase = createCompletePosCheckoutUseCase({
      completePaymentUseCase: { execute: completePaymentExecuteSpy },
      addLedgerEntryUseCase,
      getOrCreateBusinessContactUseCase: {
        execute: vi.fn(),
      },
      ...coreSyncUseCases,
    });

    // Paid checkout with REAL MONEY ACCOUNT settlement should succeed
    const result = await useCase.execute({
      paymentParts: [
        {
          paymentPartId: "part-1",
          payerLabel: null,
          amount: 1130,
          settlementAccountRemoteId: "money-cash-1",
        },
      ],
      activeBusinessAccountRemoteId: "business-1",
      activeOwnerUserRemoteId: "user-1",
      activeAccountCurrencyCode: "NPR",
      activeAccountCountryCode: "NP",
      selectedCustomer: null,
      grandTotalSnapshot: 1130,
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

  it("PHASE 2A: due balance checkout fails when billing-ledger linkage verification fails", async () => {
    const completePaymentExecuteSpy: CompletePaymentUseCase["execute"] = vi.fn(
      async () => ({
        success: true as const,
        value: createReceipt(300),
      }),
    );
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
    const verifyLinkedDocumentSpy: AddLedgerEntryUseCase["verifyLinkedDocument"] =
      vi.fn(async () => ({
        success: false as const,
        error: {
          type: "VALIDATION_ERROR" as const,
          message: "No ledger entry found linked to this billing document.",
        },
      }));
    const addLedgerEntryUseCase: AddLedgerEntryUseCase = {
      execute: addLedgerEntryExecuteSpy,
      verifyLinkedDocument: verifyLinkedDocumentSpy,
    };
    const coreSyncUseCases = createCoreSyncUseCases();

    const useCase = createCompletePosCheckoutUseCase({
      completePaymentUseCase: { execute: completePaymentExecuteSpy },
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
          payerLabel: null,
          amount: 830,
          settlementAccountRemoteId: "money-cash-1",
        },
      ],
      activeBusinessAccountRemoteId: "business-1",
      activeOwnerUserRemoteId: "user-1",
      activeAccountCurrencyCode: "NPR",
      activeAccountCountryCode: "NP",
      selectedCustomer: {
        remoteId: "customer-1",
        fullName: "John Doe",
        phone: "+1234567890",
        address: null,
      },
      grandTotalSnapshot: 1130,
    });

    expect(result.success).toBe(false);
    expect(addLedgerEntryExecuteSpy).toHaveBeenCalledTimes(1);
    expect(verifyLinkedDocumentSpy).toHaveBeenCalledTimes(1);

    if (!result.success) {
      expect(result.error.type).toBe("UNKNOWN");
      expect(result.error.message).toContain(
        "Billing-Ledger linkage verification failed",
      );
    }
  });

  it("PRODUCTION FIX: fails when business context is missing", async () => {
    const completePaymentExecuteSpy: CompletePaymentUseCase["execute"] = vi.fn(
      async () => ({
        success: true as const,
        value: createReceipt(0),
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

    // Test with missing business account
    const result1 = await useCase.execute({
      paymentParts: [
        {
          paymentPartId: "part-1",
          payerLabel: null,
          amount: 1130,
          settlementAccountRemoteId: "money-cash-1",
        },
      ],
      activeBusinessAccountRemoteId: null,
      activeOwnerUserRemoteId: "user-1",
      activeAccountCurrencyCode: "NPR",
      activeAccountCountryCode: "NP",
      selectedCustomer: null,
      grandTotalSnapshot: 1130,
    });

    expect(result1.success).toBe(false);
    if (!result1.success) {
      expect(result1.error.type).toBe("CONTEXT_REQUIRED");
      expect(result1.error.message).toContain(
        "POS requires active business account and owner user context",
      );
    }

    // Test with missing owner user
    const result2 = await useCase.execute({
      paymentParts: [
        {
          paymentPartId: "part-1",
          payerLabel: null,
          amount: 1130,
          settlementAccountRemoteId: "money-cash-1",
        },
      ],
      activeBusinessAccountRemoteId: "business-1",
      activeOwnerUserRemoteId: null,
      activeAccountCurrencyCode: "NPR",
      activeAccountCountryCode: "NP",
      selectedCustomer: null,
      grandTotalSnapshot: 1130,
    });

    expect(result2.success).toBe(false);
    if (!result2.success) {
      expect(result2.error.type).toBe("CONTEXT_REQUIRED");
      expect(result2.error.message).toContain("owner user");
    }

    // Verify completePaymentUseCase was never called
    expect(completePaymentExecuteSpy).not.toHaveBeenCalled();
  });

  it("PRODUCTION FIX: fails when paid checkout missing settlement account", async () => {
    const completePaymentExecuteSpy: CompletePaymentUseCase["execute"] = vi.fn(
      async () => ({
        success: true as const,
        value: createReceipt(0),
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

    // Paid checkout with NULL settlement account should fail
    const result = await useCase.execute({
      paymentParts: [
        {
          paymentPartId: "part-1",
          payerLabel: null,
          amount: 1130,
          settlementAccountRemoteId: "",
        },
      ],
      activeBusinessAccountRemoteId: "business-1",
      activeOwnerUserRemoteId: "user-1",
      activeAccountCurrencyCode: "NPR",
      activeAccountCountryCode: "NP",
      selectedCustomer: null,
      grandTotalSnapshot: 1130,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe("CONTEXT_REQUIRED");
      expect(result.error.message).toContain("Settlement money account");
    }

    // Verify completePaymentUseCase was never called
    expect(completePaymentExecuteSpy).not.toHaveBeenCalled();
  });

  it("PRODUCTION FIX: fails when unpaid checkout missing customer", async () => {
    const completePaymentExecuteSpy: CompletePaymentUseCase["execute"] = vi.fn(
      async () => ({
        success: true as const,
        value: createReceipt(300),
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

    // Unpaid checkout with NULL customer should fail
    const result = await useCase.execute({
      paymentParts: [
        {
          paymentPartId: "part-1",
          payerLabel: null,
          amount: 830,
          settlementAccountRemoteId: "money-cash-1",
        },
      ],
      activeBusinessAccountRemoteId: "business-1",
      activeOwnerUserRemoteId: "user-1",
      activeAccountCurrencyCode: "NPR",
      activeAccountCountryCode: "NP",
      selectedCustomer: null,
      grandTotalSnapshot: 1130, // Will create due amount of 300
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe("CONTEXT_REQUIRED");
      expect(result.error.message).toContain(
        "Customer selection is required for unpaid sales",
      );
    }

    // Verify completePaymentUseCase was never called
    expect(completePaymentExecuteSpy).not.toHaveBeenCalled();
  });

  it("PRODUCTION FIX: succeeds when fully paid anonymous checkout", async () => {
    const completePaymentExecuteSpy: CompletePaymentUseCase["execute"] = vi.fn(
      async () => ({
        success: true as const,
        value: createReceipt(0),
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

    // Fully paid anonymous checkout should succeed
    const result = await useCase.execute({
      paymentParts: [
        {
          paymentPartId: "part-1",
          payerLabel: null,
          amount: 1130,
          settlementAccountRemoteId: "money-cash-1",
        },
      ],
      activeBusinessAccountRemoteId: "business-1",
      activeOwnerUserRemoteId: "user-1",
      activeAccountCurrencyCode: "NPR",
      activeAccountCountryCode: "NP",
      selectedCustomer: null,
      grandTotalSnapshot: 1130,
    });

    expect(result.success).toBe(true);
    expect(completePaymentExecuteSpy).toHaveBeenCalledTimes(1);
    expect(
      coreSyncUseCases.postBusinessTransactionUseCase.execute,
    ).toHaveBeenCalled();
    expect(
      coreSyncUseCases.saveBillingDocumentUseCase.execute,
    ).toHaveBeenCalled();
  });

  it("PRODUCTION FIX: succeeds when unpaid checkout with customer", async () => {
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

    // Unpaid checkout with customer should succeed
    const result = await useCase.execute({
      paymentParts: [
        {
          paymentPartId: "part-1",
          payerLabel: null,
          amount: 830,
          settlementAccountRemoteId: "money-cash-1",
        },
      ],
      activeBusinessAccountRemoteId: "business-1",
      activeOwnerUserRemoteId: "user-1",
      activeAccountCurrencyCode: "NPR",
      activeAccountCountryCode: "NP",
      selectedCustomer: {
        remoteId: "customer-1",
        fullName: "John Doe",
        phone: "+1234567890",
        address: null,
      },
      grandTotalSnapshot: 1130, // Will create due amount of 300
    });

    expect(result.success).toBe(true);
    expect(addLedgerEntryExecuteSpy).toHaveBeenCalledTimes(1);
    if (result.success) {
      expect(result.value.ledgerEffect.type).toBe("due_balance_created");
      expect(result.value.dueAmount).toBe(300);
    }
  });

  it("PHASE 2A: due balance checkout succeeds when billing-ledger linkage verification passes", async () => {
    const completePaymentExecuteSpy: CompletePaymentUseCase["execute"] = vi.fn(
      async () => ({
        success: true as const,
        value: createReceipt(300),
      }),
    );
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
    const verifyLinkedDocumentSpy: AddLedgerEntryUseCase["verifyLinkedDocument"] =
      vi.fn(async (billingDocId, expectedLedgerId) => ({
        success: true as const,
        value: {
          remoteId: expectedLedgerId,
          linkedDocumentRemoteId: billingDocId,
          createdAt: 1,
          updatedAt: 1,
        } as never,
      }));
    const addLedgerEntryUseCase: AddLedgerEntryUseCase = {
      execute: addLedgerEntryExecuteSpy,
      verifyLinkedDocument: verifyLinkedDocumentSpy,
    };
    const coreSyncUseCases = createCoreSyncUseCases();

    const useCase = createCompletePosCheckoutUseCase({
      completePaymentUseCase: { execute: completePaymentExecuteSpy },
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
          payerLabel: null,
          amount: 830,
          settlementAccountRemoteId: "money-cash-1",
        },
      ],
      activeBusinessAccountRemoteId: "business-1",
      activeOwnerUserRemoteId: "user-1",
      activeAccountCurrencyCode: "NPR",
      activeAccountCountryCode: "NP",
      selectedCustomer: {
        remoteId: "customer-1",
        fullName: "John Doe",
        phone: "+1234567890",
        address: null,
      },
      grandTotalSnapshot: 1130,
    });

    expect(result.success).toBe(true);
    expect(addLedgerEntryExecuteSpy).toHaveBeenCalledTimes(1);
    expect(verifyLinkedDocumentSpy).toHaveBeenCalledTimes(1);
    expect(verifyLinkedDocumentSpy).toHaveBeenCalledWith(
      expect.any(String), // billingDocumentRemoteId
      expect.any(String), // expectedLedgerEntryRemoteId
    );

    if (result.success) {
      expect(result.value.ledgerEffect.type).toBe("due_balance_created");
      expect(result.value.dueAmount).toBe(300);
    }
  });

  it("SPLIT PAYMENT: receipt contains payment breakdown", async () => {
    const completePaymentExecuteSpy: CompletePaymentUseCase["execute"] = vi.fn(
      async () => ({
        success: true as const,
        value: createReceipt(0, [
          {
            paymentPartId: "part-1",
            payerLabel: "Alice",
            amount: 500,
            settlementAccountRemoteId: "money-cash-1",
            settlementAccountLabel: "Cash Account",
          },
          {
            paymentPartId: "part-2",
            payerLabel: "Bob",
            amount: 630,
            settlementAccountRemoteId: "money-bank-1",
            settlementAccountLabel: "Bank Account",
          },
        ]),
      }),
    );
    const completePaymentUseCase: CompletePaymentUseCase = {
      execute: completePaymentExecuteSpy,
    };
    const addLedgerEntryExecuteSpy: AddLedgerEntryUseCase["execute"] = vi.fn(
      async (payload) => ({
        success: false as const,
        error: {
          type: "DATABASE_ERROR" as const,
          message: "Ledger posting failed",
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
          amount: 500,
          settlementAccountRemoteId: "money-cash-1",
        },
        {
          paymentPartId: "part-2",
          payerLabel: "Bob",
          amount: 630,
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
    if (result.success) {
      expect(result.value).toEqual(
        expect.objectContaining({
          paymentParts: [
            {
              paymentPartId: "part-1",
              payerLabel: "Alice",
              amount: 500,
              settlementAccountRemoteId: "money-cash-1",
              settlementAccountLabel: "Cash Account",
            },
            {
              paymentPartId: "part-2",
              payerLabel: "Bob",
              amount: 630,
              settlementAccountRemoteId: "money-bank-1",
              settlementAccountLabel: "Bank Account",
            },
          ],
          paidAmount: 1130,
          dueAmount: 0,
        })
      );
    }
  });
});
