import { AccountType } from "@/feature/auth/accountSelection/types/accountSelection.types";
import { useDashboardRouteContext } from "@/feature/dashboard/shared/hooks/useDashboardRouteContext";
import { getDashboardHomePath } from "@/feature/dashboard/shared/utils/dashboardNavigation.util";
import { GetProductsScreenFactory } from "@/feature/products/factory/getProductsScreen.factory";
import { useSmoothNavigation } from "@/shared/hooks/useSmoothNavigation";
import React, { useEffect } from "react";

export default function ProductsDashboardRoute() {
  const navigation = useSmoothNavigation();
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

  useEffect(() => {
    if (isLoading || !hasActiveSession || !hasActiveAccount) {
      return;
    }

    if (activeAccountType !== AccountType.Business) {
      navigation.replace(getDashboardHomePath(activeAccountType));
    }
  }, [
    activeAccountType,
    hasActiveAccount,
    hasActiveSession,
    isLoading,
    navigation,
  ]);

  if (isLoading || !hasActiveSession || !hasActiveAccount) {
    return null;
  }

  if (activeAccountType !== AccountType.Business) {
    return null;
  }

  return (
    <GetProductsScreenFactory
      activeAccountRemoteId={activeAccountRemoteId}
      activeUserRemoteId={activeUserRemoteId}
      activeAccountCurrencyCode={activeAccountCurrencyCode}
      activeAccountCountryCode={activeAccountCountryCode}
    />
  );
}
