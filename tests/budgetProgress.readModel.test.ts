import { createBudgetProgressRepository } from "@/shared/readModel/budgetProgress/data/repository/budgetProgress.repository.impl";
import { createGetBudgetProgressReadModelUseCase } from "@/shared/readModel/budgetProgress/useCase/getBudgetProgressReadModel.useCase.impl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const buildBudgetPlanModel = (overrides: Record<string, unknown> = {}) =>
  ({
    remoteId: "budget-1",
    accountRemoteId: "personal-1",
    budgetMonth: "2026-05",
    categoryRemoteId: "category-groceries",
    categoryNameSnapshot: "Groceries",
    currencyCode: "NPR",
    plannedAmount: 500,
    note: null,
    ...overrides,
  }) as any;

const buildTransactionModel = (overrides: Record<string, unknown> = {}) =>
  ({
    remoteId: "txn-1",
    transactionType: "expense",
    categoryRemoteId: "category-groceries",
    categoryLabel: "Food",
    happenedAt: new Date("2026-05-10T10:00:00.000Z").getTime(),
    amount: 120,
    ...overrides,
  }) as any;

describe("budgetProgress.readModel", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-15T10:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("uses categoryRemoteId as the primary spending key and keeps rename-safe totals", async () => {
    const datasource = {
      getDataset: vi.fn(async () => ({
        success: true as const,
        value: {
          budgetPlans: [
            buildBudgetPlanModel(),
            buildBudgetPlanModel({
              remoteId: "budget-2",
              categoryRemoteId: "category-travel",
              categoryNameSnapshot: "Travel",
              plannedAmount: 50,
            }),
          ],
          transactions: [
            buildTransactionModel({
              remoteId: "txn-id-match",
              categoryRemoteId: "category-groceries",
              categoryLabel: "Food",
              amount: 120,
            }),
            buildTransactionModel({
              remoteId: "txn-label-only-fallback",
              categoryRemoteId: null,
              categoryLabel: "Groceries",
              amount: 30,
            }),
            buildTransactionModel({
              remoteId: "txn-refund",
              transactionType: "refund",
              categoryRemoteId: "category-groceries",
              categoryLabel: "Groceries",
              amount: 50,
            }),
            buildTransactionModel({
              remoteId: "txn-same-label-different-id",
              categoryRemoteId: "category-other",
              categoryLabel: "Groceries",
              amount: 80,
            }),
            buildTransactionModel({
              remoteId: "txn-travel",
              categoryRemoteId: "category-travel",
              categoryLabel: "Travel",
              amount: 80,
            }),
          ],
        },
      })),
    };

    const repository = createBudgetProgressRepository(datasource as never);
    const useCase = createGetBudgetProgressReadModelUseCase(repository);

    const result = await useCase.execute({
      ownerUserRemoteId: "user-1",
      accountRemoteId: "personal-1",
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    const groceriesItem = result.value.items.find(
      (item) => item.budgetRemoteId === "budget-1",
    );
    const travelItem = result.value.items.find(
      (item) => item.budgetRemoteId === "budget-2",
    );

    expect(groceriesItem?.spentAmount).toBe(100);
    expect(groceriesItem?.remainingAmount).toBe(400);
    expect(travelItem?.spentAmount).toBe(80);
    expect(travelItem?.isOverspent).toBe(true);
    expect(result.value.summary.currentMonthPlannedAmount).toBe(550);
    expect(result.value.summary.currentMonthSpentAmount).toBe(180);
    expect(result.value.summary.currentMonthRemainingAmount).toBe(370);
    expect(result.value.summary.hasOverspentBudget).toBe(true);
  });

  it("validates active account context before querying", async () => {
    const datasource = {
      getDataset: vi.fn(),
    };
    const repository = createBudgetProgressRepository(datasource as never);
    const useCase = createGetBudgetProgressReadModelUseCase(repository);

    const result = await useCase.execute({
      ownerUserRemoteId: "user-1",
      accountRemoteId: "   ",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain("Account context is required");
    }
    expect(datasource.getDataset).not.toHaveBeenCalled();
  });
});
