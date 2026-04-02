import { Model } from "@nozbe/watermelondb";
import { date, field, readonly } from "@nozbe/watermelondb/decorators";
import {
  EmiPaymentDirectionValue,
  EmiPlanModeValue,
  EmiPlanStatusValue,
  EmiPlanTypeValue,
  EmiSyncStatusValue,
} from "@/feature/emiLoans/types/emi.entity.types";

export class EmiPlanModel extends Model {
  static table = "emi_plans";

  @field("remote_id") remoteId!: string;
  @field("owner_user_remote_id") ownerUserRemoteId!: string;
  @field("business_account_remote_id") businessAccountRemoteId!: string | null;
  @field("plan_mode") planMode!: EmiPlanModeValue;
  @field("plan_type") planType!: EmiPlanTypeValue;
  @field("payment_direction") paymentDirection!: EmiPaymentDirectionValue;
  @field("title") title!: string;
  @field("counterparty_name") counterpartyName!: string | null;
  @field("counterparty_phone") counterpartyPhone!: string | null;
  @field("linked_account_remote_id") linkedAccountRemoteId!: string;
  @field("linked_account_display_name_snapshot") linkedAccountDisplayNameSnapshot!: string;
  @field("currency_code") currencyCode!: string | null;
  @field("total_amount") totalAmount!: number;
  @field("installment_count") installmentCount!: number;
  @field("paid_installment_count") paidInstallmentCount!: number;
  @field("paid_amount") paidAmount!: number;
  @field("first_due_at") firstDueAt!: number;
  @field("next_due_at") nextDueAt!: number | null;
  @field("reminder_enabled") reminderEnabled!: boolean;
  @field("reminder_days_before") reminderDaysBefore!: number | null;
  @field("note") note!: string | null;
  @field("status") status!: EmiPlanStatusValue;
  @field("sync_status") recordSyncStatus!: EmiSyncStatusValue;
  @field("last_synced_at") lastSyncedAt!: number | null;
  @field("deleted_at") deletedAt!: number | null;

  @readonly
  @date("created_at")
  createdAt!: Date;

  @readonly
  @date("updated_at")
  updatedAt!: Date;
}
