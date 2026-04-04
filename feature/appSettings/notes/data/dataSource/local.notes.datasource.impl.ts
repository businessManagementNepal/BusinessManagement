import { Result } from "@/shared/types/result.types";
import { Database, Q } from "@nozbe/watermelondb";
import { BusinessNotesDatasource } from "./notes.datasource";
import { BusinessNoteModel } from "./db/businessNote.model";

const BUSINESS_NOTES_TABLE = "business_notes";

const normalizeRequired = (value: string): string => value.trim();
const normalizeNoteContent = (value: string): string | null => {
  const normalized = value.replace(/\r\n/g, "\n");
  return normalized.length > 0 ? normalized : null;
};

const setCreatedAndUpdatedAt = (record: BusinessNoteModel, now: number) => {
  (record as unknown as { _raw: Record<string, number> })._raw.created_at = now;
  (record as unknown as { _raw: Record<string, number> })._raw.updated_at = now;
};

const setUpdatedAt = (record: BusinessNoteModel, now: number) => {
  (record as unknown as { _raw: Record<string, number> })._raw.updated_at = now;
};

const getBusinessNotesByAccountRemoteId = async (
  database: Database,
  accountRemoteId: string,
): Promise<BusinessNoteModel[]> => {
  const collection = database.get<BusinessNoteModel>(BUSINESS_NOTES_TABLE);
  return collection
    .query(
      Q.where("account_remote_id", accountRemoteId),
      Q.sortBy("updated_at", Q.desc),
      Q.sortBy("created_at", Q.desc),
    )
    .fetch();
};

const findBusinessNoteByAccountRemoteId = async (
  database: Database,
  accountRemoteId: string,
): Promise<BusinessNoteModel | null> => {
  const records = await getBusinessNotesByAccountRemoteId(database, accountRemoteId);
  return records[0] ?? null;
};

export const createLocalBusinessNotesDatasource = (
  database: Database,
): BusinessNotesDatasource => ({
  async getBusinessNoteByAccountRemoteId(
    accountRemoteId: string,
  ): Promise<Result<BusinessNoteModel | null>> {
    try {
      const normalizedAccountRemoteId = normalizeRequired(accountRemoteId);
      if (!normalizedAccountRemoteId) {
        throw new Error("Account remote id is required");
      }

      const note = await findBusinessNoteByAccountRemoteId(
        database,
        normalizedAccountRemoteId,
      );

      return {
        success: true,
        value: note,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async saveBusinessNoteByAccountRemoteId({
    accountRemoteId,
    noteContent,
  }: {
    accountRemoteId: string;
    noteContent: string;
  }): Promise<Result<BusinessNoteModel>> {
    try {
      const normalizedAccountRemoteId = normalizeRequired(accountRemoteId);
      if (!normalizedAccountRemoteId) {
        throw new Error("Account remote id is required");
      }

      const normalizedNoteContent = normalizeNoteContent(noteContent);
      const existingRecords = await getBusinessNotesByAccountRemoteId(
        database,
        normalizedAccountRemoteId,
      );
      const existing = existingRecords[0] ?? null;
      const duplicateRecords = existingRecords.slice(1);

      if (existing) {
        await database.write(async () => {
          await existing.update((record) => {
            record.noteContent = normalizedNoteContent;
            setUpdatedAt(record, Date.now());
          });

          for (const duplicateRecord of duplicateRecords) {
            await duplicateRecord.destroyPermanently();
          }
        });

        return {
          success: true,
          value: existing,
        };
      }

      const collection = database.get<BusinessNoteModel>(BUSINESS_NOTES_TABLE);
      let created!: BusinessNoteModel;

      await database.write(async () => {
        created = await collection.create((record) => {
          const now = Date.now();
          record.accountRemoteId = normalizedAccountRemoteId;
          record.noteContent = normalizedNoteContent;
          setCreatedAndUpdatedAt(record, now);
        });
      });

      return {
        success: true,
        value: created,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },
});
