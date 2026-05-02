import { tableSchema } from "@nozbe/watermelondb";

export const accountRolesTable = tableSchema({
  name: "account_roles",
  columns: [
    { name: "remote_id", type: "string", isIndexed: true },
    { name: "account_remote_id", type: "string", isIndexed: true },
    { name: "name", type: "string" },
    { name: "is_system", type: "boolean" },
    { name: "is_default", type: "boolean" },
    { name: "server_revision", type: "string", isOptional: true },

    { name: "sync_status", type: "string", isIndexed: true },
    { name: "last_synced_at", type: "number", isOptional: true },
    { name: "deleted_at", type: "number", isOptional: true },

    { name: "created_at", type: "number" },
    { name: "updated_at", type: "number" },
  ],
});
