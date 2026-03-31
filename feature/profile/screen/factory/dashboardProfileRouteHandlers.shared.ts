import { AccountTypeValue } from "@/feature/setting/accounts/accountSelection/types/accountSelection.types";
import {
  DashboardHomePath,
  getDashboardHomePath,
} from "@/feature/dashboard/shared/utils/dashboardNavigation.util";

type DashboardProfileReplacePath = DashboardHomePath | "/(dashboard)/profile";
type DashboardProfilePushPath = "/(dashboard)/business-details";

export type DashboardProfileRouteHandlers = {
  activeUserRemoteId: string | null;
  activeAccountRemoteId: string | null;
  onNavigateHome: (accountType: AccountTypeValue) => void;
  onLogout: () => Promise<void>;
  onBackToHome: () => void;
  onBackToProfile: () => void;
  onOpenBusinessDetails: () => void;
};

type DashboardProfileRouteHandlerParams = {
  activeUserRemoteId: string | null;
  activeAccountRemoteId: string | null;
  activeAccountType: AccountTypeValue | null;
  navigateReplace: (targetPath: DashboardProfileReplacePath) => void;
  navigatePush: (targetPath: DashboardProfilePushPath) => void;
  clearUserSession: () => Promise<void>;
  refreshSession: () => Promise<void>;
  onLogoutError?: (error: unknown) => void;
};

export const createDashboardProfileRouteHandlers = (
  params: DashboardProfileRouteHandlerParams,
): DashboardProfileRouteHandlers => {
  const {
    activeUserRemoteId,
    activeAccountRemoteId,
    activeAccountType,
    navigateReplace,
    navigatePush,
    clearUserSession,
    refreshSession,
    onLogoutError,
  } = params;

  return {
    activeUserRemoteId,
    activeAccountRemoteId,
    onNavigateHome: (accountType: AccountTypeValue) => {
      navigateReplace(getDashboardHomePath(accountType));
    },
    onLogout: async () => {
      try {
        await clearUserSession();
        await refreshSession();
      } catch (error) {
        if (onLogoutError) {
          onLogoutError(error);
        }
      }
    },
    onBackToHome: () => {
      navigateReplace(getDashboardHomePath(activeAccountType));
    },
    onBackToProfile: () => {
      navigateReplace("/(dashboard)/profile");
    },
    onOpenBusinessDetails: () => {
      navigatePush("/(dashboard)/business-details");
    },
  };
};
