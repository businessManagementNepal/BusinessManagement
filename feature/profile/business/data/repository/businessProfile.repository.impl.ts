import {
  BusinessProfileDatabaseError,
  BusinessProfileError,
  BusinessProfileErrorType,
  BusinessProfileNotFoundError,
  BusinessProfileUnknownError,
  BusinessProfileValidationError,
  SaveBusinessProfilePayload,
} from "@/feature/profile/business/types/businessProfile.types";
import { BusinessProfileDatasource } from "../dataSource/businessProfile.datasource";
import { BusinessProfileRepository } from "./businessProfile.repository";
import { mapBusinessProfileModelToDomain } from "./mapper/businessProfile.mapper";

const mapDatasourceError = (error: Error): BusinessProfileError => {
  const normalizedMessage = error.message.trim();
  const normalizedMessageLower = normalizedMessage.toLowerCase();

  if (normalizedMessageLower.includes("not found")) {
    return BusinessProfileNotFoundError;
  }

  if (normalizedMessageLower.includes("required")) {
    return BusinessProfileValidationError(normalizedMessage);
  }

  if (
    normalizedMessageLower.includes("database") ||
    normalizedMessageLower.includes("schema") ||
    normalizedMessageLower.includes("table") ||
    normalizedMessageLower.includes("adapter")
  ) {
    return BusinessProfileDatabaseError;
  }

  return {
    ...BusinessProfileUnknownError,
    message: normalizedMessage || BusinessProfileUnknownError.message,
    type: BusinessProfileErrorType.UnknownError,
  };
};

export const createBusinessProfileRepository = (
  datasource: BusinessProfileDatasource,
): BusinessProfileRepository => ({
  async saveBusinessProfile(payload: SaveBusinessProfilePayload) {
    const result = await datasource.saveBusinessProfile(payload);

    if (!result.success) {
      return {
        success: false,
        error: mapDatasourceError(result.error),
      };
    }

    return {
      success: true,
      value: mapBusinessProfileModelToDomain(result.value),
    };
  },

  async getBusinessProfileByAccountRemoteId(accountRemoteId: string) {
    const result = await datasource.getBusinessProfileByAccountRemoteId(
      accountRemoteId,
    );

    if (!result.success) {
      return {
        success: false,
        error: mapDatasourceError(result.error),
      };
    }

    return {
      success: true,
      value: mapBusinessProfileModelToDomain(result.value),
    };
  },

  async getBusinessProfilesByOwnerUserRemoteId(ownerUserRemoteId: string) {
    const result = await datasource.getBusinessProfilesByOwnerUserRemoteId(
      ownerUserRemoteId,
    );

    if (!result.success) {
      return {
        success: false,
        error: mapDatasourceError(result.error),
      };
    }

    return {
      success: true,
      value: result.value.map(mapBusinessProfileModelToDomain),
    };
  },
});
