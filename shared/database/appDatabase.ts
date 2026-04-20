import { moneyAccountDbConfig } from "@/feature/accounts/data/dataSource/db/moneyAccountDbConfig";
import { AppSettingsModel } from "@/feature/appSettings/data/dataSource/db/appSettings.model";
import { appSettingsDbConfig } from "@/feature/appSettings/data/dataSource/db/appSettingsDbConfig";
import { businessNotesDbConfig } from "@/feature/appSettings/notes/data/dataSource/db/businessNoteDbConfig";
import { appRatingDbConfig } from "@/feature/appSettings/settings/data/dataSource/db/appRatingDbConfig";
import { bugReportDbConfig } from "@/feature/appSettings/settings/data/dataSource/db/bugReportDbConfig";
import { accountDbConfig } from "@/feature/auth/accountSelection/data/dataSource/db/accountDbConfig";
import { billingDbConfig } from "@/feature/billing/data/dataSource/db/billingDbConfig";
import { BILLING_DOCUMENT_ACTIVE_NUMBER_UNIQUE_INDEX_NAME } from "@/feature/billing/data/dataSource/db/billingDocument.uniqueIndex";
import { budgetPlanDbConfig } from "@/feature/budget/data/dataSource/db/budgetPlanDbConfig";
import { categoryDbConfig } from "@/feature/categories/data/dataSource/db/categoryDbConfig";
import { contactDbConfig } from "@/feature/contacts/data/dataSource/db/contactDbConfig";
import { CONTACTS_ACTIVE_IDENTITY_PHONE_UNIQUE_INDEX_NAME } from "@/feature/contacts/data/dataSource/db/contactPhone.uniqueIndex";
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
import { migrations } from "@/shared/database/migration";
import { appSchema, Q } from "@nozbe/watermelondb";

const APP_SETTINGS_TABLE = "app_settings";
const BILLING_DOCUMENTS_TABLE = "billing_documents";
const CONTACTS_TABLE = "contacts";

const schema = appSchema({
  version: 41,
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

export const ensureDatabaseReady = async (): Promise<void> => {
  assertDatabaseSetupHealthy();

  const appSettingsCollection =
    database.get<AppSettingsModel>(APP_SETTINGS_TABLE);

  await appSettingsCollection.query().fetchCount();

  const uniqueIndexRows = await appSettingsCollection
    .query(
      Q.unsafeSqlQuery(
        "SELECT name, sql FROM sqlite_master WHERE type = ? AND name = ?;",
        ["index", BILLING_DOCUMENT_ACTIVE_NUMBER_UNIQUE_INDEX_NAME],
      ),
    )
    .unsafeFetchRaw();

  if (uniqueIndexRows.length === 0) {
    throw new Error(
      `Database integrity check failed: missing unique index ${BILLING_DOCUMENT_ACTIVE_NUMBER_UNIQUE_INDEX_NAME}.`,
    );
  }

  const duplicateRows = await appSettingsCollection
    .query(
      Q.unsafeSqlQuery(
        `
          SELECT account_remote_id, document_number, COUNT(*) AS duplicate_count
          FROM ${BILLING_DOCUMENTS_TABLE}
          WHERE deleted_at IS NULL
          GROUP BY account_remote_id, document_number COLLATE NOCASE
          HAVING COUNT(*) > 1
          LIMIT 1;
        `,
      ),
    )
    .unsafeFetchRaw();

  if (duplicateRows.length > 0) {
    throw new Error(
      "Database integrity check failed: duplicate active billing document numbers detected.",
    );
  }

  const contactUniqueIndexRows = await appSettingsCollection
    .query(
      Q.unsafeSqlQuery(
        "SELECT name, sql FROM sqlite_master WHERE type = ? AND name = ?;",
        ["index", CONTACTS_ACTIVE_IDENTITY_PHONE_UNIQUE_INDEX_NAME],
      ),
    )
    .unsafeFetchRaw();

  if (contactUniqueIndexRows.length === 0) {
    throw new Error(
      `Database integrity check failed: missing unique index ${CONTACTS_ACTIVE_IDENTITY_PHONE_UNIQUE_INDEX_NAME}.`,
    );
  }

  const duplicateContactPhoneRows = await appSettingsCollection
    .query(
      Q.unsafeSqlQuery(
        `
          SELECT account_remote_id, contact_type, normalized_phone_number, COUNT(*) AS duplicate_count
          FROM ${CONTACTS_TABLE}
          WHERE deleted_at IS NULL
            AND is_archived = 0
            AND normalized_phone_number IS NOT NULL
            AND LENGTH(TRIM(normalized_phone_number)) > 0
          GROUP BY account_remote_id, contact_type, normalized_phone_number
          HAVING COUNT(*) > 1
          LIMIT 1;
        `,
      ),
    )
    .unsafeFetchRaw();

  if (duplicateContactPhoneRows.length > 0) {
    throw new Error(
      "Database integrity check failed: duplicate active contact identity phone numbers detected.",
    );
  }

  assertDatabaseSetupHealthy();
};

export default database;
