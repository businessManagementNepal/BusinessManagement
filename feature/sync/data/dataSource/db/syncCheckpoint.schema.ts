import { tableSchema } from "@nozbe/watermelondb";

export const syncCheckpointsTable = tableSchema({
  name: "sync_checkpoints",
  columns: [
    { name: "remote_id", type: "string", isIndexed: true },
    { name: "owner_user_remote_id", type: "string", isIndexed: true },
    { name: "account_remote_id", type: "string", isIndexed: true },
    { name: "table_name", type: "string", isIndexed: true },
    { name: "server_cursor", type: "string", isOptional: true },
    { name: "last_pulled_at", type: "number", isOptional: true },
    { name: "created_at", type: "number" },
    { name: "updated_at", type: "number" },
  ],
});
