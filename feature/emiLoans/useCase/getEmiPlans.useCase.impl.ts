import { EmiRepository } from "@/feature/emiLoans/data/repository/emi.repository";
import { EmiPlanMode } from "@/feature/emiLoans/types/emi.entity.types";
import { EmiValidationError } from "@/feature/emiLoans/types/emi.error.types";
import { GetEmiPlansUseCase } from "./getEmiPlans.useCase";

export const createGetEmiPlansUseCase = (
  emiRepository: EmiRepository,
): GetEmiPlansUseCase => ({
  async execute({ planMode, ownerUserRemoteId, businessAccountRemoteId }) {
    if (planMode === EmiPlanMode.Personal) {
      const normalizedOwnerUserRemoteId = ownerUserRemoteId?.trim() || "";

      if (!normalizedOwnerUserRemoteId) {
        return { success: false, error: EmiValidationError("User context is required.") };
      }

      return emiRepository.getPersonalPlansByOwnerUserRemoteId(
        normalizedOwnerUserRemoteId,
      );
    }

    const normalizedBusinessAccountRemoteId = businessAccountRemoteId?.trim() || "";

    if (!normalizedBusinessAccountRemoteId) {
      return {
        success: false,
        error: EmiValidationError("Business account context is required."),
      };
    }

    return emiRepository.getBusinessPlansByBusinessAccountRemoteId(
      normalizedBusinessAccountRemoteId,
    );
  },
});
