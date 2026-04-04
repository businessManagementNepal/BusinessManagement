import React from "react";
import { useDashboardRouteContext } from "@/feature/dashboard/shared/hooks/useDashboardRouteContext";
import { GetEmiLoansScreenFactory } from "@/feature/emiLoans/factory/getEmiLoansScreen.factory";

export default function EmiLoansDashboardRoute() {
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

  if (isLoading || !hasActiveSession || !hasActiveAccount) {
    return null;
  }

  return (
    <GetEmiLoansScreenFactory
      activeAccountType={activeAccountType}
      activeUserRemoteId={activeUserRemoteId}
      activeAccountRemoteId={activeAccountRemoteId}
      activeAccountCurrencyCode={activeAccountCurrencyCode}
      activeAccountCountryCode={activeAccountCountryCode}
    />
  );
}
