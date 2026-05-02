import { Model } from "@nozbe/watermelondb";
import { date, field, readonly } from "@nozbe/watermelondb/decorators";
import {
  MoneyAccountSyncStatusValue,
  MoneyAccountTypeValue,
} from "@/feature/accounts/types/moneyAccount.types";

export class MoneyAccountModel extends Model {
  static table = "money_accounts";

  @field("remote_id") remoteId!: string;
  @field("owner_user_remote_id") ownerUserRemoteId!: string;
  @field("scope_account_remote_id") scopeAccountRemoteId!: string;
  @field("name") name!: string;
  @field("account_type") accountType!: MoneyAccountTypeValue;
  @field("current_balance") currentBalance!: number;
  @field("opening_balance_amount") openingBalanceAmount!: number | null;
  @field("opening_balance_direction") openingBalanceDirection!: string | null;
  @field("description") description!: string | null;
  @field("currency_code") currencyCode!: string | null;
  @field("is_primary") isPrimary!: boolean;
  @field("is_active") isActive!: boolean;
  @field("server_revision") serverRevision!: string | null;

  @field("sync_status")
  recordSyncStatus!: MoneyAccountSyncStatusValue;
  @field("last_synced_at") lastSyncedAt!: number | null;
  @field("deleted_at") deletedAt!: number | null;

  @readonly
  @date("created_at")
  createdAt!: Date;

  @readonly
  @date("updated_at")
  updatedAt!: Date;
}
