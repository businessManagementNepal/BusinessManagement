import type { PosSaleWorkflowStatusValue } from "@/feature/pos/types/posSale.constant";
import type { RecordSyncStatusValue } from "@/feature/session/types/authSession.types";
import { Model } from "@nozbe/watermelondb";
import { date, field, readonly } from "@nozbe/watermelondb/decorators";

export class PosSaleModel extends Model {
  static table = "pos_sales";

  @field("remote_id") remoteId!: string;
  @field("receipt_number") receiptNumber!: string;
  @field("business_account_remote_id") businessAccountRemoteId!: string;
  @field("owner_user_remote_id") ownerUserRemoteId!: string;
  @field("idempotency_key") idempotencyKey!: string;
  @field("workflow_status") workflowStatus!: PosSaleWorkflowStatusValue;
  @field("customer_remote_id") customerRemoteId!: string | null;
  @field("customer_name_snapshot") customerNameSnapshot!: string | null;
  @field("customer_phone_snapshot") customerPhoneSnapshot!: string | null;
  @field("currency_code") currencyCode!: string;
  @field("country_code") countryCode!: string | null;
  @field("item_count") itemCount!: number;
  @field("gross") gross!: number;
  @field("discount_amount") discountAmount!: number;
  @field("surcharge_amount") surchargeAmount!: number;
  @field("tax_amount") taxAmount!: number;
  @field("grand_total") grandTotal!: number;
  @field("cart_lines_snapshot_json") cartLinesSnapshotJson!: string;
  @field("payment_parts_snapshot_json") paymentPartsSnapshotJson!: string;
  @field("receipt_snapshot_json") receiptSnapshotJson!: string | null;
  @field("billing_document_remote_id") billingDocumentRemoteId!: string | null;
  @field("ledger_entry_remote_id") ledgerEntryRemoteId!: string | null;
  @field("posted_transaction_remote_ids_json")
  postedTransactionRemoteIdsJson!: string;
  @field("last_error_type") lastErrorType!: string | null;
  @field("last_error_message") lastErrorMessage!: string | null;
  @field("sync_status") recordSyncStatus!: RecordSyncStatusValue;
  @field("last_synced_at") lastSyncedAt!: number | null;
  @field("deleted_at") deletedAt!: number | null;

  @readonly @date("created_at") createdAt!: Date;
  @readonly @date("updated_at") updatedAt!: Date;
}
