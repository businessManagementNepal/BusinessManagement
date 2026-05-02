import { Model } from "@nozbe/watermelondb";
import { date, field, readonly } from "@nozbe/watermelondb/decorators";
import {
  EmiPaymentDirectionValue,
  InstallmentPaymentRecordTypeValue,
} from "@/feature/emiLoans/types/emi.entity.types";

export class InstallmentPaymentLinkModel extends Model {
  static table = "installment_payment_links";

  @field("remote_id") remoteId!: string;
  @field("plan_remote_id") planRemoteId!: string;
  @field("installment_remote_id") installmentRemoteId!: string;
  @field("payment_record_type") paymentRecordType!: InstallmentPaymentRecordTypeValue;
  @field("payment_record_remote_id") paymentRecordRemoteId!: string;
  @field("payment_direction") paymentDirection!: EmiPaymentDirectionValue;
  @field("amount") amount!: number;
  @field("server_revision") serverRevision!: string | null;

  @readonly
  @date("created_at")
  createdAt!: Date;

  @readonly
  @date("updated_at")
  updatedAt!: Date;
}
