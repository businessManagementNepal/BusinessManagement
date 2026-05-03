// @vitest-environment jsdom

import type { ReactElement } from "react";
import React, { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BudgetListFilter } from "@/feature/budget/viewModel/budget.viewModel";
import { BudgetScreen } from "@/feature/budget/ui/BudgetScreen";

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const mockAppButton = vi.fn((props: Record<string, unknown>) =>
  React.createElement(React.Fragment) as ReactElement,
);
const mockConfirmDeleteModal = vi.fn((props: Record<string, unknown>) =>
  React.createElement(React.Fragment) as ReactElement,
);

vi.mock("react-native", async () => {
  const ReactModule = await import("react");

  const createHost =
    (tag: "div" | "button" | "span") =>
    ({ children }: Record<string, unknown>) =>
      ReactModule.createElement(
        tag,
        undefined,
        children as React.ReactNode,
      ) as ReactElement;

  return {
    ActivityIndicator: createHost("div"),
    Pressable: createHost("button"),
    RefreshControl: createHost("div"),
    StyleSheet: {
      create: <T,>(styles: T) => styles,
    },
    Text: createHost("span"),
    View: createHost("div"),
  };
});

vi.mock("@/shared/components/theme/AppThemeProvider", () => ({
  useAppTheme: () => ({
    colorMode: "light",
    colors: {
      background: "#FFFFFF",
      foreground: "#172033",
      card: "#FFFFFF",
      cardForeground: "#172033",
      primary: "#1F6340",
      primaryForeground: "#FFFFFF",
      secondary: "#F5F7FB",
      muted: "#EEF2F8",
      mutedForeground: "#667085",
      accent: "#E6F4EA",
      border: "#D7DEEA",
      destructive: "#E44747",
      destructiveForeground: "#FFFFFF",
      success: "#2E8B57",
      warning: "#F59E0B",
      header: "#1F6340",
      overlay: "rgba(0,0,0,0.35)",
    },
    preferences: {
      themePreference: "light",
      textSizePreference: "medium",
      compactModeEnabled: false,
      updatedAt: 0,
    },
    compactModeEnabled: false,
    isDarkMode: false,
    scaleText: (value: number) => value,
    scaleLineHeight: (value: number) => value,
    scaleSpace: (value: number) => value,
  }),
}));

vi.mock("@/shared/components/theme/useThemedStyles", () => ({
  useThemedStyles: (createStyles: (theme: Record<string, unknown>) => unknown) =>
    createStyles({
      colorMode: "light",
      colors: {
        background: "#FFFFFF",
        foreground: "#172033",
        card: "#FFFFFF",
        cardForeground: "#172033",
        primary: "#1F6340",
        primaryForeground: "#FFFFFF",
        secondary: "#F5F7FB",
        muted: "#EEF2F8",
        mutedForeground: "#667085",
        accent: "#E6F4EA",
        border: "#D7DEEA",
        destructive: "#E44747",
        destructiveForeground: "#FFFFFF",
        success: "#2E8B57",
        warning: "#F59E0B",
        header: "#1F6340",
        overlay: "rgba(0,0,0,0.35)",
      },
      preferences: {
        themePreference: "light",
        textSizePreference: "medium",
        compactModeEnabled: false,
        updatedAt: 0,
      },
      compactModeEnabled: false,
      isDarkMode: false,
      scaleText: (value: number) => value,
      scaleLineHeight: (value: number) => value,
      scaleSpace: (value: number) => value,
    }),
}));

vi.mock("@/shared/components/reusable/Feedback/useToastMessage", () => ({
  useToastMessage: () => undefined,
}));

vi.mock("@react-navigation/native", () => ({
  useFocusEffect: () => undefined,
}));

vi.mock("@/shared/components/reusable/Buttons/AppButton", () => ({
  AppButton: (props: Record<string, unknown>) => mockAppButton(props),
}));

vi.mock("@/shared/components/reusable/Form/FilterChipGroup", () => ({
  FilterChipGroup: () => null,
}));

vi.mock("@/shared/components/reusable/Form/SearchInputRow", () => ({
  SearchInputRow: () => null,
}));

vi.mock("@/shared/components/reusable/ScreenLayouts/BottomTabAwareFooter", async () => {
  const ReactModule = await import("react");
  return {
    BottomTabAwareFooter: ({ children }: Record<string, unknown>) =>
      ReactModule.createElement(
        ReactModule.Fragment,
        undefined,
        children as React.ReactNode,
      ) as ReactElement,
  };
});

vi.mock("@/shared/components/reusable/ScreenLayouts/InlineSectionHeader", () => ({
  InlineSectionHeader: () => null,
}));

vi.mock("@/shared/components/reusable/Modals/ConfirmDeleteModal", () => ({
  ConfirmDeleteModal: (props: Record<string, unknown>) =>
    mockConfirmDeleteModal(props),
}));

vi.mock("@/shared/components/reusable/ScreenLayouts/ScreenContainer", async () => {
  const ReactModule = await import("react");
  return {
    ScreenContainer: ({ children, footer }: Record<string, unknown>) =>
      ReactModule.createElement(
        ReactModule.Fragment,
        undefined,
        children as React.ReactNode,
        footer as React.ReactNode,
      ) as ReactElement,
  };
});

vi.mock("@/feature/budget/ui/components/BudgetEditorModal", () => ({
  BudgetEditorModal: () => null,
}));

vi.mock("@/feature/budget/ui/components/BudgetDetailModal", () => ({
  BudgetDetailModal: () => null,
}));

vi.mock("lucide-react-native", async () => {
  const ReactModule = await import("react");
  const createIcon =
    (tag: string) =>
    () =>
      ReactModule.createElement(tag) as ReactElement;

  return {
    CalendarClock: createIcon("span"),
    CircleAlert: createIcon("span"),
    PiggyBank: createIcon("span"),
    Plus: createIcon("span"),
  };
});

const flushEffects = async (): Promise<void> => {
  await Promise.resolve();
};

const buildViewModel = () => ({
  isLoading: false,
  errorMessage: null,
  successMessage: null,
  monthLabel: "May 2026",
  summaryCards: [
    { id: "planned", label: "This Month Planned", value: "NPR 0", tone: "neutral" },
    { id: "spent", label: "Spent This Month", value: "NPR 0", tone: "neutral" },
    { id: "remaining", label: "Left This Month", value: "NPR 0", tone: "success" },
  ],
  budgetItems: [],
  selectedFilter: BudgetListFilter.All,
  searchQuery: "",
  emptyStateMessage: "Create at least one expense category before adding budgets.",
  emptyStateActionLabel: "Create Expense Category",
  categoryOptions: [],
  editorState: {
    visible: false,
    mode: "create" as const,
    remoteId: null,
    budgetMonth: "2026-05",
    categoryRemoteId: "",
    plannedAmount: "0",
    note: "",
    errorMessage: null,
    isSaving: false,
  },
  quickCategoryState: {
    name: "",
    errorMessage: null,
    isSaving: false,
  },
  detailState: {
    remoteId: "budget-food",
    title: "Food",
    subtitle: "May 2026",
    plannedAmountLabel: "NPR 100",
    spentAmountLabel: "NPR 0",
    remainingAmountLabel: "NPR 100",
    statusLabel: "On track",
    noteLabel: null,
  },
  isDetailVisible: true,
  deleteConfirmationVisible: true,
  deleteErrorMessage: "Unable to delete budget.",
  isDeleting: false,
  canCreate: false,
  onRefresh: vi.fn(async () => undefined),
  onChangeFilter: vi.fn(),
  onChangeSearchQuery: vi.fn(),
  onPressEmptyStateAction: vi.fn(),
  onOpenCreate: vi.fn(),
  onOpenDetail: vi.fn(async () => undefined),
  onOpenEdit: vi.fn(async () => undefined),
  onCloseEditor: vi.fn(),
  onEditorFieldChange: vi.fn(),
  onQuickCategoryNameChange: vi.fn(),
  onCreateQuickExpenseCategory: vi.fn(async () => undefined),
  onSubmit: vi.fn(async () => undefined),
  onCloseDetail: vi.fn(),
  onRequestDeleteBudget: vi.fn(),
  onCancelDeleteBudget: vi.fn(),
  onConfirmDeleteBudget: vi.fn(async () => undefined),
  onEditFromDetail: vi.fn(async () => undefined),
});

describe("BudgetScreen", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    mockAppButton.mockClear();
    mockConfirmDeleteModal.mockClear();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  const renderScreen = async (
    viewModelOverrides: Partial<ReturnType<typeof buildViewModel>> = {},
  ) => {
    const viewModel = {
      ...buildViewModel(),
      ...viewModelOverrides,
    };

    await act(async () => {
      root.render(<BudgetScreen viewModel={viewModel as never} />);
      await flushEffects();
    });

    return viewModel;
  };

  it("renders the no-category CTA and forwards the press handler", async () => {
    const viewModel = await renderScreen();

    const ctaButtonProps = mockAppButton.mock.calls
      .map(([props]) => props as { label?: string; onPress?: () => void })
      .find((props) => props.label === "Create Expense Category");

    expect(ctaButtonProps).toBeDefined();

    await act(async () => {
      ctaButtonProps?.onPress?.();
      await flushEffects();
    });

    expect(viewModel.onPressEmptyStateAction).toHaveBeenCalledTimes(1);
  });

  it("passes delete confirmation state into ConfirmDeleteModal", async () => {
    await renderScreen();

    expect(mockConfirmDeleteModal).toHaveBeenCalledTimes(1);
    const confirmModalProps = mockConfirmDeleteModal.mock.calls[0]?.[0] as {
      visible: boolean;
      title: string;
      errorMessage: string | null;
      message: string;
    };

    expect(confirmModalProps.visible).toBe(true);
    expect(confirmModalProps.title).toBe("Delete Budget");
    expect(confirmModalProps.errorMessage).toBe("Unable to delete budget.");
    expect(confirmModalProps.message).toContain("Food");
    expect(confirmModalProps.message).toContain("May 2026");
  });
});
