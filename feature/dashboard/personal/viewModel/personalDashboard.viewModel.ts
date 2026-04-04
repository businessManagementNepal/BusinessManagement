import {
  PersonalDashboardQuickAction,
  PersonalDashboardRecentItem,
  PersonalDashboardSummaryCard,
} from "../types/personalDashboard.types";

export interface PersonalDashboardViewModel {
  isLoading: boolean;
  errorMessage: string | null;
  summaryCards: readonly PersonalDashboardSummaryCard[];
  quickActions: readonly PersonalDashboardQuickAction[];
  todayInValue: string;
  todayOutValue: string;
  netValue: string;
  recentItems: readonly PersonalDashboardRecentItem[];
}
