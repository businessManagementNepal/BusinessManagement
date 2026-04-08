import { SettingsRepository } from "../data/repository/settings.repository";
import { UpdateBiometricLoginPreferenceUseCase } from "./updateBiometricLoginPreference.useCase";

export const createUpdateBiometricLoginPreferenceUseCase = (
  settingsRepository: SettingsRepository,
): UpdateBiometricLoginPreferenceUseCase => ({
  async execute(enabled: boolean) {
    return settingsRepository.updateBiometricLoginEnabled(enabled);
  },
});
