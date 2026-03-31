import {
  DashboardTabItems,
  DashboardTabValue,
} from "@/feature/dashboard/shared/types/dashboardNavigation.types";

export type DashboardRouteKey =
  | "business"
  | "business-details"
  | "personal"
  | "ledger"
  | "pos"
  | "emi-loans"
  | "more"
  | "personal-transactions"
  | "personal-budget"
  | "profile"
  | null;

export type DashboardHeaderConfig = {
  title: string;
  subtitle?: string;
  showBell: boolean;
  showProfile: boolean;
};

export interface DashboardShellViewModel {
  isLoading: boolean;
  showSlotOnly: boolean;
  showScaffold: boolean;
  headerConfig: DashboardHeaderConfig;
  tabItems: DashboardTabItems;
  activeTab: DashboardTabValue;
  profileInitials: string;
  onProfilePress: () => void;
  onTabPress: (tab: DashboardTabValue) => void;
}
