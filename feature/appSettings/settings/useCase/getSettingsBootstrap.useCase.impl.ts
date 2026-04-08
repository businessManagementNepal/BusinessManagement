import { AuthCredentialRepository } from "@/feature/session/data/repository/authCredential.repository";
import {
  SettingsBootstrapResult,
  SettingsValidationError,
} from "@/feature/appSettings/settings/types/settings.types";
import { SettingsRepository } from "../data/repository/settings.repository";
import { GetSettingsBootstrapUseCase } from "./getSettingsBootstrap.useCase";

export const createGetSettingsBootstrapUseCase = (
  settingsRepository: SettingsRepository,
  authCredentialRepository: AuthCredentialRepository,
): GetSettingsBootstrapUseCase => ({
  async execute(userRemoteId: string): Promise<SettingsBootstrapResult> {
    const normalizedUserRemoteId = userRemoteId.trim();

    if (!normalizedUserRemoteId) {
      return {
        success: false,
        error: SettingsValidationError("An active user is required for settings."),
      };
    }

    const authCredentialResult =
      await authCredentialRepository.getAuthCredentialByUserRemoteId(
        normalizedUserRemoteId,
      );

    const passwordChangedAt = authCredentialResult.success
      ? authCredentialResult.value.updatedAt
      : null;
    const lastPasswordLoginAt = authCredentialResult.success
      ? authCredentialResult.value.lastLoginAt
      : null;

    return settingsRepository.getSettingsBootstrap({
      passwordChangedAt,
      lastPasswordLoginAt,
    });
  },
});
