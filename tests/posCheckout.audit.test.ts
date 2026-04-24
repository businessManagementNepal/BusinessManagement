import type { RecordAuditEventUseCase } from "@/feature/audit/useCase/recordAuditEvent.useCase";
import type { DeleteBillingDocumentUseCase } from "@/feature/billing/useCase/deleteBillingDocument.useCase";
import type { SaveBillingDocumentUseCase } from "@/feature/billing/useCase/saveBillingDocument.useCase";
import type { AddLedgerEntryUseCase } from "@/feature/ledger/useCase/addLedgerEntry.useCase";
import type { DeleteLedgerEntryUseCase } from "@/feature/ledger/useCase/deleteLedgerEntry.useCase";
import type {
  PosCartLine,
  PosReceipt,
  PosTotals,
} from "@/feature/pos/types/pos.entity.types";
import type { PosSaleRecord } from "@/feature/pos/types/posSale.entity.types";
import type { CreatePosSaleDraftUseCase } from "@/feature/pos/useCase/createPosSaleDraft.useCase";
import type { UpdatePosSaleWorkflowStateUseCase } from "@/feature/pos/useCase/updatePosSaleWorkflowState.useCase";
import { ProductKind } from "@/feature/products/types/product.types";
import type { CommitPosCheckoutInventoryUseCase } from "@/feature/pos/workflow/posCheckout/useCase/commitPosCheckoutInventory.useCase";
import type { PosCheckoutRepository } from "@/feature/pos/workflow/posCheckout/repository/posCheckout.repository";
import {
  PosCheckoutWorkflowStatus,
} from "@/feature/pos/workflow/posCheckout/types/posCheckout.state.types";
import type { RunPosCheckoutParams } from "@/feature/pos/workflow/posCheckout/types/posCheckout.types";
import { createRunPosCheckoutUseCase } from "@/feature/pos/workflow/posCheckout/useCase/runPosCheckout.useCase.impl";
import type { DeleteBusinessTransactionUseCase } from "@/feature/transactions/useCase/deleteBusinessTransaction.useCase";
import type { PostBusinessTransactionUseCase } from "@/feature/transactions/useCase/postBusinessTransaction.useCase";
import { describe, expect, it, vi } from "vitest";
import { buildPosCartLine, buildPosTotals } from "./helpers/posTestBuilders";

const BASE_TOTALS: PosTotals = buildPosTotals({
  itemCount: 1,
  gross: 100,
  taxAmount: 0,
  grandTotal: 100,
});

const BASE_CART_LINES: readonly PosCartLine[] = [
  buildPosCartLine({
    lineId: "line-1",
    productId: "product-1",
    productName: "Audit Product",
    categoryLabel: "General",
    shortCode: "AUD",
    kind: ProductKind.Item,
    quantity: 1,
    unitPrice: 100,
    taxRate: 0,
    lineSubtotal: 100,
  }),
];

const createRunParams = (
  overrides: Partial<RunPosCheckoutParams> = {},
): RunPosCheckoutParams => ({
  idempotencyKey: "idem-audit-1",
  paymentParts: [
    {
      paymentPartId: "part-1",
      payerLabel: null,
      amount: 100,
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

const buildReceiptSnapshot = (): PosReceipt => ({
  receiptNumber: "POS-001",
  issuedAt: new Date(1_710_000_000_000).toISOString(),
  lines: BASE_CART_LINES.map((line) => ({ ...line })),
  totals: { ...BASE_TOTALS },
  paidAmount: 100,
  dueAmount: 0,
  paymentParts: [
    {
      paymentPartId: "part-1",
      payerLabel: null,
      amount: 100,
      settlementAccountRemoteId: "money-cash-1",
      settlementAccountLabel: null,
    },
  ],
  ledgerEffect: {
    type: "none",
    dueAmount: 0,
    accountRemoteId: "money-cash-1",
  },
  customerName: null,
  customerPhone: null,
  contactRemoteId: null,
});

type HarnessOptions = {
  postBusinessTransactionExecute?: PostBusinessTransactionUseCase["execute"];
  recordAuditExecute?: RecordAuditEventUseCase["execute"];
};

const createCheckoutHarness = (options: HarnessOptions = {}) => {
  let saleState: PosSaleRecord | null = null;

  const getSaleByIdempotencyKey: PosCheckoutRepository["getSaleByIdempotencyKey"] =
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
        receipt: buildReceiptSnapshot(),
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
    execute: vi.fn(async () => ({
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
        value: { remoteId: "txn-1" } as never,
      })),
  };

  const deleteBusinessTransactionUseCase: DeleteBusinessTransactionUseCase = {
    execute: vi.fn(async () => ({
      success: true as const,
      value: true,
    })),
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

  const deleteLedgerEntryUseCase: DeleteLedgerEntryUseCase = {
    execute: vi.fn(async () => ({
      success: true as const,
      value: true,
    })),
  };

  const commitPosCheckoutInventoryUseCase: CommitPosCheckoutInventoryUseCase = {
    execute: vi.fn(async () => ({
      success: true as const,
      value: true,
    })),
  };

  const recordAuditEventUseCase: RecordAuditEventUseCase = {
    execute:
      options.recordAuditExecute ??
      vi.fn(async () => ({
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
    recordAuditEventUseCase,
  });

  return {
    useCase,
    recordAuditEventExecute: recordAuditEventUseCase.execute,
  };
};

describe("pos checkout workflow audit", () => {
  it("successful fully-paid checkout emits pos_checkout_posted", async () => {
    const { useCase, recordAuditEventExecute } = createCheckoutHarness();

    const result = await useCase.execute(createRunParams());

    expect(result.success).toBe(true);
    expect(recordAuditEventExecute).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "pos_checkout_posted",
        outcome: "success",
      }),
    );
  });

  it("failed checkout emits workflow failure audit", async () => {
    const { useCase, recordAuditEventExecute } = createCheckoutHarness({
      postBusinessTransactionExecute: vi.fn(async () => ({
        success: false as const,
        error: {
          type: "UNKNOWN_ERROR" as const,
          message: "Unable to post payment.",
        },
      })),
    });

    const result = await useCase.execute(createRunParams());

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.workflowStatus).toBe(PosCheckoutWorkflowStatus.Failed);
    }
    const auditCalls = (
      recordAuditEventExecute as ReturnType<typeof vi.fn>
    ).mock.calls as Array<[Record<string, string>]>;
    const actions = auditCalls.map((call) => call[0].action);
    expect(
      actions.includes("pos_checkout_failed") ||
        actions.includes("pos_checkout_partially_posted"),
    ).toBe(true);
  });

  it("audit failure after posted checkout returns failure", async () => {
    const { useCase } = createCheckoutHarness({
      recordAuditExecute: vi.fn(async () => ({
        success: false as const,
        error: {
          type: "DATABASE" as const,
          message: "Unable to save audit event.",
        },
      })),
    });

    const result = await useCase.execute(createRunParams());

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe("UNKNOWN");
      expect(result.error.message).toContain("Unable to save audit event");
    }
  });
});
