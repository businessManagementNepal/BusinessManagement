import { LoginRepository } from "../data/repositiory/login.repository";
import { LoginInput, LoginResult, ValidationError } from "../types/login.types";
import { loginInputSchema } from "../validation/login.schema";
import { LoginWithEmailUseCase } from "./loginWithEmail.useCase";

export const createLoginWithEmailUseCase = (
  repository: LoginRepository,
): LoginWithEmailUseCase => ({
  login: async (payload: LoginInput): Promise<LoginResult> => {
    const parsedPayload = loginInputSchema.safeParse(payload);

    if (!parsedPayload.success) {
      return {
        success: false,
        error: ValidationError(
          parsedPayload.error.issues[0]?.message ?? "Invalid login payload.",
        ),
      };
    }

    return repository.loginWithEmail(parsedPayload.data);
  },
});
