import { describe, expect, it, vi } from "vitest";
import {
  Account,
  AccountType,
  SaveAccountPayload,
} from "@/feature/auth/accountSelection/types/accountSelection.types";
import { SaveAccountUseCase } from "@/feature/auth/accountSelection/useCase/saveAccount.useCase";
import {
  BusinessProfile,
  SaveBusinessProfilePayload,
} from "@/feature/profile/business/types/businessProfile.types";
import { SaveBusinessProfileUseCase } from "@/feature/profile/business/useCase/saveBusinessProfile.useCase";
import { createCreateBusinessWorkspaceUseCase } from "@/feature/profile/business/useCase/createBusinessWorkspace.useCase.impl";

vi.mock("expo-crypto", () => ({
  randomUUID: () => "mocked-uuid",
}));

const buildAccount = (payload: SaveAccountPayload): Account => ({
  ...payload,
  createdAt: 1,
  updatedAt: 1,
});

const buildBusinessProfile = (
  payload: SaveBusinessProfilePayload,
): BusinessProfile => ({
  ...payload,
  createdAt: 1,
  updatedAt: 1,
});

describe("createBusinessWorkspace.useCase", () => {
  it("rejects invalid business phone before account creation", async () => {
    const saveAccountExecute = vi.fn<
      (payload: SaveAccountPayload) => ReturnType<SaveAccountUseCase["execute"]>
    >(async (payload) => ({
      success: true as const,
      value: buildAccount(payload),
    }));

    const saveBusinessProfileExecute = vi.fn<
      (payload: SaveBusinessProfilePayload) => ReturnType<SaveBusinessProfileUseCase["execute"]>
    >(async (payload) => ({
      success: true as const,
      value: buildBusinessProfile(payload),
    }));

    const saveAccountUseCase: SaveAccountUseCase = {
      execute: saveAccountExecute,
    };
    const saveBusinessProfileUseCase: SaveBusinessProfileUseCase = {
      execute: saveBusinessProfileExecute,
    };

    const useCase = createCreateBusinessWorkspaceUseCase({
      saveAccountUseCase,
      saveBusinessProfileUseCase,
    });

    const result = await useCase.execute({
      ownerUserRemoteId: "user-1",
      legalBusinessName: "Trendpal",
      businessType: "Retail Store",
      businessLogoUrl: null,
      businessPhone: "abc",
      businessEmail: "",
      registeredAddress: "Kathmandu-1",
      currencyCode: "NPR",
      country: "Nepal",
      city: "Kathmandu",
      stateOrDistrict: "",
      taxRegistrationId: "",
    });

    expect(result.success).toBe(false);
    expect(saveAccountExecute).not.toHaveBeenCalled();
    expect(saveBusinessProfileExecute).not.toHaveBeenCalled();

    if (!result.success) {
      expect(result.error.message).toBe("Business phone is invalid.");
    }
  });

  it("normalizes trimmed values before creating account and profile", async () => {
    const saveAccountExecute = vi.fn<
      (payload: SaveAccountPayload) => ReturnType<SaveAccountUseCase["execute"]>
    >(async (payload) => ({
      success: true as const,
      value: buildAccount(payload),
    }));

    const saveBusinessProfileExecute = vi.fn<
      (payload: SaveBusinessProfilePayload) => ReturnType<SaveBusinessProfileUseCase["execute"]>
    >(async (payload) => ({
      success: true as const,
      value: buildBusinessProfile(payload),
    }));

    const saveAccountUseCase: SaveAccountUseCase = {
      execute: saveAccountExecute,
    };
    const saveBusinessProfileUseCase: SaveBusinessProfileUseCase = {
      execute: saveBusinessProfileExecute,
    };

    const useCase = createCreateBusinessWorkspaceUseCase({
      saveAccountUseCase,
      saveBusinessProfileUseCase,
    });

    const result = await useCase.execute({
      ownerUserRemoteId: "  user-1  ",
      legalBusinessName: "  Trendpal  ",
      businessType: "Retail Store",
      businessLogoUrl: "  https://example.com/logo.png  ",
      businessPhone: "  +977 9812345678  ",
      businessEmail: "  HELLO@TRENDPAL.COM  ",
      registeredAddress: "  Kathmandu-1, Bagmati  ",
      currencyCode: " npr ",
      country: " Nepal ",
      city: " Kathmandu ",
      stateOrDistrict: " Bagmati ",
      taxRegistrationId: " 123456 ",
    });

    expect(result.success).toBe(true);

    expect(saveAccountExecute).toHaveBeenCalledWith(
      expect.objectContaining({
        ownerUserRemoteId: "user-1",
        accountType: AccountType.Business,
        displayName: "Trendpal",
        currencyCode: "NPR",
        countryCode: "Nepal",
        cityOrLocation: "Kathmandu, Bagmati",
      }),
    );

    expect(saveBusinessProfileExecute).toHaveBeenCalledWith(
      expect.objectContaining({
        ownerUserRemoteId: "user-1",
        legalBusinessName: "Trendpal",
        businessPhone: "+977 9812345678",
        businessEmail: "hello@trendpal.com",
        registeredAddress: "Kathmandu-1, Bagmati",
        currencyCode: "NPR",
        country: "Nepal",
        city: "Kathmandu",
        stateOrDistrict: "Bagmati",
        taxRegistrationId: "123456",
        businessLogoUrl: "https://example.com/logo.png",
      }),
    );
  });
});
