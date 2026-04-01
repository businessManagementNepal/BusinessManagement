import React, { useEffect } from "react";
import { GetTransactionsScreenFactory } from "@/feature/transactions/factory/getTransactionsScreen.factory";
import { useDashboardRouteContext } from "@/feature/dashboard/shared/hooks/useDashboardRouteContext";
import { AccountType } from "@/feature/setting/accounts/accountSelection/types/accountSelection.types";
import { useSmoothNavigation } from "@/shared/hooks/useSmoothNavigation";
import { getDashboardHomePath } from "@/feature/dashboard/shared/utils/dashboardNavigation.util";
import appDatabase from "@/shared/database/appDatabase";

export default function PersonalTransactionsDashboardRoute() {
  const navigation = useSmoothNavigation();
  const {
    activeAccountType,
    activeUserRemoteId,
    activeAccountRemoteId,
  } = useDashboardRouteContext();

  useEffect(() => {
    if (activeAccountType !== AccountType.Personal) {
      navigation.replace(getDashboardHomePath(activeAccountType));
    }
  }, [activeAccountType, navigation]);

  if (activeAccountType !== AccountType.Personal) {
    return null;
  }

  return (
    <GetTransactionsScreenFactory
      database={appDatabase}
      activeUserRemoteId={activeUserRemoteId}
      activeAccountRemoteId={activeAccountRemoteId}
    />
  );
}
