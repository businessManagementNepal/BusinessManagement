import { tableSchema } from "@nozbe/watermelondb";

export const bugReportsTable = tableSchema({
  name: "bug_reports",
  columns: [
    { name: "remote_id", type: "string", isIndexed: true },
    { name: "user_remote_id", type: "string", isIndexed: true },
    { name: "title", type: "string" },
    { name: "description", type: "string" },
    { name: "severity", type: "string", isIndexed: true },
    { name: "device_info", type: "string", isOptional: true },
    { name: "app_version", type: "string", isOptional: true },
    { name: "submitted_at", type: "number", isIndexed: true },
    { name: "created_at", type: "number" },
    { name: "updated_at", type: "number" },
  ],
});
