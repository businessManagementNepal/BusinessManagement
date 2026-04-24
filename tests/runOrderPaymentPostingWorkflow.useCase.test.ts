import {
  MoneyAccountType,
  type MoneyAccount,
} from "@/feature/accounts/types/moneyAccount.types";
import {
  BillingDocumentStatus,
  BillingDocumentType,
  BillingTemplateType,
  type BillingDocument,
} from "@/feature/billing/types/billing.types";
import {
  LedgerBalanceDirection,
  LedgerEntryType,
  type LedgerEntry,
} from "@/feature/ledger/types/ledger.entity.types";
import { createRunOrderPaymentPostingWorkflowUseCase } from "@/feature/orders/workflow/orderPaymentPosting/useCase/runOrderPaymentPostingWorkflow.useCase.impl";
import type { OrderPaymentPostingWorkflowInput } from "@/feature/orders/workflow/orderPaymentPosting/types/orderPaymentPostingWorkflow.types";
import { OrderStatus } from "@/feature/orders/types/order.types";
import { describe, expect, it, vi } from "vitest";

const buildMoneyAccount = (
  overrides: Partial<MoneyAccount> = {},
): MoneyAccount => ({
  remoteId: "account-1",
  ownerUserRemoteId: "user-1",
  scopeAccountRemoteId: "business-1",
  name: "Cash Account",
  type: MoneyAccountType.Cash,
  currentBalance: 1000,
  description: null,
  currencyCode: "NPR",
  isPrimary: true,
  isActive: true,
  createdAt: 1_710_000_000_000,
  updatedAt: 1_710_000_000_000,
  ...overrides,
});

const buildOrder = (overrides: Record<string, unknown> = {}) => ({
  remoteId: "order-1",
  ownerUserRemoteId: "user-1",
  accountRemoteId: "business-1",
  orderNumber: "ORD-001",
  orderDate: 1_710_000_000_000,
  customerRemoteId: "contact-1",
  deliveryOrPickupDetails: null,
  notes: null,
  tags: null,
  internalRemarks: null,
  status: OrderStatus.Confirmed,
  taxRatePercent: 13,
  subtotalAmount: 100,
  taxAmount: 13,
  discountAmount: 0,
  totalAmount: 113,
  linkedBillingDocumentRemoteId: "bill-1",
  linkedLedgerDueEntryRemoteId: "due-1",
  items: [],
  createdAt: 1_710_000_000_000,
  updatedAt: 1_710_000_000_000,
  ...overrides,
});

const buildContact = (overrides: Record<string, unknown> = {}) => ({
  remoteId: "contact-1",
  accountRemoteId: "business-1",
  fullName: "Kapil Customer",
  phoneNumber: "9800000000",
  email: null,
  address: null,
  tags: null,
  note: null,
  createdAt: 1_710_000_000_000,
  updatedAt: 1_710_000_000_000,
  ...overrides,
});

const buildBillingDocument = (
  overrides: Partial<BillingDocument> = {},
): BillingDocument => ({
  remoteId: "bill-1",
  accountRemoteId: "business-1",
  documentNumber: "INV-001",
  documentType: BillingDocumentType.Invoice,
  templateType: BillingTemplateType.StandardInvoice,
  customerName: "Kapil Customer",
  contactRemoteId: "contact-1",
  status: BillingDocumentStatus.Pending,
  taxRatePercent: 13,
  notes: null,
  subtotalAmount: 100,
  taxAmount: 13,
  totalAmount: 113,
  paidAmount: 0,
  outstandingAmount: 113,
  isOverdue: false,
  issuedAt: 1_710_000_000_000,
  dueAt: null,
  sourceModule: "orders",
  sourceRemoteId: "order-1",
  linkedLedgerEntryRemoteId: "due-1",
  items: [],
  createdAt: 1_710_000_000_000,
  updatedAt: 1_710_000_000_000,
  ...overrides,
});

const buildUnlinkedBillingDocument = (
  overrides: Partial<BillingDocument> = {},
): BillingDocument =>
  buildBillingDocument({
    sourceModule: null,
    sourceRemoteId: null,
    linkedLedgerEntryRemoteId: null,
    ...overrides,
  });

const buildLedgerEntry = (
  overrides: Partial<LedgerEntry> = {},
): LedgerEntry => ({
  remoteId: "due-1",
  businessAccountRemoteId: "business-1",
  ownerUserRemoteId: "user-1",
  partyName: "Kapil Customer",
  partyPhone: "9800000000",
  contactRemoteId: "contact-1",
  entryType: LedgerEntryType.Sale,
  balanceDirection: LedgerBalanceDirection.Receive,
  title: "Order ORD-001",
  amount: 113,
  currencyCode: "NPR",
  note: null,
  happenedAt: 1_710_000_000_000,
  dueAt: null,
  paymentMode: null,
  referenceNumber: "ORD-001",
  reminderAt: null,
  attachmentUri: null,
  settledAgainstEntryRemoteId: null,
  linkedDocumentRemoteId: "bill-1",
  linkedTransactionRemoteId: null,
  settlementAccountRemoteId: null,
  settlementAccountDisplayNameSnapshot: null,
  createdAt: 1_710_000_000_000,
  updatedAt: 1_710_000_000_000,
  ...overrides,
});

const buildInput = (
  overrides: Partial<OrderPaymentPostingWorkflowInput> = {},
): OrderPaymentPostingWorkflowInput => ({
  paymentAttemptRemoteId: "attempt-1",
  orderRemoteId: "order-1",
  orderNumber: "ORD-001",
  ownerUserRemoteId: "user-1",
  accountRemoteId: "business-1",
  accountDisplayNameSnapshot: "Business Name",
  amount: 100,
  currencyCode: "NPR",
  happenedAt: 1_710_000_000_000,
  settlementMoneyAccountRemoteId: "account-1",
  settlementMoneyAccountDisplayNameSnapshot: "Cash Account",
  note: null,
  ...overrides,
});

type OrderPaymentWorkflowDeps = Parameters<
  typeof createRunOrderPaymentPostingWorkflowUseCase
>[0];

const createOrderPaymentPostingWorkflowUseCase = (
  params: Omit<OrderPaymentWorkflowDeps, "recordAuditEventUseCase"> & {
    recordAuditEventUseCase?: OrderPaymentWorkflowDeps["recordAuditEventUseCase"];
  },
) =>
  createRunOrderPaymentPostingWorkflowUseCase({
    ...params,
    recordAuditEventUseCase:
      params.recordAuditEventUseCase ??
      ({
        execute: vi.fn(async () => ({
          success: true as const,
          value: {} as never,
        })),
      } as OrderPaymentWorkflowDeps["recordAuditEventUseCase"]),
  });

describe("runOrderPaymentPostingWorkflowUseCase validation", () => {
  it("rejects blank payment attempt id", async () => {
    const useCase = createOrderPaymentPostingWorkflowUseCase({
      getBillingOverviewUseCase: { execute: vi.fn() } as any,
      getLedgerEntriesUseCase: { execute: vi.fn() } as any,
      getMoneyAccountsUseCase: { execute: vi.fn() } as any,
      postBusinessTransactionUseCase: { execute: vi.fn() } as any,
      deleteBusinessTransactionUseCase: { execute: vi.fn() } as any,
      saveLedgerEntryWithSettlementUseCase: { execute: vi.fn() } as any,
      ensureOrderBillingAndDueLinksUseCase: { execute: vi.fn() } as any,
    });

    const result = await useCase.execute(
      buildInput({ paymentAttemptRemoteId: "   " }),
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain("Payment attempt id is required");
    }
  });

  it("rejects blank order remote id", async () => {
    const useCase = createOrderPaymentPostingWorkflowUseCase({
      getBillingOverviewUseCase: { execute: vi.fn() } as any,
      getLedgerEntriesUseCase: { execute: vi.fn() } as any,
      getMoneyAccountsUseCase: { execute: vi.fn() } as any,
      postBusinessTransactionUseCase: { execute: vi.fn() } as any,
      deleteBusinessTransactionUseCase: { execute: vi.fn() } as any,
      saveLedgerEntryWithSettlementUseCase: { execute: vi.fn() } as any,
      ensureOrderBillingAndDueLinksUseCase: { execute: vi.fn() } as any,
    });

    const result = await useCase.execute(buildInput({ orderRemoteId: "" }));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain("Order remote id is required");
    }
  });

  it("rejects blank order number", async () => {
    const useCase = createOrderPaymentPostingWorkflowUseCase({
      getBillingOverviewUseCase: { execute: vi.fn() } as any,
      getLedgerEntriesUseCase: { execute: vi.fn() } as any,
      getMoneyAccountsUseCase: { execute: vi.fn() } as any,
      postBusinessTransactionUseCase: { execute: vi.fn() } as any,
      deleteBusinessTransactionUseCase: { execute: vi.fn() } as any,
      saveLedgerEntryWithSettlementUseCase: { execute: vi.fn() } as any,
      ensureOrderBillingAndDueLinksUseCase: { execute: vi.fn() } as any,
    });

    const result = await useCase.execute(buildInput({ orderNumber: "   " }));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain("Order number is required");
    }
  });

  it("rejects missing active account context", async () => {
    const useCase = createOrderPaymentPostingWorkflowUseCase({
      getBillingOverviewUseCase: { execute: vi.fn() } as any,
      getLedgerEntriesUseCase: { execute: vi.fn() } as any,
      getMoneyAccountsUseCase: { execute: vi.fn() } as any,
      postBusinessTransactionUseCase: { execute: vi.fn() } as any,
      deleteBusinessTransactionUseCase: { execute: vi.fn() } as any,
      saveLedgerEntryWithSettlementUseCase: { execute: vi.fn() } as any,
      ensureOrderBillingAndDueLinksUseCase: { execute: vi.fn() } as any,
    });

    const result = await useCase.execute(
      buildInput({ ownerUserRemoteId: "", accountRemoteId: "" }),
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain(
        "Active account context is required",
      );
    }
  });

  it("rejects missing account label", async () => {
    const useCase = createOrderPaymentPostingWorkflowUseCase({
      getBillingOverviewUseCase: { execute: vi.fn() } as any,
      getLedgerEntriesUseCase: { execute: vi.fn() } as any,
      getMoneyAccountsUseCase: { execute: vi.fn() } as any,
      postBusinessTransactionUseCase: { execute: vi.fn() } as any,
      deleteBusinessTransactionUseCase: { execute: vi.fn() } as any,
      saveLedgerEntryWithSettlementUseCase: { execute: vi.fn() } as any,
      ensureOrderBillingAndDueLinksUseCase: { execute: vi.fn() } as any,
    });

    const result = await useCase.execute(
      buildInput({ accountDisplayNameSnapshot: "   " }),
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain("Account label is required");
    }
  });

  it("rejects non-positive amount", async () => {
    const useCase = createOrderPaymentPostingWorkflowUseCase({
      getBillingOverviewUseCase: { execute: vi.fn() } as any,
      getLedgerEntriesUseCase: { execute: vi.fn() } as any,
      getMoneyAccountsUseCase: { execute: vi.fn() } as any,
      postBusinessTransactionUseCase: { execute: vi.fn() } as any,
      deleteBusinessTransactionUseCase: { execute: vi.fn() } as any,
      saveLedgerEntryWithSettlementUseCase: { execute: vi.fn() } as any,
      ensureOrderBillingAndDueLinksUseCase: { execute: vi.fn() } as any,
    });

    const result = await useCase.execute(buildInput({ amount: 0 }));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain("Amount must be greater than zero");
    }
  });

  it("rejects invalid happenedAt", async () => {
    const useCase = createOrderPaymentPostingWorkflowUseCase({
      getBillingOverviewUseCase: { execute: vi.fn() } as any,
      getLedgerEntriesUseCase: { execute: vi.fn() } as any,
      getMoneyAccountsUseCase: { execute: vi.fn() } as any,
      postBusinessTransactionUseCase: { execute: vi.fn() } as any,
      deleteBusinessTransactionUseCase: { execute: vi.fn() } as any,
      saveLedgerEntryWithSettlementUseCase: { execute: vi.fn() } as any,
      ensureOrderBillingAndDueLinksUseCase: { execute: vi.fn() } as any,
    });

    const result = await useCase.execute(buildInput({ happenedAt: 0 }));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain("Payment date is required");
    }
  });

  it("rejects blank settlement money account id", async () => {
    const useCase = createOrderPaymentPostingWorkflowUseCase({
      getBillingOverviewUseCase: { execute: vi.fn() } as any,
      getLedgerEntriesUseCase: { execute: vi.fn() } as any,
      getMoneyAccountsUseCase: { execute: vi.fn() } as any,
      postBusinessTransactionUseCase: { execute: vi.fn() } as any,
      deleteBusinessTransactionUseCase: { execute: vi.fn() } as any,
      saveLedgerEntryWithSettlementUseCase: { execute: vi.fn() } as any,
      ensureOrderBillingAndDueLinksUseCase: { execute: vi.fn() } as any,
    });

    const result = await useCase.execute(
      buildInput({ settlementMoneyAccountRemoteId: "" }),
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain("Money account is required");
    }
  });

  it("rejects blank settlement money account label", async () => {
    const useCase = createOrderPaymentPostingWorkflowUseCase({
      getBillingOverviewUseCase: { execute: vi.fn() } as any,
      getLedgerEntriesUseCase: { execute: vi.fn() } as any,
      getMoneyAccountsUseCase: { execute: vi.fn() } as any,
      postBusinessTransactionUseCase: { execute: vi.fn() } as any,
      deleteBusinessTransactionUseCase: { execute: vi.fn() } as any,
      saveLedgerEntryWithSettlementUseCase: { execute: vi.fn() } as any,
      ensureOrderBillingAndDueLinksUseCase: { execute: vi.fn() } as any,
    });

    const result = await useCase.execute(
      buildInput({ settlementMoneyAccountDisplayNameSnapshot: "   " }),
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain("Money account label is required");
    }
  });

  it("rejects inactive or missing money account", async () => {
    const getMoneyAccountsUseCase = {
      execute: vi.fn(async () => ({
        success: true as const,
        value: [
          buildMoneyAccount({ remoteId: "account-1", isActive: false }),
          buildMoneyAccount({ remoteId: "account-2", isActive: true }),
        ],
      })),
    };

    const useCase = createOrderPaymentPostingWorkflowUseCase({
      getBillingOverviewUseCase: { execute: vi.fn() } as any,
      getLedgerEntriesUseCase: { execute: vi.fn() } as any,
      getMoneyAccountsUseCase: getMoneyAccountsUseCase as any,
      postBusinessTransactionUseCase: { execute: vi.fn() } as any,
      deleteBusinessTransactionUseCase: { execute: vi.fn() } as any,
      saveLedgerEntryWithSettlementUseCase: { execute: vi.fn() } as any,
      ensureOrderBillingAndDueLinksUseCase: { execute: vi.fn() } as any,
    });

    const result = await useCase.execute(buildInput());

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain(
        "Choose a valid active money account",
      );
    }
  });
});

describe(
  "runOrderPaymentPostingWorkflowUseCase commercial/billing/due dependencies",
  () => {
    it("fails safely when ensureOrderBillingAndDueLinksUseCase fails", async () => {
      const ensureOrderBillingAndDueLinksUseCase = {
        execute: vi.fn(async () => ({
          success: false as const,
          error: {
            type: "VALIDATION_ERROR",
            message: "Unable to ensure billing and due links",
          },
        })),
      };

      const useCase = createOrderPaymentPostingWorkflowUseCase({
        getBillingOverviewUseCase: { execute: vi.fn() } as any,
        getLedgerEntriesUseCase: { execute: vi.fn() } as any,
        getMoneyAccountsUseCase: {
          execute: vi.fn(async () => ({
            success: true as const,
            value: [buildMoneyAccount()],
          })),
        } as any,
        postBusinessTransactionUseCase: { execute: vi.fn() } as any,
        deleteBusinessTransactionUseCase: { execute: vi.fn() } as any,
        saveLedgerEntryWithSettlementUseCase: { execute: vi.fn() } as any,
        ensureOrderBillingAndDueLinksUseCase:
          ensureOrderBillingAndDueLinksUseCase as any,
      });

      const result = await useCase.execute(buildInput());

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain(
          "Unable to ensure billing and due links",
        );
      }
      expect(ensureOrderBillingAndDueLinksUseCase.execute).toHaveBeenCalledWith(
        "order-1",
      );
    });

    it("fails safely when linked billing document cannot be found", async () => {
      const ensureOrderBillingAndDueLinksUseCase = {
        execute: vi.fn(async () => ({
          success: true as const,
          value: {
            order: buildOrder(),
            contact: buildContact(),
            billingDocumentRemoteId: "bill-missing",
            ledgerDueEntryRemoteId: "due-1",
          },
        })),
      };

      const getBillingOverviewUseCase = {
        execute: vi.fn(async () => ({
          success: true as const,
          value: {
            documents: [
              buildUnlinkedBillingDocument({
                remoteId: "bill-other",
              }),
            ],
            allocations: [],
            billPhotos: [],
            summary: {
              totalDocuments: 1,
              pendingAmount: 100,
              overdueAmount: 0,
            },
          },
        })),
      };

      const getLedgerEntriesUseCase = {
        execute: vi.fn(async () => ({
          success: true as const,
          value: [buildLedgerEntry()],
        })),
      };

      const postBusinessTransactionUseCase = {
        execute: vi.fn(),
      };

      const saveLedgerEntryWithSettlementUseCase = {
        execute: vi.fn(),
      };

      const useCase = createOrderPaymentPostingWorkflowUseCase({
        getBillingOverviewUseCase: getBillingOverviewUseCase as any,
        getLedgerEntriesUseCase: getLedgerEntriesUseCase as any,
        getMoneyAccountsUseCase: {
          execute: vi.fn(async () => ({
            success: true as const,
            value: [buildMoneyAccount()],
          })),
        } as any,
        postBusinessTransactionUseCase: postBusinessTransactionUseCase as any,
        deleteBusinessTransactionUseCase: { execute: vi.fn() } as any,
        saveLedgerEntryWithSettlementUseCase:
          saveLedgerEntryWithSettlementUseCase as any,
        ensureOrderBillingAndDueLinksUseCase:
          ensureOrderBillingAndDueLinksUseCase as any,
      });

      const result = await useCase.execute(buildInput());

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain(
          "The linked billing document for this order could not be found",
        );
      }

      expect(getLedgerEntriesUseCase.execute).not.toHaveBeenCalled();
      expect(postBusinessTransactionUseCase.execute).not.toHaveBeenCalled();
      expect(saveLedgerEntryWithSettlementUseCase.execute).not.toHaveBeenCalled();
    });

    it("fails safely when linked ledger due entry cannot be found", async () => {
      const ensureOrderBillingAndDueLinksUseCase = {
        execute: vi.fn(async () => ({
          success: true as const,
          value: {
            order: buildOrder(),
            contact: buildContact(),
            billingDocumentRemoteId: "bill-1",
            ledgerDueEntryRemoteId: "due-missing",
          },
        })),
      };

      const getBillingOverviewUseCase = {
        execute: vi.fn(async () => ({
          success: true as const,
          value: {
            documents: [buildBillingDocument({ remoteId: "bill-1" })],
            allocations: [],
            billPhotos: [],
            summary: {
              totalDocuments: 1,
              pendingAmount: 113,
              overdueAmount: 0,
            },
          },
        })),
      };

      const getLedgerEntriesUseCase = {
        execute: vi.fn(async () => ({
          success: true as const,
          value: [buildLedgerEntry({ remoteId: "due-other" })],
        })),
      };

      const useCase = createOrderPaymentPostingWorkflowUseCase({
        getBillingOverviewUseCase: getBillingOverviewUseCase as any,
        getLedgerEntriesUseCase: getLedgerEntriesUseCase as any,
        getMoneyAccountsUseCase: {
          execute: vi.fn(async () => ({
            success: true as const,
            value: [buildMoneyAccount()],
          })),
        } as any,
        postBusinessTransactionUseCase: { execute: vi.fn() } as any,
        deleteBusinessTransactionUseCase: { execute: vi.fn() } as any,
        saveLedgerEntryWithSettlementUseCase: { execute: vi.fn() } as any,
        ensureOrderBillingAndDueLinksUseCase:
          ensureOrderBillingAndDueLinksUseCase as any,
      });

      const result = await useCase.execute(buildInput());

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain(
          "The linked ledger due entry for this order could not be found",
        );
      }
    });
  },
);

describe("runOrderPaymentPostingWorkflowUseCase success path", () => {
  it("posts payment transaction and settlement successfully", async () => {
    const ensureOrderBillingAndDueLinksUseCase = {
      execute: vi.fn(async () => ({
        success: true as const,
        value: {
          order: buildOrder(),
          contact: buildContact(),
          billingDocumentRemoteId: "bill-1",
          ledgerDueEntryRemoteId: "due-1",
        },
      })),
    };

    const getBillingOverviewUseCase = {
      execute: vi.fn(async () => ({
        success: true as const,
        value: {
          documents: [buildBillingDocument({ remoteId: "bill-1" })],
          allocations: [],
          billPhotos: [],
          summary: {
            totalDocuments: 1,
            pendingAmount: 113,
            overdueAmount: 0,
          },
        },
      })),
    };

    const getLedgerEntriesUseCase = {
      execute: vi.fn(async () => ({
        success: true as const,
        value: [buildLedgerEntry()],
      })),
    };

    const postBusinessTransactionUseCase = {
      execute: vi.fn(async () => ({
        success: true as const,
        value: {
          remoteId: "txn-order-payment-attempt-1",
          ownerUserRemoteId: "user-1",
          accountRemoteId: "business-1",
          accountDisplayNameSnapshot: "Business Name",
          transactionType: "income",
          direction: "in",
          title: "Order Payment ORD-001",
          amount: 100,
          currencyCode: "NPR",
          categoryLabel: "Orders",
          note: "Payment note",
          happenedAt: 1_710_000_000_000,
          settlementMoneyAccountRemoteId: "account-1",
          settlementMoneyAccountDisplayNameSnapshot: "Cash Account",
          sourceModule: "orders",
          sourceRemoteId: "order-1",
          sourceAction: "payment",
          idempotencyKey: "orders:payment:attempt-1",
          contactRemoteId: "contact-1",
          createdAt: 1_710_000_000_000,
          updatedAt: 1_710_000_000_000,
        },
      })),
    };

    const saveLedgerEntryWithSettlementUseCase = {
      execute: vi.fn(async () => ({
        success: true as const,
        value: buildLedgerEntry({
          remoteId: "led-settlement-attempt-1",
          entryType: LedgerEntryType.Collection,
          balanceDirection: LedgerBalanceDirection.Receive,
          amount: 100,
        }),
      })),
    };

    const useCase = createOrderPaymentPostingWorkflowUseCase({
      getBillingOverviewUseCase: getBillingOverviewUseCase as any,
      getLedgerEntriesUseCase: getLedgerEntriesUseCase as any,
      getMoneyAccountsUseCase: {
        execute: vi.fn(async () => ({
          success: true as const,
          value: [buildMoneyAccount()],
        })),
      } as any,
      postBusinessTransactionUseCase: postBusinessTransactionUseCase as any,
      deleteBusinessTransactionUseCase: { execute: vi.fn() } as any,
      saveLedgerEntryWithSettlementUseCase:
        saveLedgerEntryWithSettlementUseCase as any,
      ensureOrderBillingAndDueLinksUseCase:
        ensureOrderBillingAndDueLinksUseCase as any,
    });

    const result = await useCase.execute(buildInput({ note: "Payment note" }));

    expect(result.success).toBe(true);
    expect(ensureOrderBillingAndDueLinksUseCase.execute).toHaveBeenCalledWith(
      "order-1",
    );
    expect(postBusinessTransactionUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        remoteId: "txn-order-payment-attempt-1",
        sourceAction: "payment",
        sourceModule: "orders",
        amount: 100,
        title: "Order Payment ORD-001",
      }),
    );
    expect(saveLedgerEntryWithSettlementUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "create",
        externalSettlementTransaction: expect.objectContaining({
          remoteId: "txn-order-payment-attempt-1",
        }),
        settlementCandidates: expect.arrayContaining([
          expect.objectContaining({
            remoteId: "due-1",
            outstandingAmount: 113,
          }),
        ]),
      }),
    );

    if (result.success) {
      expect(result.value.orderRemoteId).toBe("order-1");
      expect(result.value.paymentTransactionRemoteId).toBe(
        "txn-order-payment-attempt-1",
      );
      expect(result.value.settlementLedgerEntryRemoteId).toBe(
        "led-settlement-attempt-1",
      );
      expect(result.value.billingDocumentRemoteId).toBe("bill-1");
      expect(result.value.ledgerDueEntryRemoteId).toBe("due-1");
    }
  });

  it("keeps completed order payment successful when audit recording fails after settlement", async () => {
    const ensureOrderBillingAndDueLinksUseCase = {
      execute: vi.fn(async () => ({
        success: true as const,
        value: {
          order: buildOrder(),
          contact: buildContact(),
          billingDocumentRemoteId: "bill-1",
          ledgerDueEntryRemoteId: "due-1",
        },
      })),
    };

    const getBillingOverviewUseCase = {
      execute: vi.fn(async () => ({
        success: true as const,
        value: {
          documents: [buildBillingDocument({ remoteId: "bill-1" })],
          allocations: [],
          billPhotos: [],
          summary: {
            totalDocuments: 1,
            pendingAmount: 113,
            overdueAmount: 0,
          },
        },
      })),
    };

    const getLedgerEntriesUseCase = {
      execute: vi.fn(async () => ({
        success: true as const,
        value: [buildLedgerEntry()],
      })),
    };

    const postBusinessTransactionUseCase = {
      execute: vi.fn(async () => ({
        success: true as const,
        value: {
          remoteId: "txn-order-payment-attempt-1",
          ownerUserRemoteId: "user-1",
          accountRemoteId: "business-1",
          accountDisplayNameSnapshot: "Business Name",
          transactionType: "income",
          direction: "in",
          title: "Order Payment ORD-001",
          amount: 100,
          currencyCode: "NPR",
          categoryLabel: "Orders",
          note: null,
          happenedAt: 1_710_000_000_000,
          settlementMoneyAccountRemoteId: "account-1",
          settlementMoneyAccountDisplayNameSnapshot: "Cash Account",
          sourceModule: "orders",
          sourceRemoteId: "order-1",
          sourceAction: "payment",
          idempotencyKey: "orders:payment:attempt-1",
          contactRemoteId: "contact-1",
          createdAt: 1_710_000_000_000,
          updatedAt: 1_710_000_000_000,
        },
      })),
    };

    const saveLedgerEntryWithSettlementUseCase = {
      execute: vi.fn(async () => ({
        success: true as const,
        value: buildLedgerEntry({
          remoteId: "led-settlement-attempt-1",
          entryType: LedgerEntryType.Collection,
          balanceDirection: LedgerBalanceDirection.Receive,
          amount: 100,
        }),
      })),
    };

    const recordAuditEventExecute = vi.fn(async () => ({
      success: false as const,
      error: {
        type: "UNKNOWN" as const,
        message: "Audit write failed.",
      },
    }));

    const useCase = createOrderPaymentPostingWorkflowUseCase({
      getBillingOverviewUseCase: getBillingOverviewUseCase as any,
      getLedgerEntriesUseCase: getLedgerEntriesUseCase as any,
      getMoneyAccountsUseCase: {
        execute: vi.fn(async () => ({
          success: true as const,
          value: [buildMoneyAccount()],
        })),
      } as any,
      postBusinessTransactionUseCase: postBusinessTransactionUseCase as any,
      deleteBusinessTransactionUseCase: { execute: vi.fn() } as any,
      saveLedgerEntryWithSettlementUseCase:
        saveLedgerEntryWithSettlementUseCase as any,
      ensureOrderBillingAndDueLinksUseCase:
        ensureOrderBillingAndDueLinksUseCase as any,
      recordAuditEventUseCase: {
        execute: recordAuditEventExecute,
      },
    });

    const result = await useCase.execute(buildInput());

    expect(result.success).toBe(true);
    expect(postBusinessTransactionUseCase.execute).toHaveBeenCalledTimes(1);
    expect(saveLedgerEntryWithSettlementUseCase.execute).toHaveBeenCalledTimes(
      1,
    );
    expect(recordAuditEventExecute).toHaveBeenCalledTimes(1);
  });
});

describe("runOrderPaymentPostingWorkflowUseCase rollback", () => {
  it("rolls back created payment transaction when settlement fails", async () => {
    const ensureOrderBillingAndDueLinksUseCase = {
      execute: vi.fn(async () => ({
        success: true as const,
        value: {
          order: buildOrder(),
          contact: buildContact(),
          billingDocumentRemoteId: "bill-1",
          ledgerDueEntryRemoteId: "due-1",
        },
      })),
    };

    const getBillingOverviewUseCase = {
      execute: vi.fn(async () => ({
        success: true as const,
        value: {
          documents: [buildBillingDocument({ remoteId: "bill-1" })],
          allocations: [],
          billPhotos: [],
          summary: {
            totalDocuments: 1,
            pendingAmount: 113,
            overdueAmount: 0,
          },
        },
      })),
    };

    const getLedgerEntriesUseCase = {
      execute: vi.fn(async () => ({
        success: true as const,
        value: [buildLedgerEntry()],
      })),
    };

    const postBusinessTransactionUseCase = {
      execute: vi.fn(async () => ({
        success: true as const,
        value: {
          remoteId: "txn-order-payment-attempt-1",
          ownerUserRemoteId: "user-1",
          accountRemoteId: "business-1",
          accountDisplayNameSnapshot: "Business Name",
          transactionType: "income",
          direction: "in",
          title: "Order Payment ORD-001",
          amount: 100,
          currencyCode: "NPR",
          categoryLabel: "Orders",
          note: null,
          happenedAt: 1_710_000_000_000,
          settlementMoneyAccountRemoteId: "account-1",
          settlementMoneyAccountDisplayNameSnapshot: "Cash Account",
          sourceModule: "orders",
          sourceRemoteId: "order-1",
          sourceAction: "payment",
          idempotencyKey: "orders:payment:attempt-1",
          contactRemoteId: "contact-1",
          createdAt: 1_710_000_000_000,
          updatedAt: 1_710_000_000_000,
        },
      })),
    };

    const saveLedgerEntryWithSettlementUseCase = {
      execute: vi.fn(async () => ({
        success: false as const,
        error: {
          type: "VALIDATION_ERROR",
          message: "Settlement save failed",
        },
      })),
    };

    const deleteBusinessTransactionUseCase = {
      execute: vi.fn(async () => ({
        success: true as const,
        value: true,
      })),
    };

    const useCase = createOrderPaymentPostingWorkflowUseCase({
      getBillingOverviewUseCase: getBillingOverviewUseCase as any,
      getLedgerEntriesUseCase: getLedgerEntriesUseCase as any,
      getMoneyAccountsUseCase: {
        execute: vi.fn(async () => ({
          success: true as const,
          value: [buildMoneyAccount()],
        })),
      } as any,
      postBusinessTransactionUseCase: postBusinessTransactionUseCase as any,
      deleteBusinessTransactionUseCase: deleteBusinessTransactionUseCase as any,
      saveLedgerEntryWithSettlementUseCase:
        saveLedgerEntryWithSettlementUseCase as any,
      ensureOrderBillingAndDueLinksUseCase:
        ensureOrderBillingAndDueLinksUseCase as any,
    });

    const result = await useCase.execute(buildInput());

    expect(result.success).toBe(false);
    expect(postBusinessTransactionUseCase.execute).toHaveBeenCalledTimes(1);
    expect(saveLedgerEntryWithSettlementUseCase.execute).toHaveBeenCalledTimes(
      1,
    );
    expect(deleteBusinessTransactionUseCase.execute).toHaveBeenCalledTimes(1);
    expect(deleteBusinessTransactionUseCase.execute).toHaveBeenCalledWith(
      "txn-order-payment-attempt-1",
    );

    if (!result.success) {
      expect(result.error.message).toContain("Settlement save failed");
      expect(result.error.message).not.toContain("Rollback failed");
    }
  });
});

describe("runOrderPaymentPostingWorkflowUseCase business-rule rejections", () => {
  it("rejects payment on fully paid order", async () => {
    const ensureOrderBillingAndDueLinksUseCase = {
      execute: vi.fn(async () => ({
        success: true as const,
        value: {
          order: buildOrder(),
          contact: buildContact(),
          billingDocumentRemoteId: "bill-1",
          ledgerDueEntryRemoteId: "due-1",
        },
      })),
    };

    const getBillingOverviewUseCase = {
      execute: vi.fn(async () => ({
        success: true as const,
        value: {
          documents: [
            buildBillingDocument({ remoteId: "bill-1", outstandingAmount: 0 }),
          ],
          allocations: [],
          billPhotos: [],
          summary: {
            totalDocuments: 1,
            pendingAmount: 0,
            overdueAmount: 0,
          },
        },
      })),
    };

    const getLedgerEntriesUseCase = {
      execute: vi.fn(async () => ({
        success: true as const,
        value: [buildLedgerEntry()],
      })),
    };

    const useCase = createOrderPaymentPostingWorkflowUseCase({
      getBillingOverviewUseCase: getBillingOverviewUseCase as any,
      getLedgerEntriesUseCase: getLedgerEntriesUseCase as any,
      getMoneyAccountsUseCase: {
        execute: vi.fn(async () => ({
          success: true as const,
          value: [buildMoneyAccount()],
        })),
      } as any,
      postBusinessTransactionUseCase: { execute: vi.fn() } as any,
      deleteBusinessTransactionUseCase: { execute: vi.fn() } as any,
      saveLedgerEntryWithSettlementUseCase: { execute: vi.fn() } as any,
      ensureOrderBillingAndDueLinksUseCase:
        ensureOrderBillingAndDueLinksUseCase as any,
    });

    const result = await useCase.execute(buildInput());

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain("already fully paid");
    }
  });

  it("rejects overpayment above outstanding balance", async () => {
    const ensureOrderBillingAndDueLinksUseCase = {
      execute: vi.fn(async () => ({
        success: true as const,
        value: {
          order: buildOrder(),
          contact: buildContact(),
          billingDocumentRemoteId: "bill-1",
          ledgerDueEntryRemoteId: "due-1",
        },
      })),
    };

    const getBillingOverviewUseCase = {
      execute: vi.fn(async () => ({
        success: true as const,
        value: {
          documents: [
            buildBillingDocument({ remoteId: "bill-1", outstandingAmount: 50 }),
          ],
          allocations: [],
          billPhotos: [],
          summary: {
            totalDocuments: 1,
            pendingAmount: 50,
            overdueAmount: 0,
          },
        },
      })),
    };

    const getLedgerEntriesUseCase = {
      execute: vi.fn(async () => ({
        success: true as const,
        value: [buildLedgerEntry()],
      })),
    };

    const useCase = createOrderPaymentPostingWorkflowUseCase({
      getBillingOverviewUseCase: getBillingOverviewUseCase as any,
      getLedgerEntriesUseCase: getLedgerEntriesUseCase as any,
      getMoneyAccountsUseCase: {
        execute: vi.fn(async () => ({
          success: true as const,
          value: [buildMoneyAccount()],
        })),
      } as any,
      postBusinessTransactionUseCase: { execute: vi.fn() } as any,
      deleteBusinessTransactionUseCase: { execute: vi.fn() } as any,
      saveLedgerEntryWithSettlementUseCase: { execute: vi.fn() } as any,
      ensureOrderBillingAndDueLinksUseCase:
        ensureOrderBillingAndDueLinksUseCase as any,
    });

    const result = await useCase.execute(buildInput({ amount: 100 }));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain(
        "exceeds the remaining balance due",
      );
    }
  });
});

