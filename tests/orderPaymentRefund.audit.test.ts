import {
  MoneyAccountType,
  type MoneyAccount,
} from "@/feature/accounts/types/moneyAccount.types";
import type { RecordAuditEventUseCase } from "@/feature/audit/useCase/recordAuditEvent.useCase";
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
import type { OrderPaymentPostingWorkflowInput } from "@/feature/orders/workflow/orderPaymentPosting/types/orderPaymentPostingWorkflow.types";
import { createRunOrderPaymentPostingWorkflowUseCase } from "@/feature/orders/workflow/orderPaymentPosting/useCase/runOrderPaymentPostingWorkflow.useCase.impl";
import type { OrderRefundPostingWorkflowInput } from "@/feature/orders/workflow/orderRefundPosting/types/orderRefundPostingWorkflow.types";
import { createRunOrderRefundPostingWorkflowUseCase } from "@/feature/orders/workflow/orderRefundPosting/useCase/runOrderRefundPostingWorkflow.useCase.impl";
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
  remoteId: "money-1",
  ownerUserRemoteId: "user-1",
  scopeAccountRemoteId: "business-1",
  name: "Cash Account",
  type: MoneyAccountType.Cash,
  currentBalance: 1000,
  description: null,
  currencyCode: "NPR",
  isPrimary: true,
  isActive: true,
  createdAt: 1,
  updatedAt: 1,
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
  createdAt: 1,
  updatedAt: 1,
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
  createdAt: 1,
  updatedAt: 1,
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
  issuedAt: 1,
  dueAt: null,
  sourceModule: "orders",
  sourceRemoteId: "order-1",
  linkedLedgerEntryRemoteId: "due-1",
  items: [],
  createdAt: 1,
  updatedAt: 1,
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
  title: "Order Due",
  amount: 113,
  currencyCode: "NPR",
  note: null,
  happenedAt: 1,
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
  createdAt: 1,
  updatedAt: 1,
  ...overrides,
});

const buildTransaction = (
  overrides: Partial<Transaction> = {},
): Transaction => ({
  remoteId: "txn-order-payment-1",
  ownerUserRemoteId: "user-1",
  accountRemoteId: "business-1",
  accountDisplayNameSnapshot: "Business Name",
  transactionType: TransactionType.Income,
  direction: TransactionDirection.In,
  title: "Order Payment ORD-001",
  amount: 200,
  currencyCode: "NPR",
  categoryRemoteId: null,
  categoryNameSnapshot: null,
  categoryLabel: "Orders",
  note: null,
  happenedAt: 1,
  settlementMoneyAccountRemoteId: "money-1",
  settlementMoneyAccountDisplayNameSnapshot: "Cash Account",
  sourceModule: TransactionSourceModule.Orders,
  sourceRemoteId: "order-1",
  sourceAction: "payment",
  idempotencyKey: "orders:payment:attempt-1",
  postingStatus: TransactionPostingStatus.Posted,
  contactRemoteId: "contact-1",
  createdAt: 1,
  updatedAt: 1,
  ...overrides,
});

const createRecordAuditUseCase = (
  execute?: ReturnType<typeof vi.fn>,
): RecordAuditEventUseCase => ({
  execute:
    (execute ??
      vi.fn(async () => ({
        success: true as const,
        value: {} as never,
      }))) as RecordAuditEventUseCase["execute"],
});

const buildPaymentInput = (
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
  settlementMoneyAccountRemoteId: "money-1",
  settlementMoneyAccountDisplayNameSnapshot: "Cash Account",
  note: null,
  ...overrides,
});

const buildRefundInput = (
  overrides: Partial<OrderRefundPostingWorkflowInput> = {},
): OrderRefundPostingWorkflowInput => ({
  refundAttemptRemoteId: "refund-attempt-1",
  orderRemoteId: "order-1",
  orderNumber: "ORD-001",
  ownerUserRemoteId: "user-1",
  accountRemoteId: "business-1",
  accountDisplayNameSnapshot: "Business Name",
  currencyCode: "NPR",
  amount: 100,
  happenedAt: 1_710_000_000_000,
  settlementMoneyAccountRemoteId: "money-1",
  settlementMoneyAccountDisplayNameSnapshot: "Cash Account",
  note: null,
  ...overrides,
});

const createPaymentDeps = (overrides: Record<string, unknown> = {}) => ({
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
  postBusinessTransactionUseCase: {
    execute: vi.fn(async () => ({
      success: true as const,
      value: buildTransaction({
        remoteId: "txn-order-payment-attempt-1",
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
  saveLedgerEntryWithSettlementUseCase: {
    execute: vi.fn(async () => ({
      success: true as const,
      value: buildLedgerEntry({
        remoteId: "led-settlement-attempt-1",
        entryType: LedgerEntryType.Collection,
        amount: 100,
      }),
    })),
  },
  ensureOrderBillingAndDueLinksUseCase: {
    execute: vi.fn(async () => ({
      success: true as const,
      value: {
        order: buildOrder(),
        contact: buildContact(),
        billingDocumentRemoteId: "bill-1",
        ledgerDueEntryRemoteId: "due-1",
      },
    })),
  },
  recordAuditEventUseCase: createRecordAuditUseCase(),
  ...overrides,
});

const createRefundDeps = (overrides: Record<string, unknown> = {}) => ({
  getBillingOverviewUseCase: {
    execute: vi.fn(async () => ({
      success: true as const,
      value: {
        documents: [
          buildBillingDocument({
            remoteId: "bill-order-order-1",
            sourceRemoteId: "order-1",
            linkedLedgerEntryRemoteId: "led-order-due-order-1",
            paidAmount: 200,
            outstandingAmount: 0,
          }),
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
  },
  getLedgerEntriesUseCase: {
    execute: vi.fn(async () => ({
      success: true as const,
      value: [
        buildLedgerEntry({
          remoteId: "led-order-due-order-1",
          linkedDocumentRemoteId: "bill-order-order-1",
        }),
      ],
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
      value: [buildTransaction({ amount: 200 })],
    })),
  },
  postBusinessTransactionUseCase: {
    execute: vi.fn(async () => ({
      success: true as const,
      value: buildTransaction({
        remoteId: buildOrderRefundTransactionRemoteId("refund-attempt-1"),
        transactionType: TransactionType.Expense,
        direction: TransactionDirection.Out,
        sourceAction: "refund",
        idempotencyKey: "orders:refund:refund-attempt-1",
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
            buildOrderRefundSettlementLedgerEntryRemoteId("refund-attempt-1"),
        }),
        documentType: BillingDocumentType.CreditNote,
        status: BillingDocumentStatus.Paid,
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
        remoteId: buildOrderRefundSettlementLedgerEntryRemoteId(
          "refund-attempt-1",
        ),
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
        order: buildOrder({
          linkedBillingDocumentRemoteId: "bill-order-order-1",
          linkedLedgerDueEntryRemoteId: "led-order-due-order-1",
        }),
        contact: buildContact(),
        billingDocumentRemoteId: "bill-order-order-1",
        ledgerDueEntryRemoteId: "led-order-due-order-1",
      },
    })),
  },
  recordAuditEventUseCase: createRecordAuditUseCase(),
  ...overrides,
});

describe("order payment/refund workflow audit", () => {
  it("order payment success emits order_payment_posted", async () => {
    const deps = createPaymentDeps();
    const useCase = createRunOrderPaymentPostingWorkflowUseCase(deps as any);

    const result = await useCase.execute(buildPaymentInput());

    expect(result.success).toBe(true);
    expect(deps.recordAuditEventUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "order_payment_posted",
        outcome: "success",
      }),
    );
  });

  it("order payment settlement failure emits order_payment_failed with rollback metadata", async () => {
    const deps = createPaymentDeps({
      saveLedgerEntryWithSettlementUseCase: {
        execute: vi.fn(async () => ({
          success: false as const,
          error: {
            type: "VALIDATION_ERROR",
            message: "Settlement save failed",
          },
        })),
      },
      deleteBusinessTransactionUseCase: {
        execute: vi.fn(async () => ({
          success: false as const,
          error: {
            type: "UNKNOWN_ERROR",
            message: "rollback delete failed",
          },
        })),
      },
    });
    const useCase = createRunOrderPaymentPostingWorkflowUseCase(deps as any);

    const result = await useCase.execute(buildPaymentInput());

    expect(result.success).toBe(false);
    const auditPayload = (
      deps.recordAuditEventUseCase.execute as ReturnType<typeof vi.fn>
    ).mock.calls[0]?.[0] as {
      action: string;
      metadataJson: string;
    };
    const metadata = JSON.parse(auditPayload.metadataJson) as {
      rollbackMessage: string | null;
    };

    expect(auditPayload.action).toBe("order_payment_failed");
    expect(metadata.rollbackMessage).toContain("rollback delete failed");
  });

  it("order payment audit failure after successful payment keeps success", async () => {
    const deps = createPaymentDeps({
      recordAuditEventUseCase: createRecordAuditUseCase(
        vi.fn(async () => ({
          success: false as const,
          error: {
            type: "DATABASE" as const,
            message: "Unable to save audit event.",
          },
        })),
      ),
    });
    const useCase = createRunOrderPaymentPostingWorkflowUseCase(deps as any);

    const result = await useCase.execute(buildPaymentInput());

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.orderRemoteId).toBe("order-1");
      expect(result.value.paymentTransactionRemoteId).toBe(
        "txn-order-payment-attempt-1",
      );
    }
  });

  it("order refund success emits order_refund_posted", async () => {
    const deps = createRefundDeps();
    const useCase = createRunOrderRefundPostingWorkflowUseCase(deps as any);

    const result = await useCase.execute(buildRefundInput());

    expect(result.success).toBe(true);
    expect(deps.recordAuditEventUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "order_refund_posted",
        outcome: "success",
      }),
    );
  });

  it("order refund rollback failure emits order_refund_failed with rollback metadata", async () => {
    const deps = createRefundDeps({
      saveLedgerEntryWithSettlementUseCase: {
        execute: vi.fn(async () => ({
          success: false as const,
          error: {
            type: "VALIDATION_ERROR",
            message: "Refund settlement save failed",
          },
        })),
      },
      deleteBusinessTransactionUseCase: {
        execute: vi.fn(async () => ({
          success: false as const,
          error: {
            type: "UNKNOWN_ERROR",
            message: "refund txn rollback failed",
          },
        })),
      },
    });
    const useCase = createRunOrderRefundPostingWorkflowUseCase(deps as any);

    const result = await useCase.execute(buildRefundInput());

    expect(result.success).toBe(false);
    const auditPayload = (
      deps.recordAuditEventUseCase.execute as ReturnType<typeof vi.fn>
    ).mock.calls[0]?.[0] as {
      action: string;
      metadataJson: string;
    };
    const metadata = JSON.parse(auditPayload.metadataJson) as {
      rollbackMessage: string | null;
    };

    expect(auditPayload.action).toBe("order_refund_failed");
    expect(metadata.rollbackMessage).toContain("refund transaction rollback failed");
  });

  it("order refund audit failure after successful refund returns failure", async () => {
    const deps = createRefundDeps({
      recordAuditEventUseCase: createRecordAuditUseCase(
        vi.fn(async () => ({
          success: false as const,
          error: {
            type: "DATABASE" as const,
            message: "Unable to save audit event.",
          },
        })),
      ),
    });
    const useCase = createRunOrderRefundPostingWorkflowUseCase(deps as any);

    const result = await useCase.execute(buildRefundInput());

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain("Unable to save audit event");
    }
  });
});
