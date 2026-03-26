import { AuthUserRepository } from "../data/repository/authUser.repository";
import {
    AuthSessionValidationError,
    AuthUserResult,
    SaveAuthUserPayload,
} from "../types/authSession.types";
import { SaveAuthUserUseCase } from "./saveAuthUser.useCase";

export const createSaveAuthUserUseCase = (
  authUserRepository: AuthUserRepository,
): SaveAuthUserUseCase => ({
  async execute(payload: SaveAuthUserPayload): Promise<AuthUserResult> {
    if (!payload.remoteId.trim()) {
      return {
        success: false,
        error: AuthSessionValidationError("Remote id is required."),
      };
    }

    if (!payload.fullName.trim()) {
      return {
        success: false,
        error: AuthSessionValidationError("Full name is required."),
      };
    }

    return authUserRepository.saveAuthUser(payload);
  },
});
