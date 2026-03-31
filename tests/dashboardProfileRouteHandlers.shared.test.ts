import { describe, expect, it, vi } from "vitest";
import { AccountType } from "@/feature/setting/accounts/accountSelection/types/accountSelection.types";
import { createDashboardProfileRouteHandlers } from "@/feature/profile/screen/factory/dashboardProfileRouteHandlers.shared";

describe("dashboardProfileRouteHandlers.shared", () => {
  it("navigates to account-specific home and fixed profile routes", () => {
    const replaceCalls: string[] = [];
    const pushCalls: string[] = [];

    const handlers = createDashboardProfileRouteHandlers({
      activeUserRemoteId: "user-1",
      activeAccountRemoteId: "acct-1",
      activeAccountType: AccountType.Business,
      navigateReplace: (targetPath) => replaceCalls.push(targetPath),
      navigatePush: (targetPath) => pushCalls.push(targetPath),
      clearUserSession: async () => {},
      refreshSession: async () => {},
    });

    handlers.onNavigateHome(AccountType.Personal);
    handlers.onBackToHome();
    handlers.onBackToProfile();
    handlers.onOpenBusinessDetails();

    expect(replaceCalls).toEqual([
      "/(dashboard)/personal",
      "/(dashboard)/business",
      "/(dashboard)/profile",
    ]);
    expect(pushCalls).toEqual(["/(dashboard)/business-details"]);
  });

  it("falls back to personal home when active account type is missing", () => {
    const replace = vi.fn();

    const handlers = createDashboardProfileRouteHandlers({
      activeUserRemoteId: "user-1",
      activeAccountRemoteId: "acct-1",
      activeAccountType: null,
      navigateReplace: replace,
      navigatePush: vi.fn(),
      clearUserSession: async () => {},
      refreshSession: async () => {},
    });

    handlers.onBackToHome();
    expect(replace).toHaveBeenCalledWith("/(dashboard)/personal");
  });

  it("runs logout flow in order", async () => {
    const calls: string[] = [];

    const handlers = createDashboardProfileRouteHandlers({
      activeUserRemoteId: "user-1",
      activeAccountRemoteId: "acct-1",
      activeAccountType: AccountType.Personal,
      navigateReplace: vi.fn(),
      navigatePush: vi.fn(),
      clearUserSession: async () => {
        calls.push("clear");
      },
      refreshSession: async () => {
        calls.push("refresh");
      },
    });

    await handlers.onLogout();
    expect(calls).toEqual(["clear", "refresh"]);
  });

  it("captures logout errors without throwing", async () => {
    const onLogoutError = vi.fn();

    const handlers = createDashboardProfileRouteHandlers({
      activeUserRemoteId: "user-1",
      activeAccountRemoteId: "acct-1",
      activeAccountType: AccountType.Personal,
      navigateReplace: vi.fn(),
      navigatePush: vi.fn(),
      clearUserSession: async () => {
        throw new Error("clear-failed");
      },
      refreshSession: async () => {},
      onLogoutError,
    });

    await expect(handlers.onLogout()).resolves.toBeUndefined();
    expect(onLogoutError).toHaveBeenCalledTimes(1);
  });
});
