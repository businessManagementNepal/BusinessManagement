import { useCallback, useMemo } from "react";
import {
  MoreDashboardMenuItemId,
  MoreDashboardSection,
} from "../types/moreDashboard.types";
import {
  MoreDashboardViewModel,
  UseMoreDashboardViewModelParams,
} from "./moreDashboard.viewModel";

const businessSections: readonly MoreDashboardSection[] = [
  {
    id: "sales",
    title: "Sales",
    items: [
      {
        id: "pos",
        title: "POS",
        subtitle: "Point of sale checkout",
      },
      {
        id: "orders",
        title: "Orders",
        subtitle: "Order lifecycle and fulfillment",
      },
      {
        id: "reports",
        title: "Reports",
        subtitle: "Business performance and analytics",
      },
      {
        id: "billing",
        title: "Billing & Invoices",
        subtitle: "Invoices, receipts, and bill photos",
      },
      {
        id: "contacts",
        title: "Contacts",
        subtitle: "Customers, suppliers, and parties",
      },
    ],
  },
  {
    id: "catalog-stock",
    title: "Catalog & Stock",
    items: [
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
    ],
  },
  {
    id: "finance",
    title: "Finance",
    items: [
      {
        id: "ledger",
        title: "Ledger",
        subtitle: "Payables and receivables overview",
      },
      {
        id: "transactions",
        title: "Transactions",
        subtitle: "All money movement across this business",
      },
      {
        id: "moneyAccounts",
        title: "Money Accounts",
        subtitle: "Cash, bank, and wallet balances",
      },
      {
        id: "taxCalculator",
        title: "Tax Calculator",
        subtitle: "Quick GST/VAT calculations",
      },
      {
        id: "notes",
        title: "Notes",
        subtitle: "Quick workspace notes",
      },
      {
        id: "emi",
        title: "EMI and Loans",
        subtitle: "Installment and loan tracking",
      },
    ],
  },
  {
    id: "team",
    title: "Team",
    items: [
      {
        id: "userManagement",
        title: "User Management",
        subtitle: "Roles, permissions, and team access",
      },
    ],
  },
  {
    id: "account",
    title: "Account",
    items: [
      {
        id: "profile",
        title: "Profile",
        subtitle: "Your profile and account details",
      },
      {
        id: "settings",
        title: "Settings",
        subtitle: "Currency, tax, and app preferences",
      },
      {
        id: "notifications",
        title: "Notifications",
        subtitle: "Reminder alerts and updates",
      },
      {
        id: "logout",
        title: "Logout",
        subtitle: "Sign out from this device",
      },
    ],
  },
];

const personalSections: readonly MoreDashboardSection[] = [
  {
    id: "money",
    title: "Money",
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
  {
    id: "records",
    title: "Records",
    items: [
      {
        id: "moneyAccounts",
        title: "Money Accounts",
        subtitle: "Cash, bank, and wallet balances",
      },
      {
        id: "contacts",
        title: "Contacts",
        subtitle: "Personal parties and relationships",
      },
    ],
  },
  {
    id: "organize",
    title: "Organize",
    items: [
      {
        id: "categories",
        title: "Categories",
        subtitle: "Personal income and expense categories",
      },
      {
        id: "notes",
        title: "Notes",
        subtitle: "Quick personal notes",
      },
    ],
  },
  {
    id: "account",
    title: "Account",
    items: [
      {
        id: "profile",
        title: "Profile",
        subtitle: "Your profile and account details",
      },
      {
        id: "settings",
        title: "Settings",
        subtitle: "Currency, tax, and app preferences",
      },
      {
        id: "notifications",
        title: "Notifications",
        subtitle: "Reminder alerts and updates",
      },
      {
        id: "logout",
        title: "Logout",
        subtitle: "Sign out from this device",
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
    onOpenOrders,
    onOpenReports,
    onOpenProducts,
    onOpenCategories,
    onOpenInventory,
    onOpenMoneyAccounts,
    onOpenContacts,
    onOpenBilling,
    onOpenTaxCalculator,
    onOpenNotes,
    onOpenEmi,
    onOpenTransactions,
    onOpenBudget,
    onOpenUserManagement,
    onOpenSettings,
    onOpenNotifications,
    onLogout,
    hasMenuAccess,
  } = params;

  const onMenuItemPress = useCallback(
    (itemId: MoreDashboardMenuItemId) => {
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
        case "orders":
          onOpenOrders();
          return;
        case "reports":
          onOpenReports();
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
        case "moneyAccounts":
          onOpenMoneyAccounts();
          return;
        case "contacts":
          onOpenContacts();
          return;
        case "billing":
          onOpenBilling();
          return;
        case "taxCalculator":
          onOpenTaxCalculator();
          return;
        case "notes":
          onOpenNotes();
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
        case "settings":
          onOpenSettings();
          return;
        case "notifications":
          onOpenNotifications();
          return;
        case "logout":
          void onLogout();
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
      onOpenOrders,
      onOpenReports,
      onOpenCategories,
      onOpenMoneyAccounts,
      onOpenContacts,
      onOpenBilling,
      onOpenTaxCalculator,
      onOpenNotes,
      onOpenPos,
      onOpenProducts,
      onOpenProfile,
      onOpenTransactions,
      onOpenUserManagement,
      onOpenSettings,
      onOpenNotifications,
      onLogout,
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
