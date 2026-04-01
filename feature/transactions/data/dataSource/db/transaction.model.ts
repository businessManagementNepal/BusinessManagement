import { Model } from "@nozbe/watermelondb";
import { date, field, readonly } from "@nozbe/watermelondb/decorators";
import {
  TransactionDirectionValue,
  TransactionSyncStatusValue,
  TransactionTypeValue,
} from "@/feature/transactions/types/transaction.entity.types";

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
  @field("category_label") categoryLabel!: string | null;
  @field("note") note!: string | null;
  @field("happened_at") happenedAt!: number;

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
