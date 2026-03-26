import { tableSchema } from "@nozbe/watermelondb";

export const authUsersTable = tableSchema({
  name: "auth_users",
  columns: [
    { name: "remote_id", type: "string", isIndexed: true },
    { name: "full_name", type: "string" },
    { name: "email", type: "string", isOptional: true, isIndexed: true },
    { name: "phone", type: "string", isOptional: true, isIndexed: true },
    { name: "auth_provider", type: "string", isOptional: true },
    { name: "profile_image_url", type: "string", isOptional: true },
    { name: "preferred_language", type: "string", isOptional: true },
    { name: "is_email_verified", type: "boolean" },
    { name: "is_phone_verified", type: "boolean" },

    { name: "sync_status", type: "string", isIndexed: true },
    { name: "last_synced_at", type: "number", isOptional: true },
    { name: "deleted_at", type: "number", isOptional: true },

    { name: "created_at", type: "number" },
    { name: "updated_at", type: "number" },
  ],
});