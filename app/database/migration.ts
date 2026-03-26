import {
  schemaMigrations,
  createTable,
} from "@nozbe/watermelondb/Schema/migrations";

export const migrations = schemaMigrations({
  migrations: [
    {
      toVersion: 11,
      steps: [
        createTable({
          name: "auth_users",
          columns: [
            { name: "remote_id", type: "string", isIndexed: true },
            { name: "full_name", type: "string" },
            {
              name: "email",
              type: "string",
              isOptional: true,
              isIndexed: true,
            },
            {
              name: "phone",
              type: "string",
              isOptional: true,
              isIndexed: true,
            },
            { name: "auth_provider", type: "string", isOptional: true },
            { name: "profile_image_url", type: "string", isOptional: true },
            { name: "preferred_language", type: "string", isOptional: true },
            { name: "is_email_verified", type: "boolean" },
            { name: "is_phone_verified", type: "boolean" },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
          ],
        }),

        createTable({
          name: "auth_credentials",
          columns: [
            { name: "remote_id", type: "string", isIndexed: true },
            { name: "user_remote_id", type: "string", isIndexed: true },
            { name: "login_id", type: "string", isIndexed: true },
            { name: "credential_type", type: "string", isIndexed: true },
            { name: "password_hash", type: "string" },
            { name: "password_salt", type: "string" },
            { name: "hint", type: "string", isOptional: true },
            { name: "last_login_at", type: "number", isOptional: true },
            { name: "is_active", type: "boolean" },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
          ],
        }),
      ],
    },
  ],
});
