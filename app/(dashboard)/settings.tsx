import React, { useCallback } from "react";
import { GetSettingsScreenFactory } from "@/feature/appSettings/settings/factory/getSettingsScreen.factory";
import { AccountType } from "@/feature/auth/accountSelection/types/accountSelection.types";
import { useDashboardRouteContext } from "@/feature/dashboard/shared/hooks/useDashboardRouteContext";
import { useAccountPermissionAccess } from "@/feature/userManagement/factory/useAccountPermissionAccess.factory";
import { useAppRouteSession } from "@/feature/session/ui/AppRouteSessionProvider";
import { useSmoothNavigation } from "@/shared/hooks/useSmoothNavigation";

const PROFILE_EDIT_PERMISSION_CODE = "profile.edit";
const MANAGE_STAFF_PERMISSION_CODE = "user_management.manage_staff";

export default function SettingsDashboardRoute() {
  const navigation = useSmoothNavigation();
  const { refreshSession } = useAppRouteSession();
  const {
    isLoading,
    hasActiveSession,
    hasActiveAccount,
    activeUserRemoteId,
    activeAccountRemoteId,
    activeAccountType,
    activeAccountDisplayName,
  } = useDashboardRouteContext();
  const permissionAccess = useAccountPermissionAccess({
    activeUserRemoteId,
    activeAccountRemoteId,
  });
  const isBusinessAccount = activeAccountType === AccountType.Business;
  const canManageSensitiveSettings =
    !isBusinessAccount ||
    (permissionAccess.hasPermission(PROFILE_EDIT_PERMISSION_CODE) &&
      permissionAccess.hasPermission(MANAGE_STAFF_PERMISSION_CODE));

  const handleBack = useCallback(() => {
    navigation.replace("/(dashboard)/more");
  }, [navigation]);

  const handleLocalDataDeleted = useCallback(async () => {
    await refreshSession();
    navigation.replace("/(auth)/login");
  }, [navigation, refreshSession]);

  if (isLoading || !hasActiveSession || !hasActiveAccount) {
    return null;
  }

  return (
    <GetSettingsScreenFactory
      activeUserRemoteId={activeUserRemoteId}
      activeAccountRemoteId={activeAccountRemoteId}
      activeAccountType={activeAccountType ?? AccountType.Personal}
      activeAccountDisplayName={activeAccountDisplayName}
      canManageSensitiveSettings={canManageSensitiveSettings}
      isSensitiveSettingsAccessLoading={
        isBusinessAccount && permissionAccess.isLoading
      }
      onLocalDataDeleted={handleLocalDataDeleted}
      onBack={handleBack}
    />
  );
}
