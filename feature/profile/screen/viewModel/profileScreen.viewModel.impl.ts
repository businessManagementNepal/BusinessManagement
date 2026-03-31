import { useCallback, useMemo, useState } from "react";
import {
  buildInitials,
  getAccountRoleLabel,
  getAccountTypeLabel,
} from "@/feature/dashboard/shared/utils/dashboardNavigation.util";
import {
  ProfileScreenViewModel,
  PROFILE_BUSINESS_TYPE_OPTIONS,
  UseProfileScreenViewModelParams,
} from "./profileScreen.viewModel";
import {
  createInitialProfileScreenData,
} from "./profileScreen.shared";
import { useProfileBusinessCreatorViewModel } from "./profileBusinessCreator.viewModel.impl";
import { useProfileBusinessEditorViewModel } from "./profileBusinessEditor.viewModel.impl";
import { useProfilePersonalEditorViewModel } from "./profilePersonalEditor.viewModel.impl";
import { useProfileAccountSwitchViewModel } from "./profileAccountSwitch.viewModel.impl";
import { useProfileLoaderViewModel } from "./profileLoader.viewModel.impl";
import { ProfileScreenData } from "@/feature/profile/screen/types/profileScreen.types";

export const useProfileScreenViewModel = (
  params: UseProfileScreenViewModelParams,
): ProfileScreenViewModel => {
  const {
    dependencies,
    activeUserRemoteId,
    activeAccountRemoteId,
    onNavigateHome,
    onOpenBusinessDetails,
    onLogout,
    onBack,
  } = params;

  const [data, setData] = useState<ProfileScreenData>(
    createInitialProfileScreenData(),
  );
  const [successMessage, setSuccessMessage] = useState<string>();

  const onUpdateData = useCallback(
    (updater: (previousData: ProfileScreenData) => ProfileScreenData) => {
      setData((previousData) => updater(previousData));
    },
    [],
  );

  const onLoaded = useCallback((nextData: ProfileScreenData) => {
    setData(nextData);
    setSuccessMessage(undefined);
  }, []);

  const loader = useProfileLoaderViewModel({
    activeUserRemoteId,
    activeAccountRemoteId,
    getAccountsByOwnerUserRemoteIdUseCase:
      dependencies.getAccountsByOwnerUserRemoteIdUseCase,
    getAuthUserByRemoteIdUseCase: dependencies.getAuthUserByRemoteIdUseCase,
    getBusinessProfileByAccountRemoteIdUseCase:
      dependencies.getBusinessProfileByAccountRemoteIdUseCase,
    onLoaded,
  });

  const clearSuccessMessage = useCallback(() => {
    setSuccessMessage(undefined);
  }, []);

  const accountSwitch = useProfileAccountSwitchViewModel({
    setActiveAccountSession: dependencies.setActiveAccountSession,
    data,
    onUpdateData,
    onNavigateHome,
    setLoadError: loader.setLoadError,
    clearSuccessMessage,
  });

  const personalEditor = useProfilePersonalEditorViewModel({
    activeUserRemoteId,
    data,
    saveAuthUserUseCase: dependencies.saveAuthUserUseCase,
    onUpdateData,
    setLoadError: loader.setLoadError,
    setSuccessMessage,
  });

  const businessEditor = useProfileBusinessEditorViewModel({
    activeUserRemoteId,
    data,
    saveAccountUseCase: dependencies.saveAccountUseCase,
    saveBusinessProfileUseCase: dependencies.saveBusinessProfileUseCase,
    onUpdateData,
    setLoadError: loader.setLoadError,
    setSuccessMessage,
  });

  const businessCreator = useProfileBusinessCreatorViewModel({
    setActiveAccountSession: dependencies.setActiveAccountSession,
    activeUserRemoteId,
    createBusinessWorkspaceUseCase: dependencies.createBusinessWorkspaceUseCase,
    onNavigateHome,
    onUpdateData,
    setLoadError: loader.setLoadError,
    setSuccessMessage,
  });

  const initials = useMemo(() => buildInitials(data.profileName), [data.profileName]);

  const roleLabel = useMemo(
    () => getAccountRoleLabel(data.activeAccountType),
    [data.activeAccountType],
  );

  const activeAccountTypeLabel = useMemo(
    () => getAccountTypeLabel(data.activeAccountType),
    [data.activeAccountType],
  );

  return useMemo<ProfileScreenViewModel>(
    () => ({
      isLoading: loader.isLoading,
      loadError: loader.loadError,
      successMessage,
      profileName: data.profileName,
      roleLabel,
      initials,
      activeAccountDisplayName: data.activeAccountDisplayName,
      activeAccountTypeLabel,
      activeAccountRemoteId: data.activeAccountRemoteId,
      accountOptions: data.accountOptions,
      isSwitchExpanded: accountSwitch.isSwitchExpanded,
      onToggleSwitchExpanded: accountSwitch.onToggleSwitchExpanded,
      onSelectAccount: accountSwitch.onSelectAccount,

      personalProfileForm: personalEditor.personalProfileForm,
      isPersonalEditing: personalEditor.isPersonalEditing,
      isSavingPersonalProfile: personalEditor.isSavingPersonalProfile,
      onStartPersonalEdit: personalEditor.onStartPersonalEdit,
      onCancelPersonalEdit: personalEditor.onCancelPersonalEdit,
      onUpdatePersonalProfileField: personalEditor.onUpdatePersonalProfileField,
      onSavePersonalProfile: personalEditor.onSavePersonalProfile,

      activeBusinessProfileForm: businessEditor.activeBusinessProfileForm,
      hasActiveBusinessProfile: businessEditor.hasActiveBusinessProfile,
      isBusinessEditing: businessEditor.isBusinessEditing,
      isSavingBusinessProfile: businessEditor.isSavingBusinessProfile,
      onStartBusinessEdit: businessEditor.onStartBusinessEdit,
      onCancelBusinessEdit: businessEditor.onCancelBusinessEdit,
      onUpdateBusinessProfileField: businessEditor.onUpdateBusinessProfileField,
      onSaveBusinessProfile: businessEditor.onSaveBusinessProfile,

      createBusinessProfileForm: businessCreator.createBusinessProfileForm,
      isCreateBusinessExpanded: businessCreator.isCreateBusinessExpanded,
      isCreatingBusinessProfile: businessCreator.isCreatingBusinessProfile,
      onToggleCreateBusinessExpanded:
        businessCreator.onToggleCreateBusinessExpanded,
      onUpdateCreateBusinessProfileField:
        businessCreator.onUpdateCreateBusinessProfileField,
      onCreateBusinessProfile: businessCreator.onCreateBusinessProfile,

      businessTypeOptions: PROFILE_BUSINESS_TYPE_OPTIONS,
      onOpenBusinessDetails,
      onLogout,
      onBack,
    }),
    [
      activeAccountTypeLabel,
      accountSwitch.isSwitchExpanded,
      accountSwitch.onSelectAccount,
      accountSwitch.onToggleSwitchExpanded,
      businessCreator.createBusinessProfileForm,
      businessCreator.isCreateBusinessExpanded,
      businessCreator.isCreatingBusinessProfile,
      businessCreator.onCreateBusinessProfile,
      businessCreator.onToggleCreateBusinessExpanded,
      businessCreator.onUpdateCreateBusinessProfileField,
      businessEditor.activeBusinessProfileForm,
      businessEditor.hasActiveBusinessProfile,
      businessEditor.isBusinessEditing,
      businessEditor.isSavingBusinessProfile,
      businessEditor.onCancelBusinessEdit,
      businessEditor.onSaveBusinessProfile,
      businessEditor.onStartBusinessEdit,
      businessEditor.onUpdateBusinessProfileField,
      data.accountOptions,
      data.activeAccountDisplayName,
      data.activeAccountRemoteId,
      data.profileName,
      initials,
      loader.isLoading,
      loader.loadError,
      onBack,
      onLogout,
      personalEditor.isPersonalEditing,
      personalEditor.isSavingPersonalProfile,
      personalEditor.onCancelPersonalEdit,
      personalEditor.onSavePersonalProfile,
      personalEditor.onStartPersonalEdit,
      personalEditor.onUpdatePersonalProfileField,
      personalEditor.personalProfileForm,
      roleLabel,
      successMessage,
      onOpenBusinessDetails,
    ],
  );
};
