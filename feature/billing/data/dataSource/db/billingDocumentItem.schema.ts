import { tableSchema } from "@nozbe/watermelondb";

export const billingDocumentItemsTable = tableSchema({
  name: "billing_document_items",
  columns: [
    { name: "remote_id", type: "string", isIndexed: true },
    { name: "document_remote_id", type: "string", isIndexed: true },
    { name: "line_order", type: "number" },
    { name: "item_name", type: "string" },
    { name: "quantity", type: "number" },
    { name: "unit_rate", type: "number" },
    { name: "line_total", type: "number" },
    { name: "server_revision", type: "string", isOptional: true },
    { name: "deleted_at", type: "number", isOptional: true },
    { name: "created_at", type: "number" },
    { name: "updated_at", type: "number" },
  ],
});
