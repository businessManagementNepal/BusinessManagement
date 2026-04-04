import { AccountType } from "@/feature/auth/accountSelection/types/accountSelection.types";
import { GetBillingScreenFactory } from "@/feature/billing/factory/getBillingScreen.factory";
import { useDashboardRouteContext } from "@/feature/dashboard/shared/hooks/useDashboardRouteContext";
import { getDashboardHomePath } from "@/feature/dashboard/shared/utils/dashboardNavigation.util";
import { useAccountPermissionAccess } from "@/feature/userManagement/factory/useAccountPermissionAccess.factory";
import appDatabase from "@/shared/database/appDatabase";
import { useSmoothNavigation } from "@/shared/hooks/useSmoothNavigation";
import React, { useEffect } from "react";

const BILLING_VIEW_PERMISSION_CODE = "billing.view";
const BILLING_MANAGE_PERMISSION_CODE = "billing.manage";

export default function BillingDashboardRoute() {
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

  const canViewBilling = permissionAccess.hasPermission(BILLING_VIEW_PERMISSION_CODE);
  const canManageBilling = permissionAccess.hasPermission(
    BILLING_MANAGE_PERMISSION_CODE,
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

    if (!canViewBilling) {
      navigation.replace(getDashboardHomePath(activeAccountType));
    }
  }, [
    activeAccountType,
    canViewBilling,
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

  if (activeAccountType !== AccountType.Business || !canViewBilling) {
    return null;
  }

  return (
    <GetBillingScreenFactory
      database={appDatabase}
      activeAccountRemoteId={activeAccountRemoteId}
      activeAccountCurrencyCode={activeAccountCurrencyCode}
      activeAccountCountryCode={activeAccountCountryCode}
      canManage={canManageBilling}
    />
  );
}
