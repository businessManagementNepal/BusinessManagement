import React from "react";
import appDatabase from "@/shared/database/appDatabase";
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
  } = useDashboardRouteContext();

  if (isLoading || !hasActiveSession || !hasActiveAccount) {
    return null;
  }

  return (
    <GetEmiLoansScreenFactory
      database={appDatabase}
      activeAccountType={activeAccountType}
      activeUserRemoteId={activeUserRemoteId}
      activeAccountRemoteId={activeAccountRemoteId}
    />
  );
}
