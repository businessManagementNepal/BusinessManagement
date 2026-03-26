import { AppSettingsModel } from "./appSettings.model";
import { appSettingsTable } from "./appSettings.schema";

export const appSettingsDbConfig = {
  models: [AppSettingsModel],
  tables: [appSettingsTable],
};