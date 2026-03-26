import {
  VerifiedLocalCredentialResult,
  VerifyLocalCredentialPayload,
} from "../types/authSession.types";

export interface VerifyLocalCredentialUseCase {
  execute(
    payload: VerifyLocalCredentialPayload,
  ): Promise<VerifiedLocalCredentialResult>;
}