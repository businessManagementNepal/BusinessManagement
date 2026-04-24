import type { DeleteBillingDocumentUseCase } from "@/feature/billing/useCase/deleteBillingDocument.useCase";
import type { SaveBillingDocumentUseCase } from "@/feature/billing/useCase/saveBillingDocument.useCase";
import type { AddLedgerEntryUseCase } from "@/feature/ledger/useCase/addLedgerEntry.useCase";
import type { DeleteLedgerEntryUseCase } from "@/feature/ledger/useCase/deleteLedgerEntry.useCase";
import type { CreatePosSaleDraftUseCase } from "@/feature/pos/useCase/createPosSaleDraft.useCase";
import type { UpdatePosSaleWorkflowStateUseCase } from "@/feature/pos/useCase/updatePosSaleWorkflowState.useCase";
import type { PosSaleRecord } from "@/feature/pos/types/posSale.entity.types";
import { ProductKind } from "@/feature/products/types/product.types";
import type { CommitPosCheckoutInventoryUseCase } from "@/feature/pos/workflow/posCheckout/useCase/commitPosCheckoutInventory.useCase";
import type {
  PosCustomer,
  PosTotals,
  PosCartLine,
  PosReceipt,
} from "@/feature/pos/types/pos.entity.types";
import type { PosCheckoutRepository } from "@/feature/pos/workflow/posCheckout/repository/posCheckout.repository";
import {
  PosCheckoutWorkflowStatus,
} from "@/feature/pos/workflow/posCheckout/types/posCheckout.state.types";
import type { RunPosCheckoutParams } from "@/feature/pos/workflow/posCheckout/types/posCheckout.types";
import { createRunPosCheckoutUseCase } from "@/feature/pos/workflow/posCheckout/useCase/runPosCheckout.useCase.impl";
import type { DeleteBusinessTransactionUseCase } from "@/feature/transactions/useCase/deleteBusinessTransaction.useCase";
import type { PostBusinessTransactionUseCase } from "@/feature/transactions/useCase/postBusinessTransaction.useCase";
import { buildPosCartLine, buildPosTotals } from "./helpers/posTestBuilders";
import { describe, expect, it, vi } from "vitest";

const BASE_TOTALS: PosTotals = buildPosTotals({
  itemCount: 1,
  gross: 1000,
  taxAmount: 130,
  grandTotal: 1130,
});

const BASE_CART_LINES: readonly PosCartLine[] = [
  buildPosCartLine({
    lineId: "line-1",
    productId: "product-1",
    productName: "Test Product",
    categoryLabel: "General",
    shortCode: "TP",
    kind: ProductKind.Item,
    quantity: 1,
    unitPrice: 1000,
    taxRate: 0.13,
    lineSubtotal: 1000,
  }),
];

const CUSTOMER: PosCustomer = {
  remoteId: "customer-1",
  fullName: "John Doe",
  phone: "+1234567890",
  address: null,
};

const createRunParams = (
  overrides: Partial<RunPosCheckoutParams> = {},
): RunPosCheckoutParams => ({
  idempotencyKey: "idem-1",
  paymentParts: [
    {
      paymentPartId: "part-1",
      payerLabel: null,
      amount: 1130,
      settlementAccountRemoteId: "money-cash-1",
    },
  ],
  selectedCustomer: null,
  grandTotalSnapshot: BASE_TOTALS.grandTotal,
  cartLinesSnapshot: BASE_CART_LINES,
  totalsSnapshot: BASE_TOTALS,
  activeBusinessAccountRemoteId: "business-1",
  activeOwnerUserRemoteId: "user-1",
  activeAccountCurrencyCode: "NPR",
  activeAccountCountryCode: "NP",
  ...overrides,
});

const buildReceiptSnapshot = ({
  receiptNumber,
  cartLines,
  totals,
  paymentParts,
  selectedCustomer,
}: {
  receiptNumber: string;
  cartLines: readonly PosCartLine[];
  totals: PosTotals;
  paymentParts: RunPosCheckoutParams["paymentParts"];
  selectedCustomer: PosCustomer | null;
}): PosReceipt => {
  const paidAmount = Number(
    paymentParts.reduce((sum, part) => sum + part.amount, 0).toFixed(2),
  );
  const dueAmount = Number(Math.max(totals.grandTotal - paidAmount, 0).toFixed(2));

  return {
    receiptNumber,
    issuedAt: new Date(1710000000000).toISOString(),
    lines: cartLines.map((line) => ({ ...line })),
    totals: { ...totals },
    paidAmount,
    dueAmount,
    paymentParts: paymentParts.map((part) => ({
      paymentPartId: part.paymentPartId,
      payerLabel: part.payerLabel,
      amount: Number(part.amount.toFixed(2)),
      settlementAccountRemoteId: part.settlementAccountRemoteId,
      settlementAccountLabel: null,
    })),
    ledgerEffect:
      dueAmount > 0
        ? {
            type: "due_balance_pending",
            dueAmount,
            accountRemoteId:
              paymentParts[0]?.settlementAccountRemoteId?.trim() || null,
          }
        : {
            type: "none",
            dueAmount: 0,
            accountRemoteId:
              paymentParts[0]?.settlementAccountRemoteId?.trim() || null,
          },
    customerName: selectedCustomer?.fullName ?? null,
    customerPhone: selectedCustomer?.phone ?? null,
    contactRemoteId: selectedCustomer?.remoteId ?? null,
  };
};

const createSaleRecord = (
  overrides: Partial<PosSaleRecord> = {},
): PosSaleRecord => {
  const paymentParts = overrides.paymentParts ?? createRunParams().paymentParts;
  const totalsSnapshot = overrides.totalsSnapshot ?? BASE_TOTALS;
  const selectedCustomer =
    overrides.customerRemoteId && overrides.customerNameSnapshot
      ? {
          remoteId: overrides.customerRemoteId,
          fullName: overrides.customerNameSnapshot,
          phone: overrides.customerPhoneSnapshot ?? null,
          address: null,
        }
      : null;

  return {
    remoteId: "sale-1",
    receiptNumber: "POS-001",
    businessAccountRemoteId: "business-1",
    ownerUserRemoteId: "user-1",
    idempotencyKey: "idem-1",
    workflowStatus: PosCheckoutWorkflowStatus.PendingPosting,
    customerRemoteId: selectedCustomer?.remoteId ?? null,
    customerNameSnapshot: selectedCustomer?.fullName ?? null,
    customerPhoneSnapshot: selectedCustomer?.phone ?? null,
    currencyCode: "NPR",
    countryCode: "NP",
    cartLinesSnapshot: BASE_CART_LINES,
    totalsSnapshot,
    paymentParts,
    receipt: buildReceiptSnapshot({
      receiptNumber: "POS-001",
      cartLines: BASE_CART_LINES,
      totals: totalsSnapshot,
      paymentParts,
      selectedCustomer,
    }),
    billingDocumentRemoteId: null,
    ledgerEntryRemoteId: null,
    postedTransactionRemoteIds: [],
    lastErrorType: null,
    lastErrorMessage: null,
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  };
};

type HarnessOptions = {
  getSaleByIdempotencyKey?: PosCheckoutRepository["getSaleByIdempotencyKey"];
  initialSaleState?: PosSaleRecord | null;
  commitInventoryExecute?: CommitPosCheckoutInventoryUseCase["execute"];
  addLedgerEntryExecute?: AddLedgerEntryUseCase["execute"];
  verifyLinkedDocument?: AddLedgerEntryUseCase["verifyLinkedDocument"];
  postBusinessTransactionExecute?: PostBusinessTransactionUseCase["execute"];
  saveBillingDocumentExecute?: SaveBillingDocumentUseCase["execute"];
};

const createCheckoutHarness = (options: HarnessOptions = {}) => {
  let postedTransactionCount = 0;
  let saleState: PosSaleRecord | null = options.initialSaleState ?? null;

  const getSaleByIdempotencyKey: PosCheckoutRepository["getSaleByIdempotencyKey"] =
    options.getSaleByIdempotencyKey ??
    vi.fn(async () => ({
      success: true as const,
      value: saleState,
    }));

  const createPosSaleDraftUseCase: CreatePosSaleDraftUseCase = {
    execute: vi.fn(async (params) => {
      saleState = {
        remoteId: params.remoteId,
        receiptNumber: params.receiptNumber,
        businessAccountRemoteId: params.businessAccountRemoteId,
        ownerUserRemoteId: params.ownerUserRemoteId,
        idempotencyKey: params.idempotencyKey,
        workflowStatus: PosCheckoutWorkflowStatus.PendingValidation,
        customerRemoteId: params.customerRemoteId,
        customerNameSnapshot: params.customerNameSnapshot,
        customerPhoneSnapshot: params.customerPhoneSnapshot,
        currencyCode: params.currencyCode,
        countryCode: params.countryCode,
        cartLinesSnapshot: params.cartLinesSnapshot,
        totalsSnapshot: params.totalsSnapshot,
        paymentParts: params.paymentParts,
        receipt: params.receipt,
        billingDocumentRemoteId: null,
        ledgerEntryRemoteId: null,
        postedTransactionRemoteIds: [],
        lastErrorType: null,
        lastErrorMessage: null,
        createdAt: 1,
        updatedAt: 1,
      };

      return {
        success: true as const,
        value: saleState,
      };
    }),
  };

  const updatePosSaleWorkflowStateUseCase: UpdatePosSaleWorkflowStateUseCase = {
    execute: vi.fn(async (params) => {
      if (!saleState) {
        return {
          success: false as const,
          error: {
            type: "NOT_FOUND" as const,
            message: "Sale not found.",
          },
        };
      }

      saleState = {
        ...saleState,
        workflowStatus: params.workflowStatus,
        receipt: params.receipt,
        billingDocumentRemoteId: params.billingDocumentRemoteId,
        ledgerEntryRemoteId: params.ledgerEntryRemoteId,
        postedTransactionRemoteIds: params.postedTransactionRemoteIds,
        lastErrorType: params.lastErrorType,
        lastErrorMessage: params.lastErrorMessage,
        updatedAt: saleState.updatedAt + 1,
      };

      return {
        success: true as const,
        value: saleState,
      };
    }),
  };

  const saveBillingDocumentUseCase: SaveBillingDocumentUseCase = {
    execute:
      options.saveBillingDocumentExecute ??
      vi.fn(async () => ({
        success: true as const,
        value: {} as never,
      })),
  };

  const deleteBillingDocumentUseCase: DeleteBillingDocumentUseCase = {
    execute: vi.fn(async () => ({
      success: true as const,
      value: true,
    })),
  };

  const postBusinessTransactionUseCase: PostBusinessTransactionUseCase = {
    execute:
      options.postBusinessTransactionExecute ??
      vi.fn(async () => ({
        success: true as const,
        value: {
          remoteId: `txn-${++postedTransactionCount}`,
        } as never,
      })),
  };

  const deleteBusinessTransactionUseCase: DeleteBusinessTransactionUseCase = {
    execute: vi.fn(async () => ({
      success: true as const,
      value: true,
    })),
  };

  const addLedgerEntryUseCase: AddLedgerEntryUseCase = {
    execute:
      options.addLedgerEntryExecute ??
      vi.fn(async (payload) => ({
        success: true as const,
        value: {
          ...payload,
          createdAt: 1,
          updatedAt: 1,
        },
      })),
    verifyLinkedDocument:
      options.verifyLinkedDocument ??
      vi.fn(async () => ({
        success: true as const,
        value: {} as never,
      })),
  };

  const deleteLedgerEntryUseCase: DeleteLedgerEntryUseCase = {
    execute: vi.fn(async () => ({
      success: true as const,
      value: true,
    })),
  };

  const commitPosCheckoutInventoryUseCase: CommitPosCheckoutInventoryUseCase = {
    execute:
      options.commitInventoryExecute ??
      vi.fn(async () => ({
        success: true as const,
        value: true,
      })),
  };
  const recordAuditEventUseCase = {
    execute: vi.fn(async () => ({
      success: true as const,
      value: {} as never,
    })),
  };

  const useCase = createRunPosCheckoutUseCase({
    posCheckoutRepository: {
      getSaleByIdempotencyKey,
    },
    createPosSaleDraftUseCase,
    updatePosSaleWorkflowStateUseCase,
    saveBillingDocumentUseCase,
    deleteBillingDocumentUseCase,
    postBusinessTransactionUseCase,
    deleteBusinessTransactionUseCase,
    addLedgerEntryUseCase,
    deleteLedgerEntryUseCase,
    commitPosCheckoutInventoryUseCase,
    recordAuditEventUseCase: recordAuditEventUseCase as never,
  });

  return {
    useCase,
    spies: {
      getSaleByIdempotencyKey,
      createPosSaleDraftExecute: createPosSaleDraftUseCase.execute,
      updateWorkflowExecute: updatePosSaleWorkflowStateUseCase.execute,
      saveBillingDocumentExecute: saveBillingDocumentUseCase.execute,
      postBusinessTransactionExecute: postBusinessTransactionUseCase.execute,
      addLedgerEntryExecute: addLedgerEntryUseCase.execute,
      verifyLinkedDocument: addLedgerEntryUseCase.verifyLinkedDocument,
      commitInventoryExecute: commitPosCheckoutInventoryUseCase.execute,
      recordAuditEventExecute: recordAuditEventUseCase.execute,
    },
  };
};

describe("runPosCheckout.useCase", () => {
  it("handles fully paid checkout without posting due ledger", async () => {
    const { useCase, spies } = createCheckoutHarness();

    const result = await useCase.execute(createRunParams());

    expect(result.success).toBe(true);
    expect(spies.addLedgerEntryExecute).not.toHaveBeenCalled();
    expect(spies.postBusinessTransactionExecute).toHaveBeenCalledTimes(1);

    if (result.success) {
      expect(result.value.workflowStatus).toBe(PosCheckoutWorkflowStatus.Posted);
      expect(result.value.receipt?.ledgerEffect.type).toBe("none");
      expect(result.value.receipt?.dueAmount).toBe(0);
    }
  });

  it("handles unpaid checkout with customer and creates due ledger entry", async () => {
    const { useCase, spies } = createCheckoutHarness();

    const result = await useCase.execute(
      createRunParams({
        paymentParts: [
          {
            paymentPartId: "part-1",
            payerLabel: null,
            amount: 830,
            settlementAccountRemoteId: "money-cash-1",
          },
        ],
        selectedCustomer: CUSTOMER,
      }),
    );

    expect(result.success).toBe(true);
    expect(spies.addLedgerEntryExecute).toHaveBeenCalledTimes(1);
    expect(spies.verifyLinkedDocument).toHaveBeenCalledTimes(1);

    if (result.success) {
      expect(result.value.workflowStatus).toBe(PosCheckoutWorkflowStatus.Posted);
      expect(result.value.receipt?.ledgerEffect.type).toBe("due_balance_created");
      expect(result.value.receipt?.dueAmount).toBe(300);
    }
  });

  it("requires settlement account for paid checkout", async () => {
    const { useCase, spies } = createCheckoutHarness();

    const result = await useCase.execute(
      createRunParams({
        paymentParts: [
          {
            paymentPartId: "part-1",
            payerLabel: null,
            amount: 1130,
            settlementAccountRemoteId: "",
          },
        ],
      }),
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe("CONTEXT_REQUIRED");
      expect(result.error.message).toContain("Settlement money account");
    }
    expect(spies.commitInventoryExecute).not.toHaveBeenCalled();
  });

  it("requires customer when due amount remains", async () => {
    const { useCase, spies } = createCheckoutHarness();

    const result = await useCase.execute(
      createRunParams({
        paymentParts: [
          {
            paymentPartId: "part-1",
            payerLabel: null,
            amount: 830,
            settlementAccountRemoteId: "money-cash-1",
          },
        ],
        selectedCustomer: null,
      }),
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe("CONTEXT_REQUIRED");
      expect(result.error.message).toContain("Customer selection is required");
    }
    expect(spies.commitInventoryExecute).not.toHaveBeenCalled();
  });

  it("marks checkout as failed when ledger linkage verification fails and rollback succeeds", async () => {
    const { useCase, spies } = createCheckoutHarness({
      verifyLinkedDocument: vi.fn(async () => ({
        success: false as const,
        error: {
          type: "VALIDATION_ERROR" as const,
          message: "No ledger entry found linked to this billing document.",
        },
      })),
    });

    const result = await useCase.execute(
      createRunParams({
        paymentParts: [
          {
            paymentPartId: "part-1",
            payerLabel: null,
            amount: 830,
            settlementAccountRemoteId: "money-cash-1",
          },
        ],
        selectedCustomer: CUSTOMER,
      }),
    );

    expect(result.success).toBe(true);
    expect(spies.addLedgerEntryExecute).toHaveBeenCalledTimes(1);
    expect(spies.verifyLinkedDocument).toHaveBeenCalledTimes(1);

    if (result.success) {
      expect(result.value.workflowStatus).toBe(PosCheckoutWorkflowStatus.Failed);
      expect(result.value.receipt?.ledgerEffect.type).toBe(
        "due_balance_create_failed",
      );
      expect(result.value.ledgerEntryRemoteId).toBeNull();
    }
  });

  it("returns posted sale for existing posted idempotency key", async () => {
    const existingSale = createSaleRecord({
      workflowStatus: PosCheckoutWorkflowStatus.Posted,
      billingDocumentRemoteId: "pos-doc-sale-1",
      postedTransactionRemoteIds: ["txn-pos-sale-1-part-1"],
    });
    const { useCase, spies } = createCheckoutHarness({
      initialSaleState: existingSale,
    });

    const result = await useCase.execute(
      createRunParams({
        cartLinesSnapshot: [],
      }),
    );

    expect(result.success).toBe(true);
    expect(spies.createPosSaleDraftExecute).not.toHaveBeenCalled();
    expect(spies.saveBillingDocumentExecute).not.toHaveBeenCalled();
    if (result.success) {
      expect(result.value.workflowStatus).toBe(PosCheckoutWorkflowStatus.Posted);
      expect(result.value.billingDocumentRemoteId).toBe("pos-doc-sale-1");
    }
  });

  it("retries pending_posting sale from persisted snapshot", async () => {
    const existingSale = createSaleRecord({
      workflowStatus: PosCheckoutWorkflowStatus.PendingPosting,
    });
    const { useCase, spies } = createCheckoutHarness({
      initialSaleState: existingSale,
    });

    const result = await useCase.execute(
      createRunParams({
        cartLinesSnapshot: [],
        paymentParts: [],
      }),
    );

    expect(result.success).toBe(true);
    expect(spies.postBusinessTransactionExecute).toHaveBeenCalledTimes(1);
    expect(spies.commitInventoryExecute).toHaveBeenCalledTimes(1);
    if (result.success) {
      expect(result.value.workflowStatus).toBe(PosCheckoutWorkflowStatus.Posted);
    }
  });

  it("retries pending_validation sale from persisted snapshot", async () => {
    const existingSale = createSaleRecord({
      workflowStatus: PosCheckoutWorkflowStatus.PendingValidation,
    });

    const { useCase, spies } = createCheckoutHarness({
      initialSaleState: existingSale,
    });

    const result = await useCase.execute(createRunParams());

    expect(result.success).toBe(true);
    expect(spies.createPosSaleDraftExecute).not.toHaveBeenCalled();
    expect(spies.postBusinessTransactionExecute).toHaveBeenCalledTimes(1);
    expect(spies.commitInventoryExecute).toHaveBeenCalledTimes(1);

    if (result.success) {
      expect(result.value.workflowStatus).toBe(PosCheckoutWorkflowStatus.Posted);
    }
  });

  it("retries fully unpaid due sale when customer snapshot exists", async () => {
    const existingSale = createSaleRecord({
      workflowStatus: PosCheckoutWorkflowStatus.PendingPosting,
      paymentParts: [],
      customerRemoteId: CUSTOMER.remoteId,
      customerNameSnapshot: CUSTOMER.fullName,
      customerPhoneSnapshot: CUSTOMER.phone,
      receipt: buildReceiptSnapshot({
        receiptNumber: "POS-001",
        cartLines: BASE_CART_LINES,
        totals: BASE_TOTALS,
        paymentParts: [],
        selectedCustomer: CUSTOMER,
      }),
    });

    const { useCase, spies } = createCheckoutHarness({
      initialSaleState: existingSale,
    });

    const result = await useCase.execute(createRunParams());

    expect(result.success).toBe(true);
    expect(spies.postBusinessTransactionExecute).not.toHaveBeenCalled();
    expect(spies.addLedgerEntryExecute).toHaveBeenCalledTimes(1);
    expect(spies.commitInventoryExecute).toHaveBeenCalledTimes(1);

    if (result.success) {
      expect(result.value.workflowStatus).toBe(PosCheckoutWorkflowStatus.Posted);
      expect(result.value.ledgerEntryRemoteId).toBe("pos-ledger-sale-1");
    }
  });

  it("rejects fully unpaid due sale retry when customer snapshot is missing", async () => {
    const existingSale = createSaleRecord({
      workflowStatus: PosCheckoutWorkflowStatus.PendingPosting,
      paymentParts: [],
      customerRemoteId: null,
      customerNameSnapshot: null,
      customerPhoneSnapshot: null,
      receipt: buildReceiptSnapshot({
        receiptNumber: "POS-001",
        cartLines: BASE_CART_LINES,
        totals: BASE_TOTALS,
        paymentParts: [],
        selectedCustomer: null,
      }),
    });

    const { useCase, spies } = createCheckoutHarness({
      initialSaleState: existingSale,
    });

    const result = await useCase.execute(createRunParams());

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.type).toBe("CONTEXT_REQUIRED");
      expect(result.error.message).toContain("Customer selection is required");
    }

    expect(spies.postBusinessTransactionExecute).not.toHaveBeenCalled();
    expect(spies.addLedgerEntryExecute).not.toHaveBeenCalled();
    expect(spies.commitInventoryExecute).not.toHaveBeenCalled();
  });

  it("does not create a second POS sale draft during retry", async () => {
    const existingSale = createSaleRecord({
      workflowStatus: PosCheckoutWorkflowStatus.PendingValidation,
    });
    const { useCase, spies } = createCheckoutHarness({
      initialSaleState: existingSale,
    });

    const result = await useCase.execute(createRunParams());

    expect(result.success).toBe(true);
    expect(spies.createPosSaleDraftExecute).not.toHaveBeenCalled();
  });

  it("uses deterministic billing document id on retry", async () => {
    const existingSale = createSaleRecord({
      workflowStatus: PosCheckoutWorkflowStatus.PendingPosting,
      billingDocumentRemoteId: null,
    });
    const { useCase, spies } = createCheckoutHarness({
      initialSaleState: existingSale,
    });

    const result = await useCase.execute(createRunParams());

    expect(result.success).toBe(true);
    expect(spies.saveBillingDocumentExecute).toHaveBeenCalledWith(
      expect.objectContaining({
        remoteId: "pos-doc-sale-1",
        sourceRemoteId: "sale-1",
      }),
    );
    if (result.success) {
      expect(result.value.billingDocumentRemoteId).toBe("pos-doc-sale-1");
    }
  });

  it("uses deterministic transaction id per payment part", async () => {
    const existingSale = createSaleRecord({
      workflowStatus: PosCheckoutWorkflowStatus.PendingPosting,
      paymentParts: [
        {
          paymentPartId: "part-1",
          payerLabel: null,
          amount: 700,
          settlementAccountRemoteId: "money-cash-1",
        },
        {
          paymentPartId: "part-2",
          payerLabel: null,
          amount: 430,
          settlementAccountRemoteId: "money-cash-1",
        },
      ],
      receipt: buildReceiptSnapshot({
        receiptNumber: "POS-001",
        cartLines: BASE_CART_LINES,
        totals: BASE_TOTALS,
        paymentParts: [
          {
            paymentPartId: "part-1",
            payerLabel: null,
            amount: 700,
            settlementAccountRemoteId: "money-cash-1",
          },
          {
            paymentPartId: "part-2",
            payerLabel: null,
            amount: 430,
            settlementAccountRemoteId: "money-cash-1",
          },
        ],
        selectedCustomer: null,
      }),
    });
    const { useCase, spies } = createCheckoutHarness({
      initialSaleState: existingSale,
    });

    const result = await useCase.execute(createRunParams());

    expect(result.success).toBe(true);
    expect(spies.postBusinessTransactionExecute).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        remoteId: "txn-pos-sale-1-part-1",
      }),
    );
    expect(spies.postBusinessTransactionExecute).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        remoteId: "txn-pos-sale-1-part-2",
      }),
    );
  });
});


