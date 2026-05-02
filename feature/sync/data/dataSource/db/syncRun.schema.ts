import { tableSchema } from "@nozbe/watermelondb";

export const syncRunsTable = tableSchema({
  name: "sync_runs",
  columns: [
    { name: "remote_id", type: "string", isIndexed: true },
    { name: "owner_user_remote_id", type: "string", isIndexed: true },
    { name: "account_remote_id", type: "string", isIndexed: true },
    { name: "status", type: "string", isIndexed: true },
    { name: "started_at", type: "number", isIndexed: true },
    { name: "finished_at", type: "number", isOptional: true },
    { name: "pushed_count", type: "number" },
    { name: "pulled_count", type: "number" },
    { name: "conflict_count", type: "number" },
    { name: "failed_count", type: "number" },
    { name: "error_message", type: "string", isOptional: true },
    { name: "created_at", type: "number" },
    { name: "updated_at", type: "number" },
  ],
});
