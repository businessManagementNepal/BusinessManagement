import { SettingsOperationResult } from "@/feature/appSettings/settings/types/settings.types";

export interface DeleteLocalProfileDataUseCase {
  execute(): Promise<SettingsOperationResult>;
}
