import {
  DashboardTab,
  DashboardTabValue,
} from "@/feature/dashboard/shared/types/dashboardNavigation.types";
import {
  AccountType,
  AccountTypeValue,
} from "@/feature/setting/accounts/accountSelection/types/accountSelection.types";
import {
  DashboardHeaderConfig,
  DashboardRouteKey,
} from "@/feature/dashboard/shell/types/dashboardShell.types";

const BUSINESS_ONLY_ROUTES = new Set<DashboardRouteKey>(["business", "ledger", "pos"]);
const PERSONAL_ONLY_ROUTES = new Set<DashboardRouteKey>([
  "personal",
  "personal-transactions",
  "personal-budget",
]);
const SLOT_ONLY_ROUTES = new Set<DashboardRouteKey>([
  "profile",
  "business-details",
]);

export const resolveDashboardRouteKey = (
  segments: string[],
): DashboardRouteKey => {
  const routeKey = segments[1];

  switch (routeKey) {
    case "business":
    case "business-details":
    case "personal":
    case "ledger":
    case "pos":
    case "emi-loans":
    case "more":
    case "personal-transactions":
    case "personal-budget":
    case "profile":
      return routeKey;
    default:
      return null;
  }
};

export const resolveDashboardHeaderConfig = (
  routeKey: DashboardRouteKey,
): DashboardHeaderConfig => {
  switch (routeKey) {
    case "business":
      return {
        title: "My Business",
        subtitle: "Good Evening",
        showBell: true,
        showProfile: true,
      };
    case "personal":
      return {
        title: "Personal Dashboard",
        subtitle: "Good Evening",
        showBell: true,
        showProfile: true,
      };
    case "ledger":
      return { title: "Ledger", subtitle: undefined, showBell: false, showProfile: false };
    case "pos":
      return { title: "POS", subtitle: undefined, showBell: false, showProfile: false };
    case "emi-loans":
      return {
        title: "EMI and Loans",
        subtitle: undefined,
        showBell: false,
        showProfile: false,
      };
    case "more":
      return { title: "More", subtitle: undefined, showBell: false, showProfile: false };
    case "personal-transactions":
      return {
        title: "Transactions",
        subtitle: undefined,
        showBell: false,
        showProfile: false,
      };
    case "personal-budget":
      return { title: "Budget", subtitle: undefined, showBell: false, showProfile: false };
    default:
      return {
        title: "Dashboard",
        subtitle: undefined,
        showBell: false,
        showProfile: false,
      };
  }
};

export const resolveDashboardActiveTab = (
  routeKey: DashboardRouteKey,
): DashboardTabValue => {
  switch (routeKey) {
    case "business":
    case "personal":
      return DashboardTab.Home;
    case "ledger":
      return DashboardTab.Ledger;
    case "pos":
      return DashboardTab.Pos;
    case "emi-loans":
      return DashboardTab.Emi;
    case "more":
      return DashboardTab.More;
    case "personal-transactions":
      return DashboardTab.Transactions;
    case "personal-budget":
      return DashboardTab.Budget;
    default:
      return DashboardTab.Home;
  }
};

export const isBusinessOnlyDashboardRoute = (
  routeKey: DashboardRouteKey,
): boolean => {
  return BUSINESS_ONLY_ROUTES.has(routeKey);
};

export const isPersonalOnlyDashboardRoute = (
  routeKey: DashboardRouteKey,
): boolean => {
  return PERSONAL_ONLY_ROUTES.has(routeKey);
};

export const isSlotOnlyDashboardRoute = (
  routeKey: DashboardRouteKey,
): boolean => {
  return SLOT_ONLY_ROUTES.has(routeKey);
};

export const isDashboardRouteAllowed = (
  routeKey: DashboardRouteKey,
  accountType: AccountTypeValue | null,
): boolean => {
  if (!routeKey) {
    return false;
  }

  if (isBusinessOnlyDashboardRoute(routeKey)) {
    return accountType === AccountType.Business;
  }

  if (isPersonalOnlyDashboardRoute(routeKey)) {
    return accountType === AccountType.Personal;
  }

  return true;
};
