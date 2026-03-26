import { Database, Q } from "@nozbe/watermelondb";
import { Result } from "@/shared/types/result.types";
import { createDatabaseFieldEncryptionService } from "@/shared/utils/security/databaseFieldEncryption.service";
import {
  RecordSyncStatus,
  SaveAuthUserPayload,
} from "../../types/authSession.types";
import { AuthUserDatasource } from "./authUser.datasource";
import { AuthUserModel } from "./db/authUser.model";

const AUTH_USERS_TABLE = "auth_users";
const databaseFieldEncryptionService = createDatabaseFieldEncryptionService();

const setCreatedAndUpdatedAt = (record: AuthUserModel, now: number) => {
  (record as unknown as { _raw: Record<string, number> })._raw.created_at = now;
  (record as unknown as { _raw: Record<string, number> })._raw.updated_at = now;
};

const setUpdatedAt = (record: AuthUserModel, now: number) => {
  (record as unknown as { _raw: Record<string, number> })._raw.updated_at = now;
};

const updateSyncStatusOnMutation = (record: AuthUserModel) => {
  if (!record.recordSyncStatus) {
    record.recordSyncStatus = RecordSyncStatus.PendingUpdate;
    return;
  }

  if (record.recordSyncStatus === RecordSyncStatus.Synced) {
    record.recordSyncStatus = RecordSyncStatus.PendingUpdate;
  }
};

export const createLocalAuthUserDatasource = (
  database: Database,
): AuthUserDatasource => ({
  async saveAuthUser(
    payload: SaveAuthUserPayload,
  ): Promise<Result<AuthUserModel>> {
    try {
      const encryptedFullName = await databaseFieldEncryptionService.encrypt(
        payload.fullName,
      );
      const encryptedEmail = await databaseFieldEncryptionService.encryptNullable(
        payload.email,
      );
      const encryptedPhone = await databaseFieldEncryptionService.encryptNullable(
        payload.phone,
      );
      const encryptedAuthProvider =
        await databaseFieldEncryptionService.encryptNullable(payload.authProvider);
      const encryptedProfileImageUrl =
        await databaseFieldEncryptionService.encryptNullable(payload.profileImageUrl);
      const encryptedPreferredLanguage =
        await databaseFieldEncryptionService.encryptNullable(payload.preferredLanguage);

      const authUsersCollection = database.get<AuthUserModel>(AUTH_USERS_TABLE);

      const matchingUsers = await authUsersCollection
        .query(Q.where("remote_id", payload.remoteId))
        .fetch();

      const existingUser = matchingUsers[0];

      if (existingUser) {
        await database.write(async () => {
          await existingUser.update((record) => {
            record.remoteId = payload.remoteId;
            record.fullName = encryptedFullName;
            record.email = encryptedEmail;
            record.phone = encryptedPhone;
            record.authProvider = encryptedAuthProvider;
            record.profileImageUrl = encryptedProfileImageUrl;
            record.preferredLanguage = encryptedPreferredLanguage;
            record.isEmailVerified = payload.isEmailVerified;
            record.isPhoneVerified = payload.isPhoneVerified;
            updateSyncStatusOnMutation(record);
            setUpdatedAt(record, Date.now());
          });
        });

        return { success: true, value: existingUser };
      }

      let createdUser!: AuthUserModel;

      await database.write(async () => {
        createdUser = await authUsersCollection.create((record) => {
          const now = Date.now();

          record.remoteId = payload.remoteId;
          record.fullName = encryptedFullName;
          record.email = encryptedEmail;
          record.phone = encryptedPhone;
          record.authProvider = encryptedAuthProvider;
          record.profileImageUrl = encryptedProfileImageUrl;
          record.preferredLanguage = encryptedPreferredLanguage;
          record.isEmailVerified = payload.isEmailVerified;
          record.isPhoneVerified = payload.isPhoneVerified;

          record.recordSyncStatus = RecordSyncStatus.PendingCreate;
          record.lastSyncedAt = null;
          record.deletedAt = null;

          setCreatedAndUpdatedAt(record, now);
        });
      });

      return { success: true, value: createdUser };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async getAuthUserByRemoteId(
    remoteId: string,
  ): Promise<Result<AuthUserModel>> {
    try {
      const authUsersCollection = database.get<AuthUserModel>(AUTH_USERS_TABLE);

      const matchingUsers = await authUsersCollection
        .query(Q.where("remote_id", remoteId), Q.sortBy("updated_at", Q.desc))
        .fetch();

      if (matchingUsers.length === 0) {
        throw new Error("Auth user not found");
      }

      return { success: true, value: matchingUsers[0] };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async getAllAuthUsers(): Promise<Result<AuthUserModel[]>> {
    try {
      const authUsersCollection = database.get<AuthUserModel>(AUTH_USERS_TABLE);

      const authUsers = await authUsersCollection
        .query(Q.sortBy("updated_at", Q.desc))
        .fetch();

      return { success: true, value: authUsers };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async deleteAuthUserByRemoteId(remoteId: string): Promise<Result<boolean>> {
    try {
      const authUsersCollection = database.get<AuthUserModel>(AUTH_USERS_TABLE);

      const matchingUsers = await authUsersCollection
        .query(Q.where("remote_id", remoteId))
        .fetch();

      const targetUser = matchingUsers[0];

      if (!targetUser) {
        return { success: true, value: true };
      }

      await database.write(async () => {
        await targetUser.destroyPermanently();
      });

      return { success: true, value: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async clearAllAuthUsers(): Promise<Result<boolean>> {
    try {
      const authUsersCollection = database.get<AuthUserModel>(AUTH_USERS_TABLE);

      const authUsers = await authUsersCollection.query().fetch();

      await database.write(async () => {
        for (const authUser of authUsers) {
          await authUser.destroyPermanently();
        }
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
