import { Model } from "@nozbe/watermelondb";
import { date, field, readonly } from "@nozbe/watermelondb/decorators";

export class OrderLineModel extends Model {
  static table = "order_lines";

  @field("remote_id") remoteId!: string;
  @field("order_remote_id") orderRemoteId!: string;
  @field("product_remote_id") productRemoteId!: string;
  @field("product_name_snapshot") productNameSnapshot!: string | null;
  @field("unit_label_snapshot") unitLabelSnapshot!: string | null;
  @field("sku_or_barcode_snapshot") skuOrBarcodeSnapshot!: string | null;
  @field("category_name_snapshot") categoryNameSnapshot!: string | null;
  @field("tax_rate_label_snapshot") taxRateLabelSnapshot!: string | null;
  @field("unit_price_snapshot") unitPriceSnapshot!: number | null;
  @field("tax_rate_percent_snapshot") taxRatePercentSnapshot!: number | null;
  @field("quantity") quantity!: number;
  @field("line_subtotal_amount") lineSubtotalAmount!: number | null;
  @field("line_tax_amount") lineTaxAmount!: number | null;
  @field("line_total_amount") lineTotalAmount!: number | null;
  @field("line_order") lineOrder!: number;
  @field("server_revision") serverRevision!: string | null;
  @field("sync_status") recordSyncStatus!: string;
  @field("last_synced_at") lastSyncedAt!: number | null;
  @field("deleted_at") deletedAt!: number | null;

  @readonly @date("created_at") createdAt!: Date;
  @readonly @date("updated_at") updatedAt!: Date;
}
