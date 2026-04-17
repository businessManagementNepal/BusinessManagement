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
} from "../../types/pos.entity.types";
import {
    PosBootstrapResult,
    PosCartLinesResult,
    PosError,
    PosOperationResult,
    PosPaymentResult,
    PosTotalsResult
} from "../../types/pos.error.types";
import { PosDatasource } from "../dataSource/pos.datasource";
import {
    mapPosBootstrapToDomain,
    mapPosCartLinesToDomain,
    mapPosProductToDomain,
    mapPosReceiptToDomain,
    mapPosTotalsToDomain,
} from "./mapper/pos.mapper";
import { PosRepository } from "./pos.repository";

const mapRepositoryError = (error: PosError): PosError => ({ ...error });

export const createPosRepository = (
  datasource: PosDatasource,
): PosRepository => ({
  async loadBootstrap(params: PosLoadBootstrapParams): Promise<PosBootstrapResult> {
    const result = await datasource.loadBootstrap(params);
    if (!result.success) {
      return { success: false, error: mapRepositoryError(result.error) };
    }

    return { success: true, value: mapPosBootstrapToDomain(result.value) };
  },

  async searchProducts(searchTerm: string) {
    const result = await datasource.searchProducts(searchTerm);
    return result.map(mapPosProductToDomain);
  },

  async addProductToCart(
    params: PosAddProductToCartParams,
  ): Promise<PosCartLinesResult> {
    const result = await datasource.addProductToCart(params);
    if (!result.success) {
      return { success: false, error: mapRepositoryError(result.error) };
    }

    return { success: true, value: mapPosCartLinesToDomain(result.value) };
  },

  async changeCartLineQuantity(
    params: PosChangeQuantityParams,
  ): Promise<PosCartLinesResult> {
    const result = await datasource.changeCartLineQuantity(params);
    if (!result.success) {
      return { success: false, error: mapRepositoryError(result.error) };
    }

    return { success: true, value: mapPosCartLinesToDomain(result.value) };
  },

  async applyDiscount(
    params: PosApplyAmountAdjustmentParams,
  ): Promise<PosTotalsResult> {
    const result = await datasource.applyDiscount(params);
    if (!result.success) {
      return { success: false, error: mapRepositoryError(result.error) };
    }

    return { success: true, value: mapPosTotalsToDomain(result.value) };
  },

  async applySurcharge(
    params: PosApplyAmountAdjustmentParams,
  ): Promise<PosTotalsResult> {
    const result = await datasource.applySurcharge(params);
    if (!result.success) {
      return { success: false, error: mapRepositoryError(result.error) };
    }

    return { success: true, value: mapPosTotalsToDomain(result.value) };
  },

  async clearCart(): Promise<PosOperationResult> {
    return datasource.clearCart();
  },

  async getCartLines(): Promise<readonly PosCartLine[]> {
    const cartLines = await datasource.getCartLines();
    return mapPosCartLinesToDomain(cartLines);
  },

  async getTotals(): Promise<PosTotalsResult> {
    const result = await datasource.getTotals();
    if (!result.success) {
      return { success: false, error: mapRepositoryError(result.error) };
    }

    return { success: true, value: mapPosTotalsToDomain(result.value) };
  },

  async completePayment(
    params: PosCompletePaymentParams,
  ): Promise<PosPaymentResult> {
    const result = await datasource.completePayment(params);
    if (!result.success) {
      return { success: false, error: mapRepositoryError(result.error) };
    }

    return { success: true, value: mapPosReceiptToDomain(result.value) };
  },

  async saveSession(params: PosSaveSessionParams): Promise<PosOperationResult> {
    return datasource.saveSession(params);
  },

  async loadSession(params: PosLoadSessionParams): Promise<PosSessionResult> {
    return datasource.loadSession(params);
  },

  async clearSession(params: PosClearSessionParams): Promise<PosOperationResult> {
    return datasource.clearSession(params);
  },
});
