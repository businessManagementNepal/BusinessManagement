import {
  MoreDashboardMenuAccessPredicate,
  MoreDashboardSection,
} from "../types/moreDashboard.types";

export interface MoreDashboardViewModel {
  sections: readonly MoreDashboardSection[];
  onMenuItemPress: (itemId: string) => void;
}

export type UseMoreDashboardViewModelParams = {
  isBusinessMode: boolean;
  onOpenProfile: () => void;
  onOpenLedger: () => void;
  onOpenPos: () => void;
  onOpenProducts: () => void;
  onOpenCategories: () => void;
  onOpenInventory: () => void;
  onOpenEmi: () => void;
  onOpenTransactions: () => void;
  onOpenBudget: () => void;
  onOpenUserManagement: () => void;
  hasMenuAccess: MoreDashboardMenuAccessPredicate;
};
