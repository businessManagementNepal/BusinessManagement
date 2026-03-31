import { describe, expect, it } from "vitest";
import { AccountType } from "@/feature/setting/accounts/accountSelection/types/accountSelection.types";
import { resolveEntryRoute } from "@/feature/session/ui/entryRouteDecision.util";

describe("entryRouteDecision.util", () => {
  it("returns null while loading", () => {
    expect(
      resolveEntryRoute({
        isLoading: true,
        hasActiveSession: false,
        hasActiveAccount: false,
        activeAccountType: null,
      }),
    ).toBeNull();
  });

  it("routes unauthenticated users to login", () => {
    expect(
      resolveEntryRoute({
        isLoading: false,
        hasActiveSession: false,
        hasActiveAccount: false,
        activeAccountType: null,
      }),
    ).toBe("/(auth)/login");
  });

  it("routes authenticated users without account to account setup", () => {
    expect(
      resolveEntryRoute({
        isLoading: false,
        hasActiveSession: true,
        hasActiveAccount: false,
        activeAccountType: null,
      }),
    ).toBe("/(account-setup)/select-account");
  });

  it("routes to account-specific home", () => {
    expect(
      resolveEntryRoute({
        isLoading: false,
        hasActiveSession: true,
        hasActiveAccount: true,
        activeAccountType: AccountType.Business,
      }),
    ).toBe("/(dashboard)/business");

    expect(
      resolveEntryRoute({
        isLoading: false,
        hasActiveSession: true,
        hasActiveAccount: true,
        activeAccountType: AccountType.Personal,
      }),
    ).toBe("/(dashboard)/personal");
  });
});
