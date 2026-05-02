import { tableSchema } from "@nozbe/watermelondb";

export const accountMembersTable = tableSchema({
  name: "account_members",
  columns: [
    { name: "remote_id", type: "string", isIndexed: true },
    { name: "account_remote_id", type: "string", isIndexed: true },
    { name: "user_remote_id", type: "string", isIndexed: true },
    { name: "status", type: "string", isIndexed: true },
    { name: "invited_by_user_remote_id", type: "string", isOptional: true },
    { name: "joined_at", type: "number", isOptional: true },
    { name: "last_active_at", type: "number", isOptional: true },
    { name: "server_revision", type: "string", isOptional: true },
    { name: "sync_status", type: "string", isIndexed: true },
    { name: "last_synced_at", type: "number", isOptional: true },
    { name: "deleted_at", type: "number", isOptional: true },
    { name: "created_at", type: "number" },
    { name: "updated_at", type: "number" },
  ],
});
