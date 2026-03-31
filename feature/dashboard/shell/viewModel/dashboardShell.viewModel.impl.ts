import { useCallback, useEffect, useMemo } from "react";
import { useSegments } from "expo-router";
import { useAppRouteSession } from "@/feature/session/ui/AppRouteSessionProvider";
import { AccountType } from "@/feature/setting/accounts/accountSelection/types/accountSelection.types";
import {
  getDashboardHomePath,
  getDashboardTabItems,
  getDashboardTabPath,
} from "@/feature/dashboard/shared/utils/dashboardNavigation.util";
import { DashboardTabValue } from "@/feature/dashboard/shared/types/dashboardNavigation.types";
import { useSmoothNavigation } from "@/shared/hooks/useSmoothNavigation";
import {
  DashboardShellViewModel,
} from "@/feature/dashboard/shell/types/dashboardShell.types";
import {
  isBusinessOnlyDashboardRoute,
  isPersonalOnlyDashboardRoute,
  isSlotOnlyDashboardRoute,
  resolveDashboardActiveTab,
  resolveDashboardHeaderConfig,
  resolveDashboardRouteKey,
} from "@/feature/dashboard/shell/viewModel/dashboardShell.shared";

export const useDashboardShellViewModel = (): DashboardShellViewModel => {
  const navigation = useSmoothNavigation();
  const segments = useSegments();
  const { isLoading, activeAccountType, profileInitials } = useAppRouteSession();

  const routeKey = useMemo(() => resolveDashboardRouteKey(segments), [segments]);

  const homePath = useMemo(
    () => getDashboardHomePath(activeAccountType),
    [activeAccountType],
  );

  const onProfilePress = useCallback(() => {
    navigation.push("/(dashboard)/profile");
  }, [navigation]);

  const onTabPress = useCallback(
    (tab: DashboardTabValue) => {
      const targetPath = getDashboardTabPath(tab, activeAccountType);
      navigation.replace(targetPath);
    },
    [activeAccountType, navigation],
  );

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!routeKey) {
      navigation.replace(homePath);
      return;
    }

    if (
      activeAccountType !== AccountType.Business &&
      isBusinessOnlyDashboardRoute(routeKey)
    ) {
      navigation.replace(homePath);
      return;
    }

    if (
      activeAccountType !== AccountType.Personal &&
      isPersonalOnlyDashboardRoute(routeKey)
    ) {
      navigation.replace(homePath);
    }
  }, [activeAccountType, homePath, isLoading, navigation, routeKey]);

  const showSlotOnly = useMemo(
    () => isSlotOnlyDashboardRoute(routeKey),
    [routeKey],
  );

  const showScaffold = useMemo(
    () => Boolean(routeKey) && !showSlotOnly,
    [routeKey, showSlotOnly],
  );

  const headerConfig = useMemo(
    () => resolveDashboardHeaderConfig(routeKey),
    [routeKey],
  );

  const tabItems = useMemo(
    () => getDashboardTabItems(activeAccountType),
    [activeAccountType],
  );

  const activeTab = useMemo(() => resolveDashboardActiveTab(routeKey), [routeKey]);

  return useMemo(
    () => ({
      isLoading,
      showSlotOnly,
      showScaffold,
      headerConfig,
      tabItems,
      activeTab,
      profileInitials,
      onProfilePress,
      onTabPress,
    }),
    [
      activeTab,
      headerConfig,
      isLoading,
      onProfilePress,
      onTabPress,
      profileInitials,
      showScaffold,
      showSlotOnly,
      tabItems,
    ],
  );
};
