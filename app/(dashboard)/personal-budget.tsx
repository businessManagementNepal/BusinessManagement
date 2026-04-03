import React from "react";
import {
  DashboardInfoCard,
  DashboardTabScaffold,
} from "@/feature/dashboard/shared/ui/DashboardTabScaffold";

export default function PersonalBudgetDashboardRoute() {
  return (
    <DashboardTabScaffold
      footer={null}
      baseBottomPadding={110}
      contentContainerStyle={null}
      showDivider={false}
    >
      <DashboardInfoCard
        title="Personal Budget"
        description="Set monthly spending limits and monitor category-wise usage in personal mode from this tab."
      />
      <DashboardInfoCard
        title="Next"
        description="Connect budget goals, alerts and progress widgets into this route."
      />
    </DashboardTabScaffold>
  );
}
