import { migrations } from "@/shared/database/migration";
import { appSettingsDbConfig } from "@/feature/appSettings/data/dataSource/db/appSettingsDbConfig";
import { authCredentialDbConfig } from "@/feature/session/data/dataSource/db/authCredentialDbConfig";
import { authUserDbConfig } from "@/feature/session/data/dataSource/db/authUserDbConfig";
import { accountDbConfig } from "@/feature/setting/accounts/accountSelection/data/dataSource/db/accountDbConfig";
import { businessProfileDbConfig } from "@/feature/profile/business/data/dataSource/db/businessProfileDbConfig";
import { userManagementDbConfig } from "@/feature/setting/accounts/userManagement/data/dataSource/db/userManagementDbConfig";
import { transactionDbConfig } from "@/feature/transactions/data/dataSource/db/transactionDbConfig";
import { AppSettingsModel } from "@/feature/appSettings/data/dataSource/db/appSettings.model";
import {
  assertDatabaseSetupHealthy,
  createDatabase,
} from "@/shared/database/createDatabase";
import { appSchema } from "@nozbe/watermelondb";

const APP_SETTINGS_TABLE = "app_settings";

const schema = appSchema({
  version: 19,
  tables: [
    ...authUserDbConfig.tables,
    ...authCredentialDbConfig.tables,
    ...accountDbConfig.tables,
    ...businessProfileDbConfig.tables,
    ...appSettingsDbConfig.tables,
    ...userManagementDbConfig.tables,
    ...transactionDbConfig.tables,
  ],
});

export const database = createDatabase({
  schema,
  models: [
    ...authUserDbConfig.models,
    ...authCredentialDbConfig.models,
    ...accountDbConfig.models,
    ...businessProfileDbConfig.models,
    ...appSettingsDbConfig.models,
    ...userManagementDbConfig.models,
    ...transactionDbConfig.models,
  ],
  migrations,
});

export const ensureDatabaseReady = async (): Promise<void> => {
  assertDatabaseSetupHealthy();

  const appSettingsCollection = database.get<AppSettingsModel>(
    APP_SETTINGS_TABLE,
  );

  await appSettingsCollection.query().fetchCount();
  assertDatabaseSetupHealthy();
};

export default database;
