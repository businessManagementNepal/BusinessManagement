import { useCallback, useEffect, useState } from "react";
import {
  AccountType,
} from "@/feature/setting/accounts/accountSelection/types/accountSelection.types";
import {
  EditableBusinessProfile,
} from "@/feature/profile/screen/types/profileScreen.types";
import {
  ProfileBusinessEditorViewModel,
  UseProfileBusinessEditorViewModelParams,
} from "./profileBusinessEditor.viewModel";

const buildAccountLocation = (
  city: string,
  stateOrDistrict: string,
): string | null => {
  const cityValue = city.trim();
  const stateValue = stateOrDistrict.trim();

  if (!cityValue && !stateValue) {
    return null;
  }

  if (cityValue && stateValue) {
    return `${cityValue}, ${stateValue}`;
  }

  return cityValue || stateValue;
};

export const useProfileBusinessEditorViewModel = (
  params: UseProfileBusinessEditorViewModelParams,
): ProfileBusinessEditorViewModel => {
  const {
    activeUserRemoteId,
    data,
    saveAccountUseCase,
    saveBusinessProfileUseCase,
    onUpdateData,
    setLoadError,
    setSuccessMessage,
  } = params;

  const [activeBusinessProfileForm, setActiveBusinessProfileForm] =
    useState<EditableBusinessProfile>(data.activeBusinessProfile);
  const [baseBusinessProfileForm, setBaseBusinessProfileForm] =
    useState<EditableBusinessProfile>(data.activeBusinessProfile);
  const [isBusinessEditing, setIsBusinessEditing] = useState(false);
  const [isSavingBusinessProfile, setIsSavingBusinessProfile] = useState(false);

  useEffect(() => {
    setActiveBusinessProfileForm(data.activeBusinessProfile);
    setBaseBusinessProfileForm(data.activeBusinessProfile);
    setIsBusinessEditing(false);
  }, [data.activeBusinessProfile]);

  const onStartBusinessEdit = useCallback(() => {
    if (data.activeAccountType !== AccountType.Business) {
      return;
    }

    setIsBusinessEditing(true);
    setLoadError(undefined);
    setSuccessMessage(undefined);
  }, [data.activeAccountType, setLoadError, setSuccessMessage]);

  const onCancelBusinessEdit = useCallback(() => {
    setActiveBusinessProfileForm(baseBusinessProfileForm);
    setIsBusinessEditing(false);
    setLoadError(undefined);
  }, [baseBusinessProfileForm, setLoadError]);

  const onUpdateBusinessProfileField = useCallback(
    (field: keyof EditableBusinessProfile, value: string) => {
      setActiveBusinessProfileForm((previousValue) => ({
        ...previousValue,
        [field]: value,
      }));
      setLoadError(undefined);
      setSuccessMessage(undefined);
    },
    [setLoadError, setSuccessMessage],
  );

  const onSaveBusinessProfile = useCallback(async (): Promise<void> => {
    setLoadError(undefined);
    setSuccessMessage(undefined);

    if (!activeUserRemoteId || !data.activeAccountRemoteId) {
      setLoadError("Active account session not found.");
      return;
    }

    if (data.activeAccountType !== AccountType.Business) {
      setLoadError("Business profile can only be updated for business accounts.");
      return;
    }

    const activeAccountOption = data.accountOptions.find(
      (account) => account.remoteId === data.activeAccountRemoteId,
    );

    if (!activeAccountOption) {
      setLoadError("Active account not found.");
      return;
    }

    setIsSavingBusinessProfile(true);

    try {
      const accountLocation = buildAccountLocation(
        activeBusinessProfileForm.city,
        activeBusinessProfileForm.stateOrDistrict,
      );

      const saveAccountResult = await saveAccountUseCase.execute({
        remoteId: data.activeAccountRemoteId,
        ownerUserRemoteId: activeUserRemoteId,
        accountType: AccountType.Business,
        businessType: activeBusinessProfileForm.businessType,
        displayName: activeBusinessProfileForm.legalBusinessName,
        currencyCode: activeBusinessProfileForm.currencyCode,
        cityOrLocation: accountLocation,
        countryCode: activeBusinessProfileForm.country,
        isActive: true,
        isDefault: activeAccountOption.isDefault,
      });

      if (!saveAccountResult.success) {
        setLoadError(saveAccountResult.error.message);
        return;
      }

      const saveBusinessProfileResult = await saveBusinessProfileUseCase.execute({
        accountRemoteId: data.activeAccountRemoteId,
        ownerUserRemoteId: activeUserRemoteId,
        legalBusinessName: activeBusinessProfileForm.legalBusinessName,
        businessType: activeBusinessProfileForm.businessType,
        businessLogoUrl: activeBusinessProfileForm.businessLogoUrl.trim() || null,
        businessPhone: activeBusinessProfileForm.businessPhone,
        businessEmail: activeBusinessProfileForm.businessEmail,
        registeredAddress: activeBusinessProfileForm.registeredAddress,
        currencyCode: activeBusinessProfileForm.currencyCode,
        country: activeBusinessProfileForm.country,
        city: activeBusinessProfileForm.city,
        stateOrDistrict: activeBusinessProfileForm.stateOrDistrict,
        taxRegistrationId: activeBusinessProfileForm.taxRegistrationId,
        isActive: true,
      });

      if (!saveBusinessProfileResult.success) {
        setLoadError(saveBusinessProfileResult.error.message);
        return;
      }

      const normalizedBusinessForm: EditableBusinessProfile = {
        legalBusinessName: saveBusinessProfileResult.value.legalBusinessName,
        businessType: saveBusinessProfileResult.value.businessType,
        businessLogoUrl: saveBusinessProfileResult.value.businessLogoUrl ?? "",
        businessPhone: saveBusinessProfileResult.value.businessPhone,
        businessEmail: saveBusinessProfileResult.value.businessEmail,
        registeredAddress: saveBusinessProfileResult.value.registeredAddress,
        currencyCode: saveBusinessProfileResult.value.currencyCode,
        country: saveBusinessProfileResult.value.country,
        city: saveBusinessProfileResult.value.city,
        stateOrDistrict: saveBusinessProfileResult.value.stateOrDistrict,
        taxRegistrationId: saveBusinessProfileResult.value.taxRegistrationId,
      };

      setActiveBusinessProfileForm(normalizedBusinessForm);
      setBaseBusinessProfileForm(normalizedBusinessForm);
      setIsBusinessEditing(false);
      onUpdateData((previousData) => ({
        ...previousData,
        activeAccountDisplayName: saveAccountResult.value.displayName,
        activeBusinessProfile: normalizedBusinessForm,
        hasActiveBusinessProfile: true,
        accountOptions: previousData.accountOptions.map((accountOption) =>
          accountOption.remoteId === data.activeAccountRemoteId
            ? {
                ...accountOption,
                displayName: saveAccountResult.value.displayName,
                businessType: saveAccountResult.value.businessType,
                cityOrLocation: saveAccountResult.value.cityOrLocation,
                countryCode: saveAccountResult.value.countryCode,
                currencyCode: saveAccountResult.value.currencyCode,
              }
            : accountOption,
        ),
      }));
      setSuccessMessage("Business profile updated.");
    } catch (error) {
      console.error("Failed to save business profile.", error);
      setLoadError("Unable to save business profile right now.");
    } finally {
      setIsSavingBusinessProfile(false);
    }
  }, [
    activeBusinessProfileForm,
    activeUserRemoteId,
    data.accountOptions,
    data.activeAccountRemoteId,
    data.activeAccountType,
    onUpdateData,
    saveAccountUseCase,
    saveBusinessProfileUseCase,
    setLoadError,
    setSuccessMessage,
  ]);

  return {
    activeBusinessProfileForm,
    hasActiveBusinessProfile: data.hasActiveBusinessProfile,
    isBusinessEditing,
    isSavingBusinessProfile,
    onStartBusinessEdit,
    onCancelBusinessEdit,
    onUpdateBusinessProfileField,
    onSaveBusinessProfile,
  };
};
