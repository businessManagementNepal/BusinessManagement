import { EmiRepository } from "@/feature/emiLoans/data/repository/emi.repository";
import {
  EmiInstallmentStatus,
  EmiPaymentDirection,
  EmiPlan,
  EmiPlanMode,
  EmiPlanStatus,
  EmiPlanType,
  SaveEmiPlanPayload,
} from "@/feature/emiLoans/types/emi.entity.types";
import { EmiPlanNotFoundError } from "@/feature/emiLoans/types/emi.error.types";
import { createAddEmiPlanUseCase } from "@/feature/emiLoans/useCase/addEmiPlan.useCase.impl";
import { AddEmiPlanInput } from "@/feature/emiLoans/useCase/addEmiPlan.useCase";
import { describe, expect, it, vi } from "vitest";

const buildInput = (
  overrides: Partial<AddEmiPlanInput> = {},
): AddEmiPlanInput => ({
  ownerUserRemoteId: "  user-1  ",
  businessAccountRemoteId: null,
  linkedAccountRemoteId: "  account-1  ",
  linkedAccountDisplayNameSnapshot: "  Main Account  ",
  currencyCode: "NPR",
  planMode: EmiPlanMode.Personal,
  planType: EmiPlanType.MyEmi,
  title: "  Phone EMI  ",
  counterpartyName: "  Nabil Bank  ",
  counterpartyPhone: "  9800000000  ",
  totalAmount: 50000,
  installmentCount: 12,
  firstDueAt: 1767225600000,
  reminderEnabled: true,
  reminderDaysBefore: 1,
  note: "  Device purchase  ",
  ...overrides,
});

const buildPlan = (
  payload: SaveEmiPlanPayload,
): EmiPlan => ({
  ...payload,
  createdAt: 1,
  updatedAt: 1,
});

const createRepository = (
  savePlanWithInstallmentsMock: EmiRepository["savePlanWithInstallments"],
): EmiRepository => ({
  savePlanWithInstallments: savePlanWithInstallmentsMock,
  getPersonalPlansByOwnerUserRemoteId: vi.fn(async () => ({
    success: true as const,
    value: [],
  })),
  getBusinessPlansByBusinessAccountRemoteId: vi.fn(async () => ({
    success: true as const,
    value: [],
  })),
  getPlanDetailByRemoteId: vi.fn(async () => ({
    success: false as const,
    error: EmiPlanNotFoundError,
  })),
  completeInstallmentPayment: vi.fn(async () => ({
    success: true as const,
    value: true,
  })),
});

describe("addEmiPlan.useCase", () => {
  it("rejects invalid reminder days when reminder is enabled", async () => {
    const savePlanWithInstallmentsMock = vi.fn<
      EmiRepository["savePlanWithInstallments"]
    >(async () => ({
      success: true as const,
      value: buildPlan({
        remoteId: "plan-1",
        ownerUserRemoteId: "user-1",
        businessAccountRemoteId: null,
        planMode: EmiPlanMode.Personal,
        planType: EmiPlanType.MyEmi,
        paymentDirection: EmiPaymentDirection.Pay,
        title: "Phone EMI",
        counterpartyName: null,
        counterpartyPhone: null,
        linkedAccountRemoteId: "account-1",
        linkedAccountDisplayNameSnapshot: "Main Account",
        currencyCode: "NPR",
        totalAmount: 50000,
        installmentCount: 12,
        paidInstallmentCount: 0,
        paidAmount: 0,
        firstDueAt: 1767225600000,
        nextDueAt: 1767225600000,
        reminderEnabled: true,
        reminderDaysBefore: 1,
        note: null,
        status: EmiPlanStatus.Active,
      }),
    }));

    const repository = createRepository(savePlanWithInstallmentsMock);
    const useCase = createAddEmiPlanUseCase(repository);

    const result = await useCase.execute(
      buildInput({ reminderDaysBefore: 0 }),
    );

    expect(result.success).toBe(false);
    expect(savePlanWithInstallmentsMock).not.toHaveBeenCalled();

    if (!result.success) {
      expect(result.error.message).toBe("Reminder days must be at least 1.");
    }
  });

  it("rejects plan type that does not belong to the selected mode", async () => {
    const savePlanWithInstallmentsMock = vi.fn<
      EmiRepository["savePlanWithInstallments"]
    >(async () => ({
      success: true as const,
      value: buildPlan({
        remoteId: "plan-1",
        ownerUserRemoteId: "user-1",
        businessAccountRemoteId: null,
        planMode: EmiPlanMode.Personal,
        planType: EmiPlanType.MyEmi,
        paymentDirection: EmiPaymentDirection.Pay,
        title: "Phone EMI",
        counterpartyName: null,
        counterpartyPhone: null,
        linkedAccountRemoteId: "account-1",
        linkedAccountDisplayNameSnapshot: "Main Account",
        currencyCode: "NPR",
        totalAmount: 50000,
        installmentCount: 12,
        paidInstallmentCount: 0,
        paidAmount: 0,
        firstDueAt: 1767225600000,
        nextDueAt: 1767225600000,
        reminderEnabled: false,
        reminderDaysBefore: null,
        note: null,
        status: EmiPlanStatus.Active,
      }),
    }));

    const repository = createRepository(savePlanWithInstallmentsMock);
    const useCase = createAddEmiPlanUseCase(repository);

    const result = await useCase.execute(
      buildInput({
        planMode: EmiPlanMode.Personal,
        planType: EmiPlanType.BusinessLoan,
      }),
    );

    expect(result.success).toBe(false);
    expect(savePlanWithInstallmentsMock).not.toHaveBeenCalled();

    if (!result.success) {
      expect(result.error.message).toBe(
        "Plan type is invalid for the selected EMI mode.",
      );
    }
  });

  it("normalizes trimmed values before saving", async () => {
    const savePlanWithInstallmentsMock = vi.fn<
      EmiRepository["savePlanWithInstallments"]
    >(async (plan, installments) => ({
      success: true as const,
      value: buildPlan({
        ...plan,
        nextDueAt: installments[0]?.dueAt ?? null,
      }),
    }));

    const repository = createRepository(savePlanWithInstallmentsMock);
    const useCase = createAddEmiPlanUseCase(repository);

    const result = await useCase.execute(buildInput());

    expect(result.success).toBe(true);
    expect(savePlanWithInstallmentsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        ownerUserRemoteId: "user-1",
        linkedAccountRemoteId: "account-1",
        linkedAccountDisplayNameSnapshot: "Main Account",
        title: "Phone EMI",
        counterpartyName: "Nabil Bank",
        counterpartyPhone: "9800000000",
        note: "Device purchase",
      }),
      expect.arrayContaining([
        expect.objectContaining({
          installmentNumber: 1,
          status: EmiInstallmentStatus.Pending,
        }),
      ]),
    );
  });
});
