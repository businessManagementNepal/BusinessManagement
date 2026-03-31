import { useCallback, useMemo, useState } from "react";
import {
  buildInitials,
  getAccountRoleLabel,
  getAccountTypeLabel,
} from "@/feature/dashboard/shared/utils/dashboardNavigation.util";
import { createLocalAccountDatasource } from "@/feature/setting/accounts/accountSelection/data/dataSource/local.account.datasource.impl";
import { createAccountRepository } from "@/feature/setting/accounts/accountSelection/data/repository/account.repository.impl";
import { createGetAccountsByOwnerUserRemoteIdUseCase } from "@/feature/setting/accounts/accountSelection/useCase/getAccountsByOwnerUserRemoteId.useCase.impl";
import { createSaveAccountUseCase } from "@/feature/setting/accounts/accountSelection/useCase/saveAccount.useCase.impl";
import { createLocalAuthUserDatasource } from "@/feature/session/data/dataSource/local.authUser.datasource.impl";
import { createAuthUserRepository } from "@/feature/session/data/repository/authUser.repository.impl";
import { createGetAuthUserByRemoteIdUseCase } from "@/feature/session/useCase/getAuthUserByRemoteId.useCase.impl";
import { createSaveAuthUserUseCase } from "@/feature/session/useCase/saveAuthUser.useCase.impl";
import { createLocalBusinessProfileDatasource } from "@/feature/profile/business/data/dataSource/local.businessProfile.datasource.impl";
import { createBusinessProfileRepository } from "@/feature/profile/business/data/repository/businessProfile.repository.impl";
import { createGetBusinessProfileByAccountRemoteIdUseCase } from "@/feature/profile/business/useCase/getBusinessProfileByAccountRemoteId.useCase.impl";
import { createSaveBusinessProfileUseCase } from "@/feature/profile/business/useCase/saveBusinessProfile.useCase.impl";
import { createCreateBusinessWorkspaceUseCase } from "@/feature/profile/business/useCase/createBusinessWorkspace.useCase.impl";
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
    database,
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

  const accountDatasource = useMemo(
    () => createLocalAccountDatasource(database),
    [database],
  );

  const accountRepository = useMemo(
    () => createAccountRepository(accountDatasource),
    [accountDatasource],
  );

  const getAccountsByOwnerUserRemoteIdUseCase = useMemo(
    () => createGetAccountsByOwnerUserRemoteIdUseCase(accountRepository),
    [accountRepository],
  );

  const saveAccountUseCase = useMemo(
    () => createSaveAccountUseCase(accountRepository),
    [accountRepository],
  );

  const authUserDatasource = useMemo(
    () => createLocalAuthUserDatasource(database),
    [database],
  );

  const authUserRepository = useMemo(
    () => createAuthUserRepository(authUserDatasource),
    [authUserDatasource],
  );

  const getAuthUserByRemoteIdUseCase = useMemo(
    () => createGetAuthUserByRemoteIdUseCase(authUserRepository),
    [authUserRepository],
  );

  const saveAuthUserUseCase = useMemo(
    () => createSaveAuthUserUseCase(authUserRepository),
    [authUserRepository],
  );

  const businessProfileDatasource = useMemo(
    () => createLocalBusinessProfileDatasource(database),
    [database],
  );

  const businessProfileRepository = useMemo(
    () => createBusinessProfileRepository(businessProfileDatasource),
    [businessProfileDatasource],
  );

  const getBusinessProfileByAccountRemoteIdUseCase = useMemo(
    () =>
      createGetBusinessProfileByAccountRemoteIdUseCase(businessProfileRepository),
    [businessProfileRepository],
  );

  const saveBusinessProfileUseCase = useMemo(
    () => createSaveBusinessProfileUseCase(businessProfileRepository),
    [businessProfileRepository],
  );

  const createBusinessWorkspaceUseCase = useMemo(
    () =>
      createCreateBusinessWorkspaceUseCase({
        saveAccountUseCase,
        saveBusinessProfileUseCase,
      }),
    [saveAccountUseCase, saveBusinessProfileUseCase],
  );

  const loader = useProfileLoaderViewModel({
    activeUserRemoteId,
    activeAccountRemoteId,
    getAccountsByOwnerUserRemoteIdUseCase,
    getAuthUserByRemoteIdUseCase,
    getBusinessProfileByAccountRemoteIdUseCase,
    onLoaded,
  });

  const clearSuccessMessage = useCallback(() => {
    setSuccessMessage(undefined);
  }, []);

  const accountSwitch = useProfileAccountSwitchViewModel({
    database,
    data,
    onUpdateData,
    onNavigateHome,
    setLoadError: loader.setLoadError,
    clearSuccessMessage,
  });

  const personalEditor = useProfilePersonalEditorViewModel({
    activeUserRemoteId,
    data,
    saveAuthUserUseCase,
    onUpdateData,
    setLoadError: loader.setLoadError,
    setSuccessMessage,
  });

  const businessEditor = useProfileBusinessEditorViewModel({
    activeUserRemoteId,
    data,
    saveAccountUseCase,
    saveBusinessProfileUseCase,
    onUpdateData,
    setLoadError: loader.setLoadError,
    setSuccessMessage,
  });

  const businessCreator = useProfileBusinessCreatorViewModel({
    database,
    activeUserRemoteId,
    createBusinessWorkspaceUseCase,
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
