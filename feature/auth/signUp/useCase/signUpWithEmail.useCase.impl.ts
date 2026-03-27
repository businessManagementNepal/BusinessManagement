import { SignUpRepository } from "../data/repositiory/signUp.repository";
import { SignUpInput, SignUpResult, ValidationError } from "../types/signUp.types";
import { signUpInputSchema } from "../validation/signUp.schema";
import { SignUpWithEmailUseCase } from "./signUpWithEmail.useCase";

export const createSignUpWithEmailUseCase = (
  repository: SignUpRepository,
): SignUpWithEmailUseCase => ({
  signUp: async (payload: SignUpInput): Promise<SignUpResult> => {
    const parsedPayload = signUpInputSchema.safeParse(payload);

    if (!parsedPayload.success) {
      return {
        success: false,
        error: ValidationError(
          parsedPayload.error.issues[0]?.message ?? "Invalid sign up payload.",
        ),
      };
    }

    return repository.signUpWithEmail(parsedPayload.data);
  },
});
