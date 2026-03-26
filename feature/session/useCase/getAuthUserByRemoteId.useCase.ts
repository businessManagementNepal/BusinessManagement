import { AuthUserResult } from "../types/authSession.types";

export interface GetAuthUserByRemoteIdUseCase {
  execute(remoteId: string): Promise<AuthUserResult>;
}