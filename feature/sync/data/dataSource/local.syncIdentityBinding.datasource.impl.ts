import { Result } from "@/shared/types/result.types";
import { Database, Q } from "@nozbe/watermelondb";
import {
  SyncIdentityBindingType,
  SyncIdentityBindingTypeValue,
} from "../../types/syncIdentity.types";
import {
  SaveSyncIdentityBindingPayload,
  SyncIdentityBindingDatasource,
} from "./syncIdentityBinding.datasource";
import { SyncIdentityBindingModel } from "./db/syncIdentityBinding.model";

const SYNC_IDENTITY_BINDINGS_TABLE = "sync_identity_bindings";

const setCreatedAndUpdatedAt = (
  record: SyncIdentityBindingModel,
  now: number,
) => {
  (record as unknown as { _raw: Record<string, number> })._raw.created_at = now;
  (record as unknown as { _raw: Record<string, number> })._raw.updated_at = now;
};

const setUpdatedAt = (record: SyncIdentityBindingModel, now: number) => {
  (record as unknown as { _raw: Record<string, number> })._raw.updated_at = now;
};

const normalizeOptional = (value: string | null): string | null => {
  if (value === null) {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

const findBinding = async (
  database: Database,
  bindingType: SyncIdentityBindingTypeValue,
  localUserRemoteId: string,
  localAccountRemoteId: string | null,
): Promise<SyncIdentityBindingModel | null> => {
  const collection = database.get<SyncIdentityBindingModel>(
    SYNC_IDENTITY_BINDINGS_TABLE,
  );
  const normalizedLocalAccountRemoteId = normalizeOptional(localAccountRemoteId);

  const query = collection.query(
    Q.where("binding_type", bindingType),
    Q.where("local_user_remote_id", localUserRemoteId),
    normalizedLocalAccountRemoteId === null
      ? Q.where("local_account_remote_id", null)
      : Q.where("local_account_remote_id", normalizedLocalAccountRemoteId),
  );
  const records = await query.fetch();

  return records[0] ?? null;
};

export const createLocalSyncIdentityBindingDatasource = (
  database: Database,
): SyncIdentityBindingDatasource => ({
  async saveBinding(
    payload: SaveSyncIdentityBindingPayload,
  ): Promise<Result<SyncIdentityBindingModel>> {
    try {
      const collection = database.get<SyncIdentityBindingModel>(
        SYNC_IDENTITY_BINDINGS_TABLE,
      );
      const existingBinding = await findBinding(
        database,
        payload.bindingType,
        payload.localUserRemoteId,
        payload.localAccountRemoteId,
      );

      if (existingBinding) {
        await database.write(async () => {
          await existingBinding.update((record) => {
            record.bindingType = payload.bindingType;
            record.localUserRemoteId = payload.localUserRemoteId;
            record.remoteUserRemoteId = payload.remoteUserRemoteId;
            record.localAccountRemoteId = normalizeOptional(
              payload.localAccountRemoteId,
            );
            record.remoteAccountRemoteId = normalizeOptional(
              payload.remoteAccountRemoteId,
            );
            setUpdatedAt(record, Date.now());
          });
        });

        return {
          success: true,
          value: existingBinding,
        };
      }

      let createdBinding!: SyncIdentityBindingModel;

      await database.write(async () => {
        createdBinding = await collection.create((record) => {
          const now = Date.now();
          record.bindingType = payload.bindingType;
          record.localUserRemoteId = payload.localUserRemoteId;
          record.remoteUserRemoteId = payload.remoteUserRemoteId;
          record.localAccountRemoteId = normalizeOptional(
            payload.localAccountRemoteId,
          );
          record.remoteAccountRemoteId = normalizeOptional(
            payload.remoteAccountRemoteId,
          );
          setCreatedAndUpdatedAt(record, now);
        });
      });

      return {
        success: true,
        value: createdBinding,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async getUserBindingByLocalUserRemoteId(
    localUserRemoteId: string,
  ): Promise<Result<SyncIdentityBindingModel | null>> {
    try {
      const binding = await findBinding(
        database,
        SyncIdentityBindingType.User,
        localUserRemoteId.trim(),
        null,
      );

      return {
        success: true,
        value: binding,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async getAccountBindingByLocalAccountRemoteId(
    localAccountRemoteId: string,
  ): Promise<Result<SyncIdentityBindingModel | null>> {
    try {
      const collection = database.get<SyncIdentityBindingModel>(
        SYNC_IDENTITY_BINDINGS_TABLE,
      );
      const records = await collection
        .query(
          Q.where("binding_type", SyncIdentityBindingType.Account),
          Q.where("local_account_remote_id", localAccountRemoteId.trim()),
        )
        .fetch();

      return {
        success: true,
        value: records[0] ?? null,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },
});
