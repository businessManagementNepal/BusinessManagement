import React from "react";
import { GetBusinessDashboardScreenFactory } from "@/feature/dashboard/business/factory/getBusinessDashboardScreen.factory";
import { useDashboardRouteContext } from "@/feature/dashboard/shared/hooks/useDashboardRouteContext";

export default function BusinessDashboardRoute() {
  const {
    isLoading,
    hasActiveSession,
    hasActiveAccount,
    activeUserRemoteId,
    activeAccountRemoteId,
    activeAccountCurrencyCode,
    activeAccountCountryCode,
  } = useDashboardRouteContext();

  if (isLoading || !hasActiveSession || !hasActiveAccount) {
    return null;
  }

  return (
    <GetBusinessDashboardScreenFactory
      activeUserRemoteId={activeUserRemoteId}
      activeAccountRemoteId={activeAccountRemoteId}
      activeAccountCurrencyCode={activeAccountCurrencyCode}
      activeAccountCountryCode={activeAccountCountryCode}
    />
  );
}
