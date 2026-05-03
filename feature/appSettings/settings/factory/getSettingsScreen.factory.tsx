import { createLocalAppearanceDatasource } from "@/feature/appSettings/appearance/data/dataSource/local.appearance.datasource.impl";
import { createAppearanceRepository } from "@/feature/appSettings/appearance/data/repository/appearance.repository.impl";
import { GetImportDataFlowFactory } from "@/feature/appSettings/dataTransfer/import/factory/getImportDataFlow.factory";
import { createGetAppearancePreferencesUseCase } from "@/feature/appSettings/appearance/useCase/getAppearancePreferences.useCase.impl";
import { createSaveAppearancePreferencesUseCase } from "@/feature/appSettings/appearance/useCase/saveAppearancePreferences.useCase.impl";
import { createLocalSettingsDatasource } from "@/feature/appSettings/settings/data/dataSource/local.settings.datasource.impl";
import { createSettingsRepository } from "@/feature/appSettings/settings/data/repository/settings.repository.impl";
import { SettingsScreen } from "@/feature/appSettings/settings/ui/SettingsScreen";
import { createChangePasswordUseCase } from "@/feature/appSettings/settings/useCase/changePassword.useCase.impl";
import { createGetSettingsBootstrapUseCase } from "@/feature/appSettings/settings/useCase/getSettingsBootstrap.useCase.impl";
import { createSubmitAppRatingUseCase } from "@/feature/appSettings/settings/useCase/submitAppRating.useCase.impl";
import { createSubmitBugReportUseCase } from "@/feature/appSettings/settings/useCase/submitBugReport.useCase.impl";
import { createUpdateBiometricLoginPreferenceUseCase } from "@/feature/appSettings/settings/useCase/updateBiometricLoginPreference.useCase.impl";
import { createUpdateTwoFactorAuthPreferenceUseCase } from "@/feature/appSettings/settings/useCase/updateTwoFactorAuthPreference.useCase.impl";
import { createExportSettingsDataUseCase } from "@/feature/appSettings/settings/useCase/exportSettingsData.useCase.impl";
import { createImportSettingsDataUseCase } from "@/feature/appSettings/settings/useCase/importSettingsData.useCase.impl";
import { createLocalAccountDatasource } from "@/feature/auth/accountSelection/data/dataSource/local.account.datasource.impl";
import { createAccountRepository } from "@/feature/auth/accountSelection/data/repository/account.repository.impl";
import { createGetAccountByRemoteIdUseCase } from "@/feature/auth/accountSelection/useCase/getAccountByRemoteId.useCase.impl";
import { createSaveAccountUseCase } from "@/feature/auth/accountSelection/useCase/saveAccount.useCase.impl";
import { useSettingsViewModel } from "@/feature/appSettings/settings/viewModel/settings.viewModel.impl";
import { useSyncRuntimeFactory } from "@/feature/sync/factory/useSyncRuntime.factory";
import { createRunManualSyncUseCase } from "@/feature/sync/useCase/runManualSync.useCase.impl";
import { SyncStatusCard } from "@/feature/sync/ui/components/SyncStatusCard";
import { useSyncStatusViewModel } from "@/feature/sync/viewModel/syncStatus.viewModel.impl";
import { createLocalAuthCredentialDatasource } from "@/feature/session/data/dataSource/local.authCredential.datasource.impl";
import { createAuthCredentialRepository } from "@/feature/session/data/repository/authCredential.repository.impl";
import { createPasswordHashService } from "@/shared/utils/auth/passwordHash.service";
import appDatabase from "@/shared/database/appDatabase";
import React from "react";
import { AccountTypeValue } from "@/feature/auth/accountSelection/types/accountSelection.types";
import { AccountType } from "@/feature/auth/accountSelection/types/accountSelection.types";
import {
  SETTINGS_OWNER_ADMIN_REQUIRED_MESSAGE,
  SETTINGS_PERMISSION_LOADING_MESSAGE,
} from "../constants/settings.constants";

type GetSettingsScreenFactoryProps = {
  activeUserRemoteId: string | null;
  activeAccountRemoteId: string | null;
  activeAccountType: AccountTypeValue;
  activeAccountDisplayName: string;
  canManageSensitiveSettings: boolean;
  isSensitiveSettingsAccessLoading: boolean;
  onBack: () => void;
};

export function GetSettingsScreenFactory({
  activeUserRemoteId,
  activeAccountRemoteId,
  activeAccountType,
  activeAccountDisplayName,
  canManageSensitiveSettings,
  isSensitiveSettingsAccessLoading,
  onBack,
}: GetSettingsScreenFactoryProps) {
  const sensitiveAccessGuard = React.useCallback((): string | null => {
    if (activeAccountType !== AccountType.Business) {
      return null;
    }

    if (isSensitiveSettingsAccessLoading) {
      return SETTINGS_PERMISSION_LOADING_MESSAGE;
    }

    if (!canManageSensitiveSettings) {
      return SETTINGS_OWNER_ADMIN_REQUIRED_MESSAGE;
    }

    return null;
  }, [
    activeAccountType,
    canManageSensitiveSettings,
    isSensitiveSettingsAccessLoading,
  ]);

  const appearanceDatasource = React.useMemo(
    () => createLocalAppearanceDatasource(appDatabase),
    [],
  );
  const appearanceRepository = React.useMemo(
    () => createAppearanceRepository(appearanceDatasource),
    [appearanceDatasource],
  );
  const getAppearancePreferencesUseCase = React.useMemo(
    () => createGetAppearancePreferencesUseCase(appearanceRepository),
    [appearanceRepository],
  );
  const saveAppearancePreferencesUseCase = React.useMemo(
    () => createSaveAppearancePreferencesUseCase(appearanceRepository),
    [appearanceRepository],
  );

  const settingsDatasource = React.useMemo(
    () => createLocalSettingsDatasource(appDatabase),
    [],
  );
  const settingsRepository = React.useMemo(
    () => createSettingsRepository(settingsDatasource),
    [settingsDatasource],
  );
  const accountDatasource = React.useMemo(
    () => createLocalAccountDatasource(appDatabase),
    [],
  );
  const accountRepository = React.useMemo(
    () => createAccountRepository(accountDatasource),
    [accountDatasource],
  );
  const getAccountByRemoteIdUseCase = React.useMemo(
    () => createGetAccountByRemoteIdUseCase(accountRepository),
    [accountRepository],
  );
  const saveAccountUseCase = React.useMemo(
    () => createSaveAccountUseCase(accountRepository),
    [accountRepository],
  );

  const authCredentialDatasource = React.useMemo(
    () => createLocalAuthCredentialDatasource(appDatabase),
    [],
  );
  const authCredentialRepository = React.useMemo(
    () => createAuthCredentialRepository(authCredentialDatasource),
    [authCredentialDatasource],
  );
  const passwordHashService = React.useMemo(() => createPasswordHashService(), []);

  const getSettingsBootstrapUseCase = React.useMemo(
    () =>
      createGetSettingsBootstrapUseCase(
        settingsRepository,
        authCredentialRepository,
      ),
    [authCredentialRepository, settingsRepository],
  );
  const updateBiometricLoginPreferenceUseCase = React.useMemo(
    () => createUpdateBiometricLoginPreferenceUseCase(settingsRepository),
    [settingsRepository],
  );
  const updateTwoFactorAuthPreferenceUseCase = React.useMemo(
    () => createUpdateTwoFactorAuthPreferenceUseCase(settingsRepository),
    [settingsRepository],
  );
  const submitBugReportUseCase = React.useMemo(
    () => createSubmitBugReportUseCase(settingsRepository),
    [settingsRepository],
  );
  const submitAppRatingUseCase = React.useMemo(
    () => createSubmitAppRatingUseCase(settingsRepository),
    [settingsRepository],
  );
  const exportSettingsDataUseCase = React.useMemo(
    () =>
      createExportSettingsDataUseCase({
        settingsRepository,
        ensureSensitiveAccess: sensitiveAccessGuard,
      }),
    [sensitiveAccessGuard, settingsRepository],
  );
  const importSettingsDataUseCase = React.useMemo(
    () => createImportSettingsDataUseCase(settingsRepository),
    [settingsRepository],
  );
  const changePasswordUseCase = React.useMemo(
    () =>
      createChangePasswordUseCase(
        authCredentialRepository,
        passwordHashService,
      ),
    [authCredentialRepository, passwordHashService],
  );
  const syncRuntime = useSyncRuntimeFactory({
    database: appDatabase,
  });
  const runManualSyncUseCase = React.useMemo(() => {
    if (!syncRuntime.runtime) {
      return null;
    }

    return createRunManualSyncUseCase({
      ensureDatabaseReady: syncRuntime.ensureDatabaseReady,
      getAccountByRemoteIdUseCase: syncRuntime.getAccountByRemoteIdUseCase,
      getAccessToken: () => syncRuntime.authTokenStore.getAccessToken(),
      getDeviceId: () => syncRuntime.deviceIdStore.getDeviceId(),
      runSyncWorkflowUseCase: syncRuntime.runtime.runSyncWorkflowUseCase,
      schemaVersion: syncRuntime.schemaVersion,
    });
  }, [syncRuntime]);

  const viewModel = useSettingsViewModel({
    activeUserRemoteId,
    activeAccountRemoteId,
    activeAccountType,
    activeAccountDisplayName,
    canManageSensitiveSettings,
    isSensitiveSettingsAccessLoading,
    getAppearancePreferencesUseCase,
    saveAppearancePreferencesUseCase,
    getSettingsBootstrapUseCase,
    updateBiometricLoginPreferenceUseCase,
    updateTwoFactorAuthPreferenceUseCase,
    submitBugReportUseCase,
    submitAppRatingUseCase,
    exportSettingsDataUseCase,
    importSettingsDataUseCase,
    changePasswordUseCase,
    getAccountByRemoteIdUseCase,
    saveAccountUseCase,
  });
  const syncStatusViewModel = useSyncStatusViewModel({
    activeUserRemoteId,
    activeAccountRemoteId,
    runtimeError: syncRuntime.runtimeError,
    getSyncFeatureFlagUseCase:
      syncRuntime.runtime?.getSyncFeatureFlagUseCase ?? null,
    updateSyncFeatureFlagUseCase:
      syncRuntime.runtime?.updateSyncFeatureFlagUseCase ?? null,
    getSyncStatusUseCase: syncRuntime.runtime?.getSyncStatusUseCase ?? null,
    runManualSyncUseCase,
    getAccountByRemoteIdUseCase: syncRuntime.getAccountByRemoteIdUseCase,
    getDeviceId: () => syncRuntime.deviceIdStore.getDeviceId(),
    schemaVersion: syncRuntime.schemaVersion,
  });

  return (
    <SettingsScreen
      viewModel={viewModel}
      onBack={onBack}
      syncStatusPanel={<SyncStatusCard viewModel={syncStatusViewModel} />}
      importDataFlow={
        <GetImportDataFlowFactory
          visible={viewModel.activeModal === "import_data"}
          activeUserRemoteId={activeUserRemoteId ?? ""}
          activeAccountRemoteId={activeAccountRemoteId ?? ""}
          activeAccountType={activeAccountType}
          activeAccountDisplayName={activeAccountDisplayName}
          canManageSensitiveSettings={canManageSensitiveSettings}
          isSensitiveSettingsAccessLoading={isSensitiveSettingsAccessLoading}
          onClose={viewModel.onCloseModal}
        />
      }
    />
  );
}
