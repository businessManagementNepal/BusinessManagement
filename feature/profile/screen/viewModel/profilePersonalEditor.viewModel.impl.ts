import { useCallback, useEffect, useState } from "react";
import {
  EditablePersonalProfile,
} from "@/feature/profile/screen/types/profileScreen.types";
import {
  ProfilePersonalEditorViewModel,
  UseProfilePersonalEditorViewModelParams,
} from "./profilePersonalEditor.viewModel";

export const useProfilePersonalEditorViewModel = (
  params: UseProfilePersonalEditorViewModelParams,
): ProfilePersonalEditorViewModel => {
  const {
    activeUserRemoteId,
    data,
    saveAuthUserUseCase,
    onUpdateData,
    setLoadError,
    setSuccessMessage,
  } = params;

  const [personalProfileForm, setPersonalProfileForm] =
    useState<EditablePersonalProfile>(data.personalProfile);
  const [basePersonalProfile, setBasePersonalProfile] =
    useState<EditablePersonalProfile>(data.personalProfile);
  const [isPersonalEditing, setIsPersonalEditing] = useState(false);
  const [isSavingPersonalProfile, setIsSavingPersonalProfile] = useState(false);

  useEffect(() => {
    setPersonalProfileForm(data.personalProfile);
    setBasePersonalProfile(data.personalProfile);
    setIsPersonalEditing(false);
  }, [data.personalProfile]);

  const onStartPersonalEdit = useCallback(() => {
    setIsPersonalEditing(true);
    setLoadError(null);
    setSuccessMessage(null);
  }, [setLoadError, setSuccessMessage]);

  const onCancelPersonalEdit = useCallback(() => {
    setPersonalProfileForm(basePersonalProfile);
    setIsPersonalEditing(false);
    setLoadError(null);
  }, [basePersonalProfile, setLoadError]);

  const onUpdatePersonalProfileField = useCallback(
    (field: keyof EditablePersonalProfile, value: string) => {
      setPersonalProfileForm((previousValue) => ({
        ...previousValue,
        [field]: value,
      }));
      setLoadError(null);
      setSuccessMessage(null);
    },
    [setLoadError, setSuccessMessage],
  );

  const onSavePersonalProfile = useCallback(async (): Promise<void> => {
    setLoadError(null);
    setSuccessMessage(null);

    if (!activeUserRemoteId) {
      setLoadError("Active user session not found.");
      return;
    }

    if (!data.loadedAuthUser) {
      setLoadError("Unable to resolve user profile. Please re-login.");
      return;
    }

    setIsSavingPersonalProfile(true);

    try {
      const saveResult = await saveAuthUserUseCase.execute({
        remoteId: activeUserRemoteId,
        fullName: personalProfileForm.fullName,
        email: personalProfileForm.email.trim() || null,
        phone: personalProfileForm.phone.trim() || null,
        authProvider: data.loadedAuthUser.authProvider,
        profileImageUrl: personalProfileForm.profileImageUrl.trim() || null,
        preferredLanguage: data.loadedAuthUser.preferredLanguage,
        isEmailVerified: data.loadedAuthUser.isEmailVerified,
        isPhoneVerified: data.loadedAuthUser.isPhoneVerified,
      });

      if (!saveResult.success) {
        setLoadError(saveResult.error.message);
        return;
      }

      const normalizedProfile: EditablePersonalProfile = {
        fullName: saveResult.value.fullName,
        phone: saveResult.value.phone ?? "",
        email: saveResult.value.email ?? "",
        profileImageUrl: saveResult.value.profileImageUrl ?? "",
      };

      setPersonalProfileForm(normalizedProfile);
      setBasePersonalProfile(normalizedProfile);
      setIsPersonalEditing(false);
      onUpdateData((previousData) => ({
        ...previousData,
        profileName: saveResult.value.fullName.trim() || previousData.profileName,
        loadedAuthUser: saveResult.value,
        personalProfile: normalizedProfile,
      }));
      setSuccessMessage("Personal profile updated.");
    } catch {
      setLoadError("Unable to save personal profile right now.");
    } finally {
      setIsSavingPersonalProfile(false);
    }
  }, [
    activeUserRemoteId,
    data.loadedAuthUser,
    onUpdateData,
    personalProfileForm,
    saveAuthUserUseCase,
    setLoadError,
    setSuccessMessage,
  ]);

  return {
    personalProfileForm,
    isPersonalEditing,
    isSavingPersonalProfile,
    onStartPersonalEdit,
    onCancelPersonalEdit,
    onUpdatePersonalProfileField,
    onSavePersonalProfile,
  };
};
