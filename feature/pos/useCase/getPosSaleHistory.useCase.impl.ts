import {
    type BillingDocument,
    BillingDocumentStatus,
    BillingDocumentType,
    BillingTemplateType,
} from "@/feature/billing/types/billing.types";
import { PosErrorType } from "../types/pos.error.types";
import type { PosReceipt } from "../types/pos.entity.types";
import type { PosSaleRecord } from "../types/posSale.entity.types";
import type { PosSaleHistoryItem } from "../types/posSaleHistory.entity.types";
import type { GetPosSaleHistoryUseCase } from "./getPosSaleHistory.useCase";
import type { GetPosSalesUseCase } from "./getPosSales.useCase";

interface CreateGetPosSaleHistoryUseCaseParams {
  getPosSalesUseCase: GetPosSalesUseCase;
}

const getTodayStartTimestamp = (): number => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};

const parseIssuedAt = (sale: PosSaleRecord): number => {
  const isoValue = sale.receipt?.issuedAt;
  if (!isoValue) {
    return sale.updatedAt;
  }

  const parsed = new Date(isoValue).getTime();
  if (!Number.isFinite(parsed)) {
    return sale.updatedAt;
  }

  return parsed;
};

const computeAdjustedSubtotal = (sale: PosSaleRecord): number =>
  Number(
    Math.max(
      sale.totalsSnapshot.gross -
        sale.totalsSnapshot.discountAmount +
        sale.totalsSnapshot.surchargeAmount,
      0,
    ).toFixed(2),
  );

const computePaidAndDueAmounts = (
  sale: PosSaleRecord,
): {
  paidAmount: number;
  dueAmount: number;
} => {
  if (sale.receipt) {
    return {
      paidAmount: Number(sale.receipt.paidAmount.toFixed(2)),
      dueAmount: Number(sale.receipt.dueAmount.toFixed(2)),
    };
  }

  const paidAmount = Number(
    sale.paymentParts.reduce((sum, part) => sum + part.amount, 0).toFixed(2),
  );
  const dueAmount = Number(
    Math.max(sale.totalsSnapshot.grandTotal - paidAmount, 0).toFixed(2),
  );
  return { paidAmount, dueAmount };
};

const mapStatusFromSale = (sale: PosSaleRecord): BillingDocument["status"] => {
  const { paidAmount, dueAmount } = computePaidAndDueAmounts(sale);

  if (dueAmount <= 0) {
    return BillingDocumentStatus.Paid;
  }

  if (paidAmount > 0) {
    return BillingDocumentStatus.PartiallyPaid;
  }

  if (sale.workflowStatus === "failed") {
    return BillingDocumentStatus.Pending;
  }

  return BillingDocumentStatus.Pending;
};

const mapPosSaleToBillingDocument = (sale: PosSaleRecord): BillingDocument => {
  const issuedAt = parseIssuedAt(sale);
  const subtotalAmount = computeAdjustedSubtotal(sale);
  const taxAmount = Number(sale.totalsSnapshot.taxAmount.toFixed(2));
  const totalAmount = Number(sale.totalsSnapshot.grandTotal.toFixed(2));
  const taxRatePercent =
    subtotalAmount > 0
      ? Number(((taxAmount / subtotalAmount) * 100).toFixed(6))
      : 0;
  const { paidAmount, dueAmount } = computePaidAndDueAmounts(sale);
  const status = mapStatusFromSale(sale);
  const lineSource = sale.receipt?.lines ?? sale.cartLinesSnapshot;
  const items = lineSource.map((line, index) => ({
    remoteId: `${sale.remoteId}-line-${index + 1}`,
    itemName: line.productName,
    quantity: line.quantity,
    unitRate: line.unitPrice,
    lineTotal: Number((line.quantity * line.unitPrice).toFixed(2)),
    lineOrder: index,
  }));

  return {
    remoteId: sale.billingDocumentRemoteId ?? sale.remoteId,
    accountRemoteId: sale.businessAccountRemoteId,
    documentNumber: sale.receiptNumber,
    documentType: BillingDocumentType.Receipt,
    templateType: BillingTemplateType.PosReceipt,
    customerName: sale.customerNameSnapshot ?? "Walk-in Customer",
    contactRemoteId: sale.customerRemoteId,
    status,
    taxRatePercent,
    notes: null,
    subtotalAmount,
    taxAmount,
    totalAmount,
    paidAmount,
    outstandingAmount: dueAmount,
    isOverdue: false,
    issuedAt,
    dueAt: dueAmount > 0 ? getTodayStartTimestamp() : null,
    sourceModule: "pos",
    sourceRemoteId: sale.receiptNumber,
    linkedLedgerEntryRemoteId: sale.ledgerEntryRemoteId,
    items,
    createdAt: sale.createdAt,
    updatedAt: sale.updatedAt,
  };
};

const mapPosSaleToReceipt = (sale: PosSaleRecord): PosReceipt => {
  if (sale.receipt) {
    return sale.receipt;
  }

  const issuedAt = parseIssuedAt(sale);
  const { paidAmount, dueAmount } = computePaidAndDueAmounts(sale);

  return {
    receiptNumber: sale.receiptNumber,
    issuedAt: new Date(issuedAt).toISOString(),
    lines: sale.cartLinesSnapshot.map((line) => ({ ...line })),
    totals: {
      ...sale.totalsSnapshot,
    },
    paidAmount,
    dueAmount,
    paymentParts: sale.paymentParts.map((part) => ({
      paymentPartId: part.paymentPartId,
      payerLabel: part.payerLabel,
      amount: Number(part.amount.toFixed(2)),
      settlementAccountRemoteId: part.settlementAccountRemoteId,
      settlementAccountLabel: null,
    })),
    ledgerEffect:
      dueAmount > 0
        ? {
            type: sale.ledgerEntryRemoteId
              ? "due_balance_created"
              : "due_balance_pending",
            dueAmount,
            accountRemoteId: null,
          }
        : {
            type: "none",
            dueAmount: 0,
            accountRemoteId: null,
          },
    customerName: sale.customerNameSnapshot ?? "Walk-in Customer",
    customerPhone: sale.customerPhoneSnapshot ?? null,
    contactRemoteId: sale.customerRemoteId,
  };
};

const mapPosSaleToHistoryItem = (sale: PosSaleRecord): PosSaleHistoryItem => ({
  sale,
  document: mapPosSaleToBillingDocument(sale),
  receipt: mapPosSaleToReceipt(sale),
  workflowStatus: sale.workflowStatus,
  lastErrorMessage: sale.lastErrorMessage,
});

export const createGetPosSaleHistoryUseCase = ({
  getPosSalesUseCase,
}: CreateGetPosSaleHistoryUseCaseParams): GetPosSaleHistoryUseCase => ({
  async execute(params) {
    const accountRemoteId = params.accountRemoteId.trim();

    if (!accountRemoteId) {
      return {
        success: false,
        error: {
          type: PosErrorType.ContextRequired,
          message: "Account context is required to load POS sale history.",
        },
      };
    }

    const result = await getPosSalesUseCase.execute({
      businessAccountRemoteId: accountRemoteId,
    });

    if (!result.success) {
      return {
        success: false,
        error: {
          type: PosErrorType.Unknown,
          message: result.error.message,
        },
      };
    }

    const normalizedSearch = params.searchTerm?.trim().toLowerCase() ?? "";

    const receipts = result.value
      .map(mapPosSaleToHistoryItem)
      .filter((item) => {
        if (!normalizedSearch) {
          return true;
        }

        const customerName = item.document.customerName.toLowerCase();
        const documentNumber = item.document.documentNumber.toLowerCase();
        return (
          customerName.includes(normalizedSearch) ||
          documentNumber.includes(normalizedSearch)
        );
      })
      .sort((left, right) => right.document.issuedAt - left.document.issuedAt);

    return {
      success: true,
      value: receipts,
    };
  },
});
