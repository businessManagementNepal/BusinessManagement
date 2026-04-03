import { useCallback, useEffect, useMemo } from "react";
import { useSegments } from "expo-router";
import { useAccountPermissionAccess } from "@/feature/setting/accounts/userManagement/factory/useAccountPermissionAccess.factory";
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
  DashboardRouteKey,
} from "@/feature/dashboard/shell/types/dashboardShell.types";
import {
  isBusinessOnlyDashboardRoute,
  isPersonalOnlyDashboardRoute,
  isSlotOnlyDashboardRoute,
  resolveDashboardActiveTab,
  resolveDashboardHeaderConfig,
  resolveDashboardRouteKey,
} from "@/feature/dashboard/shell/viewModel/dashboardShell.shared";

const DASHBOARD_TAB_PERMISSION_CODE: Partial<Record<DashboardTabValue, string>> = {
  ledger: "ledger.view",
  pos: "pos.view",
  emi: "emi.view",
  transactions: "transactions.view",
  budget: "budget.view",
};

const DASHBOARD_ROUTE_PERMISSION_CODE: Partial<
  Record<Exclude<DashboardRouteKey, null>, string>
> = {
  "user-management": "user_management.view",
  ledger: "ledger.view",
  pos: "pos.view",
  "emi-loans": "emi.view",
  "personal-transactions": "transactions.view",
  "personal-budget": "budget.view",
};

const MORE_SECTION_ROUTES = new Set<Exclude<DashboardRouteKey, null>>([
  "products",
  "inventory",
]);

export const useDashboardShellViewModel = (): DashboardShellViewModel => {
  const navigation = useSmoothNavigation();
  const segments = useSegments();
  const {
    isLoading,
    activeAccountType,
    activeUserRemoteId,
    activeAccountRemoteId,
    activeAccountDisplayName,
    profileName,
    profileInitials,
  } = useAppRouteSession();

  const permissionAccess = useAccountPermissionAccess({
    activeUserRemoteId,
    activeAccountRemoteId,
  });

  const routeKey = useMemo(() => resolveDashboardRouteKey(segments), [segments]);

  const homePath = useMemo(
    () => getDashboardHomePath(activeAccountType),
    [activeAccountType],
  );

  const onProfilePress = useCallback(() => {
    navigation.push("/(dashboard)/profile");
  }, [navigation]);

  const onHeaderBack = useCallback(() => {
    if (routeKey && MORE_SECTION_ROUTES.has(routeKey)) {
      navigation.replace("/(dashboard)/more");
      return;
    }

    navigation.replace(homePath);
  }, [homePath, navigation, routeKey]);

  const onTabPress = useCallback(
    (tab: DashboardTabValue) => {
      const requiredPermissionCode = DASHBOARD_TAB_PERMISSION_CODE[tab];

      if (
        requiredPermissionCode &&
        !permissionAccess.isLoading &&
        !permissionAccess.hasPermission(requiredPermissionCode)
      ) {
        return;
      }

      const targetPath = getDashboardTabPath(tab, activeAccountType);
      navigation.replace(targetPath);
    },
    [activeAccountType, navigation, permissionAccess],
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
      return;
    }

    if (!permissionAccess.isLoading) {
      const requiredPermissionCode = DASHBOARD_ROUTE_PERMISSION_CODE[routeKey];

      if (
        requiredPermissionCode &&
        !permissionAccess.hasPermission(requiredPermissionCode)
      ) {
        navigation.replace(homePath);
      }
    }
  }, [
    activeAccountType,
    homePath,
    isLoading,
    navigation,
    permissionAccess,
    routeKey,
  ]);

  const showSlotOnly = useMemo(
    () => isSlotOnlyDashboardRoute(routeKey),
    [routeKey],
  );

  const showScaffold = useMemo(
    () => Boolean(routeKey) && !showSlotOnly,
    [routeKey, showSlotOnly],
  );

  const headerConfig = useMemo(
    () =>
      resolveDashboardHeaderConfig({
        routeKey,
        activeAccountDisplayName,
        profileName,
      }),
    [activeAccountDisplayName, profileName, routeKey],
  );

  const tabItems = useMemo(
    () =>
      getDashboardTabItems(activeAccountType).filter((tabItem) => {
        const requiredPermissionCode = DASHBOARD_TAB_PERMISSION_CODE[tabItem.key];

        if (!requiredPermissionCode || permissionAccess.isLoading) {
          return true;
        }

        return permissionAccess.hasPermission(requiredPermissionCode);
      }),
    [activeAccountType, permissionAccess],
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
      onHeaderBack,
      onTabPress,
    }),
    [
      activeTab,
      headerConfig,
      isLoading,
      onHeaderBack,
      onProfilePress,
      onTabPress,
      profileInitials,
      showScaffold,
      showSlotOnly,
      tabItems,
    ],
  );
};
