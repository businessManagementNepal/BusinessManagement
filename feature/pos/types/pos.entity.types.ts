export type PosProduct = {
  id: string;
  name: string;
  categoryLabel: string;
  unitLabel: string | null;
  price: number;
  taxRate: number;
  shortCode: string;
};

export type PosSlot = {
  slotId: string;
  assignedProductId: string | null;
};

export type PosCartLine = {
  lineId: string;
  slotId: string;
  productId: string;
  productName: string;
  categoryLabel: string;
  shortCode: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  lineSubtotal: number;
};

export type PosTotals = {
  itemCount: number;
  gross: number;
  discountAmount: number;
  surchargeAmount: number;
  taxAmount: number;
  grandTotal: number;
};

export type PosLedgerEffect = {
  type:
    | "none"
    | "due_balance_pending"
    | "due_balance_created"
    | "due_balance_create_failed"
    | "posting_sync_failed";
  dueAmount: number;
  accountRemoteId: string | null;
};

export type PosReceipt = {
  receiptNumber: string;
  issuedAt: string;
  lines: readonly PosCartLine[];
  totals: PosTotals;
  paidAmount: number;
  dueAmount: number;
  ledgerEffect: PosLedgerEffect;
};

export type PosBootstrap = {
  products: readonly PosProduct[];
  slots: readonly PosSlot[];
  activeBusinessAccountRemoteId: string | null;
  activeOwnerUserRemoteId: string | null;
  activeSettlementAccountRemoteId: string | null;
};
