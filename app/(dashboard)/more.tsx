import { AccountType } from "@/feature/auth/accountSelection/types/accountSelection.types";
import { clearActiveUserSession } from "@/feature/appSettings/data/appSettings.store";
import { GetMoreDashboardScreenFactory } from "@/feature/dashboard/more/factory/getMoreDashboardScreen.factory";
import { MoreDashboardMenuItemId } from "@/feature/dashboard/more/types/moreDashboard.types";
import { MORE_DASHBOARD_MENU_PERMISSION_CODE } from "@/feature/dashboard/more/types/moreDashboardPermission.constants";
import { useDashboardRouteContext } from "@/feature/dashboard/shared/hooks/useDashboardRouteContext";
import { useAppRouteSession } from "@/feature/session/ui/AppRouteSessionProvider";
import appDatabase from "@/shared/database/appDatabase";
import { useAccountPermissionAccess } from "@/feature/userManagement/factory/useAccountPermissionAccess.factory";
import { useSmoothNavigation } from "@/shared/hooks/useSmoothNavigation";
import React, { useCallback } from "react";

export default function MoreDashboardRoute() {
  const navigation = useSmoothNavigation();
  const { refreshSession } = useAppRouteSession();
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

  const handleOpenOrders = useCallback(() => {
    navigation.push("/(dashboard)/orders");
  }, [navigation]);

  const handleOpenReports = useCallback(() => {
    navigation.push("/(dashboard)/reports");
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

  const handleOpenMoneyAccounts = useCallback(() => {
    navigation.push("/(dashboard)/money-accounts");
  }, [navigation]);

  const handleOpenContacts = useCallback(() => {
    navigation.push("/(dashboard)/contacts");
  }, [navigation]);

  const handleOpenBilling = useCallback(() => {
    navigation.push("/(dashboard)/billing");
  }, [navigation]);

  const handleOpenTaxCalculator = useCallback(() => {
    navigation.push("/(dashboard)/tax-calculator");
  }, [navigation]);

  const handleOpenSettings = useCallback(() => {
    navigation.push("/(dashboard)/settings");
  }, [navigation]);

  const handleOpenNotes = useCallback(() => {
    navigation.push("/(dashboard)/notes");
  }, [navigation]);

  const handleOpenNotifications = useCallback(() => {
    navigation.push("/(dashboard)/notifications");
  }, [navigation]);

  const handleLogout = useCallback(async () => {
    try {
      await clearActiveUserSession(appDatabase);
      await refreshSession();
    } catch {}
  }, [refreshSession]);

  const handleOpenEmi = useCallback(() => {
    navigation.replace("/(dashboard)/emi-loans");
  }, [navigation]);

  const handleOpenTransactions = useCallback(() => {
    if (activeAccountType === AccountType.Business) {
      navigation.push("/(dashboard)/transactions");
      return;
    }

    navigation.replace("/(dashboard)/personal-transactions");
  }, [activeAccountType, navigation]);

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

      if (
        itemId === "profile" ||
        itemId === "settings" ||
        itemId === "notifications" ||
        itemId === "logout"
      ) {
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
      onOpenOrders={handleOpenOrders}
      onOpenReports={handleOpenReports}
      onOpenProducts={handleOpenProducts}
      onOpenCategories={handleOpenCategories}
      onOpenInventory={handleOpenInventory}
      onOpenMoneyAccounts={handleOpenMoneyAccounts}
      onOpenContacts={handleOpenContacts}
      onOpenBilling={handleOpenBilling}
      onOpenTaxCalculator={handleOpenTaxCalculator}
      onOpenSettings={handleOpenSettings}
      onOpenNotes={handleOpenNotes}
      onOpenEmi={handleOpenEmi}
      onOpenTransactions={handleOpenTransactions}
      onOpenBudget={handleOpenBudget}
      onOpenUserManagement={handleOpenUserManagement}
      onOpenNotifications={handleOpenNotifications}
      onLogout={handleLogout}
      hasMenuAccess={hasMenuAccess}
    />
  );
}
