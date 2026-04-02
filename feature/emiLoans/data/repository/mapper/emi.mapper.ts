import {
  EmiInstallment,
  EmiPlan,
  InstallmentPaymentLink,
} from "@/feature/emiLoans/types/emi.entity.types";
import { EmiInstallmentModel } from "../../dataSource/db/emiInstallment.model";
import { EmiPlanModel } from "../../dataSource/db/emiPlan.model";
import { InstallmentPaymentLinkModel } from "../../dataSource/db/installmentPaymentLink.model";

export const mapEmiPlanModelToDomain = async (
  model: EmiPlanModel,
): Promise<EmiPlan> => ({
  remoteId: model.remoteId,
  ownerUserRemoteId: model.ownerUserRemoteId,
  businessAccountRemoteId: model.businessAccountRemoteId,
  planMode: model.planMode,
  planType: model.planType,
  paymentDirection: model.paymentDirection,
  title: model.title,
  counterpartyName: model.counterpartyName,
  counterpartyPhone: model.counterpartyPhone,
  linkedAccountRemoteId: model.linkedAccountRemoteId,
  linkedAccountDisplayNameSnapshot: model.linkedAccountDisplayNameSnapshot,
  currencyCode: model.currencyCode,
  totalAmount: model.totalAmount,
  installmentCount: model.installmentCount,
  paidInstallmentCount: model.paidInstallmentCount,
  paidAmount: model.paidAmount,
  firstDueAt: model.firstDueAt,
  nextDueAt: model.nextDueAt,
  reminderEnabled: model.reminderEnabled,
  reminderDaysBefore: model.reminderDaysBefore,
  note: model.note,
  status: model.status,
  createdAt: model.createdAt.getTime(),
  updatedAt: model.updatedAt.getTime(),
});

export const mapEmiInstallmentModelToDomain = async (
  model: EmiInstallmentModel,
): Promise<EmiInstallment> => ({
  remoteId: model.remoteId,
  planRemoteId: model.planRemoteId,
  installmentNumber: model.installmentNumber,
  amount: model.amount,
  dueAt: model.dueAt,
  status: model.status,
  paidAt: model.paidAt,
  createdAt: model.createdAt.getTime(),
  updatedAt: model.updatedAt.getTime(),
});

export const mapInstallmentPaymentLinkModelToDomain = async (
  model: InstallmentPaymentLinkModel,
): Promise<InstallmentPaymentLink> => ({
  remoteId: model.remoteId,
  planRemoteId: model.planRemoteId,
  installmentRemoteId: model.installmentRemoteId,
  paymentRecordType: model.paymentRecordType,
  paymentRecordRemoteId: model.paymentRecordRemoteId,
  paymentDirection: model.paymentDirection,
  amount: model.amount,
  createdAt: model.createdAt.getTime(),
  updatedAt: model.updatedAt.getTime(),
});
