import {
  AuthCredentialNotFoundError,
  AuthCredentialResult,
  AuthOperationResult,
  AuthSessionDatabaseError,
  AuthSessionError,
  AuthSessionUnknownError,
  CredentialTypeValue,
  SaveAuthCredentialPayload,
} from "../../types/authSession.types";
import { AuthCredentialDatasource } from "../dataSource/authCredential.datasource";
import { AuthCredentialRepository } from "./authCredential.repository";
import { mapAuthCredentialModelToDomain } from "./mapper/authCredential.mapper";

export const createAuthCredentialRepository = (
  localDatasource: AuthCredentialDatasource,
): AuthCredentialRepository => ({
  async saveAuthCredential(
    payload: SaveAuthCredentialPayload,
  ): Promise<AuthCredentialResult> {
    const result = await localDatasource.saveAuthCredential(payload);

    if (result.success) {
      return mapCredentialModel(result.value);
    }

    return {
      success: false,
      error: mapAuthCredentialError(result.error),
    };
  },

  async getActiveAuthCredentialByLoginId(
    loginId: string,
    credentialType: CredentialTypeValue,
  ): Promise<AuthCredentialResult> {
    const result = await localDatasource.getActiveAuthCredentialByLoginId(
      loginId,
      credentialType,
    );

    if (result.success) {
      return mapCredentialModel(result.value);
    }

    return {
      success: false,
      error: mapAuthCredentialError(result.error),
    };
  },

  async getAuthCredentialByUserRemoteId(
    userRemoteId: string,
  ): Promise<AuthCredentialResult> {
    const result = await localDatasource.getAuthCredentialByUserRemoteId(
      userRemoteId,
    );

    if (result.success) {
      return mapCredentialModel(result.value);
    }

    return {
      success: false,
      error: mapAuthCredentialError(result.error),
    };
  },

  async recordFailedLoginAttemptByRemoteId(
    remoteId: string,
    maxFailedAttempts: number,
    lockoutDurationMs: number,
  ): Promise<AuthCredentialResult> {
    const result = await localDatasource.recordFailedLoginAttemptByRemoteId(
      remoteId,
      maxFailedAttempts,
      lockoutDurationMs,
    );

    if (result.success) {
      return mapCredentialModel(result.value);
    }

    return {
      success: false,
      error: mapAuthCredentialError(result.error),
    };
  },

  async markLoginSuccessByRemoteId(
    remoteId: string,
  ): Promise<AuthOperationResult> {
    const result = await localDatasource.markLoginSuccessByRemoteId(remoteId);

    if (result.success) {
      return { success: true, value: result.value };
    }

    return {
      success: false,
      error: mapAuthCredentialError(result.error),
    };
  },

  async updateLastLoginAtByRemoteId(
    remoteId: string,
  ): Promise<AuthOperationResult> {
    const result = await localDatasource.updateLastLoginAtByRemoteId(remoteId);

    if (result.success) {
      return { success: true, value: result.value };
    }

    return {
      success: false,
      error: mapAuthCredentialError(result.error),
    };
  },

  async deactivateAuthCredentialByRemoteId(
    remoteId: string,
  ): Promise<AuthOperationResult> {
    const result = await localDatasource.deactivateAuthCredentialByRemoteId(
      remoteId,
    );

    if (result.success) {
      return { success: true, value: result.value };
    }

    return {
      success: false,
      error: mapAuthCredentialError(result.error),
    };
  },
});

const mapCredentialModel = async (
  model: Parameters<typeof mapAuthCredentialModelToDomain>[0],
): Promise<AuthCredentialResult> => {
  try {
    return {
      success: true,
      value: await mapAuthCredentialModelToDomain(model),
    };
  } catch (error) {
    return {
      success: false,
      error: mapAuthCredentialError(error),
    };
  }
};

const mapAuthCredentialError = (error: Error | unknown): AuthSessionError => {
  if (!(error instanceof Error)) {
    return AuthSessionUnknownError;
  }

  const message = error.message.toLowerCase();

  if (
    message.includes("auth credential not found") ||
    message.includes("active auth credential not found")
  ) {
    return AuthCredentialNotFoundError;
  }

  const isDatabaseError =
    message.includes("table") ||
    message.includes("schema") ||
    message.includes("database") ||
    message.includes("adapter") ||
    message.includes("timeout");

  if (isDatabaseError) {
    return AuthSessionDatabaseError;
  }

  return AuthSessionUnknownError;
};
