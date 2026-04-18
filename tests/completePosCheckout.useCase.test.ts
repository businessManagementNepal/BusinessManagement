import type { SaveBillingDocumentUseCase } from "@/feature/billing/useCase/saveBillingDocument.useCase";
import type { AddLedgerEntryUseCase } from "@/feature/ledger/useCase/addLedgerEntry.useCase";
import type { CreatePosSaleDraftUseCase } from "@/feature/pos/useCase/createPosSaleDraft.useCase";
import type { UpdatePosSaleWorkflowStateUseCase } from "@/feature/pos/useCase/updatePosSaleWorkflowState.useCase";
import type { PosSaleRecord } from "@/feature/pos/types/posSale.entity.types";
import type { CommitPosSaleInventoryMutationsUseCase } from "@/feature/pos/useCase/commitPosSaleInventoryMutations.useCase";
import type { PosCustomer, PosTotals, PosCartLine } from "@/feature/pos/types/pos.entity.types";
import type { PosCheckoutRepository } from "@/feature/pos/workflow/posCheckout/repository/posCheckout.repository";
import {
  PosCheckoutWorkflowStatus,
} from "@/feature/pos/workflow/posCheckout/types/posCheckout.state.types";
import type { RunPosCheckoutParams } from "@/feature/pos/workflow/posCheckout/types/posCheckout.types";
import { createRunPosCheckoutUseCase } from "@/feature/pos/workflow/posCheckout/useCase/runPosCheckout.useCase.impl";
import type { PostBusinessTransactionUseCase } from "@/feature/transactions/useCase/postBusinessTransaction.useCase";
import { describe, expect, it, vi } from "vitest";

const BASE_TOTALS: PosTotals = {
  itemCount: 1,
  gross: 1000,
  discountAmount: 0,
  surchargeAmount: 0,
  taxAmount: 130,
  grandTotal: 1130,
};

const BASE_CART_LINES: readonly PosCartLine[] = [
  {
    lineId: "line-1",
    productId: "product-1",
    productName: "Test Product",
    categoryLabel: "General",
    shortCode: "TP",
    quantity: 1,
    unitPrice: 1000,
    taxRate: 0.13,
    lineSubtotal: 1000,
  },
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

type HarnessOptions = {
  getSaleByIdempotencyKey?: PosCheckoutRepository["getSaleByIdempotencyKey"];
  commitInventoryExecute?: CommitPosSaleInventoryMutationsUseCase["execute"];
  addLedgerEntryExecute?: AddLedgerEntryUseCase["execute"];
  verifyLinkedDocument?: AddLedgerEntryUseCase["verifyLinkedDocument"];
  postBusinessTransactionExecute?: PostBusinessTransactionUseCase["execute"];
  saveBillingDocumentExecute?: SaveBillingDocumentUseCase["execute"];
};

const createCheckoutHarness = (options: HarnessOptions = {}) => {
  let postedTransactionCount = 0;
  let saleState: PosSaleRecord | null = null;

  const getSaleByIdempotencyKey: PosCheckoutRepository["getSaleByIdempotencyKey"] =
    options.getSaleByIdempotencyKey ??
    vi.fn(async () => ({
      success: true as const,
      value: null,
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

  const commitPosSaleInventoryMutationsUseCase: CommitPosSaleInventoryMutationsUseCase = {
    execute:
      options.commitInventoryExecute ??
      vi.fn(async () => ({
        success: true as const,
        value: true,
      })),
  };

  const useCase = createRunPosCheckoutUseCase({
    posCheckoutRepository: {
      getSaleByIdempotencyKey,
    },
    createPosSaleDraftUseCase,
    updatePosSaleWorkflowStateUseCase,
    saveBillingDocumentUseCase,
    postBusinessTransactionUseCase,
    addLedgerEntryUseCase,
    commitPosSaleInventoryMutationsUseCase,
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
      commitInventoryExecute: commitPosSaleInventoryMutationsUseCase.execute,
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

  it("marks checkout as partially posted when ledger linkage verification fails", async () => {
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
      expect(result.value.workflowStatus).toBe(
        PosCheckoutWorkflowStatus.PartiallyPosted,
      );
      expect(result.value.receipt?.ledgerEffect.type).toBe(
        "due_balance_create_failed",
      );
      expect(result.value.ledgerEntryRemoteId).toBeTruthy();
    }
  });
});
