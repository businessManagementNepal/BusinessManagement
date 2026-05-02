import { tableSchema } from "@nozbe/watermelondb";

export const importJobsTable = tableSchema({
  name: "import_jobs",
  columns: [
    { name: "remote_id", type: "string", isIndexed: true },
    { name: "active_account_remote_id", type: "string", isIndexed: true },
    { name: "active_user_remote_id", type: "string", isIndexed: true },
    { name: "module_id", type: "string", isIndexed: true },
    { name: "file_name", type: "string" },
    { name: "file_format", type: "string", isIndexed: true },
    { name: "status", type: "string", isIndexed: true },
    { name: "import_mode", type: "string", isIndexed: true },
    { name: "total_rows", type: "number" },
    { name: "valid_rows", type: "number" },
    { name: "invalid_rows", type: "number" },
    { name: "duplicate_rows", type: "number" },
    { name: "imported_rows", type: "number" },
    { name: "skipped_rows", type: "number" },
    { name: "failed_rows", type: "number" },
    { name: "created_at", type: "number", isIndexed: true },
    { name: "updated_at", type: "number" },
    { name: "completed_at", type: "number", isOptional: true },
  ],
});
