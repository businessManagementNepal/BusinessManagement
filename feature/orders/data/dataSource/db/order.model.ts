import { OrderStatusValue } from "@/feature/orders/types/order.types";
import { Model } from "@nozbe/watermelondb";
import { date, field, readonly } from "@nozbe/watermelondb/decorators";

export class OrderModel extends Model {
  static table = "orders";

  @field("remote_id") remoteId!: string;
  @field("owner_user_remote_id") ownerUserRemoteId!: string;
  @field("account_remote_id") accountRemoteId!: string;
  @field("order_number") orderNumber!: string;
  @field("order_date") orderDate!: number;
  @field("customer_remote_id") customerRemoteId!: string | null;
  @field("delivery_or_pickup_details") deliveryOrPickupDetails!: string | null;
  @field("notes") notes!: string | null;
  @field("tags") tags!: string | null;
  @field("internal_remarks") internalRemarks!: string | null;
  @field("status") status!: OrderStatusValue;
  @field("tax_rate_percent") taxRatePercent!: number | null;
  @field("subtotal_amount") subtotalAmount!: number | null;
  @field("tax_amount") taxAmount!: number | null;
  @field("discount_amount") discountAmount!: number | null;
  @field("total_amount") totalAmount!: number | null;
  @field("linked_billing_document_remote_id")
  linkedBillingDocumentRemoteId!: string | null;
  @field("linked_ledger_due_entry_remote_id")
  linkedLedgerDueEntryRemoteId!: string | null;
  @field("server_revision") serverRevision!: string | null;
  @field("sync_status") recordSyncStatus!: string;
  @field("last_synced_at") lastSyncedAt!: number | null;
  @field("deleted_at") deletedAt!: number | null;

  @readonly @date("created_at") createdAt!: Date;
  @readonly @date("updated_at") updatedAt!: Date;
}
