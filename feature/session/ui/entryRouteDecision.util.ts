import { AccountTypeValue } from "@/feature/setting/accounts/accountSelection/types/accountSelection.types";
import { DashboardHomePath, getDashboardHomePath } from "@/feature/dashboard/shared/utils/dashboardNavigation.util";

export type EntryRouteDecision =
  | null
  | "/(auth)/login"
  | "/(account-setup)/select-account"
  | DashboardHomePath;

type ResolveEntryRouteParams = {
  isLoading: boolean;
  hasActiveSession: boolean;
  hasActiveAccount: boolean;
  activeAccountType: AccountTypeValue | null;
};

export const resolveEntryRoute = (
  params: ResolveEntryRouteParams,
): EntryRouteDecision => {
  const {
    isLoading,
    hasActiveSession,
    hasActiveAccount,
    activeAccountType,
  } = params;

  if (isLoading) {
    return null;
  }

  if (!hasActiveSession) {
    return "/(auth)/login";
  }

  if (!hasActiveAccount) {
    return "/(account-setup)/select-account";
  }

  return getDashboardHomePath(activeAccountType);
};
