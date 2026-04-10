import { Model } from "@nozbe/watermelondb";
import { date, field, readonly } from "@nozbe/watermelondb/decorators";

export class BillingDocumentAllocationModel extends Model {
  static table = "billing_document_allocations";

  @field("remote_id") remoteId!: string;
  @field("account_remote_id") accountRemoteId!: string;
  @field("document_remote_id") documentRemoteId!: string;
  @field("settlement_ledger_entry_remote_id")
  settlementLedgerEntryRemoteId!: string | null;
  @field("settlement_transaction_remote_id")
  settlementTransactionRemoteId!: string | null;
  @field("amount") amount!: number;
  @field("settled_at") settledAt!: number;
  @field("note") note!: string | null;
  @field("deleted_at") deletedAt!: number | null;

  @readonly @date("created_at") createdAt!: Date;
  @readonly @date("updated_at") updatedAt!: Date;
}
