import { tableSchema } from "@nozbe/watermelondb";

export const billPhotosTable = tableSchema({
  name: "bill_photos",
  columns: [
    { name: "remote_id", type: "string", isIndexed: true },
    { name: "account_remote_id", type: "string", isIndexed: true },
    { name: "document_remote_id", type: "string", isOptional: true, isIndexed: true },
    { name: "file_name", type: "string" },
    { name: "mime_type", type: "string", isOptional: true },
    { name: "image_data_url", type: "string" },
    { name: "uploaded_at", type: "number", isIndexed: true },
    { name: "server_revision", type: "string", isOptional: true },
    { name: "sync_status", type: "string", isIndexed: true },
    { name: "last_synced_at", type: "number", isOptional: true },
    { name: "deleted_at", type: "number", isOptional: true },
    { name: "created_at", type: "number" },
    { name: "updated_at", type: "number" },
  ],
});
