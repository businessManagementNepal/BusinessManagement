import {
  PosBootstrap,
  PosCartLine,
  PosProduct,
  PosReceipt,
  PosTotals,
} from "../../types/pos.entity.types";
import {
  PosApplyAmountAdjustmentParams,
  PosAssignProductToSlotParams,
  PosChangeQuantityParams,
  PosCompletePaymentParams,
  PosLoadBootstrapParams,
  PosRemoveSlotProductParams,
} from "../../types/pos.dto.types";
import {
  PosBootstrapResult,
  PosCartLinesResult,
  PosOperationResult,
  PosPaymentResult,
  PosTotalsResult,
} from "../../types/pos.error.types";

export interface PosDatasource {
  loadBootstrap(params: PosLoadBootstrapParams): Promise<PosBootstrapResult>;
  searchProducts(searchTerm: string): Promise<readonly PosProduct[]>;
  assignProductToSlot(
    params: PosAssignProductToSlotParams,
  ): Promise<PosCartLinesResult>;
  removeProductFromSlot(
    params: PosRemoveSlotProductParams,
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
  getSlots(): Promise<PosBootstrap["slots"]>;
  getCartLines(): Promise<readonly PosCartLine[]>;
  getTotals(): Promise<PosTotalsResult>;
  completePayment(
    params: PosCompletePaymentParams,
  ): Promise<PosPaymentResult>;
  printReceipt(receipt: PosReceipt): Promise<PosOperationResult>;
}
