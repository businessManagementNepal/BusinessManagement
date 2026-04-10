export type MoreDashboardMenuItemId =
  | "profile"
  | "ledger"
  | "pos"
  | "orders"
  | "reports"
  | "products"
  | "categories"
  | "inventory"
  | "moneyAccounts"
  | "contacts"
  | "billing"
  | "taxCalculator"
  | "notes"
  | "emi"
  | "transactions"
  | "budget"
  | "userManagement"
  | "settings"
  | "notifications"
  | "logout";

export type MoreDashboardMenuItem = {
  id: MoreDashboardMenuItemId;
  title: string;
  subtitle: string;
};

export type MoreDashboardSection = {
  id: string;
  title: string;
  items: readonly MoreDashboardMenuItem[];
};

export type MoreDashboardMenuAccessPredicate = (
  itemId: MoreDashboardMenuItemId,
) => boolean;
