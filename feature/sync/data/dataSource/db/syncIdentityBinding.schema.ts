import { tableSchema } from "@nozbe/watermelondb";

export const syncIdentityBindingsTable = tableSchema({
  name: "sync_identity_bindings",
  columns: [
    { name: "binding_type", type: "string", isIndexed: true },
    { name: "local_user_remote_id", type: "string", isIndexed: true },
    { name: "remote_user_remote_id", type: "string", isIndexed: true },
    { name: "local_account_remote_id", type: "string", isOptional: true, isIndexed: true },
    { name: "remote_account_remote_id", type: "string", isOptional: true, isIndexed: true },
    { name: "created_at", type: "number" },
    { name: "updated_at", type: "number" },
  ],
});
