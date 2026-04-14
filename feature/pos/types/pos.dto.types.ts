import { PosCustomer } from "./pos.entity.types";

export type PosLoadBootstrapParams = {
  activeBusinessAccountRemoteId: string | null;
  activeOwnerUserRemoteId: string | null;
  activeSettlementAccountRemoteId: string | null;
};

export type PosAssignProductToSlotParams = {
  slotId: string;
  productId: string;
  addToCart: boolean;
};

export type PosRemoveSlotProductParams = {
  slotId: string;
};

export type PosChangeQuantityParams = {
  lineId: string;
  nextQuantity: number;
};

export type PosApplyAmountAdjustmentParams = {
  amount: number;
};

export type PosCompletePaymentParams = {
  paidAmount: number;
  activeSettlementAccountRemoteId: string | null;
  selectedCustomer: PosCustomer | null;
  grandTotalSnapshot: number;
};
