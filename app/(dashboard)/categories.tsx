import { AccountType } from "@/feature/auth/accountSelection/types/accountSelection.types";
import { useDashboardRouteContext } from "@/feature/dashboard/shared/hooks/useDashboardRouteContext";
import { getDashboardHomePath } from "@/feature/dashboard/shared/utils/dashboardNavigation.util";
import { GetCategoriesScreenFactory } from "@/feature/categories/factory/getCategoriesScreen.factory";
import { useAccountPermissionAccess } from "@/feature/userManagement/factory/useAccountPermissionAccess.factory";
import { useSmoothNavigation } from "@/shared/hooks/useSmoothNavigation";
import React, { useEffect } from "react";

const CATEGORIES_VIEW_PERMISSION_CODE = "products.view";
const CATEGORIES_MANAGE_PERMISSION_CODE = "products.manage";

export default function CategoriesDashboardRoute() {
  const navigation = useSmoothNavigation();
  const {
    isLoading,
    hasActiveSession,
    hasActiveAccount,
    activeUserRemoteId,
    activeAccountRemoteId,
    activeAccountType,
  } = useDashboardRouteContext();

  const permissionAccess = useAccountPermissionAccess({
    activeUserRemoteId,
    activeAccountRemoteId,
  });

  const canViewCategories = permissionAccess.hasPermission(
    CATEGORIES_VIEW_PERMISSION_CODE,
  );
  const canManageCategories = permissionAccess.hasPermission(
    CATEGORIES_MANAGE_PERMISSION_CODE,
  );

  useEffect(() => {
    if (isLoading || !hasActiveSession || !hasActiveAccount) {
      return;
    }

    if (activeAccountType !== AccountType.Business) {
      navigation.replace(getDashboardHomePath(activeAccountType));
      return;
    }

    if (permissionAccess.isLoading) {
      return;
    }

    if (!canViewCategories) {
      navigation.replace(getDashboardHomePath(activeAccountType));
    }
  }, [
    activeAccountType,
    canViewCategories,
    hasActiveAccount,
    hasActiveSession,
    isLoading,
    navigation,
    permissionAccess.isLoading,
  ]);

  if (
    isLoading ||
    !hasActiveSession ||
    !hasActiveAccount ||
    permissionAccess.isLoading
  ) {
    return null;
  }

  if (activeAccountType !== AccountType.Business || !canViewCategories) {
    return null;
  }

  return (
    <GetCategoriesScreenFactory
      activeUserRemoteId={activeUserRemoteId}
      activeAccountRemoteId={activeAccountRemoteId}
      activeAccountType={activeAccountType}
      canManage={canManageCategories}
    />
  );
}
