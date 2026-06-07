import { createCreateBusinessWorkspaceUseCase } from "@/feature/profile/business/useCase/createBusinessWorkspace.useCase.impl";
import { describe, expect, it, vi } from "vitest";
import { createBusinessFlowE2eHarness } from "@/tests/helpers/businessFlowE2e.helper";

vi.mock("expo-crypto", () => ({
  randomUUID: () => "business-account-1",
}));

describe("businessSetup.e2e", () => {
  it("creates a normalized business workspace end to end through the local account and business profile stack", async () => {
    const harness = createBusinessFlowE2eHarness();
    const useCase = createCreateBusinessWorkspaceUseCase({
      saveAccountUseCase: harness.useCases.saveAccountUseCase,
      saveBusinessProfileUseCase: harness.useCases.saveBusinessProfileUseCase,
    });

    const result = await useCase.execute({
      ownerUserRemoteId: "  owner-1  ",
      legalBusinessName: "  Trendpal Traders  ",
      businessType: "Retail Store",
      businessLogoUrl: "  https://cdn.test/logo.png  ",
      businessPhone: "  +977 9800000000  ",
      businessEmail: "  HELLO@TRENDPAL.TEST  ",
      registeredAddress: "  Kathmandu-1, Bagmati  ",
      currencyCode: " npr ",
      country: " Nepal ",
      city: " Kathmandu ",
      stateOrDistrict: " Bagmati ",
      taxRegistrationId: " 123456789 ",
    });

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.value.account).toEqual(
      expect.objectContaining({
        remoteId: "business-account-1",
        ownerUserRemoteId: "owner-1",
        displayName: "Trendpal Traders",
        currencyCode: "NPR",
        countryCode: "Nepal",
        cityOrLocation: "Kathmandu, Bagmati",
        isActive: true,
        isDefault: false,
      }),
    );

    expect(result.value.businessProfile).toEqual(
      expect.objectContaining({
        accountRemoteId: "business-account-1",
        ownerUserRemoteId: "owner-1",
        legalBusinessName: "Trendpal Traders",
        businessEmail: "hello@trendpal.test",
        businessPhone: "+977 9800000000",
        registeredAddress: "Kathmandu-1, Bagmati",
        currencyCode: "NPR",
        country: "Nepal",
        city: "Kathmandu",
        stateOrDistrict: "Bagmati",
        taxRegistrationId: "123456789",
        businessLogoUrl: "https://cdn.test/logo.png",
      }),
    );

    const persistedAccount = await harness.repositories.accountRepository.getAccountByRemoteId(
      "business-account-1",
    );
    const persistedProfile =
      await harness.useCases.getBusinessProfileByAccountRemoteIdUseCase.execute(
        "business-account-1",
      );

    expect(persistedAccount.success).toBe(true);
    expect(persistedProfile.success).toBe(true);

    if (persistedAccount.success) {
      expect(persistedAccount.value.displayName).toBe("Trendpal Traders");
      expect(persistedAccount.value.countryCode).toBe("Nepal");
    }

    if (persistedProfile.success) {
      expect(persistedProfile.value.businessEmail).toBe("hello@trendpal.test");
      expect(persistedProfile.value.taxRegistrationId).toBe("123456789");
    }

    expect(harness.snapshotTable("accounts")).toHaveLength(1);
    expect(harness.snapshotTable("business_profiles")).toHaveLength(1);
  });
});
