import { AccountType } from "@/feature/auth/accountSelection/types/accountSelection.types";
import { GetMoneyAccountsScreenFactory } from "@/feature/accounts/factory/getMoneyAccountsScreen.factory";
import { useDashboardRouteContext } from "@/feature/dashboard/shared/hooks/useDashboardRouteContext";
import { getDashboardHomePath } from "@/feature/dashboard/shared/utils/dashboardNavigation.util";
import { useAccountPermissionAccess } from "@/feature/userManagement/factory/useAccountPermissionAccess.factory";
import { useSmoothNavigation } from "@/shared/hooks/useSmoothNavigation";
import React, { useEffect } from "react";

const MONEY_ACCOUNTS_VIEW_PERMISSION_CODE = "money_accounts.view";
const MONEY_ACCOUNTS_MANAGE_PERMISSION_CODE = "money_accounts.manage";

export default function MoneyAccountsDashboardRoute() {
  const navigation = useSmoothNavigation();
  const {
    isLoading,
    hasActiveSession,
    hasActiveAccount,
    activeUserRemoteId,
    activeAccountRemoteId,
    activeAccountType,
    activeAccountCurrencyCode,
    activeAccountCountryCode,
  } = useDashboardRouteContext();

  const permissionAccess = useAccountPermissionAccess({
    activeUserRemoteId,
    activeAccountRemoteId,
  });

  const canViewMoneyAccounts = permissionAccess.hasPermission(
    MONEY_ACCOUNTS_VIEW_PERMISSION_CODE,
  );
  const shouldEnforceBusinessPermission =
    activeAccountType === AccountType.Business;
  const hasMoneyAccountsAccess = shouldEnforceBusinessPermission
    ? canViewMoneyAccounts
    : true;
  const canManageMoneyAccounts = shouldEnforceBusinessPermission
    ? permissionAccess.hasPermission(MONEY_ACCOUNTS_MANAGE_PERMISSION_CODE)
    : true;

  useEffect(() => {
    if (isLoading || !hasActiveSession || !hasActiveAccount) {
      return;
    }

    if (!shouldEnforceBusinessPermission || permissionAccess.isLoading) {
      return;
    }

    if (!hasMoneyAccountsAccess) {
      navigation.replace(getDashboardHomePath(activeAccountType));
    }
  }, [
    activeAccountType,
    hasMoneyAccountsAccess,
    hasActiveAccount,
    hasActiveSession,
    isLoading,
    navigation,
    permissionAccess.isLoading,
    shouldEnforceBusinessPermission,
  ]);

  if (
    isLoading ||
    !hasActiveSession ||
    !hasActiveAccount ||
    (shouldEnforceBusinessPermission && permissionAccess.isLoading)
  ) {
    return null;
  }

  if (!hasMoneyAccountsAccess) {
    return null;
  }

  return (
    <GetMoneyAccountsScreenFactory
      activeUserRemoteId={activeUserRemoteId}
      activeAccountRemoteId={activeAccountRemoteId}
      activeAccountCurrencyCode={activeAccountCurrencyCode}
      activeAccountCountryCode={activeAccountCountryCode}
      canManage={canManageMoneyAccounts}
    />
  );
}
