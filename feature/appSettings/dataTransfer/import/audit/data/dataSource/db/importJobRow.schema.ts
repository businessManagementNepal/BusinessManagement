import { tableSchema } from "@nozbe/watermelondb";

export const importJobRowsTable = tableSchema({
  name: "import_job_rows",
  columns: [
    { name: "remote_id", type: "string", isIndexed: true },
    { name: "import_job_remote_id", type: "string", isIndexed: true },
    { name: "row_number", type: "number", isIndexed: true },
    { name: "status", type: "string", isIndexed: true },
    { name: "raw_json", type: "string" },
    { name: "normalized_json", type: "string", isOptional: true },
    { name: "error_json", type: "string", isOptional: true },
    { name: "warning_json", type: "string", isOptional: true },
    { name: "created_record_remote_id", type: "string", isOptional: true },
    { name: "created_at", type: "number" },
    { name: "updated_at", type: "number" },
  ],
});
