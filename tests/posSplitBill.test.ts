import type { DeleteBillingDocumentUseCase } from "@/feature/billing/useCase/deleteBillingDocument.useCase";
import type { SaveBillingDocumentUseCase } from "@/feature/billing/useCase/saveBillingDocument.useCase";
import type { AddLedgerEntryUseCase } from "@/feature/ledger/useCase/addLedgerEntry.useCase";
import type { DeleteLedgerEntryUseCase } from "@/feature/ledger/useCase/deleteLedgerEntry.useCase";
import type { PosCartLine, PosTotals } from "@/feature/pos/types/pos.entity.types";
import type { CreatePosSaleDraftUseCase } from "@/feature/pos/useCase/createPosSaleDraft.useCase";
import type { UpdatePosSaleWorkflowStateUseCase } from "@/feature/pos/useCase/updatePosSaleWorkflowState.useCase";
import type { PosSaleRecord } from "@/feature/pos/types/posSale.entity.types";
import type { CommitPosSaleInventoryMutationsUseCase } from "@/feature/pos/useCase/commitPosSaleInventoryMutations.useCase";
import type { PosCheckoutRepository } from "@/feature/pos/workflow/posCheckout/repository/posCheckout.repository";
import {
  PosCheckoutWorkflowStatus,
} from "@/feature/pos/workflow/posCheckout/types/posCheckout.state.types";
import type { RunPosCheckoutParams } from "@/feature/pos/workflow/posCheckout/types/posCheckout.types";
import { createRunPosCheckoutUseCase } from "@/feature/pos/workflow/posCheckout/useCase/runPosCheckout.useCase.impl";
import type { DeleteBusinessTransactionUseCase } from "@/feature/transactions/useCase/deleteBusinessTransaction.useCase";
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

const createRunParams = (
  overrides: Partial<RunPosCheckoutParams> = {},
): RunPosCheckoutParams => ({
  idempotencyKey: "idem-split-1",
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

const createCheckoutHarness = () => {
  let saleState: PosSaleRecord | null = null;
  let postedTransactionCount = 0;

  const getSaleByIdempotencyKey: PosCheckoutRepository["getSaleByIdempotencyKey"] = vi.fn(
    async () => ({
      success: true as const,
      value: null,
    }),
  );

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
    execute: vi.fn(async () => ({
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

  const commitPosSaleInventoryMutationsUseCase: CommitPosSaleInventoryMutationsUseCase = {
    execute: vi.fn(async () => ({
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
    deleteBillingDocumentUseCase,
    postBusinessTransactionUseCase,
    deleteBusinessTransactionUseCase,
    addLedgerEntryUseCase,
    deleteLedgerEntryUseCase,
    commitPosSaleInventoryMutationsUseCase,
  });

  return {
    useCase,
    spies: {
      postBusinessTransactionExecute: postBusinessTransactionUseCase.execute,
      addLedgerEntryExecute: addLedgerEntryUseCase.execute,
      commitInventoryExecute: commitPosSaleInventoryMutationsUseCase.execute,
    },
  };
};

describe("POS split payment checkout", () => {
  it("handles one payment part", async () => {
    const { useCase, spies } = createCheckoutHarness();

    const result = await useCase.execute(createRunParams());

    expect(result.success).toBe(true);
    expect(spies.postBusinessTransactionExecute).toHaveBeenCalledTimes(1);
    expect(spies.addLedgerEntryExecute).not.toHaveBeenCalled();
  });

  it("handles multiple payment parts", async () => {
    const { useCase, spies } = createCheckoutHarness();

    const result = await useCase.execute(
      createRunParams({
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
      }),
    );

    expect(result.success).toBe(true);
    expect(spies.postBusinessTransactionExecute).toHaveBeenCalledTimes(3);

    if (result.success) {
      expect(result.value.workflowStatus).toBe(PosCheckoutWorkflowStatus.Posted);
      expect(result.value.postedTransactionRemoteIds).toHaveLength(3);
    }
  });

  it("requires settlement account for each paid part", async () => {
    const { useCase, spies } = createCheckoutHarness();

    const result = await useCase.execute(
      createRunParams({
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
    expect(spies.postBusinessTransactionExecute).not.toHaveBeenCalled();
  });

  it("requires customer when split payments leave remaining due", async () => {
    const { useCase, spies } = createCheckoutHarness();

    const result = await useCase.execute(
      createRunParams({
        paymentParts: [
          {
            paymentPartId: "part-1",
            payerLabel: "Alice",
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

  it("returns receipt payment breakdown from split parts", async () => {
    const { useCase } = createCheckoutHarness();

    const paymentParts = [
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
    ] as const;

    const result = await useCase.execute(
      createRunParams({
        paymentParts,
      }),
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.receipt?.paymentParts).toEqual([
        {
          paymentPartId: "part-1",
          payerLabel: "Alice",
          amount: 400,
          settlementAccountRemoteId: "money-cash-1",
          settlementAccountLabel: null,
        },
        {
          paymentPartId: "part-2",
          payerLabel: "Bob",
          amount: 350,
          settlementAccountRemoteId: "money-bank-1",
          settlementAccountLabel: null,
        },
        {
          paymentPartId: "part-3",
          payerLabel: "Charlie",
          amount: 380,
          settlementAccountRemoteId: "money-wallet-1",
          settlementAccountLabel: null,
        },
      ]);
    }
  });
});
