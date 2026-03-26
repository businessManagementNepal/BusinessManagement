import {
  AuthOperationResult,
  AuthUserResult,
  AuthUsersResult,
  SaveAuthUserPayload,
} from "../../types/authSession.types";

export interface AuthUserRepository {
  saveAuthUser(payload: SaveAuthUserPayload): Promise<AuthUserResult>;
  getAuthUserByRemoteId(remoteId: string): Promise<AuthUserResult>;
  getAllAuthUsers(): Promise<AuthUsersResult>;
  deleteAuthUserByRemoteId(remoteId: string): Promise<AuthOperationResult>;
  clearAllAuthUsers(): Promise<AuthOperationResult>;
}