import {
    PosAddProductToCartParams,
    PosApplyAmountAdjustmentParams,
    PosChangeQuantityParams,
    PosClearSessionParams,
    PosCompletePaymentParams,
    PosLoadBootstrapParams,
    PosLoadSessionParams,
    PosSaveSessionParams,
    PosSessionResult,
} from "../../types/pos.dto.types";
import {
    PosCartLine,
    PosProduct
} from "../../types/pos.entity.types";
import {
    PosBootstrapResult,
    PosCartLinesResult,
    PosOperationResult,
    PosPaymentResult,
    PosTotalsResult
} from "../../types/pos.error.types";

export interface PosDatasource {
  loadBootstrap(params: PosLoadBootstrapParams): Promise<PosBootstrapResult>;
  searchProducts(searchTerm: string): Promise<readonly PosProduct[]>;
  addProductToCart(
    params: PosAddProductToCartParams,
  ): Promise<PosCartLinesResult>;
  changeCartLineQuantity(
    params: PosChangeQuantityParams,
  ): Promise<PosCartLinesResult>;
  applyDiscount(
    params: PosApplyAmountAdjustmentParams,
  ): Promise<PosTotalsResult>;
  applySurcharge(
    params: PosApplyAmountAdjustmentParams,
  ): Promise<PosTotalsResult>;
  clearCart(): Promise<PosOperationResult>;
  getCartLines(): Promise<readonly PosCartLine[]>;
  getTotals(): Promise<PosTotalsResult>;
  completePayment(
    params: PosCompletePaymentParams,
  ): Promise<PosPaymentResult>;
  saveSession(params: PosSaveSessionParams): Promise<PosOperationResult>;
  loadSession(params: PosLoadSessionParams): Promise<PosSessionResult>;
  clearSession(params: PosClearSessionParams): Promise<PosOperationResult>;
}
