import { ProductKind } from "@/feature/products/types/product.types";
import { PosErrorType } from "@/feature/pos/types/pos.error.types";
import type { PosSaleRecord } from "@/feature/pos/types/posSale.entity.types";
import { PosSaleWorkflowStatus } from "@/feature/pos/types/posSale.constant";
import type { RunPosCheckoutUseCase } from "@/feature/pos/workflow/posCheckout/useCase/runPosCheckout.useCase";
import { createRetryPosSalePostingUseCase } from "@/feature/pos/workflow/posRecovery/useCase/retryPosSalePosting.useCase.impl";
import { describe, expect, it, vi } from "vitest";

const createRecordAuditEventUseCase = () => ({
  execute: vi.fn(async () => ({
    success: true as const,
    value: {} as never,
  })),
});

const buildSale = (overrides: Partial<PosSaleRecord> = {}): PosSaleRecord => ({
  remoteId: "sale-1",
  receiptNumber: "POS-001",
  businessAccountRemoteId: "business-1",
  ownerUserRemoteId: "owner-1",
  idempotencyKey: "idem-1",
  workflowStatus: PosSaleWorkflowStatus.PendingPosting,
  customerRemoteId: null,
  customerNameSnapshot: null,
  customerPhoneSnapshot: null,
  currencyCode: "NPR",
  countryCode: "NP",
  cartLinesSnapshot: [
    {
      lineId: "line-1",
      productId: "product-1",
      productName: "Tea",
      categoryLabel: "Beverages",
      shortCode: "TE",
      kind: ProductKind.Item,
      quantity: 1,
      unitPrice: 100,
      taxRate: 0,
      lineSubtotal: 100,
    },
  ],
  totalsSnapshot: {
    itemCount: 1,
    gross: 100,
    discountAmount: 0,
    surchargeAmount: 0,
    taxAmount: 0,
    grandTotal: 100,
  },
  paymentParts: [
    {
      paymentPartId: "part-1",
      payerLabel: null,
      amount: 100,
      settlementAccountRemoteId: "money-cash-1",
    },
  ],
  receipt: null,
  billingDocumentRemoteId: null,
  ledgerEntryRemoteId: null,
  postedTransactionRemoteIds: [],
  lastErrorType: null,
  lastErrorMessage: null,
  createdAt: 1,
  updatedAt: 1,
  ...overrides,
});

describe("createRetryPosSalePostingUseCase", () => {
  it("rejects posted sale retry", async () => {
    const runPosCheckoutUseCase: RunPosCheckoutUseCase = {
      execute: vi.fn(),
    };

    const useCase = createRetryPosSalePostingUseCase({
      runPosCheckoutUseCase,
      recordAuditEventUseCase: createRecordAuditEventUseCase() as never,
    });

    const result = await useCase.execute({
      sale: buildSale({
        workflowStatus: PosSaleWorkflowStatus.Posted,
      }),
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe(PosErrorType.UnsupportedOperation);
    }
    expect(runPosCheckoutUseCase.execute).not.toHaveBeenCalled();
  });

  it("rejects missing sale ID", async () => {
    const runPosCheckoutUseCase: RunPosCheckoutUseCase = {
      execute: vi.fn(),
    };

    const useCase = createRetryPosSalePostingUseCase({
      runPosCheckoutUseCase,
      recordAuditEventUseCase: createRecordAuditEventUseCase() as never,
    });

    const result = await useCase.execute({
      sale: buildSale({
        remoteId: "   ",
      }),
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe(PosErrorType.Validation);
      expect(result.error.message).toContain("POS sale id is required");
    }
    expect(runPosCheckoutUseCase.execute).not.toHaveBeenCalled();
  });

  it("rejects due sale with missing customer snapshot", async () => {
    const runPosCheckoutUseCase: RunPosCheckoutUseCase = {
      execute: vi.fn(),
    };

    const useCase = createRetryPosSalePostingUseCase({
      runPosCheckoutUseCase,
      recordAuditEventUseCase: createRecordAuditEventUseCase() as never,
    });

    const result = await useCase.execute({
      sale: buildSale({
        totalsSnapshot: {
          itemCount: 1,
          gross: 100,
          discountAmount: 0,
          surchargeAmount: 0,
          taxAmount: 0,
          grandTotal: 100,
        },
        paymentParts: [
          {
            paymentPartId: "part-1",
            payerLabel: null,
            amount: 60,
            settlementAccountRemoteId: "money-cash-1",
          },
        ],
        customerRemoteId: null,
        customerNameSnapshot: null,
      }),
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe(PosErrorType.Validation);
      expect(result.error.message).toContain("customer snapshot");
    }
    expect(runPosCheckoutUseCase.execute).not.toHaveBeenCalled();
  });

  it("calls runPosCheckoutUseCase.execute with persisted sale snapshot", async () => {
    const runPosCheckoutUseCase: RunPosCheckoutUseCase = {
      execute: vi.fn(async () => ({
        success: true as const,
        value: {
          workflowStatus: PosSaleWorkflowStatus.Posted,
          receipt: null,
          billingDocumentRemoteId: "doc-1",
          ledgerEntryRemoteId: null,
          postedTransactionRemoteIds: ["txn-1"],
        },
      })),
    };

    const useCase = createRetryPosSalePostingUseCase({
      runPosCheckoutUseCase,
      recordAuditEventUseCase: createRecordAuditEventUseCase() as never,
    });

    const sale = buildSale({
      customerRemoteId: "customer-1",
      customerNameSnapshot: "John Doe",
      customerPhoneSnapshot: "9800000000",
      totalsSnapshot: {
        itemCount: 1,
        gross: 100,
        discountAmount: 0,
        surchargeAmount: 0,
        taxAmount: 0,
        grandTotal: 100,
      },
      paymentParts: [
        {
          paymentPartId: "part-1",
          payerLabel: null,
          amount: 70,
          settlementAccountRemoteId: "money-cash-1",
        },
      ],
    });

    const result = await useCase.execute({ sale });

    expect(result.success).toBe(true);
    expect(runPosCheckoutUseCase.execute).toHaveBeenCalledTimes(1);
    expect(runPosCheckoutUseCase.execute).toHaveBeenCalledWith({
      idempotencyKey: "idem-1",
      paymentParts: sale.paymentParts,
      selectedCustomer: {
        remoteId: "customer-1",
        fullName: "John Doe",
        phone: "9800000000",
        address: null,
      },
      grandTotalSnapshot: 100,
      cartLinesSnapshot: sale.cartLinesSnapshot,
      totalsSnapshot: sale.totalsSnapshot,
      activeBusinessAccountRemoteId: "business-1",
      activeOwnerUserRemoteId: "owner-1",
      activeAccountCurrencyCode: "NPR",
      activeAccountCountryCode: "NP",
    });
  });

  it("maps checkout failure to POS error", async () => {
    const runPosCheckoutUseCase: RunPosCheckoutUseCase = {
      execute: vi.fn(async () => ({
        success: false as const,
        error: {
          type: "CONTEXT_REQUIRED" as const,
          message: "Context missing.",
        },
      })),
    };

    const useCase = createRetryPosSalePostingUseCase({
      runPosCheckoutUseCase,
      recordAuditEventUseCase: createRecordAuditEventUseCase() as never,
    });

    const result = await useCase.execute({
      sale: buildSale(),
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe(PosErrorType.ContextRequired);
      expect(result.error.message).toBe("Context missing.");
    }
  });
});
