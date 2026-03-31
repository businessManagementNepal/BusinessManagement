import { Result } from "@/shared/types/result.types";
import { Database, Q } from "@nozbe/watermelondb";
import { RecordSyncStatus } from "@/feature/session/types/authSession.types";
import { SaveBusinessProfilePayload } from "@/feature/profile/business/types/businessProfile.types";
import { BusinessProfileDatasource } from "./businessProfile.datasource";
import { BusinessProfileModel } from "./db/businessProfile.model";

const BUSINESS_PROFILES_TABLE = "business_profiles";
const DEFAULT_TIMEZONE =
  Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kathmandu";
const DEFAULT_PHONE_POLICY = "any_e164";

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

const setCreatedAndUpdatedAt = (record: BusinessProfileModel, now: number) => {
  (record as unknown as { _raw: Record<string, number> })._raw.created_at = now;
  (record as unknown as { _raw: Record<string, number> })._raw.updated_at = now;
};

const setUpdatedAt = (record: BusinessProfileModel, now: number) => {
  (record as unknown as { _raw: Record<string, number> })._raw.updated_at = now;
};

const updateSyncStatusOnMutation = (record: BusinessProfileModel) => {
  if (!record.recordSyncStatus) {
    record.recordSyncStatus = RecordSyncStatus.PendingUpdate;
    return;
  }

  if (record.recordSyncStatus === RecordSyncStatus.Synced) {
    record.recordSyncStatus = RecordSyncStatus.PendingUpdate;
  }
};

const findByAccountRemoteId = async (
  database: Database,
  accountRemoteId: string,
): Promise<BusinessProfileModel | null> => {
  const collection = database.get<BusinessProfileModel>(BUSINESS_PROFILES_TABLE);
  const matchingProfiles = await collection
    .query(Q.where("account_remote_id", accountRemoteId.trim()))
    .fetch();

  return matchingProfiles[0] ?? null;
};

export const createLocalBusinessProfileDatasource = (
  database: Database,
): BusinessProfileDatasource => ({
  async saveBusinessProfile(
    payload: SaveBusinessProfilePayload,
  ): Promise<Result<BusinessProfileModel>> {
    try {
      const normalizedAccountRemoteId = normalizeRequired(payload.accountRemoteId);
      const normalizedOwnerUserRemoteId = normalizeRequired(
        payload.ownerUserRemoteId,
      );
      const normalizedBusinessType = normalizeRequired(payload.businessType);
      const normalizedLegalBusinessName = normalizeRequired(payload.legalBusinessName);
      const normalizedBusinessLogoUrl = normalizeOptional(payload.businessLogoUrl);
      const normalizedBusinessPhone = normalizeRequired(payload.businessPhone);
      const normalizedBusinessEmail = normalizeOptionalFromRequired(
        payload.businessEmail.toLowerCase(),
      );
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
      const normalizedTaxRegistrationId = normalizeOptionalFromRequired(
        payload.taxRegistrationId,
      );

      if (!normalizedAccountRemoteId) {
        throw new Error("Account remote id is required");
      }

      if (!normalizedOwnerUserRemoteId) {
        throw new Error("Owner user remote id is required");
      }

      if (!normalizedBusinessType) {
        throw new Error("Business type is required");
      }

      if (!normalizedLegalBusinessName) {
        throw new Error("Legal business name is required");
      }

      if (!normalizedBusinessPhone) {
        throw new Error("Business phone is required");
      }

      if (!normalizedRegisteredAddress) {
        throw new Error("Registered address is required");
      }

      if (!normalizedCurrencyCode) {
        throw new Error("Currency is required");
      }

      if (!normalizedCountry) {
        throw new Error("Country is required");
      }

      const existingProfile = await findByAccountRemoteId(
        database,
        normalizedAccountRemoteId,
      );

      if (existingProfile) {
        await database.write(async () => {
          await existingProfile.update((record) => {
            record.accountRemoteId = normalizedAccountRemoteId;
            record.ownerUserRemoteId = normalizedOwnerUserRemoteId;
            record.businessType =
              normalizedBusinessType as SaveBusinessProfilePayload["businessType"];
            record.businessName = normalizedLegalBusinessName;
            record.businessLogoUrl = normalizedBusinessLogoUrl;
            record.businessPhone = normalizedBusinessPhone;
            record.businessEmail = normalizedBusinessEmail;
            record.registeredAddress = normalizedRegisteredAddress;
            record.country = normalizedCountry;
            record.city = normalizedCity;
            record.stateOrDistrict = normalizedStateOrDistrict;
            record.taxRegistrationId = normalizedTaxRegistrationId;
            record.countryCode = normalizedCountry;
            record.currencyCode = normalizedCurrencyCode;
            record.timezone = record.timezone?.trim() || DEFAULT_TIMEZONE;
            record.phonePolicy = record.phonePolicy?.trim() || DEFAULT_PHONE_POLICY;
            record.isActive = payload.isActive;
            updateSyncStatusOnMutation(record);
            setUpdatedAt(record, Date.now());
          });
        });

        return { success: true, value: existingProfile };
      }

      const profilesCollection = database.get<BusinessProfileModel>(
        BUSINESS_PROFILES_TABLE,
      );
      let createdProfile!: BusinessProfileModel;

      await database.write(async () => {
        createdProfile = await profilesCollection.create((record) => {
          const now = Date.now();

          record.accountRemoteId = normalizedAccountRemoteId;
          record.ownerUserRemoteId = normalizedOwnerUserRemoteId;
          record.businessType =
            normalizedBusinessType as SaveBusinessProfilePayload["businessType"];
          record.businessName = normalizedLegalBusinessName;
          record.businessLogoUrl = normalizedBusinessLogoUrl;
          record.businessPhone = normalizedBusinessPhone;
          record.businessEmail = normalizedBusinessEmail;
          record.registeredAddress = normalizedRegisteredAddress;
          record.country = normalizedCountry;
          record.city = normalizedCity;
          record.stateOrDistrict = normalizedStateOrDistrict;
          record.taxRegistrationId = normalizedTaxRegistrationId;
          record.countryCode = normalizedCountry;
          record.currencyCode = normalizedCurrencyCode;
          record.timezone = DEFAULT_TIMEZONE;
          record.phonePolicy = DEFAULT_PHONE_POLICY;
          record.isActive = payload.isActive;

          record.recordSyncStatus = RecordSyncStatus.PendingCreate;
          record.lastSyncedAt = null;
          record.deletedAt = null;

          setCreatedAndUpdatedAt(record, now);
        });
      });

      return { success: true, value: createdProfile };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async getBusinessProfileByAccountRemoteId(
    accountRemoteId: string,
  ): Promise<Result<BusinessProfileModel>> {
    try {
      const normalizedAccountRemoteId = normalizeRequired(accountRemoteId);

      if (!normalizedAccountRemoteId) {
        throw new Error("Account remote id is required");
      }

      const matchingProfile = await findByAccountRemoteId(
        database,
        normalizedAccountRemoteId,
      );

      if (!matchingProfile) {
        throw new Error("Business profile not found");
      }

      return { success: true, value: matchingProfile };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async getBusinessProfilesByOwnerUserRemoteId(
    ownerUserRemoteId: string,
  ): Promise<Result<BusinessProfileModel[]>> {
    try {
      const normalizedOwnerUserRemoteId = normalizeRequired(ownerUserRemoteId);

      if (!normalizedOwnerUserRemoteId) {
        throw new Error("Owner user remote id is required");
      }

      const profilesCollection = database.get<BusinessProfileModel>(
        BUSINESS_PROFILES_TABLE,
      );

      const profiles = await profilesCollection
        .query(
          Q.where("owner_user_remote_id", normalizedOwnerUserRemoteId),
          Q.where("is_active", true),
          Q.sortBy("updated_at", Q.desc),
        )
        .fetch();

      return { success: true, value: profiles };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },
});
