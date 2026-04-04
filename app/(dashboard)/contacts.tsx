import { AccountType } from "@/feature/auth/accountSelection/types/accountSelection.types";
import { GetContactsScreenFactory } from "@/feature/contacts/factory/getContactsScreen.factory";
import { useDashboardRouteContext } from "@/feature/dashboard/shared/hooks/useDashboardRouteContext";
import { getDashboardHomePath } from "@/feature/dashboard/shared/utils/dashboardNavigation.util";
import { useAccountPermissionAccess } from "@/feature/userManagement/factory/useAccountPermissionAccess.factory";
import { useSmoothNavigation } from "@/shared/hooks/useSmoothNavigation";
import React, { useEffect } from "react";

const CONTACTS_VIEW_PERMISSION_CODE = "contacts.view";
const CONTACTS_MANAGE_PERMISSION_CODE = "contacts.manage";

export default function ContactsDashboardRoute() {
  const navigation = useSmoothNavigation();
  const {
    isLoading,
    hasActiveSession,
    hasActiveAccount,
    activeUserRemoteId,
    activeAccountRemoteId,
    activeAccountType,
    activeAccountCurrencyCode,
    activeAccountCountryCode,
  } = useDashboardRouteContext();

  const permissionAccess = useAccountPermissionAccess({
    activeUserRemoteId,
    activeAccountRemoteId,
  });

  const canViewContacts = permissionAccess.hasPermission(
    CONTACTS_VIEW_PERMISSION_CODE,
  );
  const shouldEnforceBusinessPermission =
    activeAccountType === AccountType.Business;
  const hasContactsAccess = shouldEnforceBusinessPermission
    ? canViewContacts
    : true;
  const canManageContacts = shouldEnforceBusinessPermission
    ? permissionAccess.hasPermission(CONTACTS_MANAGE_PERMISSION_CODE)
    : true;

  useEffect(() => {
    if (isLoading || !hasActiveSession || !hasActiveAccount) {
      return;
    }

    if (!shouldEnforceBusinessPermission || permissionAccess.isLoading) {
      return;
    }

    if (!hasContactsAccess) {
      navigation.replace(getDashboardHomePath(activeAccountType));
    }
  }, [
    activeAccountType,
    hasContactsAccess,
    hasActiveAccount,
    hasActiveSession,
    isLoading,
    navigation,
    permissionAccess.isLoading,
    shouldEnforceBusinessPermission,
  ]);

  if (
    isLoading ||
    !hasActiveSession ||
    !hasActiveAccount ||
    (shouldEnforceBusinessPermission && permissionAccess.isLoading)
  ) {
    return null;
  }

  if (!hasContactsAccess) {
    return null;
  }

  return (
    <GetContactsScreenFactory
      activeUserRemoteId={activeUserRemoteId}
      activeAccountRemoteId={activeAccountRemoteId}
      activeAccountType={activeAccountType}
      activeAccountCurrencyCode={activeAccountCurrencyCode}
      activeAccountCountryCode={activeAccountCountryCode}
      canManage={canManageContacts}
    />
  );
}
