import { Model } from "@nozbe/watermelondb";
import { date, field, readonly } from "@nozbe/watermelondb/decorators";
import {
  LedgerBalanceDirectionValue,
  LedgerPaymentModeValue,
  LedgerEntrySyncStatusValue,
  LedgerEntryTypeValue,
} from "@/feature/ledger/types/ledger.entity.types";

export class LedgerEntryModel extends Model {
  static table = "ledger_entries";

  @field("remote_id") remoteId!: string;
  @field("business_account_remote_id") businessAccountRemoteId!: string;
  @field("owner_user_remote_id") ownerUserRemoteId!: string;
  @field("party_name") partyName!: string;
  @field("party_phone") partyPhone!: string | null;
  @field("entry_type") entryType!: LedgerEntryTypeValue;
  @field("balance_direction") balanceDirection!: LedgerBalanceDirectionValue;
  @field("title") title!: string;
  @field("amount") amount!: number;
  @field("currency_code") currencyCode!: string | null;
  @field("note") note!: string | null;
  @field("happened_at") happenedAt!: number;
  @field("due_at") dueAt!: number | null;
  @field("payment_mode") paymentMode!: LedgerPaymentModeValue | null;
  @field("reference_number") referenceNumber!: string | null;
  @field("reminder_at") reminderAt!: number | null;
  @field("attachment_uri") attachmentUri!: string | null;
  @field("settled_against_entry_remote_id")
  settledAgainstEntryRemoteId!: string | null;
  @field("linked_document_remote_id")
  linkedDocumentRemoteId!: string | null;
  @field("linked_transaction_remote_id")
  linkedTransactionRemoteId!: string | null;
  @field("settlement_account_remote_id") settlementAccountRemoteId!: string | null;
  @field("settlement_account_display_name_snapshot")
  settlementAccountDisplayNameSnapshot!: string | null;

  @field("sync_status") recordSyncStatus!: LedgerEntrySyncStatusValue;
  @field("last_synced_at") lastSyncedAt!: number | null;
  @field("deleted_at") deletedAt!: number | null;

  @readonly
  @date("created_at")
  createdAt!: Date;

  @readonly
  @date("updated_at")
  updatedAt!: Date;
}
