import {
  TransactionDirectionValue,
  TransactionPostingStatusValue,
  TransactionSourceModuleValue,
  TransactionSyncStatusValue,
  TransactionTypeValue,
} from "@/feature/transactions/types/transaction.entity.types";
import { Model } from "@nozbe/watermelondb";
import { date, field, readonly } from "@nozbe/watermelondb/decorators";

export class TransactionModel extends Model {
  static table = "transactions";

  @field("remote_id") remoteId!: string;
  @field("owner_user_remote_id") ownerUserRemoteId!: string;
  @field("account_remote_id") accountRemoteId!: string;
  @field("account_display_name_snapshot") accountDisplayNameSnapshot!: string;
  @field("transaction_type") transactionType!: TransactionTypeValue;
  @field("direction") direction!: TransactionDirectionValue;
  @field("title") title!: string;
  @field("amount") amount!: number;
  @field("currency_code") currencyCode!: string | null;
  @field("category_remote_id") categoryRemoteId!: string | null;
  @field("category_name_snapshot") categoryNameSnapshot!: string | null;
  @field("category_label") categoryLabel!: string | null;
  @field("note") note!: string | null;
  @field("happened_at") happenedAt!: number;
  @field("settlement_money_account_remote_id")
  settlementMoneyAccountRemoteId!: string | null;
  @field("settlement_money_account_display_name_snapshot")
  settlementMoneyAccountDisplayNameSnapshot!: string | null;
  @field("source_module") sourceModule!: TransactionSourceModuleValue | null;
  @field("source_remote_id") sourceRemoteId!: string | null;
  @field("source_action") sourceAction!: string | null;
  @field("idempotency_key") idempotencyKey!: string | null;
  @field("posting_status") postingStatus!: TransactionPostingStatusValue;
  @field("contact_remote_id") contactRemoteId!: string | null;
  @field("server_revision") serverRevision!: string | null;

  @field("sync_status") recordSyncStatus!: TransactionSyncStatusValue;
  @field("last_synced_at") lastSyncedAt!: number | null;
  @field("deleted_at") deletedAt!: number | null;

  @readonly
  @date("created_at")
  createdAt!: Date;

  @readonly
  @date("updated_at")
  updatedAt!: Date;
}
