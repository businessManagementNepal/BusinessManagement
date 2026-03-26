import {
  AuthCredentialResult,
  AuthOperationResult,
  CredentialTypeValue,
  SaveAuthCredentialPayload,
} from "../../types/authSession.types";

export interface AuthCredentialRepository {
  saveAuthCredential(
    payload: SaveAuthCredentialPayload,
  ): Promise<AuthCredentialResult>;
  getActiveAuthCredentialByLoginId(
    loginId: string,
    credentialType: CredentialTypeValue,
  ): Promise<AuthCredentialResult>;
  getAuthCredentialByUserRemoteId(
    userRemoteId: string,
  ): Promise<AuthCredentialResult>;
  recordFailedLoginAttemptByRemoteId(
    remoteId: string,
    maxFailedAttempts: number,
    lockoutDurationMs: number,
  ): Promise<AuthCredentialResult>;
  markLoginSuccessByRemoteId(remoteId: string): Promise<AuthOperationResult>;
  updateLastLoginAtByRemoteId(remoteId: string): Promise<AuthOperationResult>;
  deactivateAuthCredentialByRemoteId(
    remoteId: string,
  ): Promise<AuthOperationResult>;
}