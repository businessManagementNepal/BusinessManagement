import { EmiRepository } from "@/feature/emiLoans/data/repository/emi.repository";
import { EmiValidationError } from "@/feature/emiLoans/types/emi.error.types";
import { GetEmiPlanByRemoteIdUseCase } from "./getEmiPlanByRemoteId.useCase";

export const createGetEmiPlanByRemoteIdUseCase = (
  emiRepository: EmiRepository,
): GetEmiPlanByRemoteIdUseCase => ({
  async execute(remoteId) {
    const normalizedRemoteId = remoteId.trim();

    if (!normalizedRemoteId) {
      return { success: false, error: EmiValidationError("Plan id is required.") };
    }

    return emiRepository.getPlanDetailByRemoteId(normalizedRemoteId);
  },
});
