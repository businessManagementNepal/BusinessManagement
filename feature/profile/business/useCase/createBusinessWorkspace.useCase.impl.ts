import { AccountType } from "@/feature/auth/accountSelection/types/accountSelection.types";
import { SaveAccountUseCase } from "@/feature/auth/accountSelection/useCase/saveAccount.useCase";
import {
  BusinessProfileDatabaseError,
  BusinessProfileValidationError,
} from "@/feature/profile/business/types/businessProfile.types";
import * as Crypto from "expo-crypto";
import {
  CreateBusinessWorkspaceInput,
  CreateBusinessWorkspaceUseCase,
  CreatedBusinessWorkspaceResult,
} from "./createBusinessWorkspace.useCase";
import { SaveBusinessProfileUseCase } from "./saveBusinessProfile.useCase";
import {
  getFirstBusinessProfileFieldErrorMessage,
  validateBusinessProfileFields,
} from "@/feature/profile/business/validation/validateBusinessProfileFields";

type CreateBusinessWorkspaceUseCaseParams = {
  saveAccountUseCase: SaveAccountUseCase;
  saveBusinessProfileUseCase: SaveBusinessProfileUseCase;
};

const normalizeRequired = (value: string): string => value.trim();

const normalizeOptional = (value: string | null): string | null => {
  if (value === null) {
    return null;
  }

  const normalizedValue = value.trim();
  return normalizedValue.length > 0 ? normalizedValue : null;
};
const normalizeOptionalFromRequired = (value: string): string | null => {
  const normalizedValue = value.trim();
  return normalizedValue.length > 0 ? normalizedValue : null;
};

const buildAccountLocation = (
  city: string,
  stateOrDistrict: string,
): string | null => {
  const normalizedCity = normalizeOptionalFromRequired(city);
  const normalizedStateOrDistrict =
    normalizeOptionalFromRequired(stateOrDistrict);

  if (!normalizedCity && !normalizedStateOrDistrict) {
    return null;
  }

  if (normalizedCity && normalizedStateOrDistrict) {
    return `${normalizedCity}, ${normalizedStateOrDistrict}`;
  }

  return normalizedCity ?? normalizedStateOrDistrict;
};

export const createCreateBusinessWorkspaceUseCase = (
  params: CreateBusinessWorkspaceUseCaseParams,
): CreateBusinessWorkspaceUseCase => {
  const { saveAccountUseCase, saveBusinessProfileUseCase } = params;

  return {
    async execute(
      payload: CreateBusinessWorkspaceInput,
    ): Promise<CreatedBusinessWorkspaceResult> {
      const normalizedOwnerUserRemoteId = normalizeRequired(
        payload.ownerUserRemoteId,
      );
      const normalizedLegalBusinessName = normalizeRequired(
        payload.legalBusinessName,
      );
      const normalizedBusinessPhone = normalizeRequired(payload.businessPhone);
      const normalizedBusinessEmail = normalizeRequired(
        payload.businessEmail,
      ).toLowerCase();
      const normalizedRegisteredAddress = normalizeRequired(
        payload.registeredAddress,
      );
      const normalizedCurrencyCode = normalizeRequired(
        payload.currencyCode,
      ).toUpperCase();
      const normalizedCountry = normalizeRequired(payload.country);
      const normalizedCity = normalizeOptionalFromRequired(payload.city);
      const normalizedStateOrDistrict = normalizeOptionalFromRequired(
        payload.stateOrDistrict,
      );
      const normalizedTaxRegistrationId = normalizeRequired(
        payload.taxRegistrationId,
      );

      if (!normalizedOwnerUserRemoteId) {
        return {
          success: false,
          error: BusinessProfileValidationError(
            "Owner user remote id is required.",
          ),
        };
      }

      const fieldErrors = validateBusinessProfileFields({
        legalBusinessName: normalizedLegalBusinessName,
        businessType: payload.businessType,
        businessPhone: normalizedBusinessPhone,
        businessEmail: normalizedBusinessEmail,
        registeredAddress: normalizedRegisteredAddress,
        currencyCode: normalizedCurrencyCode,
        country: normalizedCountry,
      });

      const firstErrorMessage =
        getFirstBusinessProfileFieldErrorMessage(fieldErrors);

      if (firstErrorMessage) {
        return {
          success: false,
          error: BusinessProfileValidationError(firstErrorMessage),
        };
      }

      const accountRemoteId = Crypto.randomUUID();

      const saveAccountResult = await saveAccountUseCase.execute({
        remoteId: accountRemoteId,
        ownerUserRemoteId: normalizedOwnerUserRemoteId,
        accountType: AccountType.Business,
        businessType: payload.businessType,
        displayName: normalizedLegalBusinessName,
        currencyCode: normalizedCurrencyCode,
        cityOrLocation: buildAccountLocation(
          normalizedCity ?? "",
          normalizedStateOrDistrict ?? "",
        ),
        countryCode: normalizedCountry,
        isActive: true,
        isDefault: false,
      });

      if (!saveAccountResult.success) {
        return {
          success: false,
          error: BusinessProfileValidationError(
            saveAccountResult.error.message,
          ),
        };
      }

      const saveBusinessProfileResult =
        await saveBusinessProfileUseCase.execute({
          accountRemoteId,
          ownerUserRemoteId: normalizedOwnerUserRemoteId,
          legalBusinessName: normalizedLegalBusinessName,
          businessType: payload.businessType,
          businessLogoUrl: normalizeOptional(payload.businessLogoUrl),
          businessPhone: normalizedBusinessPhone,
          businessEmail: normalizedBusinessEmail,
          registeredAddress: normalizedRegisteredAddress,
          currencyCode: normalizedCurrencyCode,
          country: normalizedCountry,
          city: normalizedCity ?? "",
          stateOrDistrict: normalizedStateOrDistrict ?? "",
          taxRegistrationId: normalizedTaxRegistrationId,
          isActive: true,
        });

      if (!saveBusinessProfileResult.success) {
        const rollbackResult = await saveAccountUseCase.execute({
          ...saveAccountResult.value,
          isActive: false,
          isDefault: false,
        });

        if (!rollbackResult.success) {
          return {
            success: false,
            error: {
              ...BusinessProfileDatabaseError,
              message: `Business profile save failed and account rollback failed: ${rollbackResult.error.message}`,
            },
          };
        }

        return {
          success: false,
          error: saveBusinessProfileResult.error,
        };
      }

      return {
        success: true,
        value: {
          account: saveAccountResult.value,
          businessProfile: saveBusinessProfileResult.value,
        },
      };
    },
  };
};
