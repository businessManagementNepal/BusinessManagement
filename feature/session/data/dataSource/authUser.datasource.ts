import { Result } from "@/shared/types/result.types";
import { AuthUserModel } from "./db/authUser.model";
import { SaveAuthUserPayload } from "../../types/authSession.types";

export interface AuthUserDatasource {
  saveAuthUser(payload: SaveAuthUserPayload): Promise<Result<AuthUserModel>>;
  getAuthUserByRemoteId(remoteId: string): Promise<Result<AuthUserModel>>;
  getAllAuthUsers(): Promise<Result<AuthUserModel[]>>;
  deleteAuthUserByRemoteId(remoteId: string): Promise<Result<boolean>>;
  clearAllAuthUsers(): Promise<Result<boolean>>;
}
