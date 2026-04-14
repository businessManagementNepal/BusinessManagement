import { AccountType } from "@/feature/auth/accountSelection/types/accountSelection.types";
import { useDashboardRouteContext } from "@/feature/dashboard/shared/hooks/useDashboardRouteContext";
import { getDashboardHomePath } from "@/feature/dashboard/shared/utils/dashboardNavigation.util";
import { GetTransactionsScreenFactory } from "@/feature/transactions/factory/getTransactionsScreen.factory";
import { useAccountPermissionAccess } from "@/feature/userManagement/factory/useAccountPermissionAccess.factory";
import { useSmoothNavigation } from "@/shared/hooks/useSmoothNavigation";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect } from "react";

const TRANSACTIONS_VIEW_PERMISSION_CODE = "transactions.view";
const TRANSACTIONS_MANAGE_PERMISSION_CODE = "transactions.manage";

export default function BusinessTransactionsDashboardRoute() {
  const navigation = useSmoothNavigation();
  useLocalSearchParams<{
    moneyAccountFilter?: string | string[];
    moneyAccountLabel?: string | string[];
  }>();
  const {
    isLoading,
    hasActiveSession,
    hasActiveAccount,
    activeAccountType,
    activeUserRemoteId,
    activeAccountRemoteId,
    activeAccountCurrencyCode,
    activeAccountCountryCode,
  } = useDashboardRouteContext();

  const permissionAccess = useAccountPermissionAccess({
    activeUserRemoteId,
    activeAccountRemoteId,
  });

  const canViewTransactions = permissionAccess.hasPermission(
    TRANSACTIONS_VIEW_PERMISSION_CODE,
  );
  const canManageTransactions = permissionAccess.hasPermission(
    TRANSACTIONS_MANAGE_PERMISSION_CODE,
  );

  useEffect(() => {
    if (isLoading || !hasActiveSession || !hasActiveAccount) {
      return;
    }

    if (activeAccountType !== AccountType.Business) {
      navigation.replace(getDashboardHomePath(activeAccountType));
      return;
    }

    if (permissionAccess.isLoading) {
      return;
    }

    if (!canViewTransactions) {
      navigation.replace(getDashboardHomePath(activeAccountType));
    }
  }, [
    activeAccountType,
    canViewTransactions,
    hasActiveAccount,
    hasActiveSession,
    isLoading,
    navigation,
    permissionAccess.isLoading,
  ]);

  if (
    isLoading ||
    !hasActiveSession ||
    !hasActiveAccount ||
    permissionAccess.isLoading
  ) {
    return null;
  }

  if (activeAccountType !== AccountType.Business || !canViewTransactions) {
    return null;
  }

  return (
    <GetTransactionsScreenFactory
      activeUserRemoteId={activeUserRemoteId}
      activeAccountRemoteId={activeAccountRemoteId}
      activeAccountCurrencyCode={activeAccountCurrencyCode}
      activeAccountCountryCode={activeAccountCountryCode}
      accountTypeScope={AccountType.Business}
      canManage={canManageTransactions}
    />
  );
}
