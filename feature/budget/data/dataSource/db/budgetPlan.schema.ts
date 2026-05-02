import { tableSchema } from "@nozbe/watermelondb";

export const budgetPlansTable = tableSchema({
  name: "budget_plans",
  columns: [
    { name: "remote_id", type: "string", isIndexed: true },
    { name: "owner_user_remote_id", type: "string", isIndexed: true },
    { name: "account_remote_id", type: "string", isIndexed: true },
    { name: "budget_month", type: "string", isIndexed: true },
    { name: "category_remote_id", type: "string", isIndexed: true },
    { name: "category_name_snapshot", type: "string" },
    { name: "currency_code", type: "string", isOptional: true },
    { name: "planned_amount", type: "number" },
    { name: "note", type: "string", isOptional: true },
    { name: "server_revision", type: "string", isOptional: true },
    { name: "sync_status", type: "string", isIndexed: true },
    { name: "last_synced_at", type: "number", isOptional: true },
    { name: "deleted_at", type: "number", isOptional: true },
    { name: "created_at", type: "number" },
    { name: "updated_at", type: "number" },
  ],
});
