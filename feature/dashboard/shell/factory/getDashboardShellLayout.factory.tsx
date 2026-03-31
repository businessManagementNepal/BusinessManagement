import React from "react";
import { Slot } from "expo-router";
import { useDashboardShellViewModel } from "@/feature/dashboard/shell/viewModel/dashboardShell.viewModel.impl";
import { DashboardShellLayout } from "@/feature/dashboard/shell/ui/DashboardShellLayout";

export function GetDashboardShellLayoutFactory() {
  const viewModel = useDashboardShellViewModel();

  return (
    <DashboardShellLayout viewModel={viewModel}>
      <Slot />
    </DashboardShellLayout>
  );
}
