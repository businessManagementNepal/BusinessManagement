import { tableSchema } from "@nozbe/watermelondb";

export const appRatingsTable = tableSchema({
  name: "app_ratings",
  columns: [
    { name: "remote_id", type: "string", isIndexed: true },
    { name: "user_remote_id", type: "string", isIndexed: true },
    { name: "star_count", type: "number", isIndexed: true },
    { name: "review", type: "string", isOptional: true },
    { name: "submitted_at", type: "number", isIndexed: true },
    { name: "created_at", type: "number" },
    { name: "updated_at", type: "number" },
  ],
});
