import type {
    PosCartLine,
    PosCustomer,
    PosProduct,
    PosSplitDraftPart,
} from "./pos.entity.types";

export type PosLoadBootstrapParams = {
  activeBusinessAccountRemoteId: string | null;
  activeOwnerUserRemoteId: string | null;
  activeSettlementAccountRemoteId: string | null;
};

export type PosAddProductToCartParams = {
  productId: string;
};

export type PosChangeQuantityParams = {
  lineId: string;
  nextQuantity: number;
};

export type PosApplyAmountAdjustmentParams = {
  amount: number;
};

export type PosPaymentPartInput = {
  paymentPartId: string;
  payerLabel: string | null;
  amount: number;
  settlementAccountRemoteId: string;
};

export type PosCompletePaymentParams = {
  paymentParts: readonly PosPaymentPartInput[];
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
    splitBillDraftParts?: readonly PosSplitDraftPart[];
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
  splitBillDraftParts?: readonly PosSplitDraftPart[];
};

export type PosSessionResult = {
  success: boolean;
  value?: PosSessionData;
  error?: {
    type: string;
    message: string;
  };
};
