import { MoreDashboardMenuItemId } from "./moreDashboard.types";

export const MORE_DASHBOARD_MENU_PERMISSION_CODE: Record<
  MoreDashboardMenuItemId,
  string
> = {
  profile: "profile.view",
  ledger: "ledger.view",
  pos: "pos.view",
  orders: "orders.view",
  reports: "reports.view",
  products: "products.view",
  categories: "products.view",
  inventory: "inventory.view",
  moneyAccounts: "money_accounts.view",
  contacts: "contacts.view",
  billing: "billing.view",
  taxCalculator: "tax_calculator.view",
  notes: "notes.view",
  emi: "emi.view",
  transactions: "transactions.view",
  budget: "budget.view",
  userManagement: "user_management.view",
  settings: "profile.view",
  notifications: "profile.view",
  logout: "profile.view",
};
