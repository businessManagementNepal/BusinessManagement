import { moneyAccountDbConfig } from "@/feature/accounts/data/dataSource/db/moneyAccountDbConfig";
import { AppSettingsModel } from "@/feature/appSettings/data/dataSource/db/appSettings.model";
import { appSettingsDbConfig } from "@/feature/appSettings/data/dataSource/db/appSettingsDbConfig";
import { businessNotesDbConfig } from "@/feature/appSettings/notes/data/dataSource/db/businessNoteDbConfig";
import { appRatingDbConfig } from "@/feature/appSettings/settings/data/dataSource/db/appRatingDbConfig";
import { bugReportDbConfig } from "@/feature/appSettings/settings/data/dataSource/db/bugReportDbConfig";
import { accountDbConfig } from "@/feature/auth/accountSelection/data/dataSource/db/accountDbConfig";
import { billingDbConfig } from "@/feature/billing/data/dataSource/db/billingDbConfig";
import { budgetPlanDbConfig } from "@/feature/budget/data/dataSource/db/budgetPlanDbConfig";
import { categoryDbConfig } from "@/feature/categories/data/dataSource/db/categoryDbConfig";
import { contactDbConfig } from "@/feature/contacts/data/dataSource/db/contactDbConfig";
import { emiDbConfig } from "@/feature/emiLoans/data/dataSource/db/emiDbConfig";
import { inventoryMovementDbConfig } from "@/feature/inventory/data/dataSource/db/inventoryMovementDbConfig";
import { ledgerDbConfig } from "@/feature/ledger/data/dataSource/db/ledgerDbConfig";
import { orderDbConfig } from "@/feature/orders/data/dataSource/db/orderDbConfig";
import { PosSaleModel } from "@/feature/pos/data/dataSource/db/posSale.model";
import { posSalesTable } from "@/feature/pos/data/dataSource/db/posSale.schema";
import { productDbConfig } from "@/feature/products/data/dataSource/db/productDbConfig";
import { businessProfileDbConfig } from "@/feature/profile/business/data/dataSource/db/businessProfileDbConfig";
import { authCredentialDbConfig } from "@/feature/session/data/dataSource/db/authCredentialDbConfig";
import { authUserDbConfig } from "@/feature/session/data/dataSource/db/authUserDbConfig";
import { transactionDbConfig } from "@/feature/transactions/data/dataSource/db/transactionDbConfig";
import { userManagementDbConfig } from "@/feature/userManagement/data/dataSource/db/userManagementDbConfig";
import {
  assertDatabaseSetupHealthy,
  createDatabase,
} from "@/shared/database/createDatabase";
import { runDatabaseIntegrityChecks } from "@/shared/database/databaseIntegrity";
import { migrations } from "@/shared/database/migration";
import { appSchema, Collection, Q } from "@nozbe/watermelondb";

const APP_SETTINGS_TABLE = "app_settings";

export const APP_DATABASE_SCHEMA_VERSION = 42;

const schema = appSchema({
  version: APP_DATABASE_SCHEMA_VERSION,
  tables: [
    ...authUserDbConfig.tables,
    ...authCredentialDbConfig.tables,
    ...accountDbConfig.tables,
    ...moneyAccountDbConfig.tables,
    ...contactDbConfig.tables,
    ...billingDbConfig.tables,
    ...businessProfileDbConfig.tables,
    ...businessNotesDbConfig.tables,
    ...appSettingsDbConfig.tables,
    ...userManagementDbConfig.tables,
    ...transactionDbConfig.tables,
    ...ledgerDbConfig.tables,
    ...emiDbConfig.tables,
    ...productDbConfig.tables,
    ...inventoryMovementDbConfig.tables,
    posSalesTable,
    ...categoryDbConfig.tables,
    ...orderDbConfig.tables,
    ...budgetPlanDbConfig.tables,
    ...appRatingDbConfig.tables,
    ...bugReportDbConfig.tables,
  ],
});

export const database = createDatabase({
  schema,
  models: [
    ...authUserDbConfig.models,
    ...authCredentialDbConfig.models,
    ...accountDbConfig.models,
    ...moneyAccountDbConfig.models,
    ...contactDbConfig.models,
    ...billingDbConfig.models,
    ...businessProfileDbConfig.models,
    ...businessNotesDbConfig.models,
    ...appSettingsDbConfig.models,
    ...userManagementDbConfig.models,
    ...transactionDbConfig.models,
    ...ledgerDbConfig.models,
    ...emiDbConfig.models,
    ...productDbConfig.models,
    ...inventoryMovementDbConfig.models,
    PosSaleModel,
    ...categoryDbConfig.models,
    ...orderDbConfig.models,
    ...budgetPlanDbConfig.models,
    ...appRatingDbConfig.models,
    ...bugReportDbConfig.models,
  ],
  migrations,
});

const createDatabaseIntegritySqlRunner = (
  appSettingsCollection: Collection<AppSettingsModel>,
) => ({
  async fetchRaw(sql: string, args: readonly (string | number | null)[] = []) {
    return appSettingsCollection
      .query(Q.unsafeSqlQuery(sql, [...args]))
      .unsafeFetchRaw();
  },
});

export const ensureDatabaseReady = async (): Promise<void> => {
  assertDatabaseSetupHealthy();

  const appSettingsCollection =
    database.get<AppSettingsModel>(APP_SETTINGS_TABLE);

  await appSettingsCollection.query().fetchCount();

  await runDatabaseIntegrityChecks(
    createDatabaseIntegritySqlRunner(appSettingsCollection),
  );

  assertDatabaseSetupHealthy();
};

export default database;
