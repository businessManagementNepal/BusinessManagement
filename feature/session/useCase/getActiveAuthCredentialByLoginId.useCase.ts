import { AuthCredentialResult } from "../types/authSession.types";

export interface GetActiveAuthCredentialByLoginIdUseCase {
  execute(loginId: string): Promise<AuthCredentialResult>;
}