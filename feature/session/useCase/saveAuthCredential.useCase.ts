import {
  AuthCredentialResult,
  SaveAuthCredentialPayload,
} from "../types/authSession.types";

export interface SaveAuthCredentialUseCase {
  execute(payload: SaveAuthCredentialPayload): Promise<AuthCredentialResult>;
}