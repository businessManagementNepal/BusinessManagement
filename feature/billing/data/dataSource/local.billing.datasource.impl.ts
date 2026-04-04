import { Database, Q } from "@nozbe/watermelondb";
import { RecordSyncStatus } from "@/feature/session/types/authSession.types";
import { Result } from "@/shared/types/result.types";
import { BillingDatasource, BillingDocumentRecord } from "./billing.datasource";
import { BillingDocumentModel } from "./db/billingDocument.model";
import { BillingDocumentItemModel } from "./db/billingDocumentItem.model";
import { BillPhotoModel } from "./db/billPhoto.model";
import { SaveBillPhotoPayload, SaveBillingDocumentPayload } from "@/feature/billing/types/billing.types";

const BILLING_DOCUMENTS_TABLE = "billing_documents";
const BILLING_DOCUMENT_ITEMS_TABLE = "billing_document_items";
const BILL_PHOTOS_TABLE = "bill_photos";

const normalizeRequired = (value: string): string => value.trim();
const normalizeOptional = (value: string | null): string | null => {
  if (value === null) return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};
const markCreatedAndUpdated = (record: { _raw: Record<string, number> }, now: number) => {
  record._raw.created_at = now;
  record._raw.updated_at = now;
};
const markUpdated = (record: { _raw: Record<string, number> }, now: number) => {
  record._raw.updated_at = now;
};
const touchSync = (record: { recordSyncStatus?: string | null }) => {
  if (!record.recordSyncStatus || record.recordSyncStatus === RecordSyncStatus.Synced) {
    record.recordSyncStatus = RecordSyncStatus.PendingUpdate;
  }
};

const findDocumentByRemoteId = async (
  database: Database,
  remoteId: string,
): Promise<BillingDocumentModel | null> => {
  const collection = database.get<BillingDocumentModel>(BILLING_DOCUMENTS_TABLE);
  const matches = await collection.query(
    Q.where("remote_id", remoteId.trim()),
    Q.where("deleted_at", Q.eq(null)),
    Q.sortBy("updated_at", Q.desc),
    Q.sortBy("created_at", Q.desc),
  ).fetch();
  return matches[0] ?? null;
};

const hasDocumentNumberConflict = async ({
  database,
  accountRemoteId,
  documentNumber,
  excludedRemoteId,
}: {
  database: Database;
  accountRemoteId: string;
  documentNumber: string;
  excludedRemoteId: string | null;
}): Promise<boolean> => {
  const collection = database.get<BillingDocumentModel>(BILLING_DOCUMENTS_TABLE);
  const matches = await collection.query(
    Q.where("account_remote_id", accountRemoteId),
    Q.where("document_number", documentNumber),
    Q.where("deleted_at", Q.eq(null)),
  ).fetch();

  return matches.some((record) => record.remoteId !== excludedRemoteId);
};

const getItemsByDocumentRemoteId = async (
  database: Database,
  documentRemoteId: string,
): Promise<BillingDocumentItemModel[]> => {
  const collection = database.get<BillingDocumentItemModel>(BILLING_DOCUMENT_ITEMS_TABLE);
  return collection.query(
    Q.where("document_remote_id", documentRemoteId),
    Q.where("deleted_at", Q.eq(null)),
    Q.sortBy("line_order", Q.asc),
  ).fetch();
};

const lineTotal = (quantity: number, unitRate: number): number => {
  return Number((quantity * unitRate).toFixed(2));
};

export const createLocalBillingDatasource = (database: Database): BillingDatasource => ({
  async saveBillingDocument(payload: SaveBillingDocumentPayload): Promise<Result<BillingDocumentRecord>> {
    try {
      const normalizedRemoteId = normalizeRequired(payload.remoteId);
      const normalizedAccountRemoteId = normalizeRequired(payload.accountRemoteId);
      const normalizedDocumentNumber = normalizeRequired(
        payload.documentNumber,
      ).toUpperCase();
      const normalizedCustomerName = normalizeRequired(payload.customerName);
      const normalizedNotes = normalizeOptional(payload.notes);

      if (!normalizedRemoteId) throw new Error("Billing document remote id is required");
      if (!normalizedAccountRemoteId) throw new Error("Account remote id is required");
      if (!normalizedDocumentNumber) throw new Error("Document number is required");
      if (!normalizedCustomerName) throw new Error("Customer name is required");
      if (payload.items.length === 0) throw new Error("At least one item is required");
      if (payload.taxRatePercent < 0) throw new Error("Tax rate cannot be negative");

      for (const item of payload.items) {
        if (!item.itemName.trim()) throw new Error("Item name is required");
        if (!(item.quantity > 0)) throw new Error("Quantity must be greater than zero");
        if (!(item.unitRate >= 0)) throw new Error("Rate cannot be negative");
      }

      const subtotalAmount = Number(
        payload.items.reduce((sum, item) => sum + lineTotal(item.quantity, item.unitRate), 0).toFixed(2),
      );
      const taxAmount = Number(((subtotalAmount * payload.taxRatePercent) / 100).toFixed(2));
      const totalAmount = Number((subtotalAmount + taxAmount).toFixed(2));
      const existingDocument = await findDocumentByRemoteId(database, normalizedRemoteId);
      const hasDuplicateDocumentNumber = await hasDocumentNumberConflict({
        database,
        accountRemoteId: normalizedAccountRemoteId,
        documentNumber: normalizedDocumentNumber,
        excludedRemoteId: existingDocument?.remoteId ?? null,
      });
      if (hasDuplicateDocumentNumber) {
        throw new Error("Document number already exists for this account");
      }
      let savedDocument: BillingDocumentModel | null = existingDocument;

      await database.write(async () => {
        const now = Date.now();
        const hasDuplicateOnWrite = await hasDocumentNumberConflict({
          database,
          accountRemoteId: normalizedAccountRemoteId,
          documentNumber: normalizedDocumentNumber,
          excludedRemoteId: existingDocument?.remoteId ?? null,
        });
        if (hasDuplicateOnWrite) {
          throw new Error("Document number already exists for this account");
        }

        if (existingDocument) {
          await existingDocument.update((record) => {
            record.accountRemoteId = normalizedAccountRemoteId;
            record.documentNumber = normalizedDocumentNumber;
            record.documentType = payload.documentType;
            record.templateType = payload.templateType;
            record.customerName = normalizedCustomerName;
            record.status = payload.status;
            record.taxRatePercent = payload.taxRatePercent;
            record.notes = normalizedNotes;
            record.subtotalAmount = subtotalAmount;
            record.taxAmount = taxAmount;
            record.totalAmount = totalAmount;
            record.issuedAt = payload.issuedAt;
            touchSync(record);
            markUpdated(record as unknown as { _raw: Record<string, number> }, now);
          });
        } else {
          const collection = database.get<BillingDocumentModel>(BILLING_DOCUMENTS_TABLE);
          savedDocument = await collection.create((record) => {
            record.remoteId = normalizedRemoteId;
            record.accountRemoteId = normalizedAccountRemoteId;
            record.documentNumber = normalizedDocumentNumber;
            record.documentType = payload.documentType;
            record.templateType = payload.templateType;
            record.customerName = normalizedCustomerName;
            record.status = payload.status;
            record.taxRatePercent = payload.taxRatePercent;
            record.notes = normalizedNotes;
            record.subtotalAmount = subtotalAmount;
            record.taxAmount = taxAmount;
            record.totalAmount = totalAmount;
            record.issuedAt = payload.issuedAt;
            record.recordSyncStatus = RecordSyncStatus.PendingCreate;
            record.lastSyncedAt = null;
            record.deletedAt = null;
            markCreatedAndUpdated(record as unknown as { _raw: Record<string, number> }, now);
          });
        }

        const itemCollection = database.get<BillingDocumentItemModel>(BILLING_DOCUMENT_ITEMS_TABLE);
        const existingItems = savedDocument
          ? await itemCollection.query(
              Q.where("document_remote_id", normalizedRemoteId),
              Q.where("deleted_at", Q.eq(null)),
            ).fetch()
          : [];

        for (const itemRecord of existingItems) {
          await itemRecord.update((record) => {
            record.deletedAt = now;
            markUpdated(record as unknown as { _raw: Record<string, number> }, now);
          });
        }

        for (const item of payload.items) {
          await itemCollection.create((record) => {
            record.remoteId = normalizeRequired(item.remoteId);
            record.documentRemoteId = normalizedRemoteId;
            record.lineOrder = item.lineOrder;
            record.itemName = item.itemName.trim();
            record.quantity = item.quantity;
            record.unitRate = item.unitRate;
            record.lineTotal = lineTotal(item.quantity, item.unitRate);
            record.deletedAt = null;
            markCreatedAndUpdated(record as unknown as { _raw: Record<string, number> }, now);
          });
        }
      });

      if (!savedDocument) throw new Error("Unable to save billing document");
      const items = await getItemsByDocumentRemoteId(database, normalizedRemoteId);
      return { success: true, value: { document: savedDocument, items } };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error : new Error("Unknown error") };
    }
  },

  async getBillingDocumentsByAccountRemoteId(accountRemoteId: string): Promise<Result<BillingDocumentRecord[]>> {
    try {
      const normalizedAccountRemoteId = normalizeRequired(accountRemoteId);
      if (!normalizedAccountRemoteId) throw new Error("Account remote id is required");
      const collection = database.get<BillingDocumentModel>(BILLING_DOCUMENTS_TABLE);
      const documents = await collection.query(
        Q.where("account_remote_id", normalizedAccountRemoteId),
        Q.where("deleted_at", Q.eq(null)),
        Q.sortBy("issued_at", Q.desc),
      ).fetch();
      const records = await Promise.all(documents.map(async (document) => ({
        document,
        items: await getItemsByDocumentRemoteId(database, document.remoteId),
      })));
      return { success: true, value: records };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error : new Error("Unknown error") };
    }
  },

  async deleteBillingDocumentByRemoteId(remoteId: string): Promise<Result<boolean>> {
    try {
      const normalizedRemoteId = normalizeRequired(remoteId);
      if (!normalizedRemoteId) throw new Error("Billing document remote id is required");
      const existingDocument = await findDocumentByRemoteId(database, normalizedRemoteId);
      if (!existingDocument) throw new Error("Billing document not found");
      const existingItems = await getItemsByDocumentRemoteId(database, normalizedRemoteId);
      await database.write(async () => {
        const now = Date.now();
        await existingDocument.update((record) => {
          record.deletedAt = now;
          touchSync(record);
          markUpdated(record as unknown as { _raw: Record<string, number> }, now);
        });
        for (const item of existingItems) {
          await item.update((record) => {
            record.deletedAt = now;
            markUpdated(record as unknown as { _raw: Record<string, number> }, now);
          });
        }
      });
      return { success: true, value: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error : new Error("Unknown error") };
    }
  },

  async saveBillPhoto(payload: SaveBillPhotoPayload): Promise<Result<BillPhotoModel>> {
    try {
      const normalizedRemoteId = normalizeRequired(payload.remoteId);
      const normalizedAccountRemoteId = normalizeRequired(payload.accountRemoteId);
      const normalizedFileName = normalizeRequired(payload.fileName);
      const normalizedDocumentRemoteId = normalizeOptional(payload.documentRemoteId);
      const normalizedMimeType = normalizeOptional(payload.mimeType);
      const normalizedImageDataUrl = normalizeRequired(payload.imageDataUrl);
      if (!normalizedRemoteId) throw new Error("Bill photo remote id is required");
      if (!normalizedAccountRemoteId) throw new Error("Account remote id is required");
      if (!normalizedFileName) throw new Error("File name is required");
      if (!normalizedImageDataUrl) throw new Error("Image data is required");
      const collection = database.get<BillPhotoModel>(BILL_PHOTOS_TABLE);
      let created!: BillPhotoModel;
      await database.write(async () => {
        created = await collection.create((record) => {
          const now = Date.now();
          record.remoteId = normalizedRemoteId;
          record.accountRemoteId = normalizedAccountRemoteId;
          record.documentRemoteId = normalizedDocumentRemoteId;
          record.fileName = normalizedFileName;
          record.mimeType = normalizedMimeType;
          record.imageDataUrl = normalizedImageDataUrl;
          record.uploadedAt = payload.uploadedAt;
          record.recordSyncStatus = RecordSyncStatus.PendingCreate;
          record.lastSyncedAt = null;
          record.deletedAt = null;
          markCreatedAndUpdated(record as unknown as { _raw: Record<string, number> }, now);
        });
      });
      return { success: true, value: created };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error : new Error("Unknown error") };
    }
  },

  async getBillPhotosByAccountRemoteId(accountRemoteId: string): Promise<Result<BillPhotoModel[]>> {
    try {
      const normalizedAccountRemoteId = normalizeRequired(accountRemoteId);
      if (!normalizedAccountRemoteId) throw new Error("Account remote id is required");
      const collection = database.get<BillPhotoModel>(BILL_PHOTOS_TABLE);
      const photos = await collection.query(
        Q.where("account_remote_id", normalizedAccountRemoteId),
        Q.where("deleted_at", Q.eq(null)),
        Q.sortBy("uploaded_at", Q.desc),
      ).fetch();
      return { success: true, value: photos };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error : new Error("Unknown error") };
    }
  },
});
