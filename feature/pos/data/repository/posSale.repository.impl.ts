import type { PosPaymentPartInput } from "../../types/pos.dto.types";
import type { PosCartLine, PosReceipt } from "../../types/pos.entity.types";
import type {
  CreatePosSaleRecordParams,
  GetPosSaleByIdempotencyKeyParams,
  UpdatePosSaleWorkflowStateParams,
} from "../../types/posSale.dto.types";
import {
  PosSaleErrorType,
  type PosSaleError,
  type PosSaleLookupResult,
  type PosSaleResult,
} from "../../types/posSale.error.types";
import type { PosSaleRecord } from "../../types/posSale.entity.types";
import type { PosSaleDatasource } from "../dataSource/posSale.datasource";
import type { PosSaleModel } from "../dataSource/db/posSale.model";
import type { PosSaleRepository } from "./posSale.repository";

const mapDatasourceError = (error: Error): PosSaleError => {
  const normalizedMessage = error.message.trim();
  const lower = normalizedMessage.toLowerCase();

  if (lower.includes("not found")) {
    return {
      type: PosSaleErrorType.NotFound,
      message: normalizedMessage || "POS sale record not found.",
    };
  }

  if (
    lower.includes("already exists") ||
    lower.includes("idempotency") ||
    lower.includes("conflict") ||
    lower.includes("unique")
  ) {
    return {
      type: PosSaleErrorType.Conflict,
      message: normalizedMessage || "POS sale conflict detected.",
    };
  }

  if (
    lower.includes("required") ||
    lower.includes("invalid") ||
    lower.includes("json")
  ) {
    return {
      type: PosSaleErrorType.Validation,
      message: normalizedMessage || "Invalid POS sale input.",
    };
  }

  return {
    type: PosSaleErrorType.Unknown,
    message: normalizedMessage || "Unexpected POS sale data error.",
  };
};

const parseJsonValue = <T>(value: string | null, fallback: T): T => {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const mapModelToDomain = (model: PosSaleModel): PosSaleRecord => ({
  remoteId: model.remoteId,
  receiptNumber: model.receiptNumber,
  businessAccountRemoteId: model.businessAccountRemoteId,
  ownerUserRemoteId: model.ownerUserRemoteId,
  idempotencyKey: model.idempotencyKey,
  workflowStatus: model.workflowStatus,
  customerRemoteId: model.customerRemoteId,
  customerNameSnapshot: model.customerNameSnapshot,
  customerPhoneSnapshot: model.customerPhoneSnapshot,
  currencyCode: model.currencyCode,
  countryCode: model.countryCode,
  cartLinesSnapshot: parseJsonValue<readonly PosCartLine[]>(
    model.cartLinesSnapshotJson,
    [],
  ),
  totalsSnapshot: {
    itemCount: model.itemCount,
    gross: model.gross,
    discountAmount: model.discountAmount,
    surchargeAmount: model.surchargeAmount,
    taxAmount: model.taxAmount,
    grandTotal: model.grandTotal,
  },
  paymentParts: parseJsonValue<readonly PosPaymentPartInput[]>(
    model.paymentPartsSnapshotJson,
    [],
  ),
  receipt: parseJsonValue<PosReceipt | null>(model.receiptSnapshotJson, null),
  billingDocumentRemoteId: model.billingDocumentRemoteId,
  ledgerEntryRemoteId: model.ledgerEntryRemoteId,
  postedTransactionRemoteIds: parseJsonValue<readonly string[]>(
    model.postedTransactionRemoteIdsJson,
    [],
  ),
  lastErrorType: model.lastErrorType,
  lastErrorMessage: model.lastErrorMessage,
  createdAt: model.createdAt.getTime(),
  updatedAt: model.updatedAt.getTime(),
});

export const createPosSaleRepository = (
  datasource: PosSaleDatasource,
): PosSaleRepository => ({
  async createPosSaleRecord(
    params: CreatePosSaleRecordParams,
  ): Promise<PosSaleResult> {
    const result = await datasource.createPosSaleRecord(params);
    if (!result.success) {
      return { success: false, error: mapDatasourceError(result.error) };
    }

    return { success: true, value: mapModelToDomain(result.value) };
  },

  async getPosSaleByIdempotencyKey(
    params: GetPosSaleByIdempotencyKeyParams,
  ): Promise<PosSaleLookupResult> {
    const result = await datasource.getPosSaleByIdempotencyKey(params);
    if (!result.success) {
      return { success: false, error: mapDatasourceError(result.error) };
    }

    if (!result.value) {
      return { success: true, value: null };
    }

    return { success: true, value: mapModelToDomain(result.value) };
  },

  async updatePosSaleWorkflowState(
    params: UpdatePosSaleWorkflowStateParams,
  ): Promise<PosSaleResult> {
    const result = await datasource.updatePosSaleWorkflowState(params);
    if (!result.success) {
      return { success: false, error: mapDatasourceError(result.error) };
    }

    return { success: true, value: mapModelToDomain(result.value) };
  },
});
