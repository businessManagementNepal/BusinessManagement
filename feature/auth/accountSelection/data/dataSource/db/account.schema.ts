import { tableSchema } from "@nozbe/watermelondb";

export const accountsTable = tableSchema({
  name: "accounts",
  columns: [
    { name: "remote_id", type: "string", isIndexed: true },
    { name: "owner_user_remote_id", type: "string", isIndexed: true },
    { name: "account_type", type: "string", isIndexed: true },
    { name: "business_type", type: "string", isOptional: true },
    { name: "display_name", type: "string" },
    { name: "currency_code", type: "string", isOptional: true },
    { name: "city_or_location", type: "string", isOptional: true },
    { name: "country_code", type: "string", isOptional: true },
    { name: "default_tax_rate_percent", type: "number", isOptional: true },
    { name: "default_tax_mode", type: "string", isOptional: true },
    { name: "is_active", type: "boolean" },
    { name: "is_default", type: "boolean" },
    { name: "server_revision", type: "string", isOptional: true },

    { name: "sync_status", type: "string", isIndexed: true },
    { name: "last_synced_at", type: "number", isOptional: true },
    { name: "deleted_at", type: "number", isOptional: true },

    { name: "created_at", type: "number" },
    { name: "updated_at", type: "number" },
  ],
});
