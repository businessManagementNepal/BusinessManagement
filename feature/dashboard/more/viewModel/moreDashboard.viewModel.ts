import {
  MoreDashboardMenuItemId,
  MoreDashboardMenuAccessPredicate,
  MoreDashboardSection,
} from "../types/moreDashboard.types";

export interface MoreDashboardViewModel {
  sections: readonly MoreDashboardSection[];
  onMenuItemPress: (itemId: MoreDashboardMenuItemId) => void;
}

export type UseMoreDashboardViewModelParams = {
  isBusinessMode: boolean;
  onOpenProfile: () => void;
  onOpenLedger: () => void;
  onOpenPos: () => void;
  onOpenOrders: () => void;
  onOpenReports: () => void;
  onOpenProducts: () => void;
  onOpenCategories: () => void;
  onOpenInventory: () => void;
  onOpenMoneyAccounts: () => void;
  onOpenContacts: () => void;
  onOpenBilling: () => void;
  onOpenTaxCalculator: () => void;
  onOpenNotes: () => void;
  onOpenEmi: () => void;
  onOpenTransactions: () => void;
  onOpenBudget: () => void;
  onOpenUserManagement: () => void;
  onOpenSettings: () => void;
  onOpenNotifications: () => void;
  onLogout: () => Promise<void>;
  hasMenuAccess: MoreDashboardMenuAccessPredicate;
};
