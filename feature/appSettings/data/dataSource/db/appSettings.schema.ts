import { tableSchema } from "@nozbe/watermelondb";

export const appSettingsTable = tableSchema({
  name: "app_settings",
  columns: [
    { name: "selected_language", type: "string" },
    { name: "onboarding_completed", type: "boolean" },
    {
      name: "active_user_remote_id",
      type: "string",
      isOptional: true,
      isIndexed: true,
    },
    {
      name: "active_account_remote_id",
      type: "string",
      isOptional: true,
      isIndexed: true,
    },
    { name: "biometric_login_enabled", type: "boolean", isOptional: true },
    { name: "two_factor_auth_enabled", type: "boolean", isOptional: true },
    { name: "appearance_theme_preference", type: "string", isOptional: true },
    {
      name: "appearance_text_size_preference",
      type: "string",
      isOptional: true,
    },
    {
      name: "appearance_compact_mode_enabled",
      type: "boolean",
      isOptional: true,
    },
    { name: "sync_enabled", type: "boolean", isOptional: true },
    { name: "created_at", type: "number" },
    { name: "updated_at", type: "number" },
  ],
});
