import { tableSchema } from "@nozbe/watermelondb";

export const businessProfilesTable = tableSchema({
  name: "business_profiles",
  columns: [
    { name: "account_remote_id", type: "string", isIndexed: true },
    { name: "owner_user_remote_id", type: "string", isIndexed: true },
    { name: "business_type", type: "string" },
    { name: "business_name", type: "string" },
    { name: "business_logo_url", type: "string", isOptional: true },
    { name: "business_phone", type: "string", isOptional: true },
    { name: "business_email", type: "string", isOptional: true },
    { name: "registered_address", type: "string", isOptional: true },
    { name: "country", type: "string", isOptional: true },
    { name: "city", type: "string", isOptional: true },
    { name: "state_or_district", type: "string", isOptional: true },
    { name: "tax_registration_id", type: "string", isOptional: true },
    { name: "country_code", type: "string" },
    { name: "currency_code", type: "string" },
    { name: "timezone", type: "string" },
    { name: "phone_policy", type: "string" },
    { name: "is_active", type: "boolean" },
    { name: "server_revision", type: "string", isOptional: true },

    { name: "sync_status", type: "string", isIndexed: true },
    { name: "last_synced_at", type: "number", isOptional: true },
    { name: "deleted_at", type: "number", isOptional: true },

    { name: "created_at", type: "number" },
    { name: "updated_at", type: "number" },
  ],
});
