import { MoreDashboardMenuItemId } from "./moreDashboard.types";

export const MORE_DASHBOARD_MENU_PERMISSION_CODE: Record<
  MoreDashboardMenuItemId,
  string
> = {
  profile: "profile.view",
  ledger: "ledger.view",
  pos: "pos.view",
  products: "products.view",
  categories: "products.view",
  inventory: "inventory.view",
  emi: "emi.view",
  transactions: "transactions.view",
  budget: "budget.view",
  userManagement: "user_management.view",
};
