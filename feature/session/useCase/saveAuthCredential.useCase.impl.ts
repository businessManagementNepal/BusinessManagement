import { AuthCredentialRepository } from "../data/repository/authCredential.repository";
import {
  AuthCredentialResult,
  AuthSessionValidationError,
  SaveAuthCredentialPayload,
} from "../types/authSession.types";
import { SaveAuthCredentialUseCase } from "./saveAuthCredential.useCase";

export const createSaveAuthCredentialUseCase = (
  authCredentialRepository: AuthCredentialRepository,
): SaveAuthCredentialUseCase => ({
  async execute(
    payload: SaveAuthCredentialPayload,
  ): Promise<AuthCredentialResult> {
    if (!payload.remoteId.trim()) {
      return {
        success: false,
        error: AuthSessionValidationError("Remote id is required."),
      };
    }

    if (!payload.userRemoteId.trim()) {
      return {
        success: false,
        error: AuthSessionValidationError("User remote id is required."),
      };
    }

    if (!payload.loginId.trim()) {
      return {
        success: false,
        error: AuthSessionValidationError("Login id is required."),
      };
    }

    if (!payload.passwordHash.trim()) {
      return {
        success: false,
        error: AuthSessionValidationError("Password hash is required."),
      };
    }

    if (!payload.passwordSalt.trim()) {
      return {
        success: false,
        error: AuthSessionValidationError("Password salt is required."),
      };
    }

    return authCredentialRepository.saveAuthCredential(payload);
  },
});
