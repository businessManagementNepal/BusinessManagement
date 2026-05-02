import { Model } from "@nozbe/watermelondb";
import { date, field, readonly } from "@nozbe/watermelondb/decorators";
import { BudgetSyncStatusValue } from "@/feature/budget/types/budget.types";

export class BudgetPlanModel extends Model {
  static table = "budget_plans";

  @field("remote_id") remoteId!: string;
  @field("owner_user_remote_id") ownerUserRemoteId!: string;
  @field("account_remote_id") accountRemoteId!: string;
  @field("budget_month") budgetMonth!: string;
  @field("category_remote_id") categoryRemoteId!: string;
  @field("category_name_snapshot") categoryNameSnapshot!: string;
  @field("currency_code") currencyCode!: string | null;
  @field("planned_amount") plannedAmount!: number;
  @field("note") note!: string | null;
  @field("server_revision") serverRevision!: string | null;

  @field("sync_status")
  recordSyncStatus!: BudgetSyncStatusValue;
  @field("last_synced_at") lastSyncedAt!: number | null;
  @field("deleted_at") deletedAt!: number | null;

  @readonly
  @date("created_at")
  createdAt!: Date;

  @readonly
  @date("updated_at")
  updatedAt!: Date;
}
