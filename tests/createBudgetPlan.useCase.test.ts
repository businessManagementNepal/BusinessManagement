import { createCreateBudgetPlanUseCase } from "@/feature/budget/useCase/createBudgetPlan.useCase.impl";
import { BudgetPlan, SaveBudgetPlanPayload } from "@/feature/budget/types/budget.types";
import { describe, expect, it, vi } from "vitest";

const buildPayload = (
  overrides: Partial<SaveBudgetPlanPayload> = {},
): SaveBudgetPlanPayload => ({
  remoteId: "budget-1",
  ownerUserRemoteId: "user-1",
  accountRemoteId: "personal-1",
  budgetMonth: "2026-05",
  categoryRemoteId: "category-food",
  categoryNameSnapshot: "Food",
  currencyCode: "NPR",
  plannedAmount: 500,
  note: null,
  ...overrides,
});

const buildBudgetPlan = (
  overrides: Partial<BudgetPlan> = {},
): BudgetPlan => ({
  remoteId: "budget-1",
  ownerUserRemoteId: "user-1",
  accountRemoteId: "personal-1",
  budgetMonth: "2026-05",
  categoryRemoteId: "category-food",
  categoryNameSnapshot: "Food",
  currencyCode: "NPR",
  plannedAmount: 500,
  note: null,
  createdAt: 1,
  updatedAt: 1,
  ...overrides,
});

const createRepository = ({
  existingBudgets = [],
}: {
  existingBudgets?: readonly BudgetPlan[];
} = {}) => ({
  getBudgetPlansByAccountRemoteId: vi.fn(async () => ({
    success: true as const,
    value: [...existingBudgets],
  })),
  getBudgetPlanByRemoteId: vi.fn(),
  createBudgetPlan: vi.fn(async (payload: SaveBudgetPlanPayload) => ({
    success: true as const,
    value: buildBudgetPlan(payload),
  })),
  updateBudgetPlan: vi.fn(),
  deleteBudgetPlanByRemoteId: vi.fn(),
});

describe("createBudgetPlan.useCase", () => {
  it("creates a budget successfully", async () => {
    const repository = createRepository();
    const useCase = createCreateBudgetPlanUseCase(repository as never);

    const result = await useCase.execute(buildPayload());

    expect(result.success).toBe(true);
    expect(repository.createBudgetPlan).toHaveBeenCalledWith(
      expect.objectContaining({
        budgetMonth: "2026-05",
        categoryRemoteId: "category-food",
      }),
    );
  });

  it("blocks duplicate budgets for the same account, month, and category", async () => {
    const repository = createRepository({
      existingBudgets: [buildBudgetPlan()],
    });
    const useCase = createCreateBudgetPlanUseCase(repository as never);

    const result = await useCase.execute(buildPayload());

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe("DUPLICATE_BUDGET");
    }
    expect(repository.createBudgetPlan).not.toHaveBeenCalled();
  });

  it("allows the same month and category in another account", async () => {
    const repository = createRepository({
      existingBudgets: [],
    });
    const useCase = createCreateBudgetPlanUseCase(repository as never);

    const result = await useCase.execute(
      buildPayload({
        accountRemoteId: "personal-2",
      }),
    );

    expect(result.success).toBe(true);
    expect(repository.getBudgetPlansByAccountRemoteId).toHaveBeenCalledWith(
      "personal-2",
    );
  });

  it("rejects invalid budget months", async () => {
    const repository = createRepository();
    const useCase = createCreateBudgetPlanUseCase(repository as never);

    const result = await useCase.execute(
      buildPayload({
        budgetMonth: "2026-99",
      }),
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain("between 01 and 12");
    }
    expect(repository.createBudgetPlan).not.toHaveBeenCalled();
  });

  it("rejects non-positive planned amounts", async () => {
    const repository = createRepository();
    const useCase = createCreateBudgetPlanUseCase(repository as never);

    const result = await useCase.execute(
      buildPayload({
        plannedAmount: 0,
      }),
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain("greater than zero");
    }
    expect(repository.createBudgetPlan).not.toHaveBeenCalled();
  });
});
