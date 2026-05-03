import { AppSettingsModel } from "@/feature/appSettings/data/dataSource/db/appSettings.model";
import { setSyncEnabledState } from "@/feature/appSettings/data/appSettings.store";
import { Result } from "@/shared/types/result.types";
import { Database } from "@nozbe/watermelondb";
import { SyncFeatureFlagDatasource } from "./syncFeatureFlag.datasource";

const APP_SETTINGS_TABLE = "app_settings";
const APP_SETTINGS_SINGLETON_ID = "singleton";

const resolveSettingsRecord = (
  records: readonly AppSettingsModel[],
): AppSettingsModel | null => {
  const singletonRecord =
    records.find((record) => record.id === APP_SETTINGS_SINGLETON_ID) ?? null;
  if (singletonRecord) {
    return singletonRecord;
  }

  const sortedRecords = [...records].sort(
    (leftRecord, rightRecord) =>
      rightRecord.updatedAt.getTime() - leftRecord.updatedAt.getTime(),
  );

  return sortedRecords[0] ?? null;
};

export const createLocalSyncFeatureFlagDatasource = (
  database: Database,
): SyncFeatureFlagDatasource => ({
  async getSyncEnabled(): Promise<Result<boolean>> {
    try {
      const collection = database.get<AppSettingsModel>(APP_SETTINGS_TABLE);
      const records = await collection.query().fetch();
      const settings = resolveSettingsRecord(records);

      return {
        success: true,
        value: settings?.syncEnabled === true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async setSyncEnabled(enabled: boolean): Promise<Result<boolean>> {
    try {
      const result = await setSyncEnabledState(database, enabled);
      return {
        success: true,
        value: result.syncEnabled,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },
});
