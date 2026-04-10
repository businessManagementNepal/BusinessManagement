import { Result } from "@/shared/types/result.types";
import { Database, Q } from "@nozbe/watermelondb";
import {
  LedgerEntrySyncStatus,
  SaveLedgerEntryPayload,
} from "@/feature/ledger/types/ledger.entity.types";
import { LedgerDatasource } from "./ledger.datasource";
import { LedgerEntryModel } from "./db/ledger.model";

const LEDGER_ENTRIES_TABLE = "ledger_entries";

const setCreatedAndUpdatedAt = (record: LedgerEntryModel, now: number) => {
  (record as unknown as { _raw: Record<string, number> })._raw.created_at = now;
  (record as unknown as { _raw: Record<string, number> })._raw.updated_at = now;
};

const setUpdatedAt = (record: LedgerEntryModel, now: number) => {
  (record as unknown as { _raw: Record<string, number> })._raw.updated_at = now;
};

const updateSyncStatusOnMutation = (record: LedgerEntryModel) => {
  if (!record.recordSyncStatus) {
    record.recordSyncStatus = LedgerEntrySyncStatus.PendingUpdate;
    return;
  }

  if (record.recordSyncStatus === LedgerEntrySyncStatus.Synced) {
    record.recordSyncStatus = LedgerEntrySyncStatus.PendingUpdate;
  }
};

export const createLocalLedgerDatasource = (
  database: Database,
): LedgerDatasource => ({
  async saveLedgerEntry(
    payload: SaveLedgerEntryPayload,
  ): Promise<Result<LedgerEntryModel>> {
    try {
      const ledgerCollection = database.get<LedgerEntryModel>(LEDGER_ENTRIES_TABLE);
      const existingEntries = await ledgerCollection
        .query(Q.where("remote_id", payload.remoteId))
        .fetch();

      const existingEntry = existingEntries[0];

      if (existingEntry) {
        await database.write(async () => {
          await existingEntry.update((record) => {
            record.businessAccountRemoteId = payload.businessAccountRemoteId;
            record.ownerUserRemoteId = payload.ownerUserRemoteId;
            record.partyName = payload.partyName;
            record.partyPhone = payload.partyPhone;
            record.entryType = payload.entryType;
            record.balanceDirection = payload.balanceDirection;
            record.title = payload.title;
            record.amount = payload.amount;
            record.currencyCode = payload.currencyCode;
            record.note = payload.note;
            record.happenedAt = payload.happenedAt;
            record.dueAt = payload.dueAt;
            record.paymentMode = payload.paymentMode;
            record.referenceNumber = payload.referenceNumber;
            record.reminderAt = payload.reminderAt;
            record.attachmentUri = payload.attachmentUri;
            record.settledAgainstEntryRemoteId = payload.settledAgainstEntryRemoteId;
            record.linkedDocumentRemoteId = payload.linkedDocumentRemoteId ?? null;
            record.linkedTransactionRemoteId = payload.linkedTransactionRemoteId;
            record.settlementAccountRemoteId = payload.settlementAccountRemoteId;
            record.settlementAccountDisplayNameSnapshot =
              payload.settlementAccountDisplayNameSnapshot;
            record.deletedAt = null;
            updateSyncStatusOnMutation(record);
            setUpdatedAt(record, Date.now());
          });
        });

        return { success: true, value: existingEntry };
      }

      let createdEntry!: LedgerEntryModel;

      await database.write(async () => {
        createdEntry = await ledgerCollection.create((record) => {
          const now = Date.now();

          record.remoteId = payload.remoteId;
          record.businessAccountRemoteId = payload.businessAccountRemoteId;
          record.ownerUserRemoteId = payload.ownerUserRemoteId;
          record.partyName = payload.partyName;
          record.partyPhone = payload.partyPhone;
          record.entryType = payload.entryType;
          record.balanceDirection = payload.balanceDirection;
          record.title = payload.title;
          record.amount = payload.amount;
          record.currencyCode = payload.currencyCode;
          record.note = payload.note;
          record.happenedAt = payload.happenedAt;
          record.dueAt = payload.dueAt;
          record.paymentMode = payload.paymentMode;
          record.referenceNumber = payload.referenceNumber;
          record.reminderAt = payload.reminderAt;
          record.attachmentUri = payload.attachmentUri;
          record.settledAgainstEntryRemoteId = payload.settledAgainstEntryRemoteId;
          record.linkedDocumentRemoteId = payload.linkedDocumentRemoteId ?? null;
          record.linkedTransactionRemoteId = payload.linkedTransactionRemoteId;
          record.settlementAccountRemoteId = payload.settlementAccountRemoteId;
          record.settlementAccountDisplayNameSnapshot =
            payload.settlementAccountDisplayNameSnapshot;
          record.recordSyncStatus = LedgerEntrySyncStatus.PendingCreate;
          record.lastSyncedAt = null;
          record.deletedAt = null;

          setCreatedAndUpdatedAt(record, now);
        });
      });

      return { success: true, value: createdEntry };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async getLedgerEntriesByBusinessAccountRemoteId(
    businessAccountRemoteId: string,
  ): Promise<Result<LedgerEntryModel[]>> {
    try {
      const ledgerCollection = database.get<LedgerEntryModel>(LEDGER_ENTRIES_TABLE);
      const entries = await ledgerCollection
        .query(
          Q.where("business_account_remote_id", businessAccountRemoteId),
          Q.sortBy("happened_at", Q.desc),
        )
        .fetch();

      return {
        success: true,
        value: entries.filter((entry) => entry.deletedAt === null),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async getLedgerEntryByRemoteId(
    remoteId: string,
  ): Promise<Result<LedgerEntryModel | null>> {
    try {
      const ledgerCollection = database.get<LedgerEntryModel>(LEDGER_ENTRIES_TABLE);
      const matchingEntries = await ledgerCollection
        .query(Q.where("remote_id", remoteId))
        .fetch();

      const entry = matchingEntries.find((record) => record.deletedAt === null) ?? null;

      return {
        success: true,
        value: entry,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async deleteLedgerEntryByRemoteId(remoteId: string): Promise<Result<boolean>> {
    try {
      const ledgerCollection = database.get<LedgerEntryModel>(LEDGER_ENTRIES_TABLE);
      const matchingEntries = await ledgerCollection
        .query(Q.where("remote_id", remoteId))
        .fetch();

      const entry = matchingEntries[0];

      if (!entry) {
        return {
          success: false,
          error: new Error("Ledger entry not found."),
        };
      }

      await database.write(async () => {
        await entry.update((record) => {
          record.deletedAt = Date.now();
          updateSyncStatusOnMutation(record);
          setUpdatedAt(record, Date.now());
        });
      });

      return {
        success: true,
        value: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },
});
