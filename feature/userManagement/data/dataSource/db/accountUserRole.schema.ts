import { tableSchema } from "@nozbe/watermelondb";

export const accountUserRolesTable = tableSchema({
  name: "account_user_roles",
  columns: [
    { name: "account_remote_id", type: "string", isIndexed: true },
    { name: "user_remote_id", type: "string", isIndexed: true },
    { name: "role_remote_id", type: "string", isIndexed: true },
    { name: "server_revision", type: "string", isOptional: true },
    { name: "created_at", type: "number" },
    { name: "updated_at", type: "number" },
  ],
});
