import React from "react";
import { Redirect } from "expo-router";
import { useAppRouteSession } from "@/feature/session/ui/AppRouteSessionProvider";
import { resolveEntryRoute } from "@/feature/session/ui/entryRouteDecision.util";

export default function IndexRoute() {
  const { isLoading, hasActiveSession, hasActiveAccount, activeAccountType } =
    useAppRouteSession();

  const targetRoute = resolveEntryRoute({
    isLoading,
    hasActiveSession,
    hasActiveAccount,
    activeAccountType,
  });

  if (!targetRoute) {
    return null;
  }

  return <Redirect href={targetRoute} />;
}
