import { tableSchema } from "@nozbe/watermelondb";

export const moneyAccountsTable = tableSchema({
  name: "money_accounts",
  columns: [
    { name: "remote_id", type: "string", isIndexed: true },
    { name: "owner_user_remote_id", type: "string", isIndexed: true },
    { name: "scope_account_remote_id", type: "string", isIndexed: true },
    { name: "name", type: "string" },
    { name: "account_type", type: "string", isIndexed: true },
    { name: "current_balance", type: "number" },
    { name: "opening_balance_amount", type: "number", isOptional: true },
    { name: "opening_balance_direction", type: "string", isOptional: true },
    { name: "description", type: "string", isOptional: true },
    { name: "currency_code", type: "string", isOptional: true },
    { name: "is_primary", type: "boolean" },
    { name: "is_active", type: "boolean" },
    { name: "server_revision", type: "string", isOptional: true },
    { name: "sync_status", type: "string", isIndexed: true },
    { name: "last_synced_at", type: "number", isOptional: true },
    { name: "deleted_at", type: "number", isOptional: true },
    { name: "created_at", type: "number" },
    { name: "updated_at", type: "number" },
  ],
});
