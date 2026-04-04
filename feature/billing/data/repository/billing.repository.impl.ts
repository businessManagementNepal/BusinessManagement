import {
  BillingDatabaseError,
  BillingDocumentNotFoundError,
  BillingError,
  BillingOverview,
  BillingUnknownError,
  BillingValidationError,
  SaveBillPhotoPayload,
  SaveBillingDocumentPayload,
} from "@/feature/billing/types/billing.types";
import { BillingDatasource } from "@/feature/billing/data/dataSource/billing.datasource";
import { BillingRepository } from "./billing.repository";
import {
  mapBillPhotoModelToDomain,
  mapBillingDocumentModelToDomain,
} from "./mapper/billing.mapper";

const mapDatasourceError = (error: Error): BillingError => {
  const normalized = error.message.trim();
  const lower = normalized.toLowerCase();
  if (lower.includes("not found")) return BillingDocumentNotFoundError;
  if (
    lower.includes("required") ||
    lower.includes("greater than zero") ||
    lower.includes("negative") ||
    lower.includes("already exists") ||
    lower.includes("unique constraint")
  ) {
    return BillingValidationError(normalized);
  }
  if (lower.includes("database") || lower.includes("schema") || lower.includes("table") || lower.includes("adapter")) {
    return BillingDatabaseError;
  }
  return { ...BillingUnknownError, message: normalized || BillingUnknownError.message };
};

const buildSummary = (documents: BillingOverview["documents"]) => {
  const pendingAmount = documents
    .filter((item) => item.status === "pending")
    .reduce((sum, item) => sum + item.totalAmount, 0);
  const overdueAmount = documents
    .filter((item) => item.status === "overdue")
    .reduce((sum, item) => sum + item.totalAmount, 0);
  return {
    totalDocuments: documents.length,
    pendingAmount,
    overdueAmount,
  };
};

export const createBillingRepository = (datasource: BillingDatasource): BillingRepository => ({
  async getBillingOverviewByAccountRemoteId(accountRemoteId: string) {
    const documentsResult = await datasource.getBillingDocumentsByAccountRemoteId(accountRemoteId);
    if (!documentsResult.success) {
      return { success: false, error: mapDatasourceError(documentsResult.error) };
    }
    const billPhotosResult = await datasource.getBillPhotosByAccountRemoteId(accountRemoteId);
    if (!billPhotosResult.success) {
      return { success: false, error: mapDatasourceError(billPhotosResult.error) };
    }
    const documents = documentsResult.value.map((record) =>
      mapBillingDocumentModelToDomain(record.document, record.items),
    );
    const billPhotos = billPhotosResult.value.map(mapBillPhotoModelToDomain);
    return {
      success: true,
      value: {
        documents,
        billPhotos,
        summary: buildSummary(documents),
      },
    };
  },
  async saveBillingDocument(payload: SaveBillingDocumentPayload) {
    const result = await datasource.saveBillingDocument(payload);
    if (!result.success) return { success: false, error: mapDatasourceError(result.error) };
    return {
      success: true,
      value: mapBillingDocumentModelToDomain(result.value.document, result.value.items),
    };
  },
  async deleteBillingDocumentByRemoteId(remoteId: string) {
    const result = await datasource.deleteBillingDocumentByRemoteId(remoteId);
    if (!result.success) return { success: false, error: mapDatasourceError(result.error) };
    return result;
  },
  async saveBillPhoto(payload: SaveBillPhotoPayload) {
    const result = await datasource.saveBillPhoto(payload);
    if (!result.success) return { success: false, error: mapDatasourceError(result.error) };
    return { success: true, value: true };
  },
});
