import { AccountType } from "@/feature/auth/accountSelection/types/accountSelection.types";
import {
    buildInitials,
    getAccountRoleLabel,
    getAccountTypeLabel,
} from "@/feature/dashboard/shared/utils/dashboardNavigation.util";
import { ProfileScreenData } from "@/feature/profile/screen/types/profileScreen.types";
import { useCallback, useMemo, useState } from "react";
import { useProfileAccountSwitchViewModel } from "./profileAccountSwitch.viewModel.impl";
import { useProfileBusinessCreatorViewModel } from "./profileBusinessCreator.viewModel.impl";
import { useProfileBusinessEditorViewModel } from "./profileBusinessEditor.viewModel.impl";
import { useProfileLoaderViewModel } from "./profileLoader.viewModel.impl";
import { useProfilePersonalEditorViewModel } from "./profilePersonalEditor.viewModel.impl";
import { createInitialProfileScreenData } from "./profileScreen.shared";
import {
    PROFILE_BUSINESS_TYPE_OPTIONS,
    ProfileScreenViewModel,
    UseProfileScreenViewModelParams,
} from "./profileScreen.viewModel";

const PROFILE_EDIT_PERMISSION_CODE = "profile.edit";

export const useProfileScreenViewModel = (
  params: UseProfileScreenViewModelParams,
): ProfileScreenViewModel => {
  const {
    dependencies,
    activeUserRemoteId,
    activeAccountRemoteId,
    onNavigateHome,
    onBack,
  } = params;

  const [data, setData] = useState<ProfileScreenData>(
    createInitialProfileScreenData(),
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const onUpdateData = useCallback(
    (updater: (previousData: ProfileScreenData) => ProfileScreenData) => {
      setData((previousData) => updater(previousData));
    },
    [],
  );

  const onLoaded = useCallback((nextData: ProfileScreenData) => {
    setData(nextData);
    setSuccessMessage(null);
  }, []);

  const loader = useProfileLoaderViewModel({
    activeUserRemoteId,
    activeAccountRemoteId,
    getAccessibleAccountsByUserRemoteIdUseCase:
      dependencies.getAccessibleAccountsByUserRemoteIdUseCase,
    getAuthUserByRemoteIdUseCase: dependencies.getAuthUserByRemoteIdUseCase,
    getBusinessProfileByAccountRemoteIdUseCase:
      dependencies.getBusinessProfileByAccountRemoteIdUseCase,
    getUserManagementSnapshotUseCase:
      dependencies.getUserManagementSnapshotUseCase,
    onLoaded,
  });

  const clearSuccessMessage = useCallback(() => {
    setSuccessMessage(null);
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

  const initials = useMemo(
    () => buildInitials(data.profileName),
    [data.profileName],
  );

  const roleLabel = useMemo(
    () =>
      data.activeAccountRoleLabel ||
      getAccountRoleLabel(data.activeAccountType),
    [data.activeAccountRoleLabel, data.activeAccountType],
  );

  const activeAccountTypeLabel = useMemo(
    () => getAccountTypeLabel(data.activeAccountType),
    [data.activeAccountType],
  );
  const canEditBusinessProfile = useMemo(
    () => data.grantedPermissionCodes.includes(PROFILE_EDIT_PERMISSION_CODE),
    [data.grantedPermissionCodes],
  );
  const isActiveBusinessStaff = useMemo(
    () =>
      data.activeAccountType === AccountType.Business &&
      !data.isActiveAccountOwner,
    [data.activeAccountType, data.isActiveAccountOwner],
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
      activeBusinessEstablishedYear: data.activeBusinessEstablishedYear,
      isActiveBusinessStaff,
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
      canEditBusinessProfile,
      isBusinessEditing: businessEditor.isBusinessEditing,
      isSavingBusinessProfile: businessEditor.isSavingBusinessProfile,
      onStartBusinessEdit: businessEditor.onStartBusinessEdit,
      onCancelBusinessEdit: businessEditor.onCancelBusinessEdit,
      onUpdateBusinessProfileField: businessEditor.onUpdateBusinessProfileField,
      onSaveBusinessProfile: businessEditor.onSaveBusinessProfile,

      createBusinessProfileForm: businessCreator.createBusinessProfileForm,
      createBusinessProfileFieldErrors:
        businessCreator.createBusinessProfileFieldErrors,
      isCreateBusinessExpanded: businessCreator.isCreateBusinessExpanded,
      isCreatingBusinessProfile: businessCreator.isCreatingBusinessProfile,
      onToggleCreateBusinessExpanded:
        businessCreator.onToggleCreateBusinessExpanded,
      onUpdateCreateBusinessProfileField:
        businessCreator.onUpdateCreateBusinessProfileField,
      onCreateBusinessProfile: businessCreator.onCreateBusinessProfile,

      businessTypeOptions: PROFILE_BUSINESS_TYPE_OPTIONS,
      onBack,
    }),
    [
      activeAccountTypeLabel,
      accountSwitch.isSwitchExpanded,
      accountSwitch.onSelectAccount,
      accountSwitch.onToggleSwitchExpanded,
      businessCreator.createBusinessProfileForm,
      businessCreator.createBusinessProfileFieldErrors,
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
      canEditBusinessProfile,
      data.accountOptions,
      data.activeAccountDisplayName,
      data.activeAccountRemoteId,
      data.activeBusinessEstablishedYear,
      data.profileName,
      initials,
      isActiveBusinessStaff,
      loader.isLoading,
      loader.loadError,
      onBack,
      personalEditor.isPersonalEditing,
      personalEditor.isSavingPersonalProfile,
      personalEditor.onCancelPersonalEdit,
      personalEditor.onSavePersonalProfile,
      personalEditor.onStartPersonalEdit,
      personalEditor.onUpdatePersonalProfileField,
      personalEditor.personalProfileForm,
      roleLabel,
      successMessage,
    ],
  );
};
