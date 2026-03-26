import { AuthUserRepository } from "../data/repository/authUser.repository";
import { AuthOperationResult } from "../types/authSession.types";
import { ClearAllAuthUsersUseCase } from "./clearAllAuthUsers.useCase";

export const createClearAllAuthUsersUseCase = (
  authUserRepository: AuthUserRepository,
): ClearAllAuthUsersUseCase => ({
  async execute(): Promise<AuthOperationResult> {
    return authUserRepository.clearAllAuthUsers();
  },
});