import { BusinessProfileRepository } from "../data/repository/businessProfile.repository";
import { GetBusinessProfileByAccountRemoteIdUseCase } from "./getBusinessProfileByAccountRemoteId.useCase";

export const createGetBusinessProfileByAccountRemoteIdUseCase = (
  repository: BusinessProfileRepository,
): GetBusinessProfileByAccountRemoteIdUseCase => ({
  async execute(accountRemoteId: string) {
    return repository.getBusinessProfileByAccountRemoteId(accountRemoteId);
  },
});
