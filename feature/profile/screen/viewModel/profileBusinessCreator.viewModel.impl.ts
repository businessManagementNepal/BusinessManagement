import { AccountType } from "@/feature/auth/accountSelection/types/accountSelection.types";
import {
  BusinessProfileFieldErrors,
  BusinessProfileFieldName,
} from "@/feature/profile/business/types/businessProfile.types";
import {
  getFirstBusinessProfileFieldErrorMessage,
  validateBusinessProfileFields,
} from "@/feature/profile/business/validation/validateBusinessProfileFields";
import { EditableBusinessProfile } from "@/feature/profile/screen/types/profileScreen.types";
import { createDefaultBusinessProfileForm } from "@/feature/profile/screen/viewModel/profileScreen.shared";
import { useCallback, useState } from "react";
import {
  ProfileBusinessCreatorViewModel,
  UseProfileBusinessCreatorViewModelParams,
} from "./profileBusinessCreator.viewModel";

const clearCreateBusinessFieldError = (
  fieldErrors: BusinessProfileFieldErrors,
  field: BusinessProfileFieldName,
): BusinessProfileFieldErrors => {
  if (!fieldErrors[field]) {
    return fieldErrors;
  }

  return {
    ...fieldErrors,
    [field]: undefined,
  };
};

const resolveBusinessFieldName = (
  field: keyof EditableBusinessProfile,
): BusinessProfileFieldName | null => {
  switch (field) {
    case "legalBusinessName":
      return "legalBusinessName";
    case "businessType":
      return "businessType";
    case "businessPhone":
      return "businessPhone";
    case "businessEmail":
      return "businessEmail";
    case "registeredAddress":
      return "registeredAddress";
    case "currencyCode":
      return "currencyCode";
    case "country":
      return "country";
    default:
      return null;
  }
};

export const useProfileBusinessCreatorViewModel = (
  params: UseProfileBusinessCreatorViewModelParams,
): ProfileBusinessCreatorViewModel => {
  const {
    setActiveAccountSession,
    activeUserRemoteId,
    createBusinessWorkspaceUseCase,
    onNavigateHome,
    onUpdateData,
    setLoadError,
    setSuccessMessage,
  } = params;

  const [createBusinessProfileForm, setCreateBusinessProfileForm] =
    useState<EditableBusinessProfile>(createDefaultBusinessProfileForm());
  const [createBusinessProfileFieldErrors, setCreateBusinessProfileFieldErrors] =
    useState<BusinessProfileFieldErrors>({});
  const [isCreateBusinessExpanded, setIsCreateBusinessExpanded] =
    useState(false);
  const [isCreatingBusinessProfile, setIsCreatingBusinessProfile] =
    useState(false);

  const onToggleCreateBusinessExpanded = useCallback(() => {
    setIsCreateBusinessExpanded((previousValue) => !previousValue);
    setCreateBusinessProfileFieldErrors({});
    setLoadError(null);
    setSuccessMessage(null);
  }, [setLoadError, setSuccessMessage]);

  const onUpdateCreateBusinessProfileField = useCallback(
    (field: keyof EditableBusinessProfile, value: string) => {
      setCreateBusinessProfileForm((previousValue) => ({
        ...previousValue,
        [field]: value,
      }));

      const businessFieldName = resolveBusinessFieldName(field);
      if (businessFieldName) {
        setCreateBusinessProfileFieldErrors((previousFieldErrors) =>
          clearCreateBusinessFieldError(previousFieldErrors, businessFieldName),
        );
      }

      setLoadError(null);
      setSuccessMessage(null);
    },
    [setLoadError, setSuccessMessage],
  );

  const onCreateBusinessProfile = useCallback(async (): Promise<void> => {
    setLoadError(null);
    setSuccessMessage(null);

    const fieldErrors = validateBusinessProfileFields({
      legalBusinessName: createBusinessProfileForm.legalBusinessName,
      businessType: createBusinessProfileForm.businessType,
      businessPhone: createBusinessProfileForm.businessPhone,
      businessEmail: createBusinessProfileForm.businessEmail,
      registeredAddress: createBusinessProfileForm.registeredAddress,
      currencyCode: createBusinessProfileForm.currencyCode,
      country: createBusinessProfileForm.country,
    });

    if (Object.values(fieldErrors).some(Boolean)) {
      setCreateBusinessProfileFieldErrors(fieldErrors);
      return;
    }

    setCreateBusinessProfileFieldErrors({});

    if (!activeUserRemoteId) {
      setLoadError("Active user session not found.");
      return;
    }

    setIsCreatingBusinessProfile(true);

    try {
      const createResult = await createBusinessWorkspaceUseCase.execute({
        ownerUserRemoteId: activeUserRemoteId,
        legalBusinessName: createBusinessProfileForm.legalBusinessName,
        businessType: createBusinessProfileForm.businessType,
        businessLogoUrl:
          createBusinessProfileForm.businessLogoUrl.trim() || null,
        businessPhone: createBusinessProfileForm.businessPhone,
        businessEmail: createBusinessProfileForm.businessEmail,
        registeredAddress: createBusinessProfileForm.registeredAddress,
        currencyCode: createBusinessProfileForm.currencyCode,
        country: createBusinessProfileForm.country,
        city: createBusinessProfileForm.city,
        stateOrDistrict: createBusinessProfileForm.stateOrDistrict,
        taxRegistrationId: createBusinessProfileForm.taxRegistrationId,
      });

      if (!createResult.success) {
        const firstFieldErrorMessage =
          getFirstBusinessProfileFieldErrorMessage(
            validateBusinessProfileFields({
              legalBusinessName: createBusinessProfileForm.legalBusinessName,
              businessType: createBusinessProfileForm.businessType,
              businessPhone: createBusinessProfileForm.businessPhone,
              businessEmail: createBusinessProfileForm.businessEmail,
              registeredAddress: createBusinessProfileForm.registeredAddress,
              currencyCode: createBusinessProfileForm.currencyCode,
              country: createBusinessProfileForm.country,
            }),
          );

        if (
          firstFieldErrorMessage &&
          createResult.error.message === firstFieldErrorMessage
        ) {
          setCreateBusinessProfileFieldErrors(
            validateBusinessProfileFields({
              legalBusinessName: createBusinessProfileForm.legalBusinessName,
              businessType: createBusinessProfileForm.businessType,
              businessPhone: createBusinessProfileForm.businessPhone,
              businessEmail: createBusinessProfileForm.businessEmail,
              registeredAddress: createBusinessProfileForm.registeredAddress,
              currencyCode: createBusinessProfileForm.currencyCode,
              country: createBusinessProfileForm.country,
            }),
          );
        } else {
          setLoadError(createResult.error.message);
        }
        return;
      }

      await setActiveAccountSession(createResult.value.account.remoteId);

      onUpdateData((previousData) => ({
        ...previousData,
        accountOptions: [
          ...previousData.accountOptions,
          {
            remoteId: createResult.value.account.remoteId,
            ownerUserRemoteId: createResult.value.account.ownerUserRemoteId,
            createdAt: createResult.value.account.createdAt,
            displayName: createResult.value.account.displayName,
            accountType: createResult.value.account.accountType,
            businessType: createResult.value.account.businessType,
            cityOrLocation: createResult.value.account.cityOrLocation,
            countryCode: createResult.value.account.countryCode,
            currencyCode: createResult.value.account.currencyCode,
            isDefault: createResult.value.account.isDefault,
          },
        ],
        activeAccountRemoteId: createResult.value.account.remoteId,
        activeAccountType: createResult.value.account.accountType,
        isActiveAccountOwner: true,
        activeAccountDisplayName: createResult.value.account.displayName,
        activeBusinessEstablishedYear: String(
          new Date(createResult.value.businessProfile.createdAt).getFullYear(),
        ),
        activeAccountRoleLabel: "Owner",
        grantedPermissionCodes: [],
        activeBusinessProfile: {
          legalBusinessName:
            createResult.value.businessProfile.legalBusinessName,
          businessType: createResult.value.businessProfile.businessType,
          businessLogoUrl:
            createResult.value.businessProfile.businessLogoUrl ?? "",
          businessPhone: createResult.value.businessProfile.businessPhone,
          businessEmail: createResult.value.businessProfile.businessEmail,
          registeredAddress:
            createResult.value.businessProfile.registeredAddress,
          currencyCode: createResult.value.businessProfile.currencyCode,
          country: createResult.value.businessProfile.country,
          city: createResult.value.businessProfile.city,
          stateOrDistrict:
            createResult.value.businessProfile.stateOrDistrict,
          taxRegistrationId:
            createResult.value.businessProfile.taxRegistrationId,
        },
        hasActiveBusinessProfile: true,
      }));

      setCreateBusinessProfileForm(createDefaultBusinessProfileForm());
      setCreateBusinessProfileFieldErrors({});
      setIsCreateBusinessExpanded(false);
      setSuccessMessage("New business profile created.");

      onNavigateHome(AccountType.Business);
    } catch {
      setLoadError("Unable to create business profile right now.");
    } finally {
      setIsCreatingBusinessProfile(false);
    }
  }, [
    activeUserRemoteId,
    createBusinessProfileForm,
    createBusinessWorkspaceUseCase,
    onNavigateHome,
    onUpdateData,
    setActiveAccountSession,
    setLoadError,
    setSuccessMessage,
  ]);

  return {
    createBusinessProfileForm,
    createBusinessProfileFieldErrors,
    isCreateBusinessExpanded,
    isCreatingBusinessProfile,
    onToggleCreateBusinessExpanded,
    onUpdateCreateBusinessProfileField,
    onCreateBusinessProfile,
  };
};
