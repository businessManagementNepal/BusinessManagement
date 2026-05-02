import { tableSchema } from "@nozbe/watermelondb";
import { CONTACTS_ACTIVE_IDENTITY_PHONE_UNIQUE_INDEX_SQL } from "./contactPhone.uniqueIndex";

export const contactsTable = tableSchema({
  name: "contacts",
  columns: [
    { name: "remote_id", type: "string", isIndexed: true },
    { name: "owner_user_remote_id", type: "string", isIndexed: true },
    { name: "account_remote_id", type: "string", isIndexed: true },
    { name: "account_type", type: "string", isIndexed: true },
    { name: "contact_type", type: "string", isIndexed: true },
    { name: "full_name", type: "string", isIndexed: true },
    { name: "phone_number", type: "string", isOptional: true },
    {
      name: "normalized_phone_number",
      type: "string",
      isOptional: true,
      isIndexed: true,
    },
    { name: "email_address", type: "string", isOptional: true },
    { name: "address", type: "string", isOptional: true },
    { name: "tax_id", type: "string", isOptional: true },
    { name: "opening_balance_amount", type: "number" },
    { name: "opening_balance_direction", type: "string", isOptional: true },
    { name: "notes", type: "string", isOptional: true },
    { name: "is_archived", type: "boolean", isIndexed: true },
    { name: "server_revision", type: "string", isOptional: true },
    { name: "sync_status", type: "string", isIndexed: true },
    { name: "last_synced_at", type: "number", isOptional: true },
    { name: "deleted_at", type: "number", isOptional: true },
    { name: "created_at", type: "number" },
    { name: "updated_at", type: "number" },
  ],
  unsafeSql: (sql) =>
    `${sql}\n${CONTACTS_ACTIVE_IDENTITY_PHONE_UNIQUE_INDEX_SQL}`,
});
