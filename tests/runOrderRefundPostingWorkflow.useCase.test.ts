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
import { OrderStatus } from "@/feature/orders/types/order.types";
import {
  buildOrderRefundBillingDocumentRemoteId,
  buildOrderRefundSettlementLedgerEntryRemoteId,
  buildOrderRefundTransactionRemoteId,
} from "@/feature/orders/utils/orderCommercialEffects.util";
import { createRunOrderRefundPostingWorkflowUseCase } from "@/feature/orders/workflow/orderRefundPosting/useCase/runOrderRefundPostingWorkflow.useCase.impl";
import type { OrderRefundPostingWorkflowInput } from "@/feature/orders/workflow/orderRefundPosting/types/orderRefundPostingWorkflow.types";
import {
  TransactionDirection,
  TransactionPostingStatus,
  TransactionSourceModule,
  TransactionType,
  type Transaction,
} from "@/feature/transactions/types/transaction.entity.types";
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
  linkedBillingDocumentRemoteId: "bill-order-order-1",
  linkedLedgerDueEntryRemoteId: "led-order-due-order-1",
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
  remoteId: "bill-order-order-1",
  accountRemoteId: "business-1",
  documentNumber: "ORDINV-ORD-001",
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
  linkedLedgerEntryRemoteId: "led-order-due-order-1",
  items: [],
  createdAt: 1_710_000_000_000,
  updatedAt: 1_710_000_000_000,
  ...overrides,
});

const buildLedgerEntry = (
  overrides: Partial<LedgerEntry> = {},
): LedgerEntry => ({
  remoteId: "led-order-due-order-1",
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
  linkedDocumentRemoteId: "bill-order-order-1",
  linkedTransactionRemoteId: null,
  settlementAccountRemoteId: null,
  settlementAccountDisplayNameSnapshot: null,
  createdAt: 1_710_000_000_000,
  updatedAt: 1_710_000_000_000,
  ...overrides,
});

const buildTransaction = (
  overrides: Partial<Transaction> = {},
): Transaction => ({
  remoteId: "txn-order-payment-old-1",
  ownerUserRemoteId: "user-1",
  accountRemoteId: "business-1",
  accountDisplayNameSnapshot: "Business Name",
  transactionType: TransactionType.Income,
  direction: TransactionDirection.In,
  title: "Order Payment ORD-001",
  amount: 200,
  currencyCode: "NPR",
  categoryLabel: "Orders",
  note: null,
  happenedAt: 1_710_000_000_000,
  settlementMoneyAccountRemoteId: "account-1",
  settlementMoneyAccountDisplayNameSnapshot: "Cash Account",
  sourceModule: TransactionSourceModule.Orders,
  sourceRemoteId: "order-1",
  sourceAction: "payment",
  idempotencyKey: "orders:payment:old-1",
  postingStatus: TransactionPostingStatus.Posted,
  contactRemoteId: "contact-1",
  createdAt: 1_710_000_000_000,
  updatedAt: 1_710_000_000_000,
  ...overrides,
});

const buildInput = (
  overrides: Partial<OrderRefundPostingWorkflowInput> = {},
): OrderRefundPostingWorkflowInput => ({
  refundAttemptRemoteId: "attempt-1",
  orderRemoteId: "order-1",
  orderNumber: "ORD-001",
  ownerUserRemoteId: "user-1",
  accountRemoteId: "business-1",
  accountDisplayNameSnapshot: "Business Name",
  currencyCode: "NPR",
  amount: 100,
  happenedAt: 1_710_000_000_000,
  settlementMoneyAccountRemoteId: "account-1",
  settlementMoneyAccountDisplayNameSnapshot: "Cash Account",
  note: null,
  ...overrides,
});

const buildDeps = (overrides: Record<string, unknown> = {}) => ({
  getBillingOverviewUseCase: {
    execute: vi.fn(async () => ({
      success: true as const,
      value: {
        documents: [buildBillingDocument()],
        allocations: [],
        billPhotos: [],
        summary: {
          totalDocuments: 1,
          pendingAmount: 113,
          overdueAmount: 0,
        },
      },
    })),
  },
  getLedgerEntriesUseCase: {
    execute: vi.fn(async () => ({
      success: true as const,
      value: [buildLedgerEntry()],
    })),
  },
  getMoneyAccountsUseCase: {
    execute: vi.fn(async () => ({
      success: true as const,
      value: [buildMoneyAccount()],
    })),
  },
  transactionRepository: {
    getPostedOrderLinkedTransactionsByOrderRemoteIds: vi.fn(async () => ({
      success: true as const,
      value: [],
    })),
  },
  postBusinessTransactionUseCase: {
    execute: vi.fn(async () => ({
      success: true as const,
      value: buildTransaction({
        remoteId: buildOrderRefundTransactionRemoteId("attempt-1"),
        transactionType: TransactionType.Expense,
        direction: TransactionDirection.Out,
        sourceAction: "refund",
        idempotencyKey: "orders:refund:attempt-1",
        title: "Order Refund ORD-001",
        amount: 100,
      }),
    })),
  },
  deleteBusinessTransactionUseCase: {
    execute: vi.fn(async () => ({
      success: true as const,
      value: true,
    })),
  },
  saveBillingDocumentUseCase: {
    execute: vi.fn(async () => ({
      success: true as const,
      value: buildBillingDocument({
        remoteId: buildOrderRefundBillingDocumentRemoteId({
          orderRemoteId: "order-1",
          refundLedgerEntryRemoteId:
            buildOrderRefundSettlementLedgerEntryRemoteId("attempt-1"),
        }),
        documentType: BillingDocumentType.CreditNote,
        status: BillingDocumentStatus.Paid,
        customerName: "Kapil Customer",
        paidAmount: 100,
        outstandingAmount: 0,
      }),
    })),
  },
  deleteBillingDocumentUseCase: {
    execute: vi.fn(async () => ({
      success: true as const,
      value: true,
    })),
  },
  saveLedgerEntryWithSettlementUseCase: {
    execute: vi.fn(async () => ({
      success: true as const,
      value: buildLedgerEntry({
        remoteId: buildOrderRefundSettlementLedgerEntryRemoteId("attempt-1"),
        entryType: LedgerEntryType.PaymentOut,
        amount: 100,
        settledAgainstEntryRemoteId: "led-order-due-order-1",
      }),
    })),
  },
  ensureOrderBillingAndDueLinksUseCase: {
    execute: vi.fn(async () => ({
      success: true as const,
      value: {
        order: buildOrder(),
        contact: buildContact(),
        billingDocumentRemoteId: "bill-order-order-1",
        ledgerDueEntryRemoteId: "led-order-due-order-1",
      },
    })),
  },
  recordAuditEventUseCase: {
    execute: vi.fn(async () => ({
      success: true as const,
      value: {} as never,
    })),
  },
  ...overrides,
});

describe("runOrderRefundPostingWorkflowUseCase validation", () => {
  it.each([
    [
      "rejects blank refund attempt id",
      { refundAttemptRemoteId: "   " },
      "Refund attempt id is required",
    ],
    ["rejects blank order remote id", { orderRemoteId: "" }, "Order remote id is required"],
    ["rejects blank order number", { orderNumber: "   " }, "Order number is required"],
    [
      "rejects missing active account context",
      { ownerUserRemoteId: "", accountRemoteId: "" },
      "Active account context is required",
    ],
    [
      "rejects missing account label",
      { accountDisplayNameSnapshot: "   " },
      "Account label is required",
    ],
    ["rejects non-positive refund amount", { amount: 0 }, "Amount must be greater than zero"],
    ["rejects invalid happenedAt", { happenedAt: 0 }, "Refund date is required"],
    [
      "rejects blank settlement money account id",
      { settlementMoneyAccountRemoteId: "" },
      "Money account is required",
    ],
    [
      "rejects blank settlement money account label",
      { settlementMoneyAccountDisplayNameSnapshot: "   " },
      "Money account label is required",
    ],
  ])("%s", async (_name, overrides, expectedMessage) => {
    const deps = buildDeps();
    const useCase = createRunOrderRefundPostingWorkflowUseCase(deps as any);

    const result = await useCase.execute(buildInput(overrides as any));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain(expectedMessage);
    }
  });

  it("rejects inactive or missing money account", async () => {
    const deps = buildDeps({
      getMoneyAccountsUseCase: {
        execute: vi.fn(async () => ({
          success: true as const,
          value: [
            buildMoneyAccount({ remoteId: "account-1", isActive: false }),
            buildMoneyAccount({ remoteId: "account-2", isActive: true }),
          ],
        })),
      },
    });

    const useCase = createRunOrderRefundPostingWorkflowUseCase(deps as any);
    const result = await useCase.execute(buildInput());

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain("Choose a valid active money account");
    }
  });
});

describe("runOrderRefundPostingWorkflowUseCase dependencies and business rules", () => {
  it("fails when ensureOrderBillingAndDueLinksUseCase fails", async () => {
    const deps = buildDeps({
      ensureOrderBillingAndDueLinksUseCase: {
        execute: vi.fn(async () => ({
          success: false as const,
          error: {
            type: "VALIDATION_ERROR",
            message: "Unable to ensure billing and due links",
          },
        })),
      },
    });

    const useCase = createRunOrderRefundPostingWorkflowUseCase(deps as any);
    const result = await useCase.execute(buildInput());

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain("Unable to ensure billing and due links");
    }
  });

  it("fails when no linked due entry exists in the settlement snapshot", async () => {
    const deps = buildDeps({
      getLedgerEntriesUseCase: {
        execute: vi.fn(async () => ({
          success: true as const,
          value: [],
        })),
      },
      transactionRepository: {
        getPostedOrderLinkedTransactionsByOrderRemoteIds: vi.fn(async () => ({
          success: true as const,
          value: [buildTransaction({ amount: 100 })],
        })),
      },
      getBillingOverviewUseCase: {
        execute: vi.fn(async () => ({
          success: true as const,
          value: {
            documents: [buildBillingDocument({ paidAmount: 100, outstandingAmount: 13 })],
            allocations: [],
            billPhotos: [],
            summary: {
              totalDocuments: 1,
              pendingAmount: 13,
              overdueAmount: 0,
            },
          },
        })),
      },
    });

    const useCase = createRunOrderRefundPostingWorkflowUseCase(deps as any);
    const result = await useCase.execute(buildInput());

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain(
        "The linked ledger due entry for this order could not be found",
      );
    }
  });

  it("rejects refund when paid amount is zero", async () => {
    const deps = buildDeps({
      transactionRepository: {
        getPostedOrderLinkedTransactionsByOrderRemoteIds: vi.fn(async () => ({
          success: true as const,
          value: [],
        })),
      },
      getBillingOverviewUseCase: {
        execute: vi.fn(async () => ({
          success: true as const,
          value: {
            documents: [buildBillingDocument({ paidAmount: 0, outstandingAmount: 113 })],
            allocations: [],
            billPhotos: [],
            summary: {
              totalDocuments: 1,
              pendingAmount: 113,
              overdueAmount: 0,
            },
          },
        })),
      },
    });

    const useCase = createRunOrderRefundPostingWorkflowUseCase(deps as any);
    const result = await useCase.execute(buildInput());

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain(
        "This order has no paid amount available for refund",
      );
    }
  });

  it("rejects overrefund above net paid amount", async () => {
    const deps = buildDeps({
      transactionRepository: {
        getPostedOrderLinkedTransactionsByOrderRemoteIds: vi.fn(async () => ({
          success: true as const,
          value: [buildTransaction({ amount: 50 })],
        })),
      },
      getBillingOverviewUseCase: {
        execute: vi.fn(async () => ({
          success: true as const,
          value: {
            documents: [buildBillingDocument({ paidAmount: 50, outstandingAmount: 63 })],
            allocations: [],
            billPhotos: [],
            summary: {
              totalDocuments: 1,
              pendingAmount: 63,
              overdueAmount: 0,
            },
          },
        })),
      },
    });

    const useCase = createRunOrderRefundPostingWorkflowUseCase(deps as any);
    const result = await useCase.execute(buildInput({ amount: 100 }));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain(
        "Refund amount exceeds the net paid amount for this order",
      );
    }
  });
});

describe("runOrderRefundPostingWorkflowUseCase success path", () => {
  it("creates refund transaction, refund billing document, and refund settlement successfully", async () => {
    const deps = buildDeps({
      transactionRepository: {
        getPostedOrderLinkedTransactionsByOrderRemoteIds: vi.fn(async () => ({
          success: true as const,
          value: [buildTransaction({ amount: 200 })],
        })),
      },
      getBillingOverviewUseCase: {
        execute: vi.fn(async () => ({
          success: true as const,
          value: {
            documents: [buildBillingDocument({ paidAmount: 200, outstandingAmount: 0 })],
            allocations: [],
            billPhotos: [],
            summary: {
              totalDocuments: 1,
              pendingAmount: 0,
              overdueAmount: 0,
            },
          },
        })),
      },
    });

    const useCase = createRunOrderRefundPostingWorkflowUseCase(deps as any);
    const result = await useCase.execute(buildInput({ amount: 100, note: "Refund note" }));

    expect(result.success).toBe(true);
    expect(
      deps.postBusinessTransactionUseCase.execute,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        remoteId: buildOrderRefundTransactionRemoteId("attempt-1"),
        sourceAction: "refund",
        sourceModule: "orders",
        amount: 100,
        title: "Order Refund ORD-001",
      }),
    );
    expect(deps.saveBillingDocumentUseCase.execute).toHaveBeenCalledTimes(1);
    expect(deps.saveLedgerEntryWithSettlementUseCase.execute).toHaveBeenCalledTimes(1);

    if (result.success) {
      expect(result.value.orderRemoteId).toBe("order-1");
      expect(result.value.refundTransactionRemoteId).toBe(
        buildOrderRefundTransactionRemoteId("attempt-1"),
      );
      expect(result.value.refundSettlementLedgerEntryRemoteId).toBe(
        buildOrderRefundSettlementLedgerEntryRemoteId("attempt-1"),
      );
      expect(result.value.refundBillingDocumentRemoteId).toBe(
        buildOrderRefundBillingDocumentRemoteId({
          orderRemoteId: "order-1",
          refundLedgerEntryRemoteId:
            buildOrderRefundSettlementLedgerEntryRemoteId("attempt-1"),
        }),
      );
      expect(result.value.originalDueEntryRemoteId).toBe("led-order-due-order-1");
    }
  });
});

describe("runOrderRefundPostingWorkflowUseCase rollback", () => {
  it("rolls back refund transaction when refund billing document save fails", async () => {
    const deps = buildDeps({
      transactionRepository: {
        getPostedOrderLinkedTransactionsByOrderRemoteIds: vi.fn(async () => ({
          success: true as const,
          value: [buildTransaction({ amount: 200 })],
        })),
      },
      getBillingOverviewUseCase: {
        execute: vi.fn(async () => ({
          success: true as const,
          value: {
            documents: [buildBillingDocument({ paidAmount: 200, outstandingAmount: 0 })],
            allocations: [],
            billPhotos: [],
            summary: {
              totalDocuments: 1,
              pendingAmount: 0,
              overdueAmount: 0,
            },
          },
        })),
      },
      saveBillingDocumentUseCase: {
        execute: vi.fn(async () => ({
          success: false as const,
          error: {
            type: "VALIDATION_ERROR",
            message: "Unable to save refund billing document",
          },
        })),
      },
    });

    const useCase = createRunOrderRefundPostingWorkflowUseCase(deps as any);
    const result = await useCase.execute(buildInput());

    expect(result.success).toBe(false);
    expect(deps.deleteBusinessTransactionUseCase.execute).toHaveBeenCalledTimes(1);
    expect(deps.deleteBusinessTransactionUseCase.execute).toHaveBeenCalledWith(
      buildOrderRefundTransactionRemoteId("attempt-1"),
    );
    if (!result.success) {
      expect(result.error.message).toContain("Unable to save refund billing document");
    }
  });

  it("rolls back refund transaction and refund billing document when settlement save fails", async () => {
    const deps = buildDeps({
      transactionRepository: {
        getPostedOrderLinkedTransactionsByOrderRemoteIds: vi.fn(async () => ({
          success: true as const,
          value: [buildTransaction({ amount: 200 })],
        })),
      },
      getBillingOverviewUseCase: {
        execute: vi.fn(async () => ({
          success: true as const,
          value: {
            documents: [buildBillingDocument({ paidAmount: 200, outstandingAmount: 0 })],
            allocations: [],
            billPhotos: [],
            summary: {
              totalDocuments: 1,
              pendingAmount: 0,
              overdueAmount: 0,
            },
          },
        })),
      },
      saveLedgerEntryWithSettlementUseCase: {
        execute: vi.fn(async () => ({
          success: false as const,
          error: {
            type: "VALIDATION_ERROR",
            message: "Refund settlement save failed",
          },
        })),
      },
    });

    const useCase = createRunOrderRefundPostingWorkflowUseCase(deps as any);
    const result = await useCase.execute(buildInput());

    expect(result.success).toBe(false);
    expect(deps.deleteBusinessTransactionUseCase.execute).toHaveBeenCalledTimes(1);
    expect(deps.deleteBillingDocumentUseCase.execute).toHaveBeenCalledTimes(1);
    expect(deps.deleteBusinessTransactionUseCase.execute).toHaveBeenCalledWith(
      buildOrderRefundTransactionRemoteId("attempt-1"),
    );
    expect(deps.deleteBillingDocumentUseCase.execute).toHaveBeenCalledWith(
      buildOrderRefundBillingDocumentRemoteId({
        orderRemoteId: "order-1",
        refundLedgerEntryRemoteId:
          buildOrderRefundSettlementLedgerEntryRemoteId("attempt-1"),
      }),
    );
    if (!result.success) {
      expect(result.error.message).toContain("Refund settlement save failed");
      expect(result.error.message).not.toContain("Rollback failed");
    }
  });
});
