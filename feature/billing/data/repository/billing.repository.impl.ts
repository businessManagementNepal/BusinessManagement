import {
  BillingDatabaseError,
  BillingDocument,
  BillingDocumentNotFoundError,
  BillingDocumentStatus,
  BillingError,
  BillingOverview,
  BillingUnknownError,
  SaveBillingDocumentAllocationPayload,
  BillingValidationError,
  SaveBillPhotoPayload,
  SaveBillingDocumentPayload,
} from "@/feature/billing/types/billing.types";
import { BillingDatasource } from "@/feature/billing/data/dataSource/billing.datasource";
import { BillingRepository } from "./billing.repository";
import {
  mapBillingAllocationRecordToDomain,
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

const getStartOfDayTimestamp = (): number => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};

const deriveDocumentStatus = ({
  document,
  paidAmount,
  outstandingAmount,
}: {
  document: BillingDocument;
  paidAmount: number;
  outstandingAmount: number;
}): BillingDocument["status"] => {
  if (document.status === BillingDocumentStatus.Draft) {
    return BillingDocumentStatus.Draft;
  }

  if (outstandingAmount <= 0.0001) {
    return BillingDocumentStatus.Paid;
  }

  if (paidAmount > 0.0001) {
    return BillingDocumentStatus.PartiallyPaid;
  }

  const todayStart = getStartOfDayTimestamp();
  if (document.dueAt !== null && document.dueAt < todayStart) {
    return BillingDocumentStatus.Overdue;
  }

  return BillingDocumentStatus.Pending;
};

const deriveDocuments = ({
  documents,
  allocations,
}: {
  documents: readonly BillingDocument[];
  allocations: readonly {
    documentRemoteId: string;
    amount: number;
  }[];
}): BillingDocument[] => {
  const paidAmountByDocumentRemoteId = new Map<string, number>();
  for (const allocation of allocations) {
    paidAmountByDocumentRemoteId.set(
      allocation.documentRemoteId,
      (paidAmountByDocumentRemoteId.get(allocation.documentRemoteId) ?? 0) +
        allocation.amount,
    );
  }

  const todayStart = getStartOfDayTimestamp();

  return documents.map((document) => {
    const paidAmount = Number(
      (
        paidAmountByDocumentRemoteId.get(document.remoteId) ?? 0
      ).toFixed(2),
    );
    const outstandingAmount = Number(
      Math.max(document.totalAmount - paidAmount, 0).toFixed(2),
    );
    const isOverdue =
      outstandingAmount > 0 &&
      document.dueAt !== null &&
      document.dueAt < todayStart;
    return {
      ...document,
      paidAmount,
      outstandingAmount,
      isOverdue,
      status: deriveDocumentStatus({
        document,
        paidAmount,
        outstandingAmount,
      }),
    };
  });
};

const buildSummary = (documents: BillingOverview["documents"]) => {
  const pendingAmount = documents
    .filter(
      (item) =>
        item.status !== BillingDocumentStatus.Draft &&
        !item.isOverdue &&
        item.outstandingAmount > 0,
    )
    .reduce((sum, item) => sum + item.outstandingAmount, 0);
  const overdueAmount = documents
    .filter((item) => item.isOverdue)
    .reduce((sum, item) => sum + item.outstandingAmount, 0);
  return {
    totalDocuments: documents.length,
    pendingAmount: Number(pendingAmount.toFixed(2)),
    overdueAmount: Number(overdueAmount.toFixed(2)),
  };
};

export const createBillingRepository = (datasource: BillingDatasource): BillingRepository => ({
  async getBillingOverviewByAccountRemoteId(accountRemoteId: string) {
    const documentsResult = await datasource.getBillingDocumentsByAccountRemoteId(accountRemoteId);
    if (!documentsResult.success) {
      return { success: false, error: mapDatasourceError(documentsResult.error) };
    }
    const allocationsResult =
      await datasource.getBillingDocumentAllocationsByAccountRemoteId(
        accountRemoteId,
      );
    if (!allocationsResult.success) {
      return { success: false, error: mapDatasourceError(allocationsResult.error) };
    }
    const billPhotosResult = await datasource.getBillPhotosByAccountRemoteId(accountRemoteId);
    if (!billPhotosResult.success) {
      return { success: false, error: mapDatasourceError(billPhotosResult.error) };
    }
    const baseDocuments = documentsResult.value.map((record) =>
      mapBillingDocumentModelToDomain(record.document, record.items),
    );
    const allocations = allocationsResult.value.map(
      mapBillingAllocationRecordToDomain,
    );
    const documents = deriveDocuments({
      documents: baseDocuments,
      allocations,
    });
    const billPhotos = billPhotosResult.value.map(mapBillPhotoModelToDomain);
    return {
      success: true,
      value: {
        documents,
        allocations,
        billPhotos,
        summary: buildSummary(documents),
      },
    };
  },
  async getBillingDocumentByRemoteId(remoteId: string) {
    const documentResult = await datasource.getBillingDocumentByRemoteId(remoteId);
    if (!documentResult.success) {
      return {
        success: false,
        error: mapDatasourceError(documentResult.error),
      };
    }

    if (!documentResult.value) {
      return {
        success: false,
        error: BillingDocumentNotFoundError,
      };
    }

    const baseDocument = mapBillingDocumentModelToDomain(
      documentResult.value.document,
      documentResult.value.items,
    );
    const allocationsResult =
      await datasource.getBillingDocumentAllocationsByAccountRemoteId(
        baseDocument.accountRemoteId,
      );

    if (!allocationsResult.success) {
      return {
        success: false,
        error: mapDatasourceError(allocationsResult.error),
      };
    }

    const allocations = allocationsResult.value
      .map(mapBillingAllocationRecordToDomain)
      .filter(
        (allocation) => allocation.documentRemoteId === baseDocument.remoteId,
      );

    const derivedDocument = deriveDocuments({
      documents: [baseDocument],
      allocations,
    })[0];

    return {
      success: true,
      value: derivedDocument,
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
  async linkBillingDocumentContactRemoteId(
    documentRemoteId: string,
    contactRemoteId: string | null,
  ) {
    const result = await datasource.linkBillingDocumentContactRemoteId(
      documentRemoteId,
      contactRemoteId,
    );
    if (!result.success) return { success: false, error: mapDatasourceError(result.error) };
    return result;
  },
  async linkBillingDocumentLedgerEntryRemoteId(
    documentRemoteId: string,
    ledgerEntryRemoteId: string | null,
  ) {
    const result = await datasource.linkBillingDocumentLedgerEntryRemoteId(
      documentRemoteId,
      ledgerEntryRemoteId,
    );
    if (!result.success) {
      return {
        success: false,
        error: mapDatasourceError(result.error),
      };
    }
    return result;
  },
  async saveBillPhoto(payload: SaveBillPhotoPayload) {
    const result = await datasource.saveBillPhoto(payload);
    if (!result.success) return { success: false, error: mapDatasourceError(result.error) };
    return { success: true, value: true };
  },
  async saveBillingDocumentAllocations(
    payloads: readonly SaveBillingDocumentAllocationPayload[],
  ) {
    const result = await datasource.saveBillingDocumentAllocations(payloads);
    if (!result.success) return { success: false, error: mapDatasourceError(result.error) };
    return result;
  },
  async replaceBillingDocumentAllocationsForSettlementEntry(params) {
    const result =
      await datasource.replaceBillingDocumentAllocationsForSettlementEntry(
        params,
      );
    if (!result.success) return { success: false, error: mapDatasourceError(result.error) };
    return result;
  },
  async deleteBillingDocumentAllocationsBySettlementEntryRemoteId(
    settlementLedgerEntryRemoteId: string,
  ) {
    const result =
      await datasource.deleteBillingDocumentAllocationsBySettlementEntryRemoteId(
        settlementLedgerEntryRemoteId,
      );
    if (!result.success) return { success: false, error: mapDatasourceError(result.error) };
    return result;
  },
});
