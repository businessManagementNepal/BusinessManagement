import { BILLING_DOCUMENT_ACTIVE_NUMBER_UNIQUE_INDEX_NAME } from "@/feature/billing/data/dataSource/db/billingDocument.uniqueIndex";
import { CONTACTS_ACTIVE_IDENTITY_PHONE_UNIQUE_INDEX_NAME } from "@/feature/contacts/data/dataSource/db/contactPhone.uniqueIndex";
import type { DatabaseIntegrityInvariant } from "./databaseIntegrity.types";

const BILLING_DOCUMENTS_TABLE = "billing_documents";
const CONTACTS_TABLE = "contacts";

export const SQLITE_MASTER_INDEX_EXISTS_SQL =
  "SELECT name, sql FROM sqlite_master WHERE type = ? AND name = ?;";

export const databaseIntegrityInvariants: readonly DatabaseIntegrityInvariant[] =
  [
    {
      key: "billing_active_document_number_unique_index",
      requiredIndexName: BILLING_DOCUMENT_ACTIVE_NUMBER_UNIQUE_INDEX_NAME,
      missingErrorMessage: `Database integrity check failed: missing unique index ${BILLING_DOCUMENT_ACTIVE_NUMBER_UNIQUE_INDEX_NAME}.`,
      duplicateErrorMessage:
        "Database integrity check failed: duplicate active billing document numbers detected.",
      duplicateCheckSql: `
        SELECT account_remote_id, document_number, COUNT(*) AS duplicate_count
        FROM ${BILLING_DOCUMENTS_TABLE}
        WHERE deleted_at IS NULL
        GROUP BY account_remote_id, document_number COLLATE NOCASE
        HAVING COUNT(*) > 1
        LIMIT 1;
      `.trim(),
    },
    {
      key: "contacts_active_identity_phone_unique_index",
      requiredIndexName: CONTACTS_ACTIVE_IDENTITY_PHONE_UNIQUE_INDEX_NAME,
      missingErrorMessage: `Database integrity check failed: missing unique index ${CONTACTS_ACTIVE_IDENTITY_PHONE_UNIQUE_INDEX_NAME}.`,
      duplicateErrorMessage:
        "Database integrity check failed: duplicate active contact identity phone numbers detected.",
      duplicateCheckSql: `
        SELECT account_remote_id, contact_type, normalized_phone_number, COUNT(*) AS duplicate_count
        FROM ${CONTACTS_TABLE}
        WHERE deleted_at IS NULL
          AND is_archived = 0
          AND normalized_phone_number IS NOT NULL
          AND LENGTH(TRIM(normalized_phone_number)) > 0
        GROUP BY account_remote_id, contact_type, normalized_phone_number
        HAVING COUNT(*) > 1
        LIMIT 1;
      `.trim(),
    },
  ] as const;
