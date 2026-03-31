import React, { useCallback } from "react";
import appDatabase from "@/shared/database/appDatabase";
import {
  clearActiveUserSession,
} from "@/feature/appSettings/data/appSettings.store";
import { useDashboardRouteContext } from "@/feature/dashboard/shared/hooks/useDashboardRouteContext";
import { getDashboardHomePath } from "@/feature/dashboard/shared/utils/dashboardNavigation.util";
import { useAppRouteSession } from "@/feature/session/ui/AppRouteSessionProvider";
import { useSmoothNavigation } from "@/shared/hooks/useSmoothNavigation";
import { AccountTypeValue } from "@/feature/setting/accounts/accountSelection/types/accountSelection.types";
import { GetBusinessDetailsScreenFactory } from "@/feature/profile/screen/factory/getBusinessDetailsScreen.factory";

export default function DashboardBusinessDetailsRoute() {
  const navigation = useSmoothNavigation();
  const dashboardContext = useDashboardRouteContext();
  const { refreshSession } = useAppRouteSession();

  const handleNavigateHome = useCallback(
    (accountType: AccountTypeValue) => {
      navigation.replace(getDashboardHomePath(accountType));
    },
    [navigation],
  );

  const handleLogout = useCallback(async () => {
    try {
      await clearActiveUserSession(appDatabase);
      await refreshSession();
    } catch (error) {
      console.error("Failed to clear session during logout.", error);
    }
  }, [refreshSession]);

  const handleBack = useCallback(() => {
    navigation.replace("/(dashboard)/profile");
  }, [navigation]);

  const handleOpenBusinessDetails = useCallback(() => {
    navigation.push("/(dashboard)/business-details");
  }, [navigation]);

  return (
    <GetBusinessDetailsScreenFactory
      database={appDatabase}
      activeUserRemoteId={dashboardContext.activeUserRemoteId}
      activeAccountRemoteId={dashboardContext.activeAccountRemoteId}
      onNavigateHome={handleNavigateHome}
      onOpenBusinessDetails={handleOpenBusinessDetails}
      onLogout={handleLogout}
      onBack={handleBack}
    />
  );
}
