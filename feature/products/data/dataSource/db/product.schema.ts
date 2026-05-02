import { tableSchema } from "@nozbe/watermelondb";

export const productsTable = tableSchema({
  name: "products",
  columns: [
    { name: "remote_id", type: "string", isIndexed: true },
    { name: "account_remote_id", type: "string", isIndexed: true },
    { name: "name", type: "string", isIndexed: true },
    { name: "kind", type: "string", isIndexed: true },
    { name: "category_name", type: "string", isOptional: true },
    { name: "sale_price", type: "number" },
    { name: "cost_price", type: "number", isOptional: true },
    { name: "stock_quantity", type: "number", isOptional: true },
    { name: "unit_label", type: "string", isOptional: true },
    { name: "sku_or_barcode", type: "string", isOptional: true },
    { name: "tax_rate_label", type: "string", isOptional: true },
    { name: "description", type: "string", isOptional: true },
    { name: "image_url", type: "string", isOptional: true },
    { name: "status", type: "string", isIndexed: true },
    { name: "server_revision", type: "string", isOptional: true },
    { name: "sync_status", type: "string", isIndexed: true },
    { name: "last_synced_at", type: "number", isOptional: true },
    { name: "deleted_at", type: "number", isOptional: true },
    { name: "created_at", type: "number" },
    { name: "updated_at", type: "number" },
  ],
});
