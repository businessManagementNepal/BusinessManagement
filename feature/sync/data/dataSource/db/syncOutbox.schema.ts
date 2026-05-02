import { tableSchema } from "@nozbe/watermelondb";

export const syncOutboxTable = tableSchema({
  name: "sync_outbox",
  columns: [
    { name: "remote_id", type: "string", isIndexed: true },
    { name: "table_name", type: "string", isIndexed: true },
    { name: "record_remote_id", type: "string", isIndexed: true },
    { name: "account_remote_id", type: "string", isIndexed: true },
    { name: "operation", type: "string", isIndexed: true },
    { name: "payload_json", type: "string" },
    { name: "status", type: "string", isIndexed: true },
    { name: "attempt_count", type: "number" },
    { name: "last_attempted_at", type: "number", isOptional: true },
    { name: "created_at", type: "number" },
    { name: "updated_at", type: "number" },
  ],
});
