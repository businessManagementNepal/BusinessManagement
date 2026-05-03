import { tableSchema } from "@nozbe/watermelondb";

export const categoriesTable = tableSchema({
  name: "categories",
  columns: [
    { name: "remote_id", type: "string", isIndexed: true },
    { name: "owner_user_remote_id", type: "string", isIndexed: true },
    { name: "account_remote_id", type: "string", isIndexed: true },
    { name: "account_type", type: "string", isIndexed: true },
    { name: "scope", type: "string", isIndexed: true },
    { name: "kind", type: "string", isIndexed: true },
    { name: "name", type: "string", isIndexed: true },
    { name: "description", type: "string", isOptional: true },
    { name: "is_system", type: "boolean", isIndexed: true },
    { name: "server_revision", type: "string", isOptional: true },
    { name: "sync_status", type: "string", isIndexed: true },
    { name: "last_synced_at", type: "number", isOptional: true },
    { name: "deleted_at", type: "number", isOptional: true },
    { name: "created_at", type: "number" },
    { name: "updated_at", type: "number" },
  ],
});
