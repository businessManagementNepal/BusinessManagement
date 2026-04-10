import React from "react";
import { GetNotificationCenterScreenFactory } from "@/feature/notifications/factory/getNotificationCenterScreen.factory";
import { useDashboardRouteContext } from "@/feature/dashboard/shared/hooks/useDashboardRouteContext";
import { useSmoothNavigation } from "@/shared/hooks/useSmoothNavigation";

export default function NotificationsDashboardRoute() {
  const navigation = useSmoothNavigation();
  const {
    isLoading,
    hasActiveSession,
    hasActiveAccount,
    activeAccountRemoteId,
    activeAccountCurrencyCode,
    activeAccountCountryCode,
  } = useDashboardRouteContext();

  if (isLoading || !hasActiveSession || !hasActiveAccount) {
    return null;
  }

  return (
    <GetNotificationCenterScreenFactory
      activeBusinessAccountRemoteId={activeAccountRemoteId}
      activeBusinessAccountCurrencyCode={activeAccountCurrencyCode}
      activeBusinessAccountCountryCode={activeAccountCountryCode}
      onOpenLedger={() => navigation.replace("/(dashboard)/ledger")}
    />
  );
}

