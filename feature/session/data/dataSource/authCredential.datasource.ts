import { Result } from "@/shared/types/result.types";
import { AuthCredentialModel } from "./db/authCredential.model";
import { SaveAuthCredentialPayload } from "../../types/authSession.types";

export interface AuthCredentialDatasource {
  saveAuthCredential(
    payload: SaveAuthCredentialPayload,
  ): Promise<Result<AuthCredentialModel>>;
  getActiveAuthCredentialByLoginId(
    loginId: string,
  ): Promise<Result<AuthCredentialModel>>;
  getAuthCredentialByUserRemoteId(
    userRemoteId: string,
  ): Promise<Result<AuthCredentialModel>>;
  updateLastLoginAtByRemoteId(remoteId: string): Promise<Result<boolean>>;
  deactivateAuthCredentialByRemoteId(
    remoteId: string,
  ): Promise<Result<boolean>>;
}
