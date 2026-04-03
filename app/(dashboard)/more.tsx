import { AccountType } from "@/feature/auth/accountSelection/types/accountSelection.types";
import { GetMoreDashboardScreenFactory } from "@/feature/dashboard/more/factory/getMoreDashboardScreen.factory";
import { MoreDashboardMenuItemId } from "@/feature/dashboard/more/types/moreDashboard.types";
import { MORE_DASHBOARD_MENU_PERMISSION_CODE } from "@/feature/dashboard/more/types/moreDashboardPermission.constants";
import { useDashboardRouteContext } from "@/feature/dashboard/shared/hooks/useDashboardRouteContext";
import { useAccountPermissionAccess } from "@/feature/userManagement/factory/useAccountPermissionAccess.factory";
import { useSmoothNavigation } from "@/shared/hooks/useSmoothNavigation";
import React, { useCallback } from "react";

export default function MoreDashboardRoute() {
  const navigation = useSmoothNavigation();
  const {
    isLoading,
    hasActiveSession,
    hasActiveAccount,
    activeAccountType,
    activeUserRemoteId,
    activeAccountRemoteId,
  } = useDashboardRouteContext();

  const permissionAccess = useAccountPermissionAccess({
    activeUserRemoteId,
    activeAccountRemoteId,
  });
  const isPermissionLoading = permissionAccess.isLoading;
  const hasAccountPermission = permissionAccess.hasPermission;

  const handleOpenProfile = useCallback(() => {
    navigation.push("/(dashboard)/profile");
  }, [navigation]);

  const handleOpenLedger = useCallback(() => {
    navigation.replace("/(dashboard)/ledger");
  }, [navigation]);

  const handleOpenPos = useCallback(() => {
    navigation.replace("/(dashboard)/pos");
  }, [navigation]);

  const handleOpenProducts = useCallback(() => {
    navigation.push("/(dashboard)/products");
  }, [navigation]);

  const handleOpenCategories = useCallback(() => {
    navigation.push("/(dashboard)/categories");
  }, [navigation]);

  const handleOpenInventory = useCallback(() => {
    navigation.push("/(dashboard)/inventory");
  }, [navigation]);

  const handleOpenEmi = useCallback(() => {
    navigation.replace("/(dashboard)/emi-loans");
  }, [navigation]);

  const handleOpenTransactions = useCallback(() => {
    navigation.replace("/(dashboard)/personal-transactions");
  }, [navigation]);

  const handleOpenBudget = useCallback(() => {
    navigation.replace("/(dashboard)/personal-budget");
  }, [navigation]);

  const handleOpenUserManagement = useCallback(() => {
    navigation.push("/(dashboard)/user-management");
  }, [navigation]);

  const hasMenuAccess = useCallback(
    (itemId: MoreDashboardMenuItemId): boolean => {
      if (activeAccountType !== AccountType.Business) {
        return true;
      }

      if (itemId === "profile") {
        return true;
      }

      const requiredPermissionCode =
        MORE_DASHBOARD_MENU_PERMISSION_CODE[itemId];

      if (!requiredPermissionCode || isPermissionLoading) {
        return true;
      }

      return hasAccountPermission(requiredPermissionCode);
    },
    [activeAccountType, hasAccountPermission, isPermissionLoading],
  );

  if (isLoading || !hasActiveSession || !hasActiveAccount) {
    return null;
  }

  return (
    <GetMoreDashboardScreenFactory
      isBusinessMode={activeAccountType === AccountType.Business}
      onOpenProfile={handleOpenProfile}
      onOpenLedger={handleOpenLedger}
      onOpenPos={handleOpenPos}
      onOpenProducts={handleOpenProducts}
      onOpenCategories={handleOpenCategories}
      onOpenInventory={handleOpenInventory}
      onOpenEmi={handleOpenEmi}
      onOpenTransactions={handleOpenTransactions}
      onOpenBudget={handleOpenBudget}
      onOpenUserManagement={handleOpenUserManagement}
      hasMenuAccess={hasMenuAccess}
    />
  );
}
