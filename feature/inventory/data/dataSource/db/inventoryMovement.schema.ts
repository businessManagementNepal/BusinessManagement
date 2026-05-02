import { tableSchema } from "@nozbe/watermelondb";

export const inventoryMovementsTable = tableSchema({
  name: "inventory_movements",
  columns: [
    { name: "remote_id", type: "string", isIndexed: true },
    { name: "account_remote_id", type: "string", isIndexed: true },
    { name: "product_remote_id", type: "string", isIndexed: true },
    { name: "product_name_snapshot", type: "string" },
    { name: "product_unit_label_snapshot", type: "string", isOptional: true },
    { name: "movement_type", type: "string", isIndexed: true },
    { name: "quantity", type: "number" },
    { name: "delta_quantity", type: "number" },
    { name: "unit_rate", type: "number", isOptional: true },
    { name: "reason", type: "string", isOptional: true },
    { name: "remark", type: "string", isOptional: true },
    { name: "source_module", type: "string", isOptional: true, isIndexed: true },
    { name: "source_remote_id", type: "string", isOptional: true, isIndexed: true },
    { name: "source_line_remote_id", type: "string", isOptional: true, isIndexed: true },
    { name: "source_action", type: "string", isOptional: true, isIndexed: true },
    { name: "movement_at", type: "number", isIndexed: true },
    { name: "server_revision", type: "string", isOptional: true },
    { name: "sync_status", type: "string", isIndexed: true },
    { name: "last_synced_at", type: "number", isOptional: true },
    { name: "deleted_at", type: "number", isOptional: true },
    { name: "created_at", type: "number" },
    { name: "updated_at", type: "number" },
  ],
});
