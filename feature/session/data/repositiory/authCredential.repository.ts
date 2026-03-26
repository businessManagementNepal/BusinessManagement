import {
  AuthCredentialResult,
  AuthOperationResult,
  SaveAuthCredentialPayload,
} from "../../types/authSession.types";

export interface AuthCredentialRepository {
  saveAuthCredential(
    payload: SaveAuthCredentialPayload,
  ): Promise<AuthCredentialResult>;
  getActiveAuthCredentialByLoginId(
    loginId: string,
  ): Promise<AuthCredentialResult>;
  getAuthCredentialByUserRemoteId(
    userRemoteId: string,
  ): Promise<AuthCredentialResult>;
  updateLastLoginAtByRemoteId(remoteId: string): Promise<AuthOperationResult>;
  deactivateAuthCredentialByRemoteId(
    remoteId: string,
  ): Promise<AuthOperationResult>;
}