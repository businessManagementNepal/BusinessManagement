import {
    InventoryAdjustmentReasonValue,
    InventoryMovementTypeValue,
} from "@/feature/inventory/types/inventory.types";
import { Model } from "@nozbe/watermelondb";
import { date, field, readonly } from "@nozbe/watermelondb/decorators";

export class InventoryMovementModel extends Model {
  static table = "inventory_movements";

  @field("remote_id") remoteId!: string;
  @field("account_remote_id") accountRemoteId!: string;
  @field("product_remote_id") productRemoteId!: string;
  @field("product_name_snapshot") productNameSnapshot!: string;
  @field("product_unit_label_snapshot") productUnitLabelSnapshot!: string | null;
  @field("movement_type") movementType!: InventoryMovementTypeValue;
  @field("quantity") quantity!: number;
  @field("delta_quantity") deltaQuantity!: number;
  @field("unit_rate") unitRate!: number | null;
  @field("reason") reason!: InventoryAdjustmentReasonValue | null;
  @field("remark") remark!: string | null;
  @field("source_module") sourceModule!: string | null;
  @field("source_remote_id") sourceRemoteId!: string | null;
  @field("source_line_remote_id") sourceLineRemoteId!: string | null;
  @field("source_action") sourceAction!: string | null;
  @field("movement_at") movementAt!: number;
  @field("server_revision") serverRevision!: string | null;
  @field("sync_status") recordSyncStatus!: string;
  @field("last_synced_at") lastSyncedAt!: number | null;
  @field("deleted_at") deletedAt!: number | null;

  @readonly @date("created_at") createdAt!: Date;
  @readonly @date("updated_at") updatedAt!: Date;
}
