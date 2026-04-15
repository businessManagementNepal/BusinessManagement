import { PosCartLine, PosCustomer, PosProduct } from "./pos.entity.types";

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

export type PosAddProductToCartParams = {
  productId: string;
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

export type PosSaveSessionParams = {
  businessAccountRemoteId: string;
  sessionData: {
    cartLines: readonly PosCartLine[];
    recentProducts: readonly PosProduct[];
    productSearchTerm: string;
    selectedCustomer: PosCustomer | null;
    selectedSettlementAccountRemoteId?: string;
    discountInput: string;
    surchargeInput: string;
  };
};

export type PosLoadSessionParams = {
  businessAccountRemoteId: string;
};

export type PosClearSessionParams = {
  businessAccountRemoteId: string;
};

export type PosSessionData = {
  cartLines: readonly PosCartLine[];
  recentProducts: readonly PosProduct[];
  productSearchTerm: string;
  selectedCustomer: PosCustomer | null;
  selectedSettlementAccountRemoteId?: string;
  discountInput: string;
  surchargeInput: string;
};

export type PosSessionResult = {
  success: boolean;
  value?: PosSessionData;
  error?: {
    type: string;
    message: string;
  };
};
