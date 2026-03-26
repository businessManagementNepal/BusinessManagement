import { Database, Q } from "@nozbe/watermelondb";
import { Result } from "@/shared/types/result.types";
import { createDatabaseFieldEncryptionService } from "@/shared/utils/security/databaseFieldEncryption.service";
import {
  CredentialTypeValue,
  RecordSyncStatus,
  SaveAuthCredentialPayload,
} from "../../types/authSession.types";
import { AuthCredentialDatasource } from "./authCredential.datasource";
import { AuthCredentialModel } from "./db/authCredential.model";

const AUTH_CREDENTIALS_TABLE = "auth_credentials";
const databaseFieldEncryptionService = createDatabaseFieldEncryptionService();

const normalizeLoginId = (loginId: string): string =>
  loginId.trim().toLowerCase();

const setCreatedAndUpdatedAt = (record: AuthCredentialModel, now: number) => {
  (record as unknown as { _raw: Record<string, number> })._raw.created_at = now;
  (record as unknown as { _raw: Record<string, number> })._raw.updated_at = now;
};

const setUpdatedAt = (record: AuthCredentialModel, now: number) => {
  (record as unknown as { _raw: Record<string, number> })._raw.updated_at = now;
};

const updateSyncStatusOnMutation = (record: AuthCredentialModel) => {
  if (!record.recordSyncStatus) {
    record.recordSyncStatus = RecordSyncStatus.PendingUpdate;
    return;
  }

  if (record.recordSyncStatus === RecordSyncStatus.Synced) {
    record.recordSyncStatus = RecordSyncStatus.PendingUpdate;
  }
};

const findByRemoteId = async (
  database: Database,
  remoteId: string,
): Promise<AuthCredentialModel | null> => {
  const collection = database.get<AuthCredentialModel>(AUTH_CREDENTIALS_TABLE);
  const matchingRecords = await collection
    .query(Q.where("remote_id", remoteId.trim()))
    .fetch();
  return matchingRecords[0] ?? null;
};

export const createLocalAuthCredentialDatasource = (
  database: Database,
): AuthCredentialDatasource => ({
  async saveAuthCredential(
    payload: SaveAuthCredentialPayload,
  ): Promise<Result<AuthCredentialModel>> {
    try {
      const normalizedLoginId = normalizeLoginId(payload.loginId);

      if (!normalizedLoginId) {
        throw new Error("Login id is required");
      }

      const encryptedPasswordHash = await databaseFieldEncryptionService.encrypt(
        payload.passwordHash,
      );
      const encryptedPasswordSalt = await databaseFieldEncryptionService.encrypt(
        payload.passwordSalt,
      );
      const encryptedHint = await databaseFieldEncryptionService.encryptNullable(
        payload.hint,
      );

      const authCredentialsCollection = database.get<AuthCredentialModel>(
        AUTH_CREDENTIALS_TABLE,
      );

      const matchingCredentials = await authCredentialsCollection
        .query(Q.where("remote_id", payload.remoteId))
        .fetch();

      const existingCredential = matchingCredentials[0];

      if (existingCredential) {
        await database.write(async () => {
          await existingCredential.update((record) => {
            record.remoteId = payload.remoteId;
            record.userRemoteId = payload.userRemoteId;
            record.loginId = normalizedLoginId;
            record.credentialType = payload.credentialType;
            record.passwordHash = encryptedPasswordHash;
            record.passwordSalt = encryptedPasswordSalt;
            record.hint = encryptedHint;
            record.isActive = payload.isActive;
            updateSyncStatusOnMutation(record);
            setUpdatedAt(record, Date.now());
          });
        });

        return { success: true, value: existingCredential };
      }

      let createdCredential!: AuthCredentialModel;

      await database.write(async () => {
        createdCredential = await authCredentialsCollection.create((record) => {
          const now = Date.now();

          record.remoteId = payload.remoteId;
          record.userRemoteId = payload.userRemoteId;
          record.loginId = normalizedLoginId;
          record.credentialType = payload.credentialType;
          record.passwordHash = encryptedPasswordHash;
          record.passwordSalt = encryptedPasswordSalt;
          record.hint = encryptedHint;
          record.lastLoginAt = null;
          record.isActive = payload.isActive;
          record.failedAttemptCount = 0;
          record.lockoutUntil = null;
          record.lastFailedLoginAt = null;

          record.recordSyncStatus = RecordSyncStatus.PendingCreate;
          record.lastSyncedAt = null;
          record.deletedAt = null;

          setCreatedAndUpdatedAt(record, now);
        });
      });

      return { success: true, value: createdCredential };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async getActiveAuthCredentialByLoginId(
    loginId: string,
    credentialType: CredentialTypeValue,
  ): Promise<Result<AuthCredentialModel>> {
    try {
      const normalizedLoginId = normalizeLoginId(loginId);

      if (!normalizedLoginId) {
        throw new Error("Login id is required");
      }

      const authCredentialsCollection = database.get<AuthCredentialModel>(
        AUTH_CREDENTIALS_TABLE,
      );

      const matchingCredentials = await authCredentialsCollection
        .query(
          Q.where("login_id", normalizedLoginId),
          Q.where("credential_type", credentialType),
          Q.where("is_active", true),
          Q.sortBy("updated_at", Q.desc),
        )
        .fetch();

      if (matchingCredentials.length === 0) {
        throw new Error("Active auth credential not found");
      }

      return { success: true, value: matchingCredentials[0] };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async getAuthCredentialByUserRemoteId(
    userRemoteId: string,
  ): Promise<Result<AuthCredentialModel>> {
    try {
      const authCredentialsCollection = database.get<AuthCredentialModel>(
        AUTH_CREDENTIALS_TABLE,
      );

      const matchingCredentials = await authCredentialsCollection
        .query(
          Q.where("user_remote_id", userRemoteId),
          Q.sortBy("updated_at", Q.desc),
        )
        .fetch();

      if (matchingCredentials.length === 0) {
        throw new Error("Auth credential not found");
      }

      return { success: true, value: matchingCredentials[0] };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async recordFailedLoginAttemptByRemoteId(
    remoteId: string,
    maxFailedAttempts: number,
    lockoutDurationMs: number,
  ): Promise<Result<AuthCredentialModel>> {
    try {
      const targetCredential = await findByRemoteId(database, remoteId);

      if (!targetCredential) {
        throw new Error("Auth credential not found");
      }

      await database.write(async () => {
        await targetCredential.update((record) => {
          const now = Date.now();
          const hasLockoutExpired =
            record.lockoutUntil !== null && record.lockoutUntil <= now;
          const baselineCount = hasLockoutExpired
            ? 0
            : (record.failedAttemptCount ?? 0);
          const nextFailedCount = baselineCount + 1;
          const shouldLock = nextFailedCount >= maxFailedAttempts;

          record.failedAttemptCount = shouldLock
            ? maxFailedAttempts
            : nextFailedCount;
          record.lastFailedLoginAt = now;
          record.lockoutUntil = shouldLock ? now + lockoutDurationMs : null;

          updateSyncStatusOnMutation(record);
          setUpdatedAt(record, now);
        });
      });

      return { success: true, value: targetCredential };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async markLoginSuccessByRemoteId(remoteId: string): Promise<Result<boolean>> {
    try {
      const targetCredential = await findByRemoteId(database, remoteId);

      if (!targetCredential) {
        throw new Error("Auth credential not found");
      }

      await database.write(async () => {
        await targetCredential.update((record) => {
          const now = Date.now();

          record.lastLoginAt = now;
          record.failedAttemptCount = 0;
          record.lockoutUntil = null;
          record.lastFailedLoginAt = null;

          updateSyncStatusOnMutation(record);
          setUpdatedAt(record, now);
        });
      });

      return { success: true, value: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async updateLastLoginAtByRemoteId(
    remoteId: string,
  ): Promise<Result<boolean>> {
    try {
      const targetCredential = await findByRemoteId(database, remoteId);

      if (!targetCredential) {
        throw new Error("Auth credential not found");
      }

      await database.write(async () => {
        await targetCredential.update((record) => {
          const now = Date.now();
          record.lastLoginAt = now;
          updateSyncStatusOnMutation(record);
          setUpdatedAt(record, now);
        });
      });

      return { success: true, value: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async deactivateAuthCredentialByRemoteId(
    remoteId: string,
  ): Promise<Result<boolean>> {
    try {
      const targetCredential = await findByRemoteId(database, remoteId);

      if (!targetCredential) {
        return { success: true, value: true };
      }

      await database.write(async () => {
        await targetCredential.update((record) => {
          record.isActive = false;
          updateSyncStatusOnMutation(record);
          setUpdatedAt(record, Date.now());
        });
      });

      return { success: true, value: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },
});
