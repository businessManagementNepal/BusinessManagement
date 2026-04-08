import { SettingsBootstrapResult } from "@/feature/appSettings/settings/types/settings.types";

export interface GetSettingsBootstrapUseCase {
  execute(userRemoteId: string): Promise<SettingsBootstrapResult>;
}
