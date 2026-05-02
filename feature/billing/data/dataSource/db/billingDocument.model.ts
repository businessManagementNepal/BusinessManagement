import {
    BillingDocumentStatusValue,
    BillingDocumentTypeValue,
    BillingTemplateTypeValue,
} from "@/feature/billing/types/billing.types";
import { Model } from "@nozbe/watermelondb";
import { date, field, readonly } from "@nozbe/watermelondb/decorators";

export class BillingDocumentModel extends Model {
  static table = "billing_documents";

  @field("remote_id") remoteId!: string;
  @field("account_remote_id") accountRemoteId!: string;
  @field("document_number") documentNumber!: string;
  @field("document_type") documentType!: BillingDocumentTypeValue;
  @field("template_type") templateType!: BillingTemplateTypeValue;
  @field("customer_name") customerName!: string;
  @field("contact_remote_id") contactRemoteId!: string | null;
  @field("status") status!: BillingDocumentStatusValue;
  @field("tax_rate_percent") taxRatePercent!: number;
  @field("notes") notes!: string | null;
  @field("subtotal_amount") subtotalAmount!: number;
  @field("tax_amount") taxAmount!: number;
  @field("total_amount") totalAmount!: number;
  @field("issued_at") issuedAt!: number;
  @field("due_at") dueAt!: number | null;
  @field("source_module") sourceModule!: string | null;
  @field("source_remote_id") sourceRemoteId!: string | null;
  @field("linked_ledger_entry_remote_id")
  linkedLedgerEntryRemoteId!: string | null;
  @field("pos_workflow_status") posWorkflowStatus!: string | null;
  @field("server_revision") serverRevision!: string | null;
  @field("sync_status") recordSyncStatus!: string;
  @field("last_synced_at") lastSyncedAt!: number | null;
  @field("deleted_at") deletedAt!: number | null;

  @readonly @date("created_at") createdAt!: Date;
  @readonly @date("updated_at") updatedAt!: Date;
}
