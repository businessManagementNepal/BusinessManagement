import { EmiRepository } from "@/feature/emiLoans/data/repository/emi.repository";
import {
  EmiPlanMode,
  EmiPlanStatus,
  EmiPlanType,
} from "@/feature/emiLoans/types/emi.entity.types";
import { EmiValidationError } from "@/feature/emiLoans/types/emi.error.types";
import {
  buildInstallmentSchedule,
  createLocalRemoteId,
  resolvePaymentDirectionForPlanType,
} from "@/feature/emiLoans/viewModel/emi.shared";
import { AddEmiPlanUseCase } from "./addEmiPlan.useCase";

const normalizeRequired = (value: string): string => value.trim();

const normalizeOptional = (value: string | null): string | null => {
  if (value === null) {
    return null;
  }

  const normalizedValue = value.trim();
  return normalizedValue.length > 0 ? normalizedValue : null;
};

const isPlanTypeAllowedForMode = (
  planMode: "personal" | "business",
  planType: "my_emi" | "my_loan" | "business_loan" | "customer_installment",
): boolean => {
  if (planMode === EmiPlanMode.Business) {
    return (
      planType === EmiPlanType.BusinessLoan ||
      planType === EmiPlanType.CustomerInstallment
    );
  }

  return (
    planType === EmiPlanType.MyEmi ||
    planType === EmiPlanType.MyLoan
  );
};

export const createAddEmiPlanUseCase = (
  emiRepository: EmiRepository,
): AddEmiPlanUseCase => ({
  async execute(input) {
    const normalizedTitle = normalizeRequired(input.title);
    const normalizedUserId = normalizeRequired(input.ownerUserRemoteId);
    const normalizedLinkedAccountRemoteId = normalizeRequired(
      input.linkedAccountRemoteId,
    );
    const normalizedLinkedAccountLabel = normalizeRequired(
      input.linkedAccountDisplayNameSnapshot,
    );
    const normalizedBusinessAccountRemoteId = normalizeOptional(
      input.businessAccountRemoteId,
    );
    const normalizedCounterpartyName = normalizeOptional(input.counterpartyName);
    const normalizedCounterpartyPhone = normalizeOptional(input.counterpartyPhone);
    const normalizedNote = normalizeOptional(input.note);

    if (!normalizedUserId) {
      return {
        success: false,
        error: EmiValidationError("User context is required."),
      };
    }

    if (!normalizedLinkedAccountRemoteId) {
      return {
        success: false,
        error: EmiValidationError("Account context is required."),
      };
    }

    if (!normalizedLinkedAccountLabel) {
      return {
        success: false,
        error: EmiValidationError("Account label is required."),
      };
    }

    if (
      input.planMode === EmiPlanMode.Business &&
      !normalizedBusinessAccountRemoteId
    ) {
      return {
        success: false,
        error: EmiValidationError("Business account is required for business plans."),
      };
    }

    if (!isPlanTypeAllowedForMode(input.planMode, input.planType)) {
      return {
        success: false,
        error: EmiValidationError("Plan type is invalid for the selected EMI mode."),
      };
    }

    if (!normalizedTitle) {
      return {
        success: false,
        error: EmiValidationError("Please enter a plan title."),
      };
    }

    if (!Number.isFinite(input.totalAmount) || input.totalAmount <= 0) {
      return {
        success: false,
        error: EmiValidationError("Amount must be greater than zero."),
      };
    }

    if (!Number.isInteger(input.installmentCount) || input.installmentCount <= 0) {
      return {
        success: false,
        error: EmiValidationError("Installment count must be a whole number."),
      };
    }

    if (!Number.isFinite(input.firstDueAt) || input.firstDueAt <= 0) {
      return {
        success: false,
        error: EmiValidationError("Please choose a valid first due date."),
      };
    }

    if (input.reminderEnabled) {
      if (
        input.reminderDaysBefore === null ||
        !Number.isInteger(input.reminderDaysBefore) ||
        input.reminderDaysBefore < 1
      ) {
        return {
          success: false,
          error: EmiValidationError("Reminder days must be at least 1."),
        };
      }
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
        businessAccountRemoteId:
          input.planMode === EmiPlanMode.Business
            ? normalizedBusinessAccountRemoteId
            : null,
        planMode: input.planMode,
        planType: input.planType,
        paymentDirection,
        title: normalizedTitle,
        counterpartyName: normalizedCounterpartyName,
        counterpartyPhone: normalizedCounterpartyPhone,
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
          ? input.reminderDaysBefore
          : null,
        note: normalizedNote,
        status: EmiPlanStatus.Active,
      },
      installments,
    );
  },
});
