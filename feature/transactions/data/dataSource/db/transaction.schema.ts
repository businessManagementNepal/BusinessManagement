import { tableSchema } from "@nozbe/watermelondb";

export const transactionsTable = tableSchema({
  name: "transactions",
  columns: [
    { name: "remote_id", type: "string", isIndexed: true },
    { name: "owner_user_remote_id", type: "string", isIndexed: true },
    { name: "account_remote_id", type: "string", isIndexed: true },
    { name: "account_display_name_snapshot", type: "string" },
    { name: "transaction_type", type: "string", isIndexed: true },
    { name: "direction", type: "string", isIndexed: true },
    { name: "title", type: "string" },
    { name: "amount", type: "number" },
    { name: "currency_code", type: "string", isOptional: true },
    { name: "category_label", type: "string", isOptional: true },
    { name: "note", type: "string", isOptional: true },
    { name: "happened_at", type: "number", isIndexed: true },
    { name: "sync_status", type: "string", isIndexed: true },
    { name: "last_synced_at", type: "number", isOptional: true },
    { name: "deleted_at", type: "number", isOptional: true },
    { name: "created_at", type: "number" },
    { name: "updated_at", type: "number" },
  ],
});
