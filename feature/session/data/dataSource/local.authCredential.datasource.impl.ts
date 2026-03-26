import { Database, Q } from "@nozbe/watermelondb";
import { Result } from "@/shared/types/result.types";
import { AuthCredentialModel } from "./db/authCredential.model";
import { AuthCredentialDatasource } from "./authCredential.datasource";
import { SaveAuthCredentialPayload } from "../../types/authSession.types";

const AUTH_CREDENTIALS_TABLE = "auth_credentials";

export const createLocalAuthCredentialDatasource = (
  database: Database,
): AuthCredentialDatasource => ({
  async saveAuthCredential(
    payload: SaveAuthCredentialPayload,
  ): Promise<Result<AuthCredentialModel>> {
    try {
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
            record.loginId = payload.loginId;
            record.credentialType = payload.credentialType;
            record.passwordHash = payload.passwordHash;
            record.passwordSalt = payload.passwordSalt;
            record.hint = payload.hint;
            record.isActive = payload.isActive;
          });
        });

        return { success: true, value: existingCredential };
      }

      let createdCredential!: AuthCredentialModel;

      await database.write(async () => {
        createdCredential = await authCredentialsCollection.create((record) => {
          record.remoteId = payload.remoteId;
          record.userRemoteId = payload.userRemoteId;
          record.loginId = payload.loginId;
          record.credentialType = payload.credentialType;
          record.passwordHash = payload.passwordHash;
          record.passwordSalt = payload.passwordSalt;
          record.hint = payload.hint;
          record.isActive = payload.isActive;
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
  ): Promise<Result<AuthCredentialModel>> {
    try {
      const authCredentialsCollection = database.get<AuthCredentialModel>(
        AUTH_CREDENTIALS_TABLE,
      );

      const matchingCredentials = await authCredentialsCollection
        .query(Q.where("login_id", loginId), Q.where("is_active", true))
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
        .query(Q.where("user_remote_id", userRemoteId))
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

  async updateLastLoginAtByRemoteId(
    remoteId: string,
  ): Promise<Result<boolean>> {
    try {
      const authCredentialsCollection = database.get<AuthCredentialModel>(
        AUTH_CREDENTIALS_TABLE,
      );

      const matchingCredentials = await authCredentialsCollection
        .query(Q.where("remote_id", remoteId))
        .fetch();

      const targetCredential = matchingCredentials[0];

      if (!targetCredential) {
        throw new Error("Auth credential not found");
      }

      await database.write(async () => {
        await targetCredential.update((record) => {
          record.lastLoginAt = Date.now();
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
      const authCredentialsCollection = database.get<AuthCredentialModel>(
        AUTH_CREDENTIALS_TABLE,
      );

      const matchingCredentials = await authCredentialsCollection
        .query(Q.where("remote_id", remoteId))
        .fetch();

      const targetCredential = matchingCredentials[0];

      if (!targetCredential) {
        return { success: true, value: true };
      }

      await database.write(async () => {
        await targetCredential.update((record) => {
          record.isActive = false;
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
