import { Model } from "@nozbe/watermelondb";
import { date, field, readonly } from "@nozbe/watermelondb/decorators";

export class BillingDocumentItemModel extends Model {
  static table = "billing_document_items";

  @field("remote_id") remoteId!: string;
  @field("document_remote_id") documentRemoteId!: string;
  @field("line_order") lineOrder!: number;
  @field("item_name") itemName!: string;
  @field("quantity") quantity!: number;
  @field("unit_rate") unitRate!: number;
  @field("line_total") lineTotal!: number;
  @field("server_revision") serverRevision!: string | null;
  @field("deleted_at") deletedAt!: number | null;

  @readonly @date("created_at") createdAt!: Date;
  @readonly @date("updated_at") updatedAt!: Date;
}
