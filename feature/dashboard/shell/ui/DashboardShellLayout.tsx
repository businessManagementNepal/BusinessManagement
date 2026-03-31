import React from "react";
import { StyleSheet, View } from "react-native";
import { BottomTabBar } from "@/shared/components/reusable/ScreenLayouts/BottomTabBar";
import { PrimaryHeader } from "@/shared/components/reusable/ScreenLayouts/PrimaryHeader";
import { colors } from "@/shared/components/theme/colors";
import { DashboardShellViewModel } from "@/feature/dashboard/shell/types/dashboardShell.types";

type DashboardShellLayoutProps = {
  viewModel: DashboardShellViewModel;
  children: React.ReactNode;
};

export function DashboardShellLayout({
  viewModel,
  children,
}: DashboardShellLayoutProps) {
  if (viewModel.isLoading) {
    return null;
  }

  if (!viewModel.showScaffold && !viewModel.showSlotOnly) {
    return null;
  }

  if (viewModel.showSlotOnly) {
    return <View style={styles.container}>{children}</View>;
  }

  return (
    <View style={styles.container}>
      <PrimaryHeader
        title={viewModel.headerConfig.title}
        subtitle={viewModel.headerConfig.subtitle}
        rightLabel={viewModel.profileInitials}
        showBell={viewModel.headerConfig.showBell}
        showProfile={viewModel.headerConfig.showProfile}
        onProfilePress={viewModel.onProfilePress}
      />
      <View style={styles.divider} />
      <View style={styles.content}>{children}</View>
      <BottomTabBar
        route={viewModel.activeTab}
        items={viewModel.tabItems}
        onNavigate={viewModel.onTabPress}
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
