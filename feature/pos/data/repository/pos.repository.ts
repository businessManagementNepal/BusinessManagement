import {
    PosApplyAmountAdjustmentParams,
    PosAssignProductToSlotParams,
    PosChangeQuantityParams,
    PosCompletePaymentParams,
    PosLoadBootstrapParams,
    PosRemoveSlotProductParams,
} from "../../types/pos.dto.types";
import {
    PosCartLine,
    PosProduct,
    PosReceipt,
    PosSlot,
} from "../../types/pos.entity.types";
import {
    PosBootstrapResult,
    PosCartLinesResult,
    PosOperationResult,
    PosPaymentResult,
    PosTotalsResult,
} from "../../types/pos.error.types";

export interface PosRepository {
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
  getSlots(): Promise<readonly PosSlot[]>;
  getCartLines(): Promise<readonly PosCartLine[]>;
  getTotals(): Promise<PosTotalsResult>;
  completePayment(
    params: PosCompletePaymentParams & { selectedCustomer: any },
  ): Promise<PosPaymentResult>;
  printReceipt(receipt: PosReceipt): Promise<PosOperationResult>;
}
