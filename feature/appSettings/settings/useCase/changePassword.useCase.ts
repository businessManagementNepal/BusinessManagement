import {
  ChangePasswordPayload,
  SettingsOperationResult,
} from "@/feature/appSettings/settings/types/settings.types";

export interface ChangePasswordUseCase {
  execute(payload: ChangePasswordPayload): Promise<SettingsOperationResult>;
}
