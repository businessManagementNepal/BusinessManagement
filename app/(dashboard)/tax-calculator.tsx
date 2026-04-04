import { AccountType } from "@/feature/auth/accountSelection/types/accountSelection.types";
import { GetTaxCalculatorSettingsScreenFactory } from "@/feature/appSettings/taxCalculator/factory/getTaxCalculatorSettingsScreen.factory";
import { useDashboardRouteContext } from "@/feature/dashboard/shared/hooks/useDashboardRouteContext";
import { getDashboardHomePath } from "@/feature/dashboard/shared/utils/dashboardNavigation.util";
import { useAccountPermissionAccess } from "@/feature/userManagement/factory/useAccountPermissionAccess.factory";
import { useSmoothNavigation } from "@/shared/hooks/useSmoothNavigation";
import React, { useEffect } from "react";

const TAX_CALCULATOR_VIEW_PERMISSION_CODE = "tax_calculator.view";

export default function TaxCalculatorDashboardRoute() {
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

  const canViewTaxCalculator = permissionAccess.hasPermission(
    TAX_CALCULATOR_VIEW_PERMISSION_CODE,
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

    if (!canViewTaxCalculator) {
      navigation.replace(getDashboardHomePath(activeAccountType));
    }
  }, [
    activeAccountType,
    canViewTaxCalculator,
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

  if (activeAccountType !== AccountType.Business || !canViewTaxCalculator) {
    return null;
  }

  return (
    <GetTaxCalculatorSettingsScreenFactory
      activeAccountCurrencyCode={activeAccountCurrencyCode}
      activeAccountCountryCode={activeAccountCountryCode}
    />
  );
}
