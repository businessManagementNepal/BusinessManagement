import { useMemo } from "react";
import appDatabase from "@/shared/database/appDatabase";
import { clearActiveUserSession } from "@/feature/appSettings/data/appSettings.store";
import { useDashboardRouteContext } from "@/feature/dashboard/shared/hooks/useDashboardRouteContext";
import { useAppRouteSession } from "@/feature/session/ui/AppRouteSessionProvider";
import { useSmoothNavigation } from "@/shared/hooks/useSmoothNavigation";
import {
  createDashboardProfileRouteHandlers,
  DashboardProfileRouteHandlers,
} from "@/feature/profile/screen/factory/dashboardProfileRouteHandlers.shared";

export const useDashboardProfileRouteHandlers =
  (): DashboardProfileRouteHandlers => {
    const navigation = useSmoothNavigation();
    const dashboardContext = useDashboardRouteContext();
    const { refreshSession } = useAppRouteSession();

    return useMemo(
      () =>
        createDashboardProfileRouteHandlers({
          activeUserRemoteId: dashboardContext.activeUserRemoteId,
          activeAccountRemoteId: dashboardContext.activeAccountRemoteId,
          activeAccountType: dashboardContext.activeAccountType,
          navigateReplace: navigation.replace,
          navigatePush: navigation.push,
          clearUserSession: () => clearActiveUserSession(appDatabase),
          refreshSession,
          onLogoutError: (error) => {
            console.error("Failed to clear session during logout.", error);
          },
        }),
      [
        dashboardContext.activeAccountRemoteId,
        dashboardContext.activeAccountType,
        dashboardContext.activeUserRemoteId,
        navigation.push,
        navigation.replace,
        refreshSession,
      ],
    );
  };
