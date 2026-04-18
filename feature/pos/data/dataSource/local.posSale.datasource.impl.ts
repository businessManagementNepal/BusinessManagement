import { RecordSyncStatus } from "@/feature/session/types/authSession.types";
import type { Result } from "@/shared/types/result.types";
import { Database, Q } from "@nozbe/watermelondb";
import type {
  CreatePosSaleRecordParams,
  GetPosSaleByIdempotencyKeyParams,
  UpdatePosSaleWorkflowStateParams,
} from "../../types/posSale.dto.types";
import type { PosSaleModel } from "./db/posSale.model";
import type { PosSaleDatasource } from "./posSale.datasource";

const POS_SALES_TABLE = "pos_sales";

const normalizeRequired = (value: string): string => value.trim();

const normalizeOptional = (value: string | null): string | null => {
  if (value === null) {
    return null;
  }
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

const markCreatedAndUpdated = (
  record: { _raw: Record<string, number> },
  now: number,
): void => {
  record._raw.created_at = now;
  record._raw.updated_at = now;
};

const markUpdated = (
  record: { _raw: Record<string, number> },
  now: number,
): void => {
  record._raw.updated_at = now;
};

const markSyncStatusAsPendingUpdate = (
  record: { recordSyncStatus?: string | null },
): void => {
  if (
    !record.recordSyncStatus ||
    record.recordSyncStatus === RecordSyncStatus.Synced
  ) {
    record.recordSyncStatus = RecordSyncStatus.PendingUpdate;
  }
};

const findActiveSaleByRemoteId = async (
  database: Database,
  remoteId: string,
): Promise<PosSaleModel | null> => {
  const collection = database.get<PosSaleModel>(POS_SALES_TABLE);
  const results = await collection
    .query(Q.where("remote_id", remoteId), Q.where("deleted_at", Q.eq(null)))
    .fetch();
  return results[0] ?? null;
};

const findActiveSaleByIdempotency = async (
  database: Database,
  businessAccountRemoteId: string,
  idempotencyKey: string,
): Promise<PosSaleModel | null> => {
  const collection = database.get<PosSaleModel>(POS_SALES_TABLE);
  const results = await collection
    .query(
      Q.where("business_account_remote_id", businessAccountRemoteId),
      Q.where("idempotency_key", idempotencyKey),
      Q.where("deleted_at", Q.eq(null)),
      Q.sortBy("updated_at", Q.desc),
      Q.sortBy("created_at", Q.desc),
    )
    .fetch();
  return results[0] ?? null;
};

type CreateLocalPosSaleDatasourceParams = {
  database: Database;
};

export const createLocalPosSaleDatasource = ({
  database,
}: CreateLocalPosSaleDatasourceParams): PosSaleDatasource => ({
  async createPosSaleRecord(
    params: CreatePosSaleRecordParams,
  ): Promise<Result<PosSaleModel>> {
    try {
      const normalizedRemoteId = normalizeRequired(params.remoteId);
      const normalizedReceiptNumber = normalizeRequired(params.receiptNumber);
      const normalizedBusinessAccountRemoteId = normalizeRequired(
        params.businessAccountRemoteId,
      );
      const normalizedOwnerUserRemoteId = normalizeRequired(
        params.ownerUserRemoteId,
      );
      const normalizedIdempotencyKey = normalizeRequired(params.idempotencyKey);
      const normalizedCurrencyCode = normalizeRequired(params.currencyCode);
      const normalizedCountryCode = normalizeOptional(params.countryCode);
      const normalizedCustomerRemoteId = normalizeOptional(
        params.customerRemoteId,
      );
      const normalizedCustomerNameSnapshot = normalizeOptional(
        params.customerNameSnapshot,
      );
      const normalizedCustomerPhoneSnapshot = normalizeOptional(
        params.customerPhoneSnapshot,
      );
      const normalizedBillingDocumentRemoteId = normalizeOptional(
        params.billingDocumentRemoteId,
      );
      const normalizedLedgerEntryRemoteId = normalizeOptional(
        params.ledgerEntryRemoteId,
      );
      const normalizedLastErrorType = normalizeOptional(params.lastErrorType);
      const normalizedLastErrorMessage = normalizeOptional(
        params.lastErrorMessage,
      );
      const cartLinesSnapshotJson = JSON.stringify(params.cartLinesSnapshot);
      const paymentPartsSnapshotJson = JSON.stringify(params.paymentParts);
      const receiptSnapshotJson =
        params.receipt === null ? null : JSON.stringify(params.receipt);
      const postedTransactionRemoteIdsJson = JSON.stringify(
        params.postedTransactionRemoteIds,
      );

      if (!normalizedRemoteId) {
        throw new Error("POS sale remote id is required.");
      }
      if (!normalizedReceiptNumber) {
        throw new Error("POS sale receipt number is required.");
      }
      if (!normalizedBusinessAccountRemoteId) {
        throw new Error("POS sale business account is required.");
      }
      if (!normalizedOwnerUserRemoteId) {
        throw new Error("POS sale owner user is required.");
      }
      if (!normalizedIdempotencyKey) {
        throw new Error("POS sale idempotency key is required.");
      }
      if (!normalizedCurrencyCode) {
        throw new Error("POS sale currency code is required.");
      }

      const existing = await findActiveSaleByIdempotency(
        database,
        normalizedBusinessAccountRemoteId,
        normalizedIdempotencyKey,
      );
      if (existing) {
        throw new Error("POS sale already exists for this idempotency key.");
      }

      const collection = database.get<PosSaleModel>(POS_SALES_TABLE);
      let createdRecord: PosSaleModel | null = null;

      await database.write(async () => {
        const now = Date.now();

        const existingInsideWrite = await findActiveSaleByIdempotency(
          database,
          normalizedBusinessAccountRemoteId,
          normalizedIdempotencyKey,
        );
        if (existingInsideWrite) {
          throw new Error("POS sale already exists for this idempotency key.");
        }

        createdRecord = await collection.create((record) => {
          record.remoteId = normalizedRemoteId;
          record.receiptNumber = normalizedReceiptNumber;
          record.businessAccountRemoteId = normalizedBusinessAccountRemoteId;
          record.ownerUserRemoteId = normalizedOwnerUserRemoteId;
          record.idempotencyKey = normalizedIdempotencyKey;
          record.workflowStatus = params.workflowStatus;
          record.customerRemoteId = normalizedCustomerRemoteId;
          record.customerNameSnapshot = normalizedCustomerNameSnapshot;
          record.customerPhoneSnapshot = normalizedCustomerPhoneSnapshot;
          record.currencyCode = normalizedCurrencyCode;
          record.countryCode = normalizedCountryCode;
          record.itemCount = params.totalsSnapshot.itemCount;
          record.gross = params.totalsSnapshot.gross;
          record.discountAmount = params.totalsSnapshot.discountAmount;
          record.surchargeAmount = params.totalsSnapshot.surchargeAmount;
          record.taxAmount = params.totalsSnapshot.taxAmount;
          record.grandTotal = params.totalsSnapshot.grandTotal;
          record.cartLinesSnapshotJson = cartLinesSnapshotJson;
          record.paymentPartsSnapshotJson = paymentPartsSnapshotJson;
          record.receiptSnapshotJson = receiptSnapshotJson;
          record.billingDocumentRemoteId = normalizedBillingDocumentRemoteId;
          record.ledgerEntryRemoteId = normalizedLedgerEntryRemoteId;
          record.postedTransactionRemoteIdsJson =
            postedTransactionRemoteIdsJson;
          record.lastErrorType = normalizedLastErrorType;
          record.lastErrorMessage = normalizedLastErrorMessage;
          record.recordSyncStatus = RecordSyncStatus.PendingCreate;
          record.lastSyncedAt = null;
          record.deletedAt = null;
          markCreatedAndUpdated(
            record as unknown as { _raw: Record<string, number> },
            now,
          );
        });
      });

      if (!createdRecord) {
        throw new Error("Failed to create POS sale record.");
      }

      return { success: true, value: createdRecord };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error
            : new Error("Unknown error while creating POS sale record."),
      };
    }
  },

  async getPosSaleByIdempotencyKey(
    params: GetPosSaleByIdempotencyKeyParams,
  ): Promise<Result<PosSaleModel | null>> {
    try {
      const normalizedBusinessAccountRemoteId = normalizeRequired(
        params.businessAccountRemoteId,
      );
      const normalizedIdempotencyKey = normalizeRequired(params.idempotencyKey);

      if (!normalizedBusinessAccountRemoteId) {
        throw new Error("POS sale business account is required.");
      }
      if (!normalizedIdempotencyKey) {
        throw new Error("POS sale idempotency key is required.");
      }

      const existing = await findActiveSaleByIdempotency(
        database,
        normalizedBusinessAccountRemoteId,
        normalizedIdempotencyKey,
      );

      return { success: true, value: existing };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error
            : new Error("Unknown error while loading POS sale record."),
      };
    }
  },

  async updatePosSaleWorkflowState(
    params: UpdatePosSaleWorkflowStateParams,
  ): Promise<Result<PosSaleModel>> {
    try {
      const normalizedSaleRemoteId = normalizeRequired(params.saleRemoteId);
      const normalizedBillingDocumentRemoteId = normalizeOptional(
        params.billingDocumentRemoteId,
      );
      const normalizedLedgerEntryRemoteId = normalizeOptional(
        params.ledgerEntryRemoteId,
      );
      const normalizedLastErrorType = normalizeOptional(params.lastErrorType);
      const normalizedLastErrorMessage = normalizeOptional(
        params.lastErrorMessage,
      );
      const postedTransactionRemoteIdsJson = JSON.stringify(
        params.postedTransactionRemoteIds,
      );
      const receiptSnapshotJson =
        params.receipt === null ? null : JSON.stringify(params.receipt);

      if (!normalizedSaleRemoteId) {
        throw new Error("POS sale remote id is required.");
      }

      const existing = await findActiveSaleByRemoteId(
        database,
        normalizedSaleRemoteId,
      );
      if (!existing) {
        throw new Error("POS sale not found.");
      }

      await database.write(async () => {
        const now = Date.now();
        await existing.update((record) => {
          record.workflowStatus = params.workflowStatus;
          record.receiptSnapshotJson = receiptSnapshotJson;
          record.billingDocumentRemoteId = normalizedBillingDocumentRemoteId;
          record.ledgerEntryRemoteId = normalizedLedgerEntryRemoteId;
          record.postedTransactionRemoteIdsJson =
            postedTransactionRemoteIdsJson;
          record.lastErrorType = normalizedLastErrorType;
          record.lastErrorMessage = normalizedLastErrorMessage;
          markSyncStatusAsPendingUpdate(record);
          markUpdated(
            record as unknown as { _raw: Record<string, number> },
            now,
          );
        });
      });

      return { success: true, value: existing };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error
            : new Error("Unknown error while updating POS sale record."),
      };
    }
  },
});
