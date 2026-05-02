import { tableSchema } from "@nozbe/watermelondb";

export const auditEventsTable = tableSchema({
  name: "audit_events",
  columns: [
    { name: "remote_id", type: "string", isIndexed: true },
    { name: "account_remote_id", type: "string", isIndexed: true },
    { name: "owner_user_remote_id", type: "string", isIndexed: true },
    { name: "actor_user_remote_id", type: "string", isIndexed: true },
    { name: "module", type: "string", isIndexed: true },
    { name: "action", type: "string", isIndexed: true },
    { name: "source_module", type: "string", isIndexed: true },
    { name: "source_remote_id", type: "string", isIndexed: true },
    { name: "source_action", type: "string", isIndexed: true },
    { name: "outcome", type: "string", isIndexed: true },
    { name: "severity", type: "string", isIndexed: true },
    { name: "summary", type: "string" },
    { name: "metadata_json", type: "string", isOptional: true },
    { name: "server_revision", type: "string", isOptional: true },
    { name: "sync_status", type: "string", isIndexed: true },
    { name: "last_synced_at", type: "number", isOptional: true },
    { name: "deleted_at", type: "number", isOptional: true },
    { name: "created_at", type: "number", isIndexed: true },
    { name: "updated_at", type: "number" },
  ],
});
