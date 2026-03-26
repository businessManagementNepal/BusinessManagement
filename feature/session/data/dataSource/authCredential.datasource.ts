import { Result } from "@/shared/types/result.types";
import {
  CredentialTypeValue,
  SaveAuthCredentialPayload,
} from "../../types/authSession.types";
import { AuthCredentialModel } from "./db/authCredential.model";

export interface AuthCredentialDatasource {
  saveAuthCredential(
    payload: SaveAuthCredentialPayload,
  ): Promise<Result<AuthCredentialModel>>;
  getActiveAuthCredentialByLoginId(
    loginId: string,
    credentialType: CredentialTypeValue,
  ): Promise<Result<AuthCredentialModel>>;
  getAuthCredentialByUserRemoteId(
    userRemoteId: string,
  ): Promise<Result<AuthCredentialModel>>;
  recordFailedLoginAttemptByRemoteId(
    remoteId: string,
    maxFailedAttempts: number,
    lockoutDurationMs: number,
  ): Promise<Result<AuthCredentialModel>>;
  markLoginSuccessByRemoteId(remoteId: string): Promise<Result<boolean>>;
  updateLastLoginAtByRemoteId(remoteId: string): Promise<Result<boolean>>;
  deactivateAuthCredentialByRemoteId(
    remoteId: string,
  ): Promise<Result<boolean>>;
}