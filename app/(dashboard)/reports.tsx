import { AccountType } from "@/feature/auth/accountSelection/types/accountSelection.types";
import { GetReportsScreenFactory } from "@/feature/reports/factory/getReportsScreen.factory";
import { useDashboardRouteContext } from "@/feature/dashboard/shared/hooks/useDashboardRouteContext";
import { getDashboardHomePath } from "@/feature/dashboard/shared/utils/dashboardNavigation.util";
import { useAccountPermissionAccess } from "@/feature/userManagement/factory/useAccountPermissionAccess.factory";
import appDatabase from "@/shared/database/appDatabase";
import { useSmoothNavigation } from "@/shared/hooks/useSmoothNavigation";
import React, { useEffect } from "react";

const REPORTS_VIEW_PERMISSION_CODE = "reports.view";

export default function ReportsDashboardRoute() {
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

  const canViewReports = permissionAccess.hasPermission(REPORTS_VIEW_PERMISSION_CODE);
  const isBusinessAccount = activeAccountType === AccountType.Business;

  useEffect(() => {
    if (isLoading || !hasActiveSession || !hasActiveAccount) {
      return;
    }

    if (isBusinessAccount && permissionAccess.isLoading) {
      return;
    }

    if (isBusinessAccount && !canViewReports) {
      navigation.replace(getDashboardHomePath(activeAccountType));
    }
  }, [
    activeAccountType,
    canViewReports,
    hasActiveAccount,
    hasActiveSession,
    isBusinessAccount,
    isLoading,
    navigation,
    permissionAccess.isLoading,
  ]);

  if (
    isLoading ||
    !hasActiveSession ||
    !hasActiveAccount ||
    (isBusinessAccount && permissionAccess.isLoading)
  ) {
    return null;
  }

  if (isBusinessAccount && !canViewReports) {
    return null;
  }

  return (
    <GetReportsScreenFactory
      database={appDatabase}
      accountType={activeAccountType ?? AccountType.Personal}
      ownerUserRemoteId={activeUserRemoteId}
      accountRemoteId={activeAccountRemoteId}
      activeAccountCurrencyCode={activeAccountCurrencyCode}
      activeAccountCountryCode={activeAccountCountryCode}
    />
  );
}
