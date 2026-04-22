import { ProductKind } from "@/feature/products/types/product.types";
import type {
  PosCartLine,
  PosProduct,
  PosReceipt,
  PosTotals,
} from "@/feature/pos/types/pos.entity.types";

export const buildPosProduct = (
  overrides: Partial<PosProduct> = {},
): PosProduct => ({
  id: "product-1",
  name: "Rice",
  categoryLabel: "General",
  unitLabel: "pcs",
  kind: ProductKind.Item,
  price: 100,
  taxRate: 0,
  shortCode: "R",
  ...overrides,
});

export const buildPosCartLine = (
  overrides: Partial<PosCartLine> = {},
): PosCartLine => ({
  lineId: "line-1",
  productId: "product-1",
  productName: "Rice",
  categoryLabel: "General",
  shortCode: "R",
  kind: ProductKind.Item,
  quantity: 1,
  unitPrice: 100,
  taxRate: 0,
  lineSubtotal: 100,
  ...overrides,
});

export const buildPosTotals = (
  overrides: Partial<PosTotals> = {},
): PosTotals => ({
  itemCount: 1,
  gross: 100,
  discountAmount: 0,
  surchargeAmount: 0,
  taxAmount: 0,
  grandTotal: 100,
  ...overrides,
});

export const buildPosReceipt = (
  overrides: Partial<PosReceipt> = {},
): PosReceipt => ({
  receiptNumber: "RCPT-001",
  issuedAt: new Date("2026-01-01T10:00:00.000Z").toISOString(),
  lines: [buildPosCartLine()],
  totals: buildPosTotals(),
  paidAmount: 100,
  dueAmount: 0,
  paymentParts: [],
  ledgerEffect: {
    type: "none",
    dueAmount: 0,
    accountRemoteId: null,
  },
  customerName: null,
  customerPhone: null,
  contactRemoteId: null,
  ...overrides,
});
