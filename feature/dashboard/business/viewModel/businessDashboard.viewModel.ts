import {
  BusinessDashboardDueItem,
  BusinessDashboardQuickAction,
  BusinessDashboardSummaryCard,
} from "../types/businessDashboard.types";

export interface BusinessDashboardViewModel {
  isLoading: boolean;
  errorMessage: string | null;
  summaryCards: readonly BusinessDashboardSummaryCard[];
  quickActions: readonly BusinessDashboardQuickAction[];
  todayInValue: string;
  todayOutValue: string;
  overdueCountLabel: string;
  dueItems: readonly BusinessDashboardDueItem[];
}
