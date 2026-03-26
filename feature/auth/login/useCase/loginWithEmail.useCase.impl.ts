import { LoginRepository } from "../data/repositiory/login.repository";
import { LoginInput, LoginResult } from "../types/login.types";
import { LoginWithEmailUseCase } from "./loginWithEmail.useCase";

export const createLoginWithEmailUseCase = (
  repository: LoginRepository,
): LoginWithEmailUseCase => ({
  login: async (payload: LoginInput): Promise<LoginResult> => {
    return repository.loginWithEmail(payload);
  },
});
