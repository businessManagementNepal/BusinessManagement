import type { DeleteBillingDocumentUseCase } from "@/feature/billing/useCase/deleteBillingDocument.useCase";
import type { SaveBillingDocumentUseCase } from "@/feature/billing/useCase/saveBillingDocument.useCase";
import type { AddLedgerEntryUseCase } from "@/feature/ledger/useCase/addLedgerEntry.useCase";
import type { DeleteLedgerEntryUseCase } from "@/feature/ledger/useCase/deleteLedgerEntry.useCase";
import type { RecordAuditEventUseCase } from "@/feature/audit/useCase/recordAuditEvent.useCase";
import {
  AuditModule,
  AuditOutcome,
  AuditSeverity,
  type AuditEvent,
} from "@/feature/audit/types/audit.entity.types";
import type { CreatePosSaleDraftUseCase } from "@/feature/pos/useCase/createPosSaleDraft.useCase";
import type { UpdatePosSaleWorkflowStateUseCase } from "@/feature/pos/useCase/updatePosSaleWorkflowState.useCase";
import type { PosSaleRecord } from "@/feature/pos/types/posSale.entity.types";
import { ProductKind } from "@/feature/products/types/product.types";
import type { CommitPosCheckoutInventoryUseCase } from "@/feature/pos/workflow/posCheckout/useCase/commitPosCheckoutInventory.useCase";
import type {
  PosCartLine,
  PosCustomer,
  PosReceipt,
  PosTotals,
} from "@/feature/pos/types/pos.entity.types";
import type { PosCheckoutRepository } from "@/feature/pos/workflow/posCheckout/repository/posCheckout.repository";
import { PosCheckoutWorkflowStatus } from "@/feature/pos/workflow/posCheckout/types/posCheckout.state.types";
import type { RunPosCheckoutParams } from "@/feature/pos/workflow/posCheckout/types/posCheckout.types";
import { createRunPosCheckoutUseCase } from "@/feature/pos/workflow/posCheckout/useCase/runPosCheckout.useCase.impl";
import type { DeleteBusinessTransactionUseCase } from "@/feature/transactions/useCase/deleteBusinessTransaction.useCase";
import type { PostBusinessTransactionUseCase } from "@/feature/transactions/useCase/postBusinessTransaction.useCase";
import { buildPosCartLine, buildPosTotals } from "./posTestBuilders";
import { vi } from "vitest";

export const BASE_TOTALS: PosTotals = buildPosTotals({
  itemCount: 1,
  gross: 1000,
  taxAmount: 130,
  grandTotal: 1130,
});

export const BASE_CART_LINES: readonly PosCartLine[] = [
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

export const CUSTOMER: PosCustomer = {
  remoteId: "customer-1",
  fullName: "John Doe",
  phone: "+1234567890",
  address: null,
};

const buildAuditEvent = (): AuditEvent => ({
  remoteId: "audit-1",
  accountRemoteId: "business-1",
  ownerUserRemoteId: "user-1",
  actorUserRemoteId: "user-1",
  module: AuditModule.Pos,
  action: "pos_checkout_posted",
  sourceModule: "pos",
  sourceRemoteId: "sale-1",
  sourceAction: "checkout",
  outcome: AuditOutcome.Success,
  severity: AuditSeverity.Info,
  summary: "POS checkout audit test event.",
  metadataJson: null,
  createdAt: 1,
  syncStatus: "pending",
  lastSyncedAt: null,
  deletedAt: null,
});

export const createRunParams = (
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

export const buildReceiptSnapshot = ({
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

export const createSaleRecord = (
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
  recordAuditEventExecute?: RecordAuditEventUseCase["execute"];
  deleteBillingDocumentExecute?: DeleteBillingDocumentUseCase["execute"];
  deleteBusinessTransactionExecute?: DeleteBusinessTransactionUseCase["execute"];
  deleteLedgerEntryExecute?: DeleteLedgerEntryUseCase["execute"];
};

export const createCheckoutHarness = (options: HarnessOptions = {}) => {
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
    execute:
      options.deleteBillingDocumentExecute ??
      vi.fn(async () => ({
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
    execute:
      options.deleteBusinessTransactionExecute ??
      vi.fn(async () => ({
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
    execute:
      options.deleteLedgerEntryExecute ??
      vi.fn(async () => ({
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

  const recordAuditEventUseCase: RecordAuditEventUseCase = {
    execute:
      options.recordAuditEventExecute ??
      vi.fn(async () => ({
        success: true as const,
        value: buildAuditEvent(),
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
    getSaleState: () => saleState,
    spies: {
      getSaleByIdempotencyKey,
      createPosSaleDraftExecute: createPosSaleDraftUseCase.execute,
      updateWorkflowExecute: updatePosSaleWorkflowStateUseCase.execute,
      saveBillingDocumentExecute: saveBillingDocumentUseCase.execute,
      deleteBillingDocumentExecute: deleteBillingDocumentUseCase.execute,
      postBusinessTransactionExecute: postBusinessTransactionUseCase.execute,
      deleteBusinessTransactionExecute: deleteBusinessTransactionUseCase.execute,
      addLedgerEntryExecute: addLedgerEntryUseCase.execute,
      deleteLedgerEntryExecute: deleteLedgerEntryUseCase.execute,
      verifyLinkedDocument: addLedgerEntryUseCase.verifyLinkedDocument,
      commitInventoryExecute: commitPosCheckoutInventoryUseCase.execute,
      recordAuditEventExecute: recordAuditEventUseCase.execute,
    },
  };
};
