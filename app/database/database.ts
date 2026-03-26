import { migrations } from "@/app/database/migration";
import { appSettingsDbConfig } from "@/feature/session/data/dataSource/db/appSettingsDbConfig";
import { authCredentialDbConfig } from "@/feature/session/data/dataSource/db/authCredentialDbConfig";
import { authUserDbConfig } from "@/feature/session/data/dataSource/db/authUserDbConfig";
import { createDatabase } from "@/shared/database/createDatabase";
import { appSchema } from "@nozbe/watermelondb";

const schema = appSchema({
  version: 12,
  tables: [
    ...authUserDbConfig.tables,
    ...authCredentialDbConfig.tables,
    ...appSettingsDbConfig.tables,
  ],
});

export const database = createDatabase({
  schema,
  models: [
    ...authUserDbConfig.models,
    ...authCredentialDbConfig.models,
    ...appSettingsDbConfig.models,
  ],
  migrations,
});

export default database;