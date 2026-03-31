import React from "react";
import appDatabase from "@/shared/database/appDatabase";
import { GetBusinessDetailsScreenFactory } from "@/feature/profile/screen/factory/getBusinessDetailsScreen.factory";
import { useDashboardProfileRouteHandlers } from "@/feature/profile/screen/factory/useDashboardProfileRouteHandlers.factory";

export default function DashboardBusinessDetailsRoute() {
  const {
    activeUserRemoteId,
    activeAccountRemoteId,
    onNavigateHome,
    onLogout,
    onBackToProfile,
    onOpenBusinessDetails,
  } = useDashboardProfileRouteHandlers();

  return (
    <GetBusinessDetailsScreenFactory
      database={appDatabase}
      activeUserRemoteId={activeUserRemoteId}
      activeAccountRemoteId={activeAccountRemoteId}
      onNavigateHome={onNavigateHome}
      onOpenBusinessDetails={onOpenBusinessDetails}
      onLogout={onLogout}
      onBack={onBackToProfile}
    />
  );
}
