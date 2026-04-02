import { EmiRepository } from "@/feature/emiLoans/data/repository/emi.repository";
import {
  EmiPlanMode,
  EmiPlanStatus,
} from "@/feature/emiLoans/types/emi.entity.types";
import { EmiValidationError } from "@/feature/emiLoans/types/emi.error.types";
import {
  buildInstallmentSchedule,
  createLocalRemoteId,
  resolvePaymentDirectionForPlanType,
} from "@/feature/emiLoans/viewModel/emi.shared";
import { AddEmiPlanInput, AddEmiPlanUseCase } from "./addEmiPlan.useCase";

export const createAddEmiPlanUseCase = (
  emiRepository: EmiRepository,
): AddEmiPlanUseCase => ({
  async execute(input) {
    const normalizedTitle = input.title.trim();
    const normalizedUserId = input.ownerUserRemoteId.trim();
    const normalizedLinkedAccountRemoteId = input.linkedAccountRemoteId.trim();
    const normalizedLinkedAccountLabel = input.linkedAccountDisplayNameSnapshot.trim();

    if (!normalizedUserId) {
      return { success: false, error: EmiValidationError("User context is required.") };
    }

    if (!normalizedLinkedAccountRemoteId) {
      return { success: false, error: EmiValidationError("Account context is required.") };
    }

    if (!normalizedLinkedAccountLabel) {
      return { success: false, error: EmiValidationError("Account label is required.") };
    }

    if (input.planMode === EmiPlanMode.Business && !input.businessAccountRemoteId?.trim()) {
      return {
        success: false,
        error: EmiValidationError("Business account is required for business plans."),
      };
    }

    if (!normalizedTitle) {
      return { success: false, error: EmiValidationError("Please enter a plan title.") };
    }

    if (!Number.isFinite(input.totalAmount) || input.totalAmount <= 0) {
      return { success: false, error: EmiValidationError("Amount must be greater than zero.") };
    }

    if (!Number.isInteger(input.installmentCount) || input.installmentCount <= 0) {
      return {
        success: false,
        error: EmiValidationError("Installment count must be a whole number."),
      };
    }

    if (!Number.isFinite(input.firstDueAt) || input.firstDueAt <= 0) {
      return { success: false, error: EmiValidationError("Please choose a valid first due date.") };
    }

    const remoteId = createLocalRemoteId("emi_plan");
    const paymentDirection = resolvePaymentDirectionForPlanType(input.planType);
    const installments = buildInstallmentSchedule(
      remoteId,
      input.totalAmount,
      input.installmentCount,
      input.firstDueAt,
    );

    return emiRepository.savePlanWithInstallments(
      {
        remoteId,
        ownerUserRemoteId: normalizedUserId,
        businessAccountRemoteId: input.businessAccountRemoteId?.trim() || null,
        planMode: input.planMode,
        planType: input.planType,
        paymentDirection,
        title: normalizedTitle,
        counterpartyName: input.counterpartyName?.trim() || null,
        counterpartyPhone: input.counterpartyPhone?.trim() || null,
        linkedAccountRemoteId: normalizedLinkedAccountRemoteId,
        linkedAccountDisplayNameSnapshot: normalizedLinkedAccountLabel,
        currencyCode: input.currencyCode,
        totalAmount: input.totalAmount,
        installmentCount: input.installmentCount,
        paidInstallmentCount: 0,
        paidAmount: 0,
        firstDueAt: input.firstDueAt,
        nextDueAt: installments[0]?.dueAt ?? null,
        reminderEnabled: input.reminderEnabled,
        reminderDaysBefore: input.reminderEnabled
          ? Math.max(1, input.reminderDaysBefore ?? 1)
          : null,
        note: input.note?.trim() || null,
        status: EmiPlanStatus.Active,
      },
      installments,
    );
  },
});
