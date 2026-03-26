import { AuthCredentialRepository } from "../data/repository/authCredential.repository";
import {
  AuthOperationResult,
  AuthSessionValidationError,
} from "../types/authSession.types";
import { UpdateLastLoginAtByRemoteIdUseCase } from "./updateLastLoginAtByRemoteId.useCase";

export const createUpdateLastLoginAtByRemoteIdUseCase = (
  authCredentialRepository: AuthCredentialRepository,
): UpdateLastLoginAtByRemoteIdUseCase => ({
  async execute(remoteId: string): Promise<AuthOperationResult> {
    if (!remoteId.trim()) {
      return {
        success: false,
        error: AuthSessionValidationError("Remote id is required."),
      };
    }

    return authCredentialRepository.updateLastLoginAtByRemoteId(remoteId);
  },
});