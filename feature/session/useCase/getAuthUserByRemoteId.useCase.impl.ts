import { AuthUserRepository } from "../data/repository/authUser.repository";
import {
    AuthSessionValidationError,
    AuthUserResult,
} from "../types/authSession.types";
import { GetAuthUserByRemoteIdUseCase } from "./getAuthUserByRemoteId.useCase";

export const createGetAuthUserByRemoteIdUseCase = (
  authUserRepository: AuthUserRepository,
): GetAuthUserByRemoteIdUseCase => ({
  async execute(remoteId: string): Promise<AuthUserResult> {
    if (!remoteId.trim()) {
      return {
        success: false,
        error: AuthSessionValidationError("Remote id is required."),
      };
    }

    return authUserRepository.getAuthUserByRemoteId(remoteId);
  },
});
