import { useCallback, useMemo } from "react";
import { MoreDashboardSection } from "../types/moreDashboard.types";
import {
  MoreDashboardViewModel,
  UseMoreDashboardViewModelParams,
} from "./moreDashboard.viewModel";

const businessSections: readonly MoreDashboardSection[] = [
  {
    id: "account",
    title: "Account",
    items: [
      {
        id: "profile",
        title: "Profile",
        subtitle: "Your profile, switch account and logout",
      },
      {
        id: "userManagement",
        title: "User Management",
        subtitle: "Roles, permissions, and team access",
      },
    ],
  },
  {
    id: "quick-tools",
    title: "Quick Tools",
    items: [
      {
        id: "ledger",
        title: "Ledger",
        subtitle: "Payables and receivables overview",
      },
      {
        id: "pos",
        title: "POS",
        subtitle: "Point of sale checkout",
      },
      {
        id: "products",
        title: "Products",
        subtitle: "Catalog for items and services",
      },
      {
        id: "categories",
        title: "Categories",
        subtitle: "Category setup for products and reports",
      },
      {
        id: "inventory",
        title: "Inventory",
        subtitle: "Stock levels and movements",
      },
      {
        id: "emi",
        title: "EMI and Loans",
        subtitle: "Installment and loan tracking",
      },
    ],
  },
];

const personalSections: readonly MoreDashboardSection[] = [
  {
    id: "account",
    title: "Account",
    items: [
      {
        id: "profile",
        title: "Profile",
        subtitle: "Your profile, switch account and logout",
      },
    ],
  },
  {
    id: "personal-tools",
    title: "Personal Tools",
    items: [
      {
        id: "transactions",
        title: "Transactions",
        subtitle: "Income and expense records",
      },
      {
        id: "budget",
        title: "Budget",
        subtitle: "Monthly planning and spending limits",
      },
      {
        id: "emi",
        title: "EMI and Loans",
        subtitle: "Installment and loan tracking",
      },
    ],
  },
];

export const useMoreDashboardViewModel = (
  params: UseMoreDashboardViewModelParams,
): MoreDashboardViewModel => {
  const {
    isBusinessMode,
    onOpenProfile,
    onOpenLedger,
    onOpenPos,
    onOpenProducts,
    onOpenCategories,
    onOpenInventory,
    onOpenEmi,
    onOpenTransactions,
    onOpenBudget,
    onOpenUserManagement,
    hasMenuAccess,
  } = params;

  const onMenuItemPress = useCallback(
    (itemId: string) => {
      switch (itemId) {
        case "profile":
          onOpenProfile();
          return;
        case "ledger":
          onOpenLedger();
          return;
        case "pos":
          onOpenPos();
          return;
        case "products":
          onOpenProducts();
          return;
        case "categories":
          onOpenCategories();
          return;
        case "inventory":
          onOpenInventory();
          return;
        case "emi":
          onOpenEmi();
          return;
        case "transactions":
          onOpenTransactions();
          return;
        case "budget":
          onOpenBudget();
          return;
        case "userManagement":
          onOpenUserManagement();
          return;
        default:
          return;
      }
    },
    [
      onOpenBudget,
      onOpenEmi,
      onOpenLedger,
      onOpenInventory,
      onOpenCategories,
      onOpenPos,
      onOpenProducts,
      onOpenProfile,
      onOpenTransactions,
      onOpenUserManagement,
    ],
  );

  const sections = useMemo(() => {
    const candidateSections = isBusinessMode ? businessSections : personalSections;

    return candidateSections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => hasMenuAccess(item.id)),
      }))
      .filter((section) => section.items.length > 0);
  }, [hasMenuAccess, isBusinessMode]);

  return useMemo<MoreDashboardViewModel>(
    () => ({
      sections,
      onMenuItemPress,
    }),
    [onMenuItemPress, sections],
  );
};
