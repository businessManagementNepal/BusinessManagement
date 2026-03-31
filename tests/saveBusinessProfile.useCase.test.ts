import { describe, expect, it, vi } from "vitest";
import { createSaveBusinessProfileUseCase } from "@/feature/profile/business/useCase/saveBusinessProfile.useCase.impl";
import { BusinessProfileRepository } from "@/feature/profile/business/data/repository/businessProfile.repository";
import {
  BusinessProfileErrorType,
  SaveBusinessProfilePayload,
} from "@/feature/profile/business/types/businessProfile.types";

const createPayload = (
  overrides: Partial<SaveBusinessProfilePayload> = {},
): SaveBusinessProfilePayload => ({
  accountRemoteId: "account-1",
  ownerUserRemoteId: "user-1",
  legalBusinessName: "Acme Traders",
  businessType: "Retail Store",
  businessLogoUrl: "https://example.com/logo.png",
  businessPhone: "+977-9800000000",
  businessEmail: "owner@acme.com",
  registeredAddress: "Putalisadak-10",
  currencyCode: "NPR",
  country: "Nepal",
  city: "Kathmandu",
  stateOrDistrict: "Bagmati",
  taxRegistrationId: "PAN-123456789",
  isActive: true,
  ...overrides,
});

describe("saveBusinessProfile.useCase", () => {
  it("normalizes payload and delegates valid save", async () => {
    const saveBusinessProfileMock = vi.fn(async (payload: SaveBusinessProfilePayload) => ({
      success: true as const,
      value: {
        ...payload,
        businessLogoUrl: payload.businessLogoUrl,
        createdAt: 1,
        updatedAt: 1,
      },
    }));

    const repository: BusinessProfileRepository = {
      saveBusinessProfile: saveBusinessProfileMock,
      getBusinessProfileByAccountRemoteId: vi.fn(async () => {
        throw new Error("getBusinessProfileByAccountRemoteId should not be called");
      }),
      getBusinessProfilesByOwnerUserRemoteId: vi.fn(async () => {
        throw new Error(
          "getBusinessProfilesByOwnerUserRemoteId should not be called",
        );
      }),
    };

    const useCase = createSaveBusinessProfileUseCase(repository);
    const result = await useCase.execute(
      createPayload({
        legalBusinessName: "  Acme Traders  ",
        businessEmail: "  OWNER@ACME.COM ",
        currencyCode: " npr ",
      }),
    );

    expect(result.success).toBe(true);
    expect(saveBusinessProfileMock).toHaveBeenCalledTimes(1);
    expect(saveBusinessProfileMock.mock.calls[0]?.[0]).toMatchObject({
      legalBusinessName: "Acme Traders",
      businessEmail: "owner@acme.com",
      currencyCode: "NPR",
    });
  });

  it("rejects invalid email", async () => {
    const repository: BusinessProfileRepository = {
      saveBusinessProfile: vi.fn(async () => {
        throw new Error("saveBusinessProfile should not be called");
      }),
      getBusinessProfileByAccountRemoteId: vi.fn(async () => {
        throw new Error("getBusinessProfileByAccountRemoteId should not be called");
      }),
      getBusinessProfilesByOwnerUserRemoteId: vi.fn(async () => {
        throw new Error(
          "getBusinessProfilesByOwnerUserRemoteId should not be called",
        );
      }),
    };

    const useCase = createSaveBusinessProfileUseCase(repository);
    const result = await useCase.execute(
      createPayload({ businessEmail: "invalid-email" }),
    );

    expect(result.success).toBe(false);

    if (result.success) {
      return;
    }

    expect(result.error.type).toBe(BusinessProfileErrorType.ValidationError);
    expect(result.error.message).toContain("email is invalid");
  });

  it("accepts missing optional location and tax fields", async () => {
    const saveBusinessProfileMock = vi.fn(async (payload: SaveBusinessProfilePayload) => ({
      success: true as const,
      value: {
        ...payload,
        createdAt: 1,
        updatedAt: 1,
      },
    }));

    const repository: BusinessProfileRepository = {
      saveBusinessProfile: saveBusinessProfileMock,
      getBusinessProfileByAccountRemoteId: vi.fn(async () => {
        throw new Error("getBusinessProfileByAccountRemoteId should not be called");
      }),
      getBusinessProfilesByOwnerUserRemoteId: vi.fn(async () => {
        throw new Error(
          "getBusinessProfilesByOwnerUserRemoteId should not be called",
        );
      }),
    };

    const useCase = createSaveBusinessProfileUseCase(repository);
    const result = await useCase.execute(
      createPayload({
        businessEmail: "   ",
        city: "   ",
        stateOrDistrict: "   ",
        taxRegistrationId: "   ",
      }),
    );

    expect(result.success).toBe(true);
    expect(saveBusinessProfileMock).toHaveBeenCalledTimes(1);
    expect(saveBusinessProfileMock.mock.calls[0]?.[0]).toMatchObject({
      businessEmail: "",
      city: "",
      stateOrDistrict: "",
      taxRegistrationId: "",
    });
  });
});
