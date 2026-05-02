import { tableSchema } from "@nozbe/watermelondb";

export const syncConflictsTable = tableSchema({
  name: "sync_conflicts",
  columns: [
    { name: "remote_id", type: "string", isIndexed: true },
    { name: "table_name", type: "string", isIndexed: true },
    { name: "record_remote_id", type: "string", isIndexed: true },
    { name: "account_remote_id", type: "string", isIndexed: true },
    { name: "local_payload_json", type: "string" },
    { name: "remote_payload_json", type: "string" },
    { name: "conflict_policy", type: "string", isIndexed: true },
    { name: "status", type: "string", isIndexed: true },
    { name: "created_at", type: "number" },
    { name: "updated_at", type: "number" },
  ],
});
