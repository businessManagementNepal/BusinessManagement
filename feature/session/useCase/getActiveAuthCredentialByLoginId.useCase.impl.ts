import { AuthCredentialRepository } from "../data/repository/authCredential.repository";
import {
  AuthCredentialResult,
  AuthSessionValidationError,
} from "../types/authSession.types";
import { GetActiveAuthCredentialByLoginIdUseCase } from "./getActiveAuthCredentialByLoginId.useCase";

export const createGetActiveAuthCredentialByLoginIdUseCase = (
  authCredentialRepository: AuthCredentialRepository,
): GetActiveAuthCredentialByLoginIdUseCase => ({
  async execute(loginId: string): Promise<AuthCredentialResult> {
    if (!loginId.trim()) {
      return {
        success: false,
        error: AuthSessionValidationError("Login id is required."),
      };
    }

    return authCredentialRepository.getActiveAuthCredentialByLoginId(loginId);
  },
});
