import { tableSchema } from "@nozbe/watermelondb";

export const orderLinesTable = tableSchema({
  name: "order_lines",
  columns: [
    { name: "remote_id", type: "string", isIndexed: true },
    { name: "order_remote_id", type: "string", isIndexed: true },
    { name: "product_remote_id", type: "string", isIndexed: true },
    { name: "product_name_snapshot", type: "string", isOptional: true },
    { name: "unit_label_snapshot", type: "string", isOptional: true },
    { name: "sku_or_barcode_snapshot", type: "string", isOptional: true },
    { name: "category_name_snapshot", type: "string", isOptional: true },
    { name: "tax_rate_label_snapshot", type: "string", isOptional: true },
    { name: "unit_price_snapshot", type: "number", isOptional: true },
    { name: "tax_rate_percent_snapshot", type: "number", isOptional: true },
    { name: "quantity", type: "number" },
    { name: "line_subtotal_amount", type: "number", isOptional: true },
    { name: "line_tax_amount", type: "number", isOptional: true },
    { name: "line_total_amount", type: "number", isOptional: true },
    { name: "line_order", type: "number", isIndexed: true },
    { name: "server_revision", type: "string", isOptional: true },
    { name: "sync_status", type: "string", isIndexed: true },
    { name: "last_synced_at", type: "number", isOptional: true },
    { name: "deleted_at", type: "number", isOptional: true },
    { name: "created_at", type: "number" },
    { name: "updated_at", type: "number" },
  ],
});
