// @vitest-environment jsdom

import type { ReactElement } from "react";
import { BudgetListFilter } from "@/feature/budget/viewModel/budget.viewModel";
import { useBudgetViewModel } from "@/feature/budget/viewModel/budget.viewModel.impl";
import { AccountType } from "@/feature/auth/accountSelection/types/accountSelection.types";
import React, { act, useEffect } from "react";
import { createRoot, Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("react-native", async () => {
  const ReactModule = await import("react");
  const createHost =
    (tag: string) =>
    ({ children, ...props }: Record<string, unknown>) =>
      ReactModule.createElement(
        tag,
        props,
        children as React.ReactNode,
      ) as ReactElement;

  return {
    Platform: {
      OS: "web",
      select: <T,>(values: { web?: T; default?: T }) =>
        values.web ?? values.default,
    },
    StyleSheet: {
      create: <T,>(styles: T) => styles,
    },
    Text: createHost("mock-text"),
    View: createHost("mock-view"),
  };
});

vi.mock("expo-crypto", () => ({
  randomUUID: () => "budget-generated-id",
}));

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const flushEffects = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
};

const buildBudgetPlan = (overrides: Record<string, unknown> = {}) => ({
  remoteId: "budget-overspent",
  ownerUserRemoteId: "user-1",
  accountRemoteId: "personal-1",
  budgetMonth: "2026-05",
  categoryRemoteId: "category-food",
  categoryNameSnapshot: "Food",
  currencyCode: "NPR",
  plannedAmount: 100,
  note: null,
  createdAt: 1,
  updatedAt: 1,
  ...overrides,
});

const buildReadModel = () => ({
  items: [
    {
      budgetRemoteId: "budget-overspent",
      accountRemoteId: "personal-1",
      budgetMonth: "2026-05",
      categoryRemoteId: "category-food",
      categoryNameSnapshot: "Food",
      plannedAmount: 100,
      spentAmount: 130,
      remainingAmount: -30,
      progressPercent: 100,
      isOverspent: true,
      currencyCode: "NPR",
      note: null,
    },
    {
      budgetRemoteId: "budget-rent",
      accountRemoteId: "personal-1",
      budgetMonth: "2026-05",
      categoryRemoteId: "category-rent",
      categoryNameSnapshot: "Rent",
      plannedAmount: 500,
      spentAmount: 250,
      remainingAmount: 250,
      progressPercent: 50,
      isOverspent: false,
      currencyCode: "NPR",
      note: "Fixed cost",
    },
    {
      budgetRemoteId: "budget-april",
      accountRemoteId: "personal-1",
      budgetMonth: "2026-04",
      categoryRemoteId: "category-travel",
      categoryNameSnapshot: "Travel",
      plannedAmount: 200,
      spentAmount: 80,
      remainingAmount: 120,
      progressPercent: 40,
      isOverspent: false,
      currencyCode: "NPR",
      note: null,
    },
  ],
  summary: {
    currentMonthPlannedAmount: 600,
    currentMonthSpentAmount: 380,
    currentMonthRemainingAmount: 220,
    hasOverspentBudget: true,
  },
});

const buildCategories = () => [
  {
    remoteId: "category-food",
    ownerUserRemoteId: "user-1",
    accountRemoteId: "personal-1",
    accountType: AccountType.Personal,
    scope: "personal",
    kind: "expense",
    name: "Food",
    description: null,
    isSystem: true,
    createdAt: 1,
    updatedAt: 1,
  },
  {
    remoteId: "category-rent",
    ownerUserRemoteId: "user-1",
    accountRemoteId: "personal-1",
    accountType: AccountType.Personal,
    scope: "personal",
    kind: "expense",
    name: "Rent",
    description: null,
    isSystem: true,
    createdAt: 1,
    updatedAt: 1,
  },
];

type HarnessProps = {
  ownerUserRemoteId: string | null;
  accountRemoteId: string | null;
  getBudgetPlanByRemoteIdUseCase: {
    execute: ReturnType<typeof vi.fn>;
  };
  createBudgetPlanUseCase: {
    execute: ReturnType<typeof vi.fn>;
  };
  updateBudgetPlanUseCase: {
    execute: ReturnType<typeof vi.fn>;
  };
  deleteBudgetPlanUseCase: {
    execute: ReturnType<typeof vi.fn>;
  };
  saveCategoryUseCase: {
    execute: ReturnType<typeof vi.fn>;
  };
  getCategoriesUseCase: {
    execute: ReturnType<typeof vi.fn>;
  };
  getBudgetProgressReadModelUseCase: {
    execute: ReturnType<typeof vi.fn>;
  };
  onOpenCategoryManager?: () => void;
  onUpdate: (value: ReturnType<typeof useBudgetViewModel>) => void;
};

function BudgetViewModelHarness(props: HarnessProps) {
  const viewModel = useBudgetViewModel({
    ownerUserRemoteId: props.ownerUserRemoteId,
    accountRemoteId: props.accountRemoteId,
    currencyCode: "NPR",
    countryCode: "NP",
    getBudgetPlanByRemoteIdUseCase: props.getBudgetPlanByRemoteIdUseCase as never,
    createBudgetPlanUseCase: props.createBudgetPlanUseCase as never,
    updateBudgetPlanUseCase: props.updateBudgetPlanUseCase as never,
    deleteBudgetPlanUseCase: props.deleteBudgetPlanUseCase as never,
    getCategoriesUseCase: props.getCategoriesUseCase as never,
    saveCategoryUseCase: props.saveCategoryUseCase as never,
    getBudgetProgressReadModelUseCase:
      props.getBudgetProgressReadModelUseCase as never,
    onOpenCategoryManager: props.onOpenCategoryManager,
  });

  useEffect(() => {
    props.onUpdate(viewModel);
  }, [props, viewModel]);

  return null;
}

describe("budget.viewModel", () => {
  let container: HTMLDivElement;
  let root: Root;
  let latestViewModel: ReturnType<typeof useBudgetViewModel> | null = null;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-15T10:00:00.000Z"));
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    latestViewModel = null;
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    vi.useRealTimers();
  });

  const renderHarness = async (overrides: Partial<HarnessProps> = {}) => {
    const props: HarnessProps = {
      ownerUserRemoteId: "user-1",
      accountRemoteId: "personal-1",
      getBudgetPlanByRemoteIdUseCase: {
        execute: vi.fn(async ({ remoteId }) => ({
          success: true as const,
          value: buildBudgetPlan({
            remoteId,
          }),
        })),
      },
      createBudgetPlanUseCase: {
        execute: vi.fn(async () => ({
          success: true as const,
          value: buildBudgetPlan(),
        })),
      },
      updateBudgetPlanUseCase: {
        execute: vi.fn(async () => ({
          success: true as const,
          value: buildBudgetPlan(),
        })),
      },
      deleteBudgetPlanUseCase: {
        execute: vi.fn(async () => ({
          success: true as const,
          value: true,
        })),
      },
      saveCategoryUseCase: {
        execute: vi.fn(async () => ({
          success: true as const,
          value: {
            remoteId: "category-quick",
            ownerUserRemoteId: "user-1",
            accountRemoteId: "personal-1",
            accountType: AccountType.Personal,
            scope: "personal",
            kind: "expense",
            name: "Quick Category",
            description: null,
            isSystem: false,
            createdAt: 1,
            updatedAt: 1,
          },
        })),
      },
      getCategoriesUseCase: {
        execute: vi.fn(async () => ({
          success: true as const,
          value: buildCategories(),
        })),
      },
      getBudgetProgressReadModelUseCase: {
        execute: vi.fn(async () => ({
          success: true as const,
          value: buildReadModel(),
        })),
      },
      onOpenCategoryManager: vi.fn() as () => void,
      onUpdate: (value) => {
        latestViewModel = value;
      },
      ...overrides,
    };

    await act(async () => {
      root.render(<BudgetViewModelHarness {...props} />);
      await flushEffects();
    });

    return props;
  };

  it("filters read-model-backed budget items and requires confirmation before delete", async () => {
    const props = await renderHarness();

    expect(latestViewModel?.budgetItems).toHaveLength(3);

    await act(async () => {
      latestViewModel?.onChangeFilter(BudgetListFilter.Overspent);
      await flushEffects();
    });

    expect(latestViewModel?.budgetItems).toHaveLength(1);
    expect(latestViewModel?.budgetItems[0]?.remoteId).toBe("budget-overspent");

    await act(async () => {
      latestViewModel?.onChangeFilter(BudgetListFilter.ThisMonth);
      await flushEffects();
    });

    expect(latestViewModel?.budgetItems).toHaveLength(2);

    await act(async () => {
      await latestViewModel?.onOpenDetail("budget-overspent");
      await flushEffects();
    });

    expect(props.getBudgetPlanByRemoteIdUseCase.execute).toHaveBeenCalledWith({
      accountRemoteId: "personal-1",
      remoteId: "budget-overspent",
    });
    expect(latestViewModel?.isDetailVisible).toBe(true);

    await act(async () => {
      latestViewModel?.onRequestDeleteBudget();
      await flushEffects();
    });

    expect(latestViewModel?.deleteConfirmationVisible).toBe(true);
    expect(props.deleteBudgetPlanUseCase.execute).not.toHaveBeenCalled();

    await act(async () => {
      await latestViewModel?.onConfirmDeleteBudget();
      await flushEffects();
    });

    expect(props.deleteBudgetPlanUseCase.execute).toHaveBeenCalledWith({
      accountRemoteId: "personal-1",
      remoteId: "budget-overspent",
    });
    expect(latestViewModel?.deleteConfirmationVisible).toBe(false);
    expect(latestViewModel?.successMessage).toBe("Budget deleted.");
  });

  it("opens the shared budget editor when editing from detail", async () => {
    const props = await renderHarness();

    await act(async () => {
      await latestViewModel?.onOpenDetail("budget-rent");
      await flushEffects();
    });

    expect(latestViewModel?.isDetailVisible).toBe(true);

    await act(async () => {
      await latestViewModel?.onEditFromDetail();
      await flushEffects();
    });

    expect(props.getBudgetPlanByRemoteIdUseCase.execute).toHaveBeenLastCalledWith({
      accountRemoteId: "personal-1",
      remoteId: "budget-rent",
    });
    expect(latestViewModel?.isDetailVisible).toBe(false);
    expect(latestViewModel?.editorState).toEqual(
      expect.objectContaining({
        visible: true,
        mode: "edit",
        remoteId: "budget-rent",
      }),
    );
  });

  it("surfaces the no-category CTA when expense categories are missing", async () => {
    const onOpenCategoryManager = vi.fn();
    const props = await renderHarness({
      getCategoriesUseCase: {
        execute: vi.fn(async () => ({
          success: true as const,
          value: [],
        })),
      },
      getBudgetProgressReadModelUseCase: {
        execute: vi.fn(async () => ({
          success: true as const,
          value: {
            items: [],
            summary: {
              currentMonthPlannedAmount: 0,
              currentMonthSpentAmount: 0,
              currentMonthRemainingAmount: 0,
              hasOverspentBudget: false,
            },
          },
        })),
      },
      onOpenCategoryManager,
    });

    expect(latestViewModel?.emptyStateActionLabel).toBe("Create New Budget");
    expect(latestViewModel?.canCreate).toBe(true);

    await act(async () => {
      latestViewModel?.onPressEmptyStateAction();
      await flushEffects();
    });

    expect(onOpenCategoryManager).not.toHaveBeenCalled();
    expect(latestViewModel?.editorState.visible).toBe(true);
  });

  it("quick-creates an expense category inside the budget editor", async () => {
    const props = await renderHarness({
      getCategoriesUseCase: {
        execute: vi.fn(async () => ({
          success: true as const,
          value: [],
        })),
      },
      getBudgetProgressReadModelUseCase: {
        execute: vi.fn(async () => ({
          success: true as const,
          value: {
            items: [],
            summary: {
              currentMonthPlannedAmount: 0,
              currentMonthSpentAmount: 0,
              currentMonthRemainingAmount: 0,
              hasOverspentBudget: false,
            },
          },
        })),
      },
    });

    await act(async () => {
      latestViewModel?.onOpenCreate();
      latestViewModel?.onQuickCategoryNameChange("Transport");
      await flushEffects();
    });

    await act(async () => {
      await latestViewModel?.onCreateQuickExpenseCategory();
      await flushEffects();
    });

    expect(props.saveCategoryUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        accountType: AccountType.Personal,
        kind: "expense",
        name: "Transport",
        scope: "personal",
      }),
    );
    expect(latestViewModel?.categoryOptions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          remoteId: "category-quick",
          label: "Quick Category",
        }),
      ]),
    );
    expect(latestViewModel?.editorState.categoryRemoteId).toBe("category-quick");
  });
});
