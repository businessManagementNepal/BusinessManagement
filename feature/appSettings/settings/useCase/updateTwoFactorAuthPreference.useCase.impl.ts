import { SettingsRepository } from "../data/repository/settings.repository";
import { UpdateTwoFactorAuthPreferenceUseCase } from "./updateTwoFactorAuthPreference.useCase";

export const createUpdateTwoFactorAuthPreferenceUseCase = (
  settingsRepository: SettingsRepository,
): UpdateTwoFactorAuthPreferenceUseCase => ({
  async execute(enabled: boolean) {
    return settingsRepository.updateTwoFactorAuthEnabled(enabled);
  },
});
