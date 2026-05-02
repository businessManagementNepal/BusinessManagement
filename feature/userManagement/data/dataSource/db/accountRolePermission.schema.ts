import { tableSchema } from "@nozbe/watermelondb";

export const accountRolePermissionsTable = tableSchema({
  name: "account_role_permissions",
  columns: [
    { name: "role_remote_id", type: "string", isIndexed: true },
    { name: "permission_code", type: "string", isIndexed: true },
    { name: "server_revision", type: "string", isOptional: true },
    { name: "created_at", type: "number" },
    { name: "updated_at", type: "number" },
  ],
});
