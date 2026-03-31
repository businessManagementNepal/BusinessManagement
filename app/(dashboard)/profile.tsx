import React, { useCallback } from "react";
import appDatabase from "@/shared/database/appDatabase";
import {
  clearActiveUserSession,
} from "@/feature/appSettings/data/appSettings.store";
import { GetProfileScreenFactory } from "@/feature/profile/screen/factory/getProfileScreen.factory";
import { useDashboardRouteContext } from "@/feature/dashboard/shared/hooks/useDashboardRouteContext";
import { getDashboardHomePath } from "@/feature/dashboard/shared/utils/dashboardNavigation.util";
import { useAppRouteSession } from "@/feature/session/ui/AppRouteSessionProvider";
import { useSmoothNavigation } from "@/shared/hooks/useSmoothNavigation";
import { AccountTypeValue } from "@/feature/setting/accounts/accountSelection/types/accountSelection.types";

export default function DashboardProfileRoute() {
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
    navigation.replace(getDashboardHomePath(dashboardContext.activeAccountType));
  }, [dashboardContext.activeAccountType, navigation]);

  return (
    <GetProfileScreenFactory
      database={appDatabase}
      activeUserRemoteId={dashboardContext.activeUserRemoteId}
      activeAccountRemoteId={dashboardContext.activeAccountRemoteId}
      onNavigateHome={handleNavigateHome}
      onLogout={handleLogout}
      onBack={handleBack}
    />
  );
}
