import { SettingsOperationResult } from "@/feature/appSettings/settings/types/settings.types";

export interface UpdateBiometricLoginPreferenceUseCase {
  execute(enabled: boolean): Promise<SettingsOperationResult>;
}
