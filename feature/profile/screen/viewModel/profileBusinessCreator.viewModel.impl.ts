import { useCallback, useState } from "react";
import {
  AccountType,
} from "@/feature/setting/accounts/accountSelection/types/accountSelection.types";
import {
  EditableBusinessProfile,
} from "@/feature/profile/screen/types/profileScreen.types";
import { createDefaultBusinessProfileForm } from "@/feature/profile/screen/viewModel/profileScreen.shared";
import {
  ProfileBusinessCreatorViewModel,
  UseProfileBusinessCreatorViewModelParams,
} from "./profileBusinessCreator.viewModel";

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
  const [isCreateBusinessExpanded, setIsCreateBusinessExpanded] =
    useState(false);
  const [isCreatingBusinessProfile, setIsCreatingBusinessProfile] =
    useState(false);

  const onToggleCreateBusinessExpanded = useCallback(() => {
    setIsCreateBusinessExpanded((previousValue) => !previousValue);
    setLoadError(undefined);
    setSuccessMessage(undefined);
  }, [setLoadError, setSuccessMessage]);

  const onUpdateCreateBusinessProfileField = useCallback(
    (field: keyof EditableBusinessProfile, value: string) => {
      setCreateBusinessProfileForm((previousValue) => ({
        ...previousValue,
        [field]: value,
      }));
      setLoadError(undefined);
      setSuccessMessage(undefined);
    },
    [setLoadError, setSuccessMessage],
  );

  const onCreateBusinessProfile = useCallback(async (): Promise<void> => {
    setLoadError(undefined);
    setSuccessMessage(undefined);

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
        businessLogoUrl: createBusinessProfileForm.businessLogoUrl.trim() || null,
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
        setLoadError(createResult.error.message);
        return;
      }

      await setActiveAccountSession(createResult.value.account.remoteId);

      onUpdateData((previousData) => ({
        ...previousData,
        accountOptions: [
          ...previousData.accountOptions,
          {
            remoteId: createResult.value.account.remoteId,
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
        activeAccountDisplayName: createResult.value.account.displayName,
        activeBusinessProfile: {
          legalBusinessName: createResult.value.businessProfile.legalBusinessName,
          businessType: createResult.value.businessProfile.businessType,
          businessLogoUrl: createResult.value.businessProfile.businessLogoUrl ?? "",
          businessPhone: createResult.value.businessProfile.businessPhone,
          businessEmail: createResult.value.businessProfile.businessEmail,
          registeredAddress: createResult.value.businessProfile.registeredAddress,
          currencyCode: createResult.value.businessProfile.currencyCode,
          country: createResult.value.businessProfile.country,
          city: createResult.value.businessProfile.city,
          stateOrDistrict: createResult.value.businessProfile.stateOrDistrict,
          taxRegistrationId: createResult.value.businessProfile.taxRegistrationId,
        },
        hasActiveBusinessProfile: true,
      }));

      setCreateBusinessProfileForm(createDefaultBusinessProfileForm());
      setIsCreateBusinessExpanded(false);
      setSuccessMessage("New business profile created.");

      onNavigateHome(AccountType.Business);
    } catch (error) {
      console.error("Failed to create business profile.", error);
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
    isCreateBusinessExpanded,
    isCreatingBusinessProfile,
    onToggleCreateBusinessExpanded,
    onUpdateCreateBusinessProfileField,
    onCreateBusinessProfile,
  };
};
