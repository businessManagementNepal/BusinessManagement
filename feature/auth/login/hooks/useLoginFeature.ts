import { useMemo } from "react";
import { createLoginWithEmailUseCase } from "../useCase/loginWithEmail.useCase.impl";
import { useLoginViewModel } from "../viewModel/login.viewModel.impl";
import { LoginRepository } from "../data/repositiory/login.repository";

type CreateLoginScreenParams = {
  repository: LoginRepository;
  onSuccess?: () => void;
};

export function useLoginFeature(params: CreateLoginScreenParams) {
  const { repository, onSuccess } = params;

  const useCase = useMemo(
    () => createLoginWithEmailUseCase(repository),
    [repository],
  );

  const viewModel = useLoginViewModel(useCase, { onSuccess });

  return { viewModel };
}
