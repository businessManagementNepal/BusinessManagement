import {
  SettingsValidationError,
  SubmitAppRatingPayload,
  SubmitAppRatingResult,
} from "@/feature/appSettings/settings/types/settings.types";
import { SettingsRepository } from "../data/repository/settings.repository";
import { SubmitAppRatingUseCase } from "./submitAppRating.useCase";

export const createSubmitAppRatingUseCase = (
  settingsRepository: SettingsRepository,
): SubmitAppRatingUseCase => ({
  async execute(payload: SubmitAppRatingPayload): Promise<SubmitAppRatingResult> {
    const normalizedUserRemoteId = payload.userRemoteId.trim();

    if (!normalizedUserRemoteId) {
      return {
        success: false,
        error: SettingsValidationError("An active user is required to rate e-Lekha."),
      };
    }

    if (!Number.isInteger(payload.starCount) || payload.starCount < 1 || payload.starCount > 5) {
      return {
        success: false,
        error: SettingsValidationError("Select a star rating before submitting."),
      };
    }

    return settingsRepository.submitAppRating({
      ...payload,
      userRemoteId: normalizedUserRemoteId,
    });
  },
});
