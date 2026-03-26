import { Database, Q } from "@nozbe/watermelondb";
import { Result } from "@/shared/types/result.types";
import { AuthUserModel } from "./db/authUser.model";
import { AuthUserDatasource } from "./authUser.datasource";
import { SaveAuthUserPayload } from "../../types/authSession.types";

const AUTH_USERS_TABLE = "auth_users";

export const createLocalAuthUserDatasource = (
  database: Database,
): AuthUserDatasource => ({
  async saveAuthUser(
    payload: SaveAuthUserPayload,
  ): Promise<Result<AuthUserModel>> {
    try {
      const authUsersCollection = database.get<AuthUserModel>(AUTH_USERS_TABLE);

      const matchingUsers = await authUsersCollection
        .query(Q.where("remote_id", payload.remoteId))
        .fetch();

      const existingUser = matchingUsers[0];

      if (existingUser) {
        await database.write(async () => {
          await existingUser.update((record) => {
            record.remoteId = payload.remoteId;
            record.fullName = payload.fullName;
            record.email = payload.email;
            record.phone = payload.phone;
            record.authProvider = payload.authProvider;
            record.profileImageUrl = payload.profileImageUrl;
            record.preferredLanguage = payload.preferredLanguage;
            record.isEmailVerified = payload.isEmailVerified;
            record.isPhoneVerified = payload.isPhoneVerified;
          });
        });

        return { success: true, value: existingUser };
      }

      let createdUser!: AuthUserModel;

      await database.write(async () => {
        createdUser = await authUsersCollection.create((record) => {
          record.remoteId = payload.remoteId;
          record.fullName = payload.fullName;
          record.email = payload.email;
          record.phone = payload.phone;
          record.authProvider = payload.authProvider;
          record.profileImageUrl = payload.profileImageUrl;
          record.preferredLanguage = payload.preferredLanguage;
          record.isEmailVerified = payload.isEmailVerified;
          record.isPhoneVerified = payload.isPhoneVerified;
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
        .query(Q.where("remote_id", remoteId))
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

      const authUsers = await authUsersCollection.query().fetch();

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
