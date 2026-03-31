import { BusinessProfileRepository } from "../data/repository/businessProfile.repository";
import { GetBusinessProfilesByOwnerUserRemoteIdUseCase } from "./getBusinessProfilesByOwnerUserRemoteId.useCase";

export const createGetBusinessProfilesByOwnerUserRemoteIdUseCase = (
  repository: BusinessProfileRepository,
): GetBusinessProfilesByOwnerUserRemoteIdUseCase => ({
  async execute(ownerUserRemoteId: string) {
    return repository.getBusinessProfilesByOwnerUserRemoteId(ownerUserRemoteId);
  },
});
