import { describe, expect, it } from "vitest";
import { AccountType } from "@/feature/setting/accounts/accountSelection/types/accountSelection.types";
import { DashboardTab } from "@/feature/dashboard/shared/types/dashboardNavigation.types";
import {
  isDashboardRouteAllowed,
  isSlotOnlyDashboardRoute,
  resolveDashboardActiveTab,
  resolveDashboardHeaderConfig,
  resolveDashboardRouteKey,
} from "@/feature/dashboard/shell/viewModel/dashboardShell.shared";

describe("dashboardShell.shared", () => {
  it("resolves dashboard route keys from route segments", () => {
    expect(resolveDashboardRouteKey(["(dashboard)", "business"])).toBe("business");
    expect(resolveDashboardRouteKey(["(dashboard)", "profile"])).toBe("profile");
    expect(resolveDashboardRouteKey(["(dashboard)", "unknown"])).toBeNull();
  });

  it("maps header and active tab configuration", () => {
    const businessHeader = resolveDashboardHeaderConfig("business");
    expect(businessHeader.title).toBe("My Business");
    expect(businessHeader.showProfile).toBe(true);
    expect(resolveDashboardActiveTab("business")).toBe(DashboardTab.Home);
    expect(resolveDashboardActiveTab("personal-budget")).toBe(DashboardTab.Budget);
  });

  it("applies account-type route guards", () => {
    expect(isDashboardRouteAllowed("ledger", AccountType.Business)).toBe(true);
    expect(isDashboardRouteAllowed("ledger", AccountType.Personal)).toBe(false);
    expect(isDashboardRouteAllowed("personal-transactions", AccountType.Personal)).toBe(
      true,
    );
    expect(isDashboardRouteAllowed("personal-transactions", AccountType.Business)).toBe(
      false,
    );
    expect(isDashboardRouteAllowed("profile", AccountType.Business)).toBe(true);
  });

  it("marks slot-only routes correctly", () => {
    expect(isSlotOnlyDashboardRoute("profile")).toBe(true);
    expect(isSlotOnlyDashboardRoute("business-details")).toBe(true);
    expect(isSlotOnlyDashboardRoute("business")).toBe(false);
  });
});
