import { createUpdateBudgetPlanUseCase } from "@/feature/budget/useCase/updateBudgetPlan.useCase.impl";
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
  createBudgetPlan: vi.fn(),
  updateBudgetPlan: vi.fn(async (payload: SaveBudgetPlanPayload) => ({
    success: true as const,
    value: buildBudgetPlan(payload),
  })),
  deleteBudgetPlanByRemoteId: vi.fn(),
});

describe("updateBudgetPlan.useCase", () => {
  it("updates a budget successfully", async () => {
    const repository = createRepository({
      existingBudgets: [buildBudgetPlan()],
    });
    const useCase = createUpdateBudgetPlanUseCase(repository as never);

    const result = await useCase.execute(
      buildPayload({
        plannedAmount: 750,
      }),
    );

    expect(result.success).toBe(true);
    expect(repository.updateBudgetPlan).toHaveBeenCalledWith(
      expect.objectContaining({
        plannedAmount: 750,
      }),
    );
  });

  it("blocks duplicate budgets during update", async () => {
    const repository = createRepository({
      existingBudgets: [
        buildBudgetPlan({
          remoteId: "budget-1",
          categoryRemoteId: "category-food",
        }),
        buildBudgetPlan({
          remoteId: "budget-2",
          categoryRemoteId: "category-rent",
        }),
      ],
    });
    const useCase = createUpdateBudgetPlanUseCase(repository as never);

    const result = await useCase.execute(
      buildPayload({
        remoteId: "budget-1",
        categoryRemoteId: "category-rent",
        categoryNameSnapshot: "Rent",
      }),
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe("DUPLICATE_BUDGET");
    }
    expect(repository.updateBudgetPlan).not.toHaveBeenCalled();
  });
});
