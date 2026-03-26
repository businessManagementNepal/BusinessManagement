import {
  AuthCredentialResult,
  CredentialTypeValue,
} from "../types/authSession.types";

export interface GetActiveAuthCredentialByLoginIdUseCase {
  execute(
    loginId: string,
    credentialType?: CredentialTypeValue,
  ): Promise<AuthCredentialResult>;
}