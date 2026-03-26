import { tableSchema } from "@nozbe/watermelondb";

export const appSettingsTable = tableSchema({
  name: "app_settings",
  columns: [
    { name: "selected_language", type: "string" },
    { name: "onboarding_completed", type: "boolean" },
    { name: "active_user_remote_id", type: "string", isOptional: true, isIndexed: true },
    { name: "active_account_remote_id", type: "string", isOptional: true, isIndexed: true },
    { name: "created_at", type: "number" },
    { name: "updated_at", type: "number" },
  ],
});