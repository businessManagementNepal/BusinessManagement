import { tableSchema } from "@nozbe/watermelondb";

export const syncErrorsTable = tableSchema({
  name: "sync_errors",
  columns: [
    { name: "remote_id", type: "string", isIndexed: true },
    { name: "sync_run_remote_id", type: "string", isIndexed: true },
    { name: "table_name", type: "string", isIndexed: true },
    { name: "record_remote_id", type: "string", isIndexed: true },
    { name: "operation", type: "string", isIndexed: true },
    { name: "error_type", type: "string", isIndexed: true },
    { name: "error_message", type: "string" },
    { name: "retry_count", type: "number" },
    { name: "next_retry_at", type: "number", isOptional: true },
    { name: "created_at", type: "number" },
    { name: "updated_at", type: "number" },
  ],
});
