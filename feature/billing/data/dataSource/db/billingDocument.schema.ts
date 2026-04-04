import { tableSchema } from "@nozbe/watermelondb";
import { BILLING_DOCUMENT_ACTIVE_NUMBER_UNIQUE_INDEX_SQL } from "./billingDocument.uniqueIndex";

export const billingDocumentsTable = tableSchema({
  name: "billing_documents",
  columns: [
    { name: "remote_id", type: "string", isIndexed: true },
    { name: "account_remote_id", type: "string", isIndexed: true },
    { name: "document_number", type: "string", isIndexed: true },
    { name: "document_type", type: "string", isIndexed: true },
    { name: "template_type", type: "string", isIndexed: true },
    { name: "customer_name", type: "string" },
    { name: "status", type: "string", isIndexed: true },
    { name: "tax_rate_percent", type: "number" },
    { name: "notes", type: "string", isOptional: true },
    { name: "subtotal_amount", type: "number" },
    { name: "tax_amount", type: "number" },
    { name: "total_amount", type: "number" },
    { name: "issued_at", type: "number", isIndexed: true },
    { name: "sync_status", type: "string", isIndexed: true },
    { name: "last_synced_at", type: "number", isOptional: true },
    { name: "deleted_at", type: "number", isOptional: true },
    { name: "created_at", type: "number" },
    { name: "updated_at", type: "number" },
  ],
  unsafeSql: (sql) => `${sql}\n${BILLING_DOCUMENT_ACTIVE_NUMBER_UNIQUE_INDEX_SQL}`,
});
