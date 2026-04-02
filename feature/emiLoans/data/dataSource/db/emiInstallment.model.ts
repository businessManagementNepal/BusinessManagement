import { Model } from "@nozbe/watermelondb";
import { date, field, readonly } from "@nozbe/watermelondb/decorators";
import { EmiInstallmentStatusValue } from "@/feature/emiLoans/types/emi.entity.types";

export class EmiInstallmentModel extends Model {
  static table = "emi_installments";

  @field("remote_id") remoteId!: string;
  @field("plan_remote_id") planRemoteId!: string;
  @field("installment_number") installmentNumber!: number;
  @field("amount") amount!: number;
  @field("due_at") dueAt!: number;
  @field("status") status!: EmiInstallmentStatusValue;
  @field("paid_at") paidAt!: number | null;

  @readonly
  @date("created_at")
  createdAt!: Date;

  @readonly
  @date("updated_at")
  updatedAt!: Date;
}
