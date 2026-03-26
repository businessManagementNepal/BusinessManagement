import { AuthOperationResult } from "../types/authSession.types";

export interface UpdateLastLoginAtByRemoteIdUseCase {
  execute(remoteId: string): Promise<AuthOperationResult>;
}