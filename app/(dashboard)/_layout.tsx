import React, { useCallback, useEffect } from "react";
import { Slot, useSegments } from "expo-router";
import { StyleSheet, View } from "react-native";
import {
  DashboardTab,
  DashboardTabValue,
} from "@/feature/dashboard/shared/types/dashboardNavigation.types";
import {
  getDashboardHomePath,
  getDashboardTabItems,
  getDashboardTabPath,
} from "@/feature/dashboard/shared/utils/dashboardNavigation.util";
import { BottomTabBar } from "@/shared/components/reusable/ScreenLayouts/BottomTabBar";
import { PrimaryHeader } from "@/shared/components/reusable/ScreenLayouts/PrimaryHeader";
import {
  AccountType,
} from "@/feature/setting/accounts/accountSelection/types/accountSelection.types";
import { useAppRouteSession } from "@/feature/session/ui/AppRouteSessionProvider";
import { colors } from "@/shared/components/theme/colors";
import { useSmoothNavigation } from "@/shared/hooks/useSmoothNavigation";

type DashboardRouteKey =
  | "business"
  | "business-details"
  | "personal"
  | "ledger"
  | "pos"
  | "emi-loans"
  | "more"
  | "personal-transactions"
  | "personal-budget"
  | "profile"
  | null;

const BUSINESS_ONLY_ROUTES = new Set<DashboardRouteKey>([
  "business",
  "ledger",
  "pos",
]);

const PERSONAL_ONLY_ROUTES = new Set<DashboardRouteKey>([
  "personal",
  "personal-transactions",
  "personal-budget",
]);

const resolveDashboardRouteKey = (segments: string[]): DashboardRouteKey => {
  const routeKey = segments[1];

  switch (routeKey) {
    case "business":
    case "business-details":
    case "personal":
    case "ledger":
    case "pos":
    case "emi-loans":
    case "more":
    case "personal-transactions":
    case "personal-budget":
    case "profile":
      return routeKey;
    default:
      return null;
  }
};

const resolveHeaderConfig = (routeKey: DashboardRouteKey) => {
  switch (routeKey) {
    case "business":
      return {
        title: "My Business",
        subtitle: "Good Evening",
        showBell: true,
        showProfile: true,
      };
    case "personal":
      return {
        title: "Personal Dashboard",
        subtitle: "Good Evening",
        showBell: true,
        showProfile: true,
      };
    case "ledger":
      return { title: "Ledger", subtitle: undefined, showBell: false, showProfile: false };
    case "pos":
      return { title: "POS", subtitle: undefined, showBell: false, showProfile: false };
    case "emi-loans":
      return {
        title: "EMI and Loans",
        subtitle: undefined,
        showBell: false,
        showProfile: false,
      };
    case "more":
      return { title: "More", subtitle: undefined, showBell: false, showProfile: false };
    case "personal-transactions":
      return {
        title: "Transactions",
        subtitle: undefined,
        showBell: false,
        showProfile: false,
      };
    case "personal-budget":
      return { title: "Budget", subtitle: undefined, showBell: false, showProfile: false };
    default:
      return {
        title: "Dashboard",
        subtitle: undefined,
        showBell: false,
        showProfile: false,
      };
  }
};

const resolveActiveTab = (
  routeKey: DashboardRouteKey,
): DashboardTabValue => {
  switch (routeKey) {
    case "business":
    case "personal":
      return DashboardTab.Home;
    case "ledger":
      return DashboardTab.Ledger;
    case "pos":
      return DashboardTab.Pos;
    case "emi-loans":
      return DashboardTab.Emi;
    case "more":
      return DashboardTab.More;
    case "personal-transactions":
      return DashboardTab.Transactions;
    case "personal-budget":
      return DashboardTab.Budget;
    default:
      return DashboardTab.Home;
  }
};

export default function DashboardLayout() {
  const navigation = useSmoothNavigation();
  const segments = useSegments();
  const { isLoading, activeAccountType, profileInitials } = useAppRouteSession();
  const routeKey = resolveDashboardRouteKey(segments);

  const handleProfilePress = useCallback(() => {
    navigation.push("/(dashboard)/profile");
  }, [navigation]);

  const handleTabPress = useCallback(
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

    const homePath = getDashboardHomePath(activeAccountType);

    if (!routeKey) {
      navigation.replace(homePath);
      return;
    }

    if (
      activeAccountType !== AccountType.Business &&
      BUSINESS_ONLY_ROUTES.has(routeKey)
    ) {
      navigation.replace(homePath);
      return;
    }

    if (
      activeAccountType !== AccountType.Personal &&
      PERSONAL_ONLY_ROUTES.has(routeKey)
    ) {
      navigation.replace(homePath);
    }
  }, [activeAccountType, isLoading, navigation, routeKey]);

  if (isLoading) {
    return null;
  }

  if (!routeKey) {
    return null;
  }

  if (routeKey === "profile" || routeKey === "business-details") {
    return (
      <View style={styles.container}>
        <Slot />
      </View>
    );
  }

  const headerConfig = resolveHeaderConfig(routeKey);
  const tabItems = getDashboardTabItems(activeAccountType);
  const activeTab = resolveActiveTab(routeKey);

  return (
    <View style={styles.container}>
      <PrimaryHeader
        title={headerConfig.title}
        subtitle={headerConfig.subtitle}
        rightLabel={profileInitials}
        showBell={headerConfig.showBell}
        showProfile={headerConfig.showProfile}
        onProfilePress={handleProfilePress}
      />
      <View style={styles.divider} />
      <View style={styles.content}>
        <Slot />
      </View>
      <BottomTabBar
        route={activeTab}
        items={tabItems}
        onNavigate={handleTabPress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  divider: {
    height: 4,
    backgroundColor: colors.destructive,
  },
  content: {
    flex: 1,
  },
});
