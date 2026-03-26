import { AuthUserDatasource } from "../dataSource/authUser.datasource";
import {
  AuthOperationResult,
  AuthSessionDatabaseError,
  AuthSessionError,
  AuthSessionUnknownError,
  AuthUserNotFoundError,
  AuthUserResult,
  AuthUsersResult,
  SaveAuthUserPayload,
} from "../../types/authSession.types";
import { AuthUserRepository } from "./authUser.repository";
import { mapAuthUserModelToDomain } from "./mapper/authUser.mapper";

export const createAuthUserRepository = (
  localDatasource: AuthUserDatasource,
): AuthUserRepository => ({
  async saveAuthUser(payload: SaveAuthUserPayload): Promise<AuthUserResult> {
    const result = await localDatasource.saveAuthUser(payload);

    if (result.success) {
      return {
        success: true,
        value: mapAuthUserModelToDomain(result.value),
      };
    }

    return {
      success: false,
      error: mapAuthUserError(result.error),
    };
  },

  async getAuthUserByRemoteId(remoteId: string): Promise<AuthUserResult> {
    const result = await localDatasource.getAuthUserByRemoteId(remoteId);

    if (result.success) {
      return {
        success: true,
        value: mapAuthUserModelToDomain(result.value),
      };
    }

    return {
      success: false,
      error: mapAuthUserError(result.error),
    };
  },

  async getAllAuthUsers(): Promise<AuthUsersResult> {
    const result = await localDatasource.getAllAuthUsers();

    if (result.success) {
      return {
        success: true,
        value: result.value.map(mapAuthUserModelToDomain),
      };
    }

    return {
      success: false,
      error: mapAuthUserError(result.error),
    };
  },

  async deleteAuthUserByRemoteId(
    remoteId: string,
  ): Promise<AuthOperationResult> {
    const result = await localDatasource.deleteAuthUserByRemoteId(remoteId);

    if (result.success) {
      return { success: true, value: result.value };
    }

    return {
      success: false,
      error: mapAuthUserError(result.error),
    };
  },

  async clearAllAuthUsers(): Promise<AuthOperationResult> {
    const result = await localDatasource.clearAllAuthUsers();

    if (result.success) {
      return { success: true, value: result.value };
    }

    return {
      success: false,
      error: mapAuthUserError(result.error),
    };
  },
});

const mapAuthUserError = (error: Error | unknown): AuthSessionError => {
  if (!(error instanceof Error)) {
    return AuthSessionUnknownError;
  }

  const message = error.message.toLowerCase();

  if (message.includes("auth user not found")) {
    return AuthUserNotFoundError;
  }

  const isDatabaseError =
    message.includes("table") ||
    message.includes("schema") ||
    message.includes("database") ||
    message.includes("adapter") ||
    message.includes("timeout");

  if (isDatabaseError) {
    return {
      ...AuthSessionDatabaseError,
      message: error.message,
    };
  }

  return {
    ...AuthSessionUnknownError,
    message: error.message,
  };
};
